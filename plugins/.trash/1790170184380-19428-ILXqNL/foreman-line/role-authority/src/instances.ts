/**
 * Ratified instance data for the three decisions this package owns outright
 * (coordinator amendment, 2026-09-01, adversarial review B finding F3):
 * D20's per-role authority flags, D21's family-diversity minimum, and D33's
 * self-declared serialization-point ownership record. Unlike D2/D4/D6
 * (this package ships no registry-key values), these three are facts this
 * package is the sole owner of, so
 * they ship as real committed data, not just a shape.
 *
 * No model identifier appears anywhere in this file -- these are about
 * roles and surfaces, never about which concrete model backs a role.
 */
import {
  type ModelFamilyDiversityRule,
  ROLE_IDS,
  type RoleAuthority,
  type RoleId,
} from './roles.js'
import type { SerializationPointOwnership } from './serialization-points.js'

/**
 * D20 per-role authority flags, grounded in charter section 6's role
 * contracts:
 *
 * - `judge`: section 6.1 makes the Judge the sole role charter-authorized to
 *   close critical work at all (`ACCEPT`/`REJECT`/`REQUIRE_HUMAN` is the
 *   architecture's critical-review terminus, charter section 5) --
 *   `canCloseCriticalWork: true`. Section 6.1's own restrictions ("no
 *   self-remediation followed by self-approval") still forbid the Judge from
 *   self-promoting or self-approving its own output, so those two stay
 *   `false` even for this role.
 * - every other role (`coordinator`, `integrator`, and the worker roles): no
 *   role contract grants self-promote,
 *   self-approve, or close-critical authority, and D20 names "Workers" as
 *   explicitly forbidden from all three -- all three flags are `false`.
 */
export const roleAuthorityByRole: Readonly<Record<RoleId, RoleAuthority>> = Object.fromEntries(
  ROLE_IDS.map((role) => [
    role,
    {
      role,
      canSelfPromote: false,
      canSelfApprove: false,
      canCloseCriticalWork: role === 'judge',
    },
  ]),
) as Readonly<Record<RoleId, RoleAuthority>>

/**
 * D21: "Critical work requires model-family diversity between primary
 * implementation and independent verification wherever practical" (charter
 * D21). Elevated (`R2`) and critical (`R3`) risk both require at least two
 * distinct model families between the primary implementer and its
 * independent verifier.
 */
export const familyDiversityRules: readonly ModelFamilyDiversityRule[] = [
  { riskClass: 'R2', minDistinctModelFamilies: 2 },
  { riskClass: 'R3', minDistinctModelFamilies: 2 },
]

/**
 * D33 self-declaration (AC5): this package's own surface, owned solely by
 * WF-P1 for the duration of Wave 0. No `authorizedExtenders` -- extension
 * requires a coordinator amendment to this record, not an assumed grant.
 */
export const selfSerializationPointOwnership: SerializationPointOwnership = {
  path: 'plugins/foreman-line/role-authority/**',
  owner: 'WF-P1',
  extensionPolicy: 'sole',
}
