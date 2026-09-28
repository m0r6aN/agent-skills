/**
 * L6 real process-boundary concurrency (CN-01..07) — real child processes
 * racing one real database with EXACT asserted interleavings (CONC-03 lesson:
 * named outcomes and observed post-state, never "no crash"; no mock or
 * simulated race may satisfy any CN row).
 *
 * Flake discipline (binding #2): racers open their engines before the barrier,
 * startup contention cannot kill a racer, and every participant's output is
 * printed before any assertion runs.
 */
import assert from 'node:assert/strict'
import { type ChildProcess, spawn } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import {
  closeStorage,
  exportStorage,
  fixedClock,
  insertGoal,
  insertLease,
  type OpenStorageConfig,
  openStorage,
} from '@foreman-line/kernel-state'

const T0 = 1_700_000_000_000_000
const FIXTURES = join(import.meta.dirname, 'fixtures')
const WORKER = join(import.meta.dirname, 'helpers', 'child-worker.ts')

interface ConcRow {
  id: string
  scenario: string
  expectedOutcome: Record<string, unknown>
}

const parsedFixture: unknown = JSON.parse(
  readFileSync(join(FIXTURES, 'hostile', 'concurrency.json'), 'utf8'),
)
const fixtureTable = parsedFixture as { records: ConcRow[] }
const CN = fixtureTable.records

function configFor(root: string): OpenStorageConfig {
  return {
    storageRoot: root,
    databaseFileName: 'state.db',
    createIfMissing: true,
    clock: fixedClock(T0),
    backupPolicy: { root, retentionDescriptor: null },
  }
}

interface RacerOutcome {
  racer: number
  outcome: string
  code: string
  decision?: string
  replay?: boolean
  goalRevision?: number
  diagnostic?: unknown
}

interface RaceRun {
  outputs: RacerOutcome[]
  tables: Record<string, number>
}

function binding(
  racer: number,
  op: string,
  digestHex: string,
  principalRef = `racer-${racer}`,
): Record<string, unknown> {
  return {
    principalRef,
    operationId: `op-${op}-${racer}`,
    repositoryRef: 'repo-1',
    worktreeRef: 'wt-1',
    payloadDigest: `sha256:${digestHex.padStart(64, '0')}`,
  }
}

/**
 * Wait for a racer's first stdout chunk (its READY announcement). A racer that
 * exits before announcing is a NAMED failure carrying its raw stderr — never a
 * silent stall (error-laundering discipline).
 */
function awaitReady(
  child: ChildProcess,
  collect: () => { stdout: string; stderr: string },
): Promise<void> {
  const { promise, resolve, reject } = Promise.withResolvers<void>()
  if (child.exitCode !== null || child.signalCode !== null) {
    reject(new Error(`racer exited before READY; raw cause: ${collect().stderr}`))
    return promise
  }
  let settled = false
  child.stdout?.once('data', () => {
    if (settled) return
    settled = true
    resolve()
  })
  child.once('close', () => {
    if (settled) return
    settled = true
    reject(new Error(`racer exited before READY; raw cause: ${collect().stderr}`))
  })
  child.once('error', (error) => {
    if (settled) return
    settled = true
    reject(error)
  })
  return promise
}

/** Wait for exit; resolves immediately when the child has already exited. */
function waitClosed(child: ChildProcess): Promise<void> {
  const { promise, resolve } = Promise.withResolvers<void>()
  if (child.exitCode !== null || child.signalCode !== null) {
    resolve()
    return promise
  }
  child.once('close', () => resolve())
  return promise
}

function runRace(
  root: string,
  scenarioId: string,
  racers: Array<{ racer: number; op: string; request: Record<string, unknown> }>,
): Promise<RaceRun> {
  const barrierDir = join(root, 'barrier')
  mkdirSync(barrierDir, { recursive: true })
  return (async () => {
    const children = racers.map((entry) => {
      const child = spawn(
        process.execPath,
        [
          '--import',
          'tsx',
          WORKER,
          'race',
          root,
          barrierDir,
          String(entry.racer),
          entry.op,
          JSON.stringify(entry.request),
          scenarioId,
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
      return { child, collect: () => ({ stdout, stderr }) }
    })
    // Both racers announce READY before the go-signal (barrier, binding #2).
    for (const entry of children) {
      await awaitReady(entry.child, entry.collect)
    }
    writeFileSync(join(barrierDir, `go-${scenarioId}`), 'go')
    for (const entry of children) {
      await waitClosed(entry.child)
    }
    const outputs: RacerOutcome[] = []
    const failures: string[] = []
    for (const entry of children) {
      const { stdout, stderr } = entry.collect()
      // Binding #2: print ALL participants' output before any assertion.
      process.stdout.write(`racer-stdout ${stdout}`)
      if (stderr.length > 0) failures.push(stderr)
      for (const line of stdout.split('\n')) {
        if (line.startsWith('{')) {
          outputs.push(JSON.parse(line) as RacerOutcome)
        }
      }
    }
    assert.deepEqual(failures, [], `harness faults surfaced raw: ${failures.join(' | ')}`)
    assert.equal(outputs.length, racers.length, 'every racer reports exactly one outcome')
    const tables = (() => {
      const storage = openStorage(configFor(root))
      try {
        const snapshot = exportStorage(storage)
        return snapshot.exportDocument.payload.tables
      } finally {
        try {
          closeStorage(storage)
        } catch {
          // Best-effort close; cleanup proceeds.
        }
      }
    })()
    return {
      outputs,
      tables: {
        events: tables.events.length,
        goals: tables.goals.length,
        goalRevision: Number(tables.goals[0]?.revision ?? -1),
        transitions: tables.transitions.length,
        leases: tables.leases.length,
        activeLeases: tables.leases.filter((row) => row.released_at_micros === null).length,
        idempotency_keys: tables.idempotency_keys.length,
        projection_cursors: tables.projection_cursors.length,
      },
    }
  })()
}

function seed(root: string, scenario: string): void {
  const storage = openStorage(configFor(root))
  if (scenario === 'claim-release-race') {
    insertGoal(storage, { goalId: 'goal-1', revision: 1, status: 'active', updatedAtMicros: T0 })
    insertLease(storage, {
      leaseId: 'lease-1',
      goalId: 'goal-1',
      ownerPrincipalRef: 'racer-0',
      casRevision: 1,
      acquiredAtMicros: T0 - 10,
      expiresAtMicros: T0 + 60_000_000,
      releasedAtMicros: null,
    })
  } else if (scenario === 'expired-takeover-race') {
    insertGoal(storage, { goalId: 'goal-1', revision: 0, status: 'active', updatedAtMicros: T0 })
    insertLease(storage, {
      leaseId: 'lease-expired',
      goalId: 'goal-1',
      ownerPrincipalRef: 'racer-old',
      casRevision: 0,
      acquiredAtMicros: T0 - 100_000,
      expiresAtMicros: T0 - 1,
      releasedAtMicros: null,
    })
  } else if (scenario === 'stale-cas-apply-race') {
    insertGoal(storage, { goalId: 'goal-1', revision: 1, status: 'active', updatedAtMicros: T0 })
    insertLease(storage, {
      leaseId: 'lease-1',
      goalId: 'goal-1',
      ownerPrincipalRef: 'racer-0',
      casRevision: 1,
      acquiredAtMicros: T0 - 10,
      expiresAtMicros: T0 + 60_000_000,
      releasedAtMicros: null,
    })
  } else {
    insertGoal(storage, { goalId: 'goal-1', revision: 0, status: 'active', updatedAtMicros: T0 })
    if (scenario !== 'two-process-claim-race') {
      insertLease(storage, {
        leaseId: 'lease-1',
        goalId: 'goal-1',
        ownerPrincipalRef: 'racer-0',
        casRevision: 0,
        acquiredAtMicros: T0 - 10,
        expiresAtMicros: T0 + 60_000_000,
        releasedAtMicros: null,
      })
    }
  }
  closeStorage(storage)
}

test('fixture inventory: 7 CN rows with named outcome patterns', () => {
  assert.equal(CN.length, 7)
  const ids = new Set(CN.map((row) => row.id))
  assert.equal(ids.size, CN.length)
})

test('CN-01 two-process claim race: exactly one winner, one event, one binding, one bump; loser LEASE_HELD', async () => {
  const root = mkdtempSync(join(tmpdir(), 'fk-p10-cn-'))
  try {
    seed(root, 'two-process-claim-race')
    const run = await runRace(root, 'CN-01', [
      {
        racer: 0,
        op: 'claimLease',
        request: {
          goalId: 'goal-1',
          leaseId: 'lease-a',
          durationMicros: 60_000_000,
          expectedRevision: 0,
          idempotencyKey: binding(0, 'cn-01', 'a1'),
        },
      },
      {
        racer: 1,
        op: 'claimLease',
        request: {
          goalId: 'goal-1',
          leaseId: 'lease-b',
          durationMicros: 60_000_000,
          expectedRevision: 0,
          idempotencyKey: binding(1, 'cn-01', 'b1'),
        },
      },
    ])
    const winners = run.outputs.filter((output) => output.outcome === 'result')
    const losers = run.outputs.filter((output) => output.outcome === 'error')
    assert.equal(winners.length, 1, 'exactly one winner')
    assert.equal(winners[0]?.code, 'EFFECT_APPLIED')
    assert.equal(losers.length, 1)
    assert.equal(losers[0]?.code, 'LEASE_HELD')
    assert.deepEqual(run.tables, {
      events: 1,
      goals: 1,
      goalRevision: 1,
      transitions: 0,
      leases: 1,
      activeLeases: 1,
      idempotency_keys: 1,
      projection_cursors: 1,
    })
  } finally {
    rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 })
  }
})

test('CN-02 claim/release race: exactly the two named serializations; never two active leases', async () => {
  const root = mkdtempSync(join(tmpdir(), 'fk-p10-cn-'))
  try {
    seed(root, 'claim-release-race')
    const run = await runRace(root, 'CN-02', [
      {
        racer: 0,
        op: 'releaseLease',
        request: {
          goalId: 'goal-1',
          leaseId: 'lease-1',
          expectedRevision: 1,
          idempotencyKey: binding(0, 'cn-02', 'a2'),
        },
      },
      {
        racer: 1,
        op: 'claimLease',
        request: {
          goalId: 'goal-1',
          leaseId: 'lease-2',
          durationMicros: 60_000_000,
          expectedRevision: 2,
          idempotencyKey: binding(1, 'cn-02', 'b2'),
        },
      },
    ])
    const applied = run.outputs.filter((output) => output.outcome === 'result')
    const refused = run.outputs.filter((output) => output.outcome === 'error')
    assert.equal(applied.length + refused.length, 2)
    const appliedOps = applied.length
    assert.ok(appliedOps === 2 || appliedOps === 1, `named serializations only: ${appliedOps}`)
    if (refused.length === 1) {
      // claim-first: the claim loses with its named code.
      assert.equal(refused[0]?.code, 'LEASE_HELD')
      assert.equal(refused[0]?.racer, 1)
      assert.deepEqual(run.tables, {
        events: 1,
        goals: 1,
        goalRevision: 2,
        transitions: 0,
        leases: 1,
        activeLeases: 0,
        idempotency_keys: 1,
        projection_cursors: 1,
      })
    } else {
      // release-first: both apply.
      assert.deepEqual(run.tables, {
        events: 2,
        goals: 1,
        goalRevision: 3,
        transitions: 0,
        leases: 2,
        activeLeases: 1,
        idempotency_keys: 2,
        projection_cursors: 1,
      })
    }
  } finally {
    rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 })
  }
})

test('CN-03 expired-takeover race: one takeover wins, peer LEASE_HELD; prior row stamped exactly once', async () => {
  const root = mkdtempSync(join(tmpdir(), 'fk-p10-cn-'))
  try {
    seed(root, 'expired-takeover-race')
    const run = await runRace(root, 'CN-03', [
      {
        racer: 0,
        op: 'claimLease',
        request: {
          goalId: 'goal-1',
          leaseId: 'lease-a',
          durationMicros: 60_000_000,
          expectedRevision: 0,
          idempotencyKey: binding(0, 'cn-03', 'a3'),
        },
      },
      {
        racer: 1,
        op: 'claimLease',
        request: {
          goalId: 'goal-1',
          leaseId: 'lease-b',
          durationMicros: 60_000_000,
          expectedRevision: 0,
          idempotencyKey: binding(1, 'cn-03', 'b3'),
        },
      },
    ])
    const winners = run.outputs.filter((output) => output.outcome === 'result')
    const losers = run.outputs.filter((output) => output.outcome === 'error')
    assert.equal(winners.length, 1)
    assert.equal(winners[0]?.code, 'EFFECT_APPLIED')
    assert.equal(losers.length, 1)
    assert.equal(losers[0]?.code, 'LEASE_HELD')
    assert.deepEqual(run.tables, {
      events: 1,
      goals: 1,
      goalRevision: 1,
      transitions: 0,
      leases: 2,
      activeLeases: 1,
      idempotency_keys: 1,
      projection_cursors: 1,
    })
  } finally {
    rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 })
  }
})

test('CN-04 same-binding apply race: one applies, the peer replays the recorded result with zero duplicate effects', async () => {
  const root = mkdtempSync(join(tmpdir(), 'fk-p10-cn-'))
  try {
    seed(root, 'same-binding-apply-race')
    const shared = binding(0, 'cn-04', 'c4')
    const run = await runRace(root, 'CN-04', [
      {
        racer: 0,
        op: 'applyTransition',
        request: {
          goalId: 'goal-1',
          targetStatus: 'cancelled',
          expectedRevision: 0,
          idempotencyKey: shared,
        },
      },
      {
        racer: 1,
        op: 'applyTransition',
        request: {
          goalId: 'goal-1',
          targetStatus: 'cancelled',
          expectedRevision: 0,
          idempotencyKey: shared,
        },
      },
    ])
    const applied = run.outputs.filter(
      (output) => output.outcome === 'result' && output.replay === false,
    )
    const replayed = run.outputs.filter(
      (output) => output.outcome === 'result' && output.replay === true,
    )
    assert.equal(applied.length, 1, 'exactly one winner applies')
    assert.equal(replayed.length, 1, 'the peer replays')
    assert.equal(replayed[0]?.code, applied[0]?.code)
    assert.equal(replayed[0]?.goalRevision, applied[0]?.goalRevision)
    assert.deepEqual(run.tables, {
      events: 1,
      goals: 1,
      goalRevision: 1,
      transitions: 1,
      leases: 1,
      activeLeases: 1,
      idempotency_keys: 1,
      projection_cursors: 1,
    })
  } finally {
    rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 })
  }
})

test('CN-05 same-key different-binding apply race: one applies, the peer IDEMPOTENCY_CONFLICT', async () => {
  const root = mkdtempSync(join(tmpdir(), 'fk-p10-cn-'))
  try {
    seed(root, 'same-key-different-binding-apply-race')
    const run = await runRace(root, 'CN-05', [
      {
        racer: 0,
        op: 'applyTransition',
        request: {
          goalId: 'goal-1',
          targetStatus: 'cancelled',
          expectedRevision: 0,
          idempotencyKey: binding(0, 'cn-05', 'c5'),
        },
      },
      {
        racer: 1,
        op: 'applyTransition',
        request: {
          goalId: 'goal-1',
          targetStatus: 'cancelled',
          expectedRevision: 0,
          idempotencyKey: binding(0, 'cn-05', 'd5'),
        },
      },
    ])
    const winners = run.outputs.filter((output) => output.outcome === 'result')
    const losers = run.outputs.filter((output) => output.outcome === 'error')
    assert.equal(winners.length, 1)
    assert.equal(losers.length, 1)
    assert.equal(losers[0]?.code, 'IDEMPOTENCY_CONFLICT')
    assert.deepEqual(run.tables, {
      events: 1,
      goals: 1,
      goalRevision: 1,
      transitions: 1,
      leases: 1,
      activeLeases: 1,
      idempotency_keys: 1,
      projection_cursors: 1,
    })
  } finally {
    rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 })
  }
})

test('CN-06 stale-CAS apply race: one applies, the peer STATE_REVISION_STALE', async () => {
  const root = mkdtempSync(join(tmpdir(), 'fk-p10-cn-'))
  try {
    seed(root, 'stale-cas-apply-race')
    const run = await runRace(root, 'CN-06', [
      {
        racer: 0,
        op: 'applyTransition',
        request: {
          goalId: 'goal-1',
          targetStatus: 'cancelled',
          expectedRevision: 1,
          idempotencyKey: binding(0, 'cn-06', 'e6'),
        },
      },
      {
        racer: 1,
        op: 'applyTransition',
        request: {
          goalId: 'goal-1',
          targetStatus: 'cancelled',
          expectedRevision: 1,
          idempotencyKey: binding(1, 'cn-06', 'f6', 'racer-0'),
        },
      },
    ])
    const winners = run.outputs.filter((output) => output.outcome === 'result')
    const losers = run.outputs.filter((output) => output.outcome === 'error')
    assert.equal(winners.length, 1)
    assert.equal(losers.length, 1)
    assert.equal(losers[0]?.code, 'STATE_REVISION_STALE')
    assert.deepEqual(run.tables, {
      events: 1,
      goals: 1,
      goalRevision: 2,
      transitions: 1,
      leases: 1,
      activeLeases: 1,
      idempotency_keys: 1,
      projection_cursors: 1,
    })
  } finally {
    rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 })
  }
})

test('CN-07 pending-request race: one pending transition wins, the peer TRANSITION_PENDING_EXISTS', async () => {
  const root = mkdtempSync(join(tmpdir(), 'fk-p10-cn-'))
  try {
    seed(root, 'pending-request-race')
    const run = await runRace(root, 'CN-07', [
      {
        racer: 0,
        op: 'requestTransition',
        request: {
          goalId: 'goal-1',
          targetStatus: 'awaiting-human',
          expectedRevision: 0,
          idempotencyKey: binding(0, 'cn-07', '87'),
        },
      },
      {
        racer: 1,
        op: 'requestTransition',
        request: {
          goalId: 'goal-1',
          targetStatus: 'awaiting-human',
          expectedRevision: 0,
          idempotencyKey: binding(1, 'cn-07', '97', 'racer-0'),
        },
      },
    ])
    const winners = run.outputs.filter((output) => output.outcome === 'result')
    const losers = run.outputs.filter((output) => output.outcome === 'error')
    assert.equal(winners.length, 1)
    assert.equal(losers.length, 1)
    assert.equal(losers[0]?.code, 'TRANSITION_PENDING_EXISTS')
    assert.deepEqual(run.tables, {
      events: 1,
      goals: 1,
      goalRevision: 1,
      transitions: 1,
      leases: 1,
      activeLeases: 1,
      idempotency_keys: 1,
      projection_cursors: 1,
    })
  } finally {
    rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 })
  }
})
