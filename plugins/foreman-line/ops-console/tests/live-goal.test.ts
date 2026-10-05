import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import test from 'node:test'
import { walkChain } from '../src/chain.js'
import { defaultConfig, packageRoot } from '../src/config.js'
import { projectGoal } from '../src/project.js'
import { scanGoal } from '../src/scan.js'

/**
 * FOC-P4 exit proof (contract S1): the console is wired against one REAL goal
 * (`w4-closeout`) and one REAL receipt chain (parcel `E6-R1`, workflow
 * `a5b1975a-7497-4200-bac2-5d8a6fd6c749`) — no fixtures. The chain is walked
 * live end-to-end (spec → dispatch → verification → closure) and the parcel
 * state is derived by the frozen FOC-P0 rules, not hand annotation.
 */
const REPO_ROOT = resolve(packageRoot(), '..', '..', '..')
const WORKFLOW = 'a5b1975a-7497-4200-bac2-5d8a6fd6c749'
const SEALED_HASH = '3de881be904eb9bee9cb2b25034299a99b79a588b5308c00d81ba6847d66407f'
const MERGE_SHA = '57c8a4d2775cac6c37a771392fc0c531d4a35af2'

function withLiveConfig<T>(run: (config: ReturnType<typeof defaultConfig>, now: number) => T): T {
  const stateDir = mkdtempSync(join(tmpdir(), 'foc-live-state-'))
  try {
    return run(defaultConfig(REPO_ROOT, stateDir), Date.now())
  } finally {
    rmSync(stateDir, { recursive: true, force: true })
  }
}

test('S1 live target: the w4-closeout goal record scans its real queue (incl. E6-R1)', () => {
  withLiveConfig((config) => {
    const goal = scanGoal(config, 'w4-closeout')
    assert.ok(goal !== null, 'docs/goals/w4-closeout/loop-directive.md is readable')
    const keys = goal.items.map((item) => item.key)
    for (const key of ['CLOSE-P3', 'CLOSE-P1', 'CLOSE-P2', 'E6-R1']) {
      assert.ok(keys.includes(key), `queue item ${key} discovered (got ${keys.join(', ')})`)
    }
    assert.equal(goal.hungThreshold.source, 'default', 'no hung-threshold override in w4-closeout')
    assert.equal(goal.hungThreshold.thresholdMs, 21_600_000, 'OQ1 default 6h')
  })
})

test('S1 live chain: workflow a5b1975a walks end-to-end — six A–F receipts, valid, sealed', () => {
  withLiveConfig((config) => {
    const walk = walkChain(config.receiptsDir, WORKFLOW)
    assert.equal(walk.valid, true, walk.errors.join('; '))
    assert.equal(walk.sealed, true)
    assert.equal(walk.members.length, 6)
    assert.deepEqual(
      walk.members.map((member) => member.sequence),
      [0, 1, 2, 3, 4, 5],
    )
    assert.deepEqual(
      walk.members.map((member) => member.stage),
      ['A', 'B', 'C', 'D', 'E', 'F'],
    )
    assert.deepEqual(
      walk.members.map((member) => member.subjectKind),
      [
        'ShapingResult',
        'RegistrationResult',
        'DispatchOrder',
        'VerificationVerdict',
        'IntegrationResult',
        'ClosureRecord',
      ],
    )
    assert.equal(
      walk.members[5]?.hash,
      SEALED_HASH,
      'sealed by the Stage-F hash named in the contract',
    )
    for (const member of walk.members) {
      assert.ok(
        member.locator.startsWith(`docs/receipts/${WORKFLOW}/`),
        `repo-relative POSIX locator (${member.locator})`,
      )
    }
    assert.deepEqual(
      walk.sidecars.map((locator) => locator.split('/').pop()),
      ['kompress.json', 'routing-decision.json', 'skill-injection.json'],
    )
  })
})

test('exit criterion 3: E6-R1 derives complete from the live chain under the frozen FOC-P0 rules', () => {
  withLiveConfig((config, now) => {
    const projection = projectGoal(config, 'w4-closeout', now)
    assert.ok(projection !== null)
    const parcel = projection.parcels.find((entry) => entry.parcel === 'E6-R1')
    assert.ok(parcel !== undefined, 'E6-R1 is projected')
    assert.equal(parcel.state, 'complete')
    assert.equal(parcel.rule, 'R2')
    assert.equal(parcel.chainEvidence, 'present')
    assert.equal(parcel.specLocation, 'done', 'spec lives in docs/specs/done/')
    assert.equal(
      parcel.specRef,
      'plugins/foreman-line/docs/specs/done/E6-R1-current-repository-identity-and-evidence-rerun.md',
    )
    assert.equal(parcel.chain?.workflowId, WORKFLOW)
    assert.equal(parcel.failure, null)
  })
})

test('exit criterion 4: E6-R1 gate proxies render read-only from the live chain (G1/G2/G3 evidenced)', () => {
  withLiveConfig((config, now) => {
    const projection = projectGoal(config, 'w4-closeout', now)
    const parcel = projection?.parcels.find((entry) => entry.parcel === 'E6-R1')
    assert.ok(parcel !== undefined)
    assert.equal(parcel.gates.G1.status, 'evidenced', `G1: ${parcel.gates.G1.detail}`)
    // Either frozen G1 proxy may be the one that joins: the approval sidecar
    // or the chain's Stage-A receipt carrying the approval.
    assert.match(parcel.gates.G1.detail, /Stage-A|decision sidecar/)
    assert.equal(parcel.gates.G2.status, 'evidenced', `G2: ${parcel.gates.G2.detail}`)
    assert.equal(parcel.gates.G3.status, 'evidenced', `G3: ${parcel.gates.G3.detail}`)
    assert.match(parcel.gates.G3.detail, new RegExp(MERGE_SHA))
    assert.equal(
      parcel.routing.resolvedModelId,
      'anthropic/claude-opus-5',
      'routing-decision sidecar',
    )
    assert.equal(parcel.routing.routingClass, 'architecture/risk')
  })
})
