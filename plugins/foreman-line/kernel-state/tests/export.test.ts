/**
 * Export determinism (AC4): EXPD-01..03 byte-identical pairs and the POS-06
 * committed golden export bytes. The golden fixture pins fixture bytes (not a
 * moving external file — standing constraint #34).
 */
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { canonicalBytes, canonicalEncode, digestBytes } from '../src/canonical.js'
import { type Clock, fixedClock } from '../src/clock.js'
import { type ExportPayload, exportStorage, storageExportDigestOf } from '../src/export.js'
import { closeStorage, type OpenStorageConfig, openStorage } from '../src/open.js'
import {
  consumeWakeupHandoff,
  type GoalRow,
  type GoalUpdate,
  insertArtifact,
  insertEvent,
  insertGoal,
  insertIdempotencyKey,
  insertLease,
  insertTransition,
  insertWakeupHandoff,
  type NewArtifactRow,
  type NewEventRow,
  type NewGoalRow,
  type NewIdempotencyKeyRow,
  type NewLeaseRow,
  type NewTransitionRow,
  type NewWakeupHandoffRow,
  type SetProjectionCursorRow,
  setProjectionCursor,
  updateGoalRow,
} from '../src/rows.js'
import type { Storage } from '../src/transactions.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const PKG_ROOT = resolve(HERE, '..')

const DETERMINISM = JSON.parse(
  readFileSync(join(HERE, 'fixtures', 'hostile', 'export-determinism.json'), 'utf8'),
) as {
  records: { id: string; input: { scenario: string }; expectedOutcome: string }[]
}

interface GoldenOperation {
  op: string
  row?: unknown
  goalId?: string
  guards?: Record<string, unknown>
  patch?: Record<string, unknown>
  wakeupId?: string
  consumedAtMicros?: number
}

const GOLDEN = JSON.parse(
  readFileSync(join(HERE, 'fixtures', 'golden', 'export-golden.json'), 'utf8'),
) as {
  records: { id: string; expectedOutcome: string }[]
  operations: GoldenOperation[]
  exportDocument: { domain: string; apiVersion: string; payload: ExportPayload }
  exportDocumentBytes: string
  storageExportDigest: string
}

interface ScenarioOutcome {
  id: string
  expectedOutcome: string
}

function scenario(id: string): ScenarioOutcome {
  const record = DETERMINISM.records.find((candidate) => candidate.id === id)
  assert.ok(record, `${id} missing from export-determinism.json`)
  return { id: record.id, expectedOutcome: record.expectedOutcome }
}

const T0 = 1_700_000_000_000_000

function configFor(root: string, clock: Clock): OpenStorageConfig {
  return {
    storageRoot: root,
    databaseFileName: 'state.db',
    createIfMissing: true,
    clock,
    backupPolicy: { root, retentionDescriptor: null },
  }
}

function insertSampleRows(storage: Storage, order: 'forward' | 'interleaved'): void {
  // The goals table carries a genuinely permuted multi-row content-stable
  // ordering across the variants (caller-keyed rows, identical content): the
  // export's row-order normalization is what makes the two exports identical.
  // Dependent rows keep relative order where generation makes content
  // insertion-dependent (events: event_seq).
  const goals = {
    g1: () =>
      insertGoal(storage, {
        goalId: 'goal-1',
        revision: 1,
        status: 'open',
        pendingTransitionId: null,
        updatedAtMicros: T0,
      }),
    g2: () =>
      insertGoal(storage, {
        goalId: 'goal-2',
        revision: 0,
        status: 'blocked',
        pendingTransitionId: null,
        updatedAtMicros: T0 + 20,
      }),
    g3: () =>
      insertGoal(storage, {
        goalId: 'goal-3',
        revision: 2,
        status: 'closed',
        pendingTransitionId: null,
        updatedAtMicros: T0 + 30,
      }),
  }
  const goalSequence =
    order === 'forward' ? [goals.g1, goals.g2, goals.g3] : [goals.g3, goals.g1, goals.g2]
  for (const insert of goalSequence) insert()
  const inserts = {
    evt1: () =>
      insertEvent(storage, {
        eventId: 'evt-1',
        goalId: 'goal-1',
        kind: 'created',
        payload: '{"n":1}',
        payloadDigest: `sha256:${'a'.repeat(64)}`,
        principalRef: 'principal-1',
        operationId: 'op-1',
        recordedAtMicros: T0 + 1,
      }),
    evt2: () =>
      insertEvent(storage, {
        eventId: 'evt-2',
        goalId: 'goal-1',
        kind: 'updated',
        payload: '{"n":2}',
        payloadDigest: `sha256:${'b'.repeat(64)}`,
        principalRef: 'principal-1',
        operationId: 'op-2',
        recordedAtMicros: T0 + 2,
      }),
    lease: () =>
      insertLease(storage, {
        leaseId: 'lease-1',
        goalId: 'goal-1',
        ownerPrincipalRef: 'principal-1',
        casRevision: 1,
        acquiredAtMicros: T0 + 3,
        expiresAtMicros: null,
        releasedAtMicros: null,
      }),
    idem: () =>
      insertIdempotencyKey(storage, {
        principalRef: 'principal-1',
        operationId: 'op-1',
        repositoryRef: 'repo-1',
        worktreeRef: 'wt-1',
        payloadDigest: `sha256:${'a'.repeat(64)}`,
        effectDigest: null,
        recordedAtMicros: T0 + 4,
        completedAtMicros: null,
      }),
    artifact: () =>
      insertArtifact(storage, {
        artifactId: 'art-1',
        goalId: 'goal-1',
        kind: 'evidence',
        digest: `sha256:${'c'.repeat(64)}`,
        locator: 'evidence/a.txt',
        recordedBy: 'principal-1',
        recordedAtMicros: T0 + 5,
      }),
    cursor: () =>
      setProjectionCursor(storage, {
        projectionId: 'proj-1',
        goalId: 'goal-1',
        lastAppliedEventSeq: 2,
        updatedAtMicros: T0 + 6,
      }),
    transition: () =>
      insertTransition(storage, {
        transitionId: 'tr-1',
        goalId: 'goal-1',
        status: 'pending',
        requestedBy: 'principal-1',
        operationId: 'op-3',
        payloadDigest: `sha256:${'d'.repeat(64)}`,
        createdAtMicros: T0 + 7,
        decidedAtMicros: null,
      }),
    wakeup: () =>
      insertWakeupHandoff(storage, {
        wakeupId: 'wk-1',
        goalId: 'goal-1',
        kind: 'wakeup',
        fromSessionRef: 'sess-1',
        toSessionRef: null,
        createdAtMicros: T0 + 8,
      }),
  }
  const sequence =
    order === 'forward'
      ? [
          inserts.evt1,
          inserts.evt2,
          inserts.lease,
          inserts.idem,
          inserts.artifact,
          inserts.cursor,
          inserts.transition,
          inserts.wakeup,
        ]
      : [
          inserts.wakeup,
          inserts.evt1,
          inserts.cursor,
          inserts.transition,
          inserts.evt2,
          inserts.artifact,
          inserts.idem,
          inserts.lease,
        ]
  for (const insert of sequence) insert()
}

function withFreshStorage<T>(prefix: string, clock: Clock, fn: (storage: Storage) => T): T {
  const root = mkdtempSync(join(tmpdir(), prefix))
  const storage = openStorage(configFor(root, clock))
  try {
    return fn(storage)
  } finally {
    closeStorage(storage)
    rmSync(root, { recursive: true, force: true })
  }
}

test('EXPD-01: same rows in different insertion orders export byte-identically', () => {
  const outcome = scenario('EXPD-01')
  assert.equal(outcome.expectedOutcome, 'byte-identical-export-and-digest')
  const first = withFreshStorage('fkp9-expd1a-', fixedClock(T0), (storage) => {
    insertSampleRows(storage, 'forward')
    return exportStorage(storage)
  })
  const second = withFreshStorage('fkp9-expd1b-', fixedClock(T0), (storage) => {
    insertSampleRows(storage, 'interleaved')
    return exportStorage(storage)
  })
  assert.equal(canonicalEncode(first.exportDocument), canonicalEncode(second.exportDocument))
  assert.equal(first.storageExportDigest, second.storageExportDigest)
})

test('EXPD-02: back-to-back exports under a live clock are byte-identical', () => {
  const outcome = scenario('EXPD-02')
  assert.equal(outcome.expectedOutcome, 'byte-identical-export-and-digest')
  withFreshStorage('fkp9-expd2-', fixedClock(T0, 1000), (storage) => {
    insertSampleRows(storage, 'forward')
    const first = exportStorage(storage)
    const second = exportStorage(storage)
    assert.equal(canonicalEncode(first.exportDocument), canonicalEncode(second.exportDocument))
    assert.equal(first.storageExportDigest, second.storageExportDigest)
    // The live clock feeds provenance only — excluded from the preimage.
    assert.notEqual(first.provenance.exportedAtMicros, second.provenance.exportedAtMicros)
  })
})

test('EXPD-03: in-memory objects with different member order encode identically', () => {
  const outcome = scenario('EXPD-03')
  assert.equal(outcome.expectedOutcome, 'byte-identical-export-and-digest')
  const payloadA = {
    schemaVersion: 1,
    migrationHistoryDigest: `sha256:${'a'.repeat(64)}`,
    tables: {
      goals: [
        {
          goal_id: 'g',
          revision: 1,
          status: 'open',
          pending_transition_id: null,
          updated_at_micros: 5,
        },
      ],
    },
  }
  const payloadB = {
    tables: {
      goals: [
        {
          updated_at_micros: 5,
          pending_transition_id: null,
          status: 'open',
          revision: 1,
          goal_id: 'g',
        },
      ],
    },
    migrationHistoryDigest: `sha256:${'a'.repeat(64)}`,
    schemaVersion: 1,
  }
  assert.equal(canonicalEncode(payloadA), canonicalEncode(payloadB))
  assert.equal(storageExportDigestOf(payloadA), storageExportDigestOf(payloadB))
  assert.equal(
    storageExportDigestOf(payloadA),
    digestBytes(
      canonicalBytes({
        domain: 'foreman-line.kernel-state.storage-export',
        apiVersion: '0.1.0',
        payload: payloadA,
      }),
    ),
  )
})

function replay(storage: Storage, operations: GoldenOperation[]): void {
  for (const step of operations) {
    // Fixture rows are runtime-validated field-by-field by the row primitives
    // (boundary normalization), so the named row types hold at the call.
    switch (step.op) {
      case 'insertGoal':
        insertGoal(storage, step.row as NewGoalRow)
        break
      case 'updateGoalRow':
        updateGoalRow(
          storage,
          step.goalId as string,
          step.guards as Partial<GoalRow>,
          step.patch as GoalUpdate,
        )
        break
      case 'insertTransition':
        insertTransition(storage, step.row as NewTransitionRow)
        break
      case 'insertEvent':
        insertEvent(storage, step.row as NewEventRow)
        break
      case 'insertLease':
        insertLease(storage, step.row as NewLeaseRow)
        break
      case 'insertIdempotencyKey':
        insertIdempotencyKey(storage, step.row as NewIdempotencyKeyRow)
        break
      case 'insertArtifact':
        insertArtifact(storage, step.row as NewArtifactRow)
        break
      case 'setProjectionCursor':
        setProjectionCursor(storage, step.row as SetProjectionCursorRow)
        break
      case 'insertWakeupHandoff':
        insertWakeupHandoff(storage, step.row as NewWakeupHandoffRow)
        break
      case 'consumeWakeupHandoff':
        consumeWakeupHandoff(storage, step.wakeupId as string, step.consumedAtMicros as number)
        break
      default:
        throw new Error(`unknown operation ${step.op}`)
    }
  }
}

test('POS-06: committed golden export bytes match exactly', () => {
  assert.equal(GOLDEN.records[0]?.id, 'POS-06')
  assert.equal(GOLDEN.records[0]?.expectedOutcome, 'golden-bytes-match')
  withFreshStorage('fkp9-gold-', fixedClock(T0 + 100), (storage) => {
    replay(storage, GOLDEN.operations)
    const result = exportStorage(storage)
    assert.equal(canonicalEncode(result.exportDocument), GOLDEN.exportDocumentBytes)
    assert.equal(result.storageExportDigest, GOLDEN.storageExportDigest)
  })
})

test('provenance is excluded from the digest preimage', () => {
  withFreshStorage('fkp9-prov-', fixedClock(T0), (storage) => {
    insertSampleRows(storage, 'forward')
    const result = exportStorage(storage)
    assert.equal(result.storageExportDigest, storageExportDigestOf(result.exportDocument.payload))
    assert.equal(typeof result.provenance.exportedAtMicros, 'number')
    assert.match(result.provenance.sourceDatabaseBytesDigest, /^sha256:[0-9a-f]{64}$/)
  })
})

test('export schema is closed draft-07 and covers the golden document', () => {
  const schema = JSON.parse(
    readFileSync(join(PKG_ROOT, 'schemas', 'storage-export.schema.json'), 'utf8'),
  ) as {
    $schema: string
    additionalProperties: boolean
    required: string[]
    properties: Record<string, unknown>
  }
  assert.ok(schema.$schema.includes('draft-07'))
  assert.equal(schema.additionalProperties, false)
  for (const member of ['domain', 'apiVersion', 'payload']) {
    assert.ok(schema.required.includes(member))
    assert.ok(member in schema.properties)
  }
  assert.deepEqual(Object.keys(GOLDEN.exportDocument).sort(), ['apiVersion', 'domain', 'payload'])
  assert.deepEqual(Object.keys(GOLDEN.exportDocument.payload).sort(), [
    'migrationHistoryDigest',
    'schemaVersion',
    'tables',
  ])
  assert.deepEqual(Object.keys(GOLDEN.exportDocument.payload.tables).sort(), [
    'artifacts',
    'events',
    'goals',
    'idempotency_keys',
    'leases',
    'projection_cursors',
    'schema_migrations',
    'transitions',
    'wakeup_handoffs',
  ])
})
