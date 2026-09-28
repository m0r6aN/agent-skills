/**
 * MIG-02 (AC1): a real child-process kill at an injected fault point
 * mid-migration, then a reopen. The kill is external (SIGKILL from the parent,
 * mapped to TerminateProcess on Windows) while the child sits INSIDE the
 * migration transaction after partial DDL. The reopened database must be at
 * the last committed version with no half-applied schema observable.
 *
 * This is in-suite evidence — never the FK-P15 process-boundary recovery proof
 * (stranded, RS-2.2).
 */
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { fixedClock } from '../src/clock.js'
import { closeStorage, type OpenStorageConfig, openStorageWithDriver } from '../src/open.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const PKG_ROOT = resolve(HERE, '..')
const PACKAGED_0001 = readFileSync(join(PKG_ROOT, 'migrations', '0001-initial.sql'))

const MIGRATION = JSON.parse(
  readFileSync(join(HERE, 'fixtures', 'hostile', 'migration.json'), 'utf8'),
) as {
  records: {
    id: string
    input: { scenario: string; faultAtStatementIndex?: number }
    expectedOutcome?: string
  }[]
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

// The child: enters the migration transaction, executes one statement of
// migration 0002, then parks at the injected fault point (marker + busy wait)
// until the parent's external kill lands mid-transaction.
const CHILD_SOURCE = [
  'import { fixedClock } from "file://' +
    join(PKG_ROOT, 'src', 'clock.js').split('\\').join('/') +
    '"',
  'import { openStorageWithDriver } from "file://' +
    join(PKG_ROOT, 'src', 'open.js').split('\\').join('/') +
    '"',
  'import { writeFileSync } from "node:fs"',
  'const root = process.argv[2]',
  'const set = process.argv[3]',
  'const marker = process.argv[4]',
  'openStorageWithDriver(',
  '  {',
  '    storageRoot: root,',
  '    databaseFileName: "state.db",',
  '    createIfMissing: true,',
  '    clock: fixedClock(1700000000000000),',
  '    backupPolicy: { root, retentionDescriptor: null },',
  '  },',
  '  undefined,',
  '  {',
  '    migrationDir: set,',
  '    beforeStatement: (info) => {',
  '      if (info.version === 2 && info.statementIndex === 1) {',
  '        writeFileSync(marker, "in-transaction")',
  '        for (;;) {}',
  '      }',
  '    },',
  '  },',
  ')',
].join('\n')

function waitForMarker(marker: string, deadlineMs: number): boolean {
  const started = Date.now()
  while (Date.now() - started < deadlineMs) {
    if (existsSync(marker)) return true
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10)
  }
  return false
}

test('MIG-02: real child-process kill mid-migration leaves no half-applied schema', async () => {
  const record = MIGRATIONS_MIG02()
  assert.equal(record.expectedOutcome, 'reopen-at-last-committed-no-half-applied-schema')
  const root = mkdtempSync(join(tmpdir(), 'fkp9-mig2-'))
  const set = mkdtempSync(join(tmpdir(), 'fkp9-mig2s-'))
  const marker = join(root, 'fault-marker')
  writeFileSync(join(set, '0001-a.sql'), PACKAGED_0001)
  writeFileSync(
    join(set, '0002-b.sql'),
    'CREATE TABLE t_two (x INTEGER NOT NULL); CREATE TABLE t_two_more (x INTEGER NOT NULL)',
  )
  writeFileSync(join(root, 'child.mts'), CHILD_SOURCE)

  const child = spawn(
    process.execPath,
    ['--import', 'tsx', join(root, 'child.mts'), root, set, marker],
    {
      cwd: PKG_ROOT,
      stdio: 'ignore',
    },
  )
  const seen = waitForMarker(marker, 30_000)
  assert.ok(seen, 'child never reached the injected fault point')
  // The kill is external and real: SIGKILL from outside the child process
  // (TerminateProcess on Windows) while its migration transaction is open.
  child.kill('SIGKILL')
  const [exit] = await once(child, 'exit')
  assert.notEqual(exit, undefined, 'killed child must terminate')

  // Reopen with a 0001-only set so nothing re-applies: the database is at the
  // last committed version and nothing from 0002 is observable.
  const setOnlyOne = mkdtempSync(join(tmpdir(), 'fkp9-mig2o-'))
  writeFileSync(join(setOnlyOne, '0001-a.sql'), PACKAGED_0001)
  const inspect = openStorageWithDriver(configFor(root), undefined, {
    migrationDir: setOnlyOne,
  })
  const versions = inspect.driver.prepare('SELECT version FROM schema_migrations').all() as {
    version: number
  }[]
  assert.deepEqual(
    versions.map((row) => row.version),
    [1],
    'the interrupted migration must leave the ledger at the last committed version',
  )
  const objects = inspect.driver
    .prepare("SELECT name FROM sqlite_master WHERE name IN ('t_two', 't_two_more')")
    .all()
  assert.equal(objects.length, 0, 'no half-applied schema may be observable')
  closeStorage(inspect)

  // And a clean rerun completes (recovery-positive), landing at head.
  const rerun = openStorageWithDriver(configFor(root), undefined, { migrationDir: set })
  const after = rerun.driver
    .prepare('SELECT version FROM schema_migrations ORDER BY version')
    .all() as {
    version: number
  }[]
  assert.deepEqual(
    after.map((row) => row.version),
    [1, 2],
  )
  closeStorage(rerun)

  rmSync(root, { recursive: true, force: true })
  rmSync(set, { recursive: true, force: true })
  rmSync(setOnlyOne, { recursive: true, force: true })
})

function MIGRATIONS_MIG02(): (typeof MIGRATION.records)[number] {
  const found = MIGRATION.records.find((candidate) => candidate.id === 'MIG-02')
  assert.ok(found, 'MIG-02 missing from migration.json')
  return found
}
