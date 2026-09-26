import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { resolvePmcRouteV1 } from '../../routing-policy/src/index.js'
import { createPmcControllerCustodyV1 } from '../src/pmc-launch/controller.js'
import {
  closeIntentOwnerV1,
  initializeIntentOwnerV1,
  openIntentOwnerV1,
} from '../src/pmc-launch/intent-custody.js'
import { createLocalPmcLedger, initializeLocalPmcLedger } from '../src/pmc-launch/ledger.js'

function emptyInstallation() {
  let effects = 0
  const denied = () => {
    effects++
    return { ok: false, code: 'AUTHORITY_REFUSED' }
  }
  return {
    effects: () => effects,
    ports: {
      clock: denied,
      owner: { begin: denied, recordDecision: denied, finish: denied },
      originCapability: {},
      acquire: denied,
      revalidate: denied,
      ledger: {
        snapshot: denied,
        reserve: denied,
        consume: denied,
        settle: denied,
        cancelWithNoSendProof: denied,
      },
      transport: { prepare: async () => denied(), verify: denied, send: async () => denied() },
    },
    observations: { observe: denied },
  }
}

type Fixture = ReturnType<typeof JSON.parse>
const digest = 'a'.repeat(64),
  now = '2026-09-26T12:00:00.000Z',
  expires = '2026-09-26T13:00:00.000Z'
const sha = (s: string) => createHash('sha256').update(s).digest('hex')
const sorted = (v: Fixture): Fixture =>
  Array.isArray(v)
    ? v.map(sorted)
    : v && typeof v === 'object'
      ? Object.fromEntries(
          Object.keys(v)
            .sort()
            .map((k) => [k, sorted(v[k])]),
        )
      : v
function setup(
  t: TestContext,
  outcome: 'stop' | 'length' | 'failed' | 'unknown' | 'no-send' = 'stop',
) {
  const f: Fixture = JSON.parse(
    readFileSync(
      new URL('../../routing-policy/tests/fixtures/pmc-resolver-v1.json', import.meta.url),
      'utf8',
    ),
  )
  f.request.requirements.toolUse = false
  f.request.requirements.structuredOutput = false
  const ownerRoot = mkdtempSync(join(tmpdir(), 'pmc-c-owner-')),
    ledgerRoot = mkdtempSync(join(tmpdir(), 'pmc-c-ledger-'))
  t.after(() => {
    rmSync(ownerRoot, { recursive: true, force: true })
    rmSync(ledgerRoot, { recursive: true, force: true })
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
    requestId: _i,
    requestDigest: _d,
    attempt: _a,
    ...routeTemplate
  } = f.request
  const initialized = initializeIntentOwnerV1(
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
  assert(initialized.ok)
  const ids = initialized.value[0]
  assert(ids)
  const route = { ...f.request, episodeId: ids.episodeId, requestId: ids.requestIds[0] }
  const request: Fixture = {
    version: 'pmc-launch/v1',
    intentRef: 'intent',
    route,
    payloadJson: '{"messages":[{"role":"user","content":"public synthetic"}]}',
    override: null,
  }
  const { requestDigest: _rd, ...material } = route
  route.requestDigest = sha(
    JSON.stringify(['pmc-request/v1', 'intent', material, request.payloadJson]),
  )
  const refresh = (v: Fixture) => {
    if (v && typeof v === 'object') {
      if ('requestDigest' in v) v.requestDigest = route.requestDigest
      if ('observedAtUtc' in v) v.observedAtUtc = now
      if ('expiresAtUtc' in v) v.expiresAtUtc = expires
      for (const x of Object.values(v)) refresh(x)
    }
  }
  refresh(f.context)
  const source = f.context.catalog.source
  const evidence = (bindingId: string | null = null) => ({ ...source.evidence, bindingId })
  const boot = createPmcControllerCustodyV1('synthetic-offline')
  assert(boot.ok)
  const origin = {}
  const owner = openIntentOwnerV1(
    { root: ownerRoot, expectedIdentity: identity },
    {
      clock: () => now,
      authenticateOrigin: (_a: unknown, _s: unknown, p: Fixture, cap: object) =>
        cap === origin
          ? {
              accepted: true,
              episodeEvidence: evidence(),
              budgetEvidence: evidence(),
              priorDisposition:
                p.request.attempt.kind === 'fallback' ? p.request.attempt.priorDisposition : null,
              primaryQuality:
                p.request.attempt.kind === 'fallback' ? p.request.attempt.primaryQuality : null,
            }
          : { accepted: false },
      authenticateSelection: boot.custody.authenticateSelection,
      authenticateCompletion: boot.custody.authenticateCompletion,
    },
  )
  assert(owner.ok)
  t.after(() => closeIntentOwnerV1(owner.value.owner))
  const initializedLedger = initializeLocalPmcLedger(
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
  )
  assert(initializedLedger.ok)
  let observed = false,
    sends = 0,
    consumed: Fixture
  const billing = { actualMicroUsd: 3 }
  let lastDecision: Fixture
  let proof = {},
    proofId = 'terminal-proof'
  const authenticate = (a: Fixture, p: Fixture, noSend: boolean) => {
    if (
      !observed ||
      p.proofId !== proofId ||
      !consumed ||
      a.requestId !== consumed.requestId ||
      a.requestDigest !== consumed.requestDigest ||
      a.ledgerId !== consumed.ledgerId ||
      a.epoch !== consumed.epoch ||
      a.scopeId !== consumed.scopeId ||
      a.costValueDigest !== consumed.costValueDigest ||
      a.maximumMicroUsd !== consumed.maximumMicroUsd
    )
      return { accepted: false }
    const terminal =
      outcome === 'no-send' ? 'cancelled' : outcome === 'unknown' ? 'uncertain' : 'settled'
    const actual = outcome === 'no-send' || outcome === 'unknown' ? null : billing.actualMicroUsd
    if (
      a.state !== 'consumed' &&
      (a.state !== terminal ||
        a.actualMicroUsd !== actual ||
        a.proofRef !== proofId ||
        a.proofDigest !== sha(proofId) ||
        a.updatedAtUtc < consumed.updatedAtUtc)
    )
      return { accepted: false }
    return {
      accepted: true,
      ledgerId: a.ledgerId,
      epoch: a.epoch,
      requestId: a.requestId,
      requestDigest: a.requestDigest,
      scopeId: a.scopeId,
      proofRef: proofId,
      proofDigest: sha(proofId),
      ...(noSend
        ? { noSend: true }
        : {
            outcome:
              outcome === 'unknown'
                ? { kind: 'unknown' }
                : { kind: 'known', actualMicroUsd: billing.actualMicroUsd },
          }),
    }
  }
  const ledger = createLocalPmcLedger(
    {
      root: ledgerRoot,
      expectedLedgerId: 'ledger',
      expectedEpoch: 'epoch',
      expectedInitializationAuthorityDigest: digest,
    },
    {
      clock: () => now,
      authenticateNoSendProof: (a, p) => authenticate(a, p, true),
      authenticateSettlement: (a, p) => authenticate(a, p, false),
    },
  )
  assert(ledger.ok)
  const models = f.context.catalog.results.map((r: Fixture) => ({
    provider: r.provider,
    id: r.providerModelId,
    baseUrl: r.provider === 'openrouter' ? 'https://openrouter.ai/api/v1' : r.facts.baseUrl,
    api: r.facts.api,
    input: r.facts.inputModalities,
    reasoning: true,
    contextWindow: 10000,
    maxTokens: 2000,
    cost: { input: r.facts.rates.input, output: r.facts.rates.output },
    thinkingLevelMap: { off: 'none', high: 'high' },
  }))
  const bytes = new TextEncoder().encode(
    `${JSON.stringify(
      {
        formatVersion: 'rcm-catalog-snapshot/v1',
        sourceRef: 'synthetic-offline-only',
        providers: [
          { providerKey: 'opencode', checkedAtUtc: now },
          { providerKey: 'openrouter', checkedAtUtc: now },
        ],
        models,
      },
      null,
      2,
    )}\n`,
  )
  const snapshot = sha(new TextDecoder().decode(bytes))
  source.value.snapshotDigest = snapshot
  const identities = models.map((m: Fixture) => ({ provider: m.provider, id: m.id }))
  const catalogInput = {
    canonicalBytes: bytes,
    expectedSha256: snapshot,
    approvedConfig: {
      authorityRef: 'synthetic-config',
      endpoints: [
        { provider: 'opencode', baseUrl: 'https://synthetic.invalid/v1' },
        { provider: 'openrouter', baseUrl: 'https://openrouter.ai/api/v1' },
      ],
    },
    identities,
    acceptedSource: {
      profileId: 'synthetic-profile',
      profileVersion: 'v1',
      canonicalSha256: snapshot,
      sourceEvidenceRef: 'synthetic-offline-only',
      sourceEvidenceSha256: digest,
      requestedIdentities: identities,
    },
  }
  const {
    catalog: _c,
    episode: _ep,
    budget: _b,
    evaluationTimeUtc: _time,
    evidenceMode: _mode,
    ...context
  } = f.context
  const prices = context.bindings.map((b: Fixture) => {
    const binding = context.projection.policy.bindings.find(
      (p: Fixture) => p.bindingId === b.bindingId,
    )
    return {
      version: 'pmc-price/v1',
      currency: 'USD',
      requestDigest: route.requestDigest,
      identity: {
        bindingId: b.bindingId,
        provider: binding.provider,
        providerModelId: binding.providerModelId,
      },
      sourceProfileId: 'synthetic-profile',
      sourceProfileVersion: 'v1',
      sourceProfileDigest: digest,
      tariffDigest: digest,
      priceEvidenceDigest: digest,
      inputRate: { value: '1', unit: 'USD per 1M tokens' },
      outputRate: { value: '2', unit: 'USD per 1M tokens' },
      perRequestFeeUsd: '0',
      otherFees: 'none-attested',
      maximumInputTokens: 1000,
      maximumOutputTokens: 200,
      rankingTokens: { input: 100, output: 20 },
    }
  })
  context.bindings = context.bindings.map((b: Fixture) => {
    const { cost, ...rest } = b
    if (b.bindingId === 'binding-2' || b.bindingId === 'binding-3')
      rest.catalogBaseUrl.value = 'https://openrouter.ai/api/v1'
    return { ...rest, costEvidence: cost.evidence }
  })
  const acquired = {
    context,
    catalogInput,
    catalogSource: source,
    prices,
    runtimeDigest: digest,
    evidenceDigest: digest,
    expiresAtUtc: expires,
    scopeId: 'scope',
    classCeilingMicroUsd: 10000000,
    ceilingAuthorityRef: 'ceiling',
    ceilingAuthorityDigest: digest,
  }
  const wireProof = {}
  let wire: Fixture
  let certifiedWire: Fixture
  const syntheticProfile = { boundProven: true, transformBody: (value: Fixture) => value }
  const ports = {
    clock: () => now,
    owner: owner.value.owner,
    originCapability: origin,
    acquire: () => acquired,
    revalidate: (current: unknown) => ({ accepted: true, current, evaluatedAtUtc: now }),
    ledger: ledger.value,
    transport: {
      prepare: async (q: Fixture, d: Fixture) => {
        lastDecision = d
        const body = JSON.stringify(
          syntheticProfile.transformBody({
            model: d.decision.providerModelId,
            messages: [{ role: 'user', content: 'public synthetic' }],
            reasoning: { effort: 'high' },
            provider: { data_collection: 'deny', zdr: true },
            max_tokens: 200,
          }),
        )
        wire = {
          version: 'pmc-wire/v1',
          requestDigest: q.requestDigest,
          decisionDigest: sha(JSON.stringify(['pmc-decision/v1', q.requestDigest, sorted(d)])),
          method: 'POST',
          operationUrl: 'https://openrouter.ai/api/v1/chat/completions',
          protocol: 'openai-completions',
          provider: 'openrouter',
          bindingId: d.decision.bindingId,
          providerModelId: d.decision.providerModelId,
          piHostModelId: d.decision.piHostModelId,
          dataClass: 'public',
          thinkingLevel: 'high',
          wireEffort: 'high',
          data_collection: 'deny',
          zdr: true,
          toolUse: false,
          structuredOutput: false,
          maximumInputTokens: 1000,
          maximumOutputTokens: 200,
          body,
          bodyDigest: sha(body),
          headers: { 'content-type': 'application/json', accept: 'text/event-stream' },
          boundProof: wireProof,
        }
        const { boundProof: _proof, ...ordinary } = wire
        certifiedWire = structuredClone(ordinary)
        return wire
      },
      verify: (w: Fixture, claims: Fixture) => {
        const { boundProof, ...ordinary } = w
        const body = JSON.parse(w.body)
        const expected = {
          requestDigest: w.requestDigest,
          decisionDigest: w.decisionDigest,
          wireDigest: sha(JSON.stringify(certifiedWire)),
          policyDigest: digest,
          configDigest: digest,
          runtimeDigest: digest,
          catalogDigest: snapshot,
          evidenceDigest: digest,
          expiresAtUtc: expires,
        }
        return {
          accepted:
            boundProof === wireProof &&
            sameFixture(ordinary, certifiedWire) &&
            sameFixture(claims, expected) &&
            syntheticProfile.boundProven &&
            body.model === w.providerModelId &&
            body.reasoning?.effort === w.wireEffort &&
            body.provider?.data_collection === w.data_collection &&
            body.provider?.zdr === w.zdr &&
            body.max_tokens === w.maximumOutputTokens &&
            !Object.hasOwn(body, 'tools') &&
            !Object.hasOwn(body, 'response_format'),
        }
      },
      send: async (_w: unknown, a: unknown) => {
        consumed = a
        proof = {}
        proofId = `proof-${consumed.requestId}`
        sends++
        return { kind: 'terminal', proof }
      },
    },
  }
  const observations = {
    observe: (p: object, _invocation: object, current: Fixture) => {
      if (
        p !== proof ||
        !sameFixture(current.consumed, consumed) ||
        current.wire.boundProof !== wireProof
      )
        return { accepted: false }
      observed = true
      return {
        accepted: true,
        proofId,
        observation:
          outcome === 'no-send'
            ? { kind: 'no-send', code: 'CREDENTIAL_REFUSED' }
            : {
                kind: 'response',
                semantic: outcome === 'unknown' ? 'failed' : outcome,
                charge:
                  outcome === 'unknown'
                    ? { kind: 'unknown', reason: 'missing' }
                    : { kind: 'known', actualMicroUsd: billing.actualMicroUsd },
              },
      }
    },
  }
  return {
    boot,
    ports,
    observations,
    request,
    acquired,
    owner: owner.value.owner,
    ledger: ledger.value,
    sends: () => sends,
    ownerRoot,
    identity,
    origin,
    ids,
    billing,
    syntheticProfile,
    get decision() {
      return lastDecision
    },
    get proofId() {
      return proofId
    },
    authenticate,
  }
}

function rebind(f: ReturnType<typeof setup>) {
  const { requestDigest: _d, ...route } = f.request.route
  f.request.route.requestDigest = sha(
    JSON.stringify(['pmc-request/v1', f.request.intentRef, route, f.request.payloadJson]),
  )
  const update = (v: Fixture) => {
    if (v && typeof v === 'object') {
      if ('requestDigest' in v) v.requestDigest = f.request.route.requestDigest
      for (const x of Object.values(v)) update(x)
    }
  }
  update(f.acquired)
}

test('real R1 to R2 keeps prior claim request binding, never permits a third attempt', async (t) => {
  const f = setup(t, 'no-send'),
    b = f.boot.custody.bind(f.ports, f.observations)
  assert(b.ok)
  const r1 = await b.controller.launch(f.request)
  assert(r1.ok)
  const oldDigest = f.request.route.requestDigest
  const quality = structuredClone(
    f.acquired.context.bindings.find((v: Fixture) => v.bindingId === 'binding-2').quality,
  )
  const priorEvidence = { ...quality.evidence, evidenceState: 'static-conformance' }
  f.request.route.requestId = f.ids.requestIds[1]
  f.request.route.attempt = {
    kind: 'fallback',
    priorRequestId: r1.receipt.requestId,
    priorDecisionDigest: r1.receipt.decisionDigest,
    priorRequestDigest: oldDigest,
    primaryBindingId: 'binding-2',
    priorDisposition: { status: 'supplied', value: 'terminal-no-send', evidence: priorEvidence },
    primaryQuality: quality,
  }
  rebind(f)
  assert.equal(f.request.route.attempt.primaryQuality.evidence.requestDigest, oldDigest)
  const r2 = await b.controller.launch(f.request)
  assert.equal(r2.ok, true, JSON.stringify(r2))
  assert.equal(f.sends(), 2)
  for (const name of ['priorDisposition', 'primaryQuality']) {
    const wrong = structuredClone(f.request.route)
    wrong.attempt[name].evidence.requestDigest = wrong.requestDigest
    const refused = resolvePmcRouteV1(wrong, f.decision.decision.audit.inputs)
    assert.equal(refused.ok, false)
    if (!refused.ok) assert.equal(refused.code, 'CONTEXT_BINDING_REFUSED')
  }
  assert.equal((await b.controller.launch(f.request)).ok, false)
  assert.equal(f.sends(), 2)
})

for (const name of ['priorDisposition', 'primaryQuality'] as const)
  test(`R2 ${name} rebound to current digest refuses before reservation`, async (t) => {
    const f = setup(t, 'no-send'),
      b = f.boot.custody.bind(f.ports, f.observations)
    assert(b.ok)
    const r1 = await b.controller.launch(f.request)
    assert(r1.ok)
    const quality = structuredClone(
      f.acquired.context.bindings.find((v: Fixture) => v.bindingId === 'binding-2').quality,
    )
    f.request.route.requestId = f.ids.requestIds[1]
    f.request.route.attempt = {
      kind: 'fallback',
      priorRequestId: r1.receipt.requestId,
      priorDecisionDigest: r1.receipt.decisionDigest,
      priorRequestDigest: r1.receipt.requestDigest,
      primaryBindingId: 'binding-2',
      priorDisposition: {
        status: 'supplied',
        value: 'terminal-no-send',
        evidence: { ...quality.evidence, evidenceState: 'static-conformance' },
      },
      primaryQuality: quality,
    }
    // A different domain cannot be repaired by recomputing a request hash.
    f.request.route.attempt[name].evidence.requestDigest = 'b'.repeat(64)
    rebind(f)
    const r2 = await b.controller.launch(f.request)
    assert.equal(r2.ok, false)
    assert.equal(f.sends(), 1)
    const s = f.ledger.snapshot({ scopeId: 'scope' })
    assert(s.ok)
    assert.equal(s.value.outstandingMicroUsd, 0)
  })

test('captured functions and owned request survive caller mutation during preparation', async (t) => {
  const f = setup(t),
    prepare = f.ports.transport.prepare
  f.ports.transport.prepare = async (q, d) => {
    const result = await prepare(q, d)
    f.request.payloadJson = 'caller mutation'
    f.request.route.requirements.maximumOutputTokens = 0
    f.ports.transport.send = async () => {
      throw new Error('replacement must not run')
    }
    f.acquired.prices[0].inputRate.value = '999'
    return result
  }
  const b = f.boot.custody.bind(f.ports, f.observations)
  assert(b.ok)
  const r = await b.controller.launch(f.request)
  assert.equal(r.ok, true, JSON.stringify(r))
  assert.equal(f.sends(), 1)
})

test('concurrent and reentrant same-intent launches never duplicate reserve or send', async (t) => {
  const f = setup(t),
    prepare = f.ports.transport.prepare
  let release!: () => void
  const pending = new Promise<void>((resolve) => {
    release = resolve
  })
  f.ports.transport.prepare = async (q, d) => {
    await pending
    return prepare(q, d)
  }
  const b = f.boot.custody.bind(f.ports, f.observations)
  assert(b.ok)
  const first = b.controller.launch(f.request)
  const denied = await b.controller.launch(f.request)
  assert.equal(denied.ok, false)
  release()
  assert.equal((await first).ok, true)
  assert.equal(f.sends(), 1)
})

for (const [name, mutate, code] of [
  [
    'runtime digest',
    (a: Fixture) => {
      a.runtimeDigest = 'bad'
    },
    'EVIDENCE_REFUSED',
  ],
  [
    'expired acquisition',
    (a: Fixture) => {
      a.expiresAtUtc = '2026-09-25T12:00:00.000Z'
    },
    'EVIDENCE_REFUSED',
  ],
  [
    'source unknown',
    (a: Fixture) => {
      a.catalogSource = { status: 'unknown' }
    },
    'EVIDENCE_REFUSED',
  ],
  [
    'catalog digest',
    (a: Fixture) => {
      a.catalogInput.expectedSha256 = 'b'.repeat(64)
    },
    'CATALOG_REFUSED',
  ],
  [
    'source profile',
    (a: Fixture) => {
      a.catalogSource.value.profileId = 'wrong'
    },
    'EVIDENCE_REFUSED',
  ],
  [
    'numeric tariff',
    (a: Fixture) => {
      a.prices[0].inputRate.value = 1
    },
    'MONEY_REFUSED',
  ],
  [
    'request binding',
    (a: Fixture) => {
      a.prices[0].requestDigest = 'b'.repeat(64)
    },
    'MONEY_REFUSED',
  ],
  [
    'count binding',
    (a: Fixture) => {
      a.prices[0].maximumInputTokens++
    },
    'MONEY_REFUSED',
  ],
  [
    'price identity',
    (a: Fixture) => {
      a.prices[0].identity.providerModelId = 'wrong'
    },
    'MONEY_REFUSED',
  ],
  [
    'missing price',
    (a: Fixture) => {
      a.prices.pop()
    },
    'MONEY_REFUSED',
  ],
  [
    'duplicate price',
    (a: Fixture) => {
      a.prices[1] = a.prices[0]
    },
    'MONEY_REFUSED',
  ],
  [
    'quality unknown',
    (a: Fixture) => {
      for (const b of a.context.bindings) b.quality = { status: 'unknown' }
    },
    'RESOLVER_REFUSED',
  ],
  [
    'availability unknown',
    (a: Fixture) => {
      for (const b of a.context.bindings) b.available = { status: 'unknown' }
    },
    'RESOLVER_REFUSED',
  ],
] as const)
  test(`real predecessor refuses ${name} at ${code}`, async (t) => {
    const f = setup(t)
    mutate(f.acquired)
    const b = f.boot.custody.bind(f.ports, f.observations)
    assert(b.ok)
    const r = await b.controller.launch(f.request)
    assert.equal(r.ok, false)
    if (!r.ok) assert.equal(r.code, code)
    assert.equal(f.sends(), 0)
    const s = f.ledger.snapshot({ scopeId: 'scope' })
    assert(s.ok)
    assert.equal(s.value.outstandingMicroUsd, 0)
  })

for (const name of [
  'operationUrl',
  'bodyDigest',
  'wireEffort',
  'providerModelId',
  'maximumOutputTokens',
  'headers',
  'boundProof',
] as const)
  test(`owned wire rejects ${name} replacement before reservation`, async (t) => {
    const f = setup(t),
      prepare = f.ports.transport.prepare
    f.ports.transport.prepare = async (q, d) => {
      const w = await prepare(q, d)
      return {
        ...w,
        [name]:
          name === 'maximumOutputTokens'
            ? 0
            : name === 'headers'
              ? { 'content-type': 'application/json', accept: 'text/event-stream', extra: 'bad' }
              : name === 'boundProof'
                ? {}
                : 'wrong',
      }
    }
    const b = f.boot.custody.bind(f.ports, f.observations)
    assert(b.ok)
    const r = await b.controller.launch(f.request)
    assert.equal(r.ok, false)
    if (!r.ok) assert.equal(r.code, 'WIRE_REFUSED')
    assert.equal(f.sends(), 0)
  })
const sameFixture = (a: unknown, b: unknown) =>
  JSON.stringify(sorted(a)) === JSON.stringify(sorted(b))

test('actual resolver, catalog, money, SQLite owner and ledger reconcile one synthetic send', async (t) => {
  const f = setup(t),
    bound = f.boot.custody.bind(f.ports, f.observations)
  assert(bound.ok)
  const result = await bound.controller.launch(f.request)
  assert.equal(result.ok, true, JSON.stringify(result))
  if (result.ok) assert.equal(result.receipt.disposition, 'succeeded')
  assert.equal(f.sends(), 1)
  const snapshot = f.ledger.snapshot({ scopeId: 'scope' })
  assert(snapshot.ok)
  assert.equal(snapshot.value.settledMicroUsd, 3)
  assert.equal(snapshot.value.outstandingMicroUsd, 0)
  assert.equal((await bound.controller.launch(f.request)).ok, false)
  assert.equal(f.sends(), 1)
})

for (const outcome of ['stop', 'length', 'failed', 'unknown', 'no-send'] as const)
  test(`real-store terminal ${outcome} and identical-proof replay preserve accounting`, async (t) => {
    const f = setup(t, outcome),
      b = f.boot.custody.bind(f.ports, f.observations)
    assert(b.ok)
    const r = await b.controller.launch(f.request)
    assert.equal(r.ok, outcome !== 'unknown', JSON.stringify(r))
    assert(r.receipt)
    assert.equal(
      r.receipt.disposition,
      outcome === 'no-send'
        ? 'terminal-no-send'
        : outcome === 'unknown'
          ? 'uncertain'
          : outcome === 'stop'
            ? 'succeeded'
            : 'terminal-failed-settled',
    )
    const args = {
      requestId: f.request.route.requestId,
      requestDigest: f.request.route.requestDigest,
    }
    const again =
      outcome === 'no-send'
        ? f.ledger.cancelWithNoSendProof({ ...args, proof: { proofId: f.proofId } })
        : f.ledger.settle({ ...args, observation: { proofId: f.proofId } })
    assert(again.ok)
    for (const delta of [
      { actualMicroUsd: 999 },
      { proofRef: 'copied' },
      { proofDigest: 'b'.repeat(64) },
      { state: 'reserved' },
    ])
      assert.deepEqual(
        f.authenticate({ ...again.value, ...delta }, { proofId: f.proofId }, outcome === 'no-send'),
        { accepted: false },
      )
    assert.equal(f.sends(), 1)
  })

test('pre-consume refusal holds both real reservation and pending owner across reopen', async (t) => {
  const f = setup(t)
  f.ports.revalidate = () => ({ accepted: false }) as never
  let consumes = 0,
    finishes = 0
  const ledger = {
    ...f.ledger,
    consume: (q: unknown) => {
      consumes++
      return f.ledger.consume(q)
    },
  }
  const owner = {
    ...f.owner,
    finish: (...args: Parameters<typeof f.owner.finish>) => {
      finishes++
      return f.owner.finish(...args)
    },
  }
  const b = f.boot.custody.bind({ ...f.ports, ledger, owner }, f.observations)
  assert(b.ok)
  const r = await b.controller.launch(f.request)
  assert.equal(r.ok, false)
  if (!r.ok) assert.equal(r.code, 'REVALIDATION_REFUSED')
  const s = f.ledger.snapshot({ scopeId: 'scope' })
  assert(s.ok)
  assert(s.value.outstandingMicroUsd > 0)
  assert.equal(consumes, 0)
  assert.equal(finishes, 0)
  assert.equal(f.sends(), 0)
  assert.equal((await b.controller.launch(f.request)).ok, false)
  closeIntentOwnerV1(f.owner)
  const reopened = openIntentOwnerV1(
    { root: f.ownerRoot, expectedIdentity: f.identity },
    {
      clock: () => now,
      authenticateOrigin: () => {
        throw new Error('pending must refuse first')
      },
      authenticateSelection: f.boot.custody.authenticateSelection,
      authenticateCompletion: f.boot.custody.authenticateCompletion,
    },
  )
  assert(reopened.ok)
  assert.equal(
    reopened.value.owner.begin(
      {
        intentRef: 'intent',
        request: f.request.route,
        computedRequestDigest: f.request.route.requestDigest,
      },
      f.origin,
    ).ok,
    false,
  )
  closeIntentOwnerV1(reopened.value.owner)
})

for (const boundaryName of ['recordDecision', 'reserve', 'consume', 'settle', 'finish'] as const)
  for (const after of [false, true])
    test(`actual ${boundaryName} ${after ? 'lost acknowledgement' : 'pre-call failure'} never refunds or resends`, async (t) => {
      const f = setup(t)
      const owner = { ...f.owner },
        ledger = { ...f.ledger }
      if (boundaryName === 'recordDecision' || boundaryName === 'finish') {
        const actual = owner[boundaryName]
        owner[boundaryName] = (...args) => {
          if (after) actual(...args)
          return { ok: false, code: 'COMMIT_UNCERTAIN' }
        }
      } else {
        const actual = ledger[boundaryName]
        ledger[boundaryName] = (arg) => {
          if (after) actual(arg)
          return { ok: false, code: 'LEDGER_COMMIT_UNCERTAIN' }
        }
      }
      const b = f.boot.custody.bind({ ...f.ports, owner, ledger }, f.observations)
      assert(b.ok)
      const r = await b.controller.launch(f.request)
      assert.equal(r.ok, false)
      const firstSends = f.sends()
      assert.equal(firstSends, boundaryName === 'settle' || boundaryName === 'finish' ? 1 : 0)
      assert.equal((await b.controller.launch(f.request)).ok, false)
      assert.equal(f.sends(), firstSends)
      const s = f.ledger.snapshot({ scopeId: 'scope' })
      assert(s.ok)
      if ((boundaryName === 'reserve' && !after) || boundaryName === 'recordDecision')
        assert.equal(s.value.outstandingMicroUsd, 0)
      else if (boundaryName === 'finish' || (boundaryName === 'settle' && after))
        assert.equal(s.value.settledMicroUsd, 3)
      else assert(s.value.outstandingMicroUsd > 0)
    })

test('capture precedence rejects independent ordinary shapes without owner effects', async () => {
  const f = emptyInstallation(),
    boot = createPmcControllerCustodyV1('synthetic-offline')
  assert(boot.ok)
  const b = boot.custody.bind(f.ports, f.observations)
  assert(b.ok)
  let calls = 0
  const getter = Object.defineProperty({}, 'x', {
    enumerable: true,
    get() {
      calls++
      throw null
    },
  })
  const cycle: Fixture = {}
  cycle.self = cycle
  const sparse = Array(1),
    extended: Fixture = []
  extended.extra = 1
  const hidden = Object.defineProperty({}, 'x', { value: 1 })
  for (const v of [
    undefined,
    NaN,
    Infinity,
    () => 0,
    Promise.resolve(null),
    new Date(),
    cycle,
    sparse,
    extended,
    hidden,
    getter,
    { [Symbol('s')]: 1 },
    Object.fromEntries([['then', null]]),
    new Uint8Array(0),
    new Proxy(
      {},
      {
        ownKeys() {
          throw null
        },
      },
    ),
  ]) {
    assert.deepEqual(await b.controller.launch({ override: 'requested', extra: v }), {
      ok: false,
      code: 'INPUT_REFUSED',
      receipt: null,
    })
  }
  assert.equal(calls, 0)
  assert.equal(f.effects(), 0)
})

test('array length and minimum traversal budget refuse before ownKeys/descriptors', async () => {
  const f = emptyInstallation(),
    boot = createPmcControllerCustodyV1('synthetic-offline')
  assert(boot.ok)
  const b = boot.custody.bind(f.ports, f.observations)
  assert(b.ok)
  let keys = 0
  const array = new Proxy(Array(1000000), {
    ownKeys() {
      keys++
      throw null
    },
  })
  assert.deepEqual(await b.controller.launch({ extra: array }), {
    ok: false,
    code: 'BOUNDS_REFUSED',
    receipt: null,
  })
  assert.equal(keys, 0)
  assert.equal(f.effects(), 0)
})

test('a trap throwing a hostile object never escapes or inspects that thrown object', async () => {
  const f = emptyInstallation(),
    boot = createPmcControllerCustodyV1('synthetic-offline')
  assert(boot.ok)
  const b = boot.custody.bind(f.ports, f.observations)
  assert(b.ok)
  let inspections = 0
  const thrown = new Proxy(
    {},
    {
      getPrototypeOf() {
        inspections++
        throw null
      },
      get() {
        inspections++
        throw null
      },
    },
  )
  const request = new Proxy(
    {},
    {
      ownKeys() {
        throw thrown
      },
    },
  )
  assert.deepEqual(await b.controller.launch(request), {
    ok: false,
    code: 'INPUT_REFUSED',
    receipt: null,
  })
  assert.equal(inspections, 0)
})

test('independently counted exact ordinary nodes and aliases accept 65536, refuse 65537', async () => {
  const f = emptyInstallation(),
    boot = createPmcControllerCustodyV1('synthetic-offline')
  assert(boot.ok)
  const b = boot.custody.bind(f.ports, f.observations)
  assert(b.ok)
  const nodes = (v: Fixture): number =>
    v && typeof v === 'object'
      ? 1 +
        Reflect.ownKeys(v).reduce<number>(
          (n, k) =>
            n +
            1 +
            (Array.isArray(v) && k === 'length'
              ? 0
              : nodes(Object.getOwnPropertyDescriptor(v, k)?.value)),
          0,
        )
      : 1
  for (const alias of [false, true]) {
    const padding: Fixture = Object.fromEntries(
      Array.from({ length: 32765 }, (_, i) => [`k${i}`, null]),
    )
    padding.k0 = []
    padding.k1 = {}
    padding.k2 = alias ? padding.k1 : {}
    const q = { override: 'requested', padding }
    assert.equal(nodes(q), 65536)
    assert.deepEqual(await b.controller.launch(q), {
      ok: false,
      code: 'BREAK_GLASS_REFUSED',
      receipt: null,
    })
    padding.k3 = []
    assert.equal(nodes(q), 65537)
    assert.deepEqual(await b.controller.launch(q), {
      ok: false,
      code: 'BOUNDS_REFUSED',
      receipt: null,
    })
  }
  assert.equal(f.effects(), 0)
})

test('exact depth, per-string, payload and aggregate budgets have independent one-over controls', async () => {
  const f = emptyInstallation(),
    boot = createPmcControllerCustodyV1('synthetic-offline')
  assert(boot.ok)
  const b = boot.custody.bind(f.ports, f.observations)
  assert(b.ok)
  const expect = async (q: unknown, code: string) =>
    assert.deepEqual(await b.controller.launch(q), { ok: false, code, receipt: null })
  const nested = (n: number) => {
    let v: Fixture = null
    while (n--) v = { child: v }
    return v
  }
  await expect({ override: 'requested', padding: nested(15) }, 'BREAK_GLASS_REFUSED')
  await expect({ override: 'requested', padding: nested(16) }, 'BOUNDS_REFUSED')
  await expect({ override: 'requested', padding: 'x'.repeat(2048) }, 'BREAK_GLASS_REFUSED')
  await expect({ override: 'requested', padding: 'x'.repeat(2049) }, 'BOUNDS_REFUSED')
  await expect({ override: 'requested', payloadJson: 'x'.repeat(262144) }, 'BREAK_GLASS_REFUSED')
  await expect({ override: 'requested', payloadJson: 'x'.repeat(262145) }, 'BOUNDS_REFUSED')
  const units = (v: Fixture): number =>
    typeof v === 'string'
      ? v.length
      : v && typeof v === 'object'
        ? Object.entries(v).reduce((n, [k, x]) => n + k.length + units(x), 0)
        : 0
  const padding: Fixture = Object.fromEntries(Array.from({ length: 513 }, (_, i) => [`s${i}`, '']))
  const q = { override: 'requested', padding }
  let left = 1048576 - units(q)
  for (const key of Object.keys(padding)) {
    const n = Math.min(2048, left)
    padding[key] = 'x'.repeat(n)
    left -= n
  }
  assert.equal(left, 0)
  assert.equal(units(q), 1048576)
  await expect(q, 'BREAK_GLASS_REFUSED')
  padding.s512 += 'x'
  assert.equal(units(q), 1048577)
  await expect(q, 'BOUNDS_REFUSED')
  assert.equal(f.effects(), 0)
})

for (const fallback of [false, true])
  test(`literal ${fallback ? 'fallback' : 'initial'} digest binds declaration order and full evidence`, async () => {
    const f: Fixture = JSON.parse(
      readFileSync(
        new URL('../../routing-policy/tests/fixtures/pmc-resolver-v1.json', import.meta.url),
        'utf8',
      ),
    )
    const q = f.request,
      ev = {
        ...f.context.catalog.source.evidence,
        bindingId: 'binding-2',
        observedAtUtc: now,
        expiresAtUtc: expires,
        requestDigest: 'c'.repeat(64),
      }
    if (fallback)
      q.attempt = {
        kind: 'fallback',
        priorRequestId: 'prior',
        priorDecisionDigest: 'b'.repeat(64),
        priorRequestDigest: 'c'.repeat(64),
        primaryBindingId: 'binding-2',
        priorDisposition: { status: 'supplied', value: 'terminal-no-send', evidence: ev },
        primaryQuality: {
          status: 'supplied',
          value: 0.9,
          evidence: { ...ev, evidenceState: 'model-quality' },
        },
      }
    q.requestDigest = fallback
      ? '8396e235fcc958c78a0cfa7563a672a6dd9367375e7ee7ac45be29f38becffaf'
      : 'e375a29f94058215ef9b79266747411670cc737e13913c454400dfdbcc5071ff'
    const reverse = (v: Fixture): Fixture =>
      Array.isArray(v)
        ? v.map(reverse)
        : v && typeof v === 'object'
          ? Object.fromEntries(
              Object.entries(v)
                .reverse()
                .map(([k, x]) => [k, reverse(x)]),
            )
          : v
    let begins = 0
    const empty = emptyInstallation()
    empty.ports.owner.begin = () => {
      begins++
      return { ok: false, code: 'AUTHORITY_REFUSED' }
    }
    const boot = createPmcControllerCustodyV1('synthetic-offline')
    assert(boot.ok)
    const b = boot.custody.bind(empty.ports, empty.observations)
    assert(b.ok)
    for (const route of [q, reverse(q)]) {
      const r = await b.controller.launch({
        version: 'pmc-launch/v1',
        intentRef: 'intent',
        route,
        payloadJson: '{}',
        override: null,
      })
      assert.deepEqual(r, { ok: false, code: 'EPISODE_REFUSED', receipt: null })
    }
    assert.equal(begins, 2)
    if (fallback) {
      q.attempt.primaryQuality.evidence.receiptId = 'changed'
      const r = await b.controller.launch({
        version: 'pmc-launch/v1',
        intentRef: 'intent',
        route: q,
        payloadJson: '{}',
        override: null,
      })
      assert.deepEqual(r, { ok: false, code: 'INPUT_REFUSED', receipt: null })
      assert.equal(begins, 2)
    }
  })

test('acknowledged consume is immediately followed by captured send, before any observer or clock', async (t) => {
  const f = setup(t),
    events: string[] = []
  const send = f.ports.transport.send,
    observe = f.observations.observe
  f.ports.clock = () => {
    events.push('clock')
    return now
  }
  f.ports.transport.send = (...args) => {
    events.push('send')
    return send(...args)
  }
  f.observations.observe = (...args) => {
    events.push('observe')
    return observe(...args)
  }
  const ledger = {
    ...f.ledger,
    consume: (arg: unknown) => {
      const result = f.ledger.consume(arg)
      events.push('consume.return')
      return result
    },
  }
  const b = f.boot.custody.bind({ ...f.ports, ledger }, f.observations)
  assert(b.ok)
  assert.equal((await b.controller.launch(f.request)).ok, true)
  const i = events.indexOf('consume.return')
  assert(i >= 0)
  assert.equal(events[i + 1], 'send')
  assert(events.indexOf('observe') > i + 1)
})

test('known over-bound charge uses unchanged ledger freeze, never caps or refunds actual cost', async (t) => {
  const f = setup(t)
  f.billing.actualMicroUsd = 9000
  const b = f.boot.custody.bind(f.ports, f.observations)
  assert(b.ok)
  const r = await b.controller.launch(f.request)
  assert.equal(r.ok, true, JSON.stringify(r))
  const s = f.ledger.snapshot({ scopeId: 'scope' })
  assert(s.ok)
  assert.equal(s.value.settledMicroUsd, 9000)
  assert.equal(s.value.frozen, true)
  assert.equal(s.value.freezeReason, 'over-bound')
})

test('unproven synthetic terminal billing certificate refuses before reserve', async (t) => {
  const f = setup(t)
  f.syntheticProfile.boundProven = false
  const b = f.boot.custody.bind(f.ports, f.observations)
  assert(b.ok)
  const r = await b.controller.launch(f.request)
  assert.equal(r.ok, false)
  if (!r.ok) assert.equal(r.code, 'WIRE_REFUSED')
  const s = f.ledger.snapshot({ scopeId: 'scope' })
  assert(s.ok)
  assert.equal(s.value.outstandingMicroUsd, 0)
  assert.equal(f.sends(), 0)
})

for (const field of [
  'model',
  'effort',
  'privacy',
  'output-count',
  'tools',
  'structured-output',
] as const)
  test(`synthetic D-port certificate independently rejects final body ${field}`, async (t) => {
    const f = setup(t)
    f.syntheticProfile.transformBody = (body) => {
      if (field === 'model') body.model = 'wrong'
      if (field === 'effort') body.reasoning.effort = 'low'
      if (field === 'privacy') body.provider.zdr = false
      if (field === 'output-count') body.max_tokens = 999
      if (field === 'tools') body.tools = []
      if (field === 'structured-output') body.response_format = { type: 'json_object' }
      return body
    }
    const b = f.boot.custody.bind(f.ports, f.observations)
    assert(b.ok)
    const r = await b.controller.launch(f.request)
    assert.equal(r.ok, false)
    if (!r.ok) assert.equal(r.code, 'WIRE_REFUSED')
    assert.equal(f.sends(), 0)
  })

for (const field of [
  'requestDigest',
  'decisionDigest',
  'wireDigest',
  'policyDigest',
  'configDigest',
  'runtimeDigest',
  'catalogDigest',
  'evidenceDigest',
  'expiresAtUtc',
] as const)
  test(`final revalidation refuses changed ${field} and retains full reservation`, async (t) => {
    const f = setup(t)
    f.ports.revalidate = (current: Fixture) => ({
      accepted: true,
      current: { ...current, [field]: field === 'expiresAtUtc' ? now : 'b'.repeat(64) },
      evaluatedAtUtc: now,
    })
    const b = f.boot.custody.bind(f.ports, f.observations)
    assert(b.ok)
    const r = await b.controller.launch(f.request)
    assert.equal(r.ok, false)
    if (!r.ok) assert.equal(r.code, 'REVALIDATION_REFUSED')
    assert.equal(f.sends(), 0)
    const s = f.ledger.snapshot({ scopeId: 'scope' })
    assert(s.ok)
    assert.equal(s.value.outstandingMicroUsd, 1400)
  })

test('selection capabilities cannot be copied, proxied, or authenticated by another custody', async (t) => {
  const f = setup(t),
    other = createPmcControllerCustodyV1('synthetic-offline')
  assert(other.ok)
  const owner = {
    ...f.owner,
    recordDecision: (claim: object, cap: object) => {
      assert.equal(f.owner.recordDecision(claim, { ...cap }).ok, false)
      assert.equal(f.owner.recordDecision(claim, new Proxy(cap, {})).ok, false)
      assert.deepEqual(
        other.custody.authenticateSelection({} as never, f.request.route.requestDigest, cap),
        { accepted: false },
      )
      return f.owner.recordDecision(claim, cap)
    },
  }
  const b = f.boot.custody.bind({ ...f.ports, owner }, f.observations)
  assert(b.ok)
  assert.equal((await b.controller.launch(f.request)).ok, true)
})

test('prepare failure closes only authenticated never-reserved refusal and cannot reopen initial intent', async (t) => {
  const f = setup(t)
  f.ports.transport.prepare = async () => {
    throw null
  }
  const b = f.boot.custody.bind(f.ports, f.observations)
  assert(b.ok)
  const r = await b.controller.launch(f.request)
  assert.deepEqual(r, { ok: false, code: 'WIRE_REFUSED', receipt: null })
  assert.equal((await b.controller.launch(f.request)).ok, false)
  assert.equal(f.sends(), 0)
})

test('acquisition ancestors cannot expose a bytes alias', async (t) => {
  const f = setup(t)
  f.acquired.catalogSource = f.acquired.catalogInput as never
  const b = f.boot.custody.bind(f.ports, f.observations)
  assert(b.ok)
  const r = await b.controller.launch(f.request)
  assert.equal(r.ok, false)
  if (!r.ok) assert.equal(r.code, 'EVIDENCE_REFUSED')
  assert.equal(f.sends(), 0)
})

test('acquisition byte copy survives later source mutation without caller iteration', async (t) => {
  const f = setup(t)
  let iterated = 0
  class Bytes extends Uint8Array {
    override [Symbol.iterator](): ReturnType<Uint8Array['values']> {
      iterated++
      throw null
    }
  }
  f.acquired.catalogInput.canonicalBytes = new Bytes(f.acquired.catalogInput.canonicalBytes)
  let mutated = false
  f.ports.clock = () => {
    if (!mutated) {
      mutated = true
      f.acquired.catalogInput.canonicalBytes[0] =
        (f.acquired.catalogInput.canonicalBytes[0] ?? 0) ^ 1
    }
    return now
  }
  const b = f.boot.custody.bind(f.ports, f.observations)
  assert(b.ok)
  assert.equal((await b.controller.launch(f.request)).ok, true)
  assert.equal(iterated, 0)
})

for (const kind of ['shared', 'resizable', 'oversize'] as const)
  test(`acquisition ${kind} byte storage refuses before transport`, async (t) => {
    const f = setup(t)
    ;(f.acquired.catalogInput as Fixture).canonicalBytes =
      kind === 'shared'
        ? new Uint8Array(new SharedArrayBuffer(8))
        : kind === 'resizable'
          ? new Uint8Array(Reflect.construct(ArrayBuffer, [8, { maxByteLength: 16 }]))
          : new Uint8Array(8388609)
    const b = f.boot.custody.bind(f.ports, f.observations)
    assert(b.ok)
    const r = await b.controller.launch(f.request)
    assert.equal(r.ok, false)
    if (!r.ok) assert.equal(r.code, 'EVIDENCE_REFUSED')
    assert.equal(f.sends(), 0)
  })

test('revalidation reentrancy is refused by the actual pending owner before a second send', async (t) => {
  const f = setup(t)
  let nested: Promise<unknown> | undefined
  let controller: Extract<ReturnType<typeof f.boot.custody.bind>, { ok: true }>['controller']
  f.ports.revalidate = (current) => {
    nested = controller.launch(f.request)
    return { accepted: true, current, evaluatedAtUtc: now }
  }
  const b = f.boot.custody.bind(f.ports, f.observations)
  assert(b.ok)
  controller = b.controller
  assert.equal((await controller.launch(f.request)).ok, true)
  assert.deepEqual(await nested, { ok: false, code: 'EPISODE_REFUSED', receipt: null })
  assert.equal(f.sends(), 1)
})

test('binding captures descriptors once without freezing caller functions or accepting accessors', () => {
  const f = emptyInstallation(),
    boot = createPmcControllerCustodyV1('synthetic-offline')
  assert(boot.ok)
  assert.equal(Object.isFrozen(f.ports.clock), false)
  assert.equal(boot.custody.bind(f.ports, f.observations).ok, true)
  assert.equal(Object.isFrozen(f.ports.clock), false)
  const second = createPmcControllerCustodyV1('synthetic-offline')
  assert(second.ok)
  let reads = 0
  Object.defineProperty(f.ports, 'clock', {
    enumerable: true,
    get() {
      reads++
      return () => now
    },
  })
  assert.equal(second.custody.bind(f.ports, f.observations).ok, false)
  assert.equal(reads, 0)
})

test('all legacy aliases, pinned lanes and schema near-misses preserve zero-effect priorities', async () => {
  const raw: Fixture = JSON.parse(
    readFileSync(
      new URL('../../routing-policy/tests/fixtures/pmc-resolver-v1.json', import.meta.url),
      'utf8',
    ),
  )
  const request = () => ({
    version: 'pmc-launch/v1',
    intentRef: 'intent',
    route: structuredClone(raw.request),
    payloadJson: '{}',
    override: null,
  })
  const f = emptyInstallation(),
    boot = createPmcControllerCustodyV1('synthetic-offline')
  assert(boot.ok)
  const b = boot.custody.bind(f.ports, f.observations)
  assert(b.ok)
  for (const lane of [
    'L6',
    'routing',
    'classification',
    'structured-decision',
    'jev',
    'Jev',
    'typesafe/jev-1.13',
    'L1',
    'L2',
    'unknown',
  ]) {
    const q = request()
    q.route.lane = lane
    const code =
      lane === 'L1' || lane === 'L2'
        ? 'PINNED_TRANSPORT_REFUSED'
        : lane === 'unknown'
          ? 'INTENT_REFUSED'
          : 'LANE_DISABLED_REFUSED'
    assert.deepEqual(await b.controller.launch(q), { ok: false, code, receipt: null })
  }
  for (const mutate of [
    (q: Fixture) => {
      q.route.subRole = 'invented'
    },
    (q: Fixture) => {
      q.route.routingClass = 'invented'
    },
    (q: Fixture) => {
      q.extra = true
    },
    (q: Fixture) => {
      q.route.requirements.extra = true
    },
    (q: Fixture) => {
      q.route.requirements.toolUse = 1
    },
    (q: Fixture) => {
      q.route.attempt = { kind: 'initial', extra: true }
    },
  ]) {
    const q = request()
    mutate(q)
    assert.deepEqual(await b.controller.launch(q), {
      ok: false,
      code: 'INPUT_REFUSED',
      receipt: null,
    })
  }
  assert.equal(f.effects(), 0)
})

test('reversed authentic header insertion order preserves the declared wire digest', async (t) => {
  const f = setup(t),
    prepare = f.ports.transport.prepare,
    verify = f.ports.transport.verify
  let literalDigest = ''
  f.ports.transport.verify = (w, claims) => {
    // Independent literal JSON layout; no controller key list or object enumeration.
    // Only run-specific owner/decision/body strings are interpolated as JSON strings.
    const j = JSON.stringify
    const literal = `{"version":"pmc-wire/v1","requestDigest":${j(w.requestDigest)},"decisionDigest":${j(w.decisionDigest)},"method":"POST","operationUrl":"https://openrouter.ai/api/v1/chat/completions","protocol":"openai-completions","provider":"openrouter","bindingId":${j(w.bindingId)},"providerModelId":${j(w.providerModelId)},"piHostModelId":${j(w.piHostModelId)},"dataClass":"public","thinkingLevel":"high","wireEffort":"high","data_collection":"deny","zdr":true,"toolUse":false,"structuredOutput":false,"maximumInputTokens":1000,"maximumOutputTokens":200,"body":${j(w.body)},"bodyDigest":${j(w.bodyDigest)},"headers":{"content-type":"application/json","accept":"text/event-stream"}}`
    literalDigest = sha(literal)
    assert.equal(claims.wireDigest, literalDigest)
    return verify(w, claims)
  }
  f.ports.transport.prepare = async (q, d) => {
    const w = await prepare(q, d)
    return { ...w, headers: { accept: 'text/event-stream', 'content-type': 'application/json' } }
  }
  const b = f.boot.custody.bind(f.ports, f.observations)
  assert(b.ok)
  const r = await b.controller.launch(f.request)
  assert.equal(r.ok, true, JSON.stringify(r))
  assert.equal(r.receipt?.wireDigest, literalDigest)
})

test('authentic unknown R1 blocks the preissued second attempt before acquisition', async (t) => {
  const f = setup(t, 'unknown'),
    acquire = f.ports.acquire
  let acquisitions = 0
  f.ports.acquire = () => {
    acquisitions++
    return acquire()
  }
  const b = f.boot.custody.bind(f.ports, f.observations)
  assert(b.ok)
  const r = await b.controller.launch(f.request)
  assert.equal(r.ok, false)
  assert(r.receipt)
  const quality = structuredClone(
    f.acquired.context.bindings.find((v: Fixture) => v.bindingId === 'binding-2').quality,
  )
  f.request.route.requestId = f.ids.requestIds[1]
  f.request.route.attempt = {
    kind: 'fallback',
    priorRequestId: r.receipt.requestId,
    priorDecisionDigest: r.receipt.decisionDigest,
    priorRequestDigest: r.receipt.requestDigest,
    primaryBindingId: 'binding-2',
    priorDisposition: {
      status: 'supplied',
      value: 'uncertain',
      evidence: { ...quality.evidence, evidenceState: 'static-conformance' },
    },
    primaryQuality: quality,
  }
  rebind(f)
  assert.deepEqual(await b.controller.launch(f.request), {
    ok: false,
    code: 'EPISODE_REFUSED',
    receipt: null,
  })
  assert.equal(acquisitions, 1)
  assert.equal(f.sends(), 1)
})

for (const kind of ['throw', 'no-proof', 'copied-proof', 'malformed-observation'] as const)
  test(`${kind} after consume retains actual liability and prevents retry`, async (t) => {
    const f = setup(t)
    if (kind === 'throw')
      f.ports.transport.send = async () => {
        throw new Error('network uncertainty')
      }
    if (kind === 'no-proof')
      f.ports.transport.send = async () => ({ kind: 'uncertain', proof: null }) as never
    if (kind === 'copied-proof')
      f.ports.transport.send = async () => ({ kind: 'terminal', proof: {} })
    if (kind === 'malformed-observation')
      f.observations.observe = () =>
        ({
          accepted: true,
          proofId: 'fake',
          observation: {
            kind: 'response',
            semantic: 'stop',
            charge: { kind: 'known', actualMicroUsd: 0.1 },
          },
        }) as never
    const b = f.boot.custody.bind(f.ports, f.observations)
    assert(b.ok)
    const r = await b.controller.launch(f.request)
    assert.equal(r.ok, false)
    if (!r.ok) assert.equal(r.code, 'SEND_UNCERTAIN')
    const s = f.ledger.snapshot({ scopeId: 'scope' })
    assert(s.ok)
    assert(s.value.outstandingMicroUsd > 0)
    assert.equal(s.value.settledMicroUsd, 0)
    assert.equal((await b.controller.launch(f.request)).ok, false)
  })

test('captured installation permits zero-effect preflight with exact refusal priorities', async () => {
  const boot = createPmcControllerCustodyV1('synthetic-offline')
  assert(boot.ok)
  const installed = emptyInstallation()
  const bound = boot.custody.bind(installed.ports, installed.observations)
  assert(bound.ok)
  const cases: [unknown, string][] = [
    [null, 'INPUT_REFUSED'],
    [{}, 'INTENT_REFUSED'],
    [{ override: 'anything', route: { lane: 'L6' } }, 'BREAK_GLASS_REFUSED'],
    [{ route: { lane: 'L6' } }, 'LANE_DISABLED_REFUSED'],
    [{ intentRef: 'i', route: { lane: 'L4', dataClass: 'internal' } }, 'NONPUBLIC_REFUSED'],
    [{ intentRef: 'i', route: { lane: 'L4', dataClass: 'public' } }, 'VERSION_REFUSED'],
  ]
  for (const [request, code] of cases)
    assert.deepEqual(await bound.controller.launch(request), { ok: false, code, receipt: null })
  assert.equal(installed.effects(), 0)
})

test('custody rejects modes without touching hostile values', () => {
  let reads = 0
  const hostile = new Proxy(
    {},
    {
      get() {
        reads++
        throw null
      },
    },
  )
  assert.deepEqual(createPmcControllerCustodyV1(hostile), {
    ok: false,
    code: 'INSTALLATION_REFUSED',
  })
  assert.equal(reads, 0)
})

test('unbound authenticators refuse and a failed first bind consumes its latch', () => {
  const result = createPmcControllerCustodyV1('synthetic-offline')
  assert(result.ok)
  const custody = result.custody
  assert.deepEqual(custody.authenticateSelection(null as never, '', {}), { accepted: false })
  assert.deepEqual(custody.authenticateCompletion(null as never, null as never, {}), {
    accepted: false,
  })
  assert.deepEqual(custody.bind({}, {}), { ok: false, code: 'INSTALLATION_REFUSED' })
  let reads = 0
  const hostile = new Proxy(
    {},
    {
      ownKeys() {
        reads++
        throw null
      },
    },
  )
  assert.deepEqual(custody.bind(hostile, hostile), { ok: false, code: 'INSTALLATION_REFUSED' })
  assert.equal(reads, 0)
})

for (const [label, bytes, character] of [
  ['ASCII above request UTF16 cap', 262145, 'x'],
  ['ASCII exact byte cap', 1048576, 'x'],
  ['ASCII one byte over', 1048577, 'x'],
  ['multibyte exact byte cap', 1048576, '€'],
  ['multibyte one byte over', 1048577, '€'],
] as const)
  test(`final body independent budget: ${label}`, async (t) => {
    const f = setup(t),
      verify = f.ports.transport.verify
    let verifications = 0,
      preparedBody = ''
    f.syntheticProfile.transformBody = (value) => {
      value.messages[0].content = ''
      const room = bytes - Buffer.byteLength(JSON.stringify(value), 'utf8')
      const width = Buffer.byteLength(character, 'utf8')
      value.messages[0].content =
        character.repeat(Math.floor(room / width)) + 'x'.repeat(room % width)
      preparedBody = JSON.stringify(value)
      return value
    }
    f.ports.transport.verify = (wire, claims) => {
      verifications++
      assert.equal(Buffer.byteLength(wire.body, 'utf8'), bytes)
      return verify(wire, claims)
    }
    const b = f.boot.custody.bind(f.ports, f.observations)
    assert(b.ok)
    const result = await b.controller.launch(f.request)
    // Assert outside the captured prepare boundary so an assertion throw cannot
    // masquerade as the expected one-over refusal.
    assert.equal(Buffer.byteLength(preparedBody, 'utf8'), bytes)
    assert(preparedBody.length > 262144)
    if (bytes <= 1048576) {
      assert.equal(result.ok, true, JSON.stringify(result))
      assert.equal(result.receipt?.disposition, 'succeeded')
      assert.equal(verifications, 2)
      assert.equal(f.sends(), 1)
    } else {
      assert.deepEqual(result, { ok: false, code: 'WIRE_REFUSED', receipt: null })
      assert.equal(verifications, 0)
      assert.equal(f.sends(), 0)
      const snapshot = f.ledger.snapshot({ scopeId: 'scope' })
      assert(snapshot.ok)
      assert.equal(snapshot.value.outstandingMicroUsd, 0)
    }
  })

for (const dimension of ['string', 'aggregate', 'nodes'] as const)
  test(`final body exception preserves ordinary wire metadata ${dimension} budget`, async (t) => {
    for (const over of [false, true]) {
      const f = setup(t),
        prepare = f.ports.transport.prepare
      let reached = 0,
        verifications = 0,
        measuredBudget = 0
      // Invalid headers are intentional: a terminal capture sentinel distinguishes
      // the ordinary bound from later closed-schema rejection without a public port.
      f.ports.transport.prepare = async (q, d) => {
        const w = await prepare(q, d)
        const metadata: Fixture = {}
        w.headers = metadata
        const units = (v: Fixture): number =>
          typeof v === 'string'
            ? v.length
            : v && typeof v === 'object'
              ? Object.entries(v).reduce((n, [k, x]) => n + k.length + units(x), 0)
              : 0
        const nodes = (v: Fixture): number =>
          v && typeof v === 'object'
            ? 1 +
              Reflect.ownKeys(v).reduce<number>(
                (n, k) =>
                  n +
                  1 +
                  (Array.isArray(v) && k === 'length'
                    ? 0
                    : nodes(Object.getOwnPropertyDescriptor(v, k)?.value)),
                0,
              )
            : 1
        if (dimension === 'string') metadata.body = 'x'.repeat(2048 + Number(over))
        if (dimension === 'aggregate') for (let i = 0; i < 513; i++) metadata[`s${i}`] = ''
        if (dimension === 'nodes') for (let i = 0; i < 32700; i++) metadata[`n${i}`] = null
        metadata.sentinel = {}
        const { boundProof: _proof, ...ordinary } = w
        if (dimension === 'aggregate') {
          // Count the body key, but exclude only its value from string units.
          let left = 1048576 - units({ ...ordinary, body: '' })
          for (let i = 0; i < 513; i++) {
            const count = Math.min(left, 2048)
            metadata[`s${i}`] = 'x'.repeat(count)
            left -= count
          }
          assert.equal(left, 0)
          metadata.s512 += over ? 'x' : ''
          assert.equal(units({ ...ordinary, body: '' }), 1048576 + Number(over))
        }
        if (dimension === 'nodes') {
          // Add nodes in pairs; an empty array contributes one extra length key.
          delete metadata.sentinel
          const pairs = (65535 - nodes({ ...ordinary, headers: { ...metadata, sentinel: {} } })) / 2
          assert(Number.isInteger(pairs))
          for (let i = 0; i < pairs; i++) metadata[`n${32700 + i}`] = null
          metadata.n0 = []
          if (over) metadata.n1 = []
          metadata.sentinel = {}
          assert.equal(nodes(ordinary), 65536 + Number(over))
        }
        measuredBudget =
          dimension === 'string'
            ? metadata.body.length
            : dimension === 'aggregate'
              ? units({ ...ordinary, body: '' })
              : nodes(ordinary)
        metadata.sentinel = new Proxy(
          {},
          {
            ownKeys() {
              reached++
              throw null
            },
          },
        )
        return w
      }
      f.ports.transport.verify = () => {
        verifications++
        return { accepted: false }
      }
      const b = f.boot.custody.bind(f.ports, f.observations)
      assert(b.ok)
      assert.deepEqual(await b.controller.launch(f.request), {
        ok: false,
        code: 'WIRE_REFUSED',
        receipt: null,
      })
      assert.equal(
        measuredBudget,
        (dimension === 'string' ? 2048 : dimension === 'aggregate' ? 1048576 : 65536) +
          Number(over),
      )
      assert.equal(reached, over ? 0 : 1)
      assert.equal(verifications, 0)
      assert.equal(f.sends(), 0)
    }
  })

test('wire-only body exception does not exempt top-level or nested request body strings', async () => {
  const f = emptyInstallation(),
    boot = createPmcControllerCustodyV1('synthetic-offline')
  assert(boot.ok)
  const b = boot.custody.bind(f.ports, f.observations)
  assert(b.ok)
  for (const value of [
    { body: 'x'.repeat(2049) },
    { nested: { body: 'x'.repeat(2049) } },
    { payloadJson: 'x'.repeat(262145) },
  ])
    assert.deepEqual(await b.controller.launch({ override: 'requested', ...value }), {
      ok: false,
      code: 'BOUNDS_REFUSED',
      receipt: null,
    })
  assert.equal(f.effects(), 0)
})
