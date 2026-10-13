import { basename } from 'node:path'
import { type ConsoleConfig, goalTrees, treeConfigFor } from './config.js'
import {
  ANNOTATION_CAP_PER_PR,
  ANNOTATION_CAP_PER_REQUEST,
  type AnnotationFact,
  type ChecksSummary,
  gatherAnnotation,
  gatherOpenPrs,
  type OpenPr,
  type OpenPrFacts,
} from './decisions-remote.js'
import { defaultGitRunner, type GitRunner } from './ledger-git.js'
import { projectGoal } from './project.js'
import type { GhRunner } from './reconcile-remote.js'
import { listGoalSlugs } from './scan.js'

/**
 * FCA-P9 decisions queue: every human gate act that is waiting, with its
 * evidence. It PRESENTS facts and (in later stages) a command; it never
 * performs a gate act, never calls a mutating `gh` verb, and never says a PR
 * is "ready". Gate state comes from the existing frozen projection (R3, gate
 * proxies); this module derives nothing about parcel state and reads no
 * reconciliation output (charter D3/D5, OQ5).
 */

export interface MergeCause {
  /** `billing-blocked` only when an annotation proves it; `none` = nothing failing to explain. */
  readonly code: 'billing-blocked' | 'failed-unknown' | 'none'
  /** The annotation text, verbatim, when it proves billing. */
  readonly annotation: string | null
  readonly asOf: string | null
  /** A cap stopped some failing checks from being examined. */
  readonly capped: boolean
  readonly note: string | null
}

export interface MergeItem {
  readonly kind: 'merge'
  readonly id: string
  readonly repoRoot: string
  readonly number: number
  readonly title: string
  readonly url: string
  readonly headRef: string
  readonly headSha: string
  readonly baseRef: string
  readonly isDraft: boolean
  readonly mergeable: string
  readonly mergeStateStatus: string
  readonly reviewDecision: string
  readonly reviews: OpenPr['reviews']
  readonly checks: ChecksSummary
  readonly cause: MergeCause
  readonly stack: {
    /** null when the repository's default branch could not be determined. */
    readonly baseIsDefault: boolean | null
    readonly waitsOn: number | null
  }
  readonly createdAt: string
  readonly asOf: string | null
  readonly command: CommandPresentation | null
}

export interface GateItem {
  readonly kind: 'gate'
  readonly id: string
  readonly gate: 'G1' | 'G2'
  readonly repoRoot: string
  readonly goal: string
  readonly parcel: string
  readonly rule: string
  readonly tipStage: string | null
  readonly specRef: string | null
  readonly chainLocator: string | null
  /** The gate proxy detail, verbatim. */
  readonly evidence: string
  /** Approval slug when the projected artifact names one; null when it cannot be derived. */
  readonly slug: string | null
  readonly asOf: string
  readonly command: CommandPresentation | null
}

export interface GoalRatificationItem {
  readonly kind: 'goal-ratification'
  readonly id: string
  readonly repoRoot: string
  readonly goal: string
  readonly status: 'pending' | 'unknown'
  readonly detail: string
  /** Charter exit criterion 4: no console capture path exists, and none is invented. */
  readonly note: string
  readonly asOf: string
}

export interface CommandPresentation {
  readonly flow: string
  readonly argv: readonly string[]
  readonly text: string
}

export type DecisionItem = MergeItem | GateItem | GoalRatificationItem

export interface RepoDecisions {
  readonly repoRoot: string
  readonly defaultBranch: string | null
  readonly remote: {
    readonly available: boolean
    readonly reason: string | null
    readonly asOf: string | null
    readonly stale: boolean
    readonly truncated: boolean
  }
  readonly actions: {
    readonly state: 'not-starting' | 'no-evidence' | 'unknown'
    readonly evidence: readonly string[]
    readonly asOf: string | null
  }
}

export interface DecisionsResponse {
  readonly generatedAt: string
  readonly repos: readonly RepoDecisions[]
  readonly assessment: { readonly complete: boolean; readonly limits: readonly string[] }
  readonly counts: {
    readonly merge: number
    readonly G1: number
    readonly G2: number
    readonly goalRatification: number
  }
  readonly items: readonly DecisionItem[]
}

export interface DecisionsOptions {
  readonly repo?: string | null
  readonly gh?: GhRunner
  readonly git?: GitRunner
  readonly ttlMs?: number
}

export interface AnnotationBudget {
  readonly perPr: number
  readonly perRequest: number
  used: number
}

interface ComposeInput {
  readonly repoRoot: string
  readonly prs: OpenPrFacts
  readonly defaultBranch: string | null
  readonly annotate: (checkRunId: number) => AnnotationFact | null
  readonly now: number
  readonly budget: AnnotationBudget
}

function causeOf(pr: OpenPr, input: ComposeInput): MergeCause {
  if (pr.checks.state !== 'failed') {
    return { code: 'none', annotation: null, asOf: null, capped: false, note: null }
  }
  const notes: string[] = []
  let capped = false
  let looked = 0
  for (const failing of pr.checks.failing) {
    if (failing.checkRunId === null) {
      notes.push(`${failing.name}: no check-run id, annotation not checked`)
      continue
    }
    if (looked >= input.budget.perPr || input.budget.used >= input.budget.perRequest) {
      capped = true
      continue
    }
    looked += 1
    input.budget.used += 1
    const fact = input.annotate(failing.checkRunId)
    if (fact === null) {
      notes.push(`${failing.name}: annotation not checked`)
      continue
    }
    if (!fact.available) {
      notes.push(`${failing.name}: annotation unavailable (${fact.reason ?? 'unknown'})`)
      continue
    }
    if (fact.billing) {
      return {
        code: 'billing-blocked',
        annotation: fact.messages.find((message) => message !== '') ?? null,
        asOf: fact.asOf,
        capped,
        note: null,
      }
    }
  }
  if (capped) notes.push('annotation cap reached: some failing checks were not examined')
  return {
    code: 'failed-unknown',
    annotation: null,
    asOf: null,
    capped,
    note: notes.length === 0 ? null : notes.join('; '),
  }
}

/** Stack depth: how many open PRs must merge before this one (cycle-safe). */
function depthOf(pr: OpenPr, byHead: ReadonlyMap<string, OpenPr>): number {
  let depth = 0
  const seen = new Set<number>([pr.number])
  let cursor: OpenPr | undefined = byHead.get(pr.baseRefName)
  while (cursor !== undefined && !seen.has(cursor.number)) {
    seen.add(cursor.number)
    depth += 1
    cursor = byHead.get(cursor.baseRefName)
  }
  return depth
}

export function composeMergeItems(input: ComposeInput): {
  readonly items: MergeItem[]
  readonly actions: RepoDecisions['actions']
} {
  const { prs, repoRoot, defaultBranch } = input
  const byHead = new Map<string, OpenPr>()
  for (const pr of prs.prs) if (!byHead.has(pr.headRefName)) byHead.set(pr.headRefName, pr)
  const ordered = [...prs.prs]
    .map((pr) => ({ pr, depth: depthOf(pr, byHead) }))
    .sort(
      (a, b) =>
        a.depth - b.depth ||
        a.pr.createdAt.localeCompare(b.pr.createdAt) ||
        a.pr.number - b.pr.number,
    )
  const evidence: string[] = []
  let actionsAsOf: string | null = null
  const items: MergeItem[] = ordered.map(({ pr }) => {
    const baseIsDefault = defaultBranch === null ? null : pr.baseRefName === defaultBranch
    const base = baseIsDefault === false ? byHead.get(pr.baseRefName) : undefined
    const cause = causeOf(pr, input)
    if (cause.code === 'billing-blocked') {
      evidence.push(`#${pr.number}: ${cause.annotation ?? ''}`)
      actionsAsOf = cause.asOf ?? actionsAsOf
    }
    return {
      kind: 'merge',
      id: `merge:${repoRoot}#${pr.number}`,
      repoRoot,
      number: pr.number,
      title: pr.title,
      url: pr.url,
      headRef: pr.headRefName,
      headSha: pr.headRefOid,
      baseRef: pr.baseRefName,
      isDraft: pr.isDraft,
      mergeable: pr.mergeable,
      mergeStateStatus: pr.mergeStateStatus,
      reviewDecision: pr.reviewDecision,
      reviews: pr.reviews,
      checks: pr.checks,
      cause,
      stack: { baseIsDefault, waitsOn: base === undefined ? null : base.number },
      createdAt: pr.createdAt,
      asOf: prs.asOf,
      command: null,
    }
  })
  const actions: RepoDecisions['actions'] =
    evidence.length > 0
      ? { state: 'not-starting', evidence, asOf: actionsAsOf }
      : { state: prs.available ? 'no-evidence' : 'unknown', evidence: [], asOf: prs.asOf }
  return { items, actions }
}

const PROJECTED_SUFFIX = '.projected.shaping-result.json'

function slugOf(evidence: string | null): string | null {
  if (evidence === null) return null
  const name = basename(evidence)
  if (!name.endsWith(PROJECTED_SUFFIX)) return null
  const slug = name.slice(0, name.length - PROJECTED_SUFFIX.length)
  return /^[a-z0-9-]+$/.test(slug) ? slug : null
}

function defaultBranchOf(root: string, git: GitRunner): string | null {
  const ref = git(root, ['symbolic-ref', '--short', 'refs/remotes/origin/HEAD'])
  if (ref === null || ref.trim() === '') return null
  return ref.trim().replace(/^origin\//, '')
}

export function buildDecisions(
  config: ConsoleConfig,
  now: number,
  options: DecisionsOptions = {},
): DecisionsResponse {
  const generatedAt = new Date(now).toISOString()
  const git = options.git ?? defaultGitRunner
  const items: DecisionItem[] = []
  const repos: RepoDecisions[] = []
  const limits: string[] = []
  const budget: AnnotationBudget = {
    perPr: ANNOTATION_CAP_PER_PR,
    perRequest: ANNOTATION_CAP_PER_REQUEST,
    used: 0,
  }
  let complete = true
  const seenRoots = new Set<string>()
  for (const tree of goalTrees(config)) {
    if (seenRoots.has(tree.root)) continue
    seenRoots.add(tree.root)
    if (options.repo !== undefined && options.repo !== null && options.repo !== tree.root) continue
    const treeConfig = treeConfigFor(config, tree)

    // Remote: one batched list per repo; annotations only for failing checks, capped.
    const defaultBranch = defaultBranchOf(tree.root, git)
    const ghOptions = { run: options.gh, ttlMs: options.ttlMs }
    const prs = gatherOpenPrs(tree.root, now, ghOptions)
    const merged = composeMergeItems({
      repoRoot: tree.root,
      prs,
      defaultBranch,
      annotate: (id) => gatherAnnotation(tree.root, id, now, ghOptions),
      now,
      budget,
    })
    items.push(...merged.items)
    repos.push({
      repoRoot: tree.root,
      defaultBranch,
      remote: {
        available: prs.available,
        reason: prs.reason,
        asOf: prs.asOf,
        stale: prs.stale,
        truncated: prs.truncated,
      },
      actions: merged.actions,
    })
    if (!prs.available) {
      complete = false
      limits.push(`${tree.root}: pull requests unavailable (${prs.reason ?? 'unknown'})`)
    }
    if (prs.stale) {
      complete = false
      limits.push(`${tree.root}: pull requests are earlier facts (refresh failed)`)
    }
    if (prs.truncated) {
      complete = false
      limits.push(`${tree.root}: open PR list reached its limit; further PRs are not shown`)
    }

    // Local: R3 gate state straight from the frozen projection.
    for (const slug of listGoalSlugs(treeConfig)) {
      const key = tree.key === null ? slug : `${tree.key}.${slug}`
      const projection = projectGoal(treeConfig, slug, now, key, tree.treeRef)
      if (projection === null) continue
      const ratification = projection.goal.ratification
      if (ratification.status === 'pending' || ratification.status === 'unknown') {
        items.push({
          kind: 'goal-ratification',
          id: `goal-ratification:${tree.root}:${key}`,
          repoRoot: tree.root,
          goal: key,
          status: ratification.status,
          detail: ratification.detail,
          note: 'Charter Gate 1 has no console capture path (charter exit criterion 4); this is state only.',
          asOf: generatedAt,
        })
      }
      for (const parcel of projection.parcels) {
        if (parcel.state !== 'awaiting-gate' || parcel.rule !== 'R3') continue
        const gate =
          parcel.gates.G1.status === 'pending'
            ? 'G1'
            : parcel.gates.G2.status === 'pending'
              ? 'G2'
              : null
        if (gate === null) continue // tip E: Gate 3, served by the pull-request list
        const proxy = parcel.gates[gate]
        items.push({
          kind: 'gate',
          id: `gate:${gate}:${tree.root}:${key}:${parcel.parcel}`,
          gate,
          repoRoot: tree.root,
          goal: key,
          parcel: parcel.parcel,
          rule: parcel.rule,
          tipStage: parcel.chain?.tipStage ?? null,
          specRef: parcel.specRef,
          chainLocator: parcel.chain?.locator ?? null,
          evidence: proxy.detail,
          slug: slugOf(parcel.gates.G1.evidence),
          asOf: generatedAt,
          command: null,
        })
      }
    }
  }
  return {
    generatedAt,
    repos,
    assessment: { complete, limits },
    counts: {
      merge: items.filter((item) => item.kind === 'merge').length,
      G1: items.filter((item) => item.kind === 'gate' && item.gate === 'G1').length,
      G2: items.filter((item) => item.kind === 'gate' && item.gate === 'G2').length,
      goalRatification: items.filter((item) => item.kind === 'goal-ratification').length,
    },
    items,
  }
}
