import assert from 'node:assert/strict'
import test from 'node:test'
import { JSDOM } from 'jsdom'
import {
  bannersHtml,
  DECISIONS_PAGE_SIZE,
  decisionsHtml,
  filterItems,
} from '../ui/views/decisions.js'
import { mountConsole } from './ui-fixture.js'

/**
 * FCA-P9 Decisions view: facts, not verdicts. Every remote string is escaped,
 * the billing banner needs the annotation evidence, and rendering performs no
 * network call.
 */
const ASOF = '2026-10-13T16:00:00.000Z'
const BILLING =
  'The job was not started because recent account payments have failed or your spending limit needs to be increased.'

const merge = (n: number, over: Record<string, unknown> = {}) => ({
  kind: 'merge',
  id: `merge:/repo#${n}`,
  repoRoot: '/repo',
  number: n,
  title: `feat: change ${n}`,
  url: `https://github.com/o/r/pull/${n}`,
  headRef: `feat/b${n}`,
  headSha: 'a'.repeat(40),
  baseRef: 'main',
  isDraft: false,
  mergeable: 'MERGEABLE',
  mergeStateStatus: 'BLOCKED',
  reviewDecision: '',
  reviews: { approved: 0, changesRequested: 0, commented: 0, total: 0 },
  checks: { state: 'passed', passed: 2, failed: 0, pending: 0, unrecognised: 0, failing: [] },
  cause: { code: 'none', annotation: null, asOf: null, capped: false, note: null },
  stack: { baseIsDefault: true, waitsOn: null },
  createdAt: ASOF,
  asOf: ASOF,
  command: null,
  ...over,
})
const gate = (parcel: string, g: 'G1' | 'G2') => ({
  kind: 'gate',
  id: `gate:${g}:/repo:goal:${parcel}`,
  gate: g,
  repoRoot: '/repo',
  goal: 'goal',
  parcel,
  rule: 'R3',
  tipStage: g === 'G2' ? 'B' : null,
  specRef: `docs/specs/active/${parcel}.md`,
  chainLocator: null,
  evidence: 'chain exists (tip B) and has no C receipt',
  slug: null,
  asOf: ASOF,
  command: null,
})
const data = (items: unknown[], over: Record<string, unknown> = {}) => ({
  generatedAt: ASOF,
  repos: [
    {
      repoRoot: '/repo',
      defaultBranch: 'main',
      remote: { available: true, reason: null, asOf: ASOF, stale: false, truncated: false },
      actions: { state: 'no-evidence', evidence: [], asOf: ASOF },
    },
  ],
  assessment: { complete: true, limits: [] },
  counts: { merge: 1, G1: 0, G2: 1, goalRatification: 0 },
  items,
  ...over,
})

test('renders facts verbatim and never a readiness verdict', () => {
  const html = decisionsHtml(
    data([
      merge(1, { mergeStateStatus: 'CLEAN', reviewDecision: 'APPROVED', mergeable: 'UNKNOWN' }),
      gate('P2', 'G2'),
    ]),
  )
  const doc = new JSDOM(`<body>${html}</body>`).window.document
  const text = (doc.body.textContent ?? '').toLowerCase()
  for (const word of [
    'ready to merge',
    'safe to merge',
    'good to go',
    'all green',
    'ready for merge',
  ]) {
    assert.ok(!text.includes(word), word)
  }
  assert.match(doc.body.textContent ?? '', /CLEAN/)
  assert.match(doc.body.textContent ?? '', /UNKNOWN/)
  assert.match(doc.body.textContent ?? '', /APPROVED/)
  assert.match(doc.body.textContent ?? '', /Your decision/)
  assert.equal(doc.querySelectorAll('tr.dec-row').length, 2)
})

test('every remote string is escaped and only github pull-request links become anchors', () => {
  const evil = '<img src=x onerror="alert(1)">'
  const html = decisionsHtml(
    data([
      merge(1, { title: evil, headRef: evil, url: 'javascript:alert(1)' }),
      merge(2, { url: 'https://github.com/o/r/pull/2' }),
      merge(3, { url: 'https://evil.example/o/r/pull/3' }),
    ]),
  )
  const doc = new JSDOM(`<body>${html}</body>`).window.document
  assert.equal(doc.querySelector('img'), null)
  const hrefs = [...doc.querySelectorAll('a')].map((a) => a.getAttribute('href'))
  assert.deepEqual(hrefs, ['https://github.com/o/r/pull/2'])
})

test('billing banner appears only with the annotation evidence and quotes it', () => {
  const none = bannersHtml(data([]))
  assert.ok(!/billing|not starting/i.test(none))
  const proven = bannersHtml(
    data([], {
      repos: [
        {
          repoRoot: '/repo',
          defaultBranch: 'main',
          remote: { available: true, reason: null, asOf: ASOF, stale: false, truncated: false },
          actions: { state: 'not-starting', evidence: [`#218: ${BILLING}`], asOf: ASOF },
        },
      ],
    }),
  )
  assert.match(proven, /not starting jobs/)
  assert.match(proven, /recent account payments have failed/)
  assert.match(proven, /as of 2026-10-13 16:00 UTC/)
})

test('cause cells stay distinct: billing, failed-unknown, none; unavailable and stale remotes are announced', () => {
  const html = decisionsHtml(
    data([
      merge(1, {
        checks: { state: 'failed', passed: 0, failed: 1, pending: 0, unrecognised: 0, failing: [] },
        cause: {
          code: 'billing-blocked',
          annotation: BILLING,
          asOf: ASOF,
          capped: false,
          note: null,
        },
      }),
      merge(2, {
        checks: { state: 'failed', passed: 0, failed: 1, pending: 0, unrecognised: 0, failing: [] },
        cause: {
          code: 'failed-unknown',
          annotation: null,
          asOf: null,
          capped: true,
          note: 'annotation cap reached',
        },
      }),
      merge(3, {
        checks: { state: 'none', passed: 0, failed: 0, pending: 0, unrecognised: 0, failing: [] },
      }),
    ]),
  )
  assert.match(html, /Not started: account billing/)
  assert.match(html, /Failed, cause unknown/)
  assert.match(html, /annotation cap reached/)
  assert.match(html, /No checks reported/)
  const down = decisionsHtml(
    data([gate('P2', 'G2')], {
      repos: [
        {
          repoRoot: '/repo',
          defaultBranch: null,
          remote: {
            available: false,
            reason: 'gh is not installed',
            asOf: null,
            stale: false,
            truncated: false,
          },
          actions: { state: 'unknown', evidence: [], asOf: null },
        },
      ],
    }),
  )
  assert.match(down, /GitHub unavailable/)
  assert.match(down, /gh is not installed/)
  assert.match(down, /P2/, 'local gate items remain when GitHub is down')
  const stale = bannersHtml(
    data([], {
      repos: [
        {
          repoRoot: '/repo',
          defaultBranch: 'main',
          remote: {
            available: true,
            reason: 'network down',
            asOf: ASOF,
            stale: true,
            truncated: false,
          },
          actions: { state: 'unknown', evidence: [], asOf: null },
        },
      ],
    }),
  )
  assert.match(stale, /earlier facts/)
  assert.match(stale, /2026-10-13 16:00 UTC/)
})

test('filters and search narrow the list; pagination caps rows', () => {
  const items = [merge(1), merge(2, { title: 'fix: parser' }), gate('P2', 'G2'), gate('P3', 'G1')]
  assert.equal(filterItems(items, 'merge', '').length, 2)
  assert.equal(filterItems(items, 'G1', '').length, 1)
  assert.equal(filterItems(items, '', 'parser').length, 1)
  assert.equal(filterItems(items, 'G2', 'P2').length, 1)
  const many = Array.from({ length: DECISIONS_PAGE_SIZE + 5 }, (_, i) => merge(i + 1))
  const doc = new JSDOM(`<body>${decisionsHtml(data(many))}</body>`).window.document
  assert.equal(doc.querySelectorAll('tr.dec-row').length, DECISIONS_PAGE_SIZE)
  assert.ok(doc.querySelector('.pagination'))
})

test('empty state is honest', () => {
  const html = decisionsHtml(data([], { counts: { merge: 0, G1: 0, G2: 0, goalRatification: 0 } }))
  assert.match(html, /Nothing is waiting for you/)
})

test('console: Decisions loads on demand, shows the nav count, filters, and renders without extra requests', async () => {
  const route = data([merge(1), merge(2), gate('P2', 'G2')])
  const ctx = await mountConsole({ '/api/decisions': route })
  try {
    assert.ok(
      !ctx.requests.some((r) => r.path.startsWith('/api/decisions')),
      'not fetched until opened',
    )
    ctx.click('[data-view="decisions"]')
    await ctx.settle()
    assert.equal(ctx.requests.filter((r) => r.path.startsWith('/api/decisions')).length, 1)
    assert.equal(ctx.doc.querySelectorAll('tr.dec-row').length, 3)
    assert.match(ctx.doc.querySelector('[data-nav-badge="decisions"]')?.textContent ?? '', /\(3\)/)
    const before = ctx.requests.length
    ctx.click('[data-dec-filter="G2"]')
    assert.equal(ctx.doc.querySelectorAll('tr.dec-row').length, 1)
    ctx.click('[data-dec-filter="merge"]')
    assert.equal(ctx.doc.querySelectorAll('tr.dec-row').length, 2)
    assert.equal(ctx.requests.length, before, 'filtering makes no request')
  } finally {
    ctx.close()
  }
})

test('console: a failed decisions read says so; a later failure keeps the last good data labelled', async () => {
  let fail = true
  const route = data([merge(1)])
  const ctx = await mountConsole({
    '/api/decisions': () => {
      if (fail) throw new Error('boom')
      return route
    },
  })
  try {
    ctx.click('[data-view="decisions"]')
    await ctx.settle()
    assert.match(
      ctx.doc.getElementById('decisions-body')?.textContent ?? '',
      /Could not load decisions/,
    )
    fail = false
    ctx.click('#refresh')
    await ctx.settle()
    assert.equal(ctx.doc.querySelectorAll('tr.dec-row').length, 1)
    fail = true
    ctx.click('#refresh')
    await ctx.settle()
    assert.equal(ctx.doc.querySelectorAll('tr.dec-row').length, 1)
    assert.match(
      ctx.doc.getElementById('decisions-body')?.textContent ?? '',
      /Showing the last successful read/,
    )
  } finally {
    ctx.close()
  }
})
