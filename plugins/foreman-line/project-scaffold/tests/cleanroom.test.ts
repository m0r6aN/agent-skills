/**
 * Charter §6 items 6, 7 and §7 criteria 2/4 in regression form:
 *  - generated output passes the spec-linter the scaffold itself wired up,
 *    invoked exactly as the emitted workflow invokes it (per-file over
 *    docs/specs/active and docs/specs/done, with the generated
 *    foreman/config.yaml and an explicit absolute --repo-root);
 *  - the clean-room grep (the only test that actually enforces D8 and D10):
 *    zero hits for the enumerated pattern list over all generated output;
 *  - verification item 8's linter half: `involves: [ticketing]` against an
 *    empty `capabilities:` map passes with no blocking output (D14).
 */
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { applyScaffold, planScaffold } from '../src/generator.js'
import {
  makeTempRoot,
  runSpecLinter,
  scaffoldArgs,
  treeSnapshot,
  writeFixtureSpec,
} from './helpers.js'

/** §7 criterion 4's enumerated pattern list (specified for S6 reproducibility). */
const FORBIDDEN_PATTERNS = [
  'KONE',
  'kaseya',
  'clinton.morgan',
  'atlassian.net',
  'plugins/foreman-line/',
  'skills/goal/',
  'skills/foreman-shaping/',
  'docs/foreman-line/',
]

function lintLikeTheWiredWorkflow(root: string): { status: number; stderr: string } {
  const files: string[] = []
  for (const dir of ['docs/specs/active', 'docs/specs/done']) {
    const absolute = join(root, dir.split('/').join('/'))
    for (const entry of readdirSync(absolute, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith('.md')) files.push(join(absolute, entry.name))
    }
  }
  let status = 0
  let stderr = ''
  for (const file of files.sort()) {
    const result = runSpecLinter([
      'validate',
      '--config',
      join(root, 'foreman', 'config.yaml'),
      '--repo-root',
      root,
      file,
    ])
    if (result.status !== 0) status = result.status
    stderr += result.stderr
  }
  return { status, stderr }
}

test('generated canon passes the spec-linter the scaffold wired up', () => {
  const root = makeTempRoot('scaffold-lint')
  applyScaffold(planScaffold(scaffoldArgs({ targetRoot: root })))
  writeFixtureSpec(root)

  const lint = lintLikeTheWiredWorkflow(root)
  assert.equal(lint.status, 0, `linter must pass; stderr was: ${lint.stderr}`)
})

test('involves: [ticketing] against an empty capability map passes with no blocking output (D14)', () => {
  const root = makeTempRoot('scaffold-involves')
  applyScaffold(planScaffold(scaffoldArgs({ targetRoot: root })))
  const specPath = writeFixtureSpec(root)

  const lint = lintLikeTheWiredWorkflow(root)
  assert.equal(lint.status, 0, `zero resolution must be a no-op; stderr was: ${lint.stderr}`)
  assert.ok(
    !lint.stderr.includes('error'),
    `no blocking output expected; stderr was: ${lint.stderr}`,
  )
  assert.ok(readFileSync(specPath, 'utf8').includes('involves: [ticketing]'))
})

test('clean-room grep: generated output has zero hits for the enumerated pattern list', () => {
  const root = makeTempRoot('scaffold-grep')
  applyScaffold(planScaffold(scaffoldArgs({ targetRoot: root })))

  const offenders: string[] = []
  for (const rel of treeSnapshot(root).keys()) {
    const content = readFileSync(join(root, rel.split('/').join('/')), 'utf8')
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (content.toLowerCase().includes(pattern.toLowerCase())) {
        offenders.push(`${rel}: ${pattern}`)
      }
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `generated output must be free of ${FORBIDDEN_PATTERNS.join(', ')}`,
  )
})
