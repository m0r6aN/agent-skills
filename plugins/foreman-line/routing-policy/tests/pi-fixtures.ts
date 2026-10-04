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

export const proposalArtifactPath = join(
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
