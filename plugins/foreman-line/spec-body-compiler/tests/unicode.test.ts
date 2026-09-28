/**
 * H6 Unicode hostile fixtures (NFD, bidi override, zero-width, BOM, null,
 * control, DEL, unpaired surrogate, invalid UTF-8 bytes), each with its named
 * dimension mutation.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { parseSpec, ScopeCompileError } from '../src/index.js'

interface Case {
  id: string
  kind: 'entry' | 'bytes'
  input: string | number[]
  expectedCode: string
  repaired: string | number[]
  repairedOutcome: string
}

const here = dirname(fileURLToPath(import.meta.url))
const table = JSON.parse(
  readFileSync(join(here, 'fixtures', 'hostile', 'unicode.json'), 'utf8'),
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

function inputFor(c: Case, key: 'input' | 'repaired'): string | Uint8Array {
  const value = c[key]
  if (c.kind === 'bytes') return new Uint8Array(value as number[])
  return specWith([value as string])
}

function outcome(input: string | Uint8Array): { code: string; entryIndex: number | null } {
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
    const result = outcome(inputFor(c, 'input'))
    assert.equal(result.code, c.expectedCode, c.id)
    if (c.kind === 'entry') {
      assert.equal(typeof result.entryIndex, 'number', `${c.id} carries its entry index`)
    }
    const repaired = outcome(inputFor(c, 'repaired'))
    assert.equal(repaired.code, c.repairedOutcome, `${c.id} repaired`)
    assert.notEqual(repaired.code, c.expectedCode, `${c.id} repair must not fire the named code`)
  })
}
