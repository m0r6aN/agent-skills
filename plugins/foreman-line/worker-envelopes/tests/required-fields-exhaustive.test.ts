/**
 * AC2a (coordinator amendment 2026-09-01, addendum `605bf8b`): every field
 * listed in **any** of this package's seven `required` arrays -- the two
 * envelope-level schemas and all five nested object schemas (`Budget`,
 * `Routing`, `RequirementsOutcome`, `TestOutcomes`, `UsageMetadata`) -- must
 * be proven rejected when absent. Reviewer B found the original hole:
 * `tests/required-empty.test.ts` only exercises the seven required *arrays*
 * (the array-typed fields); the remaining required fields (including both
 * coordinator-amendment fields `inputDigest`/`routing`, plus `outputDigest`
 * and `modelRef`) had no absence guard at all.
 *
 * This file derives the covered fields from each schema's own `required`
 * array at runtime (`.required as readonly string[]`) rather than a literal
 * list -- so a field added to a `required` array later is covered
 * automatically, with no one needing to remember to add a test for it.
 *
 * **Self-reference limit, stated accurately (this is the honest half kept
 * from the previous revision):** because the per-field loop's coverage list
 * is *derived from* the same `required` array it tests, the loop cannot, by
 * construction, notice that array shrinking or being edited -- removing an
 * entry removes both the requirement and that entry's own absence-guard
 * test in the same edit, and the loop goes quiet about it.
 *
 * **What actually catches a shrunk or edited `required` array is the
 * membership pin below each loop**, not a cardinality count. A previous
 * revision used a `required.length === N` cardinality pin, which a
 * *swap* defeats: removing `'inputDigest'` from the task schema's required
 * array and adding any optional field the fixture already populates leaves
 * the count at 14 while the actual requirement silently disappears. It also
 * left five of the seven required arrays (every nested one) with no pin at
 * all -- removing `'maxCostUsd'` from `budgetSchema.required` shipped
 * 99/99 green with no test noticing. Both defects, and the swap in
 * particular, were confirmed independently by two delta recheckers who
 * chose different swap fields and got the same green result.
 *
 * The fix: each schema's `required` array is checked with a **membership
 * pin** -- a sorted `deepEqual` against the exact literal list of expected
 * field names, derived by hand from the charter/spec once and pinned here.
 * A literal name list is the correct tool for this one assertion, and only
 * this one: its entire job is detecting an unauthorized edit to the
 * `required` array, while the per-field loop above it keeps supplying
 * per-field absence coverage. Unlike a count, a sorted-membership `deepEqual`
 * catches removal, addition, renaming, AND a same-count swap, because it
 * compares identities, not a length.
 *
 * `tests/required-empty.test.ts` is left untouched (coordinator: "no test
 * that currently passes ... changes"); this file is additive, exhaustive
 * coverage layered on top of it.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Ajv, type SchemaObject } from 'ajv'
import { budgetSchema } from '../src/budget.js'
import { requirementsOutcomeSchema } from '../src/requirements-outcome.js'
import { resultEnvelopeSchema } from '../src/result-envelope.js'
import { routingSchema } from '../src/routing.js'
import { taskEnvelopeSchema } from '../src/task-envelope.js'
import { testOutcomesSchema } from '../src/test-outcomes.js'
import { usageMetadataSchema } from '../src/usage.js'
import { fullResultEnvelope, fullTaskEnvelope } from './fixtures.js'

const ajv = new Ajv({ allErrors: true })

function requiredOf(schema: SchemaObject): readonly string[] {
  const required = (schema as { required?: unknown }).required
  assert.ok(Array.isArray(required), 'schema has no required array to derive from')
  return required as readonly string[]
}

function omitKey<T extends object>(obj: T, key: string): Partial<T> {
  const copy = { ...obj } as Record<string, unknown>
  delete copy[key]
  return copy as Partial<T>
}

/**
 * Registers one "absent key is rejected" test per entry in `schema.required`
 * (derived live from the schema object, never a literal list), plus one
 * membership-pin test asserting `schema.required`'s contents -- sorted --
 * match `expectedRequired` exactly. The membership pin is what detects an
 * unauthorized edit (removal, addition, rename, or same-count swap) to the
 * `required` array itself; the per-field loop supplies the per-field
 * absence coverage for whatever that array currently contains.
 */
function registerAbsenceGuardTests(
  label: string,
  schema: SchemaObject,
  fullInstance: object,
  expectedRequired: readonly string[],
): void {
  const required = requiredOf(schema)
  for (const field of required) {
    test(`AC2a: ${label}.${field} is REJECTED when absent (derived from schema.required)`, () => {
      const validate = ajv.compile(schema)
      const instance = omitKey(fullInstance, field)
      assert.equal(
        validate(instance),
        false,
        `expected ${label} missing '${field}' to be rejected, but it validated`,
      )
    })
  }

  test(`AC2a: ${label}.required is exactly {${[...expectedRequired].sort().join(', ')}} (membership pin, sorted)`, () => {
    assert.deepEqual(
      [...required].sort(),
      [...expectedRequired].sort(),
      `${label}.required drifted from its pinned membership -- an unauthorized edit ` +
        '(removal, addition, rename, or same-count swap) to the required array was detected',
    )
  })
}

const TASK_REQUIRED = [
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
] as const

const RESULT_REQUIRED = [
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
] as const

const BUDGET_REQUIRED = [
  'maxInputTokens',
  'maxOutputTokens',
  'maxWallTimeSeconds',
  'maxCostUsd',
  'maxParallelChildren',
] as const

const ROUTING_REQUIRED = ['diversityRequired'] as const

const REQUIREMENTS_OUTCOME_REQUIRED = ['satisfied', 'unsatisfied', 'uncertain'] as const

const TEST_OUTCOMES_REQUIRED = ['passed', 'failed', 'notRun'] as const

const USAGE_METADATA_REQUIRED = [
  'inputTokens',
  'outputTokens',
  'wallTimeMs',
  'estimatedCostUsd',
] as const

registerAbsenceGuardTests('TaskEnvelope', taskEnvelopeSchema, fullTaskEnvelope, TASK_REQUIRED)
registerAbsenceGuardTests(
  'ResultEnvelope',
  resultEnvelopeSchema,
  fullResultEnvelope,
  RESULT_REQUIRED,
)
registerAbsenceGuardTests('Budget', budgetSchema, fullTaskEnvelope.budget, BUDGET_REQUIRED)
registerAbsenceGuardTests('Routing', routingSchema, fullTaskEnvelope.routing, ROUTING_REQUIRED)
registerAbsenceGuardTests(
  'RequirementsOutcome',
  requirementsOutcomeSchema,
  fullResultEnvelope.requirements,
  REQUIREMENTS_OUTCOME_REQUIRED,
)
registerAbsenceGuardTests(
  'TestOutcomes',
  testOutcomesSchema,
  fullResultEnvelope.tests,
  TEST_OUTCOMES_REQUIRED,
)
registerAbsenceGuardTests(
  'UsageMetadata',
  usageMetadataSchema,
  fullResultEnvelope.usage,
  USAGE_METADATA_REQUIRED,
)
