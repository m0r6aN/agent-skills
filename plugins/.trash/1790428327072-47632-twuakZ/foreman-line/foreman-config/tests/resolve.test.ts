/**
 * AC12 (§6.12 / D14 proof): `resolveInvolves` maps `involves:` values
 * through `capabilities:` deterministically; ZERO RESOLUTION IS A NO-OP —
 * empty resolution, nothing thrown, nothing blocked, degradation announced
 * EXACTLY once. The paired case proves the helper genuinely resolves a
 * declared entry, so the no-op path is proven distinct, not vacuous.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { resolveInvolves } from '../src/resolve.js'

const capabilities = {
  ticketing: ['jira-workflow'],
  compression: ['kompress'],
} as const

test('AC12 no-op half: unresolvable entry returns empty resolution, throws nothing, announces exactly once', () => {
  const announcements: string[] = []
  let result: ReturnType<typeof resolveInvolves> | undefined
  // The whole point of D14: this must not throw, under any input.
  assert.doesNotThrow(() => {
    result = resolveInvolves(['ticketing'], {}, (m) => announcements.push(m))
  })
  assert.ok(result)
  assert.equal(result.resolved.size, 0)
  assert.deepEqual(result.unresolved, ['ticketing'])
  assert.equal(announcements.length, 1, 'announce-once means exactly once, not at-least-once')
  assert.ok(announcements[0]?.includes('ticketing'))
})

test('AC12 paired failing case: a declared entry demonstrably resolves (output changes)', () => {
  const announcements: string[] = []
  const result = resolveInvolves(['ticketing'], capabilities, (m) => announcements.push(m))
  assert.deepEqual(result.resolved.get('ticketing'), ['jira-workflow'])
  assert.deepEqual(result.unresolved, [])
  assert.equal(announcements.length, 0, 'nothing unresolved, so nothing is announced')
})

test('declared-but-empty entry (telemetry: []) resolves to NO skills: empty resolution, announce exactly once', () => {
  // Coordinator ruling (rework, flagged call #2): `telemetry: []` is a
  // valid document meaning vocabulary membership without a serving skill.
  // Resolution-wise that is D14's zero-resolution no-op — announced once.
  const announcements: string[] = []
  let result: ReturnType<typeof resolveInvolves> | undefined
  assert.doesNotThrow(() => {
    result = resolveInvolves(['telemetry'], { telemetry: [] }, (m) => announcements.push(m))
  })
  assert.ok(result)
  assert.equal(result.resolved.size, 0)
  assert.deepEqual(result.unresolved, ['telemetry'])
  assert.equal(announcements.length, 1, 'announce-once means exactly once, not at-least-once')
  assert.ok(announcements[0]?.includes('telemetry'))
})

test('paired contrast: the same capability WITH a skill resolves (empty-array path proven distinct)', () => {
  const announcements: string[] = []
  const result = resolveInvolves(['telemetry'], { telemetry: ['otel-instrument'] }, (m) =>
    announcements.push(m),
  )
  assert.deepEqual(result.resolved.get('telemetry'), ['otel-instrument'])
  assert.deepEqual(result.unresolved, [])
  assert.equal(announcements.length, 0)
})

test('mixed resolution: resolved and unresolved split correctly, still one announcement', () => {
  const announcements: string[] = []
  const result = resolveInvolves(
    ['ticketing', 'divination', 'compression', 'auguries'],
    capabilities,
    (m) => announcements.push(m),
  )
  assert.deepEqual([...result.resolved.keys()], ['ticketing', 'compression'])
  assert.deepEqual(result.unresolved, ['divination', 'auguries'])
  assert.equal(announcements.length, 1)
  assert.ok(announcements[0]?.includes('divination'))
  assert.ok(announcements[0]?.includes('auguries'))
})

test('deterministic: duplicate involves entries collapse, first-occurrence order preserved', () => {
  const a = resolveInvolves(['ticketing', 'ticketing', 'compression'], capabilities)
  const b = resolveInvolves(['ticketing', 'compression', 'ticketing'], capabilities)
  assert.deepEqual([...a.resolved.keys()], [...b.resolved.keys()])
  assert.deepEqual([...a.resolved.keys()], ['ticketing', 'compression'])
})

test('empty involves is a silent no-op (absence and [] are equivalent, never announced)', () => {
  const announcements: string[] = []
  const result = resolveInvolves([], capabilities, (m) => announcements.push(m))
  assert.equal(result.resolved.size, 0)
  assert.deepEqual(result.unresolved, [])
  assert.equal(announcements.length, 0)
})

test('default reporter is a no-op: zero resolution with no injected reporter writes nothing and returns', () => {
  const result = resolveInvolves(['divination'], {})
  assert.deepEqual(result.unresolved, ['divination'])
})

test('hostile capability names (prototype keys) neither throw nor false-resolve', () => {
  const result = resolveInvolves(['constructor', 'toString', 'hasOwnProperty'], capabilities)
  assert.equal(result.resolved.size, 0)
  assert.deepEqual(result.unresolved, ['constructor', 'toString', 'hasOwnProperty'])
})
