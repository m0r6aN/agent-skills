import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import fs, {
  cpSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { syncBuiltinESMExports } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import {
  canonicalize,
  computeApprovalSubject,
  type JsonValue,
  mintGenesisReceipt,
  sha256Hex,
  writeReceiptDocument,
} from '../../approval/src/index.js'
import type { CorrelationContext } from '../../contracts/src/index.js'
import { executeDispatch, prepareDispatch } from '../../dispatch/src/approval-cli/index.js'
import type { RegistrationV1 } from '../../receipts/src/measured-workflow-internal.js'
import { mintStageBReceipt } from '../../registration/src/receipt.js'
import { recordBuildResult } from '../src/harness/index.js'
import {
  createOfflineMeasuredVerificationV1,
  createProductionMeasuredVerificationV1,
  finalizeMeasuredStageDV1,
  type OfflineInputV1,
} from '../src/pipeline/stage-d-finalization.js'

const matrixSource = join(process.cwd(), '..', 'skill-injection', 'skill-injection.yaml')

async function makeFixture(
  permissionProfile = false,
): Promise<{ input: OfflineInputV1; repoRoot: string; workflowId: string }> {
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
  writeFileSync(
    join(repoRoot, specPath),
    (permissionProfile ? '---\npermission_profile: builder-standard\n' : '---\n') +
      'routing_class: architecture/risk\ndata_classification: public\nsurfaces: [plugins/foreman-line/dispatch/]\n---\n# Fixture\n\nAC-1: first criterion\n',
  )
  mkdirSync(join(pluginRoot, 'routing-policy'), { recursive: true })
  cpSync(
    join(process.cwd(), '..', 'routing-policy', 'routing-policy.yaml'),
    join(pluginRoot, 'routing-policy', 'routing-policy.yaml'),
  )
  const correlation = {
    correlationId: randomUUID(),
    sessionId: randomUUID(),
    workflowId,
    runId: randomUUID(),
  } as CorrelationContext
  const approved = computeApprovalSubject({ parcelSpecRefs: [specPath], epics: [] }, repoRoot)
  const stageA = mintGenesisReceipt(
    correlation,
    { ...approved.subject, approvedHash: approved.approvedHash },
    '2026-09-26T00:00:00.000Z',
  )
  writeReceiptDocument(stageA.document, stageA.ref.locator, repoRoot)
  const stageB = mintStageBReceipt(
    correlation,
    stageA.document.hash,
    {
      ticketKeys: ['KONE-123'],
      links: [
        {
          direction: 'ticket->commit',
          ticketKey: 'KONE-123',
          commitSha: 'abc1234',
          permalink: 'https://example.invalid/commit/abc1234',
        },
      ],
    },
    '2026-09-26T00:00:01.000Z',
  )
  writeReceiptDocument(stageB.document, stageB.locator, repoRoot)
  const worktreePath = join(repoRoot, 'worktree')
  const pkg = await prepareDispatch(
    {
      candidate: {
        ticketKey: 'KONE-123',
        summary: 'Offline parcel',
        priority: 'Medium',
        status: 'To Do',
        workflowId,
        priorReceiptLocator: stageB.locator,
      },
      specPath: join(repoRoot, specPath),
      worktreePath,
      compressFn: async () => ({
        compressed: 'compressed-spec-text',
        hash: 'mock-artifact-id-xyz',
        originalTokens: 200,
        compressedTokens: 50,
        tokensSaved: 150,
        transforms: ['semantic-dedup'],
      }),
    },
    { repoRoot, pluginRoot },
  )
  const executed = await executeDispatch(pkg, worktreePath, {
    repoRoot,
    pluginRoot,
    dispatchWorktreeFn: () => ({ code: 0, stdout: 'offline fixture', stderr: '' }),
  })
  const stageC = {
    locator: executed.receiptLocator,
    hash: JSON.parse(readFileSync(join(repoRoot, executed.receiptLocator), 'utf8')).hash as string,
    correlation,
  }

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
    order: executed.order,
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

function rewriteChain(
  fixture: Awaited<ReturnType<typeof makeFixture>>,
  mutate: (document: Record<string, unknown>, index: number) => void,
): void {
  const directory = join(fixture.repoRoot, 'docs', 'receipts', fixture.workflowId)
  let previousHash: string | null = null
  for (const [index, name] of readdirSync(directory)
    .filter((item) => /^\d{6}-/.test(item))
    .sort()
    .entries()) {
    const path = join(directory, name)
    const document = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>
    mutate(document, index)
    document.prevHash = previousHash
    delete document.hash
    document.hash = sha256Hex(canonicalize(document as unknown as JsonValue))
    writeFileSync(path, JSON.stringify(document))
    previousHash = String(document.hash)
    if (document.stage === 'C') {
      const ref = fixture.input.registration.dispatchReceiptRef as { hash: string }
      ref.hash = String(document.hash)
    }
    if (document.stage === 'D') {
      const ref = fixture.input.registration.buildReceiptRef as { hash: string }
      ref.hash = String(document.hash)
    }
  }
}

function nestedSubject(depth: number): Record<string, unknown> {
  let value: Record<string, unknown> = { leaf: 'x' }
  for (let index = 0; index < depth; index++) value = { child: value }
  return value
}

test('production constructor is an unread/refusal boundary', async () => {
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
  const fixture = await makeFixture()
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

test('offline input rejects a forged pass result and cloned session', async () => {
  const fixture = await makeFixture()
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

test('offline input binds the supplied BuildResult to the Stage-D bridge receipt', async () => {
  const fixture = await makeFixture()
  try {
    const mismatched = createOfflineMeasuredVerificationV1({
      ...fixture.input,
      buildResult: { ...fixture.input.buildResult, branch: 'feat/forged' },
    })
    assert.deepEqual(mismatched, { ok: false, code: 'PREREQUISITE_UNAVAILABLE' })
  } finally {
    rmSync(fixture.repoRoot, { recursive: true, force: true })
  }
})

test('initial DispatchOrder extra-field tampering is refused before owner execution', async () => {
  const fixture = await makeFixture()
  try {
    rewriteChain(fixture, (document, index) => {
      if (index === 2) document.subject = { parcelRef: 'KONE-999' }
    })
    assert.deepEqual(createOfflineMeasuredVerificationV1(fixture.input), {
      ok: false,
      code: 'PREREQUISITE_UNAVAILABLE',
    })
  } finally {
    rmSync(fixture.repoRoot, { recursive: true, force: true })
  }
})

test('structured receipt depth and string one-over bounds refuse at construction', async () => {
  for (const mutation of [
    (document: Record<string, unknown>) => {
      document.subject = nestedSubject(40)
    },
    (document: Record<string, unknown>) => {
      document.subject = { padding: 'x'.repeat(4097) }
    },
  ]) {
    const fixture = await makeFixture()
    try {
      rewriteChain(fixture, (document, index) => {
        if (index === 0) mutation(document)
      })
      assert.deepEqual(createOfflineMeasuredVerificationV1(fixture.input), {
        ok: false,
        code: 'PREREQUISITE_UNAVAILABLE',
      })
    } finally {
      rmSync(fixture.repoRoot, { recursive: true, force: true })
    }
  }
})

test('duplicate harness claim after drain is refused before measurement publication', async () => {
  const fixture = await makeFixture()
  try {
    const created = createOfflineMeasuredVerificationV1(fixture.input)
    assert.equal(created.ok, true)
    if (!created.ok) return
    assert.deepEqual(await created.value.runVerificationV1(), { ok: true, value: null })
    assert.deepEqual(created.value.closeAdmissionV1(), { ok: true, value: null })
    assert.deepEqual(await created.value.drainV1(), { ok: true, value: null })
    const directory = join(fixture.repoRoot, 'docs', 'receipts', fixture.workflowId)
    const documents = readdirSync(directory)
      .filter((name) => /^\d{6}-/.test(name))
      .sort()
      .map(
        (name) =>
          JSON.parse(readFileSync(join(directory, name), 'utf8')) as Record<string, unknown>,
      )
    const original = documents.find((document) => document.subjectKind === 'HarnessClaimResult')
    const tip = documents.at(-1)
    assert.ok(original)
    assert.ok(tip)
    if (original === undefined || tip === undefined) return
    const duplicate: Record<string, unknown> = {
      ...original,
      sequence: Number(tip.sequence) + 1,
      prevHash: tip.hash,
    }
    delete duplicate.hash
    duplicate.hash = sha256Hex(canonicalize(duplicate as unknown as JsonValue))
    const duplicateSequence = Number(duplicate.sequence)
    writeFileSync(
      join(directory, `${String(duplicateSequence).padStart(6, '0')}-D-harness-claim-result.json`),
      JSON.stringify(duplicate),
    )
    assert.deepEqual(created.value.publishFixtureMeasurementV1(), {
      ok: false,
      code: 'WRITE_REFUSED',
    })
  } finally {
    rmSync(fixture.repoRoot, { recursive: true, force: true })
  }
})

test('oversized verdict envelope is bounded before final-D reads it', async () => {
  const fixture = await makeFixture()
  try {
    const created = createOfflineMeasuredVerificationV1(fixture.input)
    assert.equal(created.ok, true)
    if (!created.ok) return
    assert.deepEqual(await created.value.runVerificationV1(), { ok: true, value: null })
    const envelope = join(
      fixture.repoRoot,
      'docs',
      'receipts',
      fixture.workflowId,
      'verification-verdict.envelope.json',
    )
    writeFileSync(envelope, `${readFileSync(envelope, 'utf8')}${' '.repeat(1024 * 1024 + 1)}`)
    assert.deepEqual(created.value.closeAdmissionV1(), { ok: true, value: null })
    assert.deepEqual(await created.value.drainV1(), { ok: true, value: null })
    assert.equal(created.value.publishFixtureMeasurementV1().ok, true)
    assert.deepEqual(finalizeMeasuredStageDV1(created.value.session), {
      ok: false,
      code: 'CHAIN_REFUSED',
    })
  } finally {
    rmSync(fixture.repoRoot, { recursive: true, force: true })
  }
})

test('capture alias expansion charges shared bounded arrays', async () => {
  const fixture = await makeFixture()
  try {
    const shared = Array.from({ length: 256 }, () => 'x'.repeat(4096))
    const refused = createOfflineMeasuredVerificationV1({
      ...fixture.input,
      order: { ...fixture.input.order, injectedSkills: shared },
      buildResult: { ...fixture.input.buildResult, commitShas: shared },
    })
    assert.deepEqual(refused, { ok: false, code: 'PREREQUISITE_UNAVAILABLE' })
  } finally {
    rmSync(fixture.repoRoot, { recursive: true, force: true })
  }
})

test('review cardinality is refused before reflective enumeration', async () => {
  const fixture = await makeFixture()
  try {
    const claims = new Proxy(
      Array.from({ length: 257 }, () => 'AC-over-bound'),
      {
        ownKeys: () => {
          throw new Error('ownKeys should not run')
        },
      },
    )
    const refused = createOfflineMeasuredVerificationV1({
      ...fixture.input,
      expected: { ...fixture.input.expected, claims },
    })
    assert.deepEqual(refused, { ok: false, code: 'PREREQUISITE_UNAVAILABLE' })
  } finally {
    rmSync(fixture.repoRoot, { recursive: true, force: true })
  }
})

test('receipt preflight refuses a receipt one byte over the per-file bound', async () => {
  const fixture = await makeFixture()
  try {
    const receiptPath = join(
      fixture.repoRoot,
      ...fixture.input.registration.dispatchReceiptRef.locator.split('/'),
    )
    writeFileSync(receiptPath, `${readFileSync(receiptPath, 'utf8')}${' '.repeat(1024 * 1024 + 1)}`)
    assert.deepEqual(createOfflineMeasuredVerificationV1(fixture.input), {
      ok: false,
      code: 'PREREQUISITE_UNAVAILABLE',
    })
  } finally {
    rmSync(fixture.repoRoot, { recursive: true, force: true })
  }
})

test('receipt preflight refuses an aggregate chain over the 16 MiB bound before parsing', async () => {
  const fixture = await makeFixture()
  try {
    const receiptDir = join(
      fixture.repoRoot,
      'docs',
      'receipts',
      fixture.input.registration.workflowId,
    )
    const filler = 'x'.repeat(1_048_500)
    for (let sequence = 4; sequence < 20; sequence++) {
      writeFileSync(
        join(receiptDir, `${String(sequence).padStart(6, '0')}-D-filler-${sequence}.json`),
        filler,
      )
    }
    assert.deepEqual(createOfflineMeasuredVerificationV1(fixture.input), {
      ok: false,
      code: 'PREREQUISITE_UNAVAILABLE',
    })
  } finally {
    rmSync(fixture.repoRoot, { recursive: true, force: true })
  }
})

test('live root replacement is refused before a writing owner runs', async () => {
  const fixture = await makeFixture()
  const replacement = `${fixture.repoRoot}-replacement`
  try {
    const created = createOfflineMeasuredVerificationV1(fixture.input)
    assert.equal(created.ok, true)
    if (!created.ok) return
    renameSync(fixture.repoRoot, replacement)
    mkdirSync(fixture.repoRoot)
    cpSync(replacement, fixture.repoRoot, { recursive: true })
    assert.deepEqual(await created.value.runVerificationV1(), {
      ok: false,
      code: 'EVIDENCE_REFUSED',
    })
    assert.equal(
      readdirSync(join(fixture.repoRoot, 'docs', 'receipts', fixture.workflowId)).some((name) =>
        name.includes('review-dispatch'),
      ),
      false,
    )
  } finally {
    rmSync(fixture.repoRoot, { recursive: true, force: true })
    rmSync(replacement, { recursive: true, force: true })
  }
})

test('spec tampering after owner completion blocks finalization', async () => {
  const fixture = await makeFixture()
  try {
    const created = createOfflineMeasuredVerificationV1(fixture.input)
    assert.equal(created.ok, true)
    if (!created.ok) return
    assert.deepEqual(await created.value.runVerificationV1(), { ok: true, value: null })
    assert.deepEqual(created.value.closeAdmissionV1(), { ok: true, value: null })
    assert.deepEqual(await created.value.drainV1(), { ok: true, value: null })
    assert.equal(created.value.publishFixtureMeasurementV1().ok, true)
    writeFileSync(join(fixture.repoRoot, fixture.input.specPath), '\n# tampered\n', { flag: 'a' })
    assert.deepEqual(finalizeMeasuredStageDV1(created.value.session), {
      ok: false,
      code: 'CHAIN_REFUSED',
    })
  } finally {
    rmSync(fixture.repoRoot, { recursive: true, force: true })
  }
})

test('verdict envelope tampering blocks finalization after measured completion', async () => {
  const fixture = await makeFixture()
  try {
    const created = createOfflineMeasuredVerificationV1(fixture.input)
    assert.equal(created.ok, true)
    if (!created.ok) return
    assert.deepEqual(await created.value.runVerificationV1(), { ok: true, value: null })
    const envelope = join(
      fixture.repoRoot,
      'docs',
      'receipts',
      fixture.workflowId,
      'verification-verdict.envelope.json',
    )
    writeFileSync(envelope, `${readFileSync(envelope, 'utf8')}\n`)
    assert.deepEqual(created.value.closeAdmissionV1(), { ok: true, value: null })
    assert.deepEqual(await created.value.drainV1(), { ok: true, value: null })
    assert.equal(created.value.publishFixtureMeasurementV1().ok, true)
    assert.deepEqual(finalizeMeasuredStageDV1(created.value.session), {
      ok: false,
      code: 'CHAIN_REFUSED',
    })
  } finally {
    rmSync(fixture.repoRoot, { recursive: true, force: true })
  }
})

test('actual optional permission profile survives the producer chain', async () => {
  const fixture = await makeFixture(true)
  try {
    assert.equal(fixture.input.order.permissionProfile, 'builder-standard')
    const created = createOfflineMeasuredVerificationV1(fixture.input)
    assert.equal(created.ok, true)
    if (created.ok)
      assert.deepEqual(await created.value.runVerificationV1(), { ok: true, value: null })
  } finally {
    rmSync(fixture.repoRoot, { recursive: true, force: true })
  }
})

test('fixed sidecar mutation after construction refuses before measured owner writes', async () => {
  for (const name of ['routing-decision.json', 'kompress.json']) {
    const fixture = await makeFixture()
    try {
      const created = createOfflineMeasuredVerificationV1(fixture.input)
      assert.equal(created.ok, true)
      const directory = join(fixture.repoRoot, 'docs', 'receipts', fixture.workflowId)
      const before = readdirSync(directory).sort()
      const path = join(directory, name)
      const value = JSON.parse(readFileSync(path, 'utf8'))
      value.timestamp = '2026-09-25T00:00:00.000Z'
      writeFileSync(path, JSON.stringify(value))
      if (created.ok) assert.equal((await created.value.runVerificationV1()).ok, false)
      assert.deepEqual(readdirSync(directory).sort(), before)
    } finally {
      rmSync(fixture.repoRoot, { recursive: true, force: true })
    }
  }
})

test('receipt reads use bounded handles and reject growth after opening', async (t) => {
  const fixture = await makeFixture()
  const target = join(fixture.repoRoot, fixture.input.registration.dispatchReceiptRef.locator)
  const originalOpen = fs.openSync
  let opened = 0
  let maximumRead = 0
  const originalRead = fs.readSync
  const readMock = t.mock.method(fs, 'readSync', (...args: unknown[]) => {
    maximumRead = Math.max(maximumRead, typeof args[3] === 'number' ? args[3] : 0)
    return Reflect.apply(originalRead, fs, args)
  })
  const mock = t.mock.method(fs, 'openSync', (...args: Parameters<typeof fs.openSync>) => {
    const fd = originalOpen(...args)
    if (String(args[0]) === target) {
      opened++
      fs.appendFileSync(target, ' '.repeat(1048577))
    }
    return fd
  })
  syncBuiltinESMExports()
  try {
    assert.equal(createOfflineMeasuredVerificationV1(fixture.input).ok, false)
    assert.equal(opened, 1)
    assert.ok(maximumRead <= 1048577, `requested ${maximumRead} bytes`)
  } finally {
    mock.mock.restore()
    readMock.mock.restore()
    syncBuiltinESMExports()
    rmSync(fixture.repoRoot, { recursive: true, force: true })
  }
})

test('genuine initial owner evidence rejects independent manifest, membership, projection and order mutations', async () => {
  const mutations: ((fixture: Awaited<ReturnType<typeof makeFixture>>) => void)[] = [
    (f) =>
      rewriteChain(f, (doc, index) => {
        if (index === 0) (doc.subject as Record<string, unknown>).approvedHash = '0'.repeat(64)
      }),
    (f) =>
      rewriteChain(f, (doc, index) => {
        if (index === 0)
          (
            (doc.subject as { specSet: { contentHash: string }[] }).specSet[0] as {
              contentHash: string
            }
          ).contentHash = '0'.repeat(64)
      }),
    (f) =>
      rewriteChain(f, (doc, index) => {
        if (index === 0)
          (
            doc.subject as { projectedResult: { parcelSpecRefs: string[] } }
          ).projectedResult.parcelSpecRefs.push('specs/other.md')
      }),
    (f) =>
      rewriteChain(f, (doc, index) => {
        if (index === 1) (doc.subject as { ticketKeys: string[] }).ticketKeys = ['KONE-999']
      }),
    (f) =>
      rewriteChain(f, (doc, index) => {
        if (index === 1) (doc.subject as { ticketKeys: string[] }).ticketKeys.push('KONE-124')
      }),
    (f) =>
      rewriteChain(f, (doc, index) => {
        if (index === 1) (doc.subject as { links: unknown[] }).links = [{ direction: 'invalid' }]
      }),
    (f) =>
      rewriteChain(f, (doc, index) => {
        if (index === 2)
          (doc.subject as Record<string, unknown>).kompressArtifactId = 'wrong-artifact'
      }),
    (f) =>
      rewriteChain(f, (doc, index) => {
        if (index === 2)
          (doc.subject as Record<string, unknown>).kompressReceiptRef =
            'docs/receipts/other/kompress.json'
      }),
    (f) =>
      rewriteChain(f, (doc, index) => {
        if (index === 2) (doc.subject as Record<string, unknown>).injectedSkills = ['other']
      }),
    (f) => {
      ;(f.input.order as { stepZeroRestatement: string }).stepZeroRestatement += '\nforged'
    },
    (f) => {
      ;(f.input.order as { parcelRef: string }).parcelRef = 'KONE-999'
    },
    (f) => {
      ;(f.input as { ticketKey: string }).ticketKey = 'KONE-999'
    },
    (f) => {
      writeFileSync(join(f.repoRoot, f.input.specPath), 'changed spec')
    },
    (f) => {
      const path = join(f.repoRoot, 'docs', 'receipts', f.workflowId, 'routing-decision.json')
      const value = JSON.parse(readFileSync(path, 'utf8'))
      value.routing_class = 'boilerplate'
      writeFileSync(path, JSON.stringify(value))
    },
    (f) => {
      const path = join(f.repoRoot, 'docs', 'receipts', f.workflowId, 'kompress.json')
      const value = JSON.parse(readFileSync(path, 'utf8'))
      value.artifactId = 'wrong-artifact'
      writeFileSync(path, JSON.stringify(value))
    },
  ]
  for (const [index, mutate] of mutations.entries()) {
    const fixture = await makeFixture()
    try {
      mutate(fixture)
      const directory = join(fixture.repoRoot, 'docs', 'receipts', fixture.workflowId)
      const before = readdirSync(directory).sort()
      assert.equal(
        createOfflineMeasuredVerificationV1(fixture.input).ok,
        false,
        `mutation ${index}`,
      )
      assert.deepEqual(readdirSync(directory).sort(), before)
    } finally {
      rmSync(fixture.repoRoot, { recursive: true, force: true })
    }
  }
})

test('exact per-file byte cap accepts whitespace padding; one byte over refuses', async () => {
  for (const extra of [0, 1]) {
    const fixture = await makeFixture()
    try {
      const path = join(fixture.repoRoot, fixture.input.registration.dispatchReceiptRef.locator)
      const bytes = readFileSync(path)
      writeFileSync(path, Buffer.concat([bytes, Buffer.alloc(1048576 + extra - bytes.length, 32)]))
      assert.equal(createOfflineMeasuredVerificationV1(fixture.input).ok, extra === 0)
    } finally {
      rmSync(fixture.repoRoot, { recursive: true, force: true })
    }
  }
})

test('fd capture rejects replacement and truncation during reads and closes handles', async (t) => {
  for (const mode of ['replace', 'truncate', 'throw']) {
    const fixture = await makeFixture()
    const target = join(fixture.repoRoot, fixture.input.registration.dispatchReceiptRef.locator)
    const originalOpen = fs.openSync,
      originalRead = fs.readSync,
      originalClose = fs.closeSync
    let targetFd: number | undefined
    let injected = false,
      closed = false
    const openMock = t.mock.method(fs, 'openSync', (...args: Parameters<typeof fs.openSync>) => {
      const fd = originalOpen(...args)
      if (String(args[0]) === target) targetFd = fd
      return fd
    })
    const readMock = t.mock.method(fs, 'readSync', (...args: unknown[]) => {
      if (args[0] === targetFd && !injected) {
        injected = true
        if (mode === 'throw') throw new Error('offline read failure')
        if (mode === 'truncate') fs.truncateSync(target, 0)
        else {
          renameSync(target, `${target}.old`)
          writeFileSync(target, readFileSync(`${target}.old`))
        }
      }
      return Reflect.apply(originalRead, fs, args)
    })
    const closeMock = t.mock.method(fs, 'closeSync', (fd: number) => {
      if (fd === targetFd) closed = true
      return originalClose(fd)
    })
    syncBuiltinESMExports()
    try {
      assert.equal(createOfflineMeasuredVerificationV1(fixture.input).ok, false, mode)
      assert.equal(injected, true)
      assert.equal(closed, true)
    } finally {
      openMock.mock.restore()
      readMock.mock.restore()
      closeMock.mock.restore()
      syncBuiltinESMExports()
      rmSync(fixture.repoRoot, { recursive: true, force: true })
    }
  }
})

test('actual captured aggregate bytes accept exactly 16 MiB and refuse plus one', async () => {
  for (const extra of [0, 1]) {
    const fixture = await makeFixture()
    try {
      const directory = join(fixture.repoRoot, 'docs', 'receipts', fixture.workflowId)
      let previous = JSON.parse(
        readFileSync(
          join(fixture.repoRoot, fixture.input.registration.buildReceiptRef.locator),
          'utf8',
        ),
      )
      // Additional closed receipt documents exercise scanning only; they are not claimed as owner outputs.
      for (let sequence = 4; sequence < 16; sequence++) {
        const { hash: previousHash, ...fields } = previous
        const draft = {
          ...fields,
          sequence,
          prevHash: previousHash,
          subjectKind: 'BoundProbe',
          claimRef: `bound-${sequence}`,
          subject: {},
        }
        previous = { ...draft, hash: sha256Hex(canonicalize(draft as JsonValue)) }
        writeFileSync(
          join(directory, `${String(sequence).padStart(6, '0')}-D-bound-probe.json`),
          JSON.stringify(previous),
        )
      }
      const metadata = [
        join(fixture.repoRoot, fixture.input.specPath),
        join(fixture.input.pluginRoot, 'skill-injection', 'skill-injection.yaml'),
        join(directory, 'routing-decision.json'),
        join(directory, 'kompress.json'),
      ].reduce((total, path) => total + readFileSync(path).length, 0)
      const paths = readdirSync(directory)
        .filter((name) => /^\d{6}-/.test(name))
        .sort()
        .map((name) => join(directory, name))
      let remaining = 16777216 + extra - metadata
      for (const [index, path] of paths.entries()) {
        const bytes = readFileSync(path)
        const laterMinimum = paths
          .slice(index + 1)
          .reduce((total, later) => total + readFileSync(later).length, 0)
        const size = Math.min(1048576, remaining - laterMinimum)
        assert.ok(size >= bytes.length)
        writeFileSync(path, Buffer.concat([bytes, Buffer.alloc(size - bytes.length, 32)]))
        remaining -= size
      }
      assert.equal(remaining, 0)
      assert.equal(createOfflineMeasuredVerificationV1(fixture.input).ok, extra === 0)
    } finally {
      rmSync(fixture.repoRoot, { recursive: true, force: true })
    }
  }
})
