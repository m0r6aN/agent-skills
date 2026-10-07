/**
 * RCM-P2/RCM-P3/RCM-P4 negative controls — the charter's acceptance evidence:
 * F1/F2 (an image-bearing economy request must never select a text-only
 * binding), "unsatisfiable requirements refuse, never downgrade", D4 ordering
 * (classification → capability → tier order; capability never promotes across
 * classification), D8 thinking-level refusal (never a silent downgrade), OQ5
 * routing-class thinking defaults, D3/OQ2 expertise narrowing semantics
 * (missing = no narrowing; unsatisfiable = refuse; shadow = evidence-only),
 * and DA-1's resolve-time FALLBACK_SELF_REFERENCE mirror.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { resolveRoute } from '../src/pi-resolver.js'
import type { RouteReceipt } from '../src/route-receipt.js'
import type { ExpertiseBinding, ModelBinding, RoutingPolicy } from '../src/types.js'
import { validatePolicy } from '../src/validator.js'
import {
  FIXED_ISSUED_AT,
  makeDeclaredPolicy,
  makeRequest,
  withBinding,
  withLane,
  withLaneRoute,
} from './pi-fixtures.js'

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

function withExpertiseBindings(
  policy: RoutingPolicy,
  entries: readonly ExpertiseBinding[],
): RoutingPolicy {
  return { ...policy, expertise_bindings: entries }
}

function stripPredicate(binding: ModelBinding, field: 'inputs' | 'thinking_levels'): ModelBinding {
  const clone = { ...binding }
  delete clone[field]
  return clone
}

const FIXTURE_EVIDENCE = {
  source: 'synthetic-test-fixture',
  date: '2026-09-27',
  admissibility: 'synthetic negative control — not a merit claim',
}

// ---------------------------------------------------------------------------
// F1/F2: input-modality predicates (D8) — vision-incapable economy picks are
// closed by predicate, not by reordering a list.
// ---------------------------------------------------------------------------

test('F1/F2: an image-bearing economy request never selects a text-only first/cheapest binding (INPUTS_INSUFFICIENT), and picks the vision-capable one', () => {
  const textOnly = withBinding(makeDeclaredPolicy(), 'opencode/qwen3.8-flash', (binding) => ({
    ...binding,
    inputs: { state: 'declared', value: ['text'], source: 'synthetic-test-fixture' },
  }))
  const receipt = resolveRoute(textOnly, makeRequest({ required_inputs: ['text', 'image'] }), {
    issued_at: FIXED_ISSUED_AT,
  })

  assert.equal(receipt.status, 'approved', JSON.stringify(receipt.stops))
  assert.notEqual(receipt.route?.primary.binding_id, 'opencode/qwen3.8-flash')
  assert.equal(receipt.route?.primary.binding_id, 'openrouter/google/gemini-3.8-flash')
  assert.ok(refusalNames(receipt, 'opencode/qwen3.8-flash').includes('INPUTS_INSUFFICIENT'))
  const r2 = evaluationOf(receipt, 'opencode/qwen3.8-flash').ranking_inputs.find(
    (record) => record.input === 'R2',
  )
  assert.equal(r2?.verdict, false)
  assert.ok(r2?.detail.includes('failing predicate'), String(r2?.detail))
})

test('unsatisfiable input-modality requirements refuse with the named predicate — never a silent downgrade', () => {
  let policy = makeDeclaredPolicy()
  for (const id of [
    'opencode/qwen3.8-flash',
    'opencode/glm-5.3-flash',
    'openrouter/google/gemini-3.8-flash',
    'openrouter/anthropic/claude-haiku-4.5',
  ]) {
    policy = withBinding(policy, id, (binding) => ({
      ...binding,
      inputs: { state: 'declared', value: ['text'], source: 'synthetic-test-fixture' },
    }))
  }
  const receipt = resolveRoute(policy, makeRequest({ required_inputs: ['text', 'image'] }), {
    issued_at: FIXED_ISSUED_AT,
  })

  assert.equal(receipt.status, 'stop')
  assert.equal(receipt.route, null)
  assert.ok(stopNames(receipt).includes('INPUTS_INSUFFICIENT'), JSON.stringify(receipt.stops))
})

test('unknown input-modality facts refuse when a modality is required (INPUTS_UNKNOWN) — a model-side fact is never guessed', () => {
  let policy = makeDeclaredPolicy()
  for (const id of [
    'opencode/qwen3.8-flash',
    'opencode/glm-5.3-flash',
    'openrouter/google/gemini-3.8-flash',
    'openrouter/anthropic/claude-haiku-4.5',
  ]) {
    policy = withBinding(policy, id, (binding) => stripPredicate(binding, 'inputs'))
  }
  const receipt = resolveRoute(policy, makeRequest({ required_inputs: ['image'] }), {
    issued_at: FIXED_ISSUED_AT,
  })

  assert.equal(receipt.status, 'stop')
  assert.equal(receipt.route, null)
  assert.ok(stopNames(receipt).includes('INPUTS_UNKNOWN'), JSON.stringify(receipt.stops))
})

test('malformed required_inputs refuses with the named predicate (D8: text | image only)', () => {
  const receipt = resolveRoute(makeDeclaredPolicy(), makeRequest({ required_inputs: [] }), {
    issued_at: FIXED_ISSUED_AT,
  })
  assert.equal(receipt.status, 'stop')
  assert.ok(stopNames(receipt).includes('INPUTS_UNKNOWN'), JSON.stringify(receipt.stops))
})

// ---------------------------------------------------------------------------
// D4 ordering: classification → capability → tier order. A capability-perfect
// binding outside the classification set is never selected.
// ---------------------------------------------------------------------------

test('D4: a capability-perfect binding outside the classification set is not selected — classification gates before capability', () => {
  const policy = withBinding(makeDeclaredPolicy(), 'opencode/qwen3.8-flash', (binding) => ({
    ...binding,
    // Classification-ineligible for `internal`, but every capability perfect.
    data_classes: { state: 'declared', value: ['public'], source: 'synthetic-test-fixture' },
  }))
  const receipt = resolveRoute(policy, makeRequest({ data_class: 'internal' }), {
    issued_at: FIXED_ISSUED_AT,
  })

  assert.equal(receipt.status, 'approved', JSON.stringify(receipt.stops))
  assert.notEqual(receipt.route?.primary.binding_id, 'opencode/qwen3.8-flash')
  const evaluation = evaluationOf(receipt, 'opencode/qwen3.8-flash')
  assert.equal(evaluation.ranking_inputs.find((r) => r.input === 'R1')?.verdict, false)
  assert.equal(evaluation.ranking_inputs.find((r) => r.input === 'R2')?.verdict, true)
  assert.ok(refusalNames(receipt, 'opencode/qwen3.8-flash').includes('DATA_CLASS_INELIGIBLE'))
  const chosen = evaluationOf(receipt, String(receipt.route?.primary.binding_id))
  assert.equal(chosen.ranking_inputs.find((r) => r.input === 'R1')?.verdict, true)
})

// ---------------------------------------------------------------------------
// D8 thinking level + OQ5 routing-class defaults.
// ---------------------------------------------------------------------------

test('D8: a binding lacking the requested thinking level refuses (THINKING_LEVEL_UNSUPPORTED) — never a silent downgrade', () => {
  let policy = makeDeclaredPolicy()
  for (const id of [
    'opencode/qwen3.8-flash',
    'opencode/glm-5.3-flash',
    'openrouter/google/gemini-3.8-flash',
    'openrouter/anthropic/claude-haiku-4.5',
  ]) {
    policy = withBinding(policy, id, (binding) => ({
      ...binding,
      thinking_levels: {
        state: 'declared',
        value: ['minimal'],
        source: 'synthetic-test-fixture',
      },
    }))
  }
  const receipt = resolveRoute(policy, makeRequest({ required_thinking_level: 'high' }), {
    issued_at: FIXED_ISSUED_AT,
  })

  assert.equal(receipt.status, 'stop')
  assert.equal(receipt.route, null)
  assert.ok(
    stopNames(receipt).includes('THINKING_LEVEL_UNSUPPORTED'),
    JSON.stringify(receipt.stops),
  )
  const detail = evaluationOf(receipt, 'opencode/qwen3.8-flash').refusals.find(
    (refusal) => refusal.name === 'THINKING_LEVEL_UNSUPPORTED',
  )?.detail
  assert.ok(detail?.includes("'high'"), String(detail))
})

test('OQ5: legacy thinking-level omission means the routing-class default — boilerplate defaults to minimal and resolves against a minimal-only binding', () => {
  const policy = withBinding(makeDeclaredPolicy(), 'opencode/qwen3.8-flash', (binding) => ({
    ...binding,
    thinking_levels: {
      state: 'declared',
      value: ['minimal'],
      source: 'synthetic-test-fixture',
    },
  }))
  const receipt = resolveRoute(policy, makeRequest(), { issued_at: FIXED_ISSUED_AT })
  assert.equal(receipt.status, 'approved', JSON.stringify(receipt.stops))
  assert.equal(receipt.route?.primary.binding_id, 'opencode/qwen3.8-flash')
})

test('OQ5: an architecture/risk request defaults to high — minimal-only bindings refuse naming the defaulted level', () => {
  let policy = makeDeclaredPolicy()
  for (const id of [
    'opencode/qwen3.8-flash',
    'opencode/glm-5.3-flash',
    'openrouter/google/gemini-3.8-flash',
    'openrouter/anthropic/claude-haiku-4.5',
  ]) {
    policy = withBinding(policy, id, (binding) => ({
      ...binding,
      thinking_levels: {
        state: 'declared',
        value: ['minimal'],
        source: 'synthetic-test-fixture',
      },
    }))
  }
  policy = withLane(policy, 'L5', { routing_classes: ['boilerplate', 'architecture/risk'] })
  const receipt = resolveRoute(
    policy,
    makeRequest({ lane: 'L5', routing_class: 'architecture/risk' }),
    { issued_at: FIXED_ISSUED_AT },
  )

  assert.equal(receipt.status, 'stop')
  assert.ok(
    stopNames(receipt).includes('THINKING_LEVEL_UNSUPPORTED'),
    JSON.stringify(receipt.stops),
  )
  const detail = evaluationOf(receipt, 'opencode/qwen3.8-flash').refusals.find(
    (refusal) => refusal.name === 'THINKING_LEVEL_UNSUPPORTED',
  )?.detail
  assert.ok(detail?.includes("'high'"), String(detail))
})

test('D8 fail-closed: a routing class with no ratified OQ5 default and no explicit level refuses — never an invented default', () => {
  const policy = withLane(makeDeclaredPolicy(), 'L5', {
    routing_classes: ['implementation/complex'],
  })
  const receipt = resolveRoute(
    policy,
    makeRequest({ lane: 'L5', routing_class: 'implementation/complex' }),
    { issued_at: FIXED_ISSUED_AT },
  )
  assert.equal(receipt.status, 'stop')
  assert.ok(
    stopNames(receipt).includes('REPRESENTATION_INCOMPLETE_REFUSED'),
    JSON.stringify(receipt.stops),
  )
})

test('unknown thinking-level support refuses while a level is required (THINKING_LEVELS_UNKNOWN)', () => {
  const policy = withBinding(makeDeclaredPolicy(), 'opencode/qwen3.8-flash', (binding) => ({
    ...binding,
    thinking_levels: { state: 'unknown', residual: 'THINKING_LEVELS_UNKNOWN' },
  }))
  const receipt = resolveRoute(policy, makeRequest(), { issued_at: FIXED_ISSUED_AT })
  assert.ok(refusalNames(receipt, 'opencode/qwen3.8-flash').includes('THINKING_LEVELS_UNKNOWN'))
})

// ---------------------------------------------------------------------------
// D3/OQ2 expertise narrowing semantics.
// ---------------------------------------------------------------------------

test('D3: a missing expertise binding means no narrowing — the request resolves normally with zero EXPERTISE_NARROWED_OUT records', () => {
  const receipt = resolveRoute(makeDeclaredPolicy(), makeRequest({ expertise: 'legal' }), {
    issued_at: FIXED_ISSUED_AT,
  })
  assert.equal(receipt.status, 'approved', JSON.stringify(receipt.stops))
  for (const evaluation of receipt.evaluations) {
    assert.ok(!refusalNames(receipt, evaluation.binding_id).includes('EXPERTISE_NARROWED_OUT'))
  }
})

test('D3/OQ2: a non-shadow expertise binding narrows within the eligible set — the bound model wins over the cheaper one, and the narrowed-out binding is recorded', () => {
  // The narrowed set covers the whole chosen route (primary gemini and its
  // declared fallback haiku) — a binding that left the declared fallback
  // outside would refuse rather than silently fail over (next test).
  const policy = withExpertiseBindings(makeDeclaredPolicy(), [
    {
      routing_class: 'boilerplate',
      expertise: 'engineering',
      shadow: false,
      bindings: [
        { type: 'binding', ref: 'openrouter/google/gemini-3.8-flash' },
        { type: 'binding', ref: 'openrouter/anthropic/claude-haiku-4.5' },
      ],
      evidence: FIXTURE_EVIDENCE,
    },
  ])
  const receipt = resolveRoute(policy, makeRequest({ expertise: 'engineering' }), {
    issued_at: FIXED_ISSUED_AT,
  })

  assert.equal(receipt.status, 'approved', JSON.stringify(receipt.stops))
  // The cheaper `opencode/qwen3.8-flash` would win un-narrowed (it does in the
  // tests above) — narrowing filters it out without reordering anything.
  assert.equal(receipt.route?.primary.binding_id, 'openrouter/google/gemini-3.8-flash')
  assert.ok(refusalNames(receipt, 'opencode/qwen3.8-flash').includes('EXPERTISE_NARROWED_OUT'))
})

test('D3: a declared fallback outside the expertise binding refuses the route — never a silent fail-over past the binding', () => {
  const policy = withExpertiseBindings(makeDeclaredPolicy(), [
    {
      routing_class: 'boilerplate',
      expertise: 'engineering',
      shadow: false,
      bindings: [{ type: 'binding', ref: 'openrouter/google/gemini-3.8-flash' }],
      evidence: FIXTURE_EVIDENCE,
    },
  ])
  const receipt = resolveRoute(policy, makeRequest({ expertise: 'engineering' }), {
    issued_at: FIXED_ISSUED_AT,
  })

  assert.equal(receipt.status, 'stop')
  assert.equal(receipt.route, null)
  assert.ok(stopNames(receipt).includes('EXPERTISE_NARROWED_OUT'), JSON.stringify(receipt.stops))
})

test('D3: an unsatisfiable expertise binding refuses by name and never falls back to the un-narrowed set', () => {
  const policy = withExpertiseBindings(
    withBinding(makeDeclaredPolicy(), 'opencode/qwen3.8-flash', (binding) => ({
      ...binding,
      availability: { state: 'unproven', residual: 'AVAILABILITY_UNVERIFIED' },
    })),
    [
      {
        routing_class: 'boilerplate',
        expertise: 'engineering',
        shadow: false,
        bindings: [{ type: 'binding', ref: 'opencode/qwen3.8-flash' }],
        evidence: FIXTURE_EVIDENCE,
      },
    ],
  )
  const receipt = resolveRoute(policy, makeRequest({ expertise: 'engineering' }), {
    issued_at: FIXED_ISSUED_AT,
  })

  assert.equal(receipt.status, 'stop')
  assert.equal(receipt.route, null, 'the un-narrowed gemini must never be silently selected')
  assert.ok(
    stopNames(receipt).includes('EXPERTISE_BINDING_UNSATISFIABLE'),
    JSON.stringify(receipt.stops),
  )
})

test('RCM-P9: a shadow expertise binding is evidence-only — it never narrows and never routes', () => {
  const policy = withExpertiseBindings(makeDeclaredPolicy(), [
    {
      routing_class: 'boilerplate',
      expertise: 'engineering',
      shadow: true,
      bindings: [{ type: 'binding', ref: 'openrouter/google/gemini-3.8-flash' }],
      evidence: FIXTURE_EVIDENCE,
    },
  ])
  const receipt = resolveRoute(policy, makeRequest({ expertise: 'engineering' }), {
    issued_at: FIXED_ISSUED_AT,
  })

  assert.equal(receipt.status, 'approved', JSON.stringify(receipt.stops))
  assert.equal(receipt.route?.primary.binding_id, 'opencode/qwen3.8-flash')
  for (const evaluation of receipt.evaluations) {
    assert.ok(!refusalNames(receipt, evaluation.binding_id).includes('EXPERTISE_NARROWED_OUT'))
  }
})

test('an expertise value outside the closed vocabulary is refused by name — never silently treated as "no narrowing" (D7)', () => {
  const receipt = resolveRoute(
    makeDeclaredPolicy(),
    makeRequest({ expertise: 'divination' as never }),
    { issued_at: FIXED_ISSUED_AT },
  )
  assert.equal(receipt.status, 'stop')
  assert.ok(
    stopNames(receipt).includes('EXPERTISE_BINDING_UNSATISFIABLE'),
    JSON.stringify(receipt.stops),
  )
})

test('resolve-time mirror: a dangling expertise ref stops with EXPERTISE_BINDING_DANGLING_REFERENCE (defense-in-depth over the validator)', () => {
  const policy = withExpertiseBindings(makeDeclaredPolicy(), [
    {
      routing_class: 'boilerplate',
      expertise: 'engineering',
      shadow: false,
      bindings: [{ type: 'binding', ref: 'opencode/never-declared' }],
      evidence: FIXTURE_EVIDENCE,
    },
  ])
  const receipt = resolveRoute(policy, makeRequest({ expertise: 'engineering' }), {
    issued_at: FIXED_ISSUED_AT,
  })
  assert.equal(receipt.status, 'stop')
  assert.ok(
    stopNames(receipt).includes('EXPERTISE_BINDING_DANGLING_REFERENCE'),
    JSON.stringify(receipt.stops),
  )
})

// ---------------------------------------------------------------------------
// DA-1: resolve-time mirror of the validator's FALLBACK_SELF_REFERENCE.
// ---------------------------------------------------------------------------

test('DA-1: a self-referential fallback pair (candidate ref resolving to its own primary) refuses at resolve time — FALLBACK_SELF_REFERENCE', () => {
  const policy = withLaneRoute(makeDeclaredPolicy(), 'L5', 'opencode', (route) => ({
    ...route,
    // Exactly the DA-1 repro: a candidate-typed fallback ref that resolves to
    // the route's own primary binding.
    fallback: { type: 'candidate', ref: 'qwen3.8-flash' },
  }))
  const receipt = resolveRoute(policy, makeRequest(), { issued_at: FIXED_ISSUED_AT })

  assert.equal(receipt.status, 'stop')
  assert.equal(receipt.route, null)
  assert.ok(stopNames(receipt).includes('FALLBACK_SELF_REFERENCE'), JSON.stringify(receipt.stops))
})

test('DA-1: a binding-typed self-fallback pair also refuses at resolve time', () => {
  const policy = withLaneRoute(makeDeclaredPolicy(), 'L5', 'opencode', (route) => ({
    ...route,
    fallback: { type: 'binding', ref: 'opencode/qwen3.8-flash' },
  }))
  const receipt = resolveRoute(policy, makeRequest(), { issued_at: FIXED_ISSUED_AT })

  assert.equal(receipt.status, 'stop')
  assert.ok(stopNames(receipt).includes('FALLBACK_SELF_REFERENCE'), JSON.stringify(receipt.stops))
})

// ---------------------------------------------------------------------------
// RCM-P3 validator invariants for the expertise-binding block.
// ---------------------------------------------------------------------------

test('validator: a dangling expertise ref is a static refusal (EXPERTISE_BINDING_DANGLING_REFERENCE)', () => {
  const policy = withExpertiseBindings(makeDeclaredPolicy(), [
    {
      routing_class: 'boilerplate',
      expertise: 'engineering',
      shadow: false,
      bindings: [
        { type: 'binding', ref: 'never-declared' },
        { type: 'candidate', ref: 'never-a-candidate' },
      ],
      evidence: FIXTURE_EVIDENCE,
    },
  ])
  const result = validatePolicy(policy)
  assert.equal(result.valid, false)
  assert.ok(
    result.errors.some((error) => error.includes('EXPERTISE_BINDING_DANGLING_REFERENCE')),
    JSON.stringify(result.errors),
  )
})

test('validator: duplicate non-shadow (routing_class, expertise) keys refuse — narrowing must be unambiguous', () => {
  const entry: ExpertiseBinding = {
    routing_class: 'boilerplate',
    expertise: 'engineering',
    shadow: false,
    bindings: [{ type: 'binding', ref: 'opencode/qwen3.8-flash' }],
    evidence: FIXTURE_EVIDENCE,
  }
  const result = validatePolicy(withExpertiseBindings(makeDeclaredPolicy(), [entry, entry]))
  assert.equal(result.valid, false)
  assert.ok(
    result.errors.some((error) => error.includes('REPRESENTATION_INCOMPLETE_REFUSED')),
    JSON.stringify(result.errors),
  )
})

test('validator: shadow entries may repeat a key (evidence-only, never ambiguous) and a well-formed block validates clean', () => {
  const shadow: ExpertiseBinding = {
    routing_class: 'boilerplate',
    expertise: 'engineering',
    shadow: true,
    bindings: [{ type: 'binding', ref: 'opencode/qwen3.8-flash' }],
    evidence: FIXTURE_EVIDENCE,
  }
  const nonShadow: ExpertiseBinding = {
    routing_class: 'boilerplate',
    expertise: 'engineering',
    shadow: false,
    bindings: [{ type: 'binding', ref: 'opencode/qwen3.8-flash' }],
    evidence: FIXTURE_EVIDENCE,
  }
  const result = validatePolicy(
    withExpertiseBindings(makeDeclaredPolicy(), [shadow, shadow, nonShadow]),
  )
  assert.deepEqual(result.errors, [], JSON.stringify(result.errors))
})

// ---------------------------------------------------------------------------
// C1 (MRC-03): named F1/F2 negative controls — the charter's literal defect
// models (`charter.md:114-115`, row wording `:226`), closed by predicate, not
// by reordering a list. Each named binding is a synthetic fixture fact
// (FIXTURE_EVIDENCE convention) carrying a registry-valid `model` key — the
// shipped Pi execution-plane key, matched by `piModelContractFor` (provider
// 'openrouter' matches the registry key) — so the modality predicate is the
// ONLY thing that can refuse the named model. An invalid key would refuse at
// the registry gate (UNSUPPORTED_MODEL_REFUSED) and make the non-selection
// assertions pass vacuously; the refusal NAME is asserted, never bare
// non-selection.
// ---------------------------------------------------------------------------

interface NamedDefect {
  readonly id: string
  readonly model: string
  readonly family: string
  readonly cost: { readonly input: number; readonly output: number }
}

/**
 * C1 fixture seam (test-local; pi-fixtures.ts stays untouched): inserts the
 * charter's named defect binding — text-only `inputs` declared fact — as a
 * logical candidate and retargets the lane's named provider route's PRIMARY
 * ref at it, so the defect sits in the first/cheapest selectable position and
 * would be picked but for the modality predicate.
 */
function withNamedDefectPrimary(
  policy: RoutingPolicy,
  lane: string,
  routeProvider: string,
  defect: NamedDefect,
): RoutingPolicy {
  const clone = structuredClone(policy) as RoutingPolicy & {
    candidates: Record<string, { bindings: ModelBinding[] }>
  }
  let template: ModelBinding | undefined
  for (const candidate of Object.values(clone.candidates)) {
    template = candidate.bindings.find(
      (binding) => binding.id === 'openrouter/google/gemini-3.8-flash',
    )
    if (template !== undefined) break
  }
  assert.ok(template, "expected fixture template binding 'openrouter/google/gemini-3.8-flash'")
  clone.candidates[defect.id] = {
    family: defect.family,
    bindings: [
      {
        ...template,
        id: defect.id,
        model: defect.model,
        family: defect.family,
        inputs: { state: 'declared', value: ['text'], source: 'synthetic-test-fixture' },
        cost: {
          state: 'declared',
          value: { unit: 'usd_per_mtok', input: defect.cost.input, output: defect.cost.output },
          source: 'synthetic-test-fixture',
        },
      },
    ],
  }
  return withLaneRoute(clone, lane, routeProvider, (route) => ({
    ...route,
    primary: { type: 'binding', ref: defect.id },
  }))
}

test('F1 named control: nvidia/nemotron-3.5-lightning — an image-bearing boilerplate request never selects the named text-only first/cheapest economy pick (INPUTS_INSUFFICIENT); the selected alternative is vision-capable and classification-eligible', () => {
  // Charter F1 (`charter.md:114`): `nvidia/nemotron-3.5-lightning` is
  // `input: ["text"]` and deliberately first in the `economy` tier — the
  // charter's tier placement MATCHES this control (economy/first). The named
  // binding goes into L5 (the economy lane — also the only lane whose provider
  // rule resolves; L1-L4 fail closed on their unset a54 slots) as the
  // first/cheapest selectable primary. Its `model` is the shipped execution-plane registry key
  // `nvidia/nemotron-3.5-lightning:free` (`pi-openrouter.ts`) — note the
  // `:free` suffix asymmetry vs the charter's literal id; the key is what
  // `piModelContractFor` matches, so the registry gate passes and the modality
  // predicate is the sole refusal. The cost is the policy's annotated
  // (routing-policy.yaml:193) economy-tier figure used as a synthetic fixture
  // fact (not a price claim — F3 drift is out of scope) so the defect is
  // genuinely first-eligible.
  const named = 'nvidia/nemotron-3.5-lightning'
  const policy = withNamedDefectPrimary(makeDeclaredPolicy(), 'L5', 'openrouter', {
    id: named,
    model: 'nvidia/nemotron-3.5-lightning:free',
    family: 'nvidia',
    cost: { input: 0.065, output: 0.18 },
  })
  const request = makeRequest({ required_inputs: ['text', 'image'] })
  const receipt = resolveRoute(policy, request, { issued_at: FIXED_ISSUED_AT })

  // (i) the named defect model is never selected, in either route position.
  assert.equal(receipt.status, 'approved', JSON.stringify(receipt.stops))
  assert.notEqual(receipt.route?.primary.binding_id, named)
  assert.notEqual(receipt.route?.fallback.binding_id, named)

  // (ii) the failing predicate is named on the binding: INPUTS_INSUFFICIENT is
  // its ONLY refusal (registry-valid, everything else declared) and its R2
  // ranking record is false, naming the failing predicate (exit criterion 4).
  assert.deepEqual(refusalNames(receipt, named), ['INPUTS_INSUFFICIENT'])
  const namedEvaluation = evaluationOf(receipt, named)
  const namedR2 = namedEvaluation.ranking_inputs.find((record) => record.input === 'R2')
  assert.equal(namedR2?.verdict, false)
  assert.ok(namedR2?.detail.includes('failing predicate'), String(namedR2?.detail))
  const namedRefusal = namedEvaluation.refusals.find(
    (refusal) => refusal.name === 'INPUTS_INSUFFICIENT',
  )
  assert.ok(namedRefusal?.detail.includes('input modality [image]'), String(namedRefusal?.detail))

  // (iii) when the receipt approves, the selected binding is vision-capable
  // and classification-eligible: R1 verdict true and its declared inputs
  // include `image` (R2 true over required ['text','image']).
  const selected = evaluationOf(receipt, String(receipt.route?.primary.binding_id))
  const selectedR1 = selected.ranking_inputs.find((record) => record.input === 'R1')
  const selectedR2 = selected.ranking_inputs.find((record) => record.input === 'R2')
  assert.equal(selectedR1?.verdict, true)
  assert.equal(selectedR2?.verdict, true)
  assert.ok(selectedR2?.evidence.includes('inputs [text|image]'), String(selectedR2?.evidence))

  // (iii, stop branch) when no vision-capable primary-role binding remains in
  // the selection pool (fallback-role bindings never compete), the route stops
  // naming INPUTS_INSUFFICIENT — never a silent downgrade.
  const allTextOnly = withBinding(policy, 'opencode/qwen3.8-flash', (binding) => ({
    ...binding,
    inputs: { state: 'declared', value: ['text'], source: 'synthetic-test-fixture' },
  }))
  const stopped = resolveRoute(allTextOnly, request, { issued_at: FIXED_ISSUED_AT })
  assert.equal(stopped.status, 'stop')
  assert.equal(stopped.route, null)
  assert.ok(stopNames(stopped).includes('INPUTS_INSUFFICIENT'), JSON.stringify(stopped.stops))

  // (iv) falsifiability pin: with honest image facts on the SAME named binding
  // it IS the selection — first/cheapest placement and registry validity are
  // real, so the modality predicate is the only thing standing between the
  // request and the named defect model. Re-introducing the defect class
  // (removing the modality predicate, ignoring `inputs` facts, or 'fixing'
  // selection by reordering) turns this control red.
  const honestFacts = withBinding(policy, named, (binding) => ({
    ...binding,
    inputs: { state: 'declared', value: ['text', 'image'], source: 'synthetic-test-fixture' },
  }))
  const defectSelected = resolveRoute(honestFacts, request, { issued_at: FIXED_ISSUED_AT })
  assert.equal(defectSelected.status, 'approved', JSON.stringify(defectSelected.stops))
  assert.equal(defectSelected.route?.primary.binding_id, named)
})

test('F2 named control: z-ai/glm-5.3 — an image-bearing boilerplate request never selects the named text-only first/cheapest pick (INPUTS_INSUFFICIENT); the selected alternative is vision-capable and classification-eligible', () => {
  // Charter F2 (`charter.md:115`): same class of defect in `standard` —
  // `z-ai/glm-5.3` is `input: ["text"]`, position 4. Charter-fidelity note
  // (recorded scope deviation): the charter's standard-tier placement is
  // UNOBSERVABLE at resolve time — L4's frozen `declared-preference` provider
  // rule fail-closes every branch (a54 item 3, `pi-resolver.ts`
  // providerRuleGate) and only L5's `cheapest-eligible` rule proceeds — so the
  // named defect is exercised in the resolvable economy lane as its own
  // independently falsifiable control. The charter text also says position 4;
  // this control places the named binding in the first/cheapest selectable
  // position instead — refusal at position 1 subsumes the position-4 wording
  // and strengthens the control (never weaken the first-position placement).
  // Its `model` `z-ai/glm-5.3` is the shipped execution-plane registry key
  // (`pi-openrouter.ts`; opencodeId `glm-5.3`) — registry-valid so the
  // modality predicate is the sole refusal. The cost is a synthetic fixture
  // fact load-bearing only for the first/cheapest placement (the policy's
  // annotated (routing-policy.yaml:181) $1.40/$4.40 would not be cheapest in
  // the economy lane's cost-ordered selection) — not a price claim.
  const named = 'z-ai/glm-5.3'
  const policy = withNamedDefectPrimary(makeDeclaredPolicy(), 'L5', 'openrouter', {
    id: named,
    model: 'z-ai/glm-5.3',
    family: 'z-ai',
    cost: { input: 0.01, output: 0.01 },
  })
  const request = makeRequest({ required_inputs: ['text', 'image'] })
  const receipt = resolveRoute(policy, request, { issued_at: FIXED_ISSUED_AT })

  // (i) the named defect model is never selected, in either route position.
  assert.equal(receipt.status, 'approved', JSON.stringify(receipt.stops))
  assert.notEqual(receipt.route?.primary.binding_id, named)
  assert.notEqual(receipt.route?.fallback.binding_id, named)

  // (ii) the failing predicate is named on the binding: INPUTS_INSUFFICIENT is
  // its ONLY refusal (registry-valid, everything else declared) and its R2
  // ranking record is false, naming the failing predicate (exit criterion 4).
  assert.deepEqual(refusalNames(receipt, named), ['INPUTS_INSUFFICIENT'])
  const namedEvaluation = evaluationOf(receipt, named)
  const namedR2 = namedEvaluation.ranking_inputs.find((record) => record.input === 'R2')
  assert.equal(namedR2?.verdict, false)
  assert.ok(namedR2?.detail.includes('failing predicate'), String(namedR2?.detail))
  const namedRefusal = namedEvaluation.refusals.find(
    (refusal) => refusal.name === 'INPUTS_INSUFFICIENT',
  )
  assert.ok(namedRefusal?.detail.includes('input modality [image]'), String(namedRefusal?.detail))

  // (iii) when the receipt approves, the selected binding is vision-capable
  // and classification-eligible: R1 verdict true and its declared inputs
  // include `image` (R2 true over required ['text','image']).
  const selected = evaluationOf(receipt, String(receipt.route?.primary.binding_id))
  const selectedR1 = selected.ranking_inputs.find((record) => record.input === 'R1')
  const selectedR2 = selected.ranking_inputs.find((record) => record.input === 'R2')
  assert.equal(selectedR1?.verdict, true)
  assert.equal(selectedR2?.verdict, true)
  assert.ok(selectedR2?.evidence.includes('inputs [text|image]'), String(selectedR2?.evidence))

  // (iii, stop branch) when no vision-capable primary-role binding remains in
  // the selection pool (fallback-role bindings never compete), the route stops
  // naming INPUTS_INSUFFICIENT — never a silent downgrade.
  const allTextOnly = withBinding(policy, 'opencode/qwen3.8-flash', (binding) => ({
    ...binding,
    inputs: { state: 'declared', value: ['text'], source: 'synthetic-test-fixture' },
  }))
  const stopped = resolveRoute(allTextOnly, request, { issued_at: FIXED_ISSUED_AT })
  assert.equal(stopped.status, 'stop')
  assert.equal(stopped.route, null)
  assert.ok(stopNames(stopped).includes('INPUTS_INSUFFICIENT'), JSON.stringify(stopped.stops))

  // (iv) falsifiability pin: with honest image facts on the SAME named binding
  // it IS the selection — first/cheapest placement and registry validity are
  // real, so the modality predicate is the only thing standing between the
  // request and the named defect model. Re-introducing the defect class
  // (removing the modality predicate, ignoring `inputs` facts, or 'fixing'
  // selection by reordering) turns this control red.
  const honestFacts = withBinding(policy, named, (binding) => ({
    ...binding,
    inputs: { state: 'declared', value: ['text', 'image'], source: 'synthetic-test-fixture' },
  }))
  const defectSelected = resolveRoute(honestFacts, request, { issued_at: FIXED_ISSUED_AT })
  assert.equal(defectSelected.status, 'approved', JSON.stringify(defectSelected.stops))
  assert.equal(defectSelected.route?.primary.binding_id, named)
})
