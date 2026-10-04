/**
 * Closed error registry for the spec-body compiler (FK-P2).
 *
 * Every rejection shape the compiler can produce has exactly one named code
 * from this registry (default-deny #30); the registry is closed — no code
 * outside {@link SCOPE_COMPILE_ERROR_CODES} can be raised as a compile
 * rejection. `ScopeIoError` is seam-infrastructure typing (standing #1) for
 * unexpected I/O failures at the `verifyCompiledPaths` seam and the pin test's
 * file read; it is NOT a compile rejection code.
 */
export const SCOPE_COMPILE_ERROR_CODES = [
  'SPEC_SECTION_MISSING',
  'SPEC_SECTION_EMPTY',
  'SPEC_SECTION_DUPLICATE',
  'MISSING_AUTHORITY',
  'BODY_NOT_UTF8',
  'BODY_TOO_LARGE',
  'MALFORMED_ENTRY',
  'ENTRY_EMPTY',
  'ENTRY_WHITESPACE',
  'GLOB_ENTRY',
  'ENTRY_ABSOLUTE',
  'ENTRY_BACKSLASH',
  'ENTRY_EMPTY_SEGMENT',
  'PATH_TRAVERSAL',
  'ENTRY_ENCODED_ESCAPE',
  'ENTRY_ADS_COLON',
  'ENTRY_SHORT_NAME',
  'ENTRY_RESERVED_NAME',
  'ENTRY_TRAILING_DOT_SPACE',
  'ENTRY_NULL_BYTE',
  'ENTRY_CONTROL_CHAR',
  'ENTRY_FORMAT_CHAR',
  'ENTRY_UNPAIRED_SURROGATE',
  'ENTRY_NON_NFC',
  'ENTRY_DUPLICATE',
  'ENTRY_EQUIVALENT',
  'ENTRY_TOO_LONG',
  'SEGMENT_TOO_LONG',
  'TOO_MANY_SEGMENTS',
  'TOO_MANY_ENTRIES',
  'LINK_ESCAPE',
  'LINK_IN_ROOT',
  'LINK_TARGET_RACE',
  'ENTRY_CONFLICTS_WITH_FORBIDDEN',
  'GRAMMAR_PIN_MISMATCH',
] as const

export type ScopeCompileErrorCode = (typeof SCOPE_COMPILE_ERROR_CODES)[number]

/** Which compiled list a failing entry belongs to. */
export type EntryList = 'allowed' | 'frozen' | 'forbidden'

export interface ScopeCompileErrorDetails {
  /** Body-order index of the failing entry; null for body/cross-entry failures. */
  readonly entryIndex?: number | null
  /** Which list the failing entry belongs to; null for body-level failures. */
  readonly entryList?: EntryList | null
}

/** The single typed rejection error: exactly one registry code per rejection. */
export class ScopeCompileError extends Error {
  readonly code: ScopeCompileErrorCode
  readonly entryIndex: number | null
  readonly entryList: EntryList | null

  constructor(
    code: ScopeCompileErrorCode,
    message: string,
    details: ScopeCompileErrorDetails = {},
  ) {
    super(message)
    this.name = 'ScopeCompileError'
    this.code = code
    this.entryIndex = details.entryIndex ?? null
    this.entryList = details.entryList ?? null
  }
}

/** Typed wrapper for unexpected I/O failures at the package's named seams (standing #1). */
export class ScopeIoError extends Error {
  override readonly cause: unknown

  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'ScopeIoError'
    this.cause = cause
  }
}
