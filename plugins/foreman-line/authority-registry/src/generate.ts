import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { stringify } from 'yaml'
import { generate } from '../../schema-scaffold/src/generate.js'
import { allSchemaFiles } from './registry.js'
import type {
  AuthorityEffect,
  AuthorityEnforcementRegistry,
  AuthorityRule,
  AuthorityTier,
  CanonSource,
  OperationAuthority,
  ReconciliationEvidence,
  ReconciliationRecord,
  RuleClassification,
  SourceKind,
  SourceLocator,
  SourceRef,
} from './types.js'
import {
  bindingDigestFor,
  canonicalJson,
  locatorDigestFor,
  normalizeRuleText,
  permissionProfileRuleMap,
  sha256,
  typescriptConstructMap,
} from './validate.js'

const SNAPSHOT = '51857a3a7796b393c0c0a68712f98c06e7015d79'
const here = dirname(fileURLToPath(import.meta.url))
const packageRoot = join(here, '..')
const repoRoot = join(packageRoot, '..', '..', '..')

interface SourceDefinition {
  readonly sourceId: string
  readonly path: string
  readonly sourceKind: SourceKind
  readonly authorityTier: AuthorityTier
  readonly authorityEffect: AuthorityEffect
  readonly scope: readonly ('foreman-kernel' | 'all-foreman-goals')[]
  readonly anchors?: readonly string[]
  readonly additionalAnchors?: readonly string[]
}

const SOURCE_DEFINITIONS: readonly SourceDefinition[] = [
  {
    sourceId: 'fk-charter',
    path: 'plugins/foreman-line/docs/goals/foreman-kernel/charter.md',
    sourceKind: 'goal-charter',
    authorityTier: 'goal-charter',
    authorityEffect: 'binding',
    scope: ['foreman-kernel'],
  },
  {
    sourceId: 'fk-plan-review-findings',
    path: 'plugins/foreman-line/docs/goals/foreman-kernel/plan-review-findings.md',
    sourceKind: 'foreman-contract',
    authorityTier: 'ratified-contract',
    authorityEffect: 'binding',
    scope: ['foreman-kernel'],
  },
  {
    sourceId: 'fk-loop-directive',
    path: 'plugins/foreman-line/docs/goals/foreman-kernel/loop-directive.md',
    sourceKind: 'goal-charter',
    authorityTier: 'goal-charter',
    authorityEffect: 'binding',
    scope: ['foreman-kernel'],
  },
  {
    sourceId: 'spec-convention',
    additionalAnchors: [
      "- **`permission_profile:`** — **Optional until the permission-profile registry ships.** A name referencing a profile in a reviewed permission-profile registry (a separate, deferred parcel). Never inline permission rules directly in a spec — a self-describing document must not be its own security authority. Lint behavior: if present, the value must be a non-empty, non-whitespace-only string (rejected otherwise); if absent, the spec-linter emits a non-blocking advisory warning to stderr (exit code remains `0`). The linter CLI exposes a `--no-permission-profile-warning` flag to suppress this advisory. When the registry ships, it will add enum validation as a non-breaking additive change to this field's contract.",
      '- `surfaces:` is broad routing and audit metadata.',
      "- `Allowed Files` is the parcel's mutation authority.",
      'If implementation requires a path not listed in `Allowed Files`, work stops',
      "4. **Gate 3 is human-owned unless delegation is proven at merge time.** Delegation is valid only when the target repository's effective branch rules name the agent's distinct identity as a bypass actor. The coordinator must query that rule at merge time and stop before any merge call when it cannot be proven. Missing configuration, an empty bypass list, a human-authenticated agent session, or an unavailable ruleset query all fail closed to human ownership.",
    ],
    path: 'plugins/foreman-line/docs/SPEC-CONVENTION.md',
    sourceKind: 'foreman-contract',
    authorityTier: 'ratified-contract',
    authorityEffect: 'binding',
    scope: ['all-foreman-goals'],
  },
  {
    sourceId: 'coordinator-pattern',
    additionalAnchors: [
      '| 1    | Charter ratification (Stage Zero exit)       | **Never**                                                                                                                           |',
      "| 2    | Dispatch approval (parcel-set + kickstarter) | Yes - standing authorization scoped to the charter's named parcels, granted at ratification or later                                |",
      '| 3    | Merge                                        | Yes - standing authorization ("merge it" rule), always contingent on the full verification chain being green; any red step voids it |',
    ],
    path: 'plugins/foreman-line/docs/COORDINATOR-PATTERN.md',
    sourceKind: 'coordinator-pattern',
    authorityTier: 'coordinator-pattern',
    authorityEffect: 'corroborating',
    scope: ['all-foreman-goals'],
  },
  {
    sourceId: 'goal-skill',
    path: 'plugins/foreman-line/skills/goal/SKILL.md',
    sourceKind: 'coordinator-pattern',
    authorityTier: 'coordinator-pattern',
    authorityEffect: 'corroborating',
    scope: ['all-foreman-goals'],
  },
  {
    sourceId: 'standing-constraints',
    additionalAnchors: [
      'Every builder and reviewer kickstarter includes this file by reference (one line: "Standing constraints apply — `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`"). Each rule below was earned on a real defect; the lesson number links to `docs/transcripts/defects_lessons.md` for provenance. Coordinator-side rules (shell discipline, closure checks, pre-PR gates) live in the coordinator carryover and COORDINATOR-PATTERN.md, not here.',
    ],
    path: 'plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md',
    sourceKind: 'standing-constraint',
    authorityTier: 'standing-role',
    authorityEffect: 'binding',
    scope: ['all-foreman-goals'],
  },
  {
    sourceId: 'parcel-driven-development',
    path: 'plugins/foreman-line/skills/parcel-driven-development/SKILL.md',
    sourceKind: 'standing-constraint',
    authorityTier: 'standing-role',
    authorityEffect: 'binding',
    scope: ['all-foreman-goals'],
  },
  {
    sourceId: 'foreman-line-plan',
    path: 'plugins/foreman-line/docs/FOREMAN-LINE-PLAN.md',
    sourceKind: 'historical',
    authorityTier: 'ratified-contract',
    authorityEffect: 'historical',
    scope: ['all-foreman-goals'],
  },
  {
    sourceId: 'approval-readme',
    path: 'plugins/foreman-line/approval/README.md',
    sourceKind: 'historical',
    authorityTier: 'ratified-contract',
    authorityEffect: 'historical',
    scope: ['all-foreman-goals'],
  },
  {
    sourceId: 'spec-frontmatter-schema',
    path: 'plugins/foreman-line/spec-linter/schemas/spec-frontmatter.schema.json',
    sourceKind: 'live-implementation',
    authorityTier: 'ratified-contract',
    authorityEffect: 'binding',
    scope: ['all-foreman-goals'],
  },
  {
    sourceId: 'spec-linter-validator',
    path: 'plugins/foreman-line/spec-linter/src/validate.ts',
    sourceKind: 'live-implementation',
    authorityTier: 'ratified-contract',
    authorityEffect: 'binding',
    scope: ['all-foreman-goals'],
    anchors: [
      'const ajv = new Ajv({ allErrors: true })',
      "if (doc.status === 'superseded' && doc.superseded_by === null) {",
      "if (!options?.noPermissionProfileWarning && !('permission_profile' in doc)) {",
      "'advisory: permission_profile is absent; set it to a registry profile name when the registry ships',",
      'return { valid: errors.length === 0, errors, warnings }',
    ],
  },
  {
    sourceId: 'spec-linter-cli',
    path: 'plugins/foreman-line/spec-linter/src/cli.ts',
    sourceKind: 'live-implementation',
    authorityTier: 'ratified-contract',
    authorityEffect: 'binding',
    scope: ['all-foreman-goals'],
    anchors: [
      ' *   0  all specs valid (advisory warnings do not affect exit code)',
      ' *   1  at least one schema or semantic-invariant violation (every violation on stderr)',
      ' *   2  usage error: missing/unreadable path, bad invocation, or directory with no .md files',
      'process.exitCode = run(process.argv.slice(2))',
    ],
  },
  {
    sourceId: 'spec-linter-readme',
    additionalAnchors: [
      '| `permission_profile:` | No (interim) | If present: non-empty, non-whitespace-only string. If absent: passes, with a non-blocking advisory warning. `null` is rejected (a schema violation, distinct from key-absent). |',
      '**`permission_profile:` interim behavior.** The permission-profile registry is a deferred parcel. Until it ships, this field is optional and unconstrained beyond "non-empty string if present." Every spec missing it gets one advisory warning per validation — not a failure. Once the registry lands, it will add enum validation as a non-breaking additive change.',
    ],
    path: 'plugins/foreman-line/spec-linter/README.md',
    sourceKind: 'generated-advisory',
    authorityTier: 'generated-advisory',
    authorityEffect: 'stale-explanation',
    scope: ['all-foreman-goals'],
  },
  {
    sourceId: 'permission-profiles-registry',
    path: 'plugins/foreman-line/permission-profiles/permission-profiles.yaml',
    sourceKind: 'foreman-contract',
    authorityTier: 'ratified-contract',
    authorityEffect: 'binding',
    scope: ['all-foreman-goals'],
    anchors: [
      '  coordinator:',
      '  builder-standard:',
      '  builder-architecture:',
      '  reviewer-readonly:',
      '  shaping-agent:',
      '  builder-deps:',
      '        - Bash(git commit*)',
    ],
  },
  {
    sourceId: 'permission-profiles-types',
    path: 'plugins/foreman-line/permission-profiles/src/types.ts',
    sourceKind: 'live-implementation',
    authorityTier: 'ratified-contract',
    authorityEffect: 'binding',
    scope: ['all-foreman-goals'],
    anchors: [
      "export type PermissionMode = 'default' | 'acceptEdits' | 'plan'",
      "  | 'reviewer-readonly'",
      'export const PROFILE_NAMES: readonly ProfileName[] = [',
      "  'coordinator',",
      "  'reviewer-readonly',",
    ],
  },
  {
    sourceId: 'permission-profiles-validator',
    path: 'plugins/foreman-line/permission-profiles/src/validator.ts',
    sourceKind: 'live-implementation',
    authorityTier: 'ratified-contract',
    authorityEffect: 'binding',
    scope: ['all-foreman-goals'],
    anchors: [
      "const REVIEWER_MUTATION_COMMANDS: readonly string[] = ['commit', 'push', 'apply', 'stash', 'merge']",
      "if (envelope.defaultMode === 'bypassPermissions') {",
      'function checkReviewerReadonlyRestrictionCompleteness(doc: Record<string, unknown>): string[] {',
      'function checkReviewerReadonlyShellAccessPreservation(doc: Record<string, unknown>): string[] {',
      'errors.push(...checkReviewerReadonlyRestrictionCompleteness(doc))',
      'errors.push(...checkReviewerReadonlyShellAccessPreservation(doc))',
    ],
  },
  {
    sourceId: 'permission-profiles-readme',
    additionalAnchors: [
      '`deny`/`ask` are **the** restriction mechanism; `allow` is documentation of',
      'A profile only constrains a session that actually **loads** the emitted',
      '- **Void under bypass mode:** `--dangerously-skip-permissions` skips deny',
      '- **Bash/PowerShell residual:** reduced, not eliminated, fix/commit',
    ],
    path: 'plugins/foreman-line/permission-profiles/README.md',
    sourceKind: 'generated-advisory',
    authorityTier: 'generated-advisory',
    authorityEffect: 'stale-explanation',
    scope: ['all-foreman-goals'],
  },
]

interface LocatedText {
  readonly locator: SourceLocator
  readonly text: string
}

function stripMarkdownHtmlComments(content: string): string {
  let visible = ''
  let cursor = 0
  while (cursor < content.length) {
    if (content.startsWith('<!--', cursor)) {
      const close = content.indexOf('-->', cursor + 4)
      if (close < 0) {
        visible += content[cursor]
        cursor += 1
        continue
      }
      const span = content.slice(cursor, close + 3)
      visible += span.replace(/[^\r\n]/g, ' ')
      cursor = close + 3
      continue
    }
    visible += content[cursor]
    cursor += 1
  }
  return visible
}

function pairedFenceLines(lines: readonly string[]): Set<number> {
  const fenced = new Set<number>()
  let cursor = 0
  while (cursor < lines.length) {
    const opener = /^( {0,3})(`{3,}|~{3,})(.*)$/.exec(lines[cursor] ?? '')
    if (opener === null) {
      cursor += 1
      continue
    }
    const delimiter = opener[2] as string
    const marker = delimiter[0] as string
    let close = -1
    for (let index = cursor + 1; index < lines.length; index += 1) {
      const candidate = /^( {0,3})(`{3,}|~{3,})\s*$/.exec(lines[index] ?? '')
      if (
        candidate !== null &&
        candidate[2]?.[0] === marker &&
        (candidate[2]?.length ?? 0) >= delimiter.length
      ) {
        close = index
        break
      }
    }
    if (close < 0) {
      cursor += 1
      continue
    }
    for (let index = cursor; index <= close; index += 1) fenced.add(index)
    cursor = close + 1
  }
  return fenced
}

function headingLocators(content: string): LocatedText[] {
  const lines = stripMarkdownHtmlComments(content).replace(/\r\n?/g, '\n').split('\n')
  const stack: { level: number; heading: string }[] = []
  const headings: { index: number; level: number; anchor: string }[] = []
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? ''
    const match = /^(#{1,6})\s+.+/.exec(line)
    if (match === null) continue
    const level = match[1]?.length ?? 6
    while ((stack.at(-1)?.level ?? 0) >= level) stack.pop()
    stack.push({ level, heading: line.trim() })
    if (level >= 2) {
      headings.push({ index, level, anchor: stack.map((item) => item.heading).join(' > ') })
    }
  }
  return headings.map((heading) => ({
    locator: { kind: 'heading', anchor: heading.anchor, lineHint: heading.index + 1 },
    text: lines[heading.index] ?? '',
  }))
}

function numberedItems(content: string): LocatedText[] {
  const lines = stripMarkdownHtmlComments(content).replace(/\r\n?/g, '\n').split('\n')
  const stack: { level: number; heading: string }[] = []
  const items: { index: number; indent: number; anchor: string }[] = []
  const occurrences = new Map<string, number>()
  const fenced = pairedFenceLines(lines)
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? ''
    if (fenced.has(index)) continue
    const heading = /^(#{1,6})\s+.+/.exec(line)
    if (heading !== null) {
      const level = heading[1]?.length ?? 6
      while ((stack.at(-1)?.level ?? 0) >= level) stack.pop()
      stack.push({ level, heading: line.trim() })
      continue
    }
    const numbered = /^(\s*)(\d+)\.\s+\S/.exec(line)
    if (numbered === null) continue
    const prefix = stack.map((item) => item.heading)
    const semanticKey = `${prefix.join(' > ')}\u0000${numbered[1]?.length ?? 0}\u0000${numbered[2] as string}`
    const occurrence = (occurrences.get(semanticKey) ?? 0) + 1
    occurrences.set(semanticKey, occurrence)
    items.push({
      index,
      indent: numbered[1]?.length ?? 0,
      anchor: [
        ...prefix,
        `list-item:${numbered[1]?.length ?? 0}:${numbered[2] as string}:${occurrence}`,
      ].join(' > '),
    })
  }
  return items.map((item) => {
    let end = lines.length
    for (let index = item.index + 1; index < lines.length; index += 1) {
      const line = lines[index] ?? ''
      if (/^#{1,6}\s+/.test(line)) {
        end = index
        break
      }
      const next = /^(\s*)(\d+)\.\s+\S/.exec(line)
      if (next !== null && (next[1]?.length ?? 0) <= item.indent) {
        end = index
        break
      }
    }
    return {
      locator: { kind: 'numbered-item', anchor: item.anchor, lineHint: item.index + 1 },
      text: lines.slice(item.index, end).join('\n'),
    }
  })
}

function tableRows(content: string, keys: readonly string[]): LocatedText[] {
  const lines = stripMarkdownHtmlComments(content).replace(/\r\n?/g, '\n').split('\n')
  return keys.map((key) => {
    const matches = lines
      .map((line, index) => ({ line, index }))
      .filter(({ line }) => line.trim().split('|').slice(1, -1)[0]?.trim() === key)
    if (matches.length !== 1) throw new Error(`table row '${key}' is not unique`)
    const match = matches[0] as { line: string; index: number }
    return {
      locator: { kind: 'table-row', anchor: key, lineHint: match.index + 1 },
      text: match.line,
    }
  })
}

function markdownBindingBlocks(content: string, sourceId: string): LocatedText[] {
  if (sourceId !== 'fk-charter' && sourceId !== 'fk-loop-directive') return []
  const lines = stripMarkdownHtmlComments(content).replace(/\r\n?/g, '\n').split('\n')
  const headings: { level: number; text: string }[] = []
  const occurrences = new Map<string, number>()
  const blocks: LocatedText[] = []
  const fenced = pairedFenceLines(lines)
  let cursor = 0
  while (cursor < lines.length) {
    const line = lines[cursor] ?? ''
    if (fenced.has(cursor)) {
      cursor += 1
      continue
    }
    const heading = /^(#{1,6})\s+.+/.exec(line)
    if (heading !== null) {
      const level = heading[1]?.length ?? 6
      while ((headings.at(-1)?.level ?? 0) >= level) headings.pop()
      headings.push({ level, text: line.trim() })
      cursor += 1
      continue
    }
    if (line.trim() === '' || line.trim() === '---') {
      cursor += 1
      continue
    }
    const table = /^\s*\|/.test(line)
    if (table && /^\s*\|?\s*:?-{3}/.test(line)) {
      cursor += 1
      continue
    }
    const list = /^\s*(?:[-*+] |\d+\. )/.test(line)
    let end = cursor + 1
    if (!table) {
      while (end < lines.length) {
        const next = lines[end] ?? ''
        if (next.trim() === '' || /^#{1,6}\s+/.test(next) || /^\s*\|/.test(next) || fenced.has(end))
          break
        if (list && /^\s*(?:[-*+] |\d+\. )/.test(next)) break
        end += 1
      }
    }
    const text = lines.slice(cursor, end).join('\n')
    const headingPath = headings.map((item) => item.text).join(' > ') || '(preamble)'
    const kind = table ? 'table-row' : list ? 'list-item' : 'paragraph'
    const semanticKey = `${headingPath}\u0000${kind}\u0000${sha256(normalizeRuleText(text)).slice(0, 12)}`
    const occurrence = (occurrences.get(semanticKey) ?? 0) + 1
    occurrences.set(semanticKey, occurrence)
    blocks.push({
      locator: {
        kind: 'line-excerpt',
        anchor: `md-block:${headingPath}:${kind}:${semanticKey.slice(-12)}:${occurrence}`,
        lineHint: cursor + 1,
      },
      text,
    })
    cursor = end
  }
  return blocks
}

function tsConstructs(content: string): LocatedText[] {
  return [...typescriptConstructMap(content)].map(([anchor, text], index) => ({
    locator: { kind: 'symbol', anchor, lineHint: index + 1 },
    text,
  }))
}

function jsonConstraints(content: string): LocatedText[] {
  const root = JSON.parse(content) as unknown
  const result: LocatedText[] = []
  const visit = (value: unknown, path: string): void => {
    if (Array.isArray(value) || value === null || typeof value !== 'object') {
      result.push({
        locator: { kind: 'symbol', anchor: `json-pointer:${path}`, lineHint: 1 },
        text: canonicalJson(value),
      })
      return
    }
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      visit(
        (value as Record<string, unknown>)[key],
        `${path}/${key.replace(/~/g, '~0').replace(/\//g, '~1')}`,
      )
    }
  }
  visit(root, '')
  return result
}

function permissionProfileRules(content: string): LocatedText[] {
  return [...permissionProfileRuleMap(content)].map(([anchor, text], index) => ({
    locator: { kind: 'symbol', anchor, lineHint: index + 1 },
    text,
  }))
}

function itemIdFor(definition: SourceDefinition, located: LocatedText): string {
  const legacyProtectedTextIds: Readonly<Record<string, string>> = {
    '1. **Human gate: the merge.** A human owns every merge. Deliberate, permanent.':
      'item.c92333c21e64',
    '1. a live interactive TTY (`process.stdin.isTTY`), and': 'item.4261d18b3243',
    '2. a **typed confirmation phrase** — the human must type the exact `<slug>` being approved, compared with a linear-time exact-string check (`===`) — no regex, no backtracking risk. `--approver <name>` is **required**; omitting it refuses with exit `2` before either gate check runs (deterministic, auditable approver identity — never inferred from the OS user). There is **no** `--yes`/`--force`/auto-approve flag of any kind, and no environment variable can substitute for either gate. If stdin is **not** a TTY (CI, pipe, redirect), `approve` refuses with exit code `2` and **mints nothing** — no receipt file, no approval record, no partial write. Both gate checks, in order, are the *only* path in this package that reaches the mint/write step. - **`reject <slug|path> [--epic-title <title>] [--reason <text>]`** — records a rejection (`decision: "rejected"`, optional reason, ISO-UTC timestamp, and the subject hash **for reference only**) to `active/<slug>.rejection.json`. Mints **no receipt** and produces **no** `approvedHash` binding — the receipt chain begins only at approval. `--repo-root <path>` (all three verbs, optional) overrides the filesystem root every call resolves paths against; it never touches approval authorization, the TTY check, or the confirmation check.':
      'item.ff6f38f088ae',
    '1. **Gate 2 dispatch** is authorized for exactly FK-P0–FK-P21, in the ratified dependency order. A new parcel or changed dependency graph reopens Gate 1.':
      'item.bfffee6d7c1f',
    '11. nondelegated human Gate 3 for every merge.': 'item.b1ac4aa9eddf',
    '11. nondelegated human Gate 3 for every merge. **Gate 1 record:** Clinton Morgan explicitly ratified the original list and authorized the contingent Gate 2 dispatch grant on 2026-08-31, then explicitly re-ratified plan-review amendments R1–R13 and resumed Gate 2 on 2026-08-31. Parcel shaping and dispatch may now proceed in dependency order under the stated contingencies.':
      'item.b1ac4aa9eddf',
    '10. standing Gate-2 dispatch authorization under the stated contingencies; and':
      'item.afbcffd2d557',
    '6. **Gate 3 is not delegated.** Never merge. Present the complete green chain and exact merge target to the human.':
      'item.7eb6018d9e57',
    '10. When green, prepare the verification-chain table and PR material. Stop at the human Gate 3 before merge.':
      'item.2743c2f8c558',
    '8. Every Foreman Kernel parcel is architecture/risk or critical unless its ratified spec says otherwise. Architecture/risk receives **two independent fresh reviews**. Reviewers never fix or commit and are explicitly licensed for hostile-input and mutation probing.':
      'item.ce9042d917b2',
    '1. Waves 0–4 and FK-P0 through FK-P21 are merged through the required human Gate 3 process.':
      'item.e9ec57edc0a2',
    '11. After a human merge, perform Stage F: spec to `done/`, lessons with dispositions, evidence index, worktree/branch cleanup, and this state block update.':
      'item.e3065db62b43',
  }
  const legacyId = legacyProtectedTextIds[normalizeRuleText(located.text)]
  if (legacyId !== undefined) return legacyId
  if (definition.sourceId === 'fk-charter' && located.locator.kind === 'table-row') {
    return `item.${located.locator.anchor.toLowerCase()}`
  }
  if (definition.sourceId === 'fk-plan-review-findings' && located.locator.kind === 'table-row') {
    return `item.${located.locator.anchor.toLowerCase()}`
  }
  if (
    definition.sourceId === 'foreman-line-plan' &&
    located.locator.anchor.startsWith('**Thesis:**')
  ) {
    return 'item.two-gate-thesis'
  }
  const numbered = /(?:^| > )list-item:\d+:(\d+):\d+$/.exec(located.locator.anchor)
  if (definition.sourceId === 'standing-constraints' && numbered?.[1] !== undefined) {
    return `item.constraint-${numbered[1]}`
  }
  if (
    definition.sourceId === 'parcel-driven-development' &&
    located.locator.anchor.includes('## The Hard Rules') &&
    numbered?.[1] !== undefined
  ) {
    return `item.hard-rule-${numbered[1]}`
  }
  return `item.${shortId(located.locator.anchor)}`
}

function classificationFor(sourceId: string, itemId: string): RuleClassification {
  const explicit: Readonly<Record<string, RuleClassification>> = {
    'item.d1': 'ci-static-check',
    'item.d2': 'ci-static-check',
    'item.d3': 'pre-action-refusal',
    'item.d4': 'ci-static-check',
    'item.d5': 'pre-action-refusal',
    'item.d6': 'ci-static-check',
    'item.d7': 'post-action-detection',
    'item.d8': 'post-action-detection',
    'item.d9': 'independent-review-human-judgment',
    'item.d10': 'pre-action-refusal',
    'item.d11': 'ci-static-check',
    'item.d12': 'pre-action-refusal',
    'item.d13': 'post-action-detection',
    'item.d14': 'ci-static-check',
    'item.d15': 'pre-action-refusal',
    'item.d16': 'pre-action-refusal',
    'item.d17': 'pre-action-refusal',
    'item.d18': 'ci-static-check',
    'item.d19': 'pre-action-refusal',
    'item.d20': 'ci-static-check',
    'item.r1': 'narrative-provenance',
    'item.r2': 'pre-action-refusal',
    'item.r3': 'narrative-provenance',
    'item.r4': 'unsupported',
    'item.r5': 'ci-static-check',
    'item.r6': 'pre-action-refusal',
    'item.r7': 'narrative-provenance',
    'item.r8': 'narrative-provenance',
    'item.r9': 'ci-static-check',
    'item.r10': 'unsupported',
    'item.r11': 'ci-static-check',
    'item.r12': 'post-action-detection',
    'item.r13': 'pre-action-refusal',
    'item.constraint-1': 'pre-action-refusal',
    'item.constraint-2': 'pre-action-refusal',
    'item.constraint-3': 'pre-action-refusal',
    'item.constraint-4': 'pre-action-refusal',
    'item.constraint-5': 'ci-static-check',
    'item.constraint-6': 'pre-action-refusal',
    'item.constraint-7': 'pre-action-refusal',
    'item.constraint-8': 'independent-review-human-judgment',
    'item.constraint-9': 'independent-review-human-judgment',
    'item.constraint-10': 'post-action-detection',
    'item.constraint-11': 'independent-review-human-judgment',
    'item.constraint-12': 'ci-static-check',
    'item.constraint-13': 'pre-action-refusal',
    'item.hard-rule-1': 'pre-action-refusal',
    'item.hard-rule-2': 'pre-action-refusal',
    'item.hard-rule-3': 'pre-action-refusal',
    'item.hard-rule-4': 'pre-action-refusal',
    'item.hard-rule-5': 'pre-action-refusal',
    'item.hard-rule-6': 'pre-action-refusal',
    'item.hard-rule-7': 'ci-static-check',
    'item.hard-rule-8': 'pre-action-refusal',
    'item.hard-rule-9': 'pre-action-refusal',
    'item.hard-rule-10': 'pre-action-refusal',
    'item.hard-rule-11': 'ci-static-check',
    'item.hard-rule-12': 'independent-review-human-judgment',
    'item.hard-rule-13': 'pre-action-refusal',
    'item.hard-rule-14': 'ci-static-check',
    'item.hard-rule-15': 'ci-static-check',
    'item.b1ac4aa9eddf': 'pre-action-refusal',
    'item.bdf997c3cd45': 'ci-static-check',
    'item.a583b7f02950': 'narrative-provenance',
    'item.93d5d3978e5f': 'pre-action-refusal',
    'item.cd014d6d90c5': 'independent-review-human-judgment',
    'item.144bb836f528': 'pre-action-refusal',
    'item.a087b0ab4c3b': 'ci-static-check',
    'item.e9ec57edc0a2': 'pre-action-refusal',
    'item.8cf027fc811e': 'independent-review-human-judgment',
    'item.15a44cf50bc6': 'pre-action-refusal',
    'item.c74628d41600': 'pre-action-refusal',
    'item.d9921c51d7ea': 'pre-action-refusal',
    'item.0afd841f51f8': 'pre-action-refusal',
    'item.2cbbc7ae0192': 'pre-action-refusal',
    'item.b0a3e204145f': 'narrative-provenance',
    'item.1de06653021c': 'narrative-provenance',
    'item.0979dba6c958': 'ci-static-check',
    'item.75569dd4ae1a': 'independent-review-human-judgment',
    'item.56a15a2f3220': 'ci-static-check',
    'item.760cf6497075': 'pre-action-refusal',
    'item.b3183ee0b5ab': 'unsupported',
    'item.f8c108b3b431': 'unsupported',
    'item.a26beda5342d': 'unsupported',
    'item.27ce8e0a4adc': 'unsupported',
  }
  if (explicit[itemId] !== undefined) return explicit[itemId]
  const profileRuleClassifications: Readonly<Record<string, RuleClassification>> = {
    'item.1ec33a4741eb': 'ci-static-check',
    'item.7faf78a6f54a': 'pre-action-refusal',
    'item.26c5e2b211da': 'pre-action-refusal',
    'item.1d221ed65b72': 'pre-action-refusal',
    'item.1ce0fd439b3e': 'pre-action-refusal',
    'item.39e65fb31709': 'pre-action-refusal',
    'item.ffd949ad76c3': 'pre-action-refusal',
    'item.c9cb62068f14': 'ci-static-check',
    'item.13033f70c124': 'ci-static-check',
    'item.947d19fbeb35': 'pre-action-refusal',
    'item.5a359d80896b': 'pre-action-refusal',
    'item.ee0641be06f2': 'pre-action-refusal',
    'item.cf29180bce81': 'pre-action-refusal',
    'item.4f213acde8e0': 'pre-action-refusal',
    'item.397a3eb4c7ad': 'pre-action-refusal',
    'item.f0613939994f': 'ci-static-check',
    'item.58ef984a0faa': 'ci-static-check',
    'item.50cd9c68ff51': 'ci-static-check',
    'item.b9e7c5644f49': 'pre-action-refusal',
    'item.861d14c80da2': 'pre-action-refusal',
    'item.fe1bbb0564f6': 'pre-action-refusal',
    'item.803732fe3411': 'pre-action-refusal',
    'item.b77e9988c19d': 'pre-action-refusal',
    'item.8cf9d57aa29c': 'pre-action-refusal',
    'item.0ed672bcdee8': 'ci-static-check',
    'item.bbb2cdb40927': 'ci-static-check',
    'item.b01d14453456': 'pre-action-refusal',
    'item.315ebd655fbe': 'pre-action-refusal',
    'item.8e8e3c78500b': 'pre-action-refusal',
    'item.4c9cd1062bc6': 'pre-action-refusal',
    'item.060989ad78ea': 'pre-action-refusal',
    'item.30b62f67dc13': 'pre-action-refusal',
    'item.7417033cefc7': 'ci-static-check',
    'item.f7f03a01fd3a': 'pre-action-refusal',
    'item.35cf0f58fc34': 'pre-action-refusal',
    'item.dedb7349c943': 'pre-action-refusal',
    'item.b7ab94d73ef4': 'pre-action-refusal',
    'item.9ab0d5db8ebf': 'pre-action-refusal',
    'item.ea8666a98ca1': 'pre-action-refusal',
    'item.3a54e390a3e1': 'pre-action-refusal',
    'item.eb314ad28f5e': 'pre-action-refusal',
    'item.14569d4abb87': 'pre-action-refusal',
    'item.7943c5773fba': 'pre-action-refusal',
    'item.2ca898541627': 'pre-action-refusal',
    'item.23838f138908': 'pre-action-refusal',
    'item.6d850a4b4948': 'pre-action-refusal',
    'item.f1d63df02914': 'pre-action-refusal',
    'item.8c5085e2ff63': 'ci-static-check',
    'item.60eb2cbc6f43': 'pre-action-refusal',
    'item.1e0db040f9d8': 'pre-action-refusal',
    'item.e477240aeb8e': 'pre-action-refusal',
    'item.074c70cc9d55': 'pre-action-refusal',
    'item.5705a054df96': 'pre-action-refusal',
    'item.b6db9d1f4737': 'pre-action-refusal',
    'item.92b60e67dfba': 'pre-action-refusal',
    'item.b8a82b2446d9': 'pre-action-refusal',
    'item.1fa440b2fe59': 'pre-action-refusal',
    'item.3641610e292b': 'pre-action-refusal',
    'item.854101218a6d': 'pre-action-refusal',
    'item.e4d0bc5dc904': 'pre-action-refusal',
    'item.7b5310ad887b': 'pre-action-refusal',
    'item.6ac66b888a40': 'pre-action-refusal',
  }
  if (
    sourceId === 'permission-profiles-registry' &&
    profileRuleClassifications[itemId] !== undefined
  ) {
    return profileRuleClassifications[itemId]
  }
  if (sourceId === 'spec-linter-validator' || sourceId === 'spec-linter-cli')
    return 'ci-static-check'
  if (sourceId === 'permission-profiles-validator') return 'pre-action-refusal'
  if (sourceId === 'spec-linter-readme' || sourceId === 'permission-profiles-readme') {
    return 'unsupported'
  }
  return 'narrative-provenance'
}

const CURATED_ITEM_IDENTITIES: Readonly<Record<string, readonly [string, string]>> = {
  'fk-charter:item.d1': ['goal.separation', 'separate-foreman-kernel-goal'],
  'fk-charter:item.d2': [
    'canon.operational-authority-boundary',
    'git-canon-sqlite-operational-split',
  ],
  'fk-charter:item.d3': ['kernel.surface-admission-separation', 'read-control-admission-separated'],
  'fk-charter:item.d4': [
    'kernel.first-release-scope',
    'provider-neutral-trust-core-with-one-shadow-adapter',
  ],
  'fk-charter:item.d5': ['receipt.mint-authority', 'no-generic-agent-callable-mint'],
  'fk-charter:item.d6': ['receipt.authority-label', 'first-release-receipts-are-structural'],
  'fk-charter:item.d7': [
    'permission-profile.enforcement-bound',
    'loaded-refusal-versus-unenrollment-detection-boundary',
  ],
  'fk-charter:item.d8': ['enforcement.promotion', 'shadow-proofs-before-fail-closed-enforcement'],
  'fk-charter:item.d9': ['gate.namespace', 'fk-three-gate-ownership'],
  'fk-charter:item.d10': ['spec.mutation-authority', 'exact-allowed-files-required'],
  'fk-charter:item.d11': ['defect.retirement', 'four-independent-evidence-kinds-required'],
  'fk-charter:item.d12': ['hook.policy-boundary', 'hooks-normalize-but-do-not-decide-policy'],
  'fk-charter:item.d13': [
    'repository.mutation-detection',
    'post-action-git-and-ci-backstop-required',
  ],
  'fk-charter:item.d14': [
    'operational-state.authority',
    'sqlite-transactional-single-writer-authority',
  ],
  'fk-charter:item.d15': [
    'external-effects.boundary',
    'first-container-has-no-external-credentials',
  ],
  'fk-charter:item.d16': ['caller.asserted-authority', 'self-asserted-authority-is-refused'],
  'fk-charter:item.d17': ['tool.public-contract', 'versioned-schema-provenance-and-stable-codes'],
  'fk-charter:item.d18': ['kernel.authorize-action-owner', 'provider-neutral-policy-engine'],
  'fk-charter:item.d19': ['repository.read-confidentiality', 'admission-bound-contained-read'],
  'fk-charter:item.d20': ['host.support-claim', 'first-release-enforcement-is-host-specific'],
  'fk-charter:item.b1ac4aa9eddf': ['gate3.merge-authority', 'human-owned-nondelegated'],
  'fk-plan-review-findings:item.r1': [
    'authorization.engine-placement',
    'dedicated-policy-engine-parcel-added',
  ],
  'fk-plan-review-findings:item.r2': [
    'control.admission',
    'authenticated-local-admission-required',
  ],
  'fk-plan-review-findings:item.r3': [
    'image.proof-separation',
    'stateless-and-stateful-proofs-separated',
  ],
  'fk-plan-review-findings:item.r4': [
    'bypass.enrollment-separation',
    'refusal-and-absence-detection-separated',
  ],
  'fk-plan-review-findings:item.r5': ['enforcement.ci-order', 'ci-backstop-precedes-promotion'],
  'fk-plan-review-findings:item.r6': [
    'repository.read-boundary',
    'confidential-read-and-state-isolation-added',
  ],
  'fk-plan-review-findings:item.r7': ['parcel.wave-boundaries', 'wave-three-serialization-redrawn'],
  'fk-plan-review-findings:item.r8': [
    'state.authority-fields',
    'git-sqlite-cutover-semantics-added',
  ],
  'fk-plan-review-findings:item.r9': [
    'state.failure-tests',
    'lease-crash-migration-backup-tests-required',
  ],
  'fk-plan-review-findings:item.r10': [
    'host.claim-matrix',
    'first-release-host-filesystem-matrix-added',
  ],
  'fk-plan-review-findings:item.r11': ['exit.evidence-manifest', 'exact-proof-identities-required'],
  'fk-plan-review-findings:item.r12': [
    'mixed-entrypoint.sentinel',
    'enumeration-and-write-sentinels-bind-shaping',
  ],
  'fk-plan-review-findings:item.r13': [
    'shared-file.serialization',
    'every-shared-surface-has-an-owner',
  ],
  'fk-loop-directive:item.7a05d374a3b1': [
    'goal.queue-authority',
    'single-coordinator-ratified-state-queue-owner-primary-codex-coordinator-session-task-where-clinton-morgan-ratified-foreman',
  ],
  'fk-loop-directive:item.b81725578197': [
    'goal.queue-authority',
    'single-coordinator-ratified-state-original-gate-1-charter-commit',
  ],
  'fk-loop-directive:item.aac2d1258986': [
    'goal.queue-authority',
    'single-coordinator-ratified-state-plan-review-triage-commit',
  ],
  'fk-loop-directive:item.4f0fb14fbd95': [
    'goal.queue-authority',
    'single-coordinator-ratified-state-scoped-gate-1-re-ratification-commit',
  ],
  'fk-loop-directive:item.47a75730afd6': [
    'goal.queue-authority',
    'single-coordinator-ratified-state-standing-gate-2-active-fk-p0-through-fk-p21-under-charter-contingencies',
  ],
  'fk-loop-directive:item.08b3cbb91027': [
    'goal.queue-authority',
    'single-coordinator-ratified-state-gate-3-not-delegated-every-merge-human-action',
  ],
  'fk-loop-directive:item.ae7854c7dad1': [
    'goal.queue-authority',
    'single-coordinator-ratified-state-state-2026-08-31-stage-zero-complete-original-gate-1-scoped-re',
  ],
  'fk-loop-directive:item.dd8203551518': [
    'coordinator.required-reading',
    'read-controlling-sources-each-iteration-coordinator-consumes-verification-never-produces-independent-verification-its-own-work-every-iteration',
  ],
  'fk-loop-directive:item.ebdd14e6f524': [
    'coordinator.required-reading',
    'read-controlling-sources-each-iteration-1',
  ],
  'fk-loop-directive:item.a59b01361dc6': [
    'coordinator.required-reading',
    'read-controlling-sources-each-iteration-2-directive',
  ],
  'fk-loop-directive:item.734b79ca0bb8': [
    'coordinator.required-reading',
    'read-controlling-sources-each-iteration-3-active-parcel-spec-kickstarter-handoff-review-findings',
  ],
  'fk-loop-directive:item.51f7dbbba473': [
    'coordinator.required-reading',
    'read-controlling-sources-each-iteration-4',
  ],
  'fk-loop-directive:item.d69eca1ec1f6': [
    'coordinator.required-reading',
    'read-controlling-sources-each-iteration-5',
  ],
  'fk-loop-directive:item.fc3ea1441f92': [
    'coordinator.required-reading',
    'read-controlling-sources-each-iteration-6',
  ],
  'fk-loop-directive:item.15e5fcbdbe13': [
    'coordinator.required-reading',
    'read-controlling-sources-each-iteration-plan-review-transcript',
  ],
  'fk-loop-directive:item.bfffee6d7c1f': [
    'goal.standing-authorization',
    'bounded-local-work-without-external-effects-or-merge-1-gate-2-dispatch-authorized-exactly-fk-p0-fk-p21-ratified-dependency',
  ],
  'fk-loop-directive:item.431228393540': [
    'goal.standing-authorization',
    'bounded-local-work-without-external-effects-or-merge-2-shaping-coordinator-lint-may-proceed-when-dependencies-satisfied',
  ],
  'fk-loop-directive:item.be7691d170a9': [
    'goal.standing-authorization',
    'bounded-local-work-without-external-effects-or-merge-3-local-isolated-worktrees-branches-commits-tests-review-artifacts-authorized-named-parcel',
  ],
  'fk-loop-directive:item.9935b3499764': [
    'goal.standing-authorization',
    'bounded-local-work-without-external-effects-or-merge-4-step-0-rulings-stay-coordinator-unless-flag-changes-locked-decision-external',
  ],
  'fk-loop-directive:item.64341d1e8b82': [
    'goal.standing-authorization',
    'bounded-local-work-without-external-effects-or-merge-5-no-external-system-effects-no-jira-cloud-deployment-publication-external-communication',
  ],
  'fk-loop-directive:item.7eb6018d9e57': [
    'goal.standing-authorization',
    'bounded-local-work-without-external-effects-or-merge-6-gate-3-not-delegated-never-merge-present-complete-green-chain-exact',
  ],
  'fk-loop-directive:item.7aa2dd930e35': [
    'goal.standing-authorization',
    'bounded-local-work-without-external-effects-or-merge-7-push-pr-may-occur-only-when-active-parcel-contract-developer-authority',
  ],
  'fk-loop-directive:item.8c0b09120ff1': [
    'coordinator.parcel-loop',
    'verify-shape-build-review-and-stop-at-human-merge-1-verify-current-queue-item-all-dependencies-against-git-not-memory',
  ],
  'fk-loop-directive:item.d3b0e9dd63d0': [
    'coordinator.parcel-loop',
    'verify-shape-build-review-and-stop-at-human-merge-2-dispatch-fresh-shaping-session-docs-only-mode-drafts-one-spec-exact',
  ],
  'fk-loop-directive:item.f7e8dffebadc': [
    'coordinator.parcel-loop',
    'verify-shape-build-review-and-stop-at-human-merge-3-coordinator-lint-every-factual-claim-disk-check-spec-against-charter-word',
  ],
  'fk-loop-directive:item.1157c2a03bbe': [
    'coordinator.parcel-loop',
    'verify-shape-build-review-and-stop-at-human-merge-4-gate-2-already-active-only-if-spec-stays-within-charter-create',
  ],
  'fk-loop-directive:item.bdd56a126b79': [
    'coordinator.parcel-loop',
    'verify-shape-build-review-and-stop-at-human-merge-5-dispatch-fresh-builder-its-first-action-step-0-restate-stop-scope',
  ],
  'fk-loop-directive:item.ed8d7888ce8c': [
    'coordinator.parcel-loop',
    'verify-shape-build-review-and-stop-at-human-merge-6-verify-builder-s-committed-sha-completion-claim-disk-before-accepting-wrong',
  ],
  'fk-loop-directive:item.6ea9ce2b9573': [
    'coordinator.parcel-loop',
    'verify-shape-build-review-and-stop-at-human-merge-7-run-parcel-s-deterministic-pass-coordinator-environment-capture-complete-command-output',
  ],
  'fk-loop-directive:item.ce9042d917b2': [
    'coordinator.parcel-loop',
    'verify-shape-build-review-and-stop-at-human-merge-8-every-foreman-kernel-parcel-architecture-risk-critical-unless-its-ratified-spec',
  ],
  'fk-loop-directive:item.d978784bc1b7': [
    'coordinator.parcel-loop',
    'verify-shape-build-review-and-stop-at-human-merge-9-triage-findings-fix-accept-documented-informational-reproduce-disputed-blockers-before-ruling',
  ],
  'fk-loop-directive:item.2743c2f8c558': [
    'coordinator.parcel-loop',
    'verify-shape-build-review-and-stop-at-human-merge-10-when-green-prepare-verification-chain-table-pr-material-stop-at-human',
  ],
  'fk-loop-directive:item.e3065db62b43': [
    'coordinator.parcel-loop',
    'verify-shape-build-review-and-stop-at-human-merge-11-after-human-merge-perform-stage-f-spec-lessons-dispositions-evidence-index',
  ],
  'fk-loop-directive:item.1576c95260b6': [
    'parcel.shared-file-serialization',
    'parallelize-only-after-contracts-and-without-shared-points',
  ],
  'fk-loop-directive:item.8f98d5e3e61a': [
    'registry.delivery-contract',
    'source-bound-classified-non-escalating-registry-only-fk-p0-produces-canonical-authority-enforcement-registry-reconciles-operative-contradictions-before-any',
  ],
  'fk-loop-directive:item.4f26e86b0870': [
    'registry.delivery-contract',
    'source-bound-classified-non-escalating-registry-only-inventory-every-standing-builder-reviewer-coordinator-gate-stop-authority-rule',
  ],
  'fk-loop-directive:item.5909432cc1a7': [
    'registry.delivery-contract',
    'source-bound-classified-non-escalating-registry-only-classify-each-rule-pre-action-refusal-post-action-detection-ci-static-check',
  ],
  'fk-loop-directive:item.b2e02392e4e5': [
    'registry.delivery-contract',
    'source-bound-classified-non-escalating-registry-only-define-precedence-stable-rule-identity-source-locator-digest-applicability-severity-decision-semantics',
  ],
  'fk-loop-directive:item.ec3e0d0130ff': [
    'registry.delivery-contract',
    'source-bound-classified-non-escalating-registry-only-reconcile-gate-count-language-current-spec-linter-profile-behavior-live-vs-stale',
  ],
  'fk-loop-directive:item.e7e5c2483975': [
    'registry.delivery-contract',
    'source-bound-classified-non-escalating-registry-only-mechanically-prohibit-human-approval-independent-verifier-evidence-merge-authority-closure-authority-generic',
  ],
  'fk-loop-directive:item.c6c0339a5001': [
    'registry.delivery-contract',
    'source-bound-classified-non-escalating-registry-only-define-golden-registry-fixtures-mutation-controls-identity-location-value-stale-source-duplicate',
  ],
  'fk-loop-directive:item.78a9d344c4c6': [
    'registry.delivery-contract',
    'source-bound-classified-non-escalating-registry-only-remain-contract-docs-only-no-hooks-mcp-server-sqlite-runtime-docker-external',
  ],
  'fk-loop-directive:item.5820c7f79bef': [
    'coordinator.stop-conditions',
    'stop-on-authority-scope-security-or-ownership-failure-stop-report-if',
  ],
  'fk-loop-directive:item.7f72e946ccbe': [
    'coordinator.stop-conditions',
    'stop-on-authority-scope-security-or-ownership-failure-ownership-ambiguous-another-live-coordinator-named',
  ],
  'fk-loop-directive:item.23f92834c1c8': [
    'coordinator.stop-conditions',
    'stop-on-authority-scope-security-or-ownership-failure-locked-decision-parcel-graph-exit-criterion-external-effect-boundary-human-gate-needs',
  ],
  'fk-loop-directive:item.6151d43333aa': [
    'coordinator.stop-conditions',
    'stop-on-authority-scope-security-or-ownership-failure-required-file-falls-outside-exact-allowed-files',
  ],
  'fk-loop-directive:item.c708d8f95113': [
    'coordinator.stop-conditions',
    'stop-on-authority-scope-security-or-ownership-failure-current-goal-parcel-owns-required-serialization-point-sequencing-unresolved',
  ],
  'fk-loop-directive:item.adee76eb5f43': [
    'coordinator.stop-conditions',
    'stop-on-authority-scope-security-or-ownership-failure-proposed-control-trusts-self-asserted-identity-can-manufacture-human-independent-authority',
  ],
  'fk-loop-directive:item.52f524327994': [
    'coordinator.stop-conditions',
    'stop-on-authority-scope-security-or-ownership-failure-read-only-path-can-escape-its-admitted-repository-reach-state-volume',
  ],
  'fk-loop-directive:item.37f78aa591c5': [
    'coordinator.stop-conditions',
    'stop-on-authority-scope-security-or-ownership-failure-security-finding-cannot-close-inside-parcel',
  ],
  'fk-loop-directive:item.d7945b743a67': [
    'coordinator.stop-conditions',
    'stop-on-authority-scope-security-or-ownership-failure-same-tripwire-rework-cap-fires-defined-parcel',
  ],
  'fk-loop-directive:item.80f2c4a08e42': [
    'coordinator.stop-conditions',
    'stop-on-authority-scope-security-or-ownership-failure-reviewer-builder-modifies-ambient-checkout-another-worktree',
  ],
  'fk-loop-directive:item.c55a33cc847f': [
    'coordinator.stop-conditions',
    'stop-on-authority-scope-security-or-ownership-failure-user-owned-change-collides-parcel',
  ],
  'fk-loop-directive:item.237865e0993f': [
    'coordinator.stop-conditions',
    'stop-on-authority-scope-security-or-ownership-failure-queue-empty-without-every-goal-exit-criterion-evidenced',
  ],
  'fk-loop-directive:item.7ad3390acb6b': [
    'coordinator.session-wakeup',
    'completion-notifications-before-fallback-waits',
  ],
  'spec-convention:item.fd5d51dd4808': [
    'parcel.spec-convention',
    'follow-versioned-spec-lifecycle-and-exact-mutation-authority-1-state-lives-frontmatter-folder-location-they-must-agree-folder-authoritative-agent',
  ],
  'spec-convention:item.f2172f28e7fc': [
    'parcel.spec-convention',
    'follow-versioned-spec-lifecycle-and-exact-mutation-authority-2-when-work-merges-spec-moves-same-pr-immediate-follow-up-merge',
  ],
  'spec-convention:item.71d77f22d163': [
    'parcel.spec-convention',
    'follow-versioned-spec-lifecycle-and-exact-mutation-authority-3-material-changes-spec-require-comment-linked-jira-ticket-see-5',
  ],
  'spec-convention:item.ea0314db8499': [
    'parcel.spec-convention',
    'follow-versioned-spec-lifecycle-and-exact-mutation-authority-4-agents-load-only-spec-their-assigned-ticket-b-nothing-else-ever',
  ],
  'spec-convention:item.d2b2084774b8': [
    'parcel.spec-convention',
    'follow-versioned-spec-lifecycle-and-exact-mutation-authority-1-every-spec-carries-jira-key-frontmatter-filename',
  ],
  'spec-convention:item.910181940014': [
    'parcel.spec-convention',
    'follow-versioned-spec-lifecycle-and-exact-mutation-authority-2-every-linked-jira-ticket-carries-link-spec-path-at-specific-commit',
  ],
  'spec-convention:item.c9b45d54e97b': [
    'parcel.spec-convention',
    'follow-versioned-spec-lifecycle-and-exact-mutation-authority-3-when-spec-s-date-bumps-material-change-ticket-gets-comment-spec',
  ],
  'spec-convention:item.4fa776b35f0b': [
    'parcel.spec-convention',
    'follow-versioned-spec-lifecycle-and-exact-mutation-authority-4-conflicts-resolve-follows-jira-wins-delivery-state-priority-schedule-assignment-spec',
  ],
  'spec-convention:item.4886c52fa322': [
    'parcel.spec-convention',
    'follow-versioned-spec-lifecycle-and-exact-mutation-authority-1-one-spec-one-agent-one-isolated-branch-worktree-no-shared-working',
  ],
  'spec-convention:item.74a07f6879cc': [
    'parcel.spec-convention',
    'follow-versioned-spec-lifecycle-and-exact-mutation-authority-2-scope-pinning-at-dispatch-step-0-agent-s-first-act-restate',
  ],
  'spec-convention:item.03f0830cd693': [
    'parcel.spec-convention',
    'follow-versioned-spec-lifecycle-and-exact-mutation-authority-3-agents-claim-completion-against-acceptance-criteria-verification-external-no-agent-verifies',
  ],
  'spec-convention:item.7a55cf4f2295': [
    'parcel.spec-convention',
    'follow-versioned-spec-lifecycle-and-exact-mutation-authority-4-gate-3-human-owned-unless-delegation-proven-at-merge-time-delegation',
  ],
  'spec-convention:item.efb0769d6ff2': [
    'parcel.spec-convention',
    'follow-versioned-spec-lifecycle-and-exact-mutation-authority-1-exact-replacement-text-supplied-coordinator-coordinator-provides-literal-text-land-document',
  ],
  'spec-convention:item.513e18f22be3': [
    'parcel.spec-convention',
    'follow-versioned-spec-lifecycle-and-exact-mutation-authority-2-committed-alone-parcel-worktree-before-any-implementing-code-amendment-commit-touches',
  ],
  'spec-convention:item.6dbbca88286f': [
    'parcel.spec-convention',
    'follow-versioned-spec-lifecycle-and-exact-mutation-authority-3-commit-message-explicitly-identifies-coordinator-amendment-not-generic-message-message-must',
  ],
  'spec-convention:item.e6f5fa8543a1': [
    'permission-profile.registry-state',
    'convention-deferred-registry-and-self-authority-boundary',
  ],
  'spec-convention:item.ac5ff7afd06f': ['spec.mutation-authority', 'surfaces-routing-only'],
  'spec-convention:item.5145ab15549c': ['spec.mutation-authority', 'exact-allowed-files-required'],
  'spec-convention:item.fd82127bf9f9': ['spec.mutation-authority', 'exact-allowed-files-required'],
  'spec-convention:item.022fc00afe7b': ['gate3.merge-authority', 'human-unless-live-proof'],
  'coordinator-pattern:item.38dbf3185a76': [
    'goal.coordination-model',
    'mutual-decisions-ratified-before-dispatch-1-intake-developer-brings-concept-sentence-page-coordinator-interrogates-what-does-done',
  ],
  'coordinator-pattern:item.84b4e388c06b': [
    'goal.coordination-model',
    'mutual-decisions-ratified-before-dispatch-2-ideation-mutual-coordinator-proposes-developer-disposes-open-design-questions-surfaced-explicit',
  ],
  'coordinator-pattern:item.d62734f662a0': [
    'goal.coordination-model',
    'mutual-decisions-ratified-before-dispatch-3-commentary-not-change-request-treat-developer-s-reaction-rationale-question-preference',
  ],
  'coordinator-pattern:item.00f63e7818bc': [
    'goal.coordination-model',
    'mutual-decisions-ratified-before-dispatch-4-output-goal-charter-one-document-containing-objective-locked-decisions-d1-dn',
  ],
  'coordinator-pattern:item.a3d15fe678e1': [
    'goal.coordination-model',
    'mutual-decisions-ratified-before-dispatch-5-gate-1-ratification-developer-approves-charter-explicitly-gate-can-never-delegated',
  ],
  'coordinator-pattern:item.dedbefc1b097': [
    'goal.coordination-model',
    'mutual-decisions-ratified-before-dispatch-1-charter-ratification-stage-zero-exit-never',
  ],
  'coordinator-pattern:item.91dd60b00fd6': [
    'goal.coordination-model',
    'mutual-decisions-ratified-before-dispatch-2-dispatch-approval-parcel-set-kickstarter-yes-standing-authorization-scoped-charter-s',
  ],
  'coordinator-pattern:item.f7686ab58db7': ['gate3.merge-authority', 'contingent-delegation'],
  'goal-skill:item.02636597cc8d': [
    'goal.ratification-lifecycle',
    'interrogate-charter-and-obtain-explicit-gate-one-1-interrogate-concept-what-does-done-mean-who-consumes-result-what-deliberately',
  ],
  'goal-skill:item.fa27a05811dd': [
    'goal.ratification-lifecycle',
    'interrogate-charter-and-obtain-explicit-gate-one-2-draft-goal-charter-at-objective-locked-decisions-d1-dn-reasoning-wave',
  ],
  'goal-skill:item.8fda5f4d9776': [
    'goal.ratification-lifecycle',
    'interrogate-charter-and-obtain-explicit-gate-one-3-gate-1-present-charter-s-decision-list-developer-explicit-ratification-gate',
  ],
  'standing-constraints:item.constraint-1': [
    'external-boundary.error-contract',
    'typed-module-error-required',
  ],
  'standing-constraints:item.constraint-2': [
    'untested-seam.return-trust',
    'unknown-until-normalized',
  ],
  'standing-constraints:item.constraint-3': [
    'default-deny.structural-testing',
    'each-invariant-tested-independently',
  ],
  'standing-constraints:item.constraint-4': [
    'line-protocol.emission-safety',
    'external-data-sanitized',
  ],
  'standing-constraints:item.constraint-5': [
    'untrusted-text.parse-complexity',
    'linear-time-required',
  ],
  'standing-constraints:item.constraint-12': ['parcel.byte-freeze-placement', 'parcel-time-only'],
  'standing-constraints:item.constraint-13': [
    'allowlist.binding-dimensions',
    'identity-location-value-required',
  ],
  'standing-constraints:item.constraint-6': [
    'classifier.fixture-coverage',
    'real-naming-and-false-negatives-covered',
  ],
  'standing-constraints:item.constraint-7': [
    'kompress.payload-ceiling',
    'oversize-requires-coordinator-ruling',
  ],
  'standing-constraints:item.constraint-8': [
    'review.hostile-probing',
    'one-off-live-probes-licensed',
  ],
  'standing-constraints:item.constraint-9': [
    'review.prose-ambiguity',
    'naive-reading-must-be-excluded',
  ],
  'standing-constraints:item.constraint-10': [
    'review.worktree-integrity',
    'post-review-git-detection-required',
  ],
  'standing-constraints:item.constraint-11': [
    'review.assertion-binding',
    'mutation-probe-required',
  ],
  'standing-constraints:item.c5880644c95c': [
    'standing.provenance',
    'inline-rules-required-until-provenance-restored',
  ],
  'parcel-driven-development:item.hard-rule-1': [
    'parcel.contract-sequencing',
    'contracts-before-parallel-work',
  ],
  'parcel-driven-development:item.hard-rule-2': [
    'parcel.execution-isolation',
    'one-branch-one-worktree',
  ],
  'parcel-driven-development:item.hard-rule-3': [
    'parcel.review-independence',
    'independently-reviewable',
  ],
  'parcel-driven-development:item.hard-rule-4': [
    'parcel.mutation-authority',
    'exact-files-required',
  ],
  'parcel-driven-development:item.hard-rule-5': [
    'parcel.shared-file-serialization',
    'serialization-required',
  ],
  'parcel-driven-development:item.hard-rule-6': ['parcel.pre-pr-base', 'rebase-before-pr'],
  'parcel-driven-development:item.hard-rule-7': ['parcel.verification', 'verification-required'],
  'parcel-driven-development:item.hard-rule-8': [
    'parcel.missing-product-decision',
    'stop-and-escalate',
  ],
  'parcel-driven-development:item.hard-rule-9': [
    'parcel.contract-amendment',
    'no-silent-contract-change',
  ],
  'parcel-driven-development:item.hard-rule-10': [
    'parcel.sensitive-data-safety',
    'no-secrets-pii-or-payload-dumps',
  ],
  'parcel-driven-development:item.hard-rule-11': [
    'integration-surface.scenarios',
    'positive-negative-failure-required',
  ],
  'parcel-driven-development:item.hard-rule-12': [
    'release.security-gate',
    'security-evidence-blocks-release',
  ],
  'parcel-driven-development:item.hard-rule-13': [
    'coordination.persistence',
    'durable-state-before-closure',
  ],
  'parcel-driven-development:item.hard-rule-14': [
    'scenario.environment-identity',
    'environment-build-config-bound',
  ],
  'parcel-driven-development:item.hard-rule-15': [
    'release.claim-evidence',
    'evidence-required-for-claim',
  ],
  'parcel-driven-development:item.b7563a79cc57': [
    'parcel.review-checklist',
    'verify-contract-scope-safety-evidence-and-handoff-1-does-implementation-match-contract',
  ],
  'parcel-driven-development:item.400cc2cfd0d5': [
    'parcel.review-checklist',
    'verify-contract-scope-safety-evidence-and-handoff-2-only-allowed-files-touched',
  ],
  'parcel-driven-development:item.303fe3f67dae': [
    'parcel.review-checklist',
    'verify-contract-scope-safety-evidence-and-handoff-3-were-forbidden-items-respected',
  ],
  'parcel-driven-development:item.f1add5311b6c': [
    'parcel.review-checklist',
    'verify-contract-scope-safety-evidence-and-handoff-4-did-parcel-respect-out-scope',
  ],
  'parcel-driven-development:item.9d8d06d91590': [
    'parcel.review-checklist',
    'verify-contract-scope-safety-evidence-and-handoff-5-did-agent-avoid-silent-product-decisions',
  ],
  'parcel-driven-development:item.dbee4594f901': [
    'parcel.review-checklist',
    'verify-contract-scope-safety-evidence-and-handoff-6-were-required-tests-manual-verification-completed-exactly-specified',
  ],
  'parcel-driven-development:item.7a8af4ddaa1e': [
    'parcel.review-checklist',
    'verify-contract-scope-safety-evidence-and-handoff-7-did-parcel-avoid-secrets-pii-unsafe-logs-payload-dumps',
  ],
  'parcel-driven-development:item.98f93a29441d': [
    'parcel.review-checklist',
    'verify-contract-scope-safety-evidence-and-handoff-8-if-crossing-supportability-boundaries-were-logs-metrics-traces-handled-appropriately',
  ],
  'parcel-driven-development:item.e4751682430a': [
    'parcel.review-checklist',
    'verify-contract-scope-safety-evidence-and-handoff-9-if-crossing-integration-boundaries-was-relevant-surface-updated-referenced',
  ],
  'parcel-driven-development:item.72c60fa596e7': [
    'parcel.review-checklist',
    'verify-contract-scope-safety-evidence-and-handoff-10-if-security-gate-applies-was-required-security-evidence-produced-tracked',
  ],
  'parcel-driven-development:item.754e096cfecf': [
    'parcel.review-checklist',
    'verify-contract-scope-safety-evidence-and-handoff-11-was-session-handoff-completed',
  ],
  'parcel-driven-development:item.876882377a6a': [
    'parcel.review-checklist',
    'verify-contract-scope-safety-evidence-and-handoff-12-was-persistent-coordinator-state-updated-if-required-parcel-fails-gets-sent',
  ],
  'foreman-line-plan:item.two-gate-thesis': ['gate.namespace', 'historical-two-stage-gates'],
  'foreman-line-plan:item.c92333c21e64': ['gate3.merge-authority', 'human-owned-nondelegated'],
  'approval-readme:item.4261d18b3243': [
    'stage-approval.tty-presence',
    'live-interactive-tty-required',
  ],
  'approval-readme:item.ff6f38f088ae': [
    'stage-approval.confirmation-and-mint',
    'typed-confirmation-and-approver-required-before-mint',
  ],
  'spec-frontmatter-schema:item.bdf997c3cd45': [
    'permission-profile.registry-state',
    'six-profile-live-enum',
  ],
  'spec-linter-validator:item.c6669b61c6f0': [
    'spec.validation.ajv-configuration',
    'all-schema-errors-are-collected',
  ],
  'spec-linter-validator:item.256b9064bc47': [
    'spec.validation.supersession-invariant',
    'superseded-status-requires-a-replacement',
  ],
  'spec-linter-validator:item.092d2fc43a32': [
    'permission-profile.missing-field-warning',
    'absence-emits-advisory-unless-suppressed',
  ],
  'spec-linter-validator:item.fb7d76a32df4': [
    'permission-profile.missing-field-warning-text',
    'advisory-points-to-registry-profile-name',
  ],
  'spec-linter-validator:item.80563af1788e': [
    'spec.mutation-authority',
    'frontmatter-only-no-body-compiler',
  ],
  'spec-linter-cli:item.0479c603add5': [
    'spec-linter.exit-code.zero',
    'valid-specs-exit-zero-despite-advisory-warnings',
  ],
  'spec-linter-cli:item.fb268f5c5eb4': [
    'spec-linter.exit-code.one',
    'schema-or-semantic-violations-exit-one',
  ],
  'spec-linter-cli:item.66fec8a20db5': [
    'spec-linter.exit-code.two',
    'usage-and-input-errors-exit-two',
  ],
  'spec-linter-cli:item.39787f778432': [
    'spec-linter.process-entrypoint',
    'process-exit-code-is-set-from-cli-run-result',
  ],
  'spec-linter-readme:item.9a889881a236': [
    'permission-profile.registry-state',
    'readme-interim-optional-nonempty-string',
  ],
  'spec-linter-readme:item.b4f5d76d68ec': [
    'permission-profile.registry-state',
    'readme-deferred-enum-promotion',
  ],
  'permission-profiles-registry:item.ffd2209ab94a': [
    'permission-profile.reviewer-deny-git-commit',
    'bash-git-commit-is-configured-denied',
  ],
  'permission-profiles-types:item.0b9706b5a9bf': [
    'permission-profile.supported-modes',
    'default-accept-edits-and-plan-only',
  ],
  'permission-profiles-types:item.bc257b03aa99': [
    'permission-profile.names',
    'six-profile-name-constant-is-exported',
  ],
  'permission-profiles-validator:item.dcd8638af4a4': [
    'permission-profile.reviewer-mutation-commands',
    'five-git-mutation-verbs-are-enumerated',
  ],
  'permission-profiles-validator:item.9c3c17055384': [
    'permission-profile.bypass-mode',
    'bypass-permissions-mode-is-rejected',
  ],
  'permission-profiles-validator:item.4da758cc157c': [
    'permission-profile.reviewer-restriction-completeness',
    'reviewer-deny-set-is-checked-for-edit-write-and-git-mutations',
  ],
  'permission-profiles-validator:item.ffd598413a66': [
    'permission-profile.reviewer-shell-preservation',
    'bare-bash-and-powershell-denial-is-rejected',
  ],
  'permission-profiles-readme:item.729be3615f8d': [
    'permission-profile.enforcement-bound',
    'deny-and-ask-are-restriction-mechanisms',
  ],
  'permission-profiles-readme:item.d11b9d38f924': [
    'permission-profile.enforcement-bound',
    'profile-constrains-only-loaded-sessions',
  ],
  'permission-profiles-readme:item.1101805f1c9e': [
    'permission-profile.enforcement-bound',
    'bypass-mode-voids-denials',
  ],
  'permission-profiles-readme:item.415efa3f5e3b': [
    'permission-profile.enforcement-bound',
    'shell-residual-is-reduced-not-eliminated',
  ],
  'permission-profiles-registry:item.1ec33a4741eb': [
    'permission-profile.builder-architecture.ask.empty-set',
    'configured-human-prompt',
  ],
  'permission-profiles-registry:item.7faf78a6f54a': [
    'permission-profile.builder-architecture.deny.bash-git-push-force',
    'configured-denial',
  ],
  'permission-profiles-registry:item.26c5e2b211da': [
    'permission-profile.builder-architecture.deny.bash-git-push-f',
    'configured-denial',
  ],
  'permission-profiles-registry:item.1d221ed65b72': [
    'permission-profile.builder-architecture.deny.edit-claude',
    'configured-denial',
  ],
  'permission-profiles-registry:item.1ce0fd439b3e': [
    'permission-profile.builder-architecture.deny.powershell-git-push-force',
    'configured-denial',
  ],
  'permission-profiles-registry:item.39e65fb31709': [
    'permission-profile.builder-architecture.deny.powershell-git-push-f',
    'configured-denial',
  ],
  'permission-profiles-registry:item.ffd949ad76c3': [
    'permission-profile.builder-architecture.deny.write-claude',
    'configured-denial',
  ],
  'permission-profiles-registry:item.c9cb62068f14': [
    'permission-profile.builder-architecture.network-egress.empty-set',
    'configured-network-posture',
  ],
  'permission-profiles-registry:item.13033f70c124': [
    'permission-profile.builder-deps.ask.empty-set',
    'configured-human-prompt',
  ],
  'permission-profiles-registry:item.947d19fbeb35': [
    'permission-profile.builder-deps.deny.bash-git-push-force',
    'configured-denial',
  ],
  'permission-profiles-registry:item.5a359d80896b': [
    'permission-profile.builder-deps.deny.bash-git-push-f',
    'configured-denial',
  ],
  'permission-profiles-registry:item.ee0641be06f2': [
    'permission-profile.builder-deps.deny.edit-claude',
    'configured-denial',
  ],
  'permission-profiles-registry:item.cf29180bce81': [
    'permission-profile.builder-deps.deny.powershell-git-push-force',
    'configured-denial',
  ],
  'permission-profiles-registry:item.4f213acde8e0': [
    'permission-profile.builder-deps.deny.powershell-git-push-f',
    'configured-denial',
  ],
  'permission-profiles-registry:item.397a3eb4c7ad': [
    'permission-profile.builder-deps.deny.write-claude',
    'configured-denial',
  ],
  'permission-profiles-registry:item.f0613939994f': [
    'permission-profile.builder-deps.network-egress.empty-set',
    'configured-network-posture',
  ],
  'permission-profiles-registry:item.58ef984a0faa': [
    'permission-profile.builder-deps.network-notes.empty-set',
    'configured-network-posture',
  ],
  'permission-profiles-registry:item.50cd9c68ff51': [
    'permission-profile.builder-standard.ask.empty-set',
    'configured-human-prompt',
  ],
  'permission-profiles-registry:item.b9e7c5644f49': [
    'permission-profile.builder-standard.deny.bash-git-push-force',
    'configured-denial',
  ],
  'permission-profiles-registry:item.861d14c80da2': [
    'permission-profile.builder-standard.deny.bash-git-push-f',
    'configured-denial',
  ],
  'permission-profiles-registry:item.fe1bbb0564f6': [
    'permission-profile.builder-standard.deny.edit-claude',
    'configured-denial',
  ],
  'permission-profiles-registry:item.803732fe3411': [
    'permission-profile.builder-standard.deny.powershell-git-push-force',
    'configured-denial',
  ],
  'permission-profiles-registry:item.b77e9988c19d': [
    'permission-profile.builder-standard.deny.powershell-git-push-f',
    'configured-denial',
  ],
  'permission-profiles-registry:item.8cf9d57aa29c': [
    'permission-profile.builder-standard.deny.write-claude',
    'configured-denial',
  ],
  'permission-profiles-registry:item.0ed672bcdee8': [
    'permission-profile.builder-standard.network-egress.empty-set',
    'configured-network-posture',
  ],
  'permission-profiles-registry:item.bbb2cdb40927': [
    'permission-profile.coordinator.ask.empty-set',
    'configured-human-prompt',
  ],
  'permission-profiles-registry:item.b01d14453456': [
    'permission-profile.coordinator.deny.bash-git-push-force',
    'configured-denial',
  ],
  'permission-profiles-registry:item.315ebd655fbe': [
    'permission-profile.coordinator.deny.bash-git-push-f',
    'configured-denial',
  ],
  'permission-profiles-registry:item.8e8e3c78500b': [
    'permission-profile.coordinator.deny.edit-claude',
    'configured-denial',
  ],
  'permission-profiles-registry:item.4c9cd1062bc6': [
    'permission-profile.coordinator.deny.powershell-git-push-force',
    'configured-denial',
  ],
  'permission-profiles-registry:item.060989ad78ea': [
    'permission-profile.coordinator.deny.powershell-git-push-f',
    'configured-denial',
  ],
  'permission-profiles-registry:item.30b62f67dc13': [
    'permission-profile.coordinator.deny.write-claude',
    'configured-denial',
  ],
  'permission-profiles-registry:item.7417033cefc7': [
    'permission-profile.reviewer-readonly.ask.empty-set',
    'configured-human-prompt',
  ],
  'permission-profiles-registry:item.f7f03a01fd3a': [
    'permission-profile.reviewer-readonly.deny.bash-git-apply',
    'configured-denial',
  ],
  'permission-profiles-registry:item.35cf0f58fc34': [
    'permission-profile.reviewer-readonly.deny.bash-git-commit',
    'configured-denial',
  ],
  'permission-profiles-registry:item.dedb7349c943': [
    'permission-profile.reviewer-readonly.deny.bash-git-merge',
    'configured-denial',
  ],
  'permission-profiles-registry:item.b7ab94d73ef4': [
    'permission-profile.reviewer-readonly.deny.bash-git-push',
    'configured-denial',
  ],
  'permission-profiles-registry:item.9ab0d5db8ebf': [
    'permission-profile.reviewer-readonly.deny.bash-git-stash',
    'configured-denial',
  ],
  'permission-profiles-registry:item.ea8666a98ca1': [
    'permission-profile.reviewer-readonly.deny.edit',
    'configured-denial',
  ],
  'permission-profiles-registry:item.3a54e390a3e1': [
    'permission-profile.reviewer-readonly.deny.edit-claude',
    'configured-denial',
  ],
  'permission-profiles-registry:item.eb314ad28f5e': [
    'permission-profile.reviewer-readonly.deny.powershell-git-apply',
    'configured-denial',
  ],
  'permission-profiles-registry:item.14569d4abb87': [
    'permission-profile.reviewer-readonly.deny.powershell-git-commit',
    'configured-denial',
  ],
  'permission-profiles-registry:item.7943c5773fba': [
    'permission-profile.reviewer-readonly.deny.powershell-git-merge',
    'configured-denial',
  ],
  'permission-profiles-registry:item.2ca898541627': [
    'permission-profile.reviewer-readonly.deny.powershell-git-push',
    'configured-denial',
  ],
  'permission-profiles-registry:item.23838f138908': [
    'permission-profile.reviewer-readonly.deny.powershell-git-stash',
    'configured-denial',
  ],
  'permission-profiles-registry:item.6d850a4b4948': [
    'permission-profile.reviewer-readonly.deny.write',
    'configured-denial',
  ],
  'permission-profiles-registry:item.f1d63df02914': [
    'permission-profile.reviewer-readonly.deny.write-claude',
    'configured-denial',
  ],
  'permission-profiles-registry:item.8c5085e2ff63': [
    'permission-profile.shaping-agent.ask.empty-set',
    'configured-human-prompt',
  ],
  'permission-profiles-registry:item.60eb2cbc6f43': [
    'permission-profile.shaping-agent.deny.bash-git-push-force',
    'configured-denial',
  ],
  'permission-profiles-registry:item.1e0db040f9d8': [
    'permission-profile.shaping-agent.deny.bash-git-push-f',
    'configured-denial',
  ],
  'permission-profiles-registry:item.e477240aeb8e': [
    'permission-profile.shaping-agent.deny.edit-claude',
    'configured-denial',
  ],
  'permission-profiles-registry:item.074c70cc9d55': [
    'permission-profile.shaping-agent.deny.edit-apps',
    'configured-denial',
  ],
  'permission-profiles-registry:item.5705a054df96': [
    'permission-profile.shaping-agent.deny.edit-config',
    'configured-denial',
  ],
  'permission-profiles-registry:item.b6db9d1f4737': [
    'permission-profile.shaping-agent.deny.edit-plugins',
    'configured-denial',
  ],
  'permission-profiles-registry:item.92b60e67dfba': [
    'permission-profile.shaping-agent.deny.edit-skills',
    'configured-denial',
  ],
  'permission-profiles-registry:item.b8a82b2446d9': [
    'permission-profile.shaping-agent.deny.powershell-git-push-force',
    'configured-denial',
  ],
  'permission-profiles-registry:item.1fa440b2fe59': [
    'permission-profile.shaping-agent.deny.powershell-git-push-f',
    'configured-denial',
  ],
  'permission-profiles-registry:item.3641610e292b': [
    'permission-profile.shaping-agent.deny.write-claude',
    'configured-denial',
  ],
  'permission-profiles-registry:item.854101218a6d': [
    'permission-profile.shaping-agent.deny.write-apps',
    'configured-denial',
  ],
  'permission-profiles-registry:item.e4d0bc5dc904': [
    'permission-profile.shaping-agent.deny.write-config',
    'configured-denial',
  ],
  'permission-profiles-registry:item.7b5310ad887b': [
    'permission-profile.shaping-agent.deny.write-plugins',
    'configured-denial',
  ],
  'permission-profiles-registry:item.6ac66b888a40': [
    'permission-profile.shaping-agent.deny.write-skills',
    'configured-denial',
  ],
  'fk-charter:item.a583b7f02950': [
    'goal.ratification-status',
    'fully-ratified-with-scoped-gate1-and-standing-gate2',
  ],
  'fk-charter:item.93d5d3978e5f': [
    'standing-constraints.read-obligation',
    'agents-reread-and-remember-standing-constraints',
  ],
  'fk-charter:item.cd014d6d90c5': [
    'gate1.ratification-record',
    'original-and-scoped-reratification-bind-d1-through-d20',
  ],
  'fk-charter:item.144bb836f528': [
    'parcel.fk-p2-spec-compiler',
    'compile-exact-allowed-files-and-reject-path-ambiguity',
  ],
  'fk-charter:item.a087b0ab4c3b': [
    'parcel.fk-p18-ci-backstop',
    'negative-hook-bypass-must-fail-before-promotion',
  ],
  'fk-charter:item.e9ec57edc0a2': ['goal.exit-merge', 'all-parcels-require-human-gate3-merge'],
  'fk-charter:item.8cf027fc811e': [
    'gate1.reratification-status',
    'scoped-r1-r13-reratification-is-in-force',
  ],
  'fk-charter:item.15a44cf50bc6': [
    'gate2.dispatch-grant',
    'coordinator-may-dispatch-fk-p0-through-fk-p21-conditionally',
  ],
  'fk-charter:item.c74628d41600': ['gate3.merge-authority', 'human-owned-nondelegated'],
  'fk-charter:item.d9921c51d7ea': [
    'goal.stop.gate1-ambiguity',
    'stop-when-gate1-or-locked-decision-is-ambiguous',
  ],
  'fk-charter:item.0afd841f51f8': [
    'goal.stop.serialization-ownership',
    'stop-when-owned-serialization-point-has-no-ratified-sequence',
  ],
  'fk-charter:item.2cbbc7ae0192': [
    'goal.stop.user-change-collision',
    'stop-on-user-owned-required-file-collision',
  ],
  'fk-charter:item.b0a3e204145f': [
    'gate1.decision-list-record',
    'ratification-and-dispatch-history-recorded',
  ],
  'fk-plan-review-findings:item.1de06653021c': [
    'gate1.review-reratification-record',
    'r1-through-r13-reopen-closed-and-gate2-active',
  ],
  'spec-convention:item.0979dba6c958': [
    'spec-linter.adoption-standard',
    'org-wide-ci-lint-required-for-specs',
  ],
  'foreman-line-plan:item.75569dd4ae1a': [
    'pipeline.verification-human-review',
    'human-review-required-before-ticket-update',
  ],
  'foreman-line-plan:item.56a15a2f3220': [
    'pipeline.integration-gates',
    'security-scans-and-reviews-required',
  ],
  'foreman-line-plan:item.760cf6497075': [
    'deployment.environment-separation',
    'dogfood-and-customer-tenants-must-not-share-blast-radius',
  ],
  'permission-profiles-readme:item.b3183ee0b5ab': [
    'permission-profile.profile-set',
    'keys-must-exactly-equal-profile-names',
  ],
  'permission-profiles-readme:item.f8c108b3b431': [
    'permission-profile.self-modification-guard',
    'every-profile-denies-edit-and-write-for-claude',
  ],
  'permission-profiles-readme:item.a26beda5342d': [
    'permission-profile.reviewer-restrictions',
    'deny-edit-write-and-enumerated-git-mutations',
  ],
  'permission-profiles-readme:item.27ce8e0a4adc': [
    'permission-profile.reviewer-shell-access',
    'bare-shell-denial-prohibited-for-hostile-probing',
  ],
}

function authorityIdentityFor(
  sourceId: string,
  itemId: string,
): {
  authoritySubject: string
  authorityClaim: string
} | null {
  const identity = CURATED_ITEM_IDENTITIES[`${sourceId}:${itemId}`]
  return identity === undefined
    ? null
    : { authoritySubject: identity[0], authorityClaim: identity[1] }
}
function applicabilityFor(
  classification: RuleClassification,
  goals: SourceDefinition['scope'],
  itemId: string,
) {
  const allRoles = [
    'developer',
    'coordinator',
    'shaper',
    'builder',
    'reviewer',
    'ci',
    'host-adapter',
    'kernel',
    'operator',
  ] as const
  const allHosts = [
    'provider-neutral',
    'claude-windows-docker-loaded',
    'claude-windows-docker-unenrolled',
    'unsupported-host',
    'ci',
  ] as const
  const allStages = [
    'stage-zero',
    'shaping',
    'step-zero',
    'build',
    'deterministic-verify',
    'adversarial-review',
    'merge',
    'closure',
    'runtime',
  ] as const
  const allOperations = [
    'source-inventory',
    'spec-mutation',
    'repo-read',
    'repo-mutation',
    'state-transition',
    'control-call',
    'receipt-validation',
    'external-write',
  ] as const
  const targeted: Readonly<
    Record<
      string,
      {
        roles: AuthorityRule['applicability']['roles']
        stages: AuthorityRule['applicability']['stages']
        operations: AuthorityRule['applicability']['operations']
        hosts: AuthorityRule['applicability']['hosts']
      }
    >
  > = {
    'item.constraint-1': {
      roles: ['builder'],
      stages: ['any'],
      operations: ['any'],
      hosts: ['any'],
    },
    'item.constraint-2': {
      roles: ['builder'],
      stages: ['any'],
      operations: ['any'],
      hosts: ['any'],
    },
    'item.constraint-3': {
      roles: ['builder'],
      stages: ['any'],
      operations: ['any'],
      hosts: ['any'],
    },
    'item.constraint-4': {
      roles: ['builder'],
      stages: ['any'],
      operations: ['any'],
      hosts: ['any'],
    },
    'item.constraint-5': {
      roles: ['builder'],
      stages: ['any'],
      operations: ['any'],
      hosts: ['any'],
    },
    'item.constraint-6': {
      roles: ['builder'],
      stages: ['any'],
      operations: ['any'],
      hosts: ['any'],
    },
    'item.constraint-7': {
      roles: ['builder'],
      stages: ['any'],
      operations: ['control-call'],
      hosts: ['any'],
    },
    'item.constraint-8': {
      roles: ['reviewer'],
      stages: ['adversarial-review'],
      operations: ['repo-read', 'repo-mutation', 'control-call'],
      hosts: ['any'],
    },
    'item.constraint-9': {
      roles: ['reviewer'],
      stages: ['adversarial-review'],
      operations: ['repo-read', 'repo-mutation', 'control-call'],
      hosts: ['any'],
    },
    'item.constraint-10': {
      roles: ['reviewer'],
      stages: ['adversarial-review'],
      operations: ['repo-read', 'repo-mutation', 'control-call'],
      hosts: ['any'],
    },
    'item.constraint-11': {
      roles: ['reviewer'],
      stages: ['adversarial-review'],
      operations: ['repo-read', 'repo-mutation', 'control-call'],
      hosts: ['any'],
    },
    'item.constraint-12': {
      roles: ['coordinator'],
      stages: ['deterministic-verify', 'adversarial-review'],
      operations: ['source-inventory', 'repo-read', 'repo-mutation'],
      hosts: ['any'],
    },
    'item.constraint-13': {
      roles: ['builder'],
      stages: ['any'],
      operations: ['any'],
      hosts: ['any'],
    },
    'item.hard-rule-1': {
      roles: ['shaper', 'builder'],
      stages: ['shaping', 'step-zero', 'build'],
      operations: ['any'],
      hosts: ['any'],
    },
    'item.hard-rule-2': {
      roles: ['coordinator', 'shaper', 'builder', 'reviewer'],
      stages: ['shaping', 'step-zero', 'build', 'adversarial-review'],
      operations: ['any'],
      hosts: ['any'],
    },
    'item.hard-rule-3': {
      roles: ['shaper', 'builder'],
      stages: ['shaping', 'step-zero', 'build'],
      operations: ['any'],
      hosts: ['any'],
    },
    'item.hard-rule-4': {
      roles: ['shaper', 'builder'],
      stages: ['shaping', 'step-zero', 'build'],
      operations: ['repo-mutation'],
      hosts: ['any'],
    },
    'item.hard-rule-5': {
      roles: ['shaper', 'builder'],
      stages: ['shaping', 'step-zero', 'build'],
      operations: ['repo-mutation'],
      hosts: ['any'],
    },
    'item.hard-rule-6': {
      roles: ['coordinator', 'builder'],
      stages: ['build'],
      operations: ['repo-mutation'],
      hosts: ['any'],
    },
    'item.hard-rule-7': {
      roles: ['builder', 'ci'],
      stages: ['build', 'deterministic-verify'],
      operations: ['any'],
      hosts: ['any'],
    },
    'item.hard-rule-8': {
      roles: ['builder'],
      stages: ['build'],
      operations: ['repo-mutation'],
      hosts: ['any'],
    },
    'item.hard-rule-9': {
      roles: ['coordinator', 'builder'],
      stages: ['build'],
      operations: ['repo-mutation'],
      hosts: ['any'],
    },
    'item.hard-rule-10': {
      roles: ['any'],
      stages: ['any'],
      operations: ['any'],
      hosts: ['any'],
    },
    'item.b1ac4aa9eddf': {
      roles: ['coordinator'],
      stages: ['merge'],
      operations: ['state-transition'],
      hosts: allHosts,
    },
    'item.f7686ab58db7': {
      roles: ['coordinator'],
      stages: ['merge'],
      operations: ['state-transition'],
      hosts: allHosts,
    },
    'item.022fc00afe7b': {
      roles: ['coordinator'],
      stages: ['merge'],
      operations: ['state-transition'],
      hosts: allHosts,
    },
    'item.c92333c21e64': {
      roles: ['coordinator'],
      stages: ['merge'],
      operations: ['state-transition'],
      hosts: allHosts,
    },
    'item.hard-rule-11': {
      roles: ['shaper', 'builder', 'reviewer'],
      stages: ['shaping', 'step-zero', 'build', 'adversarial-review'],
      operations: ['any'],
      hosts: ['any'],
    },
    'item.hard-rule-12': {
      roles: ['coordinator', 'reviewer', 'ci'],
      stages: ['deterministic-verify', 'adversarial-review', 'merge'],
      operations: ['state-transition'],
      hosts: ['any'],
    },
    'item.hard-rule-13': {
      roles: ['coordinator'],
      stages: ['build', 'merge', 'closure'],
      operations: ['state-transition'],
      hosts: ['any'],
    },
    'item.hard-rule-14': {
      roles: ['coordinator', 'builder', 'reviewer', 'ci'],
      stages: ['deterministic-verify', 'adversarial-review', 'merge'],
      operations: ['source-inventory', 'state-transition'],
      hosts: ['any'],
    },
    'item.hard-rule-15': {
      roles: ['coordinator', 'builder', 'reviewer', 'ci'],
      stages: ['deterministic-verify', 'adversarial-review', 'merge'],
      operations: ['source-inventory', 'state-transition'],
      hosts: ['any'],
    },
    'item.d3': {
      roles: ['coordinator', 'builder', 'reviewer', 'host-adapter', 'kernel'],
      stages: ['build', 'runtime'],
      operations: ['state-transition', 'control-call'],
      hosts: ['provider-neutral', 'claude-windows-docker-loaded'],
    },
    'item.d2': {
      roles: ['builder', 'reviewer', 'kernel'],
      stages: ['build', 'deterministic-verify', 'runtime'],
      operations: ['repo-mutation', 'state-transition'],
      hosts: ['any'],
    },
    'item.d18': {
      roles: ['builder', 'reviewer', 'host-adapter', 'kernel'],
      stages: ['build', 'deterministic-verify', 'runtime'],
      operations: ['repo-mutation', 'control-call'],
      hosts: ['any'],
    },
    'item.d5': {
      roles: allRoles,
      stages: ['build', 'deterministic-verify', 'runtime'],
      operations: ['receipt-validation'],
      hosts: allHosts,
    },
    'item.d7': {
      roles: ['builder', 'reviewer', 'host-adapter', 'kernel'],
      stages: ['build', 'deterministic-verify', 'runtime'],
      operations: ['repo-mutation', 'control-call'],
      hosts: [
        'claude-windows-docker-loaded',
        'claude-windows-docker-unenrolled',
        'unsupported-host',
      ],
    },
    'item.d9': {
      roles: ['developer', 'coordinator', 'builder', 'reviewer', 'kernel', 'operator'],
      stages: ['stage-zero', 'step-zero', 'adversarial-review', 'merge', 'closure'],
      operations: ['state-transition', 'control-call'],
      hosts: allHosts,
    },
    'item.d10': {
      roles: ['coordinator', 'builder', 'reviewer', 'kernel'],
      stages: ['step-zero', 'build', 'deterministic-verify'],
      operations: ['spec-mutation', 'repo-mutation'],
      hosts: allHosts,
    },
    'item.d11': {
      roles: ['coordinator', 'builder', 'reviewer', 'ci', 'kernel'],
      stages: ['deterministic-verify', 'adversarial-review'],
      operations: ['source-inventory', 'repo-mutation'],
      hosts: ['provider-neutral', 'claude-windows-docker-loaded', 'ci'],
    },
    'item.d13': {
      roles: ['builder', 'reviewer', 'ci', 'host-adapter', 'kernel'],
      stages: ['build', 'deterministic-verify', 'adversarial-review', 'merge', 'runtime'],
      operations: ['repo-mutation'],
      hosts: allHosts,
    },
    'item.d15': {
      roles: allRoles,
      stages: allStages,
      operations: ['external-write'],
      hosts: allHosts,
    },
    'item.d17': {
      roles: ['coordinator', 'builder', 'reviewer', 'host-adapter', 'kernel', 'operator'],
      stages: ['build', 'deterministic-verify', 'adversarial-review', 'runtime'],
      operations: ['control-call', 'receipt-validation'],
      hosts: allHosts,
    },
    'item.d19': {
      roles: ['builder', 'reviewer', 'host-adapter', 'kernel'],
      stages: ['build', 'deterministic-verify', 'runtime'],
      operations: ['repo-read'],
      hosts: allHosts,
    },
    'item.d20': {
      roles: [
        'developer',
        'coordinator',
        'builder',
        'reviewer',
        'host-adapter',
        'kernel',
        'operator',
      ],
      stages: ['deterministic-verify', 'adversarial-review', 'runtime'],
      operations: ['repo-read', 'repo-mutation', 'control-call'],
      hosts: ['claude-windows-docker-loaded', 'unsupported-host'],
    },
  }
  if (targeted[itemId] !== undefined) return { goals, ...targeted[itemId] }
  if (classification === 'ci-static-check') {
    return {
      goals,
      roles: ['ci'] as const,
      stages: ['deterministic-verify'] as const,
      operations: allOperations,
      hosts: ['ci'] as const,
    }
  }
  if (classification === 'independent-review-human-judgment') {
    return {
      goals,
      roles: ['reviewer'] as const,
      stages: ['adversarial-review', 'merge'] as const,
      operations: allOperations,
      hosts: allHosts,
    }
  }
  if (classification === 'post-action-detection') {
    return {
      goals,
      roles: ['coordinator', 'reviewer', 'ci'] as const,
      stages: ['deterministic-verify', 'adversarial-review', 'merge'] as const,
      operations: allOperations,
      hosts: allHosts,
    }
  }
  return { goals, roles: allRoles, stages: allStages, operations: allOperations, hosts: allHosts }
}

function ruleShape(
  classification: RuleClassification,
): Pick<AuthorityRule, 'decision' | 'refusalCode' | 'enforcementOwner' | 'assurance'> {
  switch (classification) {
    case 'pre-action-refusal':
      return {
        decision: 'REFUSE',
        refusalCode: 'FK_CANON_RULE_REFUSED',
        enforcementOwner: 'kernel-policy',
        assurance: 'structural',
      }
    case 'independent-review-human-judgment':
      return {
        decision: 'REQUIRE_HUMAN',
        refusalCode: null,
        enforcementOwner: 'independent-reviewer',
        assurance: 'independently-verified',
      }
    case 'ci-static-check':
      return {
        decision: 'ADVISORY',
        refusalCode: null,
        enforcementOwner: 'ci',
        assurance: 'detected',
      }
    case 'post-action-detection':
      return {
        decision: 'ADVISORY',
        refusalCode: null,
        enforcementOwner: 'coordinator',
        assurance: 'detected',
      }
    case 'unsupported':
      return {
        decision: 'ADVISORY',
        refusalCode: null,
        enforcementOwner: 'none',
        assurance: 'narrative',
      }
    default:
      return {
        decision: 'ADVISORY',
        refusalCode: null,
        enforcementOwner: 'provenance-only',
        assurance: 'narrative',
      }
  }
}

function shortId(value: string): string {
  return sha256(value).slice(0, 12)
}

function buildSource(definition: SourceDefinition): {
  source: CanonSource
  rules: AuthorityRule[]
} {
  const absolutePath = join(repoRoot, ...definition.path.split('/'))
  const bytes = readFileSync(absolutePath)
  const content = bytes.toString('utf8')
  const baseLocated =
    definition.anchors === undefined
      ? [
          ...headingLocators(content),
          ...(definition.sourceId === 'fk-charter' || definition.sourceId === 'fk-loop-directive'
            ? []
            : numberedItems(content)),
        ]
      : definition.anchors.map((anchor, index) => ({
          locator: { kind: 'line-excerpt', anchor, lineHint: index + 1 } as SourceLocator,
          text: anchor,
        }))
  const additional = (definition.additionalAnchors ?? []).map((anchor, index) => ({
    locator: { kind: 'line-excerpt', anchor, lineHint: index + 1 } as SourceLocator,
    text: anchor,
  }))
  const curated = [...baseLocated, ...additional]
  curated.push(...markdownBindingBlocks(content, definition.sourceId))
  if (definition.path.endsWith('.ts')) curated.push(...tsConstructs(content))
  if (definition.path.endsWith('.json')) curated.push(...jsonConstraints(content))
  if (definition.sourceId === 'permission-profiles-registry') {
    curated.push(...permissionProfileRules(content))
  }
  if (definition.sourceId === 'fk-charter') {
    curated.unshift(
      ...tableRows(
        content,
        Array.from({ length: 20 }, (_, index) => `D${index + 1}`),
      ),
    )
  }
  if (definition.sourceId === 'fk-plan-review-findings') {
    curated.unshift(
      ...tableRows(
        content,
        Array.from({ length: 13 }, (_, index) => `R${index + 1}`),
      ),
    )
  }
  if (definition.sourceId === 'foreman-line-plan') {
    const thesis = content
      .replace(/\r\n?/g, '\n')
      .split('\n')
      .find((line) => line.startsWith('**Thesis:**'))
    if (thesis === undefined) throw new Error('historical two-gate thesis is missing')
    curated.unshift({
      locator: { kind: 'line-excerpt', anchor: thesis, lineHint: 1 },
      text: thesis,
    })
  }
  const unique = new Map<string, LocatedText>()
  for (const entry of curated) {
    unique.set(`${entry.locator.kind}\u0000${entry.locator.anchor}`, entry)
  }
  const explicitTableStatements = new Set(
    [...unique.values()]
      .filter((entry) => entry.locator.kind === 'table-row')
      .map((entry) => normalizeRuleText(entry.text)),
  )
  const located = [...unique.values()].filter(
    (entry) =>
      !(
        entry.locator.kind === 'line-excerpt' &&
        entry.locator.anchor.includes(':table-row:') &&
        explicitTableStatements.has(normalizeRuleText(entry.text))
      ),
  )
  if (located.length === 0) throw new Error(`source '${definition.path}' has no inventory locators`)
  const rules: AuthorityRule[] = []
  const inventoryItems = located.map((entry) => {
    const { locator, text } = entry
    const normalizedExcerpt = normalizeRuleText(text)
    const itemId = itemIdFor(definition, entry)
    const valueDigest = sha256(normalizedExcerpt)
    if (locator.kind === 'heading') {
      return {
        itemId,
        locator,
        normalizedExcerpt,
        valueDigest,
        ruleIds: [],
        exclusionDisposition: 'heading-only' as const,
        rationale: `Heading ${locator.anchor} is structural navigation; its complete body items carry the operative rules.`,
      }
    }
    const authorityIdentity = authorityIdentityFor(definition.sourceId, itemId)
    if (authorityIdentity === null) {
      const structuralCoverage =
        locator.kind === 'symbol' &&
        (locator.anchor.startsWith('ts-') || locator.anchor.startsWith('json-pointer:'))
      return {
        itemId,
        locator,
        normalizedExcerpt,
        valueDigest,
        ruleIds: [],
        exclusionDisposition: structuralCoverage
          ? locator.anchor.startsWith('json-pointer:')
            ? ('schema-container' as const)
            : ('structural-ast' as const)
          : ('non-normative-explanation' as const),
        rationale: structuralCoverage
          ? `Inventory item ${itemId} at ${locator.anchor} provides structural change coverage and does not independently state authority.`
          : `Inventory item ${itemId} at ${locator.anchor} is explanatory context and does not state an independent normative authority rule.`,
      }
    }
    const ruleId = `rule.${definition.sourceId}.${itemId.replace(/^item\./, '')}`
    const sourceRef: SourceRef = {
      sourceId: definition.sourceId,
      itemId,
      locatorDigest: locatorDigestFor(locator),
      valueDigest,
    }
    const classification = classificationFor(definition.sourceId, itemId)
    const baseSemantics = ruleShape(classification)
    const semantics =
      definition.sourceId === 'permission-profiles-validator' &&
      classification === 'pre-action-refusal'
        ? {
            ...baseSemantics,
            enforcementOwner: 'host-adapter' as const,
            assurance: 'mediated' as const,
          }
        : baseSemantics
    const baseRule: AuthorityRule = {
      ruleId,
      ...authorityIdentity,
      normalizedStatement: normalizedExcerpt,
      sourceRefs: [sourceRef],
      authorityBasisRef: sourceRef,
      applicability: applicabilityFor(classification, definition.scope, itemId),
      severity: classification === 'pre-action-refusal' ? 'critical' : 'medium',
      classification,
      ...semantics,
      pairedRuleIds: [],
      retirementState:
        definition.authorityEffect === 'historical' ||
        definition.authorityEffect === 'stale-explanation'
          ? 'historical-only'
          : 'active-reading',
      retirementEvidence: {
        predicate: null,
        negativeRefusalTest: null,
        corpusSweep: null,
        independentBypassAttempt: null,
      },
      bindingDigest: '',
    }
    const rule = { ...baseRule, bindingDigest: bindingDigestFor(baseRule) }
    rules.push(rule)
    return {
      itemId,
      locator,
      normalizedExcerpt,
      valueDigest,
      ruleIds: [ruleId],
      exclusionDisposition: null,
      rationale:
        'Rule-bearing section or live behavior is mapped to an explicit source-bound rule.',
    }
  })
  return {
    source: {
      sourceId: definition.sourceId,
      path: definition.path,
      sourceKind: definition.sourceKind,
      authorityTier: definition.authorityTier,
      authorityEffect: definition.authorityEffect,
      scope: definition.scope,
      snapshotEvidence: { commit: SNAPSHOT, fullFileSha256: sha256(bytes) },
      inventoryItems,
    },
    rules,
  }
}

interface OperationEvidence {
  readonly gate1: readonly SourceRef[]
  readonly gate2: readonly SourceRef[]
  readonly gate3: readonly SourceRef[]
  readonly verification: readonly SourceRef[]
  readonly closure: readonly SourceRef[]
}

function operationAuthority(evidence: OperationEvidence): OperationAuthority[] {
  return [
    {
      operationId: 'gate1.ratify',
      allowedPrincipals: ['human-developer'],
      requiredGitEvidence: evidence.gate1,
      missingEvidenceDecision: 'REQUIRE_HUMAN',
      agentCallable: false,
      operationalStateMaySatisfy: false,
      toolMayIssueAuthorityEvidence: false,
    },
    {
      operationId: 'gate2.dispatch',
      allowedPrincipals: ['coordinator'],
      requiredGitEvidence: evidence.gate2,
      missingEvidenceDecision: 'REFUSE',
      agentCallable: true,
      operationalStateMaySatisfy: false,
      toolMayIssueAuthorityEvidence: false,
    },
    {
      operationId: 'gate3.merge',
      allowedPrincipals: ['human-developer'],
      requiredGitEvidence: evidence.gate3,
      missingEvidenceDecision: 'REQUIRE_HUMAN',
      agentCallable: false,
      operationalStateMaySatisfy: false,
      toolMayIssueAuthorityEvidence: false,
    },
    {
      operationId: 'verification.issue',
      allowedPrincipals: ['independent-reviewer'],
      requiredGitEvidence: evidence.verification,
      missingEvidenceDecision: 'REFUSE',
      agentCallable: false,
      operationalStateMaySatisfy: false,
      toolMayIssueAuthorityEvidence: false,
    },
    {
      operationId: 'closure.record',
      allowedPrincipals: ['coordinator'],
      requiredGitEvidence: evidence.closure,
      missingEvidenceDecision: 'REFUSE',
      agentCallable: false,
      operationalStateMaySatisfy: false,
      toolMayIssueAuthorityEvidence: false,
    },
    {
      operationId: 'receipt.mint-generic',
      allowedPrincipals: [],
      requiredGitEvidence: [],
      missingEvidenceDecision: 'REFUSE',
      agentCallable: false,
      operationalStateMaySatisfy: false,
      toolMayIssueAuthorityEvidence: false,
    },
    {
      operationId: 'external.write',
      allowedPrincipals: [],
      requiredGitEvidence: [],
      missingEvidenceDecision: 'REFUSE',
      agentCallable: false,
      operationalStateMaySatisfy: false,
      toolMayIssueAuthorityEvidence: false,
    },
  ]
}

function refFor(sources: readonly CanonSource[], sourceId: string, itemId: string): SourceRef {
  const source = sources.find((candidate) => candidate.sourceId === sourceId)
  const item = source?.inventoryItems.find((candidate) => candidate.itemId === itemId)
  if (source === undefined || item === undefined) {
    throw new Error(`required evidence '${sourceId}:${itemId}' is missing`)
  }
  return {
    sourceId,
    itemId,
    locatorDigest: locatorDigestFor(item.locator),
    valueDigest: item.valueDigest,
  }
}

function reconciliationMany(
  reconciliationId: string,
  topic: string,
  observedRefs: readonly SourceRef[],
  authoritativeRuleIds: readonly string[],
  migrationStatus: 'open' | 'resolved-for-fk',
  scopedDisposition: string,
  unresolvedConsequence: string,
  missingPath?: string,
): ReconciliationRecord {
  const observedEvidence: ReconciliationEvidence[] = observedRefs.map((reference) => ({
    kind: 'source-ref' as const,
    reference: canonicalJson(reference),
    digest: sha256(canonicalJson(reference)),
  }))
  if (missingPath !== undefined) {
    const missingReference = canonicalJson({ commit: SNAPSHOT, path: missingPath })
    observedEvidence.push({
      kind: 'git-commit' as const,
      reference: SNAPSHOT,
      digest: sha256(execFileSync('git', ['cat-file', '-p', SNAPSHOT], { cwd: repoRoot })),
    })
    observedEvidence.push({
      kind: 'missing-path' as const,
      reference: missingReference,
      digest: sha256(missingReference),
    })
  }
  return {
    reconciliationId,
    topic,
    observedRefs,
    observedEvidence,
    authoritativeRuleIds,
    scopedDisposition,
    unresolvedConsequence,
    migrationStatus,
    supersedingEvidence: null,
  }
}

function requiredReconciliations(
  sources: readonly CanonSource[],
  rules: readonly AuthorityRule[],
): ReconciliationRecord[] {
  const byId = new Map(sources.map((source) => [source.sourceId, source]))
  const get = (sourceId: string, itemId?: string): { ref: SourceRef; ruleId: string } => {
    const source = byId.get(sourceId)
    if (source === undefined) throw new Error(`missing reconciliation source '${sourceId}'`)
    const item =
      itemId === undefined
        ? source.inventoryItems[0]
        : source.inventoryItems.find((candidate) => candidate.itemId === itemId)
    if (item === undefined) throw new Error(`missing reconciliation item '${sourceId}:${itemId}'`)
    const ref: SourceRef = {
      sourceId,
      itemId: item.itemId,
      locatorDigest: locatorDigestFor(item.locator),
      valueDigest: item.valueDigest,
    }
    const ruleId = item.ruleIds[0]
    if (ruleId === undefined || !rules.some((rule) => rule.ruleId === ruleId)) {
      throw new Error(`missing reconciliation rule for '${sourceId}'`)
    }
    return { ref, ruleId }
  }
  const getInventory = (sourceId: string, itemId: string): { ref: SourceRef } => {
    const source = byId.get(sourceId)
    if (source === undefined) throw new Error(`missing reconciliation source '${sourceId}'`)
    const item = source.inventoryItems.find((candidate) => candidate.itemId === itemId)
    if (item === undefined) throw new Error(`missing reconciliation item '${sourceId}:${itemId}'`)
    return {
      ref: {
        sourceId,
        itemId: item.itemId,
        locatorDigest: locatorDigestFor(item.locator),
        valueDigest: item.valueDigest,
      },
    }
  }
  const plan = get('foreman-line-plan', 'item.two-gate-thesis')
  const approval = [
    get('approval-readme', 'item.4261d18b3243'),
    get('approval-readme', 'item.ff6f38f088ae'),
  ]
  const charterGate = get('fk-charter', 'item.d9')
  const charterProfileBoundary = get('fk-charter', 'item.d7')
  const charterGate3 = get('fk-charter', 'item.b1ac4aa9eddf')
  const charterAllowed = get('fk-charter', 'item.d10')
  const charterOperationalBoundary = get('fk-charter', 'item.d2')
  const coordinatorGate3 = get('coordinator-pattern', 'item.f7686ab58db7')
  const conventionGate3 = get('spec-convention', 'item.022fc00afe7b')
  const historicalGate3 = get('foreman-line-plan', 'item.c92333c21e64')
  const conventionProfile = get('spec-convention', 'item.e6f5fa8543a1')
  const conventionSurfaces = get('spec-convention', 'item.ac5ff7afd06f')
  const conventionAllowed = get('spec-convention', 'item.5145ab15549c')
  const conventionStop = get('spec-convention', 'item.fd82127bf9f9')
  const linter = [get('spec-frontmatter-schema', 'item.bdf997c3cd45')]
  const linterProfileMissing = get('spec-linter-validator', 'item.092d2fc43a32')
  const linterProfileWarning = get('spec-linter-validator', 'item.fb7d76a32df4')
  const linterReturn = get('spec-linter-validator', 'item.80563af1788e')
  const linterValidator = [linterProfileMissing, linterProfileWarning, linterReturn]
  const linterReadme = [
    get('spec-linter-readme', 'item.9a889881a236'),
    get('spec-linter-readme', 'item.b4f5d76d68ec'),
  ]
  const profiles = [
    'item.0f7efe94f551',
    'item.5b5fd0863539',
    'item.ffd2209ab94a',
    'item.86618990c615',
    'item.514a38aa8311',
    'item.a61f76b791df',
    'item.ff2ab3fa7a40',
  ].map((itemId) => getInventory('permission-profiles-registry', itemId))
  const profileTypes = [
    get('permission-profiles-types', 'item.0b9706b5a9bf'),
    get('permission-profiles-types', 'item.bc257b03aa99'),
  ]
  const profileValidator = [
    get('permission-profiles-validator', 'item.dcd8638af4a4'),
    get('permission-profiles-validator', 'item.9c3c17055384'),
    get('permission-profiles-validator', 'item.4da758cc157c'),
    get('permission-profiles-validator', 'item.ffd598413a66'),
  ]
  const profileReadme = [
    get('permission-profiles-readme', 'item.729be3615f8d'),
    get('permission-profiles-readme', 'item.d11b9d38f924'),
    get('permission-profiles-readme', 'item.1101805f1c9e'),
    get('permission-profiles-readme', 'item.415efa3f5e3b'),
  ]
  const standing = Array.from({ length: 13 }, (_, index) =>
    get('standing-constraints', `item.constraint-${index + 1}`),
  )
  const standingProvenance = get('standing-constraints', 'item.c5880644c95c')
  const priorManifest = '1fe3a7c66241904445021c97db68065961a3bf5beceb654faff4b552b4de79b2'
  const supersedingManifest = '48a82df7d6da19352e4c9d2d99195835743a27f163a5d13a4f8d5b2a76a75a61'
  const r4Manifest = '375ea566b2858d3204d17e0625332167a373b555db6d3a8b741af88f1390e082'
  const r5Manifest = '589c6c3ea98147a951ab8887fd70a1a1c50e8b84953abcbe51b152a256da6ad9'
  const r6Manifest = '644e1336c2e4309bc75954cb24e921d4cf6d3a75b0ccc7cb926de34a8ca553c6'
  const r7Manifest = '2a12cde0f3ae481462c74cb5c0cb2377514f628cb0091c26f916705a4778de77'
  const commandEvidence = (commandId: string, inputDigest: string, resultDigest: string) =>
    canonicalJson({
      tool: '@foreman-line/authority-registry',
      toolVersion: '0.1.0',
      commandId,
      inputDigest,
      resultDigest,
      exitCode: 0,
      actorClass: 'coordinator',
    })
  const priorCommand = commandEvidence('registry-binding-manifest', sha256(SNAPSHOT), priorManifest)
  const supersedingCommand = commandEvidence(
    'superseding-binding-manifest',
    priorManifest,
    supersedingManifest,
  )
  return [
    reconciliationMany(
      'gate-namespace-count',
      'Historical two-gate and stage approval terms versus FK Gate 1, Gate 2, and Gate 3.',
      [plan.ref, ...approval.map((item) => item.ref), charterGate.ref],
      [charterGate.ruleId],
      'resolved-for-fk',
      'Historical pipeline vocabulary remains visible; the FK goal three-gate namespace controls FK work.',
      'Naive consumers must retain the namespace and scope when interpreting gate numbers.',
    ),
    reconciliationMany(
      'gate3-delegation',
      'Generic contingent Gate 3 delegation versus FK nondelegated human merge authority.',
      [coordinatorGate3.ref, conventionGate3.ref, historicalGate3.ref, charterGate3.ref],
      [charterGate3.ruleId],
      'resolved-for-fk',
      'Goal-charter scope withholds Gate 3 delegation for Foreman Kernel.',
      'Generic delegation text remains valid only outside the controlling FK scope.',
    ),
    reconciliationMany(
      'spec-linter-profile-behavior',
      'Live six-profile enum behavior versus stale deferred-registry explanation.',
      [
        ...linter.map((item) => item.ref),
        ...linterValidator.map((item) => item.ref),
        ...linterReadme.map((item) => item.ref),
        conventionProfile.ref,
      ],
      [
        ...linter.map((item) => item.ruleId),
        ...linterReadme.map((item) => item.ruleId),
        conventionProfile.ruleId,
      ],
      'resolved-for-fk',
      'Live schema behavior is recorded as binding and contradictory explanation as stale.',
      'FK-P0 does not edit the linter or convention prose.',
    ),
    reconciliationMany(
      'surfaces-allowed-files',
      'Routing metadata surfaces versus exact body-level Allowed Files authority.',
      [
        conventionSurfaces.ref,
        conventionAllowed.ref,
        conventionStop.ref,
        linterReturn.ref,
        charterAllowed.ref,
      ],
      [conventionAllowed.ruleId, conventionStop.ruleId, charterAllowed.ruleId],
      'resolved-for-fk',
      'surfaces is routing metadata only; Allowed Files remains the mutation boundary.',
      'Mechanical body compilation remains a declared FK-P2 gap.',
    ),
    reconciliationMany(
      'permission-profile-enforcement-bound',
      'Loaded mediated profile denial versus unenrolled and residual shell capability.',
      [
        ...profiles.map((item) => item.ref),
        ...profileTypes.map((item) => item.ref),
        ...profileValidator.map((item) => item.ref),
        ...profileReadme.map((item) => item.ref),
        charterProfileBoundary.ref,
      ],
      [...profileReadme.map((item) => item.ruleId), charterProfileBoundary.ruleId],
      'resolved-for-fk',
      'Mediated denial, post-review detection, and unsupported bypass cases are separate classifications.',
      'Missing enrollment must never be reported as a pre-action refusal.',
    ),
    reconciliationMany(
      'missing-provenance-reference',
      'Standing constraints name a provenance ledger absent at the source snapshot.',
      [standingProvenance.ref, ...standing.map((item) => item.ref)],
      standing.map((item) => item.ruleId),
      'open',
      'All thirteen inline rules remain mapped from the standing-constraints source.',
      'The standing rules cannot retire from agent reading until provenance is restored or amended.',
      'plugins/foreman-line/docs/transcripts/defects_lessons.md',
    ),
    {
      reconciliationId: 'registry-rework-6eb1c25',
      topic:
        'Prior committed registry bindings superseded by the coordinator-ratified FK-P0 rework.',
      observedRefs: [charterAllowed.ref],
      observedEvidence: [
        {
          kind: 'git-commit',
          reference: '4666ea15caee8b231137f23325d14ea4526e338a',
          digest: sha256(
            execFileSync('git', ['cat-file', '-p', '4666ea15caee8b231137f23325d14ea4526e338a'], {
              cwd: repoRoot,
            }),
          ),
        },
        {
          kind: 'git-commit',
          reference: SNAPSHOT,
          digest: sha256(execFileSync('git', ['cat-file', '-p', SNAPSHOT], { cwd: repoRoot })),
        },
        {
          kind: 'command-result',
          reference: priorCommand,
          digest: sha256(priorCommand),
        },
        {
          kind: 'command-result',
          reference: supersedingCommand,
          digest: sha256(supersedingCommand),
        },
      ],
      authoritativeRuleIds: [charterAllowed.ruleId],
      scopedDisposition:
        'The curated atomic registry supersedes the rejected generated bindings in FK scope.',
      unresolvedConsequence:
        'Future binding changes require another typed prior-to-new migration record.',
      migrationStatus: 'superseded-by-amendment',
      supersedingEvidence: charterAllowed.ref,
    },
    {
      reconciliationId: 'registry-rework-9285945',
      topic: 'R3 registry bindings superseded by the coordinator-ratified FK-P0 R4 amendment.',
      observedRefs: [charterOperationalBoundary.ref],
      observedEvidence: [
        {
          kind: 'git-commit',
          reference: '87237a868a0da8e1a57fc8ce9d400509b2a09c5d',
          digest: sha256(
            execFileSync('git', ['cat-file', '-p', '87237a868a0da8e1a57fc8ce9d400509b2a09c5d'], {
              cwd: repoRoot,
            }),
          ),
        },
        {
          kind: 'git-commit',
          reference: SNAPSHOT,
          digest: sha256(execFileSync('git', ['cat-file', '-p', SNAPSHOT], { cwd: repoRoot })),
        },
        {
          kind: 'command-result',
          reference: commandEvidence(
            'registry-binding-manifest-r3',
            sha256(SNAPSHOT),
            supersedingManifest,
          ),
          digest: sha256(
            commandEvidence('registry-binding-manifest-r3', sha256(SNAPSHOT), supersedingManifest),
          ),
        },
        {
          kind: 'command-result',
          reference: commandEvidence(
            'superseding-binding-manifest-r4',
            supersedingManifest,
            r4Manifest,
          ),
          digest: sha256(
            commandEvidence('superseding-binding-manifest-r4', supersedingManifest, r4Manifest),
          ),
        },
      ],
      authoritativeRuleIds: [charterOperationalBoundary.ruleId],
      scopedDisposition:
        'The R4 source-bound semantic and discovery contract supersedes the R3 registry bindings in FK scope.',
      unresolvedConsequence:
        'Future binding changes require another typed prior-to-new migration record.',
      migrationStatus: 'superseded-by-amendment',
      supersedingEvidence: charterOperationalBoundary.ref,
    },
    {
      reconciliationId: 'registry-rework-6f45963',
      topic: 'R4 registry bindings superseded by the coordinator-ratified FK-P0 R5 amendment.',
      observedRefs: [charterProfileBoundary.ref],
      observedEvidence: [
        {
          kind: 'git-commit',
          reference: 'f73a3846e436dcf25d80618aedd88170b0888770',
          digest: sha256(
            execFileSync('git', ['cat-file', '-p', 'f73a3846e436dcf25d80618aedd88170b0888770'], {
              cwd: repoRoot,
            }),
          ),
        },
        {
          kind: 'git-commit',
          reference: SNAPSHOT,
          digest: sha256(execFileSync('git', ['cat-file', '-p', SNAPSHOT], { cwd: repoRoot })),
        },
        {
          kind: 'command-result',
          reference: commandEvidence('registry-binding-manifest-r4', sha256(SNAPSHOT), r4Manifest),
          digest: sha256(
            commandEvidence('registry-binding-manifest-r4', sha256(SNAPSHOT), r4Manifest),
          ),
        },
        {
          kind: 'command-result',
          reference: commandEvidence('superseding-binding-manifest-r5', r4Manifest, r5Manifest),
          digest: sha256(
            commandEvidence('superseding-binding-manifest-r5', r4Manifest, r5Manifest),
          ),
        },
      ],
      authoritativeRuleIds: [charterProfileBoundary.ruleId],
      scopedDisposition:
        'The R5 item-curated semantic, baseline, locator, and compiler-AST contract supersedes the R4 registry bindings in FK scope.',
      unresolvedConsequence:
        'Future binding changes require another typed prior-to-new migration record.',
      migrationStatus: 'superseded-by-amendment',
      supersedingEvidence: charterProfileBoundary.ref,
    },
    {
      reconciliationId: 'registry-rework-b414d06',
      topic: 'R5 registry bindings superseded by the coordinator-ratified FK-P0 R6 amendment.',
      observedRefs: [charterAllowed.ref],
      observedEvidence: [
        {
          kind: 'git-commit',
          reference: 'a61eb08da6e7826d2e30bc0210434330184522da',
          digest: sha256(
            execFileSync('git', ['cat-file', '-p', 'a61eb08da6e7826d2e30bc0210434330184522da'], {
              cwd: repoRoot,
            }),
          ),
        },
        {
          kind: 'git-commit',
          reference: SNAPSHOT,
          digest: sha256(execFileSync('git', ['cat-file', '-p', SNAPSHOT], { cwd: repoRoot })),
        },
        {
          kind: 'command-result',
          reference: commandEvidence('registry-binding-manifest-r5', sha256(SNAPSHOT), r5Manifest),
          digest: sha256(
            commandEvidence('registry-binding-manifest-r5', sha256(SNAPSHOT), r5Manifest),
          ),
        },
        {
          kind: 'command-result',
          reference: commandEvidence('superseding-binding-manifest-r6', r5Manifest, r6Manifest),
          digest: sha256(
            commandEvidence('superseding-binding-manifest-r6', r5Manifest, r6Manifest),
          ),
        },
      ],
      authoritativeRuleIds: [charterAllowed.ruleId],
      scopedDisposition:
        'The R6 curated publication, source-honest applicability, and complete reconciliation contract supersedes the R5 registry bindings in FK scope.',
      unresolvedConsequence:
        'Future binding changes require another typed prior-to-new migration record.',
      migrationStatus: 'superseded-by-amendment',
      supersedingEvidence: charterAllowed.ref,
    },
    {
      reconciliationId: 'registry-rework-00b41b7',
      topic: 'R6 registry bindings superseded by the coordinator-ratified FK-P0 R7 amendment.',
      observedRefs: [charterOperationalBoundary.ref],
      observedEvidence: [
        {
          kind: 'git-commit',
          reference: '6123474485ef836fc7250df9c15695aaff44fe45',
          digest: sha256(
            execFileSync('git', ['cat-file', '-p', '6123474485ef836fc7250df9c15695aaff44fe45'], {
              cwd: repoRoot,
            }),
          ),
        },
        {
          kind: 'git-commit',
          reference: SNAPSHOT,
          digest: sha256(execFileSync('git', ['cat-file', '-p', SNAPSHOT], { cwd: repoRoot })),
        },
        {
          kind: 'command-result',
          reference: commandEvidence('registry-binding-manifest-r6', sha256(SNAPSHOT), r6Manifest),
          digest: sha256(
            commandEvidence('registry-binding-manifest-r6', sha256(SNAPSHOT), r6Manifest),
          ),
        },
        {
          kind: 'command-result',
          reference: commandEvidence('superseding-binding-manifest-r7', r6Manifest, r7Manifest),
          digest: sha256(
            commandEvidence('superseding-binding-manifest-r7', r6Manifest, r7Manifest),
          ),
        },
      ],
      authoritativeRuleIds: [charterOperationalBoundary.ruleId],
      scopedDisposition:
        'The R7 item-specific curation, protected evidence, and complete discovery contract supersedes the R6 registry bindings in FK scope.',
      unresolvedConsequence:
        'Future binding changes require another typed prior-to-new migration record.',
      migrationStatus: 'superseded-by-amendment',
      supersedingEvidence: charterOperationalBoundary.ref,
    },
  ]
}

function buildRegistry(): AuthorityEnforcementRegistry {
  const built = SOURCE_DEFINITIONS.map(buildSource)
  const sources = built.map((entry) => entry.source)
  const rules = built.flatMap((entry) => entry.rules)
  return {
    schemaVersion: '0.1.0',
    registryId: 'foreman-kernel-authority-enforcement',
    sourceSnapshotCommit: SNAPSHOT,
    sources,
    rules,
    operationAuthority: operationAuthority({
      gate1: [
        refFor(sources, 'fk-charter', 'item.cd014d6d90c5'),
        refFor(sources, 'fk-charter', 'item.d9'),
      ],
      gate2: [
        refFor(sources, 'fk-charter', 'item.15a44cf50bc6'),
        refFor(sources, 'fk-loop-directive', 'item.bfffee6d7c1f'),
      ],
      gate3: [
        refFor(sources, 'fk-charter', 'item.b1ac4aa9eddf'),
        refFor(sources, 'fk-loop-directive', 'item.7eb6018d9e57'),
        refFor(sources, 'fk-loop-directive', 'item.2743c2f8c558'),
      ],
      verification: [
        refFor(sources, 'fk-charter', 'item.d11'),
        refFor(sources, 'fk-loop-directive', 'item.ce9042d917b2'),
      ],
      closure: [
        refFor(sources, 'fk-charter', 'item.e9ec57edc0a2'),
        refFor(sources, 'fk-loop-directive', 'item.e3065db62b43'),
      ],
    }),
    reconciliations: requiredReconciliations(sources, rules),
  }
}

function buildMinimal(full: AuthorityEnforcementRegistry): AuthorityEnforcementRegistry {
  return structuredClone(full)
}

function writeYaml(path: string, document: unknown): void {
  writeFileSync(
    path,
    stringify(document, { aliasDuplicateObjects: false, lineWidth: 0, sortMapEntries: false }),
    'utf8',
  )
}

function writeFixtures(full: AuthorityEnforcementRegistry): void {
  const fixturesDir = join(packageRoot, 'tests', 'fixtures')
  const pass = buildMinimal(full)
  writeYaml(join(fixturesDir, 'pass-minimal.yaml'), pass)

  const identity = structuredClone(pass)
  ;(identity.rules[0]?.sourceRefs[0] as { locatorDigest: string }).locatorDigest = '0'.repeat(64)
  ;(identity.rules[0] as { bindingDigest: string }).bindingDigest = bindingDigestFor(
    identity.rules[0] as AuthorityRule,
  )
  writeYaml(join(fixturesDir, 'reject-identity-mutation.yaml'), identity)

  const location = structuredClone(pass)
  ;(location.sources[0]?.inventoryItems[0]?.locator as { anchor: string }).anchor += '-moved'
  writeYaml(join(fixturesDir, 'reject-location-mutation.yaml'), location)

  const value = structuredClone(pass)
  ;(value.sources[0]?.inventoryItems[0] as { normalizedExcerpt: string }).normalizedExcerpt +=
    ' changed'
  writeYaml(join(fixturesDir, 'reject-value-mutation.yaml'), value)

  const stale = structuredClone(pass)
  ;(stale.sources[0]?.inventoryItems[0] as { valueDigest: string }).valueDigest = 'f'.repeat(64)
  ;(stale.rules[0]?.sourceRefs[0] as { valueDigest: string }).valueDigest = 'f'.repeat(64)
  ;(stale.rules[0] as { bindingDigest: string }).bindingDigest = bindingDigestFor(
    stale.rules[0] as AuthorityRule,
  )
  writeYaml(join(fixturesDir, 'reject-stale-source.yaml'), stale)

  const duplicate = structuredClone(pass)
  ;(duplicate.rules as AuthorityRule[]).push(structuredClone(duplicate.rules[0] as AuthorityRule))
  writeYaml(join(fixturesDir, 'reject-duplicate-rule.yaml'), duplicate)

  const contradiction = structuredClone(pass)
  const original = contradiction.rules.find(
    (candidate) => candidate.ruleId === 'rule.fk-charter.d3',
  ) as AuthorityRule
  const conflictingBase: AuthorityRule = {
    ...structuredClone(original),
    ruleId: `${original.ruleId}.conflict`,
    authorityClaim: `${original.authorityClaim}-conflict`,
  }
  const conflicting = { ...conflictingBase, bindingDigest: bindingDigestFor(conflictingBase) }
  ;(contradiction.rules as AuthorityRule[]).push(conflicting)
  const conflictingItem = contradiction.sources
    .find((source) => source.sourceId === 'fk-charter')
    ?.inventoryItems.find((item) => item.itemId === 'item.d3')
  if (conflictingItem === undefined) throw new Error('contradiction fixture item is missing')
  ;(conflictingItem.ruleIds as string[]).push(conflicting.ruleId)
  writeYaml(join(fixturesDir, 'reject-contradictory-authority.yaml'), contradiction)

  const missing = structuredClone(pass)
  ;(missing.rules[0]?.sourceRefs[0] as { sourceId: string }).sourceId = 'missing-source'
  ;(missing.rules[0] as { bindingDigest: string }).bindingDigest = bindingDigestFor(
    missing.rules[0] as AuthorityRule,
  )
  writeYaml(join(fixturesDir, 'reject-missing-source.yaml'), missing)
}

generate(allSchemaFiles, join(packageRoot, 'schemas'))
const registry = buildRegistry()
writeYaml(join(packageRoot, 'authority-enforcement-registry.yaml'), registry)
writeFixtures(registry)
process.stdout.write(
  `${canonicalJson({
    sources: registry.sources.length,
    items: registry.sources.reduce((sum, source) => sum + source.inventoryItems.length, 0),
    rules: registry.rules.length,
  })}\n`,
)
