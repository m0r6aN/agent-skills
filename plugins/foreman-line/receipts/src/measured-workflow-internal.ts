import { STAGE_IDS, type StageId, UUID_PATTERN } from '../../contracts/src/index.js'

export type CodeV1 =
  | 'SESSION_REFUSED'
  | 'PHASE_REFUSED'
  | 'PREREQUISITE_UNAVAILABLE'
  | 'EVIDENCE_REFUSED'
  | 'COVERAGE_INCOMPLETE'
  | 'CHAIN_REFUSED'
  | 'WRITE_REFUSED'
  | 'WRITE_UNCERTAIN'

export type ResultV1<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly code: CodeV1 }

export interface RefV1 {
  readonly hash: string
  readonly locator: string
}

export interface RegistrationV1 {
  readonly workflowId: string
  readonly correlationId: string
  readonly parcelRef: string
  readonly repoRoot: string
  readonly verifiedHeadSha: string
  readonly dispatchReceiptRef: RefV1
  readonly buildReceiptRef: RefV1
  readonly specDigest: string
  readonly matrixDigest: string
  readonly expectedPlanDigest: string
}

export interface ChainKeyV1 {
  readonly rootDeviceId: string
  readonly rootFileId: string
  readonly workflowId: string
}

export interface SealV1 {
  readonly workflowId: string
  readonly correlationId: string
  readonly verifiedHeadSha: string
  readonly telemetryReceiptRef: RefV1
  readonly denominatorDigest: string
  readonly coverage: 'complete'
}

export interface AckV1 {
  readonly stage: 'D' | 'E' | 'F'
  readonly receiptRef: RefV1
  readonly predecessorRef: RefV1
  readonly sequence: number
  readonly verifiedHeadSha: string
  readonly subjectDigest: string
}

export type PhaseV1 =
  | 'capturing'
  | 'draining'
  | 'publishing'
  | 'finalized-D'
  | 'integrated-E'
  | 'sealed-F'
  | 'held'

export interface SessionStateV1 {
  readonly domain: 'offline-fixture/v1'
  readonly fixtureId: string
  readonly registration: RegistrationV1
  readonly phase: PhaseV1
  readonly busy: boolean
  readonly outstandingWork: number
  readonly seal: SealV1 | null
  readonly finalD: AckV1 | null
  readonly integratedE: AckV1 | null
  readonly sealedF: AckV1 | null
}

export interface WriterPortV1 {
  readonly readStateV1: () => ResultV1<SessionStateV1>
  readonly beginWriterV1: () => ResultV1<object>
  readonly endWriterV1: (lease: object) => ResultV1<null>
  readonly holdV1: (lease: object) => ResultV1<null>
}

export interface WorkflowPortV1 extends WriterPortV1 {
  readonly admitWorkV1: () => ResultV1<object>
  readonly completeWorkV1: (work: object) => ResultV1<null>
  readonly closeAdmissionV1: () => ResultV1<null>
  readonly acknowledgeDrainV1: () => ResultV1<null>
}

export interface VerificationPortV1 extends WriterPortV1 {
  readonly acknowledgeFinalDV1: (lease: object, record: unknown) => ResultV1<null>
}

export interface PublicationPortV1 extends WriterPortV1 {
  readonly registerSealV1: (lease: object, record: unknown) => ResultV1<null>
}

export interface IntegrationPortV1 extends WriterPortV1 {
  readonly acknowledgeEV1: (lease: object, record: unknown) => ResultV1<null>
}

export interface ClosurePortV1 extends WriterPortV1 {
  readonly acknowledgeFV1: (lease: object, record: unknown) => ResultV1<null>
}

export interface OwnerBundleV1 {
  readonly session: object
  readonly workflow: WorkflowPortV1
  readonly verification: VerificationPortV1
  readonly publication: PublicationPortV1
  readonly integration: IntegrationPortV1
  readonly closure: ClosurePortV1
}

export interface InstallationV1 {
  readonly createSessionV1: (
    registration: unknown,
    fixtureId: unknown,
    chainKey: unknown,
  ) => ResultV1<OwnerBundleV1>
}

const MAX_SESSIONS = 32
const MAX_WORK = 256
const MAX_DEPTH = 20
const MAX_NODES = 131072
const MAX_STRING = 4096
const MAX_TOTAL_STRING = 2 * 1024 * 1024
const UUID_RE = new RegExp(UUID_PATTERN)
const HASH_RE = /^[0-9a-f]{64}$/
const HEAD_RE = /^[0-9a-f]{40}$/
const DECIMAL_RE = /^(0|[1-9][0-9]*)$/
const MAX_U64 = 18446744073709551615n

class CaptureFailure extends Error {}

interface CaptureState {
  remaining: number
  strings: number
  active: Set<object>
  captured: Map<object, unknown>
}

function refuse<T>(code: CodeV1): ResultV1<T> {
  return { ok: false, code }
}

function freezeOwned<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) freezeOwned(child)
    Object.freeze(value)
  }
  return value
}

function copyOwned(
  value: unknown,
  state: CaptureState,
  depth: number,
  precharged = false,
): unknown {
  if (depth > MAX_DEPTH) throw new CaptureFailure()
  if (!precharged) {
    state.remaining -= 1
    if (state.remaining < 0) throw new CaptureFailure()
  }
  if (typeof value === 'string') {
    if (value.length > MAX_STRING) throw new CaptureFailure()
    state.strings += value.length
    if (state.strings > MAX_TOTAL_STRING) throw new CaptureFailure()
    return value
  }
  if (value === null || typeof value === 'boolean') return value
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new CaptureFailure()
    return value
  }
  if (typeof value !== 'object' || value === null || ArrayBuffer.isView(value))
    throw new CaptureFailure()
  if (state.active.has(value)) throw new CaptureFailure()
  const previous = state.captured.get(value)
  if (previous !== undefined) {
    return copyOwned(previous, state, depth, true)
  }
  state.active.add(value)
  try {
    const array = Array.isArray(value)
    const prototype = Object.getPrototypeOf(value)
    if (
      array ? prototype !== Array.prototype : prototype !== Object.prototype && prototype !== null
    ) {
      throw new CaptureFailure()
    }
    const keys = Reflect.ownKeys(value)
    if (array) {
      const lengthDescriptor = Object.getOwnPropertyDescriptor(value, 'length')
      if (
        lengthDescriptor === undefined ||
        !('value' in lengthDescriptor) ||
        !Number.isSafeInteger(lengthDescriptor.value) ||
        lengthDescriptor.value < 0 ||
        lengthDescriptor.value > MAX_WORK ||
        keys.length !== lengthDescriptor.value + 1
      ) {
        throw new CaptureFailure()
      }
      state.remaining -= lengthDescriptor.value + keys.length
      if (state.remaining < 0) throw new CaptureFailure()
    } else {
      state.remaining -= keys.length
      if (state.remaining < 0) throw new CaptureFailure()
    }
    const output: Record<string, unknown> | unknown[] = array ? [] : Object.create(null)
    state.captured.set(value, output)
    for (const key of keys) {
      if (array && key === 'length') continue
      if (typeof key !== 'string') throw new CaptureFailure()
      if (array && (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= (value as unknown[]).length)) {
        throw new CaptureFailure()
      }
      const descriptor = Object.getOwnPropertyDescriptor(value, key)
      if (descriptor === undefined || !('value' in descriptor) || !descriptor.enumerable) {
        throw new CaptureFailure()
      }
      if (key.length > MAX_STRING) throw new CaptureFailure()
      state.strings += key.length
      if (state.strings > MAX_TOTAL_STRING) throw new CaptureFailure()
      const child = copyOwned(descriptor.value, state, depth + 1, array)
      Object.defineProperty(output, key, {
        value: child,
        enumerable: true,
        writable: true,
        configurable: true,
      })
    }
    return output
  } finally {
    state.active.delete(value)
  }
}

function capture(value: unknown): unknown {
  return copyOwned(
    value,
    {
      remaining: MAX_NODES,
      strings: 0,
      active: new Set(),
      captured: new Map(),
    },
    0,
  )
}

function exactRecord(value: unknown, keys: readonly string[]): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  const record = value as Record<string, unknown>
  const ownKeys = Object.keys(record)
  if (ownKeys.length !== keys.length || keys.some((key) => !Object.hasOwn(record, key))) return null
  return record
}

function boundedString(value: unknown, name: string): string | null {
  if (typeof value !== 'string' || value.length === 0 || value.length > MAX_STRING) return null
  if (name === 'hash' && !HASH_RE.test(value)) return null
  return value
}

function ref(value: unknown): RefV1 | null {
  const record = exactRecord(value, ['hash', 'locator'])
  if (record === null) return null
  const hash = boundedString(record.hash, 'hash')
  const locator = boundedString(record.locator, 'locator')
  if (hash === null || locator === null || !locator.startsWith('docs/receipts/')) return null
  return freezeOwned({ hash, locator })
}

function registration(value: unknown): RegistrationV1 | null {
  const record = exactRecord(value, [
    'workflowId',
    'correlationId',
    'parcelRef',
    'repoRoot',
    'verifiedHeadSha',
    'dispatchReceiptRef',
    'buildReceiptRef',
    'specDigest',
    'matrixDigest',
    'expectedPlanDigest',
  ])
  if (record === null) return null
  const workflowId = boundedString(record.workflowId, 'workflowId')
  const correlationId = boundedString(record.correlationId, 'correlationId')
  const parcelRef = boundedString(record.parcelRef, 'parcelRef')
  const repoRoot = boundedString(record.repoRoot, 'repoRoot')
  const verifiedHeadSha = boundedString(record.verifiedHeadSha, 'verifiedHeadSha')
  const specDigest = boundedString(record.specDigest, 'specDigest')
  const matrixDigest = boundedString(record.matrixDigest, 'matrixDigest')
  const expectedPlanDigest = boundedString(record.expectedPlanDigest, 'expectedPlanDigest')
  const dispatchReceiptRef = ref(record.dispatchReceiptRef)
  const buildReceiptRef = ref(record.buildReceiptRef)
  if (
    workflowId === null ||
    !UUID_RE.test(workflowId) ||
    correlationId === null ||
    parcelRef === null ||
    repoRoot === null ||
    verifiedHeadSha === null ||
    !HEAD_RE.test(verifiedHeadSha) ||
    specDigest === null ||
    matrixDigest === null ||
    expectedPlanDigest === null ||
    dispatchReceiptRef === null ||
    buildReceiptRef === null
  )
    return null
  return freezeOwned({
    workflowId,
    correlationId,
    parcelRef,
    repoRoot,
    verifiedHeadSha,
    dispatchReceiptRef,
    buildReceiptRef,
    specDigest,
    matrixDigest,
    expectedPlanDigest,
  })
}

function chainKey(value: unknown, workflowId: string): ChainKeyV1 | null {
  const record = exactRecord(value, ['rootDeviceId', 'rootFileId', 'workflowId'])
  if (record === null) return null
  const rootDeviceId = boundedString(record.rootDeviceId, 'rootDeviceId')
  const rootFileId = boundedString(record.rootFileId, 'rootFileId')
  const keyWorkflowId = boundedString(record.workflowId, 'workflowId')
  if (rootDeviceId === null || rootFileId === null || keyWorkflowId === null) return null
  if (!DECIMAL_RE.test(rootDeviceId) || !DECIMAL_RE.test(rootFileId)) return null
  if (rootDeviceId !== '0' && BigInt(rootDeviceId) > MAX_U64) return null
  if (rootFileId === '0' || BigInt(rootFileId) > MAX_U64) return null
  if (keyWorkflowId.toLowerCase() !== workflowId.toLowerCase()) return null
  return freezeOwned({ rootDeviceId, rootFileId, workflowId: keyWorkflowId.toLowerCase() })
}

function recordForAck(value: unknown): AckV1 | null {
  const record = exactRecord(value, [
    'stage',
    'receiptRef',
    'predecessorRef',
    'sequence',
    'verifiedHeadSha',
    'subjectDigest',
  ])
  if (record === null || !STAGE_IDS.includes(record.stage as StageId)) return null
  if (record.stage !== 'D' && record.stage !== 'E' && record.stage !== 'F') return null
  if (!Number.isSafeInteger(record.sequence) || (record.sequence as number) < 0) return null
  const receiptRef = ref(record.receiptRef)
  const predecessorRef = ref(record.predecessorRef)
  const verifiedHeadSha = boundedString(record.verifiedHeadSha, 'verifiedHeadSha')
  const subjectDigest = boundedString(record.subjectDigest, 'subjectDigest')
  if (
    receiptRef === null ||
    predecessorRef === null ||
    verifiedHeadSha === null ||
    !HEAD_RE.test(verifiedHeadSha) ||
    subjectDigest === null ||
    !HASH_RE.test(subjectDigest)
  )
    return null
  return freezeOwned({
    stage: record.stage,
    receiptRef,
    predecessorRef,
    sequence: record.sequence as number,
    verifiedHeadSha,
    subjectDigest,
  })
}

function sealRecord(value: unknown): SealV1 | null {
  const record = exactRecord(value, [
    'workflowId',
    'correlationId',
    'verifiedHeadSha',
    'telemetryReceiptRef',
    'denominatorDigest',
    'coverage',
  ])
  if (record === null || record.coverage !== 'complete') return null
  const workflowId = boundedString(record.workflowId, 'workflowId')
  const correlationId = boundedString(record.correlationId, 'correlationId')
  const verifiedHeadSha = boundedString(record.verifiedHeadSha, 'verifiedHeadSha')
  const denominatorDigest = boundedString(record.denominatorDigest, 'denominatorDigest')
  const telemetryReceiptRef = ref(record.telemetryReceiptRef)
  if (
    workflowId === null ||
    correlationId === null ||
    verifiedHeadSha === null ||
    !HEAD_RE.test(verifiedHeadSha) ||
    denominatorDigest === null ||
    !HASH_RE.test(denominatorDigest) ||
    telemetryReceiptRef === null
  )
    return null
  return freezeOwned({
    workflowId,
    correlationId,
    verifiedHeadSha,
    telemetryReceiptRef,
    denominatorDigest,
    coverage: 'complete',
  })
}

interface LeaseInfo {
  readonly session: SessionInfo
  readonly role: RoleV1
}

type RoleV1 = 'workflow' | 'verification' | 'publication' | 'integration' | 'closure'

interface SessionInfo {
  readonly session: object
  readonly fixtureId: string
  readonly registration: RegistrationV1
  readonly key: ChainKeyV1
  phase: PhaseV1
  activeLease: object | null
  activeRole: RoleV1 | null
  work: Set<object>
  seal: SealV1 | null
  finalD: AckV1 | null
  integratedE: AckV1 | null
  sealedF: AckV1 | null
}

const sessions = new WeakMap<object, SessionInfo>()
const leases = new WeakMap<object, LeaseInfo>()
const workTokens = new WeakMap<object, SessionInfo>()
const reservations = new Map<string, Map<string, Set<string>>>()
let retainedSessions = 0

function reserved(key: ChainKeyV1): boolean {
  return reservations.get(key.rootDeviceId)?.get(key.rootFileId)?.has(key.workflowId) ?? false
}

function reserve(key: ChainKeyV1): boolean {
  if (retainedSessions >= MAX_SESSIONS || reserved(key)) return false
  let byFile = reservations.get(key.rootDeviceId)
  if (byFile === undefined) {
    byFile = new Map()
    reservations.set(key.rootDeviceId, byFile)
  }
  let workflows = byFile.get(key.rootFileId)
  if (workflows === undefined) {
    workflows = new Set()
    byFile.set(key.rootFileId, workflows)
  }
  workflows.add(key.workflowId)
  retainedSessions += 1
  return true
}

function stateOf(info: SessionInfo): SessionStateV1 {
  return freezeOwned({
    domain: 'offline-fixture/v1',
    fixtureId: info.fixtureId,
    registration: info.registration,
    phase: info.phase,
    busy: info.activeLease !== null,
    outstandingWork: info.work.size,
    seal: info.seal,
    finalD: info.finalD,
    integratedE: info.integratedE,
    sealedF: info.sealedF,
  })
}

function validRolePhase(role: RoleV1, phase: PhaseV1): boolean {
  if (phase === 'held' || phase === 'sealed-F') return false
  if (role === 'workflow') return phase === 'capturing' || phase === 'draining'
  if (role === 'verification' || role === 'publication') return phase === 'publishing'
  if (role === 'integration') return phase === 'finalized-D'
  return phase === 'integrated-E'
}

function leaseFor(info: SessionInfo, role: RoleV1, lease: object): boolean {
  const found = leases.get(lease)
  return found?.session === info && found.role === role && info.activeLease === lease
}

function commonPort(info: SessionInfo, role: RoleV1): WriterPortV1 {
  return {
    readStateV1: () => ({ ok: true, value: stateOf(info) }),
    beginWriterV1: () => {
      if (!validRolePhase(role, info.phase) || info.activeLease !== null)
        return refuse('PHASE_REFUSED')
      const lease = Object.freeze({})
      info.activeLease = lease
      info.activeRole = role
      leases.set(lease, { session: info, role })
      return { ok: true, value: lease }
    },
    endWriterV1: (lease) => {
      if (!leaseFor(info, role, lease)) return refuse('SESSION_REFUSED')
      info.activeLease = null
      info.activeRole = null
      leases.delete(lease)
      return { ok: true, value: null }
    },
    holdV1: (lease) => {
      if (!leaseFor(info, role, lease) || info.phase === 'sealed-F')
        return refuse('SESSION_REFUSED')
      info.phase = 'held'
      return { ok: true, value: null }
    },
  }
}

function workflowPort(info: SessionInfo): WorkflowPortV1 {
  return {
    ...commonPort(info, 'workflow'),
    admitWorkV1: () => {
      if (info.phase !== 'capturing' || info.work.size >= MAX_WORK) return refuse('PHASE_REFUSED')
      const work = Object.freeze({})
      info.work.add(work)
      workTokens.set(work, info)
      return { ok: true, value: work }
    },
    completeWorkV1: (work) => {
      if (
        workTokens.get(work) !== info ||
        (info.phase !== 'capturing' && info.phase !== 'draining')
      ) {
        return refuse('SESSION_REFUSED')
      }
      info.work.delete(work)
      workTokens.delete(work)
      return { ok: true, value: null }
    },
    closeAdmissionV1: () => {
      if (info.phase !== 'capturing' || info.activeLease !== null) return refuse('PHASE_REFUSED')
      info.phase = 'draining'
      return { ok: true, value: null }
    },
    acknowledgeDrainV1: () => {
      if (info.phase !== 'draining' || info.work.size !== 0 || info.activeLease !== null)
        return refuse('PHASE_REFUSED')
      info.phase = 'publishing'
      return { ok: true, value: null }
    },
  }
}

function verificationPort(info: SessionInfo): VerificationPortV1 {
  return {
    ...commonPort(info, 'verification'),
    acknowledgeFinalDV1: (lease, value) => {
      if (
        !leaseFor(info, 'verification', lease) ||
        info.phase !== 'publishing' ||
        info.seal === null
      )
        return refuse('PHASE_REFUSED')
      const record = recordForAck(value)
      if (
        record === null ||
        record.stage !== 'D' ||
        record.verifiedHeadSha !== info.registration.verifiedHeadSha ||
        record.predecessorRef.hash !== info.seal.telemetryReceiptRef.hash ||
        record.predecessorRef.locator !== info.seal.telemetryReceiptRef.locator
      )
        return refuse('EVIDENCE_REFUSED')
      info.finalD = record
      info.phase = 'finalized-D'
      return { ok: true, value: null }
    },
  }
}

function publicationPort(info: SessionInfo): PublicationPortV1 {
  return {
    ...commonPort(info, 'publication'),
    registerSealV1: (lease, value) => {
      if (
        !leaseFor(info, 'publication', lease) ||
        info.phase !== 'publishing' ||
        info.seal !== null
      )
        return refuse('PHASE_REFUSED')
      const record = sealRecord(value)
      if (
        record === null ||
        record.workflowId.toLowerCase() !== info.registration.workflowId.toLowerCase() ||
        record.correlationId !== info.registration.correlationId ||
        record.verifiedHeadSha !== info.registration.verifiedHeadSha
      )
        return refuse('EVIDENCE_REFUSED')
      info.seal = record
      return { ok: true, value: null }
    },
  }
}

function integrationPort(info: SessionInfo): IntegrationPortV1 {
  return {
    ...commonPort(info, 'integration'),
    acknowledgeEV1: (lease, value) => {
      if (
        !leaseFor(info, 'integration', lease) ||
        info.phase !== 'finalized-D' ||
        info.finalD === null
      )
        return refuse('PHASE_REFUSED')
      const record = recordForAck(value)
      if (
        record === null ||
        record.stage !== 'E' ||
        record.verifiedHeadSha !== info.registration.verifiedHeadSha ||
        record.sequence !== info.finalD.sequence + 1 ||
        record.predecessorRef.hash !== info.finalD.receiptRef.hash ||
        record.predecessorRef.locator !== info.finalD.receiptRef.locator
      )
        return refuse('EVIDENCE_REFUSED')
      info.integratedE = record
      info.phase = 'integrated-E'
      return { ok: true, value: null }
    },
  }
}

function closurePort(info: SessionInfo): ClosurePortV1 {
  return {
    ...commonPort(info, 'closure'),
    acknowledgeFV1: (lease, value) => {
      if (
        !leaseFor(info, 'closure', lease) ||
        info.phase !== 'integrated-E' ||
        info.integratedE === null
      )
        return refuse('PHASE_REFUSED')
      const record = recordForAck(value)
      if (
        record === null ||
        record.stage !== 'F' ||
        record.verifiedHeadSha !== info.registration.verifiedHeadSha ||
        record.sequence !== info.integratedE.sequence + 1 ||
        record.predecessorRef.hash !== info.integratedE.receiptRef.hash ||
        record.predecessorRef.locator !== info.integratedE.receiptRef.locator
      )
        return refuse('EVIDENCE_REFUSED')
      info.sealedF = record
      info.phase = 'sealed-F'
      return { ok: true, value: null }
    },
  }
}

export function createOfflineMeasuredWorkflowInstallationV1(): InstallationV1 {
  return {
    createSessionV1: (rawRegistration, rawFixtureId, rawChainKey) => {
      let ownedRegistration: RegistrationV1 | null = null
      let ownedFixtureId: string | null = null
      let ownedChainKey: ChainKeyV1 | null = null
      try {
        const capturedRegistration = capture(rawRegistration)
        const capturedFixtureId = capture(rawFixtureId)
        const capturedChainKey = capture(rawChainKey)
        ownedRegistration = registration(capturedRegistration)
        ownedFixtureId = boundedString(capturedFixtureId, 'fixtureId')
        ownedChainKey =
          ownedRegistration === null
            ? null
            : chainKey(capturedChainKey, ownedRegistration.workflowId)
      } catch {
        return refuse('SESSION_REFUSED')
      }
      if (
        ownedRegistration === null ||
        ownedFixtureId === null ||
        ownedChainKey === null ||
        !/^[A-Za-z0-9-]{1,64}$/.test(ownedFixtureId)
      ) {
        return refuse('SESSION_REFUSED')
      }
      if (!reserve(ownedChainKey)) return refuse('SESSION_REFUSED')
      try {
        const info: SessionInfo = {
          session: Object.freeze({}),
          fixtureId: ownedFixtureId,
          registration: ownedRegistration,
          key: ownedChainKey,
          phase: 'capturing',
          activeLease: null,
          activeRole: null,
          work: new Set(),
          seal: null,
          finalD: null,
          integratedE: null,
          sealedF: null,
        }
        sessions.set(info.session, info)
        return {
          ok: true,
          value: Object.freeze({
            session: info.session,
            workflow: workflowPort(info),
            verification: verificationPort(info),
            publication: publicationPort(info),
            integration: integrationPort(info),
            closure: closurePort(info),
          }),
        }
      } catch {
        return refuse('SESSION_REFUSED')
      }
    },
  }
}

export function readMeasuredSessionV1(session: object): ResultV1<SessionStateV1> {
  const info = sessions.get(session)
  return info === undefined ? refuse('SESSION_REFUSED') : { ok: true, value: stateOf(info) }
}
