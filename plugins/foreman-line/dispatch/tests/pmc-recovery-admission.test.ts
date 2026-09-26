import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { type TestContext, test } from 'node:test'
import { openIntentOwnerV1 } from '../src/pmc-launch/intent-custody.js'
import { createLocalPmcLedger, initializeLocalPmcLedger } from '../src/pmc-launch/ledger.js'
import { computePmcCostV1 } from '../src/pmc-launch/money.js'
import {
  createOfflineRecoveryAdmissionV1,
  createProductionRecoveryAdmissionV1,
} from '../src/pmc-launch/recovery-admission.js'
import type { OfflineInputV1 } from '../src/pmc-launch/recovery-admission-types.js'

type FixtureData = ReturnType<typeof JSON.parse>
const digest = 'a'.repeat(64)
const now = '2026-09-26T12:00:00.000Z'
const identity = {
  storeId: 'owner',
  ledgerId: 'ledger',
  epoch: 'epoch',
  initializationAuthorityDigest: digest,
  schemaVersion: 1,
}
const worker = new URL('./fixtures/pmc-recovery-admission-worker.ts', import.meta.url)

function present<T>(value: T | undefined): T {
  assert(value !== undefined)
  return value
}

function fixture(t: TestContext): { input: OfflineInputV1; root: string } {
  const fixtureId = `test-${randomUUID().replaceAll('-', '')}`
  const root = join(tmpdir(), `hro-p4a1-fixture-${fixtureId}`)
  mkdirSync(root)
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const f = JSON.parse(
    readFileSync(
      new URL('../../routing-policy/tests/fixtures/pmc-resolver-v1.json', import.meta.url),
      'utf8',
    ),
  )
  const {
    episodeId: _episode,
    requestId: _request,
    requestDigest: _requestDigest,
    attempt: _attempt,
    ...routeTemplate
  } = f.request
  const authority = {
    intentRef: 'intent',
    businessAuthorityRef: 'business',
    businessAuthorityDigest: digest,
    originId: 'origin',
    routeTemplate,
    policyDigest: f.context.policyDigest,
    configDigest: f.context.configDigest,
    scope: {
      scopeId: 'scope',
      authorityDigest: digest,
      currency: 'USD',
      authorizedLimitMicroUsd: 10000,
      workflowId: routeTemplate.workflowId,
      accountId: 'account',
      routingClass: routeTemplate.routingClass,
    },
    authorityObservedAtUtc: now,
    authorityExpiresAtUtc: '2026-09-26T13:00:00.000Z',
    fallbackAllowed: true,
  }
  return {
    root,
    input: {
      domain: 'offline-fixture/v1',
      fixtureId,
      root,
      workflowId: routeTemplate.workflowId,
      generationId: 'generation',
      identity,
      intents: [{ authority, payloadJson: '{"messages":[]}' }],
    } as unknown as OfflineInputV1,
  }
}

function database(root: string, filename = 'hro-recovery-admission-v1.sqlite') {
  return new DatabaseSync(join(root, filename))
}

function literalDigest(
  input: OfflineInputV1,
  episodeId: string,
  requestIds: readonly [string, string],
): string {
  const a = input.intents[0]?.authority
  assert(a)
  const t = a.routeTemplate
  const route = {
    version: t.version,
    workflowId: t.workflowId,
    taskId: t.taskId,
    episodeId,
    requestId: requestIds[0],
    lane: t.lane,
    subRole: t.subRole,
    routingClass: t.routingClass,
    dataClass: t.dataClass,
    requirements: {
      toolUse: t.requirements.toolUse,
      structuredOutput: t.requirements.structuredOutput,
      reasoning: t.requirements.reasoning,
      thinkingLevel: t.requirements.thinkingLevel,
      inputModalities: t.requirements.inputModalities,
      requiredContextTokens: t.requirements.requiredContextTokens,
      requiredOutputTokens: t.requirements.requiredOutputTokens,
      maximumInputTokens: t.requirements.maximumInputTokens,
      maximumOutputTokens: t.requirements.maximumOutputTokens,
      rankingTokens: t.requirements.rankingTokens,
    },
    attempt: { kind: 'initial' },
  }
  return createHash('sha256')
    .update(
      JSON.stringify(['pmc-request/v1', a.intentRef, route, input.intents[0]?.payloadJson]),
      'utf8',
    )
    .digest('hex')
}

test('production constructor refuses without reading hostile input', () => {
  let reads = 0
  const hostile = new Proxy(
    {},
    {
      ownKeys: () => {
        reads++
        throw new Error('read')
      },
    },
  )
  assert.deepEqual(createProductionRecoveryAdmissionV1(hostile), {
    ok: false,
    code: 'PREREQUISITE_UNAVAILABLE',
  })
  assert.equal(reads, 0)
})

test('offline admission uses actual B1 IDs and an immutable exact SQLite batch', (t) => {
  const f = fixture(t)
  const result = createOfflineRecoveryAdmissionV1(f.input)
  assert(result.ok, JSON.stringify(result))
  const registration = result.value.registration
  assert(Object.isFrozen(result.value))
  assert(Object.isFrozen(registration))
  assert(Object.isFrozen(registration.episodes))
  assert.equal(registration.root, f.root)
  assert.equal(registration.episodes.length, 1)
  const episode = present(registration.episodes[0])
  assert.notEqual(episode.requestIds[0], episode.requestIds[1])
  assert.equal(
    episode.originalRequestDigest,
    literalDigest(f.input, episode.episodeId, episode.requestIds),
  )
  assert(existsSync(join(f.root, 'pmc-intent-v1.sqlite')))
  assert(existsSync(join(f.root, 'hro-recovery-admission-v1.sqlite')))
  const db = database(f.root)
  try {
    assert.deepEqual(
      db
        .prepare("SELECT name FROM sqlite_schema WHERE type='table' ORDER BY name")
        .all()
        .map((r) => r.name),
      ['admission_meta', 'episodes'],
    )
    const meta = db.prepare('SELECT * FROM admission_meta').get() as FixtureData
    assert.equal(meta.root, f.root)
    assert.equal(meta.domain, 'offline-fixture/v1')
    assert.equal(meta.state, 'admitted')
    const row = db.prepare('SELECT * FROM episodes').get() as FixtureData
    assert.equal(row.originalRequestDigest, episode.originalRequestDigest)
    assert.equal(row.request1, episode.requestIds[0])
    assert.equal(row.request2, episode.requestIds[1])
    assert.equal(row.businessAuthorityDigest, episode.businessAuthorityDigest)
    assert.equal(
      db.prepare("SELECT COUNT(*) AS n FROM sqlite_schema WHERE type IN ('trigger','view')").get()
        ?.n,
      0,
    )
    assert.equal(JSON.stringify(row).includes('messages'), false)
  } finally {
    db.close()
  }
  assert.deepEqual(result.value.claimBrokerV1(), { ok: true, value: {} })
  assert.deepEqual(result.value.claimBrokerV1(), { ok: false, code: 'SESSION_REFUSED' })
})

test('existing admission, B1, aliases, and tampering refuse without repair', (t) => {
  const f = fixture(t)
  const first = createOfflineRecoveryAdmissionV1(f.input)
  assert(first.ok)
  const second = createOfflineRecoveryAdmissionV1(f.input)
  assert.deepEqual(second, { ok: false, code: 'ALREADY_ADMITTED' })
  const before = readdirSync(f.root).sort()
  const changed = { ...f.input, generationId: 'other-generation' }
  assert.equal(createOfflineRecoveryAdmissionV1(changed).ok, false)
  assert.deepEqual(readdirSync(f.root).sort(), before)
  const db = database(f.root)
  try {
    db.exec('ALTER TABLE episodes ADD COLUMN extra TEXT')
  } finally {
    db.close()
  }
  assert.equal(createOfflineRecoveryAdmissionV1(f.input).ok, false)
  const junctionFixture = fixture(t)
  const target = junctionFixture.root
  const parent = join(tmpdir(), `hro-p4a1-junction-parent-${randomUUID().replaceAll('-', '')}`)
  mkdirSync(parent)
  t.after(() => rmSync(parent, { recursive: true, force: true }))
  const link = join(parent, basename(target))
  symlinkSync(target, link, process.platform === 'win32' ? 'junction' : 'dir')
  t.after(() => rmSync(link, { recursive: true, force: true }))
  assert.deepEqual(createOfflineRecoveryAdmissionV1({ ...junctionFixture.input, root: link }), {
    ok: false,
    code: 'PATH_REFUSED',
  })
  assert.deepEqual(readdirSync(target), [])
})

test('capture accepts the exact 256 KiB UTF-8 boundary without array index charges', (t) => {
  const f = fixture(t)
  let low = 0
  let high = 262144
  let boundary: OfflineInputV1 | undefined
  while (low <= high) {
    const length = Math.floor((low + high) / 2)
    const candidate = {
      ...f.input,
      intents: [
        {
          ...f.input.intents[0],
          payloadJson: JSON.stringify('x'.repeat(length)),
        },
      ],
    } as OfflineInputV1
    const bytes = Buffer.byteLength(JSON.stringify(candidate), 'utf8')
    if (bytes <= 262144) {
      if (bytes === 262144) boundary = candidate
      low = length + 1
    } else {
      high = length - 1
    }
  }
  assert(boundary)
  assert.equal(Buffer.byteLength(JSON.stringify(boundary), 'utf8'), 262144)
  const result = createOfflineRecoveryAdmissionV1(boundary)
  assert(result.ok, JSON.stringify(result))

  const overFixture = fixture(t)
  const exactPayload = JSON.parse(present(boundary.intents[0]).payloadJson) as string
  const over = {
    ...overFixture.input,
    intents: [
      {
        ...overFixture.input.intents[0],
        payloadJson: JSON.stringify(`${exactPayload}x`),
      },
    ],
  } as OfflineInputV1
  assert.equal(Buffer.byteLength(JSON.stringify(over), 'utf8'), 262145)
  assert.deepEqual(createOfflineRecoveryAdmissionV1(over), {
    ok: false,
    code: 'BOUNDS_REFUSED',
  })
  assert.equal(existsSync(join(overFixture.root, 'pmc-intent-v1.sqlite')), false)
  assert.equal(existsSync(join(overFixture.root, 'hro-recovery-admission-v1.sqlite')), false)
})

test('hostile closed input and bounds are refused before B1 or admission mutation', (t) => {
  const f = fixture(t)
  const extra = { ...f.input, extra: true }
  assert.deepEqual(createOfflineRecoveryAdmissionV1(extra), { ok: false, code: 'INPUT_REFUSED' })
  const invalidPayload = { ...f.input, intents: [{ ...f.input.intents[0], payloadJson: '{' }] }
  assert.deepEqual(createOfflineRecoveryAdmissionV1(invalidPayload), {
    ok: false,
    code: 'INPUT_REFUSED',
  })
  const tooLarge = {
    ...f.input,
    intents: [{ ...f.input.intents[0], payloadJson: 'x'.repeat(262145) }],
  }
  assert.deepEqual(createOfflineRecoveryAdmissionV1(tooLarge), {
    ok: false,
    code: 'BOUNDS_REFUSED',
  })
  let intentOwnKeys = 0
  const tooManyIntents = new Array(129)
  tooManyIntents[0] = f.input.intents[0]
  const tooManyProxy = new Proxy(tooManyIntents, {
    ownKeys() {
      intentOwnKeys++
      throw new Error('must preflight intents length')
    },
  })
  assert.deepEqual(createOfflineRecoveryAdmissionV1({ ...f.input, intents: tooManyProxy }), {
    ok: false,
    code: 'BOUNDS_REFUSED',
  })
  assert.equal(intentOwnKeys, 0)
  let hugeArrayOwnKeys = 0
  const hugeArray = new Array(70000)
  hugeArray[0] = f.input.intents[0]
  const hugeProxy = new Proxy(hugeArray, {
    ownKeys() {
      hugeArrayOwnKeys++
      throw new Error('must preflight expanded length')
    },
  })
  assert.deepEqual(createOfflineRecoveryAdmissionV1({ ...f.input, extraArray: hugeProxy }), {
    ok: false,
    code: 'BOUNDS_REFUSED',
  })
  assert.equal(hugeArrayOwnKeys, 0)
  assert.equal(existsSync(join(f.root, 'pmc-intent-v1.sqlite')), false)
  assert.equal(existsSync(join(f.root, 'hro-recovery-admission-v1.sqlite')), false)
  const proxied = new Proxy(f.input, {
    ownKeys() {
      throw new Error('trap')
    },
  })
  assert.deepEqual(createOfflineRecoveryAdmissionV1(proxied), { ok: false, code: 'INPUT_REFUSED' })
})

test('separate processes race at most one complete admission', (t) => {
  const f = fixture(t)
  const children = [0, 1].map(() =>
    spawn(
      process.execPath,
      [
        '--import',
        'tsx',
        worker.pathname.replace(/^\/([A-Za-z]:)/, '$1'),
        JSON.stringify({ mode: 'race', input: f.input }),
      ],
      {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, TSX_DISABLE_CACHE: '1' },
        windowsHide: true,
      },
    ),
  )
  t.after(() => {
    children.forEach((child) => {
      child.kill()
    })
  })
  const outputs = children.map(
    (child) =>
      new Promise<string>((resolve, reject) => {
        let out = ''
        let error = ''
        child.stdout.on('data', (chunk) => {
          out += chunk.toString()
        })
        child.stderr.on('data', (chunk) => {
          error += chunk.toString()
        })
        child.on('error', reject)
        child.on('close', (code) => (code === 0 ? resolve(out) : reject(new Error(error))))
      }),
  )
  return Promise.all(outputs).then((values) => {
    const parsed = values.map((value) => JSON.parse(value.trim()))
    assert.equal(parsed.filter((value) => value.ok).length, 1)
    assert.equal(parsed.filter((value) => !value.ok).length, 1)
    assert(
      ['B1_REFUSED', 'ALREADY_ADMITTED'].includes(parsed.find((value) => !value.ok)?.code),
      JSON.stringify(parsed),
    )
  })
})

for (const after of [false, true]) {
  test(`B1 uncertainty ${after ? 'after' : 'before'} COMMIT withholds admission`, (t) => {
    const f = fixture(t)
    const child = spawnSync(
      process.execPath,
      [
        '--import',
        'tsx',
        worker.pathname.replace(/^\/([A-Za-z]:)/, '$1'),
        JSON.stringify({ mode: 'fault', phase: 'b1', after, input: f.input }),
      ],
      { encoding: 'utf8', env: { ...process.env, TSX_DISABLE_CACHE: '1' }, windowsHide: true },
    )
    assert.equal(child.status, 0, child.stderr)
    assert.deepEqual(JSON.parse(child.stdout.trim()), { ok: false, code: 'COMMIT_UNCERTAIN' })
    assert.equal(existsSync(join(f.root, 'pmc-intent-v1.sqlite')), true)
    assert.equal(existsSync(join(f.root, 'hro-recovery-admission-v1.sqlite')), false)
  })
}

for (const after of [false, true]) {
  test(`admission uncertainty ${after ? 'after' : 'before'} COMMIT withholds capability`, (t) => {
    const f = fixture(t)
    const child = spawnSync(
      process.execPath,
      [
        '--import',
        'tsx',
        worker.pathname.replace(/^\/([A-Za-z]:)/, '$1'),
        JSON.stringify({ mode: 'fault', phase: 'admission', after, input: f.input }),
      ],
      { encoding: 'utf8', env: { ...process.env, TSX_DISABLE_CACHE: '1' }, windowsHide: true },
    )
    assert.equal(child.status, 0, child.stderr)
    assert.deepEqual(JSON.parse(child.stdout.trim()), { ok: false, code: 'COMMIT_UNCERTAIN' })
    assert.equal(existsSync(join(f.root, 'pmc-intent-v1.sqlite')), true)
    assert.equal(existsSync(join(f.root, 'hro-recovery-admission-v1.sqlite')), true)
    assert.equal(createOfflineRecoveryAdmissionV1(f.input).ok, false)
  })
}

test('admission does not mint restart state and leaves authentic B1 reopen separate', (t) => {
  const f = fixture(t)
  const admitted = createOfflineRecoveryAdmissionV1(f.input)
  assert(admitted.ok)
  const opened = openIntentOwnerV1(
    { root: f.root, expectedIdentity: identity },
    {
      clock: () => now,
      authenticateOrigin: () => ({ accepted: false }),
      authenticateSelection: () => ({ accepted: false }),
      authenticateCompletion: () => ({ accepted: false }),
    },
  )
  assert(opened.ok)
  const a = f.input.intents[0]?.authority
  const episode = admitted.value.registration.episodes[0]
  assert(a && episode)
  const request = {
    ...a.routeTemplate,
    episodeId: episode.episodeId,
    requestId: episode.requestIds[0],
    requestDigest: episode.originalRequestDigest,
    attempt: { kind: 'initial' as const },
  }
  assert.equal(
    opened.value.owner.begin(
      { intentRef: a.intentRef, request, computedRequestDigest: episode.originalRequestDigest },
      Object.freeze({}),
    ).ok,
    false,
  )
  assert.equal(admitted.value.claimBrokerV1().ok, true)
  assert.equal(admitted.value.claimBrokerV1().ok, false)
})

for (const ownerCommitted of [false, true]) {
  test(`actual B1 and ledger paired closure ${ownerCommitted ? 'permits only R2' : 'stays blocked'}`, (t) => {
    const f = fixture(t)
    const admitted = createOfflineRecoveryAdmissionV1(f.input)
    assert(admitted.ok)
    const authority = present(f.input.intents[0]).authority
    const episode = present(admitted.value.registration.episodes[0])
    const ledgerRoot = mkdtempSync(join(tmpdir(), 'hro-p4a1-ledger-'))
    t.after(() => rmSync(ledgerRoot, { recursive: true, force: true }))
    const scope = authority.scope
    const ledgerInit = initializeLocalPmcLedger(
      {
        root: ledgerRoot,
        ledgerId: 'ledger',
        epoch: 'epoch',
        initializationAuthorityDigest: digest,
        scopes: [scope],
      },
      {
        clock: () => now,
        authenticateInitialization: (request) => ({
          accepted: true,
          ledgerId: request.ledgerId,
          epoch: request.epoch,
          initializationAuthorityDigest: request.initializationAuthorityDigest,
          scopesDigest: createHash('sha256').update(JSON.stringify(request.scopes)).digest('hex'),
        }),
      },
    )
    assert(ledgerInit.ok)
    const proofs = new Map<string, FixtureData>()
    const ledger = createLocalPmcLedger(
      {
        root: ledgerRoot,
        expectedLedgerId: 'ledger',
        expectedEpoch: 'epoch',
        expectedInitializationAuthorityDigest: digest,
      },
      {
        clock: () => now,
        authenticateSettlement: (_identity, proof: FixtureData) =>
          proofs.get(proof.proofRef) ?? { accepted: false },
        authenticateNoSendProof: (_identity, proof: FixtureData) =>
          proofs.get(proof.proofRef) ?? { accepted: false },
      },
    )
    assert(ledger.ok)
    const cost = computePmcCostV1({
      version: 'pmc-price/v1',
      currency: 'USD',
      requestDigest: episode.originalRequestDigest,
      identity: { bindingId: 'binding', provider: 'openrouter', providerModelId: 'model' },
      sourceProfileId: 'profile',
      sourceProfileVersion: '1',
      sourceProfileDigest: digest,
      tariffDigest: digest,
      priceEvidenceDigest: digest,
      inputRate: { value: '0.00001', unit: 'USD per token' },
      outputRate: { value: '0', unit: 'USD per token' },
      perRequestFeeUsd: '0',
      otherFees: 'none-attested',
      maximumInputTokens: 1,
      maximumOutputTokens: 0,
      rankingTokens: { input: 1, output: 0 },
    })
    assert(cost.ok)
    const request = {
      ...authority.routeTemplate,
      episodeId: episode.episodeId,
      requestId: episode.requestIds[0],
      requestDigest: episode.originalRequestDigest,
      attempt: { kind: 'initial' as const },
    }
    const evidence = (requestDigest: string, bindingId: string | null = null, quality = false) => ({
      receiptId: 'evidence',
      receiptDigest: digest,
      sourceRef: 'source',
      sourceDigest: digest,
      policyDigest: authority.policyDigest,
      configDigest: authority.configDigest,
      requestDigest,
      lane: authority.routeTemplate.lane,
      bindingId,
      evidenceState: quality ? 'model-quality' : 'static-conformance',
      observedAtUtc: now,
      expiresAtUtc: authority.authorityExpiresAtUtc,
    })
    const origin = Object.freeze({})
    const selected = {
      decisionDigest: 'b'.repeat(64),
      wireDigest: 'c'.repeat(64),
      bindingId: 'binding',
      provider: 'openrouter',
      matrixRole: 'primary' as const,
      primaryQuality: {
        status: 'supplied' as const,
        value: 0.9,
        evidence: evidence(episode.originalRequestDigest, 'binding', true),
      },
      scopeId: 'scope',
      costValueDigest: cost.value.costValueDigest,
      maximumMicroUsd: cost.value.maximumMicroUsd,
    }
    const completions = new Map<object, unknown>()
    const opened = openIntentOwnerV1(
      { root: f.root, expectedIdentity: identity },
      {
        clock: () => now,
        authenticateOrigin: (_a: unknown, _s: unknown, proposal: FixtureData, cap: object) =>
          cap === origin
            ? {
                accepted: true,
                episodeEvidence: evidence(proposal.request.requestDigest),
                budgetEvidence: evidence(proposal.request.requestDigest),
                priorDisposition:
                  proposal.request.attempt.kind === 'initial'
                    ? null
                    : proposal.request.attempt.priorDisposition,
                primaryQuality:
                  proposal.request.attempt.kind === 'initial'
                    ? null
                    : proposal.request.attempt.primaryQuality,
              }
            : { accepted: false },
        authenticateSelection: (_a: unknown, _d: string, cap: object) =>
          completions.get(cap) ?? { accepted: true, selection: selected },
        authenticateCompletion: (_a: unknown, _s: unknown, cap: object) =>
          completions.get(cap) ?? { accepted: false },
      },
    )
    assert(opened.ok)
    const begin = opened.value.owner.begin(
      {
        intentRef: authority.intentRef,
        request,
        computedRequestDigest: episode.originalRequestDigest,
      },
      origin,
    )
    assert(begin.ok)
    assert(opened.value.owner.recordDecision(begin.value.claim, Object.freeze({})).ok)
    const ledgerRequest = {
      requestId: episode.requestIds[0],
      requestDigest: episode.originalRequestDigest,
    }
    const reserved = ledger.value.reserve({
      ...ledgerRequest,
      scopeId: 'scope',
      costValue: cost.value,
      priceEvidence: cost.priceEvidence,
    })
    assert(reserved.ok)
    const proofRef = `proof-${ownerCommitted ? 'owner' : 'ledger'}`
    const proof = {
      accepted: true,
      ledgerId: 'ledger',
      epoch: 'epoch',
      ...ledgerRequest,
      scopeId: 'scope',
      proofRef,
      proofDigest: 'e'.repeat(64),
      noSend: true,
    }
    proofs.set(proofRef, proof)
    const closed = ledger.value.cancelWithNoSendProof({ ...ledgerRequest, proof })
    assert(closed.ok)
    if (ownerCommitted) {
      const completion = Object.freeze({})
      completions.set(completion, {
        accepted: true,
        kind: 'terminal-no-send',
        proof: { proofRef, proofDigest: proof.proofDigest, ledger: closed.value },
        reason: null,
      })
      assert(opened.value.owner.finish(begin.value.claim, completion).ok)
    }
    const reopened = openIntentOwnerV1(
      { root: f.root, expectedIdentity: identity },
      {
        clock: () => now,
        authenticateOrigin: (_a: unknown, _s: unknown, proposal: FixtureData, cap: object) =>
          cap === origin
            ? {
                accepted: true,
                episodeEvidence: evidence(proposal.request.requestDigest),
                budgetEvidence: evidence(proposal.request.requestDigest),
                priorDisposition:
                  proposal.request.attempt.kind === 'initial'
                    ? null
                    : proposal.request.attempt.priorDisposition,
                primaryQuality:
                  proposal.request.attempt.kind === 'initial'
                    ? null
                    : proposal.request.attempt.primaryQuality,
              }
            : { accepted: false },
        authenticateSelection: () => ({ accepted: false }),
        authenticateCompletion: () => ({ accepted: false }),
      },
    )
    assert(reopened.ok)
    const fallback = {
      ...request,
      requestId: episode.requestIds[1],
      requestDigest: createHash('sha256')
        .update(`${episode.originalRequestDigest}:r2`)
        .digest('hex'),
      attempt: {
        kind: 'fallback' as const,
        priorRequestId: episode.requestIds[0],
        priorDecisionDigest: selected.decisionDigest,
        priorRequestDigest: episode.originalRequestDigest,
        primaryBindingId: selected.bindingId,
        priorDisposition: {
          status: 'supplied' as const,
          value: 'terminal-no-send' as const,
          evidence: evidence(episode.originalRequestDigest, 'binding'),
        },
        primaryQuality: selected.primaryQuality,
      },
    }
    const fallbackResult = reopened.value.owner.begin(
      {
        intentRef: authority.intentRef,
        request: fallback,
        computedRequestDigest: fallback.requestDigest,
      },
      origin,
    )
    assert.equal(fallbackResult.ok, ownerCommitted)
    assert.equal(createOfflineRecoveryAdmissionV1(f.input).ok, false)
  })
}
