import type { SchemaObject } from 'ajv'

/**
 * Charter Section 7 `routing` block. Per coordinator amendment 2026-09-01:
 * `routing` itself is a REQUIRED key of `TaskEnvelope` -- every dispatched
 * task had a routing decision (D18: routing is policy-driven; this goal
 * mints a routing receipt for every single dispatch, including the one that
 * dispatched this parcel's own builder). `diversityRequired` is REQUIRED
 * within `routing` -- it is the assurance-bearing field of the block under
 * D21 (model-family diversity for elevated/critical verification); leaving
 * it optional would let a critical task omit its diversity requirement with
 * nothing noticing. `preferredModel`, `fallbackModels`, and
 * `escalationTarget` remain optional.
 *
 * `preferredModel` and the entries of `fallbackModels` are opaque,
 * non-empty registry-key strings, never a closed union -- the same D25/F6
 * reasoning WF-P2 spec Constraints applies to the result envelope's
 * `modelRef` (AC6) applies here: a closed union of concrete model IDs would
 * duplicate the registry `routing-policy/` owns. Concrete provider identifiers
 * are intentionally absent from this contract.
 */
export interface Routing {
  readonly preferredModel?: string
  readonly fallbackModels?: readonly string[]
  readonly diversityRequired: boolean
  readonly escalationTarget?: string
}

export const routingSchema: SchemaObject = {
  type: 'object',
  additionalProperties: false,
  required: ['diversityRequired'],
  properties: {
    preferredModel: { type: 'string', minLength: 1 },
    fallbackModels: {
      type: 'array',
      items: { type: 'string', minLength: 1 },
    },
    diversityRequired: { type: 'boolean' },
    escalationTarget: { type: 'string', minLength: 1 },
  },
}
