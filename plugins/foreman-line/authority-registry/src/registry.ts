import type { SchemaFile } from '../../schema-scaffold/src/registry.js'
import { authorityEnforcementRegistrySchema } from './schemas.js'

export const R12_PRIOR_REGISTRY_COMMIT = '9059bb249f75805b34a68397d53dfa5608fd6ad4'
export const R13_PRIOR_REGISTRY_COMMIT = '0683bc059ec54a8652624fd2b7be72fe157cac14'
/**
 * The committed registry superseded by the R14 rework: the last commit that changed
 * `authority-enforcement-registry.yaml` before this one. Its short sha names the R14 migration
 * record, matching the convention used by every prior `registry-rework-*` id.
 */
export const R14_PRIOR_REGISTRY_COMMIT = 'df8155a01989f69e9872ef5c08bfc18ad6b8cb03'
/**
 * The committed registry superseded by the R24 volatile-region rework.
 *
 * R28 states the naming rule that was previously folklore: one record per rework round, named for
 * the commit that last touched the shipped YAML at the moment that round's regeneration is
 * committed - determined then, not pre-computed. Two YAML-touching commits landed after
 * `registry-rework-df8155a` without producing records, which is what made the convention look
 * per-commit. Measured with `git log -1 -- authority-enforcement-registry.yaml` at
 * implementation time.
 */
export const R15_PRIOR_REGISTRY_COMMIT = '40394be5fb7a5376579025513236019ad48dd86c'

export const R13_NORMATIVE_MARKDOWN_AUDIT_KEYS = [
  'fk-charter:item.16f0036885ba',
  'fk-charter:item.eebf9c2d70f0',
  'fk-charter:item.93c91aa31d91',
  'fk-charter:item.263bc52874f2',
  'fk-charter:item.30e0d34f1b24',
  'fk-charter:item.69c53b27e66e',
  'fk-charter:item.2a524c1ea63f',
  'fk-charter:item.ac1c865d9920',
  'fk-charter:item.d93995e783e9',
  'fk-charter:item.5f601badf99a',
  'fk-charter:item.a554def3d728',
  'fk-charter:item.5149fedd28d9',
  'fk-charter:item.a010e2bb3224',
  'fk-charter:item.2fec5af13994',
  'fk-charter:item.9b018ade48a1',
  'fk-charter:item.fdf4aae4f444',
  'fk-charter:item.a7fd9c343f75',
  'fk-charter:item.e39357b6cda0',
  'fk-charter:item.5163b20d9238',
  'fk-charter:item.fd16f98ac72d',
  'fk-charter:item.1c4b84a3f6e1',
  'fk-charter:item.6abf5135d0ef',
  'fk-charter:item.8ab6cbecef4c',
  'fk-plan-review-findings:item.554ba439cada',
  'fk-plan-review-findings:item.6ff39687a839',
  'fk-plan-review-findings:item.3c43601e3d2f',
  'fk-plan-review-findings:item.f54257fe099a',
  'fk-plan-review-findings:item.ab6a16944d2f',
  'fk-plan-review-findings:item.4d9b78e31b02',
  'fk-plan-review-findings:item.0396191b9326',
  'fk-plan-review-findings:item.7707267744f9',
  'fk-plan-review-findings:item.9b5352c183dc',
  'fk-plan-review-findings:item.ce1db4fdbee9',
  'fk-plan-review-findings:item.1dc87fc8592c',
  'fk-plan-review-findings:item.bb6120e704af',
  'fk-plan-review-findings:item.fa165ab0979f',
  'fk-plan-review-findings:item.d55cad654de4',
  'fk-loop-directive:item.10f2e751ab84',
  'fk-loop-directive:item.47629cf1fc4c',
  'fk-loop-directive:item.4aef5cb209b8',
  'spec-convention:item.62f6edc36b8b',
  'spec-convention:item.c36070cf2c60',
  'spec-convention:item.e545a319a3de',
  'spec-convention:item.d5e40c3874af',
  'spec-convention:item.5bff890c7cec',
  'spec-convention:item.52fdb898de63',
  'spec-convention:item.7caef7ff784d',
  'spec-convention:item.64d35b1215b4',
  'spec-convention:item.20e3ab7c6586',
  'spec-convention:item.3e919a5cee2e',
  'spec-convention:item.2bdb867c0e6a',
  'spec-convention:item.837d1622b944',
  'spec-convention:item.c99695220158',
  'spec-convention:item.491a5c7af5b5',
  'spec-convention:item.14705f1966b8',
  'spec-convention:item.a1690d484c73',
  'spec-convention:item.e85fe9fde0d0',
  'spec-convention:item.598b9f221ffb',
  'spec-convention:item.442b87dc8a83',
  'spec-convention:item.d255a483c4c0',
  'spec-convention:item.4f98b9a5d907',
  'coordinator-pattern:item.d113f7062a62',
  'parcel-driven-development:item.8067938b9fb8',
  'parcel-driven-development:item.2866bb9f81f4',
  'parcel-driven-development:item.7faadaa8b290',
  'parcel-driven-development:item.8ae65aba6e43',
  'parcel-driven-development:item.172ef7560899',
  'parcel-driven-development:item.e266b0440621',
  'parcel-driven-development:item.280d66f100f8',
  'parcel-driven-development:item.182b69cda4d8',
  'parcel-driven-development:item.5dcdb4bf617b',
  'parcel-driven-development:item.2ce381c60ae5',
  'parcel-driven-development:item.2e977b751589',
  'parcel-driven-development:item.c90d4f6b2a67',
  'parcel-driven-development:item.d4936abd71e5',
  'parcel-driven-development:item.cb6a26ea20d2',
  'parcel-driven-development:item.0da0e8cfe7b4',
  'parcel-driven-development:item.412fedf75fd6',
  'parcel-driven-development:item.cae149f1dde3',
  'parcel-driven-development:item.30fb8d128904',
  'parcel-driven-development:item.28d557fd0609',
  'parcel-driven-development:item.dd0fbc97a404',
  'parcel-driven-development:item.98b6be8e38c1',
  'parcel-driven-development:item.db0f41c5a352',
  'parcel-driven-development:item.045e3711856c',
  'parcel-driven-development:item.f34eebfaa3ae',
  'parcel-driven-development:item.6b64e566bd65',
  'parcel-driven-development:item.aef1a09ddc83',
  'parcel-driven-development:item.920498b8f99d',
  'parcel-driven-development:item.297f53f6c7f8',
  'parcel-driven-development:item.625993e90707',
  'parcel-driven-development:item.90bebdc62c66',
  'parcel-driven-development:item.8d689a451788',
  'parcel-driven-development:item.ddffd067d160',
  'parcel-driven-development:item.ae5141284aab',
  'parcel-driven-development:item.a65e99343af1',
  'parcel-driven-development:item.903e887520e9',
  'parcel-driven-development:item.ca55ff730385',
  'parcel-driven-development:item.42d33c9112ee',
  'parcel-driven-development:item.ff02e3c0625a',
  'parcel-driven-development:item.043cb79508b6',
  'parcel-driven-development:item.59d9ddd2525f',
  'parcel-driven-development:item.23ba36df2dba',
  'parcel-driven-development:item.b3d5f05de17a',
  'parcel-driven-development:item.902fa0f00cb1',
  'parcel-driven-development:item.8c1eb058ba6e',
  'parcel-driven-development:item.33ff0b964075',
  'parcel-driven-development:item.b4c3285fe0b8',
  'parcel-driven-development:item.ca223950ecbb',
  'parcel-driven-development:item.26682ed15b8e',
  'parcel-driven-development:item.03ca84507e36',
  'parcel-driven-development:item.010395994ec1',
  'parcel-driven-development:item.d9dc4c3e1a8e',
  'parcel-driven-development:item.8ee487280378',
  'parcel-driven-development:item.03e5bb080e0d',
  'parcel-driven-development:item.07c74f6739a9',
  'parcel-driven-development:item.f383285440fa',
  'parcel-driven-development:item.f6aff55587cf',
  'parcel-driven-development:item.56aa996512b7',
  'parcel-driven-development:item.97bbae51c0ec',
  'parcel-driven-development:item.d51b68985a3e',
  'parcel-driven-development:item.34c7b9b622ff',
  'parcel-driven-development:item.c81dd01f8334',
  'parcel-driven-development:item.c5b6833daea2',
  'parcel-driven-development:item.79eeca033829',
  'parcel-driven-development:item.52c3627980a0',
  'parcel-driven-development:item.a10f3b4fd29b',
  'parcel-driven-development:item.a1c52bb571d7',
  'parcel-driven-development:item.f003aad4abee',
  'foreman-line-plan:item.66035e452cb7',
  'foreman-line-plan:item.b2910dc005f4',
  'foreman-line-plan:item.90d92844e759',
  'foreman-line-plan:item.6b96819899db',
  'foreman-line-plan:item.4788aab0a4ab',
  'foreman-line-plan:item.170ba06e6583',
  'foreman-line-plan:item.7afe875dd595',
  'foreman-line-plan:item.660998dba7bc',
  'foreman-line-plan:item.2cc508c75d5c',
  'foreman-line-plan:item.389ca82e4c31',
  'foreman-line-plan:item.a9cf544f084d',
  'foreman-line-plan:item.50c5080f54d8',
  'foreman-line-plan:item.8f4d0b506111',
  'foreman-line-plan:item.7c48a8f54fe0',
  'foreman-line-plan:item.c0003a401b33',
  'foreman-line-plan:item.3cd9cdf75548',
  'foreman-line-plan:item.d59407e052e5',
] as const

export const R13_NORMATIVE_MARKDOWN_PUBLICATION_KEYS: ReadonlySet<string> = new Set([
  'fk-charter:item.2a524c1ea63f',
  'fk-charter:item.5f601badf99a',
  'fk-charter:item.a554def3d728',
  'fk-charter:item.5149fedd28d9',
  'fk-charter:item.a010e2bb3224',
  'fk-charter:item.2fec5af13994',
  'fk-charter:item.9b018ade48a1',
  'fk-charter:item.fdf4aae4f444',
  'fk-charter:item.a7fd9c343f75',
  'fk-charter:item.e39357b6cda0',
  'fk-charter:item.5163b20d9238',
  'fk-charter:item.fd16f98ac72d',
  'spec-convention:item.5bff890c7cec',
  'spec-convention:item.7caef7ff784d',
  'spec-convention:item.64d35b1215b4',
  'spec-convention:item.20e3ab7c6586',
  'spec-convention:item.2bdb867c0e6a',
  'spec-convention:item.837d1622b944',
  'spec-convention:item.c99695220158',
  'spec-convention:item.491a5c7af5b5',
  'spec-convention:item.14705f1966b8',
  'spec-convention:item.a1690d484c73',
  'spec-convention:item.598b9f221ffb',
  'spec-convention:item.4f98b9a5d907',
  'parcel-driven-development:item.7faadaa8b290',
  'parcel-driven-development:item.8ae65aba6e43',
  'parcel-driven-development:item.f34eebfaa3ae',
  'parcel-driven-development:item.6b64e566bd65',
  'parcel-driven-development:item.aef1a09ddc83',
  'parcel-driven-development:item.297f53f6c7f8',
  'parcel-driven-development:item.ae5141284aab',
  'parcel-driven-development:item.043cb79508b6',
  'parcel-driven-development:item.23ba36df2dba',
  'parcel-driven-development:item.b3d5f05de17a',
  'parcel-driven-development:item.33ff0b964075',
  'parcel-driven-development:item.b4c3285fe0b8',
  'parcel-driven-development:item.ca223950ecbb',
  'parcel-driven-development:item.03ca84507e36',
  'parcel-driven-development:item.010395994ec1',
  'parcel-driven-development:item.d9dc4c3e1a8e',
  'parcel-driven-development:item.8ee487280378',
  'parcel-driven-development:item.03e5bb080e0d',
  'parcel-driven-development:item.f383285440fa',
  'parcel-driven-development:item.f6aff55587cf',
  'parcel-driven-development:item.56aa996512b7',
  'parcel-driven-development:item.97bbae51c0ec',
  'parcel-driven-development:item.d51b68985a3e',
  'parcel-driven-development:item.34c7b9b622ff',
  'parcel-driven-development:item.a10f3b4fd29b',
  'parcel-driven-development:item.a1c52bb571d7',
] as const)

export interface FrozenMarkdownRuleTarget {
  readonly sourceId: string
  readonly kind: 'line-excerpt' | 'numbered-item' | 'table-row'
  readonly anchor: string
}

export const R12_LEGACY_MARKDOWN_RULE_TARGETS: Readonly<Record<string, FrozenMarkdownRuleTarget>> =
  {
    'rule.spec-convention.e6f5fa8543a1': {
      sourceId: 'spec-convention',
      kind: 'numbered-item',
      anchor:
        'md-block:# Spec-Driven Development Convention > ## 4. Required Spec Schema > ### 4.6 Schema v0.2 Fields (added W0-P2):list-item:4',
    },
    'rule.spec-convention.ac5ff7afd06f': {
      sourceId: 'spec-convention',
      kind: 'numbered-item',
      anchor:
        'md-block:# Spec-Driven Development Convention > ## 4. Required Spec Schema > ### 4.8 `Allowed Files` Mutation Authority:list-item:1',
    },
    'rule.spec-convention.5145ab15549c': {
      sourceId: 'spec-convention',
      kind: 'numbered-item',
      anchor:
        'md-block:# Spec-Driven Development Convention > ## 4. Required Spec Schema > ### 4.8 `Allowed Files` Mutation Authority:list-item:2',
    },
    'rule.spec-convention.fd82127bf9f9': {
      sourceId: 'spec-convention',
      kind: 'line-excerpt',
      anchor:
        'md-block:# Spec-Driven Development Convention > ## 4. Required Spec Schema > ### 4.8 `Allowed Files` Mutation Authority:paragraph:3',
    },
    'rule.spec-convention.022fc00afe7b': {
      sourceId: 'spec-convention',
      kind: 'numbered-item',
      anchor:
        'md-block:# Spec-Driven Development Convention > ## 8. Dispatch Model (How Agents Consume Specs):list-item:4',
    },
    'rule.coordinator-pattern.dedbefc1b097': {
      sourceId: 'coordinator-pattern',
      kind: 'table-row',
      anchor: 'md-block:# The Coordinator Pattern > ## The three human gates:table-row:1',
    },
    'rule.coordinator-pattern.91dd60b00fd6': {
      sourceId: 'coordinator-pattern',
      kind: 'table-row',
      anchor: 'md-block:# The Coordinator Pattern > ## The three human gates:table-row:2',
    },
    'rule.coordinator-pattern.f7686ab58db7': {
      sourceId: 'coordinator-pattern',
      kind: 'table-row',
      anchor: 'md-block:# The Coordinator Pattern > ## The three human gates:table-row:3',
    },
    'rule.standing-constraints.c5880644c95c': {
      sourceId: 'standing-constraints',
      kind: 'line-excerpt',
      anchor:
        'md-block:# Standing Constraints — included by reference in every dispatch kickstarter:paragraph:1',
    },
    'rule.foreman-line-plan.two-gate-thesis': {
      sourceId: 'foreman-line-plan',
      kind: 'line-excerpt',
      anchor: 'md-block:# The Foreman Line — Master Plugin Plan:paragraph:1',
    },
    'rule.spec-linter-readme.9a889881a236': {
      sourceId: 'spec-linter-readme',
      kind: 'table-row',
      anchor:
        'md-block:# @foreman-line/spec-linter > ## The four v0.2 fields:table-row:`permission_profile:`',
    },
    'rule.spec-linter-readme.b4f5d76d68ec': {
      sourceId: 'spec-linter-readme',
      kind: 'line-excerpt',
      anchor: 'md-block:# @foreman-line/spec-linter > ## The four v0.2 fields:paragraph:1',
    },
    'rule.permission-profiles-readme.729be3615f8d': {
      sourceId: 'permission-profiles-readme',
      kind: 'line-excerpt',
      anchor:
        'md-block:# Foreman Line — Permission-Profile Registry, Validator + Dispatch-Time Emitter (P1 + P3) > ## Deny-first ruling (D9):paragraph:1',
    },
    'rule.permission-profiles-readme.d11b9d38f924': {
      sourceId: 'permission-profiles-readme',
      kind: 'line-excerpt',
      anchor:
        'md-block:# Foreman Line — Permission-Profile Registry, Validator + Dispatch-Time Emitter (P1 + P3) > ## Session-start-load bound — with its failure modes (F-H):paragraph:1',
    },
    'rule.permission-profiles-readme.1101805f1c9e': {
      sourceId: 'permission-profiles-readme',
      kind: 'numbered-item',
      anchor:
        'md-block:# Foreman Line — Permission-Profile Registry, Validator + Dispatch-Time Emitter (P1 + P3) > ## Session-start-load bound — with its failure modes (F-H):list-item:2',
    },
    'rule.permission-profiles-readme.415efa3f5e3b': {
      sourceId: 'permission-profiles-readme',
      kind: 'numbered-item',
      anchor:
        'md-block:# Foreman Line — Permission-Profile Registry, Validator + Dispatch-Time Emitter (P1 + P3) > ## Session-start-load bound — with its failure modes (F-H):list-item:3',
    },
  }

export const allSchemaFiles: readonly SchemaFile[] = [
  { name: 'authority-enforcement-registry', schema: authorityEnforcementRegistrySchema },
]
