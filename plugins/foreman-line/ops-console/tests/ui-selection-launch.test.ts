import assert from 'node:assert/strict'
import test from 'node:test'
import { ACTION_REGISTRY } from '../src/actions.js'
import {
  actionSignature,
  eligibleActions,
  reconcileSelection,
  selectTarget,
} from '../ui/views/selection.js'
import { mountConsole, signal } from './ui-fixture.js'

const signals = [signal(), signal({ id: 's2', subject: 'g/P2' })]

test('bulk eligibility excludes destructive/present/unregistered actions; never chooses first entry', () => {
  const registry = [...ACTION_REGISTRY].reverse()
  assert.deepEqual(
    eligibleActions(signal(), registry)
      .map((e) => e.verb)
      .sort(),
    ['explain', 'investigate', 'remediate'],
  )
  assert.equal(selectTarget(signal(), registry).verb, 'investigate')
  assert.equal(selectTarget(signal({ actions: ['remediate'] }), registry).verb, null)
  assert.equal(
    eligibleActions(
      signal(),
      registry.map((e) => ({ ...e, invocation: 'present' })),
    ).length,
    0,
  )
})

test('refresh retains identity-based selection, marks disappearing/actions/defaults for review', () => {
  const chosen = selectTarget(signal(), ACTION_REGISTRY)
  const map = new Map([[chosen.signal.id, chosen]])
  reconcileSelection(map, [], ACTION_REGISTRY)
  assert.match(map.get(chosen.signal.id)?.unavailable ?? '', /no longer/)
  reconcileSelection(map, [signal()], ACTION_REGISTRY)
  assert.equal(map.get(chosen.signal.id)?.unavailable, null)
  const changed = ACTION_REGISTRY.map((e) => ({ ...e, autonomy: { ...e.autonomy, commit: true } }))
  reconcileSelection(map, [signal()], changed)
  assert.equal(map.get(chosen.signal.id)?.needsReview, true)
  assert.equal(map.get(chosen.signal.id)?.autonomy.commit, false, 'never silently widens')
  assert.notEqual(actionSignature(changed[0]), chosen.signature)
  reconcileSelection(map, [signal({ repo: '/other' })], ACTION_REGISTRY)
  assert.match(map.get(chosen.signal.id)?.unavailable ?? '', /identity/)
})

test('selection and launch draft survive filters/navigation/refresh; launch uses one request and explicit autonomy', async () => {
  const ui = await mountConsole({ '/api/signals': { signals } })
  try {
    ui.click('[data-select]')
    ui.click('#signals-body [data-select-visible]')
    assert.match(ui.doc.querySelector('#selection-summary')?.textContent ?? '', /2/)
    ui.click('#review-launch')
    assert.equal(ui.doc.querySelectorAll('[name="harness"]').length, 1)
    assert.equal(ui.doc.querySelectorAll('[data-launch-item]').length, 2)
    ui.input('[name="extra"]', 'Preserve existing work.')
    ui.input('[name="model"]', 'opus', 'change')
    ui.input('[data-launch-item] [data-verb]', 'remediate', 'change')
    ui.click('[data-launch-item] [data-permission="push"]')
    ui.click('[data-close-dialog]')
    ui.input('#global-search', 'nothing')
    ui.click('[data-view="sessions"].nav-btn')
    await ui.app.refresh()
    ui.click('#review-launch')
    assert.equal(
      (ui.doc.querySelector('[name="extra"]') as HTMLTextAreaElement).value,
      'Preserve existing work.',
    )
    assert.equal((ui.doc.querySelector('[name="model"]') as HTMLSelectElement).value, 'opus')
    assert.equal((ui.doc.querySelector('[data-verb]') as HTMLSelectElement).value, 'remediate')
    ui.click('#spawn-run')
    ui.click('#spawn-run')
    await ui.settle()
    const posts = ui.requests.filter((r) => r.path === '/api/spawn')
    assert.equal(posts.length, 1, 'duplicate clicks guarded')
    const body = posts[0]?.body as {
      controls: { model: string }
      actions: { verb: string; autonomy: { push: boolean; merge: boolean }; extraText: string }[]
    }
    assert.equal(body.controls.model, 'opus')
    assert.equal(body.actions.length, 2)
    assert.equal(body.actions[0]?.verb, 'remediate')
    assert.equal(body.actions[0]?.autonomy.push, true)
    assert.equal(body.actions[0]?.autonomy.merge, false)
    assert.equal(body.actions[1]?.verb, 'investigate')
    assert.equal(body.actions[0]?.extraText, 'Preserve existing work.')
    assert.match(ui.doc.querySelector('#launch-outcome')?.textContent ?? '', /foc-new/)
    assert.equal(ui.doc.querySelector('#launch-dialog')?.hasAttribute('open'), false)
  } finally {
    ui.close()
  }
})

test('parcel selection joins exact goal-qualified subject and repository; no guessed action for unmapped parcel', async () => {
  const ui = await mountConsole({
    '/api/signals': {
      signals: [signal(), signal({ id: 'wrong-root', repo: '/other', subject: 'g/P1' })],
    },
  })
  try {
    ui.click('[data-view="board"].nav-btn')
    await ui.settle()
    const boxes = ui.doc.querySelectorAll('#board [data-select]')
    assert.equal(boxes.length, 1)
    assert.equal(boxes[0]?.getAttribute('data-select'), signal().id)
    ui.click('#board [data-select]')
    ui.click('#review-launch')
    assert.match(ui.doc.querySelector('[data-launch-item]')?.textContent ?? '', /\/repos\/x/)
    ui.click('[data-close-dialog]')
    ui.routes['/api/signals'] = { signals: [signal({ subject: 'other/P1' })] }
    await ui.app.refresh()
    assert.equal(ui.doc.querySelectorAll('#board [data-select]').length, 0)
    assert.match(ui.doc.querySelector('#board')?.textContent ?? '', /No supported action/)
    ui.click('#review-launch')
    assert.equal((ui.doc.querySelector('#spawn-run') as HTMLButtonElement).disabled, true)
  } finally {
    ui.close()
  }
})

test('failed launch keeps draft, explains uncertainty, does not retry; escape returns focus', async () => {
  const ui = await mountConsole({ '/api/spawn': new Error('Connection lost') })
  try {
    ui.click('[data-select]')
    ui.click('#review-launch')
    ui.input('[name="extra"]', 'Keep me')
    ui.click('#spawn-run')
    await ui.settle()
    assert.match(ui.doc.querySelector('#spawn-result')?.textContent ?? '', /may have started/i)
    assert.equal(ui.requests.filter((r) => r.path === '/api/spawn').length, 1)
    ui.doc
      .querySelector('#launch-dialog')
      ?.dispatchEvent(new ui.dom.window.Event('cancel', { cancelable: true }))
    assert.equal(ui.doc.activeElement?.id, 'review-launch')
    ui.click('#review-launch')
    assert.equal((ui.doc.querySelector('[name="extra"]') as HTMLTextAreaElement).value, 'Keep me')
  } finally {
    ui.close()
  }
})
