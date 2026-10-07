/**
 * Charter §6 item 3 — managed block, six cases — plus the mandated reviewer
 * focus dimensions: CRLF content outside the markers, a missing trailing
 * newline, and a block appearing mid-file.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ScaffoldError } from '../src/errors.js'
import { MANAGED_BEGIN, MANAGED_END, spliceManagedBlock } from '../src/managed-block.js'

const INNER = 'generated region\nline two'

function assertMalformed(existing: string, shape: string): void {
  try {
    spliceManagedBlock(existing, INNER, 'AGENTS.md')
    assert.fail(`expected MANAGED_BLOCK_MALFORMED for ${shape}`)
  } catch (err) {
    assert.ok(err instanceof ScaffoldError, `${shape}: expected ScaffoldError`)
    assert.equal(err.code, 'MANAGED_BLOCK_MALFORMED', shape)
    assert.equal(err.exitCode, 1, shape)
    assert.deepEqual(err.paths, ['AGENTS.md'], shape)
  }
}

test('managed block: absent markers append at end of file, preserving every existing byte', () => {
  const existing = '# AGENTS.md\n\nhand-curated content\n'
  const result = spliceManagedBlock(existing, INNER, 'AGENTS.md')
  assert.equal(result.action, 'appended')
  assert.ok(result.text.startsWith(existing), 'existing bytes preserved as a prefix')
  assert.ok(result.text.includes(`${MANAGED_BEGIN}\n${INNER}\n${MANAGED_END}`))
})

test('managed block: absent markers on a file with no trailing newline still preserve bytes', () => {
  const existing = 'no trailing newline'
  const result = spliceManagedBlock(existing, INNER, 'AGENTS.md')
  assert.equal(result.action, 'appended')
  assert.ok(result.text.startsWith(`${existing}\n`), 'original bytes preserved before the block')
})

test('managed block: present markers replace strictly between, both sides byte-exact (CRLF sides)', () => {
  const before = 'head\r\nkeep-a\r\n'
  const after = '\r\nkeep-b\r\ntail\r\n'
  const existing = `${before}${MANAGED_BEGIN}\r\nold region\r\n${MANAGED_END}${after}`
  const result = spliceManagedBlock(existing, INNER, 'AGENTS.md')
  assert.equal(result.action, 'replaced')
  assert.ok(result.text.startsWith(before), 'bytes before the begin marker untouched')
  assert.ok(result.text.endsWith(after), 'bytes after the end marker untouched')
  assert.ok(result.text.includes(`${MANAGED_BEGIN}\n${INNER}\n${MANAGED_END}`))
  assert.ok(!result.text.includes('old region'), 'old region content replaced')
})

test('managed block: present markers mid-file preserve the surrounding document exactly', () => {
  const before = 'section one\n\n'
  const after = '\nsection three\n'
  const existing = `${before}${MANAGED_BEGIN}\nstale\n${MANAGED_END}${after}`
  const result = spliceManagedBlock(existing, INNER, 'AGENTS.md')
  assert.equal(result.action, 'replaced')
  assert.equal(result.text, `${before}${MANAGED_BEGIN}\n${INNER}\n${MANAGED_END}${after}`)
})

test('managed block: replacing an identical region reports unchanged (zero-byte idempotency)', () => {
  const existing = `head\n${MANAGED_BEGIN}\n${INNER}\n${MANAGED_END}\ntail\n`
  const result = spliceManagedBlock(existing, INNER, 'AGENTS.md')
  assert.equal(result.action, 'unchanged')
  assert.equal(result.text, existing)
})

test('managed block: begin marker without end marker is a typed refusal', () => {
  assertMalformed(`head\n${MANAGED_BEGIN}\npartial\n`, 'begin-only')
})

test('managed block: end marker without begin marker is a typed refusal', () => {
  assertMalformed(`head\npartial\n${MANAGED_END}\ntail\n`, 'end-only')
})

test('managed block: reversed marker order is a typed refusal', () => {
  assertMalformed(`head\n${MANAGED_END}\nmiddle\n${MANAGED_BEGIN}\ntail\n`, 'reversed')
})

test('managed block: nested markers are a typed refusal', () => {
  assertMalformed(
    `head\n${MANAGED_BEGIN}\na\n${MANAGED_BEGIN}\nb\n${MANAGED_END}\nc\n${MANAGED_END}\ntail\n`,
    'nested',
  )
})
