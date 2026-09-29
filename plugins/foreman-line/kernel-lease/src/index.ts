/**
 * `@foreman-line/kernel-lease` — FK-P10 lease and transition engine on the
 * merged FK-P9 substrate (`@foreman-line/kernel-state`, the sole cross-package
 * import).
 *
 * Exports (T3): `createEngine` plus the six effectful operations
 * (`claimLease`, `renewLease`, `releaseLease`, `requestTransition`,
 * `decideTransition`, `applyTransition`), the two reads (`getLeaseCasDescriptor`,
 * `getGoalState`), and the INF-6 measurement entry (`measureContention` is run
 * through `npm run measure-contention`). Refusals throw typed `EngineError`
 * (closed 22-code registry, T9).
 *
 * Scope honesty (D13): this engine decides lease/revision/idempotency/
 * transition semantics only — no enforcement, no promotion, no gate
 * verification, no FK-P15 recovery claim, no INF baseline. Human-gate
 * satisfaction is evidence-derived (D9) and well-formed-but-fabricated
 * evidence refs pass the shape gate BY DESIGN (AC6 residual; genuineness is
 * downstream, FK-P12/deferred).
 */

export {
  CanonicalEncodeError,
  canonicalBytes,
  canonicalEncode,
  type Digest,
  digestBytes,
  digestDocument,
  digestText,
  eventPayloadDigest,
  isDigestLiteral,
  KERNEL_LEASE_DIGEST_DOMAINS,
  operationInputDigest,
} from './canonical.js'
export { elapsedMicros, monotonicStartMicros, TrustedClock } from './clock.js'
export {
  ENGINE_ERROR_CODE_COUNT,
  ENGINE_ERROR_CODES,
  ENGINE_ERROR_DISPOSITIONS,
  ENGINE_ERROR_REGISTRY,
  EngineError,
  type EngineErrorCode,
  engineError,
} from './errors.js'
export {
  type DecidedTransitionResult,
  type EffectResult,
  type EngineResult,
  type GitGateEvidenceRef,
  type GoalStateView,
  type IdempotencyBinding,
  type LeaseCasDescriptor,
  OPERATION_NAMES,
  type OperationName,
  type PendingTransition,
} from './idempotency.js'
export {
  type ClaimLeaseRequest,
  type CreateEngineOptions,
  claimLease,
  createEngine,
  type Engine,
  GOAL_STATE_PROJECTION_ID,
  getLeaseCasDescriptor,
  LEASE_DURATION_MIN_MICROS,
  LEASE_MAX_DURATION_MICROS,
  type ReleaseLeaseRequest,
  type RenewLeaseRequest,
  releaseLease,
  renewLease,
} from './leases.js'
export {
  EDGES,
  type Edge,
  type EdgeMode,
  EVIDENCE_KINDS,
  type EvidenceKind,
  type EvidenceKindNarrowing,
  GOAL_STATUSES,
  type GoalStatus,
  isGoalStatus,
  isReservedGateLiteral,
  isTerminalStatus,
  TERMINAL_STATUSES,
} from './state-machine.js'
export {
  type ApplyTransitionRequest,
  applyTransition,
  type DecideTransitionRequest,
  decideTransition,
  getGoalState,
  type RequestTransitionRequest,
  requestTransition,
  type StopReportRecord,
} from './transitions.js'
