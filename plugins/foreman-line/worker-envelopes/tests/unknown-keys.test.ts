/**
 * Boundary-routing item 3 negative fixtures (charter gate: "negative fixtures
 * prove unknown keys, missing required fields, and malformed paths refuse").
 *
 * Missing-required refusal is already exhaustive here
 * (`tests/required-fields-exhaustive.test.ts`, derived from each schema's own
 * `required` array, with membership pins). What was unproven is the unknown-key
 * half of the strictness gate: every container in these envelopes sets
 * `additionalProperties: false`, but no test proved an unknown key is actually
 * refused. This file supplies one unknown-key negative per strict container —
 * the two envelope objects and their five nested objects (Budget, Routing,
 * RequirementsOutcome, TestOutcomes, UsageMetadata).
 *
 * Scope statement (malformed paths): `allowedFiles`, `forbiddenSurfaces`, and
 * `changedSurfaces` members are deliberately opaque non-empty strings at the
 * serialization layer; path well-formedness is refused at the enforcement
 * boundary by mutation-scope-guard (`MALFORMED_PATH`, both checkpoints) and
 * proven through the dispatch seam by `dispatch/tests/mutation-scope.test.ts`.
 * A malformed path never reaches a worktree — see the items-3-4 status record.
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

/**
 * One case per strict container: the container's own schema, the fully
 * populated instance that must keep validating (positive control, so a broken
 * fixture can never make a negative vacuously green), and the mutated instance
 * carrying exactly one unknown key.
 */
const cases: ReadonlyArray<{
  label: string
  schema: SchemaObject
  valid: unknown
  withUnknownKey: unknown
}> = [
  {
    label: 'TaskEnvelope',
    schema: taskEnvelopeSchema as SchemaObject,
    valid: fullTaskEnvelope,
    withUnknownKey: { ...fullTaskEnvelope, notAField: true },
  },
  {
    label: 'ResultEnvelope',
    schema: resultEnvelopeSchema as SchemaObject,
    valid: fullResultEnvelope,
    withUnknownKey: { ...fullResultEnvelope, notAField: true },
  },
  {
    label: 'Budget',
    schema: budgetSchema as SchemaObject,
    valid: fullTaskEnvelope.budget,
    withUnknownKey: { ...fullTaskEnvelope.budget, notAField: true },
  },
  {
    label: 'Routing',
    schema: routingSchema as SchemaObject,
    valid: fullTaskEnvelope.routing,
    withUnknownKey: { ...fullTaskEnvelope.routing, notAField: true },
  },
  {
    label: 'RequirementsOutcome',
    schema: requirementsOutcomeSchema as SchemaObject,
    valid: fullResultEnvelope.requirements,
    withUnknownKey: { ...fullResultEnvelope.requirements, notAField: true },
  },
  {
    label: 'TestOutcomes',
    schema: testOutcomesSchema as SchemaObject,
    valid: fullResultEnvelope.tests,
    withUnknownKey: { ...fullResultEnvelope.tests, notAField: true },
  },
  {
    label: 'UsageMetadata',
    schema: usageMetadataSchema as SchemaObject,
    valid: fullResultEnvelope.usage,
    withUnknownKey: { ...fullResultEnvelope.usage, notAField: true },
  },
]

test('unknown-key coverage: exactly 7 strict containers (2 envelope objects + 5 nested objects)', () => {
  assert.deepEqual(cases.map((c) => c.label).sort(), [
    'Budget',
    'RequirementsOutcome',
    'ResultEnvelope',
    'Routing',
    'TaskEnvelope',
    'TestOutcomes',
    'UsageMetadata',
  ])
})

for (const { label, schema, valid, withUnknownKey } of cases) {
  test(`positive control: the fully-populated ${label} fixture still validates (a broken fixture would make the negative vacuous)`, () => {
    const validate = ajv.compile(schema)
    assert.ok(validate(valid), `${label}: ${JSON.stringify(validate.errors)}`)
  })

  test(`unknown keys refuse: ${label} rejects an unknown property (additionalProperties: false)`, () => {
    const validate = ajv.compile(schema)
    assert.equal(
      validate(withUnknownKey),
      false,
      `${label} accepted an unknown key 'notAField' despite additionalProperties: false`,
    )
  })
}
