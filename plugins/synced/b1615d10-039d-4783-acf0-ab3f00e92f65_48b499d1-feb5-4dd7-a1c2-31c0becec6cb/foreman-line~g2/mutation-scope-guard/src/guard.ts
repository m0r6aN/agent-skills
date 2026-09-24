/**
 * WF-P27 enforcement seam: preflight (dispatch-time) and post-hoc
 * (post-execution) checkpoints, both built on the fresh matcher in
 * `match.ts`. Neither checkpoint alone suffices (spec Constraints,
 * "New package, both preflight and post-hoc"): preflight alone cannot catch
 * what a worker actually did; post-hoc alone lets an out-of-scope mutation
 * land before rejection.
 *
 * `TaskEnvelope` is imported from `worker-envelopes/` by RELATIVE PATH, not a
 * package specifier -- there is no npm workspace and no tsconfig `paths`
 * mapping in this tree (coordinator ruling, WF-P27 Step 0 item 2). The
 * envelope does NOT carry `surfaces:` -- that is spec frontmatter, not an
 * envelope field -- so every function here takes the spec's `surfaces:` list
 * as a separate argument.
 */
import type { TaskEnvelope } from '../../worker-envelopes/src/task-envelope.js'
import { MutationScopeError } from './errors.js'
import { allMalformed, type MatchArm, matchAny } from './match.js'

/** The subset of `TaskEnvelope` this guard actually reads. */
export type ScopeEnvelope = Pick<TaskEnvelope, 'allowedFiles' | 'forbiddenSurfaces'>

/** One examined path in an accepted verdict: which entry/arm authorized it. */
export interface AuthorizedPath {
  readonly path: string
  readonly entry: string
  readonly arm: MatchArm
}

/**
 * The accept-path result object (spec: "Refusal shape mirrors
 * `evaluateRouting`'s full precedent, not only its refusal half"; AC5). An
 * accept that returns nothing is indistinguishable from the guard never
 * having run.
 */
export interface MutationScopeResult {
  readonly changedPaths: readonly string[]
  readonly authorizations: readonly AuthorizedPath[]
}

/**
 * Overlap is REFINEMENT, not malformation (spec amendment, AC3). A
 * `forbiddenSurfaces` entry falling INSIDE an `allowedFiles` region is legal
 * and is the field's intended use -- carving an exception out of a broad
 * grant. The only `SCOPE_ENVELOPE_CONTRADICTION` is an IDENTICAL LITERAL
 * entry present in both lists, which is irreconcilable rather than refining:
 * the envelope both grants and denies exactly the same thing.
 *
 * This is a set-intersection of the two ENTRY lists (literal string
 * equality), never pattern containment -- containment must survive
 * preflight so AC4(a)'s forbidden-wins precedence has a fixture that
 * actually reaches the post-hoc check. Returns the offending entries
 * (deduplicated, insertion order), or an empty array when there is none.
 */
function detectIdenticalEntryContradiction(
  allowedFiles: readonly string[],
  forbiddenSurfaces: readonly string[],
): string[] {
  const forbiddenSet = new Set(forbiddenSurfaces)
  const seen = new Set<string>()
  const out: string[] = []
  for (const af of allowedFiles) {
    if (forbiddenSet.has(af) && !seen.has(af)) {
      seen.add(af)
      out.push(af)
    }
  }
  return out
}

/**
 * AC2b: every value reaching the guard must be well-formed BEFORE any
 * matching -- a backslash, or a `.`/`..`/empty segment, is what let
 * denormalized spellings (`pkg/./secret.ts`, `pkg//secret.ts`,
 * `pkg/../pkg/secret.ts`, `pkg/../../../etc/passwd`) evade
 * `forbiddenSurfaces` fail-OPEN. Throws `MALFORMED_PATH` naming every
 * offending value; call this first, in both checkpoints.
 */
function assertWellFormed(values: readonly string[]): void {
  const bad = allMalformed(values)
  if (bad.length > 0) {
    throw new MutationScopeError(
      'MALFORMED_PATH',
      bad,
      `malformed path or entry (backslash, or an empty/'.'/'..' segment): ${bad.join(', ')}`,
    )
  }
}

/**
 * Pattern-aware preflight authorization (spec Constraints, "Preflight
 * authorization is PATTERN-aware, never entry-as-path" -- coordinator
 * amendment after both adversarial reviewers reproduced the escape below).
 *
 * Checking an `allowedFiles` entry AS A PATH against `surfaces:` (i.e.
 * reusing `matchAny` for every arm) is unsound:
 *
 *   preflightCheck({ allowedFiles: ['pkg/**'] }, surfaces=['pkg/*'])  -> passed
 *   matchEntry('pkg/**', 'pkg/*')                                    -> 'prefix-star'
 *   postHocCheck(env, ['pkg/a/b/c.ts'])                              -> accepted
 *   matchEntry('pkg/a/b/c.ts', 'pkg/*')                              -> null
 *
 * The literal `pkg/**` has no `/` after the prefix, so as a PATH it reads as
 * "one level below pkg" and passes against `pkg/*`. Post-hoc then treats the
 * same string as a PATTERN and authorizes arbitrary depth -- a one-level
 * spec grant silently became an unlimited-depth runtime grant.
 *
 * This function is therefore a DISTINCT, pattern-aware total function over
 * the three-form vocabulary -- it never reuses `matchAny` for the `/*` or
 * `/**` arms:
 *
 * - exact entry `p`      -- authorized iff some surfaces entry matches `p`
 *                            as a PATH under AC1's matcher (`matchAny`).
 * - entry `X/*`           -- authorized iff surfaces contains the literal
 *                            `X/*`, OR some `Y/**` with `X === Y` or
 *                            `X.startsWith(Y + '/')`.
 * - entry `X/**`          -- authorized iff surfaces contains some `Y/**`
 *                            with `X === Y` or `X.startsWith(Y + '/')`.
 *                            NEVER authorized by any `Y/*`, at any `Y`.
 */
function isEntryAuthorizedBySurfaces(entry: string, surfaces: readonly string[]): boolean {
  if (entry.endsWith('/**')) {
    const x = entry.slice(0, -3)
    for (const s of surfaces) {
      if (!s.endsWith('/**')) continue
      const y = s.slice(0, -3)
      if (x === y || x.startsWith(`${y}/`)) return true
    }
    return false
  }
  if (entry.endsWith('/*')) {
    const x = entry.slice(0, -2)
    for (const s of surfaces) {
      if (s === entry) return true
      if (!s.endsWith('/**')) continue
      const y = s.slice(0, -3)
      if (x === y || x.startsWith(`${y}/`)) return true
    }
    return false
  }
  // Exact entry: it names a concrete path, so checking it AS a path against
  // the surfaces patterns is exactly right -- this arm was never the bug.
  return matchAny(entry, surfaces) !== null
}

/**
 * Preflight, dispatch-time check (spec Constraints: "a dispatch-time
 * invariant, checked once at task-envelope construction"). Two refusals:
 *
 * - `SCOPE_ENVELOPE_CONTRADICTION` when `allowedFiles` and
 *   `forbiddenSurfaces` share an IDENTICAL LITERAL entry (AC3(a)) -- checked
 *   first, since irreconcilable malformation is a distinct failure mode from
 *   an ordinary out-of-scope grant. Containment (AC3(b)) is refinement and
 *   must NOT be rejected here -- it is exactly the fixture AC4(a) needs to
 *   survive preflight so the post-hoc forbidden-wins branch is reachable.
 * - `SCOPE_ENVELOPE_MISMATCH` when any `allowedFiles` entry is not authorized
 *   by the parcel spec's own `surfaces:` list under AC1's matcher (AC2).
 *
 * Throws on refusal; returns `void` on acceptance (no result object is
 * specified for preflight -- only the post-hoc accept path returns one,
 * per AC5).
 */
export function preflightCheck(envelope: ScopeEnvelope, surfaces: readonly string[]): void {
  // AC2b: well-formedness first, before any matching -- every value that
  // reaches this checkpoint (both entry lists, and the surfaces list itself).
  assertWellFormed([...envelope.allowedFiles, ...envelope.forbiddenSurfaces, ...surfaces])

  const contradiction = detectIdenticalEntryContradiction(
    envelope.allowedFiles,
    envelope.forbiddenSurfaces,
  )
  if (contradiction.length > 0) {
    throw new MutationScopeError(
      'SCOPE_ENVELOPE_CONTRADICTION',
      contradiction,
      `task envelope's allowedFiles and forbiddenSurfaces both list: ${contradiction.join(', ')}`,
    )
  }

  // AC2: pattern-aware authorization -- never entry-as-path for the /* or
  // /** arms (see isEntryAuthorizedBySurfaces doc comment for the escape
  // this replaces).
  const unauthorized: string[] = []
  for (const af of envelope.allowedFiles) {
    if (!isEntryAuthorizedBySurfaces(af, surfaces)) unauthorized.push(af)
  }
  if (unauthorized.length > 0) {
    throw new MutationScopeError(
      'SCOPE_ENVELOPE_MISMATCH',
      unauthorized,
      `task envelope's allowedFiles is not authorized by the parcel spec's surfaces: ` +
        `${unauthorized.join(', ')}`,
    )
  }
}

/**
 * Post-hoc, post-execution check (spec Constraints, precedence rule): given
 * the actually-changed paths and the task envelope:
 *
 * (a) any path matching `forbiddenSurfaces` is OUT_OF_SCOPE EVEN WHEN
 *     `allowedFiles` authorizes it (forbidden wins) -- reachable because
 *     preflight now lets containment survive (AC3(b)/AC4(a));
 * (b) any path matching no `allowedFiles` entry is OUT_OF_SCOPE;
 * (c) `allowedFiles: []` enforces "may change nothing" -- every changed path
 *     fails (b) trivially, since `matchAny` against an empty list is always
 *     `null`, never treated as "no constraint configured";
 * (d) zero changed paths never throws, whatever `allowedFiles` says.
 *
 * On acceptance, returns a populated `MutationScopeResult` (AC5) -- never an
 * empty/undefined signal that a caller could mistake for "guard did not run".
 */
export function postHocCheck(
  envelope: ScopeEnvelope,
  changedPaths: readonly string[],
): MutationScopeResult {
  // AC2b: well-formedness first, before any matching.
  assertWellFormed([...envelope.allowedFiles, ...envelope.forbiddenSurfaces, ...changedPaths])

  const violations: string[] = []
  const authorizations: AuthorizedPath[] = []

  for (const path of changedPaths) {
    if (matchAny(path, envelope.forbiddenSurfaces) !== null) {
      violations.push(path)
      continue
    }
    const allowed = matchAny(path, envelope.allowedFiles)
    if (allowed === null) {
      violations.push(path)
      continue
    }
    authorizations.push({ path, entry: allowed.entry, arm: allowed.arm })
  }

  if (violations.length > 0) {
    throw new MutationScopeError(
      'OUT_OF_SCOPE',
      violations,
      `changed path(s) outside declared mutation scope: ${violations.join(', ')}`,
    )
  }

  return { changedPaths: [...changedPaths], authorizations }
}
