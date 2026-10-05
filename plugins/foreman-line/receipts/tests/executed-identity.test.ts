/**
 * MRC-05 C4.4/C4.5 — executed-identity reconciliation seam (RCM-P4A + RCM-P8A
 * exit criterion 8): the verifier-evidence half of the model-routing-chain
 * wrapper contract.
 *
 * Coverage:
 *   - C4.4 executed-identity rules: exact registry_key match reproduces the
 *     recorded decision; a wrong modelRef refuses; alias-only matches refuse
 *     (no identity aliasing); a no-selection decision (registry_key: null)
 *     refuses any execution claim; empty/whitespace/non-string modelRefs
 *     refuse typed;
 *   - C4.5 cross-version structural refusal: pre-carry vs post-carry
 *     effective_requirements refuses naming 'effective_requirements' in both
 *     directions; verifyExecutedIdentity inherits the same verifyReplay loop;
 *   - additive-shape invariants via validateEventSubject: the optional
 *     RCM-P4A keys validate when present, pre-carry absence still validates,
 *     unknown keys refuse (closed-world checkKeys), and per-key rules hold;
 *   - exit-criterion-8 structure preservation: verifyReplay compares exactly
 *     the seven REPLAY_BINDING_ORDER bindings.
 *
 * Fixtures are constructed inline (matching replay-contract.test.ts; no new
 * fixture files). REPLAY_BINDING_ORDER is module-private in validator.ts, so
 * the structure control is behavioral plus the ReplayBindingName-typed set.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import type {
  CacheKeyRecord,
  EffectiveRequirements,
  EventProvenance,
  ReplayBindingName,
  ReplayBindings,
  RoutingCacheSubject,
  RoutingDecisionSubject,
} from '../src/index.js'
import {
  REASON_VOCABULARY_VERSION,
  validateEventSubject,
  verifyExecutedIdentity,
  verifyReplay,
} from '../src/index.js'

const HASH_1 = '1'.repeat(64)
const HASH_2 = '2'.repeat(64)
const HASH_3 = '3'.repeat(64)

// D2's distinct-values rule: the four identity fields never alias each other,
// so each alias-only probe below is a genuine non-registry match.
const REGISTRY_KEY = 'anthropic/claude-sonnet-5'
const PROVIDER_LOCAL_ID = 'openrouter/anthropic/claude-sonnet-5'
const PROTOCOL = 'openai-chat-completions'
const PI_HOST_MODEL_ID = 'claude-sonnet-5'

function baseProvenance(): EventProvenance {
  return {
    provider: 'openrouter',
    model: REGISTRY_KEY,
    input_tokens: null,
    output_tokens: null,
    provider_cached_tokens: null,
    latency_ms: null,
    failure: null,
    retries: 0,
    cost: {
      tag: 'unknown',
      amount: null,
      currency: null,
      price_source: null,
      price_version: null,
    },
    occurrence: 1,
  }
}

// Pre-carry bindings (RCM-P4A additive keys absent — see postCarryRequirements).
function baseBindings(): ReplayBindings {
  return {
    effective_requirements: {
      routing_class: 'implementation/standard',
      data_classification: 'internal',
      transport_requirements: { data_collection: 'deny', zdr: true },
    },
    policy_digest: { version: 'routing-policy/routing-policy.yaml', content_digest: HASH_1 },
    catalog_snapshot_digest: HASH_2,
    vocabulary_version: REASON_VOCABULARY_VERSION,
    derived_context_floor: { required_context_tokens: null, required_output_tokens: null },
    predicate_set: ['class_allowlist', 'data_class_eligible_models'],
    selected_identity: {
      registry_key: REGISTRY_KEY,
      provider_local_id: PROVIDER_LOCAL_ID,
      protocol: PROTOCOL,
      pi_host_model_id: PI_HOST_MODEL_ID,
    },
  }
}

// Post-carry effective_requirements: pre-carry shape plus the three additive
// RCM-P4A keys.
function postCarryRequirements(): EffectiveRequirements {
  return {
    ...baseBindings().effective_requirements,
    required_inputs: ['text', 'image'],
    required_thinking_level: 'high',
    expertise: 'deep',
  }
}

function decisionSubject(bindings: ReplayBindings): RoutingDecisionSubject {
  return {
    event_kind: 'decision',
    reason: 'ROUTE_SELECTED',
    bindings,
    provenance: baseProvenance(),
  }
}

function baseCacheKey(): CacheKeyRecord {
  return {
    schema_version: 1,
    policy_digest: HASH_1,
    routing_class: 'implementation/standard',
    data_classification: 'internal',
  }
}

function cacheSubject(cacheKey: CacheKeyRecord): RoutingCacheSubject {
  return {
    event_kind: 'cache',
    reason: 'CACHE_HIT',
    vocabulary_version: REASON_VOCABULARY_VERSION,
    cache_key: cacheKey,
    provenance: baseProvenance(),
  }
}

function noSelectionBindings(): ReplayBindings {
  return {
    ...baseBindings(),
    selected_identity: {
      registry_key: null,
      provider_local_id: null,
      protocol: null,
      pi_host_model_id: null,
    },
  }
}

// ─── C4.4 executed-identity reconciliation rules ────────────────────────────

test('C4.4 (a): an executed modelRef equal to the recorded registry_key reproduces the recorded decision', () => {
  const recorded = baseBindings()
  const result = verifyExecutedIdentity(recorded, REGISTRY_KEY)
  assert.equal(result.status, 'reproduced')
  assert.deepEqual(
    result.status === 'reproduced' ? result.decision : null,
    recorded.selected_identity,
  )
})

test('C4.4 (b): a wrong executed modelRef refuses, naming selected_identity', () => {
  const result = verifyExecutedIdentity(baseBindings(), 'anthropic/claude-opus-5')
  assert.equal(result.status, 'refused')
  assert.equal(result.status === 'refused' ? result.refusal.code : null, 'REPLAY_REFUSED')
  assert.equal(result.status === 'refused' ? result.refusal.binding : null, 'selected_identity')
})

test('C4.4 (c): alias-only modelRef matches refuse — no identity aliasing', () => {
  const recorded = baseBindings()
  for (const alias of [PROVIDER_LOCAL_ID, PROTOCOL, PI_HOST_MODEL_ID]) {
    assert.notEqual(alias, REGISTRY_KEY)
    const result = verifyExecutedIdentity(recorded, alias)
    assert.equal(result.status, 'refused', `alias-only match '${alias}' must refuse`)
    assert.equal(result.status === 'refused' ? result.refusal.code : null, 'REPLAY_REFUSED')
    assert.equal(
      result.status === 'refused' ? result.refusal.binding : null,
      'selected_identity',
      `alias-only match '${alias}' must refuse on selected_identity`,
    )
  }
  // Control: the very same fixture reproduces on the exact registry_key, so
  // the refusals above are alias-specific, not fixture breakage.
  assert.equal(verifyExecutedIdentity(recorded, REGISTRY_KEY).status, 'reproduced')
})

test('C4.4 (d): a recorded registry_key of null refuses any executed identity', () => {
  const recorded = noSelectionBindings()
  for (const modelRef of [REGISTRY_KEY, 'openai/gpt-5.1']) {
    const result = verifyExecutedIdentity(recorded, modelRef)
    assert.equal(
      result.status,
      'refused',
      `an execution claim '${modelRef}' against a no-selection decision must refuse`,
    )
    assert.equal(result.status === 'refused' ? result.refusal.code : null, 'REPLAY_REFUSED')
    assert.equal(result.status === 'refused' ? result.refusal.binding : null, 'selected_identity')
  }
})

test('C4.4 (e): empty, whitespace-only, and non-string modelRefs refuse typed', () => {
  const invalidModelRefs: string[] = ['', '   ', 42 as unknown as string]
  for (const modelRef of invalidModelRefs) {
    const result = verifyExecutedIdentity(baseBindings(), modelRef)
    assert.equal(result.status, 'refused', `modelRef ${JSON.stringify(modelRef)} must refuse`)
    assert.equal(
      result.status === 'refused' ? result.refusal.code : null,
      'REPLAY_REFUSED',
      `modelRef ${JSON.stringify(modelRef)} must refuse with REPLAY_REFUSED`,
    )
    assert.equal(
      result.status === 'refused' ? result.refusal.binding : null,
      'selected_identity',
      `modelRef ${JSON.stringify(modelRef)} must refuse on selected_identity`,
    )
  }
})

// ─── C4.5 cross-version structural refusal ──────────────────────────────────

test('C4.5: pre-carry effective_requirements vs post-carry current refuses, naming effective_requirements', () => {
  const recorded = decisionSubject(baseBindings())
  const current: ReplayBindings = {
    ...baseBindings(),
    effective_requirements: postCarryRequirements(),
  }
  const result = verifyReplay(recorded, current)
  assert.equal(result.status, 'refused')
  assert.equal(result.status === 'refused' ? result.refusal.code : null, 'REPLAY_REFUSED')
  assert.equal(
    result.status === 'refused' ? result.refusal.binding : null,
    'effective_requirements',
  )
})

test('C4.5: post-carry effective_requirements vs pre-carry current refuses, naming effective_requirements (symmetric)', () => {
  const recorded = decisionSubject({
    ...baseBindings(),
    effective_requirements: postCarryRequirements(),
  })
  const result = verifyReplay(recorded, baseBindings())
  assert.equal(result.status, 'refused')
  assert.equal(result.status === 'refused' ? result.refusal.code : null, 'REPLAY_REFUSED')
  assert.equal(
    result.status === 'refused' ? result.refusal.binding : null,
    'effective_requirements',
  )
})

test('C4.5: verifyExecutedIdentity inherits the verifyReplay structural comparator', () => {
  // verifyExecutedIdentity's recorded-vs-derived comparison is decided by the
  // SAME verifyReplay loop: it derives "current" by spreading the recorded
  // bindings and overriding only selected_identity.registry_key, then defers
  // to verifyReplay — so its verdicts are exit-criterion-8 verdicts, never a
  // parallel shape.
  const recorded: ReplayBindings = {
    ...baseBindings(),
    effective_requirements: postCarryRequirements(),
  }
  // Identity rules hold on post-carry bindings: exact registry_key match
  // reproduces, decision equal to the recorded selected_identity.
  const reproduced = verifyExecutedIdentity(recorded, REGISTRY_KEY)
  assert.equal(reproduced.status, 'reproduced')
  assert.deepEqual(
    reproduced.status === 'reproduced' ? reproduced.decision : null,
    recorded.selected_identity,
  )
  // A mismatch refuses typed, naming selected_identity — never any other
  // binding (the additive keys are carried through the derived current).
  const refused = verifyExecutedIdentity(recorded, 'anthropic/claude-opus-5')
  assert.equal(refused.status, 'refused')
  assert.equal(refused.status === 'refused' ? refused.refusal.code : null, 'REPLAY_REFUSED')
  assert.equal(refused.status === 'refused' ? refused.refusal.binding : null, 'selected_identity')
})

// ─── Additive-shape invariants (validateEventSubject) ───────────────────────

test('additive effective_requirements: the three additive keys validate when present', () => {
  const subject = decisionSubject({
    ...baseBindings(),
    effective_requirements: postCarryRequirements(),
  })
  assert.deepEqual(validateEventSubject('RoutingDecisionEvent', subject), {
    valid: true,
    errors: [],
  })
})

test('additive effective_requirements: pre-carry absence still validates', () => {
  assert.deepEqual(validateEventSubject('RoutingDecisionEvent', decisionSubject(baseBindings())), {
    valid: true,
    errors: [],
  })
})

test('additive effective_requirements: an unknown key refuses, naming the field', () => {
  const base = baseBindings()
  const subject = decisionSubject({
    ...base,
    effective_requirements: {
      ...base.effective_requirements,
      unknown_additive: 'x',
    } as unknown as EffectiveRequirements,
  })
  const result = validateEventSubject('RoutingDecisionEvent', subject)
  assert.equal(result.valid, false)
  assert.ok(
    result.errors.some((error) => error.includes("unknown field 'unknown_additive'")),
    `errors must name the unknown field, got ${JSON.stringify(result.errors)}`,
  )
})

test('additive cache_key: the four additive keys validate when present', () => {
  const subject = cacheSubject({
    ...baseCacheKey(),
    required_inputs: ['text', 'image'],
    required_thinking_level: 'high',
    required_context_tokens: 128_000,
    expertise: 'deep',
  })
  assert.deepEqual(validateEventSubject('RoutingCacheEvent', subject), {
    valid: true,
    errors: [],
  })
})

test('additive cache_key: pre-carry absence still validates', () => {
  assert.deepEqual(validateEventSubject('RoutingCacheEvent', cacheSubject(baseCacheKey())), {
    valid: true,
    errors: [],
  })
})

test('additive cache_key: an unknown key refuses, naming the field', () => {
  const subject = cacheSubject({
    ...baseCacheKey(),
    unknown_additive: 'x',
  } as unknown as CacheKeyRecord)
  const result = validateEventSubject('RoutingCacheEvent', subject)
  assert.equal(result.valid, false)
  assert.ok(
    result.errors.some((error) => error.includes("unknown field 'unknown_additive'")),
    `errors must name the unknown field, got ${JSON.stringify(result.errors)}`,
  )
})

test('additive cache_key: required_context_tokens must be a positive integer', () => {
  for (const required_context_tokens of [0, 1.5]) {
    const subject = cacheSubject({ ...baseCacheKey(), required_context_tokens })
    const result = validateEventSubject('RoutingCacheEvent', subject)
    assert.equal(
      result.valid,
      false,
      `required_context_tokens ${required_context_tokens} must refuse`,
    )
    assert.ok(
      result.errors.some((error) =>
        error.includes('cache_key.required_context_tokens must be a positive integer'),
      ),
      `errors must name the invariant, got ${JSON.stringify(result.errors)}`,
    )
  }
})

test('additive required_inputs must be a non-empty array of unique non-empty strings (decision + cache)', () => {
  for (const required_inputs of [[], ['tools/web.search', 'tools/web.search'], ['']]) {
    const base = baseBindings()
    const decision = decisionSubject({
      ...base,
      effective_requirements: {
        ...base.effective_requirements,
        required_inputs,
      },
    })
    const decisionResult = validateEventSubject('RoutingDecisionEvent', decision)
    assert.equal(
      decisionResult.valid,
      false,
      `effective_requirements.required_inputs ${JSON.stringify(required_inputs)} must refuse`,
    )
    assert.ok(
      decisionResult.errors.some((error) =>
        error.includes(
          'bindings.effective_requirements.required_inputs must be a non-empty array of unique non-empty strings',
        ),
      ),
      `errors must name the invariant, got ${JSON.stringify(decisionResult.errors)}`,
    )

    const cacheResult = validateEventSubject(
      'RoutingCacheEvent',
      cacheSubject({ ...baseCacheKey(), required_inputs }),
    )
    assert.equal(
      cacheResult.valid,
      false,
      `cache_key.required_inputs ${JSON.stringify(required_inputs)} must refuse`,
    )
    assert.ok(
      cacheResult.errors.some((error) =>
        error.includes(
          'cache_key.required_inputs must be a non-empty array of unique non-empty strings',
        ),
      ),
      `errors must name the invariant, got ${JSON.stringify(cacheResult.errors)}`,
    )
  }
})

test('additive scalar keys must be non-empty strings when present (decision + cache)', () => {
  for (const key of ['required_thinking_level', 'expertise'] as const) {
    const base = baseBindings()
    const decision = decisionSubject({
      ...base,
      effective_requirements: {
        ...base.effective_requirements,
        [key]: '',
      },
    })
    const decisionResult = validateEventSubject('RoutingDecisionEvent', decision)
    assert.equal(decisionResult.valid, false, `${key} of '' must refuse`)
    assert.ok(
      decisionResult.errors.some((error) =>
        error.includes(`bindings.effective_requirements.${key} must be a non-empty string`),
      ),
      `errors must name the invariant, got ${JSON.stringify(decisionResult.errors)}`,
    )

    const cacheResult = validateEventSubject(
      'RoutingCacheEvent',
      cacheSubject({ ...baseCacheKey(), [key]: '' }),
    )
    assert.equal(cacheResult.valid, false, `cache_key.${key} of '' must refuse`)
    assert.ok(
      cacheResult.errors.some((error) =>
        error.includes(`cache_key.${key} must be a non-empty string`),
      ),
      `errors must name the invariant, got ${JSON.stringify(cacheResult.errors)}`,
    )
  }
})

test('sweep (a): required_inputs outside the canonical spellings refuses — order and membership enforced at the seam', () => {
  for (const required_inputs of [['image', 'text'], ['video'], ['text', 'video']]) {
    const decision = decisionSubject({
      ...baseBindings(),
      effective_requirements: {
        ...baseBindings().effective_requirements,
        required_inputs,
      },
    })
    const decisionResult = validateEventSubject('RoutingDecisionEvent', decision)
    assert.equal(decisionResult.valid, false, JSON.stringify(required_inputs))
    assert.ok(
      decisionResult.errors.some((error) => error.includes('canonical INPUT_MODALITIES order')),
      JSON.stringify(decisionResult.errors),
    )
    const cacheResult = validateEventSubject(
      'RoutingCacheEvent',
      cacheSubject({ ...baseCacheKey(), required_inputs }),
    )
    assert.equal(cacheResult.valid, false, JSON.stringify(required_inputs))
    assert.ok(
      cacheResult.errors.some((error) => error.includes('canonical INPUT_MODALITIES order')),
      JSON.stringify(cacheResult.errors),
    )
  }
  // the canonical spellings themselves validate (no false refusals)
  for (const required_inputs of [['text'], ['image'], ['text', 'image']]) {
    assert.deepEqual(
      validateEventSubject(
        'RoutingDecisionEvent',
        decisionSubject({
          ...baseBindings(),
          effective_requirements: { ...baseBindings().effective_requirements, required_inputs },
        }),
      ),
      { valid: true, errors: [] },
    )
  }
})

// ─── Exit-criterion-8 structure preservation ────────────────────────────────

// The exact seven-binding structure (REPLAY_BINDING_ORDER's listing order).
const EXACT_BINDING_SET: Record<ReplayBindingName, true> = {
  effective_requirements: true,
  policy_digest: true,
  catalog_snapshot_digest: true,
  vocabulary_version: true,
  derived_context_floor: true,
  predicate_set: true,
  selected_identity: true,
}

// Each case mutates exactly one bound input, independently.
const singleMutations: Record<ReplayBindingName, () => ReplayBindings> = {
  effective_requirements: () => {
    const base = baseBindings()
    return {
      ...base,
      effective_requirements: { ...base.effective_requirements, routing_class: 'boilerplate' },
    }
  },
  policy_digest: () => {
    const base = baseBindings()
    return { ...base, policy_digest: { ...base.policy_digest, content_digest: HASH_3 } }
  },
  catalog_snapshot_digest: () => ({ ...baseBindings(), catalog_snapshot_digest: HASH_3 }),
  vocabulary_version: () => ({ ...baseBindings(), vocabulary_version: '0.0.1-not-recorded' }),
  derived_context_floor: () => {
    const base = baseBindings()
    return {
      ...base,
      derived_context_floor: { ...base.derived_context_floor, required_context_tokens: 200_000 },
    }
  },
  predicate_set: () => ({ ...baseBindings(), predicate_set: ['class_allowlist'] }),
  selected_identity: () => {
    const base = baseBindings()
    return {
      ...base,
      selected_identity: { ...base.selected_identity, provider_local_id: 'some/other-id' },
    }
  },
}

test('structure control: each of the seven bindings is compared — a single mutation refuses, naming it', () => {
  for (const binding of Object.keys(EXACT_BINDING_SET) as ReplayBindingName[]) {
    const result = verifyReplay(decisionSubject(baseBindings()), singleMutations[binding]())
    assert.equal(result.status, 'refused', `a mutated ${binding} must refuse`)
    assert.equal(result.status === 'refused' ? result.refusal.code : null, 'REPLAY_REFUSED')
    assert.equal(
      result.status === 'refused' ? result.refusal.binding : null,
      binding,
      `the refusal must name ${binding}`,
    )
  }
})

test('structure control: nothing beyond the seven bindings is compared', () => {
  // The comparator walks the binding list, never whole-object equality: an
  // extra field outside the seven-binding structure is not compared.
  const extraField = { ...baseBindings(), unrelated_probe: true } as unknown as ReplayBindings
  assert.equal(verifyReplay(decisionSubject(baseBindings()), extraField).status, 'reproduced')
})

test('structure control: refusal naming follows the binding-listing order', () => {
  // Simultaneous mismatches on the first and last binding name the first —
  // comparison order is the exit-criterion-8 listing order (deterministic).
  const earlyAndLate: ReplayBindings = {
    ...singleMutations.effective_requirements(),
    selected_identity: { ...baseBindings().selected_identity, provider_local_id: 'some/other-id' },
  }
  const result = verifyReplay(decisionSubject(baseBindings()), earlyAndLate)
  assert.equal(result.status, 'refused')
  assert.equal(
    result.status === 'refused' ? result.refusal.binding : null,
    'effective_requirements',
  )
})
