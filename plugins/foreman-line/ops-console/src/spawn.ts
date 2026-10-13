import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { type AutonomyEnvelope, lookupAction } from './actions.js'
import { type ConsoleConfig, type StateFile, stateFilePath } from './config.js'
import { isRecord } from './guards.js'
import { BUDGET_PRESETS, HARNESS_REGISTRY, THINKING_LEVELS } from './harness.js'
import { listAuditEntries, recordAuditEntry } from './invoke.js'
import { enforceRetention, ensureLedgerDir } from './ledger-store.js'
import { composePrompt } from './prompts.js'

/**
 * FCA-P5 spawn planner: pure (spawn controls x selected actions) -> spawn
 * plan. One tmux session, one pane per action; each pane carries its harness
 * argv (real help-verified flags), its prompt payload (Task-10 composition +
 * the controls block incl. the hard max-USD budget cap + optional extra
 * direction verbatim), and its own fresh git worktree path (owner ruling
 * 2026-10-11: "fresh worktree. hygiene is a must") recorded for the spawn
 * receipt and later reaping. Refusals are typed and fire in the plan stage —
 * no process ever starts for an unsupported combination.
 */

export type SpawnRefusalReason =
  | 'no-actions'
  | 'unknown-harness'
  | 'model-missing'
  | 'model-unqualified'
  | 'invalid-session-name'
  | 'unsupported-thinking'
  | 'unsupported-budget'
  | 'unregistered-action'
  | 'tmux-unavailable'
  | 'launch-failure'

/** Typed refusal (mirrors the `ConsoleRootUnresolvedError` convention). */
export class SpawnRefusalError extends Error {
  readonly code = 2 as const
  readonly reason: SpawnRefusalReason

  constructor(reason: SpawnRefusalReason, message: string) {
    super(message)
    this.name = 'SpawnRefusalError'
    this.reason = reason
  }
}

export interface SpawnControls {
  readonly harness: string
  readonly model: string
  readonly thinking: string
  readonly budget: string
}

export interface SpawnActionInput {
  readonly verb: string
  readonly signalClass: string
  readonly subject: string
  readonly evidence: readonly string[]
  readonly repoRoot: string
  readonly autonomy?: Partial<AutonomyEnvelope>
  readonly extraText?: string | null
}

export interface SpawnPlanRequest {
  readonly controls: SpawnControls
  readonly actions: readonly SpawnActionInput[]
  readonly now: number
  readonly sessionName?: string
}

export interface SpawnPane {
  readonly paneIndex: number
  readonly verb: string
  readonly signalClass: string
  readonly subject: string
  /** Harness argv WITHOUT the prompt; `promptArgv` appends it at launch. */
  readonly argv: readonly string[]
  readonly repoRoot: string
  readonly cwd: string
  readonly worktreePath: string
  readonly prompt: string
  /** sha256 of `prompt` — what the spawn receipt stores (FCA-P5). */
  readonly promptDigest: string
  readonly envelope: AutonomyEnvelope
}

export interface SpawnPlan {
  readonly harness: string
  readonly controls: SpawnControls
  readonly sessionName: string
  readonly panes: readonly SpawnPane[]
}

function compactTimestamp(now: number): string {
  return new Date(now)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d+Z$/, 'z')
    .toLowerCase()
}

function slug(subject: string): string {
  return subject
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

/** Lumber-jack convention: sibling `<repo>-worktrees/` directory. */
function worktreePathFor(repoRoot: string, subject: string, stamp: string): string {
  return join(dirname(repoRoot), `${basename(repoRoot)}-worktrees`, `${slug(subject)}-${stamp}`)
}

function controlsBlock(harnessId: string, controls: SpawnControls): string {
  return [
    '',
    'SPAWN CONTROLS (verbatim):',
    `harness: ${harnessId}`,
    `model: ${controls.model}`,
    `thinking: ${controls.thinking}`,
    `budget: ${controls.budget} (hard max-USD cap - stop and report before exceeding)`,
  ].join('\n')
}

export function planSpawn(request: SpawnPlanRequest): SpawnPlan {
  const { controls, actions, now } = request
  if (actions.length === 0) {
    throw new SpawnRefusalError('no-actions', 'spawn refused: no actions selected')
  }
  const harness = HARNESS_REGISTRY[controls.harness]
  if (harness === undefined) {
    throw new SpawnRefusalError(
      'unknown-harness',
      `spawn refused: unknown harness ${controls.harness}`,
    )
  }
  if (controls.model === '') {
    throw new SpawnRefusalError('model-missing', 'spawn refused: model is required')
  }
  const modelProblem = harness.modelProblem?.(controls.model) ?? null
  if (modelProblem !== null) {
    throw new SpawnRefusalError('model-unqualified', `spawn refused: ${modelProblem}`)
  }
  if (!(THINKING_LEVELS as readonly string[]).includes(controls.thinking)) {
    throw new SpawnRefusalError(
      'unsupported-thinking',
      `spawn refused: unknown thinking level ${controls.thinking}`,
    )
  }
  if (!harness.thinkingLevels.includes(controls.thinking)) {
    // Fail closed: a level this harness cannot express is never downgraded.
    throw new SpawnRefusalError(
      'unsupported-thinking',
      `spawn refused: ${harness.id} cannot express thinking level ${controls.thinking}`,
    )
  }
  if (!(BUDGET_PRESETS as readonly string[]).includes(controls.budget)) {
    throw new SpawnRefusalError(
      'unsupported-budget',
      `spawn refused: budget must be one of ${BUDGET_PRESETS.join(', ')}`,
    )
  }

  const stamp = compactTimestamp(now)
  const sessionName = request.sessionName ?? `foc-${stamp}`
  // The name becomes a tmux target, a receipt id and a directory name: keep it to
  // the closed shape every consumer accepts, before any worktree or process exists.
  if (!/^[a-z0-9][a-z0-9-]{0,80}$/.test(sessionName)) {
    throw new SpawnRefusalError(
      'invalid-session-name',
      `spawn refused: session name '${sessionName}' must be lowercase letters, digits and hyphens`,
    )
  }
  const panes: SpawnPane[] = actions.map((action, paneIndex) => {
    const spec = lookupAction(action.signalClass, action.verb)
    if (spec === null) {
      throw new SpawnRefusalError(
        'unregistered-action',
        `spawn refused: ${action.verb} on ${action.signalClass} is not in the action registry`,
      )
    }
    const envelope: AutonomyEnvelope = { ...spec.autonomy, ...(action.autonomy ?? {}) }
    const base = composePrompt(
      spec,
      { class: action.signalClass, subject: action.subject, evidence: action.evidence },
      envelope,
      null,
    )
    const extra = action.extraText == null ? '' : `\n\nEXTRA DIRECTION:\n${action.extraText}`
    const prompt = `${base}${controlsBlock(harness.id, controls)}${extra}`
    const worktreePath = worktreePathFor(action.repoRoot, action.subject, stamp)
    return {
      paneIndex,
      verb: action.verb,
      signalClass: action.signalClass,
      subject: action.subject,
      argv: harness.argv({
        model: controls.model,
        thinking: controls.thinking,
        sessionName: `${sessionName}-p${paneIndex}`,
      }),
      repoRoot: action.repoRoot,
      cwd: worktreePath,
      worktreePath,
      prompt,
      promptDigest: createHash('sha256').update(prompt).digest('hex'),
      envelope,
    }
  })
  return { harness: controls.harness, controls, sessionName, panes }
}

/**
 * Task 14 spawn receipts (FCA-P5): append-only `state/spawns.json`, schema
 * `foc-spawns/v1`. The prompt payload is NEVER stored - only its sha256
 * digest; the full prompt is reproducible from the templates + audit.
 */
export interface SpawnReceipt {
  readonly id: string
  readonly sessionName: string
  readonly paneIndex: number
  readonly harness: string
  readonly model: string
  readonly thinking: string
  readonly budget: string
  readonly autonomy: AutonomyEnvelope
  readonly repoRoot: string
  readonly worktreePath: string
  readonly promptDigest: string
  readonly argv: readonly string[]
  readonly createdAt: string
  /**
   * FCA-P7 additive addendum (owner-ratified 2026-10-13). Absent on receipts
   * written before the ledger; readers must treat absence as unknown.
   */
  readonly baseCommit?: string | null
  readonly branch?: string | null
  /** Name of the console-local ledger subtree for this pane: `sessions/<id>`. */
  readonly ledgerDir?: string
  /** tmux pane id (`%N`) when the launcher could capture it. */
  readonly tmuxPaneId?: string | null
}

const SPAWNS_NAME: StateFile = 'spawns.json'

export function listSpawnReceipts(stateDir: string): SpawnReceipt[] {
  try {
    const raw: unknown = JSON.parse(readFileSync(stateFilePath(stateDir, SPAWNS_NAME), 'utf8'))
    if (!isRecord(raw) || !Array.isArray(raw.receipts)) return []
    return raw.receipts.filter(
      (entry): entry is SpawnReceipt =>
        isRecord(entry) && typeof entry.id === 'string' && typeof entry.sessionName === 'string',
    ) as SpawnReceipt[]
  } catch {
    return []
  }
}

/** Sole writer of `state/spawns.json`; append-only at the record level. */
export function recordSpawnReceipt(stateDir: string, receipt: SpawnReceipt): void {
  const receipts = listSpawnReceipts(stateDir)
  const path = stateFilePath(stateDir, SPAWNS_NAME)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(
    path,
    `${JSON.stringify({ schema: 'foc-spawns/v1', receipts: [...receipts, receipt] }, null, 2)}\n`,
    'utf8',
  )
}

/** Single-quote for tmux's shell-command string; prompts stay verbatim. */
export function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`
}

export interface TmuxRunner {
  readonly available: () => boolean
  readonly run: (args: readonly string[]) => void
  /** Like `run`, but returns tmux's stdout (used for `-P -F '#{pane_id}'`). */
  readonly capture: (args: readonly string[]) => string
}

/** Fresh-worktree creation (owner ruling: "hygiene is a must"). */
export interface WorktreeRunner {
  readonly create: (repoRoot: string, worktreePath: string) => void
  /** HEAD of the freshly cut worktree, recorded as the receipt's baseCommit. */
  readonly head?: (worktreePath: string) => string | null
}

export const defaultWorktreeRunner: WorktreeRunner = {
  create: (repoRoot, worktreePath) => {
    execFileSync(
      'git',
      ['-C', repoRoot, 'worktree', 'add', '-b', `spawn/${basename(worktreePath)}`, worktreePath],
      // A2.9: explicit root anchor (D19 class-4 non-instance).
      { cwd: repoRoot, stdio: ['ignore', 'pipe', 'ignore'] },
    )
  },
  head: (worktreePath) => {
    try {
      return execFileSync('git', ['-C', worktreePath, 'rev-parse', 'HEAD'], {
        cwd: worktreePath,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim()
    } catch {
      return null
    }
  },
}

/**
 * tmux runner anchored to an explicit root (A2.9; never inherited cwd).
 * `socket` selects a private tmux server (`tmux -L <name>`); tests use it so
 * they never touch the operator's own server.
 */
export function tmuxRunnerFor(repoRoot: string, socket?: string): TmuxRunner {
  const prefix = socket === undefined ? [] : ['-L', socket]
  const exec = (args: readonly string[]): string =>
    execFileSync('tmux', [...prefix, ...args], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
  return {
    available: () => {
      try {
        exec(['-V'])
        return true
      } catch {
        return false
      }
    },
    run: (args) => {
      exec(args)
    },
    capture: (args) => exec(args),
  }
}

/** First `%N` token of tmux `-P -F '#{pane_id}'` output; null when unparseable. */
function paneIdOf(output: string): string | null {
  const match = /%\d+/.exec(output)
  return match === null ? null : match[0]
}

export interface LaunchResult {
  readonly sessionName: string
  readonly launched: readonly number[]
  readonly failed: { readonly paneIndex: number; readonly error: string } | null
}

/**
 * Task 13 launcher: cuts each pane's fresh git worktree at spawn time, then
 * runs one `tmux new-session` plus one `split-window` per additional pane,
 * every plan field passed verbatim. tmux absence is a typed refusal with NO
 * headless fallback. A partial failure audits the whole plan state (which
 * panes are up, which failed, no retries) and re-throws typed.
 */
export function launchSpawnPlan(
  config: ConsoleConfig,
  plan: SpawnPlan,
  now: number,
  deps: { tmux?: TmuxRunner; worktrees?: WorktreeRunner } = {},
): LaunchResult {
  const runner = deps.tmux ?? tmuxRunnerFor(config.repoRoot)
  const worktrees = deps.worktrees ?? defaultWorktreeRunner
  if (!runner.available()) {
    throw new SpawnRefusalError(
      'tmux-unavailable',
      'launch refused: tmux is not available (no headless fallback exists)',
    )
  }
  const harness = HARNESS_REGISTRY[plan.harness]
  if (harness === undefined) {
    throw new SpawnRefusalError(
      'unknown-harness',
      `launch refused: unknown harness ${plan.harness}`,
    )
  }
  const commandFor = (pane: SpawnPane): string =>
    [...pane.argv, ...harness.promptArgv(pane.prompt)].map(shellQuote).join(' ')
  const nextAuditId = () =>
    `spn-${String(listAuditEntries(config.stateDir).length + 1).padStart(6, '0')}`

  // FCA-P7: bound the captured-output store before adding to it.
  enforceRetention(config.stateDir, undefined, now)

  const launched: number[] = []
  for (const pane of plan.panes) {
    try {
      const receiptId = `${plan.sessionName}-p${pane.paneIndex}`
      // `=name:` is an EXACT session match; a bare name also prefix-matches other sessions.
      const exactTarget = `=${plan.sessionName}:`
      // Ledger dir first: an invalid id must fail before a worktree is cut.
      const ledger = ensureLedgerDir(config.stateDir, receiptId)
      worktrees.create(pane.repoRoot, pane.worktreePath)
      const baseCommit = worktrees.head?.(pane.worktreePath) ?? null
      const capture = `cat >> ${shellQuote(ledger.logPath)}`
      let tmuxPaneId: string | null
      if (launched.length === 0) {
        // One chained tmux command: the session, `remain-on-exit` (a dead pane
        // stays attachable and reports its exit status instead of vanishing
        // with its server), and `pipe-pane` are all in place before tmux
        // returns to its event loop, so even an instant startup failure is
        // retained and captured (FCA-P7; reproduced 2026-10-13).
        tmuxPaneId = paneIdOf(
          runner.capture([
            'new-session',
            '-d',
            '-P',
            '-F',
            '#{pane_id}',
            '-s',
            plan.sessionName,
            '-c',
            pane.cwd,
            commandFor(pane),
            ';',
            'set-option',
            '-w',
            '-t',
            exactTarget,
            'remain-on-exit',
            'on',
            ';',
            'pipe-pane',
            '-o',
            '-t',
            exactTarget,
            capture,
          ]),
        )
      } else {
        // Later panes attach capture by pane id once created; output before
        // attachment remains in the retained scrollback (`capture-pane`).
        tmuxPaneId = paneIdOf(
          runner.capture([
            'split-window',
            '-d',
            '-P',
            '-F',
            '#{pane_id}',
            '-t',
            exactTarget,
            '-c',
            pane.cwd,
            commandFor(pane),
          ]),
        )
        if (tmuxPaneId !== null) runner.run(['pipe-pane', '-o', '-t', tmuxPaneId, capture])
      }
      launched.push(pane.paneIndex)
      recordSpawnReceipt(config.stateDir, {
        id: receiptId,
        sessionName: plan.sessionName,
        paneIndex: pane.paneIndex,
        harness: plan.controls.harness,
        model: plan.controls.model,
        thinking: plan.controls.thinking,
        budget: plan.controls.budget,
        autonomy: pane.envelope,
        repoRoot: pane.repoRoot,
        worktreePath: pane.worktreePath,
        promptDigest: pane.promptDigest,
        argv: pane.argv,
        createdAt: new Date(now).toISOString(),
        baseCommit,
        branch: `spawn/${basename(pane.worktreePath)}`,
        ledgerDir: `sessions/${receiptId}`,
        tmuxPaneId,
      })
    } catch (err) {
      const error = (err as Error).message
      recordAuditEntry(config.stateDir, {
        id: nextAuditId(),
        timestamp: new Date(now).toISOString(),
        flow: 'spawn:launch',
        argv: ['launch', plan.sessionName],
        action: 'refused',
        mode: 'spawn',
        command: `tmux new-session/split-window (${launched.length} pane(s) up)`,
        reason:
          `launch-failure: ${error} (launched pane(s): ${launched.join(', ') || 'none'}; ` +
          `failed pane ${pane.paneIndex}; no retries)`,
        exitCode: null,
      })
      throw new SpawnRefusalError(
        'launch-failure',
        `launch failed at pane ${pane.paneIndex}: ${error}`,
      )
    }
  }
  recordAuditEntry(config.stateDir, {
    id: nextAuditId(),
    timestamp: new Date(now).toISOString(),
    flow: 'spawn:launch',
    argv: ['launch', plan.sessionName],
    action: 'spawned',
    mode: 'spawn',
    command: plan.panes.map((pane) => pane.argv.join(' ')).join(' | '),
    reason: null,
    exitCode: null,
    spawnId: plan.sessionName,
  })
  return { sessionName: plan.sessionName, launched, failed: null }
}
