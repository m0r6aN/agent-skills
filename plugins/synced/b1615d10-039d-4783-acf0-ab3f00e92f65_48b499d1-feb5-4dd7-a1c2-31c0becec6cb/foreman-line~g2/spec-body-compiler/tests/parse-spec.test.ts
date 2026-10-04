/**
 * H8 missing-authority fixtures (five required sections missing/empty,
 * absent/empty Allowed Files, assertDispatchable refusal) plus frontmatter
 * identity handling and the parse-result contract (surfaces: is opaque audit
 * metadata — D10).
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { assertDispatchable, compileScope, parseSpec, ScopeCompileError } from '../src/index.js'

interface Case {
  id: string
  kind: 'spec'
  input: string
  expectedCode: string
  via?: string
  repaired: string
  repairedOutcome: string
  repairedVia?: string
}

const here = dirname(fileURLToPath(import.meta.url))
const table = JSON.parse(
  readFileSync(join(here, 'fixtures', 'hostile', 'authority.json'), 'utf8'),
) as { cases: Case[] }

function outcome(input: string, via?: string): string {
  try {
    if (via === 'assertDispatchable') {
      const { artifact } = compileScope(input, { specPath: 'docs/specs/t.md' })
      assertDispatchable(artifact)
    } else {
      parseSpec(input, { bytesExamined: 0, entriesExamined: 0 })
    }
    return 'ok'
  } catch (error) {
    assert.ok(error instanceof ScopeCompileError, `unexpected error shape: ${String(error)}`)
    return error.code
  }
}

for (const c of table.cases) {
  test(`${c.id}: rejects with ${c.expectedCode}`, () => {
    assert.equal(outcome(c.input, c.via), c.expectedCode, c.id)
    assert.equal(outcome(c.repaired, c.repairedVia), c.repairedOutcome, `${c.id} repaired`)
  })
}

const FULL = [
  '---',
  'ticket: FK-T0',
  'status: active',
  'surfaces: [plugins/, docs/]',
  '---',
  '',
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
  '## Allowed Files',
  '- src/a.ts',
  '',
].join('\n')

test('parse result surfaces frontmatter identity and opaque audit metadata', () => {
  const parsed = parseSpec(FULL, { bytesExamined: 0, entriesExamined: 0 })
  assert.equal(parsed.ticket, 'FK-T0')
  assert.equal(parsed.surfaces, '[plugins/, docs/]')
  assert.deepEqual(parsed.allowedFiles, ['src/a.ts'])
  assert.equal(parsed.sections.intent.trim(), 'x')
})

test('missing frontmatter ticket key is a compile rejection (registry-closed mapping)', () => {
  const noTicket = FULL.replace('ticket: FK-T0\n', '')
  assert.equal(outcome(noTicket), 'SPEC_SECTION_MISSING')
  const emptyTicket = FULL.replace('ticket: FK-T0', 'ticket:')
  assert.equal(outcome(emptyTicket), 'SPEC_SECTION_EMPTY')
})

test('missing frontmatter block is SPEC_SECTION_MISSING', () => {
  const bare = FULL.slice(FULL.indexOf('## Intent'))
  assert.equal(outcome(bare), 'SPEC_SECTION_MISSING')
})

test('stats counters are carried on the parse result', () => {
  const stats = { bytesExamined: 0, entriesExamined: 0 }
  const parsed = parseSpec(FULL, stats)
  assert.equal(parsed.stats, stats)
  assert.ok(stats.bytesExamined > 0)
  assert.equal(stats.entriesExamined, 1)
})
