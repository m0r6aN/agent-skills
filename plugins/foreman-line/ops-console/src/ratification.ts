import type { GoalRatification, Locator, RatificationEvidence } from './types.js'

/**
 * TO-P1 conservative current ratification reader (accepted RAT/ATT).
 *
 * Bounded, pure, linear lexer over selected-tree `charter.md` and
 * `loop-directive.md` only. Zero link recursion: quoted, fenced,
 * blockquoted, table, historical/archive/example/instruction/superseded, and
 * linked-only text never becomes current evidence. This is a read-only
 * proxy, never an authenticated-authority claim.
 */

export interface RatificationSource {
  readonly source: 'charter' | 'loop-directive'
  readonly locator: Locator
  /** null when the source could not be read (missing/unreadable). */
  readonly text: string | null
}

interface Line {
  /** One-based line number in the ORIGINAL source (identity preserved). */
  readonly num: number
  readonly raw: string
}

interface Ctx {
  readonly source: 'charter' | 'loop-directive'
  readonly locator: Locator
  excludedUntilLevel: number | null
  historicalNote: boolean
  inFence: string | null
  /** null until the first eligible top-metadata `Status:` record. */
  topMetadataSeen: { granted: boolean } | null
  inBHeading: boolean
}

const HEADING = /^(#{1,6})\s+(.*)$/
const EXCLUDED_HEADING_WORD =
  /\b(historical|archive|archived|example|examples|instruction|instructions|superseded)\b/i
const B_HEADING = /^\s*(gate 1 record|gates and standing authorizations)\s*(?:[-\u2013\u2014].*)?$/i
const HISTORICAL_NOTE = /^\s*historical[- ]note\s*(?:$|[:\-\u2013\u2014])/i
const POSITIVE_A = /^(ratified|fully ratified)\b/i
const NEGATIVE = /^(pending|draft|unratified|not ratified|not granted)\b/i
const POSITIVE_B = /^(granted|ratified)\b/i
const QUALIFIER = /\b(if|provided|conditional|conditionally)\b/i
const REVOCATION =
  /\b(revoked|rescinded|withdrawn|superseded|replaced|no longer (?:in force|valid|granted|ratified))\b/i
const UNRESOLVED = /\b(unresolved|under review|disputed|re-?opened?)\b/i

function stripBalancedBold(lines: readonly Line[]): Line[] {
  // Remove balanced `**` delimiters (including multiline value emphasis),
  // preserving text and exact line identity; unmatched emphasis is unsupported.
  let open = false
  return lines.map((line) => {
    let out = ''
    for (let i = 0; i < line.raw.length; i++) {
      if (line.raw[i] === '*' && line.raw[i + 1] === '*') {
        open = !open
        i += 1
        continue
      }
      out += line.raw[i]
    }
    return { num: line.num, raw: out }
  })
}

function hasUnmatchedBold(text: string): boolean {
  let open = false
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '*' && text[i + 1] === '*') {
      open = !open
      i += 1
    }
  }
  return open
}

function stripLinkSpans(text: string): string {
  // Linked-only evidence confers nothing: blank out inline link/image spans
  // so their label text can never supply a token.
  return text.replace(/!?\[[^\]]*\]\([^)]*\)/g, ' ')
}

function leadingValue(text: string): string {
  return stripLinkSpans(text)
    .replace(/^["'`]+/, '')
    .trimStart()
}

/** Anchored standalone `Status:` or `Gate 1:` record (optional bullet/bold lead). */
function recordMatch(
  text: string,
): { label: 'Status' | 'Gate 1'; value: string; rest: string } | null {
  const m = /^(?:[-*+]\s+)?\s*(Status|Gate 1)\s*:\s*(.*)$/i.exec(text.trim())
  if (m === null) return null
  const raw = m[2] ?? ''
  return {
    label: m[1] === 'Status' || m[1]?.toLowerCase() === 'status' ? 'Status' : 'Gate 1',
    value: leadingValue(raw),
    rest: raw,
  }
}

function evidence(
  ctx: Ctx,
  line: number | null,
  kind: RatificationEvidence['kind'],
  detail: string,
): RatificationEvidence {
  return { source: ctx.source, locator: ctx.locator, line, kind, detail }
}

function scanSource(lines: readonly Line[], ctx: Ctx, out: RatificationEvidence[]): void {
  const normalized = stripBalancedBold(lines)
  for (let i = 0; i < normalized.length; i++) {
    const line = normalized[i]
    if (line === undefined) continue
    const rawOriginal = lines[i]?.raw ?? ''
    const text = line.raw
    const trimmed = text.trim()

    // Fences (``` or ~~~) exclude everything until the matching close.
    const fence = /^\s*(`{3,}|~{3,})/.exec(text)
    if (fence !== null) {
      const marker = fence[1] ?? ''
      if (ctx.inFence === null) {
        ctx.inFence = marker
      } else if (marker.startsWith(ctx.inFence[0] ?? '`') && marker.length >= ctx.inFence.length) {
        ctx.inFence = null
      }
      continue
    }
    if (ctx.inFence !== null) continue

    // Headings: reset historical-note suppression, manage section exclusions
    // (until a heading of equal/higher level) and B-heading lifetime.
    const heading = HEADING.exec(text)
    if (heading !== null) {
      const level = (heading[1] ?? '').length
      const title = (heading[2] ?? '').trim()
      ctx.historicalNote = false
      if (ctx.excludedUntilLevel !== null && level <= ctx.excludedUntilLevel) {
        ctx.excludedUntilLevel = null
      }
      if (EXCLUDED_HEADING_WORD.test(title)) ctx.excludedUntilLevel = level
      ctx.inBHeading = B_HEADING.test(title.replace(/\*\*/g, ''))
      continue
    }
    if (ctx.excludedUntilLevel !== null) continue

    // Blockquotes and tables never become current evidence.
    if (/^\s*>/.test(text) || /^\s*\|/.test(text)) continue

    // Standalone historical-note marker suppresses following records until
    // the next heading (bold already normalized).
    if (HISTORICAL_NOTE.test(text)) {
      ctx.historicalNote = true
      continue
    }
    if (ctx.historicalNote) continue

    const rec = recordMatch(text)
    if (rec === null) continue

    // Unmatched emphasis on the record line is unsupported.
    if (hasUnmatchedBold(rawOriginal)) {
      out.push(evidence(ctx, line.num, 'unsupported', `unmatched emphasis on ${rec.label} record`))
      continue
    }

    if (rec.label === 'Status') {
      // Dialect A positive: first eligible top-metadata Status before the
      // first level-two heading; only that record can establish a grant.
      const beforeH2 = ctx.topMetadataSeen === null
      if (beforeH2) {
        if (POSITIVE_A.test(rec.value)) {
          const restAfter = rec.value.replace(POSITIVE_A, '')
          if (
            QUALIFIER.test(restAfter) ||
            REVOCATION.test(restAfter) ||
            UNRESOLVED.test(restAfter)
          ) {
            ctx.topMetadataSeen = { granted: false }
            out.push(
              evidence(
                ctx,
                line.num,
                'unsupported',
                `conditional/unresolved top-metadata grant: ${trimmed}`,
              ),
            )
            continue
          }
          ctx.topMetadataSeen = { granted: true }
          out.push(evidence(ctx, line.num, 'grant', `top-metadata Status RATIFIED: ${trimmed}`))
          continue
        }
        if (NEGATIVE.test(rec.value)) {
          ctx.topMetadataSeen = { granted: false }
          out.push(evidence(ctx, line.num, 'denial', `top-metadata Status negative: ${trimmed}`))
          continue
        }
        // First metadata record is unsupported: eligibility is consumed.
        ctx.topMetadataSeen = { granted: false }
        out.push(
          evidence(ctx, line.num, 'unsupported', `unsupported top-metadata Status: ${trimmed}`),
        )
        continue
      }
      // Current anchored Status negative record, any eligible position.
      if (NEGATIVE.test(rec.value)) {
        out.push(evidence(ctx, line.num, 'denial', `current Status denial: ${trimmed}`))
      }
      continue
    }

    // Gate 1 records.
    if (POSITIVE_B.test(rec.value)) {
      if (ctx.inBHeading) {
        const restAfter = rec.value.replace(POSITIVE_B, '')
        if (QUALIFIER.test(restAfter) || REVOCATION.test(restAfter) || UNRESOLVED.test(restAfter)) {
          out.push(
            evidence(
              ctx,
              line.num,
              'unsupported',
              `conditional/unresolved Gate 1 grant: ${trimmed}`,
            ),
          )
        } else {
          out.push(evidence(ctx, line.num, 'grant', `Gate 1 record GRANTED/RATIFIED: ${trimmed}`))
        }
      } else {
        out.push(
          evidence(
            ctx,
            line.num,
            'unsupported',
            `Gate 1 grant outside an exact Gate 1 record heading: ${trimmed}`,
          ),
        )
      }
      continue
    }
    if (NEGATIVE.test(rec.value)) {
      out.push(evidence(ctx, line.num, 'denial', `current Gate 1 denial: ${trimmed}`))
      continue
    }
    // Standalone current goal-Gate-1 revocation/supersession text: unknown.
    if (REVOCATION.test(rec.value) || UNRESOLVED.test(rec.value)) {
      out.push(
        evidence(
          ctx,
          line.num,
          'unsupported',
          `current Gate 1 revocation/supersession: ${trimmed}`,
        ),
      )
    }
  }
}

export interface RatificationResult {
  readonly ratification: GoalRatification
  readonly evidence: readonly RatificationEvidence[]
}

export function readRatification(sources: readonly RatificationSource[]): RatificationResult {
  const evidence: RatificationEvidence[] = []
  for (const src of sources) {
    if (src.text === null) {
      evidence.push({
        source: src.source,
        locator: src.locator,
        line: null,
        kind: src.source === 'charter' ? 'missing' : 'unreadable',
        detail: `${src.source} source missing or unreadable at ${src.locator.relativePath}; ratification cannot be reconciled`,
      })
      continue
    }
    const lines: Line[] = src.text.split(/\r?\n/).map((raw, i) => ({ num: i + 1, raw }))
    const ctx: Ctx = {
      source: src.source,
      locator: src.locator,
      excludedUntilLevel: null,
      historicalNote: false,
      inFence: null,
      topMetadataSeen: null,
      inBHeading: false,
    }
    scanSource(lines, ctx, evidence)
  }

  const grants = evidence.filter((item) => item.kind === 'grant')
  const denials = evidence.filter((item) => item.kind === 'denial')
  const unsupported = evidence.filter((item) => item.kind === 'unsupported')
  const missing = evidence.filter((item) => item.kind === 'missing' || item.kind === 'unreadable')

  if (grants.length > 0 && (denials.length > 0 || unsupported.length > 0)) {
    return {
      ratification: {
        status: 'unknown',
        detail: `conflicting current ratification evidence: ${grants.length} grant(s), ${denials.length} denial(s), ${unsupported.length} unsupported record(s)`,
      },
      evidence,
    }
  }
  if (grants.length > 0) {
    return {
      ratification: { status: 'granted', detail: grants[0]?.detail ?? 'granted' },
      evidence,
    }
  }
  if (denials.length > 0 && unsupported.length === 0 && missing.length === 0) {
    return {
      ratification: { status: 'pending', detail: denials[0]?.detail ?? 'pending' },
      evidence,
    }
  }
  const reasons: string[] = []
  if (denials.length > 0) reasons.push(`${denials.length} denial(s)`)
  if (unsupported.length > 0) reasons.push(`${unsupported.length} unsupported record(s)`)
  if (missing.length > 0) reasons.push('missing/unreadable source(s)')
  return {
    ratification: {
      status: 'unknown',
      detail:
        reasons.length === 0
          ? 'no supported current Gate 1 ratification evidence in goal sources'
          : `no trustworthy current grant: ${reasons.join(', ')}`,
    },
    evidence,
  }
}
