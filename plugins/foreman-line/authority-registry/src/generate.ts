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
    anchors: [
      '"permission_profile": {',
      '"reviewer-readonly",',
      '"builder-architecture",',
      '"builder-standard",',
      '"shaping-agent",',
      '"builder-deps"',
      '"coordinator",',
    ],
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

function headingLocators(content: string): LocatedText[] {
  const lines = content.replace(/\r\n?/g, '\n').split('\n')
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
  const lines = content.replace(/\r\n?/g, '\n').split('\n')
  const stack: { level: number; heading: string }[] = []
  const items: { index: number; indent: number; anchor: string }[] = []
  const occurrences = new Map<string, number>()
  let inFence = false
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? ''
    if (/^\s*(?:```|~~~)/.test(line)) {
      inFence = !inFence
      continue
    }
    if (inFence) continue
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
  const lines = content.replace(/\r\n?/g, '\n').split('\n')
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
  const lines = content.replace(/\r\n?/g, '\n').split('\n')
  const headings: { level: number; text: string }[] = []
  const occurrences = new Map<string, number>()
  const blocks: LocatedText[] = []
  let cursor = 0
  let inFence = false
  let inHtmlComment = false
  while (cursor < lines.length) {
    const line = lines[cursor] ?? ''
    if (/^\s*(?:```|~~~)/.test(line)) {
      inFence = !inFence
      cursor += 1
      continue
    }
    if (inFence) {
      cursor += 1
      continue
    }
    if (inHtmlComment || line.includes('<!--')) {
      inHtmlComment = !line.includes('-->')
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
        if (
          next.trim() === '' ||
          /^#{1,6}\s+/.test(next) ||
          /^\s*\|/.test(next) ||
          /^\s*(?:```|~~~)/.test(next) ||
          next.includes('<!--')
        )
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
    'item.d1': 'narrative-provenance',
    'item.d2': 'narrative-provenance',
    'item.d3': 'pre-action-refusal',
    'item.d4': 'narrative-provenance',
    'item.d5': 'pre-action-refusal',
    'item.d6': 'narrative-provenance',
    'item.d7': 'narrative-provenance',
    'item.d8': 'post-action-detection',
    'item.d9': 'independent-review-human-judgment',
    'item.d10': 'pre-action-refusal',
    'item.d11': 'ci-static-check',
    'item.d12': 'pre-action-refusal',
    'item.d13': 'post-action-detection',
    'item.d14': 'narrative-provenance',
    'item.d15': 'pre-action-refusal',
    'item.d16': 'pre-action-refusal',
    'item.d17': 'pre-action-refusal',
    'item.d18': 'narrative-provenance',
    'item.d19': 'pre-action-refusal',
    'item.d20': 'unsupported',
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
  }
  if (explicit[itemId] !== undefined) return explicit[itemId]
  if (sourceId === 'spec-linter-validator' || sourceId === 'spec-linter-cli')
    return 'ci-static-check'
  if (sourceId === 'permission-profiles-validator') return 'pre-action-refusal'
  if (sourceId === 'spec-linter-readme' || sourceId === 'permission-profiles-readme') {
    return 'unsupported'
  }
  return 'narrative-provenance'
}

function authorityIdentityFor(
  sourceId: string,
  itemId: string,
): {
  authoritySubject: string
  authorityClaim: string
} {
  const exact: Readonly<Record<string, readonly [string, string]>> = {
    'fk-charter:item.d2': [
      'canon.operational-authority-boundary',
      'git-canon-sqlite-operational-split',
    ],
    'fk-charter:item.d3': [
      'kernel.surface-admission-separation',
      'read-control-admission-separated',
    ],
    'fk-charter:item.d18': ['kernel.authorize-action-owner', 'provider-neutral-policy-engine'],
    'fk-charter:item.d19': ['repository.read-confidentiality', 'admission-bound-contained-read'],
    'fk-charter:item.d7': [
      'permission-profile.enforcement-bound',
      'loaded-adapter-refusal-unenrolled-detection',
    ],
    'foreman-line-plan:item.two-gate-thesis': ['gate.namespace', 'historical-two-stage-gates'],
    'approval-readme:item.a7e48d46fe37': ['gate.namespace', 'historical-two-stage-gates'],
    'approval-readme:item.4261d18b3243': ['gate.namespace', 'historical-two-stage-gates'],
    'approval-readme:item.ff6f38f088ae': ['gate.namespace', 'historical-two-stage-gates'],
    'fk-charter:item.d9': ['gate.namespace', 'fk-three-gate-ownership'],
    'coordinator-pattern:item.f7686ab58db7': ['gate3.merge-authority', 'contingent-delegation'],
    'spec-convention:item.022fc00afe7b': ['gate3.merge-authority', 'human-unless-live-proof'],
    'fk-charter:item.b1ac4aa9eddf': ['gate3.merge-authority', 'human-owned-nondelegated'],
    'foreman-line-plan:item.c92333c21e64': ['gate3.merge-authority', 'human-owned-nondelegated'],
    'spec-convention:item.ac5ff7afd06f': ['spec.mutation-authority', 'surfaces-routing-only'],
    'spec-convention:item.5145ab15549c': [
      'spec.mutation-authority',
      'exact-allowed-files-required',
    ],
    'spec-convention:item.fd82127bf9f9': [
      'spec.mutation-authority',
      'exact-allowed-files-required',
    ],
    'spec-linter-validator:item.80563af1788e': [
      'spec.mutation-authority',
      'frontmatter-only-no-body-compiler',
    ],
    'fk-charter:item.d10': ['spec.mutation-authority', 'exact-allowed-files-required'],
    'standing-constraints:item.c5880644c95c': [
      'standing.provenance',
      'inline-rules-required-until-provenance-restored',
    ],
  }
  const exactIdentity = exact[`${sourceId}:${itemId}`]
  if (exactIdentity !== undefined) {
    return { authoritySubject: exactIdentity[0], authorityClaim: exactIdentity[1] }
  }
  const profileRegistryLive = new Set([
    'spec-frontmatter-schema:item.860f1c1146f4',
    'spec-frontmatter-schema:item.1dddb8e0edae',
    'spec-frontmatter-schema:item.fbc219d0ff13',
    'spec-frontmatter-schema:item.cc7db94c11c2',
    'spec-frontmatter-schema:item.7443d95fc46b',
    'spec-frontmatter-schema:item.0a36842682ef',
    'spec-frontmatter-schema:item.d6246c2593db',
    'spec-linter-validator:item.092d2fc43a32',
    'spec-linter-validator:item.fb7d76a32df4',
    'spec-linter-validator:item.80563af1788e',
  ])
  const profileRegistryDeferred = new Set([
    'spec-linter-readme:item.9a889881a236',
    'spec-linter-readme:item.b4f5d76d68ec',
    'spec-convention:item.e6f5fa8543a1',
  ])
  const identityKey = `${sourceId}:${itemId}`
  if (profileRegistryLive.has(identityKey) || profileRegistryDeferred.has(identityKey)) {
    return {
      authoritySubject: 'permission-profile.registry-state',
      authorityClaim: profileRegistryDeferred.has(identityKey)
        ? 'deferred-profile-registry'
        : 'six-profile-live-enum',
    }
  }
  const mediatedProfileEnforcement = new Set([
    'permission-profiles-registry:item.0f7efe94f551',
    'permission-profiles-registry:item.5b5fd0863539',
    'permission-profiles-registry:item.ffd2209ab94a',
    'permission-profiles-registry:item.86618990c615',
    'permission-profiles-registry:item.514a38aa8311',
    'permission-profiles-registry:item.a61f76b791df',
    'permission-profiles-registry:item.ff2ab3fa7a40',
    'permission-profiles-validator:item.dcd8638af4a4',
    'permission-profiles-validator:item.9c3c17055384',
    'permission-profiles-validator:item.4da758cc157c',
    'permission-profiles-validator:item.ffd598413a66',
  ])
  const residualProfileEnforcement = new Set([
    'permission-profiles-types:item.0b9706b5a9bf',
    'permission-profiles-types:item.bc257b03aa99',
    'permission-profiles-readme:item.729be3615f8d',
    'permission-profiles-readme:item.d11b9d38f924',
    'permission-profiles-readme:item.1101805f1c9e',
    'permission-profiles-readme:item.415efa3f5e3b',
  ])
  if (mediatedProfileEnforcement.has(identityKey) || residualProfileEnforcement.has(identityKey)) {
    return {
      authoritySubject: 'permission-profile.enforcement-bound',
      authorityClaim: mediatedProfileEnforcement.has(identityKey)
        ? 'loaded-session-mediated-denial'
        : 'unenrolled-or-shell-residual',
    }
  }
  const standingIdentities: Readonly<Record<string, readonly [string, string]>> = {
    'item.constraint-1': ['external-boundary.error-contract', 'typed-module-error-required'],
    'item.constraint-2': ['untested-seam.return-trust', 'unknown-until-normalized'],
    'item.constraint-3': ['default-deny.structural-testing', 'each-invariant-tested-independently'],
    'item.constraint-4': ['line-protocol.emission-safety', 'external-data-sanitized'],
    'item.constraint-5': ['untrusted-text.parse-complexity', 'linear-time-required'],
    'item.constraint-6': ['classifier.fixture-coverage', 'real-naming-and-false-negatives-covered'],
    'item.constraint-7': ['kompress.payload-ceiling', 'oversize-requires-coordinator-ruling'],
    'item.constraint-8': ['review.hostile-probing', 'one-off-live-probes-licensed'],
    'item.constraint-9': ['review.prose-ambiguity', 'naive-reading-must-be-excluded'],
    'item.constraint-10': ['review.worktree-integrity', 'post-review-git-detection-required'],
    'item.constraint-11': ['review.assertion-binding', 'mutation-probe-required'],
    'item.constraint-12': ['parcel.byte-freeze-placement', 'parcel-time-only'],
    'item.constraint-13': ['allowlist.binding-dimensions', 'identity-location-value-required'],
  }
  if (sourceId === 'standing-constraints' && standingIdentities[itemId] !== undefined) {
    const identity = standingIdentities[itemId] as readonly [string, string]
    return { authoritySubject: identity[0], authorityClaim: identity[1] }
  }
  const pddIdentities: Readonly<Record<string, readonly [string, string]>> = {
    'item.hard-rule-1': ['parcel.contract-sequencing', 'contracts-before-parallel-work'],
    'item.hard-rule-2': ['parcel.execution-isolation', 'one-branch-one-worktree'],
    'item.hard-rule-3': ['parcel.review-independence', 'independently-reviewable'],
    'item.hard-rule-4': ['parcel.mutation-authority', 'exact-files-required'],
    'item.hard-rule-5': ['parcel.shared-file-serialization', 'serialization-required'],
    'item.hard-rule-6': ['parcel.pre-pr-base', 'rebase-before-pr'],
    'item.hard-rule-7': ['parcel.verification', 'verification-required'],
    'item.hard-rule-8': ['parcel.missing-product-decision', 'stop-and-escalate'],
    'item.hard-rule-9': ['parcel.contract-amendment', 'no-silent-contract-change'],
    'item.hard-rule-10': ['parcel.sensitive-data-safety', 'no-secrets-pii-or-payload-dumps'],
    'item.hard-rule-11': ['integration-surface.scenarios', 'positive-negative-failure-required'],
    'item.hard-rule-12': ['release.security-gate', 'security-evidence-blocks-release'],
    'item.hard-rule-13': ['coordination.persistence', 'durable-state-before-closure'],
    'item.hard-rule-14': ['scenario.environment-identity', 'environment-build-config-bound'],
    'item.hard-rule-15': ['release.claim-evidence', 'evidence-required-for-claim'],
  }
  if (sourceId === 'parcel-driven-development' && pddIdentities[itemId] !== undefined) {
    const identity = pddIdentities[itemId] as readonly [string, string]
    return { authoritySubject: identity[0], authorityClaim: identity[1] }
  }
  const atomicClaims: Readonly<Record<string, string>> = {
    'item.d1': 'separate-foreman-kernel-goal',
    'item.d2': 'shared-schema-boundary',
    'item.d3': 'kernel-state-authority',
    'item.d4': 'adapter-provider-neutrality',
    'item.d5': 'receipt-validation-boundary',
    'item.d6': 'structural-receipt-label',
    'item.d7': 'profile-not-enforcement',
    'item.d8': 'shadow-before-enforcement',
    'item.d9': 'three-gate-ownership',
    'item.d10': 'exact-parcel-mutation-scope',
    'item.d11': 'independent-verification-required',
    'item.d12': 'serialized-shared-files',
    'item.d13': 'post-review-diff-detection',
    'item.d14': 'git-canon-authority',
    'item.d15': 'external-effects-refused',
    'item.d16': 'caller-authority-refused',
    'item.d17': 'versioned-tool-contracts',
    'item.d18': 'evidence-not-authority',
    'item.d19': 'read-only-degraded-mode',
    'item.d20': 'unsupported-host-honesty',
  }
  const suffix = itemId.replace(/^item\./, '')
  return {
    authoritySubject:
      sourceId === 'fk-charter' ? `foreman-kernel.${suffix}` : `${sourceId}.${suffix}`,
    authorityClaim: atomicClaims[itemId] ?? `requires-${suffix}`,
  }
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
        roles: readonly (typeof allRoles)[number][]
        stages: readonly (typeof allStages)[number][]
        operations: readonly (typeof allOperations)[number][]
        hosts: readonly (typeof allHosts)[number][]
      }
    >
  > = {
    'item.constraint-1': {
      roles: ['builder'],
      stages: ['build'],
      operations: ['repo-mutation'],
      hosts: allHosts,
    },
    'item.constraint-2': {
      roles: ['builder'],
      stages: ['build'],
      operations: ['repo-mutation'],
      hosts: allHosts,
    },
    'item.constraint-3': {
      roles: ['builder'],
      stages: ['deterministic-verify'],
      operations: ['control-call'],
      hosts: allHosts,
    },
    'item.constraint-4': {
      roles: ['builder'],
      stages: ['build'],
      operations: ['control-call'],
      hosts: allHosts,
    },
    'item.constraint-5': {
      roles: ['builder'],
      stages: ['build', 'deterministic-verify'],
      operations: ['repo-mutation'],
      hosts: allHosts,
    },
    'item.constraint-6': {
      roles: ['builder'],
      stages: ['build'],
      operations: ['source-inventory'],
      hosts: allHosts,
    },
    'item.constraint-7': {
      roles: ['builder'],
      stages: ['build'],
      operations: ['control-call'],
      hosts: allHosts,
    },
    'item.constraint-8': {
      roles: ['reviewer'],
      stages: ['adversarial-review'],
      operations: ['repo-mutation'],
      hosts: allHosts,
    },
    'item.constraint-9': {
      roles: ['reviewer'],
      stages: ['adversarial-review'],
      operations: ['repo-read'],
      hosts: allHosts,
    },
    'item.constraint-10': {
      roles: ['reviewer'],
      stages: ['adversarial-review'],
      operations: ['repo-read'],
      hosts: allHosts,
    },
    'item.constraint-11': {
      roles: ['reviewer'],
      stages: ['adversarial-review'],
      operations: ['repo-read'],
      hosts: allHosts,
    },
    'item.constraint-12': {
      roles: ['builder'],
      stages: ['deterministic-verify'],
      operations: ['repo-mutation'],
      hosts: allHosts,
    },
    'item.constraint-13': {
      roles: ['builder'],
      stages: ['build'],
      operations: ['repo-mutation'],
      hosts: allHosts,
    },
    'item.hard-rule-1': {
      roles: ['coordinator', 'shaper', 'builder'],
      stages: ['step-zero', 'build'],
      operations: ['spec-mutation'],
      hosts: allHosts,
    },
    'item.hard-rule-2': {
      roles: ['shaper', 'builder', 'reviewer'],
      stages: ['shaping', 'build', 'adversarial-review'],
      operations: ['repo-mutation'],
      hosts: allHosts,
    },
    'item.hard-rule-3': {
      roles: ['builder', 'reviewer'],
      stages: ['build', 'adversarial-review'],
      operations: ['repo-mutation'],
      hosts: allHosts,
    },
    'item.hard-rule-4': {
      roles: ['coordinator', 'builder'],
      stages: ['step-zero', 'build'],
      operations: ['repo-mutation'],
      hosts: allHosts,
    },
    'item.hard-rule-5': {
      roles: ['coordinator', 'builder'],
      stages: ['build'],
      operations: ['repo-mutation'],
      hosts: allHosts,
    },
    'item.hard-rule-6': {
      roles: ['coordinator'],
      stages: ['build'],
      operations: ['repo-mutation'],
      hosts: allHosts,
    },
    'item.hard-rule-7': {
      roles: ['builder', 'ci'],
      stages: ['deterministic-verify'],
      operations: ['repo-read'],
      hosts: allHosts,
    },
    'item.hard-rule-8': {
      roles: ['builder'],
      stages: ['build'],
      operations: ['repo-mutation'],
      hosts: allHosts,
    },
    'item.hard-rule-9': {
      roles: ['coordinator', 'builder'],
      stages: ['build'],
      operations: ['repo-mutation'],
      hosts: allHosts,
    },
    'item.hard-rule-10': {
      roles: allRoles,
      stages: allStages,
      operations: allOperations,
      hosts: allHosts,
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
      roles: ['builder', 'reviewer'],
      stages: ['build', 'adversarial-review'],
      operations: ['repo-mutation'],
      hosts: allHosts,
    },
    'item.hard-rule-12': {
      roles: ['coordinator'],
      stages: ['merge'],
      operations: ['state-transition'],
      hosts: allHosts,
    },
    'item.hard-rule-13': {
      roles: ['coordinator'],
      stages: ['build', 'closure'],
      operations: ['state-transition'],
      hosts: allHosts,
    },
    'item.hard-rule-14': {
      roles: ['coordinator', 'builder', 'reviewer'],
      stages: ['deterministic-verify', 'adversarial-review'],
      operations: ['source-inventory'],
      hosts: allHosts,
    },
    'item.hard-rule-15': {
      roles: ['coordinator', 'builder', 'reviewer'],
      stages: ['deterministic-verify', 'adversarial-review', 'merge'],
      operations: ['source-inventory', 'state-transition'],
      hosts: allHosts,
    },
    'item.d3': {
      roles: ['coordinator', 'builder', 'reviewer', 'host-adapter', 'kernel'],
      stages: ['build', 'runtime'],
      operations: ['state-transition', 'control-call'],
      hosts: ['provider-neutral', 'claude-windows-docker-loaded'],
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
  const located = [...unique.values()]
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
        exclusionDisposition: 'not-rule' as const,
        rationale:
          'The heading is structural navigation; its complete body items carry the operative rules.',
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
      ...authorityIdentityFor(definition.sourceId, itemId),
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
  const linter = [
    'item.860f1c1146f4',
    'item.1dddb8e0edae',
    'item.fbc219d0ff13',
    'item.cc7db94c11c2',
    'item.7443d95fc46b',
    'item.0a36842682ef',
    'item.d6246c2593db',
  ].map((itemId) => get('spec-frontmatter-schema', itemId))
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
  ].map((itemId) => get('permission-profiles-registry', itemId))
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
      [...linter.map((item) => item.ruleId), ...linterValidator.map((item) => item.ruleId)],
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
      [...profileValidator.map((item) => item.ruleId), charterProfileBoundary.ruleId],
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
      gate1: [refFor(sources, 'fk-charter', 'item.b1ac4aa9eddf')],
      gate2: [
        refFor(sources, 'fk-charter', 'item.afbcffd2d557'),
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
