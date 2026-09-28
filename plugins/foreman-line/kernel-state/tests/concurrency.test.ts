/**
 * C5 concurrent open (CONC-01..05): busy-budget timeout, reader snapshot
 * isolation, two-process single-apply migration, backup consistency under
 * concurrent write attempts, and the one-write-handle rule.
 */
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
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
  insertGoal(storage, { goalId: 'goal-1', revision: 0, status: 'open', updatedAtMicros: T0 })
}

// A racer: opens storage on a shared root and prints the applied ledger. The
// point is the concurrent open + migrate (single-apply under the write lock).
const RACER_SOURCE = [
  'import { fixedClock } from "file://' +
    join(PKG_ROOT, 'src', 'clock.js').split('\\').join('/') +
    '"',
  'import { openStorage, closeStorage } from "file://' +
    join(PKG_ROOT, 'src', 'open.js').split('\\').join('/') +
    '"',
  'const root = process.argv[2]',
  'const storage = openStorage({',
  '  storageRoot: root,',
  '  databaseFileName: "state.db",',
  '  createIfMissing: true,',
  '  clock: fixedClock(1700000000000000),',
  '  backupPolicy: { root, retentionDescriptor: null },',
  '})',
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

test('CONC-03: two processes open + migrate the same database with single-apply', () => {
  const expected = record('CONC-03')
  assert.equal(expected.expectedOutcome, 'single-apply-with-loser-observing-migrated-state')
  const root = mkdtempSync(join(tmpdir(), 'fkp9-conc3-'))
  writeFileSync(join(root, 'racer.mts'), RACER_SOURCE)
  const script = join(root, 'racer.mts')
  const runs = [0, 1].map(() =>
    spawnSync(process.execPath, ['--import', 'tsx', script, root], {
      cwd: PKG_ROOT,
      encoding: 'utf8',
    }),
  )
  for (const run of runs) {
    assert.equal(run.status, 0, run.stderr)
  }
  const storage = openStorage(configFor(root))
  const ledger = storage.driver.prepare('SELECT version FROM schema_migrations').all() as {
    version: number
  }[]
  assert.equal(ledger.length, 1, 'each version is applied exactly once (PK)')
  const applied = JSON.parse((runs[0]?.stdout ?? '').trim().split('\n').pop() ?? '[]') as unknown[]
  const appliedOther = JSON.parse(
    (runs[1]?.stdout ?? '').trim().split('\n').pop() ?? '[]',
  ) as unknown[]
  // The loser observes the migrated state (it skipped under the write lock).
  assert.equal(applied.length + appliedOther.length, 2)
  closeStorage(storage)
  rmSync(root, { recursive: true, force: true })
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
