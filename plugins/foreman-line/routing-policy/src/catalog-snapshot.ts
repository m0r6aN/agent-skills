/**
 * RCM-P1: pure, typed, offline reader for a versioned, digest-bound catalog
 * snapshot of allowlisted `models-store` facts (`rcm-catalog-snapshot/v1`).
 *
 * This module is deliberately isolated from the host: no ambient clock, no
 * randomness, no filesystem/network/process access, and no sorting or
 * price-comparison of any kind (spec Constraints; enforced by
 * `tests/catalog-purity.test.ts`). The only runtime import is `node:crypto`,
 * used solely to bind the input bytes to their caller-declared digest.
 *
 * `readCatalogSnapshot` is the sole constructor of `CatalogSnapshot` — the
 * type is nominally branded with a module-private symbol so a plain object
 * built elsewhere is not structurally assignable to it, matching this
 * package's `CatalogSnapshot` contract ("only the reader constructs it").
 *
 * Refusal precedence (first match wins), reflecting the 2026-09-22
 * evidence-boundary ruling that snapshot problems are typed refusals, never
 * warnings or silent drops:
 *   DIGEST_REFUSED -> FORMAT_REFUSED -> MALFORMED_REFUSED ->
 *   DUPLICATE_PROVIDER_REFUSED -> DUPLICATE_IDENTITY_REFUSED
 */
import { createHash } from 'node:crypto'

export type SnapshotRefusalCode =
  | 'DIGEST_REFUSED'
  | 'FORMAT_REFUSED'
  | 'MALFORMED_REFUSED'
  | 'DUPLICATE_PROVIDER_REFUSED'
  | 'DUPLICATE_IDENTITY_REFUSED'

/** One side (`input` or `output`) of a model's declared cost. */
export interface CostSide {
  readonly unit: string
  readonly value: number | null
}

/** A model record's ten closed fact fields (spec Contract). */
export interface ModelRecord {
  readonly provider: string
  readonly id: string
  readonly baseUrl: string
  readonly api: string
  readonly input: readonly string[]
  readonly reasoning: boolean
  readonly contextWindow: number
  readonly maxTokens: number
  readonly cost: { readonly input: CostSide; readonly output: CostSide }
  readonly thinkingLevelMap?: Readonly<Record<string, string | null>>
}

/** One provider entry in the snapshot envelope. */
export interface ProviderRecord {
  readonly providerKey: string
  readonly checkedAtUtc: string | null
}

/**
 * Module-private brand. Not exported, so no code outside this file can
 * construct a value the type checker accepts as `CatalogSnapshot` — the
 * nominal-typing mechanism behind "only the reader constructs it".
 */
const SNAPSHOT_BRAND: unique symbol = Symbol('CatalogSnapshot')

export interface CatalogSnapshot {
  readonly [SNAPSHOT_BRAND]: true
  readonly formatVersion: 'rcm-catalog-snapshot/v1'
  readonly sourceRef: string
  readonly providers: readonly ProviderRecord[]
  readonly models: readonly ModelRecord[]
  /** Lowercase hex SHA-256 of the exact input bytes, carried for provenance. */
  readonly digestSha256: string
}

export type SnapshotReadResult =
  | { readonly ok: true; readonly snapshot: CatalogSnapshot }
  | { readonly ok: false; readonly code: SnapshotRefusalCode }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false
  }
  return true
}

const EXPECTED_DIGEST_PATTERN = /^[0-9a-f]{64}$/

/**
 * Exact, case-sensitive `https:` URL with no userinfo, query, or fragment
 * (D13's endpoint-exactness discipline, applied to shape validation). Uses
 * the WHATWG `URL` parser purely as a string-shape check; the *stored* value
 * is always the caller's original string, never the parser's normalized
 * form, so no aliasing or normalization is introduced into the data.
 */
export function isValidBaseUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return false
  }
  return (
    url.protocol === 'https:' &&
    url.username === '' &&
    url.password === '' &&
    url.search === '' &&
    url.hash === ''
  )
}

const ENVELOPE_KEYS = ['formatVersion', 'sourceRef', 'providers', 'models'] as const
const PROVIDER_KEYS = ['providerKey', 'checkedAtUtc'] as const
const COST_SIDE_KEYS = ['unit', 'value'] as const
const COST_KEYS = ['input', 'output'] as const
const MODEL_REQUIRED_KEYS = [
  'provider',
  'id',
  'baseUrl',
  'api',
  'input',
  'reasoning',
  'contextWindow',
  'maxTokens',
  'cost',
] as const
const MODEL_ALL_KEYS = new Set<string>([...MODEL_REQUIRED_KEYS, 'thinkingLevelMap'])

/** Object's own keys equal `required` exactly (no extras, none missing). */
function hasExactKeySet(obj: Record<string, unknown>, required: readonly string[]): boolean {
  const keys = Object.keys(obj)
  if (keys.length !== required.length) return false
  for (const key of required) {
    if (!(key in obj)) return false
  }
  return true
}

/** Model's own keys are a subset of the closed set and include every required key. */
function hasValidModelKeySet(obj: Record<string, unknown>): boolean {
  for (const key of Object.keys(obj)) {
    if (!MODEL_ALL_KEYS.has(key)) return false
  }
  for (const key of MODEL_REQUIRED_KEYS) {
    if (!(key in obj)) return false
  }
  return true
}

function validateCostSideShape(side: unknown): CostSide | null {
  if (!isRecord(side) || !hasExactKeySet(side, COST_SIDE_KEYS)) return null
  if (typeof side.unit !== 'string') return null
  if (!(typeof side.value === 'number' || side.value === null)) return null
  return { unit: side.unit, value: side.value }
}

function validateCostShape(cost: unknown): { input: CostSide; output: CostSide } | null {
  if (!isRecord(cost) || !hasExactKeySet(cost, COST_KEYS)) return null
  const input = validateCostSideShape(cost.input)
  const output = validateCostSideShape(cost.output)
  if (!input || !output) return null
  return { input, output }
}

function validateThinkingLevelMapShape(
  value: unknown,
): Readonly<Record<string, string | null>> | null {
  if (!isRecord(value)) return null
  const map: Record<string, string | null> = {}
  for (const [key, mapped] of Object.entries(value)) {
    if (!(typeof mapped === 'string' || mapped === null)) return null
    map[key] = mapped
  }
  return map
}

function validateModelShape(
  rawModel: unknown,
  providerKeys: ReadonlySet<string>,
): ModelRecord | null {
  if (!isRecord(rawModel) || !hasValidModelKeySet(rawModel)) return null

  const {
    provider,
    id,
    baseUrl,
    api,
    input,
    reasoning,
    contextWindow,
    maxTokens,
    cost,
    thinkingLevelMap,
  } = rawModel

  if (typeof provider !== 'string' || provider.length === 0) return null
  if (!providerKeys.has(provider)) return null
  if (typeof id !== 'string' || id.length === 0) return null
  if (!isValidBaseUrl(baseUrl)) return null
  if (typeof api !== 'string' || api.length === 0) return null
  if (typeof reasoning !== 'boolean') return null
  if (!Number.isInteger(contextWindow) || (contextWindow as number) <= 0) return null
  if (!Number.isInteger(maxTokens) || (maxTokens as number) <= 0) return null

  if (!Array.isArray(input) || input.length === 0) return null
  const inputSeen = new Set<string>()
  const inputList: string[] = []
  for (const item of input) {
    if (typeof item !== 'string') return null
    if (inputSeen.has(item)) return null
    inputSeen.add(item)
    inputList.push(item)
  }

  const costRecord = validateCostShape(cost)
  if (!costRecord) return null

  let thinkingMap: Readonly<Record<string, string | null>> | undefined
  if (thinkingLevelMap !== undefined) {
    const validated = validateThinkingLevelMapShape(thinkingLevelMap)
    if (!validated) return null
    thinkingMap = validated
  }

  return {
    provider,
    id,
    baseUrl,
    api,
    input: inputList,
    reasoning,
    contextWindow: contextWindow as number,
    maxTokens: maxTokens as number,
    cost: costRecord,
    ...(thinkingMap !== undefined ? { thinkingLevelMap: thinkingMap } : {}),
  }
}

interface EnvelopeShape {
  readonly sourceRef: string
  readonly providers: readonly ProviderRecord[]
  readonly models: readonly ModelRecord[]
}

function validateEnvelopeShape(parsed: Record<string, unknown>): EnvelopeShape | null {
  if (!hasExactKeySet(parsed, ENVELOPE_KEYS)) return null
  if (typeof parsed.sourceRef !== 'string') return null
  if (!Array.isArray(parsed.providers) || parsed.providers.length === 0) return null
  if (!Array.isArray(parsed.models) || parsed.models.length === 0) return null

  const providers: ProviderRecord[] = []
  const providerKeys = new Set<string>()
  for (const rawProvider of parsed.providers) {
    if (!isRecord(rawProvider) || !hasExactKeySet(rawProvider, PROVIDER_KEYS)) return null
    const { providerKey, checkedAtUtc } = rawProvider
    if (typeof providerKey !== 'string' || providerKey.length === 0) return null
    if (!(typeof checkedAtUtc === 'string' || checkedAtUtc === null)) return null
    providers.push({ providerKey, checkedAtUtc })
    providerKeys.add(providerKey)
  }

  const models: ModelRecord[] = []
  for (const rawModel of parsed.models) {
    const model = validateModelShape(rawModel, providerKeys)
    if (!model) return null
    models.push(model)
  }

  return { sourceRef: parsed.sourceRef, providers, models }
}

/**
 * `readCatalogSnapshot(bytes, expectedSha256)`: binds `bytes` to
 * `expectedSha256` (lowercase hex SHA-256 of the exact bytes), then verifies
 * canonical JSON formatting and the closed `rcm-catalog-snapshot/v1` shape.
 * Never throws; every failure path is a typed `SnapshotRefusalCode`.
 */
export function readCatalogSnapshot(
  bytes: Uint8Array,
  expectedSha256: unknown,
): SnapshotReadResult {
  if (typeof expectedSha256 !== 'string' || !EXPECTED_DIGEST_PATTERN.test(expectedSha256)) {
    return { ok: false, code: 'DIGEST_REFUSED' }
  }
  const actualDigest = createHash('sha256').update(bytes).digest('hex')
  if (actualDigest !== expectedSha256) {
    return { ok: false, code: 'DIGEST_REFUSED' }
  }

  // Reject a byte-order-mark before decoding: canonical bytes never carry one,
  // and stripping it silently (as some decoders do) would defeat the
  // byte-for-byte canonical comparison below.
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return { ok: false, code: 'FORMAT_REFUSED' }
  }

  let text: string
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return { ok: false, code: 'FORMAT_REFUSED' }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, code: 'FORMAT_REFUSED' }
  }

  // Round-tripping through JSON.stringify(parsed, null, 2) + "\n" and
  // comparing bytes catches CRLF, duplicate JSON members (JSON.parse keeps
  // only the last), and numeric overflow (e.g. 1e400 -> Infinity -> "null")
  // as one generic mechanism, per the spec's canonical-bytes rule.
  const canonicalBytes = new TextEncoder().encode(`${JSON.stringify(parsed, null, 2)}\n`)
  if (!bytesEqual(bytes, canonicalBytes)) {
    return { ok: false, code: 'FORMAT_REFUSED' }
  }
  if (!isRecord(parsed) || parsed.formatVersion !== 'rcm-catalog-snapshot/v1') {
    return { ok: false, code: 'FORMAT_REFUSED' }
  }

  const shape = validateEnvelopeShape(parsed)
  if (!shape) {
    return { ok: false, code: 'MALFORMED_REFUSED' }
  }
  const { sourceRef, providers, models } = shape

  const seenProviderKeys = new Set<string>()
  for (const provider of providers) {
    if (seenProviderKeys.has(provider.providerKey)) {
      return { ok: false, code: 'DUPLICATE_PROVIDER_REFUSED' }
    }
    seenProviderKeys.add(provider.providerKey)
  }

  const seenIdentities = new Map<string, Set<string>>()
  for (const model of models) {
    let idsForProvider = seenIdentities.get(model.provider)
    if (!idsForProvider) {
      idsForProvider = new Set<string>()
      seenIdentities.set(model.provider, idsForProvider)
    }
    if (idsForProvider.has(model.id)) {
      return { ok: false, code: 'DUPLICATE_IDENTITY_REFUSED' }
    }
    idsForProvider.add(model.id)
  }

  const snapshot: CatalogSnapshot = {
    [SNAPSHOT_BRAND]: true,
    formatVersion: 'rcm-catalog-snapshot/v1',
    sourceRef,
    providers,
    models,
    digestSha256: actualDigest,
  }
  return { ok: true, snapshot }
}
