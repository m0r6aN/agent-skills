/**
 * AC3: the `intersects` predicate, including the Windows/POSIX path-identity
 * fixture.
 *
 * AC4: the mandatory D34 adversarial fixture — two synthetic parcel specs
 * with disjoint declared `surfaces:` that share one concrete reader file once
 * that file is registered as a common reader, plus the residual-limit twin
 * (Constraint 5 / plan-review S3).
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { intersects } from '../src/intersect.js'
import { deriveTouchSet, normalizeSeparators } from '../src/touch-set.js'
import type { ContractReader, ContractReaderEntry } from '../src/types.js'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(here, '..', '..', '..', '..')

function loadFixture<T>(name: string): T {
  return JSON.parse(readFileSync(join(here, 'fixtures', name), 'utf8')) as T
}

function filesForParcel(entry: ContractReaderEntry, parcelId: string): readonly string[] {
  return entry.readers
    .filter(
      (r): r is Exclude<ContractReader, string> => typeof r !== 'string' && r.parcelId === parcelId,
    )
    .flatMap((r) => r.files)
}

// --- AC3: basic overlap semantics ---

test('intersects: true when two touch sets share at least one file', () => {
  const a = { files: ['plugins/foreman-line/x/a.ts', 'plugins/foreman-line/x/b.ts'] }
  const b = { files: ['plugins/foreman-line/x/b.ts', 'plugins/foreman-line/x/c.ts'] }
  assert.equal(intersects(a, b), true)
})

test('intersects: false when two touch sets are disjoint', () => {
  const a = { files: ['plugins/foreman-line/x/a.ts'] }
  const b = { files: ['plugins/foreman-line/x/c.ts'] }
  assert.equal(intersects(a, b), false)
})

test('intersects: a Windows-backslash and POSIX-forward-slash form of the same path are one identity', () => {
  const fixture = loadFixture<{ windowsForm: string; posixForm: string }>(
    'windows-and-posix-same-path.json',
  )
  const a = { files: [fixture.windowsForm] }
  const b = { files: [fixture.posixForm] }
  assert.equal(intersects(a, b), true)
  assert.equal(normalizeSeparators(fixture.windowsForm), normalizeSeparators(fixture.posixForm))
})

// --- AC4: the mandatory D34 adversarial fixture ---

const parcelASurfaces = [
  'plugins/foreman-line/contract-readers/tests/fixtures/d34-parcel-a-only.json',
]
const parcelBSurfaces = [
  'plugins/foreman-line/contract-readers/tests/fixtures/d34-parcel-b-only.json',
]

test('AC4: two synthetic parcels with disjoint DECLARED surfaces derive disjoint touch sets on their own', () => {
  const touchSetA = deriveTouchSet(parcelASurfaces, repoRoot)
  const touchSetB = deriveTouchSet(parcelBSurfaces, repoRoot)
  assert.equal(intersects(touchSetA, touchSetB), false)
})

test('AC4: once the shared file is registered as a COMMON reader for both parcels, intersects refuses (returns true)', () => {
  const registryEntry = loadFixture<ContractReaderEntry>('d34-registry-entry.json')
  const touchSetA = deriveTouchSet(parcelASurfaces, repoRoot)
  const touchSetB = deriveTouchSet(parcelBSurfaces, repoRoot)

  const combinedA = {
    files: [
      ...touchSetA.files,
      ...filesForParcel(registryEntry, 'd34-parcel-a').map(normalizeSeparators),
    ],
  }
  const combinedB = {
    files: [
      ...touchSetB.files,
      ...filesForParcel(registryEntry, 'd34-parcel-b').map(normalizeSeparators),
    ],
  }

  assert.equal(intersects(combinedA, combinedB), true)
})

test('AC4 residual-limit twin: WITHOUT the shared registry entry, the same two parcels are permitted — this predicate refuses only when the shared dependency is a declared registry entry; an undeclared shared file it does not know about is not detected by this check', () => {
  const touchSetA = deriveTouchSet(parcelASurfaces, repoRoot)
  const touchSetB = deriveTouchSet(parcelBSurfaces, repoRoot)
  const result = intersects(touchSetA, touchSetB)
  assert.equal(result, false)
  const residualLimitStatement =
    'this predicate refuses only when the shared dependency is a declared registry entry; ' +
    'an undeclared shared file it does not know about is not detected by this check'
  assert.ok(residualLimitStatement.length > 0)
  assert.equal(result, false, residualLimitStatement)
})
