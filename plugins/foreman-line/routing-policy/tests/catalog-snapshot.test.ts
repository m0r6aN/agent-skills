/**
 * RCM-P1 AC1-AC4, AC15: `readCatalogSnapshot` digest binding, canonical
 * format, closed shape, duplicate-identity refusal, and fixture provenance.
 */
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { readCatalogSnapshot } from '../src/catalog-snapshot.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixturePath = join(here, 'fixtures', 'catalog-snapshot', 'baseline.v1.json')
const p0EvidencePath = join(
  here,
  '..',
  '..',
  'docs',
  'goals',
  'routing-currency-and-merit',
  'rcm-p0-catalog-snapshot.v1.json',
)

const fixtureBytes = readFileSync(fixturePath)
const fixtureText = fixtureBytes.toString('utf8')

// Test-side digest: an independent node:crypto call, never the reader's own.
function digestOf(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex')
}

const fixtureDigest = digestOf(fixtureBytes)

type JsonRecord = Record<string, unknown>

function rec(value: unknown): JsonRecord {
  return value as JsonRecord
}

function arr(value: unknown): unknown[] {
  return value as unknown[]
}

function cloneFixture(): JsonRecord {
  return JSON.parse(fixtureText) as JsonRecord
}

function canonicalBytesOf(parsed: unknown): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(parsed, null, 2)}\n`)
}

/** Clone the fixture, apply `mutate`, re-serialize canonically, and re-digest. */
function mutated(mutate: (root: JsonRecord) => void): { bytes: Uint8Array; digest: string } {
  const clone = cloneFixture()
  mutate(clone)
  const bytes = canonicalBytesOf(clone)
  return { bytes, digest: digestOf(bytes) }
}

// ---------------------------------------------------------------------------
// AC1 — Digest binding
// ---------------------------------------------------------------------------

test('AC1: valid bytes with their true digest read successfully', () => {
  const result = readCatalogSnapshot(fixtureBytes, fixtureDigest)
  assert.equal(result.ok, true)
})

test('AC1: a one-byte mutation refuses with DIGEST_REFUSED', () => {
  const mutatedBytes = Buffer.from(fixtureBytes)
  mutatedBytes[50] = (mutatedBytes[50] ?? 0) ^ 0xff
  const result = readCatalogSnapshot(mutatedBytes, fixtureDigest)
  assert.deepEqual(result, { ok: false, code: 'DIGEST_REFUSED' })
})

test('AC1: an expected digest that is too short refuses with DIGEST_REFUSED', () => {
  const result = readCatalogSnapshot(fixtureBytes, '0'.repeat(63))
  assert.deepEqual(result, { ok: false, code: 'DIGEST_REFUSED' })
})

test('AC1: an expected digest with uppercase hex refuses with DIGEST_REFUSED', () => {
  const result = readCatalogSnapshot(fixtureBytes, fixtureDigest.toUpperCase())
  assert.deepEqual(result, { ok: false, code: 'DIGEST_REFUSED' })
})

test('AC1: an expected digest with a non-hex character refuses with DIGEST_REFUSED', () => {
  const result = readCatalogSnapshot(fixtureBytes, `${'0'.repeat(63)}g`)
  assert.deepEqual(result, { ok: false, code: 'DIGEST_REFUSED' })
})

test('AC1: a non-string expected digest refuses with DIGEST_REFUSED', () => {
  const result = readCatalogSnapshot(fixtureBytes, 123456)
  assert.deepEqual(result, { ok: false, code: 'DIGEST_REFUSED' })
})

test('AC1: a null expected digest refuses with DIGEST_REFUSED', () => {
  const result = readCatalogSnapshot(fixtureBytes, null)
  assert.deepEqual(result, { ok: false, code: 'DIGEST_REFUSED' })
})

test('AC1: an undefined expected digest refuses with DIGEST_REFUSED', () => {
  const result = readCatalogSnapshot(fixtureBytes, undefined)
  assert.deepEqual(result, { ok: false, code: 'DIGEST_REFUSED' })
})

// ---------------------------------------------------------------------------
// AC2 — Format and canonical bytes
// ---------------------------------------------------------------------------

test('AC2: invalid UTF-8 bytes refuse with FORMAT_REFUSED', () => {
  const bytes = new Uint8Array([0x7b, 0xff, 0xfe, 0x7d])
  const result = readCatalogSnapshot(bytes, digestOf(bytes))
  assert.deepEqual(result, { ok: false, code: 'FORMAT_REFUSED' })
})

test('AC2: a byte-order mark refuses with FORMAT_REFUSED', () => {
  const bytes = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), fixtureBytes])
  const result = readCatalogSnapshot(bytes, digestOf(bytes))
  assert.deepEqual(result, { ok: false, code: 'FORMAT_REFUSED' })
})

test('AC2: non-JSON bytes refuse with FORMAT_REFUSED', () => {
  const bytes = Buffer.from('this is not JSON at all', 'utf8')
  const result = readCatalogSnapshot(bytes, digestOf(bytes))
  assert.deepEqual(result, { ok: false, code: 'FORMAT_REFUSED' })
})

test('AC2: CRLF line endings refuse with FORMAT_REFUSED', () => {
  const bytes = Buffer.from(fixtureText.replace(/\n/g, '\r\n'), 'utf8')
  const result = readCatalogSnapshot(bytes, digestOf(bytes))
  assert.deepEqual(result, { ok: false, code: 'FORMAT_REFUSED' })
})

test('AC2: a duplicate JSON member refuses with FORMAT_REFUSED', () => {
  const text = [
    '{',
    '"formatVersion": "rcm-catalog-snapshot/v1",',
    '"formatVersion": "rcm-catalog-snapshot/v1",',
    '"sourceRef": "dup-test",',
    '"providers": [{"providerKey": "p", "checkedAtUtc": null}],',
    '"models": [{"provider": "p", "id": "m", "baseUrl": "https://x.example/y", "api": "a", "input": ["text"], "reasoning": true, "contextWindow": 1, "maxTokens": 1, "cost": {"input": {"unit": "USD per 1M tokens", "value": 1}, "output": {"unit": "USD per 1M tokens", "value": 1}}}]',
    '}',
  ].join('\n')
  const bytes = Buffer.from(text, 'utf8')
  const result = readCatalogSnapshot(bytes, digestOf(bytes))
  assert.deepEqual(result, { ok: false, code: 'FORMAT_REFUSED' })
})

test('AC2: numeric overflow (1e400) refuses with FORMAT_REFUSED', () => {
  const text = [
    '{',
    '"formatVersion": "rcm-catalog-snapshot/v1",',
    '"sourceRef": "overflow-test",',
    '"providers": [{"providerKey": "p", "checkedAtUtc": null}],',
    '"models": [{"provider": "p", "id": "m", "baseUrl": "https://x.example/y", "api": "a", "input": ["text"], "reasoning": true, "contextWindow": 1, "maxTokens": 1, "cost": {"input": {"unit": "USD per 1M tokens", "value": 1e400}, "output": {"unit": "USD per 1M tokens", "value": 1}}}]',
    '}',
  ].join('\n')
  const bytes = Buffer.from(text, 'utf8')
  const result = readCatalogSnapshot(bytes, digestOf(bytes))
  assert.deepEqual(result, { ok: false, code: 'FORMAT_REFUSED' })
})

test('AC2: a formatVersion other than rcm-catalog-snapshot/v1 refuses with FORMAT_REFUSED', () => {
  const { bytes, digest } = mutated((root) => {
    root.formatVersion = 'rcm-catalog-snapshot/v2'
  })
  const result = readCatalogSnapshot(bytes, digest)
  assert.deepEqual(result, { ok: false, code: 'FORMAT_REFUSED' })
})

test('AC2: the committed P0 evidence file, with its true digest, refuses with FORMAT_REFUSED (negative control)', () => {
  const p0Bytes = readFileSync(p0EvidencePath)
  const p0Digest = digestOf(p0Bytes)
  const result = readCatalogSnapshot(p0Bytes, p0Digest)
  assert.deepEqual(result, { ok: false, code: 'FORMAT_REFUSED' })
})

// ---------------------------------------------------------------------------
// AC3 — Closed shape (MALFORMED_REFUSED), one test per invalid shape
// ---------------------------------------------------------------------------

const malformedCases: { name: string; mutate: (root: JsonRecord) => void }[] = [
  {
    name: 'envelope: an unknown extra field refuses',
    mutate: (root) => {
      root.unexpectedField = 'x'
    },
  },
  {
    name: 'envelope: a missing required field (sourceRef) refuses',
    mutate: (root) => {
      delete root.sourceRef
    },
  },
  {
    name: 'envelope: a wrong-typed field (sourceRef as number) refuses',
    mutate: (root) => {
      root.sourceRef = 42
    },
  },
  {
    name: 'envelope: empty providers[] refuses',
    mutate: (root) => {
      root.providers = []
    },
  },
  {
    name: 'envelope: empty models[] refuses',
    mutate: (root) => {
      root.models = []
    },
  },
  {
    name: 'provider: an unknown extra field refuses',
    mutate: (root) => {
      rec(arr(root.providers)[0]).extra = true
    },
  },
  {
    name: 'provider: a missing required field (checkedAtUtc) refuses',
    mutate: (root) => {
      delete rec(arr(root.providers)[0]).checkedAtUtc
    },
  },
  {
    name: 'provider: a wrong-typed field (checkedAtUtc as number) refuses',
    mutate: (root) => {
      rec(arr(root.providers)[0]).checkedAtUtc = 12345
    },
  },
  {
    name: 'model: an unknown extra field (headers) refuses',
    mutate: (root) => {
      rec(arr(root.models)[0]).headers = { authorization: 'x' }
    },
  },
  {
    name: 'model: an unknown extra field (compat) refuses',
    mutate: (root) => {
      rec(arr(root.models)[0]).compat = {}
    },
  },
  {
    name: 'model: an unknown extra field (name) refuses',
    mutate: (root) => {
      rec(arr(root.models)[0]).name = 'x'
    },
  },
  {
    name: 'model: a missing required field (api) refuses',
    mutate: (root) => {
      delete rec(arr(root.models)[0]).api
    },
  },
  {
    name: 'model: a wrong-typed field (reasoning as string) refuses',
    mutate: (root) => {
      rec(arr(root.models)[0]).reasoning = 'true'
    },
  },
  {
    name: 'model: a provider that is not a declared providerKey refuses',
    mutate: (root) => {
      rec(arr(root.models)[0]).provider = 'not-a-declared-provider'
    },
  },
  {
    name: 'model: a non-positive contextWindow refuses',
    mutate: (root) => {
      rec(arr(root.models)[0]).contextWindow = 0
    },
  },
  {
    name: 'model: a non-integer contextWindow refuses',
    mutate: (root) => {
      rec(arr(root.models)[0]).contextWindow = 1.5
    },
  },
  {
    name: 'model: a non-positive maxTokens refuses',
    mutate: (root) => {
      rec(arr(root.models)[0]).maxTokens = -1
    },
  },
  {
    name: 'model: a non-integer maxTokens refuses',
    mutate: (root) => {
      rec(arr(root.models)[0]).maxTokens = 100.25
    },
  },
  {
    name: 'model: an empty input[] refuses',
    mutate: (root) => {
      rec(arr(root.models)[0]).input = []
    },
  },
  {
    name: 'model: a duplicate input[] entry refuses',
    mutate: (root) => {
      rec(arr(root.models)[0]).input = ['text', 'text']
    },
  },
  {
    name: 'model: a baseUrl that is not https: refuses',
    mutate: (root) => {
      rec(arr(root.models)[0]).baseUrl = 'http://openrouter.ai/api/v1'
    },
  },
  {
    name: 'model: a baseUrl carrying userinfo refuses',
    mutate: (root) => {
      rec(arr(root.models)[0]).baseUrl = 'https://user:pass@openrouter.ai/api/v1'
    },
  },
  {
    name: 'model: a baseUrl carrying a query refuses',
    mutate: (root) => {
      rec(arr(root.models)[0]).baseUrl = 'https://openrouter.ai/api/v1?x=1'
    },
  },
  {
    name: 'model: a baseUrl carrying a fragment refuses',
    mutate: (root) => {
      rec(arr(root.models)[0]).baseUrl = 'https://openrouter.ai/api/v1#frag'
    },
  },
  {
    name: 'cost: an unknown extra field refuses',
    mutate: (root) => {
      rec(rec(arr(root.models)[0]).cost).extra = 1
    },
  },
  {
    name: 'cost: a missing side (output) refuses',
    mutate: (root) => {
      delete rec(rec(arr(root.models)[0]).cost).output
    },
  },
  {
    name: 'cost side: an unknown extra field refuses',
    mutate: (root) => {
      rec(rec(rec(arr(root.models)[0]).cost).input).extra = 1
    },
  },
  {
    name: 'cost side: a wrong-typed unit refuses',
    mutate: (root) => {
      rec(rec(rec(arr(root.models)[0]).cost).input).unit = 7
    },
  },
  {
    name: 'cost side: a wrong-typed value (string) refuses',
    mutate: (root) => {
      rec(rec(rec(arr(root.models)[0]).cost).input).value = '1'
    },
  },
  {
    name: 'thinking-map: a wrong-typed value refuses',
    mutate: (root) => {
      // fixture model index 1 (openrouter/z-ai/glm-5.3) carries a thinkingLevelMap
      rec(rec(arr(root.models)[1]).thinkingLevelMap).high = 7
    },
  },
]

for (const testCase of malformedCases) {
  test(`AC3: ${testCase.name} with MALFORMED_REFUSED`, () => {
    const { bytes, digest } = mutated(testCase.mutate)
    const result = readCatalogSnapshot(bytes, digest)
    assert.deepEqual(result, { ok: false, code: 'MALFORMED_REFUSED' })
  })
}

// ---------------------------------------------------------------------------
// AC4 — Duplicate identity
// ---------------------------------------------------------------------------

test('AC4: a repeated providerKey refuses with DUPLICATE_PROVIDER_REFUSED', () => {
  const { bytes, digest } = mutated((root) => {
    const providers = arr(root.providers)
    providers.push({ ...rec(providers[0]) })
  })
  const result = readCatalogSnapshot(bytes, digest)
  assert.deepEqual(result, { ok: false, code: 'DUPLICATE_PROVIDER_REFUSED' })
})

test('AC4: a repeated (provider, id) model pair refuses with DUPLICATE_IDENTITY_REFUSED', () => {
  const { bytes, digest } = mutated((root) => {
    const models = arr(root.models)
    models.push({ ...rec(models[0]) })
  })
  const result = readCatalogSnapshot(bytes, digest)
  assert.deepEqual(result, { ok: false, code: 'DUPLICATE_IDENTITY_REFUSED' })
})

test('AC4: the same id under two different providers is legal (nvidia/openrouter z-ai/glm-5.3)', () => {
  const result = readCatalogSnapshot(fixtureBytes, fixtureDigest)
  assert.equal(result.ok, true)
  if (!result.ok) throw new Error('unreachable')
  const matches = result.snapshot.models.filter((m) => m.id === 'z-ai/glm-5.3')
  assert.deepEqual(matches.map((m) => m.provider).sort(), ['nvidia', 'openrouter'])
})

// ---------------------------------------------------------------------------
// AC15 — Fixture provenance
// ---------------------------------------------------------------------------

const FACT_FIELDS = [
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

test('AC15: the fixture reads successfully under its own closed shape and digest', () => {
  const result = readCatalogSnapshot(fixtureBytes, fixtureDigest)
  assert.equal(result.ok, true)
})

test('AC15: every fixture record deep-equals its matching P0 record on the ten fact fields', () => {
  const p0 = JSON.parse(readFileSync(p0EvidencePath, 'utf8')) as { models: JsonRecord[] }
  const fixture = JSON.parse(fixtureText) as { models: JsonRecord[] }

  assert.ok(fixture.models.length > 0)
  for (const fixtureModel of fixture.models) {
    const p0Model = p0.models.find(
      (m) => m.provider === fixtureModel.provider && m.id === fixtureModel.id,
    )
    assert.ok(
      p0Model,
      `no matching P0 record for ${String(fixtureModel.provider)}/${String(fixtureModel.id)}`,
    )
    for (const field of FACT_FIELDS) {
      assert.deepEqual(
        fixtureModel[field],
        rec(p0Model)[field],
        `field '${field}' differs for ${String(fixtureModel.provider)}/${String(fixtureModel.id)}`,
      )
    }
    // thinkingLevelMap is optional; present-or-absent must also match P0.
    assert.deepEqual(fixtureModel.thinkingLevelMap, rec(p0Model).thinkingLevelMap)
  }
})

function collectStringValues(value: unknown, out: string[]): void {
  if (typeof value === 'string') {
    out.push(value)
  } else if (Array.isArray(value)) {
    for (const item of value) collectStringValues(item, out)
  } else if (value !== null && typeof value === 'object') {
    for (const v of Object.values(value as JsonRecord)) collectStringValues(v, out)
  }
}

test('AC15: no string value in the fixture matches a credential-shaped pattern', () => {
  const parsed = JSON.parse(fixtureText)
  const values: string[] = []
  collectStringValues(parsed, values)
  const CREDENTIAL_PATTERN = /bearer|authorization|api[_-]?key|secret/i
  for (const value of values) {
    assert.equal(CREDENTIAL_PATTERN.test(value), false, `credential-shaped string found: ${value}`)
  }
})
