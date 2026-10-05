/**
 * Typed root-refusal error (P2b-i, extending P2a's Q4 per-package convention:
 * `<Domain>RootUnresolvedError`, no shared package, no `contracts/` edit).
 *
 * `root-absent` fires at the CLI seam (`--repo-root` missing — exit 2, PCC-P0
 * usage, nothing written); `root-not-absolute` fires at every library seam
 * (P2b-i path-guard ruling / AC6): a relative root would silently anchor
 * derived paths to `process.cwd()` (mechanism class 5) and is refused before
 * any path is constructed.
 */
import { isAbsolute } from 'node:path'

export class ApprovalRootUnresolvedError extends Error {
  /** PCC-P0 usage exit code. */
  readonly code = 2 as const
  readonly reason: 'root-absent' | 'root-not-a-directory' | 'root-not-absolute'

  constructor(reason: ApprovalRootUnresolvedError['reason'], message: string) {
    super(message)
    this.name = 'ApprovalRootUnresolvedError'
    this.reason = reason
  }
}

/**
 * Assert `root` is an absolute path (P2b-i path-guard ruling). Relative roots
 * are refused with a typed error naming the seam — never silently resolved
 * against the process cwd (mechanism class 5).
 */
export function assertAbsoluteRoot(root: string, seam: string): void {
  if (!isAbsolute(root)) {
    throw new ApprovalRootUnresolvedError(
      'root-not-absolute',
      `${seam}: repoRoot '${root}' is not an absolute path; a relative root would silently anchor to the process cwd and is refused (P2b-i / D19)`,
    )
  }
}
