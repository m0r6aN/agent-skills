/**
 * AC10 canonical conformance — the 8 byte-bound encoder vectors and a READ-ONLY
 * cross-check that re-derives FK-P1's golden fixture digests byte-exactly from
 * `kernel-contracts/tests/fixtures/golden-vectors.json` (never imported as a
 * package, never written).
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import {
  canonicalEncode,
  CanonicalEncodeError,
  digestBytes,
  digestDocument,
  eventPayloadDigest,
  isDigestLiteral,
  KERNEL_LEASE_DIGEST_DOMAINS,
  operationInputDigest,
} from '../src/index.js'

const FIXTURES = join(import.meta.dirname, 'fixtures')
const GOLDEN = join(
  import.meta.dirname,
  '..',
  '..',
  'kernel-contracts',
  'tests',
  'fixtures',
  'golden-vectors.json',
)

interface EncoderVector {
  id: string
  rule: string
  value: unknown
  expected?: string
  rejects?: Array<{ value: unknown }>
  distinct?: unknown
}

const parsedFixture: unknown = JSON.parse(
  readFileSync(join(FIXTURES, 'canonical', 'encoder-vectors.json'), 'utf8'),
)
const fixtureTable = parsedFixture as { records: EncoderVector[] }
const VECTORS = fixtureTable.records

test('fixture inventory: 8 encoder vectors, one pre-declared outcome each', () => {
  assert.equal(VECTORS.length, 8)
  for (const vector of VECTORS) {
    assert.ok(
      vector.expected !== undefined || (vector.rejects?.length ?? 0) > 0,
      `${vector.id} must declare an outcome`,
    )
  }
})

for (const vector of VECTORS) {
  test(`${vector.id} — ${vector.rule}`, () => {
    if (vector.expected !== undefined) {
      assert.equal(canonicalEncode(vector.value), vector.expected, vector.id)
    }
    for (const rejected of vector.rejects ?? []) {
      assert.throws(
        () => canonicalEncode(rejected.value),
        (error: unknown) => error instanceof CanonicalEncodeError,
        `${vector.id} must reject`,
      )
    }
    if (vector.distinct !== undefined) {
      // No path case folding: case-differing values hash differently.
      assert.notEqual(
        digestDocument('foreman-line.kernel-lease.event-payload', vector.value),
        digestDocument('foreman-line.kernel-lease.event-payload', vector.distinct),
      )
    }
  })
}

test('digest literal shape: sha256: + 64 lowercase hex (F05.5)', () => {
  const digest = digestBytes(new TextEncoder().encode('abc'))
  assert.ok(isDigestLiteral(digest))
  assert.ok(!isDigestLiteral(`sha256:${digest.slice(7).toUpperCase()}`))
  assert.ok(!isDigestLiteral('sha256:short'))
  assert.ok(!isDigestLiteral('md5:0000'))
})

test('domain wrappers bind the T11 domains and the apiVersion literal', () => {
  const request = { operation: 'claimLease', goalId: 'goal-1' }
  const operationDigest = operationInputDigest(request)
  const payloadDigest = eventPayloadDigest(request)
  assert.notEqual(operationDigest, payloadDigest, 'domains separate the preimages')
  assert.equal(
    operationDigest,
    digestDocument(KERNEL_LEASE_DIGEST_DOMAINS.operationInput, request),
  )
  assert.equal(payloadDigest, digestDocument(KERNEL_LEASE_DIGEST_DOMAINS.eventPayload, request))
})

test('AC10: golden-vector request digests re-derive byte-exactly (read-only cross-check)', () => {
  const parsed: unknown = JSON.parse(readFileSync(GOLDEN, 'utf8'))
  const golden = parsed as {
    apiVersion: string
    cases: Array<{ caseId: string; request: unknown; expectedRequestDigest: string | null }>
  }
  assert.equal(golden.apiVersion, '0.1.0')
  let checked = 0
  const mismatches: string[] = []
  for (const vector of golden.cases) {
    if (vector.expectedRequestDigest === null) continue
    checked += 1
    const derived = digestDocument('foreman-line.kernel-contracts.request', vector.request)
    if (derived !== vector.expectedRequestDigest) mismatches.push(vector.caseId)
  }
  assert.ok(checked >= 38, `expected at least 38 digest-bearing cases, saw ${checked}`)
  assert.deepEqual(mismatches, [], 'every golden request digest must re-derive byte-exactly')
})

test('canonical encoding is total and deterministic across member insertion order', () => {
  const a = { z: 1, a: { y: 2, b: 3 } }
  const b = { a: { b: 3, y: 2 }, z: 1 }
  assert.equal(canonicalEncode(a), canonicalEncode(b))
  assert.equal(
    digestDocument('foreman-line.kernel-lease.event-payload', a),
    digestDocument('foreman-line.kernel-lease.event-payload', b),
  )
})
