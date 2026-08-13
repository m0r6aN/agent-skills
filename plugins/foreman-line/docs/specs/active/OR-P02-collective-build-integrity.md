---
ticket: OR-P02
title: Restore keon.collective build and test integrity at the ratified current base
status: active
owner: clinton.morgan
created: 2026-08-13
updated: 2026-08-13
supersedes: null
superseded_by: null
risk: elevated
surfaces:
  - src/Keon.Collective.Abstractions/Civilization/CivilizationalHealthReportDraftVerificationReceiptContracts.cs
  - src/Keon.Collective.Abstractions/Civilization/CivilizationalHealthReportVerifiedDraftEvidenceChainBundleContracts.cs
  - tests/Keon.Collective.Core.Tests/Civilization/CivilizationalHealthReportDraftVerificationReceiptVerifierTests.cs
  - tests/Keon.Collective.Core.Tests/Civilization/CivilizationalHealthReportVerifiedDraftEvidenceChainBundleCreatorTests.cs
  - Keon.Collective.slnx
routing_class: architecture/risk
permission_profile: builder-architecture
data_classification: internal
---

## Intent

Restore compilation and full-suite test integrity for `keon.collective` at the ratified current base `c42230c83d525e1586635885c040eb7972d8c6ac`. This is the Wave 0 barrier for every later Collective mechanism parcel: green means the solution compiles and the suite executes with zero failing tests, unless Clinton Morgan later ratifies a specific evidence-backed allowlist of pre-existing failures proven unrelated to every mechanism relied on by this goal. No such allowlist exists at shaping time.

## Constraints

- Target repository: `D:/Repos/keon-omega/keon.collective`.
- Future parcel branch: `feat/foreman-line-OR-P02`, the deterministic branch derived by the mandatory permission-profile emitter.
- Future parcel worktree: `D:/Repos/keon-omega/keon.collective-worktrees/or-p02-collective-build-integrity-20260813`.
- Exact base: `c42230c83d525e1586635885c040eb7972d8c6ac` on local branch `temp`. The amended charter records this commit as the current Collective state. It is three commits ahead of `origin/temp`, contains the ratified legal changes and the removal of the superseded `CognitiveHeatEngine`, and has `merge-base(origin/main,c42230c)=3a5d60fa9ae1cd44f52175ec51aeaa3bf9414cc6`. For this parcel, that specific ratified authority controls over the generic repository instruction to branch from `origin/main`; silently dropping to `origin/main` would omit ratified current state. Any dispute about this base is a stop condition, not builder discretion.
- Step 0 is mandatory. Before any mutation, the builder must state the parcel ID, objective, exact base, branch, worktree, the one Allowed File, the verification commands, and every stop condition, then stop for Coordinator confirmation. The builder must not edit during Step 0.
- Repeat and obey C-8 verbatim before repository reads: **“Kill any running Next.js dev server before file reads in the monorepo — a live server hangs file reads ~4 minutes.”** This does not authorize stopping a production server. Shaping found no running Next.js dev process; the builder must check again in its own session.
- Publication freeze is absolute: no push, PR creation/update, publication, deployment, distribution, package release, filing, or external communication. Do not modify any `LICENSE` file. Do not rewrite history or remove truthful co-authorship trailers.
- Work only in the named parcel worktree and branch. The ambient `temp` checkout remains read-only. No ordinary local `main`, `master`, `temp`, or shared branch receives a merge.
- Commits, if later authorized within the builder lane, are pathspec-scoped to the exact Allowed File. Never use repository-root staging. Every write receives an encoding-stable readback assertion before another action.
- Preserve fail-closed behavior and the existing S-L/S-M public contract semantics. A compilation repair does not authorize API redesign, schema/version changes, test weakening, fixture regeneration, Cognitive Heat changes, doctrine edits, dependency upgrades, or cleanup.
- The Coordinator dispatches and consumes evidence; **the Coordinator is not the verifier**. A builder completion claim is not independent verification. Deterministic verification belongs to a fresh session, and OR-P02 requires two independent frontier adversarial reviews. Reviewers do not fix or commit.
- Never retry a timed-out Docker MCP gateway call. This parcel has no Docker verification requirement; a perceived need for Docker is a stop-and-report condition.
- The current .NET surface is `net10.0`; shaping observed SDK `10.0.303` on Windows x64. Verification must record the actual SDK, OS, and environment used and must not generalize environment-specific evidence.
- The observed `NU1903` warning for `SQLitePCLRaw.lib.e_sqlite3` `2.1.11` is a separately reportable dependency/security finding. It does not authorize a package change in OR-P02 and must not be silently absorbed.

## Acceptance Criteria

1. Step 0 is completed and confirmed before mutation, including the exact base, named lane, exact Allowed File, C-8 check, and stop rules.
2. The future builder explains the compilation root cause with current-source and Git-history evidence. At shaping time, `dotnet build Keon.Collective.slnx --configuration Release --nologo` reports exactly three `CS0246` errors in `src/Keon.Collective.Abstractions/Civilization/CivilizationalHealthReportVerifiedDraftEvidenceChainBundleContracts.cs`, for `CivilizationalHealthReportDraftVerificationReceiptVerificationResult`, `CivilizationalHealthReportDraftVerificationReceiptVerificationCheck`, and `CivilizationalHealthReportDraftVerificationReceiptVerificationError`. Commit `56536b81187d21fd8b752f608c8426f43e089496` removed the S-M contract declarations from the one Allowed File while current source and tests still consume them.
3. From the named parcel worktree at the recorded ending commit, `rtk dotnet build Keon.Collective.slnx -m:1 --configuration Release --nologo -p:UseSharedCompilation=false -nr:false` exits successfully with zero compilation errors. The serialized, non-reusing form is a Coordinator-ratified deterministic-verification amendment after the first timed-out parallel build left an owned MSBuild/compiler-server tree and caused a `CS2012` PDB lock on the next attempt. Warnings are counted and reported; they are not silently reclassified as success evidence or expanded into dependency work.
4. After the successful Release build, `rtk dotnet test Keon.Collective.slnx -m:1 --configuration Release --no-build --nologo -p:UseSharedCompilation=false -nr:false --logger "console;verbosity=normal"` executes all nine test projects listed in `Keon.Collective.slnx`, discovers a nonzero number of tests in each test project, and reports zero failed tests. The completion claim records per-project passed, failed, skipped, and total counts plus aggregate counts.
5. If the build reveals any additional compilation failure, or the test command reveals any failure requiring a file outside the Allowed File, the builder stops without editing that file and returns the exact diagnostic, affected project/test, suspected owner, and proposed minimal spec amendment. A nonzero test result is not green unless Clinton has separately ratified an evidence-backed allowlist that pins each failure by identity, location, and observed value and proves it unrelated to every relied-on mechanism.
6. `rtk git diff --name-only c42230c83d525e1586635885c040eb7972d8c6ac...HEAD` names only the Allowed File; `rtk git diff --check c42230c83d525e1586635885c040eb7972d8c6ac...HEAD -- src/Keon.Collective.Abstractions/Civilization/CivilizationalHealthReportDraftVerificationReceiptContracts.cs` is clean; and an exclusion diff proves no other tracked path changed. `LICENSE` remains byte-unchanged.
7. Every builder write has an encoding-stable readback result, and any local commit is pathspec-scoped to the Allowed File. The completion claim names the parcel, source and ending commits, worktree/branch, exact files touched, commands, toolchain, counts, artifacts, warnings, and out-of-scope divergences.
8. A fresh deterministic verifier independently reproduces the build and test results in the required environment. Two fresh frontier reviewers separately assess root-cause correctness, contract preservation, test sufficiency, and scope integrity. Any red, unknown, skipped mandatory check, disputed finding, or unratified scope amendment leaves OR-P02 open.
9. Gate 3 remains human-owned. No merge or cherry-pick occurs unless Clinton approves it at the gate, except where effective target-branch rules are queried immediately before the call and prove the agent's distinct identity is an authorized bypass actor. Missing or unavailable proof fails closed; even an approved local integration cannot authorize push, PR, publication, deployment, release, or integration into an ordinary local default/shared branch.

## Out of Scope

- Any file other than the exact Allowed File.
- Any `LICENSE` modification, dependency/package update, vulnerability remediation, SDK pin, build-system rewrite, warning cleanup, formatting sweep, or unrelated test repair.
- Cognitive Heat, quiescence, replay vocabulary, hysteresis, Temporal Echo, Decision Receipt, Evidence Pack, tenant enforcement, doctrine, patent evidence, or later OR parcel work.
- Weakening, skipping, deleting, quarantining, or reclassifying a test to obtain green status.
- Creating an allowlist of pre-existing failures; only Clinton can ratify one after receiving evidence.
- Pushes, PRs, merges, cherry-picks, deployment, publication, distribution, filing, or any outward action.

## Context & References

- `plugins/foreman-line/docs/goals/operation-receipt-remediation/charter.md`
- `plugins/foreman-line/docs/goals/operation-receipt-remediation/plan-review-findings.md`
- `plugins/foreman-line/docs/goals/operation-receipt-remediation/loop-directive.md`
- `plugins/foreman-line/docs/SPEC-CONVENTION.md`
- `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`
- `D:/Repos/keon-omega/AGENTS.md`
- `D:/Repos/keon-omega/keon.collective/AGENTS.md`
- `D:/Repos/keon-omega/keon-systems-web/AGENTS.md`
- `C:/Users/clint/.codex/attachments/52d17075-fba9-48f3-b244-677dcf04655a/pasted-text.txt`
- `D:/Repos/keon-omega/keon.collective/Keon.Collective.slnx`
- `D:/Repos/keon-omega/keon.collective/src/Keon.Collective.Abstractions/Civilization/CivilizationalHealthReportDraftVerificationReceiptContracts.cs`
- `D:/Repos/keon-omega/keon.collective/src/Keon.Collective.Abstractions/Civilization/CivilizationalHealthReportVerifiedDraftEvidenceChainBundleContracts.cs`

## Allowed Files

- `src/Keon.Collective.Abstractions/Civilization/CivilizationalHealthReportDraftVerificationReceiptContracts.cs`

This is a discovery-bounded mutation envelope, not permission to self-expand. Existing verifier and evidence-chain tests already consume the missing contract types. If repairing the proven contract-declaration deletion in this file does not produce full green, the builder must stop at Acceptance Criterion 5 and request an exact-file amendment rather than edit another path.

## Verification Plan

Builder and independent verifier run from their own named worktrees and record exact output:

```powershell
rtk git rev-parse HEAD
rtk git branch --show-current
rtk git status --short --branch
rtk dotnet --version
rtk dotnet build Keon.Collective.slnx -m:1 --configuration Release --nologo -p:UseSharedCompilation=false -nr:false
rtk dotnet test Keon.Collective.slnx -m:1 --configuration Release --no-build --nologo -p:UseSharedCompilation=false -nr:false --logger "console;verbosity=normal"
rtk git diff --name-only c42230c83d525e1586635885c040eb7972d8c6ac...HEAD
rtk git diff --check c42230c83d525e1586635885c040eb7972d8c6ac...HEAD -- src/Keon.Collective.Abstractions/Civilization/CivilizationalHealthReportDraftVerificationReceiptContracts.cs
rtk git diff --exit-code c42230c83d525e1586635885c040eb7972d8c6ac...HEAD -- . ":(exclude)src/Keon.Collective.Abstractions/Civilization/CivilizationalHealthReportDraftVerificationReceiptContracts.cs"
rtk git diff --exit-code c42230c83d525e1586635885c040eb7972d8c6ac...HEAD -- LICENSE
```

The two independent reviewers must answer:

1. Does the repair restore the exact missing S-M contract surface without introducing a new schema, semantic change, duplicate type, or authority expansion?
2. Do the existing compiler consumers and tests exercise the restored declarations sufficiently to make a new test-file mutation unnecessary?
3. Did every test project in the solution actually execute with nonzero discovery and zero failures, with per-project and aggregate counts reported?
4. Was the ratified `c42230c` base preserved, including the legal commits and `CognitiveHeatEngine` removal, rather than silently rebasing the parcel onto `origin/main`?
5. Did exactly the one Allowed File change, with `LICENSE`, dependency declarations, later mechanism surfaces, and ambient checkout state untouched?
6. Was the `NU1903` dependency warning reported as an out-of-scope finding rather than silently fixed or ignored?

## Shaping Findings and Stop Gate

- C-8 was checked before shaping reads: no Next.js development process was present.
- The shaping build used .NET SDK `10.0.303` on Windows x64 and redirected build artifacts outside the target checkout. It failed with 3 errors and 16 repeated warning instances; the three unique compile errors are the `CS0246` diagnostics recorded in Acceptance Criterion 2.
- Because compilation fails, no current suite result is valid evidence and shaping did not claim test counts.
- Git history provides a single-file causal seam: commit `56536b8` deleted the S-M schema, enums, records, result, and verifier interface from the Allowed File, while downstream source and tests remained.
- No load-bearing product, security, contract-version, or legal decision is delegated to the builder. Any need to change another file, revise the schema, accept a failing test, update the vulnerable package, or dispute the ratified base is an immediate stop for Coordinator and, where applicable, Clinton ruling.
