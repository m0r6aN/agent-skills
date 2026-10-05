/**
 * Managed-block splicing (charter D4, §4.3).
 *
 * Markers:
 *   <!-- foreman-line:begin (generated — edits inside are overwritten) -->
 *   ...
 *   <!-- foreman-line:end -->
 *
 * Absent markers: the block is appended at the end of the file, preserving
 * every existing byte. Present markers: content strictly between them is
 * replaced, preserving both sides byte-for-byte. Malformed shapes — begin
 * without end, end without begin, reversed order, nesting — refuse with a
 * typed error and write nothing: a half-marker means a human edited the
 * region, and guessing the boundary risks deleting their content.
 */
import { ScaffoldError } from './errors.js'

export const MANAGED_BEGIN =
  '<!-- foreman-line:begin (generated — edits inside are overwritten) -->'
export const MANAGED_END = '<!-- foreman-line:end -->'

export type SpliceAction = 'appended' | 'replaced' | 'unchanged'

export interface SpliceResult {
  readonly text: string
  readonly action: SpliceAction
}

function countOccurrences(haystack: string, needle: string): number {
  let count = 0
  let index = haystack.indexOf(needle)
  while (index !== -1) {
    count++
    index = haystack.indexOf(needle, index + needle.length)
  }
  return count
}

/**
 * Splices `inner` (the generated managed content, WITHOUT markers) into
 * `existing`. Returns the full new text and what had to happen to produce it.
 */
export function spliceManagedBlock(
  existing: string,
  inner: string,
  contextPath: string,
): SpliceResult {
  const begins = countOccurrences(existing, MANAGED_BEGIN)
  const ends = countOccurrences(existing, MANAGED_END)

  if (begins === 0 && ends === 0) {
    const separator = existing === '' ? '' : existing.endsWith('\n') ? '\n' : '\n\n'
    return {
      text: `${existing}${separator}${MANAGED_BEGIN}\n${inner}\n${MANAGED_END}`,
      action: 'appended',
    }
  }

  if (begins === 1 && ends === 1) {
    const beginIndex = existing.indexOf(MANAGED_BEGIN)
    const endIndex = existing.indexOf(MANAGED_END)
    if (endIndex < beginIndex) {
      throw new ScaffoldError(
        'MANAGED_BLOCK_MALFORMED',
        'managed-block markers are reversed (end precedes begin); refusing rather than guessing the region boundary',
        [contextPath],
      )
    }
    const head = existing.slice(0, beginIndex + MANAGED_BEGIN.length)
    const tail = existing.slice(endIndex)
    const text = `${head}\n${inner}\n${tail}`
    return { text, action: text === existing ? 'unchanged' : 'replaced' }
  }

  throw new ScaffoldError(
    'MANAGED_BLOCK_MALFORMED',
    `managed-block markers are malformed (${begins} begin marker(s), ${ends} end marker(s); nesting or half-markers present); refusing rather than guessing the region boundary`,
    [contextPath],
  )
}
