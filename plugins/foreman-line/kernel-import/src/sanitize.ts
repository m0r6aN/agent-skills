/**
 * T6 rule 4 — the deterministic Markdown sanitizer (standing #31) in linear
 * time (standing #19).
 *
 * PINNED SEMANTICS — `sanitizeForMarkdown` is TOTAL (never throws) and pure:
 *  1. every CR (U+000D) is removed;
 *  2. each run of one or more LF (U+000A) collapses to one space (U+0020);
 *  3. each control char U+0000–U+001F remaining after rules 1–2, U+007F, each
 *     format/bidi char (U+200B, U+200E, U+200F, U+202A–U+202E, U+FEFF), and
 *     each unpaired surrogate (lone high or low) becomes U+FFFD;
 *  4. Markdown structural delimiters escape deterministically: every backtick
 *     becomes backslash+backtick, every `|` becomes `\|`, every `<` becomes
 *     `\<`, every `>` becomes `\>` (HTML-ish payloads render inert);
 *  5. the single line start (newlines are already collapsed) escapes its
 *     structural prefix: a leading `>` is already escaped by rule 4 and is
 *     never double-escaped; a leading `#` or `-` gets one prefixed backslash;
 *     a leading digit run followed by `.` gets that dot escaped
 *     (`12.` -> `12\.`);
 *  6. everything else passes through byte-for-byte (no Unicode normalization,
 *     no case folding).
 *
 * Linearity (#19): one bounded pass emits an array of chunks joined exactly
 * once; rule 5 touches only the output prefix. No regexes; no loop-time string
 * concatenation.
 */

const UFFFD = '\ufffd'

const DELIMITER_ESCAPES: Record<string, string> = {
  '`': '\\`',
  '|': '\\|',
  '<': '\\<',
  '>': '\\>',
}

/** Deterministic Markdown sanitizer (T6 rule 4). Total and pure. */
export function sanitizeForMarkdown(value: string): string {
  const chunks: string[] = []
  let copied = 0
  let i = 0
  while (i < value.length) {
    const unit = value.charCodeAt(i)
    if (unit === 0x0d) {
      // rule 1: CR is removed
      if (i > copied) chunks.push(value.slice(copied, i))
      copied = i + 1
      i += 1
    } else if (unit === 0x0a) {
      // rule 2: an LF run collapses to one space
      if (i > copied) chunks.push(value.slice(copied, i))
      let end = i
      while (end < value.length && value.charCodeAt(end) === 0x0a) end += 1
      chunks.push(' ')
      copied = end
      i = end
    } else if (
      // rule 3: control/format chars become U+FFFD (CR/LF already handled)
      unit <= 0x1f ||
      unit === 0x7f ||
      unit === 0x200b ||
      unit === 0x200e ||
      unit === 0x200f ||
      (unit >= 0x202a && unit <= 0x202e) ||
      unit === 0xfeff
    ) {
      if (i > copied) chunks.push(value.slice(copied, i))
      chunks.push(UFFFD)
      copied = i + 1
      i += 1
    } else if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = i + 1 < value.length ? value.charCodeAt(i + 1) : 0
      if (next >= 0xdc00 && next <= 0xdfff) {
        i += 2 // rule 6: a paired surrogate passes byte-for-byte
      } else {
        // rule 3: lone high surrogate
        if (i > copied) chunks.push(value.slice(copied, i))
        chunks.push(UFFFD)
        copied = i + 1
        i += 1
      }
    } else if (unit >= 0xdc00 && unit <= 0xdfff) {
      // rule 3: lone low surrogate
      if (i > copied) chunks.push(value.slice(copied, i))
      chunks.push(UFFFD)
      copied = i + 1
      i += 1
    } else {
      const escaped = DELIMITER_ESCAPES[value.charAt(i)]
      if (escaped === undefined) {
        i += 1 // rule 6: everything else passes through byte-for-byte
      } else {
        // rule 4: structural delimiters
        if (i > copied) chunks.push(value.slice(copied, i))
        chunks.push(escaped)
        copied = i + 1
        i += 1
      }
    }
  }
  if (value.length > copied) chunks.push(value.slice(copied))

  const flat = chunks.join('')
  // rule 5: the single line start's structural prefix (a leading `>` is
  // already escaped by rule 4 and must never be double-escaped)
  const head = flat.charCodeAt(0)
  if (head === 0x23 || head === 0x2d) return `\\${flat}`
  if (head >= 0x30 && head <= 0x39) {
    let end = 0
    while (end < flat.length && flat.charCodeAt(end) >= 0x30 && flat.charCodeAt(end) <= 0x39) {
      end += 1
    }
    if (end < flat.length && flat.charCodeAt(end) === 0x2e) {
      return `${flat.slice(0, end)}\\${flat.slice(end)}`
    }
  }
  return flat
}
