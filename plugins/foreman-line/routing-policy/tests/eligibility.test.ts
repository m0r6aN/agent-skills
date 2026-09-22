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
import { projectEligibility } from '../src/eligibility.js'

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
  return projectEligibility({
    snapshot: overrides.snapshot ?? baseSnapshot,
    approvedConfig:
      'approvedConfig' in overrides ? overrides.approvedConfig : DEFAULT_APPROVED_CONFIG,
    evaluationTimeUtc: overrides.evaluationTimeUtc ?? FRESH_EVAL_TIME,
    identities: overrides.identities ?? [{ provider: 'openai', id: 'gpt-4o-mini' }],
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
