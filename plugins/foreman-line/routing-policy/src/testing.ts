/**
 * Canonical sample values, typed against `types.ts`, used by the parity test to
 * prove each schema actually accepts values of the shape its type describes.
 */

import { PI_OPENROUTER_ROUTING, type PiOpenRouterRouting } from './pi-openrouter.js'
import type {
  ClassEntry,
  DataClassificationRule,
  ExpertiseBinding,
  LaneEntry,
  LaneRoute,
  LogicalCandidate,
  ModelBinding,
  RoutingPolicy,
  ShadowRoute,
  TransportRequirements,
} from './types.js'

export const samplePiOpenRouterRouting: PiOpenRouterRouting = PI_OPENROUTER_ROUTING

export const sampleClassEntry: ClassEntry = {
  allowlist: ['economy'],
  ceiling_usd: 0.5,
}

/**
 * The strict values invariant (g) requires for internal and restricted.
 * Post-CUTOVER-P4 a classification rule carries transport obligations only;
 * data-class eligibility lives on bindings (`ModelBinding.data_classes`).
 */
export const sampleStrictTransport: TransportRequirements = {
  data_collection: 'deny',
  zdr: true,
}

export const samplePublicTransport: TransportRequirements = {
  data_collection: 'allow',
  zdr: false,
}

export const sampleDataClassificationRule: DataClassificationRule = {
  transport_requirements: sampleStrictTransport,
}

/**
 * A well-formed shadow route. The shipped policy declares none; this sample
 * proves the schema still accepts a populated `shadow_routes` map and the
 * validator still enforces containment on it. The id is deliberately
 * provider-neutral — no provider name is baked into schema or samples.
 */
export const sampleShadowRoute: ShadowRoute = {
  adapter_id: 'example-shadow',
  data_classification: 'public',
  allowed_task_types: ['spec_lint', 'evidence_index', 'review_triage'],
  requires_live_discovery: true,
  candidate_only: true,
  authority: 'none',
  tools_granted: [],
  effect_capability: 'none',
  prohibited_roles: ['coordinator', 'verifier'],
}

// ---------------------------------------------------------------------------
// PMC-P1 — canonical samples for the provider-neutral fallback contract.
// ---------------------------------------------------------------------------

const sampleResidualSlot = { state: 'unavailable', residual: 'DELTA_L_UNSET' } as const

const sampleLaneBase = {
  subroles: ['sample-subrole'],
  routing_classes: ['boilerplate'],
  authority_cap: ['execution-within-allowed-files'],
  authority_prohibited: ['approve', 'merge', 'release'],
  independence: 'sample-independence',
  human_gates: ['gate-2'],
  quality_tolerance: sampleResidualSlot,
} as const

export const sampleLaneEntry: LaneEntry = {
  ...sampleLaneBase,
  role_family: 'builder',
  frontier_only: false,
  provider_rule: {
    kind: 'declared-preference',
    preference: { state: 'unavailable', residual: 'L4_PROVIDER_PREFERENCE_UNSET' },
  },
}

export const sampleModelBinding: ModelBinding = {
  id: 'opencode/sample-model',
  provider: 'opencode',
  model: 'sample-model',
  family: 'sample-vendor',
  identity: { state: 'resolved', source: 'sample-source' },
  endpoint: {
    registered: 'https://example.invalid/v1',
    catalogue: 'https://example.invalid/v1',
    alignment: 'aligned',
  },
  data_classes: { state: 'declared', value: ['public'], source: 'sample-source' },
  capabilities: { 'tool-use': 'unverified', 'structured-output': 'unverified' },
  context_window_tokens: { state: 'declared', value: 1000, source: 'sample-source' },
  max_output_tokens: { state: 'declared', value: 100, source: 'sample-source' },
  cost: {
    state: 'declared',
    value: { unit: 'usd_per_mtok', input: 1, output: 2 },
    source: 'sample-source',
  },
  availability: { state: 'unproven', residual: 'AVAILABILITY_UNVERIFIED' },
  quality: { state: 'unproven', residual: 'QUALITY_UNRECORDED' },
  inputs: { state: 'declared', value: ['text'], source: 'sample-source' },
  thinking_levels: {
    state: 'declared',
    value: ['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'],
    source: 'sample-source',
  },
}

export const sampleLogicalCandidate: LogicalCandidate = {
  family: 'sample-vendor',
  bindings: [sampleModelBinding],
}

export const sampleLaneRoute: LaneRoute = {
  lane: 'L4',
  provider: 'opencode',
  primary: { type: 'binding', ref: 'opencode/sample-model' },
  fallback: { type: 'candidate', ref: 'sample-model' },
  comparability: { state: 'unproven', residual: 'FALLBACK_SUITABILITY_UNPROVEN' },
}

export const sampleExpertiseBinding: ExpertiseBinding = {
  routing_class: 'standard-feature',
  expertise: 'engineering',
  shadow: true,
  bindings: [{ type: 'binding', ref: 'opencode/sample-model' }],
  evidence: {
    source: 'sample-source',
    date: '2026-09-27',
    admissibility: 'sample admissibility statement',
  },
}

export const sampleRoutingPolicy: RoutingPolicy = {
  classes: {
    boilerplate: { allowlist: ['economy'], ceiling_usd: 0.5 },
    'standard-feature': { allowlist: ['standard'], ceiling_usd: 5.0 },
    'architecture/risk': { allowlist: ['frontier'], ceiling_usd: 25.0 },
    'implementation/standard': { allowlist: ['standard'], ceiling_usd: 5.0 },
  },
  data_classification: {
    public: { transport_requirements: samplePublicTransport },
    internal: { transport_requirements: sampleStrictTransport },
    restricted: { transport_requirements: sampleStrictTransport },
  },
  selection_order: {
    // Order is the dispatcher's selection rule (first eligible wins); entries
    // are provider-neutral candidate keys with referential integrity to
    // `candidates` (C5.2).
    frontier: ['sample-model'],
    standard: ['sample-model'],
    economy: ['sample-model'],
  },
  shadow_routes: {
    'example-shadow': sampleShadowRoute,
  },
  compatibility: {
    representation: 'provider-neutral-fallback-contract',
    version: 1,
    legacy_representation: {
      blocks: ['model_tiers', 'roles', 'data_classification.eligible_models'],
      id_vocabulary: 'openrouter-slug-only',
      status: 'deprecated',
      removal_serialized_into: 'PMC-P4',
    },
  },
  ranking_contract: {
    inputs: {
      R1: 'data-class eligibility',
      R2: 'required capability',
      R3: 'independence obligation',
      R4: 'available context',
      R5: 'remaining budget',
      R6: 'verified availability',
      R7: 'recorded quality score',
    },
    eligibility_filters: ['R1', 'R2', 'R3', 'R4', 'R6'],
    budget_ordering_lane: 'L5',
    quality_ordering_key: 'R7',
    stable_order: ['declared-matrix-role', 'provider', 'model-id'],
    evidence_threshold: {
      rankable_requires: 'R1-R6-definite-true-from-a-named-source-and-R7-recorded-for-this-lane',
      on_unknown: 'refuse',
    },
    attested_states: ['static-conformance', 'live-availability', 'model-quality'],
  },
  lane_map: {
    L1: {
      ...sampleLaneBase,
      role_family: 'coordinator',
      frontier_only: true,
      provider_rule: {
        kind: 'pinned-provider',
        pinned_provider: { state: 'unavailable', residual: 'L1_PINNED_PROVIDER_UNSET' },
      },
    },
    L2: {
      ...sampleLaneBase,
      role_family: 'verifier',
      frontier_only: true,
      provider_rule: {
        kind: 'pinned-provider',
        pinned_provider: { state: 'unavailable', residual: 'L2_PINNED_PROVIDER_UNSET' },
      },
    },
    L3: {
      ...sampleLaneBase,
      role_family: 'builder',
      frontier_only: false,
      provider_rule: {
        kind: 'declared-preference',
        preference: { state: 'unavailable', residual: 'L3_PROVIDER_PREFERENCE_UNSET' },
      },
    },
    L4: sampleLaneEntry,
    L5: {
      ...sampleLaneBase,
      role_family: 'builder',
      frontier_only: false,
      provider_rule: { kind: 'cheapest-eligible' },
    },
    L6: {
      ...sampleLaneBase,
      role_family: 'classifier',
      frontier_only: false,
      provider_rule: { kind: 'none', refusal: 'LANE_DISABLED_REFUSED' },
      status: 'disabled-refused',
      re_enablement: 'ratified-amendment-required',
      re_enablement_candidates: ['opencode/qwen3.8-flash', 'opencode/glm-5.3-flash'],
    },
  },
  candidates: {
    'sample-model': sampleLogicalCandidate,
  },
  lane_routes: [sampleLaneRoute],
  expertise_bindings: [sampleExpertiseBinding],
}
