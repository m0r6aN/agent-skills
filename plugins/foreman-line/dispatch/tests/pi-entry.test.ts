/**
 * MRC-06 HRO-P4 Pi/parcel entry point — C1-C4 + C6 controls (C5's preservation
 * and record controls live in pi-entry-preservation.test.ts).
 *
 * Fixtures are synthetic declared-evidence control data (the pi-fixtures
 * pattern, carried locally — routing-policy/tests/pi-fixtures.ts is read-only
 * reference and this package carries its own fixtures). Every fixture value is
 * a SYNTHETIC NEGATIVE CONTROL — not a merit claim. Refusal NAMES are asserted
 * (never bare non-selection); falsifiability pairs: removing the identity
 * bridge turns the alias/host negatives green; removing the config checks turns
 * the C2 negatives green; re-enabling a write turns the no-write control red.
 */

import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { parse, stringify } from 'yaml'
import type { ReplayBindings, SelectedIdentity } from '../../receipts/src/index.js'
import type { HostSettingsSnapshot } from '../../routing-policy/src/host-settings-proposal.js'
import type { RoutingPolicy } from '../../routing-policy/src/index.js'
import { validatePolicy } from '../../routing-policy/src/index.js'
import type { FallbackHandoffRecord, RouteRequest } from '../../routing-policy/src/pi-resolver.js'
import {
  piModelContractFor,
  resolveRoute as resolvePiRoute,
} from '../../routing-policy/src/pi-resolver.js'
import type {
  PiModelContract,
  RefusalEntry,
  RouteReceipt,
} from '../../routing-policy/src/route-receipt.js'
import { signReceipt } from '../../routing-policy/src/route-receipt.js'
import { THINKING_DEFAULT_BY_CLASS, THINKING_LEVELS } from '../../routing-policy/src/types.js'
import type {
  PiEntryInput,
  PiEntryPackage,
  PiEntryResult,
  RouteUnavailableOutcome,
} from '../src/pi-entry/index.js'
import {
  PI_ENTRY_REFUSALS,
  PiEntryError,
  POLICY_REF_PIN,
  preparePiEntry,
  useDeclaredFallback,
  verifyHostModelSelection,
} from '../src/pi-entry/index.js'

// ─── Fixture machinery (synthetic declared-evidence control data) ────────────

const here = dirname(fileURLToPath(import.meta.url))
const policyPath = join(here, '..', '..', 'routing-policy', 'routing-policy.yaml')
const modulePath = join(here, '..', 'src', 'pi-entry', 'index.ts')
const proposalArtifactPath = join(
  here,
  '..',
  '..',
  'docs',
  'goals',
  'pi-model-configuration',
  'pmc-p2-pi-host-settings-PROPOSED-2026-09-26.json',
)
const FIXED_NOW = '2026-09-26T12:00:00.000Z'
const FIXED_OPTIONS = { now: () => FIXED_NOW }

/** OpenRouter route wins L5's cheapest-eligible rule (fixture A). */
const OPENROUTER_CHEAPEST: Readonly<Record<string, { input: number; output: number }>> = {
  'openrouter/google/gemini-3.8-flash': { input: 0.05, output: 0.1 },
  'openrouter/anthropic/claude-haiku-4.5': { input: 0.1, output: 0.2 },
  'opencode/qwen3.8-flash': { input: 5, output: 10 },
  'opencode/glm-5.3-flash': { input: 6, output: 12 },
}
/** OpenCode route wins L5's cheapest-eligible rule (fixture B). */
const OPENCODE_CHEAPEST: Readonly<Record<string, { input: number; output: number }>> = {
  'opencode/qwen3.8-flash': { input: 0.1, output: 0.3 },
  'opencode/glm-5.3-flash': { input: 0.15, output: 0.5 },
  'openrouter/google/gemini-3.8-flash': { input: 5, output: 10 },
  'openrouter/anthropic/claude-haiku-4.5': { input: 6, output: 12 },
}

function declaredPolicy(
  costs: Readonly<Record<string, { input: number; output: number }>>,
): RoutingPolicy {
  const root: unknown = parse(readFileSync(policyPath, 'utf8'))
  // Fixture-owned mutable view of the shipped document; the public view is the
  // validated RoutingPolicy shape.
  const mutable = root as { candidates: Record<string, { bindings: Record<string, unknown>[] }> }
  for (const candidate of Object.values(mutable.candidates)) {
    candidate.bindings = candidate.bindings.map((binding) => {
      const id = String(binding.id)
      const cost = costs[id] ?? { input: 2, output: 10 }
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

function requestFor(overrides?: Partial<RouteRequest>): RouteRequest {
  return {
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
    ...overrides,
  }
}

function sha256Text(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex')
}

/**
 * The synthetic decision record (MRC-05's authoring shape): its effective
 * requirements mirror the route request (absent<->absent included) and its
 * selected identity mirrors the fixture resolution's PiModelContract — exactly
 * what the dispatch flow records. A no-selection decision (the MRC-5
 * ROUTE_UNAVAILABLE authoring) is recorded when the fixture resolution stops.
 */
function decisionFor(
  policyText: string,
  request: RouteRequest,
  contract: PiModelContract | null,
): ReplayBindings {
  const effectiveRequirements: ReplayBindings['effective_requirements'] = {
    routing_class: request.routing_class,
    data_classification: request.data_class,
    transport_requirements: { data_collection: 'allow', zdr: false },
    ...(request.required_inputs !== undefined
      ? { required_inputs: [...request.required_inputs] }
      : {}),
    ...(request.required_thinking_level !== undefined
      ? { required_thinking_level: request.required_thinking_level }
      : {}),
    ...(request.expertise !== undefined ? { expertise: request.expertise } : {}),
  }
  return {
    effective_requirements: effectiveRequirements,
    policy_digest: { version: POLICY_REF_PIN, content_digest: sha256Text(policyText) },
    catalog_snapshot_digest: 'synthetic-catalog-snapshot-digest',
    vocabulary_version: 'synthetic-vocabulary-version',
    derived_context_floor: { required_context_tokens: null, required_output_tokens: null },
    predicate_set: [],
    selected_identity: {
      registry_key: contract?.registry_key ?? null,
      provider_local_id: contract?.provider_local_id ?? null,
      protocol: contract?.protocol ?? null,
      pi_host_model_id: contract?.opencode_id ?? null,
    },
  }
}

interface IdentitySpelling {
  readonly provider: string
  readonly model: string
}

function hostSettingsFor(
  identities: readonly IdentitySpelling[],
  providers?: HostSettingsSnapshot['providers'],
): HostSettingsSnapshot {
  return {
    defaultModel: 'claude-sonnet-5',
    defaultProvider: 'opencode',
    defaultThinkingLevel: 'medium',
    enabledModels: identities.map((identity) => `${identity.provider}:${identity.model}`),
    providers: providers ?? [
      { providerKey: 'opencode', baseUrl: 'https://opencode.ai/zen/go/v1' },
      { providerKey: 'openrouter', baseUrl: 'https://openrouter.ai/api/v1' },
    ],
  }
}

interface Scenario {
  readonly policyText: string
  readonly policy: RoutingPolicy
  readonly request: RouteRequest
  readonly receipt: RouteReceipt
  readonly contract: PiModelContract | null
  readonly fallbackContract: PiModelContract | null
  readonly decision: ReplayBindings
  readonly hostSettings: HostSettingsSnapshot
  readonly input: PiEntryInput
}

function scenario(
  costs: Readonly<Record<string, { input: number; output: number }>>,
  requestOverrides?: Partial<RouteRequest>,
): Scenario {
  const policy = declaredPolicy(costs)
  const validation = validatePolicy(policy)
  assert.equal(
    validation.valid,
    true,
    `fixture policy must validate: ${validation.errors.join('; ')}`,
  )
  const policyText = stringify(policy)
  const request = requestFor(requestOverrides)
  const receipt = resolvePiRoute(policy, request, { issued_at: FIXED_NOW })
  const route = receipt.status === 'approved' ? receipt.route : null
  const contract =
    route === null
      ? null
      : piModelContractFor({ provider: route.provider, model: route.primary.model })
  const fallbackContract =
    route === null
      ? null
      : piModelContractFor({ provider: route.provider, model: route.fallback.model })
  const decision = decisionFor(policyText, request, contract)
  const identities: IdentitySpelling[] =
    route === null
      ? [{ provider: 'opencode', model: 'claude-sonnet-5' }]
      : [
          { provider: route.provider, model: route.primary.model },
          { provider: route.provider, model: route.fallback.model },
          { provider: 'opencode', model: 'qwen3.8-flash' },
        ]
  const hostSettings = hostSettingsFor(identities)
  return {
    policyText,
    policy,
    request,
    receipt,
    contract,
    fallbackContract,
    decision,
    hostSettings,
    input: {
      parcel: {
        ref: 'synthetic/parcel-1',
        path: 'specs/parcel-1.md',
        text: '---\ntitle: fixture\n---\nbody\n',
      },
      policyText,
      decision,
      routeRequest: request,
      hostSettings,
      max_age_ms: 60_000,
    },
  }
}

function approvedScenario(
  costs: Readonly<Record<string, { input: number; output: number }>>,
  requestOverrides?: Partial<RouteRequest>,
): Scenario {
  const built = scenario(costs, requestOverrides)
  assert.equal(built.receipt.status, 'approved', 'fixture precondition: the fixture approves')
  assert.notEqual(
    built.contract,
    null,
    'fixture precondition: the chosen binding is registry-backed',
  )
  return built
}

function fixtureA(requestOverrides?: Partial<RouteRequest>): Scenario {
  return approvedScenario(OPENROUTER_CHEAPEST, requestOverrides)
}
function fixtureB(requestOverrides?: Partial<RouteRequest>): Scenario {
  return approvedScenario(OPENCODE_CHEAPEST, requestOverrides)
}

function asLaunchable(result: PiEntryResult): PiEntryPackage {
  assert.equal(result.status, 'launchable')
  if (result.status !== 'launchable') throw new Error('unreachable')
  return result.package
}

function asUnavailable(result: PiEntryResult): RouteUnavailableOutcome {
  assert.equal(result.status, 'route-unavailable')
  if (result.status !== 'route-unavailable') throw new Error('unreachable')
  return result.outcome
}

function refusalNames(entries: readonly RefusalEntry[]): string[] {
  return entries.map((entry) => entry.name)
}

/** Narrowing helper for fixture-precondition expectations (lockstep at 7+ call sites). */
function must<T>(value: T | null | undefined, label: string): T {
  if (value === null || value === undefined) throw new Error(`fixture precondition: ${label}`)
  return value
}

function expectPiEntryError(fn: () => unknown, code: string, naming: string): void {
  try {
    fn()
  } catch (err) {
    assert.ok(err instanceof PiEntryError, `expected PiEntryError, got ${String(err)}`)
    assert.equal(err.code, code)
    assert.ok(
      err.message.includes(naming),
      `expected error message to name '${naming}'; got: ${err.message}`,
    )
    return
  }
  assert.fail(`expected PiEntryError('${code}') naming '${naming}'`)
}

// ─── C1 wiring controls ──────────────────────────────────────────────────────

test('C1 wiring: declared-evidence policy + fixture decision + host snapshot yields a launchable package with a signed approved receipt and a sessionRequest naming the approved identity and receipt id', () => {
  const f = fixtureA()
  const entry = asLaunchable(preparePiEntry(f.input, FIXED_OPTIONS))
  assert.equal(entry.receipt.status, 'approved')
  assert.equal(typeof entry.receipt.signature, 'string')
  assert.ok(entry.receipt.signature.length > 0)
  assert.equal(entry.verdicts.launch?.ok, true)
  const request = must(entry.sessionRequest, 'session request')
  assert.equal(request.route_receipt_id, entry.receipt.receipt_id)
  assert.equal(request.lane, 'L5')
  assert.equal(request.registry_key, f.contract?.registry_key)
  assert.equal(request.host_model_id, f.contract?.opencode_id)
  assert.equal(request.provider_local_id, f.contract?.provider_local_id)
  assert.equal(request.protocol, f.contract?.protocol)
  assert.equal(entry.parcel.text, f.input.parcel.text)
  assert.equal(entry.parcel.sha256, sha256Text(f.input.parcel.text))
})

test('C1 determinism: same inputs and a fixed clock produce identical packages', () => {
  const first = preparePiEntry(fixtureA().input, FIXED_OPTIONS)
  const second = preparePiEntry(fixtureA().input, FIXED_OPTIONS)
  assert.deepEqual(first, second)
})

test('C1 stop receipt: an unset lane pin returns route-unavailable carrying the resolver stop names (L1_PINNED_PROVIDER_UNSET)', () => {
  // The lane pin is an unfabricated residual in the shipped lane_map — the
  // fixture keeps it unset so the resolver stops fail-closed (synthetic
  // negative control — not a merit claim).
  const f = scenario(OPENROUTER_CHEAPEST, {
    lane: 'L1',
    routing_class: 'architecture/risk',
  })
  const outcome = asUnavailable(preparePiEntry(f.input, FIXED_OPTIONS))
  assert.equal(outcome.code, 'ROUTE_UNAVAILABLE')
  assert.equal(outcome.hold, 'parcel-held')
  assert.ok(refusalNames(outcome.refusals).includes('L1_PINNED_PROVIDER_UNSET'))
  assert.ok(outcome.reason.length > 0)
})

test('C1 boundary: a clock-injected stale receipt returns route-unavailable carrying FRESHNESS_STALE_REFUSED', () => {
  const f = fixtureA()
  const steps: readonly string[] = [FIXED_NOW, FIXED_NOW, '2026-09-26T12:02:00.000Z']
  let call = 0
  const outcome = asUnavailable(
    preparePiEntry(f.input, {
      now: () => steps[Math.min(call++, steps.length - 1)] ?? FIXED_NOW,
    }),
  )
  assert.ok(refusalNames(outcome.refusals).includes('FRESHNESS_STALE_REFUSED'))
})

test('C1 boundary: a tampered receipt document refuses DIGEST_MISMATCH_REFUSED at the transition seam (useDeclaredFallback document seam)', () => {
  const f = fixtureA()
  const entry = asLaunchable(preparePiEntry(f.input, FIXED_OPTIONS))
  const route = entry.receipt.route
  assert.notEqual(route, null)
  if (route === null) throw new Error('unreachable')
  const tampered: PiEntryPackage = {
    ...entry,
    receipt: {
      ...entry.receipt,
      route: { ...route, primary: { binding_id: 'swapped', model: 'swapped' } },
    },
  }
  const plan = must(entry.receipt.fallback_handoff, 'declared fallback plan')
  const outcome = asUnavailable(
    useDeclaredFallback(
      tampered,
      { kind: 'primary-degraded', binding_id: plan.primary, observed: 'synthetic-degradation' },
      FIXED_OPTIONS,
    ),
  )
  assert.ok(refusalNames(outcome.refusals).includes('DIGEST_MISMATCH_REFUSED'))
})

test('C1 boundary: a valid receipt for a different lane refuses RECEIPT_LANE_MISMATCH_REFUSED at the transition seam', () => {
  const f = fixtureA()
  const entry = asLaunchable(preparePiEntry(f.input, FIXED_OPTIONS))
  // A correctly signed receipt from a different lane (re-signed with the
  // consumed signer — the launch-boundary suite's own tamper pattern).
  const foreignLane = signReceipt({ ...entry.receipt, lane: 'L4' })
  const spliced: PiEntryPackage = { ...entry, receipt: foreignLane }
  const plan = must(entry.receipt.fallback_handoff, 'declared fallback plan')
  const outcome = asUnavailable(
    useDeclaredFallback(
      spliced,
      { kind: 'primary-degraded', binding_id: plan.primary, observed: 'synthetic-degradation' },
      FIXED_OPTIONS,
    ),
  )
  assert.ok(refusalNames(outcome.refusals).includes('RECEIPT_LANE_MISMATCH_REFUSED'))
})

// ─── C1.4 policy binding controls ────────────────────────────────────────────

test('policy binding: policy-bytes digest mismatch throws POLICY_DIGEST_MISMATCH naming the bound digest', () => {
  const f = fixtureA()
  const bad: PiEntryInput = { ...f.input, policyText: `${f.policyText}\n# tampered\n` }
  expectPiEntryError(
    () => preparePiEntry(bad, FIXED_OPTIONS),
    'POLICY_DIGEST_MISMATCH',
    f.decision.policy_digest.content_digest,
  )
})

test('policy binding: policy_digest.version off the pinned ref throws POLICY_DIGEST_MISMATCH (A1.2)', () => {
  // F-3: pin the literal — drift of POLICY_REF_PIN away from MRC-05's
  // POLICY_PLUGIN_PATH value must turn this suite red, not ride the fixture.
  assert.equal(POLICY_REF_PIN, 'routing-policy/routing-policy.yaml')
  const f = fixtureA()
  const bad: PiEntryInput = {
    ...f.input,
    decision: {
      ...f.decision,
      policy_digest: { ...f.decision.policy_digest, version: 'some/other-policy.yaml' },
    },
  }
  expectPiEntryError(
    () => preparePiEntry(bad, FIXED_OPTIONS),
    'POLICY_DIGEST_MISMATCH',
    POLICY_REF_PIN,
  )
})

test('policy binding: malformed YAML throws POLICY_INVALID', () => {
  const f = fixtureA()
  const policyText = 'candidates: [unclosed'
  const bad: PiEntryInput = {
    ...f.input,
    policyText,
    decision: {
      ...f.decision,
      policy_digest: { version: POLICY_REF_PIN, content_digest: sha256Text(policyText) },
    },
  }
  expectPiEntryError(() => preparePiEntry(bad, FIXED_OPTIONS), 'POLICY_INVALID', 'parse')
})

test('policy binding: a structurally invalid policy throws POLICY_INVALID', () => {
  const f = fixtureA()
  // Synthetic negative control — not a merit claim: a lane route declared for
  // the disabled L6 lane is refused by validatePolicy.
  const policyText = stringify({
    ...f.policy,
    lane_routes: [
      {
        lane: 'L6',
        provider: 'opencode',
        primary: { type: 'binding', ref: 'opencode/gpt-6-astra' },
        fallback: { type: 'binding', ref: 'opencode/claude-opus-5-5' },
        comparability: { state: 'unproven', residual: 'FALLBACK_SUITABILITY_UNPROVEN' },
      },
    ],
  })
  const bad: PiEntryInput = {
    ...f.input,
    policyText,
    decision: {
      ...f.decision,
      policy_digest: { version: POLICY_REF_PIN, content_digest: sha256Text(policyText) },
    },
  }
  expectPiEntryError(() => preparePiEntry(bad, FIXED_OPTIONS), 'POLICY_INVALID', 'validatePolicy')
})

// ─── C1.5 requirement-consistency controls ───────────────────────────────────

test('requirements: required_inputs mismatch throws REQUIREMENT_MISMATCH naming the field', () => {
  const f = fixtureA({ required_inputs: ['text'] })
  const bad: PiEntryInput = {
    ...f.input,
    routeRequest: { ...f.request, required_inputs: ['image'] },
  }
  expectPiEntryError(
    () => preparePiEntry(bad, FIXED_OPTIONS),
    'REQUIREMENT_MISMATCH',
    'required_inputs',
  )
})

test('requirements: a canonical-order violation refuses (REQUIREMENT_MISMATCH naming required_inputs)', () => {
  const f = fixtureA({ required_inputs: ['text', 'image'] })
  const bad: PiEntryInput = {
    ...f.input,
    routeRequest: { ...f.request, required_inputs: ['image', 'text'] },
  }
  expectPiEntryError(
    () => preparePiEntry(bad, FIXED_OPTIONS),
    'REQUIREMENT_MISMATCH',
    'required_inputs',
  )
})

test('requirements: required_thinking_level mismatch throws REQUIREMENT_MISMATCH naming the field', () => {
  const f = fixtureA({ required_thinking_level: 'low' })
  const bad: PiEntryInput = {
    ...f.input,
    routeRequest: { ...f.request, required_thinking_level: 'high' },
  }
  expectPiEntryError(
    () => preparePiEntry(bad, FIXED_OPTIONS),
    'REQUIREMENT_MISMATCH',
    'required_thinking_level',
  )
})

test('requirements: expertise mismatch throws REQUIREMENT_MISMATCH naming the field', () => {
  const f = fixtureA({ expertise: 'engineering' })
  const bad: PiEntryInput = { ...f.input, routeRequest: { ...f.request, expertise: 'security' } }
  expectPiEntryError(() => preparePiEntry(bad, FIXED_OPTIONS), 'REQUIREMENT_MISMATCH', 'expertise')
})

test('requirements: absent<->absent passes (the shared D8 default is never re-derived here)', () => {
  const f = fixtureA()
  const entry = asLaunchable(preparePiEntry(f.input, FIXED_OPTIONS))
  assert.equal(entry.sessionRequest?.thinking_level.source, 'class-default')
})

test('requirements: a below-bound floor refuses; equal and above pass (upward-only)', () => {
  const f = fixtureA()
  const withFloor = (context: number, output: number): PiEntryInput => ({
    ...f.input,
    routeRequest: {
      ...f.request,
      required_context_tokens: context,
      required_output_tokens: output,
    },
    decision: {
      ...f.decision,
      derived_context_floor: { required_context_tokens: 50_000, required_output_tokens: 1_000 },
    },
  })
  expectPiEntryError(
    () => preparePiEntry(withFloor(49_999, 1_000), FIXED_OPTIONS),
    'REQUIREMENT_MISMATCH',
    'required_context_tokens',
  )
  asLaunchable(preparePiEntry(withFloor(50_000, 1_000), FIXED_OPTIONS))
  asLaunchable(preparePiEntry(withFloor(90_000, 5_000), FIXED_OPTIONS))
})

test('requirements: a below-bound output floor refuses; a null bound accepts the caller value', () => {
  const f = fixtureA()
  const withFloor = (output: number): PiEntryInput => ({
    ...f.input,
    routeRequest: { ...f.request, required_output_tokens: output },
    decision: {
      ...f.decision,
      derived_context_floor: { required_context_tokens: null, required_output_tokens: 2_000 },
    },
  })
  expectPiEntryError(
    () => preparePiEntry(withFloor(1_999), FIXED_OPTIONS),
    'REQUIREMENT_MISMATCH',
    'required_output_tokens',
  )
  // Null-bound floor accepts the caller's value (C3.4; unknown never imputed).
  asLaunchable(
    preparePiEntry(
      {
        ...f.input,
        decision: {
          ...f.decision,
          derived_context_floor: { required_context_tokens: null, required_output_tokens: null },
        },
      },
      FIXED_OPTIONS,
    ),
  )
})

// ─── C3.4 thinking-level controls ────────────────────────────────────────────

test('C3.4 thinking level: a bound level is carried with source decision-resolved', () => {
  const f = fixtureA({ required_thinking_level: 'high' })
  const entry = asLaunchable(preparePiEntry(f.input, FIXED_OPTIONS))
  assert.deepEqual(entry.sessionRequest?.thinking_level, {
    value: 'high',
    source: 'decision-resolved',
  })
})

test('C3.4 thinking level: an unbound level is carried with source class-default equal to THINKING_DEFAULT_BY_CLASS[routing_class]', () => {
  const f = fixtureA()
  const entry = asLaunchable(preparePiEntry(f.input, FIXED_OPTIONS))
  assert.deepEqual(entry.sessionRequest?.thinking_level, {
    value: THINKING_DEFAULT_BY_CLASS.boilerplate,
    source: 'class-default',
  })
  assert.ok(THINKING_LEVELS.includes(entry.sessionRequest?.thinking_level.value ?? 'off'))
})

test('C3.4 thinking level: the class default keys off effective_requirements.routing_class — a non-boilerplate class carries THINKING_DEFAULT_BY_CLASS’s own value, never a hard-coded default', () => {
  const f = fixtureA()
  // C1.5 does not compare routing_class; C3.4's formula keys off
  // effective_requirements.routing_class. 'architecture/risk' defaults to a
  // different level than 'boilerplate', so a hard-coded default turns red.
  const decision: ReplayBindings = {
    ...f.decision,
    effective_requirements: {
      ...f.decision.effective_requirements,
      routing_class: 'architecture/risk',
    },
  }
  const entry = asLaunchable(preparePiEntry({ ...f.input, decision }, FIXED_OPTIONS))
  const level = must(entry.sessionRequest, 'session request').thinking_level
  assert.deepEqual(level, {
    value: THINKING_DEFAULT_BY_CLASS['architecture/risk'],
    source: 'class-default',
  })
  assert.notEqual(level.value, THINKING_DEFAULT_BY_CLASS.boilerplate)
})

test('C3.4 thinking level: an out-of-vocabulary bound level refuses (REQUIREMENT_MISMATCH)', () => {
  const f = fixtureA()
  const bad: PiEntryInput = {
    ...f.input,
    routeRequest: {
      ...f.request,
      required_thinking_level: 'ultra' as RouteRequest['required_thinking_level'],
    },
    decision: {
      ...f.decision,
      effective_requirements: {
        ...f.decision.effective_requirements,
        required_thinking_level: 'ultra',
      },
    },
  }
  expectPiEntryError(
    () => preparePiEntry(bad, FIXED_OPTIONS),
    'REQUIREMENT_MISMATCH',
    'THINKING_LEVELS',
  )
})

// ─── C2 config controls ──────────────────────────────────────────────────────

test('C2 config: a conforming snapshot passes all three read-only checks', () => {
  const f = fixtureA()
  const entry = asLaunchable(preparePiEntry(f.input, FIXED_OPTIONS))
  assert.deepEqual(entry.verdicts.host_config, {
    provider_registration: 'passed',
    endpoint_conformance: 'passed',
    model_enablement: 'passed',
    refusals: [],
  })
})

test('C2 config: an unregistered provider refuses HOST_PROVIDER_UNREGISTERED_REFUSED (terminal)', () => {
  const f = fixtureA()
  const bad: PiEntryInput = {
    ...f.input,
    hostSettings: hostSettingsFor(
      [],
      [{ providerKey: 'opencode', baseUrl: 'https://opencode.ai/zen/go/v1' }],
    ),
  }
  const result = preparePiEntry(bad, FIXED_OPTIONS)
  const outcome = asUnavailable(result)
  assert.ok(refusalNames(outcome.refusals).includes('HOST_PROVIDER_UNREGISTERED_REFUSED'))
  // F-1 verdict-pair evidence: with no provider registration there is no
  // baseUrl comparison to run — endpoint_conformance stays 'not-applicable',
  // never 'passed' (HostConfigVerdict's own invariant), and the pair is what
  // reaches the durable pi-entry-record.
  assert.equal(result.package.verdicts.host_config?.provider_registration, 'refused')
  assert.equal(result.package.verdicts.host_config?.endpoint_conformance, 'not-applicable')
})

test('C2 config: a divergent OpenRouter baseUrl refuses HOST_ENDPOINT_DIVERGENT_REFUSED (terminal)', () => {
  const f = fixtureA()
  const route = f.receipt.route
  assert.notEqual(route, null)
  if (route === null) throw new Error('unreachable')
  const bad: PiEntryInput = {
    ...f.input,
    hostSettings: hostSettingsFor(
      [{ provider: route.provider, model: route.primary.model }],
      [
        { providerKey: 'opencode', baseUrl: 'https://opencode.ai/zen/go/v1' },
        { providerKey: 'openrouter', baseUrl: 'https://evil.example/api/v1' },
      ],
    ),
  }
  const outcome = asUnavailable(preparePiEntry(bad, FIXED_OPTIONS))
  assert.ok(refusalNames(outcome.refusals).includes('HOST_ENDPOINT_DIVERGENT_REFUSED'))
})

test('C2 config: a spelling absent from enabledModels refuses HOST_MODEL_NOT_ENABLED_REFUSED (terminal)', () => {
  const f = fixtureA()
  const bad: PiEntryInput = {
    ...f.input,
    hostSettings: hostSettingsFor([{ provider: 'opencode', model: 'claude-sonnet-5' }]),
  }
  const outcome = asUnavailable(preparePiEntry(bad, FIXED_OPTIONS))
  assert.ok(refusalNames(outcome.refusals).includes('HOST_MODEL_NOT_ENABLED_REFUSED'))
})

test('C2 config: an OpenCode route makes no endpoint claim (not-applicable, never passed)', () => {
  const f = fixtureB()
  const entry = asLaunchable(preparePiEntry(f.input, FIXED_OPTIONS))
  const verdict = entry.verdicts.host_config
  assert.equal(verdict?.endpoint_conformance, 'not-applicable')
  assert.equal(verdict?.provider_registration, 'passed')
  assert.equal(verdict?.model_enablement, 'passed')
})

test("C2 parity: the enablement spelling reproduces hostSpelling's documented rule and the committed PROPOSED artifact's add values (STOP-6)", () => {
  const artifact: unknown = JSON.parse(readFileSync(proposalArtifactPath, 'utf8'))
  const addValues: string[] = []
  const collect = (node: unknown): void => {
    if (Array.isArray(node)) {
      for (const entry of node) collect(entry)
      return
    }
    if (typeof node !== 'object' || node === null) return
    const record = node as Record<string, unknown>
    if (
      record.path === 'enabledModels' &&
      record.op === 'add' &&
      typeof record.value === 'string'
    ) {
      addValues.push(record.value)
    }
    for (const value of Object.values(record)) collect(value)
  }
  collect(artifact)
  assert.ok(addValues.length > 0, 'the PROPOSED artifact must carry enabledModels add values')

  for (const f of [fixtureA(), fixtureB()]) {
    const route = f.receipt.route
    assert.notEqual(route, null)
    if (route === null) throw new Error('unreachable')
    // hostSpelling's documented rule (`${binding.provider}:${binding.model}`,
    // routing-policy/src/host-settings-proposal.ts:161-164) composed from the
    // receipt's own bound values — the entry's inline composition (A1.5).
    const spelling = `${route.provider}:${route.primary.model}`
    assert.ok(
      addValues.includes(spelling),
      `fixture spelling '${spelling}' must reproduce against the PROPOSED artifact's add values`,
    )
    // A lookup spelling is never the registry key alone.
    assert.notEqual(spelling, f.contract?.registry_key)
  }
})

test('C2 never writes: the module source contains no host path literal and no settings-write target (ruling D)', () => {
  const source = readFileSync(modulePath, 'utf8')
  for (const hostPath of [
    '~/.pi',
    '.pi/',
    'settings.json',
    'models.json',
    'models-store',
    'enabledModels.json',
  ]) {
    assert.ok(
      !source.includes(hostPath),
      `module source must not contain host path literal '${hostPath}'`,
    )
  }
  // The record write is the module's only write site: re-enabling any second
  // write (even to a non-literal path) turns this control red.
  assert.equal((source.match(/writeFileSync\(/g) ?? []).length, 1)
  assert.equal((source.match(/renameSync\(/g) ?? []).length, 1)
})

// ─── C3 identity/selection controls ──────────────────────────────────────────

test('C3 bridge: per-field mismatches and null<->value divergences refuse (IDENTITY_MISMATCH_REFUSED on the bridged fields; SELECTION_MISMATCH_REFUSED carrying REPLAY_REFUSED/selected_identity on the registry-key pair per A1.1)', () => {
  const f = fixtureA()
  const selected = f.decision.selected_identity
  const cases: readonly { patch: Partial<SelectedIdentity>; expect: readonly string[] }[] = [
    {
      patch: { registry_key: 'anthropic/claude-sonnet-5' },
      expect: ['IDENTITY_MISMATCH_REFUSED', 'SELECTION_MISMATCH_REFUSED'],
    },
    { patch: { pi_host_model_id: 'claude-sonnet-5' }, expect: ['IDENTITY_MISMATCH_REFUSED'] },
    {
      patch: { provider_local_id: 'anthropic/claude-sonnet-5' },
      expect: ['IDENTITY_MISMATCH_REFUSED'],
    },
    { patch: { protocol: 'smuggled-protocol' }, expect: ['IDENTITY_MISMATCH_REFUSED'] },
    { patch: { pi_host_model_id: null }, expect: ['IDENTITY_MISMATCH_REFUSED'] },
    { patch: { provider_local_id: null }, expect: ['IDENTITY_MISMATCH_REFUSED'] },
    { patch: { protocol: null }, expect: ['IDENTITY_MISMATCH_REFUSED'] },
    {
      patch: { registry_key: null },
      expect: ['IDENTITY_MISMATCH_REFUSED', 'SELECTION_MISMATCH_REFUSED'],
    },
  ]
  for (const { patch, expect } of cases) {
    const bad: PiEntryInput = {
      ...f.input,
      decision: { ...f.decision, selected_identity: { ...selected, ...patch } },
    }
    const outcome = asUnavailable(preparePiEntry(bad, FIXED_OPTIONS))
    for (const name of expect) {
      assert.ok(
        refusalNames(outcome.refusals).includes(name),
        `patch ${JSON.stringify(patch)} must refuse ${name}; got ${refusalNames(outcome.refusals).join(', ')}`,
      )
    }
  }
})

test('C3 decision agreement: a registry_key disagreeing with the decision refuses SELECTION_MISMATCH_REFUSED carrying REPLAY_REFUSED/selected_identity detail', () => {
  const f = fixtureA()
  const bad: PiEntryInput = {
    ...f.input,
    decision: {
      ...f.decision,
      selected_identity: {
        ...f.decision.selected_identity,
        registry_key: 'anthropic/claude-sonnet-5',
      },
    },
  }
  const outcome = asUnavailable(preparePiEntry(bad, FIXED_OPTIONS))
  const selection = must(
    outcome.refusals.find((refusal) => refusal.name === 'SELECTION_MISMATCH_REFUSED'),
    'SELECTION_MISMATCH_REFUSED entry',
  )
  assert.ok(selection.detail.includes('REPLAY_REFUSED'))
  assert.ok(selection.detail.includes('selected_identity'))
})

test('C3 cross-version: pre-carry vs post-carry decision records refuse (REQUIREMENT_MISMATCH naming effective_requirements — A1.3)', () => {
  const f = fixtureA({ required_inputs: ['text'], required_thinking_level: 'minimal' })
  // Pre-carry decision record (MRC-05 C4.5's shape change) vs the post-carry
  // route request — the structural change refuses, naming effective_requirements.
  const preCarry: ReplayBindings['effective_requirements'] = {
    routing_class: f.request.routing_class,
    data_classification: f.request.data_class,
    transport_requirements: { data_collection: 'allow', zdr: false },
  }
  expectPiEntryError(
    () =>
      preparePiEntry(
        { ...f.input, decision: { ...f.decision, effective_requirements: preCarry } },
        FIXED_OPTIONS,
      ),
    'REQUIREMENT_MISMATCH',
    'effective_requirements',
  )
  // Symmetric: post-carry decision vs a legacy-omission request.
  expectPiEntryError(
    () => preparePiEntry({ ...f.input, routeRequest: requestFor() }, FIXED_OPTIONS),
    'REQUIREMENT_MISMATCH',
    'effective_requirements',
  )
})

test('C3 host id: a null host id refuses HOST_MODEL_UNBOUND_REFUSED (fail closed)', () => {
  const f = fixtureA()
  const entry = asLaunchable(preparePiEntry(f.input, FIXED_OPTIONS))
  // Synthetic negative control — not a merit claim: the transition identity's
  // registry mapping is removed from the entry's policy-document seam so the
  // fallback/cross-provider session cannot be told which host model to select.
  const mutated = structuredClone(f.policy) as RoutingPolicy & {
    candidates: Record<string, { bindings: { id: string; model: string }[] }>
  }
  for (const candidate of Object.values(mutated.candidates)) {
    for (const binding of candidate.bindings) {
      if (binding.id === 'opencode/qwen3.8-flash') binding.model = 'acme/no-registry-entry'
    }
  }
  const withUnboundTarget: PiEntryPackage = { ...entry, policyDocument: mutated }
  const outcome = asUnavailable(
    useDeclaredFallback(
      withUnboundTarget,
      {
        kind: 'cross-provider-attempt',
        binding_id: 'opencode/qwen3.8-flash',
        observed: 'synthetic',
      },
      FIXED_OPTIONS,
    ),
  )
  assert.ok(refusalNames(outcome.refusals).includes('HOST_MODEL_UNBOUND_REFUSED'))
})

test('C3 selection: verifyHostModelSelection reproduces on an exact host-id match', () => {
  const f = fixtureA()
  const entry = asLaunchable(preparePiEntry(f.input, FIXED_OPTIONS))
  const hostId = entry.sessionRequest?.host_model_id ?? ''
  assert.deepEqual(verifyHostModelSelection(entry, { host_model_id: hostId }), { status: 'match' })
})

test('C3 selection: a mismatched host id refuses HOST_MODEL_MISMATCH_REFUSED', () => {
  const f = fixtureA()
  const entry = asLaunchable(preparePiEntry(f.input, FIXED_OPTIONS))
  const verdict = verifyHostModelSelection(entry, { host_model_id: 'claude-sonnet-5' })
  assert.equal(verdict.status, 'refused')
  if (verdict.status !== 'refused') throw new Error('unreachable')
  assert.deepEqual(refusalNames(verdict.refusals), ['HOST_MODEL_MISMATCH_REFUSED'])
})

test('C3 selection alias negatives: a registry-key-shaped or provider-local-id-shaped observed value refuses (never a host-id match)', () => {
  const f = fixtureA()
  const entry = asLaunchable(preparePiEntry(f.input, FIXED_OPTIONS))
  for (const alias of [f.contract?.registry_key ?? '', f.contract?.provider_local_id ?? '']) {
    const verdict = verifyHostModelSelection(entry, { host_model_id: alias })
    assert.equal(verdict.status, 'refused', `alias '${alias}' must never pass as a host-id match`)
    if (verdict.status !== 'refused') throw new Error('unreachable')
    assert.deepEqual(refusalNames(verdict.refusals), ['HOST_MODEL_MISMATCH_REFUSED'])
  }
})

test('C3 selection: a route-unavailable entry refuses HOST_MODEL_UNBOUND_REFUSED', () => {
  const f = scenario(OPENROUTER_CHEAPEST, { lane: 'L1', routing_class: 'architecture/risk' })
  const result = preparePiEntry(f.input, FIXED_OPTIONS)
  assert.equal(result.status, 'route-unavailable')
  const verdict = verifyHostModelSelection(result.package, { host_model_id: 'anything' })
  assert.equal(verdict.status, 'refused')
  if (verdict.status !== 'refused') throw new Error('unreachable')
  assert.deepEqual(refusalNames(verdict.refusals), ['HOST_MODEL_UNBOUND_REFUSED'])
})

// ─── C4 fallback controls ────────────────────────────────────────────────────

test('C4 fallback: primary-degraded on the declared primary re-emits the fallback sessionRequest with C2/C3 re-validated and a route-to-declared-fallback handoff record', () => {
  const f = fixtureA()
  const entry = asLaunchable(preparePiEntry(f.input, FIXED_OPTIONS))
  const plan = must(entry.receipt.fallback_handoff, 'declared fallback plan')
  const result = useDeclaredFallback(
    entry,
    { kind: 'primary-degraded', binding_id: plan.primary, observed: 'synthetic-degradation' },
    FIXED_OPTIONS,
  )
  const fallbackEntry = asLaunchable(result)
  const record = fallbackEntry.fallbackHandoff as FallbackHandoffRecord
  assert.equal(record.action, 'route-to-declared-fallback')
  assert.equal(record.continuation, 'not-applicable')
  assert.equal(record.kind, 'pi-fallback-handoff-record')
  assert.notEqual(f.fallbackContract, null)
  const request = fallbackEntry.sessionRequest
  assert.equal(request?.registry_key, f.fallbackContract?.registry_key)
  assert.equal(request?.host_model_id, f.fallbackContract?.opencode_id)
  assert.equal(request?.route_receipt_id, entry.receipt.receipt_id)
  // C2 re-validated against the fallback identity.
  assert.equal(fallbackEntry.verdicts.host_config?.model_enablement, 'passed')
  // A1.4: the decision's resolved thinking level governs the fallback session too.
  assert.deepEqual(request?.thinking_level, entry.sessionRequest?.thinking_level)
})

test('C4 fallback carry-over (F-4): the C2 re-validation is load-bearing — a carried-over verdict cannot flip model_enablement', () => {
  const f = fixtureA()
  const route = must(f.receipt.route, 'approved route')
  // Entry host state enables the PRIMARY spelling only: the pre-fallback
  // verdict is model_enablement 'passed' while the post-revalidation verdict
  // must be 'refused'. The pair differs, so verdict carry-over (deleting the
  // C2 re-run) turns this control red.
  const entry = asLaunchable(
    preparePiEntry(
      {
        ...f.input,
        hostSettings: hostSettingsFor([{ provider: route.provider, model: route.primary.model }]),
      },
      FIXED_OPTIONS,
    ),
  )
  assert.equal(entry.verdicts.host_config?.model_enablement, 'passed')
  const plan = must(entry.receipt.fallback_handoff, 'declared fallback plan')
  const result = useDeclaredFallback(
    entry,
    { kind: 'primary-degraded', binding_id: plan.primary, observed: 'synthetic-degradation' },
    FIXED_OPTIONS,
  )
  const outcome = asUnavailable(result)
  assert.ok(refusalNames(outcome.refusals).includes('HOST_MODEL_NOT_ENABLED_REFUSED'))
  const post = must(result.package.verdicts.host_config, 'post-revalidation host verdict')
  assert.equal(post.model_enablement, 'refused')
  assert.notEqual(post.model_enablement, entry.verdicts.host_config?.model_enablement)
})

test('C4 fallback: an out-of-pair binding_id throws UNDECLARED_FALLBACK_REFUSED (nothing authorized)', () => {
  const f = fixtureA()
  const entry = asLaunchable(preparePiEntry(f.input, FIXED_OPTIONS))
  const plan = must(entry.receipt.fallback_handoff, 'declared fallback plan')
  expectPiEntryError(
    () =>
      useDeclaredFallback(
        entry,
        { kind: 'fallback-failed', binding_id: plan.primary, observed: 'synthetic' },
        FIXED_OPTIONS,
      ),
    'UNDECLARED_FALLBACK_REFUSED',
    'declared pair',
  )
})

test('C4 fallback: a synthetic third model throws UNDECLARED_FALLBACK_REFUSED', () => {
  const f = fixtureA()
  const entry = asLaunchable(preparePiEntry(f.input, FIXED_OPTIONS))
  expectPiEntryError(
    () =>
      useDeclaredFallback(
        entry,
        {
          kind: 'primary-degraded',
          binding_id: 'openrouter/acme/third-model',
          observed: 'synthetic',
        },
        FIXED_OPTIONS,
      ),
    'UNDECLARED_FALLBACK_REFUSED',
    'declared pair',
  )
})

test('C4 fallback: fallback-failed is the typed terminal (FALLBACK_EXHAUSTED_REFUSED; stop-and-report)', () => {
  const f = fixtureA()
  const entry = asLaunchable(preparePiEntry(f.input, FIXED_OPTIONS))
  const plan = must(entry.receipt.fallback_handoff, 'declared fallback plan')
  const outcome = asUnavailable(
    useDeclaredFallback(
      entry,
      { kind: 'fallback-failed', binding_id: plan.fallback, observed: 'synthetic-failure' },
      FIXED_OPTIONS,
    ),
  )
  assert.equal(outcome.code, 'ROUTE_UNAVAILABLE')
  assert.equal(outcome.hold, 'parcel-held')
  assert.ok(refusalNames(outcome.refusals).includes('FALLBACK_EXHAUSTED_REFUSED'))
  assert.ok(outcome.reason.includes('stop'))
})

test('C4 fallback: cross-provider-attempt is a new recorded attempt preserving continuation refused-mid-turn', () => {
  const f = fixtureA()
  const entry = asLaunchable(preparePiEntry(f.input, FIXED_OPTIONS))
  const result = useDeclaredFallback(
    entry,
    {
      kind: 'cross-provider-attempt',
      binding_id: 'opencode/qwen3.8-flash',
      observed: 'synthetic-cross-provider',
    },
    FIXED_OPTIONS,
  )
  const attempt = asLaunchable(result)
  const record = attempt.fallbackHandoff as FallbackHandoffRecord
  assert.equal(record.action, 'new-recorded-attempt')
  assert.equal(record.continuation, 'refused-mid-turn')
  // The new attempt re-emits a session request for the named identity (C2/C3 re-validated).
  assert.equal(attempt.sessionRequest?.registry_key, 'qwen/qwen3.8-flash')
  assert.equal(attempt.verdicts.host_config?.endpoint_conformance, 'not-applicable')
})

// ─── C6 terminal controls ────────────────────────────────────────────────────

test('C6 terminal: the outcome carries code, parcelRef, requested vs attempted identities, named refusals, an actionable reason, and hold parcel-held; it is returned, never thrown (batch semantics)', () => {
  const f = fixtureA()
  const bad: PiEntryInput = {
    ...f.input,
    hostSettings: hostSettingsFor([{ provider: 'opencode', model: 'claude-sonnet-5' }]),
  }
  let outcome: RouteUnavailableOutcome | undefined
  assert.doesNotThrow(() => {
    outcome = asUnavailable(preparePiEntry(bad, FIXED_OPTIONS))
  })
  const settled = must(outcome, 'route-unavailable outcome')
  assert.equal(settled.code, 'ROUTE_UNAVAILABLE')
  assert.equal(settled.parcelRef, f.input.parcel.ref)
  assert.deepEqual(settled.requested, {
    lane: 'L5',
    registry_key: f.contract?.registry_key,
  })
  assert.equal(settled.attempted.length, 1)
  const attempt = must(settled.attempted[0], 'attempted identity entry')
  assert.equal(attempt.identity, f.contract?.registry_key)
  assert.ok(refusalNames(attempt.refusals).includes('HOST_MODEL_NOT_ENABLED_REFUSED'))
  assert.ok(refusalNames(settled.refusals).includes('HOST_MODEL_NOT_ENABLED_REFUSED'))
  assert.ok(settled.reason.length > 0)
  assert.equal(settled.hold, 'parcel-held')
})

// ─── Static validation path (PMC D8: no provider call) ───────────────────────

test('static path: the entry module import manifest is exactly node builtins + the named seams; no provider/network/subprocess calls; no clock reads', () => {
  const source = readFileSync(modulePath, 'utf8')
  const specifiers = [...source.matchAll(/from '([^']+)'/g)].map((match) => match[1])
  assert.deepEqual([...new Set(specifiers)].sort(), [
    '../../../receipts/src/index.js',
    '../../../routing-policy/src/host-settings-proposal.js',
    '../../../routing-policy/src/index.js',
    '../../../routing-policy/src/launch-boundary.js',
    '../../../routing-policy/src/pi-resolver.js',
    '../../../routing-policy/src/route-receipt.js',
    '../../../routing-policy/src/types.js',
    'node:crypto',
    'node:fs',
    'node:path',
    'yaml',
  ])
  for (const pattern of [
    /\bfetch\b/,
    /\bchild_process\b/,
    /\bnet\b/,
    /\bhttp\b/,
    /\bhttps\b/,
    /@modelcontextprotocol/,
    /\bspawn\b/,
    /\bexec\(/,
    /\bDate\.now\b/,
    /new Date\(/,
    /\bperformance\.now\b/,
    /\beval\(/,
    /new Function\(/,
  ]) {
    assert.ok(!pattern.test(source), `module source must not match ${pattern}`)
  }
  // Injected clock only.
  assert.ok(source.includes('options.now()'))
})

// ─── Vocabulary exhaustiveness (RB-5 pattern) ────────────────────────────────

test('PI_ENTRY_REFUSALS is the closed entry-domain vocabulary: every name is pinned and no known name is missing', () => {
  assert.deepEqual([...PI_ENTRY_REFUSALS].sort(), [
    'FALLBACK_EXHAUSTED_REFUSED',
    'HOST_ENDPOINT_DIVERGENT_REFUSED',
    'HOST_MODEL_MISMATCH_REFUSED',
    'HOST_MODEL_NOT_ENABLED_REFUSED',
    'HOST_MODEL_UNBOUND_REFUSED',
    'HOST_PROVIDER_UNREGISTERED_REFUSED',
    'IDENTITY_MISMATCH_REFUSED',
    'RECORD_EXISTS_REFUSED',
    'SELECTION_MISMATCH_REFUSED',
    'UNDECLARED_FALLBACK_REFUSED',
  ])
})
