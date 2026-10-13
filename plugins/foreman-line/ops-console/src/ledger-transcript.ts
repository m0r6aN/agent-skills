import {
  closeSync,
  openSync,
  readdirSync,
  readFileSync,
  readSync,
  realpathSync,
  statSync,
} from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { isRecord } from './guards.js'

/**
 * FCA-P7 transcript reader (read-only). pi keys its session directory by the
 * working directory and stamps the same `cwd` in each file's header, so a
 * launch's unique worktree gives a deterministic join: exactly one file whose
 * header cwd equals the worktree links; none is `none` (prompt never
 * exchanged); several is `ambiguous` (listed, never guessed). Message bodies
 * are never copied out - only counts, usage, and stop reasons (FCA-P5: prompt
 * text is not stored).
 */

export type TranscriptLink = 'linked' | 'none' | 'ambiguous' | 'unknown'

export interface TranscriptFact {
  readonly link: TranscriptLink
  readonly dir: string | null
  readonly files: readonly string[]
  /** Candidate files in the directory whose header cwd named a different directory. */
  readonly rejected: number
  readonly messages: number | null
  readonly costUsd: number | null
  readonly lastStopReason: string | null
  readonly lastErrorMessage: string | null
  readonly firstAt: string | null
  readonly lastAt: string | null
}

export const MAX_TRANSCRIPT_BYTES = 20 * 1024 * 1024
const HEADER_BYTES = 16 * 1024

export function defaultPiSessionsDir(env: NodeJS.ProcessEnv = process.env): string {
  return env.FOC_PI_SESSIONS_DIR ?? join(homedir(), '.pi', 'agent', 'sessions')
}

/** pi's directory naming: `--` + cwd with separators turned into `-` + `--`. */
export function piSessionDirName(cwd: string): string {
  return `--${cwd.replace(/^[/\\]/, '').replace(/[/\\:]/g, '-')}--`
}

export const UNKNOWN_TRANSCRIPT: TranscriptFact = {
  link: 'unknown',
  dir: null,
  files: [],
  rejected: 0,
  messages: null,
  costUsd: null,
  lastStopReason: null,
  lastErrorMessage: null,
  firstAt: null,
  lastAt: null,
}

function headerCwd(path: string): string | null {
  // The header is the first line; read a bounded prefix, not the whole file.
  const fd = openSync(path, 'r')
  try {
    const buffer = Buffer.alloc(HEADER_BYTES)
    const read = readSync(fd, buffer, 0, buffer.length, 0)
    const first = buffer.subarray(0, read).toString('utf8').split('\n', 1)[0] ?? ''
    const parsed: unknown = JSON.parse(first)
    return isRecord(parsed) && typeof parsed.cwd === 'string' ? parsed.cwd : null
  } catch {
    return null
  } finally {
    closeSync(fd)
  }
}

type Summary = Omit<TranscriptFact, 'link' | 'dir' | 'files' | 'rejected'>
// Summaries are keyed by (path, size, mtime): an unchanged transcript is never
// re-read or re-parsed, so a 60 s UI refresh costs a stat per receipt, not a
// multi-megabyte JSON parse. Bounded so it cannot grow without limit.
const summaryCache = new Map<string, Summary | null>()
const SUMMARY_CACHE_MAX = 500

function summarize(path: string): Summary | null {
  try {
    const stat = statSync(path)
    if (stat.size > MAX_TRANSCRIPT_BYTES) return null
    const cacheKey = `${path}\u0000${stat.size}\u0000${stat.mtimeMs}`
    if (summaryCache.has(cacheKey)) return summaryCache.get(cacheKey) ?? null
    const fresh = summarizeUncached(path)
    if (summaryCache.size >= SUMMARY_CACHE_MAX) summaryCache.clear()
    summaryCache.set(cacheKey, fresh)
    return fresh
  } catch {
    return null
  }
}

function summarizeUncached(path: string): Summary | null {
  try {
    let messages = 0
    let cost = 0
    let sawCost = false
    let stop: string | null = null
    let error: string | null = null
    let firstAt: string | null = null
    let lastAt: string | null = null
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      if (line === '') continue
      let entry: unknown
      try {
        entry = JSON.parse(line)
      } catch {
        continue
      }
      if (!isRecord(entry) || !isRecord(entry.message)) continue
      const message = entry.message
      if (typeof message.role !== 'string') continue
      messages++
      const at = typeof entry.timestamp === 'string' ? entry.timestamp : null
      if (at !== null) {
        firstAt = firstAt ?? at
        lastAt = at
      }
      if (message.role === 'assistant') {
        stop = typeof message.stopReason === 'string' ? message.stopReason : stop
        error = typeof message.errorMessage === 'string' ? message.errorMessage : error
        const usage = message.usage
        if (isRecord(usage) && isRecord(usage.cost) && typeof usage.cost.total === 'number') {
          cost += usage.cost.total
          sawCost = true
        }
      }
    }
    return {
      messages,
      costUsd: sawCost ? cost : null,
      lastStopReason: stop,
      lastErrorMessage: error,
      firstAt,
      lastAt,
    }
  } catch {
    return null
  }
}

function realOrSelf(path: string): string {
  try {
    return realpathSync(path)
  } catch {
    return path
  }
}

/** pi stamps the REAL cwd; a receipt may hold a symlinked path. Equal if either form matches. */
function sameDirectory(headerCwd: string | null, worktreePath: string): boolean {
  if (headerCwd === null) return false
  return headerCwd === worktreePath || realOrSelf(headerCwd) === realOrSelf(worktreePath)
}

export function readPiTranscript(sessionsRoot: string, worktreePath: string): TranscriptFact {
  // pi derives its directory name from the real cwd; try both spellings.
  const names = [
    ...new Set([piSessionDirName(worktreePath), piSessionDirName(realOrSelf(worktreePath))]),
  ]
  let dir = join(sessionsRoot, names[0] as string)
  let entries: string[] | null = null
  let sawOther = false
  for (const name of names) {
    const candidate = join(sessionsRoot, name)
    try {
      entries = readdirSync(candidate).filter((entry) => entry.endsWith('.jsonl'))
      dir = candidate
      break
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') sawOther = true
    }
  }
  if (entries === null) {
    // No directory at all: pi never started here (an unreadable sessions root is unknown, not "none").
    return sawOther ? UNKNOWN_TRANSCRIPT : { ...UNKNOWN_TRANSCRIPT, link: 'none', dir }
  }
  const files = entries.sort().map((entry) => join(dir, entry))
  // The header cwd must agree with the worktree; a mismatch is not our file.
  const mine = files.filter((file) => sameDirectory(headerCwd(file), worktreePath))
  const rejected = files.length - mine.length
  if (mine.length === 0) return { ...UNKNOWN_TRANSCRIPT, link: 'none', dir, rejected }
  if (mine.length > 1)
    return { ...UNKNOWN_TRANSCRIPT, link: 'ambiguous', dir, files: mine, rejected }
  const summary = summarize(mine[0] as string)
  if (summary === null)
    return { ...UNKNOWN_TRANSCRIPT, link: 'unknown', dir, files: mine, rejected }
  return { link: 'linked', dir, files: mine, rejected, ...summary }
}
