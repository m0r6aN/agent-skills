/**
 * CLOSE-P2 grandfather allowlist: the enumerated, class-scoped waivers for the
 * historical `docs/specs/done/` corpus debt (specs shipped before parts of the
 * schema v0.2 contract were tightened).
 *
 * Semantics (enforced by `validateSpecFrontmatter`; tightened by the CLOSE-P2
 * rework, R1):
 *   - Matching is by EXACT basename, against this source-frozen list only,
 *     AND only when the validated file's parent directory is `done` (the CLI
 *     supplies that signal; unit-level validation never waives without it).
 *   - Each waiver is pinned to its historical literal value(s): a violation is
 *     waived only if the file's actual frontmatter value is one of the
 *     inventoried `allowedValues`. Any other value fails, even on a
 *     grandfathered file.
 *   - Each waiver suppresses ONLY its own field's violation class; any other
 *     violation on a grandfathered file still fails validation.
 *   - Files not listed here get full validation, including the PROFILE_NAMES
 *     enum for `permission_profile`.
 *   - Waived violations are surfaced as non-blocking `grandfathered:` advisory
 *     warnings so the debt stays visible in CI logs.
 *
 * Growing this list requires editing this file in a reviewed PR — that is the
 * boundary pin. The test suite asserts set equality on the membership and the
 * per-file field/value pins (invariant pins, never byte pins —
 * STANDING-CONSTRAINTS #12), so silent growth or re-scoping fails the suite.
 */

export const WAIVER_KINDS = [
  'permission-profile-legacy',
  'routing-class-legacy',
  'verification-class-missing',
] as const
export type WaiverKind = (typeof WAIVER_KINDS)[number]

/** The only frontmatter fields a waiver may ever reach. */
export type WaivableField = 'permission_profile' | 'routing_class'

/**
 * One class-scoped, value-pinned waiver: violations on `field` are waived only
 * when the file's actual frontmatter value is in `allowedValues`.
 */
export interface GrandfatherWaiver {
  readonly kind: WaiverKind
  readonly field: WaivableField
  readonly allowedValues: readonly (string | null)[]
}

const PROFILE_NULL: GrandfatherWaiver = {
  kind: 'permission-profile-legacy',
  field: 'permission_profile',
  allowedValues: [null],
}

const PROFILE_BUILDER: GrandfatherWaiver = {
  kind: 'permission-profile-legacy',
  field: 'permission_profile',
  allowedValues: ['builder'],
}

const ROUTING_STANDARD: GrandfatherWaiver = {
  kind: 'routing-class-legacy',
  field: 'routing_class',
  allowedValues: ['standard'],
}

/**
 * The allowlist itself: exact done/ basenames -> value-pinned waiver(s), per
 * the CLOSE-P2 verified violation inventory.
 *
 * permission-profile-legacy: `permission_profile: null` (pre-registry contract
 * said null) or the pre-P4-enum literal `builder` — pinned per file.
 * routing-class-legacy: `routing_class: standard` (pre-dates the frozen
 * four-value enum; `standard-feature` is the modern spelling).
 */
export const GRANDFATHER_ALLOWLIST: Readonly<Record<string, readonly GrandfatherWaiver[]>> = {
  'P1-permission-profile-registry-schema.md': [PROFILE_NULL],
  'P2-dispatch-order-permission-profile-field.md': [PROFILE_NULL],
  'P3-dispatch-time-emitter.md': [PROFILE_NULL],
  'W0-P5-skill-injection-matrix-schema-validator.md': [PROFILE_NULL],
  'W4-P2-docspine-ci-hook.md': [PROFILE_BUILDER],
  'SCAF-P4-exit-vehicle.md': [PROFILE_BUILDER],
  'W1-P2-epic-story-projection.md': [ROUTING_STANDARD],
  'W1-P3-human-approval-flow.md': [ROUTING_STANDARD],
}

/**
 * Exact repository-relative identities of the parseable pre-v0.3 done-spec
 * corpus that omits the newly-required verification_class field. This is a
 * source-frozen compatibility boundary: membership is reconciled against disk
 * in both directions by grandfather.test.ts. Unlike the legacy basename
 * waivers above, this waiver is keyed only by the complete canonical identity.
 */
export const VERIFICATION_CLASS_MISSING_WAIVER_KIND: WaiverKind = 'verification-class-missing'

export const GRANDFATHER_VERIFICATION_CLASS_MISSING_INVENTORY = [
  'plugins/foreman-line/docs/specs/done/CLOSE-P1-minted-chain-exit-vehicle.md',
  'plugins/foreman-line/docs/specs/done/CLOSE-P2-spec-linter-corpus-reconciliation.md',
  'plugins/foreman-line/docs/specs/done/CLOSE-P3-biome-ci-always-report.md',
  'plugins/foreman-line/docs/specs/done/E6-R1-current-repository-identity-and-evidence-rerun.md',
  'plugins/foreman-line/docs/specs/done/KEO-155-P1-review-sprint-packaging-closure.md',
  'plugins/foreman-line/docs/specs/done/KEO-156-P2-minimum-verifier-compatibility-canon-freeze.md',
  'plugins/foreman-line/docs/specs/done/KEO-59-P0V-claims-validation-repair.md',
  'plugins/foreman-line/docs/specs/done/KEO-59-proof-led-control-plane-reconciliation.md',
  'plugins/foreman-line/docs/specs/done/P1-permission-profile-registry-schema.md',
  'plugins/foreman-line/docs/specs/done/P2-dispatch-order-permission-profile-field.md',
  'plugins/foreman-line/docs/specs/done/P3-dispatch-time-emitter.md',
  'plugins/foreman-line/docs/specs/done/P4-spec-linter-permission-profile-enum.md',
  'plugins/foreman-line/docs/specs/done/SCAF-P1-shared-schema-scaffold-extraction.md',
  'plugins/foreman-line/docs/specs/done/SCAF-P2-shared-test-scaffold-extraction.md',
  'plugins/foreman-line/docs/specs/done/SCAF-P3-receipt-chain-walker.md',
  'plugins/foreman-line/docs/specs/done/SCAF-P4-exit-vehicle.md',
  'plugins/foreman-line/docs/specs/done/W0-P1-pipeline-stage-contracts.md',
  'plugins/foreman-line/docs/specs/done/W0-P2-parcel-schema-v02.md',
  'plugins/foreman-line/docs/specs/done/W0-P3-routing-policy-schema-validator.md',
  'plugins/foreman-line/docs/specs/done/W0-P4-receipt-chain-schema-validator.md',
  'plugins/foreman-line/docs/specs/done/W0-P5-skill-injection-matrix-schema-validator.md',
  'plugins/foreman-line/docs/specs/done/W1-P1-shaping-agent.md',
  'plugins/foreman-line/docs/specs/done/W1-P2-epic-story-projection.md',
  'plugins/foreman-line/docs/specs/done/W1-P3-human-approval-flow.md',
  'plugins/foreman-line/docs/specs/done/W1-P4-jira-registration.md',
  'plugins/foreman-line/docs/specs/done/W2-P1-jira-query-ranking.md',
  'plugins/foreman-line/docs/specs/done/W2-P2-dispatch-approval-cli.md',
  'plugins/foreman-line/docs/specs/done/W2-P3-routing-eval-engine.md',
  'plugins/foreman-line/docs/specs/done/W2-P4-kompress-integration.md',
  'plugins/foreman-line/docs/specs/done/W2-P5-skill-injection-engine.md',
  'plugins/foreman-line/docs/specs/done/W3-P1-verification-harness.md',
  'plugins/foreman-line/docs/specs/done/W3-P2-adversarial-reviewer.md',
  'plugins/foreman-line/docs/specs/done/W3-P3-pipeline-rework.md',
  'plugins/foreman-line/docs/specs/done/W3-P4-human-gate-jira.md',
  'plugins/foreman-line/docs/specs/done/W4-P0-correlation-lineage-fix.md',
  'plugins/foreman-line/docs/specs/done/W4-P1-integration-stage-e.md',
  'plugins/foreman-line/docs/specs/done/W4-P2-docspine-ci-hook.md',
  'plugins/foreman-line/docs/specs/done/W4-P3-risk-driven-audit-triggers.md',
  'plugins/foreman-line/docs/specs/done/W4-P4-github-gate-stage-f-closure.md',
  'plugins/foreman-line/docs/specs/done/WGT-P0A-foreman-record-reconciliation.md',
  'plugins/foreman-line/docs/specs/done/WGT-P0BOOT-tracked-foreman-bootstrap.md',
  'skills/parcel-compiler/docs/specs/done/PCC-P0-pcc-cli-scaffold.md',
] as const

export function isGrandfatheredVerificationClassMissing(documentRef: string): boolean {
  return GRANDFATHER_VERIFICATION_CLASS_MISSING_INVENTORY.includes(
    documentRef as (typeof GRANDFATHER_VERIFICATION_CLASS_MISSING_INVENTORY)[number],
  )
}

/** Returns the waivers for a basename, or an empty list if not grandfathered. */
export function waiversFor(basename: string): readonly GrandfatherWaiver[] {
  return GRANDFATHER_ALLOWLIST[basename] ?? []
}
