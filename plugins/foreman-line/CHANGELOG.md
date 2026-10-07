# Changelog

## Unreleased

- The CI aggregation now captures each package check's complete stdout/stderr and
  re-emits every failing check in a failure section before the summary matrix, so
  the failing assertion is always visible in the job log.
- `verification` scaffold parity (AC-1) now covers the shared toolchain pins only;
  package-specific dev dependencies (dispatch's `@earendil-works/*` Pi runtime
  port) are no longer mirrored into the verification manifest.
- Verification package: pinned U1 candidate-sandbox's module-relative fixture
  lookup and made its Git identity read use the script's explicit directory;
  the D19 audit passes on the live tree.
- Kernel lease: replay rejects persisted outcomes unless the outer result and
  complete `EffectResult` are well-formed and match the completed row's
  idempotency key and effect digest.
- Verification package: pinned U1 candidate-sandbox's module-relative fixture
  lookup and made its Git identity read use the script's explicit directory;
  the D19 audit passes on the live tree.
- Lumber Jack: scope unpushed-commit detection to the inspected `HEAD` and
  preserve pushed branches until an open or merged PR to `dev` exists.
- Skill routing: clarified that incremental implementation covers feature-flagged
  multi-file work in thin slices, preserving that trigger after catalog growth.

- Verification package: ratified the six FK packages (`authority-registry`,
  `bypass-outage-harness`, `kernel-contracts`, `kernel-lease`, `kernel-state`,
  `spec-body-compiler`) into the D19 allowlist (STANDING #34), and adjudicated
  their 93 unruled instances into the audit's pin tables: FK generator/harness
  self-location enrolled in E4 on verified identity with the ratified
  generate-writer precedent, the authority generator's four-hop `repoRoot`
  derivation as the ruled class-2 walk, the canon-source catalogs /
  evidence-reference labels / `git show` pathspec / message prose as ruled
  class-3 DATA (identity + location + value + cardinality + value digests),
  the harness/measurement spawns and kernel-state SQLite statement exec as
  scoped class-4 rulings, and the FK seams' required-input root normalization
  as scoped class-5 rulings. The A2.3 tripwire is unchanged: any new
  spelling, name, file, nested declaration, or filesystem-argument position
  remains a refusal.
- Verification package: repaired the D19 mechanism audit (`src/d19-audit.ts`)
  ruling to reconcile with the live tree — enrolled the reviewed, spec'd
  root-resolution mechanisms (optional `repoRoot ?? process.cwd()` defaults,
  `DEFAULT_REPO_ROOT` derivations, repo-relative DATA path constants, `git
  rev-parse` self-location sites, root-normalization guards) as pinned/ruled
  sets with per-file cardinality, and fixed the class-6 dynamic-import detector
  to recognize the pinned `foreman-config` `import()` entry. GSO-P1 reconciles
  against the restored `spec-linter/src/grandfather.ts` inventory.
- Verification test fixtures: supplied the required `pluginRoot` field on
  `HarnessInput`/`ReviewDispatchInput` (type conformance; no behavior change).
- Verification scaffold golden: pinned `SHARED_DEV_DEPENDENCIES` to the
  verification+dispatch sibling-agreement values (the prior golden never
  matched the pair it checks).

## 0.6.10 — 2026-09-19

- Ported explicit repository/plugin roots and caller/config identity injection.
- Added `foreman-config`, contract readers, role authority, worker envelopes,
  mutation-scope enforcement, hooks, and templates.
- Added generated-schema parity coverage for the new contracts.
- Added TypeSafe Jev 1.13 through OpenRouter for fast routing/classification
  decisions only; it remains recommendation-only and cannot approve, merge, or
  bypass policy.
- Allowed Pi to auto-route only within Foreman-approved execution lanes.
- Removed the Fireworks routing and worker-provider path entirely.

## 0.1.0 — 2026-07-29

- Added Claude Code and Codex plugin manifests.
- Relocated the `goal`, `foreman-shaping`, and `parcel-driven-development`
  skills into the plugin discovery surface.
- Removed captured runtime memory from the distribution tree.
- Added portable ignore rules for generated permission envelopes.
- Corrected product documentation to distinguish structural receipts from
  cryptographic verification and asserted merge metadata from live merge proof.
