import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { Ajv } from 'ajv'
import {
  projectProviderBindingsV1,
  providerBindingPolicyV1Schema,
  providerBindingProjectionV1Schema,
  validateProviderBindingPolicyV1,
} from '../src/index.js'

const fixture = () =>
  JSON.parse(
    readFileSync(
      new URL('./fixtures/pmc-provider-binding-policy-v1.json', import.meta.url),
      'utf8',
    ),
  )
const recorded = (value: unknown) => ({ status: 'recorded', value, evidenceRef: 'test-only' })

function assertFrozen(value: unknown): void {
  if (value !== null && typeof value === 'object') {
    assert.ok(Object.isFrozen(value))
    Object.values(value).forEach(assertFrozen)
  }
}

test('projection preserves the entire baseline and all unknown/held constraints without authority', () => {
  const input = fixture()
  const validated = validateProviderBindingPolicyV1(input)
  assert.ok(validated.valid)
  const result = projectProviderBindingsV1(input)
  assert.ok(result.ok)
  assert.deepEqual(result, {
    ok: true,
    projection: {
      schemaVersion: 'pmc-provider-binding-projection/v1',
      evidenceOnly: true,
      policy: validated.value,
    },
  })
  assert.deepEqual(result.projection.policy, input)
  assertFrozen(result)
  assert.notEqual(result.projection.policy, input)
  assert.notEqual(result.projection.policy.bindings[0], input.bindings[0])
  input.bindings[0].eligibility.toolUse = recorded(true)
  input.lanes.reverse()
  assert.deepEqual(result.projection.policy, validated.value)
  assert.throws(() => Object.assign(result.projection.policy.bindings[0] ?? {}, { rankable: true }))
})

test('projection retains unused declarations, exact spellings, array order and all recorded evidence', () => {
  const input = fixture()
  input.candidates.push({ logicalCandidateId: 'unused', family: recorded(' Exact/Family ') })
  const unused = structuredClone(input.bindings[1])
  Object.assign(unused, {
    bindingId: 'unused-binding',
    logicalCandidateId: 'unused',
    providerModelId: ' Exact/Model ',
    piHostModelId: 'opencode/ Exact/Model ',
    protocol: recorded(' Exact-Protocol '),
    catalogBaseUrl: recorded('https://example.invalid/Exact/'),
    identityState: 'owner-attested',
  })
  input.bindings.push(unused)
  input.bindings[0].eligibility = {
    dataClasses: recorded(['restricted', 'internal', 'public']),
    transportRequirements: recorded({ data_collection: 'deny', zdr: true }),
    toolUse: recorded(true),
    structuredOutput: recorded(false),
    reasoning: recorded(true),
    inputModalities: recorded(['image', 'text']),
    thinkingLevels: recorded(['HIGH', 'low']),
    contextWindow: recorded(123456),
    maxTokens: recorded(4321),
    rates: recorded({ input: 1.2, output: 3.4, unit: 'USD per 1M tokens' }),
    enabled: recorded(true),
    availability: recorded({
      available: true,
      checkedAtUtc: 'test-time',
      attestationRef: 'test',
      evidenceState: 'live-availability',
    }),
    qualityByLane: recorded([
      { lane: 'L2', score: 0.8, evidenceRef: 'test-L2', evidenceState: 'model-quality' },
      { lane: 'L1', score: 0.4, evidenceRef: 'test-L1', evidenceState: 'model-quality' },
    ]),
  }
  Object.assign(input.provenance, {
    sourceRef: 'test-source',
    sourceRevision: 'test-revision',
    contentSha256: 'a'.repeat(64),
    catalogVersion: recorded('test-catalog'),
    mappingVersion: 'test-map',
    roleMapVersion: 'test-role-map',
    foremanRevision: 'test-foreman',
    piRuntimeVersion: recorded('test-runtime'),
    acquiredAtUtc: recorded('test-time'),
    evidenceState: 'model-quality',
    freshnessAcceptance: 'owner-accepted',
  })
  for (const key of ['candidates', 'bindings', 'lanes', 'laneBindings']) input[key].reverse()
  const validated = validateProviderBindingPolicyV1(input)
  assert.ok(validated.valid, JSON.stringify(validated))
  const result = projectProviderBindingsV1(input)
  assert.ok(result.ok, JSON.stringify(result))
  assert.deepEqual(result.projection.policy, validated.value)
  assert.deepEqual(result.projection.policy, input)
  assertFrozen(result)
})

test('projection forwards P1a semantic and bounded refusals without a partial projection', () => {
  const semantic = fixture()
  semantic.bindings[0].logicalCandidateId = 'missing'
  semantic.laneBindings[0].fallbackBindingId = 'missing'
  const large = fixture()
  large.bindings = Array(257).fill(null)
  const truncated = fixture()
  truncated.bindings = Array.from({ length: 256 }, (_, index) => ({
    ...truncated.bindings[0],
    bindingId: String(index),
    logicalCandidateId: 'missing',
  }))
  const cycle: Record<string, unknown> = {}
  cycle.self = cycle
  let reads = 0
  const accessor = Object.defineProperty({}, 'schemaVersion', {
    enumerable: true,
    get() {
      reads++
      throw Error('read')
    },
  })
  const revoked = Proxy.revocable({}, {})
  revoked.revoke()
  for (const input of [
    null,
    undefined,
    {},
    semantic,
    large,
    truncated,
    cycle,
    accessor,
    revoked.proxy,
    { text: 'x'.repeat(2049) },
  ]) {
    const validated = validateProviderBindingPolicyV1(input)
    assert.equal(validated.valid, false)
    if (validated.valid) throw Error('invalid refusal fixture')
    const result = projectProviderBindingsV1(input)
    assert.deepEqual(result, { ok: false, errors: validated.errors })
    assertFrozen(result)
  }
  assert.equal(reads, 0)
})

test('projection reads only the accepted validator snapshot, never caller getters or iterators', () => {
  const input = fixture()
  let reads = 0
  input.bindings = new Proxy(input.bindings, {
    get() {
      reads++
      throw Error('caller read')
    },
  })
  const proxy = new Proxy(input, {
    get() {
      reads++
      throw Error('caller read')
    },
  })
  const result = projectProviderBindingsV1(proxy)
  assert.ok(result.ok)
  assert.deepEqual(result.projection.policy, fixture())
  assert.equal(reads, 0)
})

test('projection schema is closed and embeds unchanged P1a constraints', () => {
  assert.equal(providerBindingProjectionV1Schema.properties.policy, providerBindingPolicyV1Schema)
  assertFrozen(providerBindingProjectionV1Schema)
  const validate = new Ajv({ strict: true }).compile(providerBindingProjectionV1Schema)
  const result = projectProviderBindingsV1(fixture())
  assert.ok(result.ok)
  assert.ok(validate(result.projection), JSON.stringify(validate.errors))
  for (const mutation of [
    { ...result.projection, schemaVersion: 'v0' },
    { ...result.projection, evidenceOnly: false },
    { ...result.projection, rankable: true },
    { schemaVersion: result.projection.schemaVersion, evidenceOnly: true },
    { ...result.projection, policy: { ...result.projection.policy, compatibility: 'new' } },
  ])
    assert.equal(validate(mutation), false)
})
