import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  truncateSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { type TestContext, test } from 'node:test'
import { resolvePmcRouteV1 } from '../../routing-policy/src/index.js'
import {
  closeIntentOwnerV1,
  initializeIntentOwnerV1,
  openIntentOwnerV1,
} from '../src/pmc-launch/intent-custody.js'
import { createLocalPmcLedger, initializeLocalPmcLedger } from '../src/pmc-launch/ledger.js'
import { computePmcCostV1 } from '../src/pmc-launch/money.js'

type FixtureData = ReturnType<typeof JSON.parse>
function present<T>(value: T | undefined): T {
  assert(value !== undefined)
  return value
}
const digest = 'a'.repeat(64)
const now = '2026-09-26T12:00:00.000Z'
const identity = {
  storeId: 'owner',
  ledgerId: 'ledger',
  epoch: 'epoch',
  initializationAuthorityDigest: digest,
  schemaVersion: 1,
}
function temporary(t: TestContext) {
  const root = mkdtempSync(join(tmpdir(), 'pmc-owner-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  return root
}
function proposal(root: string) {
  const f = JSON.parse(
    readFileSync(
      new URL('../../routing-policy/tests/fixtures/pmc-resolver-v1.json', import.meta.url),
      'utf8',
    ),
  )
  const {
    episodeId: _e,
    requestId: _r,
    requestDigest: _d,
    attempt: _a,
    ...routeTemplate
  } = f.request
  return {
    root,
    identity,
    intents: [
      {
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
      },
    ],
  }
}
const ports = {
  clock: () => now,
  authenticateOrigin: () => ({ accepted: false }),
  authenticateSelection: () => ({ accepted: false }),
  authenticateCompletion: () => ({ accepted: false }),
}
function fixture(
  t: TestContext,
  options: {
    beforeOrigin?: () => void
    beforeSelection?: () => void
    beforeCompletion?: () => void
    fallbackAllowed?: boolean
  } = {},
) {
  const root = temporary(t),
    setup = proposal(root),
    a = present(setup.intents[0])
  a.fallbackAllowed = options.fallbackAllowed ?? true
  const initialized = initializeIntentOwnerV1(setup, {
    authenticateSetup: () => ({ accepted: true }),
  })
  assert(initialized.ok)
  const ids = present(initialized.value[0]),
    origin = Object.freeze({})
  const selections = new WeakMap<object, unknown>(),
    completions = new WeakMap<object, unknown>()
  const evidence = (requestDigest = digest, bindingId: string | null = null, quality = false) => ({
    receiptId: 'evidence',
    receiptDigest: digest,
    sourceRef: 'source',
    sourceDigest: digest,
    policyDigest: a.policyDigest,
    configDigest: a.configDigest,
    requestDigest,
    lane: a.routeTemplate.lane,
    bindingId,
    evidenceState: quality ? 'model-quality' : 'static-conformance',
    observedAtUtc: now,
    expiresAtUtc: a.authorityExpiresAtUtc,
  })
  const trusted = {
    ...ports,
    authenticateOrigin: (_authority: unknown, _state: unknown, p: FixtureData, cap: object) => {
      options.beforeOrigin?.()
      return cap !== origin
        ? { accepted: false }
        : {
            accepted: true,
            episodeEvidence: evidence(p.request.requestDigest),
            budgetEvidence: evidence(p.request.requestDigest),
            priorDisposition:
              p.request.attempt.kind === 'initial' ? null : p.request.attempt.priorDisposition,
            primaryQuality:
              p.request.attempt.kind === 'initial' ? null : p.request.attempt.primaryQuality,
          }
    },
    authenticateSelection: (_a: unknown, _d: string, cap: object) => {
      options.beforeSelection?.()
      return selections.get(cap) ?? { accepted: false }
    },
    authenticateCompletion: (_a: unknown, _s: unknown, cap: object) => {
      options.beforeCompletion?.()
      return completions.get(cap) ?? { accepted: false }
    },
  }
  const opened = openIntentOwnerV1({ root, expectedIdentity: identity }, trusted)
  assert(opened.ok)
  const request = {
    ...a.routeTemplate,
    episodeId: ids.episodeId,
    requestId: ids.requestIds[0],
    requestDigest: digest,
    attempt: { kind: 'initial' },
  }
  const begin = () =>
    opened.value.owner.begin(
      { intentRef: a.intentRef, request, computedRequestDigest: request.requestDigest },
      origin,
    )
  const selected = {
    decisionDigest: 'b'.repeat(64),
    wireDigest: 'c'.repeat(64),
    bindingId: 'binding',
    provider: 'openrouter',
    matrixRole: 'primary',
    primaryQuality: { status: 'supplied', value: 0.9, evidence: evidence(digest, 'binding', true) },
    scopeId: 'scope',
    costValueDigest: 'd'.repeat(64),
    maximumMicroUsd: 10,
  }
  const select = (value = selected) => {
    const cap = Object.freeze({})
    selections.set(cap, { accepted: true, selection: value })
    return cap
  }
  const finish = (kind = 'terminal-no-send', ledger: unknown = null) => {
    const cap = Object.freeze({})
    completions.set(cap, {
      accepted: true,
      kind,
      proof: kind === 'held' ? null : { proofRef: 'proof', proofDigest: 'e'.repeat(64), ledger },
      reason: kind === 'held' ? 'controller-failure' : null,
    })
    return cap
  }
  return {
    root,
    setup,
    ids,
    origin,
    selections,
    completions,
    evidence,
    trusted,
    owner: opened.value.owner,
    request,
    begin,
    selected,
    select,
    finish,
  }
}
function sql(root: string, operation: (db: DatabaseSync) => void) {
  const db = new DatabaseSync(join(root, 'pmc-intent-v1.sqlite'))
  try {
    operation(db)
  } finally {
    db.close()
  }
}
function fallbackRequest(f: ReturnType<typeof fixture>) {
  return {
    ...f.request,
    requestId: f.ids.requestIds[1],
    requestDigest: 'f'.repeat(64),
    attempt: {
      kind: 'fallback',
      priorRequestId: f.ids.requestIds[0],
      priorRequestDigest: digest,
      priorDecisionDigest: f.selected.decisionDigest,
      primaryBindingId: f.selected.bindingId,
      priorDisposition: {
        status: 'supplied',
        value: 'terminal-no-send',
        evidence: f.evidence(digest, f.selected.bindingId),
      },
      primaryQuality: f.selected.primaryQuality,
    },
  }
}
function beginFallback(f: ReturnType<typeof fixture>, request = fallbackRequest(f)) {
  return f.owner.begin(
    { intentRef: 'intent', request, computedRequestDigest: request.requestDigest },
    f.origin,
  )
}
function clone<T>(value: T): T {
  return structuredClone(value)
}
// Consumer hash fixture, not an owner hashing/preparation API. P2C owns production hashing.
function requestBytes(q: FixtureData): string {
  const take = (v: FixtureData, keys: string[]) => Object.fromEntries(keys.map((k) => [k, v[k]]))
  const e = (v: FixtureData) =>
    take(v, [
      'receiptId',
      'receiptDigest',
      'sourceRef',
      'sourceDigest',
      'policyDigest',
      'configDigest',
      'requestDigest',
      'lane',
      'bindingId',
      'evidenceState',
      'observedAtUtc',
      'expiresAtUtc',
    ])
  const claim = (v: FixtureData) =>
    v.status === 'unknown'
      ? { status: 'unknown' }
      : { status: 'supplied', value: v.value, evidence: e(v.evidence) }
  const n = q.requirements,
    requirements = {
      ...take(n, [
        'toolUse',
        'structuredOutput',
        'reasoning',
        'thinkingLevel',
        'inputModalities',
        'requiredContextTokens',
        'requiredOutputTokens',
        'maximumInputTokens',
        'maximumOutputTokens',
      ]),
      rankingTokens: n.rankingTokens === null ? null : take(n.rankingTokens, ['input', 'output']),
    }
  const a = q.attempt,
    attempt =
      a.kind === 'initial'
        ? { kind: 'initial' }
        : {
            ...take(a, [
              'kind',
              'priorRequestId',
              'priorDecisionDigest',
              'priorRequestDigest',
              'primaryBindingId',
            ]),
            priorDisposition: claim(a.priorDisposition),
            primaryQuality: claim(a.primaryQuality),
          }
  const route = {
    ...take(q, [
      'version',
      'workflowId',
      'taskId',
      'episodeId',
      'requestId',
      'lane',
      'subRole',
      'routingClass',
      'dataClass',
    ]),
    requirements,
    attempt,
  }
  return JSON.stringify(['pmc-request/v1', 'intent', route, '{"messages":[]}'])
}
const requestHash = (q: unknown) => createHash('sha256').update(requestBytes(q)).digest('hex')
function reverseKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(reverseKeys)
  if (v && typeof v === 'object')
    return Object.fromEntries(
      Object.entries(v)
        .reverse()
        .map(([k, x]) => [k, reverseKeys(x)]),
    )
  return v
}
test('AC8 literal initial and full-prior-evidence fallback nested-order SHA256 fixtures', (t) => {
  const f = fixture(t),
    initial = { ...f.request, episodeId: 'episode', requestId: 'request' },
    fallback = {
      ...fallbackRequest(f),
      episodeId: 'episode',
      requestId: 'request2',
      attempt: { ...fallbackRequest(f).attempt, priorRequestId: 'request' },
    }
  assert.equal(
    requestHash(initial),
    '03df081eee666a13c19bf9be62d2b509e62a3772f07fcb39cc5b53538c06c91b',
  )
  assert.equal(
    requestHash(fallback),
    '21a36bfa4f26baec79295c8eadadda45e53f46a735110eec51e3b7434be504d2',
  )
  for (const q of [initial, fallback]) assert.equal(requestHash(reverseKeys(q)), requestHash(q))
  for (const claim of ['priorDisposition', 'primaryQuality'] as const) {
    const q = clone(fallback)
    q.attempt[claim].evidence.sourceDigest = '7'.repeat(64)
    assert.notEqual(requestHash(q), requestHash(fallback))
  }
  assert.equal(
    JSON.parse(requestBytes(fallback))[2].attempt.primaryQuality.evidence.requestDigest,
    digest,
  )
})
test('AC8 real resolver primary R1 to preissued R2 fallback preserves distinct evidence domains', (t) => {
  const f = fixture(t),
    raw = JSON.parse(
      readFileSync(
        new URL('../../routing-policy/tests/fixtures/pmc-resolver-v1.json', import.meta.url),
        'utf8',
      ),
    )
  f.request.requestDigest = requestHash(f.request)
  const bind = (v: unknown, d: string) => {
    if (v && typeof v === 'object') {
      const r = v as Record<string, unknown>
      if (Object.hasOwn(r, 'receiptId')) r.requestDigest = d
      for (const x of Object.values(r)) bind(x, d)
    }
  }
  bind(raw.context, f.request.requestDigest)
  const b = f.begin()
  assert(b.ok)
  raw.context.episode = b.value.episode
  raw.context.budget.evidence = b.value.budgetEvidence
  const first = resolvePmcRouteV1(b.value.request, raw.context)
  assert(first.ok, JSON.stringify(first))
  assert.equal(first.decision.terminal, false)
  const candidate = raw.context.bindings.find(
    (x: FixtureData) => x.bindingId === first.decision.bindingId,
  )
  const selected = {
    ...f.selected,
    bindingId: first.decision.bindingId,
    provider: first.decision.provider,
    primaryQuality: candidate.quality,
  }
  f.selected.bindingId = selected.bindingId
  f.selected.provider = selected.provider
  f.selected.primaryQuality = selected.primaryQuality
  assert(f.owner.recordDecision(b.value.claim, f.select(selected)).ok)
  assert(f.owner.finish(b.value.claim, f.finish()).ok)
  const request = fallbackRequest(f)
  request.attempt.priorRequestDigest = f.request.requestDigest
  request.attempt.priorDisposition.evidence.requestDigest = f.request.requestDigest
  request.requestDigest = requestHash(request)
  const next = beginFallback(f, request)
  assert(next.ok, JSON.stringify(next))
  const context = clone(raw.context)
  bind(context, request.requestDigest)
  context.episode = next.value.episode
  context.budget.evidence = next.value.budgetEvidence
  const second = resolvePmcRouteV1(next.value.request, context)
  assert(second.ok, JSON.stringify(second))
  assert.equal(second.decision.terminal, true)
  assert.notEqual(second.decision.bindingId, first.decision.bindingId)
  for (const key of ['priorDisposition', 'primaryQuality'] as const) {
    const wrong = clone(request)
    wrong.attempt[key].evidence.requestDigest = wrong.requestDigest
    const rejected = resolvePmcRouteV1(wrong, context)
    assert(!rejected.ok)
    assert.equal(rejected.code, 'CONTEXT_BINDING_REFUSED')
  }
  const secondSelection = {
    ...selected,
    bindingId: second.decision.bindingId,
    matrixRole: 'fallback',
    primaryQuality: context.bindings.find(
      (x: FixtureData) => x.bindingId === second.decision.bindingId,
    ).quality,
  }
  assert(f.owner.recordDecision(next.value.claim, f.select(secondSelection)).ok)
  assert(f.owner.finish(next.value.claim, f.finish()).ok)
  assert.equal(beginFallback(f, request).ok, false)
})
const worker = new URL('./fixtures/pmc-intent-custody-worker.ts', import.meta.url)
test('AC4 independent processes race actual begin: exactly one durable winner', async (t) => {
  const f = fixture(t),
    p = { intentRef: 'intent', request: f.request, computedRequestDigest: digest }
  const input = {
    root: f.root,
    identity,
    now,
    proposal: p,
    originAnswer: {
      accepted: true,
      episodeEvidence: f.evidence(),
      budgetEvidence: f.evidence(),
      priorDisposition: null,
      primaryQuality: null,
    },
  }
  const children = [0, 1].map(() =>
    spawn(
      process.execPath,
      ['--import', 'tsx', worker.pathname.replace(/^\/([A-Za-z]:)/, '$1'), JSON.stringify(input)],
      { stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, TSX_DISABLE_CACHE: '1' } },
    ),
  )
  t.after(() => {
    for (const child of children) child.kill()
  })
  const waiting = children.map((child) => {
    let output = ''
    let errors = ''
    let readyResolve!: () => void
    const ready = new Promise<void>((resolve) => {
      readyResolve = resolve
    })
    child.stdout.on('data', (chunk) => {
      output += chunk.toString()
      if (output.includes('READY\n')) readyResolve()
    })
    child.stderr.on('data', (chunk) => {
      errors += chunk.toString()
    })
    const done = new Promise<FixtureData>((resolve, reject) => {
      child.on('error', reject)
      child.on('close', (code) => {
        if (code !== 0) reject(new Error(errors))
        else resolve(JSON.parse(present(output.split('\n')[1])))
      })
    })
    return { ready, done }
  })
  await Promise.all(waiting.map((x) => x.ready))
  for (const child of children) child.stdin.write('go\n')
  const results = await Promise.all(waiting.map((x) => x.done))
  assert.equal(results.filter((r) => r.ok).length, 1)
  sql(f.root, (db) => {
    assert.equal(db.prepare('SELECT revision FROM intents').get()?.revision, 1)
  })
  assert.equal(f.begin().ok, false)
})
for (const phase of ['selection', 'completion'])
  test(`AC4 independent SQLite process wins ${phase} CAS boundary; stale owner refuses`, (t) => {
    let f: ReturnType<typeof fixture>,
      changes = -1
    const compete = () => {
      const selected = phase === 'completion' ? f.selected : null
      const revision = phase === 'completion' ? 2 : 1
      const state = {
        slots: [
          { state: 'held', requestDigest: digest, selected, reason: 'controller-failure' },
          { state: 'unused' },
        ],
      }
      const child = spawnSync(
        process.execPath,
        [
          '--import',
          'tsx',
          worker.pathname.replace(/^\/([A-Za-z]:)/, '$1'),
          JSON.stringify({ mode: 'cas', root: f.root, state, revision }),
        ],
        { encoding: 'utf8', env: { ...process.env, TSX_DISABLE_CACHE: '1' } },
      )
      assert.equal(child.status, 0, child.stderr)
      changes = JSON.parse(child.stdout).changes
    }
    f = fixture(
      t,
      phase === 'selection' ? { beforeSelection: compete } : { beforeCompletion: compete },
    )
    const b = f.begin()
    assert(b.ok)
    if (phase === 'completion') assert(f.owner.recordDecision(b.value.claim, f.select()).ok)
    const r =
      phase === 'selection'
        ? f.owner.recordDecision(b.value.claim, f.select())
        : f.owner.finish(b.value.claim, f.finish())
    assert.deepEqual(r, { ok: false, code: 'STATE_REFUSED' })
    assert.equal(changes, 1)
    sql(f.root, (db) => {
      assert.equal(
        db.prepare('SELECT revision FROM intents').get()?.revision,
        phase === 'selection' ? 2 : 3,
      )
    })
  })
function commitFault<T>(after: boolean, fn: () => T): T {
  const original = DatabaseSync.prototype.exec
  const writers = new WeakSet<DatabaseSync>()
  DatabaseSync.prototype.exec = function (sql: string) {
    if (sql === 'BEGIN IMMEDIATE') writers.add(this)
    if (sql === 'COMMIT' && writers.has(this)) {
      if (after) original.call(this, sql)
      throw new Error('injected private failure')
    }
    return original.call(this, sql)
  }
  try {
    return fn()
  } finally {
    DatabaseSync.prototype.exec = original
  }
}
for (const phase of ['begin', 'selection', 'finish'])
  for (const after of [false, true])
    test(`AC6 ${phase} ${after ? 'lost acknowledgement after' : 'failure before'} COMMIT blocks replay`, (t) => {
      const f = fixture(t)
      let claim: object | undefined
      if (phase !== 'begin') {
        const b = f.begin()
        assert(b.ok)
        claim = b.value.claim
      }
      if (phase === 'finish') assert(f.owner.recordDecision(present(claim), f.select()).ok)
      const r = commitFault(after, () =>
        phase === 'begin'
          ? f.begin()
          : phase === 'selection'
            ? f.owner.recordDecision(present(claim), f.select())
            : f.owner.finish(present(claim), f.finish()),
      )
      assert.deepEqual(r, { ok: false, code: 'COMMIT_UNCERTAIN' })
      assert.equal(f.begin().ok, false)
      const reopened = openIntentOwnerV1({ root: f.root, expectedIdentity: identity }, f.trusted)
      assert(reopened.ok)
      if (after || phase !== 'begin')
        assert.equal(
          reopened.value.owner.begin(
            { intentRef: 'intent', request: f.request, computedRequestDigest: digest },
            f.origin,
          ).ok,
          false,
        )
      if (claim) assert.equal(f.owner.finish(claim, f.finish()).ok, false)
    })
test('AC1 setup callback reentry cannot initialize the same root', (t) => {
  const root = temporary(t),
    p = proposal(root)
  let inner: unknown
  const outer = initializeIntentOwnerV1(p, {
    authenticateSetup: () => {
      inner = initializeIntentOwnerV1(p, { authenticateSetup: () => ({ accepted: true }) })
      return { accepted: true }
    },
  })
  assert.deepEqual(inner, { ok: false, code: 'STATE_REFUSED' })
  assert(outer.ok)
})
test('AC6 lost close acknowledgement after begin commit quarantines the instance', (t) => {
  const f = fixture(t),
    original = DatabaseSync.prototype.close,
    exec = DatabaseSync.prototype.exec,
    committed = new WeakSet<DatabaseSync>()
  DatabaseSync.prototype.exec = function (sql: string) {
    const r = exec.call(this, sql)
    if (sql === 'COMMIT') committed.add(this)
    return r
  }
  DatabaseSync.prototype.close = function () {
    original.call(this)
    if (committed.has(this)) throw new Error('lost close acknowledgement')
  }
  try {
    assert.deepEqual(f.begin(), { ok: false, code: 'COMMIT_UNCERTAIN' })
  } finally {
    DatabaseSync.prototype.close = original
    DatabaseSync.prototype.exec = exec
  }
  assert.equal(f.begin().ok, false)
})
function actualLedger(t: TestContext, f: ReturnType<typeof fixture>) {
  const root = temporary(t),
    scope = f.setup.intents[0]?.scope
  const initialized = initializeLocalPmcLedger(
    {
      root,
      ledgerId: 'ledger',
      epoch: 'epoch',
      initializationAuthorityDigest: digest,
      scopes: [scope],
    },
    {
      clock: () => now,
      authenticateInitialization: (r) => ({
        accepted: true,
        ledgerId: r.ledgerId,
        epoch: r.epoch,
        initializationAuthorityDigest: r.initializationAuthorityDigest,
        scopesDigest: createHash('sha256').update(JSON.stringify(r.scopes)).digest('hex'),
      }),
    },
  )
  assert(initialized.ok)
  const proofs = new Map<string, unknown>()
  const ledger = createLocalPmcLedger(
    {
      root,
      expectedLedgerId: 'ledger',
      expectedEpoch: 'epoch',
      expectedInitializationAuthorityDigest: digest,
    },
    {
      clock: () => now,
      authenticateSettlement: (_a, p: FixtureData) => proofs.get(p.proofRef) ?? { accepted: false },
      authenticateNoSendProof: (_a, p: FixtureData) =>
        proofs.get(p.proofRef) ?? { accepted: false },
    },
  )
  assert(ledger.ok)
  const cost = computePmcCostV1({
    version: 'pmc-price/v1',
    currency: 'USD',
    requestDigest: digest,
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
  f.selected.costValueDigest = cost.value.costValueDigest
  f.selected.maximumMicroUsd = cost.value.maximumMicroUsd
  const request = { requestId: f.ids.requestIds[0], requestDigest: digest }
  const reserve = () =>
    ledger.value.reserve({
      ...request,
      scopeId: 'scope',
      costValue: cost.value,
      priceEvidence: cost.priceEvidence,
    })
  const issue = (kind: 'no-send' | 'known' | 'unknown') => {
    const proofRef = `proof-${kind}`,
      p = {
        accepted: true,
        ledgerId: 'ledger',
        epoch: 'epoch',
        ...request,
        scopeId: 'scope',
        proofRef,
        proofDigest: '9'.repeat(64),
        ...(kind === 'no-send'
          ? { noSend: true }
          : { outcome: kind === 'known' ? { kind, actualMicroUsd: 3 } : { kind } }),
      }
    proofs.set(proofRef, p)
    return p
  }
  return { root, ledger: ledger.value, request, reserve, issue }
}
for (const boundary of ['reserve', 'consume', 'settle', 'cancel'])
  for (const after of [false, true])
    test(`AC6 actual ledger ${boundary} ${after ? 'lost ack' : 'precommit fault'} preserves owner blocking`, (t) => {
      const f = fixture(t),
        l = actualLedger(t, f),
        b = f.begin()
      assert(b.ok)
      assert(f.owner.recordDecision(b.value.claim, f.select()).ok)
      if (boundary !== 'reserve') assert(l.reserve().ok)
      if (boundary === 'settle') assert(l.ledger.consume(l.request).ok)
      const r = commitFault(after, () =>
        boundary === 'reserve'
          ? l.reserve()
          : boundary === 'consume'
            ? l.ledger.consume(l.request)
            : boundary === 'settle'
              ? l.ledger.settle({ ...l.request, observation: l.issue('known') })
              : l.ledger.cancelWithNoSendProof({ ...l.request, proof: l.issue('no-send') }),
      )
      assert.deepEqual(r, { ok: false, code: 'LEDGER_COMMIT_UNCERTAIN' })
      assert.equal(f.begin().ok, false)
      assert.equal(beginFallback(f).ok, false)
      const s = l.ledger.snapshot({ scopeId: 'scope' })
      assert(s.ok)
      const expected =
        boundary === 'reserve' && !after
          ? 0
          : (boundary === 'settle' || boundary === 'cancel') && after
            ? 0
            : f.selected.maximumMicroUsd
      assert.equal(s.value.outstandingMicroUsd, expected)
      if (boundary === 'settle' && after) assert.equal(s.value.settledMicroUsd, 3)
    })
for (const outcome of ['terminal-no-send', 'terminal-failed-settled', 'succeeded', 'uncertain'])
  test(`AC7 direct real ledger ${outcome} accepted only with private completion custody`, (t) => {
    const f = fixture(t),
      l = actualLedger(t, f),
      b = f.begin()
    assert(b.ok)
    assert(f.owner.recordDecision(b.value.claim, f.select()).ok)
    assert(l.reserve().ok)
    if (outcome !== 'terminal-no-send') assert(l.ledger.consume(l.request).ok)
    const terminal =
      outcome === 'terminal-no-send'
        ? l.ledger.cancelWithNoSendProof({ ...l.request, proof: l.issue('no-send') })
        : l.ledger.settle({
            ...l.request,
            observation: l.issue(outcome === 'uncertain' ? 'unknown' : 'known'),
          })
    assert(terminal.ok)
    assert.equal(f.owner.finish(b.value.claim, terminal.value).ok, false)
    assert(f.owner.finish(b.value.claim, f.finish(outcome, terminal.value)).ok)
    if (outcome === 'succeeded' || outcome === 'uncertain') assert.equal(beginFallback(f).ok, false)
  })
for (const field of [
  'ledgerId',
  'epoch',
  'requestId',
  'scopeId',
  'requestDigest',
  'costValueDigest',
  'maximumMicroUsd',
  'state',
  'actualMicroUsd',
  'proofRef',
  'proofDigest',
  'createdAtUtc',
  'updatedAtUtc',
])
  test(`AC7 independently rejects completion ledger ${field}`, (t) => {
    const f = fixture(t),
      l = actualLedger(t, f),
      b = f.begin()
    assert(b.ok)
    assert(f.owner.recordDecision(b.value.claim, f.select()).ok)
    assert(l.reserve().ok)
    const terminal = l.ledger.cancelWithNoSendProof({ ...l.request, proof: l.issue('no-send') })
    assert(terminal.ok)
    const bad: FixtureData = clone(terminal.value)
    bad[field] =
      field === 'maximumMicroUsd'
        ? 11
        : field === 'actualMicroUsd'
          ? 1
          : field === 'state'
            ? 'settled'
            : field === 'createdAtUtc'
              ? '2026-09-27T12:00:00.000Z'
              : field === 'updatedAtUtc'
                ? 'invalid'
                : ''
    assert.equal(f.owner.finish(b.value.claim, f.finish('terminal-no-send', bad)).ok, false)
    assert(f.owner.finish(b.value.claim, f.finish('terminal-no-send', terminal.value)).ok)
  })
test('AC6 sender failure retains consumed liability and pending owner; ledger closure does not close owner', (t) => {
  const f = fixture(t),
    l = actualLedger(t, f),
    b = f.begin()
  assert(b.ok)
  assert(f.owner.recordDecision(b.value.claim, f.select()).ok)
  assert(l.reserve().ok)
  assert(l.ledger.consume(l.request).ok)
  let sends = 0
  try {
    sends++
    throw new Error('fake sender failed')
  } catch {
    /* No semantic no-send proof exists. */
  }
  assert.equal(beginFallback(f).ok, false)
  const s = l.ledger.snapshot({ scopeId: 'scope' })
  assert(s.ok)
  assert.equal(s.value.outstandingMicroUsd, 10)
  const terminal = l.ledger.settle({ ...l.request, observation: l.issue('known') })
  assert(terminal.ok)
  assert.equal(
    commitFault(false, () => f.owner.finish(b.value.claim, f.finish('succeeded', terminal.value)))
      .ok,
    false,
  )
  assert.equal(beginFallback(f).ok, false)
  assert.equal(sends, 1)
})
for (const [name, mutate] of Object.entries({
  extra: (p: FixtureData) => {
    p.extra = 1
  },
  getter: (p: FixtureData) => {
    Object.defineProperty(p, 'root', {
      get() {
        throw new Error('secret')
      },
      enumerable: true,
    })
  },
  symbol: (p: FixtureData) => {
    p[Symbol('x')] = 1
  },
  hidden: (p: FixtureData) => {
    Object.defineProperty(p, 'x', { value: 1 })
  },
  cycle: (p: FixtureData) => {
    p.intents[0].cycle = p
  },
  thenable: (p: FixtureData) => {
    // biome-ignore lint/suspicious/noThenProperty: hostile thenable input is the rejection fixture.
    p.then = 1
  },
  prototype: (p: FixtureData) => {
    Object.setPrototypeOf(p, {})
  },
  function: (p: FixtureData) => {
    p.intents[0].originId = () => 1
  },
  nonfinite: (p: FixtureData) => {
    p.intents[0].scope.authorizedLimitMicroUsd = Infinity
  },
  sparse: (p: FixtureData) => {
    delete p.intents[0]
  },
  expanded: (p: FixtureData) => {
    const v = 'x'.repeat(2048)
    let a: FixtureData = Array(32).fill(v)
    a = Array(32).fill(a)
    p.intents[0].extra = a
  },
  depth: (p: FixtureData) => {
    let v: FixtureData = {}
    for (let i = 0; i < 18; i++) v = { v }
    p.intents[0].extra = v
  },
}))
  test(`AC1 ordinary setup rejects ${name} before authority or I/O`, (t) => {
    const root = temporary(t),
      p = proposal(root)
    mutate(p)
    let calls = 0
    assert.equal(
      initializeIntentOwnerV1(p, {
        authenticateSetup: () => {
          calls++
          return { accepted: true }
        },
      }).ok,
      false,
    )
    assert.equal(calls, 0)
    assert.equal(existsSync(join(root, 'pmc-intent-v1.sqlite')), false)
  })
for (const mode of ['dense', 'sparse', 'minimum', 'record', 'keys', 'long-key'])
  test(`AC1 capture preflight ${mode} refuses before child descriptors`, (t) => {
    const root = temporary(t)
    const array = ['dense', 'sparse', 'minimum'].includes(mode)
    const target: FixtureData = array
      ? mode === 'sparse'
        ? new Array(70000)
        : Array(mode === 'minimum' ? 32768 : 70000).fill(null)
      : Object.fromEntries(
          Array.from({ length: mode === 'record' ? 32768 : mode === 'keys' ? 513 : 1 }, (_, i) => [
            mode === 'record'
              ? String(i)
              : String(i).padEnd(mode === 'long-key' ? 2049 : 2048, 'x'),
            null,
          ]),
        )
    let keys = 0,
      children = 0,
      lengths = 0,
      auth = 0
    const input = new Proxy(target, {
      ownKeys(value) {
        keys++
        return Reflect.ownKeys(value)
      },
      getOwnPropertyDescriptor(value, key) {
        if (key === 'length') lengths++
        else children++
        return Reflect.getOwnPropertyDescriptor(value, key)
      },
    })
    assert.deepEqual(
      initializeIntentOwnerV1(
        { ...proposal(root), extra: input },
        {
          authenticateSetup() {
            auth++
            return { accepted: true }
          },
        },
      ),
      { ok: false, code: 'BOUNDS_REFUSED' },
    )
    assert.equal(children, 0)
    assert.equal(keys, array ? 0 : 1)
    assert.equal(lengths, array ? 1 : 0)
    assert.equal(auth, 0)
    assert.equal(existsSync(join(root, 'pmc-intent-v1.sqlite')), false)
  })

test('AC1 capture preflight charges expanded aliases before repeating child descent', () => {
  let keys = 0,
    children = 0,
    lengths = 0
  const shared = new Proxy(Array(32764).fill(null), {
    ownKeys(value) {
      keys++
      return Reflect.ownKeys(value)
    },
    getOwnPropertyDescriptor(value, key) {
      if (key === 'length') lengths++
      else children++
      return Reflect.getOwnPropertyDescriptor(value, key)
    },
  })
  assert.deepEqual(initializeIntentOwnerV1([shared, shared], {}), {
    ok: false,
    code: 'BOUNDS_REFUSED',
  })
  assert.equal(keys, 1)
  assert.equal(lengths, 2)
  assert.equal(children, 32764)
})

for (const mode of ['visits', 'key-units', 'string', 'depth'])
  for (const over of [false, true])
    test(`AC1 capture preflight ${mode} exact boundary over=${over}`, () => {
      let input: unknown
      if (mode === 'visits') input = Array(over ? 32768 : 32767).fill(null)
      else if (mode === 'key-units')
        input = Object.fromEntries(
          Array.from({ length: 512 }, (_, i) => [
            String(i).padEnd(2048, 'x'),
            over && i === 511 ? 'x' : null,
          ]),
        )
      else if (mode === 'string') input = 'x'.repeat(over ? 2049 : 2048)
      else {
        input = null
        for (let i = 0; i < (over ? 17 : 16); i++) input = { x: input }
      }
      // Within-budget captures reach the setup shape check; these deliberately
      // are not setup proposals. The visit boundary is 65,535: complete trees
      // have 1 + 2 * edges visits, so 65,536 cannot be a complete capture.
      assert.deepEqual(initializeIntentOwnerV1(input, {}), {
        ok: false,
        code: over ? 'BOUNDS_REFUSED' : 'INPUT_REFUSED',
      })
    })

for (const mode of ['length-throw', 'keys-throw', 'child-throw', 'delete-child', 'shrink-array'])
  test(`AC1 capture preflight typed late refusal ${mode}`, (t) => {
    const root = temporary(t)
    let auth = 0,
      getters = 0
    const target: FixtureData = mode === 'delete-child' ? { a: 1, b: 2 } : [1, 2]
    const input = new Proxy(target, {
      ownKeys(value) {
        if (mode === 'keys-throw') throw new Error('hostile keys')
        const keys = Reflect.ownKeys(value)
        if (mode === 'shrink-array') value.length = 1
        return keys
      },
      getOwnPropertyDescriptor(value, key) {
        if (
          (mode === 'length-throw' && key === 'length') ||
          (mode === 'child-throw' && key === '0')
        )
          throw new Error('hostile descriptor')
        if (mode === 'delete-child' && key === 'a') delete value.b
        return Reflect.getOwnPropertyDescriptor(value, key)
      },
      get() {
        getters++
        throw new Error('must not read values')
      },
    })
    assert.deepEqual(
      initializeIntentOwnerV1(
        { ...proposal(root), extra: input },
        {
          authenticateSetup() {
            auth++
            return { accepted: true }
          },
        },
      ),
      { ok: false, code: 'INPUT_REFUSED' },
    )
    assert.equal(auth, 0)
    assert.equal(getters, 0)
    assert.equal(existsSync(join(root, 'pmc-intent-v1.sqlite')), false)
  })

for (const answer of [
  null,
  { accepted: true, extra: 1 },
  { accepted: false },
  Promise.resolve({ accepted: true }),
])
  test('AC1 setup return is exact ordinary acceptance', (t) => {
    const root = temporary(t)
    assert.equal(
      initializeIntentOwnerV1(proposal(root), { authenticateSetup: () => answer }).ok,
      false,
    )
    assert.equal(existsSync(join(root, 'pmc-intent-v1.sqlite')), false)
  })
for (const field of ['intentRef', 'businessAuthorityRef', 'tuple'])
  test(`AC1 rejects duplicate batch ${field}`, (t) => {
    const root = temporary(t),
      p = proposal(root),
      second = clone(present(p.intents[0]))
    if (field !== 'intentRef') second.intentRef = 'intent2'
    if (field !== 'businessAuthorityRef') second.businessAuthorityRef = 'business2'
    if (field !== 'tuple') second.originId = 'origin2'
    p.intents.push(second)
    assert.equal(
      initializeIntentOwnerV1(p, { authenticateSetup: () => ({ accepted: true }) }).ok,
      false,
    )
    assert.equal(existsSync(join(root, 'pmc-intent-v1.sqlite')), false)
  })
for (const count of [0, 129])
  test(`AC1 batch capacity ${count} refuses`, (t) => {
    const root = temporary(t),
      p = proposal(root)
    p.intents = Array(count).fill(p.intents[0])
    assert.equal(
      initializeIntentOwnerV1(p, { authenticateSetup: () => ({ accepted: true }) }).ok,
      false,
    )
  })
for (const corrupt of [
  'extra-table',
  'extra-index',
  'extra-column',
  'missing-table',
  'identity',
  'row-json',
  'row-extra',
  'revision',
  'id',
  'empty-meta',
  'extra-trigger',
  'size',
  'sidecar',
  'partial',
])
  test(`AC2 refuses ${corrupt} storage without reset`, (t) => {
    const f = fixture(t),
      file = join(f.root, 'pmc-intent-v1.sqlite')
    if (corrupt === 'size') truncateSync(file, 134217729)
    else if (corrupt === 'sidecar') writeFileSync(`${file}-wal`, 'x')
    else if (corrupt === 'partial') writeFileSync(file, 'partial')
    else
      sql(f.root, (db) => {
        const statements: Record<string, string> = {
          'extra-table': 'CREATE TABLE extra(x)',
          'extra-index': 'CREATE INDEX extra ON intents(revision)',
          'extra-column': 'ALTER TABLE intents ADD COLUMN extra TEXT',
          'missing-table': 'DROP TABLE intents',
          identity: "UPDATE owner_meta SET epoch='other'",
          'row-json': "UPDATE intents SET stateJson='{'",
          'row-extra': `UPDATE intents SET stateJson='{"slots":[{"state":"unused"},{"state":"unused"}],"extra":1}'`,
          revision: 'UPDATE intents SET revision=1',
          id: 'UPDATE intents SET request2=request1',
          'empty-meta': 'DELETE FROM owner_meta',
          'extra-trigger': 'CREATE TRIGGER extra AFTER UPDATE ON intents BEGIN SELECT 1; END',
        }
        if (corrupt === 'id') db.exec('PRAGMA ignore_check_constraints=ON')
        db.exec(present(statements[corrupt]))
      })
    assert.equal(
      openIntentOwnerV1({ root: f.root, expectedIdentity: identity }, f.trusted).ok,
      false,
    )
    assert.equal(
      initializeIntentOwnerV1(f.setup, { authenticateSetup: () => ({ accepted: true }) }).ok,
      false,
    )
  })
test('AC2 missing database refuses; canonical root and junction are not interchangeable', (t) => {
  const root = temporary(t)
  assert.deepEqual(openIntentOwnerV1({ root, expectedIdentity: identity }, ports), {
    ok: false,
    code: 'STORAGE_MISSING',
  })
  for (const candidate of ['relative', 'file:///tmp/owner', `${root}/..`, `${root}/./`])
    assert.equal(
      initializeIntentOwnerV1(
        { ...proposal(root), root: candidate },
        { authenticateSetup: () => ({ accepted: true }) },
      ).ok,
      false,
    )
  const link = join(root, 'alias'),
    target = temporary(t)
  symlinkSync(target, link, process.platform === 'win32' ? 'junction' : 'dir')
  assert.equal(
    initializeIntentOwnerV1(
      { ...proposal(root), root: link },
      { authenticateSetup: () => ({ accepted: true }) },
    ).ok,
    false,
  )
})
for (const field of [
  'episodeId',
  'requestId',
  'requestDigest',
  'workflowId',
  'taskId',
  'lane',
  'subRole',
  'routingClass',
  'version',
  'dataClass',
  'requirements',
])
  test(`AC3 independently binds ${field}`, (t) => {
    const f = fixture(t),
      r: FixtureData = clone(f.request)
    r[field] =
      field === 'requirements'
        ? { ...r.requirements, maximumInputTokens: 999 }
        : field === 'requestDigest'
          ? 'b'.repeat(64)
          : 'different'
    assert.equal(
      f.owner.begin({ intentRef: 'intent', request: r, computedRequestDigest: digest }, f.origin)
        .ok,
      false,
    )
    assert(f.begin().ok)
  })
for (const kind of ['terminal-no-send', 'terminal-failed-settled', 'succeeded', 'uncertain'])
  test(`AC7 unselected ${kind} never closes`, (t) => {
    const f = fixture(t),
      b = f.begin()
    assert(b.ok)
    assert.equal(f.owner.finish(b.value.claim, f.finish(kind)).ok, false)
    assert.equal(f.begin().ok, false)
  })
test('AC5 fallback selection, success and undeclared second slot terminate intent', (t) => {
  for (const fallbackAllowed of [false, true]) {
    const f = fixture(t, { fallbackAllowed }),
      b = f.begin()
    assert(b.ok)
    assert(
      f.owner.recordDecision(
        b.value.claim,
        f.select({ ...f.selected, matrixRole: fallbackAllowed ? 'fallback' : 'primary' }),
      ).ok,
    )
    assert(f.owner.finish(b.value.claim, f.finish()).ok)
    assert.equal(beginFallback(f).ok, false)
  }
})
for (const field of [
  'priorRequestId',
  'priorRequestDigest',
  'priorDecisionDigest',
  'primaryBindingId',
  'priorDisposition',
  'primaryQuality',
])
  test(`AC5 fallback independently binds ${field}`, (t) => {
    const f = fixture(t),
      b = f.begin()
    assert(b.ok)
    assert(f.owner.recordDecision(b.value.claim, f.select()).ok)
    assert(f.owner.finish(b.value.claim, f.finish()).ok)
    const request: FixtureData = fallbackRequest(f)
    if (field === 'primaryQuality') request.attempt[field].value = 0.8
    else if (field === 'priorDisposition') request.attempt[field].value = 'terminal-failed-settled'
    else request.attempt[field] = 'wrong'
    assert.equal(beginFallback(f, request).ok, false)
  })
test('AC4 callback same-intent reentry is denied and callback may acquire a SQLite writer lock', (t) => {
  let f: ReturnType<typeof fixture>
  f = fixture(t, {
    beforeOrigin: () => {
      assert.equal(f.begin().ok, false)
      sql(f.root, (db) => {
        db.exec('BEGIN IMMEDIATE')
        db.exec('ROLLBACK')
      })
    },
  })
  assert(f.begin().ok)
})
for (const phase of ['selection', 'completion'])
  test(`AC4 copied/proxied/cross-instance ${phase} claims deny`, (t) => {
    const f = fixture(t),
      b = f.begin()
    assert(b.ok)
    const opened = openIntentOwnerV1({ root: f.root, expectedIdentity: identity }, f.trusted)
    assert(opened.ok)
    const method = phase === 'selection' ? 'recordDecision' : 'finish',
      cap = phase === 'selection' ? f.select() : f.finish('closed-refused')
    for (const claim of [
      { ...b.value.claim },
      new Proxy(b.value.claim, {}),
      JSON.parse(JSON.stringify(b.value.claim)),
    ])
      assert.equal(f.owner[method](claim, cap).ok, false)
    assert.equal(opened.value.owner[method](b.value.claim, cap).ok, false)
    assert.equal(f.owner[method](b.value.claim, {}).ok, false)
  })
test('AC3 claim persists before use; wrong origin, digest and restart cannot reopen', (t) => {
  const f = fixture(t),
    p = { intentRef: 'intent', request: f.request, computedRequestDigest: digest }
  assert.equal(f.owner.begin(p, {}).ok, false)
  assert.equal(f.owner.begin({ ...p, computedRequestDigest: 'f'.repeat(64) }, f.origin).ok, false)
  const b = f.begin()
  assert(b.ok)
  assert.equal(f.begin().ok, false)
  assert.equal(f.owner.recordDecision({}, f.select()).ok, false)
  assert(closeIntentOwnerV1(f.owner).ok)
  const reopened = openIntentOwnerV1({ root: f.root, expectedIdentity: identity }, f.trusted)
  assert(reopened.ok)
  assert.equal(reopened.value.owner.begin(p, f.origin).ok, false)
  assert.equal(reopened.value.owner.recordDecision(b.value.claim, f.select()).ok, false)
})
test('AC5 acknowledged selection advances same claim, primary closure alone enables slot two', (t) => {
  const f = fixture(t),
    b = f.begin()
  assert(b.ok)
  assert.deepEqual(f.owner.recordDecision(b.value.claim, f.select()), { ok: true, value: null })
  assert.deepEqual(f.owner.finish(b.value.claim, f.finish()), { ok: true, value: null })
  const request = {
    ...f.request,
    requestId: f.ids.requestIds[1],
    requestDigest: 'f'.repeat(64),
    attempt: {
      kind: 'fallback',
      priorRequestId: f.ids.requestIds[0],
      priorRequestDigest: digest,
      priorDecisionDigest: f.selected.decisionDigest,
      primaryBindingId: f.selected.bindingId,
      priorDisposition: {
        status: 'supplied',
        value: 'terminal-no-send',
        evidence: f.evidence(digest, 'binding'),
      },
      primaryQuality: f.selected.primaryQuality,
    },
  }
  const next = f.owner.begin(
    { intentRef: 'intent', request, computedRequestDigest: request.requestDigest },
    f.origin,
  )
  assert(next.ok)
  assert(next.value.episode.status === 'supplied')
  assert.equal(next.value.episode.value.attempts.length, 1)
  assert.equal(next.value.episode.value.attempts[0]?.requestDigest, digest)
  assert.equal(next.value.budgetEvidence.requestDigest, request.requestDigest)
})
for (const kind of ['closed-refused', 'held'])
  test(`AC5 unselected ${kind} blocks without invented selection`, (t) => {
    const f = fixture(t),
      b = f.begin()
    assert(b.ok)
    assert(f.owner.finish(b.value.claim, f.finish(kind)).ok)
    assert.equal(f.begin().ok, false)
    const reopened = openIntentOwnerV1({ root: f.root, expectedIdentity: identity }, f.trusted)
    assert(reopened.ok)
    assert.equal(
      reopened.value.owner.begin(
        { intentRef: 'intent', request: f.request, computedRequestDigest: digest },
        f.origin,
      ).ok,
      false,
    )
  })
test('AC1 setup denial and malformed setup cause no file creation', (t) => {
  const root = temporary(t)
  assert.deepEqual(
    initializeIntentOwnerV1(proposal(root), { authenticateSetup: () => ({ accepted: false }) }),
    { ok: false, code: 'AUTHORITY_REFUSED' },
  )
  assert.equal(existsSync(join(root, 'pmc-intent-v1.sqlite')), false)
  assert.equal(
    initializeIntentOwnerV1(
      { ...proposal(root), extra: true },
      { authenticateSetup: () => ({ accepted: true }) },
    ).ok,
    false,
  )
})
test('AC2 exclusive durable initialization and identity-preserving reopen', (t) => {
  const root = temporary(t)
  const initialized = initializeIntentOwnerV1(proposal(root), {
    authenticateSetup: () => ({ accepted: true }),
  })
  assert(initialized.ok)
  assert.equal(initialized.value.length, 1)
  const issued = initialized.value[0]
  assert(issued)
  assert.equal(new Set([issued.episodeId, ...issued.requestIds]).size, 3)
  assert.deepEqual(
    initializeIntentOwnerV1(proposal(root), { authenticateSetup: () => ({ accepted: true }) }),
    { ok: false, code: 'ALREADY_EXISTS' },
  )
  const opened = openIntentOwnerV1({ root, expectedIdentity: identity }, ports)
  assert(opened.ok)
  assert.deepEqual(opened.value.identities, initialized.value)
  assert.deepEqual(closeIntentOwnerV1(opened.value.owner), { ok: true, value: null })
  assert.equal(opened.value.owner.begin({}, {}).ok, false)
})

for (const port of [
  'clock',
  'authenticateOrigin',
  'authenticateSelection',
  'authenticateCompletion',
] as const) {
  for (const mode of ['throws', 'thenable', 'extra', 'getter']) {
    test(`AC1 ${port} ${mode} fails closed without leaking thrown values`, (t) => {
      const f = fixture(t)
      const bad = () => {
        if (mode === 'throws')
          throw new Proxy(
            {},
            {
              get() {
                throw new Error('must not inspect')
              },
            },
          )
        if (mode === 'thenable') return Promise.resolve({ accepted: true })
        if (mode === 'getter')
          return Object.defineProperty({}, 'accepted', {
            get() {
              throw new Error('getter')
            },
            enumerable: true,
          })
        return { accepted: true, extra: true }
      }
      const opened = openIntentOwnerV1(
        { root: f.root, expectedIdentity: identity },
        { ...f.trusted, [port]: bad },
      )
      assert(opened.ok)
      const b = opened.value.owner.begin(
        { intentRef: 'intent', request: f.request, computedRequestDigest: digest },
        f.origin,
      )
      if (port === 'clock' || port === 'authenticateOrigin') assert.equal(b.ok, false)
      else {
        assert(b.ok)
        if (port === 'authenticateSelection')
          assert.equal(opened.value.owner.recordDecision(b.value.claim, f.select()).ok, false)
        else
          assert.equal(
            opened.value.owner.finish(b.value.claim, f.finish('closed-refused')).ok,
            false,
          )
      }
    })
  }
}
for (const field of [
  'decisionDigest',
  'wireDigest',
  'bindingId',
  'provider',
  'matrixRole',
  'primaryQuality',
  'scopeId',
  'costValueDigest',
  'maximumMicroUsd',
])
  test(`AC7 selection validates ${field} independently`, (t) => {
    const f = fixture(t),
      b = f.begin()
    assert(b.ok)
    const value: FixtureData = clone(f.selected)
    value[field] =
      field === 'maximumMicroUsd'
        ? -1
        : field === 'primaryQuality'
          ? { status: 'supplied', value: NaN, evidence: f.evidence() }
          : ''
    assert.equal(f.owner.recordDecision(b.value.claim, f.select(value)).ok, false)
    assert(f.owner.recordDecision(b.value.claim, f.select()).ok)
  })
for (const field of [
  'requestDigest',
  'bindingId',
  'policyDigest',
  'configDigest',
  'lane',
  'observedAtUtc',
  'expiresAtUtc',
])
  test(`AC8 current origin evidence rejects ${field} independently`, (t) => {
    const f = fixture(t),
      e: FixtureData = f.evidence()
    e[field] =
      field === 'observedAtUtc'
        ? '2026-09-26T12:00:00.001Z'
        : field === 'expiresAtUtc'
          ? '2026-09-26T14:00:00.000Z'
          : field === 'bindingId'
            ? 'binding'
            : 'wrong'
    const opened = openIntentOwnerV1(
      { root: f.root, expectedIdentity: identity },
      {
        ...f.trusted,
        authenticateOrigin: () => ({
          accepted: true,
          episodeEvidence: e,
          budgetEvidence: f.evidence(),
          priorDisposition: null,
          primaryQuality: null,
        }),
      },
    )
    assert(opened.ok)
    assert.equal(
      opened.value.owner.begin(
        { intentRef: 'intent', request: f.request, computedRequestDigest: digest },
        f.origin,
      ).ok,
      false,
    )
  })
test('AC8 expired prior quality is retained and blocks fallback; clock cannot reopen a claimed intent', (t) => {
  const f = fixture(t),
    b = f.begin()
  assert(b.ok)
  f.selected.primaryQuality.evidence.expiresAtUtc = now
  assert(f.owner.recordDecision(b.value.claim, f.select()).ok)
  assert(f.owner.finish(b.value.claim, f.finish()).ok)
  const reopened = openIntentOwnerV1(
    { root: f.root, expectedIdentity: identity },
    { ...f.trusted, clock: () => '2026-09-26T12:00:00.001Z' },
  )
  assert(reopened.ok)
  const request = fallbackRequest(f)
  assert.equal(
    reopened.value.owner.begin(
      { intentRef: 'intent', request, computedRequestDigest: request.requestDigest },
      f.origin,
    ).ok,
    false,
  )
})
test('AC4 selection/completion capability use is one-shot; returned data is deeply frozen and owned', (t) => {
  const f = fixture(t),
    b = f.begin()
  assert(b.ok)
  const cap = f.select()
  assert(f.owner.recordDecision(b.value.claim, cap).ok)
  assert.equal(f.owner.recordDecision(b.value.claim, cap).ok, false)
  const completion = f.finish()
  assert(f.owner.finish(b.value.claim, completion).ok)
  assert.equal(f.owner.finish(b.value.claim, completion).ok, false)
  assert(Object.isFrozen(b.value))
  assert(Object.isFrozen(b.value.request))
  assert(Object.isFrozen(b.value.request.requirements))
  assert(Object.isFrozen(b.value.episode))
  assert(Object.isFrozen(b.value.scope))
  assert(Object.isFrozen(b.value.claim))
  f.request.requirements.maximumInputTokens = 999
  assert.equal(b.value.request.requirements.maximumInputTokens, 1000)
})
for (const after of [false, true])
  test(`AC2 initialization ${after ? 'lost commit ack' : 'commit failure'} never reinitializes`, (t) => {
    const root = temporary(t),
      p = proposal(root),
      r = commitFault(after, () =>
        initializeIntentOwnerV1(p, { authenticateSetup: () => ({ accepted: true }) }),
      )
    assert.deepEqual(r, { ok: false, code: 'COMMIT_UNCERTAIN' })
    assert.deepEqual(
      initializeIntentOwnerV1(p, { authenticateSetup: () => ({ accepted: true }) }),
      { ok: false, code: 'ALREADY_EXISTS' },
    )
    assert.equal(openIntentOwnerV1({ root, expectedIdentity: identity }, ports).ok, after)
  })
test('AC2 page-size readback refuses unsupported storage and runtime version', (t) => {
  const f = fixture(t)
  sql(f.root, (db) => {
    db.exec('PRAGMA page_size=8192; VACUUM')
  })
  assert.deepEqual(openIntentOwnerV1({ root: f.root, expectedIdentity: identity }, ports), {
    ok: false,
    code: 'SETTINGS_REFUSED',
  })
  const g = fixture(t),
    version = Object.getOwnPropertyDescriptor(process, 'version')
  assert(version)
  try {
    Object.defineProperty(process, 'version', { value: 'v24.18.0' })
    assert.deepEqual(openIntentOwnerV1({ root: g.root, expectedIdentity: identity }, ports), {
      ok: false,
      code: 'SETTINGS_REFUSED',
    })
  } finally {
    Object.defineProperty(process, 'version', version)
  }
})
test('AC2 fixed batch accepts 128 unique intents, preserves exactly two tables and no public owner runtime export', (t) => {
  const root = temporary(t),
    p = proposal(root),
    first = p.intents[0]
  assert(first)
  p.intents = Array.from({ length: 128 }, (_, i) => ({
    ...clone(first),
    intentRef: `intent-${i}`,
    businessAuthorityRef: `business-${i}`,
    originId: `origin-${i}`,
  }))
  const r = initializeIntentOwnerV1(p, { authenticateSetup: () => ({ accepted: true }) })
  assert(r.ok)
  assert.equal(r.value.length, 128)
  sql(root, (db) => {
    assert.deepEqual(
      db
        .prepare("SELECT name FROM sqlite_schema WHERE type='table' ORDER BY name")
        .all()
        .map((r) => r.name),
      ['intents', 'owner_meta'],
    )
    assert.equal(db.prepare('PRAGMA page_size').get()?.page_size, 4096)
  })
  const barrel = readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8')
  assert.equal(barrel.includes('intent-custody'), false)
})

for (const phase of ['begin', 'selection', 'finish'])
  for (const after of [false, true])
    test(`AC6 process exit ${after ? 'after' : 'before'} ${phase} commit recovers conservatively`, (t) => {
      const f = fixture(t),
        p = { intentRef: 'intent', request: f.request, computedRequestDigest: digest }
      const input = {
        mode: 'crash',
        phase,
        after,
        root: f.root,
        identity,
        now,
        proposal: p,
        selection: f.selected,
        originAnswer: {
          accepted: true,
          episodeEvidence: f.evidence(),
          budgetEvidence: f.evidence(),
          priorDisposition: null,
          primaryQuality: null,
        },
      }
      const child = spawnSync(
        process.execPath,
        ['--import', 'tsx', worker.pathname.replace(/^\/([A-Za-z]:)/, '$1'), JSON.stringify(input)],
        {
          encoding: 'utf8',
          env: { ...process.env, TSX_DISABLE_CACHE: '1' },
          timeout: 10000,
          windowsHide: true,
        },
      )
      assert.equal(child.status, 71, child.stderr)
      const opened = openIntentOwnerV1({ root: f.root, expectedIdentity: identity }, f.trusted)
      assert(opened.ok)
      assert.equal(opened.value.owner.begin(p, f.origin).ok, phase === 'begin' && !after)
    })

for (const kind of ['terminal-no-send', 'terminal-failed-settled']) {
  for (const ownerCommitted of [false, true]) {
    test(`AC6 ratified reopen after ${kind}: ${ownerCommitted ? 'owner terminal commit permits only R2' : 'ledger-only closure remains blocked'}`, (t) => {
      const f = fixture(t),
        ledger = actualLedger(t, f),
        first = f.begin()
      assert(first.ok)
      assert(f.owner.recordDecision(first.value.claim, f.select()).ok)
      assert(ledger.reserve().ok)
      if (kind === 'terminal-failed-settled') assert(ledger.ledger.consume(ledger.request).ok)
      const closure =
        kind === 'terminal-no-send'
          ? ledger.ledger.cancelWithNoSendProof({
              ...ledger.request,
              proof: ledger.issue('no-send'),
            })
          : ledger.ledger.settle({ ...ledger.request, observation: ledger.issue('known') })
      assert(closure.ok)
      const completion = f.finish(kind, closure.value)
      assert.deepEqual(
        commitFault(ownerCommitted, () => f.owner.finish(first.value.claim, completion)),
        { ok: false, code: 'COMMIT_UNCERTAIN' },
      )
      const request = fallbackRequest(f)
      request.attempt.priorDisposition.value = kind
      const proposal = {
        intentRef: 'intent',
        request,
        computedRequestDigest: request.requestDigest,
      }
      assert.equal(f.owner.begin(proposal, f.origin).ok, false)
      assert.equal(f.owner.finish(first.value.claim, completion).ok, false)
      assert.equal(f.begin().ok, false)

      const reopened = openIntentOwnerV1({ root: f.root, expectedIdentity: identity }, f.trusted)
      assert(reopened.ok)
      assert.equal(
        reopened.value.owner.begin(
          { intentRef: 'intent', request: f.request, computedRequestDigest: digest },
          f.origin,
        ).ok,
        false,
      )
      assert.equal(reopened.value.owner.finish(first.value.claim, completion).ok, false)
      const next = reopened.value.owner.begin(proposal, f.origin)
      assert.equal(next.ok, ownerCommitted)
      if (!next.ok) return
      assert(next.value.episode.status === 'supplied')
      assert.deepEqual(
        next.value.episode.value.attempts.map((a) => [a.requestId, a.disposition]),
        [[f.ids.requestIds[0], kind]],
      )
      assert.equal(next.value.request.requestId, f.ids.requestIds[1])
      assert.equal(next.value.request.attempt.kind, 'fallback')
      if (next.value.request.attempt.kind === 'fallback')
        assert.deepEqual(next.value.request.attempt.primaryQuality, f.selected.primaryQuality)
      const selected = {
        ...f.selected,
        matrixRole: 'fallback',
        primaryQuality: {
          ...f.selected.primaryQuality,
          evidence: f.evidence(request.requestDigest, f.selected.bindingId, true),
        },
      }
      assert(reopened.value.owner.recordDecision(next.value.claim, f.select(selected)).ok)
      assert(reopened.value.owner.finish(next.value.claim, f.finish()).ok)
      assert.equal(reopened.value.owner.begin(proposal, f.origin).ok, false)
      const third = { ...request, requestId: 'new-third-request', requestDigest: '7'.repeat(64) }
      assert.equal(
        reopened.value.owner.begin(
          { intentRef: 'intent', request: third, computedRequestDigest: third.requestDigest },
          f.origin,
        ).ok,
        false,
      )
    })
  }
}
