/**
 * FK-P1 kernel contract types (`@foreman-line/kernel-contracts`).
 *
 * These types mirror the F05 contract field tables of
 * `plugins/foreman-line/docs/specs/active/FK-P1-lifecycle-admission-decision-contracts.md`
 * exactly. The closed draft-07 JSON Schemas in `src/schemas.ts` are the normative
 * wire forms; this module is their typed mirror plus the closed vocabularies,
 * the wire-code registry and the F05.13 trusted projection tables.
 *
 * Contract-only package: no evaluator, no admission implementation, no runtime
 * authority. Identifiers here identify records; they never authenticate callers.
 */

// ---------------------------------------------------------------------------
// Notation (F05.1)
// ---------------------------------------------------------------------------

/** Nonempty ASCII, at most 128 chars, letters/digits/dot/underscore/hyphen. */
export type Id = string
/** `sha256:` plus exactly 64 lowercase hex characters. */
export type Digest = string
/** Nonnegative safe integer (0 .. 2^53-1). NaN, ±Infinity, -0 and unsafe values rejected. */
export type SafeInt = number
/** Nonnegative integer microseconds. */
export type Micros = number
/** UTF-8 string of at most N bytes (default 65,536); enforced by validators. */
export type Bytes = string

export type ApiVersion = '0.1.0'
export const API_VERSION: ApiVersion = '0.1.0'

// ---------------------------------------------------------------------------
// Closed vocabularies
// ---------------------------------------------------------------------------

export const CLAIMED_ACTION_CLASSES = [
  'read-only',
  'governed-mutation',
  'opaque-mutation-capable',
  'lifecycle-only',
] as const
export type ClaimedActionClass = (typeof CLAIMED_ACTION_CLASSES)[number]

export const EFFECTIVE_ACTION_CLASSES = [
  'read-only',
  'governed-mutation',
  'mutation-capable',
  'lifecycle-only',
] as const
export type EffectiveActionClass = (typeof EFFECTIVE_ACTION_CLASSES)[number]

export const MODES = ['shadow', 'enforcing', 'degraded-read-only'] as const
export type Mode = (typeof MODES)[number]

export const DECISIONS = ['ALLOW', 'REFUSE', 'ADVISORY', 'CONFLICT', 'REQUIRE_HUMAN'] as const
export type Decision = (typeof DECISIONS)[number]

export const EFFECT_DECISIONS = ['APPLIED', 'NOOP'] as const
export type EffectDecision = (typeof EFFECT_DECISIONS)[number]

// --- P0 verbatim vocabularies (embedded reference shapes; parity-tested) -----

/** P0 PrincipalClass, verbatim (accepted R31 `1747c1d`, authority-registry/src/types.ts). */
export const P0_PRINCIPAL_CLASSES = [
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
export type P0PrincipalClass = (typeof P0_PRINCIPAL_CLASSES)[number]

/** P0 PrincipalClass minus `anonymous-read`: the authenticated variant vocabulary. */
export const AUTHENTICATED_PRINCIPAL_CLASSES = [
  'coordinator',
  'shaper',
  'builder',
  'human-developer',
  'independent-reviewer',
  'ci-service',
  'host-adapter',
  'kernel-operator',
] as const
export type AuthenticatedPrincipalClass = (typeof AUTHENTICATED_PRINCIPAL_CLASSES)[number]

/** P0 RoleScope minus `any`. */
export const ROLE_SELECTIONS = [
  'developer',
  'coordinator',
  'shaper',
  'builder',
  'reviewer',
  'ci',
  'host-adapter',
  'kernel',
  'operator',
] as const
export type RoleSelection = (typeof ROLE_SELECTIONS)[number]

/** P0 StageScope minus `any`. */
export const STAGE_SELECTIONS = [
  'stage-zero',
  'shaping',
  'step-zero',
  'build',
  'deterministic-verify',
  'adversarial-review',
  'merge',
  'closure',
  'runtime',
] as const
export type StageSelection = (typeof STAGE_SELECTIONS)[number]

/** P0 OperationScope minus `any` (admitted operation-scope categories). */
export const OPERATION_SCOPES = [
  'source-inventory',
  'spec-mutation',
  'repo-read',
  'repo-mutation',
  'state-transition',
  'control-call',
  'receipt-validation',
  'external-write',
] as const
export type OperationScope = (typeof OPERATION_SCOPES)[number]

/** P0 HostPosture minus `any`. */
export const HOST_POSTURE_CLAIMS = [
  'provider-neutral',
  'claude-windows-docker-loaded',
  'claude-windows-docker-unenrolled',
  'unsupported-host',
  'ci',
] as const
export type HostPostureClaim = (typeof HOST_POSTURE_CLAIMS)[number]

/** P0 RuleClassification, verbatim. */
export const P0_RULE_CLASSIFICATIONS = [
  'pre-action-refusal',
  'post-action-detection',
  'ci-static-check',
  'independent-review-human-judgment',
  'narrative-provenance',
  'unsupported',
] as const
export type P0RuleClassification = (typeof P0_RULE_CLASSIFICATIONS)[number]

/** P0 AssuranceLevel (source labels), verbatim; never mapped into the P1 runtime union. */
export const P0_ASSURANCE_LEVELS = [
  'narrative',
  'structural',
  'detected',
  'mediated',
  'independently-verified',
  'human-ratified',
] as const
export type P0AssuranceLevel = (typeof P0_ASSURANCE_LEVELS)[number]

/** P0 EnforcementOwner, verbatim (nine values). */
export const P0_ENFORCEMENT_OWNERS = [
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
export type P0EnforcementOwner = (typeof P0_ENFORCEMENT_OWNERS)[number]

/** P0 Severity, verbatim. */
export const P0_SEVERITIES = ['info', 'low', 'medium', 'high', 'critical'] as const
export type P0Severity = (typeof P0_SEVERITIES)[number]

/** P0 EvidenceKind, verbatim (embedded EvidenceRef shapes). */
export const P0_EVIDENCE_KINDS = [
  'predicate-contract',
  'negative-test',
  'corpus-sweep',
  'independent-bypass',
] as const
export type P0EvidenceKind = (typeof P0_EVIDENCE_KINDS)[number]

/** P0 OperationId: the seven governance ids, verbatim (a distinct namespace from admitted operations). */
export const P0_GOVERNANCE_OPERATION_IDS = [
  'gate1.ratify',
  'gate2.dispatch',
  'gate3.merge',
  'verification.issue',
  'closure.record',
  'receipt.mint-generic',
  'external.write',
] as const
export type P0GovernanceOperationId = (typeof P0_GOVERNANCE_OPERATION_IDS)[number]

/** P0 authority-resolution reason codes (unresolved REQUIRE_HUMAN), verbatim. */
export const P0_RESOLUTION_REASON_CODES = [
  'REGISTRY_INVALID',
  'INVALID_QUERY_SCOPE',
  'NO_APPLICABLE_AUTHORITY',
] as const
export type P0ResolutionReasonCode = (typeof P0_RESOLUTION_REASON_CODES)[number]

// --- P1 runtime assurance union (F05.9) ------------------------------------

export const ASSURANCE_LEVELS = [
  'structural',
  'mediated',
  'detected-only',
  'ci-enforced',
  'human-judgment',
  'unsupported-host',
  'degraded-read-only',
] as const
export type AssuranceLevel = (typeof ASSURANCE_LEVELS)[number]

export const MISSING_ASSURANCE_REASONS = [
  'evidence-not-yet-produced',
  'producer-out-of-scope',
  'evidence-unavailable',
  'degraded-posture',
] as const
export type MissingAssuranceReason = (typeof MISSING_ASSURANCE_REASONS)[number]

/** Required evidence kind per assurance level (F05.9). */
export const REQUIRED_EVIDENCE_KIND_BY_LEVEL = {
  structural: 'contract-fixture',
  mediated: 'process-run',
  'detected-only': 'detection',
  'ci-enforced': 'ci-run',
  'human-judgment': 'git-gate-artifact',
  'unsupported-host': 'host-probe',
  'degraded-read-only': 'posture-record',
} as const
export type AssuranceEvidenceKind = (typeof REQUIRED_EVIDENCE_KIND_BY_LEVEL)[AssuranceLevel]

// ---------------------------------------------------------------------------
// WireCode registry (F05.12) — closed 28-value union
// ---------------------------------------------------------------------------

export const MEDIATED_CODES = [
  'WORKTREE_MISMATCH',
  'BRANCH_MISMATCH',
  'PATH_OUTSIDE_ALLOWED_FILES',
  'FROZEN_SURFACE_MUTATION',
  'REVIEWER_MUTATION_FORBIDDEN',
  'REVIEW_WORKTREE_DIRTY',
  'POLICY_SELF_MODIFICATION',
  'MEDIATED_BYPASS_MODE_FORBIDDEN',
  'OWNER_LEASE_MISMATCH',
  'STATE_REVISION_STALE',
  'GATE_NOT_SATISFIED',
] as const

export const BOUNDARY_CODES = [
  'INVALID_REQUEST',
  'UNSUPPORTED_VERSION',
  'PAYLOAD_LIMIT_EXCEEDED',
  'ADMISSION_REQUIRED',
  'CAPABILITY_SCOPE_MISMATCH',
  'READ_BOUNDARY_VIOLATION',
  'IDEMPOTENCY_CONFLICT',
  'KERNEL_UNREACHABLE',
] as const

export const INTERNAL_POLICY_CODES = [
  'POLICY_ALLOW',
  'POLICY_ADVISORY',
  'POLICY_RESOLUTION_UNRESOLVED',
  'POLICY_PROJECTION_UNMAPPED',
  'HUMAN_JUDGMENT_REQUIRED',
] as const

export const WIRE_CODES = [
  ...MEDIATED_CODES,
  'SESSION_ENROLLMENT_MISSING',
  ...BOUNDARY_CODES.filter((code) => code !== 'KERNEL_UNREACHABLE').filter(
    (code) => code !== 'IDEMPOTENCY_CONFLICT',
  ),
  'KERNEL_INTERNAL_FAILURE',
  'KERNEL_UNREACHABLE',
  'IDEMPOTENCY_CONFLICT',
  ...INTERNAL_POLICY_CODES,
  'EFFECT_APPLIED',
  'EFFECT_NOOP',
] as const
export type WireCode = (typeof WIRE_CODES)[number]

/** ProtocolError.protocolCode: KERNEL_UNREACHABLE is adapter-observed and excluded (F05.10). */
export const PROTOCOL_CODES = [
  'INVALID_REQUEST',
  'UNSUPPORTED_VERSION',
  'PAYLOAD_LIMIT_EXCEEDED',
  'ADMISSION_REQUIRED',
  'CAPABILITY_SCOPE_MISMATCH',
  'READ_BOUNDARY_VIOLATION',
  'KERNEL_INTERNAL_FAILURE',
] as const
export type ProtocolCode = (typeof PROTOCOL_CODES)[number]

export type WireResultKind =
  | 'policy-result'
  | 'protocol-error'
  | 'effect-result'
  | 'adapter-failure'

/** One row of the F05.12 closed registry. */
export interface WireCodeRule {
  readonly code: WireCode
  readonly producer: string
  readonly resultKind: WireResultKind
  /** Allowed decision on the result; `none` for protocol/adapter results. */
  readonly allowedDecision: Decision | 'APPLIED' | 'NOOP' | 'none'
  /** Shadow-mode behavior where the row names one; null otherwise. */
  readonly shadowWouldDecision: Decision | null
  readonly p0Correspondence: string
  readonly safeDiagnostic: string
}

const refused = (
  code: WireCode,
  producer: string,
  diagnostic: string,
  p0: string,
): WireCodeRule => ({
  code,
  producer,
  resultKind: 'policy-result',
  allowedDecision: 'REFUSE',
  shadowWouldDecision: 'REFUSE',
  p0Correspondence: p0,
  safeDiagnostic: diagnostic,
})

/** The F05.12 wire-code registry, verbatim columns (28 rows). */
export const WIRE_CODE_RULES: readonly WireCodeRule[] = [
  refused('WORKTREE_MISMATCH', 'P12', 'repo-relative worktree descriptor only', 'mediated group 1'),
  refused('BRANCH_MISMATCH', 'P12', 'branch name only', 'mediated group 1'),
  refused(
    'PATH_OUTSIDE_ALLOWED_FILES',
    'P12',
    'repo-relative path descriptor only',
    'mediated group 2',
  ),
  refused(
    'FROZEN_SURFACE_MUTATION',
    'P12',
    'repo-relative path descriptor only',
    'mediated group 2',
  ),
  refused('REVIEWER_MUTATION_FORBIDDEN', 'P12', 'operation class only', 'mediated group 3'),
  refused('REVIEW_WORKTREE_DIRTY', 'P12', 'worktree descriptor only', 'mediated group 3'),
  refused('POLICY_SELF_MODIFICATION', 'P12', 'policy target id only', 'mediated group 4'),
  refused('MEDIATED_BYPASS_MODE_FORBIDDEN', 'P12', 'mode name only', 'mediated group 4'),
  refused('OWNER_LEASE_MISMATCH', 'P12', 'lease id only', 'mediated group 5'),
  {
    code: 'STATE_REVISION_STALE',
    producer: 'P12',
    resultKind: 'policy-result',
    allowedDecision: 'CONFLICT',
    shadowWouldDecision: null,
    p0Correspondence: 'mediated group 5; stale state/cache bindings',
    safeDiagnostic: 'revision numbers only',
  },
  {
    code: 'GATE_NOT_SATISFIED',
    producer: 'P12',
    resultKind: 'policy-result',
    allowedDecision: 'REQUIRE_HUMAN',
    shadowWouldDecision: null,
    p0Correspondence: 'mediated group 5; missing human gate only, inside authorized context',
    safeDiagnostic: 'gate id only',
  },
  {
    code: 'SESSION_ENROLLMENT_MISSING',
    producer: 'P16/P17 detector',
    resultKind: 'policy-result',
    allowedDecision: 'ADVISORY',
    shadowWouldDecision: null,
    p0Correspondence: 'none; detected-only, never a promoted hook-refusal class',
    safeDiagnostic: 'enrollment id only',
  },
  {
    code: 'INVALID_REQUEST',
    producer:
      'P6/P13 boundary (incl. structurally invalid or context-unanchorable idempotency bindings per F05.4)',
    resultKind: 'protocol-error',
    allowedDecision: 'none',
    shadowWouldDecision: null,
    p0Correspondence: 'contract outcome',
    safeDiagnostic: 'field path only',
  },
  {
    code: 'UNSUPPORTED_VERSION',
    producer: 'P6/P13 boundary',
    resultKind: 'protocol-error',
    allowedDecision: 'none',
    shadowWouldDecision: null,
    p0Correspondence: 'contract outcome',
    safeDiagnostic: 'version literal only',
  },
  {
    code: 'PAYLOAD_LIMIT_EXCEEDED',
    producer: 'validators',
    resultKind: 'protocol-error',
    allowedDecision: 'none',
    shadowWouldDecision: null,
    p0Correspondence:
      'contract outcome; also the 64-entry rule-id/violation/obligation overflow vehicle',
    safeDiagnostic: 'field name only',
  },
  {
    code: 'ADMISSION_REQUIRED',
    producer: 'P13',
    resultKind: 'protocol-error',
    allowedDecision: 'none',
    shadowWouldDecision: null,
    p0Correspondence: 'contract outcome',
    safeDiagnostic: 'none beyond the fixed safe diagnostic',
  },
  {
    code: 'CAPABILITY_SCOPE_MISMATCH',
    producer: 'P13',
    resultKind: 'protocol-error',
    allowedDecision: 'none',
    shadowWouldDecision: null,
    p0Correspondence: 'contract outcome',
    safeDiagnostic: 'capability id only',
  },
  {
    code: 'READ_BOUNDARY_VIOLATION',
    producer: 'P4 reader boundary',
    resultKind: 'protocol-error',
    allowedDecision: 'none',
    shadowWouldDecision: null,
    p0Correspondence: 'contract outcome; failure in all modes including shadow',
    safeDiagnostic: 'path-form only',
  },
  {
    code: 'KERNEL_INTERNAL_FAILURE',
    producer: 'kernel',
    resultKind: 'protocol-error',
    allowedDecision: 'none',
    shadowWouldDecision: null,
    p0Correspondence: 'typed internal kernel failure (named here; non-gate)',
    safeDiagnostic: 'none',
  },
  {
    code: 'KERNEL_UNREACHABLE',
    producer: 'host adapter (observed)',
    resultKind: 'adapter-failure',
    allowedDecision: 'none',
    shadowWouldDecision: null,
    p0Correspondence: 'contract outcome',
    safeDiagnostic: 'none',
  },
  {
    code: 'IDEMPOTENCY_CONFLICT',
    producer: 'P10 transition consumer',
    resultKind: 'policy-result',
    allowedDecision: 'CONFLICT',
    shadowWouldDecision: null,
    p0Correspondence: 'contract outcome',
    safeDiagnostic: 'binding ids only',
  },
  {
    code: 'POLICY_ALLOW',
    producer: 'P12',
    resultKind: 'policy-result',
    allowedDecision: 'ALLOW',
    shadowWouldDecision: null,
    p0Correspondence: 'RESOLVED decision ALLOW; never sufficient alone for a mediated action',
    safeDiagnostic: 'none',
  },
  {
    code: 'POLICY_ADVISORY',
    producer: 'P12',
    resultKind: 'policy-result',
    allowedDecision: 'ADVISORY',
    shadowWouldDecision: null,
    p0Correspondence: 'RESOLVED decision ADVISORY',
    safeDiagnostic: 'bounded condition id',
  },
  {
    code: 'POLICY_RESOLUTION_UNRESOLVED',
    producer: 'P12 resolution step',
    resultKind: 'policy-result',
    allowedDecision: 'REQUIRE_HUMAN',
    shadowWouldDecision: null,
    p0Correspondence:
      'typed retained P0 reasonCode REGISTRY_INVALID/INVALID_QUERY_SCOPE/NO_APPLICABLE_AUTHORITY; never GATE_NOT_SATISFIED',
    safeDiagnostic: 'reason literal only',
  },
  {
    code: 'POLICY_PROJECTION_UNMAPPED',
    producer: 'P12 projection step',
    resultKind: 'policy-result',
    allowedDecision: 'REFUSE',
    shadowWouldDecision: null,
    p0Correspondence: 'unknown principal/role/stage/operation projection',
    safeDiagnostic: 'projection member name only',
  },
  {
    code: 'HUMAN_JUDGMENT_REQUIRED',
    producer: 'P12',
    resultKind: 'policy-result',
    allowedDecision: 'REQUIRE_HUMAN',
    shadowWouldDecision: null,
    p0Correspondence:
      'RESOLVED decision REQUIRE_HUMAN whose cause is not a missing human gate; GATE_NOT_SATISFIED remains gate-cause-only',
    safeDiagnostic: 'subject id only',
  },
  {
    code: 'EFFECT_APPLIED',
    producer: 'P10 consumer',
    resultKind: 'effect-result',
    allowedDecision: 'APPLIED',
    shadowWouldDecision: null,
    p0Correspondence: 'absent from P0 Decision',
    safeDiagnostic: 'none',
  },
  {
    code: 'EFFECT_NOOP',
    producer: 'P10 consumer',
    resultKind: 'effect-result',
    allowedDecision: 'NOOP',
    shadowWouldDecision: null,
    p0Correspondence: 'absent from P0 Decision',
    safeDiagnostic: 'none',
  },
]

// ---------------------------------------------------------------------------
// F05.2 LifecycleEvent wire shapes
// ---------------------------------------------------------------------------

export const PATH_FORMS = ['windows-drive', 'windows-unc', 'posix-absolute', 'other'] as const
export type PathForm = (typeof PATH_FORMS)[number]

export interface ProposedPath {
  readonly rawPath: Bytes
  readonly pathForm: PathForm
}

export const EFFECT_KINDS = [
  'diff',
  'file-write',
  'file-delete',
  'process-exit',
  'unknown',
] as const
export type EffectKind = (typeof EFFECT_KINDS)[number]

export interface ObservedEffect {
  readonly effectKind: EffectKind
  readonly descriptor: Bytes
  readonly digest: Digest | null
}

/** sessionStart payload: empty closed object. */
export type SessionStartPayload = Record<string, never>

export interface PreToolUsePayload {
  readonly toolRef: Id
  readonly proposedPaths: readonly ProposedPath[]
}

export interface PostToolUsePayload {
  readonly toolRef: Id
  readonly observedEffects: readonly ObservedEffect[]
}

export interface StopPayload {
  readonly requestedCompletionSubject: Id
}

export interface LifecycleEventCommon {
  readonly apiVersion: ApiVersion
  readonly eventId: Id
  readonly sessionRef: Id
  readonly hostAdapterRef: Id
  readonly claimedRepositoryRef: Id | null
  readonly claimedWorktreeRef: Id | null
  readonly actionRef: Id
  readonly claimedActionClass: ClaimedActionClass
}

export interface SessionStartEvent extends LifecycleEventCommon {
  readonly event: 'sessionStart'
  readonly payload: SessionStartPayload
}
export interface PreToolUseEvent extends LifecycleEventCommon {
  readonly event: 'preToolUse'
  readonly payload: PreToolUsePayload
}
export interface PostToolUseEvent extends LifecycleEventCommon {
  readonly event: 'postToolUse'
  readonly payload: PostToolUsePayload
}
export interface StopEvent extends LifecycleEventCommon {
  readonly event: 'stop'
  readonly payload: StopPayload
}

export type LifecycleEvent = SessionStartEvent | PreToolUseEvent | PostToolUseEvent | StopEvent

// ---------------------------------------------------------------------------
// F05.3 AdmittedContext internal shapes
// ---------------------------------------------------------------------------

export interface LifecycleProvenance {
  readonly provenanceId: Id
  readonly hostAdapterRef: Id
  readonly provenanceDigest: Digest
}

export interface AdmittedContextAuthenticated {
  readonly principalKind: 'authenticated'
  readonly principalRef: Id
  readonly principalClass: AuthenticatedPrincipalClass
  readonly capabilityRef: Id
  readonly capabilityGeneration: SafeInt
  readonly capabilityValidUntilMicros: Micros | null
  readonly capabilityRevocationRef: Id | null
  readonly admissionIssuerRef: Id
  readonly admittedEndpoint: 'control' | 'read'
  readonly boundRepositoryRef: Id | null
  readonly boundWorktreeRef: Id | null
  readonly boundSessionRef: Id
  readonly permittedOperationIds: readonly Id[]
  readonly roleSelection: RoleSelection
  readonly stageSelection: StageSelection
  readonly provenanceRef: LifecycleProvenance
}

export interface AdmittedContextAnonymousContent {
  readonly principalKind: 'anonymous-content'
  readonly principalClass: 'anonymous-read'
  readonly admittedEndpoint: 'read'
  readonly boundSessionRef: Id | null
}

export type AdmittedContext = AdmittedContextAuthenticated | AdmittedContextAnonymousContent

// ---------------------------------------------------------------------------
// F05.4 AuthorizeActionInput
// ---------------------------------------------------------------------------

export interface LeaseCasDescriptor {
  readonly leaseId: Id | null
  readonly leaseOwnerPrincipalRef: Id | null
  readonly casRevision: SafeInt
  readonly leaseExpiresAtMicros: Micros | null
}

export const GATE_EVIDENCE_KINDS = [
  'commit-ref',
  'signature',
  'status-check',
  'merge-record',
] as const
export type GateEvidenceKind = (typeof GATE_EVIDENCE_KINDS)[number]

export interface GitGateEvidenceRef {
  readonly evidenceKind: GateEvidenceKind
  readonly gitIdentity: Bytes
  readonly digest: Digest
}

export interface IdempotencyBinding {
  readonly principalRef: Id
  readonly operationId: Id
  readonly repositoryRef: Id
  readonly worktreeRef: Id
  readonly payloadDigest: Digest
}

export interface RepositoryIdentity {
  readonly repositoryRef: Id
  readonly worktreeRef: Id
}

export interface PolicyIdentity {
  readonly policyIdentityVersion: '0.1.0'
  readonly registry: {
    readonly registryId: 'foreman-kernel-authority-enforcement'
    readonly schemaVersion: '0.1.0'
    readonly sourceSnapshotCommit: string
    readonly registryContentDigest: Digest
  }
  readonly effectivePolicyDigest: Digest
  readonly effectiveConfigurationDigest: Digest
}

export interface TrustedBindings {
  readonly admittedContext: AdmittedContext
  readonly lifecycleProvenance: LifecycleProvenance
  readonly effectiveActionClass: EffectiveActionClass
  readonly repositoryIdentity: RepositoryIdentity | null
  readonly policyDigest: Digest
  readonly scopeDigest: Digest | null
  readonly goalRevision: SafeInt | null
  readonly leaseState: LeaseCasDescriptor
  readonly gateEvidenceRefs: readonly GitGateEvidenceRef[]
  readonly mode: Mode
  readonly observedEffects: readonly ObservedEffect[]
  /** TRANSITION-ONLY (F05.4): null unless state-bound with anchored principal/repository/worktree. */
  readonly idempotencyKey: IdempotencyBinding | null
}

export interface AuthorizeActionInput {
  readonly callerInputs: {
    readonly lifecycleEvent: LifecycleEvent
  }
  readonly trustedBindings: TrustedBindings
}

// ---------------------------------------------------------------------------
// F05.14 ReadRequest (D19)
// ---------------------------------------------------------------------------

export interface ContentOnlyReadRequest {
  readonly readKind: 'content-only'
  readonly content: Bytes
  readonly contentEncoding: 'utf-8'
}

export interface RepositoryReadRequest {
  readonly readKind: 'repository-read'
  readonly repoId: Id
  readonly relativePath: Bytes
  readonly maxBytes: SafeInt
}

export type ReadRequest = ContentOnlyReadRequest | RepositoryReadRequest

// ---------------------------------------------------------------------------
// F05.15 HostCapability (D20)
// ---------------------------------------------------------------------------

export const NORMALIZER_PARCELS = ['FK-P16', 'FK-P20'] as const
export type NormalizerParcel = (typeof NORMALIZER_PARCELS)[number]

export interface HostCapability {
  readonly hostAdapterRef: Id
  readonly hostPostureClaim: HostPostureClaim
  readonly platformProbe: {
    readonly probeName: Bytes
    readonly probeVersion: Bytes
  }
  readonly rawHostPaths: readonly {
    readonly rawPath: Bytes
    readonly pathForm: PathForm
  }[]
  readonly normalizationEvidence: {
    readonly normalizationRef: Id
    readonly normalizerParcel: NormalizerParcel
    readonly digest: Digest
  } | null
}

// ---------------------------------------------------------------------------
// F05.16 Latency and cache contract (D21)
// ---------------------------------------------------------------------------

export const SPAN_NAMES = [
  'kernelDecisionLatency',
  'mediatedActionLatency',
  'firstCallObservation',
] as const
export type SpanName = (typeof SPAN_NAMES)[number]

export interface LatencyContract {
  readonly spans: {
    readonly kernelDecisionLatency: {
      readonly start: 'decision-surface-request-received'
      readonly end: 'response-written'
      readonly clock: 'kernel-monotonic'
    }
    readonly mediatedActionLatency: {
      readonly start: 'host-lifecycle-entry'
      readonly end: 'hook-exit'
      readonly clock: 'adapter-monotonic'
    }
    readonly firstCallObservation: {
      readonly start: 'initial-lifecycle-invocation'
      readonly end: 'hook-exit'
      readonly clock: 'adapter-monotonic'
      readonly includesStartup: true
    }
  }
  readonly budgetsMicros: {
    readonly kernelWarmP50: 5000
    readonly kernelWarmP95: 20000
    readonly kernelWarmP99: 50000
    readonly mediatedP99: 150000
    readonly firstCallMax: 2000000
  }
  readonly decisionDeadlineMicros: 1000000
  readonly deadlineDisposition:
    | 'evaluate-completed-response-at-or-under-deadline'
    | 'terminal-unreachable-when-none-completed'
  readonly lateResponsePolicy: 'ignore-terminal-outcome'
  readonly warmPopulation: 'completed-governed-mutation-decision-attempts-after-readiness-and-initial-invocation'
  readonly exclusionReporting: 'failed-deadline-and-excluded-attempts-reported-separately'
  readonly percentileMethod: 'nearest-rank'
  readonly cache: CacheDescriptor
}

export interface CacheDescriptor {
  readonly authorizationCache: 'disabled'
  readonly bindings: readonly ['goalRevision', 'policyDigest', 'compiledScopeDigest']
  readonly matchSufficiency: 'necessary-not-sufficient'
  readonly freshnessRevalidation: readonly [
    'effective-action-request',
    'principal-capability-generation',
    'repository-worktree',
    'lease-gate-freshness',
  ]
  readonly ttlAuthority: 'none'
  readonly latencyEligibility: 'none-granted'
}

// ---------------------------------------------------------------------------
// F05.8 / F05.9 / F05.10 / F05.11 — results
// ---------------------------------------------------------------------------

export type PrincipalProjection =
  | {
      readonly principalClass: AuthenticatedPrincipalClass
      readonly principalRef: Id
    }
  | {
      readonly principalClass: 'anonymous-read'
    }

export interface Violation {
  readonly code: WireCode
  readonly invariantId: Id
  readonly path: Bytes
}

export const OBLIGATION_KINDS = [
  'post-diff-inspection',
  'fresh-scm-evidence',
  'stop-report-emission',
  'degraded-read-logging',
  'latency-recording',
] as const
export type ObligationKind = (typeof OBLIGATION_KINDS)[number]

export type Obligation =
  | {
      readonly obligationId: Id
      readonly kind: 'post-diff-inspection'
      readonly payload: { readonly scopeDigest: Digest }
    }
  | {
      readonly obligationId: Id
      readonly kind: 'fresh-scm-evidence'
      readonly payload: {
        readonly evidenceKind: 'commit-ref' | 'signature' | 'status-check'
        readonly maxEvidenceAgeMicros: Micros | null
      }
    }
  | {
      readonly obligationId: Id
      readonly kind: 'stop-report-emission'
      readonly payload: {
        readonly transitionDescription: Bytes
        readonly awaitingHuman: true
      }
    }
  | {
      readonly obligationId: Id
      readonly kind: 'degraded-read-logging'
      readonly payload: {
        readonly degradedReason: 'kernel-unreachable' | 'decision-deadline-exceeded' | 'outage-mode'
      }
    }
  | {
      readonly obligationId: Id
      readonly kind: 'latency-recording'
      readonly payload: {
        readonly span: SpanName
        readonly elapsedMicros: Micros
        readonly budgetMicros: Micros
      }
    }

/**
 * F05.9 AssuranceEvidenceRef: closed union of flat per-kind shapes; the variants
 * are distinguished by their distinct required key sets (no invented tag field).
 */
export type AssuranceEvidenceRef =
  | { readonly checkId: Id; readonly fixtureDigest: Digest }
  | { readonly runId: Id; readonly hostAdapterRef: Id; readonly runDigest: Digest }
  | { readonly detectorId: Id; readonly detectionDigest: Digest }
  | { readonly workflowRef: Id; readonly runDigest: Digest }
  | { readonly gateArtifactRef: Id; readonly gitEvidenceDigest: Digest }
  | { readonly probeId: Id; readonly probeDigest: Digest }
  | { readonly postureEventId: Id; readonly postureDigest: Digest }

export interface AssuranceClaim {
  readonly assuranceLevel: AssuranceLevel
  /** Nonempty exactly when `missingAssuranceReason` is null; every element is the level's required kind. */
  readonly evidence: readonly AssuranceEvidenceRef[]
  readonly missingAssuranceReason: MissingAssuranceReason | null
}

/** F05.7 UpstreamPolicyEvidence: P0 resolution preserved verbatim; forbidden on protocol errors. */
export type UpstreamPolicyEvidence =
  | {
      readonly outcome: 'RESOLVED'
      readonly subject: string
      readonly claim: string
      readonly decision: 'ALLOW' | 'REFUSE' | 'ADVISORY' | 'REQUIRE_HUMAN'
      readonly classification: P0RuleClassification
      readonly assurance: P0AssuranceLevel
      readonly enforcementOwner: P0EnforcementOwner
      readonly severity: P0Severity
      readonly controllingRuleIds: readonly Id[]
      readonly consideredRuleIds: readonly Id[]
    }
  | {
      readonly outcome: 'REQUIRE_HUMAN'
      readonly subject: string
      readonly reasonCode: P0ResolutionReasonCode
      readonly controllingRuleIds: readonly []
      readonly consideredRuleIds: readonly Id[]
    }

interface DecisionEnvelopeCommon {
  readonly resultKind: 'policy-result'
  readonly apiVersion: ApiVersion
  readonly toolVersion: Bytes
  readonly code: WireCode
  readonly violations: readonly Violation[]
  readonly requestDigest: Digest
  readonly inputDigest: Digest
  readonly policyDigest: Digest
  readonly principal: PrincipalProjection
  readonly assurance: AssuranceClaim
  readonly obligations: readonly Obligation[]
  /** Required exactly for state-bound decisions; absent otherwise (e.g. anonymous content-only). */
  readonly goalRevision?: SafeInt
  readonly policyEvidence: UpstreamPolicyEvidence | null
}

export type DecisionEnvelope =
  | (DecisionEnvelopeCommon & {
      readonly mode: 'enforcing' | 'degraded-read-only'
      readonly decision: Decision
    })
  | (DecisionEnvelopeCommon & {
      readonly mode: 'shadow'
      readonly decision: 'ADVISORY'
      readonly wouldDecision: Decision
    })

export interface ProtocolError {
  readonly resultKind: 'protocol-error'
  readonly protocolCode: ProtocolCode
  readonly safeDiagnostic: Bytes
  readonly correlationRef: Id | null
  readonly apiVersion: Bytes | null
  readonly toolVersion: Bytes
}

export interface EffectResult {
  readonly resultKind: 'effect-result'
  readonly apiVersion: ApiVersion
  readonly toolVersion: Bytes
  readonly decision: EffectDecision
  readonly code: 'EFFECT_APPLIED' | 'EFFECT_NOOP'
  readonly idempotencyKey: IdempotencyBinding
  readonly effectDigest: Digest | null
  readonly goalRevision: SafeInt
}

// ---------------------------------------------------------------------------
// F05.17 Golden vectors
// ---------------------------------------------------------------------------

export const INPUT_TRUST_ORIGINS = [
  'wire-untrusted',
  'admitted-internal',
  'trusted-runtime',
] as const
export type InputTrustOrigin = (typeof INPUT_TRUST_ORIGINS)[number]

export const TRUST_STAGE_EXPECTATIONS = [
  'protocol-stop',
  'admission-stop',
  'authorized-context',
] as const
export type TrustStageExpectation = (typeof TRUST_STAGE_EXPECTATIONS)[number]

export type GoldenVectorRequest = LifecycleEvent | ReadRequest | AuthorizeActionInput

export interface GoldenVectorCase {
  readonly caseId: Id
  readonly charterClause: Bytes
  readonly producerParcel: Bytes
  readonly consumerParcel: Bytes
  readonly inputTrustOrigin: InputTrustOrigin
  readonly request: GoldenVectorRequest
  readonly expectedResponseKind: WireResultKind
  readonly expectedCode: WireCode
  readonly expectedDecision: Decision | null
  readonly expectedWouldDecision: Decision | null
  readonly expectedAssuranceLevel: AssuranceLevel
  readonly expectedObligations: readonly ObligationKind[]
  readonly trustStageExpectation: TrustStageExpectation
  readonly expectedRequestDigest: Digest | null
  readonly expectedInputDigest: Digest | null
  readonly verificationStage: 'contract-only'
  readonly laterOwner: Bytes
}

export interface GoldenVectorFixture {
  readonly apiVersion: ApiVersion
  readonly cases: readonly GoldenVectorCase[]
}

// ---------------------------------------------------------------------------
// F05.13 Trusted projection tables (F04) — finite, trusted, fail-closed.
// Consumers project admitted context to the P0 AuthorityQuery; an unknown
// projection yields POLICY_PROJECTION_UNMAPPED (never a widened query).
// The query is a policy query, never a capability or admission record.
// ---------------------------------------------------------------------------

export interface AuthorityQuery {
  readonly authoritySubject: string
  readonly goal: 'foreman-kernel'
  readonly role: RoleSelection
  readonly stage: StageSelection
  readonly operation: OperationScope
  readonly host: HostPostureClaim
}

/** principalClass → projected role (identity projection except where noted). */
export const PRINCIPAL_ROLE_PROJECTION: Readonly<Record<P0PrincipalClass, RoleSelection | 'none'>> =
  {
    'anonymous-read': 'none',
    'human-developer': 'developer',
    coordinator: 'coordinator',
    shaper: 'shaper',
    builder: 'builder',
    'independent-reviewer': 'reviewer',
    'ci-service': 'ci',
    'host-adapter': 'host-adapter',
    // kernel-operator: explicit context-specific roleSelection on AdmittedContext;
    // never automatic widening to both. Resolved by the consumer via roleSelection.
    'kernel-operator': 'none',
  }

/** The seven governance OperationIds queried separately via P0 OperationAuthority. */
export const GOVERNANCE_OPERATION_IDS = P0_GOVERNANCE_OPERATION_IDS

/** Operation-scope categories project verbatim to query operation (`any` never projected). */
export const OPERATION_SCOPE_PROJECTION: readonly OperationScope[] = OPERATION_SCOPES

// ---------------------------------------------------------------------------
// Embedded P0 reference shapes (F05.5 / F01) — preserved verbatim, never
// conflated, never retagged to `sha256:`, never recomputed with the P1 encoder,
// never converted among the three shapes. Digest semantics are unchanged from
// upstream: P0 `sha256` output is untagged 64 lowercase hex, computed with P0
// `canonicalJson` (NFC-normalizes string values, does not normalize keys).
// A source authority basis is not a runtime verification receipt or a
// retirement artifact.
// ---------------------------------------------------------------------------

/** Source authority basis (P0 SourceRef, verbatim fields). */
export interface SourceRef {
  readonly sourceId: string
  readonly itemId: string
  readonly locatorDigest: string
  readonly valueDigest: string
}

/** File snapshot at commit (P0 SnapshotEvidence, verbatim fields). */
export interface SnapshotEvidence {
  readonly commit: string
  readonly fullFileSha256: string
}

/** Retirement/process evidence artifact (P0 EvidenceRef, verbatim fields). */
export interface EvidenceRef {
  readonly kind: P0EvidenceKind
  readonly path: string
  readonly digest: string
}

// ---------------------------------------------------------------------------
// F05.5 digest domains
// ---------------------------------------------------------------------------

export const DIGEST_DOMAINS = {
  request: 'foreman-line.kernel-contracts.request',
  effectiveInput: 'foreman-line.kernel-contracts.effective-input',
  policy: 'foreman-line.kernel-contracts.policy',
  registryContent: 'foreman-line.kernel-contracts.registry-content',
  effectivePolicy: 'foreman-line.kernel-contracts.effective-policy',
  effectiveConfiguration: 'foreman-line.kernel-contracts.effective-configuration',
} as const

// ---------------------------------------------------------------------------
// Shared enum lists for golden-vector expectations
// ---------------------------------------------------------------------------

export const EXPECTED_RESPONSE_KINDS = [
  'policy-result',
  'protocol-error',
  'effect-result',
  'adapter-failure',
] as const
