import { createRequire } from 'node:module'
import { internalReviewLaunchSchema } from './schemas.ts'
import type {
  EvidenceClaim,
  InternalReviewEnvelope,
  OfflineAssessment,
  PolicyIssue,
  ReasonCode,
} from './types.ts'

interface ShapeValidator {
  (value: unknown): value is InternalReviewEnvelope
}
/** Existing Ajv validates shape; this narrow typing adapter adds no validator. */
const { Ajv } = createRequire(import.meta.url)('ajv') as {
  Ajv: new (options: {
    allErrors: boolean
    strict: boolean
    ownProperties: boolean
  }) => {
    compile(schema: object): ShapeValidator
  }
}
const validate = new Ajv({ allErrors: true, strict: true, ownProperties: true }).compile(
  internalReviewLaunchSchema,
)
export const RUNTIME_HOLDS: readonly ReasonCode[] = Object.freeze([
  'AUTHORITY_UNPROVEN',
  'PROVIDER_USE_PERMISSION_UNPROVEN',
  'INSTALLATION_UNPROVEN',
  'CAPABILITY_UNPROVEN',
  'INCREMENTAL_CHARGE_BOUND_UNPROVEN',
  'EXECUTION_IDENTITY_UNPROVEN',
  'USAGE_UNCERTAIN',
])
const nativeSettings: readonly string[] = ['minimal', 'low', 'medium', 'high', 'xhigh']

/** Ingress is JSON data, not accessor-bearing objects, prototypes or cycles. */
function isPlainJson(value: unknown, active = new Set<object>(), depth = 0): boolean {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true
  if (typeof value === 'number') return Number.isFinite(value)
  if (typeof value !== 'object' || depth > 32 || active.has(value)) return false
  const array = Array.isArray(value)
  if (
    Object.getPrototypeOf(value) !== (array ? Array.prototype : Object.prototype) ||
    Object.getOwnPropertySymbols(value).length
  )
    return false
  active.add(value)
  for (const [key, property] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
    if (array && key === 'length') continue
    if (
      !property.enumerable ||
      !('value' in property) ||
      (array && !/^(0|[1-9][0-9]*)$/.test(key)) ||
      !isPlainJson(property.value, active, depth + 1)
    )
      return false
  }
  active.delete(value)
  return true
}

function result(
  state: OfflineAssessment['state'],
  issues: readonly PolicyIssue[],
): OfflineAssessment {
  return Object.freeze({
    state,
    provenance: 'untrusted-offline-declarations' as const,
    mayInvokeProvider: false as const,
    runtimeStatus: 'held' as const,
    issues: Object.freeze(issues.map((issue) => Object.freeze({ ...issue }))),
    runtimeHolds: RUNTIME_HOLDS,
  })
}

/**
 * PURE OFFLINE POLICY, never production admission. Every caller-supplied fact is
 * unauthenticated, including "present", mappings, settings, balances and usage.
 * No trusted witnesses are accepted and there is no path to admitted/launch.
 */
export function assessOfflinePolicy(input: unknown, nowEpochMs: number): OfflineAssessment {
  if (!Number.isSafeInteger(nowEpochMs) || nowEpochMs < 0) {
    return result('refused', [{ code: 'SHAPE_REFUSED', path: '/evaluationClock' }])
  }
  try {
    if (!isPlainJson(input) || !validate(input))
      return result('refused', [{ code: 'SHAPE_REFUSED', path: '/' }])
  } catch {
    // Non-JSON objects/getters cannot disclose their values through diagnostics.
    return result('refused', [{ code: 'SHAPE_REFUSED', path: '/' }])
  }
  const issues: PolicyIssue[] = []
  let knownViolation = false
  function reject(code: ReasonCode, path: string): void {
    knownViolation = true
    issues.push({ code, path })
  }
  function hold(code: ReasonCode, path: string): void {
    issues.push({ code, path })
  }
  function evidence(claim: EvidenceClaim, code: ReasonCode, path: string): void {
    if (
      claim.status !== 'present' ||
      claim.changed ||
      claim.revoked ||
      claim.issuedAtEpochMs > nowEpochMs ||
      claim.expiresAtEpochMs <= nowEpochMs ||
      claim.issuedAtEpochMs >= claim.expiresAtEpochMs
    )
      hold(code, path)
  }
  // Ajv's successful closed shape check is the only basis of this type narrowing.
  const envelope = input as InternalReviewEnvelope
  const {
    identity,
    packet,
    authority,
    installation,
    accountPolicy: policy,
    capabilities,
    limits,
    accounting: money,
    attempts,
    custody,
  } = envelope
  evidence(authority.ratification, 'AUTHORITY_UNPROVEN', '/authority/ratification')
  evidence(authority.dispatch, 'AUTHORITY_UNPROVEN', '/authority/dispatch')
  if (!authority.freshInstance || authority.permitClaim === 'unknown')
    hold('AUTHORITY_UNPROVEN', '/authority')
  if (authority.permitClaim === 'consumed')
    reject('PERMIT_REPLAY_REFUSED', '/authority/permitClaim')
  // This compares declarations; it does NOT compute/verify any packet hash.
  for (const [value, path] of [
    [authority.subjectManifestDigest, '/authority/subjectManifestDigest'],
    [custody.subjectManifestDigest, '/custody/subjectManifestDigest'],
  ] as const)
    if (value !== packet.manifestDigest) reject('PACKET_MISMATCH_REFUSED', path)
  const ids = new Set<string>()
  let totalBytes = 0
  let totalTokens = 0
  packet.entries.forEach((entry, index) => {
    if (entry.ordinal !== index || ids.has(entry.id))
      reject('PACKET_MISMATCH_REFUSED', `/packet/entries/${index}`)
    ids.add(entry.id)
    totalBytes += entry.bytes
    totalTokens += entry.inputTokenBound
  })
  if (
    !Number.isSafeInteger(totalBytes) ||
    !Number.isSafeInteger(totalTokens) ||
    totalBytes !== packet.totalBytes ||
    totalTokens !== packet.totalInputTokenBound
  ) {
    reject('PACKET_MISMATCH_REFUSED', '/packet')
  }
  if (packet.totalInputTokenBound > limits.inputTokensPerAttempt)
    reject('BOUND_REFUSED', '/packet/totalInputTokenBound')

  evidence(installation.evidence, 'INSTALLATION_UNPROVEN', '/installation/evidence')
  if (!installation.nativeProviderOnly || installation.separateBroker)
    reject('INSTALLATION_UNPROVEN', '/installation')
  evidence(policy.controls, 'ACCOUNT_CONTROLS_CHANGED', '/accountPolicy/controls')
  evidence(
    policy.providerUsePermission,
    'PROVIDER_USE_PERMISSION_UNPROVEN',
    '/accountPolicy/providerUsePermission',
  )
  if (!policy.ownerAttested || !policy.modelImprovementOff || !policy.paidExtraUsageOff) {
    reject('ACCOUNT_CONTROLS_CHANGED', '/accountPolicy')
  }
  if (
    !policy.ownCredentialFreePacket ||
    policy.customerClientData ||
    policy.restrictedRegulatedData ||
    policy.credentialsIncluded ||
    policy.zdrClaim ||
    policy.feedbackUploadAllowed
  ) {
    reject('DATA_SCOPE_REFUSED', '/accountPolicy')
  }
  // No absolute ZDR test: the purpose-bound nonzero-retention exception is kept.
  for (const leg of ['primary', 'fallback'] as const) {
    const model = capabilities[leg]
    const path = `/capabilities/${leg}`
    evidence(model.evidence, 'CAPABILITY_UNPROVEN', `${path}/evidence`)
    evidence(model.reasoning.evidence, 'CAPABILITY_UNPROVEN', `${path}/reasoning/evidence`)
    if (
      model.family !== 'anthropic' ||
      model.family === identity.authorFamily ||
      (identity.excludedFamilies as readonly string[]).includes(model.family) ||
      !model.plainFindings ||
      !model.qualitySuitable ||
      !model.reviewSuitable
    )
      hold('CAPABILITY_UNPROVEN', path)
    const reasoning = model.reasoning
    if (
      !reasoning.mappingVerified ||
      !nativeSettings.includes(reasoning.nativeMaximum) ||
      reasoning.requested !== reasoning.nativeMaximum
    )
      hold('CAPABILITY_UNPROVEN', `${path}/reasoning`)
  }

  evidence(money.evidence, 'INCREMENTAL_CHARGE_BOUND_UNPROVEN', '/accounting/evidence')
  if (
    money.parentId !== money.reviewParentId ||
    money.parentId === money.reviewId ||
    money.reviewCapCents > money.parentCapCents ||
    money.reviewSpentCents > money.parentSpentCents ||
    money.reviewReservedCents > money.parentReservedCents
  ) {
    hold('INCREMENTAL_CHARGE_BOUND_UNPROVEN', '/accounting/parentBinding')
  }
  if (
    !money.additionalExposureKnown ||
    money.chargeStatus !== 'included-quota' ||
    money.paidTransitionsAllowed ||
    money.includesAlreadyPaidSubscriptionFee ||
    money.apiEstimateIsInvoice
  ) {
    hold('INCREMENTAL_CHARGE_BOUND_UNPROVEN', '/accounting/chargeBasis')
  }
  const parentRemaining = money.parentCapCents - money.parentSpentCents - money.parentReservedCents
  const reviewRemaining = money.reviewCapCents - money.reviewSpentCents - money.reviewReservedCents
  if (
    parentRemaining <= 0 ||
    reviewRemaining <= 0 ||
    money.proposedExposureCents > parentRemaining ||
    money.proposedExposureCents > reviewRemaining
  ) {
    reject('BUDGET_EXHAUSTED', '/accounting/remaining')
  }
  if (money.quotaStatus === 'exhausted' || money.quotaRemainingTokens === 0)
    reject('QUOTA_EXHAUSTED', '/accounting/quota')
  if (money.quotaStatus === 'unknown' || !money.usageReconciled)
    hold('USAGE_UNCERTAIN', '/accounting/usage')

  let elapsed = 0
  attempts.forEach((attempt, index) => {
    const path = `/attempts/${index}`
    if (attempt.leg !== (index === 0 ? 'primary' : 'fallback'))
      reject('BOUND_REFUSED', `${path}/leg`)
    if (
      attempt.subjectManifestDigest !== packet.manifestDigest ||
      attempt.includesPrimaryAnalysis
    ) {
      reject('PACKET_MISMATCH_REFUSED', `${path}/subject`)
    }
    if (
      attempt.requests > limits.requestsPerAttempt ||
      attempt.inputTokens > limits.inputTokensPerAttempt ||
      attempt.outputAndReasoningTokens > limits.outputAndReasoningTokensPerAttempt ||
      attempt.elapsedMinutes > limits.minutesPerAttempt
    )
      reject('BOUND_REFUSED', path)
    if (
      (attempt.outcome === 'not-started' && attempt.requests !== 0) ||
      (attempt.outcome !== 'not-started' && attempt.requests === 0) ||
      (attempt.requests === 0 &&
        (attempt.inputTokens !== 0 || attempt.outputAndReasoningTokens !== 0))
    ) {
      reject('BOUND_REFUSED', `${path}/observations`)
    }
    if (attempt.usage !== 'reconciled') hold('USAGE_UNCERTAIN', `${path}/usage`)
    elapsed += attempt.elapsedMinutes
  })
  if (elapsed > envelope.elapsedMinutesTotal || envelope.elapsedMinutesTotal > limits.minutesTotal)
    reject('BOUND_REFUSED', '/elapsedMinutesTotal')
  if (attempts.length === 2 && attempts[0]?.outcome !== 'unusable')
    reject('BOUND_REFUSED', '/attempts/fallbackPrerequisite')
  // Usage/evidence/accounting uncertainty anywhere prevents fixture compatibility
  // and therefore fallback compatibility; no retries or implicit resets occur.
  evidence(custody.evidence, 'EXECUTION_IDENTITY_UNPROVEN', '/custody/evidence')
  return result(knownViolation ? 'refused' : issues.length ? 'held' : 'fixture-compatible', issues)
}
