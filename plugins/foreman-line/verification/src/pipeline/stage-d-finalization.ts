import {
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import type { JsonValue } from '../../../approval/src/index.js'
import { canonicalize, RECEIPT_SCHEMA_VERSION, sha256Hex } from '../../../approval/src/index.js'
import type { CorrelationContext } from '../../../contracts/src/index.js'
import type { BuildResult, DispatchOrder } from '../../../contracts/src/stages/c-dispatch.js'
import type {
  AdversarialFinding,
  HarnessClaimResult,
  VerificationVerdict,
} from '../../../contracts/src/stages/d-verification.js'
import { branchForParcel } from '../../../permission-profiles/src/emitter.js'
import { receiptPath, validateReceiptDocument } from '../../../receipts/src/index.js'
import {
  type AckV1,
  type CodeV1,
  createOfflineMeasuredWorkflowInstallationV1,
  type OwnerBundleV1,
  type RefV1,
  type RegistrationV1,
  type ResultV1,
  readMeasuredSessionV1,
  type SealV1,
} from '../../../receipts/src/measured-workflow-internal.js'
import {
  type CollectResult,
  collectAdversarialFindings,
  dispatchReview,
  type ReviewDispatchResult,
} from '../adversarial/index.js'
import {
  type HarnessResult,
  runHarness,
  type TestResults,
  writeClaimReceipt,
} from '../harness/index.js'
import { executeHumanGate, prepareHumanGate } from '../human-gate/index.js'
import { assembleVerdict, type Disposition, emitVerificationVerdict } from './index.js'

export interface ReviewExpectationV1 {
  readonly slotId: string
  readonly reviewerId: string
  readonly reviewedHeadSha: string
}

export interface OfflineExpectedV1 {
  readonly claims: readonly string[]
  readonly reviews: readonly ReviewExpectationV1[]
  readonly builderId: string
  readonly authorizedActorId: string
  readonly authorityRef: string
}

export interface OfflineReviewV1 {
  readonly slotId: string
  readonly reviewerId: string
  readonly reviewedHeadSha: string
  readonly rawText: string
}

export interface OfflineDispositionV1 {
  readonly slotId: string
  readonly findingIndex: number
  readonly findingDigest: string
  readonly disposition: 'accept' | 'rework'
  readonly note: string
}

export interface OfflineDecisionV1 {
  readonly actorId: string
  readonly authorityRef: string
  readonly decision: 'approve' | 'decline'
  readonly note: string
}

export interface OfflineMatrixResultV1 {
  readonly name: string
  readonly passed: boolean
  readonly evidence: string
}

export interface OfflineInputV1 {
  readonly domain: 'offline-fixture/v1'
  readonly fixtureId: string
  readonly registration: RegistrationV1
  readonly pluginRoot: string
  readonly specPath: string
  readonly order: DispatchOrder
  readonly buildResult: BuildResult
  readonly expected: OfflineExpectedV1
  readonly testResults: TestResults
  readonly matrixResults: readonly OfflineMatrixResultV1[]
  readonly reviews: readonly OfflineReviewV1[]
  readonly dispositions: readonly OfflineDispositionV1[]
  readonly decision: OfflineDecisionV1
  readonly ticketKey: string
  readonly targetStatus: string
  readonly denominatorDigest: string
}

export type FinalizationV1 = ResultV1<RefV1>

export interface OfflineDriverV1 {
  readonly domain: 'offline-fixture/v1'
  readonly fixtureId: string
  readonly session: object
  readonly runVerificationV1: () => Promise<ResultV1<null>>
  readonly closeAdmissionV1: () => ResultV1<null>
  readonly drainV1: () => Promise<ResultV1<null>>
  readonly publishFixtureMeasurementV1: () => ResultV1<RefV1>
}

interface ReceiptRow {
  readonly locator: string
  readonly absolutePath: string
  readonly document: Record<string, unknown>
}

interface EvidenceDigestV1 {
  readonly hash: string
  readonly subjectDigest: string
  readonly kind: unknown
  readonly stage: unknown
  readonly claimRef: unknown
  readonly subjectKind: unknown
}

interface GitResultV1 {
  readonly status: number
  readonly stdout: string
  readonly stderr: string
}

function pathParts(value: string): string[] {
  return value.split('\\').join('/').split('/').filter(Boolean)
}

interface OwnedContext {
  readonly input: OfflineInputV1
  readonly owner: OwnerBundleV1
  readonly repoRoot: string
  readonly pluginRoot: string
  readonly specAbsolutePath: string
  readonly key: {
    readonly rootDeviceId: string
    readonly rootFileId: string
    readonly workflowId: string
  }
  readonly expectedPlanDigest: string
  readonly initialRows: readonly ReceiptRow[]
  runPromise: Promise<ResultV1<null>> | null
  runResult: ResultV1<null> | null
  drained: boolean
  measurementRef: RefV1 | null
  verdictRef: RefV1 | null
  closureRef: RefV1 | null
  finalRef: RefV1 | null
  findingOffsets: Map<string, number>
  evidence: Map<string, EvidenceDigestV1>
  verdictEnvelopeDigest: string | null
}

const contexts = new WeakMap<object, OwnedContext>()
const MAX_STRING = 4096
const MAX_DEPTH = 20
const MAX_NODES = 131072
const MAX_TOTAL_STRING = 2 * 1024 * 1024
const MAX_RECEIPTS = 1024
const MAX_RECEIPT_BYTES = 1024 * 1024
const MAX_CHAIN_BYTES = 16 * 1024 * 1024
const REF_KEYS = ['hash', 'locator'] as const
const FINAL_SUBJECT_KEYS = [
  'version',
  'verifiedHeadSha',
  'buildReceiptRef',
  'verdictReceiptRef',
  'humanClosureReceiptRef',
  'telemetryReceiptRef',
  'denominatorDigest',
  'expectedPlanDigest',
  'coverage',
] as const

class Refusal extends Error {}

function fail<T>(code: CodeV1): ResultV1<T> {
  return { ok: false, code } as ResultV1<T>
}

function exact(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Refusal()
  const record = value as Record<string, unknown>
  const ownKeys = Object.keys(record)
  if (ownKeys.length !== keys.length || keys.some((key) => !Object.hasOwn(record, key)))
    throw new Refusal()
  return record
}

interface CaptureState {
  nodes: number
  strings: number
  active: Set<object>
  copies: Map<object, unknown>
  footprints: Map<object, { readonly nodes: number; readonly strings: number }>
}

function own(value: unknown, state: CaptureState, depth = 0): unknown {
  if (depth > MAX_DEPTH) throw new Refusal()
  if (typeof value === 'string') {
    state.nodes += 1
    state.strings += value.length
    if (value.length > MAX_STRING || state.strings > MAX_TOTAL_STRING) throw new Refusal()
    return value
  }
  if (value === null || typeof value === 'boolean') {
    state.nodes += 1
    if (state.nodes > MAX_NODES) throw new Refusal()
    return value
  }
  if (typeof value === 'number') {
    state.nodes += 1
    if (state.nodes > MAX_NODES) throw new Refusal()
    if (!Number.isFinite(value)) throw new Refusal()
    return value
  }
  if (typeof value !== 'object' || ArrayBuffer.isView(value)) throw new Refusal()
  if (state.active.has(value)) throw new Refusal()
  const prior = state.copies.get(value)
  if (prior !== undefined) {
    const footprint = state.footprints.get(value)
    if (footprint === undefined) throw new Refusal()
    state.nodes += footprint.nodes
    state.strings += footprint.strings
    if (state.nodes > MAX_NODES || state.strings > MAX_TOTAL_STRING) throw new Refusal()
    return prior
  }
  state.nodes += 1
  if (state.nodes > MAX_NODES) throw new Refusal()
  const startingNodes = state.nodes
  const startingStrings = state.strings
  state.active.add(value)
  try {
    const prototype = Object.getPrototypeOf(value)
    const array = Array.isArray(value)
    if (
      prototype !== Object.prototype &&
      prototype !== null &&
      (!array || prototype !== Array.prototype)
    )
      throw new Refusal()
    let length = 0
    if (array) {
      const lengthDescriptor = Object.getOwnPropertyDescriptor(value, 'length')
      if (
        lengthDescriptor === undefined ||
        !('value' in lengthDescriptor) ||
        !Number.isSafeInteger(lengthDescriptor.value) ||
        lengthDescriptor.value < 0 ||
        lengthDescriptor.value > 256
      )
        throw new Refusal()
      length = lengthDescriptor.value
    }
    const keys = Reflect.ownKeys(value)
    if (array && keys.length !== length + 1) throw new Refusal()
    state.nodes += keys.length
    if (state.nodes > MAX_NODES) throw new Refusal()
    const output: Record<string, unknown> | unknown[] = array ? [] : Object.create(null)
    state.copies.set(value, output)
    for (const key of keys) {
      if (array && key === 'length') continue
      if (typeof key !== 'string') throw new Refusal()
      const descriptor = Object.getOwnPropertyDescriptor(value, key)
      if (descriptor === undefined || !('value' in descriptor) || !descriptor.enumerable)
        throw new Refusal()
      state.strings += key.length
      if (key.length > MAX_STRING || state.strings > MAX_TOTAL_STRING) throw new Refusal()
      Object.defineProperty(output, key, {
        value: own(descriptor.value, state, depth + 1),
        enumerable: true,
        writable: true,
        configurable: true,
      })
    }
    state.footprints.set(value, {
      nodes: state.nodes - startingNodes,
      strings: state.strings - startingStrings,
    })
    return output
  } finally {
    state.active.delete(value)
  }
}

function capture(value: unknown): unknown {
  return own(value, {
    nodes: 0,
    strings: 0,
    active: new Set(),
    copies: new Map(),
    footprints: new Map(),
  })
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child)
    Object.freeze(value)
  }
  return value
}

type StringShape = 'uuid' | 'hash' | 'head' | 'slug'

function shapeMatches(value: string, shape: StringShape): boolean {
  if (shape === 'uuid') {
    if (value.length !== 36) return false
    for (let index = 0; index < value.length; index++) {
      const code = value.charCodeAt(index)
      const separator = index === 8 || index === 13 || index === 18 || index === 23
      if (
        separator
          ? code !== 45
          : !(
              (code >= 48 && code <= 57) ||
              (code >= 65 && code <= 70) ||
              (code >= 97 && code <= 102)
            )
      )
        return false
    }
    return true
  }
  const length = shape === 'hash' ? 64 : shape === 'head' ? 40 : value.length
  if (shape !== 'slug' && value.length !== length) return false
  for (const code of value) {
    const point = code.charCodeAt(0)
    const hex = (point >= 48 && point <= 57) || (point >= 97 && point <= 102)
    if (shape === 'hash' && !hex) return false
    if (shape === 'head' && !(hex || (point >= 65 && point <= 70))) return false
    if (
      shape === 'slug' &&
      !(
        (point >= 48 && point <= 57) ||
        (point >= 65 && point <= 90) ||
        (point >= 97 && point <= 122) ||
        point === 45
      )
    )
      return false
  }
  return true
}

function stringValue(value: unknown, shape?: StringShape): string {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > MAX_STRING ||
    (shape && !shapeMatches(value, shape))
  )
    throw new Refusal()
  return value
}

function refValue(value: unknown): RefV1 {
  const record = exact(value, REF_KEYS)
  const hash = stringValue(record.hash, 'hash')
  const locator = stringValue(record.locator)
  if (!locator.startsWith('docs/receipts/') || locator.includes('..') || locator.includes('\\'))
    throw new Refusal()
  return deepFreeze({ hash, locator })
}

function parseInput(raw: unknown): OfflineInputV1 {
  const value = capture(raw)
  const record = exact(value, [
    'domain',
    'fixtureId',
    'registration',
    'pluginRoot',
    'specPath',
    'order',
    'buildResult',
    'expected',
    'testResults',
    'matrixResults',
    'reviews',
    'dispositions',
    'decision',
    'ticketKey',
    'targetStatus',
    'denominatorDigest',
  ])
  if (record.domain !== 'offline-fixture/v1') throw new Refusal()
  const fixtureId = stringValue(record.fixtureId, 'slug')
  const registration = exact(record.registration, [
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
  ]) as unknown as RegistrationV1
  stringValue(registration.workflowId, 'uuid')
  stringValue(registration.correlationId)
  stringValue(registration.parcelRef)
  stringValue(registration.repoRoot)
  stringValue(registration.verifiedHeadSha, 'head')
  refValue(registration.dispatchReceiptRef)
  refValue(registration.buildReceiptRef)
  stringValue(registration.specDigest, 'hash')
  stringValue(registration.matrixDigest, 'hash')
  stringValue(registration.expectedPlanDigest, 'hash')
  const order = exact(record.order, [
    'parcelRef',
    'stepZeroRestatement',
    'routingDecisionRef',
    'injectedSkills',
  ]) as unknown as DispatchOrder
  stringValue(order.parcelRef)
  stringValue(order.stepZeroRestatement)
  stringValue(order.routingDecisionRef)
  if (
    !Array.isArray(order.injectedSkills) ||
    order.injectedSkills.some((item) => typeof item !== 'string')
  )
    throw new Refusal()
  const buildResult = exact(record.buildResult, [
    'branch',
    'commitShas',
    'touchedSurfaces',
  ]) as unknown as BuildResult
  stringValue(buildResult.branch)
  if (
    !Array.isArray(buildResult.commitShas) ||
    !Array.isArray(buildResult.touchedSurfaces) ||
    buildResult.commitShas.some((v) => typeof v !== 'string') ||
    buildResult.touchedSurfaces.some((v) => typeof v !== 'string')
  )
    throw new Refusal()
  const expectedRecord = exact(record.expected, [
    'claims',
    'reviews',
    'builderId',
    'authorizedActorId',
    'authorityRef',
  ])
  if (
    !Array.isArray(expectedRecord.claims) ||
    expectedRecord.claims.length === 0 ||
    expectedRecord.claims.length > 256
  )
    throw new Refusal()
  const claims = expectedRecord.claims.map((v) => stringValue(v))
  if (new Set(claims).size !== claims.length) throw new Refusal()
  if (
    !Array.isArray(expectedRecord.reviews) ||
    expectedRecord.reviews.length < 1 ||
    expectedRecord.reviews.length > 16
  )
    throw new Refusal()
  const reviewsExpected = expectedRecord.reviews.map((rawReview) => {
    const review = exact(rawReview, ['slotId', 'reviewerId', 'reviewedHeadSha'])
    return deepFreeze({
      slotId: stringValue(review.slotId, 'slug'),
      reviewerId: stringValue(review.reviewerId),
      reviewedHeadSha: stringValue(review.reviewedHeadSha, 'head'),
    })
  })
  if (
    new Set(reviewsExpected.map((review) => review.slotId)).size !== reviewsExpected.length ||
    new Set(reviewsExpected.map((review) => review.reviewerId)).size !== reviewsExpected.length
  )
    throw new Refusal()
  const expected = deepFreeze({
    claims,
    reviews: reviewsExpected,
    builderId: stringValue(expectedRecord.builderId),
    authorizedActorId: stringValue(expectedRecord.authorizedActorId),
    authorityRef: stringValue(expectedRecord.authorityRef),
  })
  if (reviewsExpected.some((review) => review.reviewerId === expected.builderId))
    throw new Refusal()
  const testRecord = exact(record.testResults, ['passed', 'failed'])
  if (
    !Array.isArray(testRecord.passed) ||
    !Array.isArray(testRecord.failed) ||
    testRecord.passed.length + testRecord.failed.length > 256
  )
    throw new Refusal()
  const testResults = deepFreeze({
    passed: testRecord.passed.map((v) => stringValue(v)),
    failed: testRecord.failed.map((v) => stringValue(v)),
  })
  if (
    new Set([...testResults.passed, ...testResults.failed]).size !==
    testResults.passed.length + testResults.failed.length
  )
    throw new Refusal()
  if (
    !Array.isArray(record.matrixResults) ||
    record.matrixResults.length === 0 ||
    record.matrixResults.length > 256
  )
    throw new Refusal()
  const matrixResults = record.matrixResults.map((rawMatrix) => {
    const matrix = exact(rawMatrix, ['name', 'passed', 'evidence'])
    if (typeof matrix.passed !== 'boolean') throw new Refusal()
    return deepFreeze({
      name: stringValue(matrix.name),
      passed: matrix.passed,
      evidence: stringValue(matrix.evidence),
    })
  })
  if (new Set(matrixResults.map((matrix) => matrix.name)).size !== matrixResults.length)
    throw new Refusal()
  if (!Array.isArray(record.reviews) || record.reviews.length !== reviewsExpected.length)
    throw new Refusal()
  const reviews = record.reviews.map((rawReview) => {
    const review = exact(rawReview, ['slotId', 'reviewerId', 'reviewedHeadSha', 'rawText'])
    return deepFreeze({
      slotId: stringValue(review.slotId, 'slug'),
      reviewerId: stringValue(review.reviewerId),
      reviewedHeadSha: stringValue(review.reviewedHeadSha, 'head'),
      rawText: stringValue(review.rawText),
    })
  })
  if (
    !reviews.every((review) =>
      reviewsExpected.some(
        (expectedReview) =>
          JSON.stringify(expectedReview) ===
          JSON.stringify({
            slotId: review.slotId,
            reviewerId: review.reviewerId,
            reviewedHeadSha: review.reviewedHeadSha,
          }),
      ),
    )
  )
    throw new Refusal()
  if (new Set(reviews.map((review) => review.slotId)).size !== reviewsExpected.length)
    throw new Refusal()
  if (!Array.isArray(record.dispositions) || record.dispositions.length > 256) throw new Refusal()
  const dispositions = record.dispositions.map((rawDisposition) => {
    const disposition = exact(rawDisposition, [
      'slotId',
      'findingIndex',
      'findingDigest',
      'disposition',
      'note',
    ])
    const findingIndex = disposition.findingIndex
    if (
      !Number.isSafeInteger(findingIndex) ||
      (findingIndex as number) < 0 ||
      (disposition.disposition !== 'accept' && disposition.disposition !== 'rework')
    )
      throw new Refusal()
    return deepFreeze({
      slotId: stringValue(disposition.slotId, 'slug'),
      findingIndex: findingIndex as number,
      findingDigest: stringValue(disposition.findingDigest, 'hash'),
      disposition: disposition.disposition as 'accept' | 'rework',
      note: stringValue(disposition.note),
    })
  })
  const decision = exact(record.decision, ['actorId', 'authorityRef', 'decision', 'note'])
  if (decision.decision !== 'approve' && decision.decision !== 'decline') throw new Refusal()
  const output: OfflineInputV1 = {
    domain: 'offline-fixture/v1' as const,
    fixtureId,
    registration: deepFreeze({ ...registration }),
    pluginRoot: stringValue(record.pluginRoot),
    specPath: stringValue(record.specPath),
    order: deepFreeze({ ...order }),
    buildResult: deepFreeze({
      ...buildResult,
      commitShas: [...buildResult.commitShas],
      touchedSurfaces: [...buildResult.touchedSurfaces],
    }),
    expected,
    testResults,
    matrixResults: deepFreeze(matrixResults),
    reviews: deepFreeze(reviews),
    dispositions: deepFreeze(dispositions),
    decision: deepFreeze({
      actorId: stringValue(decision.actorId),
      authorityRef: stringValue(decision.authorityRef),
      decision: decision.decision,
      note: stringValue(decision.note),
    }),
    ticketKey: stringValue(record.ticketKey),
    targetStatus: stringValue(record.targetStatus),
    denominatorDigest: stringValue(record.denominatorDigest, 'hash'),
  }
  return deepFreeze(output)
}

function safeFixturePath(pathValue: string, fixtureId: string, mustExist: boolean): string {
  const absolute = resolve(pathValue)
  const root = resolve(tmpdir())
  const rootPrefix =
    root.endsWith('\\') || root.endsWith('/')
      ? root
      : `${root}${process.platform === 'win32' ? '\\' : '/'}`
  if (!absolute.startsWith(rootPrefix) || !absolute.includes(`hro-p3a-fixture-${fixtureId}`))
    throw new Refusal()
  if (mustExist && !existsSync(absolute)) throw new Refusal()
  const real = resolve(absolute)
  let cursor = root
  const parts = pathParts(relative(root, absolute))
  for (const part of parts) {
    cursor = join(cursor, part)
    if (lstatSync(cursor).isSymbolicLink()) throw new Refusal()
  }
  return real
}

function canonicalDecimal(value: bigint, zeroAllowed: boolean): string {
  if (value < 0n || value > 18446744073709551615n || (!zeroAllowed && value === 0n))
    throw new Refusal()
  return value.toString(10)
}

function rowFor(
  repoRoot: string,
  workflowId: string,
  name: string,
  document: Record<string, unknown>,
): ReceiptRow {
  const locator = `docs/receipts/${workflowId}/${name}`
  return { locator, absolutePath: join(repoRoot, ...locator.split('/')), document }
}

function conforming(name: string): boolean {
  if (
    name.length < 15 ||
    !name.endsWith('.json') ||
    name.charCodeAt(6) !== 45 ||
    name.charCodeAt(8) !== 45
  )
    return false
  for (let index = 0; index < 6; index++) {
    const code = name.charCodeAt(index)
    if (code < 48 || code > 57) return false
  }
  if (!'ABCDEF'.includes(name[7] as string)) return false
  for (let index = 9; index < name.length - 5; index++) {
    const code = name.charCodeAt(index)
    if (!((code >= 48 && code <= 57) || (code >= 97 && code <= 122) || code === 45)) return false
  }
  return true
}

function readRows(repoRoot: string, workflowId: string): ReceiptRow[] {
  const directory = join(repoRoot, 'docs', 'receipts', workflowId)
  const names = readdirSync(directory).filter(conforming).sort()
  if (names.length > MAX_RECEIPTS) throw new Refusal()
  let aggregateBytes = 0n
  const sizes = names.map((name) => {
    const absolutePath = join(directory, name)
    const bytes = statSync(absolutePath, { bigint: true }).size
    if (bytes > BigInt(MAX_RECEIPT_BYTES)) throw new Refusal()
    aggregateBytes += bytes
    if (aggregateBytes > BigInt(MAX_CHAIN_BYTES)) throw new Refusal()
    return { name, absolutePath }
  })
  const rows = sizes.map(({ name, absolutePath }) =>
    rowFor(
      repoRoot,
      workflowId,
      name,
      JSON.parse(readFileSync(absolutePath, 'utf8')) as Record<string, unknown>,
    ),
  )
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] as ReceiptRow
    const result = validateReceiptDocument(row.document)
    if (!result.valid) throw new Refusal()
    if (row.document.sequence !== i) throw new Refusal()
    if (i === 0 && row.document.prevHash !== null) throw new Refusal()
    if (i > 0 && row.document.prevHash !== rows[i - 1]?.document.hash) throw new Refusal()
    const storedHash = row.document.hash
    const { hash: _hash, ...withoutHash } = row.document
    if (
      typeof storedHash !== 'string' ||
      sha256Hex(canonicalize(withoutHash as unknown as JsonValue)) !== storedHash
    )
      throw new Refusal()
    const correlation = row.document.correlation as Record<string, unknown>
    if (correlation.workflowId !== workflowId) throw new Refusal()
    const filename = receiptPath(
      workflowId,
      i,
      row.document.stage as 'A' | 'B' | 'C' | 'D' | 'E' | 'F',
      row.document.subjectKind as string,
    )
      .split('/')
      .pop()
    if (filename !== row.locator.split('/').pop()) throw new Refusal()
  }
  return rows
}

function refMatches(row: ReceiptRow, reference: RefV1): boolean {
  return row.locator === reference.locator && row.document.hash === reference.hash
}

function captureEvidence(ctx: OwnedContext, locator: string): EvidenceDigestV1 {
  const row = readRows(ctx.repoRoot, ctx.input.registration.workflowId).find(
    (candidate) => candidate.locator === locator,
  )
  if (row === undefined || typeof row.document.hash !== 'string') throw new Refusal()
  const evidence: EvidenceDigestV1 = {
    hash: row.document.hash,
    subjectDigest: sha256Hex(canonicalize(row.document.subject as JsonValue)),
    kind: row.document.kind,
    stage: row.document.stage,
    claimRef: row.document.claimRef,
    subjectKind: row.document.subjectKind,
  }
  ctx.evidence.set(locator, evidence)
  return evidence
}

function verifyCapturedEvidence(ctx: OwnedContext): void {
  const rows = readRows(ctx.repoRoot, ctx.input.registration.workflowId)
  for (const [locator, expected] of ctx.evidence) {
    const row = rows.find((candidate) => candidate.locator === locator)
    if (
      row === undefined ||
      row.document.hash !== expected.hash ||
      row.document.kind !== expected.kind ||
      row.document.stage !== expected.stage ||
      row.document.claimRef !== expected.claimRef ||
      row.document.subjectKind !== expected.subjectKind ||
      sha256Hex(canonicalize(row.document.subject as JsonValue)) !== expected.subjectDigest
    )
      throw new Refusal()
  }
  if (ctx.verdictEnvelopeDigest === null) throw new Refusal()
  const envelopePath = join(
    ctx.repoRoot,
    'docs',
    'receipts',
    ctx.input.registration.workflowId,
    'verification-verdict.envelope.json',
  )
  if (sha256Hex(readFileSync(envelopePath)) !== ctx.verdictEnvelopeDigest) throw new Refusal()
}

function verifyInitial(
  input: OfflineInputV1,
  repoRoot: string,
  specAbsolutePath: string,
  pluginRoot: string,
): ReceiptRow[] {
  const rows = readRows(repoRoot, input.registration.workflowId)
  if (
    rows.length < 4 ||
    !rows.some((row) => refMatches(row, input.registration.dispatchReceiptRef)) ||
    !rows.some((row) => refMatches(row, input.registration.buildReceiptRef))
  )
    throw new Refusal()
  const dispatch = rows.find((row) =>
    refMatches(row, input.registration.dispatchReceiptRef),
  ) as ReceiptRow
  const build = rows.find((row) =>
    refMatches(row, input.registration.buildReceiptRef),
  ) as ReceiptRow
  if (!['A', 'B', 'C'].every((stage, index) => rows[index]?.document.stage === stage))
    throw new Refusal()
  if (
    dispatch.document.stage !== 'C' ||
    dispatch.document.sequence !== 2 ||
    build.document.stage !== 'D' ||
    build.document.sequence !== 3 ||
    build.document.subjectKind !== 'BuildResult' ||
    sha256Hex(canonicalize(build.document.subject as JsonValue)) !==
      sha256Hex(canonicalize(input.buildResult as unknown as JsonValue))
  )
    throw new Refusal()
  const dispatchCorrelation = dispatch.document.correlation as Record<string, unknown>
  const buildCorrelation = build.document.correlation as Record<string, unknown>
  if (
    dispatchCorrelation.workflowId !== input.registration.workflowId ||
    buildCorrelation.workflowId !== input.registration.workflowId ||
    dispatchCorrelation.correlationId !== input.registration.correlationId ||
    buildCorrelation.correlationId !== input.registration.correlationId
  )
    throw new Refusal()
  if (
    input.order.parcelRef !== input.registration.parcelRef ||
    input.buildResult.branch.length === 0
  )
    throw new Refusal()
  const specDigest = sha256Hex(readFileSync(specAbsolutePath))
  const matrixDigest = sha256Hex(
    readFileSync(join(pluginRoot, 'skill-injection', 'skill-injection.yaml')),
  )
  if (
    specDigest !== input.registration.specDigest ||
    matrixDigest !== input.registration.matrixDigest
  )
    throw new Refusal()
  if (resolve(input.registration.repoRoot) !== resolve(repoRoot)) throw new Refusal()
  return rows
}

function assertLiveRoot(ctx: OwnedContext): void {
  const canonicalRoot = safeFixturePath(ctx.repoRoot, ctx.input.fixtureId, true)
  if (canonicalRoot !== ctx.repoRoot) throw new Refusal()
  const current = statSync(canonicalRoot, { bigint: true })
  const currentKey = {
    rootDeviceId: canonicalDecimal(current.dev, true),
    rootFileId: canonicalDecimal(current.ino, false),
  }
  if (
    currentKey.rootDeviceId !== ctx.key.rootDeviceId ||
    currentKey.rootFileId !== ctx.key.rootFileId
  )
    throw new Refusal()
  safeFixturePath(ctx.pluginRoot, ctx.input.fixtureId, true)
  safeFixturePath(ctx.specAbsolutePath, ctx.input.fixtureId, true)
  safeFixturePath(
    join(ctx.repoRoot, 'docs', 'receipts', ctx.input.registration.workflowId),
    ctx.input.fixtureId,
    true,
  )
}

function resultOf(
  errorCode:
    | 'EVIDENCE_REFUSED'
    | 'COVERAGE_INCOMPLETE'
    | 'CHAIN_REFUSED'
    | 'WRITE_REFUSED'
    | 'WRITE_UNCERTAIN'
    | 'PHASE_REFUSED'
    | 'SESSION_REFUSED',
): ResultV1<null> {
  return fail(errorCode)
}

function actualClaimRows(ctx: OwnedContext, claims: readonly HarnessClaimResult[]): void {
  const rows = readRows(ctx.repoRoot, ctx.input.registration.workflowId)
  for (const claim of claims) {
    const row = rows.find(
      (candidate) =>
        candidate.document.claimRef === claim.claim &&
        candidate.document.subjectKind === 'HarnessClaimResult',
    )
    if (
      row === undefined ||
      row.document.kind !== 'claim' ||
      JSON.stringify(row.document.subject) !==
        JSON.stringify({ claim: claim.claim, passed: claim.passed, evidence: claim.evidence })
    )
      throw new Refusal()
  }
  const actual = claims.map((claim) => claim.claim).sort()
  const expected = [...ctx.input.expected.claims].sort()
  if (JSON.stringify(actual) !== JSON.stringify(expected) || claims.some((claim) => !claim.passed))
    throw new Refusal()
}

function createGitAdapter(
  ctx: OwnedContext,
): (args: readonly string[], options: { readonly cwd: string }) => GitResultV1 {
  const branch = branchForParcel(ctx.input.registration.parcelRef)
  const expectedRoot = join(ctx.repoRoot, '.hro-offline', ctx.input.fixtureId)
  mkdirSync(expectedRoot, { recursive: true })
  return (args, options) => {
    if (options.cwd !== ctx.repoRoot) return { status: 1, stdout: '', stderr: 'unexpected cwd' }
    if (
      args.length === 4 &&
      args[0] === 'rev-parse' &&
      args[1] === '--verify' &&
      args[2] === '--quiet' &&
      args[3] === `refs/heads/${branch}`
    )
      return { status: 0, stdout: `${ctx.input.registration.verifiedHeadSha}\n`, stderr: '' }
    if (args.length === 4 && args[0] === 'worktree' && args[1] === 'add' && args[3] === branch) {
      const pathValue = args[2] as string
      if (
        !pathValue.startsWith(`${expectedRoot}${process.platform === 'win32' ? '\\' : '/'}`) ||
        existsSync(pathValue)
      )
        return { status: 1, stdout: '', stderr: 'unexpected worktree' }
      mkdirSync(pathValue)
      return { status: 0, stdout: '', stderr: '' }
    }
    return { status: 1, stdout: '', stderr: 'unsupported git command' }
  }
}

function expectedFindingDisposition(
  ctx: OwnedContext,
  findings: readonly AdversarialFinding[],
): Disposition[] {
  const output: Disposition[] = []
  for (const disposition of ctx.input.dispositions) {
    const review = ctx.input.expected.reviews.find((item) => item.slotId === disposition.slotId)
    if (review === undefined) throw new Refusal()
    const offset = ctx.findingOffsets.get(review.slotId)
    if (offset === undefined) throw new Refusal()
    const finding = findings[disposition.findingIndex + offset]
    if (
      finding === undefined ||
      sha256Hex(canonicalize(finding as unknown as JsonValue)) !== disposition.findingDigest
    )
      throw new Refusal()
    output.push({
      findingIndex: disposition.findingIndex + offset,
      disposition: disposition.disposition,
      note: disposition.note,
    })
  }
  return output
}

async function executeVerification(
  ctx: OwnedContext,
  work: object,
  lease: object,
): Promise<ResultV1<null>> {
  const input = ctx.input
  try {
    assertLiveRoot(ctx)
    const harness: HarnessResult = await runHarness({
      workflowId: input.registration.workflowId,
      order: input.order,
      buildResult: input.buildResult,
      specPath: ctx.specAbsolutePath,
      testResults: input.testResults,
      matrixChecks: Object.fromEntries(
        input.matrixResults.map((result) => [
          result.name,
          async () => ({ passed: result.passed, evidence: result.evidence }),
        ]),
      ),
      repoRoot: ctx.repoRoot,
      pluginRoot: ctx.pluginRoot,
    })
    actualClaimRows(ctx, harness.claims)
    const findings: AdversarialFinding[] = []
    let findingOffset = 0
    for (const expectedReview of input.expected.reviews) {
      const review = input.reviews.find((candidate) => candidate.slotId === expectedReview.slotId)
      if (
        review === undefined ||
        review.reviewerId !== expectedReview.reviewerId ||
        review.reviewedHeadSha !== expectedReview.reviewedHeadSha ||
        review.reviewedHeadSha !== input.registration.verifiedHeadSha
      )
        throw new Refusal()
      const worktreePath = join(
        ctx.repoRoot,
        '.hro-offline',
        input.fixtureId,
        expectedReview.slotId,
      )
      assertLiveRoot(ctx)
      const dispatchResult: ReviewDispatchResult = dispatchReview(
        {
          workflowId: input.registration.workflowId,
          parcelRef: input.registration.parcelRef,
          specPath: input.specPath,
          surfaces: input.buildResult.touchedSurfaces,
          worktreePath,
          repoRoot: ctx.repoRoot,
          pluginRoot: ctx.pluginRoot,
        },
        { gitFn: createGitAdapter(ctx) },
      )
      if (
        dispatchResult.worktreePath !== worktreePath ||
        dispatchResult.branch !== branchForParcel(input.registration.parcelRef) ||
        dispatchResult.receiptLocator.length === 0
      )
        throw new Refusal()
      const dispatchEvidence = captureEvidence(ctx, dispatchResult.receiptLocator)
      const dispatchRow = readRows(ctx.repoRoot, input.registration.workflowId).find(
        (row) => row.locator === dispatchResult.receiptLocator,
      )
      if (
        dispatchRow === undefined ||
        dispatchEvidence.claimRef !== 'review-dispatch' ||
        dispatchEvidence.subjectKind !== 'ReviewDispatch' ||
        sha256Hex(canonicalize(dispatchRow.document.subject as JsonValue)) !==
          sha256Hex(
            canonicalize({
              parcelRef: input.registration.parcelRef,
              worktreePath,
              branch: dispatchResult.branch,
              kickstarterPath: dispatchResult.kickstarterPath,
              profile: 'reviewer-readonly',
              injectedSkills: dispatchResult.injectedSkills,
            } as unknown as JsonValue),
          )
      )
        throw new Refusal()
      assertLiveRoot(ctx)
      const collected: CollectResult = collectAdversarialFindings(
        input.registration.workflowId,
        review.rawText,
        { repoRoot: ctx.repoRoot },
      )
      if (!collected.ok) throw new Refusal()
      const findingsEvidence = captureEvidence(ctx, collected.receiptLocator)
      const findingsRow = readRows(ctx.repoRoot, input.registration.workflowId).find(
        (row) => row.locator === collected.receiptLocator,
      )
      if (
        findingsRow === undefined ||
        findingsEvidence.claimRef !== 'adversarial-findings' ||
        findingsEvidence.subjectKind !== 'AdversarialFindings' ||
        sha256Hex(canonicalize(findingsRow.document.subject as JsonValue)) !==
          sha256Hex(canonicalize({ findings: collected.findings } as unknown as JsonValue))
      )
        throw new Refusal()
      ctx.findingOffsets.set(expectedReview.slotId, findingOffset)
      findingOffset += collected.findings.length
      findings.push(...collected.findings)
    }
    const verdict: VerificationVerdict = assembleVerdict({
      harnessClaims: harness.claims,
      adversarialFindings: findings,
      dispositions: expectedFindingDisposition(ctx, findings),
    })
    if (verdict.verdict !== 'pass') throw new Refusal()
    assertLiveRoot(ctx)
    const verdictOutput = emitVerificationVerdict(input.registration.workflowId, verdict, null, {
      repoRoot: ctx.repoRoot,
    })
    const verdictRow = readRows(ctx.repoRoot, input.registration.workflowId).find(
      (row) => row.locator === verdictOutput.receiptLocator,
    )
    if (verdictRow === undefined) throw new Refusal()
    captureEvidence(ctx, verdictOutput.receiptLocator)
    ctx.verdictEnvelopeDigest = sha256Hex(
      readFileSync(join(ctx.repoRoot, ...verdictOutput.envelopePath.split('/'))),
    )
    ctx.verdictRef = { hash: String(verdictRow.document.hash), locator: verdictRow.locator }
    assertLiveRoot(ctx)
    const pkg = prepareHumanGate({
      workflowId: input.registration.workflowId,
      ticketKey: input.ticketKey,
      targetStatus: input.targetStatus,
      dispositions: expectedFindingDisposition(ctx, findings),
      repoRoot: ctx.repoRoot,
    })
    if (
      input.decision.actorId !== input.expected.authorizedActorId ||
      input.decision.authorityRef !== input.expected.authorityRef
    )
      throw new Refusal()
    const transport = {
      getTransitions: async (issueKey: string) =>
        issueKey === input.ticketKey
          ? [{ id: 'offline-transition', name: input.targetStatus, toStatus: input.targetStatus }]
          : [],
      transitionIssue: async (issueKey: string, transitionId: string) => {
        if (issueKey !== input.ticketKey || transitionId !== 'offline-transition')
          throw new Refusal()
      },
      addComment: async (issueKey: string) => {
        if (issueKey !== input.ticketKey) throw new Refusal()
        return 'offline-comment'
      },
    }
    assertLiveRoot(ctx)
    const gate = await executeHumanGate(
      pkg,
      {
        decision: input.decision.decision,
        decidedBy: input.decision.actorId,
        note: input.decision.note,
      },
      { transport },
    )
    if (gate.kind !== 'closed' || input.decision.decision !== 'approve') throw new Refusal()
    const closureLocator = gate.closureReceiptLocator
    const closureRow = readRows(ctx.repoRoot, input.registration.workflowId).find(
      (row) => row.locator === closureLocator,
    )
    if (closureRow === undefined) throw new Refusal()
    captureEvidence(ctx, closureLocator)
    const closureSubject = closureRow.document.subject as Record<string, unknown>
    const approvalLocator = closureSubject.approvalReceiptLocator
    if (typeof approvalLocator !== 'string') throw new Refusal()
    captureEvidence(ctx, approvalLocator)
    const approvalRow = readRows(ctx.repoRoot, input.registration.workflowId).find(
      (row) => row.locator === approvalLocator,
    )
    const approvalSubject = approvalRow?.document.subject as Record<string, unknown> | undefined
    if (
      approvalRow === undefined ||
      approvalSubject === undefined ||
      approvalSubject.decision !== 'approved' ||
      approvalSubject.decidedBy !== input.decision.actorId ||
      approvalSubject.ticketKey !== input.ticketKey ||
      approvalSubject.requestedStatus !== input.targetStatus
    )
      throw new Refusal()
    if (
      closureSubject.ticketKey !== input.ticketKey ||
      closureSubject.summaryPath === undefined ||
      closureSubject.verdictReceipt === undefined
    )
      throw new Refusal()
    ctx.closureRef = { hash: String(closureRow.document.hash), locator: closureLocator }
    if (ctx.closureRef === null || ctx.verdictRef === null) throw new Refusal()
    const completed = ctx.owner.workflow.completeWorkV1(work)
    if (!completed.ok) throw new Refusal()
    const ended = ctx.owner.workflow.endWriterV1(lease)
    if (!ended.ok) throw new Refusal()
    return { ok: true, value: null }
  } catch {
    ctx.owner.workflow.holdV1(lease)
    ctx.owner.workflow.completeWorkV1(work)
    ctx.owner.workflow.endWriterV1(lease)
    return resultOf('EVIDENCE_REFUSED')
  }
}

function buildContext(input: OfflineInputV1): OwnedContext {
  const repoRoot = safeFixturePath(input.registration.repoRoot, input.fixtureId, true)
  if (pathParts(resolve(repoRoot)).pop() !== `hro-p3a-fixture-${input.fixtureId}`)
    throw new Refusal()
  const pluginRoot = safeFixturePath(input.pluginRoot, input.fixtureId, true)
  const specAbsolutePath = safeFixturePath(join(repoRoot, input.specPath), input.fixtureId, true)
  const stat = statSync(repoRoot, { bigint: true })
  const key = {
    rootDeviceId: canonicalDecimal(stat.dev, true),
    rootFileId: canonicalDecimal(stat.ino, false),
    workflowId: input.registration.workflowId.toLowerCase(),
  }
  const initialRows = verifyInitial(input, repoRoot, specAbsolutePath, pluginRoot)
  const expectedPlanDigest = sha256Hex(canonicalize(input.expected as unknown as JsonValue))
  if (expectedPlanDigest !== input.registration.expectedPlanDigest) throw new Refusal()
  const created = createOfflineMeasuredWorkflowInstallationV1().createSessionV1(
    input.registration,
    input.fixtureId,
    key,
  )
  if (!created.ok) throw new Refusal()
  return {
    input,
    owner: created.value,
    repoRoot,
    pluginRoot,
    specAbsolutePath,
    key,
    expectedPlanDigest,
    initialRows,
    runPromise: null,
    runResult: null,
    drained: false,
    measurementRef: null,
    verdictRef: null,
    closureRef: null,
    finalRef: null,
    findingOffsets: new Map(),
    evidence: new Map(),
    verdictEnvelopeDigest: null,
  }
}

export function createProductionMeasuredVerificationV1(_input: unknown): {
  ok: false
  code: 'PREREQUISITE_UNAVAILABLE'
} {
  return { ok: false, code: 'PREREQUISITE_UNAVAILABLE' }
}

export function createOfflineMeasuredVerificationV1(input: unknown): ResultV1<OfflineDriverV1> {
  try {
    const owned = buildContext(parseInput(input))
    const runVerificationV1 = (): Promise<ResultV1<null>> => {
      if (owned.runPromise !== null) return owned.runPromise
      const work = owned.owner.workflow.admitWorkV1()
      const lease = owned.owner.workflow.beginWriterV1()
      if (!work.ok || !lease.ok) {
        owned.runResult = resultOf('PHASE_REFUSED')
        return Promise.resolve(owned.runResult)
      }
      owned.runPromise = executeVerification(owned, work.value, lease.value).then((result) => {
        owned.runResult = result
        return result
      })
      return owned.runPromise
    }
    const closeAdmissionV1 = (): ResultV1<null> => owned.owner.workflow.closeAdmissionV1()
    const drainV1 = async (): Promise<ResultV1<null>> => {
      if (owned.runPromise === null) return resultOf('PHASE_REFUSED')
      const result = await owned.runPromise
      if (!result.ok) return result
      const drained = owned.owner.workflow.acknowledgeDrainV1()
      if (!drained.ok) return drained
      owned.drained = true
      return { ok: true, value: null }
    }
    const publishFixtureMeasurementV1 = (): ResultV1<RefV1> => {
      if (!owned.drained || owned.measurementRef !== null) return fail('PHASE_REFUSED')
      const lease = owned.owner.publication.beginWriterV1()
      if (!lease.ok) return lease
      try {
        const rows = readRows(owned.repoRoot, owned.input.registration.workflowId)
        const tip = rows[rows.length - 1]
        if (tip === undefined) throw new Refusal()
        const correlation = tip.document.correlation as CorrelationContext
        assertLiveRoot(owned)
        const locator = writeClaimReceipt({
          workflowId: owned.input.registration.workflowId,
          repoRoot: owned.repoRoot,
          claimRef: 'offline-measurement',
          subjectKind: 'OfflineMeasuredFixture',
          subject: {
            version: 'hro-offline-measurement/v1',
            fixtureId: owned.input.fixtureId,
            denominatorDigest: owned.input.denominatorDigest,
            coverage: 'complete',
          },
          sequence: Number(tip.document.sequence) + 1,
          prevHash: String(tip.document.hash),
          correlation,
        })
        const measurement = readRows(owned.repoRoot, owned.input.registration.workflowId).find(
          (row) => row.locator === locator,
        )
        if (measurement === undefined) throw new Refusal()
        const ref = { hash: String(measurement.document.hash), locator }
        const registered: SealV1 = {
          workflowId: owned.input.registration.workflowId,
          correlationId: String(correlation.correlationId),
          verifiedHeadSha: owned.input.registration.verifiedHeadSha,
          telemetryReceiptRef: ref,
          denominatorDigest: owned.input.denominatorDigest,
          coverage: 'complete',
        }
        const accepted = owned.owner.publication.registerSealV1(lease.value, registered)
        if (!accepted.ok) throw new Refusal()
        const ended = owned.owner.publication.endWriterV1(lease.value)
        if (!ended.ok) throw new Refusal()
        owned.measurementRef = ref
        return { ok: true, value: ref }
      } catch {
        owned.owner.publication.holdV1(lease.value)
        owned.owner.publication.endWriterV1(lease.value)
        return fail('WRITE_REFUSED')
      }
    }
    const driver: OfflineDriverV1 = Object.freeze({
      domain: 'offline-fixture/v1',
      fixtureId: owned.input.fixtureId,
      session: owned.owner.session,
      runVerificationV1,
      closeAdmissionV1,
      drainV1,
      publishFixtureMeasurementV1,
    })
    contexts.set(driver.session, owned)
    return { ok: true, value: driver }
  } catch {
    return fail('PREREQUISITE_UNAVAILABLE')
  }
}

export function finalizeMeasuredStageDV1(session: object): FinalizationV1 {
  const context = contexts.get(session)
  if (context === undefined) return fail('SESSION_REFUSED')
  const state = readMeasuredSessionV1(session)
  if (!state.ok) return state
  if (state.value.phase === 'finalized-D' && context.finalRef !== null) {
    try {
      assertLiveRoot(context)
      verifyInitial(context.input, context.repoRoot, context.specAbsolutePath, context.pluginRoot)
      verifyCapturedEvidence(context)
      const rows = readRows(context.repoRoot, context.input.registration.workflowId)
      const tip = rows[rows.length - 1]
      if (
        tip === undefined ||
        tip.locator !== context.finalRef.locator ||
        tip.document.hash !== context.finalRef.hash
      )
        return fail('CHAIN_REFUSED')
      return { ok: true, value: context.finalRef }
    } catch {
      return fail('CHAIN_REFUSED')
    }
  }
  if (
    state.value.phase !== 'publishing' ||
    context.runResult?.ok !== true ||
    context.measurementRef === null ||
    context.verdictRef === null ||
    context.closureRef === null
  )
    return fail('PHASE_REFUSED')
  const lease = context.owner.verification.beginWriterV1()
  if (!lease.ok) return lease
  let writeAttempted = false
  try {
    assertLiveRoot(context)
    verifyInitial(context.input, context.repoRoot, context.specAbsolutePath, context.pluginRoot)
    verifyCapturedEvidence(context)
    const rows = readRows(context.repoRoot, context.input.registration.workflowId)
    const tip = rows[rows.length - 1]
    if (tip === undefined || !refMatches(tip, context.measurementRef)) throw new Refusal()
    const correlation = tip.document.correlation as CorrelationContext
    const subject = {
      version: 'hro-measured-d/v1',
      verifiedHeadSha: context.input.registration.verifiedHeadSha,
      buildReceiptRef: context.input.registration.buildReceiptRef,
      verdictReceiptRef: context.verdictRef,
      humanClosureReceiptRef: context.closureRef,
      telemetryReceiptRef: context.measurementRef,
      denominatorDigest: context.input.denominatorDigest,
      expectedPlanDigest: context.expectedPlanDigest,
      coverage: 'complete',
    }
    if (Object.keys(subject).sort().join('|') !== [...FINAL_SUBJECT_KEYS].sort().join('|'))
      throw new Refusal()
    const draft = {
      schemaVersion: RECEIPT_SCHEMA_VERSION,
      kind: 'stage' as const,
      stage: 'D' as const,
      claimRef: null,
      correlation,
      sequence: Number(tip.document.sequence) + 1,
      prevHash: tip.document.hash,
      timestamp: new Date().toISOString(),
      subjectKind: 'MeasuredVerificationHandoff',
      subject,
      signature: null,
    }
    const document = { ...draft, hash: sha256Hex(canonicalize(draft as unknown as JsonValue)) }
    const locator = receiptPath(
      context.input.registration.workflowId,
      draft.sequence,
      'D',
      'MeasuredVerificationHandoff',
    )
    const absolutePath = join(context.repoRoot, ...locator.split('/'))
    mkdirSync(dirname(absolutePath), { recursive: true })
    assertLiveRoot(context)
    writeAttempted = true
    writeFileSync(absolutePath, `${JSON.stringify(document, null, 2)}\n`, {
      encoding: 'utf8',
      flag: 'wx',
    })
    const reread = readRows(context.repoRoot, context.input.registration.workflowId)
    const row = reread.find((candidate) => candidate.locator === locator)
    if (row === undefined || JSON.stringify(row.document.subject) !== JSON.stringify(subject))
      throw new Refusal()
    const ack: AckV1 = {
      stage: 'D',
      receiptRef: { hash: String(row.document.hash), locator },
      predecessorRef: context.measurementRef,
      sequence: draft.sequence,
      verifiedHeadSha: context.input.registration.verifiedHeadSha,
      subjectDigest: sha256Hex(canonicalize(subject as unknown as JsonValue)),
    }
    const accepted = context.owner.verification.acknowledgeFinalDV1(lease.value, ack)
    if (!accepted.ok) throw new Refusal()
    const ended = context.owner.verification.endWriterV1(lease.value)
    if (!ended.ok) throw new Refusal()
    context.finalRef = ack.receiptRef
    return { ok: true, value: ack.receiptRef }
  } catch (error) {
    context.owner.verification.holdV1(lease.value)
    context.owner.verification.endWriterV1(lease.value)
    if (!writeAttempted) return fail('CHAIN_REFUSED')
    return error instanceof Refusal ? fail('WRITE_REFUSED') : fail('WRITE_UNCERTAIN')
  }
}
