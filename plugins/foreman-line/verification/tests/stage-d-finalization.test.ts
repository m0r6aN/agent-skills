import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { canonicalize, sha256Hex } from '../../approval/src/index.js'
import type { RegistrationV1 } from '../../receipts/src/measured-workflow-internal.js'
import { recordBuildResult } from '../src/harness/index.js'
import {
  createOfflineMeasuredVerificationV1,
  createProductionMeasuredVerificationV1,
  finalizeMeasuredStageDV1,
  type OfflineInputV1,
} from '../src/pipeline/stage-d-finalization.js'

const matrixSource = join(process.cwd(), '..', 'skill-injection', 'skill-injection.yaml')

function makeFixture(): { input: OfflineInputV1; repoRoot: string; workflowId: string } {
  const fixtureId = `fixture-${randomUUID().slice(0, 8)}`
  const repoRoot = join(tmpdir(), `hro-p3a-fixture-${fixtureId}`)
  mkdirSync(repoRoot)
  const pluginRoot = join(repoRoot, 'plugins', 'foreman-line')
  mkdirSync(join(pluginRoot, 'skill-injection'), { recursive: true })
  writeFileSync(
    join(pluginRoot, 'skill-injection', 'skill-injection.yaml'),
    readFileSync(matrixSource),
  )
  const workflowId = randomUUID()
  const specPath = 'specs/parcel-spec.md'
  mkdirSync(join(repoRoot, 'specs'), { recursive: true })
  writeFileSync(join(repoRoot, specPath), '# Fixture\n\nAC-1: first criterion\n')
  const stageC = mintStageC(repoRoot, workflowId)
  const buildResult = {
    branch: 'feat/hro-p3a',
    commitShas: ['abc1234'],
    touchedSurfaces: ['plugins/foreman-line/verification/src/pipeline/stage-d-finalization.ts'],
  }
  const buildLocator = recordBuildResult(
    workflowId,
    stageC.locator,
    buildResult.branch,
    buildResult.commitShas,
    buildResult.touchedSurfaces,
    repoRoot,
  )
  const buildDocument = JSON.parse(
    readFileSync(join(repoRoot, ...buildLocator.split('/')), 'utf8'),
  ) as { hash: string }
  const expected = {
    claims: ['AC-1: first criterion', 'matrix:test-coverage.check'],
    reviews: [{ slotId: 'review-1', reviewerId: 'reviewer-a', reviewedHeadSha: 'b'.repeat(40) }],
    builderId: 'builder-a',
    authorizedActorId: 'actor-a',
    authorityRef: 'delegation/offline-a',
  }
  const registration: RegistrationV1 = {
    workflowId,
    correlationId: stageC.correlation.correlationId,
    parcelRef: 'KONE-123',
    repoRoot,
    verifiedHeadSha: 'b'.repeat(40),
    dispatchReceiptRef: { hash: stageC.hash, locator: stageC.locator },
    buildReceiptRef: { hash: buildDocument.hash, locator: buildLocator },
    specDigest: sha256Hex(readFileSync(join(repoRoot, specPath))),
    matrixDigest: sha256Hex(
      readFileSync(join(pluginRoot, 'skill-injection', 'skill-injection.yaml')),
    ),
    expectedPlanDigest: sha256Hex(canonicalize(expected)),
  }
  const input: OfflineInputV1 = {
    domain: 'offline-fixture/v1',
    fixtureId,
    registration,
    pluginRoot,
    specPath,
    order: {
      parcelRef: 'KONE-123',
      stepZeroRestatement: 'fixture',
      routingDecisionRef: 'docs/receipts/route.json',
      injectedSkills: ['test-coverage'],
    },
    buildResult,
    expected,
    testResults: { passed: ['test AC-1 covers first criterion'], failed: [] },
    matrixResults: [
      { name: 'test-coverage.check', passed: true, evidence: 'offline matrix fixture pass' },
    ],
    reviews: [
      {
        slotId: 'review-1',
        reviewerId: 'reviewer-a',
        reviewedHeadSha: 'b'.repeat(40),
        rawText: '```adversarial-findings\n[]\n```',
      },
    ],
    dispositions: [],
    decision: {
      actorId: 'actor-a',
      authorityRef: 'delegation/offline-a',
      decision: 'approve',
      note: 'offline fixture approval',
    },
    ticketKey: 'KONE-123',
    targetStatus: 'Done',
    denominatorDigest: 'c'.repeat(64),
  }
  return { input, repoRoot, workflowId }
}

function mintStageC(
  repoRoot: string,
  workflowId: string,
): {
  locator: string
  hash: string
  correlation: { correlationId: string; sessionId: string; workflowId: string; runId: string }
} {
  const correlation = {
    correlationId: randomUUID(),
    sessionId: randomUUID(),
    workflowId,
    runId: randomUUID(),
  }
  const draft = {
    schemaVersion: '1',
    kind: 'stage',
    stage: 'C',
    claimRef: null,
    correlation,
    sequence: 0,
    prevHash: null,
    timestamp: '2026-09-26T00:00:00.000Z',
    subjectKind: 'DispatchOrder',
    subject: { parcelRef: 'KONE-123' },
    signature: null,
  }
  const hash = sha256Hex(canonicalize(draft))
  const locator = `docs/receipts/${workflowId}/000000-C-dispatch-order.json`
  const abs = join(repoRoot, ...locator.split('/'))
  mkdirSync(dirname(abs), { recursive: true })
  writeFileSync(abs, `${JSON.stringify({ ...draft, hash }, null, 2)}\n`)
  return { locator, hash, correlation }
}

test('production constructor is an unread/refusal boundary', () => {
  let reads = 0
  const hostile = new Proxy(
    {},
    {
      get() {
        reads += 1
        throw new Error('read')
      },
      ownKeys() {
        reads += 1
        throw new Error('keys')
      },
    },
  )
  assert.deepEqual(createProductionMeasuredVerificationV1(hostile), {
    ok: false,
    code: 'PREREQUISITE_UNAVAILABLE',
  })
  assert.equal(reads, 0)
})

test('offline driver executes actual owners and publishes a measured final-D handoff', async () => {
  const fixture = makeFixture()
  try {
    const created = createOfflineMeasuredVerificationV1(fixture.input)
    assert.equal(created.ok, true)
    if (!created.ok) return
    assert.equal((created.value.runVerificationV1() as unknown) instanceof Promise, true)
    assert.deepEqual(await created.value.runVerificationV1(), { ok: true, value: null })
    assert.deepEqual(created.value.closeAdmissionV1(), { ok: true, value: null })
    assert.deepEqual(await created.value.drainV1(), { ok: true, value: null })
    const measurement = created.value.publishFixtureMeasurementV1()
    assert.equal(measurement.ok, true)
    const final = finalizeMeasuredStageDV1(created.value.session)
    assert.equal(final.ok, true)
    if (!final.ok) return
    const duplicate = finalizeMeasuredStageDV1(created.value.session)
    assert.deepEqual(duplicate, final)
    const document = JSON.parse(
      readFileSync(join(fixture.repoRoot, ...final.value.locator.split('/')), 'utf8'),
    ) as Record<string, unknown>
    assert.equal(document.kind, 'stage')
    assert.equal(document.stage, 'D')
    assert.equal(document.claimRef, null)
    assert.equal(document.subjectKind, 'MeasuredVerificationHandoff')
    assert.deepEqual(
      Object.keys(document.subject as object).sort(),
      [
        'buildReceiptRef',
        'coverage',
        'denominatorDigest',
        'expectedPlanDigest',
        'humanClosureReceiptRef',
        'telemetryReceiptRef',
        'verdictReceiptRef',
        'verifiedHeadSha',
        'version',
      ].sort(),
    )
  } finally {
    rmSync(fixture.repoRoot, { recursive: true, force: true })
  }
})

test('offline input rejects a forged pass result and cloned session', () => {
  const fixture = makeFixture()
  try {
    const forged = createOfflineMeasuredVerificationV1({
      ...fixture.input,
      expected: { ...fixture.input.expected, claims: [] },
    })
    assert.equal(forged.ok, false)
    const created = createOfflineMeasuredVerificationV1(fixture.input)
    assert.equal(created.ok, true)
    if (!created.ok) return
    assert.deepEqual(finalizeMeasuredStageDV1({}), { ok: false, code: 'SESSION_REFUSED' })
  } finally {
    rmSync(fixture.repoRoot, { recursive: true, force: true })
  }
})
