/**
 * Collision handling and negative paths: a target that exists where a create
 * was planned is never overwritten (the non-destruction invariant outranks
 * the plan), a path whose type contradicts the plan is a typed refusal, and
 * atomic writes leave no temp debris behind.
 */
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { ScaffoldError } from '../src/errors.js'
import { applyScaffold, planScaffold } from '../src/generator.js'
import { makeTempRoot, scaffoldArgs, treeSnapshot } from './helpers.js'

test('a target path that exists as a directory is a typed PATH_TYPE_CONFLICT and nothing is written', () => {
  const root = makeTempRoot('scaffold-type-conflict')
  mkdirSync(join(root, 'CLAUDE.md'), { recursive: true })
  try {
    planScaffold(scaffoldArgs({ targetRoot: root }))
    assert.fail('expected PATH_TYPE_CONFLICT')
  } catch (err) {
    assert.ok(err instanceof ScaffoldError)
    assert.equal(err.code, 'PATH_TYPE_CONFLICT')
    assert.equal(err.exitCode, 1)
    assert.deepEqual(err.paths, ['CLAUDE.md'])
  }
  assert.equal(treeSnapshot(root).size, 0, 'refusal writes zero bytes')
})

test('a file colliding at apply time is skipped, not overwritten', () => {
  const root = makeTempRoot('scaffold-apply-collision')
  const plan = planScaffold(scaffoldArgs({ targetRoot: root }))
  const late = 'arrived between plan and apply\n'
  writeFileSync(join(root, 'AGENTS.md'), late, 'utf8')

  const report = applyScaffold(plan)
  assert.equal(report.find((file) => file.target === 'AGENTS.md')?.action, 'skip-existing')
  assert.equal(
    treeSnapshot(root).get('AGENTS.md'),
    createHash('sha256').update(late).digest('hex'),
    'late-arriving content survives untouched',
  )
})

test('a directory standing where a file belongs is refused at apply time', () => {
  const root = makeTempRoot('scaffold-dir-conflict')
  writeFileSync(join(root, 'foreman'), 'a file where the foreman/ directory belongs\n', 'utf8')
  const plan = planScaffold(scaffoldArgs({ targetRoot: root }))
  // foreman exists as a FILE, so it is in the dir gap set; apply must refuse.
  try {
    applyScaffold(plan)
    assert.fail('expected PATH_TYPE_CONFLICT')
  } catch (err) {
    assert.ok(err instanceof ScaffoldError)
    assert.equal(err.code, 'PATH_TYPE_CONFLICT')
    assert.equal(err.exitCode, 1)
  }
})

test('atomic writes leave no temp files behind', () => {
  const root = makeTempRoot('scaffold-atomic')
  applyScaffold(planScaffold(scaffoldArgs({ targetRoot: root })))
  for (const path of treeSnapshot(root).keys()) {
    assert.ok(!path.includes('.tmp-'), `temp debris left at ${path}`)
  }
})
