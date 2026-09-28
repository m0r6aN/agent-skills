import assert from 'node:assert/strict'
import { join } from 'node:path'
import { test } from 'node:test'
import { run } from './foreman-line-ci.mjs'

// Deliberately independent of the runner's allowlist. Every spawn is injected.
const packages = [
  'approval', 'contracts', 'dispatch', 'integration', 'permission-profiles',
  'projection', 'receipts', 'registration', 'routing-policy', 'schema-scaffold',
  'shaping', 'skill-injection', 'spec-linter', 'verification',
]
const root = process.cwd()
const npmCli = join(root, 'fake npm', 'npm-cli.js')

test('all 14 installs precede all 42 checks, using explicit Node/npm without a shell', () => {
  const calls = []
  const result = run({ root, npmCli, spawn: (...args) => {
    calls.push(args)
    return { status: 0 }
  } })
  const expected = [
    ...packages.map((pkg) => [pkg, ['ci', '--ignore-scripts', '--no-audit', '--no-fund']]),
    ...packages.flatMap((pkg) => ['test', 'typecheck', 'lint'].map((check) =>
      [pkg, ['run', check, '--ignore-scripts']])),
  ]
  assert.equal(calls.length, 56)
  for (const [index, [pkg, args]] of expected.entries()) {
    assert.deepEqual(calls[index], [process.execPath, [npmCli, ...args], {
      cwd: join(root, 'plugins', 'foreman-line', pkg), stdio: 'inherit', shell: false,
    }])
  }
  assert.equal(result.exitCode, 0)
  assert.deepEqual(result.outcomes, packages.map((pkg) => ({
    package: pkg, ci: 'pass', test: 'pass', typecheck: 'pass', lint: 'pass',
  })))
})

test('offline installs never retry online; failed install prevents every check', () => {
  const calls = []
  const result = run({ root, npmCli, offline: true, spawn: (...args) => {
    calls.push(args)
    return { status: calls.length === 2 ? 1 : 0 }
  } })
  assert.equal(result.exitCode, 1)
  assert.equal(calls.length, 14)
  for (const [index, [, args, options]] of calls.entries()) {
    assert.deepEqual(args, [npmCli, 'ci', '--ignore-scripts', '--no-audit', '--no-fund', '--offline'])
    assert.equal(options.cwd, join(root, 'plugins', 'foreman-line', packages[index]))
  }
  assert.deepEqual(result.outcomes, packages.map((pkg, index) => ({
    package: pkg, ci: index === 1 ? 'fail' : 'pass',
    test: 'skipped', typecheck: 'skipped', lint: 'skipped',
  })))
})

for (const [index, check] of ['test', 'typecheck', 'lint'].entries()) {
  test(`${check} failure remains nonzero after all later checks succeed`, () => {
    let calls = 0
    const result = run({ root, npmCli, spawn: () => ({ status: calls++ === 14 + index ? 2 : 0 }) })
    assert.equal(calls, 56)
    assert.equal(result.exitCode, 1)
    assert.equal(result.outcomes[0][check], 'fail')
    assert.deepEqual(result.outcomes.at(-1), {
      package: 'verification', ci: 'pass', test: 'pass', typecheck: 'pass', lint: 'pass',
    })
  })
}

for (const [label, failure] of [
  ['throw', () => { throw new Error('untrusted\n::error::text') }],
  ['spawn error', () => ({ status: 0, error: new Error('ENOENT') })],
  ['signal', () => ({ status: 0, signal: 'SIGTERM' })],
  ['null status', () => ({ status: null })],
  ['missing result', () => undefined],
]) {
  for (const phase of ['install', 'check']) {
    test(`${label} during ${phase} fails closed and retains outcomes`, () => {
      let calls = 0
      const result = run({ root, npmCli, spawn: () => {
        calls++
        return calls === (phase === 'install' ? 1 : 15) ? failure() : { status: 0 }
      } })
      assert.equal(result.exitCode, 1)
      assert.equal(calls, phase === 'install' ? 14 : 56)
      assert.equal(result.outcomes[0][phase === 'install' ? 'ci' : 'test'], 'fail')
      assert.equal(result.outcomes.at(-1).lint, phase === 'install' ? 'skipped' : 'pass')
      assert.equal(JSON.stringify(result).includes('::error::'), false)
    })
  }
}

test('multiple failures are all retained rather than overwritten by later success', () => {
  let calls = 0
  const result = run({ root, npmCli, spawn: () => ({
    status: [14, 18, 22].includes(calls++) ? 1 : 0,
  }) })
  assert.equal(calls, 56)
  assert.equal(result.exitCode, 1)
  assert.equal(result.outcomes[0].test, 'fail')
  assert.equal(result.outcomes[1].typecheck, 'fail')
  assert.equal(result.outcomes[2].lint, 'fail')
  assert.equal(result.outcomes.at(-1).lint, 'pass')
})
