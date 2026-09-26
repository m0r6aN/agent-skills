import type { SchemaObject } from 'ajv'

// Reviewed PMC-P0 map §4, D1–D5. These are constraints, never launch authorization.
// Each authority cap includes denial of approval, merge, release and policy bypass.
// Coordination also denies self-verification/ratification/gate grants; verdicts deny
// artifact editing/self-acceptance; execution denies self-review; economy additionally
// denies security/final verification. Recommend-only denies all execution/control plane.
const gates = ['owner-gate-1', 'dispatch-gate-2', 'owner-gate-3', 'owner-only-break-glass'] as const
const ranking = {
  hardFilters: ['R1', 'R2', 'R3', 'R4', 'R6'],
  budgetFilter: 'R5',
  qualityEvidence: 'R7-per-lane',
  unknownRequiredFacts: 'refuse',
  missingEstimates: 'unit-price-comparison-does-not-waive-budget',
} as const
const stable = [
  'quality-descending',
  'primary-before-fallback',
  'provider-code-point',
  'model-id-code-point',
] as const
const existingBudget = (routingClass: string) =>
  ({
    routingClass,
    status: 'existing-policy',
    sourceRef: `routing-policy.yaml#classes.${routingClass}`,
  }) as const
const unresolvedBudget = (routingClass: string) =>
  ({
    routingClass,
    status: 'unresolved-non-dispatching',
    sourceRef: 'PMC-P2-approved-budget-required',
  }) as const

const laneDeclarations = [
  {
    lane: 'L1',
    roleFamily: 'coordinator',
    subRoles: ['coordinator', 'shaper', 'architect'],
    routingClasses: ['architecture/risk'],
    authorityCap:
      'coordinate-shape-no-ratification-gates-self-review-approval-merge-release-bypass',
    frontierOnly: true,
    independence: 'distinct-instance-family-where-required-unknown-refuses',
    humanGates: gates,
    providerRule: { mode: 'pin', providers: ['opencode'], offPin: 'historical-nonselectable' },
    qualityTolerance: 0,
    enabled: true,
    rankingRequirements: { ...ranking, order: ['pinned-provider-partition', ...stable] },
    budgetPolicyRef: [existingBudget('architecture/risk')],
  },
  {
    lane: 'L2',
    roleFamily: 'verifier',
    subRoles: ['adversarial-reviewer', 'verifier', 'security-auditor'],
    routingClasses: ['architecture/risk', 'review/security'],
    authorityCap: 'verdict-recommendation-no-edit-self-acceptance-approval-merge-release-bypass',
    frontierOnly: true,
    independence: 'distinct-instance-family-where-required-unknown-refuses-primary-and-fallback',
    humanGates: [...gates, 'coordinator-acceptance'],
    providerRule: { mode: 'pin', providers: ['opencode'], offPin: 'historical-nonselectable' },
    qualityTolerance: 0,
    enabled: true,
    rankingRequirements: { ...ranking, order: ['pinned-provider-partition', ...stable] },
    budgetPolicyRef: [existingBudget('architecture/risk'), unresolvedBudget('review/security')],
  },
  {
    lane: 'L3',
    roleFamily: 'builder',
    subRoles: ['builder-complex'],
    routingClasses: ['implementation/complex'],
    authorityCap: 'scoped-execution-no-self-review-approval-merge-release-bypass',
    frontierOnly: false,
    independence: 'independent-reviewer-family-required-unknown-refuses',
    humanGates: gates,
    providerRule: { mode: 'prefer', providers: ['openrouter', 'opencode'] },
    qualityTolerance: 0,
    enabled: true,
    rankingRequirements: { ...ranking, order: ['provider-preference', ...stable] },
    budgetPolicyRef: [unresolvedBudget('implementation/complex')],
  },
  {
    lane: 'L4',
    roleFamily: 'builder',
    subRoles: ['builder-standard'],
    routingClasses: ['standard-feature', 'implementation/standard'],
    authorityCap: 'scoped-execution-no-self-review-approval-merge-release-bypass',
    frontierOnly: false,
    independence: 'independent-reviewer-where-risk-requires-unknown-refuses',
    humanGates: gates,
    providerRule: { mode: 'prefer', providers: ['openrouter', 'opencode'] },
    qualityTolerance: 0,
    enabled: true,
    rankingRequirements: { ...ranking, order: ['provider-preference', ...stable] },
    budgetPolicyRef: [
      existingBudget('standard-feature'),
      existingBudget('implementation/standard'),
    ],
  },
  {
    lane: 'L5',
    roleFamily: 'builder',
    subRoles: ['builder-economy'],
    routingClasses: ['boilerplate'],
    authorityCap:
      'scoped-execution-no-security-self-review-approval-merge-release-final-verification-bypass',
    frontierOnly: false,
    independence: 'parcel-review-required-never-verifier',
    humanGates: gates,
    providerRule: { mode: 'cheapest', providers: ['opencode', 'openrouter'] },
    qualityTolerance: 0,
    enabled: true,
    rankingRequirements: {
      ...ranking,
      order: ['projected-cost-ascending-or-output-then-input-unit-price', ...stable],
    },
    budgetPolicyRef: [existingBudget('boilerplate')],
  },
  {
    lane: 'L6',
    roleFamily: 'classifier',
    subRoles: ['routing-classifier'],
    routingClasses: ['routing/classification'],
    authorityCap:
      'recommend-only-no-prose-execution-review-approval-merge-release-verification-control-plane-promotion',
    frontierOnly: false,
    independence: 'no-authority',
    humanGates: [...gates, 'ratified-amendment-before-reenablement'],
    providerRule: { mode: 'disabled-before-filters-no-hop', providers: ['opencode'] },
    qualityTolerance: 0,
    enabled: false,
    rankingRequirements: { ...ranking, order: [] },
    budgetPolicyRef: [unresolvedBudget('routing/classification')],
  },
] as const

function freeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child)
    Object.freeze(value)
  }
  return value
}
export const PMC_LANE_POLICIES_V1 = freeze(laneDeclarations)

const string = { type: 'string', minLength: 1, maxLength: 2048 }
const boolean = { type: 'boolean' }
const lane = { enum: ['L1', 'L2', 'L3', 'L4', 'L5', 'L6'] }
const object = (properties: Record<string, unknown>) => ({
  type: 'object',
  additionalProperties: false,
  required: Object.keys(properties),
  properties,
})
const list = (items: unknown, maxItems: number) => ({
  type: 'array',
  items,
  maxItems,
  uniqueItems: true,
})
const ref = (name: string) => ({ $ref: `#/$defs/${name}` })
const evidence = (value: unknown) => ({
  oneOf: [ref('unknown'), object({ status: { const: 'recorded' }, value, evidenceRef: string })],
})
const positiveInteger = { type: 'integer', minimum: 1, maximum: Number.MAX_SAFE_INTEGER }

export const providerBindingPolicyV1Schema: SchemaObject = freeze({
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'https://foreman-line.local/schemas/provider-binding-policy-v1.schema.json',
  ...object({
    schemaVersion: { const: 'pmc-provider-binding-policy/v1' },
    compatibility: { const: 'additive-v0-preserved' },
    provenance: ref('provenance'),
    candidates: list(ref('candidate'), 256),
    bindings: list(ref('binding'), 256),
    lanes: { ...list(ref('lanePolicy'), 6), minItems: 6 },
    laneBindings: list(ref('laneBinding'), 1536),
  }),
  $defs: {
    unknown: object({ status: { const: 'unknown' }, reason: string }),
    stringEvidence: evidence(string),
    booleanEvidence: evidence(boolean),
    integerEvidence: evidence(positiveInteger),
    candidate: object({ logicalCandidateId: string, family: ref('stringEvidence') }),
    provenance: object({
      sourceRef: string,
      sourceRevision: string,
      contentSha256: { type: 'string', pattern: '^[a-f0-9]{64}$' },
      catalogVersion: ref('stringEvidence'),
      mappingVersion: string,
      policySchemaVersion: { const: 'pmc-provider-binding-policy/v1' },
      roleMapVersion: string,
      foremanRevision: string,
      piRuntimeVersion: ref('stringEvidence'),
      acquiredAtUtc: ref('stringEvidence'),
      evidenceState: { enum: ['static-conformance', 'live-availability', 'model-quality'] },
      freshnessAcceptance: { enum: ['not-accepted', 'owner-accepted'] },
    }),
    transport: object({ data_collection: { enum: ['allow', 'deny'] }, zdr: boolean }),
    rates: object({
      input: { type: 'number', minimum: 0 },
      output: { type: 'number', minimum: 0 },
      unit: { const: 'USD per 1M tokens' },
    }),
    availability: object({
      available: boolean,
      checkedAtUtc: string,
      attestationRef: string,
      evidenceState: { const: 'live-availability' },
    }),
    quality: object({
      lane,
      score: { type: 'number', minimum: 0, maximum: 1 },
      evidenceRef: string,
      evidenceState: { const: 'model-quality' },
    }),
    eligibility: object({
      dataClasses: evidence(list({ enum: ['public', 'internal', 'restricted'] }, 3)),
      transportRequirements: evidence(ref('transport')),
      toolUse: ref('booleanEvidence'),
      structuredOutput: ref('booleanEvidence'),
      reasoning: ref('booleanEvidence'),
      inputModalities: evidence(list({ enum: ['text', 'image'] }, 2)),
      thinkingLevels: evidence(list(string, 256)),
      contextWindow: ref('integerEvidence'),
      maxTokens: ref('integerEvidence'),
      rates: evidence(ref('rates')),
      enabled: ref('booleanEvidence'),
      availability: evidence(ref('availability')),
      qualityByLane: evidence(list(ref('quality'), 6)),
    }),
    binding: object({
      bindingId: string,
      logicalCandidateId: string,
      provider: { enum: ['opencode', 'openrouter'] },
      providerModelId: string,
      piHostModelId: string,
      protocol: ref('stringEvidence'),
      catalogBaseUrl: ref('stringEvidence'),
      identityState: { enum: ['catalog-recorded', 'owner-attested', 'held'] },
      identityRefusalCodes: list(string, 128),
      eligibility: ref('eligibility'),
    }),
    lanePolicy: {
      oneOf: PMC_LANE_POLICIES_V1.map((value) =>
        object(
          Object.fromEntries(
            Object.entries(value).map(([key, constant]) => [key, { const: constant }]),
          ),
        ),
      ),
    },
    laneBinding: object({
      lane,
      bindingId: string,
      matrixRole: { enum: ['primary', 'fallback'] },
      fallbackBindingId: { anyOf: [string, { type: 'null' }] },
    }),
  },
})
