/**
 * Shared PMC-P2 test fixtures (not a test file).
 *
 * `makeDeclaredPolicy` upgrades every binding of the SHIPPED policy to fully
 * declared evidence envelopes. It is synthetic test data for exercising the
 * resolver's selection machinery only: it claims nothing about the real world,
 * and the shipped policy's own fail-closed outcomes are asserted separately
 * against the unmodified document.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'
import type { HostSettingsSnapshot } from '../src/host-settings-proposal.js'
import type { RouteRequest } from '../src/pi-resolver.js'
import type { Evidence, LaneRoute, ModelBinding, RoutingPolicy } from '../src/types.js'

const here = dirname(fileURLToPath(import.meta.url))
const packageRoot = join(here, '..')
export const policyPath = join(packageRoot, 'routing-policy.yaml')
export const foremanRoot = join(packageRoot, '..')

export const FIXED_ISSUED_AT = '2026-09-26T12:00:00.000Z'

export function loadShippedPolicy(): RoutingPolicy {
  return parse(readFileSync(policyPath, 'utf8')) as RoutingPolicy
}

export function loadSettingsProjection(): HostSettingsSnapshot {
  const path = join(
    foremanRoot,
    'docs',
    'goals',
    'routing-currency-and-merit',
    'host-owner-export',
    'settings-projection.json',
  )
  return parse(readFileSync(path, 'utf8')) as HostSettingsSnapshot
}

/**
 * The CURRENT host-settings proposal artifact.
 *
 * Amendment 06 re-minted this as a new dated artifact rather than regenerating
 * `...-PROPOSED-2026-09-26.json` in place. That file is a dated goal record of
 * what was proposed on that date; rewriting it would make a 2026-09-26 record
 * assert a binding set that did not exist until 2026-10-07. Both files are
 * kept: the old one as history (byte-untouched), this one as the live artifact.
 *
 * The generator is unchanged — the artifact grew because the contract gained
 * the first-party `anthropic` and open-weight `fireworks` bindings.
 *
 * Amendment 07 (same-day, 2026-10-07) regenerated this artifact in place: the
 * three new `opencode` enablement adds (gpt-6.1-sol, claude-sonnet-5-5,
 * gpt-6-luna) exist as of the artifact's own date, so no new dated file is
 * minted and no dated record is falsified.
 */
export const proposalArtifactPath = join(
  foremanRoot,
  'docs',
  'goals',
  'pi-model-configuration',
  'pmc-p2-pi-host-settings-PROPOSED-2026-10-07.json',
)

/** The superseded 2026-09-26 proposal, retained as an unedited dated record. */
export const proposalArtifactPathHistorical2026_09_26 = join(
  foremanRoot,
  'docs',
  'goals',
  'pi-model-configuration',
  'pmc-p2-pi-host-settings-PROPOSED-2026-09-26.json',
)

const FIXTURE_COSTS: Readonly<Record<string, { readonly input: number; readonly output: number }>> =
  {
    'opencode/qwen3.8-flash': { input: 0.1, output: 0.3 },
    'opencode/glm-5.3-flash': { input: 0.15, output: 0.5 },
    'openrouter/google/gemini-3.8-flash': { input: 0.75, output: 3.75 },
    'openrouter/anthropic/claude-haiku-4.5': { input: 1, output: 5 },
  }

const DEFAULT_FIXTURE_COST = { input: 2, output: 10 }

function declaredBinding(binding: ModelBinding): ModelBinding {
  const cost = FIXTURE_COSTS[binding.id] ?? DEFAULT_FIXTURE_COST
  return {
    ...binding,
    identity: { state: 'resolved', source: 'synthetic-test-fixture' },
    endpoint: {
      registered: binding.endpoint.registered,
      catalogue: binding.endpoint.registered,
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
    // RCM schema v0.4 capability predicates: fully declared for synthetic
    // fixtures (negative controls override per test via `withBinding`).
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
}

export function makeDeclaredPolicy(): RoutingPolicy {
  const policy = structuredClone(loadShippedPolicy()) as RoutingPolicy & {
    candidates: Record<string, { bindings: ModelBinding[] }>
  }
  for (const candidate of Object.values(policy.candidates)) {
    candidate.bindings = candidate.bindings.map(declaredBinding)
  }
  return policy
}

const BASE_REQUEST: RouteRequest = {
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

export function makeRequest(overrides?: Partial<RouteRequest>): RouteRequest {
  return { ...BASE_REQUEST, ...overrides }
}

/** Typed mutation seam for negative controls (deliberate contract violation). */
export function withBinding(
  policy: RoutingPolicy,
  bindingId: string,
  patch: (binding: ModelBinding) => ModelBinding,
): RoutingPolicy {
  const clone = structuredClone(policy) as RoutingPolicy & {
    candidates: Record<string, { bindings: ModelBinding[] }>
  }
  for (const candidate of Object.values(clone.candidates)) {
    candidate.bindings = candidate.bindings.map((binding) =>
      binding.id === bindingId ? patch(binding) : binding,
    )
  }
  return clone
}

/** Typed lane-map mutation seam for negative controls (deliberate violation). */
export function withLane(
  policy: RoutingPolicy,
  laneId: string,
  patch: Record<string, unknown>,
): RoutingPolicy {
  const clone = structuredClone(policy) as RoutingPolicy & {
    lane_map: Record<string, Record<string, unknown>>
  }
  clone.lane_map[laneId] = { ...clone.lane_map[laneId], ...patch }
  return clone
}

/** Typed lane-route mutation seam for negative controls (deliberate violation). */
export function withLaneRoute(
  policy: RoutingPolicy,
  laneId: string,
  provider: string,
  patch: (route: LaneRoute) => LaneRoute,
): RoutingPolicy {
  const clone = structuredClone(policy) as RoutingPolicy & { lane_routes: LaneRoute[] }
  clone.lane_routes = clone.lane_routes.map((route) =>
    route.lane === laneId && route.provider === provider ? patch(route) : route,
  )
  return clone
}

/** Replaces every lane route's comparability envelope (deliberate violation). */
export function withComparability(
  policy: RoutingPolicy,
  comparability: Evidence<string>,
): RoutingPolicy {
  const clone = structuredClone(policy) as RoutingPolicy & { lane_routes: LaneRoute[] }
  clone.lane_routes = clone.lane_routes.map((route) => ({ ...route, comparability }))
  return clone
}

/**
 * Every binding the L5 (economy / boilerplate) lane can select — primary and
 * declared fallback of each L5 `lane_routes` entry.
 *
 * Centralized deliberately. Four negative controls in `rcm-predicates.test.ts`
 * each used to inline this list, so adding the Amendment 06 `fireworks` L5
 * route silently left a selectable, fully-declared binding standing in all
 * four. Each then approved instead of refusing — the controls did not fail
 * loudly, they stopped testing what they claimed to test.
 *
 * KEEP IN SYNC with `routing-policy.yaml` `lane_routes` for L5: any new L5
 * route must add its two bindings here, or the controls weaken again.
 */
export const L5_SELECTABLE_BINDINGS: readonly string[] = [
  'opencode/qwen3.8-flash',
  'opencode/glm-5.3-flash',
  'openrouter/google/gemini-3.8-flash',
  'openrouter/anthropic/claude-haiku-4.5',
  'opencode-go/qwen3.8-flash',
  'opencode-go/glm-5.3-flash',
  'fireworks/accounts/fireworks/models/nemotron-lightning-3p5-30b-a3b',
  'fireworks/accounts/fireworks/models/glm-5p3-flash',
]

/**
 * The PRIMARY-role binding of each L5 `lane_routes` entry.
 *
 * Separate from `L5_SELECTABLE_BINDINGS` on purpose. The F1/F2 modality
 * controls assert "when no vision-capable PRIMARY-role binding remains, the
 * route stops" and rely on fallback-role bindings never competing. Neutralizing
 * fallbacks too would still pass, but it would stop proving that — so these
 * controls patch primaries only.
 *
 * KEEP IN SYNC with `routing-policy.yaml` `lane_routes` for L5.
 */
export const L5_PRIMARY_BINDINGS: readonly string[] = [
  'opencode/qwen3.8-flash',
  'openrouter/google/gemini-3.8-flash',
  'opencode-go/qwen3.8-flash',
  'fireworks/accounts/fireworks/models/nemotron-lightning-3p5-30b-a3b',
]
