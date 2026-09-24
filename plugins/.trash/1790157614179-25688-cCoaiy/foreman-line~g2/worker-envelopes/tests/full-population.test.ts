/**
 * Substitute guarantee for the compile-time type<->schema binding claim.
 *
 * The WF-P2 spec's AC2 text asks for ajv `JSONSchemaType<T>` literals "so a
 * type/schema mismatch is a compile error." An adversarial reviewer on the
 * sibling WF-P1 parcel proved that claim does not hold anywhere in this
 * ecosystem: `contracts/src` (the cited precedent) uses untyped
 * `SchemaObject` throughout, contains zero uses of `JSONSchemaType`, and a
 * property deleted from a schema there still passes `tsc` and every test.
 * `role-authority/src` (WF-P1) is the same. This package follows that same
 * `SchemaObject` pattern for consistency with every sibling -- `ajv`'s
 * `JSONSchemaType<T>` does not genuinely bind against these hand-authored
 * schema literals in this codebase, and this package does not claim that it
 * does.
 *
 * The substitute protection (coordinator ruling, 2026-09-01): a canonical
 * sample of every type with EVERY field populated, including optionals
 * (`tests/fixtures.ts`), validated against its schema with
 * `additionalProperties: false` in force. If a property is dropped from a
 * schema (or renamed, or its type narrowed incompatibly with the fixture),
 * the fully-populated fixture stops validating and this test goes red --
 * proven below by the mutation-and-watch-it-fail demonstration recorded in
 * the completion report (a property was deleted from a schema, `tsc`
 * stayed green, and this test failed).
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Ajv, type SchemaObject } from 'ajv'
import { resultEnvelopeSchema } from '../src/result-envelope.js'
import { taskEnvelopeSchema } from '../src/task-envelope.js'
import { fullResultEnvelope, fullTaskEnvelope } from './fixtures.js'

const ajv = new Ajv({ allErrors: true })

test('full-population: fully-populated TaskEnvelope (every field, including optionals) validates', () => {
  const validate = ajv.compile(taskEnvelopeSchema as SchemaObject)
  assert.ok(validate(fullTaskEnvelope), JSON.stringify(validate.errors))
  // Confirms the fixture itself is genuinely "full": every optional key present.
  const optionalTaskKeys = [
    'parentTaskId',
    'requiredCapabilities',
    'requiredModality',
    'allowedTools',
    'inputRefs',
    'verificationPlan',
  ] as const
  for (const key of optionalTaskKeys) {
    assert.ok(
      key in fullTaskEnvelope,
      `fixture is not fully populated: missing optional key '${key}'`,
    )
  }
})

test('full-population: fully-populated ResultEnvelope (every field, including optionals) validates', () => {
  const validate = ajv.compile(resultEnvelopeSchema as SchemaObject)
  assert.ok(validate(fullResultEnvelope), JSON.stringify(validate.errors))
  const optionalResultKeys = ['uncertainties', 'confidenceSignal', 'recommendedEscalation'] as const
  for (const key of optionalResultKeys) {
    assert.ok(
      key in fullResultEnvelope,
      `fixture is not fully populated: missing optional key '${key}'`,
    )
  }
})
