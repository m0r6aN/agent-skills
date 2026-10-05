/**
 * Evidence record construction (spec T4 + D13 honesty rules, mechanically
 * enforced here):
 *
 *  1. Classification is derived from observed signals ONLY (T4); the
 *     hypothesis is never written into the classification field.
 *  2. A refusal produced by hooks/model-gate.mjs is ALWAYS tagged
 *     `mechanismPolicyClass: 'model-membership'` (derived from the recorded
 *     refusal source) and is excluded from scope-containment tallies.
 *  3. V7 (hook non-enrollment) rows can never be classified `mechanical`
 *     (D7) — a signal combination implying that refuses emission
 *     (`SIGNAL_AMBIGUOUS`) instead of producing a record.
 *  4. `not-exercised` requires a gap record naming its FK-P18′-lane evidence
 *     obligation; it is never counted passed.
 *  5. A falsified hypothesis is recorded (`hypothesisFalsified: true`), never
 *     softened.
 *  6. Ambiguous signals refuse emission (`SIGNAL_AMBIGUOUS`).
 *
 * All external text is sanitized before emission (standing constraint #31);
 * every walk here is linear-time with no regex (standing constraint #19).
 */

import { sanitizeText } from './canonical.js'
import { HarnessError } from './errors.js'
import type { CaseRow, Classification } from './vectors.js'

export type MechanismPolicyClass = 'model-membership' | 'scope' | 'none'
export type ExercisedFlag = 'yes' | 'gap'
export type RefusalSource = 'model-gate' | 'mutation-scope-guard' | null

export interface ObservedSignals {
  readonly refusalObserved: boolean
  readonly effectLanded: boolean
  readonly detectionObserved: boolean
  /** Which shipped surface produced the refusal (drives mechanism tagging). */
  readonly refusalSource: RefusalSource
  readonly collateralObserved: boolean
}

export interface GapRecord {
  readonly code: string
  readonly reason: string
  readonly obligation: string
}

export interface CaseOutcome {
  readonly exercised: ExercisedFlag
  readonly observed: ObservedSignals | null
  /** Scope-guard (preflightCheck/postHocCheck) invocation attributable to the case's mutation. */
  readonly guardInvocation: boolean
  /** Shipped-surface invocations performed for this case (policy-class evidence). */
  readonly invocationLedger: readonly string[]
  readonly effectEvidence: Readonly<Record<string, unknown>>
  readonly artifacts: readonly string[]
  readonly gapRecord: GapRecord | null
  readonly obligations: readonly string[]
  readonly notes: string
}

export interface CaseEvidenceRecord {
  readonly caseId: string
  readonly kind: 'vector' | 'control' | 'measurement'
  readonly vectorClass: string | null
  readonly className: string | null
  readonly channel: string
  readonly scenario: string
  readonly exercised: ExercisedFlag
  readonly status: 'exercised' | 'not-exercised'
  readonly classification: Classification | null
  readonly classificationBasis: string
  readonly collateral: boolean
  readonly mechanismPolicyClass: MechanismPolicyClass
  readonly refusalSource: RefusalSource
  readonly hypothesis: { readonly classification: Classification | null; readonly basis: string }
  readonly hypothesisFalsified: boolean
  readonly guardInvocation: boolean
  readonly observed: ObservedSignals | null
  readonly invocationLedger: readonly string[]
  readonly effectEvidence: Readonly<Record<string, unknown>>
  readonly artifacts: readonly string[]
  readonly gapRecord: GapRecord | null
  readonly obligations: readonly string[]
  readonly notes: string
}

/**
 * A REFUSED-EMISSION entry (R1/coordinator ruling): when observed signals
 * resolve to T4-ambiguous, the classification emission is refused AND the
 * refusal is recorded here — never reshaped into a passing classification and
 * never silently dropped.
 */
export interface EmissionRefusalEntry {
  readonly caseId: string
  readonly kind: 'vector' | 'control' | 'measurement'
  readonly vectorClass: string | null
  readonly code: 'SIGNAL_AMBIGUOUS'
  readonly reason: string
  readonly observed: ObservedSignals | null
  readonly exercised: 'yes'
}

export type CaseRecordOrRefusal = CaseEvidenceRecord | EmissionRefusalEntry

function isEmissionRefusalEntry(value: CaseRecordOrRefusal): value is EmissionRefusalEntry {
  return 'code' in value
}

export { isEmissionRefusalEntry as isEmissionRefusal }

/**
 * Build a case record, converting SIGNAL_AMBIGUOUS into a recorded
 * emission-refusal entry. Every other typed failure still throws.
 */
export function buildCaseRecordOrRefusal(row: CaseRow, outcome: CaseOutcome): CaseRecordOrRefusal {
  try {
    return buildCaseRecord(row, outcome)
  } catch (err) {
    if (err instanceof HarnessError && err.code === 'SIGNAL_AMBIGUOUS') {
      return {
        caseId: row.id,
        kind: row.kind,
        vectorClass: row.vectorClass,
        code: 'SIGNAL_AMBIGUOUS',
        reason: sanitizeText(err.message),
        observed: outcome.observed,
        exercised: 'yes',
      }
    }
    throw err
  }
}
/** T4 derivation: observed signals → classification. Throws SIGNAL_AMBIGUOUS. */
export function deriveClassification(observed: ObservedSignals): Classification {
  const { refusalObserved, effectLanded, detectionObserved } = observed
  if (refusalObserved && !effectLanded) return 'mechanical'
  if (!refusalObserved && effectLanded) return detectionObserved ? 'detected' : 'unsupported'
  throw new HarnessError(
    'SIGNAL_AMBIGUOUS',
    `observed signals contradict the derivation table (refusal=${refusalObserved}, effect=${effectLanded}, detection=${detectionObserved})`,
    { refusalObserved, effectLanded, detectionObserved },
  )
}

/** D13 rule 2: mechanism tagging is derived from the refusal source, never free-form. */
export function deriveMechanism(observed: ObservedSignals | null): MechanismPolicyClass {
  if (observed === null || observed.refusalSource === null) return 'none'
  return observed.refusalSource === 'model-gate' ? 'model-membership' : 'scope'
}

/** Linear walk sanitizing every string leaf (standing constraint #31). */
function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') return sanitizeText(value)
  if (Array.isArray(value)) return value.map(sanitizeValue)
  if (typeof value === 'object' && value !== null) {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = sanitizeValue(v)
    return out
  }
  return value
}

/**
 * Build a case evidence record. Enforces the honesty rules above; refuses
 * emission rather than producing an unsound record.
 */
export function buildCaseRecord(row: CaseRow, outcome: CaseOutcome): CaseEvidenceRecord {
  if (outcome.exercised === 'gap') {
    if (outcome.gapRecord === null) {
      throw new HarnessError(
        'EVIDENCE_WRITE_FAILED',
        `${row.id}: not-exercised requires a gap record naming its evidence obligation`,
      )
    }
    if (outcome.observed !== null) {
      throw new HarnessError(
        'SIGNAL_AMBIGUOUS',
        `${row.id}: not-exercised cannot carry observed signals`,
      )
    }
    return {
      caseId: row.id,
      kind: row.kind,
      vectorClass: row.vectorClass,
      className: row.className,
      channel: row.channel,
      scenario: row.scenario,
      exercised: 'gap',
      status: 'not-exercised',
      classification: null,
      classificationBasis: 'not exercised: gap record recorded; classification withheld (T4 row 1)',
      collateral: false,
      mechanismPolicyClass: 'none',
      refusalSource: null,
      hypothesis: row.hypothesis,
      hypothesisFalsified: false,
      guardInvocation: outcome.guardInvocation,
      observed: null,
      invocationLedger: sanitizeValue(outcome.invocationLedger) as readonly string[],
      effectEvidence: sanitizeValue(outcome.effectEvidence) as Record<string, unknown>,
      artifacts: outcome.artifacts,
      gapRecord: {
        ...outcome.gapRecord,
        reason: sanitizeText(outcome.gapRecord.reason),
        obligation: sanitizeText(outcome.gapRecord.obligation),
      },
      obligations: sanitizeValue(outcome.obligations) as readonly string[],
      notes: sanitizeText(outcome.notes),
    }
  }

  if (outcome.observed === null) {
    throw new HarnessError('SIGNAL_AMBIGUOUS', `${row.id}: exercised requires observed signals`)
  }
  if (outcome.gapRecord !== null) {
    throw new HarnessError(
      'SIGNAL_AMBIGUOUS',
      `${row.id}: exercised case cannot carry a gap record`,
    )
  }
  const observed = outcome.observed
  const classification = deriveClassification(observed)

  // D7 hard rule: non-enrollment is never mechanical and never a hook refusal.
  if (row.vectorClass === 'V7' && classification === 'mechanical') {
    throw new HarnessError(
      'SIGNAL_AMBIGUOUS',
      `${row.id}: V7 (hook non-enrollment) can never classify mechanical (D7)`,
      { observed },
    )
  }

  const mechanismPolicyClass = deriveMechanism(observed)
  if (observed.refusalSource === 'model-gate' && mechanismPolicyClass !== 'model-membership') {
    throw new HarnessError(
      'SIGNAL_AMBIGUOUS',
      `${row.id}: model-gate refusal must tag mechanismPolicyClass model-membership`,
    )
  }

  const hypothesisFalsified =
    row.hypothesis.classification !== null && classification !== row.hypothesis.classification

  return {
    caseId: row.id,
    kind: row.kind,
    vectorClass: row.vectorClass,
    className: row.className,
    channel: row.channel,
    scenario: row.scenario,
    exercised: 'yes',
    status: 'exercised',
    classification,
    classificationBasis: 'derived from observed signals per T4',
    collateral: observed.collateralObserved,
    mechanismPolicyClass,
    refusalSource: observed.refusalSource,
    hypothesis: row.hypothesis,
    hypothesisFalsified,
    guardInvocation: outcome.guardInvocation,
    observed,
    invocationLedger: sanitizeValue(outcome.invocationLedger) as readonly string[],
    effectEvidence: sanitizeValue(outcome.effectEvidence) as Record<string, unknown>,
    artifacts: outcome.artifacts,
    gapRecord: null,
    obligations: sanitizeValue(outcome.obligations) as readonly string[],
    notes: sanitizeText(outcome.notes),
  }
}

/**
 * Banned-claim vocabulary (AC5): emitted evidence must never assert
 * enforcement, promotion, a hook-refusal claim for non-enrollment, or any
 * stranded INF / full-D21 obligation. Phrase scan over emitted bytes
 * (lowercased, linear `includes` per phrase — no regex). The space form
 * "hook refusal" is NOT scanned because the honest D7 rule text negates it
 * ("never a hook refusal"); claim forms are covered by the hyphenated and
 * verb phrases below.
 */
export const BANNED_CLAIM_PHRASES: readonly string[] = [
  'promoted',
  'promotion approved',
  'promotion granted',
  'enforcement proven',
  'enforcement confirmed',
  'enforces scope',
  'enforces containment',
  'containment proven',
  'hook-refusal',
  'hook refused',
  'refused by hook',
  'scenario-14',
  'scenario 14',
  'full d21',
  'inf-1 satisfied',
  'inf-2 satisfied',
  'inf-3 satisfied',
  'inf-4 satisfied',
  'inf-6 satisfied',
  'inf-7 bound',
  'inf-8 proven',
]

/** Returns the banned phrases found in `text` (empty array = clean). */
export function scanBannedClaims(text: string): readonly string[] {
  const lower = text.toLowerCase()
  const found: string[] = []
  for (const phrase of BANNED_CLAIM_PHRASES) {
    if (lower.includes(phrase)) found.push(phrase)
  }
  return found
}
