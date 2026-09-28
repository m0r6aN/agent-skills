/**
 * `foreman/config.yaml` declaration contract shapes (P1a, any-repo-runnability
 * charter §4.1): the four things a repo declares because the Line cannot
 * reasonably infer them — identity, stack, capabilities, policy. Each type has
 * a matching hand-authored JSON Schema in `schemas.ts`; the two are proven to
 * agree by `tests/parity.test.ts` (ajv's `JSONSchemaType` is banned as a
 * schema authority in this repo).
 *
 * Ownership (charter §4.1): P1a owns every SHAPE here, including the full
 * `stack:` block. Semantics are owned elsewhere — queue identity by P1b,
 * detector consumption of `layout` by P4, `stack:` required-ness at
 * scaffold/dispatch time and `policy:` thresholds by P6, `compression` by P7.
 * A parcel needing a key these shapes do not define raises a spec amendment,
 * never an ad-hoc schema edit.
 *
 * This module defines shape only. The document validator (`validate.ts`)
 * never stats the filesystem — disk-existence semantics for declared layout
 * paths are P4's (D28b), not this package's.
 */

/** An opaque skill identifier. Mirrors skill-injection's `SkillName`. */
export type SkillName = string

/** Named layout profile (D20). The DEFAULT is `vite-react-ts-tailwind` — do not invert. */
export type StackProfile = 'vite-react-ts-tailwind' | 'nextjs-app-router' | 'none'

/** Risk values accepted by `policy.audit.require_security_audit_at` (SPEC-CONVENTION §4 risk). */
export type RiskLevel = 'low' | 'standard' | 'elevated' | 'critical'

/**
 * `identity:` — who this repo is to the Line. `project_key` and
 * `dispatch_queue` are REQUIRED KEYS whose value may be an explicit `null`
 * (coordinator ruling, P1a Step 0 Q4): a repo with no tracker has no project
 * key and no queue identity, and declaring nothing must be an explicit act —
 * omitting either key is a validation failure, the same shape as
 * `profile: none`. Queue-identity SEMANTICS are P1b's.
 */
export interface ForemanIdentity {
  readonly project_key: string | null
  readonly base_branch: string
  readonly branch_prefix: string
  readonly worktree_root: string
  readonly dispatch_queue: string | null
}

/**
 * `stack.layout` — the declared layout map detectors read instead of
 * hardcoded roots (D20). Arrays of non-empty path strings. This package
 * never checks the paths exist on disk (P4's D28b semantics).
 */
export interface StackLayout {
  readonly route_roots: readonly string[]
  readonly style_roots: readonly string[]
  readonly component_roots: readonly string[]
  readonly theme_files: readonly string[]
  readonly ui_primitives: readonly string[]
}

/**
 * `stack:` — profile + layout map, or explicit `none` (charter §4.3).
 * Conditional shape (D28a, and Step 0 Q5 ruling):
 *   - `profile != none` ⇒ `layout` AND `surfaces_present` are REQUIRED
 *     (`surfaces_present: []` is legal but must be written).
 *   - `profile: none`   ⇒ `layout` and `surfaces_present` are PROHIBITED —
 *     "no UI stack" plus "these UI surfaces exist" is a self-contradiction a
 *     closed schema refuses rather than silently resolving.
 * An unknown `profile` value is invalid (D28b, document half).
 */
export interface ForemanStack {
  readonly profile: StackProfile
  readonly layout?: StackLayout
  readonly surfaces_present?: readonly string[]
}

/**
 * `capabilities:` — capability-area name → skills that provide it. An empty
 * map is legal. Declaring a key does double duty (SPEC-CONVENTION §4.8): it
 * extends the `involves:` vocabulary AND provides the resolution entry. A
 * present key's array MAY be empty (coordinator ruling): `telemetry: []`
 * declares vocabulary membership while no local skill serves the capability
 * yet — a state D14 already declares normal (zero resolution is a no-op,
 * announced once). Forbidding it would force either eating an advisory on
 * every lint or mapping a skill that does not serve the capability — a
 * config that lies.
 */
export interface ForemanCapabilities {
  readonly [capability: string]: readonly SkillName[]
}

/** `policy.audit` — risk levels at which the security-audit gate arms (semantics: P6). */
export interface ForemanAuditPolicy {
  readonly require_security_audit_at: readonly RiskLevel[]
}

/** `policy:` — thresholds that trigger gates. Closed; new policy keys need a spec amendment. */
export interface ForemanPolicy {
  readonly audit: ForemanAuditPolicy
}

/**
 * The full `foreman/config.yaml` document: exactly four top-level groups,
 * all required (D26: an omitted `stack:` block is an invalid document), all
 * closed.
 */
export interface ForemanConfig {
  readonly identity: ForemanIdentity
  readonly stack: ForemanStack
  readonly capabilities: ForemanCapabilities
  readonly policy: ForemanPolicy
}
