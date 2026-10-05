export { parseScaffoldArgs, redact, type ScaffoldArgs } from './args.js'
export { checkEquivalentLayout } from './equivalent-layout.js'
export { assertAbsoluteRoot, EXIT_CODES, ScaffoldError, type ScaffoldErrorCode } from './errors.js'
export {
  applyScaffold,
  type FileAction,
  type PlannedFile,
  type PresetDocument,
  planScaffold,
  type ScaffoldPlan,
} from './generator.js'
export {
  MANAGED_BEGIN,
  MANAGED_END,
  type SpliceAction,
  type SpliceResult,
  spliceManagedBlock,
} from './managed-block.js'
export {
  ARTIFACTS,
  type ArtifactEntry,
  buildTokenMap,
  DIRECTORY_TARGETS,
  MANAGED_BLOCK_INNER,
  MANAGED_TARGET,
} from './manifest.js'
export {
  assertNoUnreplaced,
  substitute,
  TOKEN_NAMES,
  type TokenMap,
  type TokenName,
  yamlScalar,
} from './render.js'
