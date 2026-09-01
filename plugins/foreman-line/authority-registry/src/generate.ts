import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, stringify } from 'yaml'
import { generate } from '../../schema-scaffold/src/generate.js'
import {
  allSchemaFiles,
  R12_LEGACY_MARKDOWN_RULE_TARGETS,
  R12_PRIOR_REGISTRY_COMMIT,
  R13_NORMATIVE_MARKDOWN_AUDIT_KEYS,
  R13_NORMATIVE_MARKDOWN_PUBLICATION_KEYS,
  R13_PRIOR_REGISTRY_COMMIT,
} from './registry.js'
import type {
  AuthorityEffect,
  AuthorityEnforcementRegistry,
  AuthorityRule,
  AuthorityTier,
  CanonSource,
  NormativeMarkdownAuditRecord,
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
  registryBindingManifestDigest,
  sha256,
  typescriptConstructMap,
} from './validate.js'

const SNAPSHOT = '51857a3a7796b393c0c0a68712f98c06e7015d79'
const R12_GATE2_ALLOW_ITEMS = new Set([
  'fk-charter:item.15a44cf50bc6',
  'fk-loop-directive:item.47a75730afd6',
  'fk-loop-directive:item.bfffee6d7c1f',
])
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
    path: 'plugins/foreman-line/docs/SPEC-CONVENTION.md',
    sourceKind: 'foreman-contract',
    authorityTier: 'ratified-contract',
    authorityEffect: 'binding',
    scope: ['all-foreman-goals'],
  },
  {
    sourceId: 'coordinator-pattern',
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
    if (marker === '`' && (opener[3] ?? '').includes('`')) {
      cursor += 1
      continue
    }
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

interface MarkdownDocumentMap {
  readonly lines: readonly string[]
  readonly fenced: ReadonlySet<number>
}

function markdownDocumentMap(content: string): MarkdownDocumentMap {
  const rawLines = content.replace(/\r\n?/g, '\n').split('\n')
  const lines = stripMarkdownHtmlComments(content).replace(/\r\n?/g, '\n').split('\n')
  return { lines, fenced: pairedFenceLines(rawLines) }
}

function headingLocators(document: MarkdownDocumentMap): LocatedText[] {
  const { lines, fenced } = document
  const stack: { level: number; heading: string }[] = []
  const headings: { index: number; level: number; anchor: string }[] = []
  for (let index = 0; index < lines.length; index += 1) {
    if (fenced.has(index)) continue
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

function tableRows(document: MarkdownDocumentMap, keys: readonly string[]): LocatedText[] {
  const { lines, fenced } = document
  return keys.map((key) => {
    const matches = lines
      .map((line, index) => ({ line, index }))
      .filter(
        ({ line, index }) =>
          !fenced.has(index) && line.trim().split('|').slice(1, -1)[0]?.trim() === key,
      )
    if (matches.length !== 1) throw new Error(`table row '${key}' is not unique`)
    const match = matches[0] as { line: string; index: number }
    return {
      locator: { kind: 'table-row', anchor: key, lineHint: match.index + 1 },
      text: match.line,
    }
  })
}

function markdownBindingBlocks(document: MarkdownDocumentMap): LocatedText[] {
  const { lines, fenced } = document
  const headings: { level: number; text: string }[] = []
  const structuralOccurrences = new Map<string, number>()
  const tableGroups = new Map<string, number>()
  const blocks: LocatedText[] = []
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
    if (table && /^\s*\|?\s*:?-{3}/.test(lines[cursor + 1] ?? '')) {
      const headingPath = headings.map((item) => item.text).join(' > ') || '(preamble)'
      tableGroups.set(headingPath, (tableGroups.get(headingPath) ?? 0) + 1)
      cursor += 1
      continue
    }
    const list = /^\s*(?:[-*+] |\d+[.)] )/.test(line)
    let end = cursor + 1
    if (!table) {
      while (end < lines.length) {
        const next = lines[end] ?? ''
        if (
          next.trim() === '' ||
          next.trim() === '---' ||
          /^#{1,6}\s+/.test(next) ||
          /^\s*\|/.test(next) ||
          fenced.has(end)
        )
          break
        if (/^\s*(?:[-*+] |\d+[.)] )/.test(next)) break
        end += 1
      }
    }
    const text = lines.slice(cursor, end).join('\n')
    const headingPath = headings.map((item) => item.text).join(' > ') || '(preamble)'
    const kind = table ? 'table-row' : list ? 'list-item' : 'paragraph'
    const structuralKey = `${headingPath}\u0000${kind}`
    const structuralOrdinal = (structuralOccurrences.get(structuralKey) ?? 0) + 1
    structuralOccurrences.set(structuralKey, structuralOrdinal)
    const tableKey = table ? line.trim().split('|').slice(1, -1)[0]?.trim() : undefined
    if (table && (tableKey === undefined || tableKey === '')) {
      throw new Error(`Markdown table row at line ${cursor + 1} has no first-column key`)
    }
    const tableGroup = tableGroups.get(headingPath) ?? 1
    const tablePrefix =
      table && tableGroup > 1 ? `${headingPath} > table-group:${tableGroup}` : headingPath
    const anchor = `md-block:${tablePrefix}:${kind}:${table ? tableKey : structuralOrdinal}`
    blocks.push({
      locator: {
        kind: table ? 'table-row' : list ? 'numbered-item' : 'line-excerpt',
        anchor,
        lineHint: cursor + 1,
      },
      text,
    })
    cursor = end
  }
  return blocks
}

const priorR11Registry = parse(
  execFileSync(
    'git',
    [
      'show',
      `${R12_PRIOR_REGISTRY_COMMIT}:plugins/foreman-line/authority-registry/authority-enforcement-registry.yaml`,
    ],
    { cwd: repoRoot, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 },
  ),
) as AuthorityEnforcementRegistry

const priorR13Registry = parse(
  execFileSync(
    'git',
    [
      'show',
      `${R13_PRIOR_REGISTRY_COMMIT}:plugins/foreman-line/authority-registry/authority-enforcement-registry.yaml`,
    ],
    { cwd: repoRoot, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 },
  ),
) as AuthorityEnforcementRegistry

function priorStructuralAnchor(
  item: CanonSource['inventoryItems'][number],
  ordinal: number,
): string | null {
  const match = /^(md-block:.*):(paragraph|list-item|table-row):[0-9a-f]{12}:\d+$/.exec(
    item.locator.anchor,
  )
  if (match === null)
    return item.locator.anchor.startsWith('md-block:') ? item.locator.anchor : null
  if (match[2] === 'table-row') {
    const key = item.normalizedExcerpt.trim().split('|').slice(1, -1)[0]?.trim()
    if (key === undefined || key === '') return null
    return `${match[1]}:table-row:${key}`
  }
  return `${match[1]}:${match[2]}:${ordinal}`
}

const frozenMarkdownItemIds = new Map<string, string>()
for (const source of priorR11Registry.sources) {
  const ordinals = new Map<string, number>()
  for (const item of source.inventoryItems) {
    const match = /^(md-block:.*):(paragraph|list-item|table-row):[0-9a-f]{12}:\d+$/.exec(
      item.locator.anchor,
    )
    const ordinalKey = match === null ? item.locator.anchor : `${match[1]}\u0000${match[2]}`
    const ordinal = (ordinals.get(ordinalKey) ?? 0) + 1
    ordinals.set(ordinalKey, ordinal)
    const anchor = priorStructuralAnchor(item, ordinal)
    if (anchor === null) continue
    const preferred = source.inventoryItems.find(
      (candidate) =>
        candidate !== item &&
        candidate.locator.lineHint === item.locator.lineHint &&
        candidate.ruleIds.length > 0,
    )
    if (preferred === undefined && item.ruleIds.length === 0) continue
    const candidateId = preferred?.itemId ?? item.itemId
    const aliasesForCandidate = Object.entries(R12_LEGACY_MARKDOWN_RULE_TARGETS).filter(
      ([ruleId]) => ruleId.endsWith(candidateId.replace(/^item\./, '')),
    )
    if (aliasesForCandidate.some(([, target]) => target.anchor !== anchor)) continue
    frozenMarkdownItemIds.set(`${source.sourceId}\u0000${anchor}`, candidateId)
  }
}

for (const source of priorR11Registry.sources.filter((candidate) =>
  candidate.path.endsWith('.md'),
)) {
  const content = readFileSync(join(repoRoot, ...source.path.split('/')), 'utf8')
  for (const block of markdownBindingBlocks(markdownDocumentMap(content))) {
    const candidate = source.inventoryItems.find((item) => {
      if (item.locator.lineHint !== block.locator.lineHint || item.ruleIds.length === 0)
        return false
      return !Object.entries(R12_LEGACY_MARKDOWN_RULE_TARGETS).some(
        ([ruleId, target]) =>
          item.ruleIds.includes(ruleId) &&
          (target.sourceId !== source.sourceId || target.anchor !== block.locator.anchor),
      )
    })
    if (candidate !== undefined) {
      frozenMarkdownItemIds.set(`${source.sourceId}\u0000${block.locator.anchor}`, candidate.itemId)
    }
  }
}

for (const source of priorR13Registry.sources.filter((candidate) =>
  candidate.path.endsWith('.md'),
)) {
  for (const item of source.inventoryItems) {
    if (!item.locator.anchor.startsWith('md-block:')) continue
    frozenMarkdownItemIds.set(`${source.sourceId}\u0000${item.locator.anchor}`, item.itemId)
  }
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
  if (
    definition.sourceId === 'foreman-line-plan' &&
    located.locator.anchor ===
      R12_LEGACY_MARKDOWN_RULE_TARGETS['rule.foreman-line-plan.two-gate-thesis']?.anchor
  ) {
    return 'item.two-gate-thesis'
  }
  const frozenId = frozenMarkdownItemIds.get(
    `${definition.sourceId}\u0000${located.locator.anchor}`,
  )
  if (frozenId !== undefined) return frozenId
  if (
    definition.sourceId === 'fk-charter' &&
    located.locator.kind === 'table-row' &&
    /^D\d+$/.test(located.locator.anchor)
  ) {
    return `item.${located.locator.anchor.toLowerCase()}`
  }
  if (
    definition.sourceId === 'fk-plan-review-findings' &&
    located.locator.kind === 'table-row' &&
    /^R\d+$/.test(located.locator.anchor)
  ) {
    return `item.${located.locator.anchor.toLowerCase()}`
  }
  if (
    definition.sourceId === 'foreman-line-plan' &&
    located.locator.anchor.startsWith('**Thesis:**')
  ) {
    return 'item.two-gate-thesis'
  }
  return located.locator.anchor.startsWith('md-block:')
    ? `item.${shortId(canonicalJson({ sourceId: definition.sourceId, locator: located.locator }))}`
    : `item.${shortId(located.locator.anchor)}`
}

const R11_CURATED_ITEM_SEMANTICS: Readonly<
  Record<
    string,
    {
      readonly classification: RuleClassification
      readonly identity: readonly [string, string]
      readonly applicability: AuthorityRule['applicability']
    }
  >
> = {
  'spec-convention:item.276e79bdc002': {
    classification: 'pre-action-refusal',
    identity: ['spec.allowed-files-schema', 'exact-paths-and-no-globs'],
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['coordinator', 'shaper', 'builder'],
      stages: ['shaping', 'step-zero', 'build'],
      operations: ['spec-mutation', 'repo-mutation'],
      hosts: ['any'],
    },
  },
  'spec-convention:item.c4828bcd6dfa': {
    classification: 'pre-action-refusal',
    identity: [
      'spec.unlisted-path-amendment',
      'stop-and-coordinator-ratification-no-self-expansion',
    ],
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['builder'],
      stages: ['step-zero', 'build'],
      operations: ['spec-mutation', 'repo-mutation'],
      hosts: ['any'],
    },
  },
  'parcel-driven-development:item.78ff0093607e': {
    classification: 'pre-action-refusal',
    identity: ['spec.contract-amendment-authority', 'parcel-agent-cannot-edit-approved-contract'],
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['builder'],
      stages: ['build'],
      operations: ['spec-mutation', 'repo-mutation'],
      hosts: ['any'],
    },
  },
  'parcel-driven-development:item.cef628a1fce0': {
    classification: 'ci-static-check',
    identity: ['parcel.session-handoff', 'changed-session-requires-handoff'],
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['coordinator', 'shaper', 'builder', 'reviewer'],
      stages: ['shaping', 'build', 'adversarial-review', 'closure'],
      operations: ['repo-mutation', 'state-transition'],
      hosts: ['any'],
    },
  },
}

const R11_COMPOUND_ITEM_SEMANTICS: Readonly<
  Record<
    string,
    readonly {
      readonly suffix: string
      readonly normalizedStatement: string
      readonly identity: readonly [string, string]
      readonly applicability: AuthorityRule['applicability']
    }[]
  >
> = {
  'coordinator-pattern:item.47b2eaa2f9ef': [
    {
      suffix: 'ownership',
      normalizedStatement:
        'One goal, one coordinator: the loop directive carries an ownership block, and ownership transfers only at parcel boundaries via that block',
      identity: ['goal.coordinator-ownership', 'single-owner-transfer-only-at-parcel-boundaries'],
      applicability: {
        goals: ['all-foreman-goals'],
        roles: ['coordinator'],
        stages: ['runtime'],
        operations: ['state-transition'],
        hosts: ['provider-neutral'],
      },
    },
    {
      suffix: 'frozen-contract',
      normalizedStatement: 'a frozen contract needs modification',
      identity: ['goal.stop.ratified-boundary', 'stop-when-frozen-contract-needs-modification'],
      applicability: {
        goals: ['all-foreman-goals'],
        roles: ['coordinator'],
        stages: ['runtime'],
        operations: ['spec-mutation'],
        hosts: ['provider-neutral'],
      },
    },
    {
      suffix: 'tripwire',
      normalizedStatement: 'a tripwire fires twice on one parcel',
      identity: ['goal.stop.tripwire', 'stop-when-tripwire-fires-twice'],
      applicability: {
        goals: ['all-foreman-goals'],
        roles: ['coordinator'],
        stages: ['runtime'],
        operations: ['state-transition'],
        hosts: ['provider-neutral'],
      },
    },
    {
      suffix: 'security-boundary',
      normalizedStatement: "a security finding can't close in-parcel",
      identity: [
        'goal.stop.security-boundary',
        'stop-when-security-finding-cannot-close-in-parcel',
      ],
      applicability: {
        goals: ['all-foreman-goals'],
        roles: ['coordinator'],
        stages: ['runtime'],
        operations: ['state-transition'],
        hosts: ['provider-neutral'],
      },
    },
    {
      suffix: 'external-capability',
      normalizedStatement: 'anything outward-facing beyond the standing authorizations',
      identity: [
        'goal-stop.external-capability',
        'stop-outward-facing-beyond-standing-authorization',
      ],
      applicability: {
        goals: ['all-foreman-goals'],
        roles: ['coordinator'],
        stages: ['runtime'],
        operations: ['external-write'],
        hosts: ['provider-neutral'],
      },
    },
    {
      suffix: 'empty-queue',
      normalizedStatement: 'queue empty',
      identity: ['goal.stop.incomplete-empty-queue', 'stop-when-queue-empty-before-exit'],
      applicability: {
        goals: ['all-foreman-goals'],
        roles: ['coordinator'],
        stages: ['runtime'],
        operations: ['state-transition'],
        hosts: ['provider-neutral'],
      },
    },
  ],
}

const R11_APPLICABILITY_OVERRIDES: Readonly<Record<string, AuthorityRule['applicability']>> = {
  'fk-loop-directive:item.7a05d374a3b1': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: ['state-transition'],
    hosts: ['any'],
  },
  'fk-loop-directive:item.23f92834c1c8': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['shaping', 'runtime'],
    operations: ['spec-mutation'],
    hosts: ['any'],
  },
  'fk-loop-directive:item.d7945b743a67': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['build', 'deterministic-verify', 'adversarial-review', 'runtime'],
    operations: ['state-transition'],
    hosts: ['any'],
  },
  'fk-loop-directive:item.37f78aa591c5': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['shaping', 'build', 'adversarial-review', 'runtime'],
    operations: ['state-transition'],
    hosts: ['any'],
  },
  'fk-loop-directive:item.237865e0993f': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['closure', 'runtime'],
    operations: ['state-transition'],
    hosts: ['any'],
  },
}

const R11_PERMISSION_PROFILE_CURATION: Readonly<
  Record<
    string,
    {
      readonly classification: RuleClassification
      readonly applicability: AuthorityRule['applicability']
    }
  >
> = {
  'permission-profiles-registry:item.7faf78a6f54a': {
    classification: 'pre-action-refusal',
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['builder'],
      stages: ['step-zero', 'build'],
      operations: ['external-write'],
      hosts: ['claude-windows-docker-loaded'],
    },
  },
  'permission-profiles-registry:item.26c5e2b211da': {
    classification: 'pre-action-refusal',
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['builder'],
      stages: ['step-zero', 'build'],
      operations: ['external-write'],
      hosts: ['claude-windows-docker-loaded'],
    },
  },
  'permission-profiles-registry:item.1d221ed65b72': {
    classification: 'pre-action-refusal',
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['builder'],
      stages: ['step-zero', 'build'],
      operations: ['repo-mutation'],
      hosts: ['claude-windows-docker-loaded'],
    },
  },
  'permission-profiles-registry:item.1ce0fd439b3e': {
    classification: 'pre-action-refusal',
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['builder'],
      stages: ['step-zero', 'build'],
      operations: ['external-write'],
      hosts: ['claude-windows-docker-loaded'],
    },
  },
  'permission-profiles-registry:item.39e65fb31709': {
    classification: 'pre-action-refusal',
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['builder'],
      stages: ['step-zero', 'build'],
      operations: ['external-write'],
      hosts: ['claude-windows-docker-loaded'],
    },
  },
  'permission-profiles-registry:item.ffd949ad76c3': {
    classification: 'pre-action-refusal',
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['builder'],
      stages: ['step-zero', 'build'],
      operations: ['repo-mutation'],
      hosts: ['claude-windows-docker-loaded'],
    },
  },
  'permission-profiles-registry:item.c9cb62068f14': {
    classification: 'pre-action-refusal',
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['builder'],
      stages: ['step-zero', 'build'],
      operations: ['external-write'],
      hosts: ['claude-windows-docker-loaded'],
    },
  },
  'permission-profiles-registry:item.0ed672bcdee8': {
    classification: 'pre-action-refusal',
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['builder'],
      stages: ['step-zero', 'build'],
      operations: ['external-write'],
      hosts: ['claude-windows-docker-loaded'],
    },
  },
  'permission-profiles-registry:item.947d19fbeb35': {
    classification: 'pre-action-refusal',
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['builder'],
      stages: ['step-zero', 'build'],
      operations: ['external-write'],
      hosts: ['claude-windows-docker-loaded'],
    },
  },
  'permission-profiles-registry:item.5a359d80896b': {
    classification: 'pre-action-refusal',
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['builder'],
      stages: ['step-zero', 'build'],
      operations: ['external-write'],
      hosts: ['claude-windows-docker-loaded'],
    },
  },
  'permission-profiles-registry:item.ee0641be06f2': {
    classification: 'pre-action-refusal',
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['builder'],
      stages: ['step-zero', 'build'],
      operations: ['repo-mutation'],
      hosts: ['claude-windows-docker-loaded'],
    },
  },
  'permission-profiles-registry:item.cf29180bce81': {
    classification: 'pre-action-refusal',
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['builder'],
      stages: ['step-zero', 'build'],
      operations: ['external-write'],
      hosts: ['claude-windows-docker-loaded'],
    },
  },
  'permission-profiles-registry:item.4f213acde8e0': {
    classification: 'pre-action-refusal',
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['builder'],
      stages: ['step-zero', 'build'],
      operations: ['external-write'],
      hosts: ['claude-windows-docker-loaded'],
    },
  },
  'permission-profiles-registry:item.397a3eb4c7ad': {
    classification: 'pre-action-refusal',
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['builder'],
      stages: ['step-zero', 'build'],
      operations: ['repo-mutation'],
      hosts: ['claude-windows-docker-loaded'],
    },
  },
  'permission-profiles-registry:item.b9e7c5644f49': {
    classification: 'pre-action-refusal',
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['builder'],
      stages: ['step-zero', 'build'],
      operations: ['external-write'],
      hosts: ['claude-windows-docker-loaded'],
    },
  },
  'permission-profiles-registry:item.861d14c80da2': {
    classification: 'pre-action-refusal',
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['builder'],
      stages: ['step-zero', 'build'],
      operations: ['external-write'],
      hosts: ['claude-windows-docker-loaded'],
    },
  },
  'permission-profiles-registry:item.fe1bbb0564f6': {
    classification: 'pre-action-refusal',
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['builder'],
      stages: ['step-zero', 'build'],
      operations: ['repo-mutation'],
      hosts: ['claude-windows-docker-loaded'],
    },
  },
  'permission-profiles-registry:item.803732fe3411': {
    classification: 'pre-action-refusal',
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['builder'],
      stages: ['step-zero', 'build'],
      operations: ['external-write'],
      hosts: ['claude-windows-docker-loaded'],
    },
  },
  'permission-profiles-registry:item.b77e9988c19d': {
    classification: 'pre-action-refusal',
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['builder'],
      stages: ['step-zero', 'build'],
      operations: ['external-write'],
      hosts: ['claude-windows-docker-loaded'],
    },
  },
  'permission-profiles-registry:item.8cf9d57aa29c': {
    classification: 'pre-action-refusal',
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['builder'],
      stages: ['step-zero', 'build'],
      operations: ['repo-mutation'],
      hosts: ['claude-windows-docker-loaded'],
    },
  },
  'permission-profiles-registry:item.b01d14453456': {
    classification: 'pre-action-refusal',
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['coordinator'],
      stages: [
        'stage-zero',
        'shaping',
        'deterministic-verify',
        'adversarial-review',
        'merge',
        'closure',
        'runtime',
      ],
      operations: ['external-write'],
      hosts: ['claude-windows-docker-loaded'],
    },
  },
  'permission-profiles-registry:item.315ebd655fbe': {
    classification: 'pre-action-refusal',
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['coordinator'],
      stages: [
        'stage-zero',
        'shaping',
        'deterministic-verify',
        'adversarial-review',
        'merge',
        'closure',
        'runtime',
      ],
      operations: ['external-write'],
      hosts: ['claude-windows-docker-loaded'],
    },
  },
  'permission-profiles-registry:item.8e8e3c78500b': {
    classification: 'pre-action-refusal',
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['coordinator'],
      stages: [
        'stage-zero',
        'shaping',
        'deterministic-verify',
        'adversarial-review',
        'merge',
        'closure',
        'runtime',
      ],
      operations: ['repo-mutation'],
      hosts: ['claude-windows-docker-loaded'],
    },
  },
  'permission-profiles-registry:item.4c9cd1062bc6': {
    classification: 'pre-action-refusal',
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['coordinator'],
      stages: [
        'stage-zero',
        'shaping',
        'deterministic-verify',
        'adversarial-review',
        'merge',
        'closure',
        'runtime',
      ],
      operations: ['external-write'],
      hosts: ['claude-windows-docker-loaded'],
    },
  },
  'permission-profiles-registry:item.060989ad78ea': {
    classification: 'pre-action-refusal',
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['coordinator'],
      stages: [
        'stage-zero',
        'shaping',
        'deterministic-verify',
        'adversarial-review',
        'merge',
        'closure',
        'runtime',
      ],
      operations: ['external-write'],
      hosts: ['claude-windows-docker-loaded'],
    },
  },
  'permission-profiles-registry:item.30b62f67dc13': {
    classification: 'pre-action-refusal',
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['coordinator'],
      stages: [
        'stage-zero',
        'shaping',
        'deterministic-verify',
        'adversarial-review',
        'merge',
        'closure',
        'runtime',
      ],
      operations: ['repo-mutation'],
      hosts: ['claude-windows-docker-loaded'],
    },
  },
  'permission-profiles-registry:item.f7f03a01fd3a': {
    classification: 'pre-action-refusal',
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['reviewer'],
      stages: ['adversarial-review'],
      operations: ['repo-mutation'],
      hosts: ['claude-windows-docker-loaded'],
    },
  },
  'permission-profiles-registry:item.35cf0f58fc34': {
    classification: 'pre-action-refusal',
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['reviewer'],
      stages: ['adversarial-review'],
      operations: ['repo-mutation'],
      hosts: ['claude-windows-docker-loaded'],
    },
  },
  'permission-profiles-registry:item.dedb7349c943': {
    classification: 'pre-action-refusal',
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['reviewer'],
      stages: ['adversarial-review'],
      operations: ['repo-mutation'],
      hosts: ['claude-windows-docker-loaded'],
    },
  },
  'permission-profiles-registry:item.b7ab94d73ef4': {
    classification: 'pre-action-refusal',
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['reviewer'],
      stages: ['adversarial-review'],
      operations: ['external-write'],
      hosts: ['claude-windows-docker-loaded'],
    },
  },
  'permission-profiles-registry:item.9ab0d5db8ebf': {
    classification: 'pre-action-refusal',
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['reviewer'],
      stages: ['adversarial-review'],
      operations: ['repo-mutation'],
      hosts: ['claude-windows-docker-loaded'],
    },
  },
  'permission-profiles-registry:item.ea8666a98ca1': {
    classification: 'pre-action-refusal',
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['reviewer'],
      stages: ['adversarial-review'],
      operations: ['repo-mutation'],
      hosts: ['claude-windows-docker-loaded'],
    },
  },
  'permission-profiles-registry:item.3a54e390a3e1': {
    classification: 'pre-action-refusal',
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['reviewer'],
      stages: ['adversarial-review'],
      operations: ['repo-mutation'],
      hosts: ['claude-windows-docker-loaded'],
    },
  },
  'permission-profiles-registry:item.eb314ad28f5e': {
    classification: 'pre-action-refusal',
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['reviewer'],
      stages: ['adversarial-review'],
      operations: ['repo-mutation'],
      hosts: ['claude-windows-docker-loaded'],
    },
  },
  'permission-profiles-registry:item.14569d4abb87': {
    classification: 'pre-action-refusal',
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['reviewer'],
      stages: ['adversarial-review'],
      operations: ['repo-mutation'],
      hosts: ['claude-windows-docker-loaded'],
    },
  },
  'permission-profiles-registry:item.7943c5773fba': {
    classification: 'pre-action-refusal',
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['reviewer'],
      stages: ['adversarial-review'],
      operations: ['repo-mutation'],
      hosts: ['claude-windows-docker-loaded'],
    },
  },
  'permission-profiles-registry:item.2ca898541627': {
    classification: 'pre-action-refusal',
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['reviewer'],
      stages: ['adversarial-review'],
      operations: ['external-write'],
      hosts: ['claude-windows-docker-loaded'],
    },
  },
  'permission-profiles-registry:item.23838f138908': {
    classification: 'pre-action-refusal',
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['reviewer'],
      stages: ['adversarial-review'],
      operations: ['repo-mutation'],
      hosts: ['claude-windows-docker-loaded'],
    },
  },
  'permission-profiles-registry:item.6d850a4b4948': {
    classification: 'pre-action-refusal',
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['reviewer'],
      stages: ['adversarial-review'],
      operations: ['repo-mutation'],
      hosts: ['claude-windows-docker-loaded'],
    },
  },
  'permission-profiles-registry:item.f1d63df02914': {
    classification: 'pre-action-refusal',
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['reviewer'],
      stages: ['adversarial-review'],
      operations: ['repo-mutation'],
      hosts: ['claude-windows-docker-loaded'],
    },
  },
  'permission-profiles-registry:item.60eb2cbc6f43': {
    classification: 'pre-action-refusal',
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['shaper'],
      stages: ['shaping'],
      operations: ['external-write'],
      hosts: ['claude-windows-docker-loaded'],
    },
  },
  'permission-profiles-registry:item.1e0db040f9d8': {
    classification: 'pre-action-refusal',
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['shaper'],
      stages: ['shaping'],
      operations: ['external-write'],
      hosts: ['claude-windows-docker-loaded'],
    },
  },
  'permission-profiles-registry:item.e477240aeb8e': {
    classification: 'pre-action-refusal',
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['shaper'],
      stages: ['shaping'],
      operations: ['repo-mutation'],
      hosts: ['claude-windows-docker-loaded'],
    },
  },
  'permission-profiles-registry:item.074c70cc9d55': {
    classification: 'pre-action-refusal',
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['shaper'],
      stages: ['shaping'],
      operations: ['repo-mutation'],
      hosts: ['claude-windows-docker-loaded'],
    },
  },
  'permission-profiles-registry:item.5705a054df96': {
    classification: 'pre-action-refusal',
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['shaper'],
      stages: ['shaping'],
      operations: ['repo-mutation'],
      hosts: ['claude-windows-docker-loaded'],
    },
  },
  'permission-profiles-registry:item.b6db9d1f4737': {
    classification: 'pre-action-refusal',
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['shaper'],
      stages: ['shaping'],
      operations: ['repo-mutation'],
      hosts: ['claude-windows-docker-loaded'],
    },
  },
  'permission-profiles-registry:item.92b60e67dfba': {
    classification: 'pre-action-refusal',
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['shaper'],
      stages: ['shaping'],
      operations: ['repo-mutation'],
      hosts: ['claude-windows-docker-loaded'],
    },
  },
  'permission-profiles-registry:item.b8a82b2446d9': {
    classification: 'pre-action-refusal',
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['shaper'],
      stages: ['shaping'],
      operations: ['external-write'],
      hosts: ['claude-windows-docker-loaded'],
    },
  },
  'permission-profiles-registry:item.1fa440b2fe59': {
    classification: 'pre-action-refusal',
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['shaper'],
      stages: ['shaping'],
      operations: ['external-write'],
      hosts: ['claude-windows-docker-loaded'],
    },
  },
  'permission-profiles-registry:item.3641610e292b': {
    classification: 'pre-action-refusal',
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['shaper'],
      stages: ['shaping'],
      operations: ['repo-mutation'],
      hosts: ['claude-windows-docker-loaded'],
    },
  },
  'permission-profiles-registry:item.854101218a6d': {
    classification: 'pre-action-refusal',
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['shaper'],
      stages: ['shaping'],
      operations: ['repo-mutation'],
      hosts: ['claude-windows-docker-loaded'],
    },
  },
  'permission-profiles-registry:item.e4d0bc5dc904': {
    classification: 'pre-action-refusal',
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['shaper'],
      stages: ['shaping'],
      operations: ['repo-mutation'],
      hosts: ['claude-windows-docker-loaded'],
    },
  },
  'permission-profiles-registry:item.7b5310ad887b': {
    classification: 'pre-action-refusal',
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['shaper'],
      stages: ['shaping'],
      operations: ['repo-mutation'],
      hosts: ['claude-windows-docker-loaded'],
    },
  },
  'permission-profiles-registry:item.6ac66b888a40': {
    classification: 'pre-action-refusal',
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['shaper'],
      stages: ['shaping'],
      operations: ['repo-mutation'],
      hosts: ['claude-windows-docker-loaded'],
    },
  },
}

const R10_CURATED_ITEM_SEMANTICS: Readonly<
  Record<
    string,
    {
      readonly classification: RuleClassification
      readonly identity: readonly [string, string]
      readonly applicability: AuthorityRule['applicability']
    }
  >
> = {
  'goal-skill:item.02636597cc8d': {
    classification: 'pre-action-refusal',
    identity: ['goal.stage-zero-intake', 'explicit-design-questions-before-ratification'],
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['coordinator'],
      stages: ['stage-zero'],
      operations: ['spec-mutation'],
      hosts: ['any'],
    },
  },
  'goal-skill:item.fa27a05811dd': {
    classification: 'ci-static-check',
    identity: ['goal.charter-shape', 'charter-records-decisions-graph-exits-gates-and-stops'],
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['coordinator'],
      stages: ['stage-zero'],
      operations: ['spec-mutation'],
      hosts: ['any'],
    },
  },
  'goal-skill:item.8fda5f4d9776': {
    classification: 'pre-action-refusal',
    identity: ['gate1.ratification-authority', 'explicit-developer-ratification-required'],
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['coordinator'],
      stages: ['stage-zero'],
      operations: ['state-transition'],
      hosts: ['any'],
    },
  },
  'goal-skill:item.100b2d3e99ce': {
    classification: 'pre-action-refusal',
    identity: ['verification.issue-authority', 'coordinator-consumes-but-does-not-produce'],
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['coordinator'],
      stages: ['deterministic-verify', 'adversarial-review', 'merge', 'closure'],
      operations: ['state-transition', 'receipt-validation'],
      hosts: ['any'],
    },
  },
  'goal-skill:item.60b00947c4b6': {
    classification: 'pre-action-refusal',
    identity: ['goal.coordinator-ownership', 'stop-when-another-live-owner-is-named'],
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['coordinator'],
      stages: ['stage-zero', 'shaping', 'build', 'closure', 'runtime'],
      operations: ['state-transition'],
      hosts: ['any'],
    },
  },
  'goal-skill:item.da6c6e8b8123': {
    classification: 'pre-action-refusal',
    identity: ['goal.input-required', 'stop-until-a-goal-concept-exists'],
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['coordinator'],
      stages: ['stage-zero'],
      operations: ['state-transition'],
      hosts: ['any'],
    },
  },
  'goal-skill:item.3924cf25d478': {
    classification: 'independent-review-human-judgment',
    identity: ['goal.plan-review', 'fresh-plan-review-and-scoped-reratification-required'],
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['coordinator', 'reviewer'],
      stages: ['stage-zero', 'adversarial-review'],
      operations: ['source-inventory', 'state-transition'],
      hosts: ['any'],
    },
  },
  'goal-skill:item.95e72aecfbf6': {
    classification: 'ci-static-check',
    identity: ['goal.loop-directive', 'ownership-authorizations-queue-and-stops-required'],
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['coordinator'],
      stages: ['stage-zero'],
      operations: ['spec-mutation'],
      hosts: ['any'],
    },
  },
  'goal-skill:item.aa7f78b70702': {
    classification: 'ci-static-check',
    identity: ['goal.loop-pacing', 'completion-signals-and-long-fallbacks-without-polling'],
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['coordinator'],
      stages: ['runtime'],
      operations: ['state-transition'],
      hosts: ['any'],
    },
  },
  'goal-skill:item.a970cabbcc75': {
    classification: 'ci-static-check',
    identity: ['goal.parcel-cycle', 'complete-governed-parcel-cycle-required'],
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['coordinator'],
      stages: [
        'shaping',
        'build',
        'deterministic-verify',
        'adversarial-review',
        'merge',
        'closure',
      ],
      operations: ['source-inventory', 'repo-read', 'repo-mutation', 'state-transition'],
      hosts: ['any'],
    },
  },
  'goal-skill:item.0b5cc2b60d89': {
    classification: 'pre-action-refusal',
    identity: ['goal.human-gate-stop', 'human-gates-require-agent-completable-stop-reports'],
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['coordinator', 'host-adapter'],
      stages: ['merge', 'closure', 'runtime'],
      operations: ['state-transition', 'control-call'],
      hosts: ['any'],
    },
  },
  'goal-skill:item.fd22c7f94502': {
    classification: 'pre-action-refusal',
    identity: ['goal.loop-stop', 'stop-on-exit-stop-condition-or-developer-direction'],
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['coordinator'],
      stages: ['closure', 'runtime'],
      operations: ['state-transition'],
      hosts: ['any'],
    },
  },
  'coordinator-pattern:item.38dbf3185a76': {
    classification: 'pre-action-refusal',
    identity: ['goal.stage-zero-intake', 'scope-constraints-and-canon-interrogated'],
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['coordinator'],
      stages: ['stage-zero'],
      operations: ['spec-mutation'],
      hosts: ['any'],
    },
  },
  'coordinator-pattern:item.84b4e388c06b': {
    classification: 'pre-action-refusal',
    identity: ['goal.design-decision-authority', 'developer-disposes-explicit-decisions'],
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['coordinator'],
      stages: ['stage-zero'],
      operations: ['state-transition'],
      hosts: ['any'],
    },
  },
  'coordinator-pattern:item.d62734f662a0': {
    classification: 'pre-action-refusal',
    identity: ['canon.commentary-mutation-authority', 'explicit-targeted-direction-required'],
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['coordinator'],
      stages: ['stage-zero', 'shaping', 'build'],
      operations: ['spec-mutation', 'state-transition'],
      hosts: ['any'],
    },
  },
  'coordinator-pattern:item.00f63e7818bc': {
    classification: 'ci-static-check',
    identity: ['goal.charter-shape', 'charter-records-governed-goal-structure'],
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['coordinator'],
      stages: ['stage-zero'],
      operations: ['spec-mutation'],
      hosts: ['any'],
    },
  },
  'coordinator-pattern:item.a3d15fe678e1': {
    classification: 'pre-action-refusal',
    identity: ['gate1.ratification-authority', 'explicit-developer-ratification-required'],
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['coordinator'],
      stages: ['stage-zero'],
      operations: ['state-transition'],
      hosts: ['any'],
    },
  },
  'coordinator-pattern:item.dedbefc1b097': {
    classification: 'pre-action-refusal',
    identity: ['gate1.ratification-delegability', 'gate-one-never-delegable'],
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['coordinator'],
      stages: ['stage-zero'],
      operations: ['state-transition'],
      hosts: ['any'],
    },
  },
  'coordinator-pattern:item.91dd60b00fd6': {
    classification: 'pre-action-refusal',
    identity: ['gate2.dispatch-grant', 'charter-scoped-standing-dispatch-authorization'],
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['coordinator'],
      stages: ['shaping'],
      operations: ['state-transition'],
      hosts: ['any'],
    },
  },
  'coordinator-pattern:item.f7686ab58db7': {
    classification: 'pre-action-refusal',
    identity: ['gate3.merge-authority', 'contingent-delegation'],
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['coordinator'],
      stages: ['merge'],
      operations: ['state-transition'],
      hosts: ['any'],
    },
  },
  'coordinator-pattern:item.a18d27d46b1e': {
    classification: 'pre-action-refusal',
    identity: ['verification.issue-authority', 'coordinator-consumes-but-does-not-produce'],
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['coordinator'],
      stages: ['deterministic-verify', 'adversarial-review', 'merge', 'closure'],
      operations: ['state-transition', 'receipt-validation'],
      hosts: ['any'],
    },
  },
  'coordinator-pattern:item.d7759c5e4d44': {
    classification: 'independent-review-human-judgment',
    identity: ['goal.plan-review', 'fresh-plan-review-before-first-parcel'],
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['coordinator', 'reviewer'],
      stages: ['stage-zero', 'adversarial-review'],
      operations: ['source-inventory', 'state-transition'],
      hosts: ['any'],
    },
  },
  'coordinator-pattern:item.27e4a58df78c': {
    classification: 'independent-review-human-judgment',
    identity: ['goal.plan-review-focus', 'decomposition-boundary-decision-and-collision-review'],
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['reviewer'],
      stages: ['adversarial-review'],
      operations: ['source-inventory'],
      hosts: ['any'],
    },
  },
  'coordinator-pattern:item.a90198c811be': {
    classification: 'pre-action-refusal',
    identity: ['gate1.scoped-reopen', 'decision-changing-triage-reopens-gate-one'],
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['coordinator'],
      stages: ['stage-zero'],
      operations: ['state-transition'],
      hosts: ['any'],
    },
  },
  'coordinator-pattern:item.44badf453ad6': {
    classification: 'independent-review-human-judgment',
    identity: ['goal.plan-review-universality', 'plan-review-runs-for-every-goal'],
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['coordinator', 'reviewer'],
      stages: ['stage-zero', 'adversarial-review'],
      operations: ['state-transition'],
      hosts: ['any'],
    },
  },
  'coordinator-pattern:item.c9bfcc35b53e': {
    classification: 'pre-action-refusal',
    identity: ['goal.gate-record', 'gates-live-in-directives-not-permission-prompts'],
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['coordinator'],
      stages: ['shaping', 'merge'],
      operations: ['state-transition'],
      hosts: ['any'],
    },
  },
  'coordinator-pattern:item.6fa5b60d426b': {
    classification: 'post-action-detection',
    identity: ['permission-profile.enforcement-bound', 'loaded-session-mediation-is-incomplete'],
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['coordinator', 'builder', 'reviewer'],
      stages: ['build', 'adversarial-review'],
      operations: ['repo-mutation', 'control-call'],
      hosts: ['any'],
    },
  },
  'coordinator-pattern:item.7e0b48ad8223': {
    classification: 'ci-static-check',
    identity: ['routing.coordinator-session', 'frontier-long-running-goal-session'],
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['coordinator'],
      stages: ['any'],
      operations: ['source-inventory'],
      hosts: ['any'],
    },
  },
  'coordinator-pattern:item.199277d75b40': {
    classification: 'ci-static-check',
    identity: ['routing.builder-standard', 'standard-builder-isolated-parcel-session'],
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['builder'],
      stages: ['step-zero', 'build'],
      operations: ['source-inventory'],
      hosts: ['any'],
    },
  },
  'coordinator-pattern:item.986daac0fa56': {
    classification: 'ci-static-check',
    identity: ['routing.builder-architecture', 'architecture-builder-uses-frontier-isolation'],
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['builder'],
      stages: ['step-zero', 'build'],
      operations: ['source-inventory'],
      hosts: ['any'],
    },
  },
  'coordinator-pattern:item.c64915fec3a9': {
    classification: 'post-action-detection',
    identity: ['routing.reviewer-posture', 'fresh-reviewer-mutation-reduced-not-eliminated'],
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['reviewer'],
      stages: ['adversarial-review'],
      operations: ['repo-mutation', 'control-call'],
      hosts: ['any'],
    },
  },
  'coordinator-pattern:item.a0945ba49018': {
    classification: 'pre-action-refusal',
    identity: ['routing.shaper-posture', 'fresh-shaper-docs-only-writes'],
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['shaper'],
      stages: ['shaping'],
      operations: ['repo-mutation'],
      hosts: ['any'],
    },
  },
  'coordinator-pattern:item.c5bd4203e8bf': {
    classification: 'pre-action-refusal',
    identity: [
      'goal.dispatch-mechanics',
      'step-zero-isolation-complete-rework-and-two-review-controls',
    ],
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['coordinator'],
      stages: ['shaping', 'step-zero', 'build', 'adversarial-review'],
      operations: ['source-inventory', 'repo-mutation', 'state-transition'],
      hosts: ['any'],
    },
  },
  'coordinator-pattern:item.47b2eaa2f9ef': {
    classification: 'pre-action-refusal',
    identity: ['goal.coordinator-ownership', 'single-owner-transfer-only-at-parcel-boundaries'],
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['coordinator'],
      stages: ['runtime'],
      operations: ['state-transition'],
      hosts: ['any'],
    },
  },
  'coordinator-pattern:item.ebd83f2562f3': {
    classification: 'pre-action-refusal',
    identity: ['gate1.scoped-reopen', 'only-affected-irreversible-work-is-held'],
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['coordinator'],
      stages: ['stage-zero'],
      operations: ['state-transition'],
      hosts: ['any'],
    },
  },
  'coordinator-pattern:item.0d38fd58e6b8': {
    classification: 'ci-static-check',
    identity: ['verification.coordinator-spine', 'disk-closure-determinism-and-tripwires-required'],
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['coordinator'],
      stages: ['deterministic-verify', 'adversarial-review'],
      operations: ['source-inventory', 'repo-read'],
      hosts: ['any'],
    },
  },
  'coordinator-pattern:item.d83180642e4d': {
    classification: 'ci-static-check',
    identity: ['goal.exit-custody', 'word-exact-exits-require-real-artifacts'],
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['coordinator'],
      stages: ['shaping', 'deterministic-verify', 'closure'],
      operations: ['source-inventory', 'spec-mutation', 'state-transition'],
      hosts: ['any'],
    },
  },
  'coordinator-pattern:item.3d29095eda6a': {
    classification: 'ci-static-check',
    identity: ['goal.lessons-discipline', 'lessons-remain-provenance-with-narrow-installation'],
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['coordinator'],
      stages: ['closure'],
      operations: ['spec-mutation', 'state-transition'],
      hosts: ['any'],
    },
  },
  'coordinator-pattern:item.0890828ec6f8': {
    classification: 'ci-static-check',
    identity: ['goal.pattern-extraction', 'promote-only-after-repeated-shipped-practice'],
    applicability: {
      goals: ['all-foreman-goals'],
      roles: ['coordinator'],
      stages: ['closure'],
      operations: ['spec-mutation'],
      hosts: ['any'],
    },
  },
}

const CURATED_ITEM_CLASSIFICATIONS: Readonly<Record<string, RuleClassification>> = {
  'fk-charter:item.d1': 'ci-static-check',
  'fk-charter:item.d2': 'ci-static-check',
  'fk-charter:item.d3': 'pre-action-refusal',
  'fk-charter:item.d4': 'ci-static-check',
  'fk-charter:item.d5': 'pre-action-refusal',
  'fk-charter:item.d6': 'ci-static-check',
  'fk-charter:item.d7': 'post-action-detection',
  'fk-charter:item.d8': 'post-action-detection',
  'fk-charter:item.d9': 'independent-review-human-judgment',
  'fk-charter:item.d10': 'pre-action-refusal',
  'fk-charter:item.d11': 'ci-static-check',
  'fk-charter:item.d12': 'pre-action-refusal',
  'fk-charter:item.d13': 'post-action-detection',
  'fk-charter:item.d14': 'ci-static-check',
  'fk-charter:item.d15': 'pre-action-refusal',
  'fk-charter:item.d16': 'pre-action-refusal',
  'fk-charter:item.d17': 'pre-action-refusal',
  'fk-charter:item.d18': 'ci-static-check',
  'fk-charter:item.d19': 'pre-action-refusal',
  'fk-charter:item.d20': 'ci-static-check',
  'fk-charter:item.a583b7f02950': 'narrative-provenance',
  'fk-charter:item.93d5d3978e5f': 'pre-action-refusal',
  'fk-charter:item.cd014d6d90c5': 'independent-review-human-judgment',
  'fk-charter:item.144bb836f528': 'pre-action-refusal',
  'fk-charter:item.7d74bdcd5bb3': 'ci-static-check',
  'fk-charter:item.5f823cd304d6': 'ci-static-check',
  'fk-charter:item.f1439c7e3a90': 'ci-static-check',
  'fk-charter:item.fec816847e8e': 'ci-static-check',
  'fk-charter:item.a087b0ab4c3b': 'pre-action-refusal',
  'fk-charter:item.10bcdc2cae49': 'ci-static-check',
  'fk-charter:item.e9ec57edc0a2': 'pre-action-refusal',
  'fk-charter:item.eddc1a2874a3': 'ci-static-check',
  'fk-charter:item.248b8ef73429': 'ci-static-check',
  'fk-charter:item.7854414d4093': 'ci-static-check',
  'fk-charter:item.a0d98411d75e': 'ci-static-check',
  'fk-charter:item.fec95f508418': 'ci-static-check',
  'fk-charter:item.4910b2a0a7a3': 'ci-static-check',
  'fk-charter:item.4d6ea442cfff': 'ci-static-check',
  'fk-charter:item.49288a83830e': 'ci-static-check',
  'fk-charter:item.8cf027fc811e': 'independent-review-human-judgment',
  'fk-charter:item.15a44cf50bc6': 'pre-action-refusal',
  'fk-charter:item.c74628d41600': 'pre-action-refusal',
  'fk-charter:item.d9921c51d7ea': 'pre-action-refusal',
  'fk-charter:item.41b4b3dccd81': 'pre-action-refusal',
  'fk-charter:item.0afd841f51f8': 'pre-action-refusal',
  'fk-charter:item.c80d986d4cfe': 'pre-action-refusal',
  'fk-charter:item.ab729d219bbb': 'pre-action-refusal',
  'fk-charter:item.1c42ce2f7e94': 'pre-action-refusal',
  'fk-charter:item.28ec67f3ddb4': 'pre-action-refusal',
  'fk-charter:item.5138fd735a8a': 'pre-action-refusal',
  'fk-charter:item.6aae5fe2d602': 'pre-action-refusal',
  'fk-charter:item.fc4a386b94fe': 'pre-action-refusal',
  'fk-charter:item.42e05d00c67a': 'pre-action-refusal',
  'fk-charter:item.07490af17320': 'pre-action-refusal',
  'fk-charter:item.b5bad0475a3e': 'pre-action-refusal',
  'fk-charter:item.e86843a842bc': 'pre-action-refusal',
  'fk-charter:item.98b291e68000': 'pre-action-refusal',
  'fk-charter:item.2cbbc7ae0192': 'pre-action-refusal',
  'fk-charter:item.76049b5d2003': 'pre-action-refusal',
  'fk-charter:item.b1ac4aa9eddf': 'pre-action-refusal',
  'fk-charter:item.b0a3e204145f': 'narrative-provenance',
  'fk-plan-review-findings:item.r1': 'narrative-provenance',
  'fk-plan-review-findings:item.r2': 'pre-action-refusal',
  'fk-plan-review-findings:item.r3': 'narrative-provenance',
  'fk-plan-review-findings:item.r4': 'unsupported',
  'fk-plan-review-findings:item.r5': 'ci-static-check',
  'fk-plan-review-findings:item.r6': 'pre-action-refusal',
  'fk-plan-review-findings:item.r7': 'narrative-provenance',
  'fk-plan-review-findings:item.r8': 'narrative-provenance',
  'fk-plan-review-findings:item.r9': 'ci-static-check',
  'fk-plan-review-findings:item.r10': 'unsupported',
  'fk-plan-review-findings:item.r11': 'ci-static-check',
  'fk-plan-review-findings:item.r12': 'post-action-detection',
  'fk-plan-review-findings:item.r13': 'pre-action-refusal',
  'fk-plan-review-findings:item.1de06653021c': 'narrative-provenance',
  'fk-loop-directive:item.7a05d374a3b1': 'pre-action-refusal',
  'fk-loop-directive:item.b81725578197': 'narrative-provenance',
  'fk-loop-directive:item.aac2d1258986': 'narrative-provenance',
  'fk-loop-directive:item.4f0fb14fbd95': 'narrative-provenance',
  'fk-loop-directive:item.47a75730afd6': 'pre-action-refusal',
  'fk-loop-directive:item.08b3cbb91027': 'pre-action-refusal',
  'fk-loop-directive:item.ae7854c7dad1': 'post-action-detection',
  'fk-loop-directive:item.dd8203551518': 'pre-action-refusal',
  'fk-loop-directive:item.ebdd14e6f524': 'pre-action-refusal',
  'fk-loop-directive:item.a59b01361dc6': 'pre-action-refusal',
  'fk-loop-directive:item.734b79ca0bb8': 'pre-action-refusal',
  'fk-loop-directive:item.51f7dbbba473': 'pre-action-refusal',
  'fk-loop-directive:item.d69eca1ec1f6': 'pre-action-refusal',
  'fk-loop-directive:item.fc3ea1441f92': 'pre-action-refusal',
  'fk-loop-directive:item.15e5fcbdbe13': 'pre-action-refusal',
  'fk-loop-directive:item.bfffee6d7c1f': 'pre-action-refusal',
  'fk-loop-directive:item.431228393540': 'pre-action-refusal',
  'fk-loop-directive:item.be7691d170a9': 'pre-action-refusal',
  'fk-loop-directive:item.9935b3499764': 'pre-action-refusal',
  'fk-loop-directive:item.64341d1e8b82': 'pre-action-refusal',
  'fk-loop-directive:item.7eb6018d9e57': 'pre-action-refusal',
  'fk-loop-directive:item.7aa2dd930e35': 'pre-action-refusal',
  'fk-loop-directive:item.8c0b09120ff1': 'ci-static-check',
  'fk-loop-directive:item.d3b0e9dd63d0': 'pre-action-refusal',
  'fk-loop-directive:item.f7e8dffebadc': 'ci-static-check',
  'fk-loop-directive:item.1157c2a03bbe': 'pre-action-refusal',
  'fk-loop-directive:item.bdd56a126b79': 'pre-action-refusal',
  'fk-loop-directive:item.ed8d7888ce8c': 'ci-static-check',
  'fk-loop-directive:item.6ea9ce2b9573': 'ci-static-check',
  'fk-loop-directive:item.ce9042d917b2': 'independent-review-human-judgment',
  'fk-loop-directive:item.d978784bc1b7': 'independent-review-human-judgment',
  'fk-loop-directive:item.2743c2f8c558': 'pre-action-refusal',
  'fk-loop-directive:item.e3065db62b43': 'pre-action-refusal',
  'fk-loop-directive:item.1576c95260b6': 'pre-action-refusal',
  'fk-loop-directive:item.8f98d5e3e61a': 'ci-static-check',
  'fk-loop-directive:item.4f26e86b0870': 'ci-static-check',
  'fk-loop-directive:item.5909432cc1a7': 'ci-static-check',
  'fk-loop-directive:item.b2e02392e4e5': 'ci-static-check',
  'fk-loop-directive:item.ec3e0d0130ff': 'ci-static-check',
  'fk-loop-directive:item.e7e5c2483975': 'pre-action-refusal',
  'fk-loop-directive:item.c6c0339a5001': 'ci-static-check',
  'fk-loop-directive:item.78a9d344c4c6': 'pre-action-refusal',
  'fk-loop-directive:item.5820c7f79bef': 'pre-action-refusal',
  'fk-loop-directive:item.7f72e946ccbe': 'pre-action-refusal',
  'fk-loop-directive:item.23f92834c1c8': 'pre-action-refusal',
  'fk-loop-directive:item.6151d43333aa': 'pre-action-refusal',
  'fk-loop-directive:item.c708d8f95113': 'pre-action-refusal',
  'fk-loop-directive:item.adee76eb5f43': 'pre-action-refusal',
  'fk-loop-directive:item.52f524327994': 'pre-action-refusal',
  'fk-loop-directive:item.37f78aa591c5': 'pre-action-refusal',
  'fk-loop-directive:item.d7945b743a67': 'pre-action-refusal',
  'fk-loop-directive:item.80f2c4a08e42': 'pre-action-refusal',
  'fk-loop-directive:item.c55a33cc847f': 'pre-action-refusal',
  'fk-loop-directive:item.237865e0993f': 'pre-action-refusal',
  'fk-loop-directive:item.7ad3390acb6b': 'pre-action-refusal',
  'spec-convention:item.fd5d51dd4808': 'narrative-provenance',
  'spec-convention:item.f2172f28e7fc': 'narrative-provenance',
  'spec-convention:item.71d77f22d163': 'narrative-provenance',
  'spec-convention:item.ea0314db8499': 'narrative-provenance',
  'spec-convention:item.d2b2084774b8': 'narrative-provenance',
  'spec-convention:item.910181940014': 'narrative-provenance',
  'spec-convention:item.c9b45d54e97b': 'narrative-provenance',
  'spec-convention:item.4fa776b35f0b': 'narrative-provenance',
  'spec-convention:item.4886c52fa322': 'narrative-provenance',
  'spec-convention:item.74a07f6879cc': 'narrative-provenance',
  'spec-convention:item.03f0830cd693': 'pre-action-refusal',
  'spec-convention:item.7a55cf4f2295': 'narrative-provenance',
  'spec-convention:item.0979dba6c958': 'ci-static-check',
  'spec-convention:item.efb0769d6ff2': 'narrative-provenance',
  'spec-convention:item.513e18f22be3': 'narrative-provenance',
  'spec-convention:item.6dbbca88286f': 'narrative-provenance',
  'spec-convention:item.e6f5fa8543a1': 'narrative-provenance',
  'spec-convention:item.ac5ff7afd06f': 'narrative-provenance',
  'spec-convention:item.5145ab15549c': 'narrative-provenance',
  'spec-convention:item.fd82127bf9f9': 'narrative-provenance',
  'spec-convention:item.022fc00afe7b': 'narrative-provenance',
  'coordinator-pattern:item.38dbf3185a76': 'narrative-provenance',
  'coordinator-pattern:item.84b4e388c06b': 'narrative-provenance',
  'coordinator-pattern:item.d62734f662a0': 'narrative-provenance',
  'coordinator-pattern:item.00f63e7818bc': 'narrative-provenance',
  'coordinator-pattern:item.a3d15fe678e1': 'narrative-provenance',
  'coordinator-pattern:item.dedbefc1b097': 'narrative-provenance',
  'coordinator-pattern:item.91dd60b00fd6': 'narrative-provenance',
  'coordinator-pattern:item.f7686ab58db7': 'narrative-provenance',
  'goal-skill:item.02636597cc8d': 'narrative-provenance',
  'goal-skill:item.fa27a05811dd': 'narrative-provenance',
  'goal-skill:item.8fda5f4d9776': 'narrative-provenance',
  'standing-constraints:item.constraint-1': 'pre-action-refusal',
  'standing-constraints:item.constraint-2': 'pre-action-refusal',
  'standing-constraints:item.constraint-3': 'pre-action-refusal',
  'standing-constraints:item.constraint-4': 'pre-action-refusal',
  'standing-constraints:item.constraint-5': 'ci-static-check',
  'standing-constraints:item.constraint-12': 'ci-static-check',
  'standing-constraints:item.constraint-13': 'pre-action-refusal',
  'standing-constraints:item.constraint-6': 'pre-action-refusal',
  'standing-constraints:item.constraint-7': 'pre-action-refusal',
  'standing-constraints:item.constraint-8': 'independent-review-human-judgment',
  'standing-constraints:item.constraint-9': 'independent-review-human-judgment',
  'standing-constraints:item.constraint-10': 'post-action-detection',
  'standing-constraints:item.constraint-11': 'independent-review-human-judgment',
  'standing-constraints:item.c5880644c95c': 'narrative-provenance',
  'parcel-driven-development:item.hard-rule-1': 'pre-action-refusal',
  'parcel-driven-development:item.hard-rule-2': 'pre-action-refusal',
  'parcel-driven-development:item.hard-rule-3': 'pre-action-refusal',
  'parcel-driven-development:item.hard-rule-4': 'pre-action-refusal',
  'parcel-driven-development:item.hard-rule-5': 'pre-action-refusal',
  'parcel-driven-development:item.hard-rule-6': 'pre-action-refusal',
  'parcel-driven-development:item.hard-rule-7': 'ci-static-check',
  'parcel-driven-development:item.hard-rule-8': 'pre-action-refusal',
  'parcel-driven-development:item.hard-rule-9': 'pre-action-refusal',
  'parcel-driven-development:item.hard-rule-10': 'pre-action-refusal',
  'parcel-driven-development:item.hard-rule-11': 'ci-static-check',
  'parcel-driven-development:item.hard-rule-12': 'independent-review-human-judgment',
  'parcel-driven-development:item.hard-rule-13': 'pre-action-refusal',
  'parcel-driven-development:item.hard-rule-14': 'ci-static-check',
  'parcel-driven-development:item.hard-rule-15': 'ci-static-check',
  'parcel-driven-development:item.b7563a79cc57': 'narrative-provenance',
  'parcel-driven-development:item.400cc2cfd0d5': 'narrative-provenance',
  'parcel-driven-development:item.303fe3f67dae': 'narrative-provenance',
  'parcel-driven-development:item.f1add5311b6c': 'narrative-provenance',
  'parcel-driven-development:item.9d8d06d91590': 'narrative-provenance',
  'parcel-driven-development:item.dbee4594f901': 'narrative-provenance',
  'parcel-driven-development:item.7a8af4ddaa1e': 'narrative-provenance',
  'parcel-driven-development:item.98f93a29441d': 'narrative-provenance',
  'parcel-driven-development:item.e4751682430a': 'narrative-provenance',
  'parcel-driven-development:item.72c60fa596e7': 'narrative-provenance',
  'parcel-driven-development:item.754e096cfecf': 'narrative-provenance',
  'parcel-driven-development:item.876882377a6a': 'narrative-provenance',
  'foreman-line-plan:item.two-gate-thesis': 'narrative-provenance',
  'foreman-line-plan:item.75569dd4ae1a': 'independent-review-human-judgment',
  'foreman-line-plan:item.56a15a2f3220': 'ci-static-check',
  'foreman-line-plan:item.c92333c21e64': 'narrative-provenance',
  'foreman-line-plan:item.760cf6497075': 'pre-action-refusal',
  'approval-readme:item.4261d18b3243': 'narrative-provenance',
  'approval-readme:item.ff6f38f088ae': 'narrative-provenance',
  'spec-frontmatter-schema:item.bdf997c3cd45': 'ci-static-check',
  'spec-linter-validator:item.c6669b61c6f0': 'ci-static-check',
  'spec-linter-validator:item.256b9064bc47': 'ci-static-check',
  'spec-linter-validator:item.092d2fc43a32': 'ci-static-check',
  'spec-linter-validator:item.fb7d76a32df4': 'ci-static-check',
  'spec-linter-cli:item.0479c603add5': 'ci-static-check',
  'spec-linter-cli:item.fb268f5c5eb4': 'ci-static-check',
  'spec-linter-cli:item.66fec8a20db5': 'ci-static-check',
  'spec-linter-cli:item.39787f778432': 'ci-static-check',
  'spec-linter-readme:item.9a889881a236': 'unsupported',
  'spec-linter-readme:item.b4f5d76d68ec': 'unsupported',
  'permission-profiles-registry:item.1ec33a4741eb': 'ci-static-check',
  'permission-profiles-registry:item.7faf78a6f54a': 'pre-action-refusal',
  'permission-profiles-registry:item.26c5e2b211da': 'pre-action-refusal',
  'permission-profiles-registry:item.1d221ed65b72': 'pre-action-refusal',
  'permission-profiles-registry:item.1ce0fd439b3e': 'pre-action-refusal',
  'permission-profiles-registry:item.39e65fb31709': 'pre-action-refusal',
  'permission-profiles-registry:item.ffd949ad76c3': 'pre-action-refusal',
  'permission-profiles-registry:item.c9cb62068f14': 'ci-static-check',
  'permission-profiles-registry:item.13033f70c124': 'ci-static-check',
  'permission-profiles-registry:item.947d19fbeb35': 'pre-action-refusal',
  'permission-profiles-registry:item.5a359d80896b': 'pre-action-refusal',
  'permission-profiles-registry:item.ee0641be06f2': 'pre-action-refusal',
  'permission-profiles-registry:item.cf29180bce81': 'pre-action-refusal',
  'permission-profiles-registry:item.4f213acde8e0': 'pre-action-refusal',
  'permission-profiles-registry:item.397a3eb4c7ad': 'pre-action-refusal',
  'permission-profiles-registry:item.f0613939994f': 'ci-static-check',
  'permission-profiles-registry:item.58ef984a0faa': 'ci-static-check',
  'permission-profiles-registry:item.50cd9c68ff51': 'ci-static-check',
  'permission-profiles-registry:item.b9e7c5644f49': 'pre-action-refusal',
  'permission-profiles-registry:item.861d14c80da2': 'pre-action-refusal',
  'permission-profiles-registry:item.fe1bbb0564f6': 'pre-action-refusal',
  'permission-profiles-registry:item.803732fe3411': 'pre-action-refusal',
  'permission-profiles-registry:item.b77e9988c19d': 'pre-action-refusal',
  'permission-profiles-registry:item.8cf9d57aa29c': 'pre-action-refusal',
  'permission-profiles-registry:item.0ed672bcdee8': 'ci-static-check',
  'permission-profiles-registry:item.bbb2cdb40927': 'ci-static-check',
  'permission-profiles-registry:item.b01d14453456': 'pre-action-refusal',
  'permission-profiles-registry:item.315ebd655fbe': 'pre-action-refusal',
  'permission-profiles-registry:item.8e8e3c78500b': 'pre-action-refusal',
  'permission-profiles-registry:item.4c9cd1062bc6': 'pre-action-refusal',
  'permission-profiles-registry:item.060989ad78ea': 'pre-action-refusal',
  'permission-profiles-registry:item.30b62f67dc13': 'pre-action-refusal',
  'permission-profiles-registry:item.7417033cefc7': 'ci-static-check',
  'permission-profiles-registry:item.f7f03a01fd3a': 'pre-action-refusal',
  'permission-profiles-registry:item.35cf0f58fc34': 'pre-action-refusal',
  'permission-profiles-registry:item.dedb7349c943': 'pre-action-refusal',
  'permission-profiles-registry:item.b7ab94d73ef4': 'pre-action-refusal',
  'permission-profiles-registry:item.9ab0d5db8ebf': 'pre-action-refusal',
  'permission-profiles-registry:item.ea8666a98ca1': 'pre-action-refusal',
  'permission-profiles-registry:item.3a54e390a3e1': 'pre-action-refusal',
  'permission-profiles-registry:item.eb314ad28f5e': 'pre-action-refusal',
  'permission-profiles-registry:item.14569d4abb87': 'pre-action-refusal',
  'permission-profiles-registry:item.7943c5773fba': 'pre-action-refusal',
  'permission-profiles-registry:item.2ca898541627': 'pre-action-refusal',
  'permission-profiles-registry:item.23838f138908': 'pre-action-refusal',
  'permission-profiles-registry:item.6d850a4b4948': 'pre-action-refusal',
  'permission-profiles-registry:item.f1d63df02914': 'pre-action-refusal',
  'permission-profiles-registry:item.8c5085e2ff63': 'ci-static-check',
  'permission-profiles-registry:item.60eb2cbc6f43': 'pre-action-refusal',
  'permission-profiles-registry:item.1e0db040f9d8': 'pre-action-refusal',
  'permission-profiles-registry:item.e477240aeb8e': 'pre-action-refusal',
  'permission-profiles-registry:item.074c70cc9d55': 'pre-action-refusal',
  'permission-profiles-registry:item.5705a054df96': 'pre-action-refusal',
  'permission-profiles-registry:item.b6db9d1f4737': 'pre-action-refusal',
  'permission-profiles-registry:item.92b60e67dfba': 'pre-action-refusal',
  'permission-profiles-registry:item.b8a82b2446d9': 'pre-action-refusal',
  'permission-profiles-registry:item.1fa440b2fe59': 'pre-action-refusal',
  'permission-profiles-registry:item.3641610e292b': 'pre-action-refusal',
  'permission-profiles-registry:item.854101218a6d': 'pre-action-refusal',
  'permission-profiles-registry:item.e4d0bc5dc904': 'pre-action-refusal',
  'permission-profiles-registry:item.7b5310ad887b': 'pre-action-refusal',
  'permission-profiles-registry:item.6ac66b888a40': 'pre-action-refusal',
  'permission-profiles-types:item.0b9706b5a9bf': 'narrative-provenance',
  'permission-profiles-types:item.bc257b03aa99': 'narrative-provenance',
  'permission-profiles-validator:item.dcd8638af4a4': 'pre-action-refusal',
  'permission-profiles-validator:item.9c3c17055384': 'pre-action-refusal',
  'permission-profiles-validator:item.4da758cc157c': 'pre-action-refusal',
  'permission-profiles-validator:item.ffd598413a66': 'pre-action-refusal',
  'permission-profiles-readme:item.b3183ee0b5ab': 'unsupported',
  'permission-profiles-readme:item.f8c108b3b431': 'unsupported',
  'permission-profiles-readme:item.a26beda5342d': 'unsupported',
  'permission-profiles-readme:item.27ce8e0a4adc': 'unsupported',
  'permission-profiles-readme:item.729be3615f8d': 'unsupported',
  'permission-profiles-readme:item.d11b9d38f924': 'unsupported',
  'permission-profiles-readme:item.1101805f1c9e': 'unsupported',
  'permission-profiles-readme:item.415efa3f5e3b': 'unsupported',
  'fk-charter:item.5c1f19dd9911': 'independent-review-human-judgment',
  'fk-charter:item.863fbb9202f0': 'pre-action-refusal',
  'fk-charter:item.420807aa841c': 'pre-action-refusal',
  'fk-charter:item.0b65a783a0be': 'pre-action-refusal',
  'fk-charter:item.8d204432b7c7': 'pre-action-refusal',
  'fk-charter:item.e7be31fb263e': 'pre-action-refusal',
  'fk-charter:item.7983e741c7aa': 'pre-action-refusal',
  'fk-charter:item.ba4689f0d16e': 'pre-action-refusal',
  'fk-charter:item.e64616afcaf9': 'pre-action-refusal',
  'fk-charter:item.01fc2f9fcdd0': 'pre-action-refusal',
  'fk-charter:item.9aee50455247': 'pre-action-refusal',
  'fk-charter:item.6427173452f4': 'pre-action-refusal',
  'fk-charter:item.d6c307d21998': 'pre-action-refusal',
  'fk-charter:item.9e512e70b8f5': 'pre-action-refusal',
  'fk-charter:item.d4059b59ac59': 'pre-action-refusal',
  'fk-charter:item.f4e2ba3acfd6': 'pre-action-refusal',
  'fk-charter:item.d92a7c500de4': 'pre-action-refusal',
  'fk-charter:item.dc8cc83e01e7': 'pre-action-refusal',
  'fk-charter:item.387fb9c622d2': 'pre-action-refusal',
  'fk-charter:item.9efe42c4e01c': 'pre-action-refusal',
  'fk-charter:item.dde24d4c9b7c': 'pre-action-refusal',
  'fk-charter:item.ce7c8467ddb3': 'pre-action-refusal',
  'fk-charter:item.8e9428543291': 'pre-action-refusal',
  'fk-charter:item.c9611681dcca': 'pre-action-refusal',
  'fk-charter:item.1cf05e6b7716': 'pre-action-refusal',
  'fk-charter:item.5c24c3ef6591': 'pre-action-refusal',
  'fk-charter:item.ec0f6225e0a6': 'ci-static-check',
  'fk-charter:item.0689031c79ed': 'ci-static-check',
  'fk-charter:item.349023b0246d': 'ci-static-check',
  'fk-charter:item.9308bed876c7': 'ci-static-check',
  'fk-charter:item.612528548655': 'ci-static-check',
  'fk-charter:item.102464b0e25b': 'ci-static-check',
  'fk-charter:item.e1b224d7294b': 'ci-static-check',
  'fk-charter:item.501441d1853e': 'ci-static-check',
  'fk-charter:item.fc74f0320a1c': 'ci-static-check',
  'fk-charter:item.7eba1cb561c5': 'ci-static-check',
  'fk-charter:item.eb56a1ab24d9': 'ci-static-check',
  'fk-charter:item.8843a7774432': 'ci-static-check',
  'fk-charter:item.10f729956b77': 'ci-static-check',
}

function curatedClassificationFor(sourceId: string, itemId: string): RuleClassification {
  const key = `${sourceId}:${itemId}`
  const classification =
    R11_PERMISSION_PROFILE_CURATION[key]?.classification ??
    R11_CURATED_ITEM_SEMANTICS[key]?.classification ??
    R10_CURATED_ITEM_SEMANTICS[key]?.classification ??
    CURATED_ITEM_CLASSIFICATIONS[key]
  if (classification === undefined) {
    throw new Error(`published item '${sourceId}:${itemId}' lacks literal curated classification`)
  }
  return classification
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
  'fk-charter:item.eddc1a2874a3': [
    'goal-exit.control-catalogs',
    'pinned-images-expose-separated-catalogs-with-read-confidentiality',
  ],
  'fk-charter:item.248b8ef73429': [
    'goal-exit.scenario-proof',
    'clean-room-confidentiality-portability-and-admission-scenarios-pass',
  ],
  'fk-charter:item.7854414d4093': [
    'goal-exit.durable-state',
    'sqlite-recovery-concurrency-and-projection-evidence-pass',
  ],
  'fk-charter:item.a0d98411d75e': [
    'goal-exit.enforcement-promotion',
    'refusal-vectors-bypass-sweeps-and-independent-review-precede-enforcement',
  ],
  'fk-charter:item.fec95f508418': [
    'goal-exit.ci-backstop',
    'ci-catches-out-of-scope-mutation-and-missing-enrollment-before-promotion',
  ],
  'fk-charter:item.4910b2a0a7a3': [
    'goal-exit.authority-nonmanufacture',
    'tools-and-container-credentials-cannot-manufacture-protected-authority-or-effects',
  ],
  'fk-charter:item.4d6ea442cfff': [
    'goal-exit.evidence-manifest',
    'committed-manifest-binds-source-artifact-host-review-and-mutation-evidence',
  ],
  'fk-charter:item.49288a83830e': [
    'goal-exit.honest-reporting',
    'final-report-separates-assurance-and-unsupported-host-claims',
  ],
  'fk-charter:item.41b4b3dccd81': [
    'goal-stop.ratification-drift',
    'stop-on-unratified-review-change',
  ],
  'fk-charter:item.c80d986d4cfe': [
    'goal-stop.stage-contract-boundary',
    'stop-on-out-of-parcel-stage-contract-change',
  ],
  'fk-charter:item.ab729d219bbb': ['goal-stop.allowed-files', 'stop-on-unlisted-required-file'],
  'fk-charter:item.1c42ce2f7e94': [
    'goal-stop.surfaces-authority-confusion',
    'stop-if-exact-paths-require-treating-surfaces-as-permission',
  ],
  'fk-charter:item.28ec67f3ddb4': [
    'goal-stop.mediation-overclaim',
    'stop-on-complete-shell-or-unsupported-host-mediation-claim',
  ],
  'fk-charter:item.5138fd735a8a': [
    'goal-stop.protected-authority-mint',
    'stop-on-tool-manufactured-human-independent-merge-or-closure-authority',
  ],
  'fk-charter:item.6aae5fe2d602': [
    'goal-stop.external-capability',
    'stop-on-container-external-or-broad-host-capability',
  ],
  'fk-charter:item.fc4a386b94fe': [
    'goal-stop.identity-and-control-admission',
    'stop-on-self-asserted-identity-or-read-client-control-discovery',
  ],
  'fk-charter:item.42e05d00c67a': [
    'goal-stop.read-confinement',
    'stop-on-arbitrary-host-path-or-state-volume-read',
  ],
  'fk-charter:item.07490af17320': [
    'goal-stop.migration-history',
    'stop-on-manufactured-historical-approval-or-authorization',
  ],
  'fk-charter:item.b5bad0475a3e': [
    'goal-stop.security-boundary',
    'stop-on-security-boundary-that-cannot-close-in-parcel',
  ],
  'fk-charter:item.e86843a842bc': ['goal-stop.tripwire', 'stop-on-repeated-tripwire-or-rework-cap'],
  'fk-charter:item.98b291e68000': [
    'goal-stop.worktree-isolation',
    'stop-on-ambient-or-other-worktree-mutation',
  ],
  'fk-charter:item.76049b5d2003': [
    'goal-stop.exit-evidence',
    'stop-on-empty-queue-with-unproved-exit',
  ],
  'fk-charter:item.7d74bdcd5bb3': [
    'wave-exit.authority-contracts',
    'wave-zero-contracts-path-authority-and-reconciliations-complete',
  ],
  'fk-charter:item.5f823cd304d6': [
    'wave-exit.pure-trust-core',
    'wave-one-evaluators-deterministic-contracted-and-clean-room-proven',
  ],
  'fk-charter:item.f1439c7e3a90': [
    'wave-exit.stateless-verifier',
    'wave-two-pinned-read-only-image-portable-and-state-confined',
  ],
  'fk-charter:item.fec816847e8e': [
    'wave-exit.durable-state',
    'wave-three-ownership-recovery-idempotency-and-projection-invariants-hold',
  ],
  'fk-charter:item.10bcdc2cae49': [
    'wave-exit.enforcement-promotion',
    'wave-four-refusal-detection-recovery-and-evidence-claims-are-bound',
  ],
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
    'goal.coordinator-ownership',
    'single-ratified-coordinator-and-explicit-handoff',
  ],
  'fk-loop-directive:item.b81725578197': [
    'goal.ratification-evidence.original',
    'original-gate1-charter-commit-recorded',
  ],
  'fk-loop-directive:item.aac2d1258986': [
    'goal.ratification-evidence.plan-review',
    'plan-review-triage-commit-recorded',
  ],
  'fk-loop-directive:item.4f0fb14fbd95': [
    'goal.ratification-evidence.reratification',
    'scoped-gate1-reratification-commit-recorded',
  ],
  'fk-loop-directive:item.47a75730afd6': [
    'gate2.dispatch-grant',
    'coordinator-may-dispatch-fk-p0-through-fk-p21-conditionally',
  ],
  'fk-loop-directive:item.08b3cbb91027': ['gate3.merge-authority', 'human-owned-nondelegated'],
  'fk-loop-directive:item.ae7854c7dad1': [
    'goal.current-state-record',
    'stage-zero-complete-and-fk-p0-next',
  ],
  'fk-loop-directive:item.dd8203551518': [
    'verification.issue-authority',
    'coordinator-consumes-but-never-produces-independent-verification',
  ],
  'fk-loop-directive:item.ebdd14e6f524': [
    'coordinator.required-reading.charter',
    'read-goal-charter-every-iteration',
  ],
  'fk-loop-directive:item.a59b01361dc6': [
    'coordinator.required-reading.loop-directive',
    'read-loop-directive-every-iteration',
  ],
  'fk-loop-directive:item.734b79ca0bb8': [
    'coordinator.required-reading.parcel-state',
    'read-active-spec-kickstarter-handoff-and-findings',
  ],
  'fk-loop-directive:item.51f7dbbba473': [
    'coordinator.required-reading.pattern',
    'read-coordinator-pattern-every-iteration',
  ],
  'fk-loop-directive:item.d69eca1ec1f6': [
    'coordinator.required-reading.spec-convention',
    'read-spec-convention-every-iteration',
  ],
  'fk-loop-directive:item.fc3ea1441f92': [
    'coordinator.required-reading.standing-constraints',
    'read-standing-constraints-every-iteration',
  ],
  'fk-loop-directive:item.15e5fcbdbe13': [
    'coordinator.required-reading.plan-review',
    'plan-review-transcript-path-recorded',
  ],
  'fk-loop-directive:item.bfffee6d7c1f': [
    'gate2.dispatch-grant',
    'coordinator-may-dispatch-fk-p0-through-fk-p21-conditionally',
  ],
  'fk-loop-directive:item.431228393540': [
    'shaping.dispatch-readiness',
    'shaping-and-lint-require-satisfied-dependencies',
  ],
  'fk-loop-directive:item.be7691d170a9': [
    'parcel.local-work-authority',
    'local-isolated-work-authorized-for-named-parcel-only',
  ],
  'fk-loop-directive:item.9935b3499764': [
    'step0.ruling-authority',
    'coordinator-rules-unless-ratified-boundary-changes',
  ],
  'fk-loop-directive:item.64341d1e8b82': [
    'goal.external-effects-authorization',
    'goal-authorizes-no-external-system-effects',
  ],
  'fk-loop-directive:item.7eb6018d9e57': ['gate3.merge-authority', 'human-owned-nondelegated'],
  'fk-loop-directive:item.7aa2dd930e35': [
    'scm.external-write-authority',
    'push-or-pr-requires-explicit-contract-and-developer-authority',
  ],
  'fk-loop-directive:item.8c0b09120ff1': [
    'parcel.queue-verification',
    'dependencies-verified-against-git-not-memory',
  ],
  'fk-loop-directive:item.d3b0e9dd63d0': [
    'parcel.shaping-dispatch',
    'fresh-docs-only-shaping-before-build',
  ],
  'fk-loop-directive:item.f7e8dffebadc': [
    'parcel.spec-charter-lint',
    'coordinator-lints-spec-against-charter',
  ],
  'fk-loop-directive:item.1157c2a03bbe': [
    'parcel.worktree-dispatch',
    'verified-base-isolated-worktree-required',
  ],
  'fk-loop-directive:item.bdd56a126b79': [
    'parcel.step0-gate',
    'builder-restates-and-stops-before-code',
  ],
  'fk-loop-directive:item.ed8d7888ce8c': [
    'parcel.builder-claim-verification',
    'committed-sha-and-claim-verified-before-review',
  ],
  'fk-loop-directive:item.6ea9ce2b9573': [
    'parcel.deterministic-pass',
    'coordinator-runs-complete-sequential-verification',
  ],
  'fk-loop-directive:item.ce9042d917b2': [
    'verification.issue-authority',
    'architecture-risk-two-fresh-independent-reviews-required',
  ],
  'fk-loop-directive:item.d978784bc1b7': [
    'review.finding-triage',
    'findings-triaged-and-disputed-blockers-reproduced',
  ],
  'fk-loop-directive:item.2743c2f8c558': ['gate3.merge-authority', 'human-owned-nondelegated'],
  'fk-loop-directive:item.e3065db62b43': [
    'closure.stage-f-prerequisite',
    'stage-f-only-after-human-merge',
  ],
  'fk-loop-directive:item.1576c95260b6': [
    'parcel.shared-file-serialization',
    'parallelism-only-without-shared-serialization-points',
  ],
  'fk-loop-directive:item.8f98d5e3e61a': [
    'registry.delivery-boundary',
    'authority-registry-precedes-runtime-contracts',
  ],
  'fk-loop-directive:item.4f26e86b0870': [
    'registry.inventory-coverage',
    'inventory-every-standing-role-gate-stop-and-authority-rule',
  ],
  'fk-loop-directive:item.5909432cc1a7': [
    'registry.classification-taxonomy',
    'classify-every-rule-in-closed-six-way-taxonomy',
  ],
  'fk-loop-directive:item.b2e02392e4e5': [
    'registry.rule-contract',
    'bind-precedence-identity-source-applicability-and-retirement',
  ],
  'fk-loop-directive:item.ec3e0d0130ff': [
    'registry.reconciliation-duty',
    'reconcile-gates-live-behavior-and-stale-canon',
  ],
  'fk-loop-directive:item.e7e5c2483975': [
    'registry.protected-authority',
    'agent-state-cannot-manufacture-protected-authority',
  ],
  'fk-loop-directive:item.c6c0339a5001': [
    'registry.fixture-evidence',
    'golden-and-mutation-controls-required',
  ],
  'fk-loop-directive:item.78a9d344c4c6': [
    'registry.scope-boundary',
    'registry-remains-contract-only-without-runtime-or-effects',
  ],
  'fk-loop-directive:item.5820c7f79bef': [
    'coordinator.stop-policy',
    'stop-and-report-on-listed-boundary-failures',
  ],
  'fk-loop-directive:item.7f72e946ccbe': [
    'goal.stop.coordinator-ownership',
    'stop-on-ambiguous-or-competing-coordinator',
  ],
  'fk-loop-directive:item.23f92834c1c8': [
    'goal.stop.ratified-boundary',
    'stop-when-ratified-boundary-needs-change',
  ],
  'fk-loop-directive:item.6151d43333aa': [
    'goal.stop.allowed-files',
    'stop-when-required-file-is-not-allowed',
  ],
  'fk-loop-directive:item.c708d8f95113': [
    'goal.stop.serialization-ownership',
    'stop-when-owned-serialization-point-has-no-ratified-sequence',
  ],
  'fk-loop-directive:item.adee76eb5f43': [
    'goal.stop.protected-authority',
    'stop-on-self-asserted-or-manufactured-authority',
  ],
  'fk-loop-directive:item.52f524327994': [
    'goal.stop.read-containment',
    'stop-on-repository-or-state-volume-read-escape',
  ],
  'fk-loop-directive:item.37f78aa591c5': [
    'goal.stop.security-boundary',
    'stop-when-security-finding-cannot-close',
  ],
  'fk-loop-directive:item.d7945b743a67': [
    'goal.stop.tripwire',
    'stop-when-tripwire-or-rework-cap-fires',
  ],
  'fk-loop-directive:item.80f2c4a08e42': [
    'goal.stop.worktree-isolation',
    'stop-on-ambient-or-other-worktree-mutation',
  ],
  'fk-loop-directive:item.c55a33cc847f': [
    'goal.stop.user-change-collision',
    'stop-on-user-owned-required-file-collision',
  ],
  'fk-loop-directive:item.237865e0993f': [
    'goal.stop.incomplete-empty-queue',
    'stop-on-empty-queue-before-goal-exit-evidence',
  ],
  'fk-loop-directive:item.7ad3390acb6b': [
    'coordinator.session-recovery',
    'completion-signal-and-recovery-custody-rules',
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
    'verification.issue-authority',
    'claimant-cannot-self-verify',
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
  'fk-charter:item.144bb836f528': ['parcel.fk-p2', 'spec-compiler-depends-on-fk-p0-and-fk-p1'],
  'fk-charter:item.a087b0ab4c3b': [
    'parcel.fk-p18',
    'ci-backstop-depends-on-fk-p17-and-owns-ci-files',
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
  'fk-charter:item.5c1f19dd9911': [
    'verification.issue-authority',
    'architecture-risk-two-fresh-independent-reviews-required',
  ],
  'fk-charter:item.863fbb9202f0': [
    'enforcement.refusal.worktree-branch',
    'worktree-and-branch-mismatch-refusal-class',
  ],
  'fk-charter:item.420807aa841c': [
    'enforcement.refusal.path-scope',
    'outside-allowed-files-and-frozen-surface-refusal-class',
  ],
  'fk-charter:item.0b65a783a0be': [
    'enforcement.refusal.reviewer-mutation',
    'reviewer-mutation-and-dirty-worktree-refusal-class',
  ],
  'fk-charter:item.8d204432b7c7': [
    'enforcement.refusal.policy-bypass',
    'policy-self-modification-and-mediated-bypass-refusal-class',
  ],
  'fk-charter:item.e7be31fb263e': [
    'enforcement.refusal.state-lease-gate',
    'lease-revision-and-gate-refusal-class',
  ],
  'fk-charter:item.7983e741c7aa': ['parcel.fk-p0', 'authority-registry-first-with-no-dependency'],
  'fk-charter:item.ba4689f0d16e': ['parcel.fk-p1', 'lifecycle-contracts-depend-on-fk-p0'],
  'fk-charter:item.e64616afcaf9': ['parcel.fk-p3', 'pure-dispatch-depends-on-fk-p1'],
  'fk-charter:item.01fc2f9fcdd0': ['parcel.fk-p4', 'verifier-facade-dependency-contract'],
  'fk-charter:item.9aee50455247': ['parcel.fk-p5', 'clean-room-spike-depends-on-fk-p4'],
  'fk-charter:item.6427173452f4': ['parcel.fk-p6', 'read-only-mcp-dependency-contract'],
  'fk-charter:item.d6c307d21998': ['parcel.fk-p7', 'stateless-image-depends-on-fk-p6'],
  'fk-charter:item.9e512e70b8f5': ['parcel.fk-p8', 'portability-proof-depends-on-fk-p7'],
  'fk-charter:item.d4059b59ac59': ['parcel.fk-p9', 'storage-abi-depends-on-fk-p1'],
  'fk-charter:item.f4e2ba3acfd6': ['parcel.fk-p10', 'lease-engine-depends-on-fk-p9'],
  'fk-charter:item.d92a7c500de4': ['parcel.fk-p11', 'projection-engine-dependency-contract'],
  'fk-charter:item.dc8cc83e01e7': ['parcel.fk-p12', 'authorization-engine-dependency-contract'],
  'fk-charter:item.387fb9c622d2': ['parcel.fk-p13', 'control-catalog-dependency-contract'],
  'fk-charter:item.9efe42c4e01c': ['parcel.fk-p14', 'stateful-image-dependency-contract'],
  'fk-charter:item.dde24d4c9b7c': ['parcel.fk-p15', 'restart-proof-depends-on-fk-p14'],
  'fk-charter:item.ce7c8467ddb3': [
    'parcel.fk-p16',
    'claude-adapter-dependency-and-ownership-contract',
  ],
  'fk-charter:item.8e9428543291': ['parcel.fk-p17', 'bypass-harness-depends-on-fk-p16'],
  'fk-charter:item.c9611681dcca': ['parcel.fk-p19', 'enforcement-promotion-dependency-contract'],
  'fk-charter:item.1cf05e6b7716': ['parcel.fk-p20', 'second-host-probe-depends-on-fk-p19'],
  'fk-charter:item.5c24c3ef6591': ['parcel.fk-p21', 'exit-evidence-dependency-contract'],
  'fk-charter:item.ec0f6225e0a6': [
    'integration-scenario.clean-room-lint',
    'compile-and-refuse-path-ambiguity',
  ],
  'fk-charter:item.0689031c79ed': [
    'integration-scenario.read-confidentiality',
    'bounded-repository-read-with-containment',
  ],
  'fk-charter:item.349023b0246d': [
    'integration-scenario.pure-routing',
    'repeatable-routing-with-zero-writes',
  ],
  'fk-charter:item.9308bed876c7': [
    'integration-scenario.structural-honesty',
    'tampered-chain-never-overclaimed',
  ],
  'fk-charter:item.612528548655': [
    'integration-scenario.control-admission',
    'anonymous-control-denied',
  ],
  'fk-charter:item.102464b0e25b': [
    'integration-scenario.restart-recovery',
    'restart-restores-state-and-projection',
  ],
  'fk-charter:item.e1b224d7294b': [
    'integration-scenario.split-brain',
    'single-lease-and-stale-transition-conflict',
  ],
  'fk-charter:item.501441d1853e': [
    'integration-scenario.scope-refusal',
    'structured-refusal-plus-diff-and-ci-detection',
  ],
  'fk-charter:item.fc74f0320a1c': [
    'integration-scenario.reviewer-posture',
    'reviewer-mutation-and-dirty-completion-refuse',
  ],
  'fk-charter:item.7eba1cb561c5': [
    'integration-scenario.human-gate',
    'require-human-with-nonlooping-stop-report',
  ],
  'fk-charter:item.eb56a1ab24d9': [
    'integration-scenario.outage-posture',
    'mutation-blocked-and-read-only-degraded',
  ],
  'fk-charter:item.8843a7774432': [
    'integration-scenario.enrollment-honesty',
    'bypass-refusal-distinct-from-absence-detection',
  ],
  'fk-charter:item.10f729956b77': [
    'integration-scenario.host-capability',
    'supported-host-probe-and-gap-reporting',
  ],
}

function authorityIdentityFor(
  sourceId: string,
  itemId: string,
): {
  authoritySubject: string
  authorityClaim: string
} | null {
  const key = `${sourceId}:${itemId}`
  const identity =
    R11_CURATED_ITEM_SEMANTICS[key]?.identity ??
    R10_CURATED_ITEM_SEMANTICS[key]?.identity ??
    CURATED_ITEM_IDENTITIES[key]
  return identity === undefined
    ? null
    : { authoritySubject: identity[0], authorityClaim: identity[1] }
}
const CURATED_ITEM_APPLICABILITY = {
  'fk-charter:item.d1': {
    goals: ['foreman-kernel'],
    roles: ['ci'],
    stages: ['deterministic-verify'],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: ['ci'],
  },
  'fk-charter:item.d2': {
    goals: ['foreman-kernel'],
    roles: ['builder', 'reviewer', 'kernel'],
    stages: ['build', 'deterministic-verify', 'runtime'],
    operations: ['repo-mutation', 'state-transition'],
    hosts: ['any'],
  },
  'fk-charter:item.d3': {
    goals: ['foreman-kernel'],
    roles: ['coordinator', 'builder', 'reviewer', 'host-adapter', 'kernel'],
    stages: ['build', 'runtime'],
    operations: ['state-transition', 'control-call'],
    hosts: ['provider-neutral', 'claude-windows-docker-loaded'],
  },
  'fk-charter:item.d4': {
    goals: ['foreman-kernel'],
    roles: ['ci'],
    stages: ['deterministic-verify'],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: ['ci'],
  },
  'fk-charter:item.d5': {
    goals: ['foreman-kernel'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: ['build', 'deterministic-verify', 'runtime'],
    operations: ['receipt-validation'],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'fk-charter:item.d6': {
    goals: ['foreman-kernel'],
    roles: ['ci'],
    stages: ['deterministic-verify'],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: ['ci'],
  },
  'fk-charter:item.d7': {
    goals: ['foreman-kernel'],
    roles: ['builder', 'reviewer', 'host-adapter', 'kernel'],
    stages: ['build', 'deterministic-verify', 'runtime'],
    operations: ['repo-mutation', 'control-call'],
    hosts: ['claude-windows-docker-loaded', 'claude-windows-docker-unenrolled', 'unsupported-host'],
  },
  'fk-charter:item.d8': {
    goals: ['foreman-kernel'],
    roles: ['coordinator', 'reviewer', 'ci'],
    stages: ['deterministic-verify', 'adversarial-review', 'merge'],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'fk-charter:item.d9': {
    goals: ['foreman-kernel'],
    roles: ['developer', 'coordinator', 'builder', 'reviewer', 'kernel', 'operator'],
    stages: ['stage-zero', 'step-zero', 'adversarial-review', 'merge', 'closure'],
    operations: ['state-transition', 'control-call'],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'fk-charter:item.d10': {
    goals: ['foreman-kernel'],
    roles: ['coordinator', 'builder', 'reviewer', 'kernel'],
    stages: ['step-zero', 'build', 'deterministic-verify'],
    operations: ['spec-mutation', 'repo-mutation'],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'fk-charter:item.d11': {
    goals: ['foreman-kernel'],
    roles: ['coordinator', 'builder', 'reviewer', 'ci', 'kernel'],
    stages: ['deterministic-verify', 'adversarial-review'],
    operations: ['source-inventory', 'repo-mutation'],
    hosts: ['provider-neutral', 'claude-windows-docker-loaded', 'ci'],
  },
  'fk-charter:item.d12': {
    goals: ['foreman-kernel'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'fk-charter:item.d13': {
    goals: ['foreman-kernel'],
    roles: ['builder', 'reviewer', 'ci', 'host-adapter', 'kernel'],
    stages: ['build', 'deterministic-verify', 'adversarial-review', 'merge', 'runtime'],
    operations: ['repo-mutation'],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'fk-charter:item.d14': {
    goals: ['foreman-kernel'],
    roles: ['ci'],
    stages: ['deterministic-verify'],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: ['ci'],
  },
  'fk-charter:item.d15': {
    goals: ['foreman-kernel'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: ['external-write'],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'fk-charter:item.d16': {
    goals: ['foreman-kernel'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'fk-charter:item.d17': {
    goals: ['foreman-kernel'],
    roles: ['coordinator', 'builder', 'reviewer', 'host-adapter', 'kernel', 'operator'],
    stages: ['build', 'deterministic-verify', 'adversarial-review', 'runtime'],
    operations: ['control-call', 'receipt-validation'],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'fk-charter:item.d18': {
    goals: ['foreman-kernel'],
    roles: ['builder', 'reviewer', 'host-adapter', 'kernel'],
    stages: ['build', 'deterministic-verify', 'runtime'],
    operations: ['repo-mutation', 'control-call'],
    hosts: ['any'],
  },
  'fk-charter:item.d19': {
    goals: ['foreman-kernel'],
    roles: ['builder', 'reviewer', 'host-adapter', 'kernel'],
    stages: ['build', 'deterministic-verify', 'runtime'],
    operations: ['repo-read'],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'fk-charter:item.d20': {
    goals: ['foreman-kernel'],
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
  'fk-charter:item.a583b7f02950': {
    goals: ['foreman-kernel'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'fk-charter:item.93d5d3978e5f': {
    goals: ['foreman-kernel'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'fk-charter:item.cd014d6d90c5': {
    goals: ['foreman-kernel'],
    roles: ['reviewer'],
    stages: ['adversarial-review', 'merge'],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'fk-charter:item.144bb836f528': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['shaping'],
    operations: ['state-transition'],
    hosts: ['provider-neutral'],
  },
  'fk-charter:item.a087b0ab4c3b': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['shaping'],
    operations: ['state-transition'],
    hosts: ['provider-neutral'],
  },
  'fk-charter:item.e9ec57edc0a2': {
    goals: ['foreman-kernel'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'fk-charter:item.8cf027fc811e': {
    goals: ['foreman-kernel'],
    roles: ['reviewer'],
    stages: ['adversarial-review', 'merge'],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'fk-charter:item.15a44cf50bc6': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['shaping', 'step-zero'],
    operations: ['state-transition'],
    hosts: ['provider-neutral'],
  },
  'fk-charter:item.c74628d41600': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['merge'],
    operations: ['repo-mutation', 'state-transition'],
    hosts: ['any'],
  },
  'fk-charter:item.d9921c51d7ea': {
    goals: ['foreman-kernel'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'fk-charter:item.0afd841f51f8': {
    goals: ['foreman-kernel'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'fk-charter:item.2cbbc7ae0192': {
    goals: ['foreman-kernel'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'fk-charter:item.b1ac4aa9eddf': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['merge'],
    operations: ['state-transition'],
    hosts: ['any'],
  },
  'fk-charter:item.b0a3e204145f': {
    goals: ['foreman-kernel'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'fk-plan-review-findings:item.r1': {
    goals: ['foreman-kernel'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'fk-plan-review-findings:item.r2': {
    goals: ['foreman-kernel'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'fk-plan-review-findings:item.r3': {
    goals: ['foreman-kernel'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'fk-plan-review-findings:item.r4': {
    goals: ['foreman-kernel'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'fk-plan-review-findings:item.r5': {
    goals: ['foreman-kernel'],
    roles: ['ci'],
    stages: ['deterministic-verify'],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: ['ci'],
  },
  'fk-plan-review-findings:item.r6': {
    goals: ['foreman-kernel'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'fk-plan-review-findings:item.r7': {
    goals: ['foreman-kernel'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'fk-plan-review-findings:item.r8': {
    goals: ['foreman-kernel'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'fk-plan-review-findings:item.r9': {
    goals: ['foreman-kernel'],
    roles: ['ci'],
    stages: ['deterministic-verify'],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: ['ci'],
  },
  'fk-plan-review-findings:item.r10': {
    goals: ['foreman-kernel'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'fk-plan-review-findings:item.r11': {
    goals: ['foreman-kernel'],
    roles: ['ci'],
    stages: ['deterministic-verify'],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: ['ci'],
  },
  'fk-plan-review-findings:item.r12': {
    goals: ['foreman-kernel'],
    roles: ['coordinator', 'reviewer', 'ci'],
    stages: ['deterministic-verify', 'adversarial-review', 'merge'],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'fk-plan-review-findings:item.r13': {
    goals: ['foreman-kernel'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'fk-plan-review-findings:item.1de06653021c': {
    goals: ['foreman-kernel'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'fk-loop-directive:item.7a05d374a3b1': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
    ],
    operations: ['state-transition'],
    hosts: ['any'],
  },
  'fk-loop-directive:item.b81725578197': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['stage-zero'],
    operations: ['source-inventory'],
    hosts: ['any'],
  },
  'fk-loop-directive:item.aac2d1258986': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['stage-zero'],
    operations: ['source-inventory'],
    hosts: ['any'],
  },
  'fk-loop-directive:item.4f0fb14fbd95': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['stage-zero'],
    operations: ['source-inventory'],
    hosts: ['any'],
  },
  'fk-loop-directive:item.47a75730afd6': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['shaping'],
    operations: ['state-transition'],
    hosts: ['provider-neutral'],
  },
  'fk-loop-directive:item.08b3cbb91027': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['merge'],
    operations: ['repo-mutation'],
    hosts: ['any'],
  },
  'fk-loop-directive:item.ae7854c7dad1': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['stage-zero'],
    operations: ['source-inventory'],
    hosts: ['provider-neutral'],
  },
  'fk-loop-directive:item.dd8203551518': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['deterministic-verify', 'adversarial-review', 'merge', 'closure'],
    operations: ['state-transition', 'receipt-validation'],
    hosts: ['any'],
  },
  'fk-loop-directive:item.ebdd14e6f524': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
    ],
    operations: ['source-inventory'],
    hosts: ['any'],
  },
  'fk-loop-directive:item.a59b01361dc6': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
    ],
    operations: ['source-inventory'],
    hosts: ['any'],
  },
  'fk-loop-directive:item.734b79ca0bb8': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
    ],
    operations: ['source-inventory'],
    hosts: ['any'],
  },
  'fk-loop-directive:item.51f7dbbba473': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
    ],
    operations: ['source-inventory'],
    hosts: ['any'],
  },
  'fk-loop-directive:item.d69eca1ec1f6': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
    ],
    operations: ['source-inventory'],
    hosts: ['any'],
  },
  'fk-loop-directive:item.fc3ea1441f92': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
    ],
    operations: ['source-inventory'],
    hosts: ['any'],
  },
  'fk-loop-directive:item.15e5fcbdbe13': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
    ],
    operations: ['source-inventory'],
    hosts: ['any'],
  },
  'fk-loop-directive:item.bfffee6d7c1f': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['shaping'],
    operations: ['state-transition'],
    hosts: ['provider-neutral'],
  },
  'fk-loop-directive:item.431228393540': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['shaping'],
    operations: ['spec-mutation'],
    hosts: ['provider-neutral'],
  },
  'fk-loop-directive:item.be7691d170a9': {
    goals: ['foreman-kernel'],
    roles: ['coordinator', 'shaper', 'builder', 'reviewer'],
    stages: ['shaping', 'step-zero', 'build', 'deterministic-verify', 'adversarial-review'],
    operations: ['spec-mutation', 'repo-read', 'repo-mutation'],
    hosts: ['provider-neutral'],
  },
  'fk-loop-directive:item.9935b3499764': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['step-zero'],
    operations: ['spec-mutation'],
    hosts: ['provider-neutral'],
  },
  'fk-loop-directive:item.64341d1e8b82': {
    goals: ['foreman-kernel'],
    roles: ['coordinator', 'shaper', 'builder', 'reviewer'],
    stages: [
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
    ],
    operations: ['external-write'],
    hosts: ['any'],
  },
  'fk-loop-directive:item.7eb6018d9e57': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['merge'],
    operations: ['repo-mutation'],
    hosts: ['any'],
  },
  'fk-loop-directive:item.7aa2dd930e35': {
    goals: ['foreman-kernel'],
    roles: ['coordinator', 'builder'],
    stages: ['build', 'merge'],
    operations: ['external-write'],
    hosts: ['any'],
  },
  'fk-loop-directive:item.8c0b09120ff1': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['shaping'],
    operations: ['source-inventory', 'state-transition'],
    hosts: ['provider-neutral'],
  },
  'fk-loop-directive:item.d3b0e9dd63d0': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['shaping'],
    operations: ['spec-mutation'],
    hosts: ['provider-neutral'],
  },
  'fk-loop-directive:item.f7e8dffebadc': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['shaping'],
    operations: ['source-inventory', 'spec-mutation'],
    hosts: ['provider-neutral'],
  },
  'fk-loop-directive:item.1157c2a03bbe': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['shaping'],
    operations: ['state-transition'],
    hosts: ['provider-neutral'],
  },
  'fk-loop-directive:item.bdd56a126b79': {
    goals: ['foreman-kernel'],
    roles: ['coordinator', 'builder'],
    stages: ['step-zero'],
    operations: ['spec-mutation'],
    hosts: ['provider-neutral'],
  },
  'fk-loop-directive:item.ed8d7888ce8c': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['deterministic-verify'],
    operations: ['repo-read'],
    hosts: ['provider-neutral'],
  },
  'fk-loop-directive:item.6ea9ce2b9573': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['deterministic-verify'],
    operations: ['source-inventory'],
    hosts: ['provider-neutral'],
  },
  'fk-loop-directive:item.ce9042d917b2': {
    goals: ['foreman-kernel'],
    roles: ['reviewer'],
    stages: ['adversarial-review'],
    operations: ['receipt-validation'],
    hosts: ['any'],
  },
  'fk-loop-directive:item.d978784bc1b7': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['adversarial-review'],
    operations: ['receipt-validation'],
    hosts: ['any'],
  },
  'fk-loop-directive:item.2743c2f8c558': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['merge'],
    operations: ['repo-mutation'],
    hosts: ['any'],
  },
  'fk-loop-directive:item.e3065db62b43': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['closure'],
    operations: ['state-transition'],
    hosts: ['any'],
  },
  'fk-loop-directive:item.1576c95260b6': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['shaping'],
    operations: ['state-transition'],
    hosts: ['provider-neutral'],
  },
  'fk-loop-directive:item.8f98d5e3e61a': {
    goals: ['foreman-kernel'],
    roles: ['coordinator', 'shaper'],
    stages: ['shaping'],
    operations: ['source-inventory'],
    hosts: ['provider-neutral'],
  },
  'fk-loop-directive:item.4f26e86b0870': {
    goals: ['foreman-kernel'],
    roles: ['coordinator', 'shaper'],
    stages: ['shaping'],
    operations: ['source-inventory'],
    hosts: ['provider-neutral'],
  },
  'fk-loop-directive:item.5909432cc1a7': {
    goals: ['foreman-kernel'],
    roles: ['coordinator', 'shaper'],
    stages: ['shaping'],
    operations: ['source-inventory'],
    hosts: ['provider-neutral'],
  },
  'fk-loop-directive:item.b2e02392e4e5': {
    goals: ['foreman-kernel'],
    roles: ['coordinator', 'shaper'],
    stages: ['shaping'],
    operations: ['source-inventory'],
    hosts: ['provider-neutral'],
  },
  'fk-loop-directive:item.ec3e0d0130ff': {
    goals: ['foreman-kernel'],
    roles: ['coordinator', 'shaper'],
    stages: ['shaping'],
    operations: ['source-inventory'],
    hosts: ['provider-neutral'],
  },
  'fk-loop-directive:item.e7e5c2483975': {
    goals: ['foreman-kernel'],
    roles: ['coordinator', 'builder', 'kernel'],
    stages: ['build', 'runtime'],
    operations: ['control-call'],
    hosts: ['any'],
  },
  'fk-loop-directive:item.c6c0339a5001': {
    goals: ['foreman-kernel'],
    roles: ['shaper', 'builder', 'ci'],
    stages: ['shaping', 'build', 'deterministic-verify'],
    operations: ['source-inventory'],
    hosts: ['provider-neutral'],
  },
  'fk-loop-directive:item.78a9d344c4c6': {
    goals: ['foreman-kernel'],
    roles: ['builder'],
    stages: ['build'],
    operations: ['repo-mutation', 'external-write'],
    hosts: ['provider-neutral'],
  },
  'fk-loop-directive:item.5820c7f79bef': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
    ],
    operations: ['state-transition'],
    hosts: ['any'],
  },
  'fk-loop-directive:item.7f72e946ccbe': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['shaping'],
    operations: ['state-transition'],
    hosts: ['any'],
  },
  'fk-loop-directive:item.23f92834c1c8': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['shaping'],
    operations: ['spec-mutation'],
    hosts: ['any'],
  },
  'fk-loop-directive:item.6151d43333aa': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['step-zero'],
    operations: ['spec-mutation'],
    hosts: ['any'],
  },
  'fk-loop-directive:item.c708d8f95113': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['shaping'],
    operations: ['state-transition'],
    hosts: ['any'],
  },
  'fk-loop-directive:item.adee76eb5f43': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['shaping', 'build'],
    operations: ['control-call'],
    hosts: ['any'],
  },
  'fk-loop-directive:item.52f524327994': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['shaping', 'build', 'runtime'],
    operations: ['repo-read'],
    hosts: ['any'],
  },
  'fk-loop-directive:item.37f78aa591c5': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['shaping', 'build', 'adversarial-review'],
    operations: ['state-transition'],
    hosts: ['any'],
  },
  'fk-loop-directive:item.d7945b743a67': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['build', 'deterministic-verify', 'adversarial-review'],
    operations: ['state-transition'],
    hosts: ['any'],
  },
  'fk-loop-directive:item.80f2c4a08e42': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['deterministic-verify', 'adversarial-review'],
    operations: ['repo-mutation'],
    hosts: ['any'],
  },
  'fk-loop-directive:item.c55a33cc847f': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['step-zero', 'build'],
    operations: ['repo-mutation'],
    hosts: ['any'],
  },
  'fk-loop-directive:item.237865e0993f': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['closure'],
    operations: ['state-transition'],
    hosts: ['any'],
  },
  'fk-loop-directive:item.7ad3390acb6b': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['build', 'deterministic-verify', 'adversarial-review'],
    operations: ['state-transition'],
    hosts: ['any'],
  },
  'spec-convention:item.fd5d51dd4808': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'spec-convention:item.f2172f28e7fc': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'spec-convention:item.71d77f22d163': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'spec-convention:item.ea0314db8499': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'spec-convention:item.d2b2084774b8': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'spec-convention:item.910181940014': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'spec-convention:item.c9b45d54e97b': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'spec-convention:item.4fa776b35f0b': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'spec-convention:item.4886c52fa322': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'spec-convention:item.74a07f6879cc': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'spec-convention:item.03f0830cd693': {
    goals: ['all-foreman-goals'],
    roles: ['builder'],
    stages: ['deterministic-verify'],
    operations: ['receipt-validation'],
    hosts: ['any'],
  },
  'spec-convention:item.7a55cf4f2295': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'spec-convention:item.0979dba6c958': {
    goals: ['all-foreman-goals'],
    roles: ['ci'],
    stages: ['deterministic-verify'],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: ['ci'],
  },
  'spec-convention:item.efb0769d6ff2': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'spec-convention:item.513e18f22be3': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'spec-convention:item.6dbbca88286f': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'spec-convention:item.e6f5fa8543a1': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'spec-convention:item.ac5ff7afd06f': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'spec-convention:item.5145ab15549c': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'spec-convention:item.fd82127bf9f9': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'spec-convention:item.022fc00afe7b': {
    goals: ['all-foreman-goals'],
    roles: ['coordinator'],
    stages: ['merge'],
    operations: ['state-transition'],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'coordinator-pattern:item.38dbf3185a76': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'coordinator-pattern:item.84b4e388c06b': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'coordinator-pattern:item.d62734f662a0': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'coordinator-pattern:item.00f63e7818bc': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'coordinator-pattern:item.a3d15fe678e1': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'coordinator-pattern:item.dedbefc1b097': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'coordinator-pattern:item.91dd60b00fd6': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'coordinator-pattern:item.f7686ab58db7': {
    goals: ['all-foreman-goals'],
    roles: ['coordinator'],
    stages: ['merge'],
    operations: ['state-transition'],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'goal-skill:item.02636597cc8d': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'goal-skill:item.fa27a05811dd': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'goal-skill:item.8fda5f4d9776': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'standing-constraints:item.constraint-1': {
    goals: ['all-foreman-goals'],
    roles: ['builder'],
    stages: ['any'],
    operations: ['any'],
    hosts: ['any'],
  },
  'standing-constraints:item.constraint-2': {
    goals: ['all-foreman-goals'],
    roles: ['builder'],
    stages: ['any'],
    operations: ['any'],
    hosts: ['any'],
  },
  'standing-constraints:item.constraint-3': {
    goals: ['all-foreman-goals'],
    roles: ['builder'],
    stages: ['any'],
    operations: ['any'],
    hosts: ['any'],
  },
  'standing-constraints:item.constraint-4': {
    goals: ['all-foreman-goals'],
    roles: ['builder'],
    stages: ['any'],
    operations: ['any'],
    hosts: ['any'],
  },
  'standing-constraints:item.constraint-5': {
    goals: ['all-foreman-goals'],
    roles: ['builder'],
    stages: ['any'],
    operations: ['any'],
    hosts: ['any'],
  },
  'standing-constraints:item.constraint-12': {
    goals: ['all-foreman-goals'],
    roles: ['coordinator'],
    stages: ['deterministic-verify', 'adversarial-review'],
    operations: ['source-inventory', 'repo-read', 'repo-mutation'],
    hosts: ['any'],
  },
  'standing-constraints:item.constraint-13': {
    goals: ['all-foreman-goals'],
    roles: ['builder'],
    stages: ['any'],
    operations: ['any'],
    hosts: ['any'],
  },
  'standing-constraints:item.constraint-6': {
    goals: ['all-foreman-goals'],
    roles: ['builder'],
    stages: ['any'],
    operations: ['any'],
    hosts: ['any'],
  },
  'standing-constraints:item.constraint-7': {
    goals: ['all-foreman-goals'],
    roles: ['builder'],
    stages: ['any'],
    operations: ['control-call'],
    hosts: ['any'],
  },
  'standing-constraints:item.constraint-8': {
    goals: ['all-foreman-goals'],
    roles: ['reviewer'],
    stages: ['adversarial-review'],
    operations: ['repo-read', 'repo-mutation', 'control-call'],
    hosts: ['any'],
  },
  'standing-constraints:item.constraint-9': {
    goals: ['all-foreman-goals'],
    roles: ['reviewer'],
    stages: ['adversarial-review'],
    operations: ['repo-read', 'repo-mutation', 'control-call'],
    hosts: ['any'],
  },
  'standing-constraints:item.constraint-10': {
    goals: ['all-foreman-goals'],
    roles: ['reviewer'],
    stages: ['adversarial-review'],
    operations: ['repo-read', 'repo-mutation', 'control-call'],
    hosts: ['any'],
  },
  'standing-constraints:item.constraint-11': {
    goals: ['all-foreman-goals'],
    roles: ['reviewer'],
    stages: ['adversarial-review'],
    operations: ['repo-read', 'repo-mutation', 'control-call'],
    hosts: ['any'],
  },
  'standing-constraints:item.c5880644c95c': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'parcel-driven-development:item.hard-rule-1': {
    goals: ['all-foreman-goals'],
    roles: ['shaper', 'builder'],
    stages: ['shaping', 'step-zero', 'build'],
    operations: ['any'],
    hosts: ['any'],
  },
  'parcel-driven-development:item.hard-rule-2': {
    goals: ['all-foreman-goals'],
    roles: ['coordinator', 'shaper', 'builder', 'reviewer'],
    stages: ['shaping', 'step-zero', 'build', 'adversarial-review'],
    operations: ['any'],
    hosts: ['any'],
  },
  'parcel-driven-development:item.hard-rule-3': {
    goals: ['all-foreman-goals'],
    roles: ['shaper', 'builder'],
    stages: ['shaping', 'step-zero', 'build'],
    operations: ['any'],
    hosts: ['any'],
  },
  'parcel-driven-development:item.hard-rule-4': {
    goals: ['all-foreman-goals'],
    roles: ['shaper', 'builder'],
    stages: ['shaping', 'step-zero', 'build'],
    operations: ['repo-mutation'],
    hosts: ['any'],
  },
  'parcel-driven-development:item.hard-rule-5': {
    goals: ['all-foreman-goals'],
    roles: ['shaper', 'builder'],
    stages: ['shaping', 'step-zero', 'build'],
    operations: ['repo-mutation'],
    hosts: ['any'],
  },
  'parcel-driven-development:item.hard-rule-6': {
    goals: ['all-foreman-goals'],
    roles: ['coordinator', 'builder'],
    stages: ['build'],
    operations: ['repo-mutation'],
    hosts: ['any'],
  },
  'parcel-driven-development:item.hard-rule-7': {
    goals: ['all-foreman-goals'],
    roles: ['builder', 'ci'],
    stages: ['build', 'deterministic-verify'],
    operations: ['any'],
    hosts: ['any'],
  },
  'parcel-driven-development:item.hard-rule-8': {
    goals: ['all-foreman-goals'],
    roles: ['builder'],
    stages: ['build'],
    operations: ['repo-mutation'],
    hosts: ['any'],
  },
  'parcel-driven-development:item.hard-rule-9': {
    goals: ['all-foreman-goals'],
    roles: ['coordinator', 'builder'],
    stages: ['build'],
    operations: ['repo-mutation'],
    hosts: ['any'],
  },
  'parcel-driven-development:item.hard-rule-10': {
    goals: ['all-foreman-goals'],
    roles: ['any'],
    stages: ['any'],
    operations: ['any'],
    hosts: ['any'],
  },
  'parcel-driven-development:item.hard-rule-11': {
    goals: ['all-foreman-goals'],
    roles: ['shaper', 'builder', 'reviewer'],
    stages: ['shaping', 'step-zero', 'build', 'adversarial-review'],
    operations: ['any'],
    hosts: ['any'],
  },
  'parcel-driven-development:item.hard-rule-12': {
    goals: ['all-foreman-goals'],
    roles: ['coordinator', 'reviewer', 'ci'],
    stages: ['deterministic-verify', 'adversarial-review', 'merge'],
    operations: ['state-transition'],
    hosts: ['any'],
  },
  'parcel-driven-development:item.hard-rule-13': {
    goals: ['all-foreman-goals'],
    roles: ['coordinator'],
    stages: ['build', 'merge', 'closure'],
    operations: ['state-transition'],
    hosts: ['any'],
  },
  'parcel-driven-development:item.hard-rule-14': {
    goals: ['all-foreman-goals'],
    roles: ['coordinator', 'builder', 'reviewer', 'ci'],
    stages: ['deterministic-verify', 'adversarial-review', 'merge'],
    operations: ['source-inventory', 'state-transition'],
    hosts: ['any'],
  },
  'parcel-driven-development:item.hard-rule-15': {
    goals: ['all-foreman-goals'],
    roles: ['coordinator', 'builder', 'reviewer', 'ci'],
    stages: ['deterministic-verify', 'adversarial-review', 'merge'],
    operations: ['source-inventory', 'state-transition'],
    hosts: ['any'],
  },
  'parcel-driven-development:item.b7563a79cc57': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'parcel-driven-development:item.400cc2cfd0d5': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'parcel-driven-development:item.303fe3f67dae': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'parcel-driven-development:item.f1add5311b6c': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'parcel-driven-development:item.9d8d06d91590': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'parcel-driven-development:item.dbee4594f901': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'parcel-driven-development:item.7a8af4ddaa1e': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'parcel-driven-development:item.98f93a29441d': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'parcel-driven-development:item.e4751682430a': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'parcel-driven-development:item.72c60fa596e7': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'parcel-driven-development:item.754e096cfecf': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'parcel-driven-development:item.876882377a6a': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'foreman-line-plan:item.two-gate-thesis': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'foreman-line-plan:item.75569dd4ae1a': {
    goals: ['all-foreman-goals'],
    roles: ['reviewer'],
    stages: ['adversarial-review', 'merge'],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'foreman-line-plan:item.56a15a2f3220': {
    goals: ['all-foreman-goals'],
    roles: ['ci'],
    stages: ['deterministic-verify'],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: ['ci'],
  },
  'foreman-line-plan:item.c92333c21e64': {
    goals: ['all-foreman-goals'],
    roles: ['coordinator'],
    stages: ['merge'],
    operations: ['state-transition'],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'foreman-line-plan:item.760cf6497075': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'approval-readme:item.4261d18b3243': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'approval-readme:item.ff6f38f088ae': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'spec-frontmatter-schema:item.bdf997c3cd45': {
    goals: ['all-foreman-goals'],
    roles: ['ci'],
    stages: ['deterministic-verify'],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: ['ci'],
  },
  'spec-linter-validator:item.c6669b61c6f0': {
    goals: ['all-foreman-goals'],
    roles: ['ci'],
    stages: ['deterministic-verify'],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: ['ci'],
  },
  'spec-linter-validator:item.256b9064bc47': {
    goals: ['all-foreman-goals'],
    roles: ['ci'],
    stages: ['deterministic-verify'],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: ['ci'],
  },
  'spec-linter-validator:item.092d2fc43a32': {
    goals: ['all-foreman-goals'],
    roles: ['ci'],
    stages: ['deterministic-verify'],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: ['ci'],
  },
  'spec-linter-validator:item.fb7d76a32df4': {
    goals: ['all-foreman-goals'],
    roles: ['ci'],
    stages: ['deterministic-verify'],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: ['ci'],
  },
  'spec-linter-cli:item.0479c603add5': {
    goals: ['all-foreman-goals'],
    roles: ['ci'],
    stages: ['deterministic-verify'],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: ['ci'],
  },
  'spec-linter-cli:item.fb268f5c5eb4': {
    goals: ['all-foreman-goals'],
    roles: ['ci'],
    stages: ['deterministic-verify'],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: ['ci'],
  },
  'spec-linter-cli:item.66fec8a20db5': {
    goals: ['all-foreman-goals'],
    roles: ['ci'],
    stages: ['deterministic-verify'],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: ['ci'],
  },
  'spec-linter-cli:item.39787f778432': {
    goals: ['all-foreman-goals'],
    roles: ['ci'],
    stages: ['deterministic-verify'],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: ['ci'],
  },
  'spec-linter-readme:item.9a889881a236': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'spec-linter-readme:item.b4f5d76d68ec': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-registry:item.1ec33a4741eb': {
    goals: ['all-foreman-goals'],
    roles: ['ci'],
    stages: ['deterministic-verify'],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: ['ci'],
  },
  'permission-profiles-registry:item.7faf78a6f54a': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-registry:item.26c5e2b211da': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-registry:item.1d221ed65b72': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-registry:item.1ce0fd439b3e': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-registry:item.39e65fb31709': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-registry:item.ffd949ad76c3': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-registry:item.c9cb62068f14': {
    goals: ['all-foreman-goals'],
    roles: ['ci'],
    stages: ['deterministic-verify'],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: ['ci'],
  },
  'permission-profiles-registry:item.13033f70c124': {
    goals: ['all-foreman-goals'],
    roles: ['ci'],
    stages: ['deterministic-verify'],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: ['ci'],
  },
  'permission-profiles-registry:item.947d19fbeb35': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-registry:item.5a359d80896b': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-registry:item.ee0641be06f2': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-registry:item.cf29180bce81': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-registry:item.4f213acde8e0': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-registry:item.397a3eb4c7ad': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-registry:item.f0613939994f': {
    goals: ['all-foreman-goals'],
    roles: ['ci'],
    stages: ['deterministic-verify'],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: ['ci'],
  },
  'permission-profiles-registry:item.58ef984a0faa': {
    goals: ['all-foreman-goals'],
    roles: ['ci'],
    stages: ['deterministic-verify'],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: ['ci'],
  },
  'permission-profiles-registry:item.50cd9c68ff51': {
    goals: ['all-foreman-goals'],
    roles: ['ci'],
    stages: ['deterministic-verify'],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: ['ci'],
  },
  'permission-profiles-registry:item.b9e7c5644f49': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-registry:item.861d14c80da2': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-registry:item.fe1bbb0564f6': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-registry:item.803732fe3411': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-registry:item.b77e9988c19d': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-registry:item.8cf9d57aa29c': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-registry:item.0ed672bcdee8': {
    goals: ['all-foreman-goals'],
    roles: ['ci'],
    stages: ['deterministic-verify'],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: ['ci'],
  },
  'permission-profiles-registry:item.bbb2cdb40927': {
    goals: ['all-foreman-goals'],
    roles: ['ci'],
    stages: ['deterministic-verify'],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: ['ci'],
  },
  'permission-profiles-registry:item.b01d14453456': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-registry:item.315ebd655fbe': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-registry:item.8e8e3c78500b': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-registry:item.4c9cd1062bc6': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-registry:item.060989ad78ea': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-registry:item.30b62f67dc13': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-registry:item.7417033cefc7': {
    goals: ['all-foreman-goals'],
    roles: ['ci'],
    stages: ['deterministic-verify'],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: ['ci'],
  },
  'permission-profiles-registry:item.f7f03a01fd3a': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-registry:item.35cf0f58fc34': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-registry:item.dedb7349c943': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-registry:item.b7ab94d73ef4': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-registry:item.9ab0d5db8ebf': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-registry:item.ea8666a98ca1': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-registry:item.3a54e390a3e1': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-registry:item.eb314ad28f5e': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-registry:item.14569d4abb87': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-registry:item.7943c5773fba': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-registry:item.2ca898541627': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-registry:item.23838f138908': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-registry:item.6d850a4b4948': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-registry:item.f1d63df02914': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-registry:item.8c5085e2ff63': {
    goals: ['all-foreman-goals'],
    roles: ['ci'],
    stages: ['deterministic-verify'],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: ['ci'],
  },
  'permission-profiles-registry:item.60eb2cbc6f43': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-registry:item.1e0db040f9d8': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-registry:item.e477240aeb8e': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-registry:item.074c70cc9d55': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-registry:item.5705a054df96': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-registry:item.b6db9d1f4737': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-registry:item.92b60e67dfba': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-registry:item.b8a82b2446d9': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-registry:item.1fa440b2fe59': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-registry:item.3641610e292b': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-registry:item.854101218a6d': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-registry:item.e4d0bc5dc904': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-registry:item.7b5310ad887b': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-registry:item.6ac66b888a40': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-types:item.0b9706b5a9bf': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-types:item.bc257b03aa99': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-validator:item.dcd8638af4a4': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-validator:item.9c3c17055384': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-validator:item.4da758cc157c': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-validator:item.ffd598413a66': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-readme:item.b3183ee0b5ab': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-readme:item.f8c108b3b431': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-readme:item.a26beda5342d': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-readme:item.27ce8e0a4adc': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-readme:item.729be3615f8d': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-readme:item.d11b9d38f924': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-readme:item.1101805f1c9e': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'permission-profiles-readme:item.415efa3f5e3b': {
    goals: ['all-foreman-goals'],
    roles: [
      'developer',
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  },
  'fk-charter:item.eddc1a2874a3': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['deterministic-verify', 'merge', 'closure'],
    operations: ['source-inventory', 'state-transition'],
    hosts: ['any'],
  },
  'fk-charter:item.248b8ef73429': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['deterministic-verify', 'merge', 'closure'],
    operations: ['source-inventory', 'state-transition'],
    hosts: ['any'],
  },
  'fk-charter:item.7854414d4093': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['deterministic-verify', 'merge', 'closure'],
    operations: ['source-inventory', 'state-transition'],
    hosts: ['any'],
  },
  'fk-charter:item.a0d98411d75e': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['deterministic-verify', 'merge', 'closure'],
    operations: ['source-inventory', 'state-transition'],
    hosts: ['any'],
  },
  'fk-charter:item.fec95f508418': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['deterministic-verify', 'merge', 'closure'],
    operations: ['source-inventory', 'state-transition'],
    hosts: ['any'],
  },
  'fk-charter:item.4910b2a0a7a3': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['deterministic-verify', 'merge', 'closure'],
    operations: ['source-inventory', 'state-transition'],
    hosts: ['any'],
  },
  'fk-charter:item.4d6ea442cfff': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['deterministic-verify', 'merge', 'closure'],
    operations: ['source-inventory', 'state-transition'],
    hosts: ['any'],
  },
  'fk-charter:item.49288a83830e': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['deterministic-verify', 'merge', 'closure'],
    operations: ['source-inventory', 'state-transition'],
    hosts: ['any'],
  },
  'fk-charter:item.41b4b3dccd81': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['any'],
    operations: ['any'],
    hosts: ['any'],
  },
  'fk-charter:item.c80d986d4cfe': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['any'],
    operations: ['any'],
    hosts: ['any'],
  },
  'fk-charter:item.ab729d219bbb': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['any'],
    operations: ['any'],
    hosts: ['any'],
  },
  'fk-charter:item.1c42ce2f7e94': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['any'],
    operations: ['any'],
    hosts: ['any'],
  },
  'fk-charter:item.28ec67f3ddb4': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['any'],
    operations: ['any'],
    hosts: ['any'],
  },
  'fk-charter:item.5138fd735a8a': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['any'],
    operations: ['any'],
    hosts: ['any'],
  },
  'fk-charter:item.6aae5fe2d602': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['any'],
    operations: ['any'],
    hosts: ['any'],
  },
  'fk-charter:item.fc4a386b94fe': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['any'],
    operations: ['any'],
    hosts: ['any'],
  },
  'fk-charter:item.42e05d00c67a': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['any'],
    operations: ['any'],
    hosts: ['any'],
  },
  'fk-charter:item.07490af17320': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['any'],
    operations: ['any'],
    hosts: ['any'],
  },
  'fk-charter:item.b5bad0475a3e': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['any'],
    operations: ['any'],
    hosts: ['any'],
  },
  'fk-charter:item.e86843a842bc': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['any'],
    operations: ['any'],
    hosts: ['any'],
  },
  'fk-charter:item.98b291e68000': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['any'],
    operations: ['any'],
    hosts: ['any'],
  },
  'fk-charter:item.76049b5d2003': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['any'],
    operations: ['any'],
    hosts: ['any'],
  },
  'fk-charter:item.7d74bdcd5bb3': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['deterministic-verify', 'merge', 'closure'],
    operations: ['source-inventory', 'state-transition'],
    hosts: ['any'],
  },
  'fk-charter:item.5f823cd304d6': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['deterministic-verify', 'merge', 'closure'],
    operations: ['source-inventory', 'state-transition'],
    hosts: ['any'],
  },
  'fk-charter:item.f1439c7e3a90': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['deterministic-verify', 'merge', 'closure'],
    operations: ['source-inventory', 'state-transition'],
    hosts: ['any'],
  },
  'fk-charter:item.fec816847e8e': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['deterministic-verify', 'merge', 'closure'],
    operations: ['source-inventory', 'state-transition'],
    hosts: ['any'],
  },
  'fk-charter:item.10bcdc2cae49': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['deterministic-verify', 'merge', 'closure'],
    operations: ['source-inventory', 'state-transition'],
    hosts: ['any'],
  },
  'fk-charter:item.5c1f19dd9911': {
    goals: ['foreman-kernel'],
    roles: ['reviewer'],
    stages: ['adversarial-review'],
    operations: ['receipt-validation'],
    hosts: ['any'],
  },
  'fk-charter:item.863fbb9202f0': {
    goals: ['foreman-kernel'],
    roles: ['builder'],
    stages: ['build'],
    operations: ['repo-mutation'],
    hosts: ['claude-windows-docker-loaded'],
  },
  'fk-charter:item.420807aa841c': {
    goals: ['foreman-kernel'],
    roles: ['builder'],
    stages: ['build'],
    operations: ['repo-mutation'],
    hosts: ['claude-windows-docker-loaded'],
  },
  'fk-charter:item.0b65a783a0be': {
    goals: ['foreman-kernel'],
    roles: ['reviewer'],
    stages: ['adversarial-review'],
    operations: ['repo-mutation'],
    hosts: ['claude-windows-docker-loaded'],
  },
  'fk-charter:item.8d204432b7c7': {
    goals: ['foreman-kernel'],
    roles: ['builder'],
    stages: ['build'],
    operations: ['repo-mutation'],
    hosts: ['claude-windows-docker-loaded'],
  },
  'fk-charter:item.e7be31fb263e': {
    goals: ['foreman-kernel'],
    roles: ['coordinator', 'builder'],
    stages: ['build', 'runtime'],
    operations: ['state-transition', 'control-call'],
    hosts: ['claude-windows-docker-loaded'],
  },
  'fk-charter:item.7983e741c7aa': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['shaping'],
    operations: ['state-transition'],
    hosts: ['provider-neutral'],
  },
  'fk-charter:item.ba4689f0d16e': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['shaping'],
    operations: ['state-transition'],
    hosts: ['provider-neutral'],
  },
  'fk-charter:item.e64616afcaf9': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['shaping'],
    operations: ['state-transition'],
    hosts: ['provider-neutral'],
  },
  'fk-charter:item.01fc2f9fcdd0': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['shaping'],
    operations: ['state-transition'],
    hosts: ['provider-neutral'],
  },
  'fk-charter:item.9aee50455247': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['shaping'],
    operations: ['state-transition'],
    hosts: ['provider-neutral'],
  },
  'fk-charter:item.6427173452f4': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['shaping'],
    operations: ['state-transition'],
    hosts: ['provider-neutral'],
  },
  'fk-charter:item.d6c307d21998': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['shaping'],
    operations: ['state-transition'],
    hosts: ['provider-neutral'],
  },
  'fk-charter:item.9e512e70b8f5': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['shaping'],
    operations: ['state-transition'],
    hosts: ['provider-neutral'],
  },
  'fk-charter:item.d4059b59ac59': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['shaping'],
    operations: ['state-transition'],
    hosts: ['provider-neutral'],
  },
  'fk-charter:item.f4e2ba3acfd6': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['shaping'],
    operations: ['state-transition'],
    hosts: ['provider-neutral'],
  },
  'fk-charter:item.d92a7c500de4': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['shaping'],
    operations: ['state-transition'],
    hosts: ['provider-neutral'],
  },
  'fk-charter:item.dc8cc83e01e7': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['shaping'],
    operations: ['state-transition'],
    hosts: ['provider-neutral'],
  },
  'fk-charter:item.387fb9c622d2': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['shaping'],
    operations: ['state-transition'],
    hosts: ['provider-neutral'],
  },
  'fk-charter:item.9efe42c4e01c': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['shaping'],
    operations: ['state-transition'],
    hosts: ['provider-neutral'],
  },
  'fk-charter:item.dde24d4c9b7c': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['shaping'],
    operations: ['state-transition'],
    hosts: ['provider-neutral'],
  },
  'fk-charter:item.ce7c8467ddb3': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['shaping'],
    operations: ['state-transition'],
    hosts: ['provider-neutral'],
  },
  'fk-charter:item.8e9428543291': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['shaping'],
    operations: ['state-transition'],
    hosts: ['provider-neutral'],
  },
  'fk-charter:item.c9611681dcca': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['shaping'],
    operations: ['state-transition'],
    hosts: ['provider-neutral'],
  },
  'fk-charter:item.1cf05e6b7716': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['shaping'],
    operations: ['state-transition'],
    hosts: ['provider-neutral'],
  },
  'fk-charter:item.5c24c3ef6591': {
    goals: ['foreman-kernel'],
    roles: ['coordinator'],
    stages: ['shaping'],
    operations: ['state-transition'],
    hosts: ['provider-neutral'],
  },
  'fk-charter:item.ec0f6225e0a6': {
    goals: ['foreman-kernel'],
    roles: ['ci'],
    stages: ['deterministic-verify'],
    operations: ['spec-mutation'],
    hosts: ['provider-neutral'],
  },
  'fk-charter:item.0689031c79ed': {
    goals: ['foreman-kernel'],
    roles: ['ci'],
    stages: ['deterministic-verify'],
    operations: ['repo-read'],
    hosts: ['provider-neutral'],
  },
  'fk-charter:item.349023b0246d': {
    goals: ['foreman-kernel'],
    roles: ['ci'],
    stages: ['deterministic-verify'],
    operations: ['control-call'],
    hosts: ['provider-neutral'],
  },
  'fk-charter:item.9308bed876c7': {
    goals: ['foreman-kernel'],
    roles: ['ci'],
    stages: ['deterministic-verify'],
    operations: ['receipt-validation'],
    hosts: ['provider-neutral'],
  },
  'fk-charter:item.612528548655': {
    goals: ['foreman-kernel'],
    roles: ['ci'],
    stages: ['deterministic-verify'],
    operations: ['control-call'],
    hosts: ['claude-windows-docker-loaded'],
  },
  'fk-charter:item.102464b0e25b': {
    goals: ['foreman-kernel'],
    roles: ['ci'],
    stages: ['deterministic-verify'],
    operations: ['state-transition'],
    hosts: ['claude-windows-docker-loaded'],
  },
  'fk-charter:item.e1b224d7294b': {
    goals: ['foreman-kernel'],
    roles: ['ci'],
    stages: ['deterministic-verify'],
    operations: ['state-transition'],
    hosts: ['claude-windows-docker-loaded'],
  },
  'fk-charter:item.501441d1853e': {
    goals: ['foreman-kernel'],
    roles: ['ci'],
    stages: ['deterministic-verify'],
    operations: ['repo-mutation'],
    hosts: ['claude-windows-docker-loaded'],
  },
  'fk-charter:item.fc74f0320a1c': {
    goals: ['foreman-kernel'],
    roles: ['ci'],
    stages: ['deterministic-verify'],
    operations: ['repo-mutation'],
    hosts: ['claude-windows-docker-loaded'],
  },
  'fk-charter:item.7eba1cb561c5': {
    goals: ['foreman-kernel'],
    roles: ['ci'],
    stages: ['deterministic-verify'],
    operations: ['state-transition'],
    hosts: ['claude-windows-docker-loaded'],
  },
  'fk-charter:item.eb56a1ab24d9': {
    goals: ['foreman-kernel'],
    roles: ['ci'],
    stages: ['deterministic-verify'],
    operations: ['control-call'],
    hosts: ['claude-windows-docker-loaded'],
  },
  'fk-charter:item.8843a7774432': {
    goals: ['foreman-kernel'],
    roles: ['ci'],
    stages: ['deterministic-verify'],
    operations: ['control-call'],
    hosts: ['claude-windows-docker-loaded'],
  },
  'fk-charter:item.10f729956b77': {
    goals: ['foreman-kernel'],
    roles: ['ci'],
    stages: ['deterministic-verify'],
    operations: ['control-call'],
    hosts: ['claude-windows-docker-loaded'],
  },
} as const satisfies Readonly<Record<string, AuthorityRule['applicability']>>

function curatedApplicabilityFor(sourceId: string, itemId: string): AuthorityRule['applicability'] {
  const key = `${sourceId}:${itemId}`
  const applicability =
    R11_PERMISSION_PROFILE_CURATION[key]?.applicability ??
    R11_CURATED_ITEM_SEMANTICS[key]?.applicability ??
    R11_APPLICABILITY_OVERRIDES[key] ??
    R10_CURATED_ITEM_SEMANTICS[key]?.applicability ??
    CURATED_ITEM_APPLICABILITY[key as keyof typeof CURATED_ITEM_APPLICABILITY]
  if (applicability === undefined) {
    throw new Error(`published item '${sourceId}:${itemId}' lacks literal curated applicability`)
  }
  return applicability
}

function ruleShape(
  classification: RuleClassification,
  sourceItemKey: string,
): Pick<AuthorityRule, 'decision' | 'refusalCode' | 'enforcementOwner' | 'assurance'> {
  switch (classification) {
    case 'pre-action-refusal':
      if (R12_GATE2_ALLOW_ITEMS.has(sourceItemKey)) {
        return {
          decision: 'ALLOW',
          refusalCode: null,
          enforcementOwner: 'kernel-policy',
          assurance: 'structural',
        }
      }
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

function permissionProfileApplicability(anchor: string): AuthorityRule['applicability'] {
  const profile = /^yaml-rule:([^:]+):/.exec(anchor)?.[1]
  const roles: AuthorityRule['applicability']['roles'] =
    profile === 'coordinator'
      ? ['coordinator']
      : profile === 'reviewer-readonly'
        ? ['reviewer']
        : profile === 'shaping-agent'
          ? ['shaper']
          : ['builder']
  const stages: AuthorityRule['applicability']['stages'] =
    profile === 'coordinator'
      ? [
          'stage-zero',
          'shaping',
          'deterministic-verify',
          'adversarial-review',
          'merge',
          'closure',
          'runtime',
        ]
      : profile === 'reviewer-readonly'
        ? ['adversarial-review']
        : profile === 'shaping-agent'
          ? ['shaping']
          : ['step-zero', 'build']
  return {
    goals: ['all-foreman-goals'],
    roles,
    stages,
    operations: ['repo-read'],
    hosts: ['claude-windows-docker-loaded'],
  }
}

function r13MarkdownApplicability(sourceId: string): AuthorityRule['applicability'] {
  return {
    goals: sourceId === 'fk-charter' ? ['foreman-kernel'] : ['all-foreman-goals'],
    roles: [
      'coordinator',
      'shaper',
      'builder',
      'reviewer',
      'ci',
      'host-adapter',
      'kernel',
      'operator',
    ],
    stages: [
      'stage-zero',
      'shaping',
      'step-zero',
      'build',
      'deterministic-verify',
      'adversarial-review',
      'merge',
      'closure',
      'runtime',
    ],
    operations: [
      'source-inventory',
      'spec-mutation',
      'repo-read',
      'repo-mutation',
      'state-transition',
      'control-call',
      'receipt-validation',
      'external-write',
    ],
    hosts: [
      'provider-neutral',
      'claude-windows-docker-loaded',
      'claude-windows-docker-unenrolled',
      'unsupported-host',
      'ci',
    ],
  }
}

function shortId(value: string): string {
  return sha256(value).slice(0, 12)
}

const priorR11RulesById = new Map(priorR11Registry.rules.map((rule) => [rule.ruleId, rule]))

function legacyRuleIdsFor(sourceId: string, locator: SourceLocator): string[] {
  return Object.entries(R12_LEGACY_MARKDOWN_RULE_TARGETS)
    .filter(
      ([, target]) =>
        target.sourceId === sourceId &&
        target.kind === locator.kind &&
        target.anchor === locator.anchor,
    )
    .map(([ruleId]) => ruleId)
}

export function markdownIdentityProjectionForTesting(sourceId: string, content: string) {
  const definition = SOURCE_DEFINITIONS.find((candidate) => candidate.sourceId === sourceId)
  if (definition === undefined || !definition.path.endsWith('.md')) {
    throw new Error(`Markdown source '${sourceId}' is not declared`)
  }
  return markdownBindingBlocks(markdownDocumentMap(content)).map((located) => {
    const itemId = itemIdFor(definition, located)
    const legacyRuleIds = legacyRuleIdsFor(sourceId, located.locator)
    const compound = R11_COMPOUND_ITEM_SEMANTICS[`${sourceId}:${itemId}`]
    const generatedRuleIds =
      compound !== undefined
        ? compound.map(
            (entry) => `rule.${sourceId}.${itemId.replace(/^item\./, '')}.${entry.suffix}`,
          )
        : authorityIdentityFor(sourceId, itemId) === null
          ? []
          : [`rule.${sourceId}.${itemId.replace(/^item\./, '')}`]
    return {
      itemId,
      locator: located.locator,
      locatorDigest: locatorDigestFor(located.locator),
      normalizedExcerpt: normalizeRuleText(located.text),
      valueDigest: sha256(normalizeRuleText(located.text)),
      ruleIds: [...new Set([...legacyRuleIds, ...generatedRuleIds])],
    }
  })
}

function migratedLegacyRule(
  ruleId: string,
  sourceRef: SourceRef,
  normalizedStatement: string,
): AuthorityRule {
  const prior = priorR11RulesById.get(ruleId)
  if (prior === undefined) throw new Error(`R12 legacy rule '${ruleId}' is absent from R11`)
  const coordinatorAdvisory = ruleId === 'rule.coordinator-pattern.91dd60b00fd6'
  const base: AuthorityRule = {
    ...structuredClone(prior),
    normalizedStatement,
    sourceRefs: [sourceRef],
    authorityBasisRef: sourceRef,
    ...(coordinatorAdvisory
      ? {
          severity: 'medium' as const,
          classification: 'narrative-provenance' as const,
          decision: 'ADVISORY' as const,
          refusalCode: null,
          enforcementOwner: 'provenance-only' as const,
          assurance: 'narrative' as const,
        }
      : {}),
    bindingDigest: '',
  }
  return { ...base, bindingDigest: bindingDigestFor(base) }
}

function buildSource(definition: SourceDefinition): {
  source: CanonSource
  rules: AuthorityRule[]
} {
  const absolutePath = join(repoRoot, ...definition.path.split('/'))
  const bytes = readFileSync(absolutePath)
  const content = bytes.toString('utf8')
  const markdown = definition.path.endsWith('.md') ? markdownDocumentMap(content) : null
  const baseLocated =
    definition.anchors === undefined
      ? markdown === null
        ? []
        : [...headingLocators(markdown)]
      : definition.anchors.map((anchor, index) => ({
          locator: { kind: 'line-excerpt', anchor, lineHint: index + 1 } as SourceLocator,
          text: anchor,
        }))
  const curated = [...baseLocated]
  if (markdown !== null) curated.push(...markdownBindingBlocks(markdown))
  if (definition.path.endsWith('.ts')) curated.push(...tsConstructs(content))
  if (definition.path.endsWith('.json')) curated.push(...jsonConstraints(content))
  if (definition.sourceId === 'permission-profiles-registry') {
    curated.push(...permissionProfileRules(content))
  }
  if (definition.sourceId === 'fk-charter') {
    if (markdown === null) throw new Error('charter Markdown block map is unavailable')
    curated.unshift(
      ...tableRows(
        markdown,
        Array.from({ length: 20 }, (_, index) => `D${index + 1}`),
      ),
    )
  }
  if (definition.sourceId === 'fk-plan-review-findings') {
    if (markdown === null) throw new Error('plan-review Markdown block map is unavailable')
    curated.unshift(
      ...tableRows(
        markdown,
        Array.from({ length: 13 }, (_, index) => `R${index + 1}`),
      ),
    )
  }
  const unique = new Map<string, LocatedText>()
  for (const entry of curated) {
    unique.set(`${entry.locator.kind}\u0000${entry.locator.anchor}`, entry)
  }
  const explicitTableStatements = new Set(
    [...unique.values()]
      .filter((entry) => entry.locator.kind === 'table-row')
      .filter((entry) => !entry.locator.anchor.startsWith('md-block:'))
      .map((entry) => normalizeRuleText(entry.text)),
  )
  const located = [...unique.values()].filter(
    (entry) =>
      !(
        entry.locator.anchor.startsWith('md-block:') &&
        entry.locator.anchor.includes(':table-row:') &&
        explicitTableStatements.has(normalizeRuleText(entry.text))
      ),
  )
  if (located.length === 0) throw new Error(`source '${definition.path}' has no inventory locators`)
  const rules: AuthorityRule[] = []
  const publishedByStatement = new Map<string, string>()
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
    if (
      definition.sourceId === 'permission-profiles-registry' &&
      (locator.anchor.startsWith('yaml-container:') || /:ask:\[\]$/.test(locator.anchor))
    ) {
      return {
        itemId,
        locator,
        normalizedExcerpt,
        valueDigest,
        ruleIds: [],
        exclusionDisposition: 'schema-container' as const,
        rationale: `Inventory item ${itemId} at ${locator.anchor} is a path-keyed YAML structural container and does not independently grant or restrict authority.`,
      }
    }
    const sourceRef: SourceRef = {
      sourceId: definition.sourceId,
      itemId,
      locatorDigest: locatorDigestFor(locator),
      valueDigest,
    }
    const sourceItemKey = `${definition.sourceId}:${itemId}`
    if (R13_NORMATIVE_MARKDOWN_PUBLICATION_KEYS.has(sourceItemKey)) {
      const ruleId = `rule.${definition.sourceId}.${itemId.replace(/^item\./, '')}`
      const baseRule: AuthorityRule = {
        ruleId,
        authoritySubject: `normative-markdown.${definition.sourceId}.item-${itemId.replace(/^item\./, '')}`,
        authorityClaim: 'source-authored-operative-constraint',
        normalizedStatement: normalizedExcerpt,
        sourceRefs: [sourceRef],
        authorityBasisRef: sourceRef,
        applicability: r13MarkdownApplicability(definition.sourceId),
        severity: 'critical',
        classification: 'pre-action-refusal',
        decision: 'REFUSE',
        refusalCode: `NORMATIVE_${definition.sourceId.replace(/-/g, '_').toUpperCase()}_${itemId.replace(/^item\./, '').toUpperCase()}`,
        enforcementOwner: 'kernel-policy',
        assurance: 'structural',
        pairedRuleIds: [],
        retirementState: 'active-reading',
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
      publishedByStatement.set(normalizedExcerpt, ruleId)
      return {
        itemId,
        locator,
        normalizedExcerpt,
        valueDigest,
        ruleIds: [ruleId],
        exclusionDisposition: null,
        rationale: `R13 normative Markdown candidate ${itemId} is published as an exact source-bound refusal rule.`,
      }
    }
    if (
      definition.sourceId === 'permission-profiles-registry' &&
      (locator.anchor.includes(':allow:') ||
        locator.anchor === 'yaml-rule:builder-deps:network/egress' ||
        locator.anchor === 'yaml-rule:builder-deps:network/notes')
    ) {
      const ruleId = `rule.${definition.sourceId}.${itemId.replace(/^item\./, '')}`
      const profile = /^yaml-rule:([^:]+):/.exec(locator.anchor)?.[1] ?? 'unknown'
      const baseRule: AuthorityRule = {
        ruleId,
        authoritySubject: `permission-profile.${profile}.documentation`,
        authorityClaim: `documents-${sha256(locator.anchor).slice(0, 16)}`,
        normalizedStatement: normalizedExcerpt,
        sourceRefs: [sourceRef],
        authorityBasisRef: sourceRef,
        applicability: permissionProfileApplicability(locator.anchor),
        severity: 'medium',
        classification: 'narrative-provenance',
        decision: 'ADVISORY',
        refusalCode: null,
        enforcementOwner: 'provenance-only',
        assurance: 'narrative',
        pairedRuleIds: [],
        retirementState: 'active-reading',
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
      publishedByStatement.set(normalizedExcerpt, ruleId)
      return {
        itemId,
        locator,
        normalizedExcerpt,
        valueDigest,
        ruleIds: [ruleId],
        exclusionDisposition: null,
        rationale: `Permission profile ${profile} documentation is published as nonbinding narrative provenance.`,
      }
    }
    const legacyRuleIds = legacyRuleIdsFor(definition.sourceId, locator)
    const authorityIdentity = authorityIdentityFor(definition.sourceId, itemId)
    const compoundSemantics = R11_COMPOUND_ITEM_SEMANTICS[`${definition.sourceId}:${itemId}`]
    if (
      authorityIdentity === null &&
      compoundSemantics === undefined &&
      legacyRuleIds.length === 0
    ) {
      const duplicateRuleId = publishedByStatement.get(normalizedExcerpt)
      const structuralCoverage =
        (definition.sourceId === 'spec-linter-validator' && itemId === 'item.80563af1788e') ||
        (locator.kind === 'symbol' &&
          (locator.anchor.startsWith('ts-') || locator.anchor.startsWith('json-pointer:')))
      return {
        itemId,
        locator,
        normalizedExcerpt,
        valueDigest,
        ruleIds: [],
        exclusionDisposition:
          duplicateRuleId !== undefined
            ? ('duplicate-exact-statement' as const)
            : structuralCoverage
              ? locator.anchor.startsWith('json-pointer:')
                ? ('schema-container' as const)
                : ('structural-ast' as const)
              : ('non-normative-explanation' as const),
        rationale:
          duplicateRuleId !== undefined
            ? `Inventory item ${itemId} at ${locator.anchor} duplicates the normalized meaning of ${duplicateRuleId}.`
            : structuralCoverage
              ? `Inventory item ${itemId} at ${locator.anchor} provides structural change coverage and does not independently state authority.`
              : `Inventory item ${itemId} at ${locator.anchor} is explanatory context and does not state an independent normative authority rule.`,
      }
    }
    const ruleId = `rule.${definition.sourceId}.${itemId.replace(/^item\./, '')}`
    const migratedRules = legacyRuleIds.map((legacyRuleId) =>
      migratedLegacyRule(legacyRuleId, sourceRef, normalizedExcerpt),
    )
    rules.push(...migratedRules)
    if (compoundSemantics !== undefined) {
      const ruleIds: string[] = [...legacyRuleIds]
      for (const compound of compoundSemantics) {
        const ruleId = `rule.${definition.sourceId}.${itemId.replace(/^item\./, '')}.${compound.suffix}`
        const shape = ruleShape(
          'pre-action-refusal',
          `${definition.sourceId}:${itemId}:${compound.suffix}`,
        )
        const baseRule: AuthorityRule = {
          ruleId,
          authoritySubject: compound.identity[0],
          authorityClaim: compound.identity[1],
          normalizedStatement: normalizeRuleText(compound.normalizedStatement),
          sourceRefs: [sourceRef],
          authorityBasisRef: sourceRef,
          applicability: compound.applicability,
          severity: 'critical',
          classification: 'pre-action-refusal',
          ...shape,
          pairedRuleIds: [],
          retirementState: 'active-reading',
          retirementEvidence: {
            predicate: null,
            negativeRefusalTest: null,
            corpusSweep: null,
            independentBypassAttempt: null,
          },
          bindingDigest: '',
        }
        const rule = { ...baseRule, bindingDigest: bindingDigestFor(baseRule) }
        if (!ruleIds.includes(ruleId)) {
          rules.push(rule)
          ruleIds.push(ruleId)
        }
      }
      publishedByStatement.set(normalizedExcerpt, ruleIds[0] as string)
      return {
        itemId,
        locator,
        normalizedExcerpt,
        valueDigest,
        ruleIds,
        exclusionDisposition: null,
        rationale:
          'Compound normative source block is mapped to distinct source-bound rules for each independently operative clause.',
      }
    }
    if (authorityIdentity === null) {
      publishedByStatement.set(normalizedExcerpt, legacyRuleIds[0] as string)
      return {
        itemId,
        locator,
        normalizedExcerpt,
        valueDigest,
        ruleIds: legacyRuleIds,
        exclusionDisposition: null,
        rationale: 'R12 frozen legacy rule identity is rebound to this canonical structural item.',
      }
    }
    if (legacyRuleIds.includes(ruleId)) {
      publishedByStatement.set(normalizedExcerpt, ruleId)
      return {
        itemId,
        locator,
        normalizedExcerpt,
        valueDigest,
        ruleIds: legacyRuleIds,
        exclusionDisposition: null,
        rationale: 'R12 frozen legacy rule identity is rebound to this canonical structural item.',
      }
    }
    const classification = curatedClassificationFor(definition.sourceId, itemId)
    const baseSemantics = ruleShape(classification, `${definition.sourceId}:${itemId}`)
    const semantics =
      (definition.sourceId === 'permission-profiles-validator' ||
        R11_PERMISSION_PROFILE_CURATION[`${definition.sourceId}:${itemId}`] !== undefined) &&
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
      applicability: curatedApplicabilityFor(definition.sourceId, itemId),
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
    publishedByStatement.set(normalizedExcerpt, ruleId)
    return {
      itemId,
      locator,
      normalizedExcerpt,
      valueDigest,
      ruleIds: [...legacyRuleIds, ruleId],
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

function _requiredReconciliations(
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
  const charterVerification = get('fk-charter', 'item.5c1f19dd9911')
  const legacyCharterGate3Ref: SourceRef = {
    ...charterGate3.ref,
    locatorDigest: 'f8ffc0669f2e67b5d14d6916c639d77d2d1170f687d2da78aee73d35eec09cbf',
  }
  const legacyCharterVerificationRef: SourceRef = {
    ...charterVerification.ref,
    locatorDigest: 'd696d9d5da3531f0be97ae65cb027077c47a113eeefc0de56d5f0ea56dcd8232',
  }
  const coordinatorCommentary = get('coordinator-pattern', 'item.d62734f662a0')
  const coordinatorGate3 = get('coordinator-pattern', 'item.f7686ab58db7')
  const conventionGate3 = get('spec-convention', 'item.022fc00afe7b')
  const historicalGate3 = get('foreman-line-plan', 'item.c92333c21e64')
  const conventionProfile = get('spec-convention', 'item.e6f5fa8543a1')
  const conventionSurfaces = get('spec-convention', 'item.ac5ff7afd06f')
  const conventionAllowed = get('spec-convention', 'item.5145ab15549c')
  const conventionStop = get('spec-convention', 'item.fd82127bf9f9')
  const r11ProtectedStop = get('spec-convention', 'item.c4828bcd6dfa')
  const linter = [get('spec-frontmatter-schema', 'item.bdf997c3cd45')]
  const linterProfileMissing = get('spec-linter-validator', 'item.092d2fc43a32')
  const linterProfileWarning = get('spec-linter-validator', 'item.fb7d76a32df4')
  const linterReturn = getInventory('spec-linter-validator', 'item.80563af1788e')
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
  const r8Manifest = 'dc213f213342f6ac744bf4ece7c3c322315d6946f894b7bfbd37db96954d0002'
  const r9Manifest = '825b3a04cdd506762cba1bbb6c7d007dd4b163e40be5dad733b97482d92f9df6'
  const r10Manifest = '99d9bed01cd5a7957457e24c82cbcc3645ebf591415d6072c26130d3b8a2e8d7'
  const r11Manifest = 'dd775924c5fe88f24f3aa1c545e2501fe9ca3ef8f9cedb0541cf043d0ae36257'
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
  const allowedFilesAbsenceInput = sha256(
    canonicalJson([conventionSurfaces.ref, conventionAllowed.ref, conventionStop.ref]),
  )
  const allowedFilesAbsenceResult = sha256(
    canonicalJson({ compiler: 'spec-linter', bodySection: 'Allowed Files', present: false }),
  )
  const allowedFilesAbsenceCommand = commandEvidence(
    'allowed-files-body-compiler-absence',
    allowedFilesAbsenceInput,
    allowedFilesAbsenceResult,
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
      [coordinatorGate3.ref, conventionGate3.ref, historicalGate3.ref, legacyCharterGate3Ref],
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
    {
      ...reconciliationMany(
        'surfaces-allowed-files',
        'Routing metadata surfaces versus exact body-level Allowed Files authority.',
        [conventionSurfaces.ref, conventionAllowed.ref, conventionStop.ref, charterAllowed.ref],
        [conventionAllowed.ruleId, conventionStop.ruleId, charterAllowed.ruleId],
        'resolved-for-fk',
        'surfaces is routing metadata only; Allowed Files remains the mutation boundary.',
        'Mechanical body compilation remains a declared FK-P2 gap.',
      ),
      observedEvidence: [
        ...[
          conventionSurfaces.ref,
          conventionAllowed.ref,
          conventionStop.ref,
          charterAllowed.ref,
        ].map((reference) => ({
          kind: 'source-ref' as const,
          reference: canonicalJson(reference),
          digest: sha256(canonicalJson(reference)),
        })),
        {
          kind: 'command-result' as const,
          reference: allowedFilesAbsenceCommand,
          digest: sha256(allowedFilesAbsenceCommand),
        },
      ],
    },
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
    {
      reconciliationId: 'registry-rework-37afc65',
      topic: 'R7 registry bindings superseded by the coordinator-ratified FK-P0 R8 amendment.',
      observedRefs: [charterAllowed.ref],
      observedEvidence: [
        {
          kind: 'git-commit',
          reference: '5d7ca990574eb8416a1fc5ac40b90d9aec975b2b',
          digest: sha256(
            execFileSync('git', ['cat-file', '-p', '5d7ca990574eb8416a1fc5ac40b90d9aec975b2b'], {
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
          reference: commandEvidence('registry-binding-manifest-r7', sha256(SNAPSHOT), r7Manifest),
          digest: sha256(
            commandEvidence('registry-binding-manifest-r7', sha256(SNAPSHOT), r7Manifest),
          ),
        },
        {
          kind: 'command-result',
          reference: commandEvidence('superseding-binding-manifest-r8', r7Manifest, r8Manifest),
          digest: sha256(
            commandEvidence('superseding-binding-manifest-r8', r7Manifest, r8Manifest),
          ),
        },
      ],
      authoritativeRuleIds: [charterAllowed.ruleId],
      scopedDisposition:
        'The R8 protected exits, literal applicability, evidence, and unified Markdown discovery contract supersedes the R7 registry bindings in FK scope.',
      unresolvedConsequence:
        'Future binding changes require another typed prior-to-new migration record.',
      migrationStatus: 'superseded-by-amendment',
      supersedingEvidence: charterAllowed.ref,
    },
    {
      reconciliationId: 'registry-rework-91145d7',
      topic: 'R8 registry bindings superseded by the coordinator-ratified FK-P0 R9 amendment.',
      observedRefs: [legacyCharterVerificationRef],
      observedEvidence: [
        {
          kind: 'git-commit',
          reference: '84d5c7c0fd2ef074dab06770f14e87012619a213',
          digest: sha256(
            execFileSync('git', ['cat-file', '-p', '84d5c7c0fd2ef074dab06770f14e87012619a213'], {
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
          reference: commandEvidence('registry-binding-manifest-r8', sha256(SNAPSHOT), r8Manifest),
          digest: sha256(
            commandEvidence('registry-binding-manifest-r8', sha256(SNAPSHOT), r8Manifest),
          ),
        },
        {
          kind: 'command-result',
          reference: commandEvidence('superseding-binding-manifest-r9', r8Manifest, r9Manifest),
          digest: sha256(
            commandEvidence('superseding-binding-manifest-r9', r8Manifest, r9Manifest),
          ),
        },
      ],
      authoritativeRuleIds: [charterVerification.ruleId],
      scopedDisposition:
        'The R9 protected publications, per-item classification, loop semantics, and raw-fence contract supersede the R8 registry bindings in FK scope.',
      unresolvedConsequence:
        'Future binding changes require another typed prior-to-new migration record.',
      migrationStatus: 'superseded-by-amendment',
      supersedingEvidence: legacyCharterVerificationRef,
    },
    {
      reconciliationId: 'registry-rework-1b42f4b',
      topic: 'R9 registry bindings superseded by the coordinator-ratified FK-P0 R10 amendment.',
      observedRefs: [coordinatorCommentary.ref],
      observedEvidence: [
        {
          kind: 'git-commit',
          reference: '89d7e4853a8fb0af3db68e9262e38833062fba77',
          digest: sha256(
            execFileSync('git', ['cat-file', '-p', '89d7e4853a8fb0af3db68e9262e38833062fba77'], {
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
          reference: commandEvidence('registry-binding-manifest-r9', sha256(SNAPSHOT), r9Manifest),
          digest: sha256(
            commandEvidence('registry-binding-manifest-r9', sha256(SNAPSHOT), r9Manifest),
          ),
        },
        {
          kind: 'command-result',
          reference: commandEvidence('superseding-binding-manifest-r10', r9Manifest, r10Manifest),
          digest: sha256(
            commandEvidence('superseding-binding-manifest-r10', r9Manifest, r10Manifest),
          ),
        },
      ],
      authoritativeRuleIds: [coordinatorCommentary.ruleId],
      scopedDisposition:
        'The R10 universal Markdown custody, source-honest goal and coordinator semantics, precise Gate 3 scope, and complete rework-evidence contract supersede the R9 registry bindings in FK scope.',
      unresolvedConsequence:
        'Future binding changes require another typed prior-to-new migration record.',
      migrationStatus: 'superseded-by-amendment',
      supersedingEvidence: coordinatorCommentary.ref,
    },
    {
      reconciliationId: 'registry-rework-ee29973',
      topic: 'R10 registry bindings superseded by the coordinator-ratified FK-P0 R11 amendment.',
      observedRefs: [r11ProtectedStop.ref],
      observedEvidence: [
        {
          kind: 'git-commit',
          reference: 'f3366be12175acb4fd4aeb32c301c845b906a5da',
          digest: sha256(
            execFileSync('git', ['cat-file', '-p', 'f3366be12175acb4fd4aeb32c301c845b906a5da'], {
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
            'registry-binding-manifest-r10',
            sha256(SNAPSHOT),
            r10Manifest,
          ),
          digest: sha256(
            commandEvidence('registry-binding-manifest-r10', sha256(SNAPSHOT), r10Manifest),
          ),
        },
        {
          kind: 'command-result',
          reference: commandEvidence('superseding-binding-manifest-r11', r10Manifest, r11Manifest),
          digest: sha256(
            commandEvidence('superseding-binding-manifest-r11', r10Manifest, r11Manifest),
          ),
        },
      ],
      authoritativeRuleIds: [r11ProtectedStop.ruleId],
      scopedDisposition:
        'The R11 structural Markdown identity, atomic compound semantics, protected normative blocks, mediated profile scope, and explicit Gate 2 decision contract supersede the R10 registry bindings in FK scope.',
      unresolvedConsequence:
        'Future binding changes require another typed prior-to-new migration record.',
      migrationStatus: 'superseded-by-amendment',
      supersedingEvidence: r11ProtectedStop.ref,
    },
  ]
}

function buildRegistry(): AuthorityEnforcementRegistry {
  const built = SOURCE_DEFINITIONS.map(buildSource)
  const sources = built.map((entry) => entry.source)
  const rules = built.flatMap((entry) => entry.rules)
  const operation = operationAuthority({
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
      refFor(sources, 'spec-convention', 'item.03f0830cd693'),
      refFor(sources, 'fk-loop-directive', 'item.dd8203551518'),
    ],
    closure: [
      refFor(sources, 'fk-charter', 'item.e9ec57edc0a2'),
      refFor(sources, 'fk-loop-directive', 'item.e3065db62b43'),
    ],
  })
  const normativeMarkdownAudit = R13_NORMATIVE_MARKDOWN_AUDIT_KEYS.map((key) => {
    const separator = key.indexOf(':')
    const sourceId = key.slice(0, separator)
    const itemId = key.slice(separator + 1)
    const source = sources.find((candidate) => candidate.sourceId === sourceId)
    const item = source?.inventoryItems.find((candidate) => candidate.itemId === itemId)
    if (item === undefined) throw new Error(`R13 audit candidate '${key}' is missing`)
    const published = item.ruleIds.length > 0
    return {
      sourceId,
      itemId,
      valueDigest: item.valueDigest,
      disposition: published ? 'publish' : 'exclude',
      ruleIds: item.ruleIds,
      exclusionCode: published ? null : item.exclusionDisposition,
      rationale: published
        ? `Audit candidate ${itemId} is published by its exact source-bound rule set.`
        : `Audit candidate ${itemId} is excluded as ${item.exclusionDisposition}; this exact source item does not independently impose an operative FK rule.`,
    } as NormativeMarkdownAuditRecord
  })
  const provisional: AuthorityEnforcementRegistry = {
    schemaVersion: '0.1.0',
    registryId: 'foreman-kernel-authority-enforcement',
    sourceSnapshotCommit: SNAPSHOT,
    sources,
    rules,
    operationAuthority: operation,
    reconciliations: structuredClone(priorR13Registry.reconciliations),
    normativeMarkdownAudit,
  }
  const r13Manifest = registryBindingManifestDigest(provisional)
  const priorManifest = registryBindingManifestDigest(priorR13Registry)
  const basisRule = rules.find((rule) => rule.ruleId === 'rule.fk-charter.2a524c1ea63f')
  if (basisRule === undefined) throw new Error('R13 migration basis rule is missing')
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
  const priorCommand = commandEvidence(
    'registry-binding-manifest-r12',
    sha256(R13_PRIOR_REGISTRY_COMMIT),
    priorManifest,
  )
  const currentCommand = commandEvidence(
    'superseding-binding-manifest-r13',
    priorManifest,
    r13Manifest,
  )
  const r13Migration: ReconciliationRecord = {
    reconciliationId: 'registry-rework-0683bc0',
    topic: 'R12 registry bindings superseded by the coordinator-ratified FK-P0 R13 amendment.',
    observedRefs: [basisRule.authorityBasisRef],
    observedEvidence: [
      {
        kind: 'git-commit',
        reference: R13_PRIOR_REGISTRY_COMMIT,
        digest: sha256(
          execFileSync('git', ['cat-file', '-p', R13_PRIOR_REGISTRY_COMMIT], { cwd: repoRoot }),
        ),
      },
      {
        kind: 'git-commit',
        reference: SNAPSHOT,
        digest: sha256(execFileSync('git', ['cat-file', '-p', SNAPSHOT], { cwd: repoRoot })),
      },
      { kind: 'command-result', reference: priorCommand, digest: sha256(priorCommand) },
      { kind: 'command-result', reference: currentCommand, digest: sha256(currentCommand) },
    ],
    authoritativeRuleIds: [basisRule.ruleId],
    scopedDisposition:
      'The R13 normative Markdown audit, fail-closed public resolver, structural YAML profile model, lineHint-free identity, and duplicate keyed-table refusal supersede the R12 registry bindings in FK scope.',
    unresolvedConsequence:
      'Future binding changes require another typed prior-to-new migration record.',
    migrationStatus: 'superseded-by-amendment',
    supersedingEvidence: basisRule.authorityBasisRef,
  }
  return {
    ...provisional,
    reconciliations: [...provisional.reconciliations, r13Migration],
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

function main(): void {
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
}

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) main()
