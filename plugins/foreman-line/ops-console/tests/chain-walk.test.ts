import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, renameSync, rmSync, unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { listWorkflowIds, walkChain } from '../src/chain.js'
import { projectGoal } from '../src/project.js'
import {
  type MaterializedRepo,
  materialize,
  type Scenario,
  type ScenarioChain,
} from './support/materialize.js'

/**
 * FOC-P0 C2 chain-walk semantics: receiptPath-convention membership, filename
 * ordering, delegation to the shipped receipts validator (contiguity + hash
 * linkage + shared correlation), seal semantics, and C1 mapping (unmapped +
 * duplicate-chain).
 */
const WORKFLOW = '00000000-0000-4000-8000-000000000020'

function chainFixture(overrides: Partial<ScenarioChain>): ScenarioChain {
  return {
    workflowId: WORKFLOW,
    parcel: 'P1',
    stages: ['A', 'B', 'C', 'D', 'E', 'F'],
    timestampOffsetHours: [-6, -5, -4, -3, -2, -1],
    verdict: 'pass',
    mergeSha: 'hex40',
    sidecars: ['kompress.json', 'routing-decision.json', 'skill-injection.json'],
    ...overrides,
  }
}

function scenarioWith(chains: readonly ScenarioChain[], extra?: Partial<Scenario>): Scenario {
  return {
    name: 'chain-walk-base',
    now: '2026-09-26T12:00:00.000Z',
    goal: { slug: 'goal-walk', queue: ['1. **P1** walk target.'] },
    specs: [{ name: 'P1-alpha.md', location: 'active', updated: '2026-09-26' }],
    chains,
    expected: [],
    ...extra,
  }
}

function withRepo<T>(
  scenario: Scenario,
  run: (ctx: MaterializedRepo & { receiptsDir: string }) => T,
): T {
  const root = mkdtempSync(join(tmpdir(), 'foc-walk-'))
  try {
    const materialized = materialize(root, scenario)
    return run({ ...materialized, receiptsDir: join(root, 'docs', 'receipts') })
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

test('C2: a valid A–F chain walks ordered members; sidecars are never chain members', () => {
  withRepo(scenarioWith([chainFixture({})]), ({ receiptsDir }) => {
    const walk = walkChain(receiptsDir, WORKFLOW)
    assert.equal(walk.valid, true, walk.errors.join('; '))
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
    for (const member of walk.members) {
      assert.ok(
        member.locator.startsWith(`docs/receipts/${WORKFLOW}/`),
        'repo-relative POSIX locator',
      )
      assert.match(member.hash, /^[0-9a-f]{64}$/)
      assert.ok(member.timestamp.length > 0)
    }
    assert.deepEqual(
      walk.sidecars.map((locator) => locator.split('/').pop()),
      ['kompress.json', 'routing-decision.json', 'skill-injection.json'],
    )
    assert.equal(walk.sealed, true)
    assert.equal(walk.tipStage, 'F')
  })
})

test('C2: the filename sequence prefix is the order key and a member gap invalidates the chain', () => {
  withRepo(scenarioWith([chainFixture({})]), ({ receiptsDir }) => {
    const dir = join(receiptsDir, WORKFLOW)
    unlinkSync(join(dir, '000001-B-registration-result.json'))
    const walk = walkChain(receiptsDir, WORKFLOW)
    assert.equal(walk.valid, false, 'missing member invalidates the chain')
    assert.ok(
      walk.errors.some((error) => error.includes('contiguous')),
      `contiguity error reported: ${walk.errors.join('; ')}`,
    )
    assert.equal(walk.sealed, false)
    assert.deepEqual(
      walk.members.map((member) => member.sequence),
      [0, 2, 3, 4, 5],
    )
  })
})

test('C2: a hash-link break invalidates the chain via the shipped validator', () => {
  withRepo(
    scenarioWith([chainFixture({ stages: ['A', 'B', 'C'], sidecars: [], breakLink: 2 })]),
    ({ receiptsDir }) => {
      const walk = walkChain(receiptsDir, WORKFLOW)
      assert.equal(walk.valid, false)
      assert.ok(
        walk.errors.some((error) => error.includes('prevHash')),
        walk.errors.join('; '),
      )
    },
  )
})

test('C2: an unparseable member invalidates the chain outright', () => {
  withRepo(
    scenarioWith([chainFixture({ stages: ['A', 'B', 'C'], sidecars: [], corrupt: 1 })]),
    ({ receiptsDir }) => {
      const walk = walkChain(receiptsDir, WORKFLOW)
      assert.equal(walk.valid, false)
      assert.ok(
        walk.errors.some((error) => error.includes('unparseable')),
        walk.errors.join('; '),
      )
      assert.equal(walk.sealed, false)
    },
  )
})

test('C2: a valid chain that ends at E is not sealed', () => {
  withRepo(
    scenarioWith([chainFixture({ stages: ['A', 'B', 'C', 'D', 'E'], sidecars: [] })]),
    ({ receiptsDir }) => {
      const walk = walkChain(receiptsDir, WORKFLOW)
      assert.equal(walk.valid, true, walk.errors.join('; '))
      assert.equal(walk.sealed, false)
      assert.equal(walk.tipStage, 'E')
    },
  )
})

test('C2: a per-member schema violation invalidates the chain', () => {
  withRepo(scenarioWith([chainFixture({})]), ({ receiptsDir }) => {
    const file = join(receiptsDir, WORKFLOW, '000002-C-dispatch-order.json')
    const doc = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>
    doc.prevHash = null // non-genesis with null prevHash breaks the AC4b invariant
    writeFileSync(file, JSON.stringify(doc, null, 2))
    const walk = walkChain(receiptsDir, WORKFLOW)
    assert.equal(walk.valid, false)
    assert.ok(
      walk.errors.some((error) => error.includes('prevHash must be non-null')),
      walk.errors.join('; '),
    )
  })
})

test('C1: a chain that joins no parcel is still walked and surfaced as unmapped', () => {
  withRepo(
    scenarioWith([
      chainFixture({
        stages: ['A', 'B'],
        sidecars: [],
        specRefs: ['plugins/foreman-line/docs/specs/active/ZZ-never-queued.md'],
      }),
    ]),
    ({ config, now }) => {
      const projection = projectGoal(config, 'goal-walk', now)
      assert.ok(projection !== null)
      assert.equal(projection.parcels[0]?.chain, null, 'no chain joins the P1 parcel')
      assert.equal(projection.unmappedChains.length, 1)
      assert.equal(projection.unmappedChains[0]?.workflowId, WORKFLOW)
    },
  )
})

test('C1: two chains joining one parcel — smallest workflowId wins, duplicate-chain flagged', () => {
  const other = '00000000-0000-4000-8000-000000000019'
  withRepo(
    scenarioWith([
      chainFixture({ stages: ['A', 'B', 'C'], sidecars: [] }),
      chainFixture({ workflowId: other, stages: ['A', 'B'], sidecars: [] }),
    ]),
    ({ config, now }) => {
      const projection = projectGoal(config, 'goal-walk', now)
      assert.ok(projection !== null)
      const parcel = projection.parcels[0]
      assert.equal(parcel?.chain?.workflowId, other, 'lexicographically smallest workflowId wins')
      assert.ok(
        parcel?.flags.includes('duplicate-chain') === true,
        `flags: ${parcel?.flags.join(', ')}`,
      )
    },
  )
})

test('C2: listWorkflowIds only picks UUID-shaped workflow directories', () => {
  withRepo(scenarioWith([chainFixture({})]), ({ receiptsDir }) => {
    writeFileSync(join(receiptsDir, 'not-a-workflow.json'), '{}')
    renameSync(join(receiptsDir, WORKFLOW), join(receiptsDir, 'scratch-dir'))
    assert.deepEqual(listWorkflowIds(receiptsDir), [])
    renameSync(join(receiptsDir, 'scratch-dir'), join(receiptsDir, WORKFLOW))
    assert.deepEqual(listWorkflowIds(receiptsDir), [WORKFLOW])
  })
})
