export const AUTHORITY_TIERS = [
  'developer-ratification',
  'goal-charter',
  'ratified-contract',
  'coordinator-pattern',
  'parcel-spec',
  'standing-role',
  'generated-advisory',
] as const
export type AuthorityTier = (typeof AUTHORITY_TIERS)[number]

export const SOURCE_KINDS = [
  'developer-ratification',
  'goal-charter',
  'foreman-contract',
  'coordinator-pattern',
  'parcel-spec',
  'standing-constraint',
  'live-implementation',
  'historical',
  'generated-advisory',
] as const
export type SourceKind = (typeof SOURCE_KINDS)[number]

export const AUTHORITY_EFFECTS = [
  'binding',
  'corroborating',
  'superseded-in-scope',
  'historical',
  'stale-explanation',
  'advisory-only',
] as const
export type AuthorityEffect = (typeof AUTHORITY_EFFECTS)[number]

export const RULE_CLASSIFICATIONS = [
  'pre-action-refusal',
  'post-action-detection',
  'ci-static-check',
  'independent-review-human-judgment',
  'narrative-provenance',
  'unsupported',
] as const
export type RuleClassification = (typeof RULE_CLASSIFICATIONS)[number]

export const DECISIONS = ['ALLOW', 'REFUSE', 'ADVISORY', 'CONFLICT', 'REQUIRE_HUMAN'] as const
export type Decision = (typeof DECISIONS)[number]
export const SEVERITIES = ['info', 'low', 'medium', 'high', 'critical'] as const
export type Severity = (typeof SEVERITIES)[number]
export const ENFORCEMENT_OWNERS = [
  'human-developer',
  'human-merge-operator',
  'coordinator',
  'kernel-policy',
  'host-adapter',
  'ci',
  'independent-reviewer',
  'provenance-only',
  'none',
] as const
export type EnforcementOwner = (typeof ENFORCEMENT_OWNERS)[number]
export const ASSURANCE_LEVELS = [
  'narrative',
  'structural',
  'detected',
  'mediated',
  'independently-verified',
  'human-ratified',
] as const
export type AssuranceLevel = (typeof ASSURANCE_LEVELS)[number]
export const RETIREMENT_STATES = [
  'active-reading',
  'required-backstop',
  'candidate-for-retirement',
  'retired-from-agent-reading',
  'historical-only',
] as const
export type RetirementState = (typeof RETIREMENT_STATES)[number]
export const PRINCIPAL_CLASSES = [
  'anonymous-read',
  'human-developer',
  'coordinator',
  'shaper',
  'builder',
  'independent-reviewer',
  'ci-service',
  'host-adapter',
  'kernel-operator',
] as const
export type PrincipalClass = (typeof PRINCIPAL_CLASSES)[number]
export const GOAL_SCOPES = ['foreman-kernel', 'all-foreman-goals'] as const
export type GoalScope = (typeof GOAL_SCOPES)[number]
export const ROLE_SCOPES = [
  'developer',
  'coordinator',
  'shaper',
  'builder',
  'reviewer',
  'ci',
  'host-adapter',
  'kernel',
  'operator',
  'any',
] as const
export type RoleScope = (typeof ROLE_SCOPES)[number]
export const STAGE_SCOPES = [
  'stage-zero',
  'shaping',
  'step-zero',
  'build',
  'deterministic-verify',
  'adversarial-review',
  'merge',
  'closure',
  'runtime',
  'any',
] as const
export type StageScope = (typeof STAGE_SCOPES)[number]
export const OPERATION_SCOPES = [
  'source-inventory',
  'spec-mutation',
  'repo-read',
  'repo-mutation',
  'state-transition',
  'control-call',
  'receipt-validation',
  'external-write',
  'any',
] as const
export type OperationScope = (typeof OPERATION_SCOPES)[number]
export const HOST_POSTURES = [
  'provider-neutral',
  'claude-windows-docker-loaded',
  'claude-windows-docker-unenrolled',
  'unsupported-host',
  'ci',
  'any',
] as const
export type HostPosture = (typeof HOST_POSTURES)[number]
export const LOCATOR_KINDS = [
  'heading',
  'numbered-item',
  'table-row',
  'symbol',
  'line-excerpt',
  'missing-path',
] as const
export type LocatorKind = (typeof LOCATOR_KINDS)[number]
export const MIGRATION_STATUSES = [
  'open',
  'resolved-for-fk',
  'superseded-by-amendment',
  'blocked',
] as const
export type MigrationStatus = (typeof MIGRATION_STATUSES)[number]

export interface SourceLocator {
  readonly kind: LocatorKind
  readonly anchor: string
  readonly lineHint?: number
}
export interface SourceRef {
  readonly sourceId: string
  readonly itemId: string
  readonly locatorDigest: string
  readonly valueDigest: string
}
export interface SnapshotEvidence {
  readonly commit: string
  readonly fullFileSha256: string
}
export interface InventoryItem {
  readonly itemId: string
  readonly locator: SourceLocator
  readonly normalizedExcerpt: string
  readonly valueDigest: string
  readonly ruleIds: readonly string[]
  readonly exclusionDisposition:
    | 'heading-only'
    | 'table-header'
    | 'structural-ast'
    | 'schema-container'
    | 'duplicate-exact-statement'
    | 'non-normative-explanation'
    | 'example-only'
    | 'fenced-code'
    | 'type-only'
    | null
  readonly rationale: string
}
export type NormativeMarkdownAuditExclusion = Exclude<InventoryItem['exclusionDisposition'], null>
export interface NormativeMarkdownAuditRecord {
  readonly sourceId: string
  readonly itemId: string
  readonly valueDigest: string
  readonly disposition: 'publish' | 'exclude'
  readonly ruleIds: readonly string[]
  readonly exclusionCode: NormativeMarkdownAuditExclusion | null
  readonly rationale: string
}
export interface CanonSource {
  readonly sourceId: string
  readonly path: string
  readonly sourceKind: SourceKind
  readonly authorityTier: AuthorityTier
  readonly authorityEffect: AuthorityEffect
  readonly scope: readonly GoalScope[]
  readonly snapshotEvidence: SnapshotEvidence
  readonly inventoryItems: readonly InventoryItem[]
}
export interface Applicability {
  readonly goals: readonly GoalScope[]
  readonly roles: readonly RoleScope[]
  readonly stages: readonly StageScope[]
  readonly operations: readonly OperationScope[]
  readonly hosts: readonly HostPosture[]
}
export type EvidenceKind =
  | 'predicate-contract'
  | 'negative-test'
  | 'corpus-sweep'
  | 'independent-bypass'
export interface EvidenceRef {
  readonly kind: EvidenceKind
  readonly path: string
  readonly digest: string
}
export interface RetirementEvidence {
  readonly predicate: EvidenceRef | null
  readonly negativeRefusalTest: EvidenceRef | null
  readonly corpusSweep: EvidenceRef | null
  readonly independentBypassAttempt: EvidenceRef | null
}
export interface AuthorityRule {
  readonly ruleId: string
  readonly authoritySubject: string
  readonly authorityClaim: string
  readonly normalizedStatement: string
  readonly sourceRefs: readonly SourceRef[]
  readonly authorityBasisRef: SourceRef
  readonly applicability: Applicability
  readonly severity: Severity
  readonly classification: RuleClassification
  readonly decision: Decision
  readonly refusalCode: string | null
  readonly enforcementOwner: EnforcementOwner
  readonly assurance: AssuranceLevel
  readonly pairedRuleIds: readonly string[]
  readonly retirementState: RetirementState
  readonly retirementEvidence: RetirementEvidence
  readonly bindingDigest: string
}
export interface AuthorityQuery {
  readonly authoritySubject: string
  readonly goal: 'foreman-kernel'
  readonly role: Exclude<RoleScope, 'any'>
  readonly stage: Exclude<StageScope, 'any'>
  readonly operation: Exclude<OperationScope, 'any'>
  readonly host: Exclude<HostPosture, 'any'>
}
/**
 * Result of an authority resolution.
 *
 * There is deliberately NO `CONFLICT` outcome. A highest-tier claim or decision split is exactly
 * the `RULE_CONFLICT` predicate, which is validity-blocking, and resolution never runs against an
 * invalid registry - so no input can reach one. Such a contradiction surfaces as
 * `REQUIRE_HUMAN` / `REGISTRY_INVALID`.
 */
export type AuthorityResolution =
  | {
      readonly outcome: 'RESOLVED'
      readonly authoritySubject: string
      readonly authorityClaim: string
      readonly decision: 'ALLOW' | 'REFUSE' | 'ADVISORY' | 'REQUIRE_HUMAN'
      /**
       * The honesty fields. A `REFUSE` attributed to `kernel-policy` with `structural` assurance
       * is a claim about a kernel that does not exist yet; a `REFUSE` from a loaded permission
       * profile is mediated and real. Without these a consumer cannot tell them apart, and 254 of
       * the shipped rules are in the first category. Consumers MUST read `assurance` and
       * `enforcementOwner` before treating a decision as enforced.
       */
      readonly classification: RuleClassification
      readonly assurance: AssuranceLevel
      readonly enforcementOwner: EnforcementOwner
      readonly severity: Severity
      readonly controllingRuleIds: string[]
      readonly consideredRuleIds: string[]
    }
  | {
      readonly outcome: 'REQUIRE_HUMAN'
      readonly authoritySubject: string
      readonly reasonCode: 'REGISTRY_INVALID' | 'INVALID_QUERY_SCOPE' | 'NO_APPLICABLE_AUTHORITY'
      readonly controllingRuleIds: []
      readonly consideredRuleIds: string[]
    }
export type OperationId =
  | 'gate1.ratify'
  | 'gate2.dispatch'
  | 'gate3.merge'
  | 'verification.issue'
  | 'closure.record'
  | 'receipt.mint-generic'
  | 'external.write'
export interface OperationAuthority {
  readonly operationId: OperationId
  readonly allowedPrincipals: readonly PrincipalClass[]
  readonly requiredGitEvidence: readonly SourceRef[]
  readonly missingEvidenceDecision: 'REFUSE' | 'CONFLICT' | 'REQUIRE_HUMAN'
  readonly agentCallable: boolean
  readonly operationalStateMaySatisfy: boolean
  readonly toolMayIssueAuthorityEvidence: boolean
}
export type ReconciliationEvidenceKind =
  | 'source-ref'
  | 'git-commit'
  | 'command-result'
  | 'missing-path'
export interface ReconciliationEvidence {
  readonly kind: ReconciliationEvidenceKind
  readonly reference: string
  readonly digest: string
}
export interface ReconciliationRecord {
  readonly reconciliationId: string
  readonly topic: string
  readonly observedRefs: readonly SourceRef[]
  readonly observedEvidence: readonly ReconciliationEvidence[]
  readonly authoritativeRuleIds: readonly string[]
  readonly scopedDisposition: string
  readonly unresolvedConsequence: string
  readonly migrationStatus: MigrationStatus
  readonly supersedingEvidence: SourceRef | null
}
export interface AuthorityEnforcementRegistry {
  readonly schemaVersion: '0.1.0'
  readonly registryId: 'foreman-kernel-authority-enforcement'
  readonly sourceSnapshotCommit: string
  readonly sources: readonly CanonSource[]
  readonly rules: readonly AuthorityRule[]
  readonly operationAuthority: readonly OperationAuthority[]
  readonly reconciliations: readonly ReconciliationRecord[]
  readonly normativeMarkdownAudit: readonly NormativeMarkdownAuditRecord[]
}

export const RESULT_CODES = [
  'SCHEMA_INVALID',
  'SOURCE_PATH_INVALID',
  'SOURCE_PATH_ESCAPE',
  'SOURCE_NOT_REGULAR',
  'SOURCE_SYMLINK_FORBIDDEN',
  'SOURCE_DUPLICATE_PATH',
  'LOCATOR_MISSING',
  'LOCATOR_DUPLICATE',
  'LOCATOR_DIGEST_MISMATCH',
  'VALUE_DIGEST_MISMATCH',
  'RULE_DUPLICATE',
  'RULE_ORPHANED',
  'SOURCE_ITEM_UNCOVERED',
  'RULE_SEMANTICS_UNCURATED',
  'RULE_SOURCE_MISSING',
  'RULE_CONFLICT',
  'AUTHORITY_ESCALATION',
  'RETIREMENT_EVIDENCE_INCOMPLETE',
  /**
   * Operator misconfiguration: the supplied repository root exists but is not the root of a real
   * Git worktree. Operational (exit 2), never a registry violation (exit 1) - exit 1 means "the
   * registry is invalid", and returning it for a mistyped path is a false accusation against canon.
   */
  'REPO_ROOT_INVALID',
  /**
   * A rule claims `retired-from-agent-reading` but its D11 evidence could not be digest-verified
   * because no repository root was supplied. Validity-blocking, deliberately: retirement REMOVES
   * enforcement, so accepting an unverifiable retirement would silently delete canon while
   * reporting green. Supply `--repo-root` (CLI) or `{ repoRoot }` (API) to verify it.
   */
  'RETIREMENT_EVIDENCE_UNVERIFIED',
  'RECONCILIATION_MISSING',
  'MIGRATION_EVIDENCE_INVALID',
  'IO_ERROR',
  'PARSE_ERROR',
  'USAGE_ERROR',
] as const
export type ResultCode = (typeof RESULT_CODES)[number]
export interface ValidationViolation {
  readonly code: ResultCode
  readonly message: string
  readonly sourcePath?: string
  readonly locator?: string
  readonly ruleId?: string
}
export interface RegistrySummary {
  readonly sourceSnapshot: string
  readonly sourceCount: number
  readonly itemCount: number
  readonly ruleCount: number
  readonly classificationCounts: Readonly<Record<RuleClassification, number>>
  readonly reconciliationStatuses: Readonly<Record<string, MigrationStatus>>
  readonly unresolvedActiveConflicts: number
}
export interface ValidationResult {
  readonly valid: boolean
  readonly violations: readonly ValidationViolation[]
  readonly summary: RegistrySummary | null
}
