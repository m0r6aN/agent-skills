import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, lstatSync, readFileSync, realpathSync } from 'node:fs'
import { isAbsolute, relative, resolve, sep } from 'node:path'
import * as ts from 'typescript/unstable/ast'
import { API as TypeScriptApi } from 'typescript/unstable/sync'
import { parse } from 'yaml'
import AjvModule, { type Ajv as AjvType } from '../node_modules/ajv/dist/ajv.js'
import { authorityEnforcementRegistrySchema } from './schemas.js'
import {
  AUTHORITY_TIERS,
  type AuthorityEnforcementRegistry,
  type AuthorityQuery,
  type AuthorityResolution,
  type AuthorityRule,
  type CanonSource,
  GOAL_SCOPES,
  HOST_POSTURES,
  OPERATION_SCOPES,
  type OperationId,
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
const REQUIRED_REWORK_MIGRATIONS = [
  'registry-rework-6eb1c25',
  'registry-rework-9285945',
  'registry-rework-6f45963',
  'registry-rework-b414d06',
] as const
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
      'foreman-line-plan:item.c92333c21e64',
      'fk-charter:item.b1ac4aa9eddf',
    ],
    rules: ['rule.fk-charter.b1ac4aa9eddf'],
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
      'fk-charter:item.d7',
    ],
    rules: [
      'rule.permission-profiles-validator.dcd8638af4a4',
      'rule.permission-profiles-validator.9c3c17055384',
      'rule.permission-profiles-validator.4da758cc157c',
      'rule.permission-profiles-validator.ffd598413a66',
      'rule.fk-charter.d7',
    ],
  },
  'missing-provenance-reference': {
    topic: 'Standing constraints name a provenance ledger absent at the source snapshot.',
    status: 'open',
    refs: [
      'standing-constraints:item.c5880644c95c',
      ...Array.from(
        { length: 13 },
        (_, index) => `standing-constraints:item.constraint-${index + 1}`,
      ),
    ],
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
  'registry-rework-9285945': {
    topic: 'R3 registry bindings superseded by the coordinator-ratified FK-P0 R4 amendment.',
    status: 'superseded-by-amendment',
    refs: ['fk-charter:item.d2'],
    rules: ['rule.fk-charter.d2'],
  },
  'registry-rework-6f45963': {
    topic: 'R4 registry bindings superseded by the coordinator-ratified FK-P0 R5 amendment.',
    status: 'superseded-by-amendment',
    refs: ['fk-charter:item.d7'],
    rules: ['rule.fk-charter.d7'],
  },
  'registry-rework-b414d06': {
    topic: 'R5 registry bindings superseded by the coordinator-ratified FK-P0 R6 amendment.',
    status: 'superseded-by-amendment',
    refs: ['fk-charter:item.d10'],
    rules: ['rule.fk-charter.d10'],
  },
} as const

const SHIPPED_BINDING_MANIFEST_DIGEST =
  '644e1336c2e4309bc75954cb24e921d4cf6d3a75b0ccc7cb926de34a8ca553c6'
const PRIOR_R3_BINDING_MANIFEST_DIGEST =
  '48a82df7d6da19352e4c9d2d99195835743a27f163a5d13a4f8d5b2a76a75a61'
const PRIOR_R4_BINDING_MANIFEST_DIGEST =
  '375ea566b2858d3204d17e0625332167a373b555db6d3a8b741af88f1390e082'
const PRIOR_R5_BINDING_MANIFEST_DIGEST =
  '589c6c3ea98147a951ab8887fd70a1a1c50e8b84953abcbe51b152a256da6ad9'

const RECONCILIATION_PROSE: Readonly<Record<string, readonly [string, string]>> = {
  'gate-namespace-count': [
    'Historical pipeline vocabulary remains visible; the FK goal three-gate namespace controls FK work.',
    'Naive consumers must retain the namespace and scope when interpreting gate numbers.',
  ],
  'gate3-delegation': [
    'Goal-charter scope withholds Gate 3 delegation for Foreman Kernel.',
    'Generic delegation text remains valid only outside the controlling FK scope.',
  ],
  'spec-linter-profile-behavior': [
    'Live schema behavior is recorded as binding and contradictory explanation as stale.',
    'FK-P0 does not edit the linter or convention prose.',
  ],
  'surfaces-allowed-files': [
    'surfaces is routing metadata only; Allowed Files remains the mutation boundary.',
    'Mechanical body compilation remains a declared FK-P2 gap.',
  ],
  'permission-profile-enforcement-bound': [
    'Mediated denial, post-review detection, and unsupported bypass cases are separate classifications.',
    'Missing enrollment must never be reported as a pre-action refusal.',
  ],
  'missing-provenance-reference': [
    'All thirteen inline rules remain mapped from the standing-constraints source.',
    'The standing rules cannot retire from agent reading until provenance is restored or amended.',
  ],
  'registry-rework-6eb1c25': [
    'The curated atomic registry supersedes the rejected generated bindings in FK scope.',
    'Future binding changes require another typed prior-to-new migration record.',
  ],
  'registry-rework-9285945': [
    'The R4 source-bound semantic and discovery contract supersedes the R3 registry bindings in FK scope.',
    'Future binding changes require another typed prior-to-new migration record.',
  ],
  'registry-rework-6f45963': [
    'The R5 item-curated semantic, baseline, locator, and compiler-AST contract supersedes the R4 registry bindings in FK scope.',
    'Future binding changes require another typed prior-to-new migration record.',
  ],
  'registry-rework-b414d06': [
    'The R6 curated publication, source-honest applicability, and complete reconciliation contract supersedes the R5 registry bindings in FK scope.',
    'Future binding changes require another typed prior-to-new migration record.',
  ],
}

const RECONCILIATION_RECORD_DIGESTS: Readonly<Record<string, string>> = {
  'gate-namespace-count': '23f3549859f81eddfd5645dc3de3ffe07997c624cd75d61d3410645b710968d3',
  'gate3-delegation': '13f5094dc781381ad5c1124f094af5f6f57b462c73df3fd3925e2b844c3f53c6',
  'spec-linter-profile-behavior':
    '80632188d2e21684ca3cf458a567fabba5b5b3fb2caaaed470dbd77bed8efb95',
  'surfaces-allowed-files': '472c152d6cfea31b5ab41b61d66e877106f2512c61dc36918511d89a301467cd',
  'permission-profile-enforcement-bound':
    '68fa04781f9d90da1b5d3c03f104c53b8423ef051851143ea008a2b09032d298',
  'missing-provenance-reference':
    'ed49c8796d80a450fbb272d7aaba9c1159225e54bbf5d96e0a441cf757135b80',
  'registry-rework-6eb1c25': 'c2b4971fd67a81df51ab33931fda17122c06de67ce5cc6ef857380704348fd6d',
  'registry-rework-9285945': 'fc10cc1e7f98635521a8fbc65ba34895415b8901d62c49790b8b3e7337fd3fb1',
  'registry-rework-6f45963': '3954ba2fc23122f82f6d68e294a180b8dc789983e2bb3da0198c79f8550513d9',
  'registry-rework-b414d06': '8a7c1fdd61cbb664d6c9b1b0aefcba1dc35dc26873eff711bbfada8480247d7f',
}

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

export function bindingDigestFor(rule: Omit<AuthorityRule, 'bindingDigest'>): string {
  return sha256(
    canonicalJson({
      ruleId: rule.ruleId,
      authoritySubject: rule.authoritySubject,
      authorityClaim: rule.authorityClaim,
      sourceRefs: rule.sourceRefs,
      authorityBasisRef: rule.authorityBasisRef,
      normalizedStatement: rule.normalizedStatement,
      applicability: rule.applicability,
      severity: rule.severity,
      classification: rule.classification,
      decision: rule.decision,
      refusalCode: rule.refusalCode,
      enforcementOwner: rule.enforcementOwner,
      assurance: rule.assurance,
      pairedRuleIds: rule.pairedRuleIds,
      retirementState: rule.retirementState,
      retirementEvidence: rule.retirementEvidence,
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
        snapshotEvidence: source.snapshotEvidence,
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
        bindingDigest: rule.bindingDigest,
      })),
    }),
  )
}

const concreteRoles = ROLE_SCOPES.filter((value) => value !== 'any')
const concreteStages = STAGE_SCOPES.filter((value) => value !== 'any')
const concreteOperations = OPERATION_SCOPES.filter((value) => value !== 'any')
const concreteHosts = HOST_POSTURES.filter((value) => value !== 'any')

function queryIsValid(query: AuthorityQuery): boolean {
  return (
    /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/.test(query.authoritySubject) &&
    query.goal === 'foreman-kernel' &&
    concreteRoles.includes(query.role) &&
    concreteStages.includes(query.stage) &&
    concreteOperations.includes(query.operation) &&
    concreteHosts.includes(query.host)
  )
}

function axisMatches(values: readonly string[], value: string): boolean {
  return values.includes(value) || values.includes('any')
}

function isActiveAuthorityRule(
  rule: AuthorityRule,
  sources: ReadonlyMap<string, CanonSource>,
): boolean {
  if (
    rule.retirementState === 'historical-only' ||
    rule.retirementState === 'retired-from-agent-reading' ||
    rule.classification === 'narrative-provenance' ||
    rule.classification === 'unsupported'
  ) {
    return false
  }
  return sources.get(rule.authorityBasisRef.sourceId)?.authorityEffect === 'binding'
}

export function resolveAuthority(
  document: AuthorityEnforcementRegistry,
  query: AuthorityQuery,
): AuthorityResolution {
  if (!queryIsValid(query)) {
    return {
      outcome: 'REQUIRE_HUMAN',
      authoritySubject: query.authoritySubject,
      reasonCode: 'INVALID_QUERY_SCOPE',
      controllingRuleIds: [],
      consideredRuleIds: [],
    }
  }
  const sources = new Map(document.sources.map((source) => [source.sourceId, source]))
  const considered = document.rules
    .filter((rule) => {
      if (rule.authoritySubject !== query.authoritySubject) return false
      return (
        (rule.applicability.goals.includes(query.goal) ||
          rule.applicability.goals.includes('all-foreman-goals')) &&
        axisMatches(rule.applicability.roles, query.role) &&
        axisMatches(rule.applicability.stages, query.stage) &&
        axisMatches(rule.applicability.operations, query.operation) &&
        axisMatches(rule.applicability.hosts, query.host)
      )
    })
    .sort((left, right) => left.ruleId.localeCompare(right.ruleId))
  const candidates = considered.filter((rule) => isActiveAuthorityRule(rule, sources))
  const consideredRuleIds = considered.map((rule) => rule.ruleId)
  if (candidates.length === 0) {
    return {
      outcome: 'REQUIRE_HUMAN',
      authoritySubject: query.authoritySubject,
      reasonCode: 'NO_APPLICABLE_AUTHORITY',
      controllingRuleIds: [],
      consideredRuleIds,
    }
  }
  const tierIndex = (rule: AuthorityRule) =>
    (() => {
      const tier = sources.get(rule.authorityBasisRef.sourceId)?.authorityTier
      return tier === undefined ? AUTHORITY_TIERS.length : AUTHORITY_TIERS.indexOf(tier)
    })()
  const highest = Math.min(...candidates.map(tierIndex))
  const controlling = candidates.filter((rule) => tierIndex(rule) === highest)
  const claims = [...new Set(controlling.map((rule) => rule.authorityClaim))].sort()
  if (claims.length !== 1) {
    return {
      outcome: 'CONFLICT',
      authoritySubject: query.authoritySubject,
      conflictingClaims: claims,
      controllingRuleIds: [],
      consideredRuleIds,
    }
  }
  return {
    outcome: 'RESOLVED',
    authoritySubject: query.authoritySubject,
    authorityClaim: claims[0] as string,
    controllingRuleIds: controlling.map((rule) => rule.ruleId).sort(),
    consideredRuleIds,
  }
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
  if (!isActiveAuthorityRule(rule, sourcesById)) return null
  const basis = sourcesById.get(rule.authorityBasisRef.sourceId)
  if (basis === undefined) return null
  const tier = AUTHORITY_TIERS.indexOf(basis.authorityTier)
  return tier < 0 ? null : tier
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
  const evidenceContract: Readonly<Record<string, readonly string[]>> = {
    'gate1.ratify': ['fk-charter:item.b1ac4aa9eddf'],
    'gate2.dispatch': ['fk-charter:item.afbcffd2d557', 'fk-loop-directive:item.bfffee6d7c1f'],
    'gate3.merge': [
      'fk-charter:item.b1ac4aa9eddf',
      'fk-loop-directive:item.7eb6018d9e57',
      'fk-loop-directive:item.2743c2f8c558',
    ],
    'verification.issue': ['fk-charter:item.d11', 'fk-loop-directive:item.ce9042d917b2'],
    'closure.record': ['fk-charter:item.e9ec57edc0a2', 'fk-loop-directive:item.e3065db62b43'],
    'receipt.mint-generic': [],
    'external.write': [],
  }
  for (const operationId of REQUIRED_OPERATIONS) {
    if (!rows.has(operationId)) {
      violations.push(
        violation('AUTHORITY_ESCALATION', `required operation row '${operationId}' is missing`),
      )
    }
  }
  for (const [operationId, expected] of Object.entries(evidenceContract)) {
    const actual = rows
      .get(operationId as OperationId)
      ?.requiredGitEvidence.map((reference) => `${reference.sourceId}:${reference.itemId}`)
    if (actual !== undefined && actual.join('|') !== expected.join('|')) {
      violations.push(
        violation(
          'AUTHORITY_ESCALATION',
          `${operationId} evidence does not equal the operative canon reference set`,
        ),
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
    (gate2.allowedPrincipals.join('|') !== 'coordinator' ||
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
    (closure.allowedPrincipals.join('|') !== 'coordinator' ||
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
  const expectedSourcePairs = Object.entries(SOURCE_CONTRACTS)
    .map(([sourceId, contract]) => `${sourceId}\u0000${contract.path}`)
    .sort()
  const actualSourcePairs = document.sources
    .map((source) => `${source.sourceId}\u0000${source.path}`)
    .sort()
  if (actualSourcePairs.join('|') !== expectedSourcePairs.join('|')) {
    violations.push(
      violation(
        'MIGRATION_EVIDENCE_INVALID',
        'registry source IDs and paths must equal the exact pinned eighteen-source set',
      ),
    )
  }

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
    const sourceNamespace = rule.ruleId.split('.').slice(1, -1).join('.')
    if (
      /(?:^|\.)[0-9a-f]{12}(?:$|\.)/.test(rule.authoritySubject) ||
      /^requires-[0-9a-f]{12}$/.test(rule.authorityClaim) ||
      (sourceNamespace.length > 0 && rule.authoritySubject.startsWith(`${sourceNamespace}.`))
    ) {
      violations.push(
        violation(
          'RULE_SEMANTICS_UNCURATED',
          `rule '${rule.ruleId}' uses a generated or source-item-derived authority identity`,
          { ruleId: rule.ruleId },
        ),
      )
    }
    if (bindingDigestFor(rule) !== rule.bindingDigest) {
      violations.push(
        violation('MIGRATION_EVIDENCE_INVALID', 'rule bindingDigest is stale', {
          ruleId: rule.ruleId,
        }),
      )
    }
    const basisItem = itemsByRef.get(
      referenceKey(rule.authorityBasisRef.sourceId, rule.authorityBasisRef.itemId),
    )
    if (
      !rule.sourceRefs.some(
        (reference) => canonicalJson(reference) === canonicalJson(rule.authorityBasisRef),
      ) ||
      basisItem === undefined ||
      locatorDigestFor(basisItem.locator) !== rule.authorityBasisRef.locatorDigest ||
      basisItem.valueDigest !== rule.authorityBasisRef.valueDigest ||
      normalizeRuleText(rule.normalizedStatement) !== normalizeRuleText(basisItem.normalizedExcerpt)
    ) {
      violations.push(
        violation(
          'MIGRATION_EVIDENCE_INVALID',
          `rule '${rule.ruleId}' authorityBasisRef is not a complete binding source reference`,
          { ruleId: rule.ruleId },
        ),
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
    const evidencePaths = evidenceValues
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .map((item) => item.path)
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
    if (retired && new Set(evidencePaths).size !== 4) {
      violations.push(
        violation(
          'RETIREMENT_EVIDENCE_INCOMPLETE',
          'retirement evidence requires four distinct paths',
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
        left.authoritySubject === right.authoritySubject &&
        left.authorityClaim !== right.authorityClaim &&
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
  for (const migrationId of REQUIRED_REWORK_MIGRATIONS) {
    if (!document.reconciliations.some((record) => record.reconciliationId === migrationId)) {
      violations.push(
        violation(
          'RECONCILIATION_MISSING',
          `required rework migration '${migrationId}' is missing`,
        ),
      )
    }
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
    if (
      RECONCILIATION_RECORD_DIGESTS[record.reconciliationId] === undefined ||
      sha256(canonicalJson(record)) !== RECONCILIATION_RECORD_DIGESTS[record.reconciliationId]
    ) {
      violations.push(
        violation(
          'MIGRATION_EVIDENCE_INVALID',
          `reconciliation '${record.reconciliationId}' differs from its complete canonical record manifest`,
        ),
      )
    }
    const contract =
      RECONCILIATION_CONTRACT[record.reconciliationId as keyof typeof RECONCILIATION_CONTRACT]
    const prose = RECONCILIATION_PROSE[record.reconciliationId]
    if (
      contract !== undefined &&
      (record.topic !== contract.topic ||
        record.migrationStatus !== contract.status ||
        record.observedRefs
          .map((reference) => `${reference.sourceId}:${reference.itemId}`)
          .join('|') !== contract.refs.join('|') ||
        record.authoritativeRuleIds.join('|') !== contract.rules.join('|') ||
        prose === undefined ||
        record.scopedDisposition !== prose[0] ||
        record.unresolvedConsequence !== prose[1])
    ) {
      violations.push(
        violation(
          'MIGRATION_EVIDENCE_INVALID',
          `reconciliation '${record.reconciliationId}' topic/status contract changed`,
        ),
      )
    }
    if ((REQUIRED_RECONCILIATIONS as readonly string[]).includes(record.reconciliationId)) {
      const expectedEvidence = record.observedRefs.map((reference) => {
        const canonicalReference = canonicalJson(reference)
        return {
          kind: 'source-ref',
          reference: canonicalReference,
          digest: sha256(canonicalReference),
        }
      })
      if (record.reconciliationId === 'missing-provenance-reference') {
        const missingReference = canonicalJson({
          commit: document.sourceSnapshotCommit,
          path: 'plugins/foreman-line/docs/transcripts/defects_lessons.md',
        })
        expectedEvidence.push(
          {
            kind: 'git-commit',
            reference: document.sourceSnapshotCommit,
            digest: '35b6b805e4ad81c9b4cb4c1f5dc346c431e55e6823690e93d4ad61a969767cad',
          },
          {
            kind: 'missing-path',
            reference: missingReference,
            digest: sha256(missingReference),
          },
        )
      }
      if (canonicalJson(record.observedEvidence) !== canonicalJson(expectedEvidence)) {
        violations.push(
          violation(
            'MIGRATION_EVIDENCE_INVALID',
            `reconciliation '${record.reconciliationId}' observedEvidence set changed`,
          ),
        )
      }
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
    if (record.reconciliationId === 'registry-rework-6eb1c25') {
      const gitRefs = record.observedEvidence
        .filter((e) => e.kind === 'git-commit')
        .map((e) => e.reference)
      const commands = record.observedEvidence.filter((e) => e.kind === 'command-result')
      const resultDigests = commands.flatMap((e) => {
        try {
          const value = JSON.parse(e.reference) as { resultDigest?: unknown }
          return typeof value.resultDigest === 'string' ? [value.resultDigest] : []
        } catch {
          return []
        }
      })
      if (
        gitRefs.join('|') !==
          `4666ea15caee8b231137f23325d14ea4526e338a|${document.sourceSnapshotCommit}` ||
        commands.length !== 2 ||
        !resultDigests.includes(
          '1fe3a7c66241904445021c97db68065961a3bf5beceb654faff4b552b4de79b2',
        ) ||
        !resultDigests.includes(PRIOR_R3_BINDING_MANIFEST_DIGEST)
      ) {
        violations.push(
          violation(
            'MIGRATION_EVIDENCE_INVALID',
            'rework migration does not bind the prior registry commit, source snapshot, and superseding manifest',
          ),
        )
      }
    }
    if (record.reconciliationId === 'registry-rework-9285945') {
      const gitRefs = record.observedEvidence
        .filter((e) => e.kind === 'git-commit')
        .map((e) => e.reference)
      const resultDigests = record.observedEvidence
        .filter((e) => e.kind === 'command-result')
        .flatMap((e) => {
          try {
            const value = JSON.parse(e.reference) as { resultDigest?: unknown }
            return typeof value.resultDigest === 'string' ? [value.resultDigest] : []
          } catch {
            return []
          }
        })
      if (
        gitRefs.join('|') !==
          `87237a868a0da8e1a57fc8ce9d400509b2a09c5d|${document.sourceSnapshotCommit}` ||
        !resultDigests.includes(PRIOR_R3_BINDING_MANIFEST_DIGEST) ||
        !resultDigests.includes(PRIOR_R4_BINDING_MANIFEST_DIGEST)
      ) {
        violations.push(
          violation(
            'MIGRATION_EVIDENCE_INVALID',
            'R4 migration does not bind the prior R3 registry commit, source snapshot, and superseding manifest',
          ),
        )
      }
    }
    if (record.reconciliationId === 'registry-rework-6f45963') {
      const gitRefs = record.observedEvidence
        .filter((e) => e.kind === 'git-commit')
        .map((e) => e.reference)
      const resultDigests = record.observedEvidence
        .filter((e) => e.kind === 'command-result')
        .flatMap((e) => {
          try {
            const value = JSON.parse(e.reference) as { resultDigest?: unknown }
            return typeof value.resultDigest === 'string' ? [value.resultDigest] : []
          } catch {
            return []
          }
        })
      if (
        gitRefs.join('|') !==
          `f73a3846e436dcf25d80618aedd88170b0888770|${document.sourceSnapshotCommit}` ||
        !resultDigests.includes(PRIOR_R4_BINDING_MANIFEST_DIGEST) ||
        !resultDigests.includes(PRIOR_R5_BINDING_MANIFEST_DIGEST)
      ) {
        violations.push(
          violation(
            'MIGRATION_EVIDENCE_INVALID',
            'R5 migration does not bind the prior R4 registry commit, source snapshot, and superseding manifest',
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
          (candidate) => canonicalJson(candidate) === evidence.reference,
        )
        if (ref !== undefined) expectedDigest = sha256(evidence.reference)
      } else if (evidence.kind === 'missing-path') {
        try {
          const parsed = JSON.parse(evidence.reference) as unknown
          if (
            isRecord(parsed) &&
            Object.keys(parsed).sort().join('|') === 'commit|path' &&
            typeof parsed.commit === 'string' &&
            /^[0-9a-f]{40}$/.test(parsed.commit) &&
            parsed.commit === document.sourceSnapshotCommit &&
            typeof parsed.path === 'string' &&
            pathProblem(parsed.path) === null &&
            record.observedEvidence.some(
              (candidate) =>
                candidate.kind === 'git-commit' && candidate.reference === parsed.commit,
            )
          ) {
            expectedDigest = sha256(evidence.reference)
          }
        } catch {
          expectedDigest = null
        }
      } else if (evidence.kind === 'command-result') {
        try {
          const parsed = JSON.parse(evidence.reference) as unknown
          const keys = isRecord(parsed) ? Object.keys(parsed).sort().join('|') : ''
          if (
            keys === 'actorClass|commandId|exitCode|inputDigest|resultDigest|tool|toolVersion' &&
            typeof (parsed as Record<string, unknown>).tool === 'string' &&
            typeof (parsed as Record<string, unknown>).toolVersion === 'string' &&
            typeof (parsed as Record<string, unknown>).commandId === 'string' &&
            typeof (parsed as Record<string, unknown>).inputDigest === 'string' &&
            typeof (parsed as Record<string, unknown>).resultDigest === 'string' &&
            Number.isInteger((parsed as Record<string, unknown>).exitCode) &&
            typeof (parsed as Record<string, unknown>).actorClass === 'string'
          )
            expectedDigest = sha256(evidence.reference)
        } catch {
          expectedDigest = null
        }
      } else if (evidence.kind === 'git-commit' && /^[0-9a-f]{40}$/.test(evidence.reference)) {
        expectedDigest = /^[0-9a-f]{64}$/.test(evidence.digest) ? evidence.digest : null
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
    {
      const expectedEvidence: Readonly<Record<string, readonly string[]>> = {
        'gate1.ratify': ['fk-charter:item.b1ac4aa9eddf'],
        'gate2.dispatch': ['fk-charter:item.afbcffd2d557', 'fk-loop-directive:item.bfffee6d7c1f'],
        'gate3.merge': [
          'fk-charter:item.b1ac4aa9eddf',
          'fk-loop-directive:item.7eb6018d9e57',
          'fk-loop-directive:item.2743c2f8c558',
        ],
        'verification.issue': ['fk-charter:item.d11', 'fk-loop-directive:item.ce9042d917b2'],
        'closure.record': ['fk-charter:item.e9ec57edc0a2', 'fk-loop-directive:item.e3065db62b43'],
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
  if (registryBindingManifestDigest(document) !== SHIPPED_BINDING_MANIFEST_DIGEST) {
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

function stripMarkdownHtmlComments(content: string): string {
  let visible = ''
  let cursor = 0
  let inComment = false
  while (cursor < content.length) {
    if (!inComment && content.startsWith('<!--', cursor)) {
      visible += '    '
      cursor += 4
      inComment = true
      continue
    }
    if (inComment && content.startsWith('-->', cursor)) {
      visible += '   '
      cursor += 3
      inComment = false
      continue
    }
    const character = content[cursor] as string
    visible += inComment && character !== '\n' && character !== '\r' ? ' ' : character
    cursor += 1
  }
  return visible
}

function markdownBlockMap(content: string, sourceId: string): Map<string, string> {
  const result = new Map<string, string>()
  if (sourceId !== 'fk-charter' && sourceId !== 'fk-loop-directive') return result
  const lines = stripMarkdownHtmlComments(content).replace(/\r\n?/g, '\n').split('\n')
  const headings: { level: number; text: string }[] = []
  const occurrences = new Map<string, number>()
  let cursor = 0
  let inFence = false
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
          /^\s*(?:```|~~~)/.test(next)
        )
          break
        if (list && /^\s*(?:[-*+] |\d+\. )/.test(next)) break
        end += 1
      }
    }
    const headingPath = headings.map((item) => item.text).join(' > ') || '(preamble)'
    const kind = table ? 'table-row' : list ? 'list-item' : 'paragraph'
    const text = lines.slice(cursor, end).join('\n')
    const semanticKey = `${headingPath}\u0000${kind}\u0000${sha256(normalizeRuleText(text)).slice(0, 12)}`
    const occurrence = (occurrences.get(semanticKey) ?? 0) + 1
    occurrences.set(semanticKey, occurrence)
    result.set(`md-block:${headingPath}:${kind}:${semanticKey.slice(-12)}:${occurrence}`, text)
    cursor = end
  }
  return result
}

function tsNodeName(node: ts.Node): string | null {
  const named = node as ts.Node & { readonly name?: ts.Node }
  if (named.name !== undefined) return named.name.getText()
  if (ts.isVariableStatement(node)) {
    return node.declarationList.declarations
      .map((declaration) => declaration.name.getText())
      .join(',')
  }
  return null
}

function isTypeOnlyTopLevel(node: ts.Statement): boolean {
  if (ts.isImportDeclaration(node)) {
    const clause = node.importClause
    if (clause === undefined) return false
    if (/^type\b/.test(clause.getText())) return true
    if (clause.name !== undefined) return false
    return (
      clause.namedBindings !== undefined &&
      ts.isNamedImports(clause.namedBindings) &&
      clause.namedBindings.elements.length > 0 &&
      clause.namedBindings.elements.every((element) => element.isTypeOnly)
    )
  }
  if (ts.isImportEqualsDeclaration(node)) return node.isTypeOnly
  return (
    ts.isInterfaceDeclaration(node) ||
    ts.isTypeAliasDeclaration(node) ||
    (ts.isExportDeclaration(node) && node.isTypeOnly) ||
    (ts.isVariableStatement(node) &&
      node.declarationList.declarations.every(
        (declaration) => declaration.initializer === undefined && declaration.type !== undefined,
      ))
  )
}

function tsSemanticValue(node: ts.Node, sourceFile: ts.SourceFile): string {
  const tokens: string[] = []
  const scanner = ts.createScanner(true, ts.LanguageVariant.Standard, node.getText(sourceFile))
  for (;;) {
    const kind = scanner.scan()
    if (kind === ts.SyntaxKind.EndOfFile) break
    tokens.push(`${ts.SyntaxKind[kind]}:${scanner.getTokenText()}`)
  }
  return canonicalJson(tokens)
}

function hasCallableBody(node: ts.Node): node is ts.Node & { readonly body: ts.Node } {
  const candidate = node as ts.Node & { readonly body?: ts.Node }
  return (
    candidate.body !== undefined &&
    (ts.isFunctionDeclaration(node) ||
      ts.isFunctionExpression(node) ||
      ts.isArrowFunction(node) ||
      ts.isMethodDeclaration(node) ||
      ts.isConstructorDeclaration(node) ||
      ts.isGetAccessorDeclaration(node) ||
      ts.isSetAccessorDeclaration(node))
  )
}

const typescriptConstructCache = new Map<string, ReadonlyMap<string, string>>()

export function typescriptConstructMap(content: string): Map<string, string> {
  const contentDigest = sha256(content)
  const cached = typescriptConstructCache.get(contentDigest)
  if (cached !== undefined) return new Map(cached)
  const virtualPath = `c:/fk-p0-ast/${contentDigest}.ts`
  type VirtualFs = {
    readonly readFile: (path: string) => string | undefined
    readonly fileExists: (path: string) => boolean | undefined
    readonly directoryExists: (path: string) => boolean | undefined
    readonly realpath: (path: string) => string
  }
  const virtualFs: VirtualFs = {
    readFile: (path) => (path.toLowerCase() === virtualPath ? content : undefined),
    fileExists: (path) => (path.toLowerCase() === virtualPath ? true : undefined),
    directoryExists: (path) =>
      path.toLowerCase() === 'c:/fk-p0-ast' || path.toLowerCase() === 'c:' ? true : undefined,
    realpath: (path) => path.toLowerCase(),
  }
  const api = new TypeScriptApi({ cwd: 'c:/fk-p0-ast', fs: virtualFs })
  const snapshot = api.updateSnapshot({ openFiles: [virtualPath] })
  const sourceFile = snapshot
    .getDefaultProjectForFile(virtualPath)
    ?.program.getSourceFile(virtualPath)
  if (sourceFile === undefined) {
    snapshot.dispose()
    api.close()
    throw new Error('TypeScript compiler did not return a syntax tree')
  }
  const result = new Map<string, string>()
  const operative = sourceFile.statements.filter((statement) => !isTypeOnlyTopLevel(statement))
  operative.forEach((statement, topIndex) => {
    const name = tsNodeName(statement)
    let topAnchor =
      name === null ? `ts-top:${topIndex}:${ts.SyntaxKind[statement.kind]}` : `ts-construct:${name}`
    if (ts.isImportDeclaration(statement)) {
      const moduleName = statement.moduleSpecifier.getText(sourceFile).slice(1, -1)
      const clause = statement.importClause?.getText(sourceFile) ?? '(side-effect)'
      topAnchor = `ts-import:${moduleName}:${normalizeRuleText(clause)}`
    } else if (ts.isImportEqualsDeclaration(statement)) {
      topAnchor = `ts-import-equals:${normalizeRuleText(statement.getText(sourceFile))}`
    }
    result.set(topAnchor, tsSemanticValue(statement, sourceFile))
    const visit = (node: ts.Node, path: string): void => {
      if (hasCallableBody(node)) {
        const namePart = tsNodeName(node) ?? 'anonymous'
        result.set(
          `ts-body:${topAnchor}:${path}:${ts.SyntaxKind[node.kind]}:${namePart}`,
          tsSemanticValue(node.body, sourceFile),
        )
      }
      node.forEachChild((child) => {
        let childIndex = 0
        node.forEachChild((candidate) => {
          if (candidate === child) return
          if (candidate.pos < child.pos) childIndex += 1
        })
        visit(child, `${path}.${childIndex}`)
      })
    }
    visit(statement, String(topIndex))
  })
  snapshot.dispose()
  api.close()
  typescriptConstructCache.set(contentDigest, new Map(result))
  return result
}

function jsonConstraintMap(content: string): Map<string, string> {
  const result = new Map<string, string>()
  const visit = (value: unknown, path: string): void => {
    if (Array.isArray(value) || value === null || typeof value !== 'object') {
      result.set(`json-pointer:${path}`, canonicalJson(value))
      return
    }
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      visit(
        (value as Record<string, unknown>)[key],
        `${path}/${key.replace(/~/g, '~0').replace(/\//g, '~1')}`,
      )
    }
  }
  visit(JSON.parse(content) as unknown, '')
  return result
}

function extractLocator(content: string, locator: SourceLocator): { count: number; value: string } {
  const lines = content.replace(/\r\n?/g, '\n').split('\n')
  if (locator.kind === 'line-excerpt' && locator.anchor.startsWith('md-block:')) {
    const sourceId = locator.anchor.includes('# Foreman Kernel')
      ? 'fk-charter'
      : 'fk-loop-directive'
    const value = markdownBlockMap(content, sourceId).get(locator.anchor)
    return { count: value === undefined ? 0 : 1, value: value ?? '' }
  }
  if (
    locator.kind === 'symbol' &&
    (locator.anchor.startsWith('ts-construct:') ||
      locator.anchor.startsWith('ts-import:') ||
      locator.anchor.startsWith('ts-import-equals:') ||
      locator.anchor.startsWith('ts-top:') ||
      locator.anchor.startsWith('ts-body:'))
  ) {
    const value = typescriptConstructMap(content).get(locator.anchor)
    return { count: value === undefined ? 0 : 1, value: value ?? '' }
  }
  if (locator.kind === 'symbol' && locator.anchor.startsWith('json-pointer:')) {
    try {
      const value = jsonConstraintMap(content).get(locator.anchor)
      return { count: value === undefined ? 0 : 1, value: value ?? '' }
    } catch {
      return { count: 0, value: '' }
    }
  }
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
    if (locator.anchor.includes('\n')) {
      const normalizedContent = content.replace(/\r\n?/g, '\n')
      const matches = normalizedContent.split(locator.anchor).length - 1
      return { count: matches, value: matches === 1 ? locator.anchor : '' }
    }
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
      const semanticKey = `${stack.map((item) => item.heading).join(' > ')}\u0000${numbered[1]?.length ?? 0}\u0000${numbered[2] as string}`
      const occurrence = (occurrences.get(semanticKey) ?? 0) + 1
      occurrences.set(semanticKey, occurrence)
      const anchor = [
        ...stack.map((item) => item.heading),
        `list-item:${numbered[1]?.length ?? 0}:${numbered[2] as string}:${occurrence}`,
      ].join(' > ')
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
      const next = /^(\s*)(\d+)\.\s+\S/.exec(line)
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
  let gitReady = false
  try {
    const canonicalRoot = realpathSync(root)
    const worktreeRoot = realpathSync(
      execFileSync('git', ['rev-parse', '--show-toplevel'], {
        cwd: canonicalRoot,
        stdio: ['ignore', 'pipe', 'ignore'],
        encoding: 'utf8',
      }).trim(),
    )
    gitReady = canonicalRoot.toLowerCase() === worktreeRoot.toLowerCase()
    if (!gitReady) {
      violations.push(
        violation(
          'MIGRATION_EVIDENCE_INVALID',
          'repository root is not the exact root of a real Git worktree',
        ),
      )
    }
  } catch (error) {
    const rootExists = existsSync(root)
    violations.push(
      violation(
        rootExists ? 'MIGRATION_EVIDENCE_INVALID' : 'IO_ERROR',
        `repository root lacks mandatory real-Git evidence: ${(error as Error).message}`,
      ),
    )
  }
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
    if (gitReady) {
      try {
        const objectType = execFileSync('git', ['cat-file', '-t', source.snapshotEvidence.commit], {
          cwd: root,
          stdio: ['ignore', 'pipe', 'ignore'],
          encoding: 'utf8',
        }).trim()
        if (objectType !== 'commit') throw new Error(`snapshot object type is '${objectType}'`)
        const committedBytes = execFileSync(
          'git',
          ['cat-file', '-p', `${source.snapshotEvidence.commit}:${source.path}`],
          { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] },
        )
        if (sha256(committedBytes) !== source.snapshotEvidence.fullFileSha256) {
          violations.push(
            violation(
              'MIGRATION_EVIDENCE_INVALID',
              'declared source snapshot hash does not match committed source bytes',
              { sourcePath: source.path },
            ),
          )
        }
      } catch (error) {
        violations.push(
          violation(
            'MIGRATION_EVIDENCE_INVALID',
            `declared source snapshot cannot be resolved: ${(error as Error).message}`,
            { sourcePath: source.path },
          ),
        )
      }
    }
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
    for (const [anchor] of markdownBlockMap(content, source.sourceId)) {
      if (!source.inventoryItems.some((item) => item.locator.anchor === anchor)) {
        violations.push(
          violation('SOURCE_ITEM_UNCOVERED', 'binding prose block is not inventoried', {
            sourcePath: source.path,
            locator: anchor,
          }),
        )
      }
    }
    if (source.path.endsWith('.ts')) {
      const registered = new Set(
        source.inventoryItems
          .filter((item) => item.locator.kind === 'symbol')
          .map((item) => item.locator.anchor),
      )
      for (const anchor of typescriptConstructMap(content).keys()) {
        if (!registered.has(anchor)) {
          violations.push(
            violation(
              'SOURCE_ITEM_UNCOVERED',
              'top-level executable construct is not inventoried',
              {
                sourcePath: source.path,
                locator: anchor,
              },
            ),
          )
        }
      }
    }
    if (source.path.endsWith('.json')) {
      const registered = new Set(
        source.inventoryItems
          .filter((item) => item.locator.kind === 'symbol')
          .map((item) => item.locator.anchor),
      )
      try {
        for (const anchor of jsonConstraintMap(content).keys()) {
          if (!registered.has(anchor)) {
            violations.push(
              violation('SOURCE_ITEM_UNCOVERED', 'JSON schema constraint is not inventoried', {
                sourcePath: source.path,
                locator: anchor,
              }),
            )
          }
        }
      } catch {
        violations.push(
          violation('VALUE_DIGEST_MISMATCH', 'inventoried JSON schema cannot be parsed', {
            sourcePath: source.path,
          }),
        )
      }
    }
    if (source.sourceId === 'permission-profiles-registry') {
      try {
        const parsed = parse(content) as { profiles?: Record<string, unknown> }
        for (const profile of Object.keys(parsed.profiles ?? {})) {
          const anchor = `${profile}:`
          if (!source.inventoryItems.some((item) => item.locator.anchor.trim() === anchor)) {
            violations.push(
              violation('SOURCE_ITEM_UNCOVERED', 'permission profile is not inventoried', {
                sourcePath: source.path,
                locator: anchor,
              }),
            )
          }
        }
      } catch {
        violations.push(
          violation('VALUE_DIGEST_MISMATCH', 'permission profile registry cannot be parsed', {
            sourcePath: source.path,
          }),
        )
      }
    }
    if (source.path.endsWith('.md')) {
      const markdownLines = content.replace(/\r\n?/g, '\n').split('\n')
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
      const registeredTableKeys = new Set(
        source.inventoryItems
          .filter((item) => item.locator.kind === 'table-row')
          .map((item) => item.locator.anchor),
      )
      const tablePrefix =
        source.sourceId === 'fk-charter'
          ? 'D'
          : source.sourceId === 'fk-plan-review-findings'
            ? 'R'
            : null
      if (tablePrefix !== null) {
        for (const line of markdownLines) {
          const key = /^\|\s*(D\d+|R\d+)\s*\|/.exec(line.trim())?.[1]
          if (key?.startsWith(tablePrefix) && !registeredTableKeys.has(key)) {
            violations.push(
              violation('SOURCE_ITEM_UNCOVERED', 'rule-bearing decision row is not inventoried', {
                sourcePath: source.path,
                locator: key,
              }),
            )
          }
        }
      }
      if (source.sourceId === 'parcel-driven-development') {
        let inHardRules = false
        for (const line of markdownLines) {
          if (line.trim() === '## The Hard Rules') inHardRules = true
          else if (inHardRules && /^##\s/.test(line)) inHardRules = false
          const number = inHardRules ? /^(\d+)\.\s/.exec(line.trim())?.[1] : undefined
          if (number !== undefined && Number(number) > 15) {
            violations.push(
              violation('SOURCE_ITEM_UNCOVERED', 'new PDD hard rule is not inventoried', {
                sourcePath: source.path,
                locator: `hard-rule-${number}`,
              }),
            )
          }
        }
      }
      if (source.sourceId === 'standing-constraints') {
        for (const line of markdownLines) {
          const number = /^(\d+)\.\s/.exec(line.trim())?.[1]
          if (number !== undefined && Number(number) > 13) {
            violations.push(
              violation('SOURCE_ITEM_UNCOVERED', 'new standing constraint is not inventoried', {
                sourcePath: source.path,
                locator: `constraint-${number}`,
              }),
            )
          }
        }
      }
      for (const line of markdownLines) {
        if (/^[-*]\s+(?:\*\*)?(?:MUST|SHALL|STOP|AUTHORITY|BINDING)\b/i.test(line.trim())) {
          const normalized = normalizeRuleText(line)
          if (!source.inventoryItems.some((item) => item.normalizedExcerpt === normalized)) {
            violations.push(
              violation('SOURCE_ITEM_UNCOVERED', 'new binding bullet is not inventoried', {
                sourcePath: source.path,
                locator: line.trim(),
              }),
            )
          }
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
        const bytes = readFileSync(resolvedEvidence.absolute)
        if (sha256(bytes) !== evidence.digest) {
          violations.push(
            violation('RETIREMENT_EVIDENCE_INCOMPLETE', 'retirement evidence digest changed', {
              ruleId: rule.ruleId,
            }),
          )
          continue
        }
        let artifact: unknown
        try {
          artifact = JSON.parse(bytes.toString('utf8')) as unknown
        } catch {
          artifact = null
        }
        const expectedKeys = [
          'inputDigest',
          'kind',
          'outputDigest',
          'producerClass',
          'producerRef',
          'result',
          'ruleId',
          'schemaVersion',
          'sourceCommit',
        ]
        const record = isRecord(artifact) ? artifact : null
        const validArtifact =
          record !== null &&
          Object.keys(record).sort().join('|') === expectedKeys.sort().join('|') &&
          record.schemaVersion === '0.1.0' &&
          record.kind === evidence.kind &&
          record.ruleId === rule.ruleId &&
          record.sourceCommit === registry.sourceSnapshotCommit &&
          record.result === 'pass' &&
          typeof record.producerClass === 'string' &&
          typeof record.producerRef === 'string' &&
          typeof record.inputDigest === 'string' &&
          /^[0-9a-f]{64}$/.test(record.inputDigest) &&
          typeof record.outputDigest === 'string' &&
          /^[0-9a-f]{64}$/.test(record.outputDigest) &&
          (evidence.kind !== 'independent-bypass' ||
            record.producerClass === 'independent-reviewer')
        if (!validArtifact) {
          violations.push(
            violation(
              'RETIREMENT_EVIDENCE_INCOMPLETE',
              'retirement evidence artifact contract is invalid',
              {
                ruleId: rule.ruleId,
              },
            ),
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
  for (const reconciliation of registry.reconciliations) {
    for (const evidence of reconciliation.observedEvidence) {
      if (evidence.kind === 'git-commit' && gitReady) {
        try {
          const objectType = execFileSync('git', ['cat-file', '-t', evidence.reference], {
            cwd: root,
            stdio: ['ignore', 'pipe', 'ignore'],
            encoding: 'utf8',
          }).trim()
          if (objectType !== 'commit') throw new Error(`object type is '${objectType}'`)
          const bytes = execFileSync('git', ['cat-file', '-p', evidence.reference], {
            cwd: root,
            stdio: ['ignore', 'pipe', 'ignore'],
          })
          if (sha256(bytes) !== evidence.digest) {
            violations.push(
              violation('MIGRATION_EVIDENCE_INVALID', 'Git object evidence digest changed'),
            )
          }
        } catch {
          violations.push(
            violation('MIGRATION_EVIDENCE_INVALID', 'Git object evidence cannot be resolved'),
          )
        }
      }
      if (evidence.kind === 'missing-path' && gitReady) {
        try {
          const parsed = JSON.parse(evidence.reference) as { commit: string; path: string }
          execFileSync('git', ['cat-file', '-e', `${parsed.commit}:${parsed.path}`], {
            cwd: root,
            stdio: 'ignore',
          })
          violations.push(
            violation(
              'MIGRATION_EVIDENCE_INVALID',
              'missing-path evidence exists at its bound commit',
            ),
          )
        } catch {
          // Expected: the path is absent at the bound commit.
        }
      }
    }
  }
  const sorted = ordered(violations)
  return { valid: sorted.length === 0, violations: sorted, summary: summaryFor(registry, sorted) }
}
