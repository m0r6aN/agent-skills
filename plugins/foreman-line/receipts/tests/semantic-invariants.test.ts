/**
 * AC4: single-document semantic invariants, each with a passing and a
 * rejecting fixture.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import type {
  CostProvenance,
  EventProvenance,
  ReplayBindings,
  RoutingAttemptSubject,
  RoutingCacheSubject,
  RoutingDecisionSubject,
} from '../src/types.js'
import { REASON_VOCABULARY_VERSION } from '../src/types.js'
import { validateEventSubject, validateReceiptDocument } from '../src/validator.js'

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures')

function loadFixture(name: string): unknown {
  return JSON.parse(readFileSync(join(fixturesDir, name), 'utf8'))
}

// AC4a: claimRef is null iff kind === 'stage'.
test('AC4a: accepts kind:stage with null claimRef', () => {
  const result = validateReceiptDocument(loadFixture('pass-claimref-stage-null.json'))
  assert.equal(result.valid, true, JSON.stringify(result.errors))
})

test('AC4a: rejects kind:stage with non-null claimRef', () => {
  const result = validateReceiptDocument(loadFixture('reject-claimref-stage-nonnull.json'))
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((e) => e.includes('claimRef')))
})

test('AC4a: accepts kind:claim with non-null claimRef', () => {
  const result = validateReceiptDocument(loadFixture('pass-claimref-claim-nonnull.json'))
  assert.equal(result.valid, true, JSON.stringify(result.errors))
})

test('AC4a: rejects kind:claim with null claimRef', () => {
  const result = validateReceiptDocument(loadFixture('reject-claimref-claim-null.json'))
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((e) => e.includes('claimRef')))
})

// AC4b: prevHash === null iff sequence === 0.
test('AC4b: accepts a genesis with null prevHash', () => {
  const result = validateReceiptDocument(loadFixture('pass-genesis-null-prevhash.json'))
  assert.equal(result.valid, true, JSON.stringify(result.errors))
})

test('AC4b: rejects a genesis with non-null prevHash', () => {
  const result = validateReceiptDocument(loadFixture('reject-genesis-nonnull-prevhash.json'))
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((e) => e.includes('prevHash')))
})

test('AC4b: accepts a non-genesis with non-null prevHash', () => {
  const result = validateReceiptDocument(loadFixture('pass-nongenesis-nonnull-prevhash.json'))
  assert.equal(result.valid, true, JSON.stringify(result.errors))
})

test('AC4b: rejects a non-genesis with null prevHash', () => {
  const result = validateReceiptDocument(loadFixture('reject-nongenesis-null-prevhash.json'))
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((e) => e.includes('prevHash')))
})

// ─── MRC-02 C1.2 — event subject invariants (inline fixtures, FLAG-3) ───────

const unknownCost: CostProvenance = {
  tag: 'unknown',
  amount: null,
  currency: null,
  price_source: null,
  price_version: null,
}

function provenance(overrides: Partial<EventProvenance> = {}): EventProvenance {
  return {
    provider: 'openrouter',
    model: 'anthropic/claude-sonnet-5',
    input_tokens: null,
    output_tokens: null,
    provider_cached_tokens: null,
    latency_ms: null,
    failure: null,
    retries: 0,
    cost: unknownCost,
    occurrence: 1,
    ...overrides,
  }
}

function replayBindings(overrides: Partial<ReplayBindings> = {}): ReplayBindings {
  return {
    effective_requirements: {
      routing_class: 'implementation/standard',
      data_classification: 'internal',
      transport_requirements: { data_collection: 'deny', zdr: true },
    },
    policy_digest: {
      version: 'routing-policy/routing-policy.yaml',
      content_digest: '1'.repeat(64),
    },
    catalog_snapshot_digest: '2'.repeat(64),
    vocabulary_version: REASON_VOCABULARY_VERSION,
    derived_context_floor: { required_context_tokens: null, required_output_tokens: null },
    predicate_set: ['class_allowlist', 'data_class_eligible_models'],
    selected_identity: {
      registry_key: 'anthropic/claude-sonnet-5',
      provider_local_id: 'anthropic/claude-sonnet-5',
      protocol: 'openai-chat-completions',
      pi_host_model_id: 'claude-sonnet-5',
    },
    ...overrides,
  }
}

function decisionSubject(overrides: Partial<RoutingDecisionSubject> = {}): RoutingDecisionSubject {
  return {
    event_kind: 'decision',
    reason: 'ROUTE_SELECTED',
    bindings: replayBindings(),
    provenance: provenance(),
    ...overrides,
  }
}

function cacheSubject(overrides: Partial<RoutingCacheSubject> = {}): RoutingCacheSubject {
  return {
    event_kind: 'cache',
    reason: 'CACHE_HIT',
    vocabulary_version: REASON_VOCABULARY_VERSION,
    cache_key: {
      schema_version: 1,
      policy_digest: '3'.repeat(64),
      routing_class: 'implementation/standard',
      data_classification: 'internal',
    },
    provenance: provenance(),
    ...overrides,
  }
}

function attemptSubject(overrides: Partial<RoutingAttemptSubject> = {}): RoutingAttemptSubject {
  return {
    event_kind: 'attempt',
    reason: 'ATTEMPT_SUCCEEDED',
    vocabulary_version: REASON_VOCABULARY_VERSION,
    provenance: provenance(),
    ...overrides,
  }
}

test('subject validation accepts a well-formed decision/replay subject', () => {
  const result = validateEventSubject('RoutingDecisionEvent', decisionSubject())
  assert.equal(result.valid, true, JSON.stringify(result.errors))
})

test('subject validation accepts well-formed cache and attempt subjects', () => {
  assert.equal(validateEventSubject('RoutingCacheEvent', cacheSubject()).valid, true)
  assert.equal(
    validateEventSubject('RoutingCacheEvent', cacheSubject({ reason: 'CACHE_MISS' })).valid,
    true,
  )
  assert.equal(validateEventSubject('RoutingAttemptEvent', attemptSubject()).valid, true)
  assert.equal(
    validateEventSubject(
      'RoutingAttemptEvent',
      attemptSubject({
        reason: 'ATTEMPT_FAILED',
        provenance: provenance({ failure: 'NO_ELIGIBLE_MODEL' }),
      }),
    ).valid,
    true,
  )
})

test('subject validation rejects an unknown subjectKind with a typed result', () => {
  const result = validateEventSubject('MysteryEvent', decisionSubject())
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((e) => e.includes('unknown event subjectKind')))
})

test('subject validation rejects a reason from the wrong event class', () => {
  const result = validateEventSubject(
    'RoutingDecisionEvent',
    decisionSubject({ reason: 'CACHE_HIT' }),
  )
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((e) => e.includes("'cache'")))
})

test('subject validation rejects an event_kind that disagrees with the subjectKind', () => {
  const result = validateEventSubject('RoutingCacheEvent', {
    ...cacheSubject(),
    event_kind: 'decision',
  })
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((e) => e.includes('event_kind')))
})

test('a failed call is never recorded as success: failure on a success reason rejects', () => {
  const result = validateEventSubject(
    'RoutingDecisionEvent',
    decisionSubject({ provenance: provenance({ failure: 'boom' }) }),
  )
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((e) => e.includes('provenance.failure')))
})

test('a failure reason without failure detail rejects (nothing half-recorded)', () => {
  const result = validateEventSubject(
    'RoutingAttemptEvent',
    attemptSubject({ reason: 'ATTEMPT_FAILED' }),
  )
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((e) => e.includes('provenance.failure')))
})

test('unknown cost stays unknown: an amount under an unknown tag rejects', () => {
  const result = validateEventSubject(
    'RoutingDecisionEvent',
    decisionSubject({
      provenance: provenance({
        cost: { ...unknownCost, amount: 0.01 },
      }),
    }),
  )
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((e) => e.includes('provenance.cost.amount')))
})

test('an estimated cost is tagged estimated, never billed, and carries its source', () => {
  const estimated: CostProvenance = {
    tag: 'estimated',
    amount: 0.013,
    currency: 'usd',
    price_source: 'openrouter-list-2026-09-03',
    price_version: '2026-09-03',
  }
  assert.equal(
    validateEventSubject(
      'RoutingAttemptEvent',
      attemptSubject({ provenance: provenance({ cost: estimated }) }),
    ).valid,
    true,
  )
  // A tagged cost without an amount rejects — the tag and the value travel together.
  const result = validateEventSubject(
    'RoutingAttemptEvent',
    attemptSubject({
      provenance: provenance({
        cost: {
          tag: 'billed',
          amount: null,
          currency: 'usd',
          price_source: null,
          price_version: null,
        },
      }),
    }),
  )
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((e) => e.includes('provenance.cost.amount')))
})

test('occurrence and retries are counts: zero occurrence rejects', () => {
  const result = validateEventSubject(
    'RoutingCacheEvent',
    cacheSubject({ provenance: provenance({ occurrence: 0 }) }),
  )
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((e) => e.includes('provenance.occurrence')))
})

test('bindings reject unknown, empty, and repeated predicate sets', () => {
  const empty = validateEventSubject(
    'RoutingDecisionEvent',
    decisionSubject({ bindings: replayBindings({ predicate_set: [] }) }),
  )
  assert.equal(empty.valid, false)
  assert.ok(empty.errors.some((e) => e.includes('predicate_set')))

  const unknown = validateEventSubject(
    'RoutingDecisionEvent',
    decisionSubject({
      bindings: replayBindings({
        predicate_set: ['not_a_predicate' as never],
      }),
    }),
  )
  assert.equal(unknown.valid, false)
  assert.ok(unknown.errors.some((e) => e.includes('not_a_predicate')))

  const repeated = validateEventSubject(
    'RoutingDecisionEvent',
    decisionSubject({
      bindings: replayBindings({
        predicate_set: ['class_allowlist', 'class_allowlist'],
      }),
    }),
  )
  assert.equal(repeated.valid, false)
  assert.ok(repeated.errors.some((e) => e.includes('repeats')))
})

test('bindings reject malformed digests and unknown fields', () => {
  const badDigest = validateEventSubject(
    'RoutingDecisionEvent',
    decisionSubject({
      bindings: replayBindings({ catalog_snapshot_digest: 'not-a-digest' }),
    }),
  )
  assert.equal(badDigest.valid, false)
  assert.ok(badDigest.errors.some((e) => e.includes('catalog_snapshot_digest')))

  const unknownField = validateEventSubject('RoutingDecisionEvent', {
    ...decisionSubject(),
    extra: 1,
  })
  assert.equal(unknownField.valid, false)
  assert.ok(unknownField.errors.some((e) => e.includes("unknown field 'extra'")))
})

test('a selected identity value is null (unknown) or explicit, never derived', () => {
  const result = validateEventSubject(
    'RoutingDecisionEvent',
    decisionSubject({
      bindings: replayBindings({
        selected_identity: {
          registry_key: 'reg/key',
          provider_local_id: '',
          protocol: null,
          pi_host_model_id: null,
        },
      }),
    }),
  )
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((e) => e.includes('provider_local_id')))
})
