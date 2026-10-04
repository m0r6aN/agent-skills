/**
 * AC4: required-but-empty is enforceable, not decorative. Constructs a
 * valid `ResultEnvelope` with `changedSurfaces: []` (schema validation must
 * PASS) and a second instance that omits `changedSurfaces` entirely (schema
 * validation must FAIL) -- proving the absent-vs-empty distinction is
 * schema-enforced. Extended to the other required-but-empty arrays on both
 * envelopes so the same proof is not confined to the one field AC4 names.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Ajv, type SchemaObject } from 'ajv'
import { resultEnvelopeSchema } from '../src/result-envelope.js'
import { taskEnvelopeSchema } from '../src/task-envelope.js'
import { fullResultEnvelope, fullTaskEnvelope } from './fixtures.js'

const ajv = new Ajv({ allErrors: true })

function omit<T extends object>(obj: T, key: keyof T): Partial<T> {
  const copy = { ...obj }
  delete copy[key]
  return copy
}

test('AC4: ResultEnvelope with changedSurfaces: [] validates (empty is a legitimate claim)', () => {
  const validate = ajv.compile(resultEnvelopeSchema as SchemaObject)
  const instance = { ...fullResultEnvelope, changedSurfaces: [] }
  assert.ok(validate(instance), JSON.stringify(validate.errors))
})

test('AC4: ResultEnvelope missing changedSurfaces key is REJECTED (absent is a violation)', () => {
  const validate = ajv.compile(resultEnvelopeSchema as SchemaObject)
  const instance = omit(fullResultEnvelope, 'changedSurfaces')
  assert.equal(validate(instance), false)
  assert.ok(
    validate.errors?.some((e) => e.message?.includes("'changedSurfaces'")),
    JSON.stringify(validate.errors),
  )
})

const resultArrayFields = [
  'changedSurfaces',
  'commandsExecuted',
  'evidence',
] as const satisfies readonly (keyof typeof fullResultEnvelope)[]

for (const field of resultArrayFields) {
  test(`required-but-empty (result): ${field}: [] validates`, () => {
    const validate = ajv.compile(resultEnvelopeSchema as SchemaObject)
    assert.ok(validate({ ...fullResultEnvelope, [field]: [] }), JSON.stringify(validate.errors))
  })

  test(`required-but-empty (result): missing ${field} key is rejected`, () => {
    const validate = ajv.compile(resultEnvelopeSchema as SchemaObject)
    assert.equal(validate(omit(fullResultEnvelope, field)), false)
  })
}

const taskArrayFields = [
  'allowedFiles',
  'forbiddenSurfaces',
  'acceptanceCriteria',
  'evidenceRequirements',
] as const satisfies readonly (keyof typeof fullTaskEnvelope)[]

for (const field of taskArrayFields) {
  test(`required-but-empty (task): ${field}: [] validates`, () => {
    const validate = ajv.compile(taskEnvelopeSchema as SchemaObject)
    assert.ok(validate({ ...fullTaskEnvelope, [field]: [] }), JSON.stringify(validate.errors))
  })

  test(`required-but-empty (task): missing ${field} key is rejected`, () => {
    const validate = ajv.compile(taskEnvelopeSchema as SchemaObject)
    assert.equal(validate(omit(fullTaskEnvelope, field)), false)
  })
}

// Nested required-but-empty: requirements.{satisfied,unsatisfied,uncertain} and tests.{passed,failed,notRun}
const requirementsFields = ['satisfied', 'unsatisfied', 'uncertain'] as const
for (const field of requirementsFields) {
  test(`required-but-empty (result.requirements): ${field}: [] validates`, () => {
    const validate = ajv.compile(resultEnvelopeSchema as SchemaObject)
    const instance = {
      ...fullResultEnvelope,
      requirements: { ...fullResultEnvelope.requirements, [field]: [] },
    }
    assert.ok(validate(instance), JSON.stringify(validate.errors))
  })

  test(`required-but-empty (result.requirements): missing ${field} key is rejected`, () => {
    const validate = ajv.compile(resultEnvelopeSchema as SchemaObject)
    const requirements = omit(fullResultEnvelope.requirements, field)
    assert.equal(validate({ ...fullResultEnvelope, requirements }), false)
  })
}

const testsFields = ['passed', 'failed', 'notRun'] as const
for (const field of testsFields) {
  test(`required-but-empty (result.tests): ${field}: [] validates`, () => {
    const validate = ajv.compile(resultEnvelopeSchema as SchemaObject)
    const instance = { ...fullResultEnvelope, tests: { ...fullResultEnvelope.tests, [field]: [] } }
    assert.ok(validate(instance), JSON.stringify(validate.errors))
  })

  test(`required-but-empty (result.tests): missing ${field} key is rejected`, () => {
    const validate = ajv.compile(resultEnvelopeSchema as SchemaObject)
    const tests = omit(fullResultEnvelope.tests, field)
    assert.equal(validate({ ...fullResultEnvelope, tests }), false)
  })
}
