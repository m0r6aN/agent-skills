import assert from 'node:assert/strict'
import { test } from 'node:test'
import { assessOfflinePolicy } from '../src/index.ts'
import type { EvidenceClaim, InternalReviewEnvelope, ReasonCode } from '../src/types.ts'

const now = 1_791_748_800_000
const digest = 'a'.repeat(64)
const claim = (): EvidenceClaim => ({
  ref: 'synthetic:not-authenticated',
  status: 'present',
  issuedAtEpochMs: now - 1_000,
  expiresAtEpochMs: now + 60_000,
  changed: false,
  revoked: false,
})

/** Entirely synthetic. These refs are not the user's real installation/authority. */
function fixture(): InternalReviewEnvelope {
  const model = (modelId: 'claude-fable-5-1' | 'claude-opus-5-5') => ({
    provider: 'anthropic' as const,
    modelId,
    family: 'anthropic',
    tier: 'frontier' as const,
    contextTokens: 200_000,
    tools: ['read_evidence'] as const,
    plainFindings: true,
    qualitySuitable: true,
    reviewSuitable: true,
    reasoning: {
      requested: 'high',
      nativeMaximum: 'high',
      mappingVerified: true,
      evidence: claim(),
    },
    evidence: claim(),
  })
  return {
    version: 'internal-review-launch/v1',
    identity: {
      goal: 'operator-developer-cortex-memory',
      purpose: 'initial-plan-review',
      taskId: 'synthetic-task',
      instanceId: '11111111-2222-3333-4444-555555555555',
      authorFamily: 'openai',
      lane: 'L2',
      roleFamily: 'verifier',
      subRole: 'adversarial-reviewer',
      routingClass: 'architecture/risk',
      dataClass: 'internal',
      dataPolicy: 'owner-accepted-subscription-policy',
      excludedFamilies: ['openai'],
    },
    packet: {
      sourceCommit: 'b'.repeat(40),
      manifestId: 'synthetic-manifest',
      manifestDigest: digest,
      entries: [{ ordinal: 0, id: 'entry-1', digest, bytes: 100, inputTokenBound: 100 }],
      totalBytes: 100,
      totalInputTokenBound: 100,
      mandateRef: 'synthetic:mandate',
      canonRef: 'synthetic:canon',
    },
    authority: {
      human: 'Clinton Morgan',
      contractCommit: 'f5ec6cac7736ffb3ef24a0091bf0b56ea9136034',
      scope: 'operator-developer-cortex-memory/initial-plan-review',
      subjectManifestDigest: digest,
      freshInstance: true,
      permitClaim: 'unclaimed',
      ratification: claim(),
      dispatch: claim(),
    },
    installation: {
      installationId: 'synthetic-install',
      piPackageDigest: digest,
      nativeProviderDigest: digest,
      runtimeDigest: digest,
      dependencyLockDigest: digest,
      reviewHostDigest: digest,
      admissionDigest: digest,
      evidenceAdapterDigest: digest,
      accountingDigest: digest,
      mappingEvidenceRef: 'synthetic:mapping',
      isolationEvidenceRef: 'synthetic:isolation',
      nativeProviderOnly: true,
      separateBroker: false,
      evidence: claim(),
    },
    accountPolicy: {
      plan: 'Pro',
      authMode: 'pi-native-oauth',
      ownerAttested: true,
      modelImprovementOff: true,
      paidExtraUsageOff: true,
      readinessRef: 'synthetic:readiness',
      settingsRef: 'synthetic:settings',
      ownCredentialFreePacket: true,
      customerClientData: false,
      restrictedRegulatedData: false,
      credentialsIncluded: false,
      retention: 'nonzero-with-safety-feedback-exceptions',
      zdrClaim: false,
      feedbackUploadAllowed: false,
      controls: claim(),
      providerUsePermission: claim(),
    },
    capabilities: { primary: model('claude-fable-5-1'), fallback: model('claude-opus-5-5') },
    limits: {
      inputTokensPerAttempt: 48_000,
      outputAndReasoningTokensPerAttempt: 8_000,
      primaryAttempts: 1,
      fallbackAttempts: 1,
      requestsPerAttempt: 8,
      minutesPerAttempt: 30,
      minutesTotal: 60,
    },
    accounting: {
      currency: 'USD',
      basis: 'incremental-charge',
      parentId: 'synthetic-parent',
      reviewId: 'synthetic-review',
      reviewParentId: 'synthetic-parent',
      parentCapCents: 2_500,
      reviewCapCents: 500,
      parentSpentCents: 200,
      parentReservedCents: 100,
      reviewSpentCents: 50,
      reviewReservedCents: 25,
      proposedExposureCents: 0,
      additionalExposureKnown: true,
      chargeStatus: 'included-quota',
      quotaStatus: 'available',
      quotaRemainingTokens: 100_000,
      paidTransitionsAllowed: false,
      includesAlreadyPaidSubscriptionFee: false,
      apiEstimateIsInvoice: false,
      usageReconciled: true,
      evidence: claim(),
    },
    attempts: [
      {
        leg: 'primary',
        requests: 1,
        inputTokens: 100,
        outputAndReasoningTokens: 100,
        elapsedMinutes: 1,
        usage: 'reconciled',
        outcome: 'unusable',
        subjectManifestDigest: digest,
        includesPrimaryAnalysis: false,
      },
    ],
    elapsedMinutesTotal: 1,
    custody: {
      coordinatorInstanceId: '01a12b4f-c8e9-70a4-811b-0cd7eb889457',
      destinationRef: 'synthetic:coordinator',
      resultShape: 'bounded-plain-findings/v1',
      maxFindings: 20,
      maxResultBytes: 16_000,
      subjectManifestDigest: digest,
      executionIdentityRef: 'synthetic:execution',
      usageRef: 'synthetic:usage',
      startingIsolationRef: 'synthetic:start',
      endingIsolationRef: 'synthetic:end',
      evidence: claim(),
    },
  }
}

function mutableFixture(): Record<string, unknown> {
  return structuredClone(fixture()) as unknown as Record<string, unknown>
}
function container(root: unknown, path: string[]): Record<string, unknown> {
  let node = root
  for (const key of path) node = (node as Record<string, unknown>)[key]
  return node as Record<string, unknown>
}
function changed(path: string, value: unknown): unknown {
  const input = mutableFixture()
  const parts = path.split('.')
  const key = parts.pop()!
  container(input, parts)[key] = value
  return input
}
function assess(input: unknown) {
  const result = assessOfflinePolicy(input, now)
  assert.equal(result.mayInvokeProvider, false)
  assert.equal(result.runtimeStatus, 'held')
  assert.equal(result.provenance, 'untrusted-offline-declarations')
  assert.ok(result.runtimeHolds.includes('AUTHORITY_UNPROVEN'))
  assert.ok(result.runtimeHolds.includes('INSTALLATION_UNPROVEN'))
  assert.equal('permit' in result, false)
  assert.equal('receipt' in result, false)
  return result
}

test('accepts scoped Pro/non-ZDR/high-native declarations ONLY as a fixture', () => {
  const result = assess(fixture())
  assert.equal(result.state, 'fixture-compatible')
  assert.deepEqual(result.issues, [])
})
test('fabricated complete refs/digests can never authenticate or authorize runtime', () => {
  const input = fixture()
  const result = assess(input)
  assert.equal(result.state, 'fixture-compatible')
  assert.ok(result.runtimeHolds.includes('PROVIDER_USE_PERMISSION_UNPROVEN'))
  assert.ok(result.runtimeHolds.includes('CAPABILITY_UNPROVEN'))
  assert.ok(result.runtimeHolds.includes('INCREMENTAL_CHARGE_BOUND_UNPROVEN'))
  assert.ok(result.runtimeHolds.includes('EXECUTION_IDENTITY_UNPROVEN'))
  assert.deepEqual(assess(input), result) // no single-use claim/replay enforcement is faked
  assert.deepEqual(input, fixture()) // no mutation/reservation/permit consumption
})

const negatives: readonly [string, unknown, ReasonCode][] = [
  ['version', 'internal-review-launch/v2', 'SHAPE_REFUSED'],
  ['identity.goal', 'another-goal', 'SHAPE_REFUSED'],
  ['identity.purpose', 'completed-P0-review', 'SHAPE_REFUSED'],
  ['identity.lane', 'G6', 'SHAPE_REFUSED'],
  ['identity.roleFamily', 'builder', 'SHAPE_REFUSED'],
  ['identity.subRole', 'coordinator', 'SHAPE_REFUSED'],
  ['identity.routingClass', 'implementation', 'SHAPE_REFUSED'],
  ['identity.dataClass', 'public', 'SHAPE_REFUSED'],
  ['identity.dataPolicy', 'global-zdr', 'SHAPE_REFUSED'],
  ['identity.excludedFamilies', [], 'SHAPE_REFUSED'],
  ['identity.instanceId', 'old-instance', 'SHAPE_REFUSED'],
  ['identity.authorFamily', 'anthropic', 'CAPABILITY_UNPROVEN'],
  ['authority.contractCommit', 'c'.repeat(40), 'SHAPE_REFUSED'],
  ['authority.human', 'another-owner', 'SHAPE_REFUSED'],
  ['authority.freshInstance', false, 'AUTHORITY_UNPROVEN'],
  ['authority.permitClaim', 'consumed', 'PERMIT_REPLAY_REFUSED'],
  ['authority.permitClaim', 'unknown', 'AUTHORITY_UNPROVEN'],
  ['authority.subjectManifestDigest', 'c'.repeat(64), 'PACKET_MISMATCH_REFUSED'],
  ['packet.totalBytes', 101, 'PACKET_MISMATCH_REFUSED'],
  ['packet.totalInputTokenBound', 101, 'PACKET_MISMATCH_REFUSED'],
  ['packet.entries.0.ordinal', 1, 'PACKET_MISMATCH_REFUSED'],
  ['packet.manifestDigest', 'not-a-digest', 'SHAPE_REFUSED'],
  ['packet.mandateRef', '', 'SHAPE_REFUSED'],
  ['packet.canonRef', '', 'SHAPE_REFUSED'],
  ['capabilities.primary.modelId', 'claude-opus-5-5', 'SHAPE_REFUSED'],
  ['capabilities.fallback.modelId', 'claude-fable-5-1', 'SHAPE_REFUSED'],
  ['installation.nativeProviderOnly', false, 'INSTALLATION_UNPROVEN'],
  ['installation.separateBroker', true, 'INSTALLATION_UNPROVEN'],
  ['accountPolicy.plan', 'API', 'SHAPE_REFUSED'],
  ['accountPolicy.authMode', 'api-key', 'SHAPE_REFUSED'],
  ['accountPolicy.ownerAttested', false, 'ACCOUNT_CONTROLS_CHANGED'],
  ['accountPolicy.modelImprovementOff', false, 'ACCOUNT_CONTROLS_CHANGED'],
  ['accountPolicy.paidExtraUsageOff', false, 'ACCOUNT_CONTROLS_CHANGED'],
  ['accountPolicy.ownCredentialFreePacket', false, 'DATA_SCOPE_REFUSED'],
  ['accountPolicy.customerClientData', true, 'DATA_SCOPE_REFUSED'],
  ['accountPolicy.restrictedRegulatedData', true, 'DATA_SCOPE_REFUSED'],
  ['accountPolicy.credentialsIncluded', true, 'DATA_SCOPE_REFUSED'],
  ['accountPolicy.zdrClaim', true, 'DATA_SCOPE_REFUSED'],
  ['accountPolicy.feedbackUploadAllowed', true, 'DATA_SCOPE_REFUSED'],
  ['limits.inputTokensPerAttempt', 48_001, 'SHAPE_REFUSED'],
  ['limits.outputAndReasoningTokensPerAttempt', 8_001, 'SHAPE_REFUSED'],
  ['limits.primaryAttempts', 2, 'SHAPE_REFUSED'],
  ['limits.fallbackAttempts', 2, 'SHAPE_REFUSED'],
  ['limits.requestsPerAttempt', 9, 'SHAPE_REFUSED'],
  ['limits.minutesPerAttempt', 31, 'SHAPE_REFUSED'],
  ['limits.minutesTotal', 61, 'SHAPE_REFUSED'],
  ['accounting.basis', 'api-catalogue-price', 'SHAPE_REFUSED'],
  ['accounting.reviewParentId', 'new-parent', 'INCREMENTAL_CHARGE_BOUND_UNPROVEN'],
  ['accounting.reviewId', 'synthetic-parent', 'INCREMENTAL_CHARGE_BOUND_UNPROVEN'],
  ['accounting.parentCapCents', 2_501, 'SHAPE_REFUSED'],
  ['accounting.reviewCapCents', 501, 'SHAPE_REFUSED'],
  ['accounting.parentSpentCents', 2_500, 'BUDGET_EXHAUSTED'],
  ['accounting.reviewSpentCents', 500, 'BUDGET_EXHAUSTED'],
  ['accounting.proposedExposureCents', 426, 'BUDGET_EXHAUSTED'],
  ['accounting.parentReservedCents', 2_301, 'BUDGET_EXHAUSTED'],
  ['accounting.reviewReservedCents', 101, 'INCREMENTAL_CHARGE_BOUND_UNPROVEN'],
  ['accounting.additionalExposureKnown', false, 'INCREMENTAL_CHARGE_BOUND_UNPROVEN'],
  ['accounting.chargeStatus', 'unknown', 'INCREMENTAL_CHARGE_BOUND_UNPROVEN'],
  ['accounting.chargeStatus', 'paid-transition', 'INCREMENTAL_CHARGE_BOUND_UNPROVEN'],
  ['accounting.quotaStatus', 'exhausted', 'QUOTA_EXHAUSTED'],
  ['accounting.quotaStatus', 'unknown', 'USAGE_UNCERTAIN'],
  ['accounting.quotaRemainingTokens', 0, 'QUOTA_EXHAUSTED'],
  ['accounting.paidTransitionsAllowed', true, 'INCREMENTAL_CHARGE_BOUND_UNPROVEN'],
  ['accounting.includesAlreadyPaidSubscriptionFee', true, 'INCREMENTAL_CHARGE_BOUND_UNPROVEN'],
  ['accounting.apiEstimateIsInvoice', true, 'INCREMENTAL_CHARGE_BOUND_UNPROVEN'],
  ['accounting.usageReconciled', false, 'USAGE_UNCERTAIN'],
  ['accounting.parentSpentCents', -1, 'SHAPE_REFUSED'],
  ['accounting.parentReservedCents', Number.MAX_SAFE_INTEGER + 1, 'SHAPE_REFUSED'],
  ['elapsedMinutesTotal', 61, 'SHAPE_REFUSED'],
  ['elapsedMinutesTotal', 0, 'BOUND_REFUSED'],
  ['attempts.0.outcome', 'not-started', 'BOUND_REFUSED'],
  ['attempts.0.requests', 0, 'BOUND_REFUSED'],
  ['attempts.0.requests', 9, 'SHAPE_REFUSED'],
  ['attempts.0.inputTokens', 48_001, 'SHAPE_REFUSED'],
  ['attempts.0.outputAndReasoningTokens', 8_001, 'SHAPE_REFUSED'],
  ['attempts.0.elapsedMinutes', 31, 'SHAPE_REFUSED'],
  ['attempts.0.usage', 'uncertain', 'USAGE_UNCERTAIN'],
  ['attempts.0.leg', 'fallback', 'BOUND_REFUSED'],
  ['attempts.0.subjectManifestDigest', 'c'.repeat(64), 'PACKET_MISMATCH_REFUSED'],
  ['attempts.0.includesPrimaryAnalysis', true, 'PACKET_MISMATCH_REFUSED'],
  ['custody.coordinatorInstanceId', '11111111-2222-3333-4444-555555555555', 'SHAPE_REFUSED'],
  ['custody.subjectManifestDigest', 'c'.repeat(64), 'PACKET_MISMATCH_REFUSED'],
  ['custody.maxResultBytes', 0, 'SHAPE_REFUSED'],
  ['custody.resultShape', 'unbounded-text', 'SHAPE_REFUSED'],
]
for (const [path, value, code] of negatives)
  test(`independent refusal/hold: ${path} = ${JSON.stringify(value)}`, () => {
    const result = assess(changed(path, value))
    assert.notEqual(result.state, 'fixture-compatible')
    assert.ok(
      result.issues.some((issue) => issue.code === code),
      JSON.stringify(result.issues),
    )
  })
for (const leg of ['primary', 'fallback']) {
  for (const [suffix, value, code] of [
    ['provider', 'openai', 'SHAPE_REFUSED'],
    ['modelId', 'unapproved-model', 'SHAPE_REFUSED'],
    ['family', 'openai', 'CAPABILITY_UNPROVEN'],
    ['family', 'unknown-family', 'CAPABILITY_UNPROVEN'],
    ['tier', 'standard', 'SHAPE_REFUSED'],
    ['contextTokens', 199_999, 'SHAPE_REFUSED'],
    ['tools', ['read_evidence', 'bash'], 'SHAPE_REFUSED'],
    ['plainFindings', false, 'CAPABILITY_UNPROVEN'],
    ['qualitySuitable', false, 'CAPABILITY_UNPROVEN'],
    ['reviewSuitable', false, 'CAPABILITY_UNPROVEN'],
    ['reasoning.mappingVerified', false, 'CAPABILITY_UNPROVEN'],
    ['reasoning.requested', 'default', 'CAPABILITY_UNPROVEN'],
    ['reasoning.nativeMaximum', 'xhigh', 'CAPABILITY_UNPROVEN'],
  ] as const)
    test(`${leg} independent capability negative: ${suffix}`, () => {
      const result = assess(changed(`capabilities.${leg}.${suffix}`, value))
      assert.notEqual(result.state, 'fixture-compatible')
      assert.ok(
        result.issues.some((issue) => issue.code === code),
        JSON.stringify(result.issues),
      )
    })
}
const evidencePaths: readonly [string, ReasonCode][] = [
  ['authority.ratification', 'AUTHORITY_UNPROVEN'],
  ['authority.dispatch', 'AUTHORITY_UNPROVEN'],
  ['installation.evidence', 'INSTALLATION_UNPROVEN'],
  ['accountPolicy.controls', 'ACCOUNT_CONTROLS_CHANGED'],
  ['accountPolicy.providerUsePermission', 'PROVIDER_USE_PERMISSION_UNPROVEN'],
  ['capabilities.primary.evidence', 'CAPABILITY_UNPROVEN'],
  ['capabilities.fallback.evidence', 'CAPABILITY_UNPROVEN'],
  ['capabilities.primary.reasoning.evidence', 'CAPABILITY_UNPROVEN'],
  ['capabilities.fallback.reasoning.evidence', 'CAPABILITY_UNPROVEN'],
  ['accounting.evidence', 'INCREMENTAL_CHARGE_BOUND_UNPROVEN'],
  ['custody.evidence', 'EXECUTION_IDENTITY_UNPROVEN'],
]
for (const [path, code] of evidencePaths)
  for (const [suffix, value] of [
    ['status', 'unknown'],
    ['status', 'contradicted'],
    ['changed', true],
    ['revoked', true],
    ['expiresAtEpochMs', now],
    ['issuedAtEpochMs', now + 1],
    ['expiresAtEpochMs', now - 2_000],
  ] as const)
    test(`declared evidence hold: ${path}.${suffix} = ${value}`, () => {
      const result = assess(changed(`${path}.${suffix}`, value))
      assert.equal(result.state, 'held')
      assert.ok(
        result.issues.some((issue) => issue.code === code),
        JSON.stringify(result.issues),
      )
    })

// Closed-schema negative controls at EVERY object and property, not just the root.
function registerClosedControls(value: unknown, path: string[] = []): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      registerClosedControls(item, [...path, String(index)])
    })
    return
  }
  if (!value || typeof value !== 'object') return
  test(`extra key refused: /${path.join('/')}`, () => {
    const input = mutableFixture()
    container(input, path).unexpected = 'not-authority'
    assert.equal(assess(input).state, 'refused')
  })
  for (const [key, child] of Object.entries(value)) {
    for (const mode of ['missing', 'null'] as const)
      test(`${mode} refused: /${[...path, key].join('/')}`, () => {
        const input = mutableFixture()
        const object = container(input, path)
        if (mode === 'missing') delete object[key]
        else object[key] = null
        assert.equal(assess(input).state, 'refused')
      })
    registerClosedControls(child, [...path, key])
  }
}
registerClosedControls(fixture())

test('explicit verified xhigh is compatible when BOTH exact native mappings say xhigh', () => {
  const input = mutableFixture()
  for (const leg of ['primary', 'fallback']) {
    const reasoning = container(input, ['capabilities', leg, 'reasoning'])
    reasoning.requested = reasoning.nativeMaximum = 'xhigh'
  }
  assert.equal(assess(input).state, 'fixture-compatible')
})
test('exact cumulative token/request/time maxima and shared budgets are compatible fixtures', () => {
  const input = mutableFixture()
  const attempt = container(input, ['attempts', '0'])
  Object.assign(attempt, {
    requests: 8,
    inputTokens: 48_000,
    outputAndReasoningTokens: 8_000,
    elapsedMinutes: 30,
  })
  input.elapsedMinutesTotal = 30
  assert.equal(assess(input).state, 'fixture-compatible')
})
test('stricter declared limits are enforced against cumulative observations', () => {
  const input = mutableFixture()
  container(input, ['limits']).inputTokensPerAttempt = 99
  const result = assess(input)
  assert.ok(result.issues.some((issue) => issue.code === 'BOUND_REFUSED'))
})
test('duplicate entry IDs/order and aggregate overflow refuse', () => {
  const input = mutableFixture()
  const packet = container(input, ['packet'])
  const entry = container(input, ['packet', 'entries', '0'])
  packet.entries = [entry, { ...entry }]
  packet.totalBytes = 200
  packet.totalInputTokenBound = 200
  assert.ok(assess(input).issues.some((issue) => issue.code === 'PACKET_MISMATCH_REFUSED'))
})
test('fallback uses original subject once, after unusable reconciled primary', () => {
  const input = mutableFixture()
  const primary = container(input, ['attempts', '0'])
  input.attempts = [primary, { ...primary, leg: 'fallback' }]
  input.elapsedMinutesTotal = 2
  assert.equal(assess(input).state, 'fixture-compatible')
  primary.outcome = 'completed'
  assert.ok(assess(input).issues.some((issue) => issue.code === 'BOUND_REFUSED'))
})
test('repeated primary/third attempt and fallback before primary refuse', () => {
  const input = mutableFixture()
  const primary = container(input, ['attempts', '0'])
  input.attempts = [primary, { ...primary }]
  assert.ok(assess(input).issues.some((issue) => issue.code === 'BOUND_REFUSED'))
  input.attempts = [primary, { ...primary, leg: 'fallback' }, { ...primary, leg: 'fallback' }]
  assert.equal(assess(input).state, 'refused')
})
test('unknown native setting cannot become verified by matching two invented strings', () => {
  const input = mutableFixture()
  for (const leg of ['primary', 'fallback']) {
    const reasoning = container(input, ['capabilities', leg, 'reasoning'])
    reasoning.requested = reasoning.nativeMaximum = 'invented-setting'
  }
  const result = assess(input)
  assert.equal(result.state, 'held')
  assert.ok(result.issues.some((issue) => issue.code === 'CAPABILITY_UNPROVEN'))
})
for (const [limit, value] of [
  ['outputAndReasoningTokensPerAttempt', 99],
  ['requestsPerAttempt', 1],
  ['minutesPerAttempt', 1],
  ['minutesTotal', 1],
] as const)
  test(`stricter bound independently enforced: ${limit}`, () => {
    const input = mutableFixture()
    const attempt = container(input, ['attempts', '0'])
    Object.assign(attempt, { requests: 2, elapsedMinutes: 2 })
    input.elapsedMinutesTotal = 2
    container(input, ['limits'])[limit] = value
    assert.ok(assess(input).issues.some((issue) => issue.code === 'BOUND_REFUSED'))
  })
test('whole-route wall time includes gaps and maximum 60-minute two-attempt fixture', () => {
  const input = mutableFixture()
  const primary = container(input, ['attempts', '0'])
  primary.elapsedMinutes = 30
  input.attempts = [primary, { ...primary, leg: 'fallback' }]
  input.elapsedMinutesTotal = 60
  assert.equal(assess(input).state, 'fixture-compatible')
  container(input, ['limits']).minutesTotal = 59
  assert.ok(assess(input).issues.some((issue) => issue.code === 'BOUND_REFUSED'))
})
test('parent remaining allowance limits review even when subcap would suffice', () => {
  const input = mutableFixture()
  const money = container(input, ['accounting'])
  money.parentReservedCents = 2_299 // 1 cent parent remaining, 425 cents review remaining
  money.proposedExposureCents = 2
  assert.ok(assess(input).issues.some((issue) => issue.code === 'BUDGET_EXHAUSTED'))
})
test('packet aggregate safe-integer overflow is refused without trusting claimed totals', () => {
  const input = mutableFixture()
  const packet = container(input, ['packet'])
  const entry = container(input, ['packet', 'entries', '0'])
  entry.bytes = Number.MAX_SAFE_INTEGER
  packet.entries = [entry, { ...entry, ordinal: 1, id: 'entry-2', bytes: 1 }]
  packet.totalBytes = Number.MAX_SAFE_INTEGER
  packet.totalInputTokenBound = 200
  assert.ok(assess(input).issues.some((issue) => issue.code === 'PACKET_MISMATCH_REFUSED'))
})
test('declared usage uncertainty prevents fallback compatibility without creating a retry', () => {
  const input = mutableFixture()
  const primary = container(input, ['attempts', '0'])
  input.attempts = [primary, { ...primary, leg: 'fallback' }]
  input.elapsedMinutesTotal = 2
  primary.usage = 'uncertain'
  assert.equal(assess(input).state, 'held')
})
test('JSON ingress rejects inherited/accessor/cyclic objects without invoking getters', () => {
  const input = mutableFixture()
  let getterCalls = 0
  Object.defineProperty(input, 'version', {
    enumerable: true,
    get() {
      getterCalls++
      throw new Error('SECRET-CANARY')
    },
  })
  assert.equal(assess(input).state, 'refused')
  assert.equal(getterCalls, 0)
  const inherited = Object.create(fixture()) as unknown
  assert.equal(assess(inherited).state, 'refused')
  const cyclic = mutableFixture()
  cyclic.unexpected = cyclic
  assert.equal(assess(cyclic).state, 'refused')
})
test('invalid clock/input are refused without disclosure of caller values', () => {
  for (const input of [undefined, null, [], 'SECRET-CANARY', 1, true]) {
    const result = assess(input)
    assert.equal(result.state, 'refused')
    assert.equal(JSON.stringify(result).includes('SECRET-CANARY'), false)
  }
  assert.equal(assessOfflinePolicy(fixture(), NaN).state, 'refused')
  assert.equal(assessOfflinePolicy(fixture(), -1).state, 'refused')
})
