import type { SchemaObject } from 'ajv'
import {
  type RiskClass,
  ROLE_IDS,
  type RoleId,
  riskClassSchema,
} from '../../role-authority/src/roles.js'
import { type Budget, budgetSchema } from './budget.js'
import { type Routing, routingSchema } from './routing.js'

/**
 * `worker.kaseya/v1` -- charter Section 7's common task envelope. Every
 * dispatched task uses this shape. Field-by-field requiredness is the WF-P2
 * spec's Constraints section (as amended by the coordinator, 2026-09-01) and
 * is re-stated verbatim in `README.md`'s AC1 table -- this doc-comment is a
 * pointer, not a second source of truth.
 *
 * Required (per amended spec): `apiVersion`, `taskId`, `goalId`, `parcelId`,
 * `role`, `taskType`, `riskClass`, `allowedFiles`, `forbiddenSurfaces`,
 * `acceptanceCriteria`, `evidenceRequirements`, `budget`, `inputDigest`,
 * `routing`. Of these, `allowedFiles`, `forbiddenSurfaces`,
 * `acceptanceCriteria`, and `evidenceRequirements` are arrays that are
 * required-but-may-be-empty: an absent key is a schema violation, `[]` is a
 * legitimate claim (a task may legitimately forbid zero surfaces or require
 * zero pieces of evidence beyond the envelope itself).
 *
 * Optional: `parentTaskId`, `requiredCapabilities`, `requiredModality`,
 * `allowedTools`, `inputRefs`, `verificationPlan` -- named in charter
 * Section 7 but not in the spec's required-field enumeration, and not made
 * assurance-bearing by any locked decision (the coordinator's general rule,
 * amendment 2026-09-01).
 *
 * `role` and `riskClass` import their vocabulary from `role-authority/`
 * (WF-P1) by reference -- this package declares no independent
 * role/risk-class enum (WF-P2 spec Constraints).
 */
export interface TaskEnvelope {
  readonly apiVersion: 'worker.kaseya/v1'
  readonly taskId: string
  readonly goalId: string
  readonly parcelId: string
  readonly parentTaskId?: string
  readonly role: RoleId
  /**
   * Open, non-empty string. Charter Section 7 does not enumerate a closed
   * taxonomy of task types, so this package does not invent one -- flagged
   * in the completion report as a judgment call for reviewer attention.
   */
  readonly taskType: string
  readonly riskClass: RiskClass
  readonly requiredCapabilities?: readonly string[]
  readonly requiredModality?: readonly string[]
  readonly allowedTools?: readonly string[]
  readonly allowedFiles: readonly string[]
  readonly forbiddenSurfaces: readonly string[]
  readonly inputRefs?: readonly string[]
  readonly inputDigest: string
  readonly acceptanceCriteria: readonly string[]
  readonly verificationPlan?: string
  readonly evidenceRequirements: readonly string[]
  readonly budget: Budget
  readonly routing: Routing
}

export const taskEnvelopeSchema: SchemaObject = {
  type: 'object',
  additionalProperties: false,
  required: [
    'apiVersion',
    'taskId',
    'goalId',
    'parcelId',
    'role',
    'taskType',
    'riskClass',
    'allowedFiles',
    'forbiddenSurfaces',
    'inputDigest',
    'acceptanceCriteria',
    'evidenceRequirements',
    'budget',
    'routing',
  ],
  properties: {
    apiVersion: { type: 'string', const: 'worker.kaseya/v1' },
    taskId: { type: 'string', minLength: 1 },
    goalId: { type: 'string', minLength: 1 },
    parcelId: { type: 'string', minLength: 1 },
    parentTaskId: { type: 'string', minLength: 1 },
    role: { type: 'string', enum: [...ROLE_IDS] },
    taskType: { type: 'string', minLength: 1 },
    riskClass: riskClassSchema,
    requiredCapabilities: { type: 'array', items: { type: 'string', minLength: 1 } },
    requiredModality: { type: 'array', items: { type: 'string', minLength: 1 } },
    allowedTools: { type: 'array', items: { type: 'string', minLength: 1 } },
    allowedFiles: { type: 'array', items: { type: 'string', minLength: 1 } },
    forbiddenSurfaces: { type: 'array', items: { type: 'string', minLength: 1 } },
    inputRefs: { type: 'array', items: { type: 'string', minLength: 1 } },
    inputDigest: { type: 'string', minLength: 1 },
    acceptanceCriteria: { type: 'array', items: { type: 'string', minLength: 1 } },
    verificationPlan: { type: 'string', minLength: 1 },
    evidenceRequirements: { type: 'array', items: { type: 'string', minLength: 1 } },
    budget: budgetSchema,
    routing: routingSchema,
  },
}
