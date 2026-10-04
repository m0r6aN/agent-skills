/**
 * PMC-P2 resolver suite — acceptance for the charter PMC-P2 resolver outcome
 * (exact lane configuration, OpenRouter provider constraints, fallback handoff
 * record, no-secret route receipt) plus a negative control for every refusal
 * path the resolver can emit.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildFallbackHandoff, piModelContractFor, resolveRoute } from '../src/pi-resolver.js'
import type { RouteReceipt } from '../src/route-receipt.js'
import type { ModelBinding, RoutingPolicy } from '../src/types.js'
import {
  CONTRACT_REFUSALS,
  CONTRACT_RESIDUALS,
  RESOLVER_HOLDS,
  RESOLVER_REFUSALS,
} from '../src/types.js'
import { validatePolicy } from '../src/validator.js'
import {
  FIXED_ISSUED_AT,
  loadShippedPolicy,
  makeDeclaredPolicy,
  makeRequest,
  withBinding,
  withComparability,
  withLane,
  withLaneRoute,
} from './pi-fixtures.js'

const VOCABULARY: Readonly<Record<string, true>> = Object.fromEntries(
  [...RESOLVER_REFUSALS, ...RESOLVER_HOLDS, ...CONTRACT_REFUSALS, ...CONTRACT_RESIDUALS].map(
    (name) => [name, true as const],
  ),
)

function stopNames(receipt: RouteReceipt): string[] {
  return receipt.stops.map((stop) => stop.name)
}

function evaluationOf(receipt: RouteReceipt, bindingId: string) {
  const found = receipt.evaluations.find((evaluation) => evaluation.binding_id === bindingId)
  assert.ok(found, `expected an evaluation record for '${bindingId}'`)
  return found
}

function refusalNames(receipt: RouteReceipt, bindingId: string): string[] {
  return evaluationOf(receipt, bindingId).refusals.map((refusal) => refusal.name)
}

function assertApprox(actual: number | null, expected: number): void {
  assert.ok(
    actual !== null && Math.abs(actual - expected) < 1e-9,
    `expected ≈${expected}, got ${String(actual)}`,
  )
}

test('L5 resolves to the cheapest rankable primary with its declared fallback (static-conformance)', () => {
  const receipt = resolveRoute(makeDeclaredPolicy(), makeRequest(), { issued_at: FIXED_ISSUED_AT })

  assert.equal(receipt.status, 'approved')
  assert.equal(receipt.attested_state, 'static-conformance')
  assert.equal(receipt.lane, 'L5')
  assert.equal(receipt.selection.chosen, 'opencode/qwen3.8-flash')
  assert.equal(receipt.route?.primary.binding_id, 'opencode/qwen3.8-flash')
  assert.equal(receipt.route?.fallback.binding_id, 'opencode/glm-5.3-flash')
  // "Unproven" is never read as "comparable" (rubric §1): the declared pair is
  // recorded with its honest verdict.
  assert.deepEqual(receipt.route?.fallback.suitability, {
    state: 'unproven',
    residual: 'FALLBACK_SUITABILITY_UNPROVEN',
  })
  assert.equal(receipt.route?.openrouter_constraints, null)
  assert.equal(receipt.route?.pi_model_contract.registry_key, 'qwen/qwen3.8-flash')

  // Charter D1 lane configuration: thinking level (charter matrix row 5),
  // budget (boilerplate ceiling 0.50), data controls (internal → strict).
  assert.equal(receipt.lane_config?.thinking_level.value, 'minimal/low')
  assert.equal(receipt.lane_config?.budget.ceiling_usd, 0.5)
  assert.equal(receipt.lane_config?.budget.remaining_budget_usd, 0.45)
  assertApprox(receipt.lane_config?.budget.projected_cost_usd ?? null, 0.013)
  assert.deepEqual(receipt.lane_config?.data_controls, { data_collection: 'deny', zdr: true })

  // Fallback handoff record (charter D3/D4/D8, A2).
  assert.equal(receipt.fallback_handoff?.on_primary_degraded.action, 'route-to-declared-fallback')
  assert.equal(receipt.fallback_handoff?.on_fallback_failure.action, 'stop-and-report')
  assert.equal(
    receipt.fallback_handoff?.cross_provider.action,
    'new-recorded-attempt-from-durable-handoff',
  )
  assert.equal(receipt.fallback_handoff?.cross_provider.silent_continuation, 'never')
  assert.deepEqual(receipt.fallback_handoff?.on_primary_degraded.required_preflight, [
    'enabled',
    'available',
    'data-class-eligible',
    'tool/structured-output-compatible',
    'within-remaining-budget',
  ])
})

test('the receipt records every ranking input for every candidate (A3), and only vocabulary names', () => {
  const receipt = resolveRoute(makeDeclaredPolicy(), makeRequest(), { issued_at: FIXED_ISSUED_AT })

  assert.equal(receipt.evaluations.length, 4)
  for (const evaluation of receipt.evaluations) {
    assert.deepEqual(
      evaluation.ranking_inputs.map((input) => input.input),
      ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7'],
    )
    for (const refusal of evaluation.refusals) assert.ok(refusal.name in VOCABULARY, refusal.name)
    for (const residual of evaluation.residuals) assert.ok(residual in VOCABULARY, residual)
    for (const hold of evaluation.holds) assert.ok(hold in VOCABULARY, hold)
  }
  for (const stop of receipt.stops) assert.ok(stop.name in VOCABULARY, stop.name)
  for (const claim of receipt.unproven_claims) {
    if (claim.residual !== undefined) assert.ok(claim.residual in VOCABULARY, claim.residual)
  }
  const claimNames = receipt.unproven_claims.map((claim) => claim.residual)
  assert.ok(claimNames.includes('DELTA_L_UNSET'))
  assert.ok(claimNames.includes('FALLBACK_SUITABILITY_UNPROVEN'))
})

test('cheapest-eligible ordering follows projected cost (A3 economy lanes)', () => {
  const pricier = withBinding(makeDeclaredPolicy(), 'opencode/qwen3.8-flash', (binding) => ({
    ...binding,
    cost: {
      state: 'declared',
      value: { unit: 'usd_per_mtok', input: 1, output: 3 },
      source: 'synthetic-test-fixture',
    },
  }))
  const receipt = resolveRoute(pricier, makeRequest(), { issued_at: FIXED_ISSUED_AT })

  assert.equal(receipt.selection.chosen, 'openrouter/google/gemini-3.8-flash')
  assert.equal(receipt.route?.openrouter_constraints?.base_url, 'https://openrouter.ai/api/v1')
  assert.equal(receipt.route?.openrouter_constraints?.allow_fallbacks, true)
  assert.deepEqual(
    {
      data_collection: receipt.route?.openrouter_constraints?.data_collection,
      zdr: receipt.route?.openrouter_constraints?.zdr,
    },
    { data_collection: 'deny', zdr: true },
  )
  assert.equal(
    receipt.route?.openrouter_constraints?.pi_model_contract.registry_key,
    'google/gemini-3.8-flash',
  )
})

test('the route receipt is a no-secret artifact (D2/A1)', () => {
  const receipt = resolveRoute(makeDeclaredPolicy(), makeRequest(), { issued_at: FIXED_ISSUED_AT })
  const serialized = JSON.stringify(receipt)

  assert.equal(
    /(?:api[_-]?key|secret|password|credential|bearer|authorization)/i.test(serialized),
    false,
  )
  assert.equal(/(?:^|[^a-zA-Z0-9])sk-[a-zA-Z0-9]{8,}/.test(serialized), false)
  assert.equal(/Bearer\s+\S+/.test(serialized), false)
})

test('resolution is deterministic: same inputs, identical signed receipt', () => {
  const first = resolveRoute(makeDeclaredPolicy(), makeRequest(), { issued_at: FIXED_ISSUED_AT })
  const second = resolveRoute(makeDeclaredPolicy(), makeRequest(), { issued_at: FIXED_ISSUED_AT })
  assert.deepEqual(first, second)
})

test('the shipped policy fails closed on every lane with named residuals (no fabricated values)', () => {
  const policy = loadShippedPolicy()

  const l1 = resolveRoute(policy, makeRequest({ lane: 'L1', routing_class: 'architecture/risk' }), {
    issued_at: FIXED_ISSUED_AT,
  })
  assert.equal(l1.status, 'stop')
  assert.deepEqual(stopNames(l1), ['L1_PINNED_PROVIDER_UNSET'])
  assert.equal(
    l1.evaluations.length,
    4,
    'A3: every candidate is evaluated and recorded before the provider step',
  )

  const l2 = resolveRoute(policy, makeRequest({ lane: 'L2', routing_class: 'architecture/risk' }), {
    issued_at: FIXED_ISSUED_AT,
  })
  assert.deepEqual(stopNames(l2), ['L2_PINNED_PROVIDER_UNSET'])

  const l3 = resolveRoute(
    policy,
    // `implementation/complex` has no ratified OQ5 thinking default (D8 gives
    // omission meaning only where a routing-class default exists) — a level is
    // declared explicitly, as schema v0.4 requires for this class.
    makeRequest({
      lane: 'L3',
      routing_class: 'implementation/complex',
      required_thinking_level: 'medium',
    }),
    { issued_at: FIXED_ISSUED_AT },
  )
  assert.deepEqual(stopNames(l3), ['COST_UNKNOWN'])
  assert.match(l3.stops[0]?.detail ?? '', /ceiling_usd/)

  const l4 = resolveRoute(policy, makeRequest({ lane: 'L4', routing_class: 'standard-feature' }), {
    issued_at: FIXED_ISSUED_AT,
  })
  assert.deepEqual(stopNames(l4), ['L4_PROVIDER_PREFERENCE_UNSET'])

  const l5 = resolveRoute(policy, makeRequest(), { issued_at: FIXED_ISSUED_AT })
  assert.equal(l5.status, 'stop')
  const names = new Set(stopNames(l5))
  for (const expected of [
    'AC2A_ZERO_MATCH',
    'AC2A_WRONG_PROVIDER',
    'AC2A_PREFIX_ALIAS_REFUSED',
    'DATA_CLASS_UNKNOWN',
    'CONTEXT_UNKNOWN',
    'COST_UNKNOWN',
    'AVAILABILITY_UNVERIFIED',
    'QUALITY_UNRECORDED',
    'ENDPOINT_DIVERGENCE_REFUSED',
  ]) {
    assert.ok(names.has(expected), `L5 stop receipt must name ${expected}`)
  }

  const l6 = resolveRoute(
    policy,
    makeRequest({ lane: 'L6', routing_class: 'routing/classification' }),
    { issued_at: FIXED_ISSUED_AT },
  )
  assert.deepEqual(stopNames(l6), ['LANE_DISABLED_REFUSED'])
  assert.deepEqual(
    l6.evaluations,
    [],
    'rubric §5 rule 1: nothing else is evaluated for the disabled lane',
  )

  // Residuals truth: every stop name is vocabulary-sourced; nothing is invented.
  for (const receipt of [l1, l2, l3, l4, l5, l6]) {
    for (const stop of receipt.stops) assert.ok(stop.name in VOCABULARY, stop.name)
  }
})

test('R1 negatives: unknown and ineligible data classes refuse', () => {
  const unknown = withBinding(
    makeDeclaredPolicy(),
    'opencode/qwen3.8-flash',
    (binding: ModelBinding) => ({
      ...binding,
      data_classes: { state: 'unknown', residual: 'DATA_CLASS_UNKNOWN' },
    }),
  )
  const unknownReceipt = resolveRoute(unknown, makeRequest(), { issued_at: FIXED_ISSUED_AT })
  assert.ok(refusalNames(unknownReceipt, 'opencode/qwen3.8-flash').includes('DATA_CLASS_UNKNOWN'))

  const ineligible = withBinding(makeDeclaredPolicy(), 'opencode/qwen3.8-flash', (binding) => ({
    ...binding,
    data_classes: { state: 'declared', value: ['public'], source: 'synthetic-test-fixture' },
  }))
  const ineligibleReceipt = resolveRoute(ineligible, makeRequest(), { issued_at: FIXED_ISSUED_AT })
  assert.ok(
    refusalNames(ineligibleReceipt, 'opencode/qwen3.8-flash').includes('DATA_CLASS_INELIGIBLE'),
  )

  const badClass = resolveRoute(
    makeDeclaredPolicy(),
    makeRequest({ data_class: 'secret' as never }),
    { issued_at: FIXED_ISSUED_AT },
  )
  assert.deepEqual(stopNames(badClass), ['DATA_CLASS_UNKNOWN'])
})

test('R2 negatives: unverified and missing required capabilities refuse', () => {
  const unverified = withBinding(makeDeclaredPolicy(), 'opencode/qwen3.8-flash', (binding) => ({
    ...binding,
    capabilities: { 'tool-use': 'unverified', 'structured-output': 'verified' },
  }))
  const unverifiedReceipt = resolveRoute(unverified, makeRequest({ require_tool_use: true }), {
    issued_at: FIXED_ISSUED_AT,
  })
  assert.ok(
    refusalNames(unverifiedReceipt, 'opencode/qwen3.8-flash').includes('CAPABILITY_UNVERIFIED'),
  )

  const missing = withBinding(makeDeclaredPolicy(), 'opencode/qwen3.8-flash', (binding) => ({
    ...binding,
    capabilities: { 'structured-output': 'verified' } as ModelBinding['capabilities'],
  }))
  const missingReceipt = resolveRoute(missing, makeRequest({ require_tool_use: true }), {
    issued_at: FIXED_ISSUED_AT,
  })
  assert.ok(refusalNames(missingReceipt, 'opencode/qwen3.8-flash').includes('CAPABILITY_MISSING'))
})

test('R3 negatives: excluded family is denied, never downgraded; unknown family refuses', () => {
  const excluded = resolveRoute(
    makeDeclaredPolicy(),
    makeRequest({ independence_excluded_families: ['qwen'] }),
    { issued_at: FIXED_ISSUED_AT },
  )
  assert.ok(refusalNames(excluded, 'opencode/qwen3.8-flash').includes('INDEPENDENCE_VIOLATION'))

  const unknown = withBinding(makeDeclaredPolicy(), 'opencode/qwen3.8-flash', (binding) => ({
    ...binding,
    family: '',
  }))
  const unknownReceipt = resolveRoute(unknown, makeRequest(), { issued_at: FIXED_ISSUED_AT })
  assert.ok(
    refusalNames(unknownReceipt, 'opencode/qwen3.8-flash').includes('INDEPENDENCE_UNPROVEN'),
  )
})

test('R4 negatives: insufficient and unknown context refuse', () => {
  const insufficient = resolveRoute(
    makeDeclaredPolicy(),
    makeRequest({ required_context_tokens: 2_000_000 }),
    { issued_at: FIXED_ISSUED_AT },
  )
  assert.ok(refusalNames(insufficient, 'opencode/qwen3.8-flash').includes('CONTEXT_INSUFFICIENT'))

  const unknown = withBinding(makeDeclaredPolicy(), 'opencode/qwen3.8-flash', (binding) => ({
    ...binding,
    context_window_tokens: { state: 'unknown', residual: 'CONTEXT_UNKNOWN' },
  }))
  const unknownReceipt = resolveRoute(unknown, makeRequest(), { issued_at: FIXED_ISSUED_AT })
  assert.ok(refusalNames(unknownReceipt, 'opencode/qwen3.8-flash').includes('CONTEXT_UNKNOWN'))

  const badRequest = resolveRoute(
    makeDeclaredPolicy(),
    makeRequest({ required_context_tokens: Number.NaN }),
    { issued_at: FIXED_ISSUED_AT },
  )
  assert.deepEqual(stopNames(badRequest), ['CONTEXT_UNKNOWN'])
})

test('R5 negatives: unknown cost, unknown cost unit, and exceeded budget refuse', () => {
  const unknown = withBinding(makeDeclaredPolicy(), 'opencode/qwen3.8-flash', (binding) => ({
    ...binding,
    cost: { state: 'unknown', residual: 'COST_UNKNOWN' },
  }))
  const unknownReceipt = resolveRoute(unknown, makeRequest(), { issued_at: FIXED_ISSUED_AT })
  assert.ok(refusalNames(unknownReceipt, 'opencode/qwen3.8-flash').includes('COST_UNKNOWN'))

  const wrongUnit = withBinding(makeDeclaredPolicy(), 'opencode/qwen3.8-flash', (binding) => ({
    ...binding,
    cost: {
      state: 'declared',
      value: { unit: 'usd_per_hour', input: 1, output: 1 },
      source: 'synthetic-test-fixture',
    },
  }))
  const wrongUnitReceipt = resolveRoute(wrongUnit, makeRequest(), { issued_at: FIXED_ISSUED_AT })
  assert.ok(refusalNames(wrongUnitReceipt, 'opencode/qwen3.8-flash').includes('COST_UNIT_UNKNOWN'))

  const exceeded = resolveRoute(
    makeDeclaredPolicy(),
    makeRequest({ remaining_budget_usd: 0.001 }),
    {
      issued_at: FIXED_ISSUED_AT,
    },
  )
  assert.equal(exceeded.status, 'stop')
  assert.ok(stopNames(exceeded).includes('BUDGET_EXCEEDED'))
})

test('R6/R7 negatives: unattested availability and unrecorded quality refuse', () => {
  const unavailable = withBinding(makeDeclaredPolicy(), 'opencode/qwen3.8-flash', (binding) => ({
    ...binding,
    availability: { state: 'unproven', residual: 'AVAILABILITY_UNVERIFIED' },
  }))
  const unavailableReceipt = resolveRoute(unavailable, makeRequest(), {
    issued_at: FIXED_ISSUED_AT,
  })
  assert.ok(
    refusalNames(unavailableReceipt, 'opencode/qwen3.8-flash').includes('AVAILABILITY_UNVERIFIED'),
  )

  const unrecorded = withBinding(makeDeclaredPolicy(), 'opencode/qwen3.8-flash', (binding) => ({
    ...binding,
    quality: { state: 'unproven', residual: 'QUALITY_UNRECORDED' },
  }))
  const unrecordedReceipt = resolveRoute(unrecorded, makeRequest(), { issued_at: FIXED_ISSUED_AT })
  assert.ok(
    refusalNames(unrecordedReceipt, 'opencode/qwen3.8-flash').includes('QUALITY_UNRECORDED'),
  )
})

test('identity negatives: owner-attested hold is unrankable, named as a hold', () => {
  const attested = withBinding(makeDeclaredPolicy(), 'opencode/qwen3.8-flash', (binding) => ({
    ...binding,
    identity: {
      state: 'owner-attested',
      attestation: 'synthetic-test-fixture',
      hold: 'OWNER_ATTESTED_PENDING_LIVE_AVAILABILITY',
    },
  }))
  const receipt = resolveRoute(attested, makeRequest(), { issued_at: FIXED_ISSUED_AT })
  const evaluation = evaluationOf(receipt, 'opencode/qwen3.8-flash')
  assert.deepEqual(evaluation.holds, ['OWNER_ATTESTED_PENDING_LIVE_AVAILABILITY'])
  assert.equal(evaluation.rankable, false)
  assert.equal(receipt.selection.chosen, 'openrouter/google/gemini-3.8-flash')
})

test('endpoint negatives: divergent catalogue endpoints and non-const registrations refuse (H-EP, SCF-3)', () => {
  const divergent = withBinding(makeDeclaredPolicy(), 'opencode/qwen3.8-flash', (binding) => ({
    ...binding,
    endpoint: {
      registered: binding.endpoint.registered,
      catalogue: 'https://opencode.ai/zen/v1',
      alignment: 'divergent',
    },
  }))
  const divergentReceipt = resolveRoute(divergent, makeRequest(), { issued_at: FIXED_ISSUED_AT })
  assert.ok(
    refusalNames(divergentReceipt, 'opencode/qwen3.8-flash').includes(
      'ENDPOINT_DIVERGENCE_REFUSED',
    ),
  )

  // SCF-3 resolve-side: a registration that diverges from the pi-openrouter.ts
  // contract const is refused, never normalized.
  const offConst = withBinding(
    makeDeclaredPolicy(),
    'openrouter/google/gemini-3.8-flash',
    (binding) => ({
      ...binding,
      endpoint: {
        registered: 'https://openrouter.ai/api',
        catalogue: 'https://openrouter.ai/api',
        alignment: 'aligned',
      },
    }),
  )
  const offConstReceipt = resolveRoute(offConst, makeRequest(), { issued_at: FIXED_ISSUED_AT })
  assert.ok(
    refusalNames(offConstReceipt, 'openrouter/google/gemini-3.8-flash').includes(
      'ENDPOINT_DIVERGENCE_REFUSED',
    ),
  )
})

test('RESIDUAL_FABRICATED_REFUSED holds at resolve time for every declaration slot and name', () => {
  const shipped = makeDeclaredPolicy()

  const fabricatedPin = withLane(shipped, 'L1', {
    provider_rule: {
      kind: 'pinned-provider',
      pinned_provider: { state: 'declared', value: 'opencode' },
    },
  })
  const pinReceipt = resolveRoute(
    fabricatedPin,
    makeRequest({ lane: 'L1', routing_class: 'architecture/risk' }),
    { issued_at: FIXED_ISSUED_AT },
  )
  assert.deepEqual(stopNames(pinReceipt), ['RESIDUAL_FABRICATED_REFUSED'])

  const fabricatedPreference = withLane(shipped, 'L4', {
    provider_rule: {
      kind: 'declared-preference',
      preference: { state: 'declared', value: 'openrouter' },
    },
  })
  const preferenceReceipt = resolveRoute(
    fabricatedPreference,
    makeRequest({ lane: 'L4', routing_class: 'standard-feature' }),
    { issued_at: FIXED_ISSUED_AT },
  )
  assert.deepEqual(stopNames(preferenceReceipt), ['RESIDUAL_FABRICATED_REFUSED'])

  const fabricatedTolerance = withLane(shipped, 'L5', {
    quality_tolerance: { state: 'declared', value: 0 },
  })
  const toleranceReceipt = resolveRoute(fabricatedTolerance, makeRequest(), {
    issued_at: FIXED_ISSUED_AT,
  })
  assert.deepEqual(stopNames(toleranceReceipt), ['RESIDUAL_FABRICATED_REFUSED'])

  const fabricatedResidual = withBinding(shipped, 'opencode/qwen3.8-flash', (binding) => ({
    ...binding,
    cost: { state: 'unknown', residual: 'TOTALLY_MADE_UP' },
  }))
  const residualReceipt = resolveRoute(fabricatedResidual, makeRequest(), {
    issued_at: FIXED_ISSUED_AT,
  })
  assert.ok(
    refusalNames(residualReceipt, 'opencode/qwen3.8-flash').includes('RESIDUAL_FABRICATED_REFUSED'),
  )

  const fabricatedIdentityName = withBinding(shipped, 'opencode/qwen3.8-flash', (binding) => ({
    ...binding,
    identity: {
      state: 'zero-match',
      refusal: 'MADE_UP_REFUSAL',
      diagnostics: [],
      hold: 'AC2A_ZERO_MATCH_HELD',
    },
  }))
  const identityReceipt = resolveRoute(fabricatedIdentityName, makeRequest(), {
    issued_at: FIXED_ISSUED_AT,
  })
  assert.ok(
    refusalNames(identityReceipt, 'opencode/qwen3.8-flash').includes('RESIDUAL_FABRICATED_REFUSED'),
  )

  // And the PMC-P1 static enforcement still holds on the document layer.
  const doc = withLane(loadShippedPolicy(), 'L1', {
    quality_tolerance: { state: 'unavailable', residual: 'BOGUS_RESIDUAL' },
  })
  const staticResult = validatePolicy(doc)
  assert.equal(staticResult.valid, false)
  assert.ok(staticResult.errors.some((error) => error.includes('RESIDUAL_FABRICATED_REFUSED')))
})

test('map/structure negatives: unmapped routing class, unknown lane, missing blocks, missing route', () => {
  const badClass = resolveRoute(
    makeDeclaredPolicy(),
    makeRequest({ lane: 'L1', routing_class: 'boilerplate' }),
    { issued_at: FIXED_ISSUED_AT },
  )
  assert.deepEqual(stopNames(badClass), ['ROLE_LANE_MAP_VIOLATION'])

  const badLane = resolveRoute(makeDeclaredPolicy(), makeRequest({ lane: 'L9' as never }), {
    issued_at: FIXED_ISSUED_AT,
  })
  assert.deepEqual(stopNames(badLane), ['ROLE_LANE_MAP_VIOLATION'])

  const badRequest = resolveRoute(makeDeclaredPolicy(), null as never, {
    issued_at: FIXED_ISSUED_AT,
  })
  assert.deepEqual(stopNames(badRequest), ['ROLE_LANE_MAP_VIOLATION'])
  assert.equal(badRequest.lane, null)

  const noBlocks = resolveRoute(
    { ...makeDeclaredPolicy(), candidates: undefined } as unknown as RoutingPolicy,
    makeRequest(),
    { issued_at: FIXED_ISSUED_AT },
  )
  assert.deepEqual(stopNames(noBlocks), ['REPRESENTATION_INCOMPLETE_REFUSED'])

  const noRoute = resolveRoute(
    { ...makeDeclaredPolicy(), lane_routes: [] } as unknown as RoutingPolicy,
    makeRequest(),
    { issued_at: FIXED_ISSUED_AT },
  )
  assert.deepEqual(stopNames(noRoute), ['REPRESENTATION_INCOMPLETE_REFUSED'])
})

test('registry negative: a binding with no Pi execution-plane registry entry refuses', () => {
  let policy = withBinding(makeDeclaredPolicy(), 'opencode/qwen3.8-flash', (binding) => ({
    ...binding,
    availability: { state: 'unproven', residual: 'AVAILABILITY_UNVERIFIED' },
  }))
  policy = withBinding(policy, 'opencode/glm-5.3-flash', (binding) => ({
    ...binding,
    availability: { state: 'unproven', residual: 'AVAILABILITY_UNVERIFIED' },
  }))
  policy = withBinding(policy, 'openrouter/google/gemini-3.8-flash', (binding) => ({
    ...binding,
    model: 'google/no-such-model',
  }))
  const receipt = resolveRoute(policy, makeRequest(), { issued_at: FIXED_ISSUED_AT })
  assert.deepEqual(stopNames(receipt), ['UNSUPPORTED_MODEL_REFUSED'])
})

test('L3 preference stop is reachable once its routing class has an owner ceiling (fixture)', () => {
  const withCeiling = structuredClone(makeDeclaredPolicy()) as RoutingPolicy & {
    classes: Record<string, { allowlist: readonly string[]; ceiling_usd: number }>
  }
  withCeiling.classes['implementation/complex'] = { allowlist: ['standard'], ceiling_usd: 10 }
  const receipt = resolveRoute(
    withCeiling,
    // `implementation/complex` has no ratified OQ5 thinking default — schema
    // v0.4 requests for it declare the level explicitly.
    makeRequest({
      lane: 'L3',
      routing_class: 'implementation/complex',
      required_thinking_level: 'medium',
    }),
    { issued_at: FIXED_ISSUED_AT },
  )
  assert.deepEqual(stopNames(receipt), ['L3_PROVIDER_PREFERENCE_UNSET'])
})

test('fallback handoff records: in-provider fallback, stop-and-report, and new cross-provider attempt', () => {
  const receipt = resolveRoute(makeDeclaredPolicy(), makeRequest(), { issued_at: FIXED_ISSUED_AT })

  const degraded = buildFallbackHandoff(
    receipt,
    { kind: 'primary-degraded', binding_id: 'opencode/qwen3.8-flash', observed: 'latency timeout' },
    { issued_at: FIXED_ISSUED_AT },
  )
  assert.equal(degraded.action, 'route-to-declared-fallback')
  assert.equal(degraded.continuation, 'not-applicable')
  assert.equal(degraded.rule, 'charter D4')
  assert.equal(degraded.required_preflight.length, 5)

  const bothFailed = buildFallbackHandoff(
    receipt,
    {
      kind: 'fallback-failed',
      binding_id: 'opencode/glm-5.3-flash',
      observed: 'both routes failed',
    },
    { issued_at: FIXED_ISSUED_AT },
  )
  assert.equal(bothFailed.action, 'stop-and-report')
  assert.equal(bothFailed.rule, 'charter D8')

  const cross = buildFallbackHandoff(
    receipt,
    {
      kind: 'cross-provider-attempt',
      binding_id: 'openrouter/google/gemini-3.8-flash',
      observed: 'opencode unavailable',
    },
    { issued_at: FIXED_ISSUED_AT },
  )
  assert.equal(cross.action, 'new-recorded-attempt')
  assert.equal(cross.continuation, 'refused-mid-turn')
  assert.equal(cross.rule, 'charter D3')
})

test('fallback handoff negatives: stop receipts and undeclared event kinds fail the call', () => {
  const approved = resolveRoute(makeDeclaredPolicy(), makeRequest(), { issued_at: FIXED_ISSUED_AT })
  const stopped = resolveRoute(
    loadShippedPolicy(),
    makeRequest({ lane: 'L1', routing_class: 'architecture/risk' }),
    { issued_at: FIXED_ISSUED_AT },
  )

  assert.throws(
    () =>
      buildFallbackHandoff(
        stopped,
        { kind: 'primary-degraded', binding_id: 'opencode/qwen3.8-flash', observed: 'x' },
        { issued_at: FIXED_ISSUED_AT },
      ),
    TypeError,
  )
  assert.throws(
    () =>
      buildFallbackHandoff(
        approved,
        { kind: 'teleported', binding_id: 'x', observed: 'x' } as never,
        { issued_at: FIXED_ISSUED_AT },
      ),
    TypeError,
  )
})

// ---------------------------------------------------------------------------
// Post-review regression controls (review A F1–F5; review B RB-1/RB-3/RB-4/
// RB-7). Each test reproduces the finding's adversarial scenario and pins the
// fail-closed outcome the record claims.
// ---------------------------------------------------------------------------

test('F1/RB-3: a candidate-typed fallback ref resolves exactly as the validator resolves it and is evaluated — the model is never fabricated from the raw ref', () => {
  const policy = withLaneRoute(makeDeclaredPolicy(), 'L5', 'opencode', (route) => ({
    ...route,
    fallback: { type: 'candidate', ref: 'glm-5.3-flash' },
  }))
  const receipt = resolveRoute(policy, makeRequest(), { issued_at: FIXED_ISSUED_AT })

  assert.equal(receipt.status, 'approved')
  // The candidate ref resolves to the route provider's binding (validator
  // resolve()), and the receipt carries binding identity — never the raw key.
  assert.equal(receipt.route?.fallback.binding_id, 'opencode/glm-5.3-flash')
  assert.equal(receipt.route?.fallback.model, 'glm-5.3-flash')
  assert.equal(receipt.fallback_handoff?.fallback, 'opencode/glm-5.3-flash')
  // The resolved fallback is a recorded candidate: R1–R7 are on the receipt.
  const evaluation = evaluationOf(receipt, 'opencode/glm-5.3-flash')
  assert.equal(evaluation.role, 'fallback')
  assert.deepEqual(
    evaluation.ranking_inputs.map((input) => input.input),
    ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7'],
  )
})

test('F1/RB-3: an unresolvable fallback ref stops fail-closed — never a fabricated model from the raw ref', () => {
  const dangling = withLaneRoute(makeDeclaredPolicy(), 'L5', 'opencode', (route) => ({
    ...route,
    fallback: { type: 'binding', ref: 'opencode/no-such-binding' },
  }))
  const danglingReceipt = resolveRoute(dangling, makeRequest(), { issued_at: FIXED_ISSUED_AT })
  assert.equal(danglingReceipt.status, 'stop')
  assert.equal(danglingReceipt.route, null)
  assert.deepEqual(stopNames(danglingReceipt), ['FALLBACK_DANGLING_REFERENCE'])

  const mismatch = withLaneRoute(makeDeclaredPolicy(), 'L5', 'opencode', (route) => ({
    ...route,
    fallback: { type: 'candidate', ref: 'no-such-candidate' },
  }))
  const mismatchReceipt = resolveRoute(mismatch, makeRequest(), { issued_at: FIXED_ISSUED_AT })
  assert.equal(mismatchReceipt.status, 'stop')
  assert.deepEqual(stopNames(mismatchReceipt), ['FALLBACK_DANGLING_REFERENCE'])

  // A candidate with no binding of the route's provider is a provider mismatch.
  const wrongProvider = withLaneRoute(makeDeclaredPolicy(), 'L5', 'openrouter', (route) => ({
    ...route,
    fallback: { type: 'candidate', ref: 'qwen3.8-flash' },
  }))
  const wrongProviderReceipt = resolveRoute(wrongProvider, makeRequest(), {
    issued_at: FIXED_ISSUED_AT,
  })
  assert.equal(wrongProviderReceipt.status, 'stop')
  assert.deepEqual(stopNames(wrongProviderReceipt), ['FALLBACK_PROVIDER_MISMATCH'])
})

test('RB-3: the emitted fallback must carry a Pi execution-plane registry entry (UNSUPPORTED_MODEL_REFUSED)', () => {
  const policy = withBinding(makeDeclaredPolicy(), 'opencode/glm-5.3-flash', (binding) => ({
    ...binding,
    model: 'no-such-model',
  }))
  const receipt = resolveRoute(policy, makeRequest(), { issued_at: FIXED_ISSUED_AT })
  assert.equal(receipt.status, 'stop')
  assert.equal(receipt.route, null)
  assert.deepEqual(stopNames(receipt), ['UNSUPPORTED_MODEL_REFUSED'])
})

test('F2/RB-4: a fabricated lane-route comparability residual is refused at resolve time (RESIDUAL_FABRICATED_REFUSED)', () => {
  const policy = withComparability(makeDeclaredPolicy(), {
    state: 'unproven',
    residual: 'TOTALLY_MADE_UP',
  })
  const receipt = resolveRoute(policy, makeRequest(), { issued_at: FIXED_ISSUED_AT })
  assert.equal(receipt.status, 'stop')
  assert.equal(receipt.route, null)
  assert.deepEqual(stopNames(receipt), ['RESIDUAL_FABRICATED_REFUSED'])
  // The fabricated name never becomes a name-valued field of the receipt
  // (details may quote what they refuse; echoes stay caller-shaped).
  const emittedNames = [
    ...stopNames(receipt),
    ...receipt.unproven_claims.map((claim) => claim.residual ?? ''),
  ]
  assert.equal(emittedNames.includes('TOTALLY_MADE_UP'), false)
})

test('RB-4: a declared comparability verdict is refused while delta_L is unset ("unproven" is never read as "comparable")', () => {
  const policy = withComparability(makeDeclaredPolicy(), {
    state: 'declared',
    value: 'comparable or higher',
    source: 'synthetic-test-fixture',
  })
  const receipt = resolveRoute(policy, makeRequest(), { issued_at: FIXED_ISSUED_AT })
  assert.equal(receipt.status, 'stop')
  assert.equal(receipt.route, null)
  assert.deepEqual(stopNames(receipt), ['FALLBACK_SUITABILITY_UNPROVEN'])
})

test('F3: an undispatched or lane-mismatched provider_rule.kind refuses — never a silent cheapest-eligible default', () => {
  for (const kind of ['pin-me-later', 'cheapest-eligible']) {
    const policy = withLane(makeDeclaredPolicy(), 'L1', { provider_rule: { kind } })
    const receipt = resolveRoute(
      policy,
      makeRequest({ lane: 'L1', routing_class: 'architecture/risk' }),
      { issued_at: FIXED_ISSUED_AT },
    )
    assert.equal(receipt.status, 'stop', `kind '${kind}' must not fall through to approval`)
    assert.deepEqual(stopNames(receipt), ['ROLE_LANE_MAP_VIOLATION'])
  }
})

test('F4: composed lane-suffixed declaration-slot names never reach a receipt', () => {
  const policy = withLane(makeDeclaredPolicy(), 'L5', {
    provider_rule: {
      kind: 'pinned-provider',
      pinned_provider: { state: 'unavailable', residual: 'L5_PINNED_PROVIDER_UNSET' },
    },
  })
  const receipt = resolveRoute(policy, makeRequest(), { issued_at: FIXED_ISSUED_AT })
  assert.equal(receipt.status, 'stop')
  assert.ok(stopNames(receipt).includes('RESIDUAL_FABRICATED_REFUSED'))
  // The lane↔kind conformance gate also fires; the composed name is never
  // emitted as a name-valued field (details may quote what they refuse).
  assert.ok(stopNames(receipt).includes('ROLE_LANE_MAP_VIOLATION'))
  assert.equal(stopNames(receipt).includes('L5_PINNED_PROVIDER_UNSET'), false)
  assert.equal(
    receipt.unproven_claims.some((claim) => claim.residual === 'L5_PINNED_PROVIDER_UNSET'),
    false,
  )
})

test('RB-1: an independence-violating declared fallback stops the route (INDEPENDENCE_VIOLATION), denied never downgraded (A2)', () => {
  const receipt = resolveRoute(
    makeDeclaredPolicy(),
    makeRequest({ independence_excluded_families: ['z-ai'] }),
    { issued_at: FIXED_ISSUED_AT },
  )
  assert.equal(receipt.status, 'stop')
  assert.equal(receipt.route, null)
  assert.deepEqual(stopNames(receipt), ['INDEPENDENCE_VIOLATION'])
})

test('RB-1: an unrankable declared fallback stops the route naming its refusals (D4 preflight)', () => {
  const policy = withBinding(makeDeclaredPolicy(), 'opencode/glm-5.3-flash', (binding) => ({
    ...binding,
    availability: { state: 'unproven', residual: 'AVAILABILITY_UNVERIFIED' },
  }))
  const receipt = resolveRoute(policy, makeRequest(), { issued_at: FIXED_ISSUED_AT })
  assert.equal(receipt.status, 'stop')
  assert.equal(receipt.route, null)
  assert.deepEqual(stopNames(receipt), ['AVAILABILITY_UNVERIFIED'])
})

test('F5: stop receipts enumerate the lane routes comparability residuals (FALLBACK_SUITABILITY_UNPROVEN)', () => {
  const l1 = resolveRoute(
    loadShippedPolicy(),
    makeRequest({ lane: 'L1', routing_class: 'architecture/risk' }),
    { issued_at: FIXED_ISSUED_AT },
  )
  assert.equal(l1.status, 'stop')
  const names = l1.unproven_claims.map((claim) => claim.residual)
  assert.ok(names.includes('DELTA_L_UNSET'))
  assert.ok(names.includes('FALLBACK_SUITABILITY_UNPROVEN'))
})

test('RB-7: handoff records refuse a binding_id outside the declared primary/fallback pair', () => {
  const receipt = resolveRoute(makeDeclaredPolicy(), makeRequest(), { issued_at: FIXED_ISSUED_AT })

  assert.throws(
    () =>
      buildFallbackHandoff(
        receipt,
        { kind: 'primary-degraded', binding_id: 'opencode/glm-5.3-flash', observed: 'x' },
        { issued_at: FIXED_ISSUED_AT },
      ),
    TypeError,
  )
  assert.throws(
    () =>
      buildFallbackHandoff(
        receipt,
        { kind: 'fallback-failed', binding_id: 'opencode/qwen3.8-flash', observed: 'x' },
        { issued_at: FIXED_ISSUED_AT },
      ),
    TypeError,
  )
  assert.throws(
    () =>
      buildFallbackHandoff(
        receipt,
        { kind: 'cross-provider-attempt', binding_id: 'opencode/glm-5.3-flash', observed: 'x' },
        { issued_at: FIXED_ISSUED_AT },
      ),
    TypeError,
  )
})

// ─── MRC-02 C4 — PiModelContract enrichment ─────────────────────────────────

test("C4: piModelContractFor carries the mapping's explicit provider_local_id/protocol (lockstep)", () => {
  const contract = piModelContractFor({ provider: 'openrouter', model: 'qwen/qwen3.8-flash' })
  assert.deepEqual(contract, {
    registry_key: 'qwen/qwen3.8-flash',
    opencode_id: 'qwen3.8-flash',
    provider_local_id: 'qwen/qwen3.8-flash',
    protocol: 'openai-chat-completions',
    capabilities: ['prose-generation', 'implementation'],
    allowed_lanes: ['builder', 'prose-generation', 'implementation'],
    prohibited_lanes: ['approval', 'merge', 'policy-bypass'],
    authority: 'execution',
  })
})

test('C4: a mapping without explicit values yields null — never derived from registry key or host id', () => {
  const contract = piModelContractFor(
    { provider: 'openrouter', model: 'vendor/model-1' },
    {
      'vendor/model-1': {
        opencodeId: 'host-name-1',
        capabilities: [],
        allowedLanes: [],
        prohibitedLanes: [],
        authority: 'execution',
      },
    },
  )
  assert.notEqual(contract, null)
  assert.equal(contract?.registry_key, 'vendor/model-1')
  assert.equal(contract?.opencode_id, 'host-name-1')
  assert.equal(contract?.provider_local_id, null)
  assert.equal(contract?.protocol, null)
})

test('C4: the enriched identity flows into the route receipt pi_model_contract', () => {
  const receipt = resolveRoute(makeDeclaredPolicy(), makeRequest(), { issued_at: FIXED_ISSUED_AT })
  const contract = receipt.route?.pi_model_contract
  assert.equal(contract?.registry_key, 'qwen/qwen3.8-flash')
  assert.equal(contract?.opencode_id, 'qwen3.8-flash')
  assert.equal(contract?.provider_local_id, 'qwen/qwen3.8-flash')
  assert.equal(contract?.protocol, 'openai-chat-completions')
})
