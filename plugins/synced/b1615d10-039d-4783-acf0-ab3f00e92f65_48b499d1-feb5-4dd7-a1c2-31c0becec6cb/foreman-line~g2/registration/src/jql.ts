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
 * The one guarded path for values interpolated as quoted JQL string literals
 * (dispatch_queue). The quoted-literal surface admits characters the token
 * guard refuses (notably `:` in Atlassian account ids and `@` in emails), so it
 * carries its own uniform refusal set: `"` and `\` (quote-context breakers) and
 * every control character (named individually for the five common offenders).
 * No token-shaped branch — one rule for every caller.
 */
export function assertJqlSafeQuotedLiteral(value: string, label: string): void {
  if (value.length === 0) {
    throw new Error(`assertJqlSafeQuotedLiteral: ${label} must be non-empty`)
  }
  for (let i = 0; i < value.length; i++) {
    const c = value.charCodeAt(i)
    if (c === 34) {
      throw new Error(
        `assertJqlSafeQuotedLiteral: ${label} ${JSON.stringify(value)} contains a double quote at index ${i}`,
      )
    }
    if (c === 92) {
      throw new Error(
        `assertJqlSafeQuotedLiteral: ${label} ${JSON.stringify(value)} contains a backslash at index ${i}`,
      )
    }
    if (c === 10) {
      throw new Error(
        `assertJqlSafeQuotedLiteral: ${label} ${JSON.stringify(value)} contains a newline at index ${i}`,
      )
    }
    if (c === 9) {
      throw new Error(
        `assertJqlSafeQuotedLiteral: ${label} ${JSON.stringify(value)} contains a tab at index ${i}`,
      )
    }
    if (c === 13) {
      throw new Error(
        `assertJqlSafeQuotedLiteral: ${label} ${JSON.stringify(value)} contains a carriage return at index ${i}`,
      )
    }
    if (c <= 31 || c === 127) {
      const hex = c.toString(16).toUpperCase().padStart(2, '0')
      throw new Error(
        `assertJqlSafeQuotedLiteral: ${label} ${JSON.stringify(value)} contains a control character (0x${hex}) at index ${i}`,
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
