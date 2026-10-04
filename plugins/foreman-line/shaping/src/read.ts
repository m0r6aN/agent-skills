/**
 * P1->P2 handoff readers.
 *
 * The **explicit path handoff is the contract**: `readShapingResult(path)` takes
 * the artifact path W1-P2 is handed and returns the parsed, schema-validated bare
 * payload. `discoverShapingResults(root)` is the **documented discovery fallback**
 * - the `active/*.shaping-result.json` glob - not the primary interface.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Ajv } from 'ajv'
import { type ShapingResult, shapingResultSchema } from '../../contracts/src/index.js'
import {
  assertAbsoluteArtifactPath,
  assertAbsoluteRoot,
  assertContainedRootPath,
} from './errors.js'

const ajv = new Ajv({ allErrors: true })
const validateShapingResult = ajv.compile(shapingResultSchema)

/** Suffix that marks a shaping-result artifact within `active/`. */
export const ARTIFACT_SUFFIX = '.shaping-result.json'

/**
 * Primary P1->P2 interface: read and schema-validate a `ShapingResult` from an
 * explicit file path. Throws on missing file, unparseable JSON, or a payload that
 * fails `shapingResultSchema`.
 */
export function readShapingResult(filePath: string): ShapingResult {
  // P2b-i / D19 artifact-path seam: a relative path would silently anchor the
  // read to the process cwd (mechanism class 5) — refused, typed, before any read.
  assertAbsoluteArtifactPath(filePath, 'readShapingResult')
  const raw = readFileSync(filePath, 'utf8')
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (err) {
    throw new Error(`readShapingResult: ${filePath} is not valid JSON: ${(err as Error).message}`)
  }
  if (!validateShapingResult(parsed)) {
    const detail = (validateShapingResult.errors ?? [])
      .map((e) => `${e.instancePath || '(root)'} ${e.message ?? 'is invalid'}`)
      .join('; ')
    throw new Error(
      `readShapingResult: ${filePath} failed shapingResultSchema validation: ${detail}`,
    )
  }
  return parsed as ShapingResult
}

/**
 * Discovery fallback: list every `*.shaping-result.json` artifact under
 * `active/`, beneath the given repo root. `repoRoot` is required and absolute
 * (P2b-i/R3); `specsDir` is the specs directory relative to it (P2b-i/R2,
 * foreign default `docs/specs/active` — the home repo passes
 * `plugins/foreman-line/docs/specs/active` explicitly). Returns absolute
 * filesystem paths, sorted. Returns `[]` when the directory does not exist.
 */
export function discoverShapingResults(
  repoRoot: string,
  specsDir: string = 'docs/specs/active',
): string[] {
  assertAbsoluteRoot(repoRoot, 'discoverShapingResults')
  const activeDir = join(repoRoot, ...specsDir.split('/'))
  // Path containment (D1): the caller-supplied specsDir must resolve beneath
  // repoRoot — refused before any directory probe or read.
  assertContainedRootPath(repoRoot, activeDir, specsDir)
  if (!existsSync(activeDir)) return []
  return readdirSync(activeDir)
    .filter((name) => name.endsWith(ARTIFACT_SUFFIX))
    .sort()
    .map((name) => join(activeDir, name))
}
