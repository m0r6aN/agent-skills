/**
 * AC1: the schema-enforced concrete-identity rule for `readers` (Constraint 3,
 * Amendment A1). Standing Constraint #3 — each invalid shape gets its own
 * independent test, never one test asserting several properties at once.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { Ajv, type SchemaObject } from 'ajv'
import { contractReaderEntrySchema } from '../src/schema.js'

const here = dirname(fileURLToPath(import.meta.url))
const ajv = new Ajv({ allErrors: true })
const validate = ajv.compile(contractReaderEntrySchema as SchemaObject)

function loadFixture(name: string): unknown {
  return JSON.parse(readFileSync(join(here, 'fixtures', name), 'utf8'))
}

test('valid fixture: bare-string reader shape is accepted', () => {
  assert.ok(validate(loadFixture('valid-string-reader.json')), JSON.stringify(validate.errors))
})

test('valid fixture: parcel-object reader shape is accepted', () => {
  assert.ok(
    validate(loadFixture('valid-parcel-object-reader.json')),
    JSON.stringify(validate.errors),
  )
})

test('A1 negative control: an extensionless concrete reader path is ACCEPTED (proves the replacement fixed the false-rejection the struck heuristic caused)', () => {
  assert.ok(
    validate(loadFixture('valid-extensionless-reader.json')),
    JSON.stringify(validate.errors),
  )
})

test('A1 mechanism (a): a trailing-slash (directory-shaped) reader is rejected, independently of (b)/(c)', () => {
  assert.equal(validate(loadFixture('reject-trailing-slash-reader.json')), false)
})

test('A2(a) mechanism (a), backslash rendering: a trailing-backslash reader is rejected', () => {
  assert.equal(validate(loadFixture('reject-trailing-backslash-reader.json')), false)
})

test('A1 mechanism (b): a glob-metacharacter reader is rejected, independently of (a)/(c)', () => {
  assert.equal(validate(loadFixture('reject-glob-reader.json')), false)
})

test('A1 mechanism (c): a . or .. path-segment reader is rejected, independently of (a)/(b)', () => {
  assert.equal(validate(loadFixture('reject-dot-segment-reader.json')), false)
})

test('A2(a) mechanism (c), backslash rendering: a ..-segment delimited by backslashes is rejected', () => {
  assert.equal(validate(loadFixture('reject-dot-segment-backslash-reader.json')), false)
})

test('A2(a) mechanism (d): an absolute leading-slash reader is rejected', () => {
  assert.equal(validate(loadFixture('reject-absolute-leading-slash-reader.json')), false)
})

test('A2(a) mechanism (d), drive-letter forward-slash rendering: an absolute Windows path is rejected', () => {
  assert.equal(validate(loadFixture('reject-absolute-drive-forwardslash-reader.json')), false)
})

test('A2(a) mechanism (d), drive-letter backslash rendering: an absolute Windows path is rejected', () => {
  assert.equal(validate(loadFixture('reject-absolute-drive-backslash-reader.json')), false)
})

test('A2(a) mechanism (e): a whitespace-only reader is rejected', () => {
  assert.equal(validate(loadFixture('reject-whitespace-reader.json')), false)
})

test('A3(b) mechanism (d), UNC rendering: a leading-UNC reader is rejected, independently of the leading-slash form', () => {
  assert.equal(validate(loadFixture('reject-absolute-unc-reader.json')), false)
})

test('A3(b) mechanism (d), backslash-root rendering: a leading-backslash (non-UNC) reader is rejected', () => {
  assert.equal(validate(loadFixture('reject-absolute-leading-backslash-reader.json')), false)
})

test('A3(c) mechanism (e), leading whitespace: a reader padded with a leading space is rejected', () => {
  assert.equal(validate(loadFixture('reject-leading-whitespace-reader.json')), false)
})

test('A3(c) mechanism (e), trailing whitespace: an otherwise-valid reader padded with a trailing space is rejected', () => {
  assert.equal(validate(loadFixture('reject-trailing-whitespace-reader.json')), false)
})

test('A3(c) mechanism (e), trailing control character: an otherwise-valid reader padded with a trailing tab is rejected', () => {
  assert.equal(validate(loadFixture('reject-trailing-tab-reader.json')), false)
})

test('A3(c) mechanism (e), embedded control character: a reader containing a non-whitespace control character mid-path is rejected', () => {
  assert.equal(validate(loadFixture('reject-control-char-reader.json')), false)
})

test('A3(c) mechanism (e), trailing-separator-plus-space shape: a directory-shaped reader padded with a trailing space is rejected', () => {
  assert.equal(validate(loadFixture('reject-trailing-separator-plus-space-reader.json')), false)
})

test('A3(c) mechanism (e), dot-segment-plus-space shape: a traversal-shaped reader padded with a trailing space is rejected', () => {
  assert.equal(validate(loadFixture('reject-dot-segment-plus-space-reader.json')), false)
})

test('A4(b) mechanism (e), widened control class: a reader containing DEL (U+007F) is rejected — proves ajv compiles `pattern` with the `u` flag so `\\p{Cc}` property escapes work', () => {
  assert.equal(validate(loadFixture('reject-del-reader.json')), false)
})

test('A4(b) mechanism (e), widened control class: a reader containing a C1 control (U+0085) is rejected', () => {
  assert.equal(validate(loadFixture('reject-c1-control-reader.json')), false)
})

test('A4(b) mechanism (e), widened control class: a reader containing a zero-width space (U+200B, `\\p{Cf}`) is rejected', () => {
  assert.equal(validate(loadFixture('reject-zwsp-reader.json')), false)
})

test('A4(b) mechanism (e), widened control class: a reader containing a bidi override (U+202E, `\\p{Cf}`) is rejected', () => {
  assert.equal(validate(loadFixture('reject-bidi-override-reader.json')), false)
})

test('A4(b) negative control, MANDATORY: an interior no-break space (U+00A0) is still ACCEPTED — `\\p{Cf}` does not touch `\\p{Zs}`, and a legitimate filename may contain one', () => {
  assert.ok(
    validate(loadFixture('valid-interior-nbsp-reader.json')),
    JSON.stringify(validate.errors),
  )
})

test('A4(b) negative control: an interior regular space continues to be ACCEPTED', () => {
  assert.ok(
    validate(loadFixture('valid-interior-space-reader.json')),
    JSON.stringify(validate.errors),
  )
})

test('A4(b) negative control: a leading-dot filename (.env.example) continues to be ACCEPTED (not a `.`/`..` traversal segment)', () => {
  assert.ok(validate(loadFixture('valid-dotfile-reader.json')), JSON.stringify(validate.errors))
})

test('A4(b) negative control: a non-ASCII filename (über.md) continues to be ACCEPTED', () => {
  assert.ok(
    validate(loadFixture('valid-unicode-filename-reader.json')),
    JSON.stringify(validate.errors),
  )
})

test('an empty readers array is rejected (minItems: 1)', () => {
  assert.equal(validate({ contract: 'x', readers: [] }), false)
})

test('a parcel-object reader missing files is rejected', () => {
  assert.equal(validate({ contract: 'x', readers: [{ parcelId: 'GSO-P2' }] }), false)
})

test('a parcel-object reader with an empty files array is rejected (minItems: 1)', () => {
  assert.equal(validate({ contract: 'x', readers: [{ parcelId: 'GSO-P2', files: [] }] }), false)
})

test('an unknown top-level field is rejected (strict, additionalProperties: false)', () => {
  assert.equal(validate({ contract: 'x', readers: ['a.ts'], notAField: true }), false)
})
