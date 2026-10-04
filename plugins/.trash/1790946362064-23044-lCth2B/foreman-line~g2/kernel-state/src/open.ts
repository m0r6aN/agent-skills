/**
 * `openStorage` and the transactional migration startup sequence (FK-P9 steps
 * 1–8): path gate → open gate → connection pragmas → corruption gate →
 * version gate → apply pending migrations → interrupted-migration recovery
 * (WAL) → post-open assertions. Every step is default-deny with its own
 * failure code and fixtures; nothing opens "anyway".
 */
import { closeSync, openSync, readSync, type Stats, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'
import type { Clock } from './clock.js'
import { driverCodeOf, fromDriverError, StorageError, storageError } from './errors.js'
import {
  applyPendingMigrations,
  loadMigrationSet,
  type MigrationDriver,
  type MigrationHooks,
  readAppliedMigrations,
  resolvePendingMigrations,
} from './migrations.js'
import { checkTarget, verifyOpenedTarget } from './path-guard.js'
import { requireBoundedText, requireSafeInt } from './schema.js'
import type { Storage } from './transactions.js'

/** Named constants of the asserted WAL/busy policy (spec pragma table). */
export const BUSY_TIMEOUT_DEFAULT_MICROS = 5_000_000
export const WAL_AUTOCHECKPOINT_PAGES = 1000

/** Ratified retention descriptor (OQ-2: operator-supplied, no shipped defaults). */
export interface RetentionDescriptor {
  maxCount: number
  maxAgeMicros: number
}

/** Backup policy reference carried by the handle. */
export interface BackupPolicy {
  /** Configured backup root (the protected mount — FK-P14 names the topology). */
  root: string
  /** Ratified descriptor; `null` means pruneBackups deletes nothing. */
  retentionDescriptor: RetentionDescriptor | null
}

/** `openStorage` configuration (the serialized contract surface). */
export interface OpenStorageConfig {
  storageRoot: string
  databaseFileName: string
  createIfMissing: boolean
  clock: Clock
  busyTimeoutMicros?: number
  backupPolicy: BackupPolicy
}

/** Driver connection surface (test-injectable for the pragma seam, CTRL-01). */
export interface DriverConnection extends MigrationDriver {
  close(): void
  /** Online backup copy into `destPath` (default `backupTo` sink). */
  backupTo?(destPath: string): Promise<void>
}

/** Connection factory seam (internal; the exported API always uses the real driver). */
export type ConnectFn = (absPath: string, opts: { readonly: boolean }) => DriverConnection

const HERE = dirname(fileURLToPath(import.meta.url))

/** Absolute path of the packaged migrations directory. */
export function packagedMigrationDir(): string {
  return resolve(HERE, '..', 'migrations')
}

/** Real driver connection factory (internal seam shared with `backup.ts`). */
export function realConnect(absPath: string, opts: { readonly: boolean }): DriverConnection {
  try {
    const db = new Database(absPath, { readonly: opts.readonly })
    return {
      exec: (sql: string) => {
        db.exec(sql)
      },
      prepare: (sql: string) => db.prepare(sql),
      pragma: (source: string) => db.pragma(source),
      close: () => {
        db.close()
      },
      backupTo: (destPath: string) => db.backup(destPath).then(() => undefined),
    }
  } catch (error) {
    const code = driverCodeOf(error)
    if (code === 'SQLITE_NOTADB') throw storageError('STORAGE_NOT_A_DATABASE', {})
    throw fromDriverError(error, { fallback: 'os-error' })
  }
}

/** One write handle per database path per process. */
const openWritePaths = new Set<string>()

function assertPragmas(driver: DriverConnection): void {
  const foreignKeys = driver.pragma('foreign_keys')
  const synchronous = driver.pragma('synchronous')
  const recursiveTriggers = driver.pragma('recursive_triggers')
  const fkValue = firstRowValue(foreignKeys)
  const syncValue = firstRowValue(synchronous)
  const recursiveValue = firstRowValue(recursiveTriggers)
  if (fkValue !== 1 && fkValue !== '1') {
    throw storageError('STORAGE_IO_FAILURE', { driverCode: 'os-error' })
  }
  if (syncValue !== 2 && syncValue !== '2') {
    throw storageError('STORAGE_IO_FAILURE', { driverCode: 'os-error' })
  }
  // AC6's INSERT-OR-REPLACE rejection rides on this setting (the implicit
  // conflict-resolution delete only fires delete triggers when recursive
  // triggers are on): a silently non-applied value must fail the open.
  if (recursiveValue !== 1 && recursiveValue !== '1') {
    throw storageError('STORAGE_IO_FAILURE', { driverCode: 'os-error' })
  }
}

function firstRowValue(result: unknown): unknown {
  if (Array.isArray(result) && result.length > 0) {
    const row = result[0]
    if (row !== null && typeof row === 'object') {
      const values = Object.values(row)
      return values.length > 0 ? values[0] : undefined
    }
  }
  return undefined
}

function normalizeMicros(value: unknown, fieldPath: string): number {
  return requireSafeInt(value, fieldPath)
}

/**
 * The startup sequence with an injectable connection factory (internal seam —
 * the exported `openStorage` passes the real driver; CTRL-01 injects a pragma
 * seam that reports a non-WAL mode).
 */
export function openStorageWithDriver(
  config: OpenStorageConfig,
  connect: ConnectFn = realConnect,
  hooks: MigrationHooks = {},
): Storage {
  // Config shape (fail closed).
  const clock = config.clock
  if (clock === null || typeof clock.nowMicros !== 'function') {
    throw storageError('STORAGE_ARGUMENT_INVALID', { fieldPath: 'clock' })
  }
  const createIfMissing = config.createIfMissing
  if (typeof createIfMissing !== 'boolean') {
    throw storageError('STORAGE_ARGUMENT_INVALID', { fieldPath: 'createIfMissing' })
  }
  const busyTimeoutMicros =
    config.busyTimeoutMicros === undefined
      ? BUSY_TIMEOUT_DEFAULT_MICROS
      : normalizeMicros(config.busyTimeoutMicros, 'busyTimeoutMicros')
  const databaseFileName = requireBoundedText(config.databaseFileName, 'databaseFileName', 4096)
  if (typeof config.storageRoot !== 'string' || config.storageRoot.length === 0) {
    throw storageError('STORAGE_ARGUMENT_INVALID', { fieldPath: 'storageRoot' })
  }
  const rootAbs = resolve(config.storageRoot)
  const backupPolicy = config.backupPolicy
  if (
    backupPolicy === null ||
    typeof backupPolicy !== 'object' ||
    typeof backupPolicy.root !== 'string' ||
    backupPolicy.root.length === 0
  ) {
    throw storageError('STORAGE_ARGUMENT_INVALID', { fieldPath: 'backupPolicy' })
  }

  // Startup step 1: path gate (absence is not a path dimension — expectAbsent).
  const checked = checkTarget({ rootAbs, relative: databaseFileName, expectAbsent: true })

  // Startup step 2: open gate. An absent file respects createIfMissing; an
  // existing file must carry a well-formed SQLite header (the header/short-file
  // gate — garbage header or short file is STORAGE_NOT_A_DATABASE, never
  // overwritten) and must pass the zero-byte/stale-sibling rule below.
  if (!checked.existed && !createIfMissing) {
    throw storageError('STORAGE_ABSENT', {})
  }
  if (checked.identity !== null && checked.identity.size === 0) {
    // Zero-byte main with stale WAL/SHM siblings is not a fresh create — the
    // pairing is refused before any driver touch discards the sibling.
    const walSize = siblingSize(`${checked.absPath}-wal`)
    const shmSize = siblingSize(`${checked.absPath}-shm`)
    if (walSize > 0 || shmSize > 0) throw storageError('STORAGE_NOT_A_DATABASE', {})
    if (!createIfMissing) {
      // An existing zero-byte file without siblings is still a non-database file.
      throw storageError('STORAGE_NOT_A_DATABASE', {})
    }
  }
  if (checked.identity !== null && checked.identity.size > 0) {
    assertSqliteHeader(checked.absPath, checked.identity.size)
  }

  const pathKey = checked.absPath.toLowerCase()
  if (openWritePaths.has(pathKey)) throw storageError('STORAGE_ALREADY_OPEN', {})
  openWritePaths.add(pathKey)

  let driver: DriverConnection | null = null
  try {
    try {
      driver = connect(checked.absPath, { readonly: false })
    } catch (error) {
      if (error instanceof StorageError) throw error
      const code = driverCodeOf(error)
      if (code === 'SQLITE_NOTADB') throw storageError('STORAGE_NOT_A_DATABASE', {})
      if (code === 'SQLITE_CANTOPEN' && checked.existed) {
        throw storageError('STORAGE_NOT_A_DATABASE', {})
      }
      throw fromDriverError(error, { fallback: 'os-error' })
    }

    // Startup step 1 re-verify: opened target must be the checked target.
    verifyOpenedTarget(checked)

    // Startup step 3: connection pragmas (WAL asserted). A garbage header or
    // short file fails here: SQLITE_NOTADB → STORAGE_NOT_A_DATABASE, a corrupt
    // page structure → STORAGE_CORRUPT (both total refusals).
    let mode: unknown
    try {
      mode = firstRowValue(driver.pragma('journal_mode=WAL'))
    } catch (error) {
      const code = driverCodeOf(error)
      if (code === 'SQLITE_NOTADB') throw storageError('STORAGE_NOT_A_DATABASE', {})
      if (code === 'SQLITE_CORRUPT') throw storageError('STORAGE_CORRUPT', {})
      throw fromDriverError(error, { fallback: 'os-error' })
    }
    if (typeof mode !== 'string' || mode.toLowerCase() !== 'wal') {
      throw storageError('STORAGE_WAL_UNAVAILABLE', { mode: String(mode) })
    }
    driver.pragma(`busy_timeout=${Math.ceil(busyTimeoutMicros / 1000)}`)
    driver.pragma('synchronous=FULL')
    driver.pragma('foreign_keys=ON')
    driver.pragma(`wal_autocheckpoint=${WAL_AUTOCHECKPOINT_PAGES}`)
    // Substrate enforcement (defense in depth): SQLite fires delete triggers
    // for INSERT OR REPLACE's implicit conflict-resolution delete only when
    // recursive triggers are enabled — without this the append-only triggers
    // would not reject the REPLACE mutation shape (AC6).
    driver.pragma('recursive_triggers=ON')

    // Startup step 4: corruption gate.
    try {
      const quick = driver.pragma('quick_check')
      const verdict = firstRowValue(quick)
      if (verdict !== 'ok') throw storageError('STORAGE_CORRUPT', {})
    } catch (error) {
      const code = driverCodeOf(error)
      if (code === 'SQLITE_NOTADB') throw storageError('STORAGE_NOT_A_DATABASE', {})
      if (error instanceof StorageError) throw error
      throw storageError('STORAGE_CORRUPT', {})
    }

    // Startup step 5: version gate (packaged set, then schema-ahead, then drift).
    const set = loadMigrationSet(hooks.migrationDir ?? packagedMigrationDir())
    const packagedMaxVersion =
      set.length === 0 ? 0 : (set[set.length - 1] as { version: number }).version
    const applied = readAppliedMigrations(driver)
    const pending = resolvePendingMigrations(set, applied)

    // Startup step 6: apply pending migrations (step 7 recovery is WAL's).
    applyPendingMigrations(driver, pending, clock, hooks)

    // Startup step 8: post-open assertions.
    assertPragmas(driver)

    const handle: Storage = {
      driver,
      clock,
      absPath: checked.absPath,
      busyTimeoutMicros,
      packagedMaxVersion,
      backupRoot: resolve(backupPolicy.root),
      retentionDescriptor: backupPolicy.retentionDescriptor,
      inTransaction: false,
      closed: false,
    }
    return handle
  } catch (error) {
    if (driver !== null) {
      try {
        driver.close()
      } catch {
        // Best-effort close of a refused open.
      }
    }
    openWritePaths.delete(pathKey)
    if (error instanceof StorageError) throw error
    throw fromDriverError(error, { fallback: 'os-error' })
  }
}

function siblingSize(path: string): number {
  try {
    return statSync(path).size
  } catch {
    return 0
  }
}

const SQLITE_MAGIC = 'SQLite format 3'

/**
 * Header/short-file gate: an existing database file must carry the SQLite
 * magic, a valid page-size field, and at least one full page. Garbage headers
 * and short files are `STORAGE_NOT_A_DATABASE` (never overwritten).
 */
function assertSqliteHeader(absPath: string, size: number): void {
  const header = Buffer.alloc(100)
  let fd: number
  try {
    fd = openSync(absPath, 'r')
  } catch {
    throw storageError('STORAGE_NOT_A_DATABASE', {})
  }
  try {
    const read = readSync(fd, header, 0, 100, 0)
    if (read < 100 || header.toString('latin1', 0, 15) !== SQLITE_MAGIC) {
      throw storageError('STORAGE_NOT_A_DATABASE', {})
    }
    const pageSizeField = header.readUInt16BE(16)
    const validPageSize =
      pageSizeField === 1 ||
      (pageSizeField >= 512 &&
        pageSizeField <= 32_768 &&
        (pageSizeField & (pageSizeField - 1)) === 0)
    const pageSize = pageSizeField === 1 ? 65_536 : pageSizeField
    if (!validPageSize || size < pageSize) {
      throw storageError('STORAGE_NOT_A_DATABASE', {})
    }
  } finally {
    closeSync(fd)
  }
}

/** Open (or create) storage at the configured path and run the startup sequence. */
export function openStorage(config: OpenStorageConfig): Storage {
  return openStorageWithDriver(config)
}

/**
 * Idempotent bounded close. A final PASSIVE checkpoint is an observation —
 * never a close failure.
 */
export function closeStorage(storage: Storage): void {
  if (storage.closed) return
  storage.closed = true
  openWritePaths.delete(storage.absPath.toLowerCase())
  try {
    storage.driver.pragma('wal_checkpoint(PASSIVE)')
  } catch {
    // Observation only.
  }
  const driver = storage.driver as DriverConnection
  if (typeof driver.close === 'function') {
    try {
      driver.close()
    } catch {
      // Best-effort close.
    }
  }
}

/** Result of `verifyStorage` (typed; refusals throw). */
export interface VerifyResult {
  schemaVersion: number
  quickCheck: 'ok'
  integrityCheck: 'ok'
}

/**
 * `quick_check`/`integrity_check` + version/drift gates over an open handle or
 * a database path (read-only). A backup newer than the packaged maximum
 * refuses exactly like `STORAGE_SCHEMA_AHEAD`.
 */
export function verifyStorage(storageOrPath: Storage | string): VerifyResult {
  let driver: DriverConnection
  let owns = false
  if (typeof storageOrPath === 'string') {
    const absPath = resolve(storageOrPath)
    // Total refusal discipline (AC2): the same header/short-file gate applies,
    // so no read-only fallback reaches a non-database or anomalous pairing.
    let stats: Stats
    try {
      stats = statSync(absPath)
    } catch {
      throw storageError('STORAGE_NOT_A_DATABASE', {})
    }
    if (!stats.isFile() || stats.size === 0) {
      throw storageError('STORAGE_NOT_A_DATABASE', {})
    }
    assertSqliteHeader(absPath, stats.size)
    driver = realConnect(absPath, { readonly: true })
    owns = true
  } else {
    if (storageOrPath.closed) throw storageError('STORAGE_CLOSED', {})
    driver = storageOrPath.driver as DriverConnection
  }
  try {
    let quick: unknown
    let integrity: unknown
    try {
      quick = driver.pragma('quick_check')
      integrity = driver.pragma('integrity_check')
    } catch (error) {
      const code = driverCodeOf(error)
      if (code === 'SQLITE_NOTADB') throw storageError('STORAGE_NOT_A_DATABASE', {})
      throw storageError('STORAGE_CORRUPT', {})
    }
    if (firstRowValue(quick) !== 'ok' || firstRowValue(integrity) !== 'ok') {
      throw storageError('STORAGE_CORRUPT', {})
    }
    const set = loadMigrationSet(packagedMigrationDir())
    const applied = readAppliedMigrations(driver)
    resolvePendingMigrations(set, applied)
    const schemaVersion = applied.reduce((max, row) => Math.max(max, row.version), 0)
    return { schemaVersion, quickCheck: 'ok', integrityCheck: 'ok' }
  } finally {
    if (owns && typeof driver.close === 'function') {
      try {
        driver.close()
      } catch {
        // Best-effort close.
      }
    }
  }
}

/** Checkpoint modes (typed mapping onto `wal_checkpoint(...)`). */
export type CheckpointMode = 'PASSIVE' | 'FULL' | 'RESTART' | 'TRUNCATE'

const CHECKPOINT_MODES: readonly CheckpointMode[] = ['PASSIVE', 'FULL', 'RESTART', 'TRUNCATE']

/** Run `wal_checkpoint(mode)` with typed mapping. */
export function checkpoint(storage: Storage, mode: CheckpointMode): void {
  if (storage.closed) throw storageError('STORAGE_CLOSED', {})
  if (!CHECKPOINT_MODES.includes(mode)) {
    throw storageError('STORAGE_ARGUMENT_INVALID', { fieldPath: 'mode' })
  }
  try {
    storage.driver.pragma(`wal_checkpoint(${mode})`)
  } catch (error) {
    if (error instanceof StorageError) throw error
    throw fromDriverError(error, { fallback: 'os-error' })
  }
}

/** Absolute database path helper for tests and operators (never in diagnostics). */
export function storagePathFor(config: OpenStorageConfig): string {
  return join(
    resolve(config.storageRoot),
    requireBoundedText(config.databaseFileName, 'databaseFileName', 4096),
  )
}
