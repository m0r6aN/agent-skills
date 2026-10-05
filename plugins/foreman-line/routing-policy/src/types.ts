/**
 * Routing policy shapes (W0-P3): TypeScript types for `routing-policy.yaml`.
 * Each type has a matching hand-authored JSON Schema in `schemas.ts` — the two
 * representations are proven to agree by `tests/parity.test.ts`, never by
 * generating one from the other (ajv's `JSONSchemaType` is banned as a schema
 * authority in this repo).
 */

export type ClassName =
  | 'boilerplate'
  | 'standard-feature'
  | 'architecture/risk'
  | 'implementation/standard'

export const CLASS_NAMES: readonly ClassName[] = [
  'boilerplate',
  'standard-feature',
  'architecture/risk',
  'implementation/standard',
]

export type DataClassificationTier = 'public' | 'internal' | 'restricted'

// ---------------------------------------------------------------------------
// RCM-P2/P3 (schema v0.4, SPEC-CONVENTION §4.9): capability-predicate and
// expertise vocabularies. Closed sets, never free text (RCM D7/D8).
// ---------------------------------------------------------------------------

/**
 * RCM D8: the only input modalities the provider catalogs carry (evidence:
 * `host-owner-export/catalog-projection.json` — `["text"]` and
 * `["image","text"]` across all 608 records). This module is the routing
 * vocabulary home; `spec-linter` restates it for frontmatter linting and
 * `tests/expertise-vocabulary.test.ts` proves the restatements agree.
 */
export const INPUT_MODALITIES = ['text', 'image'] as const
export type InputModality = (typeof INPUT_MODALITIES)[number]

/**
 * RCM D8: `thinking_level:` values — the Pi `ThinkingLevel` names as carried
 * by the catalog's `thinkingLevelMap` keys (evidence: the pinned catalog
 * projection; `defaultThinkingLevel: "minimal"` corroborates `minimal`).
 * "A model lacking the requested thinking level refuses rather than silently
 * downgrading" (D8) — support is a declared per-binding fact.
 */
export const THINKING_LEVELS = ['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'] as const
export type ThinkingLevelName = (typeof THINKING_LEVELS)[number]

/**
 * RCM D7: the closed `expertise` vocabulary, restated from its owner
 * `foreman-config/src/expertise.ts` (lockstep-tested). Never free text (D7;
 * free-text expertise is a charter stop condition).
 */
export const EXPERTISE_AREAS = [
  'engineering',
  'architecture',
  'security',
  'legal',
  'finance',
  'writing',
  'research',
  'data',
] as const
export type ExpertiseArea = (typeof EXPERTISE_AREAS)[number]

/**
 * RCM OQ5 (ratified): the routing-class thinking default — the effective
 * `thinking_level` requirement of a spec that omits the field (D8).
 */
export const THINKING_DEFAULT_BY_CLASS: Readonly<Record<ClassName, ThinkingLevelName>> = {
  boilerplate: 'minimal',
  'standard-feature': 'low',
  'implementation/standard': 'low',
  'architecture/risk': 'high',
}

export const DATA_CLASSIFICATION_TIERS: readonly DataClassificationTier[] = [
  'public',
  'internal',
  'restricted',
]

/**
 * One entry in `classes`. `allowlist` holds tier-group names (resolved
 * elsewhere via `selection_order`), not concrete model ids. `security_flavored` is a self-declared
 * flag: when true, every tier in `allowlist` must equal `'frontier'` (the
 * security hard override), and any class whose key looks security/audit-flavored
 * by name must carry this flag (the derived guard) — both enforced as semantic
 * invariants, not by this schema.
 */
export interface ClassEntry {
  readonly allowlist: readonly string[]
  readonly ceiling_usd: number
  readonly security_flavored?: boolean
}

/**
 * The gateway transport obligations a classification tier declares. On a
 * multi-provider gateway (OpenRouter) the same id can be served by many upstream
 * hosts with different retention and training policies, and provider selection is
 * a request parameter this repository never sends. Declaring the requirement
 * here makes the consumer's obligation explicit and machine-readable; it does
 * not enforce it. Field names mirror OpenRouter's `provider` request object.
 */
export interface TransportRequirements {
  /** `deny` = only providers that do not store or train on inputs. */
  readonly data_collection: 'allow' | 'deny'
  /** `true` = only Zero-Data-Retention endpoints. */
  readonly zdr: boolean
}

/**
 * One entry in `data_classification`. Post-CUTOVER-P4 it carries the
 * transport obligations only: data-class eligibility now lives at the binding
 * level (`ModelBinding.data_classes`, A5.2), and a binding's declared set must
 * narrow monotonically from `public` -> `internal` -> `restricted` (D6:
 * classification gates eligibility before cost optimization) — a semantic
 * invariant, not expressible in this shape. `internal` and `restricted` must
 * require `data_collection: 'deny'` and `zdr: true` (invariant g), also
 * enforced by the validator.
 */
export interface DataClassificationRule {
  readonly transport_requirements: TransportRequirements
}


export type ShadowTaskType = 'spec_lint' | 'evidence_index' | 'review_triage'

/** Exactly the two roles a shadow route may never fill, in either YAML order. */
export type ProhibitedShadowRoles =
  | readonly ['coordinator', 'verifier']
  | readonly ['verifier', 'coordinator']

/**
 * A non-authoritative sidecar route. Shadow routes are deliberately separate
 * from `model_tiers`: they can propose a candidate, but can neither select an
 * owner nor satisfy a review, approval, or release gate.
 */
export interface ShadowRoute {
  readonly adapter_id: string
  readonly data_classification: 'public'
  readonly allowed_task_types: readonly ShadowTaskType[]
  readonly requires_live_discovery: true
  readonly candidate_only: true
  readonly authority: 'none'
  readonly tools_granted: readonly []
  readonly effect_capability: 'none'
  readonly prohibited_roles: ProhibitedShadowRoles
}

/**
 * The full routing policy document. `selection_order` is the ordered selection
 * source (C5.2, RCM D3): each tier-group name used in `classes[*].allowlist`
 * maps to an ordered list of provider-neutral candidate keys (referential
 * integrity to `candidates` — dangling and self-referential entries are
 * refused). `'frontier'` is the one group name the validator's invariants
 * depend on literally — every other group name is policy content, revisable
 * without touching the validator. Order IS the selection rule: the dispatcher
 * walks a class's allowlist groups in order and takes the first selectable
 * candidate; nothing is derived from price, context, or quality at dispatch
 * time.
 */
export interface RoutingPolicy {
  readonly classes: Readonly<Record<ClassName, ClassEntry>>
  readonly data_classification: Readonly<Record<DataClassificationTier, DataClassificationRule>>
  readonly selection_order: Readonly<Record<string, readonly string[]>>
  readonly shadow_routes: Readonly<Record<string, ShadowRoute>>
  // The five PMC-P1 representation blocks are required since CUTOVER-P4 ended
  // the deprecation window (C4.4); the validator enforces their invariants.
  readonly compatibility: Compatibility
  readonly ranking_contract: RankingContract
  readonly lane_map: Readonly<Record<LaneId, LaneEntry>>
  readonly candidates: Readonly<Record<string, LogicalCandidate>>
  readonly lane_routes: readonly LaneRoute[]
  /**
   * RCM schema v0.4: expertise bindings. Optional and separate from the five
   * A5.5 representation blocks (an empty or absent list is a valid document —
   * RCM-P9 ships no binding content yet).
   */
  readonly expertise_bindings?: readonly ExpertiseBinding[]
}

// ---------------------------------------------------------------------------
// PMC-P1 — provider-neutral fallback contract (charter A5.1–A5.5, A3).
// New representation, shipped alongside the legacy blocks above under
// compatibility versioning (A5.5). Typed sources here; the hand-authored
// schemas in `schemas.ts` are proven to agree via `tests/parity.test.ts`.
// ---------------------------------------------------------------------------

/** Envelope states that carry a named residual instead of a value. */
export type UnprovenState = 'unknown' | 'unverified' | 'unproven'

/** An evidence value asserted from a named source of truth (A6 honesty). */
export interface DeclaredEvidence<T> {
  readonly state: 'declared'
  readonly value: T
  readonly source: string
}

/** A typed-unavailable evidence value: named residual, never a guessed value. */
export interface UnprovenEvidence {
  readonly state: UnprovenState
  readonly residual: string
}

export type Evidence<T> = DeclaredEvidence<T> | UnprovenEvidence

/**
 * A frozen declaration slot whose value is an unfabricated residual
 * (`a54-ratification-2026-09-26.md` dispositions 2/3/5). An unset slot is a
 * stop receipt at resolve time, never a silent default.
 */
export interface ResidualSlot {
  readonly state: 'unavailable'
  readonly residual: string
}

export type CapabilityState = 'verified' | 'unverified' | 'unknown'

export interface BindingCapabilities {
  readonly 'tool-use': CapabilityState
  readonly 'structured-output': CapabilityState
}

export type ProviderName = 'opencode' | 'openrouter'

export const PROVIDER_NAMES: readonly ProviderName[] = ['opencode', 'openrouter']

export type LaneId = 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6'

export const LANE_IDS: readonly LaneId[] = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6']

export type RoleFamily = 'coordinator' | 'verifier' | 'builder' | 'classifier'

export type ProviderRule =
  /** A3 frontier/review lanes: a partition no fallback crosses (rubric §4.1). */
  | { readonly kind: 'pinned-provider'; readonly pinned_provider: ResidualSlot }
  /** A3 standard-implementation lanes (L4 direct; L3 by ratified extension). */
  | { readonly kind: 'declared-preference'; readonly preference: ResidualSlot }
  /** A3 economy lanes: cheapest eligible binding (rubric §4 step 1). */
  | { readonly kind: 'cheapest-eligible' }
  /** M2: L6 refuses before any filter or ranking (rubric §5). */
  | { readonly kind: 'none'; readonly refusal: 'LANE_DISABLED_REFUSED' }

/** One lane of the frozen role/lane/authority map (A5.4). */
export interface LaneEntry {
  readonly role_family: RoleFamily
  readonly subroles: readonly string[]
  readonly routing_classes: readonly string[]
  readonly authority_cap: readonly string[]
  readonly authority_prohibited: readonly string[]
  readonly frontier_only: boolean
  readonly independence: string
  readonly human_gates: readonly string[]
  readonly provider_rule: ProviderRule
  readonly quality_tolerance: ResidualSlot
  /** L6 only (M2): the lane is refused/disabled. */
  readonly status?: 'disabled-refused'
  readonly re_enablement?: 'ratified-amendment-required'
  readonly re_enablement_candidates?: readonly string[]
}

export interface CostQuote {
  /** USD per 1M tokens (rubric R5 unit). Usability is a semantic invariant. */
  readonly unit: string
  readonly input: number
  readonly output: number
}

/** Identity evidence for a binding (pmc-p0-capability-baseline.md AC2). */
export type BindingIdentity =
  | { readonly state: 'resolved'; readonly source: string }
  | {
      readonly state: 'owner-attested'
      readonly attestation: string
      readonly hold: string
    }
  | {
      readonly state: 'zero-match'
      readonly refusal: string
      readonly diagnostics: readonly string[]
      readonly hold: string
    }

export interface BindingEndpoint {
  readonly registered: string
  readonly catalogue: string | null
  readonly alignment: 'aligned' | 'divergent' | 'unknown'
}

/** A provider-specific binding with binding-level eligibility (A5.2). */
export interface ModelBinding {
  /** Provider-prefixed Pi model id (`opencode/...`, `openrouter/...`). */
  readonly id: string
  readonly provider: ProviderName
  readonly model: string
  /** Declared model family (R3 input); never inferred at resolve time. */
  readonly family: string
  readonly identity: BindingIdentity
  readonly endpoint: BindingEndpoint
  /** R1 data-class eligibility at the binding level. */
  readonly data_classes: Evidence<readonly DataClassificationTier[]>
  /** R2 required-capability states (rubric: unverified for all bindings). */
  readonly capabilities: BindingCapabilities
  /** R4 available context. */
  readonly context_window_tokens: Evidence<number>
  readonly max_output_tokens: Evidence<number>
  /** R5 budget input. */
  readonly cost: Evidence<CostQuote>
  /** R6 verified availability (A6 `live-availability`). */
  readonly availability: Evidence<string>
  /** R7 recorded quality (A6 `model-quality`, lane-scoped). */
  readonly quality: Evidence<string>
  /**
   * RCM D8 capability predicate (optional, schema v0.4): the input modalities
   * this binding serves. Absent = unknown, never "text-only" — a model-side
   * fact is never guessed (D2/a54); unknown refuses when the predicate is
   * evaluated (`INPUTS_UNKNOWN`).
   */
  readonly inputs?: Evidence<readonly InputModality[]>
  /**
   * RCM D8 capability predicate (optional): the thinking levels this binding's
   * `thinkingLevelMap` carries. Absent = unknown (`THINKING_LEVELS_UNKNOWN`);
   * a level outside the declared set refuses (`THINKING_LEVEL_UNSUPPORTED`),
   * never a silent downgrade.
   */
  readonly thinking_levels?: Evidence<readonly ThinkingLevelName[]>
  /**
   * Amendment A2 (MRC-13, A2.1): a selection identity with no host enablement
   * target — it participates in ordered selection (`selection_order`) but is
   * never an enablement add in a derived host-settings proposal. Absent =
   * false = enablement-eligible (backwards compatible; pre-marker documents
   * behave identically).
   */
  readonly selection_only?: boolean
}

/** A provider-neutral logical candidate with attached bindings (A5.1–A5.2). */
export interface LogicalCandidate {
  readonly family: string
  readonly bindings: readonly ModelBinding[]
}

export interface RouteRef {
  readonly type: 'binding' | 'candidate'
  readonly ref: string
}

/** One lane/provider route: exactly one typed fallback (D3, A5.3). */
export interface LaneRoute {
  readonly lane: LaneId
  readonly provider: ProviderName
  readonly primary: RouteRef
  readonly fallback: RouteRef
  /** Rubric §1 "comparable or higher" verdict; unproven while any input is. */
  readonly comparability: Evidence<string>
}

/**
 * RCM D3/OQ2/RCM-P9 (schema v0.4): one expertise binding — a NARROWING set
 * within the already-eligible tier for `(routing_class, expertise)`. It never
 * reorders a tier, never crosses tiers, never widens a classification; a
 * missing binding means no narrowing at all; an unsatisfiable binding refuses
 * rather than silently falling back.
 */
export interface ExpertiseBindingEvidence {
  /** Cited source (D12: no claim ships without one). */
  readonly source: string
  /** Dated `YYYY-MM-DD` (D12). */
  readonly date: string
  /** Sample/admissibility statement (RCM-P9). */
  readonly admissibility: string
}

export interface ExpertiseBinding {
  readonly routing_class: ClassName
  readonly expertise: ExpertiseArea
  /**
   * Shadow entries are evidence-only (RCM-P9): they never narrow at dispatch,
   * never route, and never become a default. Promotion to non-shadow is a
   * human Gate 3 act outside this goal.
   */
  readonly shadow: boolean
  /** The narrowing set. A `candidate` ref narrows to that candidate's bindings. */
  readonly bindings: readonly RouteRef[]
  readonly evidence: ExpertiseBindingEvidence
}

export interface LegacyRepresentation {
  readonly blocks: readonly string[]
  readonly id_vocabulary: 'openrouter-slug-only'
  readonly status: 'deprecated'
  readonly removal_serialized_into: 'PMC-P4'
}

/** A5.5 compatibility versioning: new + legacy representations coexist. */
export interface Compatibility {
  readonly representation: 'provider-neutral-fallback-contract'
  readonly version: 1
  readonly legacy_representation: LegacyRepresentation
}

export type RankingInputId = 'R1' | 'R2' | 'R3' | 'R4' | 'R5' | 'R6' | 'R7'

export const RANKING_INPUT_IDS: readonly RankingInputId[] = [
  'R1',
  'R2',
  'R3',
  'R4',
  'R5',
  'R6',
  'R7',
]

export type AttestedState = 'static-conformance' | 'live-availability' | 'model-quality'

export const ATTESTED_STATES: readonly AttestedState[] = [
  'static-conformance',
  'live-availability',
  'model-quality',
]

/** A3 eligibility/ranking fields and the rubric §3 evidence threshold. */
export interface RankingContract {
  readonly inputs: Readonly<Record<RankingInputId, string>>
  readonly eligibility_filters: readonly RankingInputId[]
  readonly budget_ordering_lane: LaneId
  readonly quality_ordering_key: RankingInputId
  readonly stable_order: readonly string[]
  readonly evidence_threshold: {
    readonly rankable_requires: string
    readonly on_unknown: 'refuse'
  }
  readonly attested_states: readonly AttestedState[]
}

/**
 * Refusal vocabulary for resolve-time use (suitability rubric §7, final
 * encoding owned by PMC-P1). Names are distinct; none folds into another.
 */
export const RESOLVER_REFUSALS: readonly string[] = [
  'AC2A_ZERO_MATCH',
  'AC2A_WRONG_PROVIDER',
  'AC2A_CASE_MISMATCH',
  'AC2A_PREFIX_ALIAS_REFUSED',
  'AC2A_MULTI_MATCH',
  'AC2A_URL_MISMATCH',
  'AC2A_VARIANT_SUFFIX_REFUSED',
  'DATA_CLASS_INELIGIBLE',
  'DATA_CLASS_UNKNOWN',
  'CAPABILITY_MISSING',
  'CAPABILITY_UNVERIFIED',
  'INDEPENDENCE_VIOLATION',
  'INDEPENDENCE_UNPROVEN',
  'CONTEXT_INSUFFICIENT',
  'CONTEXT_UNKNOWN',
  'BUDGET_EXCEEDED',
  'COST_UNKNOWN',
  'COST_UNIT_UNKNOWN',
  'AVAILABILITY_UNVERIFIED',
  'FRESHNESS_STALE_REFUSED',
  'FRESHNESS_FUTURE_REFUSED',
  'QUALITY_UNRECORDED',
  'FALLBACK_SUITABILITY_UNPROVEN',
  'DIGEST_MISMATCH_REFUSED',
  'LANE_DISABLED_REFUSED',
  'L6_FORBIDDEN_OUTPUT_REFUSED',
  'L6_EMPTY_ELIGIBLE_REFUSED',
  'PINNED_PROVIDER_NO_ELIGIBLE',
  // RCM schema v0.4 (D7/D8): capability-predicate and expertise refusals.
  // Each name identifies the failing predicate; none folds into another.
  'INPUTS_UNKNOWN',
  'INPUTS_INSUFFICIENT',
  'THINKING_LEVELS_UNKNOWN',
  'THINKING_LEVEL_UNSUPPORTED',
  'EXPERTISE_NARROWED_OUT',
  'EXPERTISE_BINDING_UNSATISFIABLE',
  'EXPERTISE_BINDING_DANGLING_REFERENCE',
]

/** Holds, not refusals (rubric §7). */
export const RESOLVER_HOLDS: readonly string[] = ['OWNER_ATTESTED_PENDING_LIVE_AVAILABILITY']

/**
 * Named unfabricated residuals (a54-ratification-2026-09-26.md dispositions
 * 2/3/5): L1/L2 pinned-provider values, L3/L4 provider-preference values, and
 * the per-lane quality tolerance delta_L. Declared values are assignable only
 * from real availability/model-quality evidence (A6).
 */
export const CONTRACT_RESIDUALS: readonly string[] = [
  'L1_PINNED_PROVIDER_UNSET',
  'L2_PINNED_PROVIDER_UNSET',
  'L3_PROVIDER_PREFERENCE_UNSET',
  'L4_PROVIDER_PREFERENCE_UNSET',
  'DELTA_L_UNSET',
]

/**
 * Static contract refusals enforced by `validator.ts` on the policy document.
 * Every name here has a negative-control test.
 */
export const CONTRACT_REFUSALS: readonly string[] = [
  'FALLBACK_SELF_REFERENCE',
  'FALLBACK_DANGLING_REFERENCE',
  'FALLBACK_PROVIDER_MISMATCH',
  'FALLBACK_DATA_POLICY_VIOLATION',
  'FALLBACK_TOOL_REQUIREMENT_VIOLATION',
  'FALLBACK_BUDGET_POLICY_VIOLATION',
  'CONTROL_PLANE_ROUTE_REFUSED',
  'UNSUPPORTED_MODEL_REFUSED',
  'ENDPOINT_DIVERGENCE_REFUSED',
  'EVIDENCE_STATE_UNATTESTED',
  'RESIDUAL_FABRICATED_REFUSED',
  // CUTOVER-P4 (C6): a document carrying any removed legacy block
  // (`model_tiers`, `roles`, `data_classification.<tier>.eligible_models`) is
  // refused with this name naming the block — the block is never silently
  // ignored.
  'LEGACY_REPRESENTATION_REFUSED',
  'REPRESENTATION_INCOMPLETE_REFUSED',
  'ROLE_LANE_MAP_VIOLATION',
  'RANKING_CONTRACT_VIOLATION',
  'BINDING_ID_DUPLICATE_REFUSED',
]

/**
 * HRO-P1 (HRO charter D2, `docs/goals/hybrid-routing-optimization/charter.md`):
 * the typed unavailable/unsupported outcomes of resolving a registry key
 * through the `pi-openrouter` extended mapping contract (`pi-openrouter.ts`
 * `resolvePiOpenRouterRoute`). Same closed-vocabulary mechanism as the lists
 * above (RCM-P2/P3 reconciliation: adapter names live in this vocabulary home,
 * never in a second mechanism) and the same distinctness rule: each name
 * identifies its own failure, none folds into another.
 */
export const ADAPTER_REFUSALS = [
  /** Unknown registry key: no declared mapping exists; identity is never guessed. */
  'MAPPING_MISSING_REFUSED',
  /** A mapping exists but lacks the explicit values the extended contract requires. */
  'MAPPING_INCOMPLETE_REFUSED',
  /** Declared API protocol cannot serve the requested execution protocol. */
  'PROTOCOL_INCOMPATIBLE_REFUSED',
] as const

export type AdapterRefusalName = (typeof ADAPTER_REFUSALS)[number]

/**
 * HRO-P4a (MRC-08, charter D8): the bounded recovery ladder's own refusal
 * names, beside `ADAPTER_REFUSALS` under the same closed-list mechanism and
 * distinctness rule: each name identifies its own failure, none folds into
 * another. The ladder reuses existing names wherever the failure is the same
 * failure (`FRESHNESS_STALE_REFUSED`, `MAPPING_MISSING_REFUSED`,
 * `MAPPING_INCOMPLETE_REFUSED`, `UNSUPPORTED_MODEL_REFUSED`,
 * `FALLBACK_SELF_REFERENCE`, `AC2A_MULTI_MATCH`) and emits a name from this
 * list only for recovery-specific failures. Every name here is enumerated by
 * exactly one named negative control (the RB-5 pattern).
 */
export const RECOVERY_REFUSALS = [
  /** Recovery bounds are missing/non-finite/non-positive: steps 2–3 never run (C1.3). */
  'RECOVERY_BOUNDS_UNCONFIGURED',
  /** The declared-lane fallback walk exhausted `max_fallback_attempts` (C4.2). */
  'RECOVERY_ATTEMPT_CAP_EXHAUSTED',
  /** The episode deadline expired: the refresh result is discarded, the walk ends (C3.1/C4.2). */
  'RECOVERY_DEADLINE_EXCEEDED',
  /** A refreshed document attests the exact approved mapping unavailable (C3.4). */
  'RECOVERY_AVAILABILITY_REFUSED',
  /** A cross-provider target lacks one of its three explicit declarations (C4.4). */
  'RECOVERY_CROSS_PROVIDER_EXCLUDED',
  /** A prior attempt carries an uncertain charge: reconcile before redispatch (C6.4). */
  'RECONCILIATION_REQUIRED',
  /** The target's provider sits inside a bounded health cooldown (C6.5). */
  'PROVIDER_COOLDOWN_ACTIVE',
] as const

export type RecoveryRefusalName = (typeof RECOVERY_REFUSALS)[number]
