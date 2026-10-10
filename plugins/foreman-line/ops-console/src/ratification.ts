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
const EXCLUDED = /\b(historical|archive|example|instruction|superseded)\b/i
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

/** Pipe cells require a real unescaped separator outside code spans. */
function pipeCells(line: string): string[] | null {
  const cells: string[] = []
  let cell = ''
  const nextTick = new Map<number, number>()
  const lastTick = new Map<number, number>()
  const ticks = [...line.matchAll(/`+/g)].filter((run) => {
    let backslashes = 0
    for (let before = run.index - 1; before >= 0 && line[before] === '\\'; before--) backslashes++
    return backslashes % 2 === 0
  })
  for (let index = ticks.length - 1; index >= 0; index--) {
    const run = ticks[index]
    if (!run) continue
    const next = lastTick.get(run[0].length)
    if (next !== undefined) nextTick.set(run.index, next)
    lastTick.set(run[0].length, run.index)
  }
  let separator = false
  for (let index = 0; index < line.length; index++) {
    const char = line[index] ?? ''
    if (char === '\\' && index + 1 < line.length) {
      cell += line.slice(index, index + 2)
      index++
    } else if (char === '`') {
      let length = 1
      while (line[index + length] === '`') length++
      const close = nextTick.get(index)
      if (close !== undefined) {
        cell += line.slice(index, close + length)
        index = close + length - 1
      } else {
        cell += '`'.repeat(length)
        index += length - 1
      }
    } else if (char === '|') {
      cells.push(cell)
      cell = ''
      separator = true
    } else cell += char
  }
  if (!separator) return null
  cells.push(cell)
  if (cells[0]?.trim() === '') cells.shift()
  if (cells[cells.length - 1]?.trim() === '') cells.pop()
  return cells.length > 0 ? cells : null
}

/** Bounded existing block starts that end table bodies. HTML/setext and
 * indented-code grammar are intentionally outside this observation reader. */
function endsTable(text: string): boolean {
  return (
    !text.trim() ||
    HEADING.test(text) ||
    /^ {0,3}(?:>|`{3,}|~{3,}|[-+*][ \t]+|[0-9]{1,9}[.)][ \t]+)/.test(text) ||
    /^ {0,3}(?:(?:\*[ \t]*){3,}|(?:-[ \t]*){3,}|(?:_[ \t]*){3,})$/.test(text)
  )
}

/** Tables are identified by header + delimiter, never by an incidental bar. */
function tableLines(lines: readonly string[]): Set<number> {
  const excluded = new Set<number>()
  for (let index = 1; index < lines.length; index++) {
    const delimiter = pipeCells(lines[index] ?? '')
    const headerText = lines[index - 1] ?? ''
    const header = pipeCells(headerText)
    if (
      !delimiter ||
      !header ||
      delimiter.length !== header.length ||
      !delimiter.every((cell) => /^\s*:?-+:?\s*$/.test(cell)) ||
      endsTable(headerText)
    )
      continue
    excluded.add(index - 1)
    excluded.add(index)
    let body = index + 1
    while (body < lines.length) {
      const text = lines[body] ?? ''
      // GFM Examples 199/202: even an unpiped row supplies the first cell;
      // remaining cells are empty. Only a blank or supported block ends it.
      if (endsTable(text)) break
      excluded.add(body++)
    }
    index = body - 1
  }
  return excluded
}

function qualified(value: string, positive: RegExp): boolean {
  const tail = unquoted(value.replace(positive, '')).trim()
  // A direct clause, or one carried through explicit owner/date provenance,
  // qualifies the current grant. An unrelated review/gate/parcel clause ends
  // that scope; no arbitrary narrative search is performed.
  let grantScope = true
  for (const raw of tail.split(/[;,\n]/)) {
    const clause = raw.trim().replace(/^[-–—:(]\s*/, '')
    if (!clause) continue
    const withoutDate = clause.replace(
      /^\d{4}-\d{2}-\d{2}(?:\s+\d\d:\d\d(?:\s+[A-Z]+)?)?\s*[-–—:(]?\s*/,
      '',
    )
    const direct = withoutDate
      .replace(/^(?:granted\s+)?only\s+(?=if\b)/i, '')
      .replace(/^granted\s+(?=(?:if|provided|conditional)\b)/i, '')
    if (grantScope && (QUALIFIED.test(direct) || /^subject\s+to\b/i.test(direct))) return true
    const target = clause.replace(/^but\s+/i, '')
    const gate =
      /^(?:goal(?:'s)?\s+)?gate\s*1\s*(?:ratification|grant)?\s*(?::|is|was|remains)?\s*/i.exec(
        target,
      )
    if (
      gate &&
      (QUALIFIED.test(target.slice(gate[0].length)) ||
        /^subject\s+to\b/i.test(target.slice(gate[0].length)))
    )
      return true
    grantScope = /^(?:owner(?:\/date)?\b|date\s*:|\d{4}-\d{2}-\d{2}(?:\s|$))/i.test(clause)
  }
  return false
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
    const tables = tableLines(lines)
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
      if (/^\s*>/.test(original) || tables.has(index)) continue
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
          tables.has(index + 1) ||
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
        if (qualified(fullValue, positive)) {
          add(
            line,
            'unsupported',
            `unsupported or conditional current ${label} grant: ${normalized}`,
          )
        } else if (eligible) {
          add(line, 'grant', `current ${label} grant: ${normalized}`)
        }
      } else if (metadata || QUALIFIED.test(fullValue) || qualified(fullValue, /^(?=.)/)) {
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
