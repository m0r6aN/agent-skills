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
  insertEvent,
  insertGoal,
  insertIdempotencyKey,
  insertWakeupHandoff,
  updateGoalRow,
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
  insertGoal(storage, { goalId: 'goal-1', revision: 0, status: 'open', updatedAtMicros: T0 })
  insertEvent(storage, {
    eventId: 'evt-1',
    goalId: 'goal-1',
    kind: 'created',
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

test('INV-01: event with unknown goal_id refuses (foreign-key)', () => {
  const expected = INV('INV-01')
  withStorage((storage) => {
    const error = expectConstraint(
      () =>
        insertEvent(storage, {
          eventId: 'evt-x',
          goalId: 'goal-unknown',
          kind: 'created',
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
      () => withTransaction(storage, (s) => s.driver.prepare("UPDATE events SET kind = 'x'").run()),
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
               VALUES ('evt-1', 'goal-1', 'x', '{}', '${`sha256:${'b'.repeat(64)}`}', 'principal-1', 'op-2', ${T0})`,
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
               VALUES ('evt-1', 'goal-1', 'x', '{}', '${`sha256:${'b'.repeat(64)}`}', 'principal-1', 'op-2', ${T0})
               ON CONFLICT(event_id) DO UPDATE SET kind = 'x'`,
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
    insertGoal(storage, { goalId: 'goal-1', revision: 0, status: 'open', updatedAtMicros: T0 })
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
    insertGoal(storage, { goalId: 'goal-1', revision: 0, status: 'open', updatedAtMicros: T0 })
    assert.throws(
      () => updateGoalRow(storage, 'goal-1', {}, { status: 'closed' }),
      (error: unknown) => {
        assert.ok(error instanceof StorageError)
        assert.equal(error.code, 'STORAGE_ARGUMENT_INVALID')
        return true
      },
    )
    const changed = updateGoalRow(storage, 'goal-1', { revision: 99 }, { status: 'closed' })
    assert.equal(changed, 0)
    assert.equal(getGoal(storage, 'goal-1')?.status, 'open')
  })
})

test('payload byte cap is a protocol error, never truncation', () => {
  withStorage((storage) => {
    insertGoal(storage, { goalId: 'goal-1', revision: 0, status: 'open', updatedAtMicros: T0 })
    // 65,536 bytes exactly passes; one byte more refuses.
    const atLimit = 'x'.repeat(65_536)
    insertEvent(storage, {
      eventId: 'evt-limit',
      goalId: 'goal-1',
      kind: 'created',
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
          kind: 'created',
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
    insertGoal(storage, { goalId: 'goal-1', revision: 0, status: 'open', updatedAtMicros: T0 })
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

test('a throwing transaction body rolls back every write', () => {
  withStorage((storage) => {
    insertGoal(storage, { goalId: 'goal-1', revision: 0, status: 'open', updatedAtMicros: T0 })
    assert.throws(() =>
      withTransaction(storage, (inner) => {
        insertEvent(inner, {
          eventId: 'evt-rollback',
          goalId: 'goal-1',
          kind: 'created',
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
