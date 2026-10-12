import assert from 'node:assert/strict'
import test from 'node:test'
import { JSDOM } from 'jsdom'
import { planSpawn } from '../src/spawn.js'
import {
  BUDGET_PRESETS,
  readControls,
  spawnPanelHtml,
  spawnRequest,
} from '../ui/views/spawn-panel.js'

/**
 * FCA-P6 spawn panel (Task 17): the four shared controls render exactly ONCE
 * (never repeated per action), the budget presets are the owner's hard max-USD
 * set with NO Unlimited option, and the composed request feeds planSpawn
 * verbatim — K selected actions become one session with K panes.
 */

const SELECTIONS = [
  {
    verb: 'remediate',
    signal: {
      class: 'scm-ci',
      subject: 'pr/170/red',
      evidence: ['gh: PR #170 mergeable CONFLICTING'],
      repo: '/repos/agent-skills',
      actions: ['remediate'],
    },
    autonomy: { decisions: 'partial', commit: true, push: false, openPr: false, merge: false },
    extraText: null,
  },
  {
    verb: 'explain',
    signal: {
      class: 'parcel-state',
      subject: 'goal/P1',
      evidence: ['docs/goals/goal/loop-directive.md'],
      repo: '/repos/agent-skills',
      actions: ['explain'],
    },
    autonomy: { decisions: 'full', commit: false, push: false, openPr: false, merge: false },
    extraText: null,
  },
]

test('shared controls render exactly once; budget presets have no Unlimited', () => {
  const dom = new JSDOM(`<div>${spawnPanelHtml({ count: 2 })}</div>`)
  const doc = dom.window.document
  for (const name of ['harness', 'model', 'thinking', 'budget']) {
    assert.equal(doc.querySelectorAll(`[name="${name}"]`).length, 1, `${name} appears once`)
    assert.equal(doc.querySelectorAll(`[name="${name}"]`).length !== 0, true)
  }
  assert.equal(doc.querySelectorAll('[name="extra"]').length, 1, 'textbox shared, not per action')
  const budgets = [...doc.querySelectorAll('[name="budget"] option')].map((o) =>
    o.getAttribute('value'),
  )
  assert.deepEqual(budgets, [...BUDGET_PRESETS])
  assert.equal(budgets.includes('Unlimited'), false, 'Unlimited is withdrawn (owner revision)')
  assert.ok(
    doc.querySelector('#spawn-run')?.textContent.includes('spawn 2 sessions'),
    'the button counts selected actions',
  )
  const empty = new JSDOM(`<div>${spawnPanelHtml({ count: 0 })}</div>`)
  assert.equal(
    (empty.window.document.querySelector('#spawn-run') as unknown as { disabled: boolean })
      .disabled,
    true,
    'nothing selected, nothing spammable',
  )
})

test('the composed request feeds the FCA-P5 planner verbatim: K actions -> 1 session, K panes', () => {
  const controls = { harness: 'pi', model: 'claude-sonnet-5-5', thinking: 'high', budget: '$20' }
  const extra = 'Preserve existing work first.\nSecond line exactly as typed.'
  const request = spawnRequest(SELECTIONS, controls, extra)
  assert.deepEqual(request.controls, controls)
  assert.equal(request.actions.length, 2)
  for (const action of request.actions) {
    assert.equal(action.extraText, extra, 'shared textbox applied verbatim to every action')
    assert.equal(typeof action.repoRoot, 'string')
    assert.equal(typeof action.autonomy, 'object')
  }
  const plan = planSpawn({
    controls: request.controls,
    actions: request.actions as never,
    now: Date.parse('2026-10-11T12:00:00.000Z'),
    sessionName: 'foc-ui',
  })
  assert.equal(plan.sessionName, 'foc-ui')
  assert.equal(plan.panes.length, 2, 'one pane per selected action')
  assert.equal(plan.harness, 'pi')
  const secondPane = plan.panes[1] as (typeof plan.panes)[number]
  assert.ok(secondPane.prompt.endsWith(`EXTRA DIRECTION:\n${extra}`))
})

test('spawn button posts the request: shared controls + K actions, selections clear on success', async () => {
  const dom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>', {
    url: 'http://localhost/',
  })
  const doc = dom.window.document
  const spawns: Array<{
    controls: Record<string, string>
    actions: Array<Record<string, unknown>>
  }> = []
  const routes = {
    '/api/health': { ok: true, repoRoot: '/repos/x', posture: 'test' },
    '/api/goals': {
      goals: [],
      statuses: [
        {
          key: 'g',
          tree: null,
          active: true,
          urgentSubjects: [],
          attention: {
            hung: 0,
            failed: 0,
            awaitingGate: 0,
            ratificationPending: 0,
            ratificationUnknown: 0,
            signals: { info: 0, attention: 0, urgent: 0 },
            total: 0,
          },
        },
      ],
    },
    '/api/parcels': {
      goal: { slug: 'g', loopDirectiveRef: 'x.md' },
      parcels: [],
      unmappedChains: [],
    },
    '/api/alerts': { alerts: [], remedies: [], notifications: [] },
    '/api/routing': { policy: { classes: [], roles: [] }, parcels: [] },
    '/api/signals': {
      signals: SELECTIONS.map((selection, index) => ({
        id: `id-${index}`,
        class: selection.signal.class,
        severity: 'attention',
        repo: selection.signal.repo,
        subject: selection.signal.subject,
        evidence: selection.signal.evidence,
        detectedAt: '2026-10-11T12:00:00.000Z',
        actions: selection.signal.actions,
      })),
    },
    '/api/actions': {
      actions: [
        {
          verb: 'remediate',
          signalClasses: ['scm-ci', 'parcel-state'],
          invocation: 'spawn',
          destructive: false,
          autonomy: {
            decisions: 'partial',
            commit: true,
            push: false,
            openPr: false,
            merge: false,
          },
        },
        {
          verb: 'explain',
          signalClasses: ['scm-ci', 'parcel-state'],
          invocation: 'spawn',
          destructive: false,
          autonomy: {
            decisions: 'partial',
            commit: false,
            push: false,
            openPr: false,
            merge: false,
          },
        },
      ],
    },
  }
  const errors: unknown[][] = []
  const origError = console.error
  const origFetch = globalThis.fetch
  const globals = globalThis as unknown as Record<string, unknown>
  const origDocument = globals.document
  console.error = (...args: unknown[]) => {
    errors.push(args)
  }
  globalThis.fetch = (async (input: string | URL, init?: RequestInit) => {
    const path = String(input)
    if (path.startsWith('/api/spawn')) {
      spawns.push(JSON.parse(String(init?.body)))
      return {
        json: async () => ({
          ok: true,
          plan: { sessionName: 'foc-x' },
          launch: { launched: [0, 1] },
        }),
      }
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
    ;(
      doc.querySelector('.nav-btn[data-view="signals"]') as unknown as { click: () => void }
    ).click()
    await new Promise((resolve) => setTimeout(resolve, 20))
    const boxes = [...doc.querySelectorAll('[data-select]')] as unknown as Array<{
      click: () => void
      checked: boolean
    }>
    const firstBox = boxes[0] as (typeof boxes)[number]
    const secondBox = boxes[1] as (typeof boxes)[number]
    firstBox.click()
    secondBox.click()
    const form = doc.getElementById('spawn-form') as unknown as {
      querySelector: (sel: string) => { value: string; checked: boolean } | null
    }
    assert.equal(readControls(form).harness, 'pi')
    const model = form.querySelector('[name="model"]')
    const thinking = form.querySelector('[name="thinking"]')
    const budget = form.querySelector('[name="budget"]')
    const extra = form.querySelector('[name="extra"]')
    assert.ok(model && thinking && budget && extra)
    model.value = 'opus'
    thinking.value = 'xhigh'
    budget.value = '$50'
    extra.value = 'Keep existing work first.'
    ;(doc.getElementById('spawn-run') as unknown as { click: () => void }).click()
    await new Promise((resolve) => setTimeout(resolve, 30))
    assert.equal(spawns.length, 1, 'exactly one spawn request')
    const spawnBody = spawns[0] as (typeof spawns)[number]
    assert.deepEqual(spawnBody.controls, {
      harness: 'pi',
      model: 'opus',
      thinking: 'xhigh',
      budget: '$50',
    })
    assert.equal(spawnBody.actions.length, 2, 'K selected actions ride one request')
    for (const action of spawnBody.actions) {
      assert.equal(
        action.extraText,
        'Keep existing work first.',
        'textbox verbatim on every action',
      )
    }
    assert.equal(
      boxes.filter((b) => b.checked).length,
      0,
      'selections clear after a successful spawn',
    )
    assert.deepEqual(errors, [], 'zero console errors')
  } finally {
    console.error = origError
    globalThis.fetch = origFetch
    globals.document = origDocument
  }
})
