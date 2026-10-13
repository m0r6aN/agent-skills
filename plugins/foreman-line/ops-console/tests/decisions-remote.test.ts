import assert from 'node:assert/strict'
import test from 'node:test'
import {
  ANNOTATION_CACHE_MAX,
  assertReadOnlyGh,
  BILLING_TEXTS,
  checkRunIdOf,
  clearDecisionCaches,
  gatherAnnotation,
  gatherOpenPrs,
  guardedGh,
  isBillingMessage,
  OPEN_PR_LIMIT,
  parseOpenPrs,
  summariseChecks,
} from '../src/decisions-remote.js'
import { FAILURE_TTL_MS } from '../src/reconcile-remote.js'

/**
 * FCA-P9 remote facts. Zero live network: every `gh` call goes through an
 * injected runner behind the read-only allowlist guard.
 */
const NOW = Date.parse('2026-10-13T16:00:00Z')

// The real annotation text captured from m0r6aN/agent-skills on 2026-10-13.
const REAL_BILLING =
  "The job was not started because recent account payments have failed or your spending limit needs to be increased. Please check the 'Billing & plans' section in your settings"

function pr(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    number: 218,
    title: 'feat: session ledger',
    url: 'https://github.com/o/r/pull/218',
    headRefName: 'feat/fca-p7-session-ledger',
    headRefOid: 'a'.repeat(40),
    baseRefName: 'main',
    isDraft: false,
    mergeable: 'MERGEABLE',
    mergeStateStatus: 'BLOCKED',
    reviewDecision: '',
    latestReviews: [],
    statusCheckRollup: [],
    createdAt: '2026-10-13T10:00:00Z',
    updatedAt: '2026-10-13T11:00:00Z',
    ...overrides,
  }
}

const jobUrl = (id: number) => `https://github.com/o/r/actions/runs/1/job/${id}`

test('assertReadOnlyGh allows only pr list, pr view and the annotation GET', () => {
  assert.doesNotThrow(() =>
    assertReadOnlyGh(['pr', 'list', '--state', 'open', '--limit', '200', '--json', 'number,title']),
  )
  assert.doesNotThrow(() => assertReadOnlyGh(['pr', 'view', '218', '--json', 'number,state']))
  assert.doesNotThrow(() =>
    assertReadOnlyGh(['api', 'repos/{owner}/{repo}/check-runs/115392291023/annotations']),
  )
  const refused: (readonly string[])[] = [
    ['pr', 'merge', '218'],
    ['pr', 'merge', '--json', 'number'],
    ['pr', 'close', '--state', 'open'],
    ['pr', 'edit', '--limit', '5'],
    ['pr', 'checkout', '218'],
    ['pr', 'close', '218'],
    ['pr', 'edit', '218', '--base', 'main'],
    ['pr', 'review', '218', '--approve'],
    ['pr', 'comment', '218', '--body', 'x'],
    ['pr', 'ready', '218'],
    ['pr', 'list', '--state', 'open', '--web'],
    ['pr', 'list', '--web', '1'],
    ['pr', 'list', '--state', 'open', '--limit', '1; rm', '--json', 'number'],
    ['pr', 'view', '218', '--web', 'x'],
    ['pr', 'view', '218', '--comments'],
    ['api', '-X', 'POST', 'repos/{owner}/{repo}/check-runs/1/annotations'],
    ['api', '--method', 'DELETE', 'repos/{owner}/{repo}/check-runs/1/annotations'],
    ['api', 'repos/{owner}/{repo}/check-runs/1/annotations', '--input', 'x.json'],
    ['api', 'repos/{owner}/{repo}/check-runs/1/annotations', '-f', 'a=b'],
    ['api', 'repos/{owner}/{repo}/check-runs/1/annotations', '-F', 'a=b'],
    ['api', 'repos/{owner}/{repo}/pulls/218/merge'],
    ['api', 'repos/{owner}/{repo}/check-runs/abc/annotations'],
    ['api', 'graphql'],
    ['repo', 'delete', 'x'],
    ['auth', 'logout'],
    ['workflow', 'run', 'x'],
    [],
  ]
  for (const args of refused) {
    assert.throws(() => assertReadOnlyGh(args), /gh argv refused/, JSON.stringify(args))
  }
})

test('guardedGh refuses before the runner is ever called', () => {
  let called = 0
  const run = guardedGh(() => {
    called += 1
    return '[]'
  })
  assert.throws(() => run('/r', ['pr', 'merge', '1']), /gh argv refused/)
  assert.equal(called, 0)
  run('/r', ['pr', 'list', '--state', 'open', '--limit', '1', '--json', 'number'])
  assert.equal(called, 1)
})

test('checkRunIdOf reads the job id from a details url and nothing else', () => {
  assert.equal(checkRunIdOf(jobUrl(115392291023)), 115392291023)
  assert.equal(checkRunIdOf('https://github.com/o/r/actions/runs/38416578545'), null)
  assert.equal(checkRunIdOf('https://example.com/job/12abc'), null)
  assert.equal(checkRunIdOf(''), null)
  assert.equal(checkRunIdOf(undefined), null)
})

test('billing detection matches the real annotation and not other failures', () => {
  assert.equal(isBillingMessage(REAL_BILLING), true)
  assert.equal(isBillingMessage('Process completed with exit code 1.'), false)
  assert.equal(isBillingMessage(''), false)
  assert.ok(BILLING_TEXTS.length >= 2)
})

test('summariseChecks: none, passed, failed, pending and unrecognised entries stay distinct', () => {
  assert.equal(summariseChecks([]).state, 'none')
  const ok = {
    __typename: 'CheckRun',
    name: 'gate',
    status: 'COMPLETED',
    conclusion: 'SUCCESS',
    detailsUrl: jobUrl(1),
  }
  const skipped = { ...ok, name: 's', conclusion: 'SKIPPED' }
  const bad = { ...ok, name: 'sweep', conclusion: 'FAILURE', detailsUrl: jobUrl(2) }
  const pend = { ...ok, name: 'p', status: 'IN_PROGRESS', conclusion: '' }
  const ctxOk = { __typename: 'StatusContext', context: 'ci', state: 'SUCCESS', targetUrl: '' }
  const ctxBad = { __typename: 'StatusContext', context: 'ci2', state: 'ERROR', targetUrl: '' }
  assert.deepEqual(
    (({ state, passed, failed, pending }) => ({ state, passed, failed, pending }))(
      summariseChecks([ok, skipped, ctxOk]),
    ),
    { state: 'passed', passed: 3, failed: 0, pending: 0 },
  )
  const failed = summariseChecks([ok, bad, pend, ctxBad])
  assert.equal(failed.state, 'failed')
  assert.equal(failed.failed, 2)
  assert.equal(failed.pending, 1)
  assert.deepEqual(
    failed.failing.map((f) => f.name),
    ['sweep', 'ci2'],
  )
  assert.equal(failed.failing[0]?.checkRunId, 2)
  assert.equal(failed.failing[1]?.checkRunId, null)
  assert.equal(summariseChecks([ok, pend]).state, 'pending')
  // An entry the parser does not recognise is never counted as passing.
  const odd = summariseChecks([ok, { __typename: 'Something', name: 'x' }])
  assert.equal(odd.state, 'unknown')
  assert.equal(odd.passed, 1)
  assert.equal(odd.unrecognised, 1)
})

test('parseOpenPrs keeps UNKNOWN as unknown, counts reviews, and rejects malformed output', () => {
  const parsed = parseOpenPrs(
    JSON.stringify([
      pr({
        mergeable: 'UNKNOWN',
        mergeStateStatus: 'UNKNOWN',
        reviewDecision: 'CHANGES_REQUESTED',
        latestReviews: [
          { state: 'APPROVED', author: { login: 'a' } },
          { state: 'CHANGES_REQUESTED', author: { login: 'b' } },
          { state: 'COMMENTED', author: { login: 'c' } },
        ],
        isDraft: true,
      }),
    ]),
  )
  assert.ok(parsed)
  const first = parsed[0]
  assert.equal(first?.mergeable, 'UNKNOWN')
  assert.equal(first?.mergeStateStatus, 'UNKNOWN')
  assert.equal(first?.isDraft, true)
  assert.deepEqual(first?.reviews, { approved: 1, changesRequested: 1, commented: 1, total: 3 })
  assert.equal(first?.reviewDecision, 'CHANGES_REQUESTED')
  assert.equal(parseOpenPrs('not json'), null)
  assert.equal(parseOpenPrs('{}'), null)
  assert.equal(parseOpenPrs(JSON.stringify([{ title: 'no number' }])), null)
})

test('gatherOpenPrs: one list call, asOf stamped, truncation flagged, cache honoured', () => {
  clearDecisionCaches()
  const calls: (readonly string[])[] = []
  const run = (_cwd: string, args: readonly string[]) => {
    calls.push(args)
    return JSON.stringify([pr()])
  }
  const facts = gatherOpenPrs('/repo', NOW, { run, ttlMs: 60_000 })
  assert.equal(facts.available, true)
  assert.equal(facts.asOf, new Date(NOW).toISOString())
  assert.equal(facts.prs.length, 1)
  assert.equal(facts.truncated, false)
  assert.deepEqual(calls[0]?.slice(0, 4), ['pr', 'list', '--state', 'open'])
  gatherOpenPrs('/repo', NOW + 30_000, { run, ttlMs: 60_000 })
  assert.equal(calls.length, 1)
  const later = gatherOpenPrs('/repo', NOW + 61_000, { run, ttlMs: 60_000 })
  assert.equal(calls.length, 2)
  assert.equal(later.asOf, new Date(NOW + 61_000).toISOString())

  clearDecisionCaches()
  const many = gatherOpenPrs('/big', NOW, {
    ttlMs: 0,
    run: () =>
      JSON.stringify(Array.from({ length: OPEN_PR_LIMIT }, (_, i) => pr({ number: i + 1 }))),
  })
  assert.equal(many.truncated, true)
})

test('gatherOpenPrs degrades to unavailable with a reason; failure is cached briefly; stale facts keep their age', () => {
  clearDecisionCaches()
  const enoent = gatherOpenPrs('/a', NOW, {
    ttlMs: 0,
    run: () => {
      throw Object.assign(new Error('spawn gh ENOENT'), { code: 'ENOENT' })
    },
  })
  assert.equal(enoent.available, false)
  assert.match(enoent.reason ?? '', /not installed/)
  assert.equal(enoent.asOf, null)
  assert.deepEqual(enoent.prs, [])
  const bad = gatherOpenPrs('/b', NOW, { ttlMs: 0, run: () => 'garbage' })
  assert.equal(bad.available, false)

  // Success, then the refetch fails after TTL: the old facts are kept and labelled with their OLD age.
  clearDecisionCaches()
  let fail = false
  const run = () => {
    if (fail) throw new Error('network down')
    return JSON.stringify([pr()])
  }
  const first = gatherOpenPrs('/c', NOW, { run, ttlMs: 60_000 })
  fail = true
  const second = gatherOpenPrs('/c', NOW + 120_000, { run, ttlMs: 60_000 })
  assert.equal(second.available, true)
  assert.equal(second.asOf, first.asOf)
  assert.equal(second.stale, true)
  assert.match(second.reason ?? '', /network down/)

  // Failure on a cold cache is cached for FAILURE_TTL_MS, not re-probed each request.
  clearDecisionCaches()
  let n = 0
  const dead = () => {
    n += 1
    throw new Error('offline')
  }
  gatherOpenPrs('/d', NOW, { run: dead, ttlMs: 60_000 })
  gatherOpenPrs('/d', NOW + 1_000, { run: dead, ttlMs: 60_000 })
  assert.equal(n, 1)
  gatherOpenPrs('/d', NOW + FAILURE_TTL_MS + 1, { run: dead, ttlMs: 60_000 })
  assert.equal(n, 2)
})

test('gatherAnnotation: billing text, other text, empty, failure; completed runs cached; cache bounded', () => {
  clearDecisionCaches()
  let calls = 0
  const billing = (_cwd: string, args: readonly string[]) => {
    calls += 1
    assert.deepEqual(args, ['api', 'repos/{owner}/{repo}/check-runs/115392291023/annotations'])
    return JSON.stringify([{ message: REAL_BILLING, annotation_level: 'failure', title: '' }])
  }
  const a = gatherAnnotation('/repo', 115392291023, NOW, { run: billing })
  assert.equal(a.available, true)
  assert.equal(a.billing, true)
  assert.deepEqual(a.messages, [REAL_BILLING])
  assert.equal(a.asOf, new Date(NOW).toISOString())
  gatherAnnotation('/repo', 115392291023, NOW + 10 * 3_600_000, { run: billing })
  assert.equal(calls, 1, 'a completed check run is immutable: cached without TTL')

  const other = gatherAnnotation('/repo', 2, NOW, {
    run: () => JSON.stringify([{ message: 'Process completed with exit code 1.' }]),
  })
  assert.equal(other.billing, false)
  assert.equal(other.messages.length, 1)
  const empty = gatherAnnotation('/repo', 3, NOW, { run: () => '[]' })
  assert.equal(empty.available, true)
  assert.equal(empty.billing, false)
  assert.deepEqual(empty.messages, [])
  const failed = gatherAnnotation('/repo', 4, NOW, {
    run: () => {
      throw new Error('rate limited')
    },
  })
  assert.equal(failed.available, false)
  assert.equal(failed.billing, false)
  assert.match(failed.reason ?? '', /rate limited/)
  const malformed = gatherAnnotation('/repo', 5, NOW, { run: () => '{"x":1}' })
  assert.equal(malformed.available, false)

  clearDecisionCaches()
  let again = 0
  const counted = () => {
    again += 1
    return '[]'
  }
  for (let id = 1; id <= ANNOTATION_CACHE_MAX + 10; id++) {
    gatherAnnotation('/repo', id, NOW, { run: counted })
  }
  const before = again
  gatherAnnotation('/repo', ANNOTATION_CACHE_MAX + 10, NOW, { run: counted })
  assert.equal(again, before, 'most recent entry still cached')
  gatherAnnotation('/repo', 1, NOW, { run: counted })
  assert.equal(again, before + 1, 'oldest entry was evicted: the cache is bounded')
})
