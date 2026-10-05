/**
 * P1-S09 idempotency binding, FK-P1 borrowed shapes, effect construction and
 * input-shape discipline (FK-P10 T6).
 *
 * Binding semantics are P1-S09 LITERAL:
 *  - same key (all five members) + same `payloadDigest`, completed → the
 *    recorded `EffectResult` returned VERBATIM (same `code`, `decision`,
 *    `effectDigest`, `goalRevision` as originally recorded) with
 *    `replay: true` and asserted zero event/revision/cursor deltas;
 *  - same key + different `payloadDigest` → `IDEMPOTENCY_CONFLICT` regardless
 *    of completion state;
 *  - `completed_at_micros` NULL (never written by FK-P10; fixture-seeded only)
 *    → `IDEMPOTENCY_IN_FLIGHT` — fail closed;
 *  - structurally invalid binding → `ENGINE_ARGUMENT_INVALID` (default-deny
 *    per member, #30);
 *  - refused operations record no binding row.
 *
 * Replay-verbatim rule (risk (c); the mandated reviewer probe): the event
 * payload embeds the `EffectResult` document MINUS its `effectDigest` member
 * (F01: embedded values are never retagged or recomputed); `effectDigest` is
 * bound to the event row's `payload_digest` and supplied from the row at
 * replay. `events.payload_digest` = `EffectResult.effectDigest` =
 * `idempotency_keys.effect_digest` by construction.
 *
 * Borrowed FK-P1 shapes are declared here once, member sets verbatim (F05.4 /
 * F05.11): `IdempotencyBinding`, `LeaseCasDescriptor`, `GitGateEvidenceRef`,
 * `EffectResult`.
 */
import {
  type EventRow,
  getGoal,
  getIdempotencyKey,
  getLease,
  getUnreleasedLease,
  type IdempotencyKeyRow,
  insertIdempotencyKey,
  isDigest,
  isId,
  isSafeInt,
  type LeaseRow,
  queryEvents,
  type Storage,
} from '@foreman-line/kernel-state'
import { eventPayloadDigest, type Digest, isDigestLiteral } from './canonical.js'
import { engineError, guardingStorage } from './errors.js'
import { type GoalStatus, isGoalStatus, isReservedGateLiteral } from './state-machine.js'

/** Engine operation names (T3 effectful surface). */
export const OPERATION_NAMES = [
  'claimLease',
  'renewLease',
  'releaseLease',
  'requestTransition',
  'decideTransition',
  'applyTransition',
] as const
export type OperationName = (typeof OPERATION_NAMES)[number]

/** FK-P1 `IdempotencyBinding` (F05.4 verbatim; all keys required). */
export interface IdempotencyBinding {
  principalRef: string
  operationId: string
  repositoryRef: string
  worktreeRef: string
  payloadDigest: string
}

/** FK-P1 `LeaseCasDescriptor` (F05.4 verbatim; all keys required, members nullable). */
export interface LeaseCasDescriptor {
  leaseId: string | null
  leaseOwnerPrincipalRef: string | null
  casRevision: number
  leaseExpiresAtMicros: number | null
}

/** FK-P1 `GitGateEvidenceRef` (F05.4 verbatim; all keys required). */
export interface GitGateEvidenceRef {
  evidenceKind: string
  gitIdentity: string
  digest: string
}

/** FK-P1 `EffectResult` (F05.11 verbatim; eight fields). */
export interface EffectResult {
  resultKind: 'effect-result'
  apiVersion: '0.1.0'
  toolVersion: string
  decision: 'APPLIED' | 'NOOP'
  code: 'EFFECT_APPLIED' | 'EFFECT_NOOP'
  idempotencyKey: IdempotencyBinding
  effectDigest: Digest | null
  goalRevision: number
}

/** The EffectResult document minus `effectDigest` — what the event embeds (F01). */
export type EffectCore = Omit<EffectResult, 'effectDigest'>

/** `requestTransition` result payload (T3). */
export interface PendingTransition {
  transitionId: string
  targetStatus: GoalStatus
}

/** Result payload for `decideTransition` / `applyTransition`. */
export interface DecidedTransitionResult {
  goalId: string
  transitionId: string
  fromStatus: GoalStatus
  targetStatus: GoalStatus
  resultingRevision: number
}

/** `getGoalState` read payload (T3). */
export interface GoalStateView {
  goalId: string
  status: GoalStatus
  revision: number
  pendingTransitionId: string | null
  lease: LeaseCasDescriptor | null
}

/** The wrapper returned by every engine call (T3). */
export interface EngineResult<T> {
  resultKind: 'engine-result'
  operation: OperationName
  effect: EffectResult
  result: T
  replay: boolean
}

// --- input-shape discipline (F05.1 bounds, closed member sets) -------------

/**
 * True for an input member name in the reserved gate namespace (`gate*`,
 * `human*`). Gate-satisfaction-shaped input is never an ordinary unknown field
 * (D9): it refuses `GATE_STATE_NOT_WRITABLE`.
 */
export function isReservedGateMember(name: string): boolean {
  return /^(gate|human)/i.test(name)
}

/** Fail closed on any member outside the exact closed set (unknown fields included). */
export function requireExactMembers(
  value: Record<string, unknown>,
  members: readonly string[],
  base: string,
): void {
  for (const key of Object.keys(value)) {
    if (!members.includes(key)) {
      if (isReservedGateMember(key)) {
        throw engineError('GATE_STATE_NOT_WRITABLE', { fieldPath: `${base}.${key}` })
      }
      throw engineError('ENGINE_ARGUMENT_INVALID', { fieldPath: `${base}.${key}` })
    }
  }
  for (const member of members) {
    if (!(member in value)) {
      throw engineError('ENGINE_ARGUMENT_INVALID', { fieldPath: `${base}.${member}` })
    }
  }
}

/** `Id` shape check (F05.1) — structural refusal with field-path diagnostic. */
export function requireIdValue(value: unknown, fieldPath: string): string {
  if (!isId(value)) throw engineError('ENGINE_ARGUMENT_INVALID', { fieldPath })
  return value
}

/** `SafeInt` shape check (F05.1). */
export function requireSafeIntValue(value: unknown, fieldPath: string): number {
  if (!isSafeInt(value)) throw engineError('ENGINE_ARGUMENT_INVALID', { fieldPath })
  return value
}

/**
 * Status-literal input check (T1): reserved gate-namespace literals are never
 * ordinary values (`GATE_STATE_NOT_WRITABLE`); out-of-vocabulary literals are
 * `TRANSITION_STATUS_UNKNOWN`; structurally invalid input is
 * `ENGINE_ARGUMENT_INVALID`.
 */
export function requireStatusInput(value: unknown, fieldPath: string): GoalStatus {
  if (typeof value !== 'string') throw engineError('ENGINE_ARGUMENT_INVALID', { fieldPath })
  if (isReservedGateLiteral(value)) {
    throw engineError('GATE_STATE_NOT_WRITABLE', { fieldPath })
  }
  if (!isGoalStatus(value)) throw engineError('TRANSITION_STATUS_UNKNOWN', {})
  return value
}

/** Validate an FK-P1 `IdempotencyBinding` verbatim (default-deny per member). */
export function validateBinding(value: unknown, fieldPath: string): IdempotencyBinding {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw engineError('ENGINE_ARGUMENT_INVALID', { fieldPath })
  }
  const record = value as Record<string, unknown>
  const members = ['principalRef', 'operationId', 'repositoryRef', 'worktreeRef', 'payloadDigest']
  requireExactMembers(record, members, fieldPath)
  requireIdValue(record.principalRef, `${fieldPath}.principalRef`)
  requireIdValue(record.operationId, `${fieldPath}.operationId`)
  requireIdValue(record.repositoryRef, `${fieldPath}.repositoryRef`)
  requireIdValue(record.worktreeRef, `${fieldPath}.worktreeRef`)
  if (!isDigest(record.payloadDigest) && !isDigestLiteral(record.payloadDigest)) {
    throw engineError('ENGINE_ARGUMENT_INVALID', { fieldPath: `${fieldPath}.payloadDigest` })
  }
  return {
    principalRef: record.principalRef as string,
    operationId: record.operationId as string,
    repositoryRef: record.repositoryRef as string,
    worktreeRef: record.worktreeRef as string,
    payloadDigest: record.payloadDigest as string,
  }
}

/** Validate one FK-P1 `GitGateEvidenceRef` (F05.4 member shapes verbatim). */
export function validateGateRef(value: unknown, fieldPath: string): GitGateEvidenceRef {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw engineError('ENGINE_ARGUMENT_INVALID', { fieldPath })
  }
  const record = value as Record<string, unknown>
  requireExactMembers(record, ['evidenceKind', 'gitIdentity', 'digest'], fieldPath)
  const kind = record.evidenceKind
  if (
    typeof kind !== 'string' ||
    !(['commit-ref', 'signature', 'status-check', 'merge-record'] as readonly string[]).includes(kind)
  ) {
    // Unknown evidenceKind is a structural failure (GTW-08).
    throw engineError('ENGINE_ARGUMENT_INVALID', { fieldPath: `${fieldPath}.evidenceKind` })
  }
  const identity = record.gitIdentity
  if (
    typeof identity !== 'string' ||
    new TextEncoder().encode(identity).length > 256 ||
    hasUnpairedSurrogate(identity)
  ) {
    // Malformed gitIdentity is a structural failure (GTW-09).
    throw engineError('ENGINE_ARGUMENT_INVALID', { fieldPath: `${fieldPath}.gitIdentity` })
  }
  if (!isDigest(record.digest) && !isDigestLiteral(record.digest)) {
    // Malformed ref digest is a structural failure (GTW-07).
    throw engineError('ENGINE_ARGUMENT_INVALID', { fieldPath: `${fieldPath}.digest` })
  }
  return { evidenceKind: kind, gitIdentity: identity, digest: record.digest as string }
}

function hasUnpairedSurrogate(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    const unit = value.charCodeAt(i)
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = i + 1 < value.length ? value.charCodeAt(i + 1) : 0
      if (next < 0xdc00 || next > 0xdfff) return true
      i += 1
    } else if (unit >= 0xdc00 && unit <= 0xdfff) {
      return true
    }
  }
  return false
}

/**
 * Validate `gateEvidenceRefs`: `Array<GitGateEvidenceRef, 64>` (F05.4); absent
 * or empty means "no refs supplied"; over-limit or any malformed member is a
 * structural refusal.
 */
export function validateGateRefs(
  value: unknown,
  fieldPath: string,
): GitGateEvidenceRef[] | null {
  if (value === undefined) return null
  if (!Array.isArray(value)) throw engineError('ENGINE_ARGUMENT_INVALID', { fieldPath })
  if (value.length > 64) throw engineError('ENGINE_ARGUMENT_INVALID', { fieldPath })
  return value.map((member, index) => validateGateRef(member, `${fieldPath}[${index}]`))
}

// --- binding state + recording --------------------------------------------

export type BindingState =
  | { state: 'absent' }
  | { state: 'in-flight' }
  | { state: 'completed'; row: IdempotencyKeyRow }

/** Read the binding row (a refusal is not an effect; reads never record). */
export function lookupBinding(storage: Storage, binding: IdempotencyBinding): BindingState {
  const row = guardingStorage(() =>
    getIdempotencyKey(storage, {
      principalRef: binding.principalRef,
      operationId: binding.operationId,
      repositoryRef: binding.repositoryRef,
      worktreeRef: binding.worktreeRef,
    }),
  )
  if (row === null) return { state: 'absent' }
  if (row.payloadDigest !== binding.payloadDigest) {
    // Same key, different payloadDigest — regardless of completion state.
    throw engineError('IDEMPOTENCY_CONFLICT', {
      principalRef: binding.principalRef,
      operationId: binding.operationId,
    })
  }
  if (row.completedAtMicros === null) {
    throw engineError('IDEMPOTENCY_IN_FLIGHT', {
      principalRef: binding.principalRef,
      operationId: binding.operationId,
    })
  }
  return { state: 'completed', row }
}

/**
 * Record the completed binding row (T6/T7: exactly one per accepted operation,
 * in the same transaction as the effect; `effect_digest` = the event's
 * `payload_digest` for APPLIED, null for NOOP).
 */
export function recordCompletedBinding(
  storage: Storage,
  binding: IdempotencyBinding,
  effectDigest: Digest | null,
  nowMicros: number,
): void {
  guardingStorage(() => {
    insertIdempotencyKey(storage, {
      principalRef: binding.principalRef,
      operationId: binding.operationId,
      repositoryRef: binding.repositoryRef,
      worktreeRef: binding.worktreeRef,
      payloadDigest: binding.payloadDigest,
      effectDigest,
      recordedAtMicros: nowMicros,
      completedAtMicros: nowMicros,
    })
  })
}

// --- effect construction ---------------------------------------------------

/** Build the embedded effect document (EffectResult minus `effectDigest`). */
export function buildEffectCore(
  toolVersion: string,
  decision: 'APPLIED' | 'NOOP',
  binding: IdempotencyBinding,
  goalRevision: number,
): EffectCore {
  return {
    resultKind: 'effect-result',
    apiVersion: '0.1.0',
    toolVersion,
    decision,
    code: decision === 'APPLIED' ? 'EFFECT_APPLIED' : 'EFFECT_NOOP',
    idempotencyKey: binding,
    goalRevision,
  }
}

/**
 * Attach the effect digest to an embedded effect document (replay path: the
 * digest is supplied from the event row — F01, never recomputed from the
 * embedded value).
 */
export function finalizeEffect(core: EffectCore, effectDigest: Digest | null): EffectResult {
  return { ...core, effectDigest }
}

// --- recorded-result reconstruction (T6) ----------------------------------

export interface RecordedOutcome {
  effect: EffectResult
  result: unknown
}

function eventPayload(row: EventRow): Record<string, unknown> {
  const parsed: unknown = guardingStorage(() => JSON.parse(row.payload))
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw engineError('STORAGE_FAILURE', { storageCode: 'STORAGE_IO_FAILURE' })
  }
  return parsed as Record<string, unknown>
}

function descriptorFromLeaseRow(row: LeaseRow, casRevision: number): LeaseCasDescriptor {
  return {
    leaseId: row.leaseId,
    leaseOwnerPrincipalRef: row.ownerPrincipalRef,
    casRevision,
    leaseExpiresAtMicros: row.expiresAtMicros,
  }
}

/**
 * Rebuild the operation result payload from the recorded event (T8 fields).
 * Every rebuild member comes from immutable recorded bytes except
 * `LeaseCasDescriptor.leaseExpiresAtMicros` of a `lease.released` event, which
 * is read from the (post-release immutable) lease row.
 */
export function rebuildResult(
  kind: string,
  payload: Record<string, unknown>,
  principalRef: string,
  releasedLeaseExpiry: number | null,
): unknown {
  const resultingRevision = payload.resultingRevision as number
  switch (kind) {
    case 'lease.claimed':
    case 'lease.takeover':
    case 'lease.renewed':
      return {
        leaseId: payload.leaseId as string,
        leaseOwnerPrincipalRef: principalRef,
        casRevision: resultingRevision,
        leaseExpiresAtMicros: payload.expiresAtMicros as number,
      } satisfies LeaseCasDescriptor
    case 'lease.released':
      return {
        leaseId: payload.leaseId as string,
        leaseOwnerPrincipalRef: principalRef,
        casRevision: resultingRevision,
        leaseExpiresAtMicros: releasedLeaseExpiry,
      } satisfies LeaseCasDescriptor
    case 'transition.requested':
      return {
        transitionId: payload.transitionId as string,
        targetStatus: payload.targetStatus as GoalStatus,
      } satisfies PendingTransition
    case 'transition.applied':
    case 'transition.rejected':
      return {
        goalId: payload.goalId as string,
        transitionId: payload.transitionId as string,
        fromStatus: payload.fromStatus as GoalStatus,
        targetStatus: payload.targetStatus as GoalStatus,
        resultingRevision,
      } satisfies DecidedTransitionResult
    default:
      throw engineError('STORAGE_FAILURE', { storageCode: 'STORAGE_IO_FAILURE' })
  }
}

/**
 * Locate the recorded event for a completed APPLIED binding: the binding's
 * `effect_digest` IS the event's `payload_digest` (three-way equality), so the
 * lookup is a digest match over the event stream (linear-time decode, #19).
 */
export function findRecordedEvent(storage: Storage, effectDigest: Digest): EventRow | null {
  const rows = guardingStorage(() => queryEvents(storage))
  for (const row of rows) {
    if (row.payloadDigest === effectDigest) return row
  }
  return null
}

/**
 * Reconstruct the recorded outcome for a completed binding.
 *
 * APPLIED replay: exact reconstruction from recorded bytes (the event payload
 * embeds the effect document minus `effectDigest`; the digest comes from the
 * binding row). NOOP replay: T7's NOOP transaction records the binding row
 * only (no event), so `code`/`decision`/`effectDigest`/`idempotencyKey` are
 * verbatim from that row while `goalRevision` and the result payload are
 * re-derived from current state — equal to the recorded values while the goal
 * is unchanged since the NOOP (recorded residual; see README).
 */
export function reconstructRecordedOutcome(
  storage: Storage,
  binding: IdempotencyBinding,
  row: IdempotencyKeyRow,
  toolVersion: string,
  goalId: string,
): RecordedOutcome {
  if (row.effectDigest !== null) {
    const digest = row.effectDigest
    if (!isDigestLiteral(digest)) {
      throw engineError('STORAGE_FAILURE', { storageCode: 'STORAGE_IO_FAILURE' })
    }
    const eventRow = findRecordedEvent(storage, digest)
    if (eventRow === null) {
      throw engineError('STORAGE_FAILURE', { storageCode: 'STORAGE_IO_FAILURE' })
    }
    const payload = eventPayload(eventRow)
    const coreValue: unknown = payload.effect
    // The embedded effect document is recorded engine output (not external
    // input); the digest member is supplied from the row (F01), never taken
    // from the embedded value.
    const core = coreValue as EffectCore
    // `lease.released` payloads omit the stored expiry; the lease row is
    // immutable after release, so the re-read reproduces the recorded value.
    let releasedLeaseExpiry: number | null = null
    if (eventRow.kind === 'lease.released') {
      const leaseId = requireIdValue(payload.leaseId, 'replay.leaseId')
      const leaseRow = guardingStorage(() => getLease(storage, leaseId))
      releasedLeaseExpiry = leaseRow?.expiresAtMicros ?? null
    }
    return {
      effect: finalizeEffect(core, digest),
      result: rebuildResult(eventRow.kind, payload, eventRow.principalRef, releasedLeaseExpiry),
    }
  }
  // NOOP replay (documented residual above): the binding row is the only
  // recorded artifact of a NOOP, so the two state-derived members are
  // re-derived from current rows (identical to the recorded values while the
  // goal is unchanged since the NOOP).
  const current = guardingStorage(() => {
    const goal = getGoal(storage, goalId)
    const lease = getUnreleasedLease(storage, goalId)
    return {
      revision: goal === null ? 0 : goal.revision,
      descriptor: lease === null ? null : descriptorFromLeaseRow(lease, lease.casRevision),
    }
  })
  return {
    effect: finalizeEffect(buildEffectCore(toolVersion, 'NOOP', binding, current.revision), null),
    result: current.descriptor,
  }
}
