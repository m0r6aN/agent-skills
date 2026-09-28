/**
 * AC1: mechanical proof that `README.md`'s D1-D37 reconciliation table has
 * exactly one row per decision ID D1 through D37 -- no gap, no duplicate,
 * no row citing an ID outside that range. This is the test the kickstarter
 * requires be watched failing before it is made to pass (it fails at
 * `README.md`-does-not-exist-yet, then again on any deliberately broken
 * table, before the real table makes it pass).
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const readmePath = join(dirname(fileURLToPath(import.meta.url)), '..', 'README.md')

function extractRowIds(markdown: string): string[] {
  const rowPattern = /^\|\s*(D\d+)\s*\|/gm
  const ids: string[] = []
  for (const match of markdown.matchAll(rowPattern)) {
    ids.push(match[1] as string)
  }
  return ids
}

test('README ships and contains a reconciliation table', () => {
  const markdown = readFileSync(readmePath, 'utf8')
  assert.ok(markdown.length > 0, 'README.md must not be empty')
})

test('AC1: reconciliation table row IDs are exactly {D1, ..., D37}, no gap, no duplicate', () => {
  const markdown = readFileSync(readmePath, 'utf8')
  const ids = extractRowIds(markdown)

  const expected = Array.from({ length: 37 }, (_, i) => `D${i + 1}`)

  assert.equal(ids.length, 37, `expected exactly 37 rows, found ${ids.length}: ${ids.join(', ')}`)

  const idSet = new Set(ids)
  assert.equal(idSet.size, ids.length, 'duplicate decision ID row detected')

  const missing = expected.filter((id) => !idSet.has(id))
  assert.deepEqual(missing, [], `missing decision rows: ${missing.join(', ')}`)

  const extra = ids.filter((id) => !expected.includes(id))
  assert.deepEqual(extra, [], `row(s) cite an ID outside D1-D37: ${extra.join(', ')}`)
})
