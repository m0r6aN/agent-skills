/**
 * AC3: the parcel consumes the shipped `readShapingResult`/`discoverShapingResults`
 * from `../../shaping/src/index.js` (never re-implemented, never modifying
 * `shaping/`), and a projected `*.projected.shaping-result.json` artifact is
 * not selectable as an input via the fallback discovery.
 */
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { discoverShapingResults, readShapingResult } from '../../shaping/src/index.js'
import { discoverProjectableInputs, writeProjectedResult } from '../src/index.js'
import { makeTempRepoRoot, writeShapingResultFixture, writeSpecDraft } from './helpers.js'

const packageDir = join(dirname(fileURLToPath(import.meta.url)), '..')
const srcDir = join(packageDir, 'src')

test('AC3: readShapingResult and discoverShapingResults are imported from ../../shaping/src/index.js', () => {
  const files = readdirSync(srcDir).filter((f) => f.endsWith('.ts'))
  const text = files.map((f) => readFileSync(join(srcDir, f), 'utf8')).join('\n')
  assert.match(text, /from '\.\.\/\.\.\/shaping\/src\/index\.js'/)
  assert.match(text, /readShapingResult/)
  assert.match(text, /discoverShapingResults/)
})

// RETIRED (same class and ruling as the frozen-surface freeze retired in
// frozen-surface.test.ts - CLOSE-P2 coordinator amendment A6;
// STANDING-CONSTRAINTS Builder #12): the "AC3: no file under shaping/ is
// modified by this parcel since the branch fork point" git-diff freeze that
// lived here was W1-P2's parcel-time drift control shipped as a permanent
// suite member - it redded any later PR legitimately touching `shaping/`
// (it fired on the P2b-i root-conflation changes shaping's own suite
// requires). Parcel-time freezes belong in the coordinator's Stage-D/E
// git-diff checks, not the shipped suite. The shipped half of AC3 - the
// import-consumption pin above (readers are imported from
// `../../shaping/src/index.js`, never re-implemented) - stays.

test('AC3: the shipped shaping reader surface this package consumes stays exported', () => {
  // P2b-i: the original W1-P2 parcel-time byte-freeze on shaping/ is retired —
  // P2b-i is chartered to change shaping (R2/R3; shaping is in `surfaces:`),
  // and a shipped byte-pin hard-blocks every future chartered change
  // (STANDING-CONSTRAINTS #12). The durable invariant is pinned instead: the
  // reader functions this package consumes remain on shaping's public surface.
  assert.equal(typeof readShapingResult, 'function')
  assert.equal(typeof discoverShapingResults, 'function')
})

test("AC3: the fallback discovery filters out this package's own projected artifact", () => {
  const root = makeTempRepoRoot()
  writeSpecDraft(root, 'plugins/foreman-line/docs/specs/active/w1-p2.md', 'Title')
  const inputPath = writeShapingResultFixture(root, 'disc-slug', [
    'plugins/foreman-line/docs/specs/active/w1-p2.md',
  ])
  writeProjectedResult(inputPath, 'Epic Title', { repoRoot: root })

  const found = discoverProjectableInputs(root)
  assert.equal(found.length, 1)
  assert.ok(found[0]?.endsWith('disc-slug.shaping-result.json'))
  assert.ok(!found.some((p) => p.endsWith('.projected.shaping-result.json')))
})

test('AC3: discoverProjectableInputs returns [] when active/ does not exist', () => {
  assert.deepEqual(discoverProjectableInputs(makeTempRepoRoot()), [])
})
