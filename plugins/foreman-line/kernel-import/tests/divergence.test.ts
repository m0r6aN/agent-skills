/**
 * F5 — the DIVERGENCE_STOP conflict matrix (hostile fixtures CON-01..CON-10),
 * the field-conflict first-failure sub-order, the F-7 same-lineage re-import
 * exemption (epoch refusal, never a vs-recorded stop), and the post-cutover
 * drift contract: `checkDivergence` refuses with the CLASS reasonCode while the
 * projection render/publish paths refuse `projection-source-drift` and leave
 * the projection cursor unmoved.
 *
 * Driver contract: the fixture inventory is derived-count + set-equality with
 * CON-01..CON-10 (drop-a-row is failing-when-broken), seeds are applied before
 * `runImport`, and every refusal row asserts row-exact "nothing imported"
 * through the `readAllEvents` + `getProjectionCursor` + `getGoal` probes.
 */
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { type TestContext, test } from 'node:test'
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
  getProjectionCursor as substrateProjectionCursor,
} from '@foreman-line/kernel-state'
import { digestText } from '../src/canonical.js'
import { getProjectionCursor as readProjectionCursor } from '../src/cursors.js'
import {
  type ApprovalClaim,
  type ApprovalEvidenceKind,
  checkDivergence,
  corpusDigestOf,
  createImporter,
  createProjector,
  type DivergenceContext,
  FK_P11_PROJECTION_IDS,
  IMPORT_ERROR_REGISTRY,
  type ImportDocument,
  type ImportError,
  type Importer,
  isImportError,
  type LegacyGoalRecord,
  type OperationalFacts,
  type Projector,
  parseImportDocument,
  publishProjection,
  type RatificationRef,
  readAllEvents,
  renderProjection,
  runImport,
  type SourceProvenance,
} from '../src/index.js'
import { FakeLineage } from './helpers/fake-lineage.js'

// --- fixture inventory (BINDING schema: a JSON array of these rows) -----------

interface FixtureCommit {
  id: string
  parents: string[]
}

interface FixtureBlob {
  commitId: string
  sourcePath: string
  text: string
}

interface FixtureLineage {
  commits: FixtureCommit[]
  blobs: FixtureBlob[]
}

interface FixtureSeedGoal {
  goalId: string
  revision: number
  status: string
}

interface FixtureSeedLease {
  leaseId: string
  goalId: string
  ownerPrincipalRef: string
  casRevision: number
  acquiredAtMicros: number
  expiresAtMicros: number | null
  releasedAtMicros: number | null
}

interface FixtureSeedBinding {
  principalRef: string
  operationId: string
  repositoryRef: string
  worktreeRef: string
  payloadDigest: string
}

interface FixtureSeedEvent {
  eventId: string
  goalId: string
  kind: string
  payload: string
  payloadDigest: string
  principalRef: string
  operationId: string
  recordedAtMicros: number
}

interface FixtureSeed {
  goals: FixtureSeedGoal[]
  leases: FixtureSeedLease[]
  idempotencyKeys: FixtureSeedBinding[]
  events: FixtureSeedEvent[]
}

interface FixtureDriftStep {
  kind: string
  commitId: string
  sourcePath: string
  newText: string
  goalId: string
  fieldId: string
  expectedClassReasonCode: string
}

interface FixtureInput {
  mode: 'import' | 'render-drift'
  lineage: FixtureLineage
  seed: FixtureSeed
  document: ImportDocument
  request: { principalRef: string; operationId: string }
  drift?: FixtureDriftStep[]
}

interface ConflictFixtureRow {
  id: string
  input: FixtureInput
  expectedCode: 'DIVERGENCE_STOP'
  expectedReasonCode: string
}

const T0 = 1_700_000_000_000_000
const FIXTURE_PATH = join(import.meta.dirname, 'fixtures', 'hostile', 'conflicts.json')
const EXPECTED_IDS: readonly string[] = [
  'CON-01',
  'CON-02',
  'CON-03',
  'CON-04',
  'CON-05',
  'CON-06',
  'CON-07',
  'CON-08',
  'CON-09',
  'CON-10',
]

/** The declared fieldId per import-time field-conflict reasonCode (T5 table). */
const DIVERGENCE_FIELD_IDS: Record<string, string> = {
  status: 'claimedStatus',
  'ratification-fact': 'claimedRatificationRefs',
  'human-gate-fact': 'claimedApprovals',
  revision: 'claimedOperationalFacts.claimedRevision',
  lease: 'claimedOperationalFacts.claimedLeaseHolderPrincipalRef',
  'pending-transition': 'claimedOperationalFacts.claimedPendingTransitionTarget',
  'wakeup-handoff': 'claimedOperationalFacts.claimedWakeupCount',
  idempotency: 'claimedOperationalFacts.claimedBinding',
  'existing-state-collision': 'goalId',
}

const FIXTURES = JSON.parse(readFileSync(FIXTURE_PATH, 'utf8')) as ConflictFixtureRow[]

// --- driver ------------------------------------------------------------------

interface Harness {
  storage: Storage
  lineage: FakeLineage
  importer: Importer
  projector: Projector
}

function createHarness(t: TestContext, lineageSeed: FixtureLineage): Harness {
  const root = mkdtempSync(join(tmpdir(), 'fk-p11-con-'))
  const config: OpenStorageConfig = {
    storageRoot: root,
    databaseFileName: 'state.db',
    createIfMissing: true,
    clock: fixedClock(T0),
    backupPolicy: { root, retentionDescriptor: null },
  }
  const storage = openStorage(config)
  t.after(() => {
    closeStorage(storage)
    rmSync(root, { recursive: true, force: true })
  })
  const lineage = new FakeLineage(lineageSeed)
  return {
    storage,
    lineage,
    importer: createImporter({
      storage,
      clock: fixedClock(T0),
      toolVersion: 'divergence-con-0.1.0',
      lineageReader: lineage,
    }),
    projector: createProjector({ storage, lineageReader: lineage }),
  }
}

function applySeed(storage: Storage, seed: FixtureSeed): void {
  for (const goal of seed.goals) {
    insertGoal(storage, { goalId: goal.goalId, revision: goal.revision, status: goal.status })
  }
  for (const lease of seed.leases) {
    insertLease(storage, {
      leaseId: lease.leaseId,
      goalId: lease.goalId,
      ownerPrincipalRef: lease.ownerPrincipalRef,
      casRevision: lease.casRevision,
      acquiredAtMicros: lease.acquiredAtMicros,
      expiresAtMicros: lease.expiresAtMicros,
      releasedAtMicros: lease.releasedAtMicros,
    })
  }
  for (const key of seed.idempotencyKeys) {
    insertIdempotencyKey(storage, {
      principalRef: key.principalRef,
      operationId: key.operationId,
      repositoryRef: key.repositoryRef,
      worktreeRef: key.worktreeRef,
      payloadDigest: key.payloadDigest,
    })
  }
  for (const event of seed.events) {
    insertEvent(storage, {
      eventId: event.eventId,
      goalId: event.goalId,
      kind: event.kind,
      payload: event.payload,
      payloadDigest: event.payloadDigest,
      principalRef: event.principalRef,
      operationId: event.operationId,
      recordedAtMicros: event.recordedAtMicros,
    })
  }
}

function captureRefusal(run: () => unknown): ImportError {
  try {
    run()
  } catch (value) {
    assert.ok(isImportError(value), `expected an ImportError, got: ${String(value)}`)
    return value
  }
  assert.fail('expected a refusal, but the operation completed')
}

/** The safe-diagnostic shape: exactly `{ reasonCode, goalId, fieldId }`, values pinned. */
function assertDivergenceStop(
  error: ImportError,
  reasonCode: string,
  goalId: string,
  fieldId: string,
): void {
  assert.equal(error.code, 'DIVERGENCE_STOP')
  assert.equal(error.message, 'DIVERGENCE_STOP')
  const declared = [...IMPORT_ERROR_REGISTRY.DIVERGENCE_STOP.diagnosticMembers].sort()
  assert.deepEqual(declared, ['fieldId', 'goalId', 'reasonCode'])
  assert.deepEqual(Object.keys(error.diagnostic).sort(), ['fieldId', 'goalId', 'reasonCode'])
  assert.equal(error.diagnostic.reasonCode, reasonCode)
  assert.equal(error.diagnostic.goalId, goalId)
  assert.equal(error.diagnostic.fieldId, fieldId)
}

/** Row-exact "nothing imported": events/cursors/goals probes + seed unchanged. */
function assertNothingImported(storage: Storage, input: FixtureInput): void {
  const events = readAllEvents(storage)
  assert.equal(events.length, input.seed.events.length, 'no new events may appear')
  for (const [index, seeded] of input.seed.events.entries()) {
    const actual = events[index]
    assert.ok(actual !== undefined)
    assert.deepEqual(
      {
        eventId: actual.eventId,
        goalId: actual.goalId,
        kind: actual.kind,
        payload: actual.payload,
        payloadDigest: actual.payloadDigest,
        principalRef: actual.principalRef,
        operationId: actual.operationId,
        recordedAtMicros: actual.recordedAtMicros,
      },
      seeded,
    )
  }
  for (const projectionId of FK_P11_PROJECTION_IDS) {
    assert.equal(readProjectionCursor(storage, projectionId).lastAppliedEventSeq, 0)
    assert.equal(substrateProjectionCursor(storage, projectionId), null, 'no cursor row may exist')
  }
  const goalIds = new Set<string>()
  for (const goal of input.seed.goals) goalIds.add(goal.goalId)
  for (const record of input.document.rows) goalIds.add(record.goalId)
  for (const goalId of goalIds) {
    const seeded = input.seed.goals.find((goal) => goal.goalId === goalId)
    const recorded = getGoal(storage, goalId)
    if (seeded === undefined) {
      assert.equal(recorded, null, `goal ${goalId} must stay absent`)
      continue
    }
    assert.deepEqual(recorded, {
      goalId: seeded.goalId,
      revision: seeded.revision,
      status: seeded.status,
      pendingTransitionId: null,
      updatedAtMicros: T0,
    })
  }
  for (const lease of input.seed.leases) {
    assert.deepEqual(getUnreleasedLease(storage, lease.goalId), {
      leaseId: lease.leaseId,
      goalId: lease.goalId,
      ownerPrincipalRef: lease.ownerPrincipalRef,
      casRevision: lease.casRevision,
      acquiredAtMicros: lease.acquiredAtMicros,
      expiresAtMicros: lease.expiresAtMicros,
      releasedAtMicros: lease.releasedAtMicros,
    })
  }
  for (const key of input.seed.idempotencyKeys) {
    const recordedKey = getIdempotencyKey(storage, key)
    assert.ok(recordedKey !== null, 'the seeded binding must be unchanged')
    assert.equal(recordedKey.principalRef, key.principalRef)
    assert.equal(recordedKey.operationId, key.operationId)
    assert.equal(recordedKey.repositoryRef, key.repositoryRef)
    assert.equal(recordedKey.worktreeRef, key.worktreeRef)
    assert.equal(recordedKey.payloadDigest, key.payloadDigest)
  }
}

function assertProvenanceDigestReal(
  rowId: string,
  digestByBlob: Map<string, string>,
  provenance: SourceProvenance,
): void {
  const expected = digestByBlob.get(`${provenance.sourceCommit}\n${provenance.sourcePath}`)
  assert.ok(expected !== undefined, `${rowId}: lineage blob missing for ${provenance.sourcePath}`)
  assert.equal(provenance.sourceDigest, expected, `${rowId}: sourceDigest must be real`)
}

/** Fixture digests are real: recomputed over the exact lineage blob texts. */
function assertFixtureDigestsAreReal(row: ConflictFixtureRow): void {
  const document = parseImportDocument(row.input.document)
  assert.equal(
    document.corpusDigest,
    corpusDigestOf(document.rows),
    `${row.id}: corpusDigest must be the real corpus digest`,
  )
  const digestByBlob = new Map<string, string>()
  for (const blob of row.input.lineage.blobs) {
    digestByBlob.set(`${blob.commitId}\n${blob.sourcePath}`, digestText(blob.text))
  }
  for (const record of document.rows) {
    assertProvenanceDigestReal(row.id, digestByBlob, record.source)
    for (const ref of record.claimedRatificationRefs) {
      assertProvenanceDigestReal(row.id, digestByBlob, ref.provenance)
      const expected = digestByBlob.get(
        `${ref.provenance.sourceCommit}\n${ref.provenance.sourcePath}`,
      )
      assert.equal(ref.digest, expected, `${row.id}: ratification ref digest must be real`)
    }
    for (const claim of record.claimedApprovals) {
      if (claim.provenance === null) continue
      assertProvenanceDigestReal(row.id, digestByBlob, claim.provenance)
      const expected = digestByBlob.get(
        `${claim.provenance.sourceCommit}\n${claim.provenance.sourcePath}`,
      )
      assert.equal(claim.digest, expected, `${row.id}: approval digest must be real`)
    }
  }
  for (const event of row.input.seed.events) {
    assert.equal(
      event.payloadDigest,
      digestText(event.payload),
      `${row.id}: payloadDigest must be real`,
    )
  }
}

function restoreBlobs(lineage: FakeLineage, blobs: readonly FixtureBlob[]): void {
  for (const blob of blobs) {
    lineage.addBlob(blob.commitId, blob.sourcePath, new TextEncoder().encode(blob.text))
  }
}

function runImportFor(harness: Harness, input: FixtureInput): void {
  runImport(harness.importer, {
    importDocument: input.document,
    principalRef: input.request.principalRef,
    operationId: input.request.operationId,
  })
}

// CON-10: valid import first, then lineage blob replacement post-cutover.
function runRenderDriftScenario(harness: Harness, row: ConflictFixtureRow): void {
  const driftSteps = row.input.drift
  assert.ok(driftSteps !== undefined && driftSteps.length > 0, `${row.id}: drift steps required`)
  assert.equal(row.expectedReasonCode, 'projection-source-drift')
  const result = runImport(harness.importer, {
    importDocument: row.input.document,
    principalRef: row.input.request.principalRef,
    operationId: row.input.request.operationId,
  })
  assert.deepEqual(
    result.importedGoalIds,
    row.input.document.rows.map((record) => record.goalId),
  )
  const ctx: DivergenceContext = { storage: harness.storage, gateway: harness.importer.gateway }
  assert.doesNotThrow(() => checkDivergence(ctx), 'the clean matrix must pass checkDivergence')
  assert.doesNotThrow(
    () => renderProjection(harness.projector, { projectionId: 'md-goal-ledger' }),
    'the clean matrix must render',
  )
  for (const [index, step] of driftSteps.entries()) {
    restoreBlobs(harness.lineage, row.input.lineage.blobs)
    harness.lineage.addBlob(step.commitId, step.sourcePath, new TextEncoder().encode(step.newText))
    const classRefusal = captureRefusal(() => checkDivergence(ctx))
    assertDivergenceStop(classRefusal, step.expectedClassReasonCode, step.goalId, step.fieldId)
    const renderRefusal = captureRefusal(() =>
      renderProjection(harness.projector, { projectionId: 'md-goal-ledger' }),
    )
    assertDivergenceStop(renderRefusal, 'projection-source-drift', step.goalId, step.fieldId)
    if (index === 0) {
      const before = readProjectionCursor(harness.storage, 'md-goals-index')
      const publishRefusal = captureRefusal(() =>
        publishProjection(harness.projector, { projectionId: 'md-goals-index' }),
      )
      assertDivergenceStop(publishRefusal, 'projection-source-drift', step.goalId, step.fieldId)
      assert.deepEqual(
        readProjectionCursor(harness.storage, 'md-goals-index'),
        before,
        'a refused publish leaves the projection cursor unmoved',
      )
    }
  }
}

// --- plain-test document builders (real digests over in-test blob texts) -----

function provenanceOf(commit: string, blob: FixtureBlob): SourceProvenance {
  return { sourcePath: blob.sourcePath, sourceDigest: digestText(blob.text), sourceCommit: commit }
}

function ratificationRefOf(
  gitIdentity: string,
  commit: string,
  blob: FixtureBlob,
): RatificationRef {
  return { gitIdentity, digest: digestText(blob.text), provenance: provenanceOf(commit, blob) }
}

function approvalClaimOf(
  evidenceKind: ApprovalEvidenceKind,
  gitIdentity: string,
  commit: string,
  blob: FixtureBlob,
): ApprovalClaim {
  return {
    evidenceKind,
    gitIdentity,
    digest: digestText(blob.text),
    provenance: provenanceOf(commit, blob),
  }
}

function blankOperationalFacts(): OperationalFacts {
  return {
    claimedRevision: null,
    claimedLeaseHolderPrincipalRef: null,
    claimedPendingTransitionTarget: null,
    claimedWakeupCount: null,
    claimedHandoffCount: null,
    claimedBinding: null,
  }
}

function goalRecordOf(
  goalId: string,
  claimedStatus: string,
  source: SourceProvenance,
  claimedOperationalFacts: OperationalFacts,
  claimedRatificationRefs: RatificationRef[] = [],
  claimedApprovals: ApprovalClaim[] = [],
): LegacyGoalRecord {
  return {
    goalId,
    claimedStatus,
    source,
    claimedRatificationRefs,
    claimedApprovals,
    claimedOperationalFacts,
  }
}

function importDocumentOf(
  rootCommit: string,
  tipCommit: string,
  rows: LegacyGoalRecord[],
  blobs: FixtureBlob[],
): ImportDocument {
  const seenPaths = new Map<string, FixtureBlob>()
  for (const blob of blobs) seenPaths.set(blob.sourcePath, blob)
  const items = [...seenPaths.values()]
    .sort((a, b) => (a.sourcePath < b.sourcePath ? -1 : 1))
    .map((blob) => ({
      sourcePath: blob.sourcePath,
      sourceDigest: digestText(blob.text),
      disposition: 'import' as const,
      reason: 'legacy corpus extraction',
    }))
  return {
    apiVersion: '0.1.0',
    documentKind: 'legacy-import',
    corpusDigest: corpusDigestOf(rows),
    sourceLineage: { rootCommit, tipCommit },
    corpusManifest: { manifestKind: 'legacy-corpus-manifest', sourceRevision: tipCommit, items },
    rows,
  }
}

// --- fixture inventory -------------------------------------------------------

function assertFixtureInventory(rows: readonly ConflictFixtureRow[]): void {
  assert.equal(
    rows.length,
    EXPECTED_IDS.length,
    'fixture count must derive from the expected id set (CON-01..CON-10)',
  )
  const seen = new Set<string>()
  for (const row of rows) {
    assert.ok(!seen.has(row.id), `duplicate fixture id: ${row.id}`)
    seen.add(row.id)
  }
  assert.deepEqual([...seen].sort(), [...EXPECTED_IDS].sort(), 'ids must equal CON-01..CON-10')
}

test('fixture inventory: derived count + set-equality with CON-01..CON-10', () => {
  assertFixtureInventory(FIXTURES)
})

test('fixture inventory check is failing-when-broken (drop-a-row)', () => {
  const droppedOne = FIXTURES.slice(1)
  assert.throws(() => assertFixtureInventory(droppedOne), assert.AssertionError)
})

// --- one test per fixture row ------------------------------------------------

for (const row of FIXTURES) {
  test(`${row.id} stops with DIVERGENCE_STOP / ${row.expectedReasonCode}`, (t) => {
    assertFixtureDigestsAreReal(row)
    const harness = createHarness(t, row.input.lineage)
    applySeed(harness.storage, row.input.seed)
    if (row.input.mode === 'render-drift') {
      runRenderDriftScenario(harness, row)
      return
    }
    const refusal = captureRefusal(() => {
      runImportFor(harness, row.input)
    })
    const firstRow = row.input.document.rows[0]
    assert.ok(firstRow !== undefined, 'fixture documents carry at least one row')
    const expectedFieldId = DIVERGENCE_FIELD_IDS[row.expectedReasonCode]
    assert.ok(
      expectedFieldId !== undefined,
      `${row.id}: no fieldId declared for ${row.expectedReasonCode}`,
    )
    assertDivergenceStop(refusal, row.expectedReasonCode, firstRow.goalId, expectedFieldId)
    assertNothingImported(harness.storage, row.input)
  })
}

// --- CTL-style plain test (not a fixture row) --------------------------------

const CTL_ROOT = 'a'.repeat(36) + 'c001'
const CTL_TIP = 'b'.repeat(36) + 'c001'

test('CTL: checkDivergence passes on a clean matrix and really re-derives claims', (t) => {
  const sourceBlob: FixtureBlob = {
    commitId: CTL_TIP,
    sourcePath: 'docs/goals/ctl-goal.md',
    text: 'CTL legacy goal-x record\n',
  }
  const ratBlob: FixtureBlob = {
    commitId: CTL_TIP,
    sourcePath: 'docs/refs/ctl-rat.md',
    text: 'CTL ratified spec bytes\n',
  }
  const appBlob: FixtureBlob = {
    commitId: CTL_TIP,
    sourcePath: 'docs/refs/ctl-app.md',
    text: 'CTL approval evidence bytes\n',
  }
  const record = goalRecordOf(
    'goal-x',
    'active',
    provenanceOf(CTL_TIP, sourceBlob),
    blankOperationalFacts(),
    [ratificationRefOf('refs/legacy/spec-1', CTL_TIP, ratBlob)],
    [approvalClaimOf('commit-ref', 'refs/legacy/approval-1', CTL_TIP, appBlob)],
  )
  const document = importDocumentOf(CTL_ROOT, CTL_TIP, [record], [sourceBlob, ratBlob, appBlob])
  const harness = createHarness(t, {
    commits: [
      { id: CTL_ROOT, parents: [] },
      { id: CTL_TIP, parents: [CTL_ROOT] },
    ],
    blobs: [sourceBlob, ratBlob, appBlob],
  })
  const result = runImport(harness.importer, {
    importDocument: document,
    principalRef: 'operator-1',
    operationId: 'op-0001',
  })
  assert.deepEqual(result.importedGoalIds, ['goal-x'])
  const ctx: DivergenceContext = { storage: harness.storage, gateway: harness.importer.gateway }
  assert.doesNotThrow(() => checkDivergence(ctx), 'the clean matrix must pass')
  // Non-vacuity: the claims are really re-derived through the lineage seam.
  harness.lineage.addBlob(
    CTL_TIP,
    ratBlob.sourcePath,
    new TextEncoder().encode('CTL ratified spec bytes drifted\n'),
  )
  const ratRefusal = captureRefusal(() => checkDivergence(ctx))
  assertDivergenceStop(ratRefusal, 'ratification-fact', 'goal-x', 'claimedRatificationRefs.digest')
  restoreBlobs(harness.lineage, [sourceBlob, ratBlob, appBlob])
  assert.doesNotThrow(() => checkDivergence(ctx), 'restored bytes must pass again')
  harness.lineage.addBlob(
    CTL_TIP,
    appBlob.sourcePath,
    new TextEncoder().encode('CTL approval evidence bytes drifted\n'),
  )
  const appRefusal = captureRefusal(() => checkDivergence(ctx))
  assertDivergenceStop(appRefusal, 'human-gate-fact', 'goal-x', 'claimedApprovals.digest')
})

// --- precedence-edge plain tests ---------------------------------------------

const SUB_ROOT = 'a'.repeat(36) + 'd001'
const SUB_TIP = 'b'.repeat(36) + 'd001'

test('field-conflict sub-order: a status conflict fires before a revision conflict', (t) => {
  const blobA: FixtureBlob = {
    commitId: SUB_TIP,
    sourcePath: 'docs/goals/sub-a.md',
    text: 'sub-order record A claiming revision 5\n',
  }
  const blobB: FixtureBlob = {
    commitId: SUB_TIP,
    sourcePath: 'docs/goals/sub-b.md',
    text: 'sub-order record B claiming revision 5\n',
  }
  const rows = [
    goalRecordOf('goal-x', 'active', provenanceOf(SUB_TIP, blobA), {
      ...blankOperationalFacts(),
      claimedRevision: 5,
    }),
    goalRecordOf('goal-x', 'awaiting-human', provenanceOf(SUB_TIP, blobB), {
      ...blankOperationalFacts(),
      claimedRevision: 5,
    }),
  ]
  const document = importDocumentOf(SUB_ROOT, SUB_TIP, rows, [blobA, blobB])
  const harness = createHarness(t, {
    commits: [
      { id: SUB_ROOT, parents: [] },
      { id: SUB_TIP, parents: [SUB_ROOT] },
    ],
    blobs: [blobA, blobB],
  })
  applySeed(harness.storage, {
    goals: [{ goalId: 'goal-x', revision: 1, status: 'active' }],
    leases: [],
    idempotencyKeys: [],
    events: [],
  })
  const refusal = captureRefusal(() => {
    runImport(harness.importer, {
      importDocument: document,
      principalRef: 'operator-1',
      operationId: 'op-0001',
    })
  })
  assertDivergenceStop(refusal, 'status', 'goal-x', 'claimedStatus')
})

const EPOCH_ROOT = 'a'.repeat(36) + 'e001'
const EPOCH_TIP = 'b'.repeat(36) + 'e001'

test('F-7: a same-lineage re-import with a field conflict refuses IMPORT_EPOCH_EXISTS', (t) => {
  const blobA: FixtureBlob = {
    commitId: EPOCH_TIP,
    sourcePath: 'docs/goals/epoch-a.md',
    text: 'epoch first import record\n',
  }
  const blobB: FixtureBlob = {
    commitId: EPOCH_TIP,
    sourcePath: 'docs/goals/epoch-b.md',
    text: 'epoch second import record\n',
  }
  const harness = createHarness(t, {
    commits: [
      { id: EPOCH_ROOT, parents: [] },
      { id: EPOCH_TIP, parents: [EPOCH_ROOT] },
    ],
    blobs: [blobA, blobB],
  })
  const first = importDocumentOf(
    EPOCH_ROOT,
    EPOCH_TIP,
    [goalRecordOf('goal-x', 'active', provenanceOf(EPOCH_TIP, blobA), blankOperationalFacts())],
    [blobA],
  )
  runImport(harness.importer, {
    importDocument: first,
    principalRef: 'operator-1',
    operationId: 'op-0001',
  })
  // Conflicting second document (status + revision vs the recorded epoch state).
  const second = importDocumentOf(
    EPOCH_ROOT,
    EPOCH_TIP,
    [
      goalRecordOf('goal-x', 'awaiting-human', provenanceOf(EPOCH_TIP, blobB), {
        ...blankOperationalFacts(),
        claimedRevision: 5,
      }),
    ],
    [blobA, blobB],
  )
  const refusal = captureRefusal(() => {
    runImport(harness.importer, {
      importDocument: second,
      principalRef: 'operator-1',
      operationId: 'op-0002',
    })
  })
  assert.equal(refusal.code, 'IMPORT_EPOCH_EXISTS')
  assert.deepEqual(Object.keys(refusal.diagnostic).sort(), ['epochId', 'rootCommit'])
  assert.equal(refusal.diagnostic.rootCommit, EPOCH_ROOT)
  assert.equal(refusal.diagnostic.epochId, `imp-epoch-${EPOCH_ROOT}`)
})

const LEASE_ROOT = 'a'.repeat(36) + 'f001'
const LEASE_TIP = 'b'.repeat(36) + 'f001'

test('lease second trigger: a legacy holder claim vs a live unreleased lease', (t) => {
  const blob: FixtureBlob = {
    commitId: LEASE_TIP,
    sourcePath: 'docs/goals/lease-goal.md',
    text: 'lease second trigger record\n',
  }
  const record = goalRecordOf('goal-y', 'active', provenanceOf(LEASE_TIP, blob), {
    ...blankOperationalFacts(),
    claimedLeaseHolderPrincipalRef: 'op-9',
  })
  const document = importDocumentOf(LEASE_ROOT, LEASE_TIP, [record], [blob])
  const harness = createHarness(t, {
    commits: [
      { id: LEASE_ROOT, parents: [] },
      { id: LEASE_TIP, parents: [LEASE_ROOT] },
    ],
    blobs: [blob],
  })
  applySeed(harness.storage, {
    goals: [{ goalId: 'goal-y', revision: 1, status: 'active' }],
    leases: [
      {
        leaseId: 'lease-1',
        goalId: 'goal-y',
        ownerPrincipalRef: 'op-1',
        casRevision: 1,
        acquiredAtMicros: 0,
        expiresAtMicros: null,
        releasedAtMicros: null,
      },
    ],
    idempotencyKeys: [],
    events: [],
  })
  const refusal = captureRefusal(() => {
    runImport(harness.importer, {
      importDocument: document,
      principalRef: 'operator-1',
      operationId: 'op-0001',
    })
  })
  assertDivergenceStop(
    refusal,
    'lease',
    'goal-y',
    'claimedOperationalFacts.claimedLeaseHolderPrincipalRef',
  )
  assert.deepEqual(getGoal(harness.storage, 'goal-y'), {
    goalId: 'goal-y',
    revision: 1,
    status: 'active',
    pendingTransitionId: null,
    updatedAtMicros: T0,
  })
  assert.notEqual(getUnreleasedLease(harness.storage, 'goal-y'), null)
})
