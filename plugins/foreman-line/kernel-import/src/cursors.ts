/**
 * T7 — registered projection cursors (never a silent grab).
 *
 * The runtime registry is the closed A1e CHECK set: `goal-state` (FK-P10's
 * RESERVED engine state-application cursor — FK-P11 reads it, never writes it)
 * plus FK-P11's two registered views. Registration arrived via the recorded
 * FK-P9 amendment A1e before builder code (never an in-parcel constant grab).
 * `setProjectionCursor` with any other id refuses
 * `CURSOR_ID_UNREGISTERED(unregistered)`; a write attempt on `goal-state`
 * refuses `CURSOR_ID_UNREGISTERED(reserved)`.
 */
import {
  getProjectionCursor as substrateGetCursor,
  setProjectionCursor as substrateSetCursor,
  type ProjectionCursorRow,
  type Storage,
} from '@foreman-line/kernel-state'
import { importError, rethrowSubstrate } from './errors.js'

/** The closed registered set (mirrors the A1e `ck_projection_registered` CHECK). */
export const REGISTERED_PROJECTION_IDS = ['goal-state', 'md-goals-index', 'md-goal-ledger'] as const
export type RegisteredProjectionId = (typeof REGISTERED_PROJECTION_IDS)[number]

/** FK-P11's own views (the only ids FK-P11 may write or render). */
export const FK_P11_PROJECTION_IDS = ['md-goals-index', 'md-goal-ledger'] as const
export type FkP11ProjectionId = (typeof FK_P11_PROJECTION_IDS)[number]

/** FK-P10's reserved cursor id (read-only for FK-P11). */
export const RESERVED_PROJECTION_ID = 'goal-state'

const CURSOR_ID_RE = /^[A-Za-z0-9._-]{1,128}$/

/**
 * Resolve a cursor id against the registry: malformed ids refuse
 * `IMPORT_ARGUMENT_INVALID` (CUR-03); unregistered ids refuse
 * `CURSOR_ID_UNREGISTERED(unregistered)` (CUR-01/04); `goal-state` resolves
 * here and is refused at write/render time with `(reserved)` (CUR-02).
 */
export function resolveRegisteredProjectionId(projectionId: unknown): RegisteredProjectionId {
  if (typeof projectionId !== 'string' || !CURSOR_ID_RE.test(projectionId)) {
    throw importError('IMPORT_ARGUMENT_INVALID', { fieldPath: 'projectionId' })
  }
  if ((REGISTERED_PROJECTION_IDS as readonly string[]).includes(projectionId)) {
    return projectionId as RegisteredProjectionId
  }
  throw importError('CURSOR_ID_UNREGISTERED', { projectionId, reason: 'unregistered' })
}

/** Resolve an id FK-P11 may render/write: the two registered views only. */
export function resolveWritableProjectionId(projectionId: unknown): FkP11ProjectionId {
  const resolved = resolveRegisteredProjectionId(projectionId)
  if (resolved === RESERVED_PROJECTION_ID) {
    throw importError('CURSOR_ID_UNREGISTERED', { projectionId: resolved, reason: 'reserved' })
  }
  return resolved as FkP11ProjectionId
}

/** T9 read: the registered cursor row (any registered id; `goal-state` readable). */
export function getProjectionCursor(
  storage: Storage,
  projectionId: unknown,
): { projectionId: RegisteredProjectionId; lastAppliedEventSeq: number } {
  const resolved = resolveRegisteredProjectionId(projectionId)
  try {
    const row: ProjectionCursorRow | null = substrateGetCursor(storage, resolved)
    return {
      projectionId: resolved,
      lastAppliedEventSeq: row === null ? 0 : row.lastAppliedEventSeq,
    }
  } catch (value) {
    rethrowSubstrate(value)
  }
}

/**
 * The one write path (import creates both cursors at 0; publishProjection
 * advances them). Refuses `goal-state` (reserved) and every unregistered id.
 */
export function setProjectionCursor(
  storage: Storage,
  input: { projectionId: unknown; lastAppliedEventSeq: number },
): FkP11ProjectionId {
  const resolved = resolveWritableProjectionId(input.projectionId)
  try {
    substrateSetCursor(storage, {
      projectionId: resolved,
      goalId: null,
      lastAppliedEventSeq: input.lastAppliedEventSeq,
    })
    return resolved
  } catch (value) {
    rethrowSubstrate(value)
  }
}
