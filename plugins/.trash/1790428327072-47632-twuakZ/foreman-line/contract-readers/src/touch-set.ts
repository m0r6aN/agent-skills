/**
 * Touch-set derivation (Constraint 4 / AC2): resolves each glob in a parcel
 * spec's declared `surfaces:` against a repo root at THIS instant, and returns
 * that resolution's provenance alongside the matched files — never a bare
 * file list, so a resolved set is never mistaken for a stable enumeration.
 */
import { execFileSync } from 'node:child_process'
import { globSync } from 'node:fs'
import type { TouchSet } from './types.js'

/** Typed error for every external boundary this module crosses (git, fs). */
export class TouchSetError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'TouchSetError'
  }
}

function resolveCommitRef(repoRoot: string): string {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: repoRoot,
      encoding: 'utf8',
    }).trim()
  } catch (error) {
    throw new TouchSetError('failed to resolve the git commit ref for touch-set provenance', {
      cause: error,
    })
  }
}

/** Normalizes a path separator form so a Windows and POSIX rendering of the same path compare equal. */
export function normalizeSeparators(path: string): string {
  return path.split('\\').join('/')
}

/**
 * Resolves each glob in `specSurfaces` against `repoRoot` and returns
 * `{ files, resolvedAtCommit, resolvedAtTimestamp }`. `files` is the
 * deduplicated, sorted, separator-normalized union of every glob's matches.
 * This is a point-in-time resolution (Constraint 4): the same `specSurfaces`
 * can resolve to a different `files` set at a later commit or wall-clock
 * instant as files come and go — `resolvedAtCommit`/`resolvedAtTimestamp`
 * record exactly when THIS resolution happened, so callers cannot read the
 * result as a static enumeration.
 */
export function deriveTouchSet(specSurfaces: readonly string[], repoRoot: string): TouchSet {
  const matched = new Set<string>()
  for (const pattern of specSurfaces) {
    let hits: readonly string[]
    try {
      hits = [...globSync(pattern, { cwd: repoRoot })]
    } catch (error) {
      throw new TouchSetError(
        `failed to resolve surfaces glob '${pattern}' against '${repoRoot}'`,
        {
          cause: error,
        },
      )
    }
    for (const hit of hits) {
      matched.add(normalizeSeparators(hit))
    }
  }
  return {
    files: [...matched].sort(),
    resolvedAtCommit: resolveCommitRef(repoRoot),
    resolvedAtTimestamp: new Date().toISOString(),
  }
}

/**
 * Runtime guard (used by the mutation test): true only if `value` carries
 * BOTH resolution-provenance fields as non-empty strings. A `TouchSet` that
 * strips either field fails this guard.
 */
export function hasResolutionProvenance(
  value: Partial<Pick<TouchSet, 'resolvedAtCommit' | 'resolvedAtTimestamp'>>,
): boolean {
  return (
    typeof value.resolvedAtCommit === 'string' &&
    value.resolvedAtCommit.length > 0 &&
    typeof value.resolvedAtTimestamp === 'string' &&
    value.resolvedAtTimestamp.length > 0
  )
}
