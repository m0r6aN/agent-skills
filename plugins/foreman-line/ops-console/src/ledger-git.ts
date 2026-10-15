import { execFileSync } from 'node:child_process'
import { statSync } from 'node:fs'
import { stat } from 'node:fs/promises'
import { gitRunnerAsync } from './spawn-async.js'

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

/** FCA-P14: Async version of GitRunner for non-blocking git probes. */
export type AsyncGitRunner = (cwd: string, args: readonly string[]) => Promise<string | null>

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

/** FCA-P14: Default async git runner using non-blocking spawn. */
export const defaultAsyncGitRunner: AsyncGitRunner = (cwd, args) =>
  gitRunnerAsync(cwd, args, GIT_TIMEOUT_MS, GIT_MAX_BUFFER, { GIT_OPTIONAL_LOCKS: '0' })

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

/** FCA-P14: Async version of GitCache. */
export interface AsyncGitCache {
  outcome(worktreePath: string, baseCommit: string | null): Promise<GitFact>
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

/** FCA-P14: Async git cache using non-blocking spawn. */
export function makeAsyncGitCache(
  ttlMs: number,
  now: () => number = Date.now,
  run: AsyncGitRunner = defaultAsyncGitRunner,
): AsyncGitCache {
  const memo = new Map<string, { at: number; fact: GitFact }>()
  return {
    outcome: async (worktreePath, baseCommit) => {
      const key = `${worktreePath}\u0000${baseCommit ?? ''}`
      const hit = memo.get(key)
      const t = now()
      if (ttlMs > 0 && hit !== undefined && t - hit.at < ttlMs) return hit.fact
      const fact = await readGitOutcomeAsync(worktreePath, baseCommit, run)
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

/** FCA-P14: Async version of readGitOutcome. */
export async function readGitOutcomeAsync(
  worktreePath: string,
  baseCommit: string | null,
  run: AsyncGitRunner = defaultAsyncGitRunner,
): Promise<GitFact> {
  try {
    const stats = await stat(worktreePath)
    if (!stats.isDirectory()) {
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

  const head = await run(worktreePath, ['rev-parse', 'HEAD'])
  if (head === null) {
    return { worktree: 'unknown', branch: null, commitsAhead: null, dirtyFiles: null, pushed: null }
  }

  // Run all independent git calls concurrently
  const [branchRaw, status, countResult, remoteRefResult] = await Promise.all([
    run(worktreePath, ['rev-parse', '--abbrev-ref', 'HEAD']),
    run(worktreePath, ['status', '--porcelain']),
    safeRev(baseCommit) !== null
      ? run(worktreePath, ['rev-list', '--count', `${safeRev(baseCommit)}..HEAD`])
      : Promise.resolve(null),
    (async (): Promise<{ branch: string | null; pushed: boolean | null }> => {
      const br = await run(worktreePath, ['rev-parse', '--abbrev-ref', 'HEAD'])
      const branch = br === null || br === 'HEAD' ? null : br
      if (branch === null) return { branch: null, pushed: null }
      const remoteRef = `refs/remotes/origin/${branch}`
      const exists = await run(worktreePath, ['rev-parse', '--verify', '-q', remoteRef])
      if (exists === null) return { branch, pushed: false }
      const isAncestor = await run(worktreePath, ['merge-base', '--is-ancestor', 'HEAD', remoteRef])
      return { branch, pushed: isAncestor !== null }
    })(),
  ])

  const branch = branchRaw === null || branchRaw === 'HEAD' ? null : branchRaw
  const dirtyFiles = status === null ? null : status === '' ? 0 : status.split('\n').length
  const commitsAhead =
    countResult !== null && /^\d+$/.test(countResult) ? Number(countResult) : null

  return {
    worktree: 'present',
    branch: remoteRefResult.branch ?? branch,
    commitsAhead,
    dirtyFiles,
    pushed: remoteRefResult.pushed,
  }
}
