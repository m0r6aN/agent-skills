import { readFileSync, realpathSync } from 'node:fs'
import { basename, isAbsolute, join, relative, sep } from 'node:path'
import { ACTION_REGISTRY, type AutonomyEnvelope, dispatchAction } from './actions.js'
import { deriveAlerts } from './alerts.js'
import { type BrowseRefusalError, browseDirectory } from './browse.js'
import { type ConsoleConfig, goalTrees, resolveGoalKey, treeConfigFor } from './config.js'
import { buildDecisions, type DecisionsOptions } from './decisions.js'
import {
  addFleetRoot,
  defaultFleetProbe,
  describeRoot,
  type FleetRefusalError,
  type FleetState,
  loadFleetState,
  removeFleetRoot,
  saveFleetState,
} from './fleet.js'
import { isRecord } from './guards.js'
import { invokeFlow, listAuditEntries } from './invoke.js'
import { ledgerEntries, liveProbes } from './ledger.js'
import { readGitOutcome } from './ledger-git.js'
import { deleteNotification, listNotifications, syncAlerts } from './notifications.js'
import { projectGoal } from './project.js'
import { assess, DISCREPANCY_CODES, reconcileGoal, type SessionEvidence } from './reconcile.js'
import { gatherRepoFacts } from './reconcile-git.js'
import { gatherPrFacts, gatherPrFactsAsync } from './reconcile-remote.js'
import { remediesFor } from './remedy.js'
import { loadRoutingPolicy } from './routing.js'
import { listGoalSlugs, scanGoal } from './scan.js'
import {
  collectSignals,
  collectSignalsAsync,
  SIGNAL_CLASSES,
  SIGNAL_SEVERITIES,
} from './signals.js'
import { sessionProbeFor } from './signals-session.js'
import { launchSpawnPlan, listSpawnReceipts, planSpawn, type SpawnRefusalError } from './spawn.js'
import { goalStatus } from './status.js'
import type { ChainSummary, GoalProjection } from './types.js'

/**
 * FOC-P2 HTTP route table — frozen by the FOC-P0 contract (X1): no route may
 * be added without amending that contract. The FCA-P2 fleet + fs-browse routes
 * below are added under the owner-ratified control-center amendment
 * (`AMENDMENT-2026-10-11-control-center.md`); FCA-P3/P5 routes follow the same
 * path. Every route is read-only over
 * goal/receipt/spec data (charter D2); the only effects are console-local
 * state writes (`state/notifications.json`, `state/invocation-audit.json`,
 * `state/fleet.json`)
 * through the FOC-P3 modules.
 */
export interface ApiRequest {
  readonly method: string
  readonly pathname: string
  readonly query: URLSearchParams
  readonly body: unknown
}

export interface ApiResult {
  readonly status: number
  readonly json: unknown
}

function methodNotAllowed(allow: string): ApiResult {
  return { status: 405, json: { error: 'method not allowed', allow } }
}

function withGoal(
  config: ConsoleConfig,
  query: URLSearchParams,
  now: number,
  render: (projection: GoalProjection, treeConfig: ConsoleConfig) => ApiResult,
): ApiResult {
  const goal = query.get('goal')
  if (goal === null || goal.length === 0) {
    return { status: 400, json: { error: 'missing required query parameter goal=<slug>' } }
  }
  // FCA-1: goal keys are tree-qualified (`alias.slug`) outside the primary
  // plugin tree; bare slugs keep resolving there (pre-extension keys work).
  const resolved = resolveGoalKey(config, goal)
  if (resolved === null) {
    return { status: 404, json: { error: `unknown goal ${JSON.stringify(goal)}` } }
  }
  const treeConfig = treeConfigFor(config, resolved.tree)
  const projection = projectGoal(treeConfig, resolved.slug, now, goal, resolved.tree.treeRef)
  if (projection === null) {
    return { status: 404, json: { error: `unknown goal ${JSON.stringify(goal)}` } }
  }
  return render(projection, treeConfig)
}

/** FCA-P14: Async version of withGoal for routes using non-blocking calls. */
async function asyncWithGoal(
  config: ConsoleConfig,
  query: URLSearchParams,
  now: number,
  render: (projection: GoalProjection, treeConfig: ConsoleConfig) => Promise<ApiResult>,
): Promise<ApiResult> {
  const goal = query.get('goal')
  if (goal === null || goal.length === 0) {
    return { status: 400, json: { error: 'missing required query parameter goal=<slug>' } }
  }
  const resolved = resolveGoalKey(config, goal)
  if (resolved === null) {
    return { status: 404, json: { error: `unknown goal ${JSON.stringify(goal)}` } }
  }
  const treeConfig = treeConfigFor(config, resolved.tree)
  const projection = projectGoal(treeConfig, resolved.slug, now, goal, resolved.tree.treeRef)
  if (projection === null) {
    return { status: 404, json: { error: `unknown goal ${JSON.stringify(goal)}` } }
  }
  return render(projection, treeConfig)
}

function chainDocuments(config: ConsoleConfig, chain: ChainSummary | null): unknown[] {
  if (chain === null) return []
  const dir = join(config.receiptsDir, chain.workflowId)
  const docs: unknown[] = []
  const locators = [...chain.members.map((member) => member.locator), ...chain.sidecars]
  for (const locator of locators) {
    try {
      docs.push({ locator, json: JSON.parse(readFileSync(join(dir, basename(locator)), 'utf8')) })
    } catch (err) {
      docs.push({ locator, error: (err as Error).message })
    }
  }
  return docs
}

/** Test seams only: production callers pass nothing and get the real `gh`/`git`. */
export interface ApiDeps {
  readonly decisions?: DecisionsOptions
}

export async function handleApi(
  config: ConsoleConfig,
  request: ApiRequest,
  now: number,
  deps: ApiDeps = {},
): Promise<ApiResult> {
  const { method, pathname, query } = request

  if (pathname === '/api/health') {
    if (method !== 'GET') return methodNotAllowed('GET')
    return {
      status: 200,
      json: {
        ok: true,
        console: 'foc-ops-console/v1',
        repoRoot: config.repoRoot,
        now: new Date(now).toISOString(),
        posture: 'localhost-only, read-only over goal/receipt/spec data (charter D2/D6)',
      },
    }
  }

  if (pathname === '/api/goals') {
    if (method !== 'GET') return methodNotAllowed('GET')
    // FCA-2: `goals` keeps its pre-extension shape (GoalRecord[] in per-tree
    // scan order); `statuses` is the additive index the goal picker uses —
    // tree-qualified keys, activity, and attention counts per goal.
    const goals: unknown[] = []
    const statuses: unknown[] = []
    // FCA-P14: async signal collection (non-blocking).
    const allSignals = await collectSignalsAsync(config, now)
    for (const tree of goalTrees(config)) {
      const treeConfig = treeConfigFor(config, tree)
      for (const slug of listGoalSlugs(treeConfig)) {
        const record = scanGoal(treeConfig, slug, tree.treeRef)
        if (record === null) continue
        const key = tree.key === null ? slug : `${tree.key}.${slug}`
        goals.push(record)
        const projection = projectGoal(treeConfig, slug, now, key, tree.treeRef)
        if (projection !== null) {
          statuses.push({
            ...goalStatus(key, tree.key, projection, allSignals),
            repoRoot: tree.root,
          })
        }
      }
    }
    return { status: 200, json: { goals, statuses } }
  }

  const goalDetail = /^\/api\/goals\/([A-Za-z0-9._-]+)$/.exec(pathname)
  if (goalDetail !== null) {
    if (method !== 'GET') return methodNotAllowed('GET')
    const resolved = resolveGoalKey(config, goalDetail[1] ?? '')
    const record =
      resolved === null
        ? null
        : scanGoal(treeConfigFor(config, resolved.tree), resolved.slug, resolved.tree.treeRef)
    return record === null
      ? { status: 404, json: { error: 'unknown goal' } }
      : { status: 200, json: record }
  }

  if (pathname === '/api/parcels') {
    if (method !== 'GET') return methodNotAllowed('GET')
    return withGoal(config, query, now, (projection) => ({ status: 200, json: projection }))
  }

  // FCA-P8 reconciliation (owner-ratified route amendment 2026-10-13): per goal,
  // local record vs local git vs remote, with a closed discrepancy vocabulary.
  // Read-only; one batch of git calls and one cached `gh pr list` per repo per
  // request - never per parcel. `state`/`rule` are echoed for display only.
  // FCA-P14: async gh calls (non-blocking).
  if (pathname === '/api/reconcile') {
    if (method !== 'GET') return methodNotAllowed('GET')
    return asyncWithGoal(config, query, now, async (projection, treeConfig) => {
      // Real paths throughout: git reports real worktree paths, receipts may hold symlinks.
      const real = (path: string): string => {
        try {
          return realpathSync(path)
        } catch {
          return path
        }
      }
      const repoRoot = real(treeConfig.repoRoot)
      // The specs directory of THIS tree, repo-relative; outside the repository = unknown.
      const rel = relative(repoRoot, real(treeConfig.specsDir)).split(sep).join('/')
      const specsRel = rel === '' || rel.startsWith('..') || isAbsolute(rel) ? null : rel
      const repo = gatherRepoFacts(repoRoot, undefined, specsRel)
      const prs = await gatherPrFactsAsync(repoRoot, now)
      // Other goals' parcel keys: only used to recognise ambiguous links.
      const otherKeys: string[] = []
      for (const slug of listGoalSlugs(treeConfig)) {
        if (slug === projection.goal.slug) continue
        try {
          for (const item of scanGoal(treeConfig, slug)?.items ?? []) otherKeys.push(item.key)
        } catch {
          // an unreadable sibling goal only narrows ambiguity detection
        }
      }
      const receipts = listSpawnReceipts(config.stateDir).filter(
        (receipt) => real(receipt.repoRoot) === repoRoot,
      )
      const sessions: SessionEvidence[] = []
      for (const [id, entry] of ledgerEntries(receipts, liveProbes(config), now)) {
        const receipt = receipts.find((candidate) => candidate.id === id)
        if (receipt === undefined) continue
        sessions.push({
          receiptId: id,
          worktreePath: real(receipt.worktreePath),
          createdAt: receipt.createdAt,
          state: entry.state,
          exitAt: entry.exit.at,
          orphanClean: entry.orphanClean,
        })
      }
      const outcomes = new Map<string, ReturnType<typeof readGitOutcome>>()
      const worktreeOutcome = (path: string) => {
        const hit = outcomes.get(path)
        if (hit !== undefined) return hit
        const fact = readGitOutcome(path, repo.defaultRef)
        outcomes.set(path, fact)
        return fact
      }
      const reconciled = reconcileGoal({
        parcels: projection.parcels,
        items: projection.goal.items,
        stateLines: projection.goal.stateLines,
        otherKeys,
        repo,
        prs,
        sessions,
        worktreeOutcome,
        now,
      })
      const byCode = Object.fromEntries(DISCREPANCY_CODES.map((code) => [code, 0]))
      for (const entry of reconciled) {
        for (const discrepancy of entry.discrepancies) {
          byCode[discrepancy.code] = (byCode[discrepancy.code] ?? 0) + 1
        }
      }
      const stateOf = new Map(projection.parcels.map((parcel) => [parcel.parcel, parcel]))
      return {
        status: 200,
        json: {
          goal: projection.goal.slug,
          generatedAt: new Date(now).toISOString(),
          repo: {
            repoRoot,
            defaultRef: repo.defaultRef,
            refsAsOf: repo.refsAsOf,
            checkedOutBranch: repo.currentBranch,
            defaultDivergence: repo.defaultDivergence,
          },
          prs: {
            available: prs.available,
            reason: prs.reason,
            asOf: prs.asOf,
            truncated: prs.truncated,
          },
          assessment: assess(repo, prs),
          counts: { parcels: reconciled.length, byCode },
          parcels: reconciled.map((entry) => ({
            state: stateOf.get(entry.parcel)?.state ?? null,
            rule: stateOf.get(entry.parcel)?.rule ?? null,
            ...entry,
          })),
        },
      }
    })
  }

  const chainRoute = /^\/api\/parcels\/([A-Z0-9-]+)\/chain$/.exec(pathname)
  if (chainRoute !== null) {
    if (method !== 'GET') return methodNotAllowed('GET')
    const key = chainRoute[1] ?? ''
    return withGoal(config, query, now, (projection) => {
      const parcel = projection.parcels.find((entry) => entry.parcel === key)
      if (parcel === undefined) return { status: 404, json: { error: `unknown parcel ${key}` } }
      return {
        status: 200,
        json: {
          goal: projection.goal.slug,
          parcel: key,
          chain: parcel.chain,
          duplicateChain: parcel.flags.includes('duplicate-chain'),
        },
      }
    })
  }

  const logsRoute = /^\/api\/parcels\/([A-Z0-9-]+)\/logs$/.exec(pathname)
  if (logsRoute !== null) {
    if (method !== 'GET') return methodNotAllowed('GET')
    const key = logsRoute[1] ?? ''
    return withGoal(config, query, now, (projection, treeConfig) => {
      const parcel = projection.parcels.find((entry) => entry.parcel === key)
      if (parcel === undefined) return { status: 404, json: { error: `unknown parcel ${key}` } }
      return {
        status: 200,
        json: {
          goal: projection.goal.slug,
          parcel: key,
          // FOC-P0 C1 log-viewer inputs: exactly (a) the parcel's receipt chain
          // documents (members + sidecars), (b) the console-local invocation
          // audit log, (c) the goal's loop-directive state lines.
          chainDocuments: chainDocuments(treeConfig, parcel.chain),
          invocationAudit: listAuditEntries(config.stateDir),
          stateLines: projection.goal.stateLines,
        },
      }
    })
  }

  if (pathname === '/api/gates') {
    if (method !== 'GET') return methodNotAllowed('GET')
    return withGoal(config, query, now, (projection) => ({
      status: 200,
      json: {
        goal: projection.goal.slug,
        ratification: projection.goal.ratification,
        gates: projection.parcels.map((parcel) => ({ parcel: parcel.parcel, gates: parcel.gates })),
      },
    }))
  }

  // FCA-P9 decisions queue (owner-ratified route amendment 2026-10-13, A3):
  // every human gate act waiting - open PRs (Gate 3) and R3 awaiting-gate
  // parcels (Gates 1/2) - with evidence and ages. Read-only: facts and (in later
  // stages) a presented command; nothing is merged, approved or dispatched here.
  if (pathname === '/api/decisions') {
    if (method !== 'GET') return methodNotAllowed('GET')
    const repo = query.get('repo')
    return {
      status: 200,
      json: buildDecisions(config, now, { ...deps.decisions, repo: repo === '' ? null : repo }),
    }
  }

  if (pathname === '/api/alerts') {
    if (method !== 'GET') return methodNotAllowed('GET')
    return withGoal(config, query, now, (projection, treeConfig) => {
      const alerts = deriveAlerts(projection.parcels, now)
      // Alert firing is the only trigger the frozen route table allows; it
      // records firings in the console-local store (OQ3) and nothing else.
      const notifications = syncAlerts(config.stateDir, alerts, now)
      return {
        status: 200,
        json: {
          goal: projection.goal.slug,
          alerts,
          notifications,
          // FCA-3 additive sibling: triage questions + recommendations with
          // copy-pasteable commands. Presentation only — nothing executes.
          remedies: remediesFor(treeConfig, projection),
        },
      }
    })
  }

  if (pathname === '/api/routing') {
    if (method !== 'GET') return methodNotAllowed('GET')
    return withGoal(config, query, now, (projection, treeConfig) => ({
      status: 200,
      json: {
        goal: projection.goal.slug,
        policy: loadRoutingPolicy(treeConfig.routingPolicyPath),
        parcels: projection.parcels.map((parcel) => ({
          parcel: parcel.parcel,
          routing: parcel.routing,
        })),
      },
    }))
  }

  if (pathname === '/api/notifications') {
    if (method !== 'GET') return methodNotAllowed('GET')
    return { status: 200, json: { notifications: listNotifications(config.stateDir) } }
  }

  const notificationRoute = /^\/api\/notifications\/([^/]+)$/.exec(pathname)
  if (notificationRoute !== null) {
    if (method !== 'DELETE') return methodNotAllowed('DELETE')
    const deleted = deleteNotification(config.stateDir, notificationRoute[1] ?? '')
    return deleted
      ? { status: 200, json: { deleted: true } }
      : { status: 404, json: { error: 'unknown notification id', deleted: false } }
  }

  if (pathname === '/api/invoke') {
    if (method !== 'POST') return methodNotAllowed('POST')
    const body = isRecord(request.body) ? request.body : {}
    const flow = typeof body.flow === 'string' ? body.flow : ''
    const argv = Array.isArray(body.argv)
      ? body.argv.filter((entry): entry is string => typeof entry === 'string')
      : []
    return { status: 200, json: invokeFlow(config, { flow, argv, mode: body.mode }, now) }
  }

  // FCA-P3 unified attention model (control-center amendment): derived signal
  // snapshots over every provider class. Read-only; filters are typed
  // (`reason: unknown-class | unknown-severity`).
  if (pathname === '/api/signals') {
    if (method !== 'GET') return methodNotAllowed('GET')
    const classFilter = query.get('class')
    const severityFilter = query.get('severity')
    const repoFilter = query.get('repo')
    if (classFilter !== null && !(SIGNAL_CLASSES as readonly string[]).includes(classFilter)) {
      return {
        status: 400,
        json: {
          error: `unknown signal class ${JSON.stringify(classFilter)}`,
          reason: 'unknown-class',
        },
      }
    }
    if (
      severityFilter !== null &&
      !(SIGNAL_SEVERITIES as readonly string[]).includes(severityFilter)
    ) {
      return {
        status: 400,
        json: {
          error: `unknown signal severity ${JSON.stringify(severityFilter)}`,
          reason: 'unknown-severity',
        },
      }
    }
    // FCA-P14: async signal collection (non-blocking).
    const allSignals = await collectSignalsAsync(config, now)
    const signals = allSignals.filter(
      (signal) =>
        (classFilter === null || signal.class === classFilter) &&
        (severityFilter === null || signal.severity === severityFilter) &&
        (repoFilter === null || signal.repo === repoFilter),
    )
    return { status: 200, json: { signals } }
  }

  // FCA-P2 fleet registry (control-center amendment): declared multi-repo
  // scope. Refusals are typed (4xx + `reason`); the only write target is
  // `state/fleet.json`.
  if (pathname === '/api/fleet') {
    if (method !== 'GET') return methodNotAllowed('GET')
    return { status: 200, json: { roots: fleetRoots(config) } }
  }

  if (pathname === '/api/fleet/add') {
    if (method !== 'POST') return methodNotAllowed('POST')
    const body = isRecord(request.body) ? request.body : {}
    const root = typeof body.root === 'string' ? body.root : ''
    return fleetMutation(config, () =>
      addFleetRoot(loadFleetState(config.stateDir, config.repoRoot), root, defaultFleetProbe),
    )
  }

  if (pathname === '/api/fleet/remove') {
    if (method !== 'POST') return methodNotAllowed('POST')
    const body = isRecord(request.body) ? request.body : {}
    const root = typeof body.root === 'string' ? body.root : ''
    return fleetMutation(config, () =>
      removeFleetRoot(loadFleetState(config.stateDir, config.repoRoot), root),
    )
  }

  // FCA-P2 sandboxed browse (fleet folder picker): one level, read-only,
  // symlinks never followed.
  if (pathname === '/api/fs/browse') {
    if (method !== 'GET') return methodNotAllowed('GET')
    const path = query.get('path')
    if (path === null || path.length === 0) {
      return {
        status: 400,
        json: { error: 'missing required query parameter path=<absolute dir>' },
      }
    }
    try {
      return { status: 200, json: browseDirectory(path) }
    } catch (err) {
      return refusalResult(err)
    }
  }

  // FCA-P4 action registry listing (FCA-P6: the UI renders verb buttons for
  // REGISTERED (class x verb) pairs only — the matrix is read, never guessed).
  if (pathname === '/api/actions') {
    if (method !== 'GET') return methodNotAllowed('GET')
    return {
      status: 200,
      json: {
        actions: ACTION_REGISTRY.map((spec) => ({
          verb: spec.verb,
          signalClasses: spec.signalClasses,
          invocation: spec.invocation,
          destructive: spec.destructive,
          autonomy: spec.autonomy,
        })),
      },
    }
  }

  // FCA-P5 spawn dispatch: shared controls + selected actions -> pure plan
  // (typed refusals in the plan stage) -> tmux launch -> receipts. The
  // response carries digests and worktree paths, never prompt payloads.
  if (pathname === '/api/spawn') {
    if (method !== 'POST') return methodNotAllowed('POST')
    const body = isRecord(request.body) ? request.body : {}
    const controlsRaw = isRecord(body.controls) ? body.controls : {}
    const actionsRaw = Array.isArray(body.actions) ? body.actions : []
    try {
      const plan = planSpawn({
        controls: {
          harness: typeof controlsRaw.harness === 'string' ? controlsRaw.harness : '',
          model: typeof controlsRaw.model === 'string' ? controlsRaw.model : '',
          thinking: typeof controlsRaw.thinking === 'string' ? controlsRaw.thinking : '',
          budget: typeof controlsRaw.budget === 'string' ? controlsRaw.budget : '',
        },
        actions: actionsRaw.filter(isRecord).map((raw) => ({
          verb: typeof raw.verb === 'string' ? raw.verb : '',
          signalClass: typeof raw.signalClass === 'string' ? raw.signalClass : '',
          subject: typeof raw.subject === 'string' ? raw.subject : '',
          evidence: Array.isArray(raw.evidence)
            ? raw.evidence.filter((entry): entry is string => typeof entry === 'string')
            : [],
          repoRoot: typeof raw.repoRoot === 'string' ? raw.repoRoot : config.repoRoot,
          extraText: typeof raw.extraText === 'string' ? raw.extraText : null,
        })),
        now,
      })
      const launch = launchSpawnPlan(config, plan, now)
      return {
        status: 200,
        json: {
          ok: true,
          plan: {
            harness: plan.harness,
            sessionName: plan.sessionName,
            panes: plan.panes.map((pane) => ({
              paneIndex: pane.paneIndex,
              subject: pane.subject,
              worktreePath: pane.worktreePath,
              promptDigest: pane.promptDigest,
            })),
          },
          launch,
        },
      }
    } catch (err) {
      const refusal = err as SpawnRefusalError
      if (typeof refusal?.reason === 'string') {
        return { status: 400, json: { ok: false, reason: refusal.reason, error: refusal.message } }
      }
      throw err
    }
  }

  // FCA-P5 spawn receipts (control-center amendment): append-only receipt
  // list with derived pane liveness. Read-only route; the store is written by
  // the launcher only.
  if (pathname === '/api/spawns') {
    if (method !== 'GET') return methodNotAllowed('GET')
    // FCA-P7: `ledger` is ADDITIVE; every pre-existing field is unchanged.
    const receipts = listSpawnReceipts(config.stateDir)
    const ledger = ledgerEntries(receipts, liveProbes(config), now)
    return {
      status: 200,
      json: {
        spawns: receipts.map((receipt) => ({
          ...receipt,
          liveness: sessionProbeFor(config.repoRoot).sessionAlive(receipt.sessionName)
            ? 'alive'
            : 'exited',
          ledger: ledger.get(receipt.id) ?? null,
        })),
      },
    }
  }

  // FCA-P4 action dispatch (control-center amendment): the closed registry
  // with the Task-11 destructive confirmation contract. Refusals ride inside
  // the outcome JSON (same shape as `/api/invoke`).
  if (pathname === '/api/actions/dispatch') {
    if (method !== 'POST') return methodNotAllowed('POST')
    const body = isRecord(request.body) ? request.body : {}
    return {
      status: 200,
      json: dispatchAction(
        config,
        {
          verb: typeof body.verb === 'string' ? body.verb : '',
          signalClass: typeof body.signalClass === 'string' ? body.signalClass : '',
          subject: typeof body.subject === 'string' ? body.subject : '',
          confirmation: typeof body.confirmation === 'string' ? body.confirmation : null,
          autonomy: isRecord(body.autonomy)
            ? (body.autonomy as Partial<AutonomyEnvelope>)
            : undefined,
        },
        now,
      ),
    }
  }

  return { status: 404, json: { error: `no such route ${method} ${pathname}` } }
}

function fleetRoots(config: ConsoleConfig): unknown[] {
  const state = loadFleetState(config.stateDir, config.repoRoot)
  return state.roots.map((root) => describeRoot(root, defaultFleetProbe))
}

function fleetMutation(config: ConsoleConfig, mutate: () => FleetState): ApiResult {
  try {
    saveFleetState(config.stateDir, mutate())
    return { status: 200, json: { ok: true, roots: fleetRoots(config) } }
  } catch (err) {
    return refusalResult(err)
  }
}

/** Typed refusals become 4xx/5xx JSON with their `reason`; anything else rethrows. */
function refusalResult(err: unknown): ApiResult {
  const refusal = err as FleetRefusalError | BrowseRefusalError
  if (typeof refusal?.reason === 'string') {
    const status =
      refusal.reason === 'root-unknown' ? 404 : refusal.reason === 'fleet-state-corrupt' ? 500 : 400
    return { status, json: { error: refusal.message, reason: refusal.reason } }
  }
  throw err
}
