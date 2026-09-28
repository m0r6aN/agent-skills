/** Legacy governed execution is retired; pure input hashing remains supported. */
import { createHash } from 'node:crypto'
import type { ShadowTaskType } from '../../../routing-policy/src/index.js'

export const SHADOW_LIMITS = {
  publicInputBytes: 65_536,
  candidateBytes: 32_768,
  evidenceRefCount: 64,
  evidenceRefBytes: 2_048,
  authorizationRefBytes: 512,
  reviewerIdBytes: 256,
  parcelIdBytes: 128,
  allowedTaskTypeCount: 16,
  taskTypeBytes: 128,
} as const

export class ShadowRoutingError extends Error {
  readonly code:
    | 'LEGACY_EXECUTION_RETIRED'
    | 'INVALID_INPUT'
    | 'INVALID_PUBLIC_INPUT'
    | 'PUBLIC_INPUT_TOO_LARGE'
    | 'NON_PUBLIC_INPUT'
    | 'PARCEL_AUTHORIZATION_MISMATCH'
    | 'PARCEL_TASK_NOT_AUTHORIZED'
    | 'AUTHORIZATION_VERIFICATION_FAILED'
    | 'INVALID_AUTHORIZATION_RECORD'
    | 'AUTHORIZATION_NOT_PUBLIC'
    | 'AUTHORIZATION_MISMATCH'
    | 'INVALID_REVIEW_BINDING'
    | 'POLICY_UNREADABLE'
    | 'POLICY_INVALID'
    | 'UNKNOWN_SHADOW_ROUTE'
    | 'UNSUPPORTED_TASK'
    | 'ADAPTER_INVOCATION_FAILED'
    | 'INVALID_ADAPTER_OUTPUT'
    | 'RECEIPT_WRITE_FAILED'
    | 'ROOT_NOT_ABSOLUTE'

  constructor(code: ShadowRoutingError['code'], message: string) {
    super(message)
    this.name = 'ShadowRoutingError'
    this.code = code
  }
}

export interface ParcelShadowAuthorization {
  /** Caller claim only; trusted authority comes from resolveParcelAuthorization. */
  readonly parcelId: string
  readonly authorizationRef: string
  readonly dataClassification: string
  readonly allowedTaskTypes: readonly string[]
  /** SHA-256 of the canonical JSON representation returned by hashShadowPublicInput. */
  readonly publicInputSha256: string
}

/** Narrow authoritative shape returned by the trusted Parcel resolver. */
export interface ResolvedParcelShadowAuthorization {
  readonly parcelId: string
  readonly dataClassification: 'public'
  readonly allowedTaskTypes: readonly string[]
  readonly publicInputSha256: string
}

export interface ShadowRoutingInput {
  readonly workflowId: string
  readonly routeName: string
  readonly taskType: string
  readonly publicInput: unknown
  readonly parcelAuthorization: ParcelShadowAuthorization
  /** A human or agent identity distinct from the shadow adapter. Review starts pending. */
  readonly independentReviewerId: string
}

export interface ShadowInvocationRequest {
  readonly adapterId: string
  readonly taskType: ShadowTaskType
  readonly publicInput: unknown
  readonly parcelId: string
  readonly authorizationRef: string
  readonly candidateOnly: true
  readonly authority: 'none'
  readonly toolsGranted: readonly []
  readonly effectCapability: 'none'
}

export interface ShadowRoutingDependencies {
  /** Resolve an authorization reference from a trusted host-local Parcel authority. */
  readonly resolveParcelAuthorization: (authorizationRef: string) => Promise<unknown>
  /** Must perform fresh host-local discovery; this module never caches its result. */
  readonly discoverAdapter: (adapterId: string) => Promise<unknown>
  /** Owns provider transport. The request cannot carry tools, effects, or authority. */
  readonly invokeAdapter: (request: ShadowInvocationRequest) => Promise<unknown>
}

export interface ShadowRoutingOptions {
  readonly repoRoot: string
  readonly pluginRoot: string
  readonly now?: () => string
}

interface ShadowResultContainment {
  readonly candidateOnly: true
  readonly authority: 'none'
  readonly toolsGranted: readonly []
  readonly effectCapability: 'none'
  readonly gateImpact: 'none'
  readonly approvalImpact: 'none'
  readonly receiptRef: string
}

export interface ShadowSkippedResult extends ShadowResultContainment {
  readonly status: 'skipped'
  readonly reason: 'adapter_not_verified_available'
  readonly reviewImpact: 'none'
}

export interface ShadowCandidateResult extends ShadowResultContainment {
  readonly status: 'candidate'
  readonly candidate: string
  readonly evidenceRefs: readonly string[]
  readonly candidateSha256: string
  readonly reviewImpact: 'pending_independent_review'
  readonly independentReview: {
    readonly required: true
    readonly status: 'pending'
    readonly reviewerId: string
    readonly candidateSha256: string
  }
}

export type ShadowRoutingResult = ShadowSkippedResult | ShadowCandidateResult

function isDenseArray(value: readonly unknown[]): boolean {
  if (Object.getOwnPropertySymbols(value).length !== 0) return false
  const ownNames = Object.getOwnPropertyNames(value).filter((name) => name !== 'length')
  if (ownNames.length !== value.length) return false
  for (let index = 0; index < value.length; index += 1) {
    if (!Object.hasOwn(value, index)) return false
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index))
    if (
      descriptor === undefined ||
      descriptor.enumerable !== true ||
      descriptor.get !== undefined ||
      descriptor.set !== undefined
    ) {
      return false
    }
  }
  return true
}

interface CanonicalBudget {
  bytes: number
  readonly maxBytes: number
}

function chargeCanonicalBudget(budget: CanonicalBudget, fragment: string): void {
  budget.bytes += Buffer.byteLength(fragment, 'utf8')
  if (budget.bytes > budget.maxBytes) {
    throw new ShadowRoutingError(
      'PUBLIC_INPUT_TOO_LARGE',
      `Canonical public input exceeds ${budget.maxBytes} UTF-8 bytes`,
    )
  }
}

function canonicalJson(
  value: unknown,
  ancestors: ReadonlySet<object> = new Set(),
  budget: CanonicalBudget = { bytes: 0, maxBytes: Number.POSITIVE_INFINITY },
): string {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    if (
      typeof value === 'string' &&
      Buffer.byteLength(value, 'utf8') > budget.maxBytes - budget.bytes
    ) {
      throw new ShadowRoutingError(
        'PUBLIC_INPUT_TOO_LARGE',
        `Canonical public input exceeds ${budget.maxBytes} UTF-8 bytes`,
      )
    }
    const serialized = JSON.stringify(value)
    chargeCanonicalBudget(budget, serialized)
    return serialized
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new ShadowRoutingError('INVALID_PUBLIC_INPUT', 'Public input must be finite JSON data')
    }
    const serialized = JSON.stringify(value)
    chargeCanonicalBudget(budget, serialized)
    return serialized
  }
  if (typeof value !== 'object') {
    throw new ShadowRoutingError('INVALID_PUBLIC_INPUT', 'Public input must be JSON data')
  }
  if (ancestors.has(value)) {
    throw new ShadowRoutingError('INVALID_PUBLIC_INPUT', 'Public input must not be cyclic')
  }

  const nextAncestors = new Set(ancestors)
  nextAncestors.add(value)
  if (Array.isArray(value)) {
    const remainingBytes = budget.maxBytes - budget.bytes
    if (Number.isFinite(remainingBytes) && value.length > Math.floor((remainingBytes + 1) / 2)) {
      throw new ShadowRoutingError(
        'PUBLIC_INPUT_TOO_LARGE',
        `Canonical public input exceeds ${budget.maxBytes} UTF-8 bytes`,
      )
    }
    if (!isDenseArray(value)) {
      throw new ShadowRoutingError(
        'INVALID_PUBLIC_INPUT',
        'Public input arrays must be dense JSON arrays without extra properties',
      )
    }
    chargeCanonicalBudget(budget, '[')
    const items: string[] = []
    for (let index = 0; index < value.length; index += 1) {
      if (index > 0) chargeCanonicalBudget(budget, ',')
      items.push(canonicalJson(value[index], nextAncestors, budget))
    }
    chargeCanonicalBudget(budget, ']')
    return `[${items.join(',')}]`
  }

  const prototype = Object.getPrototypeOf(value)
  if (prototype !== Object.prototype && prototype !== null) {
    throw new ShadowRoutingError('INVALID_PUBLIC_INPUT', 'Public input must contain plain objects')
  }
  const record = value as Record<string, unknown>
  const ownNames = Object.getOwnPropertyNames(record)
  if (
    Object.getOwnPropertySymbols(record).length !== 0 ||
    ownNames.some((key) => {
      const descriptor = Object.getOwnPropertyDescriptor(record, key)
      return (
        descriptor === undefined ||
        descriptor.enumerable !== true ||
        descriptor.get !== undefined ||
        descriptor.set !== undefined
      )
    })
  ) {
    throw new ShadowRoutingError(
      'INVALID_PUBLIC_INPUT',
      'Public input objects must contain only enumerable JSON data properties',
    )
  }
  chargeCanonicalBudget(budget, '{')
  const entries: string[] = []
  for (const [index, key] of ownNames.sort().entries()) {
    if (index > 0) chargeCanonicalBudget(budget, ',')
    if (Buffer.byteLength(key, 'utf8') > budget.maxBytes - budget.bytes) {
      throw new ShadowRoutingError(
        'PUBLIC_INPUT_TOO_LARGE',
        `Canonical public input exceeds ${budget.maxBytes} UTF-8 bytes`,
      )
    }
    const serializedKey = JSON.stringify(key)
    chargeCanonicalBudget(budget, serializedKey)
    chargeCanonicalBudget(budget, ':')
    entries.push(`${serializedKey}:${canonicalJson(record[key], nextAncestors, budget)}`)
  }
  chargeCanonicalBudget(budget, '}')
  return `{${entries.join(',')}}`
}

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

function canonicalizeShadowPublicInput(publicInput: unknown): string {
  try {
    return canonicalJson(publicInput, new Set(), {
      bytes: 0,
      maxBytes: SHADOW_LIMITS.publicInputBytes,
    })
  } catch (error) {
    if (error instanceof ShadowRoutingError) throw error
    throw new ShadowRoutingError('INVALID_PUBLIC_INPUT', 'Public input must be canonical JSON data')
  }
}

/**
 * Bind a Parcel authorization to dense canonical JSON, independent of object
 * key order, while enforcing the public-input byte limit.
 */
export function hashShadowPublicInput(publicInput: unknown): string {
  return sha256(canonicalizeShadowPublicInput(publicInput))
}

/** Retired before inspecting any argument or invoking any dependency. */
export async function executeShadowRoute(
  _input: ShadowRoutingInput,
  _dependencies: ShadowRoutingDependencies,
  _options: ShadowRoutingOptions,
): Promise<ShadowRoutingResult> {
  throw new ShadowRoutingError('LEGACY_EXECUTION_RETIRED', 'Legacy governed inference is retired.')
}
