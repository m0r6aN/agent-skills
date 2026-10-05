import type { SchemaObject } from 'ajv'

/**
 * Versioning rule (Constraints): a minor bump is additive/backward-compatible;
 * a major bump is breaking and must record, in `CHANGELOG.md`, every
 * already-dispatched parcel whose `routing.preferredModel`/`role` reference
 * is pinned to the prior major -- those parcels are flagged for re-check, not
 * silently reinterpreted under the new major (D26).
 */
export type VersionBumpType = 'major' | 'minor'

export interface VersionBumpRecord {
  /** e.g. `role-authority.kaseya/v1`, `role-authority.kaseya/v2`. */
  readonly version: string
  readonly bumpType: VersionBumpType
  /** ISO-8601 UTC date of the bump. */
  readonly date: string
  /** Only non-empty for a `'major'` bump: every pinned parcel flagged for re-check. */
  readonly flaggedParcels: readonly string[]
}

export const versionBumpRecordSchema: SchemaObject = {
  type: 'object',
  additionalProperties: false,
  required: ['version', 'bumpType', 'date', 'flaggedParcels'],
  properties: {
    version: { type: 'string', minLength: 1 },
    bumpType: { type: 'string', enum: ['major', 'minor'] },
    date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
    flaggedParcels: {
      type: 'array',
      items: { type: 'string', minLength: 1 },
    },
  },
}
