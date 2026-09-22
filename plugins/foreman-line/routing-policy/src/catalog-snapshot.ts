/**
 * RCM-P1: pure, typed, offline reader for a versioned, digest-bound catalog
 * snapshot of allowlisted `models-store` facts (`rcm-catalog-snapshot/v1`).
 *
 * This module is deliberately isolated from the host: no ambient clock, no
 * randomness, no filesystem/network/process access, and no sorting or
 * price-comparison of any kind (spec Constraints). `tests/catalog-purity.test.ts`
 * checks this file's source text against a closed, growing list of known
 * forbidden forms and stubs a set of host globals at runtime — a regression
 * tripwire, not a proof that no code path here could ever reach them (see
 * that file's own header, review amendment A2 round 2 / R5, R6). The only
 * runtime import is `node:crypto`, used solely to bind the input bytes to
 * their caller-declared digest.
 *
 * `readCatalogSnapshot` is the sole constructor of `CatalogSnapshot`, enforced
 * two ways (review amendment A2 / F1): nominally, via a module-private brand
 * symbol so a plain object built elsewhere is not *structurally* assignable
 * to the type; and at runtime, via a module-private `WeakSet` recording every
 * object this reader actually returns, checked by identity through
 * `isReaderIssuedSnapshot` (internal helper, not part of the public
 * Contract — see README). Every returned snapshot is also deep-frozen, so a
 * caller holding a real snapshot cannot mutate it after the fact either.
 * `Object.create(snapshot)` and `new Proxy(snapshot, {})` are each a
 * *different* object identity from `snapshot`, so neither passes the
 * registry check even though both structurally resemble a real one.
 *
 * Every public function is designed to never throw (A2 / F5): hostile or
 * malformed input is a typed refusal, never an exception.
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

/** Own-property presence check (F7): never `in`, which also matches inherited keys. */
function hasOwn(obj: object, key: string): boolean {
  return Object.hasOwn(obj, key)
}

/**
 * Byte-gate primitives, all captured at module load before any caller code
 * runs (A2 round 2 / R4, R7, and the resume correction 3). Reassigning a
 * global or a prototype method later cannot change what these refer to.
 *
 * - `REAL_UINT8ARRAY_CTOR` builds the defensive copy.
 * - `IS_ARRAY_BUFFER_VIEW` is `ArrayBuffer.isView`, which tests the internal
 *   `[[ViewedArrayBuffer]]` slot. A Proxy has no such slot, even when it wraps
 *   a real typed array, and the check runs no trap.
 * - `typedArrayTagOf` is the `%TypedArray%.prototype[Symbol.toStringTag]`
 *   getter, bound through the original `call` at load time. It reads the
 *   internal `[[TypedArrayName]]` slot, returns `undefined` for anything that
 *   is not a real typed array, and consults no caller-visible property. It
 *   tells a real `Uint8Array` (or subclass, such as `Buffer`) apart from a
 *   different typed array whose prototype was swapped to `Uint8Array`'s.
 */
const REAL_UINT8ARRAY_CTOR = Uint8Array
const IS_ARRAY_BUFFER_VIEW = ArrayBuffer.isView
const TYPED_ARRAY_TAG_GETTER = Object.getOwnPropertyDescriptor(
  Object.getPrototypeOf(Uint8Array.prototype),
  Symbol.toStringTag,
)?.get
const typedArrayTagOf: ((value: unknown) => unknown) | undefined =
  TYPED_ARRAY_TAG_GETTER === undefined
    ? undefined
    : TYPED_ARRAY_TAG_GETTER.call.bind(TYPED_ARRAY_TAG_GETTER)

/**
 * Makes exactly one defensive copy of `bytes`, or returns `null` when `bytes`
 * is not a genuine `Uint8Array` or the copy throws. The caller maps `null` to
 * `FORMAT_REFUSED`, so this function is the `FORMAT_REFUSED` guard for the
 * copy. Every later step in `readCatalogSnapshot` reads only the returned
 * copy, never the original `bytes` parameter again.
 *
 * Accepted: a real `Uint8Array` or a real subclass instance, such as `Buffer`,
 * including one whose own `length` accessor throws or lies. Refused: a Proxy
 * of any kind (including a Proxy wrapping a real `Uint8Array` or one faking
 * its prototype), any plain object, and any other typed array or view, even
 * with its prototype swapped to `Uint8Array.prototype`.
 *
 * The gate uses only the two internal-slot checks above. It deliberately
 * does not use `instanceof`: that consults `getPrototypeOf` (a Proxy trap)
 * and `Symbol.hasInstance` (which a caller can define on the global
 * constructor), so it can run caller code. Both slot checks pass only for a
 * real `Uint8Array`, so the constructor call below takes the typed-array
 * path. That path reads the source's internal buffer and length slots and
 * copies element for element with no type conversion. No caller getter, trap,
 * or iterator runs, and the copy holds exactly the input bytes. The copy is
 * always a plain `Uint8Array`, never the caller's subclass.
 */
function makeDefensiveByteCopy(bytes: unknown): Uint8Array | null {
  try {
    if (typedArrayTagOf === undefined) return null
    if (!IS_ARRAY_BUFFER_VIEW(bytes)) return null
    if (typedArrayTagOf(bytes) !== 'Uint8Array') return null
    return new REAL_UINT8ARRAY_CTOR(bytes as Uint8Array)
  } catch {
    return null
  }
}

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false
  }
  return true
}

/**
 * Recursively `Object.freeze`s `value` and everything reachable from its own
 * enumerable string-keyed properties (arrays included, since array indices
 * are just string keys). Symbol-keyed properties (the snapshot brand) are
 * frozen as part of `Object.freeze` on the owning object itself, without
 * needing a separate visit. Idempotent and cycle-safe (an already-frozen
 * object is not re-descended).
 */
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

/**
 * Reader-issued snapshot registry (A2 / F1). Every snapshot this reader
 * successfully constructs is added here, by object identity, after being
 * deep-frozen. The `WeakSet` itself is never exported — `isReaderIssuedSnapshot`
 * is the only way to query it — so no other code can add to or forge
 * membership in it.
 */
const READER_ISSUED_SNAPSHOTS = new WeakSet<object>()

/**
 * Internal helper (not part of the public Contract — see README): true only
 * for an object this reader itself returned from a successful read. Never
 * throws; a non-object, `null`, or `undefined` input simply returns `false`.
 */
export function isReaderIssuedSnapshot(value: unknown): value is CatalogSnapshot {
  if (typeof value !== 'object' || value === null) return false
  return READER_ISSUED_SNAPSHOTS.has(value)
}

const EXPECTED_DIGEST_PATTERN = /^[0-9a-f]{64}$/

/** Any whitespace, backslash, or ASCII control character (A2 round 2 / R8). */
// biome-ignore lint/suspicious/noControlCharactersInRegex: matching control characters is the point of this check (A2 round 2 / R8)
const WHITESPACE_BACKSLASH_OR_CONTROL_PATTERN = /[\s\\\u0000-\u001f\u007f]/

/**
 * Exact, case-sensitive `https:` URL with no userinfo, query, or fragment
 * (D13's endpoint-exactness discipline, applied to shape validation).
 *
 * - Requires the exact lowercase literal prefix `https://` (A2 round 2 / R8):
 *   `url.protocol === 'https:'` alone is not enough, because the WHATWG
 *   `URL` parser lowercases the scheme on parse, so `new URL('HTTPS://x').protocol`
 *   is also `'https:'` even though the caller's original string was not
 *   lowercase — checking the raw prefix directly closes that gap.
 * - Refuses on a raw scan for `?`, `#`, or `@` *anywhere* in the string first
 *   (A2 / F6): the parser normalizes an empty-but-present query/fragment/
 *   userinfo component (e.g. `.../v1?`, `...#`, `https://@host`) to an empty
 *   `.search`/`.hash`/`.username`, which would otherwise let those characters
 *   through undetected.
 * - Refuses on any whitespace, backslash, or ASCII control character
 *   anywhere in the string (A2 round 2 / R8), and requires a non-empty
 *   `hostname` after parsing.
 *
 * The *stored* value is always the caller's original string, never the
 * parser's normalized form, so no aliasing or normalization is introduced
 * into the data.
 */
export function isValidBaseUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false
  if (!value.startsWith('https://')) return false
  if (value.includes('?') || value.includes('#') || value.includes('@')) return false
  if (WHITESPACE_BACKSLASH_OR_CONTROL_PATTERN.test(value)) return false
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return false
  }
  if (url.protocol !== 'https:') return false
  if (url.hostname.length === 0) return false
  return true
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

/** Object's own keys equal `required` exactly (no extras, none missing, own-property only — F7). */
function hasExactKeySet(obj: Record<string, unknown>, required: readonly string[]): boolean {
  const keys = Object.keys(obj)
  if (keys.length !== required.length) return false
  for (const key of required) {
    if (!hasOwn(obj, key)) return false
  }
  return true
}

/** Model's own keys are a subset of the closed set and include every required key (own-property only — F7). */
function hasValidModelKeySet(obj: Record<string, unknown>): boolean {
  for (const key of Object.keys(obj)) {
    if (!MODEL_ALL_KEYS.has(key)) return false
  }
  for (const key of MODEL_REQUIRED_KEYS) {
    if (!hasOwn(obj, key)) return false
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

/**
 * Builds the returned map with `Object.create(null)`, not `{}` (A2 / F3): a
 * plain `{}` inherits the legacy `Object.prototype.__proto__` accessor, so
 * `map['__proto__'] = someString` silently invokes that accessor instead of
 * creating an own data property — the level is accepted here but then
 * vanishes from every later `Object.keys`/`Object.entries` walk. Reading
 * `value` itself is unaffected: `JSON.parse` always creates a genuine own
 * `"__proto__"` data property when the source text has that key, so nothing
 * here needs to change on the read side, only the write side.
 */
function validateThinkingLevelMapShape(
  value: unknown,
): Readonly<Record<string, string | null>> | null {
  if (!isRecord(value)) return null
  const map: Record<string, string | null> = Object.create(null)
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
 * Never throws (A2 / F5, and A2 round 2 / R3, R4, R7): `null`/`undefined`/
 * non-`Uint8Array` bytes, a hostile `Uint8Array` subclass with a throwing or
 * lying `length`, and a pathological input that would overflow the stack in
 * `JSON.stringify` or the shape walk, are all typed refusals, not
 * exceptions. Every step from decoding through the shape walk runs inside
 * one guard that maps any exception to `FORMAT_REFUSED` (A2 round 2 / R3):
 * a normal, non-throwing shape-validation failure still refuses
 * `MALFORMED_REFUSED`, exactly as before — only an actual exception anywhere
 * in that sequence is reclassified as `FORMAT_REFUSED`.
 */
export function readCatalogSnapshot(
  bytes: Uint8Array,
  expectedSha256: unknown,
): SnapshotReadResult {
  if (typeof expectedSha256 !== 'string' || !EXPECTED_DIGEST_PATTERN.test(expectedSha256)) {
    return { ok: false, code: 'DIGEST_REFUSED' }
  }

  // Exactly one defensive copy (A2 round 2 / R4, R7); every step below reads
  // `safeBytes` only, never the original `bytes` parameter again.
  const safeBytes = makeDefensiveByteCopy(bytes)
  if (!safeBytes) {
    return { ok: false, code: 'FORMAT_REFUSED' }
  }

  let actualDigest: string
  try {
    actualDigest = createHash('sha256').update(safeBytes).digest('hex')
  } catch {
    return { ok: false, code: 'FORMAT_REFUSED' }
  }
  if (actualDigest !== expectedSha256) {
    return { ok: false, code: 'DIGEST_REFUSED' }
  }

  let shape: EnvelopeShape | null
  try {
    // Reject a byte-order-mark before decoding: canonical bytes never carry
    // one, and stripping it silently (as some decoders do) would defeat the
    // byte-for-byte canonical comparison below.
    if (
      safeBytes.length >= 3 &&
      safeBytes[0] === 0xef &&
      safeBytes[1] === 0xbb &&
      safeBytes[2] === 0xbf
    ) {
      return { ok: false, code: 'FORMAT_REFUSED' }
    }
    const text = new TextDecoder('utf-8', { fatal: true }).decode(safeBytes)
    const parsed: unknown = JSON.parse(text)

    // Round-tripping through JSON.stringify(parsed, null, 2) + "\n" and
    // comparing bytes catches CRLF, duplicate JSON members (JSON.parse keeps
    // only the last), and numeric overflow (e.g. 1e400 -> Infinity -> "null")
    // as one generic mechanism, per the spec's canonical-bytes rule. This
    // stringify call, and the shape walk below, can both throw a stack
    // RangeError on a pathologically deep input (A2 round 2 / R3) — both sit
    // inside this same guard, not a separate one.
    const canonicalBytes = new TextEncoder().encode(`${JSON.stringify(parsed, null, 2)}\n`)
    if (!bytesEqual(safeBytes, canonicalBytes)) {
      return { ok: false, code: 'FORMAT_REFUSED' }
    }
    if (!isRecord(parsed) || parsed.formatVersion !== 'rcm-catalog-snapshot/v1') {
      return { ok: false, code: 'FORMAT_REFUSED' }
    }
    shape = validateEnvelopeShape(parsed)
  } catch {
    return { ok: false, code: 'FORMAT_REFUSED' }
  }
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
  deepFreeze(snapshot)
  READER_ISSUED_SNAPSHOTS.add(snapshot)
  return { ok: true, snapshot }
}
