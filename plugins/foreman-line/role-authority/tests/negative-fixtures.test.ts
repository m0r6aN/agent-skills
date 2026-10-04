/**
 * Boundary-routing item 3 negative fixtures (charter gate: "negative fixtures
 * prove unknown keys, missing required fields, and malformed paths refuse").
 *
 * `tests/parity.test.ts` proves generated parity (no-drift per schema) and the
 * full-population round-trip, plus value-vocabulary negatives for the two
 * primitive enum schemas. What it does NOT prove is the strictness half of the
 * gate: that an UNKNOWN KEY is refused by `additionalProperties: false`, and
 * that a MISSING REQUIRED field is refused, for every object-typed schema.
 * This file supplies exactly those two negative families, derived from each
 * schema's own `required` array (same derivation pattern as
 * `worker-envelopes/tests/required-fields-exhaustive.test.ts`) so a field
 * added to a `required` array later is covered automatically.
 *
 * Scope statement (malformed paths): no role-authority schema validates a
 * path SHAPE. The only path-typed field,
 * `serialization-point-ownership.path`, is deliberately an opaque non-empty
 * string; malformed-path refusal is owned by the reader schema
 * (contract-readers' `reject-*` fixtures) and the mutation-scope-guard
 * (`MALFORMED_PATH`), cited in the items-3-4 status record.
 *
 * The two primitive enum schemas (`risk-class`, `role-category`) have no
 * object keys and no `required` array; their "unknown value" negatives live in
 * `parity.test.ts` ("risk class: sample validates, unknown rejected",
 * "role category: D16 mutual exclusivity -- only one of four values").
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Ajv, type SchemaObject } from 'ajv'
import { dataClassificationEligibilitySchema } from '../src/data-classification.js'
import {
  modelFamilyDiversityRuleSchema,
  roleAuthoritySchema,
  roleIdentitySchema,
} from '../src/roles.js'
import {
  sampleDataClassificationEligibility,
  sampleModelFamilyDiversityRule,
  sampleRoleAuthority,
  sampleRoleIdentity,
  sampleSerializationPointOwnership,
  sampleVersionBumpRecord,
} from '../src/samples.js'
import { serializationPointOwnershipSchema } from '../src/serialization-points.js'
import { versionBumpRecordSchema } from '../src/versioning.js'

const ajv = new Ajv({ allErrors: true })

/** Every object-typed schema with its fully-populated sample (6 of 8). */
const objectCases: ReadonlyArray<{ name: string; schema: SchemaObject; sample: object }> = [
  {
    name: 'role-identity',
    schema: roleIdentitySchema as SchemaObject,
    sample: sampleRoleIdentity,
  },
  {
    name: 'family-diversity',
    schema: modelFamilyDiversityRuleSchema as SchemaObject,
    sample: sampleModelFamilyDiversityRule,
  },
  {
    name: 'authority-flag',
    schema: roleAuthoritySchema as SchemaObject,
    sample: sampleRoleAuthority,
  },
  {
    name: 'serialization-point-ownership',
    schema: serializationPointOwnershipSchema as SchemaObject,
    sample: sampleSerializationPointOwnership,
  },
  {
    name: 'data-classification-eligibility',
    schema: dataClassificationEligibilitySchema as SchemaObject,
    sample: sampleDataClassificationEligibility,
  },
  {
    name: 'version-bump-record',
    schema: versionBumpRecordSchema as SchemaObject,
    sample: sampleVersionBumpRecord,
  },
]

test('negative-fixture coverage: exactly 6 object-typed schemas (the 2 primitive enum schemas are covered by parity.test.ts value negatives)', () => {
  assert.deepEqual(objectCases.map((c) => c.name).sort(), [
    'authority-flag',
    'data-classification-eligibility',
    'family-diversity',
    'role-identity',
    'serialization-point-ownership',
    'version-bump-record',
  ])
})

for (const { name, schema, sample } of objectCases) {
  test(`unknown keys refuse: ${name} rejects an unknown property (additionalProperties: false)`, () => {
    const validate = ajv.compile(schema)
    const instance = { ...sample, notAField: true }
    assert.equal(
      validate(instance),
      false,
      `${name} accepted an unknown key 'notAField' despite additionalProperties: false`,
    )
  })

  const required = (schema as { required?: unknown }).required
  assert.ok(Array.isArray(required), `${name}: object schema has no required array`)
  for (const field of required as readonly string[]) {
    test(`missing required fields refuse: ${name}.${field} is REJECTED when absent (derived from schema.required)`, () => {
      const validate = ajv.compile(schema)
      const copy = { ...sample } as Record<string, unknown>
      delete copy[field]
      assert.equal(
        validate(copy),
        false,
        `${name} missing required '${field}' validated instead of refusing`,
      )
    })
  }
}
