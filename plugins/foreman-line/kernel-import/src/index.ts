/**
 * `@foreman-line/kernel-import` — FK-P11 legacy import and projection engine.
 *
 * Scope (D13 honesty): a one-time digest/commit-bound legacy import with NO
 * manufactured approvals (imported approvals are provenance-bound evidence
 * records only), the deterministic bytes-only Markdown projection over the
 * ledger, one recorded cutover epoch per source lineage, and the named
 * `DIVERGENCE_STOP` refusal. The package claims no dispatch, no gate
 * genuineness verification, no enforcement, no promotion, no mutation
 * authority (it writes NO repo files), and no FK-P15 process-boundary
 * recovery proof.
 */

export {
  FK_P11_PROJECTION_IDS,
  type FkP11ProjectionId,
  REGISTERED_PROJECTION_IDS,
  RESERVED_PROJECTION_ID,
  type RegisteredProjectionId,
} from './cursors.js'
export { checkDivergence, type DivergenceContext, verifyGitWinnerFacts } from './divergence.js'
export {
  APPROVAL_REFUSAL_REASONS,
  type ApprovalRefusalReason,
  CURSOR_REFUSAL_REASONS,
  type CursorRefusalReason,
  DIVERGENCE_REASON_CODES,
  type DivergenceReasonCode,
  IMPORT_ERROR_CODE_COUNT,
  IMPORT_ERROR_CODES,
  IMPORT_ERROR_REGISTRY,
  type ImportDiagnostic,
  type ImportDiagnosticMembers,
  ImportError,
  type ImportErrorCode,
  importError,
  isHarnessFailure,
  isImportError,
} from './errors.js'
export {
  ARTIFACT_KIND_APPROVAL,
  ARTIFACT_KIND_EPOCH,
  ARTIFACT_KIND_RATIFICATION_REF,
  corpusDigestOf,
  createImporter,
  documentDigestOf,
  type EpochRecord,
  EVENT_PAYLOAD_MAX_BYTES,
  getAllEpochs,
  getEpoch,
  IMPORT_EPOCH_KIND,
  IMPORT_RECORDED_KIND,
  type ImportedGoalClaims,
  type Importer,
  type ImportResult,
  readAllEvents,
  readEpochRecords,
  readImportedGoalClaims,
  runImport,
} from './import.js'
export {
  APPROVAL_EVIDENCE_KINDS,
  type ApprovalClaim,
  type ApprovalEvidenceKind,
  type ClaimedBinding,
  COMMIT_ID_LENGTH_SHA1,
  COMMIT_ID_LENGTH_SHA256,
  CORPUS_DISPOSITIONS,
  CORPUS_MAX_ITEMS,
  CORPUS_REASON_MAX_BYTES,
  type CorpusDisposition,
  type CorpusItem,
  type CorpusManifest,
  GIT_IDENTITY_MAX_BYTES,
  IMPORT_API_VERSION,
  IMPORT_DIGEST_DOMAINS,
  IMPORT_MAX_ROWS,
  type ImportDocument,
  isCommitId,
  isRepoRelativePath,
  type LegacyGoalRecord,
  type OperationalFacts,
  parseImportDocument,
  type RatificationRef,
  ROW_REF_ARRAY_MAX,
  SOURCE_PATH_MAX_BYTES,
  type SourceProvenance,
} from './import-document.js'
export {
  BLOB_ABSENT,
  type BlobAbsence,
  type BlobResult,
  createLineageGateway,
  type LineageGateway,
  type SourceLineageReader,
} from './lineage.js'
export { GIT_READ_ONLY_SUBCOMMANDS, GitLineageReader } from './lineage-git.js'
export {
  createProjector,
  getProjectionCursor,
  PROJECTION_FORMAT_VERSION,
  type ProjectionPublish,
  type ProjectionRender,
  type Projector,
  publishProjection,
  renderProjection,
} from './projection.js'
export { sanitizeForMarkdown } from './sanitize.js'
