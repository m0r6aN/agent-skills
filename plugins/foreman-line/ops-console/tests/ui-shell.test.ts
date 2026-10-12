import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { JSDOM } from 'jsdom'
import { SEVERITIES, shellHtml, VIEWS } from '../ui/views/shell.js'

/**
 * FCA-P6 control-center shell (Task 15): the full-viewport layout (header,
 * rail, dense main, persistent spawn panel, collapsible session tray), view
 * navigation across all seven views, the a11y floor (named, keyboard-reachable
 * controls), and an end-to-end render against a mocked fetch with zero console
 * errors. The 1920x1080 no-scroll property is enforced structurally here
 * (100vh + overflow hidden + grid areas) and completed by the visual
 * checklist in Task 19.
 */

test('shell renders every slot: header, rail, seven views, spawn panel, collapsed tray', () => {
  const dom = new JSDOM(
    `<div id="app">${shellHtml({ posture: 'test posture', activeView: 'board' })}</div>`,
  )
  const doc = dom.window.document
  assert.ok(doc.querySelector('header') !== null)
  assert.ok(doc.querySelector('nav.rail') !== null)
  assert.ok(doc.querySelector('main#main') !== null)
  assert.ok(doc.querySelector('aside.spawn #spawn-panel') !== null)
  const toggle = doc.getElementById('tray-toggle')
  assert.ok(toggle !== null)
  assert.equal(toggle.getAttribute('aria-expanded'), 'false')
  assert.equal(doc.getElementById('tray-body')?.hidden, true)
  const navButtons = [...doc.querySelectorAll('.nav-btn')]
  assert.deepEqual(
    navButtons.map((btn) => btn.getAttribute('data-view')),
    VIEWS.map(([id]) => id),
  )
  assert.equal(navButtons[0]?.getAttribute('aria-current'), 'page')
  for (const [id] of VIEWS) {
    assert.ok(
      doc.querySelector(`main > section[data-view="${id}"]`) !== null,
      `${id} section exists`,
    )
  }
  for (const sev of SEVERITIES) {
    assert.ok(doc.querySelector(`input[data-sev="${sev}"]`) !== null, `${sev} filter exists`)
  }
})

test('a11y floor: every control is named and keyboard-reachable', () => {
  const dom = new JSDOM(`<div id="app">${shellHtml({})}</div>`)
  const doc = dom.window.document
  for (const button of doc.querySelectorAll('button')) {
    const named =
      (button.textContent ?? '').trim().length > 0 ||
      (button.getAttribute('aria-label') ?? '').length > 0
    assert.ok(named, `button named: ${button.outerHTML.slice(0, 60)}`)
    assert.notEqual(button.getAttribute('tabindex'), '-1', 'buttons stay tab-reachable')
  }
  assert.ok(doc.querySelector('#global-search[aria-label]') !== null)
  assert.ok(doc.querySelector('#fleet-select[aria-label]') !== null)
})

test('density baseline is structural: full-viewport grid, page never scrolls', () => {
  const html = readFileSync(new URL('../ui/index.html', import.meta.url), 'utf8')
  assert.ok(/#app\s*\{[^}]*display:\s*grid/s.test(html), '#app is the grid container')
  assert.ok(/grid-template-areas/.test(html))
  assert.ok(/height:\s*100vh/.test(html))
  assert.ok(/overflow:\s*hidden/.test(html), 'the page itself never scrolls')
  assert.ok(/:focus-visible/.test(html), 'focus rings are styled')
})

test('end-to-end: all views render against mocked fetch with zero console errors', async () => {
  const dom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>', {
    url: 'http://localhost/',
  })
  const doc = dom.window.document
  const attention = {
    hung: 1,
    failed: 0,
    awaitingGate: 0,
    ratificationPending: 0,
    ratificationUnknown: 0,
    signals: { info: 0, attention: 0, urgent: 1 },
    total: 1,
  }
  const routes = {
    '/api/health': { ok: true, console: 'x', repoRoot: '/repos/x', posture: 'test posture' },
    '/api/goals': {
      goals: [{ slug: 'g1' }],
      statuses: [{ key: 'g1', tree: null, active: true, urgentSubjects: [], attention }],
    },
    '/api/parcels': {
      goal: { slug: 'g1', loopDirectiveRef: 'docs/goals/g1/loop-directive.md' },
      parcels: [
        {
          parcel: 'P1',
          state: 'hung',
          rule: 'R4',
          chainEvidence: 'absent',
          specRef: null,
          specLocation: 'none',
          chain: null,
          flags: ['duplicate-chain'],
          failure: { code: 'chain-invalid', detail: 'd' },
          heartbeat: { lastProgressAt: null },
          liveness: { live: false },
          gates: {
            G1: { gate: 'G1', status: 'pending', detail: '' },
            G2: { gate: 'G2', status: 'unknown', detail: '' },
            G3: { gate: 'G3', status: 'unknown', detail: '' },
          },
        },
      ],
      unmappedChains: [],
    },
    '/api/alerts': { alerts: [], remedies: [], notifications: [] },
    '/api/routing': { policy: { classes: [], roles: [] }, parcels: [] },
    '/api/parcels/P1/logs': { chainDocuments: [], invocationAudit: [], stateLines: [] },
  }
  const errors: unknown[] = []
  const origError = console.error
  const origFetch = globalThis.fetch
  const globals = globalThis as unknown as Record<string, unknown>
  const origDocument = globals.document
  console.error = (...args: unknown[]) => {
    errors.push(args)
  }
  globalThis.fetch = (async (input: string | URL) => {
    const path = String(input)
    const key = Object.keys(routes)
      .filter((candidate) => path.startsWith(candidate))
      .sort((a, b) => b.length - a.length)[0]
    return { json: async () => (key === undefined ? {} : routes[key as keyof typeof routes]) }
  }) as typeof globalThis.fetch
  globals.document = doc
  try {
    await import('../ui/app.js')
    await new Promise((resolve) => setTimeout(resolve, 50))
    assert.ok(doc.querySelector('#board .card') !== null, 'board renders cards')
    assert.ok(doc.querySelector('.card.needs-red') !== null, 'hung card gets needs-red')
    for (const [id] of VIEWS) {
      const btn = doc.querySelector(`.nav-btn[data-view="${id}"]`) as unknown as {
        click: () => void
        getAttribute: (name: string) => string | null
      }
      assert.ok(btn !== null, `nav button for ${id}`)
      btn.click()
      const section = doc.querySelector(`main > section[data-view="${id}"]`) as unknown as {
        hidden: boolean
      }
      assert.equal(section.hidden, false, `${id} visible after click`)
      assert.equal(btn.getAttribute('aria-current'), 'page')
    }
    // Settle async view loads (the signals loader runs on first visit) before
    // teardown — post-teardown DOM access would be an unhandled rejection.
    await new Promise((resolve) => setTimeout(resolve, 20))
    const trayToggle = doc.getElementById('tray-toggle') as unknown as {
      click: () => void
      getAttribute: (name: string) => string | null
    }
    trayToggle.click()
    assert.equal(trayToggle.getAttribute('aria-expanded'), 'true')
    assert.equal(
      (doc.getElementById('tray-body') as unknown as { hidden: boolean }).hidden,
      false,
      'tray expands',
    )
    assert.deepEqual(errors, [], 'zero console errors during full render + navigation')
  } finally {
    console.error = origError
    globalThis.fetch = origFetch
    globals.document = origDocument
  }
})
