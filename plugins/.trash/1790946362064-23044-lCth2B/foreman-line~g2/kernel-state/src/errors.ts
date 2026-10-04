/**
 * Closed `StorageErrorCode` registry (FK-P9 spec, "Error registry").
 *
 * Every failure crossing the API boundary carries exactly one code from this
 * registry plus a bounded safe diagnostic in the code's declared shape:
 * reason literal only, constraint name only, driver code literal only, version
 * numbers only, path form only (FK-P1 F05.10 discipline). No host path, row
 * content, credential, or driver message text ever reaches a caller.
 *
 * The registry is closed BY DERIVATION: `StorageErrorCode` is the key union of
 * `STORAGE_ERROR_REGISTRY`, so the type and the runtime table cannot drift, and
 * the code count is always derived from the table — never hand-typed.
 */

/** Closed reason-code enum for `STORAGE_PATH_REFUSED` / `BACKUP_DESTINATION_REFUSED`. */
export const PATH_REFUSAL_REASONS = [
  'traversal',
  'absolute',
  'backslash',
  'encoded-escape',
  'ads-colon',
  'short-name',
  'reserved-name',
  'trailing-dot-space',
  'control-char',
  'format-char',
  'unpaired-surrogate',
  'non-nfc',
  'link-component',
  'link-target',
  'not-regular',
  'outside-root',
] as const
export type PathRefusalReason = (typeof PATH_REFUSAL_REASONS)[number]

/** Closed reason-code enum for `STORAGE_CONSTRAINT_VIOLATION`. */
export const CONSTRAINT_REASONS = [
  'foreign-key',
  'append-only',
  'unique-constraint',
  'check',
] as const
export type ConstraintReason = (typeof CONSTRAINT_REASONS)[number]

/**
 * Driver code literals that may appear in a `STORAGE_IO_FAILURE`,
 * `STORAGE_DISK_FULL`, or `BACKUP_FAILED` diagnostic. `os-error` covers OS
 * errors and the catch-all; `row-normalization` covers a driver row that fails
 * boundary normalization (standing constraint #2 — rows are `unknown` until
 * normalized). Driver message text is never propagated, only these literals.
 */
export const DRIVER_CODE_LITERALS = [
  'SQLITE_FULL',
  'SQLITE_BUSY',
  'SQLITE_LOCKED',
  'SQLITE_READONLY',
  'SQLITE_CANTOPEN',
  'SQLITE_NOTADB',
  'SQLITE_CORRUPT',
  'SQLITE_IOERR',
  'SQLITE_NOMEM',
  'SQLITE_CONSTRAINT',
  'os-error',
  'row-normalization',
] as const
export type DriverCodeLiteral = (typeof DRIVER_CODE_LITERALS)[number]

/** Diagnostic shapes, keyed by registry code (the declared bounded shape per code). */
export interface StorageErrorDiagnostics {
  STORAGE_PATH_REFUSED: { reasonCode: PathRefusalReason }
  STORAGE_ABSENT: Record<string, never>
  STORAGE_NOT_A_DATABASE: Record<string, never>
  STORAGE_CORRUPT: Record<string, never>
  STORAGE_WAL_UNAVAILABLE: { mode: string }
  STORAGE_SCHEMA_AHEAD: { databaseVersion: number; packagedVersion: number }
  STORAGE_MIGRATION_DRIFT: { version: number; name: string }
  STORAGE_MIGRATION_SET_INVALID: { version: number }
  STORAGE_MIGRATION_FAILED: { version: number }
  STORAGE_LOCK_TIMEOUT: { timeoutMicros: number }
  STORAGE_ALREADY_OPEN: Record<string, never>
  STORAGE_DISK_FULL: { driverCode: DriverCodeLiteral }
  STORAGE_IO_FAILURE: { driverCode: DriverCodeLiteral }
  STORAGE_CONSTRAINT_VIOLATION: { reasonCode: ConstraintReason; constraint: string }
  STORAGE_PAYLOAD_LIMIT_EXCEEDED: { field: string }
  STORAGE_ARGUMENT_INVALID: { fieldPath: string }
  STORAGE_CLOSED: Record<string, never>
  BACKUP_DESTINATION_REFUSED: { reasonCode: PathRefusalReason }
  BACKUP_FAILED: { driverCode: DriverCodeLiteral }
  BACKUP_INTEGRITY_FAILED: Record<string, never>
  EXPORT_FAILED: Record<string, never>
}

/**
 * The closed registry table. Each entry records the code's invariant (for
 * review) and the exact diagnostic member names its bounded shape allows.
 * `StorageErrorCode` is derived from these keys; tests derive the count from
 * this table and assert union/table agreement without any hand-typed literal.
 */
export const STORAGE_ERROR_REGISTRY = {
  STORAGE_PATH_REFUSED: {
    invariant: 'storage/backup/export path passes every path dimension',
    diagnosticMembers: ['reasonCode'],
  },
  STORAGE_ABSENT: {
    invariant: 'create-if-missing policy respected',
    diagnosticMembers: [],
  },
  STORAGE_NOT_A_DATABASE: {
    invariant: 'file is a SQLite database (header/short-file gate)',
    diagnosticMembers: [],
  },
  STORAGE_CORRUPT: {
    invariant: 'quick_check/integrity_check passes',
    diagnosticMembers: [],
  },
  STORAGE_WAL_UNAVAILABLE: {
    invariant: 'placement enters WAL mode',
    diagnosticMembers: ['mode'],
  },
  STORAGE_SCHEMA_AHEAD: {
    invariant: 'packaged schema version >= database max applied version',
    diagnosticMembers: ['databaseVersion', 'packagedVersion'],
  },
  STORAGE_MIGRATION_DRIFT: {
    invariant: 'every applied migration row matches its packaged file digest',
    diagnosticMembers: ['version', 'name'],
  },
  STORAGE_MIGRATION_SET_INVALID: {
    invariant: 'packaged migration set is gapless/unique/present',
    diagnosticMembers: ['version'],
  },
  STORAGE_MIGRATION_FAILED: {
    invariant: 'each migration applies atomically or not at all',
    diagnosticMembers: ['version'],
  },
  STORAGE_LOCK_TIMEOUT: {
    invariant: 'lock acquired within the busy budget',
    diagnosticMembers: ['timeoutMicros'],
  },
  STORAGE_ALREADY_OPEN: {
    invariant: 'one write handle per database path per process',
    diagnosticMembers: [],
  },
  STORAGE_DISK_FULL: {
    invariant: 'writes fail closed on capacity exhaustion',
    diagnosticMembers: ['driverCode'],
  },
  STORAGE_IO_FAILURE: {
    invariant: 'every other driver/filesystem failure (catch-all)',
    diagnosticMembers: ['driverCode'],
  },
  STORAGE_CONSTRAINT_VIOLATION: {
    invariant: 'DB-level invariants hold',
    diagnosticMembers: ['reasonCode', 'constraint'],
  },
  STORAGE_PAYLOAD_LIMIT_EXCEEDED: {
    invariant: 'event payload <= 65,536 bytes',
    diagnosticMembers: ['field'],
  },
  STORAGE_ARGUMENT_INVALID: {
    invariant: 'API inputs structurally valid',
    diagnosticMembers: ['fieldPath'],
  },
  STORAGE_CLOSED: {
    invariant: 'no operation on a closed handle',
    diagnosticMembers: [],
  },
  BACKUP_DESTINATION_REFUSED: {
    invariant: 'protected-destination rules hold',
    diagnosticMembers: ['reasonCode'],
  },
  BACKUP_FAILED: {
    invariant: 'backup completes or is deleted (no partial file survives)',
    diagnosticMembers: ['driverCode'],
  },
  BACKUP_INTEGRITY_FAILED: {
    invariant: 'produced/verified backup passes integrity + digest + version gates',
    diagnosticMembers: [],
  },
  EXPORT_FAILED: {
    invariant: 'export completes or fails typed (bounded sink faults)',
    diagnosticMembers: [],
  },
} as const satisfies Record<string, { invariant: string; diagnosticMembers: readonly string[] }>

/** The closed code union — derived from the registry table keys. */
export type StorageErrorCode = keyof typeof STORAGE_ERROR_REGISTRY

/** Every registry code, derived from the table (ordering of first declaration). */
export const STORAGE_ERROR_CODES: readonly StorageErrorCode[] = Object.keys(
  STORAGE_ERROR_REGISTRY,
) as StorageErrorCode[]

/**
 * The registry code count — derived, never hand-typed (coordinator ruling
 * 2026-09-28: union and table must agree by derivation).
 */
export const STORAGE_ERROR_CODE_COUNT: number = STORAGE_ERROR_CODES.length

/** Typed error carrying exactly one registry code and a bounded safe diagnostic. */
export class StorageError extends Error {
  readonly code: StorageErrorCode
  readonly diagnostic: Readonly<Record<string, string | number>>

  constructor(code: StorageErrorCode, diagnostic: Record<string, string | number> = {}) {
    super(`${code}${Object.keys(diagnostic).length > 0 ? ` ${JSON.stringify(diagnostic)}` : ''}`)
    this.name = 'StorageError'
    this.code = code
    // Default-deny: the diagnostic is validated against the code's declared
    // shape at construction; a wrong shape is a programming error, not a
    // caller-facing state, and fails hard here.
    assertDiagnosticShape(code, diagnostic)
    this.diagnostic = Object.freeze({ ...diagnostic })
  }
}

function assertDiagnosticShape(
  code: StorageErrorCode,
  diagnostic: Record<string, string | number>,
): void {
  const allowed: readonly string[] = STORAGE_ERROR_REGISTRY[code].diagnosticMembers
  for (const key of Object.keys(diagnostic)) {
    if (!allowed.includes(key)) {
      throw new Error(`diagnostic member '${key}' is not in the declared shape of ${code}`)
    }
  }
  for (const key of allowed) {
    if (!(key in diagnostic)) {
      throw new Error(`diagnostic member '${key}' missing from ${code}`)
    }
  }
  if ('reasonCode' in diagnostic && code === 'STORAGE_PATH_REFUSED') {
    assertClosedValue(PATH_REFUSAL_REASONS, diagnostic.reasonCode, 'reasonCode')
  }
  if ('reasonCode' in diagnostic && code === 'BACKUP_DESTINATION_REFUSED') {
    assertClosedValue(PATH_REFUSAL_REASONS, diagnostic.reasonCode, 'reasonCode')
  }
  if ('reasonCode' in diagnostic && code === 'STORAGE_CONSTRAINT_VIOLATION') {
    assertClosedValue(CONSTRAINT_REASONS, diagnostic.reasonCode, 'reasonCode')
  }
  if ('driverCode' in diagnostic) {
    assertClosedValue(DRIVER_CODE_LITERALS, diagnostic.driverCode, 'driverCode')
  }
}

function assertClosedValue(
  closed: readonly string[],
  value: string | number,
  member: string,
): void {
  if (typeof value !== 'string' || !closed.includes(value)) {
    throw new Error(`'${String(value)}' is not a closed ${member} literal`)
  }
}

/** Factory: construct a typed `StorageError` with shape-checked diagnostic. */
export function storageError(
  code: StorageErrorCode,
  diagnostic: Record<string, string | number> = {},
): StorageError {
  return new StorageError(code, diagnostic)
}

/**
 * Typed try-catch boundary (standing constraint #1): run `fn`, and rethrow any
 * non-`StorageError` failure as `code` with its bounded diagnostic — never
 * propagating the original message (driver messages can embed host paths).
 */
export function rethrowAs<C extends StorageErrorCode>(
  code: C,
  diagnostic: Record<string, string | number>,
  fn: () => void,
): void {
  try {
    fn()
  } catch (error) {
    if (error instanceof StorageError) throw error
    throw storageError(code, diagnostic)
  }
}

/** Narrowing guard: extract a string `code` member from a driver error. */
export function driverCodeOf(error: unknown): string | null {
  if (error !== null && typeof error === 'object' && 'code' in error) {
    const code = error.code
    return typeof code === 'string' ? code : null
  }
  return null
}

/** Narrowing guard: a driver `SQLITE_CONSTRAINT*` literal, or `null`. */
export function constraintCodeOf(error: unknown): string | null {
  const code = driverCodeOf(error)
  return code?.startsWith('SQLITE_CONSTRAINT') === true ? code : null
}

/** Narrowing guard: extract a string `constraintName` member, if present. */
export function constraintNameOf(error: unknown): string | null {
  if (error !== null && typeof error === 'object' && 'constraintName' in error) {
    const name = error.constraintName
    return typeof name === 'string' && name.length > 0 ? name : null
  }
  return null
}

/** Map a driver error (its `code` literal only) to a typed `StorageError`. */
export function fromDriverError(
  error: unknown,
  context: { fallback: DriverCodeLiteral },
): StorageError {
  if (error instanceof StorageError) return error
  const constraintCode = constraintCodeOf(error)
  if (constraintCode !== null) {
    const name = constraintNameOf(error) ?? 'statement'
    if (constraintCode === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
      return storageError('STORAGE_CONSTRAINT_VIOLATION', {
        reasonCode: 'foreign-key',
        constraint: name,
      })
    }
    if (constraintCode === 'SQLITE_CONSTRAINT_TRIGGER') {
      return storageError('STORAGE_CONSTRAINT_VIOLATION', {
        reasonCode: 'append-only',
        constraint: name,
      })
    }
    if (constraintCode === 'SQLITE_CONSTRAINT_CHECK') {
      return storageError('STORAGE_CONSTRAINT_VIOLATION', { reasonCode: 'check', constraint: name })
    }
    return storageError('STORAGE_CONSTRAINT_VIOLATION', {
      reasonCode: 'unique-constraint',
      constraint: name,
    })
  }
  const raw = driverCodeOf(error)
  const literal =
    raw !== null && (DRIVER_CODE_LITERALS as readonly string[]).includes(raw)
      ? (raw as DriverCodeLiteral)
      : context.fallback
  if (literal === 'SQLITE_FULL') return storageError('STORAGE_DISK_FULL', { driverCode: literal })
  return storageError('STORAGE_IO_FAILURE', { driverCode: literal })
}
