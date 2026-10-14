/**
 * Bind-refusal seam (typed refusal, mirroring `ConsoleRootUnresolvedError`):
 * a listen failure — the classic being a stale console still holding the
 * default port — is refused typed (`error: [port-in-use] …`, exit 2) at the
 * entry path, never an unhandled `'error'` event stack trace.
 */
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { ConsoleBindError, portRemedyCommand, resolveBind, toBindError } from '../src/server.js'

const OPS_CONSOLE_DIR = fileURLToPath(new URL('..', import.meta.url))
const REPO_ROOT = fileURLToPath(new URL('../../../..', import.meta.url))
// FCA-P16: On Windows, npm bin scripts are .cmd files
const TSX_BIN = fileURLToPath(
  new URL(`../node_modules/.bin/tsx${process.platform === 'win32' ? '.cmd' : ''}`, import.meta.url),
)

test('toBindError maps EADDRINUSE to a typed port-in-use refusal naming the remedy (POSIX)', () => {
  const bind = resolveBind({ PORT: '8081' })
  const errno = Object.assign(new Error('listen EADDRINUSE: address already in use'), {
    code: 'EADDRINUSE',
  })
  const refusal = toBindError(errno, bind, 'linux')
  assert.ok(refusal instanceof ConsoleBindError)
  assert.equal(refusal.reason, 'port-in-use')
  assert.equal(refusal.code, 2)
  assert.match(refusal.message, /127\.0\.0\.1:8081/)
  assert.match(refusal.message, /ss -ltnp/)
  assert.match(refusal.message, /PORT=<free port>/)
})

test('FCA-P16: toBindError names netstat -aon as remedy on Windows', () => {
  const bind = resolveBind({ PORT: '8082' })
  const errno = Object.assign(new Error('listen EADDRINUSE: address already in use'), {
    code: 'EADDRINUSE',
  })
  const refusal = toBindError(errno, bind, 'win32')
  assert.ok(refusal instanceof ConsoleBindError)
  assert.equal(refusal.reason, 'port-in-use')
  assert.match(refusal.message, /127\.0\.0\.1:8082/)
  assert.match(refusal.message, /netstat -aon/)
  assert.match(refusal.message, /findstr :8082/)
  assert.doesNotMatch(refusal.message, /ss -ltnp/, 'Windows does not mention ss')
})

test('FCA-P16: portRemedyCommand returns platform-appropriate command', () => {
  assert.equal(portRemedyCommand(8080, 'linux'), "ss -ltnp | grep ':8080'")
  assert.equal(portRemedyCommand(8080, 'darwin'), "ss -ltnp | grep ':8080'")
  assert.equal(portRemedyCommand(8080, 'win32'), 'netstat -aon | findstr :8080')
})

test('toBindError maps any other listen failure to typed bind-failed', () => {
  const bind = resolveBind({ PORT: '8081' })
  const refusal = toBindError(new Error('listen EACCES: permission denied'), bind)
  assert.ok(refusal instanceof ConsoleBindError)
  assert.equal(refusal.reason, 'bind-failed')
  assert.equal(refusal.code, 2)
  assert.match(refusal.message, /bind 127\.0\.0\.1:8081 failed: listen EACCES/)
  assert.equal(toBindError('not-an-error', bind).reason, 'bind-failed')
})

test('entry path refuses a held port typed (error: [port-in-use], exit 2)', async () => {
  const squatter = createServer(() => {})
  await new Promise<void>((resolve) => squatter.listen(0, '127.0.0.1', resolve))
  const { port } = squatter.address() as AddressInfo
  try {
    const env: NodeJS.ProcessEnv = { ...process.env, FOC_REPO_ROOT: REPO_ROOT, PORT: String(port) }
    delete env.FOC_EXTRA_ROOTS
    delete env.FOC_STATE_DIR
    // FCA-P16: On Windows, .cmd files need shell: true to run properly
    const run = spawnSync(TSX_BIN, ['src/server.ts'], {
      cwd: OPS_CONSOLE_DIR,
      encoding: 'utf8',
      timeout: 30_000,
      env,
      shell: process.platform === 'win32',
    })
    assert.equal(run.status, 2, `expected exit 2, got ${run.status}: ${run.stderr}`)
    assert.match(run.stderr, /error: \[port-in-use\]/)
    assert.match(run.stderr, new RegExp(`127\\.0\\.0\\.1:${port} is already in use`))
    // FCA-P16: platform-aware remedy in error message
    const remedy = process.platform === 'win32' ? /netstat -aon/ : /ss -ltnp/
    assert.match(run.stderr, remedy, 'remedy is platform-appropriate')
    assert.doesNotMatch(run.stderr, /at Server\./)
  } finally {
    await new Promise<void>((resolve) => squatter.close(() => resolve()))
  }
})
