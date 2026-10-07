/**
 * `validatePolicy`: the one exported validation entry point. Runs the
 * structural (ajv) pass against `routingPolicySchema` first, then the seven
 * semantic invariants from the spec's Constraints section, independent of
 * whether the structural pass succeeded (so a single invocation surfaces every
 * violation, not just the first — the exit-code contract's `1` case depends
 * on this).
 *
 * Ceiling presence (invariant d) is enforced entirely by the schema itself
 * (`ceiling_usd` required + `exclusiveMinimum: 0`) — a static bound is
 * directly expressible in JSON Schema, unlike the cross-field rules below,
 * so no separate function exists for it here.
 */
import { Ajv, type SchemaObject } from 'ajv'
import { routingPolicySchema } from './schemas.js'
import {
  CONTRACT_RESIDUALS,
  LANE_IDS,
  type LaneId,
  RESOLVER_HOLDS,
  RESOLVER_REFUSALS,
} from './types.js'

export interface ValidationResult {
  readonly valid: boolean
  readonly errors: readonly string[]
}

const ajv = new Ajv({ allErrors: true })
const validateStructure = ajv.compile(routingPolicySchema as SchemaObject)

const SECURITY_NAME_PATTERN = /security|audit/i
const SHADOW_TASK_TYPES = new Set(['spec_lint', 'evidence_index', 'review_triage'])

/**
 * Frontier-tier anchoring registry (rework Finding 1): the set of model ids
 * `model_tiers.frontier` is allowed to contain. Deliberately hardcoded here,
 * not read from the policy document — a self-describing document cannot
 * anchor its own security override. The policy file is mutable data under
 * validation; this registry is reviewed, tested code. Redefining "frontier"
 * therefore costs a code change with tests (the quarterly model revisit),
 * never a policy-file edit.
 *
 * Ids are OpenRouter slugs verbatim (`vendor/model`, from
 * https://openrouter.ai/api/v1/models) — note Anthropic ids use dots there
 * (`anthropic/claude-fable-5.1`), the opposite of OpenCode Zen's dashes.
 * Gemini 3.1 Pro exists on OpenRouter only as `-preview`. Free, `:free`, and
 * contributor-tier models (which may train on submitted data, or are
 * rate-limited) are never frontier: the coordinator and verifier see
 * everything. Registry as of 2026-09-03; `openai/gpt-5.5-pro` /
 * `openai/gpt-5.4-pro` are deliberately absent — at $30/$180 per 1M tokens
 * they exhaust a $25 class ceiling in a single turn.
 */
export const KNOWN_FRONTIER_MODELS: readonly string[] = [
  'anthropic/claude-opus-5.5',
  'anthropic/claude-fable-5.1',
  'openai/gpt-6-astra', // SUPERCHARGE-P1 (verified 2026-09-14; $10/$50 escalation)
  // Amendment 08 (2026-10-07): gpt-5.6-sol removed from the roster by owner
  // direction (equal-cost successor exists; 403 access-disabled on the probe
  // host, O-2). gpt-6.1-sol is the preferred-verifier successor at identical
  // $2/$10 (models.dev capture 2026-10-07, gate-1-amendment-08.md).
  'openai/gpt-6.1-sol',
  'openai/gpt-5.5',
  'google/gemini-3.1-pro-preview',
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function toStringArray(value: unknown): readonly string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

/** The candidate's provider-local OpenRouter model id (binding `model` field), if any. */
function openrouterModelOf(candidate: Record<string, unknown>): string | null {
  const bindings = candidate.bindings
  if (!Array.isArray(bindings)) return null
  for (const rawBinding of bindings) {
    if (
      isRecord(rawBinding) &&
      rawBinding.provider === 'openrouter' &&
      typeof rawBinding.model === 'string'
    ) {
      return rawBinding.model
    }
  }
  return null
}

/**
 * The first binding of a candidate *declaring* the given data class, with its
 * provider — whichever provider that is.
 *
 * Amendment 06 N3 generalized this from an OpenRouter-only lookup. The rule
 * being checked was always "eligible SOMEWHERE, or it can never be dispatched";
 * only the mechanism assumed OpenRouter was the sole eligibility-carrying
 * provider. With first-party `anthropic` and open-weight `fireworks` bindings
 * that assumption is false, and keeping it would have reported a perfectly
 * dispatchable candidate as ineligible.
 *
 * Still fail-closed in the way that matters: a candidate with no binding whose
 * `data_classes` envelope is `declared` and contains the class returns null,
 * because unknown eligibility is never read as eligible (A5.2).
 */
function bindingEligibleFor(
  candidate: Record<string, unknown>,
  dataClass: string,
): { readonly provider: string; readonly model: string } | null {
  const bindings = candidate.bindings
  if (!Array.isArray(bindings)) return null
  for (const rawBinding of bindings) {
    if (!isRecord(rawBinding)) continue
    const declared = declaredDataClassesOf(rawBinding)
    if (declared === null || !declared.has(dataClass)) continue
    return {
      provider: typeof rawBinding.provider === 'string' ? rawBinding.provider : 'unknown',
      model: typeof rawBinding.model === 'string' ? rawBinding.model : 'unknown',
    }
  }
  return null
}

/**
 * The declared data-class set of a binding's `data_classes` envelope
 * (A5.2 binding-level eligibility; null when the envelope is not `declared` —
 * unknown eligibility is never read as eligible).
 */
function declaredDataClassesOf(binding: Record<string, unknown>): ReadonlySet<string> | null {
  const dataClasses = binding.data_classes
  if (!isRecord(dataClasses) || dataClasses.state !== 'declared') return null
  return new Set(toStringArray(dataClasses.value))
}

/**
 * D6: classification gating narrows monotonically — re-anchored at the binding
 * level (C3.3; the legacy cross-list invariant is retired with its blocks). A
 * binding's declared `data_classes` set must be downward-closed: declaring
 * `restricted` requires `internal` and `public`, declaring `internal` requires
 * `public`. The policy never claims eligibility a stricter tier implies but a
 * looser one denies.
 */
function checkClassificationGatesBeforeCost(doc: Record<string, unknown>): string[] {
  const errors: string[] = []
  const candidates = doc.candidates
  if (!isRecord(candidates)) return errors

  for (const [candidateKey, rawCandidate] of Object.entries(candidates)) {
    if (!isRecord(rawCandidate)) continue
    for (const rawBinding of Object.values(rawCandidate.bindings ?? [])) {
      if (!isRecord(rawBinding)) continue
      const declared = declaredDataClassesOf(rawBinding)
      if (declared === null) continue
      const label = `binding '${String(rawBinding.id ?? candidateKey)}'`
      if (declared.has('restricted') && !declared.has('internal')) {
        errors.push(
          `${label} declares data_classification.restricted in data_classes without data_classification.internal — classification gating must narrow public -> internal -> restricted (D6)`,
        )
      }
      if (declared.has('internal') && !declared.has('public')) {
        errors.push(
          `${label} declares data_classification.internal in data_classes without data_classification.public — classification gating must narrow public -> internal -> restricted (D6)`,
        )
      }
    }
  }
  return errors
}

/**
 * CUTOVER-P4 (C4.1): any document carrying a removed legacy block is refused
 * with the typed LEGACY_REPRESENTATION_REFUSED naming the block. The block is
 * never silently ignored — the schema and this validator both reject it, and
 * a legacy-only or dual document can reach no consumer without this refusal.
 */
function checkLegacyRepresentation(doc: Record<string, unknown>): string[] {
  const errors: string[] = []
  const blocks: Array<[string, unknown]> = [
    ['model_tiers', doc.model_tiers],
    ['roles', doc.roles],
  ]
  const dataClassification = doc.data_classification
  if (isRecord(dataClassification)) {
    for (const tier of ['public', 'internal', 'restricted'] as const) {
      const rule = dataClassification[tier]
      if (isRecord(rule) && rule.eligible_models !== undefined) {
        blocks.push([`data_classification.${tier}.eligible_models`, rule.eligible_models])
      }
    }
  }
  for (const [name, value] of blocks) {
    if (value === undefined) continue
    errors.push(
      `'${name}' is a removed legacy representation block (CUTOVER-P4; compatibility.legacy_representation.blocks names the removed set) — LEGACY_REPRESENTATION_REFUSED`,
    )
  }
  return errors
}

/**
 * C5.2 referential integrity for the ordered source, following the A5.3
 * dangling/self-reference pattern: every entry must name a declared candidate
 * (else FALLBACK_DANGLING_REFERENCE), and an entry may not name its own group
 * slot — the ordered source must not point at itself (FALLBACK_SELF_REFERENCE).
 */
function checkSelectionOrder(doc: Record<string, unknown>): string[] {
  const errors: string[] = []
  const selectionOrder = doc.selection_order
  if (!isRecord(selectionOrder)) return errors
  const candidates = doc.candidates
  const candidateKeys = isRecord(candidates) ? new Set(Object.keys(candidates)) : new Set<string>()

  for (const [group, entries] of Object.entries(selectionOrder)) {
    for (const entry of toStringArray(entries)) {
      if (entry === group) {
        errors.push(
          `selection_order.${group} entry '${entry}' is self-referential — an ordered-source entry may not name its own group slot (A5.3 self-reference rule) — FALLBACK_SELF_REFERENCE`,
        )
      } else if (!candidateKeys.has(entry)) {
        errors.push(
          `selection_order.${group} entry '${entry}' is not declared under candidates (A5.3 dangling-reference rule) — FALLBACK_DANGLING_REFERENCE`,
        )
      }
    }
  }
  return errors
}

/**
 * Security override + its derived guard: a class self-declares
 * `security_flavored: true`, and every tier in its allowlist must then equal
 * `'frontier'` (not merely contain it — closes a mixed-allowlist loophole).
 * Any class whose key looks security/audit-flavored by name but omits the flag
 * is rejected outright — declared + derived, never "somehow" (plan §6).
 */
function checkSecurityOverride(doc: Record<string, unknown>): string[] {
  const errors: string[] = []
  const classes = doc.classes
  if (!isRecord(classes)) return errors

  for (const [className, rawEntry] of Object.entries(classes)) {
    if (!isRecord(rawEntry)) continue
    const flagged = rawEntry.security_flavored === true

    if (SECURITY_NAME_PATTERN.test(className) && !flagged) {
      errors.push(
        `classes['${className}'] looks security/audit-flavored by name but does not declare 'security_flavored: true' (declared + derived, never "somehow")`,
      )
    }

    if (flagged) {
      for (const tier of toStringArray(rawEntry.allowlist)) {
        if (tier !== 'frontier') {
          errors.push(
            `classes['${className}'] is security_flavored but allowlist contains non-frontier tier '${tier}' — security override requires every allowlisted tier to equal 'frontier'`,
          )
        }
      }
    }
  }
  return errors
}

/**
 * Invariant (e), re-anchored to the ordered source (C3.3): every candidate in
 * `selection_order.frontier` must resolve to an OpenRouter model id that is a
 * known frontier model. The registry stays reviewed code (A7), never policy
 * content — a policy edit alone cannot redefine frontier.
 */
function checkFrontierTierAnchoring(doc: Record<string, unknown>): string[] {
  const errors: string[] = []
  const selectionOrder = doc.selection_order
  const candidates = doc.candidates
  if (!isRecord(selectionOrder) || !isRecord(candidates)) return errors

  for (const entry of toStringArray(selectionOrder.frontier)) {
    const candidate = candidates[entry]
    const model = isRecord(candidate) ? openrouterModelOf(candidate) : null
    if (model === null || !KNOWN_FRONTIER_MODELS.includes(model)) {
      errors.push(
        `selection_order.frontier entry '${entry}' resolves to '${String(model)}', which is not in the KNOWN_FRONTIER_MODELS registry (${KNOWN_FRONTIER_MODELS.join(', ')}) — redefining frontier requires a reviewed, tested code change, never a policy-file edit`,
      )
    }
  }
  return errors
}

/**
 * Invariant (g): non-public classifications must declare the strictest
 * gateway transport requirements. On a multi-provider gateway a model id does
 * not determine who serves the request; `data_collection: 'deny'` and
 * `zdr: true` are the two OpenRouter controls that do. The policy cannot send
 * requests, so this is a declared obligation on the consumer — but a policy
 * that declared anything weaker for internal/restricted data would be wrong
 * on its face, and that much can be checked here.
 */
function checkTransportRequirements(doc: Record<string, unknown>): string[] {
  const errors: string[] = []
  const dataClassification = doc.data_classification
  if (!isRecord(dataClassification)) return errors

  for (const tier of ['internal', 'restricted'] as const) {
    const rule = dataClassification[tier]
    if (!isRecord(rule)) continue
    const transport = rule.transport_requirements
    if (!isRecord(transport)) continue // structural pass reports the missing block
    const prefix = `data_classification.${tier}.transport_requirements`
    if (transport.data_collection !== 'deny') {
      errors.push(
        `${prefix}.data_collection must be 'deny', got '${String(transport.data_collection)}' — non-public data may not reach providers that store or train on inputs (g)`,
      )
    }
    if (transport.zdr !== true) {
      errors.push(
        `${prefix}.zdr must be true, got '${String(transport.zdr)}' — non-public data may only reach zero-data-retention endpoints (g)`,
      )
    }
  }
  return errors
}

/**
 * Invariant (f), re-anchored to the ordered source (C3.3): every
 * `selection_order` entry must be classification-eligible under
 * `data_classification.public` (its OpenRouter binding's `data_classes`
 * declares `public`). Classification gating runs before cost optimization
 * (D6), so an ordered-source candidate absent from even the widest eligibility
 * can never be dispatched under any classification — the ordered source would
 * be advertising a route that cannot exist. Checking against `public` suffices
 * because the D6 narrowing check forces internal and restricted to be subsets
 * of it. Named refusal DATA_CLASS_INELIGIBLE (rubric §7).
 */
function checkTiersEligibleUnderPublic(doc: Record<string, unknown>): string[] {
  const errors: string[] = []
  const selectionOrder = doc.selection_order
  const candidates = doc.candidates
  if (!isRecord(selectionOrder) || !isRecord(candidates)) return errors

  for (const [group, entries] of Object.entries(selectionOrder)) {
    for (const entry of toStringArray(entries)) {
      const candidate = candidates[entry]
      if (!isRecord(candidate)) continue // referential integrity reports dangling entries
      const eligible = bindingEligibleFor(candidate, 'public')
      if (eligible === null) {
        // Name the ids that were actually examined, not just the candidate key.
        // A bare key tells a reader which list to look at; the binding ids tell
        // them which declaration to fix.
        const rawBindings = Array.isArray(candidate.bindings) ? candidate.bindings : []
        const examined = rawBindings
          .filter(isRecord)
          .map((binding) => (typeof binding.model === 'string' ? `'${binding.model}'` : "'?'"))
        const detail = examined.length === 0 ? 'no bindings' : examined.join(', ')
        errors.push(
          `selection_order.${group} entry '${entry}' (bindings: ${detail}) is not classification-eligible under data_classification.public — every ordered-source candidate must be classification-eligible somewhere or it can never be dispatched (D6) — DATA_CLASS_INELIGIBLE`,
        )
      }
    }
  }
  return errors
}

/**
 * Shadow routes are advisory sidecars, never substitute model tiers or
 * authority-bearing roles. Structural rules live in the schema; these checks
 * bind a route's map key to its adapter id and make the fail-closed policy
 * reasons explicit for dispatch-time callers and reviewers.
 */
function checkShadowRoutes(doc: Record<string, unknown>): string[] {
  const errors: string[] = []
  const shadowRoutes = doc.shadow_routes
  if (!isRecord(shadowRoutes)) return errors

  for (const [routeName, rawRoute] of Object.entries(shadowRoutes)) {
    if (!isRecord(rawRoute)) continue
    const prefix = `shadow_routes['${routeName}']`

    if (rawRoute.adapter_id !== routeName) {
      errors.push(`${prefix}.adapter_id must equal its route key '${routeName}'`)
    }
    if (rawRoute.data_classification !== 'public') {
      errors.push(`${prefix}.data_classification must be 'public' for a shadow route`)
    }
    if (rawRoute.requires_live_discovery !== true) {
      errors.push(`${prefix}.requires_live_discovery must be true`)
    }
    if (rawRoute.candidate_only !== true) {
      errors.push(
        `${prefix}.candidate_only must be true; shadow output cannot satisfy a review or gate`,
      )
    }
    if (rawRoute.authority !== 'none') {
      errors.push(`${prefix}.authority must be 'none'`)
    }
    if (toStringArray(rawRoute.tools_granted).length !== 0) {
      errors.push(`${prefix}.tools_granted must be empty`)
    }
    if (rawRoute.effect_capability !== 'none') {
      errors.push(`${prefix}.effect_capability must be 'none'`)
    }

    const prohibitedRoles = new Set(toStringArray(rawRoute.prohibited_roles))
    for (const role of ['coordinator', 'verifier']) {
      if (!prohibitedRoles.has(role)) {
        errors.push(`${prefix}.prohibited_roles must include '${role}'`)
      }
    }

    for (const taskType of toStringArray(rawRoute.allowed_task_types)) {
      if (!SHADOW_TASK_TYPES.has(taskType)) {
        errors.push(`${prefix}.allowed_task_types contains unsupported task type '${taskType}'`)
      }
    }
  }

  return errors
}

/**
 * ROPT-P1 — lane -> class referential integrity, as an *advisory* surface,
 * deliberately not a `validatePolicy` invariant yet.
 *
 * Every dispatchable lane names the routing classes it serves
 * (`lane_map.<lane>.routing_classes`), but nothing cross-checks those names
 * against the `classes` block. A lane referencing an undefined class has no
 * allowlist and no `ceiling_usd` to resolve against at dispatch time — the
 * spend bound simply does not exist for that lane/class pair.
 *
 * Why advisory and not invariant 9: closing the gap requires policy *content*
 * — a `classes` entry per referenced-but-undefined class, each carrying an
 * owner-set ceiling (an enforced bound is never a guessed value). The shipped
 * v0.4 policy itself references three undefined classes (`review/security`,
 * `implementation/complex`, `routing/classification`); the first two need
 * owner-ratified ceilings, and `routing/classification` is reachable only via
 * the disabled-refused L6 lane (M2), which cannot dispatch and is therefore
 * exempt here. The promotion path — owner sets the ceilings, this advisory
 * becomes a hard refusal — is specced in
 * `docs/specs/active/ROPT-P1-routing-optimization-program.md`.
 *
 * Pure and deterministic like the rest of this module: no I/O, no clock.
 */
export const LANE_CLASS_UNDEFINED = 'LANE_CLASS_UNDEFINED' as const

export function laneClassReferenceAdvisories(doc: unknown): readonly string[] {
  const advisories: string[] = []
  if (!isRecord(doc)) return advisories
  const laneMap = doc.lane_map
  const classes = doc.classes
  if (!isRecord(laneMap) || !isRecord(classes)) return advisories

  for (const lane of LANE_IDS) {
    const entry = laneMap[lane]
    if (!isRecord(entry)) continue
    // A disabled-refused lane (M2: L6) cannot dispatch, so an undefined class
    // on it bounds nothing — naming it would be noise, not a gap.
    if (entry.status === 'disabled-refused') continue
    for (const routingClass of toStringArray(entry.routing_classes)) {
      if (!(routingClass in classes)) {
        advisories.push(
          `lane_map.${lane}.routing_classes references '${routingClass}', which has no classes entry — a dispatch under this class resolves no allowlist and no ceiling_usd — ${LANE_CLASS_UNDEFINED} (advisory; hard-invariant promotion pending owner-set class definitions, ROPT-P1)`,
        )
      }
    }
  }
  return advisories.sort()
}

export function validatePolicy(doc: unknown): ValidationResult {
  const errors: string[] = []

  const structurallyValid = validateStructure(doc)
  if (!structurallyValid) {
    for (const err of validateStructure.errors ?? []) {
      const path = err.instancePath.length > 0 ? err.instancePath : '(root)'
      errors.push(`${path} ${err.message ?? 'is invalid'}`)
    }
  }

  if (isRecord(doc)) {
    // CUTOVER-P4 (C4.1): the legacy-block refusal runs first and always — a
    // legacy-only or dual document is refused by name before anything else.
    errors.push(...checkLegacyRepresentation(doc))
    errors.push(...checkSelectionOrder(doc))
    errors.push(...checkClassificationGatesBeforeCost(doc))
    errors.push(...checkSecurityOverride(doc))
    errors.push(...checkFrontierTierAnchoring(doc))
    errors.push(...checkTiersEligibleUnderPublic(doc))
    errors.push(...checkTransportRequirements(doc))
    errors.push(...checkShadowRoutes(doc))
    // PMC-P1 provider-neutral fallback contract (A5.1–A5.5).
    errors.push(...checkRepresentationBlocks(doc))
    errors.push(...checkLaneMap(doc))
    errors.push(...checkRankingContract(doc))
    const bindingsIndex = indexBindings(doc)
    errors.push(...checkBindings(doc))
    errors.push(...checkLaneRoutes(doc, bindingsIndex))
    // RCM schema v0.4 (RCM-P3): expertise-binding block invariants.
    errors.push(...checkExpertiseBindings(doc, bindingsIndex))
  }

  return { valid: errors.length === 0, errors }
}

// ---------------------------------------------------------------------------
// PMC-P1 — provider-neutral fallback contract invariants (charter A5.1–A5.5).
// Each refusal name below has a negative-control test; the names themselves
// are pinned by `tests/fallback-contract.test.ts` against the vocabulary in
// `types.ts` (suitability rubric §7).
// ---------------------------------------------------------------------------

/**
 * Frontier-tier anchoring for provider-prefixed bindings (A7 "frontier registry
 * change", Amendment 03 Opus identities): the reviewed set of binding ids the
 * frozen map's frontier-only lanes (L1/L2) may route. Deliberately hardcoded
 * here, not read from the policy document — a self-describing document cannot
 * anchor its own frontier tier. Same principle and invariant as
 * KNOWN_FRONTIER_MODELS, at the binding level of the new representation.
 */
export const KNOWN_FRONTIER_BINDINGS: readonly string[] = [
  'opencode/claude-opus-5-5',
  'opencode/gpt-6-astra',
  'openrouter/anthropic/claude-opus-5.5',
  'openrouter/openai/gpt-6-astra',
  // Amendment 06 N1: the first-party Pi/Anthropic bindings, dashed spelling.
  // Admitted on the 2026-10-07 `~/.pi/agent/models-store.json` capture, which
  // is the strongest identity evidence in the contract (first-party, on-host)
  // — but it establishes identity and cost only, never live availability.
  // No open-weight binding appears here: the frontier tier is where the
  // coordinator and verifier see everything, and the open-weight lane is
  // `public`-only under FIREWORKS_TRANSPORT_UNVERIFIED.
  'anthropic/claude-opus-5-5',
  'anthropic/claude-fable-5-1',
  // Amendment 07 (ratified 2026-10-07): L1/L2 `opencode` re-pinning. Identity
  // and cost established by the models.dev public-metadata capture
  // (docs/goals/pi-model-configuration/evidence/models-dev-observation-20261007.json);
  // context, data classes, and live availability remain typed-unavailable —
  // admission here asserts reviewed identity only, never measured merit.
  'opencode/gpt-6.1-sol',
  'opencode/claude-sonnet-5-5',
  'opencode/gpt-6-luna',
]

/** The five blocks of the new representation; they stand or fall together. */
const REPRESENTATION_BLOCKS = [
  'compatibility',
  'ranking_contract',
  'lane_map',
  'candidates',
  'lane_routes',
] as const

/** A5.4 frozen map pins (a54-ratification-2026-09-26.md): role families. */
const FROZEN_ROLE_FAMILIES: Readonly<Record<LaneId, string>> = {
  L1: 'coordinator',
  L2: 'verifier',
  L3: 'builder',
  L4: 'builder',
  L5: 'builder',
  L6: 'classifier',
}

const FROZEN_FRONTIER_ONLY: Readonly<Record<LaneId, boolean>> = {
  L1: true,
  L2: true,
  L3: false,
  L4: false,
  L5: false,
  L6: false,
}

/**
 * A3 per-lane provider rules (rubric §4 step 1). The L1/L2 pin values, L3/L4
 * preference values, and delta_L are named unfabricated residuals
 * (a54 dispositions 2/3/5): the declaration slot is frozen, the value stays
 * typed-unavailable until real evidence (A6) assigns it.
 */
const FROZEN_PROVIDER_RULES: Readonly<Record<LaneId, { kind: string; residual?: string }>> = {
  L1: { kind: 'pinned-provider', residual: 'L1_PINNED_PROVIDER_UNSET' },
  L2: { kind: 'pinned-provider', residual: 'L2_PINNED_PROVIDER_UNSET' },
  L3: { kind: 'declared-preference', residual: 'L3_PROVIDER_PREFERENCE_UNSET' },
  L4: { kind: 'declared-preference', residual: 'L4_PROVIDER_PREFERENCE_UNSET' },
  L5: { kind: 'cheapest-eligible' },
  L6: { kind: 'none' },
}

const DELTA_L_RESIDUAL = 'DELTA_L_UNSET'

/** Rubric §5 rule 2: the only re-enablement candidate list for L6. */
const L6_REENABLEMENT_CANDIDATES: readonly string[] = [
  'opencode/qwen3.8-flash',
  'opencode/glm-5.3-flash',
]

/** Authority verbs no lane may ever claim (exit criterion 4: control-plane). */
const CONTROL_PLANE_VERBS: readonly string[] = [
  'approve',
  'merge',
  'release',
  'ratify',
  'grant-gate',
  'policy-bypass',
]

/** Every residual name must come from the named vocabulary, never invented. */
const NAMED_RESIDUALS: readonly string[] = [
  ...RESOLVER_REFUSALS,
  ...RESOLVER_HOLDS,
  ...CONTRACT_RESIDUALS,
]

/** The only names a zero-match identity may record as diagnostics (rubric §7). */
const ZERO_MATCH_DIAGNOSTICS: readonly string[] = [
  'AC2A_WRONG_PROVIDER',
  'AC2A_CASE_MISMATCH',
  'AC2A_PREFIX_ALIAS_REFUSED',
]

const ENVELOPE_FIELDS = [
  'data_classes',
  'context_window_tokens',
  'max_output_tokens',
  'cost',
  'availability',
  'quality',
  // RCM schema v0.4 (D8) per-entry capability predicates. Same honesty rule:
  // their residuals come from the named vocabulary, never invented.
  'inputs',
  'thinking_levels',
] as const

function envelopeResidualOf(raw: unknown): string | undefined {
  return isRecord(raw) && typeof raw.residual === 'string' ? raw.residual : undefined
}

function envelopeStateOf(raw: unknown): string | undefined {
  return isRecord(raw) && typeof raw.state === 'string' ? raw.state : undefined
}

function checkRepresentationBlocks(doc: Record<string, unknown>): string[] {
  const present = REPRESENTATION_BLOCKS.filter((key) => doc[key] !== undefined)
  if (present.length !== 0 && present.length !== REPRESENTATION_BLOCKS.length) {
    return [
      `new representation blocks must appear together (A5.5 compatibility versioning); found only [${present.join(', ')}] — REPRESENTATION_INCOMPLETE_REFUSED`,
    ]
  }
  return []
}

/**
 * A5.4: the role/lane/authority map is frozen by owner ratification of PMC-P0
 * output (a54). The authority-bearing dimensions cannot drift through a policy
 * edit — redefining them costs a reviewed code change, like KNOWN_FRONTIER_MODELS.
 */
function checkLaneMap(doc: Record<string, unknown>): string[] {
  const errors: string[] = []
  const laneMap = doc.lane_map
  if (!isRecord(laneMap)) return errors

  for (const lane of LANE_IDS) {
    const entry = laneMap[lane]
    if (!isRecord(entry)) continue // structural pass reports the missing lane
    const prefix = `lane_map.${lane}`

    if (entry.role_family !== FROZEN_ROLE_FAMILIES[lane]) {
      errors.push(
        `${prefix}.role_family must be '${FROZEN_ROLE_FAMILIES[lane]}' (A5.4 frozen map) — ROLE_LANE_MAP_VIOLATION`,
      )
    }
    if (entry.frontier_only !== FROZEN_FRONTIER_ONLY[lane]) {
      errors.push(
        `${prefix}.frontier_only must be ${String(FROZEN_FRONTIER_ONLY[lane])} (A5.4 frozen map) — ROLE_LANE_MAP_VIOLATION`,
      )
    }

    const expected = FROZEN_PROVIDER_RULES[lane]
    const rule = entry.provider_rule
    if (!isRecord(rule) || rule.kind !== expected.kind) {
      errors.push(
        `${prefix}.provider_rule.kind must be '${expected.kind}' (A3 per-lane rule, A5.4 frozen map) — ROLE_LANE_MAP_VIOLATION`,
      )
    } else if (expected.residual !== undefined) {
      const slot = isRecord(rule.pinned_provider) ? rule.pinned_provider : rule.preference
      if (!isRecord(slot) || slot.state !== 'unavailable' || slot.residual !== expected.residual) {
        errors.push(
          `${prefix}.provider_rule must carry the typed-unavailable residual '${expected.residual}' (a54 items 2/3: value unset, fail closed) — RESIDUAL_FABRICATED_REFUSED`,
        )
      }
    }

    const tolerance = entry.quality_tolerance
    if (
      !isRecord(tolerance) ||
      tolerance.state !== 'unavailable' ||
      tolerance.residual !== DELTA_L_RESIDUAL
    ) {
      errors.push(
        `${prefix}.quality_tolerance must be typed-unavailable with residual '${DELTA_L_RESIDUAL}' (a54 item 5: delta_L unset, fail closed) — RESIDUAL_FABRICATED_REFUSED`,
      )
    }

    for (const verb of toStringArray(entry.authority_cap)) {
      if (CONTROL_PLANE_VERBS.includes(verb)) {
        errors.push(
          `${prefix}.authority_cap contains control-plane verb '${verb}' — no lane may grant approval, merge, release, ratification, gate-grant, or policy-bypass (exit criterion 4) — CONTROL_PLANE_ROUTE_REFUSED`,
        )
      }
    }
  }

  const l6 = laneMap.L6
  if (isRecord(l6)) {
    if (l6.status !== 'disabled-refused') {
      errors.push(
        `lane_map.L6.status must be 'disabled-refused' (M2: the typed routing/classification lane is refused) — LANE_DISABLED_REFUSED`,
      )
    }
    if (l6.re_enablement !== 'ratified-amendment-required') {
      errors.push(
        `lane_map.L6.re_enablement must be 'ratified-amendment-required' (M2; rubric §5 rule 1) — ROLE_LANE_MAP_VIOLATION`,
      )
    }
    const declared = toStringArray(l6.re_enablement_candidates)
    const matches =
      declared.length === L6_REENABLEMENT_CANDIDATES.length &&
      declared.every((id, i) => id === L6_REENABLEMENT_CANDIDATES[i])
    if (!matches) {
      errors.push(
        `lane_map.L6.re_enablement_candidates must be exactly [${L6_REENABLEMENT_CANDIDATES.join(', ')}] (rubric §5 rule 2) — ROLE_LANE_MAP_VIOLATION`,
      )
    }
  }
  return errors
}

interface IndexedBinding {
  readonly binding: Record<string, unknown>
  readonly candidateKey: string
}

function indexBindings(doc: Record<string, unknown>): {
  byId: Map<string, IndexedBinding>
  byCandidate: Map<string, IndexedBinding[]>
} {
  const byId = new Map<string, IndexedBinding>()
  const byCandidate = new Map<string, IndexedBinding[]>()
  const candidates = doc.candidates
  if (!isRecord(candidates)) return { byId, byCandidate }

  for (const [candidateKey, rawCandidate] of Object.entries(candidates)) {
    if (!isRecord(rawCandidate)) continue
    const entries: IndexedBinding[] = []
    for (const rawBinding of Object.values(rawCandidate.bindings ?? [])) {
      if (!isRecord(rawBinding) || typeof rawBinding.id !== 'string') continue
      const entry: IndexedBinding = { binding: rawBinding, candidateKey }
      entries.push(entry)
      byId.set(rawBinding.id, entry)
    }
    byCandidate.set(candidateKey, entries)
  }
  return { byId, byCandidate }
}

/**
 * RCM schema v0.4 (RCM-P3): expertise-binding block invariants. Refs resolve
 * exactly like route refs (a binding id, or a candidate's declared bindings);
 * anything unresolvable is `EXPERTISE_BINDING_DANGLING_REFERENCE`. Two
 * non-shadow bindings for the same `(routing_class, expertise)` key would make
 * dispatch-time narrowing ambiguous — refused as an incomplete representation.
 * Shadow entries are evidence-only (RCM-P9) and carry no narrowing obligation.
 */
function checkExpertiseBindings(
  doc: Record<string, unknown>,
  index: { byId: Map<string, IndexedBinding>; byCandidate: Map<string, IndexedBinding[]> },
): string[] {
  const errors: string[] = []
  const rawEntries = doc.expertise_bindings
  if (rawEntries === undefined) return errors
  if (!Array.isArray(rawEntries)) return errors // structural error already reported

  const seenKeys = new Map<string, number>()
  rawEntries.forEach((rawEntry, position) => {
    if (!isRecord(rawEntry)) return // structural error already reported
    const prefix = `expertise_bindings[${position}]`
    const routingClass = rawEntry.routing_class
    const expertise = rawEntry.expertise
    const shadow = rawEntry.shadow === true
    if (!shadow && typeof routingClass === 'string' && typeof expertise === 'string') {
      const key = `${routingClass} ${expertise}`
      const prior = seenKeys.get(key)
      if (prior !== undefined) {
        errors.push(
          `${prefix} duplicates the non-shadow (${routingClass}, ${expertise}) key already declared at index ${prior} — narrowing must be unambiguous — REPRESENTATION_INCOMPLETE_REFUSED`,
        )
      } else {
        seenKeys.set(key, position)
      }
    }
    const refs = Array.isArray(rawEntry.bindings) ? rawEntry.bindings : []
    for (const rawRef of refs) {
      if (!isRecord(rawRef)) continue // structural error already reported
      const label = `${prefix}.bindings`
      if (rawRef.type === 'binding') {
        if (typeof rawRef.ref !== 'string' || !index.byId.has(rawRef.ref)) {
          errors.push(
            `${label} binding '${String(rawRef.ref)}' is not declared under candidates — EXPERTISE_BINDING_DANGLING_REFERENCE`,
          )
        }
      } else if (
        typeof rawRef.ref !== 'string' ||
        (index.byCandidate.get(rawRef.ref) ?? []).length === 0
      ) {
        errors.push(
          `${label} candidate '${String(rawRef.ref)}' is not declared under candidates — EXPERTISE_BINDING_DANGLING_REFERENCE`,
        )
      }
    }
  })
  return errors
}

function checkBindings(doc: Record<string, unknown>): string[] {
  const errors: string[] = []
  const candidates = doc.candidates
  if (!isRecord(candidates)) return errors

  const seenIds = new Map<string, string>()
  for (const [candidateKey, rawCandidate] of Object.entries(candidates)) {
    if (!isRecord(rawCandidate)) continue
    for (const rawBinding of Object.values(rawCandidate.bindings ?? [])) {
      if (!isRecord(rawBinding) || typeof rawBinding.id !== 'string') continue
      const prefix = `candidates['${candidateKey}'].bindings['${rawBinding.id}']`

      const prior = seenIds.get(rawBinding.id)
      if (prior !== undefined) {
        errors.push(
          `${prefix} duplicates binding id '${rawBinding.id}' already declared under candidates['${prior}'] — BINDING_ID_DUPLICATE_REFUSED`,
        )
      } else {
        seenIds.set(rawBinding.id, candidateKey)
      }

      // Provider/model/id coherence: the id is the provider-prefixed spelling
      // of the model (D7: OpenCode- and OpenRouter-prefixed ids first-class).
      const expectedId =
        typeof rawBinding.provider === 'string' && typeof rawBinding.model === 'string'
          ? `${rawBinding.provider}/${rawBinding.model}`
          : undefined
      if (expectedId === undefined || rawBinding.id !== expectedId) {
        errors.push(
          `${prefix} must equal its provider/model spelling '${String(expectedId)}' — UNSUPPORTED_MODEL_REFUSED`,
        )
      }

      for (const field of ENVELOPE_FIELDS) {
        const residual = envelopeResidualOf(rawBinding[field])
        if (residual !== undefined && !NAMED_RESIDUALS.includes(residual)) {
          errors.push(
            `${prefix}.${field}.residual '${residual}' is not a named residual of the contract vocabulary — RESIDUAL_FABRICATED_REFUSED`,
          )
        }
      }

      // A6 honesty: a state may never be implied without its attestation.
      const availability = rawBinding.availability
      if (
        isRecord(availability) &&
        availability.state === 'declared' &&
        availability.value !== 'live-availability'
      ) {
        errors.push(
          `${prefix}.availability may only attest 'live-availability' (A6) — got '${String(availability.value)}' — EVIDENCE_STATE_UNATTESTED`,
        )
      }
      const quality = rawBinding.quality
      if (isRecord(quality) && quality.state === 'declared' && quality.value !== 'model-quality') {
        errors.push(
          `${prefix}.quality may only attest 'model-quality' (A6) — got '${String(quality.value)}' — EVIDENCE_STATE_UNATTESTED`,
        )
      }

      // H-EP: a binding whose catalogue endpoint diverges from the registered
      // one cannot attest reachability on the registered endpoint.
      const endpoint = rawBinding.endpoint
      if (
        isRecord(endpoint) &&
        endpoint.alignment === 'divergent' &&
        isRecord(availability) &&
        availability.state === 'declared'
      ) {
        errors.push(
          `${prefix} has a divergent catalogue endpoint (H-EP) and may not claim attested availability — ENDPOINT_DIVERGENCE_REFUSED`,
        )
      }

      // Identity evidence coherence (pmc-p0-capability-baseline.md AC2).
      const identity = rawBinding.identity
      if (isRecord(identity) && identity.state === 'zero-match') {
        if (identity.refusal !== 'AC2A_ZERO_MATCH') {
          errors.push(
            `${prefix}.identity.refusal must be 'AC2A_ZERO_MATCH' (Amendment 04 D-b1) — EVIDENCE_STATE_UNATTESTED`,
          )
        }
        const diagnostics = toStringArray(identity.diagnostics)
        for (const name of diagnostics) {
          if (!ZERO_MATCH_DIAGNOSTICS.includes(name)) {
            errors.push(
              `${prefix}.identity.diagnostics contains '${name}', which is not a zero-match diagnostic (rubric §7) — EVIDENCE_STATE_UNATTESTED`,
            )
          }
        }
      }

      // CUTOVER-P4: the R1 legacy cross-check (declared `data_classes` vs the
      // removed `data_classification.*.eligible_models` lists) is retired with
      // its blocks. Binding-level `data_classes` IS the eligibility source
      // (A5.2); the ordered source's public-eligibility is enforced by
      // checkTiersEligibleUnderPublic.
    }
  }
  return errors
}

function checkLaneRoutes(
  doc: Record<string, unknown>,
  index: ReturnType<typeof indexBindings>,
): string[] {
  const errors: string[] = []
  const routes = doc.lane_routes
  if (!Array.isArray(routes)) return errors

  const laneMap = isRecord(doc.lane_map) ? doc.lane_map : {}

  for (const [position, rawRoute] of routes.entries()) {
    if (!isRecord(rawRoute)) continue
    const prefix = `lane_routes[${position}] (${String(rawRoute.lane)}/${String(rawRoute.provider)})`

    if (rawRoute.lane === 'L6') {
      errors.push(
        `${prefix} declares a route for the disabled L6 lane (M2) — LANE_DISABLED_REFUSED`,
      )
      continue
    }

    const provider = rawRoute.provider
    const resolve = (rawRef: unknown): { id?: string; error?: string } => {
      if (!isRecord(rawRef)) return { error: 'unresolvable reference' }
      if (rawRef.type === 'binding') {
        const id = String(rawRef.ref)
        const found = index.byId.get(id)
        if (!found) return { error: `binding '${id}' is not declared under candidates` }
        return { id }
      }
      const entries = index.byCandidate.get(String(rawRef.ref))
      if (!entries || entries.length === 0) {
        return { error: `candidate '${String(rawRef.ref)}' is not declared under candidates` }
      }
      const matching = entries.filter((entry) => entry.binding.provider === provider)
      if (matching.length === 0) {
        return {
          error: `candidate '${String(rawRef.ref)}' has no binding of provider '${String(provider)}'`,
        }
      }
      return { id: matching[0]?.binding.id as string }
    }

    const primary = resolve(rawRoute.primary)
    const fallback = resolve(rawRoute.fallback)

    for (const [role, resolved, rawRef] of [
      ['primary', primary, rawRoute.primary],
      ['fallback', fallback, rawRoute.fallback],
    ] as const) {
      if (resolved.error !== undefined) {
        const dangling = resolved.error.includes('is not declared')
        errors.push(
          `${prefix}.${role} ${resolved.error} — ${dangling ? 'FALLBACK_DANGLING_REFERENCE' : 'FALLBACK_PROVIDER_MISMATCH'}`,
        )
      }
      const ref = isRecord(rawRef) ? String(rawRef.ref) : ''
      if (
        resolved.id !== undefined &&
        isRecord(rawRef) &&
        rawRef.type === 'binding' &&
        index.byId.get(resolved.id)?.binding.provider !== provider
      ) {
        errors.push(
          `${prefix}.${role} binding '${ref}' is declared for provider '${String(index.byId.get(resolved.id)?.binding.provider)}', not '${String(provider)}' (D3: a fallback never crosses providers) — FALLBACK_PROVIDER_MISMATCH`,
        )
      }
    }

    if (primary.id !== undefined && primary.id === fallback.id) {
      errors.push(
        `${prefix}.fallback '${fallback.id}' is the primary itself (A5.3) — FALLBACK_SELF_REFERENCE`,
      )
    }

    const rawLaneEntry = laneMap[String(rawRoute.lane)]
    const laneEntry: Record<string, unknown> = isRecord(rawLaneEntry) ? rawLaneEntry : {}
    const resolvedIds = [primary.id, fallback.id].filter((id): id is string => id !== undefined)
    if (isRecord(laneEntry) && laneEntry.frontier_only === true) {
      for (const id of resolvedIds) {
        if (!KNOWN_FRONTIER_BINDINGS.includes(id)) {
          errors.push(
            `${prefix} routes '${id}' in a frontier-only lane, which is not in KNOWN_FRONTIER_BINDINGS (${KNOWN_FRONTIER_BINDINGS.join(', ')}) — UNSUPPORTED_MODEL_REFUSED`,
          )
        }
      }
    }

    const primaryBinding =
      primary.id !== undefined ? index.byId.get(primary.id)?.binding : undefined
    const fallbackBinding =
      fallback.id !== undefined ? index.byId.get(fallback.id)?.binding : undefined
    if (isRecord(primaryBinding) && isRecord(fallbackBinding)) {
      // Static fallback policy (exit criterion 4): a fallback may never relax
      // a declared data, tool, or budget input of its primary.
      const primaryClasses = primaryBinding.data_classes
      const fallbackClasses = fallbackBinding.data_classes
      if (
        isRecord(primaryClasses) &&
        primaryClasses.state === 'declared' &&
        isRecord(fallbackClasses) &&
        fallbackClasses.state === 'declared'
      ) {
        const needed = toStringArray(primaryClasses.value)
        const provided = new Set(toStringArray(fallbackClasses.value))
        for (const tier of needed) {
          if (!provided.has(tier)) {
            errors.push(
              `${prefix} fallback '${fallback.id}' is not eligible for '${tier}', which its primary serves — FALLBACK_DATA_POLICY_VIOLATION`,
            )
          }
        }
      }

      for (const capability of ['tool-use', 'structured-output'] as const) {
        const primaryCaps = isRecord(primaryBinding.capabilities) ? primaryBinding.capabilities : {}
        const fallbackCaps = isRecord(fallbackBinding.capabilities)
          ? fallbackBinding.capabilities
          : {}
        if (primaryCaps[capability] === 'verified' && fallbackCaps[capability] !== 'verified') {
          errors.push(
            `${prefix} fallback '${fallback.id}' does not preserve the primary's verified '${capability}' capability — FALLBACK_TOOL_REQUIREMENT_VIOLATION`,
          )
        }
      }

      const fallbackCost = fallbackBinding.cost
      if (isRecord(fallbackCost) && fallbackCost.state === 'declared') {
        const quote = fallbackCost.value
        const usable =
          isRecord(quote) &&
          quote.unit === 'usd_per_mtok' &&
          typeof quote.input === 'number' &&
          quote.input > 0 &&
          typeof quote.output === 'number' &&
          quote.output > 0
        if (!usable) {
          errors.push(
            `${prefix} fallback '${fallback.id}' declares a cost quote unusable for the R5 budget filter (unit must be 'usd_per_mtok' with positive prices) — FALLBACK_BUDGET_POLICY_VIOLATION`,
          )
        }
      }
    }

    // Rubric §1: comparability is unproven while any input — including the
    // per-lane delta_L — is unknown; "unproven" is never read as "comparable".
    const comparability = rawRoute.comparability
    if (isRecord(comparability) && comparability.state === 'declared') {
      const residual = envelopeResidualOf(comparability)
      if (residual !== undefined && !NAMED_RESIDUALS.includes(residual)) {
        errors.push(
          `${prefix}.comparability.residual '${residual}' is not a named residual of the contract vocabulary — RESIDUAL_FABRICATED_REFUSED`,
        )
      }
      const tolerance = isRecord(laneEntry.quality_tolerance) ? laneEntry.quality_tolerance : {}
      const unprovenInputs =
        tolerance.state === 'unavailable' ||
        [primaryBinding, fallbackBinding].some(
          (binding) =>
            isRecord(binding) &&
            ENVELOPE_FIELDS.some((field) => envelopeStateOf(binding[field]) !== 'declared'),
        )
      if (unprovenInputs) {
        errors.push(
          `${prefix}.comparability claims 'comparable or higher' while ranking inputs (incl. delta_L) are unproven (rubric §1/§3) — FALLBACK_SUITABILITY_UNPROVEN`,
        )
      }
    } else if (isRecord(comparability)) {
      const residual = envelopeResidualOf(comparability)
      if (residual !== undefined && !NAMED_RESIDUALS.includes(residual)) {
        errors.push(
          `${prefix}.comparability.residual '${residual}' is not a named residual of the contract vocabulary — RESIDUAL_FABRICATED_REFUSED`,
        )
      }
    }
  }
  return errors
}

/** A3 / rubric: the ranking fields and evidence threshold are themselves frozen. */
function checkRankingContract(doc: Record<string, unknown>): string[] {
  const errors: string[] = []
  const contract = doc.ranking_contract
  if (!isRecord(contract)) return errors

  const filters = toStringArray(contract.eligibility_filters)
  const expectedFilters = ['R1', 'R2', 'R3', 'R4', 'R6']
  if (
    filters.length !== expectedFilters.length ||
    filters.some((f, i) => f !== expectedFilters[i])
  ) {
    errors.push(
      `ranking_contract.eligibility_filters must be exactly [${expectedFilters.join(', ')}] (rubric §2: R5 is the budget filter/ordering key, R7 the quality key) — RANKING_CONTRACT_VIOLATION`,
    )
  }
  if (contract.budget_ordering_lane !== 'L5') {
    errors.push(
      `ranking_contract.budget_ordering_lane must be 'L5' (A3: economy lanes resolve to the cheapest eligible binding) — RANKING_CONTRACT_VIOLATION`,
    )
  }
  if (contract.quality_ordering_key !== 'R7') {
    errors.push(
      `ranking_contract.quality_ordering_key must be 'R7' (rubric §2) — RANKING_CONTRACT_VIOLATION`,
    )
  }
  return errors
}
