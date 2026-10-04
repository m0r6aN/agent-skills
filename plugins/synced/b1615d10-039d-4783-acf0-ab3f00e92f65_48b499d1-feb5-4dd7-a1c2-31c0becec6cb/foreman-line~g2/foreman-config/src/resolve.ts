/**
 * `involves:` → `capabilities:` resolution helper (spec AC12, charter §6.12).
 *
 * D14 IS STRUCTURAL HERE, NOT ASPIRATIONAL: this helper is pure — it never
 * writes, never throws, and returns a value on every input. There is no code
 * path by which an unknown or unresolvable `involves:` value can change an
 * exit code, raise, or gate anything, because the helper has no throw path
 * and no process access at all. Degradation is announced through an INJECTED
 * reporter (default: silent), called EXACTLY ONCE per resolution when any
 * declared capability resolves to nothing — announce-once, never twice,
 * never per-entry.
 */
import type { ForemanCapabilities, SkillName } from './types.js'

export interface InvolvesResolution {
  /** Capability → skills, for each `involves:` entry that resolves to at least one skill. */
  readonly resolved: ReadonlyMap<string, readonly SkillName[]>
  /**
   * `involves:` entries that resolve to NO skills — either no
   * `capabilities:` entry, or an entry declared with an empty array
   * (vocabulary membership without a serving skill). Both are normal,
   * non-blocking outcomes; vocabulary membership is the spec-linter's
   * independent concern (D21/D27-style separation).
   */
  readonly unresolved: readonly string[]
}

/**
 * Deterministically maps `involves:` values through a config's
 * `capabilities:` map. Duplicate `involves:` entries are collapsed
 * (first-occurrence order preserved). Zero resolution is a no-op: empty
 * `resolved`, everything in `unresolved`, one `announce` call, nothing
 * thrown, nothing blocked.
 *
 * @param announce injected degradation reporter (e.g. a stderr writer at a
 *   CLI boundary). Called exactly once, with one message naming every
 *   unresolved entry, only when at least one entry is unresolved. Defaults
 *   to a no-op so the helper is silent unless a caller opts in.
 */
export function resolveInvolves(
  involves: readonly string[],
  capabilities: ForemanCapabilities,
  announce: (message: string) => void = () => {},
): InvolvesResolution {
  const resolved = new Map<string, readonly SkillName[]>()
  const unresolved: string[] = []

  for (const entry of new Set(involves)) {
    const skills = Object.hasOwn(capabilities, entry) ? capabilities[entry] : undefined
    // A declared-but-empty entry (`telemetry: []`) resolves to no skills,
    // exactly like an undeclared one — the degradation D14 declares normal.
    // Its vocabulary-membership effect is observed separately by the linter.
    if (skills === undefined || skills.length === 0) {
      unresolved.push(entry)
    } else {
      resolved.set(entry, skills)
    }
  }

  if (unresolved.length > 0) {
    announce(
      `involves: ${unresolved.length} capability hint(s) resolved to no skills ` +
        `(${unresolved.join(', ')}) — advisory only, nothing is blocked (D14)`,
    )
  }

  return { resolved, unresolved }
}
