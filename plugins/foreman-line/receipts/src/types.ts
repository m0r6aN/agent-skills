/**
 * `ReceiptDocument`: the frozen shape `ReceiptRef` (contracts/src/envelope.ts:17,
 * "Shape is owned by W0-P4") points to. One `kind` serves both per-stage (D8)
 * and per-claim (plan §2 Stage D.1) receipts; the granularity is a runtime
 * creation-time decision, not a contract split.
 *
 * `JsonValue` is structurally identical to
 * `skills/parcel-compiler/tool/src/receipts/canonical.ts`'s `JsonValue` by
 * design (a language-standard shape), but is NOT imported from there — that
 * package is cited by reference only (canonicalization-authority boundary).
 */
import type { CorrelationContext, StageId } from '../../contracts/src/index.js'

export type ReceiptKind = 'stage' | 'claim'

export interface Signature {
  readonly alg: string
  readonly keyId: string
  readonly value: string
}

export type JsonPrimitive = string | number | boolean | null
export interface JsonObject {
  readonly [key: string]: JsonValue
}
export type JsonArray = readonly JsonValue[]
export type JsonValue = JsonPrimitive | JsonObject | JsonArray

export interface ReceiptDocument {
  readonly schemaVersion: string
  readonly kind: ReceiptKind
  readonly stage: StageId
  /** non-null iff `kind === 'claim'` (AC4a). */
  readonly claimRef: string | null
  readonly correlation: CorrelationContext
  /** 0-based, contiguous per `workflowId` chain; 0 = genesis. */
  readonly sequence: number
  /** null iff `sequence === 0` (AC4b). */
  readonly prevHash: string | null
  readonly timestamp: string
  readonly subjectKind: string
  readonly subject: JsonValue
  /** reserved; MUST be null in this wave — no signing infrastructure exists yet. */
  readonly signature: Signature | null
  /** `sha256Hex(canonicalize(this document with the \`hash\` key excluded))`. */
  readonly hash: string
}

// ─── HRO-P3 / RCM-P8A (MRC-02) — reason/outcome vocabulary (C3.2) ────────────
//
// Versioned vocabulary reconciling D10's proposed semantic labels with HRO-P1's
// typed rejection names (`docs/goals/hybrid-routing-optimization/charter.md:107`;
// `docs/goals/hybrid-routing-optimization/hro-p1-mapping-contract-2026-09-27.md:84`).
// This version string is one of C1's bound replay inputs. Labels for the
// recommendation/fallback/settlement event classes are defined here so those
// parcels (MRC-08/MRC-19) extend this stream rather than fork it (ruling F);
// only decision/cache/attempt events are emitted in this parcel (C5).

export const REASON_VOCABULARY_VERSION = '1.0.0'

/** D5's event classes: "decision, cache hit/miss, recommendation call, fallback, dispatch attempt, and settlement". */
export type EventKind =
  | 'decision'
  | 'cache'
  | 'recommendation'
  | 'fallback'
  | 'attempt'
  | 'settlement'

export type ReasonOutcome = 'success' | 'failure' | 'refusal' | 'notice'

export type ReasonCode =
  // decision
  | 'ROUTE_SELECTED'
  | 'ROUTE_UNAVAILABLE'
  | 'MAPPING_INCOMPLETE_REFUSED'
  | 'PROTOCOL_INCOMPATIBLE_REFUSED'
  | 'CATALOG_REFRESH_FAILED'
  | 'CONFIG_UPDATE_PROPOSED'
  // cache
  | 'CACHE_HIT'
  | 'CACHE_MISS'
  // recommendation (labels only in this parcel)
  | 'RECOMMENDATION_SUCCEEDED'
  | 'RECOMMENDATION_FAILED'
  // fallback (labels only in this parcel)
  | 'APPROVED_FALLBACK_SELECTED'
  | 'FALLBACK_FAILED'
  // attempt
  | 'ATTEMPT_SUCCEEDED'
  | 'ATTEMPT_FAILED'
  // settlement (labels only in this parcel)
  | 'SETTLEMENT_RECORDED'
  | 'SETTLEMENT_UNAVAILABLE'

export interface ReasonVocabularyEntry {
  readonly kind: EventKind
  readonly outcome: ReasonOutcome
}

export const REASON_VOCABULARY: Readonly<Record<ReasonCode, ReasonVocabularyEntry>> = {
  ROUTE_SELECTED: { kind: 'decision', outcome: 'success' },
  ROUTE_UNAVAILABLE: { kind: 'decision', outcome: 'failure' },
  MAPPING_INCOMPLETE_REFUSED: { kind: 'decision', outcome: 'refusal' },
  PROTOCOL_INCOMPATIBLE_REFUSED: { kind: 'decision', outcome: 'refusal' },
  CATALOG_REFRESH_FAILED: { kind: 'decision', outcome: 'failure' },
  CONFIG_UPDATE_PROPOSED: { kind: 'decision', outcome: 'notice' },
  CACHE_HIT: { kind: 'cache', outcome: 'success' },
  CACHE_MISS: { kind: 'cache', outcome: 'notice' },
  RECOMMENDATION_SUCCEEDED: { kind: 'recommendation', outcome: 'success' },
  RECOMMENDATION_FAILED: { kind: 'recommendation', outcome: 'failure' },
  APPROVED_FALLBACK_SELECTED: { kind: 'fallback', outcome: 'success' },
  FALLBACK_FAILED: { kind: 'fallback', outcome: 'failure' },
  ATTEMPT_SUCCEEDED: { kind: 'attempt', outcome: 'success' },
  ATTEMPT_FAILED: { kind: 'attempt', outcome: 'failure' },
  SETTLEMENT_RECORDED: { kind: 'settlement', outcome: 'success' },
  SETTLEMENT_UNAVAILABLE: { kind: 'settlement', outcome: 'notice' },
}

/** D10's proposed labels mapped onto this vocabulary's typed names (C3.2). */
export const D10_REASON_RECONCILIATION: Readonly<Record<string, ReasonCode>> = {
  mapping_missing: 'MAPPING_INCOMPLETE_REFUSED',
  catalog_refresh_failed: 'CATALOG_REFRESH_FAILED',
  approved_fallback_selected: 'APPROVED_FALLBACK_SELECTED',
  config_update_proposed: 'CONFIG_UPDATE_PROPOSED',
  route_unavailable: 'ROUTE_UNAVAILABLE',
}

// ─── HRO-P3 provenance (C3.3, charter D5:70) ─────────────────────────────────
//
// Truthful capture only: cost is tagged `billed | estimated | unknown`; absent
// data is `unknown`/null, never imputed; an estimate is never labeled a bill.

export type CostTag = 'billed' | 'estimated' | 'unknown'

export interface CostProvenance {
  readonly tag: CostTag
  /** null when unknown or not captured; never imputed. */
  readonly amount: number | null
  readonly currency: string | null
  /** Price source (e.g. price table id); null when unknown. */
  readonly price_source: string | null
  readonly price_version: string | null
}

export interface EventProvenance {
  /** Actual provider observed; null = not observed (never imputed). */
  readonly provider: string | null
  /** Actual model id observed; null = not observed. */
  readonly model: string | null
  readonly input_tokens: number | null
  readonly output_tokens: number | null
  /** Provider-cache usage where available; null = not available. */
  readonly provider_cached_tokens: number | null
  readonly latency_ms: number | null
  /**
   * Failure detail; non-null iff the reason outcome is `failure`/`refusal`
   * (a failed call is never recorded as success).
   */
  readonly failure: string | null
  /** Retries represented by this record (0 = first try). */
  readonly retries: number
  readonly cost: CostProvenance
  /**
   * 1-based count of same-kind events on this chain including this one;
   * repeats are recorded, never deduplicated (charter D5:68,:120).
   */
  readonly occurrence: number
}

// ─── RCM-P8A replay bindings (C1) ────────────────────────────────────────────
//
// The seven bound inputs of RCM exit criterion 8
// (`docs/goals/routing-currency-and-merit/charter.md:266-268`): effective
// requirements, policy digest (version + content digest), catalog-snapshot
// digest, vocabulary version, derived context floor, predicate set, selected
// identity. Replay either reproduces the recorded decision or refuses on any
// bound-input mismatch.

export interface EffectiveRequirements {
  readonly routing_class: string
  readonly data_classification: string
  readonly transport_requirements: {
    readonly data_collection: 'allow' | 'deny'
    readonly zdr: boolean
  }
  /**
   * RCM-P4A (C4.1, additive): the effective input modalities in canonical
   * `INPUT_MODALITIES` order (`text` before `image`) — always bound by the
   * dispatch caller (D8 makes declared and omitted equivalent). Optional in
   * shape for pre-carry receipts: structural comparison refuses across the
   * shape change (exit criterion 8 / C4.5), never silently ignores it.
   */
  readonly required_inputs?: readonly string[]
  /**
   * RCM-P4A (C4.1, additive): the resolved thinking level — always bound and
   * surfaced (C5). Optional in shape for pre-carry receipts (see above).
   */
  readonly required_thinking_level?: string
  /**
   * RCM-P4A (C4.1, additive): the declared `expertise:` narrowing key —
   * populated when declared (absent = no narrowing). Optional in shape for
   * pre-carry receipts (see above).
   */
  readonly expertise?: string
}

export interface PolicyDigest {
  /** The pinned policy document identity (the policy ref). */
  readonly version: string
  /** SHA-256 hex of the exact policy document bytes. */
  readonly content_digest: string
}

/**
 * D2's distinct-values rule (`hro-p1-mapping-contract-2026-09-27.md:28`): each
 * identity value is bound where available and null otherwise — a value is never
 * derived from the registry key or host id. All-null = no model was selected
 * (e.g. a `ROUTE_UNAVAILABLE` decision).
 */
export interface SelectedIdentity {
  readonly registry_key: string | null
  readonly provider_local_id: string | null
  readonly protocol: string | null
  readonly pi_host_model_id: string | null
}

export interface DerivedContextFloor {
  /** Minimum context-window tokens required (R4); null = not derived — unknown, never imputed. */
  readonly required_context_tokens: number | null
  /** Minimum max-output tokens required (R4); null = not derived — unknown, never imputed. */
  readonly required_output_tokens: number | null
}

/** Eligibility predicates a decision applied (RCM D2/D4 evaluation order). */
export const DECISION_PREDICATE_IDS = [
  'class_allowlist',
  'data_class_eligible_models',
  'capability_predicate',
  'independence_exclusion',
  'context_floor',
  'cost_budget',
  'availability_attestation',
  'quality_attestation',
] as const

export type DecisionPredicateId = (typeof DECISION_PREDICATE_IDS)[number]

export interface ReplayBindings {
  readonly effective_requirements: EffectiveRequirements
  readonly policy_digest: PolicyDigest
  readonly catalog_snapshot_digest: string
  /** The reason/outcome vocabulary version this decision recorded under. */
  readonly vocabulary_version: string
  readonly derived_context_floor: DerivedContextFloor
  readonly predicate_set: readonly DecisionPredicateId[]
  readonly selected_identity: SelectedIdentity
}

// ─── Event subject payloads (C1/C3) ──────────────────────────────────────────
//
// Subject payloads ride the frozen `ReceiptDocument` envelope (`subject:
// JsonValue` above) under these `subjectKind`s. Events are entries on the
// existing receipt chain — same envelope, same chain keying, same correlation
// identity (C3.1); there is no parallel event format.

export const ROUTING_EVENT_SUBJECT_KINDS = [
  'RoutingDecisionEvent',
  'RoutingCacheEvent',
  'RoutingAttemptEvent',
] as const

export type RoutingEventSubjectKind = (typeof ROUTING_EVENT_SUBJECT_KINDS)[number]

/** The decision/replay receipt subject: binds exactly C1's seven inputs. */
export interface RoutingDecisionSubject {
  readonly event_kind: 'decision'
  readonly reason: ReasonCode
  readonly bindings: ReplayBindings
  readonly provenance: EventProvenance
}

/** The cache key a cache event records (the key already carries the policy digest). */
export interface CacheKeyRecord {
  readonly schema_version: number
  readonly policy_digest: string
  readonly routing_class: string
  readonly data_classification: string
  /**
   * RCM-P4A (C3.5/C4, additive): the effective requirements in canonical
   * form — matching the routing-cache key parts. Optional in shape for
   * pre-carry records (see `EffectiveRequirements`).
   */
  readonly required_inputs?: readonly string[]
  readonly required_thinking_level?: string
  readonly required_context_tokens?: number
  readonly expertise?: string
}

export interface RoutingCacheSubject {
  readonly event_kind: 'cache'
  readonly reason: ReasonCode
  readonly vocabulary_version: string
  readonly cache_key: CacheKeyRecord
  readonly provenance: EventProvenance
}

export interface RoutingAttemptSubject {
  readonly event_kind: 'attempt'
  readonly reason: ReasonCode
  readonly vocabulary_version: string
  readonly provenance: EventProvenance
}

export type RoutingEventSubject =
  | RoutingDecisionSubject
  | RoutingCacheSubject
  | RoutingAttemptSubject
