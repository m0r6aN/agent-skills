/**
 * P2b-i (root-conflation rulings) — approval package.
 *
 * AC2 (R3): DEFAULT_REPO_ROOT/ACTIVE_SPECS_DIR are gone; the CLI refuses a
 * missing or relative --repo-root with typed exit 2, writing nothing.
 * AC3 (R2/#15): specsDir proven end-to-end with a value the old constant
 * never held. AC6b: library seams refuse a non-absolute root typed.
 */
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { writeApprovalRecord } from '../src/approval-record.js'
import { generateCorrelationContext } from '../src/correlation.js'
import { ApprovalRootUnresolvedError } from '../src/errors.js'
import * as api from '../src/index.js'
import { resolveArtifact } from '../src/resolve-input.js'
import { computeApprovalSubject, computeSpecSet } from '../src/subject.js'
import {
  makeTempRepoRoot,
  sampleShapingResult,
  writeProjectedFixture,
  writeSpecDraft,
} from './helpers.js'

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const tsxCli = join(packageRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs')

function runCli(args: readonly string[]): {
  status: number | null
  stdout: string
  stderr: string
} {
  const result = spawnSync(process.execPath, [tsxCli, 'src/cli.ts', ...args], {
    cwd: packageRoot,
    encoding: 'utf8',
    input: '',
  })
  return { status: result.status, stdout: result.stdout, stderr: result.stderr }
}

test('P2b-AC2: DEFAULT_REPO_ROOT and ACTIVE_SPECS_DIR are gone from the public surface (R3/R2)', () => {
  assert.ok(!('DEFAULT_REPO_ROOT' in api))
  assert.ok(!('ACTIVE_SPECS_DIR' in api))
})

test('P2b-AC2: CLI refuses a MISSING --repo-root with exit 2 and writes nothing', () => {
  const { status, stderr } = runCli(['show', 'example'])
  assert.equal(status, 2)
  assert.match(stderr, /--repo-root/)
})

test('P2b-AC2: CLI refuses a RELATIVE --repo-root with exit 2 (root-not-absolute) and writes nothing', () => {
  const { status, stderr } = runCli(['show', 'example', '--repo-root', 'some/relative/root'])
  assert.equal(status, 2)
  assert.match(stderr, /not an absolute path/)
})

test('P2b-AC3: writeApprovalRecord honors a specsDir the old constant never held, end-to-end', () => {
  const repoRoot = makeTempRepoRoot()
  writeSpecDraft(repoRoot, 'plugins/foreman-line/docs/specs/active/example.md', 'Example')
  const payload = sampleShapingResult()
  const { subject, approvedHash } = computeApprovalSubject(payload, repoRoot)
  const written = writeApprovalRecord(
    'example',
    {
      approvedHash,
      artifactRef: 'my-specs/active/example.projected.shaping-result.json',
      subject,
      decision: 'approved',
      timestamp: '2026-08-27T00:00:00.000Z',
      approver: 'clinton.morgan',
      correlation: generateCorrelationContext(),
      receipt: { hash: '0'.repeat(64), locator: 'docs/receipts/x/000000-A-shaping-result.json' },
    },
    repoRoot,
    'my-specs/active',
  )
  assert.equal(written, join(repoRoot, 'my-specs', 'active', 'example.approval.json'))
  assert.ok(existsSync(written), 'record must exist at the parameterized path')
  assert.ok(
    !existsSync(join(repoRoot, 'docs', 'specs', 'active', 'example.approval.json')),
    'the default location must NOT be written when specsDir is supplied',
  )
  const parsed = JSON.parse(readFileSync(written, 'utf8'))
  assert.equal(parsed.decision, 'approved')
})

test('P2b-AC3: resolveArtifact honors a specsDir the old constant never held (my-specs/active)', () => {
  const repoRoot = makeTempRepoRoot()
  // Place the projected artifact under the NEVER-HELD dir by writing it there.
  const payload = sampleShapingResult()
  writeSpecDraft(repoRoot, 'plugins/foreman-line/docs/specs/active/example.md', 'Example')
  const dir = join(repoRoot, 'my-specs', 'active')
  mkdirSync(dir, { recursive: true })
  writeFileSync(
    join(dir, 'example.projected.shaping-result.json'),
    `${JSON.stringify(payload, null, 2)}\n`,
    'utf8',
  )
  const resolved = resolveArtifact('example', { repoRoot, specsDir: 'my-specs/active' })
  assert.equal(resolved.artifactRef, 'my-specs/active/example.projected.shaping-result.json')
  assert.deepEqual(resolved.projectedResult.parcelSpecRefs, payload.parcelSpecRefs)
})

test('P2b-AC6b: resolveArtifact refuses a non-absolute repoRoot with the typed error', () => {
  assert.throws(
    () => resolveArtifact('example', { repoRoot: 'relative/root' }),
    (err: unknown) =>
      err instanceof ApprovalRootUnresolvedError && err.reason === 'root-not-absolute',
  )
})

test('P2b-AC6b: computeSpecSet refuses a non-absolute repoRoot with the typed error', () => {
  assert.throws(
    () => computeSpecSet(['x.md'], 'relative/root'),
    (err: unknown) =>
      err instanceof ApprovalRootUnresolvedError && err.reason === 'root-not-absolute',
  )
})

test('P2b-AC6b: the projected fixture default location still resolves under the foreign default', () => {
  const repoRoot = makeTempRepoRoot()
  writeSpecDraft(repoRoot, 'plugins/foreman-line/docs/specs/active/example.md', 'Example')
  writeProjectedFixture(repoRoot, 'example', sampleShapingResult())
  const resolved = resolveArtifact('example', { repoRoot })
  assert.equal(resolved.artifactRef, 'docs/specs/active/example.projected.shaping-result.json')
})
