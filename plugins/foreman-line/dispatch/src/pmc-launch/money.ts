import { createHash } from 'node:crypto'

type Rational = Readonly<{ numerator: string; denominator: string }>
type Rate = Readonly<{ value: string; unit: 'USD per token' | 'USD per 1M tokens' }>
export type PmcPriceInputV1 = Readonly<{
  version: 'pmc-price/v1'
  currency: 'USD'
  requestDigest: string
  identity: Readonly<{
    bindingId: string
    provider: 'openrouter' | 'opencode'
    providerModelId: string
  }>
  sourceProfileId: string
  sourceProfileVersion: string
  sourceProfileDigest: string
  tariffDigest: string
  priceEvidenceDigest: string
  inputRate: Rate
  outputRate: Rate
  perRequestFeeUsd: string
  otherFees: 'none-attested'
  maximumInputTokens: number
  maximumOutputTokens: number
  rankingTokens: Readonly<{ input: number; output: number }> | null
}>
export type PmcCostValueV1 = Readonly<{
  currency: 'USD'
  maximumMicroUsd: number
  maximumInputTokens: number
  maximumOutputTokens: number
  sourceProfileId: string
  sourceProfileVersion: string
  sourceProfileDigest: string
  tariffDigest: string
  priceEvidenceDigest: string
  costValueDigest: string
  ranking:
    | Readonly<{ kind: 'projected'; inputTokens: number; outputTokens: number; usd: Rational }>
    | Readonly<{ kind: 'unit-price'; outputUsdPerMillion: Rational; inputUsdPerMillion: Rational }>
}>
export type PmcMoneyCodeV1 =
  | 'MONEY_INPUT_INVALID'
  | 'MONEY_LIMIT_EXCEEDED'
  | 'MONEY_UNIT_UNSUPPORTED'
  | 'MONEY_FEE_UNSUPPORTED'
  | 'MONEY_PRECISION_UNSUPPORTED'
  | 'MONEY_OVERFLOW'
export type PmcMoneyResultV1 =
  | Readonly<{ ok: false; code: PmcMoneyCodeV1 }>
  | Readonly<{ ok: true; value: PmcCostValueV1; priceEvidence: PmcPriceInputV1 }>

const MAX = BigInt(Number.MAX_SAFE_INTEGER)
const MILLION = 1000000n
const keys = [
  'version',
  'currency',
  'requestDigest',
  'identity',
  'sourceProfileId',
  'sourceProfileVersion',
  'sourceProfileDigest',
  'tariffDigest',
  'priceEvidenceDigest',
  'inputRate',
  'outputRate',
  'perRequestFeeUsd',
  'otherFees',
  'maximumInputTokens',
  'maximumOutputTokens',
  'rankingTokens',
] as const
const id = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const digest = /^[a-f0-9]{64}$/
const uint = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0
function fail(code: PmcMoneyCodeV1): never {
  throw code
}
function record(v: unknown, names: readonly string[]): Record<string, unknown> {
  if (
    !v ||
    typeof v !== 'object' ||
    Array.isArray(v) ||
    Object.keys(v).length !== names.length ||
    names.some((k) => !Object.hasOwn(v, k))
  )
    fail('MONEY_INPUT_INVALID')
  return v as Record<string, unknown>
}
function text(v: unknown, maximum = 4096): asserts v is string {
  if (typeof v !== 'string' || !v.length) fail('MONEY_INPUT_INVALID')
  if (v.length > maximum) fail('MONEY_LIMIT_EXCEEDED')
}

// Snapshot descriptors, never getters/toJSON; aliases count by expanded size.
function capture(input: unknown): unknown {
  let visits = 0
  let units = 0
  const active = new Set<object>()
  function copy(v: unknown, depth: number): unknown {
    if (++visits > 65536 || depth > 16) fail('MONEY_LIMIT_EXCEEDED')
    if (typeof v === 'string') {
      units += v.length
      if (v.length > 4096 || units > 1048576) fail('MONEY_LIMIT_EXCEEDED')
      return v
    }
    if (v === null || typeof v === 'boolean' || (typeof v === 'number' && Number.isFinite(v)))
      return v
    if (typeof v !== 'object' || active.has(v)) fail('MONEY_INPUT_INVALID')
    const array = Array.isArray(v)
    if (Object.getPrototypeOf(v) !== (array ? Array.prototype : Object.prototype))
      fail('MONEY_INPUT_INVALID')
    active.add(v)
    const result: Record<string, unknown> = {}
    const desc = Object.getOwnPropertyDescriptors(v)
    const names = Reflect.ownKeys(desc)
    if (names.length + visits > 65536) fail('MONEY_LIMIT_EXCEEDED')
    for (const key of names) {
      if (typeof key !== 'string') fail('MONEY_INPUT_INVALID')
      if (array && key === 'length') continue
      visits++
      units += key.length
      const d = desc[key]
      if (!d || !('value' in d) || !d.enumerable || key === 'then' || units > 1048576)
        fail('MONEY_INPUT_INVALID')
      Object.defineProperty(result, key, { value: copy(d.value, depth + 1), enumerable: true })
    }
    active.delete(v)
    if (array) {
      const length = (v as unknown[]).length
      if (names.length !== length + 1 || Object.keys(result).some((k, i) => k !== String(i)))
        fail('MONEY_INPUT_INVALID')
      return Object.freeze(Object.values(result))
    }
    return Object.freeze(result)
  }
  return copy(input, 0)
}
type Fraction = readonly [bigint, bigint]
function mul(a: bigint, b: bigint): bigint {
  if (a.toString().length + b.toString().length > 128) fail('MONEY_PRECISION_UNSUPPORTED')
  return a * b
}
function fraction(n: bigint, d: bigint): Fraction {
  let a = n
  let b = d
  while (b) {
    const r = a % b
    a = b
    b = r
  }
  return [n / a, d / a]
}
function add(a: Fraction, b: Fraction): Fraction {
  const n = mul(a[0], b[1]) + mul(b[0], a[1])
  if (n.toString().length > 128) fail('MONEY_PRECISION_UNSUPPORTED')
  return fraction(n, mul(a[1], b[1]))
}
function scale(a: Fraction, n: bigint): Fraction {
  return fraction(mul(a[0], n), a[1])
}
function decimal(v: unknown): Fraction {
  text(v)
  if (/^(0|[1-9][0-9]{0,15})\.[0-9]{19,}$/.test(v)) fail('MONEY_PRECISION_UNSUPPORTED')
  if (!/^(0|[1-9][0-9]{0,15})(\.[0-9]{1,18})?$/.test(v)) fail('MONEY_INPUT_INVALID')
  const [whole, part = ''] = v.split('.')
  return fraction(BigInt(`${whole}${part}`), 10n ** BigInt(part.length))
}
function rate(v: unknown): { evidence: Rate; perToken: Fraction } {
  const r = record(v, ['value', 'unit'])
  if (r.unit !== 'USD per token' && r.unit !== 'USD per 1M tokens') fail('MONEY_UNIT_UNSUPPORTED')
  const f = decimal(r.value)
  return {
    evidence: Object.freeze({ value: r.value as string, unit: r.unit }),
    perToken: fraction(f[0], mul(f[1], r.unit === 'USD per token' ? 1n : MILLION)),
  }
}
function rational(f: Fraction): Rational {
  if (f.some((v) => v.toString().length > 64)) fail('MONEY_PRECISION_UNSUPPORTED')
  if (mul(f[0], MILLION) > mul(MAX, f[1])) fail('MONEY_OVERFLOW')
  return Object.freeze({ numerator: f[0].toString(), denominator: f[1].toString() })
}

export function computePmcCostV1(input: unknown): PmcMoneyResultV1 {
  try {
    const r = record(capture(input), keys)
    if (r.version !== 'pmc-price/v1' || r.currency !== 'USD') fail('MONEY_INPUT_INVALID')
    for (const key of [
      'requestDigest',
      'sourceProfileDigest',
      'tariffDigest',
      'priceEvidenceDigest',
    ]) {
      if (typeof r[key] !== 'string' || !digest.test(r[key] as string)) fail('MONEY_INPUT_INVALID')
    }
    const identity = record(r.identity, ['bindingId', 'provider', 'providerModelId'])
    if (
      typeof identity.bindingId !== 'string' ||
      !id.test(identity.bindingId) ||
      !['openrouter', 'opencode'].includes(identity.provider as string)
    )
      fail('MONEY_INPUT_INVALID')
    text(identity.providerModelId)
    text(r.sourceProfileId, 2048)
    text(r.sourceProfileVersion, 2048)
    if (!uint(r.maximumInputTokens) || !uint(r.maximumOutputTokens)) fail('MONEY_INPUT_INVALID')
    const inputRate = rate(r.inputRate)
    const outputRate = rate(r.outputRate)
    const fee = decimal(r.perRequestFeeUsd)
    if (r.otherFees !== 'none-attested') fail('MONEY_FEE_UNSUPPORTED')
    const total = (i: number, o: number) =>
      add(add(scale(inputRate.perToken, BigInt(i)), scale(outputRate.perToken, BigInt(o))), fee)
    const maximum = total(r.maximumInputTokens, r.maximumOutputTokens)
    const scaled = mul(maximum[0], MILLION)
    const reserve = (scaled + maximum[1] - 1n) / maximum[1]
    if (reserve > MAX) fail('MONEY_OVERFLOW')
    let ranking: PmcCostValueV1['ranking']
    let rankingTokens: PmcPriceInputV1['rankingTokens'] = null
    if (r.rankingTokens === null) {
      if (fee[0] !== 0n) fail('MONEY_FEE_UNSUPPORTED')
      ranking = Object.freeze({
        kind: 'unit-price',
        outputUsdPerMillion: rational(scale(outputRate.perToken, MILLION)),
        inputUsdPerMillion: rational(scale(inputRate.perToken, MILLION)),
      })
    } else {
      const rank = record(r.rankingTokens, ['input', 'output'])
      if (
        !uint(rank.input) ||
        !uint(rank.output) ||
        rank.input > r.maximumInputTokens ||
        rank.output > r.maximumOutputTokens
      )
        fail('MONEY_INPUT_INVALID')
      rankingTokens = Object.freeze({ input: rank.input, output: rank.output })
      ranking = Object.freeze({
        kind: 'projected',
        inputTokens: rank.input,
        outputTokens: rank.output,
        usd: rational(total(rank.input, rank.output)),
      })
    }
    const evidence: PmcPriceInputV1 = Object.freeze({
      version: 'pmc-price/v1',
      currency: 'USD',
      requestDigest: r.requestDigest as string,
      identity: Object.freeze({
        bindingId: identity.bindingId as string,
        provider: identity.provider as 'openrouter' | 'opencode',
        providerModelId: identity.providerModelId,
      }),
      sourceProfileId: r.sourceProfileId,
      sourceProfileVersion: r.sourceProfileVersion,
      sourceProfileDigest: r.sourceProfileDigest as string,
      tariffDigest: r.tariffDigest as string,
      priceEvidenceDigest: r.priceEvidenceDigest as string,
      inputRate: inputRate.evidence,
      outputRate: outputRate.evidence,
      perRequestFeeUsd: r.perRequestFeeUsd as string,
      otherFees: 'none-attested',
      maximumInputTokens: r.maximumInputTokens,
      maximumOutputTokens: r.maximumOutputTokens,
      rankingTokens,
    })
    if (Buffer.byteLength(JSON.stringify(evidence), 'utf8') > 16384) fail('MONEY_LIMIT_EXCEEDED')
    const costValueDigest = createHash('sha256')
      .update(
        JSON.stringify([
          'pmc-cost-value/v1',
          ...keys.map((k) => evidence[k]),
          Number(reserve),
          ranking,
        ]),
      )
      .digest('hex')
    const value: PmcCostValueV1 = Object.freeze({
      currency: 'USD',
      maximumMicroUsd: Number(reserve),
      maximumInputTokens: evidence.maximumInputTokens,
      maximumOutputTokens: evidence.maximumOutputTokens,
      sourceProfileId: evidence.sourceProfileId,
      sourceProfileVersion: evidence.sourceProfileVersion,
      sourceProfileDigest: evidence.sourceProfileDigest,
      tariffDigest: evidence.tariffDigest,
      priceEvidenceDigest: evidence.priceEvidenceDigest,
      costValueDigest,
      ranking,
    })
    return Object.freeze({ ok: true, value, priceEvidence: evidence })
  } catch (error) {
    const codes: readonly unknown[] = [
      'MONEY_INPUT_INVALID',
      'MONEY_LIMIT_EXCEEDED',
      'MONEY_UNIT_UNSUPPORTED',
      'MONEY_FEE_UNSUPPORTED',
      'MONEY_PRECISION_UNSUPPORTED',
      'MONEY_OVERFLOW',
    ]
    return Object.freeze({
      ok: false,
      code: codes.includes(error) ? (error as PmcMoneyCodeV1) : 'MONEY_INPUT_INVALID',
    })
  }
}
