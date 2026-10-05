/**
 * C2 WAL truncation/recovery (AC5) and the WAL-mode assertion (CTRL-01).
 * Recovery-positive rows must show exact committed-state survival, not merely
 * "did not throw". The child writer exits crash-style so real WAL frames
 * survive for frame-level crafting.
 */
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
  copyFileSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  truncateSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { fixedClock } from '../src/clock.js'
import { StorageError } from '../src/errors.js'
import {
  checkpoint,
  closeStorage,
  type DriverConnection,
  type OpenStorageConfig,
  openStorage,
  openStorageWithDriver,
} from '../src/open.js'
import { queryEvents } from '../src/rows.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const PKG_ROOT = resolve(HERE, '..')

interface WalRecord {
  id: string
  input: { scenario: string; sizeBytes?: number; transactions?: number; reportedMode?: string }
  expectedOutcome: { state: string; expectEventIds: string[]; absentEventIds?: string[] } | string
  expectedCode?: string
}

const WAL = JSON.parse(readFileSync(join(HERE, 'fixtures', 'hostile', 'wal.json'), 'utf8')) as {
  records: WalRecord[]
}

function record(id: string): WalRecord {
  const found = WAL.records.find((candidate) => candidate.id === id)
  assert.ok(found, `${id} missing from wal.json`)
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

// The child writer: string concatenation only, so this template literal stays
// free of nested template syntax. Exits crash-style (process.exit, no close).
const CHILD_SOURCE = [
  'import {',
  '  checkpoint,',
  '  fixedClock,',
  '  insertEvent,',
  '  insertGoal,',
  '  openStorage,',
  '  withTransaction,',
  `} from 'file://${join(PKG_ROOT, 'src', 'index.js').split('\\').join('/')}'`,
  'const root = process.argv[2]',
  'const scenario = process.argv[3]',
  'const storage = openStorage({',
  '  storageRoot: root,',
  "  databaseFileName: 'state.db',",
  '  createIfMissing: true,',
  '  clock: fixedClock(1700000000000000),',
  '  backupPolicy: { root, retentionDescriptor: null },',
  '})',
  "storage.driver.pragma('wal_autocheckpoint=0')",
  'function event(id, n) {',
  '  withTransaction(storage, (s) => {',
  '    insertEvent(s, {',
  '      eventId: id,',
  "      goalId: 'goal-1',",
  "      kind: 'created',",
  "      payload: JSON.stringify({ n: n, pad: 'x'.repeat(12000) }),",
  "      payloadDigest: 'sha256:' + 'a'.repeat(64),",
  "      principalRef: 'principal-1',",
  "      operationId: 'op-' + id,",
  '      recordedAtMicros: 1700000000000000 + n,',
  '    })',
  '  })',
  '}',
  "insertGoal(storage, { goalId: 'goal-1', revision: 0, status: 'active', updatedAtMicros: 1 })",
  "if (scenario === 'evt1-cp-evt2') {",
  "  event('evt-1', 1)",
  "  checkpoint(storage, 'TRUNCATE')",
  "  event('evt-2', 2)",
  "} else if (scenario === 'evt1-cp-evt2-oversized') {",
  "  event('evt-1', 1)",
  "  checkpoint(storage, 'TRUNCATE')",
  '  for (let i = 0; i < 39; i += 1) event("evt-f" + String(i).padStart(3, "0"), 100 + i)',
  "  event('evt-2', 2)",
  "} else if (scenario === 'evt1-evt2') {",
  "  event('evt-1', 1)",
  "  event('evt-2', 2)",
  "} else if (scenario === 'evt1-evt2-clean') {",
  "  event('evt-1', 1)",
  "  event('evt-2', 2)",
  "  checkpoint(storage, 'PASSIVE')",
  '} else {',
  '  throw new Error("unknown scenario " + scenario)',
  '}',
  'process.exit(0)',
].join('\n')

function runChild(root: string, scenario: string): void {
  const childPath = join(root, 'wal-child.mts')
  writeFileSync(childPath, CHILD_SOURCE)
  const result = spawnSync(process.execPath, ['--import', 'tsx', childPath, root, scenario], {
    cwd: PKG_ROOT,
    encoding: 'utf8',
  })
  assert.equal(result.status, 0, `child failed: ${result.stderr}`)
}

interface FrameLayout {
  pageSize: number
  frameSize: number
  frameCount: number
}

function walLayout(walPath: string): FrameLayout {
  const wal = readFileSync(walPath)
  assert.ok(wal.length >= 32, 'expected a WAL header')
  // WAL header: 0 magic, 4 format version, 8 database page size.
  const pageSize = wal.readUInt32BE(8)
  const frameSize = 24 + pageSize
  return { pageSize, frameSize, frameCount: Math.floor((wal.length - 32) / frameSize) }
}

function corruptFrame(walPath: string, frameIndex: number): void {
  const { frameSize, frameCount } = walLayout(walPath)
  assert.ok(frameIndex < frameCount, `no frame ${frameIndex} (count ${frameCount})`)
  const wal = readFileSync(walPath)
  const offset = 32 + frameIndex * frameSize
  for (let i = offset; i < offset + 8; i += 1) wal[i] = (wal[i] as number) ^ 0xff
  writeFileSync(walPath, wal)
}

function eventIds(root: string): string[] {
  const storage = openStorage(configFor(root))
  try {
    return queryEvents(storage, {}).map((row) => row.eventId)
  } finally {
    closeStorage(storage)
  }
}

function assertRecovered(root: string, outcome: WalRecord['expectedOutcome']): void {
  assert.ok(typeof outcome !== 'string')
  const expected = outcome
  const ids = eventIds(root)
  for (const want of expected.expectEventIds) {
    assert.ok(ids.includes(want), `${want} must survive; got ${ids.join(',')}`)
  }
  for (const absent of expected.absentEventIds ?? []) {
    // No torn transaction: the absent row is fully rolled back.
    assert.ok(!ids.includes(absent), `${absent} must not appear; got ${ids.join(',')}`)
  }
}

test('WAL-01: truncated WAL header recovers to the main file committed state', () => {
  const expected = record('WAL-01')
  const root = mkdtempSync(join(tmpdir(), 'fkp9-wal1-'))
  runChild(root, 'evt1-cp-evt2')
  truncateSync(join(root, 'state.db-wal'), expected.input.sizeBytes ?? 16)
  assertRecovered(root, expected.expectedOutcome)
  rmSync(root, { recursive: true, force: true })
})

test('WAL-02: zero-length WAL recovers to the main file committed state', () => {
  const expected = record('WAL-02')
  const root = mkdtempSync(join(tmpdir(), 'fkp9-wal2-'))
  runChild(root, 'evt1-cp-evt2')
  writeFileSync(join(root, 'state.db-wal'), Buffer.alloc(0))
  assertRecovered(root, expected.expectedOutcome)
  rmSync(root, { recursive: true, force: true })
})

test('WAL-03: torn final frame recovers to the last committed transaction', () => {
  const expected = record('WAL-03')
  const root = mkdtempSync(join(tmpdir(), 'fkp9-wal3-'))
  runChild(root, 'evt1-cp-evt2')
  const { frameCount } = walLayout(join(root, 'state.db-wal'))
  assert.ok(frameCount >= 2, 'expected a multi-frame WAL')
  corruptFrame(join(root, 'state.db-wal'), frameCount - 1)
  assertRecovered(root, expected.expectedOutcome)
  rmSync(root, { recursive: true, force: true })
})

test('WAL-04: stale salt versus main recovers to the main committed state', () => {
  const expected = record('WAL-04')
  const root = mkdtempSync(join(tmpdir(), 'fkp9-wal4-'))
  const foreign = mkdtempSync(join(tmpdir(), 'fkp9-wal4f-'))
  runChild(root, 'evt1-evt2-clean')
  runChild(foreign, 'evt1-cp-evt2')
  // A WAL from a different database carries mismatched salts: every frame is
  // rejected and the main file's committed state stands.
  copyFileSync(join(foreign, 'state.db-wal'), join(root, 'state.db-wal'))
  assertRecovered(root, expected.expectedOutcome)
  rmSync(root, { recursive: true, force: true })
  rmSync(foreign, { recursive: true, force: true })
})

test('WAL-05: oversized uncheckpointed WAL with torn final frame recovers to last committed', () => {
  const expected = record('WAL-05')
  const root = mkdtempSync(join(tmpdir(), 'fkp9-wal5-'))
  runChild(root, 'evt1-cp-evt2-oversized')
  const { frameCount } = walLayout(join(root, 'state.db-wal'))
  assert.ok(frameCount > 40, 'expected an oversized uncheckpointed WAL')
  corruptFrame(join(root, 'state.db-wal'), frameCount - 1)
  assertRecovered(root, expected.expectedOutcome)
  rmSync(root, { recursive: true, force: true })
})

test('WAL-06: missing or zeroed SHM recovers to the last committed transaction', () => {
  const expected = record('WAL-06')
  const root = mkdtempSync(join(tmpdir(), 'fkp9-wal6-'))
  runChild(root, 'evt1-evt2')
  try {
    unlinkSync(join(root, 'state.db-shm'))
  } catch {
    writeFileSync(join(root, 'state.db-shm'), Buffer.alloc(0))
  }
  assertRecovered(root, expected.expectedOutcome)
  rmSync(root, { recursive: true, force: true })
})

test('WAL-07: inconsistent checksums mid-sequence recovers to the last committed boundary', () => {
  const expected = record('WAL-07')
  const root = mkdtempSync(join(tmpdir(), 'fkp9-wal7-'))
  runChild(root, 'evt1-cp-evt2-oversized')
  const { frameCount } = walLayout(join(root, 'state.db-wal'))
  corruptFrame(join(root, 'state.db-wal'), Math.floor(frameCount / 2))
  assertRecovered(root, expected.expectedOutcome)
  rmSync(root, { recursive: true, force: true })
})

test('POS-05: checkpoint TRUNCATE then reopen lands at head', () => {
  const expected = record('POS-05')
  assert.equal(expected.expectedOutcome, 'opens-at-head')
  const root = mkdtempSync(join(tmpdir(), 'fkp9-pos5-'))
  runChild(root, 'evt1-cp-evt2')
  const storage = openStorage(configFor(root))
  checkpoint(storage, 'TRUNCATE')
  closeStorage(storage)
  const ids = eventIds(root)
  assert.deepEqual([...ids].sort(), ['evt-1', 'evt-2'])
  rmSync(root, { recursive: true, force: true })
})

test('CTRL-01: WAL-mode assertion refuses when the pragma seam reports a non-WAL mode', () => {
  const expected = record('CTRL-01')
  assert.equal(expected.expectedCode, 'STORAGE_WAL_UNAVAILABLE')
  const root = mkdtempSync(join(tmpdir(), 'fkp9-ctrl1-'))
  const real = openStorage(configFor(root))
  closeStorage(real)
  const reported = expected.input.reportedMode
  const stub: DriverConnection = {
    exec: () => undefined,
    prepare: () => ({ run: () => ({ changes: 1 }), get: () => undefined, all: () => [] }),
    pragma: () => [{ journal_mode: reported }],
    close: () => undefined,
  }
  try {
    openStorageWithDriver(configFor(root), () => stub)
    assert.fail('expected STORAGE_WAL_UNAVAILABLE')
  } catch (error) {
    assert.ok(error instanceof StorageError)
    assert.equal(error.code, 'STORAGE_WAL_UNAVAILABLE')
    assert.equal(error.diagnostic.mode, reported)
  }
  rmSync(root, { recursive: true, force: true })
})

test('every C2 row pre-declares committed-state survival', () => {
  const c2 = WAL.records.filter((candidate) => candidate.id.startsWith('WAL-'))
  assert.equal(c2.length, 7)
  for (const candidate of c2) {
    const outcome = candidate.expectedOutcome
    if (typeof outcome === 'string') {
      throw new Error(`${candidate.id} must declare committed-state expectations`)
    }
    assert.ok(Array.isArray(outcome.expectEventIds))
    assert.ok(outcome.expectEventIds.length > 0)
  }
})
