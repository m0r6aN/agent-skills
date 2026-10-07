import { type Dirent, readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { assertAbsoluteRoot } from './config.js'
import type { LivenessSignal } from './types.js'

/**
 * FOC-P0 D-LOAD worktree liveness composite (disk truth only — no process or
 * session registry exists on disk):
 *
 *   liveness = a git worktree (listed in `<gitdir>/worktrees/<name>/gitdir`)
 *   whose worktree directory basename contains the parcel key or goal slug
 *   (case-insensitive), whose recorded branch ref
 *   (`<gitdir>/worktrees/<name>/HEAD`) exists, and whose newest content mtime
 *   (recursive, skipping `.git`, `node_modules`, `dist`, `state`) is within
 *   the heartbeat threshold of the evaluation time.
 *
 * Failure mode is safe by construction: an unmatched or absent worktree means
 * "no liveness", which only ever moves a parcel toward `hung`, and `hung` is
 * outranked by `failed`, `complete`, and `awaiting-gate` in the derivation
 * precedence.
 */
const SKIP_DIRS = new Set(['.git', 'node_modules', 'dist', 'state'])

function gitDirOf(repoRoot: string): string | null {
  // D1 guard first (P2b-i / D19 class 5): the repo root is caller-supplied and
  // must be absolute — never silently re-anchored to the process cwd.
  assertAbsoluteRoot(repoRoot, 'gitDirOf repoRoot')
  const dotGit = resolve(repoRoot, '.git')
  try {
    const st = statSync(dotGit)
    if (st.isDirectory()) return dotGit
    const match = /^gitdir:\s*(.+)$/m.exec(readFileSync(dotGit, 'utf8'))
    return match === null ? null : resolve(dirname(dotGit), (match[1] ?? '').trim())
  } catch {
    return null
  }
}

function newestMtimeMs(root: string): number | null {
  let newest: number | null = null
  const stack: string[] = [root]
  while (stack.length > 0) {
    const dir = stack.pop() ?? ''
    let entries: Dirent[]
    try {
      entries = readdirSync(dir, { withFileTypes: true })
    } catch {
      continue
    }
    for (const entry of entries) {
      if (entry.isSymbolicLink()) continue
      const path = join(dir, entry.name)
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) stack.push(path)
        continue
      }
      if (!entry.isFile()) continue
      try {
        const mtime = statSync(path).mtimeMs
        if (newest === null || mtime > newest) newest = mtime
      } catch {
        // Vanished mid-walk; treat as absent content.
      }
    }
  }
  return newest
}

export function worktreeLiveness(
  repoRoot: string,
  targets: { parcelKey: string; goalSlug: string },
  thresholdMs: number,
  nowMs: number,
): LivenessSignal {
  const gitDir = gitDirOf(repoRoot)
  if (gitDir === null) {
    return {
      live: false,
      worktree: null,
      branch: null,
      newestMtime: null,
      reason: 'no gitdir on disk',
    }
  }
  let entries: string[]
  try {
    entries = readdirSync(join(gitDir, 'worktrees'))
  } catch {
    return {
      live: false,
      worktree: null,
      branch: null,
      newestMtime: null,
      reason: 'no registered worktrees in <gitdir>/worktrees',
    }
  }
  const needleKey = targets.parcelKey.toLowerCase()
  const needleGoal = targets.goalSlug.toLowerCase()
  for (const name of entries.sort()) {
    const recordDir = join(gitDir, 'worktrees', name)
    let gitdirLine: string
    try {
      gitdirLine = readFileSync(join(recordDir, 'gitdir'), 'utf8').trim()
    } catch {
      continue
    }
    const worktreeDir = resolve(dirname(gitdirLine))
    const base = basename(worktreeDir).toLowerCase()
    if (!base.includes(needleKey) && !base.includes(needleGoal)) continue
    let branch: string
    try {
      const head = readFileSync(join(recordDir, 'HEAD'), 'utf8').trim()
      const refMatch = /^ref:\s*refs\/heads\/(.+)$/.exec(head)
      branch = refMatch === null ? head : (refMatch[1] ?? head)
    } catch {
      continue // recorded branch ref does not exist -> no liveness for this worktree
    }
    const newest = newestMtimeMs(worktreeDir)
    const newestMtime = newest === null ? null : new Date(newest).toISOString()
    if (newest === null) {
      return {
        live: false,
        worktree: worktreeDir,
        branch,
        newestMtime: null,
        reason: 'matched worktree has no content files',
      }
    }
    const fresh = nowMs - newest <= thresholdMs
    return {
      live: fresh,
      worktree: worktreeDir,
      branch,
      newestMtime,
      reason: fresh
        ? `worktree content mtime within threshold (matched ${name})`
        : `worktree content stale beyond threshold (matched ${name})`,
    }
  }
  return {
    live: false,
    worktree: null,
    branch: null,
    newestMtime: null,
    reason: 'no worktree basename matched the parcel key or goal slug',
  }
}
