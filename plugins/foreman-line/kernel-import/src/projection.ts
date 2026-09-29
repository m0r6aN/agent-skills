/**
 * T6 — the deterministic, byte-stable Markdown projection.
 *
 * Two registered whole-ledger views (`md-goals-index`, `md-goal-ledger`); the
 * projection emits DATA (bytes) only — FK-P11 writes NO repo files and holds
 * NO mutation authority (OQ-4). Render is pure given (state rows, reader
 * answers): no live clock, no wall-time, no toolVersion in the bytes;
 * canonical ordering (UTF-16 code-unit); canonical-strict decode that refuses
 * non-canonical bytes/unpaired surrogates (`PROJECTION_INPUT_NONCANONICAL`) or
 * unnormalizable state (`PROJECTION_STATE_INVALID`); every interpolated
 * external string passes `sanitizeForMarkdown` (#31, linear-time #19); and
 * Git-winner facts render only after the lineage reader confirms the recorded
 * digests (drift → `DIVERGENCE_STOP(projection-source-drift)`, cursor unmoved).
 *
 * `publishProjection` advances the stream's registered cursor to the current
 * max `event_seq` inside one `withTransaction`; a refused render leaves the
 * cursor unmoved. Concurrent publishes of one stream serialize under the
 * storage write lock; both renders are byte-identical either way.
 */

import { isGoalStatus } from '@foreman-line/kernel-lease/src/index.ts'
import {
  type EventRow,
  type GoalRow,
  getGoal,
  getTransition,
  getUnreleasedLease,
  type LeaseRow,
  type Storage,
  type TransitionRow,
  withTransaction,
} from '@foreman-line/kernel-state'
import { digestBytes } from './canonical.js'
import {
  type FkP11ProjectionId,
  type RegisteredProjectionId,
  getProjectionCursor as readCursorRow,
  resolveWritableProjectionId,
  setProjectionCursor as writeCursorRow,
} from './cursors.js'
import { verifyGitWinnerFacts } from './divergence.js'
import {
  importError,
  isHarnessFailure,
  isImportError,
  isStorageClassFault,
  rethrowSubstrate,
} from './errors.js'
import { type ImportedGoalClaims, readAllEvents, readImportedGoalClaims } from './import.js'
import { createLineageGateway, type LineageGateway, type SourceLineageReader } from './lineage.js'
import { sanitizeForMarkdown } from './sanitize.js'

/** Fixed render-format literal (version-stable-by-format, T6 rule 1). */
export const PROJECTION_FORMAT_VERSION = '0.1.0'

/** The projector handle (T9). */
export interface Projector {
  readonly storage: Storage
  readonly gateway: LineageGateway
}

export interface ProjectionRender {
  markdownBytes: Uint8Array
  projectionDigest: string
  renderedThroughEventSeq: number
}

export interface ProjectionPublish extends ProjectionRender {
  cursorBefore: { projectionId: RegisteredProjectionId; lastAppliedEventSeq: number }
  cursorAfter: { projectionId: RegisteredProjectionId; lastAppliedEventSeq: number }
}

/** T9 constructor. */
export function createProjector(options: {
  storage: Storage
  lineageReader: SourceLineageReader
}): Projector {
  return {
    storage: options.storage,
    gateway: createLineageGateway(options.lineageReader),
  }
}

interface GoalViewState {
  goalId: string
  status: string
  revision: number
  pendingTransition: string
  leaseHolder: string
  claims: ImportedGoalClaims | null
}

function decodeStoredString(value: unknown, field: string): string {
  if (typeof value !== 'string') {
    throw importError('PROJECTION_INPUT_NONCANONICAL', { field })
  }
  for (let i = 0; i < value.length; i += 1) {
    const unit = value.charCodeAt(i)
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = i + 1 < value.length ? value.charCodeAt(i + 1) : 0
      if (next < 0xdc00 || next > 0xdfff) {
        throw importError('PROJECTION_INPUT_NONCANONICAL', { field })
      }
      i += 1
    } else if (unit >= 0xdc00 && unit <= 0xdfff) {
      throw importError('PROJECTION_INPUT_NONCANONICAL', { field })
    }
  }
  return value
}

function codeUnitLess(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

function collectGoalIds(
  events: readonly EventRow[],
  claims: readonly ImportedGoalClaims[],
): string[] {
  const seen: Record<string, true> = {}
  const ids: string[] = []
  for (const event of events) {
    const goalId = decodeStoredString(event.goalId, 'events.goalId')
    if (seen[goalId] !== true) {
      seen[goalId] = true
      ids.push(goalId)
    }
  }
  for (const entry of claims) {
    const goalId = decodeStoredString(entry.goalId, 'events.payload.goalId')
    if (seen[goalId] !== true) {
      seen[goalId] = true
      ids.push(goalId)
    }
  }
  ids.sort(codeUnitLess)
  return ids
}

function buildState(
  storage: Storage,
  events: readonly EventRow[],
  claims: readonly ImportedGoalClaims[],
): GoalViewState[] {
  const claimsByGoal = new Map<string, ImportedGoalClaims>()
  for (const entry of claims) claimsByGoal.set(entry.goalId, entry)
  return collectGoalIds(events, claims).map((goalId) => {
    let goal: GoalRow | null = null
    let lease: LeaseRow | null = null
    let pending: TransitionRow | null = null
    try {
      goal = getGoal(storage, goalId)
      lease = getUnreleasedLease(storage, goalId)
      if (goal !== null && goal.pendingTransitionId !== null) {
        pending = getTransition(storage, goal.pendingTransitionId)
      }
    } catch (value) {
      rethrowSubstrate(value)
    }
    if (goal === null || !isGoalStatus(goal.status)) {
      throw importError('PROJECTION_STATE_INVALID', {})
    }
    return {
      goalId: decodeStoredString(goal.goalId, 'goals.goalId'),
      status: decodeStoredString(goal.status, 'goals.status'),
      revision: goal.revision,
      pendingTransition:
        pending === null ? '-' : decodeStoredString(pending.status, 'transitions.status'),
      leaseHolder:
        lease === null
          ? '-'
          : decodeStoredString(lease.ownerPrincipalRef, 'leases.ownerPrincipalRef'),
      claims: claimsByGoal.get(goalId) ?? null,
    }
  })
}

function renderHeader(projectionId: FkP11ProjectionId, renderedThroughEventSeq: number): string[] {
  return [
    `<!-- projection: ${projectionId} -->`,
    `projectionFormatVersion: ${PROJECTION_FORMAT_VERSION}`,
    `projectionId: ${projectionId}`,
    `renderedThroughEventSeq: ${renderedThroughEventSeq}`,
  ]
}

function renderGoalsIndex(
  state: readonly GoalViewState[],
  renderedThroughEventSeq: number,
): string {
  const lines = renderHeader('md-goals-index', renderedThroughEventSeq)
  lines.push(
    '',
    'goalId | status | revision | pendingTransition | leaseHolder',
    '--- | --- | --- | --- | ---',
  )
  for (const row of state) {
    lines.push(
      [
        sanitizeForMarkdown(row.goalId),
        sanitizeForMarkdown(row.status),
        String(row.revision),
        sanitizeForMarkdown(row.pendingTransition),
        sanitizeForMarkdown(row.leaseHolder),
      ].join(' | '),
    )
  }
  return `${lines.join('\n')}\n`
}

function renderGoalLedger(
  state: readonly GoalViewState[],
  renderedThroughEventSeq: number,
): string {
  const lines = renderHeader('md-goal-ledger', renderedThroughEventSeq)
  for (const row of state) {
    lines.push(
      '',
      `## ${sanitizeForMarkdown(row.goalId)}`,
      `status: ${sanitizeForMarkdown(row.status)}`,
    )
    lines.push(`revision: ${row.revision}`)
    lines.push(`pendingTransition: ${sanitizeForMarkdown(row.pendingTransition)}`)
    lines.push(`leaseHolder: ${sanitizeForMarkdown(row.leaseHolder)}`)
    if (row.claims === null) {
      lines.push('import: -', 'evidence: -')
      continue
    }
    const source = row.claims.source
    lines.push('import:')
    lines.push(
      `  sourcePath: ${sanitizeForMarkdown(decodeStoredString(source.sourcePath, 'source.sourcePath'))}`,
    )
    lines.push(
      `  sourceDigest: ${sanitizeForMarkdown(decodeStoredString(source.sourceDigest, 'source.sourceDigest'))}`,
    )
    lines.push(
      `  sourceCommit: ${sanitizeForMarkdown(decodeStoredString(source.sourceCommit, 'source.sourceCommit'))}`,
    )
    lines.push(
      `  epochId: ${sanitizeForMarkdown(decodeStoredString(row.claims.epochId, 'epochId'))}`,
    )
    lines.push('evidence:')
    for (const claim of row.claims.claimedApprovals) {
      const provenance = claim.provenance
      lines.push(
        `  - import.approval ${sanitizeForMarkdown(claim.evidenceKind)} ${sanitizeForMarkdown(claim.gitIdentity)} ${sanitizeForMarkdown(claim.digest)}`,
      )
      if (provenance !== null) {
        lines.push(
          `    at ${sanitizeForMarkdown(provenance.sourceCommit)}:${sanitizeForMarkdown(provenance.sourcePath)}`,
        )
      }
    }
    for (const ref of row.claims.claimedRatificationRefs) {
      lines.push(
        `  - import.ratification-ref ${sanitizeForMarkdown(ref.gitIdentity)} ${sanitizeForMarkdown(ref.digest)}`,
      )
      lines.push(
        `    at ${sanitizeForMarkdown(ref.provenance.sourceCommit)}:${sanitizeForMarkdown(ref.provenance.sourcePath)}`,
      )
    }
  }
  return `${lines.join('\n')}\n`
}

function renderState(projector: Projector, projectionId: FkP11ProjectionId): ProjectionRender {
  // T6 rule 5: Git-winner facts render only after reader confirmation.
  verifyGitWinnerFacts(projector, 'projection-source-drift')
  const events = readAllEvents(projector.storage)
  const claims = readImportedGoalClaims(projector.storage)
  const renderedThroughEventSeq = events[events.length - 1]?.eventSeq ?? 0
  const state = buildState(projector.storage, events, claims)
  const document =
    projectionId === 'md-goals-index'
      ? renderGoalsIndex(state, renderedThroughEventSeq)
      : renderGoalLedger(state, renderedThroughEventSeq)
  const markdownBytes = new TextEncoder().encode(document)
  return {
    markdownBytes,
    projectionDigest: digestBytes(markdownBytes),
    renderedThroughEventSeq,
  }
}

/** T9 read + reader: pure render; no writes. Refused render emits no bytes. */
export function renderProjection(
  projector: Projector,
  query: { projectionId: unknown },
): ProjectionRender {
  return renderState(projector, resolveWritableProjectionId(query.projectionId))
}

/**
 * T9 effectful: one `withTransaction` advancing the registered cursor to the
 * rendered-through seq. A refused render (thrown before the cursor write)
 * leaves the cursor unmoved.
 */
export function publishProjection(
  projector: Projector,
  query: { projectionId: unknown },
): ProjectionPublish {
  const projectionId = resolveWritableProjectionId(query.projectionId)
  let preservedCause: unknown = null
  try {
    return withTransaction(projector.storage, (storage) => {
      try {
        const before = readCursorRow(storage, projectionId)
        const render = renderState(projector, projectionId)
        writeCursorRow(storage, {
          projectionId,
          lastAppliedEventSeq: render.renderedThroughEventSeq,
        })
        return {
          ...render,
          cursorBefore: before,
          cursorAfter: readCursorRow(storage, projectionId),
        }
      } catch (value) {
        // ERR-01..03: preserve the true cause across FK-P9's transaction wrap.
        if (!isStorageClassFault(value)) preservedCause = value
        throw value
      }
    })
  } catch (value) {
    if (isImportError(value)) throw value
    if (isHarnessFailure(value)) throw value
    if (preservedCause !== null) throw preservedCause
    rethrowSubstrate(value)
  }
}

/** T9 read: the registered cursor (registered ids only; `goal-state` readable). */
export function getProjectionCursor(
  projector: Projector,
  query: { projectionId: unknown },
): { projectionId: 'goal-state' | FkP11ProjectionId; lastAppliedEventSeq: number } {
  return readCursorRow(projector.storage, query.projectionId)
}
