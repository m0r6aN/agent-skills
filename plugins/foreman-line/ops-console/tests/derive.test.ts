import assert from 'node:assert/strict'
import { join } from 'node:path'
import test from 'node:test'
import { projectGoal } from '../src/project.js'
import { type Scenario, type ScenarioChain, withTempRepo } from './support/materialize.js'

/**
 * FOC-P0 C4 derivation: rule precedence (R1–R5 first match wins), progress
 * timestamp fallbacks, the confusion-case boundary, proxy-drift, and the OQ1
 * heartbeat override parse.
 */
const NOW = '2026-09-26T12:00:00.000Z'
const NOW_MS = Date.parse(NOW)

function scenario(
  name: string,
  queueText: string,
  chains: readonly ScenarioChain[],
  extra?: Partial<Scenario>,
): Scenario {
  return {
    name,
    now: NOW,
    goal: { slug: 'goal-derive', queue: [queueText] },
    specs: [{ name: 'P1-alpha.md', location: 'active', updated: '2026-09-26' }],
    chains,
    expected: [],
    ...extra,
  }
}

function projectOne(scenarioDef: Scenario) {
  return withTempRepo(scenarioDef, ({ config, now }) => {
    const projection = projectGoal(config, scenarioDef.goal.slug, now)
    assert.ok(projection !== null)
    const parcel = projection.parcels[0]
    assert.ok(parcel !== undefined, 'one parcel projected')
    return parcel
  })
}

function chain(overrides: Partial<ScenarioChain>): ScenarioChain {
  return {
    workflowId: '00000000-0000-4000-8000-000000000030',
    parcel: 'P1',
    stages: ['A', 'B', 'C'],
    ...overrides,
  }
}

test('R1 outranks R3: a fired tripwire fails a parcel even at a gate-pending tip', () => {
  const parcel = projectOne(
    scenario('r1-over-r3', '1. **P1** build unstable; tripwire fired.', [
      chain({ stages: ['A', 'B'], timestampOffsetHours: [-1, -0.5] }),
    ]),
  )
  assert.equal(parcel.state, 'failed')
  assert.equal(parcel.rule, 'R1')
  assert.equal(parcel.failure?.code, 'tripwire')
})

test('R1 outranks R2: a fired tripwire fails even a sealed, done parcel', () => {
  const parcel = projectOne(
    scenario(
      'r1-over-r2',
      '1. **P1** shipped but the tripwire fired on the closure sweep.',
      [
        chain({
          stages: ['A', 'B', 'C', 'D', 'E', 'F'],
          timestampOffsetHours: [-6, -5, -4, -3, -2, -1],
          verdict: 'pass',
          mergeSha: 'hex40',
        }),
      ],
      { specs: [{ name: 'P1-alpha.md', location: 'done', status: 'done', updated: '2026-09-26' }] },
    ),
  )
  assert.equal(parcel.state, 'failed')
  assert.equal(parcel.failure?.code, 'tripwire')
})

test('R1 closure-drift outranks R4: sealed chain with spec still active is failed, not hung', () => {
  const parcel = projectOne(
    scenario('drift-over-hung', '1. **P1** awaiting the spec move.', [
      chain({
        stages: ['A', 'B', 'C', 'D', 'E', 'F'],
        timestampOffsetHours: [-8760, -8759, -8758, -8757, -8756, -8755],
        verdict: 'pass',
        mergeSha: 'hex40',
      }),
    ]),
  )
  assert.equal(parcel.state, 'failed')
  assert.equal(parcel.failure?.code, 'closure-drift')
  assert.equal(parcel.rule, 'R1')
})

test('R4 requires NO liveness: fresh worktree keeps an old-tip parcel running', () => {
  const parcel = projectOne(
    scenario(
      'liveness-keeps-running',
      '1. **P1** builder resumed after a pause.',
      [chain({ timestampOffsetHours: [-720, -710, -700] })],
      { worktrees: [{ name: 'p1-builder', branch: 'feat/p1', fresh: true }] },
    ),
  )
  assert.equal(parcel.state, 'running')
  assert.equal(parcel.rule, 'R5')
  assert.equal(parcel.liveness.live, true)
})

test('progress timestamp: chain timestamps win over spec frontmatter', () => {
  const parcel = projectOne(
    scenario('progress-chain', '1. **P1** working.', [
      chain({ timestampOffsetHours: [-3, -2, -1] }),
    ]),
  )
  assert.equal(parcel.heartbeat.lastProgressAt, new Date(NOW_MS - 3_600_000).toISOString())
})

test('progress timestamp: date-only spec updated counts as T00:00:00Z', () => {
  const parcel = projectOne(
    scenario('progress-frontmatter', '1. **P1** shaped.', [], {
      specs: [{ name: 'P1-alpha.md', location: 'active', updated: '2026-09-25' }],
    }),
  )
  assert.equal(parcel.heartbeat.lastProgressAt, '2026-09-25T00:00:00.000Z')
})

test('progress timestamp: nothing progressed yields null and hangs (age is infinite)', () => {
  const parcel = projectOne(
    scenario('progress-none', '1. **P1** never started.', [], {
      specs: [],
    }),
  )
  assert.equal(parcel.heartbeat.lastProgressAt, null)
  assert.equal(parcel.state, 'hung')
  assert.equal(parcel.rule, 'R4')
  assert.equal(parcel.chainEvidence, 'absent')
})

test('progress timestamp: unparseable spec updated falls back to the spec mtime', () => {
  const parcel = projectOne(
    scenario('progress-mtime', '1. **P1** shaped.', [], {
      specs: [{ name: 'P1-alpha.md', location: 'active', updated: '' }],
    }),
  )
  assert.notEqual(
    parcel.heartbeat.lastProgressAt,
    null,
    'mtime fallback produces a progress timestamp',
  )
})

test('proxy-drift: a decision sidecar at a gate-pending chain position flags drift; state follows the chain', () => {
  const parcel = projectOne(
    scenario(
      'proxy-drift',
      '1. **P1** registered; awaiting dispatch.',
      [chain({ stages: ['A', 'B'], timestampOffsetHours: [-1, -0.5] })],
      { sidecars: [{ kind: 'approval', spec: 'P1-alpha.md', decision: 'approved' }] },
    ),
  )
  assert.equal(parcel.state, 'awaiting-gate', 'state follows the chain position per R3')
  assert.equal(parcel.rule, 'R3')
  assert.ok(parcel.flags.includes('proxy-drift'), `flags: ${parcel.flags.join(', ')}`)
})

test('OQ1 override parse: fractional hours override the 6h default for that goal only', () => {
  const parcel = projectOne(
    scenario('heartbeat-override', '1. **P1** working.', [chain({})], {
      hungThresholdLine: 'hung-threshold: 12.5h',
    }),
  )
  assert.equal(parcel.heartbeat.thresholdMs, 45_000_000)
  assert.equal(parcel.heartbeat.source, 'goal-override')
})

test('OQ1 override parse: unparseable override falls back to the 6h default; nothing else overrides', () => {
  const parcel = projectOne(
    scenario('heartbeat-default', '1. **P1** working.', [chain({})], {
      hungThresholdLine: 'hung-threshold: lots h',
    }),
  )
  assert.equal(parcel.heartbeat.thresholdMs, 21_600_000)
  assert.equal(parcel.heartbeat.source, 'default')
})

test('spec present in both active/ and done/ resolves to done and flags duplicate-spec', () => {
  const parcel = projectOne(
    scenario('duplicate-spec', '1. **P1** moved.', [], {
      specs: [
        { name: 'P1-alpha.md', location: 'active', status: 'active', updated: '2026-09-01' },
        { name: 'P1-alpha.md', location: 'done', status: 'done', updated: '2026-09-26' },
      ],
    }),
  )
  assert.equal(parcel.specLocation, 'done')
  assert.ok(parcel.flags.includes('duplicate-spec'), `flags: ${parcel.flags.join(', ')}`)
})

test('R5: no chain, active spec with recent progress and no liveness is running', () => {
  const parcel = projectOne(
    scenario('running-minimal', '1. **P1** working.', [], {
      specs: [{ name: 'P1-alpha.md', location: 'active', updated: '2026-09-26T11:00:00.000Z' }],
    }),
  )
  assert.equal(parcel.state, 'running')
  assert.equal(parcel.rule, 'R5')
})

test('materialize produces a config rooted at the temp repo', () => {
  withTempRepo(scenario('config-root', '1. **P1** x.', []), ({ config, root }) => {
    assert.equal(config.repoRoot, root)
    assert.equal(config.receiptsDir, join(root, 'docs', 'receipts'))
    assert.equal(config.goalsDir, join(root, 'plugins', 'foreman-line', 'docs', 'goals'))
  })
})
