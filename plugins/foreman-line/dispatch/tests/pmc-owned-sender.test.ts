import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { EventEmitter } from 'node:events'
import { mkdtempSync, realpathSync, rmSync } from 'node:fs'
import https from 'node:https'
import { syncBuiltinESMExports } from 'node:module'
import net from 'node:net'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { test } from 'node:test'
import type { Observation } from '../src/pmc-launch/controller-types.js'
import { createLocalPmcLedger, initializeLocalPmcLedger } from '../src/pmc-launch/ledger.js'
import { computePmcCostV1 } from '../src/pmc-launch/money.js'
import {
  createOwnedHttpsSenderV1,
  createTerminalObservationRegistryV1,
} from '../src/pmc-launch/owned-https-sender.js'

const profile = {
  responseModel: 'fixture/model',
  responseProvider: 'Fixture',
  maximumInputTokens: 100,
  maximumOutputTokens: 20,
  cacheAllowed: false,
}
const response =
  'data: {"id":"r","object":"chat.completion.chunk","model":"fixture/model","choices":[{"index":0,"delta":{"content":"ok"},"finish_reason":"stop"}]}\n\n' +
  'data: {"id":"r","object":"chat.completion.chunk","model":"fixture/model","choices":[],"usage":{"prompt_tokens":1,"completion_tokens":1,"total_tokens":2,"cost":0.000002}}\n\ndata: [DONE]\n\n'
test('owned HTTPS makes one fixed request with retained body and post-consume credential', async (t) => {
  let constructors = 0,
    writes = 0,
    ends = 0,
    credentials = 0
  t.mock.method(net.Socket.prototype, 'connect', () => {
    throw new Error('NO_NETWORK')
  })
  t.mock.method(
    https,
    'request',
    (options: Record<string, unknown>, callback: (r: unknown) => void) => {
      constructors++
      assert.equal(credentials, 1)
      assert.equal(options.hostname, 'openrouter.ai')
      assert.equal(options.path, '/api/v1/chat/completions')
      assert.equal(options.method, 'POST')
      assert.equal(options.agent, false)
      assert.equal(options.maxHeaderSize, 16384)
      assert.deepEqual(options.headers, {
        'content-type': 'application/json',
        accept: 'text/event-stream',
        authorization: 'Bearer fixture-only-token',
        'content-length': 2,
      })
      const req = new EventEmitter()
      Object.assign(req, {
        destroy: () => {},
        write: (b: Uint8Array) => {
          writes++
          assert.equal(Buffer.from(b).toString(), '{}')
        },
        end: () => {
          ends++
          queueMicrotask(() => {
            const res = new EventEmitter()
            Object.assign(res, {
              statusCode: 200,
              headers: { 'content-type': 'text/event-stream' },
              complete: true,
              destroy: () => {},
              resume: () => {
                queueMicrotask(() => {
                  res.emit('data', Buffer.from(response))
                  res.emit('end')
                  res.emit('close')
                })
              },
            })
            callback(res)
          })
        },
      })
      return req
    },
  )
  syncBuiltinESMExports()
  t.after(() => {
    t.mock.restoreAll()
    syncBuiltinESMExports()
  })
  const send = createOwnedHttpsSenderV1(
    '{}',
    profile,
    () => {
      credentials++
      return 'fixture-only-token'
    },
    new AbortController().signal,
  )
  assert.equal(credentials, 0)
  const result = await send()
  assert.equal(result.stream?.text, 'ok')
  assert.deepEqual(result.observation, {
    kind: 'response',
    semantic: 'stop',
    charge: { kind: 'known', actualMicroUsd: 2 },
  })
  await send()
  assert.deepEqual(
    { constructors, writes, ends, credentials },
    { constructors: 1, writes: 1, ends: 1, credentials: 1 },
  )
})
test('abort/missing credential before constructor is no-send, constructor throw is uncertain', async (t) => {
  let constructors = 0
  t.mock.method(https, 'request', () => {
    constructors++
    throw new Error('PRIVATE_CONSTRUCTOR_ERROR')
  })
  syncBuiltinESMExports()
  t.after(() => {
    t.mock.restoreAll()
    syncBuiltinESMExports()
  })
  const aborted = new AbortController()
  aborted.abort()
  assert.deepEqual(
    (
      await createOwnedHttpsSenderV1(
        '{}',
        profile,
        () => {
          throw new Error('MUST_NOT_READ')
        },
        aborted.signal,
      )()
    ).observation,
    { kind: 'no-send', code: 'ABORTED' },
  )
  assert.deepEqual(
    (await createOwnedHttpsSenderV1('{}', profile, () => undefined, new AbortController().signal)())
      .observation,
    { kind: 'no-send', code: 'CREDENTIAL_REFUSED' },
  )
  assert.equal(constructors, 0)
  assert.deepEqual(
    (
      await createOwnedHttpsSenderV1(
        '{}',
        profile,
        () => 'fixture-only',
        new AbortController().signal,
      )()
    ).observation,
    { kind: 'uncertain', code: 'HTTP_UNCERTAIN' },
  )
  assert.equal(constructors, 1)
})

test('observation registry requires direct C observation and exact state-aware replay', () => {
  const registry = createTerminalObservationRegistryV1(() => '2026-09-26T12:00:02.000Z')
  const proof = Object.freeze({}),
    route = {},
    decision = {},
    wire = {}
  const consumed = {
    ledgerId: 'l',
    epoch: 'e',
    requestId: 'r',
    scopeId: 's',
    requestDigest: 'a'.repeat(64),
    costValueDigest: 'b'.repeat(64),
    maximumMicroUsd: 10,
    state: 'consumed',
    actualMicroUsd: null,
    proofRef: null,
    proofDigest: null,
    createdAtUtc: '2026-09-26T12:00:00.000Z',
    updatedAtUtc: '2026-09-26T12:00:01.000Z',
  } as const
  const registered = registry.register(proof, route, decision, wire, consumed, {
    kind: 'response',
    semantic: 'stop',
    charge: { kind: 'known', actualMicroUsd: 2 },
  })
  assert(registered.accepted)
  assert.deepEqual(registry.authenticateSettlement(consumed, { proofId: registered.proofId }), {
    accepted: false,
  })
  assert.deepEqual(registry.observe({}, {}, { request: { route }, decision, wire, consumed }), {
    accepted: false,
  })
  assert.deepEqual(
    registry.observe(proof, {}, { request: { route }, decision, wire: {}, consumed }),
    { accepted: false },
  )
  const invocation = {}
  assert.equal(
    registry.observe(proof, invocation, { request: { route }, decision, wire, consumed }).accepted,
    true,
  )
  const observed = registry.authenticateSettlement(consumed, { proofId: registered.proofId })
  assert(observed.accepted)
  assert.deepEqual(registry.authenticateNoSendProof(consumed, { proofId: registered.proofId }), {
    accepted: false,
  })
  const terminal = {
    ...consumed,
    state: 'settled',
    actualMicroUsd: 2,
    proofRef: observed.proofRef,
    proofDigest: observed.proofDigest,
    updatedAtUtc: '2026-09-26T12:00:02.000Z',
  }
  assert.equal(
    registry.authenticateSettlement(terminal, { proofId: registered.proofId }).accepted,
    true,
  )
  for (const delta of [
    { state: 'cancelled' },
    { actualMicroUsd: 0 },
    { proofRef: 'other' },
    { proofDigest: 'c'.repeat(64) },
    { createdAtUtc: '2026-09-26T11:00:00.000Z' },
    { updatedAtUtc: '2026-09-26T13:00:00.000Z' },
  ])
    assert.deepEqual(
      registry.authenticateSettlement({ ...terminal, ...delta }, { proofId: registered.proofId }),
      { accepted: false },
    )
  assert.deepEqual(registry.observe(proof, {}, { request: { route }, decision, wire, consumed }), {
    accepted: false,
  })
})

for (const mode of ['unknown', 'no-send'] as const)
  test(`registry ${mode} state-aware terminal replay`, () => {
    const registry = createTerminalObservationRegistryV1(() => '2026-09-26T12:00:02.000Z')
    const proof = Object.freeze({}),
      route = {},
      decision = {},
      wire = {},
      invocation = {}
    const consumed = {
      ledgerId: 'l',
      epoch: 'e',
      requestId: 'r',
      scopeId: 's',
      requestDigest: 'a'.repeat(64),
      costValueDigest: 'b'.repeat(64),
      maximumMicroUsd: 10,
      state: 'consumed',
      actualMicroUsd: null,
      proofRef: null,
      proofDigest: null,
      createdAtUtc: '2026-09-26T12:00:00.000Z',
      updatedAtUtc: '2026-09-26T12:00:01.000Z',
    }
    const registered = registry.register(
      proof,
      route,
      decision,
      wire,
      consumed,
      mode === 'unknown'
        ? { kind: 'response', semantic: 'stop', charge: { kind: 'unknown', reason: 'precision' } }
        : { kind: 'no-send', code: 'CREDENTIAL_REFUSED' },
    )
    assert(registered.accepted)
    assert.equal(
      registry.observe(proof, invocation, { request: { route }, decision, wire, consumed })
        .accepted,
      true,
    )
    const authenticate =
      mode === 'unknown' ? registry.authenticateSettlement : registry.authenticateNoSendProof
    const first = authenticate(consumed, { proofId: registered.proofId })
    assert(first.accepted)
    const terminal = {
      ...consumed,
      state: mode === 'unknown' ? 'uncertain' : 'cancelled',
      proofRef: first.proofRef,
      proofDigest: first.proofDigest,
      updatedAtUtc: '2026-09-26T12:00:02.000Z',
    }
    assert.deepEqual(authenticate(terminal, { proofId: registered.proofId }), first)
    for (const delta of [
      { state: 'settled' },
      { actualMicroUsd: 0 },
      { proofRef: 'other' },
      { proofDigest: 'f'.repeat(64) },
      { updatedAtUtc: '2026-09-26T12:00:03.000Z' },
    ])
      assert.deepEqual(authenticate({ ...terminal, ...delta }, { proofId: registered.proofId }), {
        accepted: false,
      })
  })

const replayDigest = 'a'.repeat(64)
const replayScope = {
  scopeId: 'scope',
  authorityDigest: replayDigest,
  currency: 'USD',
  authorizedLimitMicroUsd: 10,
  workflowId: 'workflow',
  accountId: 'account',
  routingClass: 'implementation/standard',
}
const replayPrice = computePmcCostV1({
  version: 'pmc-price/v1',
  currency: 'USD',
  requestDigest: replayDigest,
  identity: { bindingId: 'binding', provider: 'openrouter', providerModelId: 'model' },
  sourceProfileId: 'profile',
  sourceProfileVersion: '1',
  sourceProfileDigest: replayDigest,
  tariffDigest: replayDigest,
  priceEvidenceDigest: replayDigest,
  inputRate: { value: '0.000006', unit: 'USD per token' },
  outputRate: { value: '0', unit: 'USD per token' },
  perRequestFeeUsd: '0',
  otherFees: 'none-attested',
  maximumInputTokens: 1,
  maximumOutputTokens: 0,
  rankingTokens: { input: 1, output: 0 },
})
assert(replayPrice.ok)

for (const mode of ['known', 'unknown', 'no-send'] as const)
  test(`actual SQLite ledger replays the same ${mode} proof`, () => {
    const temp = realpathSync(tmpdir())
    const root = mkdtempSync(join(temp, 'pmc-d-replay-'))
    const now = '2026-09-26T12:00:02.000Z'
    const clock = () => now
    try {
      const initialized = initializeLocalPmcLedger(
        {
          root,
          ledgerId: 'ledger',
          epoch: 'epoch',
          initializationAuthorityDigest: replayDigest,
          scopes: [replayScope],
        },
        {
          clock,
          authenticateInitialization: (request) => ({
            accepted: true,
            ledgerId: request.ledgerId,
            epoch: request.epoch,
            initializationAuthorityDigest: request.initializationAuthorityDigest,
            scopesDigest: createHash('sha256').update(JSON.stringify(request.scopes)).digest('hex'),
          }),
        },
      )
      assert(initialized.ok)
      const registry = createTerminalObservationRegistryV1(clock)
      const ledger = createLocalPmcLedger(
        {
          root,
          expectedLedgerId: 'ledger',
          expectedEpoch: 'epoch',
          expectedInitializationAuthorityDigest: replayDigest,
        },
        {
          clock,
          authenticateNoSendProof: registry.authenticateNoSendProof,
          authenticateSettlement: registry.authenticateSettlement,
        },
      )
      assert(ledger.ok)
      const reserved = ledger.value.reserve({
        requestId: 'request',
        scopeId: 'scope',
        requestDigest: replayDigest,
        costValue: replayPrice.value,
        priceEvidence: replayPrice.priceEvidence,
      })
      assert(reserved.ok)
      const consumed = ledger.value.consume({ requestId: 'request', requestDigest: replayDigest })
      assert(consumed.ok)
      const proof = Object.freeze({})
      const route = {}
      const decision = {}
      const wire = {}
      const invocation = {}
      const observation: Observation =
        mode === 'no-send'
          ? ({ kind: 'no-send', code: 'CREDENTIAL_REFUSED' } as const)
          : ({
              kind: 'response',
              semantic: 'stop',
              charge:
                mode === 'known'
                  ? { kind: 'known', actualMicroUsd: 3 }
                  : { kind: 'unknown', reason: 'precision' },
            } as const)
      const registered = registry.register(
        proof,
        route,
        decision,
        wire,
        consumed.value,
        observation,
      )
      assert(registered.accepted)
      assert(
        registry.observe(proof, invocation, {
          request: { route },
          decision,
          wire,
          consumed: consumed.value,
        }).accepted,
      )
      const request = { requestId: 'request', requestDigest: replayDigest }
      const replay = () =>
        mode === 'no-send'
          ? ledger.value.cancelWithNoSendProof({
              ...request,
              proof: { proofId: registered.proofId },
            })
          : ledger.value.settle({
              ...request,
              observation: { proofId: registered.proofId },
            })
      const first = replay()
      assert(first.ok)
      assert.deepEqual(replay(), first)

      if (mode === 'known') {
        const file = join(root, 'pmc-budget-v1.sqlite')
        const tamper = (sql: string, ...args: (string | number | null)[]) => {
          const db = new DatabaseSync(file)
          try {
            db.prepare(sql).run(...args)
          } finally {
            db.close()
          }
          const refused = replay()
          assert.equal(refused.ok, false)
          const restore = new DatabaseSync(file)
          try {
            restore
              .prepare(
                'UPDATE attempts SET state=?,actualMicroUsd=?,proofRef=?,proofDigest=?,updatedAtUtc=? WHERE requestId=?',
              )
              .run(
                first.value.state,
                first.value.actualMicroUsd,
                first.value.proofRef,
                first.value.proofDigest,
                first.value.updatedAtUtc,
                'request',
              )
          } finally {
            restore.close()
          }
        }
        tamper(
          "UPDATE attempts SET state='uncertain',actualMicroUsd=NULL WHERE requestId=?",
          'request',
        )
        tamper('UPDATE attempts SET actualMicroUsd=? WHERE requestId=?', 4, 'request')
        tamper("UPDATE attempts SET proofRef='tampered' WHERE requestId=?", 'request')
        tamper('UPDATE attempts SET proofDigest=? WHERE requestId=?', 'c'.repeat(64), 'request')
        tamper(
          "UPDATE attempts SET updatedAtUtc='2026-09-26T12:00:03.000Z' WHERE requestId=?",
          'request',
        )
      }
    } finally {
      assert.equal(dirname(realpathSync(root)), temp)
      rmSync(root, { recursive: true, force: true })
    }
  })

for (const mode of [
  'redirect',
  'encoding',
  'incomplete',
  'request-error',
  'response-error',
  'close',
  'write-throw',
  'end-throw',
  'hook-throw',
  'abort',
] as const)
  test(`actual sender ${mode} boundary`, async (t) => {
    let constructors = 0,
      destructions = 0
    const abort = new AbortController()
    t.mock.method(net.Socket.prototype, 'connect', () => {
      throw new Error('NETWORK_DISABLED')
    })
    t.mock.method(https, 'request', (_options: unknown, callback: (r: unknown) => void) => {
      constructors++
      const req = new EventEmitter()
      Object.assign(req, {
        destroy: () => {
          destructions++
        },
        write: () => {
          if (mode === 'write-throw') throw new Error('WRITE')
        },
        end: () => {
          if (mode === 'end-throw') throw new Error('END')
          queueMicrotask(() => {
            if (mode === 'request-error') {
              req.emit('error', new Error('REQUEST'))
              return
            }
            if (mode === 'abort') {
              abort.abort()
              return
            }
            const res = new EventEmitter()
            Object.assign(res, {
              statusCode: mode === 'redirect' ? 302 : 200,
              headers:
                mode === 'encoding'
                  ? { 'content-type': 'text/event-stream', 'content-encoding': 'gzip' }
                  : { 'content-type': 'text/event-stream' },
              complete: mode !== 'incomplete',
              destroy: () => {
                destructions++
              },
              resume: () =>
                queueMicrotask(() => {
                  if (mode === 'response-error') {
                    res.emit('error', new Error('RESPONSE'))
                    return
                  }
                  if (mode === 'close') {
                    res.emit('close')
                    return
                  }
                  res.emit('data', Buffer.from(response))
                  res.emit('end')
                  res.emit('close')
                }),
            })
            callback(res)
          })
        },
      })
      return req
    })
    syncBuiltinESMExports()
    t.after(() => {
      t.mock.restoreAll()
      syncBuiltinESMExports()
    })
    const result = await createOwnedHttpsSenderV1(
      '{}',
      profile,
      () => 'fixture-only',
      abort.signal,
      () => {
        if (mode === 'hook-throw') throw new Error('HOOK')
      },
    )()
    assert.equal(constructors, 1)
    assert(destructions >= 1)
    if (mode === 'hook-throw')
      assert.deepEqual(result.observation, {
        kind: 'response',
        semantic: 'failed',
        charge: { kind: 'known', actualMicroUsd: 2 },
      })
    else assert.equal(result.observation.kind, 'uncertain')
  })
