/**
 * FOC-P0 projection contract types (frozen shapes from
 * `docs/specs/active/FOC-P0-projection-contract-and-discovery-inventory.md` §C4).
 *
 * `chainEvidence` is carried non-optionally because rule R2 mandates the
 * marker (`chainEvidence: 'absent'`) for the complete-with-absent-chain case
 * and the contract's reviewer question 3 makes it non-optional.
 */
export type ParcelStateValue = 'running' | 'hung' | 'awaiting-gate' | 'failed' | 'complete'

export type FailureCode = 'chain-invalid' | 'red-review' | 'tripwire' | 'closure-drift'

export type GateId = 'G1' | 'G2' | 'G3'

export type GateStatus = 'evidenced' | 'pending' | 'unknown'

export interface ChainMemberSummary {
  readonly sequence: number
  readonly stage: string
  readonly subjectKind: string
  readonly timestamp: string
  readonly hash: string
  /** Repo-relative POSIX locator (the `receiptPath` convention). */
  readonly locator: string
}

export interface ChainSummary {
  readonly workflowId: string
  /** Repo-relative POSIX directory `docs/receipts/<workflowId>`. */
  readonly locator: string
  readonly members: readonly ChainMemberSummary[]
  /** Sidecar files in the workflow directory (never chain members). */
  readonly sidecars: readonly string[]
  readonly valid: boolean
  readonly errors: readonly string[]
  readonly sealed: boolean
  readonly tipStage: string | null
}

export interface GateProxy {
  readonly gate: GateId
  readonly status: GateStatus
  /** Repo-relative POSIX locator of the proxy artifact, when one exists. */
  readonly evidence: string | null
  readonly detail: string
}

export interface LivenessSignal {
  readonly live: boolean
  readonly worktree: string | null
  readonly branch: string | null
  readonly newestMtime: string | null
  readonly reason: string
}

export interface RoutingView {
  readonly routingClass: string | null
  readonly resolvedModelId: string | null
  readonly resolvedTier: string | null
}

export interface HeartbeatView {
  readonly thresholdMs: number
  readonly source: 'goal-override' | 'default'
  readonly lastProgressAt: string | null
}

export interface ParcelProjection {
  readonly goal: string
  readonly parcel: string
  readonly specRef: string | null
  readonly specLocation: 'active' | 'done' | 'none'
  readonly chain: ChainSummary | null
  readonly chainEvidence: 'present' | 'absent'
  readonly gates: { readonly G1: GateProxy; readonly G2: GateProxy; readonly G3: GateProxy }
  readonly routing: RoutingView
  readonly liveness: LivenessSignal
  readonly heartbeat: HeartbeatView
  readonly failure: { readonly code: FailureCode; readonly detail: string } | null
  readonly state: ParcelStateValue
  /** First-matching derivation rule id (`R1`–`R5`). */
  readonly rule: string
  readonly flags: readonly string[]
}

export interface QueueItem {
  readonly key: string
  /** Full queue-item text including its `N. **KEY**` lead. */
  readonly text: string
}

export interface GoalRatification {
  readonly status: 'granted' | 'pending' | 'unknown'
  readonly detail: string
}

export interface GoalRecord {
  readonly slug: string
  readonly charterRef: string
  readonly loopDirectiveRef: string
  readonly items: readonly QueueItem[]
  readonly hungThreshold: {
    readonly thresholdMs: number
    readonly source: 'goal-override' | 'default'
    readonly hours: number | null
  }
  /** `**…state…**` lines of the loop directive (log-viewer input). */
  readonly stateLines: readonly string[]
  readonly ratification: GoalRatification
}

export interface GoalProjection {
  readonly goal: GoalRecord
  readonly parcels: readonly ParcelProjection[]
  /** Chains that join no parcel key; still walked and surfaced (C1). */
  readonly unmappedChains: readonly ChainSummary[]
}
