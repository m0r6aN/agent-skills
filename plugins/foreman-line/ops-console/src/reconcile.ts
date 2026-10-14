const LOOP_DIRECTIVE_HINT =
  // biome-ignore lint/suspicious/noTemplateCurlyInString: '${REPO_ROOT}' is intentional placeholder text shown to operators, not a template
  '${REPO_ROOT}/plugins/foreman-line/docs/goals/GOAL-SLUG/loop-directive.md'

import { basename } from 'node:path'
import type { LedgerEntry } from './ledger.js'
import type { GitFact } from './ledger-git.js'
import type { CommitFact, RepoFacts } from './reconcile-git.js'
import type { PrFact, PrFacts } from './reconcile-remote.js'
import type { RemedyOption } from './remedy.js'
import type { ParcelProjection, QueueItem } from './types.js'

/**
 * FCA-P8 reconciliation: for each parcel, compare what the LOCAL record claims
 * with what local git and the REMOTE show, name every disagreement from a
 * closed vocabulary WITH its evidence, and explain `hung` in plain terms.
 *
 * Invariants (FOC-P0 frozen contract untouched):
 * - Additive and read-only: nothing here writes. `state` is READ as a
 *   reconciliation input (is the record closed? is it hung?) and `state`/`rule`
 *   are never changed or re-derived; the frozen derivation is not touched.
 * - Deterministic linking only: a parcel links to a branch/worktree/PR/commit
 *   solely by its exact key as a delimited token. A candidate matching several
 *   keys of the same goal is AMBIGUOUS: shown, never used to assert.
 * - A discrepancy is asserted only from the evidence it names. Remote-dependent
 *   codes are withheld when the remote is unavailable.
 * - Strong shipping evidence is a merged PR into the default branch whose
 *   conventional-commit type is feat/fix/perf/refactor. docs/chore/ci titles
 *   and untyped titles (spec drafts, record closures, promotions) and commit
 *   subjects are WEAK traces: displayed, never asserted from.
 */

export const SCOPE_FOOTER =
  'Report findings only. Change nothing. Do not merge, push, close, delete, or fetch. Stop when the question is answered.'
export const OPTION_ACTS: Record<DiscrepancyCode, readonly (('investigate' | 'explain') | null)[]> =
  {
    'shipped-unrecorded': [null, 'investigate', null],
    'recorded-unshipped': ['investigate', 'investigate', null],
    'unmerged-work': ['investigate', null, null],
    'orphan-worktree': ['investigate', null],
    'never-started': [null, 'investigate', null],
    'local-remote-divergence': ['explain', 'explain'],
    'stale-abandoned': ['investigate', 'investigate', null, null],
  }

export const DISCREPANCY_CODES = [
  'shipped-unrecorded',
  'recorded-unshipped',
  'unmerged-work',
  'orphan-worktree',
  'never-started',
  'local-remote-divergence',
  'stale-abandoned',
] as const
export type DiscrepancyCode = (typeof DISCREPANCY_CODES)[number]

export interface LinkedRef {
  readonly kind: 'branch' | 'remote-branch' | 'worktree' | 'pr' | 'commit' | 'session'
  readonly ref: string
  readonly detail: string
  readonly at: string | null
}

export interface Discrepancy {
  /**
   * `asserted`: the evidence named is sufficient for the code. `weak-traces`:
   * the code is the best fit but traces exist that could mean the work shipped
   * under another identity, so it must be read as a prompt to verify.
   */
  readonly confidence: 'asserted' | 'weak-traces'
  readonly code: DiscrepancyCode
  readonly summary: string
  readonly evidence: readonly string[]
  readonly question: string
  readonly options: readonly RemedyOption[]
}

export interface HistoryEvent {
  readonly at: string | null
  readonly source: 'receipt' | 'commit' | 'pr' | 'session'
  readonly kind: string
  readonly label: string
  readonly ref: string | null
}

export interface HungExplanation {
  readonly lines: readonly string[]
  readonly note: string | null
}

export interface SessionEvidence {
  readonly receiptId: string
  readonly worktreePath: string
  readonly createdAt: string
  readonly state: LedgerEntry['state']
  readonly exitAt: string | null
  readonly orphanClean: boolean
}

export interface Reconciliation {
  readonly parcel: string
  readonly local: {
    readonly specLocation: ParcelProjection['specLocation']
    readonly recordMarksClosed: boolean
    readonly chainSealed: boolean | null
    readonly checkedOutBranch: string | null
    readonly branches: readonly LinkedRef[]
    readonly worktrees: readonly LinkedRef[]
    readonly sessions: readonly LinkedRef[]
    /** Goal state lines that mention this parcel (ranges expanded). */
    readonly stateMentions: readonly string[]
  }
  readonly remote: {
    readonly prs: {
      readonly available: boolean
      readonly reason: string | null
      readonly asOf: string | null
    }
    readonly refs: {
      readonly available: boolean
      readonly defaultRef: string | null
      readonly asOf: string | null
    }
    readonly specLocation: 'active' | 'done' | 'none' | 'unknown'
    readonly mergedPrs: readonly LinkedRef[]
    readonly otherPrs: readonly LinkedRef[]
    readonly commits: readonly LinkedRef[]
    readonly branches: readonly LinkedRef[]
  }
  readonly ambiguous: readonly LinkedRef[]
  readonly discrepancies: readonly Discrepancy[]
  readonly history: readonly HistoryEvent[]
  /** Events found before the display cap; `history.length < historyTotal` means older events are not shown. */
  readonly historyTotal: number
  readonly absentSources: readonly string[]
  readonly hung: HungExplanation | null
}

export interface ReconcileInput {
  readonly parcels: readonly ParcelProjection[]
  readonly items: readonly QueueItem[]
  /** Goal state lines (`**…state…**` of the loop directive): local record claims about parcels. */
  readonly stateLines?: readonly string[]
  /**
   * Parcel keys of the repository's OTHER goals. They take no part in the output but
   * are indexed so a candidate that matches a key here AND one there is recognised as
   * ambiguous instead of silently attaching to this goal's key.
   */
  readonly otherKeys?: readonly string[]
  readonly repo: RepoFacts
  readonly prs: PrFacts
  readonly sessions: readonly SessionEvidence[]
  /** Git outcome of a worktree measured against the default ref (injected for tests). */
  readonly worktreeOutcome: (path: string) => GitFact
  readonly now: number
}

const HISTORY_CAP = 100
/** Mirrors the derive.ts R2 closed-marker pattern (record says the item is closed). */
const CLOSED_MARKER = /☑|SHIPPED|CLOSED|COMPLETE/
const DELIVERY_TYPES = new Set(['feat', 'fix', 'perf', 'refactor'])

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Keys too short and plain to link deterministically are never linked. */
export function linkable(key: string): boolean {
  return key.includes('-') && key.length >= 4
}

export function keyPattern(key: string): RegExp {
  return new RegExp(`(?<![a-z0-9])${escapeRegex(key.toLowerCase())}(?![a-z0-9])`, 'i')
}

/**
 * Goal state lines abbreviate runs as `FOC-P1–FOC-P4` or `TO-P0–TO-P7`. Expand
 * a range ONLY when both ends share a prefix and are numerically ordered and
 * short; anything else stays literal. Deterministic, no guessing.
 */
export function expandRanges(text: string): string {
  // Bound the work: a pathological line is left literal rather than scanned.
  if (text.length > 4000) return text
  const extra: string[] = []
  for (const match of text.matchAll(
    /([A-Z][A-Z0-9]*(?:-[A-Z0-9]+)*?-P)(\d+)\s*[–—-]\s*\1(\d+)(?![A-Za-z0-9])/g,
  )) {
    const prefix = match[1] as string
    const from = Number(match[2])
    const to = Number(match[3])
    if (from <= to && to - from <= 50) for (let n = from; n <= to; n++) extra.push(`${prefix}${n}`)
  }
  return extra.length === 0 ? text : `${text} ${extra.join(' ')}`
}

/**
 * Token index with the SAME semantics as `keyPattern`, in one pass over the
 * text: alphanumeric runs are tokens; adjacent tokens joined by exactly one
 * `-` form candidate keys (so `foc-p1` is found inside `feat/foc-p1-wip` but
 * not inside `foc-p10`, `xfoc-p1`, `foc_p1`, or `foc p1`). Cost is linear in
 * text length, independent of the number of parcels (AC8 scale).
 */
export function makeKeyIndex(keys: readonly string[]): (text: string) => string[] {
  const byLower = new Map<string, string>()
  let maxSegments = 1
  for (const key of keys) {
    if (!linkable(key)) continue
    byLower.set(key.toLowerCase(), key)
    maxSegments = Math.max(maxSegments, key.split('-').length)
  }
  return (text) => {
    const tokens: string[] = []
    const dashJoined: boolean[] = []
    for (const match of text.toLowerCase().matchAll(/[a-z0-9]+|[^a-z0-9]+/g)) {
      const part = match[0]
      if (/^[a-z0-9]/.test(part)) {
        tokens.push(part)
        dashJoined.push(false)
      } else if (part === '-' && tokens.length > 0) {
        dashJoined[tokens.length - 1] = true // joins the previous token to the next
      }
    }
    const found = new Set<string>()
    for (let start = 0; start < tokens.length; start++) {
      let candidate = tokens[start] ?? ''
      for (let length = 1; length <= maxSegments; length++) {
        const key = byLower.get(candidate)
        if (key !== undefined) found.add(key)
        const index = start + length - 1
        if (!dashJoined[index] || index + 1 >= tokens.length) break
        candidate = `${candidate}-${tokens[index + 1]}`
      }
    }
    return [...found]
  }
}

/** Conventional-commit type of a PR title ("feat(scope): …" → "feat"), else null. */
export function titleType(title: string): string | null {
  const match = /^([a-z]+)(?:\([^)]*\))?!?:\s/i.exec(title.trim())
  return match === null ? null : (match[1] ?? '').toLowerCase()
}

/** Titles that announce a partial or corrective change are not evidence a parcel was delivered. */
const HEDGED_TITLE = /\b(?:revert|follow-?up|partial|wip)\b/i

export function isDeliveryPr(pr: PrFact, defaultBranch: string | null): boolean {
  const type = titleType(pr.title)
  return (
    pr.state === 'MERGED' &&
    // Without a known default branch there is no way to say what "merged" meant.
    defaultBranch !== null &&
    pr.baseRefName === defaultBranch &&
    type !== null &&
    DELIVERY_TYPES.has(type) &&
    !HEDGED_TITLE.test(pr.title)
  )
}

function short(sha: string): string {
  return sha.slice(0, 8)
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

interface Candidate {
  readonly text: string
  readonly ref: LinkedRef
}

function optionsFor(
  code: DiscrepancyCode,
  ctx: { repo: string; key: string; pr: string | null; path: string | null; loop: string },
): {
  question: string
  options: RemedyOption[]
} {
  switch (code) {
    case 'shipped-unrecorded':
      return {
        question: 'Did the merged work deliver this parcel, with only the record behind?',
        options: [
          {
            answer: 'Yes — the work shipped, the record is behind',
            recommendation:
              'Complete the record instead of redoing the work: move the spec to done/ (fix inbound links and INDEX.md), mark the queue item ☑ SHIPPED + CLOSED with the PR reference, and update the state line (Stage F).',
            act: null,
            commands: [
              ctx.pr === null
                ? `gh pr list --search "${ctx.key}" --state merged`
                : `gh pr view ${ctx.pr}`,
              `$EDITOR "${ctx.loop}"`,
            ],
          },
          {
            answer: 'Partly — more of the parcel remains',
            recommendation:
              'Keep it open and record what remains as a new queue item; do not mark it closed.',
            act: null,
            commands: [`$EDITOR "${ctx.loop}"`],
          },
          {
            answer: 'No — the PR is unrelated to the parcel (last resort)',
            recommendation:
              'Say why in the state line so the link is not trusted again; the parcel stays as it is.',
            act: null,
            commands: [`$EDITOR "${ctx.loop}"`],
          },
        ],
      }
    case 'recorded-unshipped':
      return {
        question: 'The record says closed but nothing on the remote shows the work. Where is it?',
        options: [
          {
            answer: 'The work exists under another name',
            recommendation:
              'Find it (branch, PR, commit message) and add the key to the record so it links; do not redo it.',
            act: null,
            commands: [
              `git -C "${ctx.repo}" log --all --oneline -i --grep="${ctx.key}"`,
              `gh pr list --state all --search "${ctx.key}"`,
            ],
          },
          {
            answer: 'The work exists locally but was never pushed',
            recommendation: 'Push it and open a PR; the record then matches reality.',
            act: null,
            commands: [`git -C "${ctx.repo}" branch -a --list "*${ctx.key.toLowerCase()}*"`],
          },
          {
            answer: 'The record was closed in error (last resort)',
            recommendation:
              'Reopen the queue item with a one-line disposition rather than deleting history.',
            act: null,
            commands: [`$EDITOR "${ctx.loop}"`],
          },
        ],
      }
    case 'unmerged-work':
      return {
        question: 'Unmerged work exists for this parcel. What does it need to land?',
        options: [
          {
            answer: 'It is ready or nearly ready',
            recommendation:
              'Resume it in place: finish, verify, and carry it to a PR and merge rather than restarting.',
            act: null,
            commands:
              ctx.path === null
                ? [`gh pr list --search "${ctx.key}"`]
                : [`git -C "${ctx.path}" status`, `git -C "${ctx.path}" log --oneline -10`],
          },
          {
            answer: 'It diverged from the default branch',
            recommendation: 'Rebase or merge the default branch into it first, then re-verify.',
            act: null,
            commands:
              ctx.path === null
                ? []
                : [
                    `git -C "${ctx.path}" fetch origin`,
                    `git -C "${ctx.path}" merge-base --is-ancestor origin/main HEAD`,
                  ],
          },
          {
            answer: 'It is stale and unwanted (last resort)',
            recommendation:
              'Close the PR or defer the item with a one-line disposition; keep the branch until you are sure.',
            act: null,
            commands: [`$EDITOR "${ctx.loop}"`],
          },
        ],
      }
    case 'orphan-worktree':
      return {
        question:
          'A worktree exists for this parcel with no live session, no commits and no changes. Is it needed?',
        options: [
          {
            answer: 'Resume the work in it',
            recommendation:
              'Start a fresh session in the same worktree rather than cutting another.',
            act: null,
            commands: ctx.path === null ? [] : [`git -C "${ctx.path}" status`],
          },
          {
            answer: 'It is leftover (last resort)',
            recommendation:
              'Reap it through the confirmation-gated close/delete action or the lumber-jack skill; git refuses to remove a dirty worktree.',
            act: null,
            commands:
              ctx.path === null ? [] : [`git -C "${ctx.repo}" worktree remove "${ctx.path}"`],
          },
        ],
      }
    case 'never-started':
      return {
        question:
          'Nothing on disk or on the remote shows this parcel was ever started. Is it still wanted?',
        options: [
          {
            answer: 'Yes — it is next in the queue',
            recommendation:
              'Shape and dispatch it through the normal gates; it needs a spec first.',
            act: null,
            commands: [`$EDITOR "${ctx.loop}"`],
          },
          {
            answer:
              'It shipped under another identity (bundled drop, renamed, or no per-parcel PR)',
            recommendation:
              'Key-based search cannot see bundled or renamed delivery. Find the delivering PR or commit (check the goal state line and the default branch), then complete the record: mark the queue item ☑ SHIPPED + CLOSED with that reference. Do not redo the work.',
            act: null,
            commands: [
              `git -C "${ctx.repo}" log origin/main --oneline -i --grep="${ctx.key}"`,
              `$EDITOR "${ctx.loop}"`,
            ],
          },
          {
            answer: 'It was deferred or superseded (last resort)',
            recommendation:
              'Record a one-line disposition on the queue item so it stops reading as stalled.',
            act: null,
            commands: [`$EDITOR "${ctx.loop}"`],
          },
        ],
      }
    case 'local-remote-divergence':
      return {
        question: 'Local and remote disagree. Which one is right?',
        options: [
          {
            answer: 'Local is ahead of remote',
            recommendation: 'Push the branch (or open the PR) so the remote record matches.',
            act: null,
            commands: [`git -C "${ctx.repo}" status -sb`],
          },
          {
            answer: 'Remote is ahead of local',
            recommendation:
              'Fetch and fast-forward before judging the parcel; local state may simply be old.',
            act: null,
            commands: [`git -C "${ctx.repo}" fetch origin`, `git -C "${ctx.repo}" status -sb`],
          },
        ],
      }
    case 'stale-abandoned':
      return {
        question: 'Nothing links this parcel to delivered or in-flight work. Is it abandoned?',
        options: [
          {
            answer: 'Check the weak traces first',
            recommendation:
              'Review the traces listed in the evidence (spec on the default branch, commits naming the key) before deciding; they may show the work shipped under another name.',
            act: null,
            commands: [`git -C "${ctx.repo}" log origin/main --oneline -i --grep="${ctx.key}"`],
          },
          {
            answer:
              'It shipped under another identity (bundled drop, renamed, or no per-parcel PR)',
            recommendation:
              'Find the delivering PR or commit, then complete the record (mark ☑ SHIPPED + CLOSED with the reference). Do not redo the work.',
            act: null,
            commands: [
              `git -C "${ctx.repo}" log origin/main --oneline -i --grep="${ctx.key}"`,
              `$EDITOR "${ctx.loop}"`,
            ],
          },
          {
            answer: 'It is intentionally paused',
            recommendation: 'Add a `hung-threshold: Nh` line so it stops reading as hung.',
            act: null,
            commands: [`$EDITOR "${ctx.loop}"`],
          },
          {
            answer: 'It is abandoned (last resort)',
            recommendation:
              'Close or defer the queue item with a one-line disposition; do not delete the record.',
            act: null,
            commands: [`$EDITOR "${ctx.loop}"`],
          },
        ],
      }
  }
}

function hungExplanation(
  parcel: ParcelProjection,
  codes: readonly DiscrepancyCode[],
  assessment: Assessment,
  recordMarksClosed: boolean,
  now: number,
): HungExplanation {
  const lines: string[] = []
  const last = parcel.heartbeat.lastProgressAt
  const hours = Math.round((parcel.heartbeat.thresholdMs / 3_600_000) * 10) / 10
  if (last === null) {
    lines.push(
      'No receipt or spec activity timestamp exists, so there is no progress to measure from.',
    )
  } else {
    const ageH = Math.max(0, Math.round(((now - Date.parse(last)) / 3_600_000) * 10) / 10)
    lines.push(`Last recorded progress: ${last} (${ageH} h ago).`)
  }
  lines.push(
    `Heartbeat threshold: ${hours} h (${parcel.heartbeat.source === 'default' ? 'default' : 'goal override'}).`,
  )
  lines.push(`Liveness: ${parcel.liveness.live ? 'live' : 'not live'} — ${parcel.liveness.reason}.`)
  lines.push(
    `Rule ${parcel.rule} (hung): no earlier rule matched — the parcel is not failed, not complete, and not awaiting a gate — and progress is older than the threshold with no live worktree.`,
  )
  if (parcel.specLocation === 'done' && parcel.chainEvidence === 'absent' && !recordMarksClosed) {
    lines.push(
      'What is holding it back: the spec is in done/ but the queue item carries no closed marker (☑, SHIPPED, CLOSED or COMPLETE) and there is no receipt chain, so rule R2 (complete) cannot match. Marking the queue item ☑ SHIPPED + CLOSED would complete it.',
    )
  }
  lines.push(
    codes.length === 0
      ? 'No reconciliation discrepancy is asserted for this parcel.'
      : `Reconciliation: ${codes.join(', ')}.`,
  )
  return {
    lines,
    note: assessment.absence
      ? null
      : `Some sources are unavailable or incomplete (${assessment.limits.join('; ')}), so this cannot rule out that the work shipped (shipped-unrecorded) or is in an open PR.`,
  }
}

/**
 * What this run can and cannot honestly assert. `positive` findings (something
 * exists) need only the sources they name. `absence` findings (nothing exists)
 * need EVERY source complete: a failed git read, a truncated list, or an
 * unavailable remote is unknown, never "empty".
 */
export interface Assessment {
  readonly positive: boolean
  readonly absence: boolean
  readonly limits: readonly string[]
}

export function assess(repo: RepoFacts, prs: PrFacts): Assessment {
  const limits: string[] = []
  if (!prs.available) limits.push(`GitHub unavailable (${prs.reason ?? 'unknown reason'})`)
  if (prs.truncated) limits.push('the PR list hit its limit, so older PRs are not visible')
  if (repo.defaultRef === null) limits.push('no default branch was found')
  if (!repo.complete.worktrees) limits.push('the worktree listing failed')
  if (repo.defaultRef !== null) {
    if (!repo.complete.defaultLog) limits.push('reading the default branch log failed')
    if (!repo.complete.specs) limits.push('the specs listing on the default branch is unavailable')
    if (!repo.complete.merged) limits.push('branch merge state could not be read')
  }
  if (!repo.complete.branches) limits.push('the branch listing failed')
  if (repo.logTruncated)
    limits.push('the commit log hit its limit, so older commits are not visible')
  const positive = prs.available && repo.defaultRef !== null
  return { positive, absence: positive && limits.length === 0, limits }
}

export function reconcileGoal(input: ReconcileInput): Reconciliation[] {
  const { parcels, items, repo, prs, sessions, now } = input
  const itemText = new Map(items.map((item) => [item.key, item.text]))
  const keys = parcels.map((parcel) => parcel.parcel)
  const allKeys = [...new Set([...keys, ...(input.otherKeys ?? [])])]
  const keyIndex = makeKeyIndex(allKeys)
  const defaultBranch = repo.defaultRef === null ? null : repo.defaultRef.replace(/^origin\//, '')
  const assessment = assess(repo, prs)
  // `remoteAssessable` gates findings that assert something exists; `absenceAssessable`
  // gates findings that assert nothing exists.
  const remoteAssessable = assessment.positive
  const absenceAssessable = assessment.absence
  // Heads of merged PRs: a squash- or rebase-merged branch is never an ancestor of the
  // default branch, so ancestry alone would call every shipped branch "unmerged".
  // Identified by the EXACT tip the PR carried, not by name: a reused branch name with new
  // commits has a different tip and is genuinely unmerged. Only PRs into the default branch.
  const mergedTips = new Set(
    prs.prs
      .filter(
        (pr) =>
          pr.state === 'MERGED' &&
          pr.headRefOid !== '' &&
          (defaultBranch === null || pr.baseRefName === defaultBranch),
      )
      .map((pr) => pr.headRefOid),
  )
  const branchMerged = (sha: string, mergedIntoDefault: boolean): boolean =>
    mergedIntoDefault || (sha !== '' && mergedTips.has(sha))
  // Live console sessions by EXACT worktree path (never by key): a worktree linked to a
  // parcel through its branch name is still the same path.
  const livePathsAll = new Set(
    sessions
      .filter((session) => session.state === 'running' || session.state === 'launching')
      .map((session) => session.worktreePath),
  )
  // A remote spec file belongs to the LONGEST key that prefixes it (FOC-P1-B-x.md is
  // FOC-P1-B's, not FOC-P1's).
  const remoteSpecByKey = new Map<string, 'active' | 'done'>()
  const keysLongestFirst = [...allKeys].sort((a, b) => b.length - a.length)
  for (const file of repo.remoteSpecFiles) {
    const owner = keysLongestFirst.find((key) => file.name.startsWith(`${key}-`))
    if (owner !== undefined && !remoteSpecByKey.has(owner))
      remoteSpecByKey.set(owner, file.location)
  }

  const matchedKeys = (text: string): string[] => keyIndex(text)

  // ---- candidates, grouped by the keys each one matches
  const candidates: Candidate[] = []
  for (const branch of repo.branches) {
    candidates.push({
      text: branch.name,
      ref: {
        kind: branch.remote ? 'remote-branch' : 'branch',
        ref: branch.name,
        detail: branch.mergedIntoDefault
          ? 'fully contained in the default branch'
          : 'has commits not on the default branch',
        at: null,
      },
    })
  }
  for (const worktree of repo.worktrees) {
    if (worktree.path === repo.repoRoot) continue
    candidates.push({
      text: `${basename(worktree.path)} ${worktree.branch ?? ''}`,
      ref: {
        kind: 'worktree',
        ref: worktree.path,
        detail: worktree.branch === null ? 'detached HEAD' : `branch ${worktree.branch}`,
        at: null,
      },
    })
  }
  for (const pr of prs.prs) {
    candidates.push({
      text: `${pr.title} ${pr.headRefName}`,
      ref: {
        kind: 'pr',
        ref: `#${pr.number}`,
        detail: `${pr.state} — ${pr.title}`,
        at: pr.mergedAt ?? pr.closedAt ?? pr.createdAt,
      },
    })
  }
  for (const commit of repo.defaultLog) {
    candidates.push({
      text: commit.subject,
      ref: { kind: 'commit', ref: short(commit.sha), detail: commit.subject, at: commit.at },
    })
  }

  const linked = new Map<string, LinkedRef[]>(keys.map((key) => [key, []]))
  const ambiguous = new Map<string, LinkedRef[]>(keys.map((key) => [key, []]))
  for (const candidate of candidates) {
    const matched = matchedKeys(candidate.text)
    for (const key of matched) {
      ;(matched.length > 1 ? ambiguous : linked).get(key)?.push(candidate.ref)
    }
  }

  // Per-commit and per-session key matches are computed ONCE (not per parcel):
  // cost stays linear in total text, flat per parcel (AC8).
  const commitsByKey = new Map<string, CommitFact[]>()
  const anyCommitKeys = new Set<string>()
  for (const commit of repo.allLog) {
    const matched = matchedKeys(commit.subject)
    for (const key of matched) anyCommitKeys.add(key)
    if (matched.length === 1) {
      const key = matched[0] as string
      const list = commitsByKey.get(key) ?? []
      list.push(commit)
      commitsByKey.set(key, list)
    }
  }
  const sessionsByKey = new Map<string, SessionEvidence[]>()
  for (const session of sessions) {
    for (const key of matchedKeys(basename(session.worktreePath))) {
      const list = sessionsByKey.get(key) ?? []
      list.push(session)
      sessionsByKey.set(key, list)
    }
  }
  const stateMentions = new Map<string, string[]>()
  for (const line of input.stateLines ?? []) {
    for (const key of matchedKeys(expandRanges(line))) {
      const list = stateMentions.get(key) ?? []
      const plain = line.replace(/[*`]/g, '').replace(/^>\s*/, '').trim()
      list.push(plain.length > 220 ? `${plain.slice(0, 220)}…` : plain)
      stateMentions.set(key, list)
    }
  }
  const prByNumber = new Map(prs.prs.map((pr) => [`#${pr.number}`, pr]))
  const branchByName = new Map(repo.branches.map((branch) => [branch.name, branch]))

  return parcels.map((parcel): Reconciliation => {
    const key = parcel.parcel
    const mine = linked.get(key) ?? []
    const of = (kind: LinkedRef['kind']) => mine.filter((ref) => ref.kind === kind)
    const localBranches = of('branch')
    const remoteBranches = of('remote-branch')
    const worktrees = of('worktree')
    const prRefs = of('pr')
    const commits = of('commit')
    const text = itemText.get(key) ?? ''
    const recordMarksClosed = CLOSED_MARKER.test(text)
    const recordClosed = parcel.state === 'complete'
    // The record CLAIMS closure if the console says complete, the spec is in done/, or the item carries a closed marker.
    const recordClaimsClosed = recordClosed || parcel.specLocation === 'done' || recordMarksClosed
    const myPrs = prRefs
      .map((ref) => prByNumber.get(ref.ref))
      .filter((pr): pr is PrFact => pr !== undefined)
    const deliveryPrs = myPrs.filter((pr) => isDeliveryPr(pr, defaultBranch))
    const mergedPrs = myPrs.filter((pr) => pr.state === 'MERGED')
    const openPrs = myPrs.filter((pr) => pr.state === 'OPEN')
    const remoteSpec = ((): 'active' | 'done' | 'none' | 'unknown' => {
      if (repo.defaultRef === null || !repo.complete.specs) return 'unknown'
      return remoteSpecByKey.get(key) ?? 'none'
    })()
    // Ambiguous candidates might be this parcel's: they block any claim of absence.
    const ambiguousHere = (ambiguous.get(key) ?? []).length > 0

    const mySessions = sessionsByKey.get(key) ?? []
    const sessionRefs: LinkedRef[] = mySessions.map((session) => ({
      kind: 'session',
      ref: session.receiptId,
      detail: `${session.state} (worktree ${basename(session.worktreePath)})`,
      at: session.createdAt,
    }))
    const livePaths = livePathsAll

    const found: Discrepancy[] = []
    const make = (
      code: DiscrepancyCode,
      summary: string,
      evidence: string[],
      ctx: {
        pr?: string | null
        path?: string | null
        confidence?: 'asserted' | 'weak-traces'
      } = {},
    ) => {
      const loop = LOOP_DIRECTIVE_HINT
      const guide = optionsFor(code, {
        repo: repo.repoRoot,
        key,
        pr: ctx.pr ?? null,
        path: ctx.path ?? null,
        loop,
      })
      found.push({
        confidence: ctx.confidence ?? 'asserted',
        code,
        summary,
        evidence,
        question: guide.question,
        options: guide.options.map((option, index) => {
          const verb = OPTION_ACTS[code][index] ?? null
          const weak = ctx.confidence === 'weak-traces'
          const body = `Parcel: ${key}\nGoal: reconciliation follow-through\nCode: ${code}\nOption: ${option.answer}\nRecommendation: ${option.recommendation}\nEvidence: ${evidence.join('; ')}${weak ? '\nVerify; the work may have shipped under another identity.' : ''}`
          const marker = ' (shortened)'
          const instruction =
            body.length + 2 + SCOPE_FOOTER.length <= 2000
              ? `${body}\n\n${SCOPE_FOOTER}`
              : `${body.slice(0, 2000 - SCOPE_FOOTER.length - marker.length - 2)}${marker}\n\n${SCOPE_FOOTER}`
          return { ...option, act: verb ? { verb, instruction } : null }
        }),
      })
    }
    const asOf = prs.asOf ?? 'n/a'

    // 1. shipped-unrecorded — strong evidence only (merged feat/fix/perf/refactor PR into default).
    if (!recordClosed && remoteAssessable && deliveryPrs.length > 0) {
      const first = deliveryPrs[0] as PrFact
      make(
        'shipped-unrecorded',
        `A merged delivery-type PR names this parcel on ${defaultBranch ?? 'the default branch'}, but the record does not show it closed. Verify the PR delivered the whole parcel.`,
        [
          ...deliveryPrs.map((pr) => `PR #${pr.number} MERGED ${pr.mergedAt ?? '?'}: ${pr.title}`),
          `record: state ${parcel.state}, spec ${parcel.specLocation}, closed marker ${recordMarksClosed ? 'present' : 'absent'}`,
          `PR data as of ${asOf}`,
        ],
        { pr: String(first.number) },
      )
    }

    // 2. recorded-unshipped — only when the remote can be fully assessed AND shows no trace at all.
    const anyTrace =
      myPrs.length > 0 ||
      commits.length > 0 ||
      remoteBranches.length > 0 ||
      remoteSpec === 'active' ||
      remoteSpec === 'done' ||
      ambiguousHere
    if (recordClaimsClosed && absenceAssessable && !anyTrace) {
      make(
        'recorded-unshipped',
        'The record shows this parcel closed, but the remote shows no PR, commit, branch, or spec for it.',
        [
          `record: state ${parcel.state}, spec ${parcel.specLocation}, closed marker ${recordMarksClosed ? 'present' : 'absent'}`,
          `checked: PRs (as of ${asOf}), ${repo.defaultRef} log, remote branches, remote specs (as of ${repo.refsAsOf ?? 'never fetched'})`,
          'none link this parcel key',
        ],
      )
    }

    // 3. unmerged-work — open PR, or a linked branch/worktree with work not on the default branch.
    const unmergedEvidence: string[] = []
    let unmergedPath: string | null = null
    for (const pr of openPrs) unmergedEvidence.push(`PR #${pr.number} OPEN: ${pr.title}`)
    for (const ref of [...localBranches, ...remoteBranches]) {
      const branch = branchByName.get(ref.ref)
      if (
        branch !== undefined &&
        repo.complete.merged &&
        !branchMerged(branch.sha, branch.mergedIntoDefault) &&
        ref.ref !== defaultBranch &&
        ref.ref !== repo.defaultRef
      ) {
        unmergedEvidence.push(
          `${branch.remote ? 'remote branch' : 'branch'} ${ref.ref}: ${ref.detail}`,
        )
      }
    }
    for (const wt of worktrees) {
      const outcome = input.worktreeOutcome(wt.ref)
      if (outcome.worktree !== 'present') continue
      if ((outcome.commitsAhead ?? 0) > 0 || (outcome.dirtyFiles ?? 0) > 0) {
        unmergedPath = wt.ref
        unmergedEvidence.push(
          `worktree ${basename(wt.ref)}: ${plural(outcome.commitsAhead ?? 0, 'commit')} ahead, ${plural(outcome.dirtyFiles ?? 0, 'changed file')}`,
        )
      }
    }
    if (unmergedEvidence.length > 0) {
      make(
        'unmerged-work',
        'Work for this parcel exists that is not on the default branch.',
        unmergedEvidence,
        { path: unmergedPath },
      )
    }

    // 4. orphan-worktree — linked, clean, no unique commits, no live pane.
    for (const wt of worktrees) {
      const outcome = input.worktreeOutcome(wt.ref)
      if (outcome.worktree !== 'present' || livePaths.has(wt.ref)) continue
      if (outcome.commitsAhead === 0 && outcome.dirtyFiles === 0) {
        make(
          'orphan-worktree',
          'A worktree exists for this parcel with no live console-launched session, no commits and no changes.',
          [
            `worktree ${wt.ref}`,
            `${wt.detail}`,
            '0 commits ahead of the default branch, 0 changed files, no live console-launched session (sessions started outside the console are not visible)',
          ],
          { path: wt.ref },
        )
      }
    }

    // 5. never-started — remote fully assessable and every source empty.
    const mentions = stateMentions.get(key) ?? []
    const anyLocal =
      localBranches.length + worktrees.length + mySessions.length + mentions.length > 0 ||
      ambiguousHere
    const allLogHit = anyCommitKeys.has(key)
    if (
      !recordClosed &&
      absenceAssessable &&
      parcel.specLocation === 'none' &&
      parcel.chainEvidence === 'absent' &&
      !anyLocal &&
      !anyTrace &&
      myPrs.length === 0 &&
      !allLogHit
    ) {
      make('never-started', 'Nothing shows this parcel was ever started.', [
        `checked: spec (none), receipt chain (absent), local branches, worktrees, sessions, PRs (as of ${asOf}), commit subjects, remote branches and specs (as of ${repo.refsAsOf ?? 'never fetched'})`,
        'none link this parcel key',
      ])
    }

    // 6. local-remote-divergence — linked branch vs its upstream, or spec location local vs remote.
    const divergence: string[] = []
    for (const ref of localBranches) {
      const branch = branchByName.get(ref.ref)
      if (branch === undefined || branch.upstream === null) continue
      if (branch.upstreamGone) {
        // A pruned upstream after a squash-merge is the normal end of a shipped branch.
        if (!branchMerged(branch.sha, false))
          divergence.push(`branch ${ref.ref}: upstream ${branch.upstream} is gone`)
      } else if ((branch.aheadOfUpstream ?? 0) > 0 || (branch.behindUpstream ?? 0) > 0) {
        divergence.push(
          `branch ${ref.ref} vs ${branch.upstream}: ${branch.aheadOfUpstream ?? 0} ahead, ${branch.behindUpstream ?? 0} behind`,
        )
      }
    }
    // Only comparable when the checked-out branch IS the default branch: a feature-branch
    // or worktree checkout legitimately differs from the default branch for every new spec.
    if (
      remoteSpec !== 'unknown' &&
      parcel.specLocation !== 'none' &&
      remoteSpec !== parcel.specLocation &&
      repo.currentBranch === defaultBranch
    ) {
      divergence.push(
        `spec: local (${repo.currentBranch ?? 'detached HEAD'}) has it in ${parcel.specLocation}/, ${repo.defaultRef} has it ${remoteSpec === 'none' ? 'absent' : `in ${remoteSpec}/`} (remote as of ${repo.refsAsOf ?? 'never fetched'})`,
      )
    }
    if (divergence.length > 0)
      make('local-remote-divergence', 'Local and remote disagree about this parcel.', divergence)

    // 7. stale-abandoned — hung or not-started (FCA-P10), remote fully assessable, and nothing above applies.
    if (
      (parcel.state === 'hung' || parcel.state === 'not-started') &&
      absenceAssessable &&
      found.length === 0
    ) {
      const traces = [
        ...(commits.length > 0
          ? [`${plural(commits.length, 'commit')} on ${repo.defaultRef} name the key (weak trace)`]
          : []),
        ...(mergedPrs.length > 0
          ? mergedPrs.map(
              (pr) =>
                `PR #${pr.number} MERGED but not delivery evidence (title type ${titleType(pr.title) ?? 'untyped'}): ${pr.title}`,
            )
          : []),
        ...(remoteSpec === 'active' || remoteSpec === 'done'
          ? [`spec is on ${repo.defaultRef} in ${remoteSpec}/ (weak trace)`]
          : []),
        ...(stateMentions.get(key) ?? []).map(
          (line) => `goal state line mentions it (local record claim): ${line}`,
        ),
        ...(ambiguous.get(key) ?? []).map(
          (ref) =>
            `ambiguous link not used (it also matches another parcel key): ${ref.kind} ${ref.ref} — ${ref.detail}`,
        ),
      ]
      make(
        'stale-abandoned',
        traces.length > 0
          ? 'No delivery evidence is linked, but weak traces exist. Verify before closing: the work may have shipped under another identity.'
          : 'Nothing links this parcel to delivered or in-flight work.',
        [
          'no merged delivery PR, open PR, unmerged branch, or live worktree is linked',
          ...(traces.length > 0 ? traces : ['no weak traces either']),
        ],
        { confidence: traces.length > 0 ? 'weak-traces' : 'asserted' },
      )
    }

    // ---- history
    const history: HistoryEvent[] = []
    for (const member of parcel.chain?.members ?? []) {
      history.push({
        at: member.timestamp,
        source: 'receipt',
        kind: `stage ${member.stage}`,
        label: `Stage ${member.stage} receipt #${member.sequence} (${member.subjectKind})`,
        ref: member.locator,
      })
    }
    for (const commit of commitsByKey.get(key) ?? []) {
      history.push({
        at: commit.at,
        source: 'commit',
        kind: 'commit',
        label: commit.subject,
        ref: short(commit.sha),
      })
    }
    for (const pr of myPrs) {
      history.push({
        at: pr.createdAt,
        source: 'pr',
        kind: 'opened',
        label: `PR #${pr.number} opened: ${pr.title}`,
        ref: pr.url,
      })
      if (pr.mergedAt !== null)
        history.push({
          at: pr.mergedAt,
          source: 'pr',
          kind: 'merged',
          label: `PR #${pr.number} merged`,
          ref: pr.url,
        })
      else if (pr.closedAt !== null)
        history.push({
          at: pr.closedAt,
          source: 'pr',
          kind: 'closed',
          label: `PR #${pr.number} closed unmerged`,
          ref: pr.url,
        })
    }
    for (const session of mySessions) {
      history.push({
        at: session.createdAt,
        source: 'session',
        kind: 'launched',
        label: `Session ${session.receiptId} launched`,
        ref: session.receiptId,
      })
      if (session.exitAt !== null)
        history.push({
          at: session.exitAt,
          source: 'session',
          kind: 'exited',
          label: `Session ${session.receiptId} ${session.state}`,
          ref: session.receiptId,
        })
    }
    // Newest first; events with no usable timestamp sort last (a total order, so the
    // sort is stable even with nulls or unparseable strings).
    const stamp = (at: string | null): number => {
      const value = at === null ? Number.NaN : Date.parse(at)
      return Number.isNaN(value) ? Number.NEGATIVE_INFINITY : value
    }
    history.sort((a, b) => {
      const [x, y] = [stamp(a.at), stamp(b.at)]
      return x === y ? 0 : y > x ? 1 : -1
    })
    const absent: string[] = []
    if (!history.some((event) => event.source === 'receipt')) absent.push('receipts')
    if (!history.some((event) => event.source === 'commit')) absent.push('commits')
    if (!prs.available) absent.push(`PRs (unavailable: ${prs.reason ?? 'unknown'})`)
    else if (!history.some((event) => event.source === 'pr')) absent.push('PRs')
    if (!history.some((event) => event.source === 'session')) absent.push('sessions')

    const codes = found.map((entry) => entry.code)
    return {
      parcel: key,
      local: {
        specLocation: parcel.specLocation,
        recordMarksClosed,
        chainSealed: parcel.chain === null ? null : parcel.chain.sealed,
        checkedOutBranch: repo.currentBranch,
        branches: localBranches,
        worktrees,
        sessions: sessionRefs,
        stateMentions: stateMentions.get(key) ?? [],
      },
      remote: {
        prs: { available: prs.available, reason: prs.reason, asOf: prs.asOf },
        refs: {
          available: repo.defaultRef !== null,
          defaultRef: repo.defaultRef,
          asOf: repo.refsAsOf,
        },
        specLocation: remoteSpec,
        mergedPrs: mergedPrs.map((pr) => ({
          kind: 'pr',
          ref: `#${pr.number}`,
          detail: `${titleType(pr.title) ?? 'untyped'} — ${pr.title}`,
          at: pr.mergedAt,
        })),
        otherPrs: myPrs
          .filter((pr) => pr.state !== 'MERGED')
          .map((pr) => ({
            kind: 'pr',
            ref: `#${pr.number}`,
            detail: `${pr.state} — ${pr.title}`,
            at: pr.closedAt ?? pr.createdAt,
          })),
        commits,
        branches: remoteBranches,
      },
      ambiguous: ambiguous.get(key) ?? [],
      discrepancies: found,
      history: history.slice(0, HISTORY_CAP),
      historyTotal: history.length,
      absentSources: absent,
      hung:
        parcel.state === 'hung'
          ? hungExplanation(parcel, codes, assessment, recordMarksClosed, now)
          : null,
    }
  })
}
