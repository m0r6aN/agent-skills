import assert from 'node:assert/strict'
import test from 'node:test'
import { JSDOM } from 'jsdom'
import { ACTION_REGISTRY } from '../src/actions.js'
import {
  countsHtml,
  filterParcels,
  reconcileRowsHtml,
  remoteBannerHtml,
} from '../ui/views/reconcile.js'
import { mountConsole, signal } from './ui-fixture.js'

/**
 * FCA-P8 AC6: the Reconciliation view. Rendering is pure and escaped; the
 * integration tests drive the real console module (jsdom) through loading,
 * filtering, selection into the existing launch panel, and failure states.
 */
const finding = (over: Record<string, unknown> = {}) => ({
  code: 'shipped-unrecorded',
  summary: 'Merged delivery work exists but the record does not show the parcel closed.',
  evidence: ['PR #163 MERGED 2026-10-10: feat: P1 contract', 'PR data as of 2026-10-13T11:59:00Z'],
  question: 'Did the merged work deliver this parcel, with only the record behind?',
  options: [
    {
      answer: 'Yes — the work shipped, the record is behind',
      recommendation: 'Complete the record instead of redoing the work.',
      commands: ['gh pr view 163'],
    },
    {
      answer: 'No — the PR is unrelated to the parcel (last resort)',
      recommendation: 'Say why in the state line.',
      commands: [],
    },
  ],
  ...over,
})

const parcelRec = (over: Record<string, unknown> = {}) => ({
  parcel: 'P1',
  state: 'hung',
  rule: 'R4',
  local: {
    specLocation: 'active',
    recordMarksClosed: false,
    chainSealed: null,
    checkedOutBranch: 'main',
    branches: [],
    worktrees: [{ kind: 'worktree', ref: '/wt/p1-2026', detail: 'branch spawn/p1', at: null }],
    sessions: [],
    stateMentions: [],
  },
  remote: {
    prs: { available: true, reason: null, asOf: '2026-10-13T11:59:00Z' },
    refs: { available: true, defaultRef: 'origin/main', asOf: '2026-10-13T11:00:00Z' },
    specLocation: 'active',
    mergedPrs: [
      { kind: 'pr', ref: '#163', detail: 'feat — feat: P1 contract', at: '2026-10-10T00:00:00Z' },
    ],
    otherPrs: [],
    commits: [],
    branches: [],
  },
  ambiguous: [],
  discrepancies: [finding()],
  history: [
    {
      at: '2026-10-10T00:00:00Z',
      source: 'pr',
      kind: 'merged',
      label: 'PR #163 merged',
      ref: 'https://example.invalid/pull/163',
    },
  ],
  absentSources: ['receipts', 'sessions'],
  hung: {
    lines: [
      'Last recorded progress: 2026-09-26T00:00:00.000Z (400 h ago).',
      'Heartbeat threshold: 6 h (default).',
      'Rule R4 (hung): no earlier rule matched.',
    ],
    note: null,
  },
  ...over,
})

const data = (parcels: unknown[] = [parcelRec()], over: Record<string, unknown> = {}) => ({
  goal: 'g',
  generatedAt: '2026-10-13T12:00:00Z',
  repo: {
    repoRoot: '/repos/x',
    defaultRef: 'origin/main',
    refsAsOf: '2026-10-13T11:00:00Z',
    checkedOutBranch: 'main',
    defaultDivergence: { ahead: 0, behind: 0 },
  },
  prs: { available: true, reason: null, asOf: '2026-10-13T11:59:00Z' },
  counts: { parcels: parcels.length, byCode: { 'shipped-unrecorded': 1, 'never-started': 0 } },
  parcels,
  ...over,
})

const text = (html: string) =>
  new JSDOM(`<body>${html}</body>`).window.document.body.textContent ?? ''

test('banner states the comparison basis with ages, and degrades visibly when GitHub or the default branch is missing', () => {
  const ok = text(remoteBannerHtml(data()))
  assert.match(ok, /Compared against origin\/main/)
  assert.match(ok, /refs as of 2026-10-13 11:00 UTC/)
  assert.match(ok, /GitHub PRs as of 2026-10-13 11:59 UTC/)
  const down = remoteBannerHtml(
    data([], { prs: { available: false, reason: 'gh: not logged in', asOf: null } }),
  )
  assert.match(text(down), /GitHub unavailable: gh: not logged in/)
  assert.match(text(down), /withheld rather than guessed/)
  assert.doesNotMatch(
    text(down),
    /GitHub PRs as of/,
    'no PR age is claimed when there is no PR data',
  )
  const diverged = text(
    remoteBannerHtml(
      data([], {
        repo: {
          defaultRef: 'origin/main',
          refsAsOf: null,
          checkedOutBranch: null,
          defaultDivergence: { ahead: 2, behind: 1 },
        },
      }),
    ),
  )
  assert.match(diverged, /age unknown/)
  assert.match(diverged, /2 ahead \/ 1 behind/)
  assert.match(diverged, /detached HEAD/)
  assert.match(
    text(remoteBannerHtml(data([], { repo: { defaultRef: null } }))),
    /No default branch found/,
  )
})

test('counts are filter buttons with pressed state; zero-count codes are hidden; "No discrepancy" is derived', () => {
  const doc = new JSDOM(
    `<body>${countsHtml(data([parcelRec(), parcelRec({ parcel: 'P2', discrepancies: [] })], { counts: { parcels: 2, byCode: { 'shipped-unrecorded': 1, 'never-started': 0 } } }), 'shipped-unrecorded')}</body>`,
  ).window.document
  const buttons = [...doc.querySelectorAll('[data-rec-filter]')]
  assert.deepEqual(
    buttons.map((b) => b.getAttribute('data-rec-filter')),
    ['', 'shipped-unrecorded', 'none'],
  )
  assert.equal(
    doc.querySelector('[data-rec-filter="shipped-unrecorded"]')?.getAttribute('aria-pressed'),
    'true',
  )
  assert.equal(doc.querySelector('[data-rec-filter=""]')?.getAttribute('aria-pressed'), 'false')
  assert.match(
    doc.querySelector('[data-rec-filter="none"]')?.textContent ?? '',
    /No discrepancy\s*1/,
  )
})

test('rows: local and remote facts with sources, discrepancy chips, and a full explanation', () => {
  const doc = new JSDOM(`<body>${reconcileRowsHtml([parcelRec()])}</body>`).window.document
  const row = doc.querySelector('[data-rec-parcel="P1"]')
  assert.ok(row)
  const t = row?.textContent ?? ''
  assert.match(t, /Spec: active\//)
  assert.match(t, /closed marker absent · no receipt chain/)
  assert.match(t, /Worktree p1-2026 — branch spawn\/p1/)
  assert.match(t, /PR #163 — feat — feat: P1 contract/)
  assert.match(t, /Spec on default branch: active\//)
  assert.match(t, /Shipped, record behind/)
  assert.match(t, /Why this is “hung”/)
  assert.match(t, /Heartbeat threshold: 6 h \(default\)/)
  assert.match(t, /PR #163 MERGED 2026-10-10/)
  assert.match(t, /Complete the record instead of redoing the work/)
  assert.match(t, /gh pr view 163/)
  assert.match(t, /History/)
  assert.match(t, /Sources with no events: receipts, sessions/)
  const options = [...doc.querySelectorAll('.rec-options li strong')].map((el) => el.textContent)
  assert.ok(options.at(-1)?.includes('last resort'), 'last-resort option is listed last')
  assert.ok(
    doc.querySelector('details.rec-details summary'),
    'explanation is a native, keyboard-operable disclosure',
  )
})

test('unknown/unavailable facts render as such; parcels with no discrepancy say so; non-hung has no hung panel', () => {
  const sparse = parcelRec({
    discrepancies: [],
    hung: null,
    history: [],
    absentSources: [],
    local: {
      specLocation: 'none',
      recordMarksClosed: false,
      chainSealed: null,
      branches: [],
      worktrees: [],
      sessions: [],
      stateMentions: [],
    },
    remote: {
      prs: { available: false, reason: 'gh is not installed', asOf: null },
      specLocation: 'unknown',
      mergedPrs: [],
      otherPrs: [],
      commits: [],
      branches: [],
    },
  })
  const t = text(reconcileRowsHtml([sparse]))
  assert.match(t, /None asserted/)
  assert.match(t, /PRs unavailable \(gh is not installed\)/)
  assert.match(t, /Spec on default branch: unknown/)
  assert.match(t, /Spec: none/)
  assert.doesNotMatch(t, /Why this is “hung”/)
  assert.match(t, /No history events found/)
})

test('every string from git, GitHub and disk is escaped', () => {
  const hostile = '<img src=x onerror=alert(1)><script>alert(2)</script>'
  const bad = parcelRec({
    parcel: hostile,
    local: {
      specLocation: 'active',
      recordMarksClosed: false,
      chainSealed: null,
      branches: [{ kind: 'branch', ref: hostile, detail: hostile, at: null }],
      worktrees: [],
      sessions: [],
      stateMentions: [hostile],
    },
    remote: {
      prs: { available: true, reason: null, asOf: null },
      specLocation: 'active',
      mergedPrs: [{ kind: 'pr', ref: hostile, detail: hostile, at: null }],
      otherPrs: [],
      commits: [],
      branches: [],
    },
    discrepancies: [
      finding({
        summary: hostile,
        evidence: [hostile],
        question: hostile,
        options: [{ answer: hostile, recommendation: hostile, commands: [hostile] }],
      }),
    ],
    history: [{ at: hostile, source: hostile, kind: 'x', label: hostile, ref: hostile }],
    ambiguous: [{ kind: 'pr', ref: hostile, detail: hostile, at: null }],
    hung: { lines: [hostile], note: hostile },
  })
  const doc = new JSDOM(`<body>${reconcileRowsHtml([bad])}</body>`).window.document
  assert.equal(doc.querySelectorAll('img, script').length, 0)
  assert.ok((doc.body.textContent ?? '').includes(hostile))
})

test('selection checkbox only where the parcel has an eligible action signal (same rule as the board)', () => {
  const status = { key: 'g', repoRoot: '/repos/x' }
  const withSignal = new JSDOM(
    `<body>${reconcileRowsHtml([parcelRec()], { signals: [signal()], registry: ACTION_REGISTRY, status })}</body>`,
  ).window.document
  const box = withSignal.querySelector('[data-select]')
  assert.equal(box?.getAttribute('data-select'), 'parcel-state:/repos/x:g/P1')
  const without = new JSDOM(
    `<body>${reconcileRowsHtml([parcelRec({ parcel: 'P9' })], { signals: [signal()], registry: ACTION_REGISTRY, status })}</body>`,
  ).window.document
  assert.equal(without.querySelector('[data-select]'), null)
  assert.match(without.body.textContent ?? '', /—/)
})

test('filterParcels: by code, by none, and by search over parcel/state/code', () => {
  const rows = [
    parcelRec(),
    parcelRec({ parcel: 'P2', state: 'running', discrepancies: [] }),
    parcelRec({ parcel: 'P3', discrepancies: [finding({ code: 'never-started' })] }),
  ]
  assert.deepEqual(filterParcels(rows, '', '').length, 3)
  assert.deepEqual(
    filterParcels(rows, 'shipped-unrecorded', '').map((p) => p.parcel),
    ['P1'],
  )
  assert.deepEqual(
    filterParcels(rows, 'none', '').map((p) => p.parcel),
    ['P2'],
  )
  assert.deepEqual(
    filterParcels(rows, '', 'p3').map((p) => p.parcel),
    ['P3'],
  )
  assert.deepEqual(
    filterParcels(rows, '', 'never-started').map((p) => p.parcel),
    ['P3'],
  )
  assert.deepEqual(filterParcels(rows, 'never-started', 'p1'), [])
})

test('integration: nav opens Reconciliation under Tools, shows Loading until data, then rows; filter chips filter', async () => {
  let release: () => void = () => {}
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  const rec = data(
    [parcelRec(), parcelRec({ parcel: 'P2', state: 'running', discrepancies: [] })],
    { counts: { parcels: 2, byCode: { 'shipped-unrecorded': 1 } } },
  )
  const ui = await mountConsole({
    '/api/reconcile': async () => {
      await gate
      return rec
    },
  })
  try {
    assert.equal(
      ui.doc.querySelector('[data-view="reconcile"].nav-btn')?.hasAttribute('data-primary'),
      false,
      'a named tool, not a fifth primary destination',
    )
    ui.click('[data-view="reconcile"].nav-btn')
    const body = () => ui.doc.getElementById('reconcile-body')?.textContent ?? ''
    assert.match(body(), /Loading reconciliation/)
    assert.doesNotMatch(body(), /No matching parcels/)
    release()
    await ui.settle()
    assert.equal(ui.doc.querySelectorAll('#reconcile-body .rec-row').length, 2)
    assert.match(body(), /Compared against origin\/main/)
    ui.click('[data-rec-filter="shipped-unrecorded"]')
    assert.equal(ui.doc.querySelectorAll('#reconcile-body .rec-row').length, 1)
    ui.click('[data-rec-filter="none"]')
    assert.deepEqual(
      [...ui.doc.querySelectorAll('#reconcile-body .rec-row')].map((r) =>
        r.getAttribute('data-rec-parcel'),
      ),
      ['P2'],
    )
    assert.ok(ui.requests.some((r) => r.path === '/api/reconcile?goal=g'))
  } finally {
    release()
    ui.close()
  }
})

test('integration: selecting a parcel here feeds the existing launch selection bar', async () => {
  const ui = await mountConsole({ '/api/reconcile': data() })
  try {
    ui.click('[data-view="reconcile"].nav-btn')
    await ui.settle()
    ui.click('#reconcile-body [data-select]')
    assert.equal(ui.doc.getElementById('selection-bar')?.hasAttribute('hidden'), false)
    assert.match(ui.doc.getElementById('selection-summary')?.textContent ?? '', /1/)
  } finally {
    ui.close()
  }
})

test('integration: a failed load reads "Could not load" with the reason; a later refresh failure keeps the last-known data', async () => {
  const failing = await mountConsole({ '/api/reconcile': new Error('boom: 500') })
  try {
    failing.click('[data-view="reconcile"].nav-btn')
    await failing.settle()
    const text = failing.doc.getElementById('reconcile-body')?.textContent ?? ''
    assert.match(text, /Could not load reconciliation/)
    assert.match(text, /boom: 500/)
    assert.doesNotMatch(text, /Loading reconciliation/)
  } finally {
    failing.close()
  }
  const ui = await mountConsole({ '/api/reconcile': data() })
  try {
    ui.click('[data-view="reconcile"].nav-btn')
    await ui.settle()
    assert.equal(ui.doc.querySelectorAll('#reconcile-body .rec-row').length, 1)
    ui.routes['/api/reconcile'] = new Error('network down')
    ui.click('#refresh')
    await ui.settle()
    assert.equal(
      ui.doc.querySelectorAll('#reconcile-body .rec-row').length,
      1,
      'last-known list preserved',
    )
    assert.match(ui.doc.getElementById('console-status')?.textContent ?? '', /stale|network down/i)
  } finally {
    ui.close()
  }
})

test('integration: reconciliation is read-only — the view issues no write request', async () => {
  const ui = await mountConsole({ '/api/reconcile': data() })
  try {
    ui.click('[data-view="reconcile"].nav-btn')
    await ui.settle()
    ui.click('#reconcile-body [data-rec-filter=""]')
    ui.doc
      .querySelector('#reconcile-body details summary')
      ?.dispatchEvent(new ui.dom.window.Event('click', { bubbles: true }))
    const writes = ui.requests.filter((r) => r.body !== null && !r.path.startsWith('/api/health'))
    assert.deepEqual(
      writes,
      [],
      'no request with a body (no POST/DELETE) was issued by viewing reconciliation',
    )
  } finally {
    ui.close()
  }
})

test('the banner escapes gh stderr, ref names and branch names (all attacker-influenced)', () => {
  const hostile = '<img src=x onerror=alert(1)><script>alert(2)</script>'
  const html = remoteBannerHtml(
    data([], {
      prs: { available: false, reason: hostile, asOf: null },
      repo: {
        defaultRef: hostile,
        refsAsOf: hostile,
        checkedOutBranch: hostile,
        defaultDivergence: { ahead: hostile, behind: 1 },
      },
    }),
  )
  const doc = new JSDOM(`<body>${html}</body>`).window.document
  assert.equal(doc.querySelectorAll('img, script').length, 0)
  assert.ok((doc.body.textContent ?? '').includes(hostile))
})

test('a weak-traces finding is worded and coloured as uncertain, never as a verdict', () => {
  const weak = parcelRec({
    discrepancies: [
      finding({
        code: 'stale-abandoned',
        confidence: 'weak-traces',
        summary: 'Weak traces exist. Verify before closing.',
      }),
    ],
  })
  const strong = parcelRec({
    parcel: 'P2',
    discrepancies: [
      finding({
        code: 'stale-abandoned',
        confidence: 'asserted',
        summary: 'Nothing links this parcel.',
      }),
    ],
  })
  const doc = new JSDOM(`<body>${reconcileRowsHtml([weak, strong])}</body>`).window.document
  const [weakChip, strongChip] = [...doc.querySelectorAll('.rec-row .chip[title]')]
  assert.equal(weakChip?.textContent, 'Unclear — weak traces only, verify')
  assert.equal(weakChip?.className.includes('chip-amber'), true)
  assert.equal(weakChip?.getAttribute('data-confidence'), 'weak-traces')
  assert.equal(strongChip?.textContent, 'No delivery or in-flight work linked')
  assert.equal(strongChip?.className.includes('chip-red'), true)
  assert.match(doc.querySelector('.rec-row .rec-finding h4')?.textContent ?? '', /weak traces only/)
})

test('an expanded explanation stays open across re-renders (filter, refresh) and is per parcel', async () => {
  const ui = await mountConsole({
    '/api/reconcile': data([parcelRec(), parcelRec({ parcel: 'P2' })], {
      counts: { parcels: 2, byCode: { 'shipped-unrecorded': 2 } },
    }),
  })
  try {
    ui.click('[data-view="reconcile"].nav-btn')
    await ui.settle()
    const open = () =>
      [...ui.doc.querySelectorAll('#reconcile-body .rec-row')]
        .filter((row) => (row.querySelector('details') as HTMLDetailsElement).open)
        .map((row) => row.getAttribute('data-rec-parcel'))
    assert.deepEqual(open(), [])
    ui.click('[data-rec-parcel="P2"] details summary')
    await ui.settle()
    assert.deepEqual(open(), ['P2'])
    ui.click('[data-rec-filter="shipped-unrecorded"]')
    assert.deepEqual(open(), ['P2'], 'survives a filter re-render')
    ui.click('#refresh')
    await ui.settle()
    assert.deepEqual(open(), ['P2'], 'survives a refresh re-render')
    ui.click('[data-rec-parcel="P2"] details summary')
    await ui.settle()
    assert.deepEqual(open(), [], 'closing is remembered too')
  } finally {
    ui.close()
  }
})

// ---- reviewer rework (independent review of FCA-P8, 2026-10-13) ----------------------------

test('review: banner shows when it was generated, warns on stale refs, and names why absence findings are withheld', () => {
  const base = data([], { generatedAt: '2026-10-13T12:00:00Z' })
  assert.match(text(remoteBannerHtml(base)), /generated 2026-10-13 12:00 UTC/)
  // Refs fetched 3 days before generation: stale.
  const old = remoteBannerHtml(
    data([], {
      generatedAt: '2026-10-13T12:00:00Z',
      repo: {
        defaultRef: 'origin/main',
        refsAsOf: '2026-10-10T12:00:00Z',
        checkedOutBranch: 'main',
        defaultDivergence: null,
      },
    }),
  )
  assert.match(text(old), /Remote refs may be stale: last fetch 2026-10-10 12:00 UTC/)
  const never = remoteBannerHtml(
    data([], {
      generatedAt: '2026-10-13T12:00:00Z',
      repo: {
        defaultRef: 'origin/main',
        refsAsOf: null,
        checkedOutBranch: 'main',
        defaultDivergence: null,
      },
    }),
  )
  assert.match(text(never), /no fetch is recorded/)
  assert.doesNotMatch(
    text(remoteBannerHtml(base)),
    /Remote refs may be stale/,
    'fresh refs: no warning',
  )
  const limited = remoteBannerHtml(
    data([], {
      assessment: {
        positive: true,
        absence: false,
        limits: [
          'the PR list hit its limit, so older PRs are not visible',
          'GitHub unavailable (x)',
        ],
      },
    }),
  )
  assert.match(
    text(limited),
    /Findings that say something does not exist are withheld because the PR list hit its limit/,
  )
  assert.doesNotMatch(
    text(limited),
    /withheld because.*GitHub unavailable \(x\)/,
    'the GitHub reason has its own banner',
  )
  const stale = remoteBannerHtml(base, { stale: 'network down' })
  assert.match(
    text(stale),
    /Showing the last successful reconciliation \(2026-10-13 12:00 UTC\); refreshing failed: network down/,
  )
})

test('review: history truncation is stated; the never-started label no longer overclaims', () => {
  const capped = text(
    reconcileRowsHtml([
      parcelRec({
        history: [
          {
            at: '2026-10-10T00:00:00Z',
            source: 'pr',
            kind: 'merged',
            label: 'PR merged',
            ref: null,
          },
        ],
        historyTotal: 150,
      }),
    ]),
  )
  assert.match(capped, /Showing the newest 1 of 150 events/)
  const none = text(
    reconcileRowsHtml([
      parcelRec({ discrepancies: [finding({ code: 'never-started', confidence: 'asserted' })] }),
    ]),
  )
  assert.match(none, /No linked trace/)
  assert.doesNotMatch(none, /No trace of a start/)
})

test('review F8: changing scope or goal-status while on Reconciliation reloads it for the new goal (no endless Loading)', async () => {
  const ui = await mountConsole({
    '/api/goals': {
      goals: [],
      statuses: [
        {
          key: 'g',
          repoRoot: '/repos/x',
          tree: null,
          active: true,
          attention: { total: 1 },
          urgentSubjects: [],
        },
        {
          key: 'h',
          repoRoot: '/repos/y',
          tree: null,
          active: true,
          attention: { total: 0 },
          urgentSubjects: [],
        },
      ],
    },
    '/api/fleet': {
      roots: [
        { root: '/repos/x', identity: {}, liveness: 'ready' },
        { root: '/repos/y', identity: {}, liveness: 'ready' },
      ],
    },
    '/api/reconcile': (path: string) =>
      data([parcelRec({ parcel: path.includes('goal=h') ? 'HP1' : 'P1' })], {
        goal: path.includes('goal=h') ? 'h' : 'g',
      }),
  })
  try {
    ui.click('[data-view="reconcile"].nav-btn')
    await ui.settle()
    assert.deepEqual(
      [...ui.doc.querySelectorAll('#reconcile-body .rec-row')].map((r) =>
        r.getAttribute('data-rec-parcel'),
      ),
      ['P1'],
    )
    // Scope to the other repository: the goal changes underneath the view.
    ui.input('#fleet-select', '/repos/y', 'change')
    await ui.settle()
    const body = ui.doc.getElementById('reconcile-body')?.textContent ?? ''
    assert.doesNotMatch(body, /Loading reconciliation/, 'must not be stranded on Loading')
    assert.deepEqual(
      [...ui.doc.querySelectorAll('#reconcile-body .rec-row')].map((r) =>
        r.getAttribute('data-rec-parcel'),
      ),
      ['HP1'],
    )
    assert.ok(ui.requests.some((r) => r.path === '/api/reconcile?goal=h'))
  } finally {
    ui.close()
  }
})

test('review F9: a failed refresh keeps the last data AND leaves a persistent stale banner with its generation time', async () => {
  const ui = await mountConsole({
    '/api/reconcile': data([parcelRec()], { generatedAt: '2026-10-13T12:00:00Z' }),
  })
  try {
    ui.click('[data-view="reconcile"].nav-btn')
    await ui.settle()
    assert.doesNotMatch(
      ui.doc.getElementById('reconcile-body')?.textContent ?? '',
      /last successful/,
    )
    ui.routes['/api/reconcile'] = new Error('network down')
    ui.click('#refresh')
    await ui.settle()
    const body = ui.doc.getElementById('reconcile-body')?.textContent ?? ''
    assert.equal(ui.doc.querySelectorAll('#reconcile-body .rec-row').length, 1)
    assert.match(
      body,
      /Showing the last successful reconciliation \(2026-10-13 12:00 UTC\); refreshing failed: network down/,
    )
    // Recovery clears it.
    ui.routes['/api/reconcile'] = data([parcelRec()], { generatedAt: '2026-10-13T12:05:00Z' })
    ui.click('#refresh')
    await ui.settle()
    assert.doesNotMatch(
      ui.doc.getElementById('reconcile-body')?.textContent ?? '',
      /last successful/,
    )
  } finally {
    ui.close()
  }
})

test('review F14: open explanations are not carried across a goal switch', async () => {
  const ui = await mountConsole({
    '/api/goals': {
      goals: [],
      statuses: [
        {
          key: 'g',
          repoRoot: '/repos/x',
          tree: null,
          active: true,
          attention: { total: 1 },
          urgentSubjects: [],
        },
        {
          key: 'h',
          repoRoot: '/repos/x',
          tree: null,
          active: true,
          attention: { total: 0 },
          urgentSubjects: [],
        },
      ],
    },
    '/api/reconcile': () => data([parcelRec()]),
  })
  try {
    ui.click('[data-view="reconcile"].nav-btn')
    await ui.settle()
    ui.click('[data-rec-parcel="P1"] details summary')
    await ui.settle()
    assert.equal(
      (ui.doc.querySelector('[data-rec-parcel="P1"] details') as HTMLDetailsElement).open,
      true,
    )
    ui.input('#reconcile-goal-select', 'h', 'change')
    await ui.settle()
    assert.equal(
      (ui.doc.querySelector('[data-rec-parcel="P1"] details') as HTMLDetailsElement).open,
      false,
      'a different goal starts collapsed',
    )
  } finally {
    ui.close()
  }
})

test('re-review: the limits banner does not repeat the "no default branch" reason that has its own banner', () => {
  const html = remoteBannerHtml(
    data([], {
      repo: { defaultRef: null },
      assessment: {
        positive: false,
        absence: false,
        limits: ['no default branch was found', 'the branch listing failed'],
      },
    }),
  )
  const doc = new JSDOM(`<body>${html}</body>`).window.document
  const warnings = [...doc.querySelectorAll('.banner.warn')].map((el) => el.textContent ?? '')
  assert.equal(
    warnings.filter((w) => /No default branch found/.test(w)).length,
    1,
    'one dedicated warning',
  )
  const limited = warnings.find((w) => /withheld because/.test(w)) ?? ''
  assert.match(limited, /withheld because the branch listing failed/)
  assert.doesNotMatch(limited, /no default branch/i, 'not repeated in the limits banner')
})

test('re-review: if the goal changes while a load is in flight the view never sits on a stale Loading', async () => {
  let release: () => void = () => {}
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  const ui = await mountConsole({
    '/api/goals': {
      goals: [],
      statuses: [
        {
          key: 'g',
          repoRoot: '/repos/x',
          tree: null,
          active: true,
          attention: { total: 1 },
          urgentSubjects: [],
        },
        {
          key: 'h',
          repoRoot: '/repos/x',
          tree: null,
          active: true,
          attention: { total: 0 },
          urgentSubjects: [],
        },
      ],
    },
    '/api/reconcile': async (path: string) => {
      if (path.includes('goal=g')) await gate
      return data([parcelRec({ parcel: path.includes('goal=h') ? 'HP1' : 'P1' })], {
        goal: path.includes('goal=h') ? 'h' : 'g',
      })
    },
  })
  try {
    ui.click('[data-view="reconcile"].nav-btn')
    ui.input('#reconcile-goal-select', 'h', 'change')
    await ui.settle()
    assert.deepEqual(
      [...ui.doc.querySelectorAll('#reconcile-body .rec-row')].map((r) =>
        r.getAttribute('data-rec-parcel'),
      ),
      ['HP1'],
    )
    release()
    await ui.settle()
    assert.deepEqual(
      [...ui.doc.querySelectorAll('#reconcile-body .rec-row')].map((r) =>
        r.getAttribute('data-rec-parcel'),
      ),
      ['HP1'],
      'the late result for the old goal is dropped, not shown',
    )
  } finally {
    release()
    ui.close()
  }
})
