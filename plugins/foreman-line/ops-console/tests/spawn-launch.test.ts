import assert from 'node:assert/strict'
import { existsSync, mkdirSync, statSync, utimesSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import test from 'node:test'
import { dispatchAction } from '../src/actions.js'
import { listAuditEntries } from '../src/invoke.js'
import { ensureLedgerDir } from '../src/ledger-store.js'
import {
  launchSpawnPlan,
  listSpawnReceipts,
  planSpawn,
  recordSpawnReceipt,
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
    controls: { harness: 'pi', model: 'test/m', thinking: 'high', budget: '$20' },
    actions: ACTIONS,
    now: NOW,
    sessionName: 'foc-test',
  })
}

function worktreeStub(): {
  calls: string[][]
  create: (repoRoot: string, worktreePath: string) => void
  head: (worktreePath: string) => string | null
} {
  const calls: string[][] = []
  return {
    calls,
    create: (repoRoot: string, worktreePath: string) => {
      calls.push([repoRoot, worktreePath])
    },
    head: () => 'basecommit0000000000000000000000000000abcd',
  }
}

function stubRunner(
  onRun?: (args: readonly string[]) => void,
  isAvailable: () => boolean = () => true,
): TmuxRunner & { calls: string[][] } {
  const calls: string[][] = []
  let nextPane = 0
  return {
    calls,
    available: isAvailable,
    run: (args: readonly string[]) => {
      calls.push([...args])
      if (onRun !== undefined) onRun(args)
    },
    capture: (args: readonly string[]) => {
      calls.push([...args])
      if (onRun !== undefined) onRun(args)
      // The liveness probe before retention is not a pane creation.
      if (args[0] === 'list-panes') return ''
      return `%${nextPane++}\n`
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
    const logFor = (index: number) =>
      `cat >> ${shellQuote(join(config.stateDir, 'sessions', `foc-test-p${index}`, 'pane.log'))}`
    assert.deepEqual(
      runner.calls[0]?.slice(0, 3),
      ['list-panes', '-a', '-F'],
      'liveness is probed before retention',
    )
    assert.deepEqual(runner.calls.slice(1), [
      [
        'new-session',
        '-d',
        '-P',
        '-F',
        '#{pane_id}',
        '-s',
        'foc-test',
        '-c',
        pane0.cwd,
        cmdFor(pane0),
        ';',
        'set-option',
        '-w',
        '-t',
        '=foc-test:',
        'remain-on-exit',
        'on',
        ';',
        'pipe-pane',
        '-o',
        '-t',
        '=foc-test:',
        logFor(0),
      ],
      [
        'split-window',
        '-d',
        '-P',
        '-F',
        '#{pane_id}',
        '-t',
        '=foc-test:',
        '-c',
        pane1.cwd,
        cmdFor(pane1),
      ],
      ['pipe-pane', '-o', '-t', '%1', logFor(1)],
    ])
  })
})

test('FCA-P7: receipts carry the ledger addendum and a ledger dir exists per pane', () => {
  const spawnPlan = plan()
  withTempRepo(launchScenario(), ({ config }) => {
    launchSpawnPlan(config, spawnPlan, NOW, { tmux: stubRunner(), worktrees: worktreeStub() })
    const receipts = listSpawnReceipts(config.stateDir)
    assert.equal(receipts.length, 2)
    receipts.forEach((receipt, index) => {
      assert.equal(receipt.baseCommit, 'basecommit0000000000000000000000000000abcd')
      assert.equal(receipt.branch, `spawn/${basename(receipt.worktreePath)}`)
      assert.equal(receipt.ledgerDir, `sessions/foc-test-p${index}`)
      assert.equal(receipt.tmuxPaneId, `%${index}`)
      assert.ok(existsSync(join(config.stateDir, 'sessions', `foc-test-p${index}`, 'pane.log')))
    })
    // The prompt payload is never stored anywhere in the ledger tree.
    for (const receipt of receipts) {
      assert.ok(!JSON.stringify(receipt).includes('ACTION: '), 'receipt has digest only')
    }
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
    assert.equal(
      runner.calls.filter((args) => args[0] !== 'list-panes').length,
      2,
      'exactly one attempt per pane - zero retries',
    )

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

test('review #12: the ledger directory is created BEFORE the worktree, so a failure leaves no stray worktree', () => {
  const spawnPlan = plan()
  const worktrees = worktreeStub()
  withTempRepo(launchScenario(), ({ config }) => {
    // Block the ledger subtree: `state/sessions` is a file, so mkdir inside it fails.
    mkdirSync(config.stateDir, { recursive: true })
    writeFileSync(join(config.stateDir, 'sessions'), 'not a directory')
    let caught: SpawnRefusalError | null = null
    try {
      launchSpawnPlan(config, spawnPlan, NOW, { tmux: stubRunner(), worktrees })
    } catch (err) {
      caught = err as SpawnRefusalError
    }
    assert.equal(caught?.reason, 'launch-failure')
    assert.equal(
      worktrees.calls.length,
      0,
      'no worktree was cut for a launch that could not be recorded',
    )
  })
})

// ---- reviewer re-review rework (FCA-P7, 2026-10-13) -------------------------------------------

function seedOldReceipt(
  config: { stateDir: string },
  id: string,
  paneId: string,
  sessionName: string,
  bytes: number,
): string {
  recordSpawnReceipt(config.stateDir, {
    id,
    sessionName,
    paneIndex: 0,
    harness: 'pi',
    model: 'a/b',
    thinking: 'low',
    budget: '$1',
    autonomy: { decisions: 'partial', commit: false, push: false, openPr: false, merge: false },
    repoRoot: '/repos/r',
    worktreePath: '/repos/r-worktrees/old',
    promptDigest: 'd',
    argv: ['pi'],
    createdAt: '2026-01-01T00:00:00.000Z',
    tmuxPaneId: paneId,
    ledgerDir: `sessions/${id}`,
  })
  const { logPath } = ensureLedgerDir(config.stateDir, id)
  writeFileSync(logPath, 'x'.repeat(bytes))
  const old = new Date('2026-01-01T00:00:00Z')
  utimesSync(logPath, old, old)
  return logPath
}

function launchWithTmux(
  config: Parameters<typeof launchSpawnPlan>[0],
  listPanes: () => string,
): void {
  const runner: TmuxRunner = {
    available: () => true,
    run: () => undefined,
    capture: (args) => (args[0] === 'list-panes' ? listPanes() : '%5\n'),
  }
  launchSpawnPlan(config, plan(), NOW, { tmux: runner, worktrees: worktreeStub() })
}

test('re-review: retention at launch spares live panes however old, and touches nothing when liveness is unknown', () => {
  const over = 6 * 1024 * 1024
  const size = (path: string) => statSync(path).size
  // alive: untouched
  withTempRepo(launchScenario(), ({ config }) => {
    const log = seedOldReceipt(config, 'foc-old-p0', '%9', 'foc-old', over)
    launchWithTmux(config, () => 'foc-old\t%9\t0\n')
    assert.equal(size(log), over, 'a live pane keeps its whole log')
  })
  // dead: truncated to the cap
  withTempRepo(launchScenario(), ({ config }) => {
    const log = seedOldReceipt(config, 'foc-old-p0', '%9', 'foc-old', over)
    launchWithTmux(config, () => 'foc-old\t%9\t1\n')
    assert.equal(size(log), 5 * 1024 * 1024, 'a dead pane is truncated to the byte cap')
  })
  // tmux cannot answer (not "no server"): protect everything
  withTempRepo(launchScenario(), ({ config }) => {
    const log = seedOldReceipt(config, 'foc-old-p0', '%9', 'foc-old', over)
    launchWithTmux(config, () => {
      throw Object.assign(new Error('boom'), {
        stderr: 'error connecting to /tmp/tmux-0/default (Permission denied)',
      })
    })
    assert.equal(size(log), over, 'liveness unknown: nothing is touched')
  })
  // no server at all: nothing is alive, so the over-cap log is truncated
  withTempRepo(launchScenario(), ({ config }) => {
    const log = seedOldReceipt(config, 'foc-old-p0', '%9', 'foc-old', over)
    launchWithTmux(config, () => {
      throw Object.assign(new Error('x'), { stderr: 'no server running on /tmp/tmux-1000/default' })
    })
    assert.equal(size(log), 5 * 1024 * 1024)
  })
})

test('re-review: a launch that fails before its pane exists leaves no empty ledger dir; one that fails after keeps the started pane', () => {
  withTempRepo(launchScenario(), ({ config }) => {
    const failing = {
      calls: [] as string[][],
      create: () => {
        throw new Error('git worktree add failed')
      },
      head: () => null,
    }
    let caught: SpawnRefusalError | null = null
    try {
      launchSpawnPlan(config, plan(), NOW, { tmux: stubRunner(), worktrees: failing })
    } catch (err) {
      caught = err as SpawnRefusalError
    }
    assert.equal(caught?.reason, 'launch-failure')
    assert.equal(
      existsSync(join(config.stateDir, 'sessions', 'foc-test-p0')),
      false,
      'nothing started: no leftover dir',
    )
  })
  withTempRepo(launchScenario(), ({ config }) => {
    const runner = stubRunner((args) => {
      if (args[0] === 'split-window') throw new Error('tmux server gone')
    })
    try {
      launchSpawnPlan(config, plan(), NOW, { tmux: runner, worktrees: worktreeStub() })
    } catch {
      // expected
    }
    assert.equal(
      existsSync(join(config.stateDir, 'sessions', 'foc-test-p0')),
      true,
      'pane 0 started: its ledger dir stays',
    )
    assert.equal(
      existsSync(join(config.stateDir, 'sessions', 'foc-test-p1')),
      false,
      'pane 1 never started: its dir is discarded',
    )
  })
})
