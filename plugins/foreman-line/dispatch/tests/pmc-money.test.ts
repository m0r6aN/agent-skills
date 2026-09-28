import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { test } from 'node:test'
import { computePmcCostV1 } from '../src/pmc-launch/money.js'

const price = () => ({
  version: 'pmc-price/v1',
  currency: 'USD',
  requestDigest: 'a'.repeat(64),
  identity: { bindingId: 'binding', provider: 'openrouter', providerModelId: 'model' },
  sourceProfileId: 'profile',
  sourceProfileVersion: '1',
  sourceProfileDigest: 'b'.repeat(64),
  tariffDigest: 'c'.repeat(64),
  priceEvidenceDigest: 'd'.repeat(64),
  inputRate: { value: '0.0000004', unit: 'USD per token' },
  outputRate: { value: '0.0000004', unit: 'USD per token' },
  perRequestFeeUsd: '0.0000001',
  otherFees: 'none-attested',
  maximumInputTokens: 1,
  maximumOutputTokens: 1,
  rankingTokens: { input: 1, output: 1 },
})

test('AC1/4: literal digest fixes flattened tuple and binds request, lexemes and identity', () => {
  const p = price()
  const r = computePmcCostV1(p)
  assert(r.ok)
  const tuple = [
    'pmc-cost-value/v1',
    'pmc-price/v1',
    'USD',
    'a'.repeat(64),
    { bindingId: 'binding', provider: 'openrouter', providerModelId: 'model' },
    'profile',
    '1',
    'b'.repeat(64),
    'c'.repeat(64),
    'd'.repeat(64),
    { value: '0.0000004', unit: 'USD per token' },
    { value: '0.0000004', unit: 'USD per token' },
    '0.0000001',
    'none-attested',
    1,
    1,
    { input: 1, output: 1 },
    1,
    {
      kind: 'projected',
      inputTokens: 1,
      outputTokens: 1,
      usd: { numerator: '9', denominator: '10000000' },
    },
  ]
  assert.equal(
    createHash('sha256').update(JSON.stringify(tuple)).digest('hex'),
    '9819a3f4150c542ab37651337f1ffd39ba16fa726802f16c94cf69f8acc336c3',
  )
  assert.equal(
    r.value.costValueDigest,
    '9819a3f4150c542ab37651337f1ffd39ba16fa726802f16c94cf69f8acc336c3',
  )
  for (const changed of [
    { ...p, requestDigest: 'e'.repeat(64) },
    { ...p, inputRate: { ...p.inputRate, value: '0.00000040' } },
    { ...p, identity: { ...p.identity, providerModelId: 'other' } },
  ]) {
    const next = computePmcCostV1(changed)
    assert(next.ok)
    assert.notEqual(next.value.costValueDigest, r.value.costValueDigest)
  }
  const shuffled = Object.fromEntries(Object.entries(p).reverse())
  assert.deepEqual(computePmcCostV1(shuffled), r)
  p.identity.providerModelId = 'mutated'
  assert.equal(r.priceEvidence.identity.providerModelId, 'model')
  assert(Object.isFrozen(r.priceEvidence.identity))
  assert(Object.isFrozen(r.value.ranking))
})

test('AC1: exact 18 digit precision, zero and total boundary rounding', () => {
  for (const [value, maximum, numerator, denominator] of [
    ['0', 0, '0', '1'],
    ['0.000000000000000001', 1, '1', '1000000000000000000'],
    ['0.000001', 1, '1', '1000000'],
    ['0.000001000000000001', 2, '1000000000001', '1000000000000000000'],
  ] as const) {
    const p = price()
    p.inputRate.value = value
    p.outputRate.value = '0'
    p.perRequestFeeUsd = '0'
    const r = computePmcCostV1(p)
    assert(r.ok)
    assert.equal(r.value.maximumMicroUsd, maximum)
    assert(r.value.ranking.kind === 'projected')
    assert.deepEqual(r.value.ranking.usd, { numerator, denominator })
  }
})

test('AC1: complete P2A rational magnitude domain applies even with safe reservation', () => {
  const p = {
    ...price(),
    rankingTokens: null,
    perRequestFeeUsd: '0',
    outputRate: { value: '0', unit: 'USD per token' },
    inputRate: { value: '9007.199254740991', unit: 'USD per token' },
  }
  const r = computePmcCostV1(p)
  assert(r.ok)
  assert.equal(r.value.ranking.kind, 'unit-price')
  if (r.value.ranking.kind === 'unit-price')
    assert.deepEqual(r.value.ranking.inputUsdPerMillion, {
      numerator: '9007199254740991',
      denominator: '1000000',
    })
  for (const value of ['9007.199254740992', '10000'])
    assert.deepEqual(computePmcCostV1({ ...p, inputRate: { ...p.inputRate, value } }), {
      ok: false,
      code: 'MONEY_OVERFLOW',
    })
  const projected = {
    ...p,
    inputRate: { value: '9007199254.740991', unit: 'USD per token' },
    rankingTokens: { input: 1, output: 0 },
  }
  const maximum = computePmcCostV1(projected)
  assert(maximum.ok)
  assert.equal(maximum.value.maximumMicroUsd, Number.MAX_SAFE_INTEGER)
  assert.deepEqual(
    computePmcCostV1({
      ...projected,
      inputRate: { ...projected.inputRate, value: '9007199254.740992' },
    }),
    { ok: false, code: 'MONEY_OVERFLOW' },
  )
})

test('AC1/5: rate grammar, units, fees, maxima and field bounds refuse rather than coerce', () => {
  for (const value of ['-1', '+1', '01', '1e-6', '.1', '1.', 'Infinity', '10000000000000000'])
    assert.deepEqual(
      computePmcCostV1({ ...price(), inputRate: { value, unit: 'USD per token' } }),
      { ok: false, code: 'MONEY_INPUT_INVALID' },
    )
  assert.deepEqual(
    computePmcCostV1({
      ...price(),
      inputRate: { value: '0.0000000000000000001', unit: 'USD per token' },
    }),
    { ok: false, code: 'MONEY_PRECISION_UNSUPPORTED' },
  )
  assert.deepEqual(
    computePmcCostV1({ ...price(), inputRate: { value: '1', unit: 'USD per 1K tokens' } }),
    { ok: false, code: 'MONEY_UNIT_UNSUPPORTED' },
  )
  for (const otherFees of ['unknown', null, []])
    assert.deepEqual(computePmcCostV1({ ...price(), otherFees }), {
      ok: false,
      code: 'MONEY_FEE_UNSUPPORTED',
    })
  assert.deepEqual(computePmcCostV1({ ...price(), rankingTokens: null }), {
    ok: false,
    code: 'MONEY_FEE_UNSUPPORTED',
  })
  for (const maximumInputTokens of [-1, 1.1, Number.MAX_SAFE_INTEGER + 1, '1', null, Infinity])
    assert.equal(computePmcCostV1({ ...price(), maximumInputTokens }).ok, false)
  assert.equal(computePmcCostV1({ ...price(), rankingTokens: { input: 2, output: 0 } }).ok, false)
  for (const field of ['sourceProfileId', 'sourceProfileVersion']) {
    assert.equal(computePmcCostV1({ ...price(), [field]: 'x'.repeat(2048) }).ok, true)
    assert.deepEqual(computePmcCostV1({ ...price(), [field]: 'x'.repeat(2049) }), {
      ok: false,
      code: 'MONEY_LIMIT_EXCEEDED',
    })
  }
  const million = computePmcCostV1({
    ...price(),
    inputRate: { value: '0.4', unit: 'USD per 1M tokens' },
  })
  assert(million.ok)
  assert.equal(million.value.maximumMicroUsd, 1)
})

test('AC5: capture rejects hostile graphs without invoking accessors or thrown-object properties', () => {
  let calls = 0
  const accessor = {
    ...price(),
    get currency() {
      calls++
      return 'USD'
    },
  }
  assert.equal(computePmcCostV1(accessor).ok, false)
  assert.equal(calls, 0)
  const cycle: Record<string, unknown> = { ...price() }
  cycle.extra = cycle
  for (const bad of [
    cycle,
    { ...price(), extra: true },
    Object.assign(Object.create(null), price()),
    // biome-ignore lint/suspicious/noThenProperty: deliberate hostile thenable fixture
    { ...price(), then: () => undefined },
    { ...price(), extra: Array(3) },
  ])
    assert.equal(computePmcCostV1(bad).ok, false)
  const thrown = new Proxy(
    {},
    {
      get: () => {
        calls++
        throw 0
      },
    },
  )
  assert.equal(
    computePmcCostV1(
      new Proxy(
        {},
        {
          ownKeys: () => {
            throw thrown
          },
        },
      ),
    ).ok,
    false,
  )
  assert.equal(calls, 0)
  let deep: unknown = null
  for (let n = 0; n < 18; n++) deep = { a: deep }
  assert.deepEqual(computePmcCostV1({ ...price(), extra: deep }), {
    ok: false,
    code: 'MONEY_LIMIT_EXCEEDED',
  })
})

test('AC1: sum three exact components before the single upward micro-USD rounding', () => {
  const result = computePmcCostV1(price())
  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.equal(result.value.maximumMicroUsd, 1)
  assert.deepEqual(result.value.ranking, {
    kind: 'projected',
    inputTokens: 1,
    outputTokens: 1,
    usd: { numerator: '9', denominator: '10000000' },
  })
})

test('AC5: serialized evidence accepts exactly 16KiB UTF-8 and refuses the next byte', () => {
  const p = price()
  p.sourceProfileId = 'x'.repeat(2048)
  p.sourceProfileVersion = 'x'.repeat(2048)
  p.identity.providerModelId = ''
  const bytes = 16384 - Buffer.byteLength(JSON.stringify(p), 'utf8')
  p.identity.providerModelId = '界'.repeat(Math.floor(bytes / 3)) + 'x'.repeat(bytes % 3)
  assert(p.identity.providerModelId.length <= 4096)
  assert.equal(Buffer.byteLength(JSON.stringify(p), 'utf8'), 16384)
  assert.equal(computePmcCostV1(p).ok, true)
  p.identity.providerModelId += 'x'
  assert.deepEqual(computePmcCostV1(p), { ok: false, code: 'MONEY_LIMIT_EXCEEDED' })
})
