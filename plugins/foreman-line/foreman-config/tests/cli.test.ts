/**
 * AC8: the `validate <path>` CLI's PCC-P0 exit-code contract (0 valid,
 * 1 validation failure, 2 usage error), exercised as a real subprocess.
 * Output is captured in full before `status` is read (defects_lessons #11 —
 * never truncate a pipeline whose exit code is under test). The config path
 * is an explicit argument in every case — there is no implicit-lookup mode
 * to test because none exists.
 */
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const fixturesDir = join(packageRoot, 'tests', 'fixtures')
const tsxCli = join(packageRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs')

function runCli(args: readonly string[]): {
  status: number | null
  stderr: string
  stdout: string
} {
  const result = spawnSync(process.execPath, [tsxCli, 'src/cli.ts', ...args], {
    cwd: packageRoot,
    encoding: 'utf8',
  })
  return { status: result.status, stderr: result.stderr, stdout: result.stdout }
}

test('exit 0 on the full vite accept fixture', () => {
  const { status, stderr } = runCli(['validate', join(fixturesDir, 'accept-vite-full.yaml')])
  assert.equal(status, 0, stderr)
})

test('exit 0 on the stack: none accept fixture', () => {
  const { status, stderr } = runCli(['validate', join(fixturesDir, 'accept-stack-none.yaml')])
  assert.equal(status, 0, stderr)
})

test('exit 1 on the omitted-stack reject fixture (D26), violation on stderr', () => {
  const { status, stderr } = runCli(['validate', join(fixturesDir, 'reject-omitted-stack.yaml')])
  assert.equal(status, 1)
  assert.ok(stderr.includes('stack'), stderr)
})

test('exit 1 on the missing-surfaces_present reject fixture (D28a), violation on stderr', () => {
  const { status, stderr } = runCli([
    'validate',
    join(fixturesDir, 'reject-missing-surfaces-present.yaml'),
  ])
  assert.equal(status, 1)
  assert.ok(stderr.includes('surfaces_present'), stderr)
})

test('exit 1 on the unknown-profile reject fixture (D28b), violation on stderr', () => {
  const { status, stderr } = runCli(['validate', join(fixturesDir, 'reject-unknown-profile.yaml')])
  assert.equal(status, 1)
  assert.ok(stderr.includes('/stack/profile'), stderr)
})

test('exit 1 on the unknown-top-level-key reject fixture, violation names the key', () => {
  const { status, stderr } = runCli([
    'validate',
    join(fixturesDir, 'reject-unknown-toplevel-key.yaml'),
  ])
  assert.equal(status, 1)
  assert.ok(stderr.includes("'telemetry'"), stderr)
})

test('exit 2 on a missing path', () => {
  const { status, stderr } = runCli(['validate', join(fixturesDir, 'does-not-exist.yaml')])
  assert.equal(status, 2)
  assert.ok(stderr.length > 0)
})

test('exit 2 on a missing path argument (the path is explicit, never inferred)', () => {
  const { status } = runCli(['validate'])
  assert.equal(status, 2)
})

test('exit 2 on an unknown command', () => {
  const { status } = runCli(['check', join(fixturesDir, 'accept-vite-full.yaml')])
  assert.equal(status, 2)
})
