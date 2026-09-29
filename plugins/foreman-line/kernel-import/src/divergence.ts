/**
 * T5 — the named DIVERGENCE_STOP surface.
 *
 * `checkDivergence` re-derives every Git-winner field (ratification facts and
 * human-gate facts) through the lineage reader against the epoch-bound digests
 * and the current ledger rows: committed bytes must still hash to the recorded
 * digest. It either passes or throws `DIVERGENCE_STOP` with the class
 * reasonCode (`ratification-fact` / `human-gate-fact`). The projection's
 * render path runs the same re-derivation but refuses with
 * `projection-source-drift` (T5/CON-10) — no bytes emitted, cursor unmoved.
 *
 * This surface + its fixture matrix is FK-P11's named RS-1.4(c) exit-duty
 * evidence for the divergence-stop fragment.
 */
import type { Storage } from '@foreman-line/kernel-state'
import { importError } from './errors.js'
import { readImportedGoalClaims, type ImportedGoalClaims } from './import.js'
import type { LineageGateway } from './lineage.js'

/** Any handle carrying the ledger + lineage (importer or projector; T9). */
export interface DivergenceContext {
  readonly storage: Storage
  readonly gateway: LineageGateway
}

interface GitWinnerFact {
  goalId: string
  fieldId: string
  driftReasonCode: 'ratification-fact' | 'human-gate-fact'
  sourceCommit: string
  sourcePath: string
  digest: string
}

function gitWinnerFacts(claims: readonly ImportedGoalClaims[]): GitWinnerFact[] {
  const facts: GitWinnerFact[] = []
  for (const entry of claims) {
    for (const ref of entry.claimedRatificationRefs) {
      facts.push({
        goalId: entry.goalId,
        fieldId: 'claimedRatificationRefs.digest',
        driftReasonCode: 'ratification-fact',
        sourceCommit: ref.provenance.sourceCommit,
        sourcePath: ref.provenance.sourcePath,
        digest: ref.digest,
      })
    }
    for (const claim of entry.claimedApprovals) {
      if (claim.provenance === null) continue
      facts.push({
        goalId: entry.goalId,
        fieldId: 'claimedApprovals.digest',
        driftReasonCode: 'human-gate-fact',
        sourceCommit: claim.provenance.sourceCommit,
        sourcePath: claim.provenance.sourcePath,
        digest: claim.digest,
      })
    }
  }
  return facts
}

/**
 * Re-derive every Git-winner fact through the reader. Drift (missing or
 * changed committed bytes) stops with the caller's reasonCode — never
 * overwrites, never repairs, never picks a winner at runtime.
 */
export function verifyGitWinnerFacts(
  ctx: DivergenceContext,
  onDrift: 'class' | 'projection-source-drift',
): void {
  for (const fact of gitWinnerFacts(readImportedGoalClaims(ctx.storage))) {
    const blob = ctx.gateway.readCommittedBlob(fact.sourceCommit, fact.sourcePath)
    const drifted = 'absent' in blob || ctx.gateway.digestOf(blob) !== fact.digest
    if (!drifted) continue
    if (onDrift === 'projection-source-drift') {
      throw importError('DIVERGENCE_STOP', {
        reasonCode: 'projection-source-drift',
        goalId: fact.goalId,
        fieldId: fact.fieldId,
      })
    }
    throw importError('DIVERGENCE_STOP', {
      reasonCode: fact.driftReasonCode,
      goalId: fact.goalId,
      fieldId: fact.fieldId,
    })
  }
}

/** T9 read + reader: passes or throws `DIVERGENCE_STOP` (the class reasonCodes). */
export function checkDivergence(ctx: DivergenceContext): void {
  verifyGitWinnerFacts(ctx, 'class')
}
