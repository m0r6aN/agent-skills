/**
 * AC3 + AC4: the shipped `routing-policy.yaml` validates against
 * `routing-policy.schema.json` with zero errors, and contains all four
 * reconciled class values.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'
import { validatePolicy } from '../src/validator.js'

const policyPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'routing-policy.yaml')

test('shipped routing-policy.yaml validates with zero errors', () => {
  const doc = parse(readFileSync(policyPath, 'utf8'))
  const result = validatePolicy(doc)
  assert.deepEqual(result.errors, [])
  assert.equal(result.valid, true)
})

test('shipped routing-policy.yaml contains all four reconciled classes', () => {
  const doc = parse(readFileSync(policyPath, 'utf8')) as { classes: Record<string, unknown> }
  assert.deepEqual(
    Object.keys(doc.classes).sort(),
    ['architecture/risk', 'boilerplate', 'implementation/standard', 'standard-feature'].sort(),
  )
})

test('shipped routing-policy.yaml pins the coordinator and verifier lanes to frontier (D4, re-anchored)', () => {
  // CUTOVER-P4: the structural D4 pin lived in the removed `roles` block; the
  // frozen role/lane/authority map carries it now (lane_map.L1/L2).
  const doc = parse(readFileSync(policyPath, 'utf8')) as {
    lane_map: Record<string, { role_family: string; frontier_only: boolean }>
  }
  assert.equal(doc.lane_map.L1?.role_family, 'coordinator')
  assert.equal(doc.lane_map.L1?.frontier_only, true)
  assert.equal(doc.lane_map.L2?.role_family, 'verifier')
  assert.equal(doc.lane_map.L2?.frontier_only, true)
})

test('shipped routing-policy.yaml every class entry has a positive ceiling_usd', () => {
  const doc = parse(readFileSync(policyPath, 'utf8')) as {
    classes: Record<string, { ceiling_usd: number }>
  }
  for (const [name, entry] of Object.entries(doc.classes)) {
    assert.ok(entry.ceiling_usd > 0, `classes['${name}'].ceiling_usd must be > 0`)
  }
})
