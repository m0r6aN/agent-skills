import { readFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { deriveAlerts } from './alerts.js'
import type { ConsoleConfig } from './config.js'
import { isRecord } from './guards.js'
import { invokeFlow, listAuditEntries } from './invoke.js'
import { deleteNotification, listNotifications, syncAlerts } from './notifications.js'
import { projectGoal } from './project.js'
import { loadRoutingPolicy } from './routing.js'
import { listGoalSlugs, scanGoal } from './scan.js'
import type { ChainSummary, GoalProjection } from './types.js'

/**
 * FOC-P2 HTTP route table — frozen by the FOC-P0 contract (X1): no route may
 * be added without amending that contract. Every route is read-only over
 * goal/receipt/spec data (charter D2); the only effects are console-local
 * state writes (`state/notifications.json`, `state/invocation-audit.json`)
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
  render: (projection: GoalProjection) => ApiResult,
): ApiResult {
  const goal = query.get('goal')
  if (goal === null || goal.length === 0) {
    return { status: 400, json: { error: 'missing required query parameter goal=<slug>' } }
  }
  const projection = projectGoal(config, goal, now)
  if (projection === null) {
    return { status: 404, json: { error: `unknown goal ${JSON.stringify(goal)}` } }
  }
  return render(projection)
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

export function handleApi(config: ConsoleConfig, request: ApiRequest, now: number): ApiResult {
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
    return {
      status: 200,
      json: {
        goals: listGoalSlugs(config)
          .map((slug) => scanGoal(config, slug))
          .filter((goal) => goal !== null),
      },
    }
  }

  const goalDetail = /^\/api\/goals\/([A-Za-z0-9._-]+)$/.exec(pathname)
  if (goalDetail !== null) {
    if (method !== 'GET') return methodNotAllowed('GET')
    const goal = scanGoal(config, goalDetail[1] ?? '')
    return goal === null
      ? { status: 404, json: { error: 'unknown goal' } }
      : { status: 200, json: goal }
  }

  if (pathname === '/api/parcels') {
    if (method !== 'GET') return methodNotAllowed('GET')
    return withGoal(config, query, now, (projection) => ({ status: 200, json: projection }))
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
    return withGoal(config, query, now, (projection) => {
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
          chainDocuments: chainDocuments(config, parcel.chain),
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

  if (pathname === '/api/alerts') {
    if (method !== 'GET') return methodNotAllowed('GET')
    return withGoal(config, query, now, (projection) => {
      const alerts = deriveAlerts(projection.parcels, now)
      // Alert firing is the only trigger the frozen route table allows; it
      // records firings in the console-local store (OQ3) and nothing else.
      const notifications = syncAlerts(config.stateDir, alerts, now)
      return { status: 200, json: { goal: projection.goal.slug, alerts, notifications } }
    })
  }

  if (pathname === '/api/routing') {
    if (method !== 'GET') return methodNotAllowed('GET')
    return withGoal(config, query, now, (projection) => ({
      status: 200,
      json: {
        goal: projection.goal.slug,
        policy: loadRoutingPolicy(config.routingPolicyPath),
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
    return { status: 200, json: invokeFlow(config, { flow, argv }, now) }
  }

  return { status: 404, json: { error: `no such route ${method} ${pathname}` } }
}
