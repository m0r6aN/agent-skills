/**
 * AC2 (coordinator amendment, 2026-09-01, replacing the struck compile-error
 * guarantee -- see spec Constraints): one fully-populated sample per schema,
 * **every field of its interface populated, including every optional**.
 * Because every schema sets `additionalProperties: false`, if a schema
 * silently drops a property of its own interface (the exact regression
 * reviewer B demonstrated against the earlier claim), its sample -- which
 * still carries that property -- fails validation and the round-trip test
 * in `tests/parity.test.ts` goes red. That is a real, mutation-tested
 * type<->schema binding, unlike the compile-error claim it replaces.
 *
 * These are illustrative round-trip fixtures, not this package's ratified
 * D20/D21/D33 facts (those are `src/instances.ts`) -- a sample here may use
 * different field combinations than the real instance purely to exercise
 * every optional field at least once.
 */
import type { DataClassificationEligibility } from './data-classification.js'
import type {
  ModelFamilyDiversityRule,
  RiskClass,
  RoleAuthority,
  RoleCategory,
  RoleIdentity,
} from './roles.js'
import type { SerializationPointOwnership } from './serialization-points.js'
import type { VersionBumpRecord } from './versioning.js'

/** Every field populated, including the two optionals (`registryKey`, `modelFamily`). */
export const sampleRoleIdentity: RoleIdentity = {
  role: 'judge',
  category: 'accept',
  registryKey: 'fable-5',
  modelFamily: 'gpt-5.6',
}

export const sampleRiskClass: RiskClass = 'R3'

export const sampleRoleCategory: RoleCategory = 'accept'

/** No optional fields on this interface; both required fields populated. */
export const sampleModelFamilyDiversityRule: ModelFamilyDiversityRule = {
  riskClass: 'R3',
  minDistinctModelFamilies: 2,
}

/** No optional fields on this interface; all four required fields populated. */
export const sampleRoleAuthority: RoleAuthority = {
  role: 'judge',
  canSelfPromote: false,
  canSelfApprove: false,
  canCloseCriticalWork: true,
}

/** Every field populated, including the optional `authorizedExtenders`. */
export const sampleSerializationPointOwnership: SerializationPointOwnership = {
  path: 'plugins/foreman-line/role-authority/**',
  owner: 'WF-P1',
  extensionPolicy: 'shared',
  authorizedExtenders: ['WF-P2'],
}

/** Every field populated, including the optional `provenanceTag`. */
export const sampleDataClassificationEligibility: DataClassificationEligibility = {
  scope: 'builder',
  classification: 'public',
  provenanceTag: 'WF-P3 registry data, pending Kaseya security review',
}

/** No optional fields on this interface; every required field populated, including a non-empty `flaggedParcels`. */
export const sampleVersionBumpRecord: VersionBumpRecord = {
  version: 'role-authority.kaseya/v2',
  bumpType: 'major',
  date: '2026-09-01',
  flaggedParcels: ['WF-P2', 'WF-P3'],
}
