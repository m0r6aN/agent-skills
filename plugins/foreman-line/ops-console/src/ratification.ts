import type { GoalRatification, Locator, RatificationEvidence } from './types.js'

/** Pure current-record reader. Sources and their locators are supplied by scanGoal;
 * references are never followed and evidence is not authenticated authority. */
export interface RatificationSource {
  readonly source: 'charter' | 'loop-directive'
  readonly locator: Locator
  readonly text: string | null
  readonly failureKind?: 'missing' | 'unreadable'
}

const HEADING = /^ {0,3}(#{1,6})\s+(.+?)\s*#*\s*$/
const EXCLUDED =
  /\b(historical|archive|archived|example|examples|instruction|instructions|superseded)\b/i
const B_HEADING = /^(gate 1 record|gates and standing authorizations)\s*(?:[-–—].*)?$/i
const NOTE = /^historical[- ]note\s*(?:$|[:\-–—])/i
const RECORD = /^(?:[-*+]\s+)?(Status|Gate 1)\s*:\s*(.*)$/i
const NEGATIVE = /^(pending|draft|unratified|not ratified|not granted)\b/i
const POSITIVE_A = /^(ratified|fully ratified)\b/i
const POSITIVE_B = /^(granted|ratified)\b/i
const QUALIFIED =
  /^(?:pending|not ratified|not granted|if|provided|conditional(?:ly)?|unresolved|revoked|rescinded|withdrawn|superseded|replaced|disputed|under review|re-?opened?|no longer (?:in force|valid|granted|ratified))\b/i

function boldCount(text: string): number {
  return (text.match(/\*\*/g) ?? []).length
}

function unbold(text: string): string {
  return text.replace(/\*\*/g, '')
}

/** Remove quoted/link spans without moving later words into the leading-token
 * position. This is used only to inspect qualifications, never to find grants. */
function unquoted(text: string): string {
  return text.replace(/!?\[[^\]]*\]\([^)]*\)|"[^"\n]*"|'[^'\n]*'|`[^`\n]*`/g, ' ')
}

function qualified(value: string, positive: RegExp): boolean {
  const tail = unquoted(value.replace(positive, '')).trim()
  // A qualifier immediately following the value/date targets that grant.
  const first = tail.replace(
    /^(?:\d{4}-\d{2}-\d{2}(?:\s+\d\d:\d\d(?:\s+[A-Z]+)?)?)?\s*[-–—:,]?\s*/,
    '',
  )
  if (QUALIFIED.test(first)) return true
  // Further clauses must explicitly target goal Gate 1, rather than a review,
  // Gate 2/3, or a parcel's HOLD. Restrict this to anchored record contents.
  return unquoted(tail)
    .split(/[;\n]/)
    .some(
      (clause) =>
        /^(?:\s*[-–—:,]\s*)?(?:goal(?:'s)?\s+)?gate\s*1\s*(?:ratification|grant)?\s*(?::|is|was|remains)?\s*/i.test(
          clause.trim(),
        ) &&
        QUALIFIED.test(
          clause
            .trim()
            .replace(
              /^(?:[-–—:,]\s*)?(?:goal(?:'s)?\s+)?gate\s*1\s*(?:ratification|grant)?\s*(?::|is|was|remains)?\s*/i,
              '',
            ),
        ),
    )
}

export interface RatificationResult {
  readonly ratification: GoalRatification
  readonly evidence: readonly RatificationEvidence[]
}

export function readRatification(sources: readonly RatificationSource[]): RatificationResult {
  const evidence: RatificationEvidence[] = []
  for (const source of sources) {
    const add = (line: number | null, kind: RatificationEvidence['kind'], detail: string) => {
      evidence.push({ source: source.source, locator: source.locator, line, kind, detail })
    }
    if (source.text === null) {
      add(
        null,
        source.failureKind ?? (source.source === 'charter' ? 'missing' : 'unreadable'),
        `${source.source} source missing or unreadable at ${source.locator.relativePath}; ratification cannot be reconciled`,
      )
      continue
    }
    const lines = source.text.split(/\r?\n/)
    let fence: { char: string; length: number } | null = null
    let excludedLevel: number | null = null
    let bLevel: number | null = null
    let historicalNote = false
    let firstH2 = false
    let firstStatus = false
    for (let index = 0; index < lines.length; index++) {
      const original = lines[index] ?? ''
      const trimmed = original.trim()
      const marker = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(original)
      if (fence !== null) {
        if (
          marker &&
          marker[1]?.[0] === fence.char &&
          (marker[1]?.length ?? 0) >= fence.length &&
          !marker[2]?.trim()
        )
          fence = null
        continue
      }
      if (marker) {
        fence = { char: marker[1]?.[0] ?? '`', length: marker[1]?.length ?? 3 }
        continue
      }
      if (/^\s*>/.test(original) || /^\s*\|/.test(original)) continue
      const heading = HEADING.exec(original)
      if (heading) {
        const level = heading[1]?.length ?? 1
        const headingTitle = heading[2] ?? ''
        const title = (
          boldCount(headingTitle) % 2 === 0 ? unbold(headingTitle) : headingTitle
        ).trim()
        if (level === 2) firstH2 = true
        historicalNote = false
        if (excludedLevel !== null && level <= excludedLevel) excludedLevel = null
        if (bLevel !== null && level <= bLevel) bLevel = null
        // An excluded parent governs every deeper subsection, even another
        // excluded heading; do not replace its lifetime with the child's.
        if (excludedLevel === null && EXCLUDED.test(title)) excludedLevel = level
        if (excludedLevel === null && B_HEADING.test(title)) bLevel = level
        continue
      }
      if (excludedLevel !== null) continue
      if (boldCount(original) % 2 === 0 && NOTE.test(unbold(trimmed))) {
        historicalNote = true
        continue
      }
      if (historicalNote) continue
      if (!RECORD.test(unbold(trimmed))) continue
      const line = index + 1
      let record = original
      // Join only an opened bold record, bounded by a Markdown structural
      // boundary or another record. Its evidence line remains the first line.
      let unmatched = boldCount(record) % 2 !== 0
      while (unmatched && index + 1 < lines.length) {
        const next = lines[index + 1] ?? ''
        if (
          HEADING.test(next) ||
          /^\s*(?:>|\||`{3,}|~{3,})/.test(next) ||
          RECORD.test(unbold(next.trim()))
        )
          break
        record += `\n${next}`
        if (boldCount(next) % 2 !== 0) unmatched = !unmatched
        index++
      }
      const match = RECORD.exec(unbold(original).trim())
      if (!match) continue
      const label = match[1]?.toLowerCase() ?? ''
      // Dot does not consume the multiline continuation, so match the joined
      // normalized record separately when emphasis spans lines.
      const normalized = unbold(record).trim()
      const fullValue = normalized
        .replace(/^(?:[-*+]\s+)?(?:Status|Gate 1)\s*:\s*/i, '')
        .trimStart()
      const metadata = label === 'status' && !firstH2 && !firstStatus
      if (metadata) firstStatus = true
      if (boldCount(record) % 2 !== 0) {
        add(line, 'unsupported', `unmatched emphasis on ${label} record`)
        continue
      }
      if (NEGATIVE.test(fullValue)) {
        if (qualified(fullValue, NEGATIVE))
          add(line, 'unsupported', `conditional current ${label} denial: ${normalized}`)
        else add(line, 'denial', `current ${label} denial: ${normalized}`)
        continue
      }
      const positive = label === 'status' ? POSITIVE_A : POSITIVE_B
      const boldOrBullet = /^(?:[-*+]\s+|\*\*Gate 1(?:\*\*)?\s*:)/i.test(trimmed)
      const eligible = label === 'status' ? metadata : bLevel !== null && boldOrBullet
      if (positive.test(fullValue)) {
        if (!eligible || qualified(fullValue, positive)) {
          add(
            line,
            'unsupported',
            `unsupported or conditional current ${label} grant: ${normalized}`,
          )
        } else {
          add(line, 'grant', `current ${label} grant: ${normalized}`)
        }
      } else if (metadata || label === 'gate 1' || QUALIFIED.test(fullValue)) {
        add(line, 'unsupported', `unsupported current ${label} record: ${normalized}`)
      }
    }
  }
  const grants = evidence.filter((item) => item.kind === 'grant')
  const denials = evidence.filter((item) => item.kind === 'denial')
  const unsupported = evidence.filter((item) => item.kind === 'unsupported')
  const missing = evidence.filter((item) => item.kind === 'missing' || item.kind === 'unreadable')
  let status: GoalRatification['status'] = 'unknown'
  if (missing.length === 0 && unsupported.length === 0) {
    if (grants.length > 0 && denials.length === 0) status = 'granted'
    else if (denials.length > 0 && grants.length === 0) status = 'pending'
  }
  return {
    ratification: {
      status,
      detail:
        status === 'granted'
          ? (grants[0]?.detail ?? 'granted')
          : status === 'pending'
            ? (denials[0]?.detail ?? 'pending')
            : `no trustworthy current grant: ${grants.length} grant(s), ${denials.length} denial(s), ${unsupported.length} unsupported record(s), ${missing.length} missing/unreadable source(s)`,
    },
    evidence,
  }
}
