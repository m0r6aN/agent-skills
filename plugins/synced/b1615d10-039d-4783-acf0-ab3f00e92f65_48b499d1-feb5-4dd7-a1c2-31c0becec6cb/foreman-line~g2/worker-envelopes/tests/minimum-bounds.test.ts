/**
 * AC2 (coordinator amendment, 2026-09-01): every numeric field in `Budget`
 * and `UsageMetadata` carries `minimum: 0`. Each bound ships with a reject
 * twin: a fixture supplying `-1` must be refused by the validator, and that
 * refusal is watched here, not assumed.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Ajv, type SchemaObject } from 'ajv'
import { resultEnvelopeSchema } from '../src/result-envelope.js'
import { taskEnvelopeSchema } from '../src/task-envelope.js'
import { fullResultEnvelope, fullTaskEnvelope } from './fixtures.js'

const ajv = new Ajv({ allErrors: true })

test('sanity: fullTaskEnvelope (all-positive budget) validates', () => {
  const validate = ajv.compile(taskEnvelopeSchema as SchemaObject)
  assert.ok(validate(fullTaskEnvelope), JSON.stringify(validate.errors))
})

test('sanity: fullResultEnvelope (all-positive usage) validates', () => {
  const validate = ajv.compile(resultEnvelopeSchema as SchemaObject)
  assert.ok(validate(fullResultEnvelope), JSON.stringify(validate.errors))
})

const budgetFields = [
  'maxInputTokens',
  'maxOutputTokens',
  'maxWallTimeSeconds',
  'maxCostUsd',
  'maxParallelChildren',
] as const satisfies readonly (keyof typeof fullTaskEnvelope.budget)[]

for (const field of budgetFields) {
  test(`AC2: Budget.${field} = -1 is REJECTED (minimum: 0)`, () => {
    const validate = ajv.compile(taskEnvelopeSchema as SchemaObject)
    const instance = { ...fullTaskEnvelope, budget: { ...fullTaskEnvelope.budget, [field]: -1 } }
    assert.equal(validate(instance), false)
    assert.ok(
      validate.errors?.some((e) => e.keyword === 'minimum'),
      JSON.stringify(validate.errors),
    )
  })
}

const usageFields = [
  'inputTokens',
  'outputTokens',
  'wallTimeMs',
  'estimatedCostUsd',
] as const satisfies readonly (keyof typeof fullResultEnvelope.usage)[]

for (const field of usageFields) {
  test(`AC2: UsageMetadata.${field} = -1 is REJECTED (minimum: 0)`, () => {
    const validate = ajv.compile(resultEnvelopeSchema as SchemaObject)
    const instance = { ...fullResultEnvelope, usage: { ...fullResultEnvelope.usage, [field]: -1 } }
    assert.equal(validate(instance), false)
    assert.ok(
      validate.errors?.some((e) => e.keyword === 'minimum'),
      JSON.stringify(validate.errors),
    )
  })
}

test('AC2 count: exactly 9 minimum-bound numeric fields covered (5 Budget + 4 UsageMetadata)', () => {
  assert.equal(budgetFields.length + usageFields.length, 9)
})
