import { createHash } from 'node:crypto'
import { basename, dirname, join } from 'node:path'
import { type AutonomyEnvelope, lookupAction } from './actions.js'
import { BUDGET_PRESETS, HARNESS_REGISTRY, THINKING_LEVELS } from './harness.js'
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
  | 'unsupported-thinking'
  | 'unsupported-budget'
  | 'unregistered-action'

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
  readonly cwd: string
  readonly worktreePath: string
  readonly prompt: string
  /** sha256 of `prompt` — what the spawn receipt stores (FCA-P5). */
  readonly promptDigest: string
  readonly envelope: AutonomyEnvelope
}

export interface SpawnPlan {
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
      cwd: worktreePath,
      worktreePath,
      prompt,
      promptDigest: createHash('sha256').update(prompt).digest('hex'),
      envelope,
    }
  })
  return { sessionName, panes }
}
