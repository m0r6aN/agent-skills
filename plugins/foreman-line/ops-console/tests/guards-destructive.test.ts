import assert from 'node:assert/strict'
import test from 'node:test'
import { destructiveConfirmationToken, dispatchAction } from '../src/actions.js'
import { handleApi } from '../src/api.js'
import type { ConsoleConfig } from '../src/config.js'
import { listAuditEntries } from '../src/invoke.js'
import { type Scenario, withTempRepo, withTempRepoAsync } from './support/materialize.js'

/**
 * FCA-P4 destructive guard (Task 11): `close-delete` requires an explicit
 * typed intent bound to the specific subject — never silent, never replayable
 * across subjects. The same contract guards the API surface (and is mirrored
 * by the UI later). Non-destructive verbs are unaffected.
 */
const NOW = '2026-10-11T12:00:00.000Z'
const NOW_MS = Date.parse(NOW)

function guardScenario(): Scenario {
  return {
    name: 'destructive-guard',
    now: NOW,
    goal: {
      slug: 'goal-guard',
      queue: ['1. **P1** dispatched; quiet.'],
      charterStatus: 'RATIFIED — Gate 1 granted 2026-09-16 (owner).',
    },
    specs: [],
    chains: [],
    worktrees: [],
    expected: [],
  }
}

async function call(config: ConsoleConfig, body: unknown) {
  return handleApi(
    config,
    { method: 'POST', pathname: '/api/actions/dispatch', query: new URLSearchParams(), body },
    NOW_MS,
  )
}

test('destructive dispatch without typed confirmation is refused and audited', () => {
  withTempRepo(guardScenario(), ({ config }) => {
    const outcome = dispatchAction(
      config,
      { verb: 'close-delete', signalClass: 'scm-ci', subject: 'pr/166' },
      NOW_MS,
    )
    assert.equal(outcome.action, 'refused')
    assert.equal(outcome.reason?.includes('confirmation-required'), true)
    const audit = listAuditEntries(config.stateDir)
    assert.equal(audit[0]?.action, 'refused')
    assert.equal(audit[0]?.reason?.includes('confirmation-required'), true)
  })
})

test('the confirmation binds to the subject — replay for another subject is refused', () => {
  withTempRepo(guardScenario(), ({ config }) => {
    const token = destructiveConfirmationToken('pr/166')
    assert.notEqual(token, destructiveConfirmationToken('pr/170'), 'tokens bind to subjects')

    const replay = dispatchAction(
      config,
      { verb: 'close-delete', signalClass: 'scm-ci', subject: 'pr/170', confirmation: token },
      NOW_MS,
    )
    assert.equal(replay.action, 'refused')
    assert.equal(replay.reason?.includes('confirmation-mismatch'), true)

    const honest = dispatchAction(
      config,
      { verb: 'close-delete', signalClass: 'scm-ci', subject: 'pr/166', confirmation: token },
      NOW_MS,
    )
    assert.equal(honest.action, 'presented', 'correct typed intent passes the guard')
    assert.equal(honest.reason, null)
  })
})

test('non-destructive verbs are unaffected by the confirmation contract', () => {
  withTempRepo(guardScenario(), ({ config }) => {
    for (const verb of ['investigate', 'remediate', 'explain'] as const) {
      const outcome = dispatchAction(
        config,
        { verb, signalClass: 'parcel-state', subject: 'g/P1' },
        NOW_MS,
      )
      assert.equal(outcome.action, 'presented', `${verb} needs no confirmation`)
    }
  })
})

test('the API surface enforces the same contract', async () => {
  await withTempRepoAsync(guardScenario(), async ({ config }) => {
    const denied = await call(config, {
      verb: 'close-delete',
      signalClass: 'worktree-hygiene',
      subject: 'branches',
    })
    assert.equal(denied.status, 200)
    assert.equal((denied.json as { action: string }).action, 'refused')

    const allowed = await call(config, {
      verb: 'close-delete',
      signalClass: 'worktree-hygiene',
      subject: 'branches',
      confirmation: destructiveConfirmationToken('branches'),
    })
    assert.equal((allowed.json as { action: string }).action, 'presented')
  })
})
