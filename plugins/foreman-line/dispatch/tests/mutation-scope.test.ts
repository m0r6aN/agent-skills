/**
 * D5 mutation-scope double-check tests (foreman-line-boundary-routing work
 * item 4) for the dispatch seams: "Mutation scope is checked twice when a task
 * envelope is supplied: preflight against spec `surfaces:` before dispatch, and
 * post-hoc against adapter-reported changed paths before the Stage-C receipt is
 * written. Missing changed-path evidence is a refusal."
 *
 * Rules under test (wiring in `dispatch/src/approval-cli/index.ts` invoking the
 * SHIPPED `mutation-scope-guard`, never reimplemented here):
 *   - PREFLIGHT (prepareDispatch, phase 1 — completes before executeDispatch's
 *     worktree call): a `mutationScope` whose `allowedFiles` is not authorized
 *     by the spec's `surfaces:` refuses with MUTATION_SCOPE_FAILED wrapping
 *     SCOPE_ENVELOPE_MISMATCH, and the worktree adapter is NEVER invoked.
 *   - PREFLIGHT, malformed paths: a denormalized path spelling in the envelope
 *     refuses with MALFORMED_PATH before any matching (guard AC2b).
 *   - POST-HOC (executeDispatch, after the worktree adapter returns, BEFORE the
 *     Stage-C receipt write): missing `changedPaths` evidence is a refusal;
 *     out-of-scope changed paths are a refusal; a `forbiddenSurfaces` path is a
 *     refusal even when `allowedFiles` authorizes it (forbidden wins). In every
 *     refusal case the Stage-C receipt is NOT written.
 *   - POSITIVE: an authorized envelope with in-scope changed paths completes
 *     and writes the Stage-C receipt.
 *
 * All fixtures use fresh mkdtempSync roots; compressFn and dispatchWorktreeFn
 * are always injected mocks — no MCP calls, no git mutations. The worktree mock
 * counts invocations so the "before worktree creation" half of the gate is an
 * observed zero, not an assumption.
 */
import assert from 'node:assert/strict'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import type { ScopeEnvelope } from '../../mutation-scope-guard/src/index.js'
import type {
  CandidateRecord,
  DispatchInput,
  DispatchOptions,
  DispatchWorktreeInput,
  DispatchWorktreeOutput,
  KompressCallResult,
  KompressFn,
} from '../src/index.js'
import { DispatchError, executeDispatch, prepareDispatch } from '../src/index.js'

// ─── Paths to real YAML fixtures (same pattern as approval-cli.test.ts) ──────

const HERE = dirname(fileURLToPath(import.meta.url))
const REAL_ROUTING_POLICY = join(HERE, '..', '..', 'routing-policy', 'routing-policy.yaml')
const REAL_SKILL_INJECTION = join(HERE, '..', '..', 'skill-injection', 'skill-injection.yaml')

const WORKFLOW_ID = 'a1b2c3d4-0000-4000-8000-000000000001'
const CORRELATION_ID = 'd5c0de00-0000-4000-8000-000000000001'
const VALID_HEX_64 = 'a'.repeat(64)

/**
 * C1 tip-derived contract (MRC-05): the Stage-C DispatchOrder slot is no
 * longer the literal `000002` — it is allocated at the chain tip at write
 * time. These controls therefore speak of "a DispatchOrder receipt at WHATEVER
 * slot it landed" (strengthening the old literal-slot pin: a stray write at
 * any sequence is caught, not just at 000002).
 */
function dispatchOrderReceiptNames(repoRoot: string): string[] {
  const receiptDir = join(repoRoot, 'docs', 'receipts', WORKFLOW_ID)
  if (!existsSync(receiptDir)) return []
  return readdirSync(receiptDir).filter((name) => /^\d{6}-C-dispatch-order\.json$/.test(name))
}

/**
 * Well-formed spec `surfaces:` (the guard refuses trailing-slash spellings as
 * malformed — empty final segment — so the mutation-scope fixtures use the
 * canonical `X/**` vocabulary).
 */
const SURFACES = ['plugins/foreman-line/dispatch/**']

/** An envelope fully authorized by SURFACES. */
const AUTHORIZED_ENVELOPE: ScopeEnvelope = {
  allowedFiles: ['plugins/foreman-line/dispatch/**'],
  forbiddenSurfaces: [],
}

// ─── Fixture helpers ─────────────────────────────────────────────────────────

function makeTempRepoRoot(): string {
  const tmpRoot = mkdtempSync(join(tmpdir(), 'mutation-scope-test-'))
  const routingDir = join(tmpRoot, 'plugins', 'foreman-line', 'routing-policy')
  mkdirSync(routingDir, { recursive: true })
  writeFileSync(join(routingDir, 'routing-policy.yaml'), readFileSync(REAL_ROUTING_POLICY, 'utf8'))
  const skillDir = join(tmpRoot, 'plugins', 'foreman-line', 'skill-injection')
  mkdirSync(skillDir, { recursive: true })
  writeFileSync(join(skillDir, 'skill-injection.yaml'), readFileSync(REAL_SKILL_INJECTION, 'utf8'))
  return tmpRoot
}

/** Write a minimal spec file whose frontmatter `surfaces:` is the given list. */
function writeSpecFile(repoRoot: string, surfaces: readonly string[]): string {
  const specDir = join(repoRoot, 'specs')
  mkdirSync(specDir, { recursive: true })
  const fmLines = [
    "routing_class: 'architecture/risk'",
    "data_classification: 'public'",
    `surfaces: [${surfaces.map((s) => `'${s}'`).join(', ')}]`,
    "permission_profile: 'builder-standard'",
  ].join('\n')
  const specPath = join(specDir, 'test-spec.md')
  writeFileSync(specPath, `---\n${fmLines}\n---\n\n# Spec body\nSome content.`)
  return specPath
}

function writeStageBReceipt(repoRoot: string, workflowId: string): string {
  const receiptDir = join(repoRoot, 'docs', 'receipts', workflowId)
  mkdirSync(receiptDir, { recursive: true })
  const receiptFile = '000001-B-registration-result.json'
  const receipt = {
    schemaVersion: '1',
    kind: 'stage',
    stage: 'B',
    correlation: {
      correlationId: CORRELATION_ID,
      sessionId: 'a1a1a1a1-0000-4000-8000-000000000002',
      workflowId,
      runId: 'a2a2a2a2-0000-4000-8000-000000000003',
    },
    workflowId,
    sequence: 1,
    prevHash: 'prev-stage-a-hash',
    hash: VALID_HEX_64,
    timestamp: new Date().toISOString(),
  }
  writeFileSync(join(receiptDir, receiptFile), JSON.stringify(receipt, null, 2))
  return `docs/receipts/${workflowId}/${receiptFile}`
}

function makeMockCompressFn(): KompressFn {
  return async (_content: string): Promise<KompressCallResult> => ({
    compressed: 'compressed-spec-text',
    hash: 'mock-artifact-id-xyz',
    originalTokens: 200,
    compressedTokens: 50,
    tokensSaved: 150,
    transforms: ['semantic-dedup'],
  })
}

function makeCandidate(priorReceiptLocator: string): CandidateRecord {
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
 * A dispatchWorktreeFn mock returning `result` and COUNTING invocations — the
 * count is the "refused before worktree creation" evidence.
 */
function makeTrackingWorktreeFn(result: DispatchWorktreeOutput): {
  fn: (opts: DispatchWorktreeInput) => DispatchWorktreeOutput
  calls: () => number
} {
  let n = 0
  return {
    fn: (_opts: DispatchWorktreeInput) => {
      n += 1
      return result
    },
    calls: () => n,
  }
}

/**
 * Run the real two-phase flow (prepareDispatch then executeDispatch) with the
 * given envelope and worktree adapter, returning the tracking mock so callers
 * can assert on worktree invocations.
 */
async function runTwoPhaseFlow(
  repoRoot: string,
  mutationScope: ScopeEnvelope,
  worktreeResult: DispatchWorktreeOutput,
): Promise<{ worktreeCalls: () => number }> {
  const specPath = writeSpecFile(repoRoot, SURFACES)
  const priorReceiptLocator = writeStageBReceipt(repoRoot, WORKFLOW_ID)
  const input: DispatchInput = {
    candidate: makeCandidate(priorReceiptLocator),
    specPath,
    compressFn: makeMockCompressFn(),
    worktreePath: join(repoRoot, 'worktrees', 'w'),
    mutationScope,
  }
  const options: DispatchOptions = {
    repoRoot,
    pluginRoot: join(repoRoot, 'plugins', 'foreman-line'),
  }
  const tracking = makeTrackingWorktreeFn(worktreeResult)
  const pkg = await prepareDispatch(input, options)
  await executeDispatch(pkg, join(repoRoot, 'worktrees', 'w'), {
    ...options,
    dispatchWorktreeFn: tracking.fn,
  })
  return { worktreeCalls: tracking.calls }
}

function assertMutationScopeRefusal(err: unknown, messageFragment: string): boolean {
  assert.ok(err instanceof DispatchError, `expected DispatchError, got ${String(err)}`)
  assert.equal(err.code, 'MUTATION_SCOPE_FAILED')
  assert.ok(
    err.message.includes(messageFragment),
    `expected message to include '${messageFragment}': ${err.message}`,
  )
  return true
}

// ─── Preflight: before worktree creation ─────────────────────────────────────

test('D5 preflight refusal (unauthorized surface): allowedFiles not authorized by spec surfaces: is refused with MUTATION_SCOPE_FAILED before any worktree creation', async () => {
  const repoRoot = makeTempRepoRoot()
  try {
    const tracking = makeTrackingWorktreeFn({ code: 0, stdout: '', stderr: '' })
    const specPath = writeSpecFile(repoRoot, SURFACES)
    const priorReceiptLocator = writeStageBReceipt(repoRoot, WORKFLOW_ID)
    await assert.rejects(
      () =>
        prepareDispatch(
          {
            candidate: makeCandidate(priorReceiptLocator),
            specPath,
            compressFn: makeMockCompressFn(),
            worktreePath: join(repoRoot, 'worktrees', 'w'),
            mutationScope: {
              allowedFiles: ['plugins/foreman-line/contracts/**'],
              forbiddenSurfaces: [],
            },
          },
          { repoRoot, pluginRoot: join(repoRoot, 'plugins', 'foreman-line') },
        ),
      (err: unknown) => {
        assertMutationScopeRefusal(err, 'preflight refused dispatch')
        assert.ok(
          (err as DispatchError).message.includes('plugins/foreman-line/contracts/**'),
          'refusal must name the unauthorized entry',
        )
        return true
      },
    )
    assert.equal(tracking.calls(), 0, 'worktree adapter must never run after a preflight refusal')
    assert.deepEqual(
      dispatchOrderReceiptNames(repoRoot),
      [],
      'no Stage-C receipt may exist after a preflight refusal',
    )
  } finally {
    rmSync(repoRoot, { recursive: true, force: true })
  }
})

test('D5 preflight refusal (malformed path): a denormalized allowedFiles spelling refuses with MALFORMED_PATH before any worktree creation', async () => {
  const repoRoot = makeTempRepoRoot()
  try {
    const tracking = makeTrackingWorktreeFn({ code: 0, stdout: '', stderr: '' })
    const specPath = writeSpecFile(repoRoot, SURFACES)
    const priorReceiptLocator = writeStageBReceipt(repoRoot, WORKFLOW_ID)
    await assert.rejects(
      () =>
        prepareDispatch(
          {
            candidate: makeCandidate(priorReceiptLocator),
            specPath,
            compressFn: makeMockCompressFn(),
            worktreePath: join(repoRoot, 'worktrees', 'w'),
            mutationScope: {
              allowedFiles: ['plugins/foreman-line/dispatch/../secret.ts'],
              forbiddenSurfaces: [],
            },
          },
          { repoRoot, pluginRoot: join(repoRoot, 'plugins', 'foreman-line') },
        ),
      (err: unknown) => {
        assertMutationScopeRefusal(err, 'malformed path or entry')
        return true
      },
    )
    assert.equal(tracking.calls(), 0, 'worktree adapter must never run after a preflight refusal')
    assert.deepEqual(dispatchOrderReceiptNames(repoRoot), [], 'no Stage-C receipt may exist')
  } finally {
    rmSync(repoRoot, { recursive: true, force: true })
  }
})

// ─── Post-hoc: before the Stage-C receipt is written ─────────────────────────

test('D5 post-hoc refusal (missing changed-path evidence): an adapter that reports no changedPaths is a refusal before the Stage-C receipt is written', async () => {
  const repoRoot = makeTempRepoRoot()
  try {
    // The adapter DID run (post-hoc is post-execution by definition) but
    // reported no changed-path evidence — D5: "Missing changed-path evidence
    // is a refusal."
    const tracking = makeTrackingWorktreeFn({ code: 0, stdout: 'ok', stderr: '' })
    const specPath = writeSpecFile(repoRoot, SURFACES)
    const priorReceiptLocator = writeStageBReceipt(repoRoot, WORKFLOW_ID)
    const pkg = await prepareDispatch(
      {
        candidate: makeCandidate(priorReceiptLocator),
        specPath,
        compressFn: makeMockCompressFn(),
        worktreePath: join(repoRoot, 'worktrees', 'w'),
        mutationScope: AUTHORIZED_ENVELOPE,
      },
      { repoRoot, pluginRoot: join(repoRoot, 'plugins', 'foreman-line') },
    )
    await assert.rejects(
      () =>
        executeDispatch(pkg, join(repoRoot, 'worktrees', 'w'), {
          repoRoot,
          pluginRoot: join(repoRoot, 'plugins', 'foreman-line'),
          dispatchWorktreeFn: tracking.fn,
        }),
      (err: unknown) => {
        assertMutationScopeRefusal(err, 'requires the worktree adapter to report changedPaths')
        return true
      },
    )
    assert.equal(
      tracking.calls(),
      1,
      'the adapter ran first (post-hoc is post-execution); its missing evidence is what refused',
    )
    assert.deepEqual(
      dispatchOrderReceiptNames(repoRoot),
      [],
      'Stage-C receipt must NOT be written when changed-path evidence is missing',
    )
  } finally {
    rmSync(repoRoot, { recursive: true, force: true })
  }
})

test('D5 post-hoc refusal (out-of-scope evidence): a changed path outside allowedFiles is refused before the Stage-C receipt is written', async () => {
  const repoRoot = makeTempRepoRoot()
  try {
    await assert.rejects(
      () =>
        runTwoPhaseFlow(repoRoot, AUTHORIZED_ENVELOPE, {
          code: 0,
          stdout: 'ok',
          stderr: '',
          changedPaths: ['plugins/foreman-line/contracts/src/x.ts'],
        }),
      (err: unknown) => {
        assertMutationScopeRefusal(err, 'outside declared mutation scope')
        assert.ok(
          (err as DispatchError).message.includes('plugins/foreman-line/contracts/src/x.ts'),
          'refusal must name the out-of-scope path',
        )
        return true
      },
    )
    assert.deepEqual(
      dispatchOrderReceiptNames(repoRoot),
      [],
      'Stage-C receipt must NOT be written when post-hoc evidence is out of scope',
    )
  } finally {
    rmSync(repoRoot, { recursive: true, force: true })
  }
})

test('D5 post-hoc refusal (forbidden wins): a forbiddenSurfaces path is refused even though allowedFiles authorizes it, before the Stage-C receipt is written', async () => {
  const repoRoot = makeTempRepoRoot()
  try {
    await assert.rejects(
      () =>
        runTwoPhaseFlow(
          repoRoot,
          {
            allowedFiles: ['plugins/foreman-line/dispatch/**'],
            // Containment (a forbidden entry inside an allowed region) is
            // refinement and survives preflight by design — this is the
            // fixture that makes the post-hoc forbidden-wins branch reachable.
            forbiddenSurfaces: ['plugins/foreman-line/dispatch/src/secret.ts'],
          },
          {
            code: 0,
            stdout: 'ok',
            stderr: '',
            changedPaths: ['plugins/foreman-line/dispatch/src/secret.ts'],
          },
        ),
      (err: unknown) => {
        assertMutationScopeRefusal(err, 'outside declared mutation scope')
        return true
      },
    )
    assert.deepEqual(
      dispatchOrderReceiptNames(repoRoot),
      [],
      'Stage-C receipt must NOT be written when a forbidden surface changed',
    )
  } finally {
    rmSync(repoRoot, { recursive: true, force: true })
  }
})

// ─── Positive path ───────────────────────────────────────────────────────────

test('D5 positive: an authorized envelope with in-scope changed paths completes and writes the Stage-C receipt', async () => {
  const repoRoot = makeTempRepoRoot()
  try {
    const tracking = await runTwoPhaseFlow(repoRoot, AUTHORIZED_ENVELOPE, {
      code: 0,
      stdout: 'ok',
      stderr: '',
      changedPaths: ['plugins/foreman-line/dispatch/src/index.ts'],
    })
    assert.equal(tracking.worktreeCalls(), 1, 'the worktree adapter runs exactly once')
    const names = dispatchOrderReceiptNames(repoRoot)
    assert.equal(names.length, 1, 'Stage-C receipt must be written on the authorized path')
    // C1 (tip-derived contract): the DispatchOrder lands at the chain tip
    // (highest sequence), never at a literal slot.
    const receiptDir = join(repoRoot, 'docs', 'receipts', WORKFLOW_ID)
    const chainNames = readdirSync(receiptDir).filter((name) =>
      /^\d{6}-[A-F]-[a-z0-9-]+\.json$/.test(name),
    )
    const maxSequence = Math.max(...chainNames.map((name) => Number(name.slice(0, 6))))
    assert.equal(Number(names[0]?.slice(0, 6)), maxSequence, 'the DispatchOrder is the tip entry')
  } finally {
    rmSync(repoRoot, { recursive: true, force: true })
  }
})
