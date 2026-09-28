/**
 * Transition semantics (FK-P10 T2/T3/T6/T7) on the closed state machine.
 *
 * Precedence (pinned by the README and the precedence tests): after the shared
 * pipeline steps (structural → idempotency → clock), the operation's
 * preconditions run goal → lease → CAS → transition/gate → write set.
 *
 * The legal edge is validated at request time AND re-validated from the
 * current status at decide time (T7). Human-gate edges (L4/L6) are
 * evidence-derived per D9: satisfaction is never writable state — reserved
 * `gate.*`/`human.*` literals and gate-shaped fields are refused
 * `GATE_STATE_NOT_WRITABLE`; gate edges refuse without at least one well-formed
 * in-set `GitGateEvidenceRef` (`GATE_EVIDENCE_REQUIRED`), and supplied refs are
 * bound into the recorded event so satisfaction is derivable from evidence.
 *
 * AC6 residual (OQ-2, normative): well-formed-but-fabricated refs pass P10's
 * shape gate BY DESIGN; genuineness derives downstream (FK-P12/deferred) and
 * is never claimed here.
 */
import {
  getTransition,
  getUnreleasedLease,
  insertTransition,
  updateGoalRow,
  updateTransitionRow,
} from '@foreman-line/kernel-state'
import { engineError, guardingStorage } from './errors.js'
import {
  type DecidedTransitionResult,
  type EngineResult,
  type GitGateEvidenceRef,
  type GoalStateView,
  type IdempotencyBinding,
  type LeaseCasDescriptor,
  type PendingTransition,
  requireExactMembers,
  requireIdValue,
  requireSafeIntValue,
  requireStatusInput,
  validateGateRefs,
} from './idempotency.js'
import {
  checkCas,
  commitEffectApplied,
  derivedId,
  type Engine,
  readGoalChecked,
  refreshLeaseCas,
  requireStateWriteLease,
  runEffectful,
} from './leases.js'
import { type Edge, findEdge, type GoalStatus, isGoalStatus } from './state-machine.js'

/** F05.8 `stop-report-emission` obligation shape (T2 L3 record). */
export interface StopReportRecord {
  kind: 'stop-report-emission'
  transitionDescription: string
  awaitingHuman: true
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

function requestMembers(
  op: string,
  value: unknown,
  base: readonly string[],
): Record<string, unknown> {
  const members =
    value !== null && typeof value === 'object' && 'gateEvidenceRefs' in value
      ? [...base, 'gateEvidenceRefs']
      : base
  return requireRequestRecord(value, members, op)
}

/**
 * Gate-edge evidence check (T2/OQ-3): the gate edge refuses without at least
 * one well-formed ref, and any ref outside the effective (narrowed) allow-set
 * refuses `GATE_EVIDENCE_REQUIRED` (GTW-05/06/12).
 */
function requireGateEvidence(engine: Engine, edge: Edge, refs: GitGateEvidenceRef[] | null): void {
  const effective = engine.evidenceKindPolicy[edge.edgeId as 'L4' | 'L6']
  if (refs === null || refs.length === 0) {
    throw engineError('GATE_EVIDENCE_REQUIRED', { edgeId: edge.edgeId })
  }
  for (const ref of refs) {
    if (!(effective as readonly string[]).includes(ref.evidenceKind)) {
      throw engineError('GATE_EVIDENCE_REQUIRED', { edgeId: edge.edgeId })
    }
  }
}

function transitionIdFor(goalId: string, operation: string, binding: IdempotencyBinding): string {
  return derivedId('tr-', { goalId, operation, binding })
}

export interface RequestTransitionRequest {
  goalId: unknown
  targetStatus: unknown
  expectedRevision: number
  idempotencyKey: unknown
}

/**
 * `requestTransition` (T3): records a pending transition (at most one per
 * goal); the edge must be legal from the current status. A transition toward
 * `awaiting-human` carries the F05.8 `stop-report-emission` obligation record
 * (T2 L3 "request-human; emits stop-report record").
 */
export function requestTransition(
  engine: Engine,
  request: RequestTransitionRequest,
): EngineResult<PendingTransition> {
  const record = requireRequestRecord(
    request,
    ['goalId', 'targetStatus', 'expectedRevision', 'idempotencyKey'],
    'requestTransition',
  )
  const goalId = requireIdValue(record.goalId, 'requestTransition.goalId')
  const targetStatus = requireStatusInput(record.targetStatus, 'requestTransition.targetStatus')
  const expectedRevision = requireSafeIntValue(record.expectedRevision, 'expectedRevision')

  return runEffectful<PendingTransition>(
    engine,
    'requestTransition',
    { expectedRevision, idempotencyKey: record.idempotencyKey },
    goalId,
    ({ now, binding }) => {
      const goal = readGoalChecked(engine.storage, goalId)
      const lease = requireStateWriteLease(engine.storage, goalId, binding, now)
      // T7's at-most-one-pending rule fires for a SECOND request before the
      // CAS layer (T10 CN-07 names the loser code TRANSITION_PENDING_EXISTS).
      if (goal.pendingTransitionId !== null) {
        throw engineError('TRANSITION_PENDING_EXISTS', {})
      }
      checkCas(goal, expectedRevision)
      const edge = findEdge(goal.status, targetStatus)
      if (edge.verdict !== 'LEGAL') {
        throw engineError('ILLEGAL_TRANSITION', { fromStatus: goal.status, toStatus: targetStatus })
      }
      const revision = goal.revision + 1
      const transitionId = transitionIdFor(goalId, 'requestTransition', binding)
      guardingStorage(() => {
        insertTransition(engine.storage, {
          transitionId,
          goalId,
          status: targetStatus,
          requestedBy: binding.principalRef,
          operationId: binding.operationId,
          payloadDigest: binding.payloadDigest,
          createdAtMicros: now,
          decidedAtMicros: null,
        })
        const changed = updateGoalRow(
          engine.storage,
          goalId,
          { revision: goal.revision },
          { pendingTransitionId: transitionId, revision, updatedAtMicros: now },
        )
        if (changed !== 1) {
          throw engineError('STATE_REVISION_STALE', {
            expectedRevision,
            actualRevision: goal.revision,
          })
        }
      })
      refreshLeaseCas(engine.storage, lease, revision)
      const payloadFields: Record<string, unknown> = {
        goalId,
        transitionId,
        fromStatus: goal.status,
        targetStatus,
        resultingRevision: revision,
      }
      if (targetStatus === 'awaiting-human') {
        // T2 L3: the stop-report record (F05.8 obligation shape verbatim).
        const stopReport: StopReportRecord = {
          kind: 'stop-report-emission',
          transitionDescription: `request-human ${goal.status}->awaiting-human ${transitionId}`,
          awaitingHuman: true,
        }
        payloadFields.stopReport = stopReport
      }
      return commitEffectApplied<PendingTransition>(
        engine.storage,
        engine.toolVersion,
        binding,
        revision,
        { transitionId, targetStatus },
        'transition.requested',
        payloadFields,
        now,
      )
    },
  )
}

export interface DecideTransitionRequest {
  goalId: unknown
  transitionId: unknown
  decision: unknown
  gateEvidenceRefs?: unknown
  expectedRevision: number
  idempotencyKey: unknown
}

/**
 * `decideTransition` (T3): decides the goal's current pending transition. The
 * edge is re-validated from the current status at decide time; gate edges
 * require well-formed in-set refs on `apply` (D9 evidence-derived).
 */
export function decideTransition(
  engine: Engine,
  request: DecideTransitionRequest,
): EngineResult<DecidedTransitionResult> {
  const record = requestMembers('decideTransition', request, [
    'goalId',
    'transitionId',
    'decision',
    'expectedRevision',
    'idempotencyKey',
  ])
  const goalId = requireIdValue(record.goalId, 'decideTransition.goalId')
  const transitionId = requireIdValue(record.transitionId, 'decideTransition.transitionId')
  const decision = record.decision
  if (decision !== 'apply' && decision !== 'reject') {
    throw engineError('ENGINE_ARGUMENT_INVALID', { fieldPath: 'decideTransition.decision' })
  }
  const gateEvidenceRefs = validateGateRefs(
    record.gateEvidenceRefs,
    'decideTransition.gateEvidenceRefs',
  )
  const expectedRevision = requireSafeIntValue(record.expectedRevision, 'expectedRevision')

  return runEffectful<DecidedTransitionResult>(
    engine,
    'decideTransition',
    { expectedRevision, idempotencyKey: record.idempotencyKey },
    goalId,
    ({ now, binding }) => {
      const goal = readGoalChecked(engine.storage, goalId)
      const lease = requireStateWriteLease(engine.storage, goalId, binding, now)
      checkCas(goal, expectedRevision)
      const transition = guardingStorage(() => getTransition(engine.storage, transitionId))
      if (transition === null) throw engineError('TRANSITION_ABSENT', { transitionId })
      if (transition.goalId !== goalId)
        throw engineError('TRANSITION_NOT_PENDING', { transitionId })
      if (transition.decidedAtMicros !== null) {
        throw engineError('TRANSITION_ALREADY_DECIDED', { transitionId })
      }
      if (goal.pendingTransitionId !== transitionId) {
        throw engineError('TRANSITION_NOT_PENDING', { transitionId })
      }
      const targetStatus = transition.status
      if (!isGoalStatus(targetStatus)) {
        throw engineError('TRANSITION_STATUS_UNKNOWN', {})
      }
      const edge = findEdge(goal.status, targetStatus)
      if (edge.verdict !== 'LEGAL') {
        throw engineError('ILLEGAL_TRANSITION', { fromStatus: goal.status, toStatus: targetStatus })
      }
      if (decision === 'apply' && edge.mode === 'gate') {
        requireGateEvidence(engine, edge, gateEvidenceRefs)
      }
      const revision = goal.revision + 1
      const applied = decision === 'apply'
      guardingStorage(() => {
        const changed = updateTransitionRow(
          engine.storage,
          transitionId,
          { decidedAtMicros: null },
          { decidedAtMicros: now },
        )
        if (changed !== 1) {
          throw engineError('TRANSITION_ALREADY_DECIDED', { transitionId })
        }
        const goalChanged = updateGoalRow(
          engine.storage,
          goalId,
          { revision: goal.revision },
          applied
            ? { status: targetStatus, pendingTransitionId: null, revision, updatedAtMicros: now }
            : { pendingTransitionId: null, revision, updatedAtMicros: now },
        )
        if (goalChanged !== 1) {
          throw engineError('STATE_REVISION_STALE', {
            expectedRevision,
            actualRevision: goal.revision,
          })
        }
      })
      refreshLeaseCas(engine.storage, lease, revision)
      const payloadFields: Record<string, unknown> = {
        goalId,
        transitionId,
        fromStatus: goal.status,
        targetStatus,
        resultingRevision: revision,
      }
      if (gateEvidenceRefs !== null && gateEvidenceRefs.length > 0) {
        payloadFields.gateEvidenceRefs = gateEvidenceRefs
      }
      return commitEffectApplied<DecidedTransitionResult>(
        engine.storage,
        engine.toolVersion,
        binding,
        revision,
        {
          goalId,
          transitionId,
          fromStatus: goal.status,
          targetStatus,
          resultingRevision: revision,
        },
        applied ? 'transition.applied' : 'transition.rejected',
        payloadFields,
        now,
      )
    },
  )
}

export interface ApplyTransitionRequest {
  goalId: unknown
  targetStatus: unknown
  gateEvidenceRefs?: unknown
  expectedRevision: number
  idempotencyKey: unknown
}

/**
 * `applyTransition` (T3): atomic request+decide in one transaction — one
 * transition row (decided immediately), one revision bump, one event.
 */
export function applyTransition(
  engine: Engine,
  request: ApplyTransitionRequest,
): EngineResult<DecidedTransitionResult> {
  const record = requestMembers('applyTransition', request, [
    'goalId',
    'targetStatus',
    'expectedRevision',
    'idempotencyKey',
  ])
  const goalId = requireIdValue(record.goalId, 'applyTransition.goalId')
  const targetStatus = requireStatusInput(record.targetStatus, 'applyTransition.targetStatus')
  const gateEvidenceRefs = validateGateRefs(
    record.gateEvidenceRefs,
    'applyTransition.gateEvidenceRefs',
  )
  const expectedRevision = requireSafeIntValue(record.expectedRevision, 'expectedRevision')

  return runEffectful<DecidedTransitionResult>(
    engine,
    'applyTransition',
    { expectedRevision, idempotencyKey: record.idempotencyKey },
    goalId,
    ({ now, binding }) => {
      const goal = readGoalChecked(engine.storage, goalId)
      const lease = requireStateWriteLease(engine.storage, goalId, binding, now)
      // T7's at-most-one-pending rule fires for a SECOND request before the
      // CAS layer (the request half of this atomic operation).
      if (goal.pendingTransitionId !== null) {
        throw engineError('TRANSITION_PENDING_EXISTS', {})
      }
      checkCas(goal, expectedRevision)
      const edge = findEdge(goal.status, targetStatus)
      if (edge.verdict !== 'LEGAL') {
        throw engineError('ILLEGAL_TRANSITION', { fromStatus: goal.status, toStatus: targetStatus })
      }
      if (edge.mode === 'gate') {
        requireGateEvidence(engine, edge, gateEvidenceRefs)
      }
      const revision = goal.revision + 1
      const transitionId = transitionIdFor(goalId, 'applyTransition', binding)
      guardingStorage(() => {
        insertTransition(engine.storage, {
          transitionId,
          goalId,
          status: targetStatus,
          requestedBy: binding.principalRef,
          operationId: binding.operationId,
          payloadDigest: binding.payloadDigest,
          createdAtMicros: now,
          decidedAtMicros: now,
        })
        const changed = updateGoalRow(
          engine.storage,
          goalId,
          { revision: goal.revision },
          { status: targetStatus, pendingTransitionId: null, revision, updatedAtMicros: now },
        )
        if (changed !== 1) {
          throw engineError('STATE_REVISION_STALE', {
            expectedRevision,
            actualRevision: goal.revision,
          })
        }
      })
      refreshLeaseCas(engine.storage, lease, revision)
      const payloadFields: Record<string, unknown> = {
        goalId,
        transitionId,
        fromStatus: goal.status,
        targetStatus,
        resultingRevision: revision,
      }
      if (gateEvidenceRefs !== null && gateEvidenceRefs.length > 0) {
        payloadFields.gateEvidenceRefs = gateEvidenceRefs
      }
      return commitEffectApplied<DecidedTransitionResult>(
        engine.storage,
        engine.toolVersion,
        binding,
        revision,
        {
          goalId,
          transitionId,
          fromStatus: goal.status,
          targetStatus,
          resultingRevision: revision,
        },
        'transition.applied',
        payloadFields,
        now,
      )
    },
  )
}

/** `getGoalState` (T3 read): the goal view; reads take no binding and no CAS. */
export function getGoalState(engine: Engine, goalIdValue: unknown): GoalStateView {
  const goalId = requireIdValue(goalIdValue, 'goalId')
  const goal = readGoalChecked(engine.storage, goalId)
  const lease = guardingStorage(() => getUnreleasedLease(engine.storage, goalId))
  const descriptor: LeaseCasDescriptor | null =
    lease === null
      ? null
      : {
          leaseId: lease.leaseId,
          leaseOwnerPrincipalRef: lease.ownerPrincipalRef,
          casRevision: lease.casRevision,
          leaseExpiresAtMicros: lease.expiresAtMicros,
        }
  return {
    goalId,
    status: goal.status as GoalStatus,
    revision: goal.revision,
    pendingTransitionId: goal.pendingTransitionId,
    lease: descriptor,
  }
}
