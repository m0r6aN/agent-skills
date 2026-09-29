/**
 * POS-07: canonical-encoder conformance — byte-bound local vectors plus the
 * read-only F05.5 conformance cross-check against FK-P1's canonical golden
 * fixtures (`kernel-contracts/**` is read-only test input here and is never
 * written). The fixture digests were produced by an independent implementation
 * of the same rules, so re-deriving them binds this encoder byte-for-byte.
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
} from '../src/canonical.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const PKG_ROOT = resolve(HERE, '..')
const VECTORS = JSON.parse(
  readFileSync(join(HERE, 'fixtures', 'canonical', 'encoder-vectors.json'), 'utf8'),
) as {
  records: { id: string; expectedOutcome: string }[]
  byteVectors: { name: string; value: unknown; canonical: string }[]
  rejectionKinds: string[]
}

const FK1_REQUEST_DOMAIN = 'foreman-line.kernel-contracts.request'
const FK1_INPUT_DOMAIN = 'foreman-line.kernel-contracts.effective-input'

test('POS-07 fixture record is pre-declared', () => {
  assert.equal(VECTORS.records.length, 1)
  assert.equal(VECTORS.records[0]?.id, 'POS-07')
  assert.equal(VECTORS.records[0]?.expectedOutcome, 'conformance-cross-check-passes')
})

for (const vector of VECTORS.byteVectors) {
  test(`byte vector: ${vector.name}`, () => {
    assert.equal(canonicalEncode(vector.value), vector.canonical)
  })
}

test('undefined members are omitted before encoding', () => {
  assert.equal(canonicalEncode({ kept: 1, dropped: undefined }), '{"kept":1}')
  assert.equal(canonicalEncode([1, 2]), '[1,2]')
})

function unencodableValue(kind: string): unknown {
  switch (kind) {
    case 'number-nan':
      return { n: Number.NaN }
    case 'number-infinity':
      return { n: Number.POSITIVE_INFINITY }
    case 'number-negative-zero':
      return { n: -0 }
    case 'number-fraction':
      return { n: 0.5 }
    case 'number-unsafe':
      return { n: 9007199254740992 }
    case 'number-negative':
      return { n: -1 }
    case 'string-lone-high-surrogate':
      return { s: `${String.fromCharCode(0xd800)}x` }
    case 'string-lone-low-surrogate':
      return { s: `${String.fromCharCode(0xdc00)}x` }
    case 'undefined-array-member':
      return [1, undefined]
    case 'function-member':
      return { fn: () => undefined }
    default:
      throw new Error(`unknown rejection kind ${kind}`)
  }
}

for (const kind of VECTORS.rejectionKinds) {
  test(`rejection vector: ${kind}`, () => {
    assert.throws(() => canonicalEncode(unencodableValue(kind)), CanonicalEncodeError)
  })
}

test('digest literals are tagged lowercase hex', () => {
  const digest = digestBytes(canonicalBytes({ a: 1 }))
  assert.match(digest, /^sha256:[0-9a-f]{64}$/)
})

interface GoldenCase {
  caseId: string
  request: unknown
  expectedRequestDigest: string | null
  expectedInputDigest: string | null
}

test('POS-07 read-only conformance cross-check: FK-P1 golden fixture digests re-derive byte-exactly', () => {
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
    if (goldenCase.expectedRequestDigest !== null && goldenCase.request !== null) {
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
