/**
 * The ratified Foreman Line packages the D19 audit sweeps (A1.1) — an
 * ALLOWLIST, not a count (A2.2).
 *
 * This lives in its own side-effect-free module for one reason: `d19-audit.ts`
 * assigns `process.exitCode` at module load, so nothing can import the list
 * from there. Before Wave 0 the audit's test re-declared the same fifteen
 * names by hand, and when WF-P1/WF-P2 added two packages the two copies
 * disagreed — the audit refused (A2.2 working) while the test still asserted
 * fifteen. That is lesson #73's defect class (a hand-enumerated set going
 * stale invisibly), so the duplicate was removed rather than corrected: the
 * audit and its tests now read one list.
 *
 * Adding a package here is a RATIFICATION. A2.2 checks the list against disk
 * in both directions, so a new package on disk refuses the run until a
 * coordinator adds it — it never joins the sweep by merely existing.
 */
export const RATIFIED_PACKAGES = [
  'approval',
  'contract-readers',
  'contracts',
  'dispatch',
  'foreman-config',
  'integration',
  'mutation-scope-guard',
  'permission-profiles',
  'projection',
  'receipts',
  'registration',
  'role-authority',
  'routing-policy',
  'schema-scaffold',
  'shaping',
  'skill-injection',
  'spec-linter',
  'verification',
  'worker-envelopes',
] as const
