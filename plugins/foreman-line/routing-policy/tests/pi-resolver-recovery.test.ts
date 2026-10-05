/**
 * MRC-08 (HRO-P4a) — D8's bounded recovery ladder controls (C1–C7), the
 * vocabulary enumeration control (RB-5), and the equivalence pins. Synthetic
 * fixtures only; refusal NAMES and falsifiability pairs asserted, never bare
 * non-selection. All time is injected; no I/O anywhere.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { PiOpenRouterProvenance } from '../src/pi-openrouter.js'
import {
  createRecoveryContext,
  type MetadataRefreshFn,
  piModelContractFor,
  provenanceFreshnessVerdict,
  type RecoveryBounds,
  type RecoveryConfig,
  type RecoveryContext,
  type RecoveryEpisodeInput,
  type RecoveryResolution,
  type RouteRequest,
  resolveRoute,
  resolveRouteWithRecovery,
} from '../src/pi-resolver.js'
import {
  canonicalJson,
  LAUNCH_REFUSALS,
  type RecoveryEpisodeRecord,
  type RouteReceipt,
  verifyReceiptSignature,
} from '../src/route-receipt.js'
import {
  ADAPTER_REFUSALS,
  type ClassName,
  CONTRACT_REFUSALS,
  CONTRACT_RESIDUALS,
  type DeclaredEvidence,
  type ExpertiseBinding,
  type LaneId,
  type ModelBinding,
  RECOVERY_REFUSALS,
  RESOLVER_HOLDS,
  RESOLVER_REFUSALS,
  type RecoveryRefusalName,
  type RoutingPolicy,
} from '../src/types.js'
import { FIXED_ISSUED_AT, makeDeclaredPolicy, makeRequest, withBinding } from './pi-fixtures.js'

// ---------------------------------------------------------------------------
// Fixture vocabulary. Every emitted name must live in the consumed
// vocabularies ∪ RECOVERY_REFUSALS (Required Test 7's second clause).
// ---------------------------------------------------------------------------
const ALLOWED_REFUSAL_NAMES: ReadonlySet<string> = new Set<string>([
  ...RESOLVER_REFUSALS,
  ...RESOLVER_HOLDS,
  ...CONTRACT_REFUSALS,
  ...CONTRACT_RESIDUALS,
  ...ADAPTER_REFUSALS,
  ...LAUNCH_REFUSALS,
  ...RECOVERY_REFUSALS,
])

function assertVocabularyClean(names: readonly string[]): void {
  for (const name of names) {
    assert.ok(
      ALLOWED_REFUSAL_NAMES.has(name),
      `refusal name outside the consumed vocabularies: ${name}`,
    )
  }
}

function allRefusalNames(record: RecoveryEpisodeRecord): string[] {
  return [
    ...record.attempted.flatMap((attempt) => attempt.refusals.map((refusal) => refusal.name)),
    ...(record.terminal?.refusals ?? []).map((refusal) => refusal.name),
    ...(record.terminal?.attempted ?? []).flatMap((attempt) =>
      attempt.refusals.map((refusal) => refusal.name),
    ),
  ]
}

// RB-5: each recovery refusal name is emitted by exactly one named negative
// control; every other control only reuses existing vocabulary names.
const RECOVERY_CONTROL_BY_NAME: Record<RecoveryRefusalName, string> = {
  RECOVERY_BOUNDS_UNCONFIGURED:
    'C1.3 bounds: non-positive bounds terminate typed with RECOVERY_BOUNDS_UNCONFIGURED',
  RECOVERY_ATTEMPT_CAP_EXHAUSTED:
    'C4 step 3: max_fallback_attempts caps the walk — exactly cap attempts, then RECOVERY_ATTEMPT_CAP_EXHAUSTED',
  RECOVERY_DEADLINE_EXCEEDED:
    'C4 step 3: the deadline ends the walk with RECOVERY_DEADLINE_EXCEEDED (injected-clock crossing)',
  RECOVERY_AVAILABILITY_REFUSED:
    'C3 step 2: a refreshed document never approves — discovered keys recorded, unavailable attestations refuse',
  RECOVERY_CROSS_PROVIDER_EXCLUDED:
    'C4 step 3: a pinned-provider lane excludes every cross-provider target with a recorded reason',
  RECONCILIATION_REQUIRED:
    'C6 honesty: an uncertain prior attempt refuses redispatch with RECONCILIATION_REQUIRED',
  PROVIDER_COOLDOWN_ACTIVE:
    'C6 honesty: an unhealthy failure class stamps provider cooldown and expires on the injected clock',
}

// ---------------------------------------------------------------------------
// Injected-clock and fixture helpers.
// ---------------------------------------------------------------------------
const FIXTURE_NOW = '2026-09-27T12:00:00.000Z'
const QWEN_ID = 'opencode/qwen3.8-flash'
const GLM_ID = 'opencode/glm-5.3-flash'
const GEMINI_ID = 'openrouter/google/gemini-3.8-flash'
const HAIKU_ID = 'openrouter/anthropic/claude-haiku-4.5'

function makeClock(startIso: string): {
  now: () => string
  set: (iso: string) => void
  advance: (ms: number) => void
} {
  let currentMs = Date.parse(startIso)
  return {
    now: () => new Date(currentMs).toISOString(),
    set: (iso: string) => {
      currentMs = Date.parse(iso)
    },
    advance: (ms: number) => {
      currentMs += ms
    },
  }
}

function registryKeyFor(provider: 'opencode' | 'openrouter', model: string): string {
  const contract = piModelContractFor({ provider, model })
  assert.ok(contract !== null, `fixture mapping must resolve for ${provider}:${model}`)
  return contract.registry_key
}

function provenanceAt(
  validUntilIso: string,
  contentHash = 'fixture-content-hash',
): DeclaredEvidence<PiOpenRouterProvenance> {
  return {
    state: 'declared',
    value: {
      fetched_at: '2026-09-27T00:00:00.000Z',
      valid_until: validUntilIso,
      content_hash: contentHash,
    },
    source: 'synthetic-test-fixture',
  }
}

function configFor(
  now: () => string,
  overrides: Omit<Partial<RecoveryConfig>, 'bounds'> & {
    bounds?: Partial<RecoveryBounds>
  } = {},
): RecoveryConfig {
  const { bounds: boundsOverrides, ...rest } = overrides
  return {
    bounds: {
      episode_deadline_ms: 60_000,
      max_fallback_attempts: 8,
      negative_cache_ttl_ms: 30_000,
      provider_cooldown_ms: 20_000,
      ...boundsOverrides,
    },
    now,
    ...rest,
  }
}

function episodeFor(overrides: Partial<RecoveryEpisodeInput> = {}): RecoveryEpisodeInput {
  return {
    parcelRef: 'parcel-A',
    requested: { lane: 'L5', registry_key: null },
    prior_attempts: [],
    ...overrides,
  }
}

function stripInputs(binding: ModelBinding): ModelBinding {
  const clone = { ...binding }
  delete clone.inputs
  return clone
}

function makeAvailabilityUnproven(binding: ModelBinding): ModelBinding {
  return { ...binding, availability: { state: 'unproven', residual: 'AVAILABILITY_UNVERIFIED' } }
}

function makeDataClassUnknown(binding: ModelBinding): ModelBinding {
  return { ...binding, data_classes: { state: 'unproven', residual: 'DATA_CLASS_UNKNOWN' } }
}

function makeBudgetExceeded(binding: ModelBinding): ModelBinding {
  return {
    ...binding,
    cost: {
      state: 'declared',
      value: { unit: 'usd_per_mtok', input: 1_000_000, output: 1_000_000 },
      source: 'synthetic-test-fixture',
    },
  }
}

function requestForLane(
  policy: RoutingPolicy,
  lane: LaneId,
): { policy: RoutingPolicy; request: RouteRequest } {
  const entry = policy.lane_map?.[lane]
  assert.ok(entry !== undefined, `fixture policy must declare lane ${lane}`)
  const routingClass = entry.routing_classes[0]
  assert.ok(routingClass !== undefined, 'the lane must declare a routing class')
  const className = routingClass as ClassName // the lane's own declared class name
  return {
    policy: {
      ...policy,
      classes: {
        ...policy.classes,
        [className]: { allowlist: ['economy'], ceiling_usd: 0.5 },
      },
    },
    request: makeRequest({ lane, routing_class: routingClass, required_thinking_level: 'high' }),
  }
}

const OPTIONS = { issued_at: FIXED_ISSUED_AT }

// ===========================================================================
// C7.2 — the freshness verdict matrix (direct seam tests).
// ===========================================================================

test('C7.2 freshness matrix: absent provenance is honest unknown — recorded, never assumed current, never rejected on its own', () => {
  assert.equal(provenanceFreshnessVerdict(undefined, FIXTURE_NOW), 'unknown')
  assert.equal(provenanceFreshnessVerdict(null, FIXTURE_NOW), 'unknown')
  assert.equal(provenanceFreshnessVerdict(undefined, FIXTURE_NOW, 60_000), 'unknown')
})

test('C7.2 freshness matrix: within validity is fresh; past validity with the tolerance UNSET is stale (zero-grace fail-closed)', () => {
  const provenance = provenanceAt('2026-09-27T12:00:00.000Z')
  assert.equal(provenanceFreshnessVerdict(provenance, '2026-09-27T11:59:59.999Z'), 'fresh')
  assert.equal(provenanceFreshnessVerdict(provenance, '2026-09-27T12:00:00.000Z'), 'fresh')
  // UNSET = fail-closed: zero policy grace beyond the evidence's own validity.
  assert.equal(provenanceFreshnessVerdict(provenance, '2026-09-27T12:00:00.001Z'), 'stale')
  assert.equal(provenanceFreshnessVerdict(provenance, '2026-09-27T12:10:00.000Z'), 'stale')
})

test('C7.2 freshness matrix: two tolerance values flip the boundary exactly at valid_until + tolerance (the seam consumes the input, no constant)', () => {
  const provenance = provenanceAt('2026-09-27T12:00:00.000Z')
  const at = '2026-09-27T12:00:10.000Z' // age = 10 000 ms past validity
  assert.equal(provenanceFreshnessVerdict(provenance, at, 10_000), 'fresh')
  assert.equal(provenanceFreshnessVerdict(provenance, at, 9_999), 'stale')
  assert.equal(provenanceFreshnessVerdict(provenance, at, 0), 'stale')
  assert.equal(provenanceFreshnessVerdict(provenance, at, 10_001), 'fresh')
})

test('C7.2 freshness matrix: unparseable timestamps are stale (fail-closed)', () => {
  assert.equal(provenanceFreshnessVerdict(provenanceAt('not-a-timestamp'), FIXTURE_NOW), 'stale')
  assert.equal(
    provenanceFreshnessVerdict(provenanceAt('2026-09-27T12:00:00.000Z'), 'not-a-timestamp'),
    'stale',
  )
})

// ===========================================================================
// C2 — step 1: exact approved mapping / registered alias + full D1 re-check.
// ===========================================================================

test('C2 step 1: an exact approved mapping with passing eligibility resolves — requested and selected route recorded separately', () => {
  const key = registryKeyFor('opencode', 'qwen3.8-flash')
  const clock = makeClock(FIXTURE_NOW)
  const context = createRecoveryContext(configFor(clock.now))
  const result = resolveRouteWithRecovery(
    makeDeclaredPolicy(),
    makeRequest(),
    OPTIONS,
    episodeFor({ requested: { lane: 'L5', registry_key: key } }),
    context,
  )

  assert.equal(result.status, 'approved')
  assert.equal(result.episode.terminal, null)
  assert.equal(result.episode.attempted[0]?.outcome, 'approved')
  assert.equal(result.episode.attempted[0]?.role, 'requested')
  assert.equal(result.episode.attempted[0]?.identity, key)
  const selected = result.receipt.route?.primary.binding_id
  assert.equal(selected, QWEN_ID)
  // "Preserve the original request and the actual selected route separately".
  assert.notEqual(result.episode.attempted[0]?.identity, selected)
  assert.ok(verifyReceiptSignature(result.receipt))
})

test('C2 step 1: an alias resolves only through an explicitly declared opencodeId; unlisted slug variants never resolve or select', () => {
  const alias = 'qwen3.8-flash'
  const clock = makeClock(FIXTURE_NOW)
  const aliasContext = createRecoveryContext(configFor(clock.now))
  const aliasResult = resolveRouteWithRecovery(
    makeDeclaredPolicy(),
    makeRequest(),
    OPTIONS,
    episodeFor({ requested: { lane: 'L5', registry_key: alias } }),
    aliasContext,
  )
  assert.equal(aliasResult.status, 'approved')
  assert.equal(aliasResult.receipt.route?.primary.binding_id, QWEN_ID)

  // Falsifiability pair: unlisted slug and its version/prefix variants yield
  // MAPPING_MISSING_REFUSED and nothing else ever selects them.
  for (const variant of ['qwen3.8', 'qwen3.8-flash-v2', 'QWEN3.8-FLASH', 'qwen/qwen3.8-flashx']) {
    const context = createRecoveryContext(configFor(clock.now))
    const result = resolveRouteWithRecovery(
      makeDeclaredPolicy(),
      makeRequest(),
      OPTIONS,
      episodeFor({ requested: { lane: 'L5', registry_key: variant } }),
      context,
    )
    const first = result.episode.attempted[0]
    assert.equal(first?.identity, variant)
    assert.equal(first?.outcome, 'refused')
    assert.ok(
      first?.refusals.some((refusal) => refusal.name === 'MAPPING_MISSING_REFUSED'),
      `expected MAPPING_MISSING_REFUSED for '${variant}'`,
    )
    for (const attempt of result.episode.attempted)
      assert.notEqual(attempt.identity, variant + '/selected')
    assert.notEqual(result.receipt.route?.primary.model, variant)
    assert.notEqual(result.receipt.route?.primary.binding_id, variant)
    assertVocabularyClean(allRefusalNames(result.episode))
  }
})

// ===========================================================================
// C3 — step 2: one coalesced metadata refresh + version-scoped negative cache.
// ===========================================================================

test('C3 step 2: exactly one MetadataRefreshFn invocation per episode for a missing-evidence failure (call counter)', () => {
  let calls = 0
  const refresh: MetadataRefreshFn = () => {
    calls += 1
    return {
      status: 'refreshed',
      provenance: provenanceAt('2026-09-27T13:00:00.000Z'),
      entries: {},
    }
  }
  const key = registryKeyFor('opencode', 'qwen3.8-flash')
  const policy = withBinding(makeDeclaredPolicy(), QWEN_ID, stripInputs)
  const context = createRecoveryContext(configFor(makeClock(FIXTURE_NOW).now, { refresh }))
  const result = resolveRouteWithRecovery(
    policy,
    makeRequest(),
    OPTIONS,
    episodeFor({ requested: { lane: 'L5', registry_key: key } }),
    context,
  )
  assert.equal(calls, 1)
  assert.equal(result.episode.refresh.result, 'refreshed')
  assert.equal(result.episode.refresh.coalesced, false)
  assertVocabularyClean(allRefusalNames(result.episode))
})

test('C3 step 2: two episodes for the same (key, version) coalesce to one invocation (coalesced: true on the second)', () => {
  let calls = 0
  const refresh: MetadataRefreshFn = () => {
    calls += 1
    return {
      status: 'refreshed',
      provenance: provenanceAt('2026-09-27T13:00:00.000Z', 'coalesce-hash'),
      entries: {},
    }
  }
  const key = registryKeyFor('opencode', 'qwen3.8-flash')
  const policy = withBinding(makeDeclaredPolicy(), QWEN_ID, stripInputs)
  const context = createRecoveryContext(configFor(makeClock(FIXTURE_NOW).now, { refresh }))

  const first = resolveRouteWithRecovery(
    policy,
    makeRequest(),
    OPTIONS,
    episodeFor({ requested: { lane: 'L5', registry_key: key }, parcelRef: 'parcel-A' }),
    context,
  )
  const second = resolveRouteWithRecovery(
    policy,
    makeRequest(),
    OPTIONS,
    episodeFor({ requested: { lane: 'L5', registry_key: key }, parcelRef: 'parcel-B' }),
    context,
  )
  assert.equal(calls, 1, 'the second episode must not invoke the seam again')
  assert.equal(first.episode.refresh.coalesced, false)
  assert.equal(second.episode.refresh.coalesced, true)
  assert.equal(second.episode.refresh.result, 'refreshed')
})

test('C3 step 2: a repeated miss inside negative_cache_ttl_ms is served from the negative cache; after expiry one is permitted again; a changed evidence_version re-arms immediately', () => {
  let calls = 0
  const refresh: MetadataRefreshFn = () => {
    calls += 1
    return { status: 'unavailable', reason: 'fixture-catalog-unavailable' }
  }
  const key = registryKeyFor('opencode', 'qwen3.8-flash')
  const policy = withBinding(makeDeclaredPolicy(), QWEN_ID, stripInputs)
  const clock = makeClock(FIXTURE_NOW)
  const context = createRecoveryContext(configFor(clock.now, { refresh }))
  const episode = () =>
    episodeFor({ requested: { lane: 'L5', registry_key: key }, parcelRef: `parcel-${calls}` })

  const first = resolveRouteWithRecovery(policy, makeRequest(), OPTIONS, episode(), context)
  assert.equal(first.episode.refresh.result, 'unavailable')
  assert.equal(calls, 1)

  const repeated = resolveRouteWithRecovery(policy, makeRequest(), OPTIONS, episode(), context)
  assert.equal(repeated.episode.refresh.result, 'negative-cached')
  assert.equal(calls, 1, 'a repeated miss inside the TTL performs no invocation')

  clock.advance(30_001) // past negative_cache_ttl_ms — the entry expired
  const afterExpiry = resolveRouteWithRecovery(policy, makeRequest(), OPTIONS, episode(), context)
  assert.equal(afterExpiry.episode.refresh.result, 'unavailable')
  assert.equal(calls, 2, 'after expiry the single refresh is permitted again')

  // A changed evidence_version (the mapping's declared evidence content)
  // re-arms the entry immediately — no TTL wait.
  const changed = withBinding(policy, QWEN_ID, (binding) => ({
    ...binding,
    family: 'changed-fixture-family',
  }))
  const rearmed = resolveRouteWithRecovery(changed, makeRequest(), OPTIONS, episode(), context)
  assert.equal(rearmed.episode.refresh.result, 'unavailable')
  assert.equal(calls, 3, 'a changed evidence_version re-arms immediately')
})

test('C3 step 2: a refreshed document never approves — discovered keys are recorded and never routed; an unavailable attestation refuses RECOVERY_AVAILABILITY_REFUSED', () => {
  const discoveredKey = 'x-ai/grok-9.9'
  let calls = 0
  const refresh: MetadataRefreshFn = () => {
    calls += 1
    return {
      status: 'refreshed',
      provenance: provenanceAt('2026-09-27T13:00:00.000Z'),
      entries: {
        [registryKeyFor('opencode', 'qwen3.8-flash')]: { available: false },
        [discoveredKey]: { available: true },
      },
    }
  }
  const key = registryKeyFor('opencode', 'qwen3.8-flash')
  const policy = withBinding(makeDeclaredPolicy(), QWEN_ID, makeAvailabilityUnproven)
  const context = createRecoveryContext(configFor(makeClock(FIXTURE_NOW).now, { refresh }))
  const result = resolveRouteWithRecovery(
    policy,
    makeRequest(),
    OPTIONS,
    episodeFor({ requested: { lane: 'L5', registry_key: key } }),
    context,
  )

  assert.equal(calls, 1)
  assert.deepEqual(result.episode.refresh.discovered, [discoveredKey])
  // Discovery-never-approves: the discovered mapping is never attempted,
  // selected, routed, or entitled anywhere.
  for (const attempt of result.episode.attempted) assert.notEqual(attempt.identity, discoveredKey)
  assert.notEqual(result.receipt.route?.primary.binding_id, discoveredKey)
  // The refreshed attestation that the approved mapping is unavailable refuses
  // by name (C3.4's second consumed thing).
  const reEvaluation = result.episode.attempted.find((attempt) => attempt.attempt === 2)
  assert.ok(reEvaluation, 'the single re-evaluation must be recorded')
  assert.ok(
    reEvaluation.refusals.some((refusal) => refusal.name === 'RECOVERY_AVAILABILITY_REFUSED'),
    `expected RECOVERY_AVAILABILITY_REFUSED, got ${JSON.stringify(reEvaluation.refusals)}`,
  )
  assertVocabularyClean(allRefusalNames(result.episode))
})

test('C3 step 2: refreshed evidence for an existing approved mapping re-evaluates and may approve', () => {
  let calls = 0
  const refresh: MetadataRefreshFn = () => {
    calls += 1
    return {
      status: 'refreshed',
      provenance: provenanceAt('2026-09-27T13:00:00.000Z'),
      entries: { [registryKeyFor('opencode', 'qwen3.8-flash')]: { available: true } },
    }
  }
  const key = registryKeyFor('opencode', 'qwen3.8-flash')
  const policy = withBinding(makeDeclaredPolicy(), QWEN_ID, makeAvailabilityUnproven)
  const context = createRecoveryContext(configFor(makeClock(FIXTURE_NOW).now, { refresh }))
  const result = resolveRouteWithRecovery(
    policy,
    makeRequest(),
    OPTIONS,
    episodeFor({ requested: { lane: 'L5', registry_key: key } }),
    context,
  )

  assert.equal(calls, 1)
  assert.equal(result.status, 'approved')
  assert.equal(result.receipt.route?.primary.binding_id, QWEN_ID)
  const reEvaluation = result.episode.attempted.find((attempt) => attempt.attempt === 2)
  assert.equal(reEvaluation?.outcome, 'approved')
})

test('C3 step 2: a refresh returning unavailable records the outcome and proceeds to step 3', () => {
  const refresh: MetadataRefreshFn = () => ({
    status: 'unavailable',
    reason: 'fixture-upstream-unavailable',
  })
  const key = registryKeyFor('opencode', 'qwen3.8-flash')
  const policy = withBinding(makeDeclaredPolicy(), QWEN_ID, stripInputs)
  const context = createRecoveryContext(configFor(makeClock(FIXTURE_NOW).now, { refresh }))
  const result = resolveRouteWithRecovery(
    policy,
    makeRequest(),
    OPTIONS,
    episodeFor({ requested: { lane: 'L5', registry_key: key } }),
    context,
  )

  assert.equal(result.episode.refresh.result, 'unavailable')
  assert.equal(result.episode.refresh.reason, 'fixture-upstream-unavailable')
  const walkRecords = result.episode.attempted.filter((attempt) => attempt.role !== 'requested')
  assert.ok(walkRecords.length > 0, 'the walk must run after the unavailable refresh')
})

test('C3 step 2: stale refreshed provenance is recorded and stays stale — FRESHNESS_STALE_REFUSED — and the walk still runs', () => {
  const refresh: MetadataRefreshFn = () => ({
    status: 'refreshed',
    provenance: provenanceAt('2026-09-27T11:59:00.000Z', 'stale-document'),
    entries: {},
  })
  const key = registryKeyFor('opencode', 'qwen3.8-flash')
  const policy = withBinding(makeDeclaredPolicy(), QWEN_ID, stripInputs)
  const context = createRecoveryContext(configFor(makeClock(FIXTURE_NOW).now, { refresh }))
  const result = resolveRouteWithRecovery(
    policy,
    makeRequest(),
    OPTIONS,
    episodeFor({ requested: { lane: 'L5', registry_key: key } }),
    context,
  )

  assert.equal(result.episode.refresh.result, 'refreshed')
  assert.ok(result.episode.refresh.provenance, 'the refreshed document is recorded')
  const reEvaluation = result.episode.attempted.find((attempt) => attempt.attempt === 2)
  assert.ok(
    reEvaluation?.refusals.some((refusal) => refusal.name === 'FRESHNESS_STALE_REFUSED'),
    'a stale refreshed document stays stale — fail-closed',
  )
  const walkRecords = result.episode.attempted.filter((attempt) => attempt.role !== 'requested')
  assert.ok(walkRecords.length > 0, 'the walk still runs (C3.3)')
})

test('C3 step 2: a refresh overrunning episode_deadline_ms is discarded, recorded, and terminates RECOVERY_DEADLINE_EXCEEDED', () => {
  const clock = makeClock(FIXTURE_NOW)
  const refresh: MetadataRefreshFn = () => {
    clock.advance(120_000) // the call returns after the episode deadline
    return {
      status: 'refreshed',
      provenance: provenanceAt('2026-09-27T13:00:00.000Z'),
      entries: {},
    }
  }
  const key = registryKeyFor('opencode', 'qwen3.8-flash')
  const policy = withBinding(makeDeclaredPolicy(), QWEN_ID, stripInputs)
  const context = createRecoveryContext(configFor(clock.now, { refresh }))
  const result = resolveRouteWithRecovery(
    policy,
    makeRequest(),
    OPTIONS,
    episodeFor({ requested: { lane: 'L5', registry_key: key } }),
    context,
  )

  assert.equal(result.status, 'route-unavailable')
  assert.equal(result.episode.refresh.result, 'deadline-exceeded')
  assert.equal(result.episode.refresh.provenance, null, 'the overrunning result is never used')
  if (result.status === 'route-unavailable') {
    assert.ok(
      result.outcome.refusals.some((refusal) => refusal.name === 'RECOVERY_DEADLINE_EXCEEDED'),
    )
    assert.equal(result.outcome.hold, 'parcel-held')
    assert.ok(verifyReceiptSignature(result.receipt), 'the signed stop receipt reproduces')
  }
})

// ===========================================================================
// C4 — step 3: the declared-lane fallback walk.
// ===========================================================================

test('C4 step 3: the walk covers only declared lane routes in declaration order — an undeclared candidate is never attempted', () => {
  const undeclaredId = 'undeclared/model-x'
  const base = makeDeclaredPolicy()
  const candidates = base.candidates ?? {}
  const firstCandidateKey = Object.keys(candidates)[0]
  assert.ok(firstCandidateKey !== undefined, 'fixture policy must declare candidates')
  const firstCandidate = candidates[firstCandidateKey]
  assert.ok(firstCandidate !== undefined, 'fixture policy must declare candidates')
  const template = firstCandidate.bindings[0]
  assert.ok(template, 'fixture policy must declare bindings')
  const extra: RoutingPolicy = {
    ...base,
    candidates: {
      ...candidates,
      undeclared: {
        ...firstCandidate,
        bindings: [{ ...template, id: undeclaredId, model: 'model-x' }],
      },
    },
  }
  let policy = withBinding(extra, QWEN_ID, stripInputs)
  policy = withBinding(policy, GLM_ID, stripInputs)
  policy = withBinding(policy, GEMINI_ID, stripInputs)
  policy = withBinding(policy, HAIKU_ID, stripInputs)

  const context = createRecoveryContext(configFor(makeClock(FIXTURE_NOW).now))
  const result = resolveRouteWithRecovery(
    policy,
    makeRequest(),
    OPTIONS,
    episodeFor({ requested: { lane: 'L5', registry_key: 'unlisted/slug' } }),
    context,
  )

  const walkOrder = result.episode.attempted
    .filter((attempt) => attempt.role !== 'requested')
    .map((attempt) => attempt.identity)
  assert.deepEqual(walkOrder, [QWEN_ID, GLM_ID, GEMINI_ID, HAIKU_ID])
  for (const attempt of result.episode.attempted) {
    assert.notEqual(attempt.identity, undeclaredId, 'an undeclared candidate is never attempted')
  }
  assertVocabularyClean(allRefusalNames(result.episode))
})

test('C4 step 3: max_fallback_attempts caps the walk — exactly cap attempts, then RECOVERY_ATTEMPT_CAP_EXHAUSTED', () => {
  let policy = withBinding(makeDeclaredPolicy(), QWEN_ID, stripInputs)
  policy = withBinding(policy, GLM_ID, stripInputs)
  policy = withBinding(policy, GEMINI_ID, stripInputs)
  policy = withBinding(policy, HAIKU_ID, stripInputs)
  const context = createRecoveryContext(
    configFor(makeClock(FIXTURE_NOW).now, { bounds: { max_fallback_attempts: 1 } }),
  )
  const result = resolveRouteWithRecovery(
    policy,
    makeRequest(),
    OPTIONS,
    episodeFor({ requested: { lane: 'L5', registry_key: 'unlisted/slug' } }),
    context,
  )

  assert.equal(result.status, 'route-unavailable')
  const walkRecords = result.episode.attempted.filter((attempt) => attempt.role !== 'requested')
  const consumed = walkRecords.filter(
    (attempt) =>
      !attempt.refusals.some(
        (refusal) =>
          refusal.name === 'RECOVERY_CROSS_PROVIDER_EXCLUDED' ||
          refusal.name === 'PROVIDER_COOLDOWN_ACTIVE',
      ),
  )
  assert.equal(consumed.length, 1, 'exactly one attempt fits under the cap of 1')
  assert.equal(walkRecords.length, 1, 'the walk terminated at the cap')
  if (result.status === 'route-unavailable') {
    assert.ok(
      result.outcome.refusals.some((refusal) => refusal.name === 'RECOVERY_ATTEMPT_CAP_EXHAUSTED'),
      `expected RECOVERY_ATTEMPT_CAP_EXHAUSTED, got ${JSON.stringify(result.outcome.refusals.map((r) => r.name))}`,
    )
    assert.ok(verifyReceiptSignature(result.receipt), 'the signed stop receipt reproduces')
  }
})

test('C4 step 3: the deadline ends the walk with RECOVERY_DEADLINE_EXCEEDED (injected-clock crossing)', () => {
  let policy = withBinding(makeDeclaredPolicy(), QWEN_ID, stripInputs)
  policy = withBinding(policy, GLM_ID, stripInputs)
  policy = withBinding(policy, GEMINI_ID, stripInputs)
  policy = withBinding(policy, HAIKU_ID, stripInputs)
  const clock = makeClock(FIXTURE_NOW)
  const steppingNow = (): string => {
    const value = clock.now()
    clock.advance(250)
    return value
  }
  const context = createRecoveryContext(
    configFor(steppingNow, { bounds: { episode_deadline_ms: 500 } }),
  )
  const result = resolveRouteWithRecovery(
    policy,
    makeRequest(),
    OPTIONS,
    episodeFor({ requested: { lane: 'L5', registry_key: 'unlisted/slug' } }),
    context,
  )

  assert.equal(result.status, 'route-unavailable')
  if (result.status === 'route-unavailable') {
    assert.ok(
      result.outcome.refusals.some((refusal) => refusal.name === 'RECOVERY_DEADLINE_EXCEEDED'),
      `expected RECOVERY_DEADLINE_EXCEEDED, got ${JSON.stringify(result.outcome.refusals.map((r) => r.name))}`,
    )
    assert.ok(verifyReceiptSignature(result.receipt), 'the signed stop receipt reproduces')
  }
  const walkAttempts = result.episode.attempted.filter((attempt) => attempt.role !== 'requested')
  assert.ok(walkAttempts.length < 4, 'the clock crossing ended the walk early')
})

test('C4 step 3: every target is revalidated against the full D1 list — skipped with named refusals, the walk continues', () => {
  let policy = withBinding(makeDeclaredPolicy(), QWEN_ID, stripInputs) // INPUTS_UNKNOWN
  policy = withBinding(policy, GLM_ID, makeDataClassUnknown) // DATA_CLASS_UNKNOWN
  policy = withBinding(policy, GEMINI_ID, makeBudgetExceeded) // BUDGET_EXCEEDED
  policy = withBinding(policy, HAIKU_ID, stripInputs)
  const context = createRecoveryContext(configFor(makeClock(FIXTURE_NOW).now))
  const result = resolveRouteWithRecovery(
    policy,
    makeRequest(),
    OPTIONS,
    episodeFor({ requested: { lane: 'L5', registry_key: 'unlisted/slug' } }),
    context,
  )

  const byId = new Map(result.episode.attempted.map((attempt) => [attempt.identity, attempt]))
  const namesFor = (id: string): string[] =>
    (byId.get(id)?.refusals ?? []).map((refusal) => refusal.name)
  assert.ok(namesFor(QWEN_ID).includes('INPUTS_UNKNOWN'), JSON.stringify(namesFor(QWEN_ID)))
  assert.ok(namesFor(GLM_ID).includes('DATA_CLASS_UNKNOWN'), JSON.stringify(namesFor(GLM_ID)))
  assert.ok(namesFor(GEMINI_ID).includes('BUDGET_EXCEEDED'), JSON.stringify(namesFor(GEMINI_ID)))
  assert.ok(byId.has(HAIKU_ID), 'the walk continued past every skipped target')
  assertVocabularyClean(allRefusalNames(result.episode))
})

test('C4 step 3: cross-provider targets are attempted only when all three declarations hold — the chosen transition rides a durable cross-provider-attempt handoff', () => {
  let policy = withBinding(makeDeclaredPolicy(), QWEN_ID, stripInputs)
  policy = withBinding(policy, GLM_ID, stripInputs)
  const context = createRecoveryContext(configFor(makeClock(FIXTURE_NOW).now))
  const result = resolveRouteWithRecovery(
    policy,
    makeRequest(),
    OPTIONS,
    episodeFor({ requested: { lane: 'L5', registry_key: 'unlisted/slug' } }),
    context,
  )

  assert.equal(result.status, 'approved')
  assert.equal(result.receipt.route?.primary.binding_id, GEMINI_ID)
  const chosen = result.episode.chosen_fallback
  assert.equal(chosen?.identity, GEMINI_ID)
  assert.equal(chosen?.role, 'cross-provider')
  assert.ok(chosen?.handoff, 'a cross-provider transition rides a durable handoff record')
  assert.equal(chosen?.handoff?.event.kind, 'cross-provider-attempt')
  assert.equal(chosen?.handoff?.action, 'new-recorded-attempt')
  assert.equal(chosen?.handoff?.continuation, 'refused-mid-turn')
  assert.equal(chosen?.handoff?.receipt_id, result.receipt.receipt_id)
  // The declared-pair rule is preserved: the winner's own fallback pair rides
  // the approved receipt (never an alias).
  assert.equal(result.receipt.fallback_handoff?.primary, GEMINI_ID)
  assert.equal(result.receipt.fallback_handoff?.fallback, HAIKU_ID)
  const winnerRecord = result.episode.attempted.find((attempt) => attempt.identity === GEMINI_ID)
  assert.equal(winnerRecord?.role, 'cross-provider')
})

test('C4 step 3: a pinned-provider lane excludes every cross-provider target with a recorded reason (pinned-provider lane control)', () => {
  const base = makeDeclaredPolicy()
  const prepared = requestForLane(base, 'L1')
  let policy = prepared.policy
  for (const id of [
    'opencode/claude-opus-5-5',
    'opencode/gpt-6-astra',
    'openrouter/openai/gpt-6-astra',
    'openrouter/anthropic/claude-opus-5.5',
  ]) {
    policy = withBinding(policy, id, stripInputs)
  }
  const context = createRecoveryContext(configFor(makeClock(FIXTURE_NOW).now))
  const result = resolveRouteWithRecovery(
    policy,
    prepared.request,
    OPTIONS,
    episodeFor({
      requested: { lane: 'L1', registry_key: 'unlisted/slug' },
    }),
    context,
  )

  const byId = new Map(result.episode.attempted.map((attempt) => [attempt.identity, attempt]))
  for (const crossProviderId of [
    'openrouter/openai/gpt-6-astra',
    'openrouter/anthropic/claude-opus-5.5',
  ]) {
    const record = byId.get(crossProviderId)
    assert.ok(record, `expected a recorded exclusion for ${crossProviderId}`)
    assert.equal(record.role, 'cross-provider')
    assert.ok(
      record.refusals.some((refusal) => refusal.name === 'RECOVERY_CROSS_PROVIDER_EXCLUDED'),
      `expected RECOVERY_CROSS_PROVIDER_EXCLUDED, got ${JSON.stringify(record.refusals)}`,
    )
    assert.ok(
      record.refusals.some((refusal) => refusal.detail.includes('pinned-provider')),
      'the recorded reason names the missing declaration',
    )
  }
  for (const samePartitionId of ['opencode/claude-opus-5-5', 'opencode/gpt-6-astra']) {
    const names = (byId.get(samePartitionId)?.refusals ?? []).map((refusal) => refusal.name)
    assert.ok(!names.includes('RECOVERY_CROSS_PROVIDER_EXCLUDED'))
  }
  assertVocabularyClean(allRefusalNames(result.episode))
})

// ===========================================================================
// C5 — step 4: typed terminal + per-parcel hold + the durable record.
// ===========================================================================

function terminalEpisode(): { result: RecoveryResolution; record: RecoveryEpisodeRecord } {
  let policy = withBinding(makeDeclaredPolicy(), QWEN_ID, stripInputs)
  policy = withBinding(policy, GLM_ID, stripInputs)
  policy = withBinding(policy, GEMINI_ID, stripInputs)
  policy = withBinding(policy, HAIKU_ID, stripInputs)
  const context = createRecoveryContext(configFor(makeClock(FIXTURE_NOW).now))
  const result = resolveRouteWithRecovery(
    policy,
    makeRequest(),
    OPTIONS,
    episodeFor({ requested: { lane: 'L5', registry_key: 'unlisted/slug' } }),
    context,
  )
  assert.equal(result.status, 'route-unavailable')
  return { result, record: result.episode }
}

test('C5 step 4: exhaustion returns the typed outcome with the exact MRC-06 (f) field set and per-parcel hold', () => {
  const { result } = terminalEpisode()
  if (result.status !== 'route-unavailable') assert.fail('expected route-unavailable')
  const outcome = result.outcome
  assert.deepEqual(
    Object.keys(outcome).sort(),
    ['attempted', 'code', 'hold', 'parcelRef', 'reason', 'refusals', 'requested'].sort(),
  )
  assert.equal(outcome.code, 'ROUTE_UNAVAILABLE')
  assert.equal(outcome.hold, 'parcel-held')
  assert.equal(outcome.parcelRef, 'parcel-A')
  assert.deepEqual(outcome.requested, { lane: 'L5', registry_key: 'unlisted/slug' })
  assert.ok(outcome.reason.length > 0, 'the reason is actionable')
  assertVocabularyClean(allRefusalNames(result.episode))
})

test('C5 step 4: the stop receipt carries the recovery record and verifyReceiptSignature reproduces', () => {
  const { result, record } = terminalEpisode()
  assert.equal(result.receipt.status, 'stop')
  assert.equal(result.receipt.recovery, record)
  assert.equal(record.kind, 'recovery-episode-record')
  assert.equal(record.schema_version, 1)
  assert.ok(record.terminal, 'the record carries the terminal outcome')
  assert.ok(
    verifyReceiptSignature(result.receipt),
    'the recovery record is inside the signed content',
  )
  assert.equal(record.chosen_fallback, null)
  assert.equal(record.refresh.result, 'not-permitted')
  // R8 additive record pins: the five record classes + envelope, exactly.
  assert.deepEqual(Object.keys(record).sort(), [
    'attempted',
    'chosen_fallback',
    'episode_id',
    'freshness',
    'kind',
    'refresh',
    'schema_version',
    'terminal',
  ])
  assert.match(record.episode_id, /^[0-9a-f]{64}$/)
  assert.deepEqual(Object.keys(record.freshness).sort(), ['age_ms', 'tolerance_ms', 'verdict'])
  assert.deepEqual(Object.keys(record.refresh).sort(), [
    'coalesced',
    'discovered',
    'evidence_version',
    'provenance',
    'reason',
    'requested_key',
    'result',
  ])
  for (const attempt of record.attempted) {
    assert.deepEqual(Object.keys(attempt).sort(), [
      'attempt',
      'identity',
      'outcome',
      'refusals',
      'role',
    ])
    assert.equal(typeof attempt.attempt, 'number')
  }
})

test('C5 step 4: a second episode for a different parcelRef proceeds — only the affected parcel is held', () => {
  const clock = makeClock(FIXTURE_NOW)
  const context = createRecoveryContext(configFor(clock.now))
  const first = terminalEpisodeWithin(context)
  if (first.status !== 'route-unavailable') assert.fail('expected route-unavailable')
  assert.equal(first.outcome.hold, 'parcel-held')
  assert.equal(first.outcome.parcelRef, 'parcel-A')

  const key = registryKeyFor('opencode', 'qwen3.8-flash')
  const second = resolveRouteWithRecovery(
    makeDeclaredPolicy(),
    makeRequest(),
    OPTIONS,
    episodeFor({ parcelRef: 'parcel-B', requested: { lane: 'L5', registry_key: key } }),
    context,
  )
  assert.equal(second.status, 'approved', 'an independent parcel is never held by another')
  assert.equal(second.episode.terminal, null)
})

function terminalEpisodeWithin(context: RecoveryContext): RecoveryResolution {
  let policy = withBinding(makeDeclaredPolicy(), QWEN_ID, stripInputs)
  policy = withBinding(policy, GLM_ID, stripInputs)
  policy = withBinding(policy, GEMINI_ID, stripInputs)
  policy = withBinding(policy, HAIKU_ID, stripInputs)
  return resolveRouteWithRecovery(
    policy,
    makeRequest(),
    OPTIONS,
    episodeFor({ requested: { lane: 'L5', registry_key: 'unlisted/slug' } }),
    context,
  )
}

// ===========================================================================
// C6 — honesty rules: retries, reconciliation, cycles, cooldown.
// ===========================================================================

test('C6 honesty: an uncertain prior attempt refuses redispatch with RECONCILIATION_REQUIRED and zero refresh/walk invocations', () => {
  let calls = 0
  const refresh: MetadataRefreshFn = () => {
    calls += 1
    return { status: 'unavailable', reason: 'never-reached' }
  }
  const context = createRecoveryContext(configFor(makeClock(FIXTURE_NOW).now, { refresh }))
  const result = resolveRouteWithRecovery(
    makeDeclaredPolicy(),
    makeRequest(),
    OPTIONS,
    episodeFor({
      requested: { lane: 'L5', registry_key: 'unlisted/slug' },
      prior_attempts: [
        {
          attempt_ref: 'pa-1',
          provider: 'opencode',
          failure_class: 'unknown-outcome',
          charge_status: 'uncertain',
        },
      ],
    }),
    context,
  )

  assert.equal(result.status, 'route-unavailable')
  assert.equal(calls, 0, 'no refresh invocation may happen')
  assert.equal(result.episode.attempted.length, 0, 'no walk invocation may happen')
  if (result.status === 'route-unavailable') {
    assert.ok(
      result.outcome.refusals.some((refusal) => refusal.name === 'RECONCILIATION_REQUIRED'),
      `expected RECONCILIATION_REQUIRED, got ${JSON.stringify(result.outcome.refusals.map((r) => r.name))}`,
    )
    assert.equal(result.outcome.hold, 'parcel-held')
    assert.ok(verifyReceiptSignature(result.receipt), 'the signed stop receipt reproduces')
  }
})

test('C6 honesty: reconciled and no-charge prior attempts proceed', () => {
  const key = registryKeyFor('opencode', 'qwen3.8-flash')
  for (const charge_status of ['reconciled', 'no-charge'] as const) {
    const context = createRecoveryContext(configFor(makeClock(FIXTURE_NOW).now))
    const result = resolveRouteWithRecovery(
      makeDeclaredPolicy(),
      makeRequest(),
      OPTIONS,
      episodeFor({
        requested: { lane: 'L5', registry_key: key },
        prior_attempts: [
          { attempt_ref: 'pa-1', provider: 'opencode', failure_class: 'x', charge_status },
        ],
      }),
      context,
    )
    assert.equal(result.status, 'approved')
    assert.ok(!allRefusalNames(result.episode).includes('RECONCILIATION_REQUIRED'))
  }
})

test('C6 honesty: a transient retry occurs exactly once per target and only under the retry policy — its own AttemptRecord', () => {
  let policy = withBinding(makeDeclaredPolicy(), QWEN_ID, stripInputs)
  policy = withBinding(policy, GLM_ID, stripInputs)
  policy = withBinding(policy, GEMINI_ID, stripInputs)
  policy = withBinding(policy, HAIKU_ID, stripInputs)
  const prior = [
    {
      attempt_ref: GLM_ID,
      provider: 'opencode',
      failure_class: 'transient-rate-limit',
      charge_status: 'no-charge' as const,
    },
  ]

  const withPolicy = createRecoveryContext(
    configFor(makeClock(FIXTURE_NOW).now, {
      retry_policy: { retryable: (failureClass) => failureClass === 'transient-rate-limit' },
    }),
  )
  const retried = resolveRouteWithRecovery(
    policy,
    makeRequest(),
    OPTIONS,
    episodeFor({ requested: { lane: 'L5', registry_key: 'unlisted/slug' }, prior_attempts: prior }),
    withPolicy,
  )
  const retriedGlm = retried.episode.attempted
    .filter((attempt) => attempt.identity === GLM_ID)
    .map((attempt) => attempt.attempt)
  assert.deepEqual(retriedGlm, [1, 2], 'the retry is its own AttemptRecord, exactly once')
  const everyIdentityOnce = new Map<string, number[]>()
  for (const attempt of retried.episode.attempted) {
    const seen = everyIdentityOnce.get(attempt.identity) ?? []
    seen.push(attempt.attempt)
    everyIdentityOnce.set(attempt.identity, seen)
  }
  for (const [, tries] of everyIdentityOnce) {
    assert.ok(
      tries.filter((tryNumber) => tryNumber === 1).length <= 1,
      '≤1 initial attempt per target',
    )
    assert.ok(tries.filter((tryNumber) => tryNumber === 2).length <= 1, '≤1 retry per target')
  }

  const withoutPolicy = createRecoveryContext(configFor(makeClock(FIXTURE_NOW).now))
  const plain = resolveRouteWithRecovery(
    policy,
    makeRequest(),
    OPTIONS,
    episodeFor({ requested: { lane: 'L5', registry_key: 'unlisted/slug' }, prior_attempts: prior }),
    withoutPolicy,
  )
  const plainGlm = plain.episode.attempted
    .filter((attempt) => attempt.identity === GLM_ID)
    .map((attempt) => attempt.attempt)
  assert.deepEqual(plainGlm, [1], 'without a retry policy nothing ever retries')
})

test('C6 honesty: walk instrumentation — one refresh per episode, at most one initial attempt per target, fresh episode ids, no cycles', () => {
  let calls = 0
  const refresh: MetadataRefreshFn = () => {
    calls += 1
    return { status: 'unavailable', reason: 'instrumented' }
  }
  let policy = withBinding(makeDeclaredPolicy(), QWEN_ID, stripInputs)
  policy = withBinding(policy, GLM_ID, stripInputs)
  policy = withBinding(policy, GEMINI_ID, stripInputs)
  policy = withBinding(policy, HAIKU_ID, stripInputs)
  const context = createRecoveryContext(configFor(makeClock(FIXTURE_NOW).now, { refresh }))
  const episodeInput = episodeFor({
    requested: { lane: 'L5', registry_key: 'unlisted/slug' },
  })

  const first = resolveRouteWithRecovery(policy, makeRequest(), OPTIONS, episodeInput, context)
  const second = resolveRouteWithRecovery(policy, makeRequest(), OPTIONS, episodeInput, context)

  // Boundedness: the per-episode cap is one invocation, and the version-scoped
  // negative cache serves the repeated miss — one invocation total across both.
  assert.equal(calls, 1, 'repeated misses are bounded: one invocation across two episodes')
  assert.notEqual(
    first.episode.episode_id,
    second.episode.episode_id,
    'a fresh call is a fresh episode id',
  )
  for (const record of [first.episode, second.episode]) {
    assert.ok(record.terminal, 'the terminal is sticky — no path back from step 4')
    const perTarget = new Map<string, number[]>()
    for (const attempt of record.attempted) {
      const tries = perTarget.get(attempt.identity) ?? []
      tries.push(attempt.attempt)
      perTarget.set(attempt.identity, tries)
    }
    for (const [identity, tries] of perTarget) {
      assert.ok(
        tries.filter((tryNumber) => tryNumber === 1).length <= 1,
        `at most one initial attempt per target (${identity})`,
      )
      assert.equal(new Set(tries).size, tries.length, 'no cycles: a target is never re-entered')
    }
  }
})

test('C6 honesty: an unhealthy failure class stamps provider cooldown and expires on the injected clock', () => {
  let policy = withBinding(makeDeclaredPolicy(), QWEN_ID, stripInputs)
  policy = withBinding(policy, GLM_ID, stripInputs)
  policy = withBinding(policy, GEMINI_ID, stripInputs)
  policy = withBinding(policy, HAIKU_ID, stripInputs)
  const clock = makeClock(FIXTURE_NOW)
  const context = createRecoveryContext(
    configFor(clock.now, {
      health_policy: { unhealthy: (failureClass) => failureClass === 'outage' },
    }),
  )
  const prior = [
    {
      attempt_ref: 'pa-1',
      provider: 'opencode',
      failure_class: 'outage',
      charge_status: 'no-charge' as const,
    },
  ]
  const episodeInput = episodeFor({
    requested: { lane: 'L5', registry_key: 'unlisted/slug' },
    prior_attempts: prior,
  })

  const cooled = resolveRouteWithRecovery(policy, makeRequest(), OPTIONS, episodeInput, context)
  const byId = new Map(cooled.episode.attempted.map((attempt) => [attempt.identity, attempt]))
  for (const id of [QWEN_ID, GLM_ID]) {
    const names = (byId.get(id)?.refusals ?? []).map((refusal) => refusal.name)
    assert.ok(
      names.includes('PROVIDER_COOLDOWN_ACTIVE'),
      `expected PROVIDER_COOLDOWN_ACTIVE for ${id}, got ${JSON.stringify(names)}`,
    )
  }

  clock.advance(20_001) // past provider_cooldown_ms — the stamp expired
  const recovered = resolveRouteWithRecovery(policy, makeRequest(), OPTIONS, episodeInput, context)
  const recoveredById = new Map(
    recovered.episode.attempted.map((attempt) => [attempt.identity, attempt]),
  )
  for (const id of [QWEN_ID, GLM_ID]) {
    const names = (recoveredById.get(id)?.refusals ?? []).map((refusal) => refusal.name)
    assert.ok(
      !names.includes('PROVIDER_COOLDOWN_ACTIVE'),
      `the recovered provider must be walkable again (${id}): ${JSON.stringify(names)}`,
    )
  }
})

// ===========================================================================
// C1.3 / C7 — bounds fail-closed and the freshness enforcement seam.
// ===========================================================================

test('C1.3 bounds: non-positive bounds terminate typed with RECOVERY_BOUNDS_UNCONFIGURED — steps 2–3 never run', () => {
  let calls = 0
  const refresh: MetadataRefreshFn = () => {
    calls += 1
    return { status: 'unavailable', reason: 'never-reached' }
  }
  const context = createRecoveryContext(
    configFor(makeClock(FIXTURE_NOW).now, {
      refresh,
      bounds: { max_fallback_attempts: 0 },
    }),
  )
  const result = resolveRouteWithRecovery(
    makeDeclaredPolicy(),
    makeRequest(),
    OPTIONS,
    episodeFor({ requested: { lane: 'L5', registry_key: 'unlisted/slug' } }),
    context,
  )

  assert.equal(result.status, 'route-unavailable')
  assert.equal(calls, 0, 'steps 2–3 never run')
  assert.equal(result.episode.attempted.length, 0)
  if (result.status === 'route-unavailable') {
    assert.ok(
      result.outcome.refusals.some((refusal) => refusal.name === 'RECOVERY_BOUNDS_UNCONFIGURED'),
    )
    assert.equal(result.outcome.hold, 'parcel-held')
    assert.ok(verifyReceiptSignature(result.receipt), 'the signed stop receipt reproduces')
  }
})

test('C7 enforcement: UNSET tolerance rejects past-valid refreshed evidence with FRESHNESS_STALE_REFUSED (zero policy grace)', () => {
  const refresh: MetadataRefreshFn = () => ({
    status: 'refreshed',
    provenance: provenanceAt('2026-09-27T11:59:50.000Z'), // 10 s past validity
    entries: {},
  })
  const key = registryKeyFor('opencode', 'qwen3.8-flash')
  const policy = withBinding(makeDeclaredPolicy(), QWEN_ID, stripInputs)
  const context = createRecoveryContext(configFor(makeClock(FIXTURE_NOW).now, { refresh }))
  const result = resolveRouteWithRecovery(
    policy,
    makeRequest(),
    OPTIONS,
    episodeFor({ requested: { lane: 'L5', registry_key: key } }),
    context,
  )

  const reEvaluation = result.episode.attempted.find((attempt) => attempt.attempt === 2)
  assert.ok(
    reEvaluation?.refusals.some((refusal) => refusal.name === 'FRESHNESS_STALE_REFUSED'),
    `expected FRESHNESS_STALE_REFUSED, got ${JSON.stringify(reEvaluation?.refusals)}`,
  )
  assert.equal(result.episode.freshness.verdict, 'stale')
  assert.equal(result.episode.freshness.tolerance_ms, null, 'UNSET is recorded as consumed-unset')
  assert.ok(result.episode.freshness.age_ms !== null && result.episode.freshness.age_ms > 0)
})

test('C7 enforcement: a set tolerance passes within grace (recorded age_ms/tolerance_ms) and rejects beyond it', () => {
  const refresh: MetadataRefreshFn = () => ({
    status: 'refreshed',
    provenance: provenanceAt('2026-09-27T11:59:50.000Z'), // 10 s past validity
    entries: {},
  })
  const key = registryKeyFor('opencode', 'qwen3.8-flash')
  const policy = withBinding(makeDeclaredPolicy(), QWEN_ID, stripInputs)

  const withinContext = createRecoveryContext(
    configFor(makeClock(FIXTURE_NOW).now, {
      refresh,
      provenance_freshness_tolerance: 60_000,
    }),
  )
  const within = resolveRouteWithRecovery(
    policy,
    makeRequest(),
    OPTIONS,
    episodeFor({ requested: { lane: 'L5', registry_key: key } }),
    withinContext,
  )
  const withinRe = within.episode.attempted.find((attempt) => attempt.attempt === 2)
  assert.ok(
    !withinRe?.refusals.some((refusal) => refusal.name === 'FRESHNESS_STALE_REFUSED'),
    'within the tolerance the item passes',
  )
  assert.equal(within.episode.freshness.verdict, 'fresh')
  assert.equal(within.episode.freshness.tolerance_ms, 60_000)
  assert.ok(within.episode.freshness.age_ms !== null && within.episode.freshness.age_ms > 0)

  const beyondContext = createRecoveryContext(
    configFor(makeClock(FIXTURE_NOW).now, {
      refresh,
      provenance_freshness_tolerance: 5_000,
    }),
  )
  const beyond = resolveRouteWithRecovery(
    policy,
    makeRequest(),
    OPTIONS,
    episodeFor({ requested: { lane: 'L5', registry_key: key } }),
    beyondContext,
  )
  const beyondRe = beyond.episode.attempted.find((attempt) => attempt.attempt === 2)
  assert.ok(
    beyondRe?.refusals.some((refusal) => refusal.name === 'FRESHNESS_STALE_REFUSED'),
    'beyond the tolerance the item is rejected',
  )
  assert.equal(beyond.episode.freshness.verdict, 'stale')
  assert.equal(beyond.episode.freshness.tolerance_ms, 5_000)
})

// ===========================================================================
// RB-5 vocabulary enumeration + equivalence pins.
// ===========================================================================

test('RB-5 vocabulary: every RECOVERY_REFUSALS name is emitted by exactly one named negative control; no control emits a name outside the vocabularies', () => {
  const names = Object.keys(RECOVERY_CONTROL_BY_NAME).sort()
  assert.deepEqual(names, [...RECOVERY_REFUSALS].sort())
  const titles = Object.values(RECOVERY_CONTROL_BY_NAME)
  assert.equal(
    new Set(titles).size,
    titles.length,
    'each name maps to exactly one distinct named control',
  )
  for (const name of names) {
    assert.ok(ALLOWED_REFUSAL_NAMES.has(name), `recovery name must be in the closed list: ${name}`)
  }
  // The named controls each assert their own emission; this control pins the
  // closed-list discipline and the reused-name union every control stays in.
  for (const name of [...RESOLVER_REFUSALS, ...ADAPTER_REFUSALS]) {
    assert.ok(ALLOWED_REFUSAL_NAMES.has(name))
  }
})

test('equivalence: a recovery-absent call is byte-identical (canonicalJson drops the absent recovery field); plain resolveRoute stays untouched', () => {
  const policy = makeDeclaredPolicy()
  const receipt: RouteReceipt = resolveRoute(policy, makeRequest(), OPTIONS)
  assert.equal(receipt.schema_version, 1, 'schema_version stays 1')
  assert.equal(Object.hasOwn(receipt, 'recovery'), false)
  assert.equal(canonicalJson({ ...receipt, recovery: undefined }), canonicalJson(receipt))
  assert.ok(verifyReceiptSignature(receipt))
})

// ===========================================================================
// Rework (reviews REJECT): R1–R9 + sweep G9 — gate-set parity, control
// strength, honesty fixes. Each mutation-sensitive control names the mutation
// that turns it red.
// ===========================================================================

const FIXTURE_EVIDENCE = {
  source: 'synthetic-test-fixture',
  date: '2026-09-27',
  admissibility: 'synthetic negative control — not a merit claim',
}

function withExpertiseBindings(
  policy: RoutingPolicy,
  entries: readonly ExpertiseBinding[],
): RoutingPolicy {
  return { ...policy, expertise_bindings: entries }
}

function namesForAttempt(record: RecoveryEpisodeRecord, id: string): string[] {
  return (record.attempted.find((attempt) => attempt.identity === id)?.refusals ?? []).map(
    (refusal) => refusal.name,
  )
}

test('R1: expertise narrowing rides the ladder revalidation — never a silent fail-over past the declared binding (mutation: removing the narrowing call turns this red)', () => {
  // The narrowing excludes only qwen (its pair glm is inside): with the
  // marking gone, qwen's own evaluation is un-narrowed and would win — the
  // target-level marking is decisive here, not masked by the pair path.
  const policy = withExpertiseBindings(makeDeclaredPolicy(), [
    {
      routing_class: 'boilerplate',
      expertise: 'engineering',
      shadow: false,
      bindings: [
        { type: 'binding', ref: GLM_ID },
        { type: 'binding', ref: GEMINI_ID },
        { type: 'binding', ref: HAIKU_ID },
      ],
      evidence: FIXTURE_EVIDENCE,
    },
  ])
  const context = createRecoveryContext(configFor(makeClock(FIXTURE_NOW).now))
  const result = resolveRouteWithRecovery(
    policy,
    makeRequest({ expertise: 'engineering' }),
    OPTIONS,
    episodeFor({ requested: { lane: 'L5', registry_key: 'unlisted/slug' } }),
    context,
  )

  assert.ok(
    namesForAttempt(result.episode, QWEN_ID).includes('EXPERTISE_NARROWED_OUT'),
    `the cheaper qwen must be narrowed out: ${JSON.stringify(namesForAttempt(result.episode, QWEN_ID))}`,
  )
  assert.equal(result.status, 'approved')
  assert.equal(
    result.receipt.route?.primary.binding_id,
    GEMINI_ID,
    'the narrowed-in target wins — narrowing filters, it never reorders or fail-overs (D3)',
  )
})

test('R1: a declared pair outside the expertise binding refuses the route and narrowed-to-empty refuses EXPERTISE_BINDING_UNSATISFIABLE', () => {
  const policy = withExpertiseBindings(makeDeclaredPolicy(), [
    {
      routing_class: 'boilerplate',
      expertise: 'engineering',
      shadow: false,
      bindings: [{ type: 'binding', ref: GEMINI_ID }],
      evidence: FIXTURE_EVIDENCE,
    },
  ])
  const context = createRecoveryContext(configFor(makeClock(FIXTURE_NOW).now))
  const result = resolveRouteWithRecovery(
    policy,
    makeRequest({ expertise: 'engineering' }),
    OPTIONS,
    episodeFor({ requested: { lane: 'L5', registry_key: 'unlisted/slug' } }),
    context,
  )

  assert.equal(result.status, 'route-unavailable')
  assert.ok(
    namesForAttempt(result.episode, GEMINI_ID).includes('EXPERTISE_NARROWED_OUT'),
    "gemini's declared pair (haiku) sits outside the binding — the route refuses, never fail-overs",
  )
  if (result.status === 'route-unavailable') {
    assert.ok(
      result.outcome.refusals.some((refusal) => refusal.name === 'EXPERTISE_BINDING_UNSATISFIABLE'),
      `expected EXPERTISE_BINDING_UNSATISFIABLE, got ${JSON.stringify(result.outcome.refusals.map((r) => r.name))}`,
    )
    assertVocabularyClean(allRefusalNames(result.episode))
  }
})

test('R1: a dangling expertise binding refuses by name through the single narrowing seam', () => {
  const policy = withExpertiseBindings(makeDeclaredPolicy(), [
    {
      routing_class: 'boilerplate',
      expertise: 'engineering',
      shadow: false,
      bindings: [{ type: 'binding', ref: 'undeclared/ghost-binding' }],
      evidence: FIXTURE_EVIDENCE,
    },
  ])
  const context = createRecoveryContext(configFor(makeClock(FIXTURE_NOW).now))
  const result = resolveRouteWithRecovery(
    policy,
    makeRequest({ expertise: 'engineering' }),
    OPTIONS,
    episodeFor({ requested: { lane: 'L5', registry_key: 'unlisted/slug' } }),
    context,
  )
  assert.equal(result.status, 'route-unavailable')
  assert.ok(
    allRefusalNames(result.episode).includes('EXPERTISE_BINDING_DANGLING_REFERENCE'),
    'the dangling stop is carried, never re-derived or swallowed',
  )
})

test('R2: a disabled lane is a typed LANE_DISABLED_REFUSED terminal before any target evaluation (mutation: removing the gate turns this red)', () => {
  const prepared = requestForLane(makeDeclaredPolicy(), 'L6')
  const context = createRecoveryContext(configFor(makeClock(FIXTURE_NOW).now))
  const result = resolveRouteWithRecovery(
    prepared.policy,
    prepared.request,
    OPTIONS,
    episodeFor({ requested: { lane: 'L6', registry_key: 'unlisted/slug' } }),
    context,
  )

  assert.equal(result.status, 'route-unavailable')
  assert.equal(
    result.episode.attempted.length,
    0,
    'the terminal lands before any target evaluation',
  )
  if (result.status === 'route-unavailable') {
    assert.ok(
      result.outcome.refusals.some((refusal) => refusal.name === 'LANE_DISABLED_REFUSED'),
      `expected LANE_DISABLED_REFUSED, got ${JSON.stringify(result.outcome.refusals.map((r) => r.name))}`,
    )
    // The actionable reason names the disabled lane as the cause — never a
    // missing-mapping story (D8 step 4).
    assert.ok(result.outcome.reason.includes('L6'), result.outcome.reason)
    assert.ok(result.outcome.reason.includes('disabled'), result.outcome.reason)
    assert.ok(!result.outcome.reason.includes('mapping'), result.outcome.reason)
    assert.ok(verifyReceiptSignature(result.receipt))
  }
})

test('G9: a lane with no declared lane_routes refuses at the request gate with the request-level cause', () => {
  const prepared = requestForLane(makeDeclaredPolicy(), 'L5')
  const policy: RoutingPolicy = {
    ...prepared.policy,
    lane_routes: (prepared.policy.lane_routes ?? []).filter((route) => route.lane !== 'L5'),
  }
  const context = createRecoveryContext(configFor(makeClock(FIXTURE_NOW).now))
  const result = resolveRouteWithRecovery(
    policy,
    makeRequest(),
    OPTIONS,
    episodeFor({ requested: { lane: 'L5', registry_key: 'unlisted/slug' } }),
    context,
  )

  assert.equal(result.status, 'route-unavailable')
  if (result.status === 'route-unavailable') {
    assert.ok(
      result.outcome.refusals.some(
        (refusal) =>
          refusal.name === 'REPRESENTATION_INCOMPLETE_REFUSED' &&
          refusal.detail.includes('no lane_routes entry declares lane L5'),
      ),
      `expected the request-level empty-routes cause, got ${JSON.stringify(result.outcome.refusals)}`,
    )
  }
})

test('R5: the visited set is falsifiable — exactly one AttemptRecord per binding id (mutation: deleting the visited check turns this red)', () => {
  // (a) the requested target is also a declared walk target. The requested
  // attempt records the requested key; the walk would record the binding id —
  // together they name the same target, and exactly one record may exist.
  const key = registryKeyFor('opencode', 'qwen3.8-flash')
  const policyA = withBinding(makeDeclaredPolicy(), QWEN_ID, stripInputs)
  const contextA = createRecoveryContext(configFor(makeClock(FIXTURE_NOW).now))
  const resultA = resolveRouteWithRecovery(
    policyA,
    makeRequest(),
    OPTIONS,
    episodeFor({ requested: { lane: 'L5', registry_key: key } }),
    contextA,
  )
  const qwenRecords = resultA.episode.attempted.filter(
    (attempt) => attempt.identity === key || attempt.identity === QWEN_ID,
  )
  assert.equal(
    qwenRecords.length,
    1,
    'the step-1 target is never re-attempted by the walk (no cycles)',
  )
  assert.equal(qwenRecords[0]?.role, 'requested')

  // (b) a lane declaring the same binding twice.
  const base = makeDeclaredPolicy()
  const duplicateSource = (base.lane_routes ?? []).find(
    (route) => route.lane === 'L5' && route.provider === 'opencode',
  )
  assert.ok(duplicateSource, 'fixture policy must declare the L5 opencode route')
  const duplicated: RoutingPolicy = {
    ...base,
    lane_routes: [...(base.lane_routes ?? []), { ...duplicateSource }],
  }
  let policyB = withBinding(duplicated, QWEN_ID, stripInputs)
  policyB = withBinding(policyB, GLM_ID, stripInputs)
  policyB = withBinding(policyB, GEMINI_ID, stripInputs)
  policyB = withBinding(policyB, HAIKU_ID, stripInputs)
  const contextB = createRecoveryContext(configFor(makeClock(FIXTURE_NOW).now))
  const resultB = resolveRouteWithRecovery(
    policyB,
    makeRequest(),
    OPTIONS,
    episodeFor({ requested: { lane: 'L5', registry_key: 'unlisted/slug' } }),
    contextB,
  )
  const perIdentity = new Map<string, number>()
  for (const attempt of resultB.episode.attempted) {
    if (attempt.role === 'requested') continue
    perIdentity.set(attempt.identity, (perIdentity.get(attempt.identity) ?? 0) + 1)
  }
  for (const [identity, count] of perIdentity) {
    assert.equal(count, 1, `a duplicate declaration must record one attempt (${identity})`)
  }
  assert.equal(perIdentity.size, 4, 'every declared target recorded exactly once')
})

test('R6: a permitted transient retry consumes a cap slot (the retry is counted against max_fallback_attempts)', () => {
  let policy = withBinding(makeDeclaredPolicy(), QWEN_ID, stripInputs)
  policy = withBinding(policy, GLM_ID, stripInputs)
  const context = createRecoveryContext(
    configFor(makeClock(FIXTURE_NOW).now, {
      bounds: { max_fallback_attempts: 3 },
      retry_policy: { retryable: (failureClass) => failureClass === 'transient-rate-limit' },
    }),
  )
  const result = resolveRouteWithRecovery(
    policy,
    makeRequest(),
    OPTIONS,
    episodeFor({
      requested: { lane: 'L5', registry_key: 'unlisted/slug' },
      prior_attempts: [
        {
          attempt_ref: GLM_ID,
          provider: 'opencode',
          failure_class: 'transient-rate-limit',
          charge_status: 'no-charge',
        },
      ],
    }),
    context,
  )

  const glmTries = result.episode.attempted
    .filter((attempt) => attempt.identity === GLM_ID)
    .map((attempt) => attempt.attempt)
  assert.deepEqual(glmTries, [1, 2], 'the retry ran — consuming the third cap slot')
  const perIdentity = new Set(result.episode.attempted.map((attempt) => attempt.identity))
  assert.ok(
    !perIdentity.has(GEMINI_ID),
    'gemini never got a slot: the retry consumed it (each retry counts against the cap)',
  )
  assert.equal(result.status, 'route-unavailable')
  if (result.status === 'route-unavailable') {
    assert.ok(
      result.outcome.refusals.some((refusal) => refusal.name === 'RECOVERY_ATTEMPT_CAP_EXHAUSTED'),
    )
  }
})

test('R7: the cooldown stamp map is bounded — markers dead longer than the window are pruned', () => {
  const clock = makeClock(FIXTURE_NOW)
  const context = createRecoveryContext(
    configFor(clock.now, {
      health_policy: { unhealthy: (failureClass) => failureClass === 'outage' },
    }),
  )
  const priors = ['opencode', 'openrouter', 'third-party'].map((provider, position) => ({
    attempt_ref: `pa-${String(position)}`,
    provider,
    failure_class: 'outage',
    charge_status: 'no-charge' as const,
  }))
  const stamped = resolveRouteWithRecovery(
    makeDeclaredPolicy(),
    makeRequest(),
    OPTIONS,
    episodeFor({
      requested: { lane: 'L5', registry_key: 'unlisted/slug' },
      prior_attempts: priors,
    }),
    context,
  )
  assert.equal(stamped.status, 'route-unavailable')
  assert.equal(context.state.cooldowns.size, 3, 'three providers stamped')

  clock.advance(40_001) // dead longer than provider_cooldown_ms (20 000)
  const pruned = resolveRouteWithRecovery(
    makeDeclaredPolicy(),
    makeRequest(),
    OPTIONS,
    episodeFor({ requested: { lane: 'L5', registry_key: 'unlisted/slug' } }),
    context,
  )
  assert.equal(pruned.status, 'approved')
  assert.equal(
    context.state.cooldowns.size,
    0,
    'markers dead longer than the window are pruned — the map stays bounded (R7)',
  )
})

test('R4: a malformed tolerance fails closed at the verdict seam — never repaired into grace', () => {
  const provenance = provenanceAt('2026-09-27T12:00:00.000Z')
  const at = '2026-09-27T12:00:10.000Z' // age = 10 000 ms past validity
  assert.equal(provenanceFreshnessVerdict(provenance, at, Number.POSITIVE_INFINITY), 'stale')
  assert.equal(provenanceFreshnessVerdict(provenance, at, Number.NaN), 'stale')
  assert.equal(provenanceFreshnessVerdict(provenance, at, -1), 'stale')
  assert.equal(provenanceFreshnessVerdict(provenance, at, 0.5), 'stale')
  // The valid shape still grants exactly its grace (the seam consumes the
  // input; no constant).
  assert.equal(provenanceFreshnessVerdict(provenance, at, 10_000), 'fresh')
})
