import type { SchemaFile } from '../../schema-scaffold/src/registry.js'
import { authorityEnforcementRegistrySchema } from './schemas.js'

export const R12_PRIOR_REGISTRY_COMMIT = '9059bb249f75805b34a68397d53dfa5608fd6ad4'

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
