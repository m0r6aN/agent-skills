/**
 * Versioned transactional migration ABI (FK-P9 startup steps 5–7).
 *
 * Packaged-set validation (gapless from 1, unique, each file present) refuses
 * with `STORAGE_MIGRATION_SET_INVALID`; a database whose max applied version
 * exceeds the packaged maximum refuses with `STORAGE_SCHEMA_AHEAD` (no
 * downgrade, no partial open, no bypass); a recorded digest that does not match
 * its packaged file, or an applied row whose packaged file is missing, refuses
 * with `STORAGE_MIGRATION_DRIFT` (history is never rewritten).
 *
 * Each pending migration runs alone inside `BEGIN IMMEDIATE` … `COMMIT`
 * containing its DDL AND its `schema_migrations` ledger insert (one
 * transaction, so a ledger row can never exist without its schema). Any
 * failure rolls back and refuses the open with `STORAGE_MIGRATION_FAILED`;
 * the database stays at the last committed version and a rerun completes.
 * Disallowed non-transactional statements (`VACUUM`, `ATTACH`, `DETACH`,
 * `PRAGMA`) are refused at set validation — also `STORAGE_MIGRATION_FAILED`.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { digestBytes } from './canonical.js'
import type { Clock } from './clock.js'
import { driverCodeOf, fromDriverError, StorageError, storageError } from './errors.js'
import { isId, isRecord } from './schema.js'

/** One packaged migration file. `digest` is over the raw file bytes (no BOM). */
export interface MigrationFile {
  version: number
  name: string
  digest: string
  sql: string
}

/** A `schema_migrations` ledger row, normalized at the boundary. */
export interface AppliedMigration {
  version: number
  name: string
  digest: string
  appliedAtMicros: number
}

const MIGRATION_FILE_RE = /^([0-9]{4})-([A-Za-z0-9._-]+)[.]sql$/
const DISALLOWED_STATEMENT_RE = /\b(VACUUM|ATTACH|DETACH|PRAGMA)\b/i

/** Minimal driver surface the migration machinery needs (test-injectable). */
export interface MigrationDriver {
  exec(sql: string): void
  prepare(sql: string): {
    run(...params: unknown[]): { changes: number }
    get(...params: unknown[]): unknown
    all(...params: unknown[]): unknown[]
  }
  pragma(source: string): unknown
}

/**
 * Strip SQL comments with a linear char scan (no regex escapes, no
 * backtracking): line comments run to the next newline, block comments to the
 * next terminator, string spans pass through. Used only for the
 * disallowed-statement detection.
 */
function stripSqlComments(sql: string): string {
  let out = ''
  let i = 0
  while (i < sql.length) {
    const char = sql[i] as string
    const next = i + 1 < sql.length ? (sql[i + 1] as string) : ''
    if (char === '-' && next === '-') {
      while (i < sql.length && sql.charCodeAt(i) !== 10) i += 1
      continue
    }
    if (char === '/' && next === '*') {
      i += 2
      while (i < sql.length && !(sql[i] === '*' && sql[i + 1] === '/')) i += 1
      i += 2
      continue
    }
    if (char === "'" || char === '"') {
      out += char
      i += 1
      while (i < sql.length) {
        out += sql[i] as string
        if (sql[i] === char) {
          if (i + 1 < sql.length && sql[i + 1] === char) {
            out += char
            i += 2
            continue
          }
          i += 1
          break
        }
        i += 1
      }
      continue
    }
    out += char
    i += 1
  }
  return out
}

const WORD_CHAR_RE = /[A-Za-z0-9_]/

/**
 * Split a migration body into top-level statements. Naive `;` splitting would
 * tear `CREATE TRIGGER … BEGIN …; … END` bodies apart, so the scanner tracks
 * string/quoted-identifier/comment spans and `BEGIN`…`END` depth (migration SQL
 * must not use `CASE`…`END`, which shares the closer — it is not needed by any
 * packaged migration). Linear-time (constraint #5).
 */
export function splitSqlStatements(sql: string): string[] {
  const statements: string[] = []
  let current = ''
  let depth = 0
  let i = 0
  while (i < sql.length) {
    const char = sql[i] as string
    const next = i + 1 < sql.length ? (sql[i + 1] as string) : ''
    if (char === '-' && next === '-') {
      const end = sql.indexOf('\n', i)
      const stop = end === -1 ? sql.length : end + 1
      current += sql.slice(i, stop)
      i = stop
      continue
    }
    if (char === '/' && next === '*') {
      const end = sql.indexOf('*/', i + 2)
      const stop = end === -1 ? sql.length : end + 2
      current += sql.slice(i, stop)
      i = stop
      continue
    }
    if (char === "'" || char === '"') {
      let j = i + 1
      while (j < sql.length) {
        if (sql[j] === char) {
          if (j + 1 < sql.length && sql[j + 1] === char) {
            j += 2
            continue
          }
          j += 1
          break
        }
        j += 1
      }
      current += sql.slice(i, j)
      i = j
      continue
    }
    if (WORD_CHAR_RE.test(char) && (i === 0 || !WORD_CHAR_RE.test(sql[i - 1] as string))) {
      let j = i
      while (j < sql.length && WORD_CHAR_RE.test(sql[j] as string)) j += 1
      const word = sql.slice(i, j)
      if (/^BEGIN$/i.test(word)) depth += 1
      if (/^END$/i.test(word) && depth > 0) depth -= 1
      current += word
      i = j
      continue
    }
    if (char === ';' && depth === 0) {
      if (current.trim().length > 0) statements.push(current.trim())
      current = ''
      i += 1
      continue
    }
    current += char
    i += 1
  }
  if (current.trim().length > 0) statements.push(current.trim())
  return statements
}

/**
 * Load and validate a packaged migration set from `dir`. Refusals:
 * unparseable/duplicate/gapped versions → `STORAGE_MIGRATION_SET_INVALID`
 * (version literal `0` names an unversioned file); a disallowed
 * non-transactional statement → `STORAGE_MIGRATION_FAILED` at set validation.
 */
export function loadMigrationSet(dir: string): MigrationFile[] {
  let entries: string[]
  try {
    entries = readdirSync(dir).sort()
  } catch {
    throw storageError('STORAGE_MIGRATION_SET_INVALID', { version: 0 })
  }
  const files: MigrationFile[] = []
  for (const entry of entries) {
    const match = MIGRATION_FILE_RE.exec(entry)
    if (match === null) {
      if (entry.endsWith('.sql'))
        throw storageError('STORAGE_MIGRATION_SET_INVALID', { version: 0 })
      continue
    }
    const version = Number.parseInt(match[1] as string, 10)
    const name = match[2] as string
    if (!isId(name) || name.length > 128) {
      throw storageError('STORAGE_MIGRATION_SET_INVALID', { version })
    }
    let bytes: Buffer
    try {
      bytes = readFileSync(join(dir, entry))
    } catch {
      throw storageError('STORAGE_MIGRATION_SET_INVALID', { version })
    }
    if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
      throw storageError('STORAGE_MIGRATION_SET_INVALID', { version })
    }
    const sql = bytes.toString('utf8')
    if (DISALLOWED_STATEMENT_RE.test(stripSqlComments(sql))) {
      throw storageError('STORAGE_MIGRATION_FAILED', { version })
    }
    files.push({ version, name, digest: digestBytes(new Uint8Array(bytes)), sql })
  }
  files.sort((a, b) => a.version - b.version)
  for (let i = 0; i < files.length; i += 1) {
    const file = files[i] as MigrationFile
    if (file.version !== i + 1) {
      throw storageError('STORAGE_MIGRATION_SET_INVALID', { version: file.version })
    }
  }
  return files
}

/** Read the `schema_migrations` ledger, normalizing driver rows at the boundary. */
export function readAppliedMigrations(driver: MigrationDriver): AppliedMigration[] {
  let rows: unknown[]
  try {
    rows = driver
      .prepare('SELECT version, name, digest, applied_at_micros FROM schema_migrations')
      .all()
  } catch (error) {
    // The ledger table exists only after 0001; an empty read is the pre-0001 state.
    if (isMissingTableError(error)) return []
    throw fromDriverError(error, { fallback: 'os-error' })
  }
  return rows.map((row) => {
    if (!isRecord(row)) {
      throw storageError('STORAGE_IO_FAILURE', { driverCode: 'row-normalization' })
    }
    const version = row.version
    const name = row.name
    const digest = row.digest
    const appliedAtMicros = row.applied_at_micros
    if (
      typeof version !== 'number' ||
      typeof name !== 'string' ||
      typeof digest !== 'string' ||
      typeof appliedAtMicros !== 'number'
    ) {
      throw storageError('STORAGE_IO_FAILURE', { driverCode: 'row-normalization' })
    }
    return { version, name, digest, appliedAtMicros }
  })
}

function isMissingTableError(error: unknown): boolean {
  const code = driverCodeOf(error)
  return code === 'SQLITE_ERROR' || code === 'SQLITE_CANTOPEN'
}

/**
 * Startup gates over the applied ledger and the packaged set (first-failure
 * order: set validation already happened at load; here: schema-ahead, then
 * drift). Returns the pending migrations, ascending.
 */
export function resolvePendingMigrations(
  set: readonly MigrationFile[],
  applied: readonly AppliedMigration[],
): MigrationFile[] {
  const packagedMax = set.length === 0 ? 0 : (set[set.length - 1] as MigrationFile).version
  const appliedMax = applied.reduce((max, row) => Math.max(max, row.version), 0)
  if (appliedMax > packagedMax) {
    throw storageError('STORAGE_SCHEMA_AHEAD', {
      databaseVersion: appliedMax,
      packagedVersion: packagedMax,
    })
  }
  const setByVersion = new Map<number, MigrationFile>()
  for (const file of set) setByVersion.set(file.version, file)
  for (const row of applied) {
    // Identity = (version, name, digest): the applied row's packaged file must
    // exist under the same name and bytes. A renamed or replaced file means the
    // recorded row's packaged file is missing — drift, never a rewrite.
    const packaged = setByVersion.get(row.version)
    if (packaged === undefined || packaged.name !== row.name || packaged.digest !== row.digest) {
      throw storageError('STORAGE_MIGRATION_DRIFT', { version: row.version, name: row.name })
    }
  }
  return set.filter((file) => file.version > appliedMax)
}

/** Hooks for the interrupted-migration fixtures (test seam on the internal path). */
export interface MigrationHooks {
  /** Called before each statement of a migration body, inside its transaction. */
  beforeStatement?: (info: { version: number; statementIndex: number; statement: string }) => void
  /** Test seam: alternative packaged-set directory (MIG/SKEW fixtures). */
  migrationDir?: string
}

/**
 * Apply one migration atomically: `BEGIN IMMEDIATE`, its DDL, and its ledger
 * insert in a single transaction. The applied ledger is re-checked under the
 * write lock (single-apply: CONC-03's loser observes the migrated state and
 * skips). Any failure rolls back; capacity exhaustion surfaces
 * `STORAGE_DISK_FULL`, everything else refuses with `STORAGE_MIGRATION_FAILED`
 * (version literal only). The database stays at the last committed version.
 *
 * SQLite's documented ALTER TABLE procedure applies: schema rebuilds (0002
 * adds the goals status CHECK) cannot drop a foreign-key-referenced table with
 * enforcement on, and the toggle is a no-op inside a transaction. Enforcement
 * is therefore disabled across the migration transaction, the commit is gated
 * on `PRAGMA foreign_key_check` (violations refuse and roll back), and
 * enforcement is restored immediately after (the post-open assertion re-reads
 * it).
 */
export function applyMigration(
  driver: MigrationDriver,
  migration: MigrationFile,
  clock: Clock,
  hooks: MigrationHooks = {},
): void {
  try {
    driver.pragma('foreign_keys=OFF')
  } catch (error) {
    if (error instanceof StorageError) throw error
    throw storageError('STORAGE_MIGRATION_FAILED', { version: migration.version })
  }
  try {
    try {
      driver.exec('BEGIN IMMEDIATE')
    } catch (error) {
      if (error instanceof StorageError) throw error
      throw storageError('STORAGE_MIGRATION_FAILED', { version: migration.version })
    }
    let committed = false
    try {
      // Single-apply under the write lock (CONC-03).
      let alreadyApplied = false
      try {
        const row = driver
          .prepare('SELECT 1 AS present FROM schema_migrations WHERE version = ?')
          .get(migration.version)
        alreadyApplied = row !== undefined && row !== null
      } catch {
        // The ledger table does not exist before the first migration applies.
      }
      if (alreadyApplied) {
        driver.exec('COMMIT')
        committed = true
        return
      }
      const statements = splitSqlStatements(migration.sql)
      for (let i = 0; i < statements.length; i += 1) {
        hooks.beforeStatement?.({
          version: migration.version,
          statementIndex: i,
          statement: statements[i] as string,
        })
        driver.exec(statements[i] as string)
      }
      driver
        .prepare(
          'INSERT INTO schema_migrations (version, name, digest, applied_at_micros) VALUES (?, ?, ?, ?)',
        )
        .run(migration.version, migration.name, migration.digest, clock.nowMicros())
      // Fail-closed gate standing in for the toggled-off enforcement: any
      // foreign-key violation introduced by the migration refuses the commit.
      const violations = driver.pragma('foreign_key_check')
      if (Array.isArray(violations) && violations.length > 0) {
        throw storageError('STORAGE_MIGRATION_FAILED', { version: migration.version })
      }
      driver.exec('COMMIT')
      committed = true
    } catch (error) {
      if (!committed) {
        try {
          driver.exec('ROLLBACK')
        } catch {
          // The rollback is best-effort; WAL recovery restores the last
          // committed version regardless (startup step 7).
        }
      }
      if (error instanceof StorageError) throw error
      if (driverCodeOf(error) === 'SQLITE_FULL') {
        throw storageError('STORAGE_DISK_FULL', { driverCode: 'SQLITE_FULL' })
      }
      throw storageError('STORAGE_MIGRATION_FAILED', { version: migration.version })
    }
  } finally {
    try {
      driver.pragma('foreign_keys=ON')
    } catch {
      // Best-effort restore; the post-open assertion re-reads the value.
    }
  }
}

/** Apply all pending migrations in ascending order (startup step 6). */
export function applyPendingMigrations(
  driver: MigrationDriver,
  pending: readonly MigrationFile[],
  clock: Clock,
  hooks: MigrationHooks = {},
): void {
  for (const migration of pending) {
    applyMigration(driver, migration, clock, hooks)
  }
}
