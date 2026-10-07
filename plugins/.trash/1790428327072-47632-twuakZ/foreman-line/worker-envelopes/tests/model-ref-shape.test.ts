/**
 * AC6: `modelRef` types as `string` (non-empty, registry-key shaped), never
 * a TypeScript union or enum of concrete model identifiers. Two checks:
 * (1) the compiled schema property for `modelRef` is a bare `{type:
 * 'string', minLength: 1}` shape with no `enum`/`const` restricting it to a
 * closed set; (2) a static source-text check that no pipe-delimited string
 * literal union (the shape a "tightened" enum would take) appears near the
 * `modelRef` declaration in `result-envelope.ts`.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { resultEnvelopeSchema } from '../src/result-envelope.js'

const here = dirname(fileURLToPath(import.meta.url))

test('AC6: modelRef schema property has no enum/const restricting it to a closed set', () => {
  const properties = resultEnvelopeSchema.properties as Record<string, Record<string, unknown>>
  const modelRefSchema = properties.modelRef
  assert.ok(modelRefSchema, 'modelRef property missing from resultEnvelopeSchema')
  assert.equal(modelRefSchema.type, 'string')
  assert.equal('enum' in modelRefSchema, false, 'modelRef must not carry an enum')
  assert.equal('const' in modelRefSchema, false, 'modelRef must not carry a const')
})

test('AC6: ResultEnvelope.modelRef is typed `string`, not a literal union, in source', () => {
  const source = readFileSync(join(here, '..', 'src', 'result-envelope.ts'), 'utf8')
  const modelRefDeclaration = source.match(/readonly modelRef:\s*([^\n]+)/)
  assert.ok(modelRefDeclaration, 'modelRef field declaration not found')
  const declaredType = (modelRefDeclaration as RegExpMatchArray)[1]?.trim()
  assert.equal(declaredType, 'string')
})
