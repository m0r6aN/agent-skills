/**
 * AC9/AC10/AC11: every accept fixture validates; every reject fixture fails
 * with an error naming the violated location. Reject twins are paired with
 * their accepting halves deliberately (STANDING-CONSTRAINTS #11): D28a's
 * omission-reject sits beside the explicit-[] accept, Q4's omitted-key
 * rejects beside the explicit-null accept, Q5's prohibition beside the
 * `stack: none` accept.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { parseForemanConfigYaml, validateForemanConfig } from '../src/validate.js'

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures')

function loadFixture(name: string): unknown {
  return parseForemanConfigYaml(readFileSync(join(fixturesDir, name), 'utf8'))
}

// Accepts ---------------------------------------------------------------

const acceptFixtures = [
  'accept-vite-full.yaml',
  'accept-nextjs.yaml',
  'accept-stack-none.yaml',
  'accept-empty-surfaces-present.yaml',
  'accept-empty-capabilities.yaml',
  'accept-null-identity-values.yaml',
  'accept-empty-capability-array.yaml',
] as const

for (const name of acceptFixtures) {
  test(`accepts ${name}`, () => {
    const result = validateForemanConfig(loadFixture(name))
    assert.deepEqual(result.errors, [])
    assert.equal(result.valid, true)
  })
}

// Rejects ---------------------------------------------------------------

function assertRejects(name: string, expectedFragment: string): void {
  const result = validateForemanConfig(loadFixture(name))
  assert.equal(result.valid, false, `${name} unexpectedly validated`)
  assert.ok(
    result.errors.some((e) => e.includes(expectedFragment)),
    `${name}: expected an error containing '${expectedFragment}', got: ${JSON.stringify(result.errors)}`,
  )
}

test('D26: rejects a document with the stack: block omitted', () => {
  assertRejects('reject-omitted-stack.yaml', 'stack')
})

test('D28a: rejects profile != none with surfaces_present absent', () => {
  assertRejects('reject-missing-surfaces-present.yaml', 'surfaces_present')
})

test('D28b: rejects an unknown profile: value', () => {
  assertRejects('reject-unknown-profile.yaml', '/stack/profile')
})

test('rejects an unknown top-level key, naming it', () => {
  assertRejects('reject-unknown-toplevel-key.yaml', "'telemetry'")
})

test('rejects an unknown key inside a group, naming it', () => {
  assertRejects('reject-unknown-key-in-group.yaml', "'repo_url'")
})

test('Q5: rejects surfaces_present alongside profile: none (prohibited, not ignored)', () => {
  assertRejects('reject-surfaces-present-with-none.yaml', '/stack')
})

test('Q5 companion: rejects a layout map alongside profile: none', () => {
  assertRejects('reject-layout-with-none.yaml', '/stack')
})

test('Q4: rejects a document omitting the project_key key (explicit null required)', () => {
  assertRejects('reject-omitted-project-key.yaml', 'project_key')
})

test('Q4: rejects a document omitting the dispatch_queue key (explicit null required)', () => {
  assertRejects('reject-omitted-dispatch-queue.yaml', 'dispatch_queue')
})

// In-memory reject twins for shapes not worth a fixture file ---------------

test('accepts a capabilities entry with an empty skill array (vocabulary membership without a serving skill — coordinator ruling)', () => {
  const doc = loadFixture('accept-vite-full.yaml') as Record<string, unknown>
  const mutated = { ...doc, capabilities: { ticketing: [] } }
  const result = validateForemanConfig(mutated)
  assert.deepEqual(result.errors, [])
  assert.equal(result.valid, true)
})

test('reject twin: a capabilities entry containing a blank STRING is still a rejection', () => {
  const doc = loadFixture('accept-vite-full.yaml') as Record<string, unknown>
  const mutated = { ...doc, capabilities: { ticketing: ['   '] } }
  const result = validateForemanConfig(mutated)
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((e) => e.includes('/capabilities/ticketing')))
})

test('rejects a blank identity.base_branch (non-blank strings required)', () => {
  const doc = loadFixture('accept-vite-full.yaml') as {
    identity: Record<string, unknown>
  } & Record<string, unknown>
  const mutated = { ...doc, identity: { ...doc.identity, base_branch: '   ' } }
  const result = validateForemanConfig(mutated)
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((e) => e.includes('/identity/base_branch')))
})

test('rejects an unknown risk value in policy.audit.require_security_audit_at', () => {
  const doc = loadFixture('accept-vite-full.yaml') as Record<string, unknown>
  const mutated = { ...doc, policy: { audit: { require_security_audit_at: ['extreme'] } } }
  const result = validateForemanConfig(mutated)
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((e) => e.includes('/policy/audit/require_security_audit_at')))
})

test('rejects a layout with a required root array missing (route_roots omitted)', () => {
  const doc = loadFixture('accept-vite-full.yaml') as {
    stack: { layout: Record<string, unknown> } & Record<string, unknown>
  } & Record<string, unknown>
  const { route_roots: _dropped, ...partialLayout } = doc.stack.layout
  const mutated = { ...doc, stack: { ...doc.stack, layout: partialLayout } }
  const result = validateForemanConfig(mutated)
  assert.equal(result.valid, false)
  assert.ok(result.errors.some((e) => e.includes('route_roots')))
})

// Duplicate-key parse rejection (mirrors skill-injection's AC4e posture) ----

test('parseForemanConfigYaml rejects a duplicated key', () => {
  assert.throws(() => parseForemanConfigYaml('identity: {}\nidentity: {}\n'), /unique/i)
})
