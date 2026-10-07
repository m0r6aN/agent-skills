import { readCatalogSnapshot, type SnapshotReadResult } from './catalog-snapshot.js'
import { type ProjectionResult, projectEligibility } from './eligibility.js'

export interface CatalogIdentity {
  readonly provider: string
  readonly id: string
}

/** Caller-approved declarations; references and digests do not authenticate evidence. */
export interface AcceptedCatalogSource {
  readonly profileId: string
  readonly profileVersion: string
  readonly canonicalSha256: string
  readonly sourceEvidenceRef: string
  readonly sourceEvidenceSha256: string
  readonly requestedIdentities: readonly CatalogIdentity[]
}

export interface CatalogEligibilityInput {
  readonly canonicalBytes: Uint8Array
  readonly expectedSha256: string
  readonly approvedConfig: {
    readonly authorityRef: string
    readonly endpoints: readonly { readonly provider: string; readonly baseUrl: string }[]
  } | null
  readonly evaluationTimeUtc: string
  readonly identities: readonly CatalogIdentity[]
  readonly acceptedSource: AcceptedCatalogSource
}

export type CatalogAdapterRefusalCode =
  | 'INPUT_REFUSED'
  | 'BOUNDS_REFUSED'
  | 'SOURCE_BINDING_REFUSED'
  | 'SCOPE_REFUSED'

export type CatalogEligibilityResult =
  | { readonly stage: 'adapter'; readonly ok: false; readonly code: CatalogAdapterRefusalCode }
  | { readonly stage: 'reader'; readonly result: Extract<SnapshotReadResult, { ok: false }> }
  | { readonly stage: 'projector'; readonly result: ProjectionResult }

const refusalCodes = new WeakMap<object, CatalogAdapterRefusalCode>()
class Refusal extends Error {
  constructor(code: CatalogAdapterRefusalCode) {
    super(code)
    refusalCodes.set(this, code)
  }
}

const BYTE_LIMIT = 8 * 1024 * 1024
const VALUE_LIMIT = 65536
const typedPrototype = Object.getPrototypeOf(Uint8Array.prototype)
const tagGetter = Object.getOwnPropertyDescriptor(typedPrototype, Symbol.toStringTag)?.get
const lengthGetter = Object.getOwnPropertyDescriptor(typedPrototype, 'byteLength')?.get
const bufferGetter = Object.getOwnPropertyDescriptor(typedPrototype, 'buffer')?.get
const bufferLengthGetter = Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'byteLength')?.get
const resizableGetter = Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'resizable')?.get
const ByteArray = Uint8Array
const isView = ArrayBuffer.isView

function bytesCopy(value: unknown): Uint8Array {
  if (!isView(value) || tagGetter?.call(value) !== 'Uint8Array') throw new Refusal('INPUT_REFUSED')
  const length = lengthGetter?.call(value) as number
  if (length > BYTE_LIMIT) throw new Refusal('BOUNDS_REFUSED')
  const buffer = bufferGetter?.call(value)
  // ArrayBuffer's slot getter rejects SharedArrayBuffer; resizable storage is unsupported.
  bufferLengthGetter?.call(buffer)
  if (resizableGetter?.call(buffer)) throw new Refusal('INPUT_REFUSED')
  // Genuine typed-array constructor path ignores caller iteration and property overrides.
  return new ByteArray(value as Uint8Array)
}

interface Budget {
  remaining: number
  active: Set<object>
  captured: Map<object, Record<string, unknown> | unknown[]>
}

function reserve(budget: Budget, count: number): void {
  if (count > budget.remaining) throw new Refusal('BOUNDS_REFUSED')
  budget.remaining -= count
}

/** Recheck each expanded occurrence using only completed, owned captures. */
function chargeCaptured(value: unknown, budget: Budget, depth: number): void {
  if (depth > 16) throw new Refusal('BOUNDS_REFUSED')
  if (typeof value !== 'object' || value === null) return
  const children = Object.values(value)
  reserve(budget, children.length)
  for (const child of children) chargeCaptured(child, budget, depth + 1)
}

/** Each node is reserved by its parent, including primitives. Never reread caller fields. */
function copy(value: unknown, budget: Budget, depth: number, bytes = false): unknown {
  if (depth > 16) throw new Refusal('BOUNDS_REFUSED')
  if (bytes) return bytesCopy(value)
  if (typeof value === 'string') {
    if (value.length > 4096) throw new Refusal('BOUNDS_REFUSED')
    return value
  }
  if (
    value === null ||
    typeof value === 'boolean' ||
    typeof value === 'number' ||
    value === undefined
  )
    return value
  if (typeof value !== 'object' || budget.active.has(value)) throw new Refusal('INPUT_REFUSED')
  const captured = budget.captured.get(value)
  if (captured) {
    chargeCaptured(captured, budget, depth)
    return captured
  }
  budget.active.add(value)
  try {
    const array = Array.isArray(value)
    const prototype = Object.getPrototypeOf(value)
    if (
      prototype !== (array ? Array.prototype : Object.prototype) &&
      !(prototype === null && !array)
    )
      throw new Refusal('INPUT_REFUSED')
    let length = 0
    if (array) {
      const descriptor = Object.getOwnPropertyDescriptor(value, 'length')
      if (
        !descriptor ||
        !('value' in descriptor) ||
        !Number.isSafeInteger(descriptor.value) ||
        descriptor.value < 0
      )
        throw new Refusal('INPUT_REFUSED')
      length = descriptor.value
      // Before ownKeys, allocation or descent. All public arrays are capped at 256.
      if (length > 256) throw new Refusal('BOUNDS_REFUSED')
      reserve(budget, length)
    }
    const keys = Reflect.ownKeys(value)
    if (array ? keys.length !== length + 1 : keys.length > budget.remaining)
      throw new Refusal(array ? 'INPUT_REFUSED' : 'BOUNDS_REFUSED')
    if (!array) reserve(budget, keys.length)
    const result: Record<string, unknown> | unknown[] = array ? [] : Object.create(null)
    for (const key of keys) {
      if (array && key === 'length') continue
      if (typeof key !== 'string') throw new Refusal('INPUT_REFUSED')
      if (key.length > 4096) throw new Refusal('BOUNDS_REFUSED')
      if (array && (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= length))
        throw new Refusal('INPUT_REFUSED')
      const descriptor = Object.getOwnPropertyDescriptor(value, key)
      if (!descriptor || !('value' in descriptor) || !descriptor.enumerable)
        throw new Refusal('INPUT_REFUSED')
      Object.defineProperty(result, key, {
        value: copy(descriptor.value, budget, depth + 1, depth === 0 && key === 'canonicalBytes'),
        enumerable: true,
        writable: true,
        configurable: true,
      })
    }
    budget.captured.set(value, result)
    return result
  } finally {
    budget.active.delete(value)
  }
}

function record(value: unknown, fields: readonly string[]): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.keys(value).length === fields.length &&
    fields.every((key) => Object.hasOwn(value, key))
  )
}
function nonempty(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}
function digest(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{64}$/.test(value)
}
function identitySet(value: unknown): Set<string> {
  if (!Array.isArray(value) || value.length === 0) throw new Refusal('SCOPE_REFUSED')
  const identities = new Set<string>()
  for (const entry of value) {
    if (!record(entry, ['provider', 'id']) || !nonempty(entry.provider) || !nonempty(entry.id))
      throw new Refusal('SCOPE_REFUSED')
    const key = JSON.stringify([entry.provider, entry.id])
    if (identities.has(key)) throw new Refusal('SCOPE_REFUSED')
    identities.add(key)
  }
  return identities
}
function equalSet(left: Set<string>, right: Set<string>): boolean {
  return left.size === right.size && [...left].every((key) => right.has(key))
}
function freeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null) {
    for (const child of Object.values(value)) freeze(child)
    Object.freeze(value)
  }
  return value
}

/** Pure bounded wrapper. A fabricated reference cannot prove authority or live availability. */
export function evaluateCatalogEligibility(input: unknown): CatalogEligibilityResult {
  try {
    const budget: Budget = { remaining: VALUE_LIMIT - 1, active: new Set(), captured: new Map() }
    const owned = copy(input, budget, 0)
    if (
      !record(owned, [
        'canonicalBytes',
        'expectedSha256',
        'approvedConfig',
        'evaluationTimeUtc',
        'identities',
        'acceptedSource',
      ])
    )
      throw new Refusal('INPUT_REFUSED')
    const source = owned.acceptedSource
    if (
      !record(source, [
        'profileId',
        'profileVersion',
        'canonicalSha256',
        'sourceEvidenceRef',
        'sourceEvidenceSha256',
        'requestedIdentities',
      ]) ||
      !nonempty(source.profileId) ||
      !nonempty(source.profileVersion) ||
      !nonempty(source.sourceEvidenceRef) ||
      !digest(source.canonicalSha256) ||
      !digest(source.sourceEvidenceSha256)
    )
      throw new Refusal('INPUT_REFUSED')
    const identities = identitySet(owned.identities)
    if (!equalSet(identities, identitySet(source.requestedIdentities)))
      throw new Refusal('SCOPE_REFUSED')
    const read = readCatalogSnapshot(owned.canonicalBytes as Uint8Array, owned.expectedSha256)
    if (!read.ok) return freeze({ stage: 'reader', result: read })
    const snapshot = read.snapshot
    if (
      snapshot.digestSha256 !== source.canonicalSha256 ||
      snapshot.sourceRef !== source.sourceEvidenceRef
    )
      throw new Refusal('SOURCE_BINDING_REFUSED')
    // Reader-owned facts are bounded too, without copying/forging the branded snapshot.
    copy(
      { providers: snapshot.providers, models: snapshot.models, sourceRef: snapshot.sourceRef },
      { remaining: VALUE_LIMIT - 1, active: new Set(), captured: new Map() },
      0,
    )
    const modelScope = identitySet(snapshot.models.map(({ provider, id }) => ({ provider, id })))
    const providers = new Set(snapshot.models.map((model) => model.provider))
    if (
      !equalSet(identities, modelScope) ||
      !equalSet(providers, new Set(snapshot.providers.map((provider) => provider.providerKey)))
    )
      throw new Refusal('SCOPE_REFUSED')
    return freeze({
      stage: 'projector',
      result: projectEligibility({
        snapshot,
        approvedConfig: owned.approvedConfig,
        evaluationTimeUtc: owned.evaluationTimeUtc,
        identities: owned.identities,
      }),
    })
  } catch (error) {
    return Object.freeze({
      stage: 'adapter',
      ok: false,
      // WeakMap lookup uses identity only, even for revoked proxies or primitive throws.
      code: refusalCodes.get(error as object) ?? 'INPUT_REFUSED',
    })
  }
}
