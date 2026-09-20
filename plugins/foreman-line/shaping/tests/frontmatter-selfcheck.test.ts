/**
 * AC8: the frontmatter self-check REUSES the imported parseFrontmatter +
 * validateSpecFrontmatter from spec-linter. A valid v0.2 draft passes; a draft
 * missing a required field (`risk`) is rejected with the linter's own
 * violation surfaced. The linter is an intentional integration surface for
 * foreman-config, so this test no longer treats its source as frozen.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { checkFrontmatter } from '../src/index.js'
import { CONFORMANT_DRAFT, DRAFT_MISSING_RISK } from './helpers.js'

const specLinterCliPath = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'spec-linter',
  'src',
  'cli.ts',
)

test('AC8: a valid v0.2 draft passes the frontmatter self-check', () => {
  const result = checkFrontmatter(CONFORMANT_DRAFT)
  assert.equal(result.valid, true, JSON.stringify(result.errors))
})

test('AC8: a draft missing the required `risk` field is rejected with the linter violation', () => {
  const result = checkFrontmatter(DRAFT_MISSING_RISK)
  assert.equal(result.valid, false)
  assert.ok(
    result.errors.some((e) => e.includes('risk')),
    `expected a violation mentioning 'risk', got ${JSON.stringify(result.errors)}`,
  )
})

test('AC8: spec-linter integration is present for the config-aware boundary', () => {
  const out = readFileSync(specLinterCliPath, 'utf8')
  assert.ok(
    out.includes('foreman-config'),
    'expected the config-aware linter integration to be present',
  )
})
