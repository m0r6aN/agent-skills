/**
 * Spec-body parser and validation chain (FK-P2).
 *
 * Parsing is a single-pass, non-recursive scanner: O(n) in the UTF-8 byte
 * length of the spec body, with a hard cap of 4 byte examinations per input
 * byte across the four named phases — section split (line boundaries and
 * forbidden-paragraph item extraction), entry lex, per-segment validation,
 * canonicalization — plus an O(k log k) sort over k entries (k <= 256, done in
 * compile-scope). `stats.bytesExamined` counts exactly the content-inspecting
 * passes: boundary scan, paragraph item walk, entry lex, per-segment
 * validation. Output construction (slicing canonical strings, section text,
 * ticket/surfaces values) copies already-decided bytes and is not an
 * examination; the body-level UTF-8 decode and byte-cap admission (precedence
 * step 1) is the input conversion itself. Worst case per byte: 4 (a negative
 * entry byte inspected by boundary scan + item walk + lex + segment passes);
 * ordinary entries reach 3. No regular expression with nested quantifiers or
 * unbounded backtracking exists in this parser.
 *
 * D10: `surfaces:` is surfaced here as opaque audit metadata only. It is
 * NEVER read as mutation authority — compile-scope never consumes it.
 */
import { digestBytes } from './canonical-output.js'
import { ScopeCompileError } from './errors.js'

export const GRAMMAR_PIN = {
  convention: 'SPEC-CONVENTION',
  schemaRevision: 'v0.4',
  revisionDate: '2026-09-27',
  sectionBytes: 10199,
  sectionDigest: 'sha256:96113a55c6ddf2a7bad93c90d7004f1e51550aa2b1164ae06093992ee824398d',
  fileDigest: 'sha256:70508684d2c929d1331ed0cd9a147fcc2206593a04fbf210314e22fb80cba0a8',
} as const

/**
 * Known pre-v0.4 base state of `plugins/foreman-line/docs/SPEC-CONVENTION.md`
 * (committed bytes at base `7f3391c`) — the Step-0 flag A gap window. Exact
 * digests measured at shaping time and reported in the completion claim.
 */
export const KNOWN_BASE_GRAMMAR = {
  totalBytes: 18344,
  sectionBytes: 6610,
  sectionDigest: 'sha256:b11a34a49f2b079907c06954752729d98d95f016fe42f263cb1eb7c6494112cc',
  fileDigest: 'sha256:7ac315005cde6ad6def848b83de1d1b644e321c5d9f6434bc925deb6daba8703',
} as const

export const BODY_BYTE_CAP = 1024 * 1024
export const ENTRY_BYTE_CAP = 512
export const SEGMENT_BYTE_CAP = 128
export const MAX_SEGMENTS = 64
export const MAX_ENTRIES = 256
export const MAX_BYTES_PER_INPUT_BYTE = 4

export type GrammarPinState = 'pinned' | 'known-base' | 'drift'

export interface ParseStats {
  bytesExamined: number
  entriesExamined: number
}

export interface ParsedSpec {
  /** From frontmatter `ticket:`; identity only. */
  ticket: string
  /** Opaque audit metadata (frontmatter `surfaces:`) — NEVER mutation authority (D10). */
  surfaces: string | null
  sections: {
    intent: string
    constraints: string
    acceptanceCriteria: string
    outOfScope: string
    contextReferences: string
  }
  /** Validated exact canonical entries from `## Allowed Files`, body order. */
  allowedFiles: string[]
  /** Validated `path`/`path/**` refs annotated `frozen`, body order. */
  frozenSurfaces: string[]
  /** Validated `path`/`path/**` refs not annotated `frozen`, body order. */
  forbiddenSurfaces: string[]
  stats: ParseStats
}

const FORBIDDEN_PARAGRAPH = '**Forbidden surfaces (exact):**'
const REQUIRED_SECTIONS = [
  'Intent',
  'Constraints',
  'Acceptance Criteria',
  'Out of Scope',
  'Context & References',
] as const
const RESERVED_NAMES: Record<string, true> = {
  CON: true,
  PRN: true,
  AUX: true,
  NUL: true,
  COM1: true,
  COM2: true,
  COM3: true,
  COM4: true,
  COM5: true,
  COM6: true,
  COM7: true,
  COM8: true,
  COM9: true,
  LPT1: true,
  LPT2: true,
  LPT3: true,
  LPT4: true,
  LPT5: true,
  LPT6: true,
  LPT7: true,
  LPT8: true,
  LPT9: true,
}
const FORMAT_CHAR = /\p{Cf}/u

interface Range {
  start: number
  end: number
}

type EntryListName = 'allowed' | 'frozen' | 'forbidden'

interface EntryRecord {
  range: Range
  list: 'allowed' | 'negative'
  frozen: boolean
  index: number
  /** Non-bullet junk line in the Allowed Files region: MALFORMED_ENTRY on sight. */
  junkLine: boolean
}

/** UTF-8 byte cost of the code point at `i` (surrogate pairs as one 4-byte unit). */
function utf8CostAt(text: string, i: number): { cost: number; width: number } {
  const unit = text.charCodeAt(i)
  if (unit >= 0xd800 && unit <= 0xdbff) {
    const next = i + 1 < text.length ? text.charCodeAt(i + 1) : 0
    if (next >= 0xdc00 && next <= 0xdfff) return { cost: 4, width: 2 }
    return { cost: 3, width: 1 }
  }
  if (unit >= 0xdc00 && unit <= 0xdfff) return { cost: 3, width: 1 }
  if (unit < 0x80) return { cost: 1, width: 1 }
  if (unit < 0x800) return { cost: 2, width: 1 }
  return { cost: 3, width: 1 }
}

function isLineSpace(unit: number): boolean {
  return unit === 0x20 || unit === 0x09
}

function isHexUnit(unit: number): boolean {
  return (
    (unit >= 0x30 && unit <= 0x39) ||
    (unit >= 0x41 && unit <= 0x46) ||
    (unit >= 0x61 && unit <= 0x66)
  )
}

function utf8ByteLength(text: string): number {
  let bytes = 0
  for (let i = 0; i < text.length; ) {
    const step = utf8CostAt(text, i)
    bytes += step.cost
    i += step.width
  }
  return bytes
}

/**
 * Three-state grammar-pin classification (Step-0 flag A ruling): the pinned
 * v0.4 digests, the known pre-v0.4 base digests, or real drift.
 */
export function classifyGrammarState(fileBytes: Uint8Array): GrammarPinState {
  const text = new TextDecoder('utf-8', { fatal: false }).decode(fileBytes)
  const sectionStart = text.indexOf('## 4. Required Spec Schema')
  const sectionEnd = text.indexOf('## 5. The Spec ↔ Jira Contract')
  if (sectionStart < 0 || sectionEnd < 0 || sectionEnd <= sectionStart) return 'drift'
  const sectionBytes = new TextEncoder().encode(text.slice(sectionStart, sectionEnd))
  const fileDigest = digestBytes(fileBytes)
  const sectionDigest = digestBytes(sectionBytes)
  const pinned =
    fileDigest === GRAMMAR_PIN.fileDigest &&
    sectionDigest === GRAMMAR_PIN.sectionDigest &&
    sectionBytes.length === GRAMMAR_PIN.sectionBytes
  if (pinned) return 'pinned'
  const knownBase =
    fileDigest === KNOWN_BASE_GRAMMAR.fileDigest &&
    sectionDigest === KNOWN_BASE_GRAMMAR.sectionDigest &&
    sectionBytes.length === KNOWN_BASE_GRAMMAR.sectionBytes &&
    fileBytes.length === KNOWN_BASE_GRAMMAR.totalBytes
  return knownBase ? 'known-base' : 'drift'
}

/** Refuses compilation unless the live grammar bytes match the pin exactly. */
export function assertGrammarPin(fileBytes: Uint8Array): void {
  const state = classifyGrammarState(fileBytes)
  if (state !== 'pinned') {
    throw new ScopeCompileError(
      'GRAMMAR_PIN_MISMATCH',
      `spec grammar digest does not equal the pin (state: ${state})`,
    )
  }
}

interface ScanResult {
  ticket: Range | null
  surfaces: Range | null
  sawFrontmatter: boolean
  sawTicketKey: boolean
  sectionRanges: Map<string, Range>
  sectionHasContent: Map<string, boolean>
  headings: Map<string, number>
  allowedHeadingSeen: number
  entries: EntryRecord[]
  forbiddenParagraphSeen: number
}

/**
 * The `**Forbidden surfaces (exact):**` paragraph (OQ-2 corpus convention,
 * Step-0 flag C mapping): items split on `;` outside parentheses; entries
 * annotated `frozen` map to frozenSurfaces, all others to forbiddenSurfaces.
 * One walk of the paragraph remainder (counted 1x as part of the section-split
 * phase's structural walk).
 */
function scanForbiddenParagraph(
  text: string,
  start: number,
  end: number,
  result: ScanResult,
  nextIndex: () => number,
): void {
  let depth = 0
  let itemStart = start
  const closeItem = (itemEnd: number) => {
    let cursor = itemStart
    while (cursor < itemEnd && isLineSpace(text.charCodeAt(cursor))) cursor += 1
    if (cursor >= itemEnd) return
    if (text.charCodeAt(cursor) !== 0x60) return // prose commentary item — not an entry
    const tokenEnd = text.indexOf('`', cursor + 1)
    const record: EntryRecord = {
      range: { start: cursor + 1, end: tokenEnd < 0 || tokenEnd > itemEnd ? itemEnd : tokenEnd },
      list: 'negative',
      frozen: false,
      index: nextIndex(),
      junkLine: tokenEnd < 0 || tokenEnd > itemEnd,
    }
    if (!record.junkLine) {
      for (let k = tokenEnd + 1; k + 5 < itemEnd; k += 1) {
        if (text.charCodeAt(k) === 0x66 && text.startsWith('rozen', k + 1)) {
          record.frozen = true
          break
        }
      }
    }
    result.entries.push(record)
  }
  for (let i = start; i < end; i += 1) {
    const unit = text.charCodeAt(i)
    if (unit === 0x28) depth += 1
    else if (unit === 0x29) depth = depth > 0 ? depth - 1 : 0
    else if (unit === 0x3b && depth === 0) {
      closeItem(i)
      itemStart = i + 1
    }
  }
  closeItem(end)
}

/**
 * Phase 1 — section split. One scan of every input byte (counted 1x): line
 * boundaries, frontmatter ranges, heading map, `## Allowed Files` region, and
 * entry content ranges (bullet markers and the forbidden-surface paragraph).
 */
function scanStructure(text: string, stats: ParseStats): ScanResult {
  const result: ScanResult = {
    ticket: null,
    surfaces: null,
    sawFrontmatter: false,
    sawTicketKey: false,
    sectionRanges: new Map(),
    sectionHasContent: new Map(),
    headings: new Map(),
    allowedHeadingSeen: 0,
    entries: [],
    forbiddenParagraphSeen: 0,
  }
  let pos = 0
  let frontmatterEnd = -1
  let currentSection: string | null = null
  let inAllowed = false
  let allowedIndex = 0
  let negativeIndex = 0
  while (pos <= text.length) {
    let eol = text.indexOf('\n', pos)
    if (eol < 0) eol = text.length
    let lineEnd = eol
    if (lineEnd > pos && text.charCodeAt(lineEnd - 1) === 0x0d) lineEnd -= 1
    // The boundary scan is phase 1's single counted examination of these
    // bytes, line terminators included (the scan locates them).
    for (let i = pos; i < lineEnd; ) {
      const step = utf8CostAt(text, i)
      stats.bytesExamined += step.cost
      i += step.width
    }
    if (eol < text.length) {
      stats.bytesExamined += eol - lineEnd + 1
    }
    const lineStart = pos
    const len = lineEnd - lineStart

    if (frontmatterEnd < 0) {
      if (!result.sawFrontmatter) {
        if (len === 3 && text.startsWith('---', lineStart)) {
          result.sawFrontmatter = true
        } else if (len > 0) {
          frontmatterEnd = lineStart
        }
        pos = eol + 1
        continue
      }
      if (len === 3 && text.startsWith('---', lineStart)) {
        frontmatterEnd = lineEnd
        pos = eol + 1
        continue
      }
      for (const key of ['ticket:', 'surfaces:'] as const) {
        if (!text.startsWith(key, lineStart)) continue
        let valueStart = lineStart + key.length
        while (valueStart < lineEnd && isLineSpace(text.charCodeAt(valueStart))) valueStart += 1
        let valueEnd = lineEnd
        while (valueEnd > valueStart && isLineSpace(text.charCodeAt(valueEnd - 1))) valueEnd -= 1
        if (key === 'ticket:') {
          result.sawTicketKey = true
          result.ticket = { start: valueStart, end: valueEnd }
        } else {
          result.surfaces = { start: valueStart, end: valueEnd }
        }
      }
      pos = eol + 1
      continue
    }

    if (len >= 3 && text.startsWith('## ', lineStart) && text.charCodeAt(lineStart + 3) !== 0x23) {
      const titleStart = lineStart + 3
      let titleEnd = lineEnd
      while (titleEnd > titleStart && isLineSpace(text.charCodeAt(titleEnd - 1))) titleEnd -= 1
      const title = text.slice(titleStart, titleEnd)
      result.headings.set(title, (result.headings.get(title) ?? 0) + 1)
      const prev = currentSection ? result.sectionRanges.get(currentSection) : undefined
      if (prev) prev.end = lineStart
      currentSection = title
      result.sectionRanges.set(title, { start: lineEnd + 1, end: text.length })
      result.sectionHasContent.set(title, false)
      inAllowed = title === 'Allowed Files'
      if (inAllowed) result.allowedHeadingSeen += 1
      pos = eol + 1
      continue
    }
    if (currentSection !== null && !result.sectionHasContent.get(currentSection)) {
      for (let i = lineStart; i < lineEnd; i += 1) {
        const unit = text.charCodeAt(i)
        if (!isLineSpace(unit) && unit !== 0x0d && unit !== 0x0a) {
          result.sectionHasContent.set(currentSection, true)
          break
        }
      }
    }
    if (inAllowed) {
      let cursor = lineStart
      while (cursor < lineEnd && isLineSpace(text.charCodeAt(cursor))) cursor += 1
      if (cursor < lineEnd) {
        if (text.startsWith(FORBIDDEN_PARAGRAPH, cursor)) {
          result.forbiddenParagraphSeen += 1
          const captureIndex = () => {
            const index = negativeIndex
            negativeIndex += 1
            return index
          }
          scanForbiddenParagraph(
            text,
            cursor + FORBIDDEN_PARAGRAPH.length,
            lineEnd,
            result,
            captureIndex,
          )
        } else if (
          text.charCodeAt(cursor) === 0x2d &&
          (cursor + 1 === lineEnd || text.charCodeAt(cursor + 1) === 0x20)
        ) {
          const contentStart =
            cursor + 1 < lineEnd && text.charCodeAt(cursor + 1) === 0x20 ? cursor + 2 : cursor + 1
          result.entries.push({
            range: { start: contentStart, end: lineEnd },
            list: 'allowed',
            frozen: false,
            index: allowedIndex,
            junkLine: false,
          })
          allowedIndex += 1
        } else {
          result.entries.push({
            range: { start: cursor, end: lineEnd },
            list: 'allowed',
            frozen: false,
            index: allowedIndex,
            junkLine: true,
          })
          allowedIndex += 1
        }
      }
    }
    pos = eol + 1
  }
  const last = currentSection ? result.sectionRanges.get(currentSection) : undefined
  if (last) last.end = text.length
  return result
}

function entryListName(record: EntryRecord): EntryListName {
  return record.list === 'allowed' ? 'allowed' : record.frozen ? 'frozen' : 'forbidden'
}

/** Entry-level lex and shape checks (precedence steps 2–7): one walk (counted 1x). */
function lexEntryChecks(
  text: string,
  record: EntryRecord,
  stats: ParseStats,
): ScopeCompileError | null {
  const { start, end } = record.range
  const list = entryListName(record)
  const fail = (code: ConstructorParameters<typeof ScopeCompileError>[0], message: string) =>
    new ScopeCompileError(code, message, { entryIndex: record.index, entryList: list })
  if (record.junkLine) {
    for (let i = start; i < end; ) {
      const step = utf8CostAt(text, i)
      stats.bytesExamined += step.cost
      i += step.width
    }
    return fail('MALFORMED_ENTRY', 'non-bullet junk line in Allowed Files')
  }

  let effectiveEnd = end
  const suffixAllowed = record.list === 'negative' && end - start >= 3
  if (suffixAllowed && text.startsWith('/**', end - 3)) effectiveEnd = end - 3

  let hasBacktick = false
  let startsWithDoubleStar = false
  let uriSchemeStart = false
  let allWhitespace = true
  let startsWhitespace = false
  let hasNull = false
  let hasControl = false
  let hasFormat = false
  let hasLoneSurrogate = false
  let hasEncodedEscape = false
  let startsWithSlash = false
  let startsWithBackslash = false
  let startsWithDoubleSlash = false
  let drivePrefix = false
  let hasBackslash = false
  let hasGlob = false
  let byteTotal = 0
  let first = true
  let schemeUnits = 0
  for (let i = start; i < effectiveEnd; ) {
    const step = utf8CostAt(text, i)
    byteTotal += step.cost
    const unit = text.charCodeAt(i)
    const cp = step.width === 2 ? (text.codePointAt(i) ?? 0) : unit
    if (!isLineSpace(unit) && unit !== 0x0d && unit !== 0x0a) allWhitespace = false
    if (first) {
      startsWhitespace = isLineSpace(unit) || unit === 0x0d || unit === 0x0a
      startsWithSlash = unit === 0x2f
      startsWithBackslash = unit === 0x5c
      startsWithDoubleStar =
        unit === 0x2a && effectiveEnd - start > 1 && text.charCodeAt(i + 1) === 0x2a
      startsWithDoubleSlash =
        unit === 0x2f && effectiveEnd - start > 1 && text.charCodeAt(i + 1) === 0x2f
      drivePrefix =
        effectiveEnd - start > 1 &&
        ((unit >= 0x41 && unit <= 0x5a) || (unit >= 0x61 && unit <= 0x7a)) &&
        text.charCodeAt(i + 1) === 0x3a
      first = false
    }
    if (unit === 0x60) hasBacktick = true
    if (unit === 0x00) hasNull = true
    else if ((unit >= 0x01 && unit <= 0x1f) || unit === 0x7f) hasControl = true
    if (cp >= 0xd800 && cp <= 0xdfff && step.width === 1) hasLoneSurrogate = true
    if (!hasFormat && cp > 0x7f && FORMAT_CHAR.test(String.fromCodePoint(cp))) hasFormat = true
    if (unit === 0x25 && i + 2 < effectiveEnd) {
      if (isHexUnit(text.charCodeAt(i + 1)) && isHexUnit(text.charCodeAt(i + 2))) {
        hasEncodedEscape = true
      }
    }
    if (unit === 0x5c) hasBackslash = true
    if (
      unit === 0x2a ||
      unit === 0x3f ||
      unit === 0x5b ||
      unit === 0x5d ||
      unit === 0x7b ||
      unit === 0x7d
    ) {
      hasGlob = true
    }
    // URI-scheme shape: 2+ scheme chars then '://' at entry start.
    if (schemeUnits >= 0 && i - start === schemeUnits) {
      const isLetter = (unit >= 0x41 && unit <= 0x5a) || (unit >= 0x61 && unit <= 0x7a)
      const isSchemeChar =
        isLetter ||
        (schemeUnits > 0 &&
          ((unit >= 0x30 && unit <= 0x39) || unit === 0x2b || unit === 0x2d || unit === 0x2e))
      if (schemeUnits === 0 && !isLetter) schemeUnits = -1
      else if (isSchemeChar) schemeUnits += 1
      else if (unit === 0x3a && schemeUnits >= 2 && text.startsWith('//', i + 1)) {
        uriSchemeStart = true
        schemeUnits = -1
      } else schemeUnits = -1
    }
    i += step.width
  }
  if (suffixAllowed) {
    for (let i = effectiveEnd; i < end; ) {
      const step = utf8CostAt(text, i)
      byteTotal += step.cost
      i += step.width
    }
  }
  stats.bytesExamined += byteTotal

  // Step 2 — entry line shape.
  if (hasBacktick || startsWithDoubleStar || uriSchemeStart) {
    return fail('MALFORMED_ENTRY', 'markdown/URI junk in entry')
  }
  if (effectiveEnd === start) return fail('ENTRY_EMPTY', 'empty entry')
  if (allWhitespace || startsWhitespace) return fail('ENTRY_WHITESPACE', 'whitespace entry')
  // Step 3 — charset, category order per the chain.
  if (hasNull) return fail('ENTRY_NULL_BYTE', 'null byte in entry')
  if (hasControl) return fail('ENTRY_CONTROL_CHAR', 'control character in entry')
  if (hasFormat) return fail('ENTRY_FORMAT_CHAR', 'format character in entry')
  if (hasLoneSurrogate) return fail('ENTRY_UNPAIRED_SURROGATE', 'unpaired surrogate in entry')
  // Step 4 — encoded escape.
  if (hasEncodedEscape) return fail('ENTRY_ENCODED_ESCAPE', 'percent-encoded escape in entry')
  // Step 5 — absolute forms.
  if (startsWithSlash || startsWithBackslash || startsWithDoubleSlash || drivePrefix) {
    return fail('ENTRY_ABSOLUTE', 'absolute path form in entry')
  }
  // Step 6 — backslash separator.
  if (hasBackslash) return fail('ENTRY_BACKSLASH', 'backslash separator in entry')
  // Step 7 — glob metacharacters.
  if (hasGlob) return fail('GLOB_ENTRY', 'glob metacharacter in entry')
  return null
}

/**
 * Per-segment validation (step 8) and entry-level caps (step 9) in one fused
 * walk (counted 1x): separator detection and segment checks share the pass.
 */
function segmentChecks(
  text: string,
  record: EntryRecord,
  stats: ParseStats,
): ScopeCompileError | null {
  const { start, end } = record.range
  let effectiveEnd = end
  if (record.list === 'negative' && end - start >= 3 && text.startsWith('/**', end - 3)) {
    effectiveEnd = end - 3
  }
  const list = entryListName(record)
  const fail = (code: ConstructorParameters<typeof ScopeCompileError>[0], message: string) =>
    new ScopeCompileError(code, message, { entryIndex: record.index, entryList: list })

  let segmentCount = 0
  let byteTotal = 0
  let segStart = start
  let segBytes = 0
  let firstFailing: ScopeCompileError | null = null
  const checkSegment = (from: number, to: number, bytes: number) => {
    segmentCount += 1
    byteTotal += bytes
    if (firstFailing) return
    const seg = text.slice(from, to)
    if (seg === '.' || seg === '..') {
      firstFailing = fail('PATH_TRAVERSAL', 'dot segment')
      return
    }
    if (seg.length === 0) {
      firstFailing = fail('ENTRY_EMPTY_SEGMENT', 'empty segment')
      return
    }
    if (seg.includes(':')) {
      firstFailing = fail('ENTRY_ADS_COLON', 'colon in segment')
      return
    }
    const tilde = seg.indexOf('~')
    if (tilde >= 0 && tilde + 1 < seg.length) {
      const after = seg.charCodeAt(tilde + 1)
      if (after >= 0x30 && after <= 0x39) {
        firstFailing = fail('ENTRY_SHORT_NAME', '8.3 short-name segment')
        return
      }
    }
    const dot = seg.indexOf('.')
    const base = (dot >= 0 ? seg.slice(0, dot) : seg).toUpperCase()
    if (RESERVED_NAMES[base] === true) {
      firstFailing = fail('ENTRY_RESERVED_NAME', 'reserved device name segment')
      return
    }
    const lastUnit = seg.charCodeAt(seg.length - 1)
    if (lastUnit === 0x2e || lastUnit === 0x20) {
      firstFailing = fail('ENTRY_TRAILING_DOT_SPACE', 'trailing dot or space in segment')
      return
    }
    if (bytes > SEGMENT_BYTE_CAP) {
      firstFailing = fail('SEGMENT_TOO_LONG', 'segment exceeds 128 bytes')
      return
    }
    // ENTRY_NON_NFC targets decomposed (NFD-form) input — the UNI-01/EQUIV-02
    // shape. Single code points with a canonical decomposition (U+212A KELVIN
    // SIGN vs `k`) are the equivalence-collision machinery's job at step 11
    // (EQUIV-07), where case folding is used for collision detection only.
    if (seg.normalize('NFD') === seg && seg.normalize('NFC') !== seg) {
      firstFailing = fail('ENTRY_NON_NFC', 'segment in decomposed (NFD) form')
    }
  }
  for (let i = start; i < effectiveEnd; ) {
    const step = utf8CostAt(text, i)
    const unit = text.charCodeAt(i)
    if (unit === 0x2f) {
      byteTotal += step.cost
      checkSegment(segStart, i, segBytes)
      segStart = i + step.width
      segBytes = 0
    } else {
      segBytes += step.cost
    }
    i += step.width
  }
  checkSegment(segStart, effectiveEnd, segBytes)
  for (let i = effectiveEnd; i < end; ) {
    const step = utf8CostAt(text, i)
    byteTotal += step.cost
    i += step.width
  }
  stats.bytesExamined += byteTotal
  if (firstFailing) return firstFailing
  // Step 9 — entry level. Segment-count before byte-length: LIMIT-04 (10k
  // segments) fires TOO_MANY_SEGMENTS even though the entry also exceeds 512
  // bytes (LIMIT-02 is the few-segment long-entry shape).
  if (segmentCount > MAX_SEGMENTS) return fail('TOO_MANY_SEGMENTS', 'more than 64 segments')
  if (byteTotal > ENTRY_BYTE_CAP) return fail('ENTRY_TOO_LONG', 'entry exceeds 512 bytes')
  return null
}

/**
 * Canonicalization (phase 4): the exact-spelling copy — no Unicode
 * normalization, no path case folding. Output construction of already-decided
 * bytes: zero additional examinations. The `/**` directory-scope suffix
 * (negative lists only) is part of the canonical spelling.
 */
function canonicalizeEntry(text: string, record: EntryRecord): string {
  return text.slice(record.range.start, record.range.end)
}

function crossEntryChecks(allowed: string[], negative: string[]): ScopeCompileError | null {
  const scanUnique = (items: string[], list: EntryListName) => {
    const exact = new Map<string, number>()
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i] ?? ''
      const prev = exact.get(item)
      if (prev !== undefined) {
        return new ScopeCompileError('ENTRY_DUPLICATE', `duplicate entry (first at ${prev})`, {
          entryIndex: i,
          entryList: list,
        })
      }
      exact.set(item, i)
    }
    return null
  }
  const dupAllowed = scanUnique(allowed, 'allowed')
  if (dupAllowed) return dupAllowed
  const dupNegative = scanUnique(negative, 'forbidden')
  if (dupNegative) return dupNegative

  const scanEquivalent = (items: string[], list: EntryListName) => {
    const folded = new Map<string, number>()
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i] ?? ''
      const key = item.toLowerCase()
      const prev = folded.get(key)
      if (prev !== undefined) {
        return new ScopeCompileError('ENTRY_EQUIVALENT', `equivalent entry (first at ${prev})`, {
          entryIndex: i,
          entryList: list,
        })
      }
      folded.set(key, i)
    }
    return null
  }
  const equivAllowed = scanEquivalent(allowed, 'allowed')
  if (equivAllowed) return equivAllowed
  return scanEquivalent(negative, 'forbidden')
}

function conflictCheck(allowed: string[], negative: string[]): ScopeCompileError | null {
  for (let i = 0; i < allowed.length; i += 1) {
    const entry = allowed[i] ?? ''
    for (const scope of negative) {
      const scoped = scope.endsWith('/**')
      const base = scoped ? scope.slice(0, -3) : scope
      if (entry === scope || entry === base || (scoped && entry.startsWith(`${base}/`))) {
        return new ScopeCompileError(
          'ENTRY_CONFLICTS_WITH_FORBIDDEN',
          `entry overlaps declared negative surface ${scope}`,
          { entryIndex: i, entryList: 'allowed' },
        )
      }
    }
  }
  return null
}

/**
 * Parses and validates a spec body. Throws {@link ScopeCompileError} with
 * exactly one registry code on the first failing check of the first failing
 * entry (body order); no partial parse result is ever returned on rejection.
 */
export function parseSpec(input: string | Uint8Array, stats: ParseStats): ParsedSpec {
  let text: string
  if (typeof input === 'string') {
    text = input
  } else {
    try {
      text = new TextDecoder('utf-8', { fatal: true }).decode(input)
    } catch {
      throw new ScopeCompileError('BODY_NOT_UTF8', 'spec body does not decode as UTF-8')
    }
  }
  const totalBytes = typeof input === 'string' ? utf8ByteLength(text) : input.length
  if (totalBytes > BODY_BYTE_CAP) {
    throw new ScopeCompileError('BODY_TOO_LARGE', 'spec body exceeds 1 MiB')
  }

  const scan = scanStructure(text, stats)

  // Document level: frontmatter and required sections, then authority presence.
  if (!scan.sawFrontmatter || !scan.sawTicketKey || scan.ticket === null) {
    throw new ScopeCompileError('SPEC_SECTION_MISSING', 'YAML frontmatter with ticket: is required')
  }
  for (const [title, count] of scan.headings) {
    if (count > 1) {
      throw new ScopeCompileError('SPEC_SECTION_DUPLICATE', `duplicated section heading: ${title}`)
    }
  }
  if (scan.forbiddenParagraphSeen > 1) {
    throw new ScopeCompileError(
      'SPEC_SECTION_DUPLICATE',
      'duplicated **Forbidden surfaces (exact):** paragraph',
    )
  }
  const ticket = text.slice(scan.ticket.start, scan.ticket.end)
  if (ticket.length === 0) {
    throw new ScopeCompileError('SPEC_SECTION_EMPTY', 'frontmatter ticket: is empty')
  }
  const sectionText = new Map<string, string>()
  for (const title of REQUIRED_SECTIONS) {
    const range = scan.sectionRanges.get(title)
    if (!range) {
      throw new ScopeCompileError('SPEC_SECTION_MISSING', `missing required section: ${title}`)
    }
    if (!scan.sectionHasContent.get(title)) {
      throw new ScopeCompileError('SPEC_SECTION_EMPTY', `empty required section: ${title}`)
    }
    sectionText.set(title, text.slice(range.start, range.end))
  }
  if (scan.allowedHeadingSeen === 0) {
    throw new ScopeCompileError('MISSING_AUTHORITY', 'missing ## Allowed Files section')
  }

  // Entry-major validation (precedence steps 2–9) in body order.
  const allowed: string[] = []
  const negative: Array<{ text: string; frozen: boolean }> = []
  for (const record of scan.entries) {
    stats.entriesExamined += 1
    const lexed = lexEntryChecks(text, record, stats)
    if (lexed) throw lexed
    const segmented = segmentChecks(text, record, stats)
    if (segmented) throw segmented
    const canonical = canonicalizeEntry(text, record)
    if (record.list === 'allowed') allowed.push(canonical)
    else negative.push({ text: canonical, frozen: record.frozen })
  }

  // Body-level count caps (step 10).
  if (allowed.length > MAX_ENTRIES) {
    throw new ScopeCompileError('TOO_MANY_ENTRIES', 'more than 256 Allowed Files entries')
  }
  if (negative.length > MAX_ENTRIES) {
    throw new ScopeCompileError('TOO_MANY_ENTRIES', 'more than 256 negative-surface entries')
  }

  // Cross-entry (step 11): duplicates, equivalents, then allow/deny conflicts.
  const negativeTexts = negative.map((n) => n.text)
  const cross = crossEntryChecks(allowed, negativeTexts)
  if (cross) throw cross
  const conflict = conflictCheck(allowed, negativeTexts)
  if (conflict) throw conflict

  let surfaces: string | null = null
  if (scan.surfaces) {
    surfaces = text.slice(scan.surfaces.start, scan.surfaces.end)
  }
  return {
    ticket,
    surfaces,
    sections: {
      intent: sectionText.get('Intent') ?? '',
      constraints: sectionText.get('Constraints') ?? '',
      acceptanceCriteria: sectionText.get('Acceptance Criteria') ?? '',
      outOfScope: sectionText.get('Out of Scope') ?? '',
      contextReferences: sectionText.get('Context & References') ?? '',
    },
    allowedFiles: allowed,
    frozenSurfaces: negative.filter((n) => n.frozen).map((n) => n.text),
    forbiddenSurfaces: negative.filter((n) => !n.frozen).map((n) => n.text),
    stats,
  }
}
