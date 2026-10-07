/**
 * Hand-authored JSON Schema draft-07 literals, each typed as ajv's `SchemaObject`
 * (never `JSONSchemaType<T>` — banned as a schema authority in this repo).
 * `tests/parity.test.ts` proves each schema agrees with its `types.ts` counterpart
 * via a canonical sample, and that the committed `schemas/*.json` files never drift.
 *
 * The four semantic invariants (classification-gates-before-cost, coordinator/
 * verifier frontier pinning, the security override, and its derived name-guard)
 * are intentionally NOT encoded here — they are cross-field business rules
 * enforced by `validator.ts`, kept distinct from pure structural shape so a
 * schema-valid-but-semantically-wrong document is distinguishable from a
 * structurally invalid one (both classes of rejecting fixture are needed
 * separately per AC6).
 */
import type { SchemaObject } from 'ajv'

export const classEntrySchema: SchemaObject = {
  type: 'object',
  additionalProperties: false,
  required: ['allowlist', 'ceiling_usd'],
  properties: {
    allowlist: {
      type: 'array',
      items: { type: 'string', minLength: 1 },
      minItems: 1,
    },
    ceiling_usd: { type: 'number', exclusiveMinimum: 0 },
    security_flavored: { type: 'boolean' },
  },
}

export const transportRequirementsSchema: SchemaObject = {
  type: 'object',
  additionalProperties: false,
  required: ['data_collection', 'zdr'],
  properties: {
    data_collection: { enum: ['allow', 'deny'] },
    zdr: { type: 'boolean' },
  },
}

export const dataClassificationRuleSchema: SchemaObject = {
  type: 'object',
  additionalProperties: false,
  required: ['transport_requirements'],
  properties: {
    transport_requirements: transportRequirementsSchema,
  },
}

export const shadowRouteSchema: SchemaObject = {
  type: 'object',
  additionalProperties: false,
  required: [
    'adapter_id',
    'data_classification',
    'allowed_task_types',
    'requires_live_discovery',
    'candidate_only',
    'authority',
    'tools_granted',
    'effect_capability',
    'prohibited_roles',
  ],
  properties: {
    adapter_id: { type: 'string', minLength: 1 },
    data_classification: { const: 'public' },
    allowed_task_types: {
      type: 'array',
      items: { enum: ['spec_lint', 'evidence_index', 'review_triage'] },
      minItems: 1,
      uniqueItems: true,
    },
    requires_live_discovery: { const: true },
    candidate_only: { const: true },
    authority: { const: 'none' },
    tools_granted: { type: 'array', maxItems: 0 },
    effect_capability: { const: 'none' },
    prohibited_roles: {
      type: 'array',
      items: { enum: ['coordinator', 'verifier'] },
      minItems: 2,
      maxItems: 2,
      uniqueItems: true,
    },
  },
}

// ---------------------------------------------------------------------------
// PMC-P1 — provider-neutral fallback contract (charter A5.1–A5.5, A3).
// Structural shape only: cross-field rules (referential integrity, fallback
// policy, frozen-map pins, evidence honesty) stay in `validator.ts`.
// ---------------------------------------------------------------------------

/**
 * `{ state: declared, value, source }` — asserted from a named source. Shared
 * with `pi-openrouter.ts` (HRO-P1 mapping provenance) so the Evidence-envelope
 * mechanism exists exactly once.
 */
export function declaredEvidence(value: SchemaObject): SchemaObject {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['state', 'value', 'source'],
    properties: {
      state: { const: 'declared' },
      value,
      source: { type: 'string', minLength: 1 },
    },
  }
}

/** Typed-unavailable: a named residual, never a guessed value. */
function unprovenEvidence(): SchemaObject {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['state', 'residual'],
    properties: {
      state: { enum: ['unknown', 'unverified', 'unproven'] },
      residual: { type: 'string', minLength: 1 },
    },
  }
}

function evidence(value: SchemaObject): SchemaObject {
  return { oneOf: [declaredEvidence(value), unprovenEvidence()] }
}

/** A frozen declaration slot with an unfabricated residual (a54 items 2/3/5). */
export const residualSlotSchema: SchemaObject = {
  type: 'object',
  additionalProperties: false,
  required: ['state', 'residual'],
  properties: {
    state: { const: 'unavailable' },
    residual: { type: 'string', minLength: 1 },
  },
}

export const providerRuleSchema: SchemaObject = {
  oneOf: [
    {
      type: 'object',
      additionalProperties: false,
      required: ['kind', 'pinned_provider'],
      properties: {
        kind: { const: 'pinned-provider' },
        pinned_provider: residualSlotSchema,
      },
    },
    {
      type: 'object',
      additionalProperties: false,
      required: ['kind', 'preference'],
      properties: {
        kind: { const: 'declared-preference' },
        preference: residualSlotSchema,
      },
    },
    {
      type: 'object',
      additionalProperties: false,
      required: ['kind'],
      properties: { kind: { const: 'cheapest-eligible' } },
    },
    {
      type: 'object',
      additionalProperties: false,
      required: ['kind', 'refusal'],
      properties: {
        kind: { const: 'none' },
        refusal: { const: 'LANE_DISABLED_REFUSED' },
      },
    },
  ],
}

const laneEntryRequired: readonly string[] = [
  'role_family',
  'subroles',
  'routing_classes',
  'authority_cap',
  'authority_prohibited',
  'frontier_only',
  'independence',
  'human_gates',
  'provider_rule',
  'quality_tolerance',
]

const laneEntryProperties: Readonly<Record<string, SchemaObject>> = {
  role_family: { enum: ['coordinator', 'verifier', 'builder', 'classifier'] },
  subroles: {
    type: 'array',
    items: { type: 'string', minLength: 1 },
    minItems: 1,
    uniqueItems: true,
  },
  routing_classes: {
    type: 'array',
    items: { type: 'string', minLength: 1 },
    minItems: 1,
    uniqueItems: true,
  },
  authority_cap: {
    type: 'array',
    items: { type: 'string', minLength: 1 },
    minItems: 1,
    uniqueItems: true,
  },
  authority_prohibited: {
    type: 'array',
    items: { type: 'string', minLength: 1 },
    minItems: 1,
    uniqueItems: true,
  },
  frontier_only: { type: 'boolean' },
  independence: { type: 'string', minLength: 1 },
  human_gates: {
    type: 'array',
    items: { type: 'string', minLength: 1 },
    minItems: 1,
    uniqueItems: true,
  },
  provider_rule: providerRuleSchema,
  quality_tolerance: residualSlotSchema,
  // L6-only fields (M2) — present in the shape, required only for L6 below.
  status: { const: 'disabled-refused' },
  re_enablement: { const: 'ratified-amendment-required' },
  re_enablement_candidates: {
    type: 'array',
    items: { type: 'string', minLength: 1 },
    minItems: 1,
    uniqueItems: true,
  },
}

function laneEntrySchemaRequiring(extra: readonly string[]): SchemaObject {
  return {
    type: 'object',
    additionalProperties: false,
    required: [...laneEntryRequired, ...extra],
    properties: { ...laneEntryProperties },
  }
}

/** One lane of the frozen role/lane/authority map (A5.4). */
export const laneEntrySchema: SchemaObject = laneEntrySchemaRequiring([])

const lane6EntrySchema: SchemaObject = laneEntrySchemaRequiring([
  'status',
  're_enablement',
  're_enablement_candidates',
])

export const laneMapSchema: SchemaObject = {
  type: 'object',
  additionalProperties: false,
  required: ['L1', 'L2', 'L3', 'L4', 'L5', 'L6'],
  properties: {
    L1: laneEntrySchema,
    L2: laneEntrySchema,
    L3: laneEntrySchema,
    L4: laneEntrySchema,
    L5: laneEntrySchema,
    L6: lane6EntrySchema,
  },
}

export const bindingIdentitySchema: SchemaObject = {
  oneOf: [
    {
      type: 'object',
      additionalProperties: false,
      required: ['state', 'source'],
      properties: {
        state: { const: 'resolved' },
        source: { type: 'string', minLength: 1 },
      },
    },
    {
      type: 'object',
      additionalProperties: false,
      required: ['state', 'attestation', 'hold'],
      properties: {
        state: { const: 'owner-attested' },
        attestation: { type: 'string', minLength: 1 },
        hold: { type: 'string', minLength: 1 },
      },
    },
    {
      type: 'object',
      additionalProperties: false,
      required: ['state', 'refusal', 'diagnostics', 'hold'],
      properties: {
        state: { const: 'zero-match' },
        refusal: { type: 'string', minLength: 1 },
        diagnostics: {
          type: 'array',
          items: { type: 'string', minLength: 1 },
          minItems: 1,
          uniqueItems: true,
        },
        hold: { type: 'string', minLength: 1 },
      },
    },
  ],
}

export const bindingEndpointSchema: SchemaObject = {
  type: 'object',
  additionalProperties: false,
  required: ['registered', 'catalogue', 'alignment'],
  properties: {
    registered: { type: 'string', minLength: 1 },
    catalogue: { type: ['string', 'null'] },
    alignment: { enum: ['aligned', 'divergent', 'unknown'] },
  },
}

/**
 * A cost quote. `unit` must be `usd_per_mtok` and prices positive — that is a
 * semantic rule (R5 usability) enforced by the validator, deliberately not a
 * schema `const`/`exclusiveMinimum`, so a schema-valid-but-unusable quote is
 * distinguishable from a structurally invalid one.
 */
export const costQuoteSchema: SchemaObject = {
  type: 'object',
  additionalProperties: false,
  required: ['unit', 'input', 'output'],
  properties: {
    unit: { type: 'string', minLength: 1 },
    input: { type: 'number' },
    output: { type: 'number' },
  },
}

export const modelBindingSchema: SchemaObject = {
  type: 'object',
  additionalProperties: false,
  required: [
    'id',
    'provider',
    'model',
    'family',
    'identity',
    'endpoint',
    'data_classes',
    'capabilities',
    'context_window_tokens',
    'max_output_tokens',
    'cost',
    'availability',
    'quality',
  ],
  properties: {
    id: { type: 'string', minLength: 1 },
    // Mirrors PROVIDER_NAMES in types.ts (parity.test.ts pins the agreement).
    provider: { enum: ['opencode', 'opencode-go', 'openrouter', 'anthropic', 'fireworks'] },
    model: { type: 'string', minLength: 1 },
    family: { type: 'string', minLength: 1 },
    identity: bindingIdentitySchema,
    endpoint: bindingEndpointSchema,
    data_classes: evidence({
      type: 'array',
      items: { enum: ['public', 'internal', 'restricted'] },
      minItems: 1,
      uniqueItems: true,
    }),
    capabilities: {
      type: 'object',
      additionalProperties: false,
      required: ['tool-use', 'structured-output'],
      properties: {
        'tool-use': { enum: ['verified', 'unverified', 'unknown'] },
        'structured-output': { enum: ['verified', 'unverified', 'unknown'] },
      },
    },
    context_window_tokens: evidence({ type: 'number' }),
    max_output_tokens: evidence({ type: 'number' }),
    cost: evidence(costQuoteSchema),
    availability: evidence({ type: 'string', minLength: 1 }),
    quality: evidence({ type: 'string', minLength: 1 }),
    // RCM schema v0.4 (D8) — OPTIONAL per-entry capability predicates
    // (§4.6 additive pattern). Absent = unknown at resolve time; a model-side
    // fact is never guessed. Value enums are the closed vocabularies.
    inputs: evidence({
      type: 'array',
      items: { enum: ['text', 'image'] },
      minItems: 1,
      uniqueItems: true,
    }),
    thinking_levels: evidence({
      type: 'array',
      items: {
        enum: ['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'],
      },
      minItems: 1,
      uniqueItems: true,
    }),
    // Amendment A2 (MRC-13, A2.1) — OPTIONAL selection-identity marker:
    // `selection_only: true` marks a binding that exists for ordered selection
    // only and is never a host enablement target. Absent = false =
    // enablement-eligible (backwards compatible).
    selection_only: { type: 'boolean' },
  },
}

export const logicalCandidateSchema: SchemaObject = {
  type: 'object',
  additionalProperties: false,
  required: ['family', 'bindings'],
  properties: {
    family: { type: 'string', minLength: 1 },
    bindings: { type: 'array', items: modelBindingSchema, minItems: 1 },
  },
}

export const routeRefSchema: SchemaObject = {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'ref'],
  properties: {
    type: { enum: ['binding', 'candidate'] },
    ref: { type: 'string', minLength: 1 },
  },
}

export const laneRouteSchema: SchemaObject = {
  type: 'object',
  additionalProperties: false,
  required: ['lane', 'provider', 'primary', 'fallback', 'comparability'],
  properties: {
    lane: { enum: ['L1', 'L2', 'L3', 'L4', 'L5', 'L6'] },
    // Mirrors PROVIDER_NAMES in types.ts (parity.test.ts pins the agreement).
    provider: { enum: ['opencode', 'opencode-go', 'openrouter', 'anthropic', 'fireworks'] },
    primary: routeRefSchema,
    fallback: routeRefSchema,
    comparability: evidence({ type: 'string', minLength: 1 }),
  },
}

export const compatibilitySchema: SchemaObject = {
  type: 'object',
  additionalProperties: false,
  required: ['representation', 'version', 'legacy_representation'],
  properties: {
    representation: { const: 'provider-neutral-fallback-contract' },
    version: { const: 1 },
    legacy_representation: {
      type: 'object',
      additionalProperties: false,
      required: ['blocks', 'id_vocabulary', 'status', 'removal_serialized_into'],
      properties: {
        blocks: {
          type: 'array',
          items: { type: 'string', minLength: 1 },
          minItems: 1,
          uniqueItems: true,
        },
        id_vocabulary: { const: 'openrouter-slug-only' },
        status: { const: 'deprecated' },
        removal_serialized_into: { const: 'PMC-P4' },
      },
    },
  },
}

export const rankingContractSchema: SchemaObject = {
  type: 'object',
  additionalProperties: false,
  required: [
    'inputs',
    'eligibility_filters',
    'budget_ordering_lane',
    'quality_ordering_key',
    'stable_order',
    'evidence_threshold',
    'attested_states',
  ],
  properties: {
    inputs: {
      type: 'object',
      additionalProperties: false,
      required: ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7'],
      properties: {
        R1: { type: 'string', minLength: 1 },
        R2: { type: 'string', minLength: 1 },
        R3: { type: 'string', minLength: 1 },
        R4: { type: 'string', minLength: 1 },
        R5: { type: 'string', minLength: 1 },
        R6: { type: 'string', minLength: 1 },
        R7: { type: 'string', minLength: 1 },
      },
    },
    eligibility_filters: {
      type: 'array',
      items: { enum: ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7'] },
      minItems: 1,
      uniqueItems: true,
    },
    budget_ordering_lane: { enum: ['L1', 'L2', 'L3', 'L4', 'L5', 'L6'] },
    quality_ordering_key: { enum: ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7'] },
    stable_order: {
      type: 'array',
      items: { type: 'string', minLength: 1 },
      minItems: 1,
      uniqueItems: true,
    },
    evidence_threshold: {
      type: 'object',
      additionalProperties: false,
      required: ['rankable_requires', 'on_unknown'],
      properties: {
        rankable_requires: { type: 'string', minLength: 1 },
        on_unknown: { const: 'refuse' },
      },
    },
    attested_states: {
      type: 'array',
      items: { enum: ['static-conformance', 'live-availability', 'model-quality'] },
      minItems: 1,
      uniqueItems: true,
    },
  },
}

/**
 * RCM schema v0.4 (D3/OQ2/RCM-P9): one expertise binding — a narrowing set
 * within one routing class. `shadow: true` entries are evidence-only and never
 * narrow at dispatch. Cross-field rules (ref resolution, duplicate keys) are
 * `validator.ts` work.
 */
export const expertiseBindingSchema: SchemaObject = {
  type: 'object',
  additionalProperties: false,
  required: ['routing_class', 'expertise', 'shadow', 'bindings', 'evidence'],
  properties: {
    routing_class: {
      type: 'string',
      enum: ['boilerplate', 'standard-feature', 'architecture/risk', 'implementation/standard'],
    },
    expertise: {
      type: 'string',
      enum: [
        'engineering',
        'architecture',
        'security',
        'legal',
        'finance',
        'writing',
        'research',
        'data',
      ],
    },
    shadow: { type: 'boolean' },
    bindings: {
      type: 'array',
      items: routeRefSchema,
      minItems: 1,
    },
    evidence: {
      type: 'object',
      additionalProperties: false,
      required: ['source', 'date', 'admissibility'],
      properties: {
        source: { type: 'string', minLength: 1 },
        date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
        admissibility: { type: 'string', minLength: 1 },
      },
    },
  },
}

/**
 * The ordered selection source (C5.2): tier-group names to ordered
 * provider-neutral candidate keys (referential integrity to `candidates` is a
 * validator invariant — dangling/self-referential entries are refused).
 * `'frontier'` is the one literal group name the invariants depend on.
 */
const selectionOrderSchema: SchemaObject = {
  type: 'object',
  required: ['frontier'],
  additionalProperties: {
    type: 'array',
    items: { type: 'string', minLength: 1 },
    minItems: 1,
  },
  properties: {
    frontier: {
      type: 'array',
      items: { type: 'string', minLength: 1 },
      minItems: 1,
    },
  },
}

export const routingPolicySchema: SchemaObject = {
  type: 'object',
  additionalProperties: false,
  required: [
    'classes',
    'data_classification',
    'selection_order',
    'shadow_routes',
    // The five PMC-P1 blocks are REQUIRED since CUTOVER-P4 ended the
    // deprecation window (C4.4 — the optionality accommodation is retired).
    'compatibility',
    'ranking_contract',
    'lane_map',
    'candidates',
    'lane_routes',
  ],
  properties: {
    classes: {
      type: 'object',
      required: ['boilerplate', 'standard-feature', 'architecture/risk', 'implementation/standard'],
      additionalProperties: classEntrySchema,
    },
    data_classification: {
      type: 'object',
      additionalProperties: false,
      required: ['public', 'internal', 'restricted'],
      properties: {
        public: dataClassificationRuleSchema,
        internal: dataClassificationRuleSchema,
        restricted: dataClassificationRuleSchema,
      },
    },
    selection_order: selectionOrderSchema,
    shadow_routes: {
      type: 'object',
      additionalProperties: shadowRouteSchema,
    },
    compatibility: compatibilitySchema,
    ranking_contract: rankingContractSchema,
    lane_map: laneMapSchema,
    candidates: {
      type: 'object',
      additionalProperties: logicalCandidateSchema,
    },
    lane_routes: {
      type: 'array',
      items: laneRouteSchema,
    },
    // RCM schema v0.4: optional expertise-binding block (RCM-P3). Separate
    // from the A5.5 representation blocks — empty or absent is valid (RCM-P9
    // ships no binding content in this goal).
    expertise_bindings: {
      type: 'array',
      items: expertiseBindingSchema,
    },
  },
}
