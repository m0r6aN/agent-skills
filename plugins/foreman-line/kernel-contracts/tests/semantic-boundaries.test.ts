/**
 * Semantic boundaries: default-deny structural invariants, each invalid shape
 * tested independently; the F05.4 transition-only idempotency rules (Step-0
 * F3 ruling); shadow non-downgrade; trust-staged failure honesty; and the
 * closed registry/projection tables.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  AUTHENTICATED_PRINCIPAL_CLASSES,
  MEDIATED_CODES,
  P0_PRINCIPAL_CLASSES,
  PRINCIPAL_ROLE_PROJECTION,
  PROTOCOL_CODES,
  REQUIRED_EVIDENCE_KIND_BY_LEVEL,
  ROLE_SELECTIONS,
  WIRE_CODE_RULES,
  WIRE_CODES,
} from '../src/types.js'
import {
  type ValidationCode,
  type ValidationIssue,
  validateAdmittedContext,
  validateAuthorizeActionInput,
  validateDecisionEnvelope,
  validateEffectResult,
  validateGoldenVectorCase,
  validateHostCapability,
  validateLatencyContract,
  validateLifecycleEvent,
  validatePolicyIdentity,
  validateProtocolError,
  validateReadRequest,
} from '../src/validate.js'

const digestA = `sha256:${'a'.repeat(64)}` as string
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

function codes(issues: readonly ValidationIssue[]): ValidationCode[] {
  return issues.map((issue) => issue.code)
}

function baseEvent(): Record<string, unknown> {
  return {
    event: 'preToolUse',
    apiVersion: '0.1.0',
    eventId: 'evt-pre-0001',
    sessionRef: 'sess-0001',
    hostAdapterRef: 'host-claude-win-docker',
    claimedRepositoryRef: 'repo-main',
    claimedWorktreeRef: 'wt-0001',
    actionRef: 'act-0001',
    claimedActionClass: 'read-only',
    payload: {
      toolRef: 'tool-read',
      proposedPaths: [{ rawPath: 'D:\\work\\repo\\src\\a.ts', pathForm: 'windows-drive' }],
    },
  }
}

function baseContext(): Record<string, unknown> {
  return {
    principalKind: 'authenticated',
    principalRef: 'principal-builder-1',
    principalClass: 'builder',
    capabilityRef: 'cap-control-1',
    capabilityGeneration: 3,
    capabilityValidUntilMicros: 2000,
    capabilityRevocationRef: null,
    admissionIssuerRef: 'issuer-p13',
    admittedEndpoint: 'control',
    boundRepositoryRef: 'repo-main',
    boundWorktreeRef: 'wt-0001',
    boundSessionRef: 'sess-0001',
    permittedOperationIds: ['op-transition-1'],
    roleSelection: 'builder',
    stageSelection: 'build',
    provenanceRef: {
      provenanceId: 'prov-0001',
      hostAdapterRef: 'host-claude-win-docker',
      provenanceDigest: digestA,
    },
  }
}

function baseInput(mode = 'enforcing'): Record<string, unknown> {
  return {
    callerInputs: { lifecycleEvent: baseEvent() },
    trustedBindings: {
      admittedContext: baseContext(),
      lifecycleProvenance: {
        provenanceId: 'prov-0001',
        hostAdapterRef: 'host-claude-win-docker',
        provenanceDigest: digestA,
      },
      effectiveActionClass: 'governed-mutation',
      repositoryIdentity: { repositoryRef: 'repo-main', worktreeRef: 'wt-0001' },
      policyDigest: digestA,
      scopeDigest: digestA,
      goalRevision: 7,
      leaseState: {
        leaseId: 'lease-1',
        leaseOwnerPrincipalRef: 'principal-builder-1',
        casRevision: 4,
        leaseExpiresAtMicros: 3000,
      },
      gateEvidenceRefs: [
        { evidenceKind: 'commit-ref', gitIdentity: 'refs/heads/main', digest: digestA },
      ],
      mode,
      observedEffects: [{ effectKind: 'file-write', descriptor: 'src/a.ts', digest: digestA }],
      idempotencyKey: null,
    },
  }
}

const binding = () => ({
  principalRef: 'principal-builder-1',
  operationId: 'op-transition-1',
  repositoryRef: 'repo-main',
  worktreeRef: 'wt-0001',
  payloadDigest: digestA,
})

// --- Id notation (one test per invalid shape) -----------------------------

test('Id: empty is INVALID_REQUEST', () => {
  const doc = baseEvent()
  doc.eventId = ''
  assert.ok(codes(validateLifecycleEvent(doc)).includes('INVALID_REQUEST'))
})

test('Id: illegal character is INVALID_REQUEST', () => {
  const doc = baseEvent()
  doc.eventId = 'bad id!'
  assert.ok(codes(validateLifecycleEvent(doc)).includes('INVALID_REQUEST'))
})

test('Id: over 128 characters is PAYLOAD_LIMIT_EXCEEDED', () => {
  const doc = baseEvent()
  doc.eventId = 'a'.repeat(129)
  assert.ok(codes(validateLifecycleEvent(doc)).includes('PAYLOAD_LIMIT_EXCEEDED'))
})

test('Id: valid 128-character id passes', () => {
  const doc = baseEvent()
  doc.eventId = 'a'.repeat(128)
  assert.deepEqual(validateLifecycleEvent(doc), [])
})

// --- Digest notation ------------------------------------------------------

test('Digest: uppercase hex is INVALID_REQUEST', () => {
  const doc = baseInput()
  ;(doc.trustedBindings as Record<string, unknown>).policyDigest = `sha256:${'A'.repeat(64)}`
  assert.ok(codes(validateAuthorizeActionInput(doc)).includes('INVALID_REQUEST'))
})

test('Digest: untagged hex is INVALID_REQUEST', () => {
  const doc = baseInput()
  ;(doc.trustedBindings as Record<string, unknown>).policyDigest = 'a'.repeat(64)
  assert.ok(codes(validateAuthorizeActionInput(doc)).includes('INVALID_REQUEST'))
})

test('Digest: short hex is INVALID_REQUEST', () => {
  const doc = baseInput()
  ;(doc.trustedBindings as Record<string, unknown>).policyDigest = 'sha256:abcd'
  assert.ok(codes(validateAuthorizeActionInput(doc)).includes('INVALID_REQUEST'))
})

// --- SafeInt notation (one test per invalid shape) ------------------------

test('SafeInt: negative zero is INVALID_REQUEST', () => {
  const doc = baseInput()
  const lease = (doc.trustedBindings as Record<string, unknown>).leaseState as Record<
    string,
    unknown
  >
  lease.casRevision = -0
  assert.ok(codes(validateAuthorizeActionInput(doc)).includes('INVALID_REQUEST'))
})

test('SafeInt: fraction is INVALID_REQUEST', () => {
  const doc = baseInput()
  const lease = (doc.trustedBindings as Record<string, unknown>).leaseState as Record<
    string,
    unknown
  >
  lease.casRevision = 1.5
  assert.ok(codes(validateAuthorizeActionInput(doc)).includes('INVALID_REQUEST'))
})

test('SafeInt: unsafe integer 2^53 is INVALID_REQUEST', () => {
  const doc = baseInput()
  ;(doc.trustedBindings as Record<string, unknown>).goalRevision = 2 ** 53
  assert.ok(codes(validateAuthorizeActionInput(doc)).includes('INVALID_REQUEST'))
})

test('SafeInt: NaN is INVALID_REQUEST', () => {
  const doc = baseInput()
  ;(doc.trustedBindings as Record<string, unknown>).goalRevision = Number.NaN
  assert.ok(codes(validateAuthorizeActionInput(doc)).includes('INVALID_REQUEST'))
})

test('SafeInt: Infinity is INVALID_REQUEST', () => {
  const doc = baseInput()
  ;(doc.trustedBindings as Record<string, unknown>).goalRevision = Number.POSITIVE_INFINITY
  assert.ok(codes(validateAuthorizeActionInput(doc)).includes('INVALID_REQUEST'))
})

test('SafeInt: negative value is INVALID_REQUEST', () => {
  const doc = baseInput()
  ;(doc.trustedBindings as Record<string, unknown>).goalRevision = -1
  assert.ok(codes(validateAuthorizeActionInput(doc)).includes('INVALID_REQUEST'))
})

test('SafeInt: 0 and 2^53-1 pass', () => {
  const zero = baseInput()
  ;(zero.trustedBindings as Record<string, unknown>).goalRevision = 0
  assert.deepEqual(validateAuthorizeActionInput(zero), [])
  const max = baseInput()
  ;(max.trustedBindings as Record<string, unknown>).goalRevision = 2 ** 53 - 1
  assert.deepEqual(validateAuthorizeActionInput(max), [])
})

// --- String bounds --------------------------------------------------------

test('string: multibyte content is bounded by UTF-8 bytes, not code points', () => {
  const ok = { readKind: 'content-only', content: '\u00e9'.repeat(32768), contentEncoding: 'utf-8' }
  assert.deepEqual(validateReadRequest(ok), [])
  const over = {
    readKind: 'content-only',
    content: '\u00e9'.repeat(32769),
    contentEncoding: 'utf-8',
  }
  assert.ok(codes(validateReadRequest(over)).includes('PAYLOAD_LIMIT_EXCEEDED'))
})

test('string: unpaired surrogate is INVALID_REQUEST', () => {
  const doc = { readKind: 'content-only', content: 'a\ud800b', contentEncoding: 'utf-8' }
  assert.ok(codes(validateReadRequest(doc)).includes('INVALID_REQUEST'))
})

// --- Document bounds ------------------------------------------------------

test('document: nesting past depth 16 is PAYLOAD_LIMIT_EXCEEDED', () => {
  const doc = baseEvent()
  let cursor: Record<string, unknown> = doc
  for (let i = 0; i < 20; i += 1) {
    const next: Record<string, unknown> = {}
    cursor.padding = next
    cursor = next
  }
  assert.ok(codes(validateLifecycleEvent(doc)).includes('PAYLOAD_LIMIT_EXCEEDED'))
})

test('document: serialization past 1 MiB is PAYLOAD_LIMIT_EXCEEDED', () => {
  const doc = {
    readKind: 'content-only',
    content: 'a'.repeat(1_050_000),
    contentEncoding: 'utf-8',
  }
  assert.ok(codes(validateReadRequest(doc)).includes('PAYLOAD_LIMIT_EXCEEDED'))
})

// --- Version / shape negatives --------------------------------------------

test('apiVersion mismatch is UNSUPPORTED_VERSION, not a silent default', () => {
  const doc = baseEvent()
  doc.apiVersion = '0.2.0'
  assert.deepEqual(codes(validateLifecycleEvent(doc)), ['UNSUPPORTED_VERSION'])
})

test('unknown lifecycle event is INVALID_REQUEST', () => {
  const doc = baseEvent()
  doc.event = 'preFlush'
  assert.ok(codes(validateLifecycleEvent(doc)).includes('INVALID_REQUEST'))
})

test('unknown member is INVALID_REQUEST on every request shape', () => {
  const event = baseEvent()
  event.admittedContext = {}
  assert.ok(codes(validateLifecycleEvent(event)).includes('INVALID_REQUEST'))
  const read = { readKind: 'content-only', content: 'x', contentEncoding: 'utf-8', hostPath: 'y' }
  assert.ok(codes(validateReadRequest(read)).includes('INVALID_REQUEST'))
})

test('array overflow past the 64-member list cap is PAYLOAD_LIMIT_EXCEEDED', () => {
  const doc = baseInput()
  ;(doc.trustedBindings as Record<string, unknown>).gateEvidenceRefs = Array.from(
    { length: 65 },
    () => ({
      evidenceKind: 'commit-ref',
      gitIdentity: 'refs/heads/main',
      digest: digestA,
    }),
  )
  assert.ok(codes(validateAuthorizeActionInput(doc)).includes('PAYLOAD_LIMIT_EXCEEDED'))
})

// --- F05.4 transition-only idempotency (Step-0 F3 ruling) -----------------

test('idempotency: anchored state-bound binding passes', () => {
  const doc = baseInput()
  ;(doc.trustedBindings as Record<string, unknown>).idempotencyKey = binding()
  assert.deepEqual(validateAuthorizeActionInput(doc), [])
})

test('idempotency: non-null binding on anonymous content-only is INVALID_REQUEST', () => {
  const doc = baseInput()
  const bindings = doc.trustedBindings as Record<string, unknown>
  bindings.admittedContext = {
    principalKind: 'anonymous-content',
    principalClass: 'anonymous-read',
    admittedEndpoint: 'read',
    boundSessionRef: 'sess-0001',
  }
  bindings.repositoryIdentity = null
  bindings.scopeDigest = null
  bindings.goalRevision = null
  bindings.idempotencyKey = binding()
  assert.ok(codes(validateAuthorizeActionInput(doc)).includes('INVALID_REQUEST'))
})

test('idempotency: unanchorable repositoryRef is INVALID_REQUEST before any evaluation', () => {
  const doc = baseInput()
  const broken = { ...binding(), repositoryRef: 'repo-other' }
  ;(doc.trustedBindings as Record<string, unknown>).idempotencyKey = broken
  assert.ok(codes(validateAuthorizeActionInput(doc)).includes('INVALID_REQUEST'))
})

test('idempotency: unanchorable worktreeRef is INVALID_REQUEST', () => {
  const doc = baseInput()
  const broken = { ...binding(), worktreeRef: 'wt-other' }
  ;(doc.trustedBindings as Record<string, unknown>).idempotencyKey = broken
  assert.ok(codes(validateAuthorizeActionInput(doc)).includes('INVALID_REQUEST'))
})

test('idempotency: unanchorable principalRef is INVALID_REQUEST', () => {
  const doc = baseInput()
  const broken = { ...binding(), principalRef: 'principal-other' }
  ;(doc.trustedBindings as Record<string, unknown>).idempotencyKey = broken
  assert.ok(codes(validateAuthorizeActionInput(doc)).includes('INVALID_REQUEST'))
})

test('idempotency: structurally incomplete binding is INVALID_REQUEST', () => {
  const doc = baseInput()
  const incomplete: Record<string, unknown> = binding()
  delete incomplete.payloadDigest
  ;(doc.trustedBindings as Record<string, unknown>).idempotencyKey = incomplete
  assert.ok(codes(validateAuthorizeActionInput(doc)).includes('INVALID_REQUEST'))
})

test('idempotency: binding unanchored because repositoryIdentity is null is INVALID_REQUEST', () => {
  const doc = baseInput()
  const bindings = doc.trustedBindings as Record<string, unknown>
  bindings.repositoryIdentity = null
  bindings.idempotencyKey = binding()
  assert.ok(codes(validateAuthorizeActionInput(doc)).includes('INVALID_REQUEST'))
})

// --- Admitted context closedness ------------------------------------------

test('anonymous context with control members is INVALID_REQUEST', () => {
  const doc = {
    principalKind: 'anonymous-content',
    principalClass: 'anonymous-read',
    admittedEndpoint: 'read',
    boundSessionRef: 'sess-0001',
    permittedOperationIds: ['op-transition-1'],
  }
  assert.ok(codes(validateAdmittedContext(doc)).includes('INVALID_REQUEST'))
})

test('anonymous context with control capability is INVALID_REQUEST', () => {
  const doc = {
    principalKind: 'anonymous-content',
    principalClass: 'anonymous-read',
    admittedEndpoint: 'read',
    boundSessionRef: 'sess-0001',
    capabilityRef: 'cap-control-1',
  }
  assert.ok(codes(validateAdmittedContext(doc)).includes('INVALID_REQUEST'))
})

test('authenticated context missing provenanceRef is INVALID_REQUEST', () => {
  const doc = baseContext()
  delete doc.provenanceRef
  assert.ok(codes(validateAdmittedContext(doc)).includes('INVALID_REQUEST'))
})

// --- Shadow non-downgrade -------------------------------------------------

test('shadow mode changes no protocol failure: same codes under mode shadow', () => {
  const enforced = baseInput('enforcing')
  const shadow = baseInput('shadow')
  const extras = { unexpected: 1 }
  assert.deepEqual(
    codes(validateAuthorizeActionInput({ ...enforced, ...extras })),
    codes(validateAuthorizeActionInput({ ...shadow, ...extras })),
  )
})

test('shadow mode changes no idempotency failure', () => {
  const doc = baseInput('shadow')
  const broken = { ...binding(), repositoryRef: 'repo-other' }
  ;(doc.trustedBindings as Record<string, unknown>).idempotencyKey = broken
  assert.ok(codes(validateAuthorizeActionInput(doc)).includes('INVALID_REQUEST'))
})

// --- DecisionEnvelope honesty ---------------------------------------------

function resolvedPolicyEvidence(): Record<string, unknown> {
  return {
    outcome: 'RESOLVED',
    subject: 'subject-1',
    claim: 'claim-1',
    decision: 'REFUSE',
    classification: 'pre-action-refusal',
    assurance: 'mediated',
    enforcementOwner: 'kernel-policy',
    severity: 'low',
    controllingRuleIds: ['rule-1'],
    consideredRuleIds: [],
  }
}

function baseEnvelope(): Record<string, unknown> {
  return {
    resultKind: 'policy-result',
    apiVersion: '0.1.0',
    toolVersion: 'kernel-contracts-0.1.0',
    decision: 'REFUSE',
    code: 'PATH_OUTSIDE_ALLOWED_FILES',
    violations: [],
    requestDigest: digestA,
    inputDigest: digestA,
    policyDigest: digestA,
    principal: { principalClass: 'builder', principalRef: 'principal-builder-1' },
    assurance: {
      assuranceLevel: 'mediated',
      evidence: [{ runId: 'run-1', hostAdapterRef: 'host-1', runDigest: digestA }],
      missingAssuranceReason: null,
    },
    obligations: [],
    goalRevision: 7,
    policyEvidence: resolvedPolicyEvidence(),
    mode: 'enforcing',
  }
}

test('policyEvidence may be null only for anonymous content-only results', () => {
  const doc = baseEnvelope()
  doc.policyEvidence = null
  assert.ok(codes(validateDecisionEnvelope(doc)).includes('INVALID_REQUEST'))
})

test('anonymous result with policy evidence is INVALID_REQUEST', () => {
  const doc = baseEnvelope()
  doc.principal = { principalClass: 'anonymous-read' }
  delete doc.goalRevision
  assert.ok(codes(validateDecisionEnvelope(doc)).includes('INVALID_REQUEST'))
})

test('anonymous content-only result with null policy evidence and no goalRevision passes', () => {
  const doc = baseEnvelope()
  doc.principal = { principalClass: 'anonymous-read' }
  doc.policyEvidence = null
  delete doc.goalRevision
  assert.deepEqual(validateDecisionEnvelope(doc), [])
})

test('state-bound code without goalRevision is INVALID_REQUEST', () => {
  const doc = baseEnvelope()
  doc.code = 'STATE_REVISION_STALE'
  doc.decision = 'CONFLICT'
  delete doc.goalRevision
  assert.ok(codes(validateDecisionEnvelope(doc)).includes('INVALID_REQUEST'))
})

test('anonymous result with goalRevision is INVALID_REQUEST', () => {
  const doc = baseEnvelope()
  doc.principal = { principalClass: 'anonymous-read' }
  doc.goalRevision = 7
  assert.ok(codes(validateDecisionEnvelope(doc)).includes('INVALID_REQUEST'))
})

test('shadow policy-result requires decision ADVISORY and a wouldDecision', () => {
  const doc = baseEnvelope()
  doc.mode = 'shadow'
  assert.ok(codes(validateDecisionEnvelope(doc)).includes('INVALID_REQUEST'))
  doc.decision = 'ADVISORY'
  doc.wouldDecision = 'REFUSE'
  assert.deepEqual(validateDecisionEnvelope(doc), [])
})

// --- F05.12 registry binding on live envelopes (AC3) -----------------------

test('envelope registry binding: decision must equal the registry row allowed decision', () => {
  const doc = baseEnvelope()
  doc.code = 'GATE_NOT_SATISFIED'
  doc.decision = 'ALLOW'
  doc.policyEvidence = {
    outcome: 'RESOLVED',
    subject: 'subject-1',
    claim: 'claim-1',
    decision: 'REQUIRE_HUMAN',
    classification: 'pre-action-refusal',
    assurance: 'human-ratified',
    enforcementOwner: 'human-merge-operator',
    severity: 'high',
    controllingRuleIds: ['rule-1'],
    consideredRuleIds: [],
  }
  assert.ok(
    validateDecisionEnvelope(doc).some(
      (issue) => issue.path === '$.decision' && issue.message.includes('registry'),
    ),
  )
  doc.decision = 'REQUIRE_HUMAN'
  assert.ok(
    validateDecisionEnvelope(doc).every((issue) => issue.path !== '$.decision'),
    'registry-consistent decision passes the binding check',
  )
})

test('envelope registry binding: effect codes are invalid on policy-result', () => {
  const doc = baseEnvelope()
  doc.code = 'EFFECT_APPLIED'
  doc.decision = 'ALLOW'
  assert.ok(
    validateDecisionEnvelope(doc).some(
      (issue) => issue.path === '$.code' && issue.message.includes('registry'),
    ),
  )
})

test('envelope registry binding: protocol and adapter codes are invalid on policy-result', () => {
  for (const code of ['KERNEL_UNREACHABLE', 'INVALID_REQUEST', 'PAYLOAD_LIMIT_EXCEEDED']) {
    const doc = baseEnvelope()
    doc.code = code
    assert.ok(
      validateDecisionEnvelope(doc).some(
        (issue) => issue.path === '$.code' && issue.message.includes('registry'),
      ),
      code,
    )
  }
})

test('envelope registry binding: shadow wouldDecision equals the registry disposition', () => {
  const doc = baseEnvelope()
  doc.mode = 'shadow'
  doc.code = 'WORKTREE_MISMATCH'
  doc.decision = 'ADVISORY'
  doc.wouldDecision = 'ALLOW'
  assert.ok(
    validateDecisionEnvelope(doc).some(
      (issue) => issue.path === '$.wouldDecision' && issue.message.includes('registry'),
    ),
  )
  doc.wouldDecision = 'REFUSE'
  assert.deepEqual(validateDecisionEnvelope(doc), [])
})

test('envelope registry binding: uniform non-refusal shadow pairings pass', () => {
  const conflict = baseEnvelope()
  conflict.mode = 'shadow'
  conflict.code = 'STATE_REVISION_STALE'
  conflict.decision = 'ADVISORY'
  conflict.wouldDecision = 'CONFLICT'
  assert.deepEqual(validateDecisionEnvelope(conflict), [])
  const advisory = baseEnvelope()
  advisory.mode = 'shadow'
  advisory.code = 'SESSION_ENROLLMENT_MISSING'
  advisory.decision = 'ADVISORY'
  advisory.wouldDecision = 'ADVISORY'
  assert.deepEqual(validateDecisionEnvelope(advisory), [])
  const gate = baseEnvelope()
  gate.mode = 'shadow'
  gate.code = 'GATE_NOT_SATISFIED'
  gate.decision = 'ADVISORY'
  gate.wouldDecision = 'REQUIRE_HUMAN'
  gate.policyEvidence = {
    outcome: 'RESOLVED',
    subject: 'subject-1',
    claim: 'claim-1',
    decision: 'REQUIRE_HUMAN',
    classification: 'pre-action-refusal',
    assurance: 'human-ratified',
    enforcementOwner: 'human-merge-operator',
    severity: 'high',
    controllingRuleIds: ['rule-1'],
    consideredRuleIds: [],
  }
  assert.deepEqual(validateDecisionEnvelope(gate), [])
})

// --- F05.7 gate-cause rules ------------------------------------------------

test('F05.7: unresolved policy evidence is never GATE_NOT_SATISFIED', () => {
  const doc = baseEnvelope()
  doc.code = 'GATE_NOT_SATISFIED'
  doc.decision = 'REQUIRE_HUMAN'
  doc.policyEvidence = {
    outcome: 'REQUIRE_HUMAN',
    subject: 'subject-1',
    reasonCode: 'REGISTRY_INVALID',
    controllingRuleIds: [],
    consideredRuleIds: [],
  }
  assert.ok(
    validateDecisionEnvelope(doc).some(
      (issue) => issue.path === '$.code' && issue.message.includes('unresolved'),
    ),
  )
})

test('F05.7: GATE_NOT_SATISFIED requires a resolved gate cause', () => {
  const withoutEvidence = baseEnvelope()
  withoutEvidence.code = 'GATE_NOT_SATISFIED'
  withoutEvidence.decision = 'REQUIRE_HUMAN'
  withoutEvidence.policyEvidence = null
  assert.ok(
    validateDecisionEnvelope(withoutEvidence).some(
      (issue) => issue.path === '$.code' && issue.message.includes('gate cause'),
    ),
  )
  const nonGateResolved = baseEnvelope()
  nonGateResolved.code = 'GATE_NOT_SATISFIED'
  nonGateResolved.decision = 'REQUIRE_HUMAN'
  nonGateResolved.policyEvidence = resolvedPolicyEvidence()
  assert.ok(
    validateDecisionEnvelope(nonGateResolved).some(
      (issue) => issue.path === '$.code' && issue.message.includes('gate cause'),
    ),
  )
  const gateCause = baseEnvelope()
  gateCause.code = 'GATE_NOT_SATISFIED'
  gateCause.decision = 'REQUIRE_HUMAN'
  gateCause.policyEvidence = { ...resolvedPolicyEvidence(), decision: 'REQUIRE_HUMAN' }
  assert.ok(
    validateDecisionEnvelope(gateCause).every((issue) => issue.path !== '$.code'),
    'RESOLVED REQUIRE_HUMAN evidence is a gate cause',
  )
})

test('assurance: empty evidence with null reason is INVALID_REQUEST', () => {
  const doc = baseEnvelope()
  doc.assurance = { assuranceLevel: 'mediated', evidence: [], missingAssuranceReason: null }
  assert.ok(codes(validateDecisionEnvelope(doc)).includes('INVALID_REQUEST'))
})

test('assurance: evidence with a missing reason is INVALID_REQUEST', () => {
  const doc = baseEnvelope()
  doc.assurance = {
    assuranceLevel: 'mediated',
    evidence: [{ runId: 'run-1', hostAdapterRef: 'host-1', runDigest: digestA }],
    missingAssuranceReason: 'evidence-unavailable',
  }
  assert.ok(codes(validateDecisionEnvelope(doc)).includes('INVALID_REQUEST'))
})

test('assurance: evidence of the wrong kind for the level is INVALID_REQUEST', () => {
  const doc = baseEnvelope()
  doc.assurance = {
    assuranceLevel: 'mediated',
    evidence: [{ checkId: 'check-1', fixtureDigest: digestA }],
    missingAssuranceReason: null,
  }
  assert.ok(codes(validateDecisionEnvelope(doc)).includes('INVALID_REQUEST'))
})

// --- EffectResult / ProtocolError / HostCapability / Latency --------------

test('EffectResult: code must correspond to the decision', () => {
  const doc = {
    resultKind: 'effect-result',
    apiVersion: '0.1.0',
    toolVersion: 'tool-1',
    decision: 'APPLIED',
    code: 'EFFECT_NOOP',
    idempotencyKey: binding(),
    effectDigest: null,
    goalRevision: 7,
  }
  assert.ok(codes(validateEffectResult(doc)).includes('INVALID_REQUEST'))
  doc.code = 'EFFECT_APPLIED'
  assert.deepEqual(validateEffectResult(doc), [])
})

test('ProtocolError: KERNEL_UNREACHABLE is excluded from the protocol codes', () => {
  assert.ok(!PROTOCOL_CODES.includes('KERNEL_UNREACHABLE' as never))
  const doc = {
    resultKind: 'protocol-error',
    protocolCode: 'INVALID_REQUEST',
    safeDiagnostic: 'field path only',
    correlationRef: null,
    apiVersion: null,
    toolVersion: 'tool-1',
  }
  assert.deepEqual(validateProtocolError(doc), [])
})

test('HostCapability: unknown posture claim is INVALID_REQUEST', () => {
  const doc = {
    hostAdapterRef: 'host-1',
    hostPostureClaim: 'pretend-supported',
    platformProbe: { probeName: 'probe', probeVersion: '1' },
    rawHostPaths: [],
    normalizationEvidence: null,
  }
  assert.ok(codes(validateHostCapability(doc)).includes('INVALID_REQUEST'))
})

test('LatencyContract: wrong budget literal is INVALID_REQUEST', () => {
  const doc = {
    spans: {
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
    },
    budgetsMicros: {
      kernelWarmP50: 5000,
      kernelWarmP95: 20000,
      kernelWarmP99: 50000,
      mediatedP99: 150000,
      firstCallMax: 2000000,
    },
    decisionDeadlineMicros: 1000000,
    deadlineDisposition: 'evaluate-completed-response-at-or-under-deadline',
    lateResponsePolicy: 'ignore-terminal-outcome',
    warmPopulation:
      'completed-governed-mutation-decision-attempts-after-readiness-and-initial-invocation',
    exclusionReporting: 'failed-deadline-and-excluded-attempts-reported-separately',
    percentileMethod: 'nearest-rank',
    cache: {
      authorizationCache: 'disabled',
      bindings: ['goalRevision', 'policyDigest', 'compiledScopeDigest'],
      matchSufficiency: 'necessary-not-sufficient',
      freshnessRevalidation: [
        'effective-action-request',
        'principal-capability-generation',
        'repository-worktree',
        'lease-gate-freshness',
      ],
      ttlAuthority: 'none',
      latencyEligibility: 'none-granted',
    },
  }
  const mutated = clone(doc)
  ;(mutated.budgetsMicros as Record<string, number>).kernelWarmP50 = 6000
  assert.ok(codes(validateLatencyContract(mutated)).includes('INVALID_REQUEST'))
  const cacheMutated = clone(doc)
  const cache = cacheMutated.cache as Record<string, unknown>
  cache.authorizationCache = 'enabled'
  assert.ok(codes(validateLatencyContract(cacheMutated)).includes('INVALID_REQUEST'))
})

test('PolicyIdentity: registry literal pins are enforced', () => {
  const doc = {
    policyIdentityVersion: '0.1.0',
    registry: {
      registryId: 'foreman-kernel-authority-enforcement',
      schemaVersion: '0.1.0',
      sourceSnapshotCommit: 'eb258d5',
      registryContentDigest: digestA,
    },
    effectivePolicyDigest: digestA,
    effectiveConfigurationDigest: digestA,
  }
  assert.deepEqual(validatePolicyIdentity(doc), [])
  const mutated = clone(doc)
  ;(mutated.registry as Record<string, unknown>).registryId = 'other-registry'
  assert.ok(codes(validatePolicyIdentity(mutated)).includes('INVALID_REQUEST'))
})

// --- Closed registry and projection tables --------------------------------

test('wire-code registry: exactly 28 rows covering the closed union once each', () => {
  assert.equal(WIRE_CODE_RULES.length, 28)
  assert.deepEqual([...WIRE_CODE_RULES.map((rule) => rule.code)].sort(), [...WIRE_CODES].sort())
  assert.equal(MEDIATED_CODES.length, 11)
})

test('wire-code registry: the eleven mediated rows refuse, shadow rows would-refuse', () => {
  for (const rule of WIRE_CODE_RULES) {
    if (rule.code === 'STATE_REVISION_STALE' || rule.code === 'GATE_NOT_SATISFIED') continue
    if ((MEDIATED_CODES as readonly string[]).includes(rule.code)) {
      assert.equal(rule.allowedDecision, 'REFUSE', rule.code)
      assert.equal(rule.shadowWouldDecision, 'REFUSE', rule.code)
    }
  }
})

test('projection tables: anonymous and unknown projections never widen', () => {
  assert.equal(PRINCIPAL_ROLE_PROJECTION['anonymous-read'], 'none')
  assert.equal(PRINCIPAL_ROLE_PROJECTION['kernel-operator'], 'none')
  for (const principal of P0_PRINCIPAL_CLASSES) {
    const role = PRINCIPAL_ROLE_PROJECTION[principal]
    assert.ok(role === 'none' || (ROLE_SELECTIONS as readonly string[]).includes(role))
  }
  assert.equal(
    Object.keys(PRINCIPAL_ROLE_PROJECTION).length,
    AUTHENTICATED_PRINCIPAL_CLASSES.length + 1,
  )
})

test('assurance levels each require their named evidence kind', () => {
  assert.equal(REQUIRED_EVIDENCE_KIND_BY_LEVEL.structural, 'contract-fixture')
  assert.equal(REQUIRED_EVIDENCE_KIND_BY_LEVEL.mediated, 'process-run')
  assert.equal(REQUIRED_EVIDENCE_KIND_BY_LEVEL['detected-only'], 'detection')
  assert.equal(REQUIRED_EVIDENCE_KIND_BY_LEVEL['ci-enforced'], 'ci-run')
  assert.equal(REQUIRED_EVIDENCE_KIND_BY_LEVEL['human-judgment'], 'git-gate-artifact')
  assert.equal(REQUIRED_EVIDENCE_KIND_BY_LEVEL['unsupported-host'], 'host-probe')
  assert.equal(REQUIRED_EVIDENCE_KIND_BY_LEVEL['degraded-read-only'], 'posture-record')
})

// --- GoldenVectorCase cross-field -----------------------------------------

test('golden case: wouldDecision appears only on shadow policy-result cases', () => {
  const doc = {
    caseId: 'vec-x-1',
    charterClause: 'D8',
    producerParcel: 'FK-P13',
    consumerParcel: 'FK-P16',
    inputTrustOrigin: 'admitted-internal',
    request: baseInput('shadow'),
    expectedResponseKind: 'policy-result',
    expectedCode: 'PATH_OUTSIDE_ALLOWED_FILES',
    expectedDecision: 'ADVISORY',
    expectedWouldDecision: 'REFUSE',
    expectedAssuranceLevel: 'detected-only',
    expectedObligations: [],
    trustStageExpectation: 'authorized-context',
    expectedRequestDigest: null,
    expectedInputDigest: digestA,
    verificationStage: 'contract-only',
    laterOwner: 'FK-P12',
  }
  assert.deepEqual(validateGoldenVectorCase(doc), [])
  const enforcedTwin = clone(doc)
  enforcedTwin.request = baseInput('enforcing')
  enforcedTwin.expectedDecision = 'REFUSE'
  assert.ok(codes(validateGoldenVectorCase(enforcedTwin)).includes('INVALID_REQUEST'))
})
