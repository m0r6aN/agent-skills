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
import { preview } from '../src/register.js'
import { RegistrationRootUnresolvedError } from '../src/types.js'
import { makeGitRepo } from './helpers.js'

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
