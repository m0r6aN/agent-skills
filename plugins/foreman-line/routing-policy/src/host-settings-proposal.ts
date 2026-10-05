/**
 * PMC-P2 — Pi host-settings projection, PROPOSED ONLY (charter M4, D2, D3; M3).
 *
 * Foreman NEVER writes Pi's host-owned settings file. This module is a pure
 * generator: it consumes the ratified routing policy and the
 * credential-free `settings-projection.json` snapshot and produces a
 * reviewable, one-way PROPOSED change set with per-field mapping provenance
 * (D9-style: every proposed field maps to a named source). The owner applies
 * any change to the host by hand; nothing here reads or writes `~/.pi`.
 *
 * Scope of the proposal:
 * - provider registrations stay exactly OpenCode and OpenRouter at their
 *   charter-baseline endpoints (D2); the `pi-openrouter.ts` contract const is
 *   the OpenRouter registration value (SCF-3 comparator).
 * - `enabledModels` moves to the charter-matrix binding set (M4 enablement).
 *   Removals are proposed only where a ratified clause authorizes them (M2
 *   strikes `typesafe/jev-1.13` — the one removal here); every other currently
 *   enabled entry is retained with the missing authorization stated, and its
 *   removal is left to an explicit owner decision (review A F8: M4 assigns
 *   enablement only, and the M3-kept default model must stay enabled).
 * - per-model OpenRouter provider-routing overrides
 *   (`allow_fallbacks`, `data_collection`, `zdr`) derived from the Foreman data
 *   classification (charter D3 + matrix note) at the strictest tier each
 *   binding serves.
 * - interactive defaults are unchanged (M3 is a documentation correction only).
 * - SCF-1/2/3 endpoint divergences are recorded and left unresolved: any
 *   host-side correction is a human act outside Foreman (RCM D13 — no aliasing,
 *   no path normalization), and the resolver refuses divergent bindings
 *   (`ENDPOINT_DIVERGENCE_REFUSED`) until an owner resolves them.
 *
 * Every provenance `source` resolves from the `plugins/foreman-line` root
 * (review A F9: dangling citations are refused by test).
 */

import { PI_OPENROUTER_ROUTING } from './pi-openrouter.js'
import type {
  BindingEndpoint,
  DataClassificationTier,
  ModelBinding,
  RoutingPolicy,
  TransportRequirements,
} from './types.js'

export interface HostSettingsSnapshot {
  readonly defaultModel: string
  readonly defaultProvider: string
  readonly defaultThinkingLevel: string
  readonly enabledModels: readonly string[]
  readonly providers: readonly { readonly providerKey: string; readonly baseUrl: string }[]
}

/** D9-style mapping provenance: every proposed field maps to a named source. */
export interface ProvenanceRef {
  readonly source: string
  readonly locator: string
}

export interface ProposedChange {
  readonly path: string
  readonly op: 'add' | 'remove' | 'keep' | 'set'
  readonly value: unknown
  readonly reason: string
  readonly provenance: readonly ProvenanceRef[]
}

export interface EndpointDivergence {
  readonly binding: string
  readonly registered: string
  readonly catalogue: string | null
  readonly alignment: BindingEndpoint['alignment']
  readonly scf_finding: string | null
  readonly disposition: string
  readonly provenance: readonly ProvenanceRef[]
}

export interface ResidualDisposition {
  readonly slot: string
  readonly residual: string
  readonly state: 'fail-closed'
  readonly attempted_evidence: string
  readonly provenance: readonly ProvenanceRef[]
}

export interface HostSettingsProposal {
  readonly kind: 'pi-host-settings-proposal'
  readonly status: 'PROPOSED-NOT-WRITTEN'
  readonly target: {
    readonly file: string
    readonly write_policy: string
  }
  readonly discipline: string
  readonly changes: readonly ProposedChange[]
  readonly endpoint_divergences: readonly EndpointDivergence[]
  readonly residual_dispositions: readonly ResidualDisposition[]
  readonly credentials: {
    readonly policy: string
    readonly contains_credential_value: false
  }
}

const PROPOSAL_DISCIPLINE =
  'one-way projection artifact/patch (RCM charter D1/RCM-P7 discipline): Foreman never writes Pi’s shared settings.json, never reads it back for routing, and applies nothing automatically'

/** D9 provenance sources: paths resolve from the `plugins/foreman-line` root. */
const SRC = {
  charter: 'docs/goals/pi-model-configuration/charter.md',
  a54: 'docs/goals/pi-model-configuration/a54-ratification-2026-09-26.md',
  p1Record: 'docs/goals/pi-model-configuration/pmc-p1-fallback-contract-2026-09-26.md',
  settings: 'docs/goals/routing-currency-and-merit/host-owner-export/settings-projection.json',
  policy: 'routing-policy/routing-policy.yaml',
  piOpenRouter: 'routing-policy/src/pi-openrouter.ts',
} as const

/** The one enabledModels removal M2 authorizes (struck from the lane matrix). */
const M2_STRUCK_ID = 'openrouter:typesafe/jev-1.13'

const DIVERGENT_DISPOSITION =
  'unresolved divergence — no host change proposed (RCM D13: any host-side correction is a human act outside Foreman; no aliasing, no path normalization). The resolver refuses this binding at resolve time (ENDPOINT_DIVERGENCE_REFUSED) until an owner resolves the divergence'

const SCF_BY_CATALOGUE_URL: Readonly<Record<string, string>> = {
  'https://opencode.ai/zen/v1': 'SCF-1',
  'https://opencode.ai/zen': 'SCF-2',
  'https://openrouter.ai/api': 'SCF-3',
}

const RESIDUAL_SLOTS: readonly {
  readonly slot: string
  readonly residual: string
  readonly dispositionLocator: string
}[] = [
  {
    slot: 'lane_map.L1.provider_rule.pinned_provider',
    residual: 'L1_PINNED_PROVIDER_UNSET',
    dispositionLocator: 'disposition 2',
  },
  {
    slot: 'lane_map.L2.provider_rule.pinned_provider',
    residual: 'L2_PINNED_PROVIDER_UNSET',
    dispositionLocator: 'disposition 2',
  },
  {
    slot: 'lane_map.L3.provider_rule.preference',
    residual: 'L3_PROVIDER_PREFERENCE_UNSET',
    dispositionLocator: 'disposition 3',
  },
  {
    slot: 'lane_map.L4.provider_rule.preference',
    residual: 'L4_PROVIDER_PREFERENCE_UNSET',
    dispositionLocator: 'disposition 3',
  },
  {
    slot: 'lane_map.<lane>.quality_tolerance',
    residual: 'DELTA_L_UNSET',
    dispositionLocator: 'disposition 5',
  },
]

const ATTEMPTED_EVIDENCE_NOTE =
  'see pmc-p2-pi-configuration-and-route-resolver-2026-09-26.md § 5 (recorded public-catalogue metadata GET with source, fetch time, content hash): catalogue metadata cannot establish A6 live-availability, A6 model-quality, or an owner declaration — value stays fail-closed (typed unavailable)'

/** Host-enabled spelling used by the Pi settings snapshot (`provider:model`). */
function hostSpelling(binding: ModelBinding): string {
  return `${binding.provider}:${binding.model}`
}

function allBindings(policy: RoutingPolicy): readonly ModelBinding[] {
  const bindings: ModelBinding[] = []
  for (const candidate of Object.values(policy.candidates ?? {})) {
    for (const binding of candidate?.bindings ?? []) {
      // Amendment A2 (MRC-13 spec, A2.2): `selection_only: true` bindings are
      // selection identities with no host enablement target — deriving any
      // proposal change from them would touch models that have no enablement
      // surface. Absent marker = enablement-eligible, so pre-marker documents
      // behave identically (backwards compatible).
      if (binding.selection_only === true) continue
      bindings.push(binding)
    }
  }
  return bindings.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
}

function strictestTransport(
  policy: RoutingPolicy,
  dataClasses: readonly DataClassificationTier[],
): TransportRequirements {
  let data_collection: 'allow' | 'deny' = 'allow'
  let zdr = false
  for (const tier of dataClasses) {
    const requirements = policy.data_classification?.[tier]?.transport_requirements
    if (requirements === undefined) continue
    if (requirements.data_collection === 'deny') data_collection = 'deny'
    if (requirements.zdr === true) zdr = true
  }
  return { data_collection, zdr }
}

export function buildHostSettingsProposal(input: {
  readonly policy: RoutingPolicy
  readonly current: HostSettingsSnapshot
}): HostSettingsProposal {
  const { policy, current } = input
  const bindings = allBindings(policy)
  const changes: ProposedChange[] = []

  // Provider registrations (D2): exactly the two charter providers at their
  // baseline endpoints. The OpenRouter value is the pi-openrouter.ts contract
  // const — the SCF-3 comparator.
  for (const provider of current.providers) {
    const isContract =
      provider.providerKey === 'openrouter' && provider.baseUrl === PI_OPENROUTER_ROUTING.baseUrl
    changes.push({
      path: `providers['${provider.providerKey}'].baseUrl`,
      op: 'keep',
      value: provider,
      reason: isContract
        ? 'registered endpoint equals the pi-openrouter.ts contract const (SCF-3 comparator: a divergent catalogue value is refused, never normalized into this const)'
        : 'endpoint URL stays in Pi settings as registered (charter D2; baseline discovery)',
      provenance: [
        { source: SRC.charter, locator: 'D2 + "Current baseline and authority boundary"' },
        {
          source: SRC.settings,
          locator: `providers[] providerKey=${provider.providerKey}`,
        },
        ...(isContract
          ? [
              {
                source: SRC.piOpenRouter,
                locator: 'PI_OPENROUTER_ROUTING.baseUrl / piOpenRouterRoutingSchema baseUrl const',
              },
              {
                source: SRC.p1Record,
                locator:
                  '§ 4 ("SCF-1/2/3" endpoint divergences transcribed from pmc-p0-capability-baseline.md § 3) — SCF-3',
              },
            ]
          : [
              {
                source: SRC.p1Record,
                locator:
                  '§ 4 ("SCF-1/2/3" endpoint divergences transcribed from pmc-p0-capability-baseline.md § 3) — SCF-1/SCF-2',
              },
            ]),
      ],
    })
  }

  // M4 enablement: the matrix binding set in host spelling. Removals happen
  // only where a ratified clause authorizes them (review A F8): M2 strikes
  // exactly the Jev entry. M4 assigns enablement only and says nothing about
  // removals, and the M3-kept interactive default model must stay enabled — so
  // every other currently enabled entry is retained, with the missing
  // authorization stated and its removal left to an explicit owner decision.
  const matrixIds = new Map<string, ModelBinding>()
  for (const binding of bindings) matrixIds.set(hostSpelling(binding), binding)
  for (const id of [...current.enabledModels].sort()) {
    if (matrixIds.has(id)) continue
    const struck = id === M2_STRUCK_ID
    if (struck) {
      changes.push({
        path: 'enabledModels',
        op: 'remove',
        value: id,
        reason:
          'M2: the charter strikes typesafe/jev-1.13 from the lane matrix (ratified finding: enabled in Pi settings but absent from the catalogue, so it resolves to a missing-model refusal) — removed, never silently substituted',
        provenance: [
          { source: SRC.charter, locator: 'Amendment 02 M2' },
          { source: SRC.settings, locator: 'enabledModels[]' },
        ],
      })
      continue
    }
    const isKeptDefault = id === `opencode:${current.defaultModel}`
    changes.push({
      path: 'enabledModels',
      op: 'keep',
      value: id,
      reason: isKeptDefault
        ? 'retained: no ratified clause authorizes removal from enabledModels (Amendment 02 M4 assigns enablement only), and this entry is the M3-kept interactive default model — removing it would contradict M3. Removal requires an explicit owner decision'
        : 'retained: no ratified clause authorizes removal from enabledModels (Amendment 02 M4 assigns enablement only; a "stale" label is not evidence — catalogue metadata is never an availability oracle (rubric R6)). Removal requires an explicit owner decision',
      provenance: isKeptDefault
        ? [
            { source: SRC.charter, locator: 'Amendment 02 M3 + M4' },
            { source: SRC.settings, locator: 'enabledModels[] + defaultModel' },
          ]
        : [
            { source: SRC.charter, locator: 'Amendment 02 M4 (enablement only)' },
            { source: SRC.settings, locator: 'enabledModels[]' },
          ],
    })
  }
  for (const id of [...matrixIds.keys()].sort()) {
    if (current.enabledModels.includes(id)) continue
    const binding = matrixIds.get(id) as ModelBinding
    changes.push({
      path: 'enabledModels',
      op: 'add',
      value: id,
      reason:
        'M4: enable the charter-matrix binding set (identity from the ratified binding layer)',
      provenance: [
        { source: SRC.policy, locator: `candidates → binding '${binding.id}'` },
        { source: SRC.charter, locator: 'Amendment 02 M4 + Initial Pi provider and lane matrix' },
      ],
    })
  }

  // Per-model OpenRouter provider-routing overrides (charter D3 + matrix
  // note): allow_fallbacks true; data_collection/zdr derived from the Foreman
  // data classification at the strictest tier the binding serves. When the
  // binding's tier set is unknown (DATA_CLASS_UNKNOWN) the derivation fails
  // closed to the strict profile — never to a permissive one.
  for (const binding of bindings) {
    if (binding.provider !== 'openrouter') continue
    const tiersKnown = binding.data_classes.state === 'declared'
    const transport = tiersKnown
      ? strictestTransport(policy, binding.data_classes.value)
      : { data_collection: 'deny' as const, zdr: true }
    changes.push({
      path: `models['${binding.model}'].openRouterRouting`,
      op: 'set',
      value: {
        allow_fallbacks: true,
        data_collection: transport.data_collection,
        zdr: transport.zdr,
      },
      reason: tiersKnown
        ? 'provider routing controls declared per OpenRouter model (charter D3): in-provider failover only; data_collection/zdr derived from the strictest Foreman data classification the binding serves'
        : 'provider routing controls derived fail-closed to the strict profile: the binding’s data-class eligibility is DATA_CLASS_UNKNOWN',
      provenance: [
        {
          source: SRC.charter,
          locator:
            'D3 + Initial Pi provider and lane matrix ("OpenRouter models also declare provider routing")',
        },
        {
          source: SRC.policy,
          locator: `data_classification.<tiers>.transport_requirements + candidates → binding '${binding.id}'.data_classes`,
        },
      ],
    })
  }

  // Interactive defaults: unchanged (M3 is a documentation correction only).
  for (const [path, value] of [
    ['defaultProvider', current.defaultProvider],
    ['defaultModel', current.defaultModel],
    ['defaultThinkingLevel', current.defaultThinkingLevel],
  ] as const) {
    changes.push({
      path,
      op: 'keep',
      value,
      reason:
        'M3 is a documentation correction only — changing the host default is not authorized by this charter; the default confers no parcel authority (A1)',
      provenance: [
        { source: SRC.charter, locator: 'Amendment 02 M3' },
        { source: SRC.settings, locator: path },
      ],
    })
  }

  const endpointDivergences: EndpointDivergence[] = bindings
    .filter((binding) => binding.endpoint.alignment === 'divergent')
    .map((binding) => ({
      binding: binding.id,
      registered: binding.endpoint.registered,
      catalogue: binding.endpoint.catalogue,
      alignment: binding.endpoint.alignment,
      scf_finding:
        binding.endpoint.catalogue !== null
          ? (SCF_BY_CATALOGUE_URL[binding.endpoint.catalogue] ?? null)
          : null,
      disposition: DIVERGENT_DISPOSITION,
      provenance: [
        {
          source: SRC.p1Record,
          locator:
            '§ 4 ("SCF-1/2/3" endpoint divergences transcribed from pmc-p0-capability-baseline.md § 3)',
        },
        { source: SRC.policy, locator: `candidates → binding '${binding.id}'.endpoint` },
      ],
    }))

  const residualDispositions: ResidualDisposition[] = RESIDUAL_SLOTS.map((entry) => ({
    slot: entry.slot,
    residual: entry.residual,
    state: 'fail-closed',
    attempted_evidence: ATTEMPTED_EVIDENCE_NOTE,
    provenance: [
      { source: SRC.a54, locator: `${entry.dispositionLocator} — value unset, fail closed` },
      {
        source: SRC.p1Record,
        locator:
          '§ 4 "Residuals preserved — fail closed, never fabricated" + § 2 item 11 (resolver-side enforcement is PMC-P2 work)',
      },
    ],
  }))

  return {
    kind: 'pi-host-settings-proposal',
    status: 'PROPOSED-NOT-WRITTEN',
    target: {
      file: 'Pi host-owned settings file (host path deliberately not addressed; the owner applies this proposal by hand)',
      write_policy:
        'Foreman NEVER writes Pi’s host-owned settings file — proposal only, no host write, no credential anywhere',
    },
    discipline: PROPOSAL_DISCIPLINE,
    changes,
    endpoint_divergences: endpointDivergences,
    residual_dispositions: residualDispositions,
    credentials: {
      policy:
        'credentials remain environment references and never enter Foreman Line source, templates, receipts, or prompts (charter D2)',
      contains_credential_value: false,
    },
  }
}
