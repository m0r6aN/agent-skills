/**
 * T6/T9 projection semantics + the F6 hostile class PRJ refusal rows.
 *
 * PRJ class inventory: PRJ-01..PRJ-07. THIS file drives the refusal rows
 * PRJ-04/05/07 through the seeded-state refusal driver; PRJ-01/02/03/06 are
 * driven by tests/projection-determinism.test.ts — together the two files cover
 * PRJ-01..07 (the global 85-record map lives in tests/import.test.ts,
 * parent-owned).
 */
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import {
  closeStorage,
  exportStorage,
  fixedClock,
  getGoal,
  insertEvent,
  insertGoal,
  insertIdempotencyKey,
  insertLease,
  type OpenStorageConfig,
  openStorage,
  type Storage,
} from '@foreman-line/kernel-state'
import { digestText } from '../src/canonical.js'
import { IMPORT_ERROR_REGISTRY, type ImportError, isImportError } from '../src/errors.js'
import { createImporter, type ImportResult, readAllEvents, runImport } from '../src/import.js'
import type { ImportDocument } from '../src/import-document.js'
import {
  createProjector,
  getProjectionCursor,
  type Projector,
  publishProjection,
  renderProjection,
} from '../src/projection.js'
import { FakeLineage } from './helpers/fake-lineage.js'

const TOOL_VERSION = 'kernel-import/0.1.0'
const VIEWS = ['md-goals-index', 'md-goal-ledger'] as const
const OWNED_IDS = ['PRJ-04', 'PRJ-05', 'PRJ-07']
const CLASS_IDS = ['PRJ-01', 'PRJ-02', 'PRJ-03', 'PRJ-04', 'PRJ-05', 'PRJ-06', 'PRJ-07']

interface FixtureRequest {
  principalRef: string
  operationId: string
}

interface LineageSeed {
  commits: { id: string; parents: string[] }[]
  blobs: { commitId: string; sourcePath: string; text: string }[]
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

interface FixtureSeedKey {
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
  idempotencyKeys: FixtureSeedKey[]
  events: FixtureSeedEvent[]
}

interface RowInput {
  mode: string
  lineage: LineageSeed
  seed: FixtureSeed
  document: ImportDocument
  request: FixtureRequest
  documentVariant?: ImportDocument
  clockMicros?: [number, number]
}

interface ProjectionRow {
  id: string
  input: RowInput
  expectedCode?: string
  expectedOutcome?: string
  expectedReasonCode?: string
}

interface GoldenFile {
  state: { lineage: LineageSeed; document: ImportDocument }
  bytes: {
    'md-goals-index': string
    'md-goal-ledger': string
    renderedThroughEventSeq: number
  }
}

interface OpenLedger {
  storage: Storage
  lineage: FakeLineage
  projector: Projector
  importResult: ImportResult | null
  dispose: () => void
}

const HERE = import.meta.dirname
const PRJ: ProjectionRow[] = JSON.parse(
  readFileSync(join(HERE, 'fixtures', 'hostile', 'projection.json'), 'utf8'),
)
const golden: GoldenFile = JSON.parse(
  readFileSync(join(HERE, 'fixtures', 'golden', 'projection-golden.json'), 'utf8'),
)

function rowById(id: string): ProjectionRow {
  const row = PRJ.find((candidate) => candidate.id === id)
  assert.ok(row !== undefined, `missing fixture row ${id}`)
  return row
}

function decodeBytes(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes)
}

function configFor(root: string, clockMicros: number): OpenStorageConfig {
  return {
    storageRoot: root,
    databaseFileName: 'state.db',
    createIfMissing: true,
    clock: fixedClock(clockMicros),
    backupPolicy: { root, retentionDescriptor: null },
  }
}

/** The FK-P9 T1 status vocabulary (mirrors `ck_goals_status`, 0002 migration). */
const T1_STATUSES: Record<string, true> = {
  proposed: true,
  active: true,
  'awaiting-human': true,
  completed: true,
  cancelled: true,
}

function applySeed(storage: Storage, seed: FixtureSeed): void {
  // The substrate CHECK `ck_goals_status` refuses out-of-T1 statuses at insert;
  // PRJ-05 plants exactly that hostile state to pin the projection's own
  // PROJECTION_STATE_INVALID refusal, so the seeding inserts relax the CHECK
  // through the substrate's documented pragma seam and restore it immediately.
  const relaxChecks = seed.goals.some((goal) => T1_STATUSES[goal.status] !== true)
  if (relaxChecks) storage.driver.pragma('ignore_check_constraints = ON')
  for (const goal of seed.goals) {
    insertGoal(storage, {
      goalId: goal.goalId,
      revision: goal.revision,
      status: goal.status,
      updatedAtMicros: 0,
    })
  }
  if (relaxChecks) storage.driver.pragma('ignore_check_constraints = OFF')
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
      recordedAtMicros: 0,
    })
  }
}

function openLedger(options: {
  lineage: LineageSeed
  seed: FixtureSeed
  request: FixtureRequest
  clockMicros: number
  importDocument?: ImportDocument
}): OpenLedger {
  const root = mkdtempSync(join(tmpdir(), 'fk-p11-prj-'))
  const storage = openStorage(configFor(root, options.clockMicros))
  const lineage = new FakeLineage(options.lineage)
  const importer = createImporter({
    storage,
    clock: fixedClock(options.clockMicros),
    toolVersion: TOOL_VERSION,
    lineageReader: lineage,
  })
  applySeed(storage, options.seed)
  let importResult: ImportResult | null = null
  if (options.importDocument !== undefined) {
    importResult = runImport(importer, {
      importDocument: options.importDocument,
      principalRef: options.request.principalRef,
      operationId: options.request.operationId,
    })
  }
  const projector = createProjector({ storage, lineageReader: lineage })
  return {
    storage,
    lineage,
    projector,
    importResult,
    dispose: () => {
      closeStorage(storage)
      rmSync(root, { recursive: true, force: true })
    },
  }
}

function captureThrow(fn: () => unknown): unknown {
  try {
    fn()
  } catch (value) {
    return value
  }
  assert.fail('expected the call to refuse')
}

function namedRefusalOf(value: unknown, expectedCode: string): ImportError {
  assert.ok(isImportError(value), `expected ImportError, got ${String(value)}`)
  assert.equal(value.code, expectedCode)
  const declared = [
    ...(IMPORT_ERROR_REGISTRY[value.code].diagnosticMembers as readonly string[]),
  ].sort()
  assert.deepEqual(Object.keys(value.diagnostic).sort(), declared)
  return value
}

function assertNothingImported(storage: Storage, seed: FixtureSeed): void {
  const events = readAllEvents(storage)
  assert.deepEqual(
    events.map((event) => event.eventId),
    seed.events.map((event) => event.eventId),
  )
  for (const goal of seed.goals) {
    const row = getGoal(storage, goal.goalId)
    assert.ok(row !== null)
    assert.equal(row.revision, goal.revision)
    assert.equal(row.status, goal.status)
    assert.equal(row.pendingTransitionId, null)
  }
  const tables = exportStorage(storage).exportDocument.payload.tables
  assert.equal(tables.goals.length, seed.goals.length)
  assert.equal(tables.artifacts.length, 0)
  assert.equal(tables.projection_cursors.length, 0)
}

/** The refusal-row driver: seed, render both views, refuse, nothing imported. */
function runRefusalRow(row: ProjectionRow): void {
  assert.ok(row.expectedCode !== undefined && row.expectedOutcome === undefined)
  const ledger = openLedger({
    lineage: row.input.lineage,
    seed: row.input.seed,
    request: row.input.request,
    clockMicros: 0,
  })
  try {
    for (const view of VIEWS) {
      const error = namedRefusalOf(
        captureThrow(() => renderProjection(ledger.projector, { projectionId: view })),
        row.expectedCode ?? '',
      )
      if (row.input.mode === 'payload-noncanonical' || row.input.mode === 'unpaired-surrogate') {
        assert.deepEqual(error.diagnostic, { field: 'events.payload' })
      } else {
        assert.deepEqual(error.diagnostic, {})
      }
    }
    assertNothingImported(ledger.storage, row.input.seed)
  } finally {
    ledger.dispose()
  }
}

/**
 * Out-of-order seeded goals (no import claims): insertion order deliberately
 * differs from UTF-16 code-unit order (locale order would also differ).
 */
const OUT_OF_ORDER_SEED: FixtureSeed = {
  goals: [
    { goalId: 'goal-a', revision: 1, status: 'active' },
    { goalId: 'goal-B', revision: 2, status: 'completed' },
    { goalId: 'goal-2', revision: 3, status: 'proposed' },
  ],
  leases: [],
  idempotencyKeys: [],
  events: [
    {
      eventId: 'seed-evt-a',
      goalId: 'goal-a',
      kind: 'lease.claimed',
      payload: '{}',
      payloadDigest: digestText('{}'),
      principalRef: 'operator-1',
      operationId: 'op-0001',
      recordedAtMicros: 0,
    },
    {
      eventId: 'seed-evt-B',
      goalId: 'goal-B',
      kind: 'lease.claimed',
      payload: '{}',
      payloadDigest: digestText('{}'),
      principalRef: 'operator-1',
      operationId: 'op-0001',
      recordedAtMicros: 0,
    },
    {
      eventId: 'seed-evt-2',
      goalId: 'goal-2',
      kind: 'lease.claimed',
      payload: '{}',
      payloadDigest: digestText('{}'),
      principalRef: 'operator-1',
      operationId: 'op-0001',
      recordedAtMicros: 0,
    },
  ],
}

test('PRJ fixture inventory: derived count + set equality for PRJ-04/05/07', () => {
  // Derived-count + set equality over THIS file's rows; the class total is
  // PRJ-01..07 shared with tests/projection-determinism.test.ts (its rows:
  // PRJ-01/02/03/06).
  const ids = PRJ.map((row) => row.id)
  assert.deepEqual([...ids].sort(), [...CLASS_IDS].sort())
  const own = PRJ.filter((row) => OWNED_IDS.includes(row.id))
  assert.equal(own.length, OWNED_IDS.length)
  assert.deepEqual(own.map((row) => row.id).sort(), [...OWNED_IDS].sort())
  for (const row of PRJ) {
    // Exactly one of expectedCode / expectedOutcome per row.
    assert.equal(row.expectedCode !== undefined, row.expectedOutcome === undefined)
    for (const event of row.input.seed.events) {
      // Fixture digest literals are real: digestText over the exact payload bytes.
      assert.equal(event.payloadDigest, digestText(event.payload))
    }
  }
})

test('golden state renders byte-identical to the committed golden bytes', () => {
  const ledger = openLedger({
    lineage: golden.state.lineage,
    seed: { goals: [], leases: [], idempotencyKeys: [], events: [] },
    request: { principalRef: 'operator-1', operationId: 'op-0001' },
    clockMicros: 0,
    importDocument: golden.state.document,
  })
  try {
    for (const view of VIEWS) {
      const render = renderProjection(ledger.projector, { projectionId: view })
      assert.ok(
        Buffer.from(render.markdownBytes).equals(Buffer.from(golden.bytes[view], 'utf8')),
        `${view} bytes differ from the golden vector`,
      )
      assert.equal(render.renderedThroughEventSeq, golden.bytes.renderedThroughEventSeq)
    }
  } finally {
    ledger.dispose()
  }
})

test('header block: format version + ids, no toolVersion, no wall-clock', () => {
  for (const view of VIEWS) {
    const text = golden.bytes[view]
    const header = [
      `<!-- projection: ${view} -->`,
      'projectionFormatVersion: 0.1.0',
      `projectionId: ${view}`,
      `renderedThroughEventSeq: ${golden.bytes.renderedThroughEventSeq}`,
    ].join('\n')
    assert.ok(text.startsWith(`${header}\n`), `${view} header block mismatch`)
    assert.ok(!text.includes('toolVersion'), `${view} carries toolVersion`)
    // No wall-clock: no year-like run and no ISO-date pattern in the bytes.
    assert.ok(!/(?:19|20)\d{2}/.test(text), `${view} carries a year-like run`)
    assert.ok(!/[12]\d{3}-[01]\d-[0-3]\d/.test(text), `${view} carries an ISO-date pattern`)
  }
})

test('every rendered external string is sanitized (no control/format chars)', () => {
  for (const view of VIEWS) {
    const text = golden.bytes[view]
    for (let i = 0; i < text.length; i += 1) {
      const unit = text.charCodeAt(i)
      const isControl = (unit <= 0x1f && unit !== 0x0a) || unit === 0x7f
      const isFormat =
        unit === 0x200b ||
        unit === 0x200e ||
        unit === 0x200f ||
        (unit >= 0x202a && unit <= 0x202e) ||
        unit === 0xfeff
      assert.ok(
        !isControl && !isFormat,
        `${view} carries control/format char U+${unit.toString(16)} at ${i}`,
      )
    }
  }
})

test('md-goals-index rows sort by goalId UTF-16 code-unit order (out-of-order seed)', () => {
  const ledger = openLedger({
    lineage: { commits: [], blobs: [] },
    seed: OUT_OF_ORDER_SEED,
    request: { principalRef: 'operator-1', operationId: 'op-0001' },
    clockMicros: 0,
  })
  try {
    const render = renderProjection(ledger.projector, { projectionId: 'md-goals-index' })
    const lines = decodeBytes(render.markdownBytes).split('\n')
    const separator = lines.indexOf('--- | --- | --- | --- | ---')
    assert.ok(separator >= 0)
    const renderedIds = lines
      .slice(separator + 1)
      .filter((line) => line.length > 0)
      .map((line) => line.split(' | ')[0] ?? '')
    // Code-unit order: 'goal-2' < 'goal-B' < 'goal-a' (insertion order differs).
    assert.deepEqual(renderedIds, ['goal-2', 'goal-B', 'goal-a'])
  } finally {
    ledger.dispose()
  }
})

test('goals without import claims render `import: -` / `evidence: -`', () => {
  const ledger = openLedger({
    lineage: { commits: [], blobs: [] },
    seed: OUT_OF_ORDER_SEED,
    request: { principalRef: 'operator-1', operationId: 'op-0001' },
    clockMicros: 0,
  })
  try {
    const render = renderProjection(ledger.projector, { projectionId: 'md-goal-ledger' })
    const text = decodeBytes(render.markdownBytes)
    assert.equal(text.match(/import: -/g)?.length, OUT_OF_ORDER_SEED.goals.length)
    assert.equal(text.match(/evidence: -/g)?.length, OUT_OF_ORDER_SEED.goals.length)
  } finally {
    ledger.dispose()
  }
})

test('evidence refs render only after lineage confirmation (mutation refuses)', () => {
  const ledger = openLedger({
    lineage: golden.state.lineage,
    seed: { goals: [], leases: [], idempotencyKeys: [], events: [] },
    request: { principalRef: 'operator-1', operationId: 'op-0001' },
    clockMicros: 0,
    importDocument: golden.state.document,
  })
  try {
    const tip = golden.state.document.sourceLineage.tipCommit
    const before = renderProjection(ledger.projector, { projectionId: 'md-goal-ledger' })
    const beforeText = decodeBytes(before.markdownBytes)
    assert.ok(beforeText.includes('  - import.approval commit-ref'))
    assert.ok(beforeText.includes('  - import.ratification-ref'))
    assert.ok(beforeText.includes(`    at ${tip}:docs/proof/approval-1.md`))
    // Mutate the confirmed evidence blob: the re-derivation refuses (no bytes).
    ledger.lineage.addBlob(
      tip,
      'docs/proof/approval-1.md',
      new TextEncoder().encode('mutated approval evidence\n'),
    )
    const error = namedRefusalOf(
      captureThrow(() => renderProjection(ledger.projector, { projectionId: 'md-goal-ledger' })),
      'DIVERGENCE_STOP',
    )
    assert.equal(error.diagnostic.reasonCode, 'projection-source-drift')
    assert.equal(error.diagnostic.goalId, 'goal-0001')
  } finally {
    ledger.dispose()
  }
})

test('goal-state cursor reads; render/publish refuse `reserved`', () => {
  const ledger = openLedger({
    lineage: golden.state.lineage,
    seed: { goals: [], leases: [], idempotencyKeys: [], events: [] },
    request: { principalRef: 'operator-1', operationId: 'op-0001' },
    clockMicros: 0,
    importDocument: golden.state.document,
  })
  try {
    assert.deepEqual(getProjectionCursor(ledger.projector, { projectionId: 'goal-state' }), {
      projectionId: 'goal-state',
      lastAppliedEventSeq: 0,
    })
    const renderError = namedRefusalOf(
      captureThrow(() => renderProjection(ledger.projector, { projectionId: 'goal-state' })),
      'CURSOR_ID_UNREGISTERED',
    )
    assert.equal(renderError.diagnostic.reason, 'reserved')
    const publishError = namedRefusalOf(
      captureThrow(() => publishProjection(ledger.projector, { projectionId: 'goal-state' })),
      'CURSOR_ID_UNREGISTERED',
    )
    assert.equal(publishError.diagnostic.reason, 'reserved')
  } finally {
    ledger.dispose()
  }
})

test('PRJ-04: non-canonical event payload bytes refuse PROJECTION_INPUT_NONCANONICAL', () => {
  const row = rowById('PRJ-04')
  assert.equal(row.input.mode, 'payload-noncanonical')
  assert.equal(row.expectedCode, 'PROJECTION_INPUT_NONCANONICAL')
  runRefusalRow(row)
})

test('PRJ-05: seeded status outside T1 refuses PROJECTION_STATE_INVALID', () => {
  // The substrate CHECK refuses this row at insert; the driver plants it via
  // the pragma seam (see applySeed) so renderProjection's own T1-vocabulary
  // refusal is what this row pins.
  const row = rowById('PRJ-05')
  assert.equal(row.input.mode, 'status-outside-t1')
  assert.equal(row.expectedCode, 'PROJECTION_STATE_INVALID')
  runRefusalRow(row)
})

test('PRJ-07: unpaired surrogate in a stored string refuses PROJECTION_INPUT_NONCANONICAL', () => {
  const row = rowById('PRJ-07')
  assert.equal(row.input.mode, 'unpaired-surrogate')
  assert.equal(row.expectedCode, 'PROJECTION_INPUT_NONCANONICAL')
  runRefusalRow(row)
})
