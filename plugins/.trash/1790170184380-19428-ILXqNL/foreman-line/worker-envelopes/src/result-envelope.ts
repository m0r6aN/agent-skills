import type { SchemaObject } from 'ajv'
import { ROLE_IDS, type RoleId } from '../../role-authority/src/roles.js'
import { type RequirementsOutcome, requirementsOutcomeSchema } from './requirements-outcome.js'
import { type TestOutcomes, testOutcomesSchema } from './test-outcomes.js'
import { type UsageMetadata, usageMetadataSchema } from './usage.js'

/** Charter Section 8's five terminal statuses. */
export type ResultStatus = 'COMPLETED' | 'PARTIAL' | 'BLOCKED' | 'REFUSED' | 'FAILED'

export const RESULT_STATUSES = [
  'COMPLETED',
  'PARTIAL',
  'BLOCKED',
  'REFUSED',
  'FAILED',
] as const satisfies readonly ResultStatus[]

/**
 * `worker-result.kaseya/v1` -- charter Section 8's common result envelope.
 * Every worker, verifier, analyst, or specialist returns this shape.
 * Field-by-field requiredness is the WF-P2 spec's Constraints section, and
 * is re-stated verbatim in `README.md`'s AC1 table -- this doc-comment is a
 * pointer, not a second source of truth.
 *
 * Required: `apiVersion`, `taskId`, `role`, `modelRef`, `status`, `summary`,
 * `requirements`, `changedSurfaces`, `commandsExecuted`, `tests`,
 * `evidence`, `usage`, `outputDigest`. Of these, `changedSurfaces`,
 * `commandsExecuted`, and `evidence` are arrays that are
 * required-but-may-be-empty -- this is precisely the distinction that makes
 * charter Section 8's "must identify changed files **or explicitly state
 * that no files changed**" enforceable rather than decorative (WF-P2 spec
 * AC4): an absent `changedSurfaces` key is a schema violation, `[]` is a
 * legitimate claim that nothing changed.
 *
 * Optional: `uncertainties` (not named in the spec's required list, and not
 * made assurance-bearing by any locked decision), `confidenceSignal` and
 * `recommendedEscalation` (explicitly optional per D19 -- worker confidence
 * is routing metadata only, never proof, so making it mandatory would
 * misstate its status as if it were required evidence).
 *
 * `role` imports its vocabulary from `role-authority/` (WF-P1) by reference.
 * `modelRef` is an opaque, non-empty registry-key string -- never a closed
 * union of concrete model identifiers (WF-P2 spec AC6; see the schema
 * property below for the full reasoning). Provider-specific model names are
 * intentionally absent from this contract.
 */
export interface ResultEnvelope {
  readonly apiVersion: 'worker-result.kaseya/v1'
  readonly taskId: string
  readonly role: RoleId
  /**
   * Opaque registry-key string. WF-P3 (`plugins/foreman-line/routing-policy/`)
   * is the parcel that binds concrete values -- this package types the
   * *shape* only, never a TypeScript union or enum of concrete model
   * identifiers. A closed union here would duplicate the registry
   * `routing-policy/` owns and WF-P3 is chartered to extend: the exact F6
   * failure this goal has already paid for once (charter Amendment 1, WF-P3
   * re-scope).
   */
  readonly modelRef: string
  readonly status: ResultStatus
  readonly summary: string
  readonly requirements: RequirementsOutcome
  readonly changedSurfaces: readonly string[]
  readonly commandsExecuted: readonly string[]
  readonly tests: TestOutcomes
  readonly evidence: readonly string[]
  readonly uncertainties?: readonly string[]
  /** D19: routing metadata only, never proof. Optional -- see class doc-comment. */
  readonly confidenceSignal?: string
  readonly recommendedEscalation?: string
  readonly usage: UsageMetadata
  readonly outputDigest: string
}

export const resultEnvelopeSchema: SchemaObject = {
  type: 'object',
  additionalProperties: false,
  required: [
    'apiVersion',
    'taskId',
    'role',
    'modelRef',
    'status',
    'summary',
    'requirements',
    'changedSurfaces',
    'commandsExecuted',
    'tests',
    'evidence',
    'usage',
    'outputDigest',
  ],
  properties: {
    apiVersion: { type: 'string', const: 'worker-result.kaseya/v1' },
    taskId: { type: 'string', minLength: 1 },
    role: { type: 'string', enum: [...ROLE_IDS] },
    // modelRef: opaque registry-key string. See AC6 / class doc-comment above --
    // never a closed union or enum of concrete model identifiers.
    modelRef: { type: 'string', minLength: 1 },
    status: { type: 'string', enum: [...RESULT_STATUSES] },
    summary: { type: 'string', minLength: 1 },
    requirements: requirementsOutcomeSchema,
    changedSurfaces: { type: 'array', items: { type: 'string', minLength: 1 } },
    commandsExecuted: { type: 'array', items: { type: 'string', minLength: 1 } },
    tests: testOutcomesSchema,
    evidence: { type: 'array', items: { type: 'string', minLength: 1 } },
    uncertainties: { type: 'array', items: { type: 'string', minLength: 1 } },
    confidenceSignal: { type: 'string', minLength: 1 },
    recommendedEscalation: { type: 'string', minLength: 1 },
    usage: usageMetadataSchema,
    outputDigest: { type: 'string', minLength: 1 },
  },
}
