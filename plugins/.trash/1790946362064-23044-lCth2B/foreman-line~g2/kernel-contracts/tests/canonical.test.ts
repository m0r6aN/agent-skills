/**
 * Canonical bytes: the byte-total encoder (F05.5 rules 1–6) pinned against
 * fixed vectors, hostile-value rejections, and digest re-derivation over the
 * golden-vector fixture's stored base requests (the fixture digests were
 * produced by an independent implementation of the same rules).
 *
 * Tricky code units are built with String.fromCharCode so the test source is
 * plain ASCII and cannot be mangled in transit.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  CanonicalEncodeError,
  canonicalBytes,
  canonicalEncode,
  digestDocument,
  inputDigestOf,
  isDigestLiteral,
  parseDigestLiteral,
  requestDigestOf,
  tagDigest,
} from '../src/canonical.js'
import { DIGEST_DOMAINS } from '../src/types.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixturePath = join(here, 'fixtures', 'golden-vectors.json')
const fixture = JSON.parse(readFileSync(fixturePath, 'utf8')) as {
  cases: {
    caseId: string
    request: Record<string, unknown>
    expectedRequestDigest: string | null
    expectedInputDigest: string | null
  }[]
}

const BS = String.fromCharCode(0x5c)
const DEL = String.fromCharCode(0x7f)
const QUOTE = String.fromCharCode(0x22)
const CTL1 = String.fromCharCode(0x01)
const CTL1F = String.fromCharCode(0x1f)
const E_ACUTE = String.fromCharCode(0xe9)
const U2000 = String.fromCharCode(0x2000)
const LONE_HIGH = String.fromCharCode(0xd800)
const LONE_LOW = String.fromCharCode(0xdc00)
const GRIN = String.fromCharCode(0xd83d, 0xde00)

test('rule 1+2: compact framing and recursive UTF-16 key order, arrays preserved', () => {
  assert.equal(canonicalEncode({ b: 2, a: 1 }), '{"a":1,"b":2}')
  const sorted = canonicalEncode({ b: 2, a: { d: 4, c: 3 }, z: [3, 2, 1], A: 1, [U2000]: 2 })
  assert.equal(sorted, `{"A":1,"a":{"c":3,"d":4},"b":2,"z":[3,2,1],"${U2000}":2}`)
  assert.equal(canonicalEncode([]), '[]')
  assert.equal(canonicalEncode({}), '{}')
})

test('rule 3: exact escape set, controls as lowercase u00XX, no other escapes', () => {
  const tricky = `a${QUOTE}b${BS}c${CTL1}${CTL1F}/${E_ACUTE}${DEL}`
  const encoded = canonicalEncode({ k: tricky, n: 0, big: 9007199254740991 })
  const expectedK = `a${BS}${QUOTE}b${BS}${BS}c${BS}u0001${BS}u001f/${E_ACUTE}${DEL}`
  assert.equal(encoded, `{"big":9007199254740991,"k":"${expectedK}","n":0}`)
  assert.ok(!canonicalEncode({ s: 'a/b' }).includes(`${BS}/`), 'solidus is never escaped')
  assert.ok(!canonicalEncode({ s: E_ACUTE }).includes(`${BS}u`), 'non-ASCII is never u-escaped')
})

test('rule 4: integer lexemes, and unencodable numbers are rejected', () => {
  assert.equal(canonicalEncode({ n: 0 }), '{"n":0}')
  assert.equal(canonicalEncode({ n: 2 ** 53 - 1 }), '{"n":9007199254740991}')
  for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, -0, 0.5, 2 ** 53, -1]) {
    assert.throws(() => canonicalEncode({ n: bad }), CanonicalEncodeError, String(bad))
  }
})

test('unpaired surrogates are rejected before hashing', () => {
  assert.throws(() => canonicalEncode({ s: `a${LONE_HIGH}b` }), CanonicalEncodeError)
  assert.throws(() => canonicalEncode({ s: `a${LONE_LOW}b` }), CanonicalEncodeError)
  assert.equal(canonicalEncode({ s: GRIN }), `{"s":"${GRIN}"}`)
})

test('rule 5: atoms; absent optional members omitted; required nulls serialized', () => {
  assert.equal(canonicalEncode(true), 'true')
  assert.equal(canonicalEncode(false), 'false')
  assert.equal(canonicalEncode(null), 'null')
  assert.equal(canonicalEncode({ a: 1, b: undefined }), '{"a":1}')
  assert.equal(canonicalEncode({ a: null }), '{"a":null}')
})

test('rule 6: wrapper, UTF-8 without BOM, tagged lowercase digest; pinned vectors', () => {
  const bytes = canonicalBytes({ domain: 'x', apiVersion: '0.1.0', payload: {} })
  assert.equal(bytes[0], 0x7b, 'encoding starts with { and carries no BOM')
  assert.equal(
    digestDocument('x', {}),
    'sha256:392ab3e67aeab9531a26852ec99e9f158448e57814d5a01acf435f15e7676060',
  )
  assert.equal(
    digestDocument(DIGEST_DOMAINS.effectiveInput, { a: 1 }),
    'sha256:b2d4c0133fafa3d4fc07836b3091c15c2302911f6d7aa94a2a59c1b3ff68611f',
  )
})

test('domain separation and determinism', () => {
  assert.notEqual(digestDocument('domain-a', { x: 1 }), digestDocument('domain-b', { x: 1 }))
  assert.equal(
    digestDocument(DIGEST_DOMAINS.request, { x: 1 }),
    digestDocument(DIGEST_DOMAINS.request, { x: 1 }),
  )
})

test('digest encode/decode is explicit at the package boundary', () => {
  const hex = 'f'.repeat(64)
  assert.equal(tagDigest(hex), `sha256:${hex}`)
  assert.equal(tagDigest('F'.repeat(64)), null)
  assert.equal(parseDigestLiteral(`sha256:${hex}`), hex)
  assert.equal(parseDigestLiteral(hex), null)
  assert.ok(isDigestLiteral(`sha256:${'0'.repeat(64)}`))
  assert.ok(!isDigestLiteral(`sha256:${'0'.repeat(63)}`))
})

test('golden-vector digests re-derive exactly from the stored base requests', () => {
  for (const entry of fixture.cases) {
    const isInputCase = 'callerInputs' in entry.request
    if (isInputCase) {
      assert.equal(entry.expectedRequestDigest, null, entry.caseId)
      assert.equal(entry.expectedInputDigest, inputDigestOf(entry.request), entry.caseId)
    } else {
      assert.equal(entry.expectedInputDigest, null, entry.caseId)
      assert.equal(entry.expectedRequestDigest, requestDigestOf(entry.request), entry.caseId)
    }
  }
})
