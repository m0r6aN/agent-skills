/**
 * Engine core and lease semantics (FK-P10 T3/T4/T6/T7).
 *
 * Single-writer leases per D14: at most one active (unreleased) lease per goal
 * (substrate partial unique index `leases_single_active` + engine takeover
 * stamping). Every effectful operation carries `expectedRevision` and is
 * compare-and-set guarded against `goals.revision`; every accepted effectful
 * operation bumps `goals.revision` by exactly one and appends exactly one
 * event (T7 write sets; risk (d) ruled design).
 *
 * Trusted time (T5): each operation reads the injected seam exactly once via
 * `TrustedClock`; no API parameter carries caller time.
 *
 * Idempotency (T6, P1-S09 literal): the binding pre-check runs before the
 * write lock; the binding re-check inside the single `withTransaction` is the
 * correctness gate for same-binding racers (CN-04: exactly one applies, the
 * peer replays the recorded result with zero duplicate effects).
 *
 * `leases.cas_revision` is refreshed to the post-bump goal revision by every
 * lease-bound operation that bumps `goals.revision` (T4 invariant "always
 * equals the goal revision as of the lease's last successful lease-bound
 * operation"; see README for the T7-row/T4-sentence reconciliation).
 */
import {
  type Clock,
  type GoalRow,
  getGoal,
  getLease,
  getUnreleasedLease,
  insertEvent,
  insertLease,
  type LeaseRow,
  queryEvents,
  type Storage,
  setProjectionCursor,
  updateGoalRow,
  updateLeaseRow,
  withTransaction,
} from '@foreman-line/kernel-state'
import {
  canonicalBytes,
  canonicalEncode,
  type Digest,
  digestBytes,
  eventPayloadDigest,
} from './canonical.js'
import { TrustedClock } from './clock.js'
import {
  EngineError,
  engineError,
  guardingStorage,
  withTransientRetry,
  wrapStorageFailure,
} from './errors.js'
import {
  buildEffectCore,
  type EffectResult,
  type EngineResult,
  finalizeEffect,
  type IdempotencyBinding,
  type LeaseCasDescriptor,
  lookupBinding,
  type OperationName,
  reconstructRecordedOutcome,
  recordCompletedBinding,
  requireExactMembers,
  requireIdValue,
  requireSafeIntValue,
  validateBinding,
} from './idempotency.js'
import {
  type EvidenceKind,
  type EvidenceKindNarrowing,
  type GoalStatus,
  isGoalStatus,
  isTerminalStatus,
  resolveEvidenceKindPolicy,
} from './state-machine.js'

/** T3 minimum lease duration (SafeInt micros). */
export const LEASE_DURATION_MIN_MICROS = 1

/** T3 maximum lease duration (24 h; OQ-11 — amend via recorded spec bump). */
export const LEASE_MAX_DURATION_MICROS = 86_400_000_000

/** The reserved `goal-state` projection cursor id (OQ-4; THE goal cursor). */
export const GOAL_STATE_PROJECTION_ID = 'goal-state'

/** Engine handle (T3): an FK-P9 `Storage`, a `TrustedClock`, and policy. */
export interface Engine {
  readonly storage: Storage
  readonly clock: TrustedClock
  readonly toolVersion: string
  readonly evidenceKindPolicy: Record<'L4' | 'L6', readonly EvidenceKind[]>
}

export interface CreateEngineOptions {
  storage: Storage
  clock: Clock
  toolVersion: string
  evidenceKindPolicy?: EvidenceKindNarrowing
}

/** Construct the engine (T3). Tool version is stamped into every EffectResult. */
export function createEngine(options: CreateEngineOptions): Engine {
  if (options === null || typeof options !== 'object') {
    throw engineError('ENGINE_ARGUMENT_INVALID', { fieldPath: 'createEngine' })
  }
  const toolVersion = options.toolVersion
  const toolVersionBytes =
    typeof toolVersion === 'string' ? new TextEncoder().encode(toolVersion) : null
  if (
    toolVersionBytes === null ||
    toolVersion.length === 0 ||
    toolVersionBytes.length > 128 ||
    // Bytes<128> ASCII (F05.11): every UTF-8 byte below 0x80.
    toolVersionBytes.some((byte) => byte > 0x7f)
  ) {
    throw engineError('ENGINE_ARGUMENT_INVALID', { fieldPath: 'toolVersion' })
  }
  return {
    storage: options.storage,
    clock: new TrustedClock(options.clock),
    toolVersion,
    evidenceKindPolicy: resolveEvidenceKindPolicy(options.evidenceKindPolicy),
  }
}

// --- shared engine internals ----------------------------------------------

/** Deterministic Id for engine-generated rows (events, transitions). */
export function derivedId(prefix: string, doc: unknown): string {
  const digest = digestBytes(canonicalBytes(doc))
  return `${prefix}${digest.slice('sha256:'.length, 'sha256:'.length + 32)}`
}

/** Goal read with defense-in-depth vocabulary validation (T1/T9). */
export function readGoalChecked(
  storage: Storage,
  goalId: string,
): GoalRow & { status: GoalStatus } {
  const goal = guardingStorage(() => getGoal(storage, goalId))
  if (goal === null) throw engineError('GOAL_ABSENT', { goalId })
  if (!isGoalStatus(goal.status)) throw engineError('GOAL_STATUS_UNKNOWN', {})
  return { ...goal, status: goal.status }
}

/** CAS guard (T4): mismatch is `STATE_REVISION_STALE`, never a silent write. */
export function checkCas(goal: GoalRow, expectedRevision: number): void {
  if (goal.revision !== expectedRevision) {
    throw engineError('STATE_REVISION_STALE', {
      expectedRevision,
      actualRevision: goal.revision,
    })
  }
}

/**
 * Lease precondition for state writes (T4): active, owner-bound, unexpired at
 * the trusted reading. An expired lease is unusable in every direction.
 */
export function requireStateWriteLease(
  storage: Storage,
  goalId: string,
  binding: IdempotencyBinding,
  nowMicros: number,
): LeaseRow {
  const lease = guardingStorage(() => getUnreleasedLease(storage, goalId))
  if (lease === null) throw engineError('LEASE_NOT_ACTIVE', { reason: 'absent' })
  if (lease.ownerPrincipalRef !== binding.principalRef) {
    throw engineError('LEASE_NOT_OWNER', { leaseId: lease.leaseId, goalId })
  }
  if (lease.expiresAtMicros !== null && lease.expiresAtMicros <= nowMicros) {
    throw engineError('LEASE_EXPIRED', { leaseId: lease.leaseId })
  }
  return lease
}

/** Refresh the lease CAS revision after a goal-revision bump (T4 invariant). */
export function refreshLeaseCas(storage: Storage, lease: LeaseRow, newRevision: number): void {
  const changed = guardingStorage(() =>
    updateLeaseRow(
      storage,
      lease.leaseId,
      { releasedAtMicros: null, casRevision: lease.casRevision },
      { casRevision: newRevision },
    ),
  )
  if (changed !== 1) throw engineError('LEASE_NOT_ACTIVE', { reason: 'released' })
}

/** Projection of a lease row into the FK-P1 boundary descriptor (F05.4). */
export function descriptorFromLeaseRow(row: LeaseRow): LeaseCasDescriptor {
  return {
    leaseId: row.leaseId,
    leaseOwnerPrincipalRef: row.ownerPrincipalRef,
    casRevision: row.casRevision,
    leaseExpiresAtMicros: row.expiresAtMicros,
  }
}

/**
 * Append one event (T8 payload carries `effect` minus `effectDigest`), and
 * return the appended `event_seq` for the cursor advance.
 */
export function writeEvent(
  storage: Storage,
  kind: string,
  payload: Record<string, unknown>,
  binding: IdempotencyBinding,
  nowMicros: number,
): { seq: number; effectDigest: Digest } {
  const effectDigest = eventPayloadDigest(payload)
  guardingStorage(() => {
    insertEvent(storage, {
      eventId: derivedId('evt-', { goalId: payload.goalId, kind, binding }),
      goalId: payload.goalId as string,
      kind,
      payload: canonicalEncode(payload),
      payloadDigest: effectDigest,
      principalRef: binding.principalRef,
      operationId: binding.operationId,
      recordedAtMicros: nowMicros,
    })
  })
  const events = guardingStorage(() => queryEvents(storage, { goalId: payload.goalId as string }))
  const last = events[events.length - 1]
  if (last === undefined)
    throw engineError('STORAGE_FAILURE', { storageCode: 'STORAGE_IO_FAILURE' })
  return { seq: last.eventSeq, effectDigest }
}

/** Advance the reserved `goal-state` cursor to the appended event (OQ-4). */
export function advanceGoalStateCursor(
  storage: Storage,
  goalId: string,
  eventSeq: number,
  nowMicros: number,
): void {
  guardingStorage(() => {
    setProjectionCursor(storage, {
      projectionId: GOAL_STATE_PROJECTION_ID,
      goalId,
      lastAppliedEventSeq: eventSeq,
      updatedAtMicros: nowMicros,
    })
  })
}

/** The outcome of one effectful operation inside its single transaction. */
export interface Executed<T> {
  effect: EffectResult
  result: T
}

/**
 * The shared effectful pipeline (T6/T7). First-failure order, pinned by the
 * precedence tests and the README: structural input → idempotency (replay /
 * `IDEMPOTENCY_CONFLICT` / `IDEMPOTENCY_IN_FLIGHT`) → trusted clock → the
 * operation's preconditions (goal → lease → the operation's state guards —
 * pending/transition — then CAS → edge/gate) → write set. Exactly one `withTransaction` per operation; the binding is re-checked
 * inside it so same-binding racers converge on one applied effect and one
 * replay.
 */
export function runEffectful<T>(
  engine: Engine,
  operation: OperationName,
  request: { expectedRevision: number; idempotencyKey: unknown },
  goalId: string,
  execute: (context: { now: number; binding: IdempotencyBinding }) => Executed<T>,
): EngineResult<T> {
  // Structural validation runs first even for pure replays (first-failure
  // order); the operations re-derive their own typed copy from the request.
  requireSafeIntValue(request.expectedRevision, 'expectedRevision')
  const binding = validateBinding(request.idempotencyKey, 'idempotencyKey')

  const wrap = (executed: Executed<T>, replay: boolean): EngineResult<T> => ({
    resultKind: 'engine-result',
    operation,
    effect: executed.effect,
    result: executed.result,
    replay,
  })

  const replayOf = (executedFromRow: Executed<T>): EngineResult<T> => wrap(executedFromRow, true)

  // Idempotency pre-check (read-only; pure replays never reach the clock).
  const preState = withTransientRetry(() => lookupBinding(engine.storage, binding))
  if (preState.state === 'completed') {
    const outcome = reconstructRecordedOutcome(
      engine.storage,
      binding,
      preState.row,
      engine.toolVersion,
      goalId,
    )
    return replayOf({ effect: outcome.effect, result: outcome.result as T })
  }

  // Trusted time: exactly one seam read per operation (T5).
  const now = engine.clock.nowMicros()

  // In-transaction EngineError refusals cannot cross FK-P9's `withTransaction`
  // seam directly: the substrate converts any non-`StorageError` thrown from
  // its callback into a `StorageError` (fromDriverError fallback), which would
  // destroy the typed refusal code. So the refusal is stashed here and
  // re-raised after the substrate has rolled the transaction back; genuine
  // substrate failures are wrapped as `STORAGE_FAILURE` (standing #1), and
  // transient lock/OS classes are retried (R2) — a typed refusal always wins
  // and is never retried.
  let outcome: { executed: Executed<T>; replay: boolean }
  try {
    outcome = withTransientRetry(() => {
      let refusal: EngineError | null = null
      try {
        return withTransaction(engine.storage, () => {
          try {
            // In-transaction binding re-check: the correctness gate for
            // same-binding racers (CN-04/CN-05) and for retries after a
            // committed-but-unreturned result (CR-04 replay).
            const state = lookupBinding(engine.storage, binding)
            if (state.state === 'completed') {
              const replayed = reconstructRecordedOutcome(
                engine.storage,
                binding,
                state.row,
                engine.toolVersion,
                goalId,
              )
              return {
                executed: { effect: replayed.effect, result: replayed.result as T },
                replay: true,
              }
            }
            return { executed: execute({ now, binding }), replay: false }
          } catch (error) {
            if (error instanceof EngineError) {
              refusal = error
              // Sentinel throw: the substrate rolls the transaction back, then
              // converts this into a StorageError that is discarded in favor of
              // the stashed typed refusal.
              throw new Error('fk-p10-transaction-abort')
            }
            throw error
          }
        })
      } catch (error) {
        if (refusal !== null) throw refusal
        throw error
      }
    })
  } catch (error) {
    throw error instanceof EngineError ? error : wrapStorageFailure(error)
  }

  return wrap(outcome.executed, outcome.replay)
}

/** Assemble the completed binding + effect for one APPLIED write set. */
export function commitEffectApplied<T>(
  storage: Storage,
  toolVersion: string,
  binding: IdempotencyBinding,
  goalRevision: number,
  result: T,
  eventKind: string,
  payloadFields: Record<string, unknown>,
  now: number,
): Executed<T> {
  const core = buildEffectCore(toolVersion, 'APPLIED', binding, goalRevision)
  const payload = { ...payloadFields, effect: core }
  const written = writeEvent(storage, eventKind, payload, binding, now)
  recordCompletedBinding(storage, binding, written.effectDigest, now)
  advanceGoalStateCursor(storage, payloadFields.goalId as string, written.seq, now)
  return { effect: finalizeEffect(core, written.effectDigest), result }
}

/** Assemble a NOOP outcome (OQ-6: same-principal re-claim only). */
export function commitEffectNoop<T>(
  storage: Storage,
  toolVersion: string,
  binding: IdempotencyBinding,
  goalRevision: number,
  result: T,
  now: number,
): Executed<T> {
  const core = buildEffectCore(toolVersion, 'NOOP', binding, goalRevision)
  // T7 claim (no-op): the completed binding row is the only write.
  recordCompletedBinding(storage, binding, null, now)
  return { effect: finalizeEffect(core, null), result }
}

// --- T3 lease operations ---------------------------------------------------

export interface ClaimLeaseRequest {
  goalId: unknown
  leaseId: unknown
  durationMicros: unknown
  expectedRevision: number
  idempotencyKey: unknown
}

function requireDuration(value: unknown, fieldPath: string): number {
  const duration = requireSafeIntValue(value, fieldPath)
  if (duration < LEASE_DURATION_MIN_MICROS || duration > LEASE_MAX_DURATION_MICROS) {
    throw engineError('ENGINE_ARGUMENT_INVALID', { fieldPath })
  }
  return duration
}

function requireRequestRecord(
  value: unknown,
  members: readonly string[],
  op: string,
): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw engineError('ENGINE_ARGUMENT_INVALID', { fieldPath: op })
  }
  const record = value as Record<string, unknown>
  requireExactMembers(record, members, op)
  return record
}

/**
 * `claimLease` (T4): grant (no active lease), takeover (prior lease expired at
 * the trusted reading — stamped `released_at_micros` under a guarded update),
 * or NOOP (same principal already holds an unexpired lease).
 */
export function claimLease(
  engine: Engine,
  request: ClaimLeaseRequest,
): EngineResult<LeaseCasDescriptor> {
  const record = requireRequestRecord(
    request,
    ['goalId', 'leaseId', 'durationMicros', 'expectedRevision', 'idempotencyKey'],
    'claimLease',
  )
  const goalId = requireIdValue(record.goalId, 'claimLease.goalId')
  const leaseId = requireIdValue(record.leaseId, 'claimLease.leaseId')
  const durationMicros = requireDuration(record.durationMicros, 'claimLease.durationMicros')
  const expectedRevision = requireSafeIntValue(record.expectedRevision, 'expectedRevision')

  return runEffectful<LeaseCasDescriptor>(
    engine,
    'claimLease',
    { expectedRevision, idempotencyKey: record.idempotencyKey },
    goalId,
    ({ now, binding }) => {
      const goal = readGoalChecked(engine.storage, goalId)
      if (isTerminalStatus(goal.status)) throw engineError('GOAL_TERMINAL', { goalId })
      const existing = guardingStorage(() => getUnreleasedLease(engine.storage, goalId))

      // T4 precondition order: lease state first, then CAS — but every
      // effectful path is CAS-guarded (risk (d); the claim-noop binding write
      // included).
      if (existing !== null) {
        const unexpired = existing.expiresAtMicros === null || existing.expiresAtMicros > now
        if (unexpired && existing.ownerPrincipalRef !== binding.principalRef) {
          throw engineError('LEASE_HELD', { leaseId: existing.leaseId })
        }
      }
      checkCas(goal, expectedRevision)

      if (existing === null) {
        if (guardingStorage(() => getLease(engine.storage, leaseId)) !== null) {
          throw engineError('ENGINE_ARGUMENT_INVALID', { fieldPath: 'claimLease.leaseId' })
        }
        const revision = goal.revision + 1
        const expiresAtMicros = now + durationMicros
        guardingStorage(() => {
          insertLease(engine.storage, {
            leaseId,
            goalId,
            ownerPrincipalRef: binding.principalRef,
            casRevision: revision,
            acquiredAtMicros: now,
            expiresAtMicros,
            releasedAtMicros: null,
          })
          const changed = updateGoalRow(
            engine.storage,
            goalId,
            { revision: goal.revision },
            { revision, updatedAtMicros: now },
          )
          if (changed !== 1)
            throw engineError('STATE_REVISION_STALE', {
              expectedRevision,
              actualRevision: goal.revision,
            })
        })
        return commitEffectApplied<LeaseCasDescriptor>(
          engine.storage,
          engine.toolVersion,
          binding,
          revision,
          {
            leaseId,
            leaseOwnerPrincipalRef: binding.principalRef,
            casRevision: revision,
            leaseExpiresAtMicros: expiresAtMicros,
          },
          'lease.claimed',
          {
            goalId,
            leaseId,
            principalRef: binding.principalRef,
            operationId: binding.operationId,
            durationMicros,
            expiresAtMicros,
            resultingRevision: revision,
          },
          now,
        )
      }

      const unexpired = existing.expiresAtMicros === null || existing.expiresAtMicros > now
      if (unexpired) {
        if (existing.ownerPrincipalRef !== binding.principalRef) {
          throw engineError('LEASE_HELD', { leaseId: existing.leaseId })
        }
        // OQ-6: EFFECT_NOOP is same-principal re-claim only.
        return commitEffectNoop<LeaseCasDescriptor>(
          engine.storage,
          engine.toolVersion,
          binding,
          goal.revision,
          descriptorFromLeaseRow(existing),
          now,
        )
      }

      // Takeover: stamp the expired prior lease (guarded IS NULL) in the same
      // transaction as the new lease — one transaction (T7).
      const stamped = guardingStorage(() =>
        updateLeaseRow(
          engine.storage,
          existing.leaseId,
          { releasedAtMicros: null },
          { releasedAtMicros: now },
        ),
      )
      if (stamped !== 1) throw engineError('LEASE_HELD', { leaseId: existing.leaseId })
      const revision = goal.revision + 1
      const expiresAtMicros = now + durationMicros
      guardingStorage(() => {
        insertLease(engine.storage, {
          leaseId,
          goalId,
          ownerPrincipalRef: binding.principalRef,
          casRevision: revision,
          acquiredAtMicros: now,
          expiresAtMicros,
          releasedAtMicros: null,
        })
        const changed = updateGoalRow(
          engine.storage,
          goalId,
          { revision: goal.revision },
          { revision, updatedAtMicros: now },
        )
        if (changed !== 1)
          throw engineError('STATE_REVISION_STALE', {
            expectedRevision,
            actualRevision: goal.revision,
          })
      })
      return commitEffectApplied<LeaseCasDescriptor>(
        engine.storage,
        engine.toolVersion,
        binding,
        revision,
        {
          leaseId,
          leaseOwnerPrincipalRef: binding.principalRef,
          casRevision: revision,
          leaseExpiresAtMicros: expiresAtMicros,
        },
        'lease.takeover',
        {
          goalId,
          leaseId,
          principalRef: binding.principalRef,
          operationId: binding.operationId,
          durationMicros,
          expiresAtMicros,
          resultingRevision: revision,
          priorLeaseId: existing.leaseId,
          priorExpiresAtMicros: existing.expiresAtMicros,
        },
        now,
      )
    },
  )
}

export interface RenewLeaseRequest {
  goalId: unknown
  leaseId: unknown
  durationMicros: unknown
  expectedRevision: number
  idempotencyKey: unknown
}

function requireNamedLease(
  storage: Storage,
  goalId: string,
  leaseId: string,
  binding: IdempotencyBinding,
  now: number,
): LeaseRow {
  const lease = guardingStorage(() => getLease(storage, leaseId))
  if (lease === null) throw engineError('LEASE_NOT_ACTIVE', { reason: 'absent' })
  if (lease.goalId !== goalId) {
    throw engineError('ENGINE_ARGUMENT_INVALID', { fieldPath: 'leaseId' })
  }
  if (lease.releasedAtMicros !== null) {
    throw engineError('LEASE_NOT_ACTIVE', { reason: 'released' })
  }
  if (lease.ownerPrincipalRef !== binding.principalRef) {
    throw engineError('LEASE_NOT_OWNER', { leaseId: lease.leaseId, goalId })
  }
  if (lease.expiresAtMicros !== null && lease.expiresAtMicros <= now) {
    throw engineError('LEASE_EXPIRED', { leaseId: lease.leaseId })
  }
  return lease
}

/** `renewLease` (T4): extends the owner's unexpired lease. */
export function renewLease(
  engine: Engine,
  request: RenewLeaseRequest,
): EngineResult<LeaseCasDescriptor> {
  const record = requireRequestRecord(
    request,
    ['goalId', 'leaseId', 'durationMicros', 'expectedRevision', 'idempotencyKey'],
    'renewLease',
  )
  const goalId = requireIdValue(record.goalId, 'renewLease.goalId')
  const leaseId = requireIdValue(record.leaseId, 'renewLease.leaseId')
  const durationMicros = requireDuration(record.durationMicros, 'renewLease.durationMicros')
  const expectedRevision = requireSafeIntValue(record.expectedRevision, 'expectedRevision')

  return runEffectful<LeaseCasDescriptor>(
    engine,
    'renewLease',
    { expectedRevision, idempotencyKey: record.idempotencyKey },
    goalId,
    ({ now, binding }) => {
      const goal = readGoalChecked(engine.storage, goalId)
      const lease = requireNamedLease(engine.storage, goalId, leaseId, binding, now)
      checkCas(goal, expectedRevision)
      const revision = goal.revision + 1
      const expiresAtMicros = now + durationMicros
      guardingStorage(() => {
        const changed = updateLeaseRow(
          engine.storage,
          leaseId,
          { releasedAtMicros: null, casRevision: lease.casRevision },
          { expiresAtMicros, casRevision: revision },
        )
        if (changed !== 1) throw engineError('LEASE_NOT_ACTIVE', { reason: 'released' })
        const goalChanged = updateGoalRow(
          engine.storage,
          goalId,
          { revision: goal.revision },
          { revision, updatedAtMicros: now },
        )
        if (goalChanged !== 1) {
          throw engineError('STATE_REVISION_STALE', {
            expectedRevision,
            actualRevision: goal.revision,
          })
        }
      })
      return commitEffectApplied<LeaseCasDescriptor>(
        engine.storage,
        engine.toolVersion,
        binding,
        revision,
        {
          leaseId,
          leaseOwnerPrincipalRef: binding.principalRef,
          casRevision: revision,
          leaseExpiresAtMicros: expiresAtMicros,
        },
        'lease.renewed',
        { goalId, leaseId, expiresAtMicros, resultingRevision: revision },
        now,
      )
    },
  )
}

export interface ReleaseLeaseRequest {
  goalId: unknown
  leaseId: unknown
  expectedRevision: number
  idempotencyKey: unknown
}

/** `releaseLease` (T4): stamps `released_at_micros` under a guarded update. */
export function releaseLease(
  engine: Engine,
  request: ReleaseLeaseRequest,
): EngineResult<LeaseCasDescriptor> {
  const record = requireRequestRecord(
    request,
    ['goalId', 'leaseId', 'expectedRevision', 'idempotencyKey'],
    'releaseLease',
  )
  const goalId = requireIdValue(record.goalId, 'releaseLease.goalId')
  const leaseId = requireIdValue(record.leaseId, 'releaseLease.leaseId')
  const expectedRevision = requireSafeIntValue(record.expectedRevision, 'expectedRevision')

  return runEffectful<LeaseCasDescriptor>(
    engine,
    'releaseLease',
    { expectedRevision, idempotencyKey: record.idempotencyKey },
    goalId,
    ({ now, binding }) => {
      const goal = readGoalChecked(engine.storage, goalId)
      const lease = requireNamedLease(engine.storage, goalId, leaseId, binding, now)
      checkCas(goal, expectedRevision)
      const revision = goal.revision + 1
      guardingStorage(() => {
        const changed = updateLeaseRow(
          engine.storage,
          leaseId,
          { releasedAtMicros: null, casRevision: lease.casRevision },
          { releasedAtMicros: now, casRevision: revision },
        )
        if (changed !== 1) throw engineError('LEASE_NOT_ACTIVE', { reason: 'released' })
        const goalChanged = updateGoalRow(
          engine.storage,
          goalId,
          { revision: goal.revision },
          { revision, updatedAtMicros: now },
        )
        if (goalChanged !== 1) {
          throw engineError('STATE_REVISION_STALE', {
            expectedRevision,
            actualRevision: goal.revision,
          })
        }
      })
      return commitEffectApplied<LeaseCasDescriptor>(
        engine.storage,
        engine.toolVersion,
        binding,
        revision,
        {
          leaseId,
          leaseOwnerPrincipalRef: binding.principalRef,
          casRevision: revision,
          leaseExpiresAtMicros: lease.expiresAtMicros,
        },
        'lease.released',
        { goalId, leaseId, releasedAtMicros: now, resultingRevision: revision },
        now,
      )
    },
  )
}

/**
 * `getLeaseCasDescriptor` (T3 read): the injected boundary descriptor for
 * FK-P12 — the goal's unreleased lease row projected into the F05.4 shape, or
 * null when no active lease exists. Reads take no binding and no CAS.
 */
export function getLeaseCasDescriptor(
  engine: Engine,
  goalIdValue: unknown,
): LeaseCasDescriptor | null {
  const goalId = requireIdValue(goalIdValue, 'goalId')
  // Read-checks the goal first (GOAL_ABSENT / GOAL_STATUS_UNKNOWN defense).
  readGoalChecked(engine.storage, goalId)
  const lease = guardingStorage(() => getUnreleasedLease(engine.storage, goalId))
  return lease === null ? null : descriptorFromLeaseRow(lease)
}

export type { EffectResult, EngineResult, IdempotencyBinding, LeaseCasDescriptor }
