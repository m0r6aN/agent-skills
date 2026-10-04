# Changelog

## Unreleased

- Kernel lease: replay rejects persisted outcomes unless the outer result and
  complete `EffectResult` are well-formed and match the completed row's
  idempotency key and effect digest.
- Verification package: pinned U1 candidate-sandbox's module-relative fixture
  lookup and made its Git identity read use the script's explicit directory;
  the D19 audit passes on the live tree.
- Lumber Jack: scope unpushed-commit detection to the inspected `HEAD` and
  preserve pushed branches until an open or merged PR to `dev` exists.

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

## 0.1.0 — 2026-07-29

- Added Claude Code and Codex plugin manifests.
- Relocated the `goal`, `foreman-shaping`, and `parcel-driven-development`
  skills into the plugin discovery surface.
- Removed captured runtime memory from the distribution tree.
- Added portable ignore rules for generated permission envelopes.
- Corrected product documentation to distinguish structural receipts from
  cryptographic verification and asserted merge metadata from live merge proof.
