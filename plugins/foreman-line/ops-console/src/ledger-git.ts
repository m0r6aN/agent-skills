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

export const defaultGitRunner: GitRunner = (cwd, args) => {
  try {
    return execFileSync('git', ['-C', cwd, ...args], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).replace(/\s+$/, '')
  } catch {
    return null
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
  if (baseCommit !== null) {
    const count = run(worktreePath, ['rev-list', '--count', `${baseCommit}..HEAD`])
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
