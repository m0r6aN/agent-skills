/**
 * Child-process worker for FK-P11's F8 real-kill interruption suite. Test-side
 * only — never shipped engine code.
 *
 * Run as `npx tsx tests/helpers/child-worker.ts <jobJsonPath>` (argv array
 * spawn, NEVER a shell). The job runs a REAL `runImport` against a REAL FK-P9
 * storage at `job.dbPath` (openStorage/createIfMissing) with a `FakeLineage`
 * built from `job.lineageSeed`, then parks at the job's ASSERTED-REACHED kill
 * point: `REACHED:<point>` is written to stdout (synchronous fd write, so it is
 * flushed before the worker blocks) and the worker blocks forever, giving the
 * parent a hard-kill window at the named moment. A worker that completes its
 * run without firing the configured kill point writes `KILL-MISSED` to stderr
 * and exits 3 — never a silent success; a harness fault writes its raw cause to
 * stderr and exits 2.
 *
 * Kill points (mirroring the INT fixture ids):
 * - `mid-row-insert`: after the first `insertGoal` INSERT executes (mid-row,
 *   inside the import transaction), before commit.
 * - `after-epoch-event`: after the `import.epoch` event INSERT executes, before
 *   commit.
 * - `post-commit`: after `withTransaction` returns (the commit is durable),
 *   before the worker exits — `REACHED:post-commit` plus a `DONE` line, then
 *   block so the parent's hard kill lands post-commit/pre-exit.
 * - `mid-publish`: inside `publishProjection`'s cursor transaction — after the
 *   render, before the cursor write (armed only once the import has returned).
 *
 * The seam is the storage handle's `driver`: every row primitive writes through
 * `driver.prepare(sql).run(...)`, so a wrapped driver sees each INSERT at the
 * exact statement boundary. The import runs over a `{ ...storage, driver }`
 * shadow handle, so transaction flags stay self-contained.
 */
import { readFileSync, writeSync } from 'node:fs'
import { fixedClock, openStorage, type Storage } from '@foreman-line/kernel-state'
import { createImporter, createProjector, publishProjection, runImport } from '../../src/index.js'
import { FakeLineage } from './fake-lineage.js'

const T0 = 1_700_000_000_000_000
const PUBLISH_PROJECTION_ID = 'md-goals-index'

type DriverHandle = Storage['driver']

interface LineageSeed {
  commits?: { id: string; parents: string[] }[]
  blobs?: { commitId: string; sourcePath: string; text: string }[]
}

interface WorkerJob {
  dbPath: string
  document: unknown
  principalRef: string
  operationId: string
  lineageSeed: LineageSeed
  killPoint: string
}

/** Block forever (the parent hard-kills at the asserted point). */
function blockForever(): never {
  const parking = new Int32Array(new SharedArrayBuffer(4))
  for (;;) {
    Atomics.wait(parking, 0, 0, 1000)
  }
}

/** Asserted-reached signal: flushed stdout line, then park. */
function reach(point: string): never {
  writeSync(1, `REACHED:${point}\n`)
  blockForever()
}

function harnessFault(stage: string, cause: unknown): never {
  const raw = cause instanceof Error ? `${cause.message}\n${cause.stack ?? ''}` : String(cause)
  writeSync(2, `HARNESS_FAULT ${stage} ${raw}\n`)
  process.exit(2)
}

let publishKillArmed = false

function armPublishKill(): void {
  publishKillArmed = true
}

/**
 * Wrap the driver seam so one INSERT boundary parks the worker per kill point.
 * `mid-publish` fires BEFORE the cursor write executes (the cursor transaction
 * is open, the render is done); the import-transaction points fire AFTER their
 * statement executes (mid-row / post-epoch-event, still pre-commit).
 */
function installKillHook(driver: DriverHandle, killPoint: string): DriverHandle {
  let goalInserts = 0
  return {
    exec: (sql: string) => {
      driver.exec(sql)
    },
    prepare: (sql: string) => {
      const statement = driver.prepare(sql)
      return {
        run: (...params: unknown[]) => {
          const text = sql.trimStart()
          const isInsert = text.startsWith('INSERT')
          if (
            killPoint === 'mid-publish' &&
            publishKillArmed &&
            isInsert &&
            text.includes('INSERT INTO projection_cursors')
          ) {
            reach('mid-publish')
          }
          const result = statement.run(...params)
          if (killPoint === 'mid-row-insert' && isInsert && text.includes('INSERT INTO goals')) {
            goalInserts += 1
            if (goalInserts === 1) reach('mid-row-insert')
          }
          if (killPoint === 'after-epoch-event' && text.includes('INSERT INTO events')) {
            const eventId = params[0]
            if (typeof eventId === 'string' && eventId.startsWith('impepoch-')) {
              reach('after-epoch-event')
            }
          }
          return result
        },
        get: (...params: unknown[]) => statement.get(...params),
        all: (...params: unknown[]) => statement.all(...params),
      }
    },
    pragma: (source: string) => driver.pragma(source),
  }
}

function isKillPoint(value: string): boolean {
  return (
    value === 'mid-row-insert' ||
    value === 'after-epoch-event' ||
    value === 'post-commit' ||
    value === 'mid-publish'
  )
}

function main(): void {
  const jobPath = process.argv[2]
  if (jobPath === undefined) harnessFault('argv', new Error('missing job JSON path'))
  const job = JSON.parse(readFileSync(jobPath, 'utf8')) as WorkerJob
  if (!isKillPoint(job.killPoint))
    harnessFault('argv', new Error(`unknown killPoint ${job.killPoint}`))
  try {
    const storage = openStorage({
      storageRoot: job.dbPath,
      databaseFileName: 'state.db',
      createIfMissing: true,
      clock: fixedClock(T0),
      backupPolicy: { root: job.dbPath, retentionDescriptor: null },
    })
    const lineage = new FakeLineage(job.lineageSeed)
    const importer = createImporter({
      storage: { ...storage, driver: installKillHook(storage.driver, job.killPoint) },
      clock: fixedClock(T0),
      toolVersion: 'kernel-import-child-worker-0.1.0',
      lineageReader: lineage,
    })
    runImport(importer, {
      importDocument: job.document,
      principalRef: job.principalRef,
      operationId: job.operationId,
    })
    if (job.killPoint === 'post-commit') {
      // The commit is durable (withTransaction returned); park pre-exit so the
      // parent's hard kill lands at the asserted post-commit moment.
      writeSync(1, 'REACHED:post-commit\nDONE\n')
      blockForever()
    }
    if (job.killPoint === 'mid-publish') {
      armPublishKill()
      const projector = createProjector({ storage: importer.storage, lineageReader: lineage })
      publishProjection(projector, { projectionId: PUBLISH_PROJECTION_ID })
    }
    // The configured kill point never fired (it parks INSIDE the run): a
    // completed import/publish here is a misconfigured scenario, never a pass.
    writeSync(2, `KILL-MISSED ${job.killPoint}\n`)
    process.exit(3)
  } catch (error) {
    harnessFault('main', error)
  }
}

main()
