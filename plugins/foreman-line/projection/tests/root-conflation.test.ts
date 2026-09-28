/**
 * P2b-i (root-conflation rulings) — projection package.
 *
 * AC6 ORDERED PAIR (STANDING-CONSTRAINTS #11): (a) demonstrates the
 * mis-comparison FIRST — under the pre-P2b-i comparison, a path outside the
 * TRUE root passes containment when a relative `repoRoot` re-anchors the
 * comparison base to a chosen cwd — then pins the typed refusal that closes
 * it (the pin goes red if the absolute-root assertion is deleted; the
 * mutation run is captured in the build report per A1.6). (b) proves the
 * refusal fail-closed in isolation.
 *
 * AC3: specsDir parameterization proven with a value the old constant never
 * held (STANDING #15). AC2: DEFAULT_REPO_ROOT is gone.
 */
import assert from 'node:assert/strict'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { test } from 'node:test'
import * as api from '../src/index.js'
import {
  assertContainedPath,
  ProjectionRootUnresolvedError,
  writeProjectedArtifact,
} from '../src/index.js'
import { makeTempRepoRoot } from './helpers.js'

test('P2b-AC6a: a relative repoRoot re-anchors containment to a chosen cwd (mis-comparison demonstrated), and the guard now refuses it typed', () => {
  // The TRUE root the caller MEANT (imagine a real checkout elsewhere):
  const trueRoot = makeTempRepoRoot()
  // The attacker-chosen cwd: a sibling world containing its own `repo/` dir.
  const chosenCwd = makeTempRepoRoot()
  mkdirSync(join(chosenCwd, 'repo'), { recursive: true })
  // A file OUTSIDE the true root, inside the cwd-anchored fake `repo/`:
  const outsidePath = join(chosenCwd, 'repo', 'evil-spec.md')
  writeFileSync(outsidePath, 'outside the true root', 'utf8')

  const relativeRoot = 'repo' // possibly-relative caller-supplied root

  const prevCwd = process.cwd()
  process.chdir(chosenCwd)
  try {
    // (a) DEMONSTRATION — the exact pre-P2b-i comparison from
    // path-guard.ts (`relative(resolve(repoRoot), resolve(absPath))`),
    // evaluated verbatim: resolve('repo') silently anchors to the chosen
    // cwd, so the outside path PASSES the containment math even though it
    // is nowhere beneath the true root. The vulnerability is real.
    const rel = relative(resolve(relativeRoot), resolve(outsidePath))
    assert.ok(
      !rel.startsWith('..'),
      'pre-P2b-i comparison must accept the outside path — the mis-comparison this parcel closes',
    )
    assert.ok(
      !outsidePath.startsWith(trueRoot),
      'the accepted path is genuinely outside the true root',
    )

    // REGRESSION PIN (A1.6): the SAME scenario now fails closed with the
    // typed refusal. Delete the absolute-root assertion in path-guard.ts and
    // THIS assertion goes red (the outside path would pass containment and
    // no error would be thrown).
    assert.throws(
      () => assertContainedPath(relativeRoot, outsidePath, 'evil-spec.md'),
      (err: unknown) =>
        err instanceof ProjectionRootUnresolvedError && err.reason === 'root-not-absolute',
    )
  } finally {
    process.chdir(prevCwd)
  }
})

test('P2b-AC6b: assertContainedPath refuses a non-absolute repoRoot with the typed error before any comparison', () => {
  assert.throws(
    () => assertContainedPath('some/relative/root', '/tmp/x.md', 'x.md'),
    (err: unknown) =>
      err instanceof ProjectionRootUnresolvedError && err.reason === 'root-not-absolute',
  )
})

test('P2b-AC6b: an absolute root still enforces containment exactly as before (no behavior widened)', () => {
  const root = makeTempRepoRoot()
  assert.throws(
    () => assertContainedPath(root, join(root, '..', 'escape.md'), 'escape.md'),
    /resolves outside repoRoot/,
  )
  // And a genuinely contained path still passes silently.
  assertContainedPath(root, join(root, 'inside.md'), 'inside.md')
})

test('P2b-AC3: writeProjectedArtifact honors a specsDir the old constant never held, end-to-end', () => {
  const root = makeTempRepoRoot()
  const { artifactPath, artifactRef } = writeProjectedArtifact(
    'never-held',
    { parcelSpecRefs: ['x.md'], epics: [{ key: 'E', title: 'T', stories: [] }] },
    { repoRoot: root, specsDir: 'my-specs/active' },
  )
  assert.equal(
    artifactPath,
    join(root, 'my-specs', 'active', 'never-held.projected.shaping-result.json'),
  )
  assert.equal(artifactRef, 'my-specs/active/never-held.projected.shaping-result.json')
  assert.ok(existsSync(artifactPath), 'artifact must exist at the parameterized path')
  assert.ok(
    !existsSync(join(root, 'plugins', 'foreman-line', 'docs', 'specs', 'active')),
    'nothing may be written under the retired constant path',
  )
})

test('P2b-AC6b: writeProjectedArtifact refuses a non-absolute repoRoot with the typed error', () => {
  assert.throws(
    () =>
      writeProjectedArtifact(
        'rel-root',
        { parcelSpecRefs: [], epics: [] },
        { repoRoot: 'relative/root' },
      ),
    (err: unknown) =>
      err instanceof ProjectionRootUnresolvedError && err.reason === 'root-not-absolute',
  )
})

test('P2b-AC2: DEFAULT_REPO_ROOT is gone from the public surface (R3)', () => {
  assert.ok(!('DEFAULT_REPO_ROOT' in api), 'DEFAULT_REPO_ROOT must not be exported')
})
