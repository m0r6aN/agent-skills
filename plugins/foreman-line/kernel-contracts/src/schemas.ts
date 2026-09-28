/**
 * Closed draft-07 JSON Schemas for the FK-P1 kernel contracts (F05).
 *
 * Each exported schema corresponds 1:1 to one generated file in `schemas/`
 * (`npm run generate` writes them via the schema-scaffold helper). `$def`
 * placement follows the F05.1 rule exactly: every shape has exactly one home,
 * every `$ref` resolves to a named `$defs` entry in exactly one file, and no
 * shape referenced from a schema file is left types.ts-only.
 *
 * Cross-file references use `"<file>.schema.json#/$defs/<Name>"`, relative to
 * `$id` (F05.18). All objects are closed (`additionalProperties: false`); all
 * required keys are listed explicitly, including required-nullable keys.
 */
import type { SchemaObject } from 'ajv'
import type { SchemaFile } from '../../schema-scaffold/src/registry.js'
import {
  ASSURANCE_LEVELS,
  AUTHENTICATED_PRINCIPAL_CLASSES,
  CLAIMED_ACTION_CLASSES,
  DECISIONS,
  EFFECT_KINDS,
  EFFECTIVE_ACTION_CLASSES,
  EXPECTED_RESPONSE_KINDS,
  GATE_EVIDENCE_KINDS,
  HOST_POSTURE_CLAIMS,
  INPUT_TRUST_ORIGINS,
  MISSING_ASSURANCE_REASONS,
  MODES,
  NORMALIZER_PARCELS,
  OBLIGATION_KINDS,
  P0_ASSURANCE_LEVELS,
  P0_ENFORCEMENT_OWNERS,
  P0_RESOLUTION_REASON_CODES,
  P0_RESOLVED_DECISIONS,
  P0_RULE_CLASSIFICATIONS,
  P0_SEVERITIES,
  PATH_FORMS,
  PROTOCOL_CODES,
  ROLE_SELECTIONS,
  STAGE_SELECTIONS,
  TRUST_STAGE_EXPECTATIONS,
  WIRE_CODES,
} from './types.js'

const SCHEMA_BASE = 'https://foreman-line.local/schemas/kernel-contracts'
const DRAFT07 = 'http://json-schema.org/draft-07/schema#'

// --- notation builders (F05.1) ---------------------------------------------

const SAFE_INT_MAX = 9007199254740991

const idSchema: SchemaObject = {
  type: 'string',
  minLength: 1,
  maxLength: 128,
  pattern: '^[A-Za-z0-9._-]+$',
}
const nullableIdSchema: SchemaObject = {
  type: ['string', 'null'],
  minLength: 1,
  maxLength: 128,
  pattern: '^[A-Za-z0-9._-]+$',
}
const digestSchema: SchemaObject = { type: 'string', pattern: '^sha256:[0-9a-f]{64}$' }
const nullableDigestSchema: SchemaObject = {
  type: ['string', 'null'],
  pattern: '^sha256:[0-9a-f]{64}$',
}
const safeIntSchema: SchemaObject = { type: 'integer', minimum: 0, maximum: SAFE_INT_MAX }
const nullableSafeIntSchema: SchemaObject = {
  type: ['integer', 'null'],
  minimum: 0,
  maximum: SAFE_INT_MAX,
}
const nullableMicrosSchema: SchemaObject = nullableSafeIntSchema
const bytesSchema = (maxLength: number): SchemaObject => ({ type: 'string', maxLength })
const asciiBytesSchema = (maxLength: number): SchemaObject => ({
  type: 'string',
  maxLength,
  pattern: '^[\\x00-\\x7F]*$',
})
const plainStringSchema: SchemaObject = { type: 'string' }
const apiVersionSchema: SchemaObject = { const: '0.1.0' }
const enumSchema = (values: readonly string[]): SchemaObject => ({ enum: [...values] })
const arrayOf = (items: SchemaObject, maxItems: number): SchemaObject => ({
  type: 'array',
  items,
  maxItems,
})
const idArraySchema = (maxItems: number): SchemaObject => arrayOf(idSchema, maxItems)

function closedObject(
  properties: Record<string, SchemaObject>,
  required: readonly string[],
): SchemaObject {
  return { type: 'object', properties, required: [...required], additionalProperties: false }
}

// ---------------------------------------------------------------------------
// lifecycle-event.schema.json — LifecycleEvent, ProposedPath, event payloads
// ---------------------------------------------------------------------------

const proposedPathSchema = closedObject(
  { rawPath: bytesSchema(4096), pathForm: enumSchema(PATH_FORMS) },
  ['rawPath', 'pathForm'],
)

const sessionStartPayloadSchema: SchemaObject = { type: 'object', additionalProperties: false }

const preToolUsePayloadSchema = closedObject(
  {
    toolRef: idSchema,
    proposedPaths: arrayOf({ $ref: '#/$defs/ProposedPath' }, 64),
  },
  ['toolRef', 'proposedPaths'],
)

const postToolUsePayloadSchema = closedObject(
  {
    toolRef: idSchema,
    observedEffects: arrayOf(
      { $ref: 'authorize-action-input.schema.json#/$defs/ObservedEffect' },
      64,
    ),
  },
  ['toolRef', 'observedEffects'],
)

const stopPayloadSchema = closedObject({ requestedCompletionSubject: idSchema }, [
  'requestedCompletionSubject',
])

const lifecycleCommonProperties = (): Record<string, SchemaObject> => ({
  apiVersion: apiVersionSchema,
  eventId: idSchema,
  sessionRef: idSchema,
  hostAdapterRef: idSchema,
  claimedRepositoryRef: nullableIdSchema,
  claimedWorktreeRef: nullableIdSchema,
  actionRef: idSchema,
  claimedActionClass: enumSchema(CLAIMED_ACTION_CLASSES),
})

const LIFECYCLE_COMMON_REQUIRED = [
  'apiVersion',
  'eventId',
  'sessionRef',
  'hostAdapterRef',
  'claimedRepositoryRef',
  'claimedWorktreeRef',
  'actionRef',
  'claimedActionClass',
] as const

const lifecycleEventSchema: SchemaObject = {
  oneOf: [
    closedObject(
      {
        event: { const: 'sessionStart' },
        ...lifecycleCommonProperties(),
        payload: { $ref: '#/$defs/SessionStartPayload' },
      },
      ['event', ...LIFECYCLE_COMMON_REQUIRED, 'payload'],
    ),
    closedObject(
      {
        event: { const: 'preToolUse' },
        ...lifecycleCommonProperties(),
        payload: { $ref: '#/$defs/PreToolUsePayload' },
      },
      ['event', ...LIFECYCLE_COMMON_REQUIRED, 'payload'],
    ),
    closedObject(
      {
        event: { const: 'postToolUse' },
        ...lifecycleCommonProperties(),
        payload: { $ref: '#/$defs/PostToolUsePayload' },
      },
      ['event', ...LIFECYCLE_COMMON_REQUIRED, 'payload'],
    ),
    closedObject(
      {
        event: { const: 'stop' },
        ...lifecycleCommonProperties(),
        payload: { $ref: '#/$defs/StopPayload' },
      },
      ['event', ...LIFECYCLE_COMMON_REQUIRED, 'payload'],
    ),
  ],
}

// ---------------------------------------------------------------------------
// admitted-context.schema.json — AdmittedContext + the two principal variants
// ---------------------------------------------------------------------------

const lifecycleProvenanceInline: SchemaObject = closedObject(
  { provenanceId: idSchema, hostAdapterRef: idSchema, provenanceDigest: digestSchema },
  ['provenanceId', 'hostAdapterRef', 'provenanceDigest'],
)

const admittedContextAuthenticatedSchema = closedObject(
  {
    principalKind: { const: 'authenticated' },
    principalRef: idSchema,
    principalClass: enumSchema(AUTHENTICATED_PRINCIPAL_CLASSES),
    capabilityRef: idSchema,
    capabilityGeneration: safeIntSchema,
    capabilityValidUntilMicros: nullableMicrosSchema,
    capabilityRevocationRef: nullableIdSchema,
    admissionIssuerRef: idSchema,
    admittedEndpoint: enumSchema(['control', 'read']),
    boundRepositoryRef: nullableIdSchema,
    boundWorktreeRef: nullableIdSchema,
    boundSessionRef: idSchema,
    permittedOperationIds: idArraySchema(64),
    roleSelection: enumSchema(ROLE_SELECTIONS),
    stageSelection: enumSchema(STAGE_SELECTIONS),
    provenanceRef: lifecycleProvenanceInline,
  },
  [
    'principalKind',
    'principalRef',
    'principalClass',
    'capabilityRef',
    'capabilityGeneration',
    'capabilityValidUntilMicros',
    'capabilityRevocationRef',
    'admissionIssuerRef',
    'admittedEndpoint',
    'boundRepositoryRef',
    'boundWorktreeRef',
    'boundSessionRef',
    'permittedOperationIds',
    'roleSelection',
    'stageSelection',
    'provenanceRef',
  ],
)

const admittedContextAnonymousSchema = closedObject(
  {
    principalKind: { const: 'anonymous-content' },
    principalClass: { const: 'anonymous-read' },
    admittedEndpoint: { const: 'read' },
    boundSessionRef: nullableIdSchema,
  },
  ['principalKind', 'principalClass', 'admittedEndpoint', 'boundSessionRef'],
)

const admittedContextSchema: SchemaObject = {
  oneOf: [
    { $ref: '#/$defs/AdmittedContextAuthenticated' },
    { $ref: '#/$defs/AdmittedContextAnonymousContent' },
  ],
}

// ---------------------------------------------------------------------------
// authorize-action-input.schema.json — AuthorizeActionInput, EffectiveActionClass,
// PolicyIdentity, LeaseCasDescriptor, GitGateEvidenceRef, ObservedEffect
// ---------------------------------------------------------------------------

const observedEffectSchema = closedObject(
  {
    effectKind: enumSchema(EFFECT_KINDS),
    descriptor: bytesSchema(4096),
    digest: nullableDigestSchema,
  },
  ['effectKind', 'descriptor', 'digest'],
)

const effectiveActionClassSchema: SchemaObject = enumSchema(EFFECTIVE_ACTION_CLASSES)

const leaseCasDescriptorSchema = closedObject(
  {
    leaseId: nullableIdSchema,
    leaseOwnerPrincipalRef: nullableIdSchema,
    casRevision: safeIntSchema,
    leaseExpiresAtMicros: nullableMicrosSchema,
  },
  ['leaseId', 'leaseOwnerPrincipalRef', 'casRevision', 'leaseExpiresAtMicros'],
)

const gitGateEvidenceRefSchema = closedObject(
  {
    evidenceKind: enumSchema(GATE_EVIDENCE_KINDS),
    gitIdentity: bytesSchema(256),
    digest: digestSchema,
  },
  ['evidenceKind', 'gitIdentity', 'digest'],
)

const policyIdentitySchema = closedObject(
  {
    policyIdentityVersion: apiVersionSchema,
    registry: closedObject(
      {
        registryId: { const: 'foreman-kernel-authority-enforcement' },
        schemaVersion: { const: '0.1.0' },
        sourceSnapshotCommit: plainStringSchema,
        registryContentDigest: digestSchema,
      },
      ['registryId', 'schemaVersion', 'sourceSnapshotCommit', 'registryContentDigest'],
    ),
    effectivePolicyDigest: digestSchema,
    effectiveConfigurationDigest: digestSchema,
  },
  ['policyIdentityVersion', 'registry', 'effectivePolicyDigest', 'effectiveConfigurationDigest'],
)

const repositoryIdentitySchema: SchemaObject = {
  type: ['object', 'null'],
  properties: { repositoryRef: idSchema, worktreeRef: idSchema },
  required: ['repositoryRef', 'worktreeRef'],
  additionalProperties: false,
}

const authorizeActionInputSchema = closedObject(
  {
    callerInputs: closedObject(
      { lifecycleEvent: { $ref: 'lifecycle-event.schema.json#/$defs/LifecycleEvent' } },
      ['lifecycleEvent'],
    ),
    trustedBindings: closedObject(
      {
        admittedContext: { $ref: 'admitted-context.schema.json#/$defs/AdmittedContext' },
        lifecycleProvenance: lifecycleProvenanceInline,
        effectiveActionClass: { $ref: '#/$defs/EffectiveActionClass' },
        repositoryIdentity: repositoryIdentitySchema,
        policyDigest: digestSchema,
        scopeDigest: nullableDigestSchema,
        goalRevision: nullableSafeIntSchema,
        leaseState: { $ref: '#/$defs/LeaseCasDescriptor' },
        gateEvidenceRefs: arrayOf({ $ref: '#/$defs/GitGateEvidenceRef' }, 64),
        mode: enumSchema(MODES),
        observedEffects: arrayOf({ $ref: '#/$defs/ObservedEffect' }, 64),
        idempotencyKey: {
          oneOf: [
            { $ref: 'decision-envelope.schema.json#/$defs/IdempotencyBinding' },
            { type: 'null' },
          ],
        },
      },
      [
        'admittedContext',
        'lifecycleProvenance',
        'effectiveActionClass',
        'repositoryIdentity',
        'policyDigest',
        'scopeDigest',
        'goalRevision',
        'leaseState',
        'gateEvidenceRefs',
        'mode',
        'observedEffects',
        'idempotencyKey',
      ],
    ),
  },
  ['callerInputs', 'trustedBindings'],
)

// ---------------------------------------------------------------------------
// decision-envelope.schema.json — WireCode, DecisionEnvelope, PrincipalProjection,
// ProtocolError, UpstreamPolicyEvidence, AssuranceClaim, AssuranceEvidenceRef,
// EffectResult, IdempotencyBinding, Violation, Obligation
// ---------------------------------------------------------------------------

const wireCodeSchema: SchemaObject = enumSchema(WIRE_CODES)

const idempotencyBindingSchema = closedObject(
  {
    principalRef: idSchema,
    operationId: idSchema,
    repositoryRef: idSchema,
    worktreeRef: idSchema,
    payloadDigest: digestSchema,
  },
  ['principalRef', 'operationId', 'repositoryRef', 'worktreeRef', 'payloadDigest'],
)

const violationSchema = closedObject(
  {
    code: { $ref: '#/$defs/WireCode' },
    invariantId: idSchema,
    path: { type: 'string', maxLength: 256, pattern: '^[A-Za-z0-9._\\-/\\[\\]]+$' },
  },
  ['code', 'invariantId', 'path'],
)

const obligationSchema: SchemaObject = {
  oneOf: [
    closedObject(
      {
        obligationId: idSchema,
        kind: { const: 'post-diff-inspection' },
        payload: closedObject({ scopeDigest: digestSchema }, ['scopeDigest']),
      },
      ['obligationId', 'kind', 'payload'],
    ),
    closedObject(
      {
        obligationId: idSchema,
        kind: { const: 'fresh-scm-evidence' },
        payload: closedObject(
          {
            evidenceKind: enumSchema(['commit-ref', 'signature', 'status-check']),
            maxEvidenceAgeMicros: nullableMicrosSchema,
          },
          ['evidenceKind', 'maxEvidenceAgeMicros'],
        ),
      },
      ['obligationId', 'kind', 'payload'],
    ),
    closedObject(
      {
        obligationId: idSchema,
        kind: { const: 'stop-report-emission' },
        payload: closedObject(
          { transitionDescription: bytesSchema(4096), awaitingHuman: { const: true } },
          ['transitionDescription', 'awaitingHuman'],
        ),
      },
      ['obligationId', 'kind', 'payload'],
    ),
    closedObject(
      {
        obligationId: idSchema,
        kind: { const: 'degraded-read-logging' },
        payload: closedObject(
          {
            degradedReason: enumSchema([
              'kernel-unreachable',
              'decision-deadline-exceeded',
              'outage-mode',
            ]),
          },
          ['degradedReason'],
        ),
      },
      ['obligationId', 'kind', 'payload'],
    ),
    closedObject(
      {
        obligationId: idSchema,
        kind: { const: 'latency-recording' },
        payload: closedObject(
          {
            span: enumSchema([
              'kernelDecisionLatency',
              'mediatedActionLatency',
              'firstCallObservation',
            ]),
            elapsedMicros: safeIntSchema,
            budgetMicros: safeIntSchema,
          },
          ['span', 'elapsedMicros', 'budgetMicros'],
        ),
      },
      ['obligationId', 'kind', 'payload'],
    ),
  ],
}

const assuranceEvidenceRefSchema: SchemaObject = {
  oneOf: [
    closedObject({ checkId: idSchema, fixtureDigest: digestSchema }, ['checkId', 'fixtureDigest']),
    closedObject({ runId: idSchema, hostAdapterRef: idSchema, runDigest: digestSchema }, [
      'runId',
      'hostAdapterRef',
      'runDigest',
    ]),
    closedObject({ detectorId: idSchema, detectionDigest: digestSchema }, [
      'detectorId',
      'detectionDigest',
    ]),
    closedObject({ workflowRef: idSchema, runDigest: digestSchema }, ['workflowRef', 'runDigest']),
    closedObject({ gateArtifactRef: idSchema, gitEvidenceDigest: digestSchema }, [
      'gateArtifactRef',
      'gitEvidenceDigest',
    ]),
    closedObject({ probeId: idSchema, probeDigest: digestSchema }, ['probeId', 'probeDigest']),
    closedObject({ postureEventId: idSchema, postureDigest: digestSchema }, [
      'postureEventId',
      'postureDigest',
    ]),
  ],
}

const assuranceClaimSchema = closedObject(
  {
    assuranceLevel: enumSchema(ASSURANCE_LEVELS),
    evidence: arrayOf({ $ref: '#/$defs/AssuranceEvidenceRef' }, 8),
    missingAssuranceReason: {
      oneOf: [enumSchema(MISSING_ASSURANCE_REASONS), { type: 'null' }],
    },
  },
  ['assuranceLevel', 'evidence', 'missingAssuranceReason'],
)

const upstreamPolicyEvidenceSchema: SchemaObject = {
  oneOf: [
    closedObject(
      {
        outcome: { const: 'RESOLVED' },
        subject: plainStringSchema,
        claim: plainStringSchema,
        decision: enumSchema(P0_RESOLVED_DECISIONS),
        classification: enumSchema(P0_RULE_CLASSIFICATIONS),
        assurance: enumSchema(P0_ASSURANCE_LEVELS),
        enforcementOwner: enumSchema(P0_ENFORCEMENT_OWNERS),
        severity: enumSchema(P0_SEVERITIES),
        controllingRuleIds: idArraySchema(64),
        consideredRuleIds: idArraySchema(64),
      },
      [
        'outcome',
        'subject',
        'claim',
        'decision',
        'classification',
        'assurance',
        'enforcementOwner',
        'severity',
        'controllingRuleIds',
        'consideredRuleIds',
      ],
    ),
    closedObject(
      {
        outcome: { const: 'REQUIRE_HUMAN' },
        subject: plainStringSchema,
        reasonCode: enumSchema(P0_RESOLUTION_REASON_CODES),
        controllingRuleIds: { const: [] },
        consideredRuleIds: idArraySchema(64),
      },
      ['outcome', 'subject', 'reasonCode', 'controllingRuleIds', 'consideredRuleIds'],
    ),
  ],
}

const principalProjectionSchema: SchemaObject = {
  oneOf: [
    closedObject(
      { principalClass: enumSchema(AUTHENTICATED_PRINCIPAL_CLASSES), principalRef: idSchema },
      ['principalClass', 'principalRef'],
    ),
    closedObject({ principalClass: { const: 'anonymous-read' } }, ['principalClass']),
  ],
}

const decisionEnvelopeCommonProperties = (): Record<string, SchemaObject> => ({
  resultKind: { const: 'policy-result' },
  apiVersion: apiVersionSchema,
  toolVersion: asciiBytesSchema(128),
  code: { $ref: '#/$defs/WireCode' },
  violations: arrayOf({ $ref: '#/$defs/Violation' }, 64),
  requestDigest: digestSchema,
  inputDigest: digestSchema,
  policyDigest: digestSchema,
  principal: { $ref: '#/$defs/PrincipalProjection' },
  assurance: { $ref: '#/$defs/AssuranceClaim' },
  obligations: arrayOf({ $ref: '#/$defs/Obligation' }, 64),
  goalRevision: safeIntSchema,
  policyEvidence: {
    oneOf: [{ $ref: '#/$defs/UpstreamPolicyEvidence' }, { type: 'null' }],
  },
})

const DECISION_ENVELOPE_COMMON_REQUIRED = [
  'resultKind',
  'apiVersion',
  'toolVersion',
  'code',
  'violations',
  'requestDigest',
  'inputDigest',
  'policyDigest',
  'principal',
  'assurance',
  'obligations',
  'policyEvidence',
] as const

const decisionEnvelopeSchema: SchemaObject = {
  oneOf: [
    closedObject(
      {
        ...decisionEnvelopeCommonProperties(),
        mode: enumSchema(['enforcing', 'degraded-read-only']),
        decision: enumSchema(DECISIONS),
      },
      [...DECISION_ENVELOPE_COMMON_REQUIRED, 'mode', 'decision'],
    ),
    closedObject(
      {
        ...decisionEnvelopeCommonProperties(),
        mode: { const: 'shadow' },
        decision: { const: 'ADVISORY' },
        wouldDecision: enumSchema(DECISIONS),
      },
      [...DECISION_ENVELOPE_COMMON_REQUIRED, 'mode', 'decision', 'wouldDecision'],
    ),
  ],
}

const protocolErrorSchema = closedObject(
  {
    resultKind: { const: 'protocol-error' },
    protocolCode: enumSchema(PROTOCOL_CODES),
    safeDiagnostic: asciiBytesSchema(256),
    correlationRef: nullableIdSchema,
    apiVersion: { type: ['string', 'null'], maxLength: 32 },
    toolVersion: asciiBytesSchema(128),
  },
  ['resultKind', 'protocolCode', 'safeDiagnostic', 'correlationRef', 'apiVersion', 'toolVersion'],
)

const effectResultSchema = closedObject(
  {
    resultKind: { const: 'effect-result' },
    apiVersion: apiVersionSchema,
    toolVersion: asciiBytesSchema(128),
    decision: enumSchema(['APPLIED', 'NOOP']),
    code: enumSchema(['EFFECT_APPLIED', 'EFFECT_NOOP']),
    idempotencyKey: { $ref: '#/$defs/IdempotencyBinding' },
    effectDigest: nullableDigestSchema,
    goalRevision: safeIntSchema,
  },
  [
    'resultKind',
    'apiVersion',
    'toolVersion',
    'decision',
    'code',
    'idempotencyKey',
    'effectDigest',
    'goalRevision',
  ],
)

// ---------------------------------------------------------------------------
// repository-read-request.schema.json — ReadRequest (D19)
// ---------------------------------------------------------------------------

const readRequestSchema: SchemaObject = {
  oneOf: [
    closedObject(
      {
        readKind: { const: 'content-only' },
        content: bytesSchema(65536),
        contentEncoding: { const: 'utf-8' },
      },
      ['readKind', 'content', 'contentEncoding'],
    ),
    closedObject(
      {
        readKind: { const: 'repository-read' },
        repoId: idSchema,
        relativePath: bytesSchema(4096),
        maxBytes: { type: 'integer', minimum: 0, maximum: 1048576 },
      },
      ['readKind', 'repoId', 'relativePath', 'maxBytes'],
    ),
  ],
}

// ---------------------------------------------------------------------------
// host-capability.schema.json — HostCapability (D20)
// ---------------------------------------------------------------------------

const hostCapabilitySchema = closedObject(
  {
    hostAdapterRef: idSchema,
    hostPostureClaim: enumSchema(HOST_POSTURE_CLAIMS),
    platformProbe: closedObject({ probeName: bytesSchema(128), probeVersion: bytesSchema(128) }, [
      'probeName',
      'probeVersion',
    ]),
    rawHostPaths: arrayOf(
      closedObject({ rawPath: bytesSchema(4096), pathForm: enumSchema(PATH_FORMS) }, [
        'rawPath',
        'pathForm',
      ]),
      64,
    ),
    normalizationEvidence: {
      type: ['object', 'null'],
      properties: {
        normalizationRef: idSchema,
        normalizerParcel: enumSchema(NORMALIZER_PARCELS),
        digest: digestSchema,
      },
      required: ['normalizationRef', 'normalizerParcel', 'digest'],
      additionalProperties: false,
    },
  },
  ['hostAdapterRef', 'hostPostureClaim', 'platformProbe', 'rawHostPaths', 'normalizationEvidence'],
)

// ---------------------------------------------------------------------------
// latency-contract.schema.json — LatencyContract and CacheDescriptor (D21)
// ---------------------------------------------------------------------------

const cacheDescriptorSchema = closedObject(
  {
    authorizationCache: { const: 'disabled' },
    bindings: { const: ['goalRevision', 'policyDigest', 'compiledScopeDigest'] },
    matchSufficiency: { const: 'necessary-not-sufficient' },
    freshnessRevalidation: {
      const: [
        'effective-action-request',
        'principal-capability-generation',
        'repository-worktree',
        'lease-gate-freshness',
      ],
    },
    ttlAuthority: { const: 'none' },
    latencyEligibility: { const: 'none-granted' },
  },
  [
    'authorizationCache',
    'bindings',
    'matchSufficiency',
    'freshnessRevalidation',
    'ttlAuthority',
    'latencyEligibility',
  ],
)

const latencyContractSchema = closedObject(
  {
    spans: closedObject(
      {
        kernelDecisionLatency: closedObject(
          {
            start: { const: 'decision-surface-request-received' },
            end: { const: 'response-written' },
            clock: { const: 'kernel-monotonic' },
          },
          ['start', 'end', 'clock'],
        ),
        mediatedActionLatency: closedObject(
          {
            start: { const: 'host-lifecycle-entry' },
            end: { const: 'hook-exit' },
            clock: { const: 'adapter-monotonic' },
          },
          ['start', 'end', 'clock'],
        ),
        firstCallObservation: closedObject(
          {
            start: { const: 'initial-lifecycle-invocation' },
            end: { const: 'hook-exit' },
            clock: { const: 'adapter-monotonic' },
            includesStartup: { const: true },
          },
          ['start', 'end', 'clock', 'includesStartup'],
        ),
      },
      ['kernelDecisionLatency', 'mediatedActionLatency', 'firstCallObservation'],
    ),
    budgetsMicros: closedObject(
      {
        kernelWarmP50: { const: 5000 },
        kernelWarmP95: { const: 20000 },
        kernelWarmP99: { const: 50000 },
        mediatedP99: { const: 150000 },
        firstCallMax: { const: 2000000 },
      },
      ['kernelWarmP50', 'kernelWarmP95', 'kernelWarmP99', 'mediatedP99', 'firstCallMax'],
    ),
    decisionDeadlineMicros: { const: 1000000 },
    deadlineDisposition: enumSchema([
      'evaluate-completed-response-at-or-under-deadline',
      'terminal-unreachable-when-none-completed',
    ]),
    lateResponsePolicy: { const: 'ignore-terminal-outcome' },
    warmPopulation: {
      const: 'completed-governed-mutation-decision-attempts-after-readiness-and-initial-invocation',
    },
    exclusionReporting: {
      const: 'failed-deadline-and-excluded-attempts-reported-separately',
    },
    percentileMethod: { const: 'nearest-rank' },
    cache: { $ref: '#/$defs/CacheDescriptor' },
  },
  [
    'spans',
    'budgetsMicros',
    'decisionDeadlineMicros',
    'deadlineDisposition',
    'lateResponsePolicy',
    'warmPopulation',
    'exclusionReporting',
    'percentileMethod',
    'cache',
  ],
)

// ---------------------------------------------------------------------------
// golden-vector.schema.json — GoldenVectorFixture and GoldenVectorCase
// ---------------------------------------------------------------------------

const nullableDecisionSchema: SchemaObject = {
  oneOf: [enumSchema([...DECISIONS, 'APPLIED', 'NOOP']), { type: 'null' }],
}

const goldenVectorCaseSchema = closedObject(
  {
    caseId: idSchema,
    charterClause: bytesSchema(128),
    producerParcel: bytesSchema(32),
    consumerParcel: bytesSchema(32),
    inputTrustOrigin: enumSchema(INPUT_TRUST_ORIGINS),
    request: {
      oneOf: [
        { $ref: 'lifecycle-event.schema.json#/$defs/LifecycleEvent' },
        { $ref: 'repository-read-request.schema.json#/$defs/ReadRequest' },
        { $ref: 'authorize-action-input.schema.json#/$defs/AuthorizeActionInput' },
      ],
    },
    expectedResponseKind: enumSchema(EXPECTED_RESPONSE_KINDS),
    expectedCode: { $ref: 'decision-envelope.schema.json#/$defs/WireCode' },
    expectedDecision: nullableDecisionSchema,
    expectedWouldDecision: nullableDecisionSchema,
    expectedAssuranceLevel: enumSchema(ASSURANCE_LEVELS),
    expectedObligations: arrayOf(enumSchema(OBLIGATION_KINDS), 8),
    trustStageExpectation: enumSchema(TRUST_STAGE_EXPECTATIONS),
    expectedRequestDigest: nullableDigestSchema,
    expectedInputDigest: nullableDigestSchema,
    verificationStage: { const: 'contract-only' },
    laterOwner: bytesSchema(32),
  },
  [
    'caseId',
    'charterClause',
    'producerParcel',
    'consumerParcel',
    'inputTrustOrigin',
    'request',
    'expectedResponseKind',
    'expectedCode',
    'expectedDecision',
    'expectedWouldDecision',
    'expectedAssuranceLevel',
    'expectedObligations',
    'trustStageExpectation',
    'expectedRequestDigest',
    'expectedInputDigest',
    'verificationStage',
    'laterOwner',
  ],
)

const goldenVectorFixtureSchema = closedObject(
  {
    apiVersion: apiVersionSchema,
    cases: {
      type: 'array',
      items: { $ref: '#/$defs/GoldenVectorCase' },
      minItems: 1,
      maxItems: 256,
    },
  },
  ['apiVersion', 'cases'],
)

// ---------------------------------------------------------------------------
// File assembly (F05.1 $def placement; F05.18 $schema/$id)
// ---------------------------------------------------------------------------

function schemaFile(name: string, defs: Record<string, SchemaObject>): SchemaFile {
  return {
    name,
    schema: {
      $schema: DRAFT07,
      $id: `${SCHEMA_BASE}/${name}.schema.json`,
      $defs: defs,
    },
  }
}

export const lifecycleEventSchemaFile = schemaFile('lifecycle-event', {
  LifecycleEvent: lifecycleEventSchema,
  ProposedPath: proposedPathSchema,
  SessionStartPayload: sessionStartPayloadSchema,
  PreToolUsePayload: preToolUsePayloadSchema,
  PostToolUsePayload: postToolUsePayloadSchema,
  StopPayload: stopPayloadSchema,
})

export const admittedContextSchemaFile = schemaFile('admitted-context', {
  AdmittedContext: admittedContextSchema,
  AdmittedContextAuthenticated: admittedContextAuthenticatedSchema,
  AdmittedContextAnonymousContent: admittedContextAnonymousSchema,
})

export const authorizeActionInputSchemaFile = schemaFile('authorize-action-input', {
  AuthorizeActionInput: authorizeActionInputSchema,
  EffectiveActionClass: effectiveActionClassSchema,
  PolicyIdentity: policyIdentitySchema,
  LeaseCasDescriptor: leaseCasDescriptorSchema,
  GitGateEvidenceRef: gitGateEvidenceRefSchema,
  ObservedEffect: observedEffectSchema,
})

export const decisionEnvelopeSchemaFile = schemaFile('decision-envelope', {
  WireCode: wireCodeSchema,
  DecisionEnvelope: decisionEnvelopeSchema,
  PrincipalProjection: principalProjectionSchema,
  ProtocolError: protocolErrorSchema,
  UpstreamPolicyEvidence: upstreamPolicyEvidenceSchema,
  AssuranceClaim: assuranceClaimSchema,
  AssuranceEvidenceRef: assuranceEvidenceRefSchema,
  EffectResult: effectResultSchema,
  IdempotencyBinding: idempotencyBindingSchema,
  Violation: violationSchema,
  Obligation: obligationSchema,
})

export const repositoryReadRequestSchemaFile = schemaFile('repository-read-request', {
  ReadRequest: readRequestSchema,
})

export const hostCapabilitySchemaFile = schemaFile('host-capability', {
  HostCapability: hostCapabilitySchema,
})

export const latencyContractSchemaFile = schemaFile('latency-contract', {
  LatencyContract: latencyContractSchema,
  CacheDescriptor: cacheDescriptorSchema,
})

export const goldenVectorSchemaFile = schemaFile('golden-vector', {
  GoldenVectorFixture: goldenVectorFixtureSchema,
  GoldenVectorCase: goldenVectorCaseSchema,
})

/** All eight schema files, in F05.1 order. `npm run generate` writes exactly these. */
export const allSchemaFiles: readonly SchemaFile[] = [
  lifecycleEventSchemaFile,
  admittedContextSchemaFile,
  authorizeActionInputSchemaFile,
  decisionEnvelopeSchemaFile,
  repositoryReadRequestSchemaFile,
  hostCapabilitySchemaFile,
  latencyContractSchemaFile,
  goldenVectorSchemaFile,
]
