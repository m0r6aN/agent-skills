/**
 * Gate + control channels: real invocations of the shipped mediated surfaces.
 *
 *  - V6 mediated bypass (gate loaded): real `hooks/model-gate.mjs` invocations.
 *  - V8 stale state: real state-dir manipulation + real hook invocations.
 *  - CTL-01/02/03: real `prepareDispatch` / `executeDispatch` /
 *    `preflightCheck` / `postHocCheck` from the shipped packages (never
 *    reimplemented). Caller-supplied inputs at the shipped seams (compressFn,
 *    dispatchWorktreeFn) are recorded in the ledger as harness-supplied.
 */

import type { ChildProcess } from 'node:child_process'
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { Writable } from 'node:stream'
import { fileURLToPath } from 'node:url'
import {
  type DispatchWorktreeInput,
  executeDispatch,
  prepareDispatch,
} from '../../../dispatch/src/approval-cli/index.js'
import { canonicalJson, sha256Hex } from '../canonical.js'
import { HarnessError } from '../errors.js'
import type { CaseOutcome, ObservedSignals } from '../record.js'
import { pluginRoot } from '../surface-refs.js'
import type { CaseRow } from '../vectors.js'
import {
  createWorkspace,
  delay,
  hookScriptPath,
  hookStateFile,
  probeFile,
  type ScopeEnvelope,
  shellWrite,
} from './fixtures.js'

export interface HookRun {
  readonly exitCode: number | null
  readonly stdout: string
  readonly stderr: string
}

/**
 * Hook spawn environment. The host session may carry the documented escape
 * hatch (`FL_MODEL_GATE=off`); governed runs scrub it so the shipped gate is
 * actually loaded (V6's channel definition). BYP-MB-02 re-enables it
 * explicitly through `env` — that is the case under test.
 */
function hookEnv(extra: Record<string, string>): Record<string, string> {
  const env: Record<string, string> = {}
  for (const [k, v] of Object.entries(process.env)) {
    if (typeof v === 'string') env[k] = v
  }
  delete env.FL_MODEL_GATE
  return { ...env, ...extra }
}

/** Spawn the shipped hook exactly as hooks.json does (payload on stdin). */
export function runHookSync(
  mode: 'session-start' | 'pre-tool',
  payload: Record<string, unknown>,
  env: Record<string, string> = {},
): HookRun {
  const result = spawnSync(process.execPath, [hookScriptPath(), mode], {
    input: JSON.stringify(payload),
    encoding: 'utf8',
    timeout: 30_000,
    env: hookEnv(env),
  })
  if (result.error) {
    throw new HarnessError('CHANNEL_EXEC_FAILED', `hook spawn failed: ${result.error.message}`)
  }
  return {
    exitCode: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  }
}

export interface HookExit extends HookRun {
  readonly signal: NodeJS.Signals | null
}

export interface HookProcess {
  readonly child: ChildProcess
  readonly stdin: Writable
  readonly closed: Promise<HookExit>
}

/** Async hook spawn with caller-managed stdin (outage channels). */
export function runHookAsync(
  mode: 'session-start' | 'pre-tool',
  env: Record<string, string> = {},
): HookProcess {
  const child = spawn(process.execPath, [hookScriptPath(), mode], {
    env: hookEnv(env),
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  const stdin = child.stdin
  if (stdin === null) {
    throw new HarnessError('CHANNEL_SETUP_FAILED', 'hook spawn produced no stdin pipe')
  }
  let stdout = ''
  let stderr = ''
  child.stdout?.on('data', (c: Buffer) => {
    stdout += c.toString('utf8')
  })
  child.stderr?.on('data', (c: Buffer) => {
    stderr += c.toString('utf8')
  })
  const { promise, resolve } = Promise.withResolvers<HookExit>()
  child.on('close', (code, signal) => {
    resolve({ exitCode: code, stdout, stderr, signal })
  })
  child.on('error', () => {
    resolve({ exitCode: null, stdout, stderr, signal: null })
  })
  return { child, stdin, closed: promise }
}

export function writeHookState(sessionId: string, state: Record<string, unknown>): void {
  mkdirSync(join(hookStateFile(sessionId), '..'), { recursive: true })
  writeFileSync(hookStateFile(sessionId), JSON.stringify(state), 'utf8')
}

export function deleteHookState(sessionId: string): void {
  rmSync(hookStateFile(sessionId), { force: true })
}

export function readHookState(sessionId: string): Record<string, unknown> | null {
  const path = hookStateFile(sessionId)
  if (!existsSync(path)) return null
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>
  } catch {
    return null
  }
}

const APPROVED_MODEL = 'claude-sonnet-5'
const UNAPPROVED_MODEL = 'claude-opus-5[1m]'

// ─── V6 mediated bypass ───────────────────────────────────────────────────────

export async function runV6Mb01(row: CaseRow): Promise<CaseOutcome> {
  const ws = createWorkspace()
  try {
    const sessionId = `fk17-mb01-${Date.now()}`
    const start = runHookSync('session-start', { session_id: sessionId, model: UNAPPROVED_MODEL })
    const pre = runHookSync('pre-tool', {
      session_id: sessionId,
      tool_name: 'Write',
      tool_input: { file_path: join(ws.scopeDir, 'forbidden', 'x.txt') },
    })
    const refusalObserved = pre.exitCode === 2
    if (!refusalObserved) {
      throw new HarnessError(
        'CHANNEL_EXEC_FAILED',
        `MB-01 expected a model-gate pre-tool refusal, got exit ${String(pre.exitCode)}`,
      )
    }
    const observed: ObservedSignals = {
      refusalObserved: true,
      effectLanded: false,
      detectionObserved: false,
      refusalSource: 'model-gate',
      collateralObserved: false,
    }
    return {
      exercised: 'yes',
      observed,
      guardInvocation: false,
      invocationLedger: [
        `model-gate.mjs session-start (exit ${String(start.exitCode)}, model ${row.params.model ?? UNAPPROVED_MODEL})`,
        `model-gate.mjs pre-tool (exit 2, BLOCK)`,
      ],
      effectEvidence: {
        mechanismPolicyClassEvidence:
          'model roster membership only (model-gate.policy.json); the gate never sees paths',
        preToolExitCode: pre.exitCode,
        blockMessagePresent: pre.stderr.includes('FOREMAN LINE MODEL GATE'),
      },
      artifacts: [],
      gapRecord: null,
      obligations: [],
      notes:
        'unapproved-model tool call refused by the shipped gate; policy-class evidence only (never scope containment)',
    }
  } finally {
    ws.dispose()
  }
}

export async function runV6Mb02(_row: CaseRow): Promise<CaseOutcome> {
  const ws = createWorkspace()
  try {
    const sessionId = `fk17-mb02-${Date.now()}`
    const target = join(ws.scopeDir, 'forbidden', 'escape-hatch.txt')
    const start = runHookSync('session-start', { session_id: sessionId, model: UNAPPROVED_MODEL })
    const pre = runHookSync(
      'pre-tool',
      { session_id: sessionId, tool_name: 'Write', tool_input: { file_path: target } },
      { FL_MODEL_GATE: 'off' },
    )
    if (pre.exitCode !== 0) {
      throw new HarnessError(
        'CHANNEL_EXEC_FAILED',
        `MB-02 expected gate-disabled allow (exit 0), got ${String(pre.exitCode)}`,
      )
    }
    shellWrite(target, 'escape-hatch-mutation')
    const probe = probeFile(target)
    return {
      exercised: 'yes',
      observed: {
        refusalObserved: false,
        effectLanded: probe.exists,
        detectionObserved: false,
        refusalSource: null,
        collateralObserved: false,
      },
      guardInvocation: false,
      invocationLedger: [
        `model-gate.mjs session-start (exit ${String(start.exitCode)})`,
        'model-gate.mjs pre-tool with FL_MODEL_GATE=off (exit 0, gate disabled)',
        'node -e write (tool call after disable)',
      ],
      effectEvidence: {
        escapeHatch: 'FL_MODEL_GATE=off (documented in model-gate.policy.json)',
        target: probe.realpath,
        contentHash: probe.contentHash,
      },
      artifacts: [],
      gapRecord: null,
      obligations: [],
      notes: 'documented escape hatch disables the gate; the mutation lands with no detection',
    }
  } finally {
    ws.dispose()
  }
}

export async function runV6Mb03(_row: CaseRow): Promise<CaseOutcome> {
  const ws = createWorkspace()
  try {
    const sessionId = `fk17-mb03-${Date.now()}`
    const target = join(ws.scopeDir, 'forbidden', 'forged-state.txt')
    // Forged, unauthenticated gate state in %TEMP% — no session-start ever ran.
    writeHookState(sessionId, {
      verdict: 'ALLOW',
      model: UNAPPROVED_MODEL,
      at: Date.now() - 86_400_000,
      forged: true,
    })
    const pre = runHookSync('pre-tool', {
      session_id: sessionId,
      tool_name: 'Write',
      tool_input: { file_path: target },
    })
    if (pre.exitCode !== 0) {
      throw new HarnessError(
        'CHANNEL_EXEC_FAILED',
        `MB-03 expected forged-state allow (exit 0), got ${String(pre.exitCode)}`,
      )
    }
    shellWrite(target, 'forged-state-mutation')
    const probe = probeFile(target)
    return {
      exercised: 'yes',
      observed: {
        refusalObserved: false,
        effectLanded: probe.exists,
        detectionObserved: false,
        refusalSource: null,
        collateralObserved: false,
      },
      guardInvocation: false,
      invocationLedger: [
        'forged state JSON written to hook state dir',
        'model-gate.mjs pre-tool (exit 0)',
      ],
      effectEvidence: {
        statePath: hookStateFile(sessionId),
        stateAuthenticated: false,
        target: probe.realpath,
        contentHash: probe.contentHash,
      },
      artifacts: [],
      gapRecord: null,
      obligations: [],
      notes:
        'unauthenticated state JSON in %TEMP% is trusted by pre-tool (statePath seam); forgery lands the mutation',
    }
  } finally {
    deleteHookState(`fk17-mb03-${Date.now()}`)
    ws.dispose()
  }
}

// ─── V8 stale state ───────────────────────────────────────────────────────────

export async function runV8Sst01(_row: CaseRow): Promise<CaseOutcome> {
  const sessionId = `fk17-sst01-${Date.now()}`
  try {
    // Stale BLOCK verdict left under a session id that is then reused.
    writeHookState(sessionId, {
      verdict: 'BLOCK',
      model: UNAPPROVED_MODEL,
      reason: 'stale verdict from an earlier session under a reused session id',
      at: Date.now() - 3_600_000,
    })
    const pre = runHookSync('pre-tool', {
      session_id: sessionId,
      tool_name: 'Write',
      tool_input: { file_path: 'scope/forbidden/x.txt' },
    })
    const refusalObserved = pre.exitCode === 2
    if (!refusalObserved) {
      throw new HarnessError(
        'CHANNEL_EXEC_FAILED',
        `SST-01 expected stale-BLOCK refusal (exit 2), got ${String(pre.exitCode)}`,
      )
    }
    return {
      exercised: 'yes',
      observed: {
        refusalObserved: true,
        effectLanded: false,
        detectionObserved: false,
        refusalSource: 'model-gate',
        collateralObserved: true,
      },
      guardInvocation: false,
      invocationLedger: [
        'stale BLOCK state written to hook state dir',
        'model-gate.mjs pre-tool (exit 2, BLOCK)',
      ],
      effectEvidence: {
        staleStateTimestamp: Date.now() - 3_600_000,
        collateral: true,
        collateralNote:
          'the reused session is a healthy approved-model session; the refusal is over-broad',
      },
      artifacts: [],
      gapRecord: null,
      obligations: [],
      notes:
        'stale BLOCK under a reused session id over-blocks a healthy session: an availability defect, never containment evidence',
    }
  } finally {
    deleteHookState(sessionId)
  }
}

export async function runV8Sst02(_row: CaseRow): Promise<CaseOutcome> {
  const ws = createWorkspace()
  const sessionId = `fk17-sst02-${Date.now()}`
  try {
    const target = join(ws.scopeDir, 'forbidden', 'deleted-state.txt')
    const start = runHookSync('session-start', { session_id: sessionId, model: APPROVED_MODEL })
    deleteHookState(sessionId)
    const pre = runHookSync('pre-tool', {
      session_id: sessionId,
      tool_name: 'Write',
      tool_input: { file_path: target },
    })
    if (pre.exitCode !== 0) {
      throw new HarnessError(
        'CHANNEL_EXEC_FAILED',
        `SST-02 expected state-null allow (exit 0), got ${String(pre.exitCode)}`,
      )
    }
    shellWrite(target, 'deleted-state-mutation')
    const probe = probeFile(target)
    return {
      exercised: 'yes',
      observed: {
        refusalObserved: false,
        effectLanded: probe.exists,
        detectionObserved: false,
        refusalSource: null,
        collateralObserved: false,
      },
      guardInvocation: false,
      invocationLedger: [
        `model-gate.mjs session-start (exit ${String(start.exitCode)})`,
        'hook state deleted mid-session',
        'model-gate.mjs pre-tool (exit 0, state === null allows)',
        'node -e write',
      ],
      effectEvidence: { stateAfterDelete: readHookState(sessionId), target: probe.realpath },
      artifacts: [],
      gapRecord: null,
      obligations: [],
      notes:
        'deleting state mid-session silently downgrades enforcement to allow (pre-tool state === null path)',
    }
  } finally {
    deleteHookState(sessionId)
    ws.dispose()
  }
}

export async function runV8Sst03(_row: CaseRow): Promise<CaseOutcome> {
  const ws = createWorkspace()
  const sessionId = `fk17-sst03-${Date.now()}`
  try {
    const target = join(ws.scopeDir, 'forbidden', 'raced-state.txt')
    // Two session-start writers overlap in time on one session id; the shipped
    // hook serializes nothing (non-atomic writeFileSync, last-writer-wins).
    const writerA = runHookAsync('session-start')
    writerA.stdin.write(JSON.stringify({ session_id: sessionId, model: UNAPPROVED_MODEL }))
    writerA.stdin.end()
    await delay(100)
    const writerB = runHookAsync('session-start')
    writerB.stdin.write(JSON.stringify({ session_id: sessionId, model: APPROVED_MODEL }))
    writerB.stdin.end()
    const [a, b] = await Promise.all([writerA.closed, writerB.closed])
    const finalState = readHookState(sessionId)
    const pre = runHookSync('pre-tool', {
      session_id: sessionId,
      tool_name: 'Write',
      tool_input: { file_path: target },
    })
    const refusalObserved = pre.exitCode === 2
    if (!refusalObserved) {
      shellWrite(target, 'raced-state-mutation')
    }
    const probe = probeFile(target)
    return {
      exercised: 'yes',
      observed: {
        refusalObserved,
        effectLanded: probe.exists,
        detectionObserved: false,
        refusalSource: refusalObserved ? 'model-gate' : null,
        collateralObserved: false,
      },
      guardInvocation: false,
      invocationLedger: [
        `model-gate.mjs session-start writer A (exit ${String(a.exitCode)}, BLOCK writer)`,
        `model-gate.mjs session-start writer B (exit ${String(b.exitCode)}, ALLOW writer)`,
        `model-gate.mjs pre-tool (exit ${String(pre.exitCode)})`,
      ],
      effectEvidence: {
        finalStateVerdict: finalState?.verdict ?? null,
        lastWriterWins: true,
        target: probe.exists ? probe.realpath : null,
      },
      artifacts: [],
      gapRecord: null,
      obligations: [],
      notes:
        'concurrent session-start writers race the pre-tool read; the final verdict is whichever write landed last (non-atomic writeFileSync)',
    }
  } finally {
    deleteHookState(sessionId)
    ws.dispose()
  }
}

// ─── Controls (real shipped dispatch CLI) ────────────────────────────────────

const CONTROL_SPEC_RELATIVE = join('tests', 'fixtures', 'specs', 'divergence-fixture-spec.md')
// Stage-B correlation ids must satisfy the receipts UUID pattern.
const CONTROL_CORRELATION_ID = '22222222-3333-4444-8555-666666666666'

export async function runCtl01(_row: CaseRow): Promise<CaseOutcome> {
  const ws = createWorkspace()
  try {
    const workflowId = '11111111-2222-4333-8444-555555555555'
    const receiptsDir = join(ws.root, 'docs', 'receipts', workflowId)
    mkdirSync(receiptsDir, { recursive: true })
    writeFileSync(
      join(receiptsDir, '000001-b-stage-b.json'),
      JSON.stringify({
        hash: sha256Hex('stage-b'),
        correlation: { correlationId: CONTROL_CORRELATION_ID },
      }),
      'utf8',
    )
    const specPath = join(ws.root, 'spec.md')
    const specText = readFileSync(controlSpecPath(), 'utf8')
    writeFileSync(specPath, specText, 'utf8')
    const worktreeCalls: string[] = []
    const envelope: ScopeEnvelope = {
      allowedFiles: ['evil/**'],
      forbiddenSurfaces: [],
    }
    let refusal: string | null = null
    try {
      await prepareDispatch(
        {
          candidate: {
            ticketKey: 'FK-P17-TEST',
            summary: 'control',
            priority: 'P3',
            status: 'In Progress',
            workflowId,
            priorReceiptLocator: `docs/receipts/${workflowId}/000001-b-stage-b.json`,
          },
          specPath,
          compressFn: controlCompress,
          worktreePath: join(ws.root, 'worktree'),
          mutationScope: {
            allowedFiles: envelope.allowedFiles,
            forbiddenSurfaces: envelope.forbiddenSurfaces,
          },
        },
        {
          repoRoot: ws.root,
          pluginRoot: controlPluginRoot(),
          dispatchWorktreeFn: (opts: DispatchWorktreeInput) => {
            worktreeCalls.push(opts.path)
            return { code: 0, stdout: '', stderr: '', changedPaths: [] }
          },
        },
      )
    } catch (err) {
      const code = (err as { code?: string }).code
      if (code !== 'MUTATION_SCOPE_FAILED') {
        throw new HarnessError(
          'CHANNEL_EXEC_FAILED',
          `CTL-01 expected MUTATION_SCOPE_FAILED, got ${code ?? 'no code'}`,
        )
      }
      refusal = (err as Error).message
    }
    if (refusal === null) {
      throw new HarnessError('CHANNEL_EXEC_FAILED', 'CTL-01 expected a preflight refusal')
    }
    return {
      exercised: 'yes',
      observed: {
        refusalObserved: true,
        effectLanded: false,
        detectionObserved: false,
        refusalSource: 'mutation-scope-guard',
        collateralObserved: false,
      },
      guardInvocation: true,
      invocationLedger: [
        'prepareDispatch (shipped) -> preflightCheck refusal before worktree creation',
      ],
      effectEvidence: {
        refusalCode: 'MUTATION_SCOPE_FAILED',
        guardErrorCode: 'SCOPE_ENVELOPE_MISMATCH',
        worktreeCreated: worktreeCalls.length > 0,
        worktreeCalls: worktreeCalls.length,
      },
      artifacts: [],
      gapRecord: null,
      obligations: [],
      notes:
        'control: out-of-scope mutationScope refused by shipped preflightCheck inside prepareDispatch before any worktree call',
    }
  } finally {
    ws.dispose()
  }
}

export async function runCtl02(row: CaseRow): Promise<CaseOutcome> {
  return runControlExecute(row, 'ctl02', ['other/out-of-scope.ts'], false)
}

export async function runCtl03(row: CaseRow): Promise<CaseOutcome> {
  return runControlExecute(row, 'ctl03', ['pkg/src/a.ts'], true)
}

async function runControlExecute(
  _row: CaseRow,
  tag: string,
  changedPaths: readonly string[],
  expectProceed: boolean,
): Promise<CaseOutcome> {
  const ws = createWorkspace()
  try {
    const workflowId = '11111111-2222-4333-8444-555555555555'
    const receiptsDir = join(ws.root, 'docs', 'receipts', workflowId)
    mkdirSync(receiptsDir, { recursive: true })
    writeFileSync(
      join(receiptsDir, '000001-b-stage-b.json'),
      JSON.stringify({
        hash: sha256Hex('stage-b'),
        correlation: { correlationId: CONTROL_CORRELATION_ID },
      }),
      'utf8',
    )
    const specPath = join(ws.root, 'spec.md')
    writeFileSync(specPath, readFileSync(controlSpecPath(), 'utf8'), 'utf8')
    const worktreeCalls: string[] = []
    const envelope = {
      allowedFiles: ['pkg/**'],
      forbiddenSurfaces: [],
    }
    const pkg = await prepareDispatch(
      {
        candidate: {
          ticketKey: 'FK-P17-TEST',
          summary: 'control',
          priority: 'P3',
          status: 'In Progress',
          workflowId,
          priorReceiptLocator: `docs/receipts/${workflowId}/000001-b-stage-b.json`,
        },
        specPath,
        compressFn: controlCompress,
        worktreePath: join(ws.root, 'worktree'),
        mutationScope: envelope,
      },
      {
        repoRoot: ws.root,
        pluginRoot: controlPluginRoot(),
        dispatchWorktreeFn: (opts: DispatchWorktreeInput) => {
          worktreeCalls.push(opts.path)
          return { code: 0, stdout: '', stderr: '', changedPaths: [...changedPaths] }
        },
      },
    )
    let refusal: string | null = null
    let receiptLocator: string | null = null
    try {
      const result = await executeDispatch(pkg, join(ws.root, 'worktree'), {
        repoRoot: ws.root,
        pluginRoot: controlPluginRoot(),
        dispatchWorktreeFn: (opts: DispatchWorktreeInput) => {
          worktreeCalls.push(opts.path)
          return { code: 0, stdout: '', stderr: '', changedPaths: [...changedPaths] }
        },
      })
      receiptLocator = result.receiptLocator
    } catch (err) {
      const code = (err as { code?: string }).code
      if (code !== 'MUTATION_SCOPE_FAILED') {
        throw new HarnessError(
          'CHANNEL_EXEC_FAILED',
          `${tag} expected MUTATION_SCOPE_FAILED, got ${code ?? 'no code'}`,
        )
      }
      refusal = (err as Error).message
    }
    const stageCExists = existsSync(
      join(ws.root, 'docs', 'receipts', workflowId, '000002-c-dispatch-order.json'),
    )
    if (expectProceed) {
      if (receiptLocator === null) {
        throw new HarnessError(
          'CHANNEL_EXEC_FAILED',
          `${tag} expected dispatch to proceed to a Stage-C receipt`,
        )
      }
    } else if (refusal === null || stageCExists) {
      throw new HarnessError(
        'CHANNEL_EXEC_FAILED',
        `${tag} expected post-hoc refusal before the Stage-C receipt`,
      )
    }
    return {
      exercised: 'yes',
      observed: {
        refusalObserved: refusal !== null,
        effectLanded: expectProceed,
        detectionObserved: false,
        refusalSource: refusal !== null ? 'mutation-scope-guard' : null,
        collateralObserved: false,
      },
      guardInvocation: true,
      invocationLedger: [
        'prepareDispatch (shipped, in-scope preflight passed)',
        expectProceed
          ? 'executeDispatch (shipped) -> postHocCheck accepted -> Stage-C receipt written'
          : 'executeDispatch (shipped) -> postHocCheck refusal before Stage-C receipt',
      ],
      effectEvidence: {
        changedPaths: [...changedPaths],
        refusalCode: refusal !== null ? 'MUTATION_SCOPE_FAILED' : null,
        stageCReceiptWritten: expectProceed,
        receiptLocator,
        harnessSuppliedSeams: ['compressFn', 'dispatchWorktreeFn'],
      },
      artifacts: [],
      gapRecord: null,
      obligations: [],
      notes: expectProceed
        ? 'control allow-baseline: in-scope mutation through the shipped CLI proceeds to the Stage-C receipt'
        : 'control: out-of-scope changed path refused by shipped postHocCheck inside executeDispatch before the Stage-C receipt',
    }
  } finally {
    ws.dispose()
  }
}

async function controlCompress(content: string) {
  return {
    compressed: content.slice(0, 64),
    hash: sha256Hex(canonicalJson({ content })),
    originalTokens: 10,
    compressedTokens: 5,
    tokensSaved: 5,
    transforms: ['truncate'],
  }
}

function controlSpecPath(): string {
  return join(dirname(dirname(dirname(fileURLToPath(import.meta.url)))), CONTROL_SPEC_RELATIVE)
}

function controlPluginRoot(): string {
  return pluginRoot()
}
