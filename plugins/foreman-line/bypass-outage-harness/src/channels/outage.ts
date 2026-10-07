/**
 * Outage channels (V9 service timeout, V10 restart) and the measurement
 * executors (T3 MEAS-01…05).
 *
 * The harness plays the host/adapter role for measurement: IP-1 is the
 * adapter-monotonic timestamp immediately before spawning
 * `node hooks/model-gate.mjs <mode>`, IP-2 the child `close` observation.
 * IP-3 is the shipped guard decision seam (preflightCheck/postHocCheck entry
 * to return) — an ANALOG of the D21 kernelDecisionLatency literal (OQ-6
 * caveat carried in measurement-summary.json). IP-4 (hook-internal `evaluate`
 * :81) is unreachable without modifying the hook: recorded as an
 * INSTRUMENT_UNREACHABLE gap, never estimated.
 *
 * Deadline regime (D20/D8): per-decision hard deadline 1,000,000 µs from
 * IP-1. On crossing, the terminal outcome is recorded once; a late response is
 * ignored (`lateResponsePolicy: ignore-terminal-outcome`). D8 outage-posture
 * inheritance is recorded as expected NOT-PROVEN on the shipped surfaces —
 * recorded, never claimed.
 */

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { postHocCheck, preflightCheck } from '../../../mutation-scope-guard/src/index.js'
import { HarnessError } from '../errors.js'
import { BUDGETS, DeadlineObservation, type MeasurementRecord } from '../measure.js'
import type { CaseOutcome } from '../record.js'
import { classifyFk2Reference } from '../surface-refs.js'
import type { CaseRow } from '../vectors.js'
import { createWorkspace, delay, probeFile, shellWrite } from './fixtures.js'
import { runHookAsync, runHookSync } from './gate.js'

const APPROVED_MODEL = 'claude-sonnet-5-5'  // Amendment 06 N1 roster spelling; the bare -5 id is retired (gate policy v2)
const HARD_DEADLINE_MICROS = BUDGETS.hardDeadline

function monotonicMicros(start: bigint): number {
  return Number((process.hrtime.bigint() - start) / 1000n)
}

// ─── V9 service timeout ──────────────────────────────────────────────────────

export interface DeadlineRun {
  readonly observation: DeadlineObservation
  readonly elapsedMicros: number
  readonly effectLanded: boolean
  readonly hookExitCode: number | null
  readonly hookSignal: NodeJS.Signals | null
}

/**
 * One deadline run: stdin held open (the hook blocks in readFileSync(0)),
 * the hard deadline fires, the host disposition proceeds with the governed
 * mutation (nothing in the shipped surfaces enforces a deadline — D8 posture
 * not inherited), and for the 'late' flavor stdin is released after the
 * deadline so the hook's response completes late and is ignored.
 */
export async function runDeadlineRepeat(
  caseId: string,
  flavor: 'stall' | 'late',
  mutationTarget: string,
): Promise<DeadlineRun> {
  const started = process.hrtime.bigint()
  const hook = runHookAsync('pre-tool')
  hook.stdin.write(
    JSON.stringify({
      session_id: `fk17-${caseId.toLowerCase()}-${Date.now()}`,
      model: APPROVED_MODEL,
      tool_name: 'Write',
      tool_input: { file_path: mutationTarget },
    }),
  )
  // stdin intentionally NOT closed: readFileSync(0) blocks past the deadline.
  const observation = new DeadlineObservation()
  await delay(Math.ceil(HARD_DEADLINE_MICROS / 1000) + 50)
  let closedDuringRace = false
  await Promise.race([
    hook.closed.then(() => {
      closedDuringRace = true
    }),
    delay(1),
  ])
  // Snapshot the deadline-time state: the race callback above keeps mutating
  // its flag when a late close lands, which must not hide the late response.
  const closedBeforeDeadline = closedDuringRace
  if (!closedBeforeDeadline) {
    observation.recordDeadlineCrossing()
    // Host disposition: nothing enforces a deadline on the shipped surface;
    // the governed action proceeds unmediated (recorded, never claimed).
    shellWrite(mutationTarget, `deadline-${flavor}`)
    if (flavor === 'stall') {
      hook.child.kill('SIGKILL')
    } else {
      hook.stdin.end()
    }
  }
  const exit = await hook.closed
  if (flavor === 'late' && !closedBeforeDeadline) {
    observation.recordLateResponse()
  }
  return {
    observation,
    elapsedMicros: monotonicMicros(started),
    effectLanded: probeFile(mutationTarget).exists,
    hookExitCode: exit.exitCode,
    hookSignal: exit.signal,
  }
}

export async function runTmo01(_row: CaseRow): Promise<CaseOutcome> {
  const ws = createWorkspace()
  try {
    const target = join(ws.scopeDir, 'forbidden', 'tmo01.txt')
    const run = await runDeadlineRepeat('TMO-01', 'stall', target)
    if (run.observation.fields().deadlineDisposition === null) {
      throw new HarnessError('CHANNEL_EXEC_FAILED', 'TMO-01 expected a deadline crossing')
    }
    return {
      exercised: 'yes',
      observed: {
        refusalObserved: false,
        effectLanded: run.effectLanded,
        detectionObserved: false,
        refusalSource: null,
        collateralObserved: false,
      },
      guardInvocation: false,
      invocationLedger: [
        'model-gate.mjs pre-tool with held stdin (readFileSync(0) blocks)',
        'hard deadline 1,000,000 µs crossed; host proceeded with the governed action',
        'hook killed (SIGKILL) after terminal disposition',
      ],
      effectEvidence: {
        deadlineCrossed: true,
        terminalOutcome: 'unreachable',
        ...run.observation.fields(),
        elapsedMicros: run.elapsedMicros,
        hookExitCode: run.hookExitCode,
        hookSignal: run.hookSignal,
        d8OutagePostureInheritance: 'not-proven',
      },
      artifacts: [],
      gapRecord: null,
      obligations: [],
      notes:
        'stdin intake stall past the hard deadline; no internal deadline exists in the shipped hook (readFileSync(0) blocks); D8 posture inheritance recorded not-proven',
    }
  } finally {
    ws.dispose()
  }
}

export async function runTmo02(_row: CaseRow): Promise<CaseOutcome> {
  const ws = createWorkspace()
  try {
    const target = join(ws.scopeDir, 'forbidden', 'tmo02.txt')
    const run = await runDeadlineRepeat('TMO-02', 'late', target)
    const fields = run.observation.fields()
    if (fields.deadlineDisposition === null || fields.lateResponseIgnored !== true) {
      throw new HarnessError(
        'CHANNEL_EXEC_FAILED',
        `TMO-02 expected deadline crossing + late-response-ignore (got ${JSON.stringify(fields)})`,
      )
    }
    return {
      exercised: 'yes',
      observed: {
        refusalObserved: false,
        effectLanded: run.effectLanded,
        detectionObserved: false,
        refusalSource: null,
        collateralObserved: false,
      },
      guardInvocation: false,
      invocationLedger: [
        'model-gate.mjs pre-tool with delayed-EOF stdin',
        'hard deadline crossed; terminal outcome recorded',
        'late hook response completed after the deadline and was ignored (record shape forbids overwrite)',
      ],
      effectEvidence: {
        deadlineCrossed: true,
        terminalOutcome: 'unreachable',
        ...fields,
        elapsedMicros: run.elapsedMicros,
        hookExitCode: run.hookExitCode,
        d8OutagePostureInheritance: 'not-proven',
      },
      artifacts: [],
      gapRecord: null,
      obligations: [],
      notes:
        'late-completed response past the deadline: lateResponsePolicy ignore-terminal-outcome holds; the terminal outcome is never overwritten',
    }
  } finally {
    ws.dispose()
  }
}

// ─── V10 restart ─────────────────────────────────────────────────────────────

export async function runRst01(_row: CaseRow): Promise<CaseOutcome> {
  const ws = createWorkspace()
  try {
    const sessionId = `fk17-rst01-${Date.now()}`
    const target = join(ws.scopeDir, 'forbidden', 'restart-carryover.txt')
    const start = runHookSync('session-start', { session_id: sessionId, model: APPROVED_MODEL })
    if (start.exitCode !== 0) {
      throw new HarnessError('CHANNEL_EXEC_FAILED', 'RST-01 session-start failed')
    }
    // "Restart": a fresh hook process with the state dir preserved.
    const pre = runHookSync('pre-tool', {
      session_id: sessionId,
      tool_name: 'Write',
      tool_input: { file_path: target },
    })
    if (pre.exitCode !== 0) {
      throw new HarnessError(
        'CHANNEL_EXEC_FAILED',
        `RST-01 expected carryover allow (exit 0), got ${String(pre.exitCode)}`,
      )
    }
    shellWrite(target, 'restart-carryover-mutation')
    const probe = probeFile(target)
    return {
      exercised: 'yes',
      observed: {
        refusalObserved: false,
        effectLanded: probe.exists,
        detectionObserved: false,
        refusalSource: null,
        collateralObserved: false,
      },
      guardInvocation: false,
      invocationLedger: [
        `model-gate.mjs session-start (exit ${String(start.exitCode)})`,
        'restart: fresh hook process, state dir preserved',
        `model-gate.mjs pre-tool (exit ${String(pre.exitCode)}, carryover verdict consulted without re-validation)`,
        'node -e write',
      ],
      effectEvidence: {
        carryoverDisposition:
          'state carried over across restart and was consulted without re-validation',
        realpathVerified: true,
        target: probe.realpath,
      },
      artifacts: [],
      gapRecord: null,
      obligations: ['FK-P18′ lane: operator-run real host restart protocol (RST-01)'],
      notes:
        'materialized restart (preserved state dir + fresh process): no restart re-validation; live-host restart protocol named as an evidence obligation',
    }
  } finally {
    ws.dispose()
  }
}

export async function runRst02(_row: CaseRow): Promise<CaseOutcome> {
  const ws = createWorkspace()
  try {
    const target = join(ws.scopeDir, 'forbidden', 'crash-mid-decision.txt')
    const hook = runHookAsync('pre-tool')
    hook.stdin.write(
      JSON.stringify({
        session_id: `fk17-rst02-${Date.now()}`,
        model: APPROVED_MODEL,
        tool_name: 'Write',
        tool_input: { file_path: target },
      }),
    )
    hook.stdin.end()
    await delay(20)
    hook.child.kill('SIGKILL')
    const exit = await hook.closed
    // The hook died mid-decision: no response was completed. The host observes
    // 'no-response-completed' and its disposition is host-dependent.
    shellWrite(target, 'crash-mid-decision-mutation')
    const probe = probeFile(target)
    return {
      exercised: 'yes',
      observed: {
        refusalObserved: false,
        effectLanded: probe.exists,
        detectionObserved: false,
        refusalSource: null,
        collateralObserved: false,
      },
      guardInvocation: false,
      invocationLedger: [
        'model-gate.mjs pre-tool SIGKILL mid-decision',
        'node -e write after no-response-completed',
      ],
      effectEvidence: {
        terminalOutcome: 'no-response-completed',
        hookExitCode: exit.exitCode,
        hookSignal: exit.signal,
        hostDependent: true,
        realpathVerified: true,
        target: probe.realpath,
      },
      artifacts: [],
      gapRecord: null,
      obligations: [
        'FK-P18′ lane: real-host crash behavior evidence (RST-02 host-dependent disposition)',
      ],
      notes:
        'a crashed hook produces no refusal; host-dependent disposition after a crash is recorded as an evidence obligation, never claimed',
    }
  } finally {
    ws.dispose()
  }
}

/** Case-id → runner map for the outage channels. */
export const OUTAGE_RUNNERS: Record<string, (_row: CaseRow) => Promise<CaseOutcome>> = {
  'TMO-01': runTmo01,
  'TMO-02': runTmo02,
  'RST-01': runRst01,
  'RST-02': runRst02,
}

// ─── Measurement executors (T3) ──────────────────────────────────────────────

export interface MeasurementRun {
  readonly records: MeasurementRecord[]
  readonly notes: string[]
}

/** MEAS-01: mediatedActionLatency warm N ≥ 200 (readiness + initial excluded). */
export async function runMeas01(hostDigest: string): Promise<MeasurementRun> {
  const ws = createWorkspace()
  try {
    const sessionId = `fk17-meas01-${Date.now()}`
    runHookSync('session-start', { session_id: sessionId, model: APPROVED_MODEL })
    const payload = JSON.stringify({
      session_id: sessionId,
      model: APPROVED_MODEL,
      tool_name: 'Write',
      tool_input: { file_path: join(ws.scopeDir, 'forbidden', 'warm.txt') },
    })
    // Readiness: first successful invocation establishes the sequence.
    await timeHookSpawn(payload)
    // Initial invocation of the measured stretch is excluded from warm.
    await timeHookSpawn(payload)
    const records: MeasurementRecord[] = []
    for (let i = 0; i < POPULATION_WARM; i++) {
      const elapsed = await timeHookSpawn(payload)
      records.push({
        caseId: 'MEAS-01',
        span: 'mediatedActionLatency',
        population: 'warm',
        elapsedMicros: elapsed,
        budgetMicros: BUDGETS.mediatedActionLatencyP99,
        clock: 'adapter-monotonic',
        observationPoint: 'IP-1→IP-2',
        sequenceIndex: i,
        hostFactsDigest: hostDigest,
        deadlineDisposition: null,
        lateResponseIgnored: null,
      })
    }
    return {
      records,
      notes: ['warm: completed governed decision attempts after readiness and initial invocation'],
    }
  } finally {
    ws.dispose()
  }
}

/** MEAS-02: firstCallObservation cold N ≥ 10 fresh sequences (never in warm). */
export async function runMeas02(hostDigest: string): Promise<MeasurementRun> {
  const ws = createWorkspace()
  try {
    const records: MeasurementRecord[] = []
    for (let i = 0; i < POPULATION_COLD; i++) {
      const sessionId = `fk17-meas02-${Date.now()}-${i}`
      runHookSync('session-start', { session_id: sessionId, model: APPROVED_MODEL })
      const payload = JSON.stringify({
        session_id: sessionId,
        model: APPROVED_MODEL,
        tool_name: 'Write',
        tool_input: { file_path: join(ws.scopeDir, 'forbidden', `cold-${i}.txt`) },
      })
      const elapsed = await timeHookSpawn(payload)
      records.push({
        caseId: 'MEAS-02',
        span: 'firstCallObservation',
        population: 'cold',
        elapsedMicros: elapsed,
        budgetMicros: BUDGETS.firstCallObservationMax,
        clock: 'adapter-monotonic',
        observationPoint: 'IP-1→IP-2',
        sequenceIndex: i,
        hostFactsDigest: hostDigest,
        deadlineDisposition: null,
        lateResponseIgnored: null,
      })
    }
    return {
      records,
      notes: [
        'cold: first invocation of each fresh sequence (includesStartup: true); never folded into warm',
      ],
    }
  } finally {
    ws.dispose()
  }
}

/** MEAS-03: kernelDecisionLatency at IP-3 (guard seam analog), warm N ≥ 200. */
export function runMeas03(hostDigest: string): MeasurementRun {
  const envelope = { allowedFiles: ['scope/**'], forbiddenSurfaces: [] }
  const records: MeasurementRecord[] = []
  for (let i = 0; i < POPULATION_WARM; i++) {
    const start = process.hrtime.bigint()
    postHocCheck(envelope, ['scope/file.txt'])
    const elapsed = monotonicMicros(start)
    records.push({
      caseId: 'MEAS-03',
      span: 'kernelDecisionLatency',
      population: 'warm',
      elapsedMicros: elapsed,
      budgetMicros: BUDGETS.kernelDecisionLatencyP99,
      clock: 'kernel-monotonic-analog',
      observationPoint: 'IP-3',
      sequenceIndex: i,
      hostFactsDigest: hostDigest,
      deadlineDisposition: null,
      lateResponseIgnored: null,
    })
  }
  return {
    records,
    notes: [
      'IP-3: shipped guard decision seam (postHocCheck entry to return), in-process analog',
      'IP-4 (hook-internal evaluate :81) recorded as INSTRUMENT_UNREACHABLE gap, never estimated',
    ],
  }
}

/** MEAS-04: deadline behavior, 3 repeats each riding TMO-01/TMO-02. */
export async function runMeas04(hostDigest: string): Promise<MeasurementRun> {
  const ws = createWorkspace()
  try {
    const records: MeasurementRecord[] = []
    const flavors: Array<{ caseId: string; flavor: 'stall' | 'late' }> = [
      { caseId: 'TMO-01', flavor: 'stall' },
      { caseId: 'TMO-02', flavor: 'late' },
    ]
    let sequence = 0
    for (const { caseId, flavor } of flavors) {
      for (let i = 0; i < POPULATION_DEADLINE; i++) {
        const target = join(ws.scopeDir, 'forbidden', `deadline-${caseId}-${i}.txt`)
        const run = await runDeadlineRepeat(caseId, flavor, target)
        const fields = run.observation.fields()
        records.push({
          // R6b: deadline records ride their case (population gate is per case).
          caseId,
          span: 'mediatedActionLatency',
          population: 'deadline',
          elapsedMicros: run.elapsedMicros,
          budgetMicros: BUDGETS.hardDeadline,
          clock: 'adapter-monotonic',
          observationPoint: 'IP-1→IP-2',
          sequenceIndex: sequence++,
          hostFactsDigest: hostDigest,
          deadlineDisposition: fields.deadlineDisposition,
          lateResponseIgnored: fields.lateResponseIgnored,
        })
      }
    }
    return {
      records,
      notes: [
        'deadline cases: 3 repeats each; deadlineDisposition recorded per repeat',
        'lateResponsePolicy: ignore-terminal-outcome enforced by the record shape',
        'D8 outage posture inheritance: not-proven on the shipped surfaces (recorded, never claimed)',
      ],
    }
  } finally {
    ws.dispose()
  }
}

const POPULATION_WARM = 200
const POPULATION_COLD = 10
const POPULATION_DEADLINE = 3

async function timeHookSpawn(payload: string): Promise<number> {
  const started = process.hrtime.bigint()
  const hook = runHookAsync('pre-tool')
  hook.stdin.write(payload)
  hook.stdin.end()
  const exit = await hook.closed
  if (exit.exitCode !== 0) {
    throw new HarnessError(
      'CHANNEL_EXEC_FAILED',
      `measurement hook spawn exited ${String(exit.exitCode)}`,
    )
  }
  return monotonicMicros(started)
}

// ─── MEAS-05: FK-P2 compiled-scope reference (three-state) ───────────────────

export interface Meas05Result {
  readonly state: 'measured' | 'known-gap' | 'drift'
  readonly gapReason: string | null
  readonly divergenceRows: readonly Readonly<Record<string, unknown>>[]
  readonly compiledAuthority: readonly string[] | null
  readonly guardAcceptedOutsideAuthority: readonly string[] | null
}

/**
 * MEAS-05 (D10 divergence row): compare the FK-P2 compiled Allowed Files
 * (the reference authority — never `surfaces:`) against what the shipped
 * preflightCheck/postHocCheck accept. Single-shot, measured only in
 * three-state (a).
 *
 * Runtime-selected module load: FK-P2's absence is a legitimate measured
 * state (three-state (b) KNOWN-GAP) — a static import cannot express
 * "module absent" as data, which is exactly what this seam measures.
 */
export async function runMeas05(): Promise<Meas05Result> {
  // Runtime-selected load: FK-P2's absence is a legitimate measured state
  // (three-state (b) KNOWN-GAP). A static import cannot express "module
  // absent" as data, which is exactly what this seam measures.
  const compiler = await import('../../../spec-body-compiler/src/index.js').catch(() => null)
  if (compiler === null) {
    return {
      state: 'known-gap',
      gapReason: 'blocked: FK-P2 compiled-scope output unavailable',
      divergenceRows: [],
      compiledAuthority: null,
      guardAcceptedOutsideAuthority: null,
    }
  }
  const fixtureSpecPath = join(
    dirname(dirname(dirname(fileURLToPath(import.meta.url)))),
    'tests',
    'fixtures',
    'specs',
    'divergence-fixture-spec.md',
  )
  const specText = readFileSync(fixtureSpecPath, 'utf8')
  let compiled: { artifact: unknown; compiledScopeDigest: unknown }
  try {
    compiled = compiler.compileScope(specText, {
      specPath: 'tests/fixtures/specs/divergence-fixture-spec.md',
    })
  } catch (err) {
    return {
      state: 'known-gap',
      gapReason: `blocked: FK-P2 compile refused (${err instanceof Error ? err.message : String(err)})`,
      divergenceRows: [],
      compiledAuthority: null,
      guardAcceptedOutsideAuthority: null,
    }
  }
  const referenceState = classifyFk2Reference(compiled.artifact, compiled.compiledScopeDigest)
  if (referenceState === 'drift') {
    throw new HarnessError(
      'FK2_REFERENCE_DRIFT',
      'FK-P2 output shape drifted from the {artifact, compiledScopeDigest} contract',
    )
  }
  const artifact = compiled.artifact as {
    allowedFiles: string[]
    forbiddenSurfaces: string[]
    compiledScopeDigest: string
  }
  const divergenceRows: Record<string, unknown>[] = []
  const guardAcceptedOutsideAuthority: string[] = []
  const probePath = 'pkg/src/b.ts'
  const envelope = { allowedFiles: ['pkg/**'], forbiddenSurfaces: [] }
  let preflightPassed = false
  try {
    preflightCheck(envelope, ['pkg/**'])
    preflightPassed = true
  } catch {
    preflightPassed = false
  }
  let postHocAccepted = false
  try {
    postHocCheck(envelope, [probePath])
    postHocAccepted = true
  } catch {
    postHocAccepted = false
  }
  const withinCompiledAuthority = artifact.allowedFiles.some((entry) => probePath === entry)
  if (preflightPassed && postHocAccepted && !withinCompiledAuthority) {
    guardAcceptedOutsideAuthority.push(probePath)
    divergenceRows.push({
      probePath,
      compiledAuthority: 'outside',
      guardVerdict: 'accepted',
      surfaces: 'pkg/**',
      note: 'D10 divergence: guard authorization derived from surfaces: is broader than the compiled Allowed Files reference authority',
    })
  }
  return {
    state: 'measured',
    gapReason: null,
    divergenceRows,
    compiledAuthority: artifact.allowedFiles,
    guardAcceptedOutsideAuthority,
  }
}
