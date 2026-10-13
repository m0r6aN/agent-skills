import { execFileSync } from 'node:child_process'
import { statSync } from 'node:fs'

/**
 * FCA-P7 git outcome reader (read-only: rev-parse, status, rev-list,
 * merge-base --is-ancestor). Every probe is anchored to the worktree path
 * (A2.9) and degrades to unknown (null), never to a guessed value. Remote
 * facts are against the LAST-FETCHED refs; nothing here fetches.
 */

export interface GitFact {
  readonly worktree: 'present' | 'missing' | 'unknown'
  readonly branch: string | null
  readonly commitsAhead: number | null
  readonly dirtyFiles: number | null
  /** HEAD is contained in the last-fetched `origin/<branch>`; null if unknowable. */
  readonly pushed: boolean | null
}

export type GitRunner = (cwd: string, args: readonly string[]) => string | null

/**
 * The console runs git inside repositories and worktrees that agents write to.
 * Probes are therefore hardened: `GIT_OPTIONAL_LOCKS=0` so `git status` never
 * takes `index.lock` or rewrites the index under a working agent;
 * `core.fsmonitor=false` so a repository-local fsmonitor hook is never executed
 * by the console; a timeout so a hung git cannot stall the server forever; a
 * large `maxBuffer` so big ref/log listings are not silently truncated into
 * "nothing exists". Any failure is `null` (unknown), never an empty result.
 */
export const GIT_TIMEOUT_MS = 10_000
export const GIT_MAX_BUFFER = 64 * 1024 * 1024
export const defaultGitRunner: GitRunner = (cwd, args) => {
  try {
    return execFileSync('git', ['-C', cwd, '-c', 'core.fsmonitor=false', ...args], {
      cwd,
      encoding: 'utf8',
      timeout: GIT_TIMEOUT_MS,
      maxBuffer: GIT_MAX_BUFFER,
      env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' },
      stdio: ['ignore', 'pipe', 'ignore'],
    }).replace(/\s+$/, '')
  } catch {
    return null
  }
}

/**
 * A revision usable as `<rev>..HEAD`: a hex sha or a plain ref name. Anything
 * that could be read as an option (leading `-`) or contains unexpected
 * characters is rejected - receipts live in a file the console does not own.
 */
export function safeRev(value: string | null): string | null {
  return value !== null &&
    /^[A-Za-z0-9][A-Za-z0-9._/-]{0,200}$/.test(value) &&
    !value.includes('..')
    ? value
    : null
}

export interface GitCache {
  outcome(worktreePath: string, baseCommit: string | null): GitFact
}

/** Short-TTL memo so repeated refreshes do not re-spawn git per receipt. */
export function makeGitCache(
  ttlMs: number,
  now: () => number = Date.now,
  run: GitRunner = defaultGitRunner,
): GitCache {
  const memo = new Map<string, { at: number; fact: GitFact }>()
  return {
    outcome: (worktreePath, baseCommit) => {
      const key = `${worktreePath}\u0000${baseCommit ?? ''}`
      const hit = memo.get(key)
      const t = now()
      if (ttlMs > 0 && hit !== undefined && t - hit.at < ttlMs) return hit.fact
      const fact = readGitOutcome(worktreePath, baseCommit, run)
      if (ttlMs > 0) memo.set(key, { at: t, fact })
      return fact
    },
  }
}

function exitsZero(run: GitRunner, cwd: string, args: readonly string[]): boolean {
  return run(cwd, args) !== null
}

export function readGitOutcome(
  worktreePath: string,
  baseCommit: string | null,
  run: GitRunner = defaultGitRunner,
): GitFact {
  try {
    if (!statSync(worktreePath).isDirectory()) {
      return {
        worktree: 'missing',
        branch: null,
        commitsAhead: null,
        dirtyFiles: null,
        pushed: null,
      }
    }
  } catch (error) {
    const missing = (error as NodeJS.ErrnoException).code === 'ENOENT'
    return {
      worktree: missing ? 'missing' : 'unknown',
      branch: null,
      commitsAhead: null,
      dirtyFiles: null,
      pushed: null,
    }
  }
  const head = run(worktreePath, ['rev-parse', 'HEAD'])
  if (head === null) {
    return { worktree: 'unknown', branch: null, commitsAhead: null, dirtyFiles: null, pushed: null }
  }
  const branchRaw = run(worktreePath, ['rev-parse', '--abbrev-ref', 'HEAD'])
  const branch = branchRaw === null || branchRaw === 'HEAD' ? null : branchRaw
  const status = run(worktreePath, ['status', '--porcelain'])
  const dirtyFiles = status === null ? null : status === '' ? 0 : status.split('\n').length
  let commitsAhead: number | null = null
  const base = safeRev(baseCommit)
  if (base !== null) {
    const count = run(worktreePath, ['rev-list', '--count', `${base}..HEAD`])
    commitsAhead = count !== null && /^\d+$/.test(count) ? Number(count) : null
  }
  let pushed: boolean | null = null
  if (branch !== null) {
    const remoteRef = `refs/remotes/origin/${branch}`
    pushed = exitsZero(run, worktreePath, ['rev-parse', '--verify', '-q', remoteRef])
      ? exitsZero(run, worktreePath, ['merge-base', '--is-ancestor', 'HEAD', remoteRef])
      : false
  }
  return { worktree: 'present', branch, commitsAhead, dirtyFiles, pushed }
}
