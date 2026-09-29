/**
 * Local F05.5 canonical encoder (FK-P10 implements its encoder locally per the
 * FK-P2/FK-P9 pattern; byte-conformance is bound by 8 committed vectors plus a
 * read-only cross-check that re-derives FK-P1's golden fixture digests
 * byte-exactly — `kernel-contracts/**` is never imported and never written).
 *
 * The encoder is the only hashing path for FK-P10 canonical-JSON digests.
 * Every value has exactly one valid byte encoding (F05.5 rules 1–6):
 *
 *  1. Structural framing (compact form): no insignificant whitespace; object
 *     and array separators are exactly `,` and `:` with no surrounding spaces.
 *  2. Member order: object keys sorted recursively by UTF-16 code-unit order at
 *     every depth; array order preserved exactly.
 *  3. Strings: exactly the JSON.stringify escape set — quotation mark, reverse
 *     solidus and control characters U+0000–U+001F escaped (the controls as
 *     `\u00XX` lowercase hex); every other code unit emitted literally as
 *     UTF-8; no other escapes (no escaped solidus, no `\u` escapes for
 *     non-ASCII).
 *  4. Numbers: every encoded number is an integer in the closed range
 *     0..2^53-1; NaN, ±Infinity, negative zero, fractions, exponents and
 *     unsafe integers are rejected before hashing. Integer lexeme: digits
 *     only, no sign, no leading zeros except the value `0` itself.
 *  5. Atoms: `true`, `false` and `null` as bare lexemes.
 *  6. Wrapper and hash: `{domain, apiVersion, payload}` under rules 1–5, UTF-8
 *     without BOM, SHA-256, 64 lowercase hex, tagged `sha256:`.
 *
 * No Unicode normalization of keys or values and no path case folding occurs
 * anywhere in hashing. `apiVersion` in every preimage is the literal `0.1.0`.
 */
import { createHash } from 'node:crypto'

/** `apiVersion` literal embedded in every digest preimage. */
export const API_VERSION = '0.1.0'

/** FK-P10 digest domains (T11; F05.5 style). */
export const KERNEL_LEASE_DIGEST_DOMAINS = {
  operationInput: 'foreman-line.kernel-lease.operation-input',
  eventPayload: 'foreman-line.kernel-lease.event-payload',
} as const

/** Tagged digest literal (`sha256:` + 64 lowercase hex). */
export type Digest = `sha256:${string}`

/** True when `value` is a well-formed tagged digest literal. */
export function isDigestLiteral(value: unknown): value is Digest {
  return typeof value === 'string' && /^sha256:[0-9a-f]{64}$/.test(value)
}

/** Typed error raised when a value has no valid byte encoding (internal only). */
export class CanonicalEncodeError extends Error {
  readonly path: string

  constructor(message: string, path: string) {
    super(`${message} at ${path}`)
    this.name = 'CanonicalEncodeError'
    this.path = path
  }
}

function encodeString(value: string, path: string): string {
  let out = '"'
  for (let i = 0; i < value.length; i += 1) {
    const unit = value.charCodeAt(i)
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = i + 1 < value.length ? value.charCodeAt(i + 1) : 0
      if (next < 0xdc00 || next > 0xdfff) {
        throw new CanonicalEncodeError('unpaired high surrogate in string', path)
      }
      out += value.slice(i, i + 2)
      i += 1
      continue
    }
    if (unit >= 0xdc00 && unit <= 0xdfff) {
      throw new CanonicalEncodeError('unpaired low surrogate in string', path)
    }
    if (unit === 0x22) {
      out += '\\"'
    } else if (unit === 0x5c) {
      out += '\\\\'
    } else if (unit <= 0x1f) {
      out += `\\u${unit.toString(16).padStart(4, '0')}`
    } else {
      out += value.charAt(i)
    }
  }
  return `${out}"`
}

function encodeNumber(value: number, path: string): string {
  if (Number.isNaN(value)) throw new CanonicalEncodeError('NaN has no byte encoding', path)
  if (!Number.isFinite(value)) throw new CanonicalEncodeError('Infinity has no byte encoding', path)
  if (Object.is(value, -0)) throw new CanonicalEncodeError('negative zero rejected', path)
  if (!Number.isSafeInteger(value)) {
    throw new CanonicalEncodeError('only safe integers are encodable', path)
  }
  if (value < 0 || value > Number.MAX_SAFE_INTEGER) {
    throw new CanonicalEncodeError('number outside the closed range 0..2^53-1', path)
  }
  return String(value)
}

function encodeValue(value: unknown, path: string): string {
  if (value === null) return 'null'
  switch (typeof value) {
    case 'boolean':
      return value ? 'true' : 'false'
    case 'number':
      return encodeNumber(value, path)
    case 'string':
      return encodeString(value, path)
    case 'object':
      break
    default:
      throw new CanonicalEncodeError(`value of type ${typeof value} has no byte encoding`, path)
  }
  if (Array.isArray(value)) {
    const members: string[] = []
    for (let i = 0; i < value.length; i += 1) {
      const member = value[i]
      if (member === undefined) {
        throw new CanonicalEncodeError('array member is undefined', `${path}[${i}]`)
      }
      members.push(encodeValue(member, `${path}[${i}]`))
    }
    return `[${members.join(',')}]`
  }
  const record = value as Record<string, unknown>
  const keys: string[] = []
  for (const key of Object.keys(record)) {
    // Absent optional members are omitted before encoding.
    if (record[key] !== undefined) keys.push(key)
  }
  // Sort by UTF-16 code-unit order (rule 2); JS string comparison is exactly that order.
  keys.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
  const members: string[] = []
  for (const key of keys) {
    members.push(`${encodeString(key, path)}:${encodeValue(record[key], `${path}.${key}`)}`)
  }
  return `{${members.join(',')}}`
}

/** Canonical byte encoding of a validated document as a string of canonical JSON. */
export function canonicalEncode(value: unknown): string {
  return encodeValue(value, '$')
}

/** UTF-8 bytes of the canonical encoding, without BOM. */
export function canonicalBytes(value: unknown): Uint8Array {
  return new TextEncoder().encode(canonicalEncode(value))
}

/** Tagged digest literal over arbitrary UTF-8 bytes. */
export function digestBytes(bytes: Uint8Array): Digest {
  return `sha256:${createHash('sha256').update(bytes).digest('hex')}`
}

/** Tagged digest literal over the raw bytes of a UTF-8 string. */
export function digestText(text: string): Digest {
  return digestBytes(new TextEncoder().encode(text))
}

/** Digest of `{domain, apiVersion, payload}` under the F05.5 rules. */
export function digestDocument(domain: string, payload: unknown): Digest {
  return digestBytes(canonicalBytes({ domain, apiVersion: API_VERSION, payload }))
}

/**
 * T11 operation-input digest: canonical JSON of the operation request document
 * (with its `operation` discriminator), domain
 * `foreman-line.kernel-lease.operation-input`.
 */
export function operationInputDigest(request: unknown): Digest {
  return digestDocument(KERNEL_LEASE_DIGEST_DOMAINS.operationInput, request)
}

/**
 * T11 event-payload digest: canonical JSON of the event payload document
 * (which embeds the EffectResult minus `effectDigest`), domain
 * `foreman-line.kernel-lease.event-payload`. Equals `events.payload_digest`,
 * `EffectResult.effectDigest`, and `idempotency_keys.effect_digest` by
 * construction.
 */
export function eventPayloadDigest(payload: unknown): Digest {
  return digestDocument(KERNEL_LEASE_DIGEST_DOMAINS.eventPayload, payload)
}
