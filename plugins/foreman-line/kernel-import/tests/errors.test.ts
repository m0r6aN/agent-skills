/**
 * F10 — the closed 14-code error registry, the per-code fault-injection
 * matrix, and the three-instance error-laundering class (ERR-01..03, exit
 * annex §5), failing-when-broken.
 *
 * Discipline under test:
 * - the registry size is DERIVED (never a hand-typed literal) and set-equal to
 *   the spec code list restated here; every code carries exactly its declared
 *   safe-diagnostic members (`IMPORT_ERROR_REGISTRY`);
 * - `importError` refuses unbounded diagnostics with a factory `Error`;
 * - `ImportError.message` is the code literal alone; a serialized diagnostic
 *   never carries a Windows path separator, a `.ts`/`.db` fragment, or free
 *   text (bounded charset only);
 * - ERR-01: a HARNESS_-branded seam failure rethrows UNWRAPPED (the same
 *   object, never an `ImportError`) at the lineage seam boundary;
 * - ERR-02: a wrapped storage fault surfaces as `STORAGE_FAILURE` carrying the
 *   seam's code literal only (`{ storageCode }`, nothing else);
 * - ERR-03: a named refusal raised inside `runImport` surfaces as itself even
 *   when the transaction's rollback path throws a storage-class fault — a
 *   boundary fallback never erases a named refusal into `STORAGE_FAILURE`.
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
  getProjectionCursor,
  insertEvent,
  insertGoal,
  insertIdempotencyKey,
  insertLease,
  openStorage,
  type Storage,
} from '@foreman-line/kernel-state'
import { digestText } from '../src/canonical.js'
import {
  IMPORT_ERROR_CODE_COUNT,
  IMPORT_ERROR_CODES,
  IMPORT_ERROR_REGISTRY,
  type ImportError,
  type ImportErrorCode,
  importError,
  isHarnessFailure,
  isImportError,
  rethrowSubstrate,
} from '../src/errors.js'
import { corpusDigestOf, createImporter, readAllEvents, runImport } from '../src/import.js'
import { IMPORT_MAX_ROWS, type ImportDocument } from '../src/import-document.js'
import { createLineageGateway, type SourceLineageReader } from '../src/lineage.js'
import { FakeLineage, harnessFailureReader } from './helpers/fake-lineage.js'

const T0 = 1_700_000_000_000_000
const FIXTURE = join(import.meta.dirname, 'fixtures', 'hostile', 'error-laundering.json')
const HARNESS_FAULT_CODE = 'HARNESS_TEST_FAULT'
const STORAGE_FAULT_CODE = 'STORAGE_IO_FAILURE'

/** The spec's closed code list (F05.10 / T10 order); set-equal to the registry. */
const SPEC_IMPORT_ERROR_CODES = [
  'IMPORT_ARGUMENT_INVALID',
  'IMPORT_LIMIT_EXCEEDED',
  'IMPORT_SOURCE_DIGEST_MISMATCH',
  'IMPORT_SOURCE_BLOB_ABSENT',
  'IMPORT_COMMIT_OUT_OF_LINEAGE',
  'IMPORT_EPOCH_EXISTS',
  'IMPORT_APPROVAL_UNEVIDENCED',
  'IMPORT_STATUS_UNKNOWN',
  'DIVERGENCE_STOP',
  'CURSOR_ID_UNREGISTERED',
  'PROJECTION_INPUT_NONCANONICAL',
  'PROJECTION_STATE_INVALID',
  'LINEAGE_READER_FAILURE',
  'STORAGE_FAILURE',
] as const satisfies readonly ImportErrorCode[]

/** The F05.10 safe-diagnostic table, restated per code for set-equality. */
const DECLARED_DIAGNOSTIC_MEMBERS: Record<ImportErrorCode, readonly string[]> = {
  IMPORT_ARGUMENT_INVALID: ['fieldPath'],
  IMPORT_LIMIT_EXCEEDED: ['field', 'bound'],
  IMPORT_SOURCE_DIGEST_MISMATCH: ['rowId', 'fieldId'],
  IMPORT_SOURCE_BLOB_ABSENT: ['rowId', 'fieldId'],
  IMPORT_COMMIT_OUT_OF_LINEAGE: ['commitId'],
  IMPORT_EPOCH_EXISTS: ['rootCommit', 'epochId'],
  IMPORT_APPROVAL_UNEVIDENCED: ['rowId', 'reason'],
  IMPORT_STATUS_UNKNOWN: [],
  DIVERGENCE_STOP: ['reasonCode', 'goalId', 'fieldId'],
  CURSOR_ID_UNREGISTERED: ['projectionId', 'reason'],
  PROJECTION_INPUT_NONCANONICAL: ['field'],
  PROJECTION_STATE_INVALID: [],
  LINEAGE_READER_FAILURE: ['readerCode'],
  STORAGE_FAILURE: ['storageCode'],
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

interface FixtureLineage {
  commits: { id: string; parents: string[] }[]
  blobs: { commitId: string; sourcePath: string; text: string }[]
}

interface ErrorLaunderingRow {
  id: string
  input: {
    mode: 'harness-reader' | 'storage-fault' | 'named-refusal-then-substrate-fault'
    lineage: FixtureLineage
    seed: FixtureSeed
    document: ImportDocument
    request: { principalRef: string; operationId: string }
  }
  expectedOutcome: string
  expectedCode?: string
  expectedReasonCode?: string
}

const parsedRows: unknown = JSON.parse(readFileSync(FIXTURE, 'utf8'))
const ERROR_ROWS = parsedRows as ErrorLaunderingRow[]

function rowById(id: string): ErrorLaunderingRow {
  const row = ERROR_ROWS.find((candidate) => candidate.id === id)
  if (row === undefined) throw new Error(`fixture row ${id} missing`)
  return row
}

function captureThrow(fn: () => unknown): unknown {
  try {
    fn()
  } catch (value) {
    return value
  }
  throw new Error('expected the run to throw')
}

function expectImportError(value: unknown): ImportError {
  assert.ok(isImportError(value), 'expected a typed ImportError')
  return value
}

function isFactoryRefusal(value: unknown): boolean {
  return value instanceof Error && !isImportError(value)
}

function withStorage(fn: (storage: Storage) => void): void {
  const root = mkdtempSync(join(tmpdir(), 'fk-p11-err-'))
  const storage = openStorage({
    storageRoot: root,
    databaseFileName: 'state.db',
    createIfMissing: true,
    clock: fixedClock(T0),
    backupPolicy: { root, retentionDescriptor: null },
  })
  try {
    fn(storage)
  } finally {
    try {
      closeStorage(storage)
    } catch {
      // Best-effort close; cleanup proceeds (R3).
    }
    rmSync(root, { recursive: true, force: true })
  }
}

function applySeed(storage: Storage, seed: FixtureSeed): void {
  for (const goal of seed.goals) {
    insertGoal(storage, {
      goalId: goal.goalId,
      revision: goal.revision,
      status: goal.status,
      updatedAtMicros: T0,
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
      recordedAtMicros: event.recordedAtMicros,
    })
  }
}

/** Row-exact emptiness: probes plus export counts; the seed is unchanged. */
function assertLedgerUnchanged(storage: Storage, row: ErrorLaunderingRow): void {
  assert.deepEqual(readAllEvents(storage), [])
  for (const projectionId of ['md-goals-index', 'md-goal-ledger', 'goal-state']) {
    assert.deepEqual(getProjectionCursor(storage, projectionId), null)
  }
  for (const goal of row.input.seed.goals) {
    assert.deepEqual(getGoal(storage, goal.goalId), {
      goalId: goal.goalId,
      revision: goal.revision,
      status: goal.status,
      pendingTransitionId: null,
      updatedAtMicros: T0,
    })
  }
  const tables = exportStorage(storage).exportDocument.payload.tables
  assert.equal(tables.goals.length, row.input.seed.goals.length)
  assert.equal(tables.events.length, row.input.seed.events.length)
  assert.equal(tables.leases.length, row.input.seed.leases.length)
  assert.equal(tables.idempotency_keys.length, row.input.seed.idempotencyKeys.length)
  assert.equal(tables.artifacts.length, 0)
  assert.equal(tables.projection_cursors.length, 0)
  assert.equal(tables.transitions.length, 0)
  assert.equal(tables.wakeup_handoffs.length, 0)
}

type Driver = Storage['driver']

/**
 * The fault seam (ERR-02/ERR-03): a Proxy over the handle's `driver` whose
 * `prepare` (storage-fault mode) or `exec('ROLLBACK')` (rollback mode) throws
 * the substrate-shaped `{ code: 'STORAGE_IO_FAILURE' }` after the run raised.
 */
function faultedDriver(driver: Driver, faultOn: 'prepare' | 'rollback'): Driver {
  const fault = Object.assign(new Error('injected storage fault'), { code: STORAGE_FAULT_CODE })
  return new Proxy(driver, {
    get(target, property) {
      const member = Reflect.get(target, property)
      if (typeof member !== 'function') return member
      return (...args: unknown[]): unknown => {
        if (property === 'prepare' && faultOn === 'prepare') throw fault
        if (property === 'exec' && faultOn === 'rollback') {
          const sql = args[0]
          if (typeof sql === 'string' && sql.includes('ROLLBACK')) throw fault
        }
        return member.apply(target, args)
      }
    },
  })
}

function runImportCaptured(
  storage: Storage,
  row: ErrorLaunderingRow,
  reader: SourceLineageReader,
): unknown {
  const importer = createImporter({
    storage,
    clock: fixedClock(T0),
    toolVersion: 'kernel-import-test',
    lineageReader: reader,
  })
  return captureThrow(() =>
    runImport(importer, {
      importDocument: row.input.document,
      principalRef: row.input.request.principalRef,
      operationId: row.input.request.operationId,
    }),
  )
}

function findBlobText(
  lineage: FixtureLineage,
  provenance: { sourcePath: string; sourceCommit: string },
): string {
  for (const blob of lineage.blobs) {
    if (blob.commitId === provenance.sourceCommit && blob.sourcePath === provenance.sourcePath) {
      return blob.text
    }
  }
  throw new Error(`fixture blob missing for ${provenance.sourcePath}`)
}

/** One bounded, fully-populated diagnostic per code (spec values, closed vocab). */
function constructCodeError(code: ImportErrorCode): ImportError {
  switch (code) {
    case 'IMPORT_ARGUMENT_INVALID':
      return importError('IMPORT_ARGUMENT_INVALID', { fieldPath: 'rows[0].goalId' })
    case 'IMPORT_LIMIT_EXCEEDED':
      return importError('IMPORT_LIMIT_EXCEEDED', { field: 'rows', bound: IMPORT_MAX_ROWS })
    case 'IMPORT_SOURCE_DIGEST_MISMATCH':
      return importError('IMPORT_SOURCE_DIGEST_MISMATCH', {
        rowId: 'goal-x',
        fieldId: 'source.sourceDigest',
      })
    case 'IMPORT_SOURCE_BLOB_ABSENT':
      return importError('IMPORT_SOURCE_BLOB_ABSENT', {
        rowId: 'goal-x',
        fieldId: 'source.sourceDigest',
      })
    case 'IMPORT_COMMIT_OUT_OF_LINEAGE':
      return importError('IMPORT_COMMIT_OUT_OF_LINEAGE', {
        commitId: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      })
    case 'IMPORT_EPOCH_EXISTS':
      return importError('IMPORT_EPOCH_EXISTS', {
        rootCommit: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        epochId: 'imp-aaaaaaaaaaaa',
      })
    case 'IMPORT_APPROVAL_UNEVIDENCED':
      return importError('IMPORT_APPROVAL_UNEVIDENCED', {
        rowId: 'goal-x',
        reason: 'provenance-absent',
      })
    case 'IMPORT_STATUS_UNKNOWN':
      return importError('IMPORT_STATUS_UNKNOWN', {})
    case 'DIVERGENCE_STOP':
      return importError('DIVERGENCE_STOP', {
        reasonCode: 'status',
        goalId: 'goal-x',
        fieldId: 'claimedStatus',
      })
    case 'CURSOR_ID_UNREGISTERED':
      return importError('CURSOR_ID_UNREGISTERED', {
        projectionId: 'md-other-stream',
        reason: 'unregistered',
      })
    case 'PROJECTION_INPUT_NONCANONICAL':
      return importError('PROJECTION_INPUT_NONCANONICAL', { field: 'events.payload' })
    case 'PROJECTION_STATE_INVALID':
      return importError('PROJECTION_STATE_INVALID', {})
    case 'LINEAGE_READER_FAILURE':
      return importError('LINEAGE_READER_FAILURE', { readerCode: 'reader-failure' })
    case 'STORAGE_FAILURE':
      return importError('STORAGE_FAILURE', { storageCode: 'STORAGE_BUSY' })
  }
}

/** The factory must refuse one unbounded diagnostic shape per code. */
function assertUnboundedRefused(code: ImportErrorCode): void {
  switch (code) {
    case 'IMPORT_ARGUMENT_INVALID':
      assert.throws(
        () => importError('IMPORT_ARGUMENT_INVALID', { fieldPath: 'x'.repeat(200) }),
        isFactoryRefusal,
      )
      return
    case 'IMPORT_LIMIT_EXCEEDED':
      assert.throws(
        () => importError('IMPORT_LIMIT_EXCEEDED', { field: 'rows', bound: -1 }),
        isFactoryRefusal,
      )
      return
    case 'IMPORT_SOURCE_DIGEST_MISMATCH':
      assert.throws(
        () =>
          importError('IMPORT_SOURCE_DIGEST_MISMATCH', {
            rowId: 'bad id!!',
            fieldId: 'source.sourceDigest',
          }),
        isFactoryRefusal,
      )
      return
    case 'IMPORT_SOURCE_BLOB_ABSENT':
      assert.throws(
        () =>
          importError('IMPORT_SOURCE_BLOB_ABSENT', {
            rowId: 'bad id!!',
            fieldId: 'source.sourceDigest',
          }),
        isFactoryRefusal,
      )
      return
    case 'IMPORT_COMMIT_OUT_OF_LINEAGE':
      assert.throws(
        () => importError('IMPORT_COMMIT_OUT_OF_LINEAGE', { commitId: 'x'.repeat(200) }),
        isFactoryRefusal,
      )
      return
    case 'IMPORT_EPOCH_EXISTS':
      assert.throws(
        () =>
          importError('IMPORT_EPOCH_EXISTS', {
            rootCommit: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
            epochId: 'x'.repeat(200),
          }),
        isFactoryRefusal,
      )
      return
    case 'IMPORT_APPROVAL_UNEVIDENCED':
      assert.throws(
        () =>
          importError('IMPORT_APPROVAL_UNEVIDENCED', {
            rowId: 'goal-x',
            reason: 'bogus-reason',
          } as never),
        isFactoryRefusal,
      )
      return
    case 'IMPORT_STATUS_UNKNOWN':
      assert.throws(
        () => importError('IMPORT_STATUS_UNKNOWN', { note: 'x' } as never),
        isFactoryRefusal,
      )
      return
    case 'DIVERGENCE_STOP':
      assert.throws(
        () =>
          importError('DIVERGENCE_STOP', {
            reasonCode: 'bogus',
            goalId: 'goal-x',
            fieldId: 'claimedStatus',
          } as never),
        isFactoryRefusal,
      )
      return
    case 'CURSOR_ID_UNREGISTERED':
      assert.throws(
        () =>
          importError('CURSOR_ID_UNREGISTERED', {
            projectionId: 'md-goals-index',
            reason: 'bogus',
          } as never),
        isFactoryRefusal,
      )
      return
    case 'PROJECTION_INPUT_NONCANONICAL':
      assert.throws(
        () => importError('PROJECTION_INPUT_NONCANONICAL', { field: 'x'.repeat(200) }),
        isFactoryRefusal,
      )
      return
    case 'PROJECTION_STATE_INVALID':
      assert.throws(
        () => importError('PROJECTION_STATE_INVALID', { note: 'x' } as never),
        isFactoryRefusal,
      )
      return
    case 'LINEAGE_READER_FAILURE':
      assert.throws(
        () => importError('LINEAGE_READER_FAILURE', { readerCode: 'reader failure!' }),
        isFactoryRefusal,
      )
      return
    case 'STORAGE_FAILURE':
      assert.throws(
        () => importError('STORAGE_FAILURE', { storageCode: 'STORAGE_IO_FAILURE has spaces' }),
        isFactoryRefusal,
      )
      return
  }
}

// --- closed registry: derived count and declared members ---------------------

test('registry size is derived from the codes array, never a hand-typed literal', () => {
  assert.equal(IMPORT_ERROR_CODE_COUNT, IMPORT_ERROR_CODES.length)
  assert.equal(IMPORT_ERROR_CODE_COUNT, SPEC_IMPORT_ERROR_CODES.length)
  assert.equal(IMPORT_ERROR_CODE_COUNT, Object.keys(IMPORT_ERROR_REGISTRY).length)
})

test('registry code set equals the spec code enum generated from the spec list', () => {
  assert.deepEqual(new Set(IMPORT_ERROR_CODES), new Set(SPEC_IMPORT_ERROR_CODES))
})

test('every registry code carries exactly its declared diagnostic members', () => {
  assert.deepEqual(Object.keys(IMPORT_ERROR_REGISTRY).sort(), [...IMPORT_ERROR_CODES].sort())
  for (const code of IMPORT_ERROR_CODES) {
    assert.deepEqual(
      [...IMPORT_ERROR_REGISTRY[code].diagnosticMembers].sort(),
      [...DECLARED_DIAGNOSTIC_MEMBERS[code]].sort(),
      code,
    )
  }
})

// --- fault-injection matrix: exactly one test per code -----------------------

for (const code of IMPORT_ERROR_CODES) {
  test(`fault-injection: ${code} carries exactly its declared members and refuses unbounded`, () => {
    const error = constructCodeError(code)
    assert.ok(isImportError(error))
    assert.equal(error.name, 'ImportError')
    assert.equal(error.code, code)
    assert.equal(error.message, code)
    assert.deepEqual(
      Object.keys(error.diagnostic).sort(),
      [...DECLARED_DIAGNOSTIC_MEMBERS[code]].sort(),
    )
    for (const member of DECLARED_DIAGNOSTIC_MEMBERS[code]) {
      assert.ok(member in error.diagnostic, `${code}: missing ${member}`)
    }
    assertUnboundedRefused(code)
  })
}

// --- fixture digests are real (recomputed over the seeded blob bytes) --------

test('fixture digests are real: recomputed over the seeded blob bytes and row tuples', () => {
  for (const row of ERROR_ROWS) {
    for (const record of row.input.document.rows) {
      const text = findBlobText(row.input.lineage, record.source)
      assert.equal(record.source.sourceDigest, digestText(text), `${row.id}: sourceDigest`)
    }
    assert.equal(
      row.input.document.corpusDigest,
      corpusDigestOf(row.input.document.rows),
      `${row.id}: corpusDigest`,
    )
  }
})

// --- ERR-01..03 row-driven error-laundering ---------------------------------

test('ERR-01: HARNESS_-branded seam failure surfaces as itself, never an ImportError', () => {
  const row = rowById('ERR-01')
  assert.equal(row.input.mode, 'harness-reader')
  assert.equal(row.expectedOutcome, 'harness-error-surfaces-as-itself')
  const firstCommit = row.input.lineage.commits[0]
  assert.ok(firstCommit !== undefined, 'fixture lineage needs a commit')
  const firstBlob = row.input.lineage.blobs[0]
  assert.ok(firstBlob !== undefined, 'fixture lineage needs a blob')
  const gateway = createLineageGateway(harnessFailureReader())
  const fromCommitExists = captureThrow(() => gateway.commitExists(firstCommit.id))
  const fromIsAncestor = captureThrow(() => gateway.isAncestor(firstCommit.id, firstCommit.id))
  const fromBlob = captureThrow(() =>
    gateway.readCommittedBlob(firstBlob.commitId, firstBlob.sourcePath),
  )
  for (const thrown of [fromCommitExists, fromIsAncestor, fromBlob]) {
    assert.equal(isImportError(thrown), false, 'a HARNESS_* failure is never an ImportError')
    assert.equal(isHarnessFailure(thrown), true)
    assert.equal((thrown as { code: unknown }).code, HARNESS_FAULT_CODE)
  }
  assert.equal(fromCommitExists, fromIsAncestor, 'the seam fault rethrows as itself, unwrapped')
  assert.equal(fromCommitExists, fromBlob, 'the seam fault rethrows as itself, unwrapped')
})

test('ERR-02: wrapped storage fault surfaces as STORAGE_FAILURE carrying the code literal only', () => {
  const row = rowById('ERR-02')
  assert.equal(row.input.mode, 'storage-fault')
  assert.equal(row.expectedOutcome, 'storage-failure-code-literal-only')
  withStorage((storage) => {
    applySeed(storage, row.input.seed)
    const faulted: Storage = { ...storage, driver: faultedDriver(storage.driver, 'prepare') }
    const thrown = runImportCaptured(faulted, row, new FakeLineage(row.input.lineage))
    const error = expectImportError(thrown)
    assert.equal(error.code, 'STORAGE_FAILURE')
    assert.equal(error.message, 'STORAGE_FAILURE')
    assert.deepEqual({ ...error.diagnostic }, { storageCode: STORAGE_FAULT_CODE })
    assert.deepEqual(Object.keys(error.diagnostic), ['storageCode'])
    assertLedgerUnchanged(storage, row)
  })
})

test('ERR-03: boundary fallback never erases a named refusal', () => {
  const row = rowById('ERR-03')
  assert.equal(row.input.mode, 'named-refusal-then-substrate-fault')
  assert.equal(row.expectedOutcome, 'named-refusal-surfaces')
  assert.equal(row.expectedCode, 'DIVERGENCE_STOP')
  assert.equal(row.expectedReasonCode, 'existing-state-collision')
  withStorage((storage) => {
    applySeed(storage, row.input.seed)
    const faulted: Storage = { ...storage, driver: faultedDriver(storage.driver, 'rollback') }
    const thrown = runImportCaptured(faulted, row, new FakeLineage(row.input.lineage))
    const error = expectImportError(thrown)
    assert.equal(error.code, row.expectedCode)
    assert.equal(error.message, 'DIVERGENCE_STOP')
    assert.notEqual(error.code, 'STORAGE_FAILURE', 'the boundary fallback erased the named refusal')
    const seededGoal = row.input.seed.goals[0]
    assert.ok(seededGoal !== undefined)
    assert.deepEqual(
      { ...error.diagnostic },
      { reasonCode: row.expectedReasonCode, goalId: seededGoal.goalId, fieldId: 'goalId' },
    )
    assertLedgerUnchanged(storage, row)
  })
})

// --- error-laundering invariants (failing-when-broken) -----------------------

test('laundering invariant: a named refusal raised inside runImport surfaces as itself', () => {
  withStorage((storage) => {
    const faulted: Storage = { ...storage, driver: faultedDriver(storage.driver, 'rollback') }
    const importer = createImporter({
      storage: faulted,
      clock: fixedClock(T0),
      toolVersion: 'kernel-import-test',
      lineageReader: new FakeLineage(),
    })
    const thrown = captureThrow(() =>
      runImport(importer, {
        importDocument: null,
        principalRef: 'operator-1',
        operationId: 'op-inv-refusal',
      }),
    )
    const error = expectImportError(thrown)
    assert.equal(error.code, 'IMPORT_ARGUMENT_INVALID')
    assert.equal(error.message, 'IMPORT_ARGUMENT_INVALID')
    assert.notEqual(error.code, 'STORAGE_FAILURE', 'the boundary fallback erased the named refusal')
    assert.deepEqual({ ...error.diagnostic }, { fieldPath: '$' })
  })
})

test('laundering invariant: a HARNESS_* failure is never an ImportError and keeps its code', () => {
  const fault = Object.assign(new Error('boom'), { code: HARNESS_FAULT_CODE })
  const thrown = captureThrow(() => rethrowSubstrate(fault))
  assert.equal(thrown, fault, 'the harness failure rethrows unwrapped, as itself')
  assert.equal(isImportError(thrown), false)
  assert.equal(isHarnessFailure(thrown), true)
  assert.equal((thrown as { code: unknown }).code, HARNESS_FAULT_CODE)
})

test('laundering invariant: rethrowSubstrate maps STORAGE_BUSY to STORAGE_FAILURE code-only', () => {
  const thrown = captureThrow(() => rethrowSubstrate({ code: 'STORAGE_BUSY' }))
  const error = expectImportError(thrown)
  assert.equal(error.code, 'STORAGE_FAILURE')
  assert.equal(error.message, 'STORAGE_FAILURE')
  assert.deepEqual({ ...error.diagnostic }, { storageCode: 'STORAGE_BUSY' })
  assert.deepEqual(Object.keys(error.diagnostic), ['storageCode'])
})

// --- safe-diagnostic scan ----------------------------------------------------

test('safe-diagnostic scan: serialized diagnostics are bounded, charset-clean, path-free', () => {
  const SAFE_VALUE_RE = /^[A-Za-z0-9._:[\]-]+$/
  for (const code of IMPORT_ERROR_CODES) {
    const error = constructCodeError(code)
    const serialized = JSON.stringify({ ...error.diagnostic })
    assert.equal(serialized.includes('\\'), false, `${code}: backslash in ${serialized}`)
    assert.equal(serialized.includes('.ts'), false, `${code}: .ts fragment in ${serialized}`)
    assert.equal(serialized.includes('.db'), false, `${code}: .db fragment in ${serialized}`)
    for (const [member, value] of Object.entries(error.diagnostic)) {
      assert.ok(DECLARED_DIAGNOSTIC_MEMBERS[code].includes(member), `${code}: undeclared ${member}`)
      if (typeof value === 'number') {
        assert.ok(Number.isSafeInteger(value), `${code}: ${member} is not integral`)
      } else {
        assert.ok(value.length <= 128, `${code}: ${member} is unbounded`)
        assert.match(value, SAFE_VALUE_RE, `${code}: ${member} carries free text`)
      }
    }
  }
})
