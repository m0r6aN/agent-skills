/**
 * PMC-P2 — route receipt contract (charter A1, A3, A6).
 *
 * The resolver emits one signed receipt per request: an approved route receipt
 * or a failed/stop receipt. The receipt is the launch authority (A1) and the
 * ranking record (A3: every ranking input and the chosen binding, not only the
 * winner). It is a no-secret artifact: no credential, key, or token value ever
 * enters it (D2), and it attests `static-conformance` only (A6) — it may never
 * imply `live-availability` or `model-quality`.
 *
 * "Signed by the resolver" (A1) is a canonical-content digest (SHA-256), not a
 * shared-secret MAC: no credentials exist anywhere in this repository (D2), so
 * the signature binds the receipt bytes to the resolver identity and enables
 * tamper detection (`DIGEST_MISMATCH_REFUSED`) and replay discipline without
 * introducing a secret. It is an integrity binding, not an authenticity claim.
 */
import { createHash } from 'node:crypto'
import type { PiOpenRouterProvenance } from './pi-openrouter.js'
import type { FallbackHandoffRecord } from './pi-resolver.js'
import type {
  AttestedState,
  DeclaredEvidence,
  Evidence,
  LaneId,
  ProviderName,
  ProviderRule,
  RoleFamily,
  TransportRequirements,
} from './types.js'

/** Identity recorded in every receipt ("signed by the resolver", A1). */
export const ROUTE_RESOLVER_ID = '@foreman-line/routing-policy/pi-resolver@1'

/**
 * Launch-boundary refusal names (charter A1 failure modes: "missing, stale,
 * mismatched against the requested lane, or unsigned by the resolver", plus the
 * break-glass denial rule and the A6 attested-state check). These are
 * launch-domain names, not rubric §7 residual names: they never appear in a
 * policy document. Time and digest failures reuse the rubric vocabulary
 * verbatim (`FRESHNESS_*`, `DIGEST_MISMATCH_REFUSED`); every name the boundary
 * can emit is listed here (review B RB-5), and a break-glass exception names
 * its bypassed checks from this vocabulary.
 */
export const LAUNCH_REFUSALS: readonly string[] = [
  'RECEIPT_MISSING_REFUSED',
  'RECEIPT_UNSIGNED_REFUSED',
  'RECEIPT_LANE_MISMATCH_REFUSED',
  'RECEIPT_STATUS_REFUSED',
  'BREAK_GLASS_DENIED_REFUSED',
  'FRESHNESS_STALE_REFUSED',
  'FRESHNESS_FUTURE_REFUSED',
  'DIGEST_MISMATCH_REFUSED',
  'EVIDENCE_STATE_UNATTESTED',
]

export interface RefusalEntry {
  readonly name: string
  readonly detail: string
}

/** One recorded ranking input (A3), evaluated against a named source. */
export interface RankingInputRecord {
  readonly input: 'R1' | 'R2' | 'R3' | 'R4' | 'R5' | 'R6' | 'R7'
  readonly verdict: boolean
  readonly evidence: string
  readonly detail: string
}

/** Per-candidate evaluation record (A3: inputs for every candidate). */
export interface CandidateEvaluation {
  readonly binding_id: string
  readonly candidate: string
  readonly role: 'primary' | 'fallback'
  readonly ranking_inputs: readonly RankingInputRecord[]
  readonly refusals: readonly RefusalEntry[]
  readonly holds: readonly string[]
  /** Named unproven residuals observed on this binding's evidence envelopes. */
  readonly residuals: readonly string[]
  readonly rankable: boolean
}

/** A claim that remains unproven (A6/A8 enumeration). */
export interface UnprovenClaim {
  readonly claim: string
  readonly state: 'unproven'
  /** Optional named residual; when present it MUST come from the vocabulary. */
  readonly residual?: string
}

export interface BudgetRecord {
  readonly ceiling_usd: number
  readonly remaining_budget_usd: number
  /** Projected spend of the chosen binding; null when nothing was chosen. */
  readonly projected_cost_usd: number | null
}

export interface ThinkingLevelRecord {
  readonly state: 'declared'
  readonly value: string
  readonly source: string
}

/** The exact Pi lane configuration (charter D1 session shape). */
export interface LaneConfig {
  readonly lane: LaneId
  readonly role_family: RoleFamily
  readonly subroles: readonly string[]
  readonly routing_class: string
  readonly authority_cap: readonly string[]
  readonly authority_prohibited: readonly string[]
  readonly provider_rule: ProviderRule
  readonly quality_tolerance: { readonly state: 'unavailable'; readonly residual: string }
  readonly thinking_level: ThinkingLevelRecord
  readonly budget: BudgetRecord
  readonly data_controls: TransportRequirements
}

/** Pi-side per-model contract entries transcribed from `pi-openrouter.ts`. */
export interface PiModelContract {
  readonly registry_key: string
  readonly opencode_id: string | null
  /** HRO-P1 explicit mapping value; null = no explicit value — never derived from the registry key or host id. */
  readonly provider_local_id: string | null
  /** HRO-P1 explicit mapping value; null = no explicit value — never assumed. */
  readonly protocol: string | null
  readonly capabilities: readonly string[]
  readonly allowed_lanes: readonly string[]
  readonly prohibited_lanes: readonly string[]
  readonly authority: string
}

/** OpenRouter provider constraints (charter D3 + matrix note). */
export interface OpenRouterProviderConstraints {
  readonly provider: 'openrouter'
  /** The contract const from `pi-openrouter.ts` (SCF-3 comparator). */
  readonly base_url: string
  readonly allow_fallbacks: true
  readonly data_collection: 'allow' | 'deny'
  readonly zdr: boolean
  readonly pi_model_contract: PiModelContract
}

/** Durable fallback handoff plan (charter D3, D8; A2). */
export interface FallbackHandoffPlan {
  readonly primary: string
  readonly fallback: string
  readonly fallback_suitability: Evidence<string>
  readonly on_primary_degraded: {
    readonly action: 'route-to-declared-fallback'
    readonly required_preflight: readonly string[]
    readonly rule: 'charter D4'
  }
  readonly on_fallback_failure: {
    readonly action: 'stop-and-report'
    readonly rule: 'charter D8'
  }
  readonly cross_provider: {
    readonly action: 'new-recorded-attempt-from-durable-handoff'
    readonly silent_continuation: 'never'
    readonly rule: 'charter D3'
  }
}

export interface ApprovedRoute {
  readonly provider: ProviderName
  readonly primary: { readonly binding_id: string; readonly model: string }
  readonly fallback: {
    readonly binding_id: string
    readonly model: string
    readonly suitability: Evidence<string>
  }
  readonly pi_model_contract: PiModelContract
  readonly openrouter_constraints: OpenRouterProviderConstraints | null
}

export interface SelectionRecord {
  readonly rule: string
  readonly reason: string
  readonly order: readonly string[]
  readonly chosen: string | null
}

/**
 * HRO-P4a (MRC-08) — the bounded recovery ladder's record/outcome contract
 * (D8's five record classes, charter `:95`: attempted candidates, refresh
 * provenance, chosen fallback, freshness, terminal outcome). Additive: the
 * record rides the signed receipt as the optional `recovery?` field, so a
 * recovery-absent receipt stays byte-identical (`canonicalJson` drops
 * `undefined`). The terminal is field-aligned with MRC-06's `route_unavailable`
 * outcome (f) by name and shape; that entry type is consumed read-only and
 * never edited here.
 */

/** C7.2 freshness verdict over one provenance envelope. */
export type FreshnessVerdict = 'fresh' | 'stale' | 'unknown'

/** One attempted (or skipped) candidate of a recovery episode (record class 1). */
export interface AttemptRecord {
  /** The exact requested string (requested attempts) or the declared binding id (walk attempts). */
  readonly identity: string
  /** Requested target, same-partition fallback, or an explicitly declared cross-provider attempt. */
  readonly role: 'requested' | 'fallback' | 'cross-provider'
  /** 1-based try number; `2` is the single provider-contract-permitted transient retry (C6.2). */
  readonly attempt: number
  /**
   * `approved` = the target was selected; `refused` = the requested target's
   * failed attempt; `skipped` = a walk target not selected — excluded before
   * revalidation (cross-provider declaration, cooldown) or revalidated and
   * ineligible — each with its named reasons recorded.
   */
  readonly outcome: 'approved' | 'refused' | 'skipped'
  readonly refusals: readonly RefusalEntry[]
}

/** Step-2 refresh provenance (record class 2) — metadata-only, never approving. */
export interface RefreshProvenance {
  /** 'not-permitted' covers every non-invocation outcome (see `reason`). */
  readonly result:
    | 'refreshed'
    | 'unavailable'
    | 'negative-cached'
    | 'not-permitted'
    | 'deadline-exceeded'
  /** True when this episode attached to a coalesced in-window result instead of invoking (C3.2). */
  readonly coalesced: boolean
  readonly requested_key: string | null
  readonly evidence_version: string | null
  /** The refreshed document's own provenance (C3.4); null when none arrived or it was discarded. */
  readonly provenance: DeclaredEvidence<PiOpenRouterProvenance> | null
  /** Keys the refresh named with no approved mapping — recorded as discovered candidates, never routed (C3.4). */
  readonly discovered: readonly string[]
  readonly reason: string | null
}

/**
 * The typed `route_unavailable` terminal (MRC-06 (f) field set, pinned by the
 * alignment control): no eligible route remains and exactly the named parcel
 * is held — returned, never thrown, so independent parcels continue.
 */
export interface RouteUnavailableOutcome {
  readonly code: 'ROUTE_UNAVAILABLE'
  readonly parcelRef: string
  readonly requested: { readonly lane: LaneId; readonly registry_key: string | null }
  readonly attempted: readonly {
    readonly identity: string
    readonly refusals: readonly RefusalEntry[]
  }[]
  readonly refusals: readonly RefusalEntry[]
  readonly reason: string
  readonly hold: 'parcel-held'
}

/**
 * One recovery episode (record classes 3–5 beside `attempted`/`refresh`):
 * `kind`/`schema_version`/`episode_id` are the envelope. The record is covered
 * by `signReceipt`/`verifyReceiptSignature` like every other receipt field.
 */
export interface RecoveryEpisodeRecord {
  readonly kind: 'recovery-episode-record'
  readonly schema_version: 1
  readonly episode_id: string
  readonly attempted: readonly AttemptRecord[]
  readonly refresh: RefreshProvenance
  readonly chosen_fallback: {
    readonly identity: string
    readonly role: 'fallback' | 'cross-provider'
    /** The durable `cross-provider-attempt` handoff record (C4.4c); null for same-partition fallbacks. */
    readonly handoff: FallbackHandoffRecord | null
  } | null
  /** C7 verdict over the requested evidence: the consumed grace is visible, never hidden. */
  readonly freshness: {
    readonly verdict: FreshnessVerdict
    /** now − valid_until in ms when both parse; null when unknown/unparseable. */
    readonly age_ms: number | null
    /** The consumed tolerance in ms; null when UNSET (fail-closed default). */
    readonly tolerance_ms: number | null
  }
  readonly terminal: RouteUnavailableOutcome | null
}

/**
 * One receipt per request. `status: 'stop'` receipts carry `stops` and are
 * never launchable (A1: only an approved route receipt authorizes a session).
 */
export interface RouteReceipt {
  readonly kind: 'pi-route-receipt'
  readonly schema_version: 1
  readonly resolver: string
  readonly status: 'approved' | 'stop'
  readonly attested_state: AttestedState
  readonly receipt_id: string
  readonly issued_at: string
  /** Null only when the request named no usable lane. */
  readonly lane: LaneId | null
  readonly request: unknown
  readonly lane_config: LaneConfig | null
  readonly evaluations: readonly CandidateEvaluation[]
  readonly selection: SelectionRecord
  readonly route: ApprovedRoute | null
  readonly fallback_handoff: FallbackHandoffPlan | null
  readonly stops: readonly RefusalEntry[]
  readonly unproven_claims: readonly UnprovenClaim[]
  /**
   * HRO-P4a additive optional: the recovery episode record, present only on
   * ladder-emitted receipts. Absent = pre-parcel bytes (`canonicalJson` drops
   * `undefined`), so the shipped surface is unchanged.
   */
  readonly recovery?: RecoveryEpisodeRecord
  readonly signature: string
}

/**
 * Canonical JSON: object keys sorted by Unicode code point at every depth,
 * arrays preserved in order. Deterministic receipts need deterministic bytes.
 */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null'
  if (Array.isArray(value)) return `[${value.map((entry) => canonicalJson(entry)).join(',')}]`
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, entry]) => entry !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  return `{${entries.map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`).join(',')}}`
}

/**
 * The signed-content digest: SHA-256 over the canonical JSON of a document
 * (named formula shared by route receipts and break-glass exceptions).
 */
export function documentDigest(document: object): string {
  return createHash('sha256').update(canonicalJson(document), 'utf8').digest('hex')
}

/**
 * Signs a receipt as the resolver (A1). Deterministic: same bytes, same
 * signature. A previously signed document is re-signed cleanly (any prior
 * signature value is excluded from the signed content).
 */
export function signReceipt(
  receipt: Omit<RouteReceipt, 'signature'> & { readonly signature?: string },
): RouteReceipt {
  return { ...receipt, signature: documentDigest({ ...receipt, signature: undefined }) }
}

/** True when `signature` matches the receipt content (tamper detection). */
export function verifyReceiptSignature(receipt: RouteReceipt): boolean {
  const { signature, ...rest } = receipt
  return typeof signature === 'string' && signature === documentDigest(rest)
}
