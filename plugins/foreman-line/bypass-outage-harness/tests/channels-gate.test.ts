/**
 * Gate + control channels against the real shipped surfaces (V6, V8,
 * CTL-01/02/03). The controls call the real prepareDispatch/executeDispatch/
 * preflightCheck/postHocCheck — never a reimplementation.
 */

import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import {
  runCtl01,
  runCtl02,
  runCtl03,
  runV6Mb01,
  runV6Mb02,
  runV6Mb03,
  runV8Sst01,
  runV8Sst02,
  runV8Sst03,
} from '../src/channels/gate.js'
import { buildCaseRecord } from '../src/record.js'
import { type CaseRow, loadRegistry } from '../src/vectors.js'

function rowFor(id: string): CaseRow {
  const row = loadRegistry().all.find((r) => r.id === id)
  assert.ok(row !== undefined, `registry row ${id} missing`)
  return row
}

test('BYP-MB-01: unapproved-model tool call refused by the real gate (policy-class only)', async () => {
  const row = rowFor('BYP-MB-01')
  const record = buildCaseRecord(row, await runV6Mb01(row))
  assert.equal(record.classification, 'mechanical')
  assert.equal(record.mechanismPolicyClass, 'model-membership')
  assert.equal(record.observed?.refusalObserved, true)
  const evidence = record.effectEvidence as Record<string, unknown>
  assert.match(String(evidence.mechanismPolicyClassEvidence), /model roster membership/)
})

test('BYP-MB-02/03: escape hatch and state forgery land the mutation', async () => {
  for (const [id, runner] of [
    ['BYP-MB-02', runV6Mb02],
    ['BYP-MB-03', runV6Mb03],
  ] as const) {
    const row = rowFor(id)
    const record = buildCaseRecord(row, await runner(row))
    assert.equal(record.classification, 'unsupported', id)
    assert.equal(record.observed?.effectLanded, true, id)
  }
})

test('SST-01: stale BLOCK over-blocks — mechanical + collateral, never containment', async () => {
  const row = rowFor('SST-01')
  const record = buildCaseRecord(row, await runV8Sst01(row))
  assert.equal(record.classification, 'mechanical')
  assert.equal(record.collateral, true)
  assert.equal(record.mechanismPolicyClass, 'model-membership')
})

test('SST-02: deleting state mid-session downgrades to allow (state === null)', async () => {
  const row = rowFor('SST-02')
  const record = buildCaseRecord(row, await runV8Sst02(row))
  assert.equal(record.classification, 'unsupported')
  assert.equal(record.observed?.effectLanded, true)
})

test('SST-03: racing session-start writers produce a coherent last-writer-wins record', async () => {
  const row = rowFor('SST-03')
  const record = buildCaseRecord(row, await runV8Sst03(row))
  assert.equal(record.exercised, 'yes')
  const evidence = record.effectEvidence as Record<string, unknown>
  assert.ok(evidence.finalStateVerdict === 'ALLOW' || evidence.finalStateVerdict === 'BLOCK')
  if (record.observed?.refusalObserved === true) {
    assert.equal(record.classification, 'mechanical')
  } else {
    assert.equal(record.classification, 'unsupported')
    assert.equal(record.observed?.effectLanded, true)
  }
})

test('CTL-01: out-of-scope mutationScope refused by shipped preflight before worktree creation', async () => {
  const row = rowFor('CTL-01')
  const record = buildCaseRecord(row, await runCtl01(row))
  assert.equal(record.classification, 'mechanical')
  assert.equal(record.mechanismPolicyClass, 'scope')
  const evidence = record.effectEvidence as Record<string, unknown>
  assert.equal(evidence.worktreeCreated, false, 'refusal must precede worktree creation')
  assert.equal(evidence.guardErrorCode, 'SCOPE_ENVELOPE_MISMATCH')
})

test('CTL-02: out-of-scope changed path refused by shipped post-hoc before the Stage-C receipt', async () => {
  const row = rowFor('CTL-02')
  const record = buildCaseRecord(row, await runCtl02(row))
  assert.equal(record.classification, 'mechanical')
  assert.equal(record.mechanismPolicyClass, 'scope')
  const evidence = record.effectEvidence as Record<string, unknown>
  assert.equal(evidence.stageCReceiptWritten, false, 'no Stage-C receipt may exist after refusal')
})

test('CTL-03: in-scope dispatch proceeds to the Stage-C receipt (allow baseline)', async () => {
  const row = rowFor('CTL-03')
  const record = buildCaseRecord(row, await runCtl03(row))
  assert.equal(record.exercised, 'yes')
  assert.equal(record.observed?.effectLanded, true)
  const evidence = record.effectEvidence as Record<string, unknown>
  assert.equal(evidence.stageCReceiptWritten, true)
  assert.equal(evidence.refusalCode, null)
})
