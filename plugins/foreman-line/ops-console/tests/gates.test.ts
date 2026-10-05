import assert from 'node:assert/strict'
import test from 'node:test'
import { projectGoal } from '../src/project.js'
import type { GateProxy, ParcelProjection } from '../src/types.js'
import { type Scenario, type ScenarioChain, withTempRepo } from './support/materialize.js'

/**
 * FOC-P0 C3 gate proxy rules (OQ5): rendered read-only from disk evidence,
 * nothing inferred; goal-level ratification from the goal record's
 * Status/ratification text.
 */
const NOW = '2026-09-26T12:00:00.000Z'
const WORKFLOW = '00000000-0000-4000-8000-000000000040'

function chain(overrides: Partial<ScenarioChain>): ScenarioChain {
  return { workflowId: WORKFLOW, parcel: 'P1', stages: ['A', 'B', 'C'], ...overrides }
}

function scenario(
  name: string,
  chains: readonly ScenarioChain[],
  extra?: Partial<Scenario>,
): Scenario {
  return {
    name,
    now: NOW,
    goal: { slug: 'goal-gates', queue: ['1. **P1** gate probe.'] },
    specs: [{ name: 'P1-alpha.md', location: 'active', updated: '2026-09-26T11:00:00.000Z' }],
    chains,
    expected: [],
    ...extra,
  }
}

function projectOne(scenarioDef: Scenario): ParcelProjection {
  return withTempRepo(scenarioDef, ({ config, now }) => {
    const projection = projectGoal(config, scenarioDef.goal.slug, now)
    assert.ok(projection !== null)
    const parcel = projection.parcels[0]
    assert.ok(parcel !== undefined)
    return parcel
  })
}

function projectGoalRecord(scenarioDef: Scenario) {
  return withTempRepo(scenarioDef, ({ config, now }) => {
    const projection = projectGoal(config, scenarioDef.goal.slug, now)
    assert.ok(projection !== null)
    return projection.goal
  })
}

function assertGate(gate: GateProxy, status: GateProxy['status'], evidencePattern?: RegExp): void {
  assert.equal(gate.status, status, `${gate.gate} status (detail: ${gate.detail})`)
  if (evidencePattern !== undefined) {
    assert.ok(gate.evidence !== null, `${gate.gate} evidence present`)
    assert.match(gate.evidence, evidencePattern)
  }
}

test('G1 evidenced via an approval sidecar carrying a decision', () => {
  const parcel = projectOne(
    scenario('g1-sidecar', [], {
      sidecars: [{ kind: 'approval', spec: 'P1-alpha.md', decision: 'approved' }],
    }),
  )
  assertGate(parcel.gates.G1, 'evidenced', /approval\.json$/)
  assert.match(parcel.gates.G1.detail, /decision: approved/)
})

test('G1 evidenced via the chain Stage-A receipt carrying the approval (approvedHash)', () => {
  const parcel = projectOne(
    scenario('g1-a-receipt', [
      chain({ stages: ['A'], approvedHash: true, timestampOffsetHours: [-1] }),
    ]),
  )
  assertGate(parcel.gates.G1, 'evidenced', /000000-A-shaping-result\.json$/)
  assert.match(parcel.gates.G1.detail, /Stage-A/)
})

test('G1 pending: projected artifact only (no chain, no approval sidecar)', () => {
  const parcel = projectOne(
    scenario('g1-projected', [], { sidecars: [{ kind: 'projected', spec: 'P1-alpha.md' }] }),
  )
  assertGate(parcel.gates.G1, 'pending', /projected\.shaping-result\.json$/)
})

test('G1 pending at an unapproved A tip (no approvedHash, no sidecar)', () => {
  const parcel = projectOne(
    scenario('g1-tip-a', [
      chain({ stages: ['A'], approvedHash: false, timestampOffsetHours: [-1] }),
    ]),
  )
  assertGate(parcel.gates.G1, 'pending')
})

test('G1 unknown when neither proxy nor chain exists', () => {
  const parcel = projectOne(scenario('g1-unknown', []))
  assertGate(parcel.gates.G1, 'unknown')
  assert.equal(parcel.gates.G1.evidence, null)
})

test('G2: evidenced by the Stage-C receipt, pending at a pre-C tip, unknown without a chain', () => {
  const dispatched = projectOne(
    scenario('g2-evidenced', [
      chain({ stages: ['A', 'B', 'C'], timestampOffsetHours: [-3, -2, -1] }),
    ]),
  )
  assertGate(dispatched.gates.G2, 'evidenced', /000002-C-dispatch-order\.json$/)
  const waiting = projectOne(scenario('g2-pending', [chain({ stages: ['A', 'B'] })]))
  assertGate(waiting.gates.G2, 'pending')
  const chainless = projectOne(scenario('g2-unknown', []))
  assertGate(chainless.gates.G2, 'unknown')
})

test('G3: evidenced by an F ClosureRecord with a 40-hex mergeSha; pending before F; unknown on a bad mergeSha', () => {
  const merged = projectOne(
    scenario('g3-evidenced', [
      chain({
        stages: ['A', 'B', 'C', 'D', 'E', 'F'],
        timestampOffsetHours: [-6, -5, -4, -3, -2, -1],
        verdict: 'pass',
        mergeSha: 'hex40',
      }),
    ]),
  )
  assertGate(merged.gates.G3, 'evidenced', /000005-F-closure-record\.json$/)
  assert.match(merged.gates.G3.detail, /mergeSha [0-9a-f]{40}/)

  const waiting = projectOne(
    scenario('g3-pending', [
      chain({
        stages: ['A', 'B', 'C', 'D', 'E'],
        timestampOffsetHours: [-5, -4, -3, -2, -1],
        verdict: 'pass',
      }),
    ]),
  )
  assertGate(waiting.gates.G3, 'pending')

  const badSha = projectOne(
    scenario(
      'g3-bad-sha',
      [
        chain({
          stages: ['A', 'B', 'C', 'D', 'E', 'F'],
          timestampOffsetHours: [-6, -5, -4, -3, -2, -1],
          verdict: 'pass',
          mergeSha: 'bad',
        }),
      ],
      { specs: [{ name: 'P1-alpha.md', location: 'done', status: 'done', updated: '2026-09-26' }] },
    ),
  )
  assertGate(badSha.gates.G3, 'unknown')
  assert.match(badSha.gates.G3.detail, /mergeSha/)
})

test('goal-level ratification renders from the charter Status/ratification text', () => {
  const granted = projectGoalRecord(
    scenario('ratification-granted', [], {
      goal: {
        slug: 'goal-gates',
        queue: ['1. **P1** x.'],
        charterStatus: 'RATIFIED — Gate 1 granted 2026-09-16 (owner).',
      },
    }),
  )
  assert.equal(granted.ratification.status, 'granted')
  assert.match(granted.ratification.detail, /Gate 1 granted/)

  const pending = projectGoalRecord(
    scenario('ratification-pending', [], {
      goal: {
        slug: 'goal-gates',
        queue: ['1. **P1** x.'],
        charterStatus: 'Gate 1 review scheduled; not yet ruled.',
      },
    }),
  )
  assert.equal(pending.ratification.status, 'pending')

  const unknown = projectGoalRecord(
    scenario('ratification-unknown', [], {
      goal: { slug: 'goal-gates', queue: ['1. **P1** x.'], charterStatus: 'DRAFT' },
    }),
  )
  assert.equal(unknown.ratification.status, 'unknown')
})

test('gate presentation is read-only: nothing in the projection claims to record a decision', () => {
  const parcel = projectOne(
    scenario('read-only-gates', [chain({ stages: ['A', 'B'], timestampOffsetHours: [-1, -0.5] })]),
  )
  for (const gate of [parcel.gates.G1, parcel.gates.G2, parcel.gates.G3]) {
    assert.deepEqual(
      Object.keys(gate).sort(),
      ['detail', 'evidence', 'gate', 'status'],
      'GateProxy carries presentation fields only (no decision payload)',
    )
  }
})
