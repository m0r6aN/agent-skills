import assert from 'node:assert/strict'
import test from 'node:test'
import { createOpenCodeGoWireV1 } from '../src/pmc-launch/opencode-go-wire.js'

const valid = () => ({
  version: 'opencode-go-no-tools-wire/v1',
  requestDigest: 'a'.repeat(64),
  decisionDigest: 'b'.repeat(64),
  sessionId: 'session-1',
  system: 'system prompt',
  user: 'user text',
})

test('wire renders the fixed no-tools profile and privately binds copied bytes', () => {
  const wire = createOpenCodeGoWireV1()
  const input = valid()
  const result = wire.prepare(input)
  if (!result.ok) throw new Error('valid fixture refused')
  assert.equal(result.bodyDigest.length, 64)
  input.user = 'mutated later'
  assert.equal(wire.prepare({ ...valid(), user: 'x'.repeat(5000) }).ok, false)
})

test('wire rejects accessors, custom prototypes, symbols, keys, invalid ids and malformed Unicode', () => {
  const wire = createOpenCodeGoWireV1()
  const accessor = valid() as Record<string, unknown>
  Object.defineProperty(accessor, 'user', {
    enumerable: true,
    get() {
      throw new Error('must not run')
    },
  })
  assert.equal(wire.prepare(accessor).ok, false)
  assert.equal(wire.prepare(Object.assign(Object.create({ inherited: true }), valid())).ok, false)
  assert.equal(wire.prepare({ ...valid(), extra: true }).ok, false)
  assert.equal(wire.prepare({ ...valid(), [Symbol('x')]: 1 }).ok, false)
  assert.equal(wire.prepare({ ...valid(), sessionId: '../bad' }).ok, false)
  assert.equal(wire.prepare({ ...valid(), system: '\ud800' }).ok, false)
  assert.equal(wire.prepare({ ...valid(), requestDigest: 'A'.repeat(64) }).ok, false)
  assert.equal(wire.prepare({ ...valid(), user: 'x'.repeat(1_000_000) }).ok, false)
  assert.equal(wire.prepare({ ...valid(), requestDigest: 'a'.repeat(1_000_000) }).ok, false)
})

test('wire rejects an oversized rendered-message value and empty messages', () => {
  const wire = createOpenCodeGoWireV1()
  assert.deepEqual(wire.prepare({ ...valid(), user: 'x'.repeat(4096) }), {
    ok: false,
    code: 'BOUNDS_REFUSED',
  })
  assert.deepEqual(wire.prepare({ ...valid(), system: '', user: 'x' }), {
    ok: false,
    code: 'INPUT_REFUSED',
  })
})
