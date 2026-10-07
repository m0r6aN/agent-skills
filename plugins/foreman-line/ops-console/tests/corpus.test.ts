import assert from 'node:assert/strict'
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { projectGoal } from '../src/project.js'
import type { GateProxy, GateStatus, ParcelProjection } from '../src/types.js'
import { materialize, type Scenario } from './support/materialize.js'

/**
 * FOC-P0 C5 corpus conformance (AC5): every scenario manifest materializes
 * into a temp repo and its projections must match the frozen expectations —
 * state AND first-matching rule id — 100%.
 */
const SCENARIOS_DIR = fileURLToPath(new URL('./fixtures/scenarios/', import.meta.url))

function loadScenarios(): Scenario[] {
  return readdirSync(SCENARIOS_DIR)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => {
      // Authored fixture manifest; asserted into the Scenario shape at the load boundary.
      const manifest = JSON.parse(readFileSync(join(SCENARIOS_DIR, name), 'utf8')) as Scenario
      assert.equal(
        manifest.name,
        name.replace(/\.json$/, ''),
        `scenario name matches filename (${name})`,
      )
      return manifest
    })
}

function runScenario(scenario: Scenario): ParcelProjection[] {
  const root = mkdtempSync(join(tmpdir(), 'foc-corpus-'))
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
      if (expected.failureCode !== undefined) {
        assert.equal(parcel.failure?.code, expected.failureCode, `${scenario.name} failure code`)
      }
      if (expected.chainEvidence !== undefined) {
        assert.equal(parcel.chainEvidence, expected.chainEvidence, `${scenario.name} chainEvidence`)
      }
      if (expected.thresholdMs !== undefined) {
        assert.equal(
          parcel.heartbeat.thresholdMs,
          expected.thresholdMs,
          `${scenario.name} threshold`,
        )
      }
      if (expected.thresholdSource !== undefined) {
        assert.equal(
          parcel.heartbeat.source,
          expected.thresholdSource,
          `${scenario.name} threshold source`,
        )
      }
      if (expected.flags !== undefined) {
        assert.deepEqual(
          [...parcel.flags].sort(),
          [...expected.flags].sort(),
          `${scenario.name} flags`,
        )
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

const scenarios = loadScenarios()

for (const scenario of scenarios) {
  test(`corpus: ${scenario.name} → ${scenario.expected.map((e) => `${e.parcel}=${e.state}/${e.rule}`).join(', ')}`, () => {
    runScenario(scenario)
  })
}

test('AC5: corpus covers every ParcelStateValue and both named confusion cases + heartbeat override', () => {
  const states = new Set(
    scenarios.flatMap((scenario) => scenario.expected.map((entry) => entry.state)),
  )
  for (const value of ['running', 'hung', 'awaiting-gate', 'failed', 'complete'] as const) {
    assert.ok(states.has(value), `corpus covers state ${value}`)
  }
  const byName = new Map(scenarios.map((scenario) => [scenario.name, scenario]))
  const gatedIdle = byName.get('confusion-idle-but-gated')
  assert.equal(gatedIdle?.expected[0]?.state, 'awaiting-gate', 'idle-but-gated ⇒ awaiting-gate')
  const abandoned = byName.get('confusion-idle-and-abandoned')
  assert.equal(abandoned?.expected[0]?.state, 'hung', 'idle-and-abandoned ⇒ hung')
  const override = byName.get('heartbeat-override')
  assert.equal(
    override?.expected[0]?.thresholdSource,
    'goal-override',
    'heartbeat override scenario present',
  )
})
