import assert from 'node:assert/strict'
import test from 'node:test'
import { JSDOM } from 'jsdom'
import { attachCommand, TRAY_ROW_CAP, trayHtml } from '../ui/views/tray.js'

/**
 * FCA-P6 session tray (Task 19): pane liveness from /api/spawns polling,
 * copyable attach commands, per-session explain/close routed through the same
 * action registry (close demands the typed confirmation), and a capped
 * rendering window so 200+ sessions never jank the UI.
 */

function spawn(overrides = {}) {
  return {
    id: 'foc-x-p0',
    sessionName: 'foc-x',
    paneIndex: 0,
    harness: 'pi',
    model: 'claude-sonnet-5-5',
    thinking: 'high',
    budget: '$20',
    autonomy: { decisions: 'partial', commit: false, push: false, openPr: false, merge: false },
    repoRoot: '/repos/agent-skills',
    worktreePath: '/repos/agent-skills-worktrees/pr-170-red-x',
    promptDigest: 'abc',
    argv: ['pi'],
    createdAt: '2026-10-11T12:00:00.000Z',
    liveness: 'alive',
    ...overrides,
  }
}

test('the tray windows at 200 rows and keeps attach + actions on every row', () => {
  const many = Array.from({ length: 250 }, (_, index) =>
    spawn({ id: `s-${index}`, sessionName: `foc-${index}`, paneIndex: index }),
  )
  const dom = new JSDOM(`<div>${trayHtml(many)}</div>`)
  const doc = dom.window.document
  assert.equal(doc.querySelectorAll('.tray-row').length, TRAY_ROW_CAP, 'windowed rendering')
  assert.ok((doc.body.textContent ?? '').includes('showing 200 of 250 sessions'))
  const first = doc.querySelector('.tray-row') as unknown as {
    querySelector: (sel: string) => {
      textContent: string
      getAttribute: (name: string) => string | null
    }
    querySelectorAll: (sel: string) => unknown[]
  } | null
  assert.ok(first !== null)
  assert.ok(
    first.querySelector('.attach').textContent.includes('tmux attach -t foc-0'),
    'attach command rendered',
  )
  assert.equal(first.querySelector('[data-copy]').getAttribute('data-copy'), 'tmux attach -t foc-0')
  assert.equal(first.querySelectorAll('[data-session-action]').length, 2, 'explain + close')
  assert.equal(attachCommand('foc-9'), 'tmux attach -t foc-9')
  const small = new JSDOM(`<div>${trayHtml([spawn()])}</div>`)
  assert.equal(small.window.document.querySelectorAll('.tray-row').length, 1)
  assert.equal((small.window.document.body.textContent ?? '').includes('showing'), false)
})

test('tray e2e: liveness polling, attach copy, registry-routed explain/close with typed confirmation', async () => {
  const dom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>', {
    url: 'http://localhost/',
  })
  const doc = dom.window.document
  let spawns = [spawn()]
  const dispatches: Array<Record<string, unknown>> = []
  const copies: string[] = []
  let promptAnswer: string | null = null
  const routes = {
    '/api/health': { ok: true, repoRoot: '/repos/x', posture: 'test' },
    '/api/goals': { goals: [], statuses: [] },
    '/api/parcels': {
      goal: { slug: 'g', loopDirectiveRef: 'x.md' },
      parcels: [],
      unmappedChains: [],
    },
    '/api/alerts': { alerts: [], remedies: [], notifications: [] },
    '/api/routing': { policy: { classes: [], roles: [] }, parcels: [] },
  }
  const errors: unknown[][] = []
  const origError = console.error
  const origFetch = globalThis.fetch
  const globals = globalThis as unknown as Record<string, unknown>
  const origPrompt = globals.prompt
  const origDocument = globals.document
  const origNavigator = globals.navigator
  console.error = (...args: unknown[]) => {
    errors.push(args)
  }
  globals.prompt = () => promptAnswer
  Object.defineProperty(globalThis, 'navigator', {
    value: {
      clipboard: {
        writeText: async (text: string) => {
          copies.push(text)
        },
      },
    },
    configurable: true,
  })
  globalThis.fetch = (async (input: string | URL, init?: RequestInit) => {
    const path = String(input)
    if (path.startsWith('/api/spawns')) return { json: async () => ({ spawns }) }
    if (path.startsWith('/api/actions/dispatch')) {
      dispatches.push(JSON.parse(String(init?.body)))
      return { json: async () => ({ action: 'presented', reason: null }) }
    }
    const key = Object.keys(routes)
      .filter((candidate) => path.startsWith(candidate))
      .sort((a, b) => b.length - a.length)[0]
    return { json: async () => (key === undefined ? {} : (routes as Record<string, unknown>)[key]) }
  }) as typeof globalThis.fetch
  globals.document = doc
  try {
    await import('../ui/app.js')
    await new Promise((resolve) => setTimeout(resolve, 50))
    const toggle = doc.getElementById('tray-toggle') as unknown as { click: () => void }
    toggle.click()
    assert.ok(doc.querySelector('.tray-row') !== null, 'tray renders receipts')
    assert.ok(doc.querySelector('.chip-amber') !== null, 'alive chip')

    // attach command copy
    ;(doc.querySelector('[data-copy]') as unknown as { click: () => void }).click()
    await new Promise((resolve) => setTimeout(resolve, 10))
    assert.deepEqual(copies, ['tmux attach -t foc-x'])

    // liveness transition via polling (refresh button triggers the poll path)
    spawns = [spawn({ liveness: 'exited' })]
    ;(doc.getElementById('refresh') as unknown as { click: () => void }).click()
    await new Promise((resolve) => setTimeout(resolve, 20))
    assert.ok(doc.querySelector('.chip-red') !== null, 'exited chip after transition')

    // explain routes through the registry
    ;(
      doc.querySelector('[data-session-action="explain"]') as unknown as { click: () => void }
    ).click()
    await new Promise((resolve) => setTimeout(resolve, 20))
    assert.equal(dispatches.length, 1)
    const explainDispatch = dispatches[0] as Record<string, unknown>
    assert.equal(explainDispatch.verb, 'explain')
    assert.equal(explainDispatch.signalClass, 'session-state')
    assert.equal(explainDispatch.subject, 'foc-x-p0')

    // close demands the exact typed confirmation: wrong -> nothing
    promptAnswer = 'yes'
    ;(
      doc.querySelector('[data-session-action="close-delete"]') as unknown as { click: () => void }
    ).click()
    await new Promise((resolve) => setTimeout(resolve, 20))
    assert.equal(dispatches.length, 1, 'wrong typed intent sends nothing')
    promptAnswer = 'confirm delete foc-x-p0'
    ;(
      doc.querySelector('[data-session-action="close-delete"]') as unknown as { click: () => void }
    ).click()
    await new Promise((resolve) => setTimeout(resolve, 20))
    assert.equal(dispatches.length, 2)
    const closeDispatch = dispatches[1] as Record<string, unknown>
    assert.equal(closeDispatch.verb, 'close-delete')
    assert.equal(closeDispatch.confirmation, 'confirm delete foc-x-p0')
    assert.deepEqual(errors, [], 'zero console errors')
  } finally {
    console.error = origError
    globalThis.fetch = origFetch
    globals.prompt = origPrompt
    globals.document = origDocument
    Object.defineProperty(globalThis, 'navigator', { value: origNavigator, configurable: true })
  }
})
