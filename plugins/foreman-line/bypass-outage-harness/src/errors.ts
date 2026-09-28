/**
 * FK-P17′ closed harness error registry (spec T7).
 *
 * Standing constraint #1: every external boundary (child processes, foreign
 * package calls, fs) rethrows as a typed `HarnessError` — never a bare string
 * or an untyped error crossing the harness boundary.
 */

export const HARNESS_ERROR_CODES = [
  'VECTOR_FIXTURE_MALFORMED',
  'CHANNEL_SETUP_FAILED',
  'CHANNEL_EXEC_FAILED',
  'SIGNAL_AMBIGUOUS',
  'EVIDENCE_WRITE_FAILED',
  'MEASUREMENT_INCOMPLETE',
  'PIN_DRIFT',
  'FK2_REFERENCE_DRIFT',
  'READ_ONLY_SURFACE_VIOLATION',
  'HOST_FACTS_UNAVAILABLE',
  'INSTRUMENT_UNREACHABLE',
] as const

export type HarnessErrorCode = (typeof HARNESS_ERROR_CODES)[number]

export class HarnessError extends Error {
  readonly code: HarnessErrorCode
  readonly details: Readonly<Record<string, unknown>>

  constructor(code: HarnessErrorCode, message: string, details: Record<string, unknown> = {}) {
    super(message)
    this.name = 'HarnessError'
    this.code = code
    this.details = details
  }
}

/** Narrowing read of an unknown error's `code` field (never an inline cast). */
export function errorCodeOf(err: unknown): string | null {
  if (typeof err === 'object' && err !== null && 'code' in err && typeof err.code === 'string') {
    return err.code
  }
  return null
}

/**
 * Wrap an external call, rethrowing any failure as a typed HarnessError
 * (standing constraint #1). The original error is retained under `details.cause`.
 */
export function wrapExternal<T>(code: HarnessErrorCode, what: string, fn: () => T): T {
  try {
    return fn()
  } catch (err) {
    throw new HarnessError(code, `${what}: ${err instanceof Error ? err.message : String(err)}`, {
      cause: err instanceof Error ? err.message : String(err),
    })
  }
}

/** Async variant of `wrapExternal`. */
export async function wrapExternalAsync<T>(
  code: HarnessErrorCode,
  what: string,
  fn: () => Promise<T>,
): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    if (err instanceof HarnessError) throw err
    throw new HarnessError(code, `${what}: ${err instanceof Error ? err.message : String(err)}`, {
      cause: err instanceof Error ? err.message : String(err),
    })
  }
}
