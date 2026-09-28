/**
 * Measurement engine: nearest-rank determinism, population minimums
 * (MEASUREMENT_INCOMPLETE), enforced warm/cold separation, and the deadline
 * record shape (late response can never overwrite the terminal outcome).
 */

import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { HarnessError } from '../src/errors.js'
import {
  assertPopulationsComplete,
  DeadlineObservation,
  type MeasurementRecord,
  nearestRank,
  POPULATION_MINIMUMS,
  percentilesFor,
  populationStatus,
} from '../src/measure.js'

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

test('population minimums refuse the claim below threshold (MEASUREMENT_INCOMPLETE)', () => {
  const short = Array.from({ length: 5 }, (_, i) => rec({ elapsedMicros: i }))
  const status = populationStatus(short)
  const warm = status.find((s) => s.population === 'warm')
  assert.ok(warm !== undefined)
  assert.equal(warm.required, POPULATION_MINIMUMS.warm)
  assert.equal(warm.complete, false)
  assert.throws(
    () => assertPopulationsComplete(short),
    (err: unknown) => err instanceof HarnessError && err.code === 'MEASUREMENT_INCOMPLETE',
  )
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
