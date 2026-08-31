import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'
import { serialize } from '../../schema-scaffold/src/generate.js'
import AjvModule, { type Ajv as AjvType } from '../node_modules/ajv/dist/ajv.js'
import { allSchemaFiles } from '../src/registry.js'
import type { AuthorityEnforcementRegistry } from '../src/types.js'

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const Ajv = AjvModule as unknown as typeof AjvType

test('committed draft-07 schema is byte-identical to the hand-authored schema source', () => {
  const schemaFile = allSchemaFiles[0]
  assert.ok(schemaFile)
  assert.equal(
    readFileSync(join(packageRoot, 'schemas', `${schemaFile.name}.schema.json`), 'utf8'),
    serialize(schemaFile.schema),
  )
})

test('typed canonical sample validates against the hand-authored schema', () => {
  const sample: AuthorityEnforcementRegistry = parse(
    readFileSync(join(packageRoot, 'tests', 'fixtures', 'pass-minimal.yaml'), 'utf8'),
  ) as AuthorityEnforcementRegistry
  const schema = allSchemaFiles[0]?.schema
  assert.ok(schema)
  const validate = new Ajv({ allErrors: true }).compile(schema)
  assert.equal(validate(sample), true, JSON.stringify(validate.errors, null, 2))
})

test('closed schema rejects unknown nested properties', () => {
  const sample = parse(
    readFileSync(join(packageRoot, 'tests', 'fixtures', 'pass-minimal.yaml'), 'utf8'),
  ) as AuthorityEnforcementRegistry & { unexpected?: boolean }
  sample.unexpected = true
  const schema = allSchemaFiles[0]?.schema
  assert.ok(schema)
  const validate = new Ajv({ allErrors: true }).compile(schema)
  assert.equal(validate(sample), false)
})
