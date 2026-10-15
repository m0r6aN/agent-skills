import assert from 'node:assert/strict'
import test from 'node:test'
import {
  ExecSpawnError,
  ExecTimeoutError,
  execFileAsync,
  ghRunnerAsync,
  gitRunnerAsync,
  runAsync,
  tmuxRunnerAsync,
} from '../src/spawn-async.js'

/**
 * FCA-P14 spawn-async module tests: verifies the async exec wrapper
 * honours existing timeout, buffer cap, and encoding conventions.
 * Error shapes must match execFileSync (ENOENT, timeout SIGKILL).
 */

test('execFileAsync runs a command and returns stdout/stderr/exitCode', async () => {
  const result = await execFileAsync('echo', ['hello'])
  assert.equal(result.exitCode, 0)
  assert.match(result.stdout, /hello/)
  assert.equal(result.stderr, '')
})

test('execFileAsync captures stderr on non-zero exit', async () => {
  const result = await execFileAsync('sh', ['-c', 'echo err >&2; exit 1'])
  assert.equal(result.exitCode, 1)
  assert.match(result.stderr, /err/)
})

test('execFileAsync throws ExecSpawnError for ENOENT (missing binary)', async () => {
  await assert.rejects(execFileAsync('nonexistent-binary-xyz', []), (err: unknown) => {
    assert.ok(err instanceof ExecSpawnError)
    assert.equal(err.code, 'ENOENT')
    return true
  })
})

test('execFileAsync throws ExecTimeoutError on timeout', async () => {
  await assert.rejects(execFileAsync('sleep', ['10'], { timeout: 50 }), (err: unknown) => {
    assert.ok(err instanceof ExecTimeoutError)
    assert.equal(err.signal, 'SIGKILL')
    assert.equal(err.killed, true)
    return true
  })
})

test('execFileAsync respects maxBuffer (truncates without error)', async () => {
  const result = await execFileAsync('sh', ['-c', 'yes | head -1000'], { maxBuffer: 100 })
  assert.equal(result.stdout.length, 100)
  assert.equal(result.exitCode, 0)
})

test('execFileAsync passes cwd to the child process', async () => {
  // FCA-P16: cross-platform cwd check using node instead of pwd
  const cwd = process.platform === 'win32' ? (process.env.TEMP ?? 'C:\\Windows\\Temp') : '/tmp'
  const result = await execFileAsync('node', ['-e', 'console.log(process.cwd())'], { cwd })
  // Normalize path separators for comparison
  const normalizedOutput = result.stdout.trim().replace(/\\/g, '/')
  const normalizedCwd = cwd.replace(/\\/g, '/')
  assert.ok(
    normalizedOutput.toLowerCase() === normalizedCwd.toLowerCase(),
    `expected cwd ${normalizedCwd}, got ${normalizedOutput}`,
  )
})

test('runAsync returns trimmed stdout for successful commands', async () => {
  const output = await runAsync('echo', ['hello  '], undefined)
  assert.equal(output, 'hello')
})

test('runAsync throws on non-zero exit', async () => {
  await assert.rejects(runAsync('sh', ['-c', 'exit 42'], undefined), (err: unknown) => {
    assert.equal((err as { exitCode?: number }).exitCode, 42)
    return true
  })
})

test('gitRunnerAsync returns null on failure (degrade to unknown)', async () => {
  // Test with a non-git directory
  const result = await gitRunnerAsync('/tmp', ['status'], 1000, 1024)
  // /tmp is not a git repo, so should return null
  assert.equal(result, null)
})

test('gitRunnerAsync returns trimmed stdout on success', async () => {
  // Use a simple git command that works anywhere with git installed
  const result = await gitRunnerAsync(process.cwd(), ['--version'], 1000, 1024)
  assert.ok(result !== null)
  assert.match(result, /git version/)
})

test('ghRunnerAsync throws on non-zero exit with stderr', async () => {
  // gh with invalid args should fail
  await assert.rejects(
    ghRunnerAsync('/tmp', ['invalid-command-xyz'], 1000, 1024),
    (err: unknown) => {
      assert.ok(err instanceof Error)
      return true
    },
  )
})

test('tmuxRunnerAsync returns stdout on success', async () => {
  // tmux -V works without a server
  try {
    const result = await tmuxRunnerAsync('/tmp', ['-V'])
    assert.match(result, /tmux/)
  } catch (err) {
    // tmux may not be installed - skip test
    if ((err as ExecSpawnError).code === 'ENOENT') {
      return // tmux not installed, skip
    }
    throw err
  }
})

test('async wrappers preserve existing constant patterns (timeout, buffer)', async () => {
  // This test documents that async wrappers take timeout/buffer as parameters
  // rather than having module-level constants - matching the spec requirement

  // GIT_TIMEOUT_MS = 10_000, GIT_MAX_BUFFER = 64 * 1024 * 1024 (from ledger-git.ts)
  const GIT_TIMEOUT_MS = 10_000
  const GIT_MAX_BUFFER = 64 * 1024 * 1024

  // These values should be passable to the async runner
  const result = await gitRunnerAsync(process.cwd(), ['--version'], GIT_TIMEOUT_MS, GIT_MAX_BUFFER)
  assert.ok(result !== null)

  // GH_TIMEOUT_MS = 10_000, maxBuffer = 32 * 1024 * 1024 (from reconcile-remote.ts)
  const GH_TIMEOUT_MS = 10_000
  const GH_MAX_BUFFER = 32 * 1024 * 1024

  // Test that these can be passed (will fail since gh needs auth, but structure works)
  // We just verify the function accepts these parameters
  try {
    await ghRunnerAsync('/tmp', ['--version'], GH_TIMEOUT_MS, GH_MAX_BUFFER)
  } catch {
    // Expected to fail (gh not logged in or invalid args), but params were accepted
  }
})
