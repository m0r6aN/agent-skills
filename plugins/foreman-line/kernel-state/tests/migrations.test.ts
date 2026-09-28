/**
 * C3 version skew and C4 interrupted migrations (AC1/AC2): transactional
 * apply with rollback on failure, schema-ahead and drift refusals, packaged-set
 * validation, and forward migration to head. MIG-02 (real child-process kill)
 * lives in migration-crash.test.ts.
 */
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { fixedClock } from '../src/clock.js'
import { StorageError } from '../src/errors.js'
import {
  loadMigrationSet,
  type MigrationFile,
  resolvePendingMigrations,
  splitSqlStatements,
} from '../src/migrations.js'
import {
  closeStorage,
  type OpenStorageConfig,
  openStorage,
  openStorageWithDriver,
} from '../src/open.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const PKG_ROOT = resolve(HERE, '..')
const PACKAGED_0001 = readFileSync(join(PKG_ROOT, 'migrations', '0001-initial.sql'))

interface MigrationRecord {
  id: string
  input: {
    scenario: string
    failAtStatementIndex?: number
    failAtMigration?: number
    fromVersion?: number
    toVersion?: number
    statement?: string
  }
  expectedCode?: string
  expectedOutcome?: string
}

const MIGRATIONS = JSON.parse(
  readFileSync(join(HERE, 'fixtures', 'hostile', 'migration.json'), 'utf8'),
) as { records: MigrationRecord[] }
const SKEW = JSON.parse(readFileSync(join(HERE, 'fixtures', 'hostile', 'skew.json'), 'utf8')) as {
  records: {
    id: string
    input: Record<string, unknown>
    expectedCode?: string
    expectedOutcome?: string
  }[]
}

function migRecord(id: string): MigrationRecord {
  const found = MIGRATIONS.records.find((candidate) => candidate.id === id)
  assert.ok(found, `${id} missing from migration.json`)
  return found
}

function skewRecord(id: string): (typeof SKEW.records)[number] {
  const found = SKEW.records.find((candidate) => candidate.id === id)
  assert.ok(found, `${id} missing from skew.json`)
  return found
}

function configFor(root: string): OpenStorageConfig {
  return {
    storageRoot: root,
    databaseFileName: 'state.db',
    createIfMissing: true,
    clock: fixedClock(1_700_000_000_000_000),
    backupPolicy: { root, retentionDescriptor: null },
  }
}

function expectCode(fn: () => unknown, code: string): StorageError {
  try {
    fn()
  } catch (error) {
    assert.ok(error instanceof StorageError, `expected StorageError, got ${String(error)}`)
    assert.equal(error.code, code)
    return error
  }
  throw new Error(`expected ${code}`)
}

function writeSet(dir: string, files: { name: string; sql: string | Buffer }[]): void {
  for (const file of files) {
    writeFileSync(join(dir, file.name), file.sql)
  }
}

const DDL_0002 = 'CREATE TABLE t_two (x INTEGER NOT NULL)'
const DDL_0003 = 'CREATE TABLE t_three (x INTEGER NOT NULL)'

test('SKEW-01: database above the packaged maximum refuses with STORAGE_SCHEMA_AHEAD', () => {
  const expected = skewRecord('SKEW-01')
  assert.equal(expected.expectedCode, 'STORAGE_SCHEMA_AHEAD')
  const root = mkdtempSync(join(tmpdir(), 'fkp9-skew1-'))
  const setTwo = mkdtempSync(join(tmpdir(), 'fkp9-skew1s-'))
  const setOne = mkdtempSync(join(tmpdir(), 'fkp9-skew1t-'))
  writeSet(setTwo, [
    { name: '0001-a.sql', sql: PACKAGED_0001 },
    { name: '0002-b.sql', sql: DDL_0002 },
  ])
  writeSet(setOne, [{ name: '0001-a.sql', sql: PACKAGED_0001 }])
  const first = openStorageWithDriver(configFor(root), undefined, { migrationDir: setTwo })
  closeStorage(first)
  const error = expectCode(
    () => openStorageWithDriver(configFor(root), undefined, { migrationDir: setOne }),
    'STORAGE_SCHEMA_AHEAD',
  )
  assert.equal(error.diagnostic.databaseVersion, 2)
  assert.equal(error.diagnostic.packagedVersion, 1)
  rmSync(root, { recursive: true, force: true })
  rmSync(setTwo, { recursive: true, force: true })
  rmSync(setOne, { recursive: true, force: true })
})

test('SKEW-02: recorded digest not matching its packaged file refuses with STORAGE_MIGRATION_DRIFT', () => {
  const expected = skewRecord('SKEW-02')
  assert.equal(expected.expectedCode, 'STORAGE_MIGRATION_DRIFT')
  const root = mkdtempSync(join(tmpdir(), 'fkp9-skew2-'))
  const setA = mkdtempSync(join(tmpdir(), 'fkp9-skew2a-'))
  const setB = mkdtempSync(join(tmpdir(), 'fkp9-skew2b-'))
  writeSet(setA, [{ name: '0001-a.sql', sql: PACKAGED_0001 }])
  writeSet(setB, [{ name: '0001-a.sql', sql: `${PACKAGED_0001}\n-- edited\n` }])
  const first = openStorageWithDriver(configFor(root), undefined, { migrationDir: setA })
  closeStorage(first)
  const error = expectCode(
    () => openStorageWithDriver(configFor(root), undefined, { migrationDir: setB }),
    'STORAGE_MIGRATION_DRIFT',
  )
  assert.equal(error.diagnostic.version, 1)
  assert.equal(error.diagnostic.name, 'a')
  rmSync(root, { recursive: true, force: true })
  rmSync(setA, { recursive: true, force: true })
  rmSync(setB, { recursive: true, force: true })
})

test('SKEW-03: an older database forward-migrates to head', () => {
  const expected = skewRecord('SKEW-03')
  assert.equal(expected.expectedOutcome, 'opens-at-head')
  const root = mkdtempSync(join(tmpdir(), 'fkp9-skew3-'))
  const setOne = mkdtempSync(join(tmpdir(), 'fkp9-skew3a-'))
  const setThree = mkdtempSync(join(tmpdir(), 'fkp9-skew3b-'))
  writeSet(setOne, [{ name: '0001-a.sql', sql: PACKAGED_0001 }])
  writeSet(setThree, [
    { name: '0001-a.sql', sql: PACKAGED_0001 },
    { name: '0002-b.sql', sql: DDL_0002 },
    { name: '0003-c.sql', sql: DDL_0003 },
  ])
  const first = openStorageWithDriver(configFor(root), undefined, { migrationDir: setOne })
  closeStorage(first)
  const second = openStorageWithDriver(configFor(root), undefined, { migrationDir: setThree })
  const applied = second.driver
    .prepare('SELECT version FROM schema_migrations ORDER BY version')
    .all()
  assert.equal(applied.length, 3)
  closeStorage(second)
  rmSync(root, { recursive: true, force: true })
  rmSync(setOne, { recursive: true, force: true })
  rmSync(setThree, { recursive: true, force: true })
})

test('SKEW-04: a database at head opens as a no-op', () => {
  const expected = skewRecord('SKEW-04')
  assert.equal(expected.expectedOutcome, 'opens')
  const root = mkdtempSync(join(tmpdir(), 'fkp9-skew4-'))
  const first = openStorage(configFor(root))
  closeStorage(first)
  const second = openStorage(configFor(root))
  closeStorage(second)
  rmSync(root, { recursive: true, force: true })
})

test('SKEW-05: an applied row whose packaged file is missing refuses with STORAGE_MIGRATION_DRIFT', () => {
  const expected = skewRecord('SKEW-05')
  assert.equal(expected.expectedCode, 'STORAGE_MIGRATION_DRIFT')
  const root = mkdtempSync(join(tmpdir(), 'fkp9-skew5-'))
  const setOld = mkdtempSync(join(tmpdir(), 'fkp9-skew5a-'))
  const setRenamed = mkdtempSync(join(tmpdir(), 'fkp9-skew5b-'))
  writeSet(setOld, [
    { name: '0001-a.sql', sql: PACKAGED_0001 },
    { name: '0002-old.sql', sql: DDL_0002 },
  ])
  // Same bytes under a different identity: the recorded row's packaged file
  // (name identity) is missing from the packaged set.
  writeSet(setRenamed, [
    { name: '0001-a.sql', sql: PACKAGED_0001 },
    { name: '0002-renamed.sql', sql: DDL_0002 },
  ])
  const first = openStorageWithDriver(configFor(root), undefined, { migrationDir: setOld })
  closeStorage(first)
  const error = expectCode(
    () => openStorageWithDriver(configFor(root), undefined, { migrationDir: setRenamed }),
    'STORAGE_MIGRATION_DRIFT',
  )
  assert.equal(error.diagnostic.version, 2)
  assert.equal(error.diagnostic.name, expected.input.appliedName)
  rmSync(root, { recursive: true, force: true })
  rmSync(setOld, { recursive: true, force: true })
  rmSync(setRenamed, { recursive: true, force: true })
})

test('MIG-01: injected failure after partial DDL rolls back to the pre-migration version', () => {
  const expected = migRecord('MIG-01')
  assert.equal(expected.expectedCode, 'STORAGE_MIGRATION_FAILED')
  const root = mkdtempSync(join(tmpdir(), 'fkp9-mig1-'))
  const set = mkdtempSync(join(tmpdir(), 'fkp9-mig1s-'))
  writeSet(set, [
    { name: '0001-a.sql', sql: PACKAGED_0001 },
    { name: '0002-b.sql', sql: `${DDL_0002}; CREATE TABLE t_two_more (x INTEGER);` },
  ])
  const failIndex = expected.input.failAtStatementIndex ?? 1
  expectCode(
    () =>
      openStorageWithDriver(configFor(root), undefined, {
        migrationDir: set,
        beforeStatement: (info) => {
          if (info.version === 2 && info.statementIndex === failIndex) {
            throw new Error('injected failure after partial DDL')
          }
        },
      }),
    'STORAGE_MIGRATION_FAILED',
  )
  // No half-applied schema: the pre-migration version stands and 0002's
  // objects are absent (inspected with a 0001-only set so nothing re-applies).
  const setOnlyOne = mkdtempSync(join(tmpdir(), 'fkp9-mig1o-'))
  writeSet(setOnlyOne, [{ name: '0001-a.sql', sql: PACKAGED_0001 }])
  const storage = openStorageWithDriver(configFor(root), undefined, { migrationDir: setOnlyOne })
  const versions = storage.driver.prepare('SELECT version FROM schema_migrations').all() as {
    version: number
  }[]
  assert.deepEqual(
    versions.map((row) => row.version),
    [1],
  )
  const objects = storage.driver
    .prepare("SELECT name FROM sqlite_master WHERE name IN ('t_two', 't_two_more')")
    .all()
  assert.equal(objects.length, 0, 'no half-applied schema may be observable')
  closeStorage(storage)
  rmSync(root, { recursive: true, force: true })
  rmSync(set, { recursive: true, force: true })
  rmSync(setOnlyOne, { recursive: true, force: true })
})

test('MIG-03: failure in the second of three migrations leaves the first committed', () => {
  const expected = migRecord('MIG-03')
  assert.equal(expected.expectedCode, 'STORAGE_MIGRATION_FAILED')
  const root = mkdtempSync(join(tmpdir(), 'fkp9-mig3-'))
  const set = mkdtempSync(join(tmpdir(), 'fkp9-mig3s-'))
  writeSet(set, [
    { name: '0001-a.sql', sql: PACKAGED_0001 },
    { name: '0002-b.sql', sql: DDL_0002 },
    { name: '0003-c.sql', sql: DDL_0003 },
  ])
  const failAt = expected.input.failAtMigration ?? 2
  expectCode(
    () =>
      openStorageWithDriver(configFor(root), undefined, {
        migrationDir: set,
        beforeStatement: (info) => {
          if (info.version === failAt) throw new Error('injected failure')
        },
      }),
    'STORAGE_MIGRATION_FAILED',
  )
  const storage = openStorageWithDriver(configFor(root), undefined, { migrationDir: set })
  const versions = storage.driver
    .prepare('SELECT version FROM schema_migrations ORDER BY version')
    .all() as {
    version: number
  }[]
  assert.deepEqual(
    versions.map((row) => row.version),
    [1, 2, 3],
  )
  closeStorage(storage)
  rmSync(root, { recursive: true, force: true })
  rmSync(set, { recursive: true, force: true })
})

test('MIG-04: rerun after a failed migration completes at head', () => {
  const expected = migRecord('MIG-04')
  assert.equal(expected.expectedOutcome, 'rerun-lands-at-head')
  const root = mkdtempSync(join(tmpdir(), 'fkp9-mig4-'))
  const set = mkdtempSync(join(tmpdir(), 'fkp9-mig4s-'))
  writeSet(set, [
    { name: '0001-a.sql', sql: PACKAGED_0001 },
    { name: '0002-b.sql', sql: DDL_0002 },
  ])
  expectCode(
    () =>
      openStorageWithDriver(configFor(root), undefined, {
        migrationDir: set,
        beforeStatement: () => {
          throw new Error('injected failure')
        },
      }),
    'STORAGE_MIGRATION_FAILED',
  )
  const rerun = openStorageWithDriver(configFor(root), undefined, { migrationDir: set })
  const versions = rerun.driver
    .prepare('SELECT version FROM schema_migrations ORDER BY version')
    .all() as {
    version: number
  }[]
  assert.deepEqual(
    versions.map((row) => row.version),
    [1, 2],
  )
  closeStorage(rerun)
  rmSync(root, { recursive: true, force: true })
  rmSync(set, { recursive: true, force: true })
})

test('MIG-05: a disallowed non-transactional statement refuses at set validation', () => {
  const expected = migRecord('MIG-05')
  assert.equal(expected.expectedCode, 'STORAGE_MIGRATION_FAILED')
  const set = mkdtempSync(join(tmpdir(), 'fkp9-mig5-'))
  writeSet(set, [
    { name: '0001-a.sql', sql: PACKAGED_0001 },
    { name: '0002-b.sql', sql: `${expected.input.statement ?? 'VACUUM'};` },
  ])
  const error = expectCode(() => loadMigrationSet(set), 'STORAGE_MIGRATION_FAILED')
  assert.equal(error.diagnostic.version, 2)
  rmSync(set, { recursive: true, force: true })
})

test('MIG-06: duplicate or gapped version numbers refuse with STORAGE_MIGRATION_SET_INVALID', () => {
  const expected = migRecord('MIG-06')
  assert.equal(expected.expectedCode, 'STORAGE_MIGRATION_SET_INVALID')
  const duplicate = mkdtempSync(join(tmpdir(), 'fkp9-mig6a-'))
  writeSet(duplicate, [
    { name: '0001-a.sql', sql: PACKAGED_0001 },
    { name: '0001-b.sql', sql: PACKAGED_0001 },
  ])
  expectCode(() => loadMigrationSet(duplicate), 'STORAGE_MIGRATION_SET_INVALID')
  const gapped = mkdtempSync(join(tmpdir(), 'fkp9-mig6b-'))
  writeSet(gapped, [
    { name: '0001-a.sql', sql: PACKAGED_0001 },
    { name: '0003-c.sql', sql: DDL_0003 },
  ])
  expectCode(() => loadMigrationSet(gapped), 'STORAGE_MIGRATION_SET_INVALID')
  rmSync(duplicate, { recursive: true, force: true })
  rmSync(gapped, { recursive: true, force: true })
})

test('POS-01: fresh create migrates to head', () => {
  const expected = migRecord('POS-01')
  assert.equal(expected.expectedOutcome, 'opens-at-head')
  const root = mkdtempSync(join(tmpdir(), 'fkp9-pos1-'))
  const storage = openStorage(configFor(root))
  const versions = storage.driver.prepare('SELECT version FROM schema_migrations').all() as {
    version: number
  }[]
  assert.deepEqual(
    versions.map((row) => row.version),
    [1],
  )
  closeStorage(storage)
  rmSync(root, { recursive: true, force: true })
})

test('POS-02: reopen at head lands at head', () => {
  const expected = migRecord('POS-02')
  assert.equal(expected.expectedOutcome, 'opens-at-head')
  const root = mkdtempSync(join(tmpdir(), 'fkp9-pos2-'))
  const first = openStorage(configFor(root))
  closeStorage(first)
  const second = openStorage(configFor(root))
  const applied = second.driver.prepare('SELECT count(*) AS c FROM schema_migrations').get() as {
    c: number
  }
  assert.equal(applied.c, 1)
  closeStorage(second)
  rmSync(root, { recursive: true, force: true })
})

test('POS-03: forward migration k→head lands at head', () => {
  const expected = migRecord('POS-03')
  assert.equal(expected.expectedOutcome, 'opens-at-head')
  const root = mkdtempSync(join(tmpdir(), 'fkp9-pos3-'))
  const setOne = mkdtempSync(join(tmpdir(), 'fkp9-pos3a-'))
  const setThree = mkdtempSync(join(tmpdir(), 'fkp9-pos3b-'))
  writeSet(setOne, [{ name: '0001-a.sql', sql: PACKAGED_0001 }])
  writeSet(setThree, [
    { name: '0001-a.sql', sql: PACKAGED_0001 },
    { name: '0002-b.sql', sql: DDL_0002 },
    { name: '0003-c.sql', sql: DDL_0003 },
  ])
  const first = openStorageWithDriver(configFor(root), undefined, {
    migrationDir: setOne,
  })
  closeStorage(first)
  const head = openStorageWithDriver(configFor(root), undefined, { migrationDir: setThree })
  assert.equal(head.packagedMaxVersion, expected.input.toVersion ?? 3)
  closeStorage(head)
  rmSync(root, { recursive: true, force: true })
  rmSync(setOne, { recursive: true, force: true })
  rmSync(setThree, { recursive: true, force: true })
})

test('splitSqlStatements keeps trigger bodies intact', () => {
  const statements = splitSqlStatements(
    "CREATE TABLE a (x); CREATE TRIGGER t BEFORE UPDATE ON a BEGIN SELECT RAISE(ABORT, 'x'); END; CREATE TABLE b (y);",
  )
  assert.equal(statements.length, 3)
  assert.ok((statements[1] as string).includes('RAISE(ABORT'))
})

test('comment-only disallowed words do not refuse; live ones do', () => {
  const dir = mkdtempSync(join(tmpdir(), 'fkp9-cmt-'))
  writeSet(dir, [
    { name: '0001-a.sql', sql: '-- VACUUM mentioned in a comment\nCREATE TABLE a (x);' },
  ])
  const set = loadMigrationSet(dir)
  assert.equal(set.length, 1)
  rmSync(dir, { recursive: true, force: true })
})

test('migration digests are file-bytes digests and drift when bytes change', () => {
  const dir = mkdtempSync(join(tmpdir(), 'fkp9-dig-'))
  writeSet(dir, [{ name: '0001-a.sql', sql: PACKAGED_0001 }])
  const [file] = loadMigrationSet(dir) as [MigrationFile]
  const renamed: MigrationFile = { ...file, name: 'b' }
  assert.throws(
    () =>
      resolvePendingMigrations(
        [renamed],
        [{ version: 1, name: 'a', digest: file.digest, appliedAtMicros: 0 }],
      ),
    (error: unknown) => {
      assert.ok(error instanceof StorageError)
      assert.equal(error.code, 'STORAGE_MIGRATION_DRIFT')
      return true
    },
  )
  rmSync(dir, { recursive: true, force: true })
})
