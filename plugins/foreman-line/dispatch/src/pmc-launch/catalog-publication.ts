import { createHash } from 'node:crypto'
import { readCatalogSnapshot } from '../../../routing-policy/src/catalog-snapshot.js'
import {
  type MaterializerResultV1,
  materializePublicModelResponseV1,
} from '../../../routing-policy/src/public-observation-producer.js'
import { createOfflineMetadataTransportV1 } from './catalog-metadata-transport.js'
import type {
  AbsenceRead,
  CatalogPublicationOwnerV1,
  CatalogRead,
  ClockReadingV1,
  Identity,
  OfflinePublicationInputV1,
  OfflinePublicationRuntimeV1,
  OperationRegistrationResult,
  PublicationProvenance,
  ReadCode,
  RefreshCode,
  RefreshResult,
} from './catalog-publication-types.js'

const endpoint = 'https://openrouter.ai/api/v1/models' as const
const profile = 'openrouter-public-text-materialization/v1' as const
const domain = 'public-text-output' as const
const byteProto = Object.getPrototypeOf(Uint8Array.prototype)
const byteLength = Object.getOwnPropertyDescriptor(byteProto, 'byteLength')?.get
const byteBuffer = Object.getOwnPropertyDescriptor(byteProto, 'buffer')?.get
const byteTag = Object.getOwnPropertyDescriptor(byteProto, Symbol.toStringTag)?.get
const bufferLength = Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'byteLength')?.get
const resizable = Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'resizable')?.get
const ByteArray = Uint8Array
const errors = new WeakMap<object, RefreshCode | ReadCode>()
class Refusal {
  constructor(code: RefreshCode | ReadCode) {
    errors.set(this, code)
  }
}
function fail(code: RefreshCode | ReadCode): never {
  throw new Refusal(code)
}
const codeOf = (e: unknown): RefreshCode | ReadCode => errors.get(e as object) ?? 'INPUT_REFUSED'
function closed(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) fail('INPUT_REFUSED')
  const proto = Object.getPrototypeOf(value)
  if (proto !== Object.prototype && proto !== null) throw 0
  const names = Reflect.ownKeys(value)
  if (names.length !== keys.length) fail('INPUT_REFUSED')
  const r: Record<string, unknown> = Object.create(null)
  for (const k of keys) {
    const d = Object.getOwnPropertyDescriptor(value, k)
    if (!d || !('value' in d) || !d.enumerable) fail('INPUT_REFUSED')
    r[k] = d.value
  }
  return r
}
function capture(input: unknown): unknown {
  let nodes = 0,
    strings = 0
  const active = new Set<object>(),
    copies = new Map<object, unknown>()
  const charge = (s: string) => {
    if (s.length > 4096) fail('INPUT_REFUSED')
    const n = Buffer.byteLength(s)
    strings += n
    if (n > 4096 || strings > 1048576) fail('INPUT_REFUSED')
  }
  const copy = (v: unknown, depth: number, owned = false, arrayLimit = 256): unknown => {
    if (depth > 16 || ++nodes > 262144) fail('INPUT_REFUSED')
    if (typeof v === 'string') {
      charge(v)
      return v
    }
    if (v === null || typeof v === 'boolean') return v
    if (typeof v === 'number') {
      if (!Number.isFinite(v)) fail('INPUT_REFUSED')
      return v
    }
    if (typeof v !== 'object' || active.has(v)) fail('INPUT_REFUSED')
    const prior = owned ? undefined : copies.get(v)
    if (prior !== undefined) {
      nodes--
      return copy(prior, depth, true, arrayLimit)
    }
    const array = Array.isArray(v),
      proto = Object.getPrototypeOf(v)
    if (proto !== (array ? Array.prototype : Object.prototype) && !(proto === null && !array))
      fail('INPUT_REFUSED')
    let length = 0
    if (array) {
      const d = Object.getOwnPropertyDescriptor(v, 'length')
      if (
        !d ||
        !('value' in d) ||
        !Number.isSafeInteger(d.value) ||
        d.value < 0 ||
        d.value > arrayLimit
      )
        fail('INPUT_REFUSED')
      length = d.value
      if (nodes + length > 262144) fail('INPUT_REFUSED')
    }
    const keys = Reflect.ownKeys(v)
    if (array && keys.length !== length + 1) fail('INPUT_REFUSED')
    if (nodes + keys.length - (array ? 1 : 0) > 262144) fail('INPUT_REFUSED')
    const out: Record<string, unknown> | unknown[] = array ? [] : Object.create(null)
    active.add(v)
    try {
      for (const k of keys) {
        if (array && k === 'length') continue
        if (typeof k !== 'string') fail('INPUT_REFUSED')
        if (array && (!/^(0|[1-9][0-9]*)$/.test(k) || Number(k) >= length)) fail('INPUT_REFUSED')
        if (!array) charge(k)
        const d = Object.getOwnPropertyDescriptor(v, k)
        if (!d || !('value' in d) || !d.enumerable) fail('INPUT_REFUSED')
        Object.defineProperty(out, k, {
          value: copy(d.value, depth + 1, owned, depth === 0 && k === 'scopes' ? 128 : 256),
          enumerable: true,
        })
      }
      if (!owned) copies.set(v, out)
      return Object.freeze(out)
    } finally {
      active.delete(v)
    }
  }
  return copy(input, 0)
}
function utc(v: unknown): string {
  if (
    typeof v !== 'string' ||
    !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(v) ||
    new Date(v).toISOString() !== v
  )
    fail('INPUT_REFUSED')
  return v
}
function id(v: unknown): string {
  if (typeof v !== 'string' || !/^[A-Za-z0-9._:-]{1,128}$/.test(v)) fail('INPUT_REFUSED')
  return v
}
function uint(v: unknown): number {
  if (typeof v !== 'number' || !Number.isSafeInteger(v) || v < 0) fail('INPUT_REFUSED')
  return v
}
function mono(v: unknown): number {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > Number.MAX_SAFE_INTEGER)
    fail('INPUT_REFUSED')
  return v
}
function identity(v: unknown): Identity {
  const r = closed(v, ['provider', 'id'])
  if (
    r.provider !== 'openrouter' ||
    typeof r.id !== 'string' ||
    r.id.length === 0 ||
    r.id.length > 4096 ||
    r.id.trim() !== r.id
  )
    fail('INPUT_REFUSED')
  return Object.freeze({ provider: 'openrouter', id: r.id })
}
function same(a: Identity, b: Identity) {
  return a.provider === b.provider && a.id === b.id
}
function runtime(raw: unknown): OfflinePublicationRuntimeV1 {
  const r = closed(raw, ['readClock', 'scheduleWake', 'clearWake', 'requestDriver'])
  const d = closed(r.requestDriver, ['open'])
  for (const k of ['readClock', 'scheduleWake', 'clearWake'])
    if (typeof r[k] !== 'function') fail('INSTALLATION_REFUSED')
  if (typeof d.open !== 'function') fail('INSTALLATION_REFUSED')
  return Object.freeze({
    readClock: r.readClock as () => unknown,
    scheduleWake: r.scheduleWake as OfflinePublicationRuntimeV1['scheduleWake'],
    clearWake: r.clearWake as OfflinePublicationRuntimeV1['clearWake'],
    requestDriver: Object.freeze({
      open: d.open as OfflinePublicationRuntimeV1['requestDriver']['open'],
    }),
  })
}
function bytes(value: unknown): Uint8Array {
  if (!ArrayBuffer.isView(value) || byteTag?.call(value) !== 'Uint8Array') fail('TRANSPORT_REFUSED')
  const n = byteLength?.call(value) as number
  if (n > 8388608) fail('TRANSPORT_REFUSED')
  const b = byteBuffer?.call(value)
  bufferLength?.call(b)
  if (resizable?.call(b)) fail('TRANSPORT_REFUSED')
  return new ByteArray(value as Uint8Array)
}
type Success = Extract<MaterializerResultV1, { ok: true }>
type Publication = {
  handle: object
  scope: Scope
  generation: number
  candidate: Success
  provenance: PublicationProvenance
  raw: Uint8Array
}
type Scope = {
  declaration: OfflinePublicationInputV1['scopes'][number]
  handle: object
  generation: number
  current: Publication | null
}
type Operation = {
  scope: Scope
  expected: number
  deadline: number
  handle: object
  cancel: object
  controller: AbortController
  timer: object | null
  invoked: boolean
  running: boolean
  released: boolean
  result: RefreshResult | null
  deliver: (r: RefreshResult) => void
  promise: Promise<RefreshResult>
  materializationRefusal: string | null
  scheduling: boolean
}
export function createProductionCatalogPublicationOwnerV1(_input: unknown): {
  ok: false
  code: 'INSTALLATION_REFUSED'
} {
  return Object.freeze({ ok: false, code: 'INSTALLATION_REFUSED' })
}
export function createOfflineCatalogPublicationOwnerV1(
  input: unknown,
  rawRuntime: unknown,
):
  | { ok: true; owner: CatalogPublicationOwnerV1 }
  | { ok: false; code: 'INPUT_REFUSED' | 'INSTALLATION_REFUSED' } {
  try {
    const c = closed(capture(input), [
      'domain',
      'fixtureId',
      'workflowId',
      'generationId',
      'scopes',
    ])
    if (
      c.domain !== 'offline-fixture/v1' ||
      typeof c.fixtureId !== 'string' ||
      !/^[A-Za-z0-9-]{1,64}$/.test(c.fixtureId)
    )
      fail('INPUT_REFUSED')
    const workflowId = id(c.workflowId)
    id(c.generationId)
    if (!Array.isArray(c.scopes) || c.scopes.length < 1 || c.scopes.length > 128)
      fail('INPUT_REFUSED')
    const declarations = new Map<string, OfflinePublicationInputV1['scopes'][number]>()
    for (const raw of c.scopes) {
      const s = closed(raw, [
        'scopeId',
        'trustScopeId',
        'requestedIdentities',
        'policyExpiresAtUtc',
      ])
      const scopeId = id(s.scopeId),
        trustScopeId = id(s.trustScopeId)
      if (
        declarations.has(scopeId) ||
        !Array.isArray(s.requestedIdentities) ||
        s.requestedIdentities.length < 1
      )
        fail('INPUT_REFUSED')
      const identities = s.requestedIdentities.map(identity)
      for (let i = 1; i < identities.length; i++)
        if ((identities[i - 1]?.id ?? '') >= (identities[i]?.id ?? '')) fail('INPUT_REFUSED')
      declarations.set(
        scopeId,
        Object.freeze({
          scopeId,
          trustScopeId,
          requestedIdentities: Object.freeze(identities),
          policyExpiresAtUtc: utc(s.policyExpiresAtUtc),
        }),
      )
    }
    let r: OfflinePublicationRuntimeV1
    try {
      r = runtime(rawRuntime)
    } catch {
      fail('INSTALLATION_REFUSED')
    }
    let last: ClockReadingV1 | null = null
    let clockFault = () => {}
    const now = (): ClockReadingV1 => {
      try {
        const x = closed(r.readClock(), ['utc', 'monoMs'])
        const t = { utc: utc(x.utc), monoMs: mono(x.monoMs) }
        if (last && (t.utc < last.utc || t.monoMs < last.monoMs)) fail('INSTALLATION_REFUSED')
        last = t
        return t
      } catch {
        clockFault()
        fail('INSTALLATION_REFUSED')
      }
    }
    const initial = now()
    for (const d of declarations.values())
      if (d.policyExpiresAtUtc <= initial.utc) fail('INSTALLATION_REFUSED')
    // Every clock read in this installation, including transport reads, crosses
    // the same validated history. The independent native factory is unchanged.
    const transport = createOfflineMetadataTransportV1({ ...r, readClock: now })
    if (!transport.ok) fail('INSTALLATION_REFUSED')
    const scopes = new WeakMap<object, Scope>(),
      registered = new Set<string>(),
      operations = new WeakMap<object, Operation>(),
      handles = new WeakMap<object, Publication>(),
      live = new Set<Operation>()
    const refused = (code: RefreshCode): RefreshResult => Object.freeze({ kind: 'refused', code })
    const release = (o: Operation) => {
      if (o.released || o.running) return
      o.released = true
      live.delete(o)
    }
    const finishLatch = (o: Operation) => {
      if (o.timer) {
        const timer = o.timer
        o.timer = null
        try {
          r.clearWake(timer)
        } catch {}
      }
      release(o)
    }
    const settle = (o: Operation, value: RefreshResult) => {
      if (o.result) return
      o.result = value
      o.deliver(value)
      finishLatch(o)
    }
    const deny = (o: Operation, code: RefreshCode) => {
      if (o.result) return
      settle(o, refused(code))
      try {
        o.controller.abort()
      } catch {}
    }
    clockFault = () => {
      const affected = [...live].filter((o) => !o.result)
      // Latch the entire bounded set before any timer/abort callback can reenter
      // and settle a sibling operation with a different outcome.
      for (const o of affected) {
        o.result = refused('INSTALLATION_REFUSED')
        o.deliver(o.result)
      }
      for (const o of affected) {
        finishLatch(o)
        try {
          o.controller.abort()
        } catch {}
      }
    }
    const check = (o: Operation, t: ClockReadingV1) => {
      if (o.result) return false
      if (t.monoMs >= o.deadline) {
        deny(o, 'DEADLINE_EXCEEDED')
        return false
      }
      if (t.utc >= o.scope.declaration.policyExpiresAtUtc) {
        deny(o, 'INSTALLATION_REFUSED')
        return false
      }
      return true
    }
    const schedule = (o: Operation, delay: number) => {
      o.scheduling = true
      try {
        const t = closed(
          r.scheduleWake(delay, () => {
            if (o.result) return
            try {
              const n = now()
              if (!check(o, n)) return
              if (o.scheduling) {
                deny(o, 'INSTALLATION_REFUSED')
                return
              }
              schedule(o, o.deadline - n.monoMs)
            } catch {
              deny(o, 'INSTALLATION_REFUSED')
            }
          }),
          ['timer'],
        )
        if (typeof t.timer !== 'object' || t.timer === null) fail('INSTALLATION_REFUSED')
        o.timer = t.timer
        if (o.result) {
          try {
            r.clearWake(o.timer)
          } catch {}
          o.timer = null
        }
      } finally {
        o.scheduling = false
      }
    }
    const expire = () => {
      const t = now()
      for (const o of live) check(o, t)
      return t
    }
    const read = (raw: unknown, absence: boolean): CatalogRead | AbsenceRead => {
      try {
        const q = closed(
          raw,
          absence
            ? ['scope', 'handle', 'identity', 'expectedGeneration']
            : ['scope', 'handle', 'expectedGeneration'],
        )
        const capturedIdentity = absence ? identity(capture(q.identity)) : null
        const scope = scopes.get(q.scope as object)
        if (!scope) fail('SCOPE_REFUSED')
        const p = handles.get(q.handle as object)
        if (!p) fail('HANDLE_REFUSED')
        if (p.scope !== scope) fail('SCOPE_REFUSED')
        const generation = uint(q.expectedGeneration)
        if (scope.current !== p || generation !== scope.generation) fail('GENERATION_REFUSED')
        const t = now()
        if (scope.current !== p || generation !== scope.generation) fail('GENERATION_REFUSED')
        if (t.utc >= p.provenance.validUntilUtc || t.utc >= scope.declaration.policyExpiresAtUtc)
          fail('EXPIRED')
        if (absence) {
          const i = capturedIdentity as Identity
          if (
            p.candidate.kind !== 'complete-response-with-absence' ||
            !p.candidate.absentIdentities.some((x) => same(x as Identity, i))
          )
            fail('IDENTITY_NOT_ABSENT')
          return Object.freeze({
            ok: true,
            identity: i,
            requestedIdentities: scope.declaration.requestedIdentities,
            generation,
            provenance: p.provenance,
          })
        }
        if (p.candidate.kind !== 'catalog') fail('CURRENT_ABSENCE')
        return Object.freeze({
          ok: true,
          canonicalBytes: new ByteArray(p.candidate.canonicalBytes),
          expectedSha256: p.candidate.canonicalSha256,
          acceptedSource: p.candidate.acceptedSource,
          provenance: p.provenance,
        })
      } catch (e) {
        return Object.freeze({ ok: false, code: codeOf(e) as ReadCode })
      }
    }
    const owner: CatalogPublicationOwnerV1 = Object.freeze({
      domain: 'offline-fixture/v1',
      registerCatalogScopeV1(raw) {
        try {
          const q = closed(capture(raw), ['scopeId'])
          const name = id(q.scopeId),
            d = declarations.get(name)
          if (!d || registered.has(name)) fail('INPUT_REFUSED')
          if (now().utc >= d.policyExpiresAtUtc) fail('INSTALLATION_REFUSED')
          if (registered.has(name)) fail('INPUT_REFUSED')
          const handle = Object.freeze({})
          scopes.set(handle, { declaration: d, handle, generation: 0, current: null })
          registered.add(name)
          return Object.freeze({ ok: true, scope: handle })
        } catch (e) {
          return Object.freeze({
            ok: false,
            code: codeOf(e) as 'INPUT_REFUSED' | 'INSTALLATION_REFUSED',
          })
        }
      },
      registerRefreshOperationV1(raw): OperationRegistrationResult {
        try {
          const q = closed(raw, ['scope', 'expectedGeneration', 'deadlineMonoMs'])
          const s = scopes.get(q.scope as object)
          if (!s) fail('INPUT_REFUSED')
          const expected = uint(q.expectedGeneration),
            requested = mono(q.deadlineMonoMs),
            t = expire()
          if (t.utc >= s.declaration.policyExpiresAtUtc) fail('INSTALLATION_REFUSED')
          if (requested <= t.monoMs) fail('DEADLINE_EXCEEDED')
          if (live.size >= 4) fail('CAPACITY_REFUSED')
          let deliver: Operation['deliver'] = () => {}
          const promise = new Promise<RefreshResult>((res) => {
            deliver = res
          })
          const o: Operation = {
            scope: s,
            expected,
            deadline: Math.min(requested, t.monoMs + 10000),
            handle: Object.freeze({}),
            cancel: Object.freeze({}),
            controller: new AbortController(),
            timer: null,
            invoked: false,
            running: false,
            released: false,
            result: null,
            deliver,
            promise,
            scheduling: false,
            materializationRefusal: null,
          }
          operations.set(o.handle, o)
          live.add(o)
          try {
            schedule(o, o.deadline - t.monoMs)
          } catch {
            deny(o, 'INSTALLATION_REFUSED')
          }
          if (o.result)
            return Object.freeze({
              ok: false,
              code:
                o.result.kind === 'refused' && o.result.code === 'DEADLINE_EXCEEDED'
                  ? 'DEADLINE_EXCEEDED'
                  : 'INSTALLATION_REFUSED',
            })
          return Object.freeze({ ok: true, operation: o.handle, cancellation: o.cancel })
        } catch (e) {
          return Object.freeze({
            ok: false,
            code: codeOf(e) as
              | 'INPUT_REFUSED'
              | 'CAPACITY_REFUSED'
              | 'DEADLINE_EXCEEDED'
              | 'INSTALLATION_REFUSED',
          })
        }
      },
      cancelRefreshOperationV1(raw) {
        try {
          const q = closed(raw, ['operation', 'cancellation']),
            o = operations.get(q.operation as object)
          if (!o || q.cancellation !== o.cancel) fail('INPUT_REFUSED')
          if (o.result)
            return Object.freeze({
              ok: true,
              outcome:
                o.result.kind === 'refused' && o.result.code === 'CANCELLED'
                  ? 'already-cancelled'
                  : 'already-settled',
            })
          deny(o, 'CANCELLED')
          return Object.freeze({ ok: true, outcome: 'cancelled' })
        } catch (e) {
          return Object.freeze({
            ok: false,
            code: codeOf(e) as 'INPUT_REFUSED' | 'INSTALLATION_REFUSED',
          })
        }
      },
      requestCatalogRefreshV1(raw) {
        let selected: Operation | undefined
        try {
          const q = closed(raw, ['operation'])
          const found = operations.get(q.operation as object)
          if (!found || found.invoked) return Promise.resolve(refused('INPUT_REFUSED'))
          const o = found
          selected = o
          o.invoked = true
          if (o.result) return o.promise
          if (!check(o, now())) return o.promise
        } catch (e) {
          if (selected) {
            deny(selected, codeOf(e) as RefreshCode)
            return selected.promise
          }
          return Promise.resolve(refused(codeOf(e) as RefreshCode))
        }
        const o = selected
        o.running = true
        const original = transport.transport.readMetadataV1({
          deadlineMonoMs: o.deadline,
          signal: o.controller.signal,
        })
        original
          .then(
            (value) => {
              if (o.result) return
              try {
                if (!check(o, now())) return
                const v = closed(value, [
                  'status',
                  'mediaType',
                  'contentEncoding',
                  'requestStartedAtUtc',
                  'completeReceivedAtUtc',
                  'complete',
                  'bytes',
                ])
                if (
                  v.status !== 200 ||
                  v.mediaType !== 'application/json' ||
                  v.contentEncoding !== 'identity' ||
                  v.complete !== true
                )
                  fail('TRANSPORT_REFUSED')
                const rawBytes = bytes(v.bytes),
                  started = utc(v.requestStartedAtUtc),
                  received = utc(v.completeReceivedAtUtc),
                  t = now()
                if (started > received || received > t.utc) fail('TRANSPORT_REFUSED')
                const candidate = materializePublicModelResponseV1({
                  bytes: rawBytes,
                  requestedIdentities: o.scope.declaration.requestedIdentities,
                  profile,
                  endpoint,
                  domain,
                  requestStartedAtUtc: started,
                  completeReceivedAtUtc: received,
                  evaluationTimeUtc: t.utc,
                  complete: true,
                })
                if (!candidate.ok) {
                  o.materializationRefusal = candidate.code
                  deny(
                    o,
                    candidate.code === 'COMPLETENESS_UNPROVEN'
                      ? 'COMPLETENESS_UNPROVEN'
                      : 'MATERIALIZATION_REFUSED',
                  )
                  return
                }
                if (
                  candidate.kind === 'catalog' &&
                  !readCatalogSnapshot(candidate.canonicalBytes, candidate.canonicalSha256).ok
                )
                  fail('MATERIALIZATION_REFUSED')
                const finalTime = now()
                if (!check(o, finalTime)) return
                if (o.scope.generation !== o.expected || o.expected === Number.MAX_SAFE_INTEGER) {
                  deny(o, 'PUBLICATION_CONFLICT')
                  return
                }
                const generation = o.expected + 1,
                  validUntilUtc = new Date(
                    Math.min(
                      Date.parse(o.scope.declaration.policyExpiresAtUtc),
                      Date.parse(received) + (candidate.kind === 'catalog' ? 86400000 : 30000),
                    ),
                  ).toISOString()
                if (finalTime.utc >= validUntilUtc) {
                  deny(o, 'DEADLINE_EXCEEDED')
                  return
                }
                const provenance: PublicationProvenance = Object.freeze({
                  workflowId,
                  trustScopeId: o.scope.declaration.trustScopeId,
                  profile,
                  endpoint,
                  domain,
                  generation,
                  sourceSha256: createHash('sha256').update(rawBytes).digest('hex'),
                  requestStartedAtUtc: started,
                  completeReceivedAtUtc: received,
                  validUntilUtc,
                })
                const handle = Object.freeze({}),
                  publication: Publication = {
                    handle,
                    scope: o.scope,
                    generation,
                    candidate,
                    provenance,
                    raw: rawBytes,
                  }
                const previous = o.scope.current
                if (previous) handles.delete(previous.handle)
                handles.set(handle, publication)
                o.scope.current = publication
                o.scope.generation = generation
                settle(
                  o,
                  candidate.kind === 'catalog'
                    ? Object.freeze({ kind: 'published', handle, generation })
                    : Object.freeze({
                        kind: 'absent',
                        handle,
                        generation,
                        requestedIdentities: o.scope.declaration.requestedIdentities,
                        absentIdentities: candidate.absentIdentities as readonly Identity[],
                      }),
                )
              } catch (e) {
                deny(
                  o,
                  (codeOf(e) === 'INPUT_REFUSED' ? 'TRANSPORT_REFUSED' : codeOf(e)) as RefreshCode,
                )
              }
            },
            (error) => {
              if (o.result) return
              let code: RefreshCode = 'TRANSPORT_REFUSED'
              try {
                const r = closed(error, ['code'])
                if (
                  r.code === 'INSTALLATION_REFUSED' ||
                  r.code === 'CANCELLED' ||
                  r.code === 'DEADLINE_EXCEEDED'
                )
                  code = r.code
              } catch {}
              deny(o, code)
            },
          )
          .finally(() => {
            o.running = false
            release(o)
          })
        return o.promise
      },
      acquirePublishedCatalogV1: (raw) => read(raw, false) as CatalogRead,
      verifyAbsenceV1: (raw) => read(raw, true) as AbsenceRead,
    })
    return Object.freeze({ ok: true, owner })
  } catch (e) {
    return Object.freeze({
      ok: false,
      code: codeOf(e) === 'INSTALLATION_REFUSED' ? 'INSTALLATION_REFUSED' : 'INPUT_REFUSED',
    })
  }
}
