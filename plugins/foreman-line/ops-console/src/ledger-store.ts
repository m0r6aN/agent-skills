import {
  appendFileSync,
  closeSync,
  mkdirSync,
  openSync,
  readdirSync,
  readSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { join, resolve } from 'node:path'
import { ledgerDirPath, STATE_DIRS } from './config.js'

/**
 * FCA-P7 ledger store — the ONLY module that writes under `state/sessions/`.
 * It creates a per-pane directory and enforces the pane-log retention cap.
 * Everything it records is a fact about the console's own captured output;
 * it never touches specs, receipts, goal records, or any worktree.
 */

export const LOG_NAME = 'pane.log'
export const TRUNCATED_NAME = 'pane.log.truncated'

export interface RetentionPolicy {
  /** Max bytes kept per pane log (OQ2 default: 5 MB). */
  readonly maxBytesPerPane: number
  /** Max pane directories kept (OQ2 default: 200); oldest logs are dropped first. */
  readonly maxPanes: number
}

export const DEFAULT_RETENTION: RetentionPolicy = {
  maxBytesPerPane: 5 * 1024 * 1024,
  maxPanes: 200,
}

export interface LedgerPaths {
  readonly dir: string
  readonly logPath: string
}

/** Create `state/sessions/<id>/` and return its fixed log path. */
export function ensureLedgerDir(stateDir: string, receiptId: string): LedgerPaths {
  const dir = ledgerDirPath(stateDir, receiptId)
  mkdirSync(dir, { recursive: true })
  const logPath = join(dir, LOG_NAME)
  // Create the log up front so pipe-pane's append always has a target and an
  // empty-but-present log is distinguishable from "capture never attached".
  appendFileSync(logPath, '')
  return { dir, logPath }
}

function readTail(path: string, bytes: number, size: number): Buffer {
  const length = Math.min(bytes, size)
  const buffer = Buffer.alloc(length)
  const fd = openSync(path, 'r')
  try {
    readSync(fd, buffer, 0, length, size - length)
  } finally {
    closeSync(fd)
  }
  return buffer
}

export interface RetentionReport {
  readonly truncated: readonly string[]
  readonly dropped: readonly string[]
}

/**
 * Enforce the retention cap. A log over the byte cap keeps its newest bytes
 * and leaves a marker recording how much was dropped; panes beyond the count
 * cap lose their log (oldest directory first) but keep a marker, so an old
 * receipt reads "log removed by retention", never "capture failed".
 */
export function enforceRetention(
  stateDir: string,
  policy: RetentionPolicy = DEFAULT_RETENTION,
  now: number = Date.now(),
): RetentionReport {
  const root = resolve(stateDir, STATE_DIRS[0])
  let names: string[]
  try {
    names = readdirSync(root)
  } catch {
    return { truncated: [], dropped: [] }
  }
  const panes = names
    .map((name) => {
      try {
        const dir = join(root, name)
        const stat = statSync(dir)
        return stat.isDirectory() ? { name, dir, mtime: stat.mtimeMs } : null
      } catch {
        return null
      }
    })
    .filter((entry): entry is { name: string; dir: string; mtime: number } => entry !== null)
    .sort((a, b) => b.mtime - a.mtime)

  const truncated: string[] = []
  const dropped: string[] = []
  panes.forEach((pane, rank) => {
    const log = join(pane.dir, LOG_NAME)
    let size: number
    try {
      size = statSync(log).size
    } catch {
      return
    }
    if (rank >= policy.maxPanes) {
      rmSync(log, { force: true })
      writeFileSync(
        join(pane.dir, TRUNCATED_NAME),
        `${JSON.stringify({ at: new Date(now).toISOString(), reason: 'pane-count-cap', droppedBytes: size })}\n`,
      )
      dropped.push(pane.name)
      return
    }
    if (size > policy.maxBytesPerPane) {
      const keep = readTail(log, policy.maxBytesPerPane, size)
      writeFileSync(log, keep)
      writeFileSync(
        join(pane.dir, TRUNCATED_NAME),
        `${JSON.stringify({ at: new Date(now).toISOString(), reason: 'byte-cap', droppedBytes: size - keep.length })}\n`,
      )
      truncated.push(pane.name)
    }
  })
  return { truncated, dropped }
}
