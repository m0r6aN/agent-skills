/**
 * Canonical output: the local F05.5 encoder byte-bound against shipped
 * vectors, digest preimage rules, artifact determinism (idempotence and
 * order-independence), and the mandated read-only conformance cross-check of
 * the encoder against FK-P1's canonical golden fixtures (OQ-3) —
 * `kernel-contracts/**` is read-only test input here and is never written.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  API_VERSION,
  CanonicalEncodeError,
  COMPILED_SCOPE_DOMAIN,
  canonicalEncode,
  compiledScopeDigestFor,
  compileScope,
  digestDocument,
} from '../src/index.js'

const here = dirname(fileURLToPath(import.meta.url))
const vectors = JSON.parse(
  readFileSync(join(here, 'fixtures', 'canonical', 'encoder-vectors.json'), 'utf8'),
) as {
  vectors: { id: string; value: unknown; canonical: string }[]
  digests: {
    id: string
    domain: string
    payload: unknown
    canonicalPreimage: string
    digest: string
  }[]
}

const S = String.fromCharCode
const QUOTE = S(0x22)
const BS = S(0x5c)

test('encoder vectors: canonical bytes are byte-bound', () => {
  for (const v of vectors.vectors) {
    assert.equal(canonicalEncode(v.value), v.canonical, v.id)
  }
})

test('encoder vectors: digest preimages and tagged digests are byte-bound', () => {
  for (const d of vectors.digests) {
    const preimage = { domain: d.domain, apiVersion: API_VERSION, payload: d.payload }
    assert.equal(canonicalEncode(preimage), d.canonicalPreimage, d.id)
    assert.equal(digestDocument(d.domain, d.payload), d.digest, d.id)
  }
})

test('rule 3: controls escape as lowercase u00XX, nothing else escapes', () => {
  const tricky = `a${QUOTE}b${BS}c${S(0x01)}${S(0x1f)}/${S(0xe9)}${S(0x7f)}`
  assert.equal(
    canonicalEncode({ k: tricky }),
    `{"k":"a${BS}${QUOTE}b${BS}${BS}c${BS}u0001${BS}u001f/${S(0xe9)}${S(0x7f)}"}`,
  )
})

test('rule 4: numbers are safe integers 0..2^53-1 with digits-only lexemes', () => {
  assert.equal(canonicalEncode(0), '0')
  assert.equal(canonicalEncode(9007199254740991), '9007199254740991')
  for (const bad of [-0, 1.5, Number.NaN, Number.POSITIVE_INFINITY, -5]) {
    assert.throws(
      () => {
        canonicalEncode(bad)
      },
      (error: unknown) => error instanceof CanonicalEncodeError,
    )
  }
})

test('unpaired surrogates have no byte encoding', () => {
  assert.throws(
    () => {
      canonicalEncode(S(0xd800))
    },
    (error: unknown) => error instanceof CanonicalEncodeError,
  )
  assert.throws(
    () => {
      canonicalEncode(S(0xdc00))
    },
    (error: unknown) => error instanceof CanonicalEncodeError,
  )
})

test('absent optional members are omitted before encoding', () => {
  assert.equal(canonicalEncode({ a: undefined, b: 1 }), '{"b":1}')
})

test('compiledScopeDigest preimage is the F05.5 wrapper minus the digest member', () => {
  const source = readFileSync(join(here, 'fixtures', 'positive', 'pos-01-minimal.md'), 'utf8')
  const { artifact, compiledScopeDigest } = compileScope(source, { specPath: 'p.md' })
  const { compiledScopeDigest: _omitted, ...preimage } = artifact
  assert.equal(compiledScopeDigestFor(preimage), compiledScopeDigest)
  assert.equal(artifact.compiledScopeDigest, compiledScopeDigest)
  assert.equal(COMPILED_SCOPE_DOMAIN, 'foreman-line.spec-body-compiler.compiled-scope')
})

test('idempotence: byte-identical input yields byte-identical artifact bytes and digest', () => {
  const source = readFileSync(join(here, 'fixtures', 'positive', 'pos-02-multi-entry.md'), 'utf8')
  const first = compileScope(source, { specPath: 'p.md' })
  const second = compileScope(source, { specPath: 'p.md' })
  assert.equal(JSON.stringify(first.artifact), JSON.stringify(second.artifact))
  assert.equal(first.compiledScopeDigest, second.compiledScopeDigest)
})

test('order-independence: reordering source entries cannot change artifact bytes', () => {
  const base = [
    '---',
    'ticket: FK-T0',
    'status: active',
    '---',
    '',
    '## Intent',
    'x',
    '',
    '## Constraints',
    'x',
    '',
    '## Acceptance Criteria',
    'x',
    '',
    '## Out of Scope',
    'x',
    '',
    '## Context & References',
    'x',
    '',
    '## Allowed Files',
  ]
  const forward = compileScope([...base, '- src/z.ts', '- src/a.ts', ''].join('\n'), {
    specPath: 'p.md',
  })
  const reversed = compileScope([...base, '- src/a.ts', '- src/z.ts', ''].join('\n'), {
    specPath: 'p.md',
  })
  assert.equal(JSON.stringify(forward.artifact), JSON.stringify(reversed.artifact))
  assert.equal(forward.compiledScopeDigest, reversed.compiledScopeDigest)
  assert.deepEqual(forward.artifact.allowedFiles, ['src/a.ts', 'src/z.ts'])
})

test('OQ-3 read-only cross-check: local encoder reproduces FK-P1 canonical golden fixtures', () => {
  const fixturePath = join(
    here,
    '..',
    '..',
    'kernel-contracts',
    'tests',
    'fixtures',
    'golden-vectors.json',
  )
  const fixture = JSON.parse(readFileSync(fixturePath, 'utf8')) as {
    cases: {
      caseId: string
      request: Record<string, unknown>
      expectedRequestDigest: string | null
      expectedInputDigest: string | null
    }[]
  }
  let checked = 0
  for (const entry of fixture.cases) {
    const isInputCase = 'callerInputs' in entry.request
    if (isInputCase) {
      assert.equal(entry.expectedRequestDigest, null, entry.caseId)
      assert.equal(
        digestDocument('foreman-line.kernel-contracts.effective-input', entry.request),
        entry.expectedInputDigest,
        entry.caseId,
      )
    } else {
      assert.equal(entry.expectedInputDigest, null, entry.caseId)
      assert.equal(
        digestDocument('foreman-line.kernel-contracts.request', entry.request),
        entry.expectedRequestDigest,
        entry.caseId,
      )
    }
    checked += 1
  }
  assert.equal(checked, fixture.cases.length)
  assert.ok(checked >= 100, 'golden fixture coverage')
})
