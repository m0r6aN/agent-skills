/**
 * Coordinator ruling (P1a rework, flagged call #2), behavioral proof of the
 * SECOND meaning of a declared `capabilities:` key: with
 * `capabilities: { telemetry: [] }`, vocabulary membership works WITHOUT a
 * serving skill — a spec carrying `involves: [telemetry]` emits no advisory
 * and stays valid — while `resolveInvolves` independently reports the
 * zero-resolution no-op, announced exactly once. The two observations are
 * independent (the D21/D27 separation), and the contrast half proves the
 * membership effect is real: the same spec with `telemetry` absent from the
 * config DOES get the advisory.
 *
 * Imports the spec-linter via relative ESM specifier — the same
 * cross-package direction spec-linter's own CLI uses toward foreman-config.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { validateSpecFrontmatter } from '../../spec-linter/src/validate.js'
import { resolveInvolves } from '../src/resolve.js'

const specWithTelemetry = {
  ticket: 'KONE-TEST',
  title: 'vocabulary membership without a serving skill',
  status: 'active',
  owner: 'clinton.morgan',
  created: '2026-08-18',
  updated: '2026-08-18',
  supersedes: null,
  superseded_by: null,
  risk: 'standard',
  surfaces: ['docs/SPEC-CONVENTION.md'],
  routing_class: 'standard-feature',
  verification_class: 'judgment-required',
  permission_profile: 'builder-standard',
  involves: ['telemetry'],
}

const emptyTelemetryCapabilities = { telemetry: [] as string[] }

test('with telemetry: [] declared, involves: [telemetry] emits NO advisory and stays valid', () => {
  const result = validateSpecFrontmatter(specWithTelemetry, {
    capabilityExtensions: emptyTelemetryCapabilities,
  })
  assert.equal(result.valid, true)
  assert.deepEqual(result.errors, [])
  assert.ok(
    !result.warnings.some((w) => w.includes('involves entry')),
    `vocabulary membership must work without a serving skill, got: ${JSON.stringify(result.warnings)}`,
  )
})

test('contrast half: with telemetry ABSENT from the config, the advisory still fires (membership is real, not vacuous)', () => {
  const result = validateSpecFrontmatter(specWithTelemetry, { capabilityExtensions: {} })
  assert.equal(result.valid, true, 'advisory only — validity is never affected (D14)')
  assert.equal(result.warnings.filter((w) => w.includes("involves entry 'telemetry'")).length, 1)
})

test('same config, resolution side: empty resolution, nothing thrown, announced exactly once', () => {
  const announcements: string[] = []
  const resolution = resolveInvolves(['telemetry'], emptyTelemetryCapabilities, (m) =>
    announcements.push(m),
  )
  assert.equal(resolution.resolved.size, 0)
  assert.deepEqual(resolution.unresolved, ['telemetry'])
  assert.equal(announcements.length, 1, 'exactly once, not at-least-once')
})
