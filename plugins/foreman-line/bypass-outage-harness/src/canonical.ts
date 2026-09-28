/**
 * Canonical byte rules for emitted records (spec: "canonical bytes per the
 * FK-P2/F05.5 byte rules implemented locally"). Local implementation — the
 * FK-P2 package is a read-only reference, never imported here.
 *
 * Rules:
 *  - UTF-8, no BOM.
 *  - JSON with object keys sorted lexicographically by UTF-16 code unit.
 *  - No insignificant whitespace (`:` and `,` separators only).
 *  - Numbers must be safe integers (records are integer microseconds).
 *  - Strings escaped by JSON.stringify (control characters escaped as \uXXXX).
 */

import { createHash } from 'node:crypto'

export class CanonicalEncodeError extends Error {
  readonly path: string

  constructor(path: string, message: string) {
    super(message)
    this.name = 'CanonicalEncodeError'
    this.path = path
  }
}

function encodeValue(value: unknown, path: string): string {
  if (value === null) return 'null'
  const t = typeof value
  if (t === 'boolean') return value ? 'true' : 'false'
  if (t === 'number') {
    if (!Number.isSafeInteger(value as number)) {
      throw new CanonicalEncodeError(path, 'numbers must be safe integers')
    }
    return String(value)
  }
  if (t === 'string') return JSON.stringify(value)
  if (Array.isArray(value)) {
    return `[${value.map((v, i) => encodeValue(v, `${path}[${i}]`)).join(',')}]`
  }
  if (t === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a < b ? -1 : a > b ? 1 : 0,
    )
    return `{${entries
      .map(([k, v]) => `${JSON.stringify(k)}:${encodeValue(v, `${path}.${k}`)}`)
      .join(',')}}`
  }
  throw new CanonicalEncodeError(path, `unsupported value type: ${t}`)
}

/** Canonical JSON text for a record value. */
export function canonicalJson(value: unknown): string {
  return encodeValue(value, '$')
}

/** Canonical UTF-8 bytes (no BOM). */
export function canonicalBytes(value: unknown): Uint8Array {
  return new TextEncoder().encode(canonicalJson(value))
}

/** Lowercase hex SHA-256 over bytes or UTF-8 text. */
export function sha256Hex(input: Uint8Array | string): string {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input
  return createHash('sha256').update(bytes).digest('hex')
}

/**
 * Sanitize external text before emission (standing constraint #31): removes
 * control characters (C0, DEL, C1) and format/invisible characters (bidi
 * controls, zero-widths, BOM, line/paragraph separators) so untrusted hook
 * stderr or state echoes cannot smuggle layout-changing bytes into evidence.
 * Linear-time single pass (standing constraint #19) — no regex.
 */
export function sanitizeText(input: string): string {
  let out = ''
  for (const ch of input) {
    const cp = ch.codePointAt(0) ?? 0
    if (cp < 0x20 || cp === 0x7f) continue
    if (cp >= 0x80 && cp <= 0x9f) continue
    if (cp === 0x200b || cp === 0x200c || cp === 0x200d || cp === 0x200e || cp === 0x200f) continue
    if (cp >= 0x2028 && cp <= 0x202e) continue
    if (cp >= 0x2066 && cp <= 0x2069) continue
    if (cp === 0xfeff || cp === 0xfffe) continue
    out += ch
  }
  return out
}
