import type { SchemaObject } from 'ajv'

/**
 * Charter Section 8 `tests` block. All three arrays are
 * required-but-may-be-empty (WF-P2 spec Constraints names `tests.notRun: []`
 * explicitly as an example; `passed`/`failed` follow the identical
 * reasoning -- a worker that ran zero tests reports `passed: []`, not an
 * absent key).
 */
export interface TestOutcomes {
  readonly passed: readonly string[]
  readonly failed: readonly string[]
  readonly notRun: readonly string[]
}

export const testOutcomesSchema: SchemaObject = {
  type: 'object',
  additionalProperties: false,
  required: ['passed', 'failed', 'notRun'],
  properties: {
    passed: { type: 'array', items: { type: 'string', minLength: 1 } },
    failed: { type: 'array', items: { type: 'string', minLength: 1 } },
    notRun: { type: 'array', items: { type: 'string', minLength: 1 } },
  },
}
