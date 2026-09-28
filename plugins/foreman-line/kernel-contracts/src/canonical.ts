/**
 * Byte-total canonical encoder and digest helpers (F05.5, F01).
 *
 * The encoder is the ONLY hashing path for new P1 digests. Every value has
 * exactly one valid byte encoding, produced by this complete rule set applied
 * to the validated document (absent optional members are omitted before
 * encoding; required nullable members are serialized as `null`):
 *
 *  1. Structural framing (compact form): no insignificant whitespace anywhere;
 *     object and array separators are exactly `,` and `:` with no surrounding
 *     spaces; objects `{`…`}`, arrays `[`…`]` with no interior padding.
 *  2. Member order: object keys sorted recursively by UTF-16 code-unit order at
 *     every depth; array order preserved exactly as validated.
 *  3. Strings: exactly the JSON.stringify escape set of the validated document —
 *     quotation mark, reverse solidus and control characters U+0000–U+001F
 *     escaped (the controls as `\u00XX` lowercase hex); every other code unit
 *     emitted literally as UTF-8; no other escapes (no escaped solidus, no
 *     `\u` escapes for non-ASCII).
 *  4. Numbers: every encoded number is an integer in the closed range
 *     0..2^53-1; NaN, ±Infinity, negative zero, fractions, exponents and
 *     unsafe integers are rejected before hashing. Integer lexeme: digits only,
 *     no sign, no leading zeros except the value `0` itself.
 *  5. Atoms: `true`, `false` and `null` as bare lexemes.
 *  6. Wrapper and hash: the encoded document is `{domain, apiVersion, payload}`
 *     written under rules 1–5, encoded as UTF-8 without BOM, hashed with
 *     SHA-256, emitted as 64 lowercase hex characters and tagged `sha256:`.
 *
 * No Unicode normalization of keys or values and no path case folding occurs
 * anywhere in hashing. `apiVersion` in every preimage is the literal `0.1.0`.
 */
import { createHash } from 'node:crypto'
import { API_VERSION, DIGEST_DOMAINS, type Digest } from './types.js'

/** Typed error raised when a value has no valid byte encoding. */
export class CanonicalEncodeError extends Error {
  readonly path: string

  constructor(message: string, path: string) {
    super(`${message} at ${path}`)
    this.name = 'CanonicalEncodeError'
    this.path = path
  }
}

const DIGEST_TAG = 'sha256:'

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

/**
 * Canonical byte encoding of a validated document as a JS string of the
 * canonical JSON. Throws {@link CanonicalEncodeError} for any value without a
 * valid byte encoding.
 */
export function canonicalEncode(value: unknown): string {
  return encodeValue(value, '$')
}

/** UTF-8 bytes of the canonical encoding, without BOM. */
export function canonicalBytes(value: unknown): Uint8Array {
  return new TextEncoder().encode(canonicalEncode(value))
}

/** Tagged digest literal over arbitrary UTF-8 bytes. */
export function digestBytes(bytes: Uint8Array): Digest {
  return `${DIGEST_TAG}${createHash('sha256').update(bytes).digest('hex')}`
}

/**
 * Digest of `{domain, apiVersion, payload}` under the F05.5 rules. This is the
 * only way P1 mints new digests; embedded upstream values are never retagged or
 * recomputed with this encoder.
 */
export function digestDocument(domain: string, payload: unknown): Digest {
  return digestBytes(canonicalBytes({ domain, apiVersion: API_VERSION, payload }))
}

/** requestDigest over a validated wire request document (LifecycleEvent or ReadRequest). */
export function requestDigestOf(document: unknown): Digest {
  return digestDocument(DIGEST_DOMAINS.request, document)
}

/** inputDigest over a validated AuthorizeActionInput document. */
export function inputDigestOf(document: unknown): Digest {
  return digestDocument(DIGEST_DOMAINS.effectiveInput, document)
}

/** policyDigest over a validated PolicyIdentity document (F05.6 preimage). */
export function policyDigestOf(policyIdentity: unknown): Digest {
  return digestDocument(DIGEST_DOMAINS.policy, policyIdentity)
}

/** True when `value` is a well-formed tagged digest literal (`sha256:` + 64 lowercase hex). */
export function isDigestLiteral(value: unknown): value is Digest {
  return typeof value === 'string' && /^sha256:[0-9a-f]{64}$/.test(value)
}

/** Explicit decode at the package boundary: tagged literal → 64 lowercase hex, or null. */
export function parseDigestLiteral(value: unknown): string | null {
  return isDigestLiteral(value) ? value.slice(DIGEST_TAG.length) : null
}

/** Explicit encode at the package boundary: 64 lowercase hex → tagged literal, or null. */
export function tagDigest(hex: string): Digest | null {
  return /^[0-9a-f]{64}$/.test(hex) ? `${DIGEST_TAG}${hex}` : null
}
