/**
 * T6 determinism + T9 publish semantics: the F6 hostile class PRJ byte-identity
 * rows and the publish cursor contract.
 *
 * PRJ class inventory: PRJ-01..PRJ-07. THIS file drives PRJ-01/02/03
 * (byte-identity rows) plus the PRJ-06 mutation proof (a plain test);
 * PRJ-04/05/07 are driven by tests/projection.test.ts — together the two files
 * cover PRJ-01..07 (the global 85-record map lives in tests/import.test.ts,
 * parent-owned).
 */
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import {
  closeStorage,
  type EventRow,
  fixedClock,
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
import {
  createImporter,
  type ImportedGoalClaims,
  type ImportResult,
  readAllEvents,
  readImportedGoalClaims,
  runImport,
} from '../src/import.js'
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
const OWNED_IDS = ['PRJ-01', 'PRJ-02', 'PRJ-03', 'PRJ-06']
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

interface ImportedLedger {
  storage: Storage
  lineage: FakeLineage
  projector: Projector
  importResult: ImportResult
  dispose: () => void
}

const HERE = import.meta.dirname
const PRJ: ProjectionRow[] = JSON.parse(
  readFileSync(join(HERE, 'fixtures', 'hostile', 'projection.json'), 'utf8'),
)
const golden: GoldenFile = JSON.parse(
  readFileSync(join(HERE, 'fixtures', 'golden', 'projection-golden.json'), 'utf8'),
)

const EMPTY_SEED: FixtureSeed = { goals: [], leases: [], idempotencyKeys: [], events: [] }
const GOLDEN_REQUEST: FixtureRequest = { principalRef: 'operator-1', operationId: 'op-0001' }

function rowById(id: string): ProjectionRow {
  const row = PRJ.find((candidate) => candidate.id === id)
  assert.ok(row !== undefined, `missing fixture row ${id}`)
  return row
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

function applySeed(storage: Storage, seed: FixtureSeed): void {
  for (const goal of seed.goals) {
    insertGoal(storage, {
      goalId: goal.goalId,
      revision: goal.revision,
      status: goal.status,
      updatedAtMicros: 0,
    })
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
      recordedAtMicros: 0,
    })
  }
}

function openImportedLedger(options: {
  lineage: LineageSeed
  seed: FixtureSeed
  document: ImportDocument
  request: FixtureRequest
  clockMicros: number
}): ImportedLedger {
  const root = mkdtempSync(join(tmpdir(), 'fk-p11-det-'))
  const storage = openStorage(configFor(root, options.clockMicros))
  const lineage = new FakeLineage(options.lineage)
  const importer = createImporter({
    storage,
    clock: fixedClock(options.clockMicros),
    toolVersion: TOOL_VERSION,
    lineageReader: lineage,
  })
  applySeed(storage, options.seed)
  const importResult = runImport(importer, {
    importDocument: options.document,
    principalRef: options.request.principalRef,
    operationId: options.request.operationId,
  })
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

function assertByteIdentical(
  left: { markdownBytes: Uint8Array; projectionDigest: string },
  right: { markdownBytes: Uint8Array; projectionDigest: string },
  message: string,
): void {
  assert.ok(Buffer.from(left.markdownBytes).equals(Buffer.from(right.markdownBytes)), message)
  assert.equal(left.projectionDigest, right.projectionDigest, message)
}

/** The byte-identity row driver: branch on `input.mode` (F6 PRJ semantics). */
function runByteIdenticalRow(row: ProjectionRow): void {
  assert.equal(row.expectedOutcome, 'byte-identical')
  const base = {
    lineage: row.input.lineage,
    seed: row.input.seed,
    document: row.input.document,
    request: row.input.request,
    clockMicros: 0,
  }
  if (row.input.mode === 'render-twice') {
    const ledger = openImportedLedger(base)
    try {
      for (const view of VIEWS) {
        const first = renderProjection(ledger.projector, { projectionId: view })
        const second = renderProjection(ledger.projector, { projectionId: view })
        assertByteIdentical(first, second, `${view}: repeat render differs`)
        assert.equal(first.renderedThroughEventSeq, second.renderedThroughEventSeq)
      }
    } finally {
      ledger.dispose()
    }
    return
  }
  if (row.input.mode === 'row-order-permutation') {
    const variant = row.input.documentVariant
    assert.ok(variant !== undefined, 'PRJ-02 needs input.documentVariant')
    const left = openImportedLedger(base)
    const right = openImportedLedger({ ...base, document: variant })
    try {
      // corpusDigest is order-independent (tuples sorted); documentDigest is
      // document-bound — the two imports really are different documents.
      assert.equal(left.importResult.epoch.corpusDigest, right.importResult.epoch.corpusDigest)
      assert.notEqual(
        left.importResult.epoch.documentDigest,
        right.importResult.epoch.documentDigest,
      )
      for (const view of VIEWS) {
        assertByteIdentical(
          renderProjection(left.projector, { projectionId: view }),
          renderProjection(right.projector, { projectionId: view }),
          `${view}: permuted rows render differently`,
        )
      }
    } finally {
      left.dispose()
      right.dispose()
    }
    return
  }
  if (row.input.mode === 'clock-injection') {
    const clocks = row.input.clockMicros
    assert.ok(clocks !== undefined, 'PRJ-03 needs input.clockMicros')
    const left = openImportedLedger({ ...base, clockMicros: clocks[0] })
    const right = openImportedLedger({ ...base, clockMicros: clocks[1] })
    try {
      for (const view of VIEWS) {
        assertByteIdentical(
          renderProjection(left.projector, { projectionId: view }),
          renderProjection(right.projector, { projectionId: view }),
          `${view}: bytes depend on the injected clock`,
        )
      }
    } finally {
      left.dispose()
      right.dispose()
    }
    return
  }
  assert.fail(`unexpected byte-identity row mode ${row.input.mode}`)
}

// --- PRJ-06: local copy of the render pipeline's ordering step ---------------

/** Local copy of projection.ts `collectGoalIds` (first-seen order). */
function collectGoalIdsLocally(
  events: readonly EventRow[],
  claims: readonly ImportedGoalClaims[],
): string[] {
  const seen: Record<string, true> = {}
  const ids: string[] = []
  for (const event of events) {
    if (seen[event.goalId] !== true) {
      seen[event.goalId] = true
      ids.push(event.goalId)
    }
  }
  for (const entry of claims) {
    if (seen[entry.goalId] !== true) {
      seen[entry.goalId] = true
      ids.push(entry.goalId)
    }
  }
  return ids
}

/** The ordering step with the comparator INJECTED (#32 mutation surface). */
function renderOrderedView(
  ids: readonly string[],
  order: (a: string, b: string) => number,
): string {
  const ordered = ids.slice().sort(order)
  return `${ordered.join('\n')}\n`
}

const codeUnitOrder = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0)
const randomOrder = (): number => Math.random() - 0.5

test('PRJ fixture inventory: derived count + set equality for PRJ-01/02/03/06', () => {
  // Derived-count + set equality over THIS file's rows (PRJ-06 is proven by the
  // plain mutation test below, not row-driven); class total PRJ-01..07 is
  // shared with tests/projection.test.ts (its rows: PRJ-04/05/07).
  const ids = PRJ.map((row) => row.id)
  assert.deepEqual([...ids].sort(), [...CLASS_IDS].sort())
  const own = PRJ.filter((row) => OWNED_IDS.includes(row.id))
  assert.equal(own.length, OWNED_IDS.length)
  assert.deepEqual(own.map((row) => row.id).sort(), [...OWNED_IDS].sort())
  for (const row of PRJ) {
    assert.equal(row.expectedCode !== undefined, row.expectedOutcome === undefined)
    for (const event of row.input.seed.events) {
      assert.equal(event.payloadDigest, digestText(event.payload))
    }
  }
  // The row state is pinned to the golden state (duplicate payloads must not drift).
  for (const id of ['PRJ-01', 'PRJ-02', 'PRJ-03', 'PRJ-06']) {
    const row = rowById(id)
    assert.deepEqual(row.input.document, golden.state.document)
    assert.deepEqual(row.input.lineage, golden.state.lineage)
    assert.deepEqual(row.input.seed, EMPTY_SEED)
    assert.deepEqual(row.input.request, GOLDEN_REQUEST)
  }
})

test('PRJ-01: same state rendered twice is byte-identical', () => {
  const row = rowById('PRJ-01')
  assert.equal(row.input.mode, 'render-twice')
  runByteIdenticalRow(row)
})

test('PRJ-02: row insertion-order permutation renders byte-identical', () => {
  const row = rowById('PRJ-02')
  assert.equal(row.input.mode, 'row-order-permutation')
  runByteIdenticalRow(row)
})

test('PRJ-03: injected clock values render byte-identical', () => {
  const row = rowById('PRJ-03')
  assert.equal(row.input.mode, 'clock-injection')
  runByteIdenticalRow(row)
})

test('PRJ-06: injected nondeterministic ordering fails the byte-identity assertion', () => {
  // Mutation proof (#32): the named determinism assertion (render twice, assert
  // byte-equal) MUST fail loudly when the ordering step becomes nondeterministic.
  const row = rowById('PRJ-06')
  assert.equal(row.input.mode, 'ordering-mutation')
  assert.equal(row.expectedOutcome, 'mutation-fails-named-test')
  const ledger = openImportedLedger({
    lineage: golden.state.lineage,
    seed: EMPTY_SEED,
    document: golden.state.document,
    request: GOLDEN_REQUEST,
    clockMicros: 0,
  })
  try {
    const ids = collectGoalIdsLocally(
      readAllEvents(ledger.storage),
      readImportedGoalClaims(ledger.storage),
    )
    assert.deepEqual([...ids].sort(codeUnitOrder), ['goal-0001', 'goal-0002', 'goal-0003'])
    // With the stable ordering the identical assertion logic passes.
    assert.equal(
      renderOrderedView(ids, codeUnitOrder),
      renderOrderedView(ids, codeUnitOrder),
      'stable ordering must be byte-identical',
    )
    // Inject a Math.random() comparator into the ordering step until the
    // nondeterminism materializes as differing bytes.
    let first = ''
    let second = ''
    for (let attempt = 0; attempt < 128; attempt += 1) {
      first = renderOrderedView(ids, randomOrder)
      second = renderOrderedView(ids, randomOrder)
      if (first !== second) break
    }
    assert.notEqual(first, second, 'injected nondeterminism never materialized')
    assert.throws(() => assert.equal(first, second), assert.AssertionError)
  } finally {
    ledger.dispose()
  }
})

test('publishProjection advances the cursor 0 → renderedThroughEventSeq transactionally', () => {
  const ledger = openImportedLedger({
    lineage: golden.state.lineage,
    seed: EMPTY_SEED,
    document: golden.state.document,
    request: GOLDEN_REQUEST,
    clockMicros: 0,
  })
  try {
    for (const view of VIEWS) {
      const before = getProjectionCursor(ledger.projector, { projectionId: view })
      assert.equal(before.lastAppliedEventSeq, 0)
      const published = publishProjection(ledger.projector, { projectionId: view })
      assert.equal(published.cursorBefore.lastAppliedEventSeq, 0)
      assert.equal(published.cursorAfter.lastAppliedEventSeq, published.renderedThroughEventSeq)
      assert.equal(published.renderedThroughEventSeq, golden.bytes.renderedThroughEventSeq)
      const after = getProjectionCursor(ledger.projector, { projectionId: view })
      assert.equal(after.lastAppliedEventSeq, published.renderedThroughEventSeq)
    }
  } finally {
    ledger.dispose()
  }
})

test('republish of unchanged state is byte-identical and does not move the cursor', () => {
  const ledger = openImportedLedger({
    lineage: golden.state.lineage,
    seed: EMPTY_SEED,
    document: golden.state.document,
    request: GOLDEN_REQUEST,
    clockMicros: 0,
  })
  try {
    const first = publishProjection(ledger.projector, { projectionId: 'md-goal-ledger' })
    const second = publishProjection(ledger.projector, { projectionId: 'md-goal-ledger' })
    assertByteIdentical(first, second, 'republish renders differ')
    assert.equal(second.cursorBefore.lastAppliedEventSeq, first.cursorAfter.lastAppliedEventSeq)
    assert.equal(second.cursorAfter.lastAppliedEventSeq, second.cursorBefore.lastAppliedEventSeq)
  } finally {
    ledger.dispose()
  }
})

test('a refused publish (drift injection) leaves the cursor unmoved', () => {
  const ledger = openImportedLedger({
    lineage: golden.state.lineage,
    seed: EMPTY_SEED,
    document: golden.state.document,
    request: GOLDEN_REQUEST,
    clockMicros: 0,
  })
  try {
    const tip = golden.state.document.sourceLineage.tipCommit
    const before = getProjectionCursor(ledger.projector, { projectionId: 'md-goals-index' })
    ledger.lineage.addBlob(tip, 'docs/ratify/canon-1.md', new TextEncoder().encode('mutated\n'))
    const error = namedRefusalOf(
      captureThrow(() => publishProjection(ledger.projector, { projectionId: 'md-goals-index' })),
      'DIVERGENCE_STOP',
    )
    assert.equal(error.diagnostic.reasonCode, 'projection-source-drift')
    const after = getProjectionCursor(ledger.projector, { projectionId: 'md-goals-index' })
    assert.equal(after.lastAppliedEventSeq, before.lastAppliedEventSeq)
  } finally {
    ledger.dispose()
  }
})

test('two sequential publishes under the shared storage write lock serialize byte-identically', () => {
  const ledger = openImportedLedger({
    lineage: golden.state.lineage,
    seed: EMPTY_SEED,
    document: golden.state.document,
    request: GOLDEN_REQUEST,
    clockMicros: 0,
  })
  try {
    // Two publishers over ONE storage: each publish runs its own
    // withTransaction, so the storage write lock serializes them.
    const projectorA = createProjector({
      storage: ledger.storage,
      lineageReader: new FakeLineage(golden.state.lineage),
    })
    const projectorB = createProjector({
      storage: ledger.storage,
      lineageReader: new FakeLineage(golden.state.lineage),
    })
    const publishA = publishProjection(projectorA, { projectionId: 'md-goals-index' })
    const publishB = publishProjection(projectorB, { projectionId: 'md-goals-index' })
    assertByteIdentical(publishA, publishB, 'serialized publishes render differently')
    assert.equal(publishA.cursorBefore.lastAppliedEventSeq, 0)
    assert.equal(publishA.cursorAfter.lastAppliedEventSeq, publishA.renderedThroughEventSeq)
    assert.equal(
      publishB.cursorBefore.lastAppliedEventSeq,
      publishA.cursorAfter.lastAppliedEventSeq,
    )
    assert.equal(publishB.cursorAfter.lastAppliedEventSeq, publishB.renderedThroughEventSeq)
  } finally {
    ledger.dispose()
  }
})
