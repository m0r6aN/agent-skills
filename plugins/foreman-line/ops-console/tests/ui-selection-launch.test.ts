import assert from 'node:assert/strict'
import test from 'node:test'
import { ACTION_REGISTRY } from '../src/actions.js'
import {
  actionSignature,
  applyToSelection,
  eligibleActions,
  reconcileSelection,
  selectTarget,
  useSuggestedSettings,
} from '../ui/views/selection.js'
import { mountConsole, signal } from './ui-fixture.js'

const signals = [signal(), signal({ id: 's2', subject: 'g/P2' })]

test('bulk applies to every selected page, skips flagged/incompatible targets and keeps merge human-owned', () => {
  const selected = new Map(
    Array.from({ length: 203 }, (_, i) => {
      const item = selectTarget(
        signal({ id: `bulk-${i}`, actions: i === 201 ? ['investigate'] : signal().actions }),
        ACTION_REGISTRY,
      )
      if (i === 202) item.unavailable = 'Missing finding'
      return [item.signal.id, item]
    }),
  )
  assert.deepEqual(applyToSelection(selected, ACTION_REGISTRY, { verb: 'remediate' }), {
    updated: 201,
    skipped: 2,
  })
  assert.equal(selected.get('bulk-200')?.verb, 'remediate')
  assert.match(selected.get('bulk-201')?.bulkIssue || '', /not offered/)
  assert.equal(selected.get('bulk-202')?.unavailable, 'Missing finding')
  assert.deepEqual(
    applyToSelection(selected, ACTION_REGISTRY, {
      autonomy: { decisions: 'full', commit: true, push: true, openPr: true, merge: true },
    }),
    { updated: 201, skipped: 2 },
  )
  assert.equal(selected.get('bulk-200')?.autonomy.push, true)
  assert.equal(selected.get('bulk-200')?.autonomy.merge, false)
})

test('suggestions preserve manual action/permission choices, never widen, and leave changed defaults for review', () => {
  const item = selectTarget(signal(), ACTION_REGISTRY)
  const selected = new Map([[item.signal.id, item]])
  applyToSelection(selected, ACTION_REGISTRY, { verb: 'remediate' })
  assert.equal(item.autonomy.commit, false, 'action changes do not widen permissions')
  applyToSelection(selected, ACTION_REGISTRY, { autonomy: { ...item.autonomy, push: true } })
  assert.deepEqual(useSuggestedSettings(selected, ACTION_REGISTRY), { updated: 0, skipped: 1 })
  assert.equal(item.verb, 'remediate')
  assert.equal(item.autonomy.push, true)
  item.needsReview = true
  assert.deepEqual(applyToSelection(selected, ACTION_REGISTRY, { verb: 'explain' }), {
    updated: 0,
    skipped: 1,
  })
  assert.equal(item.needsReview, true)
  assert.deepEqual(useSuggestedSettings(selected, ACTION_REGISTRY), { updated: 0, skipped: 1 })
})

test('review bulk controls cover hidden pages and suggestions do not erase manual drafts', async () => {
  const many = Array.from({ length: 201 }, (_, i) => signal({ id: `s${i}`, subject: `g/P${i}` }))
  const ui = await mountConsole({ '/api/signals': { signals: many } })
  try {
    ui.click('#signals-body [data-select-visible]')
    ui.click('#signals-body [data-page="next"]')
    ui.click('#signals-body [data-select-visible]')
    ui.click('#review-launch')
    assert.equal((ui.doc.querySelector('[data-suggested]') as HTMLInputElement).checked, true)
    ui.input('[data-bulk-verb]', 'explain', 'change')
    ;(ui.doc.querySelector('[data-apply-actions]') as HTMLButtonElement).focus()
    ui.click('[data-apply-actions]')
    assert.equal(ui.doc.activeElement?.hasAttribute('data-apply-actions'), true)
    assert.match(ui.doc.querySelector('#bulk-result')?.textContent || '', /201 updated.*0 skipped/)
    ui.click('[data-bulk-permission="push"]')
    ui.click('[data-apply-permissions]')
    ui.click('[data-suggested]')
    ui.click('[data-suggested]')
    ui.click('#spawn-form [data-page="next"]')
    assert.equal(
      (ui.doc.querySelector('#launch-items [data-verb]') as HTMLSelectElement).value,
      'explain',
    )
    assert.equal(
      (ui.doc.querySelector('[data-permission="push"]') as HTMLInputElement).checked,
      true,
    )
    ui.click('#spawn-run')
    await ui.settle()
    const body = ui.requests.find((r) => r.path === '/api/spawn')?.body as {
      actions: { verb: string; autonomy: { push: boolean; merge: boolean } }[]
    }
    assert.equal(body.actions.length, 201)
    assert.ok(
      body.actions.every((a) => a.verb === 'explain' && a.autonomy.push && !a.autonomy.merge),
    )
  } finally {
    ui.close()
  }
})

test('contextual help contains contract caveats, traps keyboard focus and returns without losing launch drafts', async () => {
  const ui = await mountConsole()
  try {
    ;(ui.doc.querySelector('#workflow-help') as HTMLButtonElement).focus()
    ui.click('#workflow-help')
    const help = ui.doc.querySelector('#help-dialog') as HTMLDialogElement
    assert.equal(help.hasAttribute('open'), true)
    assert.match(help.textContent || '', /Full.*Partial/s)
    assert.match(help.textContent || '', /prompt guidance.*not.*backend.*sandbox/s)
    assert.match(help.textContent || '', /separate.*Git permissions/s)
    assert.match(help.textContent || '', /one tmux session/s)
    help.dispatchEvent(new ui.dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    assert.equal(ui.doc.activeElement?.id, 'workflow-help')
    ui.click('#signals-body [data-select]')
    ui.click('#review-launch')
    ui.input('[name="extra"]', 'Do not lose this draft.')
    ui.input('[name="model"]', 'manual-model')
    ;(ui.doc.querySelector('[data-launch-help]') as HTMLButtonElement).focus()
    ui.click('[data-launch-help]')
    assert.equal(ui.doc.querySelector('#launch-dialog')?.hasAttribute('open'), true)
    const close = help.querySelector('[data-close-help]') as HTMLButtonElement
    assert.equal(ui.doc.activeElement, close)
    help.dispatchEvent(
      new ui.dom.window.KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      }),
    )
    assert.equal(ui.doc.activeElement, close)
    help.dispatchEvent(new ui.dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    assert.equal(ui.doc.activeElement?.hasAttribute('data-launch-help'), true)
    assert.equal(
      (ui.doc.querySelector('[name="extra"]') as HTMLInputElement).value,
      'Do not lose this draft.',
    )
    assert.equal((ui.doc.querySelector('[name="model"]') as HTMLInputElement).value, 'manual-model')
    assert.equal(
      ui.requests.some((r) => r.body),
      false,
    )
  } finally {
    ui.close()
  }
})

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

test('partial success response is uncertain, keeps every selection, and requires acknowledgement before retry', async () => {
  const ui = await mountConsole({
    '/api/signals': { signals },
    '/api/spawn': { ok: true, plan: { sessionName: 'partial' }, launch: { launched: [0] } },
  })
  try {
    ui.click('[data-select-visible]')
    ui.click('#review-launch')
    ui.click('#spawn-run')
    await ui.settle()
    assert.match(ui.doc.querySelector('#spawn-result')?.textContent ?? '', /may have started/)
    assert.match(ui.doc.querySelector('#selection-summary')?.textContent ?? '', /2 items/)
    assert.equal((ui.doc.querySelector('#spawn-run') as HTMLButtonElement).disabled, true)
    ui.click('#spawn-run')
    await ui.settle()
    assert.equal(ui.requests.filter((r) => r.path === '/api/spawn').length, 1)
    ui.click('[data-ack-retry]')
    assert.equal((ui.doc.querySelector('#spawn-run') as HTMLButtonElement).disabled, false)
  } finally {
    ui.close()
  }
})

test('same-verb row action preserves reviewed permissions; registry merge defaults never enter requests', async () => {
  const registry = ACTION_REGISTRY.map((entry) => ({
    ...entry,
    autonomy: { ...entry.autonomy, merge: true },
  }))
  const ui = await mountConsole({ '/api/actions': { actions: registry } })
  try {
    ui.click('[data-select]')
    ui.click('#review-launch')
    ui.click('[data-permission="push"]')
    ui.click('[data-close-dialog]')
    ui.click('#signals-body [data-verb="investigate"]')
    assert.equal(
      (ui.doc.querySelector('[data-permission="push"]') as HTMLInputElement).checked,
      true,
    )
    assert.equal(
      (ui.doc.querySelector('[data-permission="merge"]') as HTMLInputElement).checked,
      false,
    )
    ui.click('#spawn-run')
    await ui.settle()
    const actions = ui.requests.find((r) => r.path === '/api/spawn')?.body?.actions as {
      autonomy: { merge: boolean }
    }[]
    assert.equal(actions[0]?.autonomy.merge, false)
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
