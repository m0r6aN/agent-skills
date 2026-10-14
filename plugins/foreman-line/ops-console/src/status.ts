import type { SignalSeverity } from './signals.js'
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
/** FCA-2 additive: signal-severity breakdown scoped to one goal. */
export interface SignalTally {
  readonly info: number
  readonly attention: number
  readonly urgent: number
}

export interface GoalAttention {
  readonly hung: number
  readonly failed: number
  readonly awaitingGate: number
  /** FCA-P10: parcels that have never progressed (no spec, no chain, no sidecar). */
  readonly notStarted: number
  readonly ratificationPending: number
  readonly ratificationUnknown: number
  /** FCA-2: signal severities for this goal's scoped signals (`<key>/…`). */
  readonly signals: SignalTally
  readonly total: number
}

export interface GoalStatus {
  readonly key: string
  readonly tree: string | null
  readonly active: boolean
  readonly attention: GoalAttention
  /** FCA-2 additive: subjects of urgent signals scoped to this goal. */
  readonly urgentSubjects: readonly string[]
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
  signals: readonly { subject: string; severity: SignalSeverity }[] = [],
): GoalStatus {
  let hung = 0
  let failed = 0
  let awaitingGate = 0
  let notStarted = 0
  for (const parcel of projection.parcels) {
    if (parcel.state === 'hung') hung += 1
    else if (parcel.state === 'failed') failed += 1
    else if (parcel.state === 'awaiting-gate') awaitingGate += 1
    else if (parcel.state === 'not-started') notStarted += 1
  }
  // FCA-2: signal severities join the attention counts — scoped to this goal
  // by subject prefix (`<key>/…`), so other goals' signals never leak in.
  const scoped = signals.filter((signal) => signal.subject.startsWith(`${key}/`))
  const signalTally: SignalTally = {
    info: scoped.filter((signal) => signal.severity === 'info').length,
    attention: scoped.filter((signal) => signal.severity === 'attention').length,
    urgent: scoped.filter((signal) => signal.severity === 'urgent').length,
  }
  const urgentSubjects = scoped
    .filter((signal) => signal.severity === 'urgent')
    .map((signal) => signal.subject)
  const ratificationPending = projection.goal.ratification.status === 'pending' ? 1 : 0
  // ATT: unknown forces the goal active even with an empty/all-complete queue
  // or a closed narrative.
  const ratificationUnknown = projection.goal.ratification.status === 'unknown' ? 1 : 0
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
    active:
      anyOpen ||
      queuedUnplaced ||
      ratificationPending === 1 ||
      ratificationUnknown === 1 ||
      narrativeActive,
    attention: {
      hung,
      failed,
      awaitingGate,
      notStarted,
      ratificationPending,
      ratificationUnknown,
      signals: signalTally,
      total: hung + failed + awaitingGate + ratificationPending + ratificationUnknown,
    },
    urgentSubjects,
  }
}
