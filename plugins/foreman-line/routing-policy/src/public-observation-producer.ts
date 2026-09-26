import { createHash } from 'node:crypto'
import type { AcceptedCatalogSource, CatalogIdentity } from './catalog-eligibility-adapter.js'
import { type ModelRecord, readCatalogSnapshot } from './catalog-snapshot.js'

type Identity = CatalogIdentity
type AcceptedSource = AcceptedCatalogSource
export type ProducerCandidate = Readonly<{
  manifestBytes: Uint8Array
  projectionBytes: Uint8Array
  requestedIdentities: readonly Identity[]
  evaluationTimeUtc: string
}>
export type ProducerTrust = Readonly<{
  profileId: 'openrouter-conservative-rcm-v1-intersection'
  profileVersion: 'v2'
  sourceEvidenceRef: string
  expectedManifestSha256: string
  expectedProjectionSha256: string
}>
export type InventoryStatus =
  | 'complete'
  | 'absent'
  | 'missing-required-facts'
  | 'source-invalid'
  | 'unsupported-profile'
export type InventoryCode =
  | 'COMPLETE'
  | 'IDENTITY_ABSENT'
  | 'REASONING_UNKNOWN_REFUSED'
  | 'REQUIRED_FACT_MISSING'
  | 'SOURCE_INVALID'
  | 'UNSUPPORTED_PROFILE'
export type FactField =
  | 'identity'
  | 'baseUrl'
  | 'api'
  | 'input'
  | 'reasoning'
  | 'contextWindow'
  | 'maxTokens'
  | 'cost'
  | 'thinkingLevelMap'
export type InventoryEntry = Readonly<{
  provider: string
  id: string
  status: InventoryStatus
  code: InventoryCode
  fields: readonly FactField[]
}>
export type ProducerRefusalCode =
  | 'INPUT_INVALID'
  | 'INPUT_LIMIT_EXCEEDED'
  | 'DIGEST_MISMATCH'
  | 'UNSUPPORTED_PROFILE'
  | 'SOURCE_INVALID'
  | 'OBSERVATION_TIME_REFUSED'
  | 'INCOMPLETE_SCOPE'
  | 'CANONICAL_READER_REFUSED'
export type ProductionResult =
  | Readonly<{
      ok: true
      evidenceOnly: true
      canonicalBytes: Uint8Array
      digestSha256: string
      acceptedSource: AcceptedSource
      inventory: readonly InventoryEntry[]
      sourceInventory: readonly InventoryEntry[]
    }>
  | Readonly<{
      ok: false
      evidenceOnly: true
      code: ProducerRefusalCode
      inventory: readonly InventoryEntry[]
      sourceInventory: readonly InventoryEntry[]
    }>

const BYTE_LIMIT = 8 * 1024 * 1024
const TOTAL_BYTE_LIMIT = 16 * 1024 * 1024
const DEPTH_LIMIT = 16
const VALUE_LIMIT = 262144
const STRING_LIMIT = 4096
const TOTAL_STRING_LIMIT = 1048576
const ARRAY_LIMIT = 10000
const SCOPE_LIMIT = 256
const FACT_LIST_LIMIT = 64
const PROFILE_ID = 'openrouter-conservative-rcm-v1-intersection'
const PROFILE = `${PROFILE_ID}-v2`
const ENDPOINT = 'https://openrouter.ai/api/v1/models'
const BASE_URL = 'https://openrouter.ai/api/v1'
const REASONING = 'reviewed_profile_inference_from_nonempty_live_supported_efforts'
const UNIT = 'USD per 1M tokens'
const refusalCodes = new WeakMap<object, ProducerRefusalCode>()
class Refusal extends Error {
  constructor(code: ProducerRefusalCode) {
    super(code)
    refusalCodes.set(this, code)
  }
}
function fail(code: ProducerRefusalCode = 'SOURCE_INVALID'): never {
  throw new Refusal(code)
}
function check(
  condition: unknown,
  code: ProducerRefusalCode = 'SOURCE_INVALID',
): asserts condition {
  if (!condition) fail(code)
}
type Obj = Record<string, unknown>
function object(
  value: unknown,
  keys: readonly string[],
  code: ProducerRefusalCode = 'SOURCE_INVALID',
): Obj {
  check(
    value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      !(value instanceof JsonNumber),
    code,
  )
  check(
    Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key)),
    code,
  )
  return value as Obj
}
function text(value: unknown, code: ProducerRefusalCode = 'SOURCE_INVALID'): string {
  check(typeof value === 'string', code)
  check(value.length <= STRING_LIMIT, 'INPUT_LIMIT_EXCEEDED')
  check(value.length > 0 && value.trim() === value, code)
  return value
}
function digest(value: unknown, code: ProducerRefusalCode = 'SOURCE_INVALID'): string {
  const result = text(value, code)
  check(/^[0-9a-f]{64}$/.test(result), code)
  return result
}
function list(value: unknown, limit = ARRAY_LIMIT): unknown[] {
  check(Array.isArray(value))
  check(value.length <= limit, 'INPUT_LIMIT_EXCEEDED')
  return value
}
function strings(value: unknown, limit = ARRAY_LIMIT): string[] {
  const values = list(value, limit).map((entry) => text(entry))
  check(new Set(values).size === values.length)
  return values
}
function same(left: readonly unknown[], right: readonly unknown[]): boolean {
  return left.length === right.length && left.every((entry, index) => entry === right[index])
}
function tuple(identity: Identity): string {
  return JSON.stringify([identity.provider, identity.id])
}
function freeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !ArrayBuffer.isView(value)) {
    for (const child of Object.values(value)) freeze(child)
    Object.freeze(value)
  }
  return value
}

// Envelopes have a shallow closed schema, so reject extra fields before traversing them.
// Every descriptor is captured once, even when requested identities alias one object.
function capture(value: unknown, keys: readonly string[], cache: Map<object, Obj>): Obj {
  check(value !== null && typeof value === 'object', 'INPUT_INVALID')
  const prior = cache.get(value)
  if (prior) return object(prior, keys, 'INPUT_INVALID')
  const prototype = Object.getPrototypeOf(value)
  check(prototype === Object.prototype || prototype === null, 'INPUT_INVALID')
  const ownedKeys = Reflect.ownKeys(value)
  check(
    ownedKeys.length === keys.length &&
      ownedKeys.every((key) => typeof key === 'string' && keys.includes(key)),
    'INPUT_INVALID',
  )
  const owned: Obj = Object.create(null)
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key)
    check(descriptor && 'value' in descriptor && descriptor.enumerable, 'INPUT_INVALID')
    owned[key] = descriptor.value
  }
  cache.set(value, owned)
  return owned
}
function scope(value: unknown, cache: Map<object, Obj>): Identity[] {
  check(Array.isArray(value), 'INPUT_INVALID')
  check(Object.getPrototypeOf(value) === Array.prototype, 'INPUT_INVALID')
  const descriptor = Object.getOwnPropertyDescriptor(value, 'length')
  check(
    descriptor &&
      'value' in descriptor &&
      Number.isSafeInteger(descriptor.value) &&
      descriptor.value > 0,
    'INPUT_INVALID',
  )
  const length: number = descriptor.value
  check(length <= SCOPE_LIMIT, 'INPUT_LIMIT_EXCEEDED')
  const keys = Reflect.ownKeys(value)
  check(keys.length === length + 1, 'INPUT_INVALID')
  const identities: Identity[] = []
  const unique = new Set<string>()
  let units = 0
  for (let i = 0; i < length; i++) {
    const item = Object.getOwnPropertyDescriptor(value, String(i))
    check(item && 'value' in item && item.enumerable, 'INPUT_INVALID')
    const row = capture(item.value, ['provider', 'id'], cache)
    const identity = {
      provider: text(row.provider, 'INPUT_INVALID'),
      id: text(row.id, 'INPUT_INVALID'),
    }
    // Charge expanded occurrences, including aliases; the closed scope shape has
    // depth <= 2 and <= 769 values, both strictly below the general JSON budgets.
    units += identity.provider.length + identity.id.length + 'providerid'.length
    check(units <= TOTAL_STRING_LIMIT, 'INPUT_LIMIT_EXCEEDED')
    const key = tuple(identity)
    check(!unique.has(key), 'INPUT_INVALID')
    unique.add(key)
    identities.push(identity)
  }
  return identities
}

function candidateEnvelope(
  value: unknown,
  cache: Map<object, Obj>,
  onScope: (value: unknown) => void,
): Obj {
  check(value !== null && typeof value === 'object', 'INPUT_INVALID')
  const prototype = Object.getPrototypeOf(value)
  check(prototype === Object.prototype || prototype === null, 'INPUT_INVALID')
  // The scope descriptor is read first and once, so unrelated malformed fields
  // cannot erase valid requested-identity accounting. Never evaluate accessors.
  const descriptor = Object.getOwnPropertyDescriptor(value, 'requestedIdentities')
  check(descriptor && 'value' in descriptor && descriptor.enumerable, 'INPUT_INVALID')
  onScope(descriptor.value)
  const keys = ['manifestBytes', 'projectionBytes', 'requestedIdentities', 'evaluationTimeUtc']
  const ownKeys = Reflect.ownKeys(value)
  check(
    ownKeys.length === keys.length &&
      ownKeys.every((key) => typeof key === 'string' && keys.includes(key)),
    'INPUT_INVALID',
  )
  const result: Obj = Object.create(null)
  result.requestedIdentities = descriptor.value
  for (const key of keys) {
    if (key === 'requestedIdentities') continue
    const field = Object.getOwnPropertyDescriptor(value, key)
    check(field && 'value' in field && field.enumerable, 'INPUT_INVALID')
    result[key] = field.value
  }
  cache.set(value, result)
  return result
}
const typedPrototype = Object.getPrototypeOf(Uint8Array.prototype)
const tagGetter = Object.getOwnPropertyDescriptor(typedPrototype, Symbol.toStringTag)?.get
const byteLengthGetter = Object.getOwnPropertyDescriptor(typedPrototype, 'byteLength')?.get
const bufferGetter = Object.getOwnPropertyDescriptor(typedPrototype, 'buffer')?.get
const bufferLengthGetter = Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'byteLength')?.get
const resizableGetter = Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'resizable')?.get
const detachedGetter = Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'detached')?.get
const ByteArray = Uint8Array
function byteLength(value: unknown): number {
  check(ArrayBuffer.isView(value) && tagGetter?.call(value) === 'Uint8Array', 'INPUT_INVALID')
  const length = byteLengthGetter?.call(value) as number
  check(length <= BYTE_LIMIT, 'INPUT_LIMIT_EXCEEDED')
  const buffer = bufferGetter?.call(value)
  bufferLengthGetter?.call(buffer) // Reject SharedArrayBuffer by internal slot, not caller properties.
  check(!resizableGetter?.call(buffer) && !detachedGetter?.call(buffer), 'INPUT_INVALID')
  return length
}
function hash(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex')
}

// Number tokens remain exact until their field validator runs. In particular, price
// equality is established rationally before the first floating-point conversion.
class JsonNumber {
  constructor(readonly token: string) {}
}
class BoundedJson {
  private at = 0
  private values = 0
  private units = 0
  constructor(private readonly source: string) {}
  parse(): unknown {
    const value = this.value(0)
    this.space()
    check(this.at === this.source.length)
    return value
  }
  private space(): void {
    while (' \t\r\n'.includes(this.source[this.at] ?? '\0')) this.at++
  }
  private string(): string {
    const start = this.at++
    let units = 0
    while (this.at < this.source.length) {
      const char = this.source[this.at++]
      if (char === '"') {
        // Allocation occurs only after the decoded string/key budget is known.
        this.units += units
        check(this.units <= TOTAL_STRING_LIMIT, 'INPUT_LIMIT_EXCEEDED')
        return JSON.parse(this.source.slice(start, this.at)) as string
      }
      if (char === '\\') {
        const escaped = this.source[this.at++]
        if (escaped === 'u') {
          for (let digit = 0; digit < 4; digit++)
            check(/[0-9a-fA-F]/.test(this.source[this.at++] ?? ''))
        } else check(escaped !== undefined && '"\\/bfnrt'.includes(escaped))
      } else check(char !== undefined && char.charCodeAt(0) >= 32)
      units++
      check(units <= STRING_LIMIT, 'INPUT_LIMIT_EXCEEDED')
    }
    return fail()
  }
  private value(depth: number): unknown {
    check(depth <= DEPTH_LIMIT && ++this.values <= VALUE_LIMIT, 'INPUT_LIMIT_EXCEEDED')
    this.space()
    const first = this.source[this.at]
    if (first === '"') return this.string()
    if (first === '[' || first === '{') {
      this.at++
      this.space()
      const array = first === '['
      const end = array ? ']' : '}'
      const result: Obj | unknown[] = array ? [] : Object.create(null)
      let count = 0
      if (this.source[this.at] === end) {
        this.at++
        return result
      }
      while (true) {
        check(++count <= (array ? ARRAY_LIMIT : VALUE_LIMIT), 'INPUT_LIMIT_EXCEEDED')
        if (array) (result as unknown[]).push(this.value(depth + 1))
        else {
          this.space()
          check(this.source[this.at] === '"')
          const key = this.string()
          check(!Object.hasOwn(result, key))
          this.space()
          check(this.source[this.at++] === ':')
          ;(result as Obj)[key] = this.value(depth + 1)
        }
        this.space()
        const next = this.source[this.at++]
        if (next === end) return result
        check(next === ',')
      }
    }
    for (const [token, value] of [
      ['true', true],
      ['false', false],
      ['null', null],
    ] as const) {
      if (this.source.startsWith(token, this.at)) {
        this.at += token.length
        return value
      }
    }
    const start = this.at
    if (this.source[this.at] === '-') this.at++
    const digit = () => {
      const c = this.source.charCodeAt(this.at)
      return c >= 48 && c <= 57
    }
    if (this.source[this.at] === '0') this.at++
    else {
      check(digit() && this.source[this.at] !== '0')
      while (digit()) this.at++
    }
    if (this.source[this.at] === '.') {
      this.at++
      check(digit())
      while (digit()) this.at++
    }
    if (this.source[this.at] === 'e' || this.source[this.at] === 'E') {
      this.at++
      if (this.source[this.at] === '+' || this.source[this.at] === '-') this.at++
      check(digit())
      while (digit()) this.at++
    }
    return new JsonNumber(this.source.slice(start, this.at))
  }
}
function decode(bytes: Uint8Array): unknown {
  check(!(bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf))
  return new BoundedJson(
    new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes),
  ).parse()
}
function integer(value: unknown, minimum = 0): number {
  check(value instanceof JsonNumber)
  const n = Number(value.token)
  check(Number.isSafeInteger(n) && n >= minimum)
  return n
}
type Rational = { coefficient: bigint; scale: number }
function rational(token: string): Rational {
  const match = /^(-?)([0-9]+)(?:\.([0-9]+))?(?:[eE]([+-]?[0-9]+))?$/.exec(token)
  check(match)
  const fraction = match[3] ?? ''
  let digits = `${match[2]}${fraction}`.replace(/^0+/, '')
  if (digits.length === 0) return { coefficient: 0n, scale: 0 }
  const exponent = Number(match[4] ?? '0')
  check(Number.isSafeInteger(exponent))
  let end = digits.length
  while (digits[end - 1] === '0') end--
  const scale = fraction.length - exponent - (digits.length - end)
  digits = digits.slice(0, end)
  // Source prices have at most 64 significant digits. Reject before BigInt allocation.
  check(digits.length <= 64 && Number.isSafeInteger(scale))
  return { coefficient: BigInt(`${match[1]}${digits}`), scale }
}
function equalRational(a: Rational, b: Rational): boolean {
  return a.coefficient === b.coefficient && a.scale === b.scale
}
function price(value: unknown): { unit: string; value: number } {
  const row = object(value, ['value', 'unit', 'sourceValuePerToken'])
  check(row.unit === UNIT && row.value instanceof JsonNumber)
  const source = text(row.sourceValuePerToken)
  check(/^[0-9]+(?:\.[0-9]+)?$/.test(source))
  const parts = source.split('.')
  check(source.replace('.', '').length <= 64 && (parts[1]?.length ?? 0) <= 32)
  const exact = rational(source)
  if (exact.coefficient !== 0n) exact.scale -= 6
  check(equalRational(exact, rational(row.value.token)))
  // Nearest IEEE-754 representation is permitted only when its serialized decimal
  // preserves the exact validated amount; no overflow or nonzero underflow.
  const numeric = Number(row.value.token)
  check(Number.isFinite(numeric) && numeric >= 0 && (numeric !== 0 || exact.coefficient === 0n))
  check(equalRational(exact, rational(String(numeric))))
  return { unit: UNIT, value: numeric }
}
function instant(
  value: unknown,
  milliseconds = false,
): { nanos: bigint; canonical: string; millis: number } {
  const code = 'OBSERVATION_TIME_REFUSED'
  check(typeof value === 'string', code)
  const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})\.(\d{1,9})Z$/.exec(value)
  check(match && (!milliseconds || match[2]?.length === 3), code)
  const fraction = match[2] as string
  const seconds = `${match[1]}.000Z`
  const ms = Date.parse(seconds)
  check(Number.isFinite(ms) && new Date(ms).toISOString() === seconds, code)
  const canonical = `${match[1]}.${fraction.padEnd(3, '0').slice(0, 3)}Z`
  return {
    nanos: BigInt(ms) * 1000000n + BigInt(fraction.padEnd(9, '0')),
    canonical,
    millis: Date.parse(canonical),
  }
}

function entry(
  identity: Identity,
  status: InventoryStatus,
  code: InventoryCode,
  fields: readonly FactField[] = [],
): InventoryEntry {
  return { provider: identity.provider, id: identity.id, status, code, fields }
}
function completeRow(value: unknown, checkedAt: string): ModelRecord {
  const row = object(value, [
    'provider',
    'id',
    'sourceRecordLocator',
    'baseUrl',
    'api',
    'inputModalities',
    'reasoning',
    'contextWindow',
    'maxTokens',
    'cost',
    'thinkingLevelMap',
    'sourceProjectionCheckedAtUtc',
  ])
  check(row.provider === 'openrouter')
  const id = text(row.id)
  const locator = `data[id='${id}']`
  check(row.sourceRecordLocator === locator && row.sourceProjectionCheckedAtUtc === checkedAt)
  const base = object(row.baseUrl, ['value', 'sourceProfile', 'executionAuthority'])
  check(
    base.value === BASE_URL &&
      base.sourceProfile === PROFILE &&
      base.executionAuthority === 'separate approved configuration required',
  )
  const api = object(row.api, ['value', 'sourceProfile'])
  check(api.value === 'openai-completions' && api.sourceProfile === PROFILE)
  const input = object(row.inputModalities, [
    'projected',
    'sourceValue',
    'residualSourceModalities',
    'rule',
  ])
  const modalities = strings(input.sourceValue, FACT_LIST_LIMIT)
  const projected = strings(input.projected, FACT_LIST_LIMIT)
  const residual = strings(input.residualSourceModalities, FACT_LIST_LIMIT)
  check(
    modalities.length > 0 &&
      projected.length > 0 &&
      input.rule === 'intersection(sourceInputModalities,text|image)',
  )
  check(
    same(
      projected,
      modalities.filter((v) => v === 'text' || v === 'image'),
    ) &&
      same(
        residual,
        modalities.filter((v) => v !== 'text' && v !== 'image'),
      ),
  )
  const reasoning = object(row.reasoning, [
    'value',
    'status',
    'sourceField',
    'supportedEfforts',
    'documentedPerModelSchema',
  ])
  check(
    reasoning.value === true &&
      reasoning.status === REASONING &&
      reasoning.sourceField === 'data[].reasoning.supported_efforts' &&
      reasoning.documentedPerModelSchema === false,
  )
  const efforts = strings(reasoning.supportedEfforts, FACT_LIST_LIMIT)
  check(
    efforts.length > 0 &&
      efforts.every((v) => ['max', 'xhigh', 'high', 'medium', 'low', 'none'].includes(v)),
  )
  const expectedLevels = ['max', 'xhigh', 'high', 'medium', 'low', 'off'].filter((v) =>
    efforts.includes(v === 'off' ? 'none' : v),
  )
  check(row.thinkingLevelMap !== null && typeof row.thinkingLevelMap === 'object')
  check(Object.keys(row.thinkingLevelMap).length <= FACT_LIST_LIMIT, 'INPUT_LIMIT_EXCEEDED')
  const levels = object(row.thinkingLevelMap, expectedLevels)
  const thinkingLevelMap: Record<string, string> = {}
  for (const level of expectedLevels) {
    const observed = level === 'off' ? 'none' : level
    check(levels[level] === observed)
    thinkingLevelMap[level] = observed
  }
  const context = object(row.contextWindow, ['value', 'sourceFieldLocator'])
  const max = object(row.maxTokens, ['value', 'sourceFieldLocator'])
  check(
    context.sourceFieldLocator === `${locator}.context_length` &&
      max.sourceFieldLocator === `${locator}.top_provider.max_completion_tokens`,
  )
  const cost = object(row.cost, ['input', 'output'])
  return {
    provider: 'openrouter',
    id,
    baseUrl: BASE_URL,
    api: 'openai-completions',
    input: projected,
    reasoning: true,
    contextWindow: integer(context.value, 1),
    maxTokens: integer(max.value, 1),
    cost: { input: price(cost.input), output: price(cost.output) },
    thinkingLevelMap,
  }
}

function validateSource(
  manifestValue: unknown,
  projectionValue: unknown,
  projectionBytes: Uint8Array,
  evaluation: ReturnType<typeof instant>,
): { models: Map<string, ModelRecord>; sourceInventory: InventoryEntry[]; checkedAt: string } {
  const manifest = object(manifestValue, [
    'evidenceVersion',
    'status',
    'generatedAtUtc',
    'supersedes',
    'sourceScope',
    'ratifiedBindingSource',
    'sealedProjection',
    'mappingProfile',
    'bindings',
    'correctionMap',
    'assessment',
  ])
  check(
    manifest.evidenceVersion === 'rcm-openrouter-pmc-binding-coverage-v3' &&
      manifest.status === 'supplemental-proposal-evidence-not-canonical-snapshot',
  )
  instant(manifest.generatedAtUtc)
  check(same(strings(manifest.supersedes), ['rcm-openrouter-pmc-binding-coverage-v2']))
  const source = object(manifest.sourceScope, [
    'provider',
    'endpoint',
    'requestedIds',
    'requestedIdCount',
    'fullCatalogClaim',
    'responseRuns',
    'exactResponseDigestStableAcrossRepeat',
    'providerDeclaredTime',
  ])
  check(
    source.provider === 'openrouter' &&
      source.endpoint === ENDPOINT &&
      source.fullCatalogClaim === false &&
      source.providerDeclaredTime === null,
  )
  const requested = strings(source.requestedIds)
  check(!requested.includes('typesafe/jev-1.13'))
  check(requested.length > 0 && integer(source.requestedIdCount) === requested.length)
  const projection = object(projectionValue, [
    'formatVersion',
    'sourceProfile',
    'sourceEndpoint',
    'sourceResponseBytesSha256',
    'sourceResponseByteLength',
    'sourceResponseRun',
    'rows',
    'excludedRefusals',
    'thinkingLevelSemantics',
  ])
  check(
    projection.formatVersion === 'rcm-openrouter-conservative-projection/v1' &&
      projection.sourceProfile === PROFILE &&
      projection.sourceEndpoint === ENDPOINT,
  )
  const sealed = object(manifest.sealedProjection, [
    'file',
    'sha256',
    'byteLength',
    'rowCount',
    'excludedRefusalCount',
    'sourceResponseSha256',
    'sourceProfile',
    'serialization',
  ])
  check(
    sealed.file === 'openrouter-rcm-v1-conservative-projection-20260926.json' &&
      sealed.sourceProfile === PROFILE &&
      sealed.serialization === 'UTF-8 JSON bytes of this projection file; exact digest above',
  )
  check(
    digest(sealed.sha256) === hash(projectionBytes) &&
      integer(sealed.byteLength) === projectionBytes.byteLength,
  )
  const responseDigest = digest(projection.sourceResponseBytesSha256)
  const responseLength = integer(projection.sourceResponseByteLength, 1)
  check(digest(sealed.sourceResponseSha256) === responseDigest)
  const selectedRun = integer(projection.sourceResponseRun, 1)
  const runNumbers = new Set<number>()
  const responseDigests = new Set<string>()
  let selected: ReturnType<typeof instant> | undefined
  for (const value of list(source.responseRuns)) {
    const run = object(value, [
      'run',
      'observedRequestStartedAtUtc',
      'observedResponseReceivedAtUtc',
      'canonicalRequestStartedAtUtc',
      'canonicalResponseReceivedAtUtc',
      'status',
      'responseByteLength',
      'responseBytesSha256',
      'modelCount',
      'httpDate',
      'lastModified',
      'etag',
      'authSent',
      'inferenceCalled',
    ])
    const number = integer(run.run, 1)
    check(!runNumbers.has(number))
    runNumbers.add(number)
    const start = instant(run.observedRequestStartedAtUtc)
    const receipt = instant(run.observedResponseReceivedAtUtc)
    check(
      start.nanos <= receipt.nanos && receipt.nanos <= evaluation.nanos,
      'OBSERVATION_TIME_REFUSED',
    )
    check(
      run.canonicalRequestStartedAtUtc === start.canonical &&
        run.canonicalResponseReceivedAtUtc === receipt.canonical,
      'OBSERVATION_TIME_REFUSED',
    )
    check(integer(run.status) === 200 && run.authSent === false && run.inferenceCalled === false)
    const runDigest = digest(run.responseBytesSha256)
    const runLength = integer(run.responseByteLength, 1)
    const modelCount = integer(run.modelCount)
    check(modelCount <= ARRAY_LIMIT, 'INPUT_LIMIT_EXCEEDED')
    check(modelCount >= requested.length)
    for (const key of ['httpDate', 'lastModified', 'etag'])
      check(run[key] === null || typeof run[key] === 'string')
    responseDigests.add(runDigest)
    if (number === selectedRun) {
      check(runDigest === responseDigest && runLength === responseLength)
      selected = receipt
    }
  }
  check(selected && source.exactResponseDigestStableAcrossRepeat === (responseDigests.size === 1))
  check(evaluation.millis - selected.millis <= 86400000, 'OBSERVATION_TIME_REFUSED')
  const profile = object(manifest.mappingProfile, [
    'id',
    'status',
    'inputRule',
    'reasoningRule',
    'thinkingRule',
    'factMapOnly',
    'piConfig',
    'unobservedLevels',
    'mandatoryReasoningOff',
    'runtimeCompatibilityLimitation',
  ])
  check(profile.id === PROFILE && profile.status === 'proposed-not-ratified')
  check(profile.inputRule === 'project source modalities intersect text|image; preserve residuals')
  check(
    profile.reasoningRule ===
      'reasoning=true is a reviewed profile inference from nonempty live supported_efforts, not a documented per-model schema claim; empty/absent supported_efforts -> unknown/refusal',
  )
  check(
    profile.thinkingRule ===
      'exact max/xhigh/high/medium/low map same; exact none maps off; minimal is not invented',
  )
  const semantics = object(projection.thinkingLevelSemantics, [
    'factMapOnly',
    'piConfig',
    'unobservedLevels',
    'mandatoryReasoningOff',
    'runtimeCompatibilityLimitation',
  ])
  for (const object of [profile, semantics])
    check(
      object.factMapOnly === true &&
        object.piConfig === false &&
        object.unobservedLevels === 'deny explicitly' &&
        object.mandatoryReasoningOff === 'refuse',
    )
  check(
    profile.runtimeCompatibilityLimitation ===
      'Pi 0.87.1 may treat omitted levels as supported and send none for omitted off; production bridge must not rely on defaults or clamp',
  )
  check(
    semantics.runtimeCompatibilityLimitation ===
      'Pi 0.87.1 may treat omitted levels as supported and may send none for omitted off; the production bridge must not rely on that defaulting or clamp unobserved levels',
  )
  const models = new Map<string, ModelRecord>()
  const refused = new Set<string>()
  for (const value of list(projection.rows)) {
    const model = completeRow(value, selected.canonical)
    check(!models.has(model.id))
    models.set(model.id, model)
  }
  for (const value of list(projection.excludedRefusals)) {
    const row = object(value, [
      'provider',
      'id',
      'sourceRecordLocator',
      'projectedRcmV1',
      'refusalCode',
      'reason',
    ])
    const id = text(row.id)
    check(
      row.provider === 'openrouter' &&
        row.sourceRecordLocator === `data[id='${id}']` &&
        row.projectedRcmV1 === null &&
        row.refusalCode === 'REASONING_UNKNOWN_REFUSED',
    )
    check(
      row.reason ===
        'reasoning object has no supported_efforts; no reasoning:false value is emitted',
    )
    check(!models.has(id) && !refused.has(id))
    refused.add(id)
  }
  check(
    models.size === integer(sealed.rowCount) &&
      refused.size === integer(sealed.excludedRefusalCount),
  )
  check(
    requested.length === models.size + refused.size &&
      requested.every((id) => models.has(id) || refused.has(id)),
  )
  validateBindings(manifest, models, refused)
  return {
    models,
    checkedAt: selected.canonical,
    sourceInventory: requested.map((id) =>
      models.has(id)
        ? entry({ provider: 'openrouter', id }, 'complete', 'COMPLETE')
        : entry(
            { provider: 'openrouter', id },
            'missing-required-facts',
            'REASONING_UNKNOWN_REFUSED',
            ['reasoning'],
          ),
    ),
  }
}

function validateBindings(
  manifest: Obj,
  models: Map<string, ModelRecord>,
  refused: Set<string>,
): void {
  const baseline = object(manifest.ratifiedBindingSource, [
    'file',
    'table',
    'rows',
    'catalogueResolvedSuccessful',
    'catalogueResolvedRefused',
    'catalogueRefusedBindingNumbers',
    'ownerAttested',
    'ownerAttestedBindingNumbers',
    'accounting',
    'excluded',
  ])
  check(
    baseline.file ===
      'plugins/foreman-line/docs/specs/active/PMC-P0-pi-capability-and-catalogue-baseline.md' &&
      baseline.table === 'AC2',
  )
  check(same(strings(baseline.excluded), ['openrouter/typesafe/jev-1.13']))
  const values = list(manifest.bindings)
  check(integer(baseline.rows) === values.length)
  const identities = new Set<string>()
  const numbers = new Set<number>()
  const owners: number[] = []
  const openrouter = new Set<string>()
  let opencode = 0
  const shared = [
    'bindingNumber',
    'provider',
    'id',
    'laneRoles',
    'resolutionClass',
    'sourceStatus',
    'correctedProjectionStatus',
    'correctedProjectionRcmV1',
  ]
  for (const value of values) {
    check(value !== null && typeof value === 'object' && !Array.isArray(value))
    const provider = (value as Obj).provider
    const rejected = (value as Obj).correctedProjectionStatus === 'REFUSED'
    const row = object(value, [
      ...shared,
      ...(provider === 'opencode'
        ? ['refusalCodes']
        : rejected
          ? ['refusalCodes', 'projectionRowLocator']
          : ['sourceRowLocator', 'reasoningStatus', 'projectionRowLocator']),
    ])
    const id = text(row.id)
    const number = integer(row.bindingNumber, 1)
    check(number <= values.length && !numbers.has(number))
    numbers.add(number)
    const identity = tuple({ provider: text(provider), id })
    check(!identities.has(identity))
    identities.add(identity)
    text(row.laneRoles)
    check(row.resolutionClass === 'owner-attested' || row.resolutionClass === 'catalogue-resolved')
    if (row.resolutionClass === 'owner-attested') owners.push(number)
    if (provider === 'opencode') {
      opencode++
      check(
        row.sourceStatus === 'SOURCE_PROFILE_MISMATCH_REFUSED' &&
          row.correctedProjectionStatus === 'NOT_APPLICABLE' &&
          row.correctedProjectionRcmV1 === null,
      )
      check(
        same(strings(row.refusalCodes), [
          'SOURCE_PROFILE_MISMATCH_REFUSED',
          'CROSS_PROVIDER_EQUIVALENCE_REFUSED',
        ]),
      )
    } else {
      check(
        provider === 'openrouter' && row.sourceStatus === 'OBSERVED_AND_CONSERVATIVELY_PROJECTED',
      )
      openrouter.add(id)
      if (rejected) {
        check(
          refused.has(id) &&
            row.correctedProjectionRcmV1 === null &&
            same(strings(row.refusalCodes), ['REASONING_UNKNOWN_REFUSED']),
        )
        check(row.projectionRowLocator === `excludedRefusals[provider='openrouter',id='${id}']`)
      } else {
        check(
          models.has(id) &&
            row.correctedProjectionStatus === 'SEALED_CONSERVATIVE_PROJECTION' &&
            row.correctedProjectionRcmV1 === 'see sealed projection row' &&
            row.reasoningStatus === REASONING,
        )
        check(
          row.sourceRowLocator === `data[id='${id}']` &&
            row.projectionRowLocator === `rows[provider='openrouter',id='${id}']`,
        )
      }
    }
  }
  check(
    openrouter.size === models.size + refused.size &&
      [...models.keys(), ...refused].every((id) => openrouter.has(id)),
  )
  const attested = list(baseline.ownerAttestedBindingNumbers).map((v) => integer(v, 1))
  const catalogueRefused = list(baseline.catalogueRefusedBindingNumbers).map((v) => integer(v, 1))
  // The closed historical accounting statement below explicitly names binding 7.
  check(same(catalogueRefused, [7]))
  check(same(owners, attested) && integer(baseline.ownerAttested) === owners.length)
  check(
    new Set(catalogueRefused).size === catalogueRefused.length &&
      catalogueRefused.every((n) => numbers.has(n) && !owners.includes(n)),
  )
  const refusedCount = integer(baseline.catalogueResolvedRefused)
  const resolvedCount = integer(baseline.catalogueResolvedSuccessful)
  check(
    refusedCount === catalogueRefused.length &&
      resolvedCount + refusedCount + owners.length === values.length,
  )
  check(
    baseline.accounting ===
      `${resolvedCount} successful catalogue resolutions + ${refusedCount} documented binding-7 zero-match refusal + ${owners.length} owner-attested = ${values.length}`,
  )
  check(
    same(strings(manifest.correctionMap), [
      'Haiku projectedRcmV1 is null with REASONING_UNKNOWN_REFUSED; no reasoning:false emitted',
      'Nonempty supported_efforts to reasoning:true is labeled reviewed profile inference, not documented provider schema',
      'contextWindow and maxTokens carry exact source field locators in sealed projection',
      'Sealed projection digest binds profile and retained source response digest',
      'Historical AC2 accounting corrected to 12 successful catalogue resolutions + 1 binding-7 refusal + 2 owner-attested',
    ]),
  )
  const assessment = object(manifest.assessment, [
    'totalBindings',
    'openrouterScopedBindings',
    'openrouterConservativelyProjectedRcmV1Ready',
    'haikuRefused',
    'openCodeRowsRefused',
    'residualModalitiesPreserved',
    'jev',
  ])
  check(
    integer(assessment.totalBindings) === values.length &&
      integer(assessment.openrouterScopedBindings) === openrouter.size &&
      integer(assessment.openrouterConservativelyProjectedRcmV1Ready) === models.size &&
      integer(assessment.openCodeRowsRefused) === opencode,
  )
  check(
    assessment.haikuRefused === refused.has('anthropic/claude-haiku-4.5') &&
      assessment.residualModalitiesPreserved === true &&
      assessment.jev === 'excluded optional-disabled L6; not part of AC2',
  )
}

/** Offline evidence transformation only. Caller pins express acceptance, not authentication. */
export function producePublicObservationSnapshot(
  candidate: unknown,
  trusted: unknown,
): ProductionResult {
  let identities: Identity[] = []
  let sourceInventory: readonly InventoryEntry[] = []
  let stage: ProducerRefusalCode = 'INPUT_INVALID'
  try {
    const cache = new Map<object, Obj>()
    // Capture trust before any candidate descriptors can run. Invalid trust still
    // permits valid scope accounting, without trusting any candidate-provided pins.
    let trust: Obj | undefined
    let trustFailure: ProducerRefusalCode | undefined
    try {
      trust = capture(
        trusted,
        [
          'profileId',
          'profileVersion',
          'sourceEvidenceRef',
          'expectedManifestSha256',
          'expectedProjectionSha256',
        ],
        cache,
      )
      text(trust.profileId, 'INPUT_INVALID')
      text(trust.profileVersion, 'INPUT_INVALID')
      text(trust.sourceEvidenceRef, 'INPUT_INVALID')
      digest(trust.expectedManifestSha256, 'INPUT_INVALID')
      digest(trust.expectedProjectionSha256, 'INPUT_INVALID')
    } catch (error) {
      trustFailure = refusalCodes.get(error as object) ?? 'INPUT_INVALID'
    }
    const owned = candidateEnvelope(candidate, cache, (value) => {
      identities = scope(value, cache)
    })
    if (trustFailure) fail(trustFailure)
    check(trust, 'INPUT_INVALID')
    check(trust.profileId === PROFILE_ID && trust.profileVersion === 'v2', 'UNSUPPORTED_PROFILE')
    const total = byteLength(owned.manifestBytes) + byteLength(owned.projectionBytes)
    check(total <= TOTAL_BYTE_LIMIT, 'INPUT_LIMIT_EXCEEDED')
    const manifestBytes = new ByteArray(owned.manifestBytes as Uint8Array)
    const projectionBytes = new ByteArray(owned.projectionBytes as Uint8Array)
    check(
      hash(manifestBytes) === trust.expectedManifestSha256 &&
        hash(projectionBytes) === trust.expectedProjectionSha256,
      'DIGEST_MISMATCH',
    )
    stage = 'SOURCE_INVALID'
    const manifest = decode(manifestBytes)
    const projection = decode(projectionBytes)
    const evaluation = instant(owned.evaluationTimeUtc, true)
    const source = validateSource(manifest, projection, projectionBytes, evaluation)
    sourceInventory = source.sourceInventory
    const inventory = identities.map((identity) => {
      if (identity.provider !== 'openrouter')
        return entry(identity, 'unsupported-profile', 'UNSUPPORTED_PROFILE')
      return (
        source.sourceInventory.find((row) => row.id === identity.id) ??
        entry(identity, 'absent', 'IDENTITY_ABSENT', ['identity'])
      )
    })
    if (inventory.some((row) => row.status !== 'complete'))
      return freeze({
        ok: false,
        evidenceOnly: true,
        code: 'INCOMPLETE_SCOPE',
        inventory,
        sourceInventory,
      })
    const sourceRef = trust.sourceEvidenceRef as string
    const document = {
      formatVersion: 'rcm-catalog-snapshot/v1',
      sourceRef,
      providers: [{ providerKey: 'openrouter', checkedAtUtc: source.checkedAt }],
      models: identities.map((identity) => source.models.get(identity.id)),
    }
    const canonicalBytes = new TextEncoder().encode(`${JSON.stringify(document, null, 2)}\n`)
    const digestSha256 = hash(canonicalBytes)
    stage = 'CANONICAL_READER_REFUSED'
    const read = readCatalogSnapshot(canonicalBytes, digestSha256)
    check(read.ok, 'CANONICAL_READER_REFUSED')
    const acceptedSource: AcceptedSource = {
      profileId: PROFILE_ID,
      profileVersion: 'v2',
      canonicalSha256: digestSha256,
      sourceEvidenceRef: sourceRef,
      sourceEvidenceSha256: trust.expectedManifestSha256 as string,
      requestedIdentities: identities,
    }
    return freeze({
      ok: true,
      evidenceOnly: true,
      canonicalBytes,
      digestSha256,
      acceptedSource,
      inventory,
      sourceInventory,
    })
  } catch (error) {
    // Identity-only lookup never reads a thrown primitive, proxy or attacker accessor.
    const code = refusalCodes.get(error as object) ?? stage
    const unsupported = code === 'UNSUPPORTED_PROFILE'
    return freeze({
      ok: false,
      evidenceOnly: true,
      code,
      inventory: identities.map((identity) =>
        entry(
          identity,
          unsupported ? 'unsupported-profile' : 'source-invalid',
          unsupported ? 'UNSUPPORTED_PROFILE' : 'SOURCE_INVALID',
        ),
      ),
      sourceInventory,
    })
  }
}
