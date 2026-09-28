import { createHash, randomUUID } from 'node:crypto'
import type { ClientRequest, IncomingMessage } from 'node:http'
import https from 'node:https'
import type { Observation } from './controller-types.js'
import {
  fields,
  PmcChatStreamV1,
  type ResponseProfile,
  type StreamResult,
} from './openrouter-chat-stream.js'

export type SendResult = Readonly<{ observation: Observation; stream: StreamResult | null }>
/** Installation-private one-shot terminal, never exported from the package barrel. */
export function createOwnedHttpsSenderV1(
  body: string,
  profile: ResponseProfile,
  credentialSupplier: () => unknown,
  signal: AbortSignal,
  onResponse?: (
    metadata: Readonly<{ status: number; headers: Record<string, string> }>,
  ) => void | Promise<void>,
): () => Promise<SendResult> {
  const bytes = Buffer.from(body, 'utf8')
  let used = false
  return async () => {
    if (used) return { observation: { kind: 'uncertain', code: 'PROOF_REFUSED' }, stream: null }
    used = true
    if (signal.aborted) return { observation: { kind: 'no-send', code: 'ABORTED' }, stream: null }
    let credential: unknown
    try {
      credential = credentialSupplier()
    } catch {
      return { observation: { kind: 'no-send', code: 'CREDENTIAL_REFUSED' }, stream: null }
    }
    if (
      typeof credential !== 'string' ||
      !credential.length ||
      credential.length > 8192 ||
      !/^[A-Za-z0-9._~+/=-]+$/.test(credential)
    )
      return { observation: { kind: 'no-send', code: 'CREDENTIAL_REFUSED' }, stream: null }
    if (signal.aborted) return { observation: { kind: 'no-send', code: 'ABORTED' }, stream: null }
    return new Promise<SendResult>((resolve) => {
      let request: ClientRequest | undefined,
        response: IncomingMessage | undefined,
        settled = false,
        destroyed = false,
        began = false
      let idle: ReturnType<typeof setTimeout> | undefined
      const destroy = () => {
        if (destroyed) return
        destroyed = true
        try {
          response?.destroy()
        } catch {}
        try {
          request?.destroy()
        } catch {}
      }
      const finish = (result: SendResult) => {
        if (settled) return
        settled = true
        clearTimeout(deadline)
        clearTimeout(idle)
        signal.removeEventListener('abort', abort)
        destroy()
        resolve(Object.freeze(result))
      }
      const fail = (code: 'HTTP_UNCERTAIN' | 'STREAM_UNCERTAIN' | 'ABORTED') =>
        finish({
          observation: began ? { kind: 'uncertain', code } : { kind: 'no-send', code },
          stream: null,
        })
      const abort = () => fail('ABORTED')
      const touch = () => {
        clearTimeout(idle)
        idle = setTimeout(() => fail('STREAM_UNCERTAIN'), 30000)
      }
      const deadline = setTimeout(() => fail('HTTP_UNCERTAIN'), 120000)
      signal.addEventListener('abort', abort, { once: true })
      touch()
      try {
        if (signal.aborted) {
          abort()
          return
        }
        // The marker precedes the constructor. Even a synchronous constructor
        // exception cannot prove that the owned operation never began.
        began = true
        request = https.request(
          {
            protocol: 'https:',
            hostname: 'openrouter.ai',
            port: 443,
            path: '/api/v1/chat/completions',
            method: 'POST',
            agent: false,
            rejectUnauthorized: true,
            maxHeaderSize: 16384,
            headers: {
              'content-type': 'application/json',
              accept: 'text/event-stream',
              authorization: `Bearer ${credential}`,
              'content-length': bytes.byteLength,
            },
          },
          (res) => {
            response = res
            if (settled) {
              destroyed = false
              destroy()
              return
            }
            res.on('error', () => fail('STREAM_UNCERTAIN'))
            res.on('aborted', () => fail('STREAM_UNCERTAIN'))
            let ended = false
            res.on('close', () => {
              if (!ended && !settled) fail('STREAM_UNCERTAIN')
            })
            try {
              const headers: Record<string, string> = {}
              let size = 0
              for (const [key, value] of Object.entries(res.headers)) {
                if (typeof value !== 'string') throw new Error('HEADERS')
                size += Buffer.byteLength(key) + Buffer.byteLength(value) + 4
                if (size > 16384) throw new Error('HEADERS')
                headers[key] = value
              }
              if (
                res.statusCode !== 200 ||
                res.headers['content-encoding'] !== undefined ||
                !/^text\/event-stream(?:;\s*charset=utf-8)?$/i.test(headers['content-type'] ?? '')
              )
                throw new Error('HTTP')
              const parser = new PmcChatStreamV1(profile)
              let hookFailed = false
              // A captured response hook is local-only. Its failure affects
              // semantics, not whether a subsequently authenticated charge exists.
              const hook = Promise.resolve()
                .then(() =>
                  onResponse?.(Object.freeze({ status: 200, headers: Object.freeze(headers) })),
                )
                .catch(() => {
                  hookFailed = true
                })
              void hook
                .then(() => {
                  if (settled) return
                  res.on('data', (chunk: unknown) => {
                    if (settled) return
                    try {
                      if (!(chunk instanceof Uint8Array)) throw new Error('BYTES')
                      touch()
                      parser.push(chunk)
                    } catch {
                      fail('STREAM_UNCERTAIN')
                    }
                  })
                  res.on('end', () => {
                    ended = true
                    if (settled) return
                    try {
                      if (!res.complete) throw new Error('INCOMPLETE')
                      const stream = parser.finish()
                      const observation: Observation =
                        hookFailed && stream.observation.kind === 'response'
                          ? { ...stream.observation, semantic: 'failed' }
                          : stream.observation
                      finish({ observation, stream })
                    } catch {
                      fail('STREAM_UNCERTAIN')
                    }
                  })
                  res.resume()
                })
                .catch(() => fail('STREAM_UNCERTAIN'))
            } catch {
              fail('HTTP_UNCERTAIN')
            }
          },
        )
        request.on('error', () => fail('HTTP_UNCERTAIN'))
        if (settled) {
          destroyed = false
          destroy()
          return
        }
        request.write(bytes)
        request.end()
      } catch {
        fail('HTTP_UNCERTAIN')
      }
    })
  }
}

const attemptKeys = [
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
] as const
const immutableAttemptKeys = [
  'ledgerId',
  'epoch',
  'requestId',
  'scopeId',
  'requestDigest',
  'costValueDigest',
  'maximumMicroUsd',
  'createdAtUtc',
] as const
const denied = () => Object.freeze({ accepted: false as const })
function timestamp(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString() === value
  )
}

/** One invocation, one retained proof. Installation separates these capabilities:
 * D gets register, C gets observe, ledger gets only the two authenticators. */
export function createTerminalObservationRegistryV1(clock: () => unknown) {
  let record:
    | Readonly<{
        proof: object
        route: object
        decision: object
        wire: object
        consumed: Record<string, unknown>
        consumedIdentity: object
        observation: Observation
        proofId: string
        proofDigest: string
      }>
    | undefined
  let observedInvocation: object | undefined
  const register = (
    proof: object,
    route: object,
    decision: object,
    wire: object,
    consumed: unknown,
    observation: Observation,
  ) => {
    try {
      if (record || !Object.isFrozen(proof) || Reflect.ownKeys(proof).length) return denied()
      const a = fields(consumed, attemptKeys)
      if (
        a.state !== 'consumed' ||
        a.actualMicroUsd !== null ||
        a.proofRef !== null ||
        a.proofDigest !== null ||
        !timestamp(a.createdAtUtc) ||
        !timestamp(a.updatedAtUtc) ||
        a.updatedAtUtc < a.createdAtUtc
      )
        return denied()
      for (const k of [
        'ledgerId',
        'epoch',
        'requestId',
        'scopeId',
        'requestDigest',
        'costValueDigest',
      ])
        if (typeof a[k] !== 'string' || !(a[k] as string).length || (a[k] as string).length > 128)
          return denied()
      if (!Number.isSafeInteger(a.maximumMicroUsd) || Number(a.maximumMicroUsd) < 0) return denied()
      let owned: Observation
      const o = fields(
        observation,
        observation.kind === 'response' ? ['kind', 'semantic', 'charge'] : ['kind', 'code'],
      )
      if (o.kind === 'response') {
        if (!['stop', 'length', 'failed'].includes(String(o.semantic))) return denied()
        const c = fields(
          o.charge,
          observation.kind === 'response' && observation.charge.kind === 'known'
            ? ['kind', 'actualMicroUsd']
            : ['kind', 'reason'],
        )
        if (c.kind === 'known') {
          if (!Number.isSafeInteger(c.actualMicroUsd) || Number(c.actualMicroUsd) < 0)
            return denied()
        } else if (
          c.kind !== 'unknown' ||
          !['missing', 'malformed', 'precision', 'incomplete'].includes(String(c.reason))
        )
          return denied()
        owned = Object.freeze({
          ...observation,
          charge: Object.freeze({
            ...(observation.kind === 'response'
              ? observation.charge
              : { kind: 'unknown' as const, reason: 'incomplete' as const }),
          }),
        }) as Observation
      } else if (o.kind === 'no-send' || o.kind === 'uncertain')
        owned = Object.freeze({ ...observation })
      else return denied()
      const proofId = `pmc-proof-${randomUUID()}`,
        snapshot = Object.freeze({ ...a })
      const proofDigest = createHash('sha256')
        .update(JSON.stringify([proofId, snapshot, owned]))
        .digest('hex')
      record = Object.freeze({
        proof,
        route,
        decision,
        wire,
        consumed: snapshot,
        consumedIdentity: consumed as object,
        observation: owned,
        proofId,
        proofDigest,
      })
      return Object.freeze({ accepted: true as const, proofId })
    } catch {
      return denied()
    }
  }
  const observe = (proof: object, invocation: object, current: unknown) => {
    try {
      if (
        !record ||
        proof !== record.proof ||
        !invocation ||
        typeof invocation !== 'object' ||
        (observedInvocation && observedInvocation !== invocation)
      )
        return denied()
      const c = fields(current, ['request', 'decision', 'wire', 'consumed'])
      const request = c.request as { route?: unknown }
      const route = Object.getOwnPropertyDescriptor(request, 'route')
      if (
        !route ||
        !('value' in route) ||
        route.value !== record.route ||
        c.decision !== record.decision ||
        c.wire !== record.wire ||
        c.consumed !== record.consumedIdentity
      )
        return denied()
      observedInvocation = invocation
      return Object.freeze({
        accepted: true as const,
        proofId: record.proofId,
        observation: record.observation,
      })
    } catch {
      return denied()
    }
  }
  const authenticate = (attempt: unknown, rawProof: unknown, noSend: boolean) => {
    try {
      const r = record
      if (
        !r ||
        !observedInvocation ||
        fields(rawProof, ['proofId']).proofId !== r.proofId ||
        (r.observation.kind === 'no-send') !== noSend
      )
        return denied()
      const a = fields(attempt, attemptKeys),
        now = clock()
      if (
        !timestamp(now) ||
        !timestamp(a.updatedAtUtc) ||
        a.updatedAtUtc < String(r.consumed.updatedAtUtc) ||
        a.updatedAtUtc > now ||
        immutableAttemptKeys.some((k) => a[k] !== r.consumed[k])
      )
        return denied()
      const known = r.observation.kind === 'response' && r.observation.charge.kind === 'known'
      const actual =
        known && r.observation.kind === 'response' && r.observation.charge.kind === 'known'
          ? r.observation.charge.actualMicroUsd
          : null
      const state = noSend ? 'cancelled' : known ? 'settled' : 'uncertain'
      if (a.state === 'consumed') {
        if (attemptKeys.some((k) => a[k] !== r.consumed[k])) return denied()
      } else if (
        a.state !== state ||
        a.actualMicroUsd !== actual ||
        a.proofRef !== r.proofId ||
        a.proofDigest !== r.proofDigest
      )
        return denied()
      return Object.freeze({
        accepted: true as const,
        ledgerId: a.ledgerId,
        epoch: a.epoch,
        requestId: a.requestId,
        requestDigest: a.requestDigest,
        scopeId: a.scopeId,
        proofRef: r.proofId,
        proofDigest: r.proofDigest,
        ...(noSend
          ? { noSend: true as const }
          : {
              outcome: known
                ? { kind: 'known' as const, actualMicroUsd: actual }
                : { kind: 'unknown' as const },
            }),
      })
    } catch {
      return denied()
    }
  }
  return Object.freeze({
    register,
    observe,
    authenticateSettlement: (a: unknown, p: unknown) => authenticate(a, p, false),
    authenticateNoSendProof: (a: unknown, p: unknown) => authenticate(a, p, true),
  })
}
