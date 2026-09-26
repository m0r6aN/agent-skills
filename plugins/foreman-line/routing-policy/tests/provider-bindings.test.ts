import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import {
  type BindingEvidenceV1,
  type EvidenceValue,
  PMC_LANE_POLICIES_V1,
  type ProviderBindingPolicyV1,
  providerBindingPolicyV1Schema,
  validateProviderBindingPolicyV1,
} from '../src/index.js'

const baseline = JSON.parse(
  readFileSync(new URL('./fixtures/pmc-provider-binding-policy-v1.json', import.meta.url), 'utf8'),
)
const fixture = () => structuredClone(baseline)
const recorded = (value: unknown) => ({
  status: 'recorded',
  value,
  evidenceRef: 'synthetic-test-only',
})

test('all fifteen canonical declarations validate losslessly with six frozen lanes', () => {
  const input = fixture()
  const result = validateProviderBindingPolicyV1(input)
  assert.equal(result.valid, true, JSON.stringify(result))
  if (!result.valid) return
  const policy: ProviderBindingPolicyV1 = result.value
  assert.deepEqual(policy, input)
  assert.equal(policy.bindings.length, 15)
  assert.equal(policy.lanes.length, 6)
  assert.deepEqual(policy.lanes, PMC_LANE_POLICIES_V1)
  assert.notEqual(policy, input)
  assert.notEqual(policy.bindings[0], input.bindings[0])
  assert.throws(() =>
    Object.assign(policy.bindings[0]?.eligibility.toolUse ?? {}, {
      status: 'recorded',
      value: true,
    }),
  )
  input.bindings.reverse()
  assert.equal(policy.bindings[0]?.bindingId, '1')
  const frozen = (value: unknown): void => {
    if (value !== null && typeof value === 'object') {
      assert.equal(Object.isFrozen(value), true)
      Object.values(value).forEach(frozen)
    }
  }
  frozen(policy)
  frozen(providerBindingPolicyV1Schema)
})

test('v1 rejects missing policy with typed errors and never throws', () => {
  for (const input of [null, undefined, {}, [], 'policy', 1, true]) {
    const result = validateProviderBindingPolicyV1(input)
    assert.equal(result.valid, false)
    if (!result.valid) {
      assert.ok(result.errors.length > 0)
      assert.equal(typeof result.errors[0]?.code, 'string')
      assert.equal(typeof result.errors[0]?.path, 'string')
    }
  }
})

test('v1 rejects hostile objects without invoking accessors, iterators or toJSON', () => {
  let calls = 0
  const accessor = Object.defineProperty({}, 'schemaVersion', {
    get() {
      calls++
      throw Error()
    },
  })
  const cycle: Record<string, unknown> = {}
  cycle.self = cycle
  const revoked = Proxy.revocable({}, {})
  revoked.revoke()
  for (const input of [
    accessor,
    cycle,
    revoked.proxy,
    {
      toJSON() {
        calls++
      },
    },
    {
      [Symbol.iterator]() {
        calls++
      },
    },
    Array(2), // Deliberately sparse hostile input.
    Infinity,
    new Date(),
  ]) {
    assert.equal(validateProviderBindingPolicyV1(input).valid, false)
  }
  assert.equal(calls, 0)
})

const reject = (mutate: (input: ReturnType<typeof fixture>) => void, code?: string) => {
  const input = fixture()
  mutate(input)
  const result = validateProviderBindingPolicyV1(input)
  assert.equal(result.valid, false)
  if (!result.valid && code)
    assert.ok(
      result.errors.some((error) => error.code === code),
      JSON.stringify(result),
    )
}

for (const [name, mutate, code] of [
  [
    'duplicate candidate ids',
    (x: ReturnType<typeof fixture>) => {
      x.candidates[1].logicalCandidateId = x.candidates[0].logicalCandidateId
      x.candidates[1].family.reason = 'a different observation'
    },
    'DUPLICATE_ID',
  ],
  [
    'duplicate binding ids',
    (x: ReturnType<typeof fixture>) => {
      x.bindings[1].bindingId = '1'
    },
    'DUPLICATE_ID',
  ],
  [
    'missing candidate',
    (x: ReturnType<typeof fixture>) => {
      x.bindings[0].logicalCandidateId = 'missing'
    },
    'MISSING_CANDIDATE',
  ],
  [
    'duplicate provider/model identity',
    (x: ReturnType<typeof fixture>) => {
      x.bindings[1].providerModelId = x.bindings[0].providerModelId
      x.bindings[1].piHostModelId = x.bindings[0].piHostModelId
    },
    'DUPLICATE_PROVIDER_MODEL',
  ],
  [
    'wrong explicit Pi identity',
    (x: ReturnType<typeof fixture>) => {
      x.bindings[0].piHostModelId = 'openrouter/anthropic/claude-opus-5.5'
    },
    'PI_IDENTITY_MISMATCH',
  ],
  [
    'missing occurrence binding',
    (x: ReturnType<typeof fixture>) => {
      x.laneBindings[0].bindingId = 'missing'
    },
    'MISSING_BINDING',
  ],
  [
    'duplicate occurrence with reversed role',
    (x: ReturnType<typeof fixture>) => {
      x.laneBindings.push({ ...x.laneBindings[0], matrixRole: 'fallback', fallbackBindingId: null })
    },
    'DUPLICATE_OCCURRENCE',
  ],
  [
    'self fallback',
    (x: ReturnType<typeof fixture>) => {
      x.laneBindings[0].fallbackBindingId = '1'
    },
    'FALLBACK_INVALID',
  ],
  [
    'dangling fallback',
    (x: ReturnType<typeof fixture>) => {
      x.laneBindings[0].fallbackBindingId = 'missing'
    },
    'FALLBACK_INVALID',
  ],
  [
    'wrong lane fallback',
    (x: ReturnType<typeof fixture>) => {
      x.laneBindings[0].fallbackBindingId = '4'
    },
    'FALLBACK_INVALID',
  ],
  [
    'primary to primary fallback',
    (x: ReturnType<typeof fixture>) => {
      x.laneBindings[0].fallbackBindingId = '9'
    },
    'FALLBACK_INVALID',
  ],
  [
    'provider pin escape',
    (x: ReturnType<typeof fixture>) => {
      x.laneBindings[0].fallbackBindingId = '10'
    },
    'FALLBACK_INVALID',
  ],
  [
    'cross-provider unpinned fallback',
    (x: ReturnType<typeof fixture>) => {
      x.laneBindings[8].fallbackBindingId = '12'
    },
    'FALLBACK_INVALID',
  ],
  [
    'third attempt from terminal fallback',
    (x: ReturnType<typeof fixture>) => {
      x.laneBindings[1].fallbackBindingId = '9'
    },
    'FALLBACK_INVALID',
  ],
  [
    'primary with no fallback',
    (x: ReturnType<typeof fixture>) => {
      x.laneBindings[0].fallbackBindingId = null
    },
    'FALLBACK_INVALID',
  ],
  [
    'held binding claiming data eligibility',
    (x: ReturnType<typeof fixture>) => {
      x.bindings[6].eligibility.dataClasses = recorded(['public'])
    },
    'HELD_BINDING_NOT_ELIGIBLE',
  ],
  [
    'held binding claiming enablement',
    (x: ReturnType<typeof fixture>) => {
      x.bindings[6].eligibility.enabled = recorded(true)
    },
    'HELD_BINDING_NOT_ELIGIBLE',
  ],
  [
    'held binding claiming availability',
    (x: ReturnType<typeof fixture>) => {
      x.bindings[6].eligibility.availability = recorded({
        available: true,
        checkedAtUtc: '2026-09-26T00:00:00Z',
        attestationRef: 'synthetic',
        evidenceState: 'live-availability',
      })
    },
    'HELD_BINDING_NOT_ELIGIBLE',
  ],
  [
    'identity refusals represented as resolved',
    (x: ReturnType<typeof fixture>) => {
      x.bindings[6].identityState = 'catalog-recorded'
    },
    'IDENTITY_REFUSAL_STATE',
  ],
  [
    'held identity erasing all refusals',
    (x: ReturnType<typeof fixture>) => {
      x.bindings[6].identityRefusalCodes = []
    },
    'IDENTITY_REFUSAL_STATE',
  ],
  [
    'nonpublic data with unknown transport',
    (x: ReturnType<typeof fixture>) => {
      x.bindings[8].eligibility.transportRequirements = {
        status: 'unknown',
        reason: 'not observed',
      }
    },
    'NONPUBLIC_TRANSPORT_REQUIRED',
  ],
  [
    'nonpublic data with collection allowed',
    (x: ReturnType<typeof fixture>) => {
      x.bindings[8].eligibility.transportRequirements.value.data_collection = 'allow'
    },
    'NONPUBLIC_TRANSPORT_REQUIRED',
  ],
  [
    'nonpublic data without ZDR',
    (x: ReturnType<typeof fixture>) => {
      x.bindings[8].eligibility.transportRequirements.value.zdr = false
    },
    'NONPUBLIC_TRANSPORT_REQUIRED',
  ],
  [
    'quality transferred to unused lane',
    (x: ReturnType<typeof fixture>) => {
      x.bindings[0].eligibility.qualityByLane = recorded([
        { lane: 'L3', score: 1, evidenceRef: 'synthetic-L3', evidenceState: 'model-quality' },
      ])
    },
    'QUALITY_LANE_INVALID',
  ],
  [
    'duplicate lane score',
    (x: ReturnType<typeof fixture>) => {
      x.bindings[0].eligibility.qualityByLane = recorded([
        { lane: 'L1', score: 0.5, evidenceRef: 'one', evidenceState: 'model-quality' },
        { lane: 'L1', score: 0.8, evidenceRef: 'two', evidenceState: 'model-quality' },
      ])
    },
    'QUALITY_LANE_INVALID',
  ],
  [
    'OpenRouter classifier declaration',
    (x: ReturnType<typeof fixture>) => {
      x.laneBindings[20].bindingId = '14'
    },
    'L6_BINDING_REFUSED',
  ],
] as const)
  test(`v1 rejects ${name}`, () => reject(mutate, code))

for (const [name, mutate] of [
  [
    'frontier relaxation',
    (x: ReturnType<typeof fixture>) => {
      x.lanes[0].frontierOnly = false
    },
  ],
  [
    'independence relaxation',
    (x: ReturnType<typeof fixture>) => {
      x.lanes[1].independence = 'no-authority'
    },
  ],
  [
    'authority promotion',
    (x: ReturnType<typeof fixture>) => {
      x.lanes[5].authorityCap = x.lanes[2].authorityCap
    },
  ],
  [
    'L6 enablement',
    (x: ReturnType<typeof fixture>) => {
      x.lanes[5].enabled = true
    },
  ],
  [
    'provider pin redefinition',
    (x: ReturnType<typeof fixture>) => {
      x.lanes[0].providerRule.providers = ['openrouter']
    },
  ],
  [
    'quality tolerance relaxation',
    (x: ReturnType<typeof fixture>) => {
      x.lanes[2].qualityTolerance = 0.1
    },
  ],
  [
    'unknown family claiming independence',
    (x: ReturnType<typeof fixture>) => {
      x.candidates[0].family.independent = true
    },
  ],
  [
    'unknown capability claiming true',
    (x: ReturnType<typeof fixture>) => {
      x.bindings[0].eligibility.toolUse.value = true
    },
  ],
  [
    'unattested quality score',
    (x: ReturnType<typeof fixture>) => {
      x.bindings[0].eligibility.qualityByLane = { status: 'recorded', value: [] }
    },
  ],
  [
    'invented new-class budget ceiling',
    (x: ReturnType<typeof fixture>) => {
      x.lanes[2].budgetPolicyRef[0].ceilingUsd = 25
    },
  ],
  [
    'budget becoming dispatchable',
    (x: ReturnType<typeof fixture>) => {
      x.lanes[2].budgetPolicyRef[0].status = 'existing-policy'
    },
  ],
  [
    'waived budget with missing estimates',
    (x: ReturnType<typeof fixture>) => {
      x.lanes[4].rankingRequirements.missingEstimates = 'waive-budget'
    },
  ],
  [
    'human gate removal',
    (x: ReturnType<typeof fixture>) => {
      x.lanes[0].humanGates.pop()
    },
  ],
  [
    'quality not lane scoped',
    (x: ReturnType<typeof fixture>) => {
      x.lanes[4].rankingRequirements.qualityEvidence = 'R7-global'
    },
  ],
  [
    'unknown root keys',
    (x: ReturnType<typeof fixture>) => {
      x.launchAuthorized = true
    },
  ],
  [
    'unknown binding keys',
    (x: ReturnType<typeof fixture>) => {
      x.bindings[0].available = true
    },
  ],
  [
    'unknown provenance keys',
    (x: ReturnType<typeof fixture>) => {
      x.provenance.authenticated = true
    },
  ],
  [
    'wrong cost unit',
    (x: ReturnType<typeof fixture>) => {
      x.bindings[1].eligibility.rates.value.unit = 'USD per token'
    },
  ],
  [
    'negative price',
    (x: ReturnType<typeof fixture>) => {
      x.bindings[1].eligibility.rates.value.input = -1
    },
  ],
  [
    'unsafe context integer',
    (x: ReturnType<typeof fixture>) => {
      x.bindings[1].eligibility.contextWindow.value = Number.MAX_SAFE_INTEGER + 1
    },
  ],
  [
    'fractional token limit',
    (x: ReturnType<typeof fixture>) => {
      x.bindings[1].eligibility.maxTokens.value = 0.5
    },
  ],
  [
    'duplicate modalities',
    (x: ReturnType<typeof fixture>) => {
      x.bindings[1].eligibility.inputModalities.value = ['text', 'text']
    },
  ],
  [
    'unknown recorded family without source',
    (x: ReturnType<typeof fixture>) => {
      x.candidates[0].family = { status: 'recorded', value: 'family' }
    },
  ],
] as const)
  test(`v1 schema rejects ${name}`, () => reject(mutate, 'SCHEMA_INVALID'))

test('v1 preserves lane-scoped quality as claims without transferring or authenticating it', () => {
  const input = fixture()
  input.bindings[0].eligibility.qualityByLane = recorded([
    { lane: 'L1', score: 0.9, evidenceRef: 'synthetic-L1-only', evidenceState: 'model-quality' },
  ])
  const result = validateProviderBindingPolicyV1(input)
  assert.equal(result.valid, true, JSON.stringify(result))
  if (result.valid)
    assert.deepEqual(
      result.value.bindings[0]?.eligibility.qualityByLane,
      input.bindings[0].eligibility.qualityByLane,
    )
})

test('v1 preserves reversed L1/L2 terminal pairs and off-pin historical pairs', () => {
  const result = validateProviderBindingPolicyV1(fixture())
  assert.equal(result.valid, true)
  if (!result.valid) return
  assert.deepEqual(
    result.value.laneBindings.slice(0, 8).map((x) => [x.lane, x.bindingId, x.fallbackBindingId]),
    [
      ['L1', '1', '2'],
      ['L1', '2', null],
      ['L1', '9', '10'],
      ['L1', '10', null],
      ['L2', '2', '1'],
      ['L2', '1', null],
      ['L2', '10', '9'],
      ['L2', '9', null],
    ],
  )
  assert.equal(result.value.lanes[0]?.providerRule.mode, 'pin')
  assert.deepEqual(result.value.lanes[0]?.providerRule.providers, ['opencode'])
})

test('baseline preserves every live/quality/family unknown and owner identity hold', () => {
  assert.ok(baseline.lanes[1].humanGates.includes('coordinator-acceptance'))
  for (const binding of baseline.bindings) {
    for (const key of ['toolUse', 'structuredOutput', 'availability', 'qualityByLane'])
      assert.equal(binding.eligibility[key].status, 'unknown')
    assert.deepEqual(binding.eligibility.enabled.value, false)
    assert.equal(binding.providerModelId.includes('jev'), false)
  }
  for (const candidate of baseline.candidates) assert.equal(candidate.family.status, 'unknown')
  for (const index of [0, 9]) {
    const binding = baseline.bindings[index]
    assert.equal(binding.identityState, 'owner-attested')
    assert.equal(binding.protocol.status, 'unknown')
    assert.equal(binding.catalogBaseUrl.status, 'unknown')
    for (const key of [
      'contextWindow',
      'maxTokens',
      'rates',
      'reasoning',
      'thinkingLevels',
      'inputModalities',
    ])
      assert.equal(binding.eligibility[key].status, 'unknown')
  }
  assert.equal(baseline.bindings[0].piHostModelId, 'opencode/claude-opus-5-5')
  assert.equal(baseline.bindings[9].piHostModelId, 'openrouter/anthropic/claude-opus-5.5')
  assert.deepEqual(baseline.bindings[6].identityRefusalCodes, [
    'AC2A_ZERO_MATCH',
    'AC2A_WRONG_PROVIDER',
    'AC2A_PREFIX_ALIAS_REFUSED',
  ])
  assert.equal(baseline.provenance.freshnessAcceptance, 'not-accepted')
  assert.equal(baseline.provenance.evidenceState, 'static-conformance')
})

test('SCF-1/2/3 preserve protocol and catalogue endpoints without identity refusals', () => {
  const result = validateProviderBindingPolicyV1(fixture())
  assert.equal(result.valid, true)
  for (const [index, endpoint, protocol] of [
    [1, 'https://opencode.ai/zen/v1', 'openai-responses'],
    [3, 'https://opencode.ai/zen', 'anthropic-messages'],
    [10, 'https://openrouter.ai/api', 'anthropic-messages'],
    [14, 'https://openrouter.ai/api', 'anthropic-messages'],
  ] as const) {
    assert.equal(baseline.bindings[index].catalogBaseUrl.value, endpoint)
    assert.equal(baseline.bindings[index].protocol.value, protocol)
    assert.deepEqual(baseline.bindings[index].identityRefusalCodes, [])
  }
})

test('all canonical arrays retain declaration order including unused candidates', () => {
  const input = fixture()
  input.candidates.push({
    logicalCandidateId: 'unused',
    family: { status: 'unknown', reason: 'not yet declared' },
  })
  for (const key of ['candidates', 'bindings', 'lanes', 'laneBindings']) input[key].reverse()
  const result = validateProviderBindingPolicyV1(input)
  assert.equal(result.valid, true)
  if (result.valid) assert.deepEqual(result.value, input)
})

test('semantic error list caps at 128 with final truncation marker', () => {
  const input = fixture()
  input.bindings = Array.from({ length: 256 }, (_, index) => ({
    ...input.bindings[0],
    bindingId: String(index),
    logicalCandidateId: 'missing',
  }))
  const result = validateProviderBindingPolicyV1(input)
  assert.equal(result.valid, false)
  if (!result.valid) {
    assert.equal(result.errors.length, 128)
    assert.equal(result.errors[127]?.code, 'ERRORS_TRUNCATED')
  }
})

for (const [key, limit] of [
  ['candidates', 256],
  ['bindings', 256],
  ['lanes', 6],
  ['laneBindings', 1536],
] as const) {
  test(`plain-data bound rejects ${key} over ${limit}`, () =>
    reject((x) => {
      x[key] = Array(limit + 1).fill(null)
    }, 'PLAIN_DATA_REFUSED'))
}

test('plain-data bounds reject oversized strings, aggregate strings, deep input and excessive visits', () => {
  const nested = { value: {} }
  let cursor = nested.value
  for (let index = 0; index < 17; index++) {
    const child = { value: {} }
    Object.assign(cursor, child)
    cursor = child.value
  }
  for (const input of [
    { value: 'x'.repeat(2049) },
    Array(513).fill('x'.repeat(2048)),
    nested,
    Array.from({ length: 256 }, () => Array(256).fill(null)),
    { value: NaN },
    { value: -Infinity },
    { value: 1n },
  ]) {
    const result = validateProviderBindingPolicyV1(input)
    assert.equal(result.valid, false)
    if (!result.valid) assert.equal(result.errors[0]?.code, 'PLAIN_DATA_REFUSED')
  }
})

test('readonly TypeScript evidence contract agrees with all recorded schema branches', () => {
  const record = <T>(value: T): EvidenceValue<T> => ({
    status: 'recorded',
    value,
    evidenceRef: 'synthetic-only',
  })
  const evidence: BindingEvidenceV1 = {
    dataClasses: record(['public', 'internal', 'restricted']),
    transportRequirements: record({ data_collection: 'deny', zdr: true }),
    toolUse: record(true),
    structuredOutput: record(false),
    reasoning: record(true),
    inputModalities: record(['text', 'image']),
    thinkingLevels: record(['low', 'high']),
    contextWindow: record(200000),
    maxTokens: record(1000),
    rates: record({ input: 0, output: 1.5, unit: 'USD per 1M tokens' }),
    enabled: record(false),
    availability: record({
      available: false,
      checkedAtUtc: '2026-09-26T00:00:00Z',
      attestationRef: 'synthetic',
      evidenceState: 'live-availability',
    }),
    qualityByLane: record([
      { lane: 'L1', score: 0, evidenceRef: 'synthetic-L1', evidenceState: 'model-quality' },
    ]),
  }
  const base = validateProviderBindingPolicyV1(fixture())
  assert.ok(base.valid)
  const input: ProviderBindingPolicyV1 = {
    ...base.value,
    candidates: base.value.candidates.map((candidate) => ({
      ...candidate,
      family: record('declared-test-family'),
    })),
    bindings: base.value.bindings.map((binding, index) =>
      index === 1 ? { ...binding, eligibility: evidence } : binding,
    ),
  }
  const result = validateProviderBindingPolicyV1(input)
  assert.ok(result.valid, JSON.stringify(result))
  assert.deepEqual(result.value, input)
})

test('literal identity text is retained without normalization or inference', () => {
  const input = fixture()
  input.bindings[0].providerModelId = ' Exact-Identity/Case '
  input.bindings[0].piHostModelId = 'opencode/ Exact-Identity/Case '
  const result = validateProviderBindingPolicyV1(input)
  assert.ok(result.valid, JSON.stringify(result))
  assert.deepEqual(result.value.bindings[0], input.bindings[0])
  for (const mutation of [
    'opencode/claude-opus-5-5 ',
    'OPENCODE/claude-opus-5-5',
    'claude-opus-5-5',
  ]) {
    reject((x) => {
      x.bindings[0].piHostModelId = mutation
    }, 'PI_IDENTITY_MISMATCH')
  }
})

test('every unknown evidence alternative rejects hidden recorded facts', () => {
  for (const field of Object.keys(baseline.bindings[0].eligibility)) {
    reject((input) => {
      input.bindings[0].eligibility[field] = {
        status: 'unknown',
        reason: 'not observed',
        value: true,
      }
    }, 'SCHEMA_INVALID')
  }
})

test('descriptor boundaries reject nested getters, symbol properties and throwing proxy traps', () => {
  let calls = 0
  const input = fixture()
  Object.defineProperty(input.bindings[0].eligibility, 'toolUse', {
    get() {
      calls++
      return recorded(true)
    },
    enumerable: true,
  })
  const hidden = Object.defineProperty({}, 'hidden', { value: true })
  for (const value of [
    input,
    hidden,
    Object.assign([], { extra: true }),
    new Proxy(
      {},
      {
        ownKeys() {
          throw Error('trap')
        },
      },
    ),
    new Proxy(
      {},
      {
        getPrototypeOf() {
          throw Error('trap')
        },
      },
    ),
    new Proxy(
      { x: 1 },
      {
        getOwnPropertyDescriptor() {
          throw Error('trap')
        },
      },
    ),
  ]) {
    const result = validateProviderBindingPolicyV1(value)
    assert.equal(result.valid, false)
    if (!result.valid) assert.equal(result.errors[0]?.code, 'PLAIN_DATA_REFUSED')
  }
  assert.equal(calls, 0)
})

test('snapshot never rereads caller properties or invokes caller array iterators', () => {
  const input = fixture()
  let gets = 0
  const descriptors = new Map<PropertyKey, number>()
  input.bindings = new Proxy(input.bindings, {
    get() {
      gets++
      throw Error('caller iterator/property')
    },
  })
  const proxy = new Proxy(input, {
    get() {
      gets++
      throw Error('caller graph reread')
    },
    getOwnPropertyDescriptor(target, key) {
      descriptors.set(key, (descriptors.get(key) ?? 0) + 1)
      return Reflect.getOwnPropertyDescriptor(target, key)
    },
  })
  const result = validateProviderBindingPolicyV1(proxy)
  assert.ok(result.valid, JSON.stringify(result))
  assert.equal(gets, 0)
  assert.ok([...descriptors.values()].every((count) => count === 1))
})

test('root array cardinality is checked before reading children and noncanonical keys refuse', () => {
  let children = 0
  const oversized = Array(257).fill(null)
  Object.defineProperty(oversized, '0', {
    get() {
      children++
      throw Error('child accessed')
    },
  })
  reject((input) => {
    input.bindings = oversized
  }, 'PLAIN_DATA_REFUSED')
  assert.equal(children, 0)
  const noncanonical = Object.assign([null], { '01': null })
  assert.equal(validateProviderBindingPolicyV1(noncanonical).valid, false)
})

test('visited-value boundary excludes an array length property and is order-independent', () => {
  const atBoundary = Array(65535).fill(null)
  const overBoundary = Array(65536).fill(null)
  const aboveBoundary = Array(65537).fill(null)
  const atResult = validateProviderBindingPolicyV1(atBoundary)
  const overResult = validateProviderBindingPolicyV1(overBoundary)
  const aboveResult = validateProviderBindingPolicyV1(aboveBoundary)
  assert.equal(atResult.valid, false)
  assert.equal(overResult.valid, false)
  assert.equal(aboveResult.valid, false)
  if (!atResult.valid) assert.equal(atResult.errors[0]?.code, 'SCHEMA_INVALID')
  if (!overResult.valid) assert.equal(overResult.errors[0]?.code, 'PLAIN_DATA_REFUSED')
  if (!aboveResult.valid) assert.equal(aboveResult.errors[0]?.code, 'PLAIN_DATA_REFUSED')

  const first = Object.fromEntries(Array.from({ length: 65535 }, (_, index) => [`k${index}`, null]))
  const second = Object.fromEntries(Object.entries(first).reverse())
  const firstResult = validateProviderBindingPolicyV1(first)
  const secondResult = validateProviderBindingPolicyV1(second)
  assert.equal(firstResult.valid, false)
  assert.equal(secondResult.valid, false)
  if (!firstResult.valid) assert.equal(firstResult.errors[0]?.code, 'SCHEMA_INVALID')
  if (!secondResult.valid) assert.equal(secondResult.errors[0]?.code, 'SCHEMA_INVALID')
})
