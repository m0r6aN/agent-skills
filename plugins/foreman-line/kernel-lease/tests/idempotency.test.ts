/**
 * L3 idempotency (P1-S09 literal) — hostile rows IDP-01..23 and the
 * replay-verbatim zero-delta assertions (risk (c); standing #32).
 */
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import {
  closeStorage,
  exportStorage,
  fixedClock,
  insertGoal,
  insertIdempotencyKey,
  insertLease,
  insertTransition,
  type OpenStorageConfig,
  openStorage,
  recordCompletedBinding,
  updateGoalRow,
} from '@foreman-line/kernel-state'
import {
  applyTransition,
  claimLease,
  createEngine,
  decideTransition,
  EngineError,
  releaseLease,
  renewLease,
  requestTransition,
} from '../src/index.js'
import { removeRoot } from './helpers/child-worker.js'

const T0 = 1_700_000_000_000_000
const FIXTURES = join(import.meta.dirname, 'fixtures')

interface FixtureRow {
  id: string
  op: string
  setup: {
    goal: { status: string; revision: number }
    lease: null | Record<string, unknown>
    transitions?: Array<{ transitionId: string; status: string; decidedAtMicros: number | null }>
    pendingTransitionId?: string | null
    bindingRow?: Record<string, unknown>
  }
  input: Record<string, unknown>
  expectedCode?: string
  expectedOutcome?: string
}

const parsedFixture: unknown = JSON.parse(
  readFileSync(join(FIXTURES, 'hostile', 'idempotency.json'), 'utf8'),
)
const fixtureTable = parsedFixture as { records: FixtureRow[] }
const IDP = fixtureTable.records

function configFor(root: string): OpenStorageConfig {
  return {
    storageRoot: root,
    databaseFileName: 'state.db',
    createIfMissing: true,
    clock: fixedClock(T0),
    backupPolicy: { root, retentionDescriptor: null },
  }
}

function seedRow(storage: ReturnType<typeof openStorage>, row: FixtureRow): void {
  insertGoal(storage, {
    goalId: 'goal-1',
    revision: row.setup.goal.revision,
    status: row.setup.goal.status,
    updatedAtMicros: T0,
  })
  if (row.setup.lease !== null && row.setup.lease !== undefined) {
    insertLease(storage, {
      goalId: 'goal-1',
      ...(row.setup.lease as object),
      acquiredAtMicros: T0 - 10,
    } as never)
  }
  for (const transition of row.setup.transitions ?? []) {
    insertTransition(storage, {
      transitionId: transition.transitionId,
      goalId: 'goal-1',
      status: transition.status,
      requestedBy: 'principal-a',
      operationId: `op-seed-${transition.transitionId}`,
      payloadDigest: `sha256:${'5e'.repeat(32)}`,
      createdAtMicros: T0 - 10,
      decidedAtMicros: transition.decidedAtMicros,
    })
  }
  // The goal's pending pointer FKs the transitions table: set it only once the
  // transition rows exist (an inline value at insertGoal time violates the FK).
  if (row.setup.pendingTransitionId != null) {
    updateGoalRow(
      storage,
      'goal-1',
      { revision: row.setup.goal.revision },
      { pendingTransitionId: row.setup.pendingTransitionId },
    )
  }
  if (row.setup.bindingRow !== undefined) {
    insertIdempotencyKey(storage, row.setup.bindingRow as never)
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

test('fixture inventory: 23 IDP rows with one pre-declared outcome each', () => {
  assert.equal(IDP.length, 23)
  const ids = new Set(IDP.map((row) => row.id))
  assert.equal(ids.size, IDP.length)
})

for (const row of IDP.filter((candidate) => candidate.expectedCode !== undefined)) {
  test(`${row.id} refuses exactly ${row.expectedCode}`, () => {
    const root = mkdtempSync(join(tmpdir(), 'fk-p10-idp-'))
    const storage = openStorage(configFor(root))
    try {
      seedRow(storage, row)
      const engine = createEngine({
        storage,
        clock: fixedClock(T0),
        toolVersion: 'kernel-lease-test',
      })
      assert.throws(
        () => runOp(engine, row.op, row.input),
        (error: unknown) => {
          assert.ok(error instanceof EngineError, `${row.id}: expected EngineError`)
          assert.equal(error.code, row.expectedCode)
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
}

function tableDeltas(
  before: ReturnType<typeof exportStorage>,
  after: ReturnType<typeof exportStorage>,
): Record<string, number> {
  const names = [
    'events',
    'goals',
    'transitions',
    'leases',
    'idempotency_keys',
    'projection_cursors',
  ] as const
  const deltas: Record<string, number> = {}
  for (const name of names) {
    deltas[name] =
      after.exportDocument.payload.tables[name].length -
      before.exportDocument.payload.tables[name].length
  }
  return deltas
}

for (const row of IDP.filter((candidate) => candidate.expectedOutcome === 'replay-verbatim')) {
  test(`${row.id} replay returns the recorded EffectResult verbatim with zero deltas`, () => {
    const root = mkdtempSync(join(tmpdir(), 'fk-p10-idp-'))
    const storage = openStorage(configFor(root))
    try {
      seedRow(storage, row)
      const engine = createEngine({
        storage,
        clock: fixedClock(T0),
        toolVersion: 'kernel-lease-test',
      })
      const first = runOp(engine, row.op, row.input) as {
        effect: unknown
        result: unknown
        replay: boolean
      }
      assert.equal(first.replay, false)
      const before = exportStorage(storage)
      const second = runOp(engine, row.op, row.input) as {
        effect: unknown
        result: unknown
        replay: boolean
      }
      const after = exportStorage(storage)
      assert.equal(second.replay, true, `${row.id}: replay flag`)
      // P1-S09 verbatim: the ORIGINAL EffectResult (same code, decision,
      // effectDigest, goalRevision as originally recorded).
      assert.deepEqual(second.effect, first.effect, `${row.id}: effect verbatim`)
      assert.deepEqual(second.result, first.result, `${row.id}: result verbatim`)
      // Asserted zero event/revision/cursor deltas and no repeated effects.
      const deltas = tableDeltas(before, after)
      assert.deepEqual(
        deltas,
        {
          events: 0,
          goals: 0,
          transitions: 0,
          leases: 0,
          idempotency_keys: 0,
          projection_cursors: 0,
        },
        `${row.id}: zero row deltas`,
      )
      assert.equal(
        after.exportDocument.payload.tables.goals[0]?.revision,
        before.exportDocument.payload.tables.goals[0]?.revision,
        `${row.id}: zero revision change`,
      )
      assert.equal(
        after.exportDocument.payload.tables.projection_cursors[0]?.last_applied_event_seq,
        before.exportDocument.payload.tables.projection_cursors[0]?.last_applied_event_seq,
        `${row.id}: zero cursor movement`,
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
}

test('R5: replay returns the recorded outcome VERBATIM across an intervening revision change', () => {
  const root = mkdtempSync(join(tmpdir(), 'fk-p10-idp-'))
  const storage = openStorage(configFor(root))
  try {
    insertGoal(storage, { goalId: 'goal-1', revision: 0, status: 'active', updatedAtMicros: T0 })
    const engine = createEngine({
      storage,
      clock: fixedClock(T0),
      toolVersion: 'kernel-lease-test',
    })
    const bind = (op: string, digest: string) => ({
      principalRef: 'principal-a',
      operationId: op,
      repositoryRef: 'repo-1',
      worktreeRef: 'wt-1',
      payloadDigest: `sha256:${digest}`,
    })
    const first = claimLease(engine, {
      goalId: 'goal-1',
      leaseId: 'lease-1',
      durationMicros: 5_000_000,
      expectedRevision: 0,
      idempotencyKey: bind('r5-claim', '11'.repeat(32)),
    })
    // Intervening revision-bumping operation (renew bumps to revision 2).
    const renewed = renewLease(engine, {
      goalId: 'goal-1',
      leaseId: 'lease-1',
      durationMicros: 5_000_000,
      expectedRevision: 1,
      idempotencyKey: bind('r5-renew', '22'.repeat(32)),
    })
    assert.equal(renewed.effect.goalRevision, 2)
    const replay = claimLease(engine, {
      goalId: 'goal-1',
      leaseId: 'lease-1',
      durationMicros: 5_000_000,
      expectedRevision: 0,
      idempotencyKey: bind('r5-claim', '11'.repeat(32)),
    })
    assert.equal(replay.replay, true)
    // VERBATIM against the originally captured values — including
    // goalRevision as ORIGINALLY recorded (1), never the current revision (2).
    assert.deepEqual(replay.effect, first.effect, 'effect verbatim across intervening change')
    assert.deepEqual(replay.result, first.result, 'result verbatim across intervening change')
    assert.equal(replay.effect.goalRevision, 1)
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

test('IDP precedence: same-key/different-payload conflicts even for an in-flight record shape', () => {
  // T6's conflict rule is "regardless of completion state": a completed row
  // with a different digest conflicts before any completion logic runs.
  const row = IDP.find((candidate) => candidate.id === 'IDP-01')
  assert.ok(row)
  const root = mkdtempSync(join(tmpdir(), 'fk-p10-idp-'))
  const storage = openStorage(configFor(root))
  try {
    seedRow(storage, row)
    const engine = createEngine({
      storage,
      clock: fixedClock(T0),
      toolVersion: 'kernel-lease-test',
    })
    assert.throws(
      () => runOp(engine, row.op, row.input),
      (error: unknown) => {
        assert.ok(error instanceof EngineError)
        assert.equal(error.code, 'IDEMPOTENCY_CONFLICT')
        assert.deepEqual(error.diagnostic, {
          principalRef: 'principal-a',
          operationId: 'op-idp-01',
        })
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

test('a refused operation records no binding row (a refusal is not an effect)', () => {
  const root = mkdtempSync(join(tmpdir(), 'fk-p10-idp-'))
  const storage = openStorage(configFor(root))
  try {
    insertGoal(storage, { goalId: 'goal-1', revision: 0, status: 'active', updatedAtMicros: T0 })
    const engine = createEngine({
      storage,
      clock: fixedClock(T0),
      toolVersion: 'kernel-lease-test',
    })
    assert.throws(() =>
      claimLease(engine, {
        goalId: 'goal-1',
        leaseId: 'lease-1',
        durationMicros: 0,
        expectedRevision: 0,
        idempotencyKey: {
          principalRef: 'principal-a',
          operationId: 'op-refusal',
          repositoryRef: 'repo-1',
          worktreeRef: 'wt-1',
          payloadDigest: `sha256:${'0f'.repeat(32)}`,
        },
      }),
    )
    const snapshot = exportStorage(storage)
    assert.equal(snapshot.exportDocument.payload.tables.idempotency_keys.length, 0)
    // The same binding may legitimately retry and succeed once conditions change.
    const retry = claimLease(engine, {
      goalId: 'goal-1',
      leaseId: 'lease-1',
      durationMicros: 5_000_000,
      expectedRevision: 0,
      idempotencyKey: {
        principalRef: 'principal-a',
        operationId: 'op-refusal',
        repositoryRef: 'repo-1',
        worktreeRef: 'wt-1',
        payloadDigest: `sha256:${'0f'.repeat(32)}`,
      },
    })
    assert.equal(retry.effect.code, 'EFFECT_APPLIED')
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

test('malformed persisted outcomes fail closed before replay', () => {
  const root = mkdtempSync(join(tmpdir(), 'fk-p10-idp-'))
  const storage = openStorage(configFor(root))
  const binding = {
    principalRef: 'principal-a',
    repositoryRef: 'repo-a',
    worktreeRef: 'worktree-a',
    payloadDigest: `sha256:${'0f'.repeat(32)}`,
  }
  const rowDigest = `sha256:${'a'.repeat(64)}`
  const otherDigest = `sha256:${'b'.repeat(64)}`
  const malformedCases = [
    {
      name: 'missing result member',
      operationId: 'op-corrupt-missing-result',
      rowEffectDigest: null,
      corruption: 'missing-result',
    },
    {
      name: 'missing EffectResult member',
      operationId: 'op-corrupt-missing-effect-member',
      rowEffectDigest: null,
      corruption: 'missing-tool-version',
    },
    {
      name: 'idempotency key does not match the binding row',
      operationId: 'op-corrupt-key-mismatch',
      rowEffectDigest: null,
      corruption: 'binding-mismatch',
    },
    {
      name: 'effect digest does not match the binding row',
      operationId: 'op-corrupt-digest-mismatch',
      rowEffectDigest: rowDigest,
      corruption: 'digest-mismatch',
    },
    {
      name: 'unexpected outcome member',
      operationId: 'op-corrupt-extra-member',
      rowEffectDigest: null,
      corruption: 'extra-member',
    },
  ] as const

  try {
    const engine = createEngine({
      storage,
      clock: fixedClock(T0),
      toolVersion: 'kernel-lease-test',
    })
    const encoder = new TextEncoder()
    for (const testCase of malformedCases) {
      const idempotencyKey = { ...binding, operationId: testCase.operationId }
      const effect: Record<string, unknown> = {
        resultKind: 'effect-result',
        apiVersion: '0.1.0',
        toolVersion: 'kernel-lease-test',
        decision: 'NOOP',
        code: 'EFFECT_NOOP',
        idempotencyKey,
        effectDigest: null,
        goalRevision: 0,
      }
      const outcome: Record<string, unknown> = { effect, result: {} }
      switch (testCase.corruption) {
        case 'missing-result':
          delete outcome.result
          break
        case 'missing-tool-version':
          delete effect.toolVersion
          break
        case 'binding-mismatch':
          effect.idempotencyKey = { ...idempotencyKey, operationId: 'different-operation' }
          break
        case 'digest-mismatch':
          effect.effectDigest = otherDigest
          effect.decision = 'APPLIED'
          effect.code = 'EFFECT_APPLIED'
          break
        case 'extra-member':
          outcome.unexpected = true
          break
      }
      recordCompletedBinding(storage, {
        ...idempotencyKey,
        effectDigest: testCase.rowEffectDigest,
        recordedResult: encoder.encode(JSON.stringify(outcome)),
        recordedAtMicros: T0,
        completedAtMicros: T0 + 1,
      })
      const before = exportStorage(storage)
      assert.throws(
        () =>
          claimLease(engine, {
            goalId: 'goal-1',
            leaseId: 'lease-1',
            durationMicros: 1_000_000,
            expectedRevision: 0,
            idempotencyKey,
          }),
        (error: unknown) => {
          assert.ok(error instanceof EngineError, testCase.name)
          assert.equal(error.code, 'STORAGE_FAILURE', testCase.name)
          assert.deepEqual(error.diagnostic, { storageCode: 'STORAGE_IO_FAILURE' }, testCase.name)
          return true
        },
      )
      assert.deepEqual(
        tableDeltas(before, exportStorage(storage)),
        {
          events: 0,
          goals: 0,
          transitions: 0,
          leases: 0,
          idempotency_keys: 0,
          projection_cursors: 0,
        },
        testCase.name,
      )
    }
  } finally {
    try {
      closeStorage(storage)
    } catch {
      // Best-effort close; cleanup proceeds.
    }
    removeRoot(root)
  }
})
