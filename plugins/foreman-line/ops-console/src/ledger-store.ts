import {
  appendFileSync,
  chmodSync,
  closeSync,
  lstatSync,
  mkdirSync,
  openSync,
  readdirSync,
  readSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { join, resolve } from 'node:path'
import { ledgerDirPath, RECEIPT_ID, STATE_DIRS } from './config.js'

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
  /**
   * A log written within this window may belong to a LIVE pane (tmux's `cat >>`
   * still appends to it). It is never truncated or removed: doing so would lose
   * bytes or silently orphan the writer. The cap is enforced once the pane has
   * been quiet for this long, at the next launch.
   */
  readonly quietMs: number
  /**
   * Receipt ids whose pane may still be writing. They are never truncated or removed,
   * whatever their age: liveness, not a guessed quiet period, decides. `'all'` protects
   * everything (used when liveness could not be established).
   */
  readonly protect?: ReadonlySet<string> | 'all'
  /** Receipt ids newest-first (from launch times). Ids not listed rank oldest; absent = by id. */
  readonly order?: readonly string[]
}

export const DEFAULT_RETENTION: RetentionPolicy = {
  maxBytesPerPane: 5 * 1024 * 1024,
  maxPanes: 200,
  quietMs: 0,
}

export interface LedgerPaths {
  readonly dir: string
  readonly logPath: string
}

/** Create `state/sessions/<id>/` and return its fixed log path. */
export function ensureLedgerDir(stateDir: string, receiptId: string): LedgerPaths {
  const dir = ledgerDirPath(stateDir, receiptId)
  // Pane output can echo prompts and provider errors: owner-only, not world-readable.
  mkdirSync(dir, { recursive: true, mode: 0o700 })
  chmodSync(dir, 0o700)
  const logPath = join(dir, LOG_NAME)
  // Create the log up front so pipe-pane's append always has a target and an
  // empty-but-present log is distinguishable from "capture never attached".
  appendFileSync(logPath, '', { mode: 0o600 })
  chmodSync(logPath, 0o600)
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
  // Only well-formed receipt ids that are REAL directories (lstat: a symlinked entry could
  // point outside the tree) are ever touched. Ranked newest first by launch time when the
  // caller supplies it (custom session names and p10-vs-p2 defeat lexical order), else by id.
  const rankOf = new Map((policy.order ?? []).map((id, index) => [id, index]))
  const panes = names
    .filter((name) => RECEIPT_ID.test(name))
    .sort((a, b) => {
      const [x, y] = [
        rankOf.get(a) ?? Number.MAX_SAFE_INTEGER,
        rankOf.get(b) ?? Number.MAX_SAFE_INTEGER,
      ]
      return x !== y ? x - y : a < b ? 1 : a > b ? -1 : 0
    })
    .map((name) => {
      try {
        const dir = join(root, name)
        return lstatSync(dir).isDirectory() ? { name, dir } : null
      } catch {
        return null
      }
    })
    .filter((entry): entry is { name: string; dir: string } => entry !== null)

  const truncated: string[] = []
  const dropped: string[] = []
  panes.forEach((pane, rank) => {
    if (policy.protect === 'all' || policy.protect?.has(pane.name)) return
    const log = join(pane.dir, LOG_NAME)
    let size: number
    let mtimeMs: number
    try {
      const stat = lstatSync(log)
      if (!stat.isFile()) return
      size = stat.size
      mtimeMs = stat.mtimeMs
    } catch {
      return
    }
    if (policy.quietMs > 0 && now - mtimeMs < policy.quietMs) return
    if (rank >= policy.maxPanes) {
      rmSync(log, { force: true })
      writeFileSync(
        join(pane.dir, TRUNCATED_NAME),
        `${JSON.stringify({ at: new Date(now).toISOString(), reason: 'pane-count-cap', droppedBytes: size })}\n`,
        { mode: 0o600 },
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
        { mode: 0o600 },
      )
      truncated.push(pane.name)
    }
  })
  return { truncated, dropped }
}

/**
 * Remove a ledger directory that never received output (a launch that failed before its
 * pane started). Refuses anything that is not an id-validated directory containing at most
 * an empty log: it never deletes captured output.
 */
export function discardEmptyLedgerDir(stateDir: string, receiptId: string): boolean {
  try {
    const dir = ledgerDirPath(stateDir, receiptId)
    if (!lstatSync(dir).isDirectory()) return false
    const entries = readdirSync(dir)
    if (entries.some((name) => name !== LOG_NAME)) return false
    if (entries.includes(LOG_NAME) && lstatSync(join(dir, LOG_NAME)).size > 0) return false
    rmSync(dir, { recursive: true, force: true })
    return true
  } catch {
    return false
  }
}
