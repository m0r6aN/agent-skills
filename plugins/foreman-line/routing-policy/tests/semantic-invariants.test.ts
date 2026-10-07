/**
 * AC5: four semantic-invariant test suites, each with a passing fixture (the
 * shipped v0 policy, which satisfies all four at once) and at least one
 * rejecting fixture. The security-override suite additionally covers the
 * Step 0-ratified derived name-guard, and the ceiling suite covers both
 * rejecting cases (missing / zero) per the Step 0 ruling.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'
import { PI_OPENROUTER_ROUTING } from '../src/pi-openrouter.js'
import { KNOWN_FRONTIER_MODELS, validatePolicy } from '../src/validator.js'

const here = dirname(fileURLToPath(import.meta.url))
const policyPath = join(here, '..', 'routing-policy.yaml')
const fixturesDir = join(here, 'fixtures')

function loadYaml(path: string): unknown {
  return parse(readFileSync(path, 'utf8'))
}

const validPolicy = loadYaml(policyPath)

// a. Classification-gates-before-cost -----------------------------------------

test('classification-gates-before-cost: shipped policy passes', () => {
  assert.equal(validatePolicy(validPolicy).valid, true)
})

test('classification-gates-before-cost: shipped policy admits no free, :free, or contributor-tier model anywhere', () => {
  // CUTOVER-P4 (C3.3 re-anchor): the scanned sources are now the binding-level
  // `model` fields (the only home for model ids) and the reviewed registry.
  const doc = validPolicy as {
    candidates: Record<string, { bindings: { model: string }[] }>
  }
  const suspicious = /contributor|:free|-free$/
  for (const [candidate, entry] of Object.entries(doc.candidates)) {
    for (const binding of entry.bindings) {
      assert.ok(
        !suspicious.test(binding.model),
        `candidates.${candidate} admits '${binding.model}', which may train on inputs or be rate-capped`,
      )
    }
  }
  for (const id of KNOWN_FRONTIER_MODELS) {
    assert.ok(!suspicious.test(id), `KNOWN_FRONTIER_MODELS contains '${id}'`)
  }
})

test('classification-gates-before-cost: shipped policy uses OpenRouter vendor/model slugs throughout', () => {
  // CUTOVER-P4 (C3.3 re-anchor): the OpenRouter model vocabulary lives in
  // binding `model` fields; the provider-neutral candidate keys are the other
  // vocabulary and are not slugs by design.
  const doc = validPolicy as {
    candidates: Record<string, { bindings: { provider: string; model: string }[] }>
  }
  const slug = /^[a-z0-9-]+\/[a-z0-9.-]+$/
  const all = [
    ...Object.values(doc.candidates).flatMap((entry) =>
      entry.bindings.filter((b) => b.provider === 'openrouter').map((b) => b.model),
    ),
    ...KNOWN_FRONTIER_MODELS,
  ]
  for (const id of all) {
    assert.match(id, slug, `'${id}' is not a vendor/model OpenRouter slug`)
  }
})
test('classification-gates-before-cost: rejects a public-only model leaking into restricted', () => {
  const doc = loadYaml(join(fixturesDir, 'reject-classification-gate.yaml'))
  const result = validatePolicy(doc)
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((e) => e.includes('data_classification.restricted')))
})

// b. Coordinator/verifier frontier pinning ------------------------------------

test('coordinator/verifier frontier pinning: shipped policy passes', () => {
  assert.equal(validatePolicy(validPolicy).valid, true)
})

test('coordinator/verifier frontier pinning: rejects unpinning the coordinator lane from frontier', () => {
  // CUTOVER-P4 (C3.3 re-anchor): the structural D4 pin lived in the removed
  // `roles` block; the frozen role/lane/authority map carries it now.
  const doc = loadYaml(join(fixturesDir, 'reject-role-pinning.yaml'))
  const result = validatePolicy(doc)
  assert.equal(result.valid, false)
  assert.ok(
    result.errors.some(
      (e) => e.includes('lane_map.L1.frontier_only') && e.includes('ROLE_LANE_MAP_VIOLATION'),
    ),
  )
})

// c. Security override (+ derived name-guard) ---------------------------------

test('security-override: shipped policy passes', () => {
  assert.equal(validatePolicy(validPolicy).valid, true)
})

test('security-override: rejects a non-frontier tier in a security_flavored allowlist', () => {
  const doc = loadYaml(join(fixturesDir, 'reject-security-override.yaml'))
  const result = validatePolicy(doc)
  assert.equal(result.valid, false)
  assert.ok(
    result.errors.some((e) =>
      e.includes('security_flavored but allowlist contains non-frontier tier'),
    ),
  )
})

test('security-override derived guard: rejects an undeclared security-named class', () => {
  const doc = loadYaml(join(fixturesDir, 'reject-security-undeclared.yaml'))
  const result = validatePolicy(doc)
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((e) => e.includes('looks security/audit-flavored by name')))
})

// d. Ceiling presence ----------------------------------------------------------

test('ceiling presence: shipped policy passes', () => {
  assert.equal(validatePolicy(validPolicy).valid, true)
})

test('ceiling presence: rejects a missing ceiling_usd', () => {
  const doc = loadYaml(join(fixturesDir, 'reject-ceiling-missing.yaml'))
  const result = validatePolicy(doc)
  assert.equal(result.valid, false)
})

test('ceiling presence: rejects a zero ceiling_usd', () => {
  const doc = loadYaml(join(fixturesDir, 'reject-ceiling-zero.yaml'))
  const result = validatePolicy(doc)
  assert.equal(result.valid, false)
})

// e. Frontier-tier anchoring (rework Finding 1) ------------------------------

test('frontier-tier anchoring: shipped policy passes unchanged', () => {
  assert.equal(validatePolicy(validPolicy).valid, true)
})

test('frontier-tier anchoring: rejects a selection_order.frontier entry not in KNOWN_FRONTIER_MODELS, naming the offending id', () => {
  // CUTOVER-P4 (C3.3 re-anchor): the check now anchors the ordered source's
  // frontier group through each entry's OpenRouter binding `model`.
  assert.ok(
    !KNOWN_FRONTIER_MODELS.includes('anthropic/claude-haiku-4.5'),
    'fixture assumes anthropic/claude-haiku-4.5 is not a known frontier model',
  )
  const doc = loadYaml(join(fixturesDir, 'reject-frontier-anchor.yaml'))
  const result = validatePolicy(doc)
  assert.equal(result.valid, false)
  assert.ok(
    result.errors.some(
      (e) => e.includes('selection_order.frontier') && e.includes("'anthropic/claude-haiku-4.5'"),
    ),
    `expected an error naming the offending model id, got: ${JSON.stringify(result.errors)}`,
  )
})

test('frontier-tier anchoring: SUPERCHARGE-P1 pins openai/gpt-6-astra in KNOWN_FRONTIER_MODELS', () => {
  assert.ok(
    KNOWN_FRONTIER_MODELS.includes('openai/gpt-6-astra'),
    'SUPERCHARGE-P1 authorizes openai/gpt-6-astra as frontier (verified 2026-09-14); removing it must fail this test',
  )
})

// f. Tier models must be classification-eligible -----------------------------

test('tier eligibility: shipped policy lists every tier model under data_classification.public', () => {
  assert.equal(validatePolicy(validPolicy).valid, true)
})

test('tier eligibility: rejects a selection_order entry absent from data_classification.public, naming the group and id', () => {
  // CUTOVER-P4 (C3.3 re-anchor): invariant (f) now checks each ordered-source
  // entry's OpenRouter binding for public eligibility (binding-level
  // `data_classes`, A5.2).
  assert.ok(
    KNOWN_FRONTIER_MODELS.includes('openai/gpt-5.6-sol'),
    'fixture assumes openai/gpt-5.6-sol is a known frontier model so only invariant (f) fires',
  )
  const doc = loadYaml(join(fixturesDir, 'reject-tier-not-eligible.yaml'))
  const result = validatePolicy(doc)
  assert.equal(result.valid, false)
  assert.equal(
    result.errors.length,
    1,
    `expected exactly one error, got: ${JSON.stringify(result.errors)}`,
  )
  assert.ok(
    result.errors[0]?.includes('selection_order.frontier') &&
      result.errors[0]?.includes("'openai/gpt-5.6-sol'") &&
      result.errors[0]?.includes('data_classification.public'),
    `expected an error naming the group and offending model id, got: ${JSON.stringify(result.errors)}`,
  )
})

// g. Non-public transport requirements -----------------------------------------

test('transport requirements: shipped policy requires data_collection deny + zdr for internal and restricted', () => {
  const doc = validPolicy as {
    data_classification: Record<
      'public' | 'internal' | 'restricted',
      { transport_requirements: { data_collection: string; zdr: boolean } }
    >
  }
  for (const tier of ['internal', 'restricted'] as const) {
    assert.deepEqual(doc.data_classification[tier].transport_requirements, {
      data_collection: 'deny',
      zdr: true,
    })
  }
  assert.equal(validatePolicy(validPolicy).valid, true)
})

test('transport requirements: rejects permissive values on internal/restricted, naming tier and field', () => {
  const doc = loadYaml(join(fixturesDir, 'reject-transport-requirements.yaml'))
  const result = validatePolicy(doc)
  assert.equal(result.valid, false)
  assert.equal(
    result.errors.length,
    3,
    `expected exactly three errors, got: ${JSON.stringify(result.errors)}`,
  )
  const has = (tier: string, field: string) =>
    result.errors.some((e) =>
      e.includes(`data_classification.${tier}.transport_requirements.${field}`),
    )
  assert.ok(has('internal', 'data_collection'))
  assert.ok(has('internal', 'zdr'))
  assert.ok(has('restricted', 'zdr'))
  assert.ok(
    !has('restricted', 'data_collection'),
    'restricted.data_collection is deny and must not be reported',
  )
})

test('transport requirements: missing block is a structural error, not a silent pass', () => {
  const doc = structuredClone(validPolicy) as {
    data_classification: Record<string, Record<string, unknown>>
  }
  delete doc.data_classification.internal?.transport_requirements
  const result = validatePolicy(doc)
  assert.equal(result.valid, false)
  assert.ok(
    result.errors.some(
      (e) => e.includes('/data_classification/internal') && e.includes('transport_requirements'),
    ),
  )
})

// h. Public-only shadow routing ------------------------------------------------
//
// The shipped v0.2 policy declares no shadow routes; the containment
// invariant is exercised against `accept-shadow-route.yaml`, which is the
// shipped policy plus one provider-neutral route.

const SHADOW_ROUTE_KEY = 'example-shadow'
const shadowPolicy = loadYaml(join(fixturesDir, 'accept-shadow-route.yaml'))

test('Pi/OpenRouter config uses the verified base URL and nonempty live model ids', () => {
  assert.equal(PI_OPENROUTER_ROUTING.baseUrl, 'https://openrouter.ai/api/v1')
  assert.ok(PI_OPENROUTER_ROUTING.enabledModels.length > 0)
  for (const id of PI_OPENROUTER_ROUTING.enabledModels) {
    assert.match(id, /^~?[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.:+-]+$/)
  }
})

test('Jev is limited to fast structured routing/classification recommendations', () => {
  // Retirement must not force a disappeared model to remain enabled.
  // The negative contract fixture in pi-openrouter.test.ts always tests this boundary.
  for (const [id, jev] of Object.entries(PI_OPENROUTER_ROUTING.models)) {
    if (!id.startsWith('typesafe/jev')) continue
    assert.deepEqual(jev.capabilities, ['routing', 'classification', 'structured-decision'])
    assert.deepEqual(jev.allowedLanes, ['routing', 'classification'])
    assert.equal(jev.authority, 'recommend-only')
    for (const lane of [
      'prose-generation',
      'implementation',
      'approval',
      'merge',
      'policy-bypass',
    ] as const) {
      assert.ok(jev.prohibitedLanes.includes(lane), `Jev must prohibit ${lane}`)
    }
  }
})

test('Pi/OpenRouter enabled models and capability entries are one-to-one', () => {
  assert.deepEqual(
    Object.keys(PI_OPENROUTER_ROUTING.models).sort(),
    [...PI_OPENROUTER_ROUTING.enabledModels].sort(),
  )
})

test('shadow routes: shipped policy declares none and validates with an empty map', () => {
  const doc = validPolicy as { shadow_routes?: Record<string, unknown> }
  assert.deepEqual(doc.shadow_routes, {})
  assert.equal(validatePolicy(validPolicy).valid, true)
})

test('shadow routes: schema no longer requires any particular route key', () => {
  const doc = structuredClone(shadowPolicy) as {
    shadow_routes: Record<string, Record<string, unknown>>
  }
  const route = doc.shadow_routes[SHADOW_ROUTE_KEY]
  assert.ok(route)
  delete doc.shadow_routes[SHADOW_ROUTE_KEY]
  doc.shadow_routes['renamed-shadow'] = { ...route, adapter_id: 'renamed-shadow' }
  const result = validatePolicy(doc)
  assert.equal(result.valid, true, JSON.stringify(result.errors))
})

test('shadow route: accepting fixture is public-only, candidate-only, and non-authoritative', () => {
  const doc = shadowPolicy as {
    shadow_routes?: Record<string, Record<string, unknown>>
  }
  const route = doc.shadow_routes?.[SHADOW_ROUTE_KEY]

  assert.deepEqual(route, {
    adapter_id: SHADOW_ROUTE_KEY,
    data_classification: 'public',
    allowed_task_types: ['spec_lint', 'evidence_index', 'review_triage'],
    requires_live_discovery: true,
    candidate_only: true,
    authority: 'none',
    tools_granted: [],
    effect_capability: 'none',
    prohibited_roles: ['coordinator', 'verifier'],
  })
  assert.equal(validatePolicy(shadowPolicy).valid, true)
})

test('shadow route: rejects non-public classification, authority, tools, effects, and missing role prohibitions', () => {
  const doc = structuredClone(shadowPolicy) as {
    shadow_routes?: Record<string, Record<string, unknown>>
  }
  const route = doc.shadow_routes?.[SHADOW_ROUTE_KEY]
  assert.ok(route, 'fixture requires the example-shadow route')
  route.data_classification = 'internal'
  route.authority = 'coordinator'
  route.tools_granted = ['filesystem']
  route.effect_capability = 'write'
  route.prohibited_roles = ['coordinator']

  const result = validatePolicy(doc)
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((error) => error.includes('data_classification')))
  assert.ok(result.errors.some((error) => error.includes('authority')))
  assert.ok(result.errors.some((error) => error.includes('tools_granted')))
  assert.ok(result.errors.some((error) => error.includes('effect_capability')))
  assert.ok(result.errors.some((error) => error.includes('prohibited_roles')))
})

test('shadow route: rejects a mismatched adapter, undiscoverable execution, gate-satisfying output, and unsupported task type', () => {
  const doc = structuredClone(shadowPolicy) as {
    shadow_routes?: Record<string, Record<string, unknown>>
  }
  const route = doc.shadow_routes?.[SHADOW_ROUTE_KEY]
  assert.ok(route, 'fixture requires the example-shadow route')
  route.adapter_id = 'another-adapter'
  route.requires_live_discovery = false
  route.candidate_only = false
  route.allowed_task_types = ['dispatch']

  const result = validatePolicy(doc)
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((error) => error.includes('adapter_id')))
  assert.ok(result.errors.some((error) => error.includes('requires_live_discovery')))
  assert.ok(result.errors.some((error) => error.includes('candidate_only')))
  assert.ok(result.errors.some((error) => error.includes('allowed_task_types')))
})
