import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ConsoleConfig } from './config.js'
import { isRecord } from './guards.js'
import { makeSignal, type Signal, type SignalProvider } from './signals.js'

/**
 * FCA-P3 scm-ci provider: PR/CI semantics disk truth cannot see —
 * green-but-do-not-merge, conflicting+red, BEHIND under the strict up-to-date
 * ruleset, and merged PRs landing after the last release cut (the
 * "merged under a stale version string" class). All `gh` access goes through
 * the injectable client (zero live network in tests). Degradation is honest:
 * a missing `gh` binary or a failed query degrades to exactly one `info`
 * signal; a root with no git remote is simply not applicable (zero signals).
 */

export interface ScmClient {
  readonly available: () => boolean
  readonly hasRemote: (root: string) => boolean
  readonly openPrs: (root: string) => string
  readonly mergedPrs: (root: string) => string
}

function run(bin: string, args: readonly string[], cwd: string | undefined): string {
  return execFileSync(bin, [...args], {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).replace(/\s+$/, '')
}

export const defaultScmClient: ScmClient = {
  available: () => {
    try {
      run('gh', ['--version'], undefined)
      return true
    } catch {
      return false
    }
  },
  hasRemote: (root) => {
    try {
      return run('git', ['-C', root, 'remote'], undefined) !== ''
    } catch {
      return false
    }
  },
  openPrs: (root) =>
    run(
      'gh',
      [
        'pr',
        'list',
        '--state',
        'open',
        '--limit',
        '30',
        '--json',
        'number,title,isDraft,mergeable,mergeStateStatus,statusCheckRollup',
      ],
      root,
    ),
  mergedPrs: (root) =>
    run(
      'gh',
      [
        'pr',
        'list',
        '--state',
        'merged',
        '--limit',
        '10',
        '--json',
        'number,title,mergedAt,additions,deletions',
      ],
      root,
    ),
}

interface Check {
  readonly status: string
  readonly conclusion: string | null
}

interface OpenPr {
  readonly number: number
  readonly title: string
  readonly isDraft: boolean
  readonly mergeable: string
  readonly mergeStateStatus: string
  readonly checks: readonly Check[]
}

interface MergedPr {
  readonly number: number
  readonly title: string
  readonly mergedAt: string
  readonly additions: number
  readonly deletions: number
}

function parseOpenPrs(raw: string): OpenPr[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return []
  }
  if (!Array.isArray(parsed)) return []
  const prs: OpenPr[] = []
  for (const entry of parsed) {
    if (!isRecord(entry) || typeof entry.number !== 'number' || typeof entry.title !== 'string')
      continue
    const checks: Check[] = []
    if (Array.isArray(entry.statusCheckRollup)) {
      for (const rawCheck of entry.statusCheckRollup) {
        if (!isRecord(rawCheck)) continue
        checks.push({
          status: typeof rawCheck.status === 'string' ? rawCheck.status : '',
          conclusion: typeof rawCheck.conclusion === 'string' ? rawCheck.conclusion : null,
        })
      }
    }
    prs.push({
      number: entry.number,
      title: entry.title,
      isDraft: entry.isDraft === true,
      mergeable: typeof entry.mergeable === 'string' ? entry.mergeable : 'UNKNOWN',
      mergeStateStatus: typeof entry.mergeStateStatus === 'string' ? entry.mergeStateStatus : '',
      checks,
    })
  }
  return prs
}

function parseMergedPrs(raw: string): MergedPr[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return []
  }
  if (!Array.isArray(parsed)) return []
  const prs: MergedPr[] = []
  for (const entry of parsed) {
    if (!isRecord(entry) || typeof entry.number !== 'number' || typeof entry.mergedAt !== 'string')
      continue
    prs.push({
      number: entry.number,
      title: typeof entry.title === 'string' ? entry.title : '',
      mergedAt: entry.mergedAt,
      additions: typeof entry.additions === 'number' ? entry.additions : 0,
      deletions: typeof entry.deletions === 'number' ? entry.deletions : 0,
    })
  }
  return prs
}

/** Newest `## <semver> — <date>` cut across root and each plugin's CHANGELOG.md. */
function lastRelease(root: string): { version: string; date: string } | null {
  const files: string[] = []
  const rootChangelog = join(root, 'CHANGELOG.md')
  if (existsSync(rootChangelog)) files.push(rootChangelog)
  const pluginsDir = join(root, 'plugins')
  if (existsSync(pluginsDir)) {
    for (const name of readdirSync(pluginsDir)) {
      const changelog = join(pluginsDir, name, 'CHANGELOG.md')
      if (existsSync(changelog)) files.push(changelog)
    }
  }
  let best: { version: string; date: string } | null = null
  for (const file of files) {
    const text = readFileSync(file, 'utf8')
    for (const match of text.matchAll(/^##\s+(\d+\.\d+\.\d+)\s+[—–-]\s+(\d{4}-\d{2}-\d{2})/gm)) {
      const entry = { version: match[1] ?? '', date: match[2] ?? '' }
      if (best === null || entry.date > best.date) best = entry
    }
  }
  return best
}

const SUBSTANTIVE_LINES = 200

export const scmCiProvider: SignalProvider & {
  collect(config: ConsoleConfig, now: number, client?: ScmClient): Signal[]
} = {
  class: 'scm-ci',
  collect(config: ConsoleConfig, now: number, client: ScmClient = defaultScmClient): Signal[] {
    const root = config.repoRoot
    const detectedAt = new Date(now).toISOString()

    if (!client.available()) {
      return [
        makeSignal({
          class: 'scm-ci',
          severity: 'info',
          repo: root,
          subject: 'gh',
          evidence: ['gh: unavailable — scm-ci signals not collected'],
          detectedAt,
          actions: ['investigate', 'explain'],
        }),
      ]
    }
    if (!client.hasRemote(root)) return []

    let openPrs: OpenPr[]
    let mergedPrs: MergedPr[]
    try {
      openPrs = parseOpenPrs(client.openPrs(root))
      mergedPrs = parseMergedPrs(client.mergedPrs(root))
    } catch {
      return [
        makeSignal({
          class: 'scm-ci',
          severity: 'info',
          repo: root,
          subject: 'gh',
          evidence: ['gh: query failed (network/host outage) — scm-ci signals not collected'],
          detectedAt,
          actions: ['investigate', 'explain'],
        }),
      ]
    }

    const signals: Signal[] = []
    for (const pr of openPrs) {
      const allGreen =
        pr.checks.length > 0 &&
        pr.checks.every((check) => check.status === 'COMPLETED' && check.conclusion === 'SUCCESS')
      const failing = pr.checks.filter((check) => check.conclusion === 'FAILURE').length
      const doNotMerge = /do not merge/i.test(pr.title)

      if (allGreen && (pr.isDraft || doNotMerge)) {
        signals.push(
          makeSignal({
            class: 'scm-ci',
            severity: 'attention',
            repo: root,
            subject: `pr/${pr.number}/do-not-merge`,
            evidence: [
              `gh: PR #${pr.number} checks green; do not merge marker (${pr.isDraft ? 'draft' : 'title'}): ${pr.title}`,
            ],
            detectedAt,
            actions: ['investigate', 'remediate', 'explain', 'close-delete'],
          }),
        )
      }
      if (pr.mergeable === 'CONFLICTING' || failing > 0) {
        signals.push(
          makeSignal({
            class: 'scm-ci',
            severity: 'attention',
            repo: root,
            subject: `pr/${pr.number}/red`,
            evidence: [
              `gh: PR #${pr.number} mergeable ${pr.mergeable}; failing checks: ${failing}`,
            ],
            detectedAt,
            actions: ['investigate', 'remediate', 'explain', 'close-delete'],
          }),
        )
      }
      if (pr.mergeStateStatus === 'BEHIND') {
        signals.push(
          makeSignal({
            class: 'scm-ci',
            severity: 'info',
            repo: root,
            subject: `pr/${pr.number}/behind`,
            evidence: [
              `gh: PR #${pr.number} BEHIND under the strict up-to-date ruleset (merge needs update)`,
            ],
            detectedAt,
            actions: ['investigate', 'explain'],
          }),
        )
      }
    }

    const release = lastRelease(root)
    if (release !== null) {
      for (const pr of mergedPrs) {
        const size = pr.additions + pr.deletions
        if (size < SUBSTANTIVE_LINES || pr.mergedAt <= `${release.date}T00:00:00Z`) continue
        signals.push(
          makeSignal({
            class: 'scm-ci',
            severity: 'attention',
            repo: root,
            subject: `pr/${pr.number}/release-gap`,
            evidence: [
              `gh: PR #${pr.number} merged ${pr.mergedAt.slice(0, 10)} (+${pr.additions}/-${pr.deletions}) with no release event since`,
              `last release: ${release.version} (${release.date})`,
            ],
            detectedAt,
            actions: ['remediate', 'explain'],
          }),
        )
      }
    }
    return signals
  },
}
