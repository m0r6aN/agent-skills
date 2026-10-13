import { closeSync, openSync, readdirSync, readFileSync, readSync, statSync } from 'node:fs'
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
  readonly messages: number | null
  readonly costUsd: number | null
  readonly lastStopReason: string | null
  readonly lastErrorMessage: string | null
  readonly firstAt: string | null
  readonly lastAt: string | null
}

const MAX_TRANSCRIPT_BYTES = 20 * 1024 * 1024

export function defaultPiSessionsDir(env: NodeJS.ProcessEnv = process.env): string {
  return env.FOC_PI_SESSIONS_DIR ?? join(homedir(), '.pi', 'agent', 'sessions')
}

/** pi's directory naming: `--` + cwd with separators turned into `-` + `--`. */
export function piSessionDirName(cwd: string): string {
  return `--${cwd.replace(/^[/\\]/, '').replace(/[/\\:]/g, '-')}--`
}

const UNKNOWN: TranscriptFact = {
  link: 'unknown',
  dir: null,
  files: [],
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
    const buffer = Buffer.alloc(4096)
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

function summarize(path: string): Omit<TranscriptFact, 'link' | 'dir' | 'files'> | null {
  try {
    if (statSync(path).size > MAX_TRANSCRIPT_BYTES) return null
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

export function readPiTranscript(sessionsRoot: string, worktreePath: string): TranscriptFact {
  const dir = join(sessionsRoot, piSessionDirName(worktreePath))
  let names: string[]
  try {
    names = readdirSync(dir).filter((name) => name.endsWith('.jsonl'))
  } catch (error) {
    // No directory at all: pi never started in this worktree (or the sessions
    // root itself is unreadable, which is unknown rather than "none").
    return (error as NodeJS.ErrnoException).code === 'ENOENT'
      ? { ...UNKNOWN, link: 'none', dir }
      : UNKNOWN
  }
  const files = names.sort().map((name) => join(dir, name))
  // Header cwd must agree with the worktree; a mismatch is not our file.
  const mine = files.filter((file) => headerCwd(file) === worktreePath)
  if (mine.length === 0) {
    return { ...UNKNOWN, link: 'none', dir, files: [] }
  }
  if (mine.length > 1) {
    return { ...UNKNOWN, link: 'ambiguous', dir, files: mine }
  }
  const summary = summarize(mine[0] as string)
  if (summary === null) return { ...UNKNOWN, link: 'unknown', dir, files: mine }
  return { link: 'linked', dir, files: mine, ...summary }
}
