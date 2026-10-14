import assert from 'node:assert/strict'
import test from 'node:test'
import { JSDOM } from 'jsdom'
import { ACTION_REGISTRY } from '../src/actions.js'
import { attachCommand, livenessLabel, TRAY_ROW_CAP, trayHtml } from '../ui/views/tray.js'
import { mountConsole, receipt } from './ui-fixture.js'

test('tray renders at most 200 rows with pagination and registry-only actions; names are safely quoted', () => {
  const rows = Array.from({ length: 230 }, (_, i) =>
    receipt({ id: `r${i}`, sessionName: `foc-${i}` }),
  )
  const doc = new JSDOM(trayHtml(rows, { registry: ACTION_REGISTRY })).window.document
  assert.equal(doc.querySelectorAll('.tray-row').length, TRAY_ROW_CAP)
  assert.ok(doc.querySelector('[data-page="next"]'))
  for (const row of doc.querySelectorAll('.tray-row')) {
    assert.ok(row.querySelector('[data-copy]'))
    assert.ok(row.querySelector('[data-session-action="explain"]'))
    assert.ok(row.querySelector('[data-session-action="close-delete"]'))
  }
  assert.equal(
    new JSDOM(trayHtml(rows)).window.document.querySelector('[data-session-action]'),
    null,
  )
  assert.equal(attachCommand('foc-x'), 'tmux attach -t foc-x')
  assert.equal(attachCommand('x;rm -rf /'), "tmux attach -t 'x;rm -rf /'")
  assert.equal(livenessLabel(undefined), 'Unknown')
  assert.ok(!livenessLabel('dead').includes('complete'))
  assert.equal(
    new JSDOM(trayHtml([{}], { registry: ACTION_REGISTRY })).window.document.querySelector(
      '[data-copy]',
    ),
    null,
  )
})

test('tray opens as a preview, copy works, and session actions report results after typed confirmation', async () => {
  const ui = await mountConsole()
  const copies: string[] = []
  Object.defineProperty(ui.dom.window.navigator, 'clipboard', {
    value: {
      writeText: async (text: string) => {
        copies.push(text)
      },
    },
  })
  try {
    ui.click('#tray-toggle')
    assert.equal(ui.doc.querySelector('#tray-toggle')?.getAttribute('aria-expanded'), 'true')
    ui.click('#tray-body [data-copy]')
    await ui.settle()
    assert.deepEqual(copies, ['tmux attach -t foc-x'])
    assert.match(ui.doc.querySelector('#tray-body [data-copy-status]')?.textContent ?? '', /Copied/)
    ui.routes['/api/spawns'] = { spawns: [receipt({ liveness: 'exited' })] }
    await ui.app.refresh()
    assert.match(ui.doc.querySelector('#tray-body')?.textContent ?? '', /Not running/)
    ui.click('#tray-body [data-session-action="explain"]')
    ui.click('.action-popover button[type="submit"]')
    await ui.settle()
    assert.match(ui.doc.querySelector('#action-result')?.textContent ?? '', /presented/)
    ui.click('#tray-body [data-session-action="close-delete"]')
    ui.input('[name="confirmation"]', 'confirm delete wrong-session-p0')
    ui.click('.action-popover button[type="submit"]')
    await ui.settle()
    assert.equal(ui.requests.filter((r) => r.path === '/api/actions/dispatch').length, 1)
    ui.input('[name="confirmation"]', 'confirm delete foc-x-p0')
    ui.click('.action-popover button[type="submit"]')
    await ui.settle()
    const requests = ui.requests.filter((r) => r.path === '/api/actions/dispatch')
    assert.equal(requests.length, 2)
    assert.equal(requests[1]?.body?.confirmation, 'confirm delete foc-x-p0')
    assert.equal(requests[1]?.body?.signalClass, 'session-state')
    assert.equal(requests[1]?.body?.subject, 'foc-x-p0')
  } finally {
    ui.close()
  }
})
