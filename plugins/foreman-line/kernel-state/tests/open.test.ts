/**
 * Open/handle contract: asserted pragmas (WAL/busy/synchronous/foreign_keys),
 * the recorded busy budget, idempotent close, one-write-handle enforcement and
 * its release, checkpoint modes, and argument fail-closed behavior.
 */
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { fixedClock } from '../src/clock.js'
import { StorageError } from '../src/errors.js'
import {
  BUSY_TIMEOUT_DEFAULT_MICROS,
  checkpoint,
  closeStorage,
  type OpenStorageConfig,
  openStorage,
  openStorageWithDriver,
  realConnect,
  verifyStorage,
  WAL_AUTOCHECKPOINT_PAGES,
} from '../src/open.js'
import { withTransaction } from '../src/transactions.js'

function configFor(root: string, overrides: Partial<OpenStorageConfig> = {}): OpenStorageConfig {
  return {
    storageRoot: root,
    databaseFileName: 'state.db',
    createIfMissing: true,
    clock: fixedClock(1_700_000_000_000_000),
    backupPolicy: { root, retentionDescriptor: null },
    ...overrides,
  }
}

function tempPair(): { root: string; backupRoot: string } {
  return {
    root: mkdtempSync(join(tmpdir(), 'fkp9-open-')),
    backupRoot: mkdtempSync(join(tmpdir(), 'fkp9-openb-')),
  }
}

function cleanup(roots: { root: string; backupRoot: string }): void {
  rmSync(roots.root, { recursive: true, force: true })
  rmSync(roots.backupRoot, { recursive: true, force: true })
}

test('open asserts the WAL/busy pragma policy and records the busy budget', () => {
  const roots = tempPair()
  const storage = openStorage(configFor(roots.root))
  assert.equal(storage.busyTimeoutMicros, BUSY_TIMEOUT_DEFAULT_MICROS)
  const mode = storage.driver.pragma('journal_mode') as { journal_mode: string }[]
  assert.equal(mode[0]?.journal_mode, 'wal')
  const busy = storage.driver.pragma('busy_timeout') as { timeout: number }[]
  assert.equal(busy[0]?.timeout, BUSY_TIMEOUT_DEFAULT_MICROS / 1000)
  const sync = storage.driver.pragma('synchronous') as { synchronous: number }[]
  assert.equal(sync[0]?.synchronous, 2, 'synchronous=FULL')
  const fk = storage.driver.pragma('foreign_keys') as { foreign_keys: number }[]
  assert.equal(fk[0]?.foreign_keys, 1)
  const auto = storage.driver.pragma('wal_autocheckpoint') as { wal_autocheckpoint: number }[]
  assert.equal(auto[0]?.wal_autocheckpoint, WAL_AUTOCHECKPOINT_PAGES)
  const recursive = storage.driver.pragma('recursive_triggers') as { recursive_triggers: number }[]
  assert.equal(recursive[0]?.recursive_triggers, 1, 'recursive_triggers=ON')
  closeStorage(storage)
  cleanup(roots)
})

test('post-open assertions refuse when recursive_triggers is not ON (F4 hardening)', () => {
  const roots = tempPair()
  const real = openStorage(configFor(roots.root))
  closeStorage(real)
  // The pragma seam reports a silently non-applied recursive_triggers value:
  // AC6's INSERT-OR-REPLACE rejection rides on it, so the open must refuse.
  let refused: unknown
  try {
    openStorageWithDriver(configFor(roots.root), (path, opts) => {
      const connection = realConnect(path, opts)
      return {
        exec: (sql: string) => {
          connection.exec(sql)
        },
        prepare: (sql: string) => connection.prepare(sql),
        pragma: (source: string) => {
          if (source === 'recursive_triggers') return [{ recursive_triggers: 0 }]
          return connection.pragma(source)
        },
        close: () => {
          connection.close()
        },
      }
    })
  } catch (error) {
    refused = error
  }
  assert.ok(refused instanceof StorageError, 'open must refuse a non-ON recursive_triggers value')
  assert.equal(refused instanceof StorageError ? refused.code : 'none', 'STORAGE_IO_FAILURE')
  cleanup(roots)
})

test('a busyTimeoutMicros override is recorded on the handle', () => {
  const roots = tempPair()
  const storage = openStorage(configFor(roots.root, { busyTimeoutMicros: 250_000 }))
  assert.equal(storage.busyTimeoutMicros, 250_000)
  closeStorage(storage)
  cleanup(roots)
})

test('close is idempotent and a closed handle refuses every operation', () => {
  const roots = tempPair()
  const storage = openStorage(configFor(roots.root))
  closeStorage(storage)
  closeStorage(storage)
  assert.throws(
    () => withTransaction(storage, () => undefined),
    (error: unknown) => {
      assert.ok(error instanceof StorageError)
      assert.equal(error.code, 'STORAGE_CLOSED')
      return true
    },
  )
  cleanup(roots)
})

test('the one-write-handle registry releases on close', () => {
  const roots = tempPair()
  const first = openStorage(configFor(roots.root))
  assert.throws(
    () => openStorage(configFor(roots.root)),
    (error: unknown) => {
      assert.ok(error instanceof StorageError)
      assert.equal(error.code, 'STORAGE_ALREADY_OPEN')
      return true
    },
  )
  closeStorage(first)
  const second = openStorage(configFor(roots.root))
  closeStorage(second)
  cleanup(roots)
})

test('checkpoint accepts exactly the four named modes', () => {
  const roots = tempPair()
  const storage = openStorage(configFor(roots.root))
  for (const mode of ['PASSIVE', 'FULL', 'RESTART', 'TRUNCATE'] as const) {
    checkpoint(storage, mode)
  }
  assert.throws(
    () => checkpoint(storage, 'CHOP' as never),
    (error: unknown) => {
      assert.ok(error instanceof StorageError)
      assert.equal(error.code, 'STORAGE_ARGUMENT_INVALID')
      return true
    },
  )
  closeStorage(storage)
  cleanup(roots)
})

test('config arguments fail closed', () => {
  const roots = tempPair()
  assert.throws(
    () => openStorage(configFor(roots.root, { createIfMissing: 'yes' as never })),
    (error: unknown) => {
      assert.ok(error instanceof StorageError)
      assert.equal(error.code, 'STORAGE_ARGUMENT_INVALID')
      return true
    },
  )
  assert.throws(
    () => openStorage(configFor(roots.root, { databaseFileName: '../escape.db' })),
    (error: unknown) => {
      assert.ok(error instanceof StorageError)
      assert.equal(error.code, 'STORAGE_PATH_REFUSED')
      return true
    },
  )
  assert.throws(
    () => openStorage(configFor(roots.root, { clock: null as never })),
    (error: unknown) => {
      assert.ok(error instanceof StorageError)
      assert.equal(error.code, 'STORAGE_ARGUMENT_INVALID')
      return true
    },
  )
  cleanup(roots)
})

test('verifyStorage over a handle and over a path agree at head', () => {
  const roots = tempPair()
  const storage = openStorage(configFor(roots.root))
  const viaHandle = verifyStorage(storage)
  assert.equal(viaHandle.schemaVersion, 5)
  assert.equal(viaHandle.quickCheck, 'ok')
  const viaPath = verifyStorage(join(roots.root, 'state.db'))
  assert.equal(viaPath.schemaVersion, 5)
  closeStorage(storage)
  cleanup(roots)
})

test('a fresh create over a zero-byte file works; a missing file with createIfMissing false refuses', () => {
  const roots = tempPair()
  writeFileSync(join(roots.root, 'state.db'), Buffer.alloc(0))
  const storage = openStorage(configFor(roots.root))
  closeStorage(storage)
  rmSync(join(roots.root, 'state.db'), { force: true })
  rmSync(join(roots.root, 'state.db-wal'), { force: true })
  rmSync(join(roots.root, 'state.db-shm'), { force: true })
  assert.throws(
    () => openStorage(configFor(roots.root, { createIfMissing: false })),
    (error: unknown) => {
      assert.ok(error instanceof StorageError)
      assert.equal(error.code, 'STORAGE_ABSENT')
      return true
    },
  )
  cleanup(roots)
})
