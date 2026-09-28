/**
 * Grammar-pin enforcement (fail-closed on real drift) — AC1 and the Step-0
 * flag A three-state ruling: (a) live bytes match the pinned digests -> PASS;
 * (b) live bytes equal the known pre-v0.4 base -> record a machine-readable
 * KNOWN-GAP record and PASS (the gap is named in the exit annex until the
 * RCM-P2 delta lands); (c) ANY other state -> FAIL.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  assertGrammarPin,
  classifyGrammarState,
  GRAMMAR_PIN,
  KNOWN_BASE_GRAMMAR,
  ScopeCompileError,
} from '../src/index.js'

const here = dirname(fileURLToPath(import.meta.url))
const conventionPath = join(here, '..', '..', 'docs', 'SPEC-CONVENTION.md')

test('grammar pin: three-state classification of the live SPEC-CONVENTION.md', () => {
  const bytes = new Uint8Array(readFileSync(conventionPath))
  const state = classifyGrammarState(bytes)
  if (state === 'pinned') {
    assertGrammarPin(bytes)
    return
  }
  if (state === 'known-base') {
    // Machine-readable KNOWN-GAP record (Step-0 flag A ruling).
    console.log(
      JSON.stringify({
        knownGap: 'grammar-pin',
        blocked: 'RCM-P2 schema-v0.4 delta uncommitted',
        state,
        fileDigest: KNOWN_BASE_GRAMMAR.fileDigest,
        sectionDigest: KNOWN_BASE_GRAMMAR.sectionDigest,
        totalBytes: KNOWN_BASE_GRAMMAR.totalBytes,
        sectionBytes: KNOWN_BASE_GRAMMAR.sectionBytes,
      }),
    )
    return
  }
  assert.fail(
    `grammar drift: live SPEC-CONVENTION.md matches neither the pin nor the known base (state: ${state})`,
  )
})

test('grammar pin: constants carry the exact measured digests and byte counts', () => {
  assert.equal(GRAMMAR_PIN.sectionBytes, 10199)
  assert.equal(
    GRAMMAR_PIN.sectionDigest,
    'sha256:96113a55c6ddf2a7bad93c90d7004f1e51550aa2b1164ae06093992ee824398d',
  )
  assert.equal(
    GRAMMAR_PIN.fileDigest,
    'sha256:70508684d2c929d1331ed0cd9a147fcc2206593a04fbf210314e22fb80cba0a8',
  )
  assert.equal(KNOWN_BASE_GRAMMAR.totalBytes, 18344)
  assert.equal(KNOWN_BASE_GRAMMAR.sectionBytes, 6610)
  assert.equal(
    KNOWN_BASE_GRAMMAR.fileDigest,
    'sha256:7ac315005cde6ad6def848b83de1d1b644e321c5d9f6434bc925deb6daba8703',
  )
  assert.equal(
    KNOWN_BASE_GRAMMAR.sectionDigest,
    'sha256:b11a34a49f2b079907c06954752729d98d95f016fe42f263cb1eb7c6494112cc',
  )
})

test('grammar pin: mutation of the live bytes classifies as drift (failing-when-broken)', () => {
  const bytes = new Uint8Array(readFileSync(conventionPath))
  const state = classifyGrammarState(bytes)
  assert.notEqual(state, 'drift')
  const mutated = new Uint8Array(bytes)
  mutated[mutated.length - 1] = mutated[mutated.length - 1] === 0x0a ? 0x20 : 0x0a
  assert.equal(classifyGrammarState(mutated), 'drift')
})

test('grammar pin: assertGrammarPin refuses with GRAMMAR_PIN_MISMATCH on drift', () => {
  const bytes = new Uint8Array(readFileSync(conventionPath))
  const mutated = new Uint8Array(bytes)
  mutated[0] = 0x20
  assert.throws(
    () => {
      assertGrammarPin(mutated)
    },
    (error: unknown) => {
      assert.ok(error instanceof ScopeCompileError)
      assert.equal(error.code, 'GRAMMAR_PIN_MISMATCH')
      return true
    },
  )
})

test('grammar pin: missing section headings classify as drift, never as a gap', () => {
  const synthetic = new TextEncoder().encode(
    '## 4. Required Spec Schema\nx\n## 5. The Spec ↔ Jira Contract\n',
  )
  assert.equal(classifyGrammarState(synthetic), 'drift')
})
