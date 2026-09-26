import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import {
  type AckV1,
  createOfflineMeasuredWorkflowInstallationV1,
  type RegistrationV1,
  type SealV1,
} from '../src/measured-workflow-internal.js'

function registration(workflowId = randomUUID()): RegistrationV1 {
  const ref = (sequence: number, stage: string) => ({
    hash: 'a'.repeat(64),
    locator: `docs/receipts/${workflowId}/${String(sequence).padStart(6, '0')}-${stage}-fixture.json`,
  })
  return {
    workflowId,
    correlationId: `correlation-${workflowId}`,
    parcelRef: 'HRO-P3A',
    repoRoot: `C:\\temp\\hro-p3a-${workflowId}`,
    verifiedHeadSha: 'b'.repeat(40),
    dispatchReceiptRef: ref(0, 'C'),
    buildReceiptRef: ref(1, 'C'),
    specDigest: 'c'.repeat(64),
    matrixDigest: 'd'.repeat(64),
    expectedPlanDigest: 'e'.repeat(64),
  }
}

function key(workflowId: string, suffix = '1') {
  return { rootDeviceId: '0', rootFileId: suffix, workflowId }
}

function open() {
  const input = registration()
  const result = createOfflineMeasuredWorkflowInstallationV1().createSessionV1(
    input,
    'fixture-a',
    key(input.workflowId),
  )
  assert.equal(result.ok, true)
  if (!result.ok) throw new Error('session refused')
  return { input, result: result.value }
}

function ref(sequence: number): { hash: string; locator: string } {
  return {
    hash: String(sequence).repeat(64).slice(0, 64),
    locator: `docs/receipts/x/${String(sequence).padStart(6, '0')}-D-x.json`,
  }
}

function ack(
  stage: AckV1['stage'],
  sequence: number,
  predecessorRef: AckV1['predecessorRef'],
): AckV1 {
  return {
    stage,
    receiptRef: ref(sequence),
    predecessorRef,
    sequence,
    verifiedHeadSha: 'b'.repeat(40),
    subjectDigest: 'f'.repeat(64),
  }
}

test('registry exposes only the private setup seam and starts a frozen capturing session', () => {
  const { result } = open()
  const state = result.workflow.readStateV1()
  assert.equal(state.ok, true)
  if (!state.ok) return
  assert.equal(state.value.domain, 'offline-fixture/v1')
  assert.equal(state.value.fixtureId, 'fixture-a')
  assert.equal(state.value.phase, 'capturing')
  assert.equal(state.value.busy, false)
  assert.equal(state.value.outstandingWork, 0)
  assert.equal(state.value.seal, null)
  assert.equal(state.value.finalD, null)
  assert.equal(state.value.integratedE, null)
  assert.equal(state.value.sealedF, null)
  assert.equal(Object.isFrozen(state.value.registration), true)
  assert.equal(Object.isFrozen(result.session), true)
  assert.equal(Object.keys(result.session).length, 0)
})

test('workflow work tokens are single-use and close/drain gates are ordered', () => {
  const { result } = open()
  const work = result.workflow.admitWorkV1()
  assert.equal(work.ok, true)
  if (!work.ok) return
  assert.deepEqual(result.workflow.completeWorkV1(work.value), { ok: true, value: null })
  assert.deepEqual(result.workflow.completeWorkV1(work.value), {
    ok: false,
    code: 'SESSION_REFUSED',
  })
  assert.deepEqual(result.workflow.closeAdmissionV1(), { ok: true, value: null })
  assert.deepEqual(result.workflow.admitWorkV1(), { ok: false, code: 'PHASE_REFUSED' })
  assert.deepEqual(result.workflow.acknowledgeDrainV1(), { ok: true, value: null })
  assert.deepEqual(result.workflow.acknowledgeDrainV1(), { ok: false, code: 'PHASE_REFUSED' })
})

test('role-separated leases enforce phase, issuer, stale, and cross-session ownership', () => {
  const first = open().result
  const second = open().result
  const workflowLease = first.workflow.beginWriterV1()
  assert.equal(workflowLease.ok, true)
  if (!workflowLease.ok) return
  assert.deepEqual(first.verification.endWriterV1(workflowLease.value), {
    ok: false,
    code: 'SESSION_REFUSED',
  })
  assert.deepEqual(second.workflow.endWriterV1(workflowLease.value), {
    ok: false,
    code: 'SESSION_REFUSED',
  })
  assert.deepEqual(first.workflow.endWriterV1(workflowLease.value), { ok: true, value: null })
  assert.deepEqual(first.workflow.endWriterV1(workflowLease.value), {
    ok: false,
    code: 'SESSION_REFUSED',
  })
  assert.deepEqual(first.verification.beginWriterV1(), { ok: false, code: 'PHASE_REFUSED' })
})

test('seal and D/E/F acknowledgements enforce exact predecessors and phase progression', () => {
  const { result, input } = open()
  assert.deepEqual(result.workflow.closeAdmissionV1(), { ok: true, value: null })
  assert.deepEqual(result.workflow.acknowledgeDrainV1(), { ok: true, value: null })
  const sealLease = result.publication.beginWriterV1()
  assert.equal(sealLease.ok, true)
  if (!sealLease.ok) return
  const seal: SealV1 = {
    workflowId: input.workflowId,
    correlationId: input.correlationId,
    verifiedHeadSha: input.verifiedHeadSha,
    telemetryReceiptRef: ref(7),
    denominatorDigest: '1'.repeat(64),
    coverage: 'complete',
  }
  assert.deepEqual(result.publication.registerSealV1(sealLease.value, { ...seal, extra: true }), {
    ok: false,
    code: 'EVIDENCE_REFUSED',
  })
  assert.deepEqual(result.publication.registerSealV1(sealLease.value, seal), {
    ok: true,
    value: null,
  })
  assert.deepEqual(result.publication.endWriterV1(sealLease.value), { ok: true, value: null })
  const dLease = result.verification.beginWriterV1()
  assert.equal(dLease.ok, true)
  if (!dLease.ok) return
  const d = ack('D', 8, ref(7))
  assert.deepEqual(result.verification.acknowledgeFinalDV1(dLease.value, d), {
    ok: true,
    value: null,
  })
  assert.deepEqual(result.verification.endWriterV1(dLease.value), { ok: true, value: null })
  const eLease = result.integration.beginWriterV1()
  assert.equal(eLease.ok, true)
  if (!eLease.ok) return
  const e = ack('E', 9, d.receiptRef)
  assert.deepEqual(result.integration.acknowledgeEV1(eLease.value, e), { ok: true, value: null })
  assert.deepEqual(result.integration.endWriterV1(eLease.value), { ok: true, value: null })
  const fLease = result.closure.beginWriterV1()
  assert.equal(fLease.ok, true)
  if (!fLease.ok) return
  assert.deepEqual(result.closure.acknowledgeFV1(fLease.value, ack('F', 10, e.receiptRef)), {
    ok: true,
    value: null,
  })
  assert.deepEqual(result.closure.endWriterV1(fLease.value), { ok: true, value: null })
  assert.equal(result.closure.readStateV1().ok, true)
})

test('duplicate canonical root/workflow admission refuses across installations while distinct workflows survive', () => {
  const input = registration()
  const first = createOfflineMeasuredWorkflowInstallationV1().createSessionV1(
    input,
    'fixture-a',
    key(input.workflowId),
  )
  assert.equal(first.ok, true)
  const duplicate = createOfflineMeasuredWorkflowInstallationV1().createSessionV1(
    input,
    'fixture-b',
    key(input.workflowId),
  )
  assert.deepEqual(duplicate, { ok: false, code: 'SESSION_REFUSED' })
  const otherWorkflowId = randomUUID()
  const distinct = createOfflineMeasuredWorkflowInstallationV1().createSessionV1(
    { ...input, workflowId: otherWorkflowId },
    'fixture-c',
    key(otherWorkflowId, '2'),
  )
  assert.equal(distinct.ok, true)
})

test('capture rejects unknown keys, cycles, accessors, nonfinite values, aliases, and one-over strings', () => {
  const installation = createOfflineMeasuredWorkflowInstallationV1()
  const input = registration()
  const cases: unknown[] = [
    { ...input, extra: true },
    (() => {
      const value: Record<string, unknown> = {}
      value.self = value
      return value
    })(),
    (() => {
      const value = { ...input }
      Object.defineProperty(value, 'extra', { get: () => true })
      return value
    })(),
    { ...input, correlationId: Number.NaN },
    { ...input, correlationId: 'x'.repeat(4097) },
  ]
  for (const value of cases) {
    assert.deepEqual(installation.createSessionV1(value, 'fixture-a', key(input.workflowId)), {
      ok: false,
      code: 'SESSION_REFUSED',
    })
  }
})
