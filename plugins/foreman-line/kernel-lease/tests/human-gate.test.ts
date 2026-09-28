/**
 * L4 human-gate writes (D9 evidence-derived, never ordinary state) — hostile
 * rows GTW-01..12 and the AC6 residual statement check.
 */
import assert from 'node:assert/strict'
import { readFileSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import {
  closeStorage,
  exportStorage,
  fixedClock,
  insertGoal,
  insertLease,
  insertTransition,
  openStorage,
  type OpenStorageConfig,
  type Storage,
  updateGoalRow,
} from '@foreman-line/kernel-state'
import {
  applyTransition,
  createEngine,
  decideTransition,
  EngineError,
  getGoalState,
} from '../src/index.js'

const T0 = 1_700_000_000_000_000
const FIXTURES = join(import.meta.dirname, 'fixtures')

interface FixtureRow {
  id: string
  op: string
  setup: {
    goal?: { status: string; revision: number }
    lease?: null | Record<string, unknown>
    transitions?: Array<{ transitionId: string; status: string; decidedAtMicros: number | null }>
    pendingTransitionId?: string | null
    engine?: { evidenceKindPolicy?: Record<string, string[]> }
  }
  input: Record<string, unknown>
  expectedCode: string
}

const parsedFixture: unknown = JSON.parse(
  readFileSync(join(FIXTURES, 'hostile', 'gate-writes.json'), 'utf8'),
)
const fixtureTable = parsedFixture as { records: FixtureRow[] }
const GTW = fixtureTable.records

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

test('fixture inventory: 12 GTW rows with unique ids', () => {
  assert.equal(GTW.length, 12)
  const ids = new Set(GTW.map((row) => row.id))
  assert.equal(ids.size, GTW.length)
})

for (const row of GTW.filter(
  (candidate) => candidate.op !== 'createEngine' && candidate.op !== 'getGoalState',
)) {
  test(`${row.id} refuses exactly ${row.expectedCode}`, () => {
    const root = mkdtempSync(join(tmpdir(), 'fk-p10-gtw-'))
    const storage = openStorage(configFor(root))
    try {
      const goal = row.setup.goal ?? { status: 'active', revision: 0 }
      insertGoal(storage, {
        goalId: 'goal-1',
        revision: goal.revision,
        status: goal.status,
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
      // The goal's pending pointer FKs the transitions table: set it only once
      // the transition rows exist (an inline value at insertGoal violates the FK).
      if (row.setup.pendingTransitionId != null) {
        updateGoalRow(
          storage,
          'goal-1',
          { revision: goal.revision },
          { pendingTransitionId: row.setup.pendingTransitionId },
        )
      }
      const engine = createEngine({
        storage,
        clock: fixedClock(T0),
        toolVersion: 'kernel-lease-test',
        evidenceKindPolicy: row.setup.engine?.evidenceKindPolicy as never,
      })
      assert.throws(
        () =>
          row.op === 'decideTransition'
            ? decideTransition(engine, row.input as never)
            : applyTransition(engine, row.input as never),
        (error: unknown) => {
          assert.ok(error instanceof EngineError, `${row.id}: expected EngineError`)
          assert.equal(error.code, row.expectedCode)
          return true
        },
      )
    } finally {
      // Close BEFORE cleanup: an open SQLite handle locks the tree on Windows
      // and turns rmSync's EPERM into the reported failure, masking the real one.
      try {
        closeStorage(storage)
      } catch {
        // Best-effort close; cleanup proceeds.
      }
      rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 })
    }
  })
}

test('GTW-10 substrate-seeded gate-ish status refuses on read (defense in depth)', () => {
  const row = GTW.find((candidate) => candidate.id === 'GTW-10')
  assert.ok(row)
  const root = mkdtempSync(join(tmpdir(), 'fk-p10-gtw-'))
  const storage = openStorage(configFor(root))
  try {
    // FK-P9's DB-level status CHECK (A1a) makes an out-of-vocabulary status
    // row unwritable; the engine's read-path refusal (T1 defense in depth) is
    // exercised by poisoning the row at the driver boundary (standing #2).
    insertGoal(storage, { goalId: 'goal-1', revision: 0, status: 'active', updatedAtMicros: T0 })
    const engine = createEngine({
      storage: poisonGoalStatus(storage, 'goal-1', 'gate.satisfied'),
      clock: fixedClock(T0),
      toolVersion: 'kernel-lease-test',
    })
    assert.throws(
      () => getGoalState(engine, row.input.goalId),
      (error: unknown) => {
        assert.ok(error instanceof EngineError)
        assert.equal(error.code, 'GOAL_STATUS_UNKNOWN')
        return true
      },
    )
  } finally {
    // Close BEFORE cleanup: an open SQLite handle locks the tree on Windows
    // and turns rmSync's EPERM into the reported failure, masking the real one.
    try {
      closeStorage(storage)
    } catch {
      // Best-effort close; cleanup proceeds.
    }
    rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 })
  }
})

test('GTW-11 a wider-than-ceiling consumer policy refuses at construction', () => {
  const row = GTW.find((candidate) => candidate.id === 'GTW-11')
  assert.ok(row)
  const root = mkdtempSync(join(tmpdir(), 'fk-p10-gtw-'))
  const storage = openStorage(configFor(root))
  try {
    assert.throws(
      () =>
        createEngine({
          storage,
          clock: fixedClock(T0),
          toolVersion: 'kernel-lease-test',
          evidenceKindPolicy: row.input.evidenceKindPolicy as never,
        }),
      (error: unknown) => {
        assert.ok(error instanceof EngineError)
        assert.equal(error.code, 'ENGINE_ARGUMENT_INVALID')
        return true
      },
    )
  } finally {
    // Close BEFORE cleanup: an open SQLite handle locks the tree on Windows
    // and turns rmSync's EPERM into the reported failure, masking the real one.
    try {
      closeStorage(storage)
    } catch {
      // Best-effort close; cleanup proceeds.
    }
    rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 })
  }
})

test('AC6: supplied refs are bound into the recorded event (satisfaction derivable, never asserted)', () => {
  const root = mkdtempSync(join(tmpdir(), 'fk-p10-gtw-'))
  const storage = openStorage(configFor(root))
  try {
    insertGoal(storage, { goalId: 'goal-1', revision: 0, status: 'active', updatedAtMicros: T0 })
    insertLease(storage, {
      leaseId: 'lease-1',
      goalId: 'goal-1',
      ownerPrincipalRef: 'principal-a',
      casRevision: 0,
      acquiredAtMicros: T0 - 10,
      expiresAtMicros: T0 + 5_000_000,
      releasedAtMicros: null,
    })
    const engine = createEngine({ storage, clock: fixedClock(T0), toolVersion: 'kernel-lease-test' })
    const refs = [
      { evidenceKind: 'commit-ref', gitIdentity: 'HEAD', digest: `sha256:${'11'.repeat(32)}` },
      { evidenceKind: 'signature', gitIdentity: 'sig-abc', digest: `sha256:${'22'.repeat(32)}` },
    ]
    const result = applyTransition(engine, {
      goalId: 'goal-1',
      targetStatus: 'completed',
      gateEvidenceRefs: refs,
      expectedRevision: 0,
      idempotencyKey: {
        principalRef: 'principal-a',
        operationId: 'op-ac6',
        repositoryRef: 'repo-1',
        worktreeRef: 'wt-1',
        payloadDigest: `sha256:${'66'.repeat(32)}`,
      },
    })
    assert.equal(result.effect.code, 'EFFECT_APPLIED')
    const snapshot = exportStorage(storage)
    const event = snapshot.exportDocument.payload.tables.events[0]
    assert.ok(event)
    const payload: unknown = JSON.parse(event.payload as string)
    const record = payload as Record<string, unknown>
    assert.deepEqual(record.gateEvidenceRefs, refs)
  } finally {
    // Close BEFORE cleanup: an open SQLite handle locks the tree on Windows
    // and turns rmSync's EPERM into the reported failure, masking the real one.
    try {
      closeStorage(storage)
    } catch {
      // Best-effort close; cleanup proceeds.
    }
    rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 })
  }
})

test('AC6 residual statement is present and no genuineness claim exists in shipped text', () => {
  const readme = readFileSync(join(FIXTURES, '..', 'README.md'), 'utf8')
  assert.match(readme, /fabricated/i)
  assert.match(readme, /BY DESIGN/i)
  // The claim-honesty sweep: shipped text never claims refs are verified genuine.
  const banned = ['verified genuine', 'genuineness verified', 'gate verified', 'gate verification passed']
  for (const phrase of banned) {
    assert.ok(!readme.toLowerCase().includes(phrase), `README must not claim: ${phrase}`)
  }
})

test('gate rejection does not write anything (a refusal is not an effect)', () => {
  const root = mkdtempSync(join(tmpdir(), 'fk-p10-gtw-'))
  const storage = openStorage(configFor(root))
  try {
    insertGoal(storage, { goalId: 'goal-1', revision: 0, status: 'active', updatedAtMicros: T0 })
    insertLease(storage, {
      leaseId: 'lease-1',
      goalId: 'goal-1',
      ownerPrincipalRef: 'principal-a',
      casRevision: 0,
      acquiredAtMicros: T0 - 10,
      expiresAtMicros: T0 + 5_000_000,
      releasedAtMicros: null,
    })
    const engine = createEngine({ storage, clock: fixedClock(T0), toolVersion: 'kernel-lease-test' })
    assert.throws(() =>
      applyTransition(engine, {
        goalId: 'goal-1',
        targetStatus: 'completed',
        expectedRevision: 0,
        idempotencyKey: {
          principalRef: 'principal-a',
          operationId: 'op-gate-refusal',
          repositoryRef: 'repo-1',
          worktreeRef: 'wt-1',
          payloadDigest: `sha256:${'44'.repeat(32)}`,
        },
      }),
    )
    const snapshot = exportStorage(storage)
    assert.equal(snapshot.exportDocument.payload.tables.events.length, 0)
    assert.equal(snapshot.exportDocument.payload.tables.transitions.length, 0)
    assert.equal(snapshot.exportDocument.payload.tables.goals[0]?.revision, 0)
    assert.equal(snapshot.exportDocument.payload.tables.idempotency_keys.length, 0)
  } finally {
    // Close BEFORE cleanup: an open SQLite handle locks the tree on Windows
    // and turns rmSync's EPERM into the reported failure, masking the real one.
    try {
      closeStorage(storage)
    } catch {
      // Best-effort close; cleanup proceeds.
    }
    rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 })
  }
})
