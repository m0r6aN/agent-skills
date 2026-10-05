/**
 * AC2: the vendored `src/canonical.ts` + `src/hash.ts` reproduce the shipped
 * `receipts` package's frozen worked vector - drift of the vendored
 * algorithm from the authority fails this test mechanically. Also asserts no
 * import of pcc internals and no modification of `receipts/`.
 */
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { canonicalize, type JsonObject } from '../src/canonical.js'
import { sha256Hex } from '../src/hash.js'
import { changedPathsSinceMergeBase } from './helpers.js'

const packageDir = join(dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = join(packageDir, '..', '..', '..')
const fixturePath = join(
  packageDir,
  '..',
  'receipts',
  'tests',
  'fixtures',
  'hash-vector-genesis.json',
)

const EXPECTED_HASH = '06d29ab66ebffd099f4e9031f7c38ffb778a996f6e18726ab8eea30a35f3ee23'

function collectTsFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...collectTsFiles(full))
    else if (entry.name.endsWith('.ts')) out.push(full)
  }
  return out
}

test('AC2: vendored canonicalize+hash reproduce the receipts frozen worked vector', () => {
  const doc = JSON.parse(readFileSync(fixturePath, 'utf8')) as JsonObject & { hash: string }
  const { hash, ...rest } = doc
  const recomputed = sha256Hex(canonicalize(rest))
  assert.equal(recomputed, EXPECTED_HASH)
  assert.equal(hash, EXPECTED_HASH)
})

test('AC2: no import of pcc internals (skills/parcel-compiler) anywhere in the package', () => {
  // Scoped to actual import/require specifiers, not prose - the vendored
  // canonical.ts's own doc comment cites the pcc authority by reference
  // (never imports it), which would otherwise self-trigger a false positive.
  const importPattern = /(?:from|import|require)\s*\(?\s*['"][^'"]*skills\/parcel-compiler/
  for (const file of collectTsFiles(packageDir)) {
    const text = readFileSync(file, 'utf8')
    assert.equal(importPattern.test(text), false, `${file} imports skills/parcel-compiler`)
  }
})

test('AC2: no modification to receipts/ since the branch fork point beyond the ratified measured-workflow set', () => {
  // The freeze window is merge-base(HEAD, origin/main). The 2026-10-04 dev /
  // origin-dev unification merged in origin/dev's measured-workflow receipts
  // evolution (theirs' side of that merge; landed on main via PR #122, with its
  // own suites: executed-identity, measured-workflow-internal, replay-contract,
  // semantic-invariants). Those paths are admitted here explicitly — the
  // mutation-scope enforcement this package's dispatch work builds on depends
  // on them. Any OTHER receipts/ change since the fork point, including new
  // files, still fails mechanically.
  const ratifiedMeasuredWorkflow: Record<string, true> = {
    'plugins/foreman-line/receipts/biome.json': true,
    'plugins/foreman-line/receipts/package-lock.json': true,
    'plugins/foreman-line/receipts/package.json': true,
    'plugins/foreman-line/receipts/src/index.ts': true,
    'plugins/foreman-line/receipts/src/measured-workflow-internal.ts': true,
    'plugins/foreman-line/receipts/src/types.ts': true,
    'plugins/foreman-line/receipts/src/validator.ts': true,
    'plugins/foreman-line/receipts/tests/executed-identity.test.ts': true,
    'plugins/foreman-line/receipts/tests/measured-workflow-internal.test.ts': true,
    'plugins/foreman-line/receipts/tests/replay-contract.test.ts': true,
    'plugins/foreman-line/receipts/tests/semantic-invariants.test.ts': true,
  }
  const changedPaths = changedPathsSinceMergeBase(repoRoot, 'plugins/foreman-line/receipts')
  const unexpected = changedPaths.filter((path) => !(path in ratifiedMeasuredWorkflow))
  assert.deepEqual(unexpected, [])
})
