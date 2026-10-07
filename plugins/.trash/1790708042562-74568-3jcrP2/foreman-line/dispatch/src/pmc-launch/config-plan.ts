import {
  type CatalogEligibilityResult,
  evaluateCatalogEligibility,
} from '../../../routing-policy/src/catalog-eligibility-adapter.js'
import type { EligibilityFacts } from '../../../routing-policy/src/eligibility.js'
import {
  type ProviderBindingProjectionResult,
  projectProviderBindingsV1,
} from '../../../routing-policy/src/provider-binding-projection.js'

const levels = ['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'] as const
type Level = (typeof levels)[number]
type ThinkingMap = Readonly<Record<Level, string | null>>
const missingClaims = Object.freeze([
  'ORIGIN_AUTHORITY',
  'ACCEPTED_RUNTIME',
  'ENDPOINT_TARIFF_BOUND',
  'LIVE_AVAILABILITY',
  'LANE_QUALITY',
  'PRIVACY_AUTHORITY',
  'BUDGET_AUTHORITY',
  'CONFIG_APPLY_AUTHORITY',
] as const)
export type ConfigurationEntryV1 = Readonly<{
  bindingId: string
  provider: string
  providerModelId: string
  piHostModelId: string
  identityState: 'absent' | 'ambiguous' | 'refused' | 'facts'
  sourceFacts: EligibilityFacts | null
  thinkingLevelMap: ThinkingMap
  enabled: false
}>
export type PmcPiConfigurationPlanV1 = Readonly<{
  version: 'pmc-config-plan/v1'
  evidenceOnly: true
  applyAllowed: false
  policyResult: ProviderBindingProjectionResult
  catalogResult: CatalogEligibilityResult
  entries: readonly ConfigurationEntryV1[]
  missingClaims: typeof missingClaims
  applyPatch: readonly []
  rollbackPatch: readonly []
}>

function thinkingMap(facts: EligibilityFacts | null): ThinkingMap {
  const empty = {
    off: null,
    minimal: null,
    low: null,
    medium: null,
    high: null,
    xhigh: null,
    max: null,
  }
  const map: Record<Level, string | null> = { ...empty }
  if (facts?.thinkingLevels.status === 'declared') {
    const seen = new Set<string>()
    for (const item of facts.thinkingLevels.levels) {
      if (!levels.some((level) => level === item.level)) continue
      if (seen.has(item.level)) return Object.freeze(empty)
      seen.add(item.level)
      if (item.level !== 'off') map[item.level as Level] = item.providerValue
    }
  }
  return Object.freeze(map)
}

/** Disabled evidence only. Each owner captures and validates its own input. */
export function planPmcPiConfigurationV1(
  policy: unknown,
  catalog: unknown,
): PmcPiConfigurationPlanV1 {
  const policyResult = projectProviderBindingsV1(policy)
  const catalogResult = evaluateCatalogEligibility(catalog)
  const entries: ConfigurationEntryV1[] = []
  if (policyResult.ok && catalogResult.stage === 'projector' && catalogResult.result.ok) {
    const rows = catalogResult.result.results
    for (const binding of policyResult.projection.policy.bindings) {
      const matches = rows.filter(
        (row) =>
          row.requested.provider === binding.provider &&
          row.requested.id === binding.providerModelId,
      )
      const row = matches.length === 1 ? matches[0] : undefined
      const identityState =
        matches.length === 0
          ? 'absent'
          : matches.length > 1
            ? 'ambiguous'
            : row?.outcome === 'facts'
              ? 'facts'
              : 'refused'
      const sourceFacts = identityState === 'facts' && row?.outcome === 'facts' ? row.facts : null
      entries.push(
        Object.freeze({
          bindingId: binding.bindingId,
          provider: binding.provider,
          providerModelId: binding.providerModelId,
          piHostModelId: binding.piHostModelId,
          identityState,
          sourceFacts,
          thinkingLevelMap: thinkingMap(sourceFacts),
          enabled: false,
        }),
      )
    }
  }
  return Object.freeze({
    version: 'pmc-config-plan/v1',
    evidenceOnly: true,
    applyAllowed: false,
    policyResult,
    catalogResult,
    entries: Object.freeze(entries),
    missingClaims,
    applyPatch: Object.freeze([] as const),
    rollbackPatch: Object.freeze([] as const),
  })
}
