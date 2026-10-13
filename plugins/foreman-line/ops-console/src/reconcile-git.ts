import { statSync } from 'node:fs'
import { isAbsolute, join } from 'node:path'
import { defaultGitRunner, type GitRunner } from './ledger-git.js'

/**
 * FCA-P8 local git fact gatherer (read-only: for-each-ref, worktree list,
 * log, ls-tree, rev-list). ONE batch of git calls per repo per request - never
 * per parcel - so cost is flat in the number of parcels. Remote facts are the
 * LAST-FETCHED refs and carry that age (`refsAsOf`); nothing here fetches.
 */

export interface BranchFact {
  readonly name: string
  readonly remote: boolean
  readonly sha: string
  /** Tip is an ancestor of the default ref (git's own merge evidence). */
  readonly mergedIntoDefault: boolean
  readonly upstream: string | null
  readonly aheadOfUpstream: number | null
  readonly behindUpstream: number | null
  readonly upstreamGone: boolean
}

export interface WorktreeFact {
  readonly path: string
  readonly branch: string | null
  readonly head: string
}

export interface CommitFact {
  readonly sha: string
  readonly at: string
  readonly subject: string
}

export interface RepoFacts {
  readonly repoRoot: string
  /** e.g. `origin/main`; null when no default ref could be established. */
  readonly defaultRef: string | null
  /** mtime of FETCH_HEAD (ISO), the age of every remote-ref fact; null if never fetched. */
  readonly refsAsOf: string | null
  /** The checked-out branch of the primary worktree (what 'local' means); null if detached. */
  readonly currentBranch: string | null
  readonly branches: readonly BranchFact[]
  readonly worktrees: readonly WorktreeFact[]
  readonly defaultLog: readonly CommitFact[]
  readonly allLog: readonly CommitFact[]
  readonly remoteSpecFiles: readonly {
    readonly name: string
    readonly location: 'active' | 'done'
  }[]
  readonly defaultDivergence: { readonly ahead: number; readonly behind: number } | null
  /**
   * Which reads actually succeeded. A failed read is UNKNOWN, never "empty": an
   * empty `merged` set would make every branch look unmerged, an empty spec
   * listing would make every spec look absent, an empty log would erase commit
   * evidence. Absence-based findings are withheld unless the relevant read is complete.
   */
  readonly complete: {
    readonly branches: boolean
    readonly merged: boolean
    readonly specs: boolean
    readonly defaultLog: boolean
    readonly worktrees: boolean
  }
  /** The log limit was reached: older history is not in `defaultLog`/`allLog`. */
  readonly logTruncated: boolean
}

export const LOG_LIMIT = 5000
const SPECS_REL = 'plugins/foreman-line/docs/specs'

function lines(raw: string | null): string[] {
  return raw === null || raw === '' ? [] : raw.split('\n')
}

function parseLog(raw: string | null): CommitFact[] {
  return lines(raw)
    .map((line) => line.split('\u001f'))
    .filter((parts) => parts.length >= 3)
    .map(([sha, at, ...subject]) => ({
      sha: sha ?? '',
      at: at ?? '',
      subject: subject.join('\u001f'),
    }))
}

function parseTrack(track: string): { ahead: number | null; behind: number | null; gone: boolean } {
  if (track === 'gone') return { ahead: null, behind: null, gone: true }
  const ahead = /ahead (\d+)/.exec(track)
  const behind = /behind (\d+)/.exec(track)
  return {
    ahead: ahead === null ? 0 : Number(ahead[1]),
    behind: behind === null ? 0 : Number(behind[1]),
    gone: false,
  }
}

export function parseWorktrees(raw: string | null): WorktreeFact[] {
  const result: WorktreeFact[] = []
  let current: { path?: string; head?: string; branch?: string | null } = {}
  const flush = () => {
    if (current.path !== undefined) {
      result.push({ path: current.path, head: current.head ?? '', branch: current.branch ?? null })
    }
    current = {}
  }
  for (const line of lines(raw)) {
    if (line === '') flush()
    else if (line.startsWith('worktree ')) current.path = line.slice('worktree '.length)
    else if (line.startsWith('HEAD ')) current.head = line.slice('HEAD '.length)
    else if (line.startsWith('branch ')) current.branch = line.slice('branch refs/heads/'.length)
  }
  flush()
  return result
}

function fetchedAt(run: GitRunner, repoRoot: string): string | null {
  const common = run(repoRoot, ['rev-parse', '--git-common-dir'])
  if (common === null) return null
  const dir = isAbsolute(common) ? common : join(repoRoot, common)
  try {
    return new Date(statSync(join(dir, 'FETCH_HEAD')).mtimeMs).toISOString()
  } catch {
    return null
  }
}

export function gatherRepoFacts(
  repoRoot: string,
  run: GitRunner = defaultGitRunner,
  /** Repo-relative POSIX specs dir, or null when it is outside the repository (specs then read unknown). */
  specsRel: string | null = SPECS_REL,
): RepoFacts {
  let defaultRef = run(repoRoot, ['symbolic-ref', '--short', 'refs/remotes/origin/HEAD'])
  if (defaultRef === null || defaultRef === '') {
    defaultRef =
      run(repoRoot, ['rev-parse', '--verify', '-q', 'refs/remotes/origin/main']) === null
        ? null
        : 'origin/main'
  }
  const mergedRaw =
    defaultRef === null
      ? ''
      : run(repoRoot, [
          'for-each-ref',
          `--merged=${defaultRef}`,
          'refs/heads',
          'refs/remotes',
          '--format=%(refname)',
        ])
  const merged = new Set(lines(mergedRaw))
  const branchesRaw = run(repoRoot, [
    'for-each-ref',
    'refs/heads',
    'refs/remotes',
    '--format=%(refname)\t%(refname:short)\t%(objectname)\t%(upstream:short)\t%(upstream:track,nobracket)',
  ])
  const branches: BranchFact[] = lines(branchesRaw)
    .map((line) => line.split('\t'))
    .filter(
      ([ref, short]) =>
        ref !== undefined && short !== undefined && short !== 'origin/HEAD' && short !== 'origin',
    )
    .map(([ref, short, sha, upstream, track]) => {
      const parsed = parseTrack(track ?? '')
      const remote = (ref ?? '').startsWith('refs/remotes/')
      return {
        name: short ?? '',
        remote,
        sha: sha ?? '',
        mergedIntoDefault: merged.has(ref ?? ''),
        upstream: upstream === undefined || upstream === '' ? null : upstream,
        aheadOfUpstream: upstream ? parsed.ahead : null,
        behindUpstream: upstream ? parsed.behind : null,
        upstreamGone: upstream ? parsed.gone : false,
      }
    })

  const specsRaw =
    defaultRef === null || specsRel === null
      ? null
      : run(repoRoot, [
          'ls-tree',
          '-r',
          '--name-only',
          defaultRef,
          '--',
          `${specsRel}/active`,
          `${specsRel}/done`,
        ])
  const specLines = lines(specsRaw)
  const remoteSpecFiles = specLines
    .map((path) => {
      const location: 'active' | 'done' | null = path.includes('/specs/done/')
        ? 'done'
        : path.includes('/specs/active/')
          ? 'active'
          : null
      return location === null ? null : { name: path.slice(path.lastIndexOf('/') + 1), location }
    })
    .filter((entry): entry is { name: string; location: 'active' | 'done' } => entry !== null)

  let defaultDivergence: RepoFacts['defaultDivergence'] = null
  if (defaultRef !== null) {
    const localName = defaultRef.replace(/^origin\//, '')
    const counts = run(repoRoot, [
      'rev-list',
      '--left-right',
      '--count',
      `${localName}...${defaultRef}`,
    ])
    const match = counts === null ? null : /^(\d+)\s+(\d+)$/.exec(counts.trim())
    if (match !== null) defaultDivergence = { ahead: Number(match[1]), behind: Number(match[2]) }
  }

  const logFormat = '--format=%H%x1f%cI%x1f%s'
  const defaultLogRaw =
    defaultRef === null
      ? ''
      : run(repoRoot, ['log', defaultRef, logFormat, '-n', String(LOG_LIMIT)])
  const allLogRaw = run(repoRoot, ['log', '--all', logFormat, '-n', String(LOG_LIMIT)])
  const worktreesRaw = run(repoRoot, ['worktree', 'list', '--porcelain'])
  const defaultLog = parseLog(defaultLogRaw)
  const allLog = parseLog(allLogRaw)
  return {
    repoRoot,
    defaultRef,
    refsAsOf: fetchedAt(run, repoRoot),
    currentBranch: run(repoRoot, ['symbolic-ref', '--short', '-q', 'HEAD']),
    branches,
    worktrees: parseWorktrees(worktreesRaw),
    defaultLog,
    allLog,
    remoteSpecFiles,
    defaultDivergence,
    complete: {
      branches: branchesRaw !== null,
      merged: defaultRef === null || mergedRaw !== null,
      specs: defaultRef !== null && specsRel !== null && specsRaw !== null,
      defaultLog: defaultRef !== null && defaultLogRaw !== null,
      worktrees: worktreesRaw !== null,
    },
    logTruncated: defaultLog.length >= LOG_LIMIT || allLog.length >= LOG_LIMIT,
  }
}
