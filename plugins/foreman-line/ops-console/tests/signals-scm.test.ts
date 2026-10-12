import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'
import { type ScmClient, scmCiProvider } from '../src/signals-scm.js'
import { type Scenario, withTempRepo } from './support/materialize.js'

/**
 * FCA-P3 scm-ci provider (Task 7): PR/CI semantics disk truth cannot see —
 * green-but-do-not-merge (the #166 canary class), conflicting+red (the #170
 * class), BEHIND under the strict ruleset, and merged PRs missing a release
 * event (the #170-merged-under-stale-version class). All `gh` access goes
 * through the injectable client — zero live network in tests — and `gh`
 * absence degrades to exactly one `info` signal.
 */
const NOW = '2026-10-11T12:00:00.000Z'
const NOW_MS = Date.parse(NOW)

function scmScenario(): Scenario {
  return {
    name: 'scm-ci',
    now: NOW,
    goal: {
      slug: 'goal-scm',
      queue: ['1. **P1** dispatched; quiet.'],
      charterStatus: 'RATIFIED — Gate 1 granted 2026-09-16 (owner).',
    },
    specs: [],
    chains: [],
    worktrees: [],
    expected: [],
  }
}

function client(overrides: Partial<ScmClient> = {}): ScmClient {
  return {
    available: () => true,
    hasRemote: () => true,
    openPrs: () => '[]',
    mergedPrs: () => '[]',
    ...overrides,
  }
}

const GREEN_CHECKS = [
  { status: 'COMPLETED', conclusion: 'SUCCESS' },
  { status: 'COMPLETED', conclusion: 'SUCCESS' },
]

test('clean open PRs yield zero signals', () => {
  withTempRepo(scmScenario(), ({ config }) => {
    const openPrs = JSON.stringify([
      {
        number: 10,
        title: 'feat: ordinary work',
        isDraft: false,
        mergeable: 'MERGEABLE',
        mergeStateStatus: 'CLEAN',
        statusCheckRollup: GREEN_CHECKS,
      },
    ])
    assert.deepEqual(scmCiProvider.collect(config, NOW_MS, client({ openPrs: () => openPrs })), [])
  })
})

test('green-but-do-not-merge and BEHIND produce their own signals (the #166 class)', () => {
  withTempRepo(scmScenario(), ({ config }) => {
    const openPrs = JSON.stringify([
      {
        number: 166,
        title: 'ci: gate validation (closes itself — do not merge)',
        isDraft: false,
        mergeable: 'MERGEABLE',
        mergeStateStatus: 'BEHIND',
        statusCheckRollup: GREEN_CHECKS,
      },
    ])
    const signals = scmCiProvider.collect(config, NOW_MS, client({ openPrs: () => openPrs }))
    assert.deepEqual(signals.map((signal) => signal.subject).sort(), [
      'pr/166/behind',
      'pr/166/do-not-merge',
    ])
    const doNotMerge = signals.find((signal) => signal.subject === 'pr/166/do-not-merge')
    assert.equal(doNotMerge?.severity, 'attention')
    assert.ok(doNotMerge?.evidence.some((item) => item.includes('do not merge')))
    const behind = signals.find((signal) => signal.subject === 'pr/166/behind')
    assert.equal(behind?.severity, 'info')
    assert.ok(behind?.evidence.some((item) => item.includes('strict')))
  })
})

test('conflicting + red PRs yield the red signal (the #170 class)', () => {
  withTempRepo(scmScenario(), ({ config }) => {
    const openPrs = JSON.stringify([
      {
        number: 170,
        title: 'Chore/ci fail fast charter',
        isDraft: false,
        mergeable: 'CONFLICTING',
        mergeStateStatus: 'DIRTY',
        statusCheckRollup: [
          { status: 'COMPLETED', conclusion: 'SUCCESS' },
          { status: 'COMPLETED', conclusion: 'FAILURE' },
        ],
      },
    ])
    const signals = scmCiProvider.collect(config, NOW_MS, client({ openPrs: () => openPrs }))
    const red = signals.find((signal) => signal.subject === 'pr/170/red')
    assert.ok(red, 'conflicting/red signal exists')
    assert.equal(red.severity, 'attention')
    assert.ok(red.actions.includes('close-delete'))
    assert.ok(red.evidence.some((item) => item.includes('CONFLICTING')))
  })
})

test('merged PRs after the last release date yield the release-gap signal (the #170-merge class)', () => {
  withTempRepo(scmScenario(), ({ config }) => {
    mkdirSync(join(config.repoRoot, 'plugins', 'alpha'), { recursive: true })
    writeFileSync(
      join(config.repoRoot, 'plugins', 'alpha', 'CHANGELOG.md'),
      '# Changelog\n\n## 2.0.0 \u2014 2026-10-07\n\n- cut\n',
    )
    const mergedPrs = JSON.stringify([
      {
        number: 170,
        title: 'Chore/ci fail fast charter',
        mergedAt: '2026-10-11T00:47:32Z',
        additions: 3279,
        deletions: 17,
      },
      {
        number: 5,
        title: 'old merged work',
        mergedAt: '2026-10-01T00:00:00Z',
        additions: 900,
        deletions: 100,
      },
    ])
    const signals = scmCiProvider.collect(config, NOW_MS, client({ mergedPrs: () => mergedPrs }))
    assert.deepEqual(
      signals.map((signal) => signal.subject),
      ['pr/170/release-gap'],
    )
    const gap = signals[0]
    assert.equal(gap?.severity, 'attention')
    assert.ok(
      gap?.evidence.some((item) => item.includes('2.0.0')),
      'cites the last release the PR missed',
    )
    assert.ok(
      gap?.evidence.some((item) => item.includes('3279') || item.includes('3296')),
      'cites the landed size',
    )
  })
})

test('gh absence degrades to exactly one info signal, no throw', () => {
  withTempRepo(scmScenario(), ({ config }) => {
    const signals = scmCiProvider.collect(
      config,
      NOW_MS,
      client({
        available: () => false,
        openPrs: () => {
          throw new Error('gh missing')
        },
      }),
    )
    assert.equal(signals.length, 1)
    assert.equal(signals[0]?.severity, 'info')
    assert.equal(signals[0]?.subject, 'gh')
  })
})
