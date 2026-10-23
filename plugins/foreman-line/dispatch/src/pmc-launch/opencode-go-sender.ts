import { Buffer } from 'node:buffer'
import type { ClientRequest, IncomingMessage } from 'node:http'
import * as https from 'node:https'
import { type createOpenCodeGoWireV1, inspectPreparedOpenCodeGoV1 } from './opencode-go-wire.js'
import { parseJsonV1 } from './openrouter-chat-stream.js'

const ENDPOINT = 'https://opencode.ai/inference/go/openai/v1/chat/completions'
const MODEL = 'mimo-v2.6-pro'
const DEADLINE_MS = 120_000
const MAX_RESPONSE_BYTES = 65_536

export type OpenCodeGoSendResult = Readonly<{
  state: 'no-send' | 'uncertain' | 'response'
  code?:
    | 'PREPARED_REFUSED'
    | 'CREDENTIAL_REFUSED'
    | 'ABORTED'
    | 'HTTP_UNCERTAIN'
    | 'STREAM_UNCERTAIN'
  semantic?: 'stop' | 'length'
  text?: string
  usage?: Readonly<{ prompt: number; completion: number; total: number; reasoning: number | null }>
  charge: Readonly<{ kind: 'unknown'; reason: 'missing' | 'incomplete' }>
  correlation?: Readonly<{ requestDigest: string; decisionDigest: string; bodyDigest: string }>
}>
export type OpenCodeGoSenderOptions = Readonly<{
  credential: () => unknown
  wire: ReturnType<typeof createOpenCodeGoWireV1>
}>

const unknownMissing = Object.freeze({ kind: 'unknown' as const, reason: 'missing' as const })
const unknownIncomplete = Object.freeze({ kind: 'unknown' as const, reason: 'incomplete' as const })
function noSend(code: OpenCodeGoSendResult['code']): OpenCodeGoSendResult {
  return Object.freeze({ state: 'no-send', code, charge: unknownMissing })
}
function uncertain(code: OpenCodeGoSendResult['code']): OpenCodeGoSendResult {
  return Object.freeze({ state: 'uncertain', code, charge: unknownIncomplete })
}
function object(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}
function preparedCandidate(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value
  try {
    const proto = Object.getPrototypeOf(value)
    if (proto !== Object.prototype && proto !== null) return null
    const keys = Reflect.ownKeys(value)
    if (!keys.includes('ok')) return value
    if (
      keys.length !== 5 ||
      keys.some(
        (key) =>
          typeof key !== 'string' ||
          !['ok', 'prepared', 'requestDigest', 'decisionDigest', 'bodyDigest'].includes(key),
      )
    )
      return null
    const ok = Object.getOwnPropertyDescriptor(value, 'ok')
    const prepared = Object.getOwnPropertyDescriptor(value, 'prepared')
    if (
      !ok?.enumerable ||
      !('value' in ok) ||
      ok.value !== true ||
      !prepared ||
      !prepared.enumerable ||
      !('value' in prepared)
    )
      return null
    for (const key of ['requestDigest', 'decisionDigest', 'bodyDigest']) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key)
      if (
        !descriptor?.enumerable ||
        !('value' in descriptor) ||
        typeof descriptor.value !== 'string'
      )
        return null
    }
    return prepared.value
  } catch {
    return null
  }
}
function safeCount(value: unknown): number | null {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null
}
function responseValue(raw: string): OpenCodeGoSendResult | null {
  try {
    if (Buffer.byteLength(raw, 'utf8') > MAX_RESPONSE_BYTES) return null
    const parsed = parseJsonV1(raw, 'event').value
    const root = object(parsed)
    if (!root || root.model !== MODEL || !Array.isArray(root.choices) || root.choices.length !== 1)
      return null
    const choice = object(root.choices[0])
    const message = object(choice?.message)
    if (
      choice?.index !== 0 ||
      !message ||
      message.role !== 'assistant' ||
      typeof message.content !== 'string' ||
      Object.hasOwn(message, 'tool_calls') ||
      Object.hasOwn(message, 'function_call') ||
      (choice.finish_reason !== 'stop' && choice.finish_reason !== 'length')
    )
      return null
    if (root.usage !== undefined && !object(root.usage)) return null
    const usageRaw = object(root.usage)
    let usage: OpenCodeGoSendResult['usage']
    if (usageRaw) {
      const prompt = safeCount(usageRaw.prompt_tokens)
      const completion = safeCount(usageRaw.completion_tokens)
      const total = safeCount(usageRaw.total_tokens)
      if (
        usageRaw.completion_tokens_details !== undefined &&
        !object(usageRaw.completion_tokens_details)
      )
        return null
      const reasoningRaw = object(usageRaw.completion_tokens_details)?.reasoning_tokens
      const reasoning = reasoningRaw === undefined ? null : safeCount(reasoningRaw)
      if (
        prompt === null ||
        completion === null ||
        total === null ||
        prompt + completion !== total ||
        completion > 1024 ||
        (reasoningRaw !== undefined && (reasoning === null || reasoning > completion))
      )
        return null
      usage = Object.freeze({ prompt, completion, total, reasoning })
    }
    return Object.freeze({
      state: 'response',
      semantic: choice.finish_reason,
      text: message.content,
      ...(usage ? { usage } : {}),
      charge: choice.finish_reason === 'stop' ? unknownMissing : unknownIncomplete,
    })
  } catch {
    return null
  }
}

export function createOpenCodeGoSenderV1(options: OpenCodeGoSenderOptions): Readonly<{
  send(prepared: unknown, signal?: AbortSignal): Promise<OpenCodeGoSendResult>
}> {
  let used = false
  const credential = options.credential
  const wire = options.wire
  return Object.freeze({
    async send(prepared: unknown, signal?: AbortSignal): Promise<OpenCodeGoSendResult> {
      if (used) return noSend('PREPARED_REFUSED')
      used = true
      if (signal?.aborted) return noSend('ABORTED')
      const candidate = preparedCandidate(prepared)
      const p = inspectPreparedOpenCodeGoV1(candidate, wire)
      // Prepared objects are bound to the factory that produced them; sender accepts an owned prepared value only.
      if (!p) return noSend('PREPARED_REFUSED')
      const correlation = Object.freeze({
        requestDigest: p.requestDigest,
        decisionDigest: p.decisionDigest,
        bodyDigest: p.bodyDigest,
      })
      let token: unknown
      try {
        token = credential()
      } catch {
        return noSend('CREDENTIAL_REFUSED')
      }
      if (typeof token !== 'string' || token.length > 8192 || !/^[\x21-\x7e]+$/.test(token))
        return noSend('CREDENTIAL_REFUSED')
      if (signal?.aborted) return noSend('ABORTED')

      return await new Promise<OpenCodeGoSendResult>((resolve) => {
        let settled = false
        let exposed = false
        let response: IncomingMessage | undefined
        let request: ClientRequest | undefined
        let responseData: ((chunk: Buffer | string) => void) | undefined
        let responseEnd: (() => void) | undefined
        let responseError: ((error: Error) => void) | undefined
        let responseAborted: (() => void) | undefined
        let responseClose: (() => void) | undefined
        let requestError: ((error: Error) => void) | undefined
        let requestClose: (() => void) | undefined
        let bytes = 0
        const chunks: Buffer[] = []
        const finish = (result: OpenCodeGoSendResult) => {
          if (settled) return
          settled = true
          clearTimeout(timer)
          try {
            signal?.removeEventListener('abort', onAbort)
          } catch {
            /* Keep terminal result stable. */
          }
          if (response) {
            try {
              if (responseData) response.removeListener('data', responseData)
              if (responseEnd) response.removeListener('end', responseEnd)
              if (response.destroyed) responseClose?.()
              else response.destroy()
            } catch {
              /* Keep terminal result stable. */
            }
          }
          if (request) {
            try {
              if (request.destroyed) requestClose?.()
              else request.destroy()
            } catch {
              /* Keep terminal result stable. */
            }
          }
          resolve(Object.freeze({ ...result, correlation }))
        }
        const onAbort = () => finish(exposed ? uncertain('ABORTED') : noSend('ABORTED'))
        const timer = setTimeout(
          () => finish(exposed ? uncertain('HTTP_UNCERTAIN') : noSend('HTTP_UNCERTAIN')),
          DEADLINE_MS,
        )
        signal?.addEventListener('abort', onAbort, { once: true })
        try {
          const headers = {
            accept: 'application/json',
            'content-type': 'application/json',
            'user-agent': 'foreman-line-opencode-go/1',
            'x-opencode-session': p.sessionId,
            'content-length': String(p.bytes.length),
            authorization: `Bearer ${token}`,
          }
          exposed = true
          request = https.request(
            ENDPOINT,
            {
              method: 'POST',
              headers,
              agent: false,
              rejectUnauthorized: true,
              maxHeaderSize: 8192,
            },
            (res) => {
              response = res
              responseError = () => finish(uncertain('HTTP_UNCERTAIN'))
              responseAborted = () => finish(uncertain('HTTP_UNCERTAIN'))
              responseClose = () => {
                if (responseError) res.removeListener('error', responseError)
                if (responseAborted) res.removeListener('aborted', responseAborted)
                if (responseClose) res.removeListener('close', responseClose)
              }
              res.on('error', responseError)
              res.on('aborted', responseAborted)
              res.on('close', responseClose)
              if (settled) {
                try {
                  res.destroy()
                } catch {
                  /* No late work may reenter the sender. */
                }
                return
              }
              if (
                res.statusCode !== 200 ||
                res.headers.location ||
                res.headers['content-encoding'] ||
                typeof res.headers['content-type'] !== 'string' ||
                !/^application\/json(?:\s*;|\s*$)/i.test(res.headers['content-type'])
              ) {
                finish(uncertain('HTTP_UNCERTAIN'))
                return
              }
              responseData = (chunk: Buffer | string) => {
                if (settled) return
                const part = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
                bytes += part.length
                if (bytes > MAX_RESPONSE_BYTES) {
                  finish(uncertain('STREAM_UNCERTAIN'))
                  return
                }
                chunks.push(part)
              }
              responseEnd = () => {
                if (settled) return
                let raw: string
                try {
                  raw = new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks))
                } catch {
                  finish(uncertain('STREAM_UNCERTAIN'))
                  return
                }
                const result = responseValue(raw)
                finish(result ?? uncertain('STREAM_UNCERTAIN'))
              }
              res.on('data', responseData)
              res.on('end', responseEnd)
            },
          )
          requestError = () =>
            finish(exposed ? uncertain('HTTP_UNCERTAIN') : noSend('HTTP_UNCERTAIN'))
          requestClose = () => {
            if (requestError) request?.removeListener('error', requestError)
            if (requestClose) request?.removeListener('close', requestClose)
          }
          request.on('error', requestError)
          request.on('close', requestClose)
          request.end(Buffer.from(p.bytes))
        } catch {
          finish(exposed ? uncertain('HTTP_UNCERTAIN') : noSend('HTTP_UNCERTAIN'))
        }
      })
    },
  })
}
