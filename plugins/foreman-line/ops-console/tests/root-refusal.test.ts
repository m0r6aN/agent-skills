/**
 * Root-discipline refusals (boundary-routing D1 / P2b-i, D19 classes 1/2/5):
 * every root is caller-supplied and absolute — relative or absent roots are
 * refused with a typed `ConsoleRootUnresolvedError` BEFORE any path is derived
 * from them, at every root-consuming seam.
 */
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { ConsoleRootUnresolvedError, defaultConfig } from '../src/config.js'
import { invokeFlow, listAuditEntries } from '../src/invoke.js'
import { worktreeLiveness } from '../src/liveness.js'
import { resolveRepoRoot } from '../src/server.js'

test('defaultConfig refuses a relative repo root (typed root-not-absolute)', () => {
  assert.throws(
    () => defaultConfig(join('relative', 'root')),
    (err: unknown) =>
      err instanceof ConsoleRootUnresolvedError && err.reason === 'root-not-absolute',
  )
})

test('resolveRepoRoot refuses a missing FOC_REPO_ROOT (typed root-absent, exit 2)', () => {
  assert.throws(
    () => resolveRepoRoot({}),
    (err: unknown) =>
      err instanceof ConsoleRootUnresolvedError && err.reason === 'root-absent' && err.code === 2,
  )
  assert.throws(
    () => resolveRepoRoot({ FOC_REPO_ROOT: '' }),
    (err: unknown) => err instanceof ConsoleRootUnresolvedError && err.reason === 'root-absent',
  )
})

test('resolveRepoRoot refuses a relative FOC_REPO_ROOT (typed root-not-absolute, exit 2)', () => {
  assert.throws(
    () => resolveRepoRoot({ FOC_REPO_ROOT: join('relative', 'root') }),
    (err: unknown) =>
      err instanceof ConsoleRootUnresolvedError &&
      err.reason === 'root-not-absolute' &&
      err.code === 2,
  )
})

test('worktreeLiveness refuses a relative repo root typed, before touching the filesystem', () => {
  assert.throws(
    () =>
      worktreeLiveness(
        join('relative', 'root'),
        { parcelKey: 'ABC-1', goalSlug: 'goal' },
        21_600_000,
        0,
      ),
    (err: unknown) =>
      err instanceof ConsoleRootUnresolvedError && err.reason === 'root-not-absolute',
  )
})

test('invokeFlow refuses a relative configured repo root before resolving any receipts path', () => {
  const stateDir = mkdtempSync(join(tmpdir(), 'foc-root-refusal-'))
  try {
    const config = { ...defaultConfig(tmpdir(), stateDir), repoRoot: join('rel', 'root') }
    assert.throws(
      () =>
        invokeFlow(
          config,
          { flow: 'receipts-validate', argv: ['validate', 'docs/receipts/a5b1975a'] },
          0,
        ),
      (err: unknown) =>
        err instanceof ConsoleRootUnresolvedError && err.reason === 'root-not-absolute',
    )
    assert.deepEqual(listAuditEntries(stateDir), [], 'refusal happens before any audit write')
  } finally {
    rmSync(stateDir, { recursive: true, force: true })
  }
})
