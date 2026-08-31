import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'
import { parseRegistry, validateRegistry } from '../src/validate.js'

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const fixtures = join(packageRoot, 'tests', 'fixtures')
const tsxCli = join(packageRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs')

function load(name: string): unknown {
  return parse(readFileSync(join(fixtures, name), 'utf8'))
}

test('accepts the minimal contract fixture', () => {
  assert.equal(validateRegistry(load('pass-minimal.yaml')).valid, true)
})

for (const [name, code] of [
  ['reject-identity-mutation.yaml', 'LOCATOR_DIGEST_MISMATCH'],
  ['reject-location-mutation.yaml', 'LOCATOR_DIGEST_MISMATCH'],
  ['reject-value-mutation.yaml', 'VALUE_DIGEST_MISMATCH'],
  ['reject-stale-source.yaml', 'VALUE_DIGEST_MISMATCH'],
  ['reject-duplicate-rule.yaml', 'RULE_DUPLICATE'],
  ['reject-contradictory-authority.yaml', 'RULE_CONFLICT'],
  ['reject-missing-source.yaml', 'RULE_SOURCE_MISSING'],
] as const) {
  test(`${name} rejects with ${code}`, () => {
    const result = validateRegistry(load(name))
    assert.equal(result.valid, false)
    assert.ok(result.violations.some((violation) => violation.code === code))
  })
}

test('parseRegistry distinguishes parse failures from validation failures', () => {
  assert.equal(parseRegistry('not: [valid').violations[0]?.code, 'PARSE_ERROR')
  assert.equal(parseRegistry('{}').violations[0]?.code, 'SCHEMA_INVALID')
})

function runCli(args: readonly string[]): {
  status: number | null
  stdout: string
  stderr: string
} {
  const result = spawnSync(process.execPath, [tsxCli, 'src/cli.ts', ...args], {
    cwd: packageRoot,
    encoding: 'utf8',
  })
  return { status: result.status, stdout: result.stdout, stderr: result.stderr }
}

test('CLI validate and sweep return exit 0 with machine-readable summaries', () => {
  const validate = runCli(['validate', 'authority-enforcement-registry.yaml'])
  assert.equal(validate.status, 0, validate.stderr || validate.stdout)
  assert.equal(JSON.parse(validate.stdout).valid, true)

  const sweep = runCli(['sweep', 'authority-enforcement-registry.yaml', '--repo-root', '../../..'])
  assert.equal(sweep.status, 0, sweep.stderr || sweep.stdout)
  assert.equal(JSON.parse(sweep.stdout).summary.sourceCount, 18)
})

for (const name of [
  'reject-identity-mutation.yaml',
  'reject-location-mutation.yaml',
  'reject-value-mutation.yaml',
  'reject-stale-source.yaml',
  'reject-duplicate-rule.yaml',
  'reject-contradictory-authority.yaml',
  'reject-missing-source.yaml',
]) {
  test(`CLI negative fixture ${name} returns exit 1 with all violations`, () => {
    const result = runCli(['validate', join(fixtures, name)])
    assert.equal(result.status, 1, result.stderr || result.stdout)
    const output = JSON.parse(result.stdout) as { valid: boolean; violations: unknown[] }
    assert.equal(output.valid, false)
    assert.ok(output.violations.length > 0)
  })
}

test('CLI bad invocation and unreadable input return exit 2', () => {
  assert.equal(runCli(['validate']).status, 2)
  assert.equal(runCli(['unknown', 'authority-enforcement-registry.yaml']).status, 2)
  assert.equal(runCli(['sweep', 'authority-enforcement-registry.yaml']).status, 2)
  assert.equal(runCli(['validate', join(fixtures, 'does-not-exist.yaml')]).status, 2)
})
