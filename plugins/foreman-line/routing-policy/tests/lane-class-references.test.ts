/**
 * ROPT-P1 — lane -> class referential-integrity advisories.
 *
 * The advisory names every dispatchable lane whose `routing_classes` reach a
 * class with no `classes` entry (no allowlist, no ceiling_usd). It is not a
 * `validatePolicy` invariant yet: closing the gap needs owner-set ceilings,
 * so the shipped v0.4 policy stays valid while the gap is named. These tests
 * pin that contract: the advisory set is exact, disabled-refused lanes are
 * exempt, validity and the CLI exit-code contract are unmoved.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'
import {
  LANE_CLASS_UNDEFINED,
  laneClassReferenceAdvisories,
  validatePolicy,
} from '../src/validator.js'

const here = dirname(fileURLToPath(import.meta.url))
const policyPath = join(here, '..', 'routing-policy.yaml')

function loadYaml(path: string): unknown {
  return parse(readFileSync(path, 'utf8'))
}

const validPolicy = loadYaml(policyPath)

// a. The shipped policy: valid, and the advisory set names exactly the
//    known gaps — no more (no noise), no less (no silent gap). -------------

test('shipped policy remains valid under the advisory surface', () => {
  assert.equal(validatePolicy(validPolicy).valid, true)
})

test('shipped policy yields exactly the two known lane->class gaps', () => {
  const advisories = laneClassReferenceAdvisories(validPolicy)
  assert.equal(advisories.length, 2, advisories.join('\n'))
  assert.ok(
    advisories.some((a) => a.includes('lane_map.L2') && a.includes("'review/security'")),
    `expected the L2 review/security gap, got: ${advisories.join('\n')}`,
  )
  assert.ok(
    advisories.some((a) => a.includes('lane_map.L3') && a.includes("'implementation/complex'")),
    `expected the L3 implementation/complex gap, got: ${advisories.join('\n')}`,
  )
  for (const advisory of advisories) {
    assert.ok(advisory.includes(LANE_CLASS_UNDEFINED), advisory)
    assert.ok(advisory.startsWith('lane_map.'), advisory)
  }
})

test('disabled-refused L6 is exempt: routing/classification is not reported', () => {
  const advisories = laneClassReferenceAdvisories(validPolicy)
  assert.ok(
    !advisories.some((a) => a.includes("'routing/classification'")),
    `L6 cannot dispatch; its undefined class bounds nothing: ${advisories.join('\n')}`,
  )
})

// b. Behavioral pins on synthetic documents. --------------------------------

function docWithLane(laneEntry: Record<string, unknown>): Record<string, unknown> {
  return {
    classes: { 'standard-feature': { allowlist: ['standard'], ceiling_usd: 5 } },
    lane_map: { L1: laneEntry },
  }
}

test('a dispatchable lane referencing an undefined class is named', () => {
  const advisories = laneClassReferenceAdvisories(
    docWithLane({ routing_classes: ['standard-feature', 'implementation/complex'] }),
  )
  assert.equal(advisories.length, 1)
  const [first] = advisories
  assert.ok(first !== undefined)
  assert.ok(first.includes('lane_map.L1'))
  assert.ok(first.includes("'implementation/complex'"))
})

test('a lane whose classes are all defined yields no advisory', () => {
  const advisories = laneClassReferenceAdvisories(
    docWithLane({ routing_classes: ['standard-feature'] }),
  )
  assert.deepEqual(advisories, [])
})

test('a disabled-refused lane referencing an undefined class yields no advisory', () => {
  const advisories = laneClassReferenceAdvisories(
    docWithLane({ status: 'disabled-refused', routing_classes: ['implementation/complex'] }),
  )
  assert.deepEqual(advisories, [])
})

test('advisories are deterministic (sorted) across lane declaration order', () => {
  const doc = {
    classes: {},
    lane_map: {
      L5: { routing_classes: ['z-class'] },
      L1: { routing_classes: ['a-class'] },
    },
  }
  const advisories = laneClassReferenceAdvisories(doc)
  assert.deepEqual(advisories, [...advisories].sort())
  assert.equal(advisories.length, 2)
})

test('malformed documents advise nothing instead of throwing', () => {
  assert.deepEqual(laneClassReferenceAdvisories(null), [])
  assert.deepEqual(laneClassReferenceAdvisories('not-a-doc'), [])
  assert.deepEqual(laneClassReferenceAdvisories({ lane_map: 'oops', classes: {} }), [])
  assert.deepEqual(laneClassReferenceAdvisories({ lane_map: {}, classes: null }), [])
  assert.deepEqual(laneClassReferenceAdvisories({ lane_map: { L1: 'oops' }, classes: {} }), [])
})

// c. The advisory never flips validity: the same document is a hard refusal
//    only through the existing invariants, never through this surface. ------

test('advisory-bearing documents still pass validatePolicy when otherwise valid', () => {
  // Minimal structurally-invalid document proving the surfaces are disjoint:
  // validatePolicy reports schema errors; the advisory adds nothing to them.
  const result = validatePolicy({ lane_map: {}, classes: {} })
  assert.equal(result.valid, false)
  assert.ok(
    !result.errors.some((e) => e.includes(LANE_CLASS_UNDEFINED)),
    'LANE_CLASS_UNDEFINED must never appear in validatePolicy errors',
  )
})
