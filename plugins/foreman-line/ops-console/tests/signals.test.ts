import assert from 'node:assert/strict'
import test from 'node:test'
import { handleApi } from '../src/api.js'
import { projectGoal } from '../src/project.js'
import {
  collectSignals,
  makeSignal,
  parcelStateProvider,
  SEVERITY_FOR_STATE,
  type SignalRefusalError,
} from '../src/signals.js'
import { type Scenario, withTempRepo, withTempRepoAsync } from './support/materialize.js'

/**
 * FCA-P3 signal layer (Task 4): the `Signal` type with its closed class
 * vocabulary, the provider interface (pure derivation on scan — no signal
 * store), the `GET /api/signals` shell, and the parcel-state provider that
 * reproduces the frozen FOC-P0 projection output as signals.
 */
const NOW = '2026-09-26T12:00:00.000Z'
const NOW_MS = Date.parse(NOW)

function signalsScenario(): Scenario {
  return {
    name: 'signals-base',
    now: NOW,
    goal: {
      slug: 'goal-sig',
      queue: [
        '1. **P1** dispatched; builder quiet for a long while.',
        '2. **P2** ☑ SHIPPED + CLOSED without a chain.',
        '3. **P3** silent since dispatch.',
      ],
      charterStatus: 'RATIFIED — Gate 1 granted 2026-09-16 (owner).',
    },
    specs: [
      { name: 'P1-alpha.md', location: 'active', updated: '2026-09-01' },
      { name: 'P2-beta.md', location: 'done', status: 'done', updated: '2026-09-20' },
    ],
    chains: [
      {
        workflowId: '00000000-0000-4000-8000-000000000080',
        parcel: 'P1',
        stages: ['A', 'B', 'C'],
        timestampOffsetHours: [-720, -710, -700],
      },
    ],
    worktrees: [],
    expected: [],
  }
}

function refusalOf(fn: () => unknown): SignalRefusalError {
  try {
    fn()
  } catch (error) {
    return error as SignalRefusalError
  }
  throw new Error('expected a typed signal refusal')
}

test('makeSignal refuses empty evidence and unknown classes', () => {
  const good = {
    class: 'parcel-state' as const,
    severity: 'attention' as const,
    repo: '/repos/x',
    subject: 'goal/P1',
    evidence: ['docs/specs/active/P1-alpha.md'],
    detectedAt: NOW,
    actions: ['investigate' as const],
  }
  const signal = makeSignal(good)
  assert.equal(signal.id, 'parcel-state:/repos/x:goal/P1', 'ids are deterministic for stable scans')
  assert.equal(signal.evidence.length, 1)

  assert.equal(refusalOf(() => makeSignal({ ...good, evidence: [] })).reason, 'empty-evidence')
  assert.equal(
    refusalOf(() => makeSignal({ ...good, class: 'nonsense-class' as 'parcel-state' })).reason,
    'unknown-class',
  )
})

test('parcel-state provider reproduces projection output as signals', () => {
  withTempRepo(signalsScenario(), ({ config }) => {
    const projection = projectGoal(config, 'goal-sig', NOW_MS)
    assert.ok(projection !== null && projection.parcels.length > 0, 'scenario projects parcels')
    const signals = parcelStateProvider.collect(config, NOW_MS)
    assert.equal(signals.length, projection.parcels.length, 'one signal per projected parcel')
    for (const parcel of projection.parcels) {
      const signal = signals.find((entry) => entry.subject === `goal-sig/${parcel.parcel}`)
      assert.ok(signal, `signal exists for ${parcel.parcel}`)
      assert.equal(signal.class, 'parcel-state')
      assert.equal(signal.severity, SEVERITY_FOR_STATE[parcel.state])
      assert.ok(signal.evidence.length > 0, 'every signal carries evidence')
      assert.ok(signal.actions.length > 0)
    }
    assert.ok(
      signals.some((signal) => signal.severity !== 'info'),
      'attention-worthy parcels yield attention/urgent signals',
    )
  })
})

test('GET /api/signals filters by repo/class/severity and validates filter values', async () => {
  await withTempRepoAsync(signalsScenario(), async ({ config }) => {
    const all = await handleApi(
      config,
      { method: 'GET', pathname: '/api/signals', query: new URLSearchParams(), body: {} },
      NOW_MS,
    )
    assert.equal(all.status, 200)
    const signals = (all.json as { signals: { class: string; severity: string; repo: string }[] })
      .signals
    assert.ok(signals.length > 0)

    const byClass = await handleApi(
      config,
      {
        method: 'GET',
        pathname: '/api/signals',
        query: new URLSearchParams('class=parcel-state'),
        body: {},
      },
      NOW_MS,
    )
    assert.equal((byClass.json as { signals: unknown[] }).signals.length, signals.length)

    const bySeverity = await handleApi(
      config,
      {
        method: 'GET',
        pathname: '/api/signals',
        query: new URLSearchParams('severity=info'),
        body: {},
      },
      NOW_MS,
    )
    assert.ok(
      (bySeverity.json as { signals: { severity: string }[] }).signals.every(
        (s) => s.severity === 'info',
      ),
    )

    const byRepo = await handleApi(
      config,
      {
        method: 'GET',
        pathname: '/api/signals',
        query: new URLSearchParams(`repo=${encodeURIComponent(config.repoRoot)}`),
        body: {},
      },
      NOW_MS,
    )
    assert.equal((byRepo.json as { signals: unknown[] }).signals.length, signals.length)
    const wrongRepo = await handleApi(
      config,
      {
        method: 'GET',
        pathname: '/api/signals',
        query: new URLSearchParams('repo=%2Felsewhere'),
        body: {},
      },
      NOW_MS,
    )
    assert.equal((wrongRepo.json as { signals: unknown[] }).signals.length, 0)

    const badClass = await handleApi(
      config,
      {
        method: 'GET',
        pathname: '/api/signals',
        query: new URLSearchParams('class=nonsense'),
        body: {},
      },
      NOW_MS,
    )
    assert.equal(badClass.status, 400)
    assert.equal((badClass.json as { reason?: string }).reason, 'unknown-class')

    const badSeverity = await handleApi(
      config,
      {
        method: 'GET',
        pathname: '/api/signals',
        query: new URLSearchParams('severity=extreme'),
        body: {},
      },
      NOW_MS,
    )
    assert.equal((badSeverity.json as { reason?: string }).reason, 'unknown-severity')

    const wrongMethod = await handleApi(
      config,
      { method: 'POST', pathname: '/api/signals', query: new URLSearchParams(), body: {} },
      NOW_MS,
    )
    assert.equal(wrongMethod.status, 405)
  })
})

test('collectSignals runs registered providers and stays pure per scan', () => {
  withTempRepo(signalsScenario(), ({ config }) => {
    const first = collectSignals(config, NOW_MS)
    const second = collectSignals(config, NOW_MS)
    assert.deepEqual(first, second, 'derived snapshots are deterministic')
    assert.ok(first.every((signal) => signal.class === 'parcel-state'))
  })
})
