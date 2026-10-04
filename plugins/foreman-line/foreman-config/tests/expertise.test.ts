/**
 * RCM D7 / OQ1: the closed `expertise` vocabulary lives here, is exactly the
 * eight ratified areas, and every area carries a written definition and at
 * least one routing consequence (OQ1: "an expertise with no distinct routing
 * consequence is a label, not a dimension").
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { EXPERTISE_AREAS, EXPERTISE_DEFINITIONS } from '../src/expertise.js'

test('the vocabulary is exactly the eight OQ1-ratified areas, closed and in order', () => {
  assert.deepEqual(
    [...EXPERTISE_AREAS],
    ['engineering', 'architecture', 'security', 'legal', 'finance', 'writing', 'research', 'data'],
  )
})

test('every area has exactly one definition entry, and no entry invents an area', () => {
  assert.equal(EXPERTISE_DEFINITIONS.length, EXPERTISE_AREAS.length)
  const seen = new Set<string>()
  for (const entry of EXPERTISE_DEFINITIONS) {
    assert.ok(!seen.has(entry.area), `duplicate definition for '${entry.area}'`)
    seen.add(entry.area)
  }
  assert.deepEqual([...seen].sort(), [...EXPERTISE_AREAS].sort())
})

test('each area carries a non-empty definition and a routing consequence that names narrowing semantics', () => {
  for (const entry of EXPERTISE_DEFINITIONS) {
    assert.ok(
      entry.definition.trim().length > 20,
      `${entry.area} definition is boilerplate-free prose`,
    )
    const consequence = entry.routing_consequence
    assert.ok(consequence.trim().length > 20, `${entry.area} routing consequence is empty`)
    assert.ok(
      consequence.includes('narrow'),
      `${entry.area} routing consequence must state its narrowing effect: ${consequence}`,
    )
  }
})

test('the vocabulary is frozen data — no routing consequence may claim widening or reordering authority', () => {
  for (const entry of EXPERTISE_DEFINITIONS) {
    assert.ok(
      !entry.routing_consequence.includes('widen'),
      `${entry.area} consequence claims widening (D3/D4 forbid it)`,
    )
    assert.ok(
      !entry.routing_consequence.includes('reorder a tier toward'),
      `${entry.area} consequence claims tier reordering (D3 forbids it)`,
    )
  }
})
