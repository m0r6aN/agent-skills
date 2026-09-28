import type {
  EligibilityFacts,
  EvidenceState,
  IdentityRefusalCode,
  LanePolicyV1,
  PmcLaneId,
  PmcProvider,
  Provenance,
  ProviderBindingProjectionV1,
  ProviderBindingValidationErrorV1,
} from './index.js'

export type Digest = string // exactly 64 lowercase hexadecimal characters
export type Id = string // ASCII [A-Za-z0-9][A-Za-z0-9._:-]{0,127}
export type Text = string // 1..2048 UTF-16 code units, exact, no normalization
export type UInt = number // integer 0..Number.MAX_SAFE_INTEGER
export type Utc = string // round-trip YYYY-MM-DDTHH:mm:ss.sssZ
export type DataClass = 'public' | 'internal' | 'restricted'
export type Rational = Readonly<{ numerator: string; denominator: string }>
// Canonical unsigned integers, <=64 decimal digits each, denominator >0,
// gcd=1, zero only 0/1. This is a VALUE port, not provider rate parsing.
export type EvidenceRef = Readonly<{
  receiptId: Id
  receiptDigest: Digest
  sourceRef: Text
  sourceDigest: Digest
  policyDigest: Digest
  configDigest: Digest
  requestDigest: Digest
  lane: PmcLaneId
  bindingId: Text | null
  evidenceState: EvidenceState
  observedAtUtc: Utc
  expiresAtUtc: Utc
}>
export type Claim<T> =
  | Readonly<{ status: 'unknown' }>
  | Readonly<{ status: 'supplied'; value: T; evidence: EvidenceRef }>
export type ReviewSubject = Readonly<{
  subjectId: Id
  role: 'builder' | 'coordinator'
  artifactDigest: Digest
  instanceId: Claim<Id>
  family: Claim<Text>
}>
export type IndependenceObligations = Readonly<{
  policyAuthorityRef: Text
  policyAuthorityDigest: Digest
  determinationId: Id
  determinationDigest: Digest
  artifactDigest: Digest
  currentSelection: Readonly<{
    excludedInstanceIds: readonly Id[]
    excludedFamilies: readonly Text[]
    subjectIds: readonly Id[]
  }>
  futureReview: Readonly<{
    duty: 'separate-l2-review' | 'parcel-review'
    subjectBindingId: Text
    subjectInstanceId: Id
    subjectFamily: Text | null
    distinctInstance: true
    differentFamily: boolean
  }> | null
}>
export type PmcRouteRequestV1 = Readonly<{
  version: 'pmc/v1'
  workflowId: Id
  taskId: Id
  episodeId: Id
  requestId: Id
  requestDigest: Digest
  lane: PmcLaneId
  subRole: LanePolicyV1['subRoles'][number]
  routingClass: LanePolicyV1['routingClasses'][number]
  dataClass: DataClass
  requirements: Readonly<{
    toolUse: boolean
    structuredOutput: boolean
    reasoning: boolean
    thinkingLevel: 'off' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh'
    inputModalities: readonly ('text' | 'image')[]
    requiredContextTokens: UInt
    requiredOutputTokens: UInt
    maximumInputTokens: UInt
    maximumOutputTokens: UInt
    rankingTokens: Readonly<{ input: UInt; output: UInt }> | null
  }>
  attempt:
    | Readonly<{ kind: 'initial' }>
    | Readonly<{
        kind: 'fallback'
        priorRequestId: Id
        priorDecisionDigest: Digest
        priorRequestDigest: Digest
        primaryBindingId: Text
        priorDisposition: Claim<'terminal-no-send' | 'terminal-failed-settled' | 'uncertain'>
        primaryQuality: Claim<number>
      }>
}>
export type CatalogClaim = Readonly<{
  source: Claim<
    Readonly<{
      profileId: Text
      profileVersion: Text
      profileDigest: Digest
      snapshotDigest: Digest
      configAuthorityRef: Text
    }>
  >
  provenance: Provenance
  results: readonly (
    | Readonly<{
        provider: PmcProvider
        providerModelId: Text
        outcome: 'facts'
        facts: EligibilityFacts
      }>
    | Readonly<{
        provider: PmcProvider
        providerModelId: Text
        outcome: 'refused'
        codes: readonly IdentityRefusalCode[]
      }>
  )[]
}>
export type BindingClaims = Readonly<{
  bindingId: Text
  protocol: Claim<Text>
  catalogBaseUrl: Claim<Text>
  family: Claim<Text>
  instanceId: Claim<Id>
  frontier: Claim<boolean>
  dataClasses: Claim<readonly DataClass[]>
  transport: Claim<Readonly<{ data_collection: 'allow' | 'deny'; zdr: boolean }>>
  toolUse: Claim<boolean>
  structuredOutput: Claim<boolean>
  enabled: Claim<boolean>
  available: Claim<boolean>
  quality: Claim<number>
  cost: Claim<
    Readonly<{
      currency: 'USD'
      maximumMicroUsd: UInt
      maximumInputTokens: UInt
      maximumOutputTokens: UInt
      sourceProfileId: Text
      sourceProfileVersion: Text
      sourceProfileDigest: Digest
      tariffDigest: Digest
      priceEvidenceDigest: Digest
      costValueDigest: Digest
      ranking:
        | Readonly<{ kind: 'projected'; inputTokens: UInt; outputTokens: UInt; usd: Rational }>
        | Readonly<{
            kind: 'unit-price'
            outputUsdPerMillion: Rational
            inputUsdPerMillion: Rational
          }>
    }>
  >
}>
export type PmcResolverContextV1 = Readonly<{
  projection: ProviderBindingProjectionV1
  policyDigest: Digest
  configDigest: Digest
  evaluationTimeUtc: Utc
  evidenceMode: 'supplied-production-claims' | 'synthetic-offline'
  catalog: CatalogClaim
  episode: Claim<
    Readonly<{
      episodeId: Id
      workflowId: Id
      taskId: Id
      lane: PmcLaneId
      version: 'pmc/v1'
      policyDigest: Digest
      configDigest: Digest
      attempts: readonly Readonly<{
        requestId: Id
        requestDigest: Digest
        decisionDigest: Digest
        bindingId: Text
        provider: PmcProvider
        matrixRole: 'primary' | 'fallback'
        disposition: 'terminal-no-send' | 'terminal-failed-settled' | 'succeeded' | 'uncertain'
      }>[]
    }>
  >
  freshness: Claim<Readonly<{ maximumAgeMs: UInt }>>
  independence: Claim<
    Readonly<{
      policyAuthorityRef: Text
      policyAuthorityDigest: Digest
      determination: Claim<
        Readonly<{
          determinationId: Id
          determinationDigest: Digest
          artifactDigest: Digest
          reviewedLane: 'L1' | 'L3' | 'L4' | 'L5'
          differentFamilyRequired: boolean
        }>
      >
      artifactDigest: Digest
      subjects: readonly ReviewSubject[]
    }>
  >
  budget: Claim<
    Readonly<{
      ledgerId: Id
      epoch: Id
      scopeId: Id
      workflowId: Id
      accountId: Id
      routingClass: PmcRouteRequestV1['routingClass']
      currency: 'USD'
      authorizedLimitMicroUsd: UInt
      classCeilingMicroUsd: UInt
      settledMicroUsd: UInt
      outstandingMicroUsd: UInt
      frozen: boolean
      ceilingAuthorityRef: Text
      ceilingAuthorityDigest: Digest
      snapshotDigest: Digest
    }>
  >
  bindings: readonly BindingClaims[]
}>

export type CandidateCode =
  | 'IDENTITY_UNPROVEN'
  | 'ENDPOINT_MISMATCH'
  | 'OFF_PIN'
  | 'DATA_CLASS_UNKNOWN'
  | 'DATA_CLASS_INELIGIBLE'
  | 'PRIVACY_UNPROVEN'
  | 'CAPABILITY_UNVERIFIED'
  | 'CAPABILITY_MISSING'
  | 'INDEPENDENCE_UNPROVEN'
  | 'INDEPENDENCE_VIOLATION'
  | 'FRONTIER_UNPROVEN'
  | 'FRONTIER_REQUIRED'
  | 'CONTEXT_UNKNOWN'
  | 'CONTEXT_INSUFFICIENT'
  | 'COST_UNKNOWN'
  | 'COST_INVALID'
  | 'BUDGET_EXCEEDED'
  | 'AVAILABILITY_UNVERIFIED'
  | 'QUALITY_UNRECORDED'
  | 'FALLBACK_SUITABILITY_UNPROVEN'
  | 'NOT_DECLARED_FALLBACK'
  | 'FRESHNESS_FUTURE_REFUSED'
  | 'FRESHNESS_STALE_REFUSED'
export type StopCode =
  | 'INPUT_REFUSED'
  | 'VERSION_REFUSED'
  | 'LANE_DISABLED_REFUSED'
  | 'CONTEXT_REFUSED'
  | 'POLICY_REFUSED'
  | 'LANE_REQUEST_REFUSED'
  | 'CONTEXT_BINDING_REFUSED'
  | 'GLOBAL_EVIDENCE_UNPROVEN'
  | 'FRESHNESS_FUTURE_REFUSED'
  | 'FRESHNESS_STALE_REFUSED'
  | 'BUDGET_FROZEN'
  | 'BUDGET_UNPROVEN'
  | 'BUDGET_EXCEEDED'
  | 'PRIOR_ATTEMPT_UNCERTAIN'
  | 'FALLBACK_REFUSED'
  | 'PINNED_PROVIDER_NO_ELIGIBLE'
  | 'NO_ELIGIBLE_BINDING'
  | 'AUDIT_BOUND_REFUSED'
export type CandidateAudit = Readonly<{
  occurrenceIndex: UInt
  bindingId: Text
  policyBindingIndex: UInt
  logicalCandidateIndex: UInt
  claimsIndex: UInt
  catalogResultIndex: UInt
  refusals: readonly CandidateCode[]
  rank: Readonly<{
    providerGroup: 0 | 1
    matrixRole: 'primary' | 'fallback'
    quality: number
    cost: BindingClaims['cost']
    provider: PmcProvider
    providerModelId: Text
  }> | null
}>
export type PmcAuditV1 = Readonly<{
  version: 'pmc/v1'
  evidenceState: 'static-conformance'
  authority: 'selection-only'
  evidenceMode: 'supplied-production-claims' | 'synthetic-offline' | 'not-inspected'
  request: PmcRouteRequestV1 | null
  inputs: PmcResolverContextV1 | null
  candidates: readonly CandidateAudit[]
  policyErrors: readonly ProviderBindingValidationErrorV1[]
  failurePath: string // fixed schema path/index, <=256 units; no caller text
}>
export type PmcRouteDecisionV1 =
  | Readonly<{
      ok: true
      decision: Readonly<{
        version: 'pmc/v1'
        authority: 'selection-only'
        bindingId: Text
        provider: PmcProvider
        providerModelId: Text
        piHostModelId: Text
        protocol: Text
        baseUrl: Text
        maximumMicroUsd: UInt
        terminal: boolean
        independenceObligations: IndependenceObligations
        audit: PmcAuditV1
      }>
    }>
  | Readonly<{ ok: false; code: StopCode; audit: PmcAuditV1 }>
