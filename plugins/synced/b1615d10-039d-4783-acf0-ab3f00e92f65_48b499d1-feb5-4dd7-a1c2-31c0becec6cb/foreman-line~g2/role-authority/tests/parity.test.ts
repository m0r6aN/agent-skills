/**
 * AC2: proves type<->schema parity and no drift for all eight enforceable
 * concepts, using `schema-scaffold`'s shared `registerNoDriftTests` helper
 * (no hand-rolled equivalent, per Constraints).
 *
 * The type<->schema **binding** itself is proven by the fully-populated
 * round-trip samples below (coordinator amendment, 2026-09-01 -- replaces
 * the struck `JSONSchemaType<T>` compile-error guarantee, see spec
 * Constraints). Every sample in `src/samples.ts` populates every field of
 * its interface, including every optional; because every schema sets
 * `additionalProperties: false`, a schema that drops a field of its own
 * interface rejects that sample and this test goes red. This is proven by
 * mutation, not merely asserted: see the completion report's "Round-trip
 * mutation proof" section for the paired failing/passing runs (a property
 * deleted from `roleIdentitySchema`, regenerated, watched fail, restored).
 */
import assert from 'node:assert/strict'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { Ajv, type SchemaObject } from 'ajv'
import { registerNoDriftTests } from '../../schema-scaffold/src/test-scaffold.js'
import {
  DATA_CLASSIFICATIONS,
  dataClassificationEligibilitySchema,
} from '../src/data-classification.js'
import { allSchemaFiles } from '../src/registry.js'
import {
  modelFamilyDiversityRuleSchema,
  riskClassSchema,
  roleAuthoritySchema,
  roleCategorySchema,
  roleIdentitySchema,
} from '../src/roles.js'
import {
  sampleDataClassificationEligibility,
  sampleModelFamilyDiversityRule,
  sampleRiskClass,
  sampleRoleAuthority,
  sampleRoleCategory,
  sampleRoleIdentity,
  sampleSerializationPointOwnership,
  sampleVersionBumpRecord,
} from '../src/samples.js'
import { serializationPointOwnershipSchema } from '../src/serialization-points.js'
import { versionBumpRecordSchema } from '../src/versioning.js'

const schemasDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'schemas')
const ajv = new Ajv({ allErrors: true })

registerNoDriftTests(allSchemaFiles, schemasDir)

test('every registered concept has a committed schema file: exactly 8', () => {
  assert.equal(allSchemaFiles.length, 8)
})

// --- AC2 round-trip proof: one fully-populated sample per schema ---------------

const roundTripCases: ReadonlyArray<{ name: string; schema: SchemaObject; sample: unknown }> = [
  { name: 'role-identity', schema: roleIdentitySchema as SchemaObject, sample: sampleRoleIdentity },
  { name: 'risk-class', schema: riskClassSchema as SchemaObject, sample: sampleRiskClass },
  { name: 'role-category', schema: roleCategorySchema as SchemaObject, sample: sampleRoleCategory },
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

test('AC2 round-trip: exactly one fully-populated sample per schema (8 of 8)', () => {
  assert.equal(roundTripCases.length, 8)
})

for (const { name, schema, sample } of roundTripCases) {
  test(`AC2 round-trip: fully-populated sample validates against its own schema: ${name}`, () => {
    const validate = ajv.compile(schema)
    assert.ok(validate(sample), `${name}: ${JSON.stringify(validate.errors)}`)
  })
}

test('role identity: sample validates', () => {
  const validate = ajv.compile(roleIdentitySchema as SchemaObject)
  assert.ok(
    validate({ role: 'judge', category: 'accept', registryKey: 'fable-5' }),
    JSON.stringify(validate.errors),
  )
  assert.ok(validate({ role: 'builder', category: 'build' }), JSON.stringify(validate.errors))
})

test('role identity: unknown role rejected', () => {
  const validate = ajv.compile(roleIdentitySchema as SchemaObject)
  assert.equal(validate({ role: 'not-a-role', category: 'build' }), false)
})

test('risk class: sample validates, unknown rejected', () => {
  const validate = ajv.compile(riskClassSchema as SchemaObject)
  assert.ok(validate('R2'), JSON.stringify(validate.errors))
  assert.equal(validate('R4'), false)
})

test('role category: D16 mutual exclusivity -- only one of four values', () => {
  const validate = ajv.compile(roleCategorySchema as SchemaObject)
  for (const category of ['build', 'verify', 'integrate', 'accept']) {
    assert.ok(validate(category), JSON.stringify(validate.errors))
  }
  assert.equal(validate('build+verify'), false)
})

test('family diversity: sample validates, zero-minimum rejected', () => {
  const validate = ajv.compile(modelFamilyDiversityRuleSchema as SchemaObject)
  assert.ok(
    validate({ riskClass: 'R3', minDistinctModelFamilies: 2 }),
    JSON.stringify(validate.errors),
  )
  assert.equal(validate({ riskClass: 'R3', minDistinctModelFamilies: 0 }), false)
})

test('authority flag: D20 sample validates', () => {
  const validate = ajv.compile(roleAuthoritySchema as SchemaObject)
  assert.ok(
    validate({
      role: 'builder',
      canSelfPromote: false,
      canSelfApprove: false,
      canCloseCriticalWork: false,
    }),
    JSON.stringify(validate.errors),
  )
})

test('authority flag: missing field rejected', () => {
  const validate = ajv.compile(roleAuthoritySchema as SchemaObject)
  assert.equal(validate({ role: 'builder', canSelfPromote: false }), false)
})

test('serialization point ownership: sole vs shared', () => {
  const validate = ajv.compile(serializationPointOwnershipSchema as SchemaObject)
  assert.ok(
    validate({
      path: 'plugins/foreman-line/role-authority/**',
      owner: 'WF-P1',
      extensionPolicy: 'sole',
    }),
    JSON.stringify(validate.errors),
  )
  assert.ok(
    validate({
      path: 'plugins/foreman-line/role-authority/**',
      owner: 'WF-P1',
      extensionPolicy: 'shared',
      authorizedExtenders: ['WF-P2'],
    }),
    JSON.stringify(validate.errors),
  )
})

test('serialization point ownership: invalid extensionPolicy rejected', () => {
  const validate = ajv.compile(serializationPointOwnershipSchema as SchemaObject)
  assert.equal(validate({ path: 'x', owner: 'WF-P1', extensionPolicy: 'anyone' }), false)
})

test('data classification eligibility: all three taxonomy values validate', () => {
  const validate = ajv.compile(dataClassificationEligibilitySchema as SchemaObject)
  for (const classification of DATA_CLASSIFICATIONS) {
    assert.ok(validate({ scope: 'builder', classification }), JSON.stringify(validate.errors))
  }
})

test('data classification eligibility: unknown classification rejected', () => {
  const validate = ajv.compile(dataClassificationEligibilitySchema as SchemaObject)
  assert.equal(validate({ scope: 'builder', classification: 'secret' }), false)
})

test('version bump record: major bump with flagged parcels validates', () => {
  const validate = ajv.compile(versionBumpRecordSchema as SchemaObject)
  assert.ok(
    validate({
      version: 'role-authority.kaseya/v2',
      bumpType: 'major',
      date: '2026-09-01',
      flaggedParcels: ['WF-P2', 'WF-P3'],
    }),
    JSON.stringify(validate.errors),
  )
})

test('version bump record: bad date format rejected', () => {
  const validate = ajv.compile(versionBumpRecordSchema as SchemaObject)
  assert.equal(
    validate({
      version: 'role-authority.kaseya/v1',
      bumpType: 'minor',
      date: '09/01/2026',
      flaggedParcels: [],
    }),
    false,
  )
})
