/**
 * FK-P11 typed error surface (T10): one closed `ImportError` registry of
 * exactly 13 codes with bounded safe diagnostics (F05.10).
 *
 * Safe-diagnostic discipline: no driver message text, host path, row content,
 * credential, seam message text, or unbounded value can reach a caller. Each
 * code carries exactly the declared diagnostic members (fault-injection tested
 * per code). The `Error.message` is the code literal alone.
 *
 * Error-laundering discipline (the three-instance class, exit annex §5):
 * HARNESS_*-branded seam errors rethrow UNWRAPPED — harness failures are never
 * laundered into product errors — and a named refusal never surfaces as
 * `STORAGE_FAILURE` (ERR-01..03 are failing-when-broken).
 */

/** The closed 13-code registry (T10 order). */
export const IMPORT_ERROR_CODES = [
  'IMPORT_ARGUMENT_INVALID',
  'IMPORT_LIMIT_EXCEEDED',
  'IMPORT_SOURCE_DIGEST_MISMATCH',
  'IMPORT_COMMIT_OUT_OF_LINEAGE',
  'IMPORT_EPOCH_EXISTS',
  'IMPORT_APPROVAL_UNEVIDENCED',
  'IMPORT_STATUS_UNKNOWN',
  'DIVERGENCE_STOP',
  'CURSOR_ID_UNREGISTERED',
  'PROJECTION_INPUT_NONCANONICAL',
  'PROJECTION_STATE_INVALID',
  'LINEAGE_READER_FAILURE',
  'STORAGE_FAILURE',
] as const

export type ImportErrorCode = (typeof IMPORT_ERROR_CODES)[number]

/** Derived registry size (the 13-code claim is derived, never hand-typed). */
export const IMPORT_ERROR_CODE_COUNT: number = IMPORT_ERROR_CODES.length

/** Closed `DIVERGENCE_STOP` reasonCode enum (T5). */
export const DIVERGENCE_REASON_CODES = [
  'ratification-fact',
  'human-gate-fact',
  'status',
  'revision',
  'lease',
  'pending-transition',
  'wakeup-handoff',
  'idempotency',
  'existing-state-collision',
  'projection-source-drift',
] as const

export type DivergenceReasonCode = (typeof DIVERGENCE_REASON_CODES)[number]

/** Closed reason literals for `IMPORT_APPROVAL_UNEVIDENCED` (T10). */
export const APPROVAL_REFUSAL_REASONS = [
  'provenance-absent',
  'blob-absent',
  'claim-required-missing',
] as const

export type ApprovalRefusalReason = (typeof APPROVAL_REFUSAL_REASONS)[number]

/** Closed reason literals for `CURSOR_ID_UNREGISTERED` (T10). */
export const CURSOR_REFUSAL_REASONS = ['unregistered', 'reserved'] as const

export type CursorRefusalReason = (typeof CURSOR_REFUSAL_REASONS)[number]

/** Declared bounded diagnostic members per registry code (F05.10 table). */
export interface ImportDiagnosticMembers {
  IMPORT_ARGUMENT_INVALID: { fieldPath: string }
  IMPORT_LIMIT_EXCEEDED: { field: string; bound: number }
  IMPORT_SOURCE_DIGEST_MISMATCH: { rowId: string; fieldId: string }
  IMPORT_COMMIT_OUT_OF_LINEAGE: { commitId: string }
  IMPORT_EPOCH_EXISTS: { rootCommit: string; epochId: string }
  IMPORT_APPROVAL_UNEVIDENCED: { rowId: string; reason: ApprovalRefusalReason }
  IMPORT_STATUS_UNKNOWN: Record<string, never>
  DIVERGENCE_STOP: { reasonCode: DivergenceReasonCode; goalId: string; fieldId: string }
  CURSOR_ID_UNREGISTERED: { projectionId: string; reason: CursorRefusalReason }
  PROJECTION_INPUT_NONCANONICAL: { field: string }
  PROJECTION_STATE_INVALID: Record<string, never>
  LINEAGE_READER_FAILURE: { readerCode: string }
  STORAGE_FAILURE: { storageCode: string }
}

export type ImportDiagnostic<C extends ImportErrorCode> = ImportDiagnosticMembers[C]

/** Registry metadata per code (the declared safe-diagnostic shape). */
export const IMPORT_ERROR_REGISTRY: {
  readonly [C in ImportErrorCode]: {
    readonly diagnosticMembers: readonly (keyof ImportDiagnosticMembers[C])[]
  }
} = {
  IMPORT_ARGUMENT_INVALID: { diagnosticMembers: ['fieldPath'] },
  IMPORT_LIMIT_EXCEEDED: { diagnosticMembers: ['field', 'bound'] },
  IMPORT_SOURCE_DIGEST_MISMATCH: { diagnosticMembers: ['rowId', 'fieldId'] },
  IMPORT_COMMIT_OUT_OF_LINEAGE: { diagnosticMembers: ['commitId'] },
  IMPORT_EPOCH_EXISTS: { diagnosticMembers: ['rootCommit', 'epochId'] },
  IMPORT_APPROVAL_UNEVIDENCED: { diagnosticMembers: ['rowId', 'reason'] },
  IMPORT_STATUS_UNKNOWN: { diagnosticMembers: [] },
  DIVERGENCE_STOP: { diagnosticMembers: ['reasonCode', 'goalId', 'fieldId'] },
  CURSOR_ID_UNREGISTERED: { diagnosticMembers: ['projectionId', 'reason'] },
  PROJECTION_INPUT_NONCANONICAL: { diagnosticMembers: ['field'] },
  PROJECTION_STATE_INVALID: { diagnosticMembers: [] },
  LINEAGE_READER_FAILURE: { diagnosticMembers: ['readerCode'] },
  STORAGE_FAILURE: { diagnosticMembers: ['storageCode'] },
}

const ID_LIKE_RE = /^[A-Za-z0-9._:-]{1,128}$/
const FIELD_PATH_RE = /^[A-Za-z0-9._[\]-]{1,128}$/
const READER_CODE_RE = /^[A-Za-z0-9_-]{1,64}$/

/**
 * Typed error carrying exactly one registry code and its bounded safe
 * diagnostic. The message is the code literal alone (F05.10).
 */
export class ImportError extends Error {
  readonly code: ImportErrorCode
  readonly diagnostic: Readonly<Record<string, string | number>>

  constructor(code: ImportErrorCode, diagnostic: Record<string, string | number> = {}) {
    super(code)
    this.name = 'ImportError'
    this.code = code
    this.diagnostic = Object.freeze({ ...diagnostic })
  }
}

function assertDiagnostic(
  code: ImportErrorCode,
  diagnostic: Record<string, string | number>,
): void {
  const declared = IMPORT_ERROR_REGISTRY[code].diagnosticMembers
  const provided = Object.keys(diagnostic)
  if (provided.length !== declared.length) {
    throw new Error(`ImportError(${code}): diagnostic member count mismatch`)
  }
  for (const member of declared) {
    if (!(member in diagnostic)) {
      throw new Error(`ImportError(${code}): missing diagnostic member ${String(member)}`)
    }
  }
  switch (code) {
    case 'IMPORT_ARGUMENT_INVALID':
    case 'PROJECTION_INPUT_NONCANONICAL':
      if (
        typeof diagnostic.fieldPath === 'string'
          ? !FIELD_PATH_RE.test(diagnostic.fieldPath)
          : typeof diagnostic.field !== 'string' || !FIELD_PATH_RE.test(diagnostic.field)
      ) {
        throw new Error(`ImportError(${code}): unbounded field diagnostic`)
      }
      break
    case 'IMPORT_LIMIT_EXCEEDED': {
      const bound = diagnostic.bound
      if (
        typeof diagnostic.field !== 'string' ||
        !FIELD_PATH_RE.test(diagnostic.field) ||
        typeof bound !== 'number' ||
        !Number.isSafeInteger(bound) ||
        bound < 0
      ) {
        throw new Error('ImportError(IMPORT_LIMIT_EXCEEDED): unbounded diagnostic')
      }
      break
    }
    case 'IMPORT_SOURCE_DIGEST_MISMATCH':
      if (
        !ID_LIKE_RE.test(String(diagnostic.rowId)) ||
        !FIELD_PATH_RE.test(String(diagnostic.fieldId))
      ) {
        throw new Error('ImportError(IMPORT_SOURCE_DIGEST_MISMATCH): unbounded diagnostic')
      }
      break
    case 'IMPORT_COMMIT_OUT_OF_LINEAGE':
      if (!ID_LIKE_RE.test(String(diagnostic.commitId))) {
        throw new Error('ImportError(IMPORT_COMMIT_OUT_OF_LINEAGE): unbounded diagnostic')
      }
      break
    case 'IMPORT_EPOCH_EXISTS':
      if (
        !ID_LIKE_RE.test(String(diagnostic.rootCommit)) ||
        !ID_LIKE_RE.test(String(diagnostic.epochId))
      ) {
        throw new Error('ImportError(IMPORT_EPOCH_EXISTS): unbounded diagnostic')
      }
      break
    case 'IMPORT_APPROVAL_UNEVIDENCED':
      if (
        !ID_LIKE_RE.test(String(diagnostic.rowId)) ||
        !(APPROVAL_REFUSAL_REASONS as readonly string[]).includes(String(diagnostic.reason))
      ) {
        throw new Error('ImportError(IMPORT_APPROVAL_UNEVIDENCED): unbounded diagnostic')
      }
      break
    case 'DIVERGENCE_STOP':
      if (
        !(DIVERGENCE_REASON_CODES as readonly string[]).includes(String(diagnostic.reasonCode)) ||
        !ID_LIKE_RE.test(String(diagnostic.goalId)) ||
        !FIELD_PATH_RE.test(String(diagnostic.fieldId))
      ) {
        throw new Error('ImportError(DIVERGENCE_STOP): unbounded diagnostic')
      }
      break
    case 'CURSOR_ID_UNREGISTERED':
      if (
        !ID_LIKE_RE.test(String(diagnostic.projectionId)) ||
        !(CURSOR_REFUSAL_REASONS as readonly string[]).includes(String(diagnostic.reason))
      ) {
        throw new Error('ImportError(CURSOR_ID_UNREGISTERED): unbounded diagnostic')
      }
      break
    case 'LINEAGE_READER_FAILURE':
      if (!READER_CODE_RE.test(String(diagnostic.readerCode))) {
        throw new Error('ImportError(LINEAGE_READER_FAILURE): unbounded diagnostic')
      }
      break
    case 'STORAGE_FAILURE':
      if (!READER_CODE_RE.test(String(diagnostic.storageCode))) {
        throw new Error('ImportError(STORAGE_FAILURE): unbounded diagnostic')
      }
      break
    case 'IMPORT_STATUS_UNKNOWN':
    case 'PROJECTION_STATE_INVALID':
      break
  }
}

/** Factory: construct a typed `ImportError` with shape-checked diagnostic. */
export function importError<C extends ImportErrorCode>(
  code: C,
  diagnostic: ImportDiagnosticMembers[C] &
    Record<string, string | number> = {} as ImportDiagnosticMembers[C],
): ImportError {
  assertDiagnostic(code, diagnostic)
  return new ImportError(code, diagnostic)
}

/** Narrowing guard: an `ImportError` raised by this package. */
export function isImportError(value: unknown): value is ImportError {
  return value instanceof ImportError
}

/** Narrowing guard: a HARNESS_*-branded harness failure (never a product error). */
export function isHarnessFailure(value: unknown): boolean {
  return (
    value !== null &&
    typeof value === 'object' &&
    'code' in value &&
    typeof (value as { code: unknown }).code === 'string' &&
    (value as { code: string }).code.startsWith('HARNESS_')
  )
}

/**
 * Substrate-seam rethrow: FK-P9 `StorageError` becomes
 * `STORAGE_FAILURE` carrying the code literal only; an `ImportError` passes
 * through unchanged (a named refusal is NEVER erased); a HARNESS_* failure
 * rethrows unwrapped; anything else rethrows unwrapped (a programming fault is
 * not laundered into a product error).
 */
export function rethrowSubstrate(value: unknown): never {
  if (isImportError(value)) throw value
  if (isHarnessFailure(value)) throw value
  if (
    value !== null &&
    typeof value === 'object' &&
    'code' in value &&
    typeof (value as { code: unknown }).code === 'string' &&
    (value as { code: string }).code.startsWith('STORAGE_')
  ) {
    throw importError('STORAGE_FAILURE', { storageCode: (value as { code: string }).code })
  }
  throw value
}
