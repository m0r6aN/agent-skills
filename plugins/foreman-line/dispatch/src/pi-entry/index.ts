/**
 * HRO-P4 supported Pi/parcel entry point (MRC-06).
 *
 * The supported path from parcel dispatch to a Pi session with its approved
 * route (charter A1: a dispatched Pi session is authorized only by an approved
 * route receipt emitted by the resolver; direct or default Pi invocation is not
 * a Foreman execution path):
 *
 *   prepareDispatch/executeDispatch (the parcel flow) -> preparePiEntry ->
 *   the launcher verifies the launch boundary at session start and runs the
 *   session on session_request -> verifyHostModelSelection at/after selection ->
 *   verifyExecutedIdentity on ResultEnvelope.modelRef at result time ->
 *   useDeclaredFallback / writePiEntryRecord as needed.
 *
 * Discipline (MRC-06 contract; coordinator rulings 1-4; Amendment A1):
 * - pure document seams: no fs except writePiEntryRecord (the only write in
 *   this parcel), no network/provider/MCP/subprocess calls, no clock reads
 *   (options.now is injected — the PMC resolver pattern), no host Pi
 *   configuration read or write and no proposal emission (ruling D:
 *   validate-only; apply is PMC's authorized writer, proposals are MRC-10);
 * - consumed seams are called, never re-implemented: resolveRoute/verifyLaunch/
 *   buildFallbackHandoff/piModelContractFor/validatePolicy (PMC-P2) and
 *   verifyExecutedIdentity (MRC-05 C4.4);
 * - decision-as-authority (boundary-routing D7): the decision receipt is the
 *   runtime authority for what the Pi session runs; the resolver's lane route
 *   and the charter matrix are design inputs. The entry validates, never
 *   decides, and never derives, normalizes, or aliases identity values (exact
 *   string equality within one namespace only, null<->null);
 * - one declared typed fallback only (C4); no recovery ladder (MRC-08), no
 *   chain/event writes (MRC-05/MRC-02), no execution-side claims and no Pi
 *   ThinkingLevel enum mapping (the H-PI hold) — the resolved thinking level is
 *   carried as data (A1.4);
 * - entry-domain refusals live in PI_ENTRY_REFUSALS (the LAUNCH_REFUSALS
 *   precedent); RESOLVER_REFUSALS/LAUNCH_REFUSALS and the seven-binding replay
 *   structure are consumed unchanged.
 */

import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, renameSync, unlinkSync, writeFileSync } from 'node:fs'
import { basename, dirname, isAbsolute, join, relative } from 'node:path'
import { parse } from 'yaml'
import type { ReplayBindings, SelectedIdentity } from '../../../receipts/src/index.js'
import { verifyExecutedIdentity } from '../../../receipts/src/index.js'
import type { HostSettingsSnapshot } from '../../../routing-policy/src/host-settings-proposal.js'
import { validatePolicy } from '../../../routing-policy/src/index.js'
import type { LaunchVerdict } from '../../../routing-policy/src/launch-boundary.js'
import { verifyLaunch } from '../../../routing-policy/src/launch-boundary.js'
import type {
  FallbackHandoffRecord,
  HandoffEvent,
  RouteRequest,
} from '../../../routing-policy/src/pi-resolver.js'
import {
  buildFallbackHandoff,
  piModelContractFor,
  resolveRoute as resolvePiRoute,
} from '../../../routing-policy/src/pi-resolver.js'
import type {
  OpenRouterProviderConstraints,
  PiModelContract,
  RefusalEntry,
  RouteReceipt,
} from '../../../routing-policy/src/route-receipt.js'
import type {
  ClassName,
  LaneId,
  ProviderName,
  RoutingPolicy,
  ThinkingLevelName,
} from '../../../routing-policy/src/types.js'
import {
  CLASS_NAMES,
  THINKING_DEFAULT_BY_CLASS,
  THINKING_LEVELS,
} from '../../../routing-policy/src/types.js'

/**
 * A1.2: the pinned policy ref, checked for equality against
 * `decision.policy_digest.version` exactly as MRC-05 authors it
 * (`POLICY_PLUGIN_PATH` in dispatch/src/routing-eval). One ref source; the
 * content digest is the raw-bytes SHA-256 of the supplied `policyText` — one
 * formula, never a second digest scheme (Stop rule 4).
 */
export const POLICY_REF_PIN = 'routing-policy/routing-policy.yaml'

/**
 * Entry-domain refusal vocabulary (the `LAUNCH_REFUSALS` precedent,
 * routing-policy/src/route-receipt.ts): every name this module itself can emit.
 * Exhaustively enumerated by control in tests/pi-entry.test.ts (RB-5 pattern).
 * Resolver stop names and `LAUNCH_REFUSALS` names ride the typed outcomes
 * carried through unchanged and are never listed here.
 */
export const PI_ENTRY_REFUSALS = [
  'HOST_PROVIDER_UNREGISTERED_REFUSED',
  'HOST_ENDPOINT_DIVERGENT_REFUSED',
  'HOST_MODEL_NOT_ENABLED_REFUSED',
  'IDENTITY_MISMATCH_REFUSED',
  'SELECTION_MISMATCH_REFUSED',
  'HOST_MODEL_UNBOUND_REFUSED',
  'HOST_MODEL_MISMATCH_REFUSED',
  'UNDECLARED_FALLBACK_REFUSED',
  'FALLBACK_EXHAUSTED_REFUSED',
  'RECORD_EXISTS_REFUSED',
] as const

export type PiEntryRefusalName = (typeof PI_ENTRY_REFUSALS)[number]

/** Closed code union for thrown mis-wire errors (the DispatchError pattern). */
export type PiEntryErrorCode =
  | 'POLICY_INVALID'
  | 'POLICY_DIGEST_MISMATCH'
  | 'REQUIREMENT_MISMATCH'
  | 'UNDECLARED_FALLBACK_REFUSED'
  | 'ROOT_NOT_ABSOLUTE'
  | 'ROOT_CONTAINMENT_REFUSED'
  | 'RECORD_EXISTS_REFUSED'
  | 'RECORD_WRITE_FAILED'

export class PiEntryError extends Error {
  readonly code: PiEntryErrorCode

  constructor(code: PiEntryErrorCode, message: string) {
    super(message)
    this.name = 'PiEntryError'
    this.code = code
  }
}

// ─── Typed shapes (C1-C6) ────────────────────────────────────────────────────

export interface PiEntryParcel {
  readonly ref: string
  readonly path: string
  readonly text: string
}

/** The opaque-carried parcel (C5.1): text is byte-exact, sha256 over those bytes. */
export interface CarriedParcel {
  readonly ref: string
  readonly path: string
  readonly text: string
  readonly sha256: string
}

export interface PiEntryInput {
  readonly parcel: PiEntryParcel
  /** The exact routing-policy bytes the decision was made under (C1.4). */
  readonly policyText: string
  /** MRC-05's decision record — the recorded authority (C1.5/D7). */
  readonly decision: ReplayBindings
  readonly routeRequest: RouteRequest
  readonly hostSettings: HostSettingsSnapshot
  /** The owner-accepted freshness bound for this launch (rubric R6). */
  readonly max_age_ms: number
}

export interface PiEntryOptions {
  /** Injected clock (ISO-8601). The entry performs no time reads. */
  readonly now: () => string
}

/** MRC-05 C5's resolved thinking level, carried as data (A1.4/H-PI hold). */
export interface ResolvedThinkingLevel {
  readonly value: ThinkingLevelName
  readonly source: 'decision-resolved' | 'class-default'
}

export interface SessionRequest {
  readonly lane: LaneId
  readonly registry_key: string
  readonly host_model_id: string
  readonly provider_local_id: string | null
  readonly protocol: string | null
  readonly thinking_level: ResolvedThinkingLevel
  readonly route_receipt_id: string
}

/** The bridged session identity: contract values, never derived (C3.1). */
export interface PiEntryIdentity {
  readonly registry_key: string
  readonly host_model_id: string
  readonly provider_local_id: string | null
  readonly protocol: string | null
}

export type ConfigCheckState = 'passed' | 'refused' | 'not-applicable'

/** C2's three read-only checks; an unchecked claim is 'not-applicable', never 'passed'. */
export interface HostConfigVerdict {
  readonly provider_registration: ConfigCheckState
  readonly endpoint_conformance: ConfigCheckState
  readonly model_enablement: ConfigCheckState
  readonly refusals: readonly RefusalEntry[]
}

export interface HostSelectionObservation {
  readonly host_model_id: string
}

export type SelectionVerdict =
  | { readonly status: 'match' }
  | { readonly status: 'refused'; readonly refusals: readonly RefusalEntry[] }

export interface RouteUnavailableOutcome {
  readonly code: 'ROUTE_UNAVAILABLE'
  readonly parcelRef: string
  readonly requested: { readonly lane: LaneId; readonly registry_key: string | null }
  readonly attempted: readonly {
    readonly identity: string
    readonly refusals: readonly RefusalEntry[]
  }[]
  readonly refusals: readonly RefusalEntry[]
  readonly reason: string
  readonly hold: 'parcel-held'
}

export interface PiEntryPackage {
  readonly receipt: RouteReceipt
  readonly sessionRequest: SessionRequest | null
  readonly parcel: CarriedParcel
  readonly identity: PiEntryIdentity | null
  /** The durable handoff record for the transition that produced this entry (null on the primary entry; the declared plan rides receipt.fallback_handoff). */
  readonly fallbackHandoff: FallbackHandoffRecord | null
  readonly verdicts: {
    readonly launch: LaunchVerdict | null
    readonly host_config: HostConfigVerdict | null
  }
  // Record-carrier context (writePiEntryRecord receives only the result) and
  // transition context (useDeclaredFallback re-validates against it). Only the
  // PiEntryRecord's enumerated fields are ever serialized — no host data, no
  // secret, no host path in the record (C5.3/D2).
  readonly decision: ReplayBindings
  readonly policy: { readonly version: string; readonly content_digest: string }
  readonly policyDocument: RoutingPolicy
  readonly hostSettings: HostSettingsSnapshot
  readonly max_age_ms: number
  readonly created_at: string
}

export type PiEntryResult =
  | { readonly status: 'launchable'; readonly package: PiEntryPackage }
  | {
      readonly status: 'route-unavailable'
      readonly package: PiEntryPackage
      readonly outcome: RouteUnavailableOutcome
    }

export interface PiEntryRecord {
  readonly kind: 'pi-entry-record'
  readonly schema_version: 1
  readonly status: 'launchable' | 'route-unavailable'
  readonly parcel: CarriedParcel
  readonly policy: { readonly version: string; readonly content_digest: string }
  readonly decision_bindings: ReplayBindings
  readonly route_receipt: RouteReceipt
  readonly session_request: SessionRequest | null
  readonly outcome: RouteUnavailableOutcome | null
  readonly host_config_verdict: HostConfigVerdict | null
  readonly fallback_handoff: FallbackHandoffRecord | null
  readonly created_at: string
}

// ─── Internal helpers ────────────────────────────────────────────────────────

function sha256Text(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex')
}

function parsePolicyDocument(policyText: string): RoutingPolicy {
  let parsed: unknown
  try {
    parsed = parse(policyText)
  } catch (err) {
    throw new PiEntryError('POLICY_INVALID', `policy bytes do not parse as YAML: ${String(err)}`)
  }
  const validation = validatePolicy(parsed)
  if (!validation.valid) {
    throw new PiEntryError(
      'POLICY_INVALID',
      `policy document failed validatePolicy: ${validation.errors.join('; ')}`,
    )
  }
  return parsed as RoutingPolicy
}

/** Exact, order-sensitive list equality; absent<->absent passes (C1.5). */
function sameStrings(
  requested: readonly string[] | undefined,
  recorded: readonly string[] | undefined,
): boolean {
  if (requested === undefined || recorded === undefined) return requested === recorded
  return (
    requested.length === recorded.length &&
    requested.every((entry, index) => entry === recorded[index])
  )
}

/**
 * C1.5 effective-requirements consistency: the decision record is the recorded
 * authority; the entry never repairs, averages, or silently re-derives a
 * requirement. A1.3: a cross-version record (pre-carry vs post-carry shape)
 * refuses right here, naming `effective_requirements` — the entry-level surface
 * of MRC-05 C4.5; no separate cross-version mechanism exists inside the entry.
 */
function checkRequirements(request: RouteRequest, decision: ReplayBindings): void {
  const recorded = decision.effective_requirements
  // D8's "omitted = ['text']" equivalence is the two systems' shared default;
  // it is never re-derived here — exact match only (canonical order).
  if (!sameStrings(request.required_inputs, recorded.required_inputs)) {
    throw new PiEntryError(
      'REQUIREMENT_MISMATCH',
      `effective_requirements.required_inputs mismatch: route request ${JSON.stringify(request.required_inputs ?? null)} vs decision ${JSON.stringify(recorded.required_inputs ?? null)} (canonical INPUT_MODALITIES order; never re-ordered or re-derived here)`,
    )
  }
  if (request.required_thinking_level !== recorded.required_thinking_level) {
    throw new PiEntryError(
      'REQUIREMENT_MISMATCH',
      `effective_requirements.required_thinking_level mismatch: route request ${JSON.stringify(request.required_thinking_level ?? null)} vs decision ${JSON.stringify(recorded.required_thinking_level ?? null)}`,
    )
  }
  // C3.4: the resolved level is validated against the closed THINKING_LEVELS
  // vocabulary here, before any resolve-time use.
  if (
    recorded.required_thinking_level !== undefined &&
    !(THINKING_LEVELS as readonly string[]).includes(recorded.required_thinking_level)
  ) {
    throw new PiEntryError(
      'REQUIREMENT_MISMATCH',
      `effective_requirements.required_thinking_level '${recorded.required_thinking_level}' is not a member of the closed THINKING_LEVELS vocabulary`,
    )
  }
  if (request.expertise !== recorded.expertise) {
    throw new PiEntryError(
      'REQUIREMENT_MISMATCH',
      `effective_requirements.expertise mismatch: route request ${JSON.stringify(request.expertise ?? null)} vs decision ${JSON.stringify(recorded.expertise ?? null)}`,
    )
  }
  // C3.4 floors (D7 authority): upward-only; a null bound accepts the caller's
  // value (unknown stays unknown, never imputed).
  const boundContext = decision.derived_context_floor.required_context_tokens
  if (boundContext !== null && request.required_context_tokens < boundContext) {
    throw new PiEntryError(
      'REQUIREMENT_MISMATCH',
      `derived_context_floor.required_context_tokens mismatch: route request ${request.required_context_tokens} is below the decision's bound floor ${boundContext} (upward-only)`,
    )
  }
  const boundOutput = decision.derived_context_floor.required_output_tokens
  if (boundOutput !== null && request.required_output_tokens < boundOutput) {
    throw new PiEntryError(
      'REQUIREMENT_MISMATCH',
      `derived_context_floor.required_output_tokens mismatch: route request ${request.required_output_tokens} is below the decision's bound floor ${boundOutput} (upward-only)`,
    )
  }
}

/**
 * C3.4 (A1.4): the decision's resolved thinking level is the session authority;
 * the single named fallback formula is MRC-05 C2.2's THINKING_DEFAULT_BY_CLASS;
 * the charter matrix's thinking_level is design input only. Carried as data —
 * the launcher applies it where the plane supports it (H-PI mapping held).
 */
function resolveThinkingLevel(decision: ReplayBindings): ResolvedThinkingLevel {
  const bound = decision.effective_requirements.required_thinking_level
  if (bound !== undefined) {
    // Checked by the closed-vocabulary membership guard below (C3.4).
    const resolved = bound as ThinkingLevelName
    if (!(THINKING_LEVELS as readonly string[]).includes(resolved)) {
      throw new PiEntryError(
        'REQUIREMENT_MISMATCH',
        `effective_requirements.required_thinking_level '${bound}' is not a member of the closed THINKING_LEVELS vocabulary`,
      )
    }
    return { value: resolved, source: 'decision-resolved' }
  }
  const routingClass = decision.effective_requirements.routing_class
  if (!(CLASS_NAMES as readonly string[]).includes(routingClass)) {
    throw new PiEntryError(
      'REQUIREMENT_MISMATCH',
      `effective_requirements.routing_class '${routingClass}' is not a closed ClassName; no resolved thinking level and no class default can be established`,
    )
  }
  // Checked by the ClassName membership guard above (MRC-05 C2.2's formula).
  const className = routingClass as ClassName
  return { value: THINKING_DEFAULT_BY_CLASS[className], source: 'class-default' }
}

/**
 * C3.1 identity bridge (D2 distinct-values; per-field exact): the decision's
 * SelectedIdentity maps field-for-field onto the approved route's
 * PiModelContract — registry_key<->registry_key,
 * pi_host_model_id<->opencode_id (HRO-P0 §1.2's Pi-host-identifier
 * designation), provider_local_id<->provider_local_id, protocol<->protocol,
 * null<->null. Any divergence (including null<->value) refuses; values are
 * never filled in, normalized, or derived.
 */
function bridgeRefusals(selected: SelectedIdentity, contract: PiModelContract): RefusalEntry[] {
  const pairs: readonly (readonly [string, string | null, string | null, string])[] = [
    ['registry_key', selected.registry_key, contract.registry_key, 'registry_key'],
    ['pi_host_model_id', selected.pi_host_model_id, contract.opencode_id, 'opencode_id'],
    [
      'provider_local_id',
      selected.provider_local_id,
      contract.provider_local_id,
      'provider_local_id',
    ],
    ['protocol', selected.protocol, contract.protocol, 'protocol'],
  ]
  const refusals: RefusalEntry[] = []
  for (const [field, recorded, mapped, contractField] of pairs) {
    if (recorded !== mapped) {
      refusals.push({
        name: 'IDENTITY_MISMATCH_REFUSED',
        detail: `decision selected_identity.${field} ${JSON.stringify(recorded)} does not equal the approved route PiModelContract.${contractField} ${JSON.stringify(mapped)} (D2 distinct values: exact string equality within one namespace, null<->null; never derived, normalized, or aliased)`,
      })
    }
  }
  return refusals
}

/**
 * C2 host-configuration validation — read-only over the supplied snapshot (the
 * input seam stands in for the launcher's host read; ruling D: validate-only).
 */
function validateHostConfig(
  hostSettings: HostSettingsSnapshot,
  identity: { readonly provider: ProviderName; readonly model: string },
  contractedEndpoint: OpenRouterProviderConstraints | null,
): HostConfigVerdict {
  const refusals: RefusalEntry[] = []

  // 1. Provider registration.
  const registered = hostSettings.providers.find((entry) => entry.providerKey === identity.provider)
  let registration: ConfigCheckState = 'passed'
  if (registered === undefined) {
    registration = 'refused'
    refusals.push({
      name: 'HOST_PROVIDER_UNREGISTERED_REFUSED',
      detail: `host settings register no provider '${identity.provider}'; the host cannot serve the approved route`,
    })
  }

  // 2. Endpoint conformance (the SCF-3 comparator). For a route whose receipt
  // carries no contracted endpoint, no endpoint claim is made — the verdict
  // records 'not-applicable', never 'passed' (unknown stays unknown).
  let endpoint: ConfigCheckState = 'not-applicable'
  if (contractedEndpoint !== null && identity.provider === 'openrouter') {
    if (registered !== undefined && registered.baseUrl !== contractedEndpoint.base_url) {
      endpoint = 'refused'
      refusals.push({
        name: 'HOST_ENDPOINT_DIVERGENT_REFUSED',
        detail: `host provider 'openrouter' baseUrl '${registered.baseUrl}' diverges from the receipt's contracted base_url '${contractedEndpoint.base_url}' (SCF-3 comparator)`,
      })
    } else if (registered !== undefined) {
      // 'passed' only when a baseUrl comparison actually ran; unregistered
      // keeps the claim 'not-applicable' (HostConfigVerdict's invariant).
      endpoint = 'passed'
    }
  }

  // 3. Model enablement. A1.5: the `provider:model` enablement spelling is
  // composed INLINE from the receipt's own bound provider/model values —
  // deliberate duplication of hostSpelling's documented rule
  // (routing-policy/src/host-settings-proposal.ts is module-private and outside
  // this parcel's write set; the receipts-validators inline-vocabulary
  // precedent). A lookup spelling is never derived from a registry key or host
  // id; reproduction is pinned by the STOP-6 parity control against the
  // committed PROPOSED artifact's enabledModels add values.
  const spelling = `${identity.provider}:${identity.model}`
  let enablement: ConfigCheckState = 'passed'
  if (!hostSettings.enabledModels.includes(spelling)) {
    enablement = 'refused'
    refusals.push({
      name: 'HOST_MODEL_NOT_ENABLED_REFUSED',
      detail: `host-enabled spelling '${spelling}' is not a member of enabledModels`,
    })
  }

  return {
    provider_registration: registration,
    endpoint_conformance: endpoint,
    model_enablement: enablement,
    refusals,
  }
}

/** Declared-values lookup by binding id — never derivation from the id. */
function findBinding(
  policy: RoutingPolicy,
  bindingId: string,
): { readonly provider: ProviderName; readonly model: string } | null {
  const root: unknown = policy
  if (typeof root !== 'object' || root === null || !('candidates' in root)) return null
  const candidates: unknown = root.candidates
  if (typeof candidates !== 'object' || candidates === null) return null
  for (const candidate of Object.values(candidates)) {
    if (typeof candidate !== 'object' || candidate === null || !('bindings' in candidate)) continue
    const bindings: unknown = candidate.bindings
    if (!Array.isArray(bindings)) continue
    for (const raw of bindings) {
      if (typeof raw !== 'object' || raw === null) continue
      if (!('id' in raw) || !('provider' in raw) || !('model' in raw)) continue
      if (raw.id !== bindingId) continue
      if (typeof raw.provider !== 'string' || typeof raw.model !== 'string') continue
      if (raw.provider !== 'opencode' && raw.provider !== 'openrouter') continue
      return { provider: raw.provider, model: raw.model }
    }
  }
  return null
}

interface EntryContext {
  readonly parcel: CarriedParcel
  readonly policy: { readonly version: string; readonly content_digest: string }
  readonly decision: ReplayBindings
  readonly policyDocument: RoutingPolicy
  readonly hostSettings: HostSettingsSnapshot
  readonly max_age_ms: number
  readonly created_at: string
}

function makeUnavailable(
  context: EntryContext,
  receipt: RouteReceipt,
  verdicts: PiEntryPackage['verdicts'],
  fallbackHandoff: FallbackHandoffRecord | null,
  outcome: RouteUnavailableOutcome,
): PiEntryResult {
  return {
    status: 'route-unavailable',
    package: {
      receipt,
      sessionRequest: null,
      parcel: context.parcel,
      identity: null,
      fallbackHandoff,
      verdicts,
      decision: context.decision,
      policy: context.policy,
      policyDocument: context.policyDocument,
      hostSettings: context.hostSettings,
      max_age_ms: context.max_age_ms,
      created_at: context.created_at,
    },
    outcome,
  }
}

function outcomeFor(
  context: EntryContext,
  requestedLane: LaneId,
  attempted: readonly { readonly identity: string; readonly refusals: readonly RefusalEntry[] }[],
  refusals: readonly RefusalEntry[],
  reason: string,
): RouteUnavailableOutcome {
  return {
    code: 'ROUTE_UNAVAILABLE',
    parcelRef: context.parcel.ref,
    requested: {
      lane: requestedLane,
      registry_key: context.decision.selected_identity.registry_key,
    },
    attempted,
    refusals,
    reason,
    hold: 'parcel-held',
  }
}

// ─── The entry (C1-C3) ───────────────────────────────────────────────────────

/**
 * preparePiEntry (C1): pure — documents in, typed verdicts out. Each step's
 * failure is typed and bounded; the launch package is emitted only when every
 * step agrees. Mis-wire errors (policy/requirement problems) throw
 * PiEntryError; cannot-launch terminals are RETURNED as RouteUnavailableOutcome
 * (batch semantics: never a crash, never a silent substitution).
 */
export function preparePiEntry(input: PiEntryInput, options: PiEntryOptions): PiEntryResult {
  // (1) Policy bytes: one digest formula, one pinned ref (C1.4/A1.2), then
  // parse + validatePolicy — both consumed as-is, never re-implemented.
  const content_digest = sha256Text(input.policyText)
  if (content_digest !== input.decision.policy_digest.content_digest) {
    throw new PiEntryError(
      'POLICY_DIGEST_MISMATCH',
      `supplied policy bytes digest '${content_digest}' does not match the decision's bound digest '${input.decision.policy_digest.content_digest}' — the entry never resolves a route against policy bytes other than the ones the decision was made under`,
    )
  }
  if (input.decision.policy_digest.version !== POLICY_REF_PIN) {
    throw new PiEntryError(
      'POLICY_DIGEST_MISMATCH',
      `decision policy_digest.version '${input.decision.policy_digest.version}' is not the pinned policy ref '${POLICY_REF_PIN}' (A1.2)`,
    )
  }
  const policyDocument = parsePolicyDocument(input.policyText)

  // (2) Effective-requirements consistency (C1.5).
  checkRequirements(input.routeRequest, input.decision)

  const context: EntryContext = {
    parcel: {
      ref: input.parcel.ref,
      path: input.parcel.path,
      text: input.parcel.text,
      sha256: sha256Text(input.parcel.text),
    },
    policy: { version: input.decision.policy_digest.version, content_digest },
    decision: input.decision,
    policyDocument,
    hostSettings: input.hostSettings,
    max_age_ms: input.max_age_ms,
    created_at: options.now(),
  }

  // (3) Resolve (consumed unchanged; injected clock). A stop receipt is the C6
  // terminal — never a launch.
  const receipt = resolvePiRoute(policyDocument, input.routeRequest, {
    issued_at: options.now(),
  })
  if (receipt.status === 'stop') {
    return makeUnavailable(
      context,
      receipt,
      { launch: null, host_config: null },
      null,
      outcomeFor(
        context,
        input.routeRequest.lane,
        [],
        receipt.stops,
        `the resolver refused the requested route (${receipt.stops.map((stop) => stop.name).join(', ')}); the parcel is held (D8: continue independent parcels; never crash the batch)`,
      ),
    )
  }

  // (4) Launch boundary (consumed unchanged; injected clock).
  const launch = verifyLaunch(receipt, {
    requested_lane: input.routeRequest.lane,
    at: options.now(),
    max_age_ms: input.max_age_ms,
  })
  if (!launch.ok) {
    return makeUnavailable(
      context,
      receipt,
      { launch, host_config: null },
      null,
      outcomeFor(
        context,
        input.routeRequest.lane,
        [],
        launch.refusals,
        `the launch boundary refused the approved route receipt (${launch.refusals.map((refusal) => refusal.name).join(', ')}); the parcel is held (A1: only a boundary-clean approved receipt authorizes a session)`,
      ),
    )
  }

  const route = receipt.route
  if (route === null) {
    return makeUnavailable(
      context,
      receipt,
      { launch, host_config: null },
      null,
      outcomeFor(
        context,
        input.routeRequest.lane,
        [],
        [{ name: 'RECEIPT_STATUS_REFUSED', detail: 'approved receipt carries no route' }],
        'the approved route receipt carries no route; the parcel is held',
      ),
    )
  }
  const contract = route.pi_model_contract

  // (5) Identity bridge + decision agreement (C3.1-C3.2) — both halves are
  // evaluated and every named refusal rides the outcome; the launch package is
  // emitted only when both halves agree.
  // A1.1 (namespace-consistent): the approved route's chosen identity in the
  // registry-key namespace — its own bound PiModelContract.registry_key — is
  // the decision's selected identity. The literal `receipt.selection.chosen` is
  // the binding-id namespace (`${provider}/${model}`) and would itself be the
  // C4.4 aliasing the rule forbids. A registry_key disagreement refuses as
  // SELECTION_MISMATCH_REFUSED carrying REPLAY_REFUSED/selected_identity
  // (A1.1's negative control) and, as a distinct contract item, as
  // IDENTITY_MISMATCH_REFUSED (C3.1's per-field bridge).
  const bridge = bridgeRefusals(input.decision.selected_identity, contract)
  const agreement = verifyExecutedIdentity(input.decision, contract.registry_key)
  const identityRefusals: RefusalEntry[] = [...bridge]
  if (agreement.status === 'refused') {
    identityRefusals.push({
      name: 'SELECTION_MISMATCH_REFUSED',
      detail: `verifyExecutedIdentity refused: ${agreement.refusal.code}/${agreement.refusal.binding}: ${agreement.refusal.detail}`,
    })
  }
  if (identityRefusals.length > 0) {
    return makeUnavailable(
      context,
      receipt,
      { launch, host_config: null },
      null,
      outcomeFor(
        context,
        input.routeRequest.lane,
        [{ identity: contract.registry_key, refusals: identityRefusals }],
        identityRefusals,
        `the approved route's identity does not reconcile with the dispatch decision (${identityRefusals.map((refusal) => refusal.name).join(', ')}); the parcel is held (decision-as-authority; D2: values are never derived, normalized, or aliased)`,
      ),
    )
  }
  if (contract.opencode_id === null) {
    const refusal: RefusalEntry = {
      name: 'HOST_MODEL_UNBOUND_REFUSED',
      detail: `approved route identity '${contract.registry_key}' carries no Pi host model id (opencode_id is null); the session cannot be told which host model to select (fail closed)`,
    }
    return makeUnavailable(
      context,
      receipt,
      { launch, host_config: null },
      null,
      outcomeFor(
        context,
        input.routeRequest.lane,
        [{ identity: contract.registry_key, refusals: [refusal] }],
        [refusal],
        'the approved route identity is unbound in the host namespace; the parcel is held (fail closed)',
      ),
    )
  }

  // (6) Host-configuration validation (C2) — read-only, never a write.
  const hostConfig = validateHostConfig(
    input.hostSettings,
    { provider: route.provider, model: route.primary.model },
    route.openrouter_constraints,
  )
  if (hostConfig.refusals.length > 0) {
    return makeUnavailable(
      context,
      receipt,
      { launch, host_config: hostConfig },
      null,
      outcomeFor(
        context,
        input.routeRequest.lane,
        [{ identity: contract.registry_key, refusals: hostConfig.refusals }],
        hostConfig.refusals,
        `the host configuration cannot serve the approved route (${hostConfig.refusals.map((refusal) => refusal.name).join(', ')}); the parcel is held (ruling D: validate-only — no repair, no proposal here)`,
      ),
    )
  }

  // (7) Launch package.
  const sessionRequest: SessionRequest = {
    lane: input.routeRequest.lane,
    registry_key: contract.registry_key,
    host_model_id: contract.opencode_id,
    provider_local_id: contract.provider_local_id,
    protocol: contract.protocol,
    thinking_level: resolveThinkingLevel(input.decision),
    route_receipt_id: receipt.receipt_id,
  }
  const identity: PiEntryIdentity = {
    registry_key: contract.registry_key,
    host_model_id: contract.opencode_id,
    provider_local_id: contract.provider_local_id,
    protocol: contract.protocol,
  }
  return {
    status: 'launchable',
    package: {
      receipt,
      sessionRequest,
      parcel: context.parcel,
      identity,
      fallbackHandoff: null,
      verdicts: { launch, host_config: hostConfig },
      decision: context.decision,
      policy: context.policy,
      policyDocument: context.policyDocument,
      hostSettings: context.hostSettings,
      max_age_ms: context.max_age_ms,
      created_at: context.created_at,
    },
  }
}

// ─── Declared fallback (C4) ──────────────────────────────────────────────────

/**
 * useDeclaredFallback (C4): the ONLY permitted route change at the entry — to
 * the receipt's single declared typed fallback (primary-degraded) or to a new
 * recorded cross-provider attempt (D3), each through buildFallbackHandoff's
 * declared-pair rule (consumed unchanged; any out-of-pair transition fails the
 * call and authorizes nothing). The returned entry re-runs C2 and C3 against
 * the transition identity and emits a fresh sessionRequest.
 *
 * A1 discipline: the fallback/cross-provider session is itself a session — it
 * is authorized only by a boundary-clean approved receipt. The entry document
 * is a caller-supplied seam and may be stale, tampered, or lane-mismatched
 * since preparePiEntry produced it (defense in depth: verifyLaunch is called,
 * never re-implemented).
 */
export function useDeclaredFallback(
  entry: PiEntryPackage,
  event: HandoffEvent,
  options: PiEntryOptions,
): PiEntryResult {
  if (entry.sessionRequest === null) {
    throw new PiEntryError(
      'UNDECLARED_FALLBACK_REFUSED',
      'useDeclaredFallback: the entry carries no launched session (route-unavailable entry); a fallback transition authorizes nothing',
    )
  }
  const context: EntryContext = {
    parcel: entry.parcel,
    policy: entry.policy,
    decision: entry.decision,
    policyDocument: entry.policyDocument,
    hostSettings: entry.hostSettings,
    max_age_ms: entry.max_age_ms,
    created_at: options.now(),
  }
  const requestedLane = entry.sessionRequest.lane

  const launch = verifyLaunch(entry.receipt, {
    requested_lane: requestedLane,
    at: context.created_at,
    max_age_ms: entry.max_age_ms,
  })
  if (!launch.ok) {
    return makeUnavailable(
      context,
      entry.receipt,
      { launch, host_config: null },
      null,
      outcomeFor(
        context,
        requestedLane,
        entry.identity === null
          ? []
          : [{ identity: entry.identity.registry_key, refusals: launch.refusals }],
        launch.refusals,
        `the launch boundary refused the entry's route receipt (${launch.refusals.map((refusal) => refusal.name).join(', ')}); no transition is authorized and the parcel is held`,
      ),
    )
  }

  let record: FallbackHandoffRecord
  try {
    record = buildFallbackHandoff(entry.receipt, event, { issued_at: context.created_at })
  } catch (err) {
    throw new PiEntryError(
      'UNDECLARED_FALLBACK_REFUSED',
      `handoff event '${event.kind}' naming binding '${event.binding_id}' is outside the receipt's declared pair — nothing authorized (${String(err)})`,
    )
  }

  const route = entry.receipt.route
  if (route === null) {
    throw new PiEntryError(
      'UNDECLARED_FALLBACK_REFUSED',
      'useDeclaredFallback: the entry receipt carries no route; a fallback transition authorizes nothing',
    )
  }

  // C4.2: fallback exhaustion is terminal — both failed, stop-and-report.
  if (event.kind === 'fallback-failed') {
    const fallbackContract = piModelContractFor({
      provider: route.provider,
      model: route.fallback.model,
    })
    const refusal: RefusalEntry = {
      name: 'FALLBACK_EXHAUSTED_REFUSED',
      detail: `declared fallback '${event.binding_id}' failed (${event.observed}); primary and the one declared fallback are exhausted (charter D8: if both fail, the parcel stops and reports)`,
    }
    return makeUnavailable(
      context,
      entry.receipt,
      { launch, host_config: null },
      record,
      outcomeFor(
        context,
        requestedLane,
        [
          {
            identity: fallbackContract?.registry_key ?? event.binding_id,
            refusals: [refusal],
          },
        ],
        [refusal],
        'the primary and its one declared fallback both failed; the parcel is stopped and reported (charter D8) — no recovery ladder exists here (MRC-08)',
      ),
    )
  }

  // The transition identity: the declared fallback (primary-degraded) or the
  // named cross-provider primary — a NEW recorded attempt (D3), never a silent
  // mid-turn continuation (record.continuation === 'refused-mid-turn').
  let target: { readonly provider: ProviderName; readonly model: string }
  if (event.kind === 'primary-degraded') {
    target = { provider: route.provider, model: route.fallback.model }
  } else {
    const binding = findBinding(entry.policyDocument, event.binding_id)
    if (binding === null) {
      throw new PiEntryError(
        'UNDECLARED_FALLBACK_REFUSED',
        `handoff event 'cross-provider-attempt' names binding '${event.binding_id}', which the policy document does not declare — nothing authorized`,
      )
    }
    target = binding
  }
  const contract = piModelContractFor({ provider: target.provider, model: target.model })
  if (contract === null || contract.opencode_id === null) {
    const refusal: RefusalEntry = {
      name: 'HOST_MODEL_UNBOUND_REFUSED',
      detail: `transition identity '${target.provider}:${target.model}' carries no Pi host model id; the session cannot be told which host model to select (fail closed)`,
    }
    return makeUnavailable(
      context,
      entry.receipt,
      { launch, host_config: null },
      record,
      outcomeFor(
        context,
        requestedLane,
        [{ identity: `${target.provider}:${target.model}`, refusals: [refusal] }],
        [refusal],
        'the transition identity is unbound in the host namespace; the parcel is held (fail closed)',
      ),
    )
  }

  // C2 re-validation against the transition identity (the same three read-only
  // checks; the contracted endpoint claim applies to the identity's own
  // provider only — unknown stays unknown).
  const hostConfig = validateHostConfig(
    entry.hostSettings,
    target,
    target.provider === 'openrouter' ? route.openrouter_constraints : null,
  )
  if (hostConfig.refusals.length > 0) {
    return makeUnavailable(
      context,
      entry.receipt,
      { launch, host_config: hostConfig },
      record,
      outcomeFor(
        context,
        requestedLane,
        [{ identity: contract.registry_key, refusals: hostConfig.refusals }],
        hostConfig.refusals,
        `the host configuration cannot serve the transition identity (${hostConfig.refusals.map((refusal) => refusal.name).join(', ')}); the parcel is held (ruling D: validate-only)`,
      ),
    )
  }

  const sessionRequest: SessionRequest = {
    lane: requestedLane,
    registry_key: contract.registry_key,
    host_model_id: contract.opencode_id,
    provider_local_id: contract.provider_local_id,
    protocol: contract.protocol,
    // The decision's resolved thinking level governs every session of this
    // entry (A1.4) — carried as data, never applied here (H-PI hold).
    thinking_level: entry.sessionRequest.thinking_level,
    route_receipt_id: entry.receipt.receipt_id,
  }
  const identity: PiEntryIdentity = {
    registry_key: contract.registry_key,
    host_model_id: contract.opencode_id,
    provider_local_id: contract.provider_local_id,
    protocol: contract.protocol,
  }
  return {
    status: 'launchable',
    package: {
      receipt: entry.receipt,
      sessionRequest,
      parcel: entry.parcel,
      identity,
      fallbackHandoff: record,
      verdicts: { launch, host_config: hostConfig },
      decision: entry.decision,
      policy: entry.policy,
      policyDocument: entry.policyDocument,
      hostSettings: entry.hostSettings,
      max_age_ms: entry.max_age_ms,
      created_at: context.created_at,
    },
  }
}

// ─── Host selection (C3.3) ───────────────────────────────────────────────────

/**
 * verifyHostModelSelection (C3.3): validates the ACTUAL host selection by
 * exact string equality in the host namespace. A registry-key or
 * provider-local-id match never passes as a host-id match (the C4.4
 * no-aliasing rule applied to the host namespace).
 */
export function verifyHostModelSelection(
  entry: PiEntryPackage,
  observed: HostSelectionObservation,
): SelectionVerdict {
  const request = entry.sessionRequest
  if (request === null) {
    return {
      status: 'refused',
      refusals: [
        {
          name: 'HOST_MODEL_UNBOUND_REFUSED',
          detail:
            'the entry carries no session request (route-unavailable entry); the host selection cannot be validated',
        },
      ],
    }
  }
  if (observed.host_model_id === request.host_model_id) {
    return { status: 'match' }
  }
  return {
    status: 'refused',
    refusals: [
      {
        name: 'HOST_MODEL_MISMATCH_REFUSED',
        detail: `observed host model id ${JSON.stringify(observed.host_model_id)} does not equal the session request's host model id ${JSON.stringify(request.host_model_id)} (exact string equality in the host namespace; a registry-key or provider-local-id match never passes as a host-id match)`,
      },
    ],
  }
}

// ─── The entry record (C5) ───────────────────────────────────────────────────

function buildRecord(result: PiEntryResult): PiEntryRecord {
  const entry = result.package
  return {
    kind: 'pi-entry-record',
    schema_version: 1,
    status: result.status,
    parcel: entry.parcel,
    policy: entry.policy,
    decision_bindings: entry.decision,
    route_receipt: entry.receipt,
    session_request: entry.sessionRequest,
    outcome: result.status === 'route-unavailable' ? result.outcome : null,
    host_config_verdict: entry.verdicts.host_config,
    fallback_handoff: entry.fallbackHandoff,
    created_at: entry.created_at,
  }
}

/**
 * writePiEntryRecord (C5.4) — the ONLY write in this parcel. Guard-first I/O
 * (absolute root + containment before any fs work), refuse-on-collision
 * (RECORD_EXISTS_REFUSED), and an atomic temp-file-in-target-directory +
 * rename; on any failure the temp is removed and the target left absent — no
 * partial output. The record carries no secret, credential, or host path.
 */
export function writePiEntryRecord(
  result: PiEntryResult,
  recordPath: string,
  options: { readonly repoRoot: string },
): PiEntryRecord {
  if (!isAbsolute(options.repoRoot)) {
    throw new PiEntryError(
      'ROOT_NOT_ABSOLUTE',
      `writePiEntryRecord: repoRoot '${options.repoRoot}' is not absolute`,
    )
  }
  if (!isAbsolute(recordPath)) {
    throw new PiEntryError(
      'ROOT_NOT_ABSOLUTE',
      `writePiEntryRecord: recordPath '${recordPath}' is not absolute`,
    )
  }
  const containment = relative(options.repoRoot, recordPath)
  if (containment === '' || containment.startsWith('..') || isAbsolute(containment)) {
    throw new PiEntryError(
      'ROOT_CONTAINMENT_REFUSED',
      `writePiEntryRecord: recordPath '${recordPath}' resolves outside repoRoot and is refused`,
    )
  }
  const record = buildRecord(result)
  if (existsSync(recordPath)) {
    throw new PiEntryError(
      'RECORD_EXISTS_REFUSED',
      `writePiEntryRecord: refusing to overwrite existing entry record at '${recordPath}'`,
    )
  }
  const targetDir = dirname(recordPath)
  const tempPath = join(targetDir, `.${basename(recordPath)}.tmp`)
  try {
    mkdirSync(targetDir, { recursive: true })
    writeFileSync(tempPath, `${JSON.stringify(record, null, 2)}\n`, { flag: 'wx' })
    renameSync(tempPath, recordPath)
  } catch (err) {
    const failedCode =
      typeof err === 'object' && err !== null && 'code' in err ? err.code : undefined
    if (failedCode !== 'EEXIST') {
      try {
        unlinkSync(tempPath)
      } catch {
        // The temp was never created; there is nothing to remove.
      }
    }
    throw new PiEntryError(
      'RECORD_WRITE_FAILED',
      `writePiEntryRecord: entry record write failed; no partial output remains (${String(err)})`,
    )
  }
  return record
}
