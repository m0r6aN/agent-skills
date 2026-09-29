/**
 * AC1/AC7/AC10 + Controls — the import pipeline suite.
 *
 * Carries: (1) the GLOBAL fixture inventory map — the 85-record suite's counts
 * are DERIVED from the fixture rows and asserted set-equal to the ID enums
 * (never a hand-typed total; dropping a row fails the map — the coordinator's
 * derived-count ruling, F-1); (2) the documented first-failure-order
 * precedence-edge suite (one named case per refusal family); (3) the F2/F3/
 * F4/F11 hostile rows (DIG/CMT/REI/CM); (4) Controls CTL-01..10; (5) the T3
 * zero-row invariants (zero `transitions` / `leases` / `idempotency_keys`
 * rows — failing-when-broken).
 */
import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { describe, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  closeStorage,
  fixedClock,
  getGoal,
  getIdempotencyKey,
  getUnreleasedLease,
  insertEvent,
  insertGoal,
  insertIdempotencyKey,
  insertLease,
  type OpenStorageConfig,
  openStorage,
  type Storage,
  getProjectionCursor as substrateCursor,
} from '@foreman-line/kernel-state'
import { digestText } from '../src/canonical.js'
import {
  checkDivergence,
  corpusDigestOf,
  createImporter,
  createProjector,
  FK_P11_PROJECTION_IDS,
  getAllEpochs,
  getEpoch,
  IMPORT_ERROR_REGISTRY,
  type ImportError,
  type Importer,
  type ImportResult,
  publishProjection,
  readAllEvents,
  readImportedGoalClaims,
  renderProjection,
  runImport,
} from '../src/index.js'
import { FakeLineage } from './helpers/fake-lineage.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const PKG_ROOT = resolve(HERE, '..')
const FIXTURES = join(HERE, 'fixtures')

// --- fixture inventory (the 85-record derived map) ---------------------------

interface FixtureRow {
  id: string
  input: Record<string, unknown>
  expectedCode?: string
  expectedOutcome?: string
  expectedReasonCode?: string
}

function loadRows(relativePath: string): FixtureRow[] {
  const parsed: unknown = JSON.parse(readFileSync(join(FIXTURES, relativePath), 'utf8'))
  const rows = Array.isArray(parsed) ? parsed : (parsed as { records: unknown[] }).records
  return rows as FixtureRow[]
}

const HOSTILE_FILES: Record<string, string> = {
  approvals: 'hostile/approvals.json',
  'digest-mismatch': 'hostile/digest-mismatch.json',
  'commit-boundary': 'hostile/commit-boundary.json',
  reimport: 'hostile/reimport.json',
  conflicts: 'hostile/conflicts.json',
  projection: 'hostile/projection.json',
  cursors: 'hostile/cursors.json',
  interruption: 'hostile/interruption.json',
  injection: 'hostile/injection.json',
  'error-laundering': 'hostile/error-laundering.json',
  corpus: 'hostile/corpus.json',
}

function rangeIds(prefix: string, count: number): string[] {
  return Array.from(
    { length: count },
    (_, index) => `${prefix}-${String(index + 1).padStart(2, '0')}`,
  )
}

/** The declared ID enums (per-class counts live here; totals are DERIVED). */
const HOSTILE_ENUMS: Record<string, number> = {
  FAB: 12,
  DIG: 4,
  CMT: 6,
  REI: 4,
  CON: 10,
  PRJ: 7,
  CUR: 4,
  INT: 4,
  INJ: 11,
  ERR: 3,
  CM: 6,
}

function allFixtureRows(): FixtureRow[] {
  const hostile = Object.values(HOSTILE_FILES).flatMap((file) => loadRows(file))
  const controls = loadRows('controls.json')
  const canonical = loadRows('canonical/encoder-vectors.json')
  return [...hostile, ...controls, ...canonical]
}

function assertInventoryComplete(rows: FixtureRow[]): void {
  const hostileExpected = Object.values(HOSTILE_ENUMS).reduce((total, count) => total + count, 0)
  const expectedIds = [
    ...Object.entries(HOSTILE_ENUMS).flatMap(([prefix, count]) => rangeIds(prefix, count)),
    ...rangeIds('CTL', 12),
    ...rangeIds('CAN', 8),
  ]
  const hostileCount = Object.values(HOSTILE_FILES)
    .map((file) => loadRows(file).length)
    .reduce((total, count) => total + count, 0)
  assert.equal(hostileCount, hostileExpected, 'hostile rows derive to the enum sum')
  const actualIds = rows.map((row) => row.id)
  assert.deepEqual(
    [...actualIds].sort(),
    [...expectedIds].sort(),
    'fixture ids are exactly the declared enums (set-equality)',
  )
  assert.equal(actualIds.length, expectedIds.length, 'derived total equals the enum total')
  for (const row of rows) {
    const outcomes = [row.expectedCode, row.expectedOutcome].filter((value) => value !== undefined)
    assert.equal(outcomes.length, 1, `${row.id} carries exactly one pre-declared outcome`)
  }
}

describe('fixture inventory map (derived counts; failing-when-broken)', () => {
  const rows = allFixtureRows()
  test('every fixture record is enumerated exactly once against the ID enums', () => {
    assertInventoryComplete(rows)
  })
  test('dropping any row fails the map (derived-count proof)', () => {
    for (let index = 0; index < rows.length; index += 1) {
      const dropped = rows.filter((_, position) => position !== index)
      assert.throws(() => assertInventoryComplete(dropped), assert.AssertionError)
    }
  })
})

// --- driver -----------------------------------------------------------------

interface FixtureContext {
  dir: string
  storage: Storage
  importer: Importer
  lineage: FakeLineage
}

function openTemp(): { dir: string; storage: Storage; config: OpenStorageConfig } {
  const dir = mkdtempSync(join(tmpdir(), 'fk-p11-import-'))
  const config: OpenStorageConfig = {
    storageRoot: dir,
    databaseFileName: 'state.db',
    createIfMissing: true,
    clock: fixedClock(1_700_000_000_000_000),
    backupPolicy: { root: join(dir, 'backups'), retentionDescriptor: null },
  }
  return { dir, storage: openStorage(config), config }
}

interface SeedDescription {
  goals?: { goalId: string; revision: number; status: string }[]
  events?: {
    eventId: string
    goalId: string
    kind: string
    payload: string
    payloadDigest?: string
    principalRef: string
    operationId: string
    recordedAtMicros: number
  }[]
}

function applySeed(storage: Storage, seed: SeedDescription | undefined): void {
  if (seed === undefined) return
  for (const goal of seed.goals ?? []) {
    insertGoal(storage, {
      goalId: goal.goalId,
      revision: goal.revision,
      status: goal.status,
    })
  }
  for (const event of seed.events ?? []) {
    insertEvent(storage, {
      eventId: event.eventId,
      goalId: event.goalId,
      kind: event.kind,
      payload: event.payload,
      payloadDigest: event.payloadDigest ?? digestText(event.payload),
      principalRef: event.principalRef,
      operationId: event.operationId,
      recordedAtMicros: event.recordedAtMicros,
    })
  }
}

function contextFor(input: Record<string, unknown>): FixtureContext {
  const { dir, storage } = openTemp()
  applySeed(storage, input.seed as SeedDescription | undefined)
  const lineage = new FakeLineage(input.lineage as ConstructorParameters<typeof FakeLineage>[0])
  return {
    dir,
    storage,
    lineage,
    importer: createImporter({
      storage,
      clock: fixedClock(1_700_000_000_000_000),
      toolVersion: 'kernel-import-test/0.1.0',
      lineageReader: lineage,
    }),
  }
}

const REQUEST = { principalRef: 'operator-1', operationId: 'op-0001' }

function runImportOf(ctx: FixtureContext, input: Record<string, unknown>): ImportResult {
  return runImport(ctx.importer, {
    importDocument: input.document,
    principalRef:
      (input.request as { principalRef?: string })?.principalRef ?? REQUEST.principalRef,
    operationId: (input.request as { operationId?: string })?.operationId ?? REQUEST.operationId,
  })
}

function assertNothingImported(ctx: FixtureContext, goalIds: string[]): void {
  assert.equal(readAllEvents(ctx.storage).length, 0, 'no events recorded')
  for (const goalId of goalIds) {
    assert.equal(getGoal(ctx.storage, goalId), null, `${goalId} not materialized`)
  }
  for (const projectionId of FK_P11_PROJECTION_IDS) {
    assert.equal(substrateCursor(ctx.storage, projectionId), null, `${projectionId} cursor absent`)
  }
}

function rowGoalIds(input: Record<string, unknown>): string[] {
  const document = input.document as { rows?: { goalId?: string }[] } | undefined
  const documents = input.documents as { rows?: { goalId?: string }[] }[] | undefined
  const sources = documents ?? (document !== undefined ? [document] : [])
  return sources.flatMap((entry) => (entry.rows ?? []).map((row) => row.goalId ?? '?'))
}

function assertRefusal(ctx: FixtureContext, row: FixtureRow, error: unknown): void {
  const typed = error as ImportError
  assert.ok(typed instanceof Error, `${row.id} throws an Error`)
  assert.equal(typed.name, 'ImportError')
  assert.equal(typed.code, row.expectedCode, `${row.id} fires its named code`)
  assert.equal(typed.message, row.expectedCode, 'message is the code literal alone')
  const declared = (IMPORT_ERROR_REGISTRY[typed.code].diagnosticMembers as string[])
    .map((member) => member)
    .sort()
  assert.deepEqual(
    Object.keys(typed.diagnostic).sort(),
    declared,
    'diagnostic is the declared shape',
  )
  const expected = row.expectedReasonCode
  if (expected !== undefined) {
    const diagnostic = typed.diagnostic as Record<string, string | number>
    if (
      typed.code === 'IMPORT_SOURCE_DIGEST_MISMATCH' ||
      typed.code === 'IMPORT_SOURCE_BLOB_ABSENT'
    ) {
      assert.equal(diagnostic.fieldId, expected)
    } else if (typed.code === 'IMPORT_COMMIT_OUT_OF_LINEAGE') {
      assert.equal(diagnostic.commitId, expected)
    } else if (typed.code === 'IMPORT_EPOCH_EXISTS') {
      assert.equal(diagnostic.rootCommit, expected)
    } else if (typed.code === 'DIVERGENCE_STOP') {
      assert.equal(diagnostic.reasonCode, expected)
    } else {
      assert.equal(diagnostic.reason, expected)
    }
  }
  assertNothingImported(ctx, rowGoalIds(row.input))
}

/**
 * Reopen after a hard kill. Windows can briefly deny the next open of the
 * killed process's SQLite sidecar files (the WAL pragma step races the OS
 * handle release). A bounded retry waits out that release — the same
 * integration-exception class as the kill failure bound (no deterministic
 * clock models TerminateProcess handle release). The bound failing is a loud
 * test failure, never a skip. `Atomics.wait` parks without a timer handle.
 */
function reopenAfterKill(config: OpenStorageConfig, deadlineMs = 5_000): Storage {
  const started = Date.now()
  const park = new Int32Array(new SharedArrayBuffer(4))
  for (;;) {
    try {
      return openStorage(config)
    } catch (error) {
      if (Date.now() - started > deadlineMs) throw error
      Atomics.wait(park, 0, 0, 25)
    }
  }
}

// --- row-driven hostile suites (F2/F3/F4/F11) --------------------------------

function driveRefusalRows(file: string): void {
  for (const row of loadRows(file)) {
    test(`${row.id} refuses exactly as pre-declared`, () => {
      const ctx = contextFor(row.input)
      try {
        if (row.input.mode === 'reimport' || row.input.mode === 'reimport-reopen') {
          const documents = row.input.documents as Record<string, unknown>[]
          runImportOf(ctx, { ...row.input, document: documents[0] })
          const eventsAfterFirst = readAllEvents(ctx.storage).length
          if (row.input.mode === 'reimport-reopen') {
            closeStorage(ctx.storage)
            const reopened = openStorage({
              storageRoot: ctx.dir,
              databaseFileName: 'state.db',
              createIfMissing: true,
              clock: fixedClock(1_700_000_000_000_000),
              backupPolicy: { root: join(ctx.dir, 'backups'), retentionDescriptor: null },
            })
            try {
              runImport(
                createImporter({
                  storage: reopened,
                  clock: fixedClock(1_700_000_000_000_000),
                  toolVersion: 'kernel-import-test/0.1.0',
                  lineageReader: ctx.lineage,
                }),
                {
                  importDocument: documents[1],
                  principalRef: REQUEST.principalRef,
                  operationId: 'op-0002',
                },
              )
              assert.fail(`${row.id} must refuse`)
            } catch (error) {
              const typed = error as ImportError
              assert.equal(typed.code, row.expectedCode)
              assert.equal(
                readAllEvents(reopened).length,
                eventsAfterFirst,
                'second run writes nothing',
              )
            } finally {
              closeStorage(reopened)
            }
            return
          }
          try {
            runImportOf(ctx, { ...row.input, document: documents[1] })
            assert.fail(`${row.id} must refuse`)
          } catch (error) {
            const typed = error as ImportError
            assert.equal(typed.code, row.expectedCode, `${row.id} fires its named code`)
            if (row.expectedReasonCode !== undefined) {
              assert.equal(
                (typed.diagnostic as Record<string, string>).rootCommit,
                row.expectedReasonCode,
              )
            }
            assert.equal(
              readAllEvents(ctx.storage).length,
              eventsAfterFirst,
              'second run writes nothing',
            )
          }
          return
        }
        runImportOf(ctx, row.input)
        assert.fail(`${row.id} must refuse`)
      } catch (error) {
        if ((error as Error).message?.includes('must refuse')) throw error
        assertRefusal(ctx, row, error)
      } finally {
        closeStorage(ctx.storage)
      }
    })
  }
}

describe('F2 digest mismatch (DIG-01..04)', () => {
  driveRefusalRows('hostile/digest-mismatch.json')
  test('DIG-01 absent case (F-6): source blob absent refuses IMPORT_SOURCE_BLOB_ABSENT', () => {
    // Coordinator ruling F-6: the DIG-01 fixture family gains its absent case;
    // it is carried as a named case inside the closed 67-record count (the F-1
    // ruled totals stay 67/85 — no new record id is minted).
    const source = loadRows('hostile/digest-mismatch.json')
    const ctx = contextFor(source[0]?.input ?? {})
    try {
      const base = source[0]?.input.document as {
        rows: Record<string, unknown>[]
        corpusDigest: string
        corpusManifest: { items: Record<string, unknown>[] }
      }
      const ghostPath = 'docs/goals/ghost.md'
      const ghostDigest = `sha256:${'0'.repeat(64)}`
      const document = {
        ...base,
        corpusManifest: {
          ...base.corpusManifest,
          items: [
            ...base.corpusManifest.items,
            {
              sourcePath: ghostPath,
              sourceDigest: ghostDigest,
              disposition: 'import',
              reason: 'legacy record',
            },
          ],
        },
        rows: [
          {
            ...(base.rows[0] as Record<string, unknown>),
            source: {
              sourcePath: ghostPath,
              sourceDigest: ghostDigest,
              sourceCommit: '2222222222222222222222222222222222222222',
            },
          },
        ],
      }
      document.corpusDigest = corpusDigestOf(document.rows as never)
      runImport(ctx.importer, {
        importDocument: document,
        principalRef: REQUEST.principalRef,
        operationId: REQUEST.operationId,
      })
      assert.fail('must refuse')
    } catch (error) {
      const typed = error as ImportError
      assert.equal(typed.code, 'IMPORT_SOURCE_BLOB_ABSENT')
      assert.deepEqual(Object.keys(typed.diagnostic).sort(), ['fieldId', 'rowId'])
    } finally {
      closeStorage(ctx.storage)
    }
  })
})
describe('F3 commit boundary (CMT-01..06)', () => driveRefusalRows('hostile/commit-boundary.json'))
describe('F4 re-import (REI-01..03 refuse; REI-04 below)', () => {
  for (const row of loadRows('hostile/reimport.json').filter((entry) => entry.id !== 'REI-04')) {
    test(`${row.id} refuses exactly as pre-declared`, () => {
      const ctx = contextFor(row.input)
      try {
        const documents = row.input.documents as Record<string, unknown>[]
        runImportOf(ctx, { ...row.input, document: documents[0] })
        const eventsAfterFirst = readAllEvents(ctx.storage).length
        if (row.input.mode === 'reimport-reopen') {
          closeStorage(ctx.storage)
          const reopened = openStorage({
            storageRoot: ctx.dir,
            databaseFileName: 'state.db',
            createIfMissing: true,
            clock: fixedClock(1_700_000_000_000_000),
            backupPolicy: { root: join(ctx.dir, 'backups'), retentionDescriptor: null },
          })
          try {
            runImport(
              createImporter({
                storage: reopened,
                clock: fixedClock(1_700_000_000_000_000),
                toolVersion: 'kernel-import-test/0.1.0',
                lineageReader: ctx.lineage,
              }),
              {
                importDocument: documents[1],
                principalRef: REQUEST.principalRef,
                operationId: 'op-0002',
              },
            )
            assert.fail(`${row.id} must refuse`)
          } catch (error) {
            assert.equal((error as ImportError).code, row.expectedCode)
            assert.equal(
              readAllEvents(reopened).length,
              eventsAfterFirst,
              'second run writes nothing',
            )
          } finally {
            closeStorage(reopened)
          }
          return
        }
        try {
          runImportOf(ctx, { ...row.input, document: documents[1] })
          assert.fail(`${row.id} must refuse`)
        } catch (error) {
          assert.equal(
            (error as ImportError).code,
            row.expectedCode,
            `${row.id} fires its named code`,
          )
          assert.equal(
            readAllEvents(ctx.storage).length,
            eventsAfterFirst,
            'second run writes nothing',
          )
        }
      } finally {
        closeStorage(ctx.storage)
      }
    })
  }
})
describe('F11 corpus manifest (CM-01..06)', () => driveRefusalRows('hostile/corpus.json'))

// --- REI-04: real kill mid-import, then rerun completes exactly once ---------

function spawnWorkerToKill(
  job: Record<string, unknown>,
): Promise<{ killed: boolean; reached: string[] }> {
  const jobPath = join(String(job.dbPath), '..', 'job.json')
  writeFileSync(jobPath, JSON.stringify(job), 'utf8')
  const { promise, resolve: resolvePromise } = Promise.withResolvers<{
    killed: boolean
    reached: string[]
  }>()
  const child = spawn(
    process.execPath,
    ['--import', 'tsx', join(PKG_ROOT, 'tests', 'helpers', 'child-worker.ts'), jobPath],
    { cwd: PKG_ROOT, stdio: ['ignore', 'pipe', 'pipe'] },
  )
  const reached: string[] = []
  let killed = false
  let settled = false
  const settle = (): void => {
    if (settled) return
    settled = true
    resolvePromise({ killed, reached })
  }
  // Hard kill is asynchronous: the reopen must not race the OS releasing the
  // killed worker's SQLite handle (the interruption suite's hardKill/
  // waitClosed convention — the close event is the awaited condition, with
  // taskkill as the force fallback). The timer below is only a FAILURE BOUND on
  // OS process termination (integration exception: no fake timer can drive
  // TerminateProcess deterministically) so a weak SIGKILL cannot hang the suite.
  const killAndWaitClosed = (): void => {
    if (killed) return
    killed = true
    const pid = child.pid
    child.kill()
    const failureBound = setTimeout(() => {
      if (pid !== undefined) spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'])
      settle()
    }, 10_000)
    child.once('close', () => {
      clearTimeout(failureBound)
      settle()
    })
  }
  child.stdout.on('data', (chunk: Buffer) => {
    for (const line of chunk.toString('utf8').split('\n')) {
      if (line.startsWith('REACHED:')) {
        reached.push(line.trim())
        if (line.includes('mid-row-insert')) killAndWaitClosed()
      }
      if (line.includes('DONE') && !killed) settle()
    }
  })
  child.on('exit', () => {
    if (!killed) settle()
  })
  child.on('error', settle)
  return promise
}

describe('F4 recovery-positive (REI-04)', () => {
  test('REI-04 kill mid-import then rerun completes exactly once', async () => {
    const row = loadRows('hostile/reimport.json').find((entry) => entry.id === 'REI-04')
    assert.ok(row !== undefined)
    // The parent must NOT hold the DB write path while the worker imports.
    const dir = mkdtempSync(join(tmpdir(), 'fk-p11-import-'))
    const job = {
      dbPath: dir,
      document: row.input.document,
      principalRef: REQUEST.principalRef,
      operationId: REQUEST.operationId,
      lineageSeed: row.input.lineage,
      killPoint: 'mid-row-insert',
    }
    const outcome = await spawnWorkerToKill(job)
    assert.ok(outcome.killed, 'the kill happened at the asserted-reached point')
    assert.ok(
      outcome.reached.some((line) => line.includes('mid-row-insert')),
      'asserted-reached point observed before the kill',
    )
    const reopened = reopenAfterKill({
      storageRoot: dir,
      databaseFileName: 'state.db',
      createIfMissing: true,
      clock: fixedClock(1_700_000_000_000_000),
      backupPolicy: { root: join(dir, 'backups'), retentionDescriptor: null },
    })
    const lineage = new FakeLineage(
      row.input.lineage as ConstructorParameters<typeof FakeLineage>[0],
    )
    const importer = createImporter({
      storage: reopened,
      clock: fixedClock(1_700_000_000_000_000),
      toolVersion: 'kernel-import-test/0.1.0',
      lineageReader: lineage,
    })
    const result = runImport(importer, {
      importDocument: row.input.document,
      principalRef: REQUEST.principalRef,
      operationId: REQUEST.operationId,
    })
    assert.equal(getAllEpochs(importer).length, 1, 'exactly one epoch record')
    assert.equal(result.importedGoalIds.length, 2, 'all rows imported once')
    try {
      runImport(importer, {
        importDocument: row.input.document,
        principalRef: REQUEST.principalRef,
        operationId: 'op-0009',
      })
      assert.fail('rerun must refuse')
    } catch (error) {
      assert.equal((error as ImportError).code, 'IMPORT_EPOCH_EXISTS')
    }
    assert.equal(getAllEpochs(importer).length, 1, 'never double-apply')
    closeStorage(reopened)
  })
})

// --- documented first-failure order: precedence-edge suite -------------------

describe('import precedence edges (the documented first-failure order is what fires)', () => {
  test('limits family: over-limit ref array beats a latent digest failure (FAB-11 class)', () => {
    const ctx = contextFor({
      lineage: loadRows('hostile/digest-mismatch.json')[0]?.input.lineage,
    })
    try {
      const base = loadRows('hostile/digest-mismatch.json')[0]?.input.document as {
        rows: Record<string, unknown>[]
        corpusDigest: string
        corpusManifest: Record<string, unknown>
      }
      const sixtyFive = Array.from({ length: 65 }, () => ({
        evidenceKind: 'commit-ref',
        gitIdentity: 'refs/heads/main',
        digest: `sha256:${'0'.repeat(64)}`,
        provenance: {
          sourcePath: 'docs/proof/approval-1.md',
          sourceDigest: `sha256:${'b'.repeat(64)}`,
          sourceCommit: '2222222222222222222222222222222222222222',
        },
      }))
      const document = {
        ...base,
        rows: [{ ...(base.rows[0] as Record<string, unknown>), claimedApprovals: sixtyFive }],
      }
      document.corpusDigest = corpusDigestOf(document.rows as never)
      runImport(ctx.importer, {
        importDocument: document,
        principalRef: REQUEST.principalRef,
        operationId: REQUEST.operationId,
      })
      assert.fail('must refuse')
    } catch (error) {
      assert.equal((error as ImportError).code, 'IMPORT_LIMIT_EXCEEDED')
    } finally {
      closeStorage(ctx.storage)
    }
  })

  test('digest family: a digest mismatch beats a latent approval failure', () => {
    const source = loadRows('hostile/digest-mismatch.json')
    const ctx = contextFor(source[0]?.input ?? {})
    try {
      const base = source[0]?.input.document as {
        rows: Record<string, unknown>[]
        corpusDigest: string
      }
      const second = {
        ...(base.rows[0] as Record<string, unknown>),
        goalId: 'goal-0002',
        source: {
          sourcePath: 'docs/goals/goal-0002.md',
          sourceDigest: `sha256:${'0'.repeat(64)}`,
          sourceCommit: '2222222222222222222222222222222222222222',
        },
      }
      const document = { ...base, rows: [base.rows[0], second] }
      document.corpusDigest = corpusDigestOf(document.rows as never)
      runImport(ctx.importer, {
        importDocument: document,
        principalRef: REQUEST.principalRef,
        operationId: REQUEST.operationId,
      })
      assert.fail('must refuse')
    } catch (error) {
      assert.equal((error as ImportError).code, 'IMPORT_SOURCE_DIGEST_MISMATCH')
    } finally {
      closeStorage(ctx.storage)
    }
  })

  test('approval family: an unevidenced approval beats a latent status conflict', () => {
    const source = loadRows('hostile/approvals.json')
    const fab03 = source.find((row) => row.id === 'FAB-03')
    assert.ok(fab03 !== undefined)
    const ctx = contextFor(fab03.input)
    try {
      const base = fab03.input.document as { rows: Record<string, unknown>[]; corpusDigest: string }
      const conflicting = {
        ...(base.rows[0] as Record<string, unknown>),
        claimedStatus: 'cancelled',
      }
      const document = { ...base, rows: [base.rows[0], conflicting] }
      document.corpusDigest = corpusDigestOf(document.rows as never)
      runImport(ctx.importer, {
        importDocument: document,
        principalRef: REQUEST.principalRef,
        operationId: REQUEST.operationId,
      })
      assert.fail('must refuse')
    } catch (error) {
      const typed = error as ImportError
      assert.equal(typed.code, 'IMPORT_APPROVAL_UNEVIDENCED')
      assert.equal((typed.diagnostic as Record<string, string>).reason, 'claim-required-missing')
    } finally {
      closeStorage(ctx.storage)
    }
  })

  test('conflict family sub-order: status beats revision (T5 table order)', () => {
    const conflicts = loadRows('hostile/conflicts.json')
    const con04 = conflicts.find((row) => row.id === 'CON-04')
    assert.ok(con04 !== undefined)
    const ctx = contextFor(con04.input)
    try {
      const base = con04.input.document as { rows: Record<string, unknown>[]; corpusDigest: string }
      const conflictRow = {
        ...(base.rows[0] as Record<string, unknown>),
        claimedStatus: 'cancelled',
      }
      const document = { ...base, rows: [base.rows[0], conflictRow] }
      document.corpusDigest = corpusDigestOf(document.rows as never)
      runImport(ctx.importer, {
        importDocument: document,
        principalRef: REQUEST.principalRef,
        operationId: REQUEST.operationId,
      })
      assert.fail('must refuse')
    } catch (error) {
      const typed = error as ImportError
      assert.equal(typed.code, 'DIVERGENCE_STOP')
      assert.equal((typed.diagnostic as Record<string, string>).reasonCode, 'status')
    } finally {
      closeStorage(ctx.storage)
    }
  })

  test('epoch family: the epoch refusal dominates reruns of an imported lineage (REI-02, F-7)', () => {
    // REI-02's second document carries a contradicting status on a
    // same-lineage-imported goal: the conflict family EXEMPTS it and the
    // epoch refusal fires (documented order preserved end-to-end).
    const rei02 = loadRows('hostile/reimport.json').find((row) => row.id === 'REI-02')
    assert.ok(rei02 !== undefined)
    const ctx = contextFor(rei02.input)
    try {
      const documents = rei02.input.documents as Record<string, unknown>[]
      runImportOf(ctx, { ...rei02.input, document: documents[0] })
      try {
        runImportOf(ctx, { ...rei02.input, document: documents[1] })
        assert.fail('must refuse')
      } catch (error) {
        assert.equal((error as ImportError).code, 'IMPORT_EPOCH_EXISTS')
      }
    } finally {
      closeStorage(ctx.storage)
    }
  })

  test('F-7 lease trigger: same-lineage rerun with a live-lease claim refuses IMPORT_EPOCH_EXISTS (R3)', () => {
    const ctl01 = loadRows('controls.json').find((entry) => entry.id === 'CTL-01')
    assert.ok(ctl01 !== undefined)
    const ctx = contextFor(ctl01.input)
    try {
      runImportOf(ctx, ctl01.input)
      // Post-cutover a live lease exists on the imported goal (FK-P10 claim).
      insertLease(ctx.storage, {
        leaseId: 'lease-f7-1',
        goalId: 'goal-0001',
        ownerPrincipalRef: 'op-live',
        casRevision: 1,
      })
      assert.ok(getUnreleasedLease(ctx.storage, 'goal-0001') !== null, 'live lease seeded')
      const base = ctl01.input.document as {
        rows: Record<string, unknown>[]
        corpusDigest: string
      }
      // Fixture documents are parsed JSON: named one-line casts (boundary data).
      const firstRow = base.rows[0] as { claimedOperationalFacts: Record<string, unknown> }
      const rerun = {
        ...(base.rows[0] as Record<string, unknown>),
        claimedOperationalFacts: {
          ...firstRow.claimedOperationalFacts,
          claimedLeaseHolderPrincipalRef: 'op-rerun',
        },
      }
      const document = { ...base, rows: [rerun] }
      document.corpusDigest = corpusDigestOf(document.rows as never)
      try {
        runImport(ctx.importer, {
          importDocument: document,
          principalRef: REQUEST.principalRef,
          operationId: 'op-rerun-1',
        })
        assert.fail('must refuse')
      } catch (error) {
        const typed = error as ImportError
        assert.equal(typed.code, 'IMPORT_EPOCH_EXISTS', 'the epoch refusal — never DIVERGENCE_STOP(lease)')
      }
    } finally {
      closeStorage(ctx.storage)
    }
  })

  test('F-7 binding trigger: same-lineage rerun with a recorded-binding claim refuses IMPORT_EPOCH_EXISTS (R4)', () => {
    const ctl01 = loadRows('controls.json').find((entry) => entry.id === 'CTL-01')
    assert.ok(ctl01 !== undefined)
    const ctx = contextFor(ctl01.input)
    try {
      runImportOf(ctx, ctl01.input)
      const binding = {
        principalRef: 'op-bind',
        operationId: 'op-bind-1',
        repositoryRef: 'repo-1',
        worktreeRef: 'wt-1',
      }
      insertIdempotencyKey(ctx.storage, {
        ...binding,
        payloadDigest: `sha256:${'0'.repeat(64)}`,
      })
      assert.ok(getIdempotencyKey(ctx.storage, binding) !== null, 'recorded binding seeded')
      const base = ctl01.input.document as {
        rows: Record<string, unknown>[]
        corpusDigest: string
      }
      // Fixture documents are parsed JSON: named one-line casts (boundary data).
      const firstRow = base.rows[0] as { claimedOperationalFacts: Record<string, unknown> }
      const rerun = {
        ...(base.rows[0] as Record<string, unknown>),
        claimedOperationalFacts: {
          ...firstRow.claimedOperationalFacts,
          claimedBinding: binding,
        },
      }
      const document = { ...base, rows: [rerun] }
      document.corpusDigest = corpusDigestOf(document.rows as never)
      try {
        runImport(ctx.importer, {
          importDocument: document,
          principalRef: REQUEST.principalRef,
          operationId: 'op-rerun-2',
        })
        assert.fail('must refuse')
      } catch (error) {
        const typed = error as ImportError
        assert.equal(
          typed.code,
          'IMPORT_EPOCH_EXISTS',
          'the epoch refusal — never DIVERGENCE_STOP(idempotency)',
        )
      }
    } finally {
      closeStorage(ctx.storage)
    }
  })
})

// --- Controls CTL-01..10 -----------------------------------------------------

interface GoldenFile {
  state: { lineage: unknown; document: Record<string, unknown> }
  bytes: Record<string, string> & { renderedThroughEventSeq: number }
}

function golden(): GoldenFile {
  return JSON.parse(readFileSync(join(FIXTURES, 'golden', 'projection-golden.json'), 'utf8'))
}

function contextFromState(state: GoldenFile['state']): FixtureContext {
  return contextFor({ lineage: state.lineage, document: state.document })
}

describe('Controls (CTL-01..12)', () => {
  test('CTL-01 full import on a fresh ledger: epoch once, rows exact', () => {
    const row = loadRows('controls.json').find((entry) => entry.id === 'CTL-01')
    assert.ok(row !== undefined)
    const ctx = contextFor(row.input)
    try {
      const result = runImportOf(ctx, row.input)
      assert.deepEqual(result.importedGoalIds.sort(), ['goal-0001', 'goal-0002'])
      const goal1 = getGoal(ctx.storage, 'goal-0001')
      const goal2 = getGoal(ctx.storage, 'goal-0002')
      assert.equal(goal1?.status, 'active')
      assert.equal(goal1?.revision, 1, 'revision = 1 CAS baseline')
      assert.equal(goal2?.status, 'completed')
      assert.equal(goal2?.revision, 1)
      const events = readAllEvents(ctx.storage)
      assert.equal(events.filter((event) => event.kind === 'import.recorded').length, 2)
      assert.equal(
        events.filter((event) => event.kind === 'import.epoch').length,
        1,
        'epoch recorded once',
      )
      assert.equal(getAllEpochs(ctx.importer).length, 1)
      assert.equal(result.epoch.rowCount, 2)
      const claims = readImportedGoalClaims(ctx.storage)
      assert.equal(claims.length, 2)
      const completed = claims.find((claim) => claim.goalId === 'goal-0002')
      assert.equal(
        completed?.claimedApprovals.length,
        1,
        'evidence records only, never conclusions',
      )
    } finally {
      closeStorage(ctx.storage)
    }
  })

  test('CTL-11 valid 2-row same-goalId group imports cleanly (group-keyed write, R2)', () => {
    const row = loadRows('controls.json').find((entry) => entry.id === 'CTL-11')
    assert.ok(row !== undefined)
    const ctx = contextFor(row.input)
    try {
      const result = runImportOf(ctx, row.input)
      assert.deepEqual(result.importedGoalIds, ['goal-0001'], 'distinct group goals')
      const goal = getGoal(ctx.storage, 'goal-0001')
      assert.equal(goal?.revision, 1)
      assert.equal(goal?.status, 'active')
      const events = readAllEvents(ctx.storage)
      assert.equal(events.filter((event) => event.kind === 'import.recorded').length, 2, 'one event per ROW')
      assert.equal(events.filter((event) => event.kind === 'import.epoch').length, 1)
      assert.equal(result.recordedEventSeqs.length, 3)
      assert.equal(result.epoch.rowCount, 2, 'rowCount counts rows, not groups')
      const claims = readImportedGoalClaims(ctx.storage)
      assert.equal(claims.length, 2, 'per-row claims recorded')
      const withRefs = claims.filter((claim) => claim.claimedRatificationRefs.length > 0)
      assert.equal(withRefs.length, 1, 'evidence artifacts recorded per row')
    } finally {
      closeStorage(ctx.storage)
    }
  })

  test('R2 failing-when-broken: a group-invariant break refuses TYPED (never an untyped write failure)', () => {
    const row = loadRows('controls.json').find((entry) => entry.id === 'CTL-11')
    assert.ok(row !== undefined)
    const ctx = contextFor(row.input)
    try {
      const base = row.input.document as {
        rows: Record<string, unknown>[]
        corpusDigest: string
      }
      const disagreeing = {
        ...(base.rows[1] as Record<string, unknown>),
        claimedStatus: 'cancelled',
      }
      const document = { ...base, rows: [base.rows[0], disagreeing] }
      document.corpusDigest = corpusDigestOf(document.rows as never)
      runImport(ctx.importer, {
        importDocument: document,
        principalRef: REQUEST.principalRef,
        operationId: REQUEST.operationId,
      })
      assert.fail('must refuse')
    } catch (error) {
      const typed = error as ImportError
      assert.equal(typed.name, 'ImportError', 'typed refusal — never StorageError')
      assert.equal(typed.code, 'DIVERGENCE_STOP')
      assert.equal((typed.diagnostic as Record<string, string>).reasonCode, 'status')
      assertNothingImported(ctx, ['goal-0001'])
    } finally {
      closeStorage(ctx.storage)
    }
  })

  test('CTL-02 reopen reconstructs identical state (in-suite evidence only)', () => {
    const row = loadRows('controls.json').find((entry) => entry.id === 'CTL-01')
    assert.ok(row !== undefined)
    const ctx = contextFor(row.input)
    runImportOf(ctx, row.input)
    const before = {
      events: readAllEvents(ctx.storage).map((event) => [
        event.eventSeq,
        event.kind,
        event.payload,
      ]),
      claims: readImportedGoalClaims(ctx.storage),
      goal1: getGoal(ctx.storage, 'goal-0001'),
    }
    closeStorage(ctx.storage)
    const reopened = openStorage({
      storageRoot: ctx.dir,
      databaseFileName: 'state.db',
      createIfMissing: true,
      clock: fixedClock(1_700_000_000_000_001),
      backupPolicy: { root: join(ctx.dir, 'backups'), retentionDescriptor: null },
    })
    try {
      const after = {
        events: readAllEvents(reopened).map((event) => [event.eventSeq, event.kind, event.payload]),
        claims: readImportedGoalClaims(reopened),
        goal1: getGoal(reopened, 'goal-0001'),
      }
      assert.deepEqual(after, before)
    } finally {
      closeStorage(reopened)
    }
  })

  test('CTL-03/CTL-04 golden bytes for both views', () => {
    const file = golden()
    for (const view of ['md-goals-index', 'md-goal-ledger'] as const) {
      const ctx = contextFromState(file.state)
      try {
        runImport(ctx.importer, {
          importDocument: file.state.document,
          principalRef: REQUEST.principalRef,
          operationId: REQUEST.operationId,
        })
        const projector = createProjector({
          storage: ctx.storage,
          lineageReader: ctx.lineage,
        })
        const render = renderProjection(projector, { projectionId: view })
        assert.equal(
          new TextDecoder().decode(render.markdownBytes),
          file.bytes[view],
          `${view} golden bytes match`,
        )
        assert.equal(render.renderedThroughEventSeq, file.bytes.renderedThroughEventSeq)
      } finally {
        closeStorage(ctx.storage)
      }
    }
  })

  test('CTL-05 publish advances the cursor 0→N transactionally; republish is byte-identical', () => {
    const file = golden()
    const ctx = contextFromState(file.state)
    try {
      runImport(ctx.importer, {
        importDocument: file.state.document,
        principalRef: REQUEST.principalRef,
        operationId: REQUEST.operationId,
      })
      const projector = createProjector({ storage: ctx.storage, lineageReader: ctx.lineage })
      const first = publishProjection(projector, { projectionId: 'md-goals-index' })
      assert.equal(first.cursorBefore.lastAppliedEventSeq, 0)
      assert.equal(first.cursorAfter.lastAppliedEventSeq, first.renderedThroughEventSeq)
      const second = publishProjection(projector, { projectionId: 'md-goals-index' })
      assert.deepEqual(second.markdownBytes, first.markdownBytes, 'republish is byte-identical')
      assert.equal(second.cursorAfter.lastAppliedEventSeq, first.cursorAfter.lastAppliedEventSeq)
    } finally {
      closeStorage(ctx.storage)
    }
  })

  test('CTL-06 checkDivergence passes on a clean matrix (non-vacuous)', () => {
    const file = golden()
    const ctx = contextFromState(file.state)
    try {
      runImport(ctx.importer, {
        importDocument: file.state.document,
        principalRef: REQUEST.principalRef,
        operationId: REQUEST.operationId,
      })
      const projector = createProjector({ storage: ctx.storage, lineageReader: ctx.lineage })
      checkDivergence(projector)
      // Non-vacuous: the same matrix stops once committed Git-winner bytes
      // drift (a ratification-ref provenance blob changes after the epoch).
      const rows =
        (file.state.document.rows as {
          claimedRatificationRefs: {
            provenance: { sourcePath: string; sourceCommit: string }
          }[]
        }[]) ?? []
      const firstRef = rows[0]?.claimedRatificationRefs[0]
      assert.ok(firstRef !== undefined, 'golden state carries a ratification ref')
      ctx.lineage.addBlob(
        firstRef.provenance.sourceCommit,
        firstRef.provenance.sourcePath,
        new TextEncoder().encode('drifted'),
      )
      assert.throws(
        () => checkDivergence(projector),
        (error: Error & { code?: string }) => error.code === 'DIVERGENCE_STOP',
      )
    } finally {
      closeStorage(ctx.storage)
    }
  })

  test('CTL-07 evidenced approval renders through the projection sanitized', () => {
    const row = loadRows('controls.json').find((entry) => entry.id === 'CTL-07')
    assert.ok(row !== undefined)
    const ctx = contextFor(row.input)
    try {
      runImportOf(ctx, row.input)
      const projector = createProjector({ storage: ctx.storage, lineageReader: ctx.lineage })
      const ledger = new TextDecoder().decode(
        renderProjection(projector, { projectionId: 'md-goal-ledger' }).markdownBytes,
      )
      assert.ok(ledger.includes('refs/heads/main\\|evil\\`injection\\`'), 'sanitized form rendered')
      assert.ok(!ledger.includes('main|evil'), 'raw delimiter cannot survive')
    } finally {
      closeStorage(ctx.storage)
    }
  })

  test('CTL-08 import alongside pre-existing engine-created goals (collision only for same goalId)', () => {
    const row = loadRows('controls.json').find((entry) => entry.id === 'CTL-08')
    assert.ok(row !== undefined)
    const ctx = contextFor(row.input)
    try {
      runImportOf(ctx, row.input)
      assert.equal(getGoal(ctx.storage, 'goal-0001')?.status, 'active')
      assert.equal(getGoal(ctx.storage, 'goal-9000')?.revision, 3, 'pre-existing goal untouched')
    } finally {
      closeStorage(ctx.storage)
    }
  })

  test('CTL-09 the synthetic TEST corpus manifest imports cleanly (consumed exactly)', () => {
    const row = loadRows('controls.json').find((entry) => entry.id === 'CTL-09')
    assert.ok(row !== undefined)
    const manifest = JSON.parse(
      readFileSync(join(FIXTURES, 'corpus', 'test-corpus-manifest.json'), 'utf8'),
    ) as { items: { sourcePath: string; disposition: string }[] }
    const document = row.input.document as {
      corpusManifest: { items: { sourcePath: string; disposition: string }[] }
    }
    assert.deepEqual(document.corpusManifest.items, manifest.items, 'manifest consumed exactly')
    const excluded = manifest.items.filter((item) => item.disposition === 'excluded')
    assert.ok(excluded.length > 0)
    const ctx = contextFor(row.input)
    try {
      const result = runImportOf(ctx, row.input)
      assert.ok(!result.importedGoalIds.includes('docs/legacy/skipped.md'))
      assert.equal(result.importedGoalIds.length, 2, 'excluded items produce no rows')
      for (const item of excluded) {
        assert.ok(
          !readImportedGoalClaims(ctx.storage).some(
            (claim) => claim.source.sourcePath === item.sourcePath,
          ),
          'excluded disposition produces no row',
        )
      }
    } finally {
      closeStorage(ctx.storage)
    }
  })

  test('CTL-12 two lineages with colliding 48-bit prefixes both land (R5, OQ-7 promise)', () => {
    const row = loadRows('controls.json').find((entry) => entry.id === 'CTL-12')
    assert.ok(row !== undefined)
    const ctx = contextFor(row.input)
    try {
      const documents = row.input.documents as Record<string, unknown>[]
      const first = runImportOf(ctx, { ...row.input, document: documents[0] })
      const second = runImportOf(ctx, {
        ...row.input,
        document: documents[1],
        request: { ...REQUEST, operationId: 'op-0002' },
      })
      // The fixture really exercises prefix collision (failing-when-broken:
      // truncated ids would collide on impevt-<prefix>-0 and the second import
      // would die untyped).
      assert.equal(
        first.epoch.rootCommit.slice(0, 12),
        second.epoch.rootCommit.slice(0, 12),
        'roots collide on their 48-bit prefix',
      )
      assert.notEqual(first.epoch.rootCommit, second.epoch.rootCommit)
      const events = readAllEvents(ctx.storage)
      const eventIds = events.map((event) => event.eventId)
      assert.equal(new Set(eventIds).size, eventIds.length, 'event ids disjoint across lineages')
      assert.equal(events.length, 4, 'two import.recorded + one import.epoch per lineage')
      assert.equal(getAllEpochs(ctx.importer).length, 2, 'both lineages landed (OQ-7)')
      for (const eventId of eventIds) {
        assert.ok(
          eventId.includes(first.epoch.rootCommit) || eventId.includes(second.epoch.rootCommit),
          'ids embed the FULL rootCommit (no truncation)',
        )
      }
    } finally {
      closeStorage(ctx.storage)
    }
  })

  test('CTL-10 both commit-id shapes accepted (40-hex and 64-hex), each its own case', () => {
    const row = loadRows('controls.json').find((entry) => entry.id === 'CTL-10')
    assert.ok(row !== undefined)
    const ctx = contextFor(row.input)
    try {
      const documents = row.input.documents as Record<string, unknown>[]
      const first = runImportOf(ctx, { ...row.input, document: documents[0] })
      assert.equal(first.epoch.rootCommit.length, 40)
      const second = runImportOf(ctx, {
        ...row.input,
        document: documents[1],
        request: { ...REQUEST, operationId: 'op-0002' },
      })
      assert.equal(second.epoch.rootCommit.length, 64)
      assert.equal(getAllEpochs(ctx.importer).length, 2, 'one epoch per lineage (OQ-7)')
      const keyed = getEpoch(ctx.importer, { rootCommit: first.epoch.rootCommit })
      assert.equal(keyed?.rootCommit, first.epoch.rootCommit, 'getEpoch keyed by lineage root')
    } finally {
      closeStorage(ctx.storage)
    }
  })
})

// --- T1 machine-readable schemas (closed shapes) -----------------------------

describe('T1 machine-readable schemas (both files closed-shape conformant)', () => {
  interface SchemaNode {
    additionalProperties?: boolean
    required?: string[]
    properties?: Record<string, SchemaNode>
    $defs?: Record<string, SchemaNode>
  }

  function loadSchema(file: string): SchemaNode {
    return JSON.parse(
      readFileSync(join(FIXTURES, '..', '..', 'schemas', file), 'utf8'),
    ) as SchemaNode
  }

  function collectObjectDefs(node: SchemaNode, found: SchemaNode[]): void {
    if (node.additionalProperties !== undefined) found.push(node)
    for (const member of Object.values(node.properties ?? {})) collectObjectDefs(member, found)
    for (const def of Object.values(node.$defs ?? {})) collectObjectDefs(def, found)
  }

  test('every object definition is closed (additionalProperties: false)', () => {
    for (const file of ['legacy-import.schema.json', 'import-epoch.schema.json']) {
      const objects: SchemaNode[] = []
      collectObjectDefs(loadSchema(file), objects)
      assert.ok(objects.length > 0, `${file} carries object definitions`)
      for (const object of objects) {
        assert.equal(
          object.additionalProperties,
          false,
          `${file}: object definition must be closed`,
        )
      }
    }
  })

  test('required member sets match the T1 parser contract exactly', () => {
    const legacy = loadSchema('legacy-import.schema.json')
    assert.deepEqual([...(legacy.required ?? [])].sort(), [
      'apiVersion',
      'corpusDigest',
      'corpusManifest',
      'documentKind',
      'rows',
      'sourceLineage',
    ])
    const facts = legacy.$defs?.OperationalFacts
    assert.deepEqual(
      [...(facts?.required ?? [])].sort(),
      [
        'claimedBinding',
        'claimedHandoffCount',
        'claimedLeaseHolderPrincipalRef',
        'claimedPendingTransitionTarget',
        'claimedRevision',
        'claimedWakeupCount',
      ],
      'F-5 claimedBinding is a required facts member',
    )
    const claim = legacy.$defs?.ApprovalClaim
    assert.deepEqual(
      [...(claim?.required ?? [])].sort(),
      ['digest', 'evidenceKind', 'gitIdentity'],
      'provenance is absent-tolerant (FAB-01); the F05.4 trio is required',
    )
    const epoch = loadSchema('import-epoch.schema.json')
    assert.deepEqual([...(epoch.required ?? [])].sort(), [
      'corpusDigest',
      'corpusSourceRevision',
      'documentDigest',
      'epochId',
      'operationId',
      'principalRef',
      'recordedAtMicros',
      'rootCommit',
      'rowCount',
      'tipCommit',
      'toolVersion',
    ])
  })
})

// --- T3 zero-row invariants (failing-when-broken) ----------------------------

describe('T3 zero-row invariants (a write would break these named tests)', () => {
  test('an empty corpus refuses typed (the epoch event must bind a real goal)', () => {
    const source = loadRows('hostile/digest-mismatch.json')
    const base = source[0]?.input.document as {
      rows: Record<string, unknown>[]
      corpusDigest: string
    }
    const ctx = contextFor(source[0]?.input ?? {})
    try {
      const document = { ...base, rows: [] }
      document.corpusDigest = corpusDigestOf(document.rows as never)
      runImport(ctx.importer, {
        importDocument: document,
        principalRef: REQUEST.principalRef,
        operationId: REQUEST.operationId,
      })
      assert.fail('must refuse')
    } catch (error) {
      const typed = error as ImportError
      assert.equal(typed.code, 'IMPORT_ARGUMENT_INVALID')
      assert.deepEqual(typed.diagnostic, { fieldPath: '$.rows' })
      assertNothingImported(ctx, [])
    } finally {
      closeStorage(ctx.storage)
    }
  })

  test('import creates zero leases / zero transitions / zero idempotency_keys rows', () => {
    const row = loadRows('controls.json').find((entry) => entry.id === 'CTL-01')
    assert.ok(row !== undefined)
    const ctx = contextFor(row.input)
    try {
      runImportOf(ctx, row.input)
      for (const goalId of ['goal-0001', 'goal-0002']) {
        assert.equal(getUnreleasedLease(ctx.storage, goalId), null, 'zero leases rows')
        assert.equal(
          getGoal(ctx.storage, goalId)?.pendingTransitionId,
          null,
          'zero transitions rows',
        )
      }
      assert.equal(
        getIdempotencyKey(ctx.storage, {
          principalRef: REQUEST.principalRef,
          operationId: REQUEST.operationId,
          repositoryRef: 'repo-1',
          worktreeRef: 'wt-1',
        }),
        null,
        'zero idempotency_keys rows',
      )
    } finally {
      closeStorage(ctx.storage)
    }
  })
})
