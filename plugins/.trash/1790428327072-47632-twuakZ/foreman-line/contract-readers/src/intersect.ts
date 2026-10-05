/**
 * The D42 refusal predicate (Constraint 1 / AC3): true iff two touch sets
 * share at least one file, by exact repository-relative path equality after
 * normalizing path separators (a Windows-backslash and a POSIX-forward-slash
 * rendering of the same path are one identity).
 *
 * This function has no caller in this parcel — P2 ships the predicate only;
 * wiring it into any scheduler/dispatch decision is P3's work (out of scope
 * here, and a stop condition if reached into).
 */
import { normalizeSeparators } from './touch-set.js'
import type { TouchSet } from './types.js'

export function intersects(
  touchSetA: Pick<TouchSet, 'files'>,
  touchSetB: Pick<TouchSet, 'files'>,
): boolean {
  const normalizedA = new Set(touchSetA.files.map(normalizeSeparators))
  for (const file of touchSetB.files) {
    if (normalizedA.has(normalizeSeparators(file))) {
      return true
    }
  }
  return false
}
