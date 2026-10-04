/**
 * Local F05.5 byte-total canonical encoder (FK-P2-owned implementation of
 * FK-P1's recorded contract text — NOT a package import). Rule text is FK-P1
 * F05.5 verbatim in substance:
 *
 *  1. Structural framing (compact): no insignificant whitespace; separators
 *     exactly `,` and `:`; no interior padding.
 *  2. Member order: object keys sorted recursively by UTF-16 code-unit order
 *     at every depth; array order preserved exactly.
 *  3. Strings: the JSON.stringify escape set — quotation mark, reverse solidus
 *     and control characters U+0000–U+001F escaped (the controls as `\u00XX`
 *     lowercase hex); every other code unit emitted literally as UTF-8; no
 *     escaped solidus; no `\u` escapes for non-ASCII. Unpaired surrogates are
 *     rejected before encoding.
 *  4. Numbers: safe integers in 0..2^53-1 only; digits-only lexeme, no sign,
 *     no leading zeros except `0` itself.
 *  5. Atoms: `true`, `false`, `null` bare.
 *  6. Wrapper/hash: `{domain, apiVersion, payload}` under rules 1–5, UTF-8
 *     without BOM, SHA-256, `sha256:` + 64 lowercase hex. `apiVersion` is the
 *     literal `0.1.0`.
 *
 * No Unicode normalization and no path case folding occurs anywhere in
 * hashing. Conformance is byte-bound by `tests/fixtures/canonical/encoder-vectors.json`
 * and cross-checked read-only against FK-P1's canonical golden fixtures
 * (OQ-3) in `tests/canonical-output.test.ts`.
 */
import { createHash } from 'node:crypto'

export const API_VERSION = '0.1.0'
export const COMPILED_SCOPE_DOMAIN = 'foreman-line.spec-body-compiler.compiled-scope'
const DIGEST_TAG = 'sha256:'

/** Typed error raised when a value has no valid byte encoding (F05.5 rules). */
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
  if (value < 0) throw new CanonicalEncodeError('negative numbers rejected', path)
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
    if (record[key] !== undefined) keys.push(key)
  }
  keys.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
  const members: string[] = []
  for (const key of keys) {
    members.push(`${encodeString(key, path)}:${encodeValue(record[key], `${path}.${key}`)}`)
  }
  return `{${members.join(',')}}`
}

/** Canonical JSON string of a validated document (rules 1–5). */
export function canonicalEncode(value: unknown): string {
  return encodeValue(value, '$')
}

/** UTF-8 bytes of the canonical encoding, without BOM. */
export function canonicalBytes(value: unknown): Uint8Array {
  return new TextEncoder().encode(canonicalEncode(value))
}

/** Tagged digest literal over arbitrary UTF-8 bytes. */
export function digestBytes(bytes: Uint8Array): string {
  return `${DIGEST_TAG}${createHash('sha256').update(bytes).digest('hex')}`
}

/** Digest of `{domain, apiVersion, payload}` under the F05.5 rules (rule 6). */
export function digestDocument(domain: string, payload: unknown): string {
  return digestBytes(canonicalBytes({ domain, apiVersion: API_VERSION, payload }))
}

/**
 * `compiledScopeDigest` (FK-P2-owned per F05.5's ownership row): digest of
 * `{domain: COMPILED_SCOPE_DOMAIN, apiVersion: "0.1.0", payload: <artifact
 * without its compiledScopeDigest member>}`.
 */
export function compiledScopeDigestFor(artifactWithoutDigest: unknown): string {
  return digestDocument(COMPILED_SCOPE_DOMAIN, artifactWithoutDigest)
}

/** True when `value` is a well-formed tagged digest literal. */
export function isDigestLiteral(value: unknown): value is string {
  return typeof value === 'string' && /^sha256:[0-9a-f]{64}$/.test(value)
}
