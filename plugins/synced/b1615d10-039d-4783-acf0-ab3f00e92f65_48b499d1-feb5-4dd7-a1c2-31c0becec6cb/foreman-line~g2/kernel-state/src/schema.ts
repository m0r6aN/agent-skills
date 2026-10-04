/**
 * Substrate schema metadata and F05.1 value-shape discipline (FK-P9).
 *
 * Types follow FK-P1 F05.1: `Id` (nonempty ASCII <=128 of letters/digits/dot/
 * underscore/hyphen), `Digest` (`sha256:` + 64 lowercase hex), `SafeInt`
 * (nonnegative safe integer), `Micros` (nonnegative integer microseconds).
 * Unknown fields, unknown enum values, missing required data, and over-limit
 * input fail closed (`STORAGE_ARGUMENT_INVALID` at the API boundary).
 *
 * No lease, transition, authorization, or projection semantics live here:
 * columns marked (P10) or (P11) in the spec carry shape bounds only.
 */
import { isDigestLiteral } from './canonical.js'
import { storageError } from './errors.js'

/** Maximum event payload size in bytes (UTF-8), FK-P9 enforced. */
export const EVENT_PAYLOAD_MAX_BYTES = 65_536

/** Maximum artifact locator size in bytes (UTF-8). */
export const ARTIFACT_LOCATOR_MAX_BYTES = 4_096

/** Substrate tables in the fixed export order. */
export const SUBSTRATE_TABLES = [
  'schema_migrations',
  'goals',
  'events',
  'transitions',
  'leases',
  'idempotency_keys',
  'artifacts',
  'projection_cursors',
  'wakeup_handoffs',
] as const
export type SubstrateTable = (typeof SUBSTRATE_TABLES)[number]

/** Primary-key columns per substrate table (the export row key tuple). */
export const TABLE_KEY_TUPLES: Record<SubstrateTable, readonly string[]> = {
  schema_migrations: ['version'],
  goals: ['goal_id'],
  events: ['event_seq'],
  transitions: ['transition_id'],
  leases: ['lease_id'],
  idempotency_keys: ['principal_ref', 'operation_id', 'repository_ref', 'worktree_ref'],
  artifacts: ['artifact_id'],
  projection_cursors: ['projection_id'],
  wakeup_handoffs: ['wakeup_id'],
}

/** `wakeup_handoffs.kind` closed vocabulary (substrate shape only). */
export const WAKEUP_KINDS = ['wakeup', 'handoff'] as const
export type WakeupKind = (typeof WAKEUP_KINDS)[number]

// Linear-time patterns (standing constraint #5): anchored, no nested
// quantifiers, no ambiguous alternation — polynomial-redos clean by construction.
const ID_RE = /^[A-Za-z0-9._-]{1,128}$/
const DIGEST_RE = /^sha256:[0-9a-f]{64}$/

/** True for a nonempty ASCII `Id` (letters/digits/dot/underscore/hyphen, <=128). */
export function isId(value: unknown): value is string {
  return typeof value === 'string' && ID_RE.test(value)
}

/** Narrowing guard for a plain record (boundary normalization entry point). */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/** True for a tagged `Digest` literal (`sha256:` + 64 lowercase hex). */
export function isDigest(value: unknown): value is string {
  return typeof value === 'string' && DIGEST_RE.test(value) && isDigestLiteral(value)
}

/** True for a nonnegative safe integer (`SafeInt`). */
export function isSafeInt(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

/** True for a nonnegative integer microseconds value (`Micros`). */
export function isMicros(value: unknown): value is number {
  return isSafeInt(value)
}

/** Fail closed unless `value` is an `Id`; `fieldPath` feeds the bounded diagnostic. */
export function requireId(value: unknown, fieldPath: string): string {
  if (!isId(value)) throw storageError('STORAGE_ARGUMENT_INVALID', { fieldPath })
  return value
}

/** Fail closed unless `value` is a `Digest` literal. */
export function requireDigest(value: unknown, fieldPath: string): string {
  if (!isDigest(value)) throw storageError('STORAGE_ARGUMENT_INVALID', { fieldPath })
  return value
}

/** Fail closed unless `value` is a `SafeInt`. */
export function requireSafeInt(value: unknown, fieldPath: string): number {
  if (!isSafeInt(value)) throw storageError('STORAGE_ARGUMENT_INVALID', { fieldPath })
  return value
}

/** Fail closed unless `value` is a `Micros` value or `null` when nullable. */
export function requireMicrosOrNull(
  value: unknown,
  fieldPath: string,
  nullable: true,
): number | null
export function requireMicrosOrNull(value: unknown, fieldPath: string, nullable?: false): number
export function requireMicrosOrNull(
  value: unknown,
  fieldPath: string,
  nullable = false,
): number | null {
  if (value === null && nullable) return null
  if (!isMicros(value)) throw storageError('STORAGE_ARGUMENT_INVALID', { fieldPath })
  return value
}

/** Fail closed unless `value` is an `Id` or `null` when nullable. */
export function requireIdOrNull(value: unknown, fieldPath: string, nullable: true): string | null
export function requireIdOrNull(value: unknown, fieldPath: string, nullable?: false): string
export function requireIdOrNull(
  value: unknown,
  fieldPath: string,
  nullable = false,
): string | null {
  if (value === null && nullable) return null
  if (!isId(value)) throw storageError('STORAGE_ARGUMENT_INVALID', { fieldPath })
  return value
}

/** Fail closed unless `value` is a string of at most `maxBytes` UTF-8 bytes. */
export function requireBoundedText(value: unknown, fieldPath: string, maxBytes: number): string {
  if (typeof value !== 'string') {
    throw storageError('STORAGE_ARGUMENT_INVALID', { fieldPath })
  }
  if (new TextEncoder().encode(value).length > maxBytes) {
    if (fieldPath === 'payload')
      throw storageError('STORAGE_PAYLOAD_LIMIT_EXCEEDED', { field: fieldPath })
    throw storageError('STORAGE_ARGUMENT_INVALID', { fieldPath })
  }
  return value
}

/** Fail closed unless `value` is one of the closed `WAKEUP_KINDS`. */
export function requireWakeupKind(value: unknown, fieldPath: string): WakeupKind {
  if (typeof value !== 'string' || !(WAKEUP_KINDS as readonly string[]).includes(value)) {
    throw storageError('STORAGE_ARGUMENT_INVALID', { fieldPath })
  }
  return value as WakeupKind
}
