import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, lstatSync, readFileSync, realpathSync } from 'node:fs'
import { isAbsolute, relative, resolve, sep } from 'node:path'
import * as ts from 'typescript/unstable/ast'
import { API as TypeScriptApi } from 'typescript/unstable/sync'
import { parse } from 'yaml'
import AjvModule, { type Ajv as AjvType } from '../node_modules/ajv/dist/ajv.js'
import {
  NORMATIVE_MARKDOWN_AUDIT_KEYS,
  R12_LEGACY_MARKDOWN_RULE_TARGETS,
  R12_PRIOR_REGISTRY_COMMIT,
  R13_PRIOR_REGISTRY_COMMIT,
  R30_RULE_SHAPES,
  R30_SOURCE_ITEMS,
  R31_AUDIT_ROWS,
  R31_DECISION_BLOB_DIGEST,
  R31_DECISION_PATH,
  R31_RECONCILIATION,
  R31_RECORD_DIGEST,
  R31_RULE_SHAPES,
  R31_SOURCE_ITEMS,
  R31_SOURCE_SNAPSHOT,
} from './registry.js'
import { authorityEnforcementRegistrySchema } from './schemas.js'
import {
  ASSURANCE_LEVELS,
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
  type ReconciliationRecord,
  type RegistrySummary,
  type ResultCode,
  ROLE_SCOPES,
  RULE_CLASSIFICATIONS,
  SEVERITIES,
  type SourceLocator,
  type SourceRef,
  STAGE_SCOPES,
  type ValidationResult,
  type ValidationViolation,
  type VolatileExtent,
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
  'registry-rework-00b41b7',
  'registry-rework-37afc65',
  'registry-rework-91145d7',
  'registry-rework-1b42f4b',
  'registry-rework-ee29973',
  'registry-rework-544d8a3',
  'registry-rework-0683bc0',
  // Demoted from chain head by R24. A former head joins the required set the moment it stops being
  // the head: presence is now obligatory, so deleting it fails closed rather than reading as an
  // unclaimed slot.
  'registry-rework-df8155a',
  'registry-rework-40394be',
  'registry-rework-66a514d',
] as const
/**
 * AC4 obligation 6 as amended by R22 - the shipped chain head, bound through channels that do NOT
 * depend on its being the head.
 *
 * Before R22 the head was absent from `RECONCILIATION_RECORD_DIGESTS`, `RECONCILIATION_CONTRACT`,
 * `RECONCILIATION_PROSE` and `REQUIRED_REWORK_MIGRATIONS` alike, and R19's obligation 2
 * (pinned => not head) plus the record-manifest check below (not head => pinned) made
 * `head <=> unpinned`. The unpinned slot was therefore a free slot for whoever claimed it, and three
 * attacks walked through it: deleting the head, deleting it and substituting a structural copy under
 * a fresh id, and rewriting it IN PLACE under the same id. The third defeats a presence-only
 * obligation entirely, because the head never departs.
 *
 * This id is deliberately NOT added to `RECONCILIATION_RECORD_DIGESTS`: obligation 2 keys on
 * presence in that table, so adding it would declare the shipped head ineligible to be the head and
 * invalidate the shipped registry. Measured: it does exactly that, AND still admits the
 * delete-and-substitute attack, because a pin binds only a record that is still present.
 */
const SHIPPED_CHAIN_HEAD_ID = 'registry-rework-446700d'
/**
 * The canonical record digest of the shipped head, consulted ONLY once the record is no longer the
 * head. While it IS the head it stays bound to the live manifest, so appending a legitimately
 * amended registry does not require regenerating or re-pinning anything; once a successor demotes
 * it, it becomes a historical record and is bound exactly like the eleven before it.
 */
const SHIPPED_CHAIN_HEAD_RECORD_DIGEST = R31_RECORD_DIGEST
const REQUIRED_OPERATIONS = [
  'gate1.ratify',
  'gate2.dispatch',
  'gate3.merge',
  'verification.issue',
  'closure.record',
  'receipt.mint-generic',
  'external.write',
] as const

const R9_PROTECTED_CHARTER_ITEMS = new Set([
  'item.863fbb9202f0',
  'item.420807aa841c',
  'item.0b65a783a0be',
  'item.8d204432b7c7',
  'item.e7be31fb263e',
  'item.7983e741c7aa',
  'item.ba4689f0d16e',
  'item.144bb836f528',
  'item.e64616afcaf9',
  'item.01fc2f9fcdd0',
  'item.9aee50455247',
  'item.6427173452f4',
  'item.d6c307d21998',
  'item.9e512e70b8f5',
  'item.d4059b59ac59',
  'item.f4e2ba3acfd6',
  'item.d92a7c500de4',
  'item.dc8cc83e01e7',
  'item.387fb9c622d2',
  'item.9efe42c4e01c',
  'item.dde24d4c9b7c',
  'item.ce7c8467ddb3',
  'item.8e9428543291',
  'item.a087b0ab4c3b',
  'item.c9611681dcca',
  'item.1cf05e6b7716',
  'item.5c24c3ef6591',
  'item.ec0f6225e0a6',
  'item.0689031c79ed',
  'item.349023b0246d',
  'item.9308bed876c7',
  'item.612528548655',
  'item.102464b0e25b',
  'item.e1b224d7294b',
  'item.501441d1853e',
  'item.fc74f0320a1c',
  'item.7eba1cb561c5',
  'item.eb56a1ab24d9',
  'item.8843a7774432',
  'item.10f729956b77',
])

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

/**
 * The exact three ratified Gate 2 `ALLOW` grants.
 *
 * Standing Constraint #13: an allowlist pins identity, LOCATION and VALUE. Keying on the rule ID
 * alone would let any future artifact wearing one of these names inherit the only `ALLOW` in the
 * registry, and would forgive a changed grant rather than only the historical one. So each entry
 * additionally pins the source and item the grant is bound to, the exact normalized value digest
 * of that item, and the exact authority claim. Every axis must match; failing any one of them
 * makes the rule an ordinary rule whose `ALLOW` is then refused as an escalation.
 */
const R12_GATE2_ALLOW_GRANTS: Readonly<
  Record<
    string,
    {
      readonly sourceId: string
      readonly itemId: string
      readonly valueDigest: string
      readonly authorityClaim: string
    }
  >
> = {
  'rule.fk-charter.15a44cf50bc6': {
    sourceId: 'fk-charter',
    itemId: 'item.15a44cf50bc6',
    valueDigest: '7b1455e4deea2f7a7227ec6bc8a68ebfcf1afe7b0ff3c7614c048ddeaf1e67e0',
    authorityClaim: 'coordinator-may-dispatch-fk-p0-through-fk-p21-conditionally',
  },
  'rule.fk-loop-directive.47a75730afd6': {
    sourceId: 'fk-loop-directive',
    itemId: 'item.47a75730afd6',
    valueDigest: '6143d020d8b0b5b150b75982630714dd81d76d6e0cbbec796a6cb5bc0090831a',
    authorityClaim: 'coordinator-may-dispatch-fk-p0-through-fk-p21-conditionally',
  },
  'rule.fk-loop-directive.bfffee6d7c1f': {
    sourceId: 'fk-loop-directive',
    itemId: 'item.bfffee6d7c1f',
    valueDigest: '0b622848f73f596b86715d031dc5bb3495de074d7304f527d1590042110ed75b',
    authorityClaim: 'coordinator-may-dispatch-fk-p0-through-fk-p21-conditionally',
  },
}

function isApprovedGate2Allow(rule: AuthorityRule): boolean {
  const grant = R12_GATE2_ALLOW_GRANTS[rule.ruleId]
  if (grant === undefined) return false
  return (
    rule.authorityBasisRef.sourceId === grant.sourceId &&
    rule.authorityBasisRef.itemId === grant.itemId &&
    rule.authorityBasisRef.valueDigest === grant.valueDigest &&
    rule.authorityClaim === grant.authorityClaim
  )
}

const R11_PROTECTED_NORMATIVE_ITEMS: Readonly<Record<string, string>> = {
  'spec-convention:item.276e79bdc002':
    'Every dispatchable spec must contain an `## Allowed Files` body section listing each file the parcel may create, edit, move, or delete. Entries are exact repo-relative paths; globs and directory-wide shorthand are prohibited.',
  'spec-convention:item.c4828bcd6dfa':
    'If implementation requires a path not listed in `Allowed Files`, work stops until the coordinator ratifies a spec amendment. An agent must not expand its own authority because a related edit appears useful.',
  'parcel-driven-development:item.78ff0093607e':
    'Agents do not edit approved contracts directly from parcel branches.',
  'parcel-driven-development:item.cef628a1fce0':
    'Every agent session that changes code, docs, config, contracts, or evidence must produce a session handoff.',
}

const RECONCILIATION_CONTRACT = {
  'registry-rework-446700d': {
    topic: R31_RECONCILIATION.topic,
    status: R31_RECONCILIATION.migrationStatus,
    refs: R31_RECONCILIATION.observedRefs.map((ref) => `${ref.sourceId}:${ref.itemId}`),
    rules: R31_RECONCILIATION.authoritativeRuleIds,
  },
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
      'spec-frontmatter-schema:item.bdf997c3cd45',
      'spec-linter-validator:item.092d2fc43a32',
      'spec-linter-validator:item.fb7d76a32df4',
      'spec-linter-validator:item.80563af1788e',
      'spec-linter-readme:item.9a889881a236',
      'spec-linter-readme:item.b4f5d76d68ec',
      'spec-convention:item.e6f5fa8543a1',
    ],
    rules: [
      'rule.spec-frontmatter-schema.bdf997c3cd45',
      'rule.spec-linter-readme.9a889881a236',
      'rule.spec-linter-readme.b4f5d76d68ec',
      'rule.spec-convention.e6f5fa8543a1',
    ],
  },
  'surfaces-allowed-files': {
    topic: 'Routing metadata surfaces versus exact body-level Allowed Files authority.',
    status: 'resolved-for-fk',
    refs: [
      'spec-convention:item.ac5ff7afd06f',
      'spec-convention:item.5145ab15549c',
      'spec-convention:item.fd82127bf9f9',
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
      'rule.permission-profiles-readme.729be3615f8d',
      'rule.permission-profiles-readme.d11b9d38f924',
      'rule.permission-profiles-readme.1101805f1c9e',
      'rule.permission-profiles-readme.415efa3f5e3b',
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
  'registry-rework-00b41b7': {
    topic: 'R6 registry bindings superseded by the coordinator-ratified FK-P0 R7 amendment.',
    status: 'superseded-by-amendment',
    refs: ['fk-charter:item.d2'],
    rules: ['rule.fk-charter.d2'],
  },
  'registry-rework-37afc65': {
    topic: 'R7 registry bindings superseded by the coordinator-ratified FK-P0 R8 amendment.',
    status: 'superseded-by-amendment',
    refs: ['fk-charter:item.d10'],
    rules: ['rule.fk-charter.d10'],
  },
  'registry-rework-91145d7': {
    topic: 'R8 registry bindings superseded by the coordinator-ratified FK-P0 R9 amendment.',
    status: 'superseded-by-amendment',
    refs: ['fk-charter:item.5c1f19dd9911'],
    rules: ['rule.fk-charter.5c1f19dd9911'],
  },
  'registry-rework-1b42f4b': {
    topic: 'R9 registry bindings superseded by the coordinator-ratified FK-P0 R10 amendment.',
    status: 'superseded-by-amendment',
    refs: ['coordinator-pattern:item.d62734f662a0'],
    rules: ['rule.coordinator-pattern.d62734f662a0'],
  },
  'registry-rework-ee29973': {
    topic: 'R10 registry bindings superseded by the coordinator-ratified FK-P0 R11 amendment.',
    status: 'superseded-by-amendment',
    refs: ['spec-convention:item.c4828bcd6dfa'],
    rules: ['rule.spec-convention.c4828bcd6dfa'],
  },
  'registry-rework-544d8a3': {
    topic: 'R11 registry bindings superseded by the coordinator-ratified FK-P0 R12 amendment.',
    status: 'superseded-by-amendment',
    refs: ['spec-convention:item.c4828bcd6dfa'],
    rules: ['rule.spec-convention.c4828bcd6dfa'],
  },
  'registry-rework-0683bc0': {
    topic: 'R12 registry bindings superseded by the coordinator-ratified FK-P0 R13 amendment.',
    status: 'superseded-by-amendment',
    refs: ['fk-charter:item.2a524c1ea63f'],
    rules: ['rule.fk-charter.2a524c1ea63f'],
  },
  // R22 obligation 6: the attestation the head carries is pinned by IDENTITY, not by bytes. These
  // fields survive regeneration - `refs` compares sourceId:itemId only, never the digests - so the
  // head stays free to declare a fresh live manifest while its R14 attestation cannot be hollowed
  // out in place. That in-place rewrite validated green with zero violations before R22.
  'registry-rework-df8155a': {
    topic: 'R13 registry bindings superseded by the coordinator-ratified FK-P0 R14 rework.',
    status: 'superseded-by-amendment',
    refs: ['fk-charter:item.2a524c1ea63f'],
    rules: ['rule.fk-charter.2a524c1ea63f'],
  },
  'registry-rework-40394be': {
    topic: 'R14 registry bindings superseded by the coordinator-ratified FK-P0 round-6 amendments.',
    status: 'superseded-by-amendment',
    refs: ['fk-charter:item.2a524c1ea63f', 'fk-loop-directive:item.3fe253f7c599'],
    rules: ['rule.fk-charter.2a524c1ea63f', 'rule.fk-loop-directive.3fe253f7c599'],
  },
  'registry-rework-66a514d': {
    topic:
      'Round-6 registry bindings superseded by the coordinator-ratified FK-P0 R30 corpus adoption.',
    status: 'superseded-by-amendment',
    refs: ['fk-charter:item.f081be090f04', 'fk-loop-directive:item.c98e1f76aeb5'],
    rules: [
      'rule.fk-charter.f081be090f04.adoption',
      'rule.fk-loop-directive.c98e1f76aeb5.continuation',
    ],
  },
} as const

const PRIOR_R11_BINDING_MANIFEST_DIGEST =
  'dd775924c5fe88f24f3aa1c545e2501fe9ca3ef8f9cedb0541cf043d0ae36257'
const PRIOR_R12_BINDING_MANIFEST_DIGEST =
  '1186818bad7da994a1a5b3572211bebe059a64d8ca6ba0d5845d5eca5c9e137a'
const SEMANTIC_EQUIVALENCE: readonly {
  readonly authoritySubject: string
  readonly authorityClaim: string
  readonly ruleIds: readonly string[]
  readonly rationale: string
}[] = [
  {
    authoritySubject: 'spec.mutation-authority',
    authorityClaim: 'exact-allowed-files-required',
    ruleIds: [
      'rule.fk-charter.d10',
      'rule.spec-convention.5145ab15549c',
      'rule.spec-convention.fd82127bf9f9',
    ],
    rationale: 'Each item independently requires exact Allowed Files as parcel mutation authority.',
  },
  {
    authoritySubject: 'gate2.dispatch-grant',
    authorityClaim: 'coordinator-may-dispatch-fk-p0-through-fk-p21-conditionally',
    ruleIds: [
      'rule.fk-charter.15a44cf50bc6',
      'rule.fk-loop-directive.47a75730afd6',
      'rule.fk-loop-directive.bfffee6d7c1f',
    ],
    rationale:
      'The charter and loop restatements preserve the same conditional coordinator dispatch grant.',
  },
  {
    authoritySubject: 'gate3.merge-authority',
    authorityClaim: 'human-owned-nondelegated',
    ruleIds: [
      'rule.fk-charter.b1ac4aa9eddf',
      'rule.fk-charter.c74628d41600',
      'rule.fk-loop-directive.08b3cbb91027',
      'rule.fk-loop-directive.7eb6018d9e57',
      'rule.fk-loop-directive.2743c2f8c558',
      'rule.foreman-line-plan.c92333c21e64',
    ],
    rationale: 'Each item states that the merge decision remains human-owned.',
  },
  {
    authoritySubject: 'verification.issue-authority',
    authorityClaim: 'architecture-risk-two-fresh-independent-reviews-required',
    ruleIds: ['rule.fk-charter.5c1f19dd9911', 'rule.fk-loop-directive.ce9042d917b2'],
    rationale:
      'The charter and loop restatements require the same two fresh independent reviews for architecture-risk parcels.',
  },
  {
    authoritySubject: 'goal.stop.serialization-ownership',
    authorityClaim: 'stop-when-owned-serialization-point-has-no-ratified-sequence',
    ruleIds: ['rule.fk-charter.0afd841f51f8', 'rule.fk-loop-directive.c708d8f95113'],
    rationale:
      'The charter and loop restatements impose the same serialization-ownership stop condition.',
  },
  {
    authoritySubject: 'goal.stop.user-change-collision',
    authorityClaim: 'stop-on-user-owned-required-file-collision',
    ruleIds: ['rule.fk-charter.2cbbc7ae0192', 'rule.fk-loop-directive.c55a33cc847f'],
    rationale:
      'The charter and loop restatements impose the same user-owned required-file collision stop condition.',
  },
  {
    authoritySubject: 'gate1.ratification-authority',
    authorityClaim: 'explicit-developer-ratification-required',
    ruleIds: ['rule.coordinator-pattern.a3d15fe678e1', 'rule.goal-skill.8fda5f4d9776'],
    rationale:
      'The coordinator pattern and goal skill independently preserve explicit developer ratification as the Gate 1 authority boundary.',
  },
  {
    authoritySubject: 'verification.issue-authority',
    authorityClaim: 'coordinator-consumes-but-does-not-produce',
    ruleIds: ['rule.coordinator-pattern.a18d27d46b1e', 'rule.goal-skill.100b2d3e99ce'],
    rationale:
      'The coordinator pattern and goal skill independently withhold verification issuance from the coordinator while allowing it to consume reviewer verdicts.',
  },
]
const PRIOR_R3_BINDING_MANIFEST_DIGEST =
  '48a82df7d6da19352e4c9d2d99195835743a27f163a5d13a4f8d5b2a76a75a61'
const PRIOR_R4_BINDING_MANIFEST_DIGEST =
  '375ea566b2858d3204d17e0625332167a373b555db6d3a8b741af88f1390e082'
const PRIOR_R5_BINDING_MANIFEST_DIGEST =
  '589c6c3ea98147a951ab8887fd70a1a1c50e8b84953abcbe51b152a256da6ad9'
const PRIOR_R6_BINDING_MANIFEST_DIGEST =
  '644e1336c2e4309bc75954cb24e921d4cf6d3a75b0ccc7cb926de34a8ca553c6'
const PRIOR_R7_BINDING_MANIFEST_DIGEST =
  '2a12cde0f3ae481462c74cb5c0cb2377514f628cb0091c26f916705a4778de77'
const PRIOR_R8_BINDING_MANIFEST_DIGEST =
  'dc213f213342f6ac744bf4ece7c3c322315d6946f894b7bfbd37db96954d0002'
const PRIOR_R9_BINDING_MANIFEST_DIGEST =
  '825b3a04cdd506762cba1bbb6c7d007dd4b163e40be5dad733b97482d92f9df6'
const PRIOR_R10_BINDING_MANIFEST_DIGEST =
  '99d9bed01cd5a7957457e24c82cbcc3645ebf591415d6072c26130d3b8a2e8d7'

const RECONCILIATION_PROSE: Readonly<Record<string, readonly [string, string]>> = {
  'registry-rework-446700d': [
    R31_RECONCILIATION.scopedDisposition,
    R31_RECONCILIATION.unresolvedConsequence,
  ],
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
  'registry-rework-00b41b7': [
    'The R7 item-specific curation, protected evidence, and complete discovery contract supersedes the R6 registry bindings in FK scope.',
    'Future binding changes require another typed prior-to-new migration record.',
  ],
  'registry-rework-37afc65': [
    'The R8 protected exits, literal applicability, evidence, and unified Markdown discovery contract supersedes the R7 registry bindings in FK scope.',
    'Future binding changes require another typed prior-to-new migration record.',
  ],
  'registry-rework-91145d7': [
    'The R9 protected publications, per-item classification, loop semantics, and raw-fence contract supersede the R8 registry bindings in FK scope.',
    'Future binding changes require another typed prior-to-new migration record.',
  ],
  'registry-rework-1b42f4b': [
    'The R10 universal Markdown custody, source-honest goal and coordinator semantics, precise Gate 3 scope, and complete rework-evidence contract supersede the R9 registry bindings in FK scope.',
    'Future binding changes require another typed prior-to-new migration record.',
  ],
  'registry-rework-ee29973': [
    'The R11 structural Markdown identity, atomic compound semantics, protected normative blocks, mediated profile scope, and explicit Gate 2 decision contract supersede the R10 registry bindings in FK scope.',
    'Future binding changes require another typed prior-to-new migration record.',
  ],
  'registry-rework-544d8a3': [
    'The R12 end-to-end structural Markdown identity, exact binding Gate 2 grant set, profile-container exclusion, and typed migration contract supersede the R11 registry bindings in FK scope.',
    'Future binding changes require another typed prior-to-new migration record.',
  ],
  'registry-rework-0683bc0': [
    'The R13 normative Markdown audit, fail-closed public resolver, structural YAML profile model, lineHint-free identity, and duplicate keyed-table refusal supersede the R12 registry bindings in FK scope.',
    'Future binding changes require another typed prior-to-new migration record.',
  ],
  'registry-rework-df8155a': [
    'The R14 genesis-anchored migration chain, digest-verified retirement evidence, fail-closed resolver query guard, and re-bound charter and loop-directive sources supersede the R13 registry bindings in FK scope.',
    'Future binding changes require another typed prior-to-new migration record.',
  ],
  // R24. The prose is longer than every record before it because it carries a REDUCTION in an
  // audited set, and R28 requires the vanished item's final digests to be pinned somewhere the
  // validator freezes byte-exactly. `observedRefs` cannot hold them - `sourceRefViolations`
  // requires every ref to resolve to a live item with matching digests, and this item no longer
  // exists in the inventory - so they are pinned in the disposition text itself.
  'registry-rework-40394be': [
    'The R24-R29 round-6 volatile-region and curation rework supersedes the R14 registry bindings in FK scope. The declared volatile regions are excised before block discovery and ordinal assignment, so operational state cannot displace a governed sibling. The source baseline advances to the commit whose bytes were hashed. rule.fk-loop-directive.ae7854c7dad1 is DE-PUBLISHED, not retired: its subject goal.current-state-record and claim stage-zero-complete-and-fk-p0-next were an operational status snapshot published as canon, and its backing item is excised from inventory. Its final locatorDigest was cd404753257ddc78f7d8f473b679ce9410d745af89a459363f029838e6941c6c and its final valueDigest was 39dd6f0a5551d6fde0f694415fcb01f6f407115c1ca5a74da7b570239d61f371. The unpublished FK-P0 queue audit candidate is also removed because its audited signal was solely the now-volatile State cell; its final locatorDigest was 7fcf048fef2f8f007fe9083fabccf58cea064025f51a0468f471144e94818de5 and its final valueDigest was 1a430cadb645418f777ef2827628d2efe92cde3b84ab1337589f20c335615262. Standing authorization 8 is now published as pre-action-refusal / REFUSE under kernel-policy and is quoted exactly: 8. **The ambient `D:/Repos/agent-skills` checkout carries user-owned changes. Never touch or absorb them.** No agent working this goal — coordinator, builder, reviewer, or shaping session — reads from or writes to the ambient checkout, and no user-owned change is absorbed into a parcel branch. Relocated here from `## Current state` by R27, because it is a prohibition and was sitting in a section declared volatile, curated `ruleIds: []` with a boilerplate rationale asserting it stated no rule. It states a rule.',
    'Future binding changes require another typed prior-to-new migration record. Declaring a new volatile region over an already-published locator remains refused, so any future region that would absorb governed text requires a spec amendment first.',
  ],
  'registry-rework-66a514d': [
    'R30 adopts the committed September 7 charter and loop within the unchanged eighteen-source set. Preserve all nineteen prior reconciliation records canonically. Add 47 body items and 11 headings; change D21 and ledger paragraph 3 source values; add 72 source-bound rules, including four unchanged-ledger repairs, and 53 audit dispositions. Add exactly 67 reciprocal corroboration links: 57 to L5, 9 to D21, and 1 to L4. Preserve all existing rule identities, including both D21 bindings; no item/rule removals or locator-identity changes. The nine event and permission facts are noncontrolling provenance, never runtime grants. All 72 reserved shapes carry human-ratified source intent only.',
    'Future binding changes require another typed prior-to-new migration record; human Gate 3, complete verification, independent review and exact source/authority boundaries remain mandatory.',
  ],
}

const RECONCILIATION_RECORD_DIGESTS: Readonly<Record<string, string>> = {
  'registry-rework-66a514d': '6d39f17f70b25ce44030e729c62d975b45a8597b99af8c22f19c6a3cbfba92d7',
  'gate-namespace-count': '23f3549859f81eddfd5645dc3de3ffe07997c624cd75d61d3410645b710968d3',
  'gate3-delegation': '13f5094dc781381ad5c1124f094af5f6f57b462c73df3fd3925e2b844c3f53c6',
  'spec-linter-profile-behavior':
    '48c147ae850d5779e763c187ee9381bc2b824e299764eeb15869f57dce2e553c',
  'surfaces-allowed-files': 'c7addc8070757f6da21ae15354139d2a39c6f5db2dc164d2534305e0f944d7c1',
  'permission-profile-enforcement-bound':
    '6558689b94ae965d85c60cef8cc7d9086278f38c755276b74953d2613440eda2',
  'missing-provenance-reference':
    'ed49c8796d80a450fbb272d7aaba9c1159225e54bbf5d96e0a441cf757135b80',
  'registry-rework-6eb1c25': 'c2b4971fd67a81df51ab33931fda17122c06de67ce5cc6ef857380704348fd6d',
  'registry-rework-9285945': 'fc10cc1e7f98635521a8fbc65ba34895415b8901d62c49790b8b3e7337fd3fb1',
  'registry-rework-6f45963': '3954ba2fc23122f82f6d68e294a180b8dc789983e2bb3da0198c79f8550513d9',
  'registry-rework-b414d06': '8a7c1fdd61cbb664d6c9b1b0aefcba1dc35dc26873eff711bbfada8480247d7f',
  'registry-rework-00b41b7': '7113ebbad6811a3dfd4f14302f736ac11074c04943686eea28a1de820c75e9c9',
  'registry-rework-37afc65': '5f3bba04f9177884da88d21a8535d3ebc04557252aa27b30cbb191824e0b0f17',
  'registry-rework-91145d7': '6b6e2dbd3b009428c647ed8947ba5d7008445dabdcccdde7d135466b9f46f3e3',
  'registry-rework-1b42f4b': '14bb9b5739d37281619e6ace7ea9e5d0f6fd0febeecf3facc892e1a606795a56',
  'registry-rework-ee29973': 'b9a3ed7f9eaa25468df8557fb812ae343910a481450411928b8abe5d4e216bb3',
  'registry-rework-544d8a3': 'd04e710f14c6f7b9978662161c1bba011a11fe862138dd73e5e477594751fd9d',
  'registry-rework-0683bc0': 'f1a7ee84cb618300079786833537fef4494e093970cffc1ead8d1d66e2bd6aa9',
  // Demoted from chain head by R24's `registry-rework-40394be`. Adding it here is exactly what R22
  // obligation 7 was written to make possible: while it was the head, this entry would have
  // declared the shipped head ineligible to be the head; now that a successor is chained above it,
  // the pin binds it by bytes like the eleven before it, and `recordDigestPinFor` finds it here
  // instead of in the head constant.
  'registry-rework-df8155a': 'ca5015f0446edbc5e1d7055357dac8d60cc87b4d283f0bba9ce26c15b40d88d2',
  'registry-rework-40394be': '307a1b563240107c5a12610e18b340e66f3be0621e6bc30b438ae79af91b4bfd',
}

const LEGACY_RECONCILIATION_SOURCE_REFS: Readonly<Record<string, readonly SourceRef[]>> = {
  'gate3-delegation': [
    {
      sourceId: 'fk-charter',
      itemId: 'item.b1ac4aa9eddf',
      locatorDigest: 'f8ffc0669f2e67b5d14d6916c639d77d2d1170f687d2da78aee73d35eec09cbf',
      valueDigest: '4d67d991b566cac23d275df38b820b75259a5d273e7e506f3aaf53fea3a2666f',
    },
  ],
  'registry-rework-91145d7': [
    {
      sourceId: 'fk-charter',
      itemId: 'item.5c1f19dd9911',
      locatorDigest: 'd696d9d5da3531f0be97ae65cb027077c47a113eeefc0de56d5f0ea56dcd8232',
      valueDigest: '0ea8cda783fed8e481cfcd52c013825f674c6acfc5eb4c5214d1748f55b62b34',
    },
  ],
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

/**
 * Genesis anchor for the binding-manifest migration chain: the `resultDigest` of the first
 * migration record's `registry-binding-manifest` command, i.e. the manifest of the pre-rework
 * registry. This pins the ORIGIN of history, not the present state.
 *
 * It is deliberately the only pinned manifest value. A hardcoded digest of the CURRENT corpus
 * would be a shipped validation predicate over the source snapshot, which the spec's Constraints
 * and AC3 both forbid, and would mean exactly one registry document could ever be valid.
 */
const GENESIS_BINDING_MANIFEST_DIGEST =
  '1fe3a7c66241904445021c97db68065961a3bf5beceb654faff4b552b4de79b2'

/**
 * The source snapshot the R1-R13 migration records were authored against.
 *
 * Historical records embed this commit as their own Git evidence and are byte-frozen by
 * `RECONCILIATION_RECORD_DIGESTS`, so their assertions must compare against the snapshot that was
 * current WHEN THEY WERE WRITTEN, not against the document's live `sourceSnapshotCommit`. Comparing
 * them to the live value would make every historical record fail the moment the source baseline
 * legitimately advances - which is precisely the advance the migration chain exists to record.
 */
export const LEGACY_SOURCE_SNAPSHOT_COMMIT = '51857a3a7796b393c0c0a68712f98c06e7015d79'

/** Prefix identifying a migration-chain record. Other reconciliations are not chain members. */
const MIGRATION_CHAIN_PREFIX = 'registry-rework-'

/** Command-evidence prefix restating the predecessor manifest. */
const PRIOR_MANIFEST_COMMAND_PREFIX = 'registry-binding-manifest'

/** Command-evidence prefix declaring the manifest this record supersedes to. */
const SUPERSEDING_MANIFEST_COMMAND_PREFIX = 'superseding-binding-manifest'

/**
 * The tool a chain head's command evidence must be issued by (AC4 obligation 3, R19).
 *
 * A string literal, not an import: `tests/bare-specifier.test.ts` forbids this package from
 * importing its own scope by bare specifier, and the value here is an assertion ABOUT evidence
 * rather than a module reference.
 */
const AUTHORITY_REGISTRY_TOOL = '@foreman-line/authority-registry'

interface ChainLink {
  readonly record: ReconciliationRecord
  /** `superseding-*.inputDigest` - the predecessor manifest this record chains from. */
  readonly prevDigest: string
  /** `superseding-*.resultDigest` - the manifest this record supersedes TO. */
  readonly nextDigest: string
  /** `registry-binding-manifest*.resultDigest` - an independent restatement of `prevDigest`. */
  readonly restatedPrevDigest: string
}

interface ParsedCommandResult {
  commandId?: unknown
  inputDigest?: unknown
  resultDigest?: unknown
  tool?: unknown
  toolVersion?: unknown
  exitCode?: unknown
  actorClass?: unknown
}

function parsedCommandResults(record: ReconciliationRecord): ParsedCommandResult[] {
  return record.observedEvidence
    .filter((evidence) => evidence.kind === 'command-result')
    .flatMap((evidence) => {
      try {
        return [JSON.parse(evidence.reference) as ParsedCommandResult]
      } catch {
        return []
      }
    })
}

function commandsWithPrefix(
  record: ReconciliationRecord,
  prefix: string,
): readonly ParsedCommandResult[] {
  return parsedCommandResults(record).filter(
    (command) => typeof command.commandId === 'string' && command.commandId.startsWith(prefix),
  )
}

/**
 * Extract the chain link a migration record declares, or `null` if it is malformed.
 *
 * The link is the `superseding-binding-manifest*` command's `inputDigest` -> `resultDigest` pair.
 * The companion `registry-binding-manifest*` command restates the predecessor in its own
 * `resultDigest`, which is checked as an independent second axis.
 *
 * Note that `registry-binding-manifest*.inputDigest` is NOT chain state: it is commit-derived and
 * is the same constant across eight consecutive records, so treating it as the link would produce
 * a false pass over most of the chain.
 */
/** Either the record's single well-formed chain link, or why it does not declare one. */
type ChainLinkResult = { readonly link: ChainLink } | { readonly problem: string }

function chainLinkFor(record: ReconciliationRecord): ChainLinkResult {
  const superseding = commandsWithPrefix(record, SUPERSEDING_MANIFEST_COMMAND_PREFIX)
  const restatement = commandsWithPrefix(record, PRIOR_MANIFEST_COMMAND_PREFIX)
  // AC4 obligation 1 as amended by R19: EXACTLY ONE chain command of each kind, established by
  // `filter(...).length`, never by `find`. Selecting the first match and ignoring the rest was the
  // defect: a second superseding command sharing a predecessor and declaring a different successor
  // is a fork INSIDE one record, and across-record fork detection keys on `prevDigest` BETWEEN
  // records, so it cannot see one. Unshifting a shadow link therefore bound the chain to the
  // manifest of a tampered document while the honest link sat untouched below it, reporting
  // `valid: true` with zero violations.
  if (superseding.length !== 1 || restatement.length !== 1) {
    return {
      problem: `declares ${restatement.length} prior and ${superseding.length} superseding binding-manifest commands; exactly one of each is required`,
    }
  }
  const single = superseding[0]
  const restated = restatement[0]
  if (
    single === undefined ||
    restated === undefined ||
    typeof single.inputDigest !== 'string' ||
    typeof single.resultDigest !== 'string' ||
    typeof restated.resultDigest !== 'string'
  ) {
    return { problem: 'does not declare a well-formed prior-to-new binding manifest chain link' }
  }
  return {
    link: {
      record,
      prevDigest: single.inputDigest,
      nextDigest: single.resultDigest,
      restatedPrevDigest: restated.resultDigest,
    },
  }
}

/**
 * The record-digest binding for an id: the shipped pin table, plus the shipped head's own constant.
 *
 * R22 obligation 7 - a properly chained new head must be ADMITTED. Before R22 the demoted former
 * head needed an entry in `RECONCILIATION_RECORD_DIGESTS` it did not have, so appending was refused
 * and the only file-only route that passed was the one that ERASED the attestation. That inverted
 * the accepted residual from append-only into history-destroying.
 */
function recordDigestPinFor(reconciliationId: string): string | undefined {
  if (reconciliationId === SHIPPED_CHAIN_HEAD_ID) return SHIPPED_CHAIN_HEAD_RECORD_DIGEST
  return RECONCILIATION_RECORD_DIGESTS[reconciliationId]
}

/**
 * AC4 obligations 2 and 3 as amended by R19 - the floor the chain head must clear.
 *
 * The head is the one record not bound by a record digest WHILE IT IS THE HEAD, because it is bound
 * instead to the manifest recomputed live from the document it sits in. That exemption has to be a
 * NARROWER binding than a pin and never a weaker one; before R19 nothing constrained the head's
 * content at all, and two independent reviewers each drove a tampered registry through it.
 */
function headFloorViolations(
  record: ReconciliationRecord,
  document: AuthorityEnforcementRegistry,
): ValidationViolation[] {
  const violations: ValidationViolation[] = []
  // Obligation 2: a pinned record is never the head, so head position is not selectable by
  // deletion. Keyed on ID PRESENCE in the pin table, never on byte-match against it - byte-match
  // would let a tamperer mutate a pinned record first, breaking its own match, and only then
  // delete the head to promote it, which is one step past where the obvious implementation stops.
  if (RECONCILIATION_RECORD_DIGESTS[record.reconciliationId] !== undefined) {
    violations.push(
      violation(
        'MIGRATION_EVIDENCE_INVALID',
        `reconciliation '${record.reconciliationId}' holds a pinned record digest and cannot be the migration chain head; deleting the head invalidates the document rather than promoting a pinned record out of its pin`,
      ),
    )
  }
  // Obligation 3: a record meeting the schema minimums but not this shape is not a head.
  if (record.migrationStatus !== 'superseded-by-amendment') {
    violations.push(
      violation(
        'MIGRATION_EVIDENCE_INVALID',
        `migration chain head '${record.reconciliationId}' does not declare migrationStatus 'superseded-by-amendment'`,
      ),
    )
  }
  if (record.supersedingEvidence === null) {
    violations.push(
      violation(
        'MIGRATION_EVIDENCE_INVALID',
        `migration chain head '${record.reconciliationId}' declares no superseding evidence`,
      ),
    )
  }
  if (
    !record.observedEvidence.some(
      (evidence) => evidence.kind === 'git-commit' && /^[0-9a-f]{40}$/.test(evidence.reference),
    )
  ) {
    violations.push(
      violation(
        'MIGRATION_EVIDENCE_INVALID',
        `migration chain head '${record.reconciliationId}' carries no git-commit evidence naming a forty-character lowercase hex commit`,
      ),
    )
  }
  // AC4 obligation 3 as amended by R22: the predicate binds THE TWO CHAIN COMMANDS THEMSELVES,
  // never `.some()` over every command-result on the record. Under `.some()` a single decoy entry
  // satisfied the check while the real prior and superseding commands carried tool 'attacker',
  // `actorClass: 'anonymous'` and `exitCode: 137` - measured `valid: true`, zero violations, against
  // a control that refused. Free against the shipped registry: 24 of 24 chain commands already
  // satisfy the stricter form.
  const chainCommands = [
    ...commandsWithPrefix(record, PRIOR_MANIFEST_COMMAND_PREFIX),
    ...commandsWithPrefix(record, SUPERSEDING_MANIFEST_COMMAND_PREFIX),
  ]
  if (
    chainCommands.length === 0 ||
    !chainCommands.every(
      (command) =>
        command.tool === AUTHORITY_REGISTRY_TOOL &&
        command.actorClass === 'coordinator' &&
        command.exitCode === 0,
    )
  ) {
    violations.push(
      violation(
        'MIGRATION_EVIDENCE_INVALID',
        `migration chain head '${record.reconciliationId}' does not declare both binding-manifest chain commands as issued by this tool with actorClass 'coordinator' and exitCode 0`,
      ),
    )
  }
  // AC4 obligation 5 as amended by R23 - the head-scoped Git provenance binder.
  //
  // R22 left the head's Git provenance entirely fabricable: two DISTINCT forty-hex values satisfy
  // cardinality and reference-distinctness trivially, and setting the prior command's `inputDigest`
  // to `sha256(fabricated)` makes obligation 4 self-consistent because the attacker controls both
  // sides of it. Measured at cc57658, with and without a payload retiring every rule asserting that
  // Gate 3 merges are human-owned: `valid: true`, zero violations.
  //
  // R22 rejected this binder as "not free" on an ALL-RECORDS census (13 of 24 / 15 of 24). That
  // number was taken at the wrong scope: the defect is head-only, and at head scope the binder is
  // free - the head's two references are the one bound by its prior command and the document's own
  // `sourceSnapshotCommit`. The other eleven records carry a HISTORICAL snapshot, which is exactly
  // why the wide version failed and the narrow one does not.
  //
  // Unlike every other head obligation this one is STRUCTURAL rather than id-keyed, so it applies to
  // whatever record is the head - the first head obligation that generalises to successors.
  const headGitEvidence = record.observedEvidence.filter(
    (evidence) => evidence.kind === 'git-commit',
  )
  const priorChainCommands = commandsWithPrefix(record, PRIOR_MANIFEST_COMMAND_PREFIX)
  for (const evidence of headGitEvidence) {
    const boundByPriorCommand = priorChainCommands.some(
      (command) => sha256(evidence.reference) === command.inputDigest,
    )
    if (boundByPriorCommand) continue
    if (evidence.reference === document.sourceSnapshotCommit) continue
    violations.push(
      violation(
        'MIGRATION_EVIDENCE_INVALID',
        `migration chain head '${record.reconciliationId}' carries a git-commit reference that is neither bound by its prior binding-manifest command nor equal to the document's own sourceSnapshotCommit`,
      ),
    )
  }

  return violations
}

/**
 * AC4 obligations 4 and 5 as amended by R21.
 *
 * Obligation 4 - every reference is bound by a digest computed over it, and no digest is ever
 * verified by comparison with itself. `source-ref`, `command-result` and `missing-path` digests are
 * the SHA-256 of their own reference and are checked as such where the evidence is walked. A
 * `git-commit` digest attests the commit OBJECT BODY and so cannot be, which R19's literal wording
 * missed and R21 corrects: the binding is structural instead. The prior-binding-manifest command's
 * `inputDigest` is the SHA-256 of a `git-commit` reference on the same record, so REPOINTING that
 * reference breaks the binding - and so does DELETING the evidence, which is what closes the head's
 * last evidence hole.
 *
 * Obligation 5 - evidence entries are distinct by kind, reference and digest together. Duplicating
 * a `git-commit` entry breaks no cardinality rule, no head shape and no pin, so on the head it was
 * simply undetectable.
 *
 * Both are free against the shipped registry: 12 of 12 chain records already satisfy the binding,
 * and there are zero duplicate evidence entries. Neither is corpus-dependent.
 */
function evidenceBindingViolations(record: ReconciliationRecord): ValidationViolation[] {
  const violations: ValidationViolation[] = []
  // AC4 obligation 5 as amended by R22. Distinctness by the full (kind, reference, digest) triple
  // was defeated by VARYING the digest, and nothing constrained how many git-commit entries a chain
  // record carried - so deleting the unbound second entry, adding a fabricated one, and duplicating
  // the bound reference under a different digest were all admitted. Both narrowings are free against
  // the shipped registry: 12 of 12 chain records carry exactly two git-commit entries, and 12 of 12
  // have references distinct by reference alone.
  if (record.reconciliationId.startsWith(MIGRATION_CHAIN_PREFIX)) {
    const gitEvidence = record.observedEvidence.filter((evidence) => evidence.kind === 'git-commit')
    if (gitEvidence.length !== 2) {
      violations.push(
        violation(
          'MIGRATION_EVIDENCE_INVALID',
          `migration record '${record.reconciliationId}' declares ${gitEvidence.length} git-commit evidence entries; exactly two are required`,
        ),
      )
    }
    if (new Set(gitEvidence.map((evidence) => evidence.reference)).size !== gitEvidence.length) {
      violations.push(
        violation(
          'MIGRATION_EVIDENCE_INVALID',
          `migration record '${record.reconciliationId}' repeats a git-commit reference; a differing digest does not make it a second attestation`,
        ),
      )
    }
  }
  const seen = new Set<string>()
  for (const evidence of record.observedEvidence) {
    const identity = canonicalJson({
      kind: evidence.kind,
      reference: evidence.reference,
      digest: evidence.digest,
    })
    if (seen.has(identity)) {
      violations.push(
        violation(
          'MIGRATION_EVIDENCE_INVALID',
          `reconciliation '${record.reconciliationId}' carries the same ${evidence.kind} attestation twice`,
        ),
      )
    }
    seen.add(identity)
  }
  for (const command of commandsWithPrefix(record, PRIOR_MANIFEST_COMMAND_PREFIX)) {
    if (
      !record.observedEvidence.some(
        (evidence) =>
          evidence.kind === 'git-commit' && sha256(evidence.reference) === command.inputDigest,
      )
    ) {
      violations.push(
        violation(
          'MIGRATION_EVIDENCE_INVALID',
          `reconciliation '${record.reconciliationId}' prior binding manifest command does not bind any git-commit evidence reference on the same record`,
        ),
      )
    }
  }
  return violations
}

export interface MigrationChain {
  /** Records in genesis-to-head order. Empty when the chain could not be walked. */
  readonly path: readonly ChainLink[]
  /** `reconciliationId` of the single chain head, or `null` when there is not exactly one. */
  readonly headId: string | null
  readonly violations: readonly ValidationViolation[]
}

/**
 * Walk the binding-manifest migration chain from the pinned genesis anchor and verify that it is
 * a single unbroken path whose head describes the live document.
 *
 * This replaces the former whole-corpus equality against a hardcoded `SHIPPED_BINDING_MANIFEST_DIGEST`.
 * That constant made exactly one registry content valid, rejected a correctly re-digested registry
 * with a single `MIGRATION_EVIDENCE_INVALID`, and could not be updated by `npm run generate`.
 *
 * The chain preserves the same anti-tamper surface for every historical state while ADMITTING a
 * legitimately amended registry that appends a properly chained record. Per AC4 as amended by R16,
 * a document is invalid if it has zero heads, more than one head (a fork), or a migration record
 * that does not lie on the single genesis-to-head path.
 *
 * Honest limit, documented in the README: this makes silent substitution DETECTABLE, not
 * impossible. Anyone who can edit the file can append a well-formed head record declaring the
 * manifest of a tampered registry. The registry is a contract, not a trust root; real anti-tamper
 * is Git history plus human review.
 */
function verifyMigrationChain(document: AuthorityEnforcementRegistry): MigrationChain {
  const violations: ValidationViolation[] = []
  const chainRecords = document.reconciliations.filter((record) =>
    record.reconciliationId.startsWith(MIGRATION_CHAIN_PREFIX),
  )
  const links: ChainLink[] = []
  for (const record of chainRecords) {
    const result = chainLinkFor(record)
    if ('problem' in result) {
      violations.push(
        violation(
          'MIGRATION_EVIDENCE_INVALID',
          `migration record '${record.reconciliationId}' ${result.problem}`,
        ),
      )
      continue
    }
    const link = result.link
    if (link.restatedPrevDigest !== link.prevDigest) {
      violations.push(
        violation(
          'MIGRATION_EVIDENCE_INVALID',
          `migration record '${record.reconciliationId}' restates a prior binding manifest that disagrees with the digest it chains from`,
        ),
      )
    }
    links.push(link)
  }
  if (links.length !== chainRecords.length) {
    return { path: [], headId: null, violations }
  }

  // Fork detection: two records chaining from the same predecessor would give two heads.
  const byPrev = new Map<string, ChainLink[]>()
  for (const link of links) {
    const existing = byPrev.get(link.prevDigest)
    if (existing === undefined) byPrev.set(link.prevDigest, [link])
    else existing.push(link)
  }
  for (const [prevDigest, forked] of byPrev) {
    if (forked.length > 1) {
      violations.push(
        violation(
          'MIGRATION_EVIDENCE_INVALID',
          `binding manifest chain forks at '${prevDigest}': ${forked
            .map((link) => link.record.reconciliationId)
            .sort()
            .join(', ')}`,
        ),
      )
    }
  }
  if (violations.length > 0) return { path: [], headId: null, violations }

  // Walk the single path from the pinned genesis anchor.
  const path: ChainLink[] = []
  const seen = new Set<string>()
  let cursor = GENESIS_BINDING_MANIFEST_DIGEST
  while (byPrev.has(cursor)) {
    const next = byPrev.get(cursor)?.[0]
    if (next === undefined) break
    if (seen.has(next.record.reconciliationId)) {
      violations.push(
        violation('MIGRATION_EVIDENCE_INVALID', 'binding manifest chain contains a cycle'),
      )
      return { path: [], headId: null, violations }
    }
    seen.add(next.record.reconciliationId)
    path.push(next)
    cursor = next.nextDigest
  }

  if (path.length === 0) {
    violations.push(
      violation(
        'MIGRATION_EVIDENCE_INVALID',
        'binding manifest chain has no record chaining from the genesis anchor',
      ),
    )
    return { path: [], headId: null, violations }
  }
  // No orphans: every migration record must lie on the single genesis-to-head path.
  if (path.length !== links.length) {
    const orphans = links
      .filter((link) => !seen.has(link.record.reconciliationId))
      .map((link) => link.record.reconciliationId)
      .sort()
    violations.push(
      violation(
        'MIGRATION_EVIDENCE_INVALID',
        `migration records do not lie on the single genesis-to-head chain: ${orphans.join(', ')}`,
      ),
    )
    return { path: [], headId: null, violations }
  }

  // The head is bound to the manifest recomputed live from the document it sits in - a stricter
  // assertion than equality with a constant, not an exemption from binding.
  const head = path[path.length - 1] as ChainLink
  violations.push(...headFloorViolations(head.record, document))
  const liveManifest = registryBindingManifestDigest(document)
  if (head.nextDigest !== liveManifest) {
    violations.push(
      violation(
        'MIGRATION_EVIDENCE_INVALID',
        'registry identity, locator, value, rule, or source binding differs from the manifest declared by the migration chain head',
      ),
    )
  }
  return { path, headId: head.record.reconciliationId, violations }
}

/**
 * Whether a Markdown block anchor sits in the DIRECT BODY of the heading at `headingPath`.
 *
 * Direct body, not subtree: a descendant heading's blocks carry the descendant's path, so they do
 * not match and stay governed (R26 ruling 2). The `table-group:` arm is not cosmetic - a second
 * table in the same body is anchored under `<path> > table-group:N`, and without it a published
 * row in that table would be masked by the document layer while passing the hermetic guard.
 */
function anchorInHeadingBody(anchor: string, headingPath: string): boolean {
  return (
    anchor.startsWith(`md-block:${headingPath}:`) ||
    anchor.startsWith(`md-block:${headingPath} > table-group:`)
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
      normativeMarkdownAudit: document.normativeMarkdownAudit,
      // The region set is part of the binding manifest, not metadata beside it. A region decides
      // which bytes of a binding source are outside the inventory, so adding, widening, or
      // retargeting one changes what the registry claims to govern as surely as removing a rule
      // does - and the migration chain head must therefore refuse to cover it silently.
      volatileRegions: document.volatileRegions,
    }),
  )
}

const concreteRoles = ROLE_SCOPES.filter((value) => value !== 'any')
const concreteStages = STAGE_SCOPES.filter((value) => value !== 'any')
const concreteOperations = OPERATION_SCOPES.filter((value) => value !== 'any')
const concreteHosts = HOST_POSTURES.filter((value) => value !== 'any')

/**
 * Structural query guard. Accepts `unknown` deliberately: `resolveAuthority` is an exported
 * API of a `risk: critical` package, so a nullish, non-object, or wrongly-typed query must fail
 * closed rather than throw. Each axis is checked for `typeof === 'string'` before any comparison,
 * because `RegExp.test` and `Array.prototype.includes` both coerce: without the explicit guard
 * `authoritySubject: 1` stringifies to `"1"` and matches the subject pattern.
 */
function queryIsValid(query: unknown): query is AuthorityQuery {
  if (!isRecord(query)) return false
  const { authoritySubject, goal, role, stage, operation, host } = query
  return (
    typeof authoritySubject === 'string' &&
    /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/.test(authoritySubject) &&
    goal === 'foreman-kernel' &&
    typeof role === 'string' &&
    (concreteRoles as readonly string[]).includes(role) &&
    typeof stage === 'string' &&
    (concreteStages as readonly string[]).includes(stage) &&
    typeof operation === 'string' &&
    (concreteOperations as readonly string[]).includes(operation) &&
    typeof host === 'string' &&
    (concreteHosts as readonly string[]).includes(host)
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

function resolveValidatedAuthority(
  document: AuthorityEnforcementRegistry,
  query: unknown,
): AuthorityResolution {
  // Retained as defence in depth even though `resolveAuthority` already guards: this function
  // must be safe against any caller, so it takes `unknown` and narrows through the type guard.
  if (!queryIsValid(query)) {
    return {
      outcome: 'REQUIRE_HUMAN',
      authoritySubject:
        isRecord(query) && typeof query.authoritySubject === 'string'
          ? query.authoritySubject
          : 'invalid.query',
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
  const decisions = [...new Set(controlling.map((rule) => rule.decision))].sort()
  if (claims.length !== 1 || decisions.length !== 1) {
    // Unreachable by construction, and deliberately kept as defence in depth rather than deleted.
    // A highest-tier claim or decision split is exactly the `RULE_CONFLICT` predicate, which is
    // validity-blocking, and resolution never runs against an invalid registry - so amended AC5
    // exposes no `CONFLICT` outcome. If this branch is ever reached the registry is internally
    // inconsistent, so it fails closed instead of silently selecting one side of the split.
    return {
      outcome: 'REQUIRE_HUMAN',
      authoritySubject: query.authoritySubject,
      reasonCode: 'REGISTRY_INVALID',
      controllingRuleIds: [],
      consideredRuleIds,
    }
  }
  // Amended AC5: a resolved result exposes its controlling decision TOGETHER WITH the
  // classification, assurance and enforcement owner behind it, so a structural refusal from a
  // kernel that does not exist cannot be read as a mediated one. The controlling set shares one
  // claim and one decision by construction; where the controlling rules disagree on these
  // honesty fields, the weakest is reported, because the strongest would overclaim.
  const first = controlling[0] as AuthorityRule
  const weakestBy = <T>(order: readonly T[], values: readonly T[]): T =>
    values.reduce((weakest, value) =>
      order.indexOf(value) < order.indexOf(weakest) ? value : weakest,
    )
  return {
    outcome: 'RESOLVED',
    authoritySubject: query.authoritySubject,
    authorityClaim: claims[0] as string,
    decision: decisions[0] as 'ALLOW' | 'REFUSE' | 'ADVISORY' | 'REQUIRE_HUMAN',
    classification: first.classification,
    assurance: weakestBy(
      ASSURANCE_LEVELS,
      controlling.map((rule) => rule.assurance),
    ),
    enforcementOwner: first.enforcementOwner,
    severity: weakestBy(
      SEVERITIES,
      controlling.map((rule) => rule.severity),
    ),
    controllingRuleIds: controlling.map((rule) => rule.ruleId).sort(),
    consideredRuleIds,
  }
}

export function resolveAuthority(document: unknown, query: AuthorityQuery): AuthorityResolution {
  const authoritySubject =
    isRecord(query) && typeof query.authoritySubject === 'string'
      ? query.authoritySubject
      : 'invalid.query'
  if (!validateRegistry(document).valid) {
    return {
      outcome: 'REQUIRE_HUMAN',
      authoritySubject,
      reasonCode: 'REGISTRY_INVALID',
      controllingRuleIds: [],
      consideredRuleIds: [],
    }
  }
  // Fail closed on a malformed query rather than dereferencing it. `null`, `undefined`, and
  // non-object queries previously reached `queryIsValid` unguarded and threw `TypeError`, which
  // a caller with a broad `catch` would turn into a fail-open gate.
  if (!queryIsValid(query)) {
    return {
      outcome: 'REQUIRE_HUMAN',
      authoritySubject,
      reasonCode: 'INVALID_QUERY_SCOPE',
      controllingRuleIds: [],
      consideredRuleIds: [],
    }
  }
  return resolveValidatedAuthority(document as AuthorityEnforcementRegistry, query)
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

function isLegacyReconciliationSourceRef(reconciliationId: string, sourceRef: SourceRef): boolean {
  return (LEGACY_RECONCILIATION_SOURCE_REFS[reconciliationId] ?? []).some(
    (expected) => canonicalJson(expected) === canonicalJson(sourceRef),
  )
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
    'gate1.ratify': ['fk-charter:item.cd014d6d90c5', 'fk-charter:item.d9'],
    'gate2.dispatch': ['fk-charter:item.15a44cf50bc6', 'fk-loop-directive:item.bfffee6d7c1f'],
    'gate3.merge': [
      'fk-charter:item.b1ac4aa9eddf',
      'fk-loop-directive:item.7eb6018d9e57',
      'fk-loop-directive:item.2743c2f8c558',
    ],
    'verification.issue': [
      'spec-convention:item.03f0830cd693',
      'fk-loop-directive:item.dd8203551518',
    ],
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
      if (source.path.endsWith('.md') && item.ruleIds.length > 0) {
        const structuralMarkdown =
          (item.locator.kind === 'line-excerpt' &&
            /^md-block:.*:paragraph:[1-9]\d*$/.test(item.locator.anchor)) ||
          (item.locator.kind === 'numbered-item' &&
            /^md-block:.*:list-item:[1-9]\d*$/.test(item.locator.anchor)) ||
          item.locator.kind === 'table-row'
        if (!structuralMarkdown) {
          violations.push(
            violation(
              'MIGRATION_EVIDENCE_INVALID',
              'published Markdown rule must use canonical structural block identity',
              { sourcePath: source.path, locator: item.locator.anchor },
            ),
          )
        }
        if (item.itemId === `item.${sha256(item.normalizedExcerpt).slice(0, 12)}`) {
          violations.push(
            violation(
              'MIGRATION_EVIDENCE_INVALID',
              'published Markdown item ID must not be derived from mutable content',
              { sourcePath: source.path, locator: item.locator.anchor },
            ),
          )
        }
      }
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
      if (item.exclusionDisposition !== null) {
        if (/metadata, explanatory context, or duplicate provenance/i.test(item.rationale)) {
          violations.push(
            violation('RULE_SEMANTICS_UNCURATED', 'exclusion rationale uses a generic catch-all', {
              sourcePath: source.path,
              locator: item.locator.anchor,
            }),
          )
        }
        const protectedNormative =
          item.locator.kind !== 'heading' &&
          (/^item\.(?:d(?:[1-9]|1\d|20)|r(?:[1-9]|1[0-3])|constraint-(?:[1-9]|1[0-4])|hard-rule-(?:[1-9]|1[0-5]))$/.test(
            item.itemId,
          ) ||
            (source.sourceId === 'fk-charter' &&
              (R9_PROTECTED_CHARTER_ITEMS.has(item.itemId) ||
                (item.locator.anchor.includes('## 9. Goal exit criterion') &&
                  /^\d+\./.test(item.normalizedExcerpt)) ||
                (item.locator.anchor.includes('## 11. Stop conditions') &&
                  item.normalizedExcerpt.startsWith('- ')) ||
                /^\*\*Wave [0-4] exit:\*\*/.test(item.normalizedExcerpt))))
        if (protectedNormative) {
          violations.push(
            violation('RULE_SEMANTICS_UNCURATED', 'protected normative item cannot be excluded', {
              sourcePath: source.path,
              locator: item.locator.anchor,
            }),
          )
        }
        if (
          item.exclusionDisposition === 'duplicate-exact-statement' &&
          !/rule\.[a-z0-9.-]+/.test(item.rationale)
        ) {
          violations.push(
            violation('RULE_SEMANTICS_UNCURATED', 'duplicate exclusion must name the exact rule', {
              sourcePath: source.path,
              locator: item.locator.anchor,
            }),
          )
        }
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

  for (const [ruleId, historicalTarget] of Object.entries(R12_LEGACY_MARKDOWN_RULE_TARGETS)) {
    const relocated =
      ruleId === 'rule.foreman-line-plan.two-gate-thesis'
        ? R31_SOURCE_ITEMS.find((item) => item.itemId === 'item.two-gate-thesis')
        : undefined
    const target =
      relocated === undefined
        ? historicalTarget
        : {
            sourceId: relocated.sourceId,
            kind: relocated.locator.kind,
            anchor: relocated.locator.anchor,
          }
    const rule = document.rules.find((candidate) => candidate.ruleId === ruleId)
    const item = rule
      ? itemsByRef.get(referenceKey(rule.authorityBasisRef.sourceId, rule.authorityBasisRef.itemId))
      : undefined
    if (
      rule === undefined ||
      item === undefined ||
      rule.authorityBasisRef.sourceId !== target.sourceId ||
      item.locator.kind !== target.kind ||
      item.locator.anchor !== target.anchor
    ) {
      violations.push(
        violation(
          'MIGRATION_EVIDENCE_INVALID',
          `R12 legacy Markdown rule '${ruleId}' is not bound to its frozen structural target`,
          { ruleId },
        ),
      )
    }
  }

  const profileSource = sourcesById.get('permission-profiles-registry')
  if (profileSource !== undefined) {
    const profileHeaders = profileSource.inventoryItems.filter((item) =>
      /^\s{2}[a-z][a-z-]+:$/.test(item.locator.anchor),
    )
    const obsoleteHeader = profileSource.inventoryItems.find(
      (item) => item.itemId === 'item.ffd2209ab94a',
    )
    const reviewerDenial = profileSource.inventoryItems.find(
      (item) => item.itemId === 'item.35cf0f58fc34',
    )
    const reviewerDenialRule = document.rules.find(
      (rule) => rule.ruleId === 'rule.permission-profiles-registry.35cf0f58fc34',
    )
    const profileRules = document.rules.filter(
      (rule) => rule.authorityBasisRef.sourceId === 'permission-profiles-registry',
    )
    const containers = profileSource.inventoryItems.filter(
      (item) =>
        item.locator.anchor.startsWith('yaml-container:') &&
        item.exclusionDisposition === 'schema-container',
    )
    const emptyAsks = profileSource.inventoryItems.filter((item) =>
      /:ask:\[\]$/.test(item.locator.anchor),
    )
    const restrictions = profileRules.filter((rule) => rule.classification === 'pre-action-refusal')
    const narrative = profileRules.filter((rule) => rule.classification === 'narrative-provenance')
    if (
      profileHeaders.length !== 6 ||
      profileHeaders.some(
        (item) => item.ruleIds.length > 0 || item.exclusionDisposition === null,
      ) ||
      obsoleteHeader?.normalizedExcerpt !== 'builder-architecture:' ||
      document.rules.some(
        (rule) => rule.ruleId === 'rule.permission-profiles-registry.ffd2209ab94a',
      ) ||
      reviewerDenial?.locator.anchor !== 'yaml-rule:reviewer-readonly:deny:"Bash(git commit*)"' ||
      reviewerDenial.ruleIds.join('|') !== 'rule.permission-profiles-registry.35cf0f58fc34' ||
      reviewerDenialRule?.authorityBasisRef.itemId !== reviewerDenial.itemId ||
      containers.length !== 34 ||
      emptyAsks.length !== 6 ||
      emptyAsks.some(
        (item) => item.exclusionDisposition !== 'schema-container' || item.ruleIds.length !== 0,
      ) ||
      restrictions.length !== 54 ||
      restrictions.some(
        (rule) => rule.enforcementOwner !== 'host-adapter' || rule.assurance !== 'mediated',
      ) ||
      narrative.length !== 51 ||
      profileRules.some((rule) => rule.classification === 'ci-static-check')
    ) {
      violations.push(
        violation(
          'AUTHORITY_ESCALATION',
          'permission-profile containers are structural-only and reviewer denial must bind its canonical YAML rule',
        ),
      )
    }
  }

  const expectedNormativeMarkdownAudit = NORMATIVE_MARKDOWN_AUDIT_KEYS.map((key) => {
    const separator = key.indexOf(':')
    const sourceId = key.slice(0, separator)
    const locatorAnchor = key.slice(separator + 1)
    const source = document.sources.find((candidate) => candidate.sourceId === sourceId)
    const item = source?.inventoryItems.find(
      (candidate) => candidate.locator.anchor === locatorAnchor,
    )
    if (item === undefined) return null
    const { itemId } = item
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
    }
  })
  if (
    expectedNormativeMarkdownAudit.some((record) => record === null) ||
    canonicalJson(document.normativeMarkdownAudit) !==
      canonicalJson([...expectedNormativeMarkdownAudit, ...R31_AUDIT_ROWS])
  ) {
    violations.push(
      violation(
        'RULE_SEMANTICS_UNCURATED',
        'normative Markdown audit must equal the exact 202 item-specific source-authored dispositions',
      ),
    )
  }

  // R24 volatile regions, checked hermetically: against the shipped registry alone, with no
  // repository and no source file. This is deliberately a SECOND implementation of the
  // anti-laundering predicate - `sweepRegistrySources` runs the other one against the document
  // itself. They share a violation code and are told apart by their messages (AC12). Two
  // implementations because one of them can be wrong: the hermetic check cannot see a published
  // block that is in the file but missing from the inventory, and the document check cannot run
  // where there is no repository. Deleting either leaves a hole the other does not cover.
  const declaredRegionIds = new Set<string>()
  for (const region of document.volatileRegions) {
    if (declaredRegionIds.has(region.regionId)) {
      violations.push(
        violation(
          'VOLATILE_REGION_INVALID',
          `volatile region '${region.regionId}' is declared more than once`,
        ),
      )
      continue
    }
    declaredRegionIds.add(region.regionId)
    const source = document.sources.find((candidate) => candidate.sourceId === region.sourceId)
    if (source === undefined) {
      violations.push(
        violation(
          'VOLATILE_REGION_INVALID',
          `volatile region '${region.regionId}' names source '${region.sourceId}', which is not registered`,
        ),
      )
      continue
    }
    const heading = source.inventoryItems.find((item) => item.itemId === region.headingItemId)
    if (heading === undefined || heading.locator.kind !== 'heading') {
      violations.push(
        violation(
          'VOLATILE_REGION_INVALID',
          `volatile region '${region.regionId}' names heading item '${region.headingItemId}', which is not a registered heading of source '${region.sourceId}'`,
          { sourcePath: source.path },
        ),
      )
      continue
    }
    const path = heading.locator.anchor
    // A region is anchored to a heading item and must never cover it, or the anchor it is pinned
    // by would be inside the content it excises and could be rewritten without detection. Heading
    // anchors are bare heading paths and block anchors carry the `md-block:` prefix, so the
    // separation is structural - this asserts the structure rather than trusting it.
    if (path.startsWith('md-block:')) {
      violations.push(
        violation(
          'VOLATILE_REGION_INVALID',
          `volatile region '${region.regionId}' is anchored to heading item '${region.headingItemId}', whose locator is a block anchor rather than a heading path`,
          { sourcePath: source.path },
        ),
      )
      continue
    }
    for (const item of source.inventoryItems) {
      if (item.ruleIds.length === 0) continue
      if (!anchorInHeadingBody(item.locator.anchor, path)) continue
      if (region.extent.kind === 'table-column' && item.locator.kind !== 'table-row') continue
      violations.push(
        violation(
          'VOLATILE_REGION_OVERLAP',
          `volatile region '${region.regionId}' covers inventory item '${item.itemId}', which publishes ${item.ruleIds.join(', ')}`,
          { sourcePath: source.path, locator: item.locator.anchor },
        ),
      )
    }
  }

  for (const [key, expectedStatement] of Object.entries(R11_PROTECTED_NORMATIVE_ITEMS)) {
    const separator = key.indexOf(':')
    const item = itemsByRef.get(referenceKey(key.slice(0, separator), key.slice(separator + 1)))
    if (
      item === undefined ||
      item.exclusionDisposition !== null ||
      item.ruleIds.length === 0 ||
      normalizeRuleText(item.normalizedExcerpt) !== normalizeRuleText(expectedStatement)
    ) {
      violations.push(
        violation(
          'MIGRATION_EVIDENCE_INVALID',
          `protected normative block '${key}' must publish its complete exact semantic block`,
          { locator: item?.locator.anchor },
        ),
      )
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

  const semanticGroups = new Map<string, AuthorityRule[]>()
  for (const rule of document.rules) {
    const key = `${rule.authoritySubject}\u0000${rule.authorityClaim}`
    const group = semanticGroups.get(key) ?? []
    group.push(rule)
    semanticGroups.set(key, group)
  }
  for (const group of semanticGroups.values()) {
    if (group.length < 2 || new Set(group.map((rule) => rule.normalizedStatement)).size < 2)
      continue
    const ruleIds = group.map((rule) => rule.ruleId).sort()
    const equivalence = SEMANTIC_EQUIVALENCE.find(
      (entry) =>
        entry.authoritySubject === group[0]?.authoritySubject &&
        entry.authorityClaim === group[0]?.authorityClaim &&
        [...entry.ruleIds].sort().join('|') === ruleIds.join('|'),
    )
    if (equivalence === undefined) {
      violations.push(
        violation(
          'RULE_SEMANTICS_UNCURATED',
          'distinct statements share one claim without exact semantic equivalence',
          { ruleId: ruleIds[0] },
        ),
      )
    }
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

  // These finite source-version mappings precede every legacy fallback. No reserved identity
  // can recover admission by changing its claim, assurance, basis, or source tuple.
  for (const expected of R31_SOURCE_ITEMS) {
    const source = sourcesById.get(expected.sourceId)
    const item = itemsByRef.get(referenceKey(expected.sourceId, expected.itemId))
    if (
      source === undefined ||
      item === undefined ||
      source.snapshotEvidence.commit !== R31_SOURCE_SNAPSHOT ||
      source.inventoryItems.filter(
        (candidate) =>
          candidate.locator.kind === expected.locator.kind &&
          candidate.locator.anchor === expected.locator.anchor,
      ).length !== 1 ||
      source.inventoryItems.some(
        (candidate) =>
          (source.sourceId === 'standing-constraints' &&
            candidate.itemId === 'item.e3c4f313970c') ||
          (source.sourceId === 'foreman-line-plan' && candidate.itemId === 'item.13c267a420b3'),
      ) ||
      (expected.sourceId === 'standing-constraints'
        ? source.snapshotEvidence.fullFileSha256 !==
          '57e345f9294cb8fcd8c3d90325505c80903648f60522f820061a5f8f288a86ac'
        : source.snapshotEvidence.fullFileSha256 !==
          'dcca81e1e38e245bc6b8bc8ddfdbd44b8b7546c4f0663639256fb421f686f8eb') ||
      locatorDigestFor(item.locator) !== expected.locatorDigest ||
      item.normalizedExcerpt !== expected.normalizedExcerpt ||
      item.valueDigest !== expected.valueDigest ||
      sha256(normalizeRuleText(item.normalizedExcerpt)) !== expected.valueDigest ||
      canonicalJson(item.ruleIds) !== canonicalJson(expected.ruleIds) ||
      item.exclusionDisposition !== expected.exclusionDisposition
    ) {
      violations.push(
        violation(
          'AUTHORITY_ESCALATION',
          `R31 reserved source unit '${expected.unit}' differs from its complete reviewed source binding`,
        ),
      )
    }
  }
  for (const expected of R31_RULE_SHAPES) {
    const rule = document.rules.find((candidate) => candidate.ruleId === expected.ruleId)
    if (rule === undefined || canonicalJson(rule) !== canonicalJson(expected))
      violations.push(
        violation(
          'AUTHORITY_ESCALATION',
          `R31 reserved rule '${expected.ruleId}' is missing or differs from its complete reviewed shape`,
          { ruleId: expected.ruleId },
        ),
      )
  }
  // Reserved R30 identities never fall through to legacy acceptance, including on assurance
  // reversion. The independent required set also rejects renamed or removed entries.
  for (const expected of R30_RULE_SHAPES) {
    if (!document.rules.some((rule) => rule.ruleId === expected.ruleId)) {
      violations.push(
        violation(
          'AUTHORITY_ESCALATION',
          `required R30 rule '${expected.ruleId}' is missing or substituted`,
          { ruleId: expected.ruleId },
        ),
      )
    }
  }
  for (const expected of R30_SOURCE_ITEMS) {
    const item = itemsByRef.get(referenceKey(expected.sourceId, expected.itemId))
    const ownRules = R30_RULE_SHAPES.filter(
      (rule) =>
        rule.authorityBasisRef.sourceId === expected.sourceId &&
        rule.authorityBasisRef.itemId === expected.itemId,
    ).map((rule) => rule.ruleId)
    const allRefs = R30_RULE_SHAPES.filter((rule) =>
      rule.sourceRefs.some(
        (ref) => ref.sourceId === expected.sourceId && ref.itemId === expected.itemId,
      ),
    ).map((rule) => rule.ruleId)
    const legacyRules =
      expected.unit === 'C01'
        ? ['rule.fk-charter.d21.latency-budget', 'rule.fk-charter.d21.cache-revision-binding']
        : []
    const expectedMembership = [...new Set([...legacyRules, ...ownRules, ...allRefs])]
    if (
      item === undefined ||
      canonicalJson(item.ruleIds) !== canonicalJson(expectedMembership) ||
      locatorDigestFor(item.locator) !== expected.locatorDigest ||
      item.valueDigest !== expected.valueDigest ||
      sha256(normalizeRuleText(item.normalizedExcerpt)) !== expected.valueDigest
    ) {
      violations.push(
        violation(
          'AUTHORITY_ESCALATION',
          `R30 reviewed source unit '${expected.unit}' does not match its exact locator and value`,
        ),
      )
    }
  }
  for (const rule of document.rules) {
    const r30Expected = R30_RULE_SHAPES.find((expected) => expected.ruleId === rule.ruleId)
    const { bindingDigest: _r30Binding, ...r30Shape } = rule
    const r30Exact =
      r30Expected !== undefined && canonicalJson(r30Shape) === canonicalJson(r30Expected)
    if (r30Expected !== undefined && !r30Exact) {
      violations.push(
        violation(
          'AUTHORITY_ESCALATION',
          `reserved R30 rule '${rule.ruleId}' does not match its complete reviewed shape`,
          { ruleId: rule.ruleId },
        ),
      )
    }
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
    const r30Basis = R30_SOURCE_ITEMS.find(
      (item) =>
        item.sourceId === r30Expected?.authorityBasisRef.sourceId &&
        item.itemId === r30Expected.authorityBasisRef.itemId,
    )
    const basisStatementMatches =
      r30Expected !== undefined
        ? r30Exact &&
          basisItem !== undefined &&
          r30Basis !== undefined &&
          basisItem.itemId === r30Basis.itemId &&
          basisItem.locator.kind === r30Basis.locator.kind &&
          basisItem.locator.anchor === r30Basis.locator.anchor &&
          locatorDigestFor(basisItem.locator) === r30Basis.locatorDigest &&
          sha256(normalizeRuleText(basisItem.normalizedExcerpt)) === r30Basis.valueDigest &&
          basisItem.valueDigest === r30Basis.valueDigest &&
          basisItem.ruleIds.includes(rule.ruleId)
        : basisItem !== undefined &&
          (normalizeRuleText(rule.normalizedStatement) ===
            normalizeRuleText(basisItem.normalizedExcerpt) ||
            (basisItem.ruleIds.length > 1 &&
              normalizeRuleText(basisItem.normalizedExcerpt).includes(
                normalizeRuleText(rule.normalizedStatement),
              )))
    if (
      !rule.sourceRefs.some(
        (reference) => canonicalJson(reference) === canonicalJson(rule.authorityBasisRef),
      ) ||
      basisItem === undefined ||
      locatorDigestFor(basisItem.locator) !== rule.authorityBasisRef.locatorDigest ||
      basisItem.valueDigest !== rule.authorityBasisRef.valueDigest ||
      !basisStatementMatches
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
      (reference) =>
        reference.sourceId === 'permission-profiles-validator' ||
        (reference.sourceId === 'permission-profiles-registry' &&
          rule.classification === 'pre-action-refusal'),
    )
    const approvedAllow = isApprovedGate2Allow(rule)
    const expectedDecision = approvedAllow ? 'ALLOW' : classificationContract.decision
    const validPreActionShape =
      rule.classification !== 'pre-action-refusal' ||
      (isLoadedProfileRefusal
        ? rule.enforcementOwner === 'host-adapter' && rule.assurance === 'mediated'
        : rule.enforcementOwner === 'kernel-policy' && rule.assurance === 'structural')
    if (
      r30Expected === undefined &&
      !R31_RULE_SHAPES.some(
        (expected) =>
          expected.ruleId === rule.ruleId && canonicalJson(expected) === canonicalJson(rule),
      ) &&
      (rule.decision !== expectedDecision ||
        !validPreActionShape ||
        (classificationContract.enforcementOwner !== null &&
          rule.enforcementOwner !== classificationContract.enforcementOwner) ||
        (classificationContract.assurance !== null &&
          rule.assurance !== classificationContract.assurance))
    ) {
      violations.push(
        violation(
          'AUTHORITY_ESCALATION',
          `rule '${rule.ruleId}' violates the ${rule.classification} decision/owner/assurance contract`,
          { ruleId: rule.ruleId },
        ),
      )
    }
    if (
      rule.authorityBasisRef.sourceId === 'permission-profiles-registry' &&
      rule.classification === 'pre-action-refusal' &&
      (rule.applicability.hosts.join('|') !== 'claude-windows-docker-loaded' ||
        rule.applicability.roles.length !== 1 ||
        rule.applicability.roles.includes('any') ||
        rule.applicability.stages.length === 0 ||
        rule.applicability.stages.includes('any') ||
        rule.applicability.operations.length !== 1 ||
        rule.applicability.operations.includes('any'))
    ) {
      violations.push(
        violation(
          'AUTHORITY_ESCALATION',
          'permission-profile refusal must be item-specific to one profile role, concrete stages and operation, and the loaded mediated host',
          { ruleId: rule.ruleId },
        ),
      )
    }
    if (
      rule.classification === 'pre-action-refusal' &&
      ((approvedAllow && rule.refusalCode !== null) ||
        (!approvedAllow && rule.refusalCode === null))
    ) {
      violations.push(
        violation(
          'MIGRATION_EVIDENCE_INVALID',
          approvedAllow
            ? 'approved pre-action ALLOW requires null refusalCode'
            : 'pre-action REFUSE requires refusalCode',
          { ruleId: rule.ruleId },
        ),
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
        // R30.9 binds each approved edge to its actual pinned inventory item. Corroboration
        // remains distinct from the designated basis and never bypasses reciprocal membership.
        const r30Reference = R30_SOURCE_ITEMS.find(
          (expected) =>
            expected.sourceId === sourceRef.sourceId && expected.itemId === sourceRef.itemId,
        )
        const r30ReferenceExact =
          r30Exact &&
          r30Reference !== undefined &&
          item.itemId === r30Reference.itemId &&
          item.locator.kind === r30Reference.locator.kind &&
          item.locator.anchor === r30Reference.locator.anchor &&
          locatorDigestFor(item.locator) === r30Reference.locatorDigest &&
          item.valueDigest === r30Reference.valueDigest &&
          sha256(normalizeRuleText(item.normalizedExcerpt)) === r30Reference.valueDigest &&
          item.ruleIds.includes(rule.ruleId)
        const expectedRuleId = `rule.${sourceRef.sourceId}.${item.itemId.replace(/^item\./, '')}`
        const expectedCompoundPrefix = `${expectedRuleId}.`
        if (
          r30Expected !== undefined
            ? !r30ReferenceExact
            : rule.sourceRefs.length === 1 &&
              R12_LEGACY_MARKDOWN_RULE_TARGETS[rule.ruleId] === undefined &&
              ((item.ruleIds.length === 1 && rule.ruleId !== expectedRuleId) ||
                (item.ruleIds.length > 1 &&
                  rule.ruleId !== expectedRuleId &&
                  !rule.ruleId.startsWith(expectedCompoundPrefix)))
        ) {
          violations.push(
            violation(
              'MIGRATION_EVIDENCE_INVALID',
              `rule identity '${rule.ruleId}' does not bind inventory identity '${item.itemId}'`,
              { sourcePath: source.path, locator: item.locator.anchor, ruleId: rule.ruleId },
            ),
          )
        }
        if (
          r30Expected !== undefined
            ? !r30ReferenceExact
            : normalizeRuleText(rule.normalizedStatement) !==
                normalizeRuleText(item.normalizedExcerpt) &&
              !(
                item.ruleIds.length > 1 &&
                normalizeRuleText(item.normalizedExcerpt).includes(
                  normalizeRuleText(rule.normalizedStatement),
                )
              )
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
        (left.authorityClaim !== right.authorityClaim || left.decision !== right.decision) &&
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
  // R22 obligation 6: the shipped head is REQUIRED to be present, so deleting it - with or without
  // a substitute under another id - invalidates the document instead of vacating a free slot.
  for (const migrationId of [...REQUIRED_REWORK_MIGRATIONS, SHIPPED_CHAIN_HEAD_ID]) {
    if (!document.reconciliations.some((record) => record.reconciliationId === migrationId)) {
      violations.push(
        violation(
          'RECONCILIATION_MISSING',
          `required rework migration '${migrationId}' is missing`,
        ),
      )
    }
  }
  // Walked once and reused: `migrationChain.headId` decides which record is bound to the live
  // manifest instead of to a pinned constant, and its violations are collected below.
  const migrationChain = verifyMigrationChain(document)
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
    const frozenPreR12Record =
      record.reconciliationId !== 'registry-rework-544d8a3' &&
      RECONCILIATION_RECORD_DIGESTS[record.reconciliationId] !== undefined &&
      sha256(canonicalJson(record)) === RECONCILIATION_RECORD_DIGESTS[record.reconciliationId]
    // AC4 as amended by R16: binding is established either by a pinned constant or by structural
    // position in the migration chain. Every record EXCEPT the single chain head is bound to its
    // pinned digest here; the head is bound instead - and more tightly - to the manifest
    // recomputed live from the document it sits in, which `verifyMigrationChain` asserts.
    //
    // Without this the manifest stays transitively frozen: the live manifest must equal the head
    // record's declared digest, and a byte-frozen head record freezes that digest, so exactly one
    // registry content could ever be valid and `npm run generate` could never produce a
    // validatable artifact. This is not a cardinality-conditioned bypass - nothing is counted, the
    // head is identified by chain topology, and it is bound rather than exempted.
    const isChainHead =
      migrationChain.headId !== null && record.reconciliationId === migrationChain.headId
    if (
      !isChainHead &&
      (recordDigestPinFor(record.reconciliationId) === undefined ||
        sha256(canonicalJson(record)) !== recordDigestPinFor(record.reconciliationId))
    ) {
      violations.push(
        violation(
          'MIGRATION_EVIDENCE_INVALID',
          `reconciliation '${record.reconciliationId}' differs from its complete canonical record manifest`,
        ),
      )
    }
    if (
      record.reconciliationId === R31_RECONCILIATION.reconciliationId &&
      canonicalJson(record) !== canonicalJson(R31_RECONCILIATION)
    ) {
      violations.push(
        violation(
          'MIGRATION_EVIDENCE_INVALID',
          'R31 exact migration diagnostic, source references and custody tuple changed',
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
          commit: LEGACY_SOURCE_SNAPSHOT_COMMIT,
          path: 'plugins/foreman-line/docs/transcripts/defects_lessons.md',
        })
        expectedEvidence.push(
          {
            kind: 'git-commit',
            reference: LEGACY_SOURCE_SNAPSHOT_COMMIT,
            digest: '35b6b805e4ad81c9b4cb4c1f5dc346c431e55e6823690e93d4ad61a969767cad',
          },
          {
            kind: 'missing-path',
            reference: missingReference,
            digest: sha256(missingReference),
          },
        )
      }
      if (record.reconciliationId === 'surfaces-allowed-files') {
        const commandReference = canonicalJson({
          tool: '@foreman-line/authority-registry',
          toolVersion: '0.1.0',
          commandId: 'allowed-files-body-compiler-absence',
          inputDigest: sha256(canonicalJson(record.observedRefs.slice(0, 3))),
          resultDigest: sha256(
            canonicalJson({
              compiler: 'spec-linter',
              bodySection: 'Allowed Files',
              present: false,
            }),
          ),
          exitCode: 0,
          actorClass: 'coordinator',
        })
        expectedEvidence.push({
          kind: 'command-result',
          reference: commandReference,
          digest: sha256(commandReference),
        })
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
      const legacySourceRef = isLegacyReconciliationSourceRef(
        record.reconciliationId,
        record.supersedingEvidence,
      )
      if (
        (!frozenPreR12Record &&
          (item === undefined ||
            item.valueDigest !== record.supersedingEvidence.valueDigest ||
            (locatorDigestFor(item.locator) !== record.supersedingEvidence.locatorDigest &&
              !legacySourceRef))) ||
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
          `4666ea15caee8b231137f23325d14ea4526e338a|${LEGACY_SOURCE_SNAPSHOT_COMMIT}` ||
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
          `87237a868a0da8e1a57fc8ce9d400509b2a09c5d|${LEGACY_SOURCE_SNAPSHOT_COMMIT}` ||
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
          `f73a3846e436dcf25d80618aedd88170b0888770|${LEGACY_SOURCE_SNAPSHOT_COMMIT}` ||
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
    if (record.reconciliationId === 'registry-rework-00b41b7') {
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
          `6123474485ef836fc7250df9c15695aaff44fe45|${LEGACY_SOURCE_SNAPSHOT_COMMIT}` ||
        commands.length !== 2 ||
        !resultDigests.includes(PRIOR_R6_BINDING_MANIFEST_DIGEST) ||
        !resultDigests.includes(PRIOR_R7_BINDING_MANIFEST_DIGEST)
      ) {
        violations.push(
          violation(
            'MIGRATION_EVIDENCE_INVALID',
            'R7 migration does not bind the prior R6 registry commit, source snapshot, and superseding manifest',
          ),
        )
      }
    }
    if (record.reconciliationId === 'registry-rework-37afc65') {
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
          `5d7ca990574eb8416a1fc5ac40b90d9aec975b2b|${LEGACY_SOURCE_SNAPSHOT_COMMIT}` ||
        commands.length !== 2 ||
        !resultDigests.includes(PRIOR_R7_BINDING_MANIFEST_DIGEST) ||
        !resultDigests.includes(PRIOR_R8_BINDING_MANIFEST_DIGEST)
      ) {
        violations.push(
          violation(
            'MIGRATION_EVIDENCE_INVALID',
            'R8 migration does not bind the prior R7 registry commit, source snapshot, and superseding manifest',
          ),
        )
      }
    }
    if (record.reconciliationId === 'registry-rework-91145d7') {
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
          `84d5c7c0fd2ef074dab06770f14e87012619a213|${LEGACY_SOURCE_SNAPSHOT_COMMIT}` ||
        commands.length !== 2 ||
        !resultDigests.includes(PRIOR_R8_BINDING_MANIFEST_DIGEST) ||
        !resultDigests.includes(PRIOR_R9_BINDING_MANIFEST_DIGEST)
      ) {
        violations.push(
          violation(
            'MIGRATION_EVIDENCE_INVALID',
            'R9 migration does not bind the prior R8 registry commit, source snapshot, and superseding manifest',
          ),
        )
      }
    }
    if (record.reconciliationId === 'registry-rework-1b42f4b') {
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
          `89d7e4853a8fb0af3db68e9262e38833062fba77|${LEGACY_SOURCE_SNAPSHOT_COMMIT}` ||
        commands.length !== 2 ||
        !resultDigests.includes(PRIOR_R9_BINDING_MANIFEST_DIGEST) ||
        !resultDigests.includes(PRIOR_R10_BINDING_MANIFEST_DIGEST)
      ) {
        violations.push(
          violation(
            'MIGRATION_EVIDENCE_INVALID',
            'R10 migration does not bind the prior R9 registry commit, source snapshot, and superseding manifest',
          ),
        )
      }
    }
    if (record.reconciliationId === 'registry-rework-ee29973') {
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
          `f3366be12175acb4fd4aeb32c301c845b906a5da|${LEGACY_SOURCE_SNAPSHOT_COMMIT}` ||
        commands.length !== 2 ||
        !resultDigests.includes(PRIOR_R10_BINDING_MANIFEST_DIGEST) ||
        !resultDigests.includes(PRIOR_R11_BINDING_MANIFEST_DIGEST)
      ) {
        violations.push(
          violation(
            'MIGRATION_EVIDENCE_INVALID',
            'R11 migration does not bind the prior R10 registry commit, source snapshot, and superseding manifest',
          ),
        )
      }
    }
    if (record.reconciliationId === 'registry-rework-544d8a3') {
      const gitRefs = record.observedEvidence
        .filter((e) => e.kind === 'git-commit')
        .map((e) => e.reference)
      const commands = record.observedEvidence.filter((e) => e.kind === 'command-result')
      const parsedCommands = commands.flatMap((e) => {
        try {
          return [JSON.parse(e.reference) as { commandId?: unknown; resultDigest?: unknown }]
        } catch {
          return []
        }
      })
      if (
        gitRefs.join('|') !== `${R12_PRIOR_REGISTRY_COMMIT}|${LEGACY_SOURCE_SNAPSHOT_COMMIT}` ||
        commands.length !== 2 ||
        parsedCommands.map((command) => command.commandId).join('|') !==
          'registry-binding-manifest-r11|superseding-binding-manifest-r12' ||
        !parsedCommands.some(
          (command) => command.resultDigest === PRIOR_R11_BINDING_MANIFEST_DIGEST,
        ) ||
        !parsedCommands.some(
          (command) => command.resultDigest === PRIOR_R12_BINDING_MANIFEST_DIGEST,
        )
      ) {
        violations.push(
          violation(
            'MIGRATION_EVIDENCE_INVALID',
            'R12 migration does not bind the exact R11 registry commit, source snapshot, and superseding manifest',
          ),
        )
      }
    }
    if (record.reconciliationId === 'registry-rework-0683bc0') {
      const gitRefs = record.observedEvidence
        .filter((e) => e.kind === 'git-commit')
        .map((e) => e.reference)
      const commands = record.observedEvidence.filter((e) => e.kind === 'command-result')
      const parsedCommands = commands.flatMap((e) => {
        try {
          return [JSON.parse(e.reference) as { commandId?: unknown; resultDigest?: unknown }]
        } catch {
          return []
        }
      })
      if (
        gitRefs.join('|') !== `${R13_PRIOR_REGISTRY_COMMIT}|${LEGACY_SOURCE_SNAPSHOT_COMMIT}` ||
        commands.length !== 2 ||
        parsedCommands.map((command) => command.commandId).join('|') !==
          'registry-binding-manifest-r12|superseding-binding-manifest-r13'
        // The prior and superseding manifest digests are no longer compared against hardcoded
        // constants here. `verifyMigrationChain` establishes both more strongly: the prior digest
        // is verified transitively from the pinned genesis anchor, and the superseding digest is
        // bound to the manifest recomputed live rather than to a frozen copy of one document.
      ) {
        violations.push(
          violation(
            'MIGRATION_EVIDENCE_INVALID',
            'R13 migration does not bind the exact R12 registry commit, source snapshot, and superseding manifest',
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
      const legacySourceRef = isLegacyReconciliationSourceRef(record.reconciliationId, sourceRef)
      if (
        !frozenPreR12Record &&
        (item === undefined ||
          item.valueDigest !== sourceRef.valueDigest ||
          (locatorDigestFor(item.locator) !== sourceRef.locatorDigest && !legacySourceRef))
      ) {
        violations.push(
          violation(
            'MIGRATION_EVIDENCE_INVALID',
            'reconciliation observedRef does not fully resolve identity, locator, and value',
          ),
        )
      }
    }
    violations.push(...evidenceBindingViolations(record))
    for (const evidence of record.observedEvidence) {
      if (evidence.kind === 'git-commit') {
        // R21: a `git-commit` digest attests the commit OBJECT BODY - `sha256(git cat-file -p ...)`
        // - which is not derivable from the forty-hex reference, so there is no digest-versus-
        // reference comparison available here. This validator states that rather than staging one.
        // The line replaced here read
        //   `expectedDigest = /^[0-9a-f]{64}$/.test(evidence.digest) ? evidence.digest : null`
        // which compared the digest TO ITSELF and reported the result as a binding check; a
        // reviewer repointed the head's git reference to an arbitrary forty-hex value and saw zero
        // violations. What actually binds the reference is `evidenceBindingViolations` above.
        // Well-formedness is all that is checked here, and it is called nothing more than that.
        if (!/^[0-9a-f]{40}$/.test(evidence.reference) || !/^[0-9a-f]{64}$/.test(evidence.digest)) {
          violations.push(
            violation(
              'MIGRATION_EVIDENCE_INVALID',
              `reconciliation '${record.reconciliationId}' git-commit evidence is not a well-formed commit reference and digest`,
            ),
          )
        }
        continue
      }
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
            // The live snapshot, or the snapshot a frozen historical record was authored against.
            // `missing-provenance-reference` is byte-frozen and binds the initial dispatch commit,
            // so pinning this to the live value alone would break it the moment the source
            // baseline legitimately advances. The commit is still required to appear as
            // `git-commit` evidence on the same record, which is what actually binds it.
            (parsed.commit === document.sourceSnapshotCommit ||
              parsed.commit === LEGACY_SOURCE_SNAPSHOT_COMMIT) &&
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
        'gate1.ratify': ['fk-charter:item.cd014d6d90c5', 'fk-charter:item.d9'],
        'gate2.dispatch': ['fk-charter:item.15a44cf50bc6', 'fk-loop-directive:item.bfffee6d7c1f'],
        'gate3.merge': [
          'fk-charter:item.b1ac4aa9eddf',
          'fk-loop-directive:item.7eb6018d9e57',
          'fk-loop-directive:item.2743c2f8c558',
        ],
        'verification.issue': [
          'spec-convention:item.03f0830cd693',
          'fk-loop-directive:item.dd8203551518',
        ],
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
  // Reuse the single walk performed above. Calling `verifyMigrationChain` a second time here was
  // my own instance of the defect fix 16 removed: duplicated work on the path `resolveAuthority`
  // invokes for every query.
  violations.push(...migrationChain.violations)
  violations.push(...checkOperationAuthority(document))
  return violations
}

export interface ValidateOptions {
  /**
   * Repository root used to digest-verify D11 retirement evidence. Optional and additive.
   * Without it, a registry containing a `retired-from-agent-reading` rule is INVALID with
   * `RETIREMENT_EVIDENCE_UNVERIFIED` rather than silently accepted.
   */
  readonly repoRoot?: string
}

export function validateRegistry(
  document: unknown,
  options: ValidateOptions = {},
): ValidationResult {
  const violations: ValidationViolation[] = []
  // Single structural pass. `validateStructure.errors` reflects the most recent call, so the
  // result is captured once and reused; calling it twice doubled the AJV cost on the path
  // `resolveAuthority` invokes for every query.
  const structureValid = validateStructure(document)
  if (!structureValid) {
    for (const error of validateStructure.errors ?? []) {
      violations.push(
        violation(
          'SCHEMA_INVALID',
          `${error.instancePath.length > 0 ? error.instancePath : '(root)'} ${error.message ?? 'is invalid'}`,
          { locator: error.instancePath },
        ),
      )
    }
    const sorted = ordered(violations)
    return { valid: false, violations: sorted, summary: null }
  }
  const registry = document as AuthorityEnforcementRegistry
  violations.push(...semanticViolations(registry))
  // An unusable `repoRoot` is reported as the operator error it is, and retirement evidence is then
  // reported UNVERIFIED - exactly as it is when no root was supplied at all - rather than
  // INCOMPLETE. Reporting a digest check as failed when the directory holding the artifacts does
  // not exist would be the validator claiming a check it never performed, which is the precise
  // failure this package exists to make impossible.
  const repoRootStatus = options.repoRoot === undefined ? null : repoRootCheck(options.repoRoot)
  if (repoRootStatus !== null) violations.push(...repoRootStatus.violations)
  if (repoRootStatus?.gitReady === true) {
    try {
      const blob = execFileSync(
        'git',
        ['cat-file', 'blob', `${R31_SOURCE_SNAPSHOT}:${R31_DECISION_PATH}`],
        { cwd: options.repoRoot, stdio: ['ignore', 'pipe', 'ignore'] },
      )
      if (sha256(blob) !== R31_DECISION_BLOB_DIGEST)
        throw new Error('decision blob differs from its reviewed bytes')
    } catch (error) {
      violations.push(
        violation(
          'MIGRATION_EVIDENCE_INVALID',
          `R31 plan decision actual Git-blob correspondence failed: ${(error as Error).message}`,
        ),
      )
    }
  }
  violations.push(
    ...retirementVerificationViolations(
      registry,
      repoRootStatus?.gitReady === true ? options.repoRoot : undefined,
    ),
  )
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

/**
 * A volatile region reduced to the two things the document layer needs: which heading it is
 * anchored to, expressed as the same ` > `-joined path every Markdown anchor already embeds, and
 * what shape its extent takes. Resolving a region id to a heading path is the *caller's* job -
 * `validateRegistry` reads it from the region's governed heading item, the generator reads it from
 * the document it is inventorying - so this layer stays purely mechanical and testable.
 */
export interface VolatileRegionRequest {
  readonly regionId: string
  readonly headingPath: string
  readonly extent: VolatileExtent
}
export interface ResolvedVolatileExtent {
  readonly regionId: string
  readonly headingPath: string
  readonly headingLine: number
  readonly kind: VolatileExtent['kind']
  readonly excisedLines: readonly number[]
  readonly clearedCells: readonly { readonly line: number; readonly cell: number }[]
}
export interface VolatileResolution {
  readonly extents: readonly ResolvedVolatileExtent[]
  readonly failures: readonly { readonly regionId: string; readonly message: string }[]
}

function markdownHeadingIndex(content: string): {
  readonly lines: readonly string[]
  readonly fenced: ReadonlySet<number>
  readonly headings: readonly { readonly line: number; readonly path: string }[]
} {
  const rawLines = content.replace(/\r\n?/g, '\n').split('\n')
  const lines = stripMarkdownHtmlComments(content).replace(/\r\n?/g, '\n').split('\n')
  const fenced = pairedFenceLines(rawLines)
  const stack: { level: number; text: string }[] = []
  const headings: { line: number; path: string }[] = []
  for (let index = 0; index < lines.length; index += 1) {
    if (fenced.has(index)) continue
    const match = /^(#{1,6})\s+.+/.exec(lines[index] ?? '')
    if (match === null) continue
    const level = match[1]?.length ?? 6
    while ((stack.at(-1)?.level ?? 0) >= level) stack.pop()
    stack.push({ level, text: (lines[index] ?? '').trim() })
    headings.push({ line: index, path: stack.map((item) => item.text).join(' > ') })
  }
  return { lines, fenced, headings }
}

/**
 * Resolve declared volatile regions against a Markdown source, exact-or-refuse.
 *
 * Every resolution failure is reported rather than approximated. A region that resolves zero
 * times, several times, or to an ambiguous column is a region whose extent nobody knows, and
 * masking an unknown extent is how a scoped exclusion turns into a rule-retirement mechanism.
 *
 * `heading-subtree` covers the heading's DIRECT BODY: it starts after the heading line and stops
 * at the next heading of any level, so descendant headings and their bodies stay governed (R26
 * ruling 2). A heading line inside a fenced block is not a heading and does not stop the extent.
 */
export function resolveVolatileRegions(
  content: string,
  requests: readonly VolatileRegionRequest[],
): VolatileResolution {
  const { lines, fenced, headings } = markdownHeadingIndex(content)
  const extents: ResolvedVolatileExtent[] = []
  const failures: { regionId: string; message: string }[] = []
  const seenIds = new Set<string>()
  const claimedLines = new Map<number, string>()
  for (const request of requests) {
    if (seenIds.has(request.regionId)) {
      failures.push({
        regionId: request.regionId,
        message: `volatile region '${request.regionId}' is declared more than once`,
      })
      continue
    }
    seenIds.add(request.regionId)
    // Narrow the discriminated union once, on a local. Narrowing `request.extent` in place does
    // not survive the loop body, because `request` is a mutable loop binding.
    const extent: VolatileExtent = request.extent
    const matches = headings.filter((heading) => heading.path === request.headingPath)
    if (matches.length !== 1) {
      failures.push({
        regionId: request.regionId,
        message:
          matches.length === 0
            ? `volatile region '${request.regionId}' names a heading that is absent from the source`
            : `volatile region '${request.regionId}' names a heading that occurs ${matches.length} times in the source`,
      })
      continue
    }
    const headingLine = (matches[0] as { line: number }).line
    let end = headingLine + 1
    while (end < lines.length) {
      if (!fenced.has(end) && /^#{1,6}\s+.+/.test(lines[end] ?? '')) break
      end += 1
    }
    const body: number[] = []
    for (let index = headingLine + 1; index < end; index += 1) body.push(index)
    if (extent.kind === 'heading-subtree') {
      // The WHOLE body span, blank lines included. Filtering blanks out was the first
      // implementation and it leaks: `maskVolatileSource` removes these lines, so leaving the
      // region's blank separators behind makes the count of surviving lines depend on how the
      // volatile content happens to be paragraphed. Appending "\n\ntext" then removes two of the
      // three inserted lines and shifts every out-of-region `lineHint` after the region by one,
      // which is exactly the identity channel control (e) measures.
      const span = body
      const collision = span.find((index) => claimedLines.has(index))
      if (collision !== undefined) {
        failures.push({
          regionId: request.regionId,
          message: `volatile region '${request.regionId}' overlaps volatile region '${claimedLines.get(collision)}' at line ${collision + 1}`,
        })
        continue
      }
      for (const index of span) claimedLines.set(index, request.regionId)
      extents.push({
        regionId: request.regionId,
        headingPath: request.headingPath,
        headingLine,
        kind: 'heading-subtree',
        excisedLines: span,
        clearedCells: [],
      })
      continue
    }
    const runs: number[][] = []
    let run: number[] = []
    for (const index of body) {
      if (!fenced.has(index) && /^\s*\|/.test(lines[index] ?? '')) run.push(index)
      else if (run.length > 0) {
        runs.push(run)
        run = []
      }
    }
    if (run.length > 0) runs.push(run)
    if (runs.length !== 1) {
      failures.push({
        regionId: request.regionId,
        message:
          runs.length === 0
            ? `volatile region '${request.regionId}' names a table column but its heading body has no table`
            : `volatile region '${request.regionId}' names a table column but its heading body has ${runs.length} tables`,
      })
      continue
    }
    const table = runs[0] as number[]
    const headerLine = table[0] as number
    const headerCells = (lines[headerLine] ?? '').trim().split('|').slice(1, -1)
    const columnIndexes = headerCells
      .map((cell, index) => ({ cell: cell.trim(), index }))
      .filter((entry) => entry.cell === extent.column)
      .map((entry) => entry.index)
    if (columnIndexes.length !== 1) {
      failures.push({
        regionId: request.regionId,
        message:
          columnIndexes.length === 0
            ? `volatile region '${request.regionId}' names table column '${extent.column}', which the table header does not carry`
            : `volatile region '${request.regionId}' names table column '${extent.column}', which the table header carries ${columnIndexes.length} times`,
      })
      continue
    }
    const cell = columnIndexes[0] as number
    extents.push({
      regionId: request.regionId,
      headingPath: request.headingPath,
      headingLine,
      kind: 'table-column',
      excisedLines: [],
      clearedCells: table.map((line) => ({ line, cell })),
    })
  }
  return { extents, failures }
}

/**
 * Excise resolved volatile extents from a source before anything reads it.
 *
 * Volatile lines are REMOVED, not blanked. Blanking was implemented first and measured to fail
 * control (e): block discovery and ordinal assignment do skip blank lines, so no governed sibling
 * is displaced in its container, but a blanked line still OCCUPIES a line, so appending one
 * paragraph inside a volatile region shifts `lineHint` for every out-of-region block after it.
 * `itemIdFor` hashes `lineHint` for any md-block item absent from the anchor-keyed frozen map, so
 * a two-line append to the owner-of-record region churned three item IDs and DE-PUBLISHED standing
 * authorization 8 - the ambient-checkout prohibition published this same round - because the
 * curated classification map is keyed by item ID. A volatile append that silently retires a
 * prohibition is precisely the laundering channel R24 exists to close, reached from the other
 * direction.
 *
 * Removal closes it structurally rather than by care: the masked document contains only
 * out-of-region lines, so their positions depend on the out-of-region content alone and no
 * property of a volatile region - not its length, not its bytes - can reach a governed item's
 * identity. The alternative fix, dropping `lineHint` from `itemIdFor` as the contract at spec ~613
 * already requires, was measured and rejected for this round: it re-derives every non-frozen
 * md-block ID in every source, which churned `fk-charter:item.ff0f88a958e0` and de-published
 * `rule.fk-charter.ff0f88a958e0`. That is an identity-layer change across the whole corpus, and
 * R28 refuses new identity work on this parcel.
 *
 * The cost is that `lineHint` for an out-of-region block after a region names its line in the
 * masked governed surface rather than in the raw file. That is the coherent reading, not a
 * regression: `normalizedExcerpt`, `valueDigest`, and every ordinal inside an anchor already
 * describe the masked projection, so `lineHint` was the one field describing a different document.
 * The spec makes it a review aid excluded from identity and digests, and anchors - heading path
 * plus ordinal - remain exact for lookup.
 *
 * A `table-column` extent clears one cell per row and leaves the row, so the first-column key that
 * forms a `table-row` anchor never moves and no line count changes. Note this operation is
 * deliberately NOT self-idempotent for `table-column`: masked output no longer carries the named
 * column, so re-resolving masked output fails closed. The property that matters, and that is
 * tested, is that regenerating after a *volatile mutation of the source* is byte-identical.
 */
export function maskVolatileSource(
  content: string,
  extents: readonly ResolvedVolatileExtent[],
): string {
  if (extents.length === 0) return content
  const lines = content.replace(/\r\n?/g, '\n').split('\n')
  const removed = new Set<number>()
  for (const extent of extents) {
    for (const index of extent.excisedLines) removed.add(index)
    for (const { line, cell } of extent.clearedCells) {
      const source = lines[line] ?? ''
      const leading = /^\s*/.exec(source)?.[0] ?? ''
      const cells = source.trim().split('|')
      const inner = cells.slice(1, -1)
      if (cell >= inner.length) continue
      inner.splice(cell, 1)
      lines[line] = `${leading}|${inner.join('|')}|`
    }
  }
  return lines.filter((_, index) => !removed.has(index)).join('\n')
}

interface MarkdownDocumentMap {
  readonly lines: readonly string[]
  readonly fenced: ReadonlySet<number>
  readonly blocks: ReadonlyMap<string, string>
  readonly blockCounts: ReadonlyMap<string, number>
}

function markdownDocumentMap(content: string): MarkdownDocumentMap {
  const blocks = new Map<string, string>()
  const blockCounts = new Map<string, number>()
  const rawLines = content.replace(/\r\n?/g, '\n').split('\n')
  const lines = stripMarkdownHtmlComments(content).replace(/\r\n?/g, '\n').split('\n')
  const fenced = pairedFenceLines(rawLines)
  const headings: { level: number; text: string }[] = []
  const occurrences = new Map<string, number>()
  const tableGroups = new Map<string, number>()
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
    const headingPath = headings.map((item) => item.text).join(' > ') || '(preamble)'
    const kind = table ? 'table-row' : list ? 'list-item' : 'paragraph'
    const text = lines.slice(cursor, end).join('\n')
    const structuralKey = `${headingPath}\u0000${kind}`
    const occurrence = (occurrences.get(structuralKey) ?? 0) + 1
    occurrences.set(structuralKey, occurrence)
    const tableKey = table ? line.trim().split('|').slice(1, -1)[0]?.trim() : undefined
    const tableGroup = tableGroups.get(headingPath) ?? 1
    const tablePrefix =
      table && tableGroup > 1 ? `${headingPath} > table-group:${tableGroup}` : headingPath
    const anchor = `md-block:${tablePrefix}:${kind}:${table ? tableKey : occurrence}`
    blockCounts.set(anchor, (blockCounts.get(anchor) ?? 0) + 1)
    if (!blocks.has(anchor)) blocks.set(anchor, text)
    cursor = end
  }
  return { lines, fenced, blocks, blockCounts }
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
  const modifiers = (node as ts.Statement & { readonly modifiers?: readonly ts.ModifierLike[] })
    .modifiers
  if (modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.DeclareKeyword)) {
    return true
  }
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

function runtimeImportRecord(node: ts.ImportDeclaration): {
  readonly anchor: string
  readonly value: string
} {
  const moduleName = (node.moduleSpecifier as ts.StringLiteral).text
  const clause = node.importClause
  if (clause === undefined) {
    const value = canonicalJson({ module: moduleName, sideEffect: true })
    return { anchor: `ts-import:${moduleName}:side-effect`, value }
  }
  const defaultBinding = clause.name?.text ?? null
  let namespaceBinding: string | null = null
  const namedBindings: string[] = []
  if (clause.namedBindings !== undefined) {
    if (ts.isNamespaceImport(clause.namedBindings)) {
      namespaceBinding = clause.namedBindings.name.text
    } else {
      for (const element of clause.namedBindings.elements) {
        if (element.isTypeOnly) continue
        const imported = element.propertyName?.text ?? element.name.text
        namedBindings.push(
          imported === element.name.text ? imported : `${imported} as ${element.name.text}`,
        )
      }
    }
  }
  namedBindings.sort()
  const value = canonicalJson({
    defaultBinding,
    module: moduleName,
    namedBindings,
    namespaceBinding,
  })
  return { anchor: `ts-import:${moduleName}:${value}`, value }
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
      const canonicalImport = runtimeImportRecord(statement)
      topAnchor = canonicalImport.anchor
      result.set(topAnchor, canonicalImport.value)
    } else if (ts.isImportEqualsDeclaration(statement)) {
      topAnchor = `ts-import-equals:${normalizeRuleText(statement.getText(sourceFile))}`
    }
    if (!ts.isImportDeclaration(statement))
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

export function permissionProfileRuleMap(content: string): Map<string, string> {
  const parsed = parse(content) as {
    profiles?: Record<string, { description?: unknown; envelope?: Record<string, unknown> }>
  }
  const result = new Map<string, string>()
  const profiles = parsed.profiles ?? {}
  result.set('yaml-container:profiles', canonicalJson(profiles))
  for (const profileName of Object.keys(profiles).sort()) {
    const profile = profiles[profileName] ?? {}
    const envelope = profile.envelope ?? {}
    result.set(`yaml-container:profiles/${profileName}`, canonicalJson(profile))
    result.set(
      `yaml-container:profiles/${profileName}/description`,
      canonicalJson(profile.description),
    )
    result.set(`yaml-container:profiles/${profileName}/envelope`, canonicalJson(envelope))
    for (const key of ['deny', 'allow', 'network']) {
      if (key in envelope) {
        result.set(
          `yaml-container:profiles/${profileName}/envelope/${key}`,
          canonicalJson(envelope[key]),
        )
      }
    }
    const visit = (value: unknown, path: string): void => {
      if (Array.isArray(value)) {
        if (value.length === 0) {
          result.set(`yaml-rule:${profileName}:${path}:[]`, '[]')
          return
        }
        for (const member of [...value].map(canonicalJson).sort()) {
          result.set(`yaml-rule:${profileName}:${path}:${member}`, member)
        }
        return
      }
      if (value !== null && typeof value === 'object') {
        for (const key of Object.keys(value as Record<string, unknown>).sort()) {
          visit((value as Record<string, unknown>)[key], `${path}/${key}`)
        }
        return
      }
      result.set(`yaml-rule:${profileName}:${path}`, canonicalJson(value))
    }
    for (const key of ['allow', 'ask', 'deny', 'network']) {
      if (key in envelope) visit(envelope[key], key)
    }
  }
  return result
}

function extractLocator(
  content: string,
  locator: SourceLocator,
  markdown?: MarkdownDocumentMap,
): { count: number; value: string } {
  const lines = content.replace(/\r\n?/g, '\n').split('\n')
  const markdownLines = markdown?.lines ?? lines
  const fenced = markdown?.fenced ?? new Set<number>()
  if (locator.anchor.startsWith('md-block:')) {
    const value = markdown?.blocks.get(locator.anchor)
    return { count: markdown?.blockCounts.get(locator.anchor) ?? 0, value: value ?? '' }
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
  if (
    locator.kind === 'symbol' &&
    (locator.anchor.startsWith('yaml-rule:') || locator.anchor.startsWith('yaml-container:'))
  ) {
    try {
      const value = permissionProfileRuleMap(content).get(locator.anchor)
      return { count: value === undefined ? 0 : 1, value: value ?? '' }
    } catch {
      return { count: 0, value: '' }
    }
  }
  if (locator.kind === 'table-row') {
    const matches = markdownLines.filter((line, index) => {
      if (fenced.has(index)) return false
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
    for (let index = 0; index < markdownLines.length; index += 1) {
      if (fenced.has(index)) continue
      const line = markdownLines[index] ?? ''
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
    return { count: 1, value: markdownLines[start] ?? '' }
  }
  if (locator.kind === 'numbered-item') {
    const stack: { level: number; heading: string }[] = []
    const matches: { index: number; indent: number }[] = []
    const occurrences = new Map<string, number>()
    for (let index = 0; index < markdownLines.length; index += 1) {
      if (fenced.has(index)) continue
      const line = markdownLines[index] ?? ''
      const heading = /^(#{1,6})\s+.+/.exec(line)
      if (heading !== null) {
        const level = heading[1]?.length ?? 6
        while ((stack.at(-1)?.level ?? 0) >= level) stack.pop()
        stack.push({ level, heading: line.trim() })
        continue
      }
      const numbered = /^(\s*)(\d+)[.)]\s+\S/.exec(line)
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
    let end = markdownLines.length
    for (let index = match.index + 1; index < markdownLines.length; index += 1) {
      if (fenced.has(index)) {
        end = index
        break
      }
      const line = markdownLines[index] ?? ''
      if (/^#{1,6}\s+/.test(line)) {
        end = index
        break
      }
      const next = /^(\s*)(\d+)[.)]\s+\S/.exec(line)
      if (next !== null && (next[1]?.length ?? 0) <= match.indent) {
        end = index
        break
      }
    }
    return { count: 1, value: markdownLines.slice(match.index, end).join('\n') }
  }
  if (locator.kind === 'symbol') {
    const matches = lines
      .map((line, index) => ({ line, index }))
      .filter(({ line }) => line.trim() === locator.anchor.trim())
    return { count: matches.length, value: matches.length === 1 ? (matches[0]?.line ?? '') : '' }
  }
  return { count: 0, value: '' }
}

/**
 * Memoised `git` invocation, keyed by repository root and exact argument vector.
 *
 * `sweepRegistrySources` spawns roughly 87 git subprocesses per call - two per source snapshot
 * commit, two per reconciliation git-commit evidence ref, plus the worktree probe - and on Windows
 * each spawn costs on the order of 100 ms. Measured: one sweep took 10.5 s, and a CPU profile
 * attributed 98.6% of it to idle time blocked on `spawn`, not to parsing or validation. The shipped
 * suite performs 62 sweeps, which accounted for essentially all of `corpus-sweep.test.ts`'s
 * ~13 minutes.
 *
 * Caching is sound because the answers are immutable: a Git object's type and content are fixed by
 * its sha, and the worktree root of a given directory does not change within a process. Failures
 * are cached too, since a missing object stays missing for that root. The key includes the root, so
 * the copied-corpus and missing-metadata tests - which sweep DIFFERENT roots - are unaffected.
 *
 * This changes no result. It is not a general performance optimisation of the decision path, which
 * remains out of scope and owned by FK-P1.
 */
const gitResultCache = new Map<
  string,
  { readonly ok: true; readonly value: Buffer } | { readonly ok: false; readonly error: Error }
>()

function runGit(root: string, args: readonly string[]): Buffer {
  const key = JSON.stringify([root, ...args])
  const cached = gitResultCache.get(key)
  if (cached !== undefined) {
    if (cached.ok) return cached.value
    throw cached.error
  }
  try {
    const value = execFileSync('git', [...args], {
      cwd: root,
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 64 * 1024 * 1024,
    })
    gitResultCache.set(key, { ok: true, value })
    return value
  } catch (error) {
    gitResultCache.set(key, { ok: false, error: error as Error })
    throw error
  }
}

function runGitText(root: string, args: readonly string[]): string {
  return runGit(root, args).toString('utf8')
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
    // Any interior colon. On NTFS `file.md:stream` and `file.md::$DATA` name alternate data
    // streams, and `file.md::$DATA` resolves to the file's DEFAULT stream - so such a path reads
    // real content under a name the registry never declared. Segment-wise `realpathSync` kept all
    // four probed shapes contained and every one was already refused, but only INCIDENTALLY, by
    // failing to resolve. A registered locator must be refused by policy, not by accident.
    segments.some((segment) => segment.includes(':')) ||
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

/**
 * Is `repoRoot` the exact root of a real Git worktree, and what does it cost the caller if not?
 *
 * AC12 as amended by R14: a `--repo-root` that does not name one is OPERATOR MISCONFIGURATION -
 * exit 2, never exit 1. Exit 1 asserts that canon is invalid, which is a false accusation to level
 * at a registry because someone mistyped a path.
 *
 * This guard used to live only inside `sweepRegistrySources`, so `validateRegistry(document,
 * { repoRoot })` accepted ANY path: a registry with one retired rule and a nonexistent root
 * reported four `RETIREMENT_EVIDENCE_INCOMPLETE` violations and exited 1, blaming the registry for
 * a directory that was never there. Both entry points now share this one implementation, so they
 * cannot drift apart again.
 */
function repoRootCheck(repoRoot: string): {
  readonly gitReady: boolean
  readonly violations: readonly ValidationViolation[]
} {
  const root = resolve(repoRoot)
  try {
    const canonicalRoot = realpathSync(root)
    const worktreeRoot = realpathSync(
      runGitText(canonicalRoot, ['rev-parse', '--show-toplevel']).trim(),
    )
    if (canonicalRoot.toLowerCase() === worktreeRoot.toLowerCase()) {
      return { gitReady: true, violations: [] }
    }
    return {
      gitReady: false,
      violations: [
        violation(
          'REPO_ROOT_INVALID',
          'repository root is not the exact root of a real Git worktree',
        ),
      ],
    }
  } catch (error) {
    return {
      gitReady: false,
      violations: [
        violation(
          // Both branches are operator misconfiguration and both exit 2 (amended AC12). The
          // nonexistent-root case keeps IO_ERROR; an existing path that is not a worktree root is
          // REPO_ROOT_INVALID. Neither is exit 1, which is reserved for "the registry is invalid".
          existsSync(root) ? 'REPO_ROOT_INVALID' : 'IO_ERROR',
          `repository root lacks mandatory real-Git evidence: ${(error as Error).message}`,
        ),
      ],
    }
  }
}

export function sweepRegistrySources(document: unknown, repoRoot: string): ValidationResult {
  // The sweep has a repo root, so retirement evidence is digest-verified rather than reported
  // unverified. The verification itself now lives in `validateRegistry`, so the sweep no longer
  // carries its own copy and the two cannot drift apart.
  const base = validateRegistry(document, { repoRoot })
  if (!validateStructure(document)) return base
  const registry = document as AuthorityEnforcementRegistry
  const violations = [...base.violations]
  const root = resolve(repoRoot)
  // The guard itself now runs inside `validateRegistry`, so its violation is already in `base`.
  // Only the answer is needed here; re-reporting it would double every misconfiguration message.
  const { gitReady } = repoRootCheck(repoRoot)
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
    // R24: excise declared volatile regions BEFORE block discovery and before ordinal assignment,
    // so volatile content never occupies an ordinal (R26 ruling 1). Doing it here, on the source
    // text, is what makes one implementation serve both readers of this corpus - the generator
    // masks with the same two functions before building its own block map.
    let scanContent = content
    if (source.path.endsWith('.md')) {
      const requests: VolatileRegionRequest[] = []
      for (const region of registry.volatileRegions) {
        if (region.sourceId !== source.sourceId) continue
        const heading = source.inventoryItems.find((item) => item.itemId === region.headingItemId)
        if (heading === undefined || heading.locator.kind !== 'heading') continue
        requests.push({
          regionId: region.regionId,
          headingPath: heading.locator.anchor,
          extent: region.extent,
        })
      }
      if (requests.length > 0) {
        const resolution = resolveVolatileRegions(content, requests)
        for (const failure of resolution.failures) {
          violations.push(
            violation('VOLATILE_REGION_INVALID', failure.message, { sourcePath: source.path }),
          )
        }
        // The document-derived half of the anti-laundering control, and deliberately not the
        // hermetic half's predicate. That one asks whether a published item's ANCHOR falls in the
        // region. This one asks whether a published item's own normative TEXT is among the bytes
        // being excised, which catches what anchors cannot: a governed statement that the region
        // swallows while its anchor sits elsewhere, and a region declared before the curation act
        // that was supposed to precede it.
        const sourceLines = content.replace(/\r\n?/g, '\n').split('\n')
        for (const extent of resolution.extents) {
          const excised = [
            ...extent.excisedLines.map((index) => sourceLines[index] ?? ''),
            ...extent.clearedCells.map(
              ({ line, cell }) =>
                (sourceLines[line] ?? '').trim().split('|').slice(1, -1)[cell] ?? '',
            ),
          ].join('\n')
          const excisedText = normalizeRuleText(excised)
          for (const item of source.inventoryItems) {
            if (item.ruleIds.length === 0) continue
            const statement = normalizeRuleText(item.normalizedExcerpt)
            if (statement === '' || !excisedText.includes(statement)) continue
            violations.push(
              violation(
                'VOLATILE_REGION_OVERLAP',
                `volatile region '${extent.regionId}' excises the published text of inventory item '${item.itemId}', which publishes ${item.ruleIds.join(', ')}`,
                { sourcePath: source.path, locator: item.locator.anchor },
              ),
            )
          }
        }
        scanContent = maskVolatileSource(content, resolution.extents)
      }
    }
    const markdown = source.path.endsWith('.md') ? markdownDocumentMap(scanContent) : undefined
    for (const item of source.inventoryItems) {
      const extracted = extractLocator(scanContent, item.locator, markdown)
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
    for (const [anchor] of markdown?.blocks ?? []) {
      const tableKey = anchor.includes(':table-row:')
        ? anchor.slice(anchor.lastIndexOf(':table-row:') + ':table-row:'.length)
        : null
      const coveredByExactTableItem =
        tableKey !== null &&
        source.inventoryItems.some(
          (item) => item.locator.kind === 'table-row' && item.locator.anchor === tableKey,
        )
      if (
        !coveredByExactTableItem &&
        !source.inventoryItems.some((item) => item.locator.anchor === anchor)
      ) {
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
        const registeredRules = new Set(
          source.inventoryItems
            .filter(
              (item) =>
                item.locator.anchor.startsWith('yaml-rule:') ||
                item.locator.anchor.startsWith('yaml-container:'),
            )
            .map((item) => item.locator.anchor),
        )
        for (const anchor of permissionProfileRuleMap(content).keys()) {
          if (!registeredRules.has(anchor)) {
            violations.push(
              violation('SOURCE_ITEM_UNCOVERED', 'permission profile rule is not inventoried', {
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
      const markdownLines = markdown?.lines ?? []
      const fenced = markdown?.fenced ?? new Set<number>()
      const registeredHeadings = new Set(
        source.inventoryItems
          .filter((item) => item.locator.kind === 'heading')
          .map((item) => item.locator.anchor.split(' > ').at(-1)),
      )
      const bindingHeadings = markdownLines
        .map((line, index) => ({ line: line.trim(), index }))
        .filter(
          ({ line, index }) =>
            !fenced.has(index) &&
            /^#{2,6}\s+.*\b(binding|authority|constraint|decision|gate|stop)\b/i.test(line),
        )
        .map(({ line }) => line)
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
        for (let index = 0; index < markdownLines.length; index += 1) {
          if (fenced.has(index)) continue
          const line = markdownLines[index] ?? ''
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
        for (let index = 0; index < markdownLines.length; index += 1) {
          if (fenced.has(index)) continue
          const line = markdownLines[index] ?? ''
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
        for (let index = 0; index < markdownLines.length; index += 1) {
          if (fenced.has(index)) continue
          const line = markdownLines[index] ?? ''
          const number = /^(\d+)\.\s/.exec(line.trim())?.[1]
          if (number !== undefined && Number(number) > 14) {
            violations.push(
              violation('SOURCE_ITEM_UNCOVERED', 'new standing constraint is not inventoried', {
                sourcePath: source.path,
                locator: `constraint-${number}`,
              }),
            )
          }
        }
      }
      for (let index = 0; index < markdownLines.length; index += 1) {
        if (fenced.has(index)) continue
        const line = markdownLines[index] ?? ''
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
  for (const reconciliation of registry.reconciliations) {
    for (const evidence of reconciliation.observedEvidence) {
      if (evidence.kind === 'git-commit' && gitReady) {
        try {
          const objectType = runGitText(root, ['cat-file', '-t', evidence.reference]).trim()
          if (objectType !== 'commit') throw new Error(`object type is '${objectType}'`)
          const bytes = runGit(root, ['cat-file', '-p', evidence.reference])
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
          runGit(root, ['cat-file', '-e', `${parsed.commit}:${parsed.path}`])
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

/**
 * Digest-verify D11 retirement evidence against the real filesystem: resolve each artifact
 * path, confirm its bytes hash to the recorded digest, and confirm the artifact is a typed,
 * commit-bound, rule-bound record of the right kind with a passing result.
 *
 * Extracted from `sweepRegistrySources` so `validateRegistry` can gate on it too. Before this,
 * digest verification existed ONLY in the sweep, which neither `resolveAuthority` nor the
 * `validate` CLI ever called - so four correctly-typed artifacts at four real paths with
 * all-zero digests were accepted by the predicate that actually gates authority resolution.
 */
function retirementEvidenceViolations(
  registry: AuthorityEnforcementRegistry,
  root: string,
): ValidationViolation[] {
  const violations: ValidationViolation[] = []
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
  return violations
}

/**
 * Gate retirement on genuinely digest-verified evidence.
 *
 * Retirement REMOVES enforcement, so the fail-closed direction is that an unverifiable retirement
 * must not take effect. Rather than model "unverified retirement" inside `resolveAuthority` - which
 * would force filesystem access onto the per-query path FK-P1 calls, against D21's latency budget -
 * an unverifiable retirement makes the DOCUMENT invalid. `resolveAuthority` then returns
 * REQUIRE_HUMAN / REGISTRY_INVALID and never reaches the question of whether a retired rule
 * controls, so it keeps its signature and does no I/O.
 *
 * This preserves AC5's flat "retired rules never control": a verified retirement is genuinely
 * retired, and an unverified one invalidates rather than silently taking effect. Fail-closed, not
 * fail-quiet.
 */
function retirementVerificationViolations(
  registry: AuthorityEnforcementRegistry,
  repoRoot: string | undefined,
): ValidationViolation[] {
  const retired = registry.rules.filter(
    (rule) => rule.retirementState === 'retired-from-agent-reading',
  )
  if (retired.length === 0) return []
  if (repoRoot === undefined) {
    return retired.map((rule) =>
      violation(
        'RETIREMENT_EVIDENCE_UNVERIFIED',
        'retirement evidence cannot be digest-verified without a repository root; supply --repo-root to verify it',
        { ruleId: rule.ruleId },
      ),
    )
  }
  return retirementEvidenceViolations(registry, resolve(repoRoot))
}
