/**
 * HRO-P4b (MRC-10) suite — evidence-backed configuration-repair proposals.
 * The artifact is PROPOSED-NOT-WRITTEN with named provenance and the four
 * HRO-P1 mapping fields carried exactly; the reference apply runs only over
 * the mock/temp writer (a real temp directory behind `ConfigWriteSeam`) and
 * never touches host configuration. Named-negative-control style: every
 * `CONFIG_REPAIR_REFUSALS` name is asserted by exactly one named control
 * (the RB-5 pattern, C6.1). Synthetic negative controls are marked — not a
 * merit claim.
 */
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  type ApplyPlan,
  buildConfigRepairProposal,
  CONFIG_REPAIR_REFUSALS,
  type ConfigRepairInput,
  type ConfigRepairProposal,
  type ConfigRepairRefusalName,
  type ConfigRepairResult,
  type ConfigWriteSeam,
  type MappingProvenance,
  type PiModelsEntryContract,
  planConfigRepairApply,
  type SourceState,
  type VerifiedModelEvidence,
  writeConfigRepairAtomically,
} from '../src/config-repair-proposal.js'
import { canonicalJson, documentDigest } from '../src/route-receipt.js'
import { foremanRoot, proposalArtifactPath } from './pi-fixtures.js'

// ---------------------------------------------------------------------------
// Fixture vocabulary (synthetic; never a host contract).
// ---------------------------------------------------------------------------

const FIXTURE_NOW = '2026-09-28T12:00:00.000Z'
const OBSERVED_AT = '2026-09-28T11:58:00.000Z'
const PROVIDER = 'openrouter'
const MODEL = 'anthropic/claude-haiku-4.5'
const SPELLING = `${PROVIDER}:${MODEL}`
const MARKER = 'XYZZY-7721'
const SETTINGS_CREDENTIAL = 'cred://vault/pi-deploy-2026'
const DECL_CREDENTIAL = 'cred://vault/decl-2026'

const SETTINGS_TEXT = JSON.stringify(
  {
    defaultModel: 'fixture-default',
    defaultProvider: PROVIDER,
    enabledModels: ['openrouter:openai/gpt-4o-mini'],
    credential_refs: { deploy: SETTINGS_CREDENTIAL },
    unrelated: { nested: [1, 2, 3], flag: true, note: 'untouched subtree fixture' },
  },
  null,
  2,
)

const DECLARATION_TEXT = JSON.stringify(
  {
    schema_note: 'synthetic fixture document — not a host contract',
    fixture_containers: {
      'fixture-provider': {
        entries: {
          'already-there': { fixture_ref: 'fixture-existing' },
        },
      },
    },
    credential_refs: { decl: DECL_CREDENTIAL },
  },
  null,
  2,
)

const ENTRY_CONTRACT: PiModelsEntryContract = {
  provider_key: 'fixture-provider',
  entry_locator: 'fixture_containers.fixture-provider.entries.fixture-model',
  project_entry: (mapping: MappingProvenance) => ({
    fixture_ref: mapping.registry_key,
    marker: MARKER,
  }),
}

// Empty membership so every parity round-trip spelling is missing (R4).
const ROUND_TRIP_SETTINGS_TEXT = JSON.stringify(
  { defaultModel: 'fixture-default', enabledModels: [] },
  null,
  2,
)

function hashText(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex')
}

function sourceState(
  role: SourceState['role'],
  text: string,
  observedAt: string = OBSERVED_AT,
): SourceState {
  return { role, text, content_hash: hashText(text), observed_at: observedAt }
}

function evidenceRecord(overrides?: {
  readonly provider?: string
  readonly model?: string
  readonly freshness?: 'fresh' | 'stale' | 'unknown'
  readonly observedVia?: 'metadata-refresh' | 'catalog-snapshot'
  readonly withEnvelope?: boolean
  readonly episodeRef?: string
}): VerifiedModelEvidence {
  return {
    mapping: {
      provider: overrides?.provider ?? PROVIDER,
      model: overrides?.model ?? MODEL,
      registry_key: overrides?.model ?? MODEL,
      opencode_id: null,
      provider_local_id: 'anthropic/claude-haiku-4.5',
      protocol: 'openai-chat-completions',
      mapping_source: {
        source: 'routing-policy/routing-policy.yaml',
        locator: 'lane_map.lane-a.provider_rule.fixture-mapping',
      },
    },
    catalog: {
      observed_via: overrides?.observedVia ?? 'metadata-refresh',
      source: {
        source: 'metadata-refresh-2026-09-28',
        locator: 'entries.anthropic/claude-haiku-4.5',
      },
      ...(overrides?.withEnvelope === false
        ? {}
        : {
            provenance: {
              state: 'declared' as const,
              value: {
                fetched_at: '2026-09-28T11:30:00.000Z',
                valid_until: '2026-09-28T15:30:00.000Z',
                content_hash: 'f'.repeat(64),
              },
              source: 'catalog-refresh-2026-09-28',
            },
          }),
    },
    freshness: overrides?.freshness ?? 'fresh',
    trigger: {
      source_refusal: 'HOST_MODEL_NOT_ENABLED_REFUSED',
      ...(overrides?.episodeRef === undefined ? {} : { episode_ref: overrides.episodeRef }),
    },
  }
}

function fixtureInput(overrides?: {
  readonly evidence?: readonly VerifiedModelEvidence[]
  readonly entryContract?: PiModelsEntryContract
  readonly settingsText?: string
  readonly declarationText?: string
}): ConfigRepairInput {
  const documents: SourceState[] = [
    sourceState('pi-settings', overrides?.settingsText ?? SETTINGS_TEXT),
    sourceState('pi-models-declaration', overrides?.declarationText ?? DECLARATION_TEXT),
  ]
  return {
    evidence: overrides?.evidence ?? [evidenceRecord()],
    local: { documents },
    ...(overrides?.entryContract === undefined ? {} : { entry_contract: overrides.entryContract }),
  }
}

function proposedOf(result: ConfigRepairResult): ConfigRepairProposal {
  assert.equal(result.status, 'proposed')
  assert.ok(result.status === 'proposed')
  return result.proposal
}

function refusalOf(result: ConfigRepairResult): {
  refusal: ConfigRepairRefusalName
  detail: string
} {
  assert.equal(result.status, 'refused')
  assert.ok(result.status === 'refused')
  return { refusal: result.refusal, detail: result.detail }
}

// ---------------------------------------------------------------------------
// Mock/temp writer seam over a real temp directory (C5.3) with call counting.
// ---------------------------------------------------------------------------

interface SeamCalls {
  read: number
  writeTemp: number
  rename: number
  remove: number
  exists: number
}

/**
 * Rename behaviors for the no-atomicity seam contract (R1): 'normal' moves
 * once; 'move-then-throw' moves and THEN throws; 'throw-in-place' throws
 * without moving. A short mode list repeats its last entry per later attempt.
 */
type RenameMode = 'normal' | 'move-then-throw' | 'throw-in-place'

function makeSeam(opts?: { readonly renameModes?: readonly RenameMode[] }): {
  seam: ConfigWriteSeam
  calls: SeamCalls
} {
  const calls: SeamCalls = { read: 0, writeTemp: 0, rename: 0, remove: 0, exists: 0 }
  const seam: ConfigWriteSeam = {
    read: (path) => {
      calls.read += 1
      return readFileSync(path, 'utf8')
    },
    writeTemp: (path, content) => {
      calls.writeTemp += 1
      writeFileSync(path, content)
    },
    rename: (from, to) => {
      calls.rename += 1
      const modes = opts?.renameModes ?? []
      const mode: RenameMode = modes[Math.min(calls.rename - 1, modes.length - 1)] ?? 'normal'
      if (mode === 'throw-in-place') throw new Error('induced rename failure (synthetic)')
      renameSync(from, to)
      if (mode === 'move-then-throw') {
        // The seam contract promises no atomicity (R1): the file has moved.
        throw new Error('induced rename failure after move (synthetic)')
      }
    },
    remove: (path) => {
      calls.remove += 1
      rmSync(path, { force: true })
    },
    exists: (path) => {
      calls.exists += 1
      return existsSync(path)
    },
  }
  return { seam, calls }
}

function withTempDir(run: (dir: string) => void): void {
  const dir = mkdtempSync(join(tmpdir(), 'mrc10-config-repair-'))
  try {
    run(dir)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

function writesOf(calls: SeamCalls): number {
  return calls.writeTemp + calls.rename + calls.remove
}

// ---------------------------------------------------------------------------
// C1–C3 proposal controls.
// ---------------------------------------------------------------------------

test('C1 minimal proposal: a verified model missing from the view emits exactly the minimal add set with named provenance, mapping_provenance, and the evidence block', () => {
  const result = buildConfigRepairProposal(fixtureInput(), { now: FIXTURE_NOW })
  const proposal = proposedOf(result)

  assert.equal(proposal.kind, 'pi-config-repair-proposal')
  assert.equal(proposal.status, 'PROPOSED-NOT-WRITTEN')
  assert.equal(proposal.schema_version, 1)
  assert.deepEqual(proposal.target.documents, ['pi-settings'])
  assert.ok(proposal.target.write_policy.length > 0)
  assert.ok(proposal.target.scope_preference.length > 0)

  assert.equal(proposal.changes.length, 1)
  const change = proposal.changes[0]
  assert.ok(change)
  assert.equal(change.path, 'enabledModels')
  assert.equal(change.op, 'add')
  assert.equal(change.value, SPELLING)
  assert.ok(change.provenance.length >= 2)
  for (const ref of change.provenance) {
    assert.ok(ref.source.length > 0)
    assert.ok(ref.locator.length > 0)
  }
  const provenanceSources = change.provenance.map((ref) => ref.source)
  assert.ok(provenanceSources.includes('routing-policy/routing-policy.yaml'))
  assert.ok(provenanceSources.includes('metadata-refresh-2026-09-28'))

  assert.deepEqual(proposal.mapping_provenance, {
    registry_key: MODEL,
    opencode_id: null,
    provider_local_id: 'anthropic/claude-haiku-4.5',
    protocol: 'openai-chat-completions',
    mapping_source: {
      source: 'routing-policy/routing-policy.yaml',
      locator: 'lane_map.lane-a.provider_rule.fixture-mapping',
    },
  })

  const record = evidenceRecord()
  assert.deepEqual(proposal.evidence.catalog, record.catalog.provenance ?? null)
  assert.equal(proposal.evidence.freshness, 'fresh')
  assert.deepEqual(proposal.evidence.availability, {
    available: true,
    observed_via: 'metadata-refresh',
    provenance: record.catalog.source,
  })
  assert.deepEqual(proposal.evidence.trigger, {
    source_refusal: 'HOST_MODEL_NOT_ENABLED_REFUSED',
  })

  assert.deepEqual(proposal.source_state, [
    sourceState('pi-settings', SETTINGS_TEXT),
    sourceState('pi-models-declaration', DECLARATION_TEXT),
  ])
  assert.equal(proposal.credentials.contains_credential_value, false)

  // The one digest formula: documentDigest over the artifact minus its digest.
  const { proposal_digest: digest, ...withoutDigest } = proposal
  assert.equal(digest, documentDigest(withoutDigest))
})

test('C1 already-configured: a model present in the supplied view returns no-action', () => {
  const settingsWithModel = JSON.stringify(
    { ...JSON.parse(SETTINGS_TEXT), enabledModels: [SPELLING] },
    null,
    2,
  )
  const declarationWithEntry = JSON.stringify(
    {
      ...JSON.parse(DECLARATION_TEXT),
      fixture_containers: {
        'fixture-provider': {
          entries: {
            'already-there': { fixture_ref: 'fixture-existing' },
            'fixture-model': { fixture_ref: MODEL, marker: MARKER },
          },
        },
      },
    },
    null,
    2,
  )
  const result = buildConfigRepairProposal(
    fixtureInput({
      entryContract: ENTRY_CONTRACT,
      settingsText: settingsWithModel,
      declarationText: declarationWithEntry,
    }),
    { now: FIXTURE_NOW },
  )
  assert.deepEqual(result, { status: 'no-action' })
})

test('C1 minimal diff: only the missing dimension is proposed (half-configured views)', () => {
  const settingsWithModel = JSON.stringify(
    { ...JSON.parse(SETTINGS_TEXT), enabledModels: [SPELLING] },
    null,
    2,
  )
  const enablementOnly = proposedOf(
    buildConfigRepairProposal(
      fixtureInput({ entryContract: ENTRY_CONTRACT, settingsText: settingsWithModel }),
      { now: FIXTURE_NOW },
    ),
  )
  assert.equal(enablementOnly.changes.length, 1)
  assert.equal(enablementOnly.changes[0]?.path, ENTRY_CONTRACT.entry_locator)
  assert.deepEqual(enablementOnly.target.documents, ['pi-models-declaration'])

  const declarationWithEntry = JSON.stringify(
    {
      ...JSON.parse(DECLARATION_TEXT),
      fixture_containers: {
        'fixture-provider': {
          entries: {
            'already-there': { fixture_ref: 'fixture-existing' },
            'fixture-model': { fixture_ref: MODEL, marker: MARKER },
          },
        },
      },
    },
    null,
    2,
  )
  const declarationOnly = proposedOf(
    buildConfigRepairProposal(
      fixtureInput({ entryContract: ENTRY_CONTRACT, declarationText: declarationWithEntry }),
      { now: FIXTURE_NOW },
    ),
  )
  assert.equal(declarationOnly.changes.length, 1)
  assert.equal(declarationOnly.changes[0]?.path, 'enabledModels')
  assert.deepEqual(declarationOnly.target.documents, ['pi-settings'])
})

test('C2 determinism: identical inputs and a fixed clock yield a byte-identical artifact and identical digest', () => {
  const input = fixtureInput({ entryContract: ENTRY_CONTRACT })
  const first = proposedOf(buildConfigRepairProposal(input, { now: FIXTURE_NOW }))
  const second = proposedOf(buildConfigRepairProposal(input, { now: FIXTURE_NOW }))
  assert.equal(canonicalJson(first), canonicalJson(second))
  assert.equal(first.proposal_digest, second.proposal_digest)

  // The injected clock never enters the artifact (shape has no timestamp slot).
  const otherClock = proposedOf(
    buildConfigRepairProposal(input, { now: '2026-09-29T00:00:00.000Z' }),
  )
  assert.equal(first.proposal_digest, otherClock.proposal_digest)

  // Repeated runs over the same view never stack proposals.
  const again = buildConfigRepairProposal(input, { now: FIXTURE_NOW })
  assert.deepEqual(again, buildConfigRepairProposal(input, { now: FIXTURE_NOW }))
})

test('C2 dedupe: duplicate evidence records coalesce to exactly one change per role', () => {
  const input = fixtureInput({
    entryContract: ENTRY_CONTRACT,
    evidence: [
      evidenceRecord({ episodeRef: 'episode-0001' }),
      evidenceRecord({ episodeRef: 'episode-0002', observedVia: 'catalog-snapshot' }),
      evidenceRecord({ episodeRef: 'episode-0001' }),
    ],
  })
  const proposal = proposedOf(buildConfigRepairProposal(input, { now: FIXTURE_NOW }))
  assert.equal(proposal.changes.length, 2)
  assert.deepEqual(
    proposal.changes.map((change) => change.path).sort(),
    ['enabledModels', ENTRY_CONTRACT.entry_locator].sort(),
  )
  for (const change of proposal.changes) {
    const keys = change.provenance.map((ref) => `${ref.source} ${ref.locator}`)
    assert.equal(new Set(keys).size, keys.length, 'provenance refs coalesce, never duplicate')
  }
})

test('C2 freshness matrix: fresh/stale/unknown verdict names are recorded verbatim (MRC-08 FreshnessVerdict carried as data)', () => {
  for (const freshness of ['fresh', 'stale', 'unknown'] as const) {
    const proposal = proposedOf(
      buildConfigRepairProposal(fixtureInput({ evidence: [evidenceRecord({ freshness })] }), {
        now: FIXTURE_NOW,
      }),
    )
    assert.equal(proposal.evidence.freshness, freshness)
  }
})

test('C2 honest unknown: an absent catalog envelope records null and a present envelope is carried verbatim', () => {
  const withoutEnvelope = proposedOf(
    buildConfigRepairProposal(
      fixtureInput({ evidence: [evidenceRecord({ withEnvelope: false })] }),
      { now: FIXTURE_NOW },
    ),
  )
  assert.equal(withoutEnvelope.evidence.catalog, null)

  const withEnvelope = proposedOf(buildConfigRepairProposal(fixtureInput(), { now: FIXTURE_NOW }))
  assert.deepEqual(withEnvelope.evidence.catalog, evidenceRecord().catalog.provenance ?? null)
})

test('C1 null mapping fields stay null — never filled, never derived from the registry key', () => {
  const proposal = proposedOf(buildConfigRepairProposal(fixtureInput(), { now: FIXTURE_NOW }))
  assert.equal(proposal.mapping_provenance.opencode_id, null)
  const record = evidenceRecord()
  const proposalAllNull = proposedOf(
    buildConfigRepairProposal(
      fixtureInput({
        evidence: [
          {
            ...record,
            mapping: {
              ...record.mapping,
              opencode_id: null,
              provider_local_id: null,
              protocol: null,
            },
          },
        ],
      }),
      { now: FIXTURE_NOW },
    ),
  )
  assert.equal(proposalAllNull.mapping_provenance.opencode_id, null)
  assert.equal(proposalAllNull.mapping_provenance.provider_local_id, null)
  assert.equal(proposalAllNull.mapping_provenance.protocol, null)
})

test('C2.5 contract-parameterized entry: the declaration add uses the projected entry at the contract locator', () => {
  const proposal = proposedOf(
    buildConfigRepairProposal(fixtureInput({ entryContract: ENTRY_CONTRACT }), {
      now: FIXTURE_NOW,
    }),
  )
  assert.equal(proposal.changes.length, 2)
  const declarationChange = proposal.changes.find(
    (change) => change.path === ENTRY_CONTRACT.entry_locator,
  )
  assert.ok(declarationChange)
  assert.equal(declarationChange.op, 'add')
  assert.deepEqual(declarationChange.value, { fixture_ref: MODEL, marker: MARKER })
  const contractRef = declarationChange.provenance.find((ref) =>
    ref.source.startsWith('config-repair-input.entry_contract'),
  )
  assert.ok(contractRef)
  assert.equal(contractRef.locator, ENTRY_CONTRACT.entry_locator)
})

test('C2.5 contract absent: no declaration change and a fail-closed CONTRACT_UNESTABLISHED residual naming the gate', () => {
  const proposal = proposedOf(buildConfigRepairProposal(fixtureInput(), { now: FIXTURE_NOW }))
  assert.equal(proposal.changes.length, 1)
  assert.equal(proposal.changes[0]?.path, 'enabledModels')
  assert.equal(proposal.residual_dispositions.length, 1)
  const residual = proposal.residual_dispositions[0]
  assert.ok(residual)
  assert.equal(residual.residual, 'CONTRACT_UNESTABLISHED')
  assert.equal(residual.state, 'fail-closed')
  assert.equal(residual.slot, 'pi-models-declaration')
  assert.ok(residual.attempted_evidence.includes('G-PI-HOST-CONTRACT'))
  for (const ref of residual.provenance) {
    assert.ok(ref.source.length > 0)
    assert.ok(ref.locator.length > 0)
  }
})

test('C2.3 parity control: the inline composition equals hostSpelling rule and the committed PROPOSED artifact values', () => {
  // hostSpelling is module-private in a PMC file outside this write set; the
  // rule is pinned against its documented composition (the MRC-06 A1.5 lockstep
  // parity control) and against the committed artifact's enabledModels values.
  const hostSettingsSource = readFileSync(
    join(foremanRoot, 'routing-policy', 'src', 'host-settings-proposal.ts'),
    'utf8',
  )
  // The rule needle is composed at runtime (its literal contains a template
  // placeholder and must not sit in a plain string).
  const ruleNeedle = ['`', '$', '{binding.provider}', ':', '$', '{binding.model}', '`'].join('')
  assert.ok(hostSettingsSource.includes(ruleNeedle))

  const committed = JSON.parse(readFileSync(proposalArtifactPath, 'utf8')) as {
    changes: { path: string; op: string; value: unknown }[]
  }
  const enabledValues = committed.changes
    .filter((change) => change.path === 'enabledModels')
    .map((change) => String(change.value))
  assert.ok(enabledValues.length > 0)
  // Meaningful round-trip (R4): for every committed enabledModels value the
  // builder's inline composition, fed the value's own provider/model parts,
  // emits exactly that committed value (lockstep builder ↔ committed
  // artifact — never a string identity).
  for (const value of enabledValues) {
    const separator = value.indexOf(':')
    assert.ok(separator > 0, `committed value ${value} must decompose at the first colon`)
    const provider = value.slice(0, separator)
    const model = value.slice(separator + 1)
    assert.ok(model.length > 0)
    const roundTrip = proposedOf(
      buildConfigRepairProposal(
        fixtureInput({
          evidence: [evidenceRecord({ provider, model })],
          settingsText: ROUND_TRIP_SETTINGS_TEXT,
        }),
        { now: FIXTURE_NOW },
      ),
    )
    assert.equal(roundTrip.changes[0]?.value, value)
  }
  assert.ok(enabledValues.includes(SPELLING))

  // And the builder's inline composition reproduces the same value.
  const proposal = proposedOf(buildConfigRepairProposal(fixtureInput(), { now: FIXTURE_NOW }))
  assert.equal(proposal.changes[0]?.value, SPELLING)
})

test('C3.3 emitted-path negative control: every change path is a member of the declared minimal scope', () => {
  const proposal = proposedOf(
    buildConfigRepairProposal(fixtureInput({ entryContract: ENTRY_CONTRACT }), {
      now: FIXTURE_NOW,
    }),
  )
  for (const change of proposal.changes) {
    assert.ok(
      change.path === 'enabledModels' || change.path === ENTRY_CONTRACT.entry_locator,
      `out-of-scope change path ${change.path}`,
    )
  }
})

test('C3.1 never-write control: module source carries no host-path literal, no I/O or clock call, and no expansion vocabulary string', () => {
  const moduleSource = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'config-repair-proposal.ts'),
    'utf8',
  )
  const hostPathNeedles = ['~/.pi', 'settings.json', 'models.json', 'models-store']
  for (const needle of hostPathNeedles) {
    assert.ok(!moduleSource.includes(needle), `host path literal '${needle}' must never appear`)
  }
  const ioNeedles = [
    'node:fs',
    'node:net',
    'node:http',
    'node:https',
    'node:child_process',
    'fetch(',
    'XMLHttpRequest',
    'Date.now',
    'new Date(',
    'console.',
  ]
  for (const needle of ioNeedles) {
    assert.ok(!moduleSource.includes(needle), `I/O or clock call '${needle}' must never appear`)
  }
  // C3.3: no change path or module string touches the expansion vocabulary.
  const vocabularyNeedles = ['allowlist', 'frontier', 'tier', 'eligibility', 'entitlement']
  for (const needle of vocabularyNeedles) {
    assert.ok(!moduleSource.includes(needle), `expansion vocabulary '${needle}' must never appear`)
  }
  // The reference apply logs nothing and writes only through the seam.
  assert.ok(moduleSource.includes('writeConfigRepairAtomically'))
  assert.ok(moduleSource.includes('PROPOSED-NOT-WRITTEN'))
})

test('C2.5 contract-GAP honesty: no assumed host key and no {id, type} entry shape appears in the module, fixtures, or artifact', () => {
  // Composed at runtime so no code or fixture text carries the forbidden
  // literals (C2.5: they exist nowhere in code, fixtures, or artifact).
  const forbiddenKey = ['opencode', 'zen'].join('-')
  const forbiddenEntry = ['{id', 'type'].join(', ')
  const moduleSource = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'config-repair-proposal.ts'),
    'utf8',
  )
  const proposal = proposedOf(
    buildConfigRepairProposal(fixtureInput({ entryContract: ENTRY_CONTRACT }), {
      now: FIXTURE_NOW,
    }),
  )
  const fixtureText = `${SETTINGS_TEXT}${DECLARATION_TEXT}${JSON.stringify(proposal)}`
  for (const needle of [forbiddenKey, forbiddenEntry]) {
    assert.ok(
      !moduleSource.includes(needle),
      `forbidden literal must not appear in code (${needle})`,
    )
    assert.ok(
      !fixtureText.includes(needle),
      `forbidden literal must not appear in fixtures/artifact (${needle})`,
    )
  }
  const projected = proposal.changes.find((change) => change.path === ENTRY_CONTRACT.entry_locator)
  assert.ok(projected)
  assert.ok(typeof projected.value === 'object' && projected.value !== null)
  const keys = Object.keys(projected.value)
  assert.ok(!keys.includes('id'))
  assert.ok(!keys.includes('type'))
})

test('C3.4 redaction controls: redacted_summary carries digests, counts, roles, and identity names — never values, bytes, or credential material', () => {
  const proposal = proposedOf(
    buildConfigRepairProposal(fixtureInput({ entryContract: ENTRY_CONTRACT }), {
      now: FIXTURE_NOW,
    }),
  )
  const summary = proposal.redacted_summary
  assert.deepEqual(summary.model, { registry_key: MODEL, host_spelling: SPELLING })
  assert.deepEqual(summary.documents, ['pi-settings', 'pi-models-declaration'])
  assert.equal(summary.change_count, 2)
  assert.deepEqual(summary.source_hashes, [
    { role: 'pi-settings', content_hash: hashText(SETTINGS_TEXT) },
    { role: 'pi-models-declaration', content_hash: hashText(DECLARATION_TEXT) },
  ])

  const serialized = JSON.stringify(summary)
  assert.ok(!serialized.includes(MARKER), 'changes[].value content must not appear')
  assert.ok(!serialized.includes(SETTINGS_CREDENTIAL), 'credential material must not appear')
  assert.ok(!serialized.includes(DECL_CREDENTIAL), 'credential material must not appear')
  assert.ok(!serialized.includes('defaultModel'), 'source-document bytes must not appear')
  assert.ok(!serialized.includes('fixture_containers'), 'source-document bytes must not appear')
  assert.equal(proposal.credentials.contains_credential_value, false)
})

test('C1.2 malformed call shapes fail closed with TypeError and authorize nothing', () => {
  assert.throws(() => buildConfigRepairProposal(fixtureInput(), { now: '' }), TypeError)
  assert.throws(
    () =>
      buildConfigRepairProposal(
        fixtureInput({
          evidence: [
            {
              ...evidenceRecord(),
              freshness: 'sideways' as unknown as 'fresh',
            },
          ],
        }),
        { now: FIXTURE_NOW },
      ),
    TypeError,
  )
  assert.throws(
    () =>
      planConfigRepairApply({} as ConfigRepairProposal, sourceState('pi-settings', SETTINGS_TEXT)),
    TypeError,
  )
})

// ---------------------------------------------------------------------------
// C4 apply-contract controls.
// ---------------------------------------------------------------------------

test('C4.1 the apply contract carries the ten D9 writer duties with provable/named-gate tagging and the three gates verbatim', () => {
  const proposal = proposedOf(buildConfigRepairProposal(fixtureInput(), { now: FIXTURE_NOW }))
  const contract = proposal.apply_contract
  assert.equal(contract.writer, 'pi-model-configuration authorized writer')
  assert.equal(contract.concurrency, 'content-hash | lock')
  assert.ok(contract.authority.length > 0)

  // Ten D9 writer duties (verbatim-in-substance) + the authorization
  // precondition that carries the apply-act gate.
  const duties = contract.checklist.map((item) => item.duty).join('\n')
  for (const duty of [
    'validate the complete result against the actual Pi contract',
    'preserve unrelated fields and credential references',
    'enforce the intended path/scope',
    'detect concurrent changes with a content hash or lock',
    'write atomically with recoverable backup/rollback',
    'repair failure',
    'idempotent',
    'refresh relevant cache versions only after a successful apply',
    'verify reload/new-session behavior',
    'config contents and secrets out of alerts',
  ]) {
    assert.ok(duties.includes(duty), `checklist must carry D9 duty '${duty}'`)
  }
  for (const item of contract.checklist) {
    assert.ok(
      item.state === 'provable-in-reference-harness' || item.state === 'named-gate',
      `item ${item.id} must carry an acceptance tag`,
    )
    if (item.state === 'named-gate') assert.ok(item.gate !== undefined)
    if (item.state === 'provable-in-reference-harness') assert.equal(item.gate, undefined)
  }
  const namedGates = contract.checklist
    .filter((item) => item.state === 'named-gate')
    .map((item) => item.gate)
  assert.deepEqual(namedGates, ['G-APPLY-AUTH', 'G-PI-HOST-CONTRACT', 'G-RELOAD-VERIFY'])

  // The gate names appear ONLY as checklist named-gate tags and in the
  // fail-closed residual naming (C2.5/C4.3) — never as a closed claim.
  const withoutGates = {
    ...proposal,
    apply_contract: { ...contract, checklist: [] },
    residual_dispositions: [],
  }
  const serialized = JSON.stringify(withoutGates)
  for (const gate of ['G-PI-HOST-CONTRACT', 'G-APPLY-AUTH', 'G-RELOAD-VERIFY']) {
    assert.ok(
      !serialized.includes(gate),
      `gate ${gate} must appear only in checklist/residual slots`,
    )
    assert.ok(!serialized.toLowerCase().includes('satisfied'), 'no gate is ever claimed satisfied')
  }
})

// ---------------------------------------------------------------------------
// RB-5 named negative controls — one per CONFIG_REPAIR_REFUSALS name.
// ---------------------------------------------------------------------------

const RB5_CONTROLS: Record<ConfigRepairRefusalName, string> = {
  PROPOSAL_DIGEST_MISMATCH_REFUSED:
    'RB-5 PROPOSAL_DIGEST_MISMATCH_REFUSED: a tampered proposal is refused before any plan step',
  SOURCE_INVALID_REFUSED:
    'RB-5 SOURCE_INVALID_REFUSED: invalid source bytes refuse and the target is never replaced',
  SOURCE_HASH_MISMATCH_REFUSED:
    'RB-5 SOURCE_HASH_MISMATCH_REFUSED: a concurrent change refuses before any write',
  TARGET_SCOPE_MISMATCH_REFUSED:
    'RB-5 TARGET_SCOPE_MISMATCH_REFUSED: wrong role and out-of-root target refuse before any seam call',
  EVIDENCE_INSUFFICIENT_REFUSED:
    'RB-5 EVIDENCE_INSUFFICIENT_REFUSED: no approved mapping / no named catalog observation refuses and nothing is emitted',
}

test(RB5_CONTROLS.PROPOSAL_DIGEST_MISMATCH_REFUSED, () => {
  const proposal = proposedOf(buildConfigRepairProposal(fixtureInput(), { now: FIXTURE_NOW }))
  const change = proposal.changes[0]
  assert.ok(change)
  const tampered = {
    ...proposal,
    changes: [{ ...change, reason: 'tampered reason (synthetic negative control)' }],
  }
  const plan = planConfigRepairApply(tampered, sourceState('pi-settings', SETTINGS_TEXT))
  assert.equal(plan.status, 'refused')
  assert.ok(plan.status === 'refused')
  assert.equal(plan.refusal, 'PROPOSAL_DIGEST_MISMATCH_REFUSED')
})

test(RB5_CONTROLS.SOURCE_INVALID_REFUSED, () => {
  // Plan side: malformed source JSON refuses and is never replaced.
  const proposal = proposedOf(buildConfigRepairProposal(fixtureInput(), { now: FIXTURE_NOW }))
  const invalidText = '{ this is not valid JSON'
  const plan = planConfigRepairApply(proposal, sourceState('pi-settings', invalidText, OBSERVED_AT))
  assert.equal(plan.status, 'refused')
  assert.ok(plan.status === 'refused')
  assert.equal(plan.refusal, 'SOURCE_INVALID_REFUSED')

  withTempDir((dir) => {
    const targetPath = join(dir, 'fixture-target.json')
    writeFileSync(targetPath, invalidText)
    const { seam, calls } = makeSeam()
    const outcome = writeConfigRepairAtomically(plan, { path: targetPath, root: dir }, seam)
    assert.equal(outcome.status, 'refused')
    assert.ok(outcome.status === 'refused')
    assert.equal(outcome.refusal, 'SOURCE_INVALID_REFUSED')
    assert.equal(writesOf(calls), 0, 'a refused plan performs zero seam writes')
    assert.equal(
      readFileSync(targetPath, 'utf8'),
      invalidText,
      'target bytes untouched (never replaced)',
    )
  })

  // Builder side: an invalid supplied source refuses the same named way.
  const buildResult = buildConfigRepairProposal(
    fixtureInput({ settingsText: '{ also not valid JSON' }),
    { now: FIXTURE_NOW },
  )
  const refused = refusalOf(buildResult)
  assert.equal(refused.refusal, 'SOURCE_INVALID_REFUSED')

  // The invalid class is exactly non-object INTERMEDIATES at the locator (R2
  // scope pin): a present scalar LEAF is present, never invalid (see the
  // scalar-entry control).
  const shallowEntryText = JSON.stringify(
    { fixture_containers: { 'fixture-provider': 'not-an-object-intermediate' } },
    null,
    2,
  )
  const intermediateRefusal = refusalOf(
    buildConfigRepairProposal(
      fixtureInput({ entryContract: ENTRY_CONTRACT, declarationText: shallowEntryText }),
      { now: FIXTURE_NOW },
    ),
  )
  assert.equal(intermediateRefusal.refusal, 'SOURCE_INVALID_REFUSED')
})

test(RB5_CONTROLS.SOURCE_HASH_MISMATCH_REFUSED, () => {
  const proposal = proposedOf(buildConfigRepairProposal(fixtureInput(), { now: FIXTURE_NOW }))

  // Plan side: the recorded content-hash anchor refuses a concurrent edit.
  const editedText = SETTINGS_TEXT.replace('fixture-default', 'concurrently-edited')
  assert.notEqual(hashText(editedText), hashText(SETTINGS_TEXT))
  const plan = planConfigRepairApply(proposal, {
    role: 'pi-settings',
    text: editedText,
    content_hash: hashText(editedText),
    observed_at: OBSERVED_AT,
  })
  assert.equal(plan.status, 'refused')
  assert.ok(plan.status === 'refused')
  assert.equal(plan.refusal, 'SOURCE_HASH_MISMATCH_REFUSED')

  // Write side: target bytes changing between plan and write refuses too.
  withTempDir((dir) => {
    const targetPath = join(dir, 'fixture-target.json')
    writeFileSync(targetPath, SETTINGS_TEXT)
    const goodPlan = planConfigRepairApply(proposal, sourceState('pi-settings', SETTINGS_TEXT))
    assert.equal(goodPlan.status, 'planned')
    writeFileSync(targetPath, editedText)
    const { seam, calls } = makeSeam()
    const outcome = writeConfigRepairAtomically(goodPlan, { path: targetPath, root: dir }, seam)
    assert.equal(outcome.status, 'refused')
    assert.ok(outcome.status === 'refused')
    assert.equal(outcome.refusal, 'SOURCE_HASH_MISMATCH_REFUSED')
    assert.equal(writesOf(calls), 0, 'concurrency refusal happens before any write')
  })
})

test(RB5_CONTROLS.TARGET_SCOPE_MISMATCH_REFUSED, () => {
  const proposal = proposedOf(buildConfigRepairProposal(fixtureInput(), { now: FIXTURE_NOW }))

  // Wrong role: the proposal targets pi-settings only.
  const wrongRole = planConfigRepairApply(
    proposal,
    sourceState('pi-models-declaration', DECLARATION_TEXT),
  )
  assert.equal(wrongRole.status, 'refused')
  assert.ok(wrongRole.status === 'refused')
  assert.equal(wrongRole.refusal, 'TARGET_SCOPE_MISMATCH_REFUSED')

  // Out-of-root target refuses before ANY seam call.
  withTempDir((dir) => {
    const root = join(dir, 'bound-root')
    const outside = join(dir, 'outside.json')
    const { seam, calls } = makeSeam()
    const plan: ApplyPlan = {
      status: 'planned',
      role: 'pi-settings',
      result_text: '{}',
      backup_text: '{}',
    }
    const outcome = writeConfigRepairAtomically(plan, { path: outside, root }, seam)
    assert.equal(outcome.status, 'refused')
    assert.ok(outcome.status === 'refused')
    assert.equal(outcome.refusal, 'TARGET_SCOPE_MISMATCH_REFUSED')
    assert.equal(calls.read + calls.writeTemp + calls.rename + calls.remove + calls.exists, 0)
  })
})

test(RB5_CONTROLS.EVIDENCE_INSUFFICIENT_REFUSED, () => {
  // The discovered-but-unapproved negative (charter bullet 8): no approved
  // mapping ⇒ refused, and no evidence record can manufacture one.
  const empty = refusalOf(
    buildConfigRepairProposal(fixtureInput({ evidence: [] }), { now: FIXTURE_NOW }),
  )
  assert.equal(empty.refusal, 'EVIDENCE_INSUFFICIENT_REFUSED')

  const record = evidenceRecord()
  const withoutMapping = refusalOf(
    buildConfigRepairProposal(
      fixtureInput({
        evidence: [{ ...record, mapping: undefined } as unknown as VerifiedModelEvidence],
      }),
      { now: FIXTURE_NOW },
    ),
  )
  assert.equal(withoutMapping.refusal, 'EVIDENCE_INSUFFICIENT_REFUSED')

  const unnamedCatalog = refusalOf(
    buildConfigRepairProposal(
      fixtureInput({
        evidence: [
          {
            ...record,
            catalog: { observed_via: 'metadata-refresh', source: { source: '', locator: '' } },
          },
        ],
      }),
      { now: FIXTURE_NOW },
    ),
  )
  assert.equal(unnamedCatalog.refusal, 'EVIDENCE_INSUFFICIENT_REFUSED')

  const unnamedMappingSource = refusalOf(
    buildConfigRepairProposal(
      fixtureInput({
        evidence: [
          {
            ...record,
            mapping: {
              ...record.mapping,
              mapping_source: { source: '', locator: '' },
            },
          },
        ],
      }),
      { now: FIXTURE_NOW },
    ),
  )
  assert.equal(unnamedMappingSource.refusal, 'EVIDENCE_INSUFFICIENT_REFUSED')
})

// ---------------------------------------------------------------------------
// C4/C5 apply-contract controls over the mock/temp writer.
// ---------------------------------------------------------------------------

test('C5.1 happy path over the temp writer: applied with unrelated fields and credential references preserved byte-equal', () => {
  withTempDir((dir) => {
    const targetPath = join(dir, 'fixture-target.json')
    writeFileSync(targetPath, SETTINGS_TEXT)
    const proposal = proposedOf(buildConfigRepairProposal(fixtureInput(), { now: FIXTURE_NOW }))
    const plan = planConfigRepairApply(proposal, sourceState('pi-settings', SETTINGS_TEXT))
    assert.equal(plan.status, 'planned')
    assert.ok(plan.status === 'planned')

    let hookFires = 0
    const { seam, calls } = makeSeam()
    const outcome = writeConfigRepairAtomically(plan, { path: targetPath, root: dir }, seam, {
      on_applied: () => {
        hookFires += 1
        // Ordering evidence (R3): inside the hook the target already holds the
        // result bytes — proving on_applied fires only after the successful swap.
        assert.equal(
          readFileSync(targetPath, 'utf8'),
          plan.status === 'planned' ? plan.result_text : null,
        )
      },
    })
    assert.deepEqual(
      outcome.status === 'applied'
        ? { status: outcome.status, hook_error: outcome.hook_error }
        : outcome,
      { status: 'applied', hook_error: undefined },
    )
    assert.equal(hookFires, 1)

    const resultText = readFileSync(targetPath, 'utf8')
    const original = JSON.parse(SETTINGS_TEXT) as Record<string, unknown>
    const result = JSON.parse(resultText) as Record<string, unknown>
    // Unrelated subtrees deep-equal (the byte-equality operationalization).
    assert.deepEqual(result.unrelated, original.unrelated)
    assert.deepEqual(result.credential_refs, original.credential_refs)
    assert.equal(result.defaultModel, original.defaultModel)
    assert.deepEqual(result.enabledModels, [...(original.enabledModels as string[]), SPELLING])
    // Credential-reference substrings raw-equal.
    for (const ref of [SETTINGS_CREDENTIAL]) {
      assert.ok(resultText.includes(ref))
    }
    // No stray temp; the backup persists with the exact original bytes.
    assert.ok(!existsSync(`${targetPath}.tmp`))
    assert.equal(readFileSync(`${targetPath}.backup`, 'utf8'), SETTINGS_TEXT)
    // Ordering is proven by the in-hook byte assertion above (R3), which can
    // only hold after the swap; the hook fire is counted once here.
    assert.ok(calls.rename >= 1)
    assert.equal(calls.remove, 0)
  })
})

test('C5.4 duplicate apply returns already-applied with zero seam writes (call counter)', () => {
  withTempDir((dir) => {
    const targetPath = join(dir, 'fixture-target.json')
    writeFileSync(targetPath, SETTINGS_TEXT)
    const proposal = proposedOf(buildConfigRepairProposal(fixtureInput(), { now: FIXTURE_NOW }))
    const plan = planConfigRepairApply(proposal, sourceState('pi-settings', SETTINGS_TEXT))
    assert.equal(plan.status, 'planned')
    const { seam, calls } = makeSeam()
    const first = writeConfigRepairAtomically(plan, { path: targetPath, root: dir }, seam)
    assert.equal(first.status, 'applied')
    const writesAfterFirst = writesOf(calls)

    // A second write over the applied result: already-applied, zero writes.
    const second = writeConfigRepairAtomically(plan, { path: targetPath, root: dir }, seam)
    assert.deepEqual(second, { status: 'already-applied' })
    assert.equal(writesOf(calls), writesAfterFirst, 'zero seam writes on the duplicate apply')

    // Defensive plan-side idempotence (synthetic negative control — the
    // anchor hash is caller-supplied): a change set already present at the
    // matching anchor returns the already-applied plan with zero writes.
    const appliedText = readFileSync(targetPath, 'utf8')
    const presentPlan = planConfigRepairApply(proposal, {
      role: 'pi-settings',
      text: appliedText,
      content_hash: hashText(SETTINGS_TEXT),
      observed_at: OBSERVED_AT,
    })
    assert.deepEqual(presentPlan, { status: 'already-applied', role: 'pi-settings' })
  })
})

test('C5.2 induced swap failure rolls back: original restored byte-exact, no partial output, no stray temp', () => {
  withTempDir((dir) => {
    const targetPath = join(dir, 'fixture-target.json')
    writeFileSync(targetPath, SETTINGS_TEXT)
    const proposal = proposedOf(buildConfigRepairProposal(fixtureInput(), { now: FIXTURE_NOW }))
    const plan = planConfigRepairApply(proposal, sourceState('pi-settings', SETTINGS_TEXT))
    assert.equal(plan.status, 'planned')

    let hookFires = 0
    const { seam } = makeSeam({ renameModes: ['throw-in-place'] })
    const outcome = writeConfigRepairAtomically(plan, { path: targetPath, root: dir }, seam, {
      on_applied: () => (hookFires += 1),
    })
    assert.equal(outcome.status, 'rolled-back')
    assert.equal(readFileSync(targetPath, 'utf8'), SETTINGS_TEXT, 'original restored byte-exact')
    assert.ok(!existsSync(`${targetPath}.tmp`), 'no stray temp')
    assert.ok(!existsSync(`${targetPath}.backup`), 'no partial output')
    assert.equal(hookFires, 0, 'on_applied never fires on rolled-back')
  })
  // Post-mutation variant (R1): the swap rename moves the file and THEN
  // throws — the seam contract promises no atomicity — so the catch's restore
  // must still return the original bytes. MUTATION PROOF: weakening or
  // removing the restore leaves the new result bytes at the target and turns
  // the byte-exact assertion below red.
  withTempDir((dir) => {
    const targetPath = join(dir, 'fixture-target.json')
    writeFileSync(targetPath, SETTINGS_TEXT)
    const proposal = proposedOf(buildConfigRepairProposal(fixtureInput(), { now: FIXTURE_NOW }))
    const plan = planConfigRepairApply(proposal, sourceState('pi-settings', SETTINGS_TEXT))
    assert.ok(plan.status === 'planned')
    const { seam } = makeSeam({ renameModes: ['move-then-throw', 'normal'] })
    const outcome = writeConfigRepairAtomically(plan, { path: targetPath, root: dir }, seam)
    assert.equal(outcome.status, 'rolled-back')
    assert.ok(outcome.status === 'rolled-back')
    assert.ok(
      outcome.detail.includes('original restored'),
      'only a verified restore may claim restored',
    )
    assert.equal(
      readFileSync(targetPath, 'utf8'),
      SETTINGS_TEXT,
      'original restored byte-exact after a move-then-throw swap',
    )
    assert.ok(!existsSync(`${targetPath}.tmp`), 'no stray temp')
    assert.ok(!existsSync(`${targetPath}.backup`), 'no partial output')
  })
})

test('C5.2 rollback-restore degraded path (R1): a failed restore is never claimed restored and the backup is preserved', () => {
  withTempDir((dir) => {
    const targetPath = join(dir, 'fixture-target.json')
    writeFileSync(targetPath, SETTINGS_TEXT)
    const proposal = proposedOf(buildConfigRepairProposal(fixtureInput(), { now: FIXTURE_NOW }))
    const plan = planConfigRepairApply(proposal, sourceState('pi-settings', SETTINGS_TEXT))
    assert.ok(plan.status === 'planned')
    // The swap rename moves then throws AND the restore rename fails in
    // place: the restore cannot complete (the no-atomicity seam contract).
    const { seam } = makeSeam({ renameModes: ['move-then-throw', 'throw-in-place'] })
    const outcome = writeConfigRepairAtomically(plan, { path: targetPath, root: dir }, seam)
    assert.equal(outcome.status, 'rolled-back')
    assert.ok(outcome.status === 'rolled-back')
    // No false claim: the outcome must say rollback-incomplete, must not say
    // restored, and the backup — the only copy of the original — is preserved
    // (never deleted when the restore is unverified).
    assert.ok(!outcome.detail.includes('original restored'), 'no false restored claim')
    assert.ok(outcome.detail.includes('rollback-incomplete'), 'truthful degraded outcome')
    assert.ok(outcome.detail.includes('backup preserved'), 'backup disposition is stated')
    assert.equal(
      readFileSync(`${targetPath}.backup`, 'utf8'),
      SETTINGS_TEXT,
      'backup preserved with the exact original bytes',
    )
    assert.ok(!existsSync(`${targetPath}.tmp`), 'no stray temp')
  })
})

test('C2.5 scalar-entry class (R2): a present non-object entry is present, never an invalid source', () => {
  const scalarEntryText = JSON.stringify(
    {
      ...JSON.parse(DECLARATION_TEXT),
      fixture_containers: {
        'fixture-provider': {
          entries: {
            'already-there': { fixture_ref: 'fixture-existing' },
            'fixture-model': 'already-a-string-entry',
          },
        },
      },
    },
    null,
    2,
  )
  // The declaration dimension is already present (as a scalar) — only the
  // missing enablement dimension is proposed; nothing refuses.
  const proposal = proposedOf(
    buildConfigRepairProposal(
      fixtureInput({ entryContract: ENTRY_CONTRACT, declarationText: scalarEntryText }),
      { now: FIXTURE_NOW },
    ),
  )
  assert.equal(proposal.changes.length, 1)
  assert.equal(proposal.changes[0]?.path, 'enabledModels')

  // Both dimensions present (scalar entry included) ⇒ no-action.
  const settingsWithModel = JSON.stringify(
    { ...JSON.parse(SETTINGS_TEXT), enabledModels: [SPELLING] },
    null,
    2,
  )
  const noAction = buildConfigRepairProposal(
    fixtureInput({
      entryContract: ENTRY_CONTRACT,
      settingsText: settingsWithModel,
      declarationText: scalarEntryText,
    }),
    { now: FIXTURE_NOW },
  )
  assert.deepEqual(noAction, { status: 'no-action' })

  // Plan-side re-apply over the present entry ⇒ already-applied (synthetic
  // negative control — the anchor hash is caller-supplied).
  const fullProposal = proposedOf(
    buildConfigRepairProposal(fixtureInput({ entryContract: ENTRY_CONTRACT }), {
      now: FIXTURE_NOW,
    }),
  )
  const presentPlan = planConfigRepairApply(fullProposal, {
    role: 'pi-models-declaration',
    text: scalarEntryText,
    content_hash: hashText(DECLARATION_TEXT),
    observed_at: OBSERVED_AT,
  })
  assert.deepEqual(presentPlan, { status: 'already-applied', role: 'pi-models-declaration' })
})

test('C5.2 on_applied fires exactly once and only after the successful swap (never on refused)', () => {
  withTempDir((dir) => {
    const targetPath = join(dir, 'fixture-target.json')
    writeFileSync(targetPath, SETTINGS_TEXT)
    const proposal = proposedOf(buildConfigRepairProposal(fixtureInput(), { now: FIXTURE_NOW }))
    const plan = planConfigRepairApply(proposal, sourceState('pi-settings', SETTINGS_TEXT))
    assert.ok(plan.status === 'planned')

    const events: string[] = []
    const { seam } = makeSeam()
    writeConfigRepairAtomically(plan, { path: targetPath, root: dir }, seam, {
      on_applied: () => events.push('on_applied'),
    })
    assert.deepEqual(events, ['on_applied'])

    // A refused outcome never fires the hook.
    let refusedHookFires = 0
    const refusedPlan: ApplyPlan = {
      status: 'refused',
      refusal: 'TARGET_SCOPE_MISMATCH_REFUSED',
      detail: 'synthetic',
    }
    const refusedOutcome = writeConfigRepairAtomically(
      refusedPlan,
      { path: targetPath, root: dir },
      makeSeam().seam,
      { on_applied: () => (refusedHookFires += 1) },
    )
    assert.equal(refusedOutcome.status, 'refused')
    assert.equal(refusedHookFires, 0)
  })
})

// ---------------------------------------------------------------------------
// C6.1 vocabulary enumeration.
// ---------------------------------------------------------------------------

test('C6.1 vocabulary enumeration: CONFIG_REPAIR_REFUSALS is the pinned closed list and every name is emitted by exactly one named control', () => {
  assert.deepEqual(
    [...CONFIG_REPAIR_REFUSALS],
    [
      'PROPOSAL_DIGEST_MISMATCH_REFUSED',
      'SOURCE_INVALID_REFUSED',
      'SOURCE_HASH_MISMATCH_REFUSED',
      'TARGET_SCOPE_MISMATCH_REFUSED',
      'EVIDENCE_INSUFFICIENT_REFUSED',
    ],
  )
  assert.deepEqual(Object.keys(RB5_CONTROLS).sort(), [...CONFIG_REPAIR_REFUSALS].sort())
  // The enumerated controls are the tests above, one per name (RB-5).
  for (const name of CONFIG_REPAIR_REFUSALS) {
    assert.ok(RB5_CONTROLS[name].startsWith(`RB-5 ${name}`))
  }
})
