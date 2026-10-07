/**
 * `@foreman-line/ops-console` — the single projection authority (charter D4)
 * and the localhost-only Foreman Ops Console surfaces (FOC-P1–FOC-P4).
 *
 * Non-goals of the projection (frozen contract): no writes, no authority (it
 * never decides or records a gate), no stored status (every state is
 * re-derived from disk on each projection call).
 */
export { type Alert, type AlertKind, deriveAlerts } from './alerts.js'
export { type ApiRequest, type ApiResult, handleApi } from './api.js'
export { CHAIN_MEMBER_PATTERN, type ChainWalk, listWorkflowIds, walkChain } from './chain.js'
export {
  assertAbsoluteRoot,
  type ConsoleConfig,
  ConsoleRootUnresolvedError,
  defaultConfig,
  PLUGIN_TREE_REF,
  packageRoot,
  STATE_FILES,
  type StateFile,
  stateFilePath,
} from './config.js'
export { type DeriveInput, deriveParcel, type ThresholdView } from './derive.js'
export { type GateInputs, gateProxies } from './gates.js'
export { isRecord, parseSidecarDoc, type SidecarDoc } from './guards.js'
export {
  type AuditEntry,
  FLOW_REGISTRY,
  type FlowRequest,
  type InvokeAction,
  type InvokeOutcome,
  invokeFlow,
  listAuditEntries,
} from './invoke.js'
export { worktreeLiveness } from './liveness.js'
export {
  deleteNotification,
  listNotifications,
  type Notification,
  syncAlerts,
} from './notifications.js'
export { projectGoal } from './project.js'
export {
  loadRoutingPolicy,
  type PolicyClass,
  type PolicyRole,
  parseRoutingPolicy,
  type RoutingPolicyView,
} from './routing.js'
export {
  DEFAULT_HUNG_THRESHOLD_MS,
  listGoalSlugs,
  type SidecarFact,
  type SidecarKind,
  type SpecFact,
  scanGoal,
  scanSidecars,
  scanSpecs,
} from './scan.js'
export { type BindTarget, createConsoleServer, resolveBind, resolveRepoRoot } from './server.js'
export type {
  ChainMemberSummary,
  ChainSummary,
  FailureCode,
  GateId,
  GateProxy,
  GateStatus,
  GoalProjection,
  GoalRatification,
  GoalRecord,
  HeartbeatView,
  LivenessSignal,
  ParcelProjection,
  ParcelStateValue,
  QueueItem,
  RoutingView,
} from './types.js'
