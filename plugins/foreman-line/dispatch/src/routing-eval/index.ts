/**
 * Model routing evaluation engine (W2-P3).
 *
 * Loads and validates the frozen routing-policy.yaml, runtime-validates the
 * caller-supplied routing_class and data_classification strings, intersects
 * the class allowlist tiers with the data_classification eligible model set to
 * resolve a single concrete model ID, writes a routing receipt, and returns
 * { resolvedModelId, resolvedTier, routingDecisionRef }.
 *
 * Pure evaluation: no network calls, no MCP, no Jira. Fully deterministic.
 *
 * Linear-time string ops (lesson #19): class names, model IDs, and tier names
 * are validated with Set membership checks (===), never with regex over
 * runtime-variable strings.
 */

import { createHash } from 'node:crypto'
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { isAbsolute, join } from 'node:path'
import { parse } from 'yaml'
import { canonicalize, sha256Hex, writeReceiptDocument } from '../../../approval/src/index.js'
import type { CorrelationContext } from '../../../contracts/src/index.js'
import type {
  EventProvenance,
  JsonValue,
  ReceiptDocument,
  ReplayBindings,
  RoutingAttemptSubject,
  RoutingCacheSubject,
  RoutingDecisionSubject,
  RoutingEventSubject,
  RoutingEventSubjectKind,
} from '../../../receipts/src/index.js'
import {
  REASON_VOCABULARY_VERSION,
  receiptPath,
  validateReceiptDocument,
} from '../../../receipts/src/index.js'
import type {
  ClassName,
  DataClassificationTier,
  ModelBinding,
  RoutingPolicy,
  TransportRequirements,
} from '../../../routing-policy/src/index.js'
import {
  CLASS_NAMES,
  DATA_CLASSIFICATION_TIERS,
  PI_OPENROUTER_ROUTING,
  validatePolicy,
} from '../../../routing-policy/src/index.js'
import type { RequirementPredicateVerdicts } from '../../../routing-policy/src/pi-resolver.js'
import {
  effectivePredicatesFor,
  evaluateRequirementPredicates,
  expertiseNarrowingFor,
  piModelContractFor,
} from '../../../routing-policy/src/pi-resolver.js'
import type { RefusalEntry } from '../../../routing-policy/src/route-receipt.js'
import type {
  ExpertiseArea,
  InputModality,
  ThinkingLevelName,
} from '../../../routing-policy/src/types.js'
import {
  ROUTING_CACHE_SCHEMA_VERSION,
  type RoutingCacheKeyParts,
  type RoutingDecisionCache,
} from '../routing-cache.js'

export type {
  ParcelShadowAuthorization,
  ResolvedParcelShadowAuthorization,
  ShadowCandidateResult,
  ShadowInvocationRequest,
  ShadowRoutingDependencies,
  ShadowRoutingInput,
  ShadowRoutingOptions,
  ShadowRoutingResult,
  ShadowSkippedResult,
} from './shadow.js'
export {
  executeShadowRoute,
  hashShadowPublicInput,
  SHADOW_LIMITS,
  ShadowRoutingError,
} from './shadow.js'
export type { TransportRequirements }

// ─── Error class ──────────────────────────────────────────────────────────────

export class RoutingError extends Error {
  readonly code:
    | 'UNKNOWN_CLASS'
    | 'UNKNOWN_DATA_CLASSIFICATION'
    | 'NO_ELIGIBLE_MODEL'
    | 'REQUIREMENTS_UNSATISFIABLE'
    | 'CORRELATION_MISMATCH'
    | 'POLICY_INVALID'
    | 'POLICY_UNREADABLE'
    | 'RECEIPT_WRITE_FAILED'
    | 'ROOT_NOT_ABSOLUTE'

  constructor(code: RoutingError['code'], message: string) {
    super(message)
    this.name = 'RoutingError'
    this.code = code
  }
}

// ─── Public types ──────────────────────────────────────────────────────────────

export interface RoutingInput {
  /** String from spec frontmatter; validated at runtime against CLASS_NAMES. */
  readonly routing_class: string
  /** String from spec frontmatter; validated at runtime against DATA_CLASSIFICATION_TIERS. */
  readonly data_classification: string
  /** Unique identifier for this workflow; used as the receipt directory name. */
  readonly workflowId: string
  /**
   * HRO-P3 (C3/C5, additive): the chain correlation context for
   * decision/cache/attempt event emission. Absent = legacy selection/receipt
   * semantics preserved (no chain events are written); the summary carries the
   * spec-mandated additive `replayBindings` field either way. Present = events
   * append to the `workflowId` receipt chain as `ReceiptDocument` entries
   * carrying these correlation fields. Its `workflowId` MUST equal
   * `workflowId` — one chain per parcel, keyed by `correlation.workflowId`,
   * never fork.
   */
  readonly correlation?: CorrelationContext
  /**
   * RCM-P4A (C2.3, additive): the effective input-modality requirement
   * (`RouteRequest` vocabulary). Absent = `['text']` (D8 legacy omission —
   * the pre-existing evaluator behavior).
   */
  readonly required_inputs?: readonly InputModality[]
  /**
   * RCM-P4A (C2.3, additive): the resolved thinking-level requirement
   * (`RouteRequest` vocabulary). Absent = the routing-class thinking default
   * (`THINKING_DEFAULT_BY_CLASS`), the resolver's identical computation.
   */
  readonly required_thinking_level?: ThinkingLevelName
  /**
   * RCM-P4A (C2.3, additive): the declared `min_context:` floor. Absent = no
   * floor — never derived, never imputed (D2/a54).
   */
  readonly required_context_tokens?: number
  /**
   * RCM-P4A (C2.3, additive): the declared `expertise:` narrowing key. Absent
   * = no narrowing (missing bindings never invent a preference).
   */
  readonly expertise?: ExpertiseArea
}

export interface RoutingResult {
  /** The single resolved concrete model ID (an OpenRouter slug, e.g. 'anthropic/claude-sonnet-5'). */
  readonly resolvedModelId: string
  /** The policy tier that produced the resolved model (e.g. 'standard'). */
  readonly resolvedTier: string
  /**
   * Gateway routing constraints the caller MUST apply to every request made
   * for this task (policy `data_classification.<tier>.transport_requirements`,
   * mirroring OpenRouter's `provider` object). A model id names a model, not a
   * host; on a multi-provider gateway these two fields are what keep
   * non-public prompts off providers that store or train on inputs. This
   * package selects the model and hands the obligation on — it does not send
   * requests.
   */
  readonly transportRequirements: TransportRequirements
  /** Repo-relative path to the written routing receipt JSON. */
  readonly routingDecisionRef: string
}

export interface RoutingOptions {
  /**
   * Absolute path to the repository root. All file operations (policy read,
   * receipt write) resolve relative to this path.
   * Required. Never derived from process.cwd().
   */
  readonly repoRoot: string
  /**
   * Absolute path to the installed plugin root. Frozen policy assets are read
   * from here, while receipts are always written under repoRoot.
   */
  readonly pluginRoot: string
  /**
   * Optional deterministic decision cache (HRO-P2, charter D4). Absent =
   * legacy cold-path behavior preserved; the summary carries the
   * spec-mandated additive `replayBindings` field regardless. Present = exact
   * warm reuse under full revalidation; every cache failure degrades to the
   * same cold path, never a weaker one.
   */
  readonly cache?: RoutingDecisionCache
}

// ─── Constants ────────────────────────────────────────────────────────────────

const POLICY_PLUGIN_PATH = 'routing-policy/routing-policy.yaml'

function assertAbsoluteRoot(root: string, name: string): void {
  if (!isAbsolute(root)) {
    throw new RoutingError(
      'ROOT_NOT_ABSOLUTE',
      `evaluateRouting: ${name} '${root}' is not an absolute path; refusing cwd-relative resolution`,
    )
  }
}

/**
 * Writes the per-dispatch routing receipt (contract: one receipt per decision,
 * warm or cold) and returns its repo-relative ref. mkdirSync with
 * recursive:true handles pre-existing dirs; both writes are wrapped so
 * ENOSPC/EACCES/ENAMETOOLONG surface as RoutingError. HRO-P3 (C5.2): the
 * summary gains the C1 binding fields additively — its existing fields are
 * unchanged. MRC-05 (C3.4): the additive `evaluations` array is the D7 route
 * explanation — per candidate in walk order.
 */

/** One candidate's gate outcome in walk order (C3.4 route explanation, D7). */
export interface DispatchCandidateEvaluation {
  /** The walk's candidate model id. */
  readonly model: string
  /** True when the candidate was selectable at its visit (first selectable wins). */
  readonly eligible: boolean
  /** The named C3 gate refusals for this candidate (empty when satisfied). */
  readonly refusals: readonly RefusalEntry[]
}

function writeRoutingReceipt(args: {
  readonly repoRoot: string
  readonly workflowId: string
  readonly routing_class: string
  readonly data_classification: string
  readonly resolvedTier: string
  readonly resolvedModelId: string
  readonly transportRequirements: TransportRequirements
  readonly replayBindings: ReplayBindings
  readonly evaluations: readonly DispatchCandidateEvaluation[] | undefined
}): string {
  const receiptDir = join(args.repoRoot, 'docs', 'receipts', args.workflowId)
  const receipt = {
    workflowId: args.workflowId,
    routing_class: args.routing_class,
    data_classification: args.data_classification,
    resolvedTier: args.resolvedTier,
    resolvedModelId: args.resolvedModelId,
    transportRequirements: args.transportRequirements,
    timestamp: new Date().toISOString(),
    policyRef: POLICY_PLUGIN_PATH,
    replayBindings: args.replayBindings,
    ...(args.evaluations !== undefined ? { evaluations: args.evaluations } : {}),
  }
  try {
    mkdirSync(receiptDir, { recursive: true })
    writeFileSync(join(receiptDir, 'routing-decision.json'), JSON.stringify(receipt, null, 2))
  } catch (err) {
    throw new RoutingError(
      'RECEIPT_WRITE_FAILED',
      `Cannot write routing receipt to ${receiptDir}: ${String(err)}`,
    )
  }
  return `docs/receipts/${args.workflowId}/routing-decision.json`
}

// ─── HRO-P3 decision/attempt events (C3/C5) ─────────────────────────────────
//
// Events are entries on the existing receipt chain — same ReceiptDocument
// envelope, same chain keying (one chain per `workflowId`), same correlation
// identity (C3.1; no parallel event format). Append-only at the chain tip,
// never forked. Emission is additive: without `input.correlation` no events
// run and legacy selection/receipt semantics are preserved (the summary still
// carries the spec-mandated additive `replayBindings` field).

/** Chain-entry file names as minted by `receiptPath` (`NNNNNN-<stage>-<slug>.json`). */
const CHAIN_FILE_RE = /^(\d{6})-([A-F])-([a-z0-9-]+)\.json$/

/** Mirrors `receiptPath`'s slugify rule for occurrence counting by subjectKind. */
function chainSubjectSlug(subjectKind: string): string {
  return subjectKind.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

export interface ChainState {
  readonly nextSequence: number
  readonly prevHash: string | null
  /** Occurrence counts per subjectKind slug already on the chain. */
  readonly counts: Record<string, number>
}

/**
 * The chain tip and per-kind occurrence counts. A missing directory is an
 * empty chain (the first event is the genesis); anything else unreadable is
 * never silently treated as empty — that would fork the chain.
 *
 * Exported for reuse at the Stage-C write seam (MRC-05 C1): the DispatchOrder
 * derives `sequence`/`prevHash`/locator from the chain tip at write time
 * through this same reader — the one chain-discipline implementation, never a
 * third variant.
 */
export function readChainState(receiptDir: string): ChainState {
  let names: readonly string[]
  try {
    names = readdirSync(receiptDir)
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return { nextSequence: 0, prevHash: null, counts: {} }
    }
    throw new RoutingError(
      'RECEIPT_WRITE_FAILED',
      `Cannot read chain at ${receiptDir}: ${String(err)}`,
    )
  }
  const counts: Record<string, number> = {}
  let tipName: string | null = null
  let tipSequence = -1
  for (const name of names) {
    const match = CHAIN_FILE_RE.exec(name)
    if (match === null) continue
    const sequenceText = match[1]
    const slug = match[3]
    if (sequenceText === undefined || slug === undefined) continue
    const sequence = Number(sequenceText)
    counts[slug] = (counts[slug] ?? 0) + 1
    if (sequence > tipSequence) {
      tipSequence = sequence
      tipName = name
    }
  }
  if (tipName === null) return { nextSequence: 0, prevHash: null, counts }
  try {
    const tip = JSON.parse(readFileSync(join(receiptDir, tipName), 'utf8')) as Record<
      string,
      unknown
    >
    const hash = tip.hash
    if (typeof hash !== 'string' || !/^[0-9a-f]{64}$/.test(hash)) {
      throw new Error(`chain tip ${tipName} has no valid hash field`)
    }
    return { nextSequence: tipSequence + 1, prevHash: hash, counts }
  } catch (err) {
    throw new RoutingError(
      'RECEIPT_WRITE_FAILED',
      `Cannot read chain tip at ${receiptDir}: ${String(err)}`,
    )
  }
}

/** One pending event; built at write time so the occurrence count is truthful. */
interface PendingEvent {
  readonly subjectKind: RoutingEventSubjectKind
  readonly build: (occurrence: number) => RoutingEventSubject
}

/**
 * Appends event receipts to the `workflowId` chain at the tip. Hash domain is
 * the unchanged RFC 8785 JCS + SHA-256 one (same helpers as the Stage-C
 * receipt writer).
 */
function emitRoutingEvents(
  args: {
    readonly repoRoot: string
    readonly workflowId: string
    readonly correlation: CorrelationContext
  },
  events: readonly PendingEvent[],
): void {
  if (events.length === 0) return
  const receiptDir = join(args.repoRoot, 'docs', 'receipts', args.workflowId)
  const state = readChainState(receiptDir)
  const counts = state.counts
  let sequence = state.nextSequence
  let prevHash = state.prevHash
  for (const event of events) {
    const slug = chainSubjectSlug(event.subjectKind)
    const occurrence = (counts[slug] ?? 0) + 1
    counts[slug] = occurrence
    try {
      const locator = receiptPath(args.workflowId, sequence, 'C', event.subjectKind)
      const draft = {
        schemaVersion: '1',
        kind: 'stage' as const,
        stage: 'C' as const,
        claimRef: null,
        correlation: args.correlation,
        sequence,
        prevHash,
        timestamp: new Date().toISOString(),
        subjectKind: event.subjectKind,
        subject: event.build(occurrence),
        signature: null,
      }
      const hash = sha256Hex(canonicalize(draft as unknown as JsonValue))
      const document = { ...draft, hash } as unknown as ReceiptDocument
      const validation = validateReceiptDocument(document)
      if (!validation.valid) {
        throw new RoutingError(
          'RECEIPT_WRITE_FAILED',
          `${event.subjectKind} chain receipt failed validation: ${validation.errors.join('; ')}`,
        )
      }
      mkdirSync(receiptDir, { recursive: true })
      writeReceiptDocument(document, locator, args.repoRoot)
      prevHash = hash
      sequence += 1
    } catch (err) {
      if (err instanceof RoutingError) throw err
      throw new RoutingError(
        'RECEIPT_WRITE_FAILED',
        `Cannot write ${event.subjectKind} chain receipt for ${args.workflowId}: ${String(err)}`,
      )
    }
  }
}

/**
 * Provenance for evaluator-emitted events (C3.3). This engine performs no
 * network or provider call and observes no billing: every cost, usage, and
 * latency value is an explicit `unknown`/null — never imputed (D5:70).
 */
function eventProvenance(args: {
  readonly occurrence: number
  readonly model: string | null
  readonly failure: string | null
  readonly retries: number
}): EventProvenance {
  return {
    provider: args.model === null ? null : 'openrouter',
    model: args.model,
    input_tokens: null,
    output_tokens: null,
    provider_cached_tokens: null,
    latency_ms: null,
    failure: args.failure,
    retries: args.retries,
    cost: {
      tag: 'unknown',
      amount: null,
      currency: null,
      price_source: null,
      price_version: null,
    },
    occurrence: args.occurrence,
  }
}

/**
 * C1's seven bound inputs (RCM exit criterion 8), populated from this
 * decision's actual inputs. MRC-05 (C4.1) carries the effective requirements
 * into the bound inputs: `required_inputs` (canonical `INPUT_MODALITIES`
 * order) and the resolved `required_thinking_level` are always bound (D8 makes
 * declared and omitted equivalent; the level is always known); `expertise` is
 * bound when declared. `derived_context_floor.required_context_tokens` is
 * populated from the declared `min_context:` floor and stays an explicit null
 * otherwise — unknown stays unknown, never imputed (D2/a54).
 */
function buildReplayBindings(args: {
  readonly routing_class: string
  readonly data_classification: string
  readonly transportRequirements: TransportRequirements
  readonly policyDigest: string
  readonly resolvedModelId: string | null
  readonly requiredInputs: readonly InputModality[]
  readonly requiredThinkingLevel: ThinkingLevelName
  readonly requiredContextTokens: number | undefined
  readonly expertise: ExpertiseArea | undefined
}): ReplayBindings {
  const contract =
    args.resolvedModelId === null
      ? null
      : piModelContractFor({ provider: 'openrouter', model: args.resolvedModelId })
  return {
    effective_requirements: {
      routing_class: args.routing_class,
      data_classification: args.data_classification,
      transport_requirements: {
        data_collection: args.transportRequirements.data_collection,
        zdr: args.transportRequirements.zdr,
      },
      required_inputs: [...args.requiredInputs],
      required_thinking_level: args.requiredThinkingLevel,
      ...(args.expertise !== undefined ? { expertise: args.expertise } : {}),
    },
    policy_digest: { version: POLICY_PLUGIN_PATH, content_digest: args.policyDigest },
    catalog_snapshot_digest: sha256Hex(canonicalize(PI_OPENROUTER_ROUTING as unknown as JsonValue)),
    vocabulary_version: REASON_VOCABULARY_VERSION,
    derived_context_floor: {
      required_context_tokens: args.requiredContextTokens ?? null,
      required_output_tokens: null,
    },
    // C4.2 (truthful predicate set): every decision applies the class
    // allowlist, the data-class eligibility set, and the C3 capability gate;
    // `context_floor` joins when min_context was enforced. Ids are the
    // shipped DECISION_PREDICATE_IDS — no new predicate ids.
    predicate_set: [
      'class_allowlist',
      'data_class_eligible_models',
      'capability_predicate',
      ...(args.requiredContextTokens !== undefined ? (['context_floor'] as const) : []),
    ],
    selected_identity: {
      registry_key: args.resolvedModelId,
      provider_local_id: contract?.provider_local_id ?? null,
      protocol: contract?.protocol ?? null,
      pi_host_model_id: contract?.opencode_id ?? null,
    },
  }
}

function decisionEvent(
  bindings: ReplayBindings,
  outcome: {
    readonly reason: 'ROUTE_SELECTED' | 'ROUTE_UNAVAILABLE'
    readonly model: string | null
    readonly failure: string | null
  },
): (occurrence: number) => RoutingDecisionSubject {
  return (occurrence) => ({
    event_kind: 'decision',
    reason: outcome.reason,
    bindings,
    provenance: eventProvenance({
      occurrence,
      model: outcome.model,
      failure: outcome.failure,
      retries: 0,
    }),
  })
}

function cacheEvent(
  key: RoutingCacheKeyParts,
  reason: 'CACHE_HIT' | 'CACHE_MISS',
  model: string | null,
): (occurrence: number) => RoutingCacheSubject {
  return (occurrence) => ({
    event_kind: 'cache',
    reason,
    vocabulary_version: REASON_VOCABULARY_VERSION,
    cache_key: {
      schema_version: key.schemaVersion,
      policy_digest: key.policyDigest,
      routing_class: key.routing_class,
      data_classification: key.data_classification,
      ...(key.required_inputs !== undefined ? { required_inputs: key.required_inputs } : {}),
      ...(key.required_thinking_level !== undefined
        ? { required_thinking_level: key.required_thinking_level }
        : {}),
      ...(key.required_context_tokens !== undefined
        ? { required_context_tokens: key.required_context_tokens }
        : {}),
      ...(key.expertise !== undefined ? { expertise: key.expertise } : {}),
    },
    provenance: eventProvenance({ occurrence, model, failure: null, retries: 0 }),
  })
}

function attemptEvent(outcome: {
  readonly reason: 'ATTEMPT_SUCCEEDED' | 'ATTEMPT_FAILED'
  readonly model: string | null
  readonly failure: string | null
}): (occurrence: number) => RoutingAttemptSubject {
  return (occurrence) => ({
    event_kind: 'attempt',
    reason: outcome.reason,
    vocabulary_version: REASON_VOCABULARY_VERSION,
    provenance: eventProvenance({
      occurrence,
      model: outcome.model,
      failure: outcome.failure,
      // Every recorded attempt names its retry number (0 = first try), so
      // retries are measurable without dedupe hiding them (D5:68,:120).
      retries: occurrence - 1,
    }),
  })
}

/**
 * C3.2 evidence rules (MRC-05): which of the shared requirement-predicate
 * verdicts ACTIVATE at the dispatch gate. The gate never re-derives a
 * predicate — `evaluateRequirementPredicates` (pi-resolver C3.1) is the ONE
 * implementation — and never reorders the walk; it selects verdicts per the
 * charter's own qualifiers and reuses the shared named refusals verbatim:
 *
 * - Input modality: the baseline `['text']` (declared or omitted — D8 makes
 *   them equivalent) makes no modality capability claim and preserves the
 *   pre-existing selection byte-for-byte; any other effective set filters
 *   hard (INPUTS_INSUFFICIENT on declared gaps, INPUTS_UNKNOWN on unknown
 *   facts — D2/a54: never a silent downgrade).
 * - Thinking level (the resolved level is always known): a declared support
 *   missing the level filters (THINKING_LEVEL_UNSUPPORTED); UNKNOWN support is
 *   NOT filtered — the level is carried and enforced where supported. This
 *   asymmetry is the charter's own qualifier (C5).
 * - Context floor: only when `min_context:` was declared — a hard correctness
 *   bound (CONTEXT_INSUFFICIENT below the floor, CONTEXT_UNKNOWN on unknown
 *   facts). Absent floor = no predicate.
 */
function dispatchGateRefusals(
  requirement: RequirementPredicateVerdicts,
  effectiveInputs: readonly InputModality[],
  contextFloorDeclared: boolean,
): readonly RefusalEntry[] {
  const activeNames = new Set<string>(['THINKING_LEVEL_UNSUPPORTED'])
  const baselineTextOnly = effectiveInputs.length === 1 && effectiveInputs[0] === 'text'
  if (!baselineTextOnly) {
    activeNames.add('INPUTS_UNKNOWN')
    activeNames.add('INPUTS_INSUFFICIENT')
  }
  if (contextFloorDeclared) {
    activeNames.add('CONTEXT_UNKNOWN')
    activeNames.add('CONTEXT_INSUFFICIENT')
  }
  return [...requirement.capabilityRefusals, ...requirement.contextRefusals].filter((refusal) =>
    activeNames.has(refusal.name),
  )
}

// ─── Evaluation ──────────────────────────────────────────────────────────────

export function evaluateRouting(input: RoutingInput, options: RoutingOptions): RoutingResult {
  const { repoRoot, pluginRoot } = options
  assertAbsoluteRoot(repoRoot, 'repoRoot')
  assertAbsoluteRoot(pluginRoot, 'pluginRoot')

  // 1. Load the frozen policy YAML
  let rawYaml: string
  try {
    rawYaml = readFileSync(join(pluginRoot, ...POLICY_PLUGIN_PATH.split('/')), 'utf8')
  } catch (err) {
    throw new RoutingError(
      'POLICY_UNREADABLE',
      `Cannot read routing policy at ${POLICY_PLUGIN_PATH} under ${pluginRoot}: ${String(err)}`,
    )
  }

  // 1a. Runtime-validate routing_class and data_classification (Set
  // membership, no regex) BEFORE any cache lookup or policy parse: the cache
  // must never vouch for an input the evaluator itself would reject (HRO-P2
  // parity — warm and cold paths enforce identical input gates).
  const classNamesSet = new Set<string>(CLASS_NAMES)
  if (!classNamesSet.has(input.routing_class)) {
    throw new RoutingError(
      'UNKNOWN_CLASS',
      `Unknown routing_class: '${input.routing_class}'. Valid classes: ${CLASS_NAMES.join(', ')}`,
    )
  }
  const dataTiersSet = new Set<string>(DATA_CLASSIFICATION_TIERS)
  if (!dataTiersSet.has(input.data_classification)) {
    throw new RoutingError(
      'UNKNOWN_DATA_CLASSIFICATION',
      `Unknown data_classification: '${input.data_classification}'. Valid tiers: ${DATA_CLASSIFICATION_TIERS.join(', ')}`,
    )
  }
  const routingClass = input.routing_class as ClassName
  const dataClassification = input.data_classification as DataClassificationTier

  // 1a2. HRO-P3 (C3.1): correlation threading — one chain per workflowId,
  // never fork. A disagreement between the correlation's chain key and the
  // requested workflowId refuses before any write.
  if (input.correlation !== undefined && input.correlation.workflowId !== input.workflowId) {
    throw new RoutingError(
      'CORRELATION_MISMATCH',
      `correlation.workflowId '${input.correlation.workflowId}' does not match input.workflowId '${input.workflowId}'; one chain per workflowId, never fork`,
    )
  }

  // 1b. Policy content digest — the cache's change-detection boundary (D4:
  // policy changes invalidate affected cache entries).
  const policyDigest = createHash('sha256').update(rawYaml, 'utf8').digest('hex')

  // MRC-05 (C2.2): the effective requirements after D8 legacy omission —
  // computed once via the resolver's identical computation; the C3 gate, the
  // cache key, and the decision bindings all read these same values. Absent
  // input fields = the pre-existing evaluator behavior.
  const predicates = effectivePredicatesFor(input)
  const requiredInputs = predicates.inputs
  const requiredThinkingLevel = predicates.level
  const requiredContextTokens = input.required_context_tokens
  const expertise = input.expertise

  // MRC-05 (C3.5): the decision is a function of the effective requirements,
  // so the cache key carries them in canonical form (required_inputs in the
  // fixed INPUT_MODALITIES order — canonicalRoutingCacheKey sorts) — a value
  // produced under different requirements can never be recalled into a
  // different request (ruling C's memo-permission condition).
  const cacheKeyParts: RoutingCacheKeyParts = {
    schemaVersion: ROUTING_CACHE_SCHEMA_VERSION,
    policyDigest,
    routing_class: input.routing_class,
    data_classification: input.data_classification,
    required_inputs: requiredInputs,
    required_thinking_level: requiredThinkingLevel,
    ...(requiredContextTokens !== undefined
      ? { required_context_tokens: requiredContextTokens }
      : {}),
    ...(expertise !== undefined ? { expertise } : {}),
  }

  // 1c. Warm path (HRO-P2): exact cache recall with full revalidation. A hit
  // skips parse+validate+walk only under a digest-matched, seal-valid,
  // unexpired record; every other outcome is a typed miss inside the facade
  // and falls through to the identical cold path. The cache can never weaken
  // authorization — only skip redundant work.
  const cached = options.cache?.recall(cacheKeyParts)
  if (cached !== undefined) {
    const transportRequirements: TransportRequirements = {
      data_collection: cached.transportRequirements.data_collection,
      zdr: cached.transportRequirements.zdr,
    }
    const replayBindings = buildReplayBindings({
      routing_class: input.routing_class,
      data_classification: input.data_classification,
      transportRequirements,
      policyDigest,
      resolvedModelId: cached.resolvedModelId,
      requiredInputs,
      requiredThinkingLevel,
      requiredContextTokens,
      expertise,
    })
    const routingDecisionRef = writeRoutingReceipt({
      repoRoot,
      workflowId: input.workflowId,
      routing_class: input.routing_class,
      data_classification: input.data_classification,
      resolvedTier: cached.resolvedTier,
      resolvedModelId: cached.resolvedModelId,
      transportRequirements,
      replayBindings,
      // R2 (ruled): the warm hit REPLAYS the memoized route explanation — D7
      // binds every decision's evidence, cache-enabled callers included.
      evaluations: cached.evaluations,
    })
    if (input.correlation !== undefined) {
      const events: readonly PendingEvent[] = [
        {
          subjectKind: 'RoutingDecisionEvent',
          build: decisionEvent(replayBindings, {
            reason: 'ROUTE_SELECTED',
            model: cached.resolvedModelId,
            failure: null,
          }),
        },
        {
          subjectKind: 'RoutingCacheEvent',
          build: cacheEvent(cacheKeyParts, 'CACHE_HIT', cached.resolvedModelId),
        },
      ]
      emitRoutingEvents(
        { repoRoot, workflowId: input.workflowId, correlation: input.correlation },
        events,
      )
    }
    return {
      resolvedModelId: cached.resolvedModelId,
      resolvedTier: cached.resolvedTier,
      transportRequirements,
      routingDecisionRef,
    }
  }

  // A configured cache whose recall found nothing records a CACHE_MISS event
  // before the identical cold path runs (C5.2: hit/miss both recorded).
  const cacheMissPending = options.cache !== undefined && cached === undefined

  // 1d. Parse the YAML — yaml package throws YAMLParseError on malformed input
  let rawPolicy: unknown
  try {
    rawPolicy = parse(rawYaml)
  } catch (err) {
    throw new RoutingError(
      'POLICY_INVALID',
      `Cannot parse routing policy YAML at ${POLICY_PLUGIN_PATH}: ${String(err)}`,
    )
  }

  // 2. Validate with validatePolicy; throw POLICY_INVALID if invalid
  const validation = validatePolicy(rawPolicy)
  if (!validation.valid) {
    throw new RoutingError(
      'POLICY_INVALID',
      `Routing policy is invalid: ${validation.errors.join('; ')}`,
    )
  }
  const policy = rawPolicy as RoutingPolicy

  // 5. Get class entry (noUncheckedIndexedAccess: guard against missing entry post-validation)
  const classEntry = policy.classes[routingClass]
  if (classEntry === undefined) {
    throw new RoutingError(
      'POLICY_INVALID',
      `Policy missing class entry for '${routingClass}' despite passing validation`,
    )
  }

  // 6. Build eligible model set — O(1) lookup per model (linear-time
  // intersection). Post-CUTOVER-P4 data-class eligibility is declared at the
  // binding level (A5.2 `data_classes`): the set is exactly the OpenRouter
  // models whose binding declares this tier — an undeclared envelope is
  // UNKNOWN, never read as eligible (D2/a54).
  const dataClassRule = policy.data_classification[dataClassification]
  if (dataClassRule === undefined) {
    throw new RoutingError(
      'POLICY_INVALID',
      `Policy missing data_classification entry for '${dataClassification}' despite passing validation`,
    )
  }
  const eligible = new Set<string>()
  for (const candidate of Object.values(policy.candidates)) {
    for (const binding of candidate.bindings) {
      const dataClasses = binding.data_classes
      if (
        binding.provider === 'openrouter' &&
        dataClasses.state === 'declared' &&
        dataClasses.value.includes(dataClassification)
      ) {
        eligible.add(binding.model)
      }
    }
  }

  // 7. Walk allowlist tiers in policy order; find first eligible model. The
  // walk order itself is untouched — the C3 dispatch gate (MRC-05) FILTERS
  // within the order, never reorders it (D3/D4): the first selectable
  // candidate wins exactly where the first classification-eligible one did,
  // and a later candidate never jumps ahead.
  //
  // C3.1 model→facts lookup follows piModelContractFor's matching rule: an
  // `openrouter` binding whose `model` equals the walk's candidate id; a
  // candidate with no such binding has unknown facts (evidence absent).
  const bindingsByModel = new Map<string, ModelBinding>()
  for (const candidate of Object.values(policy.candidates ?? {})) {
    for (const binding of candidate?.bindings ?? []) {
      if (binding.provider === 'openrouter' && !bindingsByModel.has(binding.model)) {
        bindingsByModel.set(binding.model, binding)
      }
    }
  }

  // C3.2 expertise narrowing (only when declared): the SAME expertiseNarrowing
  // decision core resolveRoute applies (pi-resolver C3.1) — non-shadow
  // (routing_class, expertise) entries narrow the already-eligible set
  // preserving order; no entry = no narrowing (missing bindings never invent a
  // preference); a dangling ref is the typed stop; shadow entries never narrow
  // (RCM-P9 boundary).
  let narrowedModels: ReadonlySet<string> | null = null
  let narrowingStop: RefusalEntry | null = null
  if (expertise !== undefined) {
    const narrowing = expertiseNarrowingFor(policy, {
      routing_class: input.routing_class,
      expertise,
    })
    if (narrowing !== null && 'stop' in narrowing) {
      narrowingStop = narrowing.stop
    } else if (narrowing !== null) {
      // The walk maps the narrowed binding refs to its model ids via the
      // C3.1 lookup rule (an openrouter binding whose model equals the walk's
      // candidate id).
      const models = new Set<string>()
      for (const [model, binding] of bindingsByModel) {
        if (narrowing.ids.has(binding.id)) models.add(model)
      }
      narrowedModels = models
    }
  }

  // C3.4 route explanation (D7): every gate candidate's outcome, in walk order.
  const evaluations: DispatchCandidateEvaluation[] = []
  const seenModels = new Set<string>()
  let resolvedModelId: string | undefined
  let resolvedTier: string | undefined
  let classificationEligibleSeen = false

  for (const tier of classEntry.allowlist) {
    // C5.2: the ordered source carries provider-neutral candidate keys; each
    // expands to its OpenRouter binding `model` — the walk's model-id domain,
    // the C3.1 facts lookup below, and every result field are unchanged, so
    // the migration preserves selection behavior by construction.
    const tierModels: string[] = []
    for (const candidateKey of policy.selection_order[tier] ?? []) {
      const candidate = policy.candidates[candidateKey]
      const binding = candidate?.bindings.find((entry) => entry.provider === 'openrouter')
      if (binding !== undefined) tierModels.push(binding.model)
    }
    for (const model of tierModels) {
      if (seenModels.has(model)) continue
      seenModels.add(model)
      // D4: capability predicates (the gate) only narrow the
      // classification-eligible set — a data-class-ineligible model is not a
      // gate candidate and is not part of the route explanation.
      if (!eligible.has(model)) continue
      classificationEligibleSeen = true

      const requirement = evaluateRequirementPredicates({
        facts: bindingsByModel.get(model) ?? {},
        predicates,
        requiredContextTokens: requiredContextTokens ?? 0,
        requiredOutputTokens: 0,
        label: `model '${model}'`,
      })
      const gateRefusals = dispatchGateRefusals(
        requirement,
        requiredInputs,
        requiredContextTokens !== undefined,
      )
      const narrowedOut = narrowedModels !== null && !narrowedModels.has(model)
      const refusals: readonly RefusalEntry[] = narrowedOut
        ? [
            ...gateRefusals,
            {
              name: 'EXPERTISE_NARROWED_OUT',
              detail: `model '${model}' is outside the (${input.routing_class}, ${String(expertise)}) expertise binding (D3: narrow only — never reorder or fall back)`,
            },
          ]
        : gateRefusals
      const selectable = narrowingStop === null && gateRefusals.length === 0 && !narrowedOut
      evaluations.push({ model, eligible: selectable, refusals })
      if (selectable && resolvedModelId === undefined) {
        resolvedModelId = model
        resolvedTier = tier
      }
    }
  }

  // 8. No selectable model across all tiers. The pure no-eligible-model path
  // keeps NO_ELIGIBLE_MODEL (existing contract, byte-identical detail); when
  // classification-eligible candidates existed and the C3 gate is what
  // eliminated the rest, the typed REQUIREMENTS_UNSATISFIABLE names the
  // failing predicates (C3.3) — exit criterion 4's "refuses with a typed error
  // naming the unsatisfiable predicate".
  if (resolvedModelId === undefined || resolvedTier === undefined) {
    const failureRefusals: RefusalEntry[] = []
    if (narrowingStop !== null) {
      failureRefusals.push(narrowingStop)
    } else if (narrowedModels !== null) {
      // C3.2: a non-shadow expertise binding that narrows the eligible set to
      // nothing is unsatisfiable — refused by name, never silently replaced by
      // the un-narrowed set (D3).
      failureRefusals.push({
        name: 'EXPERTISE_BINDING_UNSATISFIABLE',
        detail: `the (${input.routing_class}, ${String(expertise)}) expertise binding narrows the eligible set to nothing (D3: unsatisfiable bindings refuse, never fall back)`,
      })
    }
    for (const evaluation of evaluations) {
      failureRefusals.push(...evaluation.refusals)
    }
    const detail = classificationEligibleSeen
      ? `No model satisfies the declared requirements for routing_class '${input.routing_class}' with data_classification '${input.data_classification}' (named refusals: ${failureRefusals
          .map((refusal) => `${refusal.name}: ${refusal.detail}`)
          .join('; ')})`
      : `No eligible model found for routing_class '${input.routing_class}' with data_classification '${input.data_classification}'`
    if (input.correlation !== undefined) {
      // A failed call is never recorded as success (D5:70): the decision and
      // attempt events carry ROUTE_UNAVAILABLE / ATTEMPT_FAILED with the
      // failure detail; the selected identity stays null (nothing selected).
      const failureTransport: TransportRequirements = {
        data_collection: dataClassRule.transport_requirements.data_collection,
        zdr: dataClassRule.transport_requirements.zdr,
      }
      const replayBindings = buildReplayBindings({
        routing_class: input.routing_class,
        data_classification: input.data_classification,
        transportRequirements: failureTransport,
        policyDigest,
        resolvedModelId: null,
        requiredInputs,
        requiredThinkingLevel,
        requiredContextTokens,
        expertise,
      })
      const events: PendingEvent[] = [
        {
          subjectKind: 'RoutingDecisionEvent',
          build: decisionEvent(replayBindings, {
            reason: 'ROUTE_UNAVAILABLE',
            model: null,
            failure: detail,
          }),
        },
      ]
      if (cacheMissPending) {
        events.push({
          subjectKind: 'RoutingCacheEvent',
          build: cacheEvent(cacheKeyParts, 'CACHE_MISS', null),
        })
      }
      events.push({
        subjectKind: 'RoutingAttemptEvent',
        build: attemptEvent({ reason: 'ATTEMPT_FAILED', model: null, failure: detail }),
      })
      emitRoutingEvents(
        { repoRoot, workflowId: input.workflowId, correlation: input.correlation },
        events,
      )
    }
    throw new RoutingError(
      classificationEligibleSeen ? 'REQUIREMENTS_UNSATISFIABLE' : 'NO_ELIGIBLE_MODEL',
      detail,
    )
  }

  const transportRequirements: TransportRequirements = {
    data_collection: dataClassRule.transport_requirements.data_collection,
    zdr: dataClassRule.transport_requirements.zdr,
  }

  const replayBindings = buildReplayBindings({
    routing_class: input.routing_class,
    data_classification: input.data_classification,
    transportRequirements,
    policyDigest,
    resolvedModelId,
    requiredInputs,
    requiredThinkingLevel,
    requiredContextTokens,
    expertise,
  })

  const routingDecisionRef = writeRoutingReceipt({
    repoRoot,
    workflowId: input.workflowId,
    routing_class: input.routing_class,
    data_classification: input.data_classification,
    resolvedTier,
    resolvedModelId,
    transportRequirements,
    replayBindings,
    evaluations,
  })

  // HRO-P2: best-effort warm-path population (D4). Store failures are typed
  // diagnostics inside the facade — never errors, never weaker routing. R2:
  // the memo carries the route explanation (the evaluator's own output) so
  // warm hits can replay it into their receipts.
  options.cache?.remember(
    { resolvedModelId, resolvedTier, transportRequirements, evaluations },
    cacheKeyParts,
  )

  if (input.correlation !== undefined) {
    const events: PendingEvent[] = [
      {
        subjectKind: 'RoutingDecisionEvent',
        build: decisionEvent(replayBindings, {
          reason: 'ROUTE_SELECTED',
          model: resolvedModelId,
          failure: null,
        }),
      },
    ]
    if (cacheMissPending) {
      events.push({
        subjectKind: 'RoutingCacheEvent',
        build: cacheEvent(cacheKeyParts, 'CACHE_MISS', resolvedModelId),
      })
    }
    events.push({
      subjectKind: 'RoutingAttemptEvent',
      build: attemptEvent({ reason: 'ATTEMPT_SUCCEEDED', model: resolvedModelId, failure: null }),
    })
    emitRoutingEvents(
      { repoRoot, workflowId: input.workflowId, correlation: input.correlation },
      events,
    )
  }

  return {
    resolvedModelId,
    resolvedTier,
    transportRequirements,
    routingDecisionRef,
  }
}
