/**
 * Measurement engine: nearest-rank determinism, population minimums
 * (MEASUREMENT_INCOMPLETE), enforced warm/cold separation, and the deadline
 * record shape (late response can never overwrite the terminal outcome).
 */

import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { Ajv } from 'ajv'
import { HarnessError } from '../src/errors.js'
import {
  assertPopulationsComplete,
  BUDGETS,
  DeadlineObservation,
  type MeasurementRecord,
  nearestRank,
  percentilesFor,
  populationStatus,
} from '../src/measure.js'

function dirnameOf(p: string): string {
  const normalized = p.replaceAll('\\', '/')
  return normalized.slice(0, normalized.lastIndexOf('/'))
}

function rec(overrides: Partial<MeasurementRecord> = {}): MeasurementRecord {
  return {
    caseId: 'MEAS-01',
    span: 'mediatedActionLatency',
    population: 'warm',
    elapsedMicros: 1000,
    budgetMicros: 150_000,
    clock: 'adapter-monotonic',
    observationPoint: 'IP-1→IP-2',
    sequenceIndex: 0,
    hostFactsDigest: 'sha256:test',
    deadlineDisposition: null,
    lateResponseIgnored: null,
    ...overrides,
  }
}

test('nearest-rank: pX = a[ceil(X*N/100)], 1-indexed, clamped, no interpolation', () => {
  const sorted = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
  assert.equal(nearestRank(sorted, 50), 50)
  assert.equal(nearestRank(sorted, 99), 100)
  assert.equal(nearestRank(sorted, 10), 10)
  assert.equal(nearestRank([7], 99), 7)
  assert.throws(
    () => nearestRank([], 50),
    (err: unknown) => err instanceof HarnessError && err.code === 'MEASUREMENT_INCOMPLETE',
  )
})

test('percentiles are deterministic over sorted integer microseconds', () => {
  const records = Array.from({ length: 200 }, (_, i) => rec({ elapsedMicros: (i + 1) * 10 }))
  const summary = percentilesFor(records, 'mediatedActionLatency', 'warm')
  assert.equal(summary.n, 200)
  assert.equal(summary.p50, 1000)
  assert.equal(summary.p99, 1980)
  assert.equal(summary.max, 2000)
  assert.equal(summary.budgetMiss, false)
})

test('a cold record can never leak into a warm computation (AC6)', () => {
  const mixed = [rec(), rec({ population: 'cold', span: 'firstCallObservation' })]
  assert.throws(
    () => percentilesFor(mixed, 'mediatedActionLatency', 'warm'),
    (err: unknown) => err instanceof HarnessError && err.code === 'MEASUREMENT_INCOMPLETE',
  )
})

test('firstCallObservation is its own population and never folded into warm', () => {
  const cold = Array.from({ length: 10 }, (_, i) =>
    rec({
      caseId: 'MEAS-02',
      span: 'firstCallObservation',
      population: 'cold',
      elapsedMicros: 100 + i,
    }),
  )
  const summary = percentilesFor(cold, 'firstCallObservation', 'cold')
  assert.equal(summary.n, 10)
  assert.equal(summary.budgetMiss, false)
})

test('population minimums gate per seam and per case (R6b, OQ-4 verbatim)', () => {
  const short = Array.from({ length: 5 }, (_, i) => rec({ elapsedMicros: i }))
  const status = populationStatus(short)
  const seam = status.find((s) => s.key === 'mediatedActionLatency' && s.kind === 'seam')
  assert.ok(seam !== undefined)
  assert.equal(seam.required, 200)
  assert.equal(seam.complete, false)
  assert.throws(
    () => assertPopulationsComplete(short),
    (err: unknown) => err instanceof HarnessError && err.code === 'MEASUREMENT_INCOMPLETE',
  )
})

test('an aggregate can never mask a short seam (R6b)', () => {
  // mediated warm 200 + cold 10 + deadline 3/3 complete, but kernel warm only 5
  const records: MeasurementRecord[] = [
    ...Array.from({ length: 200 }, (_, i) =>
      rec({
        caseId: 'MEAS-01',
        span: 'mediatedActionLatency',
        population: 'warm',
        elapsedMicros: i,
      }),
    ),
    ...Array.from({ length: 5 }, (_, i) =>
      rec({
        caseId: 'MEAS-03',
        span: 'kernelDecisionLatency',
        population: 'warm',
        elapsedMicros: i,
      }),
    ),
    ...Array.from({ length: 10 }, (_, i) =>
      rec({
        caseId: 'MEAS-02',
        span: 'firstCallObservation',
        population: 'cold',
        elapsedMicros: i,
      }),
    ),
    ...Array.from({ length: 3 }, (_, i) =>
      rec({ caseId: 'TMO-01', population: 'deadline', elapsedMicros: i }),
    ),
    ...Array.from({ length: 3 }, (_, i) =>
      rec({ caseId: 'TMO-02', population: 'deadline', elapsedMicros: i }),
    ),
  ]
  assert.throws(
    () => assertPopulationsComplete(records),
    (err: unknown) =>
      err instanceof HarnessError &&
      err.code === 'MEASUREMENT_INCOMPLETE' &&
      err.message.includes('kernelDecisionLatency'),
  )
  const kernel = populationStatus(records).find((s) => s.key === 'kernelDecisionLatency')
  assert.ok(kernel !== undefined && !kernel.complete)
})

test('deadline minimums gate per riding case (R6b)', () => {
  const records: MeasurementRecord[] = [
    ...Array.from({ length: 3 }, (_, i) =>
      rec({ caseId: 'TMO-01', population: 'deadline', elapsedMicros: i }),
    ),
    ...Array.from({ length: 2 }, (_, i) =>
      rec({ caseId: 'TMO-02', population: 'deadline', elapsedMicros: i }),
    ),
    ...Array.from({ length: 200 }, (_, i) =>
      rec({ span: 'mediatedActionLatency', population: 'warm', elapsedMicros: i }),
    ),
    ...Array.from({ length: 200 }, (_, i) =>
      rec({ span: 'kernelDecisionLatency', population: 'warm', elapsedMicros: i }),
    ),
    ...Array.from({ length: 10 }, (_, i) =>
      rec({
        caseId: 'MEAS-02',
        population: 'cold',
        span: 'firstCallObservation',
        elapsedMicros: i,
      }),
    ),
  ]
  assert.throws(
    () => assertPopulationsComplete(records),
    (err: unknown) =>
      err instanceof HarnessError &&
      err.code === 'MEASUREMENT_INCOMPLETE' &&
      err.message.includes('TMO-02'),
  )
})

test('obligation rows bind their own budget source (R5)', () => {
  // deadline records carry budgetMicros 1,000,000 — never the 150,000 warm literal
  const deadlineRecords = Array.from({ length: 3 }, (_, i) =>
    rec({
      caseId: 'TMO-01',
      population: 'deadline',
      elapsedMicros: 1_200_000 + i,
      budgetMicros: BUDGETS.hardDeadline,
    }),
  )
  const summary = percentilesFor(deadlineRecords, 'mediatedActionLatency', 'deadline')
  assert.equal(summary.budgetMicros, BUDGETS.hardDeadline)
  assert.equal(summary.budgetSource, 'T3/MEAS-04 hard deadline literal')
  assert.notEqual(summary.budgetMicros, BUDGETS.mediatedActionLatencyP99)
  const warmSummary = percentilesFor(
    Array.from({ length: 200 }, (_, i) => rec({ elapsedMicros: i })),
    'mediatedActionLatency',
    'warm',
  )
  assert.equal(warmSummary.budgetMicros, BUDGETS.mediatedActionLatencyP99)
  assert.equal(warmSummary.budgetSource, 'F05.16 mediatedActionLatency p99 literal')
})

test('the measurement schema rejects terminal erasure (R6a, write-once)', () => {
  const schema = JSON.parse(
    readFileSync(
      join(
        dirnameOf(fileURLToPath(import.meta.url)),
        '..',
        'schemas',
        'measurement-record.schema.json',
      ),
      'utf8',
    ),
  )
  const validate = new Ajv({ allErrors: true }).compile(schema)
  const erased = { ...rec(), deadlineDisposition: null, lateResponseIgnored: true }
  const ok: boolean = validate(erased)
  assert.equal(ok, false, 'lateResponseIgnored:true with a null terminal must fail the schema')
  const valid = {
    ...rec(),
    deadlineDisposition: 'terminal-unreachable' as const,
    lateResponseIgnored: true,
  }
  assert.equal(validate(valid) as boolean, true)
})

test('a late response cannot overwrite the terminal unreachable outcome', () => {
  const observation = new DeadlineObservation()
  observation.recordDeadlineCrossing()
  observation.recordLateResponse()
  const fields = observation.fields()
  assert.equal(fields.deadlineDisposition, 'terminal-unreachable')
  assert.equal(fields.lateResponseIgnored, true)
  // a second deadline crossing cannot flip the terminal either
  observation.recordDeadlineCrossing()
  assert.equal(observation.fields().deadlineDisposition, 'terminal-unreachable')
})

test('before any deadline crossing there is no disposition and no late flag', () => {
  const observation = new DeadlineObservation()
  assert.deepEqual(observation.fields(), {
    deadlineDisposition: null,
    lateResponseIgnored: null,
  })
})
