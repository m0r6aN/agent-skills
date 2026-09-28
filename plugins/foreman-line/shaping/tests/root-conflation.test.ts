/**
 * P2b-i (root-conflation rulings) — shaping package.
 *
 * AC3: the specsDir parameterization is proven with a value the old constant
 * NEVER held (STANDING-CONSTRAINTS #15), asserted end-to-end to the written
 * and read paths. AC2: `DEFAULT_REPO_ROOT` no longer exists in the public
 * surface. AC6(b) seam refusal: a non-absolute repoRoot is refused with the
 * package's typed error before anything is written.
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import * as api from '../src/index.js'
import {
  discoverShapingResults,
  emitShapingResult,
  ShapingRootUnresolvedError,
} from '../src/index.js'
import { makeTempRepoRoot } from './helpers.js'

test('P2b-AC3: emit honors a specsDir the old constant never held, end-to-end (my-specs/active)', () => {
  const root = makeTempRepoRoot()
  const { artifactPath, artifactRef } = emitShapingResult({
    sessionSlug: 'never-held',
    parcelSpecRefs: ['x.md'],
    repoRoot: root,
    specsDir: 'my-specs/active',
  })
  // Flows to the WRITTEN path…
  assert.equal(artifactPath, join(root, 'my-specs', 'active', 'never-held.shaping-result.json'))
  assert.ok(existsSync(artifactPath), 'artifact must exist at the parameterized path')
  // …and to the emitted ref…
  assert.equal(artifactRef, 'my-specs/active/never-held.shaping-result.json')
  // …and the old constant's location was NOT written.
  assert.ok(
    !existsSync(join(root, 'plugins', 'foreman-line', 'docs', 'specs', 'active')),
    'nothing may be written under the retired constant path',
  )
  // Read side: discovery against the same parameterization finds it.
  const found = discoverShapingResults(root, 'my-specs/active')
  assert.deepEqual(found, [artifactPath])
  const parsed = JSON.parse(readFileSync(artifactPath, 'utf8'))
  assert.deepEqual(parsed, { parcelSpecRefs: ['x.md'], epics: [] })
})

test('P2b-AC3: home-repo call sites pass the plugin-prefixed specsDir explicitly and it flows through', () => {
  const root = makeTempRepoRoot()
  const { artifactPath, artifactRef } = emitShapingResult({
    sessionSlug: 'home-shape',
    parcelSpecRefs: ['x.md'],
    repoRoot: root,
    specsDir: 'plugins/foreman-line/docs/specs/active',
  })
  assert.equal(artifactRef, 'plugins/foreman-line/docs/specs/active/home-shape.shaping-result.json')
  assert.ok(existsSync(artifactPath))
})

test('P2b-AC2: DEFAULT_REPO_ROOT and ACTIVE_SPECS_DIR are gone from the public surface (R3/R2)', () => {
  assert.ok(!('DEFAULT_REPO_ROOT' in api), 'DEFAULT_REPO_ROOT must not be exported')
  assert.ok(!('ACTIVE_SPECS_DIR' in api), 'ACTIVE_SPECS_DIR must not be exported')
})

test('P2b-AC6b: emit refuses a non-absolute repoRoot with the typed error (mechanism class 5)', () => {
  assert.throws(
    () =>
      emitShapingResult({
        sessionSlug: 'rel-root',
        parcelSpecRefs: ['x.md'],
        repoRoot: 'some/relative/root',
      }),
    (err: unknown) =>
      err instanceof ShapingRootUnresolvedError && err.reason === 'root-not-absolute',
  )
})

test('P2b-AC6b: discoverShapingResults refuses a non-absolute repoRoot with the typed error', () => {
  assert.throws(
    () => discoverShapingResults('relative/root'),
    (err: unknown) =>
      err instanceof ShapingRootUnresolvedError && err.reason === 'root-not-absolute',
  )
})
