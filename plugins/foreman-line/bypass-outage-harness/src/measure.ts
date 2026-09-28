/**
 * Measurement engine (spec "Measurement design", INF-5 retarget; A1/D21 per
 * FK-P1 F05.16 literals).
 *
 *  - Percentiles: nearest-rank over integer microseconds sorted ascending,
 *    pX = a[ceil(X·N/100)], 1-indexed, clamped to N. Deterministic; no
 *    interpolation.
 *  - Populations (OQ-4 binding): warm N ≥ 200 per measured seam, cold N ≥ 10
 *    fresh sequences, deadline cases 3 repeats each. Below threshold the
 *    claim is refused with `MEASUREMENT_INCOMPLETE` while records are
 *    retained.
 *  - Warm/cold separation: a percentile computation over a population that is
 *    not uniform throws — a cold record can never leak into a warm
 *    computation, and `firstCallObservation` is never folded into warm.
 *  - Deadline records: `lateResponsePolicy: ignore-terminal-outcome` is
 *    enforced by the record shape — once the terminal outcome is recorded a
 *    late response can only set `lateResponseIgnored`, never overwrite the
 *    terminal outcome.
 */

import { HarnessError } from './errors.js'

export type Span = 'mediatedActionLatency' | 'firstCallObservation' | 'kernelDecisionLatency'
export type Population = 'warm' | 'cold' | 'deadline'
export type Clock = 'adapter-monotonic' | 'kernel-monotonic-analog'
export type ObservationPoint = 'IP-1→IP-2' | 'IP-3'

export interface MeasurementRecord {
  readonly caseId: string
  readonly span: Span
  readonly population: Population
  readonly elapsedMicros: number
  readonly budgetMicros: number | null
  readonly clock: Clock
  readonly observationPoint: ObservationPoint
  readonly sequenceIndex: number
  readonly hostFactsDigest: string
  readonly deadlineDisposition: 'terminal-unreachable' | null
  readonly lateResponseIgnored: boolean | null
}

export const POPULATION_MINIMUMS: Readonly<Record<Population, number>> = {
  warm: 200,
  cold: 10,
  deadline: 3,
}

/** F05.16 budget literals (µs). */
export const BUDGETS = {
  mediatedActionLatencyP99: 150_000,
  firstCallObservationMax: 2_000_000,
  kernelDecisionLatencyP50: 5_000,
  kernelDecisionLatencyP95: 20_000,
  kernelDecisionLatencyP99: 50_000,
  hardDeadline: 1_000_000,
} as const

/** Binding OQ-6 caveat carried verbatim in measurement-summary.json. */
export const IP3_COMPARABILITY_CAVEAT =
  'IP-3 is an analog of, not identical to, the D21 kernelDecisionLatency literal ' +
  '(request-received to response-written at the decision surface); no measurement row ' +
  'presents IP-3 numbers as the D21 span itself.'

/** Nearest-rank percentile over ascending-sorted integer microseconds. */
export function nearestRank(sortedAsc: readonly number[], percentile: number): number {
  if (sortedAsc.length === 0) {
    throw new HarnessError('MEASUREMENT_INCOMPLETE', 'percentile over an empty population')
  }
  const rank = Math.ceil((percentile / 100) * sortedAsc.length)
  const index = Math.min(Math.max(rank, 1), sortedAsc.length) - 1
  const value = sortedAsc[index]
  if (value === undefined) {
    throw new HarnessError('MEASUREMENT_INCOMPLETE', 'percentile rank out of range')
  }
  return value
}

export interface SpanSummary {
  readonly span: Span
  readonly population: Population
  readonly n: number
  readonly min: number
  readonly p50: number
  readonly p95: number
  readonly p99: number
  readonly max: number
  readonly budgetMicros: number | null
  readonly budgetMiss: boolean
}

/**
 * Percentiles for one (span, population) cell. Throws unless EVERY record
 * belongs to the requested population and span — enforced warm/cold
 * separation (AC6).
 */
export function percentilesFor(
  records: readonly MeasurementRecord[],
  span: Span,
  population: Population,
): SpanSummary {
  if (records.length === 0) {
    throw new HarnessError('MEASUREMENT_INCOMPLETE', `no records for ${span}/${population}`)
  }
  for (const r of records) {
    if (r.population !== population || r.span !== span) {
      throw new HarnessError(
        'MEASUREMENT_INCOMPLETE',
        `population separation violated: ${r.span}/${r.population} record inside ${span}/${population} computation`,
      )
    }
    if (!Number.isSafeInteger(r.elapsedMicros) || r.elapsedMicros < 0) {
      throw new HarnessError(
        'EVIDENCE_WRITE_FAILED',
        `elapsedMicros must be a non-negative integer (got ${String(r.elapsedMicros)})`,
      )
    }
  }
  const sorted = records.map((r) => r.elapsedMicros).sort((a, b) => a - b)
  const budgetMicros =
    span === 'mediatedActionLatency'
      ? BUDGETS.mediatedActionLatencyP99
      : span === 'firstCallObservation'
        ? BUDGETS.firstCallObservationMax
        : BUDGETS.kernelDecisionLatencyP99
  const p50 = nearestRank(sorted, 50)
  const p95 = nearestRank(sorted, 95)
  const p99 = nearestRank(sorted, 99)
  const max = sorted[sorted.length - 1] ?? 0
  // Budget rule: firstCallObservation is a max-rule (every cold call ≤ budget);
  // the warm spans are p99-rules; kernelDecisionLatency also carries p50/p95
  // rules checked by the summary obligation rows.
  const budgetMiss =
    span === 'firstCallObservation'
      ? max > budgetMicros
      : span === 'kernelDecisionLatency'
        ? p99 > budgetMicros ||
          p95 > BUDGETS.kernelDecisionLatencyP95 ||
          p50 > BUDGETS.kernelDecisionLatencyP50
        : p99 > budgetMicros
  return {
    span,
    population,
    n: sorted.length,
    min: sorted[0] ?? 0,
    p50,
    p95,
    p99,
    max,
    budgetMicros,
    budgetMiss,
  }
}

export interface PopulationStatus {
  readonly population: Population
  readonly required: number
  readonly observed: number
  readonly complete: boolean
}

/** Per-population accounting over retained records (claim gate). */
export function populationStatus(
  records: readonly MeasurementRecord[],
): readonly PopulationStatus[] {
  return (['warm', 'cold', 'deadline'] as const).map((population) => {
    const observed = records.filter((r) => r.population === population).length
    return {
      population,
      required: POPULATION_MINIMUMS[population],
      observed,
      complete: observed >= POPULATION_MINIMUMS[population],
    }
  })
}

/** Binding OQ-4 gate: below threshold the claim is refused, records retained. */
export function assertPopulationsComplete(records: readonly MeasurementRecord[]): void {
  const incomplete = populationStatus(records).filter((s) => !s.complete)
  if (incomplete.length > 0) {
    throw new HarnessError(
      'MEASUREMENT_INCOMPLETE',
      `population minimums not met: ${incomplete.map((s) => `${s.population} ${s.observed}/${s.required}`).join(', ')}`,
      { incomplete },
    )
  }
}

/**
 * Deadline observation state. The terminal outcome is write-once; a late
 * response is recorded as ignored and can never overwrite it
 * (`lateResponsePolicy: ignore-terminal-outcome`).
 */
export class DeadlineObservation {
  private terminal: 'terminal-unreachable' | null = null
  private lateIgnored = false

  /** Record the deadline crossing: terminal outcome becomes 'terminal-unreachable'. */
  recordDeadlineCrossing(): void {
    if (this.terminal === null) this.terminal = 'terminal-unreachable'
  }

  /** A response completing after the deadline is ignored (never overwrites terminal). */
  recordLateResponse(): void {
    this.lateIgnored = true
    // Terminal outcome is untouched by construction.
  }

  fields(): Pick<MeasurementRecord, 'deadlineDisposition' | 'lateResponseIgnored'> {
    return {
      deadlineDisposition: this.terminal,
      lateResponseIgnored: this.terminal === null ? null : this.lateIgnored,
    }
  }
}
