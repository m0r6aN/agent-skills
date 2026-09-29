/**
 * Closed registry completeness (AC1, default-deny #30): exactly 10 vector
 * classes, 26 matrix cases, 3 controls, 5 measurement cases; one fixture
 * record per case; missing/duplicate/malformed rows fail.
 */

import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { HarnessError } from '../src/errors.js'
import {
  buildRegistry,
  EXPECTED_COUNTS,
  loadRegistry,
  VECTOR_FIXTURE_FILES,
  validateCaseRow,
} from '../src/vectors.js'

const fixtureDir = join(dirnameOf(fileURLToPath(import.meta.url)), 'fixtures')

function dirnameOf(p: string): string {
  const out = p.replaceAll('\\', '/')
  const idx = out.lastIndexOf('/')
  return out.slice(0, idx)
}

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function loadRaw(): {
  vectorFixtures: Array<{ file: string; raw: unknown }>
  controlsRaw: unknown
  measurementRaw: unknown
} {
  const vectorFixtures = VECTOR_FIXTURE_FILES.map((file) => ({
    file,
    raw: readJson(join(fixtureDir, 'vectors', file)),
  }))
  return {
    vectorFixtures,
    controlsRaw: readJson(join(fixtureDir, 'controls', 'dispatch-cli-controls.json')),
    measurementRaw: readJson(join(fixtureDir, 'measurement', 'plan.json')),
  }
}

test('registry has exactly the closed 10/26/3/5 shape with unique ids', () => {
  const registry = loadRegistry()
  assert.equal(registry.vectorClasses.length, EXPECTED_COUNTS.vectorClasses)
  assert.equal(
    registry.vectorClasses.reduce((n, v) => n + v.cases.length, 0),
    EXPECTED_COUNTS.vectorCases,
  )
  assert.equal(registry.controls.length, EXPECTED_COUNTS.controls)
  assert.equal(registry.measurement.length, EXPECTED_COUNTS.measurementCases)
  assert.equal(registry.all.length, EXPECTED_COUNTS.totalCases)
  const ids = registry.all.map((r) => r.id)
  assert.equal(new Set(ids).size, ids.length, 'case ids must be unique')
})

test('every case carries a pre-declared hypothesis and required signals', () => {
  const registry = loadRegistry()
  for (const row of registry.all) {
    assert.ok(row.hypothesis.basis.length > 0, `${row.id} lacks hypothesis basis`)
    assert.ok(row.requiredSignals.length > 0, `${row.id} lacks required signals`)
  }
})

test('a missing case fails the closed-shape check', () => {
  const raw = loadRaw()
  const mutated = raw.vectorFixtures.map((f) =>
    f.file === 'v1-shell.json'
      ? {
          file: f.file,
          raw: { ...(f.raw as object), cases: (f.raw as { cases: unknown[] }).cases.slice(1) },
        }
      : f,
  )
  assert.throws(
    () => buildRegistry(mutated, raw.controlsRaw, raw.measurementRaw),
    (err: unknown) => err instanceof HarnessError && err.code === 'VECTOR_FIXTURE_MALFORMED',
  )
})

test('a duplicate case id fails', () => {
  const raw = loadRaw()
  const first = raw.vectorFixtures[0]
  if (first === undefined) throw new Error('missing fixture')
  const cases = (first.raw as { cases: unknown[] }).cases
  const mutated = raw.vectorFixtures.map((f) =>
    f.file === first.file
      ? { file: f.file, raw: { ...(f.raw as object), cases: [...cases, cases[0]] } }
      : f,
  )
  assert.throws(
    () => buildRegistry(mutated, raw.controlsRaw, raw.measurementRaw),
    (err: unknown) => err instanceof HarnessError && err.code === 'VECTOR_FIXTURE_MALFORMED',
  )
})

test('a fixture row missing hypothesis/signals/identity is malformed', () => {
  const base = {
    id: 'X-1',
    kind: 'vector',
    vectorClass: 'VX',
    channel: 'x',
    scenario: 'x',
    hypothesis: { classification: 'unsupported', basis: 'x' },
    requiredSignals: ['a'],
  }
  assert.ok(validateCaseRow(base, 't'))
  assert.throws(
    () => validateCaseRow({ ...base, hypothesis: undefined }, 't'),
    (err: unknown) => err instanceof HarnessError && err.code === 'VECTOR_FIXTURE_MALFORMED',
  )
  assert.throws(
    () => validateCaseRow({ ...base, requiredSignals: [] }, 't'),
    (err: unknown) => err instanceof HarnessError && err.code === 'VECTOR_FIXTURE_MALFORMED',
  )
  assert.throws(
    () => validateCaseRow({ ...base, id: '' }, 't'),
    (err: unknown) => err instanceof HarnessError && err.code === 'VECTOR_FIXTURE_MALFORMED',
  )
  assert.throws(
    () =>
      validateCaseRow(
        { ...base, hypothesis: { classification: 'contains-everything', basis: 'x' } },
        't',
      ),
    (err: unknown) => err instanceof HarnessError && err.code === 'VECTOR_FIXTURE_MALFORMED',
  )
})
