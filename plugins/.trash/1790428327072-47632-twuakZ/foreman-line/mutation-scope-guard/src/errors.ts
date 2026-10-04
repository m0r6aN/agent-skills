/**
 * WF-P27 refusal shape, mirroring `evaluateRouting`'s `RoutingError` precedent
 * (dispatch/src/routing-eval/index.ts): a typed, coded `Error` subclass, never
 * a returned `{ verdict, reason }` object on the refusal path (spec AC6).
 */

/** The closed set of refusal codes this guard throws. */
export type MutationScopeErrorCode =
  | 'OUT_OF_SCOPE'
  | 'SCOPE_ENVELOPE_MISMATCH'
  | 'SCOPE_ENVELOPE_CONTRADICTION'
  | 'MALFORMED_PATH'

/**
 * Thrown on any mutation-scope refusal. `code` is restricted to the four
 * values above; `paths` carries the violating path(s) as a field, per AC6.
 */
export class MutationScopeError extends Error {
  readonly code: MutationScopeErrorCode
  readonly paths: readonly string[]

  constructor(code: MutationScopeErrorCode, paths: readonly string[], message: string) {
    super(message)
    this.name = 'MutationScopeError'
    this.code = code
    this.paths = paths
  }
}
