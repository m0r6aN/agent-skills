import assert from 'node:assert/strict'
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import {
  addFleetRoot,
  createFleetState,
  describeRoot,
  type FleetProbe,
  type FleetRefusalError,
  loadFleetState,
  removeFleetRoot,
  saveFleetState,
} from '../src/fleet.js'

/**
 * FCA-P2 fleet registry: declared, ordered, deduplicated absolute roots with a
 * frozen primary; typed refusals (D1-style) leave the registry unchanged;
 * persistence follows the console-local state-file conventions
 * (`state/fleet.json`, schema `foc-fleet/v1`) with corrupt state refused typed.
 */

const PRIMARY = '/repos/agent-skills'
const EXTRA = '/repos/other-project'
const THIRD = '/repos/third-project'

/** Deterministic probe: everything exists and is a git work tree unless set. */
function fakeProbe(overrides: Partial<FleetProbe> = {}): FleetProbe {
  return {
    exists: () => true,
    isGitWorkTree: () => true,
    git: () => 'https://example.invalid/repo.git',
    ...overrides,
  }
}

function refusalOf(fn: () => unknown): FleetRefusalError {
  try {
    fn()
  } catch (error) {
    return error as FleetRefusalError
  }
  throw new Error('expected a typed fleet refusal')
}

test('createFleetState seeds the primary root and refuses relative roots', () => {
  const state = createFleetState(PRIMARY, fakeProbe())
  assert.deepEqual(state.roots, [PRIMARY])
  assert.equal(
    refusalOf(() => createFleetState('relative/path', fakeProbe())).reason,
    'root-not-absolute',
  )
  assert.equal(
    refusalOf(() => createFleetState(PRIMARY, fakeProbe({ exists: () => false }))).reason,
    'root-absent',
  )
})

test('addFleetRoot appends in order and is idempotent-safe (duplicate refused)', () => {
  const state = createFleetState(PRIMARY, fakeProbe())
  const after = addFleetRoot(state, EXTRA, fakeProbe())
  assert.deepEqual(after.roots, [PRIMARY, EXTRA])
  const third = addFleetRoot(after, THIRD, fakeProbe())
  assert.deepEqual(third.roots, [PRIMARY, EXTRA, THIRD])
  assert.deepEqual(after.roots, [PRIMARY, EXTRA], 'prior state objects are never mutated')
  const reason = refusalOf(() => addFleetRoot(third, EXTRA, fakeProbe())).reason
  assert.equal(reason, 'duplicate-root')
})

test('addFleetRoot typed refusals: relative, absent, non-git — registry unchanged', () => {
  const state = createFleetState(PRIMARY, fakeProbe())
  assert.equal(
    refusalOf(() => addFleetRoot(state, 'rel/ative', fakeProbe())).reason,
    'root-not-absolute',
  )
  assert.equal(
    refusalOf(() => addFleetRoot(state, EXTRA, fakeProbe({ exists: () => false }))).reason,
    'root-absent',
  )
  assert.equal(
    refusalOf(() => addFleetRoot(state, EXTRA, fakeProbe({ isGitWorkTree: () => false }))).reason,
    'not-a-git-work-tree',
  )
  assert.deepEqual(state.roots, [PRIMARY], 'every refusal leaves the registry unchanged')
})

test('removeFleetRoot removes extras; the primary is immutable', () => {
  const state = createFleetState(PRIMARY, fakeProbe())
  const withExtra = addFleetRoot(state, EXTRA, fakeProbe())
  assert.deepEqual(removeFleetRoot(withExtra, EXTRA).roots, [PRIMARY])
  assert.equal(
    refusalOf(() => removeFleetRoot(withExtra, PRIMARY)).reason,
    'root-primary-immutable',
  )
  assert.equal(refusalOf(() => removeFleetRoot(withExtra, THIRD)).reason, 'root-unknown')
})

test('describeRoot derives identity + liveness from the probe', () => {
  const probe = fakeProbe({
    git: (_root, args) => {
      if (args.includes('get-url')) return 'https://example.invalid/x.git'
      if (args.includes('--abbrev-ref')) return 'origin/main'
      return 'abc1234'
    },
  })
  const ready = describeRoot(PRIMARY, probe)
  assert.equal(ready.liveness, 'ready')
  assert.deepEqual(ready.identity, {
    remote: 'https://example.invalid/x.git',
    defaultBranch: 'main',
    head: 'abc1234',
  })

  const absent = describeRoot(PRIMARY, fakeProbe({ exists: () => false }))
  assert.equal(absent.liveness, 'absent')
  assert.equal(absent.identity, null)

  const invalid = describeRoot(PRIMARY, fakeProbe({ isGitWorkTree: () => false }))
  assert.equal(invalid.liveness, 'invalid')
  assert.equal(invalid.identity, null)
})

test('save/load round-trips through the state-file guard', () => {
  const stateDir = mkdtempSync(join(tmpdir(), 'fleet-state-'))
  const state = addFleetRoot(createFleetState(PRIMARY, fakeProbe()), EXTRA, fakeProbe())
  saveFleetState(stateDir, state)
  const raw = JSON.parse(readFileSync(join(stateDir, 'fleet.json'), 'utf8')) as { schema: string }
  assert.equal(raw.schema, 'foc-fleet/v1')
  assert.deepEqual(loadFleetState(stateDir, PRIMARY), state)
})

test('loadFleetState: absent file seeds the primary; corrupt state refused typed', () => {
  const stateDir = mkdtempSync(join(tmpdir(), 'fleet-state-'))
  assert.deepEqual(loadFleetState(stateDir, PRIMARY).roots, [PRIMARY])

  writeFileSync(join(stateDir, 'fleet.json'), '{not json')
  assert.equal(refusalOf(() => loadFleetState(stateDir, PRIMARY)).reason, 'fleet-state-corrupt')

  writeFileSync(join(stateDir, 'fleet.json'), JSON.stringify({ schema: 'other/v9', roots: [] }))
  assert.equal(refusalOf(() => loadFleetState(stateDir, PRIMARY)).reason, 'fleet-state-corrupt')

  writeFileSync(
    join(stateDir, 'fleet.json'),
    JSON.stringify({ schema: 'foc-fleet/v1', roots: ['/x'] }),
  )
  assert.equal(
    refusalOf(() => loadFleetState(stateDir, PRIMARY)).reason,
    'fleet-state-corrupt',
    'file whose primary disagrees with the process root is corrupt',
  )

  writeFileSync(
    join(stateDir, 'fleet.json'),
    JSON.stringify({ schema: 'foc-fleet/v1', roots: [PRIMARY, 'relative/root'] }),
  )
  assert.equal(refusalOf(() => loadFleetState(stateDir, PRIMARY)).reason, 'fleet-state-corrupt')
})

test('saveFleetState writes exactly one closed-vocabulary state file', () => {
  const stateDir = mkdtempSync(join(tmpdir(), 'fleet-state-'))
  saveFleetState(stateDir, createFleetState(PRIMARY, fakeProbe()))
  assert.deepEqual(readdirSync(stateDir).sort(), ['fleet.json'])
})
