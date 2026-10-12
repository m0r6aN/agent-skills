import assert from 'node:assert/strict'
import test from 'node:test'
import { mountConsole, parcel, signal } from './ui-fixture.js'

test('queue is the default; root scope, search and hash navigation are functional', async () => {
  const ui = await mountConsole({
    '/api/signals': {
      signals: [
        signal(),
        signal({ id: 'other', repo: '/other/x', subject: 'pr/42', class: 'scm-ci' }),
      ],
    },
  })
  try {
    assert.equal(
      ui.doc.querySelector('main > section:not([hidden])')?.getAttribute('data-view'),
      'signals',
    )
    assert.equal(ui.doc.querySelectorAll('.signal-row').length, 2)
    ui.input('#fleet-select', '/repos/x', 'change')
    assert.equal(ui.doc.querySelectorAll('.signal-row').length, 1)
    ui.input('#global-search', 'nonexistent')
    assert.equal(ui.doc.querySelectorAll('.signal-row').length, 0)
    assert.match(ui.doc.querySelector('#signals-body')?.textContent ?? '', /No matching/)
    ui.input('#global-search', '')
    ui.click('[data-view="board"].nav-btn')
    await ui.settle()
    assert.equal(ui.dom.window.location.hash, '#board')
    ui.click('a[href="#main"]')
    await ui.settle()
    assert.equal(ui.dom.window.location.hash, '#board', 'skip link must not change the active view')
    assert.equal(ui.doc.activeElement?.id, 'main')
    ui.dom.window.location.hash = '#sessions'
    await ui.settle()
    assert.equal(
      ui.doc.querySelector('main > section:not([hidden])')?.getAttribute('data-view'),
      'sessions',
    )
    assert.ok(ui.doc.querySelector('#sessions-body .tray-row'))
  } finally {
    ui.close()
  }
})

test('goal/refresh races cannot overwrite a newer repository or snapshot; inactive goals and state filters remain reachable', async () => {
  const ui = await mountConsole({
    '/api/goals': {
      statuses: [
        { key: 'g', repoRoot: '/repos/x', active: true },
        { key: 'h', repoRoot: '/other/x', active: true },
        { key: 'done', repoRoot: '/other/x', active: false },
      ],
    },
  })
  let releaseGoal: (value: unknown) => void = () => {}
  const delayedGoal = new Promise((resolve) => {
    releaseGoal = resolve
  })
  try {
    ui.routes['/api/parcels'] = (path: string) =>
      path.includes('goal=g')
        ? delayedGoal
        : { goal: { slug: 'h' }, parcels: [parcel({ parcel: 'H1', state: 'complete' })] }
    ui.click('[data-view="board"].nav-btn')
    await ui.settle()
    ui.input('#fleet-select', '/other/x', 'change')
    await ui.settle()
    releaseGoal({ goal: { slug: 'g' }, parcels: [parcel({ parcel: 'STALE' })] })
    await ui.settle()
    assert.match(ui.doc.querySelector('#board')?.textContent ?? '', /H1/)
    assert.ok(!ui.doc.querySelector('#board')?.textContent?.includes('STALE'))
    assert.equal(
      ui.doc.querySelectorAll('#goal-select option').length,
      1,
      'same basename roots never merge',
    )
    ui.input('#goal-status', 'inactive', 'change')
    await ui.settle()
    assert.equal((ui.doc.querySelector('#goal-select') as HTMLSelectElement).value, 'done')
    ui.input('#parcel-status', 'hung', 'change')
    assert.match(ui.doc.querySelector('#board')?.textContent ?? '', /No matching parcels/)
    ui.click('[data-view="signals"].nav-btn')
    ui.input('#fleet-select', '', 'change')
    let releaseSignals: (value: unknown) => void = () => {}
    const delayed = new Promise((resolve) => {
      releaseSignals = resolve
    })
    ui.routes['/api/signals'] = () => delayed
    const older = ui.app.refresh()
    ui.routes['/api/signals'] = { signals: [signal({ subject: 'fresh' })] }
    await ui.app.refresh()
    releaseSignals({ signals: [signal({ subject: 'stale' })] })
    await older
    assert.match(ui.doc.querySelector('#signals-body')?.textContent ?? '', /fresh/)
    assert.ok(!ui.doc.querySelector('#signals-body')?.textContent?.includes('stale'))
  } finally {
    ui.close()
  }
})

test('goal refresh and pending detail loads do not cancel each other or strand Loading evidence', async () => {
  const ui = await mountConsole()
  let release: (value: unknown) => void = () => {}
  const logs = new Promise((resolve) => {
    release = resolve
  })
  try {
    ui.click('.nav-btn[data-view="board"]')
    await ui.settle()
    ui.routes['/api/parcels/P1/logs'] = () => logs
    ui.click('#board [data-parcel]')
    const refreshing = ui.app.refresh()
    await ui.settle()
    release({ chainDocuments: [], invocationAudit: [], stateLines: ['Fresh detail evidence'] })
    await refreshing
    await ui.settle()
    assert.match(ui.doc.querySelector('#detail')?.textContent ?? '', /Fresh detail evidence/)
    assert.ok(!ui.doc.querySelector('#detail')?.textContent?.includes('Loading evidence'))
  } finally {
    ui.close()
  }
})

test('queue pagination reaches every item and filters before paging', async () => {
  const ui = await mountConsole({
    '/api/signals': {
      signals: Array.from({ length: 230 }, (_, i) => signal({ id: `s${i}`, subject: `g/P${i}` })),
    },
  })
  try {
    assert.equal(ui.doc.querySelectorAll('.signal-row').length, 200)
    ui.click('#signals-body [data-page="next"]')
    assert.equal(ui.doc.querySelectorAll('.signal-row').length, 30)
    ui.input('#global-search', 'g/P229')
    assert.equal(ui.doc.querySelectorAll('.signal-row').length, 1)
  } finally {
    ui.close()
  }
})

test('failed refresh preserves records with stale/retry feedback; initialization error is visible', async () => {
  const ui = await mountConsole()
  try {
    ui.routes['/api/signals'] = new Error('Network offline')
    await ui.app.refresh()
    assert.equal(ui.doc.querySelectorAll('.signal-row').length, 1)
    assert.match(ui.doc.querySelector('#console-status')?.textContent ?? '', /stale|offline/i)
    ui.routes['/api/signals'] = { signals: 'malformed' }
    await ui.app.refresh()
    assert.equal(ui.doc.querySelectorAll('.signal-row').length, 1)
    assert.match(
      ui.doc.querySelector('#console-status')?.textContent ?? '',
      /Invalid signals response/,
    )
    ui.routes['/api/signals'] = { signals: [null] }
    await ui.app.refresh()
    assert.equal(
      ui.doc.querySelectorAll('.signal-row').length,
      1,
      'malformed entries retain last-known records',
    )
    ui.routes['/api/signals'] = { signals: [{ ...signal(), actions: {} }] }
    await ui.app.refresh()
    assert.equal(ui.doc.querySelectorAll('.signal-row').length, 1)
    ui.routes['/api/signals'] = { signals: [] }
    await ui.app.refresh()
    assert.equal(ui.doc.querySelectorAll('.signal-row').length, 0)
  } finally {
    ui.close()
  }
  const failed = await mountConsole({ '/api/health': new Error('Cannot connect') })
  try {
    assert.match(failed.doc.body.textContent ?? '', /Cannot connect/)
    assert.ok(failed.doc.querySelector('#refresh'))
  } finally {
    failed.close()
  }
})
