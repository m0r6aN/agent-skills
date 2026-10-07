/**
 * P1b AC1/AC2: `assertJqlSafeQuotedLiteral` — the one guarded path for values
 * interpolated as quoted JQL string literals (dispatch_queue).
 *
 * Structure per STANDING-CONSTRAINTS Builder #3: FOUR INDEPENDENT refusal
 * tests, one per refused character (`"`, `\`, newline, tab) — not one test
 * with four assertions — so removing any single refusal clause in the guard
 * fails exactly that character's named test. Each refusal value differs from
 * an accepted base value ONLY by containing the offending character (the
 * reject twin of a demonstrated accept).
 *
 * Accept twins pin the reason the guard exists at all: the `:`-prefixed
 * Atlassian account id (`557058:…` form) is THE regression pin for the colon
 * finding — `assertJqlSafeToken` refuses `:`, so a dual-format account-id
 * population needs this guard, uniformly, with no token-shaped branch.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { assertJqlSafeQuotedLiteral, assertJqlSafeToken } from '../src/jql.js'

/** Accepted base — every refusal value below is this plus exactly one bad char. */
const BASE = 'user.name@example.com'

// ─── Accept twins ─────────────────────────────────────────────────────────────

test('accepts a `:`-prefixed Atlassian account id (regression pin for the colon finding)', () => {
  const colonPrefixedAccountId = '557058:f58131cb-b67c-48f0-b3c1-e6d24a441e3d'
  // The twin premise, demonstrated: the token guard REFUSES this exact value...
  assert.throws(
    () => assertJqlSafeToken(colonPrefixedAccountId, 'dispatchQueue'),
    /assertJqlSafeToken: dispatchQueue .* unsafe character/,
  )
  // ...and the quoted-literal guard accepts it — one uniform path regardless of vintage.
  assert.doesNotThrow(() => assertJqlSafeQuotedLiteral(colonPrefixedAccountId, 'dispatchQueue'))
})

test('accepts a pure 24-hex account id', () => {
  // R3: actual hex. (Atlassian's own doc example ends in 'g' — not propagated.)
  assert.doesNotThrow(() => assertJqlSafeQuotedLiteral('5b10a2844c20165700ede21f', 'dispatchQueue'))
})

test('accepts an email containing @', () => {
  assert.doesNotThrow(() => assertJqlSafeQuotedLiteral(BASE, 'dispatchQueue'))
})

// ─── Four independent refusal tests, one per character ───────────────────────

test('refuses a value containing a double quote (")', () => {
  assert.doesNotThrow(() => assertJqlSafeQuotedLiteral(BASE, 'dispatchQueue'))
  assert.throws(
    () => assertJqlSafeQuotedLiteral(`${BASE}"`, 'dispatchQueue'),
    /assertJqlSafeQuotedLiteral: dispatchQueue .* contains a double quote at index 21/,
  )
})

test('refuses a value containing a backslash (\\)', () => {
  assert.doesNotThrow(() => assertJqlSafeQuotedLiteral(BASE, 'dispatchQueue'))
  assert.throws(
    () => assertJqlSafeQuotedLiteral(`${BASE}\\`, 'dispatchQueue'),
    /assertJqlSafeQuotedLiteral: dispatchQueue .* contains a backslash at index 21/,
  )
})

test('refuses a value containing a newline (0x0A)', () => {
  assert.doesNotThrow(() => assertJqlSafeQuotedLiteral(BASE, 'dispatchQueue'))
  assert.throws(
    () => assertJqlSafeQuotedLiteral(`${BASE}\n`, 'dispatchQueue'),
    /assertJqlSafeQuotedLiteral: dispatchQueue .* contains a newline at index 21/,
  )
})

test('refuses a value containing a tab (0x09)', () => {
  assert.doesNotThrow(() => assertJqlSafeQuotedLiteral(BASE, 'dispatchQueue'))
  assert.throws(
    () => assertJqlSafeQuotedLiteral(`${BASE}\t`, 'dispatchQueue'),
    /assertJqlSafeQuotedLiteral: dispatchQueue .* contains a tab at index 21/,
  )
})

// ─── Beyond the minimum set ───────────────────────────────────────────────────

test('refuses a value containing a carriage return (0x0D)', () => {
  assert.doesNotThrow(() => assertJqlSafeQuotedLiteral(BASE, 'dispatchQueue'))
  assert.throws(
    () => assertJqlSafeQuotedLiteral(`${BASE}\r`, 'dispatchQueue'),
    /assertJqlSafeQuotedLiteral: dispatchQueue .* contains a carriage return at index 21/,
  )
})

test('refuses a value containing NUL (0x00) as a generic control character (R2)', () => {
  assert.doesNotThrow(() => assertJqlSafeQuotedLiteral(BASE, 'dispatchQueue'))
  assert.throws(
    () => assertJqlSafeQuotedLiteral(`${BASE}\x00`, 'dispatchQueue'),
    /assertJqlSafeQuotedLiteral: dispatchQueue .* contains a control character \(0x00\) at index 21/,
  )
})

test('refuses a value containing ESC (0x1B) as a generic control character (R2)', () => {
  assert.doesNotThrow(() => assertJqlSafeQuotedLiteral(BASE, 'dispatchQueue'))
  assert.throws(
    () => assertJqlSafeQuotedLiteral(`${BASE}\x1b`, 'dispatchQueue'),
    /assertJqlSafeQuotedLiteral: dispatchQueue .* contains a control character \(0x1B\) at index 21/,
  )
})

test('refuses a value containing DEL (0x7F) as a generic control character (R2)', () => {
  assert.doesNotThrow(() => assertJqlSafeQuotedLiteral(BASE, 'dispatchQueue'))
  assert.throws(
    () => assertJqlSafeQuotedLiteral(`${BASE}\x7f`, 'dispatchQueue'),
    /assertJqlSafeQuotedLiteral: dispatchQueue .* contains a control character \(0x7F\) at index 21/,
  )
})

test('refuses the empty string', () => {
  assert.throws(
    () => assertJqlSafeQuotedLiteral('', 'dispatchQueue'),
    /assertJqlSafeQuotedLiteral: dispatchQueue must be non-empty/,
  )
})

test('refusal error names the caller-supplied label', () => {
  assert.throws(
    () => assertJqlSafeQuotedLiteral('a"b', 'customLabel'),
    /assertJqlSafeQuotedLiteral: customLabel /,
  )
})
