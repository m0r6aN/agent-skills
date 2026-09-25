---
ticket: FL-R4
title: Add actual Foreman package CI and repair stale matrix assertion
status: active
owner: clinton.morgan
created: 2026-09-05
updated: 2026-09-05
risk: elevated
surfaces: [plugins/foreman-line/, .github/workflows/foreman-line-ci.yml]
routing_class: architecture/risk
permission_profile: builder-deps
data_classification: internal
---

## Intent

Provide a locally reviewable GitHub workflow candidate that actually checks all fourteen independent Foreman packages. Correct the independently observed stale skill-matrix expectation without changing policy. This addresses the CI portion of FL-R4 only, not installed-host, live adapter or D4 acceptance.

## Constraints

Base 5ce6ddc7f996d764e506b6b421779fbf3ece689a; feat/foreman-line-FL-R4-20260905; assigned fl-r4-package-ci-20260905 worktree. User's 2026-09-05 blanket non-destructive authorization permits creating a local workflow candidate; no remote enablement, run dispatch or branch-rule change is included. Standing constraints apply: plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md.

Use supported Node 24.19.0. Windows CI is the required initial platform because local full-suite evidence was produced on Windows; do not claim Linux portability without evidence. Workflow permission contents: read; checkout credentials must not persist. Existing checkout/setup-node action major-version patterns may be used. Do not add privileged pull_request_target or secrets. Install every package's lockfile dependencies with npm ci --ignore-scripts before checks because relative sibling imports require sibling dependencies. Run tests, typecheck and lint for all 14 packages, fail if any check fails, and retain per-package outcomes. Required-check-friendly jobs named test and integration-report should run on documentation-only PRs too; report failure cannot hide a failed test job. Never claim the new workflow ran on GitHub locally.

## Allowed Files

- .github/workflows/foreman-line-ci.yml
- scripts/foreman-line-ci.mjs
- scripts/foreman-line-ci.test.mjs
- plugins/foreman-line/skill-injection/tests/schema-validation.test.ts
- plugins/foreman-line/docs/kickstarters/FL-R4-handoff.md

## Acceptance Criteria

AC-1: Candidate CI installs and checks exactly the 14 existing packages; test/typecheck/lint failures propagate to nonzero even if later packages succeed.
AC-2: CI handles docs-only PRs without missing named jobs; no external authority, secret, merge or elevated permissions are introduced.
AC-3: Skill-injection test asserts the current contracts/* reviewer entry [code-review, ai-council], retains all other baseline expectations, and no policy YAML changes. Do not keep a misleading exact illustrative-plan claim.
AC-4: Any helper uses Node stdlib, a fixed package allowlist and testable injected process boundary. Tests prove complete invocation coverage, stopping before checks after failed install, aggregate check failures, and no live subprocess use in runner tests. Do not build a generic orchestration framework.
AC-5: Local helper tests and all14 package checks pass on supported runtime after offline dependency setup, or exact failures are recorded. Schema-scaffold generator tests are authorized because inspected implementation writes only test-created temporary roots; do not run source generators as standalone steps.
AC-6: Changed paths stay within allowlist. Handoff distinguishes local candidate evidence from unrun remote CI, still-missing SDK/DocSpine/installed-session requirements and existing human D4 gate.

## Out of Scope

Changing package policies/manifests, installing hosted plugins, adding MCP SDK/DocSpine, remote CI execution, actions/push/PR/settings API writes, goal transfers, commits and merges.

## Context & References

- .github/workflows/test-plugin-install.yml
- plugins/foreman-line/skill-injection/skill-injection.yaml
- plugins/foreman-line/schema-scaffold/tests/generate.test.ts
- plugins/foreman-line/integration/tests/conformance.test.ts

## Verification Plan

Offline npm ci --ignore-scripts within own worktree is authorized after manifest inspection; no network fallback. Explicit runtime D:/nvm/v24.19.0/node.exe and its npm-cli.js; process-local PATH permitted for children. Tests must be hermetic. Review focus: can any failure be hidden, any package omitted, credentials retained or docs-only checks skipped? Is the stale test fixed without weakening the policy?
