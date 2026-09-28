/**
 * H3 Windows-specific hostile fixtures (drive/UNC/device namespace/ADS/
 * trailing dot-space/reserved names/8.3 short names), plus the repaired
 * dimension mutations (WIN-02 and WIN-06 deliberately land on the neighbor
 * code their chain position predicts).
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { parseSpec, ScopeCompileError } from '../src/index.js'

interface Case {
  id: string
  kind: string
  input: string
  expectedCode: string
  repaired: string
  repairedOutcome: string
}

const here = dirname(fileURLToPath(import.meta.url))
const table = JSON.parse(
  readFileSync(join(here, 'fixtures', 'hostile', 'windows.json'), 'utf8'),
) as {
  cases: Case[]
}

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
  test(`${c.id}: rejects ${JSON.stringify(c.input)} with ${c.expectedCode}`, () => {
    const result = outcome(specWith([c.input]))
    assert.equal(result.code, c.expectedCode, c.id)
    assert.equal(typeof result.entryIndex, 'number', `${c.id} carries its entry index`)
    const repaired = outcome(specWith([c.repaired]))
    assert.equal(repaired.code, c.repairedOutcome, `${c.id} repaired`)
    assert.notEqual(repaired.code, c.expectedCode, `${c.id} repair must not fire the named code`)
  })
}
