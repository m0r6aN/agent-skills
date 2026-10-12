/** Offline declarations only. A reference/status is NOT authenticated evidence. */
export interface EvidenceClaim {
  readonly ref: string
  readonly status: 'present' | 'unknown' | 'contradicted'
  readonly issuedAtEpochMs: number
  readonly expiresAtEpochMs: number
  readonly changed: boolean
  readonly revoked: boolean
}

export interface ModelClaim {
  readonly provider: 'anthropic'
  readonly modelId: 'claude-fable-5-1' | 'claude-opus-5-5'
  readonly family: string
  readonly tier: 'frontier'
  readonly contextTokens: number
  readonly tools: readonly ['read_evidence']
  readonly plainFindings: boolean
  readonly qualitySuitable: boolean
  readonly reviewSuitable: boolean
  readonly reasoning: {
    readonly requested: string
    readonly nativeMaximum: string
    readonly mappingVerified: boolean
    readonly evidence: EvidenceClaim
  }
  readonly evidence: EvidenceClaim
}

export interface AttemptClaim {
  readonly leg: 'primary' | 'fallback'
  readonly requests: number
  /** Cumulative, including repeated/cached/tool input and ALL output/reasoning. */
  readonly inputTokens: number
  readonly outputAndReasoningTokens: number
  readonly elapsedMinutes: number
  readonly usage: 'reconciled' | 'uncertain'
  readonly outcome: 'not-started' | 'unusable' | 'completed'
  readonly subjectManifestDigest: string
  readonly includesPrimaryAnalysis: boolean
}

export interface InternalReviewEnvelope {
  readonly version: 'internal-review-launch/v1'
  readonly identity: {
    readonly goal: 'operator-developer-cortex-memory'
    readonly purpose: 'initial-plan-review'
    readonly taskId: string
    readonly instanceId: string
    readonly authorFamily: string
    readonly lane: 'L2'
    readonly roleFamily: 'verifier'
    readonly subRole: 'adversarial-reviewer'
    readonly routingClass: 'architecture/risk'
    readonly dataClass: 'internal'
    readonly dataPolicy: 'owner-accepted-subscription-policy'
    readonly excludedFamilies: readonly ['openai']
  }
  readonly packet: {
    readonly sourceCommit: string
    readonly manifestId: string
    readonly manifestDigest: string
    readonly entries: readonly {
      readonly ordinal: number
      readonly id: string
      readonly digest: string
      readonly bytes: number
      readonly inputTokenBound: number
    }[]
    readonly totalBytes: number
    readonly totalInputTokenBound: number
    readonly mandateRef: string
    readonly canonRef: string
  }
  readonly authority: {
    readonly human: 'Clinton Morgan'
    readonly contractCommit: 'f5ec6cac7736ffb3ef24a0091bf0b56ea9136034'
    readonly scope: 'operator-developer-cortex-memory/initial-plan-review'
    readonly subjectManifestDigest: string
    readonly freshInstance: boolean
    readonly permitClaim: 'unclaimed' | 'consumed' | 'unknown'
    readonly ratification: EvidenceClaim
    readonly dispatch: EvidenceClaim
  }
  readonly installation: {
    readonly installationId: string
    readonly piPackageDigest: string
    readonly nativeProviderDigest: string
    readonly runtimeDigest: string
    readonly dependencyLockDigest: string
    readonly reviewHostDigest: string
    readonly admissionDigest: string
    readonly evidenceAdapterDigest: string
    readonly accountingDigest: string
    readonly mappingEvidenceRef: string
    readonly isolationEvidenceRef: string
    readonly nativeProviderOnly: boolean
    readonly separateBroker: boolean
    readonly evidence: EvidenceClaim
  }
  readonly accountPolicy: {
    readonly plan: 'Pro'
    readonly authMode: 'pi-native-oauth'
    readonly ownerAttested: boolean
    readonly modelImprovementOff: boolean
    readonly paidExtraUsageOff: boolean
    readonly readinessRef: string
    readonly settingsRef: string
    readonly ownCredentialFreePacket: boolean
    readonly customerClientData: boolean
    readonly restrictedRegulatedData: boolean
    readonly credentialsIncluded: boolean
    readonly retention: 'nonzero-with-safety-feedback-exceptions'
    readonly zdrClaim: boolean
    readonly feedbackUploadAllowed: boolean
    readonly controls: EvidenceClaim
    readonly providerUsePermission: EvidenceClaim
  }
  readonly capabilities: {
    readonly primary: ModelClaim
    readonly fallback: ModelClaim
  }
  readonly limits: {
    readonly inputTokensPerAttempt: number
    readonly outputAndReasoningTokensPerAttempt: number
    readonly primaryAttempts: number
    readonly fallbackAttempts: number
    readonly requestsPerAttempt: number
    readonly minutesPerAttempt: number
    readonly minutesTotal: number
  }
  readonly accounting: {
    readonly currency: 'USD'
    readonly basis: 'incremental-charge'
    readonly parentId: string
    readonly reviewId: string
    readonly reviewParentId: string
    readonly parentCapCents: number
    readonly reviewCapCents: number
    readonly parentSpentCents: number
    readonly parentReservedCents: number
    readonly reviewSpentCents: number
    readonly reviewReservedCents: number
    readonly proposedExposureCents: number
    readonly additionalExposureKnown: boolean
    readonly chargeStatus: 'included-quota' | 'unknown' | 'paid-transition'
    readonly quotaStatus: 'available' | 'exhausted' | 'unknown'
    readonly quotaRemainingTokens: number
    readonly paidTransitionsAllowed: boolean
    readonly includesAlreadyPaidSubscriptionFee: boolean
    readonly apiEstimateIsInvoice: boolean
    readonly usageReconciled: boolean
    readonly evidence: EvidenceClaim
  }
  readonly attempts: readonly AttemptClaim[]
  /** Whole-route wall time, including gaps outside individual attempts. */
  readonly elapsedMinutesTotal: number
  readonly custody: {
    readonly coordinatorInstanceId: '01a12b4f-c8e9-70a4-811b-0cd7eb889457'
    readonly destinationRef: string
    readonly resultShape: 'bounded-plain-findings/v1'
    readonly maxFindings: number
    readonly maxResultBytes: number
    readonly subjectManifestDigest: string
    readonly executionIdentityRef: string
    readonly usageRef: string
    readonly startingIsolationRef: string
    readonly endingIsolationRef: string
    readonly evidence: EvidenceClaim
  }
}

export type ReasonCode =
  | 'SHAPE_REFUSED'
  | 'AUTHORITY_UNPROVEN'
  | 'PROVIDER_USE_PERMISSION_UNPROVEN'
  | 'DATA_SCOPE_REFUSED'
  | 'ACCOUNT_CONTROLS_CHANGED'
  | 'CAPABILITY_UNPROVEN'
  | 'INSTALLATION_UNPROVEN'
  | 'INCREMENTAL_CHARGE_BOUND_UNPROVEN'
  | 'QUOTA_EXHAUSTED'
  | 'BUDGET_EXHAUSTED'
  | 'PERMIT_REPLAY_REFUSED'
  | 'PACKET_MISMATCH_REFUSED'
  | 'EXECUTION_IDENTITY_UNPROVEN'
  | 'USAGE_UNCERTAIN'
  | 'BOUND_REFUSED'

export interface PolicyIssue {
  readonly code: ReasonCode
  /** Schema/policy locator only; never copy untrusted values into diagnostics. */
  readonly path: string
}

/** No admitted state, permit, receipt, invocation or authority issuer exists. */
export interface OfflineAssessment {
  readonly state: 'fixture-compatible' | 'held' | 'refused'
  readonly provenance: 'untrusted-offline-declarations'
  readonly mayInvokeProvider: false
  readonly runtimeStatus: 'held'
  readonly issues: readonly PolicyIssue[]
  readonly runtimeHolds: readonly ReasonCode[]
}
