/**
 * AC6: six semantic-invariant test suites (AC6a-AC6f), each with at least one
 * passing fixture and one rejecting fixture. AC6a-e are schema-structural
 * (enforced by ajv via `schemas/spec-frontmatter.schema.json`); AC6f is the
 * one true cross-field semantic rule enforced by `validateSpecFrontmatter`
 * itself (status: superseded requires non-null superseded_by).
 *
 * Also covers the `permission_profile:` and `surfaces:` advisory-warning
 * behavior mandated by the spec (Verification Plan focus question 3).
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { parseFrontmatter, validateSpecFrontmatter } from '../src/validate.js'

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures')

function loadFixture(name: string): unknown {
  const content = readFileSync(join(fixturesDir, name), 'utf8')
  const doc = parseFrontmatter(content)
  assert.notEqual(doc, null, `${name}: no parsable frontmatter`)
  return doc
}

// a. risk: enum -----------------------------------------------------------

test('AC6a risk: passing fixture (valid-spec.md, risk: standard)', () => {
  const doc = loadFixture('valid-spec.md')
  assert.equal(validateSpecFrontmatter(doc).valid, true)
})

test('AC6a risk: rejects a value outside {low, standard, elevated, critical}', () => {
  const doc = loadFixture('reject-risk.md')
  const result = validateSpecFrontmatter(doc)
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((e) => e.includes('risk')))
})

// b. routing_class: enum ---------------------------------------------------

test('AC6b routing_class: passing fixture (valid-spec.md, routing_class: standard-feature)', () => {
  const doc = loadFixture('valid-spec.md')
  assert.equal(validateSpecFrontmatter(doc).valid, true)
})

test('AC6b routing_class: rejects a value outside the four-value enum', () => {
  const doc = loadFixture('reject-routing-class.md')
  const result = validateSpecFrontmatter(doc)
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((e) => e.includes('routing_class')))
})

// b.1 verification_class: required two-value enum -------------------------

test('GSO-P1 verification_class: judgment-required is accepted', () => {
  const result = validateSpecFrontmatter(loadFixture('valid-spec.md'))
  assert.equal(result.valid, true, JSON.stringify(result.errors))
})

test('GSO-P1 verification_class: equivalence-provable is accepted', () => {
  const result = validateSpecFrontmatter(loadFixture('valid-verification-class-equivalence.md'))
  assert.equal(result.valid, true, JSON.stringify(result.errors))
})

test('GSO-P1 verification_class: omission is rejected without another violation', () => {
  const result = validateSpecFrontmatter(loadFixture('reject-verification-class-missing.md'))
  assert.equal(result.valid, false)
  assert.deepEqual(
    result.errors.filter((error) => !error.includes('verification_class')),
    [],
  )
  assert.ok(result.errors.some((error) => error.includes('verification_class')))
})

test('GSO-P1 verification_class: an unknown value is rejected without another violation', () => {
  const result = validateSpecFrontmatter(loadFixture('reject-verification-class-unknown.md'))
  assert.equal(result.valid, false)
  assert.deepEqual(
    result.errors.filter((error) => !error.includes('verification_class')),
    [],
  )
  assert.ok(result.errors.some((error) => error.includes('verification_class')))
})

// c. surfaces: non-empty ----------------------------------------------------

test('AC6c surfaces: passing fixture (valid-spec.md, non-empty array)', () => {
  const doc = loadFixture('valid-spec.md')
  assert.equal(validateSpecFrontmatter(doc).valid, true)
})

test('AC6c surfaces: rejects an empty array', () => {
  const doc = loadFixture('reject-surfaces-empty.md')
  const result = validateSpecFrontmatter(doc)
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((e) => e.includes('surfaces')))
})

// d. permission_profile: non-empty, non-whitespace-only string, and (P4) a
//    name in the P1 permission-profile registry ---------------------------

test('AC6d permission_profile: passing fixture (valid-spec.md, registered name builder-standard)', () => {
  const doc = loadFixture('valid-spec.md')
  assert.equal(validateSpecFrontmatter(doc).valid, true)
})

test('AC6d permission_profile: rejects a whitespace-only string', () => {
  const doc = loadFixture('reject-permission-profile-whitespace.md')
  const result = validateSpecFrontmatter(doc)
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((e) => e.includes('permission_profile')))
})

test('AC6d permission_profile: rejects an explicit null (distinct from key-absent)', () => {
  const doc = loadFixture('permission-profile-null.md')
  const result = validateSpecFrontmatter(doc)
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((e) => e.includes('permission_profile')))
})

test('AC6d permission_profile: rejects a well-formed but unregistered name (P4 enum)', () => {
  const doc = loadFixture('reject-permission-profile-unknown.md')
  const result = validateSpecFrontmatter(doc)
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((e) => e.includes('permission_profile')))
})

// e. status: enum ------------------------------------------------------------

test('AC6e status: passing fixture (valid-spec.md, status: active)', () => {
  const doc = loadFixture('valid-spec.md')
  assert.equal(validateSpecFrontmatter(doc).valid, true)
})

test('AC6e status: rejects a value outside {draft, active, done, superseded}', () => {
  const doc = loadFixture('reject-status.md')
  const result = validateSpecFrontmatter(doc)
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((e) => e.includes('status')))
})

// f. status: superseded requires non-null superseded_by (semantic, not schema) ----

test('AC6f superseded invariant: passing fixture (valid-superseded.md, superseded_by set)', () => {
  const doc = loadFixture('valid-superseded.md')
  assert.equal(validateSpecFrontmatter(doc).valid, true)
})

test('AC6f superseded invariant: rejects status: superseded with superseded_by: null', () => {
  const doc = loadFixture('reject-superseded-null.md')
  const result = validateSpecFrontmatter(doc)
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((e) => e.includes('superseded_by')))
})

// permission_profile advisory warning ----------------------------------------

test('permission_profile warning: absent key produces exactly one advisory warning, exit-valid unaffected', () => {
  const doc = loadFixture('valid-spec-no-perm.md')
  const result = validateSpecFrontmatter(doc)
  assert.equal(result.valid, true)
  const permWarnings = result.warnings.filter((w) => w.includes('permission_profile'))
  assert.equal(permWarnings.length, 1)
})

test('permission_profile warning: --no-permission-profile-warning suppresses it with no other side effects', () => {
  const doc = loadFixture('valid-spec-no-perm.md')
  const result = validateSpecFrontmatter(doc, { noPermissionProfileWarning: true })
  assert.equal(result.valid, true)
  assert.ok(!result.warnings.some((w) => w.includes('permission_profile')))
})

test('permission_profile warning: present key produces no advisory warning', () => {
  const doc = loadFixture('valid-spec.md')
  const result = validateSpecFrontmatter(doc)
  assert.ok(!result.warnings.some((w) => w.includes('permission_profile')))
})

// surfaces vocabulary advisory warning ----------------------------------------

test('surfaces vocabulary warning: unknown prefix produces an advisory warning, exit-valid unaffected', () => {
  const doc = loadFixture('valid-spec-unknown-surface.md')
  const result = validateSpecFrontmatter(doc)
  assert.equal(result.valid, true)
  assert.ok(
    result.warnings.some((w) => w.includes('does not begin with a known vocabulary prefix')),
  )
})

test('surfaces vocabulary warning: known prefix produces no vocabulary warning', () => {
  const doc = loadFixture('valid-spec.md')
  const result = validateSpecFrontmatter(doc)
  assert.ok(
    !result.warnings.some((w) => w.includes('does not begin with a known vocabulary prefix')),
  )
})

// P1a: involves — unit-level D14 proof and resolution order --------------------

test('P1a D14: an unknown involves value NEVER flips valid — warning only', () => {
  const doc = loadFixture('valid-involves-unknown.md')
  const result = validateSpecFrontmatter(doc)
  assert.equal(result.valid, true)
  assert.deepEqual(result.errors, [])
  assert.equal(result.warnings.filter((w) => w.includes("involves entry 'divination'")).length, 1)
})

test('P1a AC4: capabilityExtensions as a KEY LIST resolves a non-canonical value (no advisory)', () => {
  const doc = loadFixture('valid-involves-extension.md')
  const result = validateSpecFrontmatter(doc, { capabilityExtensions: ['telemetry'] })
  assert.equal(result.valid, true)
  assert.ok(!result.warnings.some((w) => w.includes('involves entry')))
})

test('P1a AC4: capabilityExtensions as a PARSED OBJECT resolves the same value', () => {
  const doc = loadFixture('valid-involves-extension.md')
  const result = validateSpecFrontmatter(doc, {
    capabilityExtensions: { telemetry: ['otel-instrument'] },
  })
  assert.equal(result.valid, true)
  assert.ok(!result.warnings.some((w) => w.includes('involves entry')))
})

test('P1a AC4 reject twin: without extensions the same doc DOES warn (extension path proven live)', () => {
  const doc = loadFixture('valid-involves-extension.md')
  const result = validateSpecFrontmatter(doc)
  assert.equal(result.valid, true)
  assert.equal(result.warnings.filter((w) => w.includes("involves entry 'telemetry'")).length, 1)
})

test('P1a AC3: involves: [] and absence are both silent (no advisory, no error)', () => {
  for (const name of ['valid-involves-empty.md', 'valid-spec.md']) {
    const result = validateSpecFrontmatter(loadFixture(name))
    assert.equal(result.valid, true, name)
    assert.ok(!result.warnings.some((w) => w.includes('involves')), name)
  }
})

test('P1a AC3: malformed involves SHAPES are schema rejections (the only hard half)', () => {
  for (const name of [
    'reject-involves-non-array.md',
    'reject-involves-empty-string.md',
    'reject-involves-whitespace.md',
  ]) {
    const result = validateSpecFrontmatter(loadFixture(name))
    assert.equal(result.valid, false, name)
    assert.ok(
      result.errors.some((e) => e.includes('involves')),
      name,
    )
  }
})
