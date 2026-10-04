/**
 * Path-containment guards (rework item 1, same class as W1-P1's MAJOR slug
 * finding). Both checks are linear-time (`String.includes`/`path.relative`
 * index walks - no regex, lesson #19).
 */
import { isAbsolute, relative, resolve } from 'node:path'
import { assertAbsoluteRoot } from './errors.js'

/**
 * Reject a `slug` containing `/`, `\`, or `..` before any path is
 * constructed from it. Called at both the key-minting point
 * (`projectShapingResult`, before `deriveEpicKey`) and the path-construction
 * point (`writeProjectedArtifact`) - defense-in-depth (Flag 1 ruling), same
 * helper at both sites so the rejected character set never drifts between
 * them.
 */
export function assertSafeSlug(slug: string): void {
  if (slug.includes('/') || slug.includes('\\') || slug.includes('..')) {
    throw new Error(
      `assertSafeSlug: slug '${slug}' contains a path-traversal or separator character ('/', '\\', or '..') and is refused before any path is constructed`,
    )
  }
}

/**
 * Resolve `absPath` and `repoRoot` and verify `absPath` is contained beneath
 * `repoRoot` (no `..` escape). Throws, naming `ref`, when the resolved path
 * falls outside `repoRoot`. Called before any existence check or read of the
 * resolved path.
 */
export function assertContainedPath(repoRoot: string, absPath: string, ref: string): void {
  // P2b-i AC6 seam refusal: a non-absolute repoRoot would silently re-anchor
  // the containment comparison base to process.cwd() (mechanism class 5), so
  // it is refused with the typed error BEFORE any comparison - closing the
  // mis-comparison demonstrated in root-conflation.test.ts.
  assertAbsoluteRoot(repoRoot, 'assertContainedPath')
  const rel = relative(resolve(repoRoot), resolve(absPath))
  // `..` (or a leading `..` segment) means the target climbed out of repoRoot;
  // an absolute `rel` (e.g. a different Windows drive) escapes it too.
  if (rel.startsWith('..') || isAbsolute(rel)) {
    throw new Error(
      `assertContainedPath: referenced spec '${ref}' resolves outside repoRoot and is refused`,
    )
  }
}
