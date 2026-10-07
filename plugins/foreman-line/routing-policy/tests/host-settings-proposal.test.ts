/**
 * PMC-P2 host-settings projection suite — the proposal is PROPOSED-NOT-WRITTEN
 * with D9-style mapping provenance (every proposed field maps to a named
 * source), M2/M3/M4 dispositions, SCF-1/2/3 endpoint divergences recorded and
 * unresolved, and no credential or host path anywhere in the artifact.
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import {
  buildHostSettingsProposal,
  type HostSettingsProposal,
  type ProposedChange,
} from '../src/host-settings-proposal.js'
import { PI_OPENROUTER_ROUTING, validatePiOpenRouterRouting } from '../src/pi-openrouter.js'
import type { RoutingPolicy } from '../src/types.js'
import {
  foremanRoot,
  loadSettingsProjection,
  loadShippedPolicy,
  proposalArtifactPath,
} from './pi-fixtures.js'

function buildProposal(): HostSettingsProposal {
  return buildHostSettingsProposal({
    policy: loadShippedPolicy(),
    current: loadSettingsProjection(),
  })
}

test('the committed proposal artifact matches the generator (no drift)', () => {
  const expected = `${JSON.stringify(buildProposal(), null, 2)}\n`
  assert.equal(readFileSync(proposalArtifactPath, 'utf8'), expected)
})

test('every proposed field carries D9-style mapping provenance', () => {
  const proposal = buildProposal()
  const all: readonly (
    | ProposedChange
    | { provenance: readonly { source: string; locator: string }[] }
  )[] = [...proposal.changes, ...proposal.endpoint_divergences, ...proposal.residual_dispositions]
  assert.ok(all.length > 0)
  for (const entry of all) {
    assert.ok(
      entry.provenance.length >= 1,
      `missing provenance on ${JSON.stringify(entry).slice(0, 120)}`,
    )
    for (const ref of entry.provenance) {
      assert.ok(ref.source.length > 0)
      assert.ok(ref.locator.length > 0)
    }
  }
})

test('M4: the proposal enables exactly the charter-matrix binding set in host spelling', () => {
  const proposal = buildProposal()
  const policy = loadShippedPolicy() as RoutingPolicy & {
    candidates: Record<
      string,
      {
        bindings: {
          id: string
          provider: string
          model: string
          selection_only?: boolean
        }[]
      }
    >
  }
  const expectedAdds = policy.candidates
    ? Object.values(policy.candidates)
        .flatMap((candidate) => candidate.bindings)
        // A2.5/A2.6 (MRC-13 spec Amendment A2): this derivation proxy follows
        // the A2.2 enablement-adds contract with declared semantics — an
        // explicit `selection_only: false` stays eligible, matching the
        // generator's `=== true` skip. Every assertion below is byte-unchanged.
        .filter((binding) => binding.selection_only !== true)
        .map((binding) => `${binding.provider}:${binding.model}`)
        .sort()
    : []
  const adds = proposal.changes
    .filter((change) => change.op === 'add')
    .map((change) => change.value as string)
    .sort()
  assert.deepEqual(adds, expectedAdds)
  assert.equal(adds.length, 15)

  const current = loadSettingsProjection()
  // Removals are authorized only where a ratified clause authorizes them (F8):
  // M2 strikes exactly the Jev entry; nothing else is removed.
  const removes = proposal.changes
    .filter((change) => change.op === 'remove')
    .map((change) => change.value as string)
    .sort()
  assert.deepEqual(removes, ['openrouter:typesafe/jev-1.13'])
  for (const id of adds)
    assert.equal(current.enabledModels.includes(id), false, `${id} must be disjoint`)
})

test('M2: the struck Jev entry is removed with M2 provenance, never silently substituted', () => {
  const jev = buildProposal().changes.find(
    (change) => change.op === 'remove' && change.value === 'openrouter:typesafe/jev-1.13',
  )
  assert.ok(jev)
  assert.match(jev.reason, /M2/)
  assert.ok(jev.provenance.some((ref) => ref.source.endsWith('charter.md')))
})

test('M3: interactive defaults are kept unchanged', () => {
  const defaults = buildProposal().changes.filter((change) =>
    ['defaultProvider', 'defaultModel', 'defaultThinkingLevel'].includes(change.path),
  )
  assert.equal(defaults.length, 3)
  for (const change of defaults) {
    assert.equal(change.op, 'keep')
    assert.ok(change.provenance.some((ref) => ref.locator.includes('M3')))
  }
})

test('D2: exactly the two charter provider registrations, OpenRouter pinned to the contract const', () => {
  const proposal = buildProposal()
  const providers = proposal.changes.filter((change) => change.path.startsWith("providers['"))
  assert.equal(providers.length, 2)
  const openrouter = providers.find((change) => change.path === "providers['openrouter'].baseUrl")
  assert.ok(openrouter)
  assert.equal(
    (openrouter.value as { providerKey: string; baseUrl: string }).baseUrl,
    PI_OPENROUTER_ROUTING.baseUrl,
  )
})

test('SCF-3: the pi-openrouter.ts schema const rejects the divergent catalogue endpoint', () => {
  const result = validatePiOpenRouterRouting({
    ...PI_OPENROUTER_ROUTING,
    baseUrl: 'https://openrouter.ai/api',
  })
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((error) => error.includes('baseUrl')))
})

test('SCF-1/2/3: endpoint divergences are recorded with finding ids and left unresolved', () => {
  const divergences = buildProposal().endpoint_divergences
  assert.ok(divergences.length >= 8, 'the shipped policy carries eight divergent bindings')
  const scf3 = divergences.filter((entry) => entry.scf_finding === 'SCF-3')
  assert.ok(scf3.length >= 2, 'SCF-3 covers the openrouter …/api (anthropic-messages) bindings')
  for (const entry of divergences) {
    assert.equal(entry.alignment, 'divergent')
    assert.match(entry.disposition, /unresolved divergence/)
    assert.match(entry.disposition, /ENDPOINT_DIVERGENCE_REFUSED/)
  }
})

test('residuals: L1/L2/L3/L4 pins/preferences and delta_L are dispositioned fail-closed', () => {
  const dispositions = buildProposal().residual_dispositions
  assert.deepEqual(
    dispositions.map((entry) => entry.residual),
    [
      'L1_PINNED_PROVIDER_UNSET',
      'L2_PINNED_PROVIDER_UNSET',
      'L3_PROVIDER_PREFERENCE_UNSET',
      'L4_PROVIDER_PREFERENCE_UNSET',
      'DELTA_L_UNSET',
    ],
  )
  for (const entry of dispositions) {
    assert.equal(entry.state, 'fail-closed')
    assert.match(
      entry.attempted_evidence,
      /pmc-p2-pi-configuration-and-route-resolver-2026-09-26\.md/,
    )
  }
})

test('the artifact is PROPOSED-NOT-WRITTEN: no credential value and no host path', () => {
  const proposal = buildProposal()
  assert.equal(proposal.status, 'PROPOSED-NOT-WRITTEN')
  assert.equal(proposal.credentials.contains_credential_value, false)
  assert.match(proposal.target.write_policy, /NEVER writes/)
  const serialized = JSON.stringify(proposal)
  assert.equal(serialized.includes('~/.pi'), false)
  assert.equal(serialized.includes('.pi/agent'), false)
  assert.equal(/(?:api[_-]?key|password|bearer\s+\S)/i.test(serialized), false)
})

test('F8: removals cite what authorizes them, and the M3-kept default model stays enabled', () => {
  const proposal = buildProposal()
  const removes = proposal.changes.filter((change) => change.op === 'remove')

  // Only the M2-struck entry is removed (M2 authorizes exactly that strike);
  // every removal cites the clause that authorizes it.
  assert.deepEqual(
    removes.map((change) => change.value),
    ['openrouter:typesafe/jev-1.13'],
  )
  for (const change of removes) {
    assert.ok(
      change.provenance.some(
        (ref) => ref.source.endsWith('charter.md') && ref.locator.includes('M2'),
      ),
      `removal of ${String(change.value)} must cite charter M2`,
    )
  }

  // M3 reconciliation: the kept interactive default model must never be
  // removed — the previous proposal removed it while keeping it as the default.
  const defaultHostId = 'opencode:qwen/qwen-2.5-coder-32b'
  assert.equal(
    removes.some((change) => change.value === defaultHostId),
    false,
  )

  const current = loadSettingsProjection()
  const adds = proposal.changes
    .filter((change) => change.op === 'add')
    .map((change) => change.value as string)
  const resultingEnabled = [
    ...current.enabledModels.filter((id) => !removes.some((change) => change.value === id)),
    ...adds,
  ]
  assert.ok(resultingEnabled.includes(defaultHostId))

  // The non-matrix entries nothing authorizes removing are retained, with the
  // missing authorization stated — never a silent "stale" justification.
  const kept = proposal.changes.filter(
    (change) => change.op === 'keep' && change.path === 'enabledModels',
  )
  assert.equal(kept.length, 4)
  for (const change of kept) {
    assert.match(change.reason, /owner decision/)
    assert.equal(/do not resolve in the live store/.test(change.reason), false)
    assert.ok(
      change.provenance.some(
        (ref) => ref.source.endsWith('charter.md') && ref.locator.includes('M4'),
      ),
    )
  }
  const keptDefault = kept.find((change) => change.value === defaultHostId)
  assert.ok(keptDefault)
  assert.match(keptDefault.reason, /M3/)
})

test('F9: every provenance source resolves in the worktree (dangling citations refuse)', () => {
  const proposal = buildProposal()
  const all: readonly { provenance: readonly { source: string; locator: string }[] }[] = [
    ...proposal.changes,
    ...proposal.endpoint_divergences,
    ...proposal.residual_dispositions,
  ]
  const checked = new Set<string>()
  for (const entry of all) {
    for (const ref of entry.provenance) {
      checked.add(ref.source)
      assert.ok(
        existsSync(join(foremanRoot, ref.source)),
        `provenance source '${ref.source}' does not resolve from the foreman-line root`,
      )
    }
  }
  assert.ok(checked.size >= 5, 'the artifact cites its charter, policy, snapshot, and records')
  assert.equal(checked.has('pmc-p0-capability-baseline.md'), false, 'no dangling bare citations')
})
