/**
 * C1 corrupt-database refusals (AC2): garbage headers, short files, flipped
 * interior pages, lookalike headers, and zero-byte/stale-WAL pairings — every
 * row a total refusal with no salvage export and no best-effort open.
 */
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { fixedClock } from '../src/clock.js'
import { StorageError } from '../src/errors.js'
import { closeStorage, type OpenStorageConfig, openStorage, verifyStorage } from '../src/open.js'

interface CorruptRecord {
  id: string
  input: { materialize: string; sizeBytes?: number; flipAtByte?: number }
  expectedCode: string
}

const CORRUPT = JSON.parse(
  readFileSync(join(import.meta.dirname, 'fixtures', 'hostile', 'corrupt.json'), 'utf8'),
) as { records: CorruptRecord[] }

function record(id: string): CorruptRecord {
  const found = CORRUPT.records.find((candidate) => candidate.id === id)
  assert.ok(found, `${id} missing from corrupt.json`)
  return found
}

function configFor(root: string): OpenStorageConfig {
  return {
    storageRoot: root,
    databaseFileName: 'state.db',
    createIfMissing: true,
    clock: fixedClock(1_700_000_000_000_000),
    backupPolicy: { root, retentionDescriptor: null },
  }
}

function makeValidDatabase(root: string, rows: number): void {
  const storage = openStorage(configFor(root))
  storage.driver
    .prepare(
      `INSERT INTO goals (goal_id, revision, status, pending_transition_id, updated_at_micros) VALUES ('goal-1', 0, 'active', NULL, 1)`,
    )
    .run()
  for (let i = 0; i < rows; i += 1) {
    storage.driver
      .prepare(
        `INSERT INTO events (event_id, goal_id, kind, payload, payload_digest, principal_ref, operation_id, recorded_at_micros)
         VALUES (?, 'goal-1', 'transition.requested', ?, '${`sha256:${'a'.repeat(64)}`}', 'principal-1', ?, ?)`,
      )
      .run(`evt-${i}`, 'x'.repeat(2000), `op-${i}`, i)
  }
  closeStorage(storage)
}

function expectRefusal(root: string, expectedCode: string): StorageError {
  try {
    openStorage(configFor(root))
  } catch (error) {
    assert.ok(error instanceof StorageError, `expected StorageError, got ${String(error)}`)
    assert.equal(error.code, expectedCode)
    // Total refusal: nothing salvage-shaped is reachable from the failing open.
    assert.throws(
      () => verifyStorage(join(root, 'state.db')),
      (verifyError: unknown) => verifyError instanceof StorageError,
    )
    return error
  }
  throw new Error(`expected ${expectedCode} to refuse`)
}

test('CORR-01: random-bytes file refuses with STORAGE_NOT_A_DATABASE', () => {
  const expected = record('CORR-01')
  const root = mkdtempSync(join(tmpdir(), 'fkp9-corr1-'))
  const bytes = Buffer.alloc(expected.input.sizeBytes ?? 16_384)
  for (let i = 0; i < bytes.length; i += 1) bytes[i] = (i * 37 + 11) % 256
  writeFileSync(join(root, 'state.db'), bytes)
  expectRefusal(root, expected.expectedCode)
  rmSync(root, { recursive: true, force: true })
})

test('CORR-02: file shorter than one page refuses with STORAGE_NOT_A_DATABASE', () => {
  const expected = record('CORR-02')
  const root = mkdtempSync(join(tmpdir(), 'fkp9-corr2-'))
  writeFileSync(join(root, 'state.db'), Buffer.alloc(expected.input.sizeBytes ?? 100, 0x41))
  expectRefusal(root, expected.expectedCode)
  rmSync(root, { recursive: true, force: true })
})

test('CORR-03: valid header, flipped bytes in an interior page refuses with STORAGE_CORRUPT', () => {
  const expected = record('CORR-03')
  const root = mkdtempSync(join(tmpdir(), 'fkp9-corr3-'))
  makeValidDatabase(root, 40)
  const bytes = readFileSync(join(root, 'state.db'))
  const flipAt = expected.input.flipAtByte ?? 8192
  assert.ok(bytes.length > flipAt + 80, 'database must have an interior page')
  for (let i = flipAt; i < flipAt + 80; i += 1) bytes[i] = (bytes[i] as number) ^ 0xff
  writeFileSync(join(root, 'state.db'), bytes)
  expectRefusal(root, expected.expectedCode)
  rmSync(root, { recursive: true, force: true })
})

test('CORR-04: invalid page-size field refuses with STORAGE_NOT_A_DATABASE', () => {
  const expected = record('CORR-04')
  const root = mkdtempSync(join(tmpdir(), 'fkp9-corr4-'))
  makeValidDatabase(root, 2)
  const bytes = readFileSync(join(root, 'state.db'))
  bytes.writeUInt16BE(3, 16)
  writeFileSync(join(root, 'state.db'), bytes)
  expectRefusal(root, expected.expectedCode)
  rmSync(root, { recursive: true, force: true })
})

test('CORR-05: SQLite-lookalike header with garbage body refuses with STORAGE_CORRUPT', () => {
  const expected = record('CORR-05')
  const root = mkdtempSync(join(tmpdir(), 'fkp9-corr5-'))
  makeValidDatabase(root, 2)
  const bytes = readFileSync(join(root, 'state.db'))
  const body = Buffer.alloc(bytes.length, 0x5a)
  bytes.copy(body, 0, 0, 100)
  writeFileSync(join(root, 'state.db'), body)
  expectRefusal(root, expected.expectedCode)
  rmSync(root, { recursive: true, force: true })
})

test('CORR-06: zero-byte main file with stale WAL sibling refuses with STORAGE_NOT_A_DATABASE', () => {
  const expected = record('CORR-06')
  const root = mkdtempSync(join(tmpdir(), 'fkp9-corr6-'))
  makeValidDatabase(root, 20)
  // A crashed writer leaves a stale WAL sibling behind a zero-byte main file.
  writeFileSync(join(root, 'state.db'), Buffer.alloc(0))
  writeFileSync(join(root, 'state.db-wal'), Buffer.alloc(4096, 0x77))
  expectRefusal(root, expected.expectedCode)
  rmSync(root, { recursive: true, force: true })
})

test('every C1 row declares a total-refusal code from the registry family', () => {
  assert.equal(CORRUPT.records.length, 6)
  for (const candidate of CORRUPT.records) {
    assert.ok(
      ['STORAGE_NOT_A_DATABASE', 'STORAGE_CORRUPT'].includes(candidate.expectedCode),
      `${candidate.id} declares ${candidate.expectedCode}`,
    )
  }
})
