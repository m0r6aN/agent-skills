// HRO-P4b (MRC-10) — additive config-repair-proposal re-exports (the
// package's supported-surface wiring). Existing exports above are untouched.
export type {
  ApplyChecklistItem,
  ApplyContract,
  ApplyOutcome,
  ApplyPlan,
  CatalogEvidence,
  ConfigRepairInput,
  ConfigRepairProposal,
  ConfigRepairRefusalName,
  ConfigRepairResult,
  ConfigWriteSeam,
  LocalConfigView,
  MappingProvenance,
  PiModelsEntryContract,
  RedactedSummary,
  SourceState,
  VerifiedModelEvidence,
} from './config-repair-proposal.js'
export {
  buildConfigRepairProposal,
  CONFIG_REPAIR_REFUSALS,
  planConfigRepairApply,
  writeConfigRepairAtomically,
} from './config-repair-proposal.js'
export type {
  CatalogEligibilityInput,
  CatalogEligibilityResult,
} from './catalog-eligibility-adapter.js'
export { evaluateCatalogEligibility } from './catalog-eligibility-adapter.js'
export type { EligibilityFacts, IdentityRefusalCode, Provenance } from './eligibility.js'
export { IDENTITY_REFUSAL_CODES, projectEligibility, readCatalogSnapshot } from './eligibility.js'
export type {
  PiOpenRouterAuthority,
  PiOpenRouterCapability,
  PiOpenRouterLane,
  PiOpenRouterModel,
  PiOpenRouterProtocol,
  PiOpenRouterProvenance,
  PiOpenRouterRefusal,
  PiOpenRouterResolvedRoute,
  PiOpenRouterRouteResolution,
  PiOpenRouterRouting,
  PiOpenRouterValidationResult,
} from './pi-openrouter.js'
export {
  PI_OPENROUTER_ENABLED_MODELS,
  PI_OPENROUTER_PROTOCOLS,
  PI_OPENROUTER_ROUTING,
  piOpenRouterModelSchema,
  piOpenRouterRoutingSchema,
  resolvePiOpenRouterRoute,
  validatePiOpenRouterRouting,
} from './pi-openrouter.js'
// HRO-P4a (MRC-08) — additive recovery-API re-exports (the package's
// supported-surface wiring). Existing exports above are untouched.
export type {
  MetadataRefreshFn,
  MetadataRefreshResult,
  PriorAttempt,
  ProvenanceFreshnessTolerance,
  ProviderHealthPolicy,
  RecoveryBounds,
  RecoveryConfig,
  RecoveryContext,
  RecoveryEpisodeInput,
  RecoveryResolution,
  TransientRetryPolicy,
} from './pi-resolver.js'
export {
  createRecoveryContext,
  provenanceFreshnessVerdict,
  resolveRouteWithRecovery,
} from './pi-resolver.js'
// HRO-P4c (MRC-12) — additive recovery-diagnostics re-exports (the package's
// supported-surface wiring). Existing exports above are untouched.
export type {
  DiagnosticEvent,
  DiagnosticIdentity,
  DiagnosticInput,
  DiagnosticLabel,
  DiagnosticSeverity,
  DiagnosticsBatchInput,
  DiagnosticsReport,
  NotificationRequest,
  NotificationSink,
  RenderedDiagnostic,
  RenderOptions,
} from './recovery-diagnostics.js'
export {
  boundIdentifierText,
  buildDiagnosticsReport,
  dedupeRendered,
  deriveDiagnosticEvents,
  renderHumanLine,
  resolveRenderOptions,
  sanitizeForTerminal,
} from './recovery-diagnostics.js'
export type { NotificationCommand, SpawnSyncLike } from './recovery-notify.js'
export { createPlatformNotificationSink, notificationCommand } from './recovery-notify.js'
export type {
  AttemptRecord,
  FreshnessVerdict,
  RecoveryEpisodeRecord,
  RefreshProvenance,
  RouteUnavailableOutcome,
} from './route-receipt.js'
export { resolvePmcRouteV1 } from './pmc-resolver.js'
export type {
  BindingClaims,
  CatalogClaim,
  Claim,
  Digest,
  EvidenceRef,
  Id,
  PmcResolverContextV1,
  PmcRouteDecisionV1,
  PmcRouteRequestV1,
  Text,
  UInt,
  Utc,
} from './pmc-resolver-types.js'
export type {
  ProviderBindingProjectionResult,
  ProviderBindingProjectionV1,
} from './provider-binding-projection.js'
export {
  projectProviderBindingsV1,
  providerBindingProjectionV1Schema,
} from './provider-binding-projection.js'
export { PMC_LANE_POLICIES_V1, providerBindingPolicyV1Schema } from './provider-binding-schemas.js'
export type {
  BindingEvidenceV1,
  BindingProvenanceV1,
  EvidenceState,
  EvidenceValue,
  LaneBindingV1,
  LanePolicyV1,
  LogicalCandidateV1,
  PmcLaneId,
  PmcProvider,
  PmcRoleFamily,
  ProviderBindingErrorCodeV1,
  ProviderBindingPolicyV1,
  ProviderBindingV1,
  ProviderBindingValidationErrorV1,
  ProviderBindingValidationResultV1,
} from './provider-bindings.js'
export { validateProviderBindingPolicyV1 } from './provider-bindings.js'
export { producePublicObservationSnapshot } from './public-observation-producer.js'
export {
  classEntrySchema,
  dataClassificationRuleSchema,
  laneEntrySchema,
  laneRouteSchema,
  logicalCandidateSchema,
  modelBindingSchema,
  routingPolicySchema,
  shadowRouteSchema,
  transportRequirementsSchema,
} from './schemas.js'
export type {
  AdapterRefusalName,
  BindingCapabilities,
  BindingEndpoint,
  BindingIdentity,
  CapabilityState,
  ClassEntry,
  ClassName,
  Compatibility,
  CostQuote,
  DataClassificationRule,
  DataClassificationTier,
  DeclaredEvidence,
  Evidence,
  LaneEntry,
  LaneId,
  LaneRoute,
  LegacyRepresentation,
  LogicalCandidate,
  ModelBinding,
  ProhibitedShadowRoles,
  ProviderName,
  ProviderRule,
  RankingContract,
  RankingInputId,
  RecoveryRefusalName,
  ResidualSlot,
  RoleFamily,
  RouteRef,
  RoutingPolicy,
  ShadowRoute,
  ShadowTaskType,
  TransportRequirements,
  UnprovenEvidence,
  UnprovenState,
} from './types.js'
export {
  ADAPTER_REFUSALS,
  ATTESTED_STATES,
  CLASS_NAMES,
  CONTRACT_REFUSALS,
  CONTRACT_RESIDUALS,
  DATA_CLASSIFICATION_TIERS,
  LANE_IDS,
  PROVIDER_NAMES,
  RANKING_INPUT_IDS,
  RECOVERY_REFUSALS,
  RESOLVER_HOLDS,
  RESOLVER_REFUSALS,
} from './types.js'
export type { ValidationResult } from './validator.js'
export { KNOWN_FRONTIER_BINDINGS, KNOWN_FRONTIER_MODELS, validatePolicy } from './validator.js'
