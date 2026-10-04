/**
 * Proves type<->schema parity and no drift:
 *  - Every committed `schemas/*.json` is byte-identical to what the typed
 *    source serializes to (drift is impossible without a failing test).
 *  - Every canonical sample (typed against `types.ts`) validates against its
 *    schema.
 */
import assert from 'node:assert/strict'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  registerNoDriftTests,
  registerSampleValidationTests,
} from '../../schema-scaffold/src/test-scaffold.js'
import { allSchemaFiles } from '../src/registry.js'
import {
  sampleCapabilities,
  sampleForemanConfig,
  sampleIdentity,
  sampleLayout,
  samplePolicy,
  sampleStack,
} from '../src/testing.js'

const schemasDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'schemas')

const samplesByName: ReadonlyMap<string, unknown> = new Map<string, unknown>([
  ['foreman-config', sampleForemanConfig],
  ['foreman-identity', sampleIdentity],
  ['foreman-stack', sampleStack],
  ['stack-layout', sampleLayout],
  ['foreman-capabilities', sampleCapabilities],
  ['foreman-policy', samplePolicy],
])

registerNoDriftTests(allSchemaFiles, schemasDir)
registerSampleValidationTests(allSchemaFiles, samplesByName)

test('every exported foreman-config schema has a committed schema file', () => {
  assert.equal(allSchemaFiles.length, 6)
})
