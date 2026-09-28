/**
 * L1 lease semantics — hostile rows LSE-01..11 plus controls CTL-08..10 and
 * the failing-when-broken invariant probes (AC2/AC3, standing #32).
 */
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { removeRoot } from './helpers/child-worker.js'
import {
  closeStorage,
  exportStorage,
  fixedClock,
  insertGoal,
  insertLease,
  type OpenStorageConfig,
  openStorage,
} from '@foreman-line/kernel-state'
import {
  applyTransition,
  claimLease,
  createEngine,
  decideTransition,
  EngineError,
  getLeaseCasDescriptor,
  releaseLease,
  renewLease,
  requestTransition,
} from '../src/index.js'

const T0 = 1_700_000_000_000_000
const FIXTURES = join(import.meta.dirname, 'fixtures')

interface FixtureRow {
  id: string
  op: string
  setup: {
    goal: { status: string; revision: number }
    lease: null | {
      leaseId: string
      ownerPrincipalRef: string
      expiresAtMicros: number
      releasedAtMicros: number | null
      casRevision: number
    }
  }
  input: Record<string, unknown>
  expectedCode: string
  expectedReasonCode?: string
}

const parsedFixture: unknown = JSON.parse(
  readFileSync(join(FIXTURES, 'hostile', 'leases.json'), 'utf8'),
)
const fixtureTable = parsedFixture as { records: FixtureRow[] }
const LSE = fixtureTable.records

function configFor(root: string): OpenStorageConfig {
  return {
    storageRoot: root,
    databaseFileName: 'state.db',
    createIfMissing: true,
    clock: fixedClock(T0),
    backupPolicy: { root, retentionDescriptor: null },
  }
}

function withSeeded(row: FixtureRow, fn: (engine: ReturnType<typeof createEngine>) => void): void {
  const root = mkdtempSync(join(tmpdir(), 'fk-p10-lse-'))
  const storage = openStorage(configFor(root))
  try {
    insertGoal(storage, {
      goalId: 'goal-1',
      revision: row.setup.goal.revision,
      status: row.setup.goal.status,
      updatedAtMicros: T0,
    })
    if (row.setup.lease !== null) {
      insertLease(storage, {
        goalId: 'goal-1',
        ...(row.setup.lease as object),
        acquiredAtMicros: T0 - 10,
      } as never)
    }
    fn(createEngine({ storage, clock: fixedClock(T0), toolVersion: 'kernel-lease-test' }))
  } finally {
    // Close BEFORE cleanup: an open SQLite handle locks the tree on Windows
    // and removeRoot retries EPERM without ever masking the test verdict (R3).
    try {
      closeStorage(storage)
    } catch {
      // Best-effort close; cleanup proceeds.
    }
    removeRoot(root)
  }
}

function runOp(
  engine: ReturnType<typeof createEngine>,
  op: string,
  input: Record<string, unknown>,
): unknown {
  switch (op) {
    case 'claimLease':
      return claimLease(engine, input as never)
    case 'renewLease':
      return renewLease(engine, input as never)
    case 'releaseLease':
      return releaseLease(engine, input as never)
    case 'requestTransition':
      return requestTransition(engine, input as never)
    case 'decideTransition':
      return decideTransition(engine, input as never)
    case 'applyTransition':
      return applyTransition(engine, input as never)
    default:
      throw new Error(`unsupported op ${op}`)
  }
}

test('fixture inventory: 11 LSE rows, unique ids, one pre-declared outcome each', () => {
  assert.equal(LSE.length, 11)
  const ids = new Set(LSE.map((row) => row.id))
  assert.equal(ids.size, LSE.length)
  for (const row of LSE) {
    const outcomes = [row.expectedCode, row.expectedReasonCode].filter((v) => v !== undefined)
    assert.ok(outcomes.length >= 1, `${row.id} must carry a pre-declared outcome`)
  }
})

for (const row of LSE) {
  test(`${row.id} refuses exactly ${row.expectedCode}`, () => {
    withSeeded(row, (engine) => {
      assert.throws(
        () => runOp(engine, row.op, row.input),
        (error: unknown) => {
          assert.ok(error instanceof EngineError, `${row.id}: expected EngineError`)
          assert.equal(error.code, row.expectedCode)
          if (row.expectedReasonCode !== undefined) {
            assert.equal(error.diagnostic.reason, row.expectedReasonCode)
          }
          return true
        },
      )
    })
  })
}

test('CTL-08 claim→renew→release cycle applies cleanly with one event per op', () => {
  const root = mkdtempSync(join(tmpdir(), 'fk-p10-lse-'))
  const storage = openStorage(configFor(root))
  try {
    insertGoal(storage, { goalId: 'goal-1', revision: 0, status: 'active', updatedAtMicros: T0 })
    const engine = createEngine({
      storage,
      clock: fixedClock(T0),
      toolVersion: 'kernel-lease-test',
    })
    const bind = (op: string) => ({
      principalRef: 'principal-a',
      operationId: op,
      repositoryRef: 'repo-1',
      worktreeRef: 'wt-1',
      payloadDigest: `sha256:${Buffer.from(op).toString('hex').padEnd(64, '0').slice(0, 64)}`,
    })
    const claimed = claimLease(engine, {
      goalId: 'goal-1',
      leaseId: 'lease-1',
      durationMicros: 5_000_000,
      expectedRevision: 0,
      idempotencyKey: bind('op-ctl-08a'),
    })
    assert.equal(claimed.effect.code, 'EFFECT_APPLIED')
    assert.equal(claimed.effect.goalRevision, 1)
    assert.deepEqual(claimed.result, {
      leaseId: 'lease-1',
      leaseOwnerPrincipalRef: 'principal-a',
      casRevision: 1,
      leaseExpiresAtMicros: T0 + 5_000_000,
    })
    const renewed = renewLease(engine, {
      goalId: 'goal-1',
      leaseId: 'lease-1',
      durationMicros: 9_000_000,
      expectedRevision: 1,
      idempotencyKey: bind('op-ctl-08b'),
    })
    assert.equal(renewed.effect.goalRevision, 2)
    const released = releaseLease(engine, {
      goalId: 'goal-1',
      leaseId: 'lease-1',
      expectedRevision: 2,
      idempotencyKey: bind('op-ctl-08c'),
    })
    assert.equal(released.effect.goalRevision, 3)
    assert.equal(getLeaseCasDescriptor(engine, 'goal-1'), null)
    const snapshot = exportStorage(storage)
    assert.equal(snapshot.exportDocument.payload.tables.events.length, 3)
    assert.equal(snapshot.exportDocument.payload.tables.goals[0]?.revision, 3)
    assert.equal(snapshot.exportDocument.payload.tables.leases[0]?.released_at_micros, T0)
    assert.equal(snapshot.exportDocument.payload.tables.idempotency_keys.length, 3)
  } finally {
    // Close BEFORE cleanup: an open SQLite handle locks the tree on Windows
    // and removeRoot retries EPERM without ever masking the test verdict (R3).
    try {
      closeStorage(storage)
    } catch {
      // Best-effort close; cleanup proceeds.
    }
    removeRoot(root)
  }
})

test('CTL-09 expired-lease takeover stamps the prior row and inserts the new lease', () => {
  const root = mkdtempSync(join(tmpdir(), 'fk-p10-lse-'))
  const storage = openStorage(configFor(root))
  try {
    insertGoal(storage, { goalId: 'goal-1', revision: 0, status: 'active', updatedAtMicros: T0 })
    insertLease(storage, {
      leaseId: 'lease-old',
      goalId: 'goal-1',
      ownerPrincipalRef: 'principal-a',
      casRevision: 0,
      acquiredAtMicros: T0 - 100_000,
      expiresAtMicros: T0 - 1,
      releasedAtMicros: null,
    })
    const engine = createEngine({
      storage,
      clock: fixedClock(T0),
      toolVersion: 'kernel-lease-test',
    })
    const taken = claimLease(engine, {
      goalId: 'goal-1',
      leaseId: 'lease-new',
      durationMicros: 5_000_000,
      expectedRevision: 0,
      idempotencyKey: {
        principalRef: 'principal-b',
        operationId: 'op-ctl-09',
        repositoryRef: 'repo-1',
        worktreeRef: 'wt-1',
        payloadDigest: `sha256:${'09'.repeat(32)}`,
      },
    })
    assert.equal(taken.effect.code, 'EFFECT_APPLIED')
    const snapshot = exportStorage(storage)
    const leases = snapshot.exportDocument.payload.tables.leases
    const prior = leases.find((row) => row.lease_id === 'lease-old')
    assert.equal(prior?.released_at_micros, T0)
    assert.equal(leases.find((row) => row.lease_id === 'lease-new')?.released_at_micros, null)
    assert.equal(snapshot.exportDocument.payload.tables.events[0]?.kind, 'lease.takeover')
  } finally {
    // Close BEFORE cleanup: an open SQLite handle locks the tree on Windows
    // and removeRoot retries EPERM without ever masking the test verdict (R3).
    try {
      closeStorage(storage)
    } catch {
      // Best-effort close; cleanup proceeds.
    }
    removeRoot(root)
  }
})

test('CTL-10 same-principal re-claim is EFFECT_NOOP with null effectDigest and no writes', () => {
  const root = mkdtempSync(join(tmpdir(), 'fk-p10-lse-'))
  const storage = openStorage(configFor(root))
  try {
    insertGoal(storage, { goalId: 'goal-1', revision: 0, status: 'active', updatedAtMicros: T0 })
    const engine = createEngine({
      storage,
      clock: fixedClock(T0),
      toolVersion: 'kernel-lease-test',
    })
    const bind = (op: string) => ({
      principalRef: 'principal-a',
      operationId: op,
      repositoryRef: 'repo-1',
      worktreeRef: 'wt-1',
      payloadDigest: `sha256:${Buffer.from(op).toString('hex').padEnd(64, '0').slice(0, 64)}`,
    })
    claimLease(engine, {
      goalId: 'goal-1',
      leaseId: 'lease-1',
      durationMicros: 5_000_000,
      expectedRevision: 0,
      idempotencyKey: bind('op-ctl-10a'),
    })
    const noop = claimLease(engine, {
      goalId: 'goal-1',
      leaseId: 'lease-2',
      durationMicros: 5_000_000,
      expectedRevision: 1,
      idempotencyKey: bind('op-ctl-10b'),
    })
    assert.equal(noop.effect.code, 'EFFECT_NOOP')
    assert.equal(noop.effect.decision, 'NOOP')
    assert.equal(noop.effect.effectDigest, null)
    assert.equal(noop.replay, false)
    const snapshot = exportStorage(storage)
    assert.equal(snapshot.exportDocument.payload.tables.events.length, 1)
    assert.equal(snapshot.exportDocument.payload.tables.goals[0]?.revision, 1)
  } finally {
    // Close BEFORE cleanup: an open SQLite handle locks the tree on Windows
    // and removeRoot retries EPERM without ever masking the test verdict (R3).
    try {
      closeStorage(storage)
    } catch {
      // Best-effort close; cleanup proceeds.
    }
    removeRoot(root)
  }
})

test('AC3 mutation probe: the substrate single-active index refuses a second active lease row', () => {
  // Failing-when-broken for the single-writer invariant: bypassing the engine,
  // a second unreleased lease row cannot exist (leases_single_active).
  const root = mkdtempSync(join(tmpdir(), 'fk-p10-lse-'))
  const storage = openStorage(configFor(root))
  try {
    insertGoal(storage, { goalId: 'goal-1', revision: 0, status: 'active', updatedAtMicros: T0 })
    insertLease(storage, {
      leaseId: 'lease-a',
      goalId: 'goal-1',
      ownerPrincipalRef: 'principal-a',
      casRevision: 0,
      acquiredAtMicros: T0,
      expiresAtMicros: T0 + 10,
      releasedAtMicros: null,
    })
    assert.throws(
      () =>
        insertLease(storage, {
          leaseId: 'lease-b',
          goalId: 'goal-1',
          ownerPrincipalRef: 'principal-b',
          casRevision: 0,
          acquiredAtMicros: T0,
          expiresAtMicros: T0 + 10,
          releasedAtMicros: null,
        }),
      (error: unknown) => {
        assert.ok(error instanceof Error)
        assert.match(String(error), /STORAGE_CONSTRAINT_VIOLATION/)
        return true
      },
    )
  } finally {
    // Close BEFORE cleanup: an open SQLite handle locks the tree on Windows
    // and removeRoot retries EPERM without ever masking the test verdict (R3).
    try {
      closeStorage(storage)
    } catch {
      // Best-effort close; cleanup proceeds.
    }
    removeRoot(root)
  }
})

test('AC2 mutation probe: stale expectedRevision never silently writes (guard is load-bearing)', () => {
  const root = mkdtempSync(join(tmpdir(), 'fk-p10-lse-'))
  const storage = openStorage(configFor(root))
  try {
    insertGoal(storage, { goalId: 'goal-1', revision: 2, status: 'active', updatedAtMicros: T0 })
    insertLease(storage, {
      leaseId: 'lease-1',
      goalId: 'goal-1',
      ownerPrincipalRef: 'principal-a',
      casRevision: 2,
      acquiredAtMicros: T0,
      expiresAtMicros: T0 + 5_000_000,
      releasedAtMicros: null,
    })
    const engine = createEngine({
      storage,
      clock: fixedClock(T0),
      toolVersion: 'kernel-lease-test',
    })
    assert.throws(
      () =>
        renewLease(engine, {
          goalId: 'goal-1',
          leaseId: 'lease-1',
          durationMicros: 5_000_000,
          expectedRevision: 1,
          idempotencyKey: {
            principalRef: 'principal-a',
            operationId: 'op-mut-cas',
            repositoryRef: 'repo-1',
            worktreeRef: 'wt-1',
            payloadDigest: `sha256:${'ca'.repeat(32)}`,
          },
        }),
      (error: unknown) => {
        assert.ok(error instanceof EngineError)
        assert.equal(error.code, 'STATE_REVISION_STALE')
        assert.deepEqual(error.diagnostic, { expectedRevision: 1, actualRevision: 2 })
        return true
      },
    )
    const snapshot = exportStorage(storage)
    assert.equal(snapshot.exportDocument.payload.tables.goals[0]?.revision, 2)
    assert.equal(snapshot.exportDocument.payload.tables.events.length, 0)
  } finally {
    // Close BEFORE cleanup: an open SQLite handle locks the tree on Windows
    // and removeRoot retries EPERM without ever masking the test verdict (R3).
    try {
      closeStorage(storage)
    } catch {
      // Best-effort close; cleanup proceeds.
    }
    removeRoot(root)
  }
})

test('precedence: structural input beats idempotency beats clock beats goal beats lease beats CAS', () => {
  const root = mkdtempSync(join(tmpdir(), 'fk-p10-lse-'))
  const storage = openStorage(configFor(root))
  try {
    insertGoal(storage, { goalId: 'goal-1', revision: 5, status: 'active', updatedAtMicros: T0 })
    const engine = createEngine({
      storage,
      clock: fixedClock(T0),
      toolVersion: 'kernel-lease-test',
    })
    const goodBind = {
      principalRef: 'principal-a',
      operationId: 'op-prec-1',
      repositoryRef: 'repo-1',
      worktreeRef: 'wt-1',
      payloadDigest: `sha256:${'ab'.repeat(32)}`,
    }
    // Structural (bad duration) fires even with a stale CAS and absent goal.
    assert.throws(
      () =>
        claimLease(engine, {
          goalId: 'goal-absent',
          leaseId: 'lease-1',
          durationMicros: 0,
          expectedRevision: 99,
          idempotencyKey: goodBind,
        }),
      (error: unknown) => {
        assert.ok(error instanceof EngineError)
        assert.equal(error.code, 'ENGINE_ARGUMENT_INVALID')
        return true
      },
    )
    // Goal existence beats CAS.
    assert.throws(
      () =>
        claimLease(engine, {
          goalId: 'goal-absent',
          leaseId: 'lease-1',
          durationMicros: 5_000_000,
          expectedRevision: 99,
          idempotencyKey: goodBind,
        }),
      (error: unknown) => {
        assert.ok(error instanceof EngineError)
        assert.equal(error.code, 'GOAL_ABSENT')
        return true
      },
    )
    // Terminal beats lease/CAS.
    insertGoal(storage, { goalId: 'goal-2', revision: 0, status: 'cancelled', updatedAtMicros: T0 })
    assert.throws(
      () =>
        claimLease(engine, {
          goalId: 'goal-2',
          leaseId: 'lease-1',
          durationMicros: 5_000_000,
          expectedRevision: 99,
          idempotencyKey: { ...goodBind, operationId: 'op-prec-2' },
        }),
      (error: unknown) => {
        assert.ok(error instanceof EngineError)
        assert.equal(error.code, 'GOAL_TERMINAL')
        return true
      },
    )
  } finally {
    // Close BEFORE cleanup: an open SQLite handle locks the tree on Windows
    // and removeRoot retries EPERM without ever masking the test verdict (R3).
    try {
      closeStorage(storage)
    } catch {
      // Best-effort close; cleanup proceeds.
    }
    removeRoot(root)
  }
})
