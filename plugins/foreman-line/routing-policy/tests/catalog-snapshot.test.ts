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
import { isReaderIssuedSnapshot, readCatalogSnapshot } from '../src/catalog-snapshot.js'

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
// A2 / F5 — never throw on hostile bytes
// ---------------------------------------------------------------------------

test('F5: null bytes refuse with FORMAT_REFUSED, never throw', () => {
  assert.doesNotThrow(() => {
    // biome-ignore lint/suspicious/noExplicitAny: deliberately hostile input for the never-throw probe
    const result = readCatalogSnapshot(null as any, fixtureDigest)
    assert.deepEqual(result, { ok: false, code: 'FORMAT_REFUSED' })
  })
})

test('F5: undefined bytes refuse with FORMAT_REFUSED, never throw', () => {
  assert.doesNotThrow(() => {
    // biome-ignore lint/suspicious/noExplicitAny: deliberately hostile input for the never-throw probe
    const result = readCatalogSnapshot(undefined as any, fixtureDigest)
    assert.deepEqual(result, { ok: false, code: 'FORMAT_REFUSED' })
  })
})

test('F5: a non-Uint8Array bytes value (plain object) refuses with FORMAT_REFUSED, never throws', () => {
  assert.doesNotThrow(() => {
    // biome-ignore lint/suspicious/noExplicitAny: deliberately hostile input for the never-throw probe
    const result = readCatalogSnapshot({ length: 3, 0: 1, 1: 2, 2: 3 } as any, fixtureDigest)
    assert.deepEqual(result, { ok: false, code: 'FORMAT_REFUSED' })
  })
})

test('F5: a Proxy with a throwing getPrototypeOf trap refuses with FORMAT_REFUSED, never throws', () => {
  const hostile = new Proxy(fixtureBytes, {
    getPrototypeOf() {
      throw new Error('hostile getPrototypeOf')
    },
  })
  assert.doesNotThrow(() => {
    const result = readCatalogSnapshot(hostile, fixtureDigest)
    assert.deepEqual(result, { ok: false, code: 'FORMAT_REFUSED' })
  })
})

// ---------------------------------------------------------------------------
// A2 round 2 / R3 — pathologically deep input cannot overflow the stack
// ---------------------------------------------------------------------------

test('R3: a deeply nested array (200,000 levels) refuses FORMAT_REFUSED, never throws or crashes', () => {
  const text = '['.repeat(200_000) + ']'.repeat(200_000)
  const bytes = Buffer.from(text, 'utf8')
  const digest = digestOf(bytes)
  assert.doesNotThrow(() => {
    const result = readCatalogSnapshot(bytes, digest)
    assert.deepEqual(result, { ok: false, code: 'FORMAT_REFUSED' })
  })
})

// ---------------------------------------------------------------------------
// A2 round 2 / R4, R7 — a hostile Uint8Array subclass cannot lie or throw
// through its own length
// ---------------------------------------------------------------------------

class ThrowingLengthBytes extends Uint8Array {
  override get length(): number {
    throw new Error('hostile length getter')
  }
}

class LyingLengthBytes extends Uint8Array {
  override get length(): number {
    return 1 // always lies, regardless of the real byte count
  }
}

test('R4/R7: a throwing-length Uint8Array subclass still reads correctly, never throws', () => {
  const hostile = new ThrowingLengthBytes(fixtureBytes)
  assert.doesNotThrow(() => {
    const result = readCatalogSnapshot(hostile, fixtureDigest)
    // The throwing getter is never invoked at all: the defensive copy reads
    // the real internal length slot, not the JS-observable accessor, so a
    // genuinely valid snapshot still reads successfully.
    assert.equal(result.ok, true)
  })
})

test('R4/R7: a lying-length Uint8Array subclass has no effect, never throws', () => {
  const hostile = new LyingLengthBytes(fixtureBytes)
  assert.doesNotThrow(() => {
    const result = readCatalogSnapshot(hostile, fixtureDigest)
    // The lie ("length is 1") is never consulted; the real, full byte
    // content is copied and read, so a genuinely valid snapshot still reads
    // successfully rather than being silently truncated to 1 byte.
    assert.equal(result.ok, true)
  })
})

test('R4/R7: a lying-length subclass cannot hide a real mismatch either', () => {
  // Corrupt one byte of an otherwise-valid canonical payload; the lying
  // subclass still can't make the corruption invisible, because the
  // defensive copy is taken from the true underlying bytes, not the length
  // the subclass claims.
  const corrupted = Buffer.from(fixtureBytes)
  corrupted[50] = (corrupted[50] ?? 0) ^ 0xff
  const hostile = new LyingLengthBytes(corrupted)
  assert.doesNotThrow(() => {
    const result = readCatalogSnapshot(hostile, fixtureDigest)
    assert.deepEqual(result, { ok: false, code: 'DIGEST_REFUSED' })
  })
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
    name: 'model: a baseUrl carrying a bare empty query (?) refuses (A2 / F6)',
    mutate: (root) => {
      rec(arr(root.models)[0]).baseUrl = 'https://openrouter.ai/api/v1?'
    },
  },
  {
    name: 'model: a baseUrl carrying a bare empty fragment (#) refuses (A2 / F6)',
    mutate: (root) => {
      rec(arr(root.models)[0]).baseUrl = 'https://openrouter.ai/api/v1#'
    },
  },
  {
    name: 'model: a baseUrl carrying a bare empty userinfo (@) refuses (A2 / F6)',
    mutate: (root) => {
      rec(arr(root.models)[0]).baseUrl = 'https://@openrouter.ai/api/v1'
    },
  },
  {
    name: 'model: a baseUrl with an uppercase scheme refuses (A2 round 2 / R8)',
    mutate: (root) => {
      rec(arr(root.models)[0]).baseUrl = 'HTTPS://openrouter.ai/api/v1'
    },
  },
  {
    name: 'model: a baseUrl with a mixed-case scheme refuses (A2 round 2 / R8)',
    mutate: (root) => {
      rec(arr(root.models)[0]).baseUrl = 'Https://openrouter.ai/api/v1'
    },
  },
  {
    // The WHATWG URL parser itself already throws on a genuinely empty host
    // for a special scheme like https (verified: 'https:///x' actually
    // parses host "x", not an empty host -- there is no live input where
    // `new URL()` both succeeds AND returns an empty hostname for this
    // scheme). This exercises that existing parse-failure path; the
    // explicit `url.hostname.length === 0` check added for R8 is
    // defense-in-depth for the same requirement, not separately reachable
    // through this parser.
    name: 'model: a baseUrl with no host at all refuses (A2 round 2 / R8)',
    mutate: (root) => {
      rec(arr(root.models)[0]).baseUrl = 'https://'
    },
  },
  {
    name: 'model: a baseUrl carrying a space refuses (A2 round 2 / R8)',
    mutate: (root) => {
      rec(arr(root.models)[0]).baseUrl = 'https://openrouter.ai/api /v1'
    },
  },
  {
    name: 'model: a baseUrl carrying a tab refuses (A2 round 2 / R8)',
    mutate: (root) => {
      rec(arr(root.models)[0]).baseUrl = 'https://openrouter.ai/api\t/v1'
    },
  },
  {
    name: 'model: a baseUrl carrying a backslash refuses (A2 round 2 / R8)',
    mutate: (root) => {
      rec(arr(root.models)[0]).baseUrl = 'https://openrouter.ai/api\\v1'
    },
  },
  {
    name: 'model: a baseUrl carrying a control character refuses (A2 round 2 / R8)',
    mutate: (root) => {
      rec(arr(root.models)[0]).baseUrl = 'https://openrouter.ai/api/v1'
    },
  },
  {
    name: 'model: a non-object thinkingLevelMap (array) refuses (AC3 / F8)',
    mutate: (root) => {
      rec(arr(root.models)[1]).thinkingLevelMap = ['high', 'low']
    },
  },
  {
    name: 'model: a non-object thinkingLevelMap (string) refuses (AC3 / F8)',
    mutate: (root) => {
      rec(arr(root.models)[1]).thinkingLevelMap = 'declared'
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
// A2 / F1 — reader-issued snapshot registry
// ---------------------------------------------------------------------------

test('F1: isReaderIssuedSnapshot is true for a snapshot this reader actually returned', () => {
  const result = readCatalogSnapshot(fixtureBytes, fixtureDigest)
  assert.equal(result.ok, true)
  if (!result.ok) throw new Error('unreachable')
  assert.equal(isReaderIssuedSnapshot(result.snapshot), true)
})

test('F1: isReaderIssuedSnapshot is false for a forged plain object with the same shape', () => {
  const result = readCatalogSnapshot(fixtureBytes, fixtureDigest)
  assert.equal(result.ok, true)
  if (!result.ok) throw new Error('unreachable')
  const forged = { ...result.snapshot }
  assert.equal(isReaderIssuedSnapshot(forged), false)
})

test('F1: isReaderIssuedSnapshot is false for Object.create(realSnapshot)', () => {
  const result = readCatalogSnapshot(fixtureBytes, fixtureDigest)
  assert.equal(result.ok, true)
  if (!result.ok) throw new Error('unreachable')
  const derived = Object.create(result.snapshot)
  assert.equal(isReaderIssuedSnapshot(derived), false)
})

test('F1: isReaderIssuedSnapshot is false for a Proxy of a real snapshot', () => {
  const result = readCatalogSnapshot(fixtureBytes, fixtureDigest)
  assert.equal(result.ok, true)
  if (!result.ok) throw new Error('unreachable')
  const proxied = new Proxy(result.snapshot, {})
  assert.equal(isReaderIssuedSnapshot(proxied), false)
})

test('F1: isReaderIssuedSnapshot never throws on null, undefined, or a primitive', () => {
  assert.equal(isReaderIssuedSnapshot(null), false)
  assert.equal(isReaderIssuedSnapshot(undefined), false)
  assert.equal(isReaderIssuedSnapshot('not an object'), false)
  assert.equal(isReaderIssuedSnapshot(42), false)
})

test('F1: a real snapshot is deep-frozen; a mutation attempt throws TypeError and leaves it unchanged', () => {
  const result = readCatalogSnapshot(fixtureBytes, fixtureDigest)
  assert.equal(result.ok, true)
  if (!result.ok) throw new Error('unreachable')
  const firstModel = result.snapshot.models[0]
  assert.ok(firstModel)
  const originalContextWindow = firstModel.contextWindow
  assert.throws(() => {
    // @ts-expect-error intentional write to a readonly, frozen field
    firstModel.contextWindow = -1
  }, TypeError)
  assert.equal(firstModel.contextWindow, originalContextWindow)
  assert.throws(() => {
    // @ts-expect-error intentional write to a readonly, frozen field
    result.snapshot.sourceRef = 'mutated'
  }, TypeError)
})

// ---------------------------------------------------------------------------
// A2 / F3 — thinking-map keys are kept verbatim, including __proto__
// ---------------------------------------------------------------------------

test('F3: a thinking-map key literally named __proto__ survives the reader verbatim', () => {
  const { bytes, digest } = mutated((root) => {
    // Computed key, not a literal `__proto__:` property definition: the
    // latter is proto-assignment syntax (Annex B.3.1) and would silently
    // produce no own property at all, testing nothing.
    rec(arr(root.models)[1]).thinkingLevelMap = { ['__proto__']: 'HIGH', low: 'low' }
  })
  const result = readCatalogSnapshot(bytes, digest)
  assert.equal(result.ok, true)
  if (!result.ok) throw new Error('unreachable')
  const model = result.snapshot.models[1]
  assert.ok(model?.thinkingLevelMap)
  assert.equal(Object.hasOwn(model.thinkingLevelMap, '__proto__'), true)
  // biome-ignore lint/suspicious/noProto: the point of this test is the literal own-property key "__proto__"
  assert.equal(model.thinkingLevelMap['__proto__'], 'HIGH')
  assert.deepEqual(Object.keys(model.thinkingLevelMap), ['__proto__', 'low'])
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

/**
 * The explicit P0_DERIVED list (F8 / AC15): every fixture record copied
 * field-for-field from the committed P0 evidence snapshot. Any fixture
 * record NOT on this list must instead carry the reserved `fixture-`
 * provider prefix (Fixture Policy) — checked by the test below this one.
 */
const P0_DERIVED: { readonly provider: string; readonly id: string }[] = [
  { provider: 'openrouter', id: 'nvidia/nemotron-3.5-lightning' },
  { provider: 'openrouter', id: 'z-ai/glm-5.3' },
  { provider: 'nvidia', id: 'z-ai/glm-5.3' },
  { provider: 'openai', id: 'gpt-4o-mini' },
  { provider: 'openrouter', id: 'anthropic/claude-opus-5' },
  { provider: 'openrouter', id: 'anthropic/claude-fable-5.1' },
  { provider: 'openrouter', id: 'anthropic/claude-sonnet-5' },
  { provider: 'openrouter', id: 'anthropic/claude-haiku-4.5' },
  { provider: 'openrouter', id: 'auto' },
  { provider: 'openrouter', id: 'openrouter/auto' },
  { provider: 'openrouter', id: 'openrouter/auto-beta' },
  { provider: 'openrouter', id: 'nvidia/nemotron-3.5-lightning:free' },
  { provider: 'openrouter', id: 'anthropic/claude-fable-5:batch' },
  { provider: 'opencode-go', id: 'deepseek-v4.1-flash' },
  { provider: 'opencode', id: 'glm-5.1' },
]

test('AC15: the fixture reads successfully under its own closed shape and digest', () => {
  const result = readCatalogSnapshot(fixtureBytes, fixtureDigest)
  assert.equal(result.ok, true)
})

test('AC15: every P0_DERIVED fixture record deep-equals its matching P0 record on the ten fact fields', () => {
  const p0 = JSON.parse(readFileSync(p0EvidencePath, 'utf8')) as { models: JsonRecord[] }
  const fixture = JSON.parse(fixtureText) as { models: JsonRecord[] }

  assert.ok(P0_DERIVED.length > 0)
  for (const identity of P0_DERIVED) {
    const fixtureModel = fixture.models.find(
      (m) => m.provider === identity.provider && m.id === identity.id,
    )
    assert.ok(
      fixtureModel,
      `P0_DERIVED entry missing from fixture: ${identity.provider}/${identity.id}`,
    )
    const p0Model = p0.models.find((m) => m.provider === identity.provider && m.id === identity.id)
    assert.ok(p0Model, `no matching P0 record for ${identity.provider}/${identity.id}`)
    for (const field of FACT_FIELDS) {
      assert.deepEqual(
        rec(fixtureModel)[field],
        rec(p0Model)[field],
        `field '${field}' differs for ${identity.provider}/${identity.id}`,
      )
    }
    // thinkingLevelMap is optional; present-or-absent must also match P0.
    assert.deepEqual(rec(fixtureModel).thinkingLevelMap, rec(p0Model).thinkingLevelMap)
  }
})

test('AC15: every fixture record is either on P0_DERIVED or uses the reserved fixture- provider prefix', () => {
  const fixture = JSON.parse(fixtureText) as { models: JsonRecord[] }
  const p0DerivedKeys = new Set(P0_DERIVED.map((i) => `${i.provider}\t${i.id}`))
  for (const model of fixture.models) {
    const key = `${String(model.provider)}\t${String(model.id)}`
    const isP0Derived = p0DerivedKeys.has(key)
    const usesFixturePrefix =
      typeof model.provider === 'string' && model.provider.startsWith('fixture-')
    assert.ok(
      isP0Derived || usesFixturePrefix,
      `record ${String(model.provider)}/${String(model.id)} is neither on P0_DERIVED nor fixture--prefixed`,
    )
  }
})

test('AC15: the fixture- prefix rule is actually exercised by at least one hand-built record', () => {
  const fixture = JSON.parse(fixtureText) as { models: JsonRecord[] }
  const p0DerivedKeys = new Set(P0_DERIVED.map((i) => `${i.provider}\t${i.id}`))
  const handBuilt = fixture.models.filter((m) => {
    const key = `${String(m.provider)}\t${String(m.id)}`
    return !p0DerivedKeys.has(key)
  })
  assert.ok(handBuilt.length > 0, 'expected at least one fixture--prefixed hand-built record')
  for (const model of handBuilt) {
    assert.equal(typeof model.provider, 'string')
    assert.ok((model.provider as string).startsWith('fixture-'))
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
