import assert from 'node:assert/strict'
import test from 'node:test'
import { dispatchAction } from '../src/actions.js'
import type { ConsoleConfig } from '../src/config.js'
import { listAuditEntries } from '../src/invoke.js'
import {
  launchSpawnPlan,
  planSpawn,
  type SpawnRefusalError,
  shellQuote,
  type TmuxRunner,
} from '../src/spawn.js'
import { type Scenario, withTempRepo } from './support/materialize.js'

/**
 * FCA-P5 tmux launcher (Task 13): thin executor of a spawn plan - one
 * `tmux new-session` plus one `split-window` per additional pane, every plan
 * field passed verbatim. tmux absence is a typed refusal (`tmux-unavailable`)
 * with NO headless fallback path; partial failures audit the whole plan state
 * and never retry silently.
 */
const NOW = Date.parse('2026-10-11T12:00:00.000Z')

function launchScenario(): Scenario {
  return {
    name: 'spawn-launch',
    now: '2026-10-11T12:00:00.000Z',
    goal: {
      slug: 'goal-launch',
      queue: ['1. **P1** dispatched; quiet.'],
      charterStatus: 'RATIFIED — Gate 1 granted 2026-09-16 (owner).',
    },
    specs: [],
    chains: [],
    worktrees: [],
    expected: [],
  }
}

const ACTIONS = [
  {
    verb: 'remediate',
    signalClass: 'scm-ci',
    subject: 'pr/170/red',
    evidence: ['gh: PR #170 mergeable CONFLICTING'],
    repoRoot: '/repos/agent-skills',
  },
  {
    verb: 'explain',
    signalClass: 'parcel-state',
    subject: 'goal/P1',
    evidence: ['docs/goals/goal/loop-directive.md'],
    repoRoot: '/repos/agent-skills',
  },
]

function plan() {
  return planSpawn({
    controls: { harness: 'pi', model: 'm', thinking: 'high', budget: '$20' },
    actions: ACTIONS,
    now: NOW,
    sessionName: 'foc-test',
  })
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

function stubRunner(
  onRun?: (args: readonly string[]) => void,
  isAvailable: () => boolean = () => true,
): TmuxRunner & { calls: string[][] } {
  const calls: string[][] = []
  return {
    calls,
    available: isAvailable,
    run: (args: readonly string[]) => {
      calls.push([...args])
      if (onRun !== undefined) onRun(args)
    },
  }
}

test('the launcher passes every plan field to tmux verbatim (stub snapshot)', () => {
  const spawnPlan = plan()
  const runner = stubRunner()
  withTempRepo(launchScenario(), ({ config }) => {
    const result = launchSpawnPlan(config, spawnPlan, NOW, {
      tmux: runner,
      worktrees: worktreeStub(),
    })
    assert.deepEqual(result.launched, [0, 1])
    assert.equal(result.failed, null)

    const [pane0, pane1] = spawnPlan.panes
    assert.ok(pane0 !== undefined && pane1 !== undefined)
    const cmdFor = (pane: { argv: readonly string[]; prompt: string }) =>
      [...pane.argv, '--', pane.prompt].map(shellQuote).join(' ')
    assert.deepEqual(runner.calls, [
      ['new-session', '-d', '-s', 'foc-test', '-c', pane0.cwd, cmdFor(pane0)],
      ['split-window', '-d', '-t', 'foc-test', '-c', pane1.cwd, cmdFor(pane1)],
    ])
  })
})

test('tmux absence is a typed refusal with no fallback execution', () => {
  const runner = stubRunner(undefined, () => false)
  withTempRepo(launchScenario(), ({ config }) => {
    let caught: SpawnRefusalError | null = null
    try {
      launchSpawnPlan(config, plan(), NOW, { tmux: runner, worktrees: worktreeStub() })
    } catch (err) {
      caught = err as SpawnRefusalError
    }
    assert.equal(caught?.reason, 'tmux-unavailable')
    assert.equal(runner.calls.length, 0, 'no tmux invocation, no headless fallback')
  })
})

test('partial failure audits the whole plan state and never retries silently', () => {
  const runner = stubRunner((args) => {
    if (args[0] === 'split-window') throw new Error('tmux server gone')
  })
  withTempRepo(launchScenario(), ({ config }) => {
    let caught: SpawnRefusalError | null = null
    try {
      launchSpawnPlan(config, plan(), NOW, { tmux: runner, worktrees: worktreeStub() })
    } catch (err) {
      caught = err as SpawnRefusalError
    }
    assert.equal(caught?.reason, 'launch-failure')
    assert.equal(runner.calls.length, 2, 'exactly one attempt per pane - zero retries')

    const audit = listAuditEntries(config.stateDir)
    assert.equal(audit.length, 1)
    assert.equal(audit[0]?.action, 'refused')
    assert.ok(audit[0]?.reason?.includes('launch-failure'))
    assert.ok(audit[0]?.reason?.includes('launched pane(s): 0'), 'audit records the partial state')
    assert.equal(audit[0]?.mode, 'spawn')
    assert.equal(audit[0]?.argv[1], 'foc-test')
  })
})

test('dispatch through the default runner still presents (launcher is opt-in)', () => {
  withTempRepo(launchScenario(), ({ config }) => {
    const outcome = dispatchAction(
      config,
      { verb: 'explain', signalClass: 'parcel-state', subject: 'g/P1' },
      NOW,
    )
    assert.equal(outcome.action, 'presented')
    assert.equal(typeof outcome.autonomy, 'object')
  })
})
