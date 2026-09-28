/**
 * AC1/AC14 state-machine exhaustiveness — the fixture inventory map, the
 * 25-edge product map, the X01–X18 illegal-edge rows, and the CTL-01..07
 * legal-edge controls (T2 bound to one source: src/state-machine.ts).
 */
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { removeRoot } from './helpers/child-worker.js'
import {
  closeStorage,
  fixedClock,
  insertGoal,
  insertLease,
  type OpenStorageConfig,
  openStorage,
} from '@foreman-line/kernel-state'
import {
  applyTransition,
  createEngine,
  EDGES,
  EngineError,
  EVIDENCE_KINDS,
  GOAL_STATUSES,
  type GoalStatus,
} from '../src/index.js'

const T0 = 1_700_000_000_000_000
const FIXTURES = join(import.meta.dirname, 'fixtures')

interface FixtureRow {
  id: string
  op: string
  setup: {
    goal: { status: string; revision: number }
    lease: null | Record<string, unknown>
  }
  input: Record<string, unknown>
  expectedCode?: string
  expectedOutcome?: string
  edgeId?: string
}

function loadTable(relative: string): FixtureRow[] {
  const parsed: unknown = JSON.parse(readFileSync(join(FIXTURES, relative), 'utf8'))
  const table = parsed as { records: FixtureRow[] }
  return table.records
}

const LEASES_TABLE = loadTable('hostile/leases.json')
const TRANSITIONS_TABLE = loadTable('hostile/transitions.json')
const IDEMPOTENCY_TABLE = loadTable('hostile/idempotency.json')
const GATE_TABLE = loadTable('hostile/gate-writes.json')
const CLOCK_TABLE = loadTable('hostile/clock.json')
const CONCURRENCY_TABLE = loadTable('hostile/concurrency.json')
const CRASH_TABLE = loadTable('hostile/crash.json')
const CONTROLS_TABLE = loadTable('controls.json')
const ALL_TABLES: Array<[string, FixtureRow[]]> = [
  ['hostile/leases.json', LEASES_TABLE],
  ['hostile/transitions.json', TRANSITIONS_TABLE],
  ['hostile/idempotency.json', IDEMPOTENCY_TABLE],
  ['hostile/gate-writes.json', GATE_TABLE],
  ['hostile/clock.json', CLOCK_TABLE],
  ['hostile/concurrency.json', CONCURRENCY_TABLE],
  ['hostile/crash.json', CRASH_TABLE],
  ['controls.json', CONTROLS_TABLE],
]
const CANONICAL = loadTable('canonical/encoder-vectors.json')
const X_ROWS = TRANSITIONS_TABLE.filter((row) => /^X\d\d$/.test(row.id))
const CTL_ROWS = CONTROLS_TABLE.filter((row) => row.edgeId !== undefined)

function configFor(root: string): OpenStorageConfig {
  return {
    storageRoot: root,
    databaseFileName: 'state.db',
    createIfMissing: true,
    clock: fixedClock(T0),
    backupPolicy: { root, retentionDescriptor: null },
  }
}

test('AC14 inventory map: exactly 112 fixture records = 94 hostile + 10 controls + 8 canonical', () => {
  const hostileTables = [
    LEASES_TABLE,
    TRANSITIONS_TABLE,
    IDEMPOTENCY_TABLE,
    GATE_TABLE,
    CLOCK_TABLE,
    CONCURRENCY_TABLE,
    CRASH_TABLE,
  ]
  const hostileCounts = hostileTables.map((rows) => rows.length)
  const hostile = hostileCounts.reduce((sum, count) => sum + count, 0)
  assert.equal(hostile, 94, `hostile rows: ${hostileCounts.join('+')}`)
  assert.equal(CONTROLS_TABLE.length, 10)
  assert.equal(CANONICAL.length, 8)
  assert.equal(hostile + 10 + 8, 112)
  // One pre-declared outcome per row; ids unique within and across tables.
  const seen = new Set<string>()
  for (const [table, rows] of ALL_TABLES) {
    for (const row of rows) {
      const outcome = row.expectedCode ?? row.expectedOutcome
      assert.ok(outcome !== undefined, `${table}:${row.id} lacks a pre-declared outcome`)
      assert.ok(!seen.has(row.id), `duplicate fixture id ${row.id}`)
      seen.add(row.id)
    }
  }
  for (const row of CANONICAL) {
    assert.ok(!seen.has(row.id))
    seen.add(row.id)
  }
})

test('AC1: the 25-edge product is complete and single-sourced in state-machine.ts', () => {
  assert.equal(EDGES.length, 25)
  const seen = new Set<string>()
  for (const edge of EDGES) {
    assert.ok(!seen.has(edge.edgeId), `duplicate edge id ${edge.edgeId}`)
    seen.add(edge.edgeId)
  }
  for (const from of GOAL_STATUSES) {
    for (const to of GOAL_STATUSES) {
      const match = EDGES.find((edge) => edge.from === from && edge.to === to)
      assert.ok(match, `missing edge ${from}->${to}`)
    }
  }
  const legal = EDGES.filter((edge) => edge.verdict === 'LEGAL')
  const illegal = EDGES.filter((edge) => edge.verdict === 'ILLEGAL')
  assert.equal(legal.length, 7)
  assert.equal(illegal.length, 18)
  assert.deepEqual(
    legal.filter((edge) => edge.mode === 'gate').map((edge) => edge.edgeId),
    ['L4', 'L6'],
  )
  for (const edge of legal) {
    if (edge.mode === 'gate') {
      assert.deepEqual(edge.evidenceAllowSet, EVIDENCE_KINDS)
    }
  }
})

test('AC1: every illegal edge has exactly one X fixture row and every legal edge a control', () => {
  assert.equal(X_ROWS.length, 18)
  const illegalIds = EDGES.filter((edge) => edge.verdict === 'ILLEGAL').map((edge) => edge.edgeId)
  assert.deepEqual(X_ROWS.map((row) => row.id).sort(), illegalIds.slice().sort())
  assert.equal(CTL_ROWS.length, 7)
  assert.deepEqual(
    CTL_ROWS.map((row) => row.edgeId).sort(),
    EDGES.filter((edge) => edge.verdict === 'LEGAL')
      .map((edge) => edge.edgeId)
      .sort(),
  )
})

function runEdge(row: FixtureRow, engine: ReturnType<typeof createEngine>): void {
  applyTransition(engine, row.input as never)
}

function withSeeded(row: FixtureRow, fn: (engine: ReturnType<typeof createEngine>) => void): void {
  const root = mkdtempSync(join(tmpdir(), 'fk-p10-sm-'))
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

for (const row of X_ROWS) {
  test(`${row.id} illegal edge refuses ILLEGAL_TRANSITION`, () => {
    withSeeded(row, (engine) => {
      assert.throws(
        () => runEdge(row, engine),
        (error: unknown) => {
          assert.ok(error instanceof EngineError)
          assert.equal(error.code, 'ILLEGAL_TRANSITION')
          return true
        },
      )
    })
  })
}

for (const row of CTL_ROWS) {
  test(`${row.id} legal edge ${row.edgeId} applies`, () => {
    withSeeded(row, (engine) => {
      const result = applyTransition(engine, row.input as never)
      assert.equal(result.effect.code, 'EFFECT_APPLIED')
      assert.equal(result.replay, false)
    })
  })
}

test('every status literal is reachable as a from-status and a to-status across the product', () => {
  for (const status of GOAL_STATUSES) {
    const asFrom = EDGES.filter((edge) => edge.from === (status as GoalStatus))
    const asTo = EDGES.filter((edge) => edge.to === (status as GoalStatus))
    assert.equal(asFrom.length, 5)
    assert.equal(asTo.length, 5)
  }
})
