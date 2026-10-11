import assert from 'node:assert/strict'
import test from 'node:test'
import { projectGoal } from '../src/project.js'
import { goalHygieneProvider } from '../src/signals-goal.js'
import { goalStatus } from '../src/status.js'
import { needsFor } from '../ui/needs.js'
import { type Scenario, withTempRepo } from './support/materialize.js'

/**
 * FCA-P3 goal-hygiene provider (Task 8): goal records needing attention
 * beyond parcel state — ratification records (pending/unknown) and stale
 * loop-directive states (narrative-active or queue-unplaced goals). Plus the
 * FCA-2 integration: goal attention counts carry a signal-severity breakdown
 * and the board `needs` treatment escalates on urgent signal subjects.
 */
const NOW = '2026-10-11T12:00:00.000Z'
const NOW_MS = Date.parse(NOW)

function goalScenario(overrides: Partial<Scenario['goal']>): Scenario {
  return {
    name: 'goal-hygiene',
    now: NOW,
    goal: {
      slug: 'goal-hyg',
      queue: ['1. **P1** dispatched; quiet.'],
      charterStatus: 'RATIFIED — Gate 1 granted 2026-09-16 (owner).',
      ...overrides,
    },
    specs: [{ name: 'P1-alpha.md', location: 'active', updated: '2026-09-01' }],
    chains: [],
    worktrees: [],
    expected: [],
  }
}

test('a granted, well-formed goal yields zero goal-hygiene signals', () => {
  withTempRepo(goalScenario({}), ({ config }) => {
    assert.deepEqual(goalHygieneProvider.collect(config, NOW_MS), [])
  })
})

test('pending and unknown ratification yield their evidence-backed signals', () => {
  withTempRepo(
    goalScenario({ charterStatus: 'pending ratification — owner review outstanding.' }),
    ({ config }) => {
      const projection = projectGoal(config, 'goal-hyg', NOW_MS)
      assert.equal(projection?.goal.ratification.status, 'pending', 'fixture reaches pending')
      const signals = goalHygieneProvider.collect(config, NOW_MS)
      const ratification = signals.find((signal) => signal.subject === 'goal-hyg/ratification')
      assert.ok(ratification, 'ratification signal exists')
      assert.equal(ratification.severity, 'attention')
      assert.ok(ratification.evidence.length > 0, 'evidence-backed')
      assert.ok(
        ratification.evidence.some((item) => item.includes('loop-directive')),
        'evidence cites the loop directive the record lives in',
      )
    },
  )

  withTempRepo(
    goalScenario({ charterStatus: 'Goal charter under construction.' }),
    ({ config }) => {
      const projection = projectGoal(config, 'goal-hyg', NOW_MS)
      assert.equal(projection?.goal.ratification.status, 'unknown', 'fixture reaches unknown')
      const signals = goalHygieneProvider.collect(config, NOW_MS)
      const ratification = signals.find((signal) => signal.subject === 'goal-hyg/ratification')
      assert.equal(ratification?.severity, 'info')
    },
  )
})

test('a narrative-active goal with no parsable queue yields the stale loop-directive signal', () => {
  withTempRepo(
    goalScenario({
      queue: [],
      stateLines: ['> **State (update on every stop/closure):** builder still wiring X.'],
    }),
    ({ config }) => {
      const signals = goalHygieneProvider.collect(config, NOW_MS)
      const stale = signals.find((signal) => signal.subject === 'goal-hyg/loop-directive')
      assert.ok(stale, 'stale loop-directive signal exists')
      assert.equal(stale.severity, 'info')
      assert.ok(stale.evidence.length > 0)
    },
  )
})

test('FCA-2 attention counts carry signal severities and urgent subjects', () => {
  withTempRepo(goalScenario({}), ({ config }) => {
    const projection = projectGoal(config, 'goal-hyg', NOW_MS)
    assert.ok(projection !== null)
    const signals = [
      { subject: 'goal-hyg/ratification', severity: 'attention' },
      { subject: 'goal-hyg/session', severity: 'urgent' },
      { subject: 'other-goal/session', severity: 'urgent' },
      { subject: 'goal-hyg/info-one', severity: 'info' },
    ] as never
    const status = goalStatus('goal-hyg', null, projection, signals)
    assert.deepEqual(status.attention.signals, { info: 1, attention: 1, urgent: 1 })
    assert.deepEqual(status.urgentSubjects, ['goal-hyg/session'], 'only this goal urgent subjects')
    assert.equal(status.attention.total >= 1, true)
  })
})

test('board needs treatment reflects urgent signals', () => {
  assert.equal(needsFor('running', true), 'needs needs-red', 'urgent escalates any card')
  assert.equal(needsFor('hung', false), 'needs needs-red')
  assert.equal(needsFor('failed', false), 'needs needs-red')
  assert.equal(needsFor('awaiting-gate', false), 'needs needs-amber')
  assert.equal(needsFor('complete', false), '')
  assert.equal(needsFor('running', false), '')
})
