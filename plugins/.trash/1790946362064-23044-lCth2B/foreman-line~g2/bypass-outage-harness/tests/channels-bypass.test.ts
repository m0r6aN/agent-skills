/**
 * Bypass channels against the real shipped surfaces in throwaway temp
 * workspaces (V1–V5, V7). Asserts each case's required signals materialize —
 * including the must-prove [INFERENCE] row's two named signals.
 */

import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import {
  BYPASS_RUNNERS,
  buildSh01Outcome,
  runBypSh01,
  runLinkCase,
} from '../src/channels/bypass.js'
import {
  buildCaseRecord,
  buildCaseRecordOrRefusal,
  type CaseEvidenceRecord,
  type CaseOutcome,
} from '../src/record.js'
import { type CaseRow, loadRegistry } from '../src/vectors.js'

function rowFor(id: string): CaseRow {
  const row = loadRegistry().all.find((r) => r.id === id)
  assert.ok(row !== undefined, `registry row ${id} missing`)
  return row
}

function runnerFor(
  map: Record<string, (r: CaseRow) => Promise<CaseOutcome>>,
  id: string,
): (r: CaseRow) => Promise<CaseOutcome> {
  const fn = map[id]
  assert.ok(fn !== undefined, `runner ${id} missing`)
  return fn
}

test('BYP-SH-01 (must-prove [INFERENCE]) carries both named signals, two-sided', async () => {
  const row = rowFor('BYP-SH-01')
  const outcome = await runBypSh01(row)
  const record = buildCaseRecord(row, outcome)
  assert.equal(record.exercised, 'yes')
  assert.equal(record.observed?.effectLanded, true, 'realpath-verified effect must land')
  assert.equal(record.guardInvocation, false, 'guard non-invocation proof')
  assert.equal(record.observed?.refusalObserved, false)
  assert.equal(record.classification, 'unsupported')
  assert.equal(record.hypothesisFalsified, false)
  const evidence = record.effectEvidence as Record<string, unknown>
  assert.equal(evidence.realpathVerified, true)
})

test('BYP-SH-02/03: delete, rename and PowerShell-indirected writes land unmediated', async () => {
  for (const id of ['BYP-SH-02', 'BYP-SH-03']) {
    const row = rowFor(id)
    const record = buildCaseRecord(row, await runnerFor(BYPASS_RUNNERS, id)(row))
    assert.equal(record.classification, 'unsupported', id)
    assert.equal(record.observed?.effectLanded, true, id)
    assert.equal(record.guardInvocation, false, id)
  }
})

test('BYP-SP-01/02: subprocess and detached grandchild writes land (V2)', async () => {
  for (const id of ['BYP-SP-01', 'BYP-SP-02']) {
    const row = rowFor(id)
    const record = buildCaseRecord(row, await runnerFor(BYPASS_RUNNERS, id)(row))
    assert.equal(record.classification, 'unsupported', id)
    assert.equal(record.observed?.effectLanded, true, id)
  }
})

test('BYP-MC-01/02: MCP/custom-tool writes land with pre-tool policy-class evidence (V3)', async () => {
  for (const id of ['BYP-MC-01', 'BYP-MC-02']) {
    const row = rowFor(id)
    const record = buildCaseRecord(row, await runnerFor(BYPASS_RUNNERS, id)(row))
    assert.equal(record.classification, 'unsupported', id)
    assert.equal(record.observed?.effectLanded, true, id)
    const evidence = record.effectEvidence as Record<string, unknown>
    assert.equal(evidence.preToolExitCode, 0, 'pre-tool exit 0 recorded as policy-class evidence')
  }
})

test('BYP-LK-01: file-symlink write-through executes or records a blocked gap (AC9)', async () => {
  const row = rowFor('BYP-LK-01')
  const outcome = await runLinkCase(row)
  const record = buildCaseRecord(row, outcome)
  if (record.exercised === 'gap') {
    assert.ok(record.gapRecord !== null)
    assert.match(record.gapRecord.reason, /^blocked: /)
    assert.ok(record.gapRecord.obligation.includes('FK-P18′ lane'))
  } else {
    assert.equal(record.classification, 'unsupported')
  }
})

test('BYP-LK-02: junction write-through MUST execute (chain hard-fails otherwise)', async () => {
  const row = rowFor('BYP-LK-02')
  const record = buildCaseRecord(row, await runLinkCase(row))
  assert.equal(record.exercised, 'yes', 'junction cases cannot gap')
  assert.equal(record.classification, 'unsupported')
  const evidence = record.effectEvidence as { trees: Array<Record<string, unknown>> }
  const junction = evidence.trees.find((t) => t.treeId === 'junction')
  assert.ok(junction !== undefined)
  assert.equal(junction.materialized, true)
  assert.equal(junction.postHocAccepted, true, 'postHocCheck accepts the reported path')
})

test('BYP-LK-03/04: case-variant and trailing-dot aliases evade exact forbidden entries', async () => {
  for (const id of ['BYP-LK-03', 'BYP-LK-04']) {
    const row = rowFor(id)
    const record = buildCaseRecord(row, await runLinkCase(row))
    assert.equal(record.exercised, 'yes', id)
    const evidence = record.effectEvidence as { trees: Array<Record<string, unknown>> }
    const tree = evidence.trees[0]
    assert.ok(tree !== undefined)
    assert.equal(tree.postHocAccepted, true, `${id}: reported path must be accepted`)
  }
})

test('BYP-SA-01/02: materialized subagent writes land with named live-host obligations (V5)', async () => {
  for (const id of ['BYP-SA-01', 'BYP-SA-02']) {
    const row = rowFor(id)
    const record = buildCaseRecord(row, await runnerFor(BYPASS_RUNNERS, id)(row))
    assert.equal(record.classification, 'unsupported', id)
    assert.equal(record.observed?.effectLanded, true, id)
    assert.ok(record.obligations.length > 0, 'live-host subagent protocol named as an obligation')
  }
})

test('NRE-01/02/03: non-enrollment lands with detectorAbsence and never a refusal (D7)', async () => {
  for (const id of ['NRE-01', 'NRE-02', 'NRE-03']) {
    const row = rowFor(id)
    const record = buildCaseRecord(row, await runnerFor(BYPASS_RUNNERS, id)(row))
    assert.equal(record.classification, 'unsupported', id)
    const evidence = record.effectEvidence as Record<string, unknown>
    assert.equal(evidence.detectorAbsence, true, id)
    assert.equal(record.observed?.refusalObserved, false, id)
  }
})

const emptyProbe = { exists: false, realpath: null, contentHash: null }
const landedProbe = { exists: true, realpath: '/tmp/x', contentHash: 'aa' }

test('R1: effectLanded derives from probes — a hardcoded signal cannot pass', () => {
  const noEffect = buildSh01Outcome({
    before: emptyProbe,
    after: emptyProbe,
    refusalObserved: false,
    detectionObserved: false,
    refusalSource: null,
    guardInvocation: false,
    ledger: [],
  })
  assert.equal(noEffect.observed?.effectLanded, false, 'no probe, no effect signal')
  const effectEvidence = noEffect.effectEvidence as Record<string, unknown>
  assert.equal(
    effectEvidence.realpathVerified,
    false,
    'realpathVerified only from a resolved probe',
  )
})

test('R1: runtime rows report probe-derived signals (five-row fabricated-evidence class)', async () => {
  for (const id of ['BYP-SP-01', 'BYP-SP-02', 'BYP-MC-02', 'BYP-SA-01', 'BYP-SA-02']) {
    const row = rowFor(id)
    const record = buildCaseRecord(row, await runnerFor(BYPASS_RUNNERS, id)(row))
    const after = record.effectEvidence.after
    assert.ok(
      after !== null && typeof after === 'object' && 'exists' in after && 'realpath' in after,
      id,
    )
    assert.equal(record.observed?.effectLanded, after.exists, `${id}: signal must equal the probe`)
    assert.equal(
      (record.effectEvidence as Record<string, unknown>).realpathVerified,
      after.exists && after.realpath !== null,
      `${id}: realpathVerified must come from the probe`,
    )
  }
})

test('R2: the must-prove row records the REFUTED branch (AC4/OQ-5)', () => {
  const refuted = buildSh01Outcome({
    before: emptyProbe,
    after: emptyProbe,
    refusalObserved: true,
    detectionObserved: false,
    refusalSource: 'model-gate',
    guardInvocation: false,
    ledger: ['model-gate.mjs pre-tool (exit 2, BLOCK)'],
  })
  const record = buildCaseRecordOrRefusal(rowFor('BYP-SH-01'), refuted)
  assert.ok('classification' in record, 'refuted outcomes are records, not thrown failures')
  assert.equal(record.classification, 'mechanical')
  assert.equal(record.hypothesisFalsified, true, 'refutation falsifies the recorded hypothesis')
  const effectEvidence = record.effectEvidence as Record<string, unknown>
  const namedSignals = effectEvidence.namedSignals
  assert.ok(namedSignals !== null && typeof namedSignals === 'object')
  assert.ok(
    'effectObservation' in namedSignals && 'guardNonInvocation' in namedSignals,
    'both named signals must carry status in the refuted branch',
  )
})

test('R2: the must-prove row records the PROVEN branch two-sided', () => {
  const proven = buildSh01Outcome({
    before: emptyProbe,
    after: landedProbe,
    refusalObserved: false,
    detectionObserved: false,
    refusalSource: null,
    guardInvocation: false,
    ledger: [],
  })
  const record = buildCaseRecordOrRefusal(rowFor('BYP-SH-01'), proven)
  assert.ok('classification' in record)
  assert.equal(record.classification, 'unsupported')
  assert.equal(record.hypothesisFalsified, false)
})

test('R2: an ambiguous must-prove outcome refuses emission, recorded — never reshaped', () => {
  const ambiguous = buildSh01Outcome({
    before: emptyProbe,
    after: emptyProbe,
    refusalObserved: false,
    detectionObserved: false,
    refusalSource: null,
    guardInvocation: false,
    ledger: [],
  })
  const record = buildCaseRecordOrRefusal(rowFor('BYP-SH-01'), ambiguous)
  assert.ok(!('classification' in record), 'ambiguous signals must not yield a classification')
  assert.equal(record.code, 'SIGNAL_AMBIGUOUS')
})
