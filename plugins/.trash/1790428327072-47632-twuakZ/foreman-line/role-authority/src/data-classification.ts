import type { SchemaObject } from 'ajv'

/**
 * This package declares the field shape only -- a pointer from a role or
 * serialization point to a classification tag. Provider eligibility remains
 * a routing-policy concern and is not embedded in role contracts.
 */
export type DataClassification = 'public' | 'internal' | 'restricted'

export const DATA_CLASSIFICATIONS = [
  'public',
  'internal',
  'restricted',
] as const satisfies readonly DataClassification[]

export interface DataClassificationEligibility {
  /** What this eligibility tag is attached to -- a role id or a serialization-point path. */
  readonly scope: string
  readonly classification: DataClassification
  /** Free-text provenance note; routing policy populates concrete values. */
  readonly provenanceTag?: string
}

export const dataClassificationEligibilitySchema: SchemaObject = {
  type: 'object',
  additionalProperties: false,
  required: ['scope', 'classification'],
  properties: {
    scope: { type: 'string', minLength: 1 },
    classification: { type: 'string', enum: [...DATA_CLASSIFICATIONS] },
    provenanceTag: { type: 'string' },
  },
}
