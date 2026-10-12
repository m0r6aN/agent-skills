import type { ActionSpec, AutonomyEnvelope } from './actions.js'

/**
 * FCA-P4 prompt composition: kickstarter-style plain text per baseline verb —
 * signal evidence, restated task, boundaries (no self-graded verification),
 * the autonomy envelope rendered verbatim, and the Stage-F fail-closed merge
 * sentence unconditionally present. Pure string composition (no templating
 * dependency); optional extra direction appends verbatim, exactly as typed.
 */

const TASK_LINES = {
  investigate: 'Investigate the finding below and report root cause with evidence.',
  remediate: 'Remediate the finding below with the smallest safe change.',
  explain: 'Explain the finding below for a human operator: what fired, why, and what it implies.',
  'close-delete':
    'Close or delete the named subject only. This action is destructive; touch nothing else.',
} as const

export const MERGE_SENTENCE =
  "Merges fail closed to human ownership: even when merge is y above, an agent may merge only when the target repository's effective branch rules grant agent merge authority and that authorization is verified at merge time; anything ambiguous fails closed to a human-owned merge."

export const VERIFICATION_BOUNDARY =
  'Never self-grade verification: work only counts as done when independent evidence and review say so.'

export interface PromptSignal {
  readonly class: string
  readonly subject: string
  readonly evidence: readonly string[]
}

export function composePrompt(
  spec: ActionSpec,
  signal: PromptSignal,
  envelope: AutonomyEnvelope,
  extraText?: string | null,
): string {
  const evidence = signal.evidence.map((item) => `- ${item}`).join('\n')
  const envelopeText = [
    `decisions: ${envelope.decisions}`,
    `commit: ${envelope.commit ? 'y' : 'n'}`,
    `push: ${envelope.push ? 'y' : 'n'}`,
    `open-PR: ${envelope.openPr ? 'y' : 'n'}`,
    `merge: ${envelope.merge ? 'y' : 'n'}`,
  ].join('\n')
  const extra = extraText == null ? '' : `\n\nEXTRA DIRECTION:\n${extraText}`
  return `ACTION: ${spec.verb} (${signal.class}): ${signal.subject}
TASK: ${TASK_LINES[spec.verb]}

EVIDENCE:
${evidence}

AUTONOMY (verbatim):
${envelopeText}

BOUNDARIES:
- ${VERIFICATION_BOUNDARY}
- ${MERGE_SENTENCE}${extra}`
}
