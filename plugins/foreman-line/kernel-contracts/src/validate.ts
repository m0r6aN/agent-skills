/**
 * Pure structural and semantic validators for the FK-P1 kernel contracts.
 *
 * No filesystem, network, time or process side effects; no evaluator or policy
 * implementation lives here. The validators reject unknown fields, unknown enum
 * values, missing required data and over-limit input (rejected before expensive
 * traversal). Over-limit is a PAYLOAD_LIMIT_EXCEEDED protocol error and never a
 * truncation of a refusal list.
 *
 * Error taxonomy (F05.12 boundary codes produced by this layer):
 *   - INVALID_REQUEST           — malformed / unknown field / unknown enum /
 *                                 invalid value shape (incl. negative zero,
 *                                 unpaired surrogates, unanchorable or
 *                                 structurally invalid idempotency bindings)
 *   - UNSUPPORTED_VERSION       — apiVersion mismatch (no silent default)
 *   - PAYLOAD_LIMIT_EXCEEDED    — any bound/limit violation (document size,
 *                                 depth, string bytes, array members)
 *
 * Layering note: the closed draft-07 schemas in `src/schemas.ts` are the
 * structural wire contract; this layer additionally enforces what JSON Schema
 * draft-07 cannot express (UTF-8 byte bounds vs code-point lengths, negative
 * zero, unpaired surrogates, document size/depth, cross-field rules). The two
 * layers agree on every rejection the schema can express.
 */
import type { ProtocolCode } from './types.js'
import {
  ASSURANCE_LEVELS,
  type AssuranceEvidenceKind,
  AUTHENTICATED_PRINCIPAL_CLASSES,
  CLAIMED_ACTION_CLASSES,
  DECISIONS,
  EFFECT_KINDS,
  EFFECTIVE_ACTION_CLASSES,
  EXPECTED_RESPONSE_KINDS,
  GATE_EVIDENCE_KINDS,
  HOST_POSTURE_CLAIMS,
  INPUT_TRUST_ORIGINS,
  MISSING_ASSURANCE_REASONS,
  MODES,
  NORMALIZER_PARCELS,
  OBLIGATION_KINDS,
  P0_ASSURANCE_LEVELS,
  P0_ENFORCEMENT_OWNERS,
  P0_RESOLUTION_REASON_CODES,
  P0_RESOLVED_DECISIONS,
  P0_RULE_CLASSIFICATIONS,
  P0_SEVERITIES,
  PATH_FORMS,
  PROTOCOL_CODES,
  REQUIRED_EVIDENCE_KIND_BY_LEVEL,
  ROLE_SELECTIONS,
  STAGE_SELECTIONS,
  TRUST_STAGE_EXPECTATIONS,
  WIRE_CODE_RULES,
  WIRE_CODES,
  type WireCode,
} from './types.js'

export type ValidationCode = Extract<
  ProtocolCode,
  'INVALID_REQUEST' | 'UNSUPPORTED_VERSION' | 'PAYLOAD_LIMIT_EXCEEDED'
>

export interface ValidationIssue {
  readonly code: ValidationCode
  readonly path: string
  readonly message: string
}

// --- general wire bounds (P1-S06, P1-S07) ----------------------------------

const MAX_DOCUMENT_BYTES = 1_048_576
const MAX_DEPTH = 16
const MAX_STRING_BYTES = 65_536
const MAX_LIST_MEMBERS = 64
const MAX_ASSURANCE_EVIDENCE = 8
const SAFE_INT_MAX = 9007199254740991
const ID_PATTERN = /^[A-Za-z0-9._-]+$/
const DIGEST_PATTERN = /^sha256:[0-9a-f]{64}$/
const VIOLATION_PATH_PATTERN = /^[A-Za-z0-9._\-/[\]]+$/

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function add(issues: ValidationIssue[], code: ValidationCode, path: string, message: string): void {
  issues.push({ code, path, message })
}

/** One linear pass: UTF-8 byte length and unpaired-surrogate detection. */
function scanString(value: string): { bytes: number; unpaired: boolean } {
  let bytes = 0
  let unpaired = false
  for (let i = 0; i < value.length; i += 1) {
    const unit = value.charCodeAt(i)
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = i + 1 < value.length ? value.charCodeAt(i + 1) : 0
      if (next >= 0xdc00 && next <= 0xdfff) {
        bytes += 4
        i += 1
      } else {
        unpaired = true
        bytes += 3
      }
    } else if (unit >= 0xdc00 && unit <= 0xdfff) {
      unpaired = true
      bytes += 3
    } else if (unit <= 0x7f) {
      bytes += 1
    } else if (unit <= 0x7ff) {
      bytes += 2
    } else {
      bytes += 3
    }
  }
  return { bytes, unpaired }
}

function checkString(
  issues: ValidationIssue[],
  path: string,
  value: unknown,
  maxBytes: number,
  what: string,
): void {
  if (typeof value !== 'string') {
    add(issues, 'INVALID_REQUEST', path, `${what} must be a string`)
    return
  }
  const { bytes, unpaired } = scanString(value)
  if (bytes > maxBytes) {
    add(issues, 'PAYLOAD_LIMIT_EXCEEDED', path, `${what} exceeds ${maxBytes} UTF-8 bytes`)
    return
  }
  if (unpaired) {
    add(issues, 'INVALID_REQUEST', path, `${what} contains an unpaired Unicode surrogate`)
  }
}

function checkAsciiBytes(
  issues: ValidationIssue[],
  path: string,
  value: unknown,
  maxBytes: number,
  what: string,
): void {
  if (typeof value !== 'string') {
    add(issues, 'INVALID_REQUEST', path, `${what} must be a string`)
    return
  }
  const { bytes, unpaired } = scanString(value)
  if (bytes > maxBytes) {
    add(issues, 'PAYLOAD_LIMIT_EXCEEDED', path, `${what} exceeds ${maxBytes} UTF-8 bytes`)
    return
  }
  if (unpaired) {
    add(issues, 'INVALID_REQUEST', path, `${what} contains an unpaired Unicode surrogate`)
    return
  }
  for (let i = 0; i < value.length; i += 1) {
    if (value.charCodeAt(i) > 0x7f) {
      add(issues, 'INVALID_REQUEST', path, `${what} must be ASCII`)
      return
    }
  }
}

function checkId(issues: ValidationIssue[], path: string, value: unknown): void {
  if (typeof value !== 'string') {
    add(issues, 'INVALID_REQUEST', path, 'Id must be a string')
    return
  }
  const { bytes, unpaired } = scanString(value)
  if (unpaired) {
    add(issues, 'INVALID_REQUEST', path, 'Id contains an unpaired Unicode surrogate')
    return
  }
  if (bytes > 128) {
    add(issues, 'PAYLOAD_LIMIT_EXCEEDED', path, 'Id exceeds 128 characters')
    return
  }
  if (value.length === 0 || !ID_PATTERN.test(value)) {
    add(issues, 'INVALID_REQUEST', path, 'Id must be nonempty letters/digits/dot/underscore/hyphen')
  }
}

function checkNullableId(issues: ValidationIssue[], path: string, value: unknown): void {
  if (value !== null) checkId(issues, path, value)
}

function checkDigest(issues: ValidationIssue[], path: string, value: unknown): void {
  if (typeof value !== 'string' || !DIGEST_PATTERN.test(value)) {
    add(issues, 'INVALID_REQUEST', path, 'Digest must be sha256: plus 64 lowercase hex characters')
  }
}

function checkNullableDigest(issues: ValidationIssue[], path: string, value: unknown): void {
  if (value !== null) checkDigest(issues, path, value)
}

function checkSafeInt(issues: ValidationIssue[], path: string, value: unknown): void {
  if (typeof value !== 'number') {
    add(issues, 'INVALID_REQUEST', path, 'SafeInt must be a number')
    return
  }
  if (
    Number.isNaN(value) ||
    !Number.isFinite(value) ||
    Object.is(value, -0) ||
    !Number.isSafeInteger(value) ||
    value < 0 ||
    value > SAFE_INT_MAX
  ) {
    add(issues, 'INVALID_REQUEST', path, 'SafeInt must be an integer in the closed range 0..2^53-1')
  }
}

function checkNullableSafeInt(issues: ValidationIssue[], path: string, value: unknown): void {
  if (value !== null) checkSafeInt(issues, path, value)
}

function checkEnum(
  issues: ValidationIssue[],
  path: string,
  value: unknown,
  allowed: readonly string[],
  what: string,
): void {
  if (typeof value !== 'string' || !allowed.includes(value)) {
    add(issues, 'INVALID_REQUEST', path, `unknown ${what} value`)
    return
  }
}

function checkConst(
  issues: ValidationIssue[],
  path: string,
  value: unknown,
  expected: unknown,
  what: string,
): void {
  if (value !== expected) {
    add(issues, 'INVALID_REQUEST', path, `${what} must equal ${JSON.stringify(expected)}`)
  }
}

function checkArray(
  issues: ValidationIssue[],
  path: string,
  value: unknown,
  maxMembers: number,
  what: string,
): value is unknown[] {
  if (!Array.isArray(value)) {
    add(issues, 'INVALID_REQUEST', path, `${what} must be an array`)
    return false
  }
  if (value.length > maxMembers) {
    add(issues, 'PAYLOAD_LIMIT_EXCEEDED', path, `${what} exceeds ${maxMembers} members`)
    return false
  }
  return true
}

function checkKeys(
  issues: ValidationIssue[],
  path: string,
  value: Record<string, unknown>,
  required: readonly string[],
  optional: readonly string[] = [],
): void {
  for (const key of required) {
    if (!(key in value)) add(issues, 'INVALID_REQUEST', `${path}.${key}`, 'missing required member')
  }
  for (const key of Object.keys(value)) {
    if (!required.includes(key) && !optional.includes(key)) {
      add(issues, 'INVALID_REQUEST', `${path}.${key}`, 'unknown member (schemas are closed)')
    }
  }
}

function objectAt(
  issues: ValidationIssue[],
  path: string,
  value: unknown,
  required: readonly string[],
): Record<string, unknown> | null {
  if (!isPlainObject(value)) {
    add(issues, 'INVALID_REQUEST', path, 'must be an object')
    return null
  }
  checkKeys(issues, path, value, required)
  return value
}

function computeDepth(value: unknown, depth: number): number {
  if (depth > MAX_DEPTH) return depth
  if (Array.isArray(value)) {
    let deepest = depth
    for (const member of value) {
      const memberDepth = computeDepth(member, depth + 1)
      if (memberDepth > deepest) deepest = memberDepth
      if (deepest > MAX_DEPTH) return deepest
    }
    return deepest
  }
  if (isPlainObject(value)) {
    let deepest = depth
    for (const key of Object.keys(value)) {
      const memberDepth = computeDepth(value[key], depth + 1)
      if (memberDepth > deepest) deepest = memberDepth
      if (deepest > MAX_DEPTH) return deepest
    }
    return deepest
  }
  return depth
}

/** Pre-traversal general bounds: document size and depth (P1-S07). */
function checkDocumentBounds(issues: ValidationIssue[], doc: unknown): boolean {
  if (!isPlainObject(doc)) {
    add(issues, 'INVALID_REQUEST', '$', 'request document must be a JSON object')
    return false
  }
  let serialized: string | undefined
  try {
    serialized = JSON.stringify(doc)
  } catch {
    add(issues, 'INVALID_REQUEST', '$', 'request document is not JSON-serializable')
    return false
  }
  if (serialized !== undefined) {
    const bytes = new TextEncoder().encode(serialized).length
    if (bytes > MAX_DOCUMENT_BYTES) {
      add(issues, 'PAYLOAD_LIMIT_EXCEEDED', '$', 'document exceeds 1 MiB')
      return false
    }
  }
  if (computeDepth(doc, 1) > MAX_DEPTH) {
    add(issues, 'PAYLOAD_LIMIT_EXCEEDED', '$', `document nesting exceeds depth ${MAX_DEPTH}`)
    return false
  }
  return true
}

function checkApiVersion(issues: ValidationIssue[], path: string, value: unknown): void {
  if (value === '0.1.0') return
  if (typeof value === 'string' && scanString(value).bytes <= 32) {
    add(issues, 'UNSUPPORTED_VERSION', path, 'apiVersion must be exactly 0.1.0')
    return
  }
  add(issues, 'INVALID_REQUEST', path, 'apiVersion must be a string')
}

// ---------------------------------------------------------------------------
// F05.2 LifecycleEvent
// ---------------------------------------------------------------------------

const LIFECYCLE_KEYS = [
  'event',
  'apiVersion',
  'eventId',
  'sessionRef',
  'hostAdapterRef',
  'claimedRepositoryRef',
  'claimedWorktreeRef',
  'actionRef',
  'claimedActionClass',
  'payload',
] as const

function validateProposedPath(issues: ValidationIssue[], path: string, value: unknown): void {
  const obj = objectAt(issues, path, value, ['rawPath', 'pathForm'])
  if (obj === null) return
  checkString(issues, `${path}.rawPath`, obj.rawPath, 4096, 'rawPath')
  checkEnum(issues, `${path}.pathForm`, obj.pathForm, PATH_FORMS, 'pathForm')
}

function validateObservedEffect(issues: ValidationIssue[], path: string, value: unknown): void {
  const obj = objectAt(issues, path, value, ['effectKind', 'descriptor', 'digest'])
  if (obj === null) return
  checkEnum(issues, `${path}.effectKind`, obj.effectKind, EFFECT_KINDS, 'effectKind')
  checkString(issues, `${path}.descriptor`, obj.descriptor, 4096, 'descriptor')
  checkNullableDigest(issues, `${path}.digest`, obj.digest)
}

export function validateLifecycleEvent(doc: unknown): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  if (!checkDocumentBounds(issues, doc)) return issues
  const obj = doc as Record<string, unknown>
  checkApiVersion(issues, '$.apiVersion', obj.apiVersion)
  if (typeof obj.event !== 'string') {
    add(issues, 'INVALID_REQUEST', '$.event', 'event must be one of the four lifecycle events')
    return issues
  }
  if (!['sessionStart', 'preToolUse', 'postToolUse', 'stop'].includes(obj.event)) {
    add(issues, 'INVALID_REQUEST', '$.event', 'unknown lifecycle event')
    return issues
  }
  checkKeys(issues, '$', obj, LIFECYCLE_KEYS)
  checkId(issues, '$.eventId', obj.eventId)
  checkId(issues, '$.sessionRef', obj.sessionRef)
  checkId(issues, '$.hostAdapterRef', obj.hostAdapterRef)
  checkNullableId(issues, '$.claimedRepositoryRef', obj.claimedRepositoryRef)
  checkNullableId(issues, '$.claimedWorktreeRef', obj.claimedWorktreeRef)
  checkId(issues, '$.actionRef', obj.actionRef)
  checkEnum(
    issues,
    '$.claimedActionClass',
    obj.claimedActionClass,
    CLAIMED_ACTION_CLASSES,
    'claimedActionClass',
  )
  switch (obj.event) {
    case 'sessionStart': {
      const payload = objectAt(issues, '$.payload', obj.payload, [])
      if (payload !== null && Object.keys(payload).length > 0) {
        add(
          issues,
          'INVALID_REQUEST',
          '$.payload',
          'sessionStart payload is an empty closed object',
        )
      }
      break
    }
    case 'preToolUse': {
      const payload = objectAt(issues, '$.payload', obj.payload, ['toolRef', 'proposedPaths'])
      if (payload !== null) {
        checkId(issues, '$.payload.toolRef', payload.toolRef)
        if (
          checkArray(
            issues,
            '$.payload.proposedPaths',
            payload.proposedPaths,
            MAX_LIST_MEMBERS,
            'proposedPaths',
          )
        ) {
          payload.proposedPaths.forEach((entry, index) => {
            validateProposedPath(issues, `$.payload.proposedPaths[${index}]`, entry)
          })
        }
      }
      break
    }
    case 'postToolUse': {
      const payload = objectAt(issues, '$.payload', obj.payload, ['toolRef', 'observedEffects'])
      if (payload !== null) {
        checkId(issues, '$.payload.toolRef', payload.toolRef)
        if (
          checkArray(
            issues,
            '$.payload.observedEffects',
            payload.observedEffects,
            MAX_LIST_MEMBERS,
            'observedEffects',
          )
        ) {
          payload.observedEffects.forEach((entry, index) => {
            validateObservedEffect(issues, `$.payload.observedEffects[${index}]`, entry)
          })
        }
      }
      break
    }
    default: {
      const payload = objectAt(issues, '$.payload', obj.payload, ['requestedCompletionSubject'])
      if (payload !== null) {
        checkId(issues, '$.payload.requestedCompletionSubject', payload.requestedCompletionSubject)
      }
    }
  }
  return issues
}

// ---------------------------------------------------------------------------
// F05.3 AdmittedContext
// ---------------------------------------------------------------------------

const AUTHENTICATED_CONTEXT_KEYS = [
  'principalKind',
  'principalRef',
  'principalClass',
  'capabilityRef',
  'capabilityGeneration',
  'capabilityValidUntilMicros',
  'capabilityRevocationRef',
  'admissionIssuerRef',
  'admittedEndpoint',
  'boundRepositoryRef',
  'boundWorktreeRef',
  'boundSessionRef',
  'permittedOperationIds',
  'roleSelection',
  'stageSelection',
  'provenanceRef',
] as const

const ANONYMOUS_CONTEXT_KEYS = [
  'principalKind',
  'principalClass',
  'admittedEndpoint',
  'boundSessionRef',
] as const

function validateProvenanceRef(issues: ValidationIssue[], path: string, value: unknown): void {
  const obj = objectAt(issues, path, value, ['provenanceId', 'hostAdapterRef', 'provenanceDigest'])
  if (obj === null) return
  checkId(issues, `${path}.provenanceId`, obj.provenanceId)
  checkId(issues, `${path}.hostAdapterRef`, obj.hostAdapterRef)
  checkDigest(issues, `${path}.provenanceDigest`, obj.provenanceDigest)
}

export function validateAdmittedContext(doc: unknown): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  if (!isPlainObject(doc)) {
    add(issues, 'INVALID_REQUEST', '$', 'AdmittedContext must be an object')
    return issues
  }
  if (doc.principalKind === 'authenticated') {
    checkKeys(issues, '$', doc, AUTHENTICATED_CONTEXT_KEYS)
    checkId(issues, '$.principalRef', doc.principalRef)
    checkEnum(
      issues,
      '$.principalClass',
      doc.principalClass,
      AUTHENTICATED_PRINCIPAL_CLASSES,
      'principalClass',
    )
    checkId(issues, '$.capabilityRef', doc.capabilityRef)
    checkSafeInt(issues, '$.capabilityGeneration', doc.capabilityGeneration)
    checkNullableSafeInt(issues, '$.capabilityValidUntilMicros', doc.capabilityValidUntilMicros)
    checkNullableId(issues, '$.capabilityRevocationRef', doc.capabilityRevocationRef)
    checkId(issues, '$.admissionIssuerRef', doc.admissionIssuerRef)
    checkEnum(
      issues,
      '$.admittedEndpoint',
      doc.admittedEndpoint,
      ['control', 'read'],
      'admittedEndpoint',
    )
    checkNullableId(issues, '$.boundRepositoryRef', doc.boundRepositoryRef)
    checkNullableId(issues, '$.boundWorktreeRef', doc.boundWorktreeRef)
    checkId(issues, '$.boundSessionRef', doc.boundSessionRef)
    if (
      checkArray(
        issues,
        '$.permittedOperationIds',
        doc.permittedOperationIds,
        MAX_LIST_MEMBERS,
        'permittedOperationIds',
      )
    ) {
      doc.permittedOperationIds.forEach((entry, index) => {
        checkId(issues, `$.permittedOperationIds[${index}]`, entry)
      })
    }
    checkEnum(issues, '$.roleSelection', doc.roleSelection, ROLE_SELECTIONS, 'roleSelection')
    checkEnum(issues, '$.stageSelection', doc.stageSelection, STAGE_SELECTIONS, 'stageSelection')
    validateProvenanceRef(issues, '$.provenanceRef', doc.provenanceRef)
    return issues
  }
  if (doc.principalKind === 'anonymous-content') {
    checkKeys(issues, '$', doc, ANONYMOUS_CONTEXT_KEYS)
    checkConst(issues, '$.principalClass', doc.principalClass, 'anonymous-read', 'principalClass')
    checkConst(issues, '$.admittedEndpoint', doc.admittedEndpoint, 'read', 'admittedEndpoint')
    checkNullableId(issues, '$.boundSessionRef', doc.boundSessionRef)
    return issues
  }
  add(issues, 'INVALID_REQUEST', '$.principalKind', 'unknown principalKind')
  return issues
}

// ---------------------------------------------------------------------------
// F05.4 AuthorizeActionInput
// ---------------------------------------------------------------------------

function validateLeaseCasDescriptor(issues: ValidationIssue[], path: string, value: unknown): void {
  const obj = objectAt(issues, path, value, [
    'leaseId',
    'leaseOwnerPrincipalRef',
    'casRevision',
    'leaseExpiresAtMicros',
  ])
  if (obj === null) return
  checkNullableId(issues, `${path}.leaseId`, obj.leaseId)
  checkNullableId(issues, `${path}.leaseOwnerPrincipalRef`, obj.leaseOwnerPrincipalRef)
  checkSafeInt(issues, `${path}.casRevision`, obj.casRevision)
  checkNullableSafeInt(issues, `${path}.leaseExpiresAtMicros`, obj.leaseExpiresAtMicros)
}

function validateGitGateEvidenceRef(issues: ValidationIssue[], path: string, value: unknown): void {
  const obj = objectAt(issues, path, value, ['evidenceKind', 'gitIdentity', 'digest'])
  if (obj === null) return
  checkEnum(issues, `${path}.evidenceKind`, obj.evidenceKind, GATE_EVIDENCE_KINDS, 'evidenceKind')
  checkString(issues, `${path}.gitIdentity`, obj.gitIdentity, 256, 'gitIdentity')
  checkDigest(issues, `${path}.digest`, obj.digest)
}

function validateIdempotencyBinding(issues: ValidationIssue[], path: string, value: unknown): void {
  const obj = objectAt(issues, path, value, [
    'principalRef',
    'operationId',
    'repositoryRef',
    'worktreeRef',
    'payloadDigest',
  ])
  if (obj === null) return
  checkId(issues, `${path}.principalRef`, obj.principalRef)
  checkId(issues, `${path}.operationId`, obj.operationId)
  checkId(issues, `${path}.repositoryRef`, obj.repositoryRef)
  checkId(issues, `${path}.worktreeRef`, obj.worktreeRef)
  checkDigest(issues, `${path}.payloadDigest`, obj.payloadDigest)
}

export function validateAuthorizeActionInput(doc: unknown): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  if (!checkDocumentBounds(issues, doc)) return issues
  const root = doc as Record<string, unknown>
  checkKeys(issues, '$', root, ['callerInputs', 'trustedBindings'])
  const callerInputs = objectAt(issues, '$.callerInputs', root.callerInputs, ['lifecycleEvent'])
  if (callerInputs !== null) {
    for (const issue of validateLifecycleEvent(callerInputs.lifecycleEvent)) {
      issues.push({ ...issue, path: `$.callerInputs.lifecycleEvent.${issue.path}` })
    }
  }
  const bindings = objectAt(issues, '$.trustedBindings', root.trustedBindings, [
    'admittedContext',
    'lifecycleProvenance',
    'effectiveActionClass',
    'repositoryIdentity',
    'policyDigest',
    'scopeDigest',
    'goalRevision',
    'leaseState',
    'gateEvidenceRefs',
    'mode',
    'observedEffects',
    'idempotencyKey',
  ])
  if (bindings === null) return issues

  const contextIssues = validateAdmittedContext(bindings.admittedContext)
  for (const issue of contextIssues) {
    issues.push({ ...issue, path: `$.trustedBindings.admittedContext.${issue.path}` })
  }
  validateProvenanceRef(
    issues,
    '$.trustedBindings.lifecycleProvenance',
    bindings.lifecycleProvenance,
  )
  checkEnum(
    issues,
    '$.trustedBindings.effectiveActionClass',
    bindings.effectiveActionClass,
    EFFECTIVE_ACTION_CLASSES,
    'effectiveActionClass',
  )
  if (bindings.repositoryIdentity !== null) {
    const identity = objectAt(
      issues,
      '$.trustedBindings.repositoryIdentity',
      bindings.repositoryIdentity,
      ['repositoryRef', 'worktreeRef'],
    )
    if (identity !== null) {
      checkId(issues, '$.trustedBindings.repositoryIdentity.repositoryRef', identity.repositoryRef)
      checkId(issues, '$.trustedBindings.repositoryIdentity.worktreeRef', identity.worktreeRef)
    }
  }
  checkDigest(issues, '$.trustedBindings.policyDigest', bindings.policyDigest)
  checkNullableDigest(issues, '$.trustedBindings.scopeDigest', bindings.scopeDigest)
  checkNullableSafeInt(issues, '$.trustedBindings.goalRevision', bindings.goalRevision)
  validateLeaseCasDescriptor(issues, '$.trustedBindings.leaseState', bindings.leaseState)
  if (
    checkArray(
      issues,
      '$.trustedBindings.gateEvidenceRefs',
      bindings.gateEvidenceRefs,
      MAX_LIST_MEMBERS,
      'gateEvidenceRefs',
    )
  ) {
    bindings.gateEvidenceRefs.forEach((entry, index) => {
      validateGitGateEvidenceRef(issues, `$.trustedBindings.gateEvidenceRefs[${index}]`, entry)
    })
  }
  checkEnum(issues, '$.trustedBindings.mode', bindings.mode, MODES, 'mode')
  if (
    checkArray(
      issues,
      '$.trustedBindings.observedEffects',
      bindings.observedEffects,
      MAX_LIST_MEMBERS,
      'observedEffects',
    )
  ) {
    bindings.observedEffects.forEach((entry, index) => {
      validateObservedEffect(issues, `$.trustedBindings.observedEffects[${index}]`, entry)
    })
  }

  // F05.4 binding scope (transition-only) + Step-0 F3 ruling: structurally
  // invalid or context-unanchorable idempotency bindings are structural
  // failures surfaced as INVALID_REQUEST before any evaluation.
  const binding = bindings.idempotencyKey
  if (binding === null) return issues
  const bindingIssues: ValidationIssue[] = []
  validateIdempotencyBinding(bindingIssues, '$.trustedBindings.idempotencyKey', binding)
  if (bindingIssues.length > 0) {
    issues.push(...bindingIssues)
    return issues
  }
  const context = bindings.admittedContext
  if (isPlainObject(context) && context.principalKind === 'anonymous-content') {
    add(
      issues,
      'INVALID_REQUEST',
      '$.trustedBindings.idempotencyKey',
      'idempotencyKey must be null for anonymous content-only requests (F05.4)',
    )
    return issues
  }
  const identity = bindings.repositoryIdentity
  const bindingRecord = binding as Record<string, unknown>
  const anchored =
    isPlainObject(context) &&
    isPlainObject(identity) &&
    bindingRecord.principalRef === context.principalRef &&
    bindingRecord.repositoryRef === identity.repositoryRef &&
    bindingRecord.worktreeRef === identity.worktreeRef
  if (!anchored) {
    add(
      issues,
      'INVALID_REQUEST',
      '$.trustedBindings.idempotencyKey',
      'idempotency binding is not anchored to the admitted principal and repository identity (F05.4, F3)',
    )
  }
  return issues
}

// ---------------------------------------------------------------------------
// F05.14 ReadRequest (D19)
// ---------------------------------------------------------------------------

export function validateReadRequest(doc: unknown): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  if (!checkDocumentBounds(issues, doc)) return issues
  const obj = doc as Record<string, unknown>
  if (obj.readKind === 'content-only') {
    checkKeys(issues, '$', obj, ['readKind', 'content', 'contentEncoding'])
    checkString(issues, '$.content', obj.content, 65536, 'content')
    checkConst(issues, '$.contentEncoding', obj.contentEncoding, 'utf-8', 'contentEncoding')
    return issues
  }
  if (obj.readKind === 'repository-read') {
    checkKeys(issues, '$', obj, ['readKind', 'repoId', 'relativePath', 'maxBytes'])
    checkId(issues, '$.repoId', obj.repoId)
    checkString(issues, '$.relativePath', obj.relativePath, 4096, 'relativePath')
    checkSafeInt(issues, '$.maxBytes', obj.maxBytes)
    if (
      typeof obj.maxBytes === 'number' &&
      Number.isSafeInteger(obj.maxBytes) &&
      obj.maxBytes > 1_048_576
    ) {
      add(issues, 'PAYLOAD_LIMIT_EXCEEDED', '$.maxBytes', 'maxBytes exceeds 1,048,576')
    }
    return issues
  }
  add(issues, 'INVALID_REQUEST', '$.readKind', 'unknown readKind')
  return issues
}

// ---------------------------------------------------------------------------
// F05.15 HostCapability (D20)
// ---------------------------------------------------------------------------

export function validateHostCapability(doc: unknown): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  if (!checkDocumentBounds(issues, doc)) return issues
  const obj = objectAt(issues, '$', doc, [
    'hostAdapterRef',
    'hostPostureClaim',
    'platformProbe',
    'rawHostPaths',
    'normalizationEvidence',
  ])
  if (obj === null) return issues
  checkId(issues, '$.hostAdapterRef', obj.hostAdapterRef)
  checkEnum(
    issues,
    '$.hostPostureClaim',
    obj.hostPostureClaim,
    HOST_POSTURE_CLAIMS,
    'hostPostureClaim',
  )
  const probe = objectAt(issues, '$.platformProbe', obj.platformProbe, [
    'probeName',
    'probeVersion',
  ])
  if (probe !== null) {
    checkString(issues, '$.platformProbe.probeName', probe.probeName, 128, 'probeName')
    checkString(issues, '$.platformProbe.probeVersion', probe.probeVersion, 128, 'probeVersion')
  }
  if (checkArray(issues, '$.rawHostPaths', obj.rawHostPaths, MAX_LIST_MEMBERS, 'rawHostPaths')) {
    obj.rawHostPaths.forEach((entry, index) => {
      const item = objectAt(issues, `$.rawHostPaths[${index}]`, entry, ['rawPath', 'pathForm'])
      if (item !== null) {
        checkString(issues, `$.rawHostPaths[${index}].rawPath`, item.rawPath, 4096, 'rawPath')
        checkEnum(
          issues,
          `$.rawHostPaths[${index}].pathForm`,
          item.pathForm,
          PATH_FORMS,
          'pathForm',
        )
      }
    })
  }
  if (obj.normalizationEvidence !== null) {
    const evidence = objectAt(issues, '$.normalizationEvidence', obj.normalizationEvidence, [
      'normalizationRef',
      'normalizerParcel',
      'digest',
    ])
    if (evidence !== null) {
      checkId(issues, '$.normalizationEvidence.normalizationRef', evidence.normalizationRef)
      checkEnum(
        issues,
        '$.normalizationEvidence.normalizerParcel',
        evidence.normalizerParcel,
        NORMALIZER_PARCELS,
        'normalizerParcel',
      )
      checkDigest(issues, '$.normalizationEvidence.digest', evidence.digest)
    }
  }
  return issues
}

// ---------------------------------------------------------------------------
// F05.16 LatencyContract / CacheDescriptor (D21)
// ---------------------------------------------------------------------------

const SPAN_ROWS = [
  ['kernelDecisionLatency', ['start', 'end', 'clock'] as const],
  ['mediatedActionLatency', ['start', 'end', 'clock'] as const],
  ['firstCallObservation', ['start', 'end', 'clock', 'includesStartup'] as const],
] as const

const SPAN_CONSTRAINTS: Record<string, Record<string, unknown>> = {
  kernelDecisionLatency: {
    start: 'decision-surface-request-received',
    end: 'response-written',
    clock: 'kernel-monotonic',
  },
  mediatedActionLatency: {
    start: 'host-lifecycle-entry',
    end: 'hook-exit',
    clock: 'adapter-monotonic',
  },
  firstCallObservation: {
    start: 'initial-lifecycle-invocation',
    end: 'hook-exit',
    clock: 'adapter-monotonic',
    includesStartup: true,
  },
}

const BUDGET_CONSTRAINTS: Record<string, number> = {
  kernelWarmP50: 5000,
  kernelWarmP95: 20000,
  kernelWarmP99: 50000,
  mediatedP99: 150000,
  firstCallMax: 2000000,
}

export function validateLatencyContract(doc: unknown): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  if (!checkDocumentBounds(issues, doc)) return issues
  const obj = objectAt(issues, '$', doc, [
    'spans',
    'budgetsMicros',
    'decisionDeadlineMicros',
    'deadlineDisposition',
    'lateResponsePolicy',
    'warmPopulation',
    'exclusionReporting',
    'percentileMethod',
    'cache',
  ])
  if (obj === null) return issues
  const spans = objectAt(issues, '$.spans', obj.spans, [
    'kernelDecisionLatency',
    'mediatedActionLatency',
    'firstCallObservation',
  ])
  if (spans !== null) {
    for (const [spanName, keys] of SPAN_ROWS) {
      const span = objectAt(issues, `$.spans.${spanName}`, spans[spanName], keys)
      if (span === null) continue
      for (const key of keys) {
        checkConst(
          issues,
          `$.spans.${spanName}.${key}`,
          span[key],
          SPAN_CONSTRAINTS[spanName]?.[key],
          key,
        )
      }
    }
  }
  const budgets = objectAt(
    issues,
    '$.budgetsMicros',
    obj.budgetsMicros,
    Object.keys(BUDGET_CONSTRAINTS),
  )
  if (budgets !== null) {
    for (const name of Object.keys(BUDGET_CONSTRAINTS)) {
      checkConst(issues, `$.budgetsMicros.${name}`, budgets[name], BUDGET_CONSTRAINTS[name], name)
    }
  }
  checkConst(
    issues,
    '$.decisionDeadlineMicros',
    obj.decisionDeadlineMicros,
    1000000,
    'decisionDeadlineMicros',
  )
  checkEnum(
    issues,
    '$.deadlineDisposition',
    obj.deadlineDisposition,
    [
      'evaluate-completed-response-at-or-under-deadline',
      'terminal-unreachable-when-none-completed',
    ],
    'deadlineDisposition',
  )
  checkConst(
    issues,
    '$.lateResponsePolicy',
    obj.lateResponsePolicy,
    'ignore-terminal-outcome',
    'lateResponsePolicy',
  )
  checkConst(
    issues,
    '$.warmPopulation',
    obj.warmPopulation,
    'completed-governed-mutation-decision-attempts-after-readiness-and-initial-invocation',
    'warmPopulation',
  )
  checkConst(
    issues,
    '$.exclusionReporting',
    obj.exclusionReporting,
    'failed-deadline-and-excluded-attempts-reported-separately',
    'exclusionReporting',
  )
  checkConst(issues, '$.percentileMethod', obj.percentileMethod, 'nearest-rank', 'percentileMethod')
  const cache = objectAt(issues, '$.cache', obj.cache, [
    'authorizationCache',
    'bindings',
    'matchSufficiency',
    'freshnessRevalidation',
    'ttlAuthority',
    'latencyEligibility',
  ])
  if (cache !== null) {
    checkConst(
      issues,
      '$.cache.authorizationCache',
      cache.authorizationCache,
      'disabled',
      'authorizationCache',
    )
    if (
      JSON.stringify(cache.bindings) !==
      JSON.stringify(['goalRevision', 'policyDigest', 'compiledScopeDigest'])
    ) {
      add(
        issues,
        'INVALID_REQUEST',
        '$.cache.bindings',
        'cache bindings must be the fixed three-binding literal',
      )
    }
    checkConst(
      issues,
      '$.cache.matchSufficiency',
      cache.matchSufficiency,
      'necessary-not-sufficient',
      'matchSufficiency',
    )
    if (
      JSON.stringify(cache.freshnessRevalidation) !==
      JSON.stringify([
        'effective-action-request',
        'principal-capability-generation',
        'repository-worktree',
        'lease-gate-freshness',
      ])
    ) {
      add(
        issues,
        'INVALID_REQUEST',
        '$.cache.freshnessRevalidation',
        'freshnessRevalidation must be the fixed four-entry literal',
      )
    }
    checkConst(issues, '$.cache.ttlAuthority', cache.ttlAuthority, 'none', 'ttlAuthority')
    checkConst(
      issues,
      '$.cache.latencyEligibility',
      cache.latencyEligibility,
      'none-granted',
      'latencyEligibility',
    )
  }
  return issues
}

// ---------------------------------------------------------------------------
// F05.8 / F05.9 / F05.10 / F05.11 — results
// ---------------------------------------------------------------------------

const DECISION_SET: readonly string[] = DECISIONS

function validatePrincipalProjection(
  issues: ValidationIssue[],
  path: string,
  value: unknown,
): void {
  if (!isPlainObject(value)) {
    add(issues, 'INVALID_REQUEST', path, 'principal projection must be an object')
    return
  }
  if (value.principalClass === 'anonymous-read') {
    checkKeys(issues, path, value, ['principalClass'])
    return
  }
  checkKeys(issues, path, value, ['principalClass', 'principalRef'])
  checkEnum(
    issues,
    `${path}.principalClass`,
    value.principalClass,
    AUTHENTICATED_PRINCIPAL_CLASSES,
    'principalClass',
  )
  checkId(issues, `${path}.principalRef`, value.principalRef)
}

function evidenceKindOf(value: unknown): AssuranceEvidenceKind | null {
  if (!isPlainObject(value)) return null
  if ('checkId' in value) return 'contract-fixture'
  if ('runId' in value) return 'process-run'
  if ('detectorId' in value) return 'detection'
  if ('workflowRef' in value) return 'ci-run'
  if ('gateArtifactRef' in value) return 'git-gate-artifact'
  if ('probeId' in value) return 'host-probe'
  if ('postureEventId' in value) return 'posture-record'
  return null
}

function validateAssuranceEvidenceRef(
  issues: ValidationIssue[],
  path: string,
  value: unknown,
  requiredKind: AssuranceEvidenceKind,
): void {
  const kind = evidenceKindOf(value)
  if (kind === null) {
    add(issues, 'INVALID_REQUEST', path, 'assurance evidence reference shape is unknown')
    return
  }
  if (kind !== requiredKind) {
    add(
      issues,
      'INVALID_REQUEST',
      path,
      `assurance evidence must be of kind ${requiredKind} for this level`,
    )
  }
  const obj = value as Record<string, unknown>
  const keysByKind: Record<AssuranceEvidenceKind, readonly string[]> = {
    'contract-fixture': ['checkId', 'fixtureDigest'],
    'process-run': ['runId', 'hostAdapterRef', 'runDigest'],
    detection: ['detectorId', 'detectionDigest'],
    'ci-run': ['workflowRef', 'runDigest'],
    'git-gate-artifact': ['gateArtifactRef', 'gitEvidenceDigest'],
    'host-probe': ['probeId', 'probeDigest'],
    'posture-record': ['postureEventId', 'postureDigest'],
  }
  checkKeys(issues, path, obj, keysByKind[kind])
  for (const key of keysByKind[kind]) {
    if (key === 'hostAdapterRef') checkId(issues, `${path}.${key}`, obj[key])
    else if (key.endsWith('Digest')) {
      if (
        key === 'fixtureDigest' ||
        key === 'runDigest' ||
        key === 'detectionDigest' ||
        key === 'gitEvidenceDigest' ||
        key === 'probeDigest' ||
        key === 'postureDigest'
      ) {
        checkDigest(issues, `${path}.${key}`, obj[key])
      }
    } else checkId(issues, `${path}.${key}`, obj[key])
  }
}

function validateAssuranceClaim(issues: ValidationIssue[], path: string, value: unknown): void {
  const obj = objectAt(issues, path, value, [
    'assuranceLevel',
    'evidence',
    'missingAssuranceReason',
  ])
  if (obj === null) return
  if (
    typeof obj.assuranceLevel !== 'string' ||
    !(ASSURANCE_LEVELS as readonly string[]).includes(obj.assuranceLevel)
  ) {
    add(issues, 'INVALID_REQUEST', `${path}.assuranceLevel`, 'unknown assuranceLevel value')
    return
  }
  const level = obj.assuranceLevel
  const reason = obj.missingAssuranceReason
  if (reason !== null) {
    checkEnum(
      issues,
      `${path}.missingAssuranceReason`,
      reason,
      MISSING_ASSURANCE_REASONS,
      'missingAssuranceReason',
    )
  }
  if (!checkArray(issues, `${path}.evidence`, obj.evidence, MAX_ASSURANCE_EVIDENCE, 'evidence'))
    return
  const evidence = obj.evidence
  if (reason === null && evidence.length === 0) {
    add(
      issues,
      'INVALID_REQUEST',
      `${path}.evidence`,
      'evidence must be nonempty when missingAssuranceReason is null',
    )
    return
  }
  if (reason !== null && evidence.length > 0) {
    add(
      issues,
      'INVALID_REQUEST',
      `${path}.evidence`,
      'evidence must be empty when missingAssuranceReason is set',
    )
    return
  }
  const requiredKind =
    REQUIRED_EVIDENCE_KIND_BY_LEVEL[level as keyof typeof REQUIRED_EVIDENCE_KIND_BY_LEVEL]
  evidence.forEach((entry, index) => {
    validateAssuranceEvidenceRef(issues, `${path}.evidence[${index}]`, entry, requiredKind)
  })
}

function validateUpstreamPolicyEvidence(
  issues: ValidationIssue[],
  path: string,
  value: unknown,
): void {
  if (!isPlainObject(value)) {
    add(issues, 'INVALID_REQUEST', path, 'policyEvidence must be an object')
    return
  }
  if (value.outcome === 'RESOLVED') {
    checkKeys(issues, path, value, [
      'outcome',
      'subject',
      'claim',
      'decision',
      'classification',
      'assurance',
      'enforcementOwner',
      'severity',
      'controllingRuleIds',
      'consideredRuleIds',
    ])
    checkString(issues, `${path}.subject`, value.subject, MAX_STRING_BYTES, 'subject')
    checkString(issues, `${path}.claim`, value.claim, MAX_STRING_BYTES, 'claim')
    checkEnum(issues, `${path}.decision`, value.decision, P0_RESOLVED_DECISIONS, 'decision')
    checkEnum(
      issues,
      `${path}.classification`,
      value.classification,
      P0_RULE_CLASSIFICATIONS,
      'classification',
    )
    checkEnum(issues, `${path}.assurance`, value.assurance, P0_ASSURANCE_LEVELS, 'assurance')
    checkEnum(
      issues,
      `${path}.enforcementOwner`,
      value.enforcementOwner,
      P0_ENFORCEMENT_OWNERS,
      'enforcementOwner',
    )
    checkEnum(issues, `${path}.severity`, value.severity, P0_SEVERITIES, 'severity')
    if (
      checkArray(
        issues,
        `${path}.controllingRuleIds`,
        value.controllingRuleIds,
        MAX_LIST_MEMBERS,
        'controllingRuleIds',
      )
    ) {
      value.controllingRuleIds.forEach((entry: unknown, index: number) => {
        checkId(issues, `${path}.controllingRuleIds[${index}]`, entry)
      })
    }
    if (
      checkArray(
        issues,
        `${path}.consideredRuleIds`,
        value.consideredRuleIds,
        MAX_LIST_MEMBERS,
        'consideredRuleIds',
      )
    ) {
      value.consideredRuleIds.forEach((entry: unknown, index: number) => {
        checkId(issues, `${path}.consideredRuleIds[${index}]`, entry)
      })
    }
    return
  }
  if (value.outcome === 'REQUIRE_HUMAN') {
    checkKeys(issues, path, value, [
      'outcome',
      'subject',
      'reasonCode',
      'controllingRuleIds',
      'consideredRuleIds',
    ])
    checkString(issues, `${path}.subject`, value.subject, MAX_STRING_BYTES, 'subject')
    checkEnum(
      issues,
      `${path}.reasonCode`,
      value.reasonCode,
      P0_RESOLUTION_REASON_CODES,
      'reasonCode',
    )
    if (!Array.isArray(value.controllingRuleIds) || value.controllingRuleIds.length !== 0) {
      add(
        issues,
        'INVALID_REQUEST',
        `${path}.controllingRuleIds`,
        'controllingRuleIds must be the empty literal array',
      )
    }
    if (
      checkArray(
        issues,
        `${path}.consideredRuleIds`,
        value.consideredRuleIds,
        MAX_LIST_MEMBERS,
        'consideredRuleIds',
      )
    ) {
      value.consideredRuleIds.forEach((entry: unknown, index: number) => {
        checkId(issues, `${path}.consideredRuleIds[${index}]`, entry)
      })
    }
    return
  }
  add(issues, 'INVALID_REQUEST', `${path}.outcome`, 'unknown policyEvidence outcome')
}

function validateViolation(issues: ValidationIssue[], path: string, value: unknown): void {
  const obj = objectAt(issues, path, value, ['code', 'invariantId', 'path'])
  if (obj === null) return
  checkEnum(issues, `${path}.code`, obj.code, WIRE_CODES, 'code')
  checkId(issues, `${path}.invariantId`, obj.invariantId)
  if (typeof obj.path !== 'string') {
    add(issues, 'INVALID_REQUEST', `${path}.path`, 'violation path must be a string')
    return
  }
  const { bytes, unpaired } = scanString(obj.path)
  if (bytes > 256) {
    add(issues, 'PAYLOAD_LIMIT_EXCEEDED', `${path}.path`, 'violation path exceeds 256 UTF-8 bytes')
    return
  }
  if (unpaired || !VIOLATION_PATH_PATTERN.test(obj.path)) {
    add(
      issues,
      'INVALID_REQUEST',
      `${path}.path`,
      'violation path must be a bounded safe field/path descriptor',
    )
  }
}

function validateObligation(issues: ValidationIssue[], path: string, value: unknown): void {
  const obj = objectAt(issues, path, value, ['obligationId', 'kind', 'payload'])
  if (obj === null) return
  checkId(issues, `${path}.obligationId`, obj.obligationId)
  if (typeof obj.kind !== 'string' || !(OBLIGATION_KINDS as readonly string[]).includes(obj.kind)) {
    add(issues, 'INVALID_REQUEST', `${path}.kind`, 'unknown obligation kind')
    return
  }
  const payload = obj.payload
  switch (obj.kind) {
    case 'post-diff-inspection': {
      const entry = objectAt(issues, `${path}.payload`, payload, ['scopeDigest'])
      if (entry !== null) checkDigest(issues, `${path}.payload.scopeDigest`, entry.scopeDigest)
      break
    }
    case 'fresh-scm-evidence': {
      const entry = objectAt(issues, `${path}.payload`, payload, [
        'evidenceKind',
        'maxEvidenceAgeMicros',
      ])
      if (entry !== null) {
        checkEnum(
          issues,
          `${path}.payload.evidenceKind`,
          entry.evidenceKind,
          ['commit-ref', 'signature', 'status-check'],
          'evidenceKind',
        )
        checkNullableSafeInt(
          issues,
          `${path}.payload.maxEvidenceAgeMicros`,
          entry.maxEvidenceAgeMicros,
        )
      }
      break
    }
    case 'stop-report-emission': {
      const entry = objectAt(issues, `${path}.payload`, payload, [
        'transitionDescription',
        'awaitingHuman',
      ])
      if (entry !== null) {
        checkString(
          issues,
          `${path}.payload.transitionDescription`,
          entry.transitionDescription,
          4096,
          'transitionDescription',
        )
        checkConst(
          issues,
          `${path}.payload.awaitingHuman`,
          entry.awaitingHuman,
          true,
          'awaitingHuman',
        )
      }
      break
    }
    case 'degraded-read-logging': {
      const entry = objectAt(issues, `${path}.payload`, payload, ['degradedReason'])
      if (entry !== null) {
        checkEnum(
          issues,
          `${path}.payload.degradedReason`,
          entry.degradedReason,
          ['kernel-unreachable', 'decision-deadline-exceeded', 'outage-mode'],
          'degradedReason',
        )
      }
      break
    }
    default: {
      const entry = objectAt(issues, `${path}.payload`, payload, [
        'span',
        'elapsedMicros',
        'budgetMicros',
      ])
      if (entry !== null) {
        checkEnum(
          issues,
          `${path}.payload.span`,
          entry.span,
          ['kernelDecisionLatency', 'mediatedActionLatency', 'firstCallObservation'],
          'span',
        )
        checkSafeInt(issues, `${path}.payload.elapsedMicros`, entry.elapsedMicros)
        checkSafeInt(issues, `${path}.payload.budgetMicros`, entry.budgetMicros)
      }
    }
  }
}

const DECISION_ENVELOPE_KEYS = [
  'resultKind',
  'apiVersion',
  'toolVersion',
  'code',
  'violations',
  'requestDigest',
  'inputDigest',
  'policyDigest',
  'principal',
  'assurance',
  'obligations',
  'goalRevision',
  'policyEvidence',
] as const

/** State/lease/gate/effect codes whose decisions are state-bound (goalRevision required). */
const STATE_BOUND_CODES: readonly WireCode[] = [
  'STATE_REVISION_STALE',
  'OWNER_LEASE_MISMATCH',
  'GATE_NOT_SATISFIED',
  'IDEMPOTENCY_CONFLICT',
]

export function validateDecisionEnvelope(doc: unknown): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  if (!checkDocumentBounds(issues, doc)) return issues
  const obj = doc as Record<string, unknown>
  if (obj.resultKind !== 'policy-result') {
    add(
      issues,
      'INVALID_REQUEST',
      '$.resultKind',
      'DecisionEnvelope resultKind must be policy-result',
    )
    return issues
  }
  const mode = obj.mode
  const isShadow = mode === 'shadow'
  const keys = isShadow
    ? [...DECISION_ENVELOPE_KEYS, 'mode', 'decision', 'wouldDecision']
    : [...DECISION_ENVELOPE_KEYS, 'mode', 'decision']
  // goalRevision is required exactly for state-bound decisions (checked below),
  // so it is an optional member at the closed-shape level.
  checkKeys(
    issues,
    '$',
    obj,
    keys.filter((key) => key !== 'goalRevision'),
    ['goalRevision'],
  )
  checkApiVersion(issues, '$.apiVersion', obj.apiVersion)
  checkAsciiBytes(issues, '$.toolVersion', obj.toolVersion, 128, 'toolVersion')
  checkEnum(issues, '$.code', obj.code, WIRE_CODES, 'code')
  if (checkArray(issues, '$.violations', obj.violations, MAX_LIST_MEMBERS, 'violations')) {
    obj.violations.forEach((entry: unknown, index: number) => {
      validateViolation(issues, `$.violations[${index}]`, entry)
    })
  }
  checkDigest(issues, '$.requestDigest', obj.requestDigest)
  checkDigest(issues, '$.inputDigest', obj.inputDigest)
  checkDigest(issues, '$.policyDigest', obj.policyDigest)
  validatePrincipalProjection(issues, '$.principal', obj.principal)
  validateAssuranceClaim(issues, '$.assurance', obj.assurance)
  if (checkArray(issues, '$.obligations', obj.obligations, MAX_LIST_MEMBERS, 'obligations')) {
    obj.obligations.forEach((entry: unknown, index: number) => {
      validateObligation(issues, `$.obligations[${index}]`, entry)
    })
  }
  checkEnum(issues, '$.mode', obj.mode, MODES, 'mode')
  if (isShadow) {
    if (obj.decision !== 'ADVISORY') {
      add(issues, 'INVALID_REQUEST', '$.decision', 'shadow policy-result decision must be ADVISORY')
    }
    checkEnum(issues, '$.wouldDecision', obj.wouldDecision, DECISION_SET, 'wouldDecision')
  } else {
    checkEnum(issues, '$.decision', obj.decision, DECISION_SET, 'decision')
  }

  // F05.12 registry binding (AC3): the code's registry row is the authority for
  // the result kind and the allowed decision on every policy-result variant.
  // Shadow rows carry ADVISORY plus the row's enforcing disposition as
  // wouldDecision (uniform rule, including the non-refusal rows).
  const codeRule = WIRE_CODE_RULES.find((candidate) => candidate.code === obj.code)
  if (codeRule !== undefined) {
    const registryDecision =
      codeRule.resultKind === 'policy-result' &&
      codeRule.allowedDecision !== 'none' &&
      codeRule.allowedDecision !== 'APPLIED' &&
      codeRule.allowedDecision !== 'NOOP'
        ? codeRule.allowedDecision
        : null
    if (registryDecision === null) {
      add(
        issues,
        'INVALID_REQUEST',
        '$.code',
        'code is not valid on a policy-result envelope per the wire-code registry',
      )
    } else if (isShadow) {
      if (obj.wouldDecision !== registryDecision) {
        add(
          issues,
          'INVALID_REQUEST',
          '$.wouldDecision',
          "shadow wouldDecision must equal the registry row's enforcing disposition",
        )
      }
    } else if (obj.decision !== registryDecision) {
      add(
        issues,
        'INVALID_REQUEST',
        '$.decision',
        "decision must equal the registry row's allowed decision",
      )
    }
  }

  const isAnonymous =
    isPlainObject(obj.principal) && obj.principal.principalClass === 'anonymous-read'
  if (obj.policyEvidence === null) {
    if (!isAnonymous) {
      add(
        issues,
        'INVALID_REQUEST',
        '$.policyEvidence',
        'policyEvidence may be null only for anonymous content-only results',
      )
    }
  } else {
    if (isAnonymous) {
      add(
        issues,
        'INVALID_REQUEST',
        '$.policyEvidence',
        'anonymous content-only results carry no policy evidence',
      )
    }
    validateUpstreamPolicyEvidence(issues, '$.policyEvidence', obj.policyEvidence)
  }

  const code = obj.code
  // F05.7 gate-cause rules: an unresolved policy-evidence outcome is never
  // GATE_NOT_SATISFIED, and GATE_NOT_SATISFIED requires a resolved gate cause.
  const evidence = obj.policyEvidence
  const unresolvedEvidence = isPlainObject(evidence) && evidence.outcome === 'REQUIRE_HUMAN'
  const gateCause =
    isPlainObject(evidence) &&
    evidence.outcome === 'RESOLVED' &&
    evidence.decision === 'REQUIRE_HUMAN'
  if (code === 'GATE_NOT_SATISFIED') {
    if (unresolvedEvidence) {
      add(
        issues,
        'INVALID_REQUEST',
        '$.code',
        'unresolved policy evidence is never GATE_NOT_SATISFIED (F05.7)',
      )
    } else if (!gateCause) {
      add(
        issues,
        'INVALID_REQUEST',
        '$.code',
        'GATE_NOT_SATISFIED requires a resolved gate cause (policyEvidence RESOLVED with decision REQUIRE_HUMAN)',
      )
    }
  }
  if (typeof code === 'string' && (STATE_BOUND_CODES as readonly string[]).includes(code)) {
    if (obj.goalRevision === undefined) {
      add(
        issues,
        'INVALID_REQUEST',
        '$.goalRevision',
        'goalRevision is required for state-bound decisions',
      )
    }
  }
  if (isAnonymous && obj.goalRevision !== undefined) {
    add(
      issues,
      'INVALID_REQUEST',
      '$.goalRevision',
      'goalRevision must be absent for anonymous content-only results',
    )
  }
  if (obj.goalRevision !== undefined) checkSafeInt(issues, '$.goalRevision', obj.goalRevision)
  return issues
}

export function validateProtocolError(doc: unknown): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  if (!checkDocumentBounds(issues, doc)) return issues
  const obj = objectAt(issues, '$', doc, [
    'resultKind',
    'protocolCode',
    'safeDiagnostic',
    'correlationRef',
    'apiVersion',
    'toolVersion',
  ])
  if (obj === null) return issues
  checkConst(issues, '$.resultKind', obj.resultKind, 'protocol-error', 'resultKind')
  checkEnum(issues, '$.protocolCode', obj.protocolCode, PROTOCOL_CODES, 'protocolCode')
  checkAsciiBytes(issues, '$.safeDiagnostic', obj.safeDiagnostic, 256, 'safeDiagnostic')
  checkNullableId(issues, '$.correlationRef', obj.correlationRef)
  if (obj.apiVersion !== null) checkString(issues, '$.apiVersion', obj.apiVersion, 32, 'apiVersion')
  checkAsciiBytes(issues, '$.toolVersion', obj.toolVersion, 128, 'toolVersion')
  return issues
}

export function validateEffectResult(doc: unknown): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  if (!checkDocumentBounds(issues, doc)) return issues
  const obj = objectAt(issues, '$', doc, [
    'resultKind',
    'apiVersion',
    'toolVersion',
    'decision',
    'code',
    'idempotencyKey',
    'effectDigest',
    'goalRevision',
  ])
  if (obj === null) return issues
  checkConst(issues, '$.resultKind', obj.resultKind, 'effect-result', 'resultKind')
  checkApiVersion(issues, '$.apiVersion', obj.apiVersion)
  checkAsciiBytes(issues, '$.toolVersion', obj.toolVersion, 128, 'toolVersion')
  checkEnum(issues, '$.decision', obj.decision, ['APPLIED', 'NOOP'], 'decision')
  checkEnum(issues, '$.code', obj.code, ['EFFECT_APPLIED', 'EFFECT_NOOP'], 'code')
  if (
    (obj.decision === 'APPLIED' && obj.code !== 'EFFECT_APPLIED') ||
    (obj.decision === 'NOOP' && obj.code !== 'EFFECT_NOOP')
  ) {
    add(issues, 'INVALID_REQUEST', '$.code', 'effect code must correspond to the effect decision')
  }
  validateIdempotencyBinding(issues, '$.idempotencyKey', obj.idempotencyKey)
  checkNullableDigest(issues, '$.effectDigest', obj.effectDigest)
  checkSafeInt(issues, '$.goalRevision', obj.goalRevision)
  return issues
}

// ---------------------------------------------------------------------------
// F05.6 PolicyIdentity
// ---------------------------------------------------------------------------

export function validatePolicyIdentity(doc: unknown): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  if (!checkDocumentBounds(issues, doc)) return issues
  const obj = objectAt(issues, '$', doc, [
    'policyIdentityVersion',
    'registry',
    'effectivePolicyDigest',
    'effectiveConfigurationDigest',
  ])
  if (obj === null) return issues
  checkConst(
    issues,
    '$.policyIdentityVersion',
    obj.policyIdentityVersion,
    '0.1.0',
    'policyIdentityVersion',
  )
  const registry = objectAt(issues, '$.registry', obj.registry, [
    'registryId',
    'schemaVersion',
    'sourceSnapshotCommit',
    'registryContentDigest',
  ])
  if (registry !== null) {
    checkConst(
      issues,
      '$.registry.registryId',
      registry.registryId,
      'foreman-kernel-authority-enforcement',
      'registryId',
    )
    checkConst(issues, '$.registry.schemaVersion', registry.schemaVersion, '0.1.0', 'schemaVersion')
    checkString(
      issues,
      '$.registry.sourceSnapshotCommit',
      registry.sourceSnapshotCommit,
      MAX_STRING_BYTES,
      'sourceSnapshotCommit',
    )
    checkDigest(issues, '$.registry.registryContentDigest', registry.registryContentDigest)
  }
  checkDigest(issues, '$.effectivePolicyDigest', obj.effectivePolicyDigest)
  checkDigest(issues, '$.effectiveConfigurationDigest', obj.effectiveConfigurationDigest)
  return issues
}

// ---------------------------------------------------------------------------
// F05.17 Golden vectors
// ---------------------------------------------------------------------------

function requestKindOf(
  value: unknown,
): 'LifecycleEvent' | 'ReadRequest' | 'AuthorizeActionInput' | null {
  if (!isPlainObject(value)) return null
  if ('event' in value) return 'LifecycleEvent'
  if ('readKind' in value) return 'ReadRequest'
  if ('callerInputs' in value) return 'AuthorizeActionInput'
  return null
}

export function validateGoldenVectorCase(doc: unknown): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const obj = objectAt(issues, '$', doc, [
    'caseId',
    'charterClause',
    'producerParcel',
    'consumerParcel',
    'inputTrustOrigin',
    'request',
    'expectedResponseKind',
    'expectedCode',
    'expectedDecision',
    'expectedWouldDecision',
    'expectedAssuranceLevel',
    'expectedObligations',
    'trustStageExpectation',
    'expectedRequestDigest',
    'expectedInputDigest',
    'verificationStage',
    'laterOwner',
  ])
  if (obj === null) return issues
  checkId(issues, '$.caseId', obj.caseId)
  checkString(issues, '$.charterClause', obj.charterClause, 128, 'charterClause')
  checkString(issues, '$.producerParcel', obj.producerParcel, 32, 'producerParcel')
  checkString(issues, '$.consumerParcel', obj.consumerParcel, 32, 'consumerParcel')
  checkEnum(
    issues,
    '$.inputTrustOrigin',
    obj.inputTrustOrigin,
    INPUT_TRUST_ORIGINS,
    'inputTrustOrigin',
  )
  checkEnum(
    issues,
    '$.expectedResponseKind',
    obj.expectedResponseKind,
    EXPECTED_RESPONSE_KINDS,
    'expectedResponseKind',
  )
  checkEnum(issues, '$.expectedCode', obj.expectedCode, WIRE_CODES, 'expectedCode')
  if (obj.expectedDecision !== null) {
    checkEnum(
      issues,
      '$.expectedDecision',
      obj.expectedDecision,
      [...DECISIONS, 'APPLIED', 'NOOP'],
      'expectedDecision',
    )
  }
  if (obj.expectedWouldDecision !== null) {
    checkEnum(
      issues,
      '$.expectedWouldDecision',
      obj.expectedWouldDecision,
      DECISION_SET,
      'expectedWouldDecision',
    )
  }
  checkEnum(
    issues,
    '$.expectedAssuranceLevel',
    obj.expectedAssuranceLevel,
    ASSURANCE_LEVELS,
    'expectedAssuranceLevel',
  )
  if (
    checkArray(
      issues,
      '$.expectedObligations',
      obj.expectedObligations,
      MAX_ASSURANCE_EVIDENCE,
      'expectedObligations',
    )
  ) {
    obj.expectedObligations.forEach((entry: unknown, index: number) => {
      checkEnum(
        issues,
        `$.expectedObligations[${index}]`,
        entry,
        OBLIGATION_KINDS,
        'obligation kind',
      )
    })
  }
  checkEnum(
    issues,
    '$.trustStageExpectation',
    obj.trustStageExpectation,
    TRUST_STAGE_EXPECTATIONS,
    'trustStageExpectation',
  )
  checkNullableDigest(issues, '$.expectedRequestDigest', obj.expectedRequestDigest)
  checkNullableDigest(issues, '$.expectedInputDigest', obj.expectedInputDigest)
  checkConst(
    issues,
    '$.verificationStage',
    obj.verificationStage,
    'contract-only',
    'verificationStage',
  )
  checkString(issues, '$.laterOwner', obj.laterOwner, 32, 'laterOwner')

  const kind = requestKindOf(obj.request)
  if (kind === null) {
    add(
      issues,
      'INVALID_REQUEST',
      '$.request',
      'request must be one of LifecycleEvent, ReadRequest, AuthorizeActionInput',
    )
    return issues
  }
  const requestIssues =
    kind === 'LifecycleEvent'
      ? validateLifecycleEvent(obj.request)
      : kind === 'ReadRequest'
        ? validateReadRequest(obj.request)
        : validateAuthorizeActionInput(obj.request)
  for (const issue of requestIssues) {
    issues.push({ ...issue, path: `$.request.${issue.path}` })
  }

  // F05.8: wouldDecision is the only shadow metadata and appears exactly on
  // shadow policy-result cases (decision ADVISORY), absent elsewhere.
  const bindings =
    isPlainObject(obj.request) && isPlainObject(obj.request.trustedBindings)
      ? obj.request.trustedBindings
      : null
  const isShadowCase = bindings !== null && bindings.mode === 'shadow'
  if (
    obj.expectedWouldDecision !== null &&
    (!isShadowCase || obj.expectedDecision !== 'ADVISORY')
  ) {
    add(
      issues,
      'INVALID_REQUEST',
      '$.expectedWouldDecision',
      'would-decision appears only on shadow policy-result cases with decision ADVISORY',
    )
  }
  if (
    isShadowCase &&
    obj.expectedResponseKind === 'policy-result' &&
    obj.expectedWouldDecision === null
  ) {
    add(
      issues,
      'INVALID_REQUEST',
      '$.expectedWouldDecision',
      'shadow policy-result cases require a would-decision',
    )
  }

  // Cross-field consistency with the F05.12 registry.
  const rule = WIRE_CODE_RULES.find((candidate) => candidate.code === obj.expectedCode)
  if (rule === undefined) {
    add(issues, 'INVALID_REQUEST', '$.expectedCode', 'expectedCode has no registry row')
    return issues
  }
  if (rule.resultKind !== obj.expectedResponseKind) {
    add(
      issues,
      'INVALID_REQUEST',
      '$.expectedResponseKind',
      'response kind disagrees with the wire-code registry row',
    )
  }
  const expectedDecision = obj.expectedDecision
  if (rule.allowedDecision === 'none') {
    if (expectedDecision !== null) {
      add(
        issues,
        'INVALID_REQUEST',
        '$.expectedDecision',
        'protocol/adapter results carry no decision',
      )
    }
    if (obj.expectedWouldDecision !== null) {
      add(
        issues,
        'INVALID_REQUEST',
        '$.expectedWouldDecision',
        'shadow metadata appears only on shadow policy-results',
      )
    }
  } else if (expectedDecision === null) {
    add(
      issues,
      'INVALID_REQUEST',
      '$.expectedDecision',
      'decision is required for this registry row',
    )
  } else if (expectedDecision !== rule.allowedDecision) {
    if (!(expectedDecision === 'ADVISORY' && rule.shadowWouldDecision !== null)) {
      add(
        issues,
        'INVALID_REQUEST',
        '$.expectedDecision',
        'decision disagrees with the wire-code registry row',
      )
    }
  }
  // Uniform shadow rule (coordinator ruling, rework R2): whenever a would
  // decision is present it equals the registry row's enforcing disposition,
  // including the non-refusal rows.
  if (
    obj.expectedWouldDecision !== null &&
    rule.allowedDecision !== 'none' &&
    rule.allowedDecision !== 'APPLIED' &&
    rule.allowedDecision !== 'NOOP' &&
    obj.expectedWouldDecision !== rule.allowedDecision
  ) {
    add(
      issues,
      'INVALID_REQUEST',
      '$.expectedWouldDecision',
      "expectedWouldDecision must equal the registry row's enforcing disposition",
    )
  }

  // Digest binding shape: request digests for wire requests, input digests for
  // AuthorizeActionInput requests, exactly one non-null.
  const expectRequestDigest = kind !== 'AuthorizeActionInput'
  if (expectRequestDigest && obj.expectedRequestDigest === null) {
    add(
      issues,
      'INVALID_REQUEST',
      '$.expectedRequestDigest',
      'expectedRequestDigest is required for wire requests',
    )
  }
  if (!expectRequestDigest && obj.expectedRequestDigest !== null) {
    add(
      issues,
      'INVALID_REQUEST',
      '$.expectedRequestDigest',
      'expectedRequestDigest is null for AuthorizeActionInput requests',
    )
  }
  if (kind === 'AuthorizeActionInput' && obj.expectedInputDigest === null) {
    add(
      issues,
      'INVALID_REQUEST',
      '$.expectedInputDigest',
      'expectedInputDigest is required for AuthorizeActionInput requests',
    )
  }
  if (kind !== 'AuthorizeActionInput' && obj.expectedInputDigest !== null) {
    add(
      issues,
      'INVALID_REQUEST',
      '$.expectedInputDigest',
      'expectedInputDigest is null for wire requests',
    )
  }
  return issues
}

export function validateGoldenVectorFixture(doc: unknown): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  if (!checkDocumentBounds(issues, doc)) return issues
  const obj = objectAt(issues, '$', doc, ['apiVersion', 'cases'])
  if (obj === null) return issues
  checkApiVersion(issues, '$.apiVersion', obj.apiVersion)
  if (!checkArray(issues, '$.cases', obj.cases, 256, 'cases')) return issues
  if (obj.cases.length === 0) {
    add(issues, 'INVALID_REQUEST', '$.cases', 'fixture inventory must be nonempty')
  }
  obj.cases.forEach((entry: unknown, index: number) => {
    for (const issue of validateGoldenVectorCase(entry)) {
      issues.push({ ...issue, path: `$.cases[${index}].${issue.path}` })
    }
  })
  return issues
}

/** Convenience for consumers: first issue or null. */
export function firstIssue(issues: readonly ValidationIssue[]): ValidationIssue | null {
  return issues[0] ?? null
}
