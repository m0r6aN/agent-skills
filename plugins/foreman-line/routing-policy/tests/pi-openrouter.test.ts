import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { Ajv, type SchemaObject } from 'ajv'
import {
  PI_OPENROUTER_ROUTING,
  piOpenRouterRoutingSchema,
  validatePiOpenRouterRouting,
} from '../src/pi-openrouter.js'

const here = dirname(fileURLToPath(import.meta.url))
const templatePath = join(here, '..', '..', 'templates', 'pi-openrouter-routing.json')

function loadTemplate(): Record<string, unknown> {
  return JSON.parse(readFileSync(templatePath, 'utf8')) as Record<string, unknown>
}

test('Pi/OpenRouter template is schema-valid and contains no credential fields', () => {
  const template = loadTemplate()
  const valid = new Ajv({ allErrors: true }).compile(piOpenRouterRoutingSchema as SchemaObject)
  assert.equal(valid(template), true, JSON.stringify(valid.errors))
  assert.equal('apiKey' in template, false)
  assert.equal('credentials' in template, false)
})

test('Pi/OpenRouter template matches the typed routing registry', () => {
  const { $schema: _schema, ...templateWithoutSchema } = loadTemplate()
  assert.deepEqual(templateWithoutSchema, PI_OPENROUTER_ROUTING)
})

test('Pi/OpenRouter template passes cross-field capability validation', () => {
  const result = validatePiOpenRouterRouting(loadTemplate())
  assert.equal(result.valid, true, JSON.stringify(result.errors))
})

test('Jev capability contract rejects control-plane or prose/implementation use', () => {
  const invalid = structuredClone(loadTemplate()) as {
    models: Record<string, Record<string, unknown>>
  }
  const jev = invalid.models['typesafe/jev-1.13']
  assert.ok(jev)
  jev.authority = 'execution'
  jev.allowedLanes = ['implementation']
  jev.prohibitedLanes = ['approval']

  const result = validatePiOpenRouterRouting(invalid)
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((error) => error.includes('recommend-only')))
  assert.ok(result.errors.some((error) => error.includes('routing/classification only')))
  assert.ok(result.errors.some((error) => error.includes("prohibit 'merge'")))
  assert.notDeepEqual(invalid, PI_OPENROUTER_ROUTING)
})
