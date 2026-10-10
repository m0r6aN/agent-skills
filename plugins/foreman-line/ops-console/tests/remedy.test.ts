import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { defaultConfig } from '../src/config.js'
import { remediesFor } from '../src/remedy.js'
import type { FailureCode, GoalProjection, ParcelProjection } from '../src/types.js'

/**
 * FCA-3 remediation advisor: questions + recommendations per blocker,
 * copy-pasteable commands only, ordered preserve-and-complete the existing
 * work first (owner directive 2026-10-09) — closing/re-dispatching fresh is
 * always the last option.
 */

const root = mkdtempSync(join(tmpdir(), 'fca-remedy-'))
const config = defaultConfig(root, join(root, 'state'))

function parcel(partial: Partial<ParcelProjection>): ParcelProjection {
  return {
    goal: 'g',
    parcel: 'P1',
    specRef: null,
    specLocation: 'none',
    chain: null,
    chainEvidence: 'absent',
    gates: {
      G1: { gate: 'G1', status: 'evidenced', evidence: null, detail: '' },
      G2: { gate: 'G2', status: 'evidenced', evidence: null, detail: '' },
      G3: { gate: 'G3', status: 'evidenced', evidence: null, detail: '' },
    },
    routing: { routingClass: null, resolvedModelId: null, resolvedTier: null },
    liveness: {
      live: false,
      worktree: null,
      branch: null,
      newestMtime: null,
      reason: 'no worktree basename matched the parcel key or goal slug',
    },
    heartbeat: { thresholdMs: 21_600_000, source: 'default', lastProgressAt: null },
    failure: null,
    state: 'hung',
    rule: 'R4',
    flags: [],
    ...partial,
  }
}

function projection(
  parcels: readonly ParcelProjection[],
  ratification: 'granted' | 'pending' | 'unknown' = 'granted',
): GoalProjection {
  return {
    goal: {
      slug: 'g',
      charterRef: 'plugins/foreman-line/docs/goals/g/charter.md',
      loopDirectiveRef: 'plugins/foreman-line/docs/goals/g/loop-directive.md',
      items: [{ key: 'P1', text: '1. **P1**' }],
      hungThreshold: { thresholdMs: 21_600_000, source: 'default', hours: null },
      stateLines: [],
      ratification: { status: ratification, detail: 'Gate 1 pending' },
    },
    parcels,
    unmappedChains: [],
  }
}

function hungWith(reason: string, worktree: string | null): ParcelProjection {
  return parcel({ liveness: { live: false, worktree, branch: 'b', newestMtime: null, reason } })
}

test('remedy: hung with the worktree gone recovers existing work before anything else', () => {
  const [remedy] = remediesFor(
    config,
    projection([hungWith('no worktree basename matched the parcel key or goal slug', null)]),
  )
  assert.ok(remedy)
  assert.equal(remedy?.parcel, 'P1')
  assert.match(remedy?.cause ?? '', /hung/)
  assert.ok((remedy?.question ?? '').length > 0)
  const options = remedy?.options ?? []
  assert.ok(options.length >= 2)
  assert.match(options[0]?.recommendation ?? '', /branch|PR|resume|recover/i)
  assert.match(options[0]?.recommendation ?? '', /rather than restarting|Do not re-dispatch|keep/i)
  assert.match(options[options.length - 1]?.recommendation ?? '', /close|defer|last resort/i)
  assert.ok((options[0]?.commands ?? []).length > 0, 'options carry copy-pasteable commands')
})

test('remedy: hung with a stale worktree leads with resuming the existing builder', () => {
  const [remedy] = remediesFor(
    config,
    projection([
      hungWith('worktree content stale beyond threshold (matched g-P1)', '/tmp/wt/g-P1'),
    ]),
  )
  const options = remedy?.options ?? []
  assert.match(options[0]?.recommendation ?? '', /Resume the existing builder/i)
  assert.ok(
    options.some((option) => /hung-threshold/i.test(option.recommendation)),
    'intentional pauses suggest the heartbeat override',
  )
  assert.match(options[options.length - 1]?.recommendation ?? '', /close|defer|last resort/i)
})

test('remedy: every failure code yields a triage question with answer branches', () => {
  for (const code of [
    'chain-invalid',
    'red-review',
    'tripwire',
    'closure-drift',
  ] as FailureCode[]) {
    const [remedy] = remediesFor(
      config,
      projection([
        parcel({
          state: 'failed',
          rule: 'R1',
          failure: { code, detail: `detail for ${code}` },
        }),
      ]),
    )
    assert.ok(remedy, `remedy exists for ${code}`)
    assert.ok((remedy?.options.length ?? 0) >= 2, `${code} has branches`)
    assert.ok((remedy?.question ?? '').length > 0, `${code} asks a question`)
  }
})

test('remedy: chain-invalid leads with validating and re-emitting from real evidence (work preserved)', () => {
  const [remedy] = remediesFor(
    config,
    projection([
      parcel({ state: 'failed', rule: 'R1', failure: { code: 'chain-invalid', detail: 'x' } }),
    ]),
  )
  assert.match(remedy?.options[0]?.recommendation ?? '', /re-emit|Never forge/i)
  assert.ok(
    (remedy?.options[0]?.commands ?? []).some((command) => command.startsWith('receipts validate')),
    'the read-only validate verb is presented',
  )
})

test('remedy: pending gates present the human-gate commands; the console never runs them', () => {
  const [g2] = remediesFor(
    config,
    projection([
      parcel({
        state: 'awaiting-gate',
        rule: 'R3',
        gates: {
          G1: { gate: 'G1', status: 'evidenced', evidence: null, detail: '' },
          G2: { gate: 'G2', status: 'pending', evidence: null, detail: 'dispatch pending' },
          G3: { gate: 'G3', status: 'unknown', evidence: null, detail: '' },
        },
      }),
    ]),
  )
  assert.match(g2?.cause ?? '', /G2 pending/)
  assert.ok(
    (g2?.options[0]?.commands ?? []).some((command) => command.startsWith('approval approve')),
  )

  const [g3] = remediesFor(
    config,
    projection([
      parcel({
        state: 'awaiting-gate',
        rule: 'R3',
        gates: {
          G1: { gate: 'G1', status: 'evidenced', evidence: null, detail: '' },
          G2: { gate: 'G2', status: 'evidenced', evidence: null, detail: '' },
          G3: { gate: 'G3', status: 'pending', evidence: null, detail: 'merge pending' },
        },
      }),
    ]),
  )
  assert.ok((g3?.options[0]?.commands ?? []).some((command) => command.startsWith('gh pr merge')))
})

test('remedy: pending goal ratification gets a goal-level remedy and complete parcels get none', () => {
  const withRatification = remediesFor(config, projection([], 'pending'))
  assert.equal(withRatification.length, 1)
  assert.equal(withRatification[0]?.parcel, null)
  assert.match(withRatification[0]?.question ?? '', /proceed/i)

  const done = remediesFor(config, projection([parcel({ state: 'complete', rule: 'R2' })]))
  assert.equal(done.length, 0)
})

test('remedy: unknown ratification yields exactly one goal-level ratification-evidence remedy', () => {
  const remedies = remediesFor(config, projection([], 'unknown'))
  assert.equal(remedies.length, 1)
  const remedy = remedies[0]
  assert.equal(remedy?.parcel, null)
  assert.equal(remedy?.cause, 'ratification-evidence')
  assert.ok((remedy?.options.length ?? 0) >= 2)
  assert.match(remedy?.options[0]?.recommendation ?? '', /inspect|reconcile/i)
  assert.match(remedy?.options[1]?.recommendation ?? '', /ask owner/i)
  assert.match(remedy?.options[options.length - 1]?.recommendation ?? '', /park|leave/i)
  for (const option of remedy?.options ?? []) {
    assert.deepEqual(option.commands, [])
  }
})

test.after(() => {
  rmSync(root, { recursive: true, force: true })
})
