/**
 * MRC-02 C2 — replay reproduction + refusal-on-mismatch negative controls
 * (the "verifier evidence" half of the folded RCM-P8A row; the input MRC-16
 * uses to close RCM exit criterion 8).
 *
 * Coverage:
 *   - reproduction control: identical bound inputs reproduce the recorded decision;
 *   - seven independent refusal controls, one mutation per exit-criterion-8
 *     bound input, each naming the mismatched binding as a typed field;
 *   - enriched receipts remain valid chain members and do not alter
 *     validateReceiptDocument / validateChain / isSealed semantics.
 *
 * All fixtures are constructed inline (coordinator FLAG-3 ruling: no new
 * fixture files). Hashes are pattern-valid placeholder strings — the chain
 * validator compares stored pointers, never recomputed digests.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import type {
  JsonValue,
  ReceiptDocument,
  ReplayBindingName,
  ReplayBindings,
  RoutingDecisionSubject,
} from '../src/index.js'
import {
  isSealed,
  REASON_VOCABULARY_VERSION,
  validateChain,
  validateEventSubject,
  validateReceiptDocument,
  verifyReplay,
} from '../src/index.js'

const HASH_1 = '1'.repeat(64)
const HASH_2 = '2'.repeat(64)

const correlation = {
  correlationId: 'aaaaaaaa-0000-4000-8000-000000000001',
  sessionId: 'aaaaaaaa-0000-4000-8000-000000000002',
  workflowId: 'aaaaaaaa-0000-4000-8000-000000000003',
  runId: 'aaaaaaaa-0000-4000-8000-000000000004',
} as unknown as ReceiptDocument['correlation']

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
      registry_key: 'anthropic/claude-sonnet-5',
      provider_local_id: 'anthropic/claude-sonnet-5',
      protocol: 'openai-chat-completions',
      pi_host_model_id: 'claude-sonnet-5',
    },
  }
}

function decisionSubject(bindings: ReplayBindings): RoutingDecisionSubject {
  return {
    event_kind: 'decision',
    reason: 'ROUTE_SELECTED',
    bindings,
    provenance: {
      provider: 'openrouter',
      model: 'anthropic/claude-sonnet-5',
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
    },
  }
}

function receipt(args: {
  sequence: number
  prevHash: string | null
  stage: 'A' | 'B' | 'C' | 'F'
  subjectKind: string
  subject: unknown
  hash: string
}): ReceiptDocument {
  return {
    schemaVersion: '1',
    kind: 'stage',
    stage: args.stage,
    claimRef: null,
    correlation,
    sequence: args.sequence,
    prevHash: args.prevHash,
    timestamp: '2026-09-27T00:00:00.000Z',
    subjectKind: args.subjectKind,
    subject: args.subject as JsonValue,
    signature: null,
    hash: args.hash,
  }
}

// ─── Reproduction control ────────────────────────────────────────────────────

test('reproduction control: identical bound inputs reproduce the recorded decision', () => {
  const subject = decisionSubject(baseBindings())
  const result = verifyReplay(subject, baseBindings())
  assert.equal(result.status, 'reproduced')
  assert.deepEqual(
    result.status === 'reproduced' ? result.decision : null,
    subject.bindings.selected_identity,
  )
})

// ─── Refusal-on-mismatch negative controls (one per bound input) ─────────────

const recorded = decisionSubject(baseBindings())

// Each case mutates exactly one bound input, independently.
const mutatedCases: readonly (readonly [ReplayBindingName, () => ReplayBindings])[] = [
  [
    'effective_requirements',
    () => {
      const base = baseBindings()
      return {
        ...base,
        effective_requirements: { ...base.effective_requirements, routing_class: 'boilerplate' },
      }
    },
  ],
  [
    'policy_digest',
    () => {
      const base = baseBindings()
      return {
        ...base,
        policy_digest: { ...base.policy_digest, content_digest: '9'.repeat(64) },
      }
    },
  ],
  [
    'catalog_snapshot_digest',
    () => ({ ...baseBindings(), catalog_snapshot_digest: '8'.repeat(64) }),
  ],
  ['vocabulary_version', () => ({ ...baseBindings(), vocabulary_version: '0.0.1-not-recorded' })],
  [
    'derived_context_floor',
    () => {
      const base = baseBindings()
      return {
        ...base,
        derived_context_floor: { ...base.derived_context_floor, required_context_tokens: 200_000 },
      }
    },
  ],
  ['predicate_set', () => ({ ...baseBindings(), predicate_set: ['class_allowlist'] })],
  [
    'selected_identity',
    () => {
      const base = baseBindings()
      return {
        ...base,
        selected_identity: { ...base.selected_identity, provider_local_id: 'some/other-id' },
      }
    },
  ],
]

for (const [binding, mutate] of mutatedCases) {
  test(`refusal control: a mutated ${binding} refuses, naming the binding`, () => {
    const result = verifyReplay(recorded, mutate())
    assert.equal(result.status, 'refused')
    assert.equal(result.status === 'refused' ? result.refusal.code : null, 'REPLAY_REFUSED')
    assert.equal(result.status === 'refused' ? result.refusal.binding : null, binding)
    assert.match(result.status === 'refused' ? result.refusal.detail : '', new RegExp(binding))
  })
}

// ─── Enriched receipts stay valid chain members; sealing unchanged ───────────

test('an enriched decision receipt validates and chains without altering seal semantics', () => {
  const genesis = receipt({
    sequence: 0,
    prevHash: null,
    stage: 'A',
    subjectKind: 'GenesisRecord',
    subject: {},
    hash: HASH_1,
  })
  const decision = receipt({
    sequence: 1,
    prevHash: HASH_1,
    stage: 'C',
    subjectKind: 'RoutingDecisionEvent',
    subject: decisionSubject(baseBindings()),
    hash: HASH_2,
  })

  assert.equal(validateReceiptDocument(decision).valid, true)
  assert.equal(validateEventSubject('RoutingDecisionEvent', decision.subject).valid, true)

  // Enriched members do not alter isSealed: an open chain stays unsealed …
  const openChain = [genesis, decision]
  assert.equal(
    validateChain(openChain).valid,
    true,
    JSON.stringify(validateChain(openChain).errors),
  )
  assert.equal(isSealed(openChain), false)

  // … a terminal stage-F ClosureRecord still seals …
  const closure = receipt({
    sequence: 2,
    prevHash: HASH_2,
    stage: 'F',
    subjectKind: 'ClosureRecord',
    subject: {},
    hash: '3'.repeat(64),
  })
  const sealedChain = [...openChain, closure]
  assert.equal(validateChain(sealedChain).valid, true)
  assert.equal(isSealed(sealedChain), true)

  // … and a ClosureRecord that is not the tip still does not seal. The
  // fixture is chain-valid — the tip property alone decides this control.
  const notTip = [
    genesis,
    receipt({
      sequence: 1,
      prevHash: HASH_1,
      stage: 'F',
      subjectKind: 'ClosureRecord',
      subject: {},
      hash: '3'.repeat(64),
    }),
    receipt({
      sequence: 2,
      prevHash: '3'.repeat(64),
      stage: 'C',
      subjectKind: 'RoutingDecisionEvent',
      subject: decisionSubject(baseBindings()),
      hash: HASH_2,
    }),
  ]
  assert.equal(validateChain(notTip).valid, true, JSON.stringify(validateChain(notTip).errors))
  assert.equal(isSealed(notTip), false)
})
