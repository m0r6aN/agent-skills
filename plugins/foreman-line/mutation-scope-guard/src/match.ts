/**
 * WF-P27 three-form path matcher (spec AC1). Pure, side-effect-free.
 *
 * A fresh function local to this package -- NOT a call into
 * `dispatch/src/skill-resolver/index.ts`. That module matches a declared
 * surface *against* a matrix-key glob; this guard matches a *changed path*
 * against a declared `surfaces:`/`allowedFiles` glob entry -- the direction
 * inverts, so the existing function's parameter shape does not fit.
 *
 * `skill-resolver`'s rule named `'prefix/*'` (index.ts:9-16, behavior at
 * 143-147) is actually recursive -- this guard's own `/**` semantics under a
 * `/*` name. This matcher's `/*` is deliberately non-recursive (one level
 * below only) and disagrees by design with that module's same-spelled rule.
 * That is a naming defect in `skill-resolver`, flagged to the coordinator as
 * a separate follow-on, not something this matcher's semantics should mimic.
 *
 * Lesson #19: linear-time, `===` and `String.prototype.startsWith` only --
 * no RegExp construction and no RegExp-based string methods over a
 * runtime-variable string.
 *
 * Normalization contract (caller's responsibility, stated here since this
 * module trusts it): POSIX forward-slash, repo-relative, no trailing slash,
 * case-sensitive. No symlink resolution.
 */

/** Which matcher arm authorized a path. */
export type MatchArm = 'exact' | 'prefix-star' | 'prefix-doublestar'

/** A successful match: which declared entry authorized the path, and how. */
export interface MatchResult {
  readonly entry: string
  readonly arm: MatchArm
}

/**
 * True when `path` contains no further `/` after stripping a leading
 * `prefix/` -- i.e. `path` is exactly one segment below `prefix`.
 */
function isOneLevelBelow(path: string, prefix: string): boolean {
  const withSlash = `${prefix}/`
  if (!path.startsWith(withSlash)) return false
  const rest = path.slice(withSlash.length)
  return rest.length > 0 && !rest.includes('/')
}

/**
 * Match one changed `path` against one declared `entry` (a `surfaces:` /
 * `allowedFiles` glob element). Returns the matching arm, or `null`.
 */
export function matchEntry(path: string, entry: string): MatchArm | null {
  if (entry.endsWith('/**')) {
    const prefix = entry.slice(0, -3)
    if (path === prefix || path.startsWith(`${prefix}/`)) return 'prefix-doublestar'
    return null
  }
  if (entry.endsWith('/*')) {
    const prefix = entry.slice(0, -2)
    if (isOneLevelBelow(path, prefix)) return 'prefix-star'
    return null
  }
  if (path === entry) return 'exact'
  return null
}

/**
 * Match a changed `path` against an ordered list of declared entries.
 * Returns the first authorizing entry and arm, or `null` if none authorize
 * the path. Linear scan -- no early-exit ambiguity since a path either
 * matches an entry's arm or it doesn't.
 */
export function matchAny(path: string, entries: readonly string[]): MatchResult | null {
  for (const entry of entries) {
    const arm = matchEntry(path, entry)
    if (arm !== null) return { entry, arm }
  }
  return null
}

/** Glob metacharacters outside this guard's two supported star forms. */
const GLOB_METACHARACTERS = ['*', '?', '[', ']', '{', '}']

/**
 * AC2c: an entry (or path) carrying a glob metacharacter that is NOT one of
 * this guard's two supported forms (`X/*`, `X/**`, with no metacharacter
 * anywhere in `X` itself) is off-vocabulary. Off-vocabulary entries used to
 * fall through to the exact arm and match nothing -- which on
 * `forbiddenSurfaces` meant the entry forbade nothing, SILENTLY (a denial
 * control that can never fire). A star-globbed suffix beyond the two
 * supported forms, a bare `*.ts`-style entry, a mid-segment star, and a
 * brace-expansion entry are all off-vocabulary under this check.
 */
function hasOffVocabularyGlob(value: string): boolean {
  const isRecognizedStarForm =
    (value.endsWith('/**') && !containsAny(value.slice(0, -3), GLOB_METACHARACTERS)) ||
    (value.endsWith('/*') && !containsAny(value.slice(0, -2), GLOB_METACHARACTERS))
  if (isRecognizedStarForm) return false
  return containsAny(value, GLOB_METACHARACTERS)
}

/** True when `value` contains any of `chars` (linear scan, `.includes` per char). */
function containsAny(value: string, chars: readonly string[]): boolean {
  for (const ch of chars) {
    if (value.includes(ch)) return true
  }
  return false
}

/**
 * AC2b/AC2c well-formedness check: reject a backslash anywhere, any `/`
 * segment that is empty, `.`, or `..` (AC2b -- also catches the trailing-
 * slash directory form, since a trailing `/` produces an empty final
 * segment), or an off-vocabulary glob metacharacter (AC2c(a)). Denormalized
 * spellings (`pkg/./secret.ts`, `pkg//secret.ts`, `pkg/../pkg/secret.ts`,
 * `pkg/../../../etc/passwd`) evade `forbiddenSurfaces` fail-OPEN, and an
 * off-vocabulary denial entry (`pkg/*.ts`, `pkg/{a,b}.ts`, ...) forbids
 * nothing silently, if left unchecked -- this must run before any matching,
 * in both checkpoints.
 *
 * Linear-time segment inspection only (lesson #19): `.split('/')` on a
 * literal single-character separator and `.includes` on a literal character
 * are not regex operations, and every comparison below is `===`.
 */
export function isWellFormedPath(value: string): boolean {
  if (value.includes('\\')) return false
  for (const segment of value.split('/')) {
    if (segment === '' || segment === '.' || segment === '..') return false
  }
  if (hasOffVocabularyGlob(value)) return false
  return true
}

/**
 * Every not-well-formed value in `values` (deduplicated, insertion order),
 * or an empty array when all are well-formed.
 */
export function allMalformed(values: readonly string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const value of values) {
    if (!isWellFormedPath(value) && !seen.has(value)) {
      seen.add(value)
      out.push(value)
    }
  }
  return out
}
