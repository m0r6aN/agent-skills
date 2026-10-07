/**
 * MRC-06 HRO-P4 Pi/parcel entry point — C5 controls: parcel preservation and
 * the pi-entry-record's round-trip/atomicity behavior (charter bullet 10 at the
 * entry boundary). C1-C4 + C6 controls live in pi-entry.test.ts.
 *
 * Fixtures are synthetic declared-evidence control data carried locally (the
 * pi-fixtures pattern; routing-policy/tests/pi-fixtures.ts is read-only
 * reference). SYNTHETIC NEGATIVE CONTROLS — not merit claims. The fixture
 * machinery is deliberately duplicated from pi-entry.test.ts: the two test
 * files each carry their own fixtures and the write set excludes a shared
 * fixture module.
 */

import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import fs, {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { syncBuiltinESMExports } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { mock, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { parse, stringify } from 'yaml'
import type { ReplayBindings } from '../../receipts/src/index.js'
import type { HostSettingsSnapshot } from '../../routing-policy/src/host-settings-proposal.js'
import type { RoutingPolicy } from '../../routing-policy/src/index.js'
import { validatePolicy } from '../../routing-policy/src/index.js'
import type { RouteRequest } from '../../routing-policy/src/pi-resolver.js'
import {
  piModelContractFor,
  resolveRoute as resolvePiRoute,
} from '../../routing-policy/src/pi-resolver.js'
import type { PiEntryInput, PiEntryPackage, PiEntryRecord } from '../src/pi-entry/index.js'
import {
  PiEntryError,
  POLICY_REF_PIN,
  preparePiEntry,
  writePiEntryRecord,
} from '../src/pi-entry/index.js'

// ─── Fixture machinery (deliberate local duplication; synthetic control data) ─

const here = dirname(fileURLToPath(import.meta.url))
const policyPath = join(here, '..', '..', 'routing-policy', 'routing-policy.yaml')
const FIXED_NOW = '2026-09-26T12:00:00.000Z'
const FIXED_OPTIONS = { now: () => FIXED_NOW }

const FIXTURE_COSTS: Readonly<Record<string, { input: number; output: number }>> = {
  'openrouter/google/gemini-3.8-flash': { input: 0.05, output: 0.1 },
  'openrouter/anthropic/claude-haiku-4.5': { input: 0.1, output: 0.2 },
  'opencode/qwen3.8-flash': { input: 5, output: 10 },
  'opencode/glm-5.3-flash': { input: 6, output: 12 },
}

function declaredPolicy(): RoutingPolicy {
  const root: unknown = parse(readFileSync(policyPath, 'utf8'))
  // Fixture-owned mutable view of the shipped document; the public view is the
  // validated RoutingPolicy shape.
  const mutable = root as { candidates: Record<string, { bindings: Record<string, unknown>[] }> }
  for (const candidate of Object.values(mutable.candidates)) {
    candidate.bindings = candidate.bindings.map((binding) => {
      const id = String(binding.id)
      const cost = FIXTURE_COSTS[id] ?? { input: 2, output: 10 }
      const endpoint = binding.endpoint as { registered: string }
      return {
        ...binding,
        identity: { state: 'resolved', source: 'synthetic-test-fixture' },
        endpoint: {
          registered: endpoint.registered,
          catalogue: endpoint.registered,
          alignment: 'aligned',
        },
        data_classes: {
          state: 'declared',
          value: ['public', 'internal', 'restricted'],
          source: 'synthetic-test-fixture',
        },
        capabilities: { 'tool-use': 'verified', 'structured-output': 'verified' },
        context_window_tokens: {
          state: 'declared',
          value: 1_000_000,
          source: 'synthetic-test-fixture',
        },
        max_output_tokens: { state: 'declared', value: 128_000, source: 'synthetic-test-fixture' },
        cost: {
          state: 'declared',
          value: { unit: 'usd_per_mtok', input: cost.input, output: cost.output },
          source: 'synthetic-test-fixture',
        },
        availability: {
          state: 'declared',
          value: 'live-availability',
          source: 'synthetic-test-fixture',
        },
        quality: { state: 'declared', value: 'model-quality', source: 'synthetic-test-fixture' },
        inputs: {
          state: 'declared',
          value: ['text', 'image'],
          source: 'synthetic-test-fixture',
        },
        thinking_levels: {
          state: 'declared',
          value: ['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'],
          source: 'synthetic-test-fixture',
        },
      }
    })
  }
  const policy = root as RoutingPolicy
  return policy
}

function sha256Text(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex')
}

function inputFor(parcelText: string): PiEntryInput {
  const policy = declaredPolicy()
  const validation = validatePolicy(policy)
  assert.equal(
    validation.valid,
    true,
    `fixture policy must validate: ${validation.errors.join('; ')}`,
  )
  const policyText = stringify(policy)
  const request: RouteRequest = {
    lane: 'L5',
    routing_class: 'boilerplate',
    data_class: 'internal',
    require_tool_use: false,
    require_structured_output: false,
    independence_excluded_families: [],
    required_context_tokens: 1_000,
    required_output_tokens: 1_000,
    remaining_budget_usd: 0.45,
    projected_input_tokens: 100_000,
    projected_output_tokens: 10_000,
  }
  const receipt = resolvePiRoute(policy, request, { issued_at: FIXED_NOW })
  assert.equal(receipt.status, 'approved', 'fixture precondition: the fixture approves')
  const route = receipt.route
  assert.notEqual(route, null)
  if (route === null) throw new Error('unreachable')
  const contract = piModelContractFor({ provider: route.provider, model: route.primary.model })
  assert.notEqual(contract, null)
  if (contract === null) throw new Error('unreachable')
  const decision: ReplayBindings = {
    effective_requirements: {
      routing_class: request.routing_class,
      data_classification: request.data_class,
      transport_requirements: { data_collection: 'allow', zdr: false },
    },
    policy_digest: { version: POLICY_REF_PIN, content_digest: sha256Text(policyText) },
    catalog_snapshot_digest: 'synthetic-catalog-snapshot-digest',
    vocabulary_version: 'synthetic-vocabulary-version',
    derived_context_floor: { required_context_tokens: null, required_output_tokens: null },
    predicate_set: [],
    selected_identity: {
      registry_key: contract.registry_key,
      provider_local_id: contract.provider_local_id,
      protocol: contract.protocol,
      pi_host_model_id: contract.opencode_id,
    },
  }
  const hostSettings: HostSettingsSnapshot = {
    defaultModel: 'claude-sonnet-5',
    defaultProvider: 'opencode',
    defaultThinkingLevel: 'medium',
    enabledModels: [
      `${route.provider}:${route.primary.model}`,
      `${route.provider}:${route.fallback.model}`,
    ],
    providers: [
      { providerKey: 'opencode', baseUrl: 'https://opencode.ai/zen/go/v1' },
      { providerKey: 'openrouter', baseUrl: 'https://openrouter.ai/api/v1' },
    ],
  }
  return {
    parcel: { ref: 'synthetic/parcel-1', path: 'specs/parcel-1.md', text: parcelText },
    policyText,
    decision,
    routeRequest: request,
    hostSettings,
    max_age_ms: 60_000,
  }
}

function launchableFor(parcelText: string): PiEntryPackage {
  const result = preparePiEntry(inputFor(parcelText), FIXED_OPTIONS)
  assert.equal(result.status, 'launchable')
  if (result.status !== 'launchable') throw new Error('unreachable')
  return result.package
}

function withTempDir(run: (dir: string) => void): void {
  const dir = mkdtempSync(join(tmpdir(), 'pi-entry-record-'))
  try {
    run(dir)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

function expectRecordError(fn: () => unknown, code: string): PiEntryError {
  try {
    fn()
  } catch (err) {
    assert.ok(err instanceof PiEntryError, `expected PiEntryError, got ${String(err)}`)
    assert.equal(err.code, code)
    return err
  }
  assert.fail(`expected PiEntryError('${code}')`)
  throw new Error('unreachable')
}

// ─── C5.1 opaque parcel carry ────────────────────────────────────────────────

const QUOTED_CLI_PARCEL = [
  '---',
  'routing_class: boilerplate',
  'data_classification: internal',
  '---',
  'run: --name "value with spaces" --flag=\'x y\' --pos=1 --path="C:\\repo\\file.md"',
  'args: ["--quoted", \'--single\', --bare]',
  '',
].join('\n')

const MALFORMED_FRONTMATTER_PARCEL = [
  '---',
  'routing_class: [unclosed',
  '---',
  'body stays data',
  '',
].join('\n')

const DUPLICATE_BLOCKS_PARCEL = [
  '---',
  'title: first block',
  '---',
  'middle text',
  '---',
  'title: second block',
  '---',
  'tail',
  '',
].join('\n')

test('C5 preservation: quoted CLI-argument-shaped body lines pass through preparePiEntry byte-identical (text deep-equal, sha256 equal)', () => {
  const entry = launchableFor(QUOTED_CLI_PARCEL)
  assert.equal(entry.parcel.text, QUOTED_CLI_PARCEL)
  assert.equal(entry.parcel.sha256, sha256Text(QUOTED_CLI_PARCEL))
})

test('C5 preservation: malformed frontmatter is carried unchanged as data — never re-serialized, never prepended', () => {
  const entry = launchableFor(MALFORMED_FRONTMATTER_PARCEL)
  assert.equal(entry.parcel.text, MALFORMED_FRONTMATTER_PARCEL)
  assert.equal(entry.parcel.sha256, sha256Text(MALFORMED_FRONTMATTER_PARCEL))
  assert.ok(entry.parcel.text.startsWith('---\nrouting_class: [unclosed\n---\n'))
})

test('C5 preservation: duplicate --- blocks are carried unchanged (deliberate handling; the entry adds no frontmatter)', () => {
  const entry = launchableFor(DUPLICATE_BLOCKS_PARCEL)
  assert.equal(entry.parcel.text, DUPLICATE_BLOCKS_PARCEL)
  assert.equal(entry.parcel.sha256, sha256Text(DUPLICATE_BLOCKS_PARCEL))
  assert.equal(entry.parcel.text.split('---').length - 1, 4)
})

// ─── C5.4 record round-trip / atomicity ──────────────────────────────────────

test('C5 record round-trip: writePiEntryRecord then read back leaves parcel.text byte-equal, sha256 equal, and session_request/route_receipt structurally intact', () => {
  withTempDir((dir) => {
    const entry = launchableFor(QUOTED_CLI_PARCEL)
    const recordPath = join(dir, 'records', 'pi-entry-record.json')
    const record = writePiEntryRecord({ status: 'launchable', package: entry }, recordPath, {
      repoRoot: dir,
    })
    assert.equal(record.kind, 'pi-entry-record')
    assert.equal(record.schema_version, 1)
    const raw = readFileSync(recordPath, 'utf8')
    const readBack = JSON.parse(raw) as PiEntryRecord
    assert.equal(readBack.status, 'launchable')
    assert.equal(readBack.parcel.text, QUOTED_CLI_PARCEL)
    assert.equal(readBack.parcel.text, entry.parcel.text)
    assert.equal(readBack.parcel.sha256, sha256Text(QUOTED_CLI_PARCEL))
    assert.deepEqual(readBack.session_request, entry.sessionRequest)
    assert.deepEqual(readBack.route_receipt, entry.receipt)
    assert.deepEqual(readBack.decision_bindings, entry.decision)
    assert.equal(readBack.outcome, null)
  })
})

test('C5 record collision: a second write to the same recordPath refuses RECORD_EXISTS_REFUSED and the original bytes are unchanged', () => {
  withTempDir((dir) => {
    const entry = launchableFor(QUOTED_CLI_PARCEL)
    const recordPath = join(dir, 'pi-entry-record.json')
    writePiEntryRecord({ status: 'launchable', package: entry }, recordPath, { repoRoot: dir })
    const before = readFileSync(recordPath)
    expectRecordError(
      () =>
        writePiEntryRecord({ status: 'launchable', package: entry }, recordPath, { repoRoot: dir }),
      'RECORD_EXISTS_REFUSED',
    )
    assert.deepEqual(readFileSync(recordPath), before)
  })
})

test('C5 failed write: an induced write failure leaves no temp file and no target file (no partial output)', () => {
  withTempDir((dir) => {
    const entry = launchableFor(QUOTED_CLI_PARCEL)
    // Synthetic negative control — not a merit claim: a NUL byte in the target
    // name makes the write fail after every guard has passed.
    const recordPath = join(dir, 'bad\u0000name.json')
    expectRecordError(
      () =>
        writePiEntryRecord({ status: 'launchable', package: entry }, recordPath, { repoRoot: dir }),
      'RECORD_WRITE_FAILED',
    )
    assert.deepEqual(readdirSync(dir), [])
    assert.equal(existsSync(recordPath), false)
  })
})

test('C5 failed write: an uncreatable target directory leaves no partial output', () => {
  withTempDir((dir) => {
    const entry = launchableFor(QUOTED_CLI_PARCEL)
    // Synthetic negative control — not a merit claim: the target parent is a
    // file, so the write fails before any bytes land.
    const blocker = join(dir, 'blocker')
    writeFileSync(blocker, 'not a directory')
    const recordPath = join(blocker, 'pi-entry-record.json')
    expectRecordError(
      () =>
        writePiEntryRecord({ status: 'launchable', package: entry }, recordPath, { repoRoot: dir }),
      'RECORD_WRITE_FAILED',
    )
    assert.equal(readFileSync(blocker, 'utf8'), 'not a directory')
    assert.deepEqual(readdirSync(dir), ['blocker'])
  })
})

test('C5 failed write (post-temp): a failure after the temp write removes the temp and leaves no target — the cleanup is load-bearing', () => {
  withTempDir((dir) => {
    const entry = launchableFor(QUOTED_CLI_PARCEL)
    const recordPath = join(dir, 'pi-entry-record.json')
    // Synthetic negative control — not a merit claim: the rename to the target
    // is induced to fail AFTER the temp file has been written into the target
    // directory. The builtin fs seam is mocked in-process (mock.method) and
    // synchronized onto the module's ESM named binding via
    // syncBuiltinESMExports, so the entry module's renameSync call observes it.
    const renameMock = mock.method(fs, 'renameSync', () => {
      throw Object.assign(new Error('synthetic post-temp rename failure'), { code: 'EXDEV' })
    })
    syncBuiltinESMExports()
    try {
      expectRecordError(
        () =>
          writePiEntryRecord({ status: 'launchable', package: entry }, recordPath, {
            repoRoot: dir,
          }),
        'RECORD_WRITE_FAILED',
      )
    } finally {
      renameMock.mock.restore()
      syncBuiltinESMExports()
    }
    // No temp AND no target remain. Deleting the entry module's unlinkSync
    // cleanup turns this control red (the temp survives); restoring turns it
    // green — the named property ('no partial output') is falsifiable.
    assert.deepEqual(readdirSync(dir), [])
    assert.equal(existsSync(recordPath), false)
  })
})

test('C5 guards: a non-absolute recordPath refuses ROOT_NOT_ABSOLUTE before any fs work', () => {
  withTempDir((dir) => {
    const entry = launchableFor(QUOTED_CLI_PARCEL)
    expectRecordError(
      () =>
        writePiEntryRecord({ status: 'launchable', package: entry }, 'relative/record.json', {
          repoRoot: dir,
        }),
      'ROOT_NOT_ABSOLUTE',
    )
    assert.deepEqual(readdirSync(dir), [])
  })
})

test('C5 guards: an out-of-root recordPath refuses containment before any fs work', () => {
  withTempDir((dir) => {
    const entry = launchableFor(QUOTED_CLI_PARCEL)
    const outside = mkdtempSync(join(tmpdir(), 'pi-entry-outside-'))
    try {
      const recordPath = join(outside, 'record.json')
      expectRecordError(
        () =>
          writePiEntryRecord({ status: 'launchable', package: entry }, recordPath, {
            repoRoot: dir,
          }),
        'ROOT_CONTAINMENT_REFUSED',
      )
      assert.deepEqual(readdirSync(outside), [])
    } finally {
      rmSync(outside, { recursive: true, force: true })
    }
  })
})

test('C5 record content: the record carries only its enumerated fields — no host settings, no host path, no credential (D2)', () => {
  withTempDir((dir) => {
    const entry = launchableFor(QUOTED_CLI_PARCEL)
    const recordPath = join(dir, 'pi-entry-record.json')
    const record = writePiEntryRecord({ status: 'launchable', package: entry }, recordPath, {
      repoRoot: dir,
    })
    assert.deepEqual(Object.keys(record), [
      'kind',
      'schema_version',
      'status',
      'parcel',
      'policy',
      'decision_bindings',
      'route_receipt',
      'session_request',
      'outcome',
      'host_config_verdict',
      'fallback_handoff',
      'created_at',
    ])
    const raw = readFileSync(recordPath, 'utf8')
    for (const forbidden of [
      '~/.pi',
      'settings.json',
      'models.json',
      'models-store',
      'hostSettings',
      'enabledModels',
    ]) {
      assert.ok(!raw.includes(forbidden), `record must not contain '${forbidden}'`)
    }
  })
})
