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
import { ACTIVE_SPECS_DIR, DEFAULT_REPO_ROOT } from './emit.js'
import { assertAbsoluteRoot } from './errors.js'

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
 * Discovery fallback: list every `*.shaping-result.json` artifact under the
 * `specsDir` directory, beneath the given repo root. `specsDir` defaults to the
 * legacy `ACTIVE_SPECS_DIR` value (`plugins/foreman-line/docs/specs/active`,
 * retired from the public surface, P2b-i AC2). Returns absolute filesystem
 * paths, sorted. Returns `[]` when the directory does not exist.
 */
export function discoverShapingResults(
  repoRoot: string = DEFAULT_REPO_ROOT,
  specsDir: string = ACTIVE_SPECS_DIR,
): string[] {
  // P2b-i AC6b seam refusal: a non-absolute repoRoot would silently re-anchor
  // the scan base to process.cwd() (mechanism class 5), so it is refused with
  // the typed error before any path is constructed or probed.
  assertAbsoluteRoot(repoRoot, 'discoverShapingResults')
  const activeDir = join(repoRoot, ...specsDir.split('/'))
  if (!existsSync(activeDir)) return []
  return readdirSync(activeDir)
    .filter((name) => name.endsWith(ARTIFACT_SUFFIX))
    .sort()
    .map((name) => join(activeDir, name))
}
