/**
 * FK-P11 T7/T9 projection-cursor registry surface (F7): the CUR-01..CUR-04
 * hostile fixture class drives the ONE cursor write surface (`setProjectionCursor`,
 * also reached through `publishProjection`) against a fresh storage per row.
 *
 * The registry under test is the A1e CHECK set (`goal-state` reserved for FK-P10;
 * `md-goals-index` + `md-goal-ledger` registered for FK-P11) — never an
 * in-parcel constant grab. Three proofs ride together: one test per fixture row
 * (exact code + reason + diagnostic keys), the positive import write (both
 * registered cursors created at 0; `goal-state` readable, never written), and
 * the failing-when-broken substrate proof (a raw kernel-state cursor write of an
 * unregistered id is refused by the DB CHECK itself).
 */
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { type TestContext, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  closeStorage,
  fixedClock,
  getGoal,
  type OpenStorageConfig,
  openStorage,
  type Storage,
  StorageError,
  getProjectionCursor as substrateGetProjectionCursor,
  setProjectionCursor as substrateSetProjectionCursor,
} from '@foreman-line/kernel-state'
import { digestBytes } from '../src/canonical.js'
import {
  FK_P11_PROJECTION_IDS,
  getProjectionCursor,
  REGISTERED_PROJECTION_IDS,
  setProjectionCursor,
} from '../src/cursors.js'
import { IMPORT_ERROR_REGISTRY, type ImportError, isImportError } from '../src/errors.js'
import { corpusDigestOf, createImporter, readAllEvents, runImport } from '../src/import.js'
import type { ImportDocument, LegacyGoalRecord, SourceProvenance } from '../src/import-document.js'
import { createProjector, publishProjection } from '../src/projection.js'
import { FakeLineage } from './helpers/fake-lineage.js'

interface CursorFixtureRow {
  id: string
  input: {
    mode: 'cursor-write'
    projectionId: string
    request: { principalRef: string; operationId: string }
  }
  expectedCode?: string
  expectedOutcome?: string
  expectedReasonCode?: string
}

const HERE = dirname(fileURLToPath(import.meta.url))
const CURSOR_ROWS = JSON.parse(
  readFileSync(join(HERE, 'fixtures', 'hostile', 'cursors.json'), 'utf8'),
) as CursorFixtureRow[]

const T0_MICROS = 1_700_000_000_000_000

/** The declared F7 cursor enum (CUR-01..CUR-04), generated programmatically. */
const CURSOR_IDS = Array.from(
  { length: 4 },
  (_, index) => `CUR-${String(index + 1).padStart(2, '0')}`,
)

const ROOT_COMMIT = `${'a'.repeat(38)}01`
const TIP_COMMIT = `${'b'.repeat(38)}02`
const SOURCE_PATH = 'docs/goals/goal-0001.md'
const SOURCE_TEXT = '# Goal 0001\n'
const GOAL_ID = 'goal-0001'

/**
 * Inventory check: the row-derived ids (count included) must equal the declared
 * CUR-01..CUR-04 enum. Both directions of the comparison are covered by the
 * sorted-multiset equality, so a dropped or an extra row fails this check.
 */
function checkFixtureInventory(rows: readonly CursorFixtureRow[]): void {
  assert.deepEqual(
    rows.map((row) => row.id).sort(),
    [...CURSOR_IDS].sort(),
    'fixture ids must equal the declared CUR-01..CUR-04 enum',
  )
}

function storageConfigFor(root: string): OpenStorageConfig {
  return {
    storageRoot: root,
    databaseFileName: 'state.db',
    createIfMissing: true,
    clock: fixedClock(T0_MICROS),
    backupPolicy: { root, retentionDescriptor: null },
  }
}

/** One fresh FK-P9 storage per test; closed and removed at test end. */
function openFreshStorage(t: TestContext): Storage {
  const root = mkdtempSync(join(tmpdir(), 'fk-p11-cursor-'))
  const storage = openStorage(storageConfigFor(root))
  t.after(() => {
    closeStorage(storage)
    rmSync(root, { recursive: true, force: true })
  })
  return storage
}

/** Run `action`, requiring a typed `ImportError` refusal (never a bare throw). */
function captureImportError(action: () => unknown): ImportError {
  try {
    action()
  } catch (value) {
    if (isImportError(value)) return value
    throw new assert.AssertionError({ message: `expected ImportError, got ${String(value)}` })
  }
  throw new assert.AssertionError({ message: 'expected the call to refuse' })
}

/**
 * The safe-diagnostic shape: the diagnostic carries ONLY the members the
 * registry declares for its code (never a scraped message, never extras).
 */
function assertRegistryDiagnosticMembers(error: ImportError): void {
  const declared = [...IMPORT_ERROR_REGISTRY[error.code].diagnosticMembers].sort()
  assert.deepEqual(
    Object.keys(error.diagnostic).sort(),
    declared,
    'the diagnostic must carry exactly the registry-declared members',
  )
}

/** A refusal writes nothing: no events, no cursor rows (registered or attempted). */
function assertNothingImported(storage: Storage, attemptedProjectionId: string): void {
  assert.deepEqual(readAllEvents(storage), [], 'a refused cursor write records no events')
  for (const projectionId of REGISTERED_PROJECTION_IDS) {
    assert.equal(
      substrateGetProjectionCursor(storage, projectionId),
      null,
      `${projectionId} must stay row-exact absent`,
    )
  }
  if (attemptedProjectionId !== 'bad id!!') {
    assert.equal(
      substrateGetProjectionCursor(storage, attemptedProjectionId),
      null,
      `${attemptedProjectionId} must never land a cursor row`,
    )
  }
}

test('fixture inventory: row-derived ids equal the declared CUR-01..CUR-04 enum', () => {
  checkFixtureInventory(CURSOR_ROWS)
  for (const row of CURSOR_ROWS) {
    const outcomes =
      (row.expectedCode === undefined ? 0 : 1) + (row.expectedOutcome === undefined ? 0 : 1)
    assert.equal(outcomes, 1, `${row.id} must carry exactly one expected outcome`)
    assert.equal(row.input.mode, 'cursor-write')
  }
})

for (const row of CURSOR_ROWS) {
  test(`cursor fixture ${row.id}: ${row.input.projectionId} write refuses`, (t) => {
    const storage = openFreshStorage(t)
    const error = captureImportError(() => {
      setProjectionCursor(storage, {
        projectionId: row.input.projectionId,
        lastAppliedEventSeq: 0,
      })
    })
    assert.equal(error.code, row.expectedCode, `${row.id} must refuse with ${row.expectedCode}`)
    if (row.expectedReasonCode !== undefined) {
      assert.equal(error.diagnostic.reason, row.expectedReasonCode)
    }
    const expectedKeys =
      row.expectedCode === 'CURSOR_ID_UNREGISTERED' ? ['projectionId', 'reason'] : ['fieldPath']
    assert.deepEqual(Object.keys(error.diagnostic).sort(), expectedKeys)
    assertRegistryDiagnosticMembers(error)
    assertNothingImported(storage, row.input.projectionId)
  })
}

test('inventory check fails when a record is dropped (failing-when-broken proof)', () => {
  const droppedOne = CURSOR_ROWS.filter((row) => row.id !== 'CUR-01')
  assert.throws(() => checkFixtureInventory(droppedOne), assert.AssertionError)
})

test('successful import creates both registered FK-P11 cursors at lastAppliedEventSeq 0', (t) => {
  const storage = openFreshStorage(t)
  const lineage = new FakeLineage({
    commits: [
      { id: ROOT_COMMIT, parents: [] },
      { id: TIP_COMMIT, parents: [ROOT_COMMIT] },
    ],
    blobs: [{ commitId: TIP_COMMIT, sourcePath: SOURCE_PATH, text: SOURCE_TEXT }],
  })
  const importer = createImporter({
    storage,
    clock: fixedClock(T0_MICROS),
    toolVersion: 'kernel-import-cursor-test/1',
    lineageReader: lineage,
  })
  const result = runImport(importer, {
    importDocument: buildSuccessfulDocument(),
    principalRef: 'operator-1',
    operationId: 'op-0001',
  })
  assert.deepEqual(result.importedGoalIds, [GOAL_ID])

  // BOTH registered FK-P11 cursors exist (row-created, not merely absent) at 0.
  for (const projectionId of FK_P11_PROJECTION_IDS) {
    const cursor = getProjectionCursor(storage, projectionId)
    assert.equal(cursor.projectionId, projectionId)
    assert.equal(cursor.lastAppliedEventSeq, 0)
    const row = substrateGetProjectionCursor(storage, projectionId)
    assert.ok(row !== null, `${projectionId} must have been created at import`)
    assert.equal(row.lastAppliedEventSeq, 0)
  }

  // goal-state: FK-P11 READS it (0 when absent) and never writes it.
  assert.equal(getProjectionCursor(storage, 'goal-state').lastAppliedEventSeq, 0)
  assert.equal(substrateGetProjectionCursor(storage, 'goal-state'), null)
})

test('registry binds to the A1e DB CHECK: a raw unregistered write is refused', (t) => {
  const storage = openFreshStorage(t)
  let caught: unknown = null
  try {
    substrateSetProjectionCursor(storage, {
      projectionId: 'md-other-stream',
      lastAppliedEventSeq: 0,
    })
  } catch (value) {
    caught = value
  }
  assert.ok(caught instanceof StorageError, `expected a StorageError, got ${String(caught)}`)
  assert.equal(caught.code, 'STORAGE_CONSTRAINT_VIOLATION')
  assert.equal(caught.diagnostic.reasonCode, 'check')
  // The substrate names the refused constraint by its calling primitive's DDL
  // name (never scraped from driver message text): the projection_cursors
  // table's `ck_projection_registered` CHECK is what refused this row.
  assert.equal(caught.diagnostic.constraint, 'projection_cursors')
  // Fails at the DB CHECK itself: the row never materializes.
  assert.equal(substrateGetProjectionCursor(storage, 'md-other-stream'), null)
})

test('invented per-goal id fails via publishProjection public surface', (t) => {
  const storage = openFreshStorage(t)
  const projector = createProjector({ storage, lineageReader: new FakeLineage() })
  const error = captureImportError(() =>
    publishProjection(projector, { projectionId: `${'md-goal-detail'}.${GOAL_ID}` }),
  )
  assert.equal(error.code, 'CURSOR_ID_UNREGISTERED')
  assert.equal(error.diagnostic.projectionId, `md-goal-detail.${GOAL_ID}`)
  assert.equal(error.diagnostic.reason, 'unregistered')
  assert.deepEqual(Object.keys(error.diagnostic).sort(), ['projectionId', 'reason'])
  assertRegistryDiagnosticMembers(error)
  // A refused publish leaves no cursor row and imports no goal for the id.
  assert.equal(substrateGetProjectionCursor(storage, `md-goal-detail.${GOAL_ID}`), null)
  assert.equal(getGoal(storage, GOAL_ID), null)
})

function buildSuccessfulDocument(): ImportDocument {
  const sourceDigest = digestBytes(new TextEncoder().encode(SOURCE_TEXT))
  const source: SourceProvenance = {
    sourcePath: SOURCE_PATH,
    sourceDigest,
    sourceCommit: TIP_COMMIT,
  }
  const row: LegacyGoalRecord = {
    goalId: GOAL_ID,
    claimedStatus: 'active',
    source,
    claimedRatificationRefs: [],
    claimedApprovals: [],
    claimedOperationalFacts: {
      claimedRevision: null,
      claimedLeaseHolderPrincipalRef: null,
      claimedPendingTransitionTarget: null,
      claimedWakeupCount: null,
      claimedHandoffCount: null,
      claimedBinding: null,
    },
  }
  return {
    apiVersion: '0.1.0',
    documentKind: 'legacy-import',
    corpusDigest: corpusDigestOf([row]),
    sourceLineage: { rootCommit: ROOT_COMMIT, tipCommit: TIP_COMMIT },
    corpusManifest: {
      manifestKind: 'legacy-corpus-manifest',
      sourceRevision: TIP_COMMIT,
      items: [
        {
          sourcePath: SOURCE_PATH,
          sourceDigest,
          disposition: 'import',
          reason: 'legacy goal record',
        },
      ],
    },
    rows: [row],
  }
}
