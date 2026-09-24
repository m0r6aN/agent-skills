import type { SchemaObject } from 'ajv'

/**
 * Charter Section 7 `budget` block. Every numeric field carries `minimum: 0`
 * in the generated JSON Schema (WF-P2 spec AC2, coordinator amendment
 * 2026-09-01): a negative token count, wall-time, cost, or fan-out limit is
 * not a schema violation this package will let through. D22's fan-out
 * bounding and the cost ceiling both read from these fields; a schema that
 * validates `-1` here is not a schema.
 *
 * All five fields are required within the object: `budget` itself is a
 * required key of `TaskEnvelope` (not an array, so the required-but-empty
 * distinction does not apply here), and a budget missing one of its five
 * ceilings cannot be enforced by any of D22's consumers -- flagged in the
 * completion report as a judgment call since the spec does not state
 * per-field requiredness inside `budget` explicitly.
 */
export interface Budget {
  readonly maxInputTokens: number
  readonly maxOutputTokens: number
  readonly maxWallTimeSeconds: number
  readonly maxCostUsd: number
  readonly maxParallelChildren: number
}

export const budgetSchema: SchemaObject = {
  type: 'object',
  additionalProperties: false,
  required: [
    'maxInputTokens',
    'maxOutputTokens',
    'maxWallTimeSeconds',
    'maxCostUsd',
    'maxParallelChildren',
  ],
  properties: {
    maxInputTokens: { type: 'integer', minimum: 0 },
    maxOutputTokens: { type: 'integer', minimum: 0 },
    maxWallTimeSeconds: { type: 'number', minimum: 0 },
    maxCostUsd: { type: 'number', minimum: 0 },
    maxParallelChildren: { type: 'integer', minimum: 0 },
  },
}
