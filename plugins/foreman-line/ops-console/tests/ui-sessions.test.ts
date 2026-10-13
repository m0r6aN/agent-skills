import assert from 'node:assert/strict'
import test from 'node:test'
import { JSDOM } from 'jsdom'
import { ACTION_REGISTRY } from '../src/actions.js'
import { effectiveLiveness, ledgerHtml, trayHtml } from '../ui/views/tray.js'
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

test('session cells have meaningful narrow-layout labels and timestamps retain exact machine data', () => {
  const name = 'foc-20261013t111955z'
  const createdAt = '2026-10-13T11:19:55.048Z'
  const doc = new JSDOM(
    trayHtml([receipt({ sessionName: name, createdAt })], { registry: ACTION_REGISTRY }),
  ).window.document
  const cells = [...doc.querySelectorAll('.tray-row td')]
  assert.deepEqual(
    cells.map((cell) => cell.getAttribute('data-label')),
    [
      'Session / pane',
      'Liveness',
      'Launch configuration / repository',
      'Terminal attach',
      'Actions',
    ],
  )
  assert.ok(
    [...doc.querySelectorAll('th')].every((header) => header.getAttribute('scope') === 'col'),
  )
  const time = doc.querySelector('time')
  assert.equal(time?.getAttribute('datetime'), createdAt)
  assert.equal(time?.textContent, '2026-10-13 11:19:55 UTC')
  assert.equal(
    doc.querySelector('[data-copy]')?.getAttribute('data-copy'),
    `tmux attach -t ${name}`,
  )
  assert.equal(
    doc.querySelector('[data-session-action="close-delete"]')?.getAttribute('data-subject'),
    `${name}-p0`,
  )
  const unknown = new JSDOM(trayHtml([receipt({ createdAt: undefined })])).window.document
  assert.equal(unknown.querySelector('time'), null)
  assert.match(unknown.querySelector('.session-created')?.textContent || '', /Unavailable/)
  const invalid = new JSDOM(trayHtml([receipt({ createdAt: 'not-a-date <unsafe>' })])).window
    .document
  assert.equal(invalid.querySelector('time'), null)
  assert.equal(invalid.querySelector('.session-created')?.textContent, 'not-a-date <unsafe>')
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

const sessionsText = (ui: { doc: Document }) =>
  ui.doc.getElementById('sessions-body')?.textContent ?? ''

test('AC9: Sessions says "Loading" - never "No console-recorded launches" - while data is pending', async () => {
  // Reproduced against the live console: goals+signals take ~5 s each and the
  // server is single-threaded, so /api/spawns answered last and the view
  // claimed there were no launches for ~10 s ("the button does nothing").
  let release: () => void = () => {}
  const slow = new Promise<void>((resolve) => {
    release = resolve
  })
  const ui = await mountConsole(
    {
      '/api/goals': async () => {
        await slow
        return { goals: [], statuses: [] }
      },
      '/api/signals': async () => {
        await slow
        return { signals: [] }
      },
      '/api/spawns': async () => {
        await slow
        return { spawns: [receipt()] }
      },
    },
    { waitReady: false },
  )
  try {
    await ui.settle()
    ui.click('.session-summary [data-go-sessions]')
    assert.equal(
      ui.doc.querySelector('[data-view="sessions"]')?.hasAttribute('hidden'),
      false,
      'view opened',
    )
    assert.match(sessionsText(ui), /Loading sessions/)
    assert.doesNotMatch(
      sessionsText(ui),
      /No console-recorded launches/,
      'never claims emptiness before data',
    )
    release()
    await ui.ready
    assert.equal(ui.doc.querySelectorAll('#sessions-body .tray-row').length, 1)
    assert.doesNotMatch(sessionsText(ui), /Loading sessions/)
  } finally {
    release()
    ui.close()
  }
})

test('AC9: each endpoint applies as it arrives - fast /api/spawns is not held hostage by slow goals/signals', async () => {
  let release: () => void = () => {}
  const slow = new Promise<void>((resolve) => {
    release = resolve
  })
  const ui = await mountConsole(
    {
      '/api/goals': async () => {
        await slow
        return { goals: [], statuses: [] }
      },
      '/api/signals': async () => {
        await slow
        return { signals: [] }
      },
    },
    { waitReady: false },
  )
  try {
    await ui.settle()
    ui.click('.session-summary [data-go-sessions]')
    assert.equal(
      ui.doc.querySelectorAll('#sessions-body .tray-row').length,
      1,
      'rows shown while others pend',
    )
    assert.match(ui.doc.getElementById('console-status')?.textContent ?? '', /Refreshing/)
  } finally {
    release()
    await ui.ready
    ui.close()
  }
})

test('AC9: a failed /api/spawns reads "Could not load", with the reason - not "no launches"', async () => {
  const ui = await mountConsole({ '/api/spawns': new Error('boom: 500') })
  try {
    ui.click('[data-view="sessions"].nav-btn')
    assert.match(sessionsText(ui), /Could not load sessions/)
    assert.match(sessionsText(ui), /boom: 500/)
    assert.doesNotMatch(sessionsText(ui), /No console-recorded launches/)
  } finally {
    ui.close()
  }
})

test('AC9: a loaded, genuinely empty list still says there are no console-recorded launches', async () => {
  const ui = await mountConsole({ '/api/spawns': { spawns: [] } })
  try {
    ui.click('[data-view="sessions"].nav-btn')
    assert.match(sessionsText(ui), /No console-recorded launches/)
  } finally {
    ui.close()
  }
})

const ledger = (overrides: Record<string, unknown> = {}) => ({
  receiptId: 'r',
  state: 'exited-error',
  ledger: 'present',
  evidence: ['pane exited with status 1'],
  exit: { status: 1, signal: null, at: '2026-10-13T12:00:01.000Z' },
  transcript: { link: 'none', messages: null, costUsd: null },
  git: { worktree: 'present', branch: 'spawn/x', commitsAhead: 0, dirtyFiles: 0, pushed: false },
  output: { present: true, tail: ['Error: boom'], providerError: 'Error: boom', truncated: false },
  orphanClean: true,
  ...overrides,
})

test('AC8: ledger shows lifecycle, exit, git, last output, and the no-transcript message', () => {
  const doc = new JSDOM(`<body>${ledgerHtml(ledger())}</body>`).window.document
  const text = doc.body.textContent ?? ''
  assert.match(text, /Failed — pane exited with an error/)
  assert.match(text, /No transcript — the prompt was never exchanged/)
  assert.match(text, /Error: boom/)
  assert.match(text, /Exit status: 1/)
  assert.match(text, /0 commits ahead · 0 changed files · not pushed/)
  assert.match(text, /Orphan worktree/)
  assert.equal(doc.querySelector('.chip')?.className.includes('chip-red'), true)
})

test('AC8: a clean exit is neutral and never labelled complete; running is green', () => {
  const clean = new JSDOM(
    `<body>${ledgerHtml(ledger({ state: 'exited-clean', exit: { status: 0 }, transcript: { link: 'linked', messages: 4, costUsd: 0.5 }, output: { tail: [], providerError: null } }))}</body>`,
  ).window.document
  assert.match(clean.body.textContent ?? '', /not proof the work is complete/)
  assert.doesNotMatch(clean.body.textContent ?? '', /No transcript/)
  assert.match(clean.body.textContent ?? '', /Cost: \$0\.50/)
  assert.equal(clean.querySelector('.chip')?.className.includes('chip-green'), false)
  assert.ok(!/Completed|Succeeded/.test(clean.body.textContent ?? ''))
  const running = new JSDOM(`<body>${ledgerHtml(ledger({ state: 'running' }))}</body>`).window
    .document
  assert.equal(running.querySelector('.chip')?.className.includes('chip-green'), true)
})

test('AC5/AC8: legacy and unknown facts read Unavailable, never zero; absent ledger renders nothing extra', () => {
  assert.equal(ledgerHtml(undefined), '')
  const legacy = new JSDOM(
    `<body>${ledgerHtml(ledger({ state: 'unknown', ledger: 'absent', exit: {}, transcript: { link: 'none' }, git: { worktree: 'unknown' }, output: { tail: [] }, orphanClean: false }))}</body>`,
  ).window.document
  const text = legacy.body.textContent ?? ''
  assert.match(text, /Exit status: Unavailable · Messages: Unavailable · Cost: Unavailable/)
  assert.match(text, /Git: unavailable/)
  assert.match(text, /Recorded before the session ledger/)
  const partial = new JSDOM(
    `<body>${ledgerHtml(ledger({ git: { worktree: 'present', commitsAhead: null, dirtyFiles: null, pushed: null } }))}</body>`,
  ).window.document
  assert.match(
    partial.body.textContent ?? '',
    /Git: commits ahead unavailable · changed files unavailable · push state unavailable/,
  )
  assert.doesNotMatch(
    text,
    /No transcript — the prompt/,
    'unknown state does not assert a failed prompt',
  )
})

test('ledger output is escaped: hostile pane text cannot inject markup', () => {
  const hostile = '<img src=x onerror=alert(1)><script>alert(2)</script>'
  const doc = new JSDOM(
    `<body>${ledgerHtml(ledger({ evidence: [hostile], output: { tail: [hostile], providerError: hostile } }))}</body>`,
  ).window.document
  assert.equal(doc.querySelectorAll('img, script').length, 0)
  assert.ok((doc.body.textContent ?? '').includes(hostile))
})

test('ledger renders inside a Sessions row, and the compact tray stays compact', () => {
  const rows = [receipt({ ledger: ledger() })]
  const full = new JSDOM(trayHtml(rows, { registry: ACTION_REGISTRY })).window.document
  assert.equal(full.querySelectorAll('.tray-row [data-ledger-state="exited-error"]').length, 1)
  const compact = new JSDOM(trayHtml(rows, { registry: ACTION_REGISTRY, compact: true })).window
    .document
  assert.equal(compact.querySelectorAll('[data-ledger-state]').length, 0)
})

test('review #2: with remain-on-exit a dead pane in a live session is NOT shown or counted as Running', () => {
  // The receipt's session-level liveness says alive (the tmux session still exists),
  // but the ledger knows the only pane has failed.
  const failedPane = receipt({
    id: 'a',
    liveness: 'alive',
    ledger: ledger({ state: 'exited-error' }),
  })
  const livePane = receipt({
    id: 'b',
    paneIndex: 1,
    liveness: 'alive',
    ledger: ledger({ state: 'running' }),
  })
  const legacy = receipt({ id: 'c', paneIndex: 2, liveness: 'alive' })
  assert.equal(effectiveLiveness(failedPane), 'exited')
  assert.equal(effectiveLiveness(livePane), 'alive')
  assert.equal(effectiveLiveness(legacy), 'alive', 'no ledger: the receipt liveness stands')
  assert.equal(
    effectiveLiveness(receipt({ liveness: 'exited', ledger: ledger({ state: 'unknown' }) })),
    'exited',
    'unknown ledger defers to the receipt',
  )
  const doc = new JSDOM(trayHtml([failedPane, livePane], { registry: ACTION_REGISTRY })).window
    .document
  const chips = [...doc.querySelectorAll('.tray-row')].map(
    (row) => row.querySelector('td[data-label="Liveness"] > .chip')?.textContent,
  )
  assert.deepEqual(chips, ['Not running (exited)', 'Running'])
  const metrics = [...doc.querySelectorAll('.session-metrics > div')].map((el) =>
    el.textContent?.replace(/\s+/g, ' ').trim(),
  )
  assert.ok(
    metrics.some((m) => m === '1 Running panes'),
    `only the genuinely live pane counts as running: ${JSON.stringify(metrics)}`,
  )
})
