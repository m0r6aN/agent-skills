/**
 * F8 — real-process kill interruption (INT-01..INT-04). The one-shot import is
 * all-or-nothing: a hard kill at any point before commit rolls back to
 * FULLY-ABSENT (every observable table row-exact zero) and a rerun completes
 * exactly once (one epoch, N row events). A hard kill after the commit leaves
 * state FULLY-APPLIED and the retry refuses `IMPORT_EPOCH_EXISTS` — never a
 * double-apply. A hard kill inside `publishProjection`'s cursor transaction
 * leaves the cursor unmoved and the render byte-deterministic.
 *
 * Kill mechanics: real child processes (`process.execPath --import tsx` with an
 * argv array, NEVER a shell) parked at ASSERTED-REACHED kill points — the
 * worker writes `REACHED:<point>` (and `DONE` post-commit) to stdout and
 * blocks; the parent asserts it SAW the line before killing. The kill is hard,
 * never a graceful exit: `child.kill('SIGKILL')` (on Windows that is
 * TerminateProcess — no signal handlers, no shutdown path) with
 * `taskkill /PID <pid> /T /F` as the force fallback. No sleeps are used for
 * synchronization — the REACHED line is the only barrier.
 */
import assert from 'node:assert/strict'
import { type ChildProcess, spawn, spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import {
  closeStorage,
  type EventRow,
  exportStorage,
  fixedClock,
  getGoal,
  type OpenStorageConfig,
  openStorage,
  verifyStorage,
} from '@foreman-line/kernel-state'
import { FK_P11_PROJECTION_IDS, getProjectionCursor as getStoredCursor } from '../src/cursors.js'
import {
  createImporter,
  createProjector,
  type EpochRecord,
  IMPORT_EPOCH_KIND,
  IMPORT_RECORDED_KIND,
  type ImportDocument,
  type ImportResult,
  isImportError,
  readAllEvents,
  readEpochRecords,
  readImportedGoalClaims,
  renderProjection,
  runImport,
} from '../src/index.js'
import { FakeLineage } from './helpers/fake-lineage.js'

const T0 = 1_700_000_000_000_000
const FIXTURE = join(import.meta.dirname, 'fixtures', 'hostile', 'interruption.json')
const WORKER = join(import.meta.dirname, 'helpers', 'child-worker.ts')

const KILL_POINTS = ['mid-row-insert', 'after-epoch-event', 'post-commit', 'mid-publish'] as const
type KillPoint = (typeof KILL_POINTS)[number]

interface IntFixtureRow {
  id: string
  input: {
    killPoint: KillPoint
    documentKey: string
    document: ImportDocument
    lineage: {
      commits?: { id: string; parents: string[] }[]
      blobs?: { commitId: string; sourcePath: string; text: string }[]
    }
    request: { principalRef: string; operationId: string }
  }
  expectedOutcome: string
  expectedCode?: string
}

const INT: IntFixtureRow[] = JSON.parse(readFileSync(FIXTURE, 'utf8')) as IntFixtureRow[]

/** The pre-declared outcome literal each kill point is bound to. */
const EXPECTED_OUTCOME: Record<KillPoint, string> = {
  'mid-row-insert': 'rollback-fully-absent-then-rerun-completes',
  'after-epoch-event': 'rollback-fully-absent-then-rerun-completes',
  'post-commit': 'applied-retry-refuses-epoch-exists',
  'mid-publish': 'cursor-unmoved-render-deterministic',
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

interface TableCounts {
  goals: number
  events: number
  transitions: number
  leases: number
  idempotencyKeys: number
  artifacts: number
  projectionCursors: number
  wakeupHandoffs: number
}

const FULLY_ABSENT: TableCounts = {
  goals: 0,
  events: 0,
  transitions: 0,
  leases: 0,
  idempotencyKeys: 0,
  artifacts: 0,
  projectionCursors: 0,
  wakeupHandoffs: 0,
}

/** Row-exact fully-applied shape of an N-row import (goals, row+epoch events, ref/approval/epoch artifacts, the two cursors). */
function appliedCounts(rowCount: number): TableCounts {
  return {
    goals: rowCount,
    events: rowCount + 1,
    transitions: 0,
    leases: 0,
    idempotencyKeys: 0,
    artifacts: rowCount * 2 + 1,
    projectionCursors: 2,
    wakeupHandoffs: 0,
  }
}

function snapshotCounts(root: string): TableCounts {
  const storage = openStorage(configFor(root))
  try {
    const tables = exportStorage(storage).exportDocument.payload.tables
    return {
      goals: tables.goals.length,
      events: tables.events.length,
      transitions: tables.transitions.length,
      leases: tables.leases.length,
      idempotencyKeys: tables.idempotency_keys.length,
      artifacts: tables.artifacts.length,
      projectionCursors: tables.projection_cursors.length,
      wakeupHandoffs: tables.wakeup_handoffs.length,
    }
  } finally {
    closeStorage(storage)
  }
}

/** Every documented read says zero rows + verifyStorage ok (rollback proof). */
function assertFullyAbsent(row: IntFixtureRow, root: string): void {
  assert.deepEqual(snapshotCounts(root), FULLY_ABSENT, `${row.id}: all observable tables empty`)
  const storage = openStorage(configFor(root))
  try {
    const events: EventRow[] = readAllEvents(storage)
    assert.deepEqual(events, [], `${row.id}: no events`)
    const epochs: EpochRecord[] = readEpochRecords(storage)
    assert.deepEqual(epochs, [], `${row.id}: no epochs`)
    assert.deepEqual(readImportedGoalClaims(storage), [], `${row.id}: no imported claims`)
    for (const record of row.input.document.rows) {
      assert.equal(getGoal(storage, record.goalId), null, `${row.id}: goal ${record.goalId} absent`)
    }
    for (const projectionId of FK_P11_PROJECTION_IDS) {
      assert.deepEqual(
        getStoredCursor(storage, projectionId),
        { projectionId, lastAppliedEventSeq: 0 },
        `${row.id}: cursor ${projectionId} at 0`,
      )
    }
    const verified = verifyStorage(storage)
    assert.equal(verified.quickCheck, 'ok', `${row.id}: quick_check ok`)
    assert.equal(verified.integrityCheck, 'ok', `${row.id}: integrity_check ok`)
  } finally {
    closeStorage(storage)
  }
}

function runImportInProcess(row: IntFixtureRow, root: string): ImportResult {
  const storage = openStorage(configFor(root))
  try {
    const importer = createImporter({
      storage,
      clock: fixedClock(T0),
      toolVersion: 'kernel-import-interruption-test-0.1.0',
      lineageReader: new FakeLineage(row.input.lineage),
    })
    return runImport(importer, {
      importDocument: row.input.document,
      principalRef: row.input.request.principalRef,
      operationId: row.input.request.operationId,
    })
  } finally {
    closeStorage(storage)
  }
}

interface ChildRun {
  child: ChildProcess
  stderrChunks: string[]
}

function spawnWorker(root: string, row: IntFixtureRow): ChildRun {
  const jobPath = join(root, 'job.json')
  writeFileSync(
    jobPath,
    JSON.stringify({
      dbPath: root,
      document: row.input.document,
      principalRef: row.input.request.principalRef,
      operationId: row.input.request.operationId,
      lineageSeed: row.input.lineage,
      killPoint: row.input.killPoint,
    }),
  )
  const child = spawn(process.execPath, ['--import', 'tsx', WORKER, jobPath], {
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const stderrChunks: string[] = []
  child.stderr?.on('data', (chunk: Buffer) => {
    stderrChunks.push(chunk.toString('utf8'))
  })
  return { child, stderrChunks }
}

/**
 * Asserted-reached barrier: resolve only when the worker's REACHED line (and
 * DONE for post-commit) has been OBSERVED on stdout. A child that exits first
 * is a named failure carrying its raw output — never a silent stall.
 */
async function awaitReach(run: ChildRun, row: IntFixtureRow): Promise<void> {
  const expected =
    row.input.killPoint === 'post-commit'
      ? [`REACHED:${row.input.killPoint}`, 'DONE']
      : [`REACHED:${row.input.killPoint}`]
  const { promise, resolve, reject } = Promise.withResolvers<void>()
  let stdout = ''
  let settled = false
  run.child.stdout?.on('data', (chunk: Buffer) => {
    stdout += chunk.toString('utf8')
    if (settled) return
    if (expected.every((line) => stdout.includes(line))) {
      settled = true
      resolve()
    }
  })
  run.child.once('close', () => {
    if (settled) return
    settled = true
    reject(
      new Error(
        `${row.id}: child exited before ${expected.join(' + ')}; ` +
          `stdout=${JSON.stringify(stdout)} stderr=${JSON.stringify(run.stderrChunks.join(''))}`,
      ),
    )
  })
  run.child.once('error', (error) => {
    if (settled) return
    settled = true
    reject(error)
  })
  await promise
}

/**
 * Resolve true when the child closes within the bound. The awaited condition is
 * the child's `close` event; the real timer is only a FAILURE BOUND on OS
 * process termination (integration exception: no fake timer can drive
 * TerminateProcess deterministically) so a weak SIGKILL falls back to taskkill
 * instead of hanging the suite forever.
 */
function waitClosed(child: ChildProcess, timeoutMs: number): Promise<boolean> {
  const { promise, resolve } = Promise.withResolvers<boolean>()
  if (child.exitCode !== null || child.signalCode !== null) {
    resolve(true)
    return promise
  }
  const timer = setTimeout(() => resolve(false), timeoutMs)
  child.once('close', () => {
    clearTimeout(timer)
    resolve(true)
  })
  return promise
}

/**
 * Hard kill — never a graceful exit. `SIGKILL` on Windows is TerminateProcess
 * (the OS force-terminates; no JS signal handlers or shutdown path run);
 * `taskkill /PID <pid> /T /F` is the force fallback if the signal is weak or a
 * process tree needs tearing down.
 */
async function hardKill(child: ChildProcess): Promise<void> {
  const { pid } = child
  assert.notEqual(pid, undefined, 'child process must carry a pid')
  assert.equal(child.exitCode, null, 'child must be alive (parked) at the kill')
  child.kill('SIGKILL')
  if (await waitClosed(child, 10_000)) return
  spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'])
  assert.ok(await waitClosed(child, 10_000), 'child must be gone after the hard kill')
}

test('fixture inventory: derived count + set-equality + drop-row proof (INT-01..INT-04)', () => {
  // Derived count: one interruption row per kill point.
  assert.equal(INT.length, KILL_POINTS.length)
  const ids = INT.map((row) => row.id)
  assert.deepEqual([...ids].sort(), ['INT-01', 'INT-02', 'INT-03', 'INT-04'])
  // Set-equality of stimuli over a one-to-one coverage map — the drop-row
  // proof: dropping any row leaves its kill point uncovered (no row is
  // redundant, no kill point is untested).
  assert.deepEqual([...INT.map((row) => row.input.killPoint)].sort(), [...KILL_POINTS].sort())
  for (const row of INT) {
    const covering = INT.filter((other) => other.input.killPoint === row.input.killPoint)
    assert.equal(covering.length, 1, `${row.id}: exactly one row per kill point`)
    assert.equal(row.expectedOutcome, EXPECTED_OUTCOME[row.input.killPoint], `${row.id}: outcome`)
  }
  const retryRow = INT.find((row) => row.input.killPoint === 'post-commit')
  assert.equal(retryRow?.expectedOutcome, 'applied-retry-refuses-epoch-exists')
  // The shared valid document + lineage are byte-identical across rows.
  for (const row of INT) {
    assert.equal(row.input.documentKey, 'shared-valid')
    assert.deepEqual(row.input.document, INT[0]?.input.document, `${row.id}: shared document`)
    assert.deepEqual(row.input.lineage, INT[0]?.input.lineage, `${row.id}: shared lineage`)
  }
})

for (const row of INT) {
  test(`${row.id} kill at '${row.input.killPoint}' → ${row.expectedOutcome}`, {
    timeout: 120_000,
  }, async () => {
    const root = mkdtempSync(join(tmpdir(), 'fk-p11-int-'))
    try {
      const run = spawnWorker(root, row)
      await awaitReach(run, row)
      await hardKill(run.child)

      const rowCount = row.input.document.rows.length
      const outcome = row.expectedOutcome

      if (outcome === 'rollback-fully-absent-then-rerun-completes') {
        // Pre-commit kill: WAL rollback leaves the ledger FULLY-ABSENT …
        assertFullyAbsent(row, root)
        // … and the in-process rerun completes exactly once.
        const result = runImportInProcess(row, root)
        assert.equal(result.epoch.rowCount, rowCount, `${row.id}: one epoch, N rows`)
        assert.deepEqual(
          result.importedGoalIds,
          row.input.document.rows.map((record) => record.goalId),
          `${row.id}: every row imported exactly once`,
        )
        assert.equal(
          result.recordedEventSeqs.length,
          rowCount + 1,
          `${row.id}: N row events + 1 epoch event`,
        )
        assert.deepEqual(
          snapshotCounts(root),
          appliedCounts(rowCount),
          `${row.id}: applied row-exact after the rerun`,
        )
        const storage = openStorage(configFor(root))
        try {
          const events = readAllEvents(storage)
          assert.equal(
            events.filter((event) => event.kind === IMPORT_RECORDED_KIND).length,
            rowCount,
            `${row.id}: N row events`,
          )
          assert.equal(
            events.filter((event) => event.kind === IMPORT_EPOCH_KIND).length,
            1,
            `${row.id}: exactly one epoch event`,
          )
          const epochs = readEpochRecords(storage)
          assert.equal(epochs.length, 1, `${row.id}: exactly one epoch`)
          assert.equal(
            epochs[0]?.rootCommit,
            row.input.document.sourceLineage.rootCommit,
            `${row.id}: epoch bound to the lineage root`,
          )
        } finally {
          closeStorage(storage)
        }
        return
      }

      if (outcome === 'applied-retry-refuses-epoch-exists') {
        // Post-commit kill: the commit is durable — state FULLY-APPLIED …
        assert.deepEqual(
          snapshotCounts(root),
          appliedCounts(rowCount),
          `${row.id}: state fully applied after the kill`,
        )
        const beforeRetry = snapshotCounts(root)
        // … and the retry refuses: never double-apply.
        assert.throws(
          () => runImportInProcess(row, root),
          (error: unknown) => {
            assert.ok(isImportError(error), `${row.id}: named ImportError`)
            assert.equal(error.code, 'IMPORT_EPOCH_EXISTS', `${row.id}: retry refuses`)
            return true
          },
          `${row.id}: retry must refuse IMPORT_EPOCH_EXISTS`,
        )
        assert.deepEqual(
          snapshotCounts(root),
          beforeRetry,
          `${row.id}: refused retry writes nothing`,
        )
        const storage = openStorage(configFor(root))
        try {
          const events = readAllEvents(storage)
          assert.equal(
            events.filter((event) => event.kind === IMPORT_EPOCH_KIND).length,
            1,
            `${row.id}: exactly one import.epoch event`,
          )
          assert.equal(
            events.filter((event) => event.kind === IMPORT_RECORDED_KIND).length,
            rowCount,
            `${row.id}: original rowCount of row events`,
          )
          const epochs = readEpochRecords(storage)
          assert.equal(epochs.length, 1, `${row.id}: exactly one epoch recorded`)
          assert.equal(epochs[0]?.rowCount, rowCount, `${row.id}: original rowCount`)
        } finally {
          closeStorage(storage)
        }
        return
      }

      assert.equal(outcome, 'cursor-unmoved-render-deterministic', `${row.id}: known outcome`)
      // Mid-publish kill: the import applied, the cursor transaction rolled
      // back — the cursor is UNMOVED at its pre-publish value …
      assert.deepEqual(
        snapshotCounts(root),
        appliedCounts(rowCount),
        `${row.id}: import fully applied`,
      )
      const storage = openStorage(configFor(root))
      try {
        for (const projectionId of FK_P11_PROJECTION_IDS) {
          assert.deepEqual(
            getStoredCursor(storage, projectionId),
            { projectionId, lastAppliedEventSeq: 0 },
            `${row.id}: cursor ${projectionId} unmoved at its pre-publish value`,
          )
        }
        // … and the render stays byte-deterministic.
        const projector = createProjector({
          storage,
          lineageReader: new FakeLineage(row.input.lineage),
        })
        for (const projectionId of FK_P11_PROJECTION_IDS) {
          const first = renderProjection(projector, { projectionId })
          const second = renderProjection(projector, { projectionId })
          assert.deepEqual(
            second.markdownBytes,
            first.markdownBytes,
            `${row.id}: ${projectionId} render byte-identical`,
          )
          assert.equal(second.projectionDigest, first.projectionDigest, `${row.id}: digest`)
          assert.equal(
            second.renderedThroughEventSeq,
            first.renderedThroughEventSeq,
            `${row.id}: rendered-through seq`,
          )
        }
      } finally {
        closeStorage(storage)
      }
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
}
