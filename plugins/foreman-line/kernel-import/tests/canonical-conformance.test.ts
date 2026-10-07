/**
 * FK-P11 T11 canonical fixture class (CAN-01..CAN-08) conformance: byte-bound
 * vectors for the local F05.5 canonical-JSON encoder plus the read-only F05.5
 * conformance cross-check against FK-P1's canonical golden fixtures
 * (`kernel-contracts/**` is read-only test input here and is never written).
 * The golden fixture digests were produced by an independent implementation of
 * the same rules, so re-deriving them binds this encoder byte-for-byte (FK-P9
 * encoder parity).
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  CanonicalEncodeError,
  canonicalBytes,
  canonicalEncode,
  digestBytes,
  digestDocument,
  isDigestLiteral,
} from '../src/canonical.js'

interface VectorRow {
  id: string
  name: string
  expectedOutcome: 'byte-exact' | 'rejects'
  value: unknown
  canonical?: string
}

interface GoldenCase {
  caseId: string
  request: unknown
  expectedRequestDigest: string | null
  expectedInputDigest: string | null
}

const HERE = dirname(fileURLToPath(import.meta.url))
const PKG_ROOT = resolve(HERE, '..')
const VECTORS = JSON.parse(
  readFileSync(join(HERE, 'fixtures', 'canonical', 'encoder-vectors.json'), 'utf8'),
) as { records: VectorRow[] }

const FK1_REQUEST_DOMAIN = 'foreman-line.kernel-contracts.request'
const FK1_INPUT_DOMAIN = 'foreman-line.kernel-contracts.effective-input'

/** The declared T11 canonical enum (CAN-01..CAN-08), generated programmatically. */
const CANONICAL_IDS = Array.from(
  { length: 8 },
  (_, index) => `CAN-${String(index + 1).padStart(2, '0')}`,
)

/**
 * Inventory check: the row-derived ids (count included) must equal the declared
 * CAN-01..CAN-08 enum. Both directions of the comparison are covered by the
 * sorted-multiset equality, so a dropped or an extra row fails this check.
 */
function checkFixtureInventory(rows: readonly VectorRow[]): void {
  assert.deepEqual(
    rows.map((row) => row.id).sort(),
    [...CANONICAL_IDS].sort(),
    'fixture ids must equal the declared CAN-01..CAN-08 enum',
  )
}

test('fixture inventory: row-derived ids equal the declared CAN-01..CAN-08 enum', () => {
  checkFixtureInventory(VECTORS.records)
})

for (const row of VECTORS.records) {
  test(`canonical vector ${row.id}: ${row.name}`, () => {
    if (row.expectedOutcome === 'byte-exact') {
      assert.equal(
        canonicalEncode(row.value),
        row.canonical,
        `${row.id} must re-derive byte-exactly`,
      )
    } else {
      assert.throws(() => canonicalEncode(row.value), CanonicalEncodeError)
    }
  })
}

test('inventory check fails when a record is dropped (failing-when-broken proof)', () => {
  const droppedOne = VECTORS.records.filter((row) => row.id !== 'CAN-05')
  assert.throws(() => checkFixtureInventory(droppedOne), assert.AssertionError)
})

test('digest literals are tagged lowercase hex', () => {
  const digest = digestBytes(canonicalBytes({ a: 1 }))
  assert.ok(isDigestLiteral(digest))
  assert.match(digest, /^sha256:[0-9a-f]{64}$/)
})

test('read-only F05.5 cross-check: FK-P1 golden digests re-derive byte-exactly', () => {
  const goldenPath = resolve(
    PKG_ROOT,
    '..',
    'kernel-contracts',
    'tests',
    'fixtures',
    'golden-vectors.json',
  )
  const golden = JSON.parse(readFileSync(goldenPath, 'utf8')) as { cases: GoldenCase[] }
  let checkedRequests = 0
  let checkedInputs = 0
  for (const goldenCase of golden.cases) {
    if (goldenCase.expectedRequestDigest !== null) {
      assert.equal(
        digestDocument(FK1_REQUEST_DOMAIN, goldenCase.request),
        goldenCase.expectedRequestDigest,
        `requestDigest mismatch for ${goldenCase.caseId}`,
      )
      checkedRequests += 1
    }
    if (goldenCase.expectedInputDigest !== null) {
      assert.equal(
        digestDocument(FK1_INPUT_DOMAIN, goldenCase.request),
        goldenCase.expectedInputDigest,
        `inputDigest mismatch for ${goldenCase.caseId}`,
      )
      checkedInputs += 1
    }
  }
  assert.ok(checkedRequests > 0, 'golden fixture must carry request digests')
  assert.ok(checkedInputs > 0, 'golden fixture must carry input digests')
})
