import assert from 'node:assert/strict'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { type ApiRequest, type ApiResult, handleApi } from '../src/api.js'
import type { ConsoleConfig } from '../src/config.js'
import { resolveBind } from '../src/server.js'
import { type Scenario, withTempRepo } from './support/materialize.js'

/**
 * FOC-P2 frozen route table behavior + FOC-P3 gate/alert/notification routes +
 * the D6 bind rule.
 */
const NOW = '2026-09-26T12:00:00.000Z'
const NOW_MS = Date.parse(NOW)
const WORKFLOW = '00000000-0000-4000-8000-000000000070'

function apiScenario(): Scenario {
  return {
    name: 'api-base',
    now: NOW,
    goal: {
      slug: 'goal-api',
      queue: ['1. **P1** dispatched; silent for days.', '2. **P2** ☑ SHIPPED + CLOSED.'],
      charterStatus: 'RATIFIED — Gate 1 granted 2026-09-16 (owner).',
    },
    specs: [
      {
        name: 'P1-alpha.md',
        location: 'active',
        updated: '2026-09-01',
        routingClass: 'standard-feature',
      },
      { name: 'P2-beta.md', location: 'done', status: 'done', updated: '2026-09-20' },
    ],
    chains: [
      {
        workflowId: WORKFLOW,
        parcel: 'P1',
        stages: ['A', 'B', 'C'],
        timestampOffsetHours: [-720, -710, -700],
        sidecars: ['routing-decision.json'],
        routing: {
          routingClass: 'architecture/risk',
          resolvedTier: 'frontier',
          resolvedModelId: 'vendor/frontier-1',
        },
      },
    ],
    expected: [],
  }
}

const POLICY_YAML = [
  'classes:',
  '  standard-feature:',
  '    allowlist: [standard]',
  '    ceiling_usd: 5.00',
  '  architecture/risk:',
  '    allowlist: [frontier]',
  '    ceiling_usd: 25.00',
  'roles:',
  '  builder: per-class',
  '  coordinator: frontier',
  '',
].join('\n')

function call(config: ConsoleConfig, method: string, path: string, body?: unknown): ApiResult {
  const url = new URL(path, 'http://localhost')
  const request: ApiRequest = {
    method,
    pathname: url.pathname,
    query: url.searchParams,
    body: body ?? {},
  }
  return handleApi(config, request, NOW_MS)
}

function withApi<T>(run: (config: ConsoleConfig, root: string) => T): T {
  return withTempRepo(apiScenario(), ({ config, root }) => {
    const policyPath = join(
      root,
      'plugins',
      'foreman-line',
      'routing-policy',
      'routing-policy.yaml',
    )
    mkdirSync(dirname(policyPath), { recursive: true })
    writeFileSync(policyPath, POLICY_YAML, 'utf8')
    return run(config, root)
  })
}

test('GET /api/health reports the read-only localhost posture', () => {
  withApi((config) => {
    const result = call(config, 'GET', '/api/health')
    assert.equal(result.status, 200)
    const json = result.json as { ok: boolean; repoRoot: string; posture: string }
    assert.equal(json.ok, true)
    assert.equal(json.repoRoot, config.repoRoot)
    assert.match(json.posture, /read-only/)
  })
})

test('GET /api/goals and /api/goals/:slug render goal records; unknown goals 404', () => {
  withApi((config) => {
    const list = call(config, 'GET', '/api/goals')
    assert.equal(list.status, 200)
    const goals = (list.json as { goals: { slug: string }[] }).goals
    assert.deepEqual(
      goals.map((goal) => goal.slug),
      ['goal-api'],
    )

    const detail = call(config, 'GET', '/api/goals/goal-api')
    assert.equal(detail.status, 200)
    const goal = detail.json as { items: { key: string }[]; ratification: { status: string } }
    assert.deepEqual(
      goal.items.map((item) => item.key),
      ['P1', 'P2'],
    )
    assert.equal(goal.ratification.status, 'granted')

    assert.equal(call(config, 'GET', '/api/goals/ghost').status, 404)
  })
})

test('GET /api/parcels returns the projection; chain and logs routes walk one parcel', () => {
  withApi((config) => {
    const parcels = call(config, 'GET', '/api/parcels?goal=goal-api')
    assert.equal(parcels.status, 200)
    const projection = parcels.json as {
      parcels: { parcel: string; state: string }[]
      unmappedChains: unknown[]
    }
    assert.deepEqual(
      projection.parcels.map((parcel) => parcel.parcel),
      ['P1', 'P2'],
    )
    assert.deepEqual(projection.unmappedChains, [])

    const chain = call(config, 'GET', '/api/parcels/P1/chain?goal=goal-api')
    assert.equal(chain.status, 200)
    const chainJson = chain.json as {
      chain: { members: unknown[]; sidecars: string[]; valid: boolean }
      duplicateChain: boolean
    }
    assert.equal(chainJson.chain.members.length, 3)
    assert.equal(chainJson.chain.valid, true)
    assert.deepEqual(
      chainJson.chain.sidecars.map((locator) => locator.split('/').pop()),
      ['routing-decision.json'],
    )
    assert.equal(chainJson.duplicateChain, false)

    assert.equal(call(config, 'GET', '/api/parcels/NOPE/chain?goal=goal-api').status, 404)

    const logs = call(config, 'GET', '/api/parcels/P1/logs?goal=goal-api')
    assert.equal(logs.status, 200)
    const logsJson = logs.json as {
      chainDocuments: { locator: string }[]
      invocationAudit: unknown[]
      stateLines: string[]
    }
    assert.equal(logsJson.chainDocuments.length, 4, 'C1 log input (a): members + sidecars')
    assert.ok(Array.isArray(logsJson.invocationAudit), 'C1 log input (b)')
    assert.ok(logsJson.stateLines.length > 0, 'C1 log input (c)')
  })
})

test('GET /api/gates renders gate proxies and goal ratification read-only', () => {
  withApi((config) => {
    const result = call(config, 'GET', '/api/gates?goal=goal-api')
    assert.equal(result.status, 200)
    const json = result.json as {
      ratification: { status: string }
      gates: { parcel: string; gates: Record<string, { status: string }> }[]
    }
    assert.equal(json.ratification.status, 'granted')
    const p1 = json.gates.find((entry) => entry.parcel === 'P1')
    assert.equal(p1?.gates.G2?.status, 'evidenced')
  })
})

test('GET /api/alerts fires hung/failed alerts into the console-local notification store', () => {
  withApi((config) => {
    const result = call(config, 'GET', '/api/alerts?goal=goal-api')
    assert.equal(result.status, 200)
    const json = result.json as {
      alerts: { kind: string; parcel: string }[]
      notifications: { alertId: string }[]
    }
    assert.ok(
      json.alerts.some((alert) => alert.kind === 'hung' && alert.parcel === 'P1'),
      'P1 hung alert',
    )
    assert.ok(
      json.notifications.some((entry) => entry.alertId.includes('P1')),
      'firing recorded',
    )

    // Firing is idempotent per alert id.
    const again = call(config, 'GET', '/api/alerts?goal=goal-api')
    const againJson = again.json as { notifications: unknown[] }
    assert.deepEqual(againJson.notifications, json.notifications)

    const listed = call(config, 'GET', '/api/notifications')
    const notifications = (listed.json as { notifications: { id: string }[] }).notifications
    assert.ok(notifications.length > 0)
    const firstId = notifications[0]?.id ?? ''
    const deleted = call(config, 'DELETE', `/api/notifications/${firstId}`)
    assert.equal(deleted.status, 200)
    assert.equal((deleted.json as { deleted: boolean }).deleted, true)
    assert.equal(call(config, 'DELETE', `/api/notifications/${firstId}`).status, 404)
  })
})

test('GET /api/routing renders policy class×ceiling and per-parcel routing read-only', () => {
  withApi((config) => {
    const result = call(config, 'GET', '/api/routing?goal=goal-api')
    assert.equal(result.status, 200)
    const json = result.json as {
      policy: {
        classes: { name: string; ceilingUsd: number; allowlist: string[] }[]
        roles: { role: string; tier: string }[]
      }
      parcels: { parcel: string; routing: { resolvedModelId: string | null } }[]
    }
    const arch = json.policy.classes.find((entry) => entry.name === 'architecture/risk')
    assert.equal(arch?.ceilingUsd, 25)
    assert.deepEqual(arch?.allowlist, ['frontier'])
    assert.ok(
      json.policy.roles.some((role) => role.role === 'coordinator' && role.tier === 'frontier'),
    )
    const p1 = json.parcels.find((entry) => entry.parcel === 'P1')
    assert.equal(p1?.routing.resolvedModelId, 'vendor/frontier-1')
  })
})

test('POST /api/invoke routes to the frozen flow registry and reports refusals', () => {
  withApi((config) => {
    const refused = call(config, 'POST', '/api/invoke', { flow: 'deploy', argv: [] })
    assert.equal(refused.status, 200)
    assert.equal((refused.json as { action: string }).action, 'refused')

    const presented = call(config, 'POST', '/api/invoke', {
      flow: 'approval-approve',
      argv: ['approve', 'p1-alpha', '--repo-root', config.repoRoot],
    })
    assert.equal((presented.json as { action: string }).action, 'presented')
  })
})

test('route table: unknown routes 404, wrong methods 405, missing goal param 400', () => {
  withApi((config) => {
    assert.equal(call(config, 'GET', '/api/unknown').status, 404)
    assert.equal(call(config, 'POST', '/api/goals').status, 405)
    assert.equal(call(config, 'DELETE', '/api/parcels/P1/chain?goal=goal-api').status, 405)
    assert.equal(call(config, 'GET', '/api/parcels').status, 400)
    assert.equal(call(config, 'GET', '/api/parcels?goal=ghost').status, 404)
    assert.equal(call(config, 'POST', '/api/notifications').status, 405)
    assert.equal(call(config, 'GET', '/api/invoke').status, 405)
  })
})

test('D6 bind rule: loopback by default, non-loopback refused without FOC_CONTAINER=1', () => {
  assert.deepEqual(resolveBind({}), { host: '127.0.0.1', port: 8081 })
  assert.deepEqual(resolveBind({ PORT: '9090' }), { host: '127.0.0.1', port: 9090 })
  assert.deepEqual(resolveBind({ FOC_HOST: 'localhost' }), { host: 'localhost', port: 8081 })
  assert.throws(() => resolveBind({ FOC_HOST: '0.0.0.0' }), /refusing non-loopback bind/)
  assert.deepEqual(resolveBind({ FOC_HOST: '0.0.0.0', FOC_CONTAINER: '1' }), {
    host: '0.0.0.0',
    port: 8081,
  })
  assert.throws(() => resolveBind({ PORT: 'nope' }), /PORT must be an integer/)
})

test('the served policy file is read-only input: nothing rewrote routing-policy.yaml', () => {
  withApi((config, root) => {
    const policyPath = join(
      root,
      'plugins',
      'foreman-line',
      'routing-policy',
      'routing-policy.yaml',
    )
    const before = readFileSync(policyPath, 'utf8')
    call(config, 'GET', '/api/routing?goal=goal-api')
    assert.equal(readFileSync(policyPath, 'utf8'), before)
  })
})
