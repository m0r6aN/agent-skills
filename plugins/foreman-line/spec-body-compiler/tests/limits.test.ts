/**
 * H9 oversized/deep fixtures plus the linear-time bound (standing #19):
 * LIMIT-06/07/08 assert `stats.bytesExamined <= 4 x input bytes` on hostile
 * input at 1x/2x/4x, and the bound-check itself is shown non-vacuous by a
 * counter mutation (failing-when-broken, #32).
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

const FRONTMATTER = [
  '---',
  'ticket: FK-T0',
  'status: active',
  'surfaces: [plugins/]',
  '---',
  '',
].join('\n')
function specWith(entries: string[], padding?: string): string {
  const lines = [
    FRONTMATTER,
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
  lines.push('')
  return lines.join('\n')
}

function generate(name: string): string {
  if (name === 'body-over-cap') return 'x'.repeat(1024 * 1024 + 1)
  if (name === 'segments-10k') return specWith([Array(10000).fill('a').join('/')])
  if (name === 'entries-257') {
    return specWith(Array.from({ length: 257 }, (_, i) => `src/f${String(i).padStart(3, '0')}.ts`))
  }
  if (name === 'deep-nesting') {
    return specWith(['src/a.ts'], `${'>'.repeat(10000)}deep`)
  }
  if (name === 'one-line-1mib') return 'x'.repeat(1024 * 1024)
  if (name === 'scaling-pair') return specWith(['src/a.ts'], 'p'.repeat(50000))
  throw new Error(`unknown generator ${name}`)
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

function withinBound(examined: number, bytes: number): boolean {
  return examined <= 4 * bytes
}

for (const c of table.cases) {
  if (c.kind !== 'generated') {
    test(`${c.id}: rejects with ${c.expectedCode}`, () => {
      const input = specWith([c.input as string])
      assert.equal(outcome(input), c.expectedCode, c.id)
      assert.equal(outcome(specWith([c.repaired as string])), c.repairedOutcome, `${c.id} repaired`)
    })
    continue
  }
  if (c.scaling) {
    const scaling = c.scaling
    test(`${c.id}: 2N/4N scaling pair stays inside the 4-bytes-per-input-byte bound`, () => {
      const base = generate((c.input as { gen: string }).gen)
      const measured = scaling.map((factor) => {
        const input =
          factor === 1 ? base : base.replace('p'.repeat(50000), 'p'.repeat(50000 * factor))
        const result = run(input)
        assert.ok(withinBound(result.examined, result.bytes), `${c.id} at ${factor}x`)
        return result
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
  test(`${c.id}: ${c.expectedOutcome ?? c.expectedCode} within the linear bound`, () => {
    const input = generate((c.input as { gen: string }).gen)
    const result = run(input)
    assert.equal(result.code, c.expectedOutcome ?? c.expectedCode, c.id)
    if (c.linear) {
      assert.ok(withinBound(result.examined, result.bytes), `${c.id} bound`)
    }
  })
}

test('bound check is non-vacuous: a mutated counter must fail it (failing-when-broken)', () => {
  const input = generate('deep-nesting')
  const result = run(input)
  assert.ok(withinBound(result.examined, result.bytes))
  const mutated = result.examined + 3 * result.bytes + 1
  assert.equal(withinBound(mutated, result.bytes), false)
})
