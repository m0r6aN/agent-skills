/**
 * D1 root-guard + containment tests (foreman-line-boundary-routing work item 1)
 * for the dispatch seams that lacked guards: approval-cli (prepareDispatch /
 * executeDispatch), kompress-adapter (kompressContext), and query
 * (queryAndRankCandidates / scanReceiptsForResolution).
 *
 * Rules under test:
 *   - A RELATIVE root is refused with the typed ROOT_NOT_ABSOLUTE error
 *     (instanceof + code) BEFORE any fs/subprocess work.
 *   - A caller-supplied path resolved against a root that escapes it is
 *     refused with the cross-package containment vocabulary (plain Error,
 *     message matching /resolves outside repoRoot/) before any fs work at the
 *     constructed path. specPath is a standalone caller path, so a RELATIVE
 *     specPath is refused with the typed family instead.
 *   - Positive controls prove an ABSOLUTE root (and in-root caller paths)
 *     proceed to normal behavior and are never refused with ROOT_NOT_ABSOLUTE.
 *
 * All fixtures use fresh mkdtempSync roots; compressFn and dispatchWorktreeFn
 * are always injected mocks — no MCP calls, no git mutations.
 */
import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import type {
  CandidateRecord,
  DispatchIdentity,
  DispatchInput,
  DispatchPackage,
  DispatchWorktreeOutput,
  KompressCallResult,
  KompressFn,
  McpToolClient,
} from '../src/index.js'
import {
  DispatchError,
  executeDispatch,
  KompressError,
  kompressContext,
  prepareDispatch,
  queryAndRankCandidates,
  SITE_URL,
  scanReceiptsForResolution,
} from '../src/index.js'

// ─── Paths to real YAML fixtures (same pattern as approval-cli.test.ts) ──────

const HERE = dirname(fileURLToPath(import.meta.url))
const REAL_ROUTING_POLICY = join(HERE, '..', '..', 'routing-policy', 'routing-policy.yaml')
const REAL_SKILL_INJECTION = join(HERE, '..', '..', 'skill-injection', 'skill-injection.yaml')

const WORKFLOW_ID = 'a1b2c3d4-0000-4000-8000-000000000001'
const CORRELATION_ID = 'aaaaaaaa-0000-4000-8000-000000000001'
const VALID_HEX_64 = 'a'.repeat(64)

const VALID_FRONTMATTER = {
  routing_class: 'architecture/risk',
  data_classification: 'public',
  surfaces: ['plugins/foreman-line/dispatch/'],
  permission_profile: 'builder-standard',
}

// ─── Fixture helpers ─────────────────────────────────────────────────────────

/** Temp repo root carrying the real routing/skill YAMLs under the plugin layout. */
function makeTempRepoRoot(): string {
  const tmpRoot = mkdtempSync(join(tmpdir(), 'root-guards-test-'))
  const routingDir = join(tmpRoot, 'plugins', 'foreman-line', 'routing-policy')
  mkdirSync(routingDir, { recursive: true })
  writeFileSync(join(routingDir, 'routing-policy.yaml'), readFileSync(REAL_ROUTING_POLICY, 'utf8'))
  const skillDir = join(tmpRoot, 'plugins', 'foreman-line', 'skill-injection')
  mkdirSync(skillDir, { recursive: true })
  writeFileSync(join(skillDir, 'skill-injection.yaml'), readFileSync(REAL_SKILL_INJECTION, 'utf8'))
  return tmpRoot
}

/** Write a minimal spec file with YAML frontmatter and return its ABSOLUTE path. */
function writeSpecFile(repoRoot: string): string {
  const specDir = join(repoRoot, 'specs')
  mkdirSync(specDir, { recursive: true })
  const fmLines = Object.entries(VALID_FRONTMATTER)
    .map(([k, v]) => {
      if (Array.isArray(v)) return `${k}: [${(v as string[]).map((s) => `'${s}'`).join(', ')}]`
      return `${k}: ${String(v)}`
    })
    .join('\n')
  const specPath = join(specDir, 'test-spec.md')
  writeFileSync(specPath, `---\n${fmLines}\n---\n\n# Spec body\nSome content.`)
  return specPath
}

/** Write a fake Stage-B receipt with hash + correlation and return its locator. */
function writeStageBReceipt(repoRoot: string): string {
  const receiptDir = join(repoRoot, 'docs', 'receipts', WORKFLOW_ID)
  mkdirSync(receiptDir, { recursive: true })
  const receiptFile = '000001-B-registration-result.json'
  const receipt = {
    schemaVersion: '1',
    kind: 'stage',
    stage: 'B',
    correlation: {
      correlationId: CORRELATION_ID,
      sessionId: 'a1a1a1a1-0000-4000-8000-000000000002',
      workflowId: WORKFLOW_ID,
      runId: 'a2a2a2a2-0000-4000-8000-000000000003',
    },
    workflowId: WORKFLOW_ID,
    sequence: 1,
    prevHash: 'prev-stage-a-hash',
    hash: VALID_HEX_64,
    timestamp: new Date().toISOString(),
  }
  writeFileSync(join(receiptDir, receiptFile), JSON.stringify(receipt, null, 2))
  return `docs/receipts/${WORKFLOW_ID}/${receiptFile}`
}

/** Mock KompressFn. */
function makeMockCompressFn(overrides?: Partial<KompressCallResult>): KompressFn {
  return async (_content: string) => ({
    compressed: 'compressed-spec-text',
    hash: 'mock-artifact-id-xyz',
    originalTokens: 200,
    compressedTokens: 50,
    tokensSaved: 150,
    transforms: ['semantic-dedup'],
    ...overrides,
  })
}

/** Success mock for dispatchWorktreeFn. */
const successWorktreeFn = (): DispatchWorktreeOutput => ({
  code: 0,
  stdout: 'profile: builder-standard\nbranch: feat/test\n',
  stderr: '',
})

/** Build a minimal valid CandidateRecord. */
function makeCandidate(priorReceiptLocator: string | null): CandidateRecord {
  return {
    ticketKey: 'KONE-9999',
    summary: 'Test parcel',
    priority: 'Medium',
    status: 'To Do',
    workflowId: WORKFLOW_ID,
    priorReceiptLocator,
  }
}

/**
 * Minimal stand-in package for the executeDispatch precondition tests — the
 * D1 guards fire before the package is read, so its contents are irrelevant.
 */
function dummyPackage(): DispatchPackage {
  return { candidate: { workflowId: WORKFLOW_ID } } as unknown as DispatchPackage
}

/** Minimal recording MCP stub: kaseya site + canned search issues. */
function makeStubClient(issues: ReadonlyArray<Record<string, unknown>> = []): {
  factory: () => McpToolClient
  calls: string[]
} {
  const calls: string[] = []
  const client: McpToolClient = {
    async callTool(name: string) {
      calls.push(name)
      if (name === 'getAccessibleAtlassianResources') {
        return JSON.stringify([{ id: 'cloud-1', url: SITE_URL }])
      }
      if (name === 'searchJiraIssuesUsingJql') {
        return JSON.stringify({ issues })
      }
      return '{}'
    },
    async close() {},
  }
  return { factory: () => client, calls }
}

const IDENTITY: DispatchIdentity = {
  project_key: 'KONE',
  dispatch_queue: 'dispatch.owner@example.com',
}

// ─── prepareDispatch: relative roots ─────────────────────────────────────────

test('prepareDispatch refuses a relative repoRoot with typed ROOT_NOT_ABSOLUTE before any fs work', async () => {
  await assert.rejects(
    () =>
      prepareDispatch(
        {
          candidate: makeCandidate('docs/receipts/x/000001-B-registration-result.json'),
          specPath: 'specs/never-read.md',
          compressFn: makeMockCompressFn(),
          worktreePath: 'worktrees/wt',
        },
        { repoRoot: 'relative/repo-root', pluginRoot: join(tmpdir(), 'plugin-root') },
      ),
    (err: unknown) => {
      assert.ok(err instanceof DispatchError, 'must be a DispatchError')
      assert.equal(err.code, 'ROOT_NOT_ABSOLUTE')
      assert.ok(err.message.includes('repoRoot'))
      return true
    },
  )
})

test('prepareDispatch refuses a relative pluginRoot with typed ROOT_NOT_ABSOLUTE before any fs work', async () => {
  const repoRoot = makeTempRepoRoot()
  try {
    await assert.rejects(
      () =>
        prepareDispatch(
          {
            candidate: makeCandidate('docs/receipts/x/000001-B-registration-result.json'),
            specPath: 'specs/never-read.md',
            compressFn: makeMockCompressFn(),
            worktreePath: 'worktrees/wt',
          },
          { repoRoot, pluginRoot: 'relative/plugin-root' },
        ),
      (err: unknown) => {
        assert.ok(err instanceof DispatchError, 'must be a DispatchError')
        assert.equal(err.code, 'ROOT_NOT_ABSOLUTE')
        assert.ok(err.message.includes('pluginRoot'))
        return true
      },
    )
  } finally {
    rmSync(repoRoot, { recursive: true, force: true })
  }
})

test('prepareDispatch refuses a relative specPath with typed ROOT_NOT_ABSOLUTE (standalone caller path rule)', async () => {
  const repoRoot = makeTempRepoRoot()
  try {
    await assert.rejects(
      () =>
        prepareDispatch(
          {
            candidate: makeCandidate('docs/receipts/x/000001-B-registration-result.json'),
            specPath: 'specs/relative-spec.md',
            compressFn: makeMockCompressFn(),
            worktreePath: 'worktrees/wt',
          },
          { repoRoot, pluginRoot: join(repoRoot, 'plugins', 'foreman-line') },
        ),
      (err: unknown) => {
        assert.ok(err instanceof DispatchError, 'must be a DispatchError')
        assert.equal(err.code, 'ROOT_NOT_ABSOLUTE')
        assert.ok(err.message.includes('specPath'))
        return true
      },
    )
  } finally {
    rmSync(repoRoot, { recursive: true, force: true })
  }
})

// ─── prepareDispatch: containment of priorReceiptLocator ─────────────────────

test('prepareDispatch refuses an out-of-root priorReceiptLocator with the containment refusal', async () => {
  const repoRoot = makeTempRepoRoot()
  try {
    const specPath = writeSpecFile(repoRoot)
    await assert.rejects(
      () =>
        prepareDispatch(
          {
            candidate: makeCandidate('../outside/000001-B-registration-result.json'),
            specPath,
            compressFn: makeMockCompressFn(),
            worktreePath: join(repoRoot, 'worktrees', 'wt'),
          },
          { repoRoot, pluginRoot: join(repoRoot, 'plugins', 'foreman-line') },
        ),
      (err: unknown) => {
        assert.ok(err instanceof Error)
        assert.ok(!(err instanceof DispatchError), 'containment uses the plain-Error vocabulary')
        assert.match((err as Error).message, /resolves outside repoRoot/)
        return true
      },
    )
  } finally {
    rmSync(repoRoot, { recursive: true, force: true })
  }
})

// ─── Approval-cli seam family: positive control (absolute roots proceed) ─────

test('positive control: prepareDispatch + executeDispatch with absolute roots proceed to normal behavior', async () => {
  const repoRoot = makeTempRepoRoot()
  try {
    const specPath = writeSpecFile(repoRoot)
    const priorReceiptLocator = writeStageBReceipt(repoRoot)
    const input: DispatchInput = {
      candidate: makeCandidate(priorReceiptLocator),
      specPath,
      compressFn: makeMockCompressFn(),
      worktreePath: join(repoRoot, 'worktrees', 'w2p2'),
    }
    const pkg = await prepareDispatch(input, {
      repoRoot,
      pluginRoot: join(repoRoot, 'plugins', 'foreman-line'),
    })
    assert.equal(pkg.order.parcelRef, 'KONE-9999')
    assert.equal(pkg.prevHash, VALID_HEX_64)

    const result = await executeDispatch(pkg, input.worktreePath, {
      repoRoot,
      pluginRoot: join(repoRoot, 'plugins', 'foreman-line'),
      dispatchWorktreeFn: successWorktreeFn,
    })
    // C1 (tip-derived contract, MRC-05): the returned receiptLocator names the
    // receipt actually written at the chain tip (the literal 000002 slot pin
    // is replaced) — the root-guard behavior itself is unchanged.
    assert.match(
      result.receiptLocator,
      new RegExp(`^docs/receipts/${WORKFLOW_ID}/\\d{6}-C-dispatch-order\\.json$`),
    )
    assert.ok(
      existsSync(join(repoRoot, ...result.receiptLocator.split('/'))),
      'Stage-C receipt is written normally',
    )
  } finally {
    rmSync(repoRoot, { recursive: true, force: true })
  }
})

// ─── executeDispatch: relative roots ─────────────────────────────────────────

test('executeDispatch refuses a relative repoRoot with typed ROOT_NOT_ABSOLUTE before the worktree call', async () => {
  let worktreeCalled = false
  await assert.rejects(
    () =>
      executeDispatch(dummyPackage(), 'worktrees/wt', {
        repoRoot: 'relative/repo-root',
        pluginRoot: join(tmpdir(), 'plugin-root'),
        dispatchWorktreeFn: () => {
          worktreeCalled = true
          return successWorktreeFn()
        },
      }),
    (err: unknown) => {
      assert.ok(err instanceof DispatchError, 'must be a DispatchError')
      assert.equal(err.code, 'ROOT_NOT_ABSOLUTE')
      return true
    },
  )
  assert.equal(worktreeCalled, false, 'guard fires before the worktree subprocess call')
})

test('executeDispatch refuses a relative pluginRoot with typed ROOT_NOT_ABSOLUTE before the worktree call', async () => {
  let worktreeCalled = false
  await assert.rejects(
    () =>
      executeDispatch(dummyPackage(), 'worktrees/wt', {
        repoRoot: tmpdir(),
        pluginRoot: 'relative/plugin-root',
        dispatchWorktreeFn: () => {
          worktreeCalled = true
          return successWorktreeFn()
        },
      }),
    (err: unknown) => {
      assert.ok(err instanceof DispatchError, 'must be a DispatchError')
      assert.equal(err.code, 'ROOT_NOT_ABSOLUTE')
      return true
    },
  )
  assert.equal(worktreeCalled, false, 'guard fires before the worktree subprocess call')
})

// ─── kompressContext: relative root + workflowId containment ─────────────────

test('kompressContext refuses a relative repoRoot with typed KompressError ROOT_NOT_ABSOLUTE before compressFn', async () => {
  let compressCalled = false
  const fn: KompressFn = async (content: string) => {
    compressCalled = true
    return makeMockCompressFn()(content)
  }
  await assert.rejects(
    () =>
      kompressContext(
        { parcelSpecText: 'SPEC', priorReceiptChain: [], workflowId: 'root-guards-wf' },
        fn,
        { repoRoot: 'relative/repo-root' },
      ),
    (err: unknown) => {
      assert.ok(err instanceof KompressError, 'must be a KompressError')
      assert.equal(err.code, 'ROOT_NOT_ABSOLUTE')
      return true
    },
  )
  assert.equal(compressCalled, false, 'guard fires before the compressFn call')
})

test("kompressContext refuses an out-of-root workflowId ('../..') before the mkdir/write pair", async () => {
  const tmpDir = mkdtempSync(join(tmpdir(), 'root-guards-kompress-'))
  try {
    await assert.rejects(
      () =>
        kompressContext(
          { parcelSpecText: 'SPEC', priorReceiptChain: [], workflowId: '../..' },
          makeMockCompressFn(),
          { repoRoot: tmpDir },
        ),
      (err: unknown) => {
        assert.ok(err instanceof Error)
        assert.ok(!(err instanceof KompressError), 'containment uses the plain-Error vocabulary')
        assert.match((err as Error).message, /resolves outside repoRoot/)
        return true
      },
    )
    assert.equal(
      existsSync(join(tmpDir, 'kompress.json')),
      false,
      'refusal happens before any receipt write',
    )
  } finally {
    rmSync(tmpDir, { recursive: true, force: true })
  }
})

test('positive control: kompressContext with an absolute root and in-root workflowId proceeds to normal behavior', async () => {
  const tmpDir = mkdtempSync(join(tmpdir(), 'root-guards-kompress-pos-'))
  try {
    const result = await kompressContext(
      { parcelSpecText: 'SPEC', priorReceiptChain: [], workflowId: 'root-guards-pos' },
      makeMockCompressFn(),
      { repoRoot: tmpDir },
    )
    assert.equal(result.artifactId, 'mock-artifact-id-xyz')
    assert.equal(result.kompressReceiptRef, 'docs/receipts/root-guards-pos/kompress.json')
    assert.ok(
      existsSync(join(tmpDir, 'docs', 'receipts', 'root-guards-pos', 'kompress.json')),
      'receipt is written normally',
    )
  } finally {
    rmSync(tmpDir, { recursive: true, force: true })
  }
})

// ─── query: relative roots ───────────────────────────────────────────────────

test('queryAndRankCandidates refuses a relative repoRoot with typed ROOT_NOT_ABSOLUTE before any MCP client', async () => {
  let factoryCalled = false
  await assert.rejects(
    () =>
      queryAndRankCandidates({
        identity: IDENTITY,
        clientFactory: () => {
          factoryCalled = true
          throw new Error('client factory must not be reached')
        },
        repoRoot: 'relative/repo-root',
      }),
    (err: unknown) => {
      assert.ok(err instanceof DispatchError, 'must be a DispatchError')
      assert.equal(err.code, 'ROOT_NOT_ABSOLUTE')
      return true
    },
  )
  assert.equal(factoryCalled, false, 'guard fires before any MCP client exists')
})

test('scanReceiptsForResolution refuses a relative repoRoot with typed ROOT_NOT_ABSOLUTE before any fs scan', () => {
  assert.throws(
    () => scanReceiptsForResolution('relative/repo-root'),
    (err: unknown) => {
      assert.ok(err instanceof DispatchError, 'must be a DispatchError')
      assert.equal(err.code, 'ROOT_NOT_ABSOLUTE')
      return true
    },
  )
})

test('positive control: queryAndRankCandidates + scanReceiptsForResolution with absolute roots proceed to normal behavior', async () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'root-guards-query-pos-'))
  try {
    const stub = makeStubClient()
    const result = await queryAndRankCandidates({
      identity: IDENTITY,
      clientFactory: stub.factory,
      repoRoot: tempRoot,
    })
    assert.deepEqual(result, [])
    assert.deepEqual(stub.calls, ['getAccessibleAtlassianResources', 'searchJiraIssuesUsingJql'])

    const resolutionMap = scanReceiptsForResolution(tempRoot)
    assert.ok(resolutionMap instanceof Map)
    assert.equal(resolutionMap.size, 0)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})
