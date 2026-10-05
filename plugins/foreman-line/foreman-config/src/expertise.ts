/**
 * The closed `expertise` vocabulary (RCM D7, OQ1 — ratified 2026-09-20): the
 * only values `expertise:` frontmatter and `expertise_bindings` policy entries
 * may ever carry. Never free text (RCM stop condition); never extended ad hoc —
 * a new area is added here, with its definition and routing consequence, when
 * (and only when) a parcel needs it. An expertise with no distinct routing
 * consequence is a label, not a dimension (OQ1).
 *
 * Ownership: this module is the single source of truth named by RCM D7 ("the
 * closed `foreman-config` vocabulary"). Consumers restate the value list in
 * their own schema enums and are proven equal by lockstep tests; this module is
 * import-free on purpose (spec-linter amendment A2.2's "import-free HOME
 * module" rule) so any tree can load it without sibling dependencies.
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

/** One vocabulary area: a written definition plus at least one routing consequence (OQ1). */
export interface ExpertiseDefinition {
  readonly area: ExpertiseArea
  /** What this area means as a kind of parcel work. */
  readonly definition: string
  /**
   * What declaring this area does to routing: it may NARROW the
   * already-eligible set within one tier via the policy's `expertise_bindings`
   * block — never reorder a tier, never cross tiers, never widen a data
   * classification. A missing binding means no narrowing at all.
   */
  readonly routing_consequence: string
}

export const EXPERTISE_DEFINITIONS: readonly ExpertiseDefinition[] = [
  {
    area: 'engineering',
    definition:
      'Implementation work: writing, fixing, refactoring, and testing code inside an existing design.',
    routing_consequence:
      'An expertise binding for this area may narrow the eligible set toward candidates whose merit corpus records the strongest first-pass implementation receipts; unbound, no narrowing happens.',
  },
  {
    area: 'architecture',
    definition:
      'System design and cross-cutting structural work: component boundaries, contracts, and long-horizon change shaping.',
    routing_consequence:
      'An expertise binding for this area may narrow the eligible set toward candidates with the deepest declared context floors for cross-cutting work; it never promotes a candidate across tiers.',
  },
  {
    area: 'security',
    definition:
      'Threat modeling, hardening, vulnerability analysis, and safety review of code and configuration.',
    routing_consequence:
      'An expertise binding for this area may narrow within the classification-eligible set only — narrowing can never weaken data-classification gating and never selects outside a declared classification set.',
  },
  {
    area: 'legal',
    definition:
      'Contract, license, and compliance-text analysis, including clause-level citation work.',
    routing_consequence:
      'An expertise binding for this area may narrow toward candidates whose merit corpus records accurate long-context citation; an unsatisfiable binding refuses rather than falling back.',
  },
  {
    area: 'finance',
    definition:
      'Quantitative and financial analysis: budgets, rates, cost modeling, and numeric reconciliation.',
    routing_consequence:
      'An expertise binding for this area may narrow toward candidates with recorded numeric-accuracy receipts; it introduces no dispatch-time price comparison.',
  },
  {
    area: 'writing',
    definition: 'Prose, documentation, editorial, and explanatory work for human readers.',
    routing_consequence:
      'An expertise binding for this area may narrow toward candidates with recorded prose-quality receipts; missing bindings never invent a preference.',
  },
  {
    area: 'research',
    definition:
      'Grounded investigation: reading sources, reconciling evidence, and summarizing what is known.',
    routing_consequence:
      'An expertise binding for this area may narrow toward candidates with recorded citation discipline; declaring it grants no network access at dispatch time.',
  },
  {
    area: 'data',
    definition: 'Data modeling, analysis, transformation pipeline, and schema work.',
    routing_consequence:
      'An expertise binding for this area may narrow toward candidates whose declared capability state includes verified structured output; unverified states refuse rather than downgrade.',
  },
]
