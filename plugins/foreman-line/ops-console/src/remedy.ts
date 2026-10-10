import type { ConsoleConfig } from './config.js'
import type { GoalProjection, ParcelProjection } from './types.js'

/**
 * FCA-3 remediation advisor: for every parcel that needs the human, present a
 * triage QUESTION and answer-branch RECOMMENDATIONS with copy-pasteable
 * commands. Pure presentation over the frozen derivation — the console never
 * executes these, never decides a gate, and never writes (charter D2/D4).
 *
 * Ordering principle (owner directive 2026-10-09): every branch list is
 * ordered **preserve-and-complete the existing work first**, discard last.
 * Closing or re-dispatching fresh is the final option, never the first.
 */
export interface RemedyOption {
  readonly answer: string
  readonly recommendation: string
  readonly commands: readonly string[]
}

export interface Remedy {
  readonly goal: string
  /** null = goal-level remedy (e.g. Gate-1 ratification). */
  readonly parcel: string | null
  readonly cause: string
  readonly question: string
  readonly options: readonly RemedyOption[]
}

function editorCmd(config: ConsoleConfig, ref: string): string {
  return `$EDITOR "${config.repoRoot}/${ref}"`
}

function hungRemedy(
  config: ConsoleConfig,
  projection: GoalProjection,
  parcel: ParcelProjection,
): Remedy {
  const reason = parcel.liveness.reason
  const stale = /stale beyond threshold|no content files/i.test(reason)
  const gone = /no worktree basename matched|no gitdir on disk|no registered worktrees/i.test(
    reason,
  )
  const worktree = parcel.liveness.worktree
  const stateLine = editorCmd(config, projection.goal.loopDirectiveRef)

  const options: RemedyOption[] = []
  if (worktree !== null && stale) {
    options.push({
      answer: 'The builder is idle-but-alive and its work is intact',
      recommendation:
        'Resume the existing builder in its worktree and let it finish — the heartbeat recovers as soon as receipts progress. Do not re-dispatch: the work would duplicate.',
      commands: [`cd "${worktree}"`, stateLine],
    })
    options.push({
      answer: 'The pause is intentional (waiting on review, CI, or me)',
      recommendation:
        'Widen this goal’s heartbeat so an honest pause is not reported hung — add a `hung-threshold: Nh` override line to the goal record.',
      commands: [stateLine],
    })
  }
  if (gone) {
    options.push({
      answer: 'The work exists somewhere (branch, PR, stash, or the builder session)',
      recommendation:
        'Recover and complete it in place: find the branch or PR, resume the session that produced it, and carry the work to a merge rather than restarting.',
      commands: [
        `git -C "${config.repoRoot}" branch --list '*${parcel.parcel}*' '*${projection.goal.slug}*'`,
        `gh pr list --search "${parcel.parcel}"`,
      ],
    })
  }
  options.push({
    answer: 'The work shipped, only the record is missing',
    recommendation:
      'Complete the record instead of redoing the work: mark the queue item ☑ SHIPPED + CLOSED with its PR/merge reference and update the state line (the goal’s Stage-F closure step).',
    commands: [stateLine],
  })
  options.push({
    answer: 'Nothing of value exists — the work is stale and unwanted',
    recommendation:
      'Close or defer the queue item in the goal record with a one-line disposition (why it is not worth finishing). This is the last resort: prefer any option above.',
    commands: [stateLine],
  })

  return {
    goal: projection.goal.slug,
    parcel: parcel.parcel,
    cause: `hung — ${reason}; last progress ${parcel.heartbeat.lastProgressAt ?? 'never'}`,
    question: 'What does the existing work need to keep going?',
    options,
  }
}

const FAILURE_QUESTIONS: Record<
  NonNullable<ParcelProjection['failure']>['code'],
  { question: string; options: readonly Omit<RemedyOption, 'commands'>[] }
> = {
  'chain-invalid': {
    question: 'Is the underlying work intact and only the receipt record broken?',
    options: [
      {
        answer: 'Yes — the work exists, the chain evidence is damaged',
        recommendation:
          'Validate to see exactly where the chain breaks, then re-emit ONLY the broken stage from its real evidence. Never forge a receipt: re-run the stage that produced it.',
      },
      {
        answer: 'The chain is unrecoverable but a PR or branch holds the work',
        recommendation:
          'Re-anchor under a fresh workflow id and walk the stages from the preserved artifacts — the work is kept, only the receipt history restarts.',
      },
      {
        answer: 'Nothing of value exists behind the chain',
        recommendation:
          'Re-dispatch the parcel fresh. Last resort: prefer preserving anything above.',
      },
    ],
  },
  'red-review': {
    question: 'Can the existing review findings be fixed in the current work?',
    options: [
      {
        answer: 'Yes — the findings are addressable',
        recommendation:
          'Bounded rework in place: re-dispatch the SAME builder with the findings (one active writer), then take a fresh independent re-review of the final SHA. The reviewed work is kept.',
      },
      {
        answer: 'Some findings are wrong or acceptable',
        recommendation:
          'Triage them into documented waivers pinned by identity + location + value, cite the evidence, then re-run verification. Record the triage in the state line.',
      },
      {
        answer: 'The work is beyond repair',
        recommendation:
          'Re-dispatch fresh with the review findings folded into the kickstarter as standing constraints. Last resort.',
      },
    ],
  },
  tripwire: {
    question: 'Is the test-count change legitimate for this parcel?',
    options: [
      {
        answer: 'Legitimate — the tests changed for a real reason',
        recommendation:
          'Record a ratified amendment (alone-first commit) explaining the test-count delta, then re-run the deterministic pass. The tripwire retires only with the amendment on record.',
      },
      {
        answer: 'Unknown — I need to see what happened to the tests',
        recommendation:
          'Investigate before anything else: a tripwire usually means tests were weakened or deleted. Reproduce with the test-count diff and restore anything missing.',
      },
      {
        answer: 'It is not legitimate',
        recommendation:
          'Stop the parcel (two fires on one parcel is the standing stop condition) and route to the human owner for a ruling.',
      },
    ],
  },
  'closure-drift': {
    question: 'Did the repository move under a closed parcel?',
    options: [
      {
        answer: 'The drift is cosmetic or already reconciled',
        recommendation:
          'Re-run the closure verification on fresh main; if it passes, record the drift as re-verified and keep the parcel closed.',
      },
      {
        answer: 'The drift is real',
        recommendation:
          'File a small follow-up debt item that references the closed parcel, and open a narrow new parcel for exactly the drift — the completed work stays completed.',
      },
    ],
  },
}

function failedRemedy(
  config: ConsoleConfig,
  projection: GoalProjection,
  parcel: ParcelProjection,
): Remedy {
  const code = parcel.failure?.code ?? 'chain-invalid'
  const entry = FAILURE_QUESTIONS[code]
  const stateLine = editorCmd(config, projection.goal.loopDirectiveRef)
  const validate = `receipts validate "${config.repoRoot}/docs/receipts/"`
  return {
    goal: projection.goal.slug,
    parcel: parcel.parcel,
    cause: `failed — ${parcel.failure?.code ?? 'unknown'}: ${parcel.failure?.detail ?? ''}`,
    question: entry.question,
    options: entry.options.map((option) => ({
      ...option,
      commands:
        code === 'chain-invalid' && option.answer.startsWith('Yes')
          ? [validate, stateLine]
          : [stateLine],
    })),
  }
}

function gateRemedy(
  config: ConsoleConfig,
  projection: GoalProjection,
  parcel: ParcelProjection,
): Remedy | null {
  const pending = (['G1', 'G2', 'G3'] as const).filter(
    (gate) => parcel.gates[gate].status === 'pending',
  )
  if (pending.length === 0) return null
  const gate = pending[0] ?? 'G1'
  const detail = parcel.gates[gate].detail
  const stateLine = editorCmd(config, projection.goal.loopDirectiveRef)
  const charter = editorCmd(config, projection.goal.charterRef)

  const byGate: Record<'G1' | 'G2' | 'G3', { question: string; options: RemedyOption[] }> = {
    G1: {
      question: 'Is the shaping output ready for Gate-1 ratification?',
      options: [
        {
          answer: 'Yes — the charter is sound',
          recommendation:
            'Ratify: add the Gate-1 RATIFIED/GRANTED line (owner + date) to the goal charter. The gate flips on the next projection.',
          commands: [charter],
        },
        {
          answer: 'Not yet — questions are open',
          recommendation:
            'Send it back to shaping with the open questions listed in the charter; the gate stays pending and nothing dispatches.',
          commands: [charter],
        },
      ],
    },
    G2: {
      question: 'Is the parcel ready to dispatch (Gate 2)?',
      options: [
        {
          answer: 'Yes — dispatch the existing spec',
          recommendation:
            'Grant dispatch through the allowlisted approval flow — presented here only; the console never approves anything itself.',
          commands: [
            `approval approve ${parcel.parcel} --repo-root "${config.repoRoot}"`,
            stateLine,
          ],
        },
        {
          answer: 'Hold — not ready',
          recommendation:
            'Keep the item queued and note what is missing in the state line. The gate remains the stop line.',
          commands: [stateLine],
        },
      ],
    },
    G3: {
      question: 'Is the chain green and ready to merge (Gate 3)?',
      options: [
        {
          answer: 'Yes — the checks are green',
          recommendation:
            'Human merge — review the PR and merge it yourself (the console never merges). The merge SHA then closes the chain through Stage F.',
          commands: [`gh pr list --search "${parcel.parcel}"`, 'gh pr merge <number>', stateLine],
        },
        {
          answer: 'No — something is red',
          recommendation:
            'Route back to the red step (deterministic pass or review): any red step voids the merge authorization for that PR.',
          commands: [stateLine],
        },
      ],
    },
  }

  const entry = byGate[gate]
  return {
    goal: projection.goal.slug,
    parcel: parcel.parcel,
    cause: `awaiting-gate — ${gate} pending: ${detail}`,
    question: entry.question,
    options: entry.options,
  }
}

function ratificationRemedy(config: ConsoleConfig, projection: GoalProjection): Remedy | null {
  if (projection.goal.ratification.status !== 'pending') return null
  return {
    goal: projection.goal.slug,
    parcel: null,
    cause: `goal charter awaiting Gate-1 ratification — ${projection.goal.ratification.detail}`,
    question: 'Should this goal proceed at all?',
    options: [
      {
        answer: 'Yes — ratify the charter',
        recommendation:
          'Add the Gate-1 RATIFIED/GRANTED line (owner + date) to the charter; parcels can then pass their own gates.',
        commands: [editorCmd(config, projection.goal.charterRef)],
      },
      {
        answer: 'Not yet — more shaping needed',
        recommendation: 'List the open questions in the charter and keep the gate pending.',
        commands: [editorCmd(config, projection.goal.charterRef)],
      },
      {
        answer: 'No — park the goal',
        recommendation:
          'Write a parking line in the state block (why, and what would revive it) so the goal stops asking for attention honestly.',
        commands: [editorCmd(config, projection.goal.loopDirectiveRef)],
      },
    ],
  }
}

/** All remedies for one goal, most-blocking first; empty when nothing needs the human. */
export function remediesFor(config: ConsoleConfig, projection: GoalProjection): Remedy[] {
  const remedies: Remedy[] = []
  const ratification = ratificationRemedy(config, projection)
  if (ratification !== null) remedies.push(ratification)
  for (const parcel of projection.parcels) {
    if (parcel.state === 'failed') remedies.push(failedRemedy(config, projection, parcel))
    else if (parcel.state === 'hung') remedies.push(hungRemedy(config, projection, parcel))
    else if (parcel.state === 'awaiting-gate') {
      const remedy = gateRemedy(config, projection, parcel)
      if (remedy !== null) remedies.push(remedy)
    }
  }
  return remedies
}
