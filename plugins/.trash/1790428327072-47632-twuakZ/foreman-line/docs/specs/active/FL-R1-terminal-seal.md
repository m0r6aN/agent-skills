---
ticket: FL-R1
title: Reject incomplete terminal receipt chains as sealed
status: active
owner: clinton.morgan
created: 2026-09-05
updated: 2026-09-05
risk: elevated
surfaces: [plugins/foreman-line/receipts/]
routing_class: architecture/risk
permission_profile: builder-architecture
data_classification: internal
---

## Intent

Make the public structural sealing predicate distinguish successful terminal closure from a failed Stage-F claim. This is an isolated, uncommitted repair candidate under the user's 2026-09-05 non-destructive completion authorization, not a merge, release, or existing-goal acceptance.

## Constraints

Base: 5ce6ddc7f996d764e506b6b421779fbf3ece689a. Branch: feat/foreman-line-FL-R1-20260905. Work only in the assigned fl-r1-terminal-seal-20260905 worktree. Standing constraints apply: plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md.

Coordinator decision FL-R1-A1: supersede the old stage-F-only predicate for this candidate. isSealed is true only for a structurally valid chain whose highest-sequence document has kind stage, stage F, and subjectKind ClosureRecord. HalfClosedClosure claims are never seals. This deliberately tightens shipped behavior; existing legitimate structural ClosureRecord chains remain valid. Do not add a compatibility predicate or claim authenticated/cryptographic closure. Do not modify the historical done spec. This candidate amendment and implementation require independent review before adoption; no committed amendment or merge is claimed.

## Allowed Files

- plugins/foreman-line/receipts/src/validator.ts
- plugins/foreman-line/receipts/tests/chain-invariants.test.ts
- plugins/foreman-line/receipts/README.md
- plugins/foreman-line/docs/kickstarters/FL-R1-handoff.md

## Acceptance Criteria

AC-1: Existing valid ClosureRecord chain remains sealed; empty and nonterminal chains remain unsealed.
AC-2: Valid Stage-F HalfClosedClosure claims, wrong-kind F documents, and wrong-subject F documents are unsealed.
AC-3: Invalid sequence, pointer, schema or correlation chains cannot become sealed merely by appending F.
AC-4: A valid half-closed-then-successfully-retried chain becomes sealed only on its terminal ClosureRecord.
AC-5: Receipt package tests, typecheck and lint pass; dependent integration tests are run or have precisely recorded environmental blockers. Tests must fail on the original predicate.
AC-6: No other source paths, goal records, settings or dependency locks are changed. Exact command outcomes and candidate diff are recorded.

## Out of Scope

Cryptographic verification, authenticated merge facts, receipt store immutability, lifecycle file moves, new schemas, goal ownership, installation, publication, external services and merges.

## Context & References

- plugins/foreman-line/receipts/src/validator.ts
- plugins/foreman-line/integration/src/closure.ts
- plugins/foreman-line/integration/tests/closure.test.ts

## Verification Plan

Use D:/nvm/v24.19.0/node.exe explicitly. Offline npm ci --ignore-scripts is allowed only in this new worktree's required package directories after manifest/lock inspection; no network fallback. Existing source checkout dependencies are read-only. Record missing cache entries rather than downloading. Do not run live adapters. Run package tests, typecheck and lint with process-local Node path if child processes require it. Review focus: can a claim or malformed chain still pass? Do valid retry chains survive? Does the change claim more than structural sealing?
