/**
 * Template rendering: enumerated substitution only (charter §4.3,
 * D9). Templates carry declared placeholders; substitution applies only to
 * the enumerated token map; everything else copies byte-for-byte. Any
 * unreplaced `{{...}}` surviving into generated output is an error, not a
 * warning — a typo'd placeholder fails the run instead of shipping literal
 * braces into a project's canon.
 *
 * GitHub Actions `${{ ... }}` expressions are NOT placeholders: the `$` sigil
 * exempts them from both substitution and the unreplaced check.
 */
import { ScaffoldError } from './errors.js'

export const TOKEN_NAMES = [
  'PROJECT_NAME',
  'SLUG',
  'BASE_BRANCH',
  'BRANCH_PREFIX',
  'WORKTREE_ROOT',
  'PROJECT_KEY',
  'DISPATCH_QUEUE',
] as const
export type TokenName = (typeof TOKEN_NAMES)[number]
export type TokenMap = Readonly<Partial<Record<TokenName, string>>>

const TOKEN_PATTERN = /\{\{([A-Z_]+)\}\}/g
const LEFTOVER_PATTERN = /(?<!\$)\{\{[^{}]*\}\}/

/** Renders a YAML scalar for a token value: strings are double-quoted (JSON
 * escaping — no YAML metacharacter can ever be introduced by a value), and an
 * absent optional identity value renders as YAML null. */
export function yamlScalar(value: string | undefined): string {
  return value === undefined ? 'null' : JSON.stringify(value)
}

/** Substitutes the enumerated token map. Unknown or typo'd placeholders are
 * left in place and then refused by `assertNoUnreplaced`. */
export function substitute(text: string, tokens: TokenMap): string {
  return text.replace(TOKEN_PATTERN, (match, name: string) => {
    if ((TOKEN_NAMES as readonly string[]).includes(name)) {
      const value = tokens[name as TokenName]
      return value === undefined ? match : value
    }
    return match
  })
}

export function assertNoUnreplaced(text: string, contextPath: string): void {
  const match = LEFTOVER_PATTERN.exec(text)
  if (match !== null) {
    throw new ScaffoldError(
      'UNREPLACED_PLACEHOLDER',
      `unreplaced placeholder ${match[0]} survives into generated output (a typo'd placeholder fails the run instead of shipping literal braces)`,
      [contextPath],
    )
  }
}
