/**
 * AC11: unit tests for the query sub-module.
 *
 * All tests inject an McpToolClient stub — NO live gateway spawn, NO network.
 * Receipt resolution tests use a temp directory fixture cleaned up in finally.
 *
 * Coverage:
 *   - Successful search: one resolved + one unresolved candidate
 *   - Empty result
 *   - Search tool error propagates
 *   - CloudId discovery failure (kaseya site absent)
 *   - JQL safe-token enforcement: safe token passes, unsafe token throws
 *   - WorkflowId resolution: correct priorReceiptLocator from Stage-B receipt
 *   - WorkflowId resolution: highest-sequence file wins when 000002-C-* present
 *   - CloudId is passed to the search tool
 *   - Correct JQL is passed to the search tool
 *   - Client is closed after queryAndRankCandidates completes
 *   - Client is closed even when an error is thrown
 */
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import {
  buildCandidateJql,
  type DispatchIdentity,
  DispatchIdentityUndeclared,
  type McpToolClient,
  queryAndRankCandidates,
  SITE_URL,
  scanReceiptsForResolution,
} from '../src/index.js'

// ─── Constants ────────────────────────────────────────────────────────────────

const KASEYA_CLOUD_ID = 'ce9c498d-4b25-4dd1-855b-deccb810936c'

/** Caller-declared identity (P1b): explicit at every call site, never a default. */
const IDENTITY: DispatchIdentity = {
  project_key: 'KONE',
  dispatch_queue: 'dispatch.owner@example.com',
}

/** The `:`-prefixed Atlassian account-id form — the colon-finding regression pin. */
const COLON_ACCOUNT_ID = '557058:f58131cb-b67c-48f0-b3c1-e6d24a441e3d'

// ─── Stub helpers ─────────────────────────────────────────────────────────────

interface ToolCall {
  name: string
  args: Record<string, unknown>
}

interface IssueShape {
  key?: string
  fields?: {
    summary?: string
    priority?: { name?: string }
    status?: { name?: string }
  }
}

interface StubOptions {
  /** Cloud id returned for getAccessibleAtlassianResources. Default: KASEYA_CLOUD_ID */
  cloudId?: string
  /** Include the kaseya site in the resources response. Default: true */
  includeKaseya?: boolean
  /** Issues returned by searchJiraIssuesUsingJql. Default: [] */
  issues?: IssueShape[]
  /** If true, callTool throws for searchJiraIssuesUsingJql */
  searchError?: boolean
  /** If true, callTool throws for getAccessibleAtlassianResources */
  resourcesError?: boolean
}

/**
 * A recording McpToolClient stub with canned responses. No network; no gateway.
 */
function makeStub(opts: StubOptions = {}): {
  factory: () => McpToolClient
  calls: ToolCall[]
  isClosed: () => boolean
} {
  const cloudId = opts.cloudId ?? KASEYA_CLOUD_ID
  const includeKaseya = opts.includeKaseya ?? true
  const issues = opts.issues ?? []
  const calls: ToolCall[] = []
  let closed = false

  const client: McpToolClient = {
    async callTool(name, args) {
      calls.push({ name, args })
      if (name === 'getAccessibleAtlassianResources') {
        if (opts.resourcesError === true) throw new Error('resources gateway error')
        return JSON.stringify([
          { id: 'other-id', url: 'https://other.example.com' },
          ...(includeKaseya ? [{ id: cloudId, url: SITE_URL }] : []),
        ])
      }
      if (name === 'searchJiraIssuesUsingJql') {
        if (opts.searchError === true) throw new Error('search gateway error')
        return JSON.stringify({ issues })
      }
      return '{}'
    },
    async close() {
      closed = true
    },
  }

  return {
    factory: () => client,
    calls,
    isClosed: () => closed,
  }
}

/** Find the first call to a named tool (throws if absent). */
function callArgs(calls: ToolCall[], toolName: string): Record<string, unknown> {
  const found = calls.find((c) => c.name === toolName)
  assert.ok(found !== undefined, `expected a call to ${toolName}`)
  return found.args
}

// ─── Fixture helpers ──────────────────────────────────────────────────────────

/**
 * Create a temp repo root with a Stage-B receipt for the given workflowId and
 * ticketKeys. Extra files (e.g. '000002-C-dispatch-order.json') are also written
 * to the receipt directory as empty JSON objects. Returns the temp root path;
 * caller must rmSync it in a finally block.
 */
function makeTempReceiptDir(
  workflowId: string,
  ticketKeys: string[],
  extraFiles: string[] = [],
): string {
  const tempRoot = mkdtempSync(join(tmpdir(), 'w2p1-test-'))
  const receiptDir = join(tempRoot, 'docs', 'receipts', workflowId)
  mkdirSync(receiptDir, { recursive: true })
  writeFileSync(
    join(receiptDir, '000001-B-registration-result.json'),
    JSON.stringify({ subject: { ticketKeys } }),
  )
  for (const extra of extraFiles) {
    writeFileSync(join(receiptDir, extra), '{}')
  }
  return tempRoot
}

// ─── Tests ───────────────────────────────────────────────────────────────────

test('queryAndRankCandidates: resolved candidate comes first, unresolved after', async () => {
  const workflowId = '11111111-2222-3333-4444-555555555555'
  const tempRoot = makeTempReceiptDir(workflowId, ['KONE-100'])
  try {
    const stub = makeStub({
      issues: [
        {
          key: 'KONE-100',
          fields: {
            summary: 'Resolved issue',
            priority: { name: 'High' },
            status: { name: 'To Do' },
          },
        },
        {
          key: 'KONE-200',
          fields: {
            summary: 'Unresolved issue',
            priority: { name: 'Medium' },
            status: { name: 'In Progress' },
          },
        },
      ],
    })
    const result = await queryAndRankCandidates({
      identity: IDENTITY,
      clientFactory: stub.factory,
      repoRoot: tempRoot,
    })

    assert.equal(result.length, 2)

    // Resolved candidate: comes first
    assert.equal(result[0]?.ticketKey, 'KONE-100')
    assert.equal(result[0]?.workflowId, workflowId)
    assert.equal(
      result[0]?.priorReceiptLocator,
      `docs/receipts/${workflowId}/000001-B-registration-result.json`,
    )
    assert.equal(result[0]?.summary, 'Resolved issue')
    assert.equal(result[0]?.priority, 'High')
    assert.equal(result[0]?.status, 'To Do')

    // Unresolved candidate: comes second
    assert.equal(result[1]?.ticketKey, 'KONE-200')
    assert.equal(result[1]?.workflowId, null)
    assert.equal(result[1]?.priorReceiptLocator, null)
    assert.equal(result[1]?.summary, 'Unresolved issue')
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('queryAndRankCandidates: empty issues array returns empty list', async () => {
  const stub = makeStub({ issues: [] })
  const tempRoot = mkdtempSync(join(tmpdir(), 'w2p1-empty-'))
  try {
    const result = await queryAndRankCandidates({
      identity: IDENTITY,
      clientFactory: stub.factory,
      repoRoot: tempRoot,
    })
    assert.equal(result.length, 0)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('queryAndRankCandidates: search tool error propagates', async () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'w2p1-searcherr-'))
  try {
    const stub = makeStub({ searchError: true })
    await assert.rejects(
      queryAndRankCandidates({
        identity: IDENTITY,
        clientFactory: stub.factory,
        repoRoot: tempRoot,
      }),
      (err: unknown) => err instanceof Error && err.message.includes('search gateway error'),
    )
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('queryAndRankCandidates: cloudId discovery failure when kaseya site is absent', async () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'w2p1-nocloud-'))
  try {
    const stub = makeStub({ includeKaseya: false })
    await assert.rejects(
      queryAndRankCandidates({
        identity: IDENTITY,
        clientFactory: stub.factory,
        repoRoot: tempRoot,
      }),
      (err: unknown) => err instanceof Error && err.message.includes(SITE_URL),
    )
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('buildCandidateJql: safe identity produces correct JQL', () => {
  const jql = buildCandidateJql('KONE', 'dispatch.owner@example.com')
  assert.ok(jql.includes('project = KONE'), 'JQL must reference project key')
  assert.ok(
    jql.includes('assignee = "dispatch.owner@example.com"'),
    'JQL must include the dispatch queue identity as a quoted literal',
  )
  assert.ok(jql.includes('"To Do"'), 'JQL must include To Do status')
  assert.ok(jql.includes('"In Progress"'), 'JQL must include In Progress status')
  assert.ok(jql.includes('ORDER BY priority ASC'), 'JQL must order by priority')
})

test('buildCandidateJql: `:`-prefixed account id is accepted and quoted (colon-finding pin)', () => {
  const jql = buildCandidateJql('KONE', COLON_ACCOUNT_ID)
  assert.ok(
    jql.includes(`assignee = "${COLON_ACCOUNT_ID}"`),
    'the colon-prefixed account id must appear as a quoted literal',
  )
})

test('buildCandidateJql: unsafe project key (contains @) throws assertJqlSafeToken error', () => {
  assert.throws(
    () => buildCandidateJql('BAD@KEY', 'dispatch.owner@example.com'),
    (err: unknown) => err instanceof Error && err.message.includes('assertJqlSafeToken'),
  )
})

test('buildCandidateJql: unsafe project key (contains space) throws assertJqlSafeToken error', () => {
  assert.throws(
    () => buildCandidateJql('BAD KEY', 'dispatch.owner@example.com'),
    (err: unknown) => err instanceof Error && err.message.includes('assertJqlSafeToken'),
  )
})

test('buildCandidateJql: dispatch queue containing a double quote throws the quoted-literal guard', () => {
  assert.throws(
    () => buildCandidateJql('KONE', 'evil" OR assignee != "'),
    (err: unknown) => err instanceof Error && err.message.includes('assertJqlSafeQuotedLiteral'),
  )
})

test('buildCandidateJql: dispatch queue containing a backslash throws the quoted-literal guard', () => {
  assert.throws(
    () => buildCandidateJql('KONE', 'evil\\user'),
    (err: unknown) => err instanceof Error && err.message.includes('assertJqlSafeQuotedLiteral'),
  )
})

test('workflowId resolution: priorReceiptLocator is highest-sequence file when 000002-C-* present', async () => {
  const workflowId = '22222222-3333-4444-5555-666666666666'
  const tempRoot = makeTempReceiptDir(workflowId, ['KONE-100'], ['000002-C-dispatch-order.json'])
  try {
    const stub = makeStub({
      issues: [
        {
          key: 'KONE-100',
          fields: { summary: 'Test', priority: { name: 'High' }, status: { name: 'To Do' } },
        },
      ],
    })
    const result = await queryAndRankCandidates({
      identity: IDENTITY,
      clientFactory: stub.factory,
      repoRoot: tempRoot,
    })

    assert.equal(result.length, 1)
    assert.equal(result[0]?.workflowId, workflowId)
    // Must pick 000002-C-* (seq 2) over 000001-B-* (seq 1)
    assert.equal(
      result[0]?.priorReceiptLocator,
      `docs/receipts/${workflowId}/000002-C-dispatch-order.json`,
    )
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('queryAndRankCandidates: candidate with no matching receipt has null workflowId + locator', async () => {
  const workflowId = '33333333-4444-5555-6666-777777777777'
  // Receipt exists for KONE-999, but the query returns KONE-888 (no matching receipt)
  const tempRoot = makeTempReceiptDir(workflowId, ['KONE-999'])
  try {
    const stub = makeStub({
      issues: [
        {
          key: 'KONE-888',
          fields: { summary: 'No receipt', priority: { name: 'Low' }, status: { name: 'To Do' } },
        },
      ],
    })
    const result = await queryAndRankCandidates({
      identity: IDENTITY,
      clientFactory: stub.factory,
      repoRoot: tempRoot,
    })

    assert.equal(result.length, 1)
    assert.equal(result[0]?.ticketKey, 'KONE-888')
    assert.equal(result[0]?.workflowId, null)
    assert.equal(result[0]?.priorReceiptLocator, null)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('queryAndRankCandidates: cloudId is passed to the search tool', async () => {
  const customCloudId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
  const stub = makeStub({ cloudId: customCloudId, issues: [] })
  const tempRoot = mkdtempSync(join(tmpdir(), 'w2p1-cloudid-'))
  try {
    await queryAndRankCandidates({
      identity: IDENTITY,
      clientFactory: stub.factory,
      repoRoot: tempRoot,
    })
    const args = callArgs(stub.calls, 'searchJiraIssuesUsingJql')
    assert.equal(args.cloudId, customCloudId)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('queryAndRankCandidates: correct JQL is sent to the search tool', async () => {
  const stub = makeStub({ issues: [] })
  const tempRoot = mkdtempSync(join(tmpdir(), 'w2p1-jql-'))
  try {
    await queryAndRankCandidates({
      identity: IDENTITY,
      clientFactory: stub.factory,
      repoRoot: tempRoot,
    })
    const args = callArgs(stub.calls, 'searchJiraIssuesUsingJql')
    const jql = args.jql
    assert.equal(typeof jql, 'string')
    assert.ok(String(jql).includes('project = KONE'))
    assert.ok(String(jql).includes('assignee = "dispatch.owner@example.com"'))
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('queryAndRankCandidates: client is closed after successful query', async () => {
  const stub = makeStub({ issues: [] })
  const tempRoot = mkdtempSync(join(tmpdir(), 'w2p1-close-'))
  try {
    await queryAndRankCandidates({
      identity: IDENTITY,
      clientFactory: stub.factory,
      repoRoot: tempRoot,
    })
    assert.ok(stub.isClosed(), 'MCP client must be closed after queryAndRankCandidates')
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('queryAndRankCandidates: client is closed even when search throws', async () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'w2p1-closederr-'))
  try {
    const stub = makeStub({ searchError: true })
    await assert.rejects(
      queryAndRankCandidates({
        identity: IDENTITY,
        clientFactory: stub.factory,
        repoRoot: tempRoot,
      }),
    )
    assert.ok(stub.isClosed(), 'MCP client must be closed even after a thrown error')
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('queryAndRankCandidates: receipts dir absent is handled gracefully (all null)', async () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'w2p1-noreceipts-'))
  // No docs/receipts/ directory created
  try {
    const stub = makeStub({
      issues: [
        {
          key: 'KONE-300',
          fields: {
            summary: 'No receipts dir',
            priority: { name: 'Medium' },
            status: { name: 'To Do' },
          },
        },
      ],
    })
    const result = await queryAndRankCandidates({
      identity: IDENTITY,
      clientFactory: stub.factory,
      repoRoot: tempRoot,
    })
    assert.equal(result.length, 1)
    assert.equal(result[0]?.workflowId, null)
    assert.equal(result[0]?.priorReceiptLocator, null)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

// ─── P1b rework R1: non-KONE project key must reach the JQL ──────────────────

test('queryAndRankCandidates: a non-KONE project_key reaches the search JQL (no fabricated KONE)', async () => {
  // Every other test passes 'KONE', so a mutant hardcoding 'KONE' would be
  // value-indistinguishable. This test is the one that bites it.
  const stub = makeStub({ issues: [] })
  const tempRoot = mkdtempSync(join(tmpdir(), 'p1b-acme-'))
  try {
    await queryAndRankCandidates({
      identity: { project_key: 'ACME', dispatch_queue: 'dispatch.owner@example.com' },
      clientFactory: stub.factory,
      repoRoot: tempRoot,
    })
    const jql = String(callArgs(stub.calls, 'searchJiraIssuesUsingJql').jql)
    assert.ok(jql.includes('project = ACME'), `JQL must use the caller's key, got: ${jql}`)
    assert.equal(jql.includes('KONE'), false, 'the JQL must not fabricate KONE')
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

// ─── P1b: null-identity refusal (AC4) ────────────────────────────────────────

test('null project_key: typed DispatchIdentityUndeclared, thrown before any client exists', async () => {
  let factoryInvoked = false
  const stub = makeStub()
  const trackingFactory = () => {
    factoryInvoked = true
    return stub.factory()
  }
  await assert.rejects(
    queryAndRankCandidates({
      identity: { project_key: null, dispatch_queue: 'dispatch.owner@example.com' },
      clientFactory: trackingFactory,
      repoRoot: mkdtempSync(join(tmpdir(), 'w2p1-nullpk-')),
    }),
    (err: unknown) =>
      err instanceof DispatchIdentityUndeclared &&
      err.name === 'DispatchIdentityUndeclared' &&
      err.key === 'project_key' &&
      err.message.includes('project_key'),
  )
  assert.equal(factoryInvoked, false, 'refusal must precede MCP client creation (no side effects)')
  assert.equal(stub.calls.length, 0, 'no tool call may be made under a null identity')
})

test('null dispatch_queue: typed DispatchIdentityUndeclared, thrown before any client exists', async () => {
  let factoryInvoked = false
  const stub = makeStub()
  const trackingFactory = () => {
    factoryInvoked = true
    return stub.factory()
  }
  await assert.rejects(
    queryAndRankCandidates({
      identity: { project_key: 'KONE', dispatch_queue: null },
      clientFactory: trackingFactory,
      repoRoot: mkdtempSync(join(tmpdir(), 'w2p1-nulldq-')),
    }),
    (err: unknown) =>
      err instanceof DispatchIdentityUndeclared &&
      err.key === 'dispatch_queue' &&
      err.message.includes('dispatch_queue'),
  )
  assert.equal(factoryInvoked, false, 'refusal must precede MCP client creation (no side effects)')
  assert.equal(stub.calls.length, 0, 'no tool call may be made under a null identity')
})

test('null-identity refusal is distinguishable from a legitimately empty candidate list', async () => {
  // Accept twin: a declared identity with zero matching issues RESOLVES to [].
  const emptyStub = makeStub({ issues: [] })
  const tempRoot = mkdtempSync(join(tmpdir(), 'p1b-distinguish-'))
  try {
    const emptyResult = await queryAndRankCandidates({
      identity: IDENTITY,
      clientFactory: emptyStub.factory,
      repoRoot: tempRoot,
    })
    assert.deepEqual([...emptyResult], [], 'declared identity + no work resolves to []')

    // Reject twin: a null identity NEVER resolves — the promise rejects, so no
    // caller can ever observe [] on the refusal path.
    let resolvedValue: unknown = 'never-resolved'
    try {
      resolvedValue = await queryAndRankCandidates({
        identity: { project_key: 'KONE', dispatch_queue: null },
        clientFactory: makeStub({ issues: [] }).factory,
        repoRoot: tempRoot,
      })
      assert.fail('null identity must not resolve at all')
    } catch (err) {
      assert.ok(err instanceof DispatchIdentityUndeclared, 'refusal is the typed error')
    }
    assert.equal(
      resolvedValue,
      'never-resolved',
      'the refusal path never returns a value, [] included',
    )
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('receipt scanning works under a null-identity config (non-tracker path unaffected)', () => {
  const workflowId = '44444444-5555-6666-7777-888888888888'
  const tempRoot = makeTempReceiptDir(workflowId, ['KONE-777'])
  try {
    // A null identity refuses tracker dispatch, but receipt scanning takes no
    // identity at all — a no-tracker repo stays runnable on this path.
    const nullIdentity: DispatchIdentity = { project_key: null, dispatch_queue: null }
    assert.equal(nullIdentity.project_key, null)
    const resolution = scanReceiptsForResolution(tempRoot)
    assert.equal(resolution.size, 1)
    assert.equal(resolution.get('KONE-777')?.workflowId, workflowId)
    assert.equal(
      resolution.get('KONE-777')?.priorReceiptLocator,
      `docs/receipts/${workflowId}/000001-B-registration-result.json`,
    )
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})
