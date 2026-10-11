import assert from 'node:assert/strict'
import test from 'node:test'
import type { ActionSpec, AutonomyEnvelope } from '../src/actions.js'
import { composePrompt } from '../src/prompts.js'

/**
 * FCA-P4 prompt composition (Task 10): kickstarter-style plain text per
 * baseline verb — signal evidence, restated task, boundaries (no self-graded
 * verification), the autonomy envelope verbatim, and the Stage-F fail-closed
 * merge sentence present no matter what the envelope says. Optional extra
 * direction appends verbatim. Pure string composition, no templating engine.
 */
const SIGNAL = { class: 'parcel-state', subject: 'goal/P1', evidence: ['a.md', 'b.md'] }

const ENVELOPE: AutonomyEnvelope = {
  decisions: 'partial',
  commit: true,
  push: false,
  openPr: false,
  merge: false,
}

function specFor(verb: ActionSpec['verb']): ActionSpec {
  return {
    verb,
    signalClasses: ['parcel-state'],
    promptTemplate: verb,
    invocation: 'spawn',
    autonomy: ENVELOPE,
    destructive: verb === 'close-delete',
  } as ActionSpec
}

const MERGE_SENTENCE =
  "Merges fail closed to human ownership: even when merge is y above, an agent may merge only when the target repository's effective branch rules grant agent merge authority and that authorization is verified at merge time; anything ambiguous fails closed to a human-owned merge."

function expected(verb: string, task: string, extra: string | null = null): string {
  return `ACTION: ${verb} (parcel-state): goal/P1
TASK: ${task}

EVIDENCE:
- a.md
- b.md

AUTONOMY (verbatim):
decisions: partial
commit: y
push: n
open-PR: n
merge: n

BOUNDARIES:
- Never self-grade verification: work only counts as done when independent evidence and review say so.
- ${MERGE_SENTENCE}${extra === null ? '' : `\n\nEXTRA DIRECTION:\n${extra}`}`
}

test('composition is pure and snapshot-stable per verb', () => {
  const cases: [ActionSpec['verb'], string][] = [
    ['investigate', 'Investigate the finding below and report root cause with evidence.'],
    ['remediate', 'Remediate the finding below with the smallest safe change.'],
    [
      'explain',
      'Explain the finding below for a human operator: what fired, why, and what it implies.',
    ],
    [
      'close-delete',
      'Close or delete the named subject only. This action is destructive; touch nothing else.',
    ],
  ]
  for (const [verb, task] of cases) {
    const prompt = composePrompt(specFor(verb), SIGNAL, ENVELOPE)
    assert.equal(prompt, expected(verb, task), `${verb} snapshot`)
    assert.equal(prompt, composePrompt(specFor(verb), SIGNAL, ENVELOPE), `${verb} is pure`)
  }
})

test('the autonomy envelope appears verbatim and merge never drops the fail-closed sentence', () => {
  const prompt = composePrompt(specFor('investigate'), SIGNAL, ENVELOPE)
  assert.ok(
    prompt.includes(
      'AUTONOMY (verbatim):\ndecisions: partial\ncommit: y\npush: n\nopen-PR: n\nmerge: n',
    ),
  )
  assert.ok(prompt.includes(MERGE_SENTENCE))

  const mergeOn = composePrompt(specFor('remediate'), SIGNAL, {
    decisions: 'full',
    commit: true,
    push: true,
    openPr: true,
    merge: true,
  })
  assert.ok(mergeOn.includes('decisions: full\ncommit: y\npush: y\nopen-PR: y\nmerge: y'))
  assert.ok(mergeOn.includes(MERGE_SENTENCE), 'the Stage-F fail-closed sentence survives merge: y')
})

test('extra direction appends verbatim to every composed prompt', () => {
  const extra =
    '  Keep the existing work; close fresh dispatch LAST.\nSecond line, exactly as typed.  '
  for (const verb of ['investigate', 'remediate', 'explain', 'close-delete'] as const) {
    const prompt = composePrompt(specFor(verb), SIGNAL, ENVELOPE, extra)
    assert.ok(prompt.endsWith(`EXTRA DIRECTION:\n${extra}`), `${verb} keeps extra text verbatim`)
  }
  assert.equal(
    composePrompt(specFor('explain'), SIGNAL, ENVELOPE, null).includes('EXTRA DIRECTION'),
    false,
  )
})
