import assert from 'node:assert/strict'
import test from 'node:test'
import { type ApiRequest, handleApi } from '../src/api.js'
import {
  buildDecisions,
  composeMergeItems,
  type DecisionsResponse,
  type GateItem,
  type MergeItem,
} from '../src/decisions.js'
import {
  type AnnotationFact,
  clearDecisionCaches,
  type OpenPr,
  type OpenPrFacts,
  summariseChecks,
} from '../src/decisions-remote.js'
import { type Scenario, withTempRepo } from './support/materialize.js'

/**
 * FCA-P9 decisions queue: composition of PR facts into merge items (order,
 * stack, cause, caps, banner) and of the existing R3 projection into gate
 * items. Facts are shown verbatim; nothing here reads as "ready".
 */
const NOW = Date.parse('2026-10-13T16:00:00Z')
const ASOF = new Date(NOW).toISOString()
const BILLING =
  "The job was not started because recent account payments have failed or your spending limit needs to be increased. Please check the 'Billing & plans' section in your settings"

const job = (id: number) => `https://github.com/o/r/actions/runs/1/job/${id}`
const failedRun = (name: string, id: number) => ({
  __typename: 'CheckRun',
  name,
  status: 'COMPLETED',
  conclusion: 'FAILURE',
  detailsUrl: job(id),
})
const okRun = (name: string) => ({
  __typename: 'CheckRun',
  name,
  status: 'COMPLETED',
  conclusion: 'SUCCESS',
  detailsUrl: job(1),
})

function pr(number: number, over: Partial<OpenPr> & { rollup?: unknown[] } = {}): OpenPr {
  const { rollup, ...rest } = over
  return {
    number,
    title: `feat: pr ${number}`,
    url: `https://github.com/o/r/pull/${number}`,
    headRefName: `feat/b${number}`,
    headRefOid: String(number).padStart(40, '0'),
    baseRefName: 'main',
    isDraft: false,
    mergeable: 'MERGEABLE',
    mergeStateStatus: 'BLOCKED',
    reviewDecision: '',
    reviews: { approved: 0, changesRequested: 0, commented: 0, total: 0 },
    checks: summariseChecks(rollup ?? []),
    createdAt: `2026-10-13T1${number % 10}:00:00Z`,
    updatedAt: ASOF,
    ...rest,
  }
}

function facts(prs: OpenPr[], over: Partial<OpenPrFacts> = {}): OpenPrFacts {
  return {
    available: true,
    reason: null,
    asOf: ASOF,
    stale: false,
    prs,
    truncated: false,
    ...over,
  }
}

const billingFact = (id: number): AnnotationFact => ({
  checkRunId: id,
  available: true,
  reason: null,
  asOf: ASOF,
  messages: [BILLING],
  billing: true,
})
const otherFact = (id: number): AnnotationFact => ({
  checkRunId: id,
  available: true,
  reason: null,
  asOf: ASOF,
  messages: ['Process completed with exit code 1.'],
  billing: false,
})

const compose = (
  prs: OpenPr[],
  annotate: (id: number) => AnnotationFact | null,
  defaultBranch: string | null = 'main',
) =>
  composeMergeItems({
    repoRoot: '/repo',
    prs: facts(prs),
    defaultBranch,
    annotate,
    now: NOW,
    budget: { perPr: 5, perRequest: 20, used: 0 },
  })

test('replay 2026-10-13: #218 precedes #219, #219 waits on #218, both billing-blocked, repo banner not-starting', () => {
  const p218 = pr(218, {
    headRefName: 'feat/fca-p7-session-ledger',
    rollup: [failedRun('gate', 101), failedRun('test', 102), okRun('lint')],
  })
  const p219 = pr(219, {
    headRefName: 'feat/fca-p8-reconciliation',
    baseRefName: 'feat/fca-p7-session-ledger',
    rollup: [failedRun('gate', 201)],
  })
  // Deliberately listed dependant-first: order must come from the stack, not input order.
  const out = compose([p219, p218], (id) => billingFact(id))
  assert.deepEqual(
    out.items.map((item) => item.number),
    [218, 219],
  )
  const [a, b] = out.items as [MergeItem, MergeItem]
  assert.equal(a.stack.baseIsDefault, true)
  assert.equal(a.stack.waitsOn, null)
  assert.equal(b.stack.baseIsDefault, false)
  assert.equal(b.stack.waitsOn, 218)
  assert.equal(a.cause.code, 'billing-blocked')
  assert.equal(a.cause.annotation, BILLING)
  assert.equal(a.cause.asOf, ASOF)
  assert.equal(b.cause.code, 'billing-blocked')
  assert.equal(out.actions.state, 'not-starting')
  assert.ok(out.actions.evidence.some((line) => line.includes(BILLING)))
  assert.equal(out.actions.asOf, ASOF)
})

test('cause stays distinct: billing, failed-unknown, no checks, pending, passed', () => {
  const failedOther = pr(1, { rollup: [failedRun('t', 11)] })
  const noChecks = pr(2)
  const pending = pr(3, {
    rollup: [
      {
        __typename: 'CheckRun',
        name: 'p',
        status: 'IN_PROGRESS',
        conclusion: '',
        detailsUrl: job(31),
      },
    ],
  })
  const passed = pr(4, { rollup: [okRun('a')] })
  const billed = pr(5, { rollup: [failedRun('b', 51)] })
  const out = compose([failedOther, noChecks, pending, passed, billed], (id) =>
    id === 51 ? billingFact(id) : otherFact(id),
  )
  const by = new Map(out.items.map((item) => [item.number, item]))
  assert.equal(by.get(1)?.cause.code, 'failed-unknown')
  assert.equal(by.get(1)?.checks.state, 'failed')
  assert.equal(by.get(2)?.cause.code, 'none')
  assert.equal(by.get(2)?.checks.state, 'none')
  assert.equal(by.get(3)?.cause.code, 'none')
  assert.equal(by.get(3)?.checks.state, 'pending')
  assert.equal(by.get(4)?.cause.code, 'none')
  assert.equal(by.get(4)?.checks.state, 'passed')
  assert.equal(by.get(5)?.cause.code, 'billing-blocked')
  assert.equal(
    out.actions.state,
    'not-starting',
    'one proven billing annotation raises the repo banner',
  )
})

test('no banner without annotation evidence: unavailable annotation and other failures never read as billing', () => {
  const failed = pr(1, { rollup: [failedRun('t', 11)] })
  const unavailable = compose([failed], () => ({
    checkRunId: 11,
    available: false,
    reason: 'rate limited',
    asOf: null,
    messages: [],
    billing: false,
  }))
  assert.equal(unavailable.items[0]?.cause.code, 'failed-unknown')
  assert.match(unavailable.items[0]?.cause.note ?? '', /rate limited/)
  assert.notEqual(unavailable.actions.state, 'not-starting')
  const other = compose([failed], otherFact)
  assert.notEqual(other.actions.state, 'not-starting')
  const nullLookup = compose([failed], () => null)
  assert.equal(nullLookup.items[0]?.cause.code, 'failed-unknown')
  assert.match(nullLookup.items[0]?.cause.note ?? '', /not checked/)
})

test('annotation caps: per PR 5 and per request 20; a capped fact says so and is never silently omitted', () => {
  const many = pr(1, { rollup: Array.from({ length: 8 }, (_, i) => failedRun(`j${i}`, 100 + i)) })
  const looked: number[] = []
  const out = compose([many], (id) => {
    looked.push(id)
    return otherFact(id)
  })
  assert.equal(looked.length, 5)
  assert.equal(out.items[0]?.cause.capped, true)
  assert.match(out.items[0]?.cause.note ?? '', /cap/)

  const prs = Array.from({ length: 6 }, (_, i) =>
    pr(10 + i, {
      rollup: Array.from({ length: 5 }, (_, j) => failedRun(`j${j}`, 1000 + i * 10 + j)),
    }),
  )
  let total = 0
  const second = compose(prs, (id) => {
    total += 1
    return otherFact(id)
  })
  assert.equal(total, 20)
  assert.ok(second.items.some((item) => item.cause.capped))
})

test('no readiness verdict anywhere in the response', () => {
  const clean = pr(1, {
    mergeStateStatus: 'CLEAN',
    reviewDecision: 'APPROVED',
    rollup: [okRun('a')],
  })
  const out = compose([clean], otherFact)
  const text = JSON.stringify(out).toLowerCase()
  for (const word of [
    '"ready"',
    'ready to merge',
    '"safe"',
    'safe to merge',
    'mergeable-now',
    '"green"',
    'all clear',
  ]) {
    assert.ok(!text.includes(word), `response must not contain ${word}`)
  }
  // Facts are verbatim.
  assert.equal(out.items[0]?.mergeStateStatus, 'CLEAN')
  assert.equal(out.items[0]?.reviewDecision, 'APPROVED')
})

test('UNKNOWN stays UNKNOWN; drafts and conflicts are listed and labelled, not hidden', () => {
  const out = compose(
    [
      pr(1, { mergeable: 'UNKNOWN', mergeStateStatus: 'UNKNOWN' }),
      pr(2, { isDraft: true, mergeStateStatus: 'DRAFT' }),
      pr(3, { mergeable: 'CONFLICTING', mergeStateStatus: 'DIRTY' }),
    ],
    otherFact,
  )
  const by = new Map(out.items.map((item) => [item.number, item]))
  assert.equal(by.get(1)?.mergeable, 'UNKNOWN')
  assert.equal(by.get(2)?.isDraft, true)
  assert.equal(by.get(3)?.mergeable, 'CONFLICTING')
})

test('stacks: three-deep order, orphaned base, unknown default branch, cycle safety', () => {
  const a = pr(1, { headRefName: 'a', createdAt: '2026-10-13T09:00:00Z' })
  const b = pr(2, { headRefName: 'b', baseRefName: 'a', createdAt: '2026-10-13T08:00:00Z' })
  const c = pr(3, { headRefName: 'c', baseRefName: 'b', createdAt: '2026-10-13T07:00:00Z' })
  const orphan = pr(4, { headRefName: 'd', baseRefName: 'gone-branch' })
  const out = compose([c, orphan, b, a], otherFact)
  const order = out.items.map((item) => item.number)
  assert.ok(order.indexOf(1) < order.indexOf(2) && order.indexOf(2) < order.indexOf(3))
  const by = new Map(out.items.map((item) => [item.number, item]))
  assert.equal(by.get(3)?.stack.waitsOn, 2)
  assert.equal(by.get(4)?.stack.baseIsDefault, false)
  assert.equal(by.get(4)?.stack.waitsOn, null)
  assert.equal(out.items.length, 4, 'no PR is lost')

  const unknownDefault = compose([a, b], otherFact, null)
  const u = new Map(unknownDefault.items.map((item) => [item.number, item]))
  assert.equal(u.get(1)?.stack.baseIsDefault, null)

  const x = pr(5, { headRefName: 'x', baseRefName: 'y' })
  const y = pr(6, { headRefName: 'y', baseRefName: 'x' })
  const cyc = compose([x, y], otherFact)
  assert.equal(cyc.items.length, 2)
})

test('commands are not presented in stage 1', () => {
  const out = compose([pr(1)], otherFact)
  assert.equal(out.items[0]?.command, null)
})

// ------------------------------------------------------------------ gate items

function gateScenario(): Scenario {
  return {
    name: 'decisions-gates',
    now: '2026-09-26T12:00:00.000Z',
    goal: {
      slug: 'goal-dec',
      queue: [
        '1. **P1** shaped; awaiting approval.',
        '2. **P2** registered; awaiting dispatch.',
        '3. **P3** merged soon.',
      ],
      charterStatus: 'RATIFIED — Gate 1 granted 2026-09-16 (owner).',
    },
    specs: [
      { name: 'P1-alpha.md', location: 'active', updated: '2026-09-01' },
      { name: 'P2-beta.md', location: 'active', updated: '2026-08-01' },
      { name: 'P3-gamma.md', location: 'active', updated: '2026-08-01' },
    ],
    sidecars: [{ kind: 'projected', spec: 'P1-alpha.md' }],
    chains: [
      {
        workflowId: '00000000-0000-4000-8000-0000000000a2',
        parcel: 'P2',
        stages: ['A', 'B'],
        timestampOffsetHours: [-720, -700],
      },
      {
        workflowId: '00000000-0000-4000-8000-0000000000a3',
        parcel: 'P3',
        stages: ['A', 'B', 'C', 'D', 'E'],
        timestampOffsetHours: [-720, -710, -700, -690, -680],
      },
    ],
    expected: [],
  }
}

const noGh = () => {
  throw new Error('gh unavailable in this test')
}

test('gate items: R3 G1 and G2 parcels listed with evidence; tip-E (G3) parcels are not gate items; remote down leaves them', () => {
  clearDecisionCaches()
  withTempRepo(gateScenario(), ({ config }) => {
    const out = buildDecisions(config, NOW, { gh: noGh, git: () => 'origin/main' })
    const gates = out.items.filter((item): item is GateItem => item.kind === 'gate')
    const by = new Map(gates.map((g) => [g.parcel, g]))
    assert.equal(by.get('P1')?.gate, 'G1')
    assert.equal(by.get('P1')?.rule, 'R3')
    assert.equal(by.get('P2')?.gate, 'G2')
    assert.equal(by.get('P2')?.tipStage, 'B')
    assert.match(by.get('P2')?.chainLocator ?? '', /docs\/receipts\//)
    assert.ok((by.get('P1')?.evidence ?? '').length > 0)
    assert.equal(by.has('P3'), false, 'tip E is Gate 3, served by the PR list')
    assert.equal(by.get('P1')?.command, null)
    assert.equal(out.counts.G1, 1)
    assert.equal(out.counts.G2, 1)
    assert.equal(out.counts.merge, 0)
    // Remote unavailable: reason shown, local items still present, nothing asserted about PRs.
    assert.equal(out.repos[0]?.remote.available, false)
    assert.match(out.repos[0]?.remote.reason ?? '', /gh unavailable/)
    assert.equal(out.repos[0]?.actions.state, 'unknown')
    assert.equal(out.assessment.complete, false)
  })
})

test('GET /api/decisions is read-only, refuses other methods, and leaves /api/gates byte-identical', () => {
  clearDecisionCaches()
  withTempRepo(gateScenario(), ({ config }) => {
    const request = (method: string, path: string): ApiRequest => {
      const url = new URL(path, 'http://localhost')
      return { method, pathname: url.pathname, query: url.searchParams, body: {} }
    }
    const gatesBefore = JSON.stringify(
      handleApi(config, request('GET', '/api/gates?goal=goal-dec'), NOW),
    )
    const res = handleApi(config, request('GET', '/api/decisions'), NOW, {
      decisions: { gh: noGh, git: () => 'origin/main' },
    })
    assert.equal(res.status, 200)
    const json = res.json as DecisionsResponse
    assert.ok(Array.isArray(json.items))
    assert.equal(handleApi(config, request('POST', '/api/decisions'), NOW).status, 405)
    const gatesAfter = JSON.stringify(
      handleApi(config, request('GET', '/api/gates?goal=goal-dec'), NOW),
    )
    assert.equal(gatesAfter, gatesBefore)
    const filtered = handleApi(config, request('GET', '/api/decisions?repo=/nowhere'), NOW, {
      decisions: { gh: noGh, git: () => 'origin/main' },
    })
    assert.equal(filtered.status, 200)
    assert.equal((filtered.json as DecisionsResponse).items.length, 0)
  })
})

test('buildDecisions merges real-shaped gh output through the guarded runner and records a failure of one repo without losing gates', () => {
  clearDecisionCaches()
  withTempRepo(gateScenario(), ({ config }) => {
    const calls: (readonly string[])[] = []
    const gh = (_cwd: string, args: readonly string[]) => {
      calls.push(args)
      if (args[0] === 'api') {
        return JSON.stringify([{ message: BILLING, annotation_level: 'failure' }])
      }
      return JSON.stringify([
        {
          number: 218,
          title: 'feat: session ledger',
          url: 'https://github.com/o/r/pull/218',
          headRefName: 'feat/fca-p7-session-ledger',
          headRefOid: 'a'.repeat(40),
          baseRefName: 'main',
          isDraft: false,
          mergeable: 'UNKNOWN',
          mergeStateStatus: 'UNKNOWN',
          reviewDecision: '',
          latestReviews: [],
          statusCheckRollup: [failedRun('gate', 115392291023)],
          createdAt: '2026-10-13T10:00:00Z',
          updatedAt: '2026-10-13T11:00:00Z',
        },
      ])
    }
    const out = buildDecisions(config, NOW, { gh, git: () => 'origin/main' })
    assert.equal(out.counts.merge, 1)
    assert.equal(out.repos[0]?.actions.state, 'not-starting')
    assert.equal(out.repos[0]?.remote.available, true)
    assert.equal(out.assessment.complete, true)
    assert.equal(out.counts.G1 + out.counts.G2, 2)
    for (const args of calls) {
      assert.ok(
        args[0] === 'pr' || args[0] === 'api',
        `only read-only gh families run: ${args.join(' ')}`,
      )
    }
    assert.deepEqual(calls.filter((a) => a[0] === 'api')[0], [
      'api',
      'repos/{owner}/{repo}/check-runs/115392291023/annotations',
    ])
  })
})
