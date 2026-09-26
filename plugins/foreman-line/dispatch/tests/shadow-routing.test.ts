import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  hashShadowPublicInput,
  executeShadowRoute as packageExecute,
  SHADOW_LIMITS,
  type ShadowRoutingDependencies,
  ShadowRoutingError,
  type ShadowRoutingInput,
  type ShadowRoutingOptions,
} from '../src/index.js'
import { executeShadowRoute as routingExecute } from '../src/routing-eval/index.js'
import { executeShadowRoute } from '../src/routing-eval/shadow.js'

const PUBLIC_INPUT = { specRef: 'example.md', excerpt: 'Public specification.' }
const paths = [executeShadowRoute, routingExecute, packageExecute]
function input(overrides: Partial<ShadowRoutingInput> = {}): ShadowRoutingInput {
  return {
    workflowId: 'shadow-workflow-001',
    routeName: 'example-shadow',
    taskType: 'spec_lint',
    publicInput: PUBLIC_INPUT,
    parcelAuthorization: {
      parcelId: 'PARCEL-CEREBRAS-001',
      authorizationRef: 'example.md#shadow-inputs',
      dataClassification: 'public',
      allowedTaskTypes: ['spec_lint'],
      publicInputSha256: hashShadowPublicInput(PUBLIC_INPUT),
    },
    independentReviewerId: 'independent-reviewer-001',
    ...overrides,
  }
}
function retired(error: unknown): boolean {
  assert.ok(error instanceof ShadowRoutingError)
  assert.equal(error.name, 'ShadowRoutingError')
  assert.equal(error.code, 'LEGACY_EXECUTION_RETIRED')
  assert.equal(error.message, 'Legacy governed inference is retired.')
  return true
}
function noEffects() {
  const calls: string[] = []
  const dependencies: ShadowRoutingDependencies = {
    resolveParcelAuthorization: async () => {
      calls.push('authorization')
      const claim = input().parcelAuthorization
      return {
        parcelId: claim.parcelId,
        dataClassification: claim.dataClassification,
        allowedTaskTypes: claim.allowedTaskTypes,
        publicInputSha256: claim.publicInputSha256,
      }
    },
    discoverAdapter: async () => {
      calls.push('discovery')
      return { status: 'verified_available' }
    },
    invokeAdapter: async () => {
      calls.push('invocation')
      return { candidate: 'Old successful candidate.', evidence_refs: ['example.md:1'] }
    },
  }
  const options: ShadowRoutingOptions = {
    repoRoot: 'must-not-read',
    pluginRoot: 'must-not-read',
    now: () => {
      calls.push('clock')
      return '2026-09-26T00:00:00.000Z'
    },
  }
  return { calls, dependencies, options }
}

test('direct and both barrel paths preserve the same retired function', async () => {
  assert.equal(routingExecute, executeShadowRoute)
  assert.equal(packageExecute, executeShadowRoute)
  for (const execute of paths) {
    const { calls, dependencies, options } = noEffects()
    const promise = execute(input(), dependencies, options)
    assert.ok(promise instanceof Promise)
    await assert.rejects(promise, retired)
    assert.deepEqual(calls, [])
  }
})

test('formerly accepting alternate shadow policy cannot invoke or create a receipt', async () => {
  const root = mkdtempSync(join(tmpdir(), 'shadow-retirement-'))
  try {
    const pluginRoot = join(root, 'plugins', 'foreman-line')
    const policyDir = join(pluginRoot, 'routing-policy')
    mkdirSync(policyDir, { recursive: true })
    const fixture = join(
      dirname(fileURLToPath(import.meta.url)),
      '../../routing-policy/tests/fixtures/accept-shadow-route.yaml',
    )
    writeFileSync(join(policyDir, 'routing-policy.yaml'), readFileSync(fixture))
    const { calls, dependencies, options } = noEffects()
    await assert.rejects(
      executeShadowRoute(input(), dependencies, { ...options, repoRoot: root, pluginRoot }),
      retired,
    )
    assert.deepEqual(calls, [])
    assert.equal(existsSync(join(root, 'docs', 'receipts')), false)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

for (const lane of [
  'L1',
  'L2',
  'L3',
  'L4',
  'L5',
  'L6',
  'routing',
  'classification',
  'structured-decision',
  'jev',
  'Jev',
  'typesafe/jev-1.13',
  'unknown',
]) {
  test(`retirement precedes lane or alias interpretation: ${lane}`, async () => {
    const { calls, dependencies, options } = noEffects()
    await assert.rejects(
      executeShadowRoute(input({ routeName: lane, taskType: lane }), dependencies, options),
      retired,
    )
    assert.deepEqual(calls, [])
  })
}

// Former execution-contract scenarios now all stop before their old validation or effect.
const malformedCases: ReadonlyArray<readonly [string, unknown]> = [
  ['null', null],
  ['undefined', undefined],
  ['primitive', 1],
  [
    'nonpublic authorization',
    input({
      parcelAuthorization: {
        ...input().parcelAuthorization,
        dataClassification: 'restricted',
      },
    }),
  ],
  ['unsupported task', input({ taskType: 'unsupported' })],
  ['forged input', input({ publicInput: { forged: true } })],
  [
    'mismatched digest',
    input({
      parcelAuthorization: {
        ...input().parcelAuthorization,
        publicInputSha256: '0'.repeat(64),
      },
    }),
  ],
  [
    'unapproved task',
    input({
      parcelAuthorization: {
        ...input().parcelAuthorization,
        allowedTaskTypes: [],
      },
    }),
  ],
  [
    'long authorization',
    input({
      parcelAuthorization: {
        ...input().parcelAuthorization,
        authorizationRef: 'a'.repeat(513),
      },
    }),
  ],
  ['long reviewer', input({ independentReviewerId: 'r'.repeat(257) })],
  ['same reviewer', input({ independentReviewerId: 'example-shadow' })],
  ['oversized input', input({ publicInput: { text: 'x'.repeat(65_537) } })],
  ['sparse input', input({ publicInput: new Array(2) })],
]
for (const [name, value] of malformedCases) {
  test(`retirement replaces the old executor outcome for ${name}`, async () => {
    const { calls, dependencies, options } = noEffects()
    await assert.rejects(
      executeShadowRoute(value as ShadowRoutingInput, dependencies, options),
      retired,
    )
    assert.deepEqual(calls, [])
  })
}

test('no argument property, descriptor, proxy or reentrant getter is evaluated', async () => {
  let reads = 0
  const trap = () => {
    reads += 1
    throw new Error('must not inspect arguments')
  }
  const hostile = new Proxy(
    {},
    {
      get: trap,
      ownKeys: trap,
      getOwnPropertyDescriptor: trap,
      getPrototypeOf: trap,
    },
  )
  const accessor = Object.defineProperty({}, 'workflowId', {
    get() {
      reads += 1
      void executeShadowRoute(
        hostile as ShadowRoutingInput,
        hostile as ShadowRoutingDependencies,
        hostile as ShadowRoutingOptions,
      )
      throw new Error('must not reenter')
    },
  })
  const revoked = Proxy.revocable({}, {})
  revoked.revoke()
  for (const execute of paths) {
    for (const value of [hostile, accessor, revoked.proxy, null, undefined]) {
      await assert.rejects(
        execute(
          value as ShadowRoutingInput,
          value as ShadowRoutingDependencies,
          value as ShadowRoutingOptions,
        ),
        retired,
      )
    }
  }
  assert.equal(reads, 0)
})

test('concurrent/repeated calls never resolve authorization, discover, invoke or read clock', async () => {
  const { calls, dependencies, options } = noEffects()
  await Promise.all(
    Array.from({ length: 8 }, () =>
      assert.rejects(executeShadowRoute(input(), dependencies, options), retired),
    ),
  )
  assert.deepEqual(calls, [])
})

const authorized = {
  parcelId: input().parcelAuthorization.parcelId,
  dataClassification: 'public',
  allowedTaskTypes: ['spec_lint'],
  publicInputSha256: hashShadowPublicInput(PUBLIC_INPUT),
}
const candidate = { candidate: 'Old candidate.', evidence_refs: ['example.md'] }
const hostileResult = new Proxy(
  {},
  {
    get() {
      throw new Error('hostile result')
    },
  },
)
const dependencyCases: ReadonlyArray<{
  name: string
  authorization?: unknown
  discovery?: unknown
  output?: unknown
  missingResolver?: boolean
  throwAt?: 'authorization' | 'discovery'
  mutateAt?: 'authorization' | 'discovery'
}> = [
  { name: 'authorization throws', throwAt: 'authorization' },
  { name: 'hostile authorization', authorization: hostileResult },
  { name: 'malformed authorization', authorization: {} },
  {
    name: 'nonpublic authorization',
    authorization: { ...authorized, dataClassification: 'restricted' },
  },
  { name: 'missing resolver', missingResolver: true },
  { name: 'unavailable discovery', discovery: { status: 'unavailable' } },
  { name: 'malformed discovery', discovery: {} },
  { name: 'hostile discovery', discovery: hostileResult },
  { name: 'discovery throws', throwAt: 'discovery' },
  { name: 'mutating authorization', mutateAt: 'authorization' },
  { name: 'mutating discovery', mutateAt: 'discovery' },
  { name: 'candidate success', output: candidate },
  { name: 'malformed candidate', output: {} },
  { name: 'authority-claiming candidate', output: { ...candidate, authority: 'approval' } },
  { name: 'hostile candidate', output: hostileResult },
  { name: 'oversized candidate', output: { ...candidate, candidate: 'x'.repeat(32_769) } },
  {
    name: 'too many evidence references',
    output: { ...candidate, evidence_refs: Array.from({ length: 65 }, (_, i) => `ref-${i}`) },
  },
  {
    name: 'oversized evidence reference',
    output: { ...candidate, evidence_refs: ['x'.repeat(2_049)] },
  },
]
for (const scenario of dependencyCases) {
  test(`old dependency scenario is never reached: ${scenario.name}`, async () => {
    const calls: string[] = []
    const value = input()
    const effect = (stage: 'authorization' | 'discovery' | 'invocation') => {
      calls.push(stage)
      if (scenario.mutateAt === stage) Object.assign(value, { publicInput: { changed: true } })
      if (scenario.throwAt === stage) throw new Error('synthetic boundary failure')
    }
    const dependencies: ShadowRoutingDependencies = {
      resolveParcelAuthorization: async () => {
        effect('authorization')
        return scenario.authorization ?? authorized
      },
      discoverAdapter: async () => {
        effect('discovery')
        return scenario.discovery ?? { status: 'verified_available' }
      },
      invokeAdapter: async () => {
        effect('invocation')
        return scenario.output ?? candidate
      },
    }
    if (scenario.missingResolver)
      Object.defineProperty(dependencies, 'resolveParcelAuthorization', { value: undefined })
    await assert.rejects(executeShadowRoute(value, dependencies, noEffects().options), retired)
    assert.deepEqual(calls, [])
    assert.equal(value.publicInput, PUBLIC_INPUT)
  })
}

test('pure public-input hashing remains deterministic and key-order independent', () => {
  assert.equal(hashShadowPublicInput({ b: 2, a: 1 }), hashShadowPublicInput({ a: 1, b: 2 }))
  assert.notEqual(hashShadowPublicInput([1, 2]), hashShadowPublicInput([2, 1]))
  assert.equal(
    hashShadowPublicInput(null),
    '74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b',
  )
  assert.equal(SHADOW_LIMITS.publicInputBytes, 65_536)
})

test('pure hashing still rejects sparse, non-JSON, cyclic and accessor input', () => {
  const cyclic: { self?: unknown } = {}
  cyclic.self = cyclic
  let getterCalls = 0
  const accessor = Object.defineProperty({}, 'value', {
    enumerable: true,
    get() {
      getterCalls += 1
      return 1
    },
  })
  for (const value of [
    new Array(2),
    undefined,
    { value: undefined },
    { value: Number.NaN },
    new Date('2026-08-30T00:00:00.000Z'),
    cyclic,
    accessor,
  ]) {
    assert.throws(
      () => hashShadowPublicInput(value),
      (error: unknown) => {
        assert.ok(error instanceof ShadowRoutingError)
        assert.equal(error.code, 'INVALID_PUBLIC_INPUT')
        return true
      },
    )
  }
  assert.equal(getterCalls, 0)
})

test('pure hashing retains exact UTF-8 canonical byte bounds', () => {
  assert.match(hashShadowPublicInput('x'.repeat(65_534)), /^[a-f0-9]{64}$/)
  for (const value of ['x'.repeat(65_535), 'é'.repeat(32_768), { text: 'x'.repeat(65_537) }]) {
    assert.throws(
      () => hashShadowPublicInput(value),
      (error: unknown) => {
        assert.ok(error instanceof ShadowRoutingError)
        assert.equal(error.code, 'PUBLIC_INPUT_TOO_LARGE')
        return true
      },
    )
  }
})
