/**
 * P2b-i / D19 — typed relative-root refusals (`ROOT_NOT_ABSOLUTE`) at every
 * exported root-consuming seam of `integration/src/`.
 *
 * Every guarded seam MUST refuse a relative root with `IntegrationError` code
 * `ROOT_NOT_ABSOLUTE` before any fs/subprocess/path work (asserted by a
 * work-flag on every injectable seam). One positive control per family proves
 * an ABSOLUTE root passes the guard at the seam boundary and the seam proceeds
 * to its normal error/result: `loadChainTip` (sync family) and `runDocSpineHook`
 * (async family), plus `prepareClosure` and `runReport` companions.
 *
 * Out-of-root refusals ALREADY EXIST for this package and are deliberately NOT
 * duplicated here:
 *   - closure.test.ts 'AC8: prepareClosure raises MERGE_SHA_INVALID /
 *     SPEC_MOVE_INVALID on bad inputs' refuses `../` traversal inside
 *     `specLifecycleMove`;
 *   - exit-vehicle.test.ts 'AC3: loadChainTip rejects a non-UUID workflowId
 *     (no path assembly from hostile input)' refuses a non-UUID workflowId.
 */
import assert from 'node:assert/strict'
import { rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import type { ReceiptDocument } from '../../receipts/src/index.js'
import { emitHalfClosedClosureReceipt } from '../src/closure-receipt.js'
import {
  ExitVehicleError,
  emitClosureReceipt,
  emitIntegrationReceipt,
  executeClosure,
  fetchEffectiveRulesLive,
  IntegrationError,
  loadActiveSpecsLive,
  loadChainTip,
  planPrAutomation,
  prepareClosure,
  retryHalfClosedClosure,
  runDocSpineHook,
  runReport,
  runStageE,
  runStageF,
  type WriteReceiptFn,
} from '../src/index.js'
import {
  makeRecordingTransport,
  makeStageEChain,
  makeTempRepoRoot,
  SPEC_MOVE,
  toLoaded,
  VALID_MERGE_SHA,
  WORKFLOW_ID,
} from './closure-fixtures.js'

const RELATIVE_ROOT = 'relative/repo-root'
// Absolute but never touched on disk except where a test says so.
const ABSOLUTE_ROOT = join(tmpdir(), 'w4p4-root-guards-absolute')
const TICKET = 'KONE-23210'
const HEAD_SHA = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2'
const VALID_PR_REF = `pr-104@${HEAD_SHA}`

function isRootNotAbsolute(err: unknown): boolean {
  assert.ok(err instanceof IntegrationError, `expected IntegrationError, got ${String(err)}`)
  assert.equal(err.code, 'ROOT_NOT_ABSOLUTE')
  return true
}

function stageEArgs(repoRoot: string, writeFn?: WriteReceiptFn) {
  return {
    workflowId: WORKFLOW_ID,
    repoRoot,
    prRef: VALID_PR_REF,
    headSha: HEAD_SHA,
    ciJobs: [{ job: 'plugins', outcome: 'success' as const }],
    auditTrigger: { triggered: false },
    writeFn,
  }
}

function stageFArgs(repoRoot: string, writeFn?: WriteReceiptFn) {
  return {
    workflowId: WORKFLOW_ID,
    repoRoot,
    closureRecord: {
      mergeSha: VALID_MERGE_SHA,
      ticketTransition: { ticketKey: TICKET, fromStatus: 'In Review', toStatus: 'Done' },
      specLifecycleMove: SPEC_MOVE,
    },
    writeFn,
  }
}

// ─── Negative controls: every seam refuses a relative root ────────────────────

test('D19: prepareClosure refuses a relative input.repoRoot (ROOT_NOT_ABSOLUTE) before any chain load', async () => {
  let loaded = false
  await assert.rejects(
    () =>
      prepareClosure(
        {
          workflowId: WORKFLOW_ID,
          ticketKey: TICKET,
          targetStatus: 'Done',
          currentStatus: 'In Review',
          mergeSha: VALID_MERGE_SHA,
          specLifecycleMove: SPEC_MOVE,
          repoRoot: RELATIVE_ROOT,
        },
        {
          loadReceiptChainFn: () => {
            loaded = true
            return []
          },
        },
      ),
    isRootNotAbsolute,
  )
  assert.equal(loaded, false, 'the chain loader must not run for a relative root')
})

test('D19: executeClosure refuses a relative pkg.repoRoot (ROOT_NOT_ABSOLUTE) before any chain load', async () => {
  let loaded = false
  const chain = makeStageEChain()
  await assert.rejects(
    () =>
      executeClosure(
        {
          workflowId: WORKFLOW_ID,
          ticketKey: TICKET,
          targetStatus: 'Done',
          currentStatus: 'In Review',
          mergeSha: VALID_MERGE_SHA,
          specLifecycleMove: SPEC_MOVE,
          stageETip: chain[chain.length - 1] as ReceiptDocument,
          repoRoot: RELATIVE_ROOT,
        },
        {
          transport: makeRecordingTransport({ throwOnAnyCall: true }),
          loadReceiptChainFn: () => {
            loaded = true
            return []
          },
        },
      ),
    isRootNotAbsolute,
  )
  assert.equal(loaded, false, 'the chain loader must not run for a relative root')
})

test('D19: retryHalfClosedClosure refuses a relative deps.repoRoot (ROOT_NOT_ABSOLUTE) before any chain load', async () => {
  let loaded = false
  await assert.rejects(
    () =>
      retryHalfClosedClosure(WORKFLOW_ID, {
        transport: makeRecordingTransport({ throwOnAnyCall: true }),
        repoRoot: RELATIVE_ROOT,
        loadReceiptChainFn: () => {
          loaded = true
          return []
        },
      }),
    isRootNotAbsolute,
  )
  assert.equal(loaded, false, 'the chain loader must not run for a relative root')
})

test('D19: loadChainTip refuses a relative repoRoot (ROOT_NOT_ABSOLUTE) — before the workflowId check and any scan', () => {
  assert.throws(() => loadChainTip(WORKFLOW_ID, RELATIVE_ROOT), isRootNotAbsolute)
  // Ordering pin: the root guard fires even for a hostile workflowId.
  assert.throws(() => loadChainTip('../escape', RELATIVE_ROOT), isRootNotAbsolute)
})

test('D19: runStageE refuses a relative args.repoRoot (ROOT_NOT_ABSOLUTE) before any chain scan/write', () => {
  let wrote = false
  assert.throws(
    () =>
      runStageE(
        stageEArgs(RELATIVE_ROOT, (_document, locator) => {
          wrote = true
          return locator
        }),
      ),
    isRootNotAbsolute,
  )
  assert.equal(wrote, false, 'no receipt may be written for a relative root')
})

test('D19: runStageF refuses a relative args.repoRoot (ROOT_NOT_ABSOLUTE) before any chain scan/write', () => {
  let wrote = false
  assert.throws(
    () =>
      runStageF(
        stageFArgs(RELATIVE_ROOT, (_document, locator) => {
          wrote = true
          return locator
        }),
      ),
    isRootNotAbsolute,
  )
  assert.equal(wrote, false, 'no receipt may be written for a relative root')
})

test('D19: emitIntegrationReceipt refuses a relative args.repoRoot (ROOT_NOT_ABSOLUTE) before any write', () => {
  let wrote = false
  const chain = makeStageEChain()
  assert.throws(
    () =>
      emitIntegrationReceipt({
        prRef: VALID_PR_REF,
        ciJobs: [{ job: 'plugins', outcome: 'success' }],
        auditTrigger: { triggered: false },
        priorReceipt: chain[3] as ReceiptDocument,
        repoRoot: RELATIVE_ROOT,
        writeFn: (_document, locator) => {
          wrote = true
          return locator
        },
      }),
    isRootNotAbsolute,
  )
  assert.equal(wrote, false, 'no receipt may be written for a relative root')
})

test('D19: emitClosureReceipt refuses a relative args.repoRoot (ROOT_NOT_ABSOLUTE) before any write', () => {
  let wrote = false
  const chain = makeStageEChain()
  assert.throws(
    () =>
      emitClosureReceipt({
        closureRecord: {
          mergeSha: VALID_MERGE_SHA,
          ticketTransition: { ticketKey: TICKET, fromStatus: 'In Review', toStatus: 'Done' },
          specLifecycleMove: SPEC_MOVE,
        },
        priorReceipt: chain[chain.length - 1] as ReceiptDocument,
        repoRoot: RELATIVE_ROOT,
        writeFn: (_document, locator) => {
          wrote = true
          return locator
        },
      }),
    isRootNotAbsolute,
  )
  assert.equal(wrote, false, 'no receipt may be written for a relative root')
})

test('D19: emitHalfClosedClosureReceipt refuses a relative args.repoRoot (ROOT_NOT_ABSOLUTE) before any write', () => {
  let wrote = false
  const chain = makeStageEChain()
  assert.throws(
    () =>
      emitHalfClosedClosureReceipt({
        subject: {
          mergeSha: VALID_MERGE_SHA,
          ticketKey: TICKET,
          requestedStatus: 'Done',
          currentStatus: 'In Review',
          failedStep: 'transition',
          errorMessage: 'prior boom',
          specLifecycleMove: SPEC_MOVE,
          stageETip: { hash: '5'.repeat(64), locator: 'docs/receipts/000004-e.json' },
        },
        priorReceipt: chain[chain.length - 1] as ReceiptDocument,
        repoRoot: RELATIVE_ROOT,
        writeFn: (_document, locator) => {
          wrote = true
          return locator
        },
      }),
    isRootNotAbsolute,
  )
  assert.equal(wrote, false, 'no receipt may be written for a relative root')
})

test('D19: loadActiveSpecsLive refuses a relative repoRoot and a relative pluginRoot (ROOT_NOT_ABSOLUTE)', () => {
  assert.throws(() => loadActiveSpecsLive(RELATIVE_ROOT, ABSOLUTE_ROOT), isRootNotAbsolute)
  assert.throws(() => loadActiveSpecsLive(ABSOLUTE_ROOT, RELATIVE_ROOT), isRootNotAbsolute)
})

test('D19: runReport refuses a relative repoRoot and a relative pluginRoot (ROOT_NOT_ABSOLUTE) before any seam runs', () => {
  let ran = false
  const seams = {
    getChangedPaths: () => {
      ran = true
      return []
    },
    loadActiveSpecs: () => {
      ran = true
      return []
    },
  }
  assert.throws(() => runReport(RELATIVE_ROOT, ABSOLUTE_ROOT, seams), isRootNotAbsolute)
  assert.throws(() => runReport(ABSOLUTE_ROOT, RELATIVE_ROOT, seams), isRootNotAbsolute)
  assert.equal(ran, false, 'no report seam may run for a relative root')
})

test('D19: runDocSpineHook refuses a relative seams.repoRoot (ROOT_NOT_ABSOLUTE) before runVerifyFn runs', async () => {
  let ran = false
  await assert.rejects(
    () =>
      runDocSpineHook({
        repoRoot: RELATIVE_ROOT,
        runVerifyFn: async () => {
          ran = true
          return {
            generatedAtSha: 'sha',
            toolVersion: 'test',
            analysisDepth: 'full',
            docFindings: [],
            gaps: [],
            contradictions: [],
          }
        },
      }),
    isRootNotAbsolute,
  )
  assert.equal(ran, false, 'runVerifyFn must not run for a relative root')
})

test('D19: fetchEffectiveRulesLive refuses a relative args.repoRoot (ROOT_NOT_ABSOLUTE) before any subprocess', () => {
  assert.throws(
    () => fetchEffectiveRulesLive({ branch: 'main', repoRoot: RELATIVE_ROOT }),
    isRootNotAbsolute,
  )
})

test('D19: planPrAutomation refuses a relative input.repoRoot (ROOT_NOT_ABSOLUTE) before any git/gh seam', () => {
  let ran = false
  const seams = {
    gitPushFn: () => {
      ran = true
      return { code: 0, stdout: '', stderr: '' }
    },
    ghPrCreateFn: () => {
      ran = true
      return { code: 0, stdout: '', stderr: '' }
    },
  }
  assert.throws(
    () =>
      planPrAutomation(
        { branch: 'feat/x', base: 'main', title: 't', prBody: 'b', repoRoot: RELATIVE_ROOT },
        seams,
      ),
    isRootNotAbsolute,
  )
  assert.equal(ran, false, 'no git/gh seam may run for a relative root')
})

// ─── Positive controls: an ABSOLUTE root passes the guard at the boundary ─────

test('D19 positive: loadChainTip with an absolute empty temp root reaches its normal CHAIN_SCAN_FAILED (not ROOT_NOT_ABSOLUTE)', () => {
  const repoRoot = makeTempRepoRoot()
  try {
    assert.throws(
      () => loadChainTip(WORKFLOW_ID, repoRoot),
      (err: unknown) => {
        assert.ok(err instanceof ExitVehicleError)
        assert.equal(err.code, 'CHAIN_SCAN_FAILED')
        return true
      },
    )
  } finally {
    rmSync(repoRoot, { recursive: true, force: true })
  }
})

test('D19 positive: runDocSpineHook with an absolute root and a stub runVerifyFn resolves normally', async () => {
  const result = await runDocSpineHook({
    repoRoot: ABSOLUTE_ROOT,
    runVerifyFn: async () => ({
      generatedAtSha: 'sha',
      toolVersion: 'test',
      analysisDepth: 'full',
      docFindings: [],
      gaps: [],
      contradictions: [],
    }),
  })
  assert.equal(result.exitCode, 0)
  assert.ok(result.annotations.length > 0)
})

test('D19 positive: prepareClosure with an absolute root reaches its normal chain validation', async () => {
  const pkg = await prepareClosure(
    {
      workflowId: WORKFLOW_ID,
      ticketKey: TICKET,
      targetStatus: 'Done',
      currentStatus: 'In Review',
      mergeSha: VALID_MERGE_SHA,
      specLifecycleMove: SPEC_MOVE,
      repoRoot: ABSOLUTE_ROOT,
    },
    { loadReceiptChainFn: () => toLoaded(makeStageEChain()) },
  )
  assert.equal(pkg.repoRoot, ABSOLUTE_ROOT)
})

test('D19 positive: runReport with absolute roots returns its normal report result', () => {
  const result = runReport(ABSOLUTE_ROOT, ABSOLUTE_ROOT, {
    getChangedPaths: () => ['docs/note.md'],
    loadActiveSpecs: () => [],
  })
  assert.equal(result.exitCode, 0)
  assert.ok(result.decision !== null)
})
