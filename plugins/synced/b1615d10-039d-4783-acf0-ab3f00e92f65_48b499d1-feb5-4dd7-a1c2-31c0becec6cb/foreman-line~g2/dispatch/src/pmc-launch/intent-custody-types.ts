import type {
  Claim,
  Digest,
  EvidenceRef,
  Id,
  PmcProvider,
  PmcResolverContextV1,
  PmcRouteRequestV1,
  Text,
  UInt,
  Utc,
} from '../../../routing-policy/src/index.js'
import type { AttemptV1, BudgetScopeV1 } from './ledger.js'

export type OwnerCode =
  | 'INPUT_REFUSED'
  | 'BOUNDS_REFUSED'
  | 'AUTHORITY_REFUSED'
  | 'PATH_REFUSED'
  | 'ALREADY_EXISTS'
  | 'STORAGE_MISSING'
  | 'STORAGE_INVALID'
  | 'IDENTITY_MISMATCH'
  | 'SETTINGS_REFUSED'
  | 'CAPACITY_REFUSED'
  | 'BUSY'
  | 'IO_FAILED'
  | 'COMMIT_UNCERTAIN'
  | 'INTENT_REFUSED'
  | 'STATE_REFUSED'
  | 'PROOF_REFUSED'
export type Result<T> = Readonly<{ ok: true; value: T }> | Readonly<{ ok: false; code: OwnerCode }>
export type OwnerIdentity = Readonly<{
  storeId: Id
  ledgerId: Id
  epoch: Id
  initializationAuthorityDigest: Digest
  schemaVersion: 1
}>
export type IntentAuthority = Readonly<{
  intentRef: Id
  businessAuthorityRef: Id
  businessAuthorityDigest: Digest
  originId: Id
  routeTemplate: Omit<PmcRouteRequestV1, 'episodeId' | 'requestId' | 'requestDigest' | 'attempt'>
  policyDigest: Digest
  configDigest: Digest
  scope: BudgetScopeV1
  authorityObservedAtUtc: Utc
  authorityExpiresAtUtc: Utc
  fallbackAllowed: boolean
}>
export type IdentityProjection = Readonly<{
  intentRef: Id
  episodeId: Id
  requestIds: readonly [Id, Id]
}>
export type Selection = Readonly<{
  decisionDigest: Digest
  wireDigest: Digest
  bindingId: Text
  provider: PmcProvider
  matrixRole: 'primary' | 'fallback'
  primaryQuality: Claim<number>
  scopeId: Id
  costValueDigest: Digest
  maximumMicroUsd: UInt
}>
export type ProofRecord = Readonly<{ proofRef: Id; proofDigest: Digest; ledger: AttemptV1 | null }>
export type HoldReason = 'proof-refused' | 'reconciliation-incomplete' | 'controller-failure'
export type Slot =
  | Readonly<{ state: 'unused' }>
  | Readonly<{ state: 'pending'; requestDigest: Digest; selected: Selection | null }>
  | Readonly<{
      state: 'held'
      requestDigest: Digest
      selected: Selection | null
      reason: HoldReason
    }>
  | Readonly<{ state: 'closed-refused'; requestDigest: Digest; proof: ProofRecord }>
  | Readonly<{
      state: 'terminal-no-send' | 'terminal-failed-settled' | 'succeeded' | 'uncertain'
      requestDigest: Digest
      selected: Selection
      proof: ProofRecord
    }>
export type RetainedState = Readonly<{ slots: readonly [Slot, Slot] }>
export type BeginProposal = Readonly<{
  intentRef: Id
  request: PmcRouteRequestV1
  computedRequestDigest: Digest
}>
export type IntentOwnerV1 = Readonly<{
  begin: (
    proposal: unknown,
    originCapability: object,
  ) => Result<{
    claim: object
    request: PmcRouteRequestV1
    episode: PmcResolverContextV1['episode']
    budgetEvidence: EvidenceRef
    scope: BudgetScopeV1
  }>
  recordDecision: (claim: object, selectionCapability: object) => Result<null>
  finish: (claim: object, completionCapability: object) => Result<null>
}>
export type OwnerPorts = Readonly<{
  clock: () => unknown
  authenticateOrigin: (
    authority: IntentAuthority,
    retainedState: RetainedState,
    proposal: BeginProposal,
    capability: object,
  ) => unknown
  authenticateSelection: (
    authority: IntentAuthority,
    requestDigest: Digest,
    capability: object,
  ) => unknown
  authenticateCompletion: (authority: IntentAuthority, slot: Slot, capability: object) => unknown
}>
