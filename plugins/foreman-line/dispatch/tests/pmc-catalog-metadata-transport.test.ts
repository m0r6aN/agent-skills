import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createOfflineMetadataTransportV1 } from '../src/pmc-launch/catalog-metadata-transport.js'
import type { MetadataEventsV1 } from '../src/pmc-launch/catalog-publication-types.js'

test('shared transport waits for connected request, response and socket cleanup', async () => {
  let events: MetadataEventsV1 | undefined
  let ends = 0
  const result = createOfflineMetadataTransportV1({
    readClock: () => ({ utc: '2026-09-26T12:00:00.000Z', monoMs: 0 }),
    scheduleWake: () => ({ timer: {} }),
    clearWake: () => undefined,
    requestDriver: {
      open: (request: unknown, e: MetadataEventsV1) => {
        assert.deepEqual(request, {
          method: 'GET',
          url: 'https://openrouter.ai/api/v1/models',
          headers: { Accept: 'application/json', 'Accept-Encoding': 'identity' },
          agent: false,
          rejectUnauthorized: true,
          maxHeaderSize: 16384,
        })
        events = e
        return {
          end: () => {
            ends++
          },
          destroy: () => undefined,
        }
      },
    },
  })
  assert(result.ok)
  const promise = result.transport.readMetadataV1({
    deadlineMonoMs: 10000,
    signal: new AbortController().signal,
  })
  let settled = false
  promise.then(
    () => {
      settled = true
    },
    () => {
      settled = true
    },
  )
  assert(events)
  events.socketAssigned()
  events.socketConnected()
  events.response({ statusCode: 200, rawHeaders: ['Content-Type', 'application/json'] })
  events.data(new TextEncoder().encode('{}'))
  events.responseEnded()
  events.responseClosed()
  events.requestClosed()
  await Promise.resolve()
  assert.equal(settled, false)
  events.socketClosed()
  const value = (await promise) as { bytes: Uint8Array; complete: boolean }
  assert.equal(value.complete, true)
  assert.equal(new TextDecoder().decode(value.bytes), '{}')
  assert.equal(ends, 1)
})

import { spawnSync } from 'node:child_process'

test('actual fixed native translator listeners enforce cleanup under guarded Node boundaries', () => {
  const moduleUrl = new URL('../src/pmc-launch/catalog-metadata-transport.ts', import.meta.url).href
  const script = `import assert from 'node:assert/strict';import {EventEmitter} from 'node:events';import https from 'node:https';import http from 'node:http';import net from 'node:net';import tls from 'node:tls';import dns from 'node:dns';import {syncBuiltinESMExports} from 'node:module';
  let forbidden=0,requests=[];const deny=()=>{forbidden++;throw Error('NETWORK_FORBIDDEN')};
  http.request=deny;http.get=deny;https.get=deny;net.connect=deny;net.createConnection=deny;net.Socket.prototype.connect=deny;tls.connect=deny;dns.lookup=deny;dns.resolve=deny;dns.promises.lookup=deny;dns.promises.resolve=deny;
  https.request=(url,options)=>{assert.equal(url,'https://openrouter.ai/api/v1/models');assert.deepEqual(options,{method:'GET',headers:{Accept:'application/json','Accept-Encoding':'identity'},agent:false,rejectUnauthorized:true,maxHeaderSize:16384});const req=new EventEmitter();req.ends=0;req.destroys=0;req.end=()=>{req.ends++};req.destroy=()=>{req.destroys++};requests.push(req);return req};syncBuiltinESMExports();
  const {createFixedMetadataTransportV1}=await import(${JSON.stringify(moduleUrl)});
  for(const mode of ['success','incomplete','error','no-connect','abort','early-abort']){
    const transport=createFixedMetadataTransportV1(),abort=new AbortController();let state='pending';const promise=transport.readMetadataV1({deadlineMonoMs:performance.now()+10000,signal:abort.signal});promise.then(()=>state='fulfilled',()=>state='rejected');
    const req=requests.at(-1);assert.equal(req.ends,1);if(mode==='early-abort')abort.abort();const socket=new EventEmitter();socket.destroys=0;socket.destroy=()=>{socket.destroys++};req.emit('socket',socket);if(mode!=='no-connect')socket.emit('connect');
    const res=new EventEmitter();res.complete=mode!=='incomplete';res.statusCode=200;res.rawHeaders=['Content-Type','application/json'];res.destroys=0;res.destroy=()=>{res.destroys++};req.emit('response',res);res.emit('data',new Uint8Array([123,125]));
    if(mode==='abort'||mode==='early-abort')abort.abort();else if(mode==='error'||mode==='no-connect')req.emit('error',Error('synthetic'));else res.emit('end');
    await Promise.resolve();assert.equal(state,'pending');res.emit('close');await Promise.resolve();assert.equal(state,'pending');req.emit('close');await Promise.resolve();assert.equal(state,'pending');socket.emit('close');await Promise.resolve();
    assert.equal(state,mode==='no-connect'?'pending':mode==='success'?'fulfilled':'rejected');
    if(mode!=='success'){assert(req.destroys>0);assert(socket.destroys>0);assert(res.destroys>0)}
  }
  assert.equal(forbidden,0);console.log('NATIVE_GUARDED_OK');`
  const child = spawnSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-'], {
    input: script,
    encoding: 'utf8',
    timeout: 20000,
    maxBuffer: 1048576,
  })
  assert.equal(child.status, 0, child.stderr)
  assert.match(child.stdout, /NATIVE_GUARDED_OK/)
})

function transportFixture() {
  let events: MetadataEventsV1 | undefined,
    time = 0,
    opens = 0,
    ends = 0,
    destroys = 0
  const wakes = new Map<object, () => void>(),
    abort = new AbortController()
  const runtime = {
    readClock: () => ({
      utc: new Date(Date.parse('2026-09-26T12:00:00.000Z') + time).toISOString(),
      monoMs: time,
    }),
    scheduleWake: (_delay: number, wake: () => void) => {
      const timer = {}
      wakes.set(timer, wake)
      return { timer }
    },
    clearWake: (timer: object) => {
      wakes.delete(timer)
    },
    requestDriver: {
      open: (_q: unknown, e: MetadataEventsV1) => {
        opens++
        events = e
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
  const made = createOfflineMetadataTransportV1(runtime)
  assert(made.ok)
  const promise = made.transport.readMetadataV1({ deadlineMonoMs: 10000, signal: abort.signal })
  let state = 'pending'
  promise.then(
    () => (state = 'fulfilled'),
    () => (state = 'rejected'),
  )
  assert(events)
  const e = events
  e.socketAssigned()
  e.socketConnected()
  return {
    e,
    promise,
    abort,
    runtime,
    wakes,
    state: () => state,
    counts: () => ({ opens, ends, destroys }),
    close: () => {
      e.responseClosed()
      e.requestClosed()
      e.socketClosed()
    },
    tick: (ms: number) => {
      time += ms
      for (const w of [...wakes.values()]) w()
    },
  }
}
test('HTTP whitespace excludes Unicode whitespace in content metadata', async () => {
  for (const rawHeaders of [
    ['content-type', '\u00a0application/json'],
    ['content-type', 'application/json', 'content-encoding', 'identity\u00a0'],
  ]) {
    const f = transportFixture()
    f.e.response({ statusCode: 200, rawHeaders })
    f.e.data(new Uint8Array([123, 125]))
    f.e.responseEnded()
    f.close()
    await assert.rejects(f.promise, { code: 'TRANSPORT_REFUSED' })
  }
})

for (const [name, headers, valid] of [
  [
    'case/HTTP whitespace',
    ['CONTENT-TYPE', ' \tAPPLICATION/JSON ; charset = UTF-8\t', 'Content-Encoding', 'identity'],
    true,
  ],
  ['missing type', [], false],
  ['gzip', ['content-type', 'application/json', 'content-encoding', 'gzip'], false],
  [
    'duplicate type',
    ['content-type', 'application/json', 'Content-Type', 'application/json'],
    false,
  ],
  [
    'duplicate encoding',
    [
      'content-type',
      'application/json',
      'content-encoding',
      'identity',
      'Content-Encoding',
      'identity',
    ],
    false,
  ],
  [
    'duplicate length',
    ['content-type', 'application/json', 'content-length', '2', 'Content-Length', '2'],
    false,
  ],
  ['unknown parameter', ['content-type', 'application/json;foo=bar'], false],
  ['control value', ['content-type', 'application/json', 'x', 'a\rb'], false],
  ['invalid name', ['content-type', 'application/json', 'bad name', 'x'], false],
  ['negative length', ['content-type', 'application/json', 'content-length', '-1'], false],
  ['length over cap', ['content-type', 'application/json', 'content-length', '8388609'], false],
  ['length mismatch', ['content-type', 'application/json', 'content-length', '3'], false],
] as const)
  test(`closed HTTP metadata: ${name}`, async () => {
    const f = transportFixture()
    f.e.response({ statusCode: 200, rawHeaders: [...headers] })
    f.e.data(new Uint8Array([123, 125]))
    f.e.responseEnded()
    f.close()
    if (valid) await f.promise
    else await assert.rejects(f.promise, { code: 'TRANSPORT_REFUSED' })
    assert.equal(f.counts().opens, 1)
    assert.equal(f.counts().ends, 1)
  })
for (const status of [301, 302, 401, 403, 429, 500])
  test(`HTTP ${status} refuses without redirect/auth/retry`, async () => {
    const f = transportFixture()
    f.e.response({ statusCode: status, rawHeaders: ['content-type', 'application/json'] })
    f.close()
    await assert.rejects(f.promise, { code: 'TRANSPORT_REFUSED' })
    assert.equal(f.counts().opens, 1)
    assert.equal(f.counts().destroys, 1)
  })
test('header UTF8 aggregate exact 16384 and one over', async () => {
  const prefix = ['content-type', 'application/json']
  const used = 12 + 16 + 4 + 1 + 4
  for (const extra of [0, 1]) {
    const f = transportFixture()
    f.e.response({
      statusCode: 200,
      rawHeaders: [...prefix, 'x', 'a'.repeat(16384 - used + extra)],
    })
    f.e.data(new Uint8Array([123, 125]))
    f.e.responseEnded()
    f.close()
    if (extra) await assert.rejects(f.promise, { code: 'TRANSPORT_REFUSED' })
    else await f.promise
  }
})
test('header pair cardinality 256 and 257 preflights before descriptors', async () => {
  for (const count of [256, 257]) {
    let descriptors = 0
    const a = ['content-type', 'application/json']
    while (a.length < count * 2) a.push('x', '')
    const headers = new Proxy(a, {
      getOwnPropertyDescriptor(t, k) {
        if (k !== 'length') descriptors++
        return Reflect.getOwnPropertyDescriptor(t, k)
      },
    })
    const f = transportFixture()
    f.e.response({ statusCode: 200, rawHeaders: headers })
    f.e.data(new Uint8Array([123, 125]))
    f.e.responseEnded()
    f.close()
    if (count === 256) await f.promise
    else {
      await assert.rejects(f.promise, { code: 'TRANSPORT_REFUSED' })
      assert.equal(descriptors, 0)
    }
  }
})
test('fragmented body exact 8MiB, one over, UTF8 across chunks and detached copies', async () => {
  for (const extra of [0, 1]) {
    const f = transportFixture()
    f.e.response({ statusCode: 200, rawHeaders: ['content-type', 'application/json'] })
    const body = new Uint8Array(8388608).fill(32)
    body[0] = 0xe2
    body[1] = 0x82
    body[2] = 0xac
    f.e.data(body.subarray(0, 1))
    f.e.data(body.subarray(1))
    body.fill(0)
    if (extra) f.e.data(new Uint8Array([32]))
    f.e.responseEnded()
    f.close()
    if (extra) await assert.rejects(f.promise, { code: 'TRANSPORT_REFUSED' })
    else {
      const r = (await f.promise) as { bytes: Uint8Array }
      assert.equal(r.bytes.length, 8388608)
      assert.deepEqual([...r.bytes.subarray(0, 3)], [0xe2, 0x82, 0xac])
    }
  }
})
test('intrinsic bytes ignore subclass iterator and refuse shared/resizable/lookalike views', async () => {
  class Evil extends Uint8Array {
    override [Symbol.iterator](): ReturnType<Uint8Array['values']> {
      throw Error('iterator must not run')
    }
  }
  for (const [value, valid] of [
    [new Evil([123, 125]), true],
    [new Uint8Array(new SharedArrayBuffer(2)), false],
    [new Uint8Array(Reflect.construct(ArrayBuffer, [2, { maxByteLength: 4 }])), false],
    [new Uint16Array(2), false],
    [{ length: 2, 0: 123, 1: 125 }, false],
    [new Proxy(new Uint8Array(2), {}), false],
  ] as const) {
    const f = transportFixture()
    f.e.response({ statusCode: 200, rawHeaders: ['content-type', 'application/json'] })
    f.e.data(value)
    f.e.responseEnded()
    f.close()
    if (valid) await f.promise
    else await assert.rejects(f.promise, { code: 'TRANSPORT_REFUSED' })
  }
})
test('fatal UTF8 refuses invalid and incomplete encodings', async () => {
  for (const v of [[0xff], [0xe2, 0x82]]) {
    const f = transportFixture()
    f.e.response({ statusCode: 200, rawHeaders: ['content-type', 'application/json'] })
    f.e.data(new Uint8Array(v))
    f.e.responseEnded()
    f.close()
    await assert.rejects(f.promise, { code: 'TRANSPORT_REFUSED' })
  }
})
test('deadline and abort latch before cleanup and never become success', async () => {
  for (const kind of ['deadline', 'cancel']) {
    const f = transportFixture()
    f.e.response({ statusCode: 200, rawHeaders: ['content-type', 'application/json'] })
    f.e.data(new Uint8Array([123, 125]))
    if (kind === 'deadline') f.tick(10000)
    else f.abort.abort()
    await Promise.resolve()
    assert.equal(f.state(), 'pending')
    f.e.responseEnded()
    f.close()
    await assert.rejects(f.promise, {
      code: kind === 'deadline' ? 'DEADLINE_EXCEEDED' : 'CANCELLED',
    })
    f.e.responseEnded()
    f.e.error()
    assert.equal(f.counts().destroys, 1)
  }
})
test('duplicate socket/response and early end/close refuse', async () => {
  for (const kind of ['socket', 'response', 'early-close', 'no-end', 'data-after-end']) {
    const f = transportFixture()
    f.e.response({ statusCode: 200, rawHeaders: ['content-type', 'application/json'] })
    if (kind === 'socket') f.e.socketAssigned()
    if (kind === 'response') f.e.response({ statusCode: 200, rawHeaders: [] })
    if (kind === 'early-close') f.e.requestClosed()
    f.e.data(new Uint8Array([123, 125]))
    if (kind !== 'no-end') f.e.responseEnded()
    if (kind === 'data-after-end') f.e.data(new Uint8Array([32]))
    f.close()
    await assert.rejects(f.promise, { code: 'TRANSPORT_REFUSED' })
  }
})
test('preopen runtime faults refuse without request and synchronous wake cannot recurse', async () => {
  for (const fault of ['clock', 'wake-throw', 'wake-shape', 'wake-sync']) {
    let opens = 0,
      clears = 0
    const r = createOfflineMetadataTransportV1({
      readClock: () => {
        if (fault === 'clock') throw 0
        return { utc: '2026-09-26T12:00:00.000Z', monoMs: 0 }
      },
      scheduleWake: (_d: number, w: () => void) => {
        if (fault === 'wake-throw') throw 0
        if (fault === 'wake-shape') return {}
        if (fault === 'wake-sync') w()
        return { timer: {} }
      },
      clearWake: () => {
        clears++
      },
      requestDriver: {
        open: () => {
          opens++
          throw 0
        },
      },
    })
    assert(r.ok)
    await assert.rejects(
      r.transport.readMetadataV1({ deadlineMonoMs: 10000, signal: new AbortController().signal }),
      { code: 'INSTALLATION_REFUSED' },
    )
    assert.equal(opens, 0)
    if (fault === 'wake-sync') assert.equal(clears, 1)
  }
})
test('open/end/destroy faults retain original promise until genuine event acknowledgements', async () => {
  for (const fault of ['open', 'control', 'end', 'destroy']) {
    let e: MetadataEventsV1 | undefined,
      ends = 0
    const made = createOfflineMetadataTransportV1({
      readClock: () => ({ utc: '2026-09-26T12:00:00.000Z', monoMs: 0 }),
      scheduleWake: () => ({ timer: {} }),
      clearWake: () => undefined,
      requestDriver: {
        open: (_q: unknown, events: MetadataEventsV1) => {
          e = events
          events.socketAssigned()
          events.socketConnected()
          if (fault === 'open') throw 0
          if (fault === 'control') return {}
          return {
            end: () => {
              ends++
              if (fault === 'end') throw 0
            },
            destroy: () => {
              throw 0
            },
          }
        },
      },
    })
    assert(made.ok)
    const p = made.transport.readMetadataV1({
      deadlineMonoMs: 10000,
      signal: new AbortController().signal,
    })
    let settled = false
    p.catch(() => {
      settled = true
    })
    assert(e)
    if (fault === 'destroy') e.error()
    await Promise.resolve()
    assert.equal(settled, false)
    e.requestClosed()
    await Promise.resolve()
    assert.equal(settled, false)
    e.socketClosed()
    await assert.rejects(p, { code: 'TRANSPORT_REFUSED' })
    assert(ends <= 1)
  }
})
test('synchronous successful events cannot settle before end is validated', async () => {
  const made = createOfflineMetadataTransportV1({
    readClock: () => ({ utc: '2026-09-26T12:00:00.000Z', monoMs: 0 }),
    scheduleWake: () => ({ timer: {} }),
    clearWake: () => undefined,
    requestDriver: {
      open: (_q: unknown, e: MetadataEventsV1) => {
        e.socketAssigned()
        e.socketConnected()
        e.response({ statusCode: 200, rawHeaders: ['content-type', 'application/json'] })
        e.data(new Uint8Array([123, 125]))
        e.responseEnded()
        e.responseClosed()
        e.requestClosed()
        e.socketClosed()
        return { end: () => 1, destroy: () => undefined }
      },
    },
  })
  assert(made.ok)
  await assert.rejects(
    made.transport.readMetadataV1({ deadlineMonoMs: 10000, signal: new AbortController().signal }),
    { code: 'TRANSPORT_REFUSED' },
  )
})
