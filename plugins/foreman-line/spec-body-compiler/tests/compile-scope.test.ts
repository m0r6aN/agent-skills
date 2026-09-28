/**
 * Compiled-scope assembly: positive fixtures (POS-01…POS-04), the H5/H10
 * cross-entry tables, the closed artifact shape, and one test per precedence
 * edge proving the documented first-failure order is what actually fires.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  assertDispatchable,
  compileScope,
  parseSpec,
  SCOPE_COMPILE_ERROR_CODES,
  ScopeCompileError,
} from '../src/index.js'

interface Case {
  id: string
  kind: string
  input: unknown
  expectedCode: string
  repaired: unknown
  repairedOutcome: string
}

const here = dirname(fileURLToPath(import.meta.url))
const fixturePath = (...parts: string[]) => join(here, 'fixtures', ...parts)
const equivalent = JSON.parse(readFileSync(fixturePath('hostile', 'equivalent.json'), 'utf8')) as {
  cases: Case[]
}
const conflicts = JSON.parse(readFileSync(fixturePath('hostile', 'conflicts.json'), 'utf8')) as {
  cases: Array<{
    id: string
    input: { entries: string[]; paragraph: string }
    expectedCode: string
    repaired: { entries: string[]; paragraph: string }
    repairedOutcome: string
  }>
}

function specWith(entries: string[], paragraph?: string, surfaces = '[plugins/]'): string {
  const lines = [
    '---',
    'ticket: FK-T0',
    'status: active',
    `surfaces: ${surfaces}`,
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
  ]
  for (const entry of entries) lines.push(`- ${entry}`)
  if (paragraph !== undefined) lines.push(`**Forbidden surfaces (exact):** ${paragraph}`)
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

const EQUIV_INDEX: Record<string, number> = {
  'EQUIV-01': 1,
  'EQUIV-02': 0,
  'EQUIV-03': 0,
  'EQUIV-04': 0,
  'EQUIV-05': 1,
  'EQUIV-06': 1,
  'EQUIV-07': 1,
}

for (const c of equivalent.cases) {
  test(`${c.id}: rejects with ${c.expectedCode} at its entry index`, () => {
    const result = outcome(specWith(c.input as string[]))
    assert.equal(result.code, c.expectedCode, c.id)
    assert.equal(result.entryIndex, EQUIV_INDEX[c.id], `${c.id} entry index`)
    const repaired = outcome(specWith(c.repaired as string[]))
    assert.equal(repaired.code, c.repairedOutcome, `${c.id} repaired`)
    assert.notEqual(repaired.code, c.expectedCode, `${c.id} repair must not fire the named code`)
  })
}

for (const c of conflicts.cases) {
  test(`${c.id}: rejects with ${c.expectedCode}`, () => {
    assert.equal(outcome(specWith(c.input.entries, c.input.paragraph)).code, c.expectedCode, c.id)
    const repaired = outcome(specWith(c.repaired.entries, c.repaired.paragraph))
    assert.equal(repaired.code, c.repairedOutcome, `${c.id} repaired`)
    assert.notEqual(repaired.code, c.expectedCode, `${c.id} repair must not fire the named code`)
  })
}

test('POS-01: minimal dispatchable compiles to a granted single-entry set', () => {
  const source = readFileSync(fixturePath('positive', 'pos-01-minimal.md'), 'utf8')
  const { artifact, compiledScopeDigest } = compileScope(source, {
    specPath: 'tests/fixtures/positive/pos-01-minimal.md',
  })
  assert.deepEqual(artifact.allowedFiles, ['plugins/example-pos-01/a.ts'])
  assert.equal(artifact.authorityState, 'granted')
  assert.deepEqual(artifact.frozenSurfaces, [])
  assert.deepEqual(artifact.forbiddenSurfaces, [])
  assert.equal(artifact.compiledScopeDigest, compiledScopeDigest)
  assert.doesNotThrow(() => {
    assertDispatchable(artifact)
  })
})

test('POS-02: unsorted entries compile to sorted lists; the corpus paragraph maps per flag C', () => {
  const source = readFileSync(fixturePath('positive', 'pos-02-multi-entry.md'), 'utf8')
  const { artifact } = compileScope(source, {
    specPath: 'tests/fixtures/positive/pos-02-multi-entry.md',
  })
  assert.deepEqual(artifact.allowedFiles, ['plugins/a/a.ts', 'plugins/a/c.ts', 'plugins/z/b.ts'])
  assert.deepEqual(artifact.frozenSurfaces, ['plugins/frz/**'])
  assert.deepEqual(artifact.forbiddenSurfaces, ['plugins/contested/**'])
})

test('POS-03: maximal v0.2+v0.4 frontmatter compiles; identity stays ticket + specPath only', () => {
  const source = readFileSync(fixturePath('positive', 'pos-03-maximal-frontmatter.md'), 'utf8')
  const { artifact } = compileScope(source, {
    specPath: 'tests/fixtures/positive/pos-03-maximal-frontmatter.md',
  })
  assert.equal(artifact.spec.ticket, 'FK-POS-03')
  assert.deepEqual(Object.keys(artifact.spec).sort(), ['specPath', 'ticket'])
  assert.deepEqual(artifact.allowedFiles, [
    'plugins/example-pos-03/a.ts',
    'plugins/example-pos-03/b.ts',
  ])
})

test('POS-04: granted set equals exactly the Allowed Files entries under maximal surfaces:', () => {
  const source = readFileSync(fixturePath('positive', 'pos-04-surfaces-not-authority.md'), 'utf8')
  const { artifact } = compileScope(source, {
    specPath: 'tests/fixtures/positive/pos-04-surfaces-not-authority.md',
  })
  assert.deepEqual(artifact.allowedFiles, [
    'plugins/example-pos-04/a.ts',
    'plugins/example-pos-04/b.ts',
  ])
})

test('artifact document is the closed shape with the pinned grammar binding', () => {
  const source = readFileSync(fixturePath('positive', 'pos-01-minimal.md'), 'utf8')
  const { artifact } = compileScope(source, { specPath: 'p.md' })
  assert.equal(artifact.artifactVersion, '0.1.0')
  assert.equal(artifact.grammar.convention, 'SPEC-CONVENTION')
  assert.equal(artifact.grammar.schemaRevision, 'v0.4')
  assert.equal(artifact.grammar.revisionDate, '2026-09-27')
  assert.match(artifact.grammar.sectionDigest, /^sha256:[0-9a-f]{64}$/)
  assert.match(artifact.grammar.fileDigest, /^sha256:[0-9a-f]{64}$/)
  assert.match(artifact.compiledScopeDigest, /^sha256:[0-9a-f]{64}$/)
  assert.deepEqual(Object.keys(artifact).sort(), [
    'allowedFiles',
    'artifactVersion',
    'authorityState',
    'compiledScopeDigest',
    'forbiddenSurfaces',
    'frozenSurfaces',
    'grammar',
    'spec',
  ])
  assert.equal(SCOPE_COMPILE_ERROR_CODES.length, 35)
})

test('precedence edge 1->2: body cap fires before entry shape', () => {
  assert.equal(outcome('x'.repeat(1024 * 1024 + 1)).code, 'BODY_TOO_LARGE')
})

test('precedence edge 2->3: entry shape fires before charset', () => {
  const junk = `\`${'a'}${String.fromCharCode(0x00)}b\``
  assert.equal(outcome(specWith([junk])).code, 'MALFORMED_ENTRY')
})

test('precedence edge 3->4: charset fires before encoded escape', () => {
  const entry = `a${String.fromCharCode(0x00)}b%2e`
  assert.equal(outcome(specWith([entry])).code, 'ENTRY_NULL_BYTE')
})

test('precedence edge 4->5: encoded escape fires before absolute form', () => {
  assert.equal(outcome(specWith(['/%2e%2e/x'])).code, 'ENTRY_ENCODED_ESCAPE')
})

test('precedence edge 5->6: absolute form fires before backslash separator', () => {
  assert.equal(outcome(specWith(['\\\\a\\b'])).code, 'ENTRY_ABSOLUTE')
})

test('precedence edge 6->7: backslash fires before glob metacharacter', () => {
  assert.equal(outcome(specWith(['a\\*'])).code, 'ENTRY_BACKSLASH')
})

test('precedence edge 7->8: glob fires before traversal segment', () => {
  assert.equal(outcome(specWith(['*/..'])).code, 'GLOB_ENTRY')
})

test('precedence edge 8-intra: within a segment the listed check order wins', () => {
  assert.equal(outcome(specWith(['PROGRA~1.'])).code, 'ENTRY_SHORT_NAME')
})

test('precedence edge 8-intra: segment order wins across segments', () => {
  assert.equal(outcome(specWith(['x./PROGRA~1'])).code, 'ENTRY_TRAILING_DOT_SPACE')
})

test('precedence edge 8->9: per-segment failure fires before entry-level caps', () => {
  const entry = `a./${'b/'.repeat(64)}c`
  assert.equal(outcome(specWith([entry])).code, 'ENTRY_TRAILING_DOT_SPACE')
})

test('precedence edge 9->10: entry-level cap fires before the body count cap', () => {
  const long = Array(8).fill('a'.repeat(70)).join('/')
  const entries = [
    long,
    ...Array.from({ length: 256 }, (_, i) => `src/g${String(i).padStart(3, '0')}.ts`),
  ]
  assert.equal(outcome(specWith(entries)).code, 'ENTRY_TOO_LONG')
})

test('precedence edge 10->11: the count cap fires before cross-entry checks', () => {
  const entries = Array.from({ length: 257 }, (_, i) => `src/h${String(i).padStart(3, '0')}.ts`)
  entries[200] = entries[10] as string
  assert.equal(outcome(specWith(entries)).code, 'TOO_MANY_ENTRIES')
})

test('precedence edge 11-intra: duplicate fires before allow/deny conflict', () => {
  const result = outcome(specWith(['src/a.ts', 'src/a.ts'], '`src/a.ts` (contested)'))
  assert.equal(result.code, 'ENTRY_DUPLICATE')
})
