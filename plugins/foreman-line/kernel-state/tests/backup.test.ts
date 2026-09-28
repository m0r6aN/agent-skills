/**
 * INF-8 backup/restore contract (AC9, contract level only) and POS-04's
 * in-process roundtrip. No process-boundary recovery proof, no RPO/RTO
 * objective, and no recovery authority primitive is claimed — restore never
 * silently restarts dispatch (the package exposes no restart surface).
 */
import assert from 'node:assert/strict'
import {
  copyFileSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  type BackupManifest,
  backupManifestPathFor,
  backupTo,
  pruneBackups,
  verifyBackup,
} from '../src/backup.js'
import { fixedClock } from '../src/clock.js'
import { StorageError } from '../src/errors.js'
import * as kernelState from '../src/index.js'
import {
  checkpoint,
  closeStorage,
  type OpenStorageConfig,
  openStorage,
  openStorageWithDriver,
} from '../src/open.js'
import { insertEvent, insertGoal, queryEvents } from '../src/rows.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const PKG_ROOT = resolve(HERE, '..')
const PACKAGED_0001 = readFileSync(join(PKG_ROOT, 'migrations', '0001-initial.sql'))
const PACKAGED_0002 = readFileSync(join(PKG_ROOT, 'migrations', '0002-goal-status-checks.sql'))
const T0 = 1_700_000_000_000_000

interface ConcRecord {
  id: string
  input: { scenario: string }
  expectedOutcome?: string
}

const CONC = JSON.parse(
  readFileSync(join(HERE, 'fixtures', 'hostile', 'concurrency.json'), 'utf8'),
) as { records: ConcRecord[] }

function configFor(root: string, backupRoot: string): OpenStorageConfig {
  return {
    storageRoot: root,
    databaseFileName: 'state.db',
    createIfMissing: true,
    clock: fixedClock(T0),
    backupPolicy: { root: backupRoot, retentionDescriptor: null },
  }
}

function seedWithEvents(root: string, backupRoot: string): void {
  const storage = openStorage(configFor(root, backupRoot))
  insertGoal(storage, { goalId: 'goal-1', revision: 0, status: 'active', updatedAtMicros: T0 })
  insertEvent(storage, {
    eventId: 'evt-1',
    goalId: 'goal-1',
    kind: 'created',
    payload: '{"n":1}',
    payloadDigest: `sha256:${'a'.repeat(64)}`,
    principalRef: 'principal-1',
    operationId: 'op-1',
    recordedAtMicros: T0,
  })
  closeStorage(storage)
}

test('POS-04: backupTo -> verifyBackup -> operator restore sequence in-process', async () => {
  const record = CONC.records.find((candidate) => candidate.id === 'POS-04')
  assert.ok(record, 'POS-04 missing from concurrency.json')
  assert.equal(record.expectedOutcome, 'restored-state-matches-committed-boundary')
  const root = mkdtempSync(join(tmpdir(), 'fkp9-pos4-'))
  const backupRoot = mkdtempSync(join(tmpdir(), 'fkp9-pos4b-'))
  seedWithEvents(root, backupRoot)
  const storage = openStorage(configFor(root, backupRoot))
  insertEvent(storage, {
    eventId: 'evt-2',
    goalId: 'goal-1',
    kind: 'updated',
    payload: '{"n":2}',
    payloadDigest: `sha256:${'b'.repeat(64)}`,
    principalRef: 'principal-1',
    operationId: 'op-2',
    recordedAtMicros: T0 + 1,
  })
  const manifest = await backupTo(storage, 'restore-point.db')
  assert.match(manifest.backupBytesDigest, /^sha256:[0-9a-f]{64}$/)

  // (a) bounded shutdown of all writers.
  closeStorage(storage)
  // (b) verify the chosen backup independently of the producing process.
  const verified = verifyBackup(join(backupRoot, 'restore-point.db'))
  assert.equal(verified.schemaVersion, 2)
  // (c) checkpoint the live database and move the prior file aside
  //     (never overwrite without a retained prior copy).
  const live = openStorage(configFor(root, backupRoot))
  checkpoint(live, 'TRUNCATE')
  closeStorage(live)
  renameSync(join(root, 'state.db'), join(root, 'state.db.prior'))
  // (d) place the backup at the storage path.
  copyFileSync(join(backupRoot, 'restore-point.db'), join(root, 'state.db'))
  // (e) openStorage re-runs the full startup sequence.
  const restored = openStorage(configFor(root, backupRoot))
  const events = queryEvents(restored, {}).map((row) => row.eventId)
  assert.deepEqual(events, ['evt-1', 'evt-2'])
  closeStorage(restored)
  // (f) dispatch restarts only by explicit operator action: the package
  //     exposes no restart/recovery primitive (asserted below).
  assert.ok(existsSync(join(root, 'state.db.prior')), 'the prior copy is retained')
  rmSync(root, { recursive: true, force: true })
  rmSync(backupRoot, { recursive: true, force: true })
})

test('restore never silently restarts dispatch: no restart-shaped export exists', () => {
  const names = Object.keys(kernelState).sort()
  for (const name of names) {
    assert.ok(
      !/dispatch|restart|recover|enforce|promote/i.test(name),
      `${name} looks like a recovery-authority primitive`,
    )
  }
})

test('protected destination: inside the storage root refuses with outside-root', async () => {
  const root = mkdtempSync(join(tmpdir(), 'fkp9-bdest-'))
  const backupRoot = mkdtempSync(join(tmpdir(), 'fkp9-bdestb-'))
  // Configure the backup root to the storage root so any destination is inside.
  const storage = openStorage(configFor(root, root))
  await assert.rejects(
    () => backupTo(storage, 'inside.db'),
    (error: unknown) => {
      assert.ok(error instanceof StorageError)
      assert.equal(error.code, 'BACKUP_DESTINATION_REFUSED')
      assert.equal(error.diagnostic.reasonCode, 'outside-root')
      return true
    },
  )
  closeStorage(storage)
  rmSync(root, { recursive: true, force: true })
  rmSync(backupRoot, { recursive: true, force: true })
})

test('protected destination: hostile forms refuse with their named reason', async () => {
  const root = mkdtempSync(join(tmpdir(), 'fkp9-bform-'))
  const backupRoot = mkdtempSync(join(tmpdir(), 'fkp9-bformb-'))
  const storage = openStorage(configFor(root, backupRoot))
  await assert.rejects(
    () => backupTo(storage, '../outside.db'),
    (error: unknown) => {
      assert.ok(error instanceof StorageError)
      assert.equal(error.code, 'BACKUP_DESTINATION_REFUSED')
      assert.equal(error.diagnostic.reasonCode, 'traversal')
      return true
    },
  )
  await assert.rejects(
    () => backupTo(storage, 'a\\b.db'),
    (error: unknown) => {
      assert.ok(error instanceof StorageError)
      assert.equal(error.diagnostic.reasonCode, 'backslash')
      return true
    },
  )
  closeStorage(storage)
  rmSync(root, { recursive: true, force: true })
  rmSync(backupRoot, { recursive: true, force: true })
})

test('verifyBackup: tampered bytes, missing manifest, and manifest drift refuse', async () => {
  const root = mkdtempSync(join(tmpdir(), 'fkp9-bverify-'))
  const backupRoot = mkdtempSync(join(tmpdir(), 'fkp9-bverifyb-'))
  seedWithEvents(root, backupRoot)
  const storage = openStorage(configFor(root, backupRoot))
  await backupTo(storage, 'b1.db')
  closeStorage(storage)
  const backupPath = join(backupRoot, 'b1.db')
  const manifestPath = backupManifestPathFor(backupPath)

  // Tampered backup bytes break the manifest digest binding.
  const bytes = readFileSync(backupPath)
  bytes[400] = (bytes[400] as number) ^ 0xff
  writeFileSync(backupPath, bytes)
  assert.throws(
    () => verifyBackup(backupPath),
    (error: unknown) => {
      assert.ok(error instanceof StorageError)
      assert.equal(error.code, 'BACKUP_INTEGRITY_FAILED')
      return true
    },
  )

  // Missing manifest refuses.
  unlinkSync(manifestPath)
  assert.throws(
    () => verifyBackup(backupPath),
    (error: unknown) => {
      assert.ok(error instanceof StorageError)
      assert.equal(error.code, 'BACKUP_INTEGRITY_FAILED')
      return true
    },
  )
  rmSync(root, { recursive: true, force: true })
  rmSync(backupRoot, { recursive: true, force: true })
})

test('verifyBackup: a backup newer than the packaged maximum refuses like STORAGE_SCHEMA_AHEAD', async () => {
  const root = mkdtempSync(join(tmpdir(), 'fkp9-bahead-'))
  const backupRoot = mkdtempSync(join(tmpdir(), 'fkp9-baheadb-'))
  const set = mkdtempSync(join(tmpdir(), 'fkp9-baheads-'))
  writeFileSync(join(set, '0001-a.sql'), PACKAGED_0001)
  writeFileSync(join(set, '0002-b.sql'), PACKAGED_0002)
  writeFileSync(join(set, '0003-c.sql'), 'CREATE TABLE t_three (x INTEGER NOT NULL)')
  const storage = openStorageWithDriver(configFor(root, backupRoot), undefined, {
    migrationDir: set,
  })
  const manifest = await backupTo(storage, 'future.db')
  assert.equal(manifest.schemaVersion, 3)
  closeStorage(storage)
  // The packaged maximum is 2: this backup refuses exactly like SCHEMA_AHEAD.
  assert.throws(
    () => verifyBackup(join(backupRoot, 'future.db')),
    (error: unknown) => {
      assert.ok(error instanceof StorageError)
      assert.equal(error.code, 'STORAGE_SCHEMA_AHEAD')
      return true
    },
  )
  rmSync(root, { recursive: true, force: true })
  rmSync(backupRoot, { recursive: true, force: true })
  rmSync(set, { recursive: true, force: true })
})

test('pruneBackups: no descriptor deletes nothing (fail-closed, OQ-2)', async () => {
  const root = mkdtempSync(join(tmpdir(), 'fkp9-bprune-'))
  const backupRoot = mkdtempSync(join(tmpdir(), 'fkp9-bpruneb-'))
  seedWithEvents(root, backupRoot)
  // Two backups with distinct creation times so retention order is deterministic.
  const first = openStorage({
    ...configFor(root, backupRoot),
    clock: fixedClock(T0),
  })
  await backupTo(first, 'b1.db')
  closeStorage(first)
  const second = openStorage({
    ...configFor(root, backupRoot),
    clock: fixedClock(T0 + 5000),
  })
  await backupTo(second, 'b2.db')
  closeStorage(second)

  const deletedNone = pruneBackups({ backupRoot, descriptor: null, clock: fixedClock(T0) })
  assert.equal(deletedNone, 0)
  assert.ok(existsSync(join(backupRoot, 'b1.db')))
  assert.ok(existsSync(join(backupRoot, 'b2.db')))

  // With a ratified descriptor, only manifest-carrying pairs beyond the
  // retention bound are deleted (oldest first).
  const deleted = pruneBackups({
    backupRoot,
    descriptor: { maxCount: 1, maxAgeMicros: Number.MAX_SAFE_INTEGER },
    clock: fixedClock(T0 + 1000),
  })
  assert.equal(deleted, 1)
  assert.ok(!existsSync(join(backupRoot, 'b1.db')), 'oldest backup deleted')
  assert.ok(!existsSync(backupManifestPathFor(join(backupRoot, 'b1.db'))))
  assert.ok(existsSync(join(backupRoot, 'b2.db')), 'retained backup kept')

  // A file without a manifest is never deleted.
  writeFileSync(join(backupRoot, 'orphan.db'), 'no manifest')
  pruneBackups({
    backupRoot,
    descriptor: { maxCount: 0, maxAgeMicros: 0 },
    clock: fixedClock(T0 + 2000),
  })
  assert.ok(existsSync(join(backupRoot, 'orphan.db')))
  rmSync(root, { recursive: true, force: true })
  rmSync(backupRoot, { recursive: true, force: true })
})

test('backup manifest digest binds the manifest minus its provenance member', async () => {
  const root = mkdtempSync(join(tmpdir(), 'fkp9-bman-'))
  const backupRoot = mkdtempSync(join(tmpdir(), 'fkp9-bmanb-'))
  seedWithEvents(root, backupRoot)
  const storage = openStorage(configFor(root, backupRoot))
  const manifest: BackupManifest = await backupTo(storage, 'b1.db')
  closeStorage(storage)
  const onDisk = JSON.parse(
    readFileSync(backupManifestPathFor(join(backupRoot, 'b1.db')), 'utf8'),
  ) as BackupManifest
  assert.deepEqual(onDisk, manifest)
  // Tampering the manifest's digest member breaks verification.
  onDisk.backupManifestDigest = `sha256:${'0'.repeat(64)}`
  writeFileSync(backupManifestPathFor(join(backupRoot, 'b1.db')), JSON.stringify(onDisk))
  assert.throws(
    () => verifyBackup(join(backupRoot, 'b1.db')),
    (error: unknown) => {
      assert.ok(error instanceof StorageError)
      assert.equal(error.code, 'BACKUP_INTEGRITY_FAILED')
      return true
    },
  )
  rmSync(root, { recursive: true, force: true })
  rmSync(backupRoot, { recursive: true, force: true })
})
