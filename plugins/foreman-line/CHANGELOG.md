# Changelog

## Unreleased

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
