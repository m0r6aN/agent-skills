/**
 * Typed root-refusal error (P2b-i, extending P2a's Q4 per-package convention:
 * `<Domain>RootUnresolvedError`, no shared package, no `contracts/` edit).
 *
 * P2b-i adds the `root-not-absolute` reason (spec path-guard ruling / AC6): a
 * caller-supplied root that is not an absolute path would silently re-anchor
 * every derived path — and the containment comparison base inside
 * `assertContainedPath` — to `process.cwd()` via `path.resolve` (mechanism
 * class 5), so it is refused at the seam before any path is constructed.
 */
import { isAbsolute } from 'node:path'

export class ProjectionRootUnresolvedError extends Error {
  /** PCC-P0 usage exit code. */
  readonly code = 2 as const
  readonly reason: 'root-absent' | 'root-not-a-directory' | 'root-not-absolute'

  constructor(reason: ProjectionRootUnresolvedError['reason'], message: string) {
    super(message)
    this.name = 'ProjectionRootUnresolvedError'
    this.reason = reason
  }
}

/**
 * Assert `root` is an absolute path (P2b-i path-guard ruling / AC6b).
 * Relative roots are refused with a typed error naming the seam — never
 * silently resolved against the process cwd (mechanism class 5).
 */
export function assertAbsoluteRoot(root: string, seam: string): void {
  if (!isAbsolute(root)) {
    throw new ProjectionRootUnresolvedError(
      'root-not-absolute',
      `${seam}: repoRoot '${root}' is not an absolute path; a relative root would silently anchor to the process cwd and is refused (P2b-i / D19)`,
    )
  }
}
