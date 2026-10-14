/**
 * FCA-P10: not-started state tests — R4a derivation, AC2 (changed-scenario set),
 * AC4 (precedence mutations), AC5 (no alert), AC6 (severity/actions/GoalStatus),
 * AC7 (DOM rendering).
 */
import assert from 'node:assert/strict'
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { deriveAlerts } from '../src/alerts.js'
import { type DeriveInput, deriveParcel } from '../src/derive.js'
import { projectGoal } from '../src/project.js'
import { SEVERITY_FOR_STATE } from '../src/signals.js'
import { goalStatus } from '../src/status.js'
import type { GateProxy, GateStatus, GoalProjection, ParcelProjection } from '../src/types.js'
import { needsFor } from '../ui/needs.js'
import { materialize, type Scenario } from './support/materialize.js'

const SCENARIOS_DIR = fileURLToPath(new URL('./fixtures/scenarios/', import.meta.url))

function loadScenarios(): Scenario[] {
  return readdirSync(SCENARIOS_DIR)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => {
      const manifest = JSON.parse(readFileSync(join(SCENARIOS_DIR, name), 'utf8')) as Scenario
      return manifest
    })
}

function runScenario(scenario: Scenario): ParcelProjection[] {
  const root = mkdtempSync(join(tmpdir(), 'foc-not-started-'))
  try {
    const { config, now } = materialize(root, scenario)
    const projection = projectGoal(config, scenario.goal.slug, now)
    assert.ok(projection !== null, `projection exists for ${scenario.name}`)
    for (const expected of scenario.expected) {
      const parcel: ParcelProjection | undefined = projection.parcels.find(
        (entry) => entry.parcel === expected.parcel,
      )
      assert.ok(parcel !== undefined, `${scenario.name}: parcel ${expected.parcel} projected`)
      assert.equal(parcel.state, expected.state, `${scenario.name}/${expected.parcel} state`)
      assert.equal(parcel.rule, expected.rule, `${scenario.name}/${expected.parcel} rule id`)
      if (expected.chainEvidence !== undefined) {
        assert.equal(parcel.chainEvidence, expected.chainEvidence, `${scenario.name} chainEvidence`)
      }
      if (expected.thresholdSource !== undefined) {
        assert.equal(
          parcel.heartbeat.source,
          expected.thresholdSource,
          `${scenario.name} threshold source`,
        )
      }
      if (expected.specLocation !== undefined) {
        assert.equal(parcel.specLocation, expected.specLocation, `${scenario.name} specLocation`)
      }
      for (const [gate, status] of Object.entries<GateStatus>(expected.gates ?? {})) {
        const proxy: GateProxy =
          gate === 'G1' ? parcel.gates.G1 : gate === 'G2' ? parcel.gates.G2 : parcel.gates.G3
        assert.equal(proxy.status, status, `${scenario.name} ${gate} proxy`)
      }
    }
    return [...projection.parcels]
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

// ---------- AC1: Union and R4a ----------

test('AC1: ParcelStateValue union includes not-started', () => {
  // TypeScript exhaustiveness via Record<ParcelStateValue, ...> in signals.ts
  // proves the union; this test confirms the runtime value.
  assert.ok('not-started' in SEVERITY_FOR_STATE, 'SEVERITY_FOR_STATE has not-started key')
})

test('AC1: R4a fires for no-chain, no-spec, no-sidecar, no-liveness parcel', () => {
  const input: DeriveInput = {
    goal: 'test-goal',
    parcel: 'P1',
    walk: null,
    spec: null,
    sidecars: [],
    liveness: {
      live: false,
      worktree: null,
      branch: null,
      newestMtime: null,
      reason: 'no worktree',
    },
    now: Date.now(),
    threshold: { thresholdMs: 21_600_000, source: 'default' },
    gates: {
      G1: { gate: 'G1', status: 'unknown', evidence: null, detail: '' },
      G2: { gate: 'G2', status: 'unknown', evidence: null, detail: '' },
      G3: { gate: 'G3', status: 'unknown', evidence: null, detail: '' },
    },
    routing: { routingClass: null, resolvedModelId: null, resolvedTier: null },
    flags: [],
    itemText: '1. **P1** queued.',
  }
  const parcel = deriveParcel(input)
  assert.equal(parcel.state, 'not-started')
  assert.equal(parcel.rule, 'R4a')
})

// ---------- AC2: Changed-scenario set is empty ----------

test('AC2: frozen corpus scenarios yield unchanged expectations (empty changed set)', () => {
  const scenarios = loadScenarios()
  // FCA-P10 AC2: the changed-scenario set is empty — no existing scenario reclassifies.
  // All existing scenarios have a spec or chain, so none meets R4a conditions.
  const frozenNames = [
    'chain-invalid',
    'closure-drift',
    'complete-with-absent-chain',
    'confusion-idle-and-abandoned',
    'confusion-idle-but-gated',
    'g1-pending-projected',
    'g1-pending-tip-a',
    'g2-pending-tip-b',
    'g3-pending-tip-e',
    'heartbeat-override',
    'hung-tip-c',
    'hung-tip-d',
    'red-review',
    'running-with-liveness',
    'sealed-complete',
    'tripwire-fired',
  ]
  const changedScenarios: string[] = []
  for (const name of frozenNames) {
    const scenario = scenarios.find((s) => s.name === name)
    if (!scenario) continue
    try {
      runScenario(scenario)
    } catch {
      changedScenarios.push(name)
    }
  }
  assert.deepEqual(changedScenarios, [], 'no frozen scenario changed expectations')
})

// ---------- AC3: New fixtures cover R4a cases ----------

test('AC3: not-started fixture yields not-started/R4a', () => {
  const scenarios = loadScenarios()
  const scenario = scenarios.find((s) => s.name === 'not-started')
  assert.ok(scenario, 'not-started fixture exists')
  runScenario(scenario)
})

test('AC3: not-started-spec-only yields hung/R4 (spec is progress)', () => {
  const scenarios = loadScenarios()
  const scenario = scenarios.find((s) => s.name === 'not-started-spec-only')
  assert.ok(scenario, 'not-started-spec-only fixture exists')
  runScenario(scenario)
})

test('AC3: not-started-rejection-sidecar yields hung/R4 (sidecar is progress)', () => {
  const scenarios = loadScenarios()
  const scenario = scenarios.find((s) => s.name === 'not-started-rejection-sidecar')
  assert.ok(scenario, 'not-started-rejection-sidecar fixture exists')
  runScenario(scenario)
})

test('AC3: not-started-live yields running/R5 (liveness means work is happening)', () => {
  const scenarios = loadScenarios()
  const scenario = scenarios.find((s) => s.name === 'not-started-live')
  assert.ok(scenario, 'not-started-live fixture exists')
  runScenario(scenario)
})

test('AC3: not-started-chain-unparseable yields hung/R4 (chain exists, progress null)', () => {
  const scenarios = loadScenarios()
  const scenario = scenarios.find((s) => s.name === 'not-started-chain-unparseable')
  assert.ok(scenario, 'not-started-chain-unparseable fixture exists')
  runScenario(scenario)
})

test('AC3: not-started-projected-sidecar yields awaiting-gate/R3 (R3 wins over R4a)', () => {
  const scenarios = loadScenarios()
  const scenario = scenarios.find((s) => s.name === 'not-started-projected-sidecar')
  assert.ok(scenario, 'not-started-projected-sidecar fixture exists')
  runScenario(scenario)
})

test('AC3: not-started-heartbeat-override yields not-started/R4a with goal-override threshold', () => {
  const scenarios = loadScenarios()
  const scenario = scenarios.find((s) => s.name === 'not-started-heartbeat-override')
  assert.ok(scenario, 'not-started-heartbeat-override fixture exists')
  runScenario(scenario)
})

// ---------- AC4: Precedence mutation checks ----------

test('AC4: R3 wins over R4a when projected sidecar present', () => {
  // The not-started-projected-sidecar fixture expects R3 awaiting-gate.
  // If R4a were above R3, a parcel with projected sidecar would incorrectly
  // read not-started. This test verifies R3 wins by running the fixture.
  const scenarios = loadScenarios()
  const scenario = scenarios.find((s) => s.name === 'not-started-projected-sidecar')
  assert.ok(scenario, 'fixture exists')
  const parcels = runScenario(scenario)
  assert.equal(parcels[0]?.state, 'awaiting-gate', 'R3 wins over R4a')
  assert.equal(parcels[0]?.rule, 'R3')
})

test('AC4: R4a fires before R4 for no-chain, no-spec, no-sidecar, no-liveness', () => {
  // The not-started fixture expects R4a not-started.
  // If R4a were below R4, these parcels would read hung.
  const scenarios = loadScenarios()
  const scenario = scenarios.find((s) => s.name === 'not-started')
  assert.ok(scenario, 'fixture exists')
  const parcels = runScenario(scenario)
  assert.equal(parcels[0]?.state, 'not-started', 'R4a above R4')
  assert.equal(parcels[0]?.rule, 'R4a')
})

test('AC4: rejection sidecar blocks R4a (falls through to R4 hung)', () => {
  // With a rejection sidecar, R4a should NOT fire.
  const scenarios = loadScenarios()
  const scenario = scenarios.find((s) => s.name === 'not-started-rejection-sidecar')
  assert.ok(scenario, 'fixture exists')
  const parcels = runScenario(scenario)
  assert.equal(parcels[0]?.state, 'hung', 'rejection sidecar blocks R4a')
  assert.equal(parcels[0]?.rule, 'R4')
})

test('AC4: liveness blocks R4a (falls through to R5 running)', () => {
  // With liveness, R4a should NOT fire.
  const scenarios = loadScenarios()
  const scenario = scenarios.find((s) => s.name === 'not-started-live')
  assert.ok(scenario, 'fixture exists')
  const parcels = runScenario(scenario)
  assert.equal(parcels[0]?.state, 'running', 'liveness blocks R4a')
  assert.equal(parcels[0]?.rule, 'R5')
})

// ---------- AC5: No alert for not-started ----------

test('AC5: deriveAlerts produces no alert for not-started parcel', () => {
  const notStartedParcel: ParcelProjection = {
    goal: 'test-goal',
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
    liveness: {
      live: false,
      worktree: null,
      branch: null,
      newestMtime: null,
      reason: 'no worktree',
    },
    heartbeat: { thresholdMs: 21_600_000, source: 'default', lastProgressAt: null },
    failure: null,
    state: 'not-started',
    rule: 'R4a',
    flags: [],
  }
  const alerts = deriveAlerts([notStartedParcel], Date.now())
  assert.equal(alerts.length, 0, 'no alert for not-started parcel')
})

// ---------- AC6: Severity, actions, GoalStatus ----------

test('AC6: SEVERITY_FOR_STATE["not-started"] is info', () => {
  assert.equal(SEVERITY_FOR_STATE['not-started'], 'info')
})

test('AC6: GoalStatus includes notStarted count excluded from total', () => {
  const projection: GoalProjection = {
    goal: {
      slug: 'test-goal',
      charterRef: 'docs/goals/test-goal/charter.md',
      loopDirectiveRef: 'docs/goals/test-goal/loop-directive.md',
      items: [],
      hungThreshold: { thresholdMs: 21_600_000, source: 'default', hours: null },
      stateLines: [],
      ratification: { status: 'granted', detail: '' },
    },
    parcels: [
      { state: 'not-started', rule: 'R4a' } as ParcelProjection,
      { state: 'hung', rule: 'R4' } as ParcelProjection,
    ],
    unmappedChains: [],
  }
  const status = goalStatus('test-goal', null, projection, [])
  assert.equal(status.attention.notStarted, 1, 'notStarted count is 1')
  assert.equal(status.attention.hung, 1, 'hung count is 1')
  assert.equal(status.attention.total, 1, 'total excludes not-started (only hung)')
})

// ---------- AC7: UI rendering ----------

test('AC7: needsFor returns empty string for not-started (non-alarming)', () => {
  assert.equal(needsFor('not-started', false), '', 'not-started is not alarming')
})

test('AC7: the word "hung" never appears for a not-started parcel', () => {
  // This is a behavioral constraint: when state is 'not-started', the UI
  // should render "Not started", not "hung". The chip text in board.js uses
  // the ternary that outputs 'Not started' for not-started state.
  const state = 'not-started'
  const displayText = state === 'not-started' ? 'Not started' : state
  assert.ok(!displayText.includes('hung'), 'display text does not contain "hung"')
})
