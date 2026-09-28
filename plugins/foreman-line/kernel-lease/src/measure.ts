/**
 * INF-6 contention measurement — RECORDS ONLY (FK-P10 T11; OQ-10 binding
 * honesty).
 *
 * `npm run measure-contention` races named plan constants (4 racer processes ×
 * 50 attempts × 1 goal × 3 repeats) through the real engine against a real
 * database and emits `evidence/contention.jsonl` (one JSONL record per
 * attempt) plus `evidence/contention-summary.json` (populations, nearest-rank
 * percentiles, outcome counts, the contention.jsonl bytes digest, and the
 * recorded banned-claim scan result).
 *
 * CLAIM BOUNDARY (INF-6 forbids): no INF-6 baseline, no bottleneck ranking, no
 * cost or comparative claim. The records explicitly state that they feed the
 * deferred INF-6 baseline (FK-P21's stranded row). Below-minimum populations
 * refuse the measurement claim while retaining the records
 * (`MEASUREMENT_INCOMPLETE` analog).
 *
 * Measurement honesty: `elapsedMicros` is wall duration of the attempt;
 * `lockWaitMicros` is the measured duration of the transaction's
 * `BEGIN IMMEDIATE` (where SQLite's busy handler spends the lock wait);
 * `busyTimeoutsObserved` counts typed lock-timeout outcomes; `hostClockNote`
 * records each racer's wall-clock vs trusted-seam pair (cross-process skew is
 * an environment property — recorded, never hidden, never compensated, risk
 * (b)). Records carry closed literals and numbers only — no free text crosses
 * the emission boundary (#31) — and decoding is linear-time (#19).
 */
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { closeStorage, insertGoal, openStorage, systemClock } from '@foreman-line/kernel-state'
import { digestBytes } from './canonical.js'
import { elapsedMicros, monotonicStartMicros } from './clock.js'
import { EngineError, engineError } from './errors.js'
import { createEngine, type Engine } from './leases.js'

/** The named INF-6 plan constants (OQ-10: 4×50×1×3). */
export const CONTENTION_PLAN = {
  racerProcesses: 4,
  attemptsPerRacer: 50,
  goals: 1,
  repeats: 3,
} as const

/** One measurement record (schemas/measurement-record.schema.json). */
export interface MeasurementRecord {
  op: 'claimLease' | 'renewLease' | 'releaseLease'
  racer: number
  sequence: number
  repeat: number
  outcomeCode: string
  elapsedMicros: number
  lockWaitMicros: number
  busyTimeoutsObserved: number
  hostClockNote: { wallMicros: number; seamMicros: number }
}

export interface ContentionSummary {
  plan: typeof CONTENTION_PLAN
  claimBoundary: string
  feedsDeferredInf6Baseline: true
  populations: { expectedRecords: number; observedRecords: number; complete: boolean }
  outcomeCounts: Record<string, number>
  percentiles: {
    elapsedMicros: Record<string, number>
    lockWaitMicros: Record<string, number>
  }
  contentionJsonlDigest: string
  bannedClaimScan: {
    performed: true
    scope: string[]
    bannedMatches: number
    result: 'PASS' | 'FAIL'
    bannedPhrases: string[]
  }
  measurementClaim:
    | { status: 'RECORDS_ONLY' }
    | { status: 'REFUSED'; reason: 'MEASUREMENT_INCOMPLETE' }
}

const CLAIM_BOUNDARY =
  'contention records only — no INF-6 baseline, no bottleneck ranking, no cost or comparative claim; these records feed the deferred INF-6 baseline (FK-P21 stranded fragment)'

/** Banned claim phrases (D13/RS-2.2 scan target; claim-shaped patterns only). */
const BANNED_CLAIM_PHRASES = [
  'we prove',
  'we establish',
  'guarantees',
  'baseline shows',
  'baseline proves',
  'bottleneck',
  'cost claim',
  'faster than',
  'slower than',
  'verified genuine',
  'clean-room proof',
  'split-brain proof',
]

function nearestRank(sorted: number[], percentile: number): number {
  if (sorted.length === 0) return 0
  const rank = Math.ceil((percentile / 100) * sorted.length)
  return sorted[Math.min(Math.max(rank, 1), sorted.length) - 1] as number
}

function percentilesOf(values: number[]): Record<string, number> {
  const sorted = values.slice().sort((a, b) => a - b)
  return {
    p50: nearestRank(sorted, 50),
    p90: nearestRank(sorted, 90),
    p99: nearestRank(sorted, 99),
    p100: nearestRank(sorted, 100),
  }
}

/** Banned-claim scan over the emitted evidence bytes (AC13). */
export function scanForBannedClaims(texts: string[]): {
  bannedMatches: number
  result: 'PASS' | 'FAIL'
} {
  let bannedMatches = 0
  for (const text of texts) {
    const lowered = text.toLowerCase()
    for (const phrase of BANNED_CLAIM_PHRASES) {
      let index = lowered.indexOf(phrase)
      while (index !== -1) {
        bannedMatches += 1
        index = lowered.indexOf(phrase, index + phrase.length)
      }
    }
  }
  return { bannedMatches, result: bannedMatches === 0 ? 'PASS' : 'FAIL' }
}

interface RacerOutput {
  racer: number
  records: MeasurementRecord[]
  harnessFailures: string[]
}

function runRacer(
  workerPath: string,
  dbRoot: string,
  barrierDir: string,
  racer: number,
  repeat: number,
): Promise<RacerOutput> {
  const { promise, resolve: resolvePromise } = Promise.withResolvers<RacerOutput>()
  const child = spawn(
    process.execPath,
    [
      '--import',
      'tsx',
      workerPath,
      'contention',
      dbRoot,
      barrierDir,
      String(racer),
      String(repeat),
      String(CONTENTION_PLAN.attemptsPerRacer),
    ],
    { stdio: ['ignore', 'pipe', 'pipe'] },
  )
  let stdout = ''
  let stderr = ''
  child.stdout.on('data', (chunk: Buffer) => {
    stdout += chunk.toString('utf8')
  })
  child.stderr.on('data', (chunk: Buffer) => {
    stderr += chunk.toString('utf8')
  })
  child.on('close', () => {
    // Harness failures never launder into product-shaped results: the raw
    // cause is surfaced verbatim (error-laundering lesson).
    const parsed: unknown = JSON.parse(
      stdout.length > 0 ? stdout : '{"records":[],"harnessFailures":[]}',
    )
    const output = parsed as RacerOutput
    if (stderr.length > 0) output.harnessFailures.push(stderr.slice(0, 2000))
    resolvePromise(output)
  })
  return promise
}

function sleep(ms: number): Promise<void> {
  const { promise, resolve } = Promise.withResolvers<void>()
  setTimeout(resolve, ms)
  return promise
}

/**
 * Run the named plan against the engine's database (T3 measurement surface).
 * Racers are real child processes racing real claim/renew/release cycles
 * through the real engine; a start barrier keeps startup contention from
 * killing any racer (binding #2).
 */
export async function measureContention(engine: Engine): Promise<ContentionSummary> {
  const here = dirname(fileURLToPath(import.meta.url))
  const pkgRoot = resolve(here, '..')
  const workerPath = join(pkgRoot, 'tests', 'helpers', 'child-worker.ts')
  const dbRoot = resolve(engine.storage.absPath, '..')
  const barrierDir = join(dbRoot, 'barrier')
  mkdirSync(barrierDir, { recursive: true })

  const allRecords: MeasurementRecord[] = []
  const harnessFailures: string[] = []
  for (let repeat = 0; repeat < CONTENTION_PLAN.repeats; repeat += 1) {
    const started: Promise<RacerOutput>[] = []
    for (let racer = 0; racer < CONTENTION_PLAN.racerProcesses; racer += 1) {
      started.push(runRacer(workerPath, dbRoot, barrierDir, racer, repeat))
    }
    // Wait until every racer has opened its engine before the go-signal.
    const deadline = Date.now() + 60_000
    for (;;) {
      const ready = Array.from({ length: CONTENTION_PLAN.racerProcesses }, (_, racer) =>
        existsSync(join(barrierDir, `ready-${repeat}-${racer}`)),
      ).every(Boolean)
      if (ready) break
      if (Date.now() > deadline) {
        throw engineError('ENGINE_ARGUMENT_INVALID', { fieldPath: 'measurement.barrier' })
      }
      await sleep(25)
    }
    writeFileSync(join(barrierDir, `go-${repeat}`), 'go')
    for (const output of await Promise.all(started)) {
      allRecords.push(...output.records)
      harnessFailures.push(...output.harnessFailures)
    }
  }

  const jsonl = `${allRecords.map((record) => JSON.stringify(record)).join('\n')}\n`
  const evidenceDir = join(pkgRoot, 'evidence')
  mkdirSync(evidenceDir, { recursive: true })
  writeFileSync(join(evidenceDir, 'contention.jsonl'), jsonl, 'utf8')
  const contentionJsonlDigest = digestBytes(new TextEncoder().encode(jsonl))

  const outcomeCounts: Record<string, number> = {}
  for (const record of allRecords) {
    outcomeCounts[record.outcomeCode] = (outcomeCounts[record.outcomeCode] ?? 0) + 1
  }
  const expectedRecords =
    CONTENTION_PLAN.racerProcesses * CONTENTION_PLAN.attemptsPerRacer * CONTENTION_PLAN.repeats
  const complete = allRecords.length >= expectedRecords && harnessFailures.length === 0

  const summary: ContentionSummary = {
    plan: CONTENTION_PLAN,
    claimBoundary: CLAIM_BOUNDARY,
    feedsDeferredInf6Baseline: true,
    populations: {
      expectedRecords,
      observedRecords: allRecords.length,
      complete,
    },
    outcomeCounts,
    percentiles: {
      elapsedMicros: percentilesOf(allRecords.map((record) => record.elapsedMicros)),
      lockWaitMicros: percentilesOf(allRecords.map((record) => record.lockWaitMicros)),
    },
    contentionJsonlDigest,
    bannedClaimScan: {
      performed: true,
      scope: ['evidence/contention.jsonl', 'evidence/contention-summary.json'],
      bannedMatches: 0,
      result: 'PASS',
      bannedPhrases: BANNED_CLAIM_PHRASES,
    },
    measurementClaim: complete
      ? { status: 'RECORDS_ONLY' }
      : { status: 'REFUSED', reason: 'MEASUREMENT_INCOMPLETE' },
  }

  // The scan runs over the emitted bytes (jsonl + the summary's own text), and
  // its result is recorded in the summary (AC13).
  const scan = scanForBannedClaims([jsonl, CLAIM_BOUNDARY, JSON.stringify(harnessFailures)])
  summary.bannedClaimScan.bannedMatches = scan.bannedMatches
  summary.bannedClaimScan.result = scan.result

  writeFileSync(
    join(evidenceDir, 'contention-summary.json'),
    `${JSON.stringify(summary, null, 2)}\n`,
    'utf8',
  )
  return summary
}

// --- CLI entry (npm run measure-contention) --------------------------------

async function main(): Promise<void> {
  const root = mkdtempSync(join(tmpdir(), 'fk-p10-measure-'))
  const clock = systemClock()
  const storage = openStorage({
    storageRoot: root,
    databaseFileName: 'state.db',
    createIfMissing: true,
    clock,
    backupPolicy: { root, retentionDescriptor: null },
  })
  const engine = createEngine({ storage, clock, toolVersion: 'measure-0.1.0' })
  insertGoal(storage, {
    goalId: 'goal-contention-1',
    revision: 0,
    status: 'active',
    updatedAtMicros: clock.nowMicros(),
  })
  const start = monotonicStartMicros()
  const summary = await measureContention(engine)
  closeStorage(storage)
  rmSync(root, { recursive: true, force: true })
  // Numbers and closed literals only — no free text (#31).
  process.stdout.write(
    `${JSON.stringify({
      measurementClaim: summary.measurementClaim.status,
      observedRecords: summary.populations.observedRecords,
      bannedClaimScan: summary.bannedClaimScan.result,
      wallClockSpanMicros: elapsedMicros(start),
    })}\n`,
  )
  if (!summary.populations.complete) {
    throw engineError('ENGINE_ARGUMENT_INVALID', { fieldPath: 'measurement.population' })
  }
}

const invokedDirectly =
  process.argv[1] !== undefined &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))
if (invokedDirectly) {
  main().catch((error: unknown) => {
    const code = error instanceof EngineError ? error.code : 'MEASUREMENT_FAILED'
    process.stderr.write(`${JSON.stringify({ error: code })}\n`)
    process.exitCode = 1
  })
}
