/**
 * Hypothesis binding (#32, failing-when-broken) and the reviewer-focus
 * mandate (AC12): each of the 11 mandated focus questions has a binding test
 * or a named review obligation — none is silently unowned.
 */

import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { HarnessError } from '../src/errors.js'
import {
  buildCaseRecord,
  type CaseOutcome,
  type ObservedSignals,
  scanBannedClaims,
} from '../src/record.js'
import { type CaseRow, loadRegistry } from '../src/vectors.js'

/**
 * The 11 mandated reviewer-focus questions (spec Verification Plan) and where
 * each is bound: a test in this package (named) or a review obligation.
 */
export const REVIEW_MANDATE: ReadonlyArray<{ question: string; binding: string }> = [
  {
    question: 'classification honesty (D13)',
    binding: 'test: T4 derivation + hypothesis-not-classification',
  },
  {
    question: 'policy-class honesty',
    binding: 'test: mechanism derived from refusal source; tallies separate',
  },
  { question: 'non-enrollment rule (D7)', binding: 'test: V7 rows can never classify mechanical' },
  { question: 'pin integrity (#34)', binding: 'test: surface-pins three-state' },
  { question: 'warm/cold separation', binding: 'test: cold record cannot leak into warm' },
  { question: 'deadline honesty (D8)', binding: 'test: late response cannot overwrite terminal' },
  {
    question: 'FK-P2 three-state (MEAS-05)',
    binding: 'test: FK2 reference three-state classification',
  },
  {
    question: 'real-surface faithfulness',
    binding: 'test: channel tests invoke real shipped entry points',
  },
  {
    question: 'non-vacuousness of mechanical',
    binding: 'test: channels-gate controls + unsupported effect evidence',
  },
  {
    question: 'skip-and-record discipline',
    binding: 'test: not-exercised requires a gap record; never passed',
  },
  { question: 'scope honesty', binding: 'test: banned-claim scan over emitted bytes' },
]

function row(overrides: Partial<CaseRow> = {}): CaseRow {
  return {
    id: 'HYP-1',
    kind: 'vector',
    vectorClass: 'V2',
    className: 'Subprocess',
    channel: 'subprocess',
    scenario: 'x',
    hypothesis: { classification: 'unsupported', basis: 'basis' },
    requiredSignals: ['a'],
    params: {},
    notes: '',
    ...overrides,
  }
}

function outcome(observed: ObservedSignals, notes = ''): CaseOutcome {
  return {
    exercised: 'yes',
    observed,
    guardInvocation: false,
    invocationLedger: [],
    effectEvidence: {},
    artifacts: [],
    gapRecord: null,
    obligations: [],
    notes,
  }
}

const landed: ObservedSignals = {
  refusalObserved: false,
  effectLanded: true,
  detectionObserved: false,
  refusalSource: null,
  collateralObserved: false,
}

test('mutating the fixture hypothesis cannot change the derived classification (#32)', () => {
  const original = buildCaseRecord(row(), outcome(landed))
  const mutated = buildCaseRecord(
    row({ hypothesis: { classification: 'mechanical', basis: 'a different, wrong hypothesis' } }),
    outcome(landed),
  )
  assert.equal(original.classification, 'unsupported')
  assert.equal(mutated.classification, 'unsupported', 'classification must come from signals only')
  assert.equal(mutated.hypothesisFalsified, true)
})

test('a fixture claiming a refusal cannot make a V7 row mechanical (#32)', () => {
  const claimed = row({
    vectorClass: 'V7',
    hypothesis: { classification: 'mechanical', basis: 'fixture falsely claims a refusal' },
    requiredSignals: ['refusalObserved: true'],
  })
  assert.throws(
    () =>
      buildCaseRecord(
        claimed,
        outcome({
          refusalObserved: true,
          effectLanded: false,
          detectionObserved: false,
          refusalSource: 'model-gate',
          collateralObserved: false,
        }),
      ),
    (err: unknown) => err instanceof HarnessError && err.code === 'SIGNAL_AMBIGUOUS',
  )
})

test('a seeded enforcement claim in a record is caught by the scan (#32)', () => {
  const record = buildCaseRecord(
    row(),
    outcome(landed, 'this row claims the harness enforces scope containment'),
  )
  const violations = scanBannedClaims(record.notes)
  assert.ok(violations.length > 0, 'banned claim must be detected in record bytes')
})

test('every registry case binds a hypothesis and signal set (binding input for reviews)', () => {
  const registry = loadRegistry()
  for (const caseRow of registry.all) {
    assert.ok(caseRow.hypothesis.basis.length > 0)
    assert.ok(caseRow.requiredSignals.length > 0)
  }
})

test('all 11 mandated reviewer-focus questions have a named binding', () => {
  assert.equal(REVIEW_MANDATE.length, 11)
  for (const entry of REVIEW_MANDATE) {
    assert.ok(entry.binding.length > 0, `unbound question: ${entry.question}`)
    assert.notEqual(scanBannedClaims(entry.question).length > 0, true)
  }
})
