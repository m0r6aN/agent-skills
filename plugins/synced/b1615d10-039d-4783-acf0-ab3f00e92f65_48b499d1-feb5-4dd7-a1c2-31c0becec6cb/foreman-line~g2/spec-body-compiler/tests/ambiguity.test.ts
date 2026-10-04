/**
 * H7 ambiguity fixtures (duplicated sections, glob entries, empty/whitespace
 * entries, malformed entry lines) plus named sub-shape probes for every
 * MALFORMED_ENTRY dimension the precedence chain lists (non-bullet junk,
 * backtick/`**` leakage, URI-scheme shape) — each dimension independently.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { parseSpec, ScopeCompileError } from '../src/index.js'

interface Case {
  id: string
  kind: 'entry' | 'spec'
  input: string
  expectedCode: string
  repaired: string
  repairedOutcome: string
}

const here = dirname(fileURLToPath(import.meta.url))
const table = JSON.parse(
  readFileSync(join(here, 'fixtures', 'hostile', 'ambiguity.json'), 'utf8'),
) as { cases: Case[] }

const FRONTMATTER = [
  '---',
  'ticket: FK-T0',
  'status: active',
  'surfaces: [plugins/]',
  '---',
  '',
].join('\n')
const BODY = [
  '## Intent',
  'x',
  '',
  '## Constraints',
  'x',
  '',
  '## Acceptance Criteria',
  'x',
  '',
  '## Out of Scope',
  'x',
  '',
  '## Context & References',
  'x',
  '',
].join('\n')

function specWith(entries: string[]): string {
  const lines = [FRONTMATTER, BODY, '## Allowed Files']
  for (const entry of entries) lines.push(`- ${entry}`)
  lines.push('')
  return lines.join('\n')
}

function outcome(input: string): { code: string; entryIndex: number | null } {
  try {
    parseSpec(input, { bytesExamined: 0, entriesExamined: 0 })
    return { code: 'ok', entryIndex: null }
  } catch (error) {
    assert.ok(error instanceof ScopeCompileError, `unexpected error shape: ${String(error)}`)
    return { code: error.code, entryIndex: error.entryIndex }
  }
}

for (const c of table.cases) {
  test(`${c.id}: rejects with ${c.expectedCode}`, () => {
    const input = c.kind === 'spec' ? c.input : specWith([c.input])
    const result = outcome(input)
    assert.equal(result.code, c.expectedCode, c.id)
    const repairedInput = c.kind === 'spec' ? c.repaired : specWith([c.repaired])
    const repaired = outcome(repairedInput)
    assert.equal(repaired.code, c.repairedOutcome, `${c.id} repaired`)
    assert.notEqual(repaired.code, c.expectedCode, `${c.id} repair must not fire the named code`)
  })
}

test('MALFORMED_ENTRY sub-shape: non-bullet junk line in Allowed Files', () => {
  const lines = [
    FRONTMATTER,
    BODY,
    '## Allowed Files',
    'Proposed ceiling, inactive:',
    '- src/a.ts',
    '',
  ]
  assert.equal(outcome(lines.join('\n')).code, 'MALFORMED_ENTRY')
})

test('MALFORMED_ENTRY sub-shape: bold-marker `**` leakage is junk, not a glob entry', () => {
  assert.equal(outcome(specWith(['**src/a.ts**'])).code, 'MALFORMED_ENTRY')
})

test('MALFORMED_ENTRY sub-shape: URI-scheme shapes beyond URLs', () => {
  assert.equal(outcome(specWith(['file://x/y'])).code, 'MALFORMED_ENTRY')
  assert.equal(outcome(specWith(['git+ssh://host/x'])).code, 'MALFORMED_ENTRY')
})

test('MALFORMED_ENTRY sub-shape: backtick leakage', () => {
  assert.equal(outcome(specWith(['src/`a`.ts'])).code, 'MALFORMED_ENTRY')
})

test('GLOB_ENTRY sub-shape: lone trailing `**` scope form is a glob on the grant side', () => {
  assert.equal(outcome(specWith(['src/**'])).code, 'GLOB_ENTRY')
})

test('single-letter scheme-looking entry falls to drive/colon handling, not MALFORMED', () => {
  assert.equal(outcome(specWith(['a://x'])).code, 'ENTRY_ABSOLUTE')
})
