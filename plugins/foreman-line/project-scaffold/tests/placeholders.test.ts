/**
 * Charter §6 item 4 — placeholder integrity: an unreplaced `{{...}}` fails
 * the run and no output is written. Substitution applies only to the
 * enumerated token map; everything else copies byte-for-byte.
 */
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { ScaffoldError } from '../src/errors.js'
import { planScaffold } from '../src/generator.js'
import { assertNoUnreplaced, substitute } from '../src/render.js'
import { cloneTemplates, makeTempRoot, scaffoldArgs, treeSnapshot } from './helpers.js'

test('substitution replaces only enumerated tokens', () => {
  const rendered = substitute('name={{PROJECT_NAME}} typo={{TYPO_TOKEN}}', {
    PROJECT_NAME: 'Example Project',
  })
  assert.equal(rendered, 'name=Example Project typo={{TYPO_TOKEN}}')
})

test('unreplaced placeholder check exempts GitHub Actions dollar-brace expressions', () => {
  assert.doesNotThrow(() =>
    // biome-ignore lint/suspicious/noTemplateCurlyInString: deliberate literal GitHub Actions expression under test
    assertNoUnreplaced('repository: ${{ vars.FOREMAN_LINE_REPOSITORY }}', 'workflow.yml'),
  )
  try {
    assertNoUnreplaced('literal {{SURVIVES}} braces', 'docs/specs/INDEX.md')
    assert.fail('expected UNREPLACED_PLACEHOLDER')
  } catch (err) {
    assert.ok(err instanceof ScaffoldError)
    assert.equal(err.code, 'UNREPLACED_PLACEHOLDER')
    assert.equal(err.exitCode, 1)
    assert.deepEqual(err.paths, ['docs/specs/INDEX.md'])
  }
})

test('a typo\u2019d placeholder in a template fails the run and writes nothing', () => {
  const templatesRoot = makeTempRoot('scaffold-typo-templates')
  const templatesDir = cloneTemplates(templatesRoot)
  const indexPath = join(templatesDir, 'spec-index.md')
  writeFileSync(indexPath, `${readFileSync(indexPath, 'utf8')}\ntrailing {{TYPO_HERE}}\n`, 'utf8')

  const targetRoot = makeTempRoot('scaffold-typo-target')
  try {
    planScaffold(scaffoldArgs({ targetRoot, templatesDir }))
    assert.fail('expected UNREPLACED_PLACEHOLDER')
  } catch (err) {
    assert.ok(err instanceof ScaffoldError)
    assert.equal(err.code, 'UNREPLACED_PLACEHOLDER')
    assert.deepEqual(err.paths, ['docs/specs/INDEX.md'])
  }
  assert.equal(treeSnapshot(targetRoot).size, 0, 'no output written on placeholder failure')
})
