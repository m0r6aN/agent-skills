/**
 * Hand-authored JSON Schema literals for the `foreman/config.yaml`
 * declaration contract, each typed as ajv's `SchemaObject` (never
 * `JSONSchemaType<T>` — banned as a schema authority in this repo).
 * `tests/parity.test.ts` proves each schema agrees with its `types.ts`
 * counterpart via canonical samples, and that the committed
 * `schemas/*.json` never drift from `generate.ts` output.
 *
 * Every group is CLOSED (`additionalProperties: false`, charter §4.1): a
 * parcel needing a new key raises a spec amendment, never an ad-hoc schema
 * edit. Conditional `stack:` shape rationale lives on `ForemanStack` in
 * `types.ts`.
 */
import type { SchemaObject } from 'ajv'

/** A string with at least one non-whitespace character. */
const NON_BLANK_STRING_PATTERN = '\\S'

const nonBlankString: SchemaObject = {
  type: 'string',
  pattern: NON_BLANK_STRING_PATTERN,
}

/** A non-blank string, or an explicit `null` (Step 0 Q4 ruling — see types.ts). */
const nonBlankStringOrNull: SchemaObject = {
  anyOf: [{ type: 'null' }, nonBlankString],
}

const nonBlankStringArray: SchemaObject = {
  type: 'array',
  items: nonBlankString,
}

/** Named layout profiles (D20). Default `vite-react-ts-tailwind`; do not invert. */
export const STACK_PROFILES = ['vite-react-ts-tailwind', 'nextjs-app-router', 'none'] as const

/** Risk vocabulary for `policy.audit.require_security_audit_at`. */
export const RISK_LEVELS = ['low', 'standard', 'elevated', 'critical'] as const

export const foremanIdentitySchema: SchemaObject = {
  type: 'object',
  additionalProperties: false,
  required: ['project_key', 'base_branch', 'branch_prefix', 'worktree_root', 'dispatch_queue'],
  properties: {
    // Required KEY, nullable VALUE: a repo with no tracker declares `null`
    // explicitly; omission is a validation failure (Q4 ruling).
    project_key: nonBlankStringOrNull,
    base_branch: nonBlankString,
    branch_prefix: nonBlankString,
    worktree_root: nonBlankString,
    // Shape only — queue-identity semantics are P1b's.
    dispatch_queue: nonBlankStringOrNull,
  },
}

export const stackLayoutSchema: SchemaObject = {
  type: 'object',
  additionalProperties: false,
  required: ['route_roots', 'style_roots', 'component_roots', 'theme_files', 'ui_primitives'],
  properties: {
    route_roots: nonBlankStringArray,
    style_roots: nonBlankStringArray,
    component_roots: nonBlankStringArray,
    theme_files: nonBlankStringArray,
    ui_primitives: nonBlankStringArray,
  },
}

/**
 * `stack:` — see `ForemanStack` in types.ts for the conditional-shape
 * rationale (D28a required-when-profiled, Q5 prohibited-when-none, D28b
 * unknown profile invalid).
 */
export const foremanStackSchema: SchemaObject = {
  type: 'object',
  additionalProperties: false,
  required: ['profile'],
  properties: {
    profile: { enum: [...STACK_PROFILES] },
    layout: stackLayoutSchema,
    // `[]` is legal but must be written (D28a) — no minItems.
    surfaces_present: nonBlankStringArray,
  },
  allOf: [
    {
      if: {
        properties: { profile: { const: 'none' } },
        required: ['profile'],
      },
      // biome-ignore lint/suspicious/noThenProperty: JSON Schema's if/then/else conditional keyword, not a thenable
      then: {
        // profile: none ⇒ layout and surfaces_present are PROHIBITED (Q5).
        not: {
          anyOf: [{ required: ['layout'] }, { required: ['surfaces_present'] }],
        },
      },
      else: {
        // profile != none ⇒ both are REQUIRED (D28a; explicit [] legal).
        required: ['layout', 'surfaces_present'],
      },
    },
  ],
}

/**
 * `capabilities:` — capability-area name → `SkillName[]`. Empty map legal.
 * A present key's EMPTY array is also legal (coordinator ruling, P1a rework
 * on flagged call #2): unlike skill-injection — where an empty array is
 * redundant with key absence — a declared key here carries a second meaning
 * absence does not: it extends the SPEC-CONVENTION §4.8 `involves:`
 * vocabulary. `telemetry: []` means "telemetry is a known capability area
 * here, and no local skill serves it yet" — vocabulary membership and
 * resolution result are independently observable (the D21/D27 separation),
 * and zero resolution is already a normal, announced-once outcome (D14).
 * Entries that ARE present must be non-blank strings.
 */
export const foremanCapabilitiesSchema: SchemaObject = {
  type: 'object',
  propertyNames: { pattern: NON_BLANK_STRING_PATTERN },
  additionalProperties: {
    type: 'array',
    items: nonBlankString,
  },
}

export const foremanPolicySchema: SchemaObject = {
  type: 'object',
  additionalProperties: false,
  required: ['audit'],
  properties: {
    audit: {
      type: 'object',
      additionalProperties: false,
      required: ['require_security_audit_at'],
      properties: {
        require_security_audit_at: {
          type: 'array',
          items: { enum: [...RISK_LEVELS] },
        },
      },
    },
  },
}

/**
 * The full document: exactly four top-level groups, all required (an
 * omitted `stack:` is an invalid document — D26), no fifth key.
 */
export const foremanConfigSchema: SchemaObject = {
  type: 'object',
  additionalProperties: false,
  required: ['identity', 'stack', 'capabilities', 'policy'],
  properties: {
    identity: foremanIdentitySchema,
    stack: foremanStackSchema,
    capabilities: foremanCapabilitiesSchema,
    policy: foremanPolicySchema,
  },
}
