import assert from 'node:assert/strict'
import test from 'node:test'
import { JSDOM } from 'jsdom'
import { ACTION_REGISTRY } from '../src/actions.js'
import { trayHtml } from '../ui/views/tray.js'
import { mountConsole, receipt } from './ui-fixture.js'

test('session presentation distinguishes sessions/panes and unknown liveness; every receipt is reachable', () => {
  const rows = Array.from({ length: 230 }, (_, i) =>
    receipt({
      id: `r${i}`,
      paneIndex: i,
      liveness: i === 0 ? 'alive' : i === 1 ? 'exited' : undefined,
    }),
  )
  const doc = new JSDOM(trayHtml(rows, { registry: ACTION_REGISTRY })).window.document
  assert.match(doc.body.textContent ?? '', /1 recorded session/)
  assert.match(doc.body.textContent ?? '', /230 panes/)
  assert.match(doc.body.textContent ?? '', /Unknown/)
  assert.match(doc.body.textContent ?? '', /Not running/)
  assert.ok(!doc.body.textContent?.includes('Completed'))
  assert.equal(doc.querySelectorAll('.tray-row').length, 200)
  assert.ok(doc.querySelector('[data-page="next"]'))
  const last = new JSDOM(trayHtml(rows, { registry: ACTION_REGISTRY, page: 1 })).window.document
  assert.equal(last.querySelectorAll('.tray-row').length, 30)
  assert.match(last.body.textContent ?? '', /r229/)
  assert.match(doc.body.textContent ?? '', /Configured cap/)
  assert.match(doc.body.textContent ?? '', /Prompt digest/)
})

test('sessions scope/search/refresh, attach fallback and registry-routed close/cancel outcomes', async () => {
  const ui = await mountConsole({
    '/api/spawns': {
      spawns: [
        receipt(),
        receipt({ id: 'other', repoRoot: '/other/x', sessionName: 'foc-other', liveness: 'dead' }),
      ],
    },
  })
  try {
    ui.click('[data-view="sessions"].nav-btn')
    assert.equal(ui.doc.querySelectorAll('#sessions-body .tray-row').length, 2)
    ui.input('#fleet-select', '/repos/x', 'change')
    assert.equal(ui.doc.querySelectorAll('#sessions-body .tray-row').length, 1)
    ui.click('#sessions-body [data-copy]')
    await ui.settle()
    assert.match(ui.doc.querySelector('#sessions-body')?.textContent ?? '', /Copy manually/)
    ui.input('#global-search', 'absent')
    assert.equal(ui.doc.querySelectorAll('#sessions-body .tray-row').length, 0)
    ui.input('#global-search', '')
    ui.routes['/api/spawns'] = { spawns: [receipt({ liveness: 'exited' })] }
    await ui.app.refresh()
    assert.match(ui.doc.querySelector('#sessions-body')?.textContent ?? '', /Not running/)
    ui.click('#sessions-body [data-session-action="close-delete"]')
    ui.click('[data-cancel]')
    assert.equal(ui.requests.filter((r) => r.path === '/api/actions/dispatch').length, 0)
    ui.click('#sessions-body [data-session-action="close-delete"]')
    ui.input('[name="confirmation"]', 'wrong')
    ui.click('.action-popover button[type="submit"]')
    await ui.settle()
    assert.equal(ui.requests.filter((r) => r.path === '/api/actions/dispatch').length, 0)
    ui.input('[name="confirmation"]', 'confirm delete foc-x-p0')
    ui.routes['/api/actions/dispatch'] = () => ({
      ok: false,
      reason: 'merge-human-owned',
      error: 'Refused safely',
    })
    ui.click('.action-popover button[type="submit"]')
    await ui.settle()
    assert.match(ui.doc.querySelector('[data-confirm-error]')?.textContent ?? '', /Refused safely/)
    assert.ok(ui.doc.querySelector('#action-dialog[open]'))
  } finally {
    ui.close()
  }
})

test('launch handoff clears obstructing filters, highlights new session, and preserves readable outcome', async () => {
  const ui = await mountConsole({
    '/api/spawns': {
      spawns: Array.from({ length: 230 }, (_, i) =>
        receipt({ id: `old${i}`, sessionName: `foc-old${i}`, createdAt: '2026-10-13T12:00:00Z' }),
      ),
    },
  })
  try {
    ui.click('[data-select]')
    ui.click('[data-view="sessions"].nav-btn')
    ui.input('#global-search', 'none')
    ui.input('#fleet-select', '/other/root', 'change')
    ui.click('#review-launch')
    ui.routes['/api/spawns'] = {
      spawns: [
        ...(ui.routes['/api/spawns'] as { spawns: unknown[] }).spawns,
        receipt({ sessionName: 'foc-new' }),
      ],
    }
    ui.click('#spawn-run')
    await ui.settle()
    ui.click('#launch-outcome [data-go-sessions]')
    await ui.settle()
    assert.ok(ui.doc.querySelector('#sessions-body [data-session="foc-new"][data-highlight]'))
    assert.equal((ui.doc.querySelector('#fleet-select') as HTMLSelectElement).value, '')
    assert.equal((ui.doc.querySelector('#global-search') as HTMLInputElement).value, '')
    assert.match(ui.doc.querySelector('#launch-outcome')?.textContent ?? '', /Launched foc-new/)
  } finally {
    ui.close()
  }
})
