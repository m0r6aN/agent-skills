/**
 * L2 transitions + CAS — hostile rows TR-01..09, the F05.11 effect schema
 * check (AC9), and the L3 stop-report record.
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
  insertTransition,
  type OpenStorageConfig,
  openStorage,
  updateGoalRow,
} from '@foreman-line/kernel-state'
import {
  applyTransition,
  claimLease,
  createEngine,
  decideTransition,
  EngineError,
  type EngineResult,
  requestTransition,
} from '../src/index.js'

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
  }
  input: Record<string, unknown>
  expectedCode: string
}

const parsedFixture: unknown = JSON.parse(
  readFileSync(join(FIXTURES, 'hostile', 'transitions.json'), 'utf8'),
)
const fixtureTable = parsedFixture as { records: FixtureRow[] }
const ROWS = fixtureTable.records
const TR = ROWS.filter((row) => row.id.startsWith('TR-'))

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
  const root = mkdtempSync(join(tmpdir(), 'fk-p10-tr-'))
  const storage = openStorage(configFor(root))
  const seedGoalId = row.input.goalId === 'goal-absent' ? 'goal-1' : (row.input.goalId as string)
  try {
    insertGoal(storage, {
      goalId: seedGoalId,
      revision: row.setup.goal.revision,
      status: row.setup.goal.status,
      updatedAtMicros: T0,
    })
    if (row.setup.lease !== null && row.setup.lease !== undefined) {
      insertLease(storage, {
        goalId: seedGoalId,
        ...(row.setup.lease as object),
        acquiredAtMicros: T0 - 10,
      } as never)
    }
    for (const transition of row.setup.transitions ?? []) {
      insertTransition(storage, {
        transitionId: transition.transitionId,
        goalId: seedGoalId,
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
        seedGoalId,
        { revision: row.setup.goal.revision },
        { pendingTransitionId: row.setup.pendingTransitionId },
      )
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

test('fixture inventory: 9 TR rows with one pre-declared outcome each', () => {
  assert.equal(TR.length, 9)
  const ids = new Set(ROWS.map((row) => row.id))
  assert.equal(ids.size, ROWS.length)
})

for (const row of TR) {
  test(`${row.id} refuses exactly ${row.expectedCode}`, () => {
    withSeeded(row, (engine) => {
      assert.throws(
        () => runOp(engine, row.op, row.input),
        (error: unknown) => {
          assert.ok(error instanceof EngineError, `${row.id}: expected EngineError`)
          assert.equal(error.code, row.expectedCode)
          return true
        },
      )
    })
  })
}

// --- F05.11 schema conformance (AC9): a minimal draft-07 checker over the
// shipped schema document, asserting the effect member byte-shape.

interface SchemaNode {
  type?: string
  const?: unknown
  enum?: unknown[]
  pattern?: string
  required?: string[]
  additionalProperties?: boolean
  properties?: Record<string, SchemaNode>
  $defs?: Record<string, SchemaNode>
  $ref?: string
  allOf?: SchemaNode[]
  if?: SchemaNode
  then?: SchemaNode
  oneOf?: SchemaNode[]
  minimum?: number
  maximum?: number
  minLength?: number
  maxLength?: number
}

function validateAgainst(node: SchemaNode, value: unknown, root: SchemaNode): string[] {
  const failures: string[] = []
  if (node.$ref !== undefined) {
    const name = node.$ref.replace('#/$defs/', '')
    const target = node.$defs?.[name] ?? root.$defs?.[name]
    assert.ok(target, `unresolved schema ref ${node.$ref}`)
    return validateAgainst(target, value, root)
  }
  if (node.const !== undefined && value !== node.const) failures.push(`const ${String(node.const)}`)
  if (node.enum !== undefined && !node.enum.includes(value)) failures.push('enum')
  if (node.type === 'object') {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      failures.push('type object')
      return failures
    }
    const record = value as Record<string, unknown>
    for (const key of node.required ?? []) {
      if (!(key in record)) failures.push(`missing ${key}`)
    }
    if (node.additionalProperties === false) {
      for (const key of Object.keys(record)) {
        if (!(node.properties !== undefined && key in node.properties)) {
          failures.push(`unknown ${key}`)
        }
      }
    }
    for (const [key, propertySchema] of Object.entries(node.properties ?? {})) {
      if (key in record) {
        failures.push(...validateAgainst(propertySchema, record[key], root))
      }
    }
  }
  if (node.type === 'string' && typeof value !== 'string') failures.push('type string')
  if (
    typeof value === 'string' &&
    node.pattern !== undefined &&
    !new RegExp(node.pattern).test(value)
  ) {
    failures.push(`pattern ${node.pattern}`)
  }
  if (typeof value === 'string' && node.minLength !== undefined && value.length < node.minLength) {
    failures.push('minLength')
  }
  if (typeof value === 'string' && node.maxLength !== undefined && value.length > node.maxLength) {
    failures.push('maxLength')
  }
  if (node.type === 'integer' && (typeof value !== 'number' || !Number.isSafeInteger(value))) {
    failures.push('type integer')
  }
  if (typeof value === 'number') {
    if (node.minimum !== undefined && value < node.minimum) failures.push('minimum')
    if (node.maximum !== undefined && value > node.maximum) failures.push('maximum')
  }
  if (node.type === 'null' && value !== null) failures.push('type null')
  if (node.oneOf !== undefined) {
    const matched = node.oneOf.some((option) => validateAgainst(option, value, root).length === 0)
    if (!matched) failures.push('oneOf')
  }
  return failures
}

function validateEffect(schemaText: string, effect: unknown): string[] {
  const parsed: unknown = JSON.parse(schemaText)
  const root = parsed as SchemaNode
  const failures = validateAgainst(root, effect, root)
  for (const clause of root.allOf ?? []) {
    const condition = clause.if as SchemaNode
    const consequent = clause.then as SchemaNode
    const record = effect as Record<string, unknown>
    const probe = validateAgainst({ ...condition, type: 'object' }, record, root)
    if (probe.length === 0) {
      failures.push(
        ...validateAgainst(
          { ...consequent, type: 'object', additionalProperties: true },
          record,
          root,
        ),
      )
    }
  }
  return failures
}

test('AC9: every emitted effect validates against schemas/effect-result.schema.json', () => {
  const schemaText = readFileSync(
    join(FIXTURES, '..', '..', 'schemas', 'effect-result.schema.json'),
    'utf8',
  )
  const root = mkdtempSync(join(tmpdir(), 'fk-p10-tr-'))
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
      idempotencyKey: bind('op-schema-1'),
    })
    assert.deepEqual(validateEffect(schemaText, claimed.effect), [])
    const noop = claimLease(engine, {
      goalId: 'goal-1',
      leaseId: 'lease-2',
      durationMicros: 5_000_000,
      expectedRevision: 1,
      idempotencyKey: bind('op-schema-2'),
    })
    assert.deepEqual(validateEffect(schemaText, noop.effect), [])
    const applied = applyTransition(engine, {
      goalId: 'goal-1',
      targetStatus: 'awaiting-human',
      expectedRevision: 1,
      idempotencyKey: bind('op-schema-3'),
    })
    assert.deepEqual(validateEffect(schemaText, applied.effect), [])
    // The pairing invariant: a decision/code mismatch fails the schema.
    const broken = { ...applied.effect, code: 'EFFECT_NOOP' }
    assert.ok(validateEffect(schemaText, broken).length > 0)
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

test('L3 record: a transition toward awaiting-human carries the F05.8 stop-report obligation shape', () => {
  const root = mkdtempSync(join(tmpdir(), 'fk-p10-tr-'))
  const storage = openStorage(configFor(root))
  try {
    insertGoal(storage, { goalId: 'goal-1', revision: 0, status: 'active', updatedAtMicros: T0 })
    insertLease(storage, {
      leaseId: 'lease-1',
      goalId: 'goal-1',
      ownerPrincipalRef: 'principal-a',
      casRevision: 0,
      acquiredAtMicros: T0 - 10,
      expiresAtMicros: T0 + 60_000_000,
      releasedAtMicros: null,
    })
    const engine = createEngine({
      storage,
      clock: fixedClock(T0),
      toolVersion: 'kernel-lease-test',
    })
    requestTransition(engine, {
      goalId: 'goal-1',
      targetStatus: 'awaiting-human',
      expectedRevision: 0,
      idempotencyKey: {
        principalRef: 'principal-a',
        operationId: 'op-l3-request',
        repositoryRef: 'repo-1',
        worktreeRef: 'wt-1',
        payloadDigest: `sha256:${'33'.repeat(32)}`,
      },
    })
    const snapshot = exportStorage(storage)
    const event = snapshot.exportDocument.payload.tables.events[0]
    assert.ok(event)
    const payload: unknown = JSON.parse(event.payload as string)
    const record = payload as Record<string, unknown>
    const stopReport = record.stopReport as Record<string, unknown>
    assert.equal(stopReport.kind, 'stop-report-emission')
    assert.equal(stopReport.awaitingHuman, true)
    assert.equal(typeof stopReport.transitionDescription, 'string')
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

test('decide re-validates the edge from the CURRENT status at decide time (scenario-7 shape)', () => {
  const root = mkdtempSync(join(tmpdir(), 'fk-p10-tr-'))
  const storage = openStorage(configFor(root))
  try {
    insertGoal(storage, {
      goalId: 'goal-1',
      revision: 2,
      status: 'awaiting-human',
      updatedAtMicros: T0,
    })
    insertLease(storage, {
      leaseId: 'lease-1',
      goalId: 'goal-1',
      ownerPrincipalRef: 'principal-a',
      casRevision: 2,
      acquiredAtMicros: T0 - 10,
      expiresAtMicros: T0 + 5_000_000,
      releasedAtMicros: null,
    })
    insertTransition(storage, {
      transitionId: 'tr-1',
      goalId: 'goal-1',
      status: 'completed',
      requestedBy: 'principal-a',
      operationId: 'op-seed-tr1',
      payloadDigest: `sha256:${'5e'.repeat(32)}`,
      createdAtMicros: T0 - 10,
      decidedAtMicros: null,
    })
    // The goal's pending pointer FKs the transitions table: set it only once
    // the transition row exists (an inline value at insertGoal violates the FK).
    updateGoalRow(storage, 'goal-1', { goalId: 'goal-1' }, { pendingTransitionId: 'tr-1' })
    const engine = createEngine({
      storage,
      clock: fixedClock(T0),
      toolVersion: 'kernel-lease-test',
    })
    // active→completed (L4) was legal when requested; awaiting-human→completed
    // (X08) is illegal from the current status.
    assert.throws(
      () =>
        decideTransition(engine, {
          goalId: 'goal-1',
          transitionId: 'tr-1',
          decision: 'apply',
          gateEvidenceRefs: [
            {
              evidenceKind: 'commit-ref',
              gitIdentity: 'HEAD',
              digest: `sha256:${'11'.repeat(32)}`,
            },
          ],
          expectedRevision: 2,
          idempotencyKey: {
            principalRef: 'principal-a',
            operationId: 'op-revalidate',
            repositoryRef: 'repo-1',
            worktreeRef: 'wt-1',
            payloadDigest: `sha256:${'77'.repeat(32)}`,
          },
        }),
      (error: unknown) => {
        assert.ok(error instanceof EngineError)
        assert.equal(error.code, 'ILLEGAL_TRANSITION')
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

test('decide reject records transition.rejected and leaves status unchanged', () => {
  const root = mkdtempSync(join(tmpdir(), 'fk-p10-tr-'))
  const storage = openStorage(configFor(root))
  try {
    insertGoal(storage, {
      goalId: 'goal-1',
      revision: 1,
      status: 'active',
      updatedAtMicros: T0,
    })
    insertLease(storage, {
      leaseId: 'lease-1',
      goalId: 'goal-1',
      ownerPrincipalRef: 'principal-a',
      casRevision: 1,
      acquiredAtMicros: T0 - 10,
      expiresAtMicros: T0 + 5_000_000,
      releasedAtMicros: null,
    })
    insertTransition(storage, {
      transitionId: 'tr-1',
      goalId: 'goal-1',
      status: 'cancelled',
      requestedBy: 'principal-a',
      operationId: 'op-seed-tr1',
      payloadDigest: `sha256:${'5e'.repeat(32)}`,
      createdAtMicros: T0 - 10,
      decidedAtMicros: null,
    })
    // The goal's pending pointer FKs the transitions table: set it only once
    // the transition row exists (an inline value at insertGoal violates the FK).
    updateGoalRow(storage, 'goal-1', { goalId: 'goal-1' }, { pendingTransitionId: 'tr-1' })
    const engine = createEngine({
      storage,
      clock: fixedClock(T0),
      toolVersion: 'kernel-lease-test',
    })
    const result = decideTransition(engine, {
      goalId: 'goal-1',
      transitionId: 'tr-1',
      decision: 'reject',
      expectedRevision: 1,
      idempotencyKey: {
        principalRef: 'principal-a',
        operationId: 'op-reject-1',
        repositoryRef: 'repo-1',
        worktreeRef: 'wt-1',
        payloadDigest: `sha256:${'88'.repeat(32)}`,
      },
    })
    assert.equal(result.effect.code, 'EFFECT_APPLIED')
    const snapshot = exportStorage(storage)
    assert.equal(snapshot.exportDocument.payload.tables.goals[0]?.status, 'active')
    assert.equal(snapshot.exportDocument.payload.tables.goals[0]?.pending_transition_id, null)
    assert.equal(snapshot.exportDocument.payload.tables.events[0]?.kind, 'transition.rejected')
    assert.equal(snapshot.exportDocument.payload.tables.transitions[0]?.decided_at_micros, T0)
    void (result as EngineResult<unknown>)
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
