/**
 * P2b-i (root-conflation rulings) — registration package.
 *
 * AC3 (R2/#15): the specsDir parameterization proven with a value the old
 * constant never held, flowing end-to-end to the read path (the approval
 * record is FOUND under `my-specs/active` and NOT under any other dir).
 * AC6b: register/preview refuse a non-absolute repoRoot with the typed error.
 */
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import {
  computeApprovalSubject,
  generateCorrelationContext,
  mintGenesisReceipt,
} from '../../approval/src/index.js'
import type { ShapingResult } from '../../contracts/src/index.js'
import { backfillTicketLine, restoreSnapshots } from '../src/backfill.js'
import { currentBranch } from '../src/git.js'
import { detectRegistrationMode } from '../src/prior-registration.js'
import { preview, register } from '../src/register.js'
import { RegistrationRootUnresolvedError } from '../src/types.js'
import { FakeAdapter, makeGitRepo } from './helpers.js'

function buildFixtureAt(specsDir: string): { repoRoot: string; slug: string } {
  const repoRoot = makeGitRepo()
  const slug = 'never-held'
  const activeDir = join(repoRoot, ...specsDir.split('/'))
  mkdirSync(activeDir, { recursive: true })
  const specRef = `${specsDir}/demo-story.md`
  const specAbs = join(repoRoot, ...specRef.split('/'))
  mkdirSync(dirname(specAbs), { recursive: true })
  writeFileSync(specAbs, '---\ntitle: Demo Story\n---\n\n# Demo Story\n', 'utf8')

  const projectedResult: ShapingResult = {
    parcelSpecRefs: [specRef],
    epics: [
      { key: `epic-${slug}`, title: 'Epic', stories: [{ key: 'demo-story', title: 'Demo Story' }] },
    ],
  }
  const { subject, approvedHash } = computeApprovalSubject(projectedResult, repoRoot)
  const correlation = generateCorrelationContext()
  const genesis = mintGenesisReceipt(correlation, subject, '2026-08-27T00:00:00Z')
  const record = {
    approvedHash,
    artifactRef: `${specsDir}/${slug}.projected.shaping-result.json`,
    subject,
    decision: 'approved',
    timestamp: '2026-08-27T00:00:00Z',
    approver: 'clinton.morgan',
    correlation,
    receipt: genesis.ref,
  }
  writeFileSync(
    join(activeDir, `${slug}.approval.json`),
    `${JSON.stringify(record, null, 2)}\n`,
    'utf8',
  )
  return { repoRoot, slug }
}

test('P2b-AC3: preview() finds the approval record under a specsDir the old constant never held', () => {
  const { repoRoot, slug } = buildFixtureAt('my-specs/active')
  const result = preview({ slug, projectKey: 'KONE', repoRoot, specsDir: 'my-specs/active' })
  assert.equal(result.mode, 'first')
  assert.equal(result.epicPayload.fields.summary.includes('Epic'), true)
  // The same call WITHOUT the parameter must fail to find the record — the
  // parameter is load-bearing, not decorative (STANDING #15 direction).
  assert.throws(() => preview({ slug, projectKey: 'KONE', repoRoot }), /ENOENT|no such file/)
})

test('P2b-AC6b: preview() refuses a non-absolute repoRoot with the typed error', () => {
  assert.throws(
    () => preview({ slug: 'x', projectKey: 'KONE', repoRoot: 'relative/root' }),
    (err: unknown) =>
      err instanceof RegistrationRootUnresolvedError && err.reason === 'root-not-absolute',
  )
})

// ─── Boundary-routing D1 (2026-09-26): out-of-root candidates and the remaining
// ─── root-consuming seams refuse explicitly (negative controls).

test('D1: detectRegistrationMode refuses a non-absolute repoRoot with the typed error', () => {
  assert.throws(
    () =>
      detectRegistrationMode(
        {
          correlation: { workflowId: 'a1b2c3d4-0000-4000-8000-000000000001' },
          receipt: { hash: 'h', locator: 'docs/receipts/x/000000-G-genesis.json' },
        } as never,
        'relative/root',
      ),
    (err: unknown) =>
      err instanceof RegistrationRootUnresolvedError && err.reason === 'root-not-absolute',
  )
})

test('D1: detectRegistrationMode refuses an out-of-root receipt locator', () => {
  const repoRoot = makeGitRepo()
  const hostile = {
    correlation: { workflowId: 'a1b2c3d4-0000-4000-8000-000000000001' },
    receipt: { hash: 'h', locator: '../../outside/genesis.json' },
  } as never
  assert.throws(() => detectRegistrationMode(hostile, repoRoot), /resolves outside repoRoot/)
})

test('D1: preview() refuses an out-of-root specsDir before any read', () => {
  const repoRoot = makeGitRepo()
  assert.throws(
    () => preview({ slug: 'x', projectKey: 'KONE', repoRoot, specsDir: '../../etc/active' }),
    /resolves outside repoRoot/,
  )
})

test('D1: register() refuses an out-of-root binding ref before any adapter call', async () => {
  const repoRoot = makeGitRepo()
  const activeDir = join(repoRoot, 'docs', 'specs', 'active')
  mkdirSync(activeDir, { recursive: true })
  // A hostile approval record whose projected spec ref escapes repoRoot. The
  // refusal must fire at the binding-containment step — before JQL, gate, or
  // write-back — so only `subject.projectedResult` needs to be well-formed.
  writeFileSync(
    join(activeDir, 'escape-refs.approval.json'),
    JSON.stringify({
      approvedHash: 'unused-by-this-refusal',
      artifactRef: 'docs/specs/active/escape-refs.projected.shaping-result.json',
      subject: {
        projectedResult: {
          parcelSpecRefs: ['../../outside/escape.md'],
          epics: [
            {
              key: 'epic-escape-refs',
              title: 'Epic',
              stories: [{ key: 'escape', title: 'Escape' }],
            },
          ],
        },
      },
      decision: 'approved',
      timestamp: '2026-08-27T00:00:00Z',
      approver: 'tester',
      correlation: { workflowId: 'a1b2c3d4-0000-4000-8000-000000000001' },
      receipt: {
        hash: 'h',
        locator: 'docs/receipts/a1b2c3d4-0000-4000-8000-000000000001/000000-G-genesis.json',
      },
    }),
    'utf8',
  )
  const adapter = new FakeAdapter()
  await assert.rejects(
    () =>
      register({
        slug: 'escape-refs',
        projectKey: 'KONE',
        repoRoot,
        adapter,
        timestamp: '2026-08-27T00:00:00Z',
      }),
    /resolves outside repoRoot/,
  )
  assert.equal(adapter.searchCalls.length, 0)
  assert.equal(adapter.createCalls.length, 0)
  assert.equal(adapter.updateCalls.length, 0)
})

test('D1: backfill seams refuse non-absolute paths with the typed error', () => {
  const typed = (err: unknown): boolean =>
    err instanceof RegistrationRootUnresolvedError && err.reason === 'root-not-absolute'
  assert.throws(() => backfillTicketLine('docs/specs/active/x.md', 'KONE-1'), typed)
  assert.throws(
    () => restoreSnapshots([{ absPath: 'docs/specs/active/x.md', original: '' }]),
    typed,
  )
})

test('D1: the git seam refuses a non-absolute cwd with the typed error', () => {
  assert.throws(
    () => currentBranch('relative/root'),
    (err: unknown) =>
      err instanceof RegistrationRootUnresolvedError && err.reason === 'root-not-absolute',
  )
})
