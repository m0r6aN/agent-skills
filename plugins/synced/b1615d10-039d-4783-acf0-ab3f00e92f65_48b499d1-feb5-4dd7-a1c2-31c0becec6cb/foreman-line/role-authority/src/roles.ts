import type { SchemaObject } from 'ajv'

/**
 * The logical roles named by the Foreman authority contract. Concrete model
 * bindings are deliberately kept out of this vocabulary and belong to the
 * provider-neutral routing policy.
 * This vocabulary is fixed by charter decision, not a tunable knob -- adding or
 * renaming a role here is a decision-table change (WF-P1's own Constraints:
 * "do not re-open D1-D37"), not a routine edit.
 */
export type RoleId =
  | 'judge'
  | 'coordinator'
  | 'integrator'
  | 'builder'
  | 'operator'
  | 'scout'
  | 'verifier'
  | 'deepAnalyst'
  | 'multimodal'
  | 'documentExtractor'
  | 'utilityFallback'

export const ROLE_IDS = [
  'judge',
  'coordinator',
  'integrator',
  'builder',
  'operator',
  'scout',
  'verifier',
  'deepAnalyst',
  'multimodal',
  'documentExtractor',
  'utilityFallback',
] as const satisfies readonly RoleId[]

/**
 * D16: build/verify/integrate/accept are distinct and mutually exclusive --
 * a role is exactly one category, never a blend.
 */
export type RoleCategory = 'build' | 'verify' | 'integrate' | 'accept'

export const ROLE_CATEGORIES = [
  'build',
  'verify',
  'integrate',
  'accept',
] as const satisfies readonly RoleCategory[]

/** D18: the four risk classes that drive routing. */
export type RiskClass = 'R0' | 'R1' | 'R2' | 'R3'

export const RISK_CLASSES = ['R0', 'R1', 'R2', 'R3'] as const satisfies readonly RiskClass[]

/**
 * Role identity: which logical role, which category it belongs to, and --
 * for the three frontier roles bound by D2/D4/D6 -- an optional pointer into
 * the model registry.
 *
 * `registryKey` and `modelFamily` are deliberately **open `string`, never a
 * closed union of literal model/family identifiers** (e.g. NOT
 * `'fable-5' | 'opus-5' | 'sonnet-5'`). D25 requires model/provider IDs to be
 * registry-driven, not hard-coded; a closed enum here would hard-code exactly
 * what D25 forbids and would duplicate the registry that `routing-policy/`
 * already owns and that WF-P3 is chartered to extend. That duplication is
 * finding F6 -- a collision this goal has already paid for once. Do not
 * "tighten" this to an enum; doing so silently recreates F6 one layer up.
 * Registry keys may be used as values of this open string, but they must never
 * become the type's own literal union.
 */
export interface RoleIdentity {
  readonly role: RoleId
  readonly category: RoleCategory
  /** Present only for roles with a ratified frontier binding (D2/D4/D6). */
  readonly registryKey?: string
  /** Model-family tag, open string; see the class doc-comment for why. */
  readonly modelFamily?: string
}

export const roleIdentitySchema: SchemaObject = {
  type: 'object',
  additionalProperties: false,
  required: ['role', 'category'],
  properties: {
    role: { type: 'string', enum: [...ROLE_IDS] },
    category: { type: 'string', enum: [...ROLE_CATEGORIES] },
    registryKey: { type: 'string', minLength: 1 },
    modelFamily: { type: 'string', minLength: 1 },
  },
}

export const riskClassSchema: SchemaObject = {
  type: 'string',
  enum: [...RISK_CLASSES],
}

export const roleCategorySchema: SchemaObject = {
  type: 'string',
  enum: [...ROLE_CATEGORIES],
}

/**
 * D20: per-role authority flags. "Workers may recommend escalation but
 * cannot self-promote, self-approve, or close a critical task" (charter
 * D20) -- this package declares the flag *shape*; WF-P13/WF-P15 enforce it
 * at runtime. The populated per-role values in `src/instances.ts` are the
 * ratified fact this package owns (coordinator amendment F3): no role's
 * charter section 6 grants it authority to self-promote or self-approve its
 * own output, and only the Judge (6.1: independent adversarial acceptance,
 * the `ACCEPT`/`REJECT`/`REQUIRE_HUMAN` verdict terminus in the charter's
 * architecture diagram, section 5) is charter-authorized to close critical
 * work at all -- distinct from *self*-closing, which section 6.1's "no
 * self-remediation followed by self-approval" restriction forbids even for
 * the Judge.
 */
export interface RoleAuthority {
  readonly role: RoleId
  readonly canSelfPromote: boolean
  readonly canSelfApprove: boolean
  readonly canCloseCriticalWork: boolean
}

export const roleAuthoritySchema: SchemaObject = {
  type: 'object',
  additionalProperties: false,
  required: ['role', 'canSelfPromote', 'canSelfApprove', 'canCloseCriticalWork'],
  properties: {
    role: { type: 'string', enum: [...ROLE_IDS] },
    canSelfPromote: { type: 'boolean' },
    canSelfApprove: { type: 'boolean' },
    canCloseCriticalWork: { type: 'boolean' },
  },
}

/**
 * D21: model-family diversity required for elevated/critical (R2/R3)
 * verification -- a minimum count of *distinct* model families among the
 * verifiers assigned, not a naming of which families qualify (that naming
 * stays open string on `RoleIdentity.modelFamily`, per D25/F6 above). The
 * ratified instances in `src/instances.ts` (coordinator amendment F3) state
 * the actual minimum charter D21 requires -- "critical work requires
 * model-family diversity between primary implementation and independent
 * verification" -- as `minDistinctModelFamilies: 2` for both `R2` and `R3`.
 */
export interface ModelFamilyDiversityRule {
  readonly riskClass: RiskClass
  readonly minDistinctModelFamilies: number
}

export const modelFamilyDiversityRuleSchema: SchemaObject = {
  type: 'object',
  additionalProperties: false,
  required: ['riskClass', 'minDistinctModelFamilies'],
  properties: {
    riskClass: { type: 'string', enum: [...RISK_CLASSES] },
    minDistinctModelFamilies: { type: 'integer', minimum: 1 },
  },
}
