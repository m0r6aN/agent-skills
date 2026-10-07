/**
 * AC7 (seam half) — the SourceLineageReader contract at the gateway:
 * typed try-catch boundaries (#1), `unknown` returns normalized explicitly
 * (#28), digests ALWAYS computed by FK-P11 over returned bytes (rule 3 — a
 * lying reader cannot supply a digest), lineage membership computed from raw
 * boolean answers as the inclusive ancestry closure root..tip (rule 4), and
 * HARNESS_* seam errors rethrow unwrapped (ERR-01; harness failures are never
 * laundered into product errors). The operator-trust assumption is confined to
 * these injected-seam runs — never the shipped GitLineageReader (OQ-8).
 *
 * The shipped real-Git reader has its own suite (`tests/lineage-git.test.ts`).
 */
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { test } from 'node:test'
import { ImportError } from '../src/errors.js'
import { BLOB_ABSENT, createLineageGateway, type SourceLineageReader } from '../src/lineage.js'
import { FakeLineage, harnessFailureReader, nonconformingReader } from './helpers/fake-lineage.js'

const ROOT = '1'.repeat(40)
const MID = '3'.repeat(40)
const TIP = '2'.repeat(40)
const SIB = '4'.repeat(40)

function seeded(): FakeLineage {
  return new FakeLineage({
    commits: [
      { id: ROOT, parents: [] },
      { id: MID, parents: [ROOT] },
      { id: TIP, parents: [MID] },
      { id: SIB, parents: [ROOT] },
    ],
    blobs: [{ commitId: TIP, sourcePath: 'docs/goals/a.md', text: 'goal state a\n' }],
  })
}

test('conforming seam returns normalize without refusal', () => {
  const gateway = createLineageGateway(seeded())
  assert.equal(gateway.commitExists(TIP), true)
  assert.equal(gateway.commitExists('9'.repeat(40)), false)
  assert.equal(gateway.isAncestor(ROOT, TIP), true)
  const blob = gateway.readCommittedBlob(TIP, 'docs/goals/a.md')
  assert.ok(blob instanceof Uint8Array)
  assert.equal(new TextDecoder().decode(blob), 'goal state a\n')
  assert.deepEqual(gateway.readCommittedBlob(TIP, 'docs/goals/ghost.md'), BLOB_ABSENT)
})

test('nonconforming seam returns refuse typed per method (never a confident cast)', () => {
  const gateway = createLineageGateway(nonconformingReader())
  const methods: (() => unknown)[] = [
    () => gateway.commitExists(TIP),
    () => gateway.isAncestor(ROOT, TIP),
    () => gateway.readCommittedBlob(TIP, 'docs/goals/a.md'),
    () => gateway.commitInLineage(ROOT, TIP, MID),
  ]
  for (const invoke of methods) {
    assert.throws(
      invoke,
      (error: unknown) => {
        assert.ok(error instanceof ImportError)
        assert.equal(error.code, 'LINEAGE_READER_FAILURE')
        assert.deepEqual(error.diagnostic, { readerCode: 'nonconforming-return' })
        return true
      },
      'nonconforming return must refuse, never cast',
    )
  }
})

test('ERR-01: HARNESS_-branded seam errors rethrow unwrapped', () => {
  const gateway = createLineageGateway(harnessFailureReader())
  for (const invoke of [
    () => gateway.commitExists(TIP),
    () => gateway.isAncestor(ROOT, TIP),
    () => gateway.readCommittedBlob(TIP, 'docs/goals/a.md'),
  ]) {
    assert.throws(
      invoke,
      (error: unknown) => {
        // Failing-when-broken: wrapping into ImportError fails this assertion.
        assert.ok(!(error instanceof ImportError), 'harness fault is never a product error')
        assert.equal((error as { code?: string }).code, 'HARNESS_TEST_FAULT')
        return true
      },
      'harness fault surfaces as itself',
    )
  }
})

test('rule 3: digests are computed by FK-P11 over returned bytes (never seam-supplied)', () => {
  const gateway = createLineageGateway(seeded())
  const blob = gateway.readCommittedBlob(TIP, 'docs/goals/a.md')
  assert.ok(blob instanceof Uint8Array)
  const independent = `sha256:${createHash('sha256').update(blob).digest('hex')}`
  assert.equal(gateway.digestOf(blob), independent)
  // The seam contract carries no digest channel at all: only bytes cross it.
  const reader: SourceLineageReader = seeded()
  assert.equal(Object.hasOwn(reader, 'digestOf'), false)
})

test('rule 4: lineage membership is the inclusive ancestry closure root..tip', () => {
  const gateway = createLineageGateway(seeded())
  assert.equal(gateway.commitInLineage(ROOT, TIP, ROOT), true, 'root is in its own closure')
  assert.equal(
    gateway.commitInLineage(ROOT, TIP, TIP),
    true,
    'tip is in its own closure (inclusive)',
  )
  assert.equal(gateway.commitInLineage(ROOT, TIP, MID), true, 'mid-chain commit is in the closure')
  assert.equal(gateway.commitInLineage(ROOT, TIP, SIB), false, 'sibling lineage is outside')
  assert.equal(gateway.isAncestor(TIP, TIP), true, 'a commit is its own ancestor (inclusive)')
})
