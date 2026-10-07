/**
 * HRO-P2 routing-decision cache tests (hybrid-routing-optimization charter D4).
 *
 * Coverage (charter HRO-P2 row + D4 acceptance bullets):
 *   - cold/warm parity: identical decisions and receipt fields, fresh receipt per dispatch
 *   - invalidation: policy byte change and TTL expiry are typed misses that re-evaluate
 *   - revalidation of dynamic gates: input gates enforced identically on warm and cold
 *   - corrupt cache cannot weaken authorization: tampered/unsealed records fall to the
 *     cold path and the TRUE decision is returned
 *   - unavailable store degrades to the identical cold path
 *   - key separation: every key input changes the canonical key
 *   - store semantics: uniqueness by key, bounded eviction, explicit concurrency
 *     refusal (lockfile), corrupt-document quarantine, open/close lifecycle
 *
 * All tests use fresh tmpDir fixtures (see makeTempRepoRoot) so no production
 * receipts or cache files are touched.
 */
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  CacheStoreConflictError,
  canonicalRoutingCacheKey,
  computeRoutingCacheRecordSeal,
  FileRoutingCacheStore,
  ROUTING_CACHE_SCHEMA_VERSION,
  type RoutingCacheKeyParts,
  type RoutingCacheRecord,
  type RoutingCacheStore,
  RoutingDecisionCache,
} from '../src/routing-cache.js'
import { evaluateRouting, RoutingError } from '../src/routing-eval/index.js'

// ─── Fixture helpers ──────────────────────────────────────────────────────────

const REAL_POLICY_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'routing-policy',
  'routing-policy.yaml',
)

function makeTempRepoRoot(): string {
  const tempRoot = mkdtempSync(join(tmpdir(), 'hrop2-test-'))
  const policyDir = join(tempRoot, 'plugins', 'foreman-line', 'routing-policy')
  mkdirSync(policyDir, { recursive: true })
  writeFileSync(join(policyDir, 'routing-policy.yaml'), readFileSync(REAL_POLICY_PATH, 'utf8'))
  return tempRoot
}

function optionsFor(
  repoRoot: string,
  cache?: RoutingDecisionCache,
): {
  repoRoot: string
  pluginRoot: string
  cache?: RoutingDecisionCache
} {
  return cache === undefined
    ? { repoRoot, pluginRoot: join(repoRoot, 'plugins', 'foreman-line') }
    : { repoRoot, pluginRoot: join(repoRoot, 'plugins', 'foreman-line'), cache }
}

const STANDARD_INPUT = {
  routing_class: 'standard-feature',
  data_classification: 'internal',
  workflowId: 'hrop2-a',
} as const

/** In-memory store with controllable failure/tamper seams. */
class TestStore implements RoutingCacheStore {
  records = new Map<string, RoutingCacheRecord>()
  failGet = false
  failUpsert = false
  get(key: string): RoutingCacheRecord | undefined {
    if (this.failGet) throw new Error('store offline')
    return this.records.get(key)
  }
  upsert(record: RoutingCacheRecord): void {
    if (this.failUpsert) throw new Error('store read-only')
    this.records.set(record.key, record)
  }
  invalidateAll(): void {
    this.records.clear()
  }
  close(): void {}
}

function baseParts(): RoutingCacheKeyParts {
  return {
    schemaVersion: ROUTING_CACHE_SCHEMA_VERSION,
    policyDigest: 'digest-a',
    routing_class: 'standard-feature',
    data_classification: 'internal',
  }
}

// ─── Cold/warm parity (HRO-P2) ───────────────────────────────────────────────

test('HRO-P2 cold/warm parity: a hit returns the identical decision fields and a fresh receipt', () => {
  const repoRoot = makeTempRepoRoot()
  const cache = new RoutingDecisionCache(new TestStore(), { ttlSeconds: 600 })
  try {
    const cold = evaluateRouting(
      { ...STANDARD_INPUT, workflowId: 'cold' },
      optionsFor(repoRoot, cache),
    )
    const warm = evaluateRouting(
      { ...STANDARD_INPUT, workflowId: 'warm' },
      optionsFor(repoRoot, cache),
    )
    assert.equal(warm.resolvedModelId, cold.resolvedModelId)
    assert.equal(warm.resolvedTier, cold.resolvedTier)
    assert.deepEqual(warm.transportRequirements, cold.transportRequirements)

    const coldReceipt = JSON.parse(
      readFileSync(join(repoRoot, 'docs', 'receipts', 'cold', 'routing-decision.json'), 'utf8'),
    )
    const warmReceipt = JSON.parse(
      readFileSync(join(repoRoot, 'docs', 'receipts', 'warm', 'routing-decision.json'), 'utf8'),
    )
    // R2 (ruled — the C3.4 scoping is voided): a warm hit REPLAYS the cold
    // walk's route explanation into its receipt — D7 binds every decision's
    // evidence, cache-enabled callers included (ruling C: the cache is a memo
    // of the evaluator's own output, evaluations included). Full-receipt
    // parity holds INCLUDING `evaluations`.
    assert.ok(Array.isArray(coldReceipt.evaluations), 'cold receipt records the route explanation')
    assert.deepEqual(warmReceipt.evaluations, coldReceipt.evaluations)
    delete coldReceipt.timestamp
    delete warmReceipt.timestamp
    delete coldReceipt.workflowId
    delete warmReceipt.workflowId
    assert.deepEqual(warmReceipt, coldReceipt)

    const kinds = cache.diagnostics.map((d) => d.kind)
    assert.deepEqual(kinds, ['miss', 'remembered', 'hit'])
  } finally {
    rmSync(repoRoot, { recursive: true, force: true })
  }
})

test('HRO-P2 absent cache preserves cold-only behavior byte-for-byte', () => {
  const withCacheRoot = makeTempRepoRoot()
  const withoutCacheRoot = makeTempRepoRoot()
  try {
    const cache = new RoutingDecisionCache(new TestStore(), { ttlSeconds: 600 })
    const a = evaluateRouting(
      { ...STANDARD_INPUT, workflowId: 'a' },
      optionsFor(withCacheRoot, cache),
    )
    const b = evaluateRouting({ ...STANDARD_INPUT, workflowId: 'b' }, optionsFor(withoutCacheRoot))
    assert.equal(b.resolvedModelId, a.resolvedModelId)
    assert.equal(b.resolvedTier, a.resolvedTier)
    assert.deepEqual(b.transportRequirements, a.transportRequirements)
  } finally {
    rmSync(withCacheRoot, { recursive: true, force: true })
    rmSync(withoutCacheRoot, { recursive: true, force: true })
  }
})

// ─── Invalidation and expiry (HRO-P2) ────────────────────────────────────────

test('HRO-P2 policy byte change invalidates via key divergence and re-evaluates', () => {
  const repoRoot = makeTempRepoRoot()
  const cache = new RoutingDecisionCache(new TestStore(), { ttlSeconds: 600 })
  try {
    evaluateRouting({ ...STANDARD_INPUT, workflowId: 'first' }, optionsFor(repoRoot, cache))
    const policyPath = join(
      repoRoot,
      'plugins',
      'foreman-line',
      'routing-policy',
      'routing-policy.yaml',
    )
    writeFileSync(policyPath, `${readFileSync(policyPath, 'utf8')}\n# changed\n`, 'utf8')
    const after = evaluateRouting(
      { ...STANDARD_INPUT, workflowId: 'second' },
      optionsFor(repoRoot, cache),
    )
    const expected = evaluateRouting(
      { ...STANDARD_INPUT, workflowId: 'expected' },
      optionsFor(repoRoot),
    )
    assert.equal(after.resolvedModelId, expected.resolvedModelId)

    // The policy digest is part of the key (D4), so a changed policy diverges
    // the key entirely: a plain miss, never a stale hit. The 'policy-changed'
    // diagnostic is reserved for digest-mismatched records at a matching key
    // (mixed/tampered store content).
    const kinds = cache.diagnostics.map((d) => d.kind)
    assert.deepEqual(kinds, ['miss', 'remembered', 'miss', 'remembered'])
  } finally {
    rmSync(repoRoot, { recursive: true, force: true })
  }
})

test('HRO-P2 TTL expiry is a typed miss and re-evaluates', () => {
  const repoRoot = makeTempRepoRoot()
  let nowMs = Date.parse('2026-09-27T00:00:00Z')
  const cache = new RoutingDecisionCache(new TestStore(), {
    ttlSeconds: 60,
    now: () => new Date(nowMs),
  })
  try {
    evaluateRouting({ ...STANDARD_INPUT, workflowId: 't0' }, optionsFor(repoRoot, cache))
    nowMs += 61_000
    const later = evaluateRouting(
      { ...STANDARD_INPUT, workflowId: 't1' },
      optionsFor(repoRoot, cache),
    )
    const expected = evaluateRouting(
      { ...STANDARD_INPUT, workflowId: 'expected' },
      optionsFor(repoRoot),
    )
    assert.equal(later.resolvedModelId, expected.resolvedModelId)

    const kinds = cache.diagnostics.map((d) => d.kind)
    assert.deepEqual(kinds, ['miss', 'remembered', 'expired', 'remembered'])
  } finally {
    rmSync(repoRoot, { recursive: true, force: true })
  }
})

// ─── Corruption and unavailability cannot weaken authorization (HRO-P2) ──────

test('HRO-P2 a tampered cache record is a typed miss and the TRUE decision is returned', () => {
  const repoRoot = makeTempRepoRoot()
  const store = new TestStore()
  const cache = new RoutingDecisionCache(store, { ttlSeconds: 600 })
  try {
    const honest = evaluateRouting(
      { ...STANDARD_INPUT, workflowId: 'honest' },
      optionsFor(repoRoot, cache),
    )
    // Corrupt the stored record's decision WITHOUT re-sealing (the corruption
    // class this design detects).
    const [key, record] = [...store.records.entries()][0] as [string, RoutingCacheRecord]
    store.records.set(key, { ...record, resolvedModelId: 'evil/injected-model' })

    const afterTamper = evaluateRouting(
      { ...STANDARD_INPUT, workflowId: 'tampered' },
      optionsFor(repoRoot, cache),
    )
    assert.equal(afterTamper.resolvedModelId, honest.resolvedModelId)
    assert.notEqual(afterTamper.resolvedModelId, 'evil/injected-model')

    const kinds = cache.diagnostics.map((d) => d.kind)
    assert.deepEqual(kinds, ['miss', 'remembered', 'corrupt-record', 'remembered'])
  } finally {
    rmSync(repoRoot, { recursive: true, force: true })
  }
})

test('HRO-P2 an unavailable store degrades to the identical cold path', () => {
  const repoRoot = makeTempRepoRoot()
  const store = new TestStore()
  store.failGet = true
  store.failUpsert = true
  const cache = new RoutingDecisionCache(store, { ttlSeconds: 600 })
  try {
    const first = evaluateRouting(
      { ...STANDARD_INPUT, workflowId: 'f1' },
      optionsFor(repoRoot, cache),
    )
    const second = evaluateRouting(
      { ...STANDARD_INPUT, workflowId: 'f2' },
      optionsFor(repoRoot, cache),
    )
    const expected = evaluateRouting(
      { ...STANDARD_INPUT, workflowId: 'expected' },
      optionsFor(repoRoot),
    )
    assert.equal(first.resolvedModelId, expected.resolvedModelId)
    assert.equal(second.resolvedModelId, expected.resolvedModelId)

    const kinds = cache.diagnostics.map((d) => d.kind)
    assert.deepEqual(kinds, [
      'store-unavailable',
      'store-unavailable',
      'store-unavailable',
      'store-unavailable',
    ])
  } finally {
    rmSync(repoRoot, { recursive: true, force: true })
  }
})

test('HRO-P2 warm and cold paths enforce identical input gates', () => {
  const repoRoot = makeTempRepoRoot()
  const cache = new RoutingDecisionCache(new TestStore(), { ttlSeconds: 600 })
  try {
    evaluateRouting({ ...STANDARD_INPUT }, optionsFor(repoRoot, cache))
    assert.throws(
      () =>
        evaluateRouting(
          { routing_class: 'standard', data_classification: 'internal', workflowId: 'bad-class' },
          optionsFor(repoRoot, cache),
        ),
      (err: unknown) => err instanceof RoutingError && err.code === 'UNKNOWN_CLASS',
    )
    assert.throws(
      () =>
        evaluateRouting(
          {
            routing_class: 'standard-feature',
            data_classification: 'secret',
            workflowId: 'bad-tier',
          },
          optionsFor(repoRoot, cache),
        ),
      (err: unknown) => err instanceof RoutingError && err.code === 'UNKNOWN_DATA_CLASSIFICATION',
    )
  } finally {
    rmSync(repoRoot, { recursive: true, force: true })
  }
})

// ─── Canonical keys (D4: key separation) ─────────────────────────────────────

test('HRO-P2 cache key separation: every key input changes the key', () => {
  const base = canonicalRoutingCacheKey(baseParts())
  const variants = [
    canonicalRoutingCacheKey({ ...baseParts(), schemaVersion: ROUTING_CACHE_SCHEMA_VERSION + 1 }),
    canonicalRoutingCacheKey({ ...baseParts(), policyDigest: 'digest-b' }),
    canonicalRoutingCacheKey({ ...baseParts(), routing_class: 'boilerplate' }),
    canonicalRoutingCacheKey({ ...baseParts(), data_classification: 'public' }),
  ]
  for (const variant of variants) assert.notEqual(variant, base)
  assert.equal(new Set([base, ...variants]).size, 5)
})

// ─── MRC-05 C3.5: the extended key parts (effective requirements) ────────────

test('MRC-05 C3.5 key coverage: each of the four requirement values changes the key; inputs order does not', () => {
  const base = canonicalRoutingCacheKey({
    ...baseParts(),
    required_inputs: ['text'],
    required_thinking_level: 'low',
  })
  const variants = [
    canonicalRoutingCacheKey({
      ...baseParts(),
      required_inputs: ['text', 'image'],
      required_thinking_level: 'low',
    }),
    canonicalRoutingCacheKey({
      ...baseParts(),
      required_inputs: ['text'],
      required_thinking_level: 'high',
    }),
    canonicalRoutingCacheKey({
      ...baseParts(),
      required_inputs: ['text'],
      required_thinking_level: 'low',
      required_context_tokens: 200000,
    }),
    canonicalRoutingCacheKey({
      ...baseParts(),
      required_inputs: ['text'],
      required_thinking_level: 'low',
      expertise: 'security',
    }),
  ]
  for (const variant of variants) assert.notEqual(variant, base)
  assert.equal(new Set([base, ...variants]).size, 5)
  // canonical form: required_inputs participates in the fixed INPUT_MODALITIES
  // order, so a permuted request can never fork the key.
  assert.equal(
    canonicalRoutingCacheKey({ ...baseParts(), required_inputs: ['image', 'text'] }),
    canonicalRoutingCacheKey({ ...baseParts(), required_inputs: ['text', 'image'] }),
  )
})

test('MRC-05 C3.5 the schema-version bump invalidates pre-bump entries as typed misses', () => {
  const store = new TestStore()
  const cache = new RoutingDecisionCache(store, { ttlSeconds: 600 })
  const parts = baseParts()
  cache.remember(
    {
      resolvedModelId: 'anthropic/claude-sonnet-5',
      resolvedTier: 'standard',
      transportRequirements: { data_collection: 'allow', zdr: false },
    },
    parts,
  )
  // A stale-version recall request is a typed schema-changed miss, never a hit.
  assert.equal(
    cache.recall({ ...parts, schemaVersion: ROUTING_CACHE_SCHEMA_VERSION - 1 }),
    undefined,
  )
  assert.equal(cache.diagnostics.at(-1)?.kind, 'schema-changed')
  // …and a pre-bump RECORD can never satisfy a current recall (even resealed).
  const key = canonicalRoutingCacheKey(parts)
  const record = store.records.get(key) as RoutingCacheRecord
  const stale = { ...record, schemaVersion: ROUTING_CACHE_SCHEMA_VERSION - 1 }
  store.records.set(key, { ...stale, seal: computeRoutingCacheRecordSeal(stale) })
  assert.equal(cache.recall(parts), undefined)
  assert.equal(cache.diagnostics.at(-1)?.kind, 'schema-changed')
})

test('MRC-05 C3.5 recall under different requirements is a typed miss, never a cross-requirement hit', () => {
  const store = new TestStore()
  const cache = new RoutingDecisionCache(store, { ttlSeconds: 600 })
  const parts = baseParts()
  cache.remember(
    {
      resolvedModelId: 'anthropic/claude-sonnet-5',
      resolvedTier: 'standard',
      transportRequirements: { data_collection: 'allow', zdr: false },
    },
    parts,
  )
  assert.equal(cache.recall({ ...parts, required_inputs: ['text', 'image'] }), undefined)
  assert.equal(cache.diagnostics.at(-1)?.kind, 'miss')
  assert.equal(cache.recall({ ...parts, required_thinking_level: 'xhigh' }), undefined)
  assert.equal(cache.diagnostics.at(-1)?.kind, 'miss')
  // the original entry still recalls for its own requirements
  assert.equal(cache.recall(parts)?.resolvedModelId, 'anthropic/claude-sonnet-5')
})

// ─── Store semantics (D4: uniqueness, bounds, concurrency, lifecycle) ────────

test('HRO-P2 FileRoutingCacheStore: uniqueness by key and bounded oldest-first eviction', () => {
  const repoRoot = makeTempRepoRoot()
  const storePath = join(repoRoot, 'cache', 'decisions.json')
  let nowMs = Date.parse('2026-09-27T00:00:00Z')
  try {
    const store = new FileRoutingCacheStore(storePath, { maxEntries: 2 })
    const cache = new RoutingDecisionCache(store, { ttlSeconds: 600, now: () => new Date(nowMs) })
    const partsA = { ...baseParts(), routing_class: 'boilerplate' }
    const partsB = { ...baseParts(), routing_class: 'architecture/risk' }
    const partsC = { ...baseParts(), routing_class: 'implementation/standard' }
    const decision = {
      resolvedModelId: 'anthropic/claude-sonnet-5',
      resolvedTier: 'standard',
      transportRequirements: { data_collection: 'allow' as const, zdr: false },
    }
    cache.remember(decision, partsA)
    nowMs += 1_000
    cache.remember(decision, partsB)
    nowMs += 1_000
    cache.remember(decision, partsA) // same key: replaces, does not grow
    assert.equal(store.get(canonicalRoutingCacheKey(partsA)) !== undefined, true)
    assert.equal(store.get(canonicalRoutingCacheKey(partsB)) !== undefined, true)
    nowMs += 1_000
    cache.remember(decision, partsC) // third distinct key over the bound: evicts oldest (A's first write replaced by later createdAt — B is oldest)
    assert.equal(store.get(canonicalRoutingCacheKey(partsA)) !== undefined, true)
    assert.equal(store.get(canonicalRoutingCacheKey(partsB)), undefined)
    assert.equal(store.get(canonicalRoutingCacheKey(partsC)) !== undefined, true)
    store.close()
  } finally {
    rmSync(repoRoot, { recursive: true, force: true })
  }
})

test('HRO-P2 FileRoutingCacheStore: concurrent open is refused; lifecycle is explicit', () => {
  const repoRoot = makeTempRepoRoot()
  const storePath = join(repoRoot, 'cache', 'decisions.json')
  try {
    const first = new FileRoutingCacheStore(storePath)
    assert.throws(
      () => new FileRoutingCacheStore(storePath),
      (err: unknown) => err instanceof CacheStoreConflictError,
    )
    first.close()
    const reopened = new FileRoutingCacheStore(storePath)
    reopened.close()
  } finally {
    rmSync(repoRoot, { recursive: true, force: true })
  }
})

test('HRO-P2 FileRoutingCacheStore: corrupt documents are quarantined and never trusted', () => {
  const repoRoot = makeTempRepoRoot()
  const storePath = join(repoRoot, 'cache', 'decisions.json')
  try {
    mkdirSync(dirname(storePath), { recursive: true })
    writeFileSync(storePath, '{not json', 'utf8')
    const store = new FileRoutingCacheStore(storePath)
    assert.equal(store.get('anything'), undefined)
    assert.equal(readFileSync(`${storePath}.corrupt`, 'utf8'), '{not json')
    store.close()
  } finally {
    rmSync(repoRoot, { recursive: true, force: true })
  }
})

test('HRO-P2 the record seal detects field-level corruption on read', () => {
  const store = new TestStore()
  const cache = new RoutingDecisionCache(store, { ttlSeconds: 600 })
  const parts = baseParts()
  cache.remember(
    {
      resolvedModelId: 'anthropic/claude-sonnet-5',
      resolvedTier: 'standard',
      transportRequirements: { data_collection: 'allow' as const, zdr: false },
    },
    parts,
  )
  const key = canonicalRoutingCacheKey(parts)
  const record = store.records.get(key) as RoutingCacheRecord
  // Field flip without resealing = the corruption class this seal detects.
  store.records.set(key, { ...record, resolvedTier: 'frontier' })
  assert.equal(cache.recall(parts), undefined)
  assert.equal(cache.diagnostics.at(-1)?.kind, 'corrupt-record')

  // R2: the seal covers `evaluations` too — flipping the replayed route
  // explanation without resealing is the same corruption class.
  cache.remember(
    {
      resolvedModelId: 'anthropic/claude-sonnet-5',
      resolvedTier: 'standard',
      transportRequirements: record.transportRequirements,
      evaluations: [{ model: 'anthropic/claude-sonnet-5', eligible: true, refusals: [] }],
    },
    parts,
  )
  const withExplanation = store.records.get(key) as RoutingCacheRecord
  store.records.set(key, {
    ...withExplanation,
    evaluations: [{ model: 'evil/injected-model', eligible: true, refusals: [] }],
  })
  assert.equal(cache.recall(parts), undefined)
  assert.equal(cache.diagnostics.at(-1)?.kind, 'corrupt-record')
  // The documented limit: a seal is not a secret-keyed MAC — a hostile store
  // that re-seals can forge records. Verify the formula is at least stable
  // (the seal field itself is excluded from its own computation).
  assert.equal(
    computeRoutingCacheRecordSeal(record),
    computeRoutingCacheRecordSeal({ ...record, seal: 'x' }),
  )
})
