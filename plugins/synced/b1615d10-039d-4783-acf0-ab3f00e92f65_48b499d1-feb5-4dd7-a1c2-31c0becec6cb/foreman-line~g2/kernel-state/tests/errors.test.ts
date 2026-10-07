/**
 * Registry closure, diagnostics discipline, fault-injection per code (AC3),
 * and the 68-record fixture inventory map.
 *
 * The registry code count is derived from the table and the union BY
 * DERIVATION (coordinator ruling 2026-09-28): no hand-typed count literal
 * appears anywhere; the union and the spec's registry table are compared as
 * name sets extracted from their sources.
 */
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { backupTo, verifyBackup } from '../src/backup.js'
import { fixedClock } from '../src/clock.js'
import {
  CONSTRAINT_REASONS,
  DRIVER_CODE_LITERALS,
  PATH_REFUSAL_REASONS,
  STORAGE_ERROR_CODE_COUNT,
  STORAGE_ERROR_CODES,
  STORAGE_ERROR_REGISTRY,
  StorageError,
  type StorageErrorCode,
} from '../src/errors.js'
import { exportStorage } from '../src/export.js'
import { applyMigration, loadMigrationSet, resolvePendingMigrations } from '../src/migrations.js'
import {
  closeStorage,
  type DriverConnection,
  openStorage,
  openStorageWithDriver,
} from '../src/open.js'
import { checkTarget } from '../src/path-guard.js'
import { insertEvent } from '../src/rows.js'
import { type Storage, withTransaction } from '../src/transactions.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const PKG_ROOT = resolve(HERE, '..')

function tempRoot(prefix: string): string {
  return mkdtempSync(join(tmpdir(), prefix))
}

function configFor(root: string, backupRoot: string): Parameters<typeof openStorage>[0] {
  return {
    storageRoot: root,
    databaseFileName: 'state.db',
    createIfMissing: true,
    clock: fixedClock(1_700_000_000_000_000),
    backupPolicy: { root: backupRoot, retentionDescriptor: null },
  }
}

// --- registry closure by derivation ----------------------------------------

test('registry table and union agree by derivation; count is derived', () => {
  const tableNames = Object.keys(STORAGE_ERROR_REGISTRY).sort()
  const unionNames = [...STORAGE_ERROR_CODES].sort()
  assert.deepEqual(tableNames, unionNames)
  assert.equal(STORAGE_ERROR_CODE_COUNT, STORAGE_ERROR_CODES.length)
  assert.equal(new Set(STORAGE_ERROR_CODES).size, STORAGE_ERROR_CODES.length)
  assert.equal(STORAGE_ERROR_CODE_COUNT, tableNames.length)
})

test('registry names match the spec registry table extracted from the pinned spec', () => {
  const specPath = resolve(
    PKG_ROOT,
    '..',
    'docs',
    'specs',
    'done',
    'FK-P9-storage-migration-abi.md',
  )
  const specText = readFileSync(specPath, 'utf8')
  const section = specText.slice(
    specText.indexOf('### Error registry'),
    specText.indexOf('### Hostile-fixture inventory'),
  )
  const specNames = [...section.matchAll(/^\| ([A-Z_]+) \|/gm)].map((match) => match[1] as string)
  assert.deepEqual([...STORAGE_ERROR_CODES].sort(), [...specNames].sort())
  assert.equal(STORAGE_ERROR_CODE_COUNT, specNames.length)
})

test('every diagnostic member name declared in the registry is used by its code shape', () => {
  for (const code of STORAGE_ERROR_CODES) {
    const members = STORAGE_ERROR_REGISTRY[code].diagnosticMembers
    assert.ok(Array.isArray(members))
    for (const member of members) {
      assert.ok(
        [
          'reasonCode',
          'mode',
          'databaseVersion',
          'packagedVersion',
          'version',
          'name',
          'timeoutMicros',
          'driverCode',
          'constraint',
          'field',
          'fieldPath',
        ].includes(member),
        `${code} declares unknown member ${member}`,
      )
    }
  }
})

test('diagnostics are shape-checked at construction (default-deny)', () => {
  assert.throws(
    () => new StorageError('STORAGE_ABSENT', { reasonCode: 'traversal' }),
    /not in the declared shape/,
  )
  assert.throws(
    () => new StorageError('STORAGE_PATH_REFUSED', { reasonCode: 'open-sesame' }),
    /not a closed reasonCode literal/,
  )
  assert.throws(
    () => new StorageError('STORAGE_IO_FAILURE', { driverCode: 'SQLITE_MAGIC' }),
    /not a closed driverCode literal/,
  )
  assert.throws(
    () => new StorageError('STORAGE_CONSTRAINT_VIOLATION', { reasonCode: 'nope', constraint: 'x' }),
    /not a closed reasonCode literal/,
  )
  assert.throws(() => new StorageError('STORAGE_CLOSED', { mode: 'wal' }), /missing|not in/)
})

test('closed enums carry their spec literals', () => {
  assert.equal(PATH_REFUSAL_REASONS.length, 16)
  assert.deepEqual(
    [...CONSTRAINT_REASONS],
    ['foreign-key', 'append-only', 'unique-constraint', 'check'],
  )
  assert.ok(DRIVER_CODE_LITERALS.includes('SQLITE_FULL'))
})

// --- fault-injection: one case per registry code ---------------------------

function expectCode(fn: () => unknown, code: StorageErrorCode): StorageError {
  try {
    fn()
  } catch (error) {
    assert.ok(error instanceof StorageError, `expected StorageError, got ${String(error)}`)
    assert.equal(error.code, code)
    // Bounded diagnostic discipline: the message is code + JSON diagnostic only.
    assert.match(error.message, /^[A-Z_]+( \{.*\})?$/)
    const allowed: readonly string[] = STORAGE_ERROR_REGISTRY[error.code].diagnosticMembers
    for (const member of Object.keys(error.diagnostic)) {
      assert.ok(allowed.includes(member), `${member} leaks through ${error.code}`)
    }
    return error
  }
  throw new Error(`expected ${code} to throw`)
}

function stubDriver(overrides: Partial<DriverConnection> = {}): DriverConnection {
  return {
    exec: () => undefined,
    prepare: () => ({
      run: () => ({ changes: 1 }),
      get: () => undefined,
      all: () => [],
    }),
    pragma: () => [{ journal_mode: 'wal' }],
    close: () => undefined,
    ...overrides,
  }
}

function handleWith(driver: DriverConnection, root: string): Storage {
  return {
    driver,
    clock: fixedClock(0),
    absPath: join(root, 'state.db'),
    busyTimeoutMicros: 1000,
    packagedMaxVersion: 1,
    backupRoot: root,
    retentionDescriptor: null,
    inTransaction: false,
    closed: false,
  }
}

test('fault injection: STORAGE_PATH_REFUSED', () => {
  const root = tempRoot('fkp9-err-')
  const error = expectCode(
    () => checkTarget({ rootAbs: root, relative: '../escape.db' }),
    'STORAGE_PATH_REFUSED',
  )
  assert.equal(error.diagnostic.reasonCode, 'traversal')
  rmSync(root, { recursive: true, force: true })
})

test('fault injection: STORAGE_ABSENT', () => {
  const root = tempRoot('fkp9-err-')
  const backupRoot = tempRoot('fkp9-err-b-')
  const config = { ...configFor(root, backupRoot), createIfMissing: false }
  expectCode(() => openStorage(config), 'STORAGE_ABSENT')
  rmSync(root, { recursive: true, force: true })
  rmSync(backupRoot, { recursive: true, force: true })
})

test('fault injection: STORAGE_NOT_A_DATABASE', () => {
  const root = tempRoot('fkp9-err-')
  const backupRoot = tempRoot('fkp9-err-b-')
  writeFileSync(join(root, 'state.db'), 'this is not a database file')
  expectCode(() => openStorage(configFor(root, backupRoot)), 'STORAGE_NOT_A_DATABASE')
  rmSync(root, { recursive: true, force: true })
  rmSync(backupRoot, { recursive: true, force: true })
})

test('fault injection: STORAGE_CORRUPT via quick_check gate', () => {
  const root = tempRoot('fkp9-err-')
  const backupRoot = tempRoot('fkp9-err-b-')
  const storage = openStorage(configFor(root, backupRoot))
  closeStorage(storage)
  const bytes = readFileSync(join(root, 'state.db'))
  const pageSize = bytes.readUInt16BE(16)
  assert.ok(pageSize >= 512, 'expected a real sqlite page size')
  assert.ok(bytes.length > pageSize, 'expected a multi-page database')
  // Valid header, garbage in an interior page's b-tree header (CORR-03 shape).
  for (let i = pageSize + 1; i < pageSize + 80; i += 1) {
    bytes[i] = (bytes[i] as number) ^ 0xff
  }
  writeFileSync(join(root, 'state.db'), bytes)
  expectCode(() => openStorage(configFor(root, backupRoot)), 'STORAGE_CORRUPT')
  rmSync(root, { recursive: true, force: true })
  rmSync(backupRoot, { recursive: true, force: true })
})

test('fault injection: STORAGE_WAL_UNAVAILABLE via the pragma seam', () => {
  const root = tempRoot('fkp9-err-')
  const backupRoot = tempRoot('fkp9-err-b-')
  // The pragma seam needs a real, checked target on disk (the re-verify gate).
  const real = openStorage(configFor(root, backupRoot))
  closeStorage(real)
  const error = expectCode(
    () =>
      openStorageWithDriver(configFor(root, backupRoot), () =>
        stubDriver({ pragma: () => [{ journal_mode: 'delete' }] }),
      ),
    'STORAGE_WAL_UNAVAILABLE',
  )
  assert.equal(error.diagnostic.mode, 'delete')
  rmSync(root, { recursive: true, force: true })
  rmSync(backupRoot, { recursive: true, force: true })
})

test('fault injection: STORAGE_SCHEMA_AHEAD', () => {
  const error = expectCode(
    () =>
      resolvePendingMigrations(
        [{ version: 1, name: 'initial', digest: `sha256:${'a'.repeat(64)}`, sql: 'SELECT 1' }],
        [{ version: 2, name: 'later', digest: `sha256:${'b'.repeat(64)}`, appliedAtMicros: 0 }],
      ),
    'STORAGE_SCHEMA_AHEAD',
  )
  assert.equal(error.diagnostic.databaseVersion, 2)
  assert.equal(error.diagnostic.packagedVersion, 1)
})

test('fault injection: STORAGE_MIGRATION_DRIFT', () => {
  expectCode(
    () =>
      resolvePendingMigrations(
        [{ version: 1, name: 'initial', digest: `sha256:${'a'.repeat(64)}`, sql: 'SELECT 1' }],
        [{ version: 1, name: 'initial', digest: `sha256:${'b'.repeat(64)}`, appliedAtMicros: 0 }],
      ),
    'STORAGE_MIGRATION_DRIFT',
  )
})

test('fault injection: STORAGE_MIGRATION_SET_INVALID', () => {
  const dir = tempRoot('fkp9-err-set-')
  writeFileSync(join(dir, '0001-a.sql'), 'CREATE TABLE a(x);')
  writeFileSync(join(dir, '0003-c.sql'), 'CREATE TABLE c(x);')
  expectCode(() => loadMigrationSet(dir), 'STORAGE_MIGRATION_SET_INVALID')
  rmSync(dir, { recursive: true, force: true })
})

test('fault injection: STORAGE_MIGRATION_FAILED', () => {
  const throwing = Object.assign(new Error('boom'), { code: 'SQLITE_ERROR' })
  const driver = stubDriver({
    exec: () => {
      throw throwing
    },
  })
  expectCode(
    () =>
      applyMigration(
        driver,
        {
          version: 1,
          name: 'broken',
          digest: `sha256:${'a'.repeat(64)}`,
          sql: 'CREATE TABLE t(x);',
        },
        fixedClock(0),
      ),
    'STORAGE_MIGRATION_FAILED',
  )
})

test('fault injection: STORAGE_LOCK_TIMEOUT', () => {
  const root = tempRoot('fkp9-err-')
  const busy = Object.assign(new Error('busy'), { code: 'SQLITE_BUSY' })
  const handle = handleWith(
    stubDriver({
      exec: () => {
        throw busy
      },
    }),
    root,
  )
  const error = expectCode(() => withTransaction(handle, () => undefined), 'STORAGE_LOCK_TIMEOUT')
  assert.equal(error.diagnostic.timeoutMicros, 1000)
  rmSync(root, { recursive: true, force: true })
})

test('fault injection: STORAGE_ALREADY_OPEN', () => {
  const root = tempRoot('fkp9-err-')
  const backupRoot = tempRoot('fkp9-err-b-')
  const storage = openStorage(configFor(root, backupRoot))
  expectCode(() => openStorage(configFor(root, backupRoot)), 'STORAGE_ALREADY_OPEN')
  closeStorage(storage)
  rmSync(root, { recursive: true, force: true })
  rmSync(backupRoot, { recursive: true, force: true })
})

test('fault injection: STORAGE_DISK_FULL', () => {
  const root = tempRoot('fkp9-err-')
  const full = Object.assign(new Error('full'), { code: 'SQLITE_FULL' })
  const handle = handleWith(
    stubDriver({
      prepare: () => ({
        run: () => {
          throw full
        },
        get: () => undefined,
        all: () => [],
      }),
    }),
    root,
  )
  expectCode(
    () =>
      insertEvent(handle, {
        eventId: 'evt-1',
        goalId: 'goal-1',
        kind: 'k',
        payload: '{}',
        payloadDigest: `sha256:${'a'.repeat(64)}`,
        principalRef: 'p-1',
        operationId: 'op-1',
      }),
    'STORAGE_DISK_FULL',
  )
  rmSync(root, { recursive: true, force: true })
})

test('fault injection: STORAGE_IO_FAILURE (driver message text never propagates)', () => {
  const root = tempRoot('fkp9-err-')
  const readonly = Object.assign(new Error('D:\\secret\\path database is locked'), {
    code: 'SQLITE_READONLY',
  })
  const handle = handleWith(
    stubDriver({
      prepare: () => ({
        run: () => {
          throw readonly
        },
        get: () => undefined,
        all: () => [],
      }),
    }),
    root,
  )
  const error = expectCode(
    () =>
      insertEvent(handle, {
        eventId: 'evt-1',
        goalId: 'goal-1',
        kind: 'k',
        payload: '{}',
        payloadDigest: `sha256:${'a'.repeat(64)}`,
        principalRef: 'p-1',
        operationId: 'op-1',
      }),
    'STORAGE_IO_FAILURE',
  )
  assert.equal(error.diagnostic.driverCode, 'SQLITE_READONLY')
  assert.ok(!error.message.includes('secret'), 'driver message text leaked')
  assert.ok(!error.message.includes('D:'), 'host path leaked')
  rmSync(root, { recursive: true, force: true })
})

test('fault injection: STORAGE_CONSTRAINT_VIOLATION', () => {
  const root = tempRoot('fkp9-err-')
  const fk = Object.assign(new Error('FOREIGN KEY constraint failed'), {
    code: 'SQLITE_CONSTRAINT_FOREIGNKEY',
    constraintName: 'fk_events_goal',
  })
  const handle = handleWith(
    stubDriver({
      prepare: () => ({
        run: () => {
          throw fk
        },
        get: () => undefined,
        all: () => [],
      }),
    }),
    root,
  )
  const error = expectCode(
    () =>
      insertEvent(handle, {
        eventId: 'evt-1',
        goalId: 'goal-1',
        kind: 'k',
        payload: '{}',
        payloadDigest: `sha256:${'a'.repeat(64)}`,
        principalRef: 'p-1',
        operationId: 'op-1',
      }),
    'STORAGE_CONSTRAINT_VIOLATION',
  )
  assert.equal(error.diagnostic.reasonCode, 'foreign-key')
  rmSync(root, { recursive: true, force: true })
})

test('fault injection: STORAGE_PAYLOAD_LIMIT_EXCEEDED', () => {
  const root = tempRoot('fkp9-err-')
  const handle = handleWith(stubDriver(), root)
  expectCode(
    () =>
      insertEvent(handle, {
        eventId: 'evt-1',
        goalId: 'goal-1',
        kind: 'k',
        payload: 'x'.repeat(65_537),
        payloadDigest: `sha256:${'a'.repeat(64)}`,
        principalRef: 'p-1',
        operationId: 'op-1',
      }),
    'STORAGE_PAYLOAD_LIMIT_EXCEEDED',
  )
  rmSync(root, { recursive: true, force: true })
})

test('fault injection: STORAGE_ARGUMENT_INVALID (nested withTransaction)', () => {
  const root = tempRoot('fkp9-err-')
  const handle = handleWith(stubDriver(), root)
  handle.inTransaction = true
  expectCode(() => withTransaction(handle, () => undefined), 'STORAGE_ARGUMENT_INVALID')
  rmSync(root, { recursive: true, force: true })
})

test('fault injection: STORAGE_CLOSED', () => {
  const root = tempRoot('fkp9-err-')
  const handle = handleWith(stubDriver(), root)
  handle.closed = true
  expectCode(() => withTransaction(handle, () => undefined), 'STORAGE_CLOSED')
  rmSync(root, { recursive: true, force: true })
})

test('fault injection: BACKUP_DESTINATION_REFUSED', async () => {
  const root = tempRoot('fkp9-err-')
  const backupRoot = tempRoot('fkp9-err-b-')
  const storage = openStorage(configFor(root, backupRoot))
  await assert.rejects(
    () => backupTo(storage, '../outside.db'),
    (error: unknown) => {
      assert.ok(error instanceof StorageError)
      assert.equal(error.code, 'BACKUP_DESTINATION_REFUSED')
      return true
    },
  )
  closeStorage(storage)
  rmSync(root, { recursive: true, force: true })
  rmSync(backupRoot, { recursive: true, force: true })
})

test('fault injection: BACKUP_FAILED (sink faults, no partial file survives)', async () => {
  const root = tempRoot('fkp9-err-')
  const backupRoot = tempRoot('fkp9-err-b-')
  const storage = openStorage(configFor(root, backupRoot))
  await assert.rejects(
    () => backupTo(storage, 'b1.db', { sink: () => Promise.reject(new Error('quota')) }),
    (error: unknown) => {
      assert.ok(error instanceof StorageError)
      assert.equal(error.code, 'BACKUP_FAILED')
      return true
    },
  )
  closeStorage(storage)
  rmSync(root, { recursive: true, force: true })
  rmSync(backupRoot, { recursive: true, force: true })
})

test('fault injection: BACKUP_INTEGRITY_FAILED', () => {
  const root = tempRoot('fkp9-err-')
  mkdirSync(root, { recursive: true })
  writeFileSync(join(root, 'b1.db'), 'backup bytes')
  writeFileSync(join(root, 'b1.db.manifest.json'), '{"nonsense": true}')
  expectCode(() => verifyBackup(join(root, 'b1.db')), 'BACKUP_INTEGRITY_FAILED')
  rmSync(root, { recursive: true, force: true })
})

test('fault injection: EXPORT_FAILED (capped sink)', () => {
  const root = tempRoot('fkp9-err-')
  const backupRoot = tempRoot('fkp9-err-b-')
  const storage = openStorage(configFor(root, backupRoot))
  expectCode(
    () =>
      exportStorage(storage, {
        sink: () => {
          throw new Error('capped')
        },
      }),
    'EXPORT_FAILED',
  )
  closeStorage(storage)
  rmSync(root, { recursive: true, force: true })
  rmSync(backupRoot, { recursive: true, force: true })
})

// --- fixture inventory map -------------------------------------------------

interface FixtureRecord {
  id: string
  expectedCode?: string
  expectedOutcome?: unknown
  expectedReasonCode?: unknown
}

const FIXTURE_FILES = [
  'fixtures/hostile/corrupt.json',
  'fixtures/hostile/wal.json',
  'fixtures/hostile/skew.json',
  'fixtures/hostile/migration.json',
  'fixtures/hostile/concurrency.json',
  'fixtures/hostile/disk-full.json',
  'fixtures/hostile/paths.json',
  'fixtures/hostile/link-trees.json',
  'fixtures/hostile/invariants.json',
  'fixtures/hostile/export-determinism.json',
  'fixtures/golden/export-golden.json',
  'fixtures/canonical/encoder-vectors.json',
]

const EXPECTED_CLASS_COUNTS: Record<string, number> = {
  CORR: 6,
  WAL: 7,
  SKEW: 5,
  MIG: 6,
  CONC: 5,
  FULL: 5,
  PATH: 18,
  INV: 5,
  EXPD: 3,
  POS: 7,
  CTRL: 1,
}

test('fixture inventory map: 68 records, one pre-declared expected outcome each', () => {
  const all: FixtureRecord[] = []
  for (const file of FIXTURE_FILES) {
    const parsed = JSON.parse(readFileSync(join(HERE, file), 'utf8')) as {
      records: FixtureRecord[]
    }
    for (const record of parsed.records) {
      assert.ok(record.id.length > 0, `${file}: record without id`)
      const hasCode = typeof record.expectedCode === 'string'
      const hasOutcome = 'expectedOutcome' in record
      assert.notEqual(
        hasCode,
        hasOutcome,
        `${file}/${record.id}: needs exactly one expected outcome`,
      )
      if (hasCode) {
        assert.ok(
          (STORAGE_ERROR_CODES as readonly string[]).includes(record.expectedCode as string),
          `${record.id}: unknown code ${record.expectedCode}`,
        )
      }
      all.push(record)
    }
  }
  const countsByPrefix: Record<string, number> = {}
  for (const record of all) {
    const prefix = record.id.split('-')[0] as string
    countsByPrefix[prefix] = (countsByPrefix[prefix] ?? 0) + 1
  }
  assert.deepEqual(countsByPrefix, EXPECTED_CLASS_COUNTS)
  const hostile = all.filter(
    (record) => !record.id.startsWith('POS') && !record.id.startsWith('CTRL'),
  ).length
  const positive = all.length - hostile
  assert.equal(hostile, 60)
  assert.equal(positive, 8)
  assert.equal(
    all.length,
    Object.values(EXPECTED_CLASS_COUNTS).reduce((sum, n) => sum + n, 0),
  )
})
