/**
 * Charter §6 item 9 — equivalent-layout refusal (amended D9a, plan-review B1):
 * a fixture repo carrying `docs/PARCELS/` (or spec-shaped markdown anywhere
 * outside the canonical spec root) yields a typed EQUIVALENT_LAYOUT_CONFLICT
 * naming both paths, writes zero bytes, and does NOT create `docs/specs/`.
 */
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { checkEquivalentLayout } from '../src/equivalent-layout.js'
import { ScaffoldError } from '../src/errors.js'
import { planScaffold } from '../src/generator.js'
import { makeTempRoot, scaffoldArgs, treeSnapshot } from './helpers.js'

const SPEC_SHAPED = [
  '---',
  'ticket: PROJ-1',
  'title: Legacy spec',
  'status: active',
  'owner: someone',
  'created: 2026-01-01',
  'updated: 2026-01-01',
  'risk: standard',
  'surfaces: [docs/]',
  'routing_class: standard-feature',
  'verification_class: judgment-required',
  '---',
  '',
  '# Legacy spec',
  '',
].join('\n')

function expectConflict(root: string, expectedPath: string): void {
  try {
    checkEquivalentLayout(root)
    assert.fail('expected EQUIVALENT_LAYOUT_CONFLICT')
  } catch (err) {
    assert.ok(err instanceof ScaffoldError)
    assert.equal(err.code, 'EQUIVALENT_LAYOUT_CONFLICT')
    assert.equal(err.exitCode, 1)
    assert.ok(
      err.paths.includes(expectedPath),
      `conflict paths ${JSON.stringify(err.paths)} should name ${expectedPath}`,
    )
    assert.ok(err.paths.includes('docs/specs'), 'conflict names the canonical role path')
  }
}

test('an F9-shaped repo carrying docs/PARCELS/ is refused, and docs/specs/ is not created', () => {
  const root = makeTempRoot('scaffold-parcels')
  mkdirSync(join(root, 'docs', 'PARCELS'), { recursive: true })
  writeFileSync(join(root, 'docs', 'PARCELS', 'old.md'), SPEC_SHAPED, 'utf8')

  expectConflict(root, 'docs/PARCELS')
  try {
    planScaffold(scaffoldArgs({ targetRoot: root }))
    assert.fail('expected EQUIVALENT_LAYOUT_CONFLICT')
  } catch (err) {
    assert.ok(err instanceof ScaffoldError)
    assert.equal(err.code, 'EQUIVALENT_LAYOUT_CONFLICT')
    assert.deepEqual(err.paths, ['docs/PARCELS', 'docs/specs'])
  }
  assert.equal(treeSnapshot(root).size, 1, 'nothing written; only the pre-existing fixture remains')
  assert.throws(
    () => checkEquivalentLayout(root),
    (err: unknown) => err instanceof ScaffoldError,
  )
})

test('the lowercase docs/parcels/ alternative layout is refused too', () => {
  const root = makeTempRoot('scaffold-lower-parcels')
  mkdirSync(join(root, 'docs', 'parcels'), { recursive: true })
  expectConflict(root, 'docs/parcels')
})

test('spec markdown with SPEC-CONVENTION-shaped frontmatter outside docs/specs is a conflict', () => {
  const root = makeTempRoot('scaffold-legacy-specs')
  mkdirSync(join(root, 'docs', 'legacy-specs'), { recursive: true })
  writeFileSync(join(root, 'docs', 'legacy-specs', 'old.md'), SPEC_SHAPED, 'utf8')
  expectConflict(root, 'docs/legacy-specs')
})

test('non-spec frontmatter elsewhere is not an equivalent layout', () => {
  const root = makeTempRoot('scaffold-blog')
  mkdirSync(join(root, 'content', 'posts'), { recursive: true })
  writeFileSync(
    join(root, 'content', 'posts', 'hello.md'),
    '---\ntitle: Hello\ndate: 2026-01-01\n---\n\n# Hello\n',
    'utf8',
  )
  assert.doesNotThrow(() => checkEquivalentLayout(root))
})

test('specs in the canonical docs/specs tree are not a conflict (re-run is a no-op)', () => {
  const root = makeTempRoot('scaffold-canonical')
  mkdirSync(join(root, 'docs', 'specs', 'active'), { recursive: true })
  writeFileSync(join(root, 'docs', 'specs', 'active', 'spec.md'), SPEC_SHAPED, 'utf8')
  assert.doesNotThrow(() => checkEquivalentLayout(root))
})
