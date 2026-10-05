/**
 * Typed error and exit-code contract for the project scaffolder.
 *
 * Exit codes reuse the contract PCC-P0 froze so the plugin speaks one
 * dialect (charter §4.3):
 *   0  success
 *   1  validation failure
 *   2  usage error
 *   3  trust-invariant violation
 *   4  environment error
 *
 * Every failure is typed (a `ScaffoldErrorCode`) and every path it concerns is
 * reported through `paths`.
 */
import { isAbsolute } from 'node:path'

export type ScaffoldErrorCode =
  | 'USAGE'
  | 'VALUE_REFUSED'
  | 'CREDENTIAL_INPUT_REFUSED'
  | 'EQUIVALENT_LAYOUT_CONFLICT'
  | 'UNREPLACED_PLACEHOLDER'
  | 'MANAGED_BLOCK_MALFORMED'
  | 'PATH_TYPE_CONFLICT'
  | 'ENVIRONMENT'

export const EXIT_CODES: Readonly<Record<ScaffoldErrorCode, number>> = {
  USAGE: 2,
  VALUE_REFUSED: 1,
  CREDENTIAL_INPUT_REFUSED: 3,
  EQUIVALENT_LAYOUT_CONFLICT: 1,
  UNREPLACED_PLACEHOLDER: 1,
  MANAGED_BLOCK_MALFORMED: 1,
  PATH_TYPE_CONFLICT: 1,
  ENVIRONMENT: 4,
}

export class ScaffoldError extends Error {
  readonly code: ScaffoldErrorCode
  readonly exitCode: number
  readonly paths: readonly string[]

  constructor(code: ScaffoldErrorCode, message: string, paths: readonly string[] = []) {
    super(message)
    this.name = 'ScaffoldError'
    this.code = code
    this.exitCode = EXIT_CODES[code]
    this.paths = paths
  }
}

/**
 * Assert `root` is an absolute path (P2b-i path-guard ruling — the
 * `assertAbsoluteRoot` house form shared with shaping/approval/registration
 * post-item-1). Relative roots are refused typed at the boundary
 * (`USAGE`, PCC-P0 usage exit 2) — never silently resolved against the
 * process cwd (D19 mechanism classes 1/5).
 */
export function assertAbsoluteRoot(root: string, seam: string): void {
  if (!isAbsolute(root)) {
    throw new ScaffoldError(
      'USAGE',
      `${seam}: root '${root}' is not an absolute path; a relative root would silently anchor to the process cwd and is refused (P2b-i / D19)`,
    )
  }
}
