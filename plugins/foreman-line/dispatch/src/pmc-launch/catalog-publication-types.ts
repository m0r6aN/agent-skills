import type { AcceptedCatalogSource } from '../../../routing-policy/src/catalog-eligibility-adapter.js'
export type Identity = Readonly<{ provider: 'openrouter'; id: string }>
export type RefreshCode =
  | 'INPUT_REFUSED'
  | 'CAPACITY_REFUSED'
  | 'TRANSPORT_REFUSED'
  | 'DEADLINE_EXCEEDED'
  | 'CANCELLED'
  | 'COMPLETENESS_UNPROVEN'
  | 'MATERIALIZATION_REFUSED'
  | 'PUBLICATION_CONFLICT'
  | 'INSTALLATION_REFUSED'
export type RefreshResult =
  | Readonly<{ kind: 'published'; handle: object; generation: number }>
  | Readonly<{
      kind: 'absent'
      handle: object
      generation: number
      requestedIdentities: readonly Identity[]
      absentIdentities: readonly Identity[]
    }>
  | Readonly<{ kind: 'refused'; code: RefreshCode }>
export type OperationRegistrationResult =
  | Readonly<{ ok: true; operation: object; cancellation: object }>
  | Readonly<{
      ok: false
      code: 'INPUT_REFUSED' | 'CAPACITY_REFUSED' | 'DEADLINE_EXCEEDED' | 'INSTALLATION_REFUSED'
    }>
export type CancelResult =
  | Readonly<{ ok: true; outcome: 'cancelled' | 'already-cancelled' | 'already-settled' }>
  | Readonly<{ ok: false; code: 'INPUT_REFUSED' | 'INSTALLATION_REFUSED' }>
export type ReadCode =
  | 'INPUT_REFUSED'
  | 'HANDLE_REFUSED'
  | 'GENERATION_REFUSED'
  | 'SCOPE_REFUSED'
  | 'IDENTITY_NOT_ABSENT'
  | 'CURRENT_ABSENCE'
  | 'EXPIRED'
  | 'SOURCE_REFUSED'
  | 'INSTALLATION_REFUSED'
export type PublicationProvenance = Readonly<{
  workflowId: string
  trustScopeId: string
  profile: 'openrouter-public-text-materialization/v1'
  endpoint: 'https://openrouter.ai/api/v1/models'
  domain: 'public-text-output'
  generation: number
  sourceSha256: string
  requestStartedAtUtc: string
  completeReceivedAtUtc: string
  validUntilUtc: string
}>
export type CatalogRead =
  | Readonly<{
      ok: true
      canonicalBytes: Uint8Array
      expectedSha256: string
      acceptedSource: AcceptedCatalogSource
      provenance: PublicationProvenance
    }>
  | Readonly<{ ok: false; code: ReadCode }>
export type AbsenceRead =
  | Readonly<{
      ok: true
      identity: Identity
      requestedIdentities: readonly Identity[]
      generation: number
      provenance: PublicationProvenance
    }>
  | Readonly<{ ok: false; code: ReadCode }>
export type ScopeRegistrationResultV1 =
  | Readonly<{ ok: true; scope: object }>
  | Readonly<{ ok: false; code: 'INPUT_REFUSED' | 'CAPACITY_REFUSED' | 'INSTALLATION_REFUSED' }>
export type CatalogPublicationOwnerV1 = Readonly<{
  domain: 'offline-fixture/v1'
  registerCatalogScopeV1: (input: unknown) => ScopeRegistrationResultV1
  registerRefreshOperationV1: (input: unknown) => OperationRegistrationResult
  requestCatalogRefreshV1: (input: unknown) => Promise<RefreshResult>
  cancelRefreshOperationV1: (input: unknown) => CancelResult
  acquirePublishedCatalogV1: (input: unknown) => CatalogRead
  verifyAbsenceV1: (input: unknown) => AbsenceRead
}>
export type OfflinePublicationInputV1 = Readonly<{
  domain: 'offline-fixture/v1'
  fixtureId: string
  workflowId: string
  generationId: string
  scopes: readonly Readonly<{
    scopeId: string
    trustScopeId: string
    requestedIdentities: readonly Identity[]
    policyExpiresAtUtc: string
  }>[]
}>
export type ClockReadingV1 = Readonly<{ utc: string; monoMs: number }>
export type FixedMetadataRequestV1 = Readonly<{
  method: 'GET'
  url: 'https://openrouter.ai/api/v1/models'
  headers: Readonly<{ Accept: 'application/json'; 'Accept-Encoding': 'identity' }>
  agent: false
  rejectUnauthorized: true
  maxHeaderSize: 16384
}>
export type MetadataResponseHeadV1 = Readonly<{ statusCode: number; rawHeaders: readonly string[] }>
export type MetadataEventsV1 = Readonly<{
  socketAssigned: () => void
  socketConnected: () => void
  response: (head: unknown) => void
  data: (chunk: unknown) => void
  responseEnded: () => void
  responseClosed: () => void
  requestClosed: () => void
  socketClosed: () => void
  error: () => void
}>
export type MetadataRequestControlV1 = Readonly<{ end: () => unknown; destroy: () => unknown }>
export type OfflineMetadataDriverV1 = Readonly<{
  open: (request: FixedMetadataRequestV1, events: MetadataEventsV1) => unknown
}>
export type OfflinePublicationRuntimeV1 = Readonly<{
  readClock: () => unknown
  scheduleWake: (delayMs: number, wake: () => void) => unknown
  clearWake: (timer: object) => unknown
  requestDriver: OfflineMetadataDriverV1
}>
export type FixedMetadataTransportV1 = Readonly<{
  readMetadataV1: (input: { deadlineMonoMs: number; signal: AbortSignal }) => Promise<unknown>
}>
