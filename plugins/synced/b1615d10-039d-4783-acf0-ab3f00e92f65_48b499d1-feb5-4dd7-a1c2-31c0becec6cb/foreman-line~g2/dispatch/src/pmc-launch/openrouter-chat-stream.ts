import type {
  Charge,
  TransportCode as ControllerTransportCode,
  Observation,
} from './controller-types.js'

export type TransportCode = ControllerTransportCode | 'OUTPUT_TRUNCATED'
export class TransportError extends Error {
  constructor(readonly code: TransportCode) {
    super(code)
    this.name = 'TransportError'
  }
}
export function refuse(code: TransportCode): never {
  throw new TransportError(code)
}
export function wellFormed(text: string): boolean {
  for (let i = 0; i < text.length; i++) {
    const n = text.charCodeAt(i)
    if (n >= 0xd800 && n <= 0xdbff) {
      const next = text.charCodeAt(++i)
      if (!(next >= 0xdc00 && next <= 0xdfff)) return false
    } else if (n >= 0xdc00 && n <= 0xdfff) return false
  }
  return true
}

/** Bounded scanner: JSON.parse is used only for a single already-bounded string token. */
export function parseJsonV1(
  source: string,
  kind: 'payload' | 'event',
): { value: unknown; numbers: ReadonlyMap<string, string> } {
  const code = kind === 'payload' ? 'PAYLOAD_REFUSED' : 'STREAM_UNCERTAIN'
  if (
    typeof source !== 'string' ||
    !wellFormed(source) ||
    source.length > (kind === 'payload' ? 262144 : 131072) ||
    Buffer.byteLength(source, 'utf8') > (kind === 'payload' ? 1048576 : 131072)
  )
    refuse(code)
  let at = 0,
    remaining = kind === 'payload' ? 65536 : 16384
  const numbers = new Map<string, string>()
  const whitespace = () => {
    while (' \r\n\t'.includes(source[at] ?? '\0')) at++
  }
  const string = (): string => {
    const begin = at++
    while (at < source.length) {
      const ch = source[at++]
      if (ch === '\\') {
        at++
        continue
      }
      if (ch === '"') {
        let value: unknown
        try {
          value = JSON.parse(source.slice(begin, at))
        } catch {
          refuse(code)
        }
        if (typeof value !== 'string' || !wellFormed(value)) refuse(code)
        return value
      }
    }
    return refuse(code)
  }
  const value = (depth: number, path: string): unknown => {
    if (depth > 16 || --remaining < 0) refuse(code)
    whitespace()
    if (source[at] === '"') return string()
    if (source[at] === '{') {
      at++
      whitespace()
      const out: Record<string, unknown> = {},
        seen = new Set<string>()
      if (source[at] === '}') {
        at++
        return out
      }
      while (at < source.length) {
        if (source[at] !== '"') refuse(code)
        const key = string()
        if (seen.has(key)) refuse(code)
        seen.add(key)
        whitespace()
        if (source[at++] !== ':') refuse(code)
        const child = value(depth + 1, `${path}/${key.replaceAll('~', '~0').replaceAll('/', '~1')}`)
        Object.defineProperty(out, key, {
          value: child,
          enumerable: true,
          writable: true,
          configurable: true,
        })
        whitespace()
        if (source[at] === '}') {
          at++
          return out
        }
        if (source[at++] !== ',') refuse(code)
        whitespace()
      }
      refuse(code)
    }
    if (source[at] === '[') {
      at++
      whitespace()
      const out: unknown[] = []
      if (source[at] === ']') {
        at++
        return out
      }
      while (at < source.length) {
        out.push(value(depth + 1, `${path}/${out.length}`))
        whitespace()
        if (source[at] === ']') {
          at++
          return out
        }
        if (source[at++] !== ',') refuse(code)
      }
      refuse(code)
    }
    for (const [token, literal] of [
      ['true', true],
      ['false', false],
      ['null', null],
    ] as const) {
      if (source.startsWith(token, at)) {
        at += token.length
        return literal
      }
    }
    const matched = /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/.exec(source.slice(at))
    if (!matched || !Number.isFinite(Number(matched[0]))) refuse(code)
    at += matched[0].length
    numbers.set(path, matched[0])
    return Number(matched[0])
  }
  const result = value(0, '')
  whitespace()
  if (at !== source.length) refuse(code)
  return { value: result, numbers }
}

export function parseAccountChargeV1(raw: unknown): Charge {
  if (raw === undefined) return { kind: 'unknown', reason: 'missing' }
  if (typeof raw !== 'string' || raw.length > 64) return { kind: 'unknown', reason: 'malformed' }
  const m = /^(0|[1-9][0-9]*)(?:\.([0-9]+))?(?:[eE]([+-]?[0-9]+))?$/.exec(raw)
  if (!m) return { kind: 'unknown', reason: 'malformed' }
  const exponent = Number(m[3] ?? 0)
  if (Math.abs(exponent) > 18) return { kind: 'unknown', reason: 'precision' }
  const digits = BigInt(`${m[1]}${m[2] ?? ''}`),
    scale = (m[2]?.length ?? 0) - exponent - 6
  const numerator = scale < 0 ? digits * 10n ** BigInt(-scale) : digits
  const denominator = scale > 0 ? 10n ** BigInt(scale) : 1n
  if (numerator % denominator !== 0n || numerator / denominator > BigInt(Number.MAX_SAFE_INTEGER))
    return { kind: 'unknown', reason: 'precision' }
  return { kind: 'known', actualMicroUsd: Number(numerator / denominator) }
}

export type ResponseProfile = Readonly<{
  responseModel: string
  responseProvider: string
  maximumInputTokens: number
  maximumOutputTokens: number
  cacheAllowed: boolean
}>
export type ValidatedUsage = Readonly<{
  input: number
  output: number
  total: number
  cached: number | null
  cacheWrite: number | null
  audio: number | null
  reasoning: number | null
}>
export type StreamResult = Readonly<{
  observation: Observation
  text: string
  usage: ValidatedUsage
  responseId: string
  costLexeme: string | null
}>
export function fields(
  value: unknown,
  required: readonly string[],
  optional: readonly string[] = [],
): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) refuse('STREAM_UNCERTAIN')
  const r = value as Record<string, unknown>,
    keys = Reflect.ownKeys(r)
  if (
    required.some((k) => !Object.hasOwn(r, k)) ||
    keys.some((k) => typeof k !== 'string' || (!required.includes(k) && !optional.includes(k)))
  )
    refuse('STREAM_UNCERTAIN')
  for (const k of keys) {
    const d = Object.getOwnPropertyDescriptor(r, k)
    if (!d?.enumerable || !('value' in d)) refuse('STREAM_UNCERTAIN')
  }
  return r
}
function count(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0)
    refuse('STREAM_UNCERTAIN')
  return value
}
function detail(value: unknown, names: readonly string[]): Record<string, unknown> | null {
  return value === undefined ? null : fields(value, [], names)
}

/** Private protocol parser. No I/O, credential access, retry or authority issuance. */
export class PmcChatStreamV1 {
  private decoder = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true })
  private pending = ''
  private data: string[] = []
  private eventBytes = 0
  private wireBytes = 0
  private eventCount = 0
  private textBytes = 0
  private pieces: string[] = []
  private id: string | null = null
  private role = false
  private reason: 'stop' | 'length' | null = null
  private usage: ValidatedUsage | null = null
  private charge: Charge = { kind: 'unknown', reason: 'missing' }
  private costLexeme: string | null = null
  private done = false
  private ended = false
  private failedSemantic = false
  constructor(private readonly profile: ResponseProfile) {}
  push(bytes: Uint8Array): void {
    if (this.ended) refuse('STREAM_UNCERTAIN')
    this.wireBytes += bytes.byteLength
    if (this.wireBytes > 4194304) refuse('STREAM_UNCERTAIN')
    let decoded: string
    try {
      decoded = this.decoder.decode(bytes, { stream: true })
    } catch {
      refuse('STREAM_UNCERTAIN')
    }
    this.lines(decoded)
  }
  private lines(decoded: string): void {
    const text = this.pending + decoded
    let begin = 0,
      newline = text.indexOf('\n')
    while (newline !== -1) {
      let line = text.slice(begin, newline)
      this.eventBytes += Buffer.byteLength(line, 'utf8') + 1
      if (this.eventBytes > 131072) refuse('STREAM_UNCERTAIN')
      if (line.endsWith('\r')) line = line.slice(0, -1)
      if (line.includes('\r')) refuse('STREAM_UNCERTAIN')
      if (line === '') {
        if (this.data.length) {
          if (++this.eventCount > 16384) refuse('STREAM_UNCERTAIN')
          this.event(this.data.join('\n'))
        }
        this.data = []
        this.eventBytes = 0
      } else if (line.startsWith(':')) {
        /* Bounded SSE keepalive, never a data record. */
      } else if (line === 'data' || line.startsWith('data:')) {
        const v = line === 'data' ? '' : line.slice(5)
        this.data.push(v.startsWith(' ') ? v.slice(1) : v)
      } else refuse('STREAM_UNCERTAIN')
      begin = newline + 1
      newline = text.indexOf('\n', begin)
    }
    this.pending = text.slice(begin)
    if (Buffer.byteLength(this.pending, 'utf8') + this.eventBytes > 131072)
      refuse('STREAM_UNCERTAIN')
  }
  private event(text: string): void {
    if (this.done) refuse('STREAM_UNCERTAIN')
    if (text === '[DONE]') {
      if (!this.reason || !this.usage) refuse('STREAM_UNCERTAIN')
      this.done = true
      return
    }
    if (this.usage) refuse('STREAM_UNCERTAIN')
    const parsed = parseJsonV1(text, 'event')
    const r = fields(
      parsed.value,
      ['id', 'object', 'model', 'choices'],
      ['created', 'provider', 'system_fingerprint', 'usage'],
    )
    if (
      typeof r.id !== 'string' ||
      !r.id ||
      r.id.length > 2048 ||
      r.object !== 'chat.completion.chunk' ||
      r.model !== this.profile.responseModel ||
      (r.provider !== undefined && r.provider !== this.profile.responseProvider) ||
      (r.created !== undefined && (typeof r.created !== 'number' || !Number.isFinite(r.created))) ||
      (r.system_fingerprint !== undefined &&
        r.system_fingerprint !== null &&
        typeof r.system_fingerprint !== 'string')
    )
      refuse('STREAM_UNCERTAIN')
    if (this.id !== null && this.id !== r.id) refuse('STREAM_UNCERTAIN')
    this.id = r.id
    if (!Array.isArray(r.choices) || r.choices.length > 1) refuse('STREAM_UNCERTAIN')
    if (r.choices.length === 0 && !r.usage) refuse('STREAM_UNCERTAIN')
    if (r.choices.length === 1) {
      if (this.reason) refuse('STREAM_UNCERTAIN')
      const c = fields(r.choices[0], ['index', 'delta', 'finish_reason'], ['logprobs'])
      if (
        c.index !== 0 ||
        (c.logprobs !== undefined && c.logprobs !== null) ||
        ![null, 'stop', 'length'].includes(c.finish_reason as string | null)
      )
        refuse('STREAM_UNCERTAIN')
      const d = fields(c.delta, [], ['role', 'content'])
      if (d.role !== undefined) {
        if (d.role !== 'assistant' || this.role || this.textBytes) refuse('STREAM_UNCERTAIN')
        this.role = true
      }
      if (d.content !== undefined && d.content !== null) {
        if (typeof d.content !== 'string') refuse('STREAM_UNCERTAIN')
        this.textBytes += Buffer.byteLength(d.content, 'utf8')
        if (this.textBytes > 1048576) refuse('STREAM_UNCERTAIN')
        this.pieces.push(d.content)
      }
      if (c.finish_reason !== null) this.reason = c.finish_reason as 'stop' | 'length'
    }
    if (r.usage !== undefined) {
      if (!this.reason) refuse('STREAM_UNCERTAIN')
      const u = fields(
        r.usage,
        ['prompt_tokens', 'completion_tokens', 'total_tokens'],
        ['cost', 'prompt_tokens_details', 'completion_tokens_details', 'cost_details'],
      )
      const input = count(u.prompt_tokens),
        output = count(u.completion_tokens),
        total = count(u.total_tokens)
      if (!Number.isSafeInteger(input + output) || total !== input + output)
        refuse('STREAM_UNCERTAIN')
      const p = detail(u.prompt_tokens_details, [
        'cached_tokens',
        'cache_write_tokens',
        'audio_tokens',
      ])
      const c = detail(u.completion_tokens_details, ['reasoning_tokens'])
      const cost = detail(u.cost_details, ['upstream_inference_cost'])
      if (
        cost?.upstream_inference_cost !== undefined &&
        (typeof cost.upstream_inference_cost !== 'number' || cost.upstream_inference_cost < 0)
      )
        refuse('STREAM_UNCERTAIN')
      const cached = p?.cached_tokens === undefined ? null : count(p.cached_tokens),
        cacheWrite = p?.cache_write_tokens === undefined ? null : count(p.cache_write_tokens)
      const audio = p?.audio_tokens === undefined ? null : count(p.audio_tokens),
        reasoning = c?.reasoning_tokens === undefined ? null : count(c.reasoning_tokens)
      if ((cached ?? 0) > input || (cacheWrite ?? 0) > input || (reasoning ?? 0) > output)
        refuse('STREAM_UNCERTAIN')
      this.failedSemantic =
        input > this.profile.maximumInputTokens ||
        output > this.profile.maximumOutputTokens ||
        (audio ?? 0) > 0 ||
        (cacheWrite ?? 0) > 0 ||
        ((cached ?? 0) > 0 && !this.profile.cacheAllowed)
      this.usage = Object.freeze({ input, output, total, cached, cacheWrite, audio, reasoning })
      this.costLexeme = parsed.numbers.get('/usage/cost') ?? null
      this.charge = parseAccountChargeV1(this.costLexeme ?? undefined)
    }
  }
  finish(): StreamResult {
    if (this.ended) refuse('STREAM_UNCERTAIN')
    this.ended = true
    try {
      this.lines(this.decoder.decode())
    } catch {
      refuse('STREAM_UNCERTAIN')
    }
    if (!this.done || !this.reason || !this.usage || !this.id || this.pending || this.data.length)
      refuse('STREAM_UNCERTAIN')
    return Object.freeze({
      text: this.pieces.join(''),
      usage: this.usage,
      responseId: this.id,
      costLexeme: this.costLexeme,
      observation: Object.freeze({
        kind: 'response',
        semantic: this.failedSemantic ? 'failed' : this.reason,
        charge: Object.freeze(this.charge),
      }),
    })
  }
}
