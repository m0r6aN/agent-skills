/**
 * Charter §6 items 1, 2, 5 and §4.5 completeness: non-destruction,
 * idempotency, and the fixture-project set (empty directory; hand-curated
 * CLAUDE.md; partial canon; complete canon is a no-op).
 */
import assert from 'node:assert/strict'
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { parseForemanConfigYaml, validateForemanConfig } from '../../foreman-config/src/validate.js'
import { applyScaffold, type PlannedFile, planScaffold } from '../src/generator.js'
import { MANAGED_BEGIN, MANAGED_END } from '../src/managed-block.js'
import { ARTIFACTS } from '../src/manifest.js'
import { makeTempRoot, scaffoldArgs, treeSnapshot } from './helpers.js'

const SENTINEL = 'sentinel content — must survive a scaffold run byte-for-byte\n'

function applyOnce(root: string): readonly PlannedFile[] {
  return applyScaffold(planScaffold(scaffoldArgs({ targetRoot: root })))
}

test('an empty target receives the complete §4.5 artifact set', () => {
  const root = makeTempRoot('scaffold-empty')
  const report = applyOnce(root)

  for (const entry of ARTIFACTS) {
    assert.ok(
      treeSnapshot(root).has(entry.target),
      `expected artifact ${entry.target} to exist after scaffold`,
    )
    assert.equal(
      report.find((file) => file.target === entry.target)?.action,
      'create',
      `${entry.target} should be reported created`,
    )
  }
  for (const dir of ['docs/specs/active', 'docs/specs/done']) {
    assert.ok(statSync(join(root, dir)).isDirectory(), `${dir} must exist`)
  }

  const configText = readFileSync(join(root, 'foreman', 'config.yaml'), 'utf8')
  const configResult = validateForemanConfig(parseForemanConfigYaml(configText))
  assert.deepEqual(configResult.errors, [], 'generated config satisfies foreman-config')

  const agents = readFileSync(join(root, 'AGENTS.md'), 'utf8')
  assert.ok(agents.includes(MANAGED_BEGIN) && agents.includes(MANAGED_END))
  assert.ok(agents.includes('## Managed region — resume state'))
})

test('non-destruction: sentinel targets survive byte-identical and are reported skipped (managed block is the documented exception)', () => {
  const root = makeTempRoot('scaffold-sentinels')
  for (const entry of ARTIFACTS) {
    mkdirSync(dirname(join(root, entry.target)), { recursive: true })
    writeFileSync(join(root, entry.target), SENTINEL, 'utf8')
  }

  const report = applyOnce(root)
  for (const entry of ARTIFACTS) {
    const content = readFileSync(join(root, entry.target), 'utf8')
    if (entry.target === 'AGENTS.md') {
      assert.equal(report.find((file) => file.target === entry.target)?.action, 'block-append')
      assert.ok(
        content.startsWith(SENTINEL),
        'AGENTS.md sentinel preserved byte-for-byte as prefix',
      )
      continue
    }
    assert.equal(content, SENTINEL, `${entry.target} sentinel must be byte-identical`)
    assert.equal(
      report.find((file) => file.target === entry.target)?.action,
      'skip-existing',
      `${entry.target} must be reported skipped`,
    )
  }
})

test('idempotency: a second run writes zero bytes and exits clean', () => {
  const root = makeTempRoot('scaffold-idempotent')
  applyOnce(root)
  const before = treeSnapshot(root)

  const second = applyOnce(root)
  const after = treeSnapshot(root)

  assert.deepEqual([...after.entries()].sort(), [...before.entries()].sort(), 'zero bytes written')
  for (const file of second) {
    assert.ok(
      file.action === 'skip-existing' || file.action === 'block-unchanged',
      `${file.target} reported ${file.action} on re-run`,
    )
    assert.equal(file.content, undefined, `${file.target} re-run must carry no content to write`)
  }
})

test('fixture project: hand-curated CLAUDE.md and partial canon survive; only gaps are filled', () => {
  const root = makeTempRoot('scaffold-partial')
  writeFileSync(join(root, 'CLAUDE.md'), 'my own import line\n', 'utf8')
  mkdirSync(join(root, 'foreman'), { recursive: true })
  writeFileSync(join(root, 'foreman', 'config.yaml'), 'identity: hand-written\n', 'utf8')

  const report = applyOnce(root)
  assert.equal(readFileSync(join(root, 'CLAUDE.md'), 'utf8'), 'my own import line\n')
  assert.equal(
    readFileSync(join(root, 'foreman', 'config.yaml'), 'utf8'),
    'identity: hand-written\n',
  )
  assert.equal(report.find((file) => file.target === 'CLAUDE.md')?.action, 'skip-existing')
  assert.equal(
    report.find((file) => file.target === 'foreman/config.yaml')?.action,
    'skip-existing',
  )
  assert.equal(report.find((file) => file.target === 'docs/goals/INDEX.md')?.action, 'create')
})

test('planning writes nothing (dry-run is the default in preflight)', () => {
  const root = makeTempRoot('scaffold-plan-only')
  planScaffold(scaffoldArgs({ targetRoot: root, mode: 'plan' }))
  assert.equal(treeSnapshot(root).size, 0)
})
