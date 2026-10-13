import { isRecord } from './guards.js'
import {
  DEFAULT_TTL_MS,
  defaultGhRunner,
  FAILURE_TTL_MS,
  type GhRunner,
} from './reconcile-remote.js'

/**
 * FCA-P9 remote facts for the decisions queue: open pull requests with their
 * checks, reviews and mergeability, and the check-run annotation that proves
 * (or does not) that Actions jobs are not starting for billing reasons.
 *
 * Read-only by construction: every `gh` argv passes `assertReadOnlyGh`, an
 * allowlist of exactly `pr list`, `pr view` and a GET of one check-run's
 * annotations. Remote state is never inferred; a failure yields `available:
 * false` with a reason, or - when an earlier read succeeded - the old facts
 * labelled with their OLD age and `stale: true`. Nothing here merges, edits,
 * reviews, comments or fetches (charter D2; capability map A5).
 */

const PR_LIST_FLAGS = new Set(['--state', '--limit', '--json'])
const PR_VIEW_FLAGS = new Set(['--json'])
const STATE_VALUES = new Set(['open', 'closed', 'merged', 'all'])
const JSON_FIELDS = /^[A-Za-z]+(?:,[A-Za-z]+)*$/
const ANNOTATION_PATH = /^repos\/\{owner\}\/\{repo\}\/check-runs\/[1-9][0-9]{0,17}\/annotations$/

/** Throws unless `args` is one of the three read-only shapes this module may run. */
export function assertReadOnlyGh(args: readonly string[]): void {
  const refuse = (why: string): Error =>
    new Error(`gh argv refused (${why}): ${JSON.stringify(args)}`)
  const [cmd, sub] = args
  if (cmd === 'api') {
    if (args.length === 2 && ANNOTATION_PATH.test(args[1] ?? '')) return
    throw refuse('only a GET of one check-run annotation list is allowed')
  }
  if (cmd === 'pr' && (sub === 'list' || sub === 'view')) {
    const allowed = sub === 'list' ? PR_LIST_FLAGS : PR_VIEW_FLAGS
    let i = 2
    if (sub === 'view') {
      if (!/^[1-9][0-9]{0,6}$/.test(args[2] ?? '')) throw refuse('pr view needs a PR number')
      i = 3
    }
    while (i < args.length) {
      const flag = args[i] ?? ''
      const value = args[i + 1]
      if (!allowed.has(flag) || value === undefined) throw refuse(`flag ${flag}`)
      if (flag === '--state' && !STATE_VALUES.has(value)) throw refuse('state value')
      if (flag === '--limit' && !/^[1-9][0-9]{0,4}$/.test(value)) throw refuse('limit value')
      if (flag === '--json' && !JSON_FIELDS.test(value)) throw refuse('json fields')
      i += 2
    }
    return
  }
  throw refuse('subcommand not on the read-only allowlist')
}

/** Wrap a runner so a disallowed argv is refused before anything is spawned. */
export function guardedGh(run: GhRunner): GhRunner {
  return (cwd, args) => {
    assertReadOnlyGh(args)
    return run(cwd, args)
  }
}

// --------------------------------------------------------------- annotations

/**
 * GitHub's wording when a job is refused for billing. Matched on substrings so
 * trailing text may change; pinned by a fixture of the real annotation.
 */
export const BILLING_TEXTS: readonly string[] = [
  'recent account payments have failed',
  'spending limit needs to be increased',
]

export function isBillingMessage(message: string): boolean {
  const lower = message.toLowerCase()
  return BILLING_TEXTS.some((text) => lower.includes(text))
}

/** `/job/<id>` in a check's details URL is the check-run id; anything else is unknown. */
export function checkRunIdOf(detailsUrl: unknown): number | null {
  if (typeof detailsUrl !== 'string') return null
  const match = /\/job\/([1-9][0-9]{0,17})(?:[/?#]|$)/.exec(detailsUrl)
  if (match === null) return null
  const id = Number(match[1])
  return Number.isSafeInteger(id) ? id : null
}

// ---------------------------------------------------------------------- checks

export interface FailingCheck {
  readonly name: string
  readonly conclusion: string
  readonly url: string
  readonly checkRunId: number | null
}

export interface ChecksSummary {
  readonly state: 'none' | 'passed' | 'failed' | 'pending' | 'unknown'
  readonly passed: number
  readonly failed: number
  readonly pending: number
  /** Entries whose shape was not recognised: never counted as passing. */
  readonly unrecognised: number
  readonly failing: readonly FailingCheck[]
}

const PASS_CONCLUSIONS = new Set(['SUCCESS', 'NEUTRAL', 'SKIPPED'])

function str(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

export function summariseChecks(rollup: unknown): ChecksSummary {
  const entries = Array.isArray(rollup) ? rollup : []
  let passed = 0
  let failed = 0
  let pending = 0
  let unrecognised = 0
  const failing: FailingCheck[] = []
  for (const entry of entries) {
    if (!isRecord(entry)) {
      unrecognised += 1
      continue
    }
    if (entry.__typename === 'CheckRun') {
      const status = str(entry.status)
      const conclusion = str(entry.conclusion)
      if (status !== 'COMPLETED') pending += 1
      else if (PASS_CONCLUSIONS.has(conclusion)) passed += 1
      else {
        failed += 1
        failing.push({
          name: str(entry.name),
          conclusion: conclusion === '' ? 'UNKNOWN' : conclusion,
          url: str(entry.detailsUrl),
          checkRunId: checkRunIdOf(entry.detailsUrl),
        })
      }
    } else if (entry.__typename === 'StatusContext') {
      const state = str(entry.state)
      if (state === 'SUCCESS') passed += 1
      else if (state === 'PENDING' || state === 'EXPECTED') pending += 1
      else if (state === 'FAILURE' || state === 'ERROR') {
        failed += 1
        failing.push({
          name: str(entry.context),
          conclusion: state,
          url: str(entry.targetUrl),
          checkRunId: null,
        })
      } else unrecognised += 1
    } else unrecognised += 1
  }
  const state: ChecksSummary['state'] =
    entries.length === 0
      ? 'none'
      : failed > 0
        ? 'failed'
        : pending > 0
          ? 'pending'
          : unrecognised > 0
            ? 'unknown'
            : 'passed'
  return { state, passed, failed, pending, unrecognised, failing }
}

// ------------------------------------------------------------------------ PRs

export interface OpenPr {
  readonly number: number
  readonly title: string
  readonly url: string
  readonly headRefName: string
  readonly headRefOid: string
  readonly baseRefName: string
  readonly isDraft: boolean
  /** Verbatim from GitHub: MERGEABLE | CONFLICTING | UNKNOWN. Never upgraded. */
  readonly mergeable: string
  /** Verbatim: BLOCKED | BEHIND | CLEAN | DIRTY | DRAFT | HAS_HOOKS | UNSTABLE | UNKNOWN. */
  readonly mergeStateStatus: string
  /** Verbatim: APPROVED | CHANGES_REQUESTED | REVIEW_REQUIRED | '' (none required). */
  readonly reviewDecision: string
  readonly reviews: {
    readonly approved: number
    readonly changesRequested: number
    readonly commented: number
    readonly total: number
  }
  readonly checks: ChecksSummary
  readonly createdAt: string
  readonly updatedAt: string
}

export interface OpenPrFacts {
  readonly available: boolean
  readonly reason: string | null
  readonly asOf: string | null
  /** True when a refresh failed and these are earlier facts, labelled with their own age. */
  readonly stale: boolean
  readonly prs: readonly OpenPr[]
  /** The list limit was reached: further open PRs are not in `prs`. */
  readonly truncated: boolean
}

export const OPEN_PR_LIMIT = 200
const PR_FIELDS =
  'number,title,url,headRefName,headRefOid,baseRefName,isDraft,mergeable,mergeStateStatus,reviewDecision,latestReviews,statusCheckRollup,createdAt,updatedAt'

export function parseOpenPrs(raw: string): OpenPr[] | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  if (!Array.isArray(parsed)) return null
  const prs: OpenPr[] = []
  for (const entry of parsed) {
    if (!isRecord(entry) || typeof entry.number !== 'number') return null
    const latest = Array.isArray(entry.latestReviews) ? entry.latestReviews : []
    let approved = 0
    let changesRequested = 0
    let commented = 0
    for (const review of latest) {
      if (!isRecord(review)) continue
      if (review.state === 'APPROVED') approved += 1
      else if (review.state === 'CHANGES_REQUESTED') changesRequested += 1
      else if (review.state === 'COMMENTED') commented += 1
    }
    prs.push({
      number: entry.number,
      title: str(entry.title),
      url: str(entry.url),
      headRefName: str(entry.headRefName),
      headRefOid: str(entry.headRefOid),
      baseRefName: str(entry.baseRefName),
      isDraft: entry.isDraft === true,
      mergeable: str(entry.mergeable) || 'UNKNOWN',
      mergeStateStatus: str(entry.mergeStateStatus) || 'UNKNOWN',
      reviewDecision: str(entry.reviewDecision),
      reviews: { approved, changesRequested, commented, total: latest.length },
      checks: summariseChecks(entry.statusCheckRollup),
      createdAt: str(entry.createdAt),
      updatedAt: str(entry.updatedAt),
    })
  }
  return prs
}

export interface RemoteOptions {
  readonly run?: GhRunner
  /** Cache window; 0 disables caching (tests). */
  readonly ttlMs?: number
}

function reasonOf(error: unknown): string {
  const e = error as { code?: string; stderr?: Buffer | string; message?: string }
  if (e.code === 'ENOENT') return 'gh is not installed'
  const stderr = e.stderr === undefined ? '' : (String(e.stderr).trim().split('\n')[0] ?? '')
  return stderr !== '' ? stderr : ((e.message ?? 'gh failed').split('\n')[0] ?? 'gh failed')
}

interface PrCacheEntry {
  readonly at: number
  readonly facts: OpenPrFacts
}

const prCache = new Map<string, PrCacheEntry>()
/** Last successful read per repo, kept so a failed refresh can show it with its own age. */
const lastGood = new Map<string, OpenPrFacts>()

export function gatherOpenPrs(
  repoRoot: string,
  now: number,
  options: RemoteOptions = {},
): OpenPrFacts {
  const ttl = options.ttlMs ?? DEFAULT_TTL_MS
  const hit = prCache.get(repoRoot)
  if (
    hit !== undefined &&
    ttl > 0 &&
    now - hit.at < (hit.facts.available && !hit.facts.stale ? ttl : Math.max(ttl, FAILURE_TTL_MS))
  ) {
    return hit.facts
  }
  const run = guardedGh(options.run ?? defaultGhRunner)
  let facts: OpenPrFacts
  try {
    const prs = parseOpenPrs(
      run(repoRoot, [
        'pr',
        'list',
        '--state',
        'open',
        '--limit',
        String(OPEN_PR_LIMIT),
        '--json',
        PR_FIELDS,
      ]),
    )
    if (prs === null) throw new Error('gh returned unparseable output')
    facts = {
      available: true,
      reason: null,
      asOf: new Date(now).toISOString(),
      stale: false,
      prs,
      truncated: prs.length >= OPEN_PR_LIMIT,
    }
    lastGood.set(repoRoot, facts)
  } catch (error) {
    const reason = reasonOf(error)
    const previous = lastGood.get(repoRoot)
    // Keep earlier facts under their OLD timestamp; never refresh `asOf` on failure.
    facts =
      previous === undefined
        ? { available: false, reason, asOf: null, stale: false, prs: [], truncated: false }
        : { ...previous, reason, stale: true }
  }
  if (ttl > 0) prCache.set(repoRoot, { at: now, facts })
  return facts
}

// ------------------------------------------------------------------ annotation

export interface AnnotationFact {
  readonly checkRunId: number
  readonly available: boolean
  readonly reason: string | null
  readonly asOf: string | null
  readonly messages: readonly string[]
  /** True only when an annotation message matches GitHub's billing wording. */
  readonly billing: boolean
}

/** Bounds the per-run cache: the oldest entry is evicted first. */
export const ANNOTATION_CACHE_MAX = 500
export const ANNOTATION_CAP_PER_PR = 5
export const ANNOTATION_CAP_PER_REQUEST = 20

const annotationCache = new Map<string, { at: number; fact: AnnotationFact }>()

export function clearDecisionCaches(): void {
  prCache.clear()
  lastGood.clear()
  annotationCache.clear()
}

export function gatherAnnotation(
  repoRoot: string,
  checkRunId: number,
  now: number,
  options: RemoteOptions = {},
): AnnotationFact {
  const key = `${repoRoot}\u0000${checkRunId}`
  const hit = annotationCache.get(key)
  // A completed check run is immutable, so a successful read never expires; a
  // failed read is retried after the failure window.
  if (hit !== undefined && (hit.fact.available || now - hit.at < FAILURE_TTL_MS)) return hit.fact
  const run = guardedGh(options.run ?? defaultGhRunner)
  let fact: AnnotationFact
  try {
    const raw = run(repoRoot, ['api', `repos/{owner}/{repo}/check-runs/${checkRunId}/annotations`])
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) throw new Error('gh returned unparseable output')
    const messages = parsed
      .filter(isRecord)
      .map((annotation) => str(annotation.message))
      .filter((message) => message !== '')
    fact = {
      checkRunId,
      available: true,
      reason: null,
      asOf: new Date(now).toISOString(),
      messages,
      billing: messages.some(isBillingMessage),
    }
  } catch (error) {
    fact = {
      checkRunId,
      available: false,
      reason: reasonOf(error),
      asOf: null,
      messages: [],
      billing: false,
    }
  }
  annotationCache.delete(key)
  annotationCache.set(key, { at: now, fact })
  while (annotationCache.size > ANNOTATION_CACHE_MAX) {
    const oldest = annotationCache.keys().next().value
    if (oldest === undefined) break
    annotationCache.delete(oldest)
  }
  return fact
}
