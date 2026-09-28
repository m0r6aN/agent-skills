/**
 * Evidence record construction: T4 derivation, D13 honesty rules (mechanical),
 * sanitization (#31), and the banned-claim scan (AC5).
 */

import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { CanonicalEncodeError, canonicalJson, sanitizeText } from '../src/canonical.js'
import { HarnessError } from '../src/errors.js'
import {
  BANNED_CLAIM_PHRASES,
  buildCaseRecord,
  type CaseOutcome,
  deriveClassification,
  deriveMechanism,
  type ObservedSignals,
  scanBannedClaims,
} from '../src/record.js'
import type { CaseRow } from '../src/vectors.js'

function row(overrides: Partial<CaseRow> = {}): CaseRow {
  return {
    id: 'BYP-X-01',
    kind: 'vector',
    vectorClass: 'V1',
    className: 'Shell',
    channel: 'shell',
    scenario: 'x',
    hypothesis: { classification: 'unsupported', basis: 'basis' },
    requiredSignals: ['a'],
    params: {},
    notes: '',
    ...overrides,
  }
}

function signals(overrides: Partial<ObservedSignals> = {}): ObservedSignals {
  return {
    refusalObserved: false,
    effectLanded: true,
    detectionObserved: false,
    refusalSource: null,
    collateralObserved: false,
    ...overrides,
  }
}

function outcome(overrides: Partial<CaseOutcome> = {}): CaseOutcome {
  return {
    exercised: 'yes',
    observed: signals(),
    guardInvocation: false,
    invocationLedger: [],
    effectEvidence: {},
    artifacts: [],
    gapRecord: null,
    obligations: [],
    notes: '',
    ...overrides,
  }
}

test('T4 derivation: every non-ambiguous signal combination maps per the table', () => {
  assert.equal(
    deriveClassification(signals({ refusalObserved: true, effectLanded: false })),
    'mechanical',
  )
  assert.equal(
    deriveClassification(
      signals({ refusalObserved: false, effectLanded: true, detectionObserved: true }),
    ),
    'detected',
  )
  assert.equal(
    deriveClassification(
      signals({ refusalObserved: false, effectLanded: true, detectionObserved: false }),
    ),
    'unsupported',
  )
})

test('T4 ambiguity refuses emission (SIGNAL_AMBIGUOUS)', () => {
  assert.throws(
    () => deriveClassification(signals({ refusalObserved: true, effectLanded: true })),
    (err: unknown) => err instanceof HarnessError && err.code === 'SIGNAL_AMBIGUOUS',
  )
  assert.throws(
    () => deriveClassification(signals({ refusalObserved: false, effectLanded: false })),
    (err: unknown) => err instanceof HarnessError && err.code === 'SIGNAL_AMBIGUOUS',
  )
})

test('mechanismPolicyClass is derived from the refusal source, never free-form', () => {
  assert.equal(deriveMechanism(signals({ refusalSource: 'model-gate' })), 'model-membership')
  assert.equal(deriveMechanism(signals({ refusalSource: 'mutation-scope-guard' })), 'scope')
  assert.equal(deriveMechanism(signals()), 'none')
  const record = buildCaseRecord(
    row({ vectorClass: 'V6' }),
    outcome({
      observed: signals({
        refusalObserved: true,
        effectLanded: false,
        refusalSource: 'model-gate',
      }),
    }),
  )
  assert.equal(record.mechanismPolicyClass, 'model-membership')
  assert.equal(record.classification, 'mechanical')
})

test('V7 rows can never classify mechanical (D7, failing-when-broken #32)', () => {
  assert.throws(
    () =>
      buildCaseRecord(
        row({ vectorClass: 'V7' }),
        outcome({
          observed: signals({
            refusalObserved: true,
            effectLanded: false,
            refusalSource: 'model-gate',
          }),
        }),
      ),
    (err: unknown) => err instanceof HarnessError && err.code === 'SIGNAL_AMBIGUOUS',
  )
  const record = buildCaseRecord(
    row({ vectorClass: 'V7', hypothesis: { classification: 'unsupported', basis: 'b' } }),
    outcome({ observed: signals(), effectEvidence: { detectorAbsence: true } }),
  )
  assert.equal(record.classification, 'unsupported')
})

test('the hypothesis is never written into the classification field; falsification is recorded', () => {
  const falsified = buildCaseRecord(
    row({ hypothesis: { classification: 'mechanical', basis: 'b' } }),
    outcome(),
  )
  assert.equal(falsified.classification, 'unsupported')
  assert.equal(falsified.hypothesisFalsified, true)
  const confirmed = buildCaseRecord(
    row({ hypothesis: { classification: 'unsupported', basis: 'b' } }),
    outcome(),
  )
  assert.equal(confirmed.hypothesisFalsified, false)
})

test('not-exercised requires a gap record and is never passed', () => {
  assert.throws(
    () => buildCaseRecord(row(), outcome({ exercised: 'gap', observed: null })),
    (err: unknown) => err instanceof HarnessError && err.code === 'EVIDENCE_WRITE_FAILED',
  )
  const gap = buildCaseRecord(
    row(),
    outcome({
      exercised: 'gap',
      observed: null,
      gapRecord: {
        code: 'CHANNEL_SETUP_FAILED',
        reason: 'blocked: privilege unavailable',
        obligation: 'FK-P18′ lane: evidence obligation',
      },
    }),
  )
  assert.equal(gap.status, 'not-exercised')
  assert.equal(gap.classification, null)
  assert.ok(gap.gapRecord !== null)
})

test('exercised rows cannot carry a gap record', () => {
  assert.throws(
    () =>
      buildCaseRecord(
        row(),
        outcome({ gapRecord: { code: 'x', reason: 'blocked: x', obligation: 'x' } }),
      ),
    (err: unknown) => err instanceof HarnessError && err.code === 'SIGNAL_AMBIGUOUS',
  )
})

test('external text is sanitized of control/format characters (#31)', () => {
  const dirty = 'ok bad​‮misplaced﻿'
  const record = buildCaseRecord(row(), outcome({ notes: dirty, effectEvidence: { echo: dirty } }))
  assert.equal(record.notes, 'ok badmisplaced')
  assert.equal(sanitizeText(dirty), 'ok badmisplaced')
})

test('sanitization is linear-time under hostile input (#19 bound)', () => {
  const hostile = 'x‮'.repeat(200_000)
  const start = Date.now()
  const clean = sanitizeText(hostile)
  const elapsed = Date.now() - start
  assert.equal(clean, 'x'.repeat(200_000))
  assert.ok(elapsed < 5_000, `sanitizer took ${elapsed}ms — bound violated`)
})

test('banned-claim scan fires on seeded claims and passes clean text (AC5)', () => {
  for (const phrase of BANNED_CLAIM_PHRASES) {
    assert.deepEqual(scanBannedClaims(`prefix ${phrase} suffix`), [phrase])
  }
  assert.deepEqual(
    scanBannedClaims('the matrix records mechanical, detected, unsupported rows'),
    [],
  )
  assert.deepEqual(scanBannedClaims('never mechanical, never a hook refusal (D7)'), [])
})

test('canonical bytes: sorted keys, integer-only numbers, no BOM', () => {
  assert.equal(canonicalJson({ b: 1, a: 2 }), '{"a":2,"b":1}')
  assert.throws(
    () => canonicalJson({ a: 1.5 }),
    (err: unknown) => err instanceof CanonicalEncodeError,
  )
  const bytes = new TextEncoder().encode(canonicalJson({ a: 'x' }))
  assert.notEqual(bytes[0], 0xef, 'no BOM')
})
