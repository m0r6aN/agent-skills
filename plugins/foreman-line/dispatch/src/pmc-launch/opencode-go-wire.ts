import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import { wellFormed } from './openrouter-chat-stream.js'

const VERSION = 'opencode-go-no-tools-wire/v1'
const MODEL = 'mimo-v2.6-pro'
const PREPARED = Symbol('opencode-go-prepared')

export type OpenCodeGoInputV1 = Readonly<{
  version: typeof VERSION
  requestDigest: string
  decisionDigest: string
  sessionId: string
  system: string
  user: string
}>
export type PreparedOpenCodeGoV1 = Readonly<{ readonly [PREPARED]: true }>
export type OpenCodeGoRefusal = Readonly<{
  ok: false
  code: 'INPUT_REFUSED' | 'BOUNDS_REFUSED' | 'PREPARED_REFUSED'
}>
export type OpenCodeGoPrepared = Readonly<{
  ok: true
  prepared: PreparedOpenCodeGoV1
  requestDigest: string
  decisionDigest: string
  bodyDigest: string
}>
export type OpenCodeGoPrepareResult = OpenCodeGoPrepared | OpenCodeGoRefusal

type Captured = {
  bytes: Buffer
  requestDigest: string
  decisionDigest: string
  bodyDigest: string
  sessionId: string
}

function plainDataRecord(value: unknown, keys: readonly string[]): Record<string, unknown> | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return null
  const proto = Object.getPrototypeOf(value)
  if (proto !== Object.prototype && proto !== null) return null
  const own = Reflect.ownKeys(value)
  if (
    own.length !== keys.length ||
    own.some((key) => typeof key !== 'string' || !keys.includes(key))
  )
    return null
  const out: Record<string, unknown> = Object.create(null)
  for (const key of keys) {
    const d = Object.getOwnPropertyDescriptor(value, key)
    if (!d?.enumerable || !('value' in d)) return null
    out[key] = d.value
  }
  return out
}

function sha256(text: string | Buffer): string {
  return createHash('sha256').update(text).digest('hex')
}

export function createOpenCodeGoWireV1(): Readonly<{
  prepare(input: unknown): OpenCodeGoPrepareResult
}> {
  const owned = new WeakMap<object, Captured>()
  const api = Object.freeze({
    prepare(input: unknown): OpenCodeGoPrepareResult {
      try {
        const r = plainDataRecord(input, [
          'version',
          'requestDigest',
          'decisionDigest',
          'sessionId',
          'system',
          'user',
        ])
        if (!r || r.version !== VERSION) return { ok: false, code: 'INPUT_REFUSED' }
        if (
          typeof r.requestDigest !== 'string' ||
          r.requestDigest.length !== 64 ||
          !/^[0-9a-f]{64}$/.test(r.requestDigest) ||
          typeof r.decisionDigest !== 'string' ||
          r.decisionDigest.length !== 64 ||
          !/^[0-9a-f]{64}$/.test(r.decisionDigest) ||
          typeof r.sessionId !== 'string' ||
          r.sessionId.length < 1 ||
          r.sessionId.length > 128 ||
          !/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(r.sessionId) ||
          typeof r.system !== 'string' ||
          typeof r.user !== 'string' ||
          !r.system ||
          !r.user ||
          r.system.length > 4096 ||
          r.user.length > 4096 ||
          !wellFormed(r.system) ||
          !wellFormed(r.user)
        )
          return { ok: false, code: 'INPUT_REFUSED' }
        const messages = JSON.stringify([
          { role: 'system', content: r.system },
          { role: 'user', content: r.user },
        ])
        if (Buffer.byteLength(messages, 'utf8') > 4096) return { ok: false, code: 'BOUNDS_REFUSED' }
        const body = JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: r.system },
            { role: 'user', content: r.user },
          ],
          stream: false,
          max_completion_tokens: 1024,
          thinking: { type: 'disabled' },
        })
        const bytes = Buffer.from(body, 'utf8')
        if (bytes.length > 8192) return { ok: false, code: 'BOUNDS_REFUSED' }
        const prepared = Object.freeze(Object.create(null)) as PreparedOpenCodeGoV1
        const bodyDigest = sha256(bytes)
        owned.set(prepared, {
          bytes: Buffer.from(bytes),
          requestDigest: r.requestDigest,
          decisionDigest: r.decisionDigest,
          bodyDigest,
          sessionId: r.sessionId,
        })
        return Object.freeze({
          ok: true,
          prepared,
          requestDigest: r.requestDigest,
          decisionDigest: r.decisionDigest,
          bodyDigest,
        })
      } catch {
        return { ok: false, code: 'INPUT_REFUSED' }
      }
    },
  })
  allPrepared.set(api, owned)
  return api
}

export function inspectPreparedOpenCodeGoV1(
  value: unknown,
  owner: ReturnType<typeof createOpenCodeGoWireV1>,
): Readonly<Captured> | null {
  if (value === null || typeof value !== 'object') return null
  // Closure identity is retained privately on the function object through a module WeakMap.
  const captured = allPrepared.get(owner)?.get(value)
  return captured ? Object.freeze({ ...captured, bytes: Buffer.from(captured.bytes) }) : null
}

const allPrepared = new WeakMap<object, WeakMap<object, Captured>>()
