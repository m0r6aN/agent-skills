---
ticket: OPMEM-H1
title: Remediate vulnerable Gateway native SQLite dependency
status: done
owner: clinton.morgan
created: 2026-10-13
updated: 2026-10-14
risk: elevated
surfaces:
  - src/Keon.McpGateway/Keon.McpGateway.csproj
  - tests/Keon.McpGateway.Tests/Keon.McpGateway.Tests.csproj
  - tests/Keon.McpGateway.Tests/Cortex/NativeSqliteVersionTests.cs
routing_class: architecture/risk
verification_class: judgment-required
permission_profile: builder-architecture
data_classification: internal
expertise: security
inputs: [text]
thinking_level: high
---

## Intent

Close OPMEM stop S-1 (CVE-2025-6965 / GHSA-2m69-gcr7-jv3q) through a narrow dependency-only change in the Gateway before P5a. Preserve the 421-test baseline of exactly `Keon.McpGateway.Tests` (not the whole repository), prove the actual patched native SQLite version on Windows/Linux published assets, and keep all changes off production-deploying branches.

## Constraints

- Owner explicitly approved the separate remediation recommendation; see `plugins/foreman-line/docs/goals/operator-developer-cortex-memory/owner-h1-authorization-2026-10-13.md`. Local parcel ID is not a registration/approval receipt.
- Sole source root `Keon-Systems/keon-mcp-gateway`; immutable base `0e0878a5938ada21409e6e95ab8d2ea260c2f6b5`; worktree `D:/Repos/opmem-worktrees/gateway-h1-01a1358d`, branch `feat/opmem-h1-sqlite-01a1358d`; merge ONLY to `opmem/integration`, restored and verified at that same SHA. Never main/develop/deploy workflows.
- In both direct manifests, change only `Microsoft.Data.Sqlite` **10.0.0 → 10.0.13**. Official NuGet stable metadata confirms provider/Core 10.0.13 → SQLitePCLRaw bundle/core/provider/lib 2.1.13. Other packages and net10.0 are unchanged; no transitive overrides, suppressions, custom feeds or prereleases.
- Metadata and absence of an audit warning are not native-runtime proof: measured published `sqlite_version()` must be >=3.50.2. A candidate that fails this floor stops for a version/scope ruling, never silent broad upgrades.
- Test is exactly one new Fact: open an in-memory `SqliteConnection`, execute `SELECT sqlite_version()`, parse the entire three-component numeric value, assert >=3.50.2 and print measured value via `ITestOutputHelper`. No exploit payloads, live-service/database access or score/identity/governance changes.
- Online restore from the configured official NuGet feed is authorized; downloaded package archives are metadata evidence, not a complete offline feed. Existing 2.1.14 exploratory archives are not approved overrides. Source/test `surfaces` vocabulary warnings are advisory; no convention change.
- Never `git clean`, reset dirty checkouts, alter credentials, start/modify live services, or publish/merge from a builder. Build artifacts and temporary proof harnesses remain ignored/scratch. Reviews never fix/commit.
- Standing constraints apply: `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`. Inherited USD45 architecture-parcel / USD400 cumulative guards, recorded predecessor191.10, unknown historical costs unchanged. Fresh shaping and dual family-independent reviews are required.

## Allowed Files

Exact paths relative to the sole Gateway root:

- `src/Keon.McpGateway/Keon.McpGateway.csproj`
- `tests/Keon.McpGateway.Tests/Keon.McpGateway.Tests.csproj`
- `tests/Keon.McpGateway.Tests/Cortex/NativeSqliteVersionTests.cs` (NEW)

Any additional tracked path requires a coordinator amendment before editing. No directory/glob mutation grants.

## Acceptance Criteria

1. Exactly two modified manifests plus one added test match the three allowed paths; no other tracked/newly tracked paths. Each manifest changes only its SQLite version string, no audit suppression or unrelated update. The IntegrationTests manifest remains byte-identical to base.
2. Fresh `dotnet restore Keon.McpGateway.slnx --force-evaluate --no-cache --nologo` succeeds with no vulnerability/downgrade warnings; solution-level `dotnet list Keon.McpGateway.slnx package --include-transitive --vulnerable --no-restore` covers all three projects (Gateway, Tests and IntegrationTests), reporting no known vulnerabilities at timestamped collection. Newly surfaced unrelated findings stop/report, not silent fixes.
3. All three resolved project graphs show Microsoft.Data.Sqlite/Core10.0.13 and SQLitePCLRaw bundle/core/provider/native2.1.13; vulnerable2.1.11 is absent from each. Record actual graphs, not intended package labels. IntegrationTests is verification scope only, not mutation scope.
4. Exactly the `Keon.McpGateway.Tests` project suite `dotnet test tests/Keon.McpGateway.Tests -c Release --nologo` passes **422/0/0**: all421 baseline tests preserved plus exactly one new test (baseline `h1-baseline.trx`). No deletion, skip, weakening or broad fixture change. Separately re-run IntegrationTests on Windows with child environment ANTHROPIC_API_KEY, OPENAI_API_KEY, KEON_IT_CORTEX_URL and KEON_IT_COLLECTIVE_PROJECT unset: mock-only baseline is 3 passed / 5 failed / 2 skipped (`h1-integration-baseline.trx`). Require identical test identities/outcomes, not a falsely green integration claim; existing authorization-expectation failures and absent real-provider coverage are documented, not fixed in H1. Linux integration execution is excluded; it is not compatibility evidence.
5. The native-version Fact prints a measured version >=3.50.2; a disposable mutation changing its floor to99.0.0 fails, performed in an owned copy outside the parcel worktree; parcel source is never mutated. Numeric full-value parsing, not string ordering, is inspected independently.
6. `dotnet publish src/Keon.McpGateway/Keon.McpGateway.csproj -c Release -r win-x64 --self-contained false -o <owned-scratch>` succeeds; exact published native library is loaded by absolute path by an owned throwaway BCL-only version harness (outside repo), recording path/hash/version >=3.50.2. No fallback to build-tree/system SQLite.
7. Same exact `Keon.McpGateway.Tests` project suite (422/0/0) and linux-x64 publish/version proof run inside the already-installed pinned-by-local-image-ID .NET10 SDK Docker image. Read-only source mount, copied build source/outputs and harness in disposable owned scratch; no production services or secrets mounted. Record Linux count, asset hash and measured version; Windows proof is not Linux proof.
8. Two fresh independent frontier review verdicts, both family-independent of Moonshot builder, plus coordinator closure/reproduction and exact-head checks precede acceptance. No unsupported deployment or overall OPMEM-completion claim.

## Out of Scope

P5a memory protocol implementation, arbitrary dependency modernization, changing Runtime/Cortex/bridge/Pi, production promotion, Azure/Neon/credentials, modifying native upstream code or restoring other owners' work. An H1 local pass is not a deployed security fix or P8/P9 validation.

## Context & References

- Accepted integration merge: https://github.com/Keon-Systems/keon-mcp-gateway/pull/51 (`b3a4b1b529ea0b804c07c681c69de8d4e2aebfdf`, exact tree equal reviewed candidate `bfd21823b1c8419ba320961591583b476e9df58e`).
- `plugins/foreman-line/docs/goals/operator-developer-cortex-memory/h1-closure-2026-10-14.md` — integration-only closure, human Gate3 evidence and separate documentation-CI hold.

- `plugins/foreman-line/docs/goals/operator-developer-cortex-memory/owner-h1-authorization-2026-10-13.md`
- `plugins/foreman-line/docs/goals/operator-developer-cortex-memory/resume-stop-report-2026-10-13-01a1358d.md`
- `plugins/foreman-line/docs/goals/operator-developer-cortex-memory/h1-shaping-and-lint-2026-10-13.md`
- https://github.com/advisories/GHSA-2m69-gcr7-jv3q
- https://api.nuget.org/v3-flatcontainer/microsoft.data.sqlite/10.0.13/microsoft.data.sqlite.10.0.13.nupkg
- https://api.nuget.org/v3-flatcontainer/sqlitepclraw.bundle_e_sqlite3/2.1.13/sqlitepclraw.bundle_e_sqlite3.2.1.13.nupkg

## Verification Plan

Exact commands/evidence are in the H1 kickstarter/closure. Review focus: Does the resolved graph actually exclude the affected native library? Is the SQLite floor assertion exercised against the runtime/published asset rather than only package metadata? Are Windows and Linux artifacts independently proved? Do all421 existing tests survive? Are there any suppressions, unintended changes, deployment side effects or inflated security claims? Does the regression test fail when its named floor is broken?

## Step 0 / Stop Rule

Builder's first pass is RESTATE AND STOP, no edits: restate scope, exact paths, base, package chain, test plan, conflicts/amendments and unsafe assumptions. Coordinator GO only after factual lint/authorization, and then the builder implements only this approved contract. Missing permission, failing version/audit evidence, wrong test count, security outside scope or any production-affecting action stops the parcel.
