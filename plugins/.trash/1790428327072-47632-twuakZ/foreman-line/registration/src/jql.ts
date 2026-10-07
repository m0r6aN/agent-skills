/**
 * JQL idempotency-lookup builder (jira-integration search-first). Every scan
 * is linear-time (lesson #19): a single char-code pass rejects any token
 * carrying a character that could break out of the quoted JQL literal, so no
 * crafted stable id / project key can inject JQL. No regex over untrusted text.
 */
import { MCP_TEST_LABEL } from './gate.js'

/**
 * Reject any token containing a character outside `[A-Za-z0-9._-]` (linear
 * scan by char code). Stable ids are spec filename stems / Epic slug tokens
 * and project keys are allowlisted - all comfortably within this set; anything
 * else is refused before it reaches JQL.
 */
export function assertJqlSafeToken(token: string, label: string): void {
  if (token.length === 0) {
    throw new Error(`assertJqlSafeToken: ${label} must be non-empty`)
  }
  for (let i = 0; i < token.length; i++) {
    const c = token.charCodeAt(i)
    const ok =
      (c >= 48 && c <= 57) || // 0-9
      (c >= 65 && c <= 90) || // A-Z
      (c >= 97 && c <= 122) || // a-z
      c === 45 || // -
      c === 46 || // .
      c === 95 // _
    if (!ok) {
      throw new Error(
        `assertJqlSafeToken: ${label} ${JSON.stringify(token)} contains an unsafe character at index ${i}`,
      )
    }
  }
}

/**
 * Guard for values interpolated ONLY as quoted JQL string literals (`"..."`),
 * e.g. the dispatch-queue assignee identity (P1b). Unlike `assertJqlSafeToken`
 * this admits `:` and `@` — Atlassian account ids come in a `:`-prefixed form
 * (`557058:f58131cb-…`) and assignee emails carry `@`, both outside the token
 * allowlist. Safety inside a quoted literal instead hinges on refusing every
 * character that can terminate or escape the quotes: `"` (0x22), `\` (0x5C),
 * newline (0x0A), carriage return (0x0D), and tab (0x09), plus the empty
 * string. Additionally (rework R2, coordinator-accepted reviewer residual):
 * ALL remaining C0 control characters (< 0x20) and DEL (0x7F) are refused —
 * not as an injection vector (reviewer-probed: only `"` and `\` are structural
 * inside a JQL quoted literal) but so NUL/ESC/etc. never reach the Jira API as
 * data or anything that prints the JQL. Linear-time char-code scan — no regex
 * over untrusted text (lesson #19). This is the primary and ONLY path for
 * `dispatch_queue`: one uniform guarded path, never a "token-shaped? then
 * unquoted" branch.
 */
export function assertJqlSafeQuotedLiteral(value: string, label: string): void {
  if (value.length === 0) {
    throw new Error(`assertJqlSafeQuotedLiteral: ${label} must be non-empty`)
  }
  for (let i = 0; i < value.length; i++) {
    const c = value.charCodeAt(i)
    let offender: string | null = null
    if (c === 34) {
      offender = 'double quote'
    } else if (c === 92) {
      offender = 'backslash'
    } else if (c === 10) {
      offender = 'newline'
    } else if (c === 9) {
      offender = 'tab'
    } else if (c === 13) {
      offender = 'carriage return'
    } else if (c < 32 || c === 127) {
      // Remaining C0 controls + DEL (R2): named generically, refused uniformly.
      offender = `control character (0x${c.toString(16).padStart(2, '0').toUpperCase()})`
    }
    if (offender !== null) {
      throw new Error(
        `assertJqlSafeQuotedLiteral: ${label} ${JSON.stringify(value)} contains a ${offender} at index ${i} - refused before it reaches a quoted JQL literal`,
      )
    }
  }
}

/** `project = <KEY> AND labels = "mcp-test" AND summary ~ "<stableId>"` (Q5/F2). */
export function buildIdempotencyJql(projectKey: string, stableId: string): string {
  assertJqlSafeToken(projectKey, 'projectKey')
  assertJqlSafeToken(stableId, 'stableId')
  return `project = ${projectKey} AND labels = "${MCP_TEST_LABEL}" AND summary ~ "${stableId}"`
}
