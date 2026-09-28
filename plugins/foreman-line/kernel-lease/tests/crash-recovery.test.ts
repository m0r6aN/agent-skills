/**
 * L7 crash mid-transition — real child-process kills at asserted-reached fault
 * points (CR-01..06, MIG-02 precedent). Recovery is asserted row-exact across
 * all six tables ("fully applied or fully absent"), and CR-04's retry REPLAYS
 * instead of repeating the effect.
 */
import assert from 'node:assert/strict'
import { type ChildProcess, spawn } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
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
import { applyTransition, claimLease, createEngine, requestTransition } from '../src/index.js'

const T0 = 1_700_000_000_000_000
const FIXTURES = join(import.meta.dirname, 'fixtures')
const WORKER = join(import.meta.dirname, 'helpers', 'child-worker.ts')

interface CrashRow {
  id: string
  scenario: string
  fault: { afterStatement: string; kill: string }
  expectedOutcome: { state: string; retry: string }
}

const parsedFixture: unknown = JSON.parse(
  readFileSync(join(FIXTURES, 'hostile', 'crash.json'), 'utf8'),
)
const fixtureTable = parsedFixture as { records: CrashRow[] }
const CR = fixtureTable.records

function configFor(root: string): OpenStorageConfig {
  return {
    storageRoot: root,
    databaseFileName: 'state.db',
    createIfMissing: true,
    clock: fixedClock(T0),
    backupPolicy: { root, retentionDescriptor: null },
  }
}

function seedFor(scenario: string, root: string): void {
  const storage = openStorage(configFor(root))
  try {
    insertGoal(storage, { goalId: 'goal-1', revision: 0, status: 'active', updatedAtMicros: T0 })
    if (scenario === 'requestTransition') {
      insertLease(storage, {
        leaseId: 'lease-1',
        goalId: 'goal-1',
        ownerPrincipalRef: 'principal-a',
        casRevision: 0,
        acquiredAtMicros: T0 - 10,
        expiresAtMicros: T0 + 5_000_000,
        releasedAtMicros: null,
      })
    }
  } finally {
    try {
      closeStorage(storage)
    } catch {
      // Best-effort close; cleanup proceeds.
    }
  }
}

function requestFor(row: CrashRow): Record<string, unknown> {
  const binding = {
    principalRef: 'principal-a',
    operationId: `op-${row.id.toLowerCase()}`,
    repositoryRef: 'repo-1',
    worktreeRef: 'wt-1',
    payloadDigest: `sha256:${Buffer.from(row.id).toString('hex').padEnd(64, '0').slice(0, 64)}`,
  }
  return row.scenario === 'claim'
    ? {
        goalId: 'goal-1',
        leaseId: `lease-${row.id.toLowerCase()}`,
        durationMicros: 60_000_000,
        expectedRevision: 0,
        idempotencyKey: binding,
      }
    : {
        goalId: 'goal-1',
        targetStatus: 'cancelled',
        expectedRevision: 0,
        idempotencyKey: binding,
      }
}

function snapshotTables(root: string): Record<string, number> {
  const storage = openStorage(configFor(root))
  try {
    const snapshot = exportStorage(storage)
    const tables = snapshot.exportDocument.payload.tables
    return {
      events: tables.events.length,
      goals: tables.goals.length,
      goalRevision: Number(tables.goals[0]?.revision ?? -1),
      transitions: tables.transitions.length,
      leases: tables.leases.length,
      idempotency_keys: tables.idempotency_keys.length,
      projection_cursors: tables.projection_cursors.length,
      cursorSeq: Number(tables.projection_cursors[0]?.last_applied_event_seq ?? -1),
    }
  } finally {
    try {
      closeStorage(storage)
    } catch {
      // Best-effort close; cleanup proceeds.
    }
  }
}

function retryInParent(row: CrashRow, root: string): { replay: boolean; code: string } {
  const storage = openStorage(configFor(root))
  try {
    const engine = createEngine({
      storage,
      clock: fixedClock(T0),
      toolVersion: 'kernel-lease-test',
    })
    const request = requestFor(row)
    const result =
      row.scenario === 'claim'
        ? claimLease(engine, request as never)
        : row.scenario === 'requestTransition'
          ? requestTransition(engine, request as never)
          : applyTransition(engine, request as never)
    return { replay: result.replay, code: result.effect.code }
  } finally {
    try {
      closeStorage(storage)
    } catch {
      // Best-effort close; cleanup proceeds.
    }
  }
}

/**
 * Wait for the child's first stdout chunk (its fault signal). A child that
 * exits before signalling is a NAMED failure carrying its raw stderr — never
 * a silent stall (error-laundering discipline).
 */
function awaitSignal(child: ChildProcess, rawStderr: () => string): Promise<Buffer> {
  const { promise, resolve, reject } = Promise.withResolvers<Buffer>()
  if (child.exitCode !== null || child.signalCode !== null) {
    reject(new Error(`child exited before fault signal; raw cause: ${rawStderr()}`))
    return promise
  }
  let settled = false
  child.stdout?.once('data', (chunk: Buffer) => {
    if (settled) return
    settled = true
    resolve(chunk)
  })
  child.once('close', () => {
    if (settled) return
    settled = true
    reject(new Error(`child exited before fault signal; raw cause: ${rawStderr()}`))
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

test('fixture inventory: 6 CR rows with one pre-declared outcome each', () => {
  assert.equal(CR.length, 6)
  const ids = new Set(CR.map((row) => row.id))
  assert.equal(ids.size, CR.length)
})

for (const row of CR) {
  test(`${row.id} kill at '${row.fault.afterStatement}' leaves state ${row.expectedOutcome.state}; retry ${row.expectedOutcome.retry}`, async () => {
    const root = mkdtempSync(join(tmpdir(), 'fk-p10-cr-'))
    const markerDir = join(root, 'markers')
    mkdirSync(markerDir, { recursive: true })
    try {
      seedFor(row.scenario, root)
      const planPath = join(root, 'fault-plan.json')
      writeFileSync(
        planPath,
        JSON.stringify({ ...row.fault, scenario: row.scenario, request: requestFor(row) }),
      )
      const child = spawn(
        process.execPath,
        ['--import', 'tsx', WORKER, 'crash', root, planPath, markerDir],
        { stdio: ['ignore', 'pipe', 'pipe'] },
      )
      let stderr = ''
      child.stderr.on('data', (chunk: Buffer) => {
        stderr += chunk.toString('utf8')
      })
      // The child announces the fault point on stdout (and a marker file) and
      // then blocks; assert it was REACHED (MIG-02 precedent) before killing.
      const signal = await awaitSignal(child, () => stderr)
      assert.match(signal.toString('utf8'), /fault-reached/, `${row.id}: fault signal`)
      assert.ok(existsSync(join(markerDir, 'fault-reached')), `${row.id}: kill point reached`)
      assert.ok(!existsSync(join(markerDir, 'fault-missed')), `${row.id}: fault fired`)
      child.kill()
      await waitClosed(child)

      const afterKill = snapshotTables(root)
      if (row.expectedOutcome.state === 'fully-absent') {
        // Row-exact across all six tables.
        assert.deepEqual(
          afterKill,
          {
            events: 0,
            goals: 1,
            goalRevision: 0,
            transitions: 0,
            leases: row.scenario === 'requestTransition' ? 1 : 0,
            idempotency_keys: 0,
            projection_cursors: 0,
            cursorSeq: -1,
          },
          `${row.id}: rollback to fully-absent`,
        )
      } else {
        assert.deepEqual(
          afterKill,
          {
            events: 1,
            goals: 1,
            goalRevision: 1,
            transitions: row.scenario === 'requestTransition' ? 1 : 0,
            leases: row.scenario === 'claim' ? 1 : 1,
            idempotency_keys: 1,
            projection_cursors: 1,
            cursorSeq: 1,
          },
          `${row.id}: state fully applied`,
        )
      }

      // The retry completes or replays — never a repeated effect.
      const retry = retryInParent(row, root)
      if (row.expectedOutcome.retry === 'applies') {
        assert.equal(retry.replay, false, `${row.id}: retry applies fresh`)
        assert.equal(retry.code, 'EFFECT_APPLIED')
        const afterRetry = snapshotTables(root)
        assert.equal(afterRetry.events, 1, `${row.id}: exactly one event after retry`)
        assert.equal(afterRetry.idempotency_keys, 1, `${row.id}: exactly one binding after retry`)
        assert.equal(afterRetry.goalRevision, 1, `${row.id}: exactly one bump after retry`)
      } else {
        assert.equal(retry.replay, true, `${row.id}: CR-04 retry must replay, not re-execute`)
        assert.equal(retry.code, 'EFFECT_APPLIED')
        const afterRetry = snapshotTables(root)
        assert.deepEqual(afterRetry, afterKill, `${row.id}: replay writes nothing (zero deltas)`)
      }
    } finally {
      rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 })
    }
  })
}
