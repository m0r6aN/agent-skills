/**
 * Vocabulary lockstep: routing-policy restates the closed `expertise`
 * vocabulary from its owner (`foreman-config/src/expertise.ts`, RCM D7). The
 * restatement exists so this package stays dependency-free at runtime; this
 * test is what keeps the two from ever drifting.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { EXPERTISE_AREAS as OWNER_EXPERTISE_AREAS } from '../../foreman-config/src/expertise.js'
import { EXPERTISE_AREAS } from '../src/types.js'

test('the routing-policy expertise vocabulary equals its foreman-config owner exactly', () => {
  assert.deepEqual([...EXPERTISE_AREAS], [...OWNER_EXPERTISE_AREAS])
})
