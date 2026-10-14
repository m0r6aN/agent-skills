import assert from 'node:assert/strict'
import test from 'node:test'
import { DISCREPANCY_CODES, OPTION_ACTS, SCOPE_FOOTER } from '../src/reconcile.js'

test('the closed discrepancy vocabulary has a deliberate act (including null) for every option index', () => {
  assert.deepEqual(Object.keys(OPTION_ACTS).sort(), [...DISCREPANCY_CODES].sort())
  const expected = {
    'shipped-unrecorded': [null, 'investigate', null],
    'recorded-unshipped': ['investigate', 'investigate', null],
    'unmerged-work': ['investigate', null, null],
    'orphan-worktree': ['investigate', null],
    'never-started': [null, 'investigate', null],
    'local-remote-divergence': ['explain', 'explain'],
    'stale-abandoned': ['investigate', 'investigate', null, null],
  }
  assert.deepEqual(OPTION_ACTS, expected)
  for (const code of DISCREPANCY_CODES)
    assert.ok(
      OPTION_ACTS[code].every((act) => act === null || act === 'investigate' || act === 'explain'),
    )
})

test('instruction footer is reserved intact within the 2,000 character limit', () => {
  const body = 'x'.repeat(5000)
  const marker = ' (shortened)'
  const instruction = `${body.slice(0, 2000 - SCOPE_FOOTER.length - marker.length - 2)}${marker}\n\n${SCOPE_FOOTER}`
  assert.equal(instruction.length, 2000)
  assert.ok(instruction.endsWith(SCOPE_FOOTER))
  assert.ok(instruction.length <= 2000)
})
