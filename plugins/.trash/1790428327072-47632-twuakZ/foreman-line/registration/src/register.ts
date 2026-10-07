/**
 * The deterministic registration function (coordinator ruling Q2/Q6). Takes an
 * injected `JiraTransport`; all gate / hash-refusal / write-back / receipt
 * logic sits above the adapter. Implements the ratified 12-step write-back
 * order and the prior-registration -> F7 -> create ordering. Performs NO live
 * Jira write itself - the adapter is the boundary; deterministic tests drive a
 * fake recording adapter + a temp git repo.
 *
 * 12-step order (Q6): 0 gate armed -> 1 load record -> 2 prior-registration
 * check -> 3 F7 (first only) -> 4 create Epic+Stories (search-first) -> 5
 * back-fill `ticket:` -> 6 commit -> 7 push -> 8 capture pushed SHA -> 9
 * permalink + Jira link -> 10 Stage-B receipt -> 11 emit RegistrationResult.
 * Rollback policy: no destructive undo of created tickets; on any post-create
 * failure, STOP, report what landed, leave a re-runnable idempotent state
 * (search-first guarantees no duplicate creates).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, join } from 'node:path'
import { Ajv, type SchemaObject } from 'ajv'
import type { ApprovalRecord } from '../../approval/src/index.js'
import { approvalRecordPath } from '../../approval/src/index.js'
import type {
  EpicNode,
  RegistrationLink,
  RegistrationResult,
  StoryNode,
} from '../../contracts/src/index.js'
import { registrationResultSchema } from '../../contracts/src/index.js'
import type { ForemanConfig } from '../../foreman-config/src/index.js'
import { specFilenameStem } from '../../projection/src/index.js'
import { backfillTicketLine, type FileSnapshot, restoreSnapshots } from './backfill.js'
import { GatedTransport } from './gated-transport.js'
import * as git from './git.js'
import { assertApprovedHashMatches } from './hash-refusal.js'
import { buildIdempotencyJql } from './jql.js'
import { buildCreatePayload, EPIC_ISSUETYPE_ID, STORY_ISSUETYPE_ID } from './payloads.js'
import { buildPermalink, parseOwnerRepo } from './permalink.js'
import {
  detectRegistrationMode,
  type RegistrationMode,
  stageBReceiptLocator,
} from './prior-registration.js'
import { mintStageBReceipt } from './receipt.js'
import {
  type IssueCreatePayload,
  type JiraTransport,
  RegistrationError,
  RegistrationRootUnresolvedError,
} from './types.js'

/** Slug charset guard applied at the entry point (^[a-z0-9-]+$) - linear-time, no backtracking. */
const SLUG_RE = /^[a-z0-9-]+$/

export interface RegisterOptions {
  readonly slug: string
  /**
   * The destination Jira project key, caller-declared (P1b: the former
   * `PROJECT_KEY = 'KONE'` library constant is deleted — this repo's value is
   * the CALLER's explicit argument, its durable home being `foreman/config.yaml`
   * once P6 lands it). Guarded by assertJqlSafeToken at the JQL boundary; the
   * gate's independent allowlist membership enforcement is unchanged.
   */
  readonly projectKey?: string
  /** Optional validated foreman/config.yaml declaration used as the identity source. */
  readonly foremanConfig?: ForemanConfig
  readonly repoRoot: string
  /**
   * Specs `active/` directory relative to `repoRoot` (P2b-i/R2). Foreign
   * default `docs/specs/active`; the home repo passes
   * `plugins/foreman-line/docs/specs/active` explicitly (A1.3 — a relative
   * path within a caller-supplied root, not a root fallback).
   */
  readonly specsDir?: string
  readonly adapter: JiraTransport
  readonly timestamp: string
  readonly gitAuthor?: string
}

export interface RegisterOutcome {
  readonly mode: RegistrationMode
  readonly result: RegistrationResult
  readonly ticketKeys: readonly string[]
  readonly receiptLocator: string | null
  readonly sidecarPath: string
  readonly landed: readonly string[]
}

/**
 * Foreign-repo default for the specs `active/` directory, RELATIVE to the
 * caller-supplied `repoRoot` (P2b-i ruling R2 / A1.3). NOT a class-1 root
 * fallback: a relative path within a root the caller supplied explicitly. The
 * home repo passes `plugins/foreman-line/docs/specs/active` explicitly at
 * call sites. Declared per-package by ruling — no shared constant.
 */
const DEFAULT_SPECS_DIR = 'docs/specs/active'

function resolveProjectKey(
  projectKey: string | undefined,
  foremanConfig: ForemanConfig | undefined,
): string {
  const configProjectKey = foremanConfig?.identity.project_key
  if (configProjectKey === null) {
    throw new RegistrationError(
      'foreman/config.yaml declares identity.project_key: null; registration is not available for this repository',
      [],
    )
  }
  if (
    projectKey !== undefined &&
    configProjectKey !== undefined &&
    projectKey !== configProjectKey
  ) {
    throw new RegistrationError(
      `registration project key '${projectKey}' does not match foreman/config.yaml identity.project_key '${configProjectKey}'`,
      [],
    )
  }
  const resolved = projectKey ?? configProjectKey
  if (typeof resolved !== 'string' || resolved.length === 0) {
    throw new RegistrationError(
      'registration requires projectKey or a validated foreman/config.yaml identity.project_key',
      [],
    )
  }
  return resolved
}

/** Assert `root` is absolute (P2b-i path-guard ruling) — typed refusal, mechanism class 5. */
function assertAbsoluteRoot(root: string, seam: string): void {
  if (!isAbsolute(root)) {
    throw new RegistrationRootUnresolvedError(
      'root-not-absolute',
      `${seam}: repoRoot '${root}' is not an absolute path; a relative root would silently anchor to the process cwd and is refused (P2b-i / D19)`,
    )
  }
}

const ajv = new Ajv({ allErrors: true })
const validateRegistrationResult = ajv.compile(registrationResultSchema as SchemaObject)

export function assertRegistrationSlug(slug: string): void {
  if (!SLUG_RE.test(slug)) {
    throw new Error(
      `assertRegistrationSlug: slug ${JSON.stringify(slug)} must match ^[a-z0-9-]+$ - refused before any path is constructed`,
    )
  }
}

interface SpecBinding {
  readonly ref: string
  readonly story: StoryNode
}

function bindSpecsToStories(
  parcelSpecRefs: readonly string[],
  epic: EpicNode,
): readonly SpecBinding[] {
  return parcelSpecRefs.map((ref) => {
    const stem = specFilenameStem(ref)
    const story = epic.stories.find((s) => s.key === stem)
    if (story === undefined) {
      throw new Error(
        `register: parcelSpecRef ${JSON.stringify(ref)} (stem ${JSON.stringify(stem)}) has no matching Story in the Epic tree`,
      )
    }
    return { ref, story }
  })
}

function sidecarPathFor(slug: string, repoRoot: string, specsDir: string): string {
  return join(repoRoot, ...specsDir.split('/'), `${slug}.registration.json`)
}

function writeJsonFile(absPath: string, value: unknown): void {
  mkdirSync(dirname(absPath), { recursive: true })
  writeFileSync(absPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function assertResultValid(result: RegistrationResult): void {
  if (!validateRegistrationResult(result)) {
    const errors = (validateRegistrationResult.errors ?? [])
      .map((e) => `${e.instancePath} ${e.message ?? 'is invalid'}`)
      .join('; ')
    throw new Error(
      `register: emitted RegistrationResult fails registrationResultSchema: ${errors}`,
    )
  }
}

/** Both link directions for one spec-bearing Story, sharing the SHA-pinned permalink. */
function linkPair(ticketKey: string, commitSha: string, permalink: string): RegistrationLink[] {
  return [
    { direction: 'commit->ticket', ticketKey, commitSha, permalink },
    { direction: 'ticket->commit', ticketKey, commitSha, permalink },
  ]
}

/** Search-first upsert (create-or-update keyed off the stable id in the summary). */
async function upsertIssue(
  gt: GatedTransport,
  projectKey: string,
  payload: IssueCreatePayload,
  stableId: string,
  landed: string[],
): Promise<string> {
  const matches = await gt.search(buildIdempotencyJql(projectKey, stableId))
  if (matches.length > 1) {
    throw new RegistrationError(
      `register: ${matches.length} issues match stable id ${JSON.stringify(stableId)} (${matches.join(', ')}) - stop and report, never guess`,
      landed,
    )
  }
  if (matches.length === 1) {
    const key = matches[0] as string
    await gt.updateGated(key, payload)
    landed.push(`updated ${key} (${stableId})`)
    return key
  }
  const key = await gt.createGated(payload)
  landed.push(`created ${key} (${stableId})`)
  return key
}

export async function register(opts: RegisterOptions): Promise<RegisterOutcome> {
  const {
    slug,
    projectKey: declaredProjectKey,
    foremanConfig,
    repoRoot,
    specsDir = DEFAULT_SPECS_DIR,
    adapter,
    timestamp,
    gitAuthor,
  } = opts
  const projectKey = resolveProjectKey(declaredProjectKey, foremanConfig)

  // Step 0/1: entry guard + load approval record.
  assertRegistrationSlug(slug)
  assertAbsoluteRoot(repoRoot, 'register')
  const record = JSON.parse(
    readFileSync(approvalRecordPath(slug, repoRoot, specsDir), 'utf8'),
  ) as ApprovalRecord

  const projected = record.subject.projectedResult
  if (projected.epics.length !== 1) {
    throw new Error(
      `register: expected exactly one Epic (multi-Epic is out of scope), got ${projected.epics.length}`,
    )
  }
  const epic = projected.epics[0] as EpicNode
  const bindings = bindSpecsToStories(projected.parcelSpecRefs, epic)

  // Step 2: prior-registration detection (keys off the Stage-B receipt).
  const mode = detectRegistrationMode(record, repoRoot)

  const gt = new GatedTransport(adapter)
  if (mode === 'reconcile') {
    return reconcile(gt, projectKey, record, repoRoot, specsDir, epic, bindings, slug)
  }

  // Step 3: F7 hash-refusal (first-registration precondition only).
  assertApprovedHashMatches(record, repoRoot)
  return firstRegistration(
    gt,
    projectKey,
    record,
    repoRoot,
    specsDir,
    epic,
    bindings,
    slug,
    timestamp,
    gitAuthor,
  )
}

export interface PreviewResult {
  readonly mode: RegistrationMode
  readonly epicPayload: IssueCreatePayload
  readonly storyPayloads: readonly IssueCreatePayload[]
  readonly plannedActions: readonly string[]
}

/**
 * Preview / dry-run (rework item 5 / R9) - the jira-integration
 * preview-before-write discipline the spec claims. Returns the payloads that
 * WOULD be created plus the planned actions, making ZERO adapter calls and
 * performing NO git/fs writes. `adapter` is accepted for call-site symmetry and
 * is never touched (the zero-call guarantee is structural). The Story `parent`
 * shown here is the PROVISIONAL Epic key; the real Epic key is resolved at
 * registration time.
 */
export function preview(opts: {
  slug: string
  /** The destination Jira project key, caller-declared (or supplied by config). */
  projectKey?: string
  /** Optional validated foreman/config.yaml declaration used as the identity source. */
  foremanConfig?: ForemanConfig
  repoRoot: string
  /** Specs dir relative to `repoRoot` (P2b-i/R2); foreign default applies. */
  specsDir?: string
  adapter?: JiraTransport
}): PreviewResult {
  const {
    slug,
    projectKey: declaredProjectKey,
    foremanConfig,
    repoRoot,
    specsDir = DEFAULT_SPECS_DIR,
  } = opts
  const projectKey = resolveProjectKey(declaredProjectKey, foremanConfig)
  assertRegistrationSlug(slug)
  assertAbsoluteRoot(repoRoot, 'preview')
  const record = JSON.parse(
    readFileSync(approvalRecordPath(slug, repoRoot, specsDir), 'utf8'),
  ) as ApprovalRecord
  const projected = record.subject.projectedResult
  if (projected.epics.length !== 1) {
    throw new Error(
      `preview: expected exactly one Epic (multi-Epic is out of scope), got ${projected.epics.length}`,
    )
  }
  const epic = projected.epics[0] as EpicNode
  const bindings = bindSpecsToStories(projected.parcelSpecRefs, epic)
  const mode = detectRegistrationMode(record, repoRoot)

  const epicPayload = buildCreatePayload({
    projectKey,
    issuetypeId: EPIC_ISSUETYPE_ID,
    title: epic.title,
    stableId: epic.key,
  })
  const storyPayloads = bindings.map((b) =>
    buildCreatePayload({
      projectKey,
      issuetypeId: STORY_ISSUETYPE_ID,
      title: b.story.title,
      stableId: b.story.key,
      parentKey: epic.key,
    }),
  )

  const plannedActions: string[] = [
    `[${mode}] search ${projectKey} for stable id ${JSON.stringify(epic.key)}; create Epic if absent, update if present`,
  ]
  for (const b of bindings) {
    plannedActions.push(
      `[${mode}] search ${projectKey} for stable id ${JSON.stringify(b.story.key)}; create Story (parent=Epic) if absent, update if present`,
    )
  }
  for (const b of bindings) {
    plannedActions.push(
      `[${mode}] after the Stage-B receipt commit, write the ticket->commit link for ${JSON.stringify(b.story.key)}`,
    )
  }

  return { mode, epicPayload, storyPayloads, plannedActions }
}

async function firstRegistration(
  gt: GatedTransport,
  projectKey: string,
  record: ApprovalRecord,
  repoRoot: string,
  specsDir: string,
  epic: EpicNode,
  bindings: readonly SpecBinding[],
  slug: string,
  timestamp: string,
  gitAuthor: string | undefined,
): Promise<RegisterOutcome> {
  const landed: string[] = []

  // Step 4: create Epic, then Stories (search-first idempotent; Story->Epic via
  // parent). Sequential (awaited in order) so creates are ordered + deterministic.
  const epicPayload = buildCreatePayload({
    projectKey,
    issuetypeId: EPIC_ISSUETYPE_ID,
    title: epic.title,
    stableId: epic.key,
  })
  const epicKey = await upsertIssue(gt, projectKey, epicPayload, epic.key, landed)

  const storyRecords: Array<{
    binding: SpecBinding
    payload: IssueCreatePayload
    key: string
  }> = []
  for (const binding of bindings) {
    const payload = buildCreatePayload({
      projectKey,
      issuetypeId: STORY_ISSUETYPE_ID,
      title: binding.story.title,
      stableId: binding.story.key,
      parentKey: epicKey,
    })
    const key = await upsertIssue(gt, projectKey, payload, binding.story.key, landed)
    storyRecords.push({ binding, payload, key })
  }

  const ticketKeys = [epicKey, ...storyRecords.map((s) => s.key)]

  // Everything past here is post-create: on failure, STOP + report, never delete a ticket.
  try {
    // Step 5: back-fill `ticket:` (only that line) in each referenced spec.
    const snapshots: FileSnapshot[] = []
    for (const s of storyRecords) {
      const absSpec = join(repoRoot, ...s.binding.ref.split('/'))
      snapshots.push(backfillTicketLine(absSpec, s.key))
    }

    // Step 6: commit the back-fill (rollback the writes if the commit fails, so
    // a re-run sees approved content and F7 passes).
    const specPaths = storyRecords.map((s) => s.binding.ref)
    try {
      git.addAndCommit(
        repoRoot,
        specPaths,
        `chore(foreman-line): back-fill ticket keys for ${slug} [W1-P4]`,
        gitAuthor,
      )
    } catch (err) {
      restoreSnapshots(snapshots)
      throw new RegistrationError(
        `register: back-fill commit failed (${(err as Error).message}); back-fill rolled back, tickets left for idempotent re-run`,
        landed,
      )
    }
    landed.push('committed back-fill')

    // Step 7: push.
    const branch = git.currentBranch(repoRoot)
    git.push(repoRoot, branch)
    landed.push('pushed back-fill commit')

    // Step 8: capture the pushed post-key SHA (the commit the permalink binds).
    const pushedSha = git.revParseHead(repoRoot)
    const ownerRepo = parseOwnerRepo(git.remoteOriginUrl(repoRoot))

    // Step 9: build the permalinks + RegistrationResult. This is fully
    // deterministic from the pushed SHA + created keys - it does NOT depend on
    // the Jira link write succeeding, so the receipt subject can be minted now.
    const links: RegistrationLink[] = []
    for (const s of storyRecords) {
      const permalink = buildPermalink(ownerRepo, pushedSha, s.binding.ref)
      links.push(...linkPair(s.key, pushedSha, permalink))
    }
    const result: RegistrationResult = { ticketKeys, links }
    assertResultValid(result)

    // Step 10: mint + write + COMMIT the Stage-B receipt + sidecar (commit 2)
    // BEFORE the Jira link write. Once this is durable, a failed link write is
    // recoverable: a re-run detects the receipt and enters reconcile (rework
    // item 1 / R1+R2+R5). Reconcile-abuse stays closed - the receipt is minted
    // only here, after F7 passed at step 3 on the first run.
    const minted = mintStageBReceipt(record.correlation, record.receipt.hash, result, timestamp)
    const receiptAbs = join(repoRoot, ...minted.locator.split('/'))
    writeJsonFile(receiptAbs, minted.document)
    const sidecarAbs = sidecarPathFor(slug, repoRoot, specsDir)
    writeJsonFile(sidecarAbs, result)
    git.addAndCommit(
      repoRoot,
      [minted.locator, `${specsDir}/${slug}.registration.json`],
      `chore(foreman-line): stage-B receipt + registration result for ${slug} [W1-P4]`,
      gitAuthor,
    )
    git.push(repoRoot, branch)
    landed.push('committed stage-B receipt + sidecar')

    // Step 11 (post-receipt): write the Jira ticket->commit link. A failure
    // here leaves a durable receipt, so a re-run recovers via reconcile and
    // writes the link idempotently - no duplicate creates.
    for (const s of storyRecords) {
      const permalink = buildPermalink(ownerRepo, pushedSha, s.binding.ref)
      await gt.addLinkGated(s.key, permalink, s.payload.fields)
      landed.push(`linked ${s.key} -> ${pushedSha.slice(0, 12)}`)
    }

    return {
      mode: 'first',
      result,
      ticketKeys,
      receiptLocator: minted.locator,
      sidecarPath: sidecarAbs,
      landed,
    }
  } catch (err) {
    if (err instanceof RegistrationError) throw err
    throw new RegistrationError(`register: post-create failure: ${(err as Error).message}`, landed)
  }
}

async function reconcile(
  gt: GatedTransport,
  projectKey: string,
  record: ApprovalRecord,
  repoRoot: string,
  specsDir: string,
  epic: EpicNode,
  bindings: readonly SpecBinding[],
  slug: string,
): Promise<RegisterOutcome> {
  const landed: string[] = []

  // Find existing keys by the stable id - create nothing, update nothing on the issues.
  const findKey = async (stableId: string): Promise<string> => {
    const matches = await gt.search(buildIdempotencyJql(projectKey, stableId))
    if (matches.length !== 1) {
      throw new RegistrationError(
        `reconcile: expected exactly one existing issue for stable id ${JSON.stringify(stableId)}, found ${matches.length}`,
        landed,
      )
    }
    return matches[0] as string
  }

  const epicKey = await findKey(epic.key)

  // Read the receipted RegistrationResult - the source of truth for the
  // commitSha/permalink of each link (rework item 4 / R6). git-log is only a
  // per-link fallback when the receipt lacks a link for a ticket key.
  const receiptLocator = stageBReceiptLocator(record.correlation.workflowId)
  const receiptAbs = join(repoRoot, ...receiptLocator.split('/'))
  const receiptedResult = (
    JSON.parse(readFileSync(receiptAbs, 'utf8')) as { subject: RegistrationResult }
  ).subject
  const receiptedByKey = new Map<string, { commitSha: string; permalink: string }>()
  for (const link of receiptedResult.links) {
    if (!receiptedByKey.has(link.ticketKey)) {
      receiptedByKey.set(link.ticketKey, { commitSha: link.commitSha, permalink: link.permalink })
    }
  }
  const ownerRepo = parseOwnerRepo(git.remoteOriginUrl(repoRoot))

  for (const binding of bindings) {
    const key = await findKey(binding.story.key)
    const receipted = receiptedByKey.get(key)
    const commitSha = receipted?.commitSha ?? git.lastCommitTouching(repoRoot, binding.ref)
    const permalink = receipted?.permalink ?? buildPermalink(ownerRepo, commitSha, binding.ref)
    const gateFields = buildCreatePayload({
      projectKey,
      issuetypeId: STORY_ISSUETYPE_ID,
      title: binding.story.title,
      stableId: binding.story.key,
      parentKey: epicKey,
    }).fields
    await gt.addLinkGated(key, permalink, gateFields)
    landed.push(`re-linked ${key} -> ${commitSha.slice(0, 12)}`)
  }

  // The receipted result is authoritative; reconcile issues no commits and
  // writes no sidecar (ruling B) - the first run already committed both.
  return {
    mode: 'reconcile',
    result: receiptedResult,
    ticketKeys: receiptedResult.ticketKeys,
    receiptLocator,
    sidecarPath: sidecarPathFor(slug, repoRoot, specsDir),
    landed,
  }
}
