/**
 * Typed root-refusal error (P2b-i, extending P2a's Q4 per-package convention:
 * `<Domain>RootUnresolvedError`, no shared package, no `contracts/` edit).
 *
 * P2b-i adds the `root-not-absolute` reason (spec path-guard ruling / AC6): a
 * caller-supplied root that is not an absolute path would silently re-anchor
 * every derived path to `process.cwd()` via normalization — mechanism class 5
 * — so it is refused at the seam before any path is constructed.
 */
import { isAbsolute, relative } from 'node:path'

export class ShapingRootUnresolvedError extends Error {
  /** PCC-P0 usage exit code. */
  readonly code = 2 as const
  readonly reason: 'root-absent' | 'root-not-a-directory' | 'root-not-absolute'

  constructor(reason: ShapingRootUnresolvedError['reason'], message: string) {
    super(message)
    this.name = 'ShapingRootUnresolvedError'
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
    throw new ShapingRootUnresolvedError(
      'root-not-absolute',
      `${seam}: repoRoot '${root}' is not an absolute path; a relative root would silently anchor to the process cwd and is refused (P2b-i / D19)`,
    )
  }
}

/**
 * Assert a caller-supplied artifact path is absolute (P2b-i path-guard ruling
 * applied at the artifact-path seam). A relative artifact path would silently
 * anchor the read to the process cwd — mechanism class 5 — so it is refused
 * with the package's typed error before any read.
 */
export function assertAbsoluteArtifactPath(path: string, seam: string): void {
  if (!isAbsolute(path)) {
    throw new ShapingRootUnresolvedError(
      'root-not-absolute',
      `${seam}: artifact path '${path}' is not an absolute path; a relative path would silently anchor to the process cwd and is refused (P2b-i / D19)`,
    )
  }
}

/**
 * Assert `absPath` is contained beneath `repoRoot` (no `..` escape). Throws,
 * naming `ref`, when the path falls outside `repoRoot`. Shaping-local mirror of
 * projection's `assertContainedPath` (layering: projection builds on shaping,
 * so shaping MUST NOT import projection). The root must arrive absolute
 * (mechanism class 5 — a relative root would re-anchor the comparison base);
 * the comparison itself is `relative()` + `isAbsolute()` — no `resolve()` of a
 * root (D19).
 */
export function assertContainedRootPath(repoRoot: string, absPath: string, ref: string): void {
  assertAbsoluteRoot(repoRoot, 'assertContainedRootPath')
  const rel = relative(repoRoot, absPath)
  // `..` (or a leading `..` segment) means the target climbed out of repoRoot;
  // an absolute `rel` (e.g. a different Windows drive) escapes it too.
  if (rel.startsWith('..') || isAbsolute(rel)) {
    throw new Error(
      `assertContainedRootPath: referenced path '${ref}' resolves outside repoRoot and is refused`,
    )
  }
}
