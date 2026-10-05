/**
 * FK-P11 F1 hostile fixture class (FAB-01..FAB-12) — the approval-evidence
 * refusals and the document-shape refusals that guard them.
 *
 * Carries: (1) the fixture inventory — the row-derived ids are set-equal to the
 * programmatically generated FAB-01..FAB-12 enum, never a hand-typed total
 * (dropping a row in memory fails the map — failing-when-broken); (2) one full
 * driver test per row (seed -> FakeLineage -> openStorage -> runImport) asserting
 * the pre-declared code + reason + the safe-diagnostic shape (exactly the
 * declared `IMPORT_ERROR_REGISTRY` members) + nothing imported; (3) the named T3
 * invariants: (a) the gate-state smuggle mutation refuses
 * `IMPORT_ARGUMENT_INVALID` and no FK-P11 shape carries a gate member/column,
 * (b) the zero-row proof — after ANY refused run zero events are recorded and
 * both projection cursors are absent/0, (c) the positive control — a `completed`
 * row with one VALID evidenced claim imports cleanly, its claims land only as
 * `import.recorded` payload + `import.approval` artifacts rows and NEVER as
 * `transitions` / `leases` / `idempotency_keys` rows.
 *
 * Every fixture digest is real: computed over the exact UTF-8 bytes of the
 * lineage blob texts the row seeds (absent-blob claims carry the digest of the
 * evidence text the row seeds at an earlier commit — the blob was deleted before
 * the claimed commit). Every document's `corpusDigest` re-derives via
 * `corpusDigestOf` (re-asserted per row before the run: the digest phase runs
 * before the approval phase, so a wrong corpusDigest would misfire the row).
 */
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  closeStorage,
  type ExportPayload,
  exportStorage,
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
import { FK_P11_PROJECTION_IDS, getProjectionCursor } from '../src/cursors.js'
import {
  ARTIFACT_KIND_APPROVAL,
  ARTIFACT_KIND_EPOCH,
  corpusDigestOf,
  createImporter,
  IMPORT_EPOCH_KIND,
  IMPORT_ERROR_REGISTRY,
  IMPORT_RECORDED_KIND,
  type ImportDocument,
  ImportError,
  type ImportErrorCode,
  type ImportedGoalClaims,
  type Importer,
  type ImportResult,
  type LegacyGoalRecord,
  type OperationalFacts,
  parseImportDocument,
  readAllEvents,
  readImportedGoalClaims,
  runImport,
  type SourceProvenance,
} from '../src/index.js'
import { FakeLineage } from './helpers/fake-lineage.js'

const HERE = dirname(fileURLToPath(import.meta.url))

// --- fixture wire shapes (the BINDING hostile-row schema) --------------------

interface LineageBlob {
  commitId: string
  sourcePath: string
  text: string
}

interface LineageSeed {
  commits: { id: string; parents: string[] }[]
  blobs: LineageBlob[]
}

interface SeedGoal {
  goalId: string
  revision: number
  status: string
}

interface SeedLease {
  leaseId: string
  goalId: string
  ownerPrincipalRef: string
  casRevision: number
  acquiredAtMicros: number
  expiresAtMicros: number | null
  releasedAtMicros: number | null
}

interface SeedIdempotencyKey {
  principalRef: string
  operationId: string
  repositoryRef: string
  worktreeRef: string
  payloadDigest: string
}

interface SeedEvent {
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
  goals: SeedGoal[]
  leases: SeedLease[]
  idempotencyKeys: SeedIdempotencyKey[]
  events: SeedEvent[]
}

interface FixtureRequest {
  principalRef: string
  operationId: string
}

interface FixtureInput {
  lineage: LineageSeed
  seed: FixtureSeed
  document: unknown
  request: FixtureRequest
}

interface FixtureRow {
  id: string
  input: FixtureInput
  expectedCode?: ImportErrorCode
  expectedOutcome?: string
  expectedReasonCode?: string
}

/** The minimal wire view needed to re-derive `corpusDigestOf` before a run. */
interface WireRowSource {
  source: SourceProvenance
}

/** The whole-substrate row map (FK-P9 `ExportPayload.tables`), used for exact snapshots. */
type LedgerTables = ExportPayload['tables']

const ROWS = JSON.parse(
  readFileSync(join(HERE, 'fixtures', 'hostile', 'approvals.json'), 'utf8'),
) as FixtureRow[]

/** The declared F1 enum (FAB-01..FAB-12), generated programmatically. */
const FAB_IDS = Array.from(
  { length: 12 },
  (_, index) => `FAB-${String(index + 1).padStart(2, '0')}`,
)

// --- fixture inventory (derived; failing-when-broken) ------------------------

function assertFixtureInventory(rows: readonly FixtureRow[]): void {
  assert.deepEqual(
    rows.map((row) => row.id).sort(),
    [...FAB_IDS].sort(),
    'fixture ids must equal the declared FAB-01..FAB-12 enum (set-equality)',
  )
  for (const row of rows) {
    const outcomes = [row.expectedCode, row.expectedOutcome].filter((value) => value !== undefined)
    assert.equal(outcomes.length, 1, `${row.id} carries exactly one pre-declared outcome`)
  }
}

test('fixture inventory: row-derived ids equal the declared FAB-01..FAB-12 enum', () => {
  assertFixtureInventory(ROWS)
})

test('inventory check fails when a row is dropped (failing-when-broken proof)', () => {
  const droppedOne = ROWS.filter((row) => row.id !== 'FAB-05')
  assert.throws(() => assertFixtureInventory(droppedOne), assert.AssertionError)
})

// --- driver -----------------------------------------------------------------

const CLOCK_MICROS = 1_700_000_000_000_000
const TOOL_VERSION = 'kernel-import-test/0.1.0'
const REQUEST: FixtureRequest = { principalRef: 'operator-1', operationId: 'op-0001' }
const EMPTY_SEED: FixtureSeed = { goals: [], leases: [], idempotencyKeys: [], events: [] }

const ROOT_COMMIT = `aaaa${'0'.repeat(34)}01`
const TIP_COMMIT = `aaaa${'0'.repeat(34)}02`
const A_PATH = 'docs/goals/a.md'
const APPROVAL_PATH = 'docs/goals/approval-1.md'
const GOAL_TEXT = '# Goal X\n\nLegacy goal record for goal-x.\n'
const APPROVAL_TEXT = 'approval evidence for goal-x\n'

interface FixtureContext {
  dir: string
  storage: Storage
  importer: Importer
  input: FixtureInput
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
      payloadDigest: digestText(event.payload),
      principalRef: event.principalRef,
      operationId: event.operationId,
      recordedAtMicros: event.recordedAtMicros,
    })
  }
}

function openFixtureContext(input: FixtureInput): FixtureContext {
  const dir = mkdtempSync(join(tmpdir(), 'fk-p11-approvals-'))
  const config: OpenStorageConfig = {
    storageRoot: dir,
    databaseFileName: 'state.db',
    createIfMissing: true,
    clock: fixedClock(CLOCK_MICROS),
    backupPolicy: { root: join(dir, 'backups'), retentionDescriptor: null },
  }
  const storage = openStorage(config)
  applySeed(storage, input.seed)
  const lineage = new FakeLineage(input.lineage)
  return {
    dir,
    storage,
    input,
    importer: createImporter({
      storage,
      clock: fixedClock(CLOCK_MICROS),
      toolVersion: TOOL_VERSION,
      lineageReader: lineage,
    }),
  }
}

function closeFixtureContext(ctx: FixtureContext): void {
  closeStorage(ctx.storage)
  rmSync(ctx.dir, { recursive: true, force: true })
}

function runFixtureImport(ctx: FixtureContext): ImportResult {
  return runImport(ctx.importer, {
    importDocument: ctx.input.document,
    principalRef: ctx.input.request.principalRef,
    operationId: ctx.input.request.operationId,
  })
}

function tableSnapshot(storage: Storage): LedgerTables {
  return exportStorage(storage).exportDocument.payload.tables
}

/** The corpusDigest must re-derive from the rows (else the row misfires). */
function assertRealCorpusDigest(document: unknown): void {
  // Fixture documents are deliberately violation-shaped JSON; read only digest + sources.
  const wire = document as { corpusDigest?: unknown; rows?: WireRowSource[] }
  assert.equal(typeof wire.corpusDigest, 'string', 'fixture document carries a corpusDigest')
  const rows = wire.rows ?? []
  assert.equal(
    corpusDigestOf(rows as LegacyGoalRecord[]),
    wire.corpusDigest,
    'corpusDigest re-derives via corpusDigestOf(document.rows)',
  )
}

/**
 * T3 zero-row proof (b), asserted after EVERY refused run: zero events, both
 * projection cursors absent at substrate level and 0 in the FK-P11 view, no
 * document goal materialized, and the whole ledger row-exact unchanged (which
 * also proves a seeded row's seed is untouched and no NEW rows appeared).
 */
function assertRefusalLeavesLedgerUntouched(
  ctx: FixtureContext,
  row: FixtureRow,
  before: LedgerTables,
): void {
  assert.equal(readAllEvents(ctx.storage).length, 0, `${row.id}: refused run records no events`)
  for (const projectionId of FK_P11_PROJECTION_IDS) {
    assert.equal(
      substrateCursor(ctx.storage, projectionId),
      null,
      `${row.id}: ${projectionId} row absent`,
    )
    const cursor = getProjectionCursor(ctx.storage, projectionId)
    assert.equal(cursor.lastAppliedEventSeq, 0, `${row.id}: ${projectionId} cursor stays at 0`)
  }
  // Fixture documents are deliberately violation-shaped JSON; probe only `goalId`.
  const wire = ctx.input.document as { rows?: { goalId?: unknown }[] }
  for (const wireRow of wire.rows ?? []) {
    if (typeof wireRow.goalId !== 'string') continue
    assert.equal(
      getGoal(ctx.storage, wireRow.goalId),
      null,
      `${row.id}: ${wireRow.goalId} not materialized`,
    )
  }
  assert.deepEqual(
    tableSnapshot(ctx.storage),
    before,
    `${row.id}: refusal leaves the ledger row-exact unchanged`,
  )
}

function assertRefusal(
  ctx: FixtureContext,
  row: FixtureRow,
  error: unknown,
  before: ReturnType<typeof exportStorage>['exportDocument']['payload']['tables'],
): void {
  assert.ok(error instanceof ImportError, `${row.id} throws a typed ImportError`)
  assert.equal(error.name, 'ImportError')
  assert.equal(error.code, row.expectedCode, `${row.id} fires its named code`)
  assert.equal(error.message, row.expectedCode, 'message is the code literal alone')
  const declared = [...IMPORT_ERROR_REGISTRY[error.code].diagnosticMembers]
    .map((member) => String(member))
    .sort()
  assert.deepEqual(
    Object.keys(error.diagnostic).sort(),
    declared,
    'diagnostic carries exactly the declared members',
  )
  const expectedReason = row.expectedReasonCode
  if (expectedReason !== undefined) {
    const diagnostic = error.diagnostic as Record<string, string | number>
    if (error.code === 'DIVERGENCE_STOP') {
      assert.equal(diagnostic.reasonCode, expectedReason, `${row.id} fires its declared reasonCode`)
    } else {
      assert.equal(diagnostic.reason, expectedReason, `${row.id} fires its declared reason`)
    }
  }
  assertRefusalLeavesLedgerUntouched(ctx, row, before)
}

for (const row of ROWS) {
  test(`${row.id} refuses exactly as pre-declared`, () => {
    assertRealCorpusDigest(row.input.document)
    const ctx = openFixtureContext(row.input)
    const before = tableSnapshot(ctx.storage)
    try {
      runFixtureImport(ctx)
      assert.fail(`${row.id} must refuse`)
    } catch (error) {
      if (error instanceof Error && error.message.includes('must refuse')) throw error
      assertRefusal(ctx, row, error, before)
    } finally {
      closeFixtureContext(ctx)
    }
  })
}

// --- the T3 invariants (a), (b), (c) ----------------------------------------

const CONTROL_FACTS: OperationalFacts = {
  claimedRevision: 1,
  claimedLeaseHolderPrincipalRef: 'op-legacy-1',
  claimedPendingTransitionTarget: 'active',
  claimedWakeupCount: 2,
  claimedHandoffCount: 1,
  claimedBinding: {
    principalRef: 'op-legacy-1',
    operationId: 'op-legacy-bind-1',
    repositoryRef: 'repo-1',
    worktreeRef: 'wt-1',
  },
}

const CONTROL_LINEAGE: LineageSeed = {
  commits: [
    { id: ROOT_COMMIT, parents: [] },
    { id: TIP_COMMIT, parents: [ROOT_COMMIT] },
  ],
  blobs: [
    { commitId: TIP_COMMIT, sourcePath: A_PATH, text: GOAL_TEXT },
    { commitId: TIP_COMMIT, sourcePath: APPROVAL_PATH, text: APPROVAL_TEXT },
  ],
}

/** The otherwise-valid control document: one completed row, one evidenced claim. */
function buildControlDocument(): ImportDocument {
  const controlRow: LegacyGoalRecord = {
    goalId: 'goal-x',
    claimedStatus: 'completed',
    source: { sourcePath: A_PATH, sourceDigest: digestText(GOAL_TEXT), sourceCommit: TIP_COMMIT },
    claimedRatificationRefs: [],
    claimedApprovals: [
      {
        evidenceKind: 'commit-ref',
        gitIdentity: 'maintainer-1',
        digest: digestText(APPROVAL_TEXT),
        provenance: {
          sourcePath: APPROVAL_PATH,
          sourceDigest: digestText(APPROVAL_TEXT),
          sourceCommit: TIP_COMMIT,
        },
      },
    ],
    claimedOperationalFacts: CONTROL_FACTS,
  }
  return {
    apiVersion: '0.1.0',
    documentKind: 'legacy-import',
    corpusDigest: corpusDigestOf([controlRow]),
    sourceLineage: { rootCommit: ROOT_COMMIT, tipCommit: TIP_COMMIT },
    corpusManifest: {
      manifestKind: 'legacy-corpus-manifest',
      sourceRevision: TIP_COMMIT,
      items: [
        {
          sourcePath: A_PATH,
          sourceDigest: digestText(GOAL_TEXT),
          disposition: 'import',
          reason: 'legacy goal record',
        },
      ],
    },
    rows: [controlRow],
  }
}

/** Failing-when-broken scan: every member name carrying a gate marker. */
const GATE_MEMBER_RE = /gate/i

function gateMembersIn(value: unknown): string[] {
  const found: string[] = []
  const pending: unknown[] = [value]
  while (pending.length > 0) {
    const node = pending.pop()
    if (Array.isArray(node)) {
      pending.push(...node)
      continue
    }
    if (node !== null && typeof node === 'object') {
      for (const [key, member] of Object.entries(node)) {
        if (GATE_MEMBER_RE.test(key)) found.push(key)
        pending.push(member)
      }
    }
  }
  return found.sort()
}

function smuggleGateState(document: unknown): unknown {
  const cloned = structuredClone(document) as { rows?: Record<string, unknown>[] }
  const row = cloned.rows?.[0]
  assert.ok(row !== undefined, 'control document must carry exactly one row')
  row.gateSatisfied = true
  return cloned
}

test('T3 gate-smuggle mutation: gateSatisfied smuggled into a valid document refuses (failing-when-broken)', () => {
  const document = buildControlDocument()
  assert.deepEqual(
    gateMembersIn(parseImportDocument(document)),
    [],
    'no FK-P11 document shape carries a gate member',
  )
  const smuggled = smuggleGateState(document)
  assert.deepEqual(
    gateMembersIn(smuggled),
    ['gateSatisfied'],
    'the scan flags the smuggled member (failing-when-broken)',
  )
  const ctx = openFixtureContext({
    lineage: CONTROL_LINEAGE,
    seed: EMPTY_SEED,
    document: smuggled,
    request: REQUEST,
  })
  try {
    try {
      runFixtureImport(ctx)
      assert.fail('the smuggled document must refuse')
    } catch (error) {
      if (error instanceof Error && error.message.includes('must refuse')) throw error
      assert.ok(error instanceof ImportError, 'the smuggle refuses typed')
      assert.equal(error.code, 'IMPORT_ARGUMENT_INVALID')
    }
    assert.equal(
      readAllEvents(ctx.storage).length,
      0,
      'zero-row proof after the refused mutation run',
    )
    for (const projectionId of FK_P11_PROJECTION_IDS) {
      assert.equal(substrateCursor(ctx.storage, projectionId), null, `${projectionId} row absent`)
      const cursor = getProjectionCursor(ctx.storage, projectionId)
      assert.equal(cursor.lastAppliedEventSeq, 0, `${projectionId} cursor stays at 0`)
    }
  } finally {
    closeFixtureContext(ctx)
  }
})

test('T3 zero-row proof: every refused run records no events and both cursors stay absent/0', () => {
  for (const row of ROWS) {
    const ctx = openFixtureContext(row.input)
    try {
      try {
        runFixtureImport(ctx)
        assert.fail(`${row.id} must refuse`)
      } catch (error) {
        if (error instanceof Error && error.message.includes('must refuse')) throw error
      }
      assert.equal(readAllEvents(ctx.storage).length, 0, `${row.id}: refused run records no events`)
      for (const projectionId of FK_P11_PROJECTION_IDS) {
        assert.equal(
          substrateCursor(ctx.storage, projectionId),
          null,
          `${row.id}: ${projectionId} row absent`,
        )
        const cursor = getProjectionCursor(ctx.storage, projectionId)
        assert.equal(cursor.lastAppliedEventSeq, 0, `${row.id}: ${projectionId} cursor stays at 0`)
      }
    } finally {
      closeFixtureContext(ctx)
    }
  }
})

test('T3 positive control: a completed row with one evidenced claim imports cleanly; claims never materialize', () => {
  const document = buildControlDocument()
  const ctx = openFixtureContext({
    lineage: CONTROL_LINEAGE,
    seed: EMPTY_SEED,
    document,
    request: REQUEST,
  })
  try {
    const result = runFixtureImport(ctx)
    assert.deepEqual(result.importedGoalIds, ['goal-x'])
    assert.equal(result.epoch.rowCount, 1)

    // Exactly one import.recorded + one import.epoch — nothing else recorded.
    const events = readAllEvents(ctx.storage)
    assert.deepEqual(
      events.map((event) => event.kind),
      [IMPORT_RECORDED_KIND, IMPORT_EPOCH_KIND],
      'readAllEvents carries exactly one import.recorded + one import.epoch',
    )

    // The claims land ONLY as the import.recorded payload (T2 provenance-only).
    const claims = readImportedGoalClaims(ctx.storage)
    assert.equal(claims.length, 1, 'exactly one import.recorded claim set')
    const claim: ImportedGoalClaims | undefined = claims[0]
    assert.ok(claim !== undefined)
    const controlRow = document.rows[0]
    assert.ok(controlRow !== undefined)
    assert.deepEqual(
      claim.claimedApprovals,
      controlRow.claimedApprovals,
      'claim lands in the payload',
    )
    assert.deepEqual(claim.claimedOperationalFacts, CONTROL_FACTS, 'facts land in the payload')
    assert.equal(claim.importedStatus, 'completed')
    assert.deepEqual(gateMembersIn(claim), [], 'no FK-P11 claim shape carries a gate member')
    assert.deepEqual(gateMembersIn(result.epoch), [], 'no FK-P11 epoch shape carries a gate member')

    // The claims land as artifacts rows (kind import.approval), exactly one.
    const tables = tableSnapshot(ctx.storage)
    assert.deepEqual(gateMembersIn(tables), [], 'no stored FK-P11 shape carries a gate column')
    const artifacts = tables.artifacts ?? []
    assert.equal(artifacts.length, 2, 'exactly the approval evidence row + the epoch row')
    assert.deepEqual(artifacts.map((artifact) => artifact.kind).sort(), [
      ARTIFACT_KIND_APPROVAL,
      ARTIFACT_KIND_EPOCH,
    ])
    const approvalArtifact = artifacts.find((artifact) => artifact.kind === ARTIFACT_KIND_APPROVAL)
    assert.ok(
      approvalArtifact !== undefined,
      'the evidenced claim lands as an import.approval artifact',
    )
    assert.equal(approvalArtifact.goal_id, 'goal-x')
    assert.equal(approvalArtifact.digest, digestText(APPROVAL_TEXT))
    const epochArtifact = artifacts.find((artifact) => artifact.kind === ARTIFACT_KIND_EPOCH)
    assert.ok(epochArtifact !== undefined, 'the epoch lands as an import.epoch artifact')
    assert.equal(epochArtifact.goal_id, null)
    assert.equal(epochArtifact.digest, result.epoch.documentDigest)

    // NEVER as transitions / leases / idempotency_keys rows (T3 rule 5).
    assert.deepEqual(tables.transitions, [], 'claims never materialize as transitions rows')
    assert.deepEqual(tables.leases, [], 'claims never materialize as leases rows')
    assert.deepEqual(
      tables.idempotency_keys,
      [],
      'claims never materialize as idempotency_keys rows',
    )
    const binding = CONTROL_FACTS.claimedBinding
    assert.ok(binding !== null)
    assert.equal(
      getIdempotencyKey(ctx.storage, binding),
      null,
      'the claimed binding never reaches idempotency_keys',
    )
    assert.equal(
      getUnreleasedLease(ctx.storage, 'goal-x'),
      null,
      'the claimed lease holder never materializes as a lease',
    )
    const goal = getGoal(ctx.storage, 'goal-x')
    assert.ok(goal !== null, 'the imported goal exists')
    assert.equal(goal.revision, 1)
    assert.equal(goal.status, 'completed')
    assert.equal(goal.pendingTransitionId, null, 'no transition is referenced')
  } finally {
    closeFixtureContext(ctx)
  }
})
