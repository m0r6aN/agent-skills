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

function headingSections(content: string): LocatedText[] {
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
  return headings.map((heading) => {
    let end = lines.length
    for (let index = heading.index + 1; index < lines.length; index += 1) {
      const nextLevel = /^(#{1,6})\s+/.exec(lines[index] ?? '')?.[1]?.length
      if (nextLevel !== undefined && nextLevel <= heading.level) {
        end = index
        break
      }
    }
    return {
      locator: { kind: 'heading', anchor: heading.anchor, lineHint: heading.index + 1 },
      text: lines.slice(heading.index, end).join('\n'),
    }
  })
}

function numberedItems(content: string): LocatedText[] {
  const lines = content.replace(/\r\n?/g, '\n').split('\n')
  const stack: { level: number; heading: string }[] = []
  const items: { index: number; indent: number; anchor: string }[] = []
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? ''
    const heading = /^(#{1,6})\s+.+/.exec(line)
    if (heading !== null) {
      const level = heading[1]?.length ?? 6
      while ((stack.at(-1)?.level ?? 0) >= level) stack.pop()
      stack.push({ level, heading: line.trim() })
      continue
    }
    const numbered = /^(\s*)\d+\.\s+\S/.exec(line)
    if (numbered === null) continue
    const prefix = stack.map((item) => item.heading)
    items.push({
      index,
      indent: numbered[1]?.length ?? 0,
      anchor: [...prefix, line.trim()].join(' > '),
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
      const next = /^(\s*)\d+\.\s+\S/.exec(line)
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

function classify(text: string): RuleClassification {
  const lower = text.toLowerCase()
  if (/unsupported|cannot enforce|bypass|unenrolled|limitation|inert/.test(lower))
    return 'unsupported'
  if (/independent review|independent-review|human judgment|human gate|reviewer/.test(lower)) {
    return 'independent-review-human-judgment'
  }
  if (/\bci\b|lint|test|verification command|static check/.test(lower)) return 'ci-static-check'
  if (/git status|post-review|detect|after the action|after assembly/.test(lower)) {
    return 'post-action-detection'
  }
  if (/must not|never |forbidden|\bstop\b|reject|refuse|cannot |do not /.test(lower)) {
    return 'pre-action-refusal'
  }
  return 'narrative-provenance'
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
  const located =
    definition.anchors === undefined
      ? [...headingSections(content), ...numberedItems(content)]
      : definition.anchors.map((anchor, index) => ({
          locator: { kind: 'line-excerpt', anchor, lineHint: index + 1 } as SourceLocator,
          text: anchor,
        }))
  if (located.length === 0) throw new Error(`source '${definition.path}' has no inventory locators`)
  const rules: AuthorityRule[] = []
  const inventoryItems = located.map(({ locator, text }) => {
    const normalizedExcerpt = normalizeRuleText(text)
    const suffix = shortId(locator.anchor)
    const itemId = `item.${suffix}`
    const ruleId = `rule.${definition.sourceId}.${suffix}`
    const valueDigest = sha256(normalizedExcerpt)
    const sourceRef: SourceRef = {
      sourceId: definition.sourceId,
      itemId,
      locatorDigest: locatorDigestFor(locator),
      valueDigest,
    }
    const classification = classify(normalizedExcerpt)
    const semantics = ruleShape(classification)
    const baseRule: AuthorityRule = {
      ruleId,
      normalizedStatement: normalizedExcerpt,
      sourceRefs: [sourceRef],
      applicability: {
        goals: definition.scope,
        roles: ['any'],
        stages: ['any'],
        operations: ['any'],
        hosts: ['any'],
      },
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

function firstRef(source: CanonSource): SourceRef {
  const item = source.inventoryItems[0]
  if (item === undefined) throw new Error(`source '${source.sourceId}' has no inventory`)
  return {
    sourceId: source.sourceId,
    itemId: item.itemId,
    locatorDigest: locatorDigestFor(item.locator),
    valueDigest: item.valueDigest,
  }
}

function operationAuthority(evidence: SourceRef): OperationAuthority[] {
  return [
    {
      operationId: 'gate1.ratify',
      allowedPrincipals: ['human-developer'],
      requiredGitEvidence: [evidence],
      missingEvidenceDecision: 'REQUIRE_HUMAN',
      agentCallable: false,
      operationalStateMaySatisfy: false,
      toolMayIssueAuthorityEvidence: false,
    },
    {
      operationId: 'gate2.dispatch',
      allowedPrincipals: ['coordinator', 'builder'],
      requiredGitEvidence: [evidence],
      missingEvidenceDecision: 'REFUSE',
      agentCallable: true,
      operationalStateMaySatisfy: false,
      toolMayIssueAuthorityEvidence: false,
    },
    {
      operationId: 'gate3.merge',
      allowedPrincipals: ['human-developer'],
      requiredGitEvidence: [evidence],
      missingEvidenceDecision: 'REQUIRE_HUMAN',
      agentCallable: false,
      operationalStateMaySatisfy: false,
      toolMayIssueAuthorityEvidence: false,
    },
    {
      operationId: 'verification.issue',
      allowedPrincipals: ['independent-reviewer'],
      requiredGitEvidence: [evidence],
      missingEvidenceDecision: 'REFUSE',
      agentCallable: false,
      operationalStateMaySatisfy: false,
      toolMayIssueAuthorityEvidence: false,
    },
    {
      operationId: 'closure.record',
      allowedPrincipals: ['human-developer'],
      requiredGitEvidence: [evidence],
      missingEvidenceDecision: 'REFUSE',
      agentCallable: false,
      operationalStateMaySatisfy: false,
      toolMayIssueAuthorityEvidence: false,
    },
    {
      operationId: 'receipt.mint-generic',
      allowedPrincipals: ['kernel-operator'],
      requiredGitEvidence: [],
      missingEvidenceDecision: 'REFUSE',
      agentCallable: false,
      operationalStateMaySatisfy: false,
      toolMayIssueAuthorityEvidence: false,
    },
    {
      operationId: 'external.write',
      allowedPrincipals: ['human-developer'],
      requiredGitEvidence: [evidence],
      missingEvidenceDecision: 'REQUIRE_HUMAN',
      agentCallable: false,
      operationalStateMaySatisfy: false,
      toolMayIssueAuthorityEvidence: false,
    },
  ]
}

function reconciliation(
  reconciliationId: string,
  topic: string,
  evidence: SourceRef,
  ruleId: string,
  status: 'open' | 'resolved-for-fk',
  disposition: string,
  consequence: string,
  evidenceKind: 'source-ref' | 'missing-path' = 'source-ref',
): ReconciliationRecord {
  const reference =
    evidenceKind === 'missing-path'
      ? 'docs/transcripts/defects_lessons.md'
      : `${evidence.sourceId}:${evidence.itemId}`
  return {
    reconciliationId,
    topic,
    observedRefs: [evidence],
    observedEvidence: [{ kind: evidenceKind, reference, digest: sha256(reference) }],
    authoritativeRuleIds: [ruleId],
    scopedDisposition: disposition,
    unresolvedConsequence: consequence,
    migrationStatus: status,
    supersedingEvidence: null,
  }
}

function requiredReconciliations(
  sources: readonly CanonSource[],
  rules: readonly AuthorityRule[],
): ReconciliationRecord[] {
  const byId = new Map(sources.map((source) => [source.sourceId, source]))
  const get = (sourceId: string): { ref: SourceRef; ruleId: string } => {
    const source = byId.get(sourceId)
    if (source === undefined) throw new Error(`missing reconciliation source '${sourceId}'`)
    const ref = firstRef(source)
    const ruleId = source.inventoryItems[0]?.ruleIds[0]
    if (ruleId === undefined || !rules.some((rule) => rule.ruleId === ruleId)) {
      throw new Error(`missing reconciliation rule for '${sourceId}'`)
    }
    return { ref, ruleId }
  }
  const plan = get('foreman-line-plan')
  const coordinator = get('coordinator-pattern')
  const linter = get('spec-frontmatter-schema')
  const convention = get('spec-convention')
  const profiles = get('permission-profiles-registry')
  const standing = get('standing-constraints')
  return [
    reconciliation(
      'gate-namespace-count',
      'Historical two-gate and stage approval terms versus FK Gate 1, Gate 2, and Gate 3.',
      plan.ref,
      plan.ruleId,
      'resolved-for-fk',
      'Historical pipeline vocabulary remains visible; the FK goal three-gate namespace controls FK work.',
      'Naive consumers must retain the namespace and scope when interpreting gate numbers.',
    ),
    reconciliation(
      'gate3-delegation',
      'Generic contingent Gate 3 delegation versus FK nondelegated human merge authority.',
      coordinator.ref,
      coordinator.ruleId,
      'resolved-for-fk',
      'Goal-charter scope withholds Gate 3 delegation for Foreman Kernel.',
      'Generic delegation text remains valid only outside the controlling FK scope.',
    ),
    reconciliation(
      'spec-linter-profile-behavior',
      'Live six-profile enum behavior versus stale deferred-registry explanation.',
      linter.ref,
      linter.ruleId,
      'resolved-for-fk',
      'Live schema behavior is recorded as binding and contradictory explanation as stale.',
      'FK-P0 does not edit the linter or convention prose.',
    ),
    reconciliation(
      'surfaces-allowed-files',
      'Routing metadata surfaces versus exact body-level Allowed Files authority.',
      convention.ref,
      convention.ruleId,
      'resolved-for-fk',
      'surfaces is routing metadata only; Allowed Files remains the mutation boundary.',
      'Mechanical body compilation remains a declared FK-P2 gap.',
    ),
    reconciliation(
      'permission-profile-enforcement-bound',
      'Loaded mediated profile denial versus unenrolled and residual shell capability.',
      profiles.ref,
      profiles.ruleId,
      'resolved-for-fk',
      'Mediated denial, post-review detection, and unsupported bypass cases are separate classifications.',
      'Missing enrollment must never be reported as a pre-action refusal.',
    ),
    reconciliation(
      'missing-provenance-reference',
      'Standing constraints name a provenance ledger absent at the source snapshot.',
      standing.ref,
      standing.ruleId,
      'open',
      'All thirteen inline rules remain mapped from the standing-constraints source.',
      'The standing rules cannot retire from agent reading until provenance is restored or amended.',
      'missing-path',
    ),
  ]
}

function buildRegistry(): AuthorityEnforcementRegistry {
  const built = SOURCE_DEFINITIONS.map(buildSource)
  const sources = built.map((entry) => entry.source)
  const rules = built.flatMap((entry) => entry.rules)
  const gateEvidence = firstRef(sources[0] as CanonSource)
  return {
    schemaVersion: '0.1.0',
    registryId: 'foreman-kernel-authority-enforcement',
    sourceSnapshotCommit: SNAPSHOT,
    sources,
    rules,
    operationAuthority: operationAuthority(gateEvidence),
    reconciliations: requiredReconciliations(sources, rules),
  }
}

const RULE_ORDER: readonly RuleClassification[] = [
  'pre-action-refusal',
  'post-action-detection',
  'ci-static-check',
  'independent-review-human-judgment',
  'narrative-provenance',
  'unsupported',
]

function buildMinimal(full: AuthorityEnforcementRegistry): AuthorityEnforcementRegistry {
  const selectedRules = RULE_ORDER.map((classification) =>
    full.rules.find((rule) => rule.classification === classification),
  )
  if (selectedRules.some((rule) => rule === undefined)) {
    throw new Error('full registry does not exercise every required classification')
  }
  const rules = selectedRules as AuthorityRule[]
  const selectedSources = rules.map((rule) => {
    const ref = rule.sourceRefs[0]
    if (ref === undefined) throw new Error(`rule '${rule.ruleId}' has no source`)
    const source = full.sources.find((candidate) => candidate.sourceId === ref.sourceId)
    const item = source?.inventoryItems.find((candidate) => candidate.itemId === ref.itemId)
    if (source === undefined || item === undefined)
      throw new Error(`rule '${rule.ruleId}' source is missing`)
    return { ...source, inventoryItems: [{ ...item, ruleIds: [rule.ruleId] }] }
  })
  const uniqueSources = [...new Set(selectedSources.map((source) => source.sourceId))].map(
    (sourceId) => {
      const candidates = selectedSources.filter((source) => source.sourceId === sourceId)
      const first = candidates[0]
      if (first === undefined) throw new Error(`minimal source '${sourceId}' is missing`)
      return {
        ...first,
        inventoryItems: candidates.flatMap((source) => source.inventoryItems),
      }
    },
  )
  const evidence = firstRef(uniqueSources[0] as CanonSource)
  const evidenceRule = rules.find((rule) => rule.sourceRefs[0]?.sourceId === evidence.sourceId)
  if (evidenceRule === undefined) throw new Error('minimal evidence rule missing')
  const reconciliations = [
    ['gate-namespace-count', 'Gate namespace'],
    ['gate3-delegation', 'Gate 3 delegation'],
    ['spec-linter-profile-behavior', 'Spec linter profile behavior'],
    ['surfaces-allowed-files', 'surfaces versus Allowed Files'],
    ['permission-profile-enforcement-bound', 'Permission profile boundary'],
    ['missing-provenance-reference', 'Missing provenance reference'],
  ].map(([id, topic], index) =>
    reconciliation(
      id as string,
      topic as string,
      evidence,
      evidenceRule.ruleId,
      index === 5 ? 'open' : 'resolved-for-fk',
      'Fixture disposition.',
      'Fixture consequence.',
      index === 5 ? 'missing-path' : 'source-ref',
    ),
  )
  return {
    ...full,
    sources: uniqueSources,
    rules,
    operationAuthority: operationAuthority(evidence),
    reconciliations,
  }
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
  const original = contradiction.rules[0] as AuthorityRule
  const conflictingBase: AuthorityRule = {
    ...structuredClone(original),
    ruleId: `${original.ruleId}.conflict`,
    decision: original.decision === 'REFUSE' ? 'ALLOW' : 'REFUSE',
  }
  const conflicting = { ...conflictingBase, bindingDigest: bindingDigestFor(conflictingBase) }
  ;(contradiction.rules as AuthorityRule[]).push(conflicting)
  const conflictingItem = contradiction.sources[0]?.inventoryItems[0]
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
