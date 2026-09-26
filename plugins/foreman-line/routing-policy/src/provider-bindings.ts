import { Ajv } from 'ajv'
import {
  type PMC_LANE_POLICIES_V1,
  providerBindingPolicyV1Schema,
} from './provider-binding-schemas.js'

export type PmcProvider = 'opencode' | 'openrouter'
export type PmcLaneId = 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6'
export type PmcRoleFamily = 'coordinator' | 'verifier' | 'builder' | 'classifier'
export type EvidenceState = 'static-conformance' | 'live-availability' | 'model-quality'
export type EvidenceValue<T> =
  | Readonly<{ status: 'unknown'; reason: string }>
  | Readonly<{ status: 'recorded'; value: T; evidenceRef: string }>
export type LogicalCandidateV1 = Readonly<{
  logicalCandidateId: string
  family: EvidenceValue<string>
}>
export type BindingEvidenceV1 = Readonly<{
  dataClasses: EvidenceValue<readonly ('public' | 'internal' | 'restricted')[]>
  transportRequirements: EvidenceValue<
    Readonly<{ data_collection: 'allow' | 'deny'; zdr: boolean }>
  >
  toolUse: EvidenceValue<boolean>
  structuredOutput: EvidenceValue<boolean>
  reasoning: EvidenceValue<boolean>
  inputModalities: EvidenceValue<readonly ('text' | 'image')[]>
  thinkingLevels: EvidenceValue<readonly string[]>
  contextWindow: EvidenceValue<number>
  maxTokens: EvidenceValue<number>
  rates: EvidenceValue<Readonly<{ input: number; output: number; unit: 'USD per 1M tokens' }>>
  enabled: EvidenceValue<boolean>
  availability: EvidenceValue<
    Readonly<{
      available: boolean
      checkedAtUtc: string
      attestationRef: string
      evidenceState: 'live-availability'
    }>
  >
  qualityByLane: EvidenceValue<
    readonly Readonly<{
      lane: PmcLaneId
      score: number
      evidenceRef: string
      evidenceState: 'model-quality'
    }>[]
  >
}>
export type ProviderBindingV1 = Readonly<{
  bindingId: string
  logicalCandidateId: string
  provider: PmcProvider
  providerModelId: string
  piHostModelId: string
  protocol: EvidenceValue<string>
  catalogBaseUrl: EvidenceValue<string>
  identityState: 'catalog-recorded' | 'owner-attested' | 'held'
  identityRefusalCodes: readonly string[]
  eligibility: BindingEvidenceV1
}>
export type LaneBindingV1 = Readonly<{
  lane: PmcLaneId
  bindingId: string
  matrixRole: 'primary' | 'fallback'
  fallbackBindingId: string | null
}>
export type LanePolicyV1 = (typeof PMC_LANE_POLICIES_V1)[number]
export type BindingProvenanceV1 = Readonly<{
  sourceRef: string
  sourceRevision: string
  contentSha256: string
  catalogVersion: EvidenceValue<string>
  mappingVersion: string
  policySchemaVersion: 'pmc-provider-binding-policy/v1'
  roleMapVersion: string
  foremanRevision: string
  piRuntimeVersion: EvidenceValue<string>
  acquiredAtUtc: EvidenceValue<string>
  evidenceState: EvidenceState
  freshnessAcceptance: 'not-accepted' | 'owner-accepted'
}>
export type ProviderBindingPolicyV1 = Readonly<{
  schemaVersion: 'pmc-provider-binding-policy/v1'
  compatibility: 'additive-v0-preserved'
  provenance: BindingProvenanceV1
  candidates: readonly LogicalCandidateV1[]
  bindings: readonly ProviderBindingV1[]
  lanes: readonly LanePolicyV1[]
  laneBindings: readonly LaneBindingV1[]
}>
export type ProviderBindingErrorCodeV1 =
  | 'PLAIN_DATA_REFUSED'
  | 'SCHEMA_INVALID'
  | 'VALIDATION_BOUNDARY_FAILED'
  | 'DUPLICATE_ID'
  | 'MISSING_CANDIDATE'
  | 'DUPLICATE_PROVIDER_MODEL'
  | 'PI_IDENTITY_MISMATCH'
  | 'LANE_SET_INVALID'
  | 'DUPLICATE_OCCURRENCE'
  | 'MISSING_BINDING'
  | 'FALLBACK_INVALID'
  | 'NONPUBLIC_TRANSPORT_REQUIRED'
  | 'HELD_BINDING_NOT_ELIGIBLE'
  | 'IDENTITY_REFUSAL_STATE'
  | 'QUALITY_LANE_INVALID'
  | 'L6_BINDING_REFUSED'
  | 'ERRORS_TRUNCATED'
export type ProviderBindingValidationErrorV1 = Readonly<{
  code: ProviderBindingErrorCodeV1
  path: string
}>
export type ProviderBindingValidationResultV1 =
  | Readonly<{ valid: true; value: ProviderBindingPolicyV1 }>
  | Readonly<{ valid: false; errors: readonly ProviderBindingValidationErrorV1[] }>

// Copy descriptors, never caller iterators/getters/toJSON. Only this owned snapshot
// reaches Ajv or semantic traversal. Limits include object keys and repeated values.
function snapshot(input: unknown): unknown {
  let visits = 0
  let stringUnits = 0
  const active = new Set<object>()
  const charge = (value: string) => {
    stringUnits += value.length
    if (value.length > 2048 || stringUnits > 1048576) throw new Error('string bound')
  }
  const copy = (value: unknown, depth: number, maxItems = 65536): unknown => {
    if (++visits > 65536 || depth > 16) throw new Error('traversal bound')
    if (typeof value === 'string') {
      charge(value)
      return value
    }
    if (value === null || typeof value === 'boolean') return value
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value !== 'object' || active.has(value)) throw new Error('not plain data')
    const array = Array.isArray(value)
    const prototype = Object.getPrototypeOf(value)
    if (
      array ? prototype !== Array.prototype : prototype !== Object.prototype && prototype !== null
    )
      throw new Error('prototype')
    active.add(value)
    const keys = Reflect.ownKeys(value)
    if (keys.length > 65536 - visits) throw new Error('key bound')
    const output: Record<string, unknown> | unknown[] = array ? [] : {}
    let length = 0
    if (array) {
      const descriptor = Object.getOwnPropertyDescriptor(value, 'length')
      if (
        !descriptor ||
        !('value' in descriptor) ||
        !Number.isSafeInteger(descriptor.value) ||
        descriptor.value > maxItems
      )
        throw new Error('array length')
      length = descriptor.value
      if (keys.length !== length + 1) throw new Error('sparse or extended array')
    }
    for (const key of keys) {
      if (array && key === 'length') continue
      if (typeof key !== 'string') throw new Error('symbol')
      charge(key)
      const descriptor = Object.getOwnPropertyDescriptor(value, key)
      if (!descriptor || !('value' in descriptor) || !descriptor.enumerable)
        throw new Error('accessor or hidden property')
      if (
        array &&
        (!Number.isInteger(Number(key)) ||
          Number(key) < 0 ||
          Number(key) >= length ||
          String(Number(key)) !== key)
      )
        throw new Error('array key')
      const bound =
        depth === 0
          ? (
              { candidates: 256, bindings: 256, lanes: 6, laneBindings: 1536 } as Record<
                string,
                number
              >
            )[key]
          : undefined
      Object.defineProperty(output, key, {
        value: copy(descriptor.value, depth + 1, bound),
        enumerable: true,
        writable: true,
        configurable: true,
      })
    }
    active.delete(value)
    return output
  }
  return copy(input, 0)
}

function freeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child)
    Object.freeze(value)
  }
  return value
}

/** Static declaration validation only: success never establishes eligibility,
 * authenticity, freshness, independent family, a budget or launch authority. */
export function validateProviderBindingPolicyV1(input: unknown): ProviderBindingValidationResultV1 {
  let owned: unknown
  try {
    owned = snapshot(input)
  } catch {
    return { valid: false, errors: [{ code: 'PLAIN_DATA_REFUSED', path: '' }] }
  }
  const errors: ProviderBindingValidationErrorV1[] = []
  const add = (code: ProviderBindingErrorCodeV1, path: string) => {
    if (errors.length < 127) errors.push({ code, path })
    else if (errors.length === 127) errors.push({ code: 'ERRORS_TRUNCATED', path: '' })
  }
  try {
    // Compile inside the typed boundary: a library failure is a typed refusal.
    // Fail-fast Ajv avoids building an unbounded intermediate error list.
    const validate = new Ajv({ allErrors: false, strict: true }).compile(
      providerBindingPolicyV1Schema,
    )
    if (!validate(owned))
      return {
        valid: false,
        errors: [{ code: 'SCHEMA_INVALID', path: validate.errors?.[0]?.instancePath ?? '' }],
      }
    const policy = owned as ProviderBindingPolicyV1
    const candidates = new Set<string>()
    policy.candidates.forEach((candidate, index) => {
      if (candidates.has(candidate.logicalCandidateId))
        add('DUPLICATE_ID', `/candidates/${index}/logicalCandidateId`)
      candidates.add(candidate.logicalCandidateId)
    })
    const bindings = new Map<string, ProviderBindingV1>()
    const identities = new Set<string>()
    policy.bindings.forEach((binding, index) => {
      const path = `/bindings/${index}`
      if (bindings.has(binding.bindingId)) add('DUPLICATE_ID', `${path}/bindingId`)
      bindings.set(binding.bindingId, binding)
      if (!candidates.has(binding.logicalCandidateId))
        add('MISSING_CANDIDATE', `${path}/logicalCandidateId`)
      // Tuple encoding is collision-free even for literal slashes or separators.
      const identity = JSON.stringify([binding.provider, binding.providerModelId])
      if (identities.has(identity)) add('DUPLICATE_PROVIDER_MODEL', path)
      identities.add(identity)
      // Compare supplied identities; never fill, parse, normalize or repair one.
      if (binding.piHostModelId !== `${binding.provider}/${binding.providerModelId}`)
        add('PI_IDENTITY_MISMATCH', `${path}/piHostModelId`)
      if (binding.identityRefusalCodes.length > 0 && binding.identityState !== 'held')
        add('IDENTITY_REFUSAL_STATE', `${path}/identityRefusalCodes`)
      if (binding.identityState === 'held' && binding.identityRefusalCodes.length === 0)
        add('IDENTITY_REFUSAL_STATE', `${path}/identityRefusalCodes`)
      const evidence = binding.eligibility
      if (
        evidence.dataClasses.status === 'recorded' &&
        evidence.dataClasses.value.some((value) => value !== 'public') &&
        (evidence.transportRequirements.status !== 'recorded' ||
          evidence.transportRequirements.value.data_collection !== 'deny' ||
          !evidence.transportRequirements.value.zdr)
      )
        add('NONPUBLIC_TRANSPORT_REQUIRED', `${path}/eligibility/transportRequirements`)
      if (
        binding.identityState === 'held' &&
        ((evidence.dataClasses.status === 'recorded' && evidence.dataClasses.value.length > 0) ||
          (evidence.enabled.status === 'recorded' && evidence.enabled.value) ||
          (evidence.availability.status === 'recorded' && evidence.availability.value.available))
      )
        add('HELD_BINDING_NOT_ELIGIBLE', `${path}/eligibility`)
      if (evidence.qualityByLane.status === 'recorded') {
        const seen = new Set<PmcLaneId>()
        evidence.qualityByLane.value.forEach((quality, qualityIndex) => {
          if (
            seen.has(quality.lane) ||
            !policy.laneBindings.some(
              (entry) => entry.bindingId === binding.bindingId && entry.lane === quality.lane,
            )
          )
            add('QUALITY_LANE_INVALID', `${path}/eligibility/qualityByLane/value/${qualityIndex}`)
          seen.add(quality.lane)
        })
      }
    })
    if (new Set(policy.lanes.map((entry) => entry.lane)).size !== 6)
      add('LANE_SET_INVALID', '/lanes')
    const occurrences = new Map<string, LaneBindingV1>()
    const key = (lane: PmcLaneId, bindingId: string) => JSON.stringify([lane, bindingId])
    policy.laneBindings.forEach((entry, index) => {
      if (occurrences.has(key(entry.lane, entry.bindingId)))
        add('DUPLICATE_OCCURRENCE', `/laneBindings/${index}`)
      occurrences.set(key(entry.lane, entry.bindingId), entry)
    })
    policy.laneBindings.forEach((entry, index) => {
      const path = `/laneBindings/${index}`
      const binding = bindings.get(entry.bindingId)
      if (!binding) add('MISSING_BINDING', `${path}/bindingId`)
      // M2 keeps exactly these two historical L6 declarations; never Jev/promotions.
      if (
        entry.lane === 'L6' &&
        binding &&
        (binding.provider !== 'opencode' ||
          binding.providerModelId !==
            (entry.matrixRole === 'primary' ? 'qwen3.8-flash' : 'glm-5.3-flash'))
      )
        add('L6_BINDING_REFUSED', path)
      if (entry.matrixRole === 'fallback') {
        if (entry.fallbackBindingId !== null) add('FALLBACK_INVALID', `${path}/fallbackBindingId`)
      } else {
        const target =
          entry.fallbackBindingId === null
            ? undefined
            : occurrences.get(key(entry.lane, entry.fallbackBindingId))
        const targetBinding = target ? bindings.get(target.bindingId) : undefined
        if (
          !target ||
          target.bindingId === entry.bindingId ||
          target.matrixRole !== 'fallback' ||
          target.fallbackBindingId !== null ||
          !binding ||
          !targetBinding ||
          binding.provider !== targetBinding.provider
        )
          add('FALLBACK_INVALID', `${path}/fallbackBindingId`)
      }
    })
    if (errors.length > 0) return { valid: false, errors: freeze(errors) }
    return { valid: true, value: freeze(policy) }
  } catch {
    return { valid: false, errors: [{ code: 'VALIDATION_BOUNDARY_FAILED', path: '' }] }
  }
}
