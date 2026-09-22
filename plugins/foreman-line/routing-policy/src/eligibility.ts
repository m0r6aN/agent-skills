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
 *
 * `projectEligibility` treats every input as hostile, including `req`
 * itself (review amendment A2 round 2 / R1). The parameter keeps the
 * contract's declared TypeScript type, but at runtime `req` is copied into
 * an `unknown` local and each field is read once, lazily, inside its own
 * guard. A `null`/`undefined`/non-object `req`, a revoked `Proxy`, or a
 * throwing getter on any field therefore resolves to a typed refusal, never
 * a thrown exception. Each authority field is also read exactly once. It
 * never calls a method on, or iterates, caller-owned data (A2 round 2 / R2,
 * the most serious finding of that round): `identities` and
 * `approvedConfig.endpoints` are each copied by an index loop reading
 * `.length` once and then bracket-indexing, never
 * `.map`/`.forEach`/`for...of`/spread/`Array.from` — a caller can otherwise
 * override `.map` (or `Symbol.iterator`, or `Symbol.species`) on their own
 * array to return forged results without our callback ever running, which
 * is exactly the exploit the round-2 review reproduced. Every function
 * returns a typed refusal for hostile or malformed input, including a
 * `snapshot` that is not an object this reader actually issued
 * (`SNAPSHOT_UNVERIFIED_REFUSED`, checked first — see
 * `SNAPSHOT_REFUSAL_CODES` below), a throwing `approvedConfig` getter, or a
 * throwing `identities`/identity getter. Every exported array constant is
 * frozen, and the module reads those same frozen values, so a caller cannot
 * empty `META_ROUTER_IDS` or any other list to change an outcome.
 */
import {
  type CatalogSnapshot,
  isReaderIssuedSnapshot,
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

/** Step-0 amendment A1: named export for the snapshot/authority/request pipeline tuple. */
export type SnapshotLevelRefusalCode =
  | SnapshotRefusalCode
  | 'TIME_INVALID_REFUSED'
  | 'SOURCE_TIME_UNKNOWN_REFUSED'
  | 'FUTURE_REFUSED'
  | 'STALE_REFUSED'
  | 'AUTHORITY_UNKNOWN_REFUSED'
  | 'AUTHORITY_INVALID_REFUSED'
  | 'REQUEST_INVALID_REFUSED'
  | 'SNAPSHOT_UNVERIFIED_REFUSED'

/**
 * Pipeline order for documentation purposes; first failure wins at runtime.
 * `SNAPSHOT_UNVERIFIED_REFUSED` is appended LAST here, at array position 13
 * (review amendment A2), so every previously-shipped code keeps the same
 * array index. That is a documentation-order choice only: at runtime
 * `projectEligibility` checks it FIRST, before time, authority, or request
 * validation — nothing downstream can be trusted (including which snapshot
 * providers/models to trust) without first confirming the snapshot object
 * actually came from `readCatalogSnapshot`. Reader-only codes (`DIGEST_REFUSED`
 * through `DUPLICATE_IDENTITY_REFUSED`) never surface from `projectEligibility`
 * itself.
 */
export const SNAPSHOT_REFUSAL_CODES: readonly SnapshotLevelRefusalCode[] = Object.freeze([
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
  'SNAPSHOT_UNVERIFIED_REFUSED',
])

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
export const IDENTITY_REFUSAL_CODES: readonly IdentityRefusalCode[] = Object.freeze([
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
])

export const CATALOG_FRESHNESS_MAX_AGE_MS = 86_400_000

/**
 * Exact `id` values that are meta-routers regardless of catalog presence or
 * price (OQ-3 ruling: `openrouter/auto-beta` joins the charter's two).
 * Matched against the requested `id` alone — real P0 evidence shows OpenRouter
 * ids that are themselves `"openrouter/auto"` and `"openrouter/auto-beta"`
 * (the `provider` field is `"openrouter"`, the gateway; `id` carries the
 * meta-router slug verbatim), plus a separate bare `"auto"` id.
 */
export const META_ROUTER_IDS: readonly string[] = Object.freeze([
  'openrouter/auto',
  'openrouter/auto-beta',
  'auto',
])

/**
 * The charter's four named colon suffixes, exported for reference. The
 * actual refusal (OQ-5 ruling) is broader and default-deny: any colon
 * anywhere in a requested `id` refuses as `VARIANT_REFUSED`, not only these
 * four suffixes.
 */
export const REFUSED_VARIANT_SUFFIXES: readonly string[] = Object.freeze([
  ':free',
  ':nitro',
  ':floor',
  ':batch',
])

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

/** Echoes exactly what was read for this identity's `provider`/`id` (see `extractIdentity` — A2 / F2). */
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

/** Own-property presence check (F7): never `in`, which also matches inherited keys. */
function hasOwn(obj: object, key: string): boolean {
  return Object.hasOwn(obj, key)
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

/**
 * Validates and normalizes `approvedConfig`. Every property read here can
 * throw for a hostile `Proxy` or getter (A2 / F5); the caller wraps this
 * whole function in a `try`/`catch` and treats any throw as
 * `AUTHORITY_INVALID_REFUSED`, so this function itself does not need its own
 * internal guards beyond returning `null` for a structurally-wrong shape.
 */
function validateApprovedConfig(value: unknown): ApprovedConfigShape | null {
  if (!isRecord(value)) return null
  const keys = Object.keys(value)
  if (keys.length !== 2 || !hasOwn(value, 'authorityRef') || !hasOwn(value, 'endpoints'))
    return null
  // Read-once (resume Step-0 finding): each field is read exactly once into
  // a local, so a getter cannot pass validation with one value and then
  // return a different one for provenance.
  const authorityRef = value.authorityRef
  const endpoints = value.endpoints
  if (typeof authorityRef !== 'string' || authorityRef.length === 0) return null
  if (!Array.isArray(endpoints)) return null

  // A2 round 2 / R2: index loop, never `for...of`/`.map`/etc. on
  // `endpoints` — it is caller-owned data, same rule as `identities` in
  // `projectEligibility`.
  const endpointsLength = endpoints.length
  if (
    typeof endpointsLength !== 'number' ||
    !Number.isInteger(endpointsLength) ||
    endpointsLength < 0
  ) {
    return null
  }

  const endpointsByProvider = new Map<string, string>()
  for (let i = 0; i < endpointsLength; i += 1) {
    const rawEndpoint = endpoints[i]
    if (!isRecord(rawEndpoint)) return null
    const endpointKeys = Object.keys(rawEndpoint)
    if (
      endpointKeys.length !== 2 ||
      !hasOwn(rawEndpoint, 'provider') ||
      !hasOwn(rawEndpoint, 'baseUrl')
    ) {
      return null
    }
    const { provider, baseUrl } = rawEndpoint
    if (typeof provider !== 'string' || provider.length === 0) return null
    if (!isValidBaseUrl(baseUrl)) return null
    if (endpointsByProvider.has(provider)) return null // duplicate provider entry
    endpointsByProvider.set(provider, baseUrl)
  }

  return { authorityRef, endpointsByProvider }
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

/**
 * A requested identity's `provider`/`id`, each read from the caller-supplied
 * `raw` value exactly once (A2 / F2): this function itself never reads
 * `raw.provider` or `raw.id` a second time, and returns a plain object that
 * the rest of this file (the duplicate check, `evaluateIdentity`, and the
 * returned `requested` field) uses instead of ever touching `raw` again.
 *
 * That guarantee is about *this function's own field reads* — it does not by
 * itself say anything about how `raw` was obtained (A2 round 2 / R6
 * correction of an earlier version of this comment that implied it did). A
 * getter that flips its return value on a later read cannot desynchronize
 * `requested` from what was evaluated only because the *caller* of this
 * function (`projectEligibility`) also never re-reads the source array by
 * any means the caller could intercept (see the index-loop comment there,
 * A2 round 2 / R2) — a caller-overridden `.map`/`.forEach`/iterator on the
 * `identities` array is a distinct, separately-fixed vulnerability from a
 * getter on one identity's own `provider`/`id` fields.
 */
interface ExtractedIdentity {
  readonly provider: unknown
  readonly id: unknown
}

function extractIdentity(raw: unknown): ExtractedIdentity {
  if (isRecord(raw)) {
    const provider = raw.provider // single read
    const id = raw.id // single read
    return { provider, id }
  }
  return { provider: undefined, id: undefined }
}

function evaluateIdentity(
  extracted: ExtractedIdentity,
  snapshot: CatalogSnapshot,
  endpointsByProvider: ReadonlyMap<string, string>,
): IdentityResult {
  const requested: RequestedIdentity = { provider: extracted.provider, id: extracted.id }

  if (
    typeof extracted.provider !== 'string' ||
    extracted.provider.length === 0 ||
    typeof extracted.id !== 'string' ||
    extracted.id.length === 0
  ) {
    return { requested, outcome: 'refused', codes: ['AMBIGUOUS_IDENTITY_REFUSED'] }
  }

  const provider = extracted.provider
  const id = extracted.id
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
 * check's prerequisites explain the order (snapshot integrity before
 * anything else; freshness needs a valid evaluation time; per-identity
 * results need authority and a well-formed request list). Per-identity
 * checks then run independently per identity and *collect* every applicable
 * code, in `IDENTITY_REFUSAL_CODES` order.
 *
 * The parameter keeps the contract's declared type, but the runtime treats
 * `req` as untrusted (A2 / F5, A2 round 2 / R1, and the resume correction
 * 1). It copies `req` into an `unknown` local and reads each field exactly
 * once, lazily, at the pipeline stage that needs it, each inside its own
 * guard. That keeps first-failure-wins order: a stage never reads a field
 * that a later stage owns. The mapping follows A2:
 *
 * - a `req` that is not an object: `REQUEST_INVALID_REFUSED`, level request;
 * - a throw reading `snapshot`: `SNAPSHOT_UNVERIFIED_REFUSED`, level snapshot;
 * - a throw reading `evaluationTimeUtc`: `REQUEST_INVALID_REFUSED`, level request;
 * - a throw reading `approvedConfig` or anything inside it:
 *   `AUTHORITY_INVALID_REFUSED`, level authority;
 * - a throw reading `identities` or anything inside it:
 *   `REQUEST_INVALID_REFUSED`, level request.
 */
export function projectEligibility(req: {
  snapshot: CatalogSnapshot
  approvedConfig: unknown
  evaluationTimeUtc: unknown
  identities: unknown
}): ProjectionResult {
  const source: unknown = req
  if (typeof source !== 'object' || source === null) {
    return { ok: false, level: 'request', code: 'REQUEST_INVALID_REFUSED' }
  }
  const fields = source as Record<string, unknown>

  // Stage 1, snapshot. A revoked Proxy or a throwing getter must not propagate.
  let snapshot: unknown
  try {
    snapshot = fields.snapshot
  } catch {
    return { ok: false, level: 'snapshot', code: 'SNAPSHOT_UNVERIFIED_REFUSED' }
  }

  // A2 / F1: reject a snapshot this reader did not itself issue (forged, a
  // post-read mutation attempt on the frozen original, Object.create(real),
  // or a Proxy of a real one) before trusting anything else about it.
  if (!isReaderIssuedSnapshot(snapshot)) {
    return { ok: false, level: 'snapshot', code: 'SNAPSHOT_UNVERIFIED_REFUSED' }
  }

  // Stage 2, evaluation time and freshness.
  let evaluationTimeUtc: unknown
  try {
    evaluationTimeUtc = fields.evaluationTimeUtc
  } catch {
    return { ok: false, level: 'request', code: 'REQUEST_INVALID_REFUSED' }
  }

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

  // Stage 3, approved configuration authority. A2: a throw reading
  // `approvedConfig`, its endpoints array, or any endpoint refuses
  // AUTHORITY_INVALID_REFUSED and never propagates.
  let approvedConfig: unknown
  try {
    approvedConfig = fields.approvedConfig
  } catch {
    return { ok: false, level: 'authority', code: 'AUTHORITY_INVALID_REFUSED' }
  }

  if (approvedConfig === undefined || approvedConfig === null) {
    return { ok: false, level: 'authority', code: 'AUTHORITY_UNKNOWN_REFUSED' }
  }

  let config: ApprovedConfigShape | null
  try {
    config = validateApprovedConfig(approvedConfig)
  } catch {
    config = null
  }
  if (!config) {
    return { ok: false, level: 'authority', code: 'AUTHORITY_INVALID_REFUSED' }
  }

  // Stage 4, the request list. A2 / F5 + F2, and A2 round 2 / R2: read
  // `identities`, shape-check it, and extract each identity's provider/id
  // exactly once, all inside one guard. A throwing getter, Proxy, `.length`,
  // or identity field anywhere in this block refuses REQUEST_INVALID_REFUSED
  // rather than propagating. Copies `identities` by an index loop reading
  // `.length` exactly once, into a fresh local array: NEVER `.map`,
  // `.forEach`, spread, `for...of`, or `Array.from` on `identities` itself,
  // because all of those call a method on (or iterate) caller-owned data. A
  // caller can override `.map` (or `Symbol.iterator`, or `Symbol.species`)
  // on their own array to return forged results instead of ever running our
  // callback. The index loop below only does `Array.isArray`, one `.length`
  // read, and plain bracket index reads. A Proxy's get trap can still run on
  // those reads, but each value is read once and never re-read.
  let extractedIdentities: readonly ExtractedIdentity[] | null = null
  try {
    const identities = fields.identities
    if (Array.isArray(identities)) {
      const length = identities.length
      if (typeof length === 'number' && Number.isInteger(length) && length > 0) {
        const collected: ExtractedIdentity[] = []
        for (let i = 0; i < length; i += 1) {
          collected.push(extractIdentity(identities[i]))
        }
        extractedIdentities = collected
      }
    }
  } catch {
    extractedIdentities = null
  }
  if (!extractedIdentities) {
    return { ok: false, level: 'request', code: 'REQUEST_INVALID_REFUSED' }
  }

  const seenIdentityIdsByProvider = new Map<string, Set<string>>()
  for (const extracted of extractedIdentities) {
    if (typeof extracted.provider === 'string' && typeof extracted.id === 'string') {
      let idsForProvider = seenIdentityIdsByProvider.get(extracted.provider)
      if (!idsForProvider) {
        idsForProvider = new Set<string>()
        seenIdentityIdsByProvider.set(extracted.provider, idsForProvider)
      }
      if (idsForProvider.has(extracted.id)) {
        return { ok: false, level: 'request', code: 'REQUEST_INVALID_REFUSED' }
      }
      idsForProvider.add(extracted.id)
    }
  }

  const results = extractedIdentities.map((extracted) =>
    evaluateIdentity(extracted, snapshot, config.endpointsByProvider),
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
