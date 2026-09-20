/**
 * Output mechanics (Q5): a new sibling artifact, never in-place. The pristine
 * `<slug>.shaping-result.json` is untouched - this writes a distinct
 * `<slug>.projected.shaping-result.json` file only.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ShapingResult } from '../../contracts/src/index.js'
import { assertAbsoluteRoot } from './errors.js'
import { assertSafeSlug } from './path-guard.js'

export const PROJECTED_ARTIFACT_SUFFIX = '.projected.shaping-result.json'

/**
 * Foreign-repo default for the specs `active/` directory, RELATIVE to the
 * caller-supplied `repoRoot` (P2b-i ruling R2 / A1.3). NOT a class-1 root
 * fallback: a relative path within a root the caller supplied explicitly. The
 * home repo passes `plugins/foreman-line/docs/specs/active` explicitly at
 * call sites. Declared per-package by ruling — no shared constant, no
 * cross-package import (the former read of shaping's `ACTIVE_SPECS_DIR` is
 * removed under R2).
 */
const DEFAULT_SPECS_DIR = 'docs/specs/active'

export interface WriteOptions {
  /** Absolute TARGET repo root. Required (P2b-i/R3, extending P2a/D19). */
  readonly repoRoot: string
  /** Specs dir relative to `repoRoot` (P2b-i/R2); foreign default applies. */
  readonly specsDir?: string
}

export interface WriteResult {
  /** Absolute filesystem path the artifact was written to. */
  readonly artifactPath: string
  /** Repo-relative POSIX path of the artifact (`active/<slug>.projected.shaping-result.json`). */
  readonly artifactRef: string
  /** The filled payload that was written. */
  readonly payload: ShapingResult
}

/**
 * Write the filled `ShapingResult` to `active/<slug>.projected.shaping-result.json`.
 * Refuses to overwrite an existing projected artifact (throws naming the
 * colliding path) - mirrors W1-P1's collision policy. Never touches
 * `<slug>.shaping-result.json`.
 */
export function writeProjectedArtifact(
  slug: string,
  payload: ShapingResult,
  options: WriteOptions,
): WriteResult {
  assertSafeSlug(slug)
  const repoRoot = options.repoRoot
  const specsDir = options.specsDir ?? DEFAULT_SPECS_DIR
  assertAbsoluteRoot(repoRoot, 'writeProjectedArtifact')
  const activeDir = join(repoRoot, ...specsDir.split('/'))
  const fileName = `${slug}${PROJECTED_ARTIFACT_SUFFIX}`
  const artifactPath = join(activeDir, fileName)
  const artifactRef = `${specsDir}/${fileName}`

  if (existsSync(artifactPath)) {
    throw new Error(
      `writeProjectedArtifact: refusing to overwrite existing projected artifact at ${artifactPath}`,
    )
  }

  mkdirSync(activeDir, { recursive: true })
  // Two-space pretty JSON with trailing newline; a plain object, RFC 8785-canonicalizable.
  writeFileSync(artifactPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

  return { artifactPath, artifactRef, payload }
}
