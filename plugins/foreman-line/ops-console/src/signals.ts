import { type ConsoleConfig, goalTrees, treeConfigFor } from './config.js'
import { projectGoal } from './project.js'
import { listGoalSlugs } from './scan.js'
// Provider modules register here; they import only `makeSignal`/types from
// this module (hoisted declarations), so the cycle resolves safely.
import { goalHygieneProvider } from './signals-goal.js'
import { releaseHygieneProvider } from './signals-release.js'
import { scmCiProvider } from './signals-scm.js'
import { sessionStateProvider } from './signals-session.js'
import { worktreeHygieneProvider } from './signals-worktree.js'
import type { ParcelProjection, ParcelStateValue } from './types.js'

/**
 * FCA-P3 unified attention model: one `Signal` type every finding class
 * projects into, so `actions` (FCA-P4) can key verbs off signals instead of
 * bespoke UI cases. Signals are derived, immutable snapshots — re-derived on
 * every scan (D2/D3), never stored. Evidence is mandatory: a signal without
 * inspectable paths/URLs/commands is refused at construction.
 *
 * Class vocabulary is closed (extension = spec change). `session-state`
 * (spawn/pane liveness, FCA-P5) is part of the vocabulary from the start per
 * the 2026-10-11 class decision; its provider lands with Task 14.
 */

export const SIGNAL_CLASSES = [
  'parcel-state',
  'release-hygiene',
  'worktree-hygiene',
  'scm-ci',
  'goal-hygiene',
  'session-state',
] as const
export type SignalClass = (typeof SIGNAL_CLASSES)[number]

export const SIGNAL_SEVERITIES = ['info', 'attention', 'urgent'] as const
export type SignalSeverity = (typeof SIGNAL_SEVERITIES)[number]

export const SIGNAL_VERBS = ['investigate', 'remediate', 'explain', 'close-delete'] as const
export type SignalVerb = (typeof SIGNAL_VERBS)[number]

export interface Signal {
  /** Deterministic `${class}:${repo}:${subject}` — stable across scans. */
  readonly id: string
  readonly class: SignalClass
  readonly severity: SignalSeverity
  /** Absolute repo root the signal concerns. */
  readonly repo: string
  /** Human/agent-inspectable subject locator (goal/parcel, file path, PR URL). */
  readonly subject: string
  /** Non-empty: paths, URLs, or commands a human or agent can inspect. */
  readonly evidence: readonly string[]
  readonly detectedAt: string
  /** Verbs this signal supports (FCA-P4 registry pairs with `class`). */
  readonly actions: readonly SignalVerb[]
}

export interface SignalInput {
  readonly class: SignalClass
  readonly severity: SignalSeverity
  readonly repo: string
  readonly subject: string
  readonly evidence: readonly string[]
  readonly detectedAt: string
  readonly actions: readonly SignalVerb[]
}

export type SignalRefusalReason = 'empty-evidence' | 'unknown-class' | 'unknown-severity'

/** Typed refusal (mirrors the `ConsoleRootUnresolvedError` convention). */
export class SignalRefusalError extends Error {
  readonly code = 2 as const
  readonly reason: SignalRefusalReason

  constructor(reason: SignalRefusalReason, message: string) {
    super(message)
    this.name = 'SignalRefusalError'
    this.reason = reason
  }
}

export function makeSignal(input: SignalInput): Signal {
  if (!(SIGNAL_CLASSES as readonly string[]).includes(input.class)) {
    throw new SignalRefusalError(
      'unknown-class',
      `signal refused: unknown class ${String(input.class)}`,
    )
  }
  if (!(SIGNAL_SEVERITIES as readonly string[]).includes(input.severity)) {
    throw new SignalRefusalError(
      'unknown-severity',
      `signal refused: unknown severity ${String(input.severity)}`,
    )
  }
  if (input.evidence.length === 0) {
    throw new SignalRefusalError('empty-evidence', 'signal refused: evidence is mandatory')
  }
  return { ...input, id: `${input.class}:${input.repo}:${input.subject}` }
}

/**
 * Severity mapping over the frozen FOC-P0 parcel states — the same attention
 * semantics the FCA-2 counts use (hung/failed need action now; awaiting-gate
 * needs the human; running/complete are informational).
 */
export const SEVERITY_FOR_STATE: Record<ParcelStateValue, SignalSeverity> = {
  running: 'info',
  hung: 'urgent',
  'awaiting-gate': 'attention',
  failed: 'urgent',
  complete: 'info',
  'not-started': 'info',
}

const ACTIONS_FOR_STATE: Record<ParcelStateValue, readonly SignalVerb[]> = {
  running: ['investigate', 'explain'],
  hung: ['investigate', 'remediate', 'explain', 'close-delete'],
  'awaiting-gate': ['investigate', 'explain'],
  failed: ['investigate', 'remediate', 'explain', 'close-delete'],
  complete: ['explain', 'close-delete'],
  'not-started': ['investigate', 'explain'],
}

export interface SignalProvider {
  readonly class: SignalClass
  /** Pure derivation over disk truth; runs on every scan. */
  collect(config: ConsoleConfig, now: number): Signal[]
}

function evidenceFor(parcel: ParcelProjection, loopDirectiveRef: string): string[] {
  const evidence: string[] = []
  if (parcel.specRef !== null) evidence.push(parcel.specRef)
  if (parcel.chain !== null) evidence.push(`docs/receipts/${parcel.chain.workflowId}`)
  // Evidence floor: the goal's loop directive is always inspectable.
  evidence.push(loopDirectiveRef)
  return evidence
}

/** Task 4: the FOC-P0 projection wrapped as the first provider. */
export const parcelStateProvider: SignalProvider = {
  class: 'parcel-state',
  collect(config: ConsoleConfig, now: number): Signal[] {
    const signals: Signal[] = []
    const detectedAt = new Date(now).toISOString()
    for (const tree of goalTrees(config)) {
      const treeConfig = treeConfigFor(config, tree)
      for (const slug of listGoalSlugs(treeConfig)) {
        const projection = projectGoal(treeConfig, slug, now)
        if (projection === null) continue
        const key = tree.key === null ? slug : `${tree.key}.${slug}`
        for (const parcel of projection.parcels) {
          signals.push(
            makeSignal({
              class: 'parcel-state',
              severity: SEVERITY_FOR_STATE[parcel.state],
              repo: tree.root,
              subject: `${key}/${parcel.parcel}`,
              evidence: evidenceFor(parcel, projection.goal.loopDirectiveRef),
              detectedAt,
              actions: ACTIONS_FOR_STATE[parcel.state],
            }),
          )
        }
      }
    }
    return signals
  },
}

/**
 * Default provider set — assembled lazily at call time. Provider modules
 * (e.g. `signals-release.js`) register into this one; building the array at
 * module load would hit the registration cycle's temporal dead zone.
 */
function defaultProviders(): SignalProvider[] {
  return [
    parcelStateProvider,
    releaseHygieneProvider,
    worktreeHygieneProvider,
    scmCiProvider,
    goalHygieneProvider,
    sessionStateProvider,
  ]
}

export function collectSignals(
  config: ConsoleConfig,
  now: number,
  providers?: readonly SignalProvider[],
): Signal[] {
  return (providers ?? defaultProviders()).flatMap((provider) => provider.collect(config, now))
}

/**
 * FCA-P14: In-flight deduplication for concurrent signal collection.
 * Concurrent requests with the same config share a single set of provider Promises.
 */
const signalsInFlight = new Map<string, Promise<Signal[]>>()

/** Clear in-flight cache (for tests). */
export function clearSignalsInFlight(): void {
  signalsInFlight.clear()
}

/** Internal options for test injection. */
export interface CollectSignalsOptions {
  /** Disable dedup (for negative control tests). */
  readonly noDedup?: boolean
}

/**
 * FCA-P14: Async signal collection using non-blocking spawn.
 * Providers run concurrently; the event loop is not blocked.
 * Concurrent identical requests share a single in-flight promise (deduplication).
 */
export async function collectSignalsAsync(
  config: ConsoleConfig,
  now: number,
  options?: CollectSignalsOptions,
): Promise<Signal[]> {
  const key = config.repoRoot

  // Check for in-flight request (deduplication)
  if (options?.noDedup !== true) {
    const inFlight = signalsInFlight.get(key)
    if (inFlight !== undefined) {
      return inFlight
    }
  }

  // Create new promise for this collection
  const promise = collectSignalsInternal(config, now)

  // Store in dedup cache
  if (options?.noDedup !== true) {
    signalsInFlight.set(key, promise)
    // Clean up on completion
    promise.finally(() => signalsInFlight.delete(key))
  }

  return promise
}

/** FCA-P14: Internal signal collection (shared by deduped and non-deduped paths). */
async function collectSignalsInternal(config: ConsoleConfig, now: number): Promise<Signal[]> {
  // parcelStateProvider and goalHygieneProvider are sync (no exec calls)
  // releaseHygieneProvider is sync (reads files only)
  const syncSignals = [
    ...parcelStateProvider.collect(config, now),
    ...releaseHygieneProvider.collect(config, now),
    ...goalHygieneProvider.collect(config, now),
  ]

  // Async providers run concurrently
  const asyncResults = await Promise.all([
    worktreeHygieneProvider.collectAsync(config, now),
    scmCiProvider.collectAsync(config, now),
    sessionStateProvider.collectAsync(config, now),
  ])

  return [...syncSignals, ...asyncResults.flat()]
}
