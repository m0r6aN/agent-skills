import type { SchemaObject } from 'ajv'

/**
 * Charter Section 8 `requirements` block. All three arrays are
 * required-but-may-be-empty: a worker that verified nothing uncertain
 * legitimately reports `uncertain: []`, but omitting the key entirely is a
 * schema violation, mirroring `changedSurfaces`'s treatment (WF-P2 spec
 * Constraints, AC4).
 */
export interface RequirementsOutcome {
  readonly satisfied: readonly string[]
  readonly unsatisfied: readonly string[]
  readonly uncertain: readonly string[]
}

export const requirementsOutcomeSchema: SchemaObject = {
  type: 'object',
  additionalProperties: false,
  required: ['satisfied', 'unsatisfied', 'uncertain'],
  properties: {
    satisfied: { type: 'array', items: { type: 'string', minLength: 1 } },
    unsatisfied: { type: 'array', items: { type: 'string', minLength: 1 } },
    uncertain: { type: 'array', items: { type: 'string', minLength: 1 } },
  },
}
