/**
 * `validateReceiptDocument`: schema conformance (ajv, `receiptDocumentSchema`)
 * plus the two single-document semantic invariants (AC4). `validateChain`:
 * the three chain-level invariants (AC5), run over an ordered document array.
 *
 * Both surface every violation in one pass (independent of whether the
 * structural pass succeeded) — the exit-code contract's `1` case (every
 * violation on stderr, not just the first) depends on this.
 *
 * Chain-splice/reorder resistance is deliberately bounded: AC5b checks that a
 * stored `prevHash` string-equals the prior receipt's *stored* `hash` field.
 * It never recomputes that hash from canonical bytes — a coordinated edit
 * that rewrites a receipt's content and consistently patches every
 * downstream `hash`/`prevHash` to match would NOT be caught here. Only pcc's
 * future cryptographic recomputation (`receipt verify`) catches that.
 *
 * Robustness (AC5d, rework amendment): `validateChain` never throws on
 * arbitrary JSON values as members. Exclusion is per-comparison capability,
 * not per-document validity — a member that is not a JSON object, or whose
 * `correlation` is not a JSON object, is excluded from exactly the
 * cross-member comparisons it cannot participate in, and is reported via its
 * per-document schema violations. Adjacency comparisons touching an excluded
 * side are skipped entirely (no bridging across an excluded member).
 * `validateChain([])` is invalid: a chain must contain receipts.
 */
import { Ajv, type SchemaObject } from 'ajv'
import { HASH_PATTERN, receiptDocumentSchema } from './schemas.js'
import type {
  EventKind,
  ReasonCode,
  ReasonOutcome,
  ReasonVocabularyEntry,
  ReceiptDocument,
  ReplayBindings,
  RoutingDecisionSubject,
  RoutingEventSubjectKind,
  SelectedIdentity,
} from './types.js'
import { DECISION_PREDICATE_IDS, REASON_VOCABULARY, ROUTING_EVENT_SUBJECT_KINDS } from './types.js'

export interface ValidationResult {
  readonly valid: boolean
  readonly errors: readonly string[]
}

const ajv = new Ajv({ allErrors: true })
const validateStructure = ajv.compile(receiptDocumentSchema as SchemaObject)

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** AC4a: `claimRef` is null iff `kind === 'stage'`. */
function checkClaimRefInvariant(doc: Record<string, unknown>): string[] {
  const errors: string[] = []
  if (doc.kind === 'stage' && doc.claimRef !== null) {
    errors.push(`claimRef must be null when kind is 'stage', got ${JSON.stringify(doc.claimRef)}`)
  }
  if (doc.kind === 'claim' && doc.claimRef === null) {
    errors.push("claimRef must be non-null when kind is 'claim'")
  }
  return errors
}

/** AC4b: `prevHash === null` iff `sequence === 0`. */
function checkGenesisInvariant(doc: Record<string, unknown>): string[] {
  const errors: string[] = []
  const { sequence, prevHash } = doc
  if (typeof sequence !== 'number') return errors
  if (sequence === 0 && prevHash !== null) {
    errors.push(
      `prevHash must be null when sequence is 0 (genesis), got ${JSON.stringify(prevHash)}`,
    )
  }
  if (sequence !== 0 && prevHash === null) {
    errors.push(`prevHash must be non-null when sequence is ${sequence} (non-genesis)`)
  }
  return errors
}

export function validateReceiptDocument(doc: unknown): ValidationResult {
  const errors: string[] = []

  const structurallyValid = validateStructure(doc)
  if (!structurallyValid) {
    for (const err of validateStructure.errors ?? []) {
      const path = err.instancePath.length > 0 ? err.instancePath : '(root)'
      errors.push(`${path} ${err.message ?? 'is invalid'}`)
    }
  }

  if (isRecord(doc)) {
    errors.push(...checkClaimRefInvariant(doc))
    errors.push(...checkGenesisInvariant(doc))
  }

  return { valid: errors.length === 0, errors }
}

/**
 * AC5a: sequence values are exactly `0..M-1`, contiguous, no gaps or
 * duplicates — over the M members capable of participating (JSON objects
 * with a numeric `sequence`; coordinator ruling: the range is 0..M-1 over
 * participants, so a stray malformed file never attributes a spurious
 * contiguity violation to the valid members).
 */
function checkSequenceContiguity(docs: readonly unknown[]): string[] {
  const sequences: number[] = []
  for (const doc of docs) {
    if (isRecord(doc) && typeof doc.sequence === 'number') sequences.push(doc.sequence)
  }
  const sorted = [...sequences].sort((a, b) => a - b)
  const contiguous = sorted.every((value, index) => value === index)
  if (!contiguous) {
    return [
      `chain sequence values must be exactly 0..${sequences.length - 1}, contiguous, no gaps or duplicates; found ${JSON.stringify(sequences)}`,
    ]
  }
  return []
}

/**
 * AC5b: prevHash pointer resolution against the prior receipt's stored hash.
 * A non-object member cannot participate: any adjacency comparison touching
 * it is skipped entirely — no bridging to compare across it (coordinator
 * ruling: `prevHash` points to the immediate predecessor only, and the
 * excluded member's schema violations already fail the chain).
 */
function checkPrevHashPointers(docs: readonly unknown[]): string[] {
  const errors: string[] = []
  docs.forEach((doc, index) => {
    if (!isRecord(doc)) return
    if (index === 0) {
      if (doc.prevHash !== null) {
        errors.push(
          `receipts[0].prevHash must be null (genesis), got ${JSON.stringify(doc.prevHash)}`,
        )
      }
      return
    }
    const prev = docs[index - 1]
    if (!isRecord(prev)) return
    if (doc.prevHash !== prev.hash) {
      errors.push(
        `receipts[${index}].prevHash (${JSON.stringify(doc.prevHash)}) does not match receipts[${index - 1}].hash (${JSON.stringify(prev.hash)})`,
      )
    }
  })
  return errors
}

/**
 * AC5c: every receipt shares an identical correlation.workflowId and
 * correlationId. A member whose `correlation` is not a JSON object cannot
 * participate and is excluded; the baseline is the first participating
 * member.
 */
function checkSharedCorrelation(docs: readonly unknown[]): string[] {
  const errors: string[] = []
  const participants: { index: number; correlation: Record<string, unknown> }[] = []
  docs.forEach((doc, index) => {
    if (isRecord(doc) && isRecord(doc.correlation)) {
      participants.push({ index, correlation: doc.correlation })
    }
  })
  const first = participants[0]
  if (first === undefined) return errors
  for (const { index, correlation } of participants) {
    if (
      correlation.workflowId !== first.correlation.workflowId ||
      correlation.correlationId !== first.correlation.correlationId
    ) {
      errors.push(
        `receipts[${index}].correlation.workflowId/correlationId diverges from receipts[${first.index}]'s`,
      )
    }
  }
  return errors
}

export function validateChain(docs: readonly ReceiptDocument[]): ValidationResult {
  if (docs.length === 0) {
    return { valid: false, errors: ['chain contains no receipts'] }
  }

  const errors: string[] = []

  docs.forEach((doc, index) => {
    const result = validateReceiptDocument(doc)
    for (const message of result.errors) {
      errors.push(`receipts[${index}]: ${message}`)
    }
  })

  errors.push(...checkSequenceContiguity(docs))
  errors.push(...checkPrevHashPointers(docs))
  errors.push(...checkSharedCorrelation(docs))

  return { valid: errors.length === 0, errors }
}

/** Structural seal only: a valid chain ending in a stage-F ClosureRecord, not a claim. */
export function isSealed(chain: readonly ReceiptDocument[]): boolean {
  if (!validateChain(chain).valid) return false
  const highest = chain.reduce((max, doc) => (doc.sequence > max.sequence ? doc : max))
  return (
    highest.kind === 'stage' && highest.stage === 'F' && highest.subjectKind === 'ClosureRecord'
  )
}

// ─── HRO-P3/RCM-P8A (MRC-02) — event subject invariants (C1.2) ───────────────
//
// Structural shape + cross-field honesty rules for the event subject payloads
// defined in `types.ts`. Envelope validation above is untouched; enriched
// receipts remain ordinary chain members (`subject` stays `JsonValue`).
// Cross-field rules live here, distinct from pure structural shape (the
// `schemas.ts` split). Every rejection is a typed `ValidationResult`.

const HASH_RE = new RegExp(HASH_PATTERN)

const SUBJECT_KIND_EVENT_KIND: Readonly<Record<RoutingEventSubjectKind, EventKind>> = {
  RoutingDecisionEvent: 'decision',
  RoutingCacheEvent: 'cache',
  RoutingAttemptEvent: 'attempt',
}

const COST_TAGS = ['billed', 'estimated', 'unknown'] as const

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

function isCountLike(value: unknown, integer: boolean): boolean {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return false
  return !integer || Number.isInteger(value)
}

function checkKeys(
  obj: Record<string, unknown>,
  allowed: readonly string[],
  label: string,
  errors: string[],
  optional: readonly string[] = [],
): void {
  for (const key of Object.keys(obj)) {
    if (!allowed.includes(key) && !optional.includes(key)) {
      errors.push(`${label} has unknown field '${key}'`)
    }
  }
  for (const key of allowed) {
    if (!(key in obj)) errors.push(`${label} is missing field '${key}'`)
  }
}

function validateCost(value: unknown, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push('provenance.cost must be a JSON object')
    return
  }
  checkKeys(
    value,
    ['tag', 'amount', 'currency', 'price_source', 'price_version'],
    'provenance.cost',
    errors,
  )
  const tag = value.tag
  if (typeof tag !== 'string' || !(COST_TAGS as readonly string[]).includes(tag)) {
    errors.push(`provenance.cost.tag must be one of ${COST_TAGS.join(', ')}`)
    return
  }
  if (tag === 'unknown') {
    // Unknown stays unknown: no amount, currency, or price source is ever
    // imputed under an `unknown` tag (charter D5:70).
    for (const key of ['amount', 'currency', 'price_source', 'price_version']) {
      if (value[key] !== null) {
        errors.push(`provenance.cost.${key} must be null when the cost tag is 'unknown'`)
      }
    }
    return
  }
  if (!isCountLike(value.amount, false)) {
    errors.push('provenance.cost.amount must be a finite number >= 0 when the cost is tagged')
  }
  if (!isNonEmptyString(value.currency)) {
    errors.push('provenance.cost.currency must be a non-empty string when the cost is tagged')
  }
  if (value.price_source !== null && !isNonEmptyString(value.price_source)) {
    errors.push('provenance.cost.price_source must be null or a non-empty string')
  }
  if (value.price_version !== null && !isNonEmptyString(value.price_version)) {
    errors.push('provenance.cost.price_version must be null or a non-empty string')
  }
}

function validateProvenance(
  value: unknown,
  outcome: ReasonOutcome | undefined,
  errors: string[],
): void {
  if (!isRecord(value)) {
    errors.push('provenance must be a JSON object')
    return
  }
  checkKeys(
    value,
    [
      'provider',
      'model',
      'input_tokens',
      'output_tokens',
      'provider_cached_tokens',
      'latency_ms',
      'failure',
      'retries',
      'cost',
      'occurrence',
    ],
    'provenance',
    errors,
  )
  for (const key of ['provider', 'model']) {
    if (value[key] !== null && !isNonEmptyString(value[key])) {
      errors.push(`provenance.${key} must be null or a non-empty string`)
    }
  }
  for (const key of ['input_tokens', 'output_tokens', 'provider_cached_tokens']) {
    if (value[key] !== null && !isCountLike(value[key], true)) {
      errors.push(`provenance.${key} must be null or an integer >= 0`)
    }
  }
  if (value.latency_ms !== null && !isCountLike(value.latency_ms, false)) {
    errors.push('provenance.latency_ms must be null or a finite number >= 0')
  }
  if (!isCountLike(value.retries, true)) {
    errors.push('provenance.retries must be an integer >= 0')
  }
  if (
    typeof value.occurrence !== 'number' ||
    !Number.isInteger(value.occurrence) ||
    value.occurrence < 1
  ) {
    errors.push('provenance.occurrence must be an integer >= 1')
  }
  const failure = value.failure
  if (failure !== null && !isNonEmptyString(failure)) {
    errors.push('provenance.failure must be null or a non-empty string')
  }
  // A failed call is never recorded as success (charter D5:70).
  if (outcome === 'success' || outcome === 'notice') {
    if (failure !== null) {
      errors.push(`provenance.failure must be null when the reason outcome is '${outcome}'`)
    }
  } else if (outcome === 'failure' || outcome === 'refusal') {
    if (!isNonEmptyString(failure)) {
      errors.push(
        `provenance.failure must be a non-empty string when the reason outcome is '${outcome}'`,
      )
    }
  }
  validateCost(value.cost, errors)
}

/**
 * The canonical `required_inputs` spellings — `['text'] | ['image'] |
 * ['text','image']` (closed membership + unique values + the fixed
 * INPUT_MODALITIES order the field contract documents). Deliberate duplication
 * of the closed `text | image` set: package boundary — receipts/ must not
 * import routing-policy's vocabulary — mirroring the inline `allow | deny`
 * enum precedent below.
 */
function isCanonicalRequiredInputs(value: unknown): boolean {
  const canonicalSpellings: readonly (readonly string[])[] = [
    ['text'],
    ['image'],
    ['text', 'image'],
  ]
  return (
    Array.isArray(value) &&
    canonicalSpellings.some(
      (spelling) =>
        spelling.length === value.length &&
        spelling.every((entry, index) => value[index] === entry),
    )
  )
}

function validateEffectiveRequirements(value: unknown, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push('bindings.effective_requirements must be a JSON object')
    return
  }
  checkKeys(
    value,
    ['routing_class', 'data_classification', 'transport_requirements'],
    'bindings.effective_requirements',
    errors,
    ['required_inputs', 'required_thinking_level', 'expertise'],
  )
  if (!isNonEmptyString(value.routing_class)) {
    errors.push('bindings.effective_requirements.routing_class must be a non-empty string')
  }
  if (!isNonEmptyString(value.data_classification)) {
    errors.push('bindings.effective_requirements.data_classification must be a non-empty string')
  }
  // RCM-P4A (C4.1) additive optional keys — validated when present, accepted
  // when absent (pre-carry receipts); unknown keys still refuse (checkKeys).
  if ('required_inputs' in value) {
    const inputs = value.required_inputs
    if (
      !Array.isArray(inputs) ||
      inputs.length === 0 ||
      inputs.some((entry) => !isNonEmptyString(entry)) ||
      new Set(inputs).size !== inputs.length
    ) {
      errors.push(
        'bindings.effective_requirements.required_inputs must be a non-empty array of unique non-empty strings',
      )
    }
    if (!isCanonicalRequiredInputs(inputs)) {
      errors.push(
        "bindings.effective_requirements.required_inputs must be canonical INPUT_MODALITIES order — ['text'] | ['image'] | ['text', 'image']",
      )
    }
  }
  if ('required_thinking_level' in value && !isNonEmptyString(value.required_thinking_level)) {
    errors.push(
      'bindings.effective_requirements.required_thinking_level must be a non-empty string',
    )
  }
  if ('expertise' in value && !isNonEmptyString(value.expertise)) {
    errors.push('bindings.effective_requirements.expertise must be a non-empty string')
  }
  const transport = value.transport_requirements
  if (!isRecord(transport)) {
    errors.push('bindings.effective_requirements.transport_requirements must be a JSON object')
    return
  }
  checkKeys(
    transport,
    ['data_collection', 'zdr'],
    'bindings.effective_requirements.transport_requirements',
    errors,
  )
  if (transport.data_collection !== 'allow' && transport.data_collection !== 'deny') {
    errors.push(
      "bindings.effective_requirements.transport_requirements.data_collection must be 'allow' or 'deny'",
    )
  }
  if (typeof transport.zdr !== 'boolean') {
    errors.push('bindings.effective_requirements.transport_requirements.zdr must be a boolean')
  }
}

function validatePolicyDigest(value: unknown, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push('bindings.policy_digest must be a JSON object')
    return
  }
  checkKeys(value, ['version', 'content_digest'], 'bindings.policy_digest', errors)
  if (!isNonEmptyString(value.version)) {
    errors.push('bindings.policy_digest.version must be a non-empty string')
  }
  if (typeof value.content_digest !== 'string' || !HASH_RE.test(value.content_digest)) {
    errors.push('bindings.policy_digest.content_digest must be a sha256 hex digest')
  }
}

function validateContextFloor(value: unknown, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push('bindings.derived_context_floor must be a JSON object')
    return
  }
  checkKeys(
    value,
    ['required_context_tokens', 'required_output_tokens'],
    'bindings.derived_context_floor',
    errors,
  )
  for (const key of ['required_context_tokens', 'required_output_tokens']) {
    if (value[key] !== null && !isCountLike(value[key], true)) {
      errors.push(`bindings.derived_context_floor.${key} must be null or an integer >= 0`)
    }
  }
}

function validatePredicateSet(value: unknown, errors: string[]): void {
  if (!Array.isArray(value)) {
    errors.push('bindings.predicate_set must be an array')
    return
  }
  if (value.length === 0) {
    errors.push('bindings.predicate_set must not be empty')
    return
  }
  const seen = new Set<string>()
  for (const entry of value) {
    if (
      typeof entry !== 'string' ||
      !(DECISION_PREDICATE_IDS as readonly string[]).includes(entry)
    ) {
      errors.push(
        `bindings.predicate_set entry ${JSON.stringify(entry)} is not a known DecisionPredicateId`,
      )
      continue
    }
    if (seen.has(entry)) {
      errors.push(`bindings.predicate_set repeats '${entry}' (a set, never a bag)`)
    }
    seen.add(entry)
  }
}

function validateSelectedIdentity(value: unknown, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push('bindings.selected_identity must be a JSON object')
    return
  }
  checkKeys(
    value,
    ['registry_key', 'provider_local_id', 'protocol', 'pi_host_model_id'],
    'bindings.selected_identity',
    errors,
  )
  // D2's distinct-values rule: absent = null (unknown), never derived from
  // the registry key or host id. All-null means no model was selected.
  for (const key of ['registry_key', 'provider_local_id', 'protocol', 'pi_host_model_id']) {
    if (value[key] !== null && !isNonEmptyString(value[key])) {
      errors.push(`bindings.selected_identity.${key} must be null or a non-empty string`)
    }
  }
}

function validateReplayBindings(value: unknown, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push('bindings must be a JSON object')
    return
  }
  checkKeys(
    value,
    [
      'effective_requirements',
      'policy_digest',
      'catalog_snapshot_digest',
      'vocabulary_version',
      'derived_context_floor',
      'predicate_set',
      'selected_identity',
    ],
    'bindings',
    errors,
  )
  validateEffectiveRequirements(value.effective_requirements, errors)
  validatePolicyDigest(value.policy_digest, errors)
  if (
    typeof value.catalog_snapshot_digest !== 'string' ||
    !HASH_RE.test(value.catalog_snapshot_digest)
  ) {
    errors.push('bindings.catalog_snapshot_digest must be a sha256 hex digest')
  }
  if (!isNonEmptyString(value.vocabulary_version)) {
    errors.push('bindings.vocabulary_version must be a non-empty string')
  }
  validateContextFloor(value.derived_context_floor, errors)
  validatePredicateSet(value.predicate_set, errors)
  validateSelectedIdentity(value.selected_identity, errors)
}

function validateCacheKey(value: unknown, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push('cache_key must be a JSON object')
    return
  }
  checkKeys(
    value,
    ['schema_version', 'policy_digest', 'routing_class', 'data_classification'],
    'cache_key',
    errors,
    ['required_inputs', 'required_thinking_level', 'required_context_tokens', 'expertise'],
  )
  // RCM-P4A (C3.5/C4) additive optional keys — validated when present,
  // accepted when absent (pre-carry records).
  if ('required_inputs' in value) {
    const inputs = value.required_inputs
    if (
      !Array.isArray(inputs) ||
      inputs.length === 0 ||
      inputs.some((entry) => !isNonEmptyString(entry)) ||
      new Set(inputs).size !== inputs.length
    ) {
      errors.push('cache_key.required_inputs must be a non-empty array of unique non-empty strings')
    }
    if (!isCanonicalRequiredInputs(inputs)) {
      errors.push(
        "cache_key.required_inputs must be canonical INPUT_MODALITIES order — ['text'] | ['image'] | ['text', 'image']",
      )
    }
  }
  if ('required_thinking_level' in value && !isNonEmptyString(value.required_thinking_level)) {
    errors.push('cache_key.required_thinking_level must be a non-empty string')
  }
  if ('required_context_tokens' in value) {
    const floor = value.required_context_tokens
    if (typeof floor !== 'number' || !Number.isInteger(floor) || floor < 1) {
      errors.push('cache_key.required_context_tokens must be a positive integer')
    }
  }
  if ('expertise' in value && !isNonEmptyString(value.expertise)) {
    errors.push('cache_key.expertise must be a non-empty string')
  }
  if (typeof value.schema_version !== 'number' || !Number.isInteger(value.schema_version)) {
    errors.push('cache_key.schema_version must be an integer')
  }
  if (typeof value.policy_digest !== 'string' || !HASH_RE.test(value.policy_digest)) {
    errors.push('cache_key.policy_digest must be a sha256 hex digest')
  }
  if (!isNonEmptyString(value.routing_class)) {
    errors.push('cache_key.routing_class must be a non-empty string')
  }
  if (!isNonEmptyString(value.data_classification)) {
    errors.push('cache_key.data_classification must be a non-empty string')
  }
}

/**
 * Validation invariants for the event subject kinds (C1.2). Accepts a
 * well-formed subject of a known kind; rejects malformed ones with a typed
 * `ValidationResult` whose errors name the offending field.
 */
export function validateEventSubject(subjectKind: string, subject: unknown): ValidationResult {
  const kindNames = ROUTING_EVENT_SUBJECT_KINDS as readonly string[]
  if (!kindNames.includes(subjectKind)) {
    return { valid: false, errors: [`unknown event subjectKind ${JSON.stringify(subjectKind)}`] }
  }
  const expectedKind = SUBJECT_KIND_EVENT_KIND[subjectKind as RoutingEventSubjectKind]
  if (!isRecord(subject)) {
    return { valid: false, errors: ['subject must be a JSON object'] }
  }

  const errors: string[] = []
  const subjectKeys =
    subjectKind === 'RoutingDecisionEvent'
      ? ['event_kind', 'reason', 'bindings', 'provenance']
      : subjectKind === 'RoutingCacheEvent'
        ? ['event_kind', 'reason', 'vocabulary_version', 'cache_key', 'provenance']
        : ['event_kind', 'reason', 'vocabulary_version', 'provenance']
  checkKeys(subject, subjectKeys, 'subject', errors)

  if (subject.event_kind !== expectedKind) {
    errors.push(`subject.event_kind must be '${expectedKind}' for subjectKind '${subjectKind}'`)
  }

  let entry: ReasonVocabularyEntry | undefined
  const reason = subject.reason
  if (!isNonEmptyString(reason) || !(reason in REASON_VOCABULARY)) {
    errors.push(`subject.reason must be a REASON_VOCABULARY entry, got ${JSON.stringify(reason)}`)
  } else {
    entry = REASON_VOCABULARY[reason as ReasonCode]
    if (entry.kind !== expectedKind) {
      errors.push(
        `subject.reason '${reason}' belongs to event kind '${entry.kind}', not '${expectedKind}'`,
      )
    }
  }

  if (subjectKind === 'RoutingDecisionEvent') {
    validateReplayBindings(subject.bindings, errors)
  } else {
    if (!isNonEmptyString(subject.vocabulary_version)) {
      errors.push('subject.vocabulary_version must be a non-empty string')
    }
    if (subjectKind === 'RoutingCacheEvent') {
      validateCacheKey(subject.cache_key, errors)
    }
  }

  validateProvenance(subject.provenance, entry?.outcome, errors)
  return { valid: errors.length === 0, errors }
}

// ─── RCM-P8A replay verifier (C1.2/C2) ───────────────────────────────────────

export type ReplayBindingName =
  | 'effective_requirements'
  | 'policy_digest'
  | 'catalog_snapshot_digest'
  | 'vocabulary_version'
  | 'derived_context_floor'
  | 'predicate_set'
  | 'selected_identity'

export interface ReplayRefusal {
  readonly code: 'REPLAY_REFUSED'
  /** The mismatched binding, named as a field — never string matching (D10). */
  readonly binding: ReplayBindingName
  readonly detail: string
}

export type ReplayVerification =
  | { readonly status: 'reproduced'; readonly decision: SelectedIdentity }
  | { readonly status: 'refused'; readonly refusal: ReplayRefusal }

const REPLAY_BINDING_ORDER: readonly ReplayBindingName[] = [
  'effective_requirements',
  'policy_digest',
  'catalog_snapshot_digest',
  'vocabulary_version',
  'derived_context_floor',
  'predicate_set',
  'selected_identity',
]

/** Structural equality over JSON values (order-insensitive object keys). */
function jsonEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((entry, index) => jsonEqual(entry, b[index]))
  }
  if (isRecord(a) && isRecord(b)) {
    const aKeys = Object.keys(a)
    const bKeys = Object.keys(b)
    return (
      aKeys.length === bKeys.length && aKeys.every((key) => key in b && jsonEqual(a[key], b[key]))
    )
  }
  return false
}

/**
 * The RCM-P8A replay verifier (exit criterion 8): given a recorded
 * decision/replay receipt subject and the current bound inputs, it either
 * reproduces the recorded decision or returns a typed refusal naming the
 * mismatched binding. Comparison order is the exit-criterion-8 listing order,
 * so the named binding is deterministic.
 */
export function verifyReplay(
  recorded: Pick<RoutingDecisionSubject, 'bindings'>,
  current: ReplayBindings,
): ReplayVerification {
  const bindings = recorded.bindings
  for (const binding of REPLAY_BINDING_ORDER) {
    if (!jsonEqual(bindings[binding], current[binding])) {
      return {
        status: 'refused',
        refusal: {
          code: 'REPLAY_REFUSED',
          binding,
          detail: `recorded binding '${binding}' does not match the current bound input`,
        },
      }
    }
  }
  return { status: 'reproduced', decision: bindings.selected_identity }
}

/**
 * RCM-P4A executed-identity reconciliation (exit criterion 8, MRC-05 C4.4):
 * given the recorded decision/replay bindings and the executed model identity
 * (the caller supplies `ResultEnvelope.modelRef` as that string — this package
 * imports no envelope type), it either reproduces the recorded decision or
 * returns a typed refusal naming `selected_identity`. Decided THROUGH
 * {@link verifyReplay} — exit-criterion-8 semantics, no parallel verdict
 * shape: the "current" bindings are the recorded bindings with
 * `selected_identity.registry_key` := `executedModelRef`.
 *
 * Rules (each controlled):
 * - exact string equality on `registry_key` ONLY — a modelRef matching only
 *   `pi_host_model_id`/`provider_local_id`/`protocol` refuses (D2's
 *   distinct-values rule: no identity aliasing, no normalization);
 * - a decision that selected nothing (`registry_key: null`) refuses ANY
 *   executed identity (an execution claim against a `ROUTE_UNAVAILABLE`
 *   decision);
 * - an empty/non-string `executedModelRef` refuses typed (the result-envelope
 *   contract requires an opaque, non-empty registry-key string).
 */
export function verifyExecutedIdentity(
  recorded: ReplayBindings,
  executedModelRef: string,
): ReplayVerification {
  if (typeof executedModelRef !== 'string' || executedModelRef.trim().length === 0) {
    return {
      status: 'refused',
      refusal: {
        code: 'REPLAY_REFUSED',
        binding: 'selected_identity',
        detail: `executed modelRef must be an opaque, non-empty registry-key string (result-envelope contract), got ${JSON.stringify(executedModelRef)}`,
      },
    }
  }
  const current: ReplayBindings = {
    ...recorded,
    selected_identity: { ...recorded.selected_identity, registry_key: executedModelRef },
  }
  return verifyReplay({ bindings: recorded }, current)
}
