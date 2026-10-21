import { ROLE_IDS, type RoleId } from '../../../../role-authority/src/roles.js'

/** Pure wire contracts. Every parsed value remains unverified; no effect capability exists here. */
export const CONTRACT_VERSION = 'pantheon/v1' as const
export const WIRE_VERSION = 'pantheon-wire/v1' as const
export const LIMITS = Object.freeze({ frameBytes: 65536, depth: 16, nodes: 8192, list: 256 })
export const REFUSAL_CODES = [
  'INVALID_SHAPE',
  'LIMIT_EXCEEDED',
  'INVALID_PATH',
  'UNKNOWN_OPERATION',
  'MISMATCH',
  'UNVERIFIED',
  'INCOMPLETE_REVIEW',
  'INDEPENDENCE',
  'MALFORMED_JSON',
] as const
export type RefusalCode = (typeof REFUSAL_CODES)[number]
export const RESPONSE_DENIAL_CODES = [
  ...REFUSAL_CODES,
  'ADMISSION_UNAVAILABLE',
  'REVOKED',
  'EXPIRED',
  'STALE_EPOCH',
  'BUDGET_EXCEEDED',
  'RUNTIME_UNAVAILABLE',
  'IDENTITY_UNAUTHENTICATED',
  'SCOPE_DENIED',
  'EVIDENCE_UNVERIFIED',
  'UNKNOWN_DELIVERY_HELD',
] as const
export type ResponseDenialCode = (typeof RESPONSE_DENIAL_CODES)[number]
export type RecoveryOwner = 'P02' | 'P03' | 'P04' | 'P05' | 'P06' | 'P08'
export type ValidationResult<T> =
  | Readonly<{ status: 'structurally-valid'; trust: 'unverified'; value: T }>
  | Readonly<{ status: 'refused'; code: RefusalCode; field: string }>
type Data = Record<string, unknown>
type Reader<T> = (value: unknown, field: string) => T
class Refusal extends Error {
  constructor(
    readonly code: RefusalCode,
    readonly field: string,
  ) {
    super(code)
  }
}
function deny(code: RefusalCode, field: string): never {
  throw new Refusal(code, field)
}
function result<T>(fn: () => T): ValidationResult<T> {
  try {
    return Object.freeze({ status: 'structurally-valid', trust: 'unverified', value: fn() })
  } catch (error) {
    return Object.freeze({
      status: 'refused',
      code: error instanceof Refusal ? error.code : 'INVALID_SHAPE',
      field: error instanceof Refusal ? error.field : '$',
    })
  }
}
/** Copy only bounded ordinary data; never invoke input getters or retain mutable caller data. */
function capture(value: unknown): unknown {
  let nodes = 0
  let units = 0
  const active = new Set<object>()
  function copy(v: unknown, depth: number): unknown {
    if (++nodes > LIMITS.nodes || depth > LIMITS.depth) deny('LIMIT_EXCEEDED', '$')
    if (typeof v === 'string') {
      units += v.length
      if (units > LIMITS.frameBytes) deny('LIMIT_EXCEEDED', '$')
      for (const character of v) {
        const code = character.charCodeAt(0)
        if (character.length === 1 && code >= 0xd800 && code <= 0xdfff) deny('INVALID_SHAPE', '$')
      }
      return v
    }
    if (v === null || typeof v === 'boolean' || (typeof v === 'number' && Number.isFinite(v)))
      return v
    if (typeof v !== 'object' || active.has(v)) deny('INVALID_SHAPE', '$')
    const array = Array.isArray(v)
    if (Object.getPrototypeOf(v) !== (array ? Array.prototype : Object.prototype))
      deny('INVALID_SHAPE', '$')
    const descriptors = Object.getOwnPropertyDescriptors(v)
    const keys = Reflect.ownKeys(descriptors)
    if (keys.length + nodes > LIMITS.nodes) deny('LIMIT_EXCEEDED', '$')
    active.add(v)
    const out: Data = {}
    for (const key of keys) {
      if (array && key === 'length') continue
      if (typeof key !== 'string' || ['__proto__', 'constructor', 'prototype'].includes(key))
        deny('INVALID_SHAPE', '$')
      const d = descriptors[key]
      if (!d || !('value' in d) || !d.enumerable) deny('INVALID_SHAPE', key)
      units += key.length
      if (units > LIMITS.frameBytes) deny('LIMIT_EXCEEDED', '$')
      Object.defineProperty(out, key, { value: copy(d.value, depth + 1), enumerable: true })
    }
    active.delete(v)
    if (!array) return Object.freeze(out)
    const length = descriptors.length?.value
    if (keys.length !== length + 1 || Object.keys(out).some((k, i) => k !== String(i)))
      deny('INVALID_SHAPE', '$')
    return Object.freeze(Object.values(out))
  }
  return copy(value, 0)
}
function object(v: unknown, field: string, keys: readonly string[]): Data {
  if (!v || typeof v !== 'object' || Array.isArray(v)) deny('INVALID_SHAPE', field)
  const r = v as Data
  if (Object.keys(r).length !== keys.length || keys.some((key) => !Object.hasOwn(r, key)))
    deny('INVALID_SHAPE', field)
  return r
}
function text(v: unknown, field: string, max = 4096): string {
  if (
    typeof v !== 'string' ||
    !v.trim() ||
    v !== v.trim() ||
    [...v].some((c) => c.charCodeAt(0) < 32 && !['\t', '\n', '\r'].includes(c))
  )
    deny('INVALID_SHAPE', field)
  if (v.length > max) deny('LIMIT_EXCEEDED', field)
  return v
}
const id: Reader<string> = (v, f) => {
  const s = text(v, f, 128)
  if (!/^[A-Za-z0-9][A-Za-z0-9._:/-]*$/.test(s)) deny('INVALID_SHAPE', f)
  return s
}
const digest: Reader<string> = (v, f) => {
  const s = text(v, f, 64)
  if (!/^[a-f0-9]{64}$/.test(s)) deny('INVALID_SHAPE', f)
  return s
}
const runtimeHash: Reader<string> = (v, f) => {
  const s = text(v, f, 71)
  if (!/^sha256:[a-f0-9]{64}$/.test(s)) deny('INVALID_SHAPE', f)
  return s
}
const head: Reader<string> = (v, f) => {
  const s = text(v, f, 40)
  if (!/^[a-f0-9]{40}$/.test(s)) deny('INVALID_SHAPE', f)
  return s
}
const uint: Reader<number> = (v, f) => {
  if (typeof v !== 'number' || !Number.isSafeInteger(v) || v < 0 || Object.is(v, -0))
    deny('INVALID_SHAPE', f)
  return v
}
const utc: Reader<string> = (v, f) => {
  const s = text(v, f, 24)
  if (
    !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(s) ||
    !Number.isFinite(Date.parse(s)) ||
    new Date(s).toISOString() !== s
  )
    deny('INVALID_SHAPE', f)
  return s
}
function literal<T extends string | number>(v: unknown, expected: T, f: string): T {
  if (v !== expected) deny('INVALID_SHAPE', f)
  return expected
}
function choice<T extends string>(v: unknown, choices: readonly T[], f: string): T {
  if (typeof v !== 'string' || !choices.includes(v as T)) deny('INVALID_SHAPE', f)
  return v as T
}
function list<T>(v: unknown, f: string, read: Reader<T>, min = 0): readonly T[] {
  if (!Array.isArray(v) || v.length < min) deny('INVALID_SHAPE', f)
  if (v.length > LIMITS.list) deny('LIMIT_EXCEEDED', f)
  return Object.freeze(v.map((item, i) => read(item, `${f}[${i}]`)))
}
function strings(v: unknown, f: string, read: Reader<string> = id, min = 0): readonly string[] {
  const values = list(v, f, read, min)
  if (new Set(values).size !== values.length) deny('INVALID_SHAPE', f)
  return values
}
function nullable<T>(v: unknown, f: string, read: Reader<T>): T | null {
  return v === null ? null : read(v, f)
}
const path: Reader<string> = (v, f) => {
  const s = text(v, f, 512)
  if (
    !/^[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)*$/.test(s) ||
    s
      .split('/')
      .some(
        (p) =>
          p === '.' ||
          p === '..' ||
          p.toLowerCase() === '.git' ||
          p.endsWith('.') ||
          /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(?:\.|$)/i.test(p),
      )
  )
    deny('INVALID_PATH', f)
  return s
}
export type Identity = Readonly<{
  sessionId: string
  parentSessionId: string
  actorId: string
  hostId: string
  hostIdentityHash: string
  goalId: string
  parcelId: string
  jobId: string
  attemptId: string
}>
function identity(v: unknown, f: string): Identity {
  const r = object(v, f, [
    'sessionId',
    'parentSessionId',
    'actorId',
    'hostId',
    'hostIdentityHash',
    'goalId',
    'parcelId',
    'jobId',
    'attemptId',
  ])
  return Object.freeze({
    sessionId: id(r.sessionId, `${f}.sessionId`),
    parentSessionId: id(r.parentSessionId, `${f}.parentSessionId`),
    actorId: id(r.actorId, `${f}.actorId`),
    hostId: id(r.hostId, `${f}.hostId`),
    hostIdentityHash: digest(r.hostIdentityHash, `${f}.hostIdentityHash`),
    goalId: literal(r.goalId, 'pantheon-incarnation-v0', `${f}.goalId`),
    parcelId: id(r.parcelId, `${f}.parcelId`),
    jobId: id(r.jobId, `${f}.jobId`),
    attemptId: id(r.attemptId, `${f}.attemptId`),
  })
}
export type ArtifactReference = Readonly<{
  repository: string
  path: string
  sourceHead: string
  sha256: string
}>
function artifact(v: unknown, f: string): ArtifactReference {
  const r = object(v, f, ['repository', 'path', 'sourceHead', 'sha256'])
  return Object.freeze({
    repository: id(r.repository, `${f}.repository`),
    path: path(r.path, `${f}.path`),
    sourceHead: head(r.sourceHead, `${f}.sourceHead`),
    sha256: digest(r.sha256, `${f}.sha256`),
  })
}
export type RuntimeAuthorityReference = Readonly<{
  state: 'unverified'
  grantId: string
  grantHash: string
  permissionEventReceiptId: string
  bindingHash: string
  decisionId: string
  decisionHash: string
  permissionId: string
  permissionHash: string
  effectDescriptorHash: string
  delegationChainId: string | null
}>
function authority(v: unknown, f: string): RuntimeAuthorityReference {
  const r = object(v, f, [
    'state',
    'grantId',
    'grantHash',
    'permissionEventReceiptId',
    'bindingHash',
    'decisionId',
    'decisionHash',
    'permissionId',
    'permissionHash',
    'effectDescriptorHash',
    'delegationChainId',
  ])
  return Object.freeze({
    state: literal(r.state, 'unverified', `${f}.state`),
    grantId: id(r.grantId, `${f}.grantId`),
    grantHash: digest(r.grantHash, `${f}.grantHash`),
    permissionEventReceiptId: id(r.permissionEventReceiptId, `${f}.permissionEventReceiptId`),
    bindingHash: digest(r.bindingHash, `${f}.bindingHash`),
    decisionId: id(r.decisionId, `${f}.decisionId`),
    decisionHash: digest(r.decisionHash, `${f}.decisionHash`),
    permissionId: id(r.permissionId, `${f}.permissionId`),
    permissionHash: runtimeHash(r.permissionHash, `${f}.permissionHash`),
    effectDescriptorHash: runtimeHash(r.effectDescriptorHash, `${f}.effectDescriptorHash`),
    delegationChainId: nullable(r.delegationChainId, `${f}.delegationChainId`, id),
  })
}
/** P02 resolves/authenticates identity, signatures, expiry and scope; P03 rechecks all at commit. */
export const AUTHORITY_OBLIGATIONS = Object.freeze({
  P02: 'Resolve stored grant/binding/decision; verify host child identity, signatures, scope, expiry and Human-oversight policy. JSON references never authorize.',
  P03: 'One typed BEGIN IMMEDIATE and connection-local PermissionSpendLedger consumption: current custody/epoch, durable revocation, request/capability binding, reservation, cumulative parent caps and occupancy. Return satisfied/non-null Spend only after commit; replay never acts.',
  P04: 'Only committed fresh Runtime begin reaches a matching effect adapter; capture delivery, usage, cleanup and exact source/artifact provenance.',
  P05: 'Authenticate durable completion and exact-head review/merge evidence; independently reproduce any closed formatting projection. Never trust model provider IDs.',
})
export type UsageCounters = Readonly<{ inputTokens: number; combinedOutputTokens: number }>
export type MoneyEvidence = Readonly<{
  currency: 'USD'
  scale: 'micro'
  estimate: number | null
  reservation: number | null
  providerCounters: UsageCounters | null
  localEstimate: number | null
  provisionalExposure: number | null
  reconciledBill: number | null
}>
function money(v: unknown, f: string): MoneyEvidence {
  const r = object(v, f, [
    'currency',
    'scale',
    'estimate',
    'reservation',
    'providerCounters',
    'localEstimate',
    'provisionalExposure',
    'reconciledBill',
  ])
  const counters: Reader<UsageCounters> = (value, field) => {
    const c = object(value, field, ['inputTokens', 'combinedOutputTokens'])
    return Object.freeze({
      inputTokens: uint(c.inputTokens, `${field}.inputTokens`),
      combinedOutputTokens: uint(c.combinedOutputTokens, `${field}.combinedOutputTokens`),
    })
  }
  return Object.freeze({
    currency: literal(r.currency, 'USD', `${f}.currency`),
    scale: literal(r.scale, 'micro', `${f}.scale`),
    estimate: nullable(r.estimate, `${f}.estimate`, uint),
    reservation: nullable(r.reservation, `${f}.reservation`, uint),
    providerCounters: nullable(r.providerCounters, `${f}.providerCounters`, counters),
    localEstimate: nullable(r.localEstimate, `${f}.localEstimate`, uint),
    provisionalExposure: nullable(r.provisionalExposure, `${f}.provisionalExposure`, uint),
    reconciledBill: nullable(r.reconciledBill, `${f}.reconciledBill`, uint),
  })
}
export function parseMoneyEvidence(v: unknown): ValidationResult<MoneyEvidence> {
  return result(() => money(capture(v), '$'))
}

export type DispatchIntent = Readonly<{
  version: typeof CONTRACT_VERSION
  identity: Identity
  mandateHash: string
  specHash: string
  activePlanHash: string
  sourceHash: string
  artifactHash: string
  configHash: string
  sourceHead: string
  baseHead: string
  worktree: string
  branch: string
  allowedFiles: readonly string[]
  role: RoleId
  modelProfile: string
  requestedTools: readonly string[]
  requestedNetwork: readonly string[]
  issuedAt: string
  deadline: string
  fencingEpoch: number
  operation: Operation
  authority: RuntimeAuthorityReference
  money: MoneyEvidence
}>
function dispatch(v: unknown, f: string): DispatchIntent {
  const r = object(v, f, [
    'version',
    'identity',
    'mandateHash',
    'specHash',
    'activePlanHash',
    'sourceHash',
    'artifactHash',
    'configHash',
    'sourceHead',
    'baseHead',
    'worktree',
    'branch',
    'allowedFiles',
    'role',
    'modelProfile',
    'requestedTools',
    'requestedNetwork',
    'issuedAt',
    'deadline',
    'fencingEpoch',
    'operation',
    'authority',
    'money',
  ])
  const issuedAt = utc(r.issuedAt, `${f}.issuedAt`)
  const deadline = utc(r.deadline, `${f}.deadline`)
  if (deadline <= issuedAt) deny('INVALID_SHAPE', `${f}.deadline`)
  const allowedFiles = strings(r.allowedFiles, `${f}.allowedFiles`, path, 1)
  if (new Set(allowedFiles.map((p) => p.toLowerCase())).size !== allowedFiles.length)
    deny('INVALID_PATH', `${f}.allowedFiles`)
  return Object.freeze({
    version: literal(r.version, CONTRACT_VERSION, `${f}.version`),
    identity: identity(r.identity, `${f}.identity`),
    mandateHash: digest(r.mandateHash, `${f}.mandateHash`),
    specHash: digest(r.specHash, `${f}.specHash`),
    activePlanHash: digest(r.activePlanHash, `${f}.activePlanHash`),
    sourceHash: digest(r.sourceHash, `${f}.sourceHash`),
    artifactHash: digest(r.artifactHash, `${f}.artifactHash`),
    configHash: digest(r.configHash, `${f}.configHash`),
    sourceHead: head(r.sourceHead, `${f}.sourceHead`),
    baseHead: head(r.baseHead, `${f}.baseHead`),
    worktree: text(r.worktree, `${f}.worktree`, 512),
    branch: text(r.branch, `${f}.branch`, 256),
    allowedFiles,
    role: choice(r.role, ROLE_IDS, `${f}.role`),
    modelProfile: id(r.modelProfile, `${f}.modelProfile`),
    requestedTools: strings(r.requestedTools, `${f}.requestedTools`),
    requestedNetwork: strings(r.requestedNetwork, `${f}.requestedNetwork`),
    issuedAt,
    deadline,
    fencingEpoch: uint(r.fencingEpoch, `${f}.fencingEpoch`),
    operation: operation(r.operation, `${f}.operation`),
    authority: authority(r.authority, `${f}.authority`),
    money: money(r.money, `${f}.money`),
  })
}
export function parseDispatchIntent(v: unknown): ValidationResult<DispatchIntent> {
  return result(() => dispatch(capture(v), '$'))
}
export type Step0Restatement = Readonly<{ descriptor: DispatchIntent; flags: readonly string[] }>
function step0(v: unknown, f: string): Step0Restatement {
  const r = object(v, f, ['descriptor', 'flags'])
  return Object.freeze({
    descriptor: dispatch(r.descriptor, `${f}.descriptor`),
    flags: strings(r.flags, `${f}.flags`, text),
  })
}
export function parseStep0Restatement(v: unknown): ValidationResult<Step0Restatement> {
  return result(() => step0(capture(v), '$'))
}
export type Mismatch = Readonly<{ field: string; reason: 'different' | 'unresolved-flag' }>
function differences(a: unknown, b: unknown, field: string): Mismatch[] {
  if (a === b) return []
  if (
    a &&
    b &&
    typeof a === 'object' &&
    typeof b === 'object' &&
    Array.isArray(a) === Array.isArray(b)
  ) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)])
    return [...keys].flatMap((k) => differences((a as Data)[k], (b as Data)[k], `${field}.${k}`))
  }
  return [{ field, reason: 'different' }]
}
export function compareStep0(
  expected: unknown,
  actual: unknown,
): ValidationResult<Readonly<{ match: 'exact-match' | 'hold'; mismatches: readonly Mismatch[] }>> {
  return result(() => {
    const e = dispatch(capture(expected), 'expected')
    const a = step0(capture(actual), 'actual')
    const mismatches = differences(e, a.descriptor, 'descriptor')
    a.flags.forEach((_, i) => {
      mismatches.push({ field: `flags.${i}`, reason: 'unresolved-flag' })
    })
    return Object.freeze({
      match: mismatches.length ? 'hold' : 'exact-match',
      mismatches: Object.freeze(mismatches.map((m) => Object.freeze(m))),
    })
  })
}

export type OperationBinding = Readonly<{
  consumer: string
  effect: string | null
  prerequisite: string
  exactBinding: string
  requiredTerminal?: 'ModelResult' | 'PatchStaged'
}>
const op = (
  consumer: string,
  effect: string | null,
  prerequisite: string,
  exactBinding: string,
  requiredTerminal?: 'ModelResult' | 'PatchStaged',
): OperationBinding =>
  Object.freeze({ consumer, effect, prerequisite, exactBinding, requiredTerminal })
/** Declarative requirements only. No entry asserts that the consumer is currently enabled. */
export const OPERATIONS = Object.freeze({
  'model.infer': op(
    'P04',
    'pantheon.v1.model.infer',
    'P02/P03 fresh committed admission; P03 additive ModelResult terminal',
    'request hash, provider/account/profile, token and micro-USD bounds',
    'ModelResult',
  ),
  'patch.stage': op(
    'P04',
    'pantheon.v1.patch.stage',
    'P02/P03 fresh committed admission; P03 additive PatchStaged terminal',
    'patch artifact hash, exact paths and isolated source/base ref; never merge',
    'PatchStaged',
  ),
  'worker.execute': op(
    'P04',
    'pantheon.v1.worker.execute',
    'P03 additive successful-worker terminal',
    'host/image/config/source/spec, role/tools/network, deadline and epoch',
  ),
  'worker.verify': op(
    'P04/P05',
    'pantheon.v1.worker.verify',
    'P03 additive verification terminal',
    'independent verifier identity, exact source/fixtures/command/image/config',
  ),
  'repository.prepare': op(
    'P04',
    'pantheon.v1.repository.prepare',
    'P03 additive Git effect/terminal',
    'repository, expected base/head, owned worktree and bounded offline inputs',
  ),
  'repository.push': op(
    'P04/P05',
    'pantheon.v1.repository.push',
    'P03 additive Git effect/terminal',
    'repository, actor, exact source head and destination ref; no force/bypass',
  ),
  'repository.pr': op(
    'P05',
    'pantheon.v1.repository.pr',
    'P03 additive Git effect/terminal',
    'repository, exact head/base, visibility and bounded PR artifact',
  ),
  'repository.merge': op(
    'P05',
    'pantheon.v1.repository.merge',
    'P03 additive exact-head merge terminal',
    'exact head/base, effective server rules/checks and two whole-unit reviews',
  ),
  'memory.project': op(
    'P06',
    'pantheon.v1.memory.project',
    'P03 additive Cortex effect/terminal',
    'tenant/role/scope, immutable receipt and durable outbox identity',
  ),
  'memory.recall': op(
    'P06',
    'pantheon.v1.memory.recall',
    'P03 additive Cortex effect/terminal',
    'tenant/role/scope, bounded query and response artifact',
  ),
  'status.read': op(
    'P02/P05',
    null,
    'authenticated bounded read; no work admission',
    'caller/goal/job scope and durable event cursor',
  ),
  'artifact.read': op(
    'P02/P05',
    null,
    'authenticated bounded read; no work admission',
    'caller/goal scope, exact artifact path/hash and length',
  ),
  'worker.remote': op(
    'P08',
    'pantheon.v1.worker.remote',
    'reserved only; P08 admission required',
    'approved B identity/fingerprint, image/source/config and deadline; no secrets',
  ),
})
export type Operation = keyof typeof OPERATIONS
/** Trusted host control input, deliberately absent from the caller-facing operation parser. */
export type CustodyControlAction = Readonly<{
  kind: 'startup' | 'succession'
  profile: 'pantheon-coordinator-v1'
  identity: Identity
  expectedEpoch: number
  previousCustodyRecord: ArtifactReference
}>
function operation(v: unknown, f: string): Operation {
  if (typeof v !== 'string' || !Object.hasOwn(OPERATIONS, v)) deny('UNKNOWN_OPERATION', f)
  return v as Operation
}
export function parseOperation(v: unknown): ValidationResult<Operation> {
  return result(() => operation(v, '$'))
}

export type ReviewSubject = Readonly<{
  unit: string
  specHash: string
  activePlanHash: string
  trustedTestsHash: string
  artifacts: readonly ArtifactReference[]
}>
function subject(v: unknown, f: string): ReviewSubject {
  const r = object(v, f, ['unit', 'specHash', 'activePlanHash', 'trustedTestsHash', 'artifacts'])
  const artifacts = list(r.artifacts, `${f}.artifacts`, artifact, 1)
  if (new Set(artifacts.map((a) => `${a.repository}/${a.path}`)).size !== artifacts.length)
    deny('INVALID_SHAPE', `${f}.artifacts`)
  return Object.freeze({
    unit: id(r.unit, `${f}.unit`),
    specHash: digest(r.specHash, `${f}.specHash`),
    activePlanHash: digest(r.activePlanHash, `${f}.activePlanHash`),
    trustedTestsHash: digest(r.trustedTestsHash, `${f}.trustedTestsHash`),
    artifacts,
  })
}
export type EvidenceProvenance = Readonly<{
  state: 'unverified'
  kind: 'original-capture' | 'formatting-projection'
  identity: Identity
  requestHash: string
  subject: ReviewSubject
  original: ArtifactReference
  result: ArtifactReference
  capture: ArtifactReference
  verifierRecord: ArtifactReference | null
  providerRequestId: string | null
}>
function provenance(v: unknown, f: string): EvidenceProvenance {
  const r = object(v, f, [
    'state',
    'kind',
    'identity',
    'requestHash',
    'subject',
    'original',
    'result',
    'capture',
    'verifierRecord',
    'providerRequestId',
  ])
  const kind = choice(r.kind, ['original-capture', 'formatting-projection'], `${f}.kind`)
  const original = artifact(r.original, `${f}.original`)
  const derived = artifact(r.result, `${f}.result`)
  const verifierRecord = nullable(r.verifierRecord, `${f}.verifierRecord`, artifact)
  if (original.sourceHead !== derived.sourceHead || original.repository !== derived.repository)
    deny('MISMATCH', `${f}.original`)
  if (kind === 'original-capture' && differences(original, derived, f).length)
    deny('MISMATCH', `${f}.result`)
  if (kind === 'formatting-projection' && (!verifierRecord || original.sha256 === derived.sha256))
    deny('UNVERIFIED', `${f}.verifierRecord`)
  return Object.freeze({
    state: literal(r.state, 'unverified', `${f}.state`),
    kind,
    identity: identity(r.identity, `${f}.identity`),
    requestHash: digest(r.requestHash, `${f}.requestHash`),
    subject: subject(r.subject, `${f}.subject`),
    original,
    result: derived,
    capture: artifact(r.capture, `${f}.capture`),
    verifierRecord,
    providerRequestId: nullable(r.providerRequestId, `${f}.providerRequestId`, id),
  })
}
export function parseEvidenceProvenance(v: unknown): ValidationResult<EvidenceProvenance> {
  return result(() => provenance(capture(v), '$'))
}
/** A consumer-owned verification result, never constructible by this parser or by a boolean option.
 * The nominal type is not a security boundary: P04/P05 must authenticate in their protected host.
 */
declare const trustedEvidence: unique symbol
export type VerifiedEvidence = Readonly<{
  state: 'verified'
  provenance: EvidenceProvenance
  verificationRecordHash: string
  readonly [trustedEvidence]: true
}>
export type Finding = Readonly<{
  id: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  text: string
  artifact: ArtifactReference
}>
export type ReviewResult = Readonly<{
  descriptor: DispatchIntent
  subject: ReviewSubject
  reviewText: string
  verdict: 'pass' | 'changes_required' | 'blocked'
  findings: readonly Finding[]
  coverage: readonly ArtifactReference[]
  limitations: readonly string[]
  provenance: EvidenceProvenance
}>
function review(v: unknown, f: string): ReviewResult {
  const r = object(v, f, [
    'descriptor',
    'subject',
    'reviewText',
    'verdict',
    'findings',
    'coverage',
    'limitations',
    'provenance',
  ])
  const s = subject(r.subject, `${f}.subject`)
  const d = dispatch(r.descriptor, `${f}.descriptor`)
  if (d.role !== 'judge' && d.role !== 'verifier') deny('INDEPENDENCE', `${f}.descriptor.role`)
  const p = provenance(r.provenance, `${f}.provenance`)
  const coverage = list(r.coverage, `${f}.coverage`, artifact, 1)
  const verdict = choice(r.verdict, ['pass', 'changes_required', 'blocked'], `${f}.verdict`)
  const findings = list(r.findings, `${f}.findings`, (value, field): Finding => {
    const item = object(value, field, ['id', 'severity', 'text', 'artifact'])
    return Object.freeze({
      id: id(item.id, `${field}.id`),
      severity: choice(item.severity, ['low', 'medium', 'high', 'critical'], `${field}.severity`),
      text: text(item.text, `${field}.text`),
      artifact: artifact(item.artifact, `${field}.artifact`),
    })
  })
  if (new Set(findings.map((finding) => finding.id)).size !== findings.length)
    deny('INCOMPLETE_REVIEW', `${f}.findings`)
  if (
    (verdict === 'pass' && findings.length) ||
    (verdict === 'changes_required' && !findings.length)
  )
    deny('INCOMPLETE_REVIEW', `${f}.verdict`)
  if (
    differences(s.artifacts, coverage, f).length ||
    differences(s, p.subject, f).length ||
    differences(d.identity, p.identity, f).length ||
    d.specHash !== s.specHash ||
    d.activePlanHash !== s.activePlanHash
  )
    deny('MISMATCH', `${f}.coverage/provenance`)
  for (const finding of findings)
    if (!s.artifacts.some((a) => !differences(a, finding.artifact, f).length))
      deny('MISMATCH', `${f}.findings`)
  if (p.result.sourceHead !== d.sourceHead || p.result.sha256 !== d.artifactHash)
    deny('MISMATCH', `${f}.provenance.result`)
  return Object.freeze({
    descriptor: d,
    subject: s,
    reviewText: text(r.reviewText, `${f}.reviewText`, 32768),
    verdict,
    findings,
    coverage,
    limitations: strings(r.limitations, `${f}.limitations`, text),
    provenance: p,
  })
}
export function parseReviewResult(
  v: unknown,
  expectedSubject: unknown,
): ValidationResult<ReviewResult> {
  return result(() => {
    const value = review(capture(v), '$')
    if (
      differences(value.subject, subject(capture(expectedSubject), 'expectedSubject'), 'subject')
        .length
    )
      deny('MISMATCH', 'subject')
    return value
  })
}
export type ReviewSeat = Readonly<{
  actorId: string
  sessionId: string
  provider: string
  modelProfile: string
  modelFamily: string
  role: RoleId
  mode: 'read-only'
  context: 'fresh-no-builder-or-peer-context'
}>
function seat(v: unknown, f: string): ReviewSeat {
  const r = object(v, f, [
    'actorId',
    'sessionId',
    'provider',
    'modelProfile',
    'modelFamily',
    'role',
    'mode',
    'context',
  ])
  const role = choice(r.role, ROLE_IDS, `${f}.role`)
  if (role !== 'judge' && role !== 'verifier') deny('INDEPENDENCE', `${f}.role`)
  return Object.freeze({
    actorId: id(r.actorId, `${f}.actorId`),
    sessionId: id(r.sessionId, `${f}.sessionId`),
    provider: id(r.provider, `${f}.provider`),
    modelProfile: id(r.modelProfile, `${f}.modelProfile`),
    modelFamily: id(r.modelFamily, `${f}.modelFamily`),
    role,
    mode: literal(r.mode, 'read-only', `${f}.mode`),
    context: literal(r.context, 'fresh-no-builder-or-peer-context', `${f}.context`),
  })
}
/** Scoped representation; does not modify the universal routing-policy exclusions. */
export function validateIndependence(v: unknown): ValidationResult<readonly ReviewSeat[]> {
  return result(() => {
    const r = object(capture(v), '$', [
      'mandate',
      'goal',
      'exception',
      'surface',
      'authors',
      'authorSessions',
      'seats',
    ])
    literal(r.mandate, 'OM-PAN-001', 'mandate')
    literal(r.goal, 'pantheon-incarnation-v0', 'goal')
    literal(r.exception, 'OM-PAN-001-A9', 'exception')
    const surface = choice(r.surface, ['ordinary', 'authority', 'security'], 'surface')
    const authors = strings(r.authors, 'authors', id, 1)
    const sessions = strings(r.authorSessions, 'authorSessions', id, 1)
    const seats = list(r.seats, 'seats', seat, surface === 'ordinary' ? 1 : 2)
    if (
      new Set(seats.map((s) => s.actorId)).size !== seats.length ||
      new Set(seats.map((s) => s.sessionId)).size !== seats.length ||
      seats.some((s) => authors.includes(s.actorId) || sessions.includes(s.sessionId))
    )
      deny('INDEPENDENCE', 'seats')
    return seats
  })
}

export type AuthorityBoundary = Readonly<{
  intent: string
  scope: readonly string[]
  hosts: readonly string[]
  accounts: readonly string[]
  recipients: readonly string[]
  access: readonly string[]
  totalCeilingMicroUsd: number
  residualRisk: string
  production: 'excluded' | 'requested'
}>
function boundary(v: unknown, f: string): AuthorityBoundary {
  const r = object(v, f, [
    'intent',
    'scope',
    'hosts',
    'accounts',
    'recipients',
    'access',
    'totalCeilingMicroUsd',
    'residualRisk',
    'production',
  ])
  return Object.freeze({
    intent: text(r.intent, `${f}.intent`),
    scope: strings(r.scope, `${f}.scope`, id, 1),
    hosts: strings(r.hosts, `${f}.hosts`, id, 1),
    accounts: strings(r.accounts, `${f}.accounts`),
    recipients: strings(r.recipients, `${f}.recipients`),
    access: strings(r.access, `${f}.access`),
    totalCeilingMicroUsd: uint(r.totalCeilingMicroUsd, `${f}.totalCeilingMicroUsd`),
    residualRisk: text(r.residualRisk, `${f}.residualRisk`),
    production: choice(r.production, ['excluded', 'requested'], `${f}.production`),
  })
}
export type AuthorityDelta = Readonly<{
  disposition: 'material-exception' | 'ordinary-refinement' | 'automatic-hold'
  affectedFields: readonly string[]
}>
export function classifyAuthorityDelta(
  before: unknown,
  after: unknown,
  condition: unknown,
): ValidationResult<AuthorityDelta> {
  return result(() => {
    const a = boundary(capture(before), 'before')
    const b = boundary(capture(after), 'after')
    const cause = choice(
      condition,
      ['ready', 'evidence-failure', 'dependency-unavailable', 'routine-rework'],
      'condition',
    )
    const fields: string[] = []
    for (const key of ['intent', 'residualRisk', 'production'] as const)
      if (a[key] !== b[key]) fields.push(key)
    for (const key of ['scope', 'hosts', 'accounts', 'recipients', 'access'] as const)
      if (b[key].some((item) => !a[key].includes(item))) fields.push(key)
    if (b.totalCeilingMicroUsd > a.totalCeilingMicroUsd) fields.push('totalCeilingMicroUsd')
    return Object.freeze({
      disposition: fields.length
        ? 'material-exception'
        : cause === 'ready'
          ? 'ordinary-refinement'
          : 'automatic-hold',
      affectedFields: Object.freeze(fields),
    })
  })
}
export type MaterialException = Readonly<{
  descriptor: DispatchIntent
  deduplicationKey: string
  before: AuthorityBoundary
  after: AuthorityBoundary
  evidence: readonly ArtifactReference[]
  explanation: string
}>
export function parseMaterialException(v: unknown): ValidationResult<MaterialException> {
  return result(() => {
    const r = object(capture(v), '$', [
      'descriptor',
      'deduplicationKey',
      'before',
      'after',
      'evidence',
      'explanation',
    ])
    const before = boundary(r.before, 'before')
    const after = boundary(r.after, 'after')
    const delta = classifyAuthorityDelta(before, after, 'ready')
    if (delta.status !== 'structurally-valid' || delta.value.disposition !== 'material-exception')
      deny('MISMATCH', 'after')
    return Object.freeze({
      descriptor: dispatch(r.descriptor, 'descriptor'),
      deduplicationKey: digest(r.deduplicationKey, 'deduplicationKey'),
      before,
      after,
      evidence: list(r.evidence, 'evidence', artifact, 1),
      explanation: text(r.explanation, 'explanation'),
    })
  })
}

export type WireFrame = Readonly<{
  version: typeof WIRE_VERSION
  kind: 'request' | 'response' | 'completion'
  identity: Identity
  requestId: string
  requestHash: string
  fencingEpoch: number
  operation: Operation
  artifact: ArtifactReference
  eventCursor: number
}> &
  (
    | Readonly<{ kind: 'request'; descriptor: DispatchIntent }>
    | Readonly<{
        kind: 'response'
        disposition: 'pending' | 'denied'
        denial: ResponseDenialCode | null
        recoveryOwner: RecoveryOwner | null
      }>
    | Readonly<{
        kind: 'completion'
        eventId: string
        outcome: 'succeeded' | 'failed' | 'unknown'
        provenance: EvidenceProvenance
      }>
  )
function frame(v: unknown, f: string): WireFrame {
  if (!v || typeof v !== 'object' || Array.isArray(v)) deny('INVALID_SHAPE', f)
  const kind = choice((v as Data).kind, ['request', 'response', 'completion'], `${f}.kind`)
  const keys = [
    'version',
    'kind',
    'identity',
    'requestId',
    'requestHash',
    'fencingEpoch',
    'operation',
    'artifact',
    'eventCursor',
  ]
  const r = object(v, f, [
    ...keys,
    ...(kind === 'request'
      ? ['descriptor']
      : kind === 'response'
        ? ['disposition', 'denial', 'recoveryOwner']
        : ['eventId', 'outcome', 'provenance']),
  ])
  const common = {
    version: literal(r.version, WIRE_VERSION, `${f}.version`),
    identity: identity(r.identity, `${f}.identity`),
    requestId: id(r.requestId, `${f}.requestId`),
    requestHash: digest(r.requestHash, `${f}.requestHash`),
    fencingEpoch: uint(r.fencingEpoch, `${f}.fencingEpoch`),
    operation: operation(r.operation, `${f}.operation`),
    artifact: artifact(r.artifact, `${f}.artifact`),
    eventCursor: uint(r.eventCursor, `${f}.eventCursor`),
  }
  if (kind === 'request') {
    const descriptor = dispatch(r.descriptor, `${f}.descriptor`)
    if (
      differences(common.identity, descriptor.identity, f).length ||
      common.fencingEpoch !== descriptor.fencingEpoch ||
      common.operation !== descriptor.operation ||
      common.artifact.sha256 !== descriptor.artifactHash ||
      common.artifact.sourceHead !== descriptor.sourceHead
    )
      deny('MISMATCH', f)
    return Object.freeze({ ...common, kind, descriptor })
  }
  if (kind === 'response') {
    const disposition = choice(r.disposition, ['pending', 'denied'], `${f}.disposition`)
    const denial = nullable(r.denial, `${f}.denial`, (value, field) =>
      choice(value, RESPONSE_DENIAL_CODES, field),
    )
    const recoveryOwner = nullable(r.recoveryOwner, `${f}.recoveryOwner`, (value, field) =>
      choice(value, ['P02', 'P03', 'P04', 'P05', 'P06', 'P08'] as const, field),
    )
    if ((disposition === 'denied') !== (denial !== null)) deny('INVALID_SHAPE', `${f}.denial`)
    if ((disposition === 'denied') !== (recoveryOwner !== null))
      deny('INVALID_SHAPE', `${f}.recoveryOwner`)
    return Object.freeze({ ...common, kind, disposition, denial, recoveryOwner })
  }
  const p = provenance(r.provenance, `${f}.provenance`)
  if (
    differences(common.identity, p.identity, f).length ||
    differences(common.artifact, p.result, f).length ||
    common.requestHash !== p.requestHash
  )
    deny('MISMATCH', `${f}.provenance`)
  return Object.freeze({
    ...common,
    kind,
    eventId: id(r.eventId, `${f}.eventId`),
    outcome: choice(r.outcome, ['succeeded', 'failed', 'unknown'], `${f}.outcome`),
    provenance: p,
  })
}
/** Strict JSON grammar pass rejects duplicate decoded keys at every depth before JSON.parse. */
function strictJson(source: string): unknown {
  let pos = 0
  let nodes = 0
  const ws = () => {
    while (/[ \t\r\n]/.test(source[pos] ?? 'x')) pos++
  }
  function token(): string {
    const start = pos++
    while (pos < source.length) {
      const c = source[pos++]
      if (c === '"') {
        try {
          return JSON.parse(source.slice(start, pos)) as string
        } catch {
          return deny('MALFORMED_JSON', '$')
        }
      }
      if (c === '\\') pos++
    }
    return deny('MALFORMED_JSON', '$')
  }
  function value(depth: number): void {
    if (++nodes > LIMITS.nodes || depth > LIMITS.depth) deny('LIMIT_EXCEEDED', '$')
    ws()
    const c = source[pos]
    if (c === '"') {
      token()
      return
    }
    if (c === '{' || c === '[') {
      pos++
      ws()
      const close = c === '{' ? '}' : ']'
      const keys = new Set<string>()
      if (source[pos] === close) {
        pos++
        return
      }
      while (pos < source.length) {
        ws()
        if (c === '{') {
          if (source[pos] !== '"') deny('MALFORMED_JSON', '$')
          const key = token()
          if (keys.has(key)) deny('MALFORMED_JSON', '$')
          keys.add(key)
          ws()
          if (source[pos++] !== ':') deny('MALFORMED_JSON', '$')
        }
        value(depth + 1)
        ws()
        const delimiter = source[pos++]
        if (delimiter === close) return
        if (delimiter !== ',') deny('MALFORMED_JSON', '$')
      }
      deny('MALFORMED_JSON', '$')
    }
    const match = /^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/.exec(
      source.slice(pos),
    )
    if (!match) deny('MALFORMED_JSON', '$')
    pos += match[0].length
  }
  value(0)
  ws()
  if (pos !== source.length) deny('MALFORMED_JSON', '$')
  try {
    return JSON.parse(source) as unknown
  } catch {
    return deny('MALFORMED_JSON', '$')
  }
}
/** Exactly one LF-terminated UTF-8 frame. Host must bound bytes before decoding/buffering. */
export function parseNdjsonFrame(line: unknown): ValidationResult<WireFrame> {
  return result(() => {
    if (typeof line !== 'string') deny('MALFORMED_JSON', '$')
    if (Buffer.byteLength(line, 'utf8') > LIMITS.frameBytes) deny('LIMIT_EXCEEDED', '$')
    if (!line.endsWith('\n') || /[\r\n]/.test(line.slice(0, -1))) deny('MALFORMED_JSON', '$')
    return frame(capture(strictJson(line.slice(0, -1))), '$')
  })
}
