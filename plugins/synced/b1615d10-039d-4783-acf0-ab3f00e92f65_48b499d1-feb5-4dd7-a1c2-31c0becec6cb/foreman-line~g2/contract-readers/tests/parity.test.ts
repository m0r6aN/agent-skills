/**
 * Constraint 6/AC6: proves type<->schema parity and no drift between the
 * committed `schemas/contract-reader-entry.schema.json` and what
 * `generate.ts` would (re)produce from the typed source — following the
 * established `contracts/`/`spec-linter` pattern (generated schema + parity
 * test; a hand-edited generated schema drifting from its typed source is the
 * defect this pattern exists to prevent).
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { Ajv, type SchemaObject } from 'ajv'
import { registerNoDriftTests } from '../../schema-scaffold/src/test-scaffold.js'
import { allSchemaFiles } from '../src/generate.js'
import { contractReaderEntrySchema } from '../src/schema.js'

const here = dirname(fileURLToPath(import.meta.url))
const schemasDir = join(here, '..', 'schemas')
const ajv = new Ajv({ allErrors: true })

registerNoDriftTests(allSchemaFiles, schemasDir)

test('canonical sample validates against the contract-reader-entry schema', () => {
  const sample = JSON.parse(
    readFileSync(join(here, 'fixtures', 'valid-string-reader.json'), 'utf8'),
  )
  const validate = ajv.compile(contractReaderEntrySchema as SchemaObject)
  assert.ok(validate(sample), JSON.stringify(validate.errors))
})

test('exactly one schema file is registered', () => {
  assert.equal(allSchemaFiles.length, 1)
})
