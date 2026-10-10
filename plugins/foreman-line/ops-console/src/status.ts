import type { GoalProjection } from './types.js'

/**
 * FCA-2 goal status index: per-goal activity + attention counts, aggregated
 * over the same frozen per-parcel derivation (R1–R5) the projection already
 * performs. Pure and derived — the console stores nothing.
 *
 * `active` answers "is this goal still moving?" for the UI's goal picker:
 * a goal is active while any parcel is not complete, or its queue has items
 * no projection could place, or its charter still awaits Gate-1 ratification.
 * A goal whose queue is fully shipped (every parcel `complete`) drops out —
 * that is the "queue empty / GOAL COMPLETE" end state of a goal's loop.
 */
export interface GoalAttention {
  readonly hung: number
  readonly failed: number
  readonly awaitingGate: number
  readonly ratificationPending: number
  readonly total: number
}

export interface GoalStatus {
  readonly key: string
  readonly tree: string | null
  readonly active: boolean
  readonly attention: GoalAttention
}

/**
 * Goal-level closure phrases (goal-record self-description, same text-parsing
 * precedent as `ratification()`): a goal whose state lines say the goal itself
 * is done is inactive even when its queue is in a dialect the frozen parcel
 * parser does not turn into parcels (non-foreman-line repositories).
 */
const GOAL_CLOSURE_PATTERN = /exit criterion met|goal complete|goal closed|queue empty/i

export function goalStatus(
  key: string,
  tree: string | null,
  projection: GoalProjection,
): GoalStatus {
  let hung = 0
  let failed = 0
  let awaitingGate = 0
  for (const parcel of projection.parcels) {
    if (parcel.state === 'hung') hung += 1
    else if (parcel.state === 'failed') failed += 1
    else if (parcel.state === 'awaiting-gate') awaitingGate += 1
  }
  const ratificationPending = projection.goal.ratification.status === 'pending' ? 1 : 0
  const anyOpen = projection.parcels.some((parcel) => parcel.state !== 'complete')
  const queuedUnplaced = projection.goal.items.length > 0 && projection.parcels.length === 0
  // Narrative activity: a goal with no parsed parcels but live state lines
  // (non-foreman-line queue dialects, or cross-goal coordination records) is
  // active unless its own state declares the goal closed.
  const narrativeActive =
    projection.parcels.length === 0 &&
    projection.goal.items.length === 0 &&
    projection.goal.stateLines.length > 0 &&
    !GOAL_CLOSURE_PATTERN.test(projection.goal.stateLines.join('\n'))
  return {
    key,
    tree,
    active: anyOpen || queuedUnplaced || ratificationPending === 1 || narrativeActive,
    attention: {
      hung,
      failed,
      awaitingGate,
      ratificationPending,
      total: hung + failed + awaitingGate + ratificationPending,
    },
  }
}
