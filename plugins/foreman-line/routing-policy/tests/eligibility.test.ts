/**
 * RCM-P1 AC5-AC14: `projectEligibility` time inputs, freshness, approved
 * configuration authority, exact endpoint join, catalog absence/identity,
 * rejected classes, order preservation, facts shape, and refusal dominance.
 */
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { readCatalogSnapshot } from '../src/catalog-snapshot.js'
import type { CatalogSnapshot, IdentityResult, ProjectionResult } from '../src/eligibility.js'
import {
  IDENTITY_REFUSAL_CODES,
  META_ROUTER_IDS,
  projectEligibility,
  REFUSED_VARIANT_SUFFIXES,
  SNAPSHOT_REFUSAL_CODES,
} from '../src/eligibility.js'

/**
 * The contract's declared `req` type (correction 1). Hostile-input tests pass
 * values outside that type through this cast; the runtime still refuses them.
 */
type ProjectionRequest = Parameters<typeof projectEligibility>[0]

function asRequest(value: unknown): ProjectionRequest {
  return value as ProjectionRequest
}

const here = dirname(fileURLToPath(import.meta.url))
const fixturePath = join(here, 'fixtures', 'catalog-snapshot', 'baseline.v1.json')
const fixtureBytes = readFileSync(fixturePath)
const fixtureText = fixtureBytes.toString('utf8')

function digestOf(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex')
}

type JsonRecord = Record<string, unknown>

function rec(value: unknown): JsonRecord {
  return value as JsonRecord
}

function arr(value: unknown): unknown[] {
  return value as unknown[]
}

/** Clone the fixture, apply `mutate`, re-serialize canonically, and read it back into a snapshot. */
function mutatedSnapshot(mutate: (root: JsonRecord) => void): CatalogSnapshot {
  const clone = JSON.parse(fixtureText) as JsonRecord
  mutate(clone)
  const bytes = new TextEncoder().encode(`${JSON.stringify(clone, null, 2)}\n`)
  const result = readCatalogSnapshot(bytes, digestOf(bytes))
  if (!result.ok) {
    throw new Error(`test fixture mutation produced an unreadable snapshot: ${result.code}`)
  }
  return result.snapshot
}

const baseSnapshot: CatalogSnapshot = (() => {
  const result = readCatalogSnapshot(fixtureBytes, digestOf(fixtureBytes))
  if (!result.ok) throw new Error('fixture must read successfully')
  return result.snapshot
})()

/** Matches every provider present in the fixture, with the baseUrl each fixture record actually uses. */
const DEFAULT_APPROVED_CONFIG = {
  authorityRef: 'test-authority',
  endpoints: [
    { provider: 'openrouter', baseUrl: 'https://openrouter.ai/api/v1' },
    { provider: 'nvidia', baseUrl: 'https://integrate.api.nvidia.com/v1' },
    { provider: 'openai', baseUrl: 'https://api.openai.com/v1' },
    { provider: 'opencode', baseUrl: 'https://opencode.ai/zen/v1' },
    { provider: 'opencode-go', baseUrl: 'https://opencode.ai/zen/go/v1' },
  ],
}

const FRESH_EVAL_TIME = '2026-09-21T13:00:00.000Z' // 1h after the fixture's synthetic checkedAtUtc

function project(overrides: {
  snapshot?: CatalogSnapshot
  approvedConfig?: unknown
  evaluationTimeUtc?: unknown
  identities?: unknown
}): ProjectionResult {
  // Every field below uses `key in overrides`, never `??`: a test that
  // deliberately passes null/undefined for one of these (F1's snapshot
  // tests, F7's approvedConfig tests) must have that exact value reach
  // projectEligibility, not silently fall back to the default.
  return projectEligibility({
    snapshot: 'snapshot' in overrides ? (overrides.snapshot as CatalogSnapshot) : baseSnapshot,
    approvedConfig:
      'approvedConfig' in overrides ? overrides.approvedConfig : DEFAULT_APPROVED_CONFIG,
    evaluationTimeUtc:
      'evaluationTimeUtc' in overrides ? overrides.evaluationTimeUtc : FRESH_EVAL_TIME,
    identities:
      'identities' in overrides
        ? overrides.identities
        : [{ provider: 'openai', id: 'gpt-4o-mini' }],
  })
}

function singleResult(result: ProjectionResult): IdentityResult {
  assert.equal(result.ok, true)
  if (!result.ok) throw new Error('unreachable')
  assert.equal(result.results.length, 1)
  const first = result.results[0]
  assert.ok(first)
  return first
}

// ---------------------------------------------------------------------------
// A2 / F1 — reader-issued snapshot only, checked before anything else
// ---------------------------------------------------------------------------

test('F1: a forged plain object with the real snapshot shape refuses SNAPSHOT_UNVERIFIED_REFUSED', () => {
  const forged = { ...baseSnapshot }
  const result = project({ snapshot: forged })
  assert.deepEqual(result, { ok: false, level: 'snapshot', code: 'SNAPSHOT_UNVERIFIED_REFUSED' })
})

test('F1: Object.create(realSnapshot) refuses SNAPSHOT_UNVERIFIED_REFUSED', () => {
  const derived = Object.create(baseSnapshot)
  const result = project({ snapshot: derived })
  assert.deepEqual(result, { ok: false, level: 'snapshot', code: 'SNAPSHOT_UNVERIFIED_REFUSED' })
})

test('F1: a Proxy of a real snapshot refuses SNAPSHOT_UNVERIFIED_REFUSED', () => {
  const proxied = new Proxy(baseSnapshot, {})
  const result = project({ snapshot: proxied })
  assert.deepEqual(result, { ok: false, level: 'snapshot', code: 'SNAPSHOT_UNVERIFIED_REFUSED' })
})

test('F1: null or undefined snapshot refuses SNAPSHOT_UNVERIFIED_REFUSED, never throws', () => {
  // projectEligibility() called directly, not via the project() helper: the
  // helper's `??` fallback would swallow a deliberate null/undefined snapshot.
  assert.doesNotThrow(() => {
    const result = projectEligibility({
      snapshot: null as unknown as CatalogSnapshot,
      approvedConfig: DEFAULT_APPROVED_CONFIG,
      evaluationTimeUtc: FRESH_EVAL_TIME,
      identities: [{ provider: 'openai', id: 'gpt-4o-mini' }],
    })
    assert.deepEqual(result, { ok: false, level: 'snapshot', code: 'SNAPSHOT_UNVERIFIED_REFUSED' })
  })
  assert.doesNotThrow(() => {
    const result = projectEligibility({
      snapshot: undefined as unknown as CatalogSnapshot,
      approvedConfig: DEFAULT_APPROVED_CONFIG,
      evaluationTimeUtc: FRESH_EVAL_TIME,
      identities: [{ provider: 'openai', id: 'gpt-4o-mini' }],
    })
    assert.deepEqual(result, { ok: false, level: 'snapshot', code: 'SNAPSHOT_UNVERIFIED_REFUSED' })
  })
})

test('F1: an empty object {} as snapshot refuses SNAPSHOT_UNVERIFIED_REFUSED, never throws', () => {
  assert.doesNotThrow(() => {
    const result = project({ snapshot: {} as unknown as CatalogSnapshot })
    assert.deepEqual(result, { ok: false, level: 'snapshot', code: 'SNAPSHOT_UNVERIFIED_REFUSED' })
  })
})

test('F1: a real snapshot post-read-mutated cannot yield different facts, because it is frozen', () => {
  const target = baseSnapshot.models[0]
  assert.ok(target)
  const originalContextWindow = target.contextWindow
  assert.throws(() => {
    // @ts-expect-error intentional write to a readonly, frozen field
    target.contextWindow = -1
  }, TypeError)
  assert.equal(target.contextWindow, originalContextWindow)
  // A genuine, unmutated, reader-issued snapshot still projects normally.
  const result = project({ identities: [{ provider: target.provider, id: target.id }] })
  assert.equal(result.ok, true)
})

// ---------------------------------------------------------------------------
// A2 round 2 / R1 — req itself is hostile input, never throws
// ---------------------------------------------------------------------------

test('R1: projectEligibility(null) refuses REQUEST_INVALID_REFUSED, never throws', () => {
  assert.doesNotThrow(() => {
    const result = projectEligibility(asRequest(null))
    assert.deepEqual(result, { ok: false, level: 'request', code: 'REQUEST_INVALID_REFUSED' })
  })
})

test('R1: projectEligibility(undefined) refuses REQUEST_INVALID_REFUSED, never throws', () => {
  assert.doesNotThrow(() => {
    const result = projectEligibility(asRequest(undefined))
    assert.deepEqual(result, { ok: false, level: 'request', code: 'REQUEST_INVALID_REFUSED' })
  })
})

test('R1: a revoked Proxy as req refuses SNAPSHOT_UNVERIFIED_REFUSED, never throws', () => {
  const { proxy, revoke } = Proxy.revocable({}, {})
  revoke()
  assert.doesNotThrow(() => {
    const result = projectEligibility(asRequest(proxy))
    // typeof a revoked Proxy is safely 'object' (no trap involved), but any
    // property read on it throws -- including the very first read,
    // `.snapshot` -- so this resolves the same as any other throw while
    // reading snapshot: SNAPSHOT_UNVERIFIED_REFUSED, not REQUEST_INVALID_REFUSED.
    assert.deepEqual(result, { ok: false, level: 'snapshot', code: 'SNAPSHOT_UNVERIFIED_REFUSED' })
  })
})

test('R1: a req whose snapshot getter throws refuses SNAPSHOT_UNVERIFIED_REFUSED, never throws', () => {
  const hostile = {
    get snapshot() {
      throw new Error('hostile snapshot getter')
    },
    approvedConfig: DEFAULT_APPROVED_CONFIG,
    evaluationTimeUtc: FRESH_EVAL_TIME,
    identities: [{ provider: 'openai', id: 'gpt-4o-mini' }],
  }
  assert.doesNotThrow(() => {
    const result = projectEligibility(asRequest(hostile))
    assert.deepEqual(result, { ok: false, level: 'snapshot', code: 'SNAPSHOT_UNVERIFIED_REFUSED' })
  })
})

test('R1: a req whose approvedConfig getter throws (snapshot already read fine) refuses AUTHORITY_INVALID_REFUSED, never throws', () => {
  const hostile = {
    snapshot: baseSnapshot,
    get approvedConfig(): unknown {
      throw new Error('hostile approvedConfig getter')
    },
    evaluationTimeUtc: FRESH_EVAL_TIME,
    identities: [{ provider: 'openai', id: 'gpt-4o-mini' }],
  }
  assert.doesNotThrow(() => {
    const result = projectEligibility(asRequest(hostile))
    // A2 conformance (coordinator ruling on the resume Step-0 flag 1): "A
    // throw while reading approvedConfig refuses AUTHORITY_INVALID_REFUSED".
    // The round-2 rework asserted REQUEST_INVALID_REFUSED here, which
    // contradicted A2. This is the one assertion this rework changes.
    assert.deepEqual(result, { ok: false, level: 'authority', code: 'AUTHORITY_INVALID_REFUSED' })
  })
})

test('R1: a req whose evaluationTimeUtc getter throws refuses REQUEST_INVALID_REFUSED, never throws', () => {
  const hostile = {
    snapshot: baseSnapshot,
    approvedConfig: DEFAULT_APPROVED_CONFIG,
    get evaluationTimeUtc(): unknown {
      throw new Error('hostile evaluationTimeUtc getter')
    },
    identities: [{ provider: 'openai', id: 'gpt-4o-mini' }],
  }
  assert.doesNotThrow(() => {
    const result = projectEligibility(asRequest(hostile))
    assert.deepEqual(result, { ok: false, level: 'request', code: 'REQUEST_INVALID_REFUSED' })
  })
})

test('R1: a req whose identities getter throws refuses REQUEST_INVALID_REFUSED, never throws', () => {
  const hostile = {
    snapshot: baseSnapshot,
    approvedConfig: DEFAULT_APPROVED_CONFIG,
    evaluationTimeUtc: FRESH_EVAL_TIME,
    get identities(): unknown {
      throw new Error('hostile identities getter')
    },
  }
  assert.doesNotThrow(() => {
    const result = projectEligibility(asRequest(hostile))
    assert.deepEqual(result, { ok: false, level: 'request', code: 'REQUEST_INVALID_REFUSED' })
  })
})

test('R1: req fields are read lazily in pipeline order, so a stale snapshot wins over a throwing identities getter', () => {
  let identitiesReads = 0
  const hostile = {
    snapshot: baseSnapshot,
    approvedConfig: DEFAULT_APPROVED_CONFIG,
    evaluationTimeUtc: '2026-09-22T12:00:00.001Z', // 1 ms past 24h after the fixture's checkedAtUtc
    get identities(): unknown {
      identitiesReads += 1
      throw new Error('hostile identities getter')
    },
  }
  const result = projectEligibility(asRequest(hostile))
  assert.deepEqual(result, { ok: false, level: 'snapshot', code: 'STALE_REFUSED' })
  assert.equal(identitiesReads, 0)
})

test('R1: req fields are read lazily in pipeline order, so an invalid evaluation time wins over a throwing approvedConfig getter', () => {
  let approvedConfigReads = 0
  const hostile = {
    snapshot: baseSnapshot,
    get approvedConfig(): unknown {
      approvedConfigReads += 1
      throw new Error('hostile approvedConfig getter')
    },
    evaluationTimeUtc: 'not a time',
    identities: [{ provider: 'openai', id: 'gpt-4o-mini' }],
  }
  const result = projectEligibility(asRequest(hostile))
  assert.deepEqual(result, { ok: false, level: 'request', code: 'TIME_INVALID_REFUSED' })
  assert.equal(approvedConfigReads, 0)
})

test('R1: each req field is read exactly once on the success path', () => {
  const reads: Record<string, number> = {}
  const source: Record<string, unknown> = {
    snapshot: baseSnapshot,
    approvedConfig: DEFAULT_APPROVED_CONFIG,
    evaluationTimeUtc: FRESH_EVAL_TIME,
    identities: [{ provider: 'openai', id: 'gpt-4o-mini' }],
  }
  const counted = new Proxy(source, {
    get(target, key) {
      if (typeof key === 'string') reads[key] = (reads[key] ?? 0) + 1
      return target[key as string]
    },
  })
  const result = projectEligibility(asRequest(counted))
  assert.equal(result.ok, true)
  assert.deepEqual(reads, { snapshot: 1, evaluationTimeUtc: 1, approvedConfig: 1, identities: 1 })
})

test('read-once: approvedConfig.authorityRef and .endpoints are each read exactly once, so a flipping getter cannot forge provenance', () => {
  let authorityReads = 0
  let endpointsReads = 0
  const flipping = {
    get authorityRef(): unknown {
      authorityReads += 1
      return authorityReads === 1 ? 'test-authority' : { forged: true }
    },
    get endpoints(): unknown {
      endpointsReads += 1
      return endpointsReads === 1 ? DEFAULT_APPROVED_CONFIG.endpoints : []
    },
  }
  const result = project({ approvedConfig: flipping })
  assert.equal(result.ok, true)
  if (!result.ok) throw new Error('unreachable')
  assert.equal(result.provenance.approvedConfigRef, 'test-authority')
  assert.equal(authorityReads, 1)
  assert.equal(endpointsReads, 1)
  assert.equal(result.results[0]?.outcome, 'facts')
})

test('R1: a non-object req (a string) refuses REQUEST_INVALID_REFUSED, never throws', () => {
  assert.doesNotThrow(() => {
    const result = projectEligibility(asRequest('not an object'))
    assert.deepEqual(result, { ok: false, level: 'request', code: 'REQUEST_INVALID_REFUSED' })
  })
})

// ---------------------------------------------------------------------------
// AC5 — Time inputs
// ---------------------------------------------------------------------------

test('AC5: a non-ISO evaluationTimeUtc string refuses TIME_INVALID_REFUSED at request level', () => {
  const result = project({ evaluationTimeUtc: '2026-09-21 12:00:00' })
  assert.deepEqual(result, { ok: false, level: 'request', code: 'TIME_INVALID_REFUSED' })
})

test('AC5: a Date object evaluationTimeUtc refuses TIME_INVALID_REFUSED at request level', () => {
  const result = project({ evaluationTimeUtc: new Date('2026-09-21T12:00:00.000Z') })
  assert.deepEqual(result, { ok: false, level: 'request', code: 'TIME_INVALID_REFUSED' })
})

test('AC5: an epoch-number evaluationTimeUtc refuses TIME_INVALID_REFUSED at request level', () => {
  const result = project({ evaluationTimeUtc: 1790000000000 })
  assert.deepEqual(result, { ok: false, level: 'request', code: 'TIME_INVALID_REFUSED' })
})

test('AC5: an evaluationTimeUtc that does not round-trip through toISOString refuses TIME_INVALID_REFUSED', () => {
  // 2026-02-30 does not exist; Date.parse rolls it into March, so toISOString() != input.
  const result = project({ evaluationTimeUtc: '2026-02-30T00:00:00.000Z' })
  assert.deepEqual(result, { ok: false, level: 'request', code: 'TIME_INVALID_REFUSED' })
})

test('AC5: a malformed provider checkedAtUtc refuses TIME_INVALID_REFUSED at snapshot level', () => {
  const snapshot = mutatedSnapshot((root) => {
    rec(arr(root.providers)[0]).checkedAtUtc = '2026-09-21 12:00:00'
  })
  const result = project({ snapshot })
  assert.deepEqual(result, { ok: false, level: 'snapshot', code: 'TIME_INVALID_REFUSED' })
})

// ---------------------------------------------------------------------------
// AC6 — Freshness
// ---------------------------------------------------------------------------

test('AC6: any null provider checkedAtUtc refuses SOURCE_TIME_UNKNOWN_REFUSED', () => {
  const snapshot = mutatedSnapshot((root) => {
    rec(arr(root.providers)[0]).checkedAtUtc = null
  })
  const result = project({ snapshot })
  assert.deepEqual(result, { ok: false, level: 'snapshot', code: 'SOURCE_TIME_UNKNOWN_REFUSED' })
})

test('AC6: source time after evaluation time refuses FUTURE_REFUSED', () => {
  const result = project({ evaluationTimeUtc: '2026-09-21T11:59:59.999Z' })
  assert.deepEqual(result, { ok: false, level: 'snapshot', code: 'FUTURE_REFUSED' })
})

test('AC6: age of exactly 86_400_000 ms is accepted', () => {
  const result = project({ evaluationTimeUtc: '2026-09-22T12:00:00.000Z' })
  assert.equal(result.ok, true)
})

test('AC6: age of 86_400_001 ms refuses STALE_REFUSED', () => {
  const result = project({ evaluationTimeUtc: '2026-09-22T12:00:00.001Z' })
  assert.deepEqual(result, { ok: false, level: 'snapshot', code: 'STALE_REFUSED' })
})

test('AC6: freshness uses the oldest checkedAtUtc across the whole snapshot, not just requested providers', () => {
  const snapshot = mutatedSnapshot((root) => {
    // openai is far older than the other providers and is never requested below.
    rec(arr(root.providers).find((p) => rec(p).providerKey === 'openai')).checkedAtUtc =
      '2026-09-19T12:00:00.000Z'
  })
  // Age vs. the requested provider's own time (openrouter, unchanged) would be
  // fresh; age vs. openai's older time exceeds the 24h bound.
  const result = project({
    snapshot,
    evaluationTimeUtc: '2026-09-21T13:00:00.000Z',
    identities: [{ provider: 'openrouter', id: 'auto' }],
  })
  assert.deepEqual(result, { ok: false, level: 'snapshot', code: 'STALE_REFUSED' })
})

// ---------------------------------------------------------------------------
// AC7 — Approved configuration authority
// ---------------------------------------------------------------------------

test('AC7: an absent approvedConfig refuses AUTHORITY_UNKNOWN_REFUSED', () => {
  const result = projectEligibility({
    snapshot: baseSnapshot,
    approvedConfig: undefined,
    evaluationTimeUtc: FRESH_EVAL_TIME,
    identities: [{ provider: 'openai', id: 'gpt-4o-mini' }],
  })
  assert.deepEqual(result, { ok: false, level: 'authority', code: 'AUTHORITY_UNKNOWN_REFUSED' })
})

test('AC7: a null approvedConfig refuses AUTHORITY_UNKNOWN_REFUSED', () => {
  const result = project({ approvedConfig: null })
  assert.deepEqual(result, { ok: false, level: 'authority', code: 'AUTHORITY_UNKNOWN_REFUSED' })
})

test('AC7: a malformed approvedConfig (missing endpoints) refuses AUTHORITY_INVALID_REFUSED', () => {
  const result = project({ approvedConfig: { authorityRef: 'x' } })
  assert.deepEqual(result, { ok: false, level: 'authority', code: 'AUTHORITY_INVALID_REFUSED' })
})

test('AC7: a duplicate provider entry in approvedConfig refuses AUTHORITY_INVALID_REFUSED', () => {
  const result = project({
    approvedConfig: {
      authorityRef: 'x',
      endpoints: [
        { provider: 'openrouter', baseUrl: 'https://openrouter.ai/api/v1' },
        { provider: 'openrouter', baseUrl: 'https://openrouter.ai/api/v1' },
      ],
    },
  })
  assert.deepEqual(result, { ok: false, level: 'authority', code: 'AUTHORITY_INVALID_REFUSED' })
})

test('AC7: a non-https approvedConfig baseUrl refuses AUTHORITY_INVALID_REFUSED', () => {
  const result = project({
    approvedConfig: {
      authorityRef: 'x',
      endpoints: [{ provider: 'openrouter', baseUrl: 'http://openrouter.ai/api/v1' }],
    },
  })
  assert.deepEqual(result, { ok: false, level: 'authority', code: 'AUTHORITY_INVALID_REFUSED' })
})

test('AC7: an approvedConfig baseUrl carrying userinfo refuses AUTHORITY_INVALID_REFUSED', () => {
  const result = project({
    approvedConfig: {
      authorityRef: 'x',
      endpoints: [{ provider: 'openrouter', baseUrl: 'https://user:pass@openrouter.ai/api/v1' }],
    },
  })
  assert.deepEqual(result, { ok: false, level: 'authority', code: 'AUTHORITY_INVALID_REFUSED' })
})

test('AC7: an approvedConfig baseUrl carrying a query refuses AUTHORITY_INVALID_REFUSED (F8)', () => {
  const result = project({
    approvedConfig: {
      authorityRef: 'x',
      endpoints: [{ provider: 'openrouter', baseUrl: 'https://openrouter.ai/api/v1?x=1' }],
    },
  })
  assert.deepEqual(result, { ok: false, level: 'authority', code: 'AUTHORITY_INVALID_REFUSED' })
})

test('AC7: an approvedConfig baseUrl carrying a fragment refuses AUTHORITY_INVALID_REFUSED (F8)', () => {
  const result = project({
    approvedConfig: {
      authorityRef: 'x',
      endpoints: [{ provider: 'openrouter', baseUrl: 'https://openrouter.ai/api/v1#frag' }],
    },
  })
  assert.deepEqual(result, { ok: false, level: 'authority', code: 'AUTHORITY_INVALID_REFUSED' })
})

test('AC7: an approvedConfig baseUrl carrying a bare empty query (?) refuses AUTHORITY_INVALID_REFUSED (R9)', () => {
  const result = project({
    approvedConfig: {
      authorityRef: 'x',
      endpoints: [{ provider: 'openrouter', baseUrl: 'https://openrouter.ai/api/v1?' }],
    },
  })
  assert.deepEqual(result, { ok: false, level: 'authority', code: 'AUTHORITY_INVALID_REFUSED' })
})

test('AC7: an approvedConfig baseUrl carrying a bare empty fragment (#) refuses AUTHORITY_INVALID_REFUSED (R9)', () => {
  const result = project({
    approvedConfig: {
      authorityRef: 'x',
      endpoints: [{ provider: 'openrouter', baseUrl: 'https://openrouter.ai/api/v1#' }],
    },
  })
  assert.deepEqual(result, { ok: false, level: 'authority', code: 'AUTHORITY_INVALID_REFUSED' })
})

test('AC7: an approvedConfig baseUrl carrying a bare empty userinfo (@) refuses AUTHORITY_INVALID_REFUSED (R9)', () => {
  const result = project({
    approvedConfig: {
      authorityRef: 'x',
      endpoints: [{ provider: 'openrouter', baseUrl: 'https://@openrouter.ai/api/v1' }],
    },
  })
  assert.deepEqual(result, { ok: false, level: 'authority', code: 'AUTHORITY_INVALID_REFUSED' })
})

test('AC7: a requested provider absent from approvedConfig refuses identity-level ENDPOINT_AUTHORITY_UNKNOWN_REFUSED', () => {
  const result = project({
    approvedConfig: {
      authorityRef: 'x',
      endpoints: [{ provider: 'nvidia', baseUrl: 'https://integrate.api.nvidia.com/v1' }],
    },
    identities: [{ provider: 'openai', id: 'gpt-4o-mini' }],
  })
  const entry = singleResult(result)
  assert.equal(entry.outcome, 'refused')
  if (entry.outcome !== 'refused') throw new Error('unreachable')
  assert.deepEqual(entry.codes, ['ENDPOINT_AUTHORITY_UNKNOWN_REFUSED'])
})

// ---------------------------------------------------------------------------
// AC8 — Exact endpoint join
// ---------------------------------------------------------------------------

const MISMATCHED_ANTHROPIC_IDS = [
  'anthropic/claude-opus-5',
  'anthropic/claude-fable-5.1',
  'anthropic/claude-sonnet-5',
  'anthropic/claude-haiku-4.5',
]

for (const id of MISMATCHED_ANTHROPIC_IDS) {
  test(`AC8: ${id} at https://openrouter.ai/api refuses ENDPOINT_MISMATCH_REFUSED against approved /api/v1`, () => {
    const result = project({ identities: [{ provider: 'openrouter', id }] })
    const entry = singleResult(result)
    assert.equal(entry.outcome, 'refused')
    if (entry.outcome !== 'refused') throw new Error('unreachable')
    assert.deepEqual(entry.codes, ['ENDPOINT_MISMATCH_REFUSED'])
  })
}

test('AC8: a trailing slash on the approved baseUrl refuses ENDPOINT_MISMATCH_REFUSED', () => {
  const result = project({
    approvedConfig: {
      authorityRef: 'x',
      endpoints: [{ provider: 'openrouter', baseUrl: 'https://openrouter.ai/api/v1/' }],
    },
    identities: [{ provider: 'openrouter', id: 'z-ai/glm-5.3' }],
  })
  const entry = singleResult(result)
  assert.equal(entry.outcome, 'refused')
  if (entry.outcome !== 'refused') throw new Error('unreachable')
  assert.deepEqual(entry.codes, ['ENDPOINT_MISMATCH_REFUSED'])
})

test('AC8: a host case change on the approved baseUrl refuses ENDPOINT_MISMATCH_REFUSED', () => {
  const result = project({
    approvedConfig: {
      authorityRef: 'x',
      endpoints: [{ provider: 'openrouter', baseUrl: 'https://OpenRouter.ai/api/v1' }],
    },
    identities: [{ provider: 'openrouter', id: 'z-ai/glm-5.3' }],
  })
  const entry = singleResult(result)
  assert.equal(entry.outcome, 'refused')
  if (entry.outcome !== 'refused') throw new Error('unreachable')
  assert.deepEqual(entry.codes, ['ENDPOINT_MISMATCH_REFUSED'])
})

test('AC8: /api approved against a /api/v1 record refuses ENDPOINT_MISMATCH_REFUSED (reverse direction)', () => {
  const result = project({
    approvedConfig: {
      authorityRef: 'x',
      endpoints: [{ provider: 'openrouter', baseUrl: 'https://openrouter.ai/api' }],
    },
    identities: [{ provider: 'openrouter', id: 'z-ai/glm-5.3' }], // record baseUrl is /api/v1
  })
  const entry = singleResult(result)
  assert.equal(entry.outcome, 'refused')
  if (entry.outcome !== 'refused') throw new Error('unreachable')
  assert.deepEqual(entry.codes, ['ENDPOINT_MISMATCH_REFUSED'])
})

test('AC8: a trailing slash on the CATALOG-side baseUrl refuses ENDPOINT_MISMATCH_REFUSED (F8)', () => {
  const snapshot = mutatedSnapshot((root) => {
    // openrouter/z-ai/glm-5.3 (fixture index 1) normally matches the approved
    // openrouter endpoint exactly; give the CATALOG record the trailing slash
    // this time, not the approved side.
    rec(arr(root.models)[1]).baseUrl = 'https://openrouter.ai/api/v1/'
  })
  const result = project({ snapshot, identities: [{ provider: 'openrouter', id: 'z-ai/glm-5.3' }] })
  const entry = singleResult(result)
  assert.equal(entry.outcome, 'refused')
  if (entry.outcome !== 'refused') throw new Error('unreachable')
  assert.deepEqual(entry.codes, ['ENDPOINT_MISMATCH_REFUSED'])
})

test('AC8: a host case change on the CATALOG-side baseUrl refuses ENDPOINT_MISMATCH_REFUSED (F8)', () => {
  const snapshot = mutatedSnapshot((root) => {
    rec(arr(root.models)[1]).baseUrl = 'https://OpenRouter.ai/api/v1'
  })
  const result = project({ snapshot, identities: [{ provider: 'openrouter', id: 'z-ai/glm-5.3' }] })
  const entry = singleResult(result)
  assert.equal(entry.outcome, 'refused')
  if (entry.outcome !== 'refused') throw new Error('unreachable')
  assert.deepEqual(entry.codes, ['ENDPOINT_MISMATCH_REFUSED'])
})

// ---------------------------------------------------------------------------
// AC9 — Catalog absence and identity
// ---------------------------------------------------------------------------

test('AC9: openrouter/typesafe/jev-1.13 refuses MISSING_MODEL_REFUSED', () => {
  const result = project({ identities: [{ provider: 'openrouter', id: 'typesafe/jev-1.13' }] })
  const entry = singleResult(result)
  assert.equal(entry.outcome, 'refused')
  if (entry.outcome !== 'refused') throw new Error('unreachable')
  assert.deepEqual(entry.codes, ['MISSING_MODEL_REFUSED'])
})

test('AC9: an unknown provider key, including a case-changed OpenRouter, refuses MISSING_PROVIDER_REFUSED', () => {
  const result = project({ identities: [{ provider: 'OpenRouter', id: 'z-ai/glm-5.3' }] })
  const entry = singleResult(result)
  assert.equal(entry.outcome, 'refused')
  if (entry.outcome !== 'refused') throw new Error('unreachable')
  // The case-changed provider also misses the (exact-keyed) approved config entry.
  assert.deepEqual(entry.codes, ['MISSING_PROVIDER_REFUSED', 'ENDPOINT_AUTHORITY_UNKNOWN_REFUSED'])
})

test('AC9: requesting opencode with an id present only under opencode-go refuses MISSING_MODEL_REFUSED, no namespace fallback', () => {
  const result = project({ identities: [{ provider: 'opencode', id: 'deepseek-v4.1-flash' }] })
  const entry = singleResult(result)
  assert.equal(entry.outcome, 'refused')
  if (entry.outcome !== 'refused') throw new Error('unreachable')
  assert.deepEqual(entry.codes, ['MISSING_MODEL_REFUSED'])
})

test('AC9: a requested identity with a missing provider refuses AMBIGUOUS_IDENTITY_REFUSED', () => {
  const result = project({ identities: [{ id: 'gpt-4o-mini' }] })
  const entry = singleResult(result)
  assert.equal(entry.outcome, 'refused')
  if (entry.outcome !== 'refused') throw new Error('unreachable')
  assert.deepEqual(entry.codes, ['AMBIGUOUS_IDENTITY_REFUSED'])
})

test('AC9: a requested identity with an empty provider refuses AMBIGUOUS_IDENTITY_REFUSED', () => {
  const result = project({ identities: [{ provider: '', id: 'gpt-4o-mini' }] })
  const entry = singleResult(result)
  assert.equal(entry.outcome, 'refused')
  if (entry.outcome !== 'refused') throw new Error('unreachable')
  assert.deepEqual(entry.codes, ['AMBIGUOUS_IDENTITY_REFUSED'])
})

test('AC9: a non-array request list refuses REQUEST_INVALID_REFUSED', () => {
  const result = project({ identities: { provider: 'openai', id: 'gpt-4o-mini' } })
  assert.deepEqual(result, { ok: false, level: 'request', code: 'REQUEST_INVALID_REFUSED' })
})

test('AC9: an empty request list refuses REQUEST_INVALID_REFUSED', () => {
  const result = project({ identities: [] })
  assert.deepEqual(result, { ok: false, level: 'request', code: 'REQUEST_INVALID_REFUSED' })
})

test('AC9: a duplicate-containing request list refuses REQUEST_INVALID_REFUSED', () => {
  const result = project({
    identities: [
      { provider: 'openai', id: 'gpt-4o-mini' },
      { provider: 'openai', id: 'gpt-4o-mini' },
    ],
  })
  assert.deepEqual(result, { ok: false, level: 'request', code: 'REQUEST_INVALID_REFUSED' })
})

// ---------------------------------------------------------------------------
// A2 / F2 — each identity field is read exactly once
// ---------------------------------------------------------------------------

test('F2: an identity id getter is read exactly once, and requested/facts stay consistent', () => {
  let readCount = 0
  const item = {
    provider: 'openai',
    get id() {
      readCount += 1
      return readCount === 1 ? 'gpt-4o-mini' : 'openrouter/auto'
    },
  }
  const result = project({ identities: [item] })
  assert.equal(readCount, 1, 'id getter must be read exactly once')
  const entry = singleResult(result)
  assert.equal(entry.requested.id, 'gpt-4o-mini')
  assert.equal(entry.outcome, 'facts')
  if (entry.outcome !== 'facts') throw new Error('unreachable')
  assert.equal(entry.facts.id, 'gpt-4o-mini')
})

test('F2: an identity provider getter is read exactly once', () => {
  let readCount = 0
  const item = {
    get provider() {
      readCount += 1
      return readCount === 1 ? 'openai' : 'openrouter'
    },
    id: 'gpt-4o-mini',
  }
  const result = project({ identities: [item] })
  assert.equal(readCount, 1, 'provider getter must be read exactly once')
  const entry = singleResult(result)
  assert.equal(entry.requested.provider, 'openai')
})

test('F2: a flipping getter cannot desynchronize the duplicate check from evaluation', () => {
  let readCount = 0
  const flipping = {
    provider: 'openai',
    get id() {
      readCount += 1
      return readCount <= 1 ? 'zzz' : 'gpt-4o-mini'
    },
  }
  const result = project({
    identities: [{ provider: 'openai', id: 'gpt-4o-mini' }, flipping],
  })
  // Read exactly once (during extraction), so it is evaluated as "zzz"
  // throughout: never falsely collides with the first identity in the
  // duplicate check, and never diverges between the check and the result.
  assert.equal(readCount, 1)
  assert.equal(result.ok, true)
  if (!result.ok) throw new Error('unreachable')
  assert.deepEqual(
    result.results.map((r) => [r.requested.id, r.outcome]),
    [
      ['gpt-4o-mini', 'facts'],
      ['zzz', 'refused'],
    ],
  )
})

// ---------------------------------------------------------------------------
// A2 / F5 — never throw on hostile approvedConfig/identities input
// ---------------------------------------------------------------------------

test('F5: an identity getter that throws refuses REQUEST_INVALID_REFUSED, never throws', () => {
  const hostile = {
    provider: 'openai',
    get id() {
      throw new Error('hostile id getter')
    },
  }
  assert.doesNotThrow(() => {
    const result = project({ identities: [hostile] })
    assert.deepEqual(result, { ok: false, level: 'request', code: 'REQUEST_INVALID_REFUSED' })
  })
})

test('F5: a Proxy of identities with a throwing length getter refuses REQUEST_INVALID_REFUSED, never throws', () => {
  const real = [{ provider: 'openai', id: 'gpt-4o-mini' }]
  const hostile = new Proxy(real, {
    get(target, prop, receiver) {
      if (prop === 'length') throw new Error('hostile length getter')
      return Reflect.get(target, prop, receiver)
    },
  })
  assert.doesNotThrow(() => {
    const result = project({ identities: hostile })
    assert.deepEqual(result, { ok: false, level: 'request', code: 'REQUEST_INVALID_REFUSED' })
  })
})

test('F5: a throwing approvedConfig.endpoints getter refuses AUTHORITY_INVALID_REFUSED, never throws', () => {
  const hostileConfig = {
    authorityRef: 'x',
    get endpoints() {
      throw new Error('hostile endpoints getter')
    },
  }
  assert.doesNotThrow(() => {
    const result = project({ approvedConfig: hostileConfig })
    assert.deepEqual(result, { ok: false, level: 'authority', code: 'AUTHORITY_INVALID_REFUSED' })
  })
})

test('F5: an approvedConfig Proxy with a throwing ownKeys trap refuses AUTHORITY_INVALID_REFUSED, never throws', () => {
  const hostileConfig = new Proxy(
    {
      authorityRef: 'x',
      endpoints: [{ provider: 'openai', baseUrl: 'https://api.openai.com/v1' }],
    },
    {
      ownKeys() {
        throw new Error('hostile ownKeys')
      },
    },
  )
  assert.doesNotThrow(() => {
    const result = project({ approvedConfig: hostileConfig })
    assert.deepEqual(result, { ok: false, level: 'authority', code: 'AUTHORITY_INVALID_REFUSED' })
  })
})

// ---------------------------------------------------------------------------
// A2 round 2 / R2 — never call a method on, or iterate, caller-owned data
// ---------------------------------------------------------------------------

test('R2: an overridden identities.map cannot forge results; real indexed elements are what gets evaluated', () => {
  const real: unknown[] = [{ provider: 'openai', id: 'gpt-4o-mini' }]
  // The exact exploit the round-2 review reproduced: overriding .map on the
  // caller's own array to return forged facts for a different, cheaper-
  // looking-but-actually-negative-rate identity, without our callback ever
  // running.
  ;(real as { map: unknown }).map = () => [
    {
      requested: { provider: 'openrouter', id: 'auto' },
      outcome: 'facts',
      facts: { id: 'auto', provider: 'openrouter', rates: { input: { value: -1000000 } } },
    },
  ]
  const result = project({ identities: real })
  assert.equal(result.ok, true)
  if (!result.ok) throw new Error('unreachable')
  // The forged result must NOT appear; the real, single indexed element
  // (openai/gpt-4o-mini) must be what was actually evaluated.
  assert.equal(result.results.length, 1)
  assert.deepEqual(result.results[0]?.requested, { provider: 'openai', id: 'gpt-4o-mini' })
  assert.equal(result.results[0]?.outcome, 'facts')
})

test('R2: a Symbol.species array subclass has no effect; real indexed elements are still evaluated', () => {
  class EvilArray extends Array {
    static override get [Symbol.species]() {
      return Array
    }
  }
  const identities = EvilArray.from([{ provider: 'openai', id: 'gpt-4o-mini' }])
  const result = project({ identities })
  assert.equal(result.ok, true)
  if (!result.ok) throw new Error('unreachable')
  assert.equal(result.results.length, 1)
  assert.deepEqual(result.results[0]?.requested, { provider: 'openai', id: 'gpt-4o-mini' })
})

test('R2: a Proxy whose map trap returns junk has no effect; real indexed elements are still evaluated', () => {
  const real = [{ provider: 'openai', id: 'gpt-4o-mini' }]
  const hostile = new Proxy(real, {
    get(target, prop, receiver) {
      if (prop === 'map') {
        return () => 'junk, not even an array'
      }
      return Reflect.get(target, prop, receiver)
    },
  })
  const result = project({ identities: hostile })
  assert.equal(result.ok, true)
  if (!result.ok) throw new Error('unreachable')
  assert.equal(result.results.length, 1)
  assert.deepEqual(result.results[0]?.requested, { provider: 'openai', id: 'gpt-4o-mini' })
})

test('R2: a flipping provider getter through a caller-overridden map is still read exactly once', () => {
  let readCount = 0
  const flipping = {
    get provider() {
      readCount += 1
      return readCount === 1 ? 'openai' : 'openrouter'
    },
    id: 'gpt-4o-mini',
  }
  const identities: unknown[] = [flipping]
  // Also override .map, combining both attack vectors: even if map ran our
  // callback multiple times (it must not), a single-read extraction would
  // still be safe; here .map is bypassed entirely by the index loop.
  ;(identities as { map: unknown }).map = () => {
    throw new Error('map must never be called')
  }
  const result = project({ identities })
  assert.equal(readCount, 1, 'provider getter must be read exactly once, and .map must never run')
  assert.equal(result.ok, true)
  if (!result.ok) throw new Error('unreachable')
  assert.deepEqual(result.results[0]?.requested, { provider: 'openai', id: 'gpt-4o-mini' })
})

test('R2: an overridden approvedConfig.endpoints for...of target cannot forge an endpoint match', () => {
  const endpoints: unknown[] = [{ provider: 'openai', baseUrl: 'https://api.openai.com/v1' }]
  // Override Symbol.iterator to yield a different, forged endpoint than the
  // real indexed content -- the index loop must ignore this entirely.
  ;(endpoints as { [Symbol.iterator]: unknown })[Symbol.iterator] = function* () {
    yield { provider: 'openai', baseUrl: 'https://forged.example/v1' }
  }
  const result = project({
    approvedConfig: { authorityRef: 'x', endpoints },
    identities: [{ provider: 'openai', id: 'gpt-4o-mini' }],
  })
  assert.equal(result.ok, true)
  if (!result.ok) throw new Error('unreachable')
  // The real endpoint (api.openai.com) is what gets used, not the forged one.
  const entry = result.results[0]
  assert.ok(entry)
  assert.equal(entry.outcome, 'facts')
})

// ---------------------------------------------------------------------------
// A2 / F7 — approvedConfig shape checks use own properties, never inherited
// ---------------------------------------------------------------------------

test('F7: an approvedConfig with authorityRef/endpoints only inherited (never own) refuses AUTHORITY_INVALID_REFUSED', () => {
  const proto = {
    authorityRef: 'from-prototype',
    endpoints: [{ provider: 'openai', baseUrl: 'https://api.openai.com/v1' }],
  }
  const hostile = Object.create(proto)
  // Two OWN decoy keys make Object.keys().length happen to equal 2 -- the
  // same count a legitimate {authorityRef, endpoints} object has -- while
  // authorityRef/endpoints themselves are only inherited, never own.
  hostile.decoyA = 1
  hostile.decoyB = 2
  const result = project({ approvedConfig: hostile })
  assert.deepEqual(result, { ok: false, level: 'authority', code: 'AUTHORITY_INVALID_REFUSED' })
})

test('F7: an approvedConfig endpoint with provider/baseUrl only inherited (never own) refuses AUTHORITY_INVALID_REFUSED', () => {
  const proto = { provider: 'openai', baseUrl: 'https://api.openai.com/v1' }
  const hostileEndpoint = Object.create(proto)
  hostileEndpoint.decoyA = 1
  hostileEndpoint.decoyB = 2
  const result = project({
    approvedConfig: { authorityRef: 'x', endpoints: [hostileEndpoint] },
  })
  assert.deepEqual(result, { ok: false, level: 'authority', code: 'AUTHORITY_INVALID_REFUSED' })
})

// ---------------------------------------------------------------------------
// AC10 — Rejected classes
// ---------------------------------------------------------------------------

test('AC10: META_ROUTER_REFUSED for openrouter/auto (id "auto", 0/0)', () => {
  const result = project({ identities: [{ provider: 'openrouter', id: 'auto' }] })
  const entry = singleResult(result)
  assert.equal(entry.outcome, 'refused')
  if (entry.outcome !== 'refused') throw new Error('unreachable')
  assert.deepEqual(entry.codes, ['META_ROUTER_REFUSED'])
})

test('AC10: META_ROUTER_REFUSED for id "openrouter/auto" (also SENTINEL_RATE_REFUSED at -1000000)', () => {
  const result = project({ identities: [{ provider: 'openrouter', id: 'openrouter/auto' }] })
  const entry = singleResult(result)
  assert.equal(entry.outcome, 'refused')
  if (entry.outcome !== 'refused') throw new Error('unreachable')
  assert.deepEqual(entry.codes, ['META_ROUTER_REFUSED', 'SENTINEL_RATE_REFUSED'])
})

test('AC10: META_ROUTER_REFUSED for id "openrouter/auto-beta" (also SENTINEL_RATE_REFUSED at -1000000)', () => {
  const result = project({ identities: [{ provider: 'openrouter', id: 'openrouter/auto-beta' }] })
  const entry = singleResult(result)
  assert.equal(entry.outcome, 'refused')
  if (entry.outcome !== 'refused') throw new Error('unreachable')
  assert.deepEqual(entry.codes, ['META_ROUTER_REFUSED', 'SENTINEL_RATE_REFUSED'])
})

test('AC10: META_ROUTER_REFUSED for a meta-router id requested but absent from the catalog (nvidia/auto) (F8)', () => {
  const result = project({ identities: [{ provider: 'nvidia', id: 'auto' }] })
  const entry = singleResult(result)
  assert.equal(entry.outcome, 'refused')
  if (entry.outcome !== 'refused') throw new Error('unreachable')
  assert.deepEqual(entry.codes, ['META_ROUTER_REFUSED', 'MISSING_MODEL_REFUSED'])
})

test('AC10: VARIANT_REFUSED for a :free id', () => {
  const result = project({
    identities: [{ provider: 'openrouter', id: 'nvidia/nemotron-3.5-lightning:free' }],
  })
  const entry = singleResult(result)
  assert.equal(entry.outcome, 'refused')
  if (entry.outcome !== 'refused') throw new Error('unreachable')
  assert.deepEqual(entry.codes, ['VARIANT_REFUSED'])
})

test('AC10: VARIANT_REFUSED for a :batch id', () => {
  const result = project({
    identities: [{ provider: 'openrouter', id: 'anthropic/claude-fable-5:batch' }],
  })
  const entry = singleResult(result)
  assert.equal(entry.outcome, 'refused')
  if (entry.outcome !== 'refused') throw new Error('unreachable')
  assert.deepEqual(entry.codes, ['VARIANT_REFUSED'])
})

function withHandBuiltVariant(idSuffix: string): { snapshot: CatalogSnapshot; id: string } {
  const id = `test-model${idSuffix}`
  const snapshot = mutatedSnapshot((root) => {
    arr(root.providers).push({
      providerKey: 'fixture-variants',
      checkedAtUtc: '2026-09-21T12:00:00.000Z',
    })
    arr(root.models).push({
      provider: 'fixture-variants',
      id,
      baseUrl: 'https://fixture-variants.example/v1',
      api: 'openai-completions',
      input: ['text'],
      reasoning: false,
      contextWindow: 8192,
      maxTokens: 4096,
      cost: {
        input: { unit: 'USD per 1M tokens', value: 1 },
        output: { unit: 'USD per 1M tokens', value: 2 },
      },
    })
  })
  return { snapshot, id }
}

test('AC10: VARIANT_REFUSED for a hand-built :nitro id (P0 has zero)', () => {
  const { snapshot, id } = withHandBuiltVariant(':nitro')
  const result = project({
    snapshot,
    approvedConfig: {
      authorityRef: 'x',
      endpoints: [{ provider: 'fixture-variants', baseUrl: 'https://fixture-variants.example/v1' }],
    },
    identities: [{ provider: 'fixture-variants', id }],
  })
  const entry = singleResult(result)
  assert.equal(entry.outcome, 'refused')
  if (entry.outcome !== 'refused') throw new Error('unreachable')
  assert.deepEqual(entry.codes, ['VARIANT_REFUSED'])
})

test('AC10: VARIANT_REFUSED for a hand-built :floor id (P0 has zero)', () => {
  const { snapshot, id } = withHandBuiltVariant(':floor')
  const result = project({
    snapshot,
    approvedConfig: {
      authorityRef: 'x',
      endpoints: [{ provider: 'fixture-variants', baseUrl: 'https://fixture-variants.example/v1' }],
    },
    identities: [{ provider: 'fixture-variants', id }],
  })
  const entry = singleResult(result)
  assert.equal(entry.outcome, 'refused')
  if (entry.outcome !== 'refused') throw new Error('unreachable')
  assert.deepEqual(entry.codes, ['VARIANT_REFUSED'])
})

test('AC10: VARIANT_REFUSED for an unlisted colon suffix (:extended), broader than the charter list (OQ-5)', () => {
  const { snapshot, id } = withHandBuiltVariant(':extended')
  const result = project({
    snapshot,
    approvedConfig: {
      authorityRef: 'x',
      endpoints: [{ provider: 'fixture-variants', baseUrl: 'https://fixture-variants.example/v1' }],
    },
    identities: [{ provider: 'fixture-variants', id }],
  })
  const entry = singleResult(result)
  assert.equal(entry.outcome, 'refused')
  if (entry.outcome !== 'refused') throw new Error('unreachable')
  assert.deepEqual(entry.codes, ['VARIANT_REFUSED'])
})

test('AC10: SENTINEL_RATE_REFUSED for a negative input rate alone', () => {
  const snapshot = mutatedSnapshot((root) => {
    rec(rec(rec(arr(root.models)[3]).cost).input).value = -1 // openai/gpt-4o-mini
  })
  const result = project({ snapshot, identities: [{ provider: 'openai', id: 'gpt-4o-mini' }] })
  const entry = singleResult(result)
  assert.equal(entry.outcome, 'refused')
  if (entry.outcome !== 'refused') throw new Error('unreachable')
  assert.deepEqual(entry.codes, ['SENTINEL_RATE_REFUSED'])
})

test('AC10: SENTINEL_RATE_REFUSED for a negative output rate alone', () => {
  const snapshot = mutatedSnapshot((root) => {
    rec(rec(rec(arr(root.models)[3]).cost).output).value = -1 // openai/gpt-4o-mini
  })
  const result = project({ snapshot, identities: [{ provider: 'openai', id: 'gpt-4o-mini' }] })
  const entry = singleResult(result)
  assert.equal(entry.outcome, 'refused')
  if (entry.outcome !== 'refused') throw new Error('unreachable')
  assert.deepEqual(entry.codes, ['SENTINEL_RATE_REFUSED'])
})

test('AC10: RATE_REFUSED for a null input rate value', () => {
  const snapshot = mutatedSnapshot((root) => {
    rec(rec(rec(arr(root.models)[3]).cost).input).value = null
  })
  const result = project({ snapshot, identities: [{ provider: 'openai', id: 'gpt-4o-mini' }] })
  const entry = singleResult(result)
  assert.equal(entry.outcome, 'refused')
  if (entry.outcome !== 'refused') throw new Error('unreachable')
  assert.deepEqual(entry.codes, ['RATE_REFUSED'])
})

test('AC10: RATE_REFUSED for a null output rate value', () => {
  const snapshot = mutatedSnapshot((root) => {
    rec(rec(rec(arr(root.models)[3]).cost).output).value = null
  })
  const result = project({ snapshot, identities: [{ provider: 'openai', id: 'gpt-4o-mini' }] })
  const entry = singleResult(result)
  assert.equal(entry.outcome, 'refused')
  if (entry.outcome !== 'refused') throw new Error('unreachable')
  assert.deepEqual(entry.codes, ['RATE_REFUSED'])
})

test('AC10: RATE_REFUSED for a wrong input rate unit', () => {
  const snapshot = mutatedSnapshot((root) => {
    rec(rec(rec(arr(root.models)[3]).cost).input).unit = 'USD per token'
  })
  const result = project({ snapshot, identities: [{ provider: 'openai', id: 'gpt-4o-mini' }] })
  const entry = singleResult(result)
  assert.equal(entry.outcome, 'refused')
  if (entry.outcome !== 'refused') throw new Error('unreachable')
  assert.deepEqual(entry.codes, ['RATE_REFUSED'])
})

test('AC10: RATE_REFUSED for a wrong output rate unit', () => {
  const snapshot = mutatedSnapshot((root) => {
    rec(rec(rec(arr(root.models)[3]).cost).output).unit = 'USD per token'
  })
  const result = project({ snapshot, identities: [{ provider: 'openai', id: 'gpt-4o-mini' }] })
  const entry = singleResult(result)
  assert.equal(entry.outcome, 'refused')
  if (entry.outcome !== 'refused') throw new Error('unreachable')
  assert.deepEqual(entry.codes, ['RATE_REFUSED'])
})

test('AC10: MODALITY_REFUSED for an input value outside text|image', () => {
  const snapshot = mutatedSnapshot((root) => {
    rec(arr(root.models)[3]).input = ['audio'] // openai/gpt-4o-mini
  })
  const result = project({ snapshot, identities: [{ provider: 'openai', id: 'gpt-4o-mini' }] })
  const entry = singleResult(result)
  assert.equal(entry.outcome, 'refused')
  if (entry.outcome !== 'refused') throw new Error('unreachable')
  assert.deepEqual(entry.codes, ['MODALITY_REFUSED'])
})

test('AC10: codes for one identity are collected in IDENTITY_REFUSAL_CODES order and no facts leak', () => {
  const snapshot = mutatedSnapshot((root) => {
    arr(root.providers).push({
      providerKey: 'fixture-compound',
      checkedAtUtc: '2026-09-21T12:00:00.000Z',
    })
    arr(root.models).push({
      provider: 'fixture-compound',
      id: 'compound:variant',
      baseUrl: 'https://fixture-compound.example/v1',
      api: 'openai-completions',
      input: ['text', 'audio'],
      reasoning: false,
      contextWindow: 8192,
      maxTokens: 4096,
      cost: {
        input: { unit: 'USD per 1M tokens', value: -5 },
        output: { unit: 'USD per token', value: 2 },
      },
    })
  })
  // No approved endpoint at all for fixture-compound -> ENDPOINT_AUTHORITY_UNKNOWN_REFUSED too.
  const result = project({
    snapshot,
    identities: [{ provider: 'fixture-compound', id: 'compound:variant' }],
  })
  const entry = singleResult(result)
  assert.equal(entry.outcome, 'refused')
  if (entry.outcome !== 'refused') throw new Error('unreachable')
  assert.deepEqual(entry.codes, [
    'VARIANT_REFUSED',
    'ENDPOINT_AUTHORITY_UNKNOWN_REFUSED',
    'SENTINEL_RATE_REFUSED',
    'RATE_REFUSED',
    'MODALITY_REFUSED',
  ])
  assert.ok(!('facts' in entry))
})

// ---------------------------------------------------------------------------
// AC12 — No sort, order preserved
// ---------------------------------------------------------------------------

test('AC12: results keep request order regardless of ascending/descending/mixed rates', () => {
  const identities = [
    { provider: 'openrouter', id: 'z-ai/glm-5.3' }, // 1.4 / 4.4
    { provider: 'nvidia', id: 'z-ai/glm-5.3' }, // 0 / 0
    { provider: 'openai', id: 'gpt-4o-mini' }, // 0.15 / 0.6
  ]
  const result = project({ identities })
  assert.equal(result.ok, true)
  if (!result.ok) throw new Error('unreachable')
  assert.deepEqual(
    result.results.map((r) => r.requested),
    identities,
  )
})

test('AC12: inputModalities and thinking-level entries keep catalog order', () => {
  const result = project({ identities: [{ provider: 'openrouter', id: 'z-ai/glm-5.3' }] })
  const entry = singleResult(result)
  assert.equal(entry.outcome, 'facts')
  if (entry.outcome !== 'facts') throw new Error('unreachable')
  assert.deepEqual(entry.facts.inputModalities, ['text'])
  assert.equal(entry.facts.thinkingLevels.status, 'declared')
  if (entry.facts.thinkingLevels.status !== 'declared') throw new Error('unreachable')
  assert.deepEqual(
    entry.facts.thinkingLevels.levels.map((l) => l.level),
    ['high', 'low', 'max', 'medium', 'minimal', 'off', 'xhigh'],
  )
})

// ---------------------------------------------------------------------------
// AC13 — Facts shape
// ---------------------------------------------------------------------------

test('AC13: an accepted identity returns exactly the EligibilityFacts fields, deep-frozen, matching the fixture', () => {
  const result = project({ identities: [{ provider: 'openrouter', id: 'z-ai/glm-5.3' }] })
  const entry = singleResult(result)
  assert.equal(entry.outcome, 'facts')
  if (entry.outcome !== 'facts') throw new Error('unreachable')

  assert.deepEqual(
    Object.keys(entry.facts).sort(),
    [
      'api',
      'baseUrl',
      'contextWindow',
      'id',
      'inputModalities',
      'maxTokens',
      'provider',
      'rates',
      'reasoning',
      'thinkingLevels',
    ].sort(),
  )

  assert.equal(entry.facts.provider, 'openrouter')
  assert.equal(entry.facts.id, 'z-ai/glm-5.3')
  assert.equal(entry.facts.baseUrl, 'https://openrouter.ai/api/v1')
  assert.equal(entry.facts.api, 'openai-completions')
  assert.equal(entry.facts.reasoning, true)
  assert.equal(entry.facts.contextWindow, 1048575)
  assert.equal(entry.facts.maxTokens, 943717)
  assert.deepEqual(entry.facts.rates, {
    input: { value: 1.4, unit: 'USD per 1M tokens' },
    output: { value: 4.4, unit: 'USD per 1M tokens' },
  })

  assert.ok(Object.isFrozen(entry.facts))
  assert.ok(Object.isFrozen(entry.facts.rates))
  assert.ok(Object.isFrozen(entry.facts.rates.input))
  assert.throws(() => {
    // @ts-expect-error intentional write to a readonly, frozen field
    entry.facts.provider = 'mutated'
  }, TypeError)
})

test('AC13: a missing thinkingLevelMap becomes { status: "unknown" }, never an empty map', () => {
  const result = project({ identities: [{ provider: 'openai', id: 'gpt-4o-mini' }] })
  const entry = singleResult(result)
  assert.equal(entry.outcome, 'facts')
  if (entry.outcome !== 'facts') throw new Error('unreachable')
  assert.deepEqual(entry.facts.thinkingLevels, { status: 'unknown' })
})

test('AC13: null map values and non-canonical provider values are kept verbatim', () => {
  const snapshot = mutatedSnapshot((root) => {
    rec(arr(root.models)[1]).thinkingLevelMap = { high: 'HIGH', low: null, custom: 'default' }
  })
  const result = project({ snapshot, identities: [{ provider: 'openrouter', id: 'z-ai/glm-5.3' }] })
  const entry = singleResult(result)
  assert.equal(entry.outcome, 'facts')
  if (entry.outcome !== 'facts') throw new Error('unreachable')
  assert.equal(entry.facts.thinkingLevels.status, 'declared')
  if (entry.facts.thinkingLevels.status !== 'declared') throw new Error('unreachable')
  assert.deepEqual(entry.facts.thinkingLevels.levels, [
    { level: 'high', providerValue: 'HIGH' },
    { level: 'low', providerValue: null },
    { level: 'custom', providerValue: 'default' },
  ])
})

test('AC13: zero rates are facts, not refusals (OQ-4)', () => {
  const result = project({ identities: [{ provider: 'nvidia', id: 'z-ai/glm-5.3' }] })
  const entry = singleResult(result)
  assert.equal(entry.outcome, 'facts')
  if (entry.outcome !== 'facts') throw new Error('unreachable')
  assert.deepEqual(entry.facts.rates, {
    input: { value: 0, unit: 'USD per 1M tokens' },
    output: { value: 0, unit: 'USD per 1M tokens' },
  })
})

test('AC13: provenance carries digest, sourceRef, source/evaluation time, ageMs, maxAgeMs, and approvedConfigRef', () => {
  const result = project({ evaluationTimeUtc: '2026-09-21T14:00:00.000Z' })
  assert.equal(result.ok, true)
  if (!result.ok) throw new Error('unreachable')
  assert.deepEqual(result.provenance, {
    digestSha256: baseSnapshot.digestSha256,
    sourceRef: baseSnapshot.sourceRef,
    sourceTimeUtc: '2026-09-21T12:00:00.000Z',
    evaluationTimeUtc: '2026-09-21T14:00:00.000Z',
    ageMs: 2 * 60 * 60 * 1000,
    maxAgeMs: 86_400_000,
    approvedConfigRef: 'test-authority',
  })
})

// ---------------------------------------------------------------------------
// AC14 — Snapshot-level refusal dominates
// ---------------------------------------------------------------------------

test('AC14: every whole-projection refusal carries its declared level and no results array', () => {
  const cases: { name: string; result: ProjectionResult; level: string; code: string }[] = [
    {
      name: 'snapshot unverified (A2 / F1)',
      result: project({ snapshot: { ...baseSnapshot } }),
      level: 'snapshot',
      code: 'SNAPSHOT_UNVERIFIED_REFUSED',
    },
    {
      name: 'evaluationTimeUtc malformed',
      result: project({ evaluationTimeUtc: 'not-a-time' }),
      level: 'request',
      code: 'TIME_INVALID_REFUSED',
    },
    {
      name: 'provider checkedAtUtc malformed',
      result: project({
        snapshot: mutatedSnapshot((root) => {
          rec(arr(root.providers)[0]).checkedAtUtc = 'not-a-time'
        }),
      }),
      level: 'snapshot',
      code: 'TIME_INVALID_REFUSED',
    },
    {
      name: 'source time unknown',
      result: project({
        snapshot: mutatedSnapshot((root) => {
          rec(arr(root.providers)[0]).checkedAtUtc = null
        }),
      }),
      level: 'snapshot',
      code: 'SOURCE_TIME_UNKNOWN_REFUSED',
    },
    {
      name: 'future',
      result: project({ evaluationTimeUtc: '2026-09-21T11:59:59.999Z' }),
      level: 'snapshot',
      code: 'FUTURE_REFUSED',
    },
    {
      name: 'stale',
      result: project({ evaluationTimeUtc: '2026-09-22T12:00:00.001Z' }),
      level: 'snapshot',
      code: 'STALE_REFUSED',
    },
    {
      name: 'authority unknown',
      result: project({ approvedConfig: null }),
      level: 'authority',
      code: 'AUTHORITY_UNKNOWN_REFUSED',
    },
    {
      name: 'authority invalid',
      result: project({ approvedConfig: { authorityRef: 'x' } }),
      level: 'authority',
      code: 'AUTHORITY_INVALID_REFUSED',
    },
    {
      name: 'request invalid',
      result: project({ identities: [] }),
      level: 'request',
      code: 'REQUEST_INVALID_REFUSED',
    },
  ]

  for (const testCase of cases) {
    assert.equal(testCase.result.ok, false, testCase.name)
    if (testCase.result.ok) continue
    assert.equal(testCase.result.level, testCase.level, testCase.name)
    assert.equal(testCase.result.code, testCase.code, testCase.name)
    assert.ok(!('results' in testCase.result), `${testCase.name}: no results array`)
  }
})

// ---------------------------------------------------------------------------
// Exported constants are frozen (coordinator ruling on the resume Step-0
// flag 3). A same-process caller must not be able to empty META_ROUTER_IDS,
// or any other exported list, and so turn a refused class into facts.
// ---------------------------------------------------------------------------

const EXPORTED_CONSTANT_ARRAYS: readonly { name: string; value: readonly unknown[] }[] = [
  { name: 'META_ROUTER_IDS', value: META_ROUTER_IDS },
  { name: 'REFUSED_VARIANT_SUFFIXES', value: REFUSED_VARIANT_SUFFIXES },
  { name: 'SNAPSHOT_REFUSAL_CODES', value: SNAPSHOT_REFUSAL_CODES },
  { name: 'IDENTITY_REFUSAL_CODES', value: IDENTITY_REFUSAL_CODES },
]

for (const constant of EXPORTED_CONSTANT_ARRAYS) {
  test(`frozen constants: ${constant.name} rejects push, splice, index assignment, and length assignment`, () => {
    const mutable = constant.value as unknown[]
    const before = [...constant.value]
    assert.equal(Object.isFrozen(constant.value), true)
    assert.throws(() => mutable.push('injected'), TypeError)
    assert.throws(() => mutable.splice(0, mutable.length), TypeError)
    assert.throws(() => {
      mutable[0] = 'replaced'
    }, TypeError)
    assert.throws(() => {
      mutable.length = 0
    }, TypeError)
    assert.deepEqual([...constant.value], before)
  })
}

test('frozen constants: after every mutation attempt, openrouter/auto still refuses META_ROUTER_REFUSED', () => {
  for (const constant of EXPORTED_CONSTANT_ARRAYS) {
    const mutable = constant.value as unknown[]
    try {
      mutable.length = 0
    } catch {
      // expected: frozen
    }
    try {
      mutable.splice(0, mutable.length)
    } catch {
      // expected: frozen
    }
  }
  const entry = singleResult(project({ identities: [{ provider: 'openrouter', id: 'auto' }] }))
  assert.equal(entry.outcome, 'refused')
  if (entry.outcome !== 'refused') throw new Error('unreachable')
  assert.deepEqual(entry.codes, ['META_ROUTER_REFUSED'])
})
