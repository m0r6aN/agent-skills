/**
 * Runtime-dependency allowlist: exactly `{ajv, yaml}` (AC14). Machine-
 * enforced via the shared registrar (coordinator Correction B: use
 * `registerDependencyAllowlistTest`, never a hand-rolled copy).
 *
 * The paired case proves the guard BITES: a package.json with one extra
 * dependency key, fed to the same registrar in a subprocess, must produce a
 * failing test run. Passing alone is not evidence (STANDING-CONSTRAINTS #11).
 */
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { registerDependencyAllowlistTest } from '../../schema-scaffold/src/test-scaffold.js'

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const packageJsonPath = join(packageRoot, 'package.json')

registerDependencyAllowlistTest(packageJsonPath, ['ajv', 'yaml'])

test('AC14 paired case: the allowlist assertion fails when an extra dependency key appears', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'foreman-config-allowlist-'))
  try {
    const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
      dependencies: Record<string, string>
    }
    pkg.dependencies['left-pad'] = '1.3.0'
    writeFileSync(join(tmp, 'package.json'), JSON.stringify(pkg, null, 2))

    const scaffoldUrl = pathToFileURL(
      join(packageRoot, '..', 'schema-scaffold', 'src', 'test-scaffold.ts'),
    ).href
    const mutatedTestPath = join(tmp, 'mutated-allowlist.test.ts')
    writeFileSync(
      mutatedTestPath,
      `import { registerDependencyAllowlistTest } from ${JSON.stringify(scaffoldUrl)}\n` +
        `registerDependencyAllowlistTest(${JSON.stringify(join(tmp, 'package.json'))}, ['ajv', 'yaml'])\n`,
    )

    const tsxCli = join(packageRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs')
    // Strip the parent test-runner's context marker: with it inherited, the
    // child `--test` invocation detects recursion and SKIPS running files —
    // which would make this guard pass vacuously (the exact hollow-gate
    // failure mode this test exists to prevent).
    const env = { ...process.env }
    delete env.NODE_TEST_CONTEXT
    const result = spawnSync(process.execPath, [tsxCli, '--test', mutatedTestPath], {
      cwd: packageRoot,
      encoding: 'utf8',
      env,
    })
    assert.notEqual(
      result.status,
      0,
      `expected the allowlist test to FAIL against the mutated package.json, but it passed:\n${result.stdout}\n${result.stderr}`,
    )
    assert.ok(
      result.stdout.includes('left-pad') || result.stderr.includes('left-pad'),
      'expected the failure to surface the extra dependency key',
    )
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
})
