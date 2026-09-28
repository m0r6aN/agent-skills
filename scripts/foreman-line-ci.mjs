import { spawnSync } from 'node:child_process'
import { appendFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const packages = Object.freeze([
  'approval', 'contracts', 'dispatch', 'integration', 'permission-profiles',
  'projection', 'receipts', 'registration', 'routing-policy', 'schema-scaffold',
  'shaping', 'skill-injection', 'spec-linter', 'verification',
])

class ForemanCiError extends Error {
  constructor(message, cause) {
    super(message, { cause })
    this.name = 'ForemanCiError'
  }
}

// The process boundary is mandatory: importing/testing the runner cannot launch npm.
export function run({ root, npmCli, spawn, offline = false }) {
  const outcomes = packages.map((pkg) => ({
    package: pkg, ci: 'skipped', test: 'skipped', typecheck: 'skipped', lint: 'skipped',
  }))
  function invoke(pkg, args) {
    try {
      const result = spawn(process.execPath, [npmCli, ...args], {
        cwd: join(root, 'plugins', 'foreman-line', pkg), stdio: 'inherit', shell: false,
      })
      return result?.status === 0 && !result.error && !result.signal ? 'pass' : 'fail'
    } catch (cause) {
      throw new ForemanCiError('Package process failed', cause)
    }
  }
  for (const phase of [['ci'], ['test', 'typecheck', 'lint']]) {
    for (const outcome of outcomes) {
      for (const check of phase) {
        const args = check === 'ci'
          ? ['ci', '--ignore-scripts', '--no-audit', '--no-fund', ...(offline ? ['--offline'] : [])]
          : ['run', check, '--ignore-scripts']
        try {
          outcome[check] = invoke(outcome.package, args)
        } catch (error) {
          if (!(error instanceof ForemanCiError)) throw error
          outcome[check] = 'fail'
        }
      }
    }
    // Relative sibling imports require every install to succeed before any check.
    if (phase[0] === 'ci' && outcomes.some((outcome) => outcome.ci !== 'pass')) break
  }
  return {
    exitCode: outcomes.some((outcome) =>
      ['ci', 'test', 'typecheck', 'lint'].some((check) => outcome[check] !== 'pass')) ? 1 : 0,
    outcomes,
  }
}

if (import.meta.main) {
  try {
    const [npmCli, mode, ...extra] = process.argv.slice(2)
    if (!npmCli || (mode !== undefined && mode !== '--offline') || extra.length) {
      throw new ForemanCiError('Usage: node scripts/foreman-line-ci.mjs <npm-cli.js> [--offline]')
    }
    const result = run({
      root: fileURLToPath(new URL('../', import.meta.url)),
      npmCli, spawn: spawnSync, offline: mode === '--offline',
    })
    // Only fixed allowlist names and normalized statuses enter the Markdown/log report.
    const summary = [
      '## Foreman Line Package Checks',
      '| Package | Install | Test | Typecheck | Lint |',
      '| --- | --- | --- | --- | --- |',
      ...result.outcomes.map((row) =>
        `| ${row.package} | ${row.ci} | ${row.test} | ${row.typecheck} | ${row.lint} |`),
      '',
    ].join('\n')
    console.log(summary)
    if (process.env.GITHUB_STEP_SUMMARY) {
      try {
        appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary)
      } catch (cause) {
        throw new ForemanCiError('Could not write package summary', cause)
      }
    }
    process.exitCode = result.exitCode
  } catch {
    console.error('Foreman Line CI failed; inspect package output and invocation arguments.')
    process.exitCode = 1
  }
}
