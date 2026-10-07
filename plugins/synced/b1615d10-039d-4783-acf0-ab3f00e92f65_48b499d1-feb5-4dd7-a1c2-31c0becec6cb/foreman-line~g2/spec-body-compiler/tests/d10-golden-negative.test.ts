/**
 * GOLDEN-D10-01 — the D10 golden negative: maximal `surfaces:` plus an empty
 * `## Allowed Files` compiles to an EMPTY mutation set that is never silently
 * widened; `assertDispatchable` refuses with `MISSING_AUTHORITY`. Also proves
 * the invariant mechanically: `surfaces:` cannot widen, select, or validate a
 * mutation path (including via error messages or artifact echoes).
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { assertDispatchable, compileScope, parseSpec, ScopeCompileError } from '../src/index.js'

const here = dirname(fileURLToPath(import.meta.url))
const golden = readFileSync(join(here, 'fixtures', 'golden', 'd10-empty-authority.md'), 'utf8')

function specWithSurfaces(surfaces: string, entries: string[]): string {
  return [
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
    ...entries.map((entry) => `- ${entry}`),
    '',
  ].join('\n')
}

test('GOLDEN-D10-01: maximal surfaces + empty Allowed Files compiles to EMPTY authority', () => {
  const { artifact, compiledScopeDigest } = compileScope(golden, {
    specPath: 'tests/fixtures/golden/d10-empty-authority.md',
  })
  assert.deepEqual(artifact.allowedFiles, [])
  assert.equal(artifact.authorityState, 'empty')
  assert.equal(artifact.compiledScopeDigest, compiledScopeDigest)
  assert.throws(
    () => {
      assertDispatchable(artifact)
    },
    (error: unknown) => {
      assert.ok(error instanceof ScopeCompileError)
      assert.equal(error.code, 'MISSING_AUTHORITY')
      return true
    },
  )
})

test('D10: the artifact contains no surfaces field and echoes no surfaces content', () => {
  const { artifact } = compileScope(golden, { specPath: 'p.md' })
  assert.equal('surfaces' in artifact, false)
  const serialized = JSON.stringify(artifact)
  assert.equal(serialized.includes('surfaces'), false)
  assert.equal(serialized.includes('docs/**'), false)
  assert.equal(serialized.includes('plugins/foreman-line/dispatch/**'), false)
})

test('D10: surfaces: cannot widen, select, or validate a mutation path', () => {
  const minimal = '[plugins/]'
  const maximal =
    '[docs/**, plugins/**, skills/**, apps/**, config/**, plugins/foreman-line/dispatch/**, plugins/foreman-line/kernel-contracts/**]'
  const a = compileScope(specWithSurfaces(minimal, ['src/a.ts']), { specPath: 'p.md' })
  const b = compileScope(specWithSurfaces(maximal, ['src/a.ts']), { specPath: 'p.md' })
  assert.deepEqual(b.artifact.allowedFiles, ['src/a.ts'])
  assert.equal(JSON.stringify(a.artifact), JSON.stringify(b.artifact))
  assert.equal(a.compiledScopeDigest, b.compiledScopeDigest)
})

test('D10: the parse result carries surfaces only as opaque audit metadata', () => {
  const parsed = parseSpec(specWithSurfaces('[docs/**]', ['src/a.ts']), {
    bytesExamined: 0,
    entriesExamined: 0,
  })
  assert.equal(parsed.surfaces, '[docs/**]')
  assert.deepEqual(parsed.allowedFiles, ['src/a.ts'])
})

test('D10: empty-set artifacts are distinguishable from granted at the boundary', () => {
  const empty = compileScope(golden, { specPath: 'p.md' })
  const granted = compileScope(specWithSurfaces('[plugins/]', ['src/a.ts']), { specPath: 'p.md' })
  assert.equal(empty.artifact.authorityState, 'empty')
  assert.equal(granted.artifact.authorityState, 'granted')
  assert.doesNotThrow(() => {
    assertDispatchable(granted.artifact)
  })
  assert.throws(
    () => {
      assertDispatchable(empty.artifact)
    },
    (error: unknown) => error instanceof ScopeCompileError && error.code === 'MISSING_AUTHORITY',
  )
})
