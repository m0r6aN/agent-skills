import assert from 'node:assert/strict'
import test from 'node:test'
import { JSDOM } from 'jsdom'
import { ACTION_REGISTRY, destructiveConfirmationToken } from '../src/actions.js'
import {
  allowedVerbs,
  confirmationToken,
  selectionToActions,
  signalsHtml,
} from '../ui/views/signals.js'
import { mountConsole, signal } from './ui-fixture.js'

const SIGNALS = [
  signal({ id: 'release', class: 'release-hygiene', subject: 'plugins/x/README.md' }),
  signal({ id: 'scm', class: 'scm-ci', subject: 'pr/166/do-not-merge' }),
]

test('only registered class/verb pairs render; unsupported bulk targets have no checkbox', () => {
  const hygiene = SIGNALS[0] as (typeof SIGNALS)[number]
  assert.deepEqual(allowedVerbs(hygiene, ACTION_REGISTRY).sort(), [
    'explain',
    'investigate',
    'remediate',
  ])
  const doc = new JSDOM(signalsHtml(SIGNALS, ACTION_REGISTRY)).window.document
  assert.equal(doc.querySelectorAll('[data-class="release-hygiene"] .action-btn').length, 3)
  assert.equal(doc.querySelector('[data-class="release-hygiene"] [data-verb="close-delete"]'), null)
  assert.equal(
    doc
      .querySelector('[data-class="scm-ci"] [data-verb="close-delete"]')
      ?.getAttribute('data-destructive'),
    'true',
  )
  const unavailable = new JSDOM(
    signalsHtml([signal({ actions: ['close-delete'] })], ACTION_REGISTRY),
  ).window.document
  assert.equal(unavailable.querySelector('[data-select]'), null)
})

test('N selections carry N actions with independent autonomy and authoritative evidence', () => {
  const payloads = selectionToActions(
    SIGNALS.map((signal, i) => ({
      signal,
      verb: i ? 'remediate' : 'investigate',
      autonomy: { decisions: 'partial', commit: !!i, push: false, openPr: false, merge: false },
      extraText: 'preserve existing work first',
    })),
  )
  assert.equal(payloads.length, 2)
  assert.deepEqual(payloads[0]?.evidence, SIGNALS[0]?.evidence)
  assert.equal((payloads[0]?.autonomy as { commit: boolean } | undefined)?.commit, false)
  assert.equal((payloads[1]?.autonomy as { commit: boolean } | undefined)?.commit, true)
  assert.equal(payloads[1]?.extraText, 'preserve existing work first')
})

test('spawn actions open review without dispatch; destructive confirmation is separate and exact', async () => {
  const ui = await mountConsole({ '/api/signals': { signals: SIGNALS } })
  try {
    ui.click('[data-class="scm-ci"] [data-verb="investigate"]')
    assert.ok(ui.doc.querySelector('#launch-dialog[open]'))
    assert.equal(ui.requests.filter((r) => r.body).length, 0)
    ui.click('[data-close-dialog]')
    ui.click('[data-class="scm-ci"] [data-verb="close-delete"]')
    assert.ok(ui.doc.querySelector('form.action-popover[data-destructive="true"]'))
    ui.input('[name="confirmation"]', 'yes please')
    ui.click('.action-popover button[type="submit"]')
    await ui.settle()
    assert.equal(ui.requests.filter((r) => r.path === '/api/actions/dispatch').length, 0)
    assert.equal((ui.doc.querySelector('[data-confirm-error]') as HTMLElement).hidden, false)
    const token = confirmationToken('pr/166/do-not-merge')
    assert.equal(
      token,
      destructiveConfirmationToken('pr/166/do-not-merge'),
      'browser matches the authoritative server token',
    )
    ui.input('[name="confirmation"]', token)
    ui.input('.action-popover [name="extra"]', 'Keep unrelated work.')
    ui.click('.action-popover button[type="submit"]')
    await ui.settle()
    const requests = ui.requests.filter((r) => r.path === '/api/actions/dispatch')
    assert.equal(requests.length, 1)
    assert.equal(requests[0]?.body?.confirmation, token)
    assert.equal(requests[0]?.body?.verb, 'close-delete')
    assert.equal(requests[0]?.body?.extraText, 'Keep unrelated work.')
    assert.equal(
      ui.requests.filter((r) => r.path === '/api/spawn').length,
      0,
      'delete never enters bulk launch',
    )
    assert.match(ui.doc.querySelector('#action-result')?.textContent ?? '', /presented/)
  } finally {
    ui.close()
  }
})
