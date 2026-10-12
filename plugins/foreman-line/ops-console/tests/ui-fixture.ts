import { JSDOM } from 'jsdom'
import { ACTION_REGISTRY } from '../src/actions.js'

export const signal = (overrides: Record<string, unknown> = {}) => ({
  id: 'parcel-state:/repos/x:g/P1',
  class: 'parcel-state',
  severity: 'urgent',
  repo: '/repos/x',
  subject: 'g/P1',
  evidence: ['docs/goals/g/loop-directive.md'],
  actions: ['investigate', 'remediate', 'explain', 'close-delete'],
  ...overrides,
})

export const parcel = (overrides: Record<string, unknown> = {}) => ({
  parcel: 'P1',
  state: 'hung',
  rule: 'R4',
  chainEvidence: 'absent',
  specRef: null,
  specLocation: 'none',
  chain: null,
  flags: [],
  failure: null,
  heartbeat: { lastProgressAt: null },
  liveness: { live: false },
  gates: Object.fromEntries(
    ['G1', 'G2', 'G3'].map((gate) => [gate, { gate, status: 'unknown', detail: '' }]),
  ),
  ...overrides,
})

export const receipt = (overrides: Record<string, unknown> = {}) => ({
  id: 'receipt-0',
  sessionName: 'foc-x',
  paneIndex: 0,
  liveness: 'alive',
  harness: 'pi',
  model: 'example-model',
  budget: '$20',
  thinking: 'high',
  repoRoot: '/repos/x',
  worktreePath: '/repos/x-worktrees/p1',
  createdAt: '2026-10-12T12:00:00Z',
  ...overrides,
})

export async function mountConsole(overrides: Record<string, unknown> = {}) {
  const dom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>', {
    url: 'http://localhost/',
  })
  const routes: Record<string, unknown> = {
    '/api/health': { ok: true, repoRoot: '/repos/x', posture: 'localhost-only' },
    '/api/goals': {
      goals: [],
      statuses: [
        {
          key: 'g',
          repoRoot: '/repos/x',
          tree: null,
          active: true,
          attention: { total: 1 },
          urgentSubjects: [],
        },
      ],
    },
    '/api/parcels': { goal: { slug: 'g', loopDirectiveRef: 'g.md' }, parcels: [parcel()] },
    '/api/alerts': { alerts: [], remedies: [], notifications: [] },
    '/api/routing': { policy: { classes: [], roles: [] }, parcels: [] },
    '/api/parcels/P1/logs': { chainDocuments: [], invocationAudit: [], stateLines: [] },
    '/api/signals': { signals: [signal()] },
    '/api/actions': { actions: ACTION_REGISTRY },
    '/api/fleet': {
      roots: [
        { root: '/repos/x', identity: { remote: 'https://example.invalid/x' }, liveness: 'ready' },
      ],
    },
    '/api/spawns': { spawns: [receipt()] },
    '/api/spawn': (_path: string, options?: RequestInit) => {
      const body = JSON.parse(String(options?.body)) as { actions: unknown[] }
      return {
        ok: true,
        plan: { sessionName: 'foc-new' },
        launch: { launched: body.actions.map((_, i) => i), failed: null },
      }
    },
    '/api/actions/dispatch': { action: 'presented', reason: null },
    ...overrides,
  }
  const requests: { path: string; body: Record<string, unknown> | null }[] = []
  const fetcher = async (path: string, options?: RequestInit) => {
    requests.push({ path, body: options?.body ? JSON.parse(String(options.body)) : null })
    const key = path.split('?')[0] ?? path
    const value = routes[key]
    if (value instanceof Error) throw value
    const data = typeof value === 'function' ? await value(path, options) : value
    return { ok: true, status: 200, json: async () => data ?? {} }
  }
  // Browser module is intentionally shipped as JS, with no compilation step.
  const { startConsole } = await import('../ui/app.js')
  const app = startConsole(dom.window.document, fetcher)
  await app.ready
  const doc = dom.window.document
  const click = (selector: string) => {
    const el = doc.querySelector(selector) as HTMLElement | null
    if (!el) throw new Error(`missing control ${selector}`)
    el.click()
  }
  const input = (selector: string, value: string, event = 'input') => {
    const el = doc.querySelector(selector) as HTMLInputElement | null
    if (!el) throw new Error(`missing input ${selector}`)
    el.value = value
    el.dispatchEvent(new dom.window.Event(event, { bubbles: true }))
  }
  const settle = () => new Promise((resolve) => setTimeout(resolve, 20))
  return {
    dom,
    doc,
    routes,
    requests,
    app,
    click,
    input,
    settle,
    close: () => {
      app.destroy()
      dom.window.close()
    },
  }
}
