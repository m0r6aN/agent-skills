import assert from 'node:assert/strict'
import test from 'node:test'
import { JSDOM } from 'jsdom'
import { planSpawn } from '../src/spawn.js'
import {
  BUDGET_PRESETS,
  MODEL_SUGGESTIONS,
  readControls,
  spawnPanelHtml,
  spawnRequest,
} from '../ui/views/spawn-panel.js'
import { mountConsole, signal } from './ui-fixture.js'

const SELECTIONS = [
  {
    verb: 'remediate',
    signal: signal({ id: 'ci', class: 'scm-ci', subject: 'pr/170/red', actions: ['remediate'] }),
    autonomy: { decisions: 'partial', commit: true, push: false, openPr: false, merge: false },
  },
  {
    verb: 'explain',
    signal: signal({ id: 'parcel', subject: 'goal/P1', actions: ['explain'] }),
    autonomy: { decisions: 'full', commit: false, push: false, openPr: false, merge: false },
  },
]

test('shared controls render exactly once; budget presets have no Unlimited; copy says one session/N panes', () => {
  const doc = new JSDOM(spawnPanelHtml({ count: 2 })).window.document
  for (const name of ['harness', 'model', 'thinking', 'budget'])
    assert.equal(doc.querySelectorAll(`[name="${name}"]`).length, 1)
  assert.equal(doc.querySelectorAll('[data-extra-text]').length, 0)
  assert.deepEqual(
    [...doc.querySelectorAll('[name="budget"] option')].map((o) => o.getAttribute('value')),
    [...BUDGET_PRESETS],
  )
  assert.ok(!doc.body.textContent?.includes('Unlimited'))
  assert.match(doc.querySelector('#spawn-run')?.textContent ?? '', /1 session · 2 panes/)
  assert.equal(
    (new JSDOM(spawnPanelHtml()).window.document.querySelector('#spawn-run') as HTMLButtonElement)
      .disabled,
    true,
  )
})

test('composed request feeds the real planner: K explicit actions become one session with K panes', () => {
  const controls = {
    harness: 'pi',
    model: 'anthropic/claude-sonnet-5-5',
    thinking: 'high',
    budget: '$20',
  }
  const extra = 'Preserve existing work first.\nSecond line exactly as typed.'
  const configured = SELECTIONS.map((item, index) => ({
    ...item,
    extraText: index === 0 ? extra : 'Different per-item direction.',
  }))
  const request = spawnRequest(configured, controls)
  assert.deepEqual(request.controls, controls)
  assert.equal(request.actions.length, 2)
  for (const action of request.actions) {
    assert.equal(
      action.extraText,
      action.verb === 'remediate' ? extra : 'Different per-item direction.',
    )
    assert.equal(typeof action.repoRoot, 'string')
    assert.equal(typeof action.autonomy, 'object')
  }
  const plan = planSpawn({
    controls: request.controls,
    actions: request.actions as never,
    now: Date.parse('2026-10-11T12:00:00Z'),
    sessionName: 'foc-ui',
  })
  assert.equal(plan.sessionName, 'foc-ui')
  assert.equal(plan.panes.length, 2)
  assert.ok(plan.panes[0]?.prompt.endsWith(`EXTRA DIRECTION:\n${extra}`))
  assert.ok(plan.panes[1]?.prompt.endsWith('EXTRA DIRECTION:\nDifferent per-item direction.'))
})

test('missing Investigate requires explicit choices; reviewed controls post once and successful selection clears', async () => {
  const ui = await mountConsole({ '/api/signals': { signals: SELECTIONS.map((s) => s.signal) } })
  try {
    ui.click('[data-select-visible]')
    ui.click('#review-launch')
    assert.equal((ui.doc.querySelector('#spawn-run') as HTMLButtonElement).disabled, true)
    ui.input('[data-launch-item="ci"] [data-verb]', 'remediate', 'change')
    ui.input('[data-launch-item="parcel"] [data-verb]', 'explain', 'change')
    assert.equal((ui.doc.querySelector('#spawn-run') as HTMLButtonElement).disabled, false)
    ui.input('[name="model"]', 'opus')
    ui.input('[name="thinking"]', 'xhigh', 'change')
    ui.input('[name="budget"]', '$50', 'change')
    ui.input('[data-launch-item="ci"] [data-extra-text]', 'CI-specific direction.')
    ui.input('[data-launch-item="parcel"] [data-extra-text]', 'Parcel-specific direction.')
    const form = ui.doc.querySelector('#spawn-form') as HTMLFormElement
    assert.equal(readControls(form).harness, 'pi')
    ui.click('#spawn-run')
    await ui.settle()
    const requests = ui.requests.filter((r) => r.path === '/api/spawn')
    assert.equal(requests.length, 1)
    assert.deepEqual(requests[0]?.body?.controls, {
      harness: 'pi',
      model: 'opus',
      thinking: 'xhigh',
      budget: '$50',
    })
    const actions = requests[0]?.body?.actions as Record<string, unknown>[]
    assert.deepEqual(
      actions.map((a) => a.verb),
      ['remediate', 'explain'],
    )
    assert.deepEqual(
      actions.map((a) => a.extraText),
      ['CI-specific direction.', 'Parcel-specific direction.'],
    )
    assert.equal(ui.doc.querySelectorAll('[data-select]:checked').length, 0)
    assert.equal((ui.doc.querySelector('#selection-bar') as HTMLElement).hidden, true)
  } finally {
    ui.close()
  }
})

test('AC11: pi model suggestions and default are provider-qualified; claude keeps its aliases', () => {
  const piDefault = new JSDOM(spawnPanelHtml()).window.document.querySelector(
    '[name="model"]',
  ) as HTMLInputElement
  assert.equal(piDefault.value, 'anthropic/claude-sonnet-5-5')
  for (const id of MODEL_SUGGESTIONS)
    assert.match(id, /^[^/\s]+\/\S+$/, `${id} must be provider/model`)
  const claude = new JSDOM(spawnPanelHtml({ controls: { harness: 'claude' } })).window.document
  assert.equal((claude.querySelector('[name="model"]') as HTMLInputElement).value, 'sonnet')
})
