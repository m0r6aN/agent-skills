import { execFileSync } from 'node:child_process'
import type { ConsoleConfig } from './config.js'
import { makeSignal, type Signal, type SignalProvider } from './signals.js'
import { runAsync } from './spawn-async.js'

/**
 * FCA-P3 worktree-hygiene provider: uncommitted/untracked churn, long-lived
 * dirty state files, unpushed commits, and stale local branches. The
 * lumber-jack-derived checks follow the `lumber-jack` skill's own rules —
 * unpushed work is scoped to the inspected HEAD (`git log HEAD --not
 * --remotes`), and pushed branches are preserved — and label their evidence
 * `lumber-jack: ` per the owner directive. Failing git probes degrade to "no
 * findings" (a non-git root is simply clean), never to guessed state.
 */

export interface WorktreeProbe {
  /** `git status --porcelain` */
  readonly statusPorcelain: (root: string) => string
  /** `git log --format=%h %s HEAD --not --remotes` (lumber-jack: HEAD-scoped). */
  readonly headUnpushed: (root: string) => string
  /** `git for-each-ref refs/heads --format=%(refname:short)%09%(upstream:track)` */
  readonly branchTracks: (root: string) => string
  /** `git for-each-ref --merged=HEAD refs/heads --format=%(refname:short)%09%(HEAD)` */
  readonly mergedBranches: (root: string) => string
}

/** FCA-P14: Async version of WorktreeProbe for non-blocking signal collection. */
export interface AsyncWorktreeProbe {
  readonly statusPorcelain: (root: string) => Promise<string>
  readonly headUnpushed: (root: string) => Promise<string>
  readonly branchTracks: (root: string) => Promise<string>
  readonly mergedBranches: (root: string) => Promise<string>
}

function git(args: readonly string[]): (root: string) => string {
  return (root) => {
    try {
      // Trailing-whitespace strip only: a global trim would eat the leading
      // space of `git status --porcelain`'s first line (its two-column code).
      return execFileSync('git', ['-C', root, ...args], {
        cwd: root,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).replace(/\s+$/, '')
    } catch {
      return ''
    }
  }
}

export const defaultWorktreeProbe: WorktreeProbe = {
  statusPorcelain: git(['status', '--porcelain']),
  headUnpushed: git(['log', '--format=%h %s', 'HEAD', '--not', '--remotes']),
  branchTracks: git([
    'for-each-ref',
    'refs/heads',
    '--format=%(refname:short)%09%(upstream:short)%09%(upstream:track)',
  ]),
  mergedBranches: git([
    'for-each-ref',
    '--merged=HEAD',
    'refs/heads',
    '--format=%(refname:short)%09%(HEAD)',
  ]),
}

/** FCA-P14: Async helper for git commands. */
async function gitAsync(args: readonly string[], root: string): Promise<string> {
  try {
    return await runAsync('git', ['-C', root, ...args], root)
  } catch {
    return ''
  }
}

/** FCA-P14: Default async probe using non-blocking spawn. */
export const defaultAsyncWorktreeProbe: AsyncWorktreeProbe = {
  statusPorcelain: (root) => gitAsync(['status', '--porcelain'], root),
  headUnpushed: (root) => gitAsync(['log', '--format=%h %s', 'HEAD', '--not', '--remotes'], root),
  branchTracks: (root) =>
    gitAsync(
      [
        'for-each-ref',
        'refs/heads',
        '--format=%(refname:short)%09%(upstream:short)%09%(upstream:track)',
      ],
      root,
    ),
  mergedBranches: (root) =>
    gitAsync(
      ['for-each-ref', '--merged=HEAD', 'refs/heads', '--format=%(refname:short)%09%(HEAD)'],
      root,
    ),
}

const STATE_FILE_PATTERN = /(^|\/)state\//
const EVIDENCE_CAP = 20

function capped(items: readonly string[]): string[] {
  if (items.length <= EVIDENCE_CAP) return [...items]
  return [...items.slice(0, EVIDENCE_CAP), `… and ${items.length - EVIDENCE_CAP} more`]
}

/** Parse `git status --porcelain` output into dirty/untracked path lists. */
export function statusPaths(porcelain: string): { dirty: string[]; untracked: string[] } {
  const dirty: string[] = []
  const untracked: string[] = []
  for (const line of porcelain.split('\n')) {
    if (line.length < 4) continue
    const code = line.slice(0, 2)
    let path = line.slice(3)
    const arrow = path.indexOf(' -> ')
    if (arrow !== -1) path = path.slice(arrow + 4)
    if (code.trim() === '??') untracked.push(path)
    else if (code.trim() !== '!!') dirty.push(path)
  }
  return { dirty, untracked }
}

function signal(
  config: ConsoleConfig,
  subject: string,
  severity: 'attention' | 'info',
  evidence: string[],
  actions:
    | readonly ['remediate', 'investigate', 'explain']
    | readonly ['remediate', 'close-delete', 'explain'],
  detectedAt: string,
): Signal {
  return makeSignal({
    class: 'worktree-hygiene',
    severity,
    repo: config.repoRoot,
    subject,
    evidence: capped(evidence),
    detectedAt,
    actions,
  })
}

/** FCA-P14: Build worktree hygiene signals from probe results (shared sync/async). */
function buildWorktreeSignals(
  config: ConsoleConfig,
  detectedAt: string,
  porcelainOutput: string,
  unpushedOutput: string,
  branchTracksOutput: string,
  mergedBranchesOutput: string,
): Signal[] {
  const signals: Signal[] = []

  const { dirty, untracked } = statusPaths(porcelainOutput)
  const churn = [
    ...dirty.map((path) => `dirty: ${path}`),
    ...untracked.map((path) => `untracked: ${path}`),
  ]
  if (churn.length > 0) {
    signals.push(
      signal(
        config,
        'git-status',
        'attention',
        churn,
        ['remediate', 'investigate', 'explain'],
        detectedAt,
      ),
    )
  }
  const stateFiles = [...dirty, ...untracked].filter((path) => STATE_FILE_PATTERN.test(path))
  if (stateFiles.length > 0) {
    signals.push(
      signal(
        config,
        'state-files',
        'attention',
        stateFiles.map((path) => `dirty state file: ${path}`),
        ['remediate', 'investigate', 'explain'],
        detectedAt,
      ),
    )
  }

  const unpushedLines = unpushedOutput.split('\n').filter((line) => line !== '')
  if (unpushedLines.length > 0) {
    signals.push(
      signal(
        config,
        'HEAD',
        'attention',
        unpushedLines.map((line) => `lumber-jack: unpushed ${line}`),
        ['remediate', 'investigate', 'explain'],
        detectedAt,
      ),
    )
  }

  const stale: string[] = []
  const tracks = new Map<string, { upstream: string; track: string }>()
  for (const line of branchTracksOutput.split('\n')) {
    if (line === '') continue
    const [branch = '', upstream = '', track = ''] = line.split('\t')
    tracks.set(branch, { upstream, track })
    if (track.includes('gone')) stale.push(`lumber-jack: branch ${branch} (upstream gone)`)
  }
  for (const line of mergedBranchesOutput.split('\n')) {
    if (line === '') continue
    const [branch = '', marker = ''] = line.split('\t')
    if (marker.trim() === '*') continue
    if ((tracks.get(branch)?.upstream ?? '') !== '') continue
    stale.push(`lumber-jack: branch ${branch} (merged into HEAD, no upstream)`)
  }
  if (stale.length > 0) {
    signals.push(
      signal(
        config,
        'branches',
        'info',
        stale,
        ['remediate', 'close-delete', 'explain'],
        detectedAt,
      ),
    )
  }
  return signals
}

export const worktreeHygieneProvider: SignalProvider & {
  collect(config: ConsoleConfig, now: number, probe?: WorktreeProbe): Signal[]
  collectAsync(config: ConsoleConfig, now: number, probe?: AsyncWorktreeProbe): Promise<Signal[]>
} = {
  class: 'worktree-hygiene',
  collect(
    config: ConsoleConfig,
    now: number,
    probe: WorktreeProbe = defaultWorktreeProbe,
  ): Signal[] {
    const detectedAt = new Date(now).toISOString()
    const root = config.repoRoot
    return buildWorktreeSignals(
      config,
      detectedAt,
      probe.statusPorcelain(root),
      probe.headUnpushed(root),
      probe.branchTracks(root),
      probe.mergedBranches(root),
    )
  },

  /** FCA-P14: Non-blocking version using async spawn. */
  async collectAsync(
    config: ConsoleConfig,
    now: number,
    probe: AsyncWorktreeProbe = defaultAsyncWorktreeProbe,
  ): Promise<Signal[]> {
    const detectedAt = new Date(now).toISOString()
    const root = config.repoRoot
    const [porcelain, unpushed, tracks, merged] = await Promise.all([
      probe.statusPorcelain(root),
      probe.headUnpushed(root),
      probe.branchTracks(root),
      probe.mergedBranches(root),
    ])
    return buildWorktreeSignals(config, detectedAt, porcelain, unpushed, tracks, merged)
  },
}
