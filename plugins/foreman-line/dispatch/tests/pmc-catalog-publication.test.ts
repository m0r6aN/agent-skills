import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createProductionCatalogPublicationOwnerV1 } from '../src/pmc-launch/catalog-publication.js'

test('production publication construction refuses without reading input', () => {
  let reads = 0
  const input = new Proxy(
    {},
    {
      ownKeys() {
        reads++
        throw 0
      },
      get() {
        reads++
        throw 0
      },
    },
  )
  assert.deepEqual(createProductionCatalogPublicationOwnerV1(input), {
    ok: false,
    code: 'INSTALLATION_REFUSED',
  })
  assert.equal(reads, 0)
})

import { readFileSync } from 'node:fs'
import { evaluateCatalogEligibility } from '../../routing-policy/src/catalog-eligibility-adapter.js'
import { createOfflineCatalogPublicationOwnerV1 } from '../src/pmc-launch/catalog-publication.js'
import type {
  MetadataEventsV1,
  OfflinePublicationRuntimeV1,
} from '../src/pmc-launch/catalog-publication-types.js'

const rawBytes = () =>
  new Uint8Array(
    readFileSync(
      new URL('../../routing-policy/tests/fixtures/public-model-response-v1.json', import.meta.url),
    ),
  )
function fixture(ids = ['fixture/text-reasoner'], scopeCount = 1) {
  let time = 0,
    opens = 0,
    ends = 0,
    destroys = 0
  const events: MetadataEventsV1[] = [],
    wakes = new Map<object, () => void>()
  const runtime: OfflinePublicationRuntimeV1 = {
    readClock: () => ({
      utc: new Date(Date.parse('2026-09-26T12:00:00.000Z') + time).toISOString(),
      monoMs: time,
    }),
    scheduleWake: (_delay, wake) => {
      const timer = {}
      wakes.set(timer, wake)
      return { timer }
    },
    clearWake: (timer) => {
      wakes.delete(timer)
    },
    requestDriver: {
      open: (_request, e) => {
        opens++
        events.push(e)
        return {
          end: () => {
            ends++
          },
          destroy: () => {
            destroys++
          },
        }
      },
    },
  }
  const input = {
    domain: 'offline-fixture/v1',
    fixtureId: 'fixture',
    workflowId: 'workflow',
    generationId: 'epoch',
    scopes: Array.from({ length: scopeCount }, (_, i) => ({
      scopeId: `s${i}`,
      trustScopeId: 'trust',
      requestedIdentities: ids.map((id) => ({ provider: 'openrouter', id })),
      policyExpiresAtUtc: '2026-09-27T12:00:00.000Z',
    })),
  }
  const constructed = createOfflineCatalogPublicationOwnerV1(input, runtime)
  assert(constructed.ok)
  const owner = constructed.owner
  const scopes = input.scopes.map((s) => {
    const r = owner.registerCatalogScopeV1({ scopeId: s.scopeId })
    assert(r.ok)
    return r.scope
  })
  const scope = scopes[0]
  assert(scope)
  const register = (generation = 0, s = scope) => {
    const r = owner.registerRefreshOperationV1({
      scope: s,
      expectedGeneration: generation,
      deadlineMonoMs: time + 10000,
    })
    assert(r.ok)
    return r
  }
  const complete = (index = events.length - 1, body = rawBytes()) => {
    const e = events[index]
    assert(e)
    e.socketAssigned()
    e.socketConnected()
    e.response({
      statusCode: 200,
      rawHeaders: ['content-type', 'application/json', 'content-length', String(body.length)],
    })
    e.data(body)
    e.responseEnded()
    e.responseClosed()
    e.requestClosed()
    e.socketClosed()
  }
  return {
    owner,
    scope,
    scopes,
    register,
    complete,
    events,
    runtime,
    input,
    wakes,
    tick: (ms: number) => {
      time += ms
      for (const wake of [...wakes.values()]) wake()
    },
    counts: () => ({ opens, ends, destroys }),
  }
}
async function flush() {
  for (let i = 0; i < 8; i++) await Promise.resolve()
}
test('actual N publication acquires detached bytes and feeds the real RCM adapter', async () => {
  const f = fixture(),
    r = f.register(),
    promise = f.owner.requestCatalogRefreshV1({ operation: r.operation })
  f.complete()
  const result = await promise
  assert.equal(result.kind, 'published')
  if (result.kind !== 'published') return
  const q = { scope: f.scope, handle: result.handle, expectedGeneration: 1 }
  const read = f.owner.acquirePublishedCatalogV1(q)
  assert(read.ok)
  const projected = evaluateCatalogEligibility({
    canonicalBytes: read.canonicalBytes,
    expectedSha256: read.expectedSha256,
    acceptedSource: read.acceptedSource,
    approvedConfig: {
      authorityRef: 'offline-config',
      endpoints: [{ provider: 'openrouter', baseUrl: 'https://openrouter.ai/api/v1' }],
    },
    evaluationTimeUtc: '2026-09-26T12:00:00.000Z',
    identities: read.acceptedSource.requestedIdentities,
  })
  assert.equal(projected.stage, 'projector')
  if (projected.stage === 'projector') assert(projected.result.ok)
  read.canonicalBytes.fill(0)
  const again = f.owner.acquirePublishedCatalogV1(q)
  assert(again.ok)
  assert.notEqual(again.canonicalBytes[0], 0)
  assert.deepEqual(f.owner.acquirePublishedCatalogV1({ ...q, handle: {} }), {
    ok: false,
    code: 'HANDLE_REFUSED',
  })
  assert.deepEqual(await f.owner.requestCatalogRefreshV1({ operation: r.operation }), {
    kind: 'refused',
    code: 'INPUT_REFUSED',
  })
  assert.equal(f.counts().opens, 1)
})
test('catalog and absence share CAS and invalidate both old variants', async () => {
  const f = fixture()
  const first = f.register(),
    p = f.owner.requestCatalogRefreshV1({ operation: first.operation })
  f.complete()
  const a = await p
  assert(a.kind === 'published')
  await flush()
  const missing = new TextEncoder().encode(
    JSON.stringify({ data: [], links: { next: null }, total_count: 0 }),
  )
  const r = f.register(1),
    p2 = f.owner.requestCatalogRefreshV1({ operation: r.operation })
  f.complete(1, missing)
  const b = await p2
  assert(b.kind === 'absent')
  await flush()
  assert.deepEqual(
    f.owner.acquirePublishedCatalogV1({ scope: f.scope, handle: b.handle, expectedGeneration: 2 }),
    { ok: false, code: 'CURRENT_ABSENCE' },
  )
  assert.equal(
    f.owner.acquirePublishedCatalogV1({ scope: f.scope, handle: a.handle, expectedGeneration: 1 })
      .ok,
    false,
  )
  assert(
    f.owner.verifyAbsenceV1({
      scope: f.scope,
      handle: b.handle,
      expectedGeneration: 2,
      identity: { provider: 'openrouter', id: 'fixture/text-reasoner' },
    }).ok,
  )
  const r3 = f.register(2),
    p3 = f.owner.requestCatalogRefreshV1({ operation: r3.operation })
  f.complete(2)
  const c = await p3
  assert(c.kind === 'published')
  assert.equal(
    f.owner.verifyAbsenceV1({
      scope: f.scope,
      handle: b.handle,
      expectedGeneration: 2,
      identity: { provider: 'openrouter', id: 'fixture/text-reasoner' },
    }).ok,
    false,
  )
})
test('mixed inventory authenticates only exact absent set and scope before generation', async () => {
  const f = fixture(['absent/a', 'absent/b', 'fixture/text-reasoner'], 2)
  const r = f.register(),
    p = f.owner.requestCatalogRefreshV1({ operation: r.operation })
  f.complete()
  const result = await p
  assert(result.kind === 'absent')
  assert.deepEqual(
    result.absentIdentities.map((x) => x.id),
    ['absent/a', 'absent/b'],
  )
  assert.equal(result.requestedIdentities.length, 3)
  const q = {
    scope: f.scope,
    handle: result.handle,
    expectedGeneration: 1,
    identity: { provider: 'openrouter', id: 'absent/a' },
  }
  assert(f.owner.verifyAbsenceV1(q).ok)
  assert.deepEqual(f.owner.verifyAbsenceV1({ ...q, scope: f.scopes[1], expectedGeneration: 99 }), {
    ok: false,
    code: 'SCOPE_REFUSED',
  })
  assert.deepEqual(
    f.owner.verifyAbsenceV1({
      ...q,
      identity: { provider: 'openrouter', id: 'fixture/text-reasoner' },
    }),
    { ok: false, code: 'IDENTITY_NOT_ABSENT' },
  )
  f.tick(30000)
  assert.deepEqual(f.owner.verifyAbsenceV1(q), { ok: false, code: 'EXPIRED' })
})
test('one CAS winner with concurrent candidates and no late cancellation rollback', async () => {
  const f = fixture()
  const a = f.register(),
    b = f.register()
  const p = f.owner.requestCatalogRefreshV1({ operation: a.operation }),
    q = f.owner.requestCatalogRefreshV1({ operation: b.operation })
  f.complete(0)
  f.complete(1)
  assert.equal((await p).kind, 'published')
  assert.deepEqual(await q, { kind: 'refused', code: 'PUBLICATION_CONFLICT' })
  assert.deepEqual(
    f.owner.cancelRefreshOperationV1({ operation: a.operation, cancellation: a.cancellation }),
    { ok: true, outcome: 'already-settled' },
  )
})
test('four physical transports remain held after cancellation until actual connected cleanup', async () => {
  const f = fixture()
  const registrations = Array.from({ length: 4 }, () => f.register())
  const promises = registrations.map((r) =>
    f.owner.requestCatalogRefreshV1({ operation: r.operation }),
  )
  for (const r of registrations)
    assert.deepEqual(
      f.owner.cancelRefreshOperationV1({ operation: r.operation, cancellation: r.cancellation }),
      { ok: true, outcome: 'cancelled' },
    )
  assert.deepEqual(
    await Promise.all(promises),
    Array(4).fill({ kind: 'refused', code: 'CANCELLED' }),
  )
  assert.equal(f.counts().opens, 4)
  assert.deepEqual(
    f.owner.registerRefreshOperationV1({
      scope: f.scope,
      expectedGeneration: 0,
      deadlineMonoMs: 10000,
    }),
    { ok: false, code: 'CAPACITY_REFUSED' },
  )
  const e = f.events[0]
  assert(e)
  e.socketAssigned()
  e.socketConnected()
  e.requestClosed()
  e.socketClosed()
  await flush()
  assert(
    f.owner.registerRefreshOperationV1({
      scope: f.scope,
      expectedGeneration: 0,
      deadlineMonoMs: 10000,
    }).ok,
  )
  assert.deepEqual(
    f.owner.cancelRefreshOperationV1({
      operation: registrations[0]?.operation,
      cancellation: registrations[0]?.cancellation,
    }),
    { ok: true, outcome: 'already-cancelled' },
  )
})
test('early socket close without connection holds capacity despite outward deadline', async () => {
  const f = fixture()
  const registrations = Array.from({ length: 4 }, () => f.register())
  const promises = registrations.map((r) =>
    f.owner.requestCatalogRefreshV1({ operation: r.operation }),
  )
  for (const e of f.events) {
    e.socketAssigned()
    e.error()
    e.requestClosed()
    e.socketClosed()
  }
  f.tick(10000)
  assert.deepEqual(
    await Promise.all(promises),
    Array(4).fill({ kind: 'refused', code: 'DEADLINE_EXCEEDED' }),
  )
  assert.deepEqual(
    f.owner.registerRefreshOperationV1({
      scope: f.scope,
      expectedGeneration: 0,
      deadlineMonoMs: 20000,
    }),
    { ok: false, code: 'CAPACITY_REFUSED' },
  )
})
test('never-invoked operations reclaim once and old capabilities cannot reopen', async () => {
  const f = fixture()
  const rs = Array.from({ length: 4 }, () => f.register())
  f.tick(10000)
  const fresh = f.register()
  assert(fresh.ok)
  assert.deepEqual(await f.owner.requestCatalogRefreshV1({ operation: rs[0]?.operation }), {
    kind: 'refused',
    code: 'DEADLINE_EXCEEDED',
  })
  assert.equal(f.counts().opens, 0)
})
test('incomplete-only and incomplete coverage never publish absence', async () => {
  for (const kind of ['incomplete', 'coverage']) {
    const f = fixture()
    const doc = JSON.parse(new TextDecoder().decode(rawBytes()))
    if (kind === 'incomplete') delete doc.data[0].pricing
    else delete doc.links
    const r = f.register(),
      p = f.owner.requestCatalogRefreshV1({ operation: r.operation })
    f.complete(0, new TextEncoder().encode(JSON.stringify(doc)))
    assert.deepEqual(await p, {
      kind: 'refused',
      code: kind === 'incomplete' ? 'MATERIALIZATION_REFUSED' : 'COMPLETENESS_UNPROVEN',
    })
  }
})

import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, realpathSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { createPmcControllerCustodyV1 } from '../src/pmc-launch/controller.js'
import {
  closeIntentOwnerV1,
  initializeIntentOwnerV1,
  openIntentOwnerV1,
} from '../src/pmc-launch/intent-custody.js'
import { createLocalPmcLedger, initializeLocalPmcLedger } from '../src/pmc-launch/ledger.js'

test('actual publication to actual B1/C acquisition preserves custody ordering and missing tariff refusal', async (t) => {
  const publication = fixture(),
    op = publication.register(),
    published = publication.owner.requestCatalogRefreshV1({ operation: op.operation })
  publication.complete()
  const pub = await published
  assert(pub.kind === 'published')
  const f = JSON.parse(
    readFileSync(
      new URL('../../routing-policy/tests/fixtures/pmc-resolver-v1.json', import.meta.url),
      'utf8',
    ),
  )
  f.request.requirements.toolUse = false
  f.request.requirements.structuredOutput = false
  const now = '2026-09-26T12:00:00.000Z',
    expires = '2026-09-26T13:00:00.000Z',
    digest = 'a'.repeat(64),
    sha = (s: string) => createHash('sha256').update(s).digest('hex')
  const tempRoot = realpathSync(tmpdir())
  const root = mkdtempSync(join(tempRoot, 'rcm-p-composition-'))
  assert.equal(dirname(realpathSync(root)), tempRoot)
  let closeOwner = () => {}
  const ownerRoot = join(root, 'owner'),
    ledgerRoot = join(root, 'ledger')
  mkdirSync(ownerRoot)
  mkdirSync(ledgerRoot)
  t.after(() => {
    closeOwner()
    assert.equal(dirname(realpathSync(root)), tempRoot)
    rmSync(root, { recursive: true, force: true })
  })
  const scope = {
    scopeId: 'scope',
    authorityDigest: digest,
    currency: 'USD',
    authorizedLimitMicroUsd: 10000000,
    workflowId: 'workflow',
    accountId: 'account',
    routingClass: 'implementation/standard',
  }
  const identity = {
    storeId: 'owner',
    ledgerId: 'ledger',
    epoch: 'epoch',
    initializationAuthorityDigest: digest,
    schemaVersion: 1,
  }
  const {
    episodeId: _e,
    requestId: _r,
    requestDigest: _d,
    attempt: _a,
    ...routeTemplate
  } = f.request
  const setup = initializeIntentOwnerV1(
    {
      root: ownerRoot,
      identity,
      intents: [
        {
          intentRef: 'intent',
          businessAuthorityRef: 'business',
          businessAuthorityDigest: digest,
          originId: 'origin',
          routeTemplate,
          policyDigest: digest,
          configDigest: digest,
          scope,
          authorityObservedAtUtc: now,
          authorityExpiresAtUtc: expires,
          fallbackAllowed: true,
        },
      ],
    },
    { authenticateSetup: () => ({ accepted: true }) },
  )
  assert(setup.ok)
  const ids = setup.value[0]
  assert(ids)
  const route = { ...f.request, episodeId: ids.episodeId, requestId: ids.requestIds[0] },
    payloadJson = '{"messages":[{"role":"user","content":"offline"}]}'
  const { requestDigest: _rd, ...material } = route
  route.requestDigest = sha(JSON.stringify(['pmc-request/v1', 'intent', material, payloadJson]))
  const evidence = {
    ...f.context.catalog.source.evidence,
    requestDigest: route.requestDigest,
    observedAtUtc: now,
    expiresAtUtc: expires,
  }
  const boot = createPmcControllerCustodyV1('synthetic-offline')
  assert(boot.ok)
  const origin = {}
  let originChecks = 0,
    acquires = 0,
    terminal = 0
  const opened = openIntentOwnerV1(
    { root: ownerRoot, expectedIdentity: identity },
    {
      clock: () => now,
      authenticateOrigin: (_a: unknown, _s: unknown, _p: unknown, cap: unknown) => {
        assert.equal(cap, origin)
        originChecks++
        return {
          accepted: true,
          episodeEvidence: evidence,
          budgetEvidence: evidence,
          priorDisposition: null,
          primaryQuality: null,
        }
      },
      authenticateSelection: boot.custody.authenticateSelection,
      authenticateCompletion: boot.custody.authenticateCompletion,
    },
  )
  assert(opened.ok)
  closeOwner = () => {
    closeIntentOwnerV1(opened.value.owner)
  }
  assert(
    initializeLocalPmcLedger(
      {
        root: ledgerRoot,
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
          scopesDigest: sha(JSON.stringify(r.scopes)),
        }),
      },
    ).ok,
  )
  const ledger = createLocalPmcLedger(
    {
      root: ledgerRoot,
      expectedLedgerId: 'ledger',
      expectedEpoch: 'epoch',
      expectedInitializationAuthorityDigest: digest,
    },
    {
      clock: () => now,
      authenticateNoSendProof: () => ({ accepted: false }),
      authenticateSettlement: () => ({ accepted: false }),
    },
  )
  assert(ledger.ok)
  const {
    catalog: _c,
    episode: _ep,
    budget: _b,
    evaluationTimeUtc: _t,
    evidenceMode: _mode,
    ...context
  } = f.context
  const bound = boot.custody.bind(
    {
      clock: () => now,
      owner: opened.value.owner,
      originCapability: origin,
      ledger: ledger.value,
      acquire: () => {
        assert.equal(originChecks, 1)
        acquires++
        const read = publication.owner.acquirePublishedCatalogV1({
          scope: publication.scope,
          handle: pub.handle,
          expectedGeneration: pub.generation,
        })
        assert(read.ok)
        return {
          context,
          catalogInput: {
            canonicalBytes: read.canonicalBytes,
            expectedSha256: read.expectedSha256,
            acceptedSource: read.acceptedSource,
            identities: read.acceptedSource.requestedIdentities,
            approvedConfig: {
              authorityRef: 'offline-config',
              endpoints: [{ provider: 'openrouter', baseUrl: 'https://openrouter.ai/api/v1' }],
            },
          },
          catalogSource: {
            status: 'supplied',
            value: {
              profileId: read.acceptedSource.profileId,
              profileVersion: read.acceptedSource.profileVersion,
              profileDigest: digest,
              snapshotDigest: read.expectedSha256,
              configAuthorityRef: 'offline-config',
            },
            evidence: {
              ...evidence,
              sourceRef: read.acceptedSource.sourceEvidenceRef,
              sourceDigest: read.acceptedSource.sourceEvidenceSha256,
            },
          },
          prices: [],
          runtimeDigest: digest,
          evidenceDigest: digest,
          expiresAtUtc: expires,
          scopeId: 'scope',
          classCeilingMicroUsd: 10000000,
          ceilingAuthorityRef: 'offline',
          ceilingAuthorityDigest: digest,
        }
      },
      revalidate: () => {
        throw Error('must not revalidate missing tariff')
      },
      transport: {
        prepare: async () => {
          terminal++
          throw 0
        },
        verify: () => {
          terminal++
          throw 0
        },
        send: async () => {
          terminal++
          throw 0
        },
      },
    },
    {
      observe: () => {
        throw 0
      },
    },
  )
  assert(bound.ok)
  const result = await bound.controller.launch({
    version: 'pmc-launch/v1',
    intentRef: 'intent',
    route,
    payloadJson,
    override: null,
  })
  assert.equal(result.ok, false)
  if (!result.ok) assert.equal(result.code, 'MONEY_REFUSED')
  assert.equal(acquires, 1)
  assert.equal(terminal, 0)
  assert.equal(publication.counts().opens, 1)
})

test('reentrant scope registration issues at most one scope capability', () => {
  const f = fixture()
  let owner: typeof f.owner | undefined,
    enter = false,
    nested: unknown
  const made = createOfflineCatalogPublicationOwnerV1(f.input, {
    ...f.runtime,
    readClock: () => {
      if (enter) {
        enter = false
        nested = owner?.registerCatalogScopeV1({ scopeId: 's0' })
      }
      return f.runtime.readClock()
    },
  })
  assert(made.ok)
  owner = made.owner
  enter = true
  const outer = owner.registerCatalogScopeV1({ scopeId: 's0' })
  assert.equal(Number(outer.ok) + Number((nested as { ok: boolean }).ok), 1)
})
test('clock failure on first invocation latches and reclaims never-started operations', async () => {
  const f = fixture()
  let broken = false
  const made = createOfflineCatalogPublicationOwnerV1(f.input, {
    ...f.runtime,
    readClock: () => {
      if (broken) throw 0
      return f.runtime.readClock()
    },
  })
  assert(made.ok)
  const owner = made.owner,
    s = owner.registerCatalogScopeV1({ scopeId: 's0' })
  assert(s.ok)
  const rs = Array.from({ length: 4 }, () => {
    const r = owner.registerRefreshOperationV1({
      scope: s.scope,
      expectedGeneration: 0,
      deadlineMonoMs: 10000,
    })
    assert(r.ok)
    return r
  })
  broken = true
  for (const r of rs)
    assert.deepEqual(await owner.requestCatalogRefreshV1({ operation: r.operation }), {
      kind: 'refused',
      code: 'INSTALLATION_REFUSED',
    })
  broken = false
  assert(
    owner.registerRefreshOperationV1({
      scope: s.scope,
      expectedGeneration: 0,
      deadlineMonoMs: 10000,
    }).ok,
  )
  assert.equal(f.counts().opens, 0)
})

test('construction owns declarations and exact runtime functions before use', async () => {
  const f = fixture(),
    input = structuredClone(f.input),
    runtime = { ...f.runtime, requestDriver: { ...f.runtime.requestDriver } }
  const made = createOfflineCatalogPublicationOwnerV1(input, runtime)
  assert(made.ok)
  const mutableScope = input.scopes[0]
  assert(mutableScope)
  const mutableIdentity = mutableScope.requestedIdentities[0]
  assert(mutableIdentity)
  mutableIdentity.id = 'wrong'
  mutableScope.policyExpiresAtUtc = '2000-01-01T00:00:00.000Z'
  runtime.requestDriver.open = () => {
    throw 0
  }
  runtime.readClock = () => {
    throw 0
  }
  const s = made.owner.registerCatalogScopeV1({ scopeId: 's0' })
  assert(s.ok)
  const r = made.owner.registerRefreshOperationV1({
    scope: s.scope,
    expectedGeneration: 0,
    deadlineMonoMs: 10000,
  })
  assert(r.ok)
  const p = made.owner.requestCatalogRefreshV1({ operation: r.operation })
  f.complete()
  const value = await p
  assert(value.kind === 'published')
  assert(
    made.owner.acquirePublishedCatalogV1({
      scope: s.scope,
      handle: value.handle,
      expectedGeneration: 1,
    }).ok,
  )
})
test('construction rejects hostile closed data and runtime without invoking getters or driver', () => {
  const f = fixture()
  let gets = 0
  const accessor = { ...f.input }
  Object.defineProperty(accessor, 'fixtureId', {
    get() {
      gets++
      return 'fixture'
    },
    enumerable: true,
  })
  const symbol = { ...f.input, [Symbol('x')]: 1 },
    hidden = { ...f.input }
  Object.defineProperty(hidden, 'hidden', { value: 1 })
  const cycle = { ...f.input, loop: null as unknown }
  cycle.loop = cycle
  for (const input of [
    accessor,
    symbol,
    hidden,
    cycle,
    { ...f.input, extra: 1 },
    // biome-ignore lint/suspicious/noThenProperty: adversarial thenable refusal fixture
    { ...f.input, then: () => 1 },
    { ...f.input, domain: 'production' },
    { ...f.input, fixtureId: 'x'.repeat(65) },
    { ...f.input, scopes: [] },
    { ...f.input, scopes: [...f.input.scopes, ...f.input.scopes] },
  ])
    assert.deepEqual(createOfflineCatalogPublicationOwnerV1(input, f.runtime), {
      ok: false,
      code: 'INPUT_REFUSED',
    })
  const badRuntime = { ...f.runtime }
  Object.defineProperty(badRuntime, 'readClock', {
    get() {
      gets++
      throw 0
    },
    enumerable: true,
  })
  for (const runtime of [
    badRuntime,
    { ...f.runtime, extra: 0 },
    { ...f.runtime, requestDriver: { open: () => {}, extra: 0 } },
    { ...f.runtime, scheduleWake: 0 },
  ])
    assert.deepEqual(createOfflineCatalogPublicationOwnerV1(f.input, runtime), {
      ok: false,
      code: 'INSTALLATION_REFUSED',
    })
  assert.equal(gets, 0)
  assert.equal(f.counts().opens, 0)
})
test('scope and identity cardinality boundaries and array preflight', () => {
  const f = fixture()
  for (const n of [128, 129]) {
    const input = {
      ...f.input,
      scopes: Array.from({ length: n }, (_, i) => ({
        ...f.input.scopes[0],
        scopeId: `scope${i}`,
      })),
    }
    assert.equal(createOfflineCatalogPublicationOwnerV1(input, f.runtime).ok, n === 128)
  }
  for (const n of [256, 257]) {
    let descriptors = 0
    const ids = new Proxy(
      Array.from({ length: n }, (_, i) => ({
        provider: 'openrouter',
        id: `m${String(i).padStart(3, '0')}`,
      })),
      {
        getOwnPropertyDescriptor(t, k) {
          if (k !== 'length') descriptors++
          return Reflect.getOwnPropertyDescriptor(t, k)
        },
      },
    )
    const input = { ...f.input, scopes: [{ ...f.input.scopes[0], requestedIdentities: ids }] }
    assert.equal(createOfflineCatalogPublicationOwnerV1(input, f.runtime).ok, n === 256)
    if (n === 257) assert.equal(descriptors, 0)
  }
  for (const ids of [
    ['b', 'a'],
    ['a', 'a'],
  ])
    assert.equal(
      createOfflineCatalogPublicationOwnerV1(
        {
          ...f.input,
          scopes: [
            {
              ...f.input.scopes[0],
              requestedIdentities: ids.map((id) => ({ provider: 'openrouter', id })),
            },
          ],
        },
        f.runtime,
      ).ok,
      false,
    )
})
test('string byte and combined expanded alias aggregate boundaries use independent accounting', () => {
  const f = fixture()
  for (const n of [4096, 4097])
    assert.equal(
      createOfflineCatalogPublicationOwnerV1(
        {
          ...f.input,
          scopes: [
            {
              ...f.input.scopes[0],
              requestedIdentities: [{ provider: 'openrouter', id: 'a'.repeat(n) }],
            },
          ],
        },
        f.runtime,
      ).ok,
      n === 4096,
    )
  const declaration = f.input.scopes[0]
  assert(declaration)
  const longIds = Array.from({ length: 128 }, (_, i) => ({
    provider: 'openrouter',
    id: String(i).padStart(3, '0') + 'x'.repeat(4093),
  }))
  const scopeA = { ...declaration, scopeId: 'a', requestedIdentities: longIds },
    scopeB = { ...declaration, scopeId: 'b', requestedIdentities: longIds }
  assert(createOfflineCatalogPublicationOwnerV1({ ...f.input, scopes: [scopeA] }, f.runtime).ok)
  assert.deepEqual(
    createOfflineCatalogPublicationOwnerV1({ ...f.input, scopes: [scopeA, scopeB] }, f.runtime),
    { ok: false, code: 'INPUT_REFUSED' },
  )
})
test('foreign/cloned capabilities cannot register, cancel or acquire', async () => {
  const a = fixture(),
    b = fixture(),
    r = a.register()
  assert.deepEqual(a.owner.registerCatalogScopeV1({ scopeId: 's0' }), {
    ok: false,
    code: 'INPUT_REFUSED',
  })
  assert.deepEqual(a.owner.registerCatalogScopeV1({ scopeId: 'missing' }), {
    ok: false,
    code: 'INPUT_REFUSED',
  })
  for (const scope of [{}, b.scope])
    assert.deepEqual(
      a.owner.registerRefreshOperationV1({ scope, expectedGeneration: 0, deadlineMonoMs: 10000 }),
      { ok: false, code: 'INPUT_REFUSED' },
    )
  assert.deepEqual(a.owner.cancelRefreshOperationV1({ operation: r.operation, cancellation: {} }), {
    ok: false,
    code: 'INPUT_REFUSED',
  })
  assert.deepEqual(await b.owner.requestCatalogRefreshV1({ operation: r.operation }), {
    kind: 'refused',
    code: 'INPUT_REFUSED',
  })
  assert.equal(a.counts().opens, 0)
})
test('one coalesced waiter leaving has no cancellation authority over another', async () => {
  const f = fixture(),
    r = f.register(),
    shared = f.owner.requestCatalogRefreshV1({ operation: r.operation })
  let second: unknown
  void shared.then((x) => {
    second = x
  })
  const abandoned = await Promise.race([shared, Promise.resolve('waiter-left')])
  assert.equal(abandoned, 'waiter-left')
  f.complete()
  const result = await shared
  assert(result.kind === 'published')
  await flush()
  assert.equal(second, result)
  assert.equal(f.counts().opens, 1)
})
test('catalog and absence cancellation latch before terminal cleanup and final CAS', async () => {
  for (const absence of [false, true]) {
    const f = fixture(),
      r = f.register(),
      p = f.owner.requestCatalogRefreshV1({ operation: r.operation })
    const body = absence
      ? new TextEncoder().encode('{"data":[],"links":{"next":null},"total_count":0}')
      : rawBytes()
    f.complete(0, body)
    assert.deepEqual(
      f.owner.cancelRefreshOperationV1({ operation: r.operation, cancellation: r.cancellation }),
      { ok: true, outcome: 'cancelled' },
    )
    assert.deepEqual(await p, { kind: 'refused', code: 'CANCELLED' })
    await flush()
    const next = f.register(0),
      again = f.owner.requestCatalogRefreshV1({ operation: next.operation })
    f.complete(1, body)
    const value = await again
    assert.equal(value.kind, absence ? 'absent' : 'published')
    assert.equal(value.generation, 1)
  }
})
test('mixed incomplete and absent scope retains full scope but authenticates only absence', async () => {
  const f = fixture(['absent', 'fixture/text-reasoner']),
    doc = JSON.parse(new TextDecoder().decode(rawBytes()))
  delete doc.data[0].pricing
  const r = f.register(),
    p = f.owner.requestCatalogRefreshV1({ operation: r.operation })
  f.complete(0, new TextEncoder().encode(JSON.stringify(doc)))
  const result = await p
  assert(result.kind === 'absent')
  assert.deepEqual(result.absentIdentities, [{ provider: 'openrouter', id: 'absent' }])
  assert.equal(result.requestedIdentities.length, 2)
  assert.equal(
    f.owner.verifyAbsenceV1({
      scope: f.scope,
      handle: result.handle,
      expectedGeneration: 1,
      identity: { provider: 'openrouter', id: 'fixture/text-reasoner' },
    }).ok,
    false,
  )
})
test('incomplete refresh does not revoke a still-valid previous generation', async () => {
  const f = fixture(),
    r = f.register(),
    p = f.owner.requestCatalogRefreshV1({ operation: r.operation })
  f.complete()
  const first = await p
  assert(first.kind === 'published')
  await flush()
  const next = f.register(1),
    q = f.owner.requestCatalogRefreshV1({ operation: next.operation })
  f.complete(1, new TextEncoder().encode('{"data":[],"total_count":0}'))
  assert.deepEqual(await q, { kind: 'refused', code: 'COMPLETENESS_UNPROVEN' })
  assert(
    f.owner.acquirePublishedCatalogV1({
      scope: f.scope,
      handle: first.handle,
      expectedGeneration: 1,
    }).ok,
  )
})
test('provenance binds actual bytes, receipt times, fixed domain and immutable policy expiry', async () => {
  const f = fixture(),
    r = f.register(),
    p = f.owner.requestCatalogRefreshV1({ operation: r.operation }),
    raw = rawBytes()
  f.complete(0, raw)
  const result = await p
  assert(result.kind === 'published')
  const q = { scope: f.scope, handle: result.handle, expectedGeneration: 1 },
    read = f.owner.acquirePublishedCatalogV1(q)
  assert(read.ok)
  assert.deepEqual(read.provenance, {
    workflowId: 'workflow',
    trustScopeId: 'trust',
    profile: 'openrouter-public-text-materialization/v1',
    endpoint: 'https://openrouter.ai/api/v1/models',
    domain: 'public-text-output',
    generation: 1,
    sourceSha256: shaBytes(raw),
    requestStartedAtUtc: '2026-09-26T12:00:00.000Z',
    completeReceivedAtUtc: '2026-09-26T12:00:00.000Z',
    validUntilUtc: '2026-09-27T12:00:00.000Z',
  })
  assert(Object.isFrozen(read.provenance))
  assert(Object.isFrozen(read.acceptedSource))
  f.tick(86400000)
  assert.deepEqual(f.owner.acquirePublishedCatalogV1(q), { ok: false, code: 'EXPIRED' })
})
function shaBytes(bytes: Uint8Array) {
  return createHash('sha256').update(bytes).digest('hex')
}
test('backward clock and timer failures are installation refusals without effects', async () => {
  for (const fault of ['utc', 'mono', 'throw', 'timer', 'timer-shape', 'timer-sync']) {
    const f = fixture()
    let active = false
    const made = createOfflineCatalogPublicationOwnerV1(f.input, {
      ...f.runtime,
      readClock: () => {
        if (active && fault === 'throw') throw 0
        return {
          utc: active && fault === 'utc' ? '2026-09-26T11:00:00.000Z' : '2026-09-26T12:00:00.000Z',
          monoMs: active && fault === 'mono' ? 0 : 1,
        }
      },
      scheduleWake: (_d: number, w: () => void) => {
        if (fault === 'timer') throw 0
        if (fault === 'timer-shape') return {}
        if (fault === 'timer-sync') w()
        return { timer: {} }
      },
    })
    assert(made.ok)
    const scope = made.owner.registerCatalogScopeV1({ scopeId: 's0' })
    assert(scope.ok)
    active = true
    const op = made.owner.registerRefreshOperationV1({
      scope: scope.scope,
      expectedGeneration: 0,
      deadlineMonoMs: 10000,
    })
    assert.deepEqual(op, { ok: false, code: 'INSTALLATION_REFUSED' })
    assert.equal(f.counts().opens, 0)
  }
})
test('terminal timer-clear faults and late wakes cannot rewrite acknowledged outcome', async () => {
  const f = fixture()
  const made = createOfflineCatalogPublicationOwnerV1(f.input, {
    ...f.runtime,
    clearWake: () => {
      throw 0
    },
  })
  assert(made.ok)
  const scope = made.owner.registerCatalogScopeV1({ scopeId: 's0' })
  assert(scope.ok)
  const op = made.owner.registerRefreshOperationV1({
    scope: scope.scope,
    expectedGeneration: 0,
    deadlineMonoMs: 10000,
  })
  assert(op.ok)
  const p = made.owner.requestCatalogRefreshV1({ operation: op.operation })
  f.complete()
  const result = await p
  assert(result.kind === 'published')
  f.tick(10000)
  assert(
    made.owner.acquirePublishedCatalogV1({
      scope: scope.scope,
      handle: result.handle,
      expectedGeneration: 1,
    }).ok,
  )
})

test('one MiB expanded string budget accepts exact and refuses one byte over', () => {
  const f = fixture()
  const input = {
    ...f.input,
    scopes: Array.from({ length: 2 }, (_, i) => ({
      ...f.input.scopes[0],
      scopeId: `s${i}`,
      requestedIdentities: Array.from({ length: 256 }, (_, j) => ({
        provider: 'openrouter',
        id: `${String(j).padStart(3, '0')}:`,
      })),
    })),
  }
  // Independent logical JSON-string total: object member names and string values;
  // numeric array positions are not source strings.
  const total = (value: unknown): number =>
    typeof value === 'string'
      ? Buffer.byteLength(value)
      : Array.isArray(value)
        ? value.reduce((sum: number, x: unknown) => sum + total(x), 0)
        : value && typeof value === 'object'
          ? Object.entries(value).reduce(
              (sum, [key, v]) => sum + Buffer.byteLength(key) + total(v),
              0,
            )
          : 0
  let remaining = 1048576 - total(input)
  for (const scope of input.scopes)
    for (const identity of scope.requestedIdentities) {
      const add = Math.min(4096 - identity.id.length, remaining)
      identity.id += 'x'.repeat(add)
      remaining -= add
    }
  assert.equal(remaining, 0)
  assert.equal(total(input), 1048576)
  assert(createOfflineCatalogPublicationOwnerV1(input, f.runtime).ok)
  const last = input.scopes.at(-1)?.requestedIdentities.at(-1)
  assert(last)
  last.id += 'x'
  assert.equal(total(input), 1048577)
  assert.deepEqual(createOfflineCatalogPublicationOwnerV1(input, f.runtime), {
    ok: false,
    code: 'INPUT_REFUSED',
  })
})
test('UTF8 per-string limit is bytes rather than JavaScript character count', () => {
  const f = fixture()
  for (const n of [2048, 2049])
    assert.equal(
      createOfflineCatalogPublicationOwnerV1(
        {
          ...f.input,
          scopes: [
            {
              ...f.input.scopes[0],
              requestedIdentities: [{ provider: 'openrouter', id: 'é'.repeat(n) }],
            },
          ],
        },
        f.runtime,
      ).ok,
      n === 2048,
    )
})

test('expanded value boundary preflights child descriptors at 262144 versus 262145', () => {
  const f = fixture()
  const memo = new Map<number, unknown>()
  const tree = (count: number): unknown => {
    if (count === 1) return null
    const prior = memo.get(count)
    if (prior !== undefined) return prior
    const children = []
    let remaining = count - 1
    const width = Math.min(256, remaining)
    for (let i = 0; i < width; i++) {
      const n = Math.ceil(remaining / (width - i))
      children.push(tree(n))
      remaining -= n
    }
    memo.set(count, children)
    return children
  }
  for (const extra of [0, 1]) {
    let visited = 0
    const sentinel = new Proxy(
      { end: null },
      {
        getOwnPropertyDescriptor(t, k) {
          visited++
          return Reflect.getOwnPropertyDescriptor(t, k)
        },
      },
    )
    const input = { a: tree(262141 + extra), b: sentinel }
    assert.deepEqual(createOfflineCatalogPublicationOwnerV1(input, f.runtime), {
      ok: false,
      code: 'INPUT_REFUSED',
    })
    assert.equal(visited, extra ? 0 : 1)
  }
  assert.equal(f.counts().opens, 0)
})
test('depth 16 capture reaches leaf while depth 17 refuses before leaf reflection', () => {
  const f = fixture()
  for (const depth of [16, 17]) {
    let reflected = 0
    let value: unknown = new Proxy(
      {},
      {
        ownKeys() {
          reflected++
          return []
        },
      },
    )
    for (let i = 0; i < depth; i++) value = { x: value }
    assert.deepEqual(createOfflineCatalogPublicationOwnerV1(value, f.runtime), {
      ok: false,
      code: 'INPUT_REFUSED',
    })
    assert.equal(reflected, depth === 16 ? 1 : 0)
  }
  assert.equal(f.counts().opens, 0)
})

test('129 scope declarations refuse before any child descriptor', () => {
  const f = fixture()
  let descriptors = 0
  const scopes = new Proxy(
    Array.from({ length: 129 }, (_, i) => ({ ...f.input.scopes[0], scopeId: `s${i}` })),
    {
      getOwnPropertyDescriptor(t, k) {
        if (k !== 'length') descriptors++
        return Reflect.getOwnPropertyDescriptor(t, k)
      },
    },
  )
  assert.deepEqual(createOfflineCatalogPublicationOwnerV1({ ...f.input, scopes }, f.runtime), {
    ok: false,
    code: 'INPUT_REFUSED',
  })
  assert.equal(descriptors, 0)
})

test('cancellation inside final pre-CAS clock read cannot publish either variant', async () => {
  for (const absent of [false, true]) {
    const f = fixture()
    let reads = 0,
      armed = false,
      cancel = () => {}
    const made = createOfflineCatalogPublicationOwnerV1(f.input, {
      ...f.runtime,
      readClock: () => {
        if (armed && ++reads === 3) cancel()
        return f.runtime.readClock()
      },
    })
    assert(made.ok)
    const scope = made.owner.registerCatalogScopeV1({ scopeId: 's0' })
    assert(scope.ok)
    const op = made.owner.registerRefreshOperationV1({
      scope: scope.scope,
      expectedGeneration: 0,
      deadlineMonoMs: 10000,
    })
    assert(op.ok)
    cancel = () => {
      assert.deepEqual(
        made.owner.cancelRefreshOperationV1({
          operation: op.operation,
          cancellation: op.cancellation,
        }),
        { ok: true, outcome: 'cancelled' },
      )
    }
    const p = made.owner.requestCatalogRefreshV1({ operation: op.operation })
    f.complete(
      0,
      absent
        ? new TextEncoder().encode('{"data":[],"links":{"next":null},"total_count":0}')
        : rawBytes(),
    )
    armed = true
    assert.deepEqual(await p, { kind: 'refused', code: 'CANCELLED' })
    assert.equal(reads, 3)
    armed = false
    await flush()
    const again = made.owner.registerRefreshOperationV1({
      scope: scope.scope,
      expectedGeneration: 0,
      deadlineMonoMs: 10000,
    })
    assert(again.ok)
    const q = made.owner.requestCatalogRefreshV1({ operation: again.operation })
    f.complete(1)
    assert.equal((await q).kind, 'published')
  }
})
test('sole N raw JSON boundary rejects duplicate keys and malformed response', async () => {
  for (const text of ['{"data":[],"data":[],"links":{"next":null},"total_count":0}', '{not-json']) {
    const f = fixture(),
      op = f.register(),
      p = f.owner.requestCatalogRefreshV1({ operation: op.operation })
    f.complete(0, new TextEncoder().encode(text))
    assert.deepEqual(await p, { kind: 'refused', code: 'MATERIALIZATION_REFUSED' })
  }
})

// These fixtures exercise one real owner/shared-engine installation. Clock reads
// can cross either boundary; no injected finished transport result is used.
function clockBoundaryFixture() {
  const base = fixture()
  let utcMs = 0,
    monoMs = 0,
    reads = 0,
    hook: (n: number) => void = () => {}
  const origin = Date.parse('2026-09-26T12:00:00.000Z')
  const made = createOfflineCatalogPublicationOwnerV1(base.input, {
    ...base.runtime,
    readClock: () => {
      hook(++reads)
      return { utc: new Date(origin + utcMs).toISOString(), monoMs }
    },
  })
  assert(made.ok)
  const owner = made.owner,
    registered = owner.registerCatalogScopeV1({ scopeId: 's0' })
  assert(registered.ok)
  const scope = registered.scope
  const register = () => {
    const r = owner.registerRefreshOperationV1({
      scope,
      expectedGeneration: 0,
      deadlineMonoMs: 20000,
    })
    assert(r.ok)
    return r
  }
  return {
    base,
    owner,
    scope,
    register,
    set: (u: number, m = u) => {
      utcMs = u
      monoMs = m
    },
    onRead: (fn: (n: number) => void) => {
      hook = fn
    },
    readCount: () => reads,
    open: (op: ReturnType<typeof register>) =>
      owner.requestCatalogRefreshV1({ operation: op.operation }),
    capacity: () =>
      owner.registerRefreshOperationV1({
        scope,
        expectedGeneration: 0,
        deadlineMonoMs: monoMs + 10000,
      }),
  }
}
for (const dimension of ['utc', 'mono'] as const)
  test(`shared clock ${dimension} rollback owner-to-transport refuses before open and reclaims slots`, async () => {
    const f = clockBoundaryFixture()
    f.set(10)
    const operations = Array.from({ length: 4 }, () => f.register())
    let next = true
    f.onRead(() => {
      if (next) {
        next = false
        f.set(11)
      } else f.set(dimension === 'utc' ? 10 : 11, dimension === 'mono' ? 10 : 11)
    })
    const first = operations[0]
    assert(first)
    const p = f.open(first)
    await flush()
    assert.equal(f.base.counts().opens, 0)
    assert.deepEqual(await p, { kind: 'refused', code: 'INSTALLATION_REFUSED' })
    assert.equal(f.base.counts().opens, 0)
    f.onRead(() => {})
    f.set(12)
    for (const operation of operations.slice(1))
      assert.deepEqual(await f.open(operation), { kind: 'refused', code: 'INSTALLATION_REFUSED' })
    for (let i = 0; i < 4; i++) assert(f.capacity().ok)
    assert.deepEqual(f.capacity(), { ok: false, code: 'CAPACITY_REFUSED' })
  })
for (const dimension of ['utc', 'mono'] as const)
  test(`shared clock ${dimension} rollback transport-to-owner refuses instead of publishing`, async () => {
    const f = clockBoundaryFixture(),
      operation = f.register()
    f.set(10)
    const p = f.open(operation)
    f.set(12)
    f.base.complete()
    f.set(dimension === 'utc' ? 11 : 12, dimension === 'mono' ? 11 : 12)
    await flush()
    assert.deepEqual(await p, { kind: 'refused', code: 'INSTALLATION_REFUSED' })
    assert.equal(f.base.counts().opens, 1)
    f.set(13)
    for (let i = 0; i < 4; i++) assert(f.capacity().ok)
  })
for (const dimension of ['utc', 'mono'] as const)
  test(`shared clock ${dimension} fault after open latches before deadline and retains four cleanup slots`, async () => {
    const f = clockBoundaryFixture(),
      operations = Array.from({ length: 4 }, () => f.register())
    f.set(10)
    const promises = operations.map(f.open)
    assert.equal(f.base.counts().opens, 4)
    // An owner read advances the common history without creating a fifth operation.
    f.set(20)
    assert.deepEqual(f.capacity(), { ok: false, code: 'CAPACITY_REFUSED' })
    const e = f.base.events[0]
    assert(e)
    e.socketAssigned()
    e.socketConnected()
    e.response({ statusCode: 200, rawHeaders: ['content-type', 'application/json'] })
    e.data(rawBytes())
    f.set(dimension === 'utc' ? 19 : 20, dimension === 'mono' ? 19 : 20)
    e.responseEnded()
    await flush()
    let outcomes: unknown[] | undefined
    void Promise.all(promises).then((x) => {
      outcomes = x
    })
    await flush()
    assert.deepEqual(outcomes, Array(4).fill({ kind: 'refused', code: 'INSTALLATION_REFUSED' }))
    f.set(20000)
    for (const wake of [...f.base.wakes.values()]) wake()
    assert.deepEqual(await Promise.all(promises), outcomes)
    assert.deepEqual(f.capacity(), { ok: false, code: 'CAPACITY_REFUSED' })
    e.responseClosed()
    e.requestClosed()
    await flush()
    assert.deepEqual(f.capacity(), { ok: false, code: 'CAPACITY_REFUSED' })
    e.socketClosed()
    await flush()
    assert(f.capacity().ok)
    assert.deepEqual(f.capacity(), { ok: false, code: 'CAPACITY_REFUSED' })
    e.socketClosed()
    e.responseEnded()
    e.error()
    await flush()
    assert.deepEqual(f.capacity(), { ok: false, code: 'CAPACITY_REFUSED' })
  })
test('shared clock fault with missing connection evidence never releases active slots', async () => {
  const f = clockBoundaryFixture(),
    operations = Array.from({ length: 4 }, () => f.register())
  f.set(10)
  const ps = operations.map(f.open)
  f.set(20)
  assert.deepEqual(f.capacity(), { ok: false, code: 'CAPACITY_REFUSED' })
  f.set(19)
  const denied = f.capacity()
  assert.deepEqual(denied, { ok: false, code: 'INSTALLATION_REFUSED' })
  let outcomes: unknown[] | undefined
  void Promise.all(ps).then((x) => {
    outcomes = x
  })
  await flush()
  assert.deepEqual(outcomes, Array(4).fill({ kind: 'refused', code: 'INSTALLATION_REFUSED' }))
  for (const e of f.base.events) {
    e.socketAssigned()
    e.requestClosed()
    e.socketClosed()
  }
  f.set(20000)
  await flush()
  assert.deepEqual(f.capacity(), { ok: false, code: 'CAPACITY_REFUSED' })
})
for (const increasing of [false, true])
  for (const absent of [false, true])
    test(`shared clock ${increasing ? 'increasing' : 'equal'} permits ${absent ? 'absence' : 'catalog'} publication`, async () => {
      const f = clockBoundaryFixture()
      if (increasing) f.onRead((n) => f.set(n))
      const operation = f.register(),
        p = f.open(operation)
      f.base.complete(
        0,
        absent
          ? new TextEncoder().encode('{"data":[],"links":{"next":null},"total_count":0}')
          : rawBytes(),
      )
      const r = await p
      assert.equal(r.kind, absent ? 'absent' : 'published')
      assert.equal(f.base.counts().opens, 1)
    })

test('shared clock fault fixes all siblings before callbacks and preserves prior results', async () => {
  const f = fixture()
  let ms = 0,
    armed = false,
    callbacks = 0
  let cancelSiblings = () => {}
  const callbackResults: unknown[] = []
  const made = createOfflineCatalogPublicationOwnerV1(f.input, {
    ...f.runtime,
    readClock: () => ({
      utc: new Date(Date.parse('2026-09-26T12:00:00.000Z') + ms).toISOString(),
      monoMs: ms,
    }),
    clearWake: (timer: object) => {
      f.runtime.clearWake(timer)
      if (armed) {
        callbacks++
        cancelSiblings()
      }
    },
  })
  assert(made.ok)
  const owner = made.owner,
    s = owner.registerCatalogScopeV1({ scopeId: 's0' })
  assert(s.ok)
  const register = () => {
    const r = owner.registerRefreshOperationV1({
      scope: s.scope,
      expectedGeneration: 0,
      deadlineMonoMs: 10000,
    })
    assert(r.ok)
    return r
  }
  const prior = register()
  assert.deepEqual(
    owner.cancelRefreshOperationV1({
      operation: prior.operation,
      cancellation: prior.cancellation,
    }),
    { ok: true, outcome: 'cancelled' },
  )
  const ops = Array.from({ length: 4 }, register),
    ps = ops.map((op) => owner.requestCatalogRefreshV1({ operation: op.operation }))
  cancelSiblings = () => {
    for (const op of ops)
      callbackResults.push(
        owner.cancelRefreshOperationV1({ operation: op.operation, cancellation: op.cancellation }),
      )
  }
  ms = 20
  assert.deepEqual(
    owner.registerRefreshOperationV1({
      scope: s.scope,
      expectedGeneration: 0,
      deadlineMonoMs: 10000,
    }),
    { ok: false, code: 'CAPACITY_REFUSED' },
  )
  armed = true
  ms = 19
  assert.deepEqual(
    owner.registerRefreshOperationV1({
      scope: s.scope,
      expectedGeneration: 0,
      deadlineMonoMs: 10000,
    }),
    { ok: false, code: 'INSTALLATION_REFUSED' },
  )
  assert(callbacks > 0)
  assert.equal(callbackResults.length, callbacks * 4)
  assert.deepEqual(
    callbackResults,
    Array(callbacks * 4).fill({ ok: true, outcome: 'already-settled' }),
  )
  assert.deepEqual(
    await Promise.all(ps),
    Array(4).fill({ kind: 'refused', code: 'INSTALLATION_REFUSED' }),
  )
  assert.deepEqual(await owner.requestCatalogRefreshV1({ operation: prior.operation }), {
    kind: 'refused',
    code: 'CANCELLED',
  })
})
