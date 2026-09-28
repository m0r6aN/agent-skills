/**
 * Pin integrity (#34, three-state): anchors live in src/surface-refs.ts with
 * their pin digests; drift fails closed (PIN_DRIFT), named known-base states
 * emit KNOWN-GAP records, and the FK-P2 reference is three-state the same way.
 */

import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import {
  classifyFk2Reference,
  classifyPin,
  type PinEntry,
  SPEC_SHA256,
  SURFACE_PINS,
  snapshotPins,
} from '../src/surface-refs.js'

const entry: PinEntry = {
  id: 'x',
  path: 'x',
  sha256: 'aa'.repeat(32),
  binds: 'x',
  knownBase: { sha256: 'bb'.repeat(32), gapReason: 'blocked: known base' },
}

test('three-state classification: match / known-base / drift', () => {
  assert.equal(classifyPin('aa'.repeat(32), entry), 'match')
  assert.equal(classifyPin('bb'.repeat(32), entry), 'known-base')
  assert.equal(classifyPin('cc'.repeat(32), entry), 'drift')
})

test('a pin without a known base fails closed on any drift', () => {
  const strictEntry: PinEntry = { id: 'y', path: 'y', sha256: 'aa'.repeat(32), binds: 'y' }
  assert.equal(classifyPin('bb'.repeat(32), strictEntry), 'drift')
})

test('live worktree pins: zero drift; SPEC-CONVENTION is the named known-base KNOWN-GAP', () => {
  const rows = snapshotPins()
  const drifted = rows.filter((r) => r.state === 'drift')
  assert.deepEqual(drifted, [], `unexpected pin drift: ${drifted.map((d) => d.path).join(', ')}`)
  const convention = rows.find((r) => r.id === 'spec-convention')
  assert.ok(convention !== undefined)
  assert.equal(convention.state, 'known-base')
  assert.equal(convention.gapReason, 'blocked: RCM-P2 schema-v0.4 delta uncommitted')
  const spec = rows.find((r) => r.id === 'fk-p17-spec')
  assert.ok(spec !== undefined)
  assert.equal(spec.pinnedDigest, SPEC_SHA256)
  assert.equal(spec.state, 'match')
})

test('the 18 external pins all carry anchors and digests', () => {
  assert.equal(SURFACE_PINS.length, 18)
  for (const pin of SURFACE_PINS) {
    assert.equal(pin.sha256.length, 64, `${pin.id} digest length`)
    assert.ok(pin.binds.length > 0, `${pin.id} lacks its binds annotation`)
  }
})

test('FK-P2 reference three-state: present / absent / drift (MEAS-05)', () => {
  const goodArtifact = {
    artifactVersion: '0.1.0',
    compiledScopeDigest: 'sha256:x',
    allowedFiles: ['pkg/src/a.ts'],
    forbiddenSurfaces: [],
  }
  assert.equal(classifyFk2Reference(goodArtifact, 'sha256:y'), 'present')
  assert.equal(classifyFk2Reference(undefined, 'sha256:y'), 'absent')
  assert.equal(classifyFk2Reference(goodArtifact, undefined), 'absent')
  assert.equal(classifyFk2Reference({ artifactVersion: '9.9.9' }, 'sha256:y'), 'drift')
  assert.equal(classifyFk2Reference(null, null), 'absent')
})
