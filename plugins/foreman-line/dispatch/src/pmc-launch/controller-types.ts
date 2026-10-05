import type { PmcRouteDecisionV1, PmcRouteRequestV1 } from '../../../routing-policy/src/index.js'
import type { IntentOwnerV1, OwnerPorts } from './intent-custody-types.js'
import type { AttemptV1, LocalPmcLedger } from './ledger.js'

export type LaunchInputV1 = Readonly<{
  version: 'pmc-launch/v1'
  intentRef: string
  route: PmcRouteRequestV1
  payloadJson: string
  override: null | 'requested'
}>
export type LaunchReceiptV1 = Readonly<{
  version: 'pmc-launch-receipt/v1'
  authority: 'audit-only'
  requestId: string
  requestDigest: string
  decisionDigest: string
  wireDigest: string
  ledgerId: string
  epoch: string
  scopeId: string
  maximumMicroUsd: number
  disposition: 'terminal-no-send' | 'terminal-failed-settled' | 'succeeded' | 'uncertain'
}>
export type ControllerCode =
  | 'INPUT_REFUSED'
  | 'BOUNDS_REFUSED'
  | 'BREAK_GLASS_REFUSED'
  | 'LANE_DISABLED_REFUSED'
  | 'INTENT_REFUSED'
  | 'NONPUBLIC_REFUSED'
  | 'VERSION_REFUSED'
  | 'PINNED_TRANSPORT_REFUSED'
  | 'INSTALLATION_REFUSED'
  | 'EPISODE_REFUSED'
  | 'EVIDENCE_REFUSED'
  | 'CLOCK_REFUSED'
  | 'CATALOG_REFUSED'
  | 'MONEY_REFUSED'
  | 'RESOLVER_REFUSED'
  | 'WIRE_REFUSED'
  | 'LEDGER_REFUSED'
  | 'PERMIT_REFUSED'
  | 'REVALIDATION_REFUSED'
  | 'SEND_UNCERTAIN'
  | 'RECONCILIATION_REQUIRED'
export type LaunchResultV1 =
  | Readonly<{ ok: true; receipt: LaunchReceiptV1 }>
  | Readonly<{ ok: false; code: ControllerCode; receipt: LaunchReceiptV1 | null }>
export type PmcLaunchControllerV1 = Readonly<{
  launch: (request: unknown) => Promise<LaunchResultV1>
}>
export type RevalidationV1 = Readonly<{
  requestDigest: string
  decisionDigest: string
  wireDigest: string
  policyDigest: string
  configDigest: string
  runtimeDigest: string
  catalogDigest: string
  evidenceDigest: string
  expiresAtUtc: string
}>
export type WireV1 = Readonly<{
  version: 'pmc-wire/v1'
  requestDigest: string
  decisionDigest: string
  method: 'POST'
  operationUrl: string
  protocol: 'openai-completions'
  provider: 'openrouter'
  bindingId: string
  providerModelId: string
  piHostModelId: string
  dataClass: 'public'
  thinkingLevel: PmcRouteRequestV1['requirements']['thinkingLevel']
  wireEffort: string | null
  data_collection: 'allow' | 'deny'
  zdr: boolean
  toolUse: boolean
  structuredOutput: boolean
  maximumInputTokens: number
  maximumOutputTokens: number
  body: string
  bodyDigest: string
  headers: Readonly<{ 'content-type': 'application/json'; accept: 'text/event-stream' }>
  boundProof: object
}>
export type TerminalPortV1 = Readonly<{
  prepare: (
    request: PmcRouteRequestV1,
    decision: PmcRouteDecisionV1,
    payloadJson: string,
  ) => Promise<unknown>
  verify: (wire: WireV1, claims: RevalidationV1) => unknown
  send: (wire: WireV1, consumed: AttemptV1) => Promise<unknown>
}>
export type InstallationPortsV1 = Readonly<{
  clock: () => unknown
  owner: IntentOwnerV1
  originCapability: object
  acquire: (request: PmcRouteRequestV1) => unknown
  revalidate: (claims: RevalidationV1) => unknown
  ledger: LocalPmcLedger
  transport: TerminalPortV1
}>
export type TransportCode =
  | 'PAYLOAD_REFUSED'
  | 'PROFILE_REFUSED'
  | 'PI_REFUSED'
  | 'HEADERS_REFUSED'
  | 'BOUND_REFUSED'
  | 'HOOK_REFUSED'
  | 'ABORTED'
  | 'CREDENTIAL_REFUSED'
  | 'HTTP_UNCERTAIN'
  | 'STREAM_UNCERTAIN'
  | 'USAGE_UNKNOWN'
  | 'COST_PRECISION_UNKNOWN'
  | 'PROOF_REFUSED'
export type Charge =
  | Readonly<{ kind: 'unknown'; reason: 'missing' | 'malformed' | 'precision' | 'incomplete' }>
  | Readonly<{ kind: 'known'; actualMicroUsd: number }>
export type Observation =
  | Readonly<{ kind: 'no-send'; code: TransportCode }>
  | Readonly<{ kind: 'response'; semantic: 'stop' | 'length' | 'failed'; charge: Charge }>
  | Readonly<{ kind: 'uncertain'; code: TransportCode }>
export type ControllerObservationContextV1 = Readonly<{
  request: LaunchInputV1
  decision: Extract<PmcRouteDecisionV1, { ok: true }>
  wire: WireV1
  consumed: AttemptV1
}>
export type ControllerObservationPortsV1 = Readonly<{
  observe: (proof: object, invocation: object, current: ControllerObservationContextV1) => unknown
}>
export type ControllerBootstrapV1 = Readonly<{
  authenticateSelection: OwnerPorts['authenticateSelection']
  authenticateCompletion: OwnerPorts['authenticateCompletion']
  bind: (
    ports: unknown,
    observations: unknown,
  ) =>
    | Readonly<{ ok: true; controller: PmcLaunchControllerV1 }>
    | Readonly<{ ok: false; code: 'INSTALLATION_REFUSED' }>
}>
