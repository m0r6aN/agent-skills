/**
 * Spec frontmatter shapes (W0-P2): TypeScript types for SPEC-CONVENTION §4 v0.3.
 * The SpecFrontmatter interface has a matching hand-authored JSON Schema in
 * `schemas/spec-frontmatter.schema.json` — the two representations are proven to
 * agree by `tests/parity.test.ts`, never by generating one from the other
 * (ajv's `JSONSchemaType` is banned as a schema authority in this repo).
 */

export const RISK_LEVELS = ['low', 'standard', 'elevated', 'critical'] as const
export type RiskLevel = (typeof RISK_LEVELS)[number]

export const ROUTING_CLASSES = [
  'boilerplate',
  'standard-feature',
  'architecture/risk',
  'implementation/standard',
] as const
export type RoutingClass = (typeof ROUTING_CLASSES)[number]

export const VERIFICATION_CLASSES = ['equivalence-provable', 'judgment-required'] as const
export type VerificationClass = (typeof VERIFICATION_CLASSES)[number]

/**
 * RCM D7 (schema v0.4): the closed `expertise` vocabulary, restated literally
 * from its owner `foreman-config/src/expertise.ts` (lockstep-tested in
 * `tests/rcm-fields.test.ts` — the repo's restatement discipline, never a new
 * cross-package runtime import).
 */
export const EXPERTISE_AREAS = [
  'engineering',
  'architecture',
  'security',
  'legal',
  'finance',
  'writing',
  'research',
  'data',
] as const
export type ExpertiseArea = (typeof EXPERTISE_AREAS)[number]

/**
 * RCM D8 (schema v0.4): the only input modalities the provider catalogs carry.
 * Restated from routing-policy's `types.ts` (`INPUT_MODALITIES`), lockstep-tested.
 */
export const INPUT_MODALITIES = ['text', 'image'] as const
export type InputModality = (typeof INPUT_MODALITIES)[number]

/**
 * RCM D8 (schema v0.4): `thinking_level:` values — the Pi `ThinkingLevel`
 * names as carried by the catalog's `thinkingLevelMap` keys (evidence:
 * `host-owner-export/catalog-projection.json`). Restated from routing-policy's
 * `types.ts` (`THINKING_LEVELS`), lockstep-tested.
 */
export const THINKING_LEVELS = ['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'] as const
export type ThinkingLevel = (typeof THINKING_LEVELS)[number]

export const SPEC_STATUSES = ['draft', 'active', 'done', 'superseded'] as const
export type SpecStatus = (typeof SPEC_STATUSES)[number]

/**
 * Shape of a spec's YAML frontmatter at SPEC-CONVENTION schema v0.4.
 * Required fields: ticket, title, status, owner, created, updated, risk,
 * surfaces, routing_class, verification_class.
 * Optional fields: supersedes, superseded_by, permission_profile,
 * data_classification, involves, expertise, inputs, min_context, thinking_level.
 *
 * Semantic invariant (not expressible in JSON Schema): status 'superseded'
 * requires a non-null superseded_by — enforced by validateSpecFrontmatter.
 */
export interface SpecFrontmatter {
  readonly ticket: string
  readonly title: string
  readonly status: SpecStatus
  readonly owner: string
  readonly created: string
  readonly updated: string
  readonly supersedes: string | null
  readonly superseded_by: string | null
  readonly risk: RiskLevel
  readonly surfaces: readonly string[]
  readonly routing_class: RoutingClass
  /** Required verification route declaration; there is deliberately no default. */
  readonly verification_class: VerificationClass
  readonly permission_profile?: string
  /** CLOSE-P2 (W4-P5 ruling): optional sensitivity classification; no enum yet. */
  readonly data_classification?: string
  /**
   * P1a (SPEC-CONVENTION §4.6/§4.8): optional capability-area hints.
   * Advisory only, never a gate (locked D14) — absent means no hints,
   * `[]` is equivalent to absence, unknown values warn and pass.
   */
  readonly involves?: readonly string[]
  /**
   * RCM D7/D8 (schema v0.4, SPEC-CONVENTION §4.9): optional routing
   * requirements. All four are optional — legacy omission has defined routing
   * semantics (text-only inputs; the routing-class thinking default), never an
   * error. Enum/shape validation is schema-side (the value registries ship
   * with this field set); no advisory stage applies because omission is legal
   * and meaningful.
   */
  /** One closed-vocabulary expertise area (RCM D7; never free text, D9). */
  readonly expertise?: ExpertiseArea
  /** Required input modalities; omitted = text-only (RCM D8). */
  readonly inputs?: readonly InputModality[]
  /** Context floor in tokens; shaping may only override it upward (RCM OQ6). */
  readonly min_context?: number
  /** Requested thinking level; omitted = the routing-class default (RCM OQ5). */
  readonly thinking_level?: ThinkingLevel
}
