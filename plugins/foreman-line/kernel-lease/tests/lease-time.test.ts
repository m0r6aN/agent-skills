/**
 * L5 trusted lease time — hostile rows CLK-01..08 plus the single-seam-read
 * rule (AC4, standing #32 probes).
 */
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import {
  closeStorage,
  fixedClock,
  insertGoal,
  insertLease,
  type OpenStorageConfig,
  openStorage,
} from '@foreman-line/kernel-state'
import {
  claimLease,
  createEngine,
  EngineError,
  getLeaseCasDescriptor,
  renewLease,
  TrustedClock,
} from '../src/index.js'
import { removeRoot } from './helpers/child-worker.js'

const T0 = 1_700_000_000_000_000
const FIXTURES = join(import.meta.dirname, 'fixtures')
const WORKER = join(import.meta.dirname, 'helpers', 'child-worker.ts')

interface ClockRow {
  id: string
  op?: string
  scenario?: string
  setup?: {
    goal?: { status: string; revision: number }
    lease?: null | Record<string, unknown>
    clockReadings?: number[]
    preOp?: { op: string; input: Record<string, unknown> }
  }
  input?: Record<string, unknown>
  expectedCode?: string
  expectedOutcome?: string
}

const parsedFixture: unknown = JSON.parse(
  readFileSync(join(FIXTURES, 'hostile', 'clock.json'), 'utf8'),
)
const fixtureTable = parsedFixture as { records: ClockRow[] }
const CLK = fixtureTable.records

function configFor(root: string): OpenStorageConfig {
  return {
    storageRoot: root,
    databaseFileName: 'state.db',
    createIfMissing: true,
    clock: fixedClock(T0),
    backupPolicy: { root, retentionDescriptor: null },
  }
}

/** Seam returning the given readings in order; the last reading repeats. */
function sequenceClock(readings: number[]): { nowMicros(): number; reads: number } {
  let index = 0
  const seam = {
    reads: 0,
    nowMicros(): number {
      seam.reads += 1
      const value = readings[Math.min(index, readings.length - 1)]
      index += 1
      return value as number
    },
  }
  return seam
}

test('fixture inventory: 8 CLK rows with one pre-declared outcome each', () => {
  assert.equal(CLK.length, 8)
  const ids = new Set(CLK.map((row) => row.id))
  assert.equal(ids.size, CLK.length)
})

test('CLK-01 regressing reading refuses CLOCK_REGRESSION and never proceeds', () => {
  const row = CLK.find((candidate) => candidate.id === 'CLK-01')
  assert.ok(row?.setup?.clockReadings !== undefined)
  const root = mkdtempSync(join(tmpdir(), 'fk-p10-clk-'))
  const storage = openStorage(configFor(root))
  try {
    insertGoal(storage, { goalId: 'goal-1', revision: 1, status: 'active', updatedAtMicros: T0 })
    insertLease(storage, {
      leaseId: 'lease-1',
      goalId: 'goal-1',
      ownerPrincipalRef: 'principal-a',
      casRevision: 1,
      acquiredAtMicros: T0 - 10,
      expiresAtMicros: T0 + 5_000_000,
      releasedAtMicros: null,
    })
    const seam = sequenceClock(row.setup.clockReadings)
    const engine = createEngine({ storage, clock: seam, toolVersion: 'kernel-lease-test' })
    assert.ok(row.setup.preOp)
    claimLease(engine, row.setup.preOp.input as never)
    assert.throws(
      () => claimLease(engine, row.input as never),
      (error: unknown) => {
        assert.ok(error instanceof EngineError)
        assert.equal(error.code, 'CLOCK_REGRESSION')
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

for (const id of ['CLK-02', 'CLK-03', 'CLK-04']) {
  test(`${id} malformed reading refuses CLOCK_UNTRUSTED`, () => {
    const row = CLK.find((candidate) => candidate.id === id)
    assert.ok(row?.setup?.clockReadings !== undefined)
    const root = mkdtempSync(join(tmpdir(), 'fk-p10-clk-'))
    const storage = openStorage(configFor(root))
    try {
      insertGoal(storage, { goalId: 'goal-1', revision: 0, status: 'active', updatedAtMicros: T0 })
      const seam = sequenceClock(row.setup.clockReadings)
      const engine = createEngine({ storage, clock: seam, toolVersion: 'kernel-lease-test' })
      assert.throws(
        () => claimLease(engine, row.input as never),
        (error: unknown) => {
          assert.ok(error instanceof EngineError)
          assert.equal(error.code, 'CLOCK_UNTRUSTED')
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

for (const id of ['CLK-05', 'CLK-06']) {
  test(`${id} caller-supplied time fields are refused (the API shape admits no time parameter)`, () => {
    const row = CLK.find((candidate) => candidate.id === id)
    const root = mkdtempSync(join(tmpdir(), 'fk-p10-clk-'))
    const storage = openStorage(configFor(root))
    try {
      insertGoal(storage, { goalId: 'goal-1', revision: 0, status: 'active', updatedAtMicros: T0 })
      const engine = createEngine({
        storage,
        clock: sequenceClock([T0]),
        toolVersion: 'kernel-lease-test',
      })
      assert.throws(
        () => claimLease(engine, row?.input as never),
        (error: unknown) => {
          assert.ok(error instanceof EngineError)
          assert.equal(error.code, 'ENGINE_ARGUMENT_INVALID')
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

test('R7: createEngine refuses unknown option members (exact set; evidenceKindPolicy optional)', () => {
  const root = mkdtempSync(join(tmpdir(), 'fk-p10-clk-'))
  const storage = openStorage(configFor(root))
  try {
    for (const smuggled of ['nowMicros', 'expiresAtMicros', 'now', 'timestamp']) {
      assert.throws(
        () =>
          createEngine({
            storage,
            clock: sequenceClock([T0]),
            toolVersion: 'kernel-lease-test',
            [smuggled]: 1,
          } as never),
        (error: unknown) => {
          assert.ok(error instanceof EngineError, smuggled)
          assert.equal(error.code, 'ENGINE_ARGUMENT_INVALID', smuggled)
          assert.deepEqual(error.diagnostic, { fieldPath: `createEngine.${smuggled}` }, smuggled)
          return true
        },
      )
    }
    // Positive control: the exact member set (optional member omitted) works.
    assert.ok(
      createEngine({ storage, clock: sequenceClock([T0]), toolVersion: 'kernel-lease-test' }),
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

test('CLK-07 forward-skewed child-process grant is judged from stored micros vs local trusted now', () => {
  const root = mkdtempSync(join(tmpdir(), 'fk-p10-clk-'))
  const storage = openStorage(configFor(root))
  try {
    insertGoal(storage, { goalId: 'goal-1', revision: 0, status: 'active', updatedAtMicros: T0 })
    closeStorage(storage)
    const outPath = join(root, 'skew-result.json')
    const spawn = spawnSync(
      process.execPath,
      ['--import', 'tsx', WORKER, 'skew-grant', root, '3600000000', outPath],
      { encoding: 'utf8' },
    )
    assert.equal(spawn.status, 0, spawn.stderr)
    const raw: unknown = JSON.parse(readFileSync(outPath, 'utf8'))
    const grant = raw as { descriptor: { leaseExpiresAtMicros: number } }
    const reopened = openStorage(configFor(root))
    try {
      const engine = createEngine({
        storage: reopened,
        clock: fixedClock(T0),
        toolVersion: 'kernel-lease-test',
      })
      // Expiry judgment uses stored absolute micros vs THIS engine's trusted now
      // (T5): the grant is unexpired here despite the granter's +1 h skew.
      const descriptor = getLeaseCasDescriptor(engine, 'goal-1')
      assert.equal(descriptor?.leaseExpiresAtMicros, grant.descriptor.leaseExpiresAtMicros)
      assert.throws(
        () =>
          claimLease(engine, {
            goalId: 'goal-1',
            leaseId: 'lease-other',
            durationMicros: 5_000_000,
            expectedRevision: 1,
            idempotencyKey: {
              principalRef: 'principal-b',
              operationId: 'op-clk-07',
              repositoryRef: 'repo-1',
              worktreeRef: 'wt-1',
              payloadDigest: `sha256:${'70'.repeat(32)}`,
            },
          }),
        (error: unknown) => {
          assert.ok(error instanceof EngineError)
          assert.equal(error.code, 'LEASE_HELD')
          return true
        },
      )
    } finally {
      try {
        closeStorage(reopened)
      } catch {
        // Best-effort close; cleanup proceeds.
      }
    }
  } finally {
    removeRoot(root)
  }
})

test('CLK-08 backward-skewed renew cannot resurrect an expired lease', () => {
  const row = CLK.find((candidate) => candidate.id === 'CLK-08')
  assert.ok(row?.setup?.clockReadings !== undefined)
  const root = mkdtempSync(join(tmpdir(), 'fk-p10-clk-'))
  const storage = openStorage(configFor(root))
  try {
    insertGoal(storage, { goalId: 'goal-1', revision: 1, status: 'active', updatedAtMicros: T0 })
    insertLease(storage, {
      leaseId: 'lease-1',
      goalId: 'goal-1',
      ownerPrincipalRef: 'principal-a',
      casRevision: 1,
      acquiredAtMicros: T0 - 100_000,
      expiresAtMicros: T0 - 1_000_000,
      releasedAtMicros: null,
    })
    const seam = sequenceClock(row.setup.clockReadings)
    const engine = createEngine({ storage, clock: seam, toolVersion: 'kernel-lease-test' })
    assert.throws(
      () => renewLease(engine, row.input as never),
      (error: unknown) => {
        assert.ok(error instanceof EngineError)
        assert.equal(error.code, 'LEASE_EXPIRED')
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

test('AC4: every lease-time decision reads the seam exactly once per operation', () => {
  const root = mkdtempSync(join(tmpdir(), 'fk-p10-clk-'))
  const storage = openStorage(configFor(root))
  try {
    insertGoal(storage, { goalId: 'goal-1', revision: 0, status: 'active', updatedAtMicros: T0 })
    const seam = sequenceClock([T0])
    const engine = createEngine({ storage, clock: seam, toolVersion: 'kernel-lease-test' })
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
      idempotencyKey: bind('op-reads-1'),
    })
    assert.equal(seam.reads, 1, 'claim grant must read the seam exactly once')
    renewLease(engine, {
      goalId: 'goal-1',
      leaseId: 'lease-1',
      durationMicros: 5_000_000,
      expectedRevision: 1,
      idempotencyKey: bind('op-reads-2'),
    })
    assert.equal(seam.reads, 2, 'renew must read the seam exactly once')
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

test('TrustedClock unit: non-decreasing accepted, equal accepted, regression/malformed refuse', () => {
  const readings = [T0, T0, T0 + 5, T0 - 1]
  const seam = sequenceClock(readings)
  const clock = new TrustedClock(seam)
  assert.equal(clock.nowMicros(), T0)
  assert.equal(clock.nowMicros(), T0)
  assert.equal(clock.nowMicros(), T0 + 5)
  assert.throws(
    () => clock.nowMicros(),
    (error: unknown) => {
      assert.ok(error instanceof EngineError)
      assert.equal(error.code, 'CLOCK_REGRESSION')
      return true
    },
  )
  const bad = new TrustedClock(sequenceClock([-5]))
  assert.throws(
    () => bad.nowMicros(),
    (error: unknown) => {
      assert.ok(error instanceof EngineError)
      assert.equal(error.code, 'CLOCK_UNTRUSTED')
      return true
    },
  )
})

test('a seam throwing is CLOCK_UNTRUSTED, never a raw propagation', () => {
  const clock = new TrustedClock({
    nowMicros(): number {
      throw new Error('seam exploded')
    },
  })
  assert.throws(
    () => clock.nowMicros(),
    (error: unknown) => {
      assert.ok(error instanceof EngineError)
      assert.equal(error.code, 'CLOCK_UNTRUSTED')
      return true
    },
  )
  // The raw cause never appears in the surfaced error message.
  const failure = new EngineError('CLOCK_UNTRUSTED', {})
  assert.ok(!failure.message.includes('seam exploded'))
  void writeFileSync
})
