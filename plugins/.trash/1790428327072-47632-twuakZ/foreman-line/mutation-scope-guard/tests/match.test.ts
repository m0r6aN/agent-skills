import assert from 'node:assert/strict'
import { test } from 'node:test'
import { matchAny, matchEntry } from '../src/match.js'

// AC1: three fixture sets, one per arm, each with a positive and negative case.

test('exact arm: literal equality matches', () => {
  const result = matchEntry(
    'plugins/foreman-line/mutation-scope-guard/src/match.ts',
    'plugins/foreman-line/mutation-scope-guard/src/match.ts',
  )
  assert.equal(result, 'exact')
})

test('exact arm: a different path does not match (negative case)', () => {
  const result = matchEntry(
    'plugins/foreman-line/mutation-scope-guard/src/guard.ts',
    'plugins/foreman-line/mutation-scope-guard/src/match.ts',
  )
  assert.equal(result, null)
})

test('prefix-star arm: one-level-below path matches (positive case)', () => {
  const result = matchEntry(
    'plugins/foreman-line/mutation-scope-guard/src',
    'plugins/foreman-line/mutation-scope-guard/*',
  )
  assert.equal(result, 'prefix-star')
})

test('prefix-star arm: two-levels-below path does NOT match (negative case, AC1)', () => {
  const result = matchEntry(
    'plugins/foreman-line/mutation-scope-guard/src/match.ts',
    'plugins/foreman-line/mutation-scope-guard/*',
  )
  assert.equal(result, null)
})

test('prefix-star arm: the prefix itself (zero levels below) does not match', () => {
  const result = matchEntry(
    'plugins/foreman-line/mutation-scope-guard',
    'plugins/foreman-line/mutation-scope-guard/*',
  )
  assert.equal(result, null)
})

test('prefix-doublestar arm: two-levels-below path matches (positive case)', () => {
  const result = matchEntry(
    'plugins/foreman-line/mutation-scope-guard/src/match.ts',
    'plugins/foreman-line/mutation-scope-guard/**',
  )
  assert.equal(result, 'prefix-doublestar')
})

test('prefix-doublestar arm: an unrelated path does not match (negative case)', () => {
  const result = matchEntry(
    'plugins/foreman-line/role-authority/src/roles.ts',
    'plugins/foreman-line/mutation-scope-guard/**',
  )
  assert.equal(result, null)
})

test('prefix-doublestar arm: the prefix itself matches (recursive includes zero depth)', () => {
  const result = matchEntry(
    'plugins/foreman-line/mutation-scope-guard',
    'plugins/foreman-line/mutation-scope-guard/**',
  )
  assert.equal(result, 'prefix-doublestar')
})

// The genuine /* vs /** divergence: the SAME two-levels-below path must be
// rejected by /* and accepted by /** for the identical prefix -- proving the
// distinction actually holds, not merely that it is documented separately.
test('/* vs /** genuinely diverge on the same two-levels-below path and prefix', () => {
  const path = 'plugins/foreman-line/mutation-scope-guard/src/match.ts'
  const starResult = matchEntry(path, 'plugins/foreman-line/mutation-scope-guard/*')
  const doubleStarResult = matchEntry(path, 'plugins/foreman-line/mutation-scope-guard/**')
  assert.equal(starResult, null)
  assert.equal(doubleStarResult, 'prefix-doublestar')
})

test('matchAny returns the first authorizing entry and arm', () => {
  const entries = [
    'plugins/foreman-line/mutation-scope-guard/package.json',
    'plugins/foreman-line/mutation-scope-guard/**',
  ]
  const result = matchAny('plugins/foreman-line/mutation-scope-guard/src/match.ts', entries)
  assert.deepEqual(result, {
    entry: 'plugins/foreman-line/mutation-scope-guard/**',
    arm: 'prefix-doublestar',
  })
})

test('matchAny returns null when no entry authorizes the path', () => {
  const result = matchAny('plugins/foreman-line/role-authority/src/roles.ts', [
    'plugins/foreman-line/mutation-scope-guard/**',
  ])
  assert.equal(result, null)
})

test('matchAny against an empty entry list always returns null', () => {
  const result = matchAny('any/path.ts', [])
  assert.equal(result, null)
})
