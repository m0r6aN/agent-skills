import type { SchemaObject } from 'ajv'

/**
 * Charter Section 8 `usage` block. Every numeric field carries `minimum: 0`
 * (WF-P2 spec AC2, coordinator amendment 2026-09-01) -- D24's usage metadata
 * exists to be read by cost/consumption accounting, and a negative token
 * count or negative cost is not a value that accounting can consume, so it
 * is refused at the schema boundary rather than downstream.
 *
 * All four fields are required within the object, mirroring `Budget`'s
 * treatment (see budget.ts doc-comment for the same judgment-call note).
 */
export interface UsageMetadata {
  readonly inputTokens: number
  readonly outputTokens: number
  readonly wallTimeMs: number
  readonly estimatedCostUsd: number
}

export const usageMetadataSchema: SchemaObject = {
  type: 'object',
  additionalProperties: false,
  required: ['inputTokens', 'outputTokens', 'wallTimeMs', 'estimatedCostUsd'],
  properties: {
    inputTokens: { type: 'integer', minimum: 0 },
    outputTokens: { type: 'integer', minimum: 0 },
    wallTimeMs: { type: 'integer', minimum: 0 },
    estimatedCostUsd: { type: 'number', minimum: 0 },
  },
}
