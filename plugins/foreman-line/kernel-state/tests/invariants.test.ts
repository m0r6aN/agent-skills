/**
 * DB-level substrate invariants (AC6): append-only triggers, foreign keys,
 * and the idempotency-tuple unique key — each mutation shape tested
 * independently (default-deny #30), failing-when-broken (#32).
 */
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { fixedClock } from '../src/clock.js'
import { StorageError } from '../src/errors.js'
import { closeStorage, type OpenStorageConfig, openStorage } from '../src/open.js'
import {
  consumeWakeupHandoff,
  getGoal,
  getIdempotencyKey,
  getLease,
  getRecordedResult,
  getTransition,
  getUnreleasedLease,
  insertEvent,
  insertGoal,
  insertIdempotencyKey,
  insertLease,
  insertTransition,
  insertWakeupHandoff,
  recordCompletedBinding,
  setProjectionCursor,
  updateGoalRow,
  updateLeaseRow,
} from '../src/rows.js'
import { type Storage, withTransaction } from '../src/transactions.js'

const T0 = 1_700_000_000_000_000

function configFor(root: string): OpenStorageConfig {
  return {
    storageRoot: root,
    databaseFileName: 'state.db',
    createIfMissing: true,
    clock: fixedClock(T0),
    backupPolicy: { root, retentionDescriptor: null },
  }
}

function withStorage<T>(fn: (storage: Storage) => T): T {
  const root = mkdtempSync(join(tmpdir(), 'fkp9-inv-'))
  const storage = openStorage(configFor(root))
  try {
    return fn(storage)
  } finally {
    closeStorage(storage)
    rmSync(root, { recursive: true, force: true })
  }
}

function seedGoalAndEvent(storage: Storage): void {
  insertGoal(storage, { goalId: 'goal-1', revision: 0, status: 'active', updatedAtMicros: T0 })
  insertEvent(storage, {
    eventId: 'evt-1',
    goalId: 'goal-1',
    kind: 'transition.requested',
    payload: '{}',
    payloadDigest: `sha256:${'a'.repeat(64)}`,
    principalRef: 'principal-1',
    operationId: 'op-1',
    recordedAtMicros: T0,
  })
}

function expectConstraint(fn: () => unknown, reasonCode: string): StorageError {
  try {
    fn()
  } catch (error) {
    assert.ok(error instanceof StorageError, `expected StorageError, got ${String(error)}`)
    assert.equal(error.code, 'STORAGE_CONSTRAINT_VIOLATION')
    assert.equal(error.diagnostic.reasonCode, reasonCode)
    return error
  }
  throw new Error(`expected STORAGE_CONSTRAINT_VIOLATION(${reasonCode})`)
}

function countEvents(storage: Storage): number {
  const row = storage.driver.prepare('SELECT count(*) AS c FROM events').get()
  if (row !== null && typeof row === 'object' && 'c' in row && typeof row.c === 'number') {
    return row.c
  }
  throw new Error('unexpected count row')
}

const INV = (id: string) => {
  const fixture = {
    'INV-01': { mutation: 'insert-event-unknown-goal', reasonCode: 'foreign-key' },
    'INV-02': { mutation: 'update-events-row', reasonCode: 'append-only' },
    'INV-03': { mutation: 'delete-events-row', reasonCode: 'append-only' },
    'INV-04': { mutation: 'insert-or-replace-events-row', reasonCode: 'append-only' },
    'INV-05': { mutation: 'update-then-delete-schema-migrations-row', reasonCode: 'append-only' },
  }[id]
  assert.ok(fixture, `${id} fixture declaration missing`)
  return fixture
}

test('A1: goals.status CHECK refuses out-of-vocab values as a typed constraint violation', () => {
  withStorage((storage) => {
    // Default-deny on the closed five-value vocab (FK-P10 OQ-1 ruling):
    // an Id-shaped but out-of-vocab status must refuse at the DB CHECK.
    assert.throws(
      () =>
        insertGoal(storage, {
          goalId: 'goal-legacy',
          revision: 0,
          status: 'legacy-open',
          updatedAtMicros: T0,
        }),
      (error: unknown) => {
        assert.ok(error instanceof StorageError)
        assert.equal(error.code, 'STORAGE_CONSTRAINT_VIOLATION')
        assert.equal(error.diagnostic.reasonCode, 'check')
        return true
      },
    )
    assert.equal(getGoal(storage, 'goal-legacy'), null, 'the refused row must not persist')
    // Failing-when-broken: a vocab value inserts cleanly (the CHECK is what
    // refuses, not the insert path).
    insertGoal(storage, { goalId: 'goal-1', revision: 0, status: 'active', updatedAtMicros: T0 })
    assert.equal(getGoal(storage, 'goal-1')?.status, 'active')
  })
})

test('INV-01: event with unknown goal_id refuses (foreign-key)', () => {
  const expected = INV('INV-01')
  withStorage((storage) => {
    const error = expectConstraint(
      () =>
        insertEvent(storage, {
          eventId: 'evt-x',
          goalId: 'goal-unknown',
          kind: 'transition.requested',
          payload: '{}',
          payloadDigest: `sha256:${'a'.repeat(64)}`,
          principalRef: 'principal-1',
          operationId: 'op-1',
          recordedAtMicros: T0,
        }),
      expected.reasonCode,
    )
    assert.equal(error.diagnostic.constraint, 'events')
  })
})

test('INV-02: UPDATE on events refuses (append-only)', () => {
  const expected = INV('INV-02')
  withStorage((storage) => {
    seedGoalAndEvent(storage)
    expectConstraint(
      () =>
        withTransaction(storage, (s) =>
          s.driver.prepare("UPDATE events SET kind = 'transition.applied'").run(),
        ),
      expected.reasonCode,
    )
  })
})

test('INV-03: DELETE on events refuses (append-only)', () => {
  const expected = INV('INV-03')
  withStorage((storage) => {
    seedGoalAndEvent(storage)
    expectConstraint(
      () => withTransaction(storage, (s) => s.driver.prepare('DELETE FROM events').run()),
      expected.reasonCode,
    )
  })
})

test('INV-04: INSERT OR REPLACE / upsert on events refuses (append-only)', () => {
  const expected = INV('INV-04')
  withStorage((storage) => {
    seedGoalAndEvent(storage)
    expectConstraint(
      () =>
        withTransaction(storage, (s) =>
          s.driver
            .prepare(
              `INSERT OR REPLACE INTO events (event_id, goal_id, kind, payload, payload_digest, principal_ref, operation_id, recorded_at_micros)
               VALUES ('evt-1', 'goal-1', 'transition.requested', '{}', '${`sha256:${'b'.repeat(64)}`}', 'principal-1', 'op-2', ${T0})`,
            )
            .run(),
        ),
      expected.reasonCode,
    )
    expectConstraint(
      () =>
        withTransaction(storage, (s) =>
          s.driver
            .prepare(
              `INSERT INTO events (event_id, goal_id, kind, payload, payload_digest, principal_ref, operation_id, recorded_at_micros)
               VALUES ('evt-1', 'goal-1', 'transition.requested', '{}', '${`sha256:${'b'.repeat(64)}`}', 'principal-1', 'op-2', ${T0})
               ON CONFLICT(event_id) DO UPDATE SET kind = 'transition.applied'`,
            )
            .run(),
        ),
      expected.reasonCode,
    )
  })
})

test('INV-05: UPDATE and DELETE on schema_migrations refuse (append-only)', () => {
  const expected = INV('INV-05')
  withStorage((storage) => {
    expectConstraint(
      () =>
        withTransaction(storage, (s) =>
          s.driver.prepare("UPDATE schema_migrations SET name = 'x'").run(),
        ),
      expected.reasonCode,
    )
    expectConstraint(
      () =>
        withTransaction(storage, (s) => s.driver.prepare('DELETE FROM schema_migrations').run()),
      expected.reasonCode,
    )
  })
})

test('failing-when-broken: removing the events delete trigger would let INV-03 pass', () => {
  // Mutation of the fixture surface (#32): the assertion binds to the named
  // trigger; with the trigger dropped the same DELETE succeeds.
  withStorage((storage) => {
    seedGoalAndEvent(storage)
    storage.driver.exec('DROP TRIGGER events_no_delete')
    storage.driver.prepare('DELETE FROM events').run()
    assert.equal(countEvents(storage), 0)
  })
})

test('idempotency tuple: same key with different payload_digest fails the unique key', () => {
  withStorage((storage) => {
    const key = {
      principalRef: 'principal-1',
      operationId: 'op-1',
      repositoryRef: 'repo-1',
      worktreeRef: 'wt-1',
    }
    insertIdempotencyKey(storage, {
      ...key,
      payloadDigest: `sha256:${'a'.repeat(64)}`,
      recordedAtMicros: T0,
    })
    expectConstraint(
      () =>
        insertIdempotencyKey(storage, {
          ...key,
          payloadDigest: `sha256:${'b'.repeat(64)}`,
          recordedAtMicros: T0 + 1,
        }),
      'unique-constraint',
    )
  })
})

test('lease partial unique index: at most one active lease per goal (substrate invariant)', () => {
  withStorage((storage) => {
    insertGoal(storage, { goalId: 'goal-1', revision: 0, status: 'active', updatedAtMicros: T0 })
    storage.driver
      .prepare(
        `INSERT INTO leases (lease_id, goal_id, owner_principal_ref, cas_revision, acquired_at_micros, expires_at_micros, released_at_micros)
         VALUES ('lease-1', 'goal-1', 'principal-1', 1, ${T0}, NULL, NULL)`,
      )
      .run()
    expectConstraint(
      () =>
        withTransaction(storage, (s) =>
          s.driver
            .prepare(
              `INSERT INTO leases (lease_id, goal_id, owner_principal_ref, cas_revision, acquired_at_micros, expires_at_micros, released_at_micros)
               VALUES ('lease-2', 'goal-1', 'principal-2', 2, ${T0}, NULL, NULL)`,
            )
            .run(),
        ),
      'unique-constraint',
    )
  })
})

test('guarded writes: empty guards refuse; no-match update touches zero rows', () => {
  withStorage((storage) => {
    insertGoal(storage, { goalId: 'goal-1', revision: 0, status: 'active', updatedAtMicros: T0 })
    assert.throws(
      () => updateGoalRow(storage, 'goal-1', {}, { status: 'completed' }),
      (error: unknown) => {
        assert.ok(error instanceof StorageError)
        assert.equal(error.code, 'STORAGE_ARGUMENT_INVALID')
        return true
      },
    )
    const changed = updateGoalRow(storage, 'goal-1', { revision: 99 }, { status: 'completed' })
    assert.equal(changed, 0)
    assert.equal(getGoal(storage, 'goal-1')?.status, 'active')
  })
})

test('payload byte cap is a protocol error, never truncation', () => {
  withStorage((storage) => {
    insertGoal(storage, { goalId: 'goal-1', revision: 0, status: 'active', updatedAtMicros: T0 })
    // 65,536 bytes exactly passes; one byte more refuses.
    const atLimit = 'x'.repeat(65_536)
    insertEvent(storage, {
      eventId: 'evt-limit',
      goalId: 'goal-1',
      kind: 'transition.requested',
      payload: atLimit,
      payloadDigest: `sha256:${'a'.repeat(64)}`,
      principalRef: 'principal-1',
      operationId: 'op-1',
      recordedAtMicros: T0,
    })
    assert.throws(
      () =>
        insertEvent(storage, {
          eventId: 'evt-over',
          goalId: 'goal-1',
          kind: 'transition.requested',
          payload: `${atLimit}x`,
          payloadDigest: `sha256:${'a'.repeat(64)}`,
          principalRef: 'principal-1',
          operationId: 'op-2',
          recordedAtMicros: T0,
        }),
      (error: unknown) => {
        assert.ok(error instanceof StorageError)
        assert.equal(error.code, 'STORAGE_PAYLOAD_LIMIT_EXCEEDED')
        return true
      },
    )
  })
})

test('consume wakeup is a guarded write (second consume touches zero rows)', () => {
  withStorage((storage) => {
    insertGoal(storage, { goalId: 'goal-1', revision: 0, status: 'active', updatedAtMicros: T0 })
    insertWakeupHandoff(storage, {
      wakeupId: 'wk-1',
      goalId: 'goal-1',
      kind: 'wakeup',
      fromSessionRef: 'sess-1',
      toSessionRef: null,
      createdAtMicros: T0,
    })
    assert.equal(consumeWakeupHandoff(storage, 'wk-1', T0 + 1), 1)
    assert.equal(consumeWakeupHandoff(storage, 'wk-1', T0 + 2), 0)
  })
})

test('guarded writes: unknown patch member refuses with STORAGE_ARGUMENT_INVALID (F2)', () => {
  withStorage((storage) => {
    insertGoal(storage, { goalId: 'goal-1', revision: 0, status: 'active', updatedAtMicros: T0 })
    assert.throws(
      () =>
        updateGoalRow(storage, 'goal-1', { revision: 0 }, {
          status: 'completed',
          bogus: 1,
        } as never),
      (error: unknown) => {
        assert.ok(error instanceof StorageError)
        assert.equal(error.code, 'STORAGE_ARGUMENT_INVALID')
        assert.equal(error.diagnostic.fieldPath, 'patch.bogus')
        return true
      },
    )
    // Failing-when-broken: without the unknown member the update applies.
    assert.equal(updateGoalRow(storage, 'goal-1', { revision: 0 }, { status: 'completed' }), 1)
  })
})

test('guarded writes: wrong-shape patch value refuses pre-write (F2)', () => {
  withStorage((storage) => {
    insertGoal(storage, { goalId: 'goal-1', revision: 0, status: 'active', updatedAtMicros: T0 })
    assert.throws(
      () => updateGoalRow(storage, 'goal-1', { revision: 0 }, { status: 'not a valid id!!' }),
      (error: unknown) => {
        assert.ok(error instanceof StorageError)
        assert.equal(error.code, 'STORAGE_ARGUMENT_INVALID')
        assert.equal(error.diagnostic.fieldPath, 'patch.status')
        return true
      },
    )
    // Pre-write refusal: nothing poisoned the row (a raw TEXT bind would have).
    assert.equal(getGoal(storage, 'goal-1')?.status, 'active')
    // Failing-when-broken: a shape-valid value passes.
    assert.equal(updateGoalRow(storage, 'goal-1', { revision: 0 }, { status: 'completed' }), 1)
  })
})

test('guarded writes: wrong-type guard refuses pre-write (F2)', () => {
  withStorage((storage) => {
    insertGoal(storage, { goalId: 'goal-1', revision: 0, status: 'active', updatedAtMicros: T0 })
    assert.throws(
      () =>
        updateGoalRow(storage, 'goal-1', { updatedAtMicros: 'soon' } as never, {
          status: 'completed',
        }),
      (error: unknown) => {
        assert.ok(error instanceof StorageError)
        assert.equal(error.code, 'STORAGE_ARGUMENT_INVALID')
        assert.equal(error.diagnostic.fieldPath, 'guards.updatedAtMicros')
        return true
      },
    )
    assert.equal(getGoal(storage, 'goal-1')?.status, 'active')
    // Failing-when-broken: a type-correct guard passes.
    assert.equal(
      updateGoalRow(storage, 'goal-1', { updatedAtMicros: T0 }, { status: 'completed' }),
      1,
    )
  })
})

test('guarded writes: identity members cannot be patched', () => {
  withStorage((storage) => {
    insertGoal(storage, { goalId: 'goal-1', revision: 0, status: 'active', updatedAtMicros: T0 })
    assert.throws(
      () => updateGoalRow(storage, 'goal-1', { revision: 0 }, { goalId: 'goal-renamed' } as never),
      (error: unknown) => {
        assert.ok(error instanceof StorageError)
        assert.equal(error.code, 'STORAGE_ARGUMENT_INVALID')
        assert.equal(error.diagnostic.fieldPath, 'patch.goalId')
        return true
      },
    )
    assert.ok(getGoal(storage, 'goal-1') !== null, 'the primary key must be untouched')
  })
})

test('nested withTransaction refuses (STORAGE_ARGUMENT_INVALID)', () => {
  withStorage((storage) => {
    withTransaction(storage, (inner) => {
      assert.throws(
        () => withTransaction(inner, () => undefined),
        (error: unknown) => {
          assert.ok(error instanceof StorageError)
          assert.equal(error.code, 'STORAGE_ARGUMENT_INVALID')
          return true
        },
      )
    })
  })
})

test('A1c: getLease distinguishes absent vs present exactly; normalized shape binds', () => {
  withStorage((storage) => {
    // Absent is exactly null — never a partial row.
    assert.equal(getLease(storage, 'lease-1'), null)
    insertGoal(storage, { goalId: 'goal-1', revision: 0, status: 'active', updatedAtMicros: T0 })
    insertLease(storage, {
      leaseId: 'lease-1',
      goalId: 'goal-1',
      ownerPrincipalRef: 'principal-1',
      casRevision: 3,
      acquiredAtMicros: T0,
      expiresAtMicros: null,
      releasedAtMicros: null,
    })
    const row = getLease(storage, 'lease-1')
    assert.ok(row !== null)
    assert.equal(row.leaseId, 'lease-1')
    assert.equal(row.goalId, 'goal-1')
    assert.equal(row.ownerPrincipalRef, 'principal-1')
    assert.equal(row.casRevision, 3)
    assert.equal(row.acquiredAtMicros, T0)
    assert.equal(row.expiresAtMicros, null)
    assert.equal(row.releasedAtMicros, null)
    // Failing-when-broken: mutate the row and the normalized shape binds to
    // the mutated values (the read reflects real row state, not a cached copy).
    storage.driver
      .prepare('UPDATE leases SET cas_revision = 42, expires_at_micros = 7 WHERE lease_id = ?')
      .run('lease-1')
    const mutated = getLease(storage, 'lease-1')
    assert.ok(mutated !== null)
    assert.equal(mutated.casRevision, 42)
    assert.equal(mutated.expiresAtMicros, 7)
    // Shape binding is enforced: a poisoned value refuses at normalization
    // instead of leaking through as a wrong-typed row.
    storage.driver
      .prepare("UPDATE leases SET cas_revision = 'soon' WHERE lease_id = ?")
      .run('lease-1')
    assert.throws(
      () => getLease(storage, 'lease-1'),
      (error: unknown) => {
        assert.ok(error instanceof StorageError)
        assert.equal(error.code, 'STORAGE_IO_FAILURE')
        assert.equal(error.diagnostic.driverCode, 'row-normalization')
        return true
      },
    )
  })
})

test('A1c: getUnreleasedLease ignores released leases and respects single-active', () => {
  withStorage((storage) => {
    insertGoal(storage, { goalId: 'goal-1', revision: 0, status: 'active', updatedAtMicros: T0 })
    // A released lease is invisible to the active-lease read.
    insertLease(storage, {
      leaseId: 'lease-old',
      goalId: 'goal-1',
      ownerPrincipalRef: 'principal-1',
      casRevision: 1,
      acquiredAtMicros: T0,
      expiresAtMicros: null,
      releasedAtMicros: T0 + 5,
    })
    assert.equal(getUnreleasedLease(storage, 'goal-1'), null)
    // The unreleased row is THE active lease (leases_single_active bound).
    insertLease(storage, {
      leaseId: 'lease-live',
      goalId: 'goal-1',
      ownerPrincipalRef: 'principal-2',
      casRevision: 2,
      acquiredAtMicros: T0 + 6,
      expiresAtMicros: null,
      releasedAtMicros: null,
    })
    const active = getUnreleasedLease(storage, 'goal-1')
    assert.equal(active?.leaseId, 'lease-live')
    assert.equal(active?.releasedAtMicros, null)
    // Single-active constraint: a second unreleased lease refuses.
    assert.throws(
      () =>
        insertLease(storage, {
          leaseId: 'lease-second',
          goalId: 'goal-1',
          ownerPrincipalRef: 'principal-3',
          casRevision: 3,
          acquiredAtMicros: T0 + 7,
          expiresAtMicros: null,
          releasedAtMicros: null,
        }),
      (error: unknown) => {
        assert.ok(error instanceof StorageError)
        assert.equal(error.code, 'STORAGE_CONSTRAINT_VIOLATION')
        assert.equal(error.diagnostic.reasonCode, 'unique-constraint')
        return true
      },
    )
    // Failing-when-broken: releasing the active lease empties the read again.
    assert.equal(
      updateLeaseRow(
        storage,
        'lease-live',
        { releasedAtMicros: null },
        { releasedAtMicros: T0 + 9 },
      ),
      1,
    )
    assert.equal(getUnreleasedLease(storage, 'goal-1'), null)
  })
})

test('A1c: getTransition distinguishes absent vs present exactly; normalized shape binds', () => {
  withStorage((storage) => {
    assert.equal(getTransition(storage, 'tr-1'), null)
    insertGoal(storage, { goalId: 'goal-1', revision: 0, status: 'active', updatedAtMicros: T0 })
    insertTransition(storage, {
      transitionId: 'tr-1',
      goalId: 'goal-1',
      status: 'completed',
      requestedBy: 'principal-1',
      operationId: 'op-1',
      payloadDigest: `sha256:${'a'.repeat(64)}`,
      createdAtMicros: T0,
      decidedAtMicros: null,
    })
    const row = getTransition(storage, 'tr-1')
    assert.ok(row !== null)
    assert.equal(row.transitionId, 'tr-1')
    assert.equal(row.status, 'completed')
    assert.equal(row.requestedBy, 'principal-1')
    assert.equal(row.payloadDigest, `sha256:${'a'.repeat(64)}`)
    assert.equal(row.decidedAtMicros, null)
    // Failing-when-broken: mutation binds the normalized shape to row state.
    storage.driver
      .prepare('UPDATE transitions SET decided_at_micros = 7 WHERE transition_id = ?')
      .run('tr-1')
    const decided = getTransition(storage, 'tr-1')
    assert.equal(decided?.decidedAtMicros, 7)
    storage.driver
      .prepare("UPDATE transitions SET decided_at_micros = 'soon' WHERE transition_id = ?")
      .run('tr-1')
    assert.throws(
      () => getTransition(storage, 'tr-1'),
      (error: unknown) => {
        assert.ok(error instanceof StorageError)
        assert.equal(error.code, 'STORAGE_IO_FAILURE')
        assert.equal(error.diagnostic.driverCode, 'row-normalization')
        return true
      },
    )
  })
})

test('A1d: recordCompletedBinding stores result bytes and getRecordedResult returns them exactly', () => {
  withStorage((storage) => {
    const key = {
      principalRef: 'principal-1',
      operationId: 'op-1',
      repositoryRef: 'repo-1',
      worktreeRef: 'wt-1',
    }
    // Absent binding reads null — never an invented result.
    assert.equal(getRecordedResult(storage, key), null)
    const result = new TextEncoder().encode('{"code":"EFFECT_APPLIED","goalRevision":7}')
    recordCompletedBinding(storage, {
      ...key,
      payloadDigest: `sha256:${'a'.repeat(64)}`,
      effectDigest: `sha256:${'b'.repeat(64)}`,
      recordedResult: result,
      recordedAtMicros: T0,
      completedAtMicros: T0 + 1,
    })
    const stored = getRecordedResult(storage, key)
    assert.ok(stored !== null)
    assert.deepEqual(Array.from(stored), Array.from(result))
    // Failing-when-broken: the stored bytes bind literally — mutating the row
    // changes exactly what the read returns (verbatim, not re-derived).
    const mutated = new TextEncoder().encode('{"code":"EFFECT_APPLIED","goalRevision":2}')
    storage.driver
      .prepare(
        'UPDATE idempotency_keys SET recorded_result = ? WHERE principal_ref = ? AND operation_id = ? AND repository_ref = ? AND worktree_ref = ?',
      )
      .run(mutated, key.principalRef, key.operationId, key.repositoryRef, key.worktreeRef)
    const after = getRecordedResult(storage, key)
    assert.ok(after !== null)
    assert.deepEqual(Array.from(after), Array.from(mutated))
    // The full binding row also carries the stored result.
    const row = getIdempotencyKey(storage, key)
    assert.deepEqual(Array.from(row?.recordedResult ?? []), Array.from(mutated))
    assert.equal(row?.completedAtMicros, T0 + 1)
  })
})

test('A1d: legacy bindings without stored results read null; consumers must not invent one', () => {
  withStorage((storage) => {
    const key = {
      principalRef: 'principal-1',
      operationId: 'op-1',
      repositoryRef: 'repo-1',
      worktreeRef: 'wt-1',
    }
    // The request-time path writes no result (pre-A1d shape).
    insertIdempotencyKey(storage, {
      ...key,
      payloadDigest: `sha256:${'a'.repeat(64)}`,
      recordedAtMicros: T0,
      completedAtMicros: T0 + 1,
    })
    assert.equal(getRecordedResult(storage, key), null)
    const row = getIdempotencyKey(storage, key)
    assert.equal(row?.recordedResult, null)
  })
})

test('A1d: APPLIED and NOOP completions both store their result (unified invariant)', () => {
  withStorage((storage) => {
    const applied = new TextEncoder().encode('{"code":"EFFECT_APPLIED","goalRevision":2}')
    const noop = new TextEncoder().encode('{"code":"EFFECT_NOOP","goalRevision":1}')
    recordCompletedBinding(storage, {
      principalRef: 'principal-1',
      operationId: 'op-applied',
      repositoryRef: 'repo-1',
      worktreeRef: 'wt-1',
      payloadDigest: `sha256:${'a'.repeat(64)}`,
      effectDigest: `sha256:${'b'.repeat(64)}`,
      recordedResult: applied,
      completedAtMicros: T0 + 1,
    })
    recordCompletedBinding(storage, {
      principalRef: 'principal-1',
      operationId: 'op-noop',
      repositoryRef: 'repo-1',
      worktreeRef: 'wt-1',
      payloadDigest: `sha256:${'c'.repeat(64)}`,
      effectDigest: null,
      recordedResult: noop,
      completedAtMicros: T0 + 2,
    })
    const appliedStored = getRecordedResult(storage, {
      principalRef: 'principal-1',
      operationId: 'op-applied',
      repositoryRef: 'repo-1',
      worktreeRef: 'wt-1',
    })
    const noopStored = getRecordedResult(storage, {
      principalRef: 'principal-1',
      operationId: 'op-noop',
      repositoryRef: 'repo-1',
      worktreeRef: 'wt-1',
    })
    assert.ok(appliedStored !== null, 'APPLIED completions store their result')
    assert.ok(
      noopStored !== null,
      'NOOP completions store their result too (no event exists to re-derive from)',
    )
    assert.deepEqual(Array.from(noopStored), Array.from(noop))
  })
})

test('A1e: events.kind CHECK refuses out-of-vocab kinds as a typed constraint violation', () => {
  withStorage((storage) => {
    insertGoal(storage, { goalId: 'goal-1', revision: 0, status: 'active', updatedAtMicros: T0 })
    // The pre-A1e seed shape is out of the T8 vocabulary: refuse with CHECK.
    assert.throws(
      () =>
        insertEvent(storage, {
          eventId: 'evt-bad',
          goalId: 'goal-1',
          kind: 'created',
          payload: '{}',
          payloadDigest: `sha256:${'a'.repeat(64)}`,
          principalRef: 'principal-1',
          operationId: 'op-1',
          recordedAtMicros: T0,
        }),
      (error: unknown) => {
        assert.ok(error instanceof StorageError)
        assert.equal(error.code, 'STORAGE_CONSTRAINT_VIOLATION')
        assert.equal(error.diagnostic.reasonCode, 'check')
        return true
      },
    )
    // Failing-when-broken: a vocab kind inserts cleanly (the CHECK refuses).
    insertEvent(storage, {
      eventId: 'evt-ok',
      goalId: 'goal-1',
      kind: 'transition.requested',
      payload: '{}',
      payloadDigest: `sha256:${'a'.repeat(64)}`,
      principalRef: 'principal-1',
      operationId: 'op-1',
      recordedAtMicros: T0,
    })
  })
})

test('A1e: the events.kind vocabulary is exactly enforced (default-deny)', () => {
  withStorage((storage) => {
    insertGoal(storage, { goalId: 'goal-1', revision: 0, status: 'active', updatedAtMicros: T0 })
    const kinds = [
      'lease.claimed',
      'lease.takeover',
      'lease.renewed',
      'lease.released',
      'transition.requested',
      'transition.applied',
      'transition.rejected',
      'import.recorded',
      'import.epoch',
    ]
    for (const kind of kinds) {
      insertEvent(storage, {
        eventId: `evt-${kind}`,
        goalId: 'goal-1',
        kind,
        payload: '{}',
        payloadDigest: `sha256:${'a'.repeat(64)}`,
        principalRef: 'principal-1',
        operationId: `op-${kind}`,
        recordedAtMicros: T0,
      })
    }
    assert.throws(
      () =>
        insertEvent(storage, {
          eventId: 'evt-legacy',
          goalId: 'goal-1',
          kind: 'goal.state-changed',
          payload: '{}',
          payloadDigest: `sha256:${'a'.repeat(64)}`,
          principalRef: 'principal-1',
          operationId: 'op-legacy',
          recordedAtMicros: T0,
        }),
      (error: unknown) => {
        assert.ok(error instanceof StorageError)
        assert.equal(error.code, 'STORAGE_CONSTRAINT_VIOLATION')
        return true
      },
    )
  })
})

test('A1e: projection_cursors registry refuses unregistered cursor ids', () => {
  withStorage((storage) => {
    // The registered closed set: goal-state (FK-P10 RESERVED) + the two
    // FK-P11 ids reserved by this amendment. Registered ids write cleanly.
    for (const projectionId of ['goal-state', 'md-goals-index', 'md-goal-ledger']) {
      setProjectionCursor(storage, {
        projectionId,
        goalId: null,
        lastAppliedEventSeq: 1,
        updatedAtMicros: T0,
      })
    }
    // A silent namespace grab refuses at the DB (OQ-4: never a silent grab).
    assert.throws(
      () =>
        setProjectionCursor(storage, {
          projectionId: 'proj-future',
          goalId: null,
          lastAppliedEventSeq: 1,
          updatedAtMicros: T0,
        }),
      (error: unknown) => {
        assert.ok(error instanceof StorageError)
        assert.equal(error.code, 'STORAGE_CONSTRAINT_VIOLATION')
        assert.equal(error.diagnostic.reasonCode, 'check')
        return true
      },
    )
  })
})

test('a throwing transaction body rolls back every write', () => {
  withStorage((storage) => {
    insertGoal(storage, { goalId: 'goal-1', revision: 0, status: 'active', updatedAtMicros: T0 })
    assert.throws(() =>
      withTransaction(storage, (inner) => {
        insertEvent(inner, {
          eventId: 'evt-rollback',
          goalId: 'goal-1',
          kind: 'transition.requested',
          payload: '{}',
          payloadDigest: `sha256:${'a'.repeat(64)}`,
          principalRef: 'principal-1',
          operationId: 'op-1',
          recordedAtMicros: T0,
        })
        throw new Error('boom')
      }),
    )
    assert.equal(countEvents(storage), 0)
  })
})
