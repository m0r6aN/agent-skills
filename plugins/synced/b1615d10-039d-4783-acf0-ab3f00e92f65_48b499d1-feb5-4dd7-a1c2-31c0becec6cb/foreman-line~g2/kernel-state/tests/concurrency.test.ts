/**
 * C5 concurrent open (CONC-01..05): busy-budget timeout, reader snapshot
 * isolation, two-process single-apply migration, backup consistency under
 * concurrent write attempts, and the one-write-handle rule.
 */
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'
import { backupTo, verifyBackup } from '../src/backup.js'
import { fixedClock } from '../src/clock.js'
import { StorageError } from '../src/errors.js'
import { closeStorage, type OpenStorageConfig, openStorage } from '../src/open.js'
import { insertEvent, insertGoal, queryEvents } from '../src/rows.js'
import { withTransaction } from '../src/transactions.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const PKG_ROOT = resolve(HERE, '..')
const T0 = 1_700_000_000_000_000

interface ConcRecord {
  id: string
  input: { scenario: string; busyTimeoutMicros?: number }
  expectedCode?: string
  expectedOutcome?: string
}

const CONC = JSON.parse(
  readFileSync(join(HERE, 'fixtures', 'hostile', 'concurrency.json'), 'utf8'),
) as { records: ConcRecord[] }

function record(id: string): ConcRecord {
  const found = CONC.records.find((candidate) => candidate.id === id)
  assert.ok(found, `${id} missing from concurrency.json`)
  return found
}

function configFor(
  root: string,
  options: { busyTimeoutMicros?: number; backupRoot?: string } = {},
): OpenStorageConfig {
  return {
    storageRoot: root,
    databaseFileName: 'state.db',
    createIfMissing: true,
    clock: fixedClock(T0),
    busyTimeoutMicros: options.busyTimeoutMicros,
    backupPolicy: { root: options.backupRoot ?? root, retentionDescriptor: null },
  }
}

function seed(storage: ReturnType<typeof openStorage>): void {
  insertGoal(storage, { goalId: 'goal-1', revision: 0, status: 'active', updatedAtMicros: T0 })
}

// A racer: opens storage on a shared root and prints the applied ledger. A
// rendezvous at the pre-apply ledger read (inside the driver seam) guarantees
// BOTH racers finish readAppliedMigrations before either can commit, making
// the under-lock single-apply re-check load-bearing: with the re-check
// disabled, the loser attempts the migration and fails on the ledger PK / DDL
// conflict instead of observing the migrated state.
const CLOCK_URL = join(PKG_ROOT, 'src', 'clock.js').split('\\').join('/')
const OPEN_URL = join(PKG_ROOT, 'src', 'open.js').split('\\').join('/')
const RACER_SOURCE = [
  'import { existsSync, readFileSync, writeFileSync } from "node:fs"',
  `import { fixedClock } from "file://${CLOCK_URL}"`,
  `import { openStorageWithDriver, closeStorage, realConnect } from "file://${OPEN_URL}"`,
  'const root = process.argv[2]',
  'const dir = process.argv[3]',
  'const id = process.argv[4]',
  'const marker = dir + "/read-" + id',
  'const peer = dir + "/read-" + (1 - Number(id))',
  'const abortPath = dir + "/abort"',
  'let storage',
  'try {',
  '  storage = openStorageWithDriver(',
  '  {',
  '    storageRoot: root,',
  '    databaseFileName: "state.db",',
  '    createIfMissing: true,',
  '    clock: fixedClock(1700000000000000),',
  '    busyTimeoutMicros: 30000000,',
  '    backupPolicy: { root, retentionDescriptor: null },',
  '  },',
  '  (path, opts) => {',
  '    const real = realConnect(path, opts)',
  '    return {',
  '      exec: (s) => real.exec(s),',
  '      prepare: (sql) => {',
  '        const matched = sql.startsWith("SELECT version, name, digest, applied_at_micros FROM schema_migrations")',
  '        if (!matched) return real.prepare(sql)',
  '        // The statement is prepared lazily INSIDE the barrier: on a fresh',
  '        // database real.prepare throws "no such table", and that throw is',
  '        // itself a finished read the rendezvous must synchronize on.',
  '        return {',
  '          run: (...a) => real.prepare(sql).run(...a),',
  '          get: (...a) => real.prepare(sql).get(...a),',
  '          all: (...a) => {',
  '            // Two-phase rendezvous: (1) both reach the read; (2) both',
  '            // FINISH the read (rows or throw) before either returns — so',
  '            // both compute the pending set before either can commit.',
  '            writeFileSync(marker, "reached")',
  '            const wait = (p) => {',
  '              const start = Date.now()',
  '              while (!existsSync(p)) {',
  '                // Peer-death escape: the parent drops an abort marker (with',
  '                // the dead peer cause) the moment a racer dies, so a',
  '                // survivor never spins into a misleading timeout.',
  '                if (existsSync(abortPath)) {',
  '                  const cause = readFileSync(abortPath, "utf8")',
  '                  throw new Error("HARNESS_RENDEZVOUS_ABORT " + cause)',
  '                }',
  '                if (Date.now() - start > 30000) {',
  '                  throw new Error("HARNESS_RENDEZVOUS_TIMEOUT peer never reached " + p)',
  '                }',
  '              }',
  '            }',
  '            wait(peer)',
  '            let rows',
  '            let failure = null',
  '            try {',
  '              rows = real.prepare(sql).all(...a)',
  '            } catch (error) {',
  '              failure = error',
  '            }',
  '            writeFileSync(marker + "-done", "read")',
  '            wait(peer + "-done")',
  '            if (failure !== null) throw failure',
  '            return rows',
  '          },',
  '        }',
  '      },',
  '      pragma: (s) => real.pragma(s),',
  '      close: () => real.close(),',
  '    }',
  '  },',
  '  )',
  '} catch (error) {',
  '  // Harness failures must never launder into product-shaped errors: the raw',
  '  // cause lands in the abort marker before boundary wrapping hides it.',
  '  const text = error && error.message ? error.message : String(error)',
  '  if (!existsSync(abortPath)) writeFileSync(abortPath, "racer " + id + " failed: " + text)',
  '  throw error',
  '}',
  'const rows = storage.driver.prepare("SELECT version FROM schema_migrations ORDER BY version").all()',
  'console.log(JSON.stringify(rows))',
  'closeStorage(storage)',
].join('\n')

test('CONC-01: second write transaction while the lock is held refuses with STORAGE_LOCK_TIMEOUT', () => {
  const expected = record('CONC-01')
  assert.equal(expected.expectedCode, 'STORAGE_LOCK_TIMEOUT')
  const root = mkdtempSync(join(tmpdir(), 'fkp9-conc1-'))
  const storage = openStorage(
    configFor(root, { busyTimeoutMicros: expected.input.busyTimeoutMicros }),
  )
  const blocker = new Database(join(root, 'state.db'))
  blocker.pragma('busy_timeout = 100')
  blocker.exec('BEGIN IMMEDIATE')
  try {
    assert.throws(
      () => withTransaction(storage, () => undefined),
      (error: unknown) => {
        assert.ok(error instanceof StorageError)
        assert.equal(error.code, 'STORAGE_LOCK_TIMEOUT')
        return true
      },
    )
  } finally {
    blocker.exec('ROLLBACK')
    blocker.close()
    closeStorage(storage)
    rmSync(root, { recursive: true, force: true })
  }
})

test('CONC-02: readers during a writer transaction observe the pre-transaction snapshot', () => {
  const expected = record('CONC-02')
  assert.equal(expected.expectedOutcome, 'pre-transaction-snapshot')
  const root = mkdtempSync(join(tmpdir(), 'fkp9-conc2-'))
  const storage = openStorage(configFor(root))
  seed(storage)
  insertEvent(storage, {
    eventId: 'evt-1',
    goalId: 'goal-1',
    kind: 'created',
    payload: '{}',
    payloadDigest: `sha256:${'a'.repeat(64)}`,
    principalRef: 'principal-1',
    operationId: 'op-1',
    recordedAtMicros: T0,
  })
  withTransaction(storage, (inner) => {
    insertEvent(inner, {
      eventId: 'evt-2',
      goalId: 'goal-1',
      kind: 'updated',
      payload: '{}',
      payloadDigest: `sha256:${'b'.repeat(64)}`,
      principalRef: 'principal-1',
      operationId: 'op-2',
      recordedAtMicros: T0 + 1,
    })
    const reader = new Database(join(root, 'state.db'), { readonly: true })
    const seen = reader.prepare('SELECT event_id FROM events ORDER BY event_seq').all() as {
      event_id: string
    }[]
    reader.close()
    assert.deepEqual(
      seen.map((row) => row.event_id),
      ['evt-1'],
      'reader must observe the pre-transaction snapshot',
    )
  })
  const after = queryEvents(storage, {}).map((row) => row.eventId)
  assert.deepEqual(after, ['evt-1', 'evt-2'])
  closeStorage(storage)
  rmSync(root, { recursive: true, force: true })
})

test('CONC-03: two processes genuinely race open + migrate; loser observes migrated state', async () => {
  const expected = record('CONC-03')
  assert.equal(expected.expectedOutcome, 'single-apply-with-loser-observing-migrated-state')
  const root = mkdtempSync(join(tmpdir(), 'fkp9-conc3-'))
  const rendezvous = mkdtempSync(join(tmpdir(), 'fkp9-conc3r-'))
  writeFileSync(join(root, 'racer.mts'), RACER_SOURCE)
  const script = join(root, 'racer.mts')
  // Seed the database before the race: the file is initialized (WAL
  // conversion done) so fresh-create/WAL-conversion contention cannot kill a
  // racer's open — the race is the migration apply, deterministically.
  const seed = new Database(join(root, 'state.db'))
  seed.pragma('journal_mode = WAL')
  seed.close()
  // Both racers run at the same time (true concurrency): the rendezvous at the
  // pre-apply ledger read guarantees both pass readAppliedMigrations before
  // either commits, so the under-lock single-apply re-check decides the loser's
  // fate (skip + observe, versus PK/DDL failure when the re-check is broken).
  const children = [0, 1].map((id) =>
    spawn(process.execPath, ['--import', 'tsx', script, root, rendezvous, String(id)], {
      cwd: PKG_ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
    }),
  )
  const outputs = children.map((child) => {
    const chunks: Buffer[] = []
    child.stdout?.on('data', (chunk: Buffer) => chunks.push(chunk))
    const errChunks: Buffer[] = []
    child.stderr?.on('data', (chunk: Buffer) => errChunks.push(chunk))
    return { out: chunks, err: errChunks }
  })
  // Peer-death escape: the moment a racer dies, drop an abort marker carrying
  // its cause so the survivor's barrier exits promptly with that cause.
  children.forEach((child, i) => {
    child.on('exit', (code) => {
      if (code !== 0 && !existsSync(join(rendezvous, 'abort'))) {
        const detail = Buffer.concat(outputs[i]?.err ?? [])
          .toString('utf8')
          .slice(0, 400)
        writeFileSync(join(rendezvous, 'abort'), `racer ${i} exited ${String(code)}: ${detail}`)
      }
    })
  })
  const exits = await Promise.all(children.map((child) => once(child, 'exit')))
  const report = (): string => {
    const parts: string[] = []
    for (let i = 0; i < children.length; i += 1) {
      parts.push(`--- racer ${i} out ---\n${Buffer.concat(outputs[i]?.out ?? []).toString('utf8')}`)
      parts.push(`--- racer ${i} err ---\n${Buffer.concat(outputs[i]?.err ?? []).toString('utf8')}`)
    }
    const abort = existsSync(join(rendezvous, 'abort'))
      ? readFileSync(join(rendezvous, 'abort'), 'utf8')
      : '(none)'
    parts.push(`--- abort marker ---\n${abort}`)
    parts.push(
      `markers: read-0=${String(existsSync(join(rendezvous, 'read-0')))} read-1=${String(existsSync(join(rendezvous, 'read-1')))}`,
    )
    return parts.join('\n')
  }
  const codes = exits.map((exit) => (exit as [number | null])[0])
  const markersOk = existsSync(join(rendezvous, 'read-0')) && existsSync(join(rendezvous, 'read-1'))
  // Print BOTH children's captured outputs before any assertion can abort the
  // report — a harness failure must surface as a test failure carrying the
  // peer's cause, never laundered into a product-shaped error.
  if (codes.some((code) => code !== 0) || !markersOk) {
    console.error(report())
  }
  assert.equal(
    codes.filter((code) => code !== 0).length,
    0,
    `racer(s) exited non-zero (harness report follows)\n${report()}`,
  )
  assert.ok(markersOk, `pre-apply rendezvous markers missing\n${report()}`)
  // Exactly one apply (PK) and the loser OBSERVES the migrated state.
  const storage = openStorage(configFor(root))
  const ledger = storage.driver.prepare('SELECT version FROM schema_migrations').all() as {
    version: number
  }[]
  assert.equal(ledger.length, 3, 'each version is applied exactly once')
  closeStorage(storage)
  rmSync(root, { recursive: true, force: true })
  rmSync(rendezvous, { recursive: true, force: true })
})

test('CONC-04: backupTo under concurrent write attempts yields a consistent snapshot', async () => {
  const expected = record('CONC-04')
  assert.equal(expected.expectedOutcome, 'backup-passes-verify-backup')
  const root = mkdtempSync(join(tmpdir(), 'fkp9-conc4-'))
  const backupRoot = mkdtempSync(join(tmpdir(), 'fkp9-conc4b-'))
  const storage = openStorage(configFor(root, { backupRoot }))
  seed(storage)
  insertEvent(storage, {
    eventId: 'evt-1',
    goalId: 'goal-1',
    kind: 'created',
    payload: '{}',
    payloadDigest: `sha256:${'a'.repeat(64)}`,
    principalRef: 'principal-1',
    operationId: 'op-1',
    recordedAtMicros: T0,
  })
  const manifest = await backupTo(storage, 'b1.db', {
    sink: async (driver, tempPath) => {
      // A concurrent writer attempt while the backup lock is held must not
      // interleave into the copy (tiny busy budget).
      const writer = new Database(join(root, 'state.db'))
      writer.pragma('busy_timeout = 100')
      let blocked = false
      try {
        writer
          .prepare(
            `INSERT INTO events (event_id, goal_id, kind, payload, payload_digest, principal_ref, operation_id, recorded_at_micros)
             VALUES ('evt-concurrent', 'goal-1', 'created', '{}', '${`sha256:${'c'.repeat(64)}`}', 'principal-1', 'op-9', ${T0})`,
          )
          .run()
      } catch {
        blocked = true
      }
      writer.close()
      assert.ok(blocked, 'a write must not interleave into the backup boundary')
      await driver.backupTo?.(tempPath)
    },
  })
  assert.match(manifest.backupBytesDigest, /^sha256:[0-9a-f]{64}$/)
  const verified = verifyBackup(join(backupRoot, 'b1.db'))
  assert.equal(verified.backupBytesDigest, manifest.backupBytesDigest)
  // The committed boundary stands: only the pre-backup event is in the copy;
  // the blocked write never landed anywhere.
  const events = queryEvents(storage, {}).map((row) => row.eventId)
  assert.deepEqual(events, ['evt-1'])
  closeStorage(storage)
  rmSync(root, { recursive: true, force: true })
  rmSync(backupRoot, { recursive: true, force: true })
})

test('CONC-05: second write handle on the same path in one process refuses', () => {
  const expected = record('CONC-05')
  assert.equal(expected.expectedCode, 'STORAGE_ALREADY_OPEN')
  const root = mkdtempSync(join(tmpdir(), 'fkp9-conc5-'))
  const first = openStorage(configFor(root))
  assert.throws(
    () => openStorage(configFor(root)),
    (error: unknown) => {
      assert.ok(error instanceof StorageError)
      assert.equal(error.code, 'STORAGE_ALREADY_OPEN')
      return true
    },
  )
  closeStorage(first)
  rmSync(root, { recursive: true, force: true })
})

test('every C5 row pre-declares its outcome', () => {
  const rows = CONC.records.filter((candidate) => candidate.id.startsWith('CONC-'))
  assert.equal(rows.length, 5)
  for (const row of rows) {
    const declared = typeof row.expectedCode === 'string' || typeof row.expectedOutcome === 'string'
    assert.ok(declared, `${row.id} must pre-declare an outcome`)
  }
})
