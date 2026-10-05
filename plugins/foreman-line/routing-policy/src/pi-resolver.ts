/**
 * PMC-P2 — bounded Foreman-to-Pi route resolver (charter PMC-P2, A1–A4, D3/D4/D8).
 *
 * Consumes the PMC-P1 provider-neutral fallback contract (A5.1–A5.5) exactly as
 * ratified and emits, per request: the exact Pi lane configuration, the
 * OpenRouter provider constraints, the fallback handoff record, and a signed
 * no-secret route receipt (approved or failed/stop). Deterministic: no clock,
 * no I/O, no network — `issued_at` is injected.
 *
 * Evidence discipline (A6, rubric §3): a candidate is rankable only if R1–R6
 * evaluate to definite `true` from a named source and R7 is recorded for the
 * lane. Unknown is refused, never ranked last. On the shipped evidence no
 * binding is rankable (R2/R6/R7 unpopulated) — the correct static-conformance
 * outcome, not a defect.
 *
 * Every refusal/residual/hold name emitted here comes from the ratified
 * vocabulary (`types.ts`); any other name is itself refused
 * (`RESIDUAL_FABRICATED_REFUSED`), so a receipt can never carry a fabricated
 * name. This includes the composed `${lane}_*` declaration-slot names and the
 * lane-route `comparability` envelope (review A F2/F4), which pass the same
 * vocabulary gate as the binding envelopes.
 *
 * Never fabricates a value (review A F1 / review B RB-3): `RouteRef`s are
 * resolved exactly as `validator.ts` resolves them (a candidate ref resolves to
 * the route provider's first binding) before evaluation and emission, the
 * chosen route's declared fallback must resolve to an evaluated, rankable,
 * registry-backed binding (review B RB-1/A2: an independence-violating fallback
 * is denied, never downgraded), and no unresolved ref ever becomes a `model`
 * value.
 *
 * DERIVED rules (labelled where used):
 * - Selection pool is the lane's `primary`-role bindings (D3 pairing: every
 *   execution candidate carries its one declared fallback of comparable or
 *   higher suitability; a fallback-role binding is recorded, never selected as
 *   the session model). Rubric §4 step 3's `primary` before `fallback` key is
 *   preserved in the recorded order.
 * - R7 ordering: the ratified representation records R7 presence
 *   (`quality.value === 'model-quality'`, A6) but no numeric score, so score
 *   ordering degenerates to the documented stable order (rubric §4 steps 3–4);
 *   the score refinement stays an enumerated unproven claim.
 */

import {
  PI_OPENROUTER_ROUTING,
  type PiOpenRouterModel,
  type PiOpenRouterProvenance,
} from './pi-openrouter.js'
import {
  type ApprovedRoute,
  type AttemptRecord,
  type BudgetRecord,
  type CandidateEvaluation,
  documentDigest,
  type FallbackHandoffPlan,
  type FreshnessVerdict,
  type LaneConfig,
  type OpenRouterProviderConstraints,
  type PiModelContract,
  type RankingInputRecord,
  type RecoveryEpisodeRecord,
  type RefreshProvenance,
  type RefusalEntry,
  ROUTE_RESOLVER_ID,
  type RouteReceipt,
  type RouteUnavailableOutcome,
  type SelectionRecord,
  signReceipt,
  type ThinkingLevelRecord,
  type UnprovenClaim,
} from './route-receipt.js'
import type {
  ClassName,
  DataClassificationTier,
  DeclaredEvidence,
  Evidence,
  ExpertiseArea,
  InputModality,
  LaneEntry,
  LaneId,
  LaneRoute,
  LogicalCandidate,
  ModelBinding,
  ProviderName,
  ProviderRule,
  RouteRef,
  RoutingPolicy,
  ThinkingLevelName,
  TransportRequirements,
} from './types.js'
import {
  CONTRACT_REFUSALS,
  CONTRACT_RESIDUALS,
  EXPERTISE_AREAS,
  INPUT_MODALITIES,
  LANE_IDS,
  RESOLVER_HOLDS,
  RESOLVER_REFUSALS,
  THINKING_DEFAULT_BY_CLASS,
  THINKING_LEVELS,
} from './types.js'

/** D1 dispatch envelope: what a parcel requests before inference begins. */
export interface RouteRequest {
  readonly lane: LaneId
  readonly routing_class: string
  readonly data_class: DataClassificationTier
  readonly require_tool_use: boolean
  readonly require_structured_output: boolean
  /** R3 input: families the candidate must not share (A2 independence). */
  readonly independence_excluded_families: readonly string[]
  readonly required_context_tokens: number
  readonly required_output_tokens: number
  readonly remaining_budget_usd: number
  readonly projected_input_tokens: number
  readonly projected_output_tokens: number
  /**
   * RCM D8 (schema v0.4): the effective input-modality requirement. Absent =
   * `['text']` (legacy omission means text-only). An image-bearing surface
   * without an explicit `image` never selects a vision-incapable model — and
   * refuses rather than silently downgrading (F1/F2 negative controls).
   */
  readonly required_inputs?: readonly InputModality[]
  /**
   * RCM D8/OQ5: the effective thinking-level requirement. Absent = the
   * routing-class thinking default (`THINKING_DEFAULT_BY_CLASS`); a binding
   * that lacks the effective level refuses (`THINKING_LEVEL_UNSUPPORTED`),
   * never a silent downgrade.
   */
  readonly required_thinking_level?: ThinkingLevelName
  /**
   * RCM D7/OQ2: the expertise narrowing key. Absent = no narrowing; a key with
   * no non-shadow binding = no narrowing (missing bindings never invent a
   * preference); a non-shadow binding that narrows the eligible set to nothing
   * refuses (`EXPERTISE_BINDING_UNSATISFIABLE`) — never a silent fallback to
   * the un-narrowed set.
   */
  readonly expertise?: ExpertiseArea
}

export interface ResolveOptions {
  /** Injected clock (ISO-8601). The resolver performs no time reads. */
  readonly issued_at: string
}

// ---------------------------------------------------------------------------
// HRO-P4a (MRC-08) — D8's bounded recovery ladder: the request/option contract
// types (beside `RouteRequest`/`ResolveOptions`). The ladder seam itself —
// `createRecoveryContext`, `resolveRouteWithRecovery`,
// `provenanceFreshnessVerdict` — is the section at the end of this module; it
// composes the existing seams unchanged (no parallel recovery module).
// ---------------------------------------------------------------------------

/**
 * C7.1: milliseconds of policy grace beyond an evidence document's own
 * `valid_until`. Consumed only from this typed input — no value, default, or
 * fallback constant exists in code. A present value must be a non-negative
 * finite integer (validated fail-closed at context creation).
 */
export type ProvenanceFreshnessTolerance = number

/**
 * C1.3: the ladder's four bounds — required for activation, all finite
 * positive integers, supplied by the caller's configuration. No default is
 * invented; missing/non-finite/non-positive bounds terminate typed with
 * `RECOVERY_BOUNDS_UNCONFIGURED` and steps 2–3 never run.
 */
export interface RecoveryBounds {
  readonly episode_deadline_ms: number
  readonly max_fallback_attempts: number
  readonly negative_cache_ttl_ms: number
  readonly provider_cooldown_ms: number
}

/**
 * C6.1/C6.4: one recorded prior execution attempt. `failure_class` is opaque,
 * validated execution-side data — recorded verbatim, never folded, never
 * re-derived from error strings or HTTP codes. `attempt_ref` names the
 * attempted target's declared binding id (exact string match only).
 */
export interface PriorAttempt {
  readonly attempt_ref: string
  readonly provider: string
  readonly failure_class: string
  readonly charge_status: 'no-charge' | 'reconciled' | 'uncertain'
}

/**
 * C1.5: one recovery episode's input — the original request preserved
 * separately from any selected route (charter `:86`).
 */
export interface RecoveryEpisodeInput {
  readonly parcelRef: string
  readonly requested: { readonly lane: LaneId; readonly registry_key: string | null }
  readonly prior_attempts: readonly PriorAttempt[]
}

/**
 * C3.4: the metadata-only refresh result. The ladder consumes exactly two
 * things from a `refreshed` document: its provenance (the C7 verdict — a
 * refreshed document that is itself `stale` stays `stale`, fail-closed) and
 * availability facts for re-evaluating exact approved mappings. An entry
 * naming a key with no approved mapping is recorded as a discovered candidate
 * and never becomes a route, mapping, tier, fallback, or entitlement.
 */
export type MetadataRefreshResult =
  | {
      readonly status: 'refreshed'
      readonly provenance: DeclaredEvidence<PiOpenRouterProvenance>
      readonly entries: Readonly<Record<string, { readonly available: boolean }>>
    }
  | { readonly status: 'unavailable'; readonly reason: string }

/**
 * C3: the injected, synchronous metadata refresh. Its transport is the
 * caller's (`routing-policy/**` performs no I/O); the result is metadata-only
 * and never approves, tiers, or entitles anything.
 */
export type MetadataRefreshFn = (input: {
  readonly requested_key: string | null
  readonly evidence_version: string | null
}) => MetadataRefreshResult

/** C6.2: the injected provider-contract retry policy — without it nothing ever retries. */
export interface TransientRetryPolicy {
  readonly retryable: (failure_class: string) => boolean
}

/** C6.5: the injected provider-health verdict — the entire breaker surface is the bounded cooldown it stamps. */
export interface ProviderHealthPolicy {
  readonly unhealthy: (failure_class: string) => boolean
}

/** C1.2: the recovery configuration — bounds, the injected clock, and the optional seam inputs. */
export interface RecoveryConfig {
  readonly bounds: RecoveryBounds
  /** Injected clock (ISO-8601). The resolver performs no time reads. */
  readonly now: () => string
  readonly provenance_freshness_tolerance?: ProvenanceFreshnessTolerance
  readonly refresh?: MetadataRefreshFn
  readonly retry_policy?: TransientRetryPolicy
  readonly health_policy?: ProviderHealthPolicy
}

/**
 * C1.2: one context per batch/coordinator lifetime, owning the bounded
 * mutable state — the version-scoped negative cache (C3.3), the coalesced
 * refresh memo (C3.2), and the provider-health cooldown stamps (C6.5). All
 * state is in-memory and TTL-bounded; entries expire on the injected clock.
 * Mutate only through the ladder seam.
 */
export interface RecoveryContext {
  readonly config: RecoveryConfig
  readonly state: {
    readonly negative_cache: Map<
      string,
      { readonly evidence_version: string | null; readonly expires_at_ms: number }
    >
    readonly refresh_memo: Map<
      string,
      {
        readonly evidence_version: string | null
        readonly record: RefreshProvenance
        readonly entries: Readonly<Record<string, { readonly available: boolean }>> | null
        readonly expires_at_ms: number
      }
    >
    /**
     * C6.5 provider-health cooldown stamps: the ACTIVE window is bounded by
     * `provider_cooldown_ms` on the injected clock. Markers are never-restamp
     * memory keyed to their source attempt (so a recovered provider is never
     * re-hidden by re-observed history) and are pruned once dead longer than
     * the window (R7) — the map stays bounded by live-window providers.
     */
    readonly cooldowns: Map<
      string,
      { readonly until_at_ms: number; readonly source_attempt_ref: string }
    >
    /** Monotone episode ordinal so every call mints a fresh episode id (C1.6). */
    episode_ordinal: number
  }
}

/**
 * C1.4: the ladder's typed resolution — returned, never thrown, for every
 * routing state (batch-safe; MRC-06's returned-terminal precedent). Malformed
 * call shapes fail closed with `TypeError` and authorize nothing.
 */
export type RecoveryResolution =
  | {
      readonly status: 'approved'
      readonly receipt: RouteReceipt
      readonly episode: RecoveryEpisodeRecord
    }
  | {
      readonly status: 'route-unavailable'
      readonly receipt: RouteReceipt
      readonly outcome: RouteUnavailableOutcome
      readonly episode: RecoveryEpisodeRecord
    }

/**
 * Charter matrix thinking levels, transcribed verbatim from `charter.md` §
 * *Initial Pi provider and lane matrix* (Thinking / notes). Mapping these onto
 * Pi's `ThinkingLevel` enum is held (H-PI) and enumerated in every receipt's
 * unproven claims.
 */
export const LANE_THINKING_LEVELS: Readonly<Record<LaneId, ThinkingLevelRecord>> = {
  L1: {
    state: 'declared',
    value: 'high',
    source: 'charter.md#initial-pi-provider-and-lane-matrix row 1',
  },
  L2: {
    state: 'declared',
    value: 'high',
    source: 'charter.md#initial-pi-provider-and-lane-matrix row 2',
  },
  L3: {
    state: 'declared',
    value: 'high',
    source: 'charter.md#initial-pi-provider-and-lane-matrix row 3',
  },
  L4: {
    state: 'declared',
    value: 'medium',
    source: 'charter.md#initial-pi-provider-and-lane-matrix row 4',
  },
  L5: {
    state: 'declared',
    value: 'minimal/low',
    source: 'charter.md#initial-pi-provider-and-lane-matrix row 5',
  },
  L6: {
    state: 'declared',
    value: 'minimal',
    source: 'charter.md#initial-pi-provider-and-lane-matrix row 6',
  },
}

/** Named-unproven claim text for the contract-vocabulary residuals and holds. */
const RESIDUAL_CLAIM_TEXT: Readonly<Record<string, string>> = {
  L1_PINNED_PROVIDER_UNSET: 'L1 pinned-provider declaration (a54 disposition 2)',
  L2_PINNED_PROVIDER_UNSET: 'L2 pinned-provider declaration (a54 disposition 2)',
  L3_PROVIDER_PREFERENCE_UNSET: 'L3 provider-preference declaration (a54 disposition 3)',
  L4_PROVIDER_PREFERENCE_UNSET: 'L4 provider-preference declaration (a54 disposition 3)',
  DELTA_L_UNSET: 'per-lane quality tolerance delta_L (a54 disposition 5)',
  AVAILABILITY_UNVERIFIED: 'live-availability attestation (A6) per binding',
  QUALITY_UNRECORDED: 'lane-scoped model-quality record (A6) per binding',
  DATA_CLASS_UNKNOWN: 'binding-level data-class eligibility (R1)',
  CONTEXT_UNKNOWN: 'available context / max output tokens (R4)',
  COST_UNKNOWN: 'unit price or budget input (R5)',
  FALLBACK_SUITABILITY_UNPROVEN: 'fallback "comparable or higher" verdict (rubric §1)',
  INPUTS_UNKNOWN: 'binding input-modality facts (RCM D8 capability predicate)',
  THINKING_LEVELS_UNKNOWN: 'binding thinking-level support (thinkingLevelMap) (RCM D8 predicate)',
  OWNER_ATTESTED_PENDING_LIVE_AVAILABILITY:
    'owner-attested identity pending live attestation (rubric §3)',
}

/** The ratified name vocabulary: the only names a receipt may carry. */
const VOCABULARY_NAMES: Readonly<Record<string, true>> = Object.fromEntries(
  [...RESOLVER_REFUSALS, ...RESOLVER_HOLDS, ...CONTRACT_REFUSALS, ...CONTRACT_RESIDUALS].map(
    (name) => [name, true as const],
  ),
)

interface IndexedBinding {
  readonly binding: ModelBinding
  readonly candidateKey: string
  readonly role: 'primary' | 'fallback'
}

interface IndexedCandidate {
  readonly binding: ModelBinding
  readonly candidateKey: string
}

interface CandidateIndex {
  readonly byId: ReadonlyMap<string, IndexedCandidate>
  readonly byCandidate: ReadonlyMap<string, readonly IndexedCandidate[]>
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function indexCandidates(candidates: Readonly<Record<string, LogicalCandidate>>): CandidateIndex {
  const byId = new Map<string, IndexedCandidate>()
  const byCandidate = new Map<string, readonly IndexedCandidate[]>()
  for (const [candidateKey, candidate] of Object.entries(candidates)) {
    for (const binding of candidate?.bindings ?? []) {
      if (typeof binding?.id !== 'string' || byId.has(binding.id)) continue
      const indexed: IndexedCandidate = { binding, candidateKey }
      byId.set(binding.id, indexed)
      const entries = byCandidate.get(candidateKey)
      byCandidate.set(candidateKey, entries === undefined ? [indexed] : [...entries, indexed])
    }
  }
  return { byId, byCandidate }
}

/** A resolved route reference: a binding id, or the typed stop that refuses it. */
type ResolvedRef = { readonly id: string } | { readonly refusal: RefusalEntry }

/** One lane route with both references resolved to binding ids. */
interface ResolvedRoute {
  readonly route: LaneRoute
  readonly primary: ResolvedRef
  readonly fallback: ResolvedRef
}

/** The effective RCM D8 requirements of a request after legacy-omission defaults. */
export interface EffectivePredicates {
  readonly inputs: readonly InputModality[]
  readonly level: ThinkingLevelName
}

/**
 * The effective predicates after D8 legacy omission (text-only inputs; the
 * routing-class thinking default per OQ5) — computed once, applied uniformly.
 * Shared by `resolveRoute` and the dispatch gate (MRC-05 C2.2) so the
 * defaults have exactly one implementation.
 */
export function effectivePredicatesFor(request: {
  readonly routing_class: string
  readonly required_inputs?: readonly InputModality[]
  readonly required_thinking_level?: ThinkingLevelName
}): EffectivePredicates {
  return {
    // RCM-P4A R1: required_inputs is canonicalized HERE — the single
    // derivation point every caller shares (resolveRoute, the dispatch gate,
    // the decision bindings, the cache key parts, the cache-key record) — in
    // the fixed INPUT_MODALITIES order, the same comparator
    // `canonicalRoutingCacheKey` applies. A permuted declaration can never
    // fork replay comparisons or cache keys.
    inputs: [...(request.required_inputs ?? ['text'])].sort(
      (a, b) => INPUT_MODALITIES.indexOf(a) - INPUT_MODALITIES.indexOf(b),
    ),
    level:
      request.required_thinking_level ??
      THINKING_DEFAULT_BY_CLASS[request.routing_class as ClassName],
  }
}

/**
 * Resolves one `RouteRef` exactly as `validator.ts` `checkLaneRoutes.resolve()`
 * does (review A F1 / review B RB-3): a `binding` ref must name a declared
 * binding id; any other ref is a candidate ref resolving to the candidate's
 * first binding of the route's provider. An unresolvable ref carries its typed
 * stop — the raw ref is never used as an identity.
 */
function resolveRouteRef(
  ref: RouteRef | undefined,
  provider: ProviderName,
  lane: LaneId,
  role: 'primary' | 'fallback',
  index: CandidateIndex,
): ResolvedRef {
  const label = `lane_routes (${lane}/${provider}).${role}`
  if (ref === null || typeof ref !== 'object' || typeof ref.ref !== 'string') {
    return {
      refusal: {
        name: 'REPRESENTATION_INCOMPLETE_REFUSED',
        detail: `${label} carries no resolvable RouteRef`,
      },
    }
  }
  if (ref.type === 'binding') {
    const found = index.byId.get(ref.ref)
    return found === undefined
      ? {
          refusal: {
            name: 'FALLBACK_DANGLING_REFERENCE',
            detail: `${label} binding '${ref.ref}' is not declared under candidates (validator resolve())`,
          },
        }
      : { id: found.binding.id }
  }
  const entries = index.byCandidate.get(ref.ref)
  if (entries === undefined || entries.length === 0) {
    return {
      refusal: {
        name: 'FALLBACK_DANGLING_REFERENCE',
        detail: `${label} candidate '${ref.ref}' is not declared under candidates (validator resolve())`,
      },
    }
  }
  const matching = entries.filter((entry) => entry.binding.provider === provider)
  const first = matching[0]
  return first === undefined
    ? {
        refusal: {
          name: 'FALLBACK_PROVIDER_MISMATCH',
          detail: `${label} candidate '${ref.ref}' has no binding of provider '${provider}' (validator resolve())`,
        },
      }
    : { id: first.binding.id }
}

/** Unique resolved bindings of a lane's declared routes, in route order, roles recorded. */
function indexLaneBindings(
  resolvedRoutes: readonly ResolvedRoute[],
  index: CandidateIndex,
): Map<string, IndexedBinding> {
  const laneBindings = new Map<string, IndexedBinding>()
  for (const entry of resolvedRoutes) {
    for (const [role, ref] of [
      ['primary', entry.primary],
      ['fallback', entry.fallback],
    ] as const) {
      if (!('id' in ref)) continue
      const found = index.byId.get(ref.id)
      if (found !== undefined && !laneBindings.has(ref.id)) {
        laneBindings.set(ref.id, {
          binding: found.binding,
          candidateKey: found.candidateKey,
          role,
        })
      }
    }
  }
  return laneBindings
}

/** The named residual of a non-`declared` evidence envelope, if any. */
function envelopeResidual(
  envelope: {
    readonly state: string
    readonly residual?: unknown
  } | null,
): string | undefined {
  if (envelope === null || envelope.state === 'declared') return undefined
  return typeof envelope.residual === 'string' ? envelope.residual : undefined
}

/** The model-side fact envelopes a requirement predicate consults (absent = unknown). */
export type RequirementFacts = Partial<
  Pick<ModelBinding, 'inputs' | 'thinking_levels' | 'context_window_tokens' | 'max_output_tokens'>
>

/** Verdicts, named refusals, evidence, and residuals of one requirement evaluation. */
export interface RequirementPredicateVerdicts {
  /** Required modalities missing from declared facts (all of them when facts are unknown). */
  readonly unmetInputs: readonly InputModality[]
  readonly inputsDeclared: boolean
  readonly levelMet: boolean
  readonly levelsDeclared: boolean
  /** `INPUTS_*` / `THINKING_*` refusals, in evaluation order (empty when satisfied). */
  readonly capabilityRefusals: readonly RefusalEntry[]
  /** The R2 evidence fragments for the input-modality and thinking-level facts. */
  readonly capabilityEvidence: readonly string[]
  /** Named residuals of the capability fact envelopes, in evaluation order. */
  readonly capabilityResiduals: readonly (string | undefined)[]
  readonly contextKnown: boolean
  readonly contextSufficient: boolean
  /** `CONTEXT_*` refusals (empty when satisfied). */
  readonly contextRefusals: readonly RefusalEntry[]
  readonly contextEvidence: string
  /** Named residuals of the context fact envelopes, in evaluation order. */
  readonly contextResiduals: readonly (string | undefined)[]
}

/**
 * RCM D8 requirement-predicate evaluation (MRC-05 C3.1): the per-binding
 * input-modality/thinking-level evaluation (R2's D8 block) and the context
 * evaluation (R4), extracted as ONE pure implementation shared by
 * `evaluateCandidate` and the dispatch gate (`dispatch/src/routing-eval`) —
 * the gate must never grow a second predicate implementation. Pure: it
 * computes verdicts, named refusals (names from `RESOLVER_REFUSALS`), the
 * evidence fragments, and the fact-envelope residuals; callers decide which
 * predicates activate (the dispatch gate's evidence rules), when residuals are
 * recorded, and what failure shape follows.
 */
export function evaluateRequirementPredicates(args: {
  readonly facts: RequirementFacts
  readonly predicates: EffectivePredicates
  readonly requiredContextTokens: number
  readonly requiredOutputTokens: number
  readonly label: string
}): RequirementPredicateVerdicts {
  const { facts, predicates, label } = args

  // Input modality (RCM D8): an absent envelope is UNKNOWN for a model-side
  // fact — never "text-only" (D2/a54: never a guessed value).
  const requiredInputs = predicates.inputs
  const inputsEnvelope = facts.inputs ?? null
  const inputsDeclared = inputsEnvelope !== null && inputsEnvelope.state === 'declared'
  const unmetInputs: readonly InputModality[] = inputsDeclared
    ? requiredInputs.filter((modality) => !inputsEnvelope.value.includes(modality))
    : requiredInputs

  // Thinking level (RCM D8): a model lacking the requested level refuses
  // rather than silently downgrading.
  const requiredLevel = predicates.level
  const levelsEnvelope = facts.thinking_levels ?? null
  const levelsDeclared = levelsEnvelope !== null && levelsEnvelope.state === 'declared'
  const levelMet = levelsDeclared && levelsEnvelope.value.includes(requiredLevel)

  const capabilityRefusals: RefusalEntry[] = []
  if (!inputsDeclared) {
    capabilityRefusals.push({
      name: 'INPUTS_UNKNOWN',
      detail: `${label} has unknown input-modality facts; the request requires [${requiredInputs.join(', ')}] (D8: a model-side fact is never guessed)`,
    })
  } else if (unmetInputs.length > 0) {
    capabilityRefusals.push({
      name: 'INPUTS_INSUFFICIENT',
      detail: `${label} cannot serve input modality [${unmetInputs.join(', ')}] required by the request (D8: refuses, never silently downgrades)`,
    })
  }
  if (!levelsDeclared) {
    capabilityRefusals.push({
      name: 'THINKING_LEVELS_UNKNOWN',
      detail: `${label} has unknown thinking-level support; the request requires '${requiredLevel}' (D8)`,
    })
  } else if (!levelMet) {
    capabilityRefusals.push({
      name: 'THINKING_LEVEL_UNSUPPORTED',
      detail: `${label} lacks the requested thinking level '${requiredLevel}' (D8: refuses rather than silently downgrading)`,
    })
  }

  // R4 available context (the context floor's fact pair: window + max output).
  const contextEnvelope = facts.context_window_tokens ?? null
  const outputEnvelope = facts.max_output_tokens ?? null
  const contextValue =
    contextEnvelope !== null && contextEnvelope.state === 'declared' ? contextEnvelope.value : null
  const outputValue =
    outputEnvelope !== null && outputEnvelope.state === 'declared' ? outputEnvelope.value : null
  const contextKnown = contextValue !== null && outputValue !== null
  const contextSufficient =
    contextKnown &&
    contextValue >= args.requiredContextTokens &&
    outputValue >= args.requiredOutputTokens
  const contextRefusals: RefusalEntry[] = []
  if (!contextKnown) {
    contextRefusals.push({
      name: 'CONTEXT_UNKNOWN',
      detail: `${label} context facts are unknown`,
    })
  } else if (!contextSufficient) {
    contextRefusals.push({
      name: 'CONTEXT_INSUFFICIENT',
      detail: `${label} cannot fit the required context/output budget`,
    })
  }

  return {
    unmetInputs,
    inputsDeclared,
    levelMet,
    levelsDeclared,
    capabilityRefusals,
    capabilityEvidence: [
      inputsDeclared
        ? `inputs [${inputsEnvelope.value.join('|')}]`
        : `inputs ${envelopeResidual(inputsEnvelope) ?? 'unavailable'}`,
      levelsDeclared
        ? `thinking_levels [${levelsEnvelope.value.join('|')}]`
        : `thinking_levels ${envelopeResidual(levelsEnvelope) ?? 'unavailable'}`,
    ],
    capabilityResiduals: [envelopeResidual(inputsEnvelope), envelopeResidual(levelsEnvelope)],
    contextKnown,
    contextSufficient,
    contextRefusals,
    contextEvidence: contextKnown
      ? `context_window=${String(contextValue)} max_output=${String(outputValue)}`
      : `context ${envelopeResidual(contextEnvelope) ?? 'unavailable'} / output ${envelopeResidual(outputEnvelope) ?? 'unavailable'}`,
    contextResiduals: [envelopeResidual(contextEnvelope), envelopeResidual(outputEnvelope)],
  }
}

function projectedCostUsd(binding: ModelBinding, request: RouteRequest): number | null {
  const cost = binding.cost
  if (cost.state !== 'declared') return null
  const quote = cost.value
  if (
    quote.unit !== 'usd_per_mtok' ||
    !isFiniteNumber(quote.input) ||
    !isFiniteNumber(quote.output)
  ) {
    return null
  }
  return (
    (request.projected_input_tokens * quote.input +
      request.projected_output_tokens * quote.output) /
    1e6
  )
}

/** Rubric §2: every ranking input for every candidate, refusals named. */
function evaluateCandidate(
  indexed: IndexedBinding,
  request: RouteRequest,
  predicates: EffectivePredicates,
): CandidateEvaluation {
  const { binding, candidateKey, role } = indexed
  const refusals: RefusalEntry[] = []
  const holds: string[] = []
  const residuals: string[] = []
  const ranking_inputs: RankingInputRecord[] = []
  const bindingLabel = `binding '${binding.id}'`

  const noteResidual = (residual: string | undefined): void => {
    if (residual === undefined) return
    if (!(residual in VOCABULARY_NAMES)) {
      refusals.push({
        name: 'RESIDUAL_FABRICATED_REFUSED',
        detail: `${bindingLabel} declares residual '${residual}', which is not in the contract vocabulary`,
      })
      return
    }
    residuals.push(residual)
  }

  // Identity evidence (rubric §3: unresolved or owner-attested is unrankable).
  // The zero-match `hold` tag is P1's descriptive label (not a vocabulary
  // name); the AC2A refusal names are what the receipt records.
  const identity = binding.identity
  if (identity.state === 'zero-match') {
    for (const name of [identity.refusal, ...identity.diagnostics]) {
      if (name in VOCABULARY_NAMES) {
        refusals.push({
          name,
          detail: `${bindingLabel} identity is AC2A_ZERO_MATCH (Amendment 04 D-b1)`,
        })
      } else {
        refusals.push({
          name: 'RESIDUAL_FABRICATED_REFUSED',
          detail: `${bindingLabel} identity carries name '${name}', which is not in the contract vocabulary`,
        })
      }
    }
  } else if (identity.state === 'owner-attested') {
    if (identity.hold in VOCABULARY_NAMES) holds.push(identity.hold)
    else
      refusals.push({
        name: 'RESIDUAL_FABRICATED_REFUSED',
        detail: `${bindingLabel} identity hold '${String(identity.hold)}' is not in the contract vocabulary`,
      })
  }

  // Endpoint alignment (H-EP / SCF-1..3 / D13: endpoint mismatch refuses).
  const endpoint = binding.endpoint
  if (endpoint.alignment === 'divergent') {
    refusals.push({
      name: 'ENDPOINT_DIVERGENCE_REFUSED',
      detail: `${bindingLabel} catalogue endpoint '${String(endpoint.catalogue)}' diverges from registered '${endpoint.registered}' (H-EP)`,
    })
  }
  if (binding.provider === 'openrouter' && endpoint.registered !== PI_OPENROUTER_ROUTING.baseUrl) {
    refusals.push({
      name: 'ENDPOINT_DIVERGENCE_REFUSED',
      detail: `${bindingLabel} registered endpoint '${endpoint.registered}' diverges from the pi-openrouter.ts contract const '${PI_OPENROUTER_ROUTING.baseUrl}' (SCF-3)`,
    })
  }

  // R1 data-class eligibility.
  const dataClasses = binding.data_classes
  const dataClassesDeclared = dataClasses.state === 'declared'
  noteResidual(envelopeResidual(dataClasses))
  const r1Verdict = dataClassesDeclared && dataClasses.value.includes(request.data_class)
  ranking_inputs.push({
    input: 'R1',
    verdict: r1Verdict,
    evidence: dataClassesDeclared
      ? `data_classes declared (${dataClasses.value.join('|')}) from ${dataClasses.source}`
      : `data_classes ${envelopeResidual(dataClasses) ?? 'unavailable'}`,
    detail: r1Verdict
      ? `serves data class '${request.data_class}'`
      : dataClassesDeclared
        ? `not eligible for data class '${request.data_class}'`
        : 'data-class eligibility unknown',
  })
  if (!r1Verdict) {
    refusals.push({
      name: dataClassesDeclared ? 'DATA_CLASS_INELIGIBLE' : 'DATA_CLASS_UNKNOWN',
      detail: `${bindingLabel} ${
        dataClassesDeclared
          ? `is not eligible for '${request.data_class}'`
          : 'has unknown data-class eligibility'
      }`,
    })
  }

  // R2 required capability (never inferred from family): tool/structured
  // requirements plus the RCM D8 capability predicates (input modality,
  // thinking level). D4: capability predicates only narrow the
  // classification-eligible set — they never widen it, never reorder it, and
  // never promote a binding into a classification (R1 stays the first gate).
  const required: readonly ('tool-use' | 'structured-output')[] = [
    ...(request.require_tool_use ? (['tool-use'] as const) : []),
    ...(request.require_structured_output ? (['structured-output'] as const) : []),
  ]
  let r2Missing = false
  let r2Unverified = false
  for (const capability of required) {
    const state: unknown = binding.capabilities[capability]
    if (state === undefined) r2Missing = true
    else if (state !== 'verified') r2Unverified = true
  }

  // RCM D8 requirement predicates (input modality, thinking level) plus the
  // R4 context facts: ONE shared evaluation (evaluateRequirementPredicates),
  // called here and by the dispatch gate (MRC-05 C3.1) — never a second
  // implementation. Residuals are noted at their original evaluation points.
  const requirement = evaluateRequirementPredicates({
    facts: binding,
    predicates,
    requiredContextTokens: request.required_context_tokens,
    requiredOutputTokens: request.required_output_tokens,
    label: bindingLabel,
  })
  noteResidual(requirement.capabilityResiduals[0])
  noteResidual(requirement.capabilityResiduals[1])

  const r2Verdict =
    !r2Missing && !r2Unverified && requirement.unmetInputs.length === 0 && requirement.levelMet
  ranking_inputs.push({
    input: 'R2',
    verdict: r2Verdict,
    evidence: [
      required.length === 0
        ? 'no tool/structured capability required'
        : `capabilities ${required.map((c) => `${c}=${String(binding.capabilities[c])}`).join(' ')}`,
      ...requirement.capabilityEvidence,
    ].join('; '),
    detail: r2Verdict
      ? 'required capabilities satisfied (tool/structured, input modality, thinking level)'
      : 'required capability missing, unverified, or unsatisfiable — the named refusals record the failing predicate',
  })
  if (r2Missing) {
    refusals.push({
      name: 'CAPABILITY_MISSING',
      detail: `${bindingLabel} lacks a required capability entry`,
    })
  }
  if (r2Unverified) {
    refusals.push({
      name: 'CAPABILITY_UNVERIFIED',
      detail: `${bindingLabel} required capability is unverified (never inferred from family)`,
    })
  }
  refusals.push(...requirement.capabilityRefusals)

  // R3 independence obligation (A2: denied, never downgraded).
  const family = binding.family
  const r3Known = typeof family === 'string' && family.length > 0
  const r3Verdict = r3Known && !request.independence_excluded_families.includes(family)
  ranking_inputs.push({
    input: 'R3',
    verdict: r3Verdict,
    evidence: r3Known ? `declared family '${family}'` : 'family declaration missing',
    detail: r3Verdict
      ? 'family independent of the excluded set'
      : r3Known
        ? `family '${family}' is excluded by the independence obligation`
        : 'declared family unknown',
  })
  if (!r3Known) {
    refusals.push({
      name: 'INDEPENDENCE_UNPROVEN',
      detail: `${bindingLabel} has no declared model family`,
    })
  } else if (!r3Verdict) {
    refusals.push({
      name: 'INDEPENDENCE_VIOLATION',
      detail: `${bindingLabel} family '${family}' collapses reviewer independence (A2: denied, never downgraded)`,
    })
  }

  // R4 available context — via the shared evaluation above; residuals are
  // noted here at the R4 evaluation point.
  noteResidual(requirement.contextResiduals[0])
  noteResidual(requirement.contextResiduals[1])
  ranking_inputs.push({
    input: 'R4',
    verdict: requirement.contextSufficient,
    evidence: requirement.contextEvidence,
    detail: requirement.contextSufficient
      ? 'context and output budget sufficient'
      : requirement.contextKnown
        ? 'context or max output below the request requirement'
        : 'context facts unknown',
  })
  refusals.push(...requirement.contextRefusals)

  // R5 budget filter and (economy lane) dominant ordering key.
  const cost = binding.cost
  noteResidual(envelopeResidual(cost))
  const projected = projectedCostUsd(binding, request)
  const costKnown = cost.state === 'declared'
  const costUnit = costKnown ? cost.value.unit : 'unknown'
  let r5Verdict = false
  let r5Detail = 'cost facts unknown'
  if (costKnown && projected === null) {
    r5Detail = `cost unit '${costUnit}' is not USD per 1M tokens`
  } else if (projected !== null) {
    r5Verdict = projected <= request.remaining_budget_usd
    r5Detail = r5Verdict
      ? `projected $${projected.toFixed(6)} within remaining $${request.remaining_budget_usd}`
      : `projected $${projected.toFixed(6)} exceeds remaining $${request.remaining_budget_usd}`
  }
  ranking_inputs.push({
    input: 'R5',
    verdict: r5Verdict,
    evidence: costKnown
      ? `cost {unit: ${costUnit}} from ${cost.source}`
      : `cost ${envelopeResidual(cost) ?? 'unavailable'}`,
    detail: r5Detail,
  })
  if (!r5Verdict) {
    const name = !costKnown
      ? 'COST_UNKNOWN'
      : projected === null
        ? 'COST_UNIT_UNKNOWN'
        : 'BUDGET_EXCEEDED'
    refusals.push({ name, detail: `${bindingLabel}: ${r5Detail}` })
  }

  // R6 verified availability (A6 `live-availability`).
  const availability = binding.availability
  noteResidual(envelopeResidual(availability))
  const availabilityDeclared = availability.state === 'declared'
  ranking_inputs.push({
    input: 'R6',
    verdict: availabilityDeclared,
    evidence: availabilityDeclared
      ? `attests '${String(availability.value)}' from ${availability.source}`
      : `availability ${envelopeResidual(availability) ?? 'unavailable'}`,
    detail: availabilityDeclared
      ? 'live-availability attested'
      : 'availability unverified (catalogue presence is never a proxy)',
  })
  if (!availabilityDeclared) {
    refusals.push({
      name: 'AVAILABILITY_UNVERIFIED',
      detail: `${bindingLabel} has no A6 live-availability attestation`,
    })
  }

  // R7 recorded quality (A6 `model-quality`, lane-scoped).
  const quality = binding.quality
  noteResidual(envelopeResidual(quality))
  const qualityDeclared = quality.state === 'declared'
  ranking_inputs.push({
    input: 'R7',
    verdict: qualityDeclared,
    evidence: qualityDeclared
      ? `attests '${String(quality.value)}' from ${quality.source}`
      : `quality ${envelopeResidual(quality) ?? 'unavailable'}`,
    detail: qualityDeclared
      ? 'model-quality recorded for this lane'
      : 'no lane-scoped quality record',
  })
  if (!qualityDeclared) {
    refusals.push({
      name: 'QUALITY_UNRECORDED',
      detail: `${bindingLabel} has no lane-scoped model-quality record`,
    })
  }

  return {
    binding_id: binding.id,
    candidate: candidateKey,
    role,
    ranking_inputs,
    refusals,
    holds,
    residuals: [...new Set(residuals)].sort(),
    rankable: refusals.length === 0 && holds.length === 0,
  }
}

/**
 * A3 per-lane provider rules as frozen by A5.4 (`validator.ts`
 * `FROZEN_PROVIDER_RULES`, mirrored — the resolver enforces the frozen map at
 * resolve time too, never only statically; review A F3).
 */
const FROZEN_PROVIDER_RULE_KINDS: Readonly<Record<LaneId, string>> = {
  L1: 'pinned-provider',
  L2: 'pinned-provider',
  L3: 'declared-preference',
  L4: 'declared-preference',
  L5: 'cheapest-eligible',
  L6: 'none',
}

/**
 * Rubric §4 step 1 — the per-lane provider step. The declaration slots are
 * typed-unavailable residuals (a54 dispositions 2/3): a slot that is not the
 * exact expected residual is fabricated and refused
 * (`RESIDUAL_FABRICATED_REFUSED`), an unset slot is a stop receipt, never a
 * silent default, and a `provider_rule.kind` outside the frozen per-lane rule
 * refuses (`ROLE_LANE_MAP_VIOLATION`) instead of falling through to
 * cheapest-eligible (review A F3). A composed `${lane}_*` slot name outside the
 * ratified vocabulary is itself fabricated and refused (review A F4) — a
 * receipt can never carry it.
 */
function providerRuleGate(laneEntry: LaneEntry, lane: LaneId): RefusalEntry[] {
  const stops: RefusalEntry[] = []
  const rule: ProviderRule = laneEntry.provider_rule
  const tolerance = laneEntry.quality_tolerance
  if (tolerance.state !== 'unavailable' || tolerance.residual !== 'DELTA_L_UNSET') {
    stops.push({
      name: 'RESIDUAL_FABRICATED_REFUSED',
      detail: `lane_map.${lane}.quality_tolerance must be the typed-unavailable residual 'DELTA_L_UNSET' (a54 item 5)`,
    })
  }
  if (rule.kind === 'none') {
    stops.push({ name: 'LANE_DISABLED_REFUSED', detail: `lane ${lane} is refused/disabled (M2)` })
  } else if (rule.kind === 'pinned-provider') {
    const expected = `${lane}_PINNED_PROVIDER_UNSET`
    const slot = rule.pinned_provider
    if (slot.state !== 'unavailable' || slot.residual !== expected) {
      stops.push({
        name: 'RESIDUAL_FABRICATED_REFUSED',
        detail: `lane_map.${lane}.provider_rule.pinned_provider must be the typed-unavailable residual '${expected}' (a54 item 2)`,
      })
    } else if (!(expected in VOCABULARY_NAMES)) {
      stops.push({
        name: 'RESIDUAL_FABRICATED_REFUSED',
        detail: `lane_map.${lane}.provider_rule.pinned_provider composes the slot name '${expected}', which is not in the ratified vocabulary — refused, never emitted (review A F4)`,
      })
    } else {
      stops.push({
        name: expected,
        detail: `lane ${lane} pins a single declared provider (A3); the declaration value is unset and due before any resolve-time use (a54 item 2) — fail closed`,
      })
    }
  } else if (rule.kind === 'declared-preference') {
    const expected = `${lane}_PROVIDER_PREFERENCE_UNSET`
    const slot = rule.preference
    if (slot.state !== 'unavailable' || slot.residual !== expected) {
      stops.push({
        name: 'RESIDUAL_FABRICATED_REFUSED',
        detail: `lane_map.${lane}.provider_rule.preference must be the typed-unavailable residual '${expected}' (a54 item 3)`,
      })
    } else if (!(expected in VOCABULARY_NAMES)) {
      stops.push({
        name: 'RESIDUAL_FABRICATED_REFUSED',
        detail: `lane_map.${lane}.provider_rule.preference composes the slot name '${expected}', which is not in the ratified vocabulary — refused, never emitted (review A F4)`,
      })
    } else {
      stops.push({
        name: expected,
        detail: `lane ${lane} declares an explicit provider preference (A3); the declaration value is unset and due before any resolve-time use (a54 item 3) — fail closed`,
      })
    }
  }
  // 'cheapest-eligible' has no slot and proceeds (L5's frozen rule). Every
  // other kind — unknown kinds and lane-mismatched kinds alike — fails closed
  // against the frozen map instead of silently substituting a default (F3).
  const frozenKind = FROZEN_PROVIDER_RULE_KINDS[lane]
  if (rule.kind !== frozenKind) {
    stops.push({
      name: 'ROLE_LANE_MAP_VIOLATION',
      detail: `lane_map.${lane}.provider_rule.kind must be '${String(frozenKind)}' (A3 per-lane rule, A5.4 frozen map); got '${String(rule.kind)}' — an unset declaration slot is never a silent default`,
    })
  }
  return stops
}

/**
 * RCM D3/OQ2: expertise narrowing over the already-eligible candidates.
 * Returns the narrowed binding-id set of the non-shadow binding(s) for
 * `(request.routing_class, request.expertise)`, or `null` when no non-shadow
 * binding exists — missing bindings never invent a preference. A ref that no
 * longer resolves is a typed stop (`EXPERTISE_BINDING_DANGLING_REFERENCE`), the
 * resolve-time mirror of the validator's static check. Shadow entries are
 * evidence-only (RCM-P9) and never narrow.
 */
function expertiseNarrowing(
  policy: RoutingPolicy,
  request: Pick<RouteRequest, 'routing_class' | 'expertise'>,
  index: CandidateIndex,
): { readonly ids: ReadonlySet<string> } | { readonly stop: RefusalEntry } | null {
  const expertise = request.expertise
  if (expertise === undefined) return null
  const entries = (policy.expertise_bindings ?? []).filter(
    (entry) =>
      entry.shadow !== true &&
      entry.routing_class === request.routing_class &&
      entry.expertise === expertise,
  )
  if (entries.length === 0) return null
  const ids = new Set<string>()
  for (const entry of entries) {
    for (const ref of entry.bindings) {
      const label = `expertise_bindings (${request.routing_class}, ${expertise})`
      if (ref.type === 'binding') {
        const found = index.byId.get(ref.ref)
        if (found === undefined) {
          return {
            stop: {
              name: 'EXPERTISE_BINDING_DANGLING_REFERENCE',
              detail: `${label} binding '${ref.ref}' is not declared under candidates (validator checkExpertiseBindings)`,
            },
          }
        }
        ids.add(found.binding.id)
      } else {
        const found = index.byCandidate.get(ref.ref)
        if (found === undefined || found.length === 0) {
          return {
            stop: {
              name: 'EXPERTISE_BINDING_DANGLING_REFERENCE',
              detail: `${label} candidate '${ref.ref}' is not declared under candidates (validator checkExpertiseBindings)`,
            },
          }
        }
        for (const entry2 of found) ids.add(entry2.binding.id)
      }
    }
  }
  return { ids }
}

/**
 * The expertise-narrowing decision for a caller without the resolver's route
 * machinery (MRC-05 C3.1): the SAME decision core `resolveRoute` applies —
 * one implementation, never a divergent re-derivation. Returns the narrowed
 * binding-id set, the typed stop that refuses the request
 * (`EXPERTISE_BINDING_DANGLING_REFERENCE`), or null when no non-shadow
 * `(routing_class, expertise)` binding narrows (missing bindings never invent
 * a preference; shadow entries never narrow).
 */
export function expertiseNarrowingFor(
  policy: RoutingPolicy,
  request: Pick<RouteRequest, 'routing_class' | 'expertise'>,
): { readonly ids: ReadonlySet<string> } | { readonly stop: RefusalEntry } | null {
  return expertiseNarrowing(policy, request, indexCandidates(policy.candidates ?? {}))
}

/**
 * The Pi-side contract for a resolved binding (MRC-02 C4): populated from the
 * mapping's explicit `PiOpenRouterModel` values only. A mapping lacking
 * explicit `providerLocalId`/`protocol` yields null (unknown) — a value is
 * never derived from the registry key or host id (HRO-P1 D2's distinct-values
 * rule). The models record is a parameterization seam for tests; production
 * callers use the shipped catalog default.
 */
export function piModelContractFor(
  binding: Pick<ModelBinding, 'provider' | 'model'>,
  models: Readonly<Record<string, PiOpenRouterModel>> = PI_OPENROUTER_ROUTING.models,
): PiModelContract | null {
  for (const [key, entry] of Object.entries(models)) {
    const matches =
      binding.provider === 'openrouter' ? key === binding.model : entry.opencodeId === binding.model
    if (!matches) continue
    return {
      registry_key: key,
      opencode_id: entry.opencodeId ?? null,
      provider_local_id: entry.providerLocalId ?? null,
      protocol: entry.protocol ?? null,
      capabilities: entry.capabilities,
      allowed_lanes: entry.allowedLanes,
      prohibited_lanes: entry.prohibitedLanes,
      authority: entry.authority,
    }
  }
  return null
}

function strictestTransport(
  policy: RoutingPolicy,
  dataClasses: readonly DataClassificationTier[],
): TransportRequirements {
  let data_collection: 'allow' | 'deny' = 'allow'
  let zdr = false
  for (const tier of dataClasses) {
    const requirements = policy.data_classification?.[tier]?.transport_requirements
    if (requirements === undefined) continue
    if (requirements.data_collection === 'deny') data_collection = 'deny'
    if (requirements.zdr === true) zdr = true
  }
  return { data_collection, zdr }
}

/**
 * Rubric §1 / review A F2 + review B RB-4: the lane-route `comparability`
 * envelope reaches the signed receipt, so it passes the same vocabulary gate as
 * the binding envelopes, and a declared "comparable or higher" verdict is
 * refused while delta_L is unset — "unproven" is never read as "comparable".
 */
function comparabilityGate(
  resolvedRoutes: readonly ResolvedRoute[],
  laneEntry: LaneEntry,
  lane: LaneId,
): RefusalEntry[] {
  const stops: RefusalEntry[] = []
  for (const entry of resolvedRoutes) {
    const envelope: Evidence<string> = entry.route.comparability
    const residual = envelopeResidual(envelope)
    if (residual !== undefined && !(residual in VOCABULARY_NAMES)) {
      stops.push({
        name: 'RESIDUAL_FABRICATED_REFUSED',
        detail: `lane_routes (${lane}/${entry.route.provider}).comparability declares residual '${residual}', which is not in the contract vocabulary`,
      })
    }
    if (envelope.state === 'declared' && laneEntry.quality_tolerance.residual === 'DELTA_L_UNSET') {
      stops.push({
        name: 'FALLBACK_SUITABILITY_UNPROVEN',
        detail: `lane_routes (${lane}/${entry.route.provider}).comparability claims '${String(envelope.value)}' while delta_L is unset (rubric §1: unproven inputs never read as comparable)`,
      })
    }
  }
  return stops
}

/** One stop per refusal name (first detail wins). */
function dedupeStops(stops: readonly RefusalEntry[]): RefusalEntry[] {
  const seen = new Map<string, RefusalEntry>()
  for (const stop of stops) {
    if (!seen.has(stop.name)) seen.set(stop.name, stop)
  }
  return [...seen.values()]
}

function unprovenClaimsFor(
  evaluations: readonly CandidateEvaluation[],
  laneEntry: LaneEntry,
  comparability: readonly Evidence<string>[],
): UnprovenClaim[] {
  const names = new Set<string>()
  for (const evaluation of evaluations) {
    for (const hold of evaluation.holds) names.add(hold)
    for (const residual of evaluation.residuals) names.add(residual)
  }
  const tolerance = laneEntry.quality_tolerance
  names.add(tolerance.residual)
  // The lane's declared fallback verdicts are enumerated on every receipt,
  // approved or stop (review A F5): their residuals are unproven claims of the
  // lane whether or not a route was emitted.
  for (const envelope of comparability) {
    const residual = envelopeResidual(envelope)
    if (residual !== undefined) names.add(residual)
    else if (envelope.state === 'declared') names.add('FALLBACK_SUITABILITY_UNPROVEN')
  }
  const claims: UnprovenClaim[] = []
  for (const name of [...names].sort()) {
    const claim = RESIDUAL_CLAIM_TEXT[name]
    if (claim !== undefined) claims.push({ claim, state: 'unproven', residual: name })
  }
  claims.push({
    claim:
      'Pi thinking-level handling semantics on the pinned runtime (H-PI hold, compat memo 0.87.1)',
    state: 'unproven',
  })
  claims.push({
    claim:
      'R7 score-ordered refinement (rubric §4 step 2): the representation records R7 presence, not a score',
    state: 'unproven',
  })
  return claims
}

function structuralStopsFor(request: RouteRequest, policy: RoutingPolicy): RefusalEntry[] {
  const stops: RefusalEntry[] = []
  const lane = policy.lane_map?.[request.lane]
  if (lane === undefined) {
    stops.push({
      name: 'ROLE_LANE_MAP_VIOLATION',
      detail: `request.lane '${String(request.lane)}' is not a lane of the frozen role/lane map`,
    })
    return stops
  }
  if (!lane.routing_classes.includes(request.routing_class)) {
    stops.push({
      name: 'ROLE_LANE_MAP_VIOLATION',
      detail: `routing class '${String(request.routing_class)}' is not mapped to lane ${String(request.lane)}`,
    })
  }
  if (policy.data_classification?.[request.data_class] === undefined) {
    stops.push({
      name: 'DATA_CLASS_UNKNOWN',
      detail: `data class '${String(request.data_class)}' has no data_classification rule`,
    })
  }
  if (
    typeof request.require_tool_use !== 'boolean' ||
    typeof request.require_structured_output !== 'boolean'
  ) {
    stops.push({
      name: 'CAPABILITY_UNVERIFIED',
      detail: 'required-capability flags are not booleans',
    })
  }
  if (
    !Array.isArray(request.independence_excluded_families) ||
    request.independence_excluded_families.some((entry) => typeof entry !== 'string')
  ) {
    stops.push({
      name: 'INDEPENDENCE_UNPROVEN',
      detail: 'independence obligation is not a string list',
    })
  }
  if (
    !isFiniteNumber(request.required_context_tokens) ||
    !isFiniteNumber(request.required_output_tokens)
  ) {
    stops.push({
      name: 'CONTEXT_UNKNOWN',
      detail: 'required context/output tokens are not finite numbers',
    })
  }
  if (
    !isFiniteNumber(request.remaining_budget_usd) ||
    !isFiniteNumber(request.projected_input_tokens) ||
    !isFiniteNumber(request.projected_output_tokens)
  ) {
    stops.push({
      name: 'COST_UNKNOWN',
      detail: 'budget or projected token inputs are not finite numbers',
    })
  }
  // RCM D8 (schema v0.4) request-shape and defaulting rules: malformed
  // requirements refuse with the named predicate; a missing thinking level
  // defaults per OQ5 only when the routing class carries a ratified default.
  if (request.required_inputs !== undefined) {
    const inputs = request.required_inputs
    if (
      !Array.isArray(inputs) ||
      inputs.length === 0 ||
      inputs.some((modality) => !(INPUT_MODALITIES as readonly string[]).includes(modality))
    ) {
      stops.push({
        name: 'INPUTS_UNKNOWN',
        detail: "required_inputs must be a non-empty list of 'text' | 'image' (D8)",
      })
    }
  }
  if (
    request.required_thinking_level !== undefined &&
    !(THINKING_LEVELS as readonly string[]).includes(request.required_thinking_level)
  ) {
    stops.push({
      name: 'THINKING_LEVELS_UNKNOWN',
      detail: `required_thinking_level '${String(request.required_thinking_level)}' is not a ThinkingLevel name (D8: maps to thinkingLevelMap)`,
    })
  }
  if (
    request.required_thinking_level === undefined &&
    THINKING_DEFAULT_BY_CLASS[request.routing_class as ClassName] === undefined
  ) {
    stops.push({
      name: 'REPRESENTATION_INCOMPLETE_REFUSED',
      detail: `routing class '${request.routing_class}' carries no OQ5 thinking default; a request without explicit required_thinking_level cannot be evaluated — refused, never defaulted`,
    })
  }
  if (
    request.expertise !== undefined &&
    !(EXPERTISE_AREAS as readonly string[]).includes(request.expertise)
  ) {
    stops.push({
      name: 'EXPERTISE_BINDING_UNSATISFIABLE',
      detail: `request.expertise '${String(request.expertise)}' is outside the closed foreman-config vocabulary (D7: never free text) — refused, never ignored`,
    })
  }
  return stops
}

interface ReceiptParts {
  readonly request: unknown
  readonly options: ResolveOptions
  readonly laneEntry: LaneEntry | null
  readonly evaluations: readonly CandidateEvaluation[]
  readonly stops: readonly RefusalEntry[]
  readonly selection: SelectionRecord | null
  readonly route: ApprovedRoute | null
  readonly fallbackHandoff: FallbackHandoffPlan | null
  readonly budget: BudgetRecord | null
  readonly dataControls: TransportRequirements | null
  /** The lane's declared comparability envelopes (unproven-claim enumeration). */
  readonly comparability: readonly Evidence<string>[]
}

function finalizeReceipt(parts: ReceiptParts): RouteReceipt {
  const { request, options, laneEntry, evaluations, stops, selection, route } = parts
  const rawLane = (request as { lane?: unknown } | null | undefined)?.lane
  const lane: LaneId | null = LANE_IDS.includes(rawLane as LaneId) ? (rawLane as LaneId) : null
  const routingClass = String(
    (request as Partial<RouteRequest> | null | undefined)?.routing_class ?? '',
  )
  const laneConfig: LaneConfig | null =
    laneEntry === null || lane === null || parts.budget === null || parts.dataControls === null
      ? null
      : {
          lane,
          role_family: laneEntry.role_family,
          subroles: laneEntry.subroles,
          routing_class: routingClass,
          authority_cap: laneEntry.authority_cap,
          authority_prohibited: laneEntry.authority_prohibited,
          provider_rule: laneEntry.provider_rule,
          quality_tolerance: laneEntry.quality_tolerance,
          thinking_level: LANE_THINKING_LEVELS[lane],
          budget: parts.budget,
          data_controls: parts.dataControls,
        }
  const status: 'approved' | 'stop' = route !== null && stops.length === 0 ? 'approved' : 'stop'
  const body = {
    kind: 'pi-route-receipt' as const,
    schema_version: 1 as const,
    resolver: ROUTE_RESOLVER_ID,
    status,
    attested_state: 'static-conformance' as const,
    receipt_id: '',
    issued_at: options.issued_at,
    lane,
    request,
    lane_config: laneConfig,
    evaluations,
    selection: selection ?? {
      rule: 'not-reached',
      reason:
        stops.length > 0
          ? `stopped: ${stops.map((stop) => stop.name).join(', ')}`
          : 'no selection rule reached',
      order: [],
      chosen: null,
    },
    route,
    fallback_handoff: parts.fallbackHandoff,
    stops,
    unproven_claims:
      laneEntry === null ? [] : unprovenClaimsFor(evaluations, laneEntry, parts.comparability),
  }
  const receiptId = documentDigest({ ...body, receipt_id: '' })
  return signReceipt({ ...body, receipt_id: receiptId })
}

function stopReceipt(
  request: unknown,
  options: ResolveOptions,
  stops: readonly RefusalEntry[],
  pieces?: Partial<ReceiptParts>,
): RouteReceipt {
  return finalizeReceipt({
    request,
    options,
    laneEntry: null,
    evaluations: [],
    stops,
    selection: null,
    route: null,
    fallbackHandoff: null,
    budget: null,
    dataControls: null,
    comparability: [],
    ...pieces,
  })
}

/**
 * Resolves one dispatch request against the ratified policy. Returns the signed
 * receipt (approved or stop). Never fabricates a value: unmet evidence becomes
 * named refusals/residuals in the receipt and the request stops fail-closed.
 */
export function resolveRoute(
  policy: RoutingPolicy,
  request: RouteRequest,
  options: ResolveOptions,
): RouteReceipt {
  if (policy === null || typeof policy !== 'object') {
    return stopReceipt(request, options, [
      { name: 'REPRESENTATION_INCOMPLETE_REFUSED', detail: 'policy is not an object' },
    ])
  }
  if (request === null || typeof request !== 'object' || Array.isArray(request)) {
    return finalizeReceipt({
      request,
      options,
      laneEntry: null,
      evaluations: [],
      stops: [{ name: 'ROLE_LANE_MAP_VIOLATION', detail: 'request is not an object' }],
      selection: null,
      route: null,
      fallbackHandoff: null,
      budget: null,
      dataControls: null,
      comparability: [],
    })
  }
  const structural = structuralStopsFor(request, policy)
  if (
    policy.lane_map === undefined ||
    policy.candidates === undefined ||
    !Array.isArray(policy.lane_routes)
  ) {
    return stopReceipt(request, options, [
      {
        name: 'REPRESENTATION_INCOMPLETE_REFUSED',
        detail:
          'policy is missing the new representation blocks (lane_map, candidates, lane_routes)',
      },
    ])
  }
  const laneEntry = policy.lane_map[request.lane]
  if (laneEntry === undefined) {
    return stopReceipt(
      request,
      options,
      structural.length > 0
        ? structural
        : [
            {
              name: 'ROLE_LANE_MAP_VIOLATION',
              detail: `request.lane '${String(request.lane)}' is not a lane of the frozen role/lane map`,
            },
          ],
    )
  }
  const laneRoutes = policy.lane_routes.filter((route) => route.lane === request.lane)
  const comparability = laneRoutes.map((route) => route.comparability)

  // Rubric §5 rule 1 (L6): the disabled lane refuses before any filter or
  // ranking; no eligibility filtering, ranking, or tie-break is evaluated.
  if (laneEntry.status === 'disabled-refused' || laneEntry.provider_rule.kind === 'none') {
    return stopReceipt(
      request,
      options,
      [
        {
          name: 'LANE_DISABLED_REFUSED',
          detail: `lane ${request.lane} is refused/disabled (M2); nothing else is evaluated`,
        },
      ],
      { laneEntry, comparability },
    )
  }

  if (structural.length > 0) {
    return stopReceipt(request, options, structural, { laneEntry, comparability })
  }

  // R5 budget gate (pmc-p1 record §4): no ratified ceiling_usd for the routing
  // class means R5 fail-closes at resolve time until an owner value lands —
  // never an invented ceiling.
  const classes: Readonly<Record<string, { readonly ceiling_usd: number } | undefined>> =
    policy.classes
  const ceiling = classes[request.routing_class]?.ceiling_usd
  if (!isFiniteNumber(ceiling) || ceiling <= 0) {
    return stopReceipt(
      request,
      options,
      [
        {
          name: 'COST_UNKNOWN',
          detail: `no ratified classes['${request.routing_class}'].ceiling_usd exists anywhere; R5 fail-closes until an owner value lands (pmc-p1 record §4)`,
        },
      ],
      { laneEntry, comparability },
    )
  }

  if (laneRoutes.length === 0) {
    return stopReceipt(
      request,
      options,
      [
        {
          name: 'REPRESENTATION_INCOMPLETE_REFUSED',
          detail: `no lane_routes entry declares lane ${request.lane}`,
        },
      ],
      { laneEntry, comparability },
    )
  }

  // Every declared reference resolves exactly as the validator resolves it
  // (review A F1 / review B RB-3) before anything is evaluated or emitted.
  const index = indexCandidates(policy.candidates)
  const resolvedRoutes: ResolvedRoute[] = laneRoutes.map((route) => ({
    route,
    primary: resolveRouteRef(route.primary, route.provider, request.lane, 'primary', index),
    fallback: resolveRouteRef(route.fallback, route.provider, request.lane, 'fallback', index),
  }))
  const refStops: RefusalEntry[] = []
  for (const entry of resolvedRoutes) {
    for (const ref of [entry.primary, entry.fallback]) {
      if ('refusal' in ref) refStops.push(ref.refusal)
    }
    // DA-1 (resolve-time mirror of the validator's static A5.3 rejection):
    // a self-referential pair — the resolved fallback IS the resolved primary —
    // refuses here too. Defense-in-depth over `validator.ts`
    // `checkLaneRoutes`' FALLBACK_SELF_REFERENCE; never approves.
    if ('id' in entry.primary && 'id' in entry.fallback && entry.primary.id === entry.fallback.id) {
      refStops.push({
        name: 'FALLBACK_SELF_REFERENCE',
        detail: `lane_routes (${request.lane}/${entry.route.provider}).fallback '${entry.fallback.id}' is the primary itself (A5.3) — refused at resolve time (DA-1 mirror)`,
      })
    }
  }

  const laneBindings = indexLaneBindings(resolvedRoutes, index)
  // RCM D8 effective predicates (legacy omission: text-only inputs; the
  // routing-class thinking default per OQ5) — computed once, applied uniformly
  // (single implementation: effectivePredicatesFor).
  const predicates = effectivePredicatesFor(request)
  // RCM D3/O2 expertise narrowing: filter within the already-eligible set,
  // preserve route/tier order, refuse rather than fall back. Shadow entries
  // never narrow (RCM-P9).
  const narrowing = expertiseNarrowing(policy, request, index)
  if (narrowing !== null && 'stop' in narrowing) {
    return stopReceipt(request, options, [narrowing.stop], { laneEntry, comparability })
  }
  const narrowedIds = narrowing !== null && 'ids' in narrowing ? narrowing.ids : null
  const evaluations: CandidateEvaluation[] = []
  const projectedById = new Map<string, number | null>()
  for (const indexed of laneBindings.values()) {
    const evaluation = evaluateCandidate(indexed, request, predicates)
    if (narrowedIds !== null && !narrowedIds.has(evaluation.binding_id)) {
      // Narrowed out — recorded on every candidate (D3: narrow, never reorder;
      // a narrowed-out binding is ineligible, never a lesser choice).
      evaluations.push({
        ...evaluation,
        refusals: [
          ...evaluation.refusals,
          {
            name: 'EXPERTISE_NARROWED_OUT',
            detail: `binding '${evaluation.binding_id}' is outside the (${request.routing_class}, ${String(request.expertise)}) expertise binding (D3: narrow only — never reorder or fall back)`,
          },
        ],
        rankable: false,
      })
    } else {
      evaluations.push(evaluation)
    }
    projectedById.set(indexed.binding.id, projectedCostUsd(indexed.binding, request))
  }
  const dataControls = policy.data_classification[request.data_class].transport_requirements
  const budgetBase = {
    ceiling_usd: ceiling,
    remaining_budget_usd: request.remaining_budget_usd,
    projected_cost_usd: null as number | null,
  }

  // Rubric §4: filters run first; the provider step follows and is never a
  // silent default. Unresolvable refs (review A F1) and out-of-vocabulary or
  // dishonest comparability envelopes (review A F2 / review B RB-4) stop here
  // too — nothing fabricated reaches a receipt.
  const gateStops = dedupeStops([
    ...refStops,
    ...comparabilityGate(resolvedRoutes, laneEntry, request.lane),
    ...providerRuleGate(laneEntry, request.lane),
  ])
  if (gateStops.length > 0) {
    return stopReceipt(request, options, gateStops, {
      laneEntry,
      evaluations,
      budget: budgetBase,
      dataControls,
      comparability,
    })
  }

  // Selection pool: rankable primary-role bindings (DERIVED — D3 pairing).
  const pool = evaluations.filter(
    (evaluation) => evaluation.role === 'primary' && evaluation.rankable,
  )
  const order = [...evaluations]
    .filter((evaluation) => evaluation.rankable)
    .sort((a, b) => {
      const costA = projectedById.get(a.binding_id) ?? Number.POSITIVE_INFINITY
      const costB = projectedById.get(b.binding_id) ?? Number.POSITIVE_INFINITY
      if (costA !== costB) return costA - costB
      if (a.role !== b.role) return a.role === 'primary' ? -1 : 1
      return a.binding_id < b.binding_id ? -1 : a.binding_id > b.binding_id ? 1 : 0
    })
    .map((evaluation) => evaluation.binding_id)

  if (pool.length === 0) {
    const seen = new Set<string>()
    const stops: RefusalEntry[] = []
    // RCM D3: when a non-shadow expertise binding exists and the eligible set
    // it narrows is empty, the binding is unsatisfiable — refused by name,
    // never silently replaced by the un-narrowed set.
    if (narrowedIds !== null) {
      seen.add('EXPERTISE_BINDING_UNSATISFIABLE')
      stops.push({
        name: 'EXPERTISE_BINDING_UNSATISFIABLE',
        detail: `the (${request.routing_class}, ${String(request.expertise)}) expertise binding narrows the eligible set to nothing (D3: unsatisfiable bindings refuse, never fall back)`,
      })
    }
    for (const evaluation of evaluations) {
      for (const refusal of evaluation.refusals) {
        if (seen.has(refusal.name)) continue
        seen.add(refusal.name)
        const affected = evaluations
          .filter((entry) => entry.refusals.some((r) => r.name === refusal.name))
          .map((entry) => entry.binding_id)
          .join(', ')
        stops.push({
          name: refusal.name,
          detail: `no rankable primary candidate for lane ${request.lane} — '${refusal.name}' fired (${affected})`,
        })
      }
      for (const hold of evaluation.holds) {
        if (seen.has(hold)) continue
        seen.add(hold)
        stops.push({
          name: hold,
          detail: `no rankable primary candidate for lane ${request.lane} — hold on ${evaluation.binding_id}`,
        })
      }
    }
    if (stops.length === 0) {
      stops.push({
        name: 'REPRESENTATION_INCOMPLETE_REFUSED',
        detail: `no rankable primary candidate for lane ${request.lane} and no per-candidate refusal/hold was recorded — fail closed`,
      })
    }
    return stopReceipt(request, options, stops, {
      laneEntry,
      evaluations,
      budget: budgetBase,
      dataControls,
      comparability,
      selection: {
        rule: laneEntry.provider_rule.kind,
        reason: 'no rankable primary candidate (rubric §3: unrankable is never ranked last)',
        order,
        chosen: null,
      },
    })
  }

  const chosenId =
    order.find((id) => pool.some((evaluation) => evaluation.binding_id === id)) ?? null
  const chosen = chosenId === null ? undefined : laneBindings.get(chosenId)
  const chosenEntry =
    chosenId === null
      ? undefined
      : resolvedRoutes.find((entry) => 'id' in entry.primary && entry.primary.id === chosenId)
  const chosenRoute = chosenEntry?.route
  if (chosen === undefined || chosenEntry === undefined || chosenRoute === undefined) {
    return stopReceipt(
      request,
      options,
      [
        {
          name: 'REPRESENTATION_INCOMPLETE_REFUSED',
          detail: `chosen binding '${String(chosenId)}' has no declared primary route`,
        },
      ],
      { laneEntry, evaluations, budget: budgetBase, dataControls, comparability },
    )
  }

  const contract = piModelContractFor(chosen.binding)
  if (contract === null) {
    return stopReceipt(
      request,
      options,
      [
        {
          name: 'UNSUPPORTED_MODEL_REFUSED',
          detail: `binding '${chosen.binding.id}' has no entry in the Pi OpenRouter execution-plane registry (pi-openrouter.ts)`,
        },
      ],
      { laneEntry, evaluations, budget: budgetBase, dataControls, comparability },
    )
  }

  // The declared fallback (A2/D4, review B RB-1): it passes the same
  // evaluation as a primary — denied, never downgraded — and it must resolve
  // to an evaluated, rankable, registry-backed binding (review A F1 / review B
  // RB-3). A raw ref never becomes a `model` value.
  const fallbackRef = chosenEntry.fallback
  if (!('id' in fallbackRef)) {
    return stopReceipt(request, options, [fallbackRef.refusal], {
      laneEntry,
      evaluations,
      budget: budgetBase,
      dataControls,
      comparability,
    })
  }
  const fallbackId = fallbackRef.id
  const fallbackIndexed = laneBindings.get(fallbackId)
  const fallbackEvaluation = evaluations.find((evaluation) => evaluation.binding_id === fallbackId)
  if (fallbackIndexed === undefined || fallbackEvaluation === undefined) {
    return stopReceipt(
      request,
      options,
      [
        {
          name: 'REPRESENTATION_INCOMPLETE_REFUSED',
          detail: `declared fallback '${fallbackId}' does not resolve to an evaluated binding — refused, never fabricated`,
        },
      ],
      { laneEntry, evaluations, budget: budgetBase, dataControls, comparability },
    )
  }
  if (!fallbackEvaluation.rankable) {
    const fallbackStops = dedupeStops(
      [
        ...fallbackEvaluation.refusals.map((refusal) => refusal.name),
        ...fallbackEvaluation.holds,
      ].map((name) => ({
        name,
        detail: `declared fallback '${fallbackId}' is denied as the failover target (A2: denied, never downgraded; D4 preflight) — '${name}'`,
      })),
    )
    return stopReceipt(request, options, fallbackStops, {
      laneEntry,
      evaluations,
      budget: budgetBase,
      dataControls,
      comparability,
    })
  }
  const fallbackContract = piModelContractFor(fallbackIndexed.binding)
  if (fallbackContract === null) {
    return stopReceipt(
      request,
      options,
      [
        {
          name: 'UNSUPPORTED_MODEL_REFUSED',
          detail: `declared fallback '${fallbackId}' has no entry in the Pi OpenRouter execution-plane registry (pi-openrouter.ts)`,
        },
      ],
      { laneEntry, evaluations, budget: budgetBase, dataControls, comparability },
    )
  }
  const declaredTiers =
    chosen.binding.data_classes.state === 'declared'
      ? chosen.binding.data_classes.value
      : [request.data_class]
  const transport = strictestTransport(policy, declaredTiers)
  const openrouterConstraints =
    chosen.binding.provider === 'openrouter'
      ? {
          provider: 'openrouter' as const,
          base_url: PI_OPENROUTER_ROUTING.baseUrl,
          allow_fallbacks: true as const,
          data_collection: transport.data_collection,
          zdr: transport.zdr,
          pi_model_contract: contract,
        }
      : null

  const route: ApprovedRoute = {
    provider: chosen.binding.provider,
    primary: { binding_id: chosen.binding.id, model: chosen.binding.model },
    fallback: {
      binding_id: fallbackId,
      model: fallbackIndexed.binding.model,
      suitability: chosenRoute.comparability,
    },
    pi_model_contract: contract,
    openrouter_constraints: openrouterConstraints,
  }

  const fallbackHandoff: FallbackHandoffPlan = {
    primary: chosen.binding.id,
    fallback: fallbackId,
    fallback_suitability: chosenRoute.comparability,
    on_primary_degraded: {
      action: 'route-to-declared-fallback',
      required_preflight: [
        'enabled',
        'available',
        'data-class-eligible',
        'tool/structured-output-compatible',
        'within-remaining-budget',
      ],
      rule: 'charter D4',
    },
    on_fallback_failure: { action: 'stop-and-report', rule: 'charter D8' },
    cross_provider: {
      action: 'new-recorded-attempt-from-durable-handoff',
      silent_continuation: 'never',
      rule: 'charter D3',
    },
  }

  return finalizeReceipt({
    request,
    options,
    laneEntry,
    evaluations,
    stops: [],
    selection: {
      rule: laneEntry.provider_rule.kind,
      reason: `deterministic ranking (rubric §4): ${laneEntry.provider_rule.kind} ordering over rankable primary candidates; ties by provider then model id (stable order)`,
      order,
      chosen: chosen.binding.id,
    },
    route,
    fallbackHandoff,
    budget: { ...budgetBase, projected_cost_usd: projectedById.get(chosen.binding.id) ?? null },
    dataControls,
    comparability,
  })
}

// ---------------------------------------------------------------------------
// Fallback handoff records (charter D3/D8, A2). A cross-provider failover is a
// new, recorded attempt started from a durable handoff — never a silent
// continuation of a coordinator, review, approval, merge, release, or security
// decision mid-turn.
// ---------------------------------------------------------------------------

export type HandoffEvent =
  | { readonly kind: 'primary-degraded'; readonly binding_id: string; readonly observed: string }
  | { readonly kind: 'fallback-failed'; readonly binding_id: string; readonly observed: string }
  | {
      readonly kind: 'cross-provider-attempt'
      readonly binding_id: string
      readonly observed: string
    }

/** One durable runtime transition record (charter D3/D8). */
export interface FallbackHandoffRecord {
  readonly kind: 'pi-fallback-handoff-record'
  readonly schema_version: 1
  readonly receipt_id: string
  readonly issued_at: string
  readonly event: HandoffEvent
  readonly action: 'route-to-declared-fallback' | 'stop-and-report' | 'new-recorded-attempt'
  readonly required_preflight: readonly string[]
  readonly continuation: 'refused-mid-turn' | 'not-applicable'
  readonly rule: string
}

/**
 * Builds the durable handoff record for one runtime transition. Throws
 * `TypeError` on an undeclared event kind, a non-approved receipt, or an
 * `event.binding_id` outside the receipt's declared primary/fallback pair (D8:
 * "routes only to its declared fallback"; review B RB-7): a malformed
 * transition fails the call and authorizes nothing (fail closed), rather than
 * emitting a wrong record.
 */
export function buildFallbackHandoff(
  receipt: RouteReceipt,
  event: HandoffEvent,
  options: ResolveOptions,
): FallbackHandoffRecord {
  if (receipt.status !== 'approved' || receipt.fallback_handoff === null) {
    throw new TypeError('fallback handoff records are built only from approved route receipts')
  }
  const plan = receipt.fallback_handoff
  const eventKind = event.kind
  const record = {
    kind: 'pi-fallback-handoff-record' as const,
    schema_version: 1 as const,
    receipt_id: receipt.receipt_id,
    issued_at: options.issued_at,
    event,
    required_preflight: [] as readonly string[],
    continuation: 'not-applicable' as const,
    rule: '',
    action: 'stop-and-report' as const,
  }
  switch (event.kind) {
    case 'primary-degraded':
      if (event.binding_id !== plan.primary) {
        throw new TypeError(
          `handoff event 'primary-degraded' names binding '${event.binding_id}', which is not the plan primary '${plan.primary}'`,
        )
      }
      return {
        ...record,
        action: 'route-to-declared-fallback',
        required_preflight: plan.on_primary_degraded.required_preflight,
        rule: plan.on_primary_degraded.rule,
      }
    case 'fallback-failed':
      if (event.binding_id !== plan.fallback) {
        throw new TypeError(
          `handoff event 'fallback-failed' names binding '${event.binding_id}', which is not the declared fallback '${plan.fallback}'`,
        )
      }
      return { ...record, action: 'stop-and-report', rule: plan.on_fallback_failure.rule }
    case 'cross-provider-attempt': {
      const declaredPrimary = receipt.evaluations.some(
        (evaluation) => evaluation.role === 'primary' && evaluation.binding_id === event.binding_id,
      )
      if (!declaredPrimary) {
        throw new TypeError(
          `handoff event 'cross-provider-attempt' names binding '${event.binding_id}', which is no declared route primary`,
        )
      }
      return {
        ...record,
        action: 'new-recorded-attempt',
        continuation: 'refused-mid-turn',
        rule: plan.cross_provider.rule,
      }
    }
    default:
      throw new TypeError(`undeclared handoff event kind '${String(eventKind)}'`)
  }
}

// ===========================================================================
// HRO-P4a (MRC-08) — D8's bounded recovery ladder, inside the resolver seam
// (charter `:88-95`; hro-p0-integration-contract.md:119 "inside the existing
// resolver"). Composition only — zero edits to every consumed seam:
//   - identity resolution runs through `piModelContractFor`'s exact matching
//     rule (registry key, or the mapping's explicitly declared `opencodeId`) —
//     identity is never inferred (charter `:48`: no prefix stripping, version
//     substitution, family fallback, normalization, or namespace aliasing);
//   - every eligibility verdict runs through the single existing evaluation
//     (`evaluateCandidate` → MRC-05's `evaluateRequirementPredicates`, fed by
//     `effectivePredicatesFor`) — never a second predicate implementation;
//   - receipts are emitted through the ordinary `finalizeReceipt` /
//     `stopReceipt` / `signReceipt` path with the additive `recovery` record
//     inside the signed content (C5.3: `receipt_id` remains the route body's
//     digest, so the handoff record's id stays consistent);
//   - the metadata refresh is injected and never approves, tiers, or entitles.
// Pure: no clock reads (`now` is injected), no I/O, no network.
// Episode machine (monotone — no backward edges, no cycles, terminal sticky):
//   step 1 → (2) → 1′ → (3) → (4).
// ===========================================================================

/** Parses an injected ISO-8601 timestamp to epoch ms; null when unparseable. */
function parseIsoMs(value: unknown): number | null {
  if (typeof value !== 'string') return null
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : null
}

interface FreshnessDetail {
  readonly verdict: FreshnessVerdict
  readonly age_ms: number | null
  readonly tolerance_ms: number | null
}

/**
 * C7.2's verdict matrix plus the record detail (C5.3's `freshness` class):
 * absent provenance is honest unknown (P1 §5 — never assumed current, never
 * rejected on its own); `now ≤ valid_until` is fresh; past validity with the
 * tolerance set is fresh within `now − valid_until ≤ tolerance` (the consumed
 * grace is visible as `age_ms`/`tolerance_ms`); past validity with the
 * tolerance UNSET is stale — the fail-closed default, zero policy grace;
 * unparseable timestamps are stale (fail-closed). A malformed tolerance never
 * repairs into grace — the comparison just fails closed.
 */
function freshnessDetailFor(
  provenance: DeclaredEvidence<PiOpenRouterProvenance> | null | undefined,
  now: string,
  tolerance: ProvenanceFreshnessTolerance | undefined,
): FreshnessDetail {
  // Rework F-04: the same validity predicate as `createRecoveryContext` — a
  // malformed tolerance (non-finite, negative, fractional) is consumed as
  // UNSET at the verdict seam: zero grace, fail-closed to stale. No value is
  // ever repaired into grace (Infinity can never buy eternal freshness).
  const toleranceMs =
    typeof tolerance === 'number' && Number.isInteger(tolerance) && tolerance >= 0
      ? tolerance
      : null
  if (provenance === null || provenance === undefined) {
    return { verdict: 'unknown', age_ms: null, tolerance_ms: toleranceMs }
  }
  const validUntilMs = parseIsoMs(provenance.value.valid_until)
  const nowMs = parseIsoMs(now)
  if (validUntilMs === null || nowMs === null) {
    return { verdict: 'stale', age_ms: null, tolerance_ms: toleranceMs }
  }
  const ageMs = nowMs - validUntilMs
  if (ageMs <= 0) return { verdict: 'fresh', age_ms: ageMs, tolerance_ms: toleranceMs }
  if (toleranceMs !== null && ageMs <= toleranceMs) {
    return { verdict: 'fresh', age_ms: ageMs, tolerance_ms: toleranceMs }
  }
  return { verdict: 'stale', age_ms: ageMs, tolerance_ms: toleranceMs }
}

/**
 * C7.2: the provenance-freshness verdict — the enforcement seam that consumes
 * the typed tolerance input only. No tolerance value or default exists in
 * code; UNSET is the fail-closed default (stale past `valid_until`).
 */
export function provenanceFreshnessVerdict(
  provenance: DeclaredEvidence<PiOpenRouterProvenance> | null | undefined,
  now: string,
  tolerance?: ProvenanceFreshnessTolerance,
): FreshnessVerdict {
  return freshnessDetailFor(provenance, now, tolerance).verdict
}

/**
 * C1.2: creates the batch-lifetime recovery context (the bounded mutable
 * state). Fails closed with `TypeError` on malformed call shapes (C1.4) — a
 * malformed tolerance is never repaired into a value.
 */
export function createRecoveryContext(config: RecoveryConfig): RecoveryContext {
  if (config === null || typeof config !== 'object') {
    throw new TypeError('recovery config must be an object (fail-closed call shape, C1.4)')
  }
  const raw = config as unknown as Record<string, unknown>
  if (typeof raw.now !== 'function') {
    throw new TypeError("recovery config must carry the injected 'now' clock (C1.2)")
  }
  const tolerance = raw.provenance_freshness_tolerance
  if (
    tolerance !== undefined &&
    !(typeof tolerance === 'number' && Number.isInteger(tolerance) && tolerance >= 0)
  ) {
    throw new TypeError(
      'provenance_freshness_tolerance must be a non-negative finite integer (C7.1) — a malformed value is never repaired into grace',
    )
  }
  return {
    config,
    state: {
      negative_cache: new Map(),
      refresh_memo: new Map(),
      cooldowns: new Map(),
      episode_ordinal: 0,
    },
  }
}

/** C1.3: all four bounds must be finite positive integers — no defaults invented. */
function boundsAreValid(bounds: RecoveryBounds | undefined): boolean {
  if (bounds === null || typeof bounds !== 'object') return false
  const raw = bounds as unknown as Record<string, unknown>
  return (
    [
      'episode_deadline_ms',
      'max_fallback_attempts',
      'negative_cache_ttl_ms',
      'provider_cooldown_ms',
    ] as const
  ).every(
    (key) => typeof raw[key] === 'number' && Number.isInteger(raw[key]) && (raw[key] as number) > 0,
  )
}

/**
 * C3.3: the catalog/mapping content identity (e.g. the provenance
 * `content_hash`, `pi-openrouter.ts:65-66`) — the one digest formula over the
 * mapping's declared evidence content. Any change to that content re-arms the
 * version-scoped cache entries immediately; nothing is invented.
 */
function evidenceVersionFor(
  registryKey: string | null,
  mapping: ModelBinding | null,
  provenance: DeclaredEvidence<PiOpenRouterProvenance> | null,
): string {
  return documentDigest({ registry_key: registryKey, mapping, provenance })
}

/**
 * RCM D3's narrowed-out marking (rework F-01) — the exact marking
 * `resolveRoute` applies: the named refusal appended and the candidate made
 * unrankable. One rule, applied to walk targets and declared pairs alike.
 */
function markExpertiseNarrowing(
  evaluation: CandidateEvaluation,
  ids: ReadonlySet<string>,
  request: Pick<RouteRequest, 'routing_class' | 'expertise'>,
): CandidateEvaluation {
  if (ids.has(evaluation.binding_id)) return evaluation
  return {
    ...evaluation,
    refusals: [
      ...evaluation.refusals,
      {
        name: 'EXPERTISE_NARROWED_OUT',
        detail: `binding '${evaluation.binding_id}' is outside the (${request.routing_class}, ${String(request.expertise)}) expertise binding (D3: narrow only — never reorder or fall back)`,
      },
    ],
    rankable: false,
  }
}

/**
 * C5.1: the typed `route_unavailable` terminal (MRC-06 (f) field set) with the
 * per-parcel hold — returned, never thrown, so independent parcels continue.
 */
function routeUnavailableOutcome(
  episode: RecoveryEpisodeInput,
  attempts: readonly AttemptRecord[],
  refusals: readonly RefusalEntry[],
  reason: string,
): RouteUnavailableOutcome {
  return {
    code: 'ROUTE_UNAVAILABLE',
    parcelRef: episode.parcelRef,
    requested: { lane: episode.requested.lane, registry_key: episode.requested.registry_key },
    attempted: attempts.map((entry) => ({ identity: entry.identity, refusals: entry.refusals })),
    refusals: [...refusals],
    reason,
    hold: 'parcel-held',
  }
}

/**
 * D8's bounded recovery ladder (MRC-08 HRO-P4a) around the ordinary resolver
 * seam. Returns the typed resolution for every routing state; malformed call
 * shapes fail closed with `TypeError` and authorize nothing (C1.4).
 */
export function resolveRouteWithRecovery(
  policy: RoutingPolicy,
  request: RouteRequest,
  options: ResolveOptions,
  episode: RecoveryEpisodeInput,
  context: RecoveryContext,
): RecoveryResolution {
  // ---- call-shape validation (fail-closed TypeError, C1.4) ----------------
  if (
    context === null ||
    typeof context !== 'object' ||
    context.config === null ||
    typeof context.config !== 'object' ||
    typeof context.config.now !== 'function' ||
    context.state === null ||
    typeof context.state !== 'object'
  ) {
    throw new TypeError(
      'resolveRouteWithRecovery requires a context created by createRecoveryContext (fail-closed call shape, C1.4)',
    )
  }
  if (episode === null || typeof episode !== 'object' || Array.isArray(episode)) {
    throw new TypeError('recovery episode input must be an object (fail-closed call shape, C1.4)')
  }
  const epRaw = episode as unknown as Record<string, unknown>
  const requestedRaw = epRaw.requested as Record<string, unknown> | null | undefined
  const requestLane: unknown =
    request !== null && typeof request === 'object' && 'lane' in request ? request.lane : undefined
  if (
    typeof epRaw.parcelRef !== 'string' ||
    requestedRaw === null ||
    typeof requestedRaw !== 'object' ||
    !LANE_IDS.includes(requestedRaw.lane as LaneId) ||
    !(requestedRaw.registry_key === null || typeof requestedRaw.registry_key === 'string') ||
    !Array.isArray(epRaw.prior_attempts)
  ) {
    throw new TypeError(
      'malformed recovery episode input (fail-closed call shape, C1.4): parcelRef / requested / prior_attempts',
    )
  }
  if (requestLane !== undefined && requestLane !== requestedRaw.lane) {
    throw new TypeError(
      'episode.requested.lane must match the request lane (fail-closed call shape, C1.4)',
    )
  }
  for (const entry of epRaw.prior_attempts as readonly unknown[]) {
    const prior = entry as Record<string, unknown> | null
    const charge = prior === null || typeof prior !== 'object' ? undefined : prior.charge_status
    if (
      prior === null ||
      typeof prior !== 'object' ||
      typeof prior.attempt_ref !== 'string' ||
      typeof prior.provider !== 'string' ||
      typeof prior.failure_class !== 'string' ||
      (charge !== 'no-charge' && charge !== 'reconciled' && charge !== 'uncertain')
    ) {
      throw new TypeError('malformed prior attempt entry (fail-closed call shape, C1.4)')
    }
  }

  const config = context.config
  const state = context.state
  const nowOrThrow = (): number => {
    const parsed = parseIsoMs(config.now())
    if (parsed === null) {
      throw new TypeError(
        "the injected 'now' clock must return parseable ISO-8601 (fail-closed call shape, C1.4)",
      )
    }
    return parsed
  }
  const startedAtMs = nowOrThrow()

  // A fresh call is a fresh episode id (C1.6): the digest covers the requested
  // identity and prior attempt refs plus the context's monotone ordinal, so
  // identical inputs still mint distinct episodes while sharing context state.
  state.episode_ordinal += 1
  const episodeId = documentDigest({
    requested: episode.requested,
    prior_attempt_refs: episode.prior_attempts.map((entry) => entry.attempt_ref),
    ordinal: state.episode_ordinal,
  })

  const attempts: AttemptRecord[] = []
  const evaluations: CandidateEvaluation[] = []
  const requestedKey = episode.requested.registry_key
  let requestedProvenance: DeclaredEvidence<PiOpenRouterProvenance> | null = null
  let refreshedProvenance: DeclaredEvidence<PiOpenRouterProvenance> | null = null
  let refreshedEntries: Readonly<Record<string, { readonly available: boolean }>> | null = null
  let refreshRecord: RefreshProvenance = {
    result: 'not-permitted',
    coalesced: false,
    requested_key: requestedKey,
    evidence_version: null,
    provenance: null,
    discovered: [],
    reason: 'the episode ended before the refresh step was reached (C3.1)',
  }
  let chosenFallback: RecoveryEpisodeRecord['chosen_fallback'] = null

  // Lane/request pieces carried into the emitted receipts (mirrors the
  // ordinary `resolveRoute` receipt assembly).
  let laneEntry: LaneEntry | null = null
  let laneComparability: readonly Evidence<string>[] = []
  let ceiling = 0
  let dataControls: TransportRequirements | null = null

  const episodeLabel = requestedKey ?? `the ${String(episode.requested.lane)} lane request`

  // C5.3: the recovery record rides the signed content (`signReceipt`/
  // `verifyReceiptSignature` cover it); `receipt_id` stays the route body's
  // digest so the handoff record's id remains consistent and a recovery-absent
  // receipt is byte-identical (`canonicalJson` drops absent fields).
  const finishTerminal = (
    terminalRefusals: readonly RefusalEntry[],
    reason: string,
  ): RecoveryResolution => {
    const refusals = dedupeStops(terminalRefusals)
    const outcome = routeUnavailableOutcome(episode, attempts, refusals, reason)
    const record: RecoveryEpisodeRecord = {
      kind: 'recovery-episode-record',
      schema_version: 1,
      episode_id: episodeId,
      attempted: attempts,
      refresh: refreshRecord,
      chosen_fallback: chosenFallback,
      freshness: freshnessDetailFor(
        requestedProvenance,
        config.now(),
        config.provenance_freshness_tolerance,
      ),
      terminal: outcome,
    }
    const receipt = signReceipt({
      ...stopReceipt(request, options, refusals, {
        laneEntry,
        evaluations,
        budget:
          laneEntry === null
            ? null
            : {
                ceiling_usd: ceiling,
                remaining_budget_usd: request.remaining_budget_usd,
                projected_cost_usd: null,
              },
        dataControls,
        comparability: laneComparability,
      }),
      recovery: record,
    })
    return { status: 'route-unavailable', receipt, outcome, episode: record }
  }

  const finishApproved = (baseReceipt: RouteReceipt): RecoveryResolution => {
    const record: RecoveryEpisodeRecord = {
      kind: 'recovery-episode-record',
      schema_version: 1,
      episode_id: episodeId,
      attempted: attempts,
      refresh: refreshRecord,
      chosen_fallback: chosenFallback,
      freshness: freshnessDetailFor(
        requestedProvenance,
        config.now(),
        config.provenance_freshness_tolerance,
      ),
      terminal: null,
    }
    return {
      status: 'approved',
      receipt: signReceipt({ ...baseReceipt, recovery: record }),
      episode: record,
    }
  }

  // ---- C1.3: bounds gate (fail-closed; steps 2–3 never run) ---------------
  if (!boundsAreValid(config.bounds)) {
    return finishTerminal(
      [
        {
          name: 'RECOVERY_BOUNDS_UNCONFIGURED',
          detail:
            'recovery bounds are missing, non-finite, or non-positive (episode_deadline_ms, max_fallback_attempts, negative_cache_ttl_ms, provider_cooldown_ms); the ladder never runs steps 2–3 and no default is invented (C1.3)',
        },
      ],
      'recovery bounds are unconfigured; configure RecoveryBounds before dispatch (no default value exists in code)',
    )
  }
  const bounds = config.bounds

  // ---- C6.4: reconcile before redispatch (uncertain charge) ---------------
  const uncertain = episode.prior_attempts.find((entry) => entry.charge_status === 'uncertain')
  if (uncertain !== undefined) {
    return finishTerminal(
      [
        {
          name: 'RECONCILIATION_REQUIRED',
          detail: `prior attempt '${uncertain.attempt_ref}' carries an uncertain execution/charge status; the ladder performs no redispatch until the settlement seam reconciles it (charter :95)`,
        },
      ],
      `prior attempt '${uncertain.attempt_ref}' has uncertain execution/charge status; reconcile the charge before redispatch`,
    )
  }

  // ---- request-level gate (mirrors `resolveRoute`'s entry; a broken request
  // authorizes nothing and there is no target to revalidate) ---------------
  const requestGateStops: RefusalEntry[] = []
  if (policy === null || typeof policy !== 'object') {
    requestGateStops.push({
      name: 'REPRESENTATION_INCOMPLETE_REFUSED',
      detail: 'policy is not an object',
    })
  } else if (request === null || typeof request !== 'object' || Array.isArray(request)) {
    requestGateStops.push({ name: 'ROLE_LANE_MAP_VIOLATION', detail: 'request is not an object' })
  } else if (
    policy.lane_map === undefined ||
    policy.candidates === undefined ||
    !Array.isArray(policy.lane_routes)
  ) {
    requestGateStops.push({
      name: 'REPRESENTATION_INCOMPLETE_REFUSED',
      detail: 'policy is missing the new representation blocks (lane_map, candidates, lane_routes)',
    })
  } else {
    requestGateStops.push(...structuralStopsFor(request, policy))
    const classes: Readonly<Record<string, { readonly ceiling_usd: number } | undefined>> =
      policy.classes
    const rawCeiling = classes[request.routing_class]?.ceiling_usd
    if (!isFiniteNumber(rawCeiling) || rawCeiling <= 0) {
      requestGateStops.push({
        name: 'COST_UNKNOWN',
        detail: `no ratified classes['${request.routing_class}'].ceiling_usd exists anywhere; R5 fail-closes until an owner value lands (pmc-p1 record §4)`,
      })
    } else {
      ceiling = rawCeiling
    }
  }
  if (requestGateStops.length > 0) {
    return finishTerminal(
      requestGateStops,
      `the request-level gate refused the episode before any target was evaluated; fix the request or policy and retry (${episodeLabel})`,
    )
  }

  const laneId = request.lane
  const laneEntryFound = policy.lane_map?.[laneId]
  if (laneEntryFound === undefined) {
    return finishTerminal(
      [
        {
          name: 'ROLE_LANE_MAP_VIOLATION',
          detail: `request.lane '${String(laneId)}' is not a lane of the frozen role/lane map`,
        },
      ],
      `lane '${String(laneId)}' has no lane_map entry; no declared route exists to walk`,
    )
  }
  laneEntry = laneEntryFound
  // Rework F-02: the lane-disabled gate (mirrors `resolveRoute`) — a
  // validator-clean disabled lane never authorizes a session through the
  // recovery seam. Typed terminal BEFORE any target evaluation; the reason
  // names the disabled lane as the cause (D8 step 4's actionable reason).
  if (
    laneEntryFound.status === 'disabled-refused' ||
    laneEntryFound.provider_rule.kind === 'none'
  ) {
    return finishTerminal(
      [
        {
          name: 'LANE_DISABLED_REFUSED',
          detail: `lane ${String(laneId)} is refused/disabled (M2); nothing else is evaluated`,
        },
      ],
      `lane '${String(laneId)}' is refused/disabled (M2); no route is authorized for this request — the cause is the disabled lane`,
    )
  }
  dataControls = policy.data_classification[request.data_class].transport_requirements
  const laneRoutes = (policy.lane_routes ?? []).filter((route) => route.lane === laneId)
  // Sweep G9 (mirrors `resolveRoute`'s request-level cause): a lane with no
  // declared route entry refuses here, never degrading to a walk of nothing.
  if (laneRoutes.length === 0) {
    return finishTerminal(
      [
        {
          name: 'REPRESENTATION_INCOMPLETE_REFUSED',
          detail: `no lane_routes entry declares lane ${String(laneId)}`,
        },
      ],
      `no lane_routes entry declares lane '${String(laneId)}'; no declared route exists to walk`,
    )
  }
  laneComparability = laneRoutes.map((route) => route.comparability)

  // Declared-lane walk set (C4.1): every lane entry's declared `primary` then
  // `fallback` route refs, in declaration order, resolved exactly as the
  // validator resolves them — a raw ref is never a model value.
  const index = indexCandidates(policy.candidates ?? {})
  const resolvedRoutes: ResolvedRoute[] = laneRoutes.map((route) => ({
    route,
    primary: resolveRouteRef(route.primary, route.provider, laneId, 'primary', index),
    fallback: resolveRouteRef(route.fallback, route.provider, laneId, 'fallback', index),
  }))

  // F2: `effectivePredicatesFor` feeds `evaluateRequirementPredicates` through
  // `evaluateCandidate` — the ONE evaluation (MRC-05's extraction), never a
  // second predicate implementation.
  const predicates = effectivePredicatesFor(request)
  // RCM D3 (rework F-01): the single expertise-narrowing decision core —
  // `expertiseNarrowingFor` wraps exactly this call; `resolveRoute` calls it
  // the same way. Computed once per episode, consulted at every revalidation.
  const narrowing = expertiseNarrowing(policy, request, index)

  const catalogProvenanceFor = (
    registryKey: string | null,
  ): DeclaredEvidence<PiOpenRouterProvenance> | null => {
    if (registryKey === null) return null
    const entry = Object.hasOwn(PI_OPENROUTER_ROUTING.models, registryKey)
      ? PI_OPENROUTER_ROUTING.models[registryKey]
      : undefined
    return entry?.provenance ?? null
  }
  // C3.4: the refreshed document's provenance supersedes for the episode's
  // re-evaluations once one arrives — a refreshed document that is itself
  // `stale` stays `stale`, fail-closed; before any refresh each target keeps
  // its own catalog evidence (absent = honest unknown).
  const effectiveProvenanceFor = (
    registryKey: string | null,
  ): DeclaredEvidence<PiOpenRouterProvenance> | null => {
    if (refreshedProvenance !== null) return refreshedProvenance
    return catalogProvenanceFor(registryKey)
  }
  const availabilityFactFor = (registryKey: string | null): boolean | null => {
    if (refreshedEntries === null || registryKey === null) return null
    const fact = Object.hasOwn(refreshedEntries, registryKey)
      ? refreshedEntries[registryKey]
      : undefined
    return fact === undefined ? null : fact.available
  }

  /**
   * The full D1 re-check for one target (C2.2/C4.3): the mapping seam (exact
   * identity, explicit values), the C7 freshness gate, the single candidate
   * evaluation (role/lane facts, data class, capabilities, context, thinking,
   * privacy transport, budget, independence), and the declared fallback pair —
   * denied, never downgraded (A2/D4).
   */
  const revalidate = (
    indexed: IndexedBinding,
    pair: IndexedBinding | null,
    pairRefusal: RefusalEntry | null,
  ): {
    readonly refusals: RefusalEntry[]
    readonly evaluation: CandidateEvaluation
    readonly pairEvaluation: CandidateEvaluation | null
  } => {
    const refusals: RefusalEntry[] = []
    const binding = indexed.binding
    const contract = piModelContractFor(binding)
    const registryKey = contract?.registry_key ?? null
    if (contract === null) {
      refusals.push({
        name: 'MAPPING_MISSING_REFUSED',
        detail: `no declared mapping for binding '${binding.id}'; identity is never inferred (no prefix stripping, version substitution, or family fallback)`,
      })
    } else if (contract.protocol === null || contract.provider_local_id === null) {
      refusals.push({
        name: 'MAPPING_INCOMPLETE_REFUSED',
        detail: `mapping for '${contract.registry_key}' lacks explicit values; a value is never derived from the registry key or the host id`,
      })
    }
    const provenance = effectiveProvenanceFor(registryKey)
    const detail = freshnessDetailFor(
      provenance,
      config.now(),
      config.provenance_freshness_tolerance,
    )
    if (detail.verdict === 'stale') {
      refusals.push({
        name: 'FRESHNESS_STALE_REFUSED',
        detail: `catalog evidence for '${registryKey ?? binding.id}' is past its declared validity (freshness tolerance ${String(detail.tolerance_ms ?? 'unset')}); stale evidence is rejected, never assumed current`,
      })
    }
    const availability = availabilityFactFor(registryKey)
    if (availability === false) {
      refusals.push({
        name: 'RECOVERY_AVAILABILITY_REFUSED',
        detail: `the refreshed catalog attests '${registryKey ?? binding.id}' unavailable (C3.4: discovery is evidence, never an approval)`,
      })
    }
    // C3.4's two consumed things: the refreshed availability fact supplies the
    // R6 attestation for an exact approved mapping from the document's named
    // source — it re-evaluates an existing mapping and never approves a new
    // one; a declared policy attestation is never downgraded by the refresh.
    const effectiveBinding: ModelBinding =
      availability === true && binding.availability.state !== 'declared'
        ? {
            ...binding,
            availability: {
              state: 'declared' as const,
              value: 'live-availability' as const,
              source: `refreshed catalog document${refreshedProvenance === null ? '' : ` (${refreshedProvenance.source})`}`,
            },
          }
        : binding
    let evaluation = evaluateCandidate(
      { ...indexed, binding: effectiveBinding },
      request,
      predicates,
    )
    // RCM D3 (rework F-01): the single expertise-narrowing decision core (the
    // one `expertiseNarrowingFor` wraps) — never a silent fail-over past the
    // declared binding. The marking mirrors `resolveRoute`'s narrowed-out
    // marking exactly.
    if (narrowing !== null) {
      if ('stop' in narrowing) {
        refusals.push(narrowing.stop)
      } else {
        evaluation = markExpertiseNarrowing(evaluation, narrowing.ids, request)
      }
    }
    refusals.push(...evaluation.refusals)
    for (const hold of evaluation.holds) {
      refusals.push({ name: hold, detail: `binding '${binding.id}' is held (${hold})` })
    }
    // C2.2: the lane's provider partition gate rides every eligibility verdict
    // (rework F-03: so does the comparability honesty gate — suitability is
    // never asserted over unproven inputs).
    if (laneEntry !== null) {
      refusals.push(...providerRuleGate(laneEntry, laneId))
      refusals.push(...comparabilityGate(resolvedRoutes, laneEntry, laneId))
    }
    let pairEvaluation: CandidateEvaluation | null = null
    if (pairRefusal !== null) {
      refusals.push(pairRefusal)
    } else if (pair !== null) {
      if (pair.binding.id === binding.id) {
        refusals.push({
          name: 'FALLBACK_SELF_REFERENCE',
          detail: `the declared pair of '${binding.id}' resolves to itself (A5.3) — refused, never fabricated`,
        })
      } else {
        pairEvaluation = evaluateCandidate({ ...pair, role: 'fallback' }, request, predicates)
        // The pair faces the same narrowing (a declared fallback outside the
        // expertise binding refuses the route — never a silent fail-over).
        if (narrowing !== null && !('stop' in narrowing)) {
          pairEvaluation = markExpertiseNarrowing(pairEvaluation, narrowing.ids, request)
        }
        if (!pairEvaluation.rankable) {
          for (const name of [
            ...pairEvaluation.refusals.map((refusal) => refusal.name),
            ...pairEvaluation.holds,
          ]) {
            refusals.push({
              name,
              detail: `declared fallback '${pair.binding.id}' is denied as the failover target (A2: denied, never downgraded; D4 preflight) — '${name}'`,
            })
          }
        } else if (piModelContractFor(pair.binding) === null) {
          refusals.push({
            name: 'UNSUPPORTED_MODEL_REFUSED',
            detail: `declared fallback '${pair.binding.id}' has no entry in the Pi OpenRouter execution-plane registry (pi-openrouter.ts)`,
          })
        }
      }
    }
    return { refusals: dedupeStops(refusals), evaluation, pairEvaluation }
  }

  interface TargetRefs {
    readonly slotRole: 'primary' | 'fallback'
    readonly entry: ResolvedRoute
    readonly resolved: ResolvedRef
    readonly label: string
  }
  const targetRefs: TargetRefs[] = resolvedRoutes.flatMap((entry) =>
    (['primary', 'fallback'] as const).map((slotRole) => ({
      slotRole,
      entry,
      resolved: slotRole === 'primary' ? entry.primary : entry.fallback,
      label: `lane_routes (${laneId}/${entry.route.provider}).${slotRole}`,
    })),
  )
  const pairFor = (
    entry: ResolvedRoute,
    slotRole: 'primary' | 'fallback',
  ): { pair: IndexedBinding | null; pairRefusal: RefusalEntry | null } => {
    const other = slotRole === 'primary' ? entry.fallback : entry.primary
    if (!('id' in other)) return { pair: null, pairRefusal: other.refusal }
    const found = index.byId.get(other.id)
    return found === undefined
      ? {
          pair: null,
          pairRefusal: {
            name: 'REPRESENTATION_INCOMPLETE_REFUSED',
            detail: `declared pair '${other.id}' does not resolve to an evaluated binding — refused, never fabricated`,
          },
        }
      : {
          pair: { binding: found.binding, candidateKey: found.candidateKey, role: 'fallback' },
          pairRefusal: null,
        }
  }

  /**
   * Emits the ordinary approved receipt for a chosen target with its own
   * declared fallback pair (C2.4/C4.5) — the declared-pair rule of
   * `buildFallbackHandoff` preserved. The chosen target is evaluated as a
   * primary; every attempted candidate's evaluation rides the receipt (A3).
   */
  const emitApproved = (
    winner: IndexedBinding,
    winnerEvaluation: CandidateEvaluation,
    pair: IndexedBinding | null,
    pairEvaluation: CandidateEvaluation | null,
    entryComparability: Evidence<string>,
    selectionReason: string,
  ): RouteReceipt | { readonly refusals: RefusalEntry[] } => {
    const winnerBinding = winner.binding
    const contract = piModelContractFor(winnerBinding)
    if (contract === null || pair === null || pairEvaluation === null) {
      return {
        refusals: [
          {
            name: 'REPRESENTATION_INCOMPLETE_REFUSED',
            detail: `chosen target '${winnerBinding.id}' or its declared fallback pair is not fully resolved — refused, never fabricated`,
          },
        ],
      }
    }
    const pairContract = piModelContractFor(pair.binding)
    if (pairContract === null) {
      return {
        refusals: [
          {
            name: 'UNSUPPORTED_MODEL_REFUSED',
            detail: `declared fallback '${pair.binding.id}' has no entry in the Pi OpenRouter execution-plane registry (pi-openrouter.ts)`,
          },
        ],
      }
    }
    const declaredTiers =
      winnerBinding.data_classes.state === 'declared'
        ? winnerBinding.data_classes.value
        : [request.data_class]
    const transport = strictestTransport(policy, declaredTiers)
    const openrouterConstraints: OpenRouterProviderConstraints | null =
      winnerBinding.provider === 'openrouter'
        ? {
            provider: 'openrouter' as const,
            base_url: PI_OPENROUTER_ROUTING.baseUrl,
            allow_fallbacks: true as const,
            data_collection: transport.data_collection,
            zdr: transport.zdr,
            pi_model_contract: contract,
          }
        : null
    const route: ApprovedRoute = {
      provider: winnerBinding.provider,
      primary: { binding_id: winnerBinding.id, model: winnerBinding.model },
      fallback: {
        binding_id: pair.binding.id,
        model: pair.binding.model,
        suitability: entryComparability,
      },
      pi_model_contract: contract,
      openrouter_constraints: openrouterConstraints,
    }
    const fallbackHandoff: FallbackHandoffPlan = {
      primary: winnerBinding.id,
      fallback: pair.binding.id,
      fallback_suitability: entryComparability,
      on_primary_degraded: {
        action: 'route-to-declared-fallback',
        required_preflight: [
          'enabled',
          'available',
          'data-class-eligible',
          'tool/structured-output-compatible',
          'within-remaining-budget',
        ],
        rule: 'charter D4',
      },
      on_fallback_failure: { action: 'stop-and-report', rule: 'charter D8' },
      cross_provider: {
        action: 'new-recorded-attempt-from-durable-handoff',
        silent_continuation: 'never',
        rule: 'charter D3',
      },
    }
    return finalizeReceipt({
      request,
      options,
      laneEntry,
      evaluations: [
        ...evaluations.filter(
          (entry) => entry.binding_id !== winnerBinding.id && entry.binding_id !== pair.binding.id,
        ),
        { ...winnerEvaluation, role: 'primary' as const },
        { ...pairEvaluation, role: 'fallback' as const },
      ],
      stops: [],
      selection: {
        rule: laneEntry === null ? 'cheapest-eligible' : laneEntry.provider_rule.kind,
        reason: selectionReason,
        order: [
          ...evaluations.map((entry) => entry.binding_id),
          winnerBinding.id,
          pair.binding.id,
        ].filter((id, position, all) => all.indexOf(id) === position),
        chosen: winnerBinding.id,
      },
      route,
      fallbackHandoff,
      budget: {
        ceiling_usd: ceiling,
        remaining_budget_usd: request.remaining_budget_usd,
        projected_cost_usd: projectedCostUsd(winnerBinding, request),
      },
      dataControls,
      comparability: laneComparability,
    })
  }

  // Requested-target slots, filled by step 1 and consumed by steps 1′/3.
  const visited = new Set<string>()
  let requestedIndexed: IndexedBinding | null = null
  let requestedTarget: TargetRefs | null = null

  const approvedMappingKeys = new Set<string>()
  for (const entry of resolvedRoutes) {
    for (const ref of [entry.primary, entry.fallback]) {
      if (!('id' in ref)) continue
      const found = index.byId.get(ref.id)
      if (found === undefined) continue
      const contract = piModelContractFor(found.binding)
      if (contract !== null) approvedMappingKeys.add(contract.registry_key)
    }
  }

  // ================== step 2: one coalesced metadata refresh ===============
  function refreshPhase(stepRefusals: readonly RefusalEntry[]): RecoveryResolution {
    const windowKey = requestedKey ?? `lane:${String(request.lane)}`
    const mapping = requestedIndexed === null ? null : requestedIndexed.binding
    const registryKey =
      requestedIndexed === null
        ? null
        : (piModelContractFor(requestedIndexed.binding)?.registry_key ?? null)
    const evidenceVersion = evidenceVersionFor(registryKey, mapping, requestedProvenance)
    const nowMs = nowOrThrow()
    // TTL-bounded state (C3.3/C6.5): expired entries drop lazily, so every map
    // stays bounded by live windows.
    for (const [key, entry] of state.negative_cache) {
      if (entry.expires_at_ms <= nowMs) state.negative_cache.delete(key)
    }
    for (const [key, entry] of state.refresh_memo) {
      if (entry.expires_at_ms <= nowMs) state.refresh_memo.delete(key)
    }

    // (1) Coalesced-refresh memo (C3.2): concurrent or repeated misses attach
    // to the recorded result instead of invoking the seam again.
    const memoEntry = state.refresh_memo.get(windowKey)
    if (
      memoEntry !== undefined &&
      memoEntry.evidence_version === evidenceVersion &&
      memoEntry.expires_at_ms > nowMs
    ) {
      refreshRecord = { ...memoEntry.record, coalesced: true }
      if (memoEntry.record.result === 'refreshed' && memoEntry.record.provenance !== null) {
        refreshedProvenance = memoEntry.record.provenance
        refreshedEntries = memoEntry.entries
        return stepOnePrime(stepRefusals)
      }
      return walkPhase(stepRefusals)
    }

    // (2) Version-scoped negative cache (C3.3): a repeated miss inside the TTL
    // is served from the cache — no seam call. The walk and its dynamic
    // revalidation always run (the cache gates the refresh trigger only).
    const negativeEntry = state.negative_cache.get(windowKey)
    if (
      negativeEntry !== undefined &&
      negativeEntry.evidence_version === evidenceVersion &&
      negativeEntry.expires_at_ms > nowMs
    ) {
      refreshRecord = {
        result: 'negative-cached',
        coalesced: false,
        requested_key: requestedKey,
        evidence_version: evidenceVersion,
        provenance: null,
        discovered: [],
        reason:
          'a repeated miss inside negative_cache_ttl_ms is served from the negative cache (C3.3); the walk and its dynamic revalidation still run',
      }
      return walkPhase(stepRefusals)
    }

    // (3) No seam (C3.1): recorded 'not-permitted'; the miss is memoized.
    if (config.refresh === undefined) {
      refreshRecord = {
        result: 'not-permitted',
        coalesced: false,
        requested_key: requestedKey,
        evidence_version: evidenceVersion,
        provenance: null,
        discovered: [],
        reason:
          'no MetadataRefreshFn seam is configured; the ladder records the miss and walks (C3.1)',
      }
      state.negative_cache.set(windowKey, {
        evidence_version: evidenceVersion,
        expires_at_ms: nowMs + bounds.negative_cache_ttl_ms,
      })
      return walkPhase(stepRefusals)
    }

    // (4) The single invocation (C3.1: at most one per episode; C3.2: at most
    // one per key/version window — check-and-invoke is atomic within the
    // single-threaded evaluator).
    const result = config.refresh({
      requested_key: requestedKey,
      evidence_version: evidenceVersion,
    })
    const returnedAtMs = nowOrThrow()
    if (returnedAtMs - startedAtMs > bounds.episode_deadline_ms) {
      // C3.1: an overrunning refresh is discarded, recorded, never used.
      refreshRecord = {
        result: 'deadline-exceeded',
        coalesced: false,
        requested_key: requestedKey,
        evidence_version: evidenceVersion,
        provenance: null,
        discovered: [],
        reason:
          'the refresh returned after episode_deadline_ms; its result is discarded and never used (C3.1)',
      }
      state.negative_cache.set(windowKey, {
        evidence_version: evidenceVersion,
        expires_at_ms: returnedAtMs + bounds.negative_cache_ttl_ms,
      })
      return finishTerminal(
        [
          ...stepRefusals,
          {
            name: 'RECOVERY_DEADLINE_EXCEEDED',
            detail: `the metadata refresh returned after episode_deadline_ms=${String(bounds.episode_deadline_ms)}; the episode is terminal (C3.1)`,
          },
        ],
        `no eligible route for '${episodeLabel}' within episode_deadline_ms=${String(bounds.episode_deadline_ms)}; await G-FRESH-TOL / submit the mapping for review`,
      )
    }

    if (result.status === 'unavailable') {
      refreshRecord = {
        result: 'unavailable',
        coalesced: false,
        requested_key: requestedKey,
        evidence_version: evidenceVersion,
        provenance: null,
        discovered: [],
        reason: result.reason,
      }
      state.negative_cache.set(windowKey, {
        evidence_version: evidenceVersion,
        expires_at_ms: returnedAtMs + bounds.negative_cache_ttl_ms,
      })
      return walkPhase(stepRefusals)
    }

    // 'refreshed': metadata only. The provenance feeds the C7 verdict and the
    // availability facts feed re-evaluation of exact approved mappings — an
    // entry naming a key with no approved mapping is recorded as a discovered
    // candidate and NEVER becomes a route, mapping, tier, fallback, or
    // entitlement (charter :91; D3).
    refreshRecord = {
      result: 'refreshed',
      coalesced: false,
      requested_key: requestedKey,
      evidence_version: evidenceVersion,
      provenance: result.provenance,
      discovered: Object.keys(result.entries).filter((key) => !approvedMappingKeys.has(key)),
      reason: null,
    }
    refreshedProvenance = result.provenance
    refreshedEntries = result.entries
    state.refresh_memo.set(windowKey, {
      evidence_version: evidenceVersion,
      record: refreshRecord,
      entries: result.entries,
      expires_at_ms: returnedAtMs + bounds.negative_cache_ttl_ms,
    })
    return stepOnePrime(stepRefusals)
  }

  // ================== step 1′: re-evaluate exact mappings once ============
  function stepOnePrime(stepRefusals: readonly RefusalEntry[]): RecoveryResolution {
    if (requestedIndexed === null || requestedTarget === null) {
      // No exact approved mapping to re-evaluate — discovery never approves.
      return walkPhase(stepRefusals)
    }
    const pairParts = pairFor(requestedTarget.entry, requestedTarget.slotRole)
    // The episode's freshness verdict reflects the evidence actually consumed
    // by the re-evaluation (the refreshed document supersedes, C3.4).
    requestedProvenance = effectiveProvenanceFor(
      piModelContractFor(requestedIndexed.binding)?.registry_key ?? null,
    )
    const re = revalidate(requestedIndexed, pairParts.pair, pairParts.pairRefusal)
    evaluations.push(re.evaluation)
    const identity = requestedKey ?? requestedIndexed.binding.id
    if (re.refusals.length === 0) {
      const emitted = emitApproved(
        requestedIndexed,
        re.evaluation,
        pairParts.pair,
        re.pairEvaluation,
        requestedTarget.entry.route.comparability,
        'recovery step 1′: the exact approved mapping re-evaluated once with refreshed evidence (D8 step 2)',
      )
      if (!('refusals' in emitted)) {
        attempts.push({
          identity,
          role: 'requested',
          attempt: 2,
          outcome: 'approved',
          refusals: [],
        })
        return finishApproved(emitted)
      }
      attempts.push({
        identity,
        role: 'requested',
        attempt: 2,
        outcome: 'refused',
        refusals: emitted.refusals,
      })
      return walkPhase(emitted.refusals)
    }
    attempts.push({
      identity,
      role: 'requested',
      attempt: 2,
      outcome: 'refused',
      refusals: re.refusals,
    })
    return walkPhase(re.refusals)
  }

  // ================== step 3: the declared-lane fallback walk =============
  function walkPhase(stepRefusals: readonly RefusalEntry[]): RecoveryResolution {
    const terminalRefusals: RefusalEntry[] = [...stepRefusals]
    const deadlineMs = bounds.episode_deadline_ms
    let walkAttempts = 0

    // C6.5: a health verdict on a recorded prior attempt stamps that
    // provider's cooldown — the entire breaker surface. The stamp is keyed to
    // its source attempt (never extended by re-observation) and expires on the
    // injected clock, so a recovered provider is never permanently hidden.
    // Rework R7: the map is bounded — markers dead longer than one cooldown
    // window are pruned (the bound derives from the configured
    // provider_cooldown_ms; no constant is invented).
    if (config.health_policy !== undefined) {
      const stampNowMs = nowOrThrow()
      const pruneBeforeMs = stampNowMs - bounds.provider_cooldown_ms
      for (const [provider, marker] of state.cooldowns) {
        if (marker.until_at_ms < pruneBeforeMs) state.cooldowns.delete(provider)
      }
      for (const prior of episode.prior_attempts) {
        if (!config.health_policy.unhealthy(prior.failure_class)) continue
        const existing = state.cooldowns.get(prior.provider)
        if (existing === undefined || existing.source_attempt_ref !== prior.attempt_ref) {
          state.cooldowns.set(prior.provider, {
            until_at_ms: stampNowMs + bounds.provider_cooldown_ms,
            source_attempt_ref: prior.attempt_ref,
          })
        }
      }
    }

    // The authorized route's provider (C4.4): the requested target's entry
    // when one resolved, else the lane's first declared route entry.
    const authorizedProvider: ProviderName | null =
      requestedTarget !== null
        ? requestedTarget.entry.route.provider
        : (resolvedRoutes[0]?.route.provider ?? null)

    for (const target of targetRefs) {
      const resolved = target.resolved
      if (!('id' in resolved)) {
        // A declared ref that does not resolve is recorded with its typed
        // refusal; the raw ref is never used as a model value.
        attempts.push({
          identity: target.label,
          role: 'fallback',
          attempt: 1,
          outcome: 'skipped',
          refusals: [resolved.refusal],
        })
        terminalRefusals.push(resolved.refusal)
        continue
      }
      const bindingId = resolved.id
      if (visited.has(bindingId)) continue // one visit per target — no cycles
      visited.add(bindingId)
      const found = index.byId.get(bindingId)
      if (found === undefined) {
        const refusal: RefusalEntry = {
          name: 'REPRESENTATION_INCOMPLETE_REFUSED',
          detail: `declared target '${bindingId}' does not resolve to an evaluated binding — refused, never fabricated`,
        }
        attempts.push({
          identity: bindingId,
          role: 'fallback',
          attempt: 1,
          outcome: 'skipped',
          refusals: [refusal],
        })
        terminalRefusals.push(refusal)
        continue
      }
      const indexed: IndexedBinding = {
        binding: found.binding,
        candidateKey: found.candidateKey,
        role: target.slotRole,
      }
      const crossProvider =
        authorizedProvider !== null && found.binding.provider !== authorizedProvider
      const walkRole: 'fallback' | 'cross-provider' = crossProvider ? 'cross-provider' : 'fallback'

      if (crossProvider) {
        // C4.4: cross-provider attempts only where explicitly declared — all
        // three conditions, else excluded (recorded `skipped`) fail-closed.
        const missing: string[] = []
        if (laneEntry !== null && laneEntry.provider_rule.kind === 'pinned-provider') {
          missing.push(
            "the lane's provider_rule is 'pinned-provider' (a partition no fallback crosses)",
          )
        }
        const declaredPrimary = resolvedRoutes.some(
          (entry) => 'id' in entry.primary && entry.primary.id === bindingId,
        )
        if (!declaredPrimary) {
          missing.push('the target is not a declared route primary for the lane')
        }
        if (missing.length > 0) {
          const refusal: RefusalEntry = {
            name: 'RECOVERY_CROSS_PROVIDER_EXCLUDED',
            detail: `cross-provider target '${bindingId}' is excluded — missing declaration(s): ${missing.join('; ')} (C4.4: fail-closed, never an undeclared attempt)`,
          }
          attempts.push({
            identity: bindingId,
            role: walkRole,
            attempt: 1,
            outcome: 'skipped',
            refusals: [refusal],
          })
          terminalRefusals.push(refusal)
          continue
        }
      }

      // C6.5: active cooldown on the target's provider — skipped, recorded.
      const cooldown = state.cooldowns.get(found.binding.provider)
      if (cooldown !== undefined && cooldown.until_at_ms > nowOrThrow()) {
        const refusal: RefusalEntry = {
          name: 'PROVIDER_COOLDOWN_ACTIVE',
          detail: `provider '${found.binding.provider}' is inside its bounded health cooldown (until ${new Date(cooldown.until_at_ms).toISOString()}); the stamp expires on the injected clock (C6.5)`,
        }
        attempts.push({
          identity: bindingId,
          role: walkRole,
          attempt: 1,
          outcome: 'skipped',
          refusals: [refusal],
        })
        terminalRefusals.push(refusal)
        continue
      }

      // Deadline before every attempt (C4.2), then the finite cap.
      if (nowOrThrow() - startedAtMs > deadlineMs) {
        return finishTerminal(
          [
            ...terminalRefusals,
            {
              name: 'RECOVERY_DEADLINE_EXCEEDED',
              detail: `the walk exceeded episode_deadline_ms=${String(deadlineMs)} before attempting '${bindingId}' (C4.2)`,
            },
          ],
          `no eligible route for '${episodeLabel}' within episode_deadline_ms=${String(deadlineMs)}; await G-FRESH-TOL / submit the mapping for review`,
        )
      }
      if (walkAttempts >= bounds.max_fallback_attempts) {
        return finishTerminal(
          [
            ...terminalRefusals,
            {
              name: 'RECOVERY_ATTEMPT_CAP_EXHAUSTED',
              detail: `the walk reached max_fallback_attempts=${String(bounds.max_fallback_attempts)} before '${bindingId}' (C4.2: each attempt and each permitted transient retry counts)`,
            },
          ],
          `no eligible route for '${episodeLabel}' after ${String(walkAttempts)} declared fallback attempts (max_fallback_attempts=${String(bounds.max_fallback_attempts)} reached); await G-FRESH-TOL / submit the mapping for review`,
        )
      }
      walkAttempts += 1

      const pairParts = pairFor(target.entry, target.slotRole)
      const re = revalidate(indexed, pairParts.pair, pairParts.pairRefusal)
      evaluations.push(re.evaluation)
      if (re.refusals.length === 0) {
        // First eligible target wins (C4.5) — emitted through the ordinary
        // receipt path with its own declared fallback pair.
        const emitted = emitApproved(
          indexed,
          re.evaluation,
          pairParts.pair,
          re.pairEvaluation,
          target.entry.route.comparability,
          `recovery step 3 (D8): first eligible declared fallback '${bindingId}' after the bounded walk`,
        )
        if ('refusals' in emitted) {
          attempts.push({
            identity: bindingId,
            role: walkRole,
            attempt: 1,
            outcome: 'skipped',
            refusals: emitted.refusals,
          })
          terminalRefusals.push(...emitted.refusals)
          continue
        }
        attempts.push({
          identity: bindingId,
          role: walkRole,
          attempt: 1,
          outcome: 'approved',
          refusals: [],
        })
        if (walkRole === 'cross-provider') {
          // C4.4(c): the transition rides a durable `cross-provider-attempt`
          // handoff record (the declared-pair rule of `buildFallbackHandoff`
          // preserved).
          chosenFallback = {
            identity: bindingId,
            role: walkRole,
            handoff: buildFallbackHandoff(
              emitted,
              {
                kind: 'cross-provider-attempt',
                binding_id: bindingId,
                observed:
                  'no eligible route remained on the authorized partition; the declared cross-provider primary is attempted from a durable handoff (charter D3)',
              },
              options,
            ),
          }
        } else {
          chosenFallback = { identity: bindingId, role: walkRole, handoff: null }
        }
        return finishApproved(emitted)
      }
      attempts.push({
        identity: bindingId,
        role: walkRole,
        attempt: 1,
        outcome: 'skipped',
        refusals: re.refusals,
      })
      terminalRefusals.push(...re.refusals)

      // C6.2: a prior transient failure on the target permits at most one
      // re-attempt, only under the injected provider-contract retry policy —
      // its own visible AttemptRecord, counted against the cap. Without a
      // policy nothing ever retries.
      const prior = episode.prior_attempts.find((entry) => entry.attempt_ref === bindingId)
      if (prior !== undefined && config.retry_policy?.retryable(prior.failure_class) === true) {
        if (nowOrThrow() - startedAtMs > deadlineMs) {
          return finishTerminal(
            [
              ...terminalRefusals,
              {
                name: 'RECOVERY_DEADLINE_EXCEEDED',
                detail: `the walk exceeded episode_deadline_ms=${String(deadlineMs)} before the transient re-attempt of '${bindingId}' (C6.2)`,
              },
            ],
            `no eligible route for '${episodeLabel}' within episode_deadline_ms=${String(deadlineMs)}; await G-FRESH-TOL / submit the mapping for review`,
          )
        }
        if (walkAttempts >= bounds.max_fallback_attempts) {
          return finishTerminal(
            [
              ...terminalRefusals,
              {
                name: 'RECOVERY_ATTEMPT_CAP_EXHAUSTED',
                detail: `the walk reached max_fallback_attempts=${String(bounds.max_fallback_attempts)} before the transient re-attempt of '${bindingId}' (C6.2)`,
              },
            ],
            `no eligible route for '${episodeLabel}' after ${String(walkAttempts)} declared fallback attempts (max_fallback_attempts=${String(bounds.max_fallback_attempts)} reached); await G-FRESH-TOL / submit the mapping for review`,
          )
        }
        walkAttempts += 1
        const retryRe = revalidate(indexed, pairParts.pair, pairParts.pairRefusal)
        evaluations.push(retryRe.evaluation)
        if (retryRe.refusals.length === 0) {
          const emitted = emitApproved(
            indexed,
            retryRe.evaluation,
            pairParts.pair,
            retryRe.pairEvaluation,
            target.entry.route.comparability,
            `recovery step 3 (D8): the transient re-attempt of '${bindingId}' succeeded (C6.2)`,
          )
          if (!('refusals' in emitted)) {
            attempts.push({
              identity: bindingId,
              role: walkRole,
              attempt: 2,
              outcome: 'approved',
              refusals: [],
            })
            if (walkRole === 'cross-provider') {
              chosenFallback = {
                identity: bindingId,
                role: walkRole,
                handoff: buildFallbackHandoff(
                  emitted,
                  {
                    kind: 'cross-provider-attempt',
                    binding_id: bindingId,
                    observed:
                      'the transient re-attempt of the declared cross-provider primary proceeds from a durable handoff (charter D3)',
                  },
                  options,
                ),
              }
            } else {
              chosenFallback = { identity: bindingId, role: walkRole, handoff: null }
            }
            return finishApproved(emitted)
          }
          terminalRefusals.push(...emitted.refusals)
        }
        attempts.push({
          identity: bindingId,
          role: walkRole,
          attempt: 2,
          outcome: 'skipped',
          refusals: retryRe.refusals,
        })
        terminalRefusals.push(...retryRe.refusals)
      }
    }

    // The declared walk is exhausted — step 4, typed terminal + per-parcel hold.
    // RCM D3 (mirrors `resolveRoute`'s empty-pool rule): when a non-shadow
    // expertise binding exists, the narrowed eligible set is empty — refused
    // by name, never replaced by the un-narrowed set.
    if (narrowing !== null && !('stop' in narrowing)) {
      terminalRefusals.unshift({
        name: 'EXPERTISE_BINDING_UNSATISFIABLE',
        detail: `the (${request.routing_class}, ${String(request.expertise)}) expertise binding narrows the eligible set to nothing (D3: unsatisfiable bindings refuse, never fall back)`,
      })
    }
    if (terminalRefusals.length === 0) {
      terminalRefusals.push({
        name: 'REPRESENTATION_INCOMPLETE_REFUSED',
        detail: `no rankable declared fallback for lane ${String(laneId)} and no per-target refusal was recorded — fail closed`,
      })
    }
    return finishTerminal(
      terminalRefusals,
      `no eligible route for '${episodeLabel}' after ${String(walkAttempts)} declared fallbacks; await G-FRESH-TOL / submit the mapping for review`,
    )
  }

  // ================== step 1: exact mapping + full D1 re-check =============
  if (requestedKey !== null) {
    // Exact matching only (C2.1): `piModelContractFor`'s rule — the registry
    // key, or the mapping's explicitly declared `opencodeId` alias. An
    // unlisted slug (and its version/prefix variants) never acquires an
    // identity at any step.
    for (const target of targetRefs) {
      if (!('id' in target.resolved)) continue
      const found = index.byId.get(target.resolved.id)
      if (found === undefined) continue
      const contract = piModelContractFor(found.binding)
      if (contract === null) continue
      if (contract.registry_key === requestedKey || contract.opencode_id === requestedKey) {
        requestedIndexed = {
          binding: found.binding,
          candidateKey: found.candidateKey,
          role: target.slotRole,
        }
        requestedTarget = target
        break
      }
    }
    if (requestedIndexed === null || requestedTarget === null) {
      const missingRefusals: readonly RefusalEntry[] = [
        {
          name: 'MAPPING_MISSING_REFUSED',
          detail: `no declared mapping for '${requestedKey}'; identity is never inferred (no prefix stripping, version substitution, or family fallback)`,
        },
      ]
      attempts.push({
        identity: requestedKey,
        role: 'requested',
        attempt: 1,
        outcome: 'refused',
        refusals: missingRefusals,
      })
      return refreshPhase(missingRefusals)
    }
    visited.add(requestedIndexed.binding.id)
    const requestedContract = piModelContractFor(requestedIndexed.binding)
    requestedProvenance = catalogProvenanceFor(requestedContract?.registry_key ?? null)
    const pairParts = pairFor(requestedTarget.entry, requestedTarget.slotRole)
    const re = revalidate(requestedIndexed, pairParts.pair, pairParts.pairRefusal)
    evaluations.push(re.evaluation)
    const identity = requestedKey
    if (re.refusals.length === 0) {
      const emitted = emitApproved(
        requestedIndexed,
        re.evaluation,
        pairParts.pair,
        re.pairEvaluation,
        requestedTarget.entry.route.comparability,
        `recovery step 1: exact approved mapping '${requestedContract?.registry_key ?? requestedIndexed.binding.id}' with the full D1 re-check (D8 step 1)`,
      )
      if (!('refusals' in emitted)) {
        // C2.4: attempted[0] carries the requested identity; the selected
        // route rides the receipt — recorded separately.
        attempts.push({
          identity,
          role: 'requested',
          attempt: 1,
          outcome: 'approved',
          refusals: [],
        })
        return finishApproved(emitted)
      }
      attempts.push({
        identity,
        role: 'requested',
        attempt: 1,
        outcome: 'refused',
        refusals: emitted.refusals,
      })
      return afterStepOneFailure(emitted.refusals)
    }
    attempts.push({
      identity,
      role: 'requested',
      attempt: 1,
      outcome: 'refused',
      refusals: re.refusals,
    })
    return afterStepOneFailure(re.refusals)
  }

  // C2.5: no registry key requested — step 1 is the ordinary selection.
  const base = resolveRoute(policy, request, options)
  const baseRoute = base.route
  if (base.status === 'approved' && baseRoute !== null) {
    attempts.push({
      identity: baseRoute.primary.binding_id,
      role: 'requested',
      attempt: 1,
      outcome: 'approved',
      refusals: [],
    })
    return finishApproved(base)
  }
  // The ordinary stop is the step-1 failure; its named refusals carry into the
  // terminal (a keyless request records no requested-target identity).
  refreshRecord = {
    ...refreshRecord,
    reason: 'the ordinary step-1 selection stopped (C2.5); no registry key was requested',
  }
  return afterStepOneFailure(base.stops)

  // C2.5's classification: an evidence failure (missing/unknown evidence or
  // stale evidence) permits the single refresh; anything else walks.
  function afterStepOneFailure(stepRefusals: readonly RefusalEntry[]): RecoveryResolution {
    const evidenceFailure =
      requestedProvenance === null ||
      freshnessDetailFor(requestedProvenance, config.now(), config.provenance_freshness_tolerance)
        .verdict !== 'fresh' ||
      stepRefusals.some(
        (refusal) =>
          refusal.name === 'MAPPING_MISSING_REFUSED' ||
          refusal.name === 'MAPPING_INCOMPLETE_REFUSED' ||
          refusal.name === 'FRESHNESS_STALE_REFUSED',
      )
    return evidenceFailure ? refreshPhase(stepRefusals) : walkPhase(stepRefusals)
  }
}
