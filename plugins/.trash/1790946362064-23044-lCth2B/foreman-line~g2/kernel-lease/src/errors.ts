/**
 * Closed engine error registry (FK-P10 T9; 22 codes, closed).
 *
 * Every refusal crossing the engine boundary carries exactly one code from
 * this registry plus a bounded safe diagnostic in the code's declared shape
 * (FK-P1 F05.10 discipline): ids only, reason literals only, revision numbers
 * only, field paths only, edge ids only, binding ids only, or the FK-P9
 * `StorageErrorCode` literal only. No driver message text, host path, row
 * content, credential, or unbounded value can reach a caller.
 *
 * The registry is closed BY DERIVATION (FK-P9 pattern): `EngineErrorCode` is
 * the key union of `ENGINE_ERROR_REGISTRY`, so the type and the runtime table
 * cannot drift, and the code count is derived — never hand-typed.
 *
 * The `disposition` member is annotation-only (FK-P17 T4 mapping-never-
 * redefines): it records how a consuming surface is expected to map the code;
 * it never redefines any FK-P1 union or literal. F05.12 codes are used
 * verbatim where F05.12 names them (IDEMPOTENCY_CONFLICT,
 * STATE_REVISION_STALE).
 */
import { type StorageError, StorageError as StorageErrorClass } from '@foreman-line/kernel-state'

/** Closed reason literals for `LEASE_NOT_ACTIVE`. */
export const LEASE_NOT_ACTIVE_REASONS = ['absent', 'released'] as const
export type LeaseNotActiveReason = (typeof LEASE_NOT_ACTIVE_REASONS)[number]

export interface EngineErrorDiagnostics {
  LEASE_HELD: { leaseId: string }
  LEASE_EXPIRED: { leaseId: string }
  LEASE_NOT_OWNER: { leaseId: string; goalId: string }
  LEASE_NOT_ACTIVE: { reason: LeaseNotActiveReason }
  GOAL_ABSENT: { goalId: string }
  GOAL_TERMINAL: { goalId: string }
  GOAL_STATUS_UNKNOWN: Record<string, never>
  TRANSITION_ABSENT: { transitionId: string }
  TRANSITION_ALREADY_DECIDED: { transitionId: string }
  TRANSITION_PENDING_EXISTS: Record<string, never>
  TRANSITION_NOT_PENDING: { transitionId: string }
  TRANSITION_STATUS_UNKNOWN: Record<string, never>
  ILLEGAL_TRANSITION: { fromStatus: string; toStatus: string }
  GATE_EVIDENCE_REQUIRED: { edgeId: string }
  GATE_STATE_NOT_WRITABLE: { fieldPath: string }
  IDEMPOTENCY_CONFLICT: { principalRef: string; operationId: string }
  IDEMPOTENCY_IN_FLIGHT: { principalRef: string; operationId: string }
  STATE_REVISION_STALE: { expectedRevision: number; actualRevision: number }
  CLOCK_REGRESSION: Record<string, never>
  CLOCK_UNTRUSTED: Record<string, never>
  ENGINE_ARGUMENT_INVALID: { fieldPath: string }
  STORAGE_FAILURE: { storageCode: string }
}

/**
 * The closed registry table (T9). Each entry records the code's invariant and
 * the exact diagnostic members its bounded shape allows (default-deny at
 * construction: a wrong shape is a programming error and fails hard).
 */
export const ENGINE_ERROR_REGISTRY = {
  LEASE_HELD: {
    invariant: 'claim only against another holder\u2019s unexpired lease',
    diagnosticMembers: ['leaseId'],
  },
  LEASE_EXPIRED: {
    invariant: 'renew/release/state write only under an unexpired lease',
    diagnosticMembers: ['leaseId'],
  },
  LEASE_NOT_OWNER: {
    invariant: 'lease-bound operations run only for the owning principal',
    diagnosticMembers: ['leaseId', 'goalId'],
  },
  LEASE_NOT_ACTIVE: {
    invariant: 'lease-bound operations run only with an active lease',
    diagnosticMembers: ['reason'],
  },
  GOAL_ABSENT: { invariant: 'goal ids name existing goals', diagnosticMembers: ['goalId'] },
  GOAL_TERMINAL: { invariant: 'claims only on non-terminal goals', diagnosticMembers: ['goalId'] },
  GOAL_STATUS_UNKNOWN: {
    invariant: 'stored goal status lies in the closed T1 vocabulary',
    diagnosticMembers: [],
  },
  TRANSITION_ABSENT: {
    invariant: 'transition ids name existing transitions',
    diagnosticMembers: ['transitionId'],
  },
  TRANSITION_ALREADY_DECIDED: {
    invariant: 'a transition is decided at most once (non-replay)',
    diagnosticMembers: ['transitionId'],
  },
  TRANSITION_PENDING_EXISTS: {
    invariant: 'at most one pending transition per goal',
    diagnosticMembers: [],
  },
  TRANSITION_NOT_PENDING: {
    invariant: 'a decide names the goal\u2019s current pending transition',
    diagnosticMembers: ['transitionId'],
  },
  TRANSITION_STATUS_UNKNOWN: {
    invariant: 'target statuses lie in the closed T1 vocabulary',
    diagnosticMembers: [],
  },
  ILLEGAL_TRANSITION: {
    invariant: 'every traversal lies on a T2 legal edge',
    diagnosticMembers: ['fromStatus', 'toStatus'],
  },
  GATE_EVIDENCE_REQUIRED: {
    invariant: 'gate edges carry well-formed in-set GitGateEvidenceRefs',
    diagnosticMembers: ['edgeId'],
  },
  GATE_STATE_NOT_WRITABLE: {
    invariant: 'human-gate satisfaction is never writable operational state',
    diagnosticMembers: ['fieldPath'],
  },
  IDEMPOTENCY_CONFLICT: {
    invariant: 'one payload digest per binding key (P1-S09)',
    diagnosticMembers: ['principalRef', 'operationId'],
  },
  IDEMPOTENCY_IN_FLIGHT: {
    invariant: 'an incomplete binding is never re-executed',
    diagnosticMembers: ['principalRef', 'operationId'],
  },
  STATE_REVISION_STALE: {
    invariant: 'every effectful operation is CAS-guarded on goals.revision',
    diagnosticMembers: ['expectedRevision', 'actualRevision'],
  },
  CLOCK_REGRESSION: {
    invariant: 'trusted-clock readings are non-decreasing per engine instance',
    diagnosticMembers: [],
  },
  CLOCK_UNTRUSTED: {
    invariant: 'trusted-clock readings are nonnegative safe integers',
    diagnosticMembers: [],
  },
  ENGINE_ARGUMENT_INVALID: {
    invariant: 'API inputs structurally valid (closed member sets)',
    diagnosticMembers: ['fieldPath'],
  },
  STORAGE_FAILURE: {
    invariant: 'FK-P9 StorageError wrapped at a substrate seam (code literal only)',
    diagnosticMembers: ['storageCode'],
  },
} as const satisfies Record<string, { invariant: string; diagnosticMembers: readonly string[] }>

/** The closed code union — derived from the registry table keys. */
export type EngineErrorCode = keyof typeof ENGINE_ERROR_REGISTRY

/** Every registry code, derived from the table (declaration order). */
export const ENGINE_ERROR_CODES: readonly EngineErrorCode[] = Object.keys(
  ENGINE_ERROR_REGISTRY,
) as EngineErrorCode[]

/** Registry code count — derived, never hand-typed. */
export const ENGINE_ERROR_CODE_COUNT: number = ENGINE_ERROR_CODES.length

/**
 * Consuming-surface mapping annotation (FK-P17 T4 pattern). Annotation only —
 * the mapping never redefines FK-P1 unions or literals.
 */
export const ENGINE_ERROR_DISPOSITIONS: Record<
  EngineErrorCode,
  'CONFLICT' | 'REFUSE' | 'KERNEL_FAILURE' | 'PROTOCOL_ERROR'
> = {
  LEASE_HELD: 'CONFLICT',
  LEASE_EXPIRED: 'CONFLICT',
  LEASE_NOT_OWNER: 'REFUSE',
  LEASE_NOT_ACTIVE: 'REFUSE',
  GOAL_ABSENT: 'REFUSE',
  GOAL_TERMINAL: 'REFUSE',
  GOAL_STATUS_UNKNOWN: 'KERNEL_FAILURE',
  TRANSITION_ABSENT: 'REFUSE',
  TRANSITION_ALREADY_DECIDED: 'CONFLICT',
  TRANSITION_PENDING_EXISTS: 'CONFLICT',
  TRANSITION_NOT_PENDING: 'CONFLICT',
  TRANSITION_STATUS_UNKNOWN: 'REFUSE',
  ILLEGAL_TRANSITION: 'REFUSE',
  GATE_EVIDENCE_REQUIRED: 'REFUSE',
  GATE_STATE_NOT_WRITABLE: 'REFUSE',
  IDEMPOTENCY_CONFLICT: 'CONFLICT',
  IDEMPOTENCY_IN_FLIGHT: 'CONFLICT',
  STATE_REVISION_STALE: 'CONFLICT',
  CLOCK_REGRESSION: 'KERNEL_FAILURE',
  CLOCK_UNTRUSTED: 'KERNEL_FAILURE',
  ENGINE_ARGUMENT_INVALID: 'PROTOCOL_ERROR',
  STORAGE_FAILURE: 'KERNEL_FAILURE',
}

/** Typed error carrying exactly one registry code and a bounded safe diagnostic. */
export class EngineError extends Error {
  readonly code: EngineErrorCode
  readonly diagnostic: Readonly<Record<string, string | number>>

  constructor(code: EngineErrorCode, diagnostic: Record<string, string | number> = {}) {
    const allowed: readonly string[] = ENGINE_ERROR_REGISTRY[code].diagnosticMembers
  const keys = Object.keys(diagnostic)
  if (keys.length !== allowed.length || keys.some((key) => !allowed.includes(key))) {
    throw new Error(`diagnostic shape mismatch for ${code}`)
  }
    for (const member of allowed) {
      if (!(member in diagnostic)) throw new Error(`diagnostic member '${member}' missing`)
    }
    if (code === 'LEASE_NOT_ACTIVE') {
      const reason = diagnostic.reason
      if (typeof reason !== 'string' || !(LEASE_NOT_ACTIVE_REASONS as readonly string[]).includes(reason)) {
        throw new Error(`'${String(reason)}' is not a closed lease-not-active reason`)
      }
    }
    super(`${code}${keys.length > 0 ? ` ${JSON.stringify(diagnostic)}` : ''}`)
    this.name = 'EngineError'
    this.code = code
    this.diagnostic = Object.freeze({ ...diagnostic })
  }
}

/** Factory: construct a typed `EngineError` with shape-checked diagnostic. */
export function engineError(
  code: EngineErrorCode,
  diagnostic: Record<string, string | number> = {},
): EngineError {
  return new EngineError(code, diagnostic)
}

/**
 * Typed try-catch boundary (standing constraint #1): every FK-P9 call is
 * wrapped and rethrown as `STORAGE_FAILURE` carrying the FK-P9
 * `StorageErrorCode` literal only — never driver text.
 */
export function wrapStorageFailure(error: unknown): EngineError {
  if (error instanceof StorageErrorClass) {
    return engineError('STORAGE_FAILURE', { storageCode: error.code })
  }
  return engineError('STORAGE_FAILURE', { storageCode: 'STORAGE_IO_FAILURE' })
}

/** Run `fn`, converting any substrate throw into `STORAGE_FAILURE`. */
export function guardingStorage<T>(fn: () => T): T {
  try {
    return fn()
  } catch (error) {
    if (error instanceof EngineError) throw error
    throw wrapStorageFailure(error)
  }
}

export type { StorageError }
