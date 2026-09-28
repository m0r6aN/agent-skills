import type { IntentAuthority, OwnerIdentity } from './intent-custody-types.js'

export type CodeV1 =
  | 'INPUT_REFUSED'
  | 'BOUNDS_REFUSED'
  | 'PATH_REFUSED'
  | 'PREREQUISITE_UNAVAILABLE'
  | 'AUTHORITY_REFUSED'
  | 'B1_REFUSED'
  | 'ALREADY_ADMITTED'
  | 'STORAGE_INVALID'
  | 'BUSY'
  | 'IO_FAILED'
  | 'COMMIT_UNCERTAIN'
  | 'SESSION_REFUSED'

export type ResultV1<T> = Readonly<{ ok: true; value: T }> | Readonly<{ ok: false; code: CodeV1 }>

export type OfflineInputV1 = Readonly<{
  domain: 'offline-fixture/v1'
  fixtureId: string
  root: string
  workflowId: string
  generationId: string
  identity: OwnerIdentity
  intents: readonly Readonly<{
    authority: IntentAuthority
    payloadJson: string
  }>[]
}>

export type EpisodeV1 = Readonly<{
  intentRef: string
  businessAuthorityRef: string
  businessAuthorityDigest: string
  episodeId: string
  requestIds: readonly [string, string]
  originalRequestDigest: string
  policyDigest: string
  configDigest: string
}>

export type RegistrationV1 = Readonly<{
  version: 'hro-recovery-admission/v1'
  domain: 'offline-fixture/v1'
  fixtureId: string
  root: string
  workflowId: string
  generationId: string
  identity: OwnerIdentity
  episodes: readonly EpisodeV1[]
}>

export type AdmissionV1 = Readonly<{
  domain: 'offline-fixture/v1'
  registration: RegistrationV1
  claimBrokerV1: () => ResultV1<object>
}>
