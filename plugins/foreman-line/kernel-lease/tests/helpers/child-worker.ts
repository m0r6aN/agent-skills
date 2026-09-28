/**
 * Child-process harness for FK-P10's real-process suites (crash kills, races,
 * contention, clock skew). Test-side only — never shipped engine code.
 *
 * Error-laundering discipline (A1/C1 closure lesson): a harness fault writes
 * its RAW cause to a side channel (stderr + `harness-fault-*` file) BEFORE any
 * boundary wrapping can flatten it; surfaced failures are test failures
 * carrying the peer's true cause, never product-shaped errors. Product
 * outcomes serialize as typed codes/diagnostics only.
 *
 * Flakes are failures (binding #2): racers open their engine first, publish a
 * ready marker, and only then wait for the go-signal — startup contention can
 * never kill a racer; every participant's output is printed before the parent
 * asserts anything.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  closeStorage,
  fixedClock,
  openStorage,
  systemClock,
  type Clock,
} from '@foreman-line/kernel-state'
import {
  applyTransition,
  claimLease,
  createEngine,
  decideTransition,
  EngineError,
  getGoalState,
  releaseLease,
  renewLease,
  requestTransition,
  type Engine,
} from '../../src/index.js'

const T0 = 1_700_000_000_000_000

interface FaultPlan {
  afterStatement: string
  kill: string
  markerDir: string
  scenario: string
  request: Record<string, unknown>
}

function blockForever(): never {
  const parking = new Int32Array(new SharedArrayBuffer(4))
  for (;;) {
    Atomics.wait(parking, 0, 0, 1000)
  }
}

function harnessFault(stage: string, cause: unknown): never {
  // Side channel FIRST (raw cause), then abort — never a product-shaped error.
  const raw = cause instanceof Error ? `${cause.message}\n${cause.stack ?? ''}` : String(cause)
  process.stderr.write(`HARNESS_FAULT ${stage} ${raw}\n`)
  try {
    const side = process.env.HARNESS_FAULT_CHANNEL
    if (side !== undefined && side.length > 0) {
      writeFileSync(side, `HARNESS_FAULT ${stage} ${raw}\n`, { flag: 'a' })
    }
  } catch {
    // Side-channel writes are best-effort; stderr already carries the cause.
  }
  process.exit(2)
}

function openEngine(dbRoot: string, clock: Clock): Engine {
  const storage = openStorage({
    storageRoot: dbRoot,
    databaseFileName: 'state.db',
    createIfMissing: false,
    clock: systemClock(),
    backupPolicy: { root: dbRoot, retentionDescriptor: null },
  })
  return createEngine({ storage, clock, toolVersion: 'child-worker-0.1.0' })
}

/** Deterministic seam for crash/race children (shared time base with parents). */
function fixedSeam(): Clock {
  return fixedClock(T0)
}

/** Skewed real-time seam (CLK-07 measures cross-process skew on purpose). */
function skewedSeam(skewMicros: number): Clock {
  return {
    nowMicros(): number {
      return Math.floor(Date.now() * 1000) + skewMicros
    },
  }
}

function serialize(error: unknown): { outcome: string; code: string; diagnostic: unknown } {
  if (error instanceof EngineError) {
    return { outcome: 'error', code: error.code, diagnostic: error.diagnostic }
  }
  return harnessFault('serialize', error)
}

function runOperation(engine: Engine, op: string, request: Record<string, unknown>): unknown {
  switch (op) {
    case 'claimLease':
      return claimLease(engine, request as never)
    case 'renewLease':
      return renewLease(engine, request as never)
    case 'releaseLease':
      return releaseLease(engine, request as never)
    case 'requestTransition':
      return requestTransition(engine, request as never)
    case 'decideTransition':
      return decideTransition(engine, request as never)
    case 'applyTransition':
      return applyTransition(engine, request as never)
    default:
      return harnessFault('runOperation', new Error(`unknown op ${op}`))
  }
}

// --- crash mode ------------------------------------------------------------

function wrapDriverForFault(
  driver: Engine['storage']['driver'],
  plan: FaultPlan,
): Engine['storage']['driver'] {
  const intercept = (sql: string): void => {
    if (sql.startsWith(plan.afterStatement)) {
      // The kill point is asserted reached (marker + stdout signal) before the
      // parent kills.
      writeFileSync(join(plan.markerDir, 'fault-reached'), `${plan.afterStatement}\n`)
      process.stdout.write('fault-reached\n')
      blockForever()
    }
  }
  const wrapped = {
    exec: (sql: string) => {
      driver.exec(sql)
      intercept(sql)
    },
    prepare: (sql: string) => {
      const statement = driver.prepare(sql)
      return {
        run: (...args: unknown[]) => {
          const out = (statement.run as (...a: unknown[]) => unknown)(...args)
          intercept(sql)
          return out
        },
        get: (...args: unknown[]) => (statement.get as (...a: unknown[]) => unknown)(...args),
        all: (...args: unknown[]) => (statement.all as (...a: unknown[]) => unknown)(...args),
      }
    },
    pragma: (source: string) => driver.pragma(source),
  }
  return wrapped as unknown as Engine['storage']['driver']
}

function crashMode(argv: string[]): void {
  const [dbRoot, faultJson, markerDir] = argv
  const plan = JSON.parse(readFileSync(faultJson as string, 'utf8')) as FaultPlan
  plan.markerDir = markerDir as string
  // Fixture scenarios name the OPERATION in fixture vocabulary; the engine
  // surface names it in API vocabulary ('claim' is claimLease).
  const op = plan.scenario === 'claim' ? 'claimLease' : plan.scenario
  try {
    const storage = openStorage({
      storageRoot: dbRoot as string,
      databaseFileName: 'state.db',
      createIfMissing: false,
      clock: fixedSeam(),
      backupPolicy: { root: dbRoot as string, retentionDescriptor: null },
    })
    const engine = createEngine({
      storage: {
        ...storage,
        driver: wrapDriverForFault(storage.driver, plan),
      } as Engine['storage'],
      clock: fixedSeam(),
      toolVersion: 'child-worker-0.1.0',
    })
    if (plan.kill === 'post-commit-pre-result') {
      // CR-04: the transaction commits; the process dies before the result
      // returns to the caller.
      runOperation(engine, op, plan.request)
      writeFileSync(join(plan.markerDir, 'fault-reached'), 'post-commit\n')
      process.stdout.write('fault-reached\n')
      blockForever()
    }
    runOperation(engine, op, plan.request)
    // No fault fired — the scenario is misconfigured; say so loudly.
    writeFileSync(join(plan.markerDir, 'fault-missed'), plan.afterStatement)
  } catch (error) {
    process.stderr.write(`HARNESS_FAULT crash-mode ${String(error)}\n`)
    process.exit(2)
  }
}

// --- race mode -------------------------------------------------------------

function waitForFile(path: string, timeoutMs: number, sideChannel: string): void {
  const start = Date.now()
  for (;;) {
    if (existsSync(path)) return
    if (Date.now() - start > timeoutMs) {
      harnessFault('barrier', new Error(`timeout waiting for ${path}`))
      void sideChannel
    }
    const parking = new Int32Array(new SharedArrayBuffer(4))
    Atomics.wait(parking, 0, 0, 5)
  }
}

function raceMode(argv: string[]): void {
  const [dbRoot, barrierDir, racerId, op, requestJson, scenarioId] = argv
  const sideChannel = join(barrierDir as string, `harness-fault-${racerId}`)
  process.env.HARNESS_FAULT_CHANNEL = sideChannel
  try {
    const engine = openEngine(dbRoot as string, fixedSeam())
    writeFileSync(join(barrierDir as string, `ready-${racerId}`), 'ready')
    process.stdout.write('READY\n')
    waitForFile(join(barrierDir as string, `go-${scenarioId}`), 60_000, sideChannel)
    const request = JSON.parse(requestJson as string) as Record<string, unknown>
    try {
      const result = runOperation(engine, op as string, request) as {
        effect: { code: string; decision: string; goalRevision: number }
        replay: boolean
      }
      process.stdout.write(
        `${JSON.stringify({
          racer: Number(racerId),
          outcome: 'result',
          code: result.effect.code,
          decision: result.effect.decision,
          replay: result.replay,
          goalRevision: result.effect.goalRevision,
        })}\n`,
      )
    } catch (error) {
      process.stdout.write(`${JSON.stringify({ racer: Number(racerId), ...serialize(error) })}\n`)
    }
    closeStorage(engine.storage)
  } catch (error) {
    harnessFault('race-mode', error)
  }
}

// --- contention mode --------------------------------------------------------

interface AttemptRecord {
  op: string
  racer: number
  sequence: number
  repeat: number
  outcomeCode: string
  elapsedMicros: number
  lockWaitMicros: number
  busyTimeoutsObserved: number
  hostClockNote: { wallMicros: number; seamMicros: number }
}

function contentionMode(argv: string[]): void {
  const [dbRoot, barrierDir, racerArg, repeatArg, attemptsArg] = argv
  const racer = Number(racerArg)
  const repeat = Number(repeatArg)
  const attempts = Number(attemptsArg)
  const sideChannel = join(barrierDir as string, `harness-fault-c${racer}`)
  process.env.HARNESS_FAULT_CHANNEL = sideChannel
  try {
    const storage = openStorage({
      storageRoot: dbRoot as string,
      databaseFileName: 'state.db',
      createIfMissing: false,
      clock: systemClock(),
      backupPolicy: { root: dbRoot as string, retentionDescriptor: null },
    })
    // Lock-wait instrumentation: time the transaction's BEGIN IMMEDIATE (where
    // SQLite's busy handler spends the wait). Harness-side measurement only.
    let lockWaitMicros = 0
    let busyTimeoutsObserved = 0
    const driver = storage.driver
    const instrumented: Engine['storage']['driver'] = {
      exec: (sql: string) => {
        const start = process.hrtime.bigint()
        driver.exec(sql)
        if (sql.startsWith('BEGIN')) {
          lockWaitMicros = Number((process.hrtime.bigint() - start) / 1000n)
        }
      },
      prepare: (sql: string) => driver.prepare(sql),
      pragma: (source: string) => driver.pragma(source),
    }
    const engine = createEngine({
      storage: { ...storage, driver: instrumented } as Engine['storage'],
      clock: systemClock(),
      toolVersion: 'child-worker-0.1.0',
    })
    writeFileSync(join(barrierDir as string, `ready-${repeat}-${racer}`), 'ready')
    waitForFile(join(barrierDir as string, `go-${repeat}`), 60_000, sideChannel)

    const records: AttemptRecord[] = []
    let held: string | null = null
    const goalId = 'goal-contention-1'
    for (let sequence = 1; sequence <= attempts; sequence += 1) {
      const op = held === null ? 'claimLease' : sequence % 2 === 0 ? 'renewLease' : 'releaseLease'
      const view = getGoalState(engine, goalId)
      const binding = {
        principalRef: `racer-${racer}`,
        operationId: `op-c${repeat}-${racer}-${sequence}`,
        repositoryRef: 'repo-1',
        worktreeRef: 'wt-1',
        payloadDigest: `sha256:${(repeat * 100000 + racer * 1000 + sequence).toString(16).padStart(64, '0')}`,
      }
      const request: Record<string, unknown> =
        op === 'claimLease'
          ? {
              goalId,
              leaseId: `lease-c${repeat}-${racer}-${sequence}`,
              durationMicros: 30_000_000,
              expectedRevision: view.revision,
              idempotencyKey: binding,
            }
          : op === 'renewLease'
            ? {
                goalId,
                leaseId: held,
                durationMicros: 30_000_000,
                expectedRevision: view.revision,
                idempotencyKey: binding,
              }
            : {
                goalId,
                leaseId: held,
                expectedRevision: view.revision,
                idempotencyKey: binding,
              }
      lockWaitMicros = 0
      const wallMicros = Math.floor(Date.now() * 1000)
      const start = process.hrtime.bigint()
      let outcomeCode = 'EFFECT_APPLIED'
      try {
        const result = runOperation(engine, op, request) as {
          effect: { code: string }
          result: { leaseId: string | null }
        }
        outcomeCode = result.effect.code
        if (op === 'claimLease') held = result.result.leaseId
        if (op === 'releaseLease') held = null
      } catch (error) {
        if (error instanceof EngineError) {
          outcomeCode = error.code
          if (error.code === 'STORAGE_FAILURE' && error.diagnostic.storageCode === 'STORAGE_LOCK_TIMEOUT') {
            busyTimeoutsObserved += 1
          }
        } else {
          harnessFault('contention-attempt', error)
        }
      }
      records.push({
        op,
        racer,
        sequence,
        repeat,
        outcomeCode,
        elapsedMicros: Number((process.hrtime.bigint() - start) / 1000n),
        lockWaitMicros,
        busyTimeoutsObserved,
        hostClockNote: { wallMicros, seamMicros: Math.floor(Date.now() * 1000) },
      })
    }
    process.stdout.write(`${JSON.stringify({ racer, records, harnessFailures: [] })}\n`)
    closeStorage(engine.storage)
  } catch (error) {
    harnessFault('contention-mode', error)
  }
}

// --- skewed grant (CLK-07) --------------------------------------------------

function skewGrantMode(argv: string[]): void {
  const [dbRoot, skewArg, outPath] = argv
  try {
    const engine = openEngine(dbRoot as string, skewedSeam(Number(skewArg)))
    const view = getGoalState(engine, 'goal-1')
    const result = claimLease(engine, {
      goalId: 'goal-1',
      leaseId: 'lease-skew',
      durationMicros: 1_800_000_000,
      expectedRevision: view.revision,
      idempotencyKey: {
        principalRef: 'racer-skew',
        operationId: 'op-skew-1',
        repositoryRef: 'repo-1',
        worktreeRef: 'wt-1',
        payloadDigest: `sha256:${'77'.repeat(32)}`,
      },
    })
    writeFileSync(
      outPath as string,
      JSON.stringify({
        effectCode: result.effect.code,
        descriptor: result.result,
        claimedAtWallMicros: Math.floor(Date.now() * 1000),
      }),
    )
    closeStorage(engine.storage)
  } catch (error) {
    harnessFault('skew-grant-mode', error)
  }
}

const [, , mode, ...rest] = process.argv
switch (mode) {
  case 'crash':
    crashMode(rest)
    break
  case 'race':
    raceMode(rest)
    break
  case 'contention':
    contentionMode(rest)
    break
  case 'skew-grant':
    skewGrantMode(rest)
    break
  default:
    harnessFault('dispatch', new Error(`unknown mode ${String(mode)}`))
}
