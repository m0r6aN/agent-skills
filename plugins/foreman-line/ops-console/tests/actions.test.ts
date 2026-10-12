import assert from 'node:assert/strict'
import test from 'node:test'
import {
  type ActionRefusalError,
  type ActionRunner,
  dispatchAction,
  lookupAction,
  validateActionSpec,
} from '../src/actions.js'
import { listAuditEntries } from '../src/invoke.js'
import { type Scenario, withTempRepo } from './support/materialize.js'

/**
 * FCA-P4 action registry (Task 9): the closed (class × verb) matrix with its
 * invocation classes and autonomy envelopes, typed refusals for unregistered
 * pairs, the type+runtime guard that keeps mutating verbs off `execute`, and
 * append-only audit entries covering every dispatch outcome
 * (executed/presented/spawned/refused).
 */
const NOW = '2026-10-11T12:00:00.000Z'
const NOW_MS = Date.parse(NOW)

function actionsScenario(): Scenario {
  return {
    name: 'actions-registry',
    now: NOW,
    goal: {
      slug: 'goal-act',
      queue: ['1. **P1** dispatched; quiet.'],
      charterStatus: 'RATIFIED — Gate 1 granted 2026-09-16 (owner).',
    },
    specs: [],
    chains: [],
    worktrees: [],
    expected: [],
  }
}

function refusalOf(fn: () => unknown): ActionRefusalError {
  try {
    fn()
  } catch (error) {
    return error as ActionRefusalError
  }
  throw new Error('expected a typed action refusal')
}

test('lookupAction resolves the closed matrix; unregistered pairs are absent', () => {
  assert.equal(lookupAction('parcel-state', 'close-delete')?.destructive, true)
  assert.equal(lookupAction('scm-ci', 'investigate')?.invocation, 'spawn')
  assert.equal(lookupAction('release-hygiene', 'remediate')?.destructive, false)
  assert.equal(lookupAction('release-hygiene', 'close-delete'), null)
  assert.equal(lookupAction('goal-hygiene', 'close-delete')?.destructive, true)
})

test('execute can never be registered for a mutating verb (type + runtime guard)', () => {
  const base = {
    signalClasses: ['parcel-state'],
    promptTemplate: 'remediate',
    autonomy: { decisions: 'partial', commit: false, push: false, openPr: false, merge: false },
    destructive: false,
  }
  assert.doesNotThrow(() => validateActionSpec({ ...base, verb: 'remediate', invocation: 'spawn' }))
  assert.doesNotThrow(() => validateActionSpec({ ...base, verb: 'explain', invocation: 'execute' }))
  const reason = refusalOf(() =>
    validateActionSpec({ ...base, verb: 'remediate', invocation: 'execute' }),
  ).reason
  assert.equal(reason, 'execute-on-mutating-verb')
  assert.equal(
    refusalOf(() =>
      validateActionSpec({
        ...base,
        verb: 'close-delete',
        invocation: 'execute',
        destructive: true,
      }),
    ).reason,
    'execute-on-mutating-verb',
  )
})

test('unregistered dispatch is refused typed and audited', () => {
  withTempRepo(actionsScenario(), ({ config }) => {
    const outcome = dispatchAction(
      config,
      { verb: 'close-delete', signalClass: 'release-hygiene', subject: 'plugins/x/README.md' },
      NOW_MS,
    )
    assert.equal(outcome.action, 'refused')
    assert.equal(outcome.reason !== null && /closed set/.test(outcome.reason), true)
    const audit = listAuditEntries(config.stateDir)
    assert.equal(audit.length, 1)
    assert.equal(audit[0]?.action, 'refused')
    assert.deepEqual(audit[0]?.argv, ['close-delete', 'release-hygiene', 'plugins/x/README.md'])
    assert.equal(audit[0]?.reason !== null, true)
  })
})

test('audit entries cover all four outcomes with reason and argv', () => {
  withTempRepo(actionsScenario(), ({ config }) => {
    const runner: ActionRunner = (_spec, request) => {
      if (request.subject === 'exec-case') return { action: 'executed', command: 'run x' }
      if (request.subject === 'spawn-case')
        return { action: 'spawned', command: 'tmux new', spawnId: 's-1' }
      return { action: 'presented', command: 'copy-paste me' }
    }
    dispatchAction(
      config,
      { verb: 'explain', signalClass: 'parcel-state', subject: 'exec-case' },
      NOW_MS,
      runner,
    )
    dispatchAction(
      config,
      { verb: 'investigate', signalClass: 'worktree-hygiene', subject: 'present-case' },
      NOW_MS,
      runner,
    )
    dispatchAction(
      config,
      { verb: 'remediate', signalClass: 'scm-ci', subject: 'spawn-case' },
      NOW_MS,
      runner,
    )
    dispatchAction(
      config,
      { verb: 'close-delete', signalClass: 'release-hygiene', subject: 'nope' },
      NOW_MS,
      runner,
    )

    const audit = listAuditEntries(config.stateDir)
    assert.deepEqual(audit.map((entry) => entry.action).sort(), [
      'executed',
      'presented',
      'refused',
      'spawned',
    ])
    for (const entry of audit) {
      assert.equal(entry.argv.length, 3, 'every entry carries verb/class/subject argv')
      assert.equal(entry.reason !== null || entry.action !== 'refused', true)
    }
    const spawned = audit.find((entry) => entry.action === 'spawned')
    assert.equal(spawned?.spawnId, 's-1', 'spawn outcomes carry their spawn id')
    assert.equal(spawned?.mode, 'spawn')
  })
})

test('autonomy envelopes: registry defaults, request overrides, audit-carried', () => {
  withTempRepo(actionsScenario(), ({ config }) => {
    const runner: ActionRunner = () => ({ action: 'presented', command: 'x' })
    const defaulted = dispatchAction(
      config,
      { verb: 'remediate', signalClass: 'parcel-state', subject: 'g/P1' },
      NOW_MS,
      runner,
    )
    assert.deepEqual(defaulted.autonomy, {
      decisions: 'partial',
      commit: true,
      push: false,
      openPr: false,
      merge: false,
    })

    const overridden = dispatchAction(
      config,
      {
        verb: 'investigate',
        signalClass: 'parcel-state',
        subject: 'g/P2',
        autonomy: { decisions: 'full', commit: true },
      },
      NOW_MS,
      runner,
    )
    assert.deepEqual(overridden.autonomy, {
      decisions: 'full',
      commit: true,
      push: false,
      openPr: false,
      merge: false,
    })
    const audit = listAuditEntries(config.stateDir)
    assert.deepEqual(audit[1]?.autonomy, overridden.autonomy, 'audit carries the envelope')
  })
})
