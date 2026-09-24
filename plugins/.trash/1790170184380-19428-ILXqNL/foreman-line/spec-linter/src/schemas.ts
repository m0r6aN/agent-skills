/**
 * Hand-authored JSON Schema draft-07 literal for spec frontmatter, typed as
 * ajv's `SchemaObject` (never `JSONSchemaType<T>` — banned as a schema authority
 * in this repo).
 *
 * `tests/parity.test.ts` proves this schema agrees with its `types.ts` counterpart
 * via a canonical sample, and that the committed `schemas/spec-frontmatter.schema.json`
 * never drifts from what `generate.ts` would produce.
 *
 * The semantic invariant `status: superseded` requires non-null `superseded_by` is
 * intentionally NOT encoded here — it is a cross-field business rule enforced by
 * `validate.ts`, kept distinct from pure structural shape.
 */
import type { SchemaObject } from 'ajv'
// PROFILE_NAMES is imported from its import-free HOME module, not the package
// barrel (amendment A2.2, P2b-ii): permission-profiles' index.js VALUE-
// re-exports validateRegistry, so loading the barrel executes validator.ts
// and pulls ajv from permission-profiles' own node_modules — which breaks
// spec-linter's standalone invocation in any tree where only spec-linter is
// installed (finding B2's second edge). The cross-package src/ coupling
// itself remains, and remains a reported E2 debt owned by P5/D22; the
// long-term fix recorded there is splitting that barrel.
import { PROFILE_NAMES } from '../../permission-profiles/src/types.js'

export const specFrontmatterSchema: SchemaObject = {
  type: 'object',
  additionalProperties: false,
  required: [
    'ticket',
    'title',
    'status',
    'owner',
    'created',
    'updated',
    'risk',
    'surfaces',
    'routing_class',
    'verification_class',
  ],
  properties: {
    ticket: { type: 'string', minLength: 1 },
    title: { type: 'string', minLength: 1 },
    status: { type: 'string', enum: ['draft', 'active', 'done', 'superseded'] },
    owner: { type: 'string', minLength: 1 },
    created: { type: 'string', minLength: 1 },
    updated: { type: 'string', minLength: 1 },
    supersedes: { type: ['string', 'null'] },
    superseded_by: { type: ['string', 'null'] },
    risk: { type: 'string', enum: ['low', 'standard', 'elevated', 'critical'] },
    surfaces: {
      type: 'array',
      items: { type: 'string', minLength: 1 },
      minItems: 1,
    },
    routing_class: {
      type: 'string',
      enum: ['boilerplate', 'standard-feature', 'architecture/risk', 'implementation/standard'],
    },
    verification_class: {
      type: 'string',
      enum: ['equivalence-provable', 'judgment-required'],
    },
    permission_profile: { type: 'string', pattern: '\\S', enum: [...PROFILE_NAMES] },
    // CLOSE-P2 (W4-P5 ruling): optional, non-empty, non-whitespace-only string.
    // Deliberately no enum — no controlled vocabulary is ratified yet; adding
    // one later is a non-breaking additive change (permission_profile pattern).
    data_classification: { type: 'string', pattern: '\\S' },
    // P1a (SPEC-CONVENTION §4.6/§4.8): OPTIONAL, deliberately NOT in
    // `required`, no minItems — `involves: []` is legal and equivalent to
    // absence (locked D14: optional, advisory, never a gate). Entries must
    // be non-empty, non-whitespace-only strings; deliberately no enum —
    // vocabulary membership is ADVISORY (validate.ts), never a schema
    // rejection, and the vocabulary is extensible per-project via
    // foreman/config.yaml `capabilities:` keys.
    involves: {
      type: 'array',
      items: { type: 'string', pattern: '\\S' },
    },
  },
}
