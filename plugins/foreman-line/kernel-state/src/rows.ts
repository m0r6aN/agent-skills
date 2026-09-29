/**
 * Typed, parameter-bound row primitives (FK-P9 exported API surface).
 * Driver rows are `unknown` until normalized at the boundary (constraint #2);
 * every input is validated with F05.1 shape bounds and fails closed
 * (`STORAGE_ARGUMENT_INVALID` / `STORAGE_PAYLOAD_LIMIT_EXCEEDED`).
 *
 * Substrate, not policy: primitives take caller-supplied equality guards and
 * perform guarded writes only. No lease, idempotency, transition, or revision
 * semantics are decided here — vocabulary and legality are FK-P10's.
 */
import { constraintCodeOf, constraintNameOf, fromDriverError, storageError } from './errors.js'
import {
  ARTIFACT_LOCATOR_MAX_BYTES,
  EVENT_PAYLOAD_MAX_BYTES,
  isRecord,
  requireBoundedText,
  requireDigest,
  requireId,
  requireIdOrNull,
  requireMicrosOrNull,
  requireSafeInt,
  requireWakeupKind,
  type WakeupKind,
} from './schema.js'
import { assertOpen, type Storage } from './transactions.js'

// --- normalized row shapes --------------------------------------------------

export interface SchemaMigrationRow {
  version: number
  name: string
  digest: string
  appliedAtMicros: number
}

export interface GoalRow {
  goalId: string
  revision: number
  status: string
  pendingTransitionId: string | null
  updatedAtMicros: number
}

export interface EventRow {
  eventSeq: number
  eventId: string
  goalId: string
  kind: string
  payload: string
  payloadDigest: string
  principalRef: string
  operationId: string
  recordedAtMicros: number
}

export interface TransitionRow {
  transitionId: string
  goalId: string
  status: string
  requestedBy: string
  operationId: string
  payloadDigest: string
  createdAtMicros: number
  decidedAtMicros: number | null
}

export interface LeaseRow {
  leaseId: string
  goalId: string
  ownerPrincipalRef: string
  casRevision: number
  acquiredAtMicros: number
  expiresAtMicros: number | null
  releasedAtMicros: number | null
}

export interface IdempotencyKeyRow {
  principalRef: string
  operationId: string
  repositoryRef: string
  worktreeRef: string
  payloadDigest: string
  effectDigest: string | null
  recordedAtMicros: number
  completedAtMicros: number | null
  /** Canonical bytes of the recorded EffectResult (A1d); null = no recorded result. */
  recordedResult: Uint8Array | null
}

export interface ArtifactRow {
  artifactId: string
  goalId: string | null
  kind: string
  digest: string
  locator: string
  recordedBy: string
  recordedAtMicros: number
}

export interface ProjectionCursorRow {
  projectionId: string
  goalId: string | null
  lastAppliedEventSeq: number
  updatedAtMicros: number
}

export interface WakeupHandoffRow {
  wakeupId: string
  goalId: string
  kind: WakeupKind
  fromSessionRef: string
  toSessionRef: string | null
  createdAtMicros: number
  consumedAtMicros: number | null
}

// --- boundary normalization -------------------------------------------------

function normalizeFailure(): never {
  throw storageError('STORAGE_IO_FAILURE', { driverCode: 'row-normalization' })
}

function normalizedRecord(row: unknown): Record<string, unknown> {
  if (!isRecord(row)) normalizeFailure()
  return row
}

function numberField(record: Record<string, unknown>, key: string): number {
  const value = record[key]
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) normalizeFailure()
  return value
}

function nullableNumberField(record: Record<string, unknown>, key: string): number | null {
  return record[key] === null ? null : numberField(record, key)
}

function stringField(record: Record<string, unknown>, key: string): string {
  const value = record[key]
  if (typeof value !== 'string') normalizeFailure()
  return value
}

function nullableStringField(record: Record<string, unknown>, key: string): string | null {
  return record[key] === null ? null : stringField(record, key)
}

function normalizeTransitionRow(row: unknown): TransitionRow {
  const record = normalizedRecord(row)
  return {
    transitionId: stringField(record, 'transition_id'),
    goalId: stringField(record, 'goal_id'),
    status: stringField(record, 'status'),
    requestedBy: stringField(record, 'requested_by'),
    operationId: stringField(record, 'operation_id'),
    payloadDigest: stringField(record, 'payload_digest'),
    createdAtMicros: numberField(record, 'created_at_micros'),
    decidedAtMicros: nullableNumberField(record, 'decided_at_micros'),
  }
}

function normalizeLeaseRow(row: unknown): LeaseRow {
  const record = normalizedRecord(row)
  return {
    leaseId: stringField(record, 'lease_id'),
    goalId: stringField(record, 'goal_id'),
    ownerPrincipalRef: stringField(record, 'owner_principal_ref'),
    casRevision: numberField(record, 'cas_revision'),
    acquiredAtMicros: numberField(record, 'acquired_at_micros'),
    expiresAtMicros: nullableNumberField(record, 'expires_at_micros'),
    releasedAtMicros: nullableNumberField(record, 'released_at_micros'),
  }
}

function normalizeGoalRow(row: unknown): GoalRow {
  const record = normalizedRecord(row)
  return {
    goalId: stringField(record, 'goal_id'),
    revision: numberField(record, 'revision'),
    status: stringField(record, 'status'),
    pendingTransitionId: nullableStringField(record, 'pending_transition_id'),
    updatedAtMicros: numberField(record, 'updated_at_micros'),
  }
}

function normalizeEventRow(row: unknown): EventRow {
  const record = normalizedRecord(row)
  return {
    eventSeq: numberField(record, 'event_seq'),
    eventId: stringField(record, 'event_id'),
    goalId: stringField(record, 'goal_id'),
    kind: stringField(record, 'kind'),
    payload: stringField(record, 'payload'),
    payloadDigest: stringField(record, 'payload_digest'),
    principalRef: stringField(record, 'principal_ref'),
    operationId: stringField(record, 'operation_id'),
    recordedAtMicros: numberField(record, 'recorded_at_micros'),
  }
}

function bytesField(record: Record<string, unknown>, key: string): Uint8Array | null {
  const value = record[key]
  if (value === null) return null
  if (value instanceof Uint8Array) return new Uint8Array(value)
  return normalizeFailure()
}

function normalizeIdempotencyRow(row: unknown): IdempotencyKeyRow {
  const record = normalizedRecord(row)
  return {
    principalRef: stringField(record, 'principal_ref'),
    operationId: stringField(record, 'operation_id'),
    repositoryRef: stringField(record, 'repository_ref'),
    worktreeRef: stringField(record, 'worktree_ref'),
    payloadDigest: stringField(record, 'payload_digest'),
    effectDigest: nullableStringField(record, 'effect_digest'),
    recordedAtMicros: numberField(record, 'recorded_at_micros'),
    completedAtMicros: nullableNumberField(record, 'completed_at_micros'),
    recordedResult: bytesField(record, 'recorded_result'),
  }
}

function _normalizeArtifactRow(row: unknown): ArtifactRow {
  const record = normalizedRecord(row)
  return {
    artifactId: stringField(record, 'artifact_id'),
    goalId: nullableStringField(record, 'goal_id'),
    kind: stringField(record, 'kind'),
    digest: stringField(record, 'digest'),
    locator: stringField(record, 'locator'),
    recordedBy: stringField(record, 'recorded_by'),
    recordedAtMicros: numberField(record, 'recorded_at_micros'),
  }
}

function normalizeCursorRow(row: unknown): ProjectionCursorRow {
  const record = normalizedRecord(row)
  return {
    projectionId: stringField(record, 'projection_id'),
    goalId: nullableStringField(record, 'goal_id'),
    lastAppliedEventSeq: numberField(record, 'last_applied_event_seq'),
    updatedAtMicros: numberField(record, 'updated_at_micros'),
  }
}

function _normalizeWakeupRow(row: unknown): WakeupHandoffRow {
  const record = normalizedRecord(row)
  return {
    wakeupId: stringField(record, 'wakeup_id'),
    goalId: stringField(record, 'goal_id'),
    kind: requireWakeupKind(record.kind, 'kind'),
    fromSessionRef: stringField(record, 'from_session_ref'),
    toSessionRef: nullableStringField(record, 'to_session_ref'),
    createdAtMicros: numberField(record, 'created_at_micros'),
    consumedAtMicros: nullableNumberField(record, 'consumed_at_micros'),
  }
}

// --- shared statement helpers ----------------------------------------------

function run(storage: Storage, sql: string, params: unknown[], constraintName: string): void {
  assertOpen(storage)
  try {
    storage.driver.prepare(sql).run(...params)
  } catch (error) {
    throw mapConstraint(error, constraintName)
  }
}

function readOne<T>(
  storage: Storage,
  sql: string,
  params: unknown[],
  normalize: (row: unknown) => T,
): T | null {
  assertOpen(storage)
  let row: unknown
  try {
    row = storage.driver.prepare(sql).get(...params)
  } catch (error) {
    throw fromDriverError(error, { fallback: 'os-error' })
  }
  return row === undefined ? null : normalize(row)
}

function readAll<T>(
  storage: Storage,
  sql: string,
  params: unknown[],
  normalize: (row: unknown) => T,
): T[] {
  assertOpen(storage)
  let rows: unknown[]
  try {
    rows = storage.driver.prepare(sql).all(...params)
  } catch (error) {
    throw fromDriverError(error, { fallback: 'os-error' })
  }
  return rows.map(normalize)
}

/**
 * Constraint-family mapping: the driver's `SQLITE_CONSTRAINT_*` literal decides
 * the closed reasonCode; the constraint name comes from the calling primitive
 * (its DDL name), never scraped from driver message text.
 */
function mapConstraint(error: unknown, fallbackName = 'statement'): unknown {
  const code = constraintCodeOf(error)
  if (code === null) return fromDriverError(error, { fallback: 'os-error' })
  const name = constraintNameOf(error) ?? fallbackName
  if (code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    return storageError('STORAGE_CONSTRAINT_VIOLATION', {
      reasonCode: 'foreign-key',
      constraint: name,
    })
  }
  if (code === 'SQLITE_CONSTRAINT_TRIGGER') {
    return storageError('STORAGE_CONSTRAINT_VIOLATION', {
      reasonCode: 'append-only',
      constraint: name,
    })
  }
  if (code === 'SQLITE_CONSTRAINT_CHECK') {
    return storageError('STORAGE_CONSTRAINT_VIOLATION', { reasonCode: 'check', constraint: name })
  }
  return storageError('STORAGE_CONSTRAINT_VIOLATION', {
    reasonCode: 'unique-constraint',
    constraint: name,
  })
}

/** Map camelCase API members to snake_case columns; `undefined` members drop. */
function toColumns(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(row)) {
    if (value === undefined) continue
    let column = ''
    for (const char of key) {
      column += char >= 'A' && char <= 'Z' ? `_${char.toLowerCase()}` : char
    }
    out[column] = value
  }
  return out
}

/** Closed member kinds for guarded-update guards and patches. */
type MemberKind = 'safeInt' | 'id' | 'digest' | 'idOrNull' | 'micros' | 'microsOrNull'

function validateMember(kind: MemberKind, value: unknown, fieldPath: string): void {
  switch (kind) {
    case 'safeInt':
      requireSafeInt(value, fieldPath)
      return
    case 'id':
      requireId(value, fieldPath)
      return
    case 'digest':
      requireDigest(value, fieldPath)
      return
    case 'idOrNull':
      requireIdOrNull(value, fieldPath, true)
      return
    case 'micros':
      requireMicrosOrNull(value, fieldPath)
      return
    case 'microsOrNull':
      requireMicrosOrNull(value, fieldPath, true)
  }
}

/**
 * Fail closed on any guard/patch member outside the primitive's closed set or
 * failing its shape — before anything is bound or written (F2). Guard sets
 * cover the row's columns; patch sets exclude identity columns (a patch must
 * never rewrite a primary key).
 */
function validateUpdateInput(
  kind: 'guards' | 'patch',
  input: Record<string, unknown>,
  closed: Record<string, MemberKind>,
): void {
  for (const [member, value] of Object.entries(input)) {
    const memberKind = closed[member]
    if (memberKind === undefined) {
      throw storageError('STORAGE_ARGUMENT_INVALID', { fieldPath: `${kind}.${member}` })
    }
    if (value === undefined) continue
    validateMember(memberKind, value, `${kind}.${member}`)
  }
}

const GOAL_GUARD_MEMBERS: Record<string, MemberKind> = {
  goalId: 'id',
  revision: 'safeInt',
  status: 'id',
  pendingTransitionId: 'idOrNull',
  updatedAtMicros: 'micros',
}

const GOAL_PATCH_MEMBERS: Record<string, MemberKind> = {
  revision: 'safeInt',
  status: 'id',
  pendingTransitionId: 'idOrNull',
  updatedAtMicros: 'micros',
}

const TRANSITION_GUARD_MEMBERS: Record<string, MemberKind> = {
  transitionId: 'id',
  goalId: 'id',
  status: 'id',
  requestedBy: 'id',
  operationId: 'id',
  payloadDigest: 'digest',
  createdAtMicros: 'micros',
  decidedAtMicros: 'microsOrNull',
}

const TRANSITION_PATCH_MEMBERS: Record<string, MemberKind> = {
  status: 'id',
  decidedAtMicros: 'microsOrNull',
}

const LEASE_GUARD_MEMBERS: Record<string, MemberKind> = {
  leaseId: 'id',
  goalId: 'id',
  ownerPrincipalRef: 'id',
  casRevision: 'safeInt',
  acquiredAtMicros: 'micros',
  expiresAtMicros: 'microsOrNull',
  releasedAtMicros: 'microsOrNull',
}

const LEASE_PATCH_MEMBERS: Record<string, MemberKind> = {
  casRevision: 'safeInt',
  expiresAtMicros: 'microsOrNull',
  releasedAtMicros: 'microsOrNull',
}

function guardedUpdate(
  storage: Storage,
  table: string,
  id: Record<string, unknown>,
  guardsInput: Record<string, unknown>,
  patchInput: Record<string, unknown>,
  constraintName: string,
): number {
  const guards = toColumns(guardsInput)
  const patch = toColumns(patchInput)
  const guardKeys = Object.keys(guards)
  if (guardKeys.length === 0) {
    throw storageError('STORAGE_ARGUMENT_INVALID', { fieldPath: 'guards' })
  }
  const patchKeys = Object.keys(patch)
  if (patchKeys.length === 0) {
    throw storageError('STORAGE_ARGUMENT_INVALID', { fieldPath: 'patch' })
  }
  const assignments = patchKeys.map((key) => `${key} = ?`)
  const guardEntries = Object.entries(guards)
  const conditions = guardEntries.map(([key, value]) =>
    value === null ? `${key} IS NULL` : `${key} = ?`,
  )
  const guardValues = guardEntries.filter(([, value]) => value !== null).map(([, value]) => value)
  const params = [...Object.values(patch), ...guardValues, ...Object.values(id)]
  const sql = `UPDATE ${table} SET ${assignments.join(', ')} WHERE ${conditions.join(' AND ')} AND ${Object.keys(
    id,
  )
    .map((key) => `${key} = ?`)
    .join(' AND ')}`
  assertOpen(storage)
  try {
    const info = storage.driver.prepare(sql).run(...params)
    return typeof info.changes === 'number' ? info.changes : 0
  } catch (error) {
    if (constraintCodeOf(error) !== null) throw mapConstraint(error, constraintName)
    throw fromDriverError(error, { fallback: 'os-error' })
  }
}

// --- events ----------------------------------------------------------------

export interface NewEventRow {
  eventId: string
  goalId: string
  kind: string
  payload: string
  payloadDigest: string
  principalRef: string
  operationId: string
  recordedAtMicros?: number
}

/** Insert one event (append-only). Payload over 65,536 bytes is a protocol error. */
export function insertEvent(storage: Storage, input: NewEventRow): void {
  const payloadBytes = new TextEncoder().encode(input.payload).length
  if (payloadBytes > EVENT_PAYLOAD_MAX_BYTES) {
    throw storageError('STORAGE_PAYLOAD_LIMIT_EXCEEDED', { field: 'payload' })
  }
  run(
    storage,
    `INSERT INTO events (event_id, goal_id, kind, payload, payload_digest, principal_ref, operation_id, recorded_at_micros)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      requireId(input.eventId, 'eventId'),
      requireId(input.goalId, 'goalId'),
      requireId(input.kind, 'kind'),
      requireBoundedText(input.payload, 'payload', EVENT_PAYLOAD_MAX_BYTES),
      requireDigest(input.payloadDigest, 'payloadDigest'),
      requireId(input.principalRef, 'principalRef'),
      requireId(input.operationId, 'operationId'),
      requireMicrosOrNull(input.recordedAtMicros ?? storage.clock.nowMicros(), 'recordedAtMicros'),
    ],
    'events',
  )
}

export interface EventQuery {
  goalId?: string
  afterSeq?: number
  limit?: number
}

/** Query events in `event_seq` total order. */
export function queryEvents(storage: Storage, query: EventQuery = {}): EventRow[] {
  const conditions: string[] = []
  const params: unknown[] = []
  if (query.goalId !== undefined) {
    conditions.push('goal_id = ?')
    params.push(requireId(query.goalId, 'goalId'))
  }
  if (query.afterSeq !== undefined) {
    conditions.push('event_seq > ?')
    params.push(requireSafeInt(query.afterSeq, 'afterSeq'))
  }
  let sql = 'SELECT * FROM events'
  if (conditions.length > 0) sql += ` WHERE ${conditions.join(' AND ')}`
  sql += ' ORDER BY event_seq ASC'
  if (query.limit !== undefined) {
    sql += ' LIMIT ?'
    params.push(requireSafeInt(query.limit, 'limit'))
  }
  return readAll(storage, sql, params, normalizeEventRow)
}

// --- goals -----------------------------------------------------------------

export interface NewGoalRow {
  goalId: string
  revision: number
  status: string
  pendingTransitionId?: string | null
  updatedAtMicros?: number
}

export function insertGoal(storage: Storage, input: NewGoalRow): void {
  run(
    storage,
    `INSERT INTO goals (goal_id, revision, status, pending_transition_id, updated_at_micros)
     VALUES (?, ?, ?, ?, ?)`,
    [
      requireId(input.goalId, 'goalId'),
      requireSafeInt(input.revision, 'revision'),
      requireId(input.status, 'status'),
      requireIdOrNull(input.pendingTransitionId ?? null, 'pendingTransitionId', true),
      requireMicrosOrNull(input.updatedAtMicros ?? storage.clock.nowMicros(), 'updatedAtMicros'),
    ],
    'goals',
  )
}

export function getGoal(storage: Storage, goalId: string): GoalRow | null {
  return readOne(
    storage,
    'SELECT * FROM goals WHERE goal_id = ?',
    [requireId(goalId, 'goalId')],
    normalizeGoalRow,
  )
}

export type GoalUpdate = {
  revision?: number
  status?: string
  pendingTransitionId?: string | null
  updatedAtMicros?: number
}

/** Guarded write: updates only rows matching the caller-supplied equality guards. */
export function updateGoalRow(
  storage: Storage,
  goalId: string,
  guards: Partial<GoalRow>,
  patch: GoalUpdate,
): number {
  validateUpdateInput('guards', guards, GOAL_GUARD_MEMBERS)
  validateUpdateInput('patch', patch, GOAL_PATCH_MEMBERS)
  return guardedUpdate(
    storage,
    'goals',
    { goal_id: requireId(goalId, 'goalId') },
    guards as Record<string, unknown>,
    patch as Record<string, unknown>,
    'goals_guarded_update',
  )
}

// --- transitions -----------------------------------------------------------

export interface NewTransitionRow {
  transitionId: string
  goalId: string
  status: string
  requestedBy: string
  operationId: string
  payloadDigest: string
  createdAtMicros?: number
  decidedAtMicros?: number | null
}

export function insertTransition(storage: Storage, input: NewTransitionRow): void {
  run(
    storage,
    `INSERT INTO transitions (transition_id, goal_id, status, requested_by, operation_id, payload_digest, created_at_micros, decided_at_micros)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      requireId(input.transitionId, 'transitionId'),
      requireId(input.goalId, 'goalId'),
      requireId(input.status, 'status'),
      requireId(input.requestedBy, 'requestedBy'),
      requireId(input.operationId, 'operationId'),
      requireDigest(input.payloadDigest, 'payloadDigest'),
      requireMicrosOrNull(input.createdAtMicros ?? storage.clock.nowMicros(), 'createdAtMicros'),
      requireMicrosOrNull(input.decidedAtMicros ?? null, 'decidedAtMicros', true),
    ],
    'transitions',
  )
}

export type TransitionUpdate = {
  status?: string
  decidedAtMicros?: number | null
}

export function updateTransitionRow(
  storage: Storage,
  transitionId: string,
  guards: Partial<TransitionRow>,
  patch: TransitionUpdate,
): number {
  validateUpdateInput('guards', guards, TRANSITION_GUARD_MEMBERS)
  validateUpdateInput('patch', patch, TRANSITION_PATCH_MEMBERS)
  return guardedUpdate(
    storage,
    'transitions',
    { transition_id: requireId(transitionId, 'transitionId') },
    guards as Record<string, unknown>,
    patch as Record<string, unknown>,
    'transitions_guarded_update',
  )
}

/**
 * Read one transition row by id, normalized at the boundary (A1c): the T3/T4
 * decide preconditions (`TRANSITION_ABSENT` / `ALREADY_DECIDED` / `NOT_PENDING`)
 * are decided by FK-P10 from this row state, never from raw SQL.
 */
export function getTransition(storage: Storage, transitionId: string): TransitionRow | null {
  return readOne(
    storage,
    'SELECT * FROM transitions WHERE transition_id = ?',
    [requireId(transitionId, 'transitionId')],
    normalizeTransitionRow,
  )
}

// --- leases (shape only — semantics are FK-P10) ----------------------------

export interface NewLeaseRow {
  leaseId: string
  goalId: string
  ownerPrincipalRef: string
  casRevision: number
  acquiredAtMicros?: number
  expiresAtMicros?: number | null
  releasedAtMicros?: number | null
}

export function insertLease(storage: Storage, input: NewLeaseRow): void {
  run(
    storage,
    `INSERT INTO leases (lease_id, goal_id, owner_principal_ref, cas_revision, acquired_at_micros, expires_at_micros, released_at_micros)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      requireId(input.leaseId, 'leaseId'),
      requireId(input.goalId, 'goalId'),
      requireId(input.ownerPrincipalRef, 'ownerPrincipalRef'),
      requireSafeInt(input.casRevision, 'casRevision'),
      requireMicrosOrNull(input.acquiredAtMicros ?? storage.clock.nowMicros(), 'acquiredAtMicros'),
      requireMicrosOrNull(input.expiresAtMicros ?? null, 'expiresAtMicros', true),
      requireMicrosOrNull(input.releasedAtMicros ?? null, 'releasedAtMicros', true),
    ],
    'leases',
  )
}

export type LeaseUpdate = {
  casRevision?: number
  expiresAtMicros?: number | null
  releasedAtMicros?: number | null
}

export function updateLeaseRow(
  storage: Storage,
  leaseId: string,
  guards: Partial<LeaseRow>,
  patch: LeaseUpdate,
): number {
  validateUpdateInput('guards', guards, LEASE_GUARD_MEMBERS)
  validateUpdateInput('patch', patch, LEASE_PATCH_MEMBERS)
  return guardedUpdate(
    storage,
    'leases',
    { lease_id: requireId(leaseId, 'leaseId') },
    guards as Record<string, unknown>,
    patch as Record<string, unknown>,
    'leases_guarded_update',
  )
}

/**
 * Read one lease row by id, normalized at the boundary (A1c): T4's
 * `leaseId`-unused and owner-check preconditions are decided by FK-P10 from
 * this row state (the FK-P1 `LeaseCasDescriptor` fields carried verbatim).
 */
export function getLease(storage: Storage, leaseId: string): LeaseRow | null {
  return readOne(
    storage,
    'SELECT * FROM leases WHERE lease_id = ?',
    [requireId(leaseId, 'leaseId')],
    normalizeLeaseRow,
  )
}

/**
 * Read the goal's unreleased lease (`released_at_micros IS NULL`), normalized
 * at the boundary (A1c): T4's "no active lease" precondition reads exactly
 * this row. At most one can exist per goal (the `leases_single_active` partial
 * unique index), so a present row is THE active lease.
 */
export function getUnreleasedLease(storage: Storage, goalId: string): LeaseRow | null {
  return readOne(
    storage,
    'SELECT * FROM leases WHERE goal_id = ? AND released_at_micros IS NULL',
    [requireId(goalId, 'goalId')],
    normalizeLeaseRow,
  )
}

// --- idempotency (shape only — semantics are FK-P10) -----------------------

export interface NewIdempotencyKeyRow {
  principalRef: string
  operationId: string
  repositoryRef: string
  worktreeRef: string
  payloadDigest: string
  effectDigest?: string | null
  recordedAtMicros?: number
  completedAtMicros?: number | null
}

export function insertIdempotencyKey(storage: Storage, input: NewIdempotencyKeyRow): void {
  run(
    storage,
    `INSERT INTO idempotency_keys (principal_ref, operation_id, repository_ref, worktree_ref, payload_digest, effect_digest, recorded_at_micros, completed_at_micros)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      requireId(input.principalRef, 'principalRef'),
      requireId(input.operationId, 'operationId'),
      requireId(input.repositoryRef, 'repositoryRef'),
      requireId(input.worktreeRef, 'worktreeRef'),
      requireDigest(input.payloadDigest, 'payloadDigest'),
      input.effectDigest === undefined || input.effectDigest === null
        ? null
        : requireDigest(input.effectDigest, 'effectDigest'),
      requireMicrosOrNull(input.recordedAtMicros ?? storage.clock.nowMicros(), 'recordedAtMicros'),
      requireMicrosOrNull(input.completedAtMicros ?? null, 'completedAtMicros', true),
    ],
    'idempotency_keys',
  )
}

export interface IdempotencyKeyLookup {
  principalRef: string
  operationId: string
  repositoryRef: string
  worktreeRef: string
}

export function getIdempotencyKey(
  storage: Storage,
  key: IdempotencyKeyLookup,
): IdempotencyKeyRow | null {
  return readOne(
    storage,
    `SELECT * FROM idempotency_keys WHERE principal_ref = ? AND operation_id = ? AND repository_ref = ? AND worktree_ref = ?`,
    [
      requireId(key.principalRef, 'principalRef'),
      requireId(key.operationId, 'operationId'),
      requireId(key.repositoryRef, 'repositoryRef'),
      requireId(key.worktreeRef, 'worktreeRef'),
    ],
    normalizeIdempotencyRow,
  )
}

/** A completed binding recorded with its EffectResult's canonical bytes (A1d). */
export interface CompletedBindingRow {
  principalRef: string
  operationId: string
  repositoryRef: string
  worktreeRef: string
  payloadDigest: string
  effectDigest?: string | null
  /** Canonical bytes of the recorded EffectResult — required, stored verbatim. */
  recordedResult: Uint8Array
  recordedAtMicros?: number
  completedAtMicros?: number
}

/**
 * Record a completed binding together with its recorded EffectResult's
 * canonical bytes (A1d). The unified completion write: both APPLIED and NOOP
 * completions store their result, so a later replay never re-derives values
 * (FK-P10 T6's "replayed result is the revision as originally recorded").
 */
export function recordCompletedBinding(storage: Storage, input: CompletedBindingRow): void {
  if (!(input.recordedResult instanceof Uint8Array)) {
    throw storageError('STORAGE_ARGUMENT_INVALID', { fieldPath: 'recordedResult' })
  }
  run(
    storage,
    `INSERT INTO idempotency_keys (principal_ref, operation_id, repository_ref, worktree_ref, payload_digest, effect_digest, recorded_result, recorded_at_micros, completed_at_micros)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      requireId(input.principalRef, 'principalRef'),
      requireId(input.operationId, 'operationId'),
      requireId(input.repositoryRef, 'repositoryRef'),
      requireId(input.worktreeRef, 'worktreeRef'),
      requireDigest(input.payloadDigest, 'payloadDigest'),
      input.effectDigest === undefined || input.effectDigest === null
        ? null
        : requireDigest(input.effectDigest, 'effectDigest'),
      input.recordedResult,
      requireMicrosOrNull(input.recordedAtMicros ?? storage.clock.nowMicros(), 'recordedAtMicros'),
      requireMicrosOrNull(
        input.completedAtMicros ?? storage.clock.nowMicros(),
        'completedAtMicros',
      ),
    ],
    'idempotency_keys',
  )
}

function normalizeRecordedResult(row: unknown): Uint8Array | null {
  return bytesField(normalizedRecord(row), 'recorded_result')
}

/**
 * Read the recorded result bytes for a binding (A1d). `null` means "no
 * recorded result" (a legacy row without one, or an absent binding) — the
 * consumer must treat null as absence and must NOT invent a result.
 */
export function getRecordedResult(storage: Storage, key: IdempotencyKeyLookup): Uint8Array | null {
  return readOne(
    storage,
    `SELECT recorded_result FROM idempotency_keys WHERE principal_ref = ? AND operation_id = ? AND repository_ref = ? AND worktree_ref = ?`,
    [
      requireId(key.principalRef, 'principalRef'),
      requireId(key.operationId, 'operationId'),
      requireId(key.repositoryRef, 'repositoryRef'),
      requireId(key.worktreeRef, 'worktreeRef'),
    ],
    normalizeRecordedResult,
  )
}

// --- artifacts (index only — never evidence authority) ---------------------

export interface NewArtifactRow {
  artifactId: string
  goalId?: string | null
  kind: string
  digest: string
  locator: string
  recordedBy: string
  recordedAtMicros?: number
}

export function insertArtifact(storage: Storage, input: NewArtifactRow): void {
  run(
    storage,
    `INSERT INTO artifacts (artifact_id, goal_id, kind, digest, locator, recorded_by, recorded_at_micros)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      requireId(input.artifactId, 'artifactId'),
      requireIdOrNull(input.goalId ?? null, 'goalId', true),
      requireId(input.kind, 'kind'),
      requireDigest(input.digest, 'digest'),
      requireBoundedText(input.locator, 'locator', ARTIFACT_LOCATOR_MAX_BYTES),
      requireId(input.recordedBy, 'recordedBy'),
      requireMicrosOrNull(input.recordedAtMicros ?? storage.clock.nowMicros(), 'recordedAtMicros'),
    ],
    'artifacts',
  )
}

// --- projection cursors (substrate only — rendering is FK-P11) -------------

export function getProjectionCursor(
  storage: Storage,
  projectionId: string,
): ProjectionCursorRow | null {
  return readOne(
    storage,
    'SELECT * FROM projection_cursors WHERE projection_id = ?',
    [requireId(projectionId, 'projectionId')],
    normalizeCursorRow,
  )
}

export interface SetProjectionCursorRow {
  projectionId: string
  goalId?: string | null
  lastAppliedEventSeq: number
  updatedAtMicros?: number
}

export function setProjectionCursor(storage: Storage, input: SetProjectionCursorRow): void {
  run(
    storage,
    `INSERT INTO projection_cursors (projection_id, goal_id, last_applied_event_seq, updated_at_micros)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(projection_id) DO UPDATE SET
       goal_id = excluded.goal_id,
       last_applied_event_seq = excluded.last_applied_event_seq,
       updated_at_micros = excluded.updated_at_micros`,
    [
      requireId(input.projectionId, 'projectionId'),
      requireIdOrNull(input.goalId ?? null, 'goalId', true),
      requireSafeInt(input.lastAppliedEventSeq, 'lastAppliedEventSeq'),
      requireMicrosOrNull(input.updatedAtMicros ?? storage.clock.nowMicros(), 'updatedAtMicros'),
    ],
    'projection_cursors',
  )
}

// --- wakeup/handoffs (substrate only — timing is FK-P10/P13) ---------------

export interface NewWakeupHandoffRow {
  wakeupId: string
  goalId: string
  kind: WakeupKind
  fromSessionRef: string
  toSessionRef?: string | null
  createdAtMicros?: number
}

export function insertWakeupHandoff(storage: Storage, input: NewWakeupHandoffRow): void {
  run(
    storage,
    `INSERT INTO wakeup_handoffs (wakeup_id, goal_id, kind, from_session_ref, to_session_ref, created_at_micros, consumed_at_micros)
     VALUES (?, ?, ?, ?, ?, ?, NULL)`,
    [
      requireId(input.wakeupId, 'wakeupId'),
      requireId(input.goalId, 'goalId'),
      requireWakeupKind(input.kind, 'kind'),
      requireId(input.fromSessionRef, 'fromSessionRef'),
      requireIdOrNull(input.toSessionRef ?? null, 'toSessionRef', true),
      requireMicrosOrNull(input.createdAtMicros ?? storage.clock.nowMicros(), 'createdAtMicros'),
    ],
    'wakeup_handoffs',
  )
}

/** Guarded consume: marks consumed only if not yet consumed. */
export function consumeWakeupHandoff(
  storage: Storage,
  wakeupId: string,
  consumedAtMicros?: number,
): number {
  return guardedUpdate(
    storage,
    'wakeup_handoffs',
    { wakeup_id: requireId(wakeupId, 'wakeupId') },
    { consumedAtMicros: null },
    {
      consumedAtMicros: requireMicrosOrNull(
        consumedAtMicros ?? storage.clock.nowMicros(),
        'consumedAtMicros',
      ),
    },
    'wakeup_handoffs_consume',
  )
}
