/**
 * The closed goal-status transition machine (FK-P10 T1/T2) exported as data.
 *
 * T1 — closed five-value vocabulary (FK-P10-owned; `goals.status` /
 * `transitions.status` values): `proposed`, `active`, `awaiting-human`,
 * `completed`, `cancelled`. OQ-1 mapping: D9's `awaiting_human` stop-report
 * label maps to the `awaiting-human` goal status — spelling normalized at the
 * record boundary; the domains are distinct.
 *
 * T2 — the exhaustive 25-edge 5×5 product: 7 legal (L1–L7, two of them
 * gate-dependent) and 18 illegal (X01–X18). Edge ids are the fixture identity.
 * The exhaustiveness test and the fixtures bind to this one source.
 *
 * Evidence-kind policy (OQ-3, closed): each gate edge carries a closed
 * allow-set drawn from the FK-P1 `GitGateEvidenceRef.evidenceKind` union; the
 * T2 column is the CEILING. Consumers may NARROW the effective per-edge set at
 * engine construction, never widen it — a wider policy is refused
 * (`ENGINE_ARGUMENT_INVALID`, GTW-11).
 */
import { engineError } from './errors.js'

/** T1 status vocabulary — closed, five values. */
export const GOAL_STATUSES = [
  'proposed',
  'active',
  'awaiting-human',
  'completed',
  'cancelled',
] as const
export type GoalStatus = (typeof GOAL_STATUSES)[number]

/** Terminal statuses (T1). */
export const TERMINAL_STATUSES = ['completed', 'cancelled'] as const

/** FK-P1 `GitGateEvidenceRef.evidenceKind` union (F05.4 verbatim). */
export const EVIDENCE_KINDS = ['commit-ref', 'signature', 'status-check', 'merge-record'] as const
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number]

/** Edge traversal mode (T2). */
export type EdgeMode = 'agent' | 'gate'

/** One row of the T2 edge table. */
export interface Edge {
  edgeId: string
  from: GoalStatus
  to: GoalStatus
  verdict: 'LEGAL' | 'ILLEGAL'
  mode: EdgeMode | null
  /** Closed per-edge allow-set (gate edges only; the T2 ceiling). */
  evidenceAllowSet: readonly EvidenceKind[]
}

const GATE_CEILING: readonly EvidenceKind[] = EVIDENCE_KINDS

function edge(
  edgeId: string,
  from: GoalStatus,
  to: GoalStatus,
  mode: EdgeMode | null,
  evidenceAllowSet: readonly EvidenceKind[] = [],
): Edge {
  return {
    edgeId,
    from,
    to,
    verdict: mode === null ? 'ILLEGAL' : 'LEGAL',
    mode,
    evidenceAllowSet,
  }
}

/**
 * The complete 25-edge product, in fixture order: legal L1–L7 then illegal
 * X01–X18. Every from×to pair appears exactly once.
 */
export const EDGES: readonly Edge[] = [
  edge('L1', 'proposed', 'active', 'agent'),
  edge('L2', 'proposed', 'cancelled', 'agent'),
  edge('L3', 'active', 'awaiting-human', 'agent'),
  edge('L4', 'active', 'completed', 'gate', GATE_CEILING),
  edge('L5', 'active', 'cancelled', 'agent'),
  edge('L6', 'awaiting-human', 'active', 'gate', GATE_CEILING),
  edge('L7', 'awaiting-human', 'cancelled', 'agent'),
  edge('X01', 'proposed', 'proposed', null),
  edge('X02', 'proposed', 'awaiting-human', null),
  edge('X03', 'proposed', 'completed', null),
  edge('X04', 'active', 'active', null),
  edge('X05', 'active', 'proposed', null),
  edge('X06', 'awaiting-human', 'awaiting-human', null),
  edge('X07', 'awaiting-human', 'proposed', null),
  edge('X08', 'awaiting-human', 'completed', null),
  edge('X09', 'completed', 'proposed', null),
  edge('X10', 'completed', 'active', null),
  edge('X11', 'completed', 'awaiting-human', null),
  edge('X12', 'completed', 'completed', null),
  edge('X13', 'completed', 'cancelled', null),
  edge('X14', 'cancelled', 'proposed', null),
  edge('X15', 'cancelled', 'active', null),
  edge('X16', 'cancelled', 'awaiting-human', null),
  edge('X17', 'cancelled', 'completed', null),
  edge('X18', 'cancelled', 'cancelled', null),
]

/** True for a terminal T1 status. */
export function isTerminalStatus(status: string): boolean {
  return (TERMINAL_STATUSES as readonly string[]).includes(status)
}

/** True for a status string inside the closed T1 vocabulary. */
export function isGoalStatus(value: unknown): value is GoalStatus {
  return typeof value === 'string' && (GOAL_STATUSES as readonly string[]).includes(value)
}

/**
 * True for a literal in the reserved gate namespace (`gate.*`, `human.*`).
 * Such literals are never ordinary status values (D9).
 */
export function isReservedGateLiteral(value: unknown): boolean {
  return typeof value === 'string' && (value.startsWith('gate.') || value.startsWith('human.'))
}

/** The T2 row for a from→to pair (the 5×5 product is complete). */
export function findEdge(from: GoalStatus, to: GoalStatus): Edge {
  const found = EDGES.find((candidate) => candidate.from === from && candidate.to === to)
  if (found === undefined) {
    // Unreachable by construction: EDGES carries the complete 5×5 product and
    // the exhaustiveness test fails the inventory if a pair ever goes missing.
    throw engineError('ILLEGAL_TRANSITION', { fromStatus: from, toStatus: to })
  }
  return found
}

/** Effective (possibly narrowed) gate edges at engine construction. */
export interface EvidenceKindNarrowing {
  L4?: readonly EvidenceKind[]
  L6?: readonly EvidenceKind[]
}

/**
 * Validate an optional consumer narrowing against the T2 ceiling (OQ-3):
 * per-edge subsets only; any wider policy — a kind outside the ceiling or an
 * unknown edge key — refuses `ENGINE_ARGUMENT_INVALID` (GTW-11).
 */
export function resolveEvidenceKindPolicy(
  narrowing: EvidenceKindNarrowing | undefined,
): Record<'L4' | 'L6', readonly EvidenceKind[]> {
  const effective: Record<'L4' | 'L6', readonly EvidenceKind[]> = {
    L4: GATE_CEILING,
    L6: GATE_CEILING,
  }
  if (narrowing === undefined) return effective
  if (narrowing === null || typeof narrowing !== 'object' || Array.isArray(narrowing)) {
    throw engineError('ENGINE_ARGUMENT_INVALID', { fieldPath: 'evidenceKindPolicy' })
  }
  for (const key of Object.keys(narrowing)) {
    if (key !== 'L4' && key !== 'L6') {
      throw engineError('ENGINE_ARGUMENT_INVALID', { fieldPath: `evidenceKindPolicy.${key}` })
    }
    const list = (narrowing as Record<string, unknown>)[key]
    if (!Array.isArray(list)) {
      throw engineError('ENGINE_ARGUMENT_INVALID', { fieldPath: `evidenceKindPolicy.${key}` })
    }
    for (const kind of list) {
      if (!(EVIDENCE_KINDS as readonly unknown[]).includes(kind)) {
        // A kind outside the ceiling is a WIDER policy — refused (GTW-11).
        throw engineError('ENGINE_ARGUMENT_INVALID', { fieldPath: `evidenceKindPolicy.${key}` })
      }
    }
    effective[key] = list as readonly EvidenceKind[]
  }
  return effective
}
