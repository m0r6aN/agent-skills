/**
 * Public surface of the Foreman Line Shaping Agent package (W1-P1).
 *
 * Emission (the P1->P2 interface), the two readers (explicit-path primary + glob
 * fallback), and the two-layer advisory draft self-check. The `ShapingResult`
 * type and `shapingResultSchema` are NOT re-exported here - they are owned by the
 * frozen `contracts` package and imported from there directly.
 */
export {
  deriveSessionSlug,
  type EmitOptions,
  type EmitResult,
  emitShapingResult,
  toPosixRelative,
} from './emit.js'
export { assertAbsoluteRoot, ShapingRootUnresolvedError } from './errors.js'
export {
  ARTIFACT_SUFFIX,
  discoverShapingResults,
  readShapingResult,
} from './read.js'
export {
  type BodySectionResult,
  checkBodySections,
  checkFrontmatter,
  REQUIRED_SECTIONS,
  type SelfCheckResult,
  selfCheckDraft,
} from './self-check.js'
