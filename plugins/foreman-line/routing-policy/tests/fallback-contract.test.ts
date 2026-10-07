/**
 * PMC-P1 — provider-neutral fallback contract (charter N1–N5, A3):
 * acceptance of the shipped contract, the frozen role/lane/authority map with
 * its fail-closed residuals, the refusal vocabulary (suitability rubric §7),
 * and one negative control per refusal path.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'
import {
  CONTRACT_REFUSALS,
  CONTRACT_RESIDUALS,
  KNOWN_FRONTIER_BINDINGS,
  KNOWN_FRONTIER_MODELS,
  RESOLVER_HOLDS,
  RESOLVER_REFUSALS,
  validatePolicy,
} from '../src/index.js'

const here = dirname(fileURLToPath(import.meta.url))
const policyPath = join(here, '..', 'routing-policy.yaml')

const validPolicy = parse(readFileSync(policyPath, 'utf8'))

interface MutableBinding {
  id: string
  model: string
  provider: string
  identity: Record<string, unknown>
  capabilities: Record<string, string>
  data_classes: Record<string, unknown>
  cost: Record<string, unknown>
  availability: Record<string, unknown>
  [key: string]: unknown
}

interface MutableRoute {
  lane: string
  provider: string
  primary: { type: string; ref: string }
  fallback?: { type: string; ref: string }
  comparability: Record<string, unknown>
  [key: string]: unknown
}

interface MutableLaneMap {
  L1: Record<string, unknown>
  L2: Record<string, unknown>
  L3: Record<string, unknown>
  L4: Record<string, unknown>
  L5: Record<string, unknown>
  L6: Record<string, unknown>
  [key: string]: Record<string, unknown>
}

interface MutableDoc {
  [key: string]: unknown
  candidates: Record<string, { bindings: MutableBinding[] }>
  lane_routes: MutableRoute[]
  lane_map: MutableLaneMap
  ranking_contract: Record<string, unknown>
}

function docWith(mutate: (doc: MutableDoc) => void): unknown {
  const doc = structuredClone(validPolicy) as MutableDoc
  mutate(doc)
  return doc
}

function assertRefusal(doc: unknown, token: string): void {
  const result = validatePolicy(doc)
  assert.equal(result.valid, false, `expected '${token}' to refuse the document`)
  assert.ok(
    result.errors.some((error) => error.includes(token)),
    `expected an error carrying '${token}', got: ${JSON.stringify(result.errors)}`,
  )
}

function routeOf(doc: MutableDoc, lane: string, provider: string): MutableRoute {
  const found = doc.lane_routes.find((route) => route.lane === lane && route.provider === provider)
  assert.ok(found, `fixture requires a ${lane}/${provider} route`)
  return found
}

function bindingOf(doc: MutableDoc, id: string): MutableBinding {
  for (const candidate of Object.values(doc.candidates)) {
    for (const binding of candidate.bindings) {
      if (binding.id === id) return binding
    }
  }
  throw new Error(`fixture requires binding '${id}'`)
}

// Acceptance --------------------------------------------------------------

test('shipped policy: the provider-neutral fallback contract validates with zero errors', () => {
  assert.deepEqual(validatePolicy(validPolicy).errors, [])
})

test('shipped policy: every lane route carries exactly one typed fallback and unproven comparability', () => {
  const doc = validPolicy as unknown as MutableDoc
  // 10 original (L1-L5 x opencode/openrouter) + 3 anthropic + 3 opencode-go
  // + 2 fireworks (Amendment 06 + the 2026-10-07 probe).
  assert.equal(doc.lane_routes.length, 18)
  for (const route of doc.lane_routes) {
    assert.equal(typeof route.fallback?.ref, 'string')
    assert.ok(route.primary.type === 'binding' || route.primary.type === 'candidate')
    assert.ok(route.fallback?.type === 'binding' || route.fallback?.type === 'candidate')
    assert.deepEqual(route.comparability, {
      state: 'unproven',
      residual: 'FALLBACK_SUITABILITY_UNPROVEN',
    })
  }
})

test('shipped policy: H-B7 hold is encoded; H-OPUS is released by probe §7', () => {
  const doc = validPolicy as unknown as MutableDoc
  // H-OPUS RELEASED (2026-10-07, probe §7.4): the on-host models-store
  // capture establishes the opencode/claude-opus-5-5 identity first-party,
  // superseding the amendment-03 owner attestation. The attestation and its
  // OWNER_ATTESTED_PENDING_LIVE_AVAILABILITY hold must not come back.
  const opus = bindingOf(doc, 'opencode/claude-opus-5-5')
  assert.equal(opus.identity?.state, 'resolved')
  const b7 = bindingOf(doc, 'opencode/qwen3.8-flash')
  assert.equal(b7.identity?.state, 'zero-match')
  assert.equal(b7.identity?.refusal, 'AC2A_ZERO_MATCH')
  assert.deepEqual(b7.identity?.diagnostics, ['AC2A_WRONG_PROVIDER', 'AC2A_PREFIX_ALIAS_REFUSED'])
})

// Frozen role/lane/authority map (A5.4) -------------------------------------

test('frozen map: six lanes with typed-unavailable pin, preference, and delta_L residuals', () => {
  const doc = validPolicy as unknown as MutableDoc
  const laneMap = doc.lane_map
  assert.deepEqual(Object.keys(laneMap).sort(), ['L1', 'L2', 'L3', 'L4', 'L5', 'L6'])
  for (const lane of ['L1', 'L2', 'L3', 'L4', 'L5', 'L6']) {
    assert.deepEqual(laneMap[lane]?.quality_tolerance, {
      state: 'unavailable',
      residual: 'DELTA_L_UNSET',
    })
  }
  assert.deepEqual(laneMap.L1.provider_rule, {
    kind: 'pinned-provider',
    pinned_provider: { state: 'unavailable', residual: 'L1_PINNED_PROVIDER_UNSET' },
  })
  assert.deepEqual(laneMap.L2.provider_rule, {
    kind: 'pinned-provider',
    pinned_provider: { state: 'unavailable', residual: 'L2_PINNED_PROVIDER_UNSET' },
  })
  assert.deepEqual(laneMap.L3.provider_rule, {
    kind: 'declared-preference',
    preference: { state: 'unavailable', residual: 'L3_PROVIDER_PREFERENCE_UNSET' },
  })
  assert.deepEqual(laneMap.L4.provider_rule, {
    kind: 'declared-preference',
    preference: { state: 'unavailable', residual: 'L4_PROVIDER_PREFERENCE_UNSET' },
  })
  assert.deepEqual(laneMap.L5.provider_rule, { kind: 'cheapest-eligible' })
  assert.equal(laneMap.L1.frontier_only, true)
  assert.equal(laneMap.L2.frontier_only, true)
})

test('frozen map: L6 is refused/disabled with the rubric re-enablement list and no route', () => {
  const doc = validPolicy as unknown as MutableDoc
  const l6 = doc.lane_map.L6
  assert.equal(l6.status, 'disabled-refused')
  assert.equal(l6.re_enablement, 'ratified-amendment-required')
  assert.deepEqual(l6.re_enablement_candidates, [
    'opencode/qwen3.8-flash',
    'opencode/glm-5.3-flash',
  ])
  assert.deepEqual(l6.provider_rule, { kind: 'none', refusal: 'LANE_DISABLED_REFUSED' })
  for (const route of doc.lane_routes) {
    assert.notEqual(route.lane, 'L6', 'no route may be declared for the disabled L6 lane (M2)')
  }
})

test('M2 reconciliation: the policy file and its fixtures encode no typesafe/jev identity', () => {
  const raw = readFileSync(policyPath, 'utf8')
  assert.ok(!raw.includes('typesafe/jev'), 'routing-policy.yaml must not encode Jev (M2)')
  assert.ok(
    !JSON.stringify(validPolicy).includes('typesafe/jev'),
    'parsed policy must not encode Jev (M2); the lane is refused/disabled in lane_map.L6',
  )
})

// Frontier registry (A7 / Amendment 03) ------------------------------------

test('frontier registry pins the Amendment 03 Opus identities in both spellings', () => {
  assert.ok(KNOWN_FRONTIER_MODELS.includes('anthropic/claude-opus-5.5'))
  assert.ok(!KNOWN_FRONTIER_MODELS.includes('anthropic/claude-opus-5'), 'superseded identity')
  assert.ok(KNOWN_FRONTIER_BINDINGS.includes('opencode/claude-opus-5-5'))
  assert.ok(KNOWN_FRONTIER_BINDINGS.includes('openrouter/anthropic/claude-opus-5.5'))
  assert.ok(KNOWN_FRONTIER_BINDINGS.includes('opencode/gpt-6-astra'))
  assert.ok(KNOWN_FRONTIER_BINDINGS.includes('openrouter/openai/gpt-6-astra'))
})

test('Amendment 08 reconciliation: the policy file and its fixtures encode no gpt-5.6-sol identity', () => {
  const raw = readFileSync(policyPath, 'utf8')
  assert.ok(
    !raw.includes('gpt-5.6-sol'),
    'routing-policy.yaml must not encode gpt-5.6-sol (Amendment 08 removal)',
  )
  assert.ok(
    !JSON.stringify(validPolicy).includes('gpt-5.6-sol'),
    'parsed policy must not encode gpt-5.6-sol; gpt-6.1-sol is the preferred-verifier successor',
  )
  assert.ok(!KNOWN_FRONTIER_MODELS.includes('openai/gpt-5.6-sol'), 'registry struck')
  assert.ok(KNOWN_FRONTIER_MODELS.includes('openai/gpt-6.1-sol'), 'successor admitted')
})

test('frontier registry admits the Amendment 07 opencode re-pinning bindings', () => {
  assert.ok(KNOWN_FRONTIER_BINDINGS.includes('opencode/gpt-6.1-sol'))
  assert.ok(KNOWN_FRONTIER_BINDINGS.includes('opencode/claude-sonnet-5-5'))
  assert.ok(KNOWN_FRONTIER_BINDINGS.includes('opencode/gpt-6-luna'))
  // Amendment 07 itself added no KNOWN_FRONTIER_MODELS entry; Amendment 08
  // later admitted openai/gpt-6.1-sol as the preferred-verifier successor.
  assert.ok(KNOWN_FRONTIER_MODELS.includes('openai/gpt-6.1-sol'), 'admitted by Amendment 08')
})

test('Amendment 07: opencode L1/L2 routes encode the owner-directed pairs', () => {
  const doc = validPolicy as unknown as MutableDoc
  const route = (lane: string) =>
    doc.lane_routes.find((r) => r.lane === lane && r.provider === 'opencode')
  const l1 = route('L1')
  assert.equal(l1?.primary.ref, 'opencode/gpt-6.1-sol')
  assert.equal(l1?.fallback?.ref, 'opencode/claude-opus-5-5')
  const l2 = route('L2')
  assert.equal(l2?.primary.ref, 'opencode/claude-sonnet-5-5')
  assert.equal(l2?.fallback?.ref, 'opencode/gpt-6-luna')
})

test('frontier lanes route only reviewed frontier bindings', () => {
  const doc = validPolicy as unknown as MutableDoc
  for (const route of doc.lane_routes) {
    const laneEntry = doc.lane_map[route.lane]
    if (laneEntry?.frontier_only !== true) continue
    for (const ref of [route.primary, route.fallback]) {
      assert.ok(ref, 'route requires both refs')
    }
    const ids = [route.primary.ref, route.fallback?.ref]
    for (const id of ids) {
      const binding = bindingOf(doc, String(id))
      assert.ok(
        KNOWN_FRONTIER_BINDINGS.includes(binding.id),
        `${binding.id} routes a frontier lane but is not reviewed frontier`,
      )
    }
  }
})

// Refusal vocabulary (rubric §7) -------------------------------------------

test('refusal vocabulary encodes every rubric §7 name', () => {
  const names = [
    'AC2A_ZERO_MATCH',
    'AC2A_WRONG_PROVIDER',
    'AC2A_CASE_MISMATCH',
    'AC2A_PREFIX_ALIAS_REFUSED',
    'AC2A_MULTI_MATCH',
    'AC2A_URL_MISMATCH',
    'AC2A_VARIANT_SUFFIX_REFUSED',
    'DATA_CLASS_INELIGIBLE',
    'DATA_CLASS_UNKNOWN',
    'CAPABILITY_MISSING',
    'CAPABILITY_UNVERIFIED',
    'INDEPENDENCE_VIOLATION',
    'INDEPENDENCE_UNPROVEN',
    'CONTEXT_INSUFFICIENT',
    'CONTEXT_UNKNOWN',
    'BUDGET_EXCEEDED',
    'COST_UNKNOWN',
    'COST_UNIT_UNKNOWN',
    'AVAILABILITY_UNVERIFIED',
    'FRESHNESS_STALE_REFUSED',
    'FRESHNESS_FUTURE_REFUSED',
    'QUALITY_UNRECORDED',
    'FALLBACK_SUITABILITY_UNPROVEN',
    'DIGEST_MISMATCH_REFUSED',
    'LANE_DISABLED_REFUSED',
    'L6_FORBIDDEN_OUTPUT_REFUSED',
    'L6_EMPTY_ELIGIBLE_REFUSED',
    'PINNED_PROVIDER_NO_ELIGIBLE',
    'OWNER_ATTESTED_PENDING_LIVE_AVAILABILITY',
  ]
  const vocabulary = [...RESOLVER_REFUSALS, ...RESOLVER_HOLDS]
  for (const name of names) {
    assert.ok(vocabulary.includes(name), `refusal vocabulary is missing '${name}'`)
  }
})

test('contract residuals name the a54 unfabricated values and nothing else', () => {
  assert.deepEqual(CONTRACT_RESIDUALS, [
    'L1_PINNED_PROVIDER_UNSET',
    'L2_PINNED_PROVIDER_UNSET',
    'L3_PROVIDER_PREFERENCE_UNSET',
    'L4_PROVIDER_PREFERENCE_UNSET',
    'DELTA_L_UNSET',
    // Amendment 06 N3. Both name a fact that is NOT established rather than
    // a value: `opencode-go` has no catalogue on this host, and the
    // open-weight transport guarantees of invariant (g) are unmeasured.
    'OPENCODE_GO_CATALOGUE_UNFETCHED',
    'OPENCODE_GO_TRANSPORT_UNVERIFIED',
    'FIREWORKS_TRANSPORT_UNVERIFIED',
  ])
})

test('contract refusal vocabulary pins every static refusal name', () => {
  for (const name of [
    'FALLBACK_SELF_REFERENCE',
    'FALLBACK_DANGLING_REFERENCE',
    'FALLBACK_PROVIDER_MISMATCH',
    'FALLBACK_DATA_POLICY_VIOLATION',
    'FALLBACK_TOOL_REQUIREMENT_VIOLATION',
    'FALLBACK_BUDGET_POLICY_VIOLATION',
    'CONTROL_PLANE_ROUTE_REFUSED',
    'UNSUPPORTED_MODEL_REFUSED',
    'ENDPOINT_DIVERGENCE_REFUSED',
    'EVIDENCE_STATE_UNATTESTED',
    'RESIDUAL_FABRICATED_REFUSED',
    // CUTOVER-P4 (C6): the typed legacy-block refusal joins the family.
    'LEGACY_REPRESENTATION_REFUSED',
    'REPRESENTATION_INCOMPLETE_REFUSED',
    'ROLE_LANE_MAP_VIOLATION',
    'RANKING_CONTRACT_VIOLATION',
    'BINDING_ID_DUPLICATE_REFUSED',
  ]) {
    assert.ok(CONTRACT_REFUSALS.includes(name), `contract vocabulary is missing '${name}'`)
  }
  assert.equal(CONTRACT_REFUSALS.length, 16)
})

// Negative controls — one per contract refusal ------------------------------

test('refuses a self-referential fallback (FALLBACK_SELF_REFERENCE)', () => {
  assertRefusal(
    docWith((doc) => {
      const route = routeOf(doc, 'L1', 'opencode')
      route.fallback = { ...route.primary }
    }),
    'FALLBACK_SELF_REFERENCE',
  )
})

test('refuses a dangling fallback reference (FALLBACK_DANGLING_REFERENCE)', () => {
  assertRefusal(
    docWith((doc) => {
      routeOf(doc, 'L1', 'opencode').fallback = { type: 'binding', ref: 'opencode/not-declared' }
    }),
    'FALLBACK_DANGLING_REFERENCE',
  )
})

test('refuses a fallback that crosses providers (FALLBACK_PROVIDER_MISMATCH)', () => {
  assertRefusal(
    docWith((doc) => {
      routeOf(doc, 'L1', 'opencode').fallback = {
        type: 'binding',
        ref: 'openrouter/openai/gpt-6-astra',
      }
    }),
    'FALLBACK_PROVIDER_MISMATCH',
  )
})

test('refuses a fallback that weakens declared data eligibility (FALLBACK_DATA_POLICY_VIOLATION)', () => {
  assertRefusal(
    docWith((doc) => {
      bindingOf(doc, 'openrouter/openai/gpt-6.1-sol').data_classes = {
        state: 'declared',
        value: ['public'],
        source: 'negative-control',
      }
    }),
    'FALLBACK_DATA_POLICY_VIOLATION',
  )
})

test('refuses a fallback that drops a verified capability (FALLBACK_TOOL_REQUIREMENT_VIOLATION)', () => {
  assertRefusal(
    docWith((doc) => {
      bindingOf(doc, 'openrouter/anthropic/claude-sonnet-5').capabilities['tool-use'] = 'verified'
    }),
    'FALLBACK_TOOL_REQUIREMENT_VIOLATION',
  )
})

test('refuses a fallback whose cost quote is unusable for budget (FALLBACK_BUDGET_POLICY_VIOLATION)', () => {
  assertRefusal(
    docWith((doc) => {
      const cost = bindingOf(doc, 'openrouter/openai/gpt-6.1-sol').cost
      cost.value = {
        ...(cost.value as Record<string, unknown>),
        unit: 'usd_per_token',
      }
    }),
    'FALLBACK_BUDGET_POLICY_VIOLATION',
  )
})

test('refuses control-plane authority on any lane (CONTROL_PLANE_ROUTE_REFUSED)', () => {
  assertRefusal(
    docWith((doc) => {
      doc.lane_map.L5.authority_cap = ['merge']
    }),
    'CONTROL_PLANE_ROUTE_REFUSED',
  )
})

test('refuses a binding whose id is not its provider/model spelling (UNSUPPORTED_MODEL_REFUSED)', () => {
  assertRefusal(
    docWith((doc) => {
      bindingOf(doc, 'opencode/gpt-6-astra').model = 'gpt-6-astra-renamed'
    }),
    'UNSUPPORTED_MODEL_REFUSED',
  )
})

test('refuses a non-frontier binding in a frontier lane (UNSUPPORTED_MODEL_REFUSED)', () => {
  assertRefusal(
    docWith((doc) => {
      routeOf(doc, 'L1', 'opencode').fallback = { type: 'binding', ref: 'opencode/glm-5.3-flash' }
    }),
    'UNSUPPORTED_MODEL_REFUSED',
  )
})

test('refuses attested availability on a divergent endpoint (ENDPOINT_DIVERGENCE_REFUSED)', () => {
  assertRefusal(
    docWith((doc) => {
      bindingOf(doc, 'openrouter/anthropic/claude-sonnet-5').availability = {
        state: 'declared',
        value: 'live-availability',
        source: 'negative-control',
      }
    }),
    'ENDPOINT_DIVERGENCE_REFUSED',
  )
})

test('refuses an evidence state it did not attest (EVIDENCE_STATE_UNATTESTED)', () => {
  assertRefusal(
    docWith((doc) => {
      bindingOf(doc, 'openrouter/openai/gpt-6-astra').availability = {
        state: 'declared',
        value: 'static-conformance',
        source: 'negative-control',
      }
    }),
    'EVIDENCE_STATE_UNATTESTED',
  )
})

test('refuses an invented residual name (RESIDUAL_FABRICATED_REFUSED)', () => {
  assertRefusal(
    docWith((doc) => {
      bindingOf(doc, 'opencode/gpt-6-astra').data_classes = {
        state: 'unknown',
        residual: 'MADE_UP_RESIDUAL',
      }
    }),
    'RESIDUAL_FABRICATED_REFUSED',
  )
})

test('refuses a value fabricated into a frozen residual slot (RESIDUAL_FABRICATED_REFUSED)', () => {
  assertRefusal(
    docWith((doc) => {
      doc.lane_map.L1.provider_rule = {
        kind: 'pinned-provider',
        pinned_provider: { state: 'declared', value: 'opencode', source: 'negative-control' },
      }
    }),
    'RESIDUAL_FABRICATED_REFUSED',
  )
})

test('refuses a partial new representation (REPRESENTATION_INCOMPLETE_REFUSED)', () => {
  assertRefusal(
    docWith((doc) => {
      Reflect.deleteProperty(doc, 'lane_routes')
    }),
    'REPRESENTATION_INCOMPLETE_REFUSED',
  )
})

test('refuses drift in the frozen map (ROLE_LANE_MAP_VIOLATION)', () => {
  assertRefusal(
    docWith((doc) => {
      doc.lane_map.L1.provider_rule = { kind: 'cheapest-eligible' }
    }),
    'ROLE_LANE_MAP_VIOLATION',
  )
})

test('refuses drift in the ranking contract (RANKING_CONTRACT_VIOLATION)', () => {
  assertRefusal(
    docWith((doc) => {
      doc.ranking_contract.eligibility_filters = ['R1']
    }),
    'RANKING_CONTRACT_VIOLATION',
  )
})

test('refuses duplicate binding ids (BINDING_ID_DUPLICATE_REFUSED)', () => {
  assertRefusal(
    docWith((doc) => {
      bindingOf(doc, 'opencode/gpt-6-astra').id = 'opencode/claude-opus-5-5'
    }),
    'BINDING_ID_DUPLICATE_REFUSED',
  )
})

test('refuses any route on the disabled L6 lane (LANE_DISABLED_REFUSED)', () => {
  assertRefusal(
    docWith((doc) => {
      doc.lane_routes.push({
        lane: 'L6',
        provider: 'opencode',
        primary: { type: 'binding', ref: 'opencode/qwen3.8-flash' },
        fallback: { type: 'binding', ref: 'opencode/glm-5.3-flash' },
        comparability: { state: 'unproven', residual: 'FALLBACK_SUITABILITY_UNPROVEN' },
      })
    }),
    'LANE_DISABLED_REFUSED',
  )
})

test('refuses un-disabling L6 through a policy edit (LANE_DISABLED_REFUSED)', () => {
  assertRefusal(
    docWith((doc) => {
      doc.lane_map.L6.status = 'enabled'
    }),
    'LANE_DISABLED_REFUSED',
  )
})

test('refuses a comparability claim over unproven inputs (FALLBACK_SUITABILITY_UNPROVEN)', () => {
  assertRefusal(
    docWith((doc) => {
      routeOf(doc, 'L1', 'opencode').comparability = {
        state: 'declared',
        value: 'comparable-or-higher',
        source: 'negative-control',
      }
    }),
    'FALLBACK_SUITABILITY_UNPROVEN',
  )
})

test('refuses an ordered-source candidate without public eligibility (DATA_CLASS_INELIGIBLE)', () => {
  // Re-anchored at CUTOVER-P4 (C3.3): the R1 cross-check against the removed
  // eligibility lists is gone; the ordered source must not advertise a
  // candidate that is not classification-eligible under `public` (invariant f).
  assertRefusal(
    docWith((doc) => {
      // Amendment 09: the opencode leg of this candidate is now declared
      // [public], and invariant (f) is satisfied by eligibility ANYWHERE
      // (A6 N3) — so the control must strip public eligibility from BOTH
      // bindings to isolate the refusal.
      for (const id of ['openrouter/anthropic/claude-sonnet-5', 'opencode/claude-sonnet-5']) {
        bindingOf(doc, id).data_classes = {
          state: 'unknown',
          residual: 'DATA_CLASS_UNKNOWN',
        }
      }
    }),
    'DATA_CLASS_INELIGIBLE',
  )
})

// Negative controls — structural refusals ----------------------------------

test('structural: a missing fallback is refused', () => {
  const doc = docWith((doc) => {
    Reflect.deleteProperty(routeOf(doc, 'L4', 'opencode'), 'fallback')
  })
  const result = validatePolicy(doc)
  assert.equal(result.valid, false)
  assert.ok(
    result.errors.some((error) => error.includes("must have required property 'fallback'")),
    JSON.stringify(result.errors),
  )
})

test('structural: an unapproved provider is refused on routes and bindings', () => {
  // NOTE: this used `anthropic` as the unapproved example until Amendment 06
  // admitted it as a real provider. `bedrock` is the replacement — a plausible
  // provider name that PROVIDER_NAMES deliberately does not list, which is the
  // property this test needs.
  const onRoute = docWith((doc) => {
    routeOf(doc, 'L1', 'opencode').provider = 'bedrock'
  })
  const onBinding = docWith((doc) => {
    bindingOf(doc, 'opencode/gpt-6-astra').provider = 'bedrock'
  })
  for (const doc of [onRoute, onBinding]) {
    const result = validatePolicy(doc)
    assert.equal(result.valid, false)
    assert.ok(
      result.errors.some(
        (error) => error.includes('/provider') && error.includes('allowed values'),
      ),
      JSON.stringify(result.errors),
    )
  }
})

test('structural: an envelope may not mix a value with a residual', () => {
  const doc = docWith((doc) => {
    bindingOf(doc, 'opencode/gpt-6-astra').data_classes = {
      state: 'unknown',
      residual: 'DATA_CLASS_UNKNOWN',
      value: ['public'],
    }
  })
  const result = validatePolicy(doc)
  assert.equal(result.valid, false)
  assert.ok(
    result.errors.some((error) => error.includes('data_classes')),
    JSON.stringify(result.errors),
  )
})

// Typed references and migration (N3, N5) -------------------------------

test('a candidate-typed reference resolves to the route provider binding', () => {
  const doc = docWith((doc) => {
    // Amendment 07: the candidate chosen here must not resolve to the L1
    // fallback binding (opencode/claude-opus-5-5), which A5.3 refuses as a
    // self-reference. gpt-6.1-sol resolves to the route's own primary.
    routeOf(doc, 'L1', 'opencode').primary = { type: 'candidate', ref: 'gpt-6.1-sol' }
  })
  assert.deepEqual(validatePolicy(doc).errors, [])
})

// CUTOVER-P4 (C4.2): the deprecation-window control "a legacy-only document
// stays valid through the deprecation window (N5)" is deleted here — exactly
// one named deletion in this packet — and inverted at window end in
// tests/legacy-cutover.test.ts ("a legacy-only document is refused once
// CUTOVER-P4 ends the deprecation window"). The old assertion is never re-pinned.
