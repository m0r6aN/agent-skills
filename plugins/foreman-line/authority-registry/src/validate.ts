import { createHash } from 'node:crypto'
import { lstatSync, readFileSync, realpathSync } from 'node:fs'
import { isAbsolute, relative, resolve, sep } from 'node:path'
import { parse } from 'yaml'
import AjvModule, { type Ajv as AjvType } from '../node_modules/ajv/dist/ajv.js'
import { authorityEnforcementRegistrySchema } from './schemas.js'
import {
  AUTHORITY_TIERS,
  type AuthorityEnforcementRegistry,
  type AuthorityRule,
  type CanonSource,
  GOAL_SCOPES,
  HOST_POSTURES,
  OPERATION_SCOPES,
  PRINCIPAL_CLASSES,
  type RegistrySummary,
  type ResultCode,
  ROLE_SCOPES,
  RULE_CLASSIFICATIONS,
  type SourceLocator,
  STAGE_SCOPES,
  type ValidationResult,
  type ValidationViolation,
} from './types.js'

const Ajv = AjvModule as unknown as typeof AjvType
const ajv = new Ajv({ allErrors: true })
const validateStructure = ajv.compile(authorityEnforcementRegistrySchema)
const REQUIRED_RECONCILIATIONS = [
  'gate-namespace-count',
  'gate3-delegation',
  'spec-linter-profile-behavior',
  'surfaces-allowed-files',
  'permission-profile-enforcement-bound',
  'missing-provenance-reference',
] as const
const REQUIRED_REWORK_MIGRATION = 'registry-rework-6eb1c25'
const REQUIRED_OPERATIONS = [
  'gate1.ratify',
  'gate2.dispatch',
  'gate3.merge',
  'verification.issue',
  'closure.record',
  'receipt.mint-generic',
  'external.write',
] as const

const SOURCE_CONTRACTS: Readonly<
  Record<string, Pick<CanonSource, 'path' | 'sourceKind' | 'authorityTier' | 'authorityEffect'>>
> = {
  'fk-charter': {
    path: 'plugins/foreman-line/docs/goals/foreman-kernel/charter.md',
    sourceKind: 'goal-charter',
    authorityTier: 'goal-charter',
    authorityEffect: 'binding',
  },
  'fk-plan-review-findings': {
    path: 'plugins/foreman-line/docs/goals/foreman-kernel/plan-review-findings.md',
    sourceKind: 'foreman-contract',
    authorityTier: 'ratified-contract',
    authorityEffect: 'binding',
  },
  'fk-loop-directive': {
    path: 'plugins/foreman-line/docs/goals/foreman-kernel/loop-directive.md',
    sourceKind: 'goal-charter',
    authorityTier: 'goal-charter',
    authorityEffect: 'binding',
  },
  'spec-convention': {
    path: 'plugins/foreman-line/docs/SPEC-CONVENTION.md',
    sourceKind: 'foreman-contract',
    authorityTier: 'ratified-contract',
    authorityEffect: 'binding',
  },
  'coordinator-pattern': {
    path: 'plugins/foreman-line/docs/COORDINATOR-PATTERN.md',
    sourceKind: 'coordinator-pattern',
    authorityTier: 'coordinator-pattern',
    authorityEffect: 'corroborating',
  },
  'goal-skill': {
    path: 'plugins/foreman-line/skills/goal/SKILL.md',
    sourceKind: 'coordinator-pattern',
    authorityTier: 'coordinator-pattern',
    authorityEffect: 'corroborating',
  },
  'standing-constraints': {
    path: 'plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md',
    sourceKind: 'standing-constraint',
    authorityTier: 'standing-role',
    authorityEffect: 'binding',
  },
  'parcel-driven-development': {
    path: 'plugins/foreman-line/skills/parcel-driven-development/SKILL.md',
    sourceKind: 'standing-constraint',
    authorityTier: 'standing-role',
    authorityEffect: 'binding',
  },
  'foreman-line-plan': {
    path: 'plugins/foreman-line/docs/FOREMAN-LINE-PLAN.md',
    sourceKind: 'historical',
    authorityTier: 'ratified-contract',
    authorityEffect: 'historical',
  },
  'approval-readme': {
    path: 'plugins/foreman-line/approval/README.md',
    sourceKind: 'historical',
    authorityTier: 'ratified-contract',
    authorityEffect: 'historical',
  },
  'spec-frontmatter-schema': {
    path: 'plugins/foreman-line/spec-linter/schemas/spec-frontmatter.schema.json',
    sourceKind: 'live-implementation',
    authorityTier: 'ratified-contract',
    authorityEffect: 'binding',
  },
  'spec-linter-validator': {
    path: 'plugins/foreman-line/spec-linter/src/validate.ts',
    sourceKind: 'live-implementation',
    authorityTier: 'ratified-contract',
    authorityEffect: 'binding',
  },
  'spec-linter-cli': {
    path: 'plugins/foreman-line/spec-linter/src/cli.ts',
    sourceKind: 'live-implementation',
    authorityTier: 'ratified-contract',
    authorityEffect: 'binding',
  },
  'spec-linter-readme': {
    path: 'plugins/foreman-line/spec-linter/README.md',
    sourceKind: 'generated-advisory',
    authorityTier: 'generated-advisory',
    authorityEffect: 'stale-explanation',
  },
  'permission-profiles-readme': {
    path: 'plugins/foreman-line/permission-profiles/README.md',
    sourceKind: 'generated-advisory',
    authorityTier: 'generated-advisory',
    authorityEffect: 'stale-explanation',
  },
  'permission-profiles-registry': {
    path: 'plugins/foreman-line/permission-profiles/permission-profiles.yaml',
    sourceKind: 'foreman-contract',
    authorityTier: 'ratified-contract',
    authorityEffect: 'binding',
  },
  'permission-profiles-types': {
    path: 'plugins/foreman-line/permission-profiles/src/types.ts',
    sourceKind: 'live-implementation',
    authorityTier: 'ratified-contract',
    authorityEffect: 'binding',
  },
  'permission-profiles-validator': {
    path: 'plugins/foreman-line/permission-profiles/src/validator.ts',
    sourceKind: 'live-implementation',
    authorityTier: 'ratified-contract',
    authorityEffect: 'binding',
  },
}

const CLASSIFICATION_CONTRACT = {
  'pre-action-refusal': {
    decision: 'REFUSE',
    enforcementOwner: null,
    assurance: null,
  },
  'post-action-detection': {
    decision: 'ADVISORY',
    enforcementOwner: 'coordinator',
    assurance: 'detected',
  },
  'ci-static-check': { decision: 'ADVISORY', enforcementOwner: 'ci', assurance: 'detected' },
  'independent-review-human-judgment': {
    decision: 'REQUIRE_HUMAN',
    enforcementOwner: 'independent-reviewer',
    assurance: 'independently-verified',
  },
  'narrative-provenance': {
    decision: 'ADVISORY',
    enforcementOwner: 'provenance-only',
    assurance: 'narrative',
  },
  unsupported: { decision: 'ADVISORY', enforcementOwner: 'none', assurance: 'narrative' },
} as const

const RECONCILIATION_CONTRACT = {
  'gate-namespace-count': {
    topic: 'Historical two-gate and stage approval terms versus FK Gate 1, Gate 2, and Gate 3.',
    status: 'resolved-for-fk',
    refs: [
      'foreman-line-plan:item.two-gate-thesis',
      'approval-readme:item.a7e48d46fe37',
      'approval-readme:item.4261d18b3243',
      'approval-readme:item.ff6f38f088ae',
      'fk-charter:item.d9',
    ],
    rules: ['rule.fk-charter.d9'],
  },
  'gate3-delegation': {
    topic: 'Generic contingent Gate 3 delegation versus FK nondelegated human merge authority.',
    status: 'resolved-for-fk',
    refs: [
      'coordinator-pattern:item.f7686ab58db7',
      'spec-convention:item.022fc00afe7b',
      'fk-charter:item.d9',
    ],
    rules: ['rule.fk-charter.d9'],
  },
  'spec-linter-profile-behavior': {
    topic: 'Live six-profile enum behavior versus stale deferred-registry explanation.',
    status: 'resolved-for-fk',
    refs: [
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
      'spec-linter-readme:item.9a889881a236',
      'spec-linter-readme:item.b4f5d76d68ec',
      'spec-convention:item.e6f5fa8543a1',
    ],
    rules: [
      'rule.spec-frontmatter-schema.860f1c1146f4',
      'rule.spec-frontmatter-schema.1dddb8e0edae',
      'rule.spec-frontmatter-schema.fbc219d0ff13',
      'rule.spec-frontmatter-schema.cc7db94c11c2',
      'rule.spec-frontmatter-schema.7443d95fc46b',
      'rule.spec-frontmatter-schema.0a36842682ef',
      'rule.spec-frontmatter-schema.d6246c2593db',
      'rule.spec-linter-validator.092d2fc43a32',
      'rule.spec-linter-validator.fb7d76a32df4',
      'rule.spec-linter-validator.80563af1788e',
    ],
  },
  'surfaces-allowed-files': {
    topic: 'Routing metadata surfaces versus exact body-level Allowed Files authority.',
    status: 'resolved-for-fk',
    refs: [
      'spec-convention:item.ac5ff7afd06f',
      'spec-convention:item.5145ab15549c',
      'spec-convention:item.fd82127bf9f9',
      'spec-linter-validator:item.80563af1788e',
      'fk-charter:item.d10',
    ],
    rules: [
      'rule.spec-convention.5145ab15549c',
      'rule.spec-convention.fd82127bf9f9',
      'rule.fk-charter.d10',
    ],
  },
  'permission-profile-enforcement-bound': {
    topic: 'Loaded mediated profile denial versus unenrolled and residual shell capability.',
    status: 'resolved-for-fk',
    refs: [
      'permission-profiles-registry:item.0f7efe94f551',
      'permission-profiles-registry:item.5b5fd0863539',
      'permission-profiles-registry:item.ffd2209ab94a',
      'permission-profiles-registry:item.86618990c615',
      'permission-profiles-registry:item.514a38aa8311',
      'permission-profiles-registry:item.a61f76b791df',
      'permission-profiles-registry:item.ff2ab3fa7a40',
      'permission-profiles-types:item.0b9706b5a9bf',
      'permission-profiles-types:item.bc257b03aa99',
      'permission-profiles-validator:item.dcd8638af4a4',
      'permission-profiles-validator:item.9c3c17055384',
      'permission-profiles-validator:item.4da758cc157c',
      'permission-profiles-validator:item.ffd598413a66',
      'permission-profiles-readme:item.729be3615f8d',
      'permission-profiles-readme:item.d11b9d38f924',
      'permission-profiles-readme:item.1101805f1c9e',
      'permission-profiles-readme:item.415efa3f5e3b',
      'fk-charter:item.d9',
    ],
    rules: [
      'rule.permission-profiles-validator.dcd8638af4a4',
      'rule.permission-profiles-validator.9c3c17055384',
      'rule.permission-profiles-validator.4da758cc157c',
      'rule.permission-profiles-validator.ffd598413a66',
      'rule.fk-charter.d9',
    ],
  },
  'missing-provenance-reference': {
    topic: 'Standing constraints name a provenance ledger absent at the source snapshot.',
    status: 'open',
    refs: Array.from(
      { length: 13 },
      (_, index) => `standing-constraints:item.constraint-${index + 1}`,
    ),
    rules: Array.from(
      { length: 13 },
      (_, index) => `rule.standing-constraints.constraint-${index + 1}`,
    ),
  },
  'registry-rework-6eb1c25': {
    topic: 'Prior committed registry bindings superseded by the coordinator-ratified FK-P0 rework.',
    status: 'superseded-by-amendment',
    refs: ['fk-charter:item.d10'],
    rules: ['rule.fk-charter.d10'],
  },
} as const

const SHIPPED_BINDING_MANIFEST_DIGEST =
  '75bdf0dd34ea853ff5861a9500c56e967d18082f15f2ba2591899e3e98b62ddf'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function normalizeRuleText(value: string): string {
  return value
    .normalize('NFC')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join(' ')
    .replace(/\s+/gu, ' ')
}

function canonicalize(value: unknown): unknown {
  if (typeof value === 'string') return value.normalize('NFC')
  if (Array.isArray(value)) return value.map(canonicalize)
  if (!isRecord(value)) return value
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, canonicalize(value[key])]),
  )
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

export function sha256(value: string | Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}

export function locatorDigestFor(locator: SourceLocator): string {
  return sha256(canonicalJson({ kind: locator.kind, anchor: locator.anchor }))
}

export function bindingDigestFor(
  rule: Pick<AuthorityRule, 'ruleId' | 'sourceRefs' | 'normalizedStatement'>,
): string {
  return sha256(
    canonicalJson({
      ruleId: rule.ruleId,
      sourceRefs: rule.sourceRefs,
      normalizedStatement: rule.normalizedStatement,
    }),
  )
}

export function registryBindingManifestDigest(document: AuthorityEnforcementRegistry): string {
  return sha256(
    canonicalJson({
      sourceSnapshotCommit: document.sourceSnapshotCommit,
      sources: document.sources.map((source) => ({
        sourceId: source.sourceId,
        path: source.path,
        sourceKind: source.sourceKind,
        authorityTier: source.authorityTier,
        authorityEffect: source.authorityEffect,
        scope: source.scope,
        inventoryItems: source.inventoryItems.map((item) => ({
          itemId: item.itemId,
          locatorDigest: locatorDigestFor(item.locator),
          valueDigest: item.valueDigest,
          ruleIds: item.ruleIds,
          exclusionDisposition: item.exclusionDisposition,
        })),
      })),
      rules: document.rules.map((rule) => ({
        ruleId: rule.ruleId,
        sourceRefs: rule.sourceRefs,
        normalizedStatement: rule.normalizedStatement,
        bindingDigest: rule.bindingDigest,
      })),
    }),
  )
}

function violation(
  code: ResultCode,
  message: string,
  detail: Omit<ValidationViolation, 'code' | 'message'> = {},
): ValidationViolation {
  return { code, message, ...detail }
}

function ordered(violations: readonly ValidationViolation[]): ValidationViolation[] {
  return [...violations].sort((left, right) => {
    const fields: (keyof ValidationViolation)[] = ['sourcePath', 'locator', 'ruleId', 'code']
    for (const field of fields) {
      const comparison = String(left[field] ?? '\uffff').localeCompare(
        String(right[field] ?? '\uffff'),
      )
      if (comparison !== 0) return comparison
    }
    return left.message.localeCompare(right.message)
  })
}

function summaryFor(
  document: AuthorityEnforcementRegistry,
  violations: readonly ValidationViolation[],
): RegistrySummary {
  const classificationCounts = Object.fromEntries(
    RULE_CLASSIFICATIONS.map((classification) => [classification, 0]),
  ) as Record<(typeof RULE_CLASSIFICATIONS)[number], number>
  for (const rule of document.rules) classificationCounts[rule.classification] += 1
  return {
    sourceSnapshot: document.sourceSnapshotCommit,
    sourceCount: document.sources.length,
    itemCount: document.sources.reduce((count, source) => count + source.inventoryItems.length, 0),
    ruleCount: document.rules.length,
    classificationCounts,
    reconciliationStatuses: Object.fromEntries(
      document.reconciliations.map((record) => [record.reconciliationId, record.migrationStatus]),
    ),
    unresolvedActiveConflicts: violations.filter((item) => item.code === 'RULE_CONFLICT').length,
  }
}

function referenceKey(sourceId: string, itemId: string): string {
  return `${sourceId}\u0000${itemId}`
}

function arraysOverlap(left: readonly string[], right: readonly string[]): boolean {
  return (
    left.includes('any') || right.includes('any') || left.some((value) => right.includes(value))
  )
}

function goalScopesOverlap(left: readonly string[], right: readonly string[]): boolean {
  return (
    arraysOverlap(left, right) ||
    (left.includes('foreman-kernel') && right.includes('all-foreman-goals')) ||
    (right.includes('foreman-kernel') && left.includes('all-foreman-goals'))
  )
}

function activeAuthorityTier(
  rule: AuthorityRule,
  sourcesById: ReadonlyMap<string, CanonSource>,
): number | null {
  if (
    rule.retirementState === 'retired-from-agent-reading' ||
    rule.retirementState === 'historical-only'
  ) {
    return null
  }
  const activeTiers = rule.sourceRefs
    .map((reference) => sourcesById.get(reference.sourceId))
    .filter(
      (source): source is CanonSource =>
        source !== undefined &&
        (source.authorityEffect === 'binding' || source.authorityEffect === 'corroborating'),
    )
    .map((source) => AUTHORITY_TIERS.indexOf(source.authorityTier))
    .filter((index) => index >= 0)
  return activeTiers.length === 0 ? null : Math.min(...activeTiers)
}

function followsEnumOrder(values: readonly string[], order: readonly string[]): boolean {
  let prior = -1
  for (const value of values) {
    const index = order.indexOf(value)
    if (index < prior) return false
    prior = index
  }
  return true
}

function checkOperationAuthority(document: AuthorityEnforcementRegistry): ValidationViolation[] {
  const violations: ValidationViolation[] = []
  const rows = new Map(document.operationAuthority.map((row) => [row.operationId, row]))
  for (const operationId of REQUIRED_OPERATIONS) {
    if (!rows.has(operationId)) {
      violations.push(
        violation('AUTHORITY_ESCALATION', `required operation row '${operationId}' is missing`),
      )
    }
  }
  if (rows.size !== document.operationAuthority.length) {
    violations.push(
      violation('AUTHORITY_ESCALATION', 'operationAuthority contains a duplicate operation row'),
    )
  }
  if (
    document.operationAuthority.map((row) => row.operationId).join('|') !==
    REQUIRED_OPERATIONS.join('|')
  ) {
    violations.push(
      violation('MIGRATION_EVIDENCE_INVALID', 'operationAuthority rows must use schema-enum order'),
    )
  }

  const protectedRows = [
    'gate1.ratify',
    'gate3.merge',
    'verification.issue',
    'closure.record',
    'receipt.mint-generic',
    'external.write',
  ] as const
  for (const operationId of protectedRows) {
    const row = rows.get(operationId)
    if (
      row !== undefined &&
      (row.agentCallable || row.operationalStateMaySatisfy || row.toolMayIssueAuthorityEvidence)
    ) {
      violations.push(
        violation(
          'AUTHORITY_ESCALATION',
          `${operationId} cannot be agent-callable, operational-state satisfiable, or tool-issued`,
        ),
      )
    }
  }

  const gate1 = rows.get('gate1.ratify')
  if (
    gate1 !== undefined &&
    (gate1.allowedPrincipals.length !== 1 ||
      gate1.allowedPrincipals[0] !== 'human-developer' ||
      gate1.missingEvidenceDecision !== 'REQUIRE_HUMAN' ||
      gate1.requiredGitEvidence.length === 0)
  ) {
    violations.push(violation('AUTHORITY_ESCALATION', 'Gate 1 must remain human-developer only'))
  }
  const gate2 = rows.get('gate2.dispatch')
  if (
    gate2 !== undefined &&
    (gate2.allowedPrincipals.join('|') !== 'coordinator|builder' ||
      gate2.missingEvidenceDecision !== 'REFUSE' ||
      !gate2.agentCallable ||
      gate2.operationalStateMaySatisfy ||
      gate2.toolMayIssueAuthorityEvidence ||
      gate2.requiredGitEvidence.length === 0)
  ) {
    violations.push(
      violation(
        'AUTHORITY_ESCALATION',
        'Gate 2 requires pre-existing Git evidence and cannot be state- or tool-minted',
      ),
    )
  }
  const gate3 = rows.get('gate3.merge')
  if (
    gate3 !== undefined &&
    (gate3.allowedPrincipals.length !== 1 ||
      gate3.allowedPrincipals[0] !== 'human-developer' ||
      gate3.missingEvidenceDecision !== 'REQUIRE_HUMAN' ||
      gate3.requiredGitEvidence.length === 0)
  ) {
    violations.push(
      violation('AUTHORITY_ESCALATION', 'FK Gate 3 must remain nondelegated and human-owned'),
    )
  }
  const verification = rows.get('verification.issue')
  if (
    verification !== undefined &&
    (verification.allowedPrincipals.length !== 1 ||
      verification.allowedPrincipals[0] !== 'independent-reviewer' ||
      verification.missingEvidenceDecision !== 'REFUSE' ||
      verification.requiredGitEvidence.length === 0)
  ) {
    violations.push(
      violation(
        'AUTHORITY_ESCALATION',
        'verification evidence requires a mechanically distinct independent reviewer',
      ),
    )
  }
  const closure = rows.get('closure.record')
  if (
    closure !== undefined &&
    (closure.allowedPrincipals.join('|') !== 'human-developer' ||
      closure.missingEvidenceDecision !== 'REFUSE' ||
      closure.requiredGitEvidence.length === 0)
  ) {
    violations.push(
      violation('AUTHORITY_ESCALATION', 'closure requires human-owned merge evidence'),
    )
  }
  for (const operationId of ['receipt.mint-generic', 'external.write'] as const) {
    const row = rows.get(operationId)
    if (
      row !== undefined &&
      (row.allowedPrincipals.length !== 0 ||
        row.requiredGitEvidence.length !== 0 ||
        row.missingEvidenceDecision !== 'REFUSE')
    ) {
      violations.push(
        violation(
          'AUTHORITY_ESCALATION',
          `${operationId} is unavailable and must admit no principal or authority evidence`,
        ),
      )
    }
  }
  return violations
}

function semanticViolations(document: AuthorityEnforcementRegistry): ValidationViolation[] {
  const violations: ValidationViolation[] = []
  const sourcesById = new Map<string, CanonSource>()
  const itemsByRef = new Map<string, CanonSource['inventoryItems'][number]>()
  const normalizedPaths = new Set<string>()

  for (const source of document.sources) {
    if (sourcesById.has(source.sourceId)) {
      violations.push(
        violation('SOURCE_DUPLICATE_PATH', `duplicate sourceId '${source.sourceId}'`, {
          sourcePath: source.path,
        }),
      )
    }
    sourcesById.set(source.sourceId, source)
    const sourceContract = SOURCE_CONTRACTS[source.sourceId]
    if (
      sourceContract !== undefined &&
      (source.path !== sourceContract.path ||
        source.sourceKind !== sourceContract.sourceKind ||
        source.authorityTier !== sourceContract.authorityTier ||
        source.authorityEffect !== sourceContract.authorityEffect)
    ) {
      violations.push(
        violation(
          'AUTHORITY_ESCALATION',
          `source '${source.sourceId}' authority contract changed`,
          {
            sourcePath: source.path,
          },
        ),
      )
    }
    if (!followsEnumOrder(source.scope, GOAL_SCOPES)) {
      violations.push(
        violation('MIGRATION_EVIDENCE_INVALID', 'source scope set is not in schema-enum order', {
          sourcePath: source.path,
        }),
      )
    }
    if (source.snapshotEvidence.commit !== document.sourceSnapshotCommit) {
      violations.push(
        violation(
          'MIGRATION_EVIDENCE_INVALID',
          'source snapshot commit does not match registry snapshot',
          {
            sourcePath: source.path,
          },
        ),
      )
    }
    const normalizedPath = source.path.replace(/\\/g, '/').toLowerCase()
    if (normalizedPaths.has(normalizedPath)) {
      violations.push(
        violation('SOURCE_DUPLICATE_PATH', `duplicate normalized source path '${source.path}'`, {
          sourcePath: source.path,
        }),
      )
    }
    normalizedPaths.add(normalizedPath)
    const itemIds = new Set<string>()
    const locators = new Set<string>()
    for (const item of source.inventoryItems) {
      const locatorKey = canonicalJson({ kind: item.locator.kind, anchor: item.locator.anchor })
      if (itemIds.has(item.itemId)) {
        violations.push(
          violation('LOCATOR_DUPLICATE', `duplicate itemId '${item.itemId}'`, {
            sourcePath: source.path,
            locator: item.locator.anchor,
          }),
        )
      }
      if (locators.has(locatorKey)) {
        violations.push(
          violation('LOCATOR_DUPLICATE', `duplicate locator '${item.locator.anchor}'`, {
            sourcePath: source.path,
            locator: item.locator.anchor,
          }),
        )
      }
      itemIds.add(item.itemId)
      locators.add(locatorKey)
      itemsByRef.set(referenceKey(source.sourceId, item.itemId), item)
      if ((item.ruleIds.length === 0) === (item.exclusionDisposition === null)) {
        violations.push(
          violation(
            'SOURCE_ITEM_UNCOVERED',
            'inventory item must map rules or carry one exclusion disposition',
            {
              sourcePath: source.path,
              locator: item.locator.anchor,
            },
          ),
        )
      }
      if (sha256(normalizeRuleText(item.normalizedExcerpt)) !== item.valueDigest) {
        violations.push(
          violation(
            'VALUE_DIGEST_MISMATCH',
            'inventory normalizedExcerpt does not match valueDigest',
            {
              sourcePath: source.path,
              locator: item.locator.anchor,
            },
          ),
        )
      }
    }
  }

  const rulesById = new Map<string, AuthorityRule>()
  for (const rule of document.rules) {
    const applicabilitySets: readonly [readonly string[], readonly string[], string][] = [
      [rule.applicability.goals, GOAL_SCOPES, 'goals'],
      [rule.applicability.roles, ROLE_SCOPES, 'roles'],
      [rule.applicability.stages, STAGE_SCOPES, 'stages'],
      [rule.applicability.operations, OPERATION_SCOPES, 'operations'],
      [rule.applicability.hosts, HOST_POSTURES, 'hosts'],
    ]
    for (const [values, order, name] of applicabilitySets) {
      if (!followsEnumOrder(values, order)) {
        violations.push(
          violation(
            'MIGRATION_EVIDENCE_INVALID',
            `rule applicability ${name} set is not in schema-enum order`,
            {
              ruleId: rule.ruleId,
            },
          ),
        )
      }
    }
    if (rulesById.has(rule.ruleId)) {
      violations.push(
        violation('RULE_DUPLICATE', `duplicate ruleId '${rule.ruleId}'`, { ruleId: rule.ruleId }),
      )
    }
    rulesById.set(rule.ruleId, rule)
  }

  for (const source of document.sources) {
    for (const item of source.inventoryItems) {
      for (const ruleId of item.ruleIds) {
        if (!rulesById.has(ruleId)) {
          violations.push(
            violation('RULE_ORPHANED', `inventory item maps missing rule '${ruleId}'`, {
              sourcePath: source.path,
              locator: item.locator.anchor,
              ruleId,
            }),
          )
        }
      }
    }
  }

  for (const rule of document.rules) {
    if (bindingDigestFor(rule) !== rule.bindingDigest) {
      violations.push(
        violation('MIGRATION_EVIDENCE_INVALID', 'rule bindingDigest is stale', {
          ruleId: rule.ruleId,
        }),
      )
    }
    const classificationContract = CLASSIFICATION_CONTRACT[rule.classification]
    const isLoadedProfileRefusal = rule.sourceRefs.some(
      (reference) => reference.sourceId === 'permission-profiles-validator',
    )
    const validPreActionShape =
      rule.classification !== 'pre-action-refusal' ||
      (isLoadedProfileRefusal
        ? rule.enforcementOwner === 'host-adapter' && rule.assurance === 'mediated'
        : rule.enforcementOwner === 'kernel-policy' && rule.assurance === 'structural')
    if (
      rule.decision !== classificationContract.decision ||
      !validPreActionShape ||
      (classificationContract.enforcementOwner !== null &&
        rule.enforcementOwner !== classificationContract.enforcementOwner) ||
      (classificationContract.assurance !== null &&
        rule.assurance !== classificationContract.assurance)
    ) {
      violations.push(
        violation(
          'AUTHORITY_ESCALATION',
          `rule '${rule.ruleId}' violates the ${rule.classification} decision/owner/assurance contract`,
          { ruleId: rule.ruleId },
        ),
      )
    }
    if (rule.classification === 'pre-action-refusal' && rule.refusalCode === null) {
      violations.push(
        violation('MIGRATION_EVIDENCE_INVALID', 'pre-action-refusal requires refusalCode', {
          ruleId: rule.ruleId,
        }),
      )
    }
    if (rule.classification !== 'pre-action-refusal' && rule.refusalCode !== null) {
      violations.push(
        violation('MIGRATION_EVIDENCE_INVALID', 'only pre-action-refusal may carry refusalCode', {
          ruleId: rule.ruleId,
        }),
      )
    }
    for (const sourceRef of rule.sourceRefs) {
      const source = sourcesById.get(sourceRef.sourceId)
      const item = itemsByRef.get(referenceKey(sourceRef.sourceId, sourceRef.itemId))
      if (source === undefined || item === undefined) {
        violations.push(
          violation('RULE_SOURCE_MISSING', 'rule source reference does not resolve', {
            sourcePath: source?.path,
            ruleId: rule.ruleId,
          }),
        )
        continue
      }
      if (locatorDigestFor(item.locator) !== sourceRef.locatorDigest) {
        violations.push(
          violation(
            'LOCATOR_DIGEST_MISMATCH',
            'rule source locator digest does not match inventory',
            {
              sourcePath: source.path,
              locator: item.locator.anchor,
              ruleId: rule.ruleId,
            },
          ),
        )
      }
      if (item.valueDigest !== sourceRef.valueDigest) {
        violations.push(
          violation('VALUE_DIGEST_MISMATCH', 'rule source value digest does not match inventory', {
            sourcePath: source.path,
            locator: item.locator.anchor,
            ruleId: rule.ruleId,
          }),
        )
      }
      if (
        locatorDigestFor(item.locator) === sourceRef.locatorDigest &&
        item.valueDigest === sourceRef.valueDigest
      ) {
        const expectedRuleId = `rule.${sourceRef.sourceId}.${item.itemId.replace(/^item\./, '')}`
        if (rule.sourceRefs.length === 1 && rule.ruleId !== expectedRuleId) {
          violations.push(
            violation(
              'MIGRATION_EVIDENCE_INVALID',
              `rule identity '${rule.ruleId}' does not bind inventory identity '${item.itemId}'`,
              { sourcePath: source.path, locator: item.locator.anchor, ruleId: rule.ruleId },
            ),
          )
        }
        if (
          normalizeRuleText(rule.normalizedStatement) !== normalizeRuleText(item.normalizedExcerpt)
        ) {
          violations.push(
            violation(
              'MIGRATION_EVIDENCE_INVALID',
              'rule normalizedStatement does not bind its referenced normalized excerpt',
              { sourcePath: source.path, locator: item.locator.anchor, ruleId: rule.ruleId },
            ),
          )
        }
      }
      if (!item.ruleIds.includes(rule.ruleId)) {
        violations.push(
          violation(
            'RULE_ORPHANED',
            'rule source reference is not reciprocally mapped by inventory',
            {
              sourcePath: source.path,
              locator: item.locator.anchor,
              ruleId: rule.ruleId,
            },
          ),
        )
      }
    }
    for (const pairedRuleId of rule.pairedRuleIds) {
      if (!rulesById.has(pairedRuleId)) {
        violations.push(
          violation('RULE_ORPHANED', `paired/backstop rule '${pairedRuleId}' does not exist`, {
            ruleId: rule.ruleId,
          }),
        )
      }
    }
    const evidence = rule.retirementEvidence
    const evidenceValues = [
      evidence.predicate,
      evidence.negativeRefusalTest,
      evidence.corpusSweep,
      evidence.independentBypassAttempt,
    ]
    const retired = rule.retirementState === 'retired-from-agent-reading'
    const complete =
      evidence.predicate?.kind === 'predicate-contract' &&
      evidence.negativeRefusalTest?.kind === 'negative-test' &&
      evidence.corpusSweep?.kind === 'corpus-sweep' &&
      evidence.independentBypassAttempt?.kind === 'independent-bypass'
    if ((retired && !complete) || (!retired && evidenceValues.some((item) => item !== null))) {
      violations.push(
        violation(
          'RETIREMENT_EVIDENCE_INCOMPLETE',
          'retirement evidence must be all-four iff retired',
          {
            ruleId: rule.ruleId,
          },
        ),
      )
    }
    if (
      retired &&
      rule.sourceRefs.some((sourceRef) => sourceRef.sourceId === 'standing-constraints')
    ) {
      violations.push(
        violation(
          'RETIREMENT_EVIDENCE_INCOMPLETE',
          'standing constraints cannot retire while missing-provenance-reference remains open',
          { ruleId: rule.ruleId },
        ),
      )
    }
  }

  const rules = [...rulesById.values()]
  for (let leftIndex = 0; leftIndex < rules.length; leftIndex += 1) {
    const left = rules[leftIndex]
    if (left === undefined) continue
    for (let rightIndex = leftIndex + 1; rightIndex < rules.length; rightIndex += 1) {
      const right = rules[rightIndex]
      const leftTier = activeAuthorityTier(left, sourcesById)
      const rightTier = right === undefined ? null : activeAuthorityTier(right, sourcesById)
      if (
        right !== undefined &&
        leftTier !== null &&
        rightTier !== null &&
        leftTier === rightTier &&
        left.normalizedStatement === right.normalizedStatement &&
        left.decision !== right.decision &&
        goalScopesOverlap(left.applicability.goals, right.applicability.goals) &&
        arraysOverlap(left.applicability.roles, right.applicability.roles) &&
        arraysOverlap(left.applicability.stages, right.applicability.stages) &&
        arraysOverlap(left.applicability.operations, right.applicability.operations) &&
        arraysOverlap(left.applicability.hosts, right.applicability.hosts)
      ) {
        violations.push(
          violation('RULE_CONFLICT', `rules '${left.ruleId}' and '${right.ruleId}' contradict`, {
            ruleId: left.ruleId,
          }),
        )
      }
    }
  }

  const reconciliationIds = new Set<string>()
  for (const reconciliationId of REQUIRED_RECONCILIATIONS) {
    if (!document.reconciliations.some((record) => record.reconciliationId === reconciliationId)) {
      violations.push(
        violation(
          'RECONCILIATION_MISSING',
          `required reconciliation '${reconciliationId}' is missing`,
        ),
      )
    }
  }
  if (
    document.sources.length === Object.keys(SOURCE_CONTRACTS).length &&
    !document.reconciliations.some(
      (record) => record.reconciliationId === REQUIRED_REWORK_MIGRATION,
    )
  ) {
    violations.push(
      violation(
        'RECONCILIATION_MISSING',
        `required rework migration '${REQUIRED_REWORK_MIGRATION}' is missing`,
      ),
    )
  }
  for (const record of document.reconciliations) {
    if (reconciliationIds.has(record.reconciliationId)) {
      violations.push(
        violation(
          'MIGRATION_EVIDENCE_INVALID',
          `duplicate reconciliationId '${record.reconciliationId}'`,
        ),
      )
    }
    reconciliationIds.add(record.reconciliationId)
    const contract =
      RECONCILIATION_CONTRACT[record.reconciliationId as keyof typeof RECONCILIATION_CONTRACT]
    if (
      contract !== undefined &&
      (record.topic !== contract.topic ||
        record.migrationStatus !== contract.status ||
        (document.sources.length === Object.keys(SOURCE_CONTRACTS).length &&
          (record.observedRefs
            .map((reference) => `${reference.sourceId}:${reference.itemId}`)
            .join('|') !== contract.refs.join('|') ||
            record.authoritativeRuleIds.join('|') !== contract.rules.join('|'))))
    ) {
      violations.push(
        violation(
          'MIGRATION_EVIDENCE_INVALID',
          `reconciliation '${record.reconciliationId}' topic/status contract changed`,
        ),
      )
    }
    if (
      (record.migrationStatus === 'superseded-by-amendment') !==
      (record.supersedingEvidence !== null)
    ) {
      violations.push(
        violation(
          'MIGRATION_EVIDENCE_INVALID',
          'supersedingEvidence must exist iff superseded-by-amendment',
        ),
      )
    }
    if (record.supersedingEvidence !== null) {
      const item = itemsByRef.get(
        referenceKey(record.supersedingEvidence.sourceId, record.supersedingEvidence.itemId),
      )
      if (
        item === undefined ||
        locatorDigestFor(item.locator) !== record.supersedingEvidence.locatorDigest ||
        item.valueDigest !== record.supersedingEvidence.valueDigest ||
        !record.observedEvidence.some((evidence) => evidence.kind === 'git-commit')
      ) {
        violations.push(
          violation(
            'MIGRATION_EVIDENCE_INVALID',
            `migration '${record.reconciliationId}' lacks complete prior-to-new evidence`,
          ),
        )
      }
    }
    if (
      document.sources.length === Object.keys(SOURCE_CONTRACTS).length &&
      record.reconciliationId === REQUIRED_REWORK_MIGRATION
    ) {
      const expected = [
        `git-commit:4666ea15caee8b231137f23325d14ea4526e338a`,
        `git-commit:${document.sourceSnapshotCommit}`,
        'command-result:registry-binding-manifest:1fe3a7c66241904445021c97db68065961a3bf5beceb654faff4b552b4de79b2',
        `command-result:superseding-binding-manifest:${SHIPPED_BINDING_MANIFEST_DIGEST}`,
      ]
      const actual = record.observedEvidence.map(
        (evidence) => `${evidence.kind}:${evidence.reference}`,
      )
      if (actual.join('|') !== expected.join('|')) {
        violations.push(
          violation(
            'MIGRATION_EVIDENCE_INVALID',
            'rework migration does not bind the prior registry commit, source snapshot, and superseding manifest',
          ),
        )
      }
    }
    for (const ruleId of record.authoritativeRuleIds) {
      if (!rulesById.has(ruleId)) {
        violations.push(
          violation(
            'MIGRATION_EVIDENCE_INVALID',
            `reconciliation references missing rule '${ruleId}'`,
            {
              ruleId,
            },
          ),
        )
      }
    }
    for (const sourceRef of record.observedRefs) {
      const item = itemsByRef.get(referenceKey(sourceRef.sourceId, sourceRef.itemId))
      if (
        item === undefined ||
        locatorDigestFor(item.locator) !== sourceRef.locatorDigest ||
        item.valueDigest !== sourceRef.valueDigest
      ) {
        violations.push(
          violation(
            'MIGRATION_EVIDENCE_INVALID',
            'reconciliation observedRef does not fully resolve identity, locator, and value',
          ),
        )
      }
    }
    for (const evidence of record.observedEvidence) {
      let expectedDigest: string | null = null
      if (evidence.kind === 'source-ref') {
        const ref = record.observedRefs.find(
          (candidate) => `${candidate.sourceId}:${candidate.itemId}` === evidence.reference,
        )
        if (ref !== undefined) expectedDigest = sha256(canonicalJson(ref))
      } else if (evidence.kind === 'missing-path') {
        expectedDigest = sha256(
          canonicalJson({
            path: evidence.reference,
            sourceSnapshotCommit: document.sourceSnapshotCommit,
          }),
        )
      } else {
        expectedDigest = sha256(evidence.reference)
      }
      if (expectedDigest === null || evidence.digest !== expectedDigest) {
        violations.push(
          violation(
            'MIGRATION_EVIDENCE_INVALID',
            `reconciliation '${record.reconciliationId}' evidence digest is not bound`,
          ),
        )
      }
    }
  }
  for (const operation of document.operationAuthority) {
    if (!followsEnumOrder(operation.allowedPrincipals, PRINCIPAL_CLASSES)) {
      violations.push(
        violation(
          'MIGRATION_EVIDENCE_INVALID',
          `${operation.operationId} allowedPrincipals is not in schema-enum order`,
        ),
      )
    }
    for (const sourceRef of operation.requiredGitEvidence) {
      const item = itemsByRef.get(referenceKey(sourceRef.sourceId, sourceRef.itemId))
      if (
        item === undefined ||
        locatorDigestFor(item.locator) !== sourceRef.locatorDigest ||
        item.valueDigest !== sourceRef.valueDigest
      ) {
        violations.push(
          violation(
            'AUTHORITY_ESCALATION',
            `${operation.operationId} Git evidence does not fully resolve`,
          ),
        )
      }
    }
    if (document.sources.length === Object.keys(SOURCE_CONTRACTS).length) {
      const expectedEvidence: Readonly<Record<string, readonly string[]>> = {
        'gate1.ratify': ['fk-charter:item.d9'],
        'gate2.dispatch': ['fk-charter:item.d9'],
        'gate3.merge': ['fk-charter:item.d9'],
        'verification.issue': ['fk-charter:item.d11'],
        'closure.record': ['fk-charter:item.d9', 'fk-charter:item.d11'],
        'receipt.mint-generic': [],
        'external.write': [],
      }
      const actual = operation.requiredGitEvidence.map(
        (reference) => `${reference.sourceId}:${reference.itemId}`,
      )
      if (actual.join('|') !== expectedEvidence[operation.operationId]?.join('|')) {
        violations.push(
          violation(
            'AUTHORITY_ESCALATION',
            `${operation.operationId} requiredGitEvidence changed from the protected contract`,
          ),
        )
      }
    }
  }
  if (
    document.sources.length === Object.keys(SOURCE_CONTRACTS).length &&
    registryBindingManifestDigest(document) !== SHIPPED_BINDING_MANIFEST_DIGEST
  ) {
    violations.push(
      violation(
        'MIGRATION_EVIDENCE_INVALID',
        'registry identity, locator, value, rule, or source binding differs from the shipped manifest',
      ),
    )
  }
  violations.push(...checkOperationAuthority(document))
  return violations
}

export function validateRegistry(document: unknown): ValidationResult {
  const violations: ValidationViolation[] = []
  if (!validateStructure(document)) {
    for (const error of validateStructure.errors ?? []) {
      violations.push(
        violation(
          'SCHEMA_INVALID',
          `${error.instancePath.length > 0 ? error.instancePath : '(root)'} ${error.message ?? 'is invalid'}`,
          { locator: error.instancePath },
        ),
      )
    }
  }
  if (!validateStructure(document)) {
    const sorted = ordered(violations)
    return { valid: false, violations: sorted, summary: null }
  }
  const registry = document as AuthorityEnforcementRegistry
  violations.push(...semanticViolations(registry))
  const sorted = ordered(violations)
  return { valid: sorted.length === 0, violations: sorted, summary: summaryFor(registry, sorted) }
}

export function parseRegistry(content: string): ValidationResult {
  try {
    return validateRegistry(parse(content) as unknown)
  } catch (error) {
    return {
      valid: false,
      violations: [
        violation('PARSE_ERROR', `registry YAML cannot be parsed: ${(error as Error).message}`),
      ],
      summary: null,
    }
  }
}

function extractLocator(content: string, locator: SourceLocator): { count: number; value: string } {
  const lines = content.replace(/\r\n?/g, '\n').split('\n')
  if (locator.kind === 'table-row') {
    const matches = lines.filter((line) => {
      const cells = line
        .trim()
        .split('|')
        .slice(1, -1)
        .map((cell) => cell.trim())
      return cells[0] === locator.anchor
    })
    return { count: matches.length, value: matches.length === 1 ? (matches[0] ?? '') : '' }
  }
  if (locator.kind === 'line-excerpt') {
    const expected = locator.anchor.trim()
    const matches = lines.filter((line) => {
      const trimmed = line.trim()
      return trimmed === expected && !trimmed.startsWith('//') && !trimmed.startsWith('/*')
    })
    return { count: matches.length, value: matches.length === 1 ? (matches[0] ?? '') : '' }
  }
  if (locator.kind === 'heading') {
    const stack: { level: number; heading: string }[] = []
    const matches: { index: number; level: number }[] = []
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index] ?? ''
      const heading = /^(#{1,6})\s+.+/.exec(line)
      if (heading === null) continue
      const level = heading[1]?.length ?? 6
      while ((stack.at(-1)?.level ?? 0) >= level) stack.pop()
      stack.push({ level, heading: line.trim() })
      if (stack.map((item) => item.heading).join(' > ') === locator.anchor) {
        matches.push({ index, level })
      }
    }
    if (matches.length !== 1) return { count: matches.length, value: '' }
    const start = matches[0]?.index ?? 0
    return { count: 1, value: lines[start] ?? '' }
  }
  if (locator.kind === 'numbered-item') {
    const stack: { level: number; heading: string }[] = []
    const matches: { index: number; indent: number }[] = []
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
      const anchor = [...stack.map((item) => item.heading), line.trim()].join(' > ')
      if (anchor === locator.anchor) {
        matches.push({ index, indent: numbered[1]?.length ?? 0 })
      }
    }
    if (matches.length !== 1) return { count: matches.length, value: '' }
    const match = matches[0]
    if (match === undefined) return { count: 0, value: '' }
    let end = lines.length
    for (let index = match.index + 1; index < lines.length; index += 1) {
      const line = lines[index] ?? ''
      if (/^#{1,6}\s+/.test(line)) {
        end = index
        break
      }
      const next = /^(\s*)\d+\.\s+\S/.exec(line)
      if (next !== null && (next[1]?.length ?? 0) <= match.indent) {
        end = index
        break
      }
    }
    return { count: 1, value: lines.slice(match.index, end).join('\n') }
  }
  if (locator.kind === 'symbol') {
    const matches = lines
      .map((line, index) => ({ line, index }))
      .filter(({ line }) => line.trim() === locator.anchor.trim())
    return { count: matches.length, value: matches.length === 1 ? (matches[0]?.line ?? '') : '' }
  }
  return { count: 0, value: '' }
}

function pathProblem(path: string): ResultCode | null {
  const segments = path.split('/')
  if (
    path.length === 0 ||
    isAbsolute(path) ||
    /^[A-Za-z]:/.test(path) ||
    path.includes('\\') ||
    path.includes('*') ||
    path.includes('?') ||
    segments.some((segment) => segment.length === 0 || segment === '.' || segment === '..')
  ) {
    return 'SOURCE_PATH_INVALID'
  }
  return null
}

function contained(root: string, candidate: string): boolean {
  const relativePath = relative(root, candidate)
  return !(relativePath.startsWith(`..${sep}`) || relativePath === '..' || isAbsolute(relativePath))
}

function resolveRegularFile(
  root: string,
  repoRelativePath: string,
): { absolute?: string; code?: ResultCode; message?: string } {
  let canonicalRoot: string
  try {
    canonicalRoot = realpathSync(root)
  } catch (error) {
    return {
      code: 'IO_ERROR',
      message: `cannot resolve repository root: ${(error as Error).message}`,
    }
  }
  let cursor = canonicalRoot
  const segments = repoRelativePath.split('/')
  for (let index = 0; index < segments.length; index += 1) {
    cursor = resolve(cursor, segments[index] as string)
    if (!contained(canonicalRoot, cursor)) {
      return { code: 'SOURCE_PATH_ESCAPE', message: 'path escapes admitted repository root' }
    }
    let stat: ReturnType<typeof lstatSync>
    try {
      stat = lstatSync(cursor)
    } catch (error) {
      return {
        code: 'RULE_SOURCE_MISSING',
        message: `cannot inspect path: ${(error as Error).message}`,
      }
    }
    if (stat.isSymbolicLink()) {
      return {
        code: 'SOURCE_SYMLINK_FORBIDDEN',
        message: 'path contains a symlink or reparse component',
      }
    }
    const final = index === segments.length - 1
    if (final && !stat.isFile()) {
      return { code: 'SOURCE_NOT_REGULAR', message: 'path is not a regular file' }
    }
    if (!final && !stat.isDirectory()) {
      return { code: 'SOURCE_NOT_REGULAR', message: 'path ancestor is not a directory' }
    }
    let canonicalComponent: string
    try {
      canonicalComponent = realpathSync(cursor)
    } catch (error) {
      return { code: 'IO_ERROR', message: `cannot canonicalize path: ${(error as Error).message}` }
    }
    if (!contained(canonicalRoot, canonicalComponent)) {
      return {
        code: 'SOURCE_PATH_ESCAPE',
        message: 'canonical path escapes admitted repository root',
      }
    }
  }
  return { absolute: cursor }
}

export function sweepRegistrySources(document: unknown, repoRoot: string): ValidationResult {
  const base = validateRegistry(document)
  if (!validateStructure(document)) return base
  const registry = document as AuthorityEnforcementRegistry
  const violations = [...base.violations]
  const root = resolve(repoRoot)
  const normalizedPaths = new Set<string>()
  for (const source of registry.sources) {
    const invalidPath = pathProblem(source.path)
    if (invalidPath !== null) {
      violations.push(
        violation(invalidPath, `invalid repo-relative source path '${source.path}'`, {
          sourcePath: source.path,
        }),
      )
      continue
    }
    const normalized = source.path.toLowerCase()
    if (normalizedPaths.has(normalized)) {
      violations.push(
        violation('SOURCE_DUPLICATE_PATH', `duplicate normalized source path '${source.path}'`, {
          sourcePath: source.path,
        }),
      )
      continue
    }
    normalizedPaths.add(normalized)
    const resolvedSource = resolveRegularFile(root, source.path)
    if (resolvedSource.code !== undefined) {
      violations.push(
        violation(resolvedSource.code, resolvedSource.message ?? 'source path cannot be resolved', {
          sourcePath: source.path,
        }),
      )
      continue
    }
    const absolute = resolvedSource.absolute as string
    let content: string
    try {
      content = readFileSync(absolute, 'utf8')
    } catch (error) {
      violations.push(
        violation('RULE_SOURCE_MISSING', `cannot read source: ${(error as Error).message}`, {
          sourcePath: source.path,
        }),
      )
      continue
    }
    for (const item of source.inventoryItems) {
      const extracted = extractLocator(content, item.locator)
      if (extracted.count === 0) {
        violations.push(
          violation('LOCATOR_MISSING', 'registered locator is missing', {
            sourcePath: source.path,
            locator: item.locator.anchor,
          }),
        )
      } else if (extracted.count > 1) {
        violations.push(
          violation('LOCATOR_DUPLICATE', 'registered locator is not unique', {
            sourcePath: source.path,
            locator: item.locator.anchor,
          }),
        )
      } else if (sha256(normalizeRuleText(extracted.value)) !== item.valueDigest) {
        violations.push(
          violation('VALUE_DIGEST_MISMATCH', 'operative normalized source value changed', {
            sourcePath: source.path,
            locator: item.locator.anchor,
          }),
        )
      }
    }
    if (source.path.endsWith('.md')) {
      const registeredHeadings = new Set(
        source.inventoryItems
          .filter((item) => item.locator.kind === 'heading')
          .map((item) => item.locator.anchor.split(' > ').at(-1)),
      )
      const bindingHeadings = content
        .replace(/\r\n?/g, '\n')
        .split('\n')
        .map((line) => line.trim())
        .filter((line) =>
          /^#{2,6}\s+.*\b(binding|authority|constraint|decision|gate|stop)\b/i.test(line),
        )
      for (const heading of bindingHeadings) {
        if (!registeredHeadings.has(heading)) {
          violations.push(
            violation('SOURCE_ITEM_UNCOVERED', 'rule-bearing heading is not inventoried', {
              sourcePath: source.path,
              locator: heading,
            }),
          )
        }
      }
    }
  }
  for (const rule of registry.rules) {
    if (rule.retirementState !== 'retired-from-agent-reading') continue
    for (const evidence of Object.values(rule.retirementEvidence)) {
      if (evidence === null) continue
      const invalidPath = pathProblem(evidence.path)
      if (invalidPath !== null) {
        violations.push(
          violation(
            'RETIREMENT_EVIDENCE_INCOMPLETE',
            `invalid retirement evidence path '${evidence.path}'`,
            {
              ruleId: rule.ruleId,
            },
          ),
        )
        continue
      }
      const resolvedEvidence = resolveRegularFile(root, evidence.path)
      if (resolvedEvidence.absolute === undefined) {
        violations.push(
          violation(
            'RETIREMENT_EVIDENCE_INCOMPLETE',
            resolvedEvidence.message ?? 'retirement evidence cannot be resolved',
            { ruleId: rule.ruleId },
          ),
        )
        continue
      }
      try {
        if (sha256(readFileSync(resolvedEvidence.absolute)) !== evidence.digest) {
          violations.push(
            violation('RETIREMENT_EVIDENCE_INCOMPLETE', 'retirement evidence digest changed', {
              ruleId: rule.ruleId,
            }),
          )
        }
      } catch (error) {
        violations.push(
          violation(
            'RETIREMENT_EVIDENCE_INCOMPLETE',
            `cannot read retirement evidence: ${(error as Error).message}`,
            {
              ruleId: rule.ruleId,
            },
          ),
        )
      }
    }
  }
  const sorted = ordered(violations)
  return { valid: sorted.length === 0, violations: sorted, summary: summaryFor(registry, sorted) }
}
