import type { ChainWalk } from './chain.js'
import { isRecord } from './guards.js'
import type { SidecarFact, SpecFact } from './scan.js'
import type {
  GateProxy,
  HeartbeatView,
  LivenessSignal,
  ParcelProjection,
  ParcelStateValue,
  RoutingView,
} from './types.js'

/**
 * FOC-P0 C4 derivation — the frozen D3 rules R1–R5, first match wins.
 * State is derived from disk truth on every call and never stored (charter
 * D3/D4): no status field is read or written anywhere in this package.
 *
 * Confusion cases (frozen): idle-but-gated (tip B or E, or projected-artifact
 * awaiting G1, with old timestamps and no worktree) is `awaiting-gate` — a slow
 * human decision is not abandonment; idle-and-abandoned (tip C or D, old
 * timestamps, no worktree, no pending gate) is `hung`.
 */
export interface ThresholdView {
  readonly thresholdMs: number
  readonly source: 'goal-override' | 'default'
}

export interface DeriveInput {
  readonly goal: string
  readonly parcel: string
  /** Full queue-item text (tripwire + closed markers come from here). */
  readonly itemText: string
  readonly spec: SpecFact | null
  readonly walk: ChainWalk | null
  readonly sidecars: readonly SidecarFact[]
  readonly gates: { readonly G1: GateProxy; readonly G2: GateProxy; readonly G3: GateProxy }
  readonly routing: RoutingView
  readonly liveness: LivenessSignal
  readonly threshold: ThresholdView
  readonly now: number
  readonly flags: readonly string[]
}

const TRIPWIRE_PATTERN = /tripwire/i
const FIRED_PATTERN = /fired/i
const CLOSED_MARKER_PATTERN = /☑|SHIPPED|CLOSED|COMPLETE/
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function progressTimestamp(walk: ChainWalk | null, spec: SpecFact | null): number | null {
  if (walk !== null) {
    let newest: number | null = null
    for (const member of walk.members) {
      const ms = Date.parse(member.timestamp)
      if (Number.isNaN(ms)) continue
      if (newest === null || ms > newest) newest = ms
    }
    if (newest !== null) return newest
  }
  if (spec !== null) {
    if (spec.updated !== null) {
      const iso = DATE_ONLY_PATTERN.test(spec.updated) ? `${spec.updated}T00:00:00Z` : spec.updated
      const ms = Date.parse(iso)
      if (!Number.isNaN(ms)) return ms
    }
    return spec.mtimeMs
  }
  return null
}

function subjectStringField(doc: { subject: unknown }, field: string): string | null {
  const subject = doc.subject
  if (!isRecord(subject)) return null
  const value = subject[field]
  return typeof value === 'string' && value.length > 0 ? value : null
}

export function deriveParcel(input: DeriveInput): ParcelProjection {
  const { walk, spec, sidecars, liveness, now } = input
  const sealed = walk?.sealed ?? false
  const specDone = spec?.location === 'done'
  const tipStage = walk?.tipStage ?? null
  const decisionSidecar = sidecars.find(
    (sidecar) =>
      (sidecar.kind === 'approval' || sidecar.kind === 'rejection') && sidecar.decision !== null,
  )
  const projectedJoin = sidecars.some((sidecar) => sidecar.kind === 'projected')
  const gateDecisionJoin = decisionSidecar !== undefined
  const aReceiptBackedApproval =
    walk?.docs.some(
      (doc) => doc.stage === 'A' && subjectStringField(doc, 'approvedHash') !== null,
    ) ?? false

  const lastProgressAt = progressTimestamp(walk, spec)
  const heartbeat: HeartbeatView = {
    thresholdMs: input.threshold.thresholdMs,
    source: input.threshold.source,
    lastProgressAt: lastProgressAt === null ? null : new Date(lastProgressAt).toISOString(),
  }
  const flags = new Set<string>(input.flags)
  let failure: ParcelProjection['failure'] = null
  let state: ParcelStateValue = 'running'
  let rule = 'R5'

  // R1 failed — any failure evidence (first listed sub-case names the code).
  if (walk !== null && !walk.valid) {
    failure = { code: 'chain-invalid', detail: walk.errors.join('; ') }
    state = 'failed'
    rule = 'R1'
  } else if (
    walk?.docs.some(
      (doc) => doc.stage === 'D' && subjectStringField(doc, 'verdict') === 'rework',
    ) === true
  ) {
    failure = {
      code: 'red-review',
      detail: 'a Stage-D VerificationVerdict in the mapped chain has verdict: rework',
    }
    state = 'failed'
    rule = 'R1'
  } else if (TRIPWIRE_PATTERN.test(input.itemText) && FIRED_PATTERN.test(input.itemText)) {
    failure = { code: 'tripwire', detail: 'the goal queue item records a fired tripwire' }
    state = 'failed'
    rule = 'R1'
  } else if (sealed && !specDone) {
    failure = {
      code: 'closure-drift',
      detail: 'the mapped chain is sealed but the spec is not in docs/specs/done/',
    }
    state = 'failed'
    rule = 'R1'
  } else if (specDone && sealed) {
    // R2 complete — spec in done/ AND sealed chain.
    state = 'complete'
    rule = 'R2'
  } else if (walk === null && specDone && CLOSED_MARKER_PATTERN.test(input.itemText)) {
    // R2 complete — chain absent, spec done, goal record marks the item closed
    // (carried via the projection's `chainEvidence: 'absent'` marker).
    state = 'complete'
    rule = 'R2'
  } else if (walk === null && projectedJoin && !gateDecisionJoin) {
    // R3 awaiting-gate — G1 pending on a projected shaping artifact.
    state = 'awaiting-gate'
    rule = 'R3'
  } else if (tipStage === 'A' && !gateDecisionJoin && !aReceiptBackedApproval) {
    // R3 awaiting-gate — G1 pending at an unapproved A tip.
    state = 'awaiting-gate'
    rule = 'R3'
  } else if (tipStage === 'B') {
    // R3 awaiting-gate — G2 pending (dispatch).
    state = 'awaiting-gate'
    rule = 'R3'
  } else if (tipStage === 'E') {
    // R3 awaiting-gate — G3 pending (merge).
    state = 'awaiting-gate'
    rule = 'R3'
  } else {
    // R4 hung — no rule above matched and progress is stale with no liveness.
    const age = lastProgressAt === null ? Number.POSITIVE_INFINITY : now - lastProgressAt
    if (age > input.threshold.thresholdMs && !liveness.live) {
      state = 'hung'
      rule = 'R4'
    }
  }

  // Proxy drift: a gate-boundary proxy disagrees with the chain position (R3
  // fired while a decision sidecar claims the gate). State follows the chain.
  if (rule === 'R3' && gateDecisionJoin) flags.add('proxy-drift')

  return {
    goal: input.goal,
    parcel: input.parcel,
    specRef: spec?.ref ?? null,
    specLocation: spec?.location ?? 'none',
    chain: walk,
    chainEvidence: walk === null ? 'absent' : 'present',
    gates: input.gates,
    routing: input.routing,
    liveness,
    heartbeat,
    failure,
    state,
    rule,
    flags: [...flags].sort(),
  }
}
