/**
 * AC2: proves type<->schema parity and no drift.
 *  - Every committed `schemas/*.json` is byte-identical to what the typed source
 *    serializes to (drift is impossible without a failing test).
 *  - Every canonical sample (typed against `types.ts`) validates against its schema.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { Ajv, type SchemaObject } from 'ajv'
import {
  registerNoDriftTests,
  registerSampleValidationTests,
} from '../../schema-scaffold/src/test-scaffold.js'
import { type ProviderBindingPolicyV1, validateProviderBindingPolicyV1 } from '../src/index.js'
import { allSchemaFiles } from '../src/registry.js'
import { shadowRouteSchema } from '../src/schemas.js'
import {
  sampleClassEntry,
  sampleDataClassificationRule,
  sampleLaneEntry,
  sampleLaneRoute,
  sampleLogicalCandidate,
  sampleModelBinding,
  samplePiOpenRouterRouting,
  sampleRoutingPolicy,
  sampleShadowRoute,
  sampleStrictTransport,
} from '../src/testing.js'
import type { ShadowRoute } from '../src/types.js'

const schemasDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'schemas')
const pmcResult = validateProviderBindingPolicyV1(
  JSON.parse(
    readFileSync(
      new URL('./fixtures/pmc-provider-binding-policy-v1.json', import.meta.url),
      'utf8',
    ),
  ),
)
assert.equal(pmcResult.valid, true)
if (!pmcResult.valid) throw new Error('Invalid PMC parity sample')
const sampleProviderBindingPolicy: ProviderBindingPolicyV1 = pmcResult.value

const samplesByName: ReadonlyMap<string, unknown> = new Map<string, unknown>([
  ['routing-policy', sampleRoutingPolicy],
  ['class-entry', sampleClassEntry],
  ['data-classification-rule', sampleDataClassificationRule],
  ['transport-requirements', sampleStrictTransport],
  ['shadow-route', sampleShadowRoute],
  ['pi-openrouter-routing', samplePiOpenRouterRouting],
  ['lane-entry', sampleLaneEntry],
  ['model-binding', sampleModelBinding],
  ['logical-candidate', sampleLogicalCandidate],
  ['lane-route', sampleLaneRoute],
  ['provider-binding-policy-v1', sampleProviderBindingPolicy],
])

registerNoDriftTests(allSchemaFiles, schemasDir)
registerSampleValidationTests(allSchemaFiles, samplesByName)

test('every exported routing-policy type has a committed schema file', () => {
  // CUTOVER-P4: `role-assignment` is retired with its subject (`roles`); the
  // ordered source is embedded in `routing-policy.schema.json`, not a
  // standalone schema file. Union with origin/dev's `provider-binding-policy-v1`
  // entry: the registry holds 10 + 1 = 11 schemas.
  assert.equal(allSchemaFiles.length, 11)
})

test('shadow prohibited_roles type and schema accept either exact role order', () => {
  const validate = new Ajv({ allErrors: true }).compile(shadowRouteSchema as SchemaObject)
  const reverseOrder: ShadowRoute = {
    ...sampleShadowRoute,
    prohibited_roles: ['verifier', 'coordinator'],
  }

  assert.equal(validate(sampleShadowRoute), true, JSON.stringify(validate.errors))
  assert.equal(validate(reverseOrder), true, JSON.stringify(validate.errors))
})

test('shadow prohibited_roles schema rejects missing or duplicate roles', () => {
  const validate = new Ajv({ allErrors: true }).compile(shadowRouteSchema as SchemaObject)

  assert.equal(validate({ ...sampleShadowRoute, prohibited_roles: ['coordinator'] }), false)
  assert.equal(
    validate({ ...sampleShadowRoute, prohibited_roles: ['coordinator', 'coordinator'] }),
    false,
  )
})
