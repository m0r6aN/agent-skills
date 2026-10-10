import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { handleApi } from '../src/api.js'
import { ConsoleRootUnresolvedError, defaultConfig, resolveGoalKey } from '../src/config.js'
import { goalStatus } from '../src/status.js'
import type { GoalProjection, ParcelProjection } from '../src/types.js'
import { type Scenario, withTempRepo } from './support/materialize.js'

/**
 * FCA-1 multi-root goal discovery + FCA-2 goal status index. Additive only:
 * the frozen route table, the frozen GoalRecord/ParcelProjection shapes, and
 * the R1–R5 derivation precedence are untouched — `goals` keeps its shape and
 * `statuses` joins it as a sibling field.
 */
const NOW = '2026-09-26T12:00:00.000Z'
const NOW_MS = Date.parse(NOW)

function parcel(partial: Partial<ParcelProjection>): ParcelProjection {
  return {
    goal: 'g',
    parcel: 'P1',
    specRef: null,
    specLocation: 'none',
    chain: null,
    chainEvidence: 'absent',
    gates: {
      G1: { gate: 'G1', status: 'unknown', evidence: null, detail: '' },
      G2: { gate: 'G2', status: 'unknown', evidence: null, detail: '' },
      G3: { gate: 'G3', status: 'unknown', evidence: null, detail: '' },
    },
    routing: { routingClass: null, resolvedModelId: null, resolvedTier: null },
    liveness: { live: false, worktree: null, branch: null, newestMtime: null, reason: '' },
    heartbeat: { thresholdMs: 21_600_000, source: 'default', lastProgressAt: null },
    failure: null,
    state: 'complete',
    rule: 'R2',
    flags: [],
    ...partial,
  }
}

function projection(
  parcels: readonly ParcelProjection[],
  ratification: 'granted' | 'pending' | 'unknown' = 'granted',
  items = 1,
): GoalProjection {
  return {
    goal: {
      slug: 'g',
      charterRef: 'c',
      loopDirectiveRef: 'l',
      items: Array.from({ length: items }, (_, i) => ({
        key: `P${i + 1}`,
        text: `${i + 1}. **P${i + 1}**`,
      })),
      hungThreshold: { thresholdMs: 21_600_000, source: 'default', hours: null },
      stateLines: [],
      ratification: { status: ratification, detail: '' },
    },
    parcels,
    unmappedChains: [],
  }
}

test('goalStatus: a fully shipped goal is inactive (queue empty / GOAL COMPLETE end state)', () => {
  const status = goalStatus('g', null, projection([parcel({ parcel: 'P1', state: 'complete' })]))
  assert.equal(status.active, false)
  assert.equal(status.attention.total, 0)
})

test('goalStatus: hung, failed, and awaiting-gate parcels keep the goal active and count as attention', () => {
  const status = goalStatus(
    'g',
    'agent-task',
    projection([
      parcel({ parcel: 'P1', state: 'hung' }),
      parcel({ parcel: 'P2', state: 'failed' }),
      parcel({ parcel: 'P3', state: 'awaiting-gate' }),
      parcel({ parcel: 'P4', state: 'complete' }),
    ]),
  )
  assert.equal(status.active, true)
  assert.equal(status.tree, 'agent-task')
  assert.deepEqual(status.attention, {
    hung: 1,
    failed: 1,
    awaitingGate: 1,
    ratificationPending: 0,
    ratificationUnknown: 0,
    total: 3,
  })
})

test('goalStatus: a pending Gate-1 ratification keeps an empty-queue goal active', () => {
  const status = goalStatus('g', null, projection([], 'pending', 0))
  assert.equal(status.active, true)
  assert.equal(status.attention.ratificationPending, 1)
})

test('goalStatus: an empty queue on a granted charter is inactive', () => {
  const status = goalStatus('g', null, projection([], 'granted', 0))
  assert.equal(status.active, false)
})

test('goalStatus: narrative state lines keep a parcel-less goal active (non-foreman-line dialects)', () => {
  const base = projection([], 'granted', 0)
  const live: GoalProjection = {
    goal: { ...base.goal, stateLines: ['**State: reviews harvested — reworks dispatched.**'] },
    parcels: [],
    unmappedChains: [],
  }
  assert.equal(goalStatus('g', 'agent-task', live).active, true)

  const closed: GoalProjection = {
    goal: {
      ...base.goal,
      stateLines: ['**State: EXIT CRITERION MET — GOAL COMPLETE; queue empty.**'],
    },
    parcels: [],
    unmappedChains: [],
  }
  assert.equal(goalStatus('g', 'agent-task', closed).active, false)
})

function extraRootFixture(): string {
  const base = mkdtempSync(join(tmpdir(), 'fca-extra-root-'))
  // Nested under a stable directory name: the tree alias is the root's
  // basename, so the fixture repo must be named `agent-task` to assert keys.
  const root = join(base, 'agent-task')
  for (const [treeDir, slug] of [
    ['docs/goals', 'AT-1'],
    ['docs/INITIATIVES', 'AT-2'],
  ] as const) {
    const goalDir = join(root, treeDir, slug.toLowerCase())
    mkdirSync(goalDir, { recursive: true })
    writeFileSync(
      join(goalDir, 'loop-directive.md'),
      `# ${slug} — Coordinator Loop Directive\n\n> **State: building.**\n\n## Queue (strict order, D5)\n\n1. **P1** dispatched; silent for days.\n`,
      'utf8',
    )
  }
  mkdirSync(join(root, 'docs', 'receipts'), { recursive: true })
  return base
}

function primaryScenario(): Scenario {
  return {
    name: 'fca-multi-root',
    now: NOW,
    goal: {
      slug: 'goal-primary',
      queue: ['1. **P1** dispatched; silent for days.'],
      charterStatus: 'RATIFIED — Gate 1 granted 2026-09-16 (owner).',
    },
    specs: [],
    expected: [{ parcel: 'P1', state: 'hung', rule: 'R4' }],
  }
}

test('multi-root: extra roots project goal trees under alias-qualified keys', () => {
  const extraBase = extraRootFixture()
  const extraRoot = join(extraBase, 'agent-task')
  try {
    withTempRepo(primaryScenario(), (ctx) => {
      const config = defaultConfig(ctx.config.repoRoot, join(ctx.root, 'state'), [extraRoot])
      const trees = config.trees ?? []
      assert.equal(trees.length, 3, 'primary + docs/goals + docs/INITIATIVES trees')
      assert.equal(trees[0]?.key, null)
      assert.equal(trees[1]?.key, 'agent-task', 'alias is the root directory name')
      assert.equal(
        trees[2]?.key,
        'agent-task.1',
        'second tree in the same repo gets the deterministic hit-index alias',
      )

      // Longest-prefix resolution: the second tree's keys are never swallowed
      // by the shorter alias of the first.
      const resolved = resolveGoalKey(config, `${trees[2]?.key}.at-2`)
      assert.equal(resolved?.slug, 'at-2')
      assert.equal(resolved?.tree.key, trees[2]?.key)

      // Bare keys still resolve against the primary tree (pre-extension URLs).
      const bare = resolveGoalKey(config, 'goal-primary')
      assert.equal(bare?.tree.key, null)
      assert.equal(bare?.slug, 'goal-primary')
    })
  } finally {
    rmSync(extraBase, { recursive: true, force: true })
  }
})

test('multi-root: /api/goals carries the additive statuses index and /api/parcels resolves qualified keys', () => {
  const extraBase = extraRootFixture()
  const extraRoot = join(extraBase, 'agent-task')
  try {
    withTempRepo(primaryScenario(), (ctx) => {
      const config = defaultConfig(ctx.config.repoRoot, join(ctx.root, 'state'), [extraRoot])
      const list = handleApi(
        config,
        { method: 'GET', pathname: '/api/goals', query: new URLSearchParams(), body: {} },
        NOW_MS,
      )
      assert.equal(list.status, 200)
      const payload = list.json as {
        goals: { slug: string }[]
        statuses: { key: string; active: boolean }[]
      }
      const keys = payload.statuses.map((status) => status.key)
      assert.ok(keys.includes('goal-primary'), 'primary goal keeps its bare key')
      assert.ok(keys.includes('agent-task.at-1'), 'docs/goals tree qualified with the root alias')
      assert.ok(keys.includes('agent-task.1.at-2'), 'second tree gets the deterministic .1 alias')
      assert.ok(
        payload.statuses.every((status) => status.active),
        'queued parcels keep these goals active',
      )

      // Exact per-tree paths: native docs/goals tree and initiative
      // docs/INITIATIVES tree derive from the extra root, with the routing
      // policy anchored under the plugin tree ref (PLUGIN_TREE_REF).
      const trees = config.trees ?? []
      const native = trees.find((tree) => tree.key === 'agent-task')
      assert.equal(native?.goalsDir, join(extraRoot, 'docs', 'goals'))
      assert.equal(native?.specsDir, join(extraRoot, 'docs', 'specs'))
      assert.equal(native?.receiptsDir, join(extraRoot, 'docs', 'receipts'))
      assert.equal(
        native?.routingPolicyPath,
        join(extraRoot, 'plugins', 'foreman-line', 'routing-policy', 'routing-policy.yaml'),
      )
      const initiative = trees.find((tree) => tree.key === 'agent-task.1')
      assert.equal(initiative?.goalsDir, join(extraRoot, 'docs', 'INITIATIVES'))
      assert.equal(initiative?.specsDir, join(extraRoot, 'docs', 'specs'))
      assert.equal(initiative?.receiptsDir, join(extraRoot, 'docs', 'receipts'))
      assert.equal(
        initiative?.routingPolicyPath,
        join(extraRoot, 'plugins', 'foreman-line', 'routing-policy', 'routing-policy.yaml'),
      )

      // Qualified-key projection: the parcel carries the qualified goal key so
      // alert identities stay unique across trees.
      const projected = handleApi(
        config,
        {
          method: 'GET',
          pathname: '/api/parcels',
          query: new URLSearchParams('goal=agent-task.at-1'),
          body: {},
        },
        NOW_MS,
      )
      assert.equal(projected.status, 200)
      const body = projected.json as GoalProjection
      assert.equal(body.parcels[0]?.goal, 'agent-task.at-1')
      assert.equal(body.parcels.length, 1)

      // Unknown keys still 404 through the frozen route surface.
      const missing = handleApi(
        config,
        {
          method: 'GET',
          pathname: '/api/parcels',
          query: new URLSearchParams('goal=agent-task.at-9'),
          body: {},
        },
        NOW_MS,
      )
      assert.equal(missing.status, 404)
    })
  } finally {
    rmSync(extraBase, { recursive: true, force: true })
  }
})

test('multi-root: relative extra roots are refused typed, exactly like the primary root', () => {
  withTempRepo(primaryScenario(), (ctx) => {
    assert.throws(
      () => defaultConfig(ctx.config.repoRoot, join(ctx.root, 'state'), ['relative/path']),
      (err: unknown) =>
        err instanceof ConsoleRootUnresolvedError && err.reason === 'root-not-absolute',
    )
  })
})

for (const state of ['empty', 'all complete', 'closed narrative']) {
  test(`goalStatus: unknown ratification retains ${state} goal attention and activity`, () => {
    const candidate = projection(state === 'all complete' ? [parcel({})] : [], 'unknown', 0)
    const closed = {
      ...candidate,
      goal: {
        ...candidate.goal,
        stateLines: state === 'closed narrative' ? ['**State: GOAL CLOSED; queue empty.**'] : [],
      },
    }
    const status = goalStatus('g', null, closed)
    assert.equal(status.active, true)
    assert.deepEqual(status.attention, {
      hung: 0,
      failed: 0,
      awaitingGate: 0,
      ratificationPending: 0,
      ratificationUnknown: 1,
      total: 1,
    })
  })
}

test('goalStatus: unknown count adds to existing parcel attention', () => {
  const status = goalStatus(
    'g',
    null,
    projection(
      [parcel({ state: 'hung' }), parcel({ state: 'failed' }), parcel({ state: 'awaiting-gate' })],
      'unknown',
    ),
  )
  assert.deepEqual(status.attention, {
    hung: 1,
    failed: 1,
    awaitingGate: 1,
    ratificationPending: 0,
    ratificationUnknown: 1,
    total: 4,
  })
})
