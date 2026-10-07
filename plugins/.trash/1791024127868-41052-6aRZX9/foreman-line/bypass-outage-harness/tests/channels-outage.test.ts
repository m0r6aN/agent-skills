/**
 * Outage channels against the real shipped hook (V9 timeout, V10 restart).
 * Deadline runs take ~1s each by design (hard deadline 1,000,000 µs).
 */

import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { OUTAGE_RUNNERS, runMeas05, runTmo01, runTmo02 } from '../src/channels/outage.js'
import { HarnessError } from '../src/errors.js'
import { buildCaseRecord, type CaseOutcome } from '../src/record.js'
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

test('TMO-01: stdin stall crosses the hard deadline with terminal outcome unreachable', async () => {
  const row = rowFor('TMO-01')
  const record = buildCaseRecord(row, await runTmo01(row))
  assert.equal(record.exercised, 'yes')
  const evidence = record.effectEvidence as Record<string, unknown>
  assert.equal(evidence.deadlineCrossed, true)
  assert.equal(evidence.terminalOutcome, 'unreachable')
  assert.equal(evidence.d8OutagePostureInheritance, 'not-proven')
  assert.equal(record.observed?.effectLanded, true, 'the governed action proceeds unmediated')
  assert.equal(record.classification, 'unsupported')
})

test('TMO-02: a late response is ignored and never overwrites the terminal outcome', async () => {
  const row = rowFor('TMO-02')
  const record = buildCaseRecord(row, await runTmo02(row))
  const evidence = record.effectEvidence as Record<string, unknown>
  assert.equal(evidence.deadlineCrossed, true)
  assert.equal(evidence.terminalOutcome, 'unreachable')
  assert.equal(evidence.lateResponseIgnored, true, 'lateResponsePolicy: ignore-terminal-outcome')
  assert.equal(record.classification, 'unsupported')
})

test('RST-01: carryover disposition is recorded across a materialized restart', async () => {
  const row = rowFor('RST-01')
  const record = buildCaseRecord(row, await runnerFor(OUTAGE_RUNNERS, 'RST-01')(row))
  assert.equal(record.exercised, 'yes')
  const evidence = record.effectEvidence as Record<string, unknown>
  assert.match(String(evidence.carryoverDisposition), /carried over/)
  assert.ok(record.obligations.length > 0, 'live-host restart protocol named as an obligation')
})

test('RST-02: a SIGKILLed hook produces no-response-completed and no refusal', async () => {
  const row = rowFor('RST-02')
  const record = buildCaseRecord(row, await runnerFor(OUTAGE_RUNNERS, 'RST-02')(row))
  const evidence = record.effectEvidence as Record<string, unknown>
  assert.equal(evidence.terminalOutcome, 'no-response-completed')
  assert.equal(record.observed?.refusalObserved, false)
  assert.equal(record.classification, 'unsupported')
})

test('MEAS-05: three-state FK-P2 consumption — measured state records the D10 divergence', async () => {
  const result = await runMeas05()
  if (result.state === 'measured') {
    assert.ok(result.compiledAuthority !== null)
    // The divergence row's reference authority is the compiled Allowed Files,
    // never surfaces: — where the guard accepts beyond it, the row records it.
    if (result.guardAcceptedOutsideAuthority !== null) {
      assert.ok(result.guardAcceptedOutsideAuthority.length > 0)
    }
    return
  }
  if (result.state === 'known-gap') {
    assert.ok(result.gapReason?.startsWith('blocked:'))
    return
  }
  throw new HarnessError('FK2_REFERENCE_DRIFT', 'unexpected FK-P2 reference state in test')
})
