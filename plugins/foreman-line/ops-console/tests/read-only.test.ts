import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { handleApi } from '../src/api.js'
import { type ConsoleConfig, type StateFile, stateFilePath } from '../src/config.js'
import { invokeFlow } from '../src/invoke.js'
import { projectGoal } from '../src/project.js'
import { fileMtimes, type Scenario, treeSnapshot, withTempRepo } from './support/materialize.js'

/**
 * D2 read-only negative control: the console NEVER mutates goal, receipt, or
 * spec data. Proven twice: (1) at the API surface — every frozen route is
 * exercised against a materialized repo and the truth-source trees must be
 * byte- and mtime-identical afterwards; (2) structurally — the only modules in
 * `src/` that may touch `fs` write APIs are the two console-local state
 * writers (`notifications.ts`, `invoke.ts`), and their write guard confines
 * them to `state/notifications.json` / `state/invocation-audit.json`.
 */
const NOW = '2026-09-26T12:00:00.000Z'
const NOW_MS = Date.parse(NOW)
const WORKFLOW = '00000000-0000-4000-8000-000000000060'
const TRUTH_DIRS = [
  'docs/receipts',
  'plugins/foreman-line/docs/goals',
  'plugins/foreman-line/docs/specs',
]

function richScenario(): Scenario {
  return {
    name: 'read-only-rich',
    now: NOW,
    goal: {
      slug: 'goal-ro',
      queue: [
        '1. **P1** dispatched; builder quiet for a long while.',
        '2. **P2** ☑ SHIPPED + CLOSED without a chain.',
        '3. **P3** silent since dispatch.',
      ],
      charterStatus: 'RATIFIED — Gate 1 granted 2026-09-16 (owner).',
      stateLines: ['> **State (update on every stop/closure):** materialized scenario.'],
    },
    specs: [
      { name: 'P1-alpha.md', location: 'active', updated: '2026-09-01' },
      { name: 'P2-beta.md', location: 'done', status: 'done', updated: '2026-09-20' },
      { name: 'P3-gamma.md', location: 'active', updated: '2026-09-01' },
    ],
    sidecars: [
      { kind: 'projected', spec: 'P1-alpha.md' },
      { kind: 'approval', spec: 'P1-alpha.md', decision: 'approved' },
    ],
    chains: [
      {
        workflowId: WORKFLOW,
        parcel: 'P1',
        stages: ['A', 'B', 'C', 'D', 'E'],
        timestampOffsetHours: [-8760, -8759, -8758, -8757, -8756],
        verdict: 'pass',
        sidecars: ['routing-decision.json'],
      },
      {
        workflowId: '00000000-0000-4000-8000-000000000061',
        parcel: 'P3',
        stages: ['A', 'B', 'C'],
        timestampOffsetHours: [-8760, -8759, -8758],
      },
    ],
    worktrees: [{ name: 'ro-p1', branch: 'feat/p1', fresh: false }],
    expected: [],
  }
}

function exerciseEveryRoute(config: ConsoleConfig): void {
  const routes: { method: string; path: string; body?: unknown }[] = [
    { method: 'GET', path: '/api/health' },
    { method: 'GET', path: '/api/goals' },
    { method: 'GET', path: '/api/goals/goal-ro' },
    { method: 'GET', path: '/api/parcels?goal=goal-ro' },
    { method: 'GET', path: '/api/parcels/P1/chain?goal=goal-ro' },
    { method: 'GET', path: '/api/parcels/P1/logs?goal=goal-ro' },
    { method: 'GET', path: '/api/gates?goal=goal-ro' },
    { method: 'GET', path: '/api/alerts?goal=goal-ro' },
    { method: 'GET', path: '/api/routing?goal=goal-ro' },
    { method: 'GET', path: '/api/notifications' },
    {
      method: 'POST',
      path: '/api/invoke',
      body: {
        flow: 'approval-approve',
        argv: ['approve', 'p1-alpha', '--repo-root', config.repoRoot],
      },
    },
    {
      method: 'POST',
      path: '/api/invoke',
      body: { flow: 'approval-mint-receipt', argv: ['show', 'x', '--repo-root', config.repoRoot] },
    },
  ]
  for (const route of routes) {
    const url = new URL(route.path, 'http://localhost')
    const result = handleApi(
      config,
      {
        method: route.method,
        pathname: url.pathname,
        query: url.searchParams,
        body: route.body ?? {},
      },
      NOW_MS,
    )
    assert.ok(result.status < 500, `${route.method} ${route.path} → ${result.status}`)
  }
}

test('D2 negative control: the full API surface leaves goal/receipt/spec trees byte- and mtime-identical', () => {
  withTempRepo(richScenario(), ({ config, root }) => {
    const before = treeSnapshot(root, TRUTH_DIRS)
    const beforeTimes = fileMtimes(root, TRUTH_DIRS)

    const projection = projectGoal(config, 'goal-ro', NOW_MS)
    assert.ok(projection !== null, 'projection itself is exercised')
    exerciseEveryRoute(config)

    // A presented human-gate invocation and an executed read-only flow must
    // both leave the truth sources untouched.
    invokeFlow(
      config,
      { flow: 'approval-reject', argv: ['reject', 'p1-alpha', '--repo-root', config.repoRoot] },
      NOW_MS,
    )
    invokeFlow(
      config,
      { flow: 'receipts-validate', argv: ['validate', join(root, 'docs', 'receipts', WORKFLOW)] },
      NOW_MS,
    )

    assert.deepEqual(treeSnapshot(root, TRUTH_DIRS), before, 'truth-source contents unchanged')
    assert.deepEqual(fileMtimes(root, TRUTH_DIRS), beforeTimes, 'truth-source mtimes unchanged')

    // The ONLY writes the console may make are its two console-local state files.
    const stateFiles = readdirSync(config.stateDir).sort()
    assert.deepEqual(stateFiles, ['invocation-audit.json', 'notifications.json'])
  })
})

test('D2 structural guard: only notifications.ts and invoke.ts may call fs write APIs', () => {
  const srcDir = fileURLToPath(new URL('../src/', import.meta.url))
  const offenders: string[] = []
  for (const name of readdirSync(srcDir)) {
    if (!name.endsWith('.ts')) continue
    const text = readFileSync(join(srcDir, name), 'utf8')
    if (
      /writeFileSync|appendFileSync|mkdirSync|rmSync|unlinkSync|writeFile\(|appendFile\(/.test(text)
    ) {
      if (name !== 'notifications.ts' && name !== 'invoke.ts') offenders.push(name)
    }
  }
  assert.deepEqual(offenders, [], 'no module outside the two state writers touches fs write APIs')
})

test('D2 write guard: state writes are confined to the two named state files', () => {
  withTempRepo(richScenario(), ({ config }) => {
    assert.equal(
      stateFilePath(config.stateDir, 'notifications.json'),
      join(config.stateDir, 'notifications.json'),
    )
    assert.equal(
      stateFilePath(config.stateDir, 'invocation-audit.json'),
      join(config.stateDir, 'invocation-audit.json'),
    )
    assert.throws(
      () => stateFilePath(config.stateDir, '../../escape.json' as StateFile),
      /state write refused/,
    )
    assert.throws(
      () => stateFilePath(config.stateDir, 'goals.json' as StateFile),
      /state write refused/,
    )
  })
})

test('D2: a presented human-gate flow mints no approval, rejection, or receipt artifact', () => {
  withTempRepo(richScenario(), ({ config, root }) => {
    const before = treeSnapshot(root, TRUTH_DIRS)
    const outcome = invokeFlow(
      config,
      { flow: 'approval-approve', argv: ['approve', 'p1-alpha', '--repo-root', config.repoRoot] },
      NOW_MS,
    )
    assert.equal(outcome.action, 'presented')
    assert.deepEqual(treeSnapshot(root, TRUTH_DIRS), before, 'presentation minted nothing on disk')
    const receiptsDir = join(root, 'docs', 'receipts')
    assert.deepEqual(
      readdirSync(receiptsDir).sort(),
      [WORKFLOW, '00000000-0000-4000-8000-000000000061'].sort(),
      'no new workflow directory appeared',
    )
  })
})
