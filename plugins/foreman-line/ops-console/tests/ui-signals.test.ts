import assert from 'node:assert/strict'
import test from 'node:test'
import { JSDOM } from 'jsdom'
import { ACTION_REGISTRY } from '../src/actions.js'
import {
  allowedVerbs,
  confirmationToken,
  selectionToActions,
  signalsHtml,
} from '../ui/views/signals.js'

/**
 * FCA-P6 signals view (Task 16): registered verb buttons only (the matrix is
 * the intersection of what a signal offers and what ACTION_REGISTRY allows —
 * unregistered pairs are absent, never disabled), N selections carry N
 * actions with per-action autonomy, and destructive verbs require the exact
 * typed confirmation before ANY request leaves the browser.
 */

const REGISTRY = ACTION_REGISTRY.map((spec) => ({
  verb: spec.verb,
  signalClasses: spec.signalClasses,
  invocation: spec.invocation,
  destructive: spec.destructive,
  autonomy: spec.autonomy,
}))

interface TestSignal {
  [key: string]: unknown
  id: string
  class: string
  severity: string
  repo: string
  subject: string
  evidence: string[]
  detectedAt: string
  actions: string[]
}

const SIGNALS: TestSignal[] = [
  {
    id: 'release-hygiene:/repos/x:plugins/x/README.md',
    class: 'release-hygiene',
    severity: 'attention',
    repo: '/repos/x',
    subject: 'plugins/x/README.md',
    evidence: ['plugins/x/README.md: 0.9.9', 'canonical: manifest = 2.0.0'],
    detectedAt: '2026-10-11T12:00:00.000Z',
    actions: ['remediate', 'investigate', 'explain'],
  },
  {
    id: 'scm-ci:/repos/x:pr/166/do-not-merge',
    class: 'scm-ci',
    severity: 'attention',
    repo: '/repos/x',
    subject: 'pr/166/do-not-merge',
    evidence: ['gh: PR #166 checks green; do not merge marker'],
    detectedAt: '2026-10-11T12:00:00.000Z',
    actions: ['investigate', 'remediate', 'explain', 'close-delete'],
  },
]

test('only registered (class x verb) pairs render buttons — absent, not disabled', () => {
  const [hygiene, scm] = SIGNALS as [TestSignal, TestSignal]
  assert.deepEqual(
    allowedVerbs(hygiene, REGISTRY).sort(),
    ['explain', 'investigate', 'remediate'],
    'release-hygiene never gets close-delete even though the signal model is generic',
  )
  assert.deepEqual(
    allowedVerbs(scm, REGISTRY).sort(),
    ['close-delete', 'explain', 'investigate', 'remediate'],
    'scm-ci keeps its destructive verb',
  )
  const dom = new JSDOM(`<div>${signalsHtml(SIGNALS, REGISTRY)}</div>`)
  const doc = dom.window.document
  const hygieneRow = doc.querySelector('[data-class="release-hygiene"]') as unknown as {
    querySelectorAll: (sel: string) => unknown[]
    querySelector: (sel: string) => unknown
  }
  assert.equal(hygieneRow.querySelectorAll('[data-verb]').length, 3)
  assert.equal(hygieneRow.querySelector('[data-verb="close-delete"]'), null, 'absent, not disabled')
  assert.equal(hygieneRow.querySelectorAll('button[disabled]').length, 0)
  const scmClose = doc.querySelector(
    '[data-class="scm-ci"] [data-verb="close-delete"]',
  ) as unknown as {
    getAttribute: (name: string) => string | null
  } | null
  assert.ok(scmClose !== null)
  assert.equal(scmClose.getAttribute('data-destructive'), 'true')
})

test('N selected rows -> request carries N actions with per-action autonomy', () => {
  const [hygiene, scm] = SIGNALS as [TestSignal, TestSignal]
  const payloads = selectionToActions([
    {
      signal: hygiene,
      verb: 'investigate',
      autonomy: { decisions: 'partial', commit: false, push: false, openPr: false, merge: false },
    },
    {
      signal: scm,
      verb: 'remediate',
      autonomy: { decisions: 'full', commit: true, push: false, openPr: false, merge: false },
      extraText: 'preserve existing work first',
    },
  ])
  assert.equal(payloads.length, 2)
  const first = payloads[0] as Record<string, unknown>
  const second = payloads[1] as Record<string, unknown>
  assert.equal(first.signalClass, 'release-hygiene')
  assert.deepEqual(second.autonomy, {
    decisions: 'full',
    commit: true,
    push: false,
    openPr: false,
    merge: false,
  })
  assert.equal(second.extraText, 'preserve existing work first')
  assert.deepEqual(first.evidence, hygiene.evidence)
})

test('destructive actions demand the exact typed confirmation before any request is sent', async () => {
  const dom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>', {
    url: 'http://localhost/',
  })
  const doc = dom.window.document
  const dispatches: Array<Record<string, unknown>> = []
  const routes: Record<string, unknown> = {
    '/api/health': { ok: true, repoRoot: '/repos/x', posture: 'test' },
    '/api/goals': { goals: [], statuses: [] },
    '/api/parcels': {
      goal: { slug: 'g', loopDirectiveRef: 'x.md' },
      parcels: [],
      unmappedChains: [],
    },
    '/api/alerts': { alerts: [], remedies: [], notifications: [] },
    '/api/routing': { policy: { classes: [], roles: [] }, parcels: [] },
    '/api/signals': { signals: SIGNALS },
    '/api/actions': { actions: REGISTRY },
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
    ;(
      doc.querySelector('.nav-btn[data-view="signals"]') as unknown as { click: () => void }
    ).click()
    await new Promise((resolve) => setTimeout(resolve, 20))

    // AC1 in the live DOM
    assert.equal(
      doc.querySelector('[data-class="release-hygiene"] [data-verb="close-delete"]'),
      null,
    )

    // Non-destructive: investigate dispatches immediately after the popover
    ;(
      doc.querySelector('[data-class="scm-ci"] [data-verb="investigate"]') as unknown as {
        click: () => void
      }
    ).click()
    const form = doc.querySelector('form.action-popover') as unknown as {
      querySelector: (
        sel: string,
      ) => { click: () => void; value: string; hidden: boolean; checked: boolean } | null
    } | null
    assert.ok(form !== null, 'popover opens with the autonomy envelope')
    form.querySelector('button[type="submit"]')?.click()
    await new Promise((resolve) => setTimeout(resolve, 20))
    assert.equal(dispatches.length, 1)
    const firstDispatch = dispatches[0] as Record<string, unknown>
    assert.equal(firstDispatch.verb, 'investigate')
    assert.equal(typeof firstDispatch.autonomy, 'object')

    // Destructive: wrong token -> NO request; exact token -> request carries it
    ;(
      doc.querySelector('[data-class="scm-ci"] [data-verb="close-delete"]') as unknown as {
        click: () => void
      }
    ).click()
    const destructive = doc.querySelector(
      'form.action-popover[data-destructive="true"]',
    ) as unknown as {
      querySelector: (
        sel: string,
      ) => { click: () => void; value: string; hidden: boolean; checked: boolean } | null
    } | null
    assert.ok(destructive !== null)
    const input = destructive.querySelector('[name="confirmation"]')
    assert.ok(input !== null)
    input.value = 'yes please'
    destructive.querySelector('button[type="submit"]')?.click()
    await new Promise((resolve) => setTimeout(resolve, 20))
    assert.equal(dispatches.length, 1, 'wrong confirmation sends NOTHING')
    assert.equal(
      destructive.querySelector('[data-confirm-error]')?.hidden,
      false,
      'the refusal is visible in the UI',
    )
    input.value = confirmationToken('pr/166/do-not-merge')
    destructive.querySelector('button[type="submit"]')?.click()
    await new Promise((resolve) => setTimeout(resolve, 20))
    assert.equal(dispatches.length, 2)
    const secondDispatch = dispatches[1] as Record<string, unknown>
    assert.equal(secondDispatch.confirmation, 'confirm delete pr/166/do-not-merge')
    assert.equal(secondDispatch.verb, 'close-delete')

    // Shift-select ranges feed the spawn queue with per-action autonomy
    const boxes = [...doc.querySelectorAll('[data-select]')] as unknown as Array<{
      click: () => void
      dispatchEvent: (event: unknown) => void
      checked: boolean
    }>
    const firstBox = boxes[0] as (typeof boxes)[number]
    const secondBox = boxes[1] as (typeof boxes)[number]
    firstBox.click()
    const evt = new dom.window.MouseEvent('click', { bubbles: true, shiftKey: true })
    secondBox.dispatchEvent(evt)
    assert.equal(boxes.filter((b) => b.checked).length, 2)
    const panel = doc.getElementById('spawn-panel')?.textContent ?? ''
    assert.ok(panel.includes('spawn 2 sessions'), panel)
    assert.deepEqual(errors, [], 'zero console errors')
  } finally {
    console.error = origError
    globalThis.fetch = origFetch
    globals.document = origDocument
  }
})
