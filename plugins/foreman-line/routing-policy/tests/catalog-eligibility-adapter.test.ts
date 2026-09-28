import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { test } from 'node:test'
import { readCatalogSnapshot } from '../src/catalog-snapshot.js'
import { projectEligibility } from '../src/eligibility.js'
import * as publicApi from '../src/index.js'
import { evaluateCatalogEligibility } from '../src/index.js'

function fixture(checkedAtUtc: string | null = '2026-09-26T12:00:00.000Z') {
  const document = {
    formatVersion: 'rcm-catalog-snapshot/v1',
    sourceRef: 'synthetic-evidence-only',
    providers: [{ providerKey: 'fixture', checkedAtUtc }],
    models: [
      {
        provider: 'fixture',
        id: 'model',
        baseUrl: 'https://example.test/v1',
        api: 'test',
        input: ['text'],
        reasoning: false,
        contextWindow: 100,
        maxTokens: 10,
        cost: {
          input: { unit: 'USD per 1M tokens', value: 1 },
          output: { unit: 'USD per 1M tokens', value: 2 },
        },
      },
    ],
  }
  const canonicalBytes = new TextEncoder().encode(`${JSON.stringify(document, null, 2)}\n`)
  const expectedSha256 = createHash('sha256').update(canonicalBytes).digest('hex')
  return {
    canonicalBytes,
    expectedSha256,
    approvedConfig: {
      authorityRef: 'synthetic-separate-authority',
      endpoints: [{ provider: 'fixture', baseUrl: 'https://example.test/v1' }],
    },
    evaluationTimeUtc: '2026-09-26T13:00:00.000Z',
    identities: [{ provider: 'fixture', id: 'model' }],
    acceptedSource: {
      profileId: 'synthetic',
      profileVersion: '1',
      canonicalSha256: expectedSha256,
      sourceEvidenceRef: document.sourceRef,
      sourceEvidenceSha256: 'a'.repeat(64),
      requestedIdentities: [{ provider: 'fixture', id: 'model' }],
    },
  }
}

test('synthetic success preserves the real reader/projector result', () => {
  const input = fixture()
  const read = readCatalogSnapshot(input.canonicalBytes, input.expectedSha256)
  assert.ok(read.ok)
  const projection = projectEligibility({ ...input, snapshot: read.snapshot })
  assert.deepEqual(evaluateCatalogEligibility(input), { stage: 'projector', result: projection })
})

test('unknown and stale source time remain original projector refusals', () => {
  for (const [time, code] of [
    [null, 'SOURCE_TIME_UNKNOWN_REFUSED'],
    ['2026-09-20T12:00:00.000Z', 'STALE_REFUSED'],
  ] as const) {
    assert.deepEqual(evaluateCatalogEligibility(fixture(time)), {
      stage: 'projector',
      result: { ok: false, level: 'snapshot', code },
    })
  }
})

test('snapshot sourceRef must match the accepted evidence reference', () => {
  const input = fixture()
  input.acceptedSource.sourceEvidenceRef = 'other'
  assert.deepEqual(evaluateCatalogEligibility(input), {
    stage: 'adapter',
    ok: false,
    code: 'SOURCE_BINDING_REFUSED',
  })
})

function adapterRefusal(input: unknown, code: string) {
  assert.deepEqual(evaluateCatalogEligibility(input), { stage: 'adapter', ok: false, code })
}

test('reader digest and canonical-format refusals are preserved verbatim', () => {
  const input = fixture()
  input.expectedSha256 = '0'.repeat(64)
  assert.deepEqual(evaluateCatalogEligibility(input), {
    stage: 'reader',
    result: { ok: false, code: 'DIGEST_REFUSED' },
  })
  const bytes = new TextEncoder().encode('{}')
  assert.deepEqual(
    evaluateCatalogEligibility({
      ...input,
      canonicalBytes: bytes,
      expectedSha256: createHash('sha256').update(bytes).digest('hex'),
    }),
    { stage: 'reader', result: { ok: false, code: 'FORMAT_REFUSED' } },
  )
})

test('missing authority and endpoint mismatch retain original projector results', () => {
  const input = fixture()
  assert.deepEqual(evaluateCatalogEligibility({ ...input, approvedConfig: null }), {
    stage: 'projector',
    result: { ok: false, level: 'authority', code: 'AUTHORITY_UNKNOWN_REFUSED' },
  })
  const endpoint = input.approvedConfig.endpoints[0]
  assert.ok(endpoint)
  endpoint.baseUrl = 'https://other.test/v1'
  const result = evaluateCatalogEligibility(input)
  assert.equal(result.stage, 'projector')
  if (result.stage === 'projector' && result.result.ok)
    assert.deepEqual(result.result.results[0], {
      requested: { provider: 'fixture', id: 'model' },
      outcome: 'refused',
      codes: ['ENDPOINT_MISMATCH_REFUSED'],
    })
  else assert.fail('expected per-identity refusal')
})

test('accepted source has exactly six nonempty bounded declaration fields', () => {
  for (const key of Object.keys(fixture().acceptedSource)) {
    const input = fixture()
    const source: Record<string, unknown> = { ...input.acceptedSource }
    delete source[key]
    adapterRefusal({ ...input, acceptedSource: source }, 'INPUT_REFUSED')
  }
  for (const value of ['', 1, null]) {
    for (const key of ['profileId', 'profileVersion', 'sourceEvidenceRef']) {
      const input = fixture()
      adapterRefusal(
        { ...input, acceptedSource: { ...input.acceptedSource, [key]: value } },
        'INPUT_REFUSED',
      )
    }
  }
  for (const key of ['canonicalSha256', 'sourceEvidenceSha256']) {
    for (const value of ['a'.repeat(63), 'A'.repeat(64), 'z'.repeat(64)]) {
      const input = fixture()
      adapterRefusal(
        { ...input, acceptedSource: { ...input.acceptedSource, [key]: value } },
        'INPUT_REFUSED',
      )
    }
  }
  const input = fixture()
  adapterRefusal(
    { ...input, acceptedSource: { ...input.acceptedSource, extra: true } },
    'INPUT_REFUSED',
  )
  input.acceptedSource.canonicalSha256 = 'b'.repeat(64)
  adapterRefusal(input, 'SOURCE_BINDING_REFUSED')
})

test('requested and declared coverage must match without duplicates or omissions', () => {
  for (const identities of [
    [],
    [{ provider: 'fixture', id: 'other' }],
    [
      { provider: 'fixture', id: 'model' },
      { provider: 'fixture', id: 'model' },
    ],
  ]) {
    const input = fixture()
    adapterRefusal({ ...input, identities }, 'SCOPE_REFUSED')
    adapterRefusal(
      { ...input, acceptedSource: { ...input.acceptedSource, requestedIdentities: identities } },
      'SCOPE_REFUSED',
    )
  }
  const input = fixture()
  const identities = [
    { provider: 'fixture', id: 'model' },
    { provider: 'fixture', id: 'missing' },
  ]
  adapterRefusal(
    {
      ...input,
      identities,
      acceptedSource: { ...input.acceptedSource, requestedIdentities: identities },
    },
    'SCOPE_REFUSED',
  )
})

function changeDocument(mutate: (document: Record<string, unknown>) => void) {
  const input = fixture()
  const document = JSON.parse(new TextDecoder().decode(input.canonicalBytes))
  mutate(document)
  input.canonicalBytes = new TextEncoder().encode(`${JSON.stringify(document, null, 2)}\n`)
  input.expectedSha256 = createHash('sha256').update(input.canonicalBytes).digest('hex')
  input.acceptedSource.canonicalSha256 = input.expectedSha256
  return input
}

test('additional snapshot model or unused provider cannot masquerade as exact scope', () => {
  adapterRefusal(
    changeDocument((document) => {
      const models = document.models as Record<string, unknown>[]
      models.push({ ...models[0], id: 'additional' })
    }),
    'SCOPE_REFUSED',
  )
  adapterRefusal(
    changeDocument((document) => {
      ;(document.providers as unknown[]).push({
        providerKey: 'unused',
        checkedAtUtc: '2026-09-26T12:00:00.000Z',
      })
    }),
    'SCOPE_REFUSED',
  )
})

test('unknown required capability placeholder remains a reader refusal', () => {
  const input = changeDocument((document) => {
    const model = (document.models as Record<string, unknown>[])[0]
    assert.ok(model)
    model.reasoning = null
  })
  assert.deepEqual(evaluateCatalogEligibility(input), {
    stage: 'reader',
    result: { ok: false, code: 'MALFORMED_REFUSED' },
  })
})

test('input accessors, cycles, sparse arrays, symbols and throwing proxies refuse without executing getters', () => {
  let calls = 0
  const getter = {
    get id() {
      calls++
      return 'model'
    },
    provider: 'fixture',
  }
  adapterRefusal({ ...fixture(), identities: [getter] }, 'INPUT_REFUSED')
  assert.equal(calls, 0)
  const cycle: Record<string, unknown> = {}
  cycle.self = cycle
  for (const value of [
    cycle,
    new Array(1),
    { [Symbol('hidden')]: 1 },
    new Proxy(
      {},
      {
        ownKeys() {
          throw Error('secret')
        },
      },
    ),
  ]) {
    adapterRefusal({ ...fixture(), approvedConfig: value }, 'INPUT_REFUSED')
  }
  const revoked = Proxy.revocable({}, {})
  revoked.revoke()
  adapterRefusal(revoked.proxy, 'INPUT_REFUSED')
})

test('caller arrays cannot substitute iterator results and each descriptor is captured once', () => {
  const input = fixture()
  let iteratorCalls = 0
  Object.defineProperty(input.identities, Symbol.iterator, {
    value: () => {
      iteratorCalls++
      throw Error('iterator')
    },
  })
  adapterRefusal(input, 'INPUT_REFUSED')
  assert.equal(iteratorCalls, 0)
  const reads = new Map<PropertyKey, number>()
  const changing = new Proxy(fixture(), {
    get() {
      throw Error('ordinary read forbidden')
    },
    getOwnPropertyDescriptor(target, key) {
      const count = (reads.get(key) ?? 0) + 1
      reads.set(key, count)
      if (count > 1) throw Error('reread')
      return Reflect.getOwnPropertyDescriptor(target, key)
    },
  })
  assert.equal(evaluateCatalogEligibility(changing).stage, 'projector')
  assert.ok([...reads.values()].every((count) => count === 1))
})

test('oversized arrays refuse before ownKeys and child access', () => {
  let inspected = 0
  const large = new Proxy(new Array(257), {
    ownKeys() {
      inspected++
      throw Error('enumerated')
    },
  })
  adapterRefusal({ ...fixture(), identities: large }, 'BOUNDS_REFUSED')
  assert.equal(inspected, 0)
  adapterRefusal(
    { ...fixture(), approvedConfig: { authorityRef: 'test', endpoints: large } },
    'BOUNDS_REFUSED',
  )
  assert.equal(inspected, 0)
})

test('a caller trap throwing a revoked proxy becomes an input refusal', () => {
  const thrown = Proxy.revocable({}, {})
  thrown.revoke()
  adapterRefusal(
    new Proxy(
      {},
      {
        ownKeys() {
          throw thrown.proxy
        },
      },
    ),
    'INPUT_REFUSED',
  )
})

test('classification never inspects a thrown value prototype or properties', () => {
  let inspections = 0
  const thrown = new Proxy(
    {},
    {
      getPrototypeOf() {
        inspections++
        throw Error('prototype inspection')
      },
      get() {
        inspections++
        throw Error('property inspection')
      },
    },
  )
  adapterRefusal(
    new Proxy(
      {},
      {
        ownKeys() {
          throw thrown
        },
      },
    ),
    'INPUT_REFUSED',
  )
  assert.equal(inspections, 0)
})

for (const singleRead of [false, true]) {
  test(`shared identity is captured once with a ${singleRead ? 'single-read' : 'passive'} proxy`, () => {
    const input = fixture()
    const expected = evaluateCatalogEligibility(input)
    const reads = new Map<PropertyKey, number>()
    let enumerations = 0
    const identity = new Proxy(
      { provider: 'fixture', id: 'model' },
      {
        ownKeys(target) {
          enumerations++
          return Reflect.ownKeys(target)
        },
        getOwnPropertyDescriptor(target, key) {
          const count = (reads.get(key) ?? 0) + 1
          reads.set(key, count)
          if (singleRead && count > 1) throw Error('caller object recaptured')
          return Reflect.getOwnPropertyDescriptor(target, key)
        },
      },
    )
    input.identities = [identity]
    input.acceptedSource.requestedIdentities = [identity]
    assert.deepEqual(evaluateCatalogEligibility(input), expected)
    assert.equal(enumerations, 1)
    assert.deepEqual([...reads.values()], [1, 1])
  })
}

test('shared captures charge expanded primitive occurrences to the value budget', () => {
  const shared = Array(256).fill('leaf')
  const groups = Array(256).fill(shared)
  adapterRefusal({ ...fixture(), approvedConfig: groups }, 'BOUNDS_REFUSED')
})

test('a completed capture is rechecked at its deeper alias depth', () => {
  const shared = { leaf: 1 }
  let nested: unknown = shared
  for (let i = 0; i < 13; i++) nested = { child: nested }
  const input = { ...fixture(), approvedConfig: { first: shared, later: nested } }
  assert.equal(evaluateCatalogEligibility(input).stage, 'projector')
  input.approvedConfig.later = { child: nested }
  adapterRefusal(input, 'BOUNDS_REFUSED')
})

test('shared completed siblings do not hide an active ancestor cycle', () => {
  const shared = { leaf: 1 }
  const cyclic: Record<string, unknown> = { first: shared, again: shared }
  cyclic.self = cyclic
  adapterRefusal({ ...fixture(), approvedConfig: cyclic }, 'INPUT_REFUSED')
})

test('strings, depth, and primitive aggregate values consume finite budgets', () => {
  adapterRefusal({ ...fixture(), evaluationTimeUtc: 'x'.repeat(4097) }, 'BOUNDS_REFUSED')
  let nested: unknown = 1
  for (let i = 0; i < 17; i++) nested = { child: nested }
  adapterRefusal({ ...fixture(), approvedConfig: nested }, 'BOUNDS_REFUSED')
  let childReads = 0
  const many = Object.fromEntries(Array.from({ length: 65536 }, (_, i) => [String(i), 'leaf']))
  const wide = new Proxy(many, {
    getOwnPropertyDescriptor() {
      childReads++
      throw Error('should be prebounded')
    },
  })
  adapterRefusal({ ...fixture(), approvedConfig: wide }, 'BOUNDS_REFUSED')
  assert.equal(childReads, 0)
  const groups = Object.fromEntries(
    Array.from({ length: 256 }, (_, i) => [String(i), Array(256).fill(0)]),
  )
  adapterRefusal({ ...fixture(), approvedConfig: groups }, 'BOUNDS_REFUSED')
  const strings = Object.fromEntries(
    Array.from({ length: 256 }, (_, i) => [String(i), Array(256).fill('leaf')]),
  )
  adapterRefusal({ ...fixture(), approvedConfig: strings }, 'BOUNDS_REFUSED')
})

test('byte gate refuses excess size, shared, detached, resizable, wrong views and proxies', () => {
  adapterRefusal(
    { ...fixture(), canonicalBytes: new Uint8Array(8 * 1024 * 1024 + 1) },
    'BOUNDS_REFUSED',
  )
  const detached = new Uint8Array(4)
  structuredClone(detached.buffer, { transfer: [detached.buffer] })
  const ResizableBuffer = ArrayBuffer as unknown as new (
    length: number,
    options: { maxByteLength: number },
  ) => ArrayBuffer
  for (const bytes of [
    new Uint8Array(new SharedArrayBuffer(4)),
    detached,
    new Uint16Array(4),
    new Proxy(new Uint8Array(4), {}),
    new Uint8Array(new ResizableBuffer(4, { maxByteLength: 8 })),
  ]) {
    adapterRefusal({ ...fixture(), canonicalBytes: bytes }, 'INPUT_REFUSED')
  }
})

test('byte copy ignores caller length, buffer and iterator overrides', () => {
  const input = fixture()
  for (const key of ['length', 'byteLength', 'buffer', Symbol.iterator])
    Object.defineProperty(input.canonicalBytes, key, {
      get() {
        throw Error('caller byte getter')
      },
    })
  const result = evaluateCatalogEligibility(input)
  assert.equal(result.stage, 'projector')
})

test('results are deeply immutable and detached from subsequent caller changes', () => {
  const input = fixture()
  const result = evaluateCatalogEligibility(input)
  const before = JSON.stringify(result)
  const identity = input.identities[0]
  assert.ok(identity)
  identity.id = 'changed'
  input.approvedConfig.authorityRef = 'changed'
  input.canonicalBytes.fill(0)
  assert.equal(JSON.stringify(result), before)
  function frozen(value: unknown) {
    if (value !== null && typeof value === 'object') {
      assert.ok(Object.isFrozen(value))
      for (const child of Object.values(value)) frozen(child)
    }
  }
  frozen(result)
  frozen(evaluateCatalogEligibility(null))
})

test('exact value budget is accepted, and one additional primitive refuses', () => {
  function count(value: unknown): number {
    if (value === null || typeof value !== 'object' || value instanceof Uint8Array) return 1
    return 1 + Object.values(value).reduce<number>((total, child) => total + count(child), 0)
  }
  const input = { ...fixture(), approvedConfig: {} as Record<string, unknown> }
  const leaves = 65536 - count(input)
  for (let i = 0; i < leaves; i++) input.approvedConfig[`k${i}`] = i
  assert.equal(count(input), 65536)
  assert.deepEqual(evaluateCatalogEligibility(input), {
    stage: 'projector',
    result: { ok: false, level: 'authority', code: 'AUTHORITY_INVALID_REFUSED' },
  })
  input.approvedConfig.extra = null
  adapterRefusal(input, 'BOUNDS_REFUSED')
})

test('public barrel exposes the reader and projector but no brand helper', () => {
  assert.equal(publicApi.readCatalogSnapshot, readCatalogSnapshot)
  assert.equal(publicApi.projectEligibility, projectEligibility)
  assert.equal(Object.hasOwn(publicApi, 'isReaderIssuedSnapshot'), false)
})

test('exact string, graph depth and byte limits reach their appropriate downstream stage', () => {
  const input = fixture()
  input.acceptedSource.profileId = 'x'.repeat(4096)
  assert.equal(evaluateCatalogEligibility(input).stage, 'projector')
  let nested: unknown = 1
  for (let i = 0; i < 15; i++) nested = { child: nested }
  assert.equal(
    evaluateCatalogEligibility({ ...fixture(), approvedConfig: nested }).stage,
    'projector',
  )
  nested = { child: nested }
  adapterRefusal({ ...fixture(), approvedConfig: nested }, 'BOUNDS_REFUSED')
  const bytes = new Uint8Array(8 * 1024 * 1024)
  assert.equal(evaluateCatalogEligibility({ ...fixture(), canonicalBytes: bytes }).stage, 'reader')
})

test('all 256 requested identities are retained in order with 256 approved endpoints', () => {
  const input = changeDocument((document) => {
    const model = (document.models as Record<string, unknown>[])[0]
    document.models = Array.from({ length: 256 }, (_, i) => ({ ...model, id: `model-${i}` }))
  })
  input.identities = Array.from({ length: 256 }, (_, i) => ({
    provider: 'fixture',
    id: `model-${255 - i}`,
  }))
  input.acceptedSource.requestedIdentities = [...input.identities].reverse()
  for (let i = 1; i < 256; i++)
    input.approvedConfig.endpoints.push({
      provider: `unused-${i}`,
      baseUrl: 'https://example.test/v1',
    })
  const output = evaluateCatalogEligibility(input)
  assert.equal(output.stage, 'projector')
  if (output.stage !== 'projector' || !output.result.ok)
    assert.fail('expected complete synthetic projection')
  assert.deepEqual(
    output.result.results.map((result) => result.requested),
    input.identities,
  )
  assert.ok(output.result.results.every((result) => result.outcome === 'facts'))
})
