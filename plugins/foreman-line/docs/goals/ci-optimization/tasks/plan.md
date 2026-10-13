# CI trigger cleanup — approved follow-up

Owner approved the recommendations in the current session: retire the temporary
measurement workflow, eliminate duplicate feature-branch push/PR runs, preserve
substantive checks. This follows the closed goal's OQ3 (goal-closure-2026-10-02.md)
and does not reopen old parcel work or replace root tasks.

## Focused contract

- `.github/workflows/foreman-line-ci.yml` and `test-plugin-install.yml` run on
  every pull request and pushes to `main` only. Keep plugin manual dispatch,
  existing jobs/check names, permissions, runners, all checks and failure behavior.
  Do not add path filters, cancellation or new automatic launch/deploy actions.
- CI reuse stays PR-class only: `scripts/ci-reuse.mjs` refuses push sources before
  candidate selection. Preserve that policy and test it. No live integration
  branches currently require push-only checks; future ones need an explicit
  documented exception. Unopened feature branches intentionally have no push CI.
- Archive all four scratch measurement runs (metadata, available logs/artifacts),
  the workflow/probe bytes at its tip, and provenance/checksums outside the git
  repository before disabling `cff-p0-readgraph-measure` (id 378344122). Retain the
  scratch branch and historical runs as provenance; no branch/run/artifact deletion
  is needed to stop executions. Record expired/unavailable evidence honestly.
- Preserve `u1-produce`, `u1-verify`, `u1-lint`, Dependency Graph, the existing manual
  disabled state of Test Plugin Installation, and branch/ruleset/billing settings.
- Separate branch/PR from ops-console PR #198. No automatic merge/deployment.

## Commands and files

Use built-in node:test: `node --test scripts/foreman-line-ci.test.mjs` for RED/GREEN;
final script test suite plus validators, surface-pin precheck and diff check.
Workflow changes are YAML only; no package build/typecheck interface changes.
Use actionlint if available for workflow syntax, without project dependency changes.

Files: the two workflow files, scripts/foreman-line-ci.test.mjs and goal-local
planning/verification records. Remote action: disable only measurement workflow
once evidence is archived. No active-spec mutation or backend/application changes.

## Risks / mitigations

- Removing PR coverage or required contexts: regression assertions for unfiltered
  PR triggers, exact main push scope and preserved check identities.
- Breaking reuse: existing PR lineage/hash/ancestry/negative source tests remain;
  workflow changes change the hash and correctly force an initial fallback.
- Evidence loss: durable local archive with SHA-256 manifest, retain remote refs/runs.
- Runner account block: local checks are not remote pass evidence; preserve human
  merge gate and report remote inability to execute tests.

Tasks and verification checkpoints: todo.md.
