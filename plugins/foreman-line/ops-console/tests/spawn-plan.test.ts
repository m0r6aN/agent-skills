import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import test from 'node:test'
import { planSpawn, type SpawnRefusalError } from '../src/spawn.js'

/**
 * FCA-P5 spawn planner (Task 12): pure (controls x actions) -> spawn plan.
 * One tmux session, one pane per action; per-pane argv built from real,
 * help-verified harness flags (2026-10-11 spike: pi --thinking takes the full
 * seven-level vocabulary; claude --effort takes low..max only and has no
 * off/minimal; neither harness can enforce a spend cap interactively, so the
 * budget is prompt-asserted per FCA-P5 4). Each pane's cwd is a fresh git
 * worktree path (owner ruling: hygiene is a must), recorded for the receipt.
 */
const NOW = Date.parse('2026-10-11T12:00:00.000Z')

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
    extraText: 'Keep existing work first.',
  },
]

function controls(overrides: Record<string, string> = {}) {
  return {
    harness: 'pi',
    model: 'anthropic/claude-sonnet-5-5',
    thinking: 'high',
    budget: '$20',
    ...overrides,
  }
}

function refusalOf(fn: () => unknown): SpawnRefusalError {
  try {
    fn()
  } catch (error) {
    return error as SpawnRefusalError
  }
  throw new Error('expected a typed spawn refusal')
}

test('K selected actions -> exactly one session with K panes (pi argv snapshot)', () => {
  const plan = planSpawn({
    controls: controls(),
    actions: ACTIONS,
    now: NOW,
    sessionName: 'foc-test',
  })
  assert.equal(plan.sessionName, 'foc-test')
  assert.equal(plan.panes.length, 2)
  assert.deepEqual(
    plan.panes.map((pane) => pane.argv),
    [
      [
        'pi',
        '--model',
        'anthropic/claude-sonnet-5-5',
        '--thinking',
        'high',
        '--name',
        'foc-test-p0',
      ],
      [
        'pi',
        '--model',
        'anthropic/claude-sonnet-5-5',
        '--thinking',
        'high',
        '--name',
        'foc-test-p1',
      ],
    ],
    'pi argv snapshot: real help-verified flags',
  )
  assert.deepEqual(
    plan.panes.map((pane) => pane.worktreePath),
    [
      '/repos/agent-skills-worktrees/pr-170-red-20261011t120000z',
      '/repos/agent-skills-worktrees/goal-p1-20261011t120000z',
    ],
    'each pane gets its own fresh worktree path (recorded for the receipt)',
  )
  for (const pane of plan.panes) {
    assert.equal(pane.cwd, pane.worktreePath)
    assert.equal(pane.paneIndex, plan.panes.indexOf(pane))
  }
})

test('claude argv reflects its verified flags and refuses unexpressible thinking', () => {
  const plan = planSpawn({
    controls: controls({ harness: 'claude', thinking: 'xhigh', model: 'opus' }),
    actions: [ACTIONS[0] as (typeof ACTIONS)[number]],
    now: NOW,
    sessionName: 'foc-claude',
  })
  assert.deepEqual(plan.panes[0]?.argv, [
    'claude',
    '--model',
    'opus',
    '--effort',
    'xhigh',
    '-n',
    'foc-claude-p0',
  ])
  for (const level of ['off', 'minimal']) {
    assert.equal(
      refusalOf(() =>
        planSpawn({
          controls: controls({ harness: 'claude', thinking: level }),
          actions: ACTIONS,
          now: NOW,
        }),
      ).reason,
      'unsupported-thinking',
      `claude cannot express thinking: ${level} (no flag; fail closed)`,
    )
  }
})

test('controls reach the prompt payload: envelope verbatim, budget hard-cap, extra text verbatim', () => {
  const plan = planSpawn({ controls: controls(), actions: ACTIONS, now: NOW })
  const remediate = plan.panes[0]
  assert.ok(remediate !== undefined)
  assert.ok(remediate.prompt.startsWith('ACTION: remediate (scm-ci): pr/170/red'))
  assert.ok(remediate.prompt.includes('AUTONOMY (verbatim):'))
  assert.ok(remediate.prompt.includes('budget: $20 (hard max-USD cap'))
  assert.equal(
    remediate.promptDigest,
    createHash('sha256').update(remediate.prompt).digest('hex'),
    'receipt digest is the prompt hash',
  )
  assert.ok((plan.panes[1]?.prompt ?? '').endsWith('EXTRA DIRECTION:\nKeep existing work first.'))
})

test('refusal matrix fires in the plan stage: no process ever starts', () => {
  const cases: [Record<string, string>, string][] = [
    [{ harness: 'copilot' }, 'unknown-harness'],
    [{ model: '' }, 'model-missing'],
    [{ model: 'claude-sonnet-5-5' }, 'model-unqualified'],
    [{ model: '/claude-sonnet-5-5' }, 'model-unqualified'],
    [{ model: 'anthropic/' }, 'model-unqualified'],
    [{ model: 'anthropic/claude sonnet' }, 'model-unqualified'],
    [{ thinking: 'ultra' }, 'unsupported-thinking'],
    [{ budget: 'Unlimited' }, 'unsupported-budget'],
    [{ budget: '$7' }, 'unsupported-budget'],
  ]
  for (const [override, reason] of cases) {
    assert.equal(
      refusalOf(() => planSpawn({ controls: controls(override), actions: ACTIONS, now: NOW }))
        .reason,
      reason,
      JSON.stringify(override),
    )
  }
  assert.equal(
    refusalOf(() => planSpawn({ controls: controls(), actions: [], now: NOW })).reason,
    'no-actions',
  )
})

test('AC11: pi requires provider/model; claude keeps bare ids; refusal precedes any worktree', () => {
  const refusal = refusalOf(() =>
    planSpawn({ controls: controls({ model: 'claude-sonnet-5-5' }), actions: ACTIONS, now: NOW }),
  )
  assert.equal(refusal.reason, 'model-unqualified')
  assert.match(refusal.message, /provider\/model/)
  assert.match(refusal.message, /ambiguous/)
  // Qualified ids and the optional :thinking suffix pi documents are accepted.
  for (const model of [
    'anthropic/claude-sonnet-5-5',
    'opencode-go/gpt-6-luna',
    'openai/gpt-6.1-sol:high',
  ]) {
    assert.doesNotThrow(
      () => planSpawn({ controls: controls({ model }), actions: ACTIONS, now: NOW }),
      model,
    )
  }
  // The claude harness takes aliases/bare ids; the pi rule must not leak into it.
  assert.doesNotThrow(() =>
    planSpawn({
      controls: controls({ harness: 'claude', thinking: 'xhigh', model: 'opus' }),
      actions: ACTIONS,
      now: NOW,
    }),
  )
})
