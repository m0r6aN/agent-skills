import { spawnSync } from 'node:child_process'
import { appendFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const packages = Object.freeze([
  'approval', 'contract-readers', 'contracts', 'dispatch', 'foreman-config', 'hybrid-routing',
  'integration', 'mutation-scope-guard', 'permission-profiles', 'projection',
  'receipts', 'registration', 'role-authority', 'routing-policy',
  'schema-scaffold', 'shaping', 'skill-injection', 'spec-linter', 'verification',
  'worker-envelopes',
])

class ForemanCiError extends Error {
  constructor(message, cause) {
    super(message, { cause })
    this.name = 'ForemanCiError'
  }
}

// Captured child output is emitted to the job log and to the failure section
// below; only fixed allowlist names and normalized statuses enter the
// Markdown/log report. The capture cap is deliberately huge so a failing
// check's stdout/stderr is never truncated in practice.
const maxOutputBytes = 256 * 1024 * 1024

// The process boundary is mandatory: importing/testing the runner cannot launch npm.
export function run({ root, npmCli, spawn, offline = false }) {
  const outcomes = packages.map((pkg) => ({
    package: pkg, ci: 'skipped', test: 'skipped', typecheck: 'skipped', lint: 'skipped',
  }))
  const failures = []
  function invoke(pkg, check, args) {
    try {
      const result = spawn(process.execPath, [npmCli, ...args], {
        cwd: join(root, 'plugins', 'foreman-line', pkg),
        stdio: ['inherit', 'pipe', 'pipe'], shell: false,
        encoding: 'utf8', maxBuffer: maxOutputBytes,
      })
      const stdout = result?.stdout ?? ''
      const stderr = result?.stderr ?? ''
      if (stdout) process.stdout.write(stdout)
      if (stderr) process.stderr.write(stderr)
      const ok = result?.status === 0 && !result.error && !result.signal
      if (!ok) {
        const detail = [
          Number.isInteger(result?.status) && result.status !== 0
            ? `exit code ${result.status}` : null,
          result?.signal ? 'signal' : null,
          result?.error ? 'spawn error' : null,
        ].filter(Boolean).join(', ')
        failures.push({ package: pkg, check, detail, stdout, stderr })
      }
      return ok ? 'pass' : 'fail'
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
          outcome[check] = invoke(outcome.package, check, args)
        } catch (error) {
          if (!(error instanceof ForemanCiError)) throw error
          outcome[check] = 'fail'
          failures.push({
            package: outcome.package, check, detail: 'spawn error', stdout: '', stderr: '',
          })
        }
      }
    }
    // Relative sibling imports require every install to succeed before any check.
    if (phase[0] === 'ci' && outcomes.some((outcome) => outcome.ci !== 'pass')) break
  }
  if (failures.length) {
    const section = failures.map(({ package: pkg, check, detail, stdout, stderr }) => [
      `--- ${pkg}/${check} failed (${detail || 'no exit status'}) ---`,
      stdout, stderr,
    ].filter(Boolean).join('\n')).join('\n\n')
    process.stderr.write(`\n${section}\n`)
  }
  return {
    exitCode: outcomes.some((outcome) =>
      ['ci', 'test', 'typecheck', 'lint'].some((check) => outcome[check] !== 'pass')) ? 1 : 0,
    outcomes,
    // Normalized projection only: raw child output never enters the result.
    failures: failures.map(({ package: pkg, check, detail }) => ({ package: pkg, check, detail })),
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
