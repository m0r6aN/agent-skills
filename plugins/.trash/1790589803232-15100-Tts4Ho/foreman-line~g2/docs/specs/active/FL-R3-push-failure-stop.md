---
ticket: FL-R3
title: Stop PR creation after a failed push
status: active
owner: clinton.morgan
created: 2026-09-05
updated: 2026-09-05
risk: standard
surfaces: [plugins/foreman-line/integration/]
routing_class: standard-feature
permission_profile: builder-standard
data_classification: internal
---

## Intent

Prevent PR creation when the preceding push fails. This is a local isolated repair under the user's 2026-09-05 non-destructive completion authorization; tests must never invoke either real external operation.

## Constraints

Base: 5ce6ddc7f996d764e506b6b421779fbf3ece689a. Branch: feat/foreman-line-FL-R3-20260905. Assigned worktree: fl-r3-pr-push-20260905. Standing constraints apply: plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md.

Preserve the success result shape and call order. Coordinator approves one typed PUSH_FAILED IntegrationError code for nonzero or thrown push failures; throw before any PR-create effect. Do not fabricate a skipped successful GhPrCreateResult or add compatibility branches. Existing returned PR-create failure semantics remain unchanged. Keep diagnostics bounded/safe; avoid leaking raw command data into log protocols.

## Allowed Files

- plugins/foreman-line/integration/src/pr-plan.ts
- plugins/foreman-line/integration/src/errors.ts
- plugins/foreman-line/integration/tests/fl-r3-push-failure.test.ts
- plugins/foreman-line/integration/tests/conformance.test.ts
- plugins/foreman-line/docs/kickstarters/FL-R3-handoff.md

## Acceptance Criteria

AC-1: Any nonzero push code results in typed PUSH_FAILED and exactly zero PR-create calls.
AC-2: A thrown push error results in typed PUSH_FAILED and exactly zero PR-create calls.
AC-3: Successful push invokes PR-create once afterward and returns the original success result shape; PR-create returned failures remain observable without fake success.
AC-4: Every test injects BOTH seams and is hermetic. Reverting the new guard makes regressions fail.
AC-5: Integration tests, typecheck and lint pass or precise environment/baseline blockers are documented. Only Allowed Files change.

## Out of Scope

Live push/PR creation, changing merge authority, input-argument redesign, retries, source authentication, other goals, commits, publication and installation.

## Context & References

- plugins/foreman-line/integration/src/pr-plan.ts
- plugins/foreman-line/integration/tests/pr-plan.test.ts
- plugins/foreman-line/integration/src/errors.ts

## Verification Plan

Use D:/nvm/v24.19.0/node.exe explicitly. Offline npm ci --ignore-scripts is allowed only in this new worktree's required package directories after manifest inspection. No network fallback, source dependency mutation or lockfile changes. Review focus: can failure reach PR creation? Are both mocks always supplied? Are success and returned downstream failure semantics preserved?

## Coordinator Ruling FL-R3-A1

The original integration suite's SCAF-P4 AC7 test freezes errors.ts byte-for-byte against origin/main, blocking the expressly approved PUSH_FAILED code. The additional Allowed File is authorized solely to retire that parcel-time byte comparison and replace it with a stable IntegrationError contract test preserving the existing codes plus PUSH_FAILED, typed error identity and message/code semantics. Remove a helper only if this retirement leaves it unused. Do not alter unrelated conformance tests or delete the test without replacement. This local candidate amendment does not rewrite the shipped historical spec or claim a committed contract amendment.
