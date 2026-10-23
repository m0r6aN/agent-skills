import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import type { ClientRequest, IncomingMessage } from 'node:http'
import { createRequire, syncBuiltinESMExports } from 'node:module'
import type { TestContext } from 'node:test'
import { after, before, test } from 'node:test'
import { createOpenCodeGoSenderV1 } from '../src/pmc-launch/opencode-go-sender.js'
import {
  createOpenCodeGoWireV1,
  type OpenCodeGoPrepared,
} from '../src/pmc-launch/opencode-go-wire.js'

const require = createRequire(import.meta.url)
const https = require('node:https') as { request: (...args: unknown[]) => unknown }
const net = require('node:net') as {
  Socket: { prototype: { connect: (...args: unknown[]) => unknown } }
}
const tls = require('node:tls') as { connect: (...args: unknown[]) => unknown }
const nativeRequest = https.request
const nativeSocketConnect = net.Socket.prototype.connect
const nativeTlsConnect = tls.connect
const tripwireError = new Error('NETWORK_DENIED_BY_TEST_TRIPWIRE')
const deniedConnect = () => {
  throw tripwireError
}
before(() => {
  net.Socket.prototype.connect = deniedConnect
  tls.connect = deniedConnect
  syncBuiltinESMExports()
})
after(() => {
  https.request = nativeRequest
  net.Socket.prototype.connect = nativeSocketConnect
  tls.connect = nativeTlsConnect
  syncBuiltinESMExports()
})
const input = () => ({
  version: 'opencode-go-no-tools-wire/v1',
  requestDigest: 'a'.repeat(64),
  decisionDigest: 'b'.repeat(64),
  sessionId: 's-1',
  system: 'sys',
  user: 'hello',
})

function fakeResponse(statusCode: number, data: string): EventEmitter & IncomingMessage {
  const response = Object.assign(new EventEmitter(), {
    statusCode,
    headers: { 'content-type': 'application/json' },
    destroyed: false,
  })
  Object.assign(response, {
    destroy: () => {
      response.destroyed = true
      response.emit('close')
    },
  })
  queueMicrotask(() => {
    response.emit('data', Buffer.from(data))
    response.emit('end')
  })
  return response as EventEmitter & IncomingMessage
}

async function sendResponseBody(raw: string, t: TestContext) {
  const old = https.request
  t.after(() => {
    https.request = old
    syncBuiltinESMExports()
  })
  https.request = (...args: unknown[]) => {
    const req = Object.assign(new EventEmitter(), { destroyed: false })
    Object.assign(req, {
      end() {
        ;(args[2] as (r: IncomingMessage) => void)(fakeResponse(200, raw))
      },
      destroy: () => {
        req.destroyed = true
        req.emit('close')
      },
    })
    return req
  }
  syncBuiltinESMExports()
  const wire = createOpenCodeGoWireV1()
  const prepared = wire.prepare(input())
  if (!prepared.ok) throw new Error('fixture refused')
  return createOpenCodeGoSenderV1({ credential: () => 'fake', wire }).send(prepared.prepared)
}

function encodedResponse(model: string, choices: unknown[], usage?: unknown): string {
  return JSON.stringify({ model, choices, ...(usage === undefined ? {} : { usage }) })
}

const goodChoice = {
  index: 0,
  message: { role: 'assistant', content: 'candidate' },
  finish_reason: 'stop',
}
const goodUsage = { prompt_tokens: 1, completion_tokens: 2, total_tokens: 3 }
const rejectedResponses: ReadonlyArray<readonly [string, string]> = [
  ['wrong model', encodedResponse('other-model', [goodChoice], goodUsage)],
  ['multiple choices', encodedResponse('mimo-v2.6-pro', [goodChoice, goodChoice], goodUsage)],
  [
    'tool calls',
    encodedResponse(
      'mimo-v2.6-pro',
      [{ ...goodChoice, message: { ...goodChoice.message, tool_calls: [{ id: 'tool-1' }] } }],
      goodUsage,
    ),
  ],
  [
    'completion above configured maximum',
    encodedResponse('mimo-v2.6-pro', [goodChoice], {
      prompt_tokens: 1,
      completion_tokens: 1025,
      total_tokens: 1026,
    }),
  ],
  [
    'reasoning above completion',
    encodedResponse('mimo-v2.6-pro', [goodChoice], {
      ...goodUsage,
      completion_tokens_details: { reasoning_tokens: 3 },
    }),
  ],
  [
    'inconsistent total',
    encodedResponse('mimo-v2.6-pro', [goodChoice], { ...goodUsage, total_tokens: 4 }),
  ],
  [
    'duplicate decoded keys',
    '{"model":"mimo-v2.6-pro","model":"mimo-v2.6-pro","choices":[{"index":0,"message":{"role":"assistant","content":"x"},"finish_reason":"stop"}]}',
  ],
  [
    'malformed Unicode escape',
    '{"model":"mimo-v2.6-pro","choices":[{"index":0,"message":{"role":"assistant","content":"\\ud800"},"finish_reason":"stop"}]}',
  ],
  [
    'nonfinite usage number',
    '{"model":"mimo-v2.6-pro","choices":[{"index":0,"message":{"role":"assistant","content":"x"},"finish_reason":"stop"}],"usage":{"prompt_tokens":NaN,"completion_tokens":2,"total_tokens":3}}',
  ],
  [
    'rounded prompt count fraction',
    '{"model":"mimo-v2.6-pro","choices":[{"index":0,"message":{"role":"assistant","content":"x"},"finish_reason":"stop"}],"usage":{"prompt_tokens":1.00000000000000001,"completion_tokens":2,"total_tokens":3}}',
  ],
  [
    'rounded completion count fraction',
    '{"model":"mimo-v2.6-pro","choices":[{"index":0,"message":{"role":"assistant","content":"x"},"finish_reason":"stop"}],"usage":{"prompt_tokens":1,"completion_tokens":2.00000000000000001,"total_tokens":3}}',
  ],
  [
    'rounded total count fraction',
    '{"model":"mimo-v2.6-pro","choices":[{"index":0,"message":{"role":"assistant","content":"x"},"finish_reason":"stop"}],"usage":{"prompt_tokens":1,"completion_tokens":2,"total_tokens":3.00000000000000001}}',
  ],
  [
    'rounded reasoning count fraction',
    '{"model":"mimo-v2.6-pro","choices":[{"index":0,"message":{"role":"assistant","content":"x"},"finish_reason":"stop"}],"usage":{"prompt_tokens":1,"completion_tokens":2,"total_tokens":3,"completion_tokens_details":{"reasoning_tokens":1.00000000000000001}}}',
  ],
]
for (const [label, raw] of rejectedResponses) {
  test(`response parser rejects ${label}`, async (t) => {
    const result = await sendResponseBody(raw, t)
    assert.equal(result.state, 'uncertain')
  })
}

test('native socket tripwire blocks an HTTPS request that bypasses the mock', async () => {
  https.request = nativeRequest
  syncBuiltinESMExports()
  let blockedSynchronously = false
  let blockedAsynchronously: Promise<string> | undefined
  try {
    const request = https.request('https://127.0.0.1:9/blocked', {
      method: 'POST',
    }) as ClientRequest
    blockedAsynchronously = new Promise<string>((resolve, reject) => {
      request.once('error', (error: Error) => resolve(error.message))
      request.end('tripwire probe')
      setTimeout(() => reject(new Error('network tripwire was not reached')), 2_000).unref()
    })
  } catch (error) {
    blockedSynchronously = error === tripwireError
  }
  if (blockedSynchronously) assert.equal(blockedSynchronously, true)
  else {
    assert.ok(blockedAsynchronously)
    try {
      assert.match(await blockedAsynchronously, /NETWORK_DENIED_BY_TEST_TRIPWIRE/)
    } catch (error) {
      assert.equal(error, tripwireError)
    }
  }
})

test('sender has a single exact 120000ms exposed deadline and cleans up while a second call is refused', async (t) => {
  const oldRequest = https.request
  const oldSetTimeout = globalThis.setTimeout
  const oldClearTimeout = globalThis.clearTimeout
  t.after(() => {
    https.request = oldRequest
    globalThis.setTimeout = oldSetTimeout
    globalThis.clearTimeout = oldClearTimeout
    syncBuiltinESMExports()
  })
  let requests = 0
  let credentials = 0
  let deadlineMs: number | undefined
  let runDeadline: (() => void) | undefined
  let clearCalled = false
  const fakeTimer = {} as NodeJS.Timeout
  globalThis.setTimeout = ((callback: () => void, delay?: number) => {
    deadlineMs = delay
    runDeadline = callback
    return fakeTimer
  }) as typeof globalThis.setTimeout
  globalThis.clearTimeout = ((timer?: NodeJS.Timeout) => {
    clearCalled = timer === fakeTimer
  }) as typeof globalThis.clearTimeout
  let request: (EventEmitter & { destroyed: boolean }) | undefined
  https.request = () => {
    requests++
    request = Object.assign(new EventEmitter(), { destroyed: false })
    Object.assign(request, {
      end() {},
      destroy: () => {
        if (!request) return
        request.destroyed = true
        request.emit('close')
      },
    })
    return request
  }
  syncBuiltinESMExports()
  const wire = createOpenCodeGoWireV1()
  const prepared = wire.prepare(input())
  if (!prepared.ok) throw new Error('fixture refused')
  const sender = createOpenCodeGoSenderV1({
    credential: () => {
      credentials++
      return 'fake'
    },
    wire,
  })
  const pending = sender.send(prepared.prepared)
  assert.equal((await sender.send(prepared.prepared)).state, 'no-send')
  assert.equal(requests, 1)
  assert.equal(credentials, 1)
  assert.equal(deadlineMs, 120_000)
  assert.ok(runDeadline)
  if (!runDeadline) throw new Error('deadline callback missing')
  runDeadline()
  const result = await pending
  assert.equal(result.state, 'uncertain')
  assert.equal(result.code, 'HTTP_UNCERTAIN')
  assert.equal(clearCalled, true)
  assert.equal(request?.listenerCount('error'), 0)
  assert.equal(request?.listenerCount('close'), 0)
})

test('sender constructs one fixed HTTPS request and accepts a bounded stop response', async (t) => {
  const old = https.request
  t.after(() => {
    https.request = old
    syncBuiltinESMExports()
  })
  let count = 0
  let captured: unknown[] = []
  let body = ''
  https.request = (...args: unknown[]) => {
    count++
    captured = args
    const req = Object.assign(new EventEmitter(), { destroyed: false })
    Object.assign(req, {
      end(value: Buffer) {
        body = value.toString('utf8')
        ;(args[2] as (r: IncomingMessage) => void)(
          fakeResponse(
            200,
            JSON.stringify({
              model: 'mimo-v2.6-pro',
              choices: [
                {
                  index: 0,
                  message: { role: 'assistant', content: 'candidate' },
                  finish_reason: 'stop',
                },
              ],
              usage: { prompt_tokens: 3, completion_tokens: 2, total_tokens: 5 },
            }),
          ),
        )
      },
      destroy: () => {
        req.destroyed = true
        req.emit('close')
      },
    })
    return req
  }
  syncBuiltinESMExports()
  const wire = createOpenCodeGoWireV1()
  const callerInput = input()
  const prepared = wire.prepare(callerInput)
  if (!prepared.ok) throw new Error('fixture refused')
  callerInput.user = 'caller mutation after prepare'
  const sender = createOpenCodeGoSenderV1({ credential: () => 'fake-secret', wire })
  const result = await sender.send(prepared.prepared)
  assert.equal(result.state, 'response')
  assert.equal(result.semantic, 'stop')
  assert.equal(count, 1)
  assert.equal(captured[0], 'https://opencode.ai/inference/go/openai/v1/chat/completions')
  assert.deepEqual(captured[1], {
    method: 'POST',
    headers: (captured[1] as { headers: unknown }).headers,
    agent: false,
    rejectUnauthorized: true,
    maxHeaderSize: 8192,
  })
  assert.deepEqual(JSON.parse(body), {
    model: 'mimo-v2.6-pro',
    messages: [
      { role: 'system', content: 'sys' },
      { role: 'user', content: 'hello' },
    ],
    stream: false,
    max_completion_tokens: 1024,
    thinking: { type: 'disabled' },
  })
  assert.deepEqual((captured[1] as { headers: unknown }).headers, {
    accept: 'application/json',
    'content-type': 'application/json',
    'user-agent': 'foreman-line-opencode-go/1',
    'x-opencode-session': 's-1',
    authorization: 'Bearer fake-secret',
    'content-length': String(
      Buffer.byteLength(
        JSON.stringify({
          model: 'mimo-v2.6-pro',
          messages: [
            { role: 'system', content: 'sys' },
            { role: 'user', content: 'hello' },
          ],
          stream: false,
          max_completion_tokens: 1024,
          thinking: { type: 'disabled' },
        }),
      ),
    ),
  })
  assert.equal((await sender.send(prepared.prepared)).state, 'no-send')
  assert.equal(count, 1)
})

test('pre-abort and credential refusal make no HTTPS constructor call', async (t) => {
  const old = https.request
  t.after(() => {
    https.request = old
    syncBuiltinESMExports()
  })
  let count = 0
  https.request = () => {
    count++
    throw new Error('unexpected')
  }
  syncBuiltinESMExports()
  const wire = createOpenCodeGoWireV1()
  const prepared = wire.prepare(input())
  if (!prepared.ok) throw new Error('fixture refused')
  const ac = new AbortController()
  ac.abort()
  assert.equal(
    (
      await createOpenCodeGoSenderV1({ credential: () => 'fake', wire }).send(
        prepared.prepared,
        ac.signal,
      )
    ).state,
    'no-send',
  )
  assert.equal(
    (
      await createOpenCodeGoSenderV1({
        credential: () => {
          throw new Error('hidden')
        },
        wire,
      }).send(prepared.prepared)
    ).state,
    'no-send',
  )
  assert.equal(
    (
      await createOpenCodeGoSenderV1({ credential: () => 'x'.repeat(8193), wire }).send(
        prepared.prepared,
      )
    ).state,
    'no-send',
  )
  assert.equal(count, 0)
})

test('hostile prepared wrappers and proxies refuse without invoking getters or request effects', async (t) => {
  const old = https.request
  t.after(() => {
    https.request = old
    syncBuiltinESMExports()
  })
  let count = 0
  https.request = () => {
    count++
    throw new Error('unexpected')
  }
  syncBuiltinESMExports()
  const wire = createOpenCodeGoWireV1()
  const prepared = wire.prepare(input())
  if (!prepared.ok) throw new Error('fixture refused')
  const sender = createOpenCodeGoSenderV1({ credential: () => 'fake', wire })
  let getterCalls = 0
  const hostile = Object.defineProperty({}, 'ok', {
    enumerable: true,
    get() {
      getterCalls++
      throw new Error('getter invoked')
    },
  })
  assert.equal((await sender.send(hostile)).state, 'no-send')
  assert.equal(getterCalls, 0)
  const proxySender = createOpenCodeGoSenderV1({ credential: () => 'fake', wire })
  const hostileProxy = new Proxy(
    {},
    {
      ownKeys() {
        throw new Error('proxy trap')
      },
    },
  )
  assert.equal((await proxySender.send(hostileProxy)).state, 'no-send')
  assert.equal(count, 0)
})

async function assertPreparedWrapperRefused(
  t: TestContext,
  mutate: (first: OpenCodeGoPrepared, second: OpenCodeGoPrepared) => unknown,
) {
  const old = https.request
  t.after(() => {
    https.request = old
    syncBuiltinESMExports()
  })
  let requests = 0
  let credentials = 0
  https.request = () => {
    requests++
    throw new Error('unexpected request')
  }
  syncBuiltinESMExports()
  const wire = createOpenCodeGoWireV1()
  const first = wire.prepare(input())
  const second = wire.prepare({
    ...input(),
    user: 'other body',
  })
  if (!first.ok || !second.ok) throw new Error('fixture refused')
  const result = await createOpenCodeGoSenderV1({
    credential: () => {
      credentials++
      return 'fake'
    },
    wire,
  }).send(mutate(first, second))
  assert.equal(result.state, 'no-send')
  assert.equal(result.code, 'PREPARED_REFUSED')
  assert.equal(credentials, 0)
  assert.equal(requests, 0)
}

test('changed request digest refuses before credential or request', async (t) =>
  assertPreparedWrapperRefused(t, (first) => ({ ...first, requestDigest: 'c'.repeat(64) })))
test('changed decision digest refuses before credential or request', async (t) =>
  assertPreparedWrapperRefused(t, (first) => ({ ...first, decisionDigest: 'd'.repeat(64) })))
test('changed body digest refuses before credential or request', async (t) =>
  assertPreparedWrapperRefused(t, (first) => ({ ...first, bodyDigest: 'e'.repeat(64) })))
test('substituted prepared handle refuses before credential or request', async (t) =>
  assertPreparedWrapperRefused(t, (first, second) => ({ ...first, prepared: second.prepared })))

test('a synchronous constructor throw is uncertain because exposure began', async (t) => {
  const old = https.request
  t.after(() => {
    https.request = old
    syncBuiltinESMExports()
  })
  https.request = () => {
    throw new Error('secret socket detail')
  }
  syncBuiltinESMExports()
  const wire = createOpenCodeGoWireV1()
  const prepared = wire.prepare(input())
  if (!prepared.ok) throw new Error('fixture refused')
  const result = await createOpenCodeGoSenderV1({ credential: () => 'fake', wire }).send(
    prepared.prepared,
  )
  assert.equal(result.state, 'uncertain')
  assert.equal(JSON.stringify(result).includes('secret'), false)
})

test('429 is one exposed attempt and never retries', async (t) => {
  const old = https.request
  t.after(() => {
    https.request = old
    syncBuiltinESMExports()
  })
  let count = 0
  https.request = (...args: unknown[]) => {
    count++
    const req = Object.assign(new EventEmitter(), { destroyed: false })
    Object.assign(req, {
      end() {
        ;(args[2] as (r: IncomingMessage) => void)(fakeResponse(429, '{}'))
      },
      destroy: () => {
        req.destroyed = true
        req.emit('close')
      },
    })
    return req
  }
  syncBuiltinESMExports()
  const wire = createOpenCodeGoWireV1()
  const prepared = wire.prepare(input())
  if (!prepared.ok) throw new Error('fixture refused')
  const sender = createOpenCodeGoSenderV1({ credential: () => 'fake', wire })
  assert.equal((await sender.send(prepared.prepared)).state, 'uncertain')
  assert.equal(count, 1)
  assert.equal((await sender.send(prepared.prepared)).state, 'no-send')
  assert.equal(count, 1)
})

test('response byte cap rejects an oversized body as uncertain', async (t) => {
  const old = https.request
  t.after(() => {
    https.request = old
    syncBuiltinESMExports()
  })
  https.request = (...args: unknown[]) => {
    const req = Object.assign(new EventEmitter(), { destroyed: false })
    const oversized = JSON.stringify({
      model: 'mimo-v2.6-pro',
      choices: [
        {
          index: 0,
          message: { role: 'assistant', content: 'x'.repeat(65_500) },
          finish_reason: 'stop',
        },
      ],
    })
    Object.assign(req, {
      end() {
        ;(args[2] as (r: IncomingMessage) => void)(fakeResponse(200, oversized))
      },
      destroy: () => {
        req.destroyed = true
        req.emit('close')
      },
    })
    return req
  }
  syncBuiltinESMExports()
  const wire = createOpenCodeGoWireV1()
  const prepared = wire.prepare(input())
  if (!prepared.ok) throw new Error('fixture refused')
  const result = await createOpenCodeGoSenderV1({ credential: () => 'fake', wire }).send(
    prepared.prepared,
  )
  assert.equal(result.state, 'uncertain')
  assert.equal(result.code, 'STREAM_UNCERTAIN')
})

test('late response after abort is destroyed without listener reentry', async (t) => {
  const old = https.request
  t.after(() => {
    https.request = old
    syncBuiltinESMExports()
  })
  let callback: ((response: IncomingMessage) => void) | undefined
  https.request = (...args: unknown[]) => {
    callback = args[2] as (response: IncomingMessage) => void
    const req = Object.assign(new EventEmitter(), { destroyed: false })
    Object.assign(req, {
      end() {},
      destroy: () => {
        req.destroyed = true
        req.emit('close')
      },
    })
    return req
  }
  syncBuiltinESMExports()
  const wire = createOpenCodeGoWireV1()
  const prepared = wire.prepare(input())
  if (!prepared.ok) throw new Error('fixture refused')
  const abort = new AbortController()
  const sender = createOpenCodeGoSenderV1({ credential: () => 'fake', wire })
  const pending = sender.send(prepared.prepared, abort.signal)
  abort.abort()
  assert.equal((await pending).state, 'uncertain')
  assert.ok(callback)
  const late = fakeResponse(200, '{}')
  if (!callback) throw new Error('response callback missing')
  callback(late)
  assert.equal(late.destroyed, true)
  assert.equal(late.listenerCount('data'), 0)
  assert.equal(late.listenerCount('end'), 0)
  assert.equal(late.listenerCount('error'), 0)
  assert.equal(late.listenerCount('aborted'), 0)
})

test('missing usage remains unknown and length is incomplete', async (t) => {
  const old = https.request
  t.after(() => {
    https.request = old
    syncBuiltinESMExports()
  })
  https.request = (...args: unknown[]) => {
    const req = Object.assign(new EventEmitter(), { destroyed: false })
    Object.assign(req, {
      end() {
        ;(args[2] as (r: IncomingMessage) => void)(
          fakeResponse(
            200,
            JSON.stringify({
              model: 'mimo-v2.6-pro',
              choices: [
                {
                  index: 0,
                  message: { role: 'assistant', content: 'partial' },
                  finish_reason: 'length',
                },
              ],
            }),
          ),
        )
      },
      destroy: () => {
        req.destroyed = true
        req.emit('close')
      },
    })
    return req
  }
  syncBuiltinESMExports()
  const wire = createOpenCodeGoWireV1()
  const prepared = wire.prepare(input())
  if (!prepared.ok) throw new Error('fixture refused')
  const result = await createOpenCodeGoSenderV1({ credential: () => 'fake', wire }).send(
    prepared.prepared,
  )
  assert.equal(result.semantic, 'length')
  assert.equal(result.usage, undefined)
  assert.deepEqual(result.charge, { kind: 'unknown', reason: 'incomplete' })
})
