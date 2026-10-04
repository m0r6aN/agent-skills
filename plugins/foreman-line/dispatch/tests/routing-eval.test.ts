/**
 * W2-P3 routing-eval unit tests.
 *
 * All tests use a fresh tmpDir as repoRoot so no production receipts are
 * touched. The frozen routing-policy.yaml is copied from the real repo path
 * into each tmpDir fixture.
 *
 * Expected model ids track the shipped v0.3 policy (OpenRouter slugs). All
 * three classifications share one eligible list, so a class resolves to the
 * same model regardless of classification; what differs per classification
 * is `transportRequirements`, which AC6 also asserts (strict for
 * internal/restricted, permissive for public).
 *
 * Coverage:
 *   - AC2: standard-feature/internal → anthropic/claude-sonnet-5/standard (spec workflowId)
 *   - AC3: architecture/risk/public  → anthropic/claude-opus-5.5/frontier  (spec workflowId)
 *   - AC4: boilerplate/public        → nvidia/nemotron-3.5-lightning/economy
 *   - AC5: implementation/standard/restricted → anthropic/claude-sonnet-5/standard
 *   - AC6: all 12 class × data_classification combinations (eval matrix + transport)
 *   - AC7/PAR-2: routing_class 'standard' (old wrong label) → UNKNOWN_CLASS
 *   - AC8: unrecognised data_classification → UNKNOWN_DATA_CLASSIFICATION
 *   - AC9: receipt contains all 8 required fields; policyRef and timestamp valid
 *   - AC10: second call with same workflowId overwrites receipt cleanly
 *   - AC11b: POLICY_UNREADABLE thrown when policy YAML is absent
 *   - F-01: malformed YAML throws RoutingError POLICY_INVALID (not a bare YAMLParseError)
 */
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import type { CorrelationContext } from '../../contracts/src/index.js'
import type {
  EventProvenance,
  ReceiptDocument,
  RoutingAttemptSubject,
  RoutingCacheSubject,
  RoutingDecisionSubject,
} from '../../receipts/src/index.js'
import { validateChain } from '../../receipts/src/index.js'
import { FileRoutingCacheStore, RoutingDecisionCache } from '../src/routing-cache.js'
import { evaluateRouting, RoutingError } from '../src/routing-eval/index.js'

// ─── Fixture helpers ──────────────────────────────────────────────────────────

const REAL_POLICY_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'routing-policy',
  'routing-policy.yaml',
)

/** Create a fresh tmpDir with the routing-policy.yaml copied in. */
function makeTempRepoRoot(): string {
  const tempRoot = mkdtempSync(join(tmpdir(), 'w2p3-test-'))
  const policyDir = join(tempRoot, 'plugins', 'foreman-line', 'routing-policy')
  mkdirSync(policyDir, { recursive: true })
  writeFileSync(join(policyDir, 'routing-policy.yaml'), readFileSync(REAL_POLICY_PATH, 'utf8'))
  return tempRoot
}

// ─── AC2–AC5: named spec assertions ──────────────────────────────────────────

test('AC2: standard-feature/internal resolves to anthropic/claude-sonnet-5/standard', () => {
  const repoRoot = makeTempRepoRoot()
  try {
    const result = evaluateRouting(
      {
        routing_class: 'standard-feature',
        data_classification: 'internal',
        workflowId: 'test-wf-001',
      },
      { repoRoot, pluginRoot: join(repoRoot, 'plugins', 'foreman-line') },
    )
    assert.equal(result.resolvedModelId, 'anthropic/claude-sonnet-5')
    assert.equal(result.resolvedTier, 'standard')
    assert.equal(result.routingDecisionRef, 'docs/receipts/test-wf-001/routing-decision.json')
  } finally {
    rmSync(repoRoot, { recursive: true, force: true })
  }
})

test('AC3: architecture/risk/public resolves to anthropic/claude-opus-5.5/frontier', () => {
  const repoRoot = makeTempRepoRoot()
  try {
    const result = evaluateRouting(
      {
        routing_class: 'architecture/risk',
        data_classification: 'public',
        workflowId: 'test-wf-002',
      },
      { repoRoot, pluginRoot: join(repoRoot, 'plugins', 'foreman-line') },
    )
    assert.equal(result.resolvedModelId, 'anthropic/claude-opus-5.5')
    assert.equal(result.resolvedTier, 'frontier')
    assert.equal(result.routingDecisionRef, 'docs/receipts/test-wf-002/routing-decision.json')
  } finally {
    rmSync(repoRoot, { recursive: true, force: true })
  }
})

test('AC4: boilerplate/public resolves to nvidia/nemotron-3.5-lightning/economy', () => {
  const repoRoot = makeTempRepoRoot()
  try {
    const result = evaluateRouting(
      { routing_class: 'boilerplate', data_classification: 'public', workflowId: 'test-wf-003' },
      { repoRoot, pluginRoot: join(repoRoot, 'plugins', 'foreman-line') },
    )
    assert.equal(result.resolvedModelId, 'nvidia/nemotron-3.5-lightning')
    assert.equal(result.resolvedTier, 'economy')
    assert.equal(result.routingDecisionRef, 'docs/receipts/test-wf-003/routing-decision.json')
  } finally {
    rmSync(repoRoot, { recursive: true, force: true })
  }
})

test('AC5: implementation/standard/restricted resolves to anthropic/claude-sonnet-5/standard', () => {
  const repoRoot = makeTempRepoRoot()
  try {
    const result = evaluateRouting(
      {
        routing_class: 'implementation/standard',
        data_classification: 'restricted',
        workflowId: 'test-wf-004',
      },
      { repoRoot, pluginRoot: join(repoRoot, 'plugins', 'foreman-line') },
    )
    assert.equal(result.resolvedModelId, 'anthropic/claude-sonnet-5')
    assert.equal(result.resolvedTier, 'standard')
    assert.equal(result.routingDecisionRef, 'docs/receipts/test-wf-004/routing-decision.json')
  } finally {
    rmSync(repoRoot, { recursive: true, force: true })
  }
})

// ─── AC6: all 12 class × data_classification combinations ────────────────────

interface EvalCase {
  routing_class: string
  data_classification: string
  expectedModel: string
  expectedTier: string
}

const EVAL_MATRIX: EvalCase[] = [
  // boilerplate → economy → nvidia/nemotron-3.5-lightning (all three data tiers)
  {
    routing_class: 'boilerplate',
    data_classification: 'public',
    expectedModel: 'nvidia/nemotron-3.5-lightning',
    expectedTier: 'economy',
  },
  {
    routing_class: 'boilerplate',
    data_classification: 'internal',
    expectedModel: 'nvidia/nemotron-3.5-lightning',
    expectedTier: 'economy',
  },
  {
    routing_class: 'boilerplate',
    data_classification: 'restricted',
    expectedModel: 'nvidia/nemotron-3.5-lightning',
    expectedTier: 'economy',
  },
  // standard-feature → standard → anthropic/claude-sonnet-5 (all three data tiers)
  {
    routing_class: 'standard-feature',
    data_classification: 'public',
    expectedModel: 'anthropic/claude-sonnet-5',
    expectedTier: 'standard',
  },
  {
    routing_class: 'standard-feature',
    data_classification: 'internal',
    expectedModel: 'anthropic/claude-sonnet-5',
    expectedTier: 'standard',
  },
  {
    routing_class: 'standard-feature',
    data_classification: 'restricted',
    expectedModel: 'anthropic/claude-sonnet-5',
    expectedTier: 'standard',
  },
  // architecture/risk → frontier → anthropic/claude-opus-5.5 (all three data tiers)
  {
    routing_class: 'architecture/risk',
    data_classification: 'public',
    expectedModel: 'anthropic/claude-opus-5.5',
    expectedTier: 'frontier',
  },
  {
    routing_class: 'architecture/risk',
    data_classification: 'internal',
    expectedModel: 'anthropic/claude-opus-5.5',
    expectedTier: 'frontier',
  },
  {
    routing_class: 'architecture/risk',
    data_classification: 'restricted',
    expectedModel: 'anthropic/claude-opus-5.5',
    expectedTier: 'frontier',
  },
  // implementation/standard → standard → anthropic/claude-sonnet-5 (all three data tiers)
  {
    routing_class: 'implementation/standard',
    data_classification: 'public',
    expectedModel: 'anthropic/claude-sonnet-5',
    expectedTier: 'standard',
  },
  {
    routing_class: 'implementation/standard',
    data_classification: 'internal',
    expectedModel: 'anthropic/claude-sonnet-5',
    expectedTier: 'standard',
  },
  {
    routing_class: 'implementation/standard',
    data_classification: 'restricted',
    expectedModel: 'anthropic/claude-sonnet-5',
    expectedTier: 'standard',
  },
]

/**
 * Transport requirements are per-classification, not per-model: the same model
 * id carries permissive constraints for public tasks and the strict
 * `deny` + `zdr` pair for anything non-public (policy invariant g). On a
 * multi-provider gateway this pair — not the model id — is what keeps a prompt
 * off providers that store or train on inputs, so the caller must receive it
 * alongside the model.
 */
const STRICT_TRANSPORT = { data_collection: 'deny', zdr: true } as const
const PUBLIC_TRANSPORT = { data_collection: 'allow', zdr: false } as const

for (const { routing_class, data_classification, expectedModel, expectedTier } of EVAL_MATRIX) {
  test(`AC6: ${routing_class}/${data_classification} → ${expectedModel} (${expectedTier})`, () => {
    const repoRoot = makeTempRepoRoot()
    try {
      const wfId = `matrix-${routing_class.replace('/', '-')}-${data_classification}`
      const result = evaluateRouting(
        { routing_class, data_classification, workflowId: wfId },
        { repoRoot, pluginRoot: join(repoRoot, 'plugins', 'foreman-line') },
      )
      assert.equal(result.resolvedModelId, expectedModel)
      assert.equal(result.resolvedTier, expectedTier)
      assert.equal(result.routingDecisionRef, `docs/receipts/${wfId}/routing-decision.json`)
      assert.deepEqual(
        result.transportRequirements,
        data_classification === 'public' ? PUBLIC_TRANSPORT : STRICT_TRANSPORT,
      )
      const receipt = JSON.parse(
        readFileSync(join(repoRoot, result.routingDecisionRef), 'utf8'),
      ) as Record<string, unknown>
      assert.deepEqual(receipt.transportRequirements, result.transportRequirements)
    } finally {
      rmSync(repoRoot, { recursive: true, force: true })
    }
  })
}

// ─── AC7 / PAR-2 regression: 'standard' is NOT a valid ClassName ─────────────

test('PAR-2: routing_class "standard" (old wrong label) throws RoutingError UNKNOWN_CLASS', () => {
  const repoRoot = makeTempRepoRoot()
  try {
    assert.throws(
      () =>
        evaluateRouting(
          { routing_class: 'standard', data_classification: 'internal', workflowId: 'par2-test' },
          { repoRoot, pluginRoot: join(repoRoot, 'plugins', 'foreman-line') },
        ),
      (err: unknown) => {
        assert.ok(err instanceof RoutingError, 'must be a RoutingError')
        assert.equal(err.code, 'UNKNOWN_CLASS')
        return true
      },
    )
  } finally {
    rmSync(repoRoot, { recursive: true, force: true })
  }
})

// ─── AC8: unknown data_classification ────────────────────────────────────────

test('AC8: unrecognised data_classification throws RoutingError UNKNOWN_DATA_CLASSIFICATION', () => {
  const repoRoot = makeTempRepoRoot()
  try {
    assert.throws(
      () =>
        evaluateRouting(
          {
            routing_class: 'standard-feature',
            data_classification: 'top-secret',
            workflowId: 'ac8-test',
          },
          { repoRoot, pluginRoot: join(repoRoot, 'plugins', 'foreman-line') },
        ),
      (err: unknown) => {
        assert.ok(err instanceof RoutingError, 'must be a RoutingError')
        assert.equal(err.code, 'UNKNOWN_DATA_CLASSIFICATION')
        return true
      },
    )
  } finally {
    rmSync(repoRoot, { recursive: true, force: true })
  }
})

// ─── AC9: receipt contains all 8 required fields ─────────────────────────────

test('AC9: receipt JSON contains all 8 required fields with correct values', () => {
  const repoRoot = makeTempRepoRoot()
  const workflowId = 'ac9-receipt-test'
  try {
    evaluateRouting(
      { routing_class: 'standard-feature', data_classification: 'internal', workflowId },
      { repoRoot, pluginRoot: join(repoRoot, 'plugins', 'foreman-line') },
    )

    const receiptPath = join(repoRoot, 'docs', 'receipts', workflowId, 'routing-decision.json')
    const receipt = JSON.parse(readFileSync(receiptPath, 'utf8')) as Record<string, unknown>

    assert.equal(receipt.workflowId, workflowId)
    assert.equal(receipt.routing_class, 'standard-feature')
    assert.equal(receipt.data_classification, 'internal')
    assert.equal(receipt.resolvedTier, 'standard')
    assert.equal(receipt.resolvedModelId, 'anthropic/claude-sonnet-5')
    assert.deepEqual(receipt.transportRequirements, { data_collection: 'deny', zdr: true })
    // The policy is an installed-plugin asset, so its locator is relative to
    // the explicitly injected pluginRoot rather than the caller's repoRoot.
    assert.equal(receipt.policyRef, 'routing-policy/routing-policy.yaml')
    // timestamp must be parseable as ISO 8601
    assert.ok(typeof receipt.timestamp === 'string', 'timestamp must be a string')
    assert.ok(
      !Number.isNaN(Date.parse(receipt.timestamp as string)),
      'timestamp must parse as a valid ISO 8601 date',
    )
  } finally {
    rmSync(repoRoot, { recursive: true, force: true })
  }
})

// ─── AC10: second call overwrites receipt cleanly ────────────────────────────

test('AC10: second call with same workflowId overwrites receipt without error', () => {
  const repoRoot = makeTempRepoRoot()
  const workflowId = 'ac10-overwrite-test'
  try {
    // First call
    evaluateRouting(
      { routing_class: 'standard-feature', data_classification: 'public', workflowId },
      { repoRoot, pluginRoot: join(repoRoot, 'plugins', 'foreman-line') },
    )

    // Second call — same workflowId, different data_classification
    evaluateRouting(
      { routing_class: 'boilerplate', data_classification: 'internal', workflowId },
      { repoRoot, pluginRoot: join(repoRoot, 'plugins', 'foreman-line') },
    )

    const receiptPath = join(repoRoot, 'docs', 'receipts', workflowId, 'routing-decision.json')
    const receipt = JSON.parse(readFileSync(receiptPath, 'utf8')) as Record<string, unknown>

    // Must reflect the second call's values
    assert.equal(receipt.routing_class, 'boilerplate')
    assert.equal(receipt.resolvedModelId, 'nvidia/nemotron-3.5-lightning')
    assert.equal(receipt.resolvedTier, 'economy')
  } finally {
    rmSync(repoRoot, { recursive: true, force: true })
  }
})

// ─── AC11b: POLICY_UNREADABLE when policy YAML is absent ─────────────────────

test('AC11b: missing policy YAML throws RoutingError POLICY_UNREADABLE', () => {
  // Use a bare tmpDir with no policy file
  const emptyRoot = mkdtempSync(join(tmpdir(), 'w2p3-empty-'))
  try {
    assert.throws(
      () =>
        evaluateRouting(
          { routing_class: 'standard-feature', data_classification: 'internal', workflowId: 'x' },
          { repoRoot: emptyRoot, pluginRoot: join(emptyRoot, 'plugins', 'foreman-line') },
        ),
      (err: unknown) => {
        assert.ok(err instanceof RoutingError, 'must be a RoutingError')
        assert.equal(err.code, 'POLICY_UNREADABLE')
        return true
      },
    )
  } finally {
    rmSync(emptyRoot, { recursive: true, force: true })
  }
})

// ─── F-01: malformed YAML surfaces as POLICY_INVALID, not a bare YAMLParseError

test('F-01: malformed routing-policy.yaml throws RoutingError POLICY_INVALID', () => {
  const repoRoot = mkdtempSync(join(tmpdir(), 'w2p3-malformed-'))
  try {
    const policyDir = join(repoRoot, 'plugins', 'foreman-line', 'routing-policy')
    mkdirSync(policyDir, { recursive: true })
    // Write syntactically invalid YAML (unmatched bracket is a parse error)
    writeFileSync(join(policyDir, 'routing-policy.yaml'), 'classes: {invalid: [unclosed')
    assert.throws(
      () =>
        evaluateRouting(
          { routing_class: 'standard-feature', data_classification: 'internal', workflowId: 'f01' },
          { repoRoot, pluginRoot: join(repoRoot, 'plugins', 'foreman-line') },
        ),
      (err: unknown) => {
        assert.ok(err instanceof RoutingError, 'must be a RoutingError, not a bare YAMLParseError')
        assert.equal(err.code, 'POLICY_INVALID')
        return true
      },
    )
  } finally {
    rmSync(repoRoot, { recursive: true, force: true })
  }
})

// ─── MRC-02 C5 — decision/attempt events on the receipt chain ────────────────

const EVENT_WORKFLOW_ID = 'a1b2c3d4-1111-4111-8111-000000000001'

function makeCorrelation(overrides: Partial<CorrelationContext> = {}): CorrelationContext {
  return {
    correlationId: 'a1b2c3d4-2222-4222-8222-000000000002',
    sessionId: 'a1b2c3d4-3333-4333-8333-000000000003',
    workflowId: EVENT_WORKFLOW_ID,
    runId: 'a1b2c3d4-4444-4444-8444-000000000004',
    ...overrides,
  } as unknown as CorrelationContext
}

/** Seeds a fixture-isolated A(0) -> B(1) chain (w4-p0 lineage style). */
function seedChain(repoRoot: string, workflowId: string, correlation: CorrelationContext): void {
  const dir = join(repoRoot, 'docs', 'receipts', workflowId)
  mkdirSync(dir, { recursive: true })
  const base = {
    schemaVersion: '1',
    kind: 'stage',
    claimRef: null,
    correlation,
    timestamp: '2026-09-27T00:00:00.000Z',
    signature: null,
  }
  writeFileSync(
    join(dir, '000000-A-genesis-record.json'),
    JSON.stringify({
      ...base,
      stage: 'A',
      sequence: 0,
      prevHash: null,
      subjectKind: 'GenesisRecord',
      subject: {},
      hash: '1'.repeat(64),
    }),
  )
  writeFileSync(
    join(dir, '000001-B-stage-b-record.json'),
    JSON.stringify({
      ...base,
      stage: 'B',
      sequence: 1,
      prevHash: '1'.repeat(64),
      subjectKind: 'StageBRecord',
      subject: {},
      hash: '2'.repeat(64),
    }),
  )
}

function chainDocs(repoRoot: string, workflowId: string): ReceiptDocument[] {
  const dir = join(repoRoot, 'docs', 'receipts', workflowId)
  return readdirSync(dir)
    .filter((name) => /^\d{6}-[A-F]-/.test(name))
    .sort()
    .map((name) => JSON.parse(readFileSync(join(dir, name), 'utf8')) as ReceiptDocument)
}

const UNKNOWN_COST = {
  tag: 'unknown',
  amount: null,
  currency: null,
  price_source: null,
  price_version: null,
}

test('C5: the cold path emits decision + attempt events correlated to the existing chain', () => {
  const repoRoot = makeTempRepoRoot()
  const correlation = makeCorrelation()
  try {
    seedChain(repoRoot, EVENT_WORKFLOW_ID, correlation)
    const result = evaluateRouting(
      {
        routing_class: 'standard-feature',
        data_classification: 'internal',
        workflowId: EVENT_WORKFLOW_ID,
        correlation,
      },
      { repoRoot, pluginRoot: join(repoRoot, 'plugins', 'foreman-line') },
    )
    assert.equal(result.resolvedModelId, 'anthropic/claude-sonnet-5')

    const chain = chainDocs(repoRoot, EVENT_WORKFLOW_ID)
    assert.deepEqual(
      chain.map((doc) => doc.subjectKind),
      ['GenesisRecord', 'StageBRecord', 'RoutingDecisionEvent', 'RoutingAttemptEvent'],
    )
    assert.deepEqual(
      chain.map((doc) => doc.sequence),
      [0, 1, 2, 3],
    )
    // append-only at the existing tip, never forked
    assert.equal(chain[2]?.prevHash, '2'.repeat(64))
    assert.equal(chain[3]?.prevHash, chain[2]?.hash)
    for (const doc of [chain[2], chain[3]]) {
      assert.deepEqual(doc?.correlation, correlation)
    }
    const chainResult = validateChain(chain)
    assert.equal(chainResult.valid, true, JSON.stringify(chainResult.errors))

    const decision = chain[2]?.subject as unknown as RoutingDecisionSubject
    assert.equal(decision.reason, 'ROUTE_SELECTED')
    assert.equal(decision.bindings.policy_digest.version, 'routing-policy/routing-policy.yaml')
    assert.match(decision.bindings.policy_digest.content_digest, /^[0-9a-f]{64}$/)
    assert.match(decision.bindings.catalog_snapshot_digest, /^[0-9a-f]{64}$/)
    assert.equal(decision.bindings.vocabulary_version, '1.0.0')
    assert.deepEqual(decision.bindings.derived_context_floor, {
      required_context_tokens: null,
      required_output_tokens: null,
    })
    assert.deepEqual(decision.bindings.predicate_set, [
      'class_allowlist',
      'data_class_eligible_models',
      // C4.3 (MRC-05, named pin update): the decision's applied-predicate set
      // legitimately grew — the walk always runs the C3 capability gate now.
      'capability_predicate',
    ])
    // C4's enriched identity feeds the selected-identity binding
    assert.deepEqual(decision.bindings.selected_identity, {
      registry_key: 'anthropic/claude-sonnet-5',
      provider_local_id: 'anthropic/claude-sonnet-5',
      protocol: 'openai-chat-completions',
      pi_host_model_id: 'claude-sonnet-5',
    })
    // truthful provenance: unknown cost stays unknown; nothing is imputed
    assert.deepEqual(decision.provenance.cost, UNKNOWN_COST)
    assert.equal(decision.provenance.failure, null)
    assert.equal(decision.provenance.latency_ms, null)
    assert.equal(decision.provenance.occurrence, 1)

    const attempt = chain[3]?.subject as unknown as RoutingAttemptSubject
    assert.equal(attempt.reason, 'ATTEMPT_SUCCEEDED')
    assert.equal(attempt.provenance.occurrence, 1)
    assert.equal(attempt.provenance.retries, 0)
    assert.deepEqual(attempt.provenance.cost, UNKNOWN_COST)

    // the routing-decision.json summary gains the C1 binding fields additively
    const summary = JSON.parse(
      readFileSync(
        join(repoRoot, 'docs', 'receipts', EVENT_WORKFLOW_ID, 'routing-decision.json'),
        'utf8',
      ),
    ) as Record<string, unknown>
    assert.equal(summary.resolvedModelId, 'anthropic/claude-sonnet-5')
    assert.deepEqual(summary.replayBindings, decision.bindings)
  } finally {
    rmSync(repoRoot, { recursive: true, force: true })
  }
})

test('C5: cache hit/miss events accumulate — repeated hits are never deduplicated', () => {
  const repoRoot = makeTempRepoRoot()
  const correlation = makeCorrelation()
  const store = new FileRoutingCacheStore(join(repoRoot, 'cache-store.json'))
  const cache = new RoutingDecisionCache(store, { ttlSeconds: 3600 })
  try {
    seedChain(repoRoot, EVENT_WORKFLOW_ID, correlation)
    const input = {
      routing_class: 'implementation/standard',
      data_classification: 'internal',
      workflowId: EVENT_WORKFLOW_ID,
      correlation,
    }
    const options = {
      repoRoot,
      pluginRoot: join(repoRoot, 'plugins', 'foreman-line'),
      cache,
    }
    evaluateRouting(input, options) // miss → identical cold path
    evaluateRouting(input, options) // hit
    evaluateRouting(input, options) // hit again

    const chain = chainDocs(repoRoot, EVENT_WORKFLOW_ID)
    const cacheEvents = chain
      .filter((doc) => doc.subjectKind === 'RoutingCacheEvent')
      .map((doc) => doc.subject as unknown as RoutingCacheSubject)
    assert.deepEqual(
      cacheEvents.map((event) => event.reason),
      ['CACHE_MISS', 'CACHE_HIT', 'CACHE_HIT'],
    )
    assert.deepEqual(
      cacheEvents.map((event) => event.provenance.occurrence),
      [1, 2, 3],
    )
    assert.deepEqual(
      cacheEvents.map((event) => event.cache_key.policy_digest),
      Array.from({ length: 3 }, () => cacheEvents[0]?.cache_key.policy_digest),
    )

    const decisions = chain.filter((doc) => doc.subjectKind === 'RoutingDecisionEvent')
    assert.equal(decisions.length, 3)
    // only the miss call resolved; the hits reuse the cached decision
    const attempts = chain.filter((doc) => doc.subjectKind === 'RoutingAttemptEvent')
    assert.equal(attempts.length, 1)

    // every recorded event carries explicit unknown cost provenance — nothing
    // is ever tagged billed or estimated at this seam
    for (const doc of chain.filter((entry) => entry.subjectKind.endsWith('Event'))) {
      const subject = doc.subject as unknown as { provenance: EventProvenance }
      assert.deepEqual(subject.provenance.cost, UNKNOWN_COST)
    }
    const chainResult = validateChain(chain)
    assert.equal(chainResult.valid, true, JSON.stringify(chainResult.errors))
  } finally {
    store.close()
    rmSync(repoRoot, { recursive: true, force: true })
  }
})

test('C5: retries are recorded as repeated attempts, never deduplicated', () => {
  const repoRoot = makeTempRepoRoot()
  const correlation = makeCorrelation()
  try {
    seedChain(repoRoot, EVENT_WORKFLOW_ID, correlation)
    const input = {
      routing_class: 'boilerplate',
      data_classification: 'public',
      workflowId: EVENT_WORKFLOW_ID,
      correlation,
    }
    const options = { repoRoot, pluginRoot: join(repoRoot, 'plugins', 'foreman-line') }
    evaluateRouting(input, options)
    evaluateRouting(input, options)

    const attempts = chainDocs(repoRoot, EVENT_WORKFLOW_ID)
      .filter((doc) => doc.subjectKind === 'RoutingAttemptEvent')
      .map((doc) => doc.subject as unknown as RoutingAttemptSubject)
    assert.equal(attempts.length, 2)
    assert.deepEqual(
      attempts.map((event) => event.provenance.occurrence),
      [1, 2],
    )
    assert.deepEqual(
      attempts.map((event) => event.provenance.retries),
      [0, 1],
    )
  } finally {
    rmSync(repoRoot, { recursive: true, force: true })
  }
})

// A minimal post-cutover policy whose economy group is outside the internal
// eligibility — its binding declares `data_classes: [public]` only — so
// boilerplate/internal has no eligible model. All five representation blocks
// are present (required since CUTOVER-P4) and the document passes
// validatePolicy (migrated from the pre-cutover legacy-only shape).
const NO_MODEL_POLICY = `classes:
  boilerplate: { allowlist: [economy], ceiling_usd: 0.5 }
  standard-feature: { allowlist: [standard], ceiling_usd: 5.0 }
  architecture/risk: { allowlist: [frontier], ceiling_usd: 25.0 }
  implementation/standard: { allowlist: [standard], ceiling_usd: 5.0 }
data_classification:
  public: { transport_requirements: { data_collection: allow, zdr: false } }
  internal: { transport_requirements: { data_collection: deny, zdr: true } }
  restricted: { transport_requirements: { data_collection: deny, zdr: true } }
selection_order:
  frontier: [claude-opus-5-5]
  standard: [claude-sonnet-5]
  economy: [claude-haiku-4.5]
shadow_routes: {}
compatibility: { representation: provider-neutral-fallback-contract, version: 1, legacy_representation: { blocks: [model_tiers, roles, data_classification.eligible_models], id_vocabulary: openrouter-slug-only, status: deprecated, removal_serialized_into: PMC-P4 } }
ranking_contract: { inputs: { R1: data-class eligibility, R2: required capability, R3: independence obligation, R4: available context, R5: remaining budget, R6: verified availability, R7: recorded quality score }, eligibility_filters: [R1, R2, R3, R4, R6], budget_ordering_lane: L5, quality_ordering_key: R7, stable_order: [declared-matrix-role, provider, model-id], evidence_threshold: { rankable_requires: R1-R6-definite-true-from-a-named-source-and-R7-recorded-for-this-lane, on_unknown: refuse }, attested_states: [static-conformance, live-availability, model-quality] }
lane_map:
  L1: { role_family: coordinator, subroles: [coordinator], routing_classes: [architecture/risk], authority_cap: [coordinate], authority_prohibited: [merge], frontier_only: true, independence: not-applicable, human_gates: [gate-2], provider_rule: { kind: pinned-provider, pinned_provider: { state: unavailable, residual: L1_PINNED_PROVIDER_UNSET } }, quality_tolerance: { state: unavailable, residual: DELTA_L_UNSET } }
  L2: { role_family: verifier, subroles: [verifier], routing_classes: [architecture/risk], authority_cap: [verdict], authority_prohibited: [merge], frontier_only: true, independence: required, human_gates: [gate-2], provider_rule: { kind: pinned-provider, pinned_provider: { state: unavailable, residual: L2_PINNED_PROVIDER_UNSET } }, quality_tolerance: { state: unavailable, residual: DELTA_L_UNSET } }
  L3: { role_family: builder, subroles: [builder], routing_classes: [implementation/complex], authority_cap: [execution-within-allowed-files], authority_prohibited: [merge], frontier_only: false, independence: not-applicable, human_gates: [gate-2], provider_rule: { kind: declared-preference, preference: { state: unavailable, residual: L3_PROVIDER_PREFERENCE_UNSET } }, quality_tolerance: { state: unavailable, residual: DELTA_L_UNSET } }
  L4: { role_family: builder, subroles: [builder], routing_classes: [standard-feature], authority_cap: [execution-within-allowed-files], authority_prohibited: [merge], frontier_only: false, independence: not-applicable, human_gates: [gate-2], provider_rule: { kind: declared-preference, preference: { state: unavailable, residual: L4_PROVIDER_PREFERENCE_UNSET } }, quality_tolerance: { state: unavailable, residual: DELTA_L_UNSET } }
  L5: { role_family: builder, subroles: [builder], routing_classes: [boilerplate], authority_cap: [execution-within-allowed-files], authority_prohibited: [merge], frontier_only: false, independence: never-a-verifier, human_gates: [gate-2], provider_rule: { kind: cheapest-eligible }, quality_tolerance: { state: unavailable, residual: DELTA_L_UNSET } }
  L6: { role_family: classifier, subroles: [routing-classifier], routing_classes: [routing/classification], authority_cap: [recommend-only], authority_prohibited: [merge], frontier_only: false, independence: not-applicable, human_gates: [reattestation-by-ratified-amendment], provider_rule: { kind: none, refusal: LANE_DISABLED_REFUSED }, quality_tolerance: { state: unavailable, residual: DELTA_L_UNSET }, status: disabled-refused, re_enablement: ratified-amendment-required, re_enablement_candidates: [opencode/qwen3.8-flash, opencode/glm-5.3-flash] }
candidates:
  claude-opus-5-5:
    family: anthropic
    bindings:
      - id: openrouter/anthropic/claude-opus-5.5
        provider: openrouter
        model: anthropic/claude-opus-5.5
        family: anthropic
        identity: { state: resolved, source: synthetic }
        endpoint: { registered: https://openrouter.ai/api/v1, catalogue: null, alignment: unknown }
        data_classes: { state: declared, value: [public, internal], source: synthetic }
        capabilities: { tool-use: unverified, structured-output: unverified }
        context_window_tokens: { state: unknown, residual: CONTEXT_UNKNOWN }
        max_output_tokens: { state: unknown, residual: CONTEXT_UNKNOWN }
        cost: { state: unknown, residual: COST_UNKNOWN }
        availability: { state: unproven, residual: AVAILABILITY_UNVERIFIED }
        quality: { state: unproven, residual: QUALITY_UNRECORDED }
  claude-sonnet-5:
    family: anthropic
    bindings:
      - id: openrouter/anthropic/claude-sonnet-5
        provider: openrouter
        model: anthropic/claude-sonnet-5
        family: anthropic
        identity: { state: resolved, source: synthetic }
        endpoint: { registered: https://openrouter.ai/api/v1, catalogue: null, alignment: unknown }
        data_classes: { state: declared, value: [public, internal, restricted], source: synthetic }
        capabilities: { tool-use: unverified, structured-output: unverified }
        context_window_tokens: { state: unknown, residual: CONTEXT_UNKNOWN }
        max_output_tokens: { state: unknown, residual: CONTEXT_UNKNOWN }
        cost: { state: unknown, residual: COST_UNKNOWN }
        availability: { state: unproven, residual: AVAILABILITY_UNVERIFIED }
        quality: { state: unproven, residual: QUALITY_UNRECORDED }
  claude-haiku-4.5:
    family: anthropic
    bindings:
      - id: openrouter/anthropic/claude-haiku-4.5
        provider: openrouter
        model: anthropic/claude-haiku-4.5
        family: anthropic
        identity: { state: resolved, source: synthetic }
        endpoint: { registered: https://openrouter.ai/api/v1, catalogue: null, alignment: unknown }
        data_classes: { state: declared, value: [public], source: synthetic }
        capabilities: { tool-use: unverified, structured-output: unverified }
        context_window_tokens: { state: unknown, residual: CONTEXT_UNKNOWN }
        max_output_tokens: { state: unknown, residual: CONTEXT_UNKNOWN }
        cost: { state: unknown, residual: COST_UNKNOWN }
        availability: { state: unproven, residual: AVAILABILITY_UNVERIFIED }
        quality: { state: unproven, residual: QUALITY_UNRECORDED }
lane_routes: []
`

test('C5: a failed call is never recorded as success', () => {
  const repoRoot = mkdtempSync(join(tmpdir(), 'w2p3-failure-'))
  const correlation = makeCorrelation()
  try {
    const policyDir = join(repoRoot, 'plugins', 'foreman-line', 'routing-policy')
    mkdirSync(policyDir, { recursive: true })
    writeFileSync(join(policyDir, 'routing-policy.yaml'), NO_MODEL_POLICY)
    seedChain(repoRoot, EVENT_WORKFLOW_ID, correlation)

    assert.throws(
      () =>
        evaluateRouting(
          {
            routing_class: 'boilerplate',
            data_classification: 'internal',
            workflowId: EVENT_WORKFLOW_ID,
            correlation,
          },
          { repoRoot, pluginRoot: join(repoRoot, 'plugins', 'foreman-line') },
        ),
      (err: unknown) => {
        assert.ok(err instanceof RoutingError)
        assert.equal(err.code, 'NO_ELIGIBLE_MODEL')
        return true
      },
    )

    const chain = chainDocs(repoRoot, EVENT_WORKFLOW_ID)
    assert.deepEqual(
      chain.map((doc) => doc.subjectKind),
      ['GenesisRecord', 'StageBRecord', 'RoutingDecisionEvent', 'RoutingAttemptEvent'],
    )
    const decision = chain[2]?.subject as unknown as RoutingDecisionSubject
    assert.equal(decision.reason, 'ROUTE_UNAVAILABLE')
    assert.equal(typeof decision.provenance.failure, 'string')
    assert.deepEqual(decision.bindings.selected_identity, {
      registry_key: null,
      provider_local_id: null,
      protocol: null,
      pi_host_model_id: null,
    })
    const attempt = chain[3]?.subject as unknown as RoutingAttemptSubject
    assert.equal(attempt.reason, 'ATTEMPT_FAILED')
    assert.equal(typeof attempt.provenance.failure, 'string')
    // no success-shaped event exists on this chain
    assert.equal(
      chain.some((doc) => {
        const subject = doc.subject as unknown as { reason?: string }
        return subject.reason === 'ROUTE_SELECTED' || subject.reason === 'ATTEMPT_SUCCEEDED'
      }),
      false,
    )
  } finally {
    rmSync(repoRoot, { recursive: true, force: true })
  }
})

// ─── MRC-05 C3: dispatch-gate unit controls ──────────────────────────────────

test('C3 gate unit: REQUIREMENTS_UNSATISFIABLE names the failing predicate per candidate', () => {
  const repoRoot = makeTempRepoRoot()
  try {
    // The shipped bindings carry typed-unavailable (unknown) input facts: an
    // image-bearing request refuses every candidate by NAME (INPUTS_UNKNOWN —
    // D2/a54: an unknown model-side fact is never guessed).
    assert.throws(
      () =>
        evaluateRouting(
          {
            routing_class: 'boilerplate',
            data_classification: 'public',
            workflowId: 'gate-unit-1',
            required_inputs: ['text', 'image'],
          },
          { repoRoot, pluginRoot: join(repoRoot, 'plugins', 'foreman-line') },
        ),
      (err: unknown) => {
        assert.ok(err instanceof RoutingError)
        assert.equal(err.code, 'REQUIREMENTS_UNSATISFIABLE')
        assert.ok(
          err.message.includes('INPUTS_UNKNOWN'),
          `the typed error names the failing predicate: ${err.message}`,
        )
        // C3.3: the detail carries name + detail PER CANDIDATE, not a bare
        // "nothing selected".
        assert.ok(
          err.message.includes("INPUTS_UNKNOWN: model '"),
          `the detail names each failing candidate: ${err.message}`,
        )
        return true
      },
    )
    // Falsifiability pair: the identical request under the text baseline still
    // resolves to the first-eligible — the gate is requirement-scoped and the
    // walk order is intact (removing the gate turns the refusal above red).
    const result = evaluateRouting(
      { routing_class: 'boilerplate', data_classification: 'public', workflowId: 'gate-unit-1b' },
      { repoRoot, pluginRoot: join(repoRoot, 'plugins', 'foreman-line') },
    )
    assert.equal(result.resolvedModelId, 'nvidia/nemotron-3.5-lightning')
  } finally {
    rmSync(repoRoot, { recursive: true, force: true })
  }
})

test('C3 gate unit: a declared min_context floor is strict — below-floor and unknown facts refuse', () => {
  const repoRoot = makeTempRepoRoot()
  try {
    // Above every shipped declared context window: declared facts fall below
    // the floor (CONTEXT_INSUFFICIENT) and unknown facts refuse (CONTEXT_UNKNOWN)
    // — a floor is a hard correctness bound, never a soft preference.
    assert.throws(
      () =>
        evaluateRouting(
          {
            routing_class: 'boilerplate',
            data_classification: 'public',
            workflowId: 'gate-unit-2',
            required_context_tokens: 2_000_000,
          },
          { repoRoot, pluginRoot: join(repoRoot, 'plugins', 'foreman-line') },
        ),
      (err: unknown) => {
        assert.ok(err instanceof RoutingError)
        assert.equal(err.code, 'REQUIREMENTS_UNSATISFIABLE')
        assert.ok(
          err.message.includes('CONTEXT_INSUFFICIENT'),
          `the typed error names the failing predicate: ${err.message}`,
        )
        return true
      },
    )
    // Absent floor = no predicate (and no 'context_floor' in the predicate set).
    const result = evaluateRouting(
      { routing_class: 'boilerplate', data_classification: 'public', workflowId: 'gate-unit-2b' },
      { repoRoot, pluginRoot: join(repoRoot, 'plugins', 'foreman-line') },
    )
    assert.equal(result.resolvedModelId, 'nvidia/nemotron-3.5-lightning')
    const summary = JSON.parse(
      readFileSync(
        join(repoRoot, 'docs', 'receipts', 'gate-unit-2b', 'routing-decision.json'),
        'utf8',
      ),
    ) as { replayBindings: { predicate_set: string[] } }
    assert.deepEqual(summary.replayBindings.predicate_set, [
      'class_allowlist',
      'data_class_eligible_models',
      'capability_predicate',
    ])
  } finally {
    rmSync(repoRoot, { recursive: true, force: true })
  }
})

test('C3 gate unit: evaluations record every gate candidate in walk order; unknown thinking support is carried, not filtered', () => {
  const repoRoot = makeTempRepoRoot()
  try {
    // The resolved level is always known; shipped bindings declare no
    // thinking_levels (unknown support) — the charter's qualifier: unknown
    // support is NOT filtered, the level is carried and enforced where
    // supported (C5).
    const result = evaluateRouting(
      {
        routing_class: 'boilerplate',
        data_classification: 'public',
        workflowId: 'gate-unit-3',
        required_thinking_level: 'high',
      },
      { repoRoot, pluginRoot: join(repoRoot, 'plugins', 'foreman-line') },
    )
    assert.equal(result.resolvedModelId, 'nvidia/nemotron-3.5-lightning')
    const summary = JSON.parse(
      readFileSync(
        join(repoRoot, 'docs', 'receipts', 'gate-unit-3', 'routing-decision.json'),
        'utf8',
      ),
    ) as {
      replayBindings: {
        effective_requirements: { required_inputs: string[]; required_thinking_level: string }
      }
      evaluations: { model: string; eligible: boolean; refusals: unknown[] }[]
    }
    // C4.1 carry: the effective requirements are bound in the decision receipt.
    assert.deepEqual(summary.replayBindings.effective_requirements.required_inputs, ['text'])
    assert.equal(summary.replayBindings.effective_requirements.required_thinking_level, 'high')
    // C3.4 route explanation (D7): per candidate in walk order — the selected
    // first-eligible leads; every gate candidate is recorded, none bare.
    assert.ok(Array.isArray(summary.evaluations) && summary.evaluations.length > 0)
    assert.equal(summary.evaluations[0]?.model, result.resolvedModelId)
    for (const evaluation of summary.evaluations) {
      assert.equal(evaluation.eligible, true, `${evaluation.model} passes the gate`)
      assert.deepEqual(evaluation.refusals, [])
    }
  } finally {
    rmSync(repoRoot, { recursive: true, force: true })
  }
})

test('C3.5 warm/cold parity: identical requirements warm-reuse; differing requirements never share an entry', () => {
  const repoRoot = makeTempRepoRoot()
  const store = new FileRoutingCacheStore(join(repoRoot, 'cache-store.json'))
  const cache = new RoutingDecisionCache(store, { ttlSeconds: 3600 })
  try {
    const base = {
      routing_class: 'boilerplate',
      data_classification: 'public',
      required_thinking_level: 'high' as const,
    }
    const options = {
      repoRoot,
      pluginRoot: join(repoRoot, 'plugins', 'foreman-line'),
      cache,
    }
    const cold = evaluateRouting({ ...base, workflowId: 'parity-cold' }, options)
    const warm = evaluateRouting({ ...base, workflowId: 'parity-warm' }, options)
    // identical requirements → the warm value equals the cold value
    assert.equal(warm.resolvedModelId, cold.resolvedModelId)
    assert.equal(warm.resolvedTier, cold.resolvedTier)
    assert.deepEqual(warm.transportRequirements, cold.transportRequirements)
    // differing requirements never share a cache entry — the changed level is
    // a distinct key, so the call is a typed miss, never a cross-requirement hit
    const other = evaluateRouting(
      { ...base, required_thinking_level: 'max', workflowId: 'parity-other' },
      options,
    )
    assert.equal(typeof other.resolvedModelId, 'string')
    assert.deepEqual(
      cache.diagnostics.map((d) => d.kind),
      ['miss', 'remembered', 'hit', 'miss', 'remembered'],
    )
  } finally {
    store.close()
    rmSync(repoRoot, { recursive: true, force: true })
  }
})

test('C5: a correlation whose chain key disagrees refuses with CORRELATION_MISMATCH', () => {
  const repoRoot = makeTempRepoRoot()
  const correlation = makeCorrelation({
    workflowId: 'a1b2c3d4-9999-4999-8999-000000000009',
  } as Partial<CorrelationContext>)
  try {
    assert.throws(
      () =>
        evaluateRouting(
          {
            routing_class: 'standard-feature',
            data_classification: 'internal',
            workflowId: EVENT_WORKFLOW_ID,
            correlation,
          },
          { repoRoot, pluginRoot: join(repoRoot, 'plugins', 'foreman-line') },
        ),
      (err: unknown) => {
        assert.ok(err instanceof RoutingError)
        assert.equal(err.code, 'CORRELATION_MISMATCH')
        return true
      },
    )
  } finally {
    rmSync(repoRoot, { recursive: true, force: true })
  }
})

test('C5: without correlation no chain entries are written (legacy behavior unchanged)', () => {
  const repoRoot = makeTempRepoRoot()
  try {
    const result = evaluateRouting(
      {
        routing_class: 'standard-feature',
        data_classification: 'internal',
        workflowId: 'legacy-no-correlation',
      },
      { repoRoot, pluginRoot: join(repoRoot, 'plugins', 'foreman-line') },
    )
    assert.equal(result.resolvedModelId, 'anthropic/claude-sonnet-5')
    assert.equal(chainDocs(repoRoot, 'legacy-no-correlation').length, 0)
  } finally {
    rmSync(repoRoot, { recursive: true, force: true })
  }
})

test('C5: the summary binds the policy digest of the exact policy bytes', () => {
  const repoRoot = makeTempRepoRoot()
  const correlation = makeCorrelation()
  try {
    seedChain(repoRoot, EVENT_WORKFLOW_ID, correlation)
    evaluateRouting(
      {
        routing_class: 'standard-feature',
        data_classification: 'internal',
        workflowId: EVENT_WORKFLOW_ID,
        correlation,
      },
      { repoRoot, pluginRoot: join(repoRoot, 'plugins', 'foreman-line') },
    )
    const policyBytes = readFileSync(
      join(repoRoot, 'plugins', 'foreman-line', 'routing-policy', 'routing-policy.yaml'),
    )
    const expected = createHash('sha256').update(policyBytes).digest('hex')
    const summary = JSON.parse(
      readFileSync(
        join(repoRoot, 'docs', 'receipts', EVENT_WORKFLOW_ID, 'routing-decision.json'),
        'utf8',
      ),
    ) as { replayBindings: { policy_digest: { content_digest: string } } }
    assert.equal(summary.replayBindings.policy_digest.content_digest, expected)
  } finally {
    rmSync(repoRoot, { recursive: true, force: true })
  }
})
