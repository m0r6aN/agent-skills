import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import * as publicApi from '../src/index.js'
import {
  evaluateCatalogEligibility,
  producePublicObservationSnapshot,
  readCatalogSnapshot,
} from '../src/index.js'

const evidence = new URL(
  '../../docs/goals/routing-currency-and-merit/source-evidence/',
  import.meta.url,
)
const manifestBytes = readFileSync(
  new URL('pmc-binding-coverage-openrouter-20260926-v4.json', evidence),
)
const projectionBytes = readFileSync(
  new URL('openrouter-rcm-v1-conservative-projection-20260926.json', evidence),
)
const pins = JSON.parse(
  readFileSync(new URL('./fixtures/public-observation-profiles.json', import.meta.url), 'utf8'),
)
const ids = [
  'openai/gpt-6-astra',
  'anthropic/claude-opus-5.5',
  'anthropic/claude-sonnet-5',
  'openai/gpt-5.6-sol',
  'openai/gpt-5.6-terra',
  'google/gemini-3.8-flash',
  'anthropic/claude-haiku-4.5',
]
function candidate(count = 6): {
  manifestBytes: Uint8Array
  projectionBytes: Uint8Array
  requestedIdentities: { provider: string; id: string }[]
  evaluationTimeUtc: string
} {
  return {
    manifestBytes: new Uint8Array(manifestBytes),
    projectionBytes: new Uint8Array(projectionBytes),
    requestedIdentities: ids.slice(0, count).map((id) => ({ provider: 'openrouter', id })),
    evaluationTimeUtc: '2026-09-26T15:00:00.000Z',
  }
}
function sha(bytes: Uint8Array) {
  return createHash('sha256').update(bytes).digest('hex')
}

test('retained six-row scope produces canonical evidence accepted by the sole reader and P1A', () => {
  assert.equal(manifestBytes.length, 12850)
  assert.equal(projectionBytes.length, 13348)
  assert.equal(sha(manifestBytes), pins.expectedManifestSha256)
  assert.equal(sha(projectionBytes), pins.expectedProjectionSha256)
  const input = candidate()
  const result = producePublicObservationSnapshot(input, pins)
  assert.ok(result.ok)
  assert.equal(result.digestSha256, sha(result.canonicalBytes))
  assert.equal(result.canonicalBytes.length, 4359)
  assert.equal(
    result.digestSha256,
    '5901c16ed192870d53952375392710b514f37b18a5451da6c4a5966aa7e916bb',
  )
  assert.equal(result.inventory.length, 6)
  assert.equal(result.sourceInventory.length, 7)
  const read = readCatalogSnapshot(result.canonicalBytes, result.digestSha256)
  assert.ok(read.ok)
  assert.equal(read.snapshot.providers[0]?.checkedAtUtc, '2026-09-26T14:08:44.529Z')
  assert.equal(read.snapshot.models[5]?.cost.input.value, 0.75)
  const wrapped = evaluateCatalogEligibility({
    canonicalBytes: result.canonicalBytes,
    expectedSha256: result.digestSha256,
    acceptedSource: result.acceptedSource,
    identities: input.requestedIdentities,
    evaluationTimeUtc: input.evaluationTimeUtc,
    approvedConfig: {
      authorityRef: 'SYNTHETIC-test-only-endpoint-authority',
      endpoints: [
        {
          provider: 'openrouter',
          baseUrl: 'https://openrouter.ai/api/v1',
        },
      ],
    },
  })
  assert.equal(wrapped.stage, 'projector')
  if (wrapped.stage === 'projector') assert.ok(wrapped.result.ok)
})

test('seven-row scope refuses a complete artifact while preserving Haiku unknown reasoning', () => {
  const result = producePublicObservationSnapshot(candidate(7), pins)
  assert.ok(!result.ok)
  assert.equal(result.code, 'INCOMPLETE_SCOPE')
  assert.equal(result.inventory.length, 7)
  assert.deepEqual(result.inventory[6], {
    provider: 'openrouter',
    id: ids[6],
    status: 'missing-required-facts',
    code: 'REASONING_UNKNOWN_REFUSED',
    fields: ['reasoning'],
  })
  for (const key of ['canonicalBytes', 'digestSha256', 'acceptedSource'])
    assert.ok(!(key in result))
})

test('all fifteen bindings account for eight unsupported OpenCode identities', () => {
  const input = candidate(7)
  input.requestedIdentities = JSON.parse(manifestBytes.toString()).bindings.map(
    (row: { provider: string; id: string }) => ({ provider: row.provider, id: row.id }),
  )
  const result = producePublicObservationSnapshot(input, pins)
  assert.ok(!result.ok)
  assert.equal(result.code, 'INCOMPLETE_SCOPE')
  assert.equal(result.inventory.length, 15)
  assert.equal(result.inventory.filter((row) => row.status === 'unsupported-profile').length, 8)
  assert.equal(result.sourceInventory.length, 7)
})

test('independent digest pins refuse changed bytes and cannot be self-pinned', () => {
  const input = candidate()
  input.manifestBytes[0] = 32
  const result = producePublicObservationSnapshot(input, pins)
  assert.ok(!result.ok)
  assert.equal(result.code, 'DIGEST_MISMATCH')
  assert.equal(result.inventory.length, 6)
  assert.equal(result.sourceInventory.length, 0)
})

test('retained observation passes exact 24-hour boundary and refuses one millisecond older', () => {
  const input = candidate()
  input.evaluationTimeUtc = '2026-09-27T14:08:44.529Z'
  assert.ok(producePublicObservationSnapshot(input, pins).ok)
  input.evaluationTimeUtc = '2026-09-27T14:08:44.530Z'
  const result = producePublicObservationSnapshot(input, pins)
  assert.ok(!result.ok)
  assert.equal(result.code, 'OBSERVATION_TIME_REFUSED')
})

test('canonical bytes are deterministic owned outputs and plain results are deeply frozen', () => {
  const input = candidate()
  const first = producePublicObservationSnapshot(input, pins)
  const second = producePublicObservationSnapshot(input, pins)
  assert.ok(first.ok && second.ok)
  assert.deepEqual(first.canonicalBytes, second.canonicalBytes)
  assert.notEqual(first.canonicalBytes, second.canonicalBytes)
  assert.ok(Object.isFrozen(first))
  assert.ok(Object.isFrozen(first.acceptedSource.requestedIdentities[0]))
  assert.ok(Object.isFrozen(first.inventory[0]?.fields))
  first.canonicalBytes.fill(0)
  assert.equal(sha(second.canonicalBytes), second.digestSha256)
  assert.equal(sha(input.manifestBytes), pins.expectedManifestSha256)
})

type Document = Record<string, unknown>
function at(document: unknown, path: readonly (string | number)[]): unknown {
  let value = document
  for (const key of path) value = (value as Document)[key]
  return value
}
function put(document: unknown, path: readonly (string | number)[], value: unknown): void {
  const key = path[path.length - 1]
  assert.notEqual(key, undefined)
  ;(at(document, path.slice(0, -1)) as Document)[key as string] = value
}
function encode(value: unknown): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(value)}\n`)
}
function repinned(edit: (manifest: Document, projection: Document) => void) {
  const input = candidate()
  const manifest = JSON.parse(manifestBytes.toString()) as Document
  const projection = JSON.parse(projectionBytes.toString()) as Document
  edit(manifest, projection)
  input.projectionBytes = encode(projection)
  put(manifest, ['sealedProjection', 'sha256'], sha(input.projectionBytes))
  put(manifest, ['sealedProjection', 'byteLength'], input.projectionBytes.length)
  input.manifestBytes = encode(manifest)
  return {
    input,
    trust: {
      ...pins,
      expectedManifestSha256: sha(input.manifestBytes),
      expectedProjectionSha256: sha(input.projectionBytes),
    },
  }
}
function refuses(input: unknown, trust: unknown, code: string, count?: number) {
  const result = producePublicObservationSnapshot(input, trust)
  assert.ok(!result.ok)
  assert.equal(result.code, code)
  if (count !== undefined) assert.equal(result.inventory.length, count)
  assert.equal(result.evidenceOnly, true)
  for (const key of ['canonicalBytes', 'digestSha256', 'acceptedSource'])
    assert.ok(!(key in result))
  return result
}
function rawProjection(source: string | Uint8Array) {
  const input = candidate()
  input.projectionBytes = typeof source === 'string' ? new TextEncoder().encode(source) : source
  return { input, trust: { ...pins, expectedProjectionSha256: sha(input.projectionBytes) } }
}

test('only the function is added to runtime exports; supported public types stay usable', () => {
  assert.equal(typeof publicApi.producePublicObservationSnapshot, 'function')
  assert.equal(typeof publicApi.readCatalogSnapshot, 'function')
  assert.equal(typeof publicApi.evaluateCatalogEligibility, 'function')
  assert.ok(!('Identity' in publicApi) && !('AcceptedSource' in publicApi))
})

test('complete requested scope order is preserved without claiming upstream coverage', () => {
  const input = candidate()
  input.requestedIdentities.reverse()
  const result = producePublicObservationSnapshot(input, pins)
  assert.ok(result.ok)
  const document = JSON.parse(new TextDecoder().decode(result.canonicalBytes))
  assert.deepEqual(Object.keys(document), ['formatVersion', 'sourceRef', 'providers', 'models'])
  assert.deepEqual(
    document.models.map((v: { id: string }) => v.id),
    input.requestedIdentities.map((v) => v.id),
  )
  assert.deepEqual(
    result.inventory.map((v) => v.id),
    input.requestedIdentities.map((v) => v.id),
  )
  assert.deepEqual(
    result.sourceInventory.map((v) => v.id),
    ids,
  )
  assert.deepEqual(Object.keys(result.acceptedSource), [
    'profileId',
    'profileVersion',
    'canonicalSha256',
    'sourceEvidenceRef',
    'sourceEvidenceSha256',
    'requestedIdentities',
  ])
  assert.equal(document.sourceRef, pins.sourceEvidenceRef)
  assert.equal(result.acceptedSource.sourceEvidenceSha256, pins.expectedManifestSha256)
  assert.deepEqual(Object.keys(document.models[0].cost.input), ['unit', 'value'])
  assert.ok(new TextDecoder().decode(result.canonicalBytes).endsWith('\n'))
})

test('absent and unsupported identities are accounted for without aliases or smaller scope inference', () => {
  const input = candidate()
  input.requestedIdentities = [
    { provider: 'openrouter', id: 'missing' },
    { provider: 'opencode', id: ids[0] as string },
    { provider: 'OpenRouter', id: ids[0] as string },
  ]
  const result = refuses(input, pins, 'INCOMPLETE_SCOPE', 3)
  assert.deepEqual(
    result.inventory.map((v) => v.status),
    ['absent', 'unsupported-profile', 'unsupported-profile'],
  )
  assert.equal(result.sourceInventory.length, 7)
})

for (const [name, value] of [
  ['empty', []],
  [
    'duplicate',
    [
      { provider: 'openrouter', id: 'x' },
      { provider: 'openrouter', id: 'x' },
    ],
  ],
  ['empty provider', [{ provider: '', id: 'x' }]],
  ['empty ID', [{ provider: 'openrouter', id: '' }]],
  ['whitespace ID', [{ provider: 'openrouter', id: ' ' }]],
  ['surrounding ID', [{ provider: 'openrouter', id: ' x' }]],
  ['extra identity key', [{ provider: 'openrouter', id: 'x', extra: true }]],
  ['non-array', {}],
] as const)
  test(`malformed scope: ${name}`, () => {
    refuses({ ...candidate(), requestedIdentities: value }, pins, 'INPUT_INVALID', 0)
  })

test('tuple equality cannot collide on delimiters', () => {
  const input = candidate()
  input.requestedIdentities = [
    { provider: 'a:b', id: 'c' },
    { provider: 'a', id: 'b:c' },
  ]
  refuses(input, pins, 'INCOMPLETE_SCOPE', 2)
})

test('valid scope is inventoried even if another candidate envelope field is malformed', () => {
  refuses({ ...candidate(), extra: true }, pins, 'INPUT_INVALID', 6)
  const input = { ...candidate() } as Document
  delete input.projectionBytes
  refuses(input, pins, 'INPUT_INVALID', 6)
})

for (const [name, edit] of [
  ['profile version', { profileVersion: 'v1' }],
  ['profile ID', { profileId: `${pins.profileId}-v2` }],
] as const)
  test(`unsupported accepted ${name} marks every requested identity`, () => {
    const result = refuses(candidate(), { ...pins, ...edit }, 'UNSUPPORTED_PROFILE', 6)
    assert.ok(result.inventory.every((v) => v.status === 'unsupported-profile'))
  })

for (const [name, trust] of [
  ['missing', undefined],
  ['empty', {}],
  ['self-pinning', { ...pins, expectedManifestSha256: undefined }],
  [
    'uppercase digest',
    { ...pins, expectedManifestSha256: pins.expectedManifestSha256.toUpperCase() },
  ],
  ['whitespace reference', { ...pins, sourceEvidenceRef: ' bad' }],
  ['extra trust key', { ...pins, approvedConfig: {} }],
])
  test(`invalid trust: ${name}`, () => {
    refuses(candidate(), trust, 'INPUT_INVALID', 6)
  })

test('swapped candidates and nested seal tampering fail independent pins or semantic link', () => {
  const input = candidate()
  ;[input.manifestBytes, input.projectionBytes] = [input.projectionBytes, input.manifestBytes]
  refuses(input, pins, 'DIGEST_MISMATCH', 6)
  const fixture = repinned(() => {})
  const manifest = JSON.parse(new TextDecoder().decode(fixture.input.manifestBytes))
  manifest.sealedProjection.sha256 = '0'.repeat(64)
  fixture.input.manifestBytes = encode(manifest)
  fixture.trust.expectedManifestSha256 = sha(fixture.input.manifestBytes)
  refuses(fixture.input, fixture.trust, 'SOURCE_INVALID', 6)
})

const projectionMutations: readonly [string, readonly (string | number)[], unknown][] = [
  ['unknown root field', ['extra'], true],
  ['format version', ['formatVersion'], 'v2'],
  ['source profile', ['sourceProfile'], 'other'],
  ['acquisition URL', ['sourceEndpoint'], 'https://example.test'],
  ['response digest', ['sourceResponseBytesSha256'], '0'.repeat(64)],
  ['response length', ['sourceResponseByteLength'], 1],
  ['run selection', ['sourceResponseRun'], 3],
  ['row extra field', ['rows', 0, 'extra'], true],
  ['cross-provider replacement', ['rows', 0, 'provider'], 'opencode'],
  ['record locator', ['rows', 0, 'sourceRecordLocator'], 'wrong'],
  ['context locator', ['rows', 0, 'contextWindow', 'sourceFieldLocator'], 'wrong'],
  ['max-token locator', ['rows', 0, 'maxTokens', 'sourceFieldLocator'], 'wrong'],
  ['zero context', ['rows', 0, 'contextWindow', 'value'], 0],
  ['unsafe max tokens', ['rows', 0, 'maxTokens', 'value'], 9007199254740992],
  ['endpoint', ['rows', 0, 'baseUrl', 'value'], 'https://example.test'],
  ['endpoint profile', ['rows', 0, 'baseUrl', 'sourceProfile'], 'other'],
  ['protocol', ['rows', 0, 'api', 'value'], 'other'],
  ['false reasoning default', ['rows', 0, 'reasoning', 'value'], false],
  ['empty reasoning efforts', ['rows', 0, 'reasoning', 'supportedEfforts'], []],
  ['unreviewed inference', ['rows', 0, 'reasoning', 'status'], 'documented'],
  ['documented reasoning claim', ['rows', 0, 'reasoning', 'documentedPerModelSchema'], true],
  ['duplicate efforts', ['rows', 0, 'reasoning', 'supportedEfforts'], ['high', 'high']],
  ['invented minimal', ['rows', 0, 'thinkingLevelMap', 'minimal'], 'minimal'],
  ['clamped level', ['rows', 0, 'thinkingLevelMap', 'high'], 'medium'],
  ['input ordering', ['rows', 0, 'inputModalities', 'projected'], ['text', 'image']],
  ['lost residual', ['rows', 0, 'inputModalities', 'residualSourceModalities'], []],
  ['fabricated modality', ['rows', 0, 'inputModalities', 'projected'], ['file', 'image', 'text']],
  ['wrong cost unit', ['rows', 0, 'cost', 'input', 'unit'], 'USD per token'],
  ['price mismatch', ['rows', 0, 'cost', 'input', 'value'], 11],
  ['price exponent string', ['rows', 0, 'cost', 'input', 'sourceValuePerToken'], '1e-5'],
  ['price negative string', ['rows', 0, 'cost', 'input', 'sourceValuePerToken'], '-0.00001'],
  ['price whitespace', ['rows', 0, 'cost', 'input', 'sourceValuePerToken'], ' 0.00001'],
  ['price digits', ['rows', 0, 'cost', 'input', 'sourceValuePerToken'], '1'.repeat(65)],
  ['price fraction', ['rows', 0, 'cost', 'input', 'sourceValuePerToken'], `0.${'0'.repeat(32)}1`],
  ['refusal made false', ['excludedRefusals', 0, 'projectedRcmV1'], false],
  ['refusal code changed', ['excludedRefusals', 0, 'refusalCode'], 'OTHER'],
  ['thinking default permitted', ['thinkingLevelSemantics', 'unobservedLevels'], 'allow'],
]
for (const [name, path, value] of projectionMutations)
  test(`independently repinned projection refuses ${name}`, () => {
    const { input, trust } = repinned((_m, p) => put(p, path, value))
    refuses(input, trust, 'SOURCE_INVALID', 6)
  })
const manifestMutations: readonly [string, readonly (string | number)[], unknown][] = [
  ['unknown nested field', ['sourceScope', 'extra'], true],
  ['internal version rewritten', ['evidenceVersion'], 'rcm-openrouter-pmc-binding-coverage-v4'],
  ['coverage count', ['sourceScope', 'requestedIdCount'], 6],
  ['full catalog claim', ['sourceScope', 'fullCatalogClaim'], true],
  [
    'provider-declared time invented',
    ['sourceScope', 'providerDeclaredTime'],
    '2026-09-26T14:08:44Z',
  ],
  ['status not 200', ['sourceScope', 'responseRuns', 1, 'status'], 500],
  ['selected digest', ['sourceScope', 'responseRuns', 1, 'responseBytesSha256'], '0'.repeat(64)],
  ['selected length', ['sourceScope', 'responseRuns', 1, 'responseByteLength'], 1],
  ['profile', ['mappingProfile', 'id'], 'other'],
  ['binding locator', ['bindings', 8, 'sourceRowLocator'], 'wrong'],
  ['binding count', ['assessment', 'totalBindings'], 14],
  ['refusal count', ['assessment', 'haikuRefused'], false],
  ['owner accounting', ['ratifiedBindingSource', 'ownerAttested'], 1],
  ['OpenCode enrichment', ['bindings', 0, 'correctedProjectionRcmV1'], {}],
]
for (const [name, path, value] of manifestMutations)
  test(`independently repinned manifest refuses ${name}`, () => {
    const { input, trust } = repinned((m) => put(m, path, value))
    refuses(input, trust, 'SOURCE_INVALID', 6)
  })

test('all source rows are validated even when the requested subset excludes the bad row', () => {
  const { input, trust } = repinned((_m, p) => put(p, ['rows', 5, 'cost', 'output', 'value'], 99))
  input.requestedIdentities = input.requestedIdentities.slice(0, 1)
  refuses(input, trust, 'SOURCE_INVALID', 1)
})

for (const target of ['rows', 'excludedRefusals'] as const)
  test(`duplicate ${target} are refused after repinning`, () => {
    const { input, trust } = repinned((_m, p) => {
      const rows = p[target] as unknown[]
      rows.push(rows[0])
    })
    refuses(input, trust, 'SOURCE_INVALID', 6)
  })

test('unknown/missing/overlapping source coverage never succeeds', () => {
  for (const edit of [
    (_m: Document, p: Document) => (p.rows as unknown[]).pop(),
    (_m: Document, p: Document) => put(p, ['excludedRefusals', 0, 'id'], ids[0]),
    (m: Document) => put(m, ['sourceScope', 'requestedIds', 6], 'missing'),
    (m: Document) => put(m, ['sourceScope', 'responseRuns', 1, 'run'], 1),
  ]) {
    const { input, trust } = repinned(edit)
    refuses(input, trust, 'SOURCE_INVALID', 6)
  }
})

for (const [name, time] of [
  ['missing fraction', '2026-09-26T15:00:00Z'],
  ['ten fractions', '2026-09-26T15:00:00.0000000000Z'],
  ['invalid day', '2026-02-30T15:00:00.000Z'],
  ['non-UTC', '2026-09-26T15:00:00.000+00:00'],
  ['future receipt at same truncated millisecond', '2026-09-26T14:08:44.529Z'],
])
  test(`evaluation time refuses ${name}`, () => {
    refuses({ ...candidate(), evaluationTimeUtc: time }, pins, 'OBSERVATION_TIME_REFUSED', 6)
  })

test('original acquisition time and truncation cannot be reset or replaced', () => {
  for (const [path, value] of [
    [
      ['sourceScope', 'responseRuns', 1, 'observedRequestStartedAtUtc'],
      '2026-09-26T14:08:44.5298098Z',
    ],
    [
      ['sourceScope', 'responseRuns', 1, 'canonicalResponseReceivedAtUtc'],
      '2026-09-26T14:08:44.530Z',
    ],
    [['sourceScope', 'responseRuns', 1, 'observedResponseReceivedAtUtc'], null],
    [
      ['sourceScope', 'responseRuns', 1, 'observedResponseReceivedAtUtc'],
      '2026-02-30T14:08:44.529Z',
    ],
  ] as const) {
    const { input, trust } = repinned((m) => put(m, path, value))
    refuses(input, trust, 'OBSERVATION_TIME_REFUSED', 6)
  }
})

test('exact decimal comparison rejects binary-rounding equality and lossy Number amounts', () => {
  for (const source of ['0.0000100000000000000001', '0.00001000000000000000000000000001']) {
    const { input, trust } = repinned((_m, p) =>
      put(p, ['rows', 0, 'cost', 'input', 'sourceValuePerToken'], source),
    )
    refuses(input, trust, 'SOURCE_INVALID', 6)
  }
  const fixture = repinned((_m, p) =>
    put(p, ['rows', 0, 'cost', 'input', 'sourceValuePerToken'], '0.0000100000000000000001'),
  )
  const source = new TextDecoder()
    .decode(fixture.input.projectionBytes)
    .replace('"value":10,', '"value":10.0000000000000001,')
  fixture.input.projectionBytes = new TextEncoder().encode(source)
  const m = JSON.parse(new TextDecoder().decode(fixture.input.manifestBytes))
  m.sealedProjection.sha256 = sha(fixture.input.projectionBytes)
  m.sealedProjection.byteLength = fixture.input.projectionBytes.length
  fixture.input.manifestBytes = encode(m)
  fixture.trust.expectedManifestSha256 = sha(fixture.input.manifestBytes)
  fixture.trust.expectedProjectionSha256 = sha(fixture.input.projectionBytes)
  refuses(fixture.input, fixture.trust, 'SOURCE_INVALID', 6)
})

test('price source accepts exact maximum digit/fraction budgets and zero', () => {
  for (const source of [`${'0'.repeat(57)}0.00001`, `0.00001${'0'.repeat(27)}`, '0']) {
    const { input, trust } = repinned((_m, p) => {
      put(p, ['rows', 0, 'cost', 'input', 'sourceValuePerToken'], source)
      if (source === '0') put(p, ['rows', 0, 'cost', 'input', 'value'], 0)
    })
    assert.ok(producePublicObservationSnapshot(input, trust).ok)
  }
})

for (const [name, source] of [
  ['duplicate keys', '{"x":1,"x":2}'],
  ['escaped duplicate keys', '{"x":1,"\\u0078":2}'],
  ['trailing garbage', '{} x'],
  ['trailing comma', '{"x":1,}'],
  ['NaN', '{"x":NaN}'],
  ['infinity', '{"x":Infinity}'],
  ['leading zero', '{"x":01}'],
  ['BOM', '\ufeff{}'],
  ['invalid escape', '{"x":"\\q"}'],
] as const)
  test(`bounded token parser refuses ${name}`, () => {
    const { input, trust } = rawProjection(source)
    refuses(input, trust, 'SOURCE_INVALID', 6)
  })
test('invalid UTF-8 refuses without replacement decoding', () => {
  const { input, trust } = rawProjection(new Uint8Array([0xc3, 0x28]))
  refuses(input, trust, 'SOURCE_INVALID', 6)
})

test('exact and one-over JSON depth limits', () => {
  for (const depth of [16, 17]) {
    let value: unknown = null
    for (let i = 0; i < depth; i++) value = [value]
    const { input, trust } = rawProjection(JSON.stringify(value))
    refuses(input, trust, depth === 16 ? 'SOURCE_INVALID' : 'INPUT_LIMIT_EXCEEDED', 6)
  }
})
test('exact and one-over array entry limits', () => {
  for (const count of [10000, 10001]) {
    const { input, trust } = rawProjection(JSON.stringify(Array(count).fill(0)))
    refuses(input, trust, count === 10000 ? 'SOURCE_INVALID' : 'INPUT_LIMIT_EXCEEDED', 6)
  }
})
test('exact and one-over string/key UTF-16 limits including escaped characters', () => {
  for (const count of [4096, 4097])
    for (const key of [false, true]) {
      const value = '\\u0061'.repeat(count)
      const { input, trust } = rawProjection(key ? `{"${value}":0}` : `{"x":"${value}"}`)
      refuses(input, trust, count === 4096 ? 'SOURCE_INVALID' : 'INPUT_LIMIT_EXCEEDED', 6)
    }
})
test('exact and one-over aggregate string/key budget', () => {
  for (const extra of [0, 1]) {
    const value = { padding: [...Array(255).fill('a'.repeat(4096)), 'a'.repeat(4089 + extra)] }
    const { input, trust } = rawProjection(JSON.stringify(value))
    refuses(input, trust, extra === 0 ? 'SOURCE_INVALID' : 'INPUT_LIMIT_EXCEEDED', 6)
  }
})
test('exact and one-over visited-value budget includes primitive leaves', () => {
  for (const extra of [0, 1]) {
    const value = {
      v: [...Array.from({ length: 26 }, () => Array(10000).fill(0)), Array(2115 + extra).fill(0)],
    }
    const { input, trust } = rawProjection(JSON.stringify(value))
    refuses(input, trust, extra === 0 ? 'SOURCE_INVALID' : 'INPUT_LIMIT_EXCEEDED', 6)
  }
})
test('scope count exact limit accounts for each identity; one over refuses before element access', () => {
  const input = candidate()
  input.requestedIdentities = Array.from({ length: 256 }, (_, i) => ({
    provider: 'openrouter',
    id: `missing-${i}`,
  }))
  refuses(input, pins, 'INCOMPLETE_SCOPE', 256)
  input.requestedIdentities.length = 257
  Object.defineProperty(input.requestedIdentities, '0', {
    get() {
      throw new Error('must not read')
    },
  })
  refuses(input, pins, 'INPUT_LIMIT_EXCEEDED', 0)
})
test('field collection and source-model count one-over caps are refused', () => {
  for (const path of [
    ['rows', 0, 'reasoning', 'supportedEfforts'],
    ['rows', 0, 'inputModalities', 'sourceValue'],
  ] as const) {
    const { input, trust } = repinned((_m, p) =>
      put(
        p,
        path,
        Array.from({ length: 65 }, (_, i) => String(i)),
      ),
    )
    refuses(input, trust, 'INPUT_LIMIT_EXCEEDED', 6)
  }
  const { input, trust } = repinned((m) =>
    put(m, ['sourceScope', 'responseRuns', 0, 'modelCount'], 10001),
  )
  refuses(input, trust, 'INPUT_LIMIT_EXCEEDED', 6)
})

test('genuine byte storage ignores caller length and iteration but refuses hostile storage', () => {
  const input = candidate()
  Object.defineProperty(input.manifestBytes, 'byteLength', {
    get() {
      throw new Error('not called')
    },
  })
  Object.defineProperty(input.manifestBytes, Symbol.iterator, {
    value() {
      throw new Error('not called')
    },
  })
  assert.ok(producePublicObservationSnapshot(input, pins).ok)
  const detached = new Uint8Array(2)
  structuredClone(detached.buffer, { transfer: [detached.buffer] })
  for (const bytes of [
    new Proxy(new Uint8Array(2), {}),
    detached,
    new Uint8Array(new SharedArrayBuffer(2)),
    new Uint8Array(Reflect.construct(ArrayBuffer, [2, { maxByteLength: 3 }])),
    new Uint16Array(2),
    {},
  ]) {
    refuses({ ...candidate(), manifestBytes: bytes }, pins, 'INPUT_INVALID', 6)
  }
})

test('sparse arrays, symbol/index-like properties, accessors and cycles refuse without caller calls', () => {
  const arrays: unknown[] = [
    Array(1),
    Object.assign([{ provider: 'openrouter', id: 'x' }], { '01': {} }),
  ]
  const symbolic = [{ provider: 'openrouter', id: 'x' }]
  Object.defineProperty(symbolic, Symbol.iterator, {
    value() {
      throw new Error('iterator invoked')
    },
  })
  arrays.push(symbolic)
  const cycle: Document = { provider: 'openrouter' }
  cycle.id = cycle
  arrays.push([cycle])
  const accessor = {
    provider: 'openrouter',
    get id() {
      throw new Error('accessor invoked')
    },
  }
  arrays.push([accessor])
  for (const value of arrays)
    refuses({ ...candidate(), requestedIdentities: value }, pins, 'INPUT_INVALID', 0)
})

test('unknown thrown values are contained without inspecting them', () => {
  const revoked = Proxy.revocable({}, {})
  revoked.revoke()
  const throws = [
    null,
    1,
    'secret',
    revoked.proxy,
    new Proxy(
      {},
      {
        get() {
          throw new Error('read thrown value')
        },
        getPrototypeOf() {
          throw new Error('read thrown prototype')
        },
      },
    ),
  ]
  for (const value of throws) {
    const trusted = new Proxy(pins, {
      ownKeys() {
        throw value
      },
    })
    refuses(candidate(), trusted, 'INPUT_INVALID', 6)
    refuses(
      new Proxy(candidate(), {
        getPrototypeOf() {
          throw value
        },
      }),
      pins,
      'INPUT_INVALID',
      0,
    )
  }
})

test('trusted descriptor capture precedes candidate traps and captures each identity once', () => {
  const trust = { ...pins }
  const input = new Proxy(candidate(), {
    getPrototypeOf(target) {
      trust.expectedManifestSha256 = '0'.repeat(64)
      return Reflect.getPrototypeOf(target)
    },
  })
  assert.ok(producePublicObservationSnapshot(input, trust).ok)
  let descriptors = 0
  const shared = new Proxy(
    { provider: 'openrouter', id: 'x' },
    {
      getOwnPropertyDescriptor(target, key) {
        descriptors++
        return Reflect.getOwnPropertyDescriptor(target, key)
      },
    },
  )
  refuses({ ...candidate(), requestedIdentities: [shared, shared] }, pins, 'INPUT_INVALID', 0)
  assert.equal(descriptors, 2)
})

test('exact per-file and combined byte ceilings pass while one-over refuses before copy', () => {
  const size = 8 * 1024 * 1024
  const input = candidate()
  const projection = new Uint8Array(size).fill(32)
  projection.set(projectionBytes)
  input.projectionBytes = projection
  const manifest = JSON.parse(manifestBytes.toString())
  manifest.sealedProjection.sha256 = sha(projection)
  manifest.sealedProjection.byteLength = size
  const manifestPadded = new Uint8Array(size).fill(32)
  manifestPadded.set(encode(manifest))
  input.manifestBytes = manifestPadded
  const trust = {
    ...pins,
    expectedManifestSha256: sha(manifestPadded),
    expectedProjectionSha256: sha(projection),
  }
  assert.ok(producePublicObservationSnapshot(input, trust).ok)
  refuses({ ...input, manifestBytes: new Uint8Array(size + 1) }, trust, 'INPUT_LIMIT_EXCEEDED', 6)
  refuses({ ...input, projectionBytes: new Uint8Array(size + 1) }, trust, 'INPUT_LIMIT_EXCEEDED', 6)
})

test('closed envelope scope budgets count expanded string values and reject oversize identifiers', () => {
  const input = candidate()
  input.requestedIdentities = [{ provider: 'openrouter', id: 'x'.repeat(4096) }]
  refuses(input, pins, 'INCOMPLETE_SCOPE', 1)
  input.requestedIdentities[0] = { provider: 'openrouter', id: 'x'.repeat(4097) }
  refuses(input, pins, 'INPUT_LIMIT_EXCEEDED', 0)
  input.requestedIdentities = Array.from({ length: 256 }, (_, i) => ({
    provider: 'x'.repeat(4096),
    id: String(i).padEnd(4096, 'x'),
  }))
  refuses(input, pins, 'INPUT_LIMIT_EXCEEDED', 0)
})

test('exact and one-over per-field collection caps precede semantic interpretation', () => {
  for (const count of [64, 65]) {
    const { input, trust } = repinned((_m, p) =>
      put(
        p,
        ['rows', 0, 'thinkingLevelMap'],
        Object.fromEntries(Array.from({ length: count }, (_, i) => [`key${i}`, 'high'])),
      ),
    )
    refuses(input, trust, count === 64 ? 'SOURCE_INVALID' : 'INPUT_LIMIT_EXCEEDED', 6)
    const listFixture = repinned((_m, p) =>
      put(
        p,
        ['rows', 0, 'reasoning', 'supportedEfforts'],
        Array.from({ length: count }, (_, i) => `effort${i}`),
      ),
    )
    refuses(
      listFixture.input,
      listFixture.trust,
      count === 64 ? 'SOURCE_INVALID' : 'INPUT_LIMIT_EXCEEDED',
      6,
    )
  }
  const { input, trust } = repinned((m) =>
    put(m, ['sourceScope', 'responseRuns', 0, 'modelCount'], 10000),
  )
  assert.ok(producePublicObservationSnapshot(input, trust).ok)
})

test('nested closed shapes independently reject extra keys', () => {
  for (const path of [
    ['rows', 0, 'baseUrl'],
    ['rows', 0, 'api'],
    ['rows', 0, 'inputModalities'],
    ['rows', 0, 'reasoning'],
    ['rows', 0, 'contextWindow'],
    ['rows', 0, 'maxTokens'],
    ['rows', 0, 'cost'],
    ['rows', 0, 'cost', 'input'],
    ['excludedRefusals', 0],
    ['thinkingLevelSemantics'],
  ] as const) {
    const { input, trust } = repinned((_m, p) => put(p, [...path, 'unexpected'], true))
    refuses(input, trust, 'SOURCE_INVALID', 6)
  }
  for (const path of [
    ['sourceScope', 'responseRuns', 0],
    ['ratifiedBindingSource'],
    ['sealedProjection'],
    ['mappingProfile'],
    ['bindings', 0],
    ['bindings', 8],
    ['bindings', 14],
    ['assessment'],
  ] as const) {
    const { input, trust } = repinned((m) => put(m, [...path, 'unexpected'], true))
    refuses(input, trust, 'SOURCE_INVALID', 6)
  }
})

test('runtime performs no acquisition, environment or configuration access', (context) => {
  context.mock.method(globalThis, 'fetch', () => {
    throw new Error('network forbidden')
  })
  context.mock.method(Date, 'now', () => {
    throw new Error('ambient time forbidden')
  })
  assert.ok(producePublicObservationSnapshot(candidate(), pins).ok)
  const runtime = readFileSync(
    new URL('../src/public-observation-producer.ts', import.meta.url),
    'utf8',
  )
  const imports = [...runtime.matchAll(/from '([^']+)'/g)].map((match) => match[1])
  assert.deepEqual(imports, [
    'node:crypto',
    './catalog-eligibility-adapter.js',
    './catalog-snapshot.js',
  ])
  assert.ok(!/\b(?:fetch|process|require|eval|setTimeout)\s*[.(]/.test(runtime))
})

test('source output has no hidden authority and P1A independently refuses absent config', () => {
  const input = candidate()
  const result = producePublicObservationSnapshot(input, pins)
  assert.ok(result.ok)
  const wrapped = evaluateCatalogEligibility({
    canonicalBytes: result.canonicalBytes,
    expectedSha256: result.digestSha256,
    acceptedSource: result.acceptedSource,
    identities: input.requestedIdentities,
    evaluationTimeUtc: input.evaluationTimeUtc,
    approvedConfig: null,
  })
  assert.equal(wrapped.stage, 'projector')
  if (wrapped.stage === 'projector') assert.ok(!wrapped.result.ok)
  assert.ok(!('approvedConfig' in result.acceptedSource))
})

test('source counts cannot contradict retained coverage or binding row numbers', () => {
  for (const [path, value] of [
    [['sourceScope', 'responseRuns', 1, 'modelCount'], 6],
    [['bindings', 8, 'bindingNumber'], 99],
    [['ratifiedBindingSource', 'catalogueRefusedBindingNumbers'], [6]],
  ] as const) {
    const { input, trust } = repinned((m) => put(m, path, value))
    refuses(input, trust, 'SOURCE_INVALID', 6)
  }
})
