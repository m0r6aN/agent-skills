/**
 * Portable fake executable helper for cross-platform testing.
 *
 * Creates a Node.js script as the primary executable plus platform-appropriate
 * shims: `.cmd` wrapper on Windows, `#!/bin/sh` wrapper on POSIX. This allows
 * tests that need fake git/gh/pi binaries to work on both platforms.
 *
 * FCA-P16: Windows portability for ops-console tests.
 */
import * as childProcess from 'node:child_process'
import { chmodSync, mkdirSync, writeFileSync } from 'node:fs'
import { delimiter, join } from 'node:path'

export interface FakeBinOptions {
  /** Directory to create the fake binaries in. Will be created if missing. */
  binDir: string
  /** Name of the executable (e.g. 'git', 'gh'). */
  name: string
  /**
   * The Node.js script body (without shebang). Receives `process.argv.slice(2)` as args.
   * Should call `process.exit(code)` to set exit code.
   */
  script: string
}

/**
 * Creates a portable fake executable that works on both Windows and POSIX.
 *
 * On Windows: creates `<name>.js` and `<name>.cmd` (calls node with the js file).
 * On POSIX: creates `<name>.js` and `<name>` (shell wrapper that calls node).
 *
 * @returns The path to the binary directory (add to PATH with `path.delimiter`).
 */
export function createFakeBin(options: FakeBinOptions): string {
  const { binDir, name, script } = options

  mkdirSync(binDir, { recursive: true })

  const jsPath = join(binDir, `${name}.js`)
  const jsContent = `#!/usr/bin/env node
${script}
`
  writeFileSync(jsPath, jsContent)

  if (process.platform === 'win32') {
    // Windows: create a .cmd wrapper that invokes node with the .js file
    const cmdPath = join(binDir, `${name}.cmd`)
    // %~dp0 is the directory of the batch file
    const cmdContent = `@echo off\r\nnode "%~dp0${name}.js" %*\r\n`
    writeFileSync(cmdPath, cmdContent)
  } else {
    // POSIX: create a shell wrapper that invokes node with the .js file
    const shPath = join(binDir, name)
    const shContent = `#!/bin/sh
exec node "$(dirname "$0")/${name}.js" "$@"
`
    writeFileSync(shPath, shContent)
    chmodSync(shPath, 0o755)
  }

  chmodSync(jsPath, 0o755)
  return binDir
}

/**
 * Helper to prepend a directory to PATH using the platform's delimiter.
 */
export function prependToPath(dir: string, existingPath: string | undefined): string {
  return existingPath ? `${dir}${delimiter}${existingPath}` : dir
}

/**
 * Creates a fake git wrapper that logs invocations and delegates to real git.
 *
 * @param binDir Directory for the fake binary
 * @param logFile Path to the log file for recording invocations
 * @param realGitPath Path to the real git executable
 * @returns The bin directory path
 */
export function createLoggingGitWrapper(
  binDir: string,
  logFile: string,
  realGitPath: string,
): string {
  // Escape backslashes for Windows paths in the JS string
  const escapedLogFile = logFile.replace(/\\/g, '\\\\')
  const escapedRealGit = realGitPath.replace(/\\/g, '\\\\')

  return createFakeBin({
    binDir,
    name: 'git',
    script: `
const fs = require('fs');
const { spawnSync } = require('child_process');
const args = process.argv.slice(2);
fs.appendFileSync('${escapedLogFile}', 'git ' + args.join(' ') + '\\n');
const result = spawnSync('${escapedRealGit}', args, { stdio: 'inherit' });
process.exit(result.status ?? 1);
`,
  })
}

/**
 * Creates a fake gh wrapper for testing with configurable behavior.
 *
 * @param binDir Directory for the fake binary
 * @param logFile Path to the log file for recording invocations
 * @param options Configuration for gh behavior
 * @returns The bin directory path
 */
export function createFakeGh(
  binDir: string,
  logFile: string,
  options: {
    /** Path to JSON file for `pr list` response */
    prsJsonPath?: string
    /** Path to JSON file for `api` response */
    annotationsJsonPath?: string
    /** If true, simulate auth failure */
    failAuth?: boolean
  },
): string {
  const escapedLogFile = logFile.replace(/\\/g, '\\\\')
  const escapedPrs = options.prsJsonPath?.replace(/\\/g, '\\\\') ?? ''
  const escapedAnnotations = options.annotationsJsonPath?.replace(/\\/g, '\\\\') ?? ''

  return createFakeBin({
    binDir,
    name: 'gh',
    script: `
const fs = require('fs');
const args = process.argv.slice(2);
fs.appendFileSync('${escapedLogFile}', 'gh ' + args.join(' ') + '\\n');

if (process.env.FAKE_GH === 'fail') {
  process.stderr.write('gh: not logged in; run gh auth login\\n');
  process.exit(1);
}

const cmd = args.slice(0, 2).join(' ');
if (cmd === 'pr list' && '${escapedPrs}') {
  // FCA-P16: Use fs.writeSync for synchronous writes; process.stdout.write is async
  // and may be truncated when process.exit() is called immediately after.
  fs.writeSync(1, fs.readFileSync('${escapedPrs}', 'utf8'));
  process.exit(0);
}
if (args[0] === 'api' && '${escapedAnnotations}') {
  fs.writeSync(1, fs.readFileSync('${escapedAnnotations}', 'utf8'));
  process.exit(0);
}
process.exit(2);
`,
  })
}

/**
 * Creates a fake git that logs env vars for testing GIT_OPTIONAL_LOCKS.
 */
export function createEnvLoggingGit(binDir: string, logFile: string, realGitPath: string): string {
  const escapedLogFile = logFile.replace(/\\/g, '\\\\')
  const escapedRealGit = realGitPath.replace(/\\/g, '\\\\')

  return createFakeBin({
    binDir,
    name: 'git',
    script: `
const fs = require('fs');
const { spawnSync } = require('child_process');
const args = process.argv.slice(2);
fs.appendFileSync('${escapedLogFile}', 'OPTIONAL_LOCKS=' + (process.env.GIT_OPTIONAL_LOCKS ?? '') + ' ' + args.join(' ') + '\\n');
const result = spawnSync('${escapedRealGit}', args, { stdio: 'inherit' });
process.exit(result.status ?? 1);
`,
  })
}

/**
 * Finds the real git executable path portably.
 * Uses `where` on Windows, `which` on POSIX.
 */
export function findRealGit(): string {
  const { execFileSync } = childProcess

  if (process.platform === 'win32') {
    // `where git` returns one path per line; take the first
    const output = execFileSync('where', ['git'], { encoding: 'utf8' })
    const first = output.trim().split(/\r?\n/)[0]
    if (!first) throw new Error('git not found in PATH')
    return first
  }
  // POSIX: use `which`
  return execFileSync('which', ['git'], { encoding: 'utf8' }).trim()
}
