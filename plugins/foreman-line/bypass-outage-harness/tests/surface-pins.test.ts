/**
 * Pin integrity (#34, three-state): anchors live in src/surface-refs.ts with
 * their pin digests; drift fails closed (PIN_DRIFT), named known-base states
 * emit KNOWN-GAP records, and the FK-P2 reference is three-state the same way.
 */

import { strict as assert } from 'node:assert'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { HarnessError } from '../src/errors.js'
import {
  assertNoReadOnlyViolation,
  computeReadOnlyViolations,
  readOnlySurfaceRows,
  setEvidenceRootForTest,
} from '../src/index.js'
import {
  classifyFk2Reference,
  classifyPin,
  digestFile,
  type PinEntry,
  type PinSnapshotRow,
  SPEC_RELATIVE_PATH,
  SPEC_SHA256,
  SURFACE_PINS,
  snapshotPins,
  specPath,
} from '../src/surface-refs.js'

function dirnameOf(p: string): string {
  const normalized = p.replaceAll('\\', '/')
  return normalized.slice(0, normalized.lastIndexOf('/'))
}

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

test('FK-P17 spec pin follows the completed spec and its committed digest', () => {
  assert.equal(SPEC_RELATIVE_PATH, 'docs/specs/done/FK-P17-bypass-outage-matrix.md')
  assert.equal(digestFile(specPath()), SPEC_SHA256)
})

test('live worktree pins: zero drift; SPEC-CONVENTION gap closed (v0.4 delta committed)', () => {
  const rows = snapshotPins()
  const drifted = rows.filter((r) => r.state === 'drift')
  assert.deepEqual(drifted, [], `unexpected pin drift: ${drifted.map((d) => d.path).join(', ')}`)
  // The RCM-P2 schema-v0.4 delta is committed: live bytes match the pinned
  // digest, so the named known-base KNOWN-GAP is resolved to 'match' (the
  // known-base record is retained as history only — spec pin-table row,
  // GAP CLOSED 2026-10-06).
  const convention = rows.find((r) => r.id === 'spec-convention')
  assert.ok(convention !== undefined)
  assert.equal(convention.state, 'match')
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

const pinRow = (id: string, digest: string): PinSnapshotRow => ({
  id,
  path: `${id}.ts`,
  liveDigest: digest,
  pinnedDigest: 'aa'.repeat(32),
  state: 'match',
  gapReason: null,
})

test('manifest rows bind pre AND post digests of every surface (R3)', () => {
  const pre = [pinRow('a', '11'.repeat(32)), pinRow('b', '22'.repeat(32))]
  const post = [pinRow('a', '11'.repeat(32)), pinRow('b', '33'.repeat(32))]
  const rows = readOnlySurfaceRows(pre, post)
  assert.equal(rows.length, 2)
  for (const row of rows) {
    assert.ok('preDigest' in row && 'postDigest' in row, 'both digests must be bound')
    assert.ok(typeof row.preDigest === 'string' && typeof row.postDigest === 'string')
  }
  assert.equal(rows[1]?.postDigest, '33'.repeat(32))
})

test('read-only violations are computed from pre/post digests (R3)', () => {
  const pre = [pinRow('a', '11'.repeat(32))]
  assert.deepEqual(computeReadOnlyViolations(pre, [pinRow('a', '11'.repeat(32))]), [])
  const violations = computeReadOnlyViolations(pre, [pinRow('a', '99'.repeat(32))])
  assert.equal(violations.length, 1)
  assert.equal(violations[0]?.path, 'a.ts')
})

test('a violation is RECORDED on disk before the run fails (R3)', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'fk-p17-r3-'))
  try {
    writeFileSync(join(tmp, 'summary.json'), '{"tallies":{}}', 'utf8')
    writeFileSync(join(tmp, 'manifest.json'), '{"artifacts":[]}', 'utf8')
    setEvidenceRootForTest(tmp)
    const pre = [pinRow('a', '11'.repeat(32))]
    assert.throws(
      () => assertNoReadOnlyViolation(pre, [pinRow('a', '99'.repeat(32))]),
      (err: unknown) => err instanceof HarnessError && err.code === 'READ_ONLY_SURFACE_VIOLATION',
    )
    const summary = JSON.parse(readFileSync(join(tmp, 'summary.json'), 'utf8')) as {
      readOnlySurfaceViolation?: unknown[]
    }
    const manifest = JSON.parse(readFileSync(join(tmp, 'manifest.json'), 'utf8')) as {
      readOnlySurfaceViolation?: unknown[]
    }
    assert.ok(
      (summary.readOnlySurfaceViolation?.length ?? 0) > 0,
      'summary must carry the recorded observation',
    )
    assert.ok((manifest.readOnlySurfaceViolation?.length ?? 0) > 0)
    setEvidenceRootForTest(join(dirnameOf(fileURLToPath(import.meta.url)), '..', 'evidence'))
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
})
