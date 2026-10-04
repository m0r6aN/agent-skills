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
  claimLease,
  type ClaimLeaseRequest,
  createEngine,
  type CreateEngineOptions,
  type Engine,
  getLeaseCasDescriptor,
  LEASE_DURATION_MIN_MICROS,
  LEASE_MAX_DURATION_MICROS,
  GOAL_STATE_PROJECTION_ID,
  releaseLease,
  type ReleaseLeaseRequest,
  renewLease,
  type RenewLeaseRequest,
} from './leases.js'
export {
  applyTransition,
  type ApplyTransitionRequest,
  decideTransition,
  type DecideTransitionRequest,
  getGoalState,
  requestTransition,
  type RequestTransitionRequest,
  type StopReportRecord,
} from './transitions.js'
export {
  type DecidedTransitionResult,
  type EffectResult,
  type EngineResult,
  type GitGateEvidenceRef,
  type GoalStateView,
  type IdempotencyBinding,
  type LeaseCasDescriptor,
  type OperationName,
  OPERATION_NAMES,
  type PendingTransition,
} from './idempotency.js'
export {
  type Edge,
  type EdgeMode,
  EDGES,
  EVIDENCE_KINDS,
  type EvidenceKind,
  type EvidenceKindNarrowing,
  type GoalStatus,
  GOAL_STATUSES,
  isGoalStatus,
  isReservedGateLiteral,
  isTerminalStatus,
  TERMINAL_STATUSES,
} from './state-machine.js'
export {
  EngineError,
  ENGINE_ERROR_CODES,
  ENGINE_ERROR_CODE_COUNT,
  ENGINE_ERROR_DISPOSITIONS,
  ENGINE_ERROR_REGISTRY,
  type EngineErrorCode,
  engineError,
} from './errors.js'
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
