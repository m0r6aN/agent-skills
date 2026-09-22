/**
 * RCM-P1: eligibility projector. Turns requested `(provider, id)` identities
 * against an already-read `CatalogSnapshot` into normalized eligibility facts
 * or closed, typed refusals. Produces facts and refusals only — it never
 * decides a route and is never wired into dispatch (charter D1, D2, D10,
 * D11, D13; RCM-P1 row at `charter.md:203`).
 *
 * Same purity discipline as `catalog-snapshot.ts` (see that file's header):
 * no ambient clock/randomness/timers, no host/process/network access, no
 * sorting, no price comparison between records. This file additionally
 * re-exports the reader surface (spec Contract: "src/eligibility.ts holds
 * the projector and re-exports the reader surface") via a relative import of
 * its sibling module — the only non-`node:crypto`, non-type-only import
 * either new module makes, and it stays inside this parcel's own two files.
 */
import {
  type CatalogSnapshot,
  isValidBaseUrl,
  type ModelRecord,
  type ProviderRecord,
  readCatalogSnapshot,
  type SnapshotReadResult,
  type SnapshotRefusalCode,
} from './catalog-snapshot.js'

export type {
  CatalogSnapshot,
  ModelRecord,
  ProviderRecord,
  SnapshotReadResult,
  SnapshotRefusalCode,
}
export { readCatalogSnapshot }

/** Step-0 amendment A1: named export for the 12-code snapshot/authority/request pipeline tuple. */
export type SnapshotLevelRefusalCode =
  | SnapshotRefusalCode
  | 'TIME_INVALID_REFUSED'
  | 'SOURCE_TIME_UNKNOWN_REFUSED'
  | 'FUTURE_REFUSED'
  | 'STALE_REFUSED'
  | 'AUTHORITY_UNKNOWN_REFUSED'
  | 'AUTHORITY_INVALID_REFUSED'
  | 'REQUEST_INVALID_REFUSED'

/** Pipeline order; first failure wins. Reader-only codes never surface from `projectEligibility`. */
export const SNAPSHOT_REFUSAL_CODES: readonly SnapshotLevelRefusalCode[] = [
  'DIGEST_REFUSED',
  'FORMAT_REFUSED',
  'MALFORMED_REFUSED',
  'DUPLICATE_PROVIDER_REFUSED',
  'DUPLICATE_IDENTITY_REFUSED',
  'TIME_INVALID_REFUSED',
  'SOURCE_TIME_UNKNOWN_REFUSED',
  'FUTURE_REFUSED',
  'STALE_REFUSED',
  'AUTHORITY_UNKNOWN_REFUSED',
  'AUTHORITY_INVALID_REFUSED',
  'REQUEST_INVALID_REFUSED',
]

export type IdentityRefusalCode =
  | 'AMBIGUOUS_IDENTITY_REFUSED'
  | 'META_ROUTER_REFUSED'
  | 'VARIANT_REFUSED'
  | 'MISSING_PROVIDER_REFUSED'
  | 'MISSING_MODEL_REFUSED'
  | 'ENDPOINT_AUTHORITY_UNKNOWN_REFUSED'
  | 'ENDPOINT_MISMATCH_REFUSED'
  | 'SENTINEL_RATE_REFUSED'
  | 'RATE_REFUSED'
  | 'MODALITY_REFUSED'

/** Declared collection order: a refused identity's `codes` follow this order, not evaluation order. */
export const IDENTITY_REFUSAL_CODES: readonly IdentityRefusalCode[] = [
  'AMBIGUOUS_IDENTITY_REFUSED',
  'META_ROUTER_REFUSED',
  'VARIANT_REFUSED',
  'MISSING_PROVIDER_REFUSED',
  'MISSING_MODEL_REFUSED',
  'ENDPOINT_AUTHORITY_UNKNOWN_REFUSED',
  'ENDPOINT_MISMATCH_REFUSED',
  'SENTINEL_RATE_REFUSED',
  'RATE_REFUSED',
  'MODALITY_REFUSED',
]

export const CATALOG_FRESHNESS_MAX_AGE_MS = 86_400_000

/**
 * Exact `id` values that are meta-routers regardless of catalog presence or
 * price (OQ-3 ruling: `openrouter/auto-beta` joins the charter's two).
 * Matched against the requested `id` alone — real P0 evidence shows OpenRouter
 * ids that are themselves `"openrouter/auto"` and `"openrouter/auto-beta"`
 * (the `provider` field is `"openrouter"`, the gateway; `id` carries the
 * meta-router slug verbatim), plus a separate bare `"auto"` id.
 */
export const META_ROUTER_IDS: readonly string[] = [
  'openrouter/auto',
  'openrouter/auto-beta',
  'auto',
]

/**
 * The charter's four named colon suffixes, exported for reference. The
 * actual refusal (OQ-5 ruling) is broader and default-deny: any colon
 * anywhere in a requested `id` refuses as `VARIANT_REFUSED`, not only these
 * four suffixes.
 */
export const REFUSED_VARIANT_SUFFIXES: readonly string[] = [':free', ':nitro', ':floor', ':batch']

export const RATE_UNIT = 'USD per 1M tokens'

export type InputModality = 'text' | 'image'

export interface RateFact {
  readonly value: number
  readonly unit: typeof RATE_UNIT
}

export type ThinkingLevels =
  | { readonly status: 'unknown' }
  | {
      readonly status: 'declared'
      readonly levels: readonly { readonly level: string; readonly providerValue: string | null }[]
    }

/** Exactly these fields (AC13) — no extra keys, deep-frozen on return. */
export interface EligibilityFacts {
  readonly provider: string
  readonly id: string
  readonly baseUrl: string
  readonly api: string
  readonly reasoning: boolean
  readonly contextWindow: number
  readonly maxTokens: number
  readonly inputModalities: readonly InputModality[]
  readonly rates: { readonly input: RateFact; readonly output: RateFact }
  readonly thinkingLevels: ThinkingLevels
}

export interface Provenance {
  readonly digestSha256: string
  readonly sourceRef: string
  readonly sourceTimeUtc: string
  readonly evaluationTimeUtc: string
  readonly ageMs: number
  readonly maxAgeMs: number
  readonly approvedConfigRef: string
}

/** Echoes exactly what the caller sent for this array slot, however malformed. */
export interface RequestedIdentity {
  readonly provider: unknown
  readonly id: unknown
}

export type IdentityResult =
  | {
      readonly requested: RequestedIdentity
      readonly outcome: 'facts'
      readonly facts: EligibilityFacts
    }
  | {
      readonly requested: RequestedIdentity
      readonly outcome: 'refused'
      readonly codes: readonly IdentityRefusalCode[]
    }

export type ProjectionLevel = 'snapshot' | 'authority' | 'request'

export type ProjectionResult =
  | {
      readonly ok: true
      readonly provenance: Provenance
      readonly results: readonly IdentityResult[]
    }
  | { readonly ok: false; readonly level: ProjectionLevel; readonly code: SnapshotLevelRefusalCode }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const ISO_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

/** Strict `YYYY-MM-DDTHH:mm:ss.sssZ`, round-tripping through `toISOString` (AC5). */
function isValidIsoTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') return false
  if (!ISO_TIMESTAMP_PATTERN.test(value)) return false
  const ms = Date.parse(value)
  if (Number.isNaN(ms)) return false
  return new Date(ms).toISOString() === value
}

interface ApprovedConfigShape {
  readonly authorityRef: string
  readonly endpointsByProvider: ReadonlyMap<string, string>
}

function validateApprovedConfig(value: unknown): ApprovedConfigShape | null {
  if (!isRecord(value)) return null
  const keys = Object.keys(value)
  if (keys.length !== 2 || !('authorityRef' in value) || !('endpoints' in value)) return null
  if (typeof value.authorityRef !== 'string' || value.authorityRef.length === 0) return null
  if (!Array.isArray(value.endpoints)) return null

  const endpointsByProvider = new Map<string, string>()
  for (const rawEndpoint of value.endpoints) {
    if (!isRecord(rawEndpoint)) return null
    const endpointKeys = Object.keys(rawEndpoint)
    if (endpointKeys.length !== 2 || !('provider' in rawEndpoint) || !('baseUrl' in rawEndpoint))
      return null
    const { provider, baseUrl } = rawEndpoint
    if (typeof provider !== 'string' || provider.length === 0) return null
    if (!isValidBaseUrl(baseUrl)) return null
    if (endpointsByProvider.has(provider)) return null // duplicate provider entry
    endpointsByProvider.set(provider, baseUrl)
  }

  return { authorityRef: value.authorityRef, endpointsByProvider }
}

function deepFreeze<T>(value: T): T {
  if (typeof value !== 'object' || value === null || Object.isFrozen(value)) {
    return value
  }
  Object.freeze(value)
  for (const key of Object.keys(value as Record<string, unknown>)) {
    deepFreeze((value as Record<string, unknown>)[key])
  }
  return value
}

function findProvider(snapshot: CatalogSnapshot, provider: string): ProviderRecord | undefined {
  for (const candidate of snapshot.providers) {
    if (candidate.providerKey === provider) return candidate
  }
  return undefined
}

function findModel(
  snapshot: CatalogSnapshot,
  provider: string,
  id: string,
): ModelRecord | undefined {
  for (const candidate of snapshot.models) {
    if (candidate.provider === provider && candidate.id === id) return candidate
  }
  return undefined
}

function evaluateIdentity(
  item: unknown,
  snapshot: CatalogSnapshot,
  endpointsByProvider: ReadonlyMap<string, string>,
): IdentityResult {
  const requested: RequestedIdentity = isRecord(item)
    ? { provider: item.provider, id: item.id }
    : { provider: undefined, id: undefined }

  if (
    !isRecord(item) ||
    typeof item.provider !== 'string' ||
    item.provider.length === 0 ||
    typeof item.id !== 'string' ||
    item.id.length === 0
  ) {
    return { requested, outcome: 'refused', codes: ['AMBIGUOUS_IDENTITY_REFUSED'] }
  }

  const provider = item.provider
  const id = item.id
  const codes: IdentityRefusalCode[] = []

  if (META_ROUTER_IDS.includes(id)) {
    codes.push('META_ROUTER_REFUSED')
  }
  if (id.includes(':')) {
    codes.push('VARIANT_REFUSED')
  }

  const providerRecord = findProvider(snapshot, provider)
  const modelRecord = providerRecord ? findModel(snapshot, provider, id) : undefined

  if (!providerRecord) {
    codes.push('MISSING_PROVIDER_REFUSED')
  } else if (!modelRecord) {
    codes.push('MISSING_MODEL_REFUSED')
  }

  const approvedBaseUrl = endpointsByProvider.get(provider)
  if (approvedBaseUrl === undefined) {
    codes.push('ENDPOINT_AUTHORITY_UNKNOWN_REFUSED')
  } else if (modelRecord && modelRecord.baseUrl !== approvedBaseUrl) {
    codes.push('ENDPOINT_MISMATCH_REFUSED')
  }

  if (modelRecord) {
    const inputNegative = modelRecord.cost.input.value !== null && modelRecord.cost.input.value < 0
    const outputNegative =
      modelRecord.cost.output.value !== null && modelRecord.cost.output.value < 0
    if (inputNegative || outputNegative) {
      codes.push('SENTINEL_RATE_REFUSED')
    }

    const inputRateInvalid =
      modelRecord.cost.input.value === null || modelRecord.cost.input.unit !== RATE_UNIT
    const outputRateInvalid =
      modelRecord.cost.output.value === null || modelRecord.cost.output.unit !== RATE_UNIT
    if (inputRateInvalid || outputRateInvalid) {
      codes.push('RATE_REFUSED')
    }

    const modalityInvalid = modelRecord.input.some(
      (modality) => modality !== 'text' && modality !== 'image',
    )
    if (modalityInvalid) {
      codes.push('MODALITY_REFUSED')
    }
  }

  if (codes.length > 0) {
    return { requested, outcome: 'refused', codes }
  }

  // modelRecord is guaranteed defined here: no refusal code above fires without
  // it, and MISSING_PROVIDER_REFUSED/MISSING_MODEL_REFUSED are the only paths
  // that leave it undefined, and both push a code that returns early above.
  const record = modelRecord as ModelRecord

  let thinkingLevels: ThinkingLevels
  if (record.thinkingLevelMap === undefined) {
    thinkingLevels = { status: 'unknown' }
  } else {
    const levels = Object.entries(record.thinkingLevelMap).map(([level, providerValue]) => ({
      level,
      providerValue,
    }))
    thinkingLevels = { status: 'declared', levels }
  }

  const facts: EligibilityFacts = {
    provider: record.provider,
    id: record.id,
    baseUrl: record.baseUrl,
    api: record.api,
    reasoning: record.reasoning,
    contextWindow: record.contextWindow,
    maxTokens: record.maxTokens,
    inputModalities: record.input as readonly InputModality[],
    rates: {
      input: { value: record.cost.input.value as number, unit: RATE_UNIT },
      output: { value: record.cost.output.value as number, unit: RATE_UNIT },
    },
    thinkingLevels,
  }

  return { requested, outcome: 'facts', facts: deepFreeze(facts) }
}

/**
 * `projectEligibility`: turns requested identities against an already-read
 * `CatalogSnapshot` into facts or refusals. Whole-projection checks run in
 * pipeline order (first failure wins, per `SNAPSHOT_REFUSAL_CODES`); each
 * check's prerequisites explain the order (freshness needs a valid
 * evaluation time; per-identity results need authority and a well-formed
 * request list). Per-identity checks then run independently per identity and
 * *collect* every applicable code, in `IDENTITY_REFUSAL_CODES` order.
 */
export function projectEligibility(req: {
  readonly snapshot: CatalogSnapshot
  readonly approvedConfig: unknown
  readonly evaluationTimeUtc: unknown
  readonly identities: unknown
}): ProjectionResult {
  const { snapshot, approvedConfig, evaluationTimeUtc, identities } = req

  if (!isValidIsoTimestamp(evaluationTimeUtc)) {
    return { ok: false, level: 'request', code: 'TIME_INVALID_REFUSED' }
  }
  const evalMs = Date.parse(evaluationTimeUtc)

  for (const provider of snapshot.providers) {
    if (provider.checkedAtUtc !== null && !isValidIsoTimestamp(provider.checkedAtUtc)) {
      return { ok: false, level: 'snapshot', code: 'TIME_INVALID_REFUSED' }
    }
  }

  for (const provider of snapshot.providers) {
    if (provider.checkedAtUtc === null) {
      return { ok: false, level: 'snapshot', code: 'SOURCE_TIME_UNKNOWN_REFUSED' }
    }
  }

  let sourceMs = Number.POSITIVE_INFINITY
  for (const provider of snapshot.providers) {
    const ms = Date.parse(provider.checkedAtUtc as string)
    if (ms < sourceMs) sourceMs = ms
  }

  if (sourceMs > evalMs) {
    return { ok: false, level: 'snapshot', code: 'FUTURE_REFUSED' }
  }

  const ageMs = evalMs - sourceMs
  if (ageMs > CATALOG_FRESHNESS_MAX_AGE_MS) {
    return { ok: false, level: 'snapshot', code: 'STALE_REFUSED' }
  }

  if (approvedConfig === undefined || approvedConfig === null) {
    return { ok: false, level: 'authority', code: 'AUTHORITY_UNKNOWN_REFUSED' }
  }

  const config = validateApprovedConfig(approvedConfig)
  if (!config) {
    return { ok: false, level: 'authority', code: 'AUTHORITY_INVALID_REFUSED' }
  }

  if (!Array.isArray(identities) || identities.length === 0) {
    return { ok: false, level: 'request', code: 'REQUEST_INVALID_REFUSED' }
  }
  const seenIdentityIdsByProvider = new Map<string, Set<string>>()
  for (const item of identities) {
    if (isRecord(item) && typeof item.provider === 'string' && typeof item.id === 'string') {
      let idsForProvider = seenIdentityIdsByProvider.get(item.provider)
      if (!idsForProvider) {
        idsForProvider = new Set<string>()
        seenIdentityIdsByProvider.set(item.provider, idsForProvider)
      }
      if (idsForProvider.has(item.id)) {
        return { ok: false, level: 'request', code: 'REQUEST_INVALID_REFUSED' }
      }
      idsForProvider.add(item.id)
    }
  }

  const results = identities.map((item) =>
    evaluateIdentity(item, snapshot, config.endpointsByProvider),
  )

  const provenance: Provenance = {
    digestSha256: snapshot.digestSha256,
    sourceRef: snapshot.sourceRef,
    sourceTimeUtc: new Date(sourceMs).toISOString(),
    evaluationTimeUtc,
    ageMs,
    maxAgeMs: CATALOG_FRESHNESS_MAX_AGE_MS,
    approvedConfigRef: config.authorityRef,
  }

  return { ok: true, provenance, results }
}
