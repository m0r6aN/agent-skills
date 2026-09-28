---
ticket: FL-ASSEMBLY
title: Preserve canonical vector invariants without freezing receipt implementation
status: active
owner: clinton.morgan
created: 2026-09-05
updated: 2026-09-05
risk: elevated
surfaces: [plugins/foreman-line/approval/tests/canonical-parity.test.ts]
routing_class: architecture/risk
permission_profile: builder-architecture
data_classification: internal
---

## Intent

Close the single observed integration conflict after exact assembly of independently reviewed FL-R1 through FL-R4. Approval's historical no-receipts-diff test blocks the expressly authorized receipt repair despite unchanged canonicalization and frozen vector bytes.

## Constraints

Assigned fl-assembly-20260905 worktree, feat/foreman-line-FL-ASSEMBLY-20260905, base 5ce6ddc7f996d764e506b6b421779fbf3ece689a. All 24 previously assembled files remain the byte-identical reviewed baseline; the assembly handoff may be appended for current evidence. No source-lane or existing-owner worktree changes. Standing constraints apply: plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md.

Coordinator ruling FL-ASSEMBLY-A1 under the user's 2026-09-05 non-destructive authorization: retire only approval AC2's parcel-time receipts-directory diff freeze. Preserve its existing frozen-vector equality and no-pcc-internals checks. Replace the retired comparison with a genuine negative control proving a semantic mutation of the vector input changes the computed hash while leaving source fixture bytes unchanged. Do not rewrite historical done specs or weaken canonicalization/hash behavior. Remove only unused imports/variables caused by this retirement; helpers.ts remains untouched.

## Allowed Files

- plugins/foreman-line/approval/tests/canonical-parity.test.ts
- plugins/foreman-line/docs/kickstarters/FL-ASSEMBLY-handoff.md

## Acceptance Criteria

AC-1: Existing canonical-vector equality and pcc import-boundary assertions remain intact.
AC-2: A changed semantic vector input is independently shown not to yield the frozen expected hash; the original fixture remains byte-identical and still hashes correctly.
AC-3: No implementation-tree or moving-fork byte pin is used as a permanent conformance test.
AC-4: All14 package suites, typechecks and lints plus runner tests pass together under Node24.19.0, with complete counts and actual exit codes. No skipped test is described as passing.
AC-5: New diff relative to assembled baseline is restricted to Allowed Files plus this parent-owned spec; previous lane files other than handoff remain byte-identical. Independent review required before local acceptance.

## Out of Scope

Canonical algorithm changes, fixture changes, unrelated byte-pin cleanup, tracked goal/index edits, hosted CI execution, commits, pushes, branch-rule mutation, merge or broader plugin completion.

## Context & References

- plugins/foreman-line/approval/tests/canonical-parity.test.ts
- plugins/foreman-line/receipts/tests/fixtures/hash-vector-genesis.json
- plugins/foreman-line/docs/kickstarters/FL-ASSEMBLY-handoff.md

## Verification Plan

Use explicit D:/nvm/v24.19.0/node.exe. Existing assembly dependencies suffice; actual runner --offline may recreate only its own node_modules from exact locks with scripts disabled. No network fallback. Review focus: did the replaced test become a no-op, did vector bytes or expected digest change, and do all previously reviewed repairs compose?
