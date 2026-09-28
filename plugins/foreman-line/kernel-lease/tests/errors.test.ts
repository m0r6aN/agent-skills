/**
 * L9 closed engine error registry — one tested refusal per code (22, closed),
 * bounded safe diagnostics per code (F05.10 discipline), and fault injection
 * proving no driver text/host path/credential can leak (AC11).
 */
import assert from 'node:assert/strict'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { removeRoot } from './helpers/child-worker.js'
import {
  closeStorage,
  fixedClock,
  insertGoal,
  insertIdempotencyKey,
  insertLease,
  insertTransition,
  type OpenStorageConfig,
  openStorage,
  type Storage,
} from '@foreman-line/kernel-state'
import {
  applyTransition,
  claimLease,
  createEngine,
  decideTransition,
  ENGINE_ERROR_CODE_COUNT,
  ENGINE_ERROR_CODES,
  ENGINE_ERROR_DISPOSITIONS,
  ENGINE_ERROR_REGISTRY,
  EngineError,
  engineError,
  getGoalState,
  releaseLease,
  renewLease,
  requestTransition,
  TrustedClock,
} from '../src/index.js'

const T0 = 1_700_000_000_000_000

/**
 * Read-path defense seam (standing #2: rows are `unknown` until normalized).
 * FK-P9's DB-level status CHECKs (A1a/A1b) make a genuinely out-of-vocabulary
 * `goals.status` row unwritable, so the engine's `GOAL_STATUS_UNKNOWN` read
 * refusal is exercised by patching the row at the driver boundary — the shape
 * of a legacy row arriving through an otherwise trusted substrate.
 */
function poisonGoalStatus(storage: Storage, goalId: string, status: string): Storage {
  const driver = storage.driver
  const patch = (row: unknown): unknown => {
    const record = row as Record<string, unknown> | null
    if (record !== null && record.goal_id === goalId && 'status' in record) {
      return { ...record, status }
    }
    return row
  }
  const poisoned = {
    exec: (sql: string) => {
      driver.exec(sql)
    },
    prepare: (sql: string) => {
      const statement = driver.prepare(sql)
      return {
        run: (...args: unknown[]) => statement.run(...args),
        get: (...args: unknown[]) => patch(statement.get(...args)),
        all: (...args: unknown[]) => (statement.all(...args) as unknown[]).map(patch),
      }
    },
    pragma: (source: string) => driver.pragma(source),
  }
  return { ...storage, driver: poisoned } as unknown as Storage
}

function configFor(root: string): OpenStorageConfig {
  return {
    storageRoot: root,
    databaseFileName: 'state.db',
    createIfMissing: true,
    clock: fixedClock(T0),
    backupPolicy: { root, retentionDescriptor: null },
  }
}

const bind = (op: string, who = 'principal-a') => ({
  principalRef: who,
  operationId: op,
  repositoryRef: 'repo-1',
  worktreeRef: 'wt-1',
  payloadDigest: `sha256:${Buffer.from(op).toString('hex').padEnd(64, '0').slice(0, 64)}`,
})

function expectCode(fn: () => unknown, code: string): EngineError {
  let caught: unknown
  try {
    fn()
  } catch (error) {
    caught = error
  }
  assert.ok(caught instanceof EngineError, `expected EngineError ${code}, got ${String(caught)}`)
  assert.equal(caught.code, code)
  return caught
}

test('registry is closed by derivation: 22 codes, type/table agreement, dispositions complete', () => {
  assert.equal(ENGINE_ERROR_CODE_COUNT, 22)
  assert.equal(ENGINE_ERROR_CODES.length, 22)
  for (const code of ENGINE_ERROR_CODES) {
    assert.ok(ENGINE_ERROR_REGISTRY[code].invariant.length > 0)
    assert.ok(code in ENGINE_ERROR_DISPOSITIONS)
    // The diagnostic shape table and the constructor agree (default-deny).
    const members = ENGINE_ERROR_REGISTRY[code].diagnosticMembers
    const diagnostic: Record<string, string | number> = {}
    for (const member of members) {
      diagnostic[member] = member === 'reason' ? 'absent' : 1
    }
    // Construction with the declared shape must not throw the shape guard.
    assert.doesNotThrow(() => {
      engineError(code, diagnostic)
    })
  }
})

test('one tested refusal per code (fault-injection matrix)', () => {
  const root = mkdtempSync(join(tmpdir(), 'fk-p10-err-'))
  const storage = openStorage(configFor(root))
  try {
    insertGoal(storage, { goalId: 'goal-1', revision: 0, status: 'active', updatedAtMicros: T0 })
    insertGoal(storage, {
      goalId: 'goal-term',
      revision: 0,
      status: 'completed',
      updatedAtMicros: T0,
    })
    // The A1a CHECK makes an invalid status unwritable; seeded valid and
    // poisoned at the driver seam below (GOAL_STATUS_UNKNOWN case).
    insertGoal(storage, {
      goalId: 'goal-weird',
      revision: 0,
      status: 'active',
      updatedAtMicros: T0,
    })
    insertLease(storage, {
      leaseId: 'lease-1',
      goalId: 'goal-1',
      ownerPrincipalRef: 'principal-a',
      casRevision: 0,
      acquiredAtMicros: T0 - 10,
      expiresAtMicros: T0 + 60_000_000,
      releasedAtMicros: null,
    })
    insertLease(storage, {
      leaseId: 'lease-gone',
      goalId: 'goal-1',
      ownerPrincipalRef: 'principal-a',
      casRevision: 0,
      acquiredAtMicros: T0 - 10,
      expiresAtMicros: T0 + 60_000_000,
      releasedAtMicros: T0 - 5,
    })
    // goal-exp carries the expired-but-unreleased lease (LEASE_EXPIRED).
    insertGoal(storage, { goalId: 'goal-exp', revision: 0, status: 'active', updatedAtMicros: T0 })
    insertLease(storage, {
      leaseId: 'lease-exp',
      goalId: 'goal-exp',
      ownerPrincipalRef: 'principal-a',
      casRevision: 0,
      acquiredAtMicros: T0 - 10,
      expiresAtMicros: T0 - 1,
      releasedAtMicros: null,
    })
    insertTransition(storage, {
      transitionId: 'tr-decided',
      goalId: 'goal-1',
      status: 'cancelled',
      requestedBy: 'principal-a',
      operationId: 'op-seed-1',
      payloadDigest: `sha256:${'5e'.repeat(32)}`,
      createdAtMicros: T0 - 10,
      decidedAtMicros: T0 - 5,
    })
    insertTransition(storage, {
      transitionId: 'tr-side',
      goalId: 'goal-term',
      status: 'active',
      requestedBy: 'principal-a',
      operationId: 'op-seed-2',
      payloadDigest: `sha256:${'5e'.repeat(32)}`,
      createdAtMicros: T0 - 10,
      decidedAtMicros: null,
    })
    insertIdempotencyKey(storage, {
      principalRef: 'principal-a',
      operationId: 'op-inflight',
      repositoryRef: 'repo-1',
      worktreeRef: 'wt-1',
      payloadDigest: `sha256:${'1f'.repeat(32)}`,
      effectDigest: null,
      recordedAtMicros: T0 - 10,
      completedAtMicros: null,
    })
    insertIdempotencyKey(storage, {
      principalRef: 'principal-a',
      operationId: 'op-conflict',
      repositoryRef: 'repo-1',
      worktreeRef: 'wt-1',
      payloadDigest: `sha256:${'cf'.repeat(32)}`,
      effectDigest: null,
      recordedAtMicros: T0 - 10,
      completedAtMicros: T0 - 10,
    })
    const engine = createEngine({
      storage,
      clock: fixedClock(T0),
      toolVersion: 'kernel-lease-test',
    })

    // 1 LEASE_HELD
    expectCode(
      () =>
        claimLease(engine, {
          goalId: 'goal-1',
          leaseId: 'lease-x',
          durationMicros: 5_000_000,
          expectedRevision: 0,
          idempotencyKey: bind('err-01', 'principal-c'),
        }),
      'LEASE_HELD',
    )
    // 2 LEASE_EXPIRED
    expectCode(
      () =>
        renewLease(engine, {
          goalId: 'goal-exp',
          leaseId: 'lease-exp',
          durationMicros: 5_000_000,
          expectedRevision: 0,
          idempotencyKey: bind('err-02'),
        }),
      'LEASE_EXPIRED',
    )
    // 3 LEASE_NOT_OWNER
    expectCode(
      () =>
        releaseLease(engine, {
          goalId: 'goal-1',
          leaseId: 'lease-1',
          expectedRevision: 0,
          idempotencyKey: bind('err-03', 'principal-c'),
        }),
      'LEASE_NOT_OWNER',
    )
    // 4 LEASE_NOT_ACTIVE (absent + released)
    expectCode(
      () =>
        releaseLease(engine, {
          goalId: 'goal-1',
          leaseId: 'lease-nope',
          expectedRevision: 0,
          idempotencyKey: bind('err-04a'),
        }),
      'LEASE_NOT_ACTIVE',
    )
    expectCode(
      () =>
        releaseLease(engine, {
          goalId: 'goal-1',
          leaseId: 'lease-gone',
          expectedRevision: 0,
          idempotencyKey: bind('err-04b'),
        }),
      'LEASE_NOT_ACTIVE',
    )
    // 5 GOAL_ABSENT
    expectCode(
      () =>
        claimLease(engine, {
          goalId: 'goal-nope',
          leaseId: 'lease-x',
          durationMicros: 5_000_000,
          expectedRevision: 0,
          idempotencyKey: bind('err-05'),
        }),
      'GOAL_ABSENT',
    )
    // 6 GOAL_TERMINAL
    expectCode(
      () =>
        claimLease(engine, {
          goalId: 'goal-term',
          leaseId: 'lease-x',
          durationMicros: 5_000_000,
          expectedRevision: 0,
          idempotencyKey: bind('err-06'),
        }),
      'GOAL_TERMINAL',
    )
    // 7 GOAL_STATUS_UNKNOWN (read-path defense; the poisoned row stands in for
    // a legacy row the A1a CHECK can no longer admit).
    const weirdEngine = createEngine({
      storage: poisonGoalStatus(storage, 'goal-weird', 'gate.satisfied'),
      clock: fixedClock(T0),
      toolVersion: 'kernel-lease-test',
    })
    expectCode(() => getGoalState(weirdEngine, 'goal-weird'), 'GOAL_STATUS_UNKNOWN')
    // 8 TRANSITION_ABSENT
    expectCode(
      () =>
        decideTransition(engine, {
          goalId: 'goal-1',
          transitionId: 'tr-nope',
          decision: 'apply',
          expectedRevision: 0,
          idempotencyKey: bind('err-08'),
        }),
      'TRANSITION_ABSENT',
    )
    // 9 TRANSITION_ALREADY_DECIDED
    expectCode(
      () =>
        decideTransition(engine, {
          goalId: 'goal-1',
          transitionId: 'tr-decided',
          decision: 'apply',
          expectedRevision: 0,
          idempotencyKey: bind('err-09'),
        }),
      'TRANSITION_ALREADY_DECIDED',
    )
    // 10 TRANSITION_PENDING_EXISTS
    insertGoal(storage, {
      goalId: 'goal-pending',
      revision: 0,
      status: 'active',
      pendingTransitionId: 'tr-side',
      updatedAtMicros: T0,
    })
    insertLease(storage, {
      leaseId: 'lease-p',
      goalId: 'goal-pending',
      ownerPrincipalRef: 'principal-a',
      casRevision: 0,
      acquiredAtMicros: T0 - 10,
      expiresAtMicros: T0 + 60_000_000,
      releasedAtMicros: null,
    })
    expectCode(
      () =>
        requestTransition(engine, {
          goalId: 'goal-pending',
          targetStatus: 'cancelled',
          expectedRevision: 0,
          idempotencyKey: bind('err-10'),
        }),
      'TRANSITION_PENDING_EXISTS',
    )
    // 11 TRANSITION_NOT_PENDING
    expectCode(
      () =>
        decideTransition(engine, {
          goalId: 'goal-1',
          transitionId: 'tr-side',
          decision: 'apply',
          expectedRevision: 0,
          idempotencyKey: bind('err-11'),
        }),
      'TRANSITION_NOT_PENDING',
    )
    // 12 TRANSITION_STATUS_UNKNOWN
    expectCode(
      () =>
        requestTransition(engine, {
          goalId: 'goal-1',
          targetStatus: 'bogus',
          expectedRevision: 0,
          idempotencyKey: bind('err-12'),
        }),
      'TRANSITION_STATUS_UNKNOWN',
    )
    // 13 ILLEGAL_TRANSITION
    expectCode(
      () =>
        applyTransition(engine, {
          goalId: 'goal-1',
          targetStatus: 'active',
          expectedRevision: 0,
          idempotencyKey: bind('err-13'),
        }),
      'ILLEGAL_TRANSITION',
    )
    // 14 GATE_EVIDENCE_REQUIRED (goal-1 is active: L4 active→completed)
    expectCode(
      () =>
        applyTransition(engine, {
          goalId: 'goal-1',
          targetStatus: 'completed',
          expectedRevision: 0,
          idempotencyKey: bind('err-14'),
        }),
      'GATE_EVIDENCE_REQUIRED',
    )
    // 15 GATE_STATE_NOT_WRITABLE
    expectCode(
      () =>
        applyTransition(engine, {
          goalId: 'goal-1',
          targetStatus: 'gate.satisfied',
          expectedRevision: 0,
          idempotencyKey: bind('err-15'),
        }),
      'GATE_STATE_NOT_WRITABLE',
    )
    // 16 IDEMPOTENCY_CONFLICT
    expectCode(
      () =>
        claimLease(engine, {
          goalId: 'goal-1',
          leaseId: 'lease-x',
          durationMicros: 5_000_000,
          expectedRevision: 0,
          idempotencyKey: bind('op-conflict'),
        }),
      'IDEMPOTENCY_CONFLICT',
    )
    // 17 IDEMPOTENCY_IN_FLIGHT (same key AND same payloadDigest: an incomplete
    // binding is never re-executed; a differing digest would conflict first)
    expectCode(
      () =>
        claimLease(engine, {
          goalId: 'goal-1',
          leaseId: 'lease-x',
          durationMicros: 5_000_000,
          expectedRevision: 0,
          idempotencyKey: {
            ...bind('op-inflight'),
            payloadDigest: `sha256:${'1f'.repeat(32)}`,
          },
        }),
      'IDEMPOTENCY_IN_FLIGHT',
    )
    // 18 STATE_REVISION_STALE
    expectCode(
      () =>
        applyTransition(engine, {
          goalId: 'goal-1',
          targetStatus: 'cancelled',
          expectedRevision: 9,
          idempotencyKey: bind('err-18'),
        }),
      'STATE_REVISION_STALE',
    )
    // 19 CLOCK_REGRESSION / 20 CLOCK_UNTRUSTED
    const regressed = new TrustedClock({
      nowMicros: (() => {
        const readings = [T0, T0 - 1]
        let index = 0
        return () => {
          const value = readings[Math.min(index, readings.length - 1)]
          index += 1
          return value as number
        }
      })(),
    })
    regressed.nowMicros()
    expectCode(() => regressed.nowMicros(), 'CLOCK_REGRESSION')
    const malformed = new TrustedClock({ nowMicros: () => Number.NaN })
    expectCode(() => malformed.nowMicros(), 'CLOCK_UNTRUSTED')
    // 21 ENGINE_ARGUMENT_INVALID
    expectCode(
      () =>
        claimLease(engine, {
          goalId: 'goal-1',
          leaseId: 'lease-x',
          durationMicros: 0,
          expectedRevision: 0,
          idempotencyKey: bind('err-21'),
        }),
      'ENGINE_ARGUMENT_INVALID',
    )
    // 22 STORAGE_FAILURE (a closed substrate handle wrapped at the seam)
    const closedRoot = mkdtempSync(join(tmpdir(), 'fk-p10-err-'))
    const closedStorage = openStorage(configFor(closedRoot))
    closeStorage(closedStorage)
    const closedEngine = createEngine({
      storage: closedStorage,
      clock: fixedClock(T0),
      toolVersion: 'kernel-lease-test',
    })
    try {
      const closedError = expectCode(
        () =>
          claimLease(closedEngine, {
            goalId: 'goal-1',
            leaseId: 'lease-x',
            durationMicros: 5_000_000,
            expectedRevision: 0,
            idempotencyKey: bind('err-22'),
          }),
        'STORAGE_FAILURE',
      )
      assert.deepEqual(closedError.diagnostic, { storageCode: 'STORAGE_CLOSED' })
    } finally {
      removeRoot(closedRoot)
    }
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

test('safe diagnostics carry only declared shapes (ids/revision/field paths — no free text)', () => {
  const root = mkdtempSync(join(tmpdir(), 'fk-p10-err-'))
  const storage = openStorage(configFor(root))
  try {
    insertGoal(storage, { goalId: 'goal-1', revision: 2, status: 'active', updatedAtMicros: T0 })
    insertLease(storage, {
      leaseId: 'lease-1',
      goalId: 'goal-1',
      ownerPrincipalRef: 'principal-a',
      casRevision: 2,
      acquiredAtMicros: T0 - 10,
      expiresAtMicros: T0 + 60_000_000,
      releasedAtMicros: null,
    })
    const engine = createEngine({
      storage,
      clock: fixedClock(T0),
      toolVersion: 'kernel-lease-test',
    })
    const stale = expectCode(
      () =>
        applyTransition(engine, {
          goalId: 'goal-1',
          targetStatus: 'cancelled',
          expectedRevision: 1,
          idempotencyKey: bind('diag-1'),
        }),
      'STATE_REVISION_STALE',
    )
    assert.deepEqual(stale.diagnostic, { expectedRevision: 1, actualRevision: 2 })
    const badField = expectCode(
      () =>
        claimLease(engine, {
          goalId: 'goal-1',
          leaseId: 'lease-x',
          durationMicros: -5,
          expectedRevision: 2,
          idempotencyKey: bind('diag-2'),
        }),
      'ENGINE_ARGUMENT_INVALID',
    )
    assert.deepEqual(badField.diagnostic, { fieldPath: 'claimLease.durationMicros' })
    // No surfaced message may carry anything beyond code + diagnostic JSON.
    for (const error of [stale, badField]) {
      assert.ok(!error.message.includes('\\'))
      assert.ok(error.diagnostic !== undefined)
    }
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

test('fault injection: a driver error carrying secrets surfaces STORAGE_FAILURE with the code literal only', () => {
  const root = mkdtempSync(join(tmpdir(), 'fk-p10-err-'))
  const storage = openStorage(configFor(root))
  try {
    insertGoal(storage, { goalId: 'goal-1', revision: 0, status: 'active', updatedAtMicros: T0 })
    const secret = 'C:\\Users\\hunter2\\pw=hunter2-secret'
    const poisoned = {
      ...storage,
      driver: {
        exec: () => {
          const fault = new Error(secret) as Error & { code: string }
          fault.code = 'SQLITE_IOERR'
          throw fault
        },
        prepare: () => {
          const fault = new Error(secret) as Error & { code: string }
          fault.code = 'SQLITE_IOERR'
          throw fault
        },
        pragma: () => [],
      },
    } as unknown as Storage
    const engine = createEngine({
      storage: poisoned,
      clock: fixedClock(T0),
      toolVersion: 'kernel-lease-test',
    })
    const failure = expectCode(
      () =>
        claimLease(engine, {
          goalId: 'goal-1',
          leaseId: 'lease-x',
          durationMicros: 5_000_000,
          expectedRevision: 0,
          idempotencyKey: bind('fault-1'),
        }),
      'STORAGE_FAILURE',
    )
    assert.deepEqual(failure.diagnostic, { storageCode: 'STORAGE_IO_FAILURE' })
    assert.ok(!failure.message.includes(secret))
    assert.ok(!failure.message.includes('hunter2'))
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

test('EngineError construction is default-deny on diagnostic shape', () => {
  assert.throws(() => engineError('GOAL_ABSENT', {}))
  assert.throws(() => engineError('GOAL_ABSENT', { leaseId: 'lease-1' }))
  assert.throws(() => engineError('LEASE_NOT_ACTIVE', { reason: 'weird' }))
  assert.throws(() => engineError('GOAL_ABSENT', { goalId: 'g', extra: 1 }))
})
