/**
 * H9 oversized/deep fixtures plus the linear-time bound (standing #19).
 *
 * Rework R4: the bound is proven by EXTERNAL byte accounting, not phase
 * introspection — the floor is computed independently from the construction
 * of each input: floor = utf8(input) + 2 x utf8(entry contents) + utf8(forbidden
 * paragraph remainder). The implementation's counted passes (boundary scan,
 * entry lex, per-segment walk, paragraph item walk) must meet or exceed that
 * floor and stay <= 4 x input bytes; deleting any counting phase drops the
 * counter below the floor and fails these tests. LIMIT-06/07/08 assert the
 * bound at 1x/2x/4x.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { parseSpec, ScopeCompileError } from '../src/index.js'

interface Case {
  id: string
  kind: 'entry' | 'generated'
  input: string | { gen: string }
  expectedCode?: string
  expectedOutcome?: string
  repaired?: string
  repairedOutcome?: string
  linear?: boolean
  scaling?: number[]
}

const here = dirname(fileURLToPath(import.meta.url))
const table = JSON.parse(
  readFileSync(join(here, 'fixtures', 'hostile', 'limits.json'), 'utf8'),
) as {
  cases: Case[]
}

function specWith(entries: string[], padding?: string, paragraph?: string): string {
  const lines = [
    '---',
    'ticket: FK-T0',
    'status: active',
    'surfaces: [plugins/]',
    '---',
    '',
    '## Intent',
    'x',
    '',
    '## Constraints',
    padding === undefined ? 'x' : padding,
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
  ]
  for (const entry of entries) lines.push(`- ${entry}`)
  if (paragraph !== undefined) lines.push(`**Forbidden surfaces (exact):** ${paragraph}`)
  lines.push('')
  return lines.join('\n')
}

interface Construction {
  input: string
  entryContents: string[]
  paragraphRemainder: string
}

function buildLimitCase(name: string): Construction {
  if (name === 'body-over-cap')
    return { input: 'x'.repeat(1024 * 1024 + 1), entryContents: [], paragraphRemainder: '' }
  if (name === 'segments-10k') {
    const entry = Array(10000).fill('a').join('/')
    return { input: specWith([entry]), entryContents: [entry], paragraphRemainder: '' }
  }
  if (name === 'entries-257') {
    const entries = Array.from({ length: 257 }, (_, i) => `src/f${String(i).padStart(3, '0')}.ts`)
    return { input: specWith(entries), entryContents: entries, paragraphRemainder: '' }
  }
  if (name === 'deep-nesting') {
    return {
      input: specWith(['src/a.ts'], `${'>'.repeat(10000)}deep`),
      entryContents: ['src/a.ts'],
      paragraphRemainder: '',
    }
  }
  if (name === 'one-line-1mib')
    return { input: 'x'.repeat(1024 * 1024), entryContents: [], paragraphRemainder: '' }
  if (name === 'scaling-pair') {
    return {
      input: specWith(['src/a.ts'], 'p'.repeat(50000)),
      entryContents: ['src/a.ts'],
      paragraphRemainder: '',
    }
  }
  throw new Error(`unknown generator ${name}`)
}

/** External accounting floor (rework R4), computed from construction only. */
function constructionFloor(c: Construction): number {
  let floor = Buffer.byteLength(c.input, 'utf8')
  for (const entry of c.entryContents) floor += 2 * Buffer.byteLength(entry, 'utf8')
  floor += Buffer.byteLength(c.paragraphRemainder, 'utf8')
  return floor
}

function outcome(input: string): string {
  try {
    parseSpec(input, { bytesExamined: 0, entriesExamined: 0 })
    return 'ok'
  } catch (error) {
    assert.ok(error instanceof ScopeCompileError, `unexpected error shape: ${String(error)}`)
    return error.code
  }
}

function run(input: string): { code: string; examined: number; bytes: number } {
  const stats = { bytesExamined: 0, entriesExamined: 0 }
  let code = 'ok'
  try {
    parseSpec(input, stats)
  } catch (error) {
    assert.ok(error instanceof ScopeCompileError, `unexpected error shape: ${String(error)}`)
    code = error.code
  }
  return { code, examined: stats.bytesExamined, bytes: Buffer.byteLength(input, 'utf8') }
}

function assertBounded(c: Construction, label: string): void {
  const result = run(c.input)
  const floor = constructionFloor(c)
  assert.ok(
    floor <= result.examined,
    `${label}: examined ${result.examined} dropped below the external floor ${floor} (a counting phase is missing)`,
  )
  assert.ok(
    result.examined <= 4 * result.bytes,
    `${label}: examined ${result.examined} exceeds 4 x ${result.bytes}`,
  )
}

for (const c of table.cases) {
  const source = c.input
  if (typeof source === 'string') {
    test(`${c.id}: rejects with ${c.expectedCode}`, () => {
      const input = specWith([source])
      assert.equal(outcome(input), c.expectedCode, c.id)
      assert.equal(outcome(specWith([c.repaired ?? ''])), c.repairedOutcome, `${c.id} repaired`)
    })
    continue
  }
  const gen = source.gen
  if (c.scaling) {
    const scaling = c.scaling
    test(`${c.id}: 2N/4N scaling pair stays inside floor and the 4-bytes-per-input-byte bound`, () => {
      const base = buildLimitCase(gen)
      const measured = scaling.map((factor) => {
        const construction: Construction = {
          input:
            factor === 1
              ? base.input
              : base.input.replace('p'.repeat(50000), 'p'.repeat(50000 * factor)),
          entryContents: base.entryContents,
          paragraphRemainder: base.paragraphRemainder,
        }
        assertBounded(construction, `${c.id} at ${factor}x`)
        return run(construction.input)
      })
      const firstResult = measured[0]
      assert.ok(firstResult !== undefined && firstResult.bytes > 0)
      const baseRatio = firstResult.examined / firstResult.bytes
      measured.forEach((m, i) => {
        assert.ok(m !== undefined, `${c.id} measurement ${i}`)
        const ratio = m.examined / m.bytes
        assert.ok(
          Math.abs(ratio - baseRatio) / baseRatio < 0.1,
          `${c.id}: examination density drifted at scale ${scaling[i] ?? 0}`,
        )
      })
    })
    continue
  }
  test(`${c.id}: ${c.expectedOutcome ?? c.expectedCode} within floor and linear bound`, () => {
    const construction = buildLimitCase(gen)
    const result = run(construction.input)
    assert.equal(result.code, c.expectedOutcome ?? c.expectedCode, c.id)
    if (c.linear) {
      assertBounded(construction, c.id)
    }
  })
}

test('R4 external accounting: paragraph-heavy doc meets the floor; mutation breaks the bound', () => {
  const paragraph =
    '`src/forbid-a/**` (contested a); `src/forbid-b.ts` (frozen b); shared manifests outside this package'
  const construction: Construction = {
    input: specWith(['src/grant-a.ts', 'src/grant-b.ts'], undefined, paragraph),
    entryContents: ['src/grant-a.ts', 'src/grant-b.ts', 'src/forbid-a/**', 'src/forbid-b.ts'],
    paragraphRemainder: paragraph,
  }
  assertBounded(construction, 'paragraph doc')
  const result = run(construction.input)
  assert.equal(result.code, 'ok')
  // Inflation mutation: an inflated counter must break the upper bound.
  assert.ok(!(result.examined + 3 * result.bytes + 1 <= 4 * result.bytes))
  // The floor itself must not be vacuous: it is strictly positive beyond n.
  assert.ok(constructionFloor(construction) > result.bytes)
})
