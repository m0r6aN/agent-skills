/**
 * C6 bounded disk-full (AC8): genuine driver `SQLITE_FULL` via
 * `max_page_count`, fault-injected bounded sinks, clean rollback, consistent
 * reopen, and no partial backup/export file ever left behind.
 */
import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { backupTo } from '../src/backup.js'
import { fixedClock } from '../src/clock.js'
import { StorageError, storageError } from '../src/errors.js'
import { exportStorage } from '../src/export.js'
import {
  checkpoint,
  closeStorage,
  type OpenStorageConfig,
  openStorage,
  openStorageWithDriver,
  realConnect,
  verifyStorage,
} from '../src/open.js'
import { insertEvent, insertGoal } from '../src/rows.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const PKG_ROOT = resolve(HERE, '..')
const PACKAGED_0001 = readFileSync(join(PKG_ROOT, 'migrations', '0001-initial.sql'))
const T0 = 1_700_000_000_000_000

interface FullRecord {
  id: string
  input: { scenario: string; maxPageCount?: number; fault?: string }
  expectedCode: string
}

const FULL = JSON.parse(
  readFileSync(join(HERE, 'fixtures', 'hostile', 'disk-full.json'), 'utf8'),
) as {
  records: FullRecord[]
}

function record(id: string): FullRecord {
  const found = FULL.records.find((candidate) => candidate.id === id)
  assert.ok(found, `${id} missing from disk-full.json`)
  return found
}

function configFor(root: string, backupRoot?: string): OpenStorageConfig {
  return {
    storageRoot: root,
    databaseFileName: 'state.db',
    createIfMissing: true,
    clock: fixedClock(T0),
    backupPolicy: { root: backupRoot ?? root, retentionDescriptor: null },
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

test('FULL-01: insert past max_page_count is STORAGE_DISK_FULL with clean rollback', () => {
  const expected = record('FULL-01')
  assert.equal(expected.expectedCode, 'STORAGE_DISK_FULL')
  const root = mkdtempSync(join(tmpdir(), 'fkp9-full1-'))
  const storage = openStorage(configFor(root))
  storage.driver.pragma(`max_page_count=${expected.input.maxPageCount ?? 6}`)
  insertGoal(storage, { goalId: 'goal-1', revision: 0, status: 'open', updatedAtMicros: T0 })
  const error = expectCode(() => {
    for (let i = 0; i < 50; i += 1) {
      insertEvent(storage, {
        eventId: `evt-${i}`,
        goalId: 'goal-1',
        kind: 'created',
        payload: 'x'.repeat(2000),
        payloadDigest: `sha256:${'a'.repeat(64)}`,
        principalRef: 'principal-1',
        operationId: `op-${i}`,
        recordedAtMicros: T0 + i,
      })
    }
  }, 'STORAGE_DISK_FULL')
  assert.equal(error.diagnostic.driverCode, 'SQLITE_FULL')
  const count = storage.driver.prepare('SELECT count(*) AS c FROM events').get() as { c: number }
  assert.ok(count.c < 50, 'the failed statement must leave no partial row')
  closeStorage(storage)
  const reopened = openStorage(configFor(root))
  assert.equal(verifyStorage(reopened).quickCheck, 'ok')
  closeStorage(reopened)
  rmSync(root, { recursive: true, force: true })
})

test('FULL-02: SQLITE_FULL inside a migration is STORAGE_DISK_FULL with no partial schema', () => {
  const expected = record('FULL-02')
  assert.equal(expected.expectedCode, 'STORAGE_DISK_FULL')
  const root = mkdtempSync(join(tmpdir(), 'fkp9-full2-'))
  const set = mkdtempSync(join(tmpdir(), 'fkp9-full2s-'))
  const setOnlyOne = mkdtempSync(join(tmpdir(), 'fkp9-full2o-'))
  writeFileSync(join(setOnlyOne, '0001-a.sql'), PACKAGED_0001)
  writeFileSync(join(set, '0001-a.sql'), PACKAGED_0001)
  const body = [
    'CREATE TABLE big_table (payload TEXT NOT NULL)',
    ...Array.from(
      { length: 12 },
      () => `INSERT INTO big_table (payload) VALUES ('${'y'.repeat(60_000)}')`,
    ),
  ].join('; ')
  writeFileSync(join(set, '0002-b.sql'), body)
  const error = expectCode(
    () =>
      openStorageWithDriver(
        configFor(root),
        (path, opts) => {
          const real = realConnect(path, opts)
          return {
            exec: (sql: string) => {
              real.exec(sql)
              // Genuine driver-level capacity pressure (max_page_count) engaged
              // the moment migration 0002 has created its table: the INSERTs
              // then exhaust the page budget mid-transaction.
              if (sql.includes('CREATE TABLE big_table')) {
                real.pragma('max_page_count=6')
              }
            },
            prepare: (sql: string) => real.prepare(sql),
            pragma: (source: string) => real.pragma(source),
            close: () => {
              real.close()
            },
          }
        },
        { migrationDir: set },
      ),
    'STORAGE_DISK_FULL',
  )
  assert.equal(error.diagnostic.driverCode, 'SQLITE_FULL')
  // No partial schema: the rolled-back migration left nothing observable.
  const inspect = openStorageWithDriver(configFor(root), undefined, { migrationDir: setOnlyOne })
  const objects = inspect.driver
    .prepare("SELECT name FROM sqlite_master WHERE name = 'big_table'")
    .all()
  assert.equal(objects.length, 0)
  closeStorage(inspect)
  rmSync(root, { recursive: true, force: true })
  rmSync(set, { recursive: true, force: true })
  rmSync(setOnlyOne, { recursive: true, force: true })
})

test('FULL-03: backup destination bounded quota leaves no partial file', async () => {
  const expected = record('FULL-03')
  assert.equal(expected.expectedCode, 'BACKUP_FAILED')
  const root = mkdtempSync(join(tmpdir(), 'fkp9-full3-'))
  const backupRoot = mkdtempSync(join(tmpdir(), 'fkp9-full3b-'))
  const storage = openStorage(configFor(root, backupRoot))
  await assert.rejects(
    () =>
      backupTo(storage, 'b1.db', {
        sink: () => Promise.reject(storageError('BACKUP_FAILED', { driverCode: 'SQLITE_FULL' })),
      }),
    (error: unknown) => {
      assert.ok(error instanceof StorageError)
      assert.equal(error.code, expected.expectedCode)
      return true
    },
  )
  assert.ok(!existsSync(join(backupRoot, 'b1.db')), 'no partial backup file may survive')
  assert.ok(!existsSync(join(backupRoot, 'b1.db.manifest.json')))
  assert.ok(!existsSync(join(backupRoot, 'b1.db.tmp')))
  closeStorage(storage)
  rmSync(root, { recursive: true, force: true })
  rmSync(backupRoot, { recursive: true, force: true })
})

test('FULL-04: export to a capped sink is EXPORT_FAILED', () => {
  const expected = record('FULL-04')
  assert.equal(expected.expectedCode, 'EXPORT_FAILED')
  const root = mkdtempSync(join(tmpdir(), 'fkp9-full4-'))
  const storage = openStorage(configFor(root))
  expectCode(
    () =>
      exportStorage(storage, {
        sink: () => {
          throw storageError('EXPORT_FAILED', {})
        },
      }),
    expected.expectedCode,
  )
  closeStorage(storage)
  rmSync(root, { recursive: true, force: true })
})

test('FULL-05: checkpoint under capacity pressure fails typed and reopens consistent', () => {
  const expected = record('FULL-05')
  assert.equal(expected.expectedCode, 'STORAGE_DISK_FULL')
  assert.equal(expected.input.fault, 'pragma-sqlite-full')
  const root = mkdtempSync(join(tmpdir(), 'fkp9-full5-'))
  const first = openStorage(configFor(root))
  first.driver.pragma(`max_page_count=${expected.input.maxPageCount ?? 6}`)
  closeStorage(first)
  // Capacity pressure is established; the checkpoint pragma seam then reports
  // the driver-level SQLITE_FULL — the honest typed-failure vector for this row
  // (a checkpoint itself cannot exhaust the page budget: SQLite clamps
  // max_page_count to the current size).
  const storage = openStorageWithDriver(configFor(root), (path, opts) => {
    const real = realConnect(path, opts)
    return {
      exec: (sql: string) => {
        real.exec(sql)
      },
      prepare: (sql: string) => real.prepare(sql),
      pragma: (source: string) => {
        if (source.startsWith('wal_checkpoint')) {
          throw Object.assign(new Error('database or disk is full'), { code: 'SQLITE_FULL' })
        }
        return real.pragma(source)
      },
      close: () => {
        real.close()
      },
    }
  })
  expectCode(() => checkpoint(storage, 'TRUNCATE'), expected.expectedCode)
  closeStorage(storage)
  const reopened = openStorage(configFor(root))
  assert.equal(verifyStorage(reopened).quickCheck, 'ok')
  closeStorage(reopened)
  rmSync(root, { recursive: true, force: true })
})

test('every C6 row pre-declares a bounded-failure code', () => {
  const rows = FULL.records.filter((candidate) => candidate.id.startsWith('FULL-'))
  assert.equal(rows.length, 5)
  for (const row of rows) {
    assert.equal(typeof row.expectedCode, 'string', `${row.id} must pre-declare a code`)
  }
})
