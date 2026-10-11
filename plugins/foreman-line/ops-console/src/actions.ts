import type { ConsoleConfig } from './config.js'
import { listAuditEntries, recordAuditEntry } from './invoke.js'
import type { SignalClass, SignalVerb } from './signals.js'

/**
 * FCA-P4 action registry: the closed (class × verb) matrix mapping signals to
 * invocation classes, prompt-template ids, and autonomy envelopes. Unregistered
 * pairs are refused typed and audited. `execute` is structurally unavailable
 * to mutating verbs (type-level union + runtime guard on untyped input) and
 * the registry never runs a mutating command in the console process — the
 * `spawn` class launches real sessions (FCA-P5) and `present` renders commands.
 *
 * Prompt templates land in Task 10; the destructive-confirmation guard lands
 * in Task 11. Both slot into `dispatchAction` below.
 */

export type InvocationClass = 'spawn' | 'present' | 'execute'

export interface AutonomyEnvelope {
  readonly decisions: 'full' | 'partial'
  readonly commit: boolean
  readonly push: boolean
  readonly openPr: boolean
  /** Stage-F fail-closed: merge is human-owned unless verified authority exists. */
  readonly merge: boolean
}

interface ActionSpecBase {
  readonly signalClasses: readonly SignalClass[]
  /** Template id — Task 10 materializes prompt composition. */
  readonly promptTemplate: string
  readonly autonomy: AutonomyEnvelope
  readonly destructive: boolean
}

/** Type-level guard: mutating verbs can never carry `execute`. */
export type ActionSpec = ActionSpecBase &
  (
    | { readonly verb: 'investigate' | 'explain'; readonly invocation: InvocationClass }
    | { readonly verb: 'remediate' | 'close-delete'; readonly invocation: 'spawn' | 'present' }
  )

export const MUTATING_VERBS: readonly SignalVerb[] = ['remediate', 'close-delete']

export type ActionRefusalReason = 'unregistered-action' | 'execute-on-mutating-verb'

/** Typed refusal (mirrors the `ConsoleRootUnresolvedError` convention). */
export class ActionRefusalError extends Error {
  readonly code = 2 as const
  readonly reason: ActionRefusalReason

  constructor(reason: ActionRefusalReason, message: string) {
    super(message)
    this.name = 'ActionRefusalError'
    this.reason = reason
  }
}

const ALL_CLASSES: readonly SignalClass[] = [
  'parcel-state',
  'release-hygiene',
  'worktree-hygiene',
  'scm-ci',
  'goal-hygiene',
  'session-state',
]
const ALL_BUT_RELEASE: readonly SignalClass[] = ALL_CLASSES.filter(
  (entry) => entry !== 'release-hygiene',
)

/** Conservative defaults — request envelopes may only widen, never relax merge. */
const NO_WRITE: AutonomyEnvelope = {
  decisions: 'partial',
  commit: false,
  push: false,
  openPr: false,
  merge: false,
}
const LIGHT_WRITE: AutonomyEnvelope = {
  decisions: 'partial',
  commit: true,
  push: false,
  openPr: false,
  merge: false,
}

export const ACTION_REGISTRY: readonly ActionSpec[] = [
  {
    verb: 'investigate',
    signalClasses: ALL_CLASSES,
    invocation: 'spawn',
    promptTemplate: 'investigate',
    autonomy: NO_WRITE,
    destructive: false,
  },
  {
    verb: 'explain',
    signalClasses: ALL_CLASSES,
    invocation: 'spawn',
    promptTemplate: 'explain',
    autonomy: NO_WRITE,
    destructive: false,
  },
  {
    verb: 'remediate',
    signalClasses: ALL_CLASSES,
    invocation: 'spawn',
    promptTemplate: 'remediate',
    autonomy: LIGHT_WRITE,
    destructive: false,
  },
  {
    verb: 'close-delete',
    signalClasses: ALL_BUT_RELEASE,
    invocation: 'spawn',
    promptTemplate: 'close-delete',
    autonomy: NO_WRITE,
    destructive: true,
  },
]

export function lookupAction(signalClass: string, verb: string): ActionSpec | null {
  return (
    ACTION_REGISTRY.find(
      (entry) => entry.verb === verb && entry.signalClasses.includes(signalClass as SignalClass),
    ) ?? null
  )
}

/** Untyped input by design: this guard exists to police external requests. */
export interface ActionSpecInput {
  readonly verb: string
  readonly invocation: string
  readonly destructive?: boolean
}

export function validateActionSpec(spec: ActionSpecInput): void {
  if (MUTATING_VERBS.includes(spec.verb as SignalVerb) && spec.invocation === 'execute') {
    throw new ActionRefusalError(
      'execute-on-mutating-verb',
      `action refused: ${spec.verb} is a mutating verb and may never be registered as execute`,
    )
  }
}

export interface ActionRequest {
  readonly verb: string
  readonly signalClass: string
  readonly subject: string
  /** Widens the registry default; merge can never flip to true here (Stage F). */
  readonly autonomy?: Partial<AutonomyEnvelope>
}

export interface ActionAttempt {
  readonly action: 'executed' | 'presented' | 'spawned'
  readonly command: string
  readonly spawnId?: string | null
}

export type ActionRunner = (
  spec: ActionSpec,
  request: ActionRequest,
  envelope: AutonomyEnvelope,
) => ActionAttempt

/**
 * Task 9 default runner: presents, never executes — the console fabricates no
 * TTY and runs no mutating command. Task 13's spawner replaces this for the
 * `spawn` class with real tmux sessions (outcome `spawned`).
 */
export const presentOnlyRunner: ActionRunner = (spec, request) => ({
  action: 'presented',
  command: `action ${spec.verb} --class ${request.signalClass} --subject ${request.subject}`,
})

export interface ActionOutcome {
  readonly id: string
  readonly verb: string
  readonly signalClass: string
  readonly subject: string
  readonly action: 'executed' | 'presented' | 'spawned' | 'refused'
  readonly invocation: InvocationClass | null
  readonly command: string
  readonly reason: string | null
  readonly autonomy: AutonomyEnvelope | null
  readonly spawnId: string | null
}

export function dispatchAction(
  config: ConsoleConfig,
  request: ActionRequest,
  now: number,
  runner: ActionRunner = presentOnlyRunner,
): ActionOutcome {
  const id = `act-${String(listAuditEntries(config.stateDir).length + 1).padStart(6, '0')}`
  const timestamp = new Date(now).toISOString()
  const argv = [request.verb, request.signalClass, request.subject]
  const spec = lookupAction(request.signalClass, request.verb)

  let outcome: ActionOutcome
  if (spec === null) {
    outcome = {
      id,
      verb: request.verb,
      signalClass: request.signalClass,
      subject: request.subject,
      action: 'refused',
      invocation: null,
      command: '',
      reason: `unknown action ${request.verb} on ${request.signalClass} (registry is a closed set)`,
      autonomy: null,
      spawnId: null,
    }
  } else {
    validateActionSpec(spec)
    const envelope: AutonomyEnvelope = { ...spec.autonomy, ...(request.autonomy ?? {}) }
    const attempt = runner(spec, request, envelope)
    outcome = {
      id,
      verb: request.verb,
      signalClass: request.signalClass,
      subject: request.subject,
      action: attempt.action,
      invocation: spec.invocation,
      command: attempt.command,
      reason: null,
      autonomy: envelope,
      spawnId: attempt.spawnId ?? null,
    }
  }

  // Append-only audit (same `state/invocation-audit.json` as invoke flows).
  recordAuditEntry(config.stateDir, {
    id,
    timestamp,
    flow: `action:${request.verb}`,
    argv,
    action: outcome.action,
    mode: outcome.invocation,
    command: outcome.command,
    reason: outcome.reason,
    exitCode: null,
    autonomy: outcome.autonomy,
    spawnId: outcome.spawnId,
  })
  return outcome
}
