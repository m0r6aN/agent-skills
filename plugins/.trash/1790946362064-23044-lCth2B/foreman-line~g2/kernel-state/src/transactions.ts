/**
 * The only transaction primitive (FK-P9): `withTransaction` runs `BEGIN
 * IMMEDIATE` … `COMMIT`/`ROLLBACK` — synchronous single-connection, so
 * transaction boundaries are lexical, not event-loop interleavings (D14).
 * Nested invocation is refused (`STORAGE_ARGUMENT_INVALID`); busy exhaustion
 * is `STORAGE_LOCK_TIMEOUT`; a throwing `fn` rolls back and rethrows typed.
 * Multi-table atomic writes (event + state + cursor, FK-P10) compose inside it.
 */

import type { Clock } from './clock.js'
import { driverCodeOf, fromDriverError, StorageError, storageError } from './errors.js'
import type { MigrationDriver } from './migrations.js'

/** Handle returned by `openStorage`. Carries its seams and recorded policy. */
export interface Storage {
  readonly driver: MigrationDriver
  readonly clock: Clock
  readonly absPath: string
  readonly busyTimeoutMicros: number
  readonly packagedMaxVersion: number
  readonly backupRoot: string
  readonly retentionDescriptor: { maxCount: number; maxAgeMicros: number } | null
  inTransaction: boolean
  closed: boolean
}

/** Fail closed on any operation over a closed handle. */
export function assertOpen(storage: Storage): void {
  if (storage.closed) throw storageError('STORAGE_CLOSED', {})
}

/**
 * Run `fn` inside one `BEGIN IMMEDIATE` … `COMMIT` transaction. The only
 * transaction primitive; nested invocation refuses. `fn` receives the same
 * handle and performs guarded writes through the row primitives.
 */
export function withTransaction<T>(storage: Storage, fn: (storage: Storage) => T): T {
  assertOpen(storage)
  if (storage.inTransaction) {
    throw storageError('STORAGE_ARGUMENT_INVALID', { fieldPath: 'withTransaction' })
  }
  storage.inTransaction = true
  try {
    try {
      storage.driver.exec('BEGIN IMMEDIATE')
    } catch (error) {
      if (error instanceof StorageError) throw error
      const driverCode = driverCodeOf(error)
      if (driverCode === 'SQLITE_BUSY' || driverCode === 'SQLITE_LOCKED') {
        throw storageError('STORAGE_LOCK_TIMEOUT', { timeoutMicros: storage.busyTimeoutMicros })
      }
      throw fromDriverError(error, { fallback: 'os-error' })
    }
    let result: T
    try {
      result = fn(storage)
    } catch (error) {
      try {
        storage.driver.exec('ROLLBACK')
      } catch {
        // Best-effort rollback; WAL recovery restores the last committed state.
      }
      if (error instanceof StorageError) throw error
      throw fromDriverError(error, { fallback: 'os-error' })
    }
    try {
      storage.driver.exec('COMMIT')
    } catch (error) {
      try {
        storage.driver.exec('ROLLBACK')
      } catch {
        // Best-effort rollback.
      }
      if (error instanceof StorageError) throw error
      throw fromDriverError(error, { fallback: 'os-error' })
    }
    return result
  } finally {
    storage.inTransaction = false
  }
}
