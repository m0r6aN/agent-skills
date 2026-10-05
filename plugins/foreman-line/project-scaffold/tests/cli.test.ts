/**
 * CLI contract: typed arguments, per-field allowlist refusals, credential
 * refusal at the input boundary (never in logs/keys/artifacts), usage errors,
 * the exit-code contract, and plan-as-default. The hostile-value cases double
 * as the proof that user arguments can never interpolate into executable
 * JavaScript: every such value is refused by charset before it can reach a
 * placeholder, marker, or path position.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { makeTempRoot, runScaffoldCli, TEMPLATES_DIR, treeSnapshot } from './helpers.js'

function requiredArgs(target: string): string[] {
  return [
    '--project-name',
    'Example Project',
    '--slug',
    'example-project',
    '--base-branch',
    'main',
    '--branch-prefix',
    'work/',
    '--worktree-root',
    '.worktrees',
    '--target',
    target,
    '--templates',
    TEMPLATES_DIR,
  ]
}

test('missing required input is a usage error (exit 2), never a guess', () => {
  const result = runScaffoldCli(['plan', '--slug', 'example-project'])
  assert.equal(result.status, 2)
  assert.ok(result.stderr.includes('usage: project-scaffold'))
})

test('a relative --target root is refused (exit 2), never anchored to the working directory', () => {
  const args = requiredArgs(makeTempRoot('scaffold-relative-target'))
  args[args.indexOf('--target') + 1] = join('relative', 'target')
  const result = runScaffoldCli(['plan', ...args])
  assert.equal(result.status, 2)
  assert.ok(result.stderr.includes('--target'))
  assert.ok(result.stderr.includes('is not an absolute path'))
})

test('a relative --templates root is refused (exit 2), never anchored to the working directory', () => {
  const target = makeTempRoot('scaffold-relative-templates')
  const args = requiredArgs(target)
  args[args.indexOf('--templates') + 1] = join('relative', 'templates')
  const result = runScaffoldCli(['plan', ...args])
  assert.equal(result.status, 2)
  assert.ok(result.stderr.includes('--templates'))
  assert.ok(result.stderr.includes('is not an absolute path'))
  assert.equal(treeSnapshot(target).size, 0, 'refusal writes nothing')
})

test('a missing --templates root is a usage error (exit 2), never a module-location default', () => {
  const target = makeTempRoot('scaffold-missing-templates')
  const args = requiredArgs(target)
  args.splice(args.indexOf('--templates'), 2)
  const result = runScaffoldCli(['plan', ...args])
  assert.equal(result.status, 2)
  assert.ok(result.stderr.includes('missing required argument --templates'))
  assert.equal(treeSnapshot(target).size, 0, 'refusal writes nothing')
})

test('unknown flags and repeated flags are usage errors (exit 2)', () => {
  const target = makeTempRoot('scaffold-unknown-flag')
  const unknown = runScaffoldCli([...requiredArgs(target), '--frobnicate', 'x'])
  assert.equal(unknown.status, 2)
  const repeated = runScaffoldCli([...requiredArgs(target), '--project-name', 'Other Name'])
  assert.equal(repeated.status, 2)
})

test('plan is the default mode and writes nothing', () => {
  const target = makeTempRoot('scaffold-plan-default')
  const result = runScaffoldCli(requiredArgs(target))
  assert.equal(result.status, 0)
  assert.ok(result.stdout.includes('nothing written (dry-run)'))
  assert.equal(treeSnapshot(target).size, 0)
})

test('apply creates the artifact set and reports every path', () => {
  const target = makeTempRoot('scaffold-apply-cli')
  const result = runScaffoldCli(['apply', ...requiredArgs(target)])
  assert.equal(result.status, 0)
  assert.ok(result.stdout.includes('create\tforeman/config.yaml'))
  assert.ok(result.stdout.includes('applied:'))
  assert.ok(treeSnapshot(target).has('foreman/config.yaml'))
})

test('a slug outside its character allowlist is refused (exit 1)', () => {
  const target = makeTempRoot('scaffold-bad-slug')
  const args = requiredArgs(target)
  args[args.indexOf('--slug') + 1] = 'bad slug!'
  const result = runScaffoldCli(['plan', ...args])
  assert.equal(result.status, 1)
  assert.ok(result.stderr.includes('[VALUE_REFUSED]'))
  assert.equal(treeSnapshot(target).size, 0)
})

test('dispatch-queue refuses quote, backslash, newline, and tab independently (exit 1 each)', () => {
  for (const hostile of ['a"b', 'a\\b', 'a\nb', 'a\tb']) {
    const target = makeTempRoot('scaffold-hostile-dq')
    const result = runScaffoldCli(['plan', ...requiredArgs(target), '--dispatch-queue', hostile])
    assert.equal(result.status, 1, `hostile ${JSON.stringify(hostile)} must be refused`)
    assert.ok(result.stderr.includes('[VALUE_REFUSED]'))
    assert.equal(treeSnapshot(target).size, 0)
  }
})

test('code-shaped project names are refused before they can reach any output position', () => {
  const target = makeTempRoot('scaffold-injection')
  const args = requiredArgs(target)
  args[args.indexOf('--project-name') + 1] = 'x"; require("fs").writeFileSync("pwned", "x")'
  const result = runScaffoldCli(['plan', ...args])
  assert.equal(result.status, 1)
  assert.equal(treeSnapshot(target).size, 0)
})

test('a credential-shaped value is refused (exit 3) and never appears in logs or artifacts', () => {
  const target = makeTempRoot('scaffold-credential')
  const secret = 'ghp_abcdefghijklmnopqrstuvwxyz012345'
  const result = runScaffoldCli(['plan', ...requiredArgs(target), '--project-key', secret])
  assert.equal(result.status, 3)
  assert.ok(result.stderr.includes('[CREDENTIAL_INPUT_REFUSED]'))
  assert.ok(!result.stdout.includes(secret), 'credential absent from stdout')
  assert.ok(!result.stderr.includes(secret), 'credential absent from stderr')
  assert.equal(treeSnapshot(target).size, 0, 'credential refusal writes nothing')
})

test('generated config carries the typed identity values, never raw interpolation', () => {
  const target = makeTempRoot('scaffold-identity')
  const result = runScaffoldCli([
    'apply',
    ...requiredArgs(target),
    '--project-key',
    'PROJKEY',
    '--dispatch-queue',
    '557058:f58131cb-b67c-48f0-b3c1-e6d24a441e3d',
  ])
  assert.equal(result.status, 0)
  const config = readFileSync(join(target, 'foreman', 'config.yaml'), 'utf8')
  assert.ok(config.includes('"PROJKEY"'), 'string values land as YAML-quoted scalars')
  assert.ok(config.includes('"557058:f58131cb-b67c-48f0-b3c1-e6d24a441e3d"'))
  assert.ok(config.includes('branch_prefix: "work/"'))
})
