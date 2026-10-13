import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import test from 'node:test'
import { handleApi } from '../src/api.js'
import type { ConsoleConfig } from '../src/config.js'
import { type SessionProbe, sessionProbeFor, sessionStateProvider } from '../src/signals-session.js'
import { launchSpawnPlan, listSpawnReceipts, planSpawn, type TmuxRunner } from '../src/spawn.js'
import { type Scenario, withTempRepo } from './support/materialize.js'

/**
 * FCA-P5 spawn receipts (Task 14): append-only receipt records (session/pane
 * ids, harness, model, thinking, budget, autonomy, repo root, worktree path,
 * prompt DIGEST only - the full prompt is reproducible from templates + audit)
 * exposed via GET /api/spawns with pane liveness. Dead/exited panes surface as
 * `session-state` signals (the class decided 2026-10-11).
 */
const NOW = Date.parse('2026-10-11T12:00:00.000Z')

function receiptsScenario(): Scenario {
  return {
    name: 'spawn-receipts',
    now: '2026-10-11T12:00:00.000Z',
    goal: {
      slug: 'goal-rec',
      queue: ['1. **P1** dispatched; quiet.'],
      charterStatus: 'RATIFIED — Gate 1 granted 2026-09-16 (owner).',
    },
    specs: [],
    chains: [],
    worktrees: [],
    expected: [],
  }
}

function worktreeStub(): {
  calls: string[][]
  create: (repoRoot: string, worktreePath: string) => void
} {
  const calls: string[][] = []
  return {
    calls,
    create: (repoRoot: string, worktreePath: string) => {
      calls.push([repoRoot, worktreePath])
    },
  }
}

function stubRunner(): TmuxRunner {
  return { available: () => true, run: () => {}, capture: () => '%0\n' }
}

function sessionProbe(alive: (name: string) => boolean): SessionProbe {
  return { sessionAlive: alive }
}

function launchOne(config: ConsoleConfig, subject = 'pr/170/red') {
  const plan = planSpawn({
    controls: {
      harness: 'pi',
      model: 'anthropic/claude-sonnet-5-5',
      thinking: 'high',
      budget: '$20',
    },
    actions: [
      {
        verb: 'remediate',
        signalClass: 'scm-ci',
        subject,
        evidence: ['gh: PR #170 mergeable CONFLICTING'],
        repoRoot: '/repos/agent-skills',
      },
    ],
    now: NOW,
    sessionName: 'foc-rec',
  })
  launchSpawnPlan(config, plan, NOW, { tmux: stubRunner(), worktrees: worktreeStub() })
  return plan
}

test('receipts round-trip through GET /api/spawns with liveness states', () => {
  withTempRepo(receiptsScenario(), ({ config }) => {
    const plan = launchOne(config)
    const result = handleApi(
      config,
      { method: 'GET', pathname: '/api/spawns', query: new URLSearchParams(), body: {} },
      NOW,
    )
    assert.equal(result.status, 200)
    const spawns = (
      result.json as {
        spawns: { sessionName: string; liveness: string; promptDigest: string }[]
      }
    ).spawns
    assert.equal(spawns.length, 1)
    assert.equal(spawns[0]?.sessionName, 'foc-rec')
    // Liveness is derived truth (real tmux), never the stub's claim.
    assert.equal(
      spawns[0]?.liveness,
      sessionProbeFor(config.repoRoot).sessionAlive('foc-rec') ? 'alive' : 'exited',
    )
    const pane = plan.panes[0]
    assert.ok(pane !== undefined)
    assert.equal(spawns[0]?.promptDigest, pane.promptDigest)

    const stored = listSpawnReceipts(config.stateDir)
    assert.equal(stored[0]?.worktreePath, pane.worktreePath)
    assert.equal(stored[0]?.harness, 'pi')
  })
})

test('receipts store the prompt digest, never the prompt payload', () => {
  withTempRepo(receiptsScenario(), ({ config }) => {
    const plan = launchOne(config)
    const pane = plan.panes[0]
    assert.ok(pane !== undefined)
    assert.equal(
      pane.promptDigest,
      createHash('sha256').update(pane.prompt).digest('hex'),
      'digest is reproducible: full prompt is rebuildable from templates + audit',
    )
    const raw = JSON.stringify(listSpawnReceipts(config.stateDir))
    assert.equal(raw.includes('AUTONOMY'), false, 'no prompt payload in the store')
    assert.equal(raw.includes(pane.promptDigest), true)
  })
})

test('dead/exited panes surface as session-state signals; alive panes stay quiet', () => {
  withTempRepo(receiptsScenario(), ({ config }) => {
    launchOne(config)
    const alive = sessionStateProvider.collect(
      config,
      NOW,
      sessionProbe(() => true),
    )
    assert.deepEqual(alive, [], 'live sessions need no attention')

    const dead = sessionStateProvider.collect(
      config,
      NOW,
      sessionProbe(() => false),
    )
    assert.equal(dead.length, 1)
    assert.equal(dead[0]?.class, 'session-state')
    assert.equal(dead[0]?.subject, 'foc-rec-p0')
    assert.ok(dead[0]?.evidence.length && dead[0].evidence.length > 0)
    assert.ok(dead[0]?.actions.includes('close-delete'))
  })
})

test('GET /api/spawns method guard matches the route table', () => {
  withTempRepo(receiptsScenario(), ({ config }) => {
    const denied = handleApi(
      config,
      { method: 'POST', pathname: '/api/spawns', query: new URLSearchParams(), body: {} },
      NOW,
    )
    assert.equal(denied.status, 405)
  })
})
