import type { ClientRequest, IncomingMessage } from 'node:http'
import { request as httpsRequest } from 'node:https'
import type { Socket } from 'node:net'
import type {
  ClockReadingV1,
  FixedMetadataRequestV1,
  FixedMetadataTransportV1,
  MetadataEventsV1,
  MetadataRequestControlV1,
  OfflinePublicationRuntimeV1,
} from './catalog-publication-types.js'

const clockFailures = new WeakSet<object>()
class ClockFailure {
  constructor() {
    clockFailures.add(this)
  }
}
const LIMIT = 8 * 1024 * 1024
const byteProto = Object.getPrototypeOf(Uint8Array.prototype)
const byteLength = Object.getOwnPropertyDescriptor(byteProto, 'byteLength')?.get
const byteBuffer = Object.getOwnPropertyDescriptor(byteProto, 'buffer')?.get
const byteTag = Object.getOwnPropertyDescriptor(byteProto, Symbol.toStringTag)?.get
const bufferLength = Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'byteLength')?.get
const resizable = Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'resizable')?.get
const ByteArray = Uint8Array
const aborted = Object.getOwnPropertyDescriptor(AbortSignal.prototype, 'aborted')?.get
const addAbort = EventTarget.prototype.addEventListener
const removeAbort = EventTarget.prototype.removeEventListener
const fixed: FixedMetadataRequestV1 = Object.freeze({
  method: 'GET',
  url: 'https://openrouter.ai/api/v1/models',
  headers: Object.freeze({ Accept: 'application/json', 'Accept-Encoding': 'identity' }),
  agent: false,
  rejectUnauthorized: true,
  maxHeaderSize: 16384,
})
function closed(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw 0
  const proto = Object.getPrototypeOf(value)
  if (proto !== Object.prototype && proto !== null) throw 0
  const names = Reflect.ownKeys(value)
  if (names.length !== keys.length) throw 0
  const out: Record<string, unknown> = Object.create(null)
  for (const key of keys) {
    const d = Object.getOwnPropertyDescriptor(value, key)
    if (!d || !('value' in d) || !d.enumerable) throw 0
    out[key] = d.value
  }
  return out
}
function runtime(raw: unknown): OfflinePublicationRuntimeV1 {
  const r = closed(raw, ['readClock', 'scheduleWake', 'clearWake', 'requestDriver'])
  const d = closed(r.requestDriver, ['open'])
  for (const k of ['readClock', 'scheduleWake', 'clearWake'])
    if (typeof r[k] !== 'function') throw 0
  if (typeof d.open !== 'function') throw 0
  return {
    readClock: r.readClock as () => unknown,
    scheduleWake: r.scheduleWake as OfflinePublicationRuntimeV1['scheduleWake'],
    clearWake: r.clearWake as OfflinePublicationRuntimeV1['clearWake'],
    requestDriver: { open: d.open as OfflinePublicationRuntimeV1['requestDriver']['open'] },
  }
}
function clock(r: OfflinePublicationRuntimeV1, last: ClockReadingV1 | null): ClockReadingV1 {
  const v = closed(r.readClock(), ['utc', 'monoMs'])
  if (
    typeof v.utc !== 'string' ||
    v.utc.length !== 24 ||
    !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(v.utc) ||
    new Date(v.utc).toISOString() !== v.utc ||
    typeof v.monoMs !== 'number' ||
    !Number.isFinite(v.monoMs) ||
    v.monoMs < 0 ||
    v.monoMs > Number.MAX_SAFE_INTEGER
  )
    throw 0
  if (last && (v.utc < last.utc || v.monoMs < last.monoMs)) throw 0
  return { utc: v.utc, monoMs: v.monoMs }
}
function chunk(value: unknown, remaining: number): Uint8Array {
  if (!ArrayBuffer.isView(value) || byteTag?.call(value) !== 'Uint8Array') throw 0
  const size = byteLength?.call(value) as number
  if (size > remaining) throw 0
  const b = byteBuffer?.call(value)
  bufferLength?.call(b)
  if (resizable?.call(b)) throw 0
  return new ByteArray(value as Uint8Array)
}
function responseHead(value: unknown): number | null {
  const h = closed(value, ['statusCode', 'rawHeaders'])
  if (h.statusCode !== 200 || !Array.isArray(h.rawHeaders)) throw 0
  const a = h.rawHeaders
  const ld = Object.getOwnPropertyDescriptor(a, 'length')
  if (!ld || !('value' in ld) || ld.value > 512 || ld.value % 2) throw 0
  if (Reflect.ownKeys(a).length !== ld.value + 1) throw 0
  const headers = new Map<string, string>()
  let total = 0
  for (let i = 0; i < ld.value; i += 2) {
    const pair = []
    for (const j of [i, i + 1]) {
      const d = Object.getOwnPropertyDescriptor(a, String(j))
      if (
        !d ||
        !('value' in d) ||
        !d.enumerable ||
        typeof d.value !== 'string' ||
        d.value.length > 16384
      )
        throw 0
      pair.push(d.value)
    }
    const [name, value] = pair as [string, string]
    const bytes = Buffer.byteLength(name) + Buffer.byteLength(value) + 4
    total += bytes
    if (
      total > 16384 ||
      !/^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/.test(name) ||
      Array.from(value).some((c) => {
        const n = c.charCodeAt(0)
        return (n < 32 && n !== 9) || n === 127
      })
    )
      throw 0
    const key = name.toLowerCase()
    if (['content-type', 'content-encoding', 'content-length'].includes(key)) {
      if (headers.has(key)) throw 0
      headers.set(key, value)
    }
  }
  if (
    !/^[ \t]*application\/json[ \t]*(;[ \t]*charset[ \t]*=[ \t]*utf-8[ \t]*)?$/i.test(
      headers.get('content-type') ?? '',
    )
  )
    throw 0
  const encoding = headers.get('content-encoding')
  if (encoding !== undefined && !/^[ \t]*identity[ \t]*$/i.test(encoding)) throw 0
  const length = headers.get('content-length')
  if (length === undefined) return null
  if (!/^\d+$/.test(length) || length.length > 16) throw 0
  const n = Number(length)
  if (!Number.isSafeInteger(n) || n > LIMIT) throw 0
  return n
}
function engine(r: OfflinePublicationRuntimeV1): FixedMetadataTransportV1 {
  let last: ClockReadingV1 | null = null
  const now = () => {
    try {
      last = clock(r, last)
      return last
    } catch {
      throw new ClockFailure()
    }
  }
  return Object.freeze({
    readMetadataV1(input: { deadlineMonoMs: number; signal: AbortSignal }): Promise<unknown> {
      return new Promise((resolve, reject) => {
        let deadline: number, signal: AbortSignal, start: ClockReadingV1
        try {
          const q = closed(input, ['deadlineMonoMs', 'signal'])
          if (
            typeof q.deadlineMonoMs !== 'number' ||
            !Number.isFinite(q.deadlineMonoMs) ||
            q.deadlineMonoMs < 0 ||
            q.deadlineMonoMs > Number.MAX_SAFE_INTEGER
          )
            throw 0
          deadline = q.deadlineMonoMs
          signal = q.signal as AbortSignal
          const isAborted = aborted?.call(signal)
          if (typeof isAborted !== 'boolean') throw 0
          start = now()
          if (isAborted) {
            reject(Object.freeze({ code: 'CANCELLED' }))
            return
          }
          if (deadline <= start.monoMs) {
            reject(Object.freeze({ code: 'DEADLINE_EXCEEDED' }))
            return
          }
          deadline = Math.min(deadline, start.monoMs + 10000)
        } catch {
          reject(Object.freeze({ code: 'INSTALLATION_REFUSED' }))
          return
        }
        let ready = false,
          scheduling = false
        let opened = false,
          assigned = false,
          connected = false,
          responded = false,
          ended = false,
          responseClosed = false,
          requestClosed = false,
          socketClosed = false,
          settled = false,
          destroyed = false
        let failure: string | null = null,
          control: MetadataRequestControlV1 | null = null,
          timer: object | null = null,
          length: number | null = null,
          size = 0,
          received: string | null = null
        const chunks: Uint8Array[] = []
        const decoder = new TextDecoder('utf-8', { fatal: true })
        const destroy = () => {
          if (control && !destroyed) {
            destroyed = true
            try {
              if (control.destroy() !== undefined) failure ??= 'TRANSPORT_REFUSED'
            } catch {
              failure ??= 'TRANSPORT_REFUSED'
            }
          }
        }
        const settle = () => {
          if (
            settled ||
            !opened ||
            !ready ||
            !connected ||
            !assigned ||
            !requestClosed ||
            !socketClosed ||
            (responded && !responseClosed)
          )
            return
          if (failure === null && (!responded || !ended)) failure = 'TRANSPORT_REFUSED'
          settled = true
          try {
            removeAbort.call(signal, 'abort', onAbort)
          } catch {}
          if (timer)
            try {
              r.clearWake(timer)
            } catch {}
          if (failure !== null) {
            chunks.length = 0
            reject(Object.freeze({ code: failure }))
            return
          }
          const bytes = new ByteArray(size)
          let offset = 0
          for (const c of chunks) {
            bytes.set(c, offset)
            offset += c.length
          }
          chunks.length = 0
          resolve(
            Object.freeze({
              status: 200,
              mediaType: 'application/json',
              contentEncoding: 'identity',
              requestStartedAtUtc: start.utc,
              completeReceivedAtUtc: received,
              complete: true,
              bytes,
            }),
          )
        }
        const fail = (code = 'TRANSPORT_REFUSED') => {
          if (settled) return
          failure ??= code
          if (timer) {
            try {
              r.clearWake(timer)
            } catch {}
            timer = null
          }
          destroy()
          settle()
        }
        const onAbort = () => fail('CANCELLED')
        const wake = () => {
          if (settled || failure !== null) return
          try {
            const t = now()
            if (t.monoMs >= deadline) fail('DEADLINE_EXCEEDED')
            else if (scheduling) fail('INSTALLATION_REFUSED')
            else schedule(deadline - t.monoMs)
          } catch {
            fail('INSTALLATION_REFUSED')
          }
        }
        const schedule = (delay: number) => {
          scheduling = true
          let t: Record<string, unknown>
          try {
            t = closed(r.scheduleWake(delay, wake), ['timer'])
          } finally {
            scheduling = false
          }
          if (typeof t.timer !== 'object' || t.timer === null) throw 0
          timer = t.timer
        }
        const guarded = (fn: () => void) => {
          if (settled) return
          try {
            fn()
          } catch (error) {
            fail(clockFailures.has(error as object) ? 'INSTALLATION_REFUSED' : 'TRANSPORT_REFUSED')
          }
        }
        const events: MetadataEventsV1 = Object.freeze({
          socketAssigned: () =>
            guarded(() => {
              if (assigned) throw 0
              assigned = true
            }),
          socketConnected: () =>
            guarded(() => {
              if (!assigned || connected || socketClosed) throw 0
              connected = true
              settle()
            }),
          response: (h) =>
            guarded(() => {
              if (responded || failure !== null || !assigned) throw 0
              responded = true
              length = responseHead(h)
            }),
          data: (v) =>
            guarded(() => {
              if (!responded || ended || failure !== null) throw 0
              const c = chunk(v, LIMIT - size)
              decoder.decode(c, { stream: true })
              size += c.length
              if (c.length) chunks.push(c)
            }),
          responseEnded: () =>
            guarded(() => {
              if (!responded || ended || failure !== null) throw 0
              decoder.decode()
              if (length !== null && length !== size) throw 0
              const t = now()
              if (t.monoMs >= deadline) {
                fail('DEADLINE_EXCEEDED')
                return
              }
              received = t.utc
              ended = true
              settle()
            }),
          responseClosed: () =>
            guarded(() => {
              if (!responded || responseClosed) throw 0
              responseClosed = true
              if (!ended) fail()
              settle()
            }),
          requestClosed: () =>
            guarded(() => {
              if (requestClosed) throw 0
              requestClosed = true
              if (!ended) fail()
              settle()
            }),
          socketClosed: () =>
            guarded(() => {
              if (!assigned || socketClosed) throw 0
              socketClosed = true
              if (!ended) fail()
              settle()
            }),
          error: () => fail(),
        })
        try {
          addAbort.call(signal, 'abort', onAbort, { once: true })
          schedule(deadline - start.monoMs)
          if (failure !== null) {
            removeAbort.call(signal, 'abort', onAbort)
            if (timer) {
              try {
                r.clearWake(timer)
              } catch {}
              timer = null
            }
            reject(Object.freeze({ code: failure }))
            settled = true
            return
          }
          opened = true
          const c = closed(r.requestDriver.open(fixed, events), ['end', 'destroy'])
          if (typeof c.end !== 'function' || typeof c.destroy !== 'function') throw 0
          control = { end: c.end as () => unknown, destroy: c.destroy as () => unknown }
          if (failure !== null) {
            destroy()
            settle()
          } else if (control.end() !== undefined) throw 0
          ready = true
          settle()
        } catch {
          if (!opened) {
            settled = true
            try {
              removeAbort.call(signal, 'abort', onAbort)
            } catch {}
            reject(Object.freeze({ code: 'INSTALLATION_REFUSED' }))
          } else {
            ready = true
            fail()
          }
        }
      })
    },
  })
}
export function createOfflineMetadataTransportV1(
  raw: unknown,
): { ok: true; transport: FixedMetadataTransportV1 } | { ok: false; code: 'INSTALLATION_REFUSED' } {
  try {
    return Object.freeze({ ok: true, transport: engine(runtime(raw)) })
  } catch {
    return Object.freeze({ ok: false, code: 'INSTALLATION_REFUSED' })
  }
}
function nativeOpen(
  request: FixedMetadataRequestV1,
  events: MetadataEventsV1,
): MetadataRequestControlV1 {
  let response: IncomingMessage | null = null,
    socket: Socket | null = null,
    req: ClientRequest | null = null
  let destructionRequested = false
  const destroy = () => {
    destructionRequested = true
    response?.destroy()
    socket?.destroy()
    req?.destroy()
  }
  req = httpsRequest(request.url, {
    method: request.method,
    headers: request.headers,
    agent: false,
    rejectUnauthorized: true,
    maxHeaderSize: 16384,
  })
  req.on('error', events.error)
  req.on('close', events.requestClosed)
  req.on('socket', (s) => {
    if (socket) {
      s.destroy()
      events.error()
      return
    }
    socket = s
    events.socketAssigned()
    s.on('connect', events.socketConnected)
    s.on('close', events.socketClosed)
    s.on('error', events.error)
    if (destructionRequested) s.destroy()
  })
  req.on('response', (res) => {
    if (response) {
      res.destroy()
      events.error()
      return
    }
    response = res
    res.on('error', events.error)
    res.on('aborted', events.error)
    res.on('close', events.responseClosed)
    res.on('data', events.data)
    res.on('end', () => {
      if (res.complete === true) events.responseEnded()
      else events.error()
    })
    events.response({ statusCode: res.statusCode, rawHeaders: res.rawHeaders })
    if (destructionRequested) res.destroy()
  })
  return {
    end: () => {
      req?.end()
    },
    destroy,
  }
}
export function createFixedMetadataTransportV1(): FixedMetadataTransportV1 {
  const date = Date.now,
    mono = performance.now.bind(performance),
    schedule = setTimeout,
    clear = clearTimeout
  return engine({
    readClock: () => ({ utc: new Date(date()).toISOString(), monoMs: mono() }),
    scheduleWake: (delay, wake) => ({ timer: schedule(wake, delay) }),
    clearWake: (t) => {
      clear(t as ReturnType<typeof setTimeout>)
    },
    requestDriver: { open: nativeOpen },
  })
}
