/**
 * AC2: proves the two committed schema files never drift from their typed
 * sources, using `schema-scaffold`'s shared `registerNoDriftTests` helper
 * (no hand-rolled equivalent, per Constraints).
 */

import assert from 'node:assert/strict'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { registerNoDriftTests } from '../../schema-scaffold/src/test-scaffold.js'
import { allSchemaFiles } from '../src/registry.js'

const schemasDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'schemas')

registerNoDriftTests(allSchemaFiles, schemasDir)

test('exactly two top-level envelope schema files (WF-P2: one parcel, two schema pairs)', () => {
  assert.equal(allSchemaFiles.length, 2)
  assert.deepEqual(allSchemaFiles.map((f) => f.name).sort(), ['result', 'task'])
})
