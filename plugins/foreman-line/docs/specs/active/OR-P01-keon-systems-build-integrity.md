---
ticket: OR-P01
title: Independently verify keon-systems build integrity at 2b6c755
status: active
owner: clinton.morgan
created: 2026-08-13
updated: 2026-08-13
supersedes: null
superseded_by: null
risk: elevated
surfaces:
  - Keon.sln
  - tests/Keon.Runtime.Tests/Keon.Runtime.Tests.csproj
  - tests/Keon.Runtime.Tests/AuthoritativeReceiptOutboxContractTests.cs
  - tests/Keon.Runtime.Tests/ExecutionOutboxGateTests.cs
  - tests/Keon.Runtime.Tests/DecisionEngineTests.cs
routing_class: architecture/risk
permission_profile: reviewer-readonly
data_classification: internal
---

# OR-P01 — keon-systems Build Integrity

## Intent

Produce independent, reproducible evidence that `keon-systems` at exact commit
`2b6c75536f50f125155ee697446cec89f70f2fec` builds cleanly and that the three
authoritative ARO-adjacent test classes pass. This is a verification-only parcel:
the result is an evidence packet consumed by the Operation Receipt Coordinator,
not an implementation commit or a mechanism ruling. A red or irreproducible result
is reported without changing code and may justify a separately shaped and ratified
builder lane; it does not enlarge OR-P01.

## Constraints

- Target repository: `D:/Repos/keon-omega/keon-systems`.
- Pinned base: `2b6c75536f50f125155ee697446cec89f70f2fec`, currently local `main`, three commits ahead of `origin/main`. Remote state is not the verification base.
- Future parcel branch: `feat/foreman-line-OR-P01`, the deterministic branch derived by the mandatory permission-profile emitter.
- Future parcel worktree: `D:/Repos/keon-omega/_worktrees/or-p01-keon-systems-build-integrity`.
- Do not create that branch or worktree during shaping. At dispatch, create both from the pinned base only after Coordinator factual lint and permission-profile emission.
- The authoritative solution is root `Keon.sln`. The authoritative test project is `tests/Keon.Runtime.Tests/Keon.Runtime.Tests.csproj`; do not substitute the distinct legacy project at `src/Keon.Runtime.Tests/Keon.Runtime.Tests.csproj`.
- **Kill any running Next.js dev server before file reads in the monorepo — a live server hangs file reads ~4 minutes.** This does not authorize stopping a production server. C-8 was checked immediately before shaping and no Next.js development process was present; the dispatched session must check again before reads.
- The Coordinator dispatches and consumes independent evidence; it is not the verifier and must not supply the build/test evidence it accepts.
- Publication freeze is absolute: no push, PR, deployment, publication, distribution, registry operation, or remote mutation.
- Never modify a `LICENSE` file. No repository file mutation is authorized by this parcel.
- Every command is run through `rtk`; use `rtk proxy` for exact output and binary artifacts. Do not send credentials or secrets through captured Kompress output.
- Never retry a timed-out Docker MCP gateway call. This parcel requires no Docker or MCP gateway call; if one becomes necessary, stop and report instead of introducing or retrying it.
- Build, intermediate, result, and evidence outputs must be directed outside the repository worktree under `C:/Users/clint/.codex/visualizations/2026/08/11/019ff142-0b35-7040-98c2-e36420c5f77b/operation-receipt-coordinator/evidence/OR-P01/`. Do not use repo-local `bin`, `obj`, `TestResults`, or `.artifacts` as evidence destinations.
- The dispatched session must use .NET SDK `10.0.x` on Windows x64 and record the exact selected SDK, installed SDK/runtime list, PowerShell version, OS version, and architecture. Shaping observed .NET SDK `10.0.303`, PowerShell `7.6.3`, and Windows `10.0.26200.0`; those are observations, not substitutes for dispatch-time evidence.
- Use Release configuration and the root-CI serialization flag `-m:1`. Restore and build the root solution once, then run each named class independently with `--no-build` against the same external artifacts path.
- A verification command that is red, unknown, skipped, filtered to zero tests, or not reproducible fails the parcel. Do not reinterpret it as partial success.
- All repository commits, if a later ratified builder lane authorizes any, must be pathspec-scoped. `git add -A`, repository-root staging, and unscoped commits are forbidden. OR-P01 itself has no commit because it authorizes no tracked change.
- Every externally written evidence artifact receives an encoding-stable readback and SHA-256 entry. A successful write command without readback is not evidence.
- Gate 3 remains human-owned. OR-P01 is expected to produce no commit and therefore no merge; any proposed merge or cherry-pick stops for Clinton Morgan unless the charter's exact merge-time delegation proof exists. No ordinary local default/shared branch is an integration target.

## Acceptance Criteria

1. **Step 0 restate-and-stop is acknowledged.** Before any restore/build/test command, the dispatched verifier restates: parcel ID and verification-only intent; exact base SHA; branch and worktree; the empty repository Allowed Files authority; exact solution/project/class filters; external evidence root; publication freeze; no-`LICENSE`; no-Docker-retry; Coordinator-is-not-verifier; and Gate 3 human ownership. It then stops until the Coordinator explicitly acknowledges the restatement.
2. **Pinned clean start.** In the isolated worktree, `HEAD` equals `2b6c75536f50f125155ee697446cec89f70f2fec`, the branch is `feat/foreman-line-OR-P01`, and `rtk git status --porcelain=v1` is empty before restore.
3. **Environment evidence is complete.** The packet records exact outputs from `dotnet --version`, `dotnet --list-sdks`, `dotnet --list-runtimes`, `pwsh --version`, Windows version, and process/OS architecture. The selected SDK is `10.0.x`; any different major/minor SDK is a stop.
4. **Root solution builds cleanly.** After an explicit restore to the external artifacts root, `Keon.sln` builds in Release with `-m:1`, `--no-restore`, and exit code `0`. The evidence records elapsed time plus the build summary with `0 Warning(s)` and `0 Error(s)`. Any warning, error, skipped build, or fallback to a narrower project is red.
5. **`AuthoritativeReceiptOutboxContractTests` passes independently.** The fully qualified class filter discovers and executes exactly 15 test cases at the pinned base, with 15 passed, 0 failed, and 0 skipped. The TRX and exact console summary are retained. The 15-case shaping baseline is 14 theory rows across both implementations plus one SQLite-only fact; the runner result is the authoritative execution evidence.
6. **`ExecutionOutboxGateTests` passes independently.** The fully qualified class filter discovers and executes exactly 12 test cases at the pinned base, with 12 passed, 0 failed, and 0 skipped. The TRX and exact console summary are retained.
7. **`DecisionEngineTests` passes independently.** The fully qualified class filter discovers and executes exactly 22 test cases at the pinned base, with 22 passed, 0 failed, and 0 skipped. The TRX and exact console summary are retained.
8. **Aggregate counts reconcile.** The packet reports 49 passed, 0 failed, and 0 skipped across the three isolated runs and reconciles those totals to the three TRX files. A zero-test filter or count mismatch is red, not waived.
9. **Evidence is self-contained and read back.** The external packet contains the pinned SHA, repository/worktree/branch, commands, exit codes, environment/toolchain, timestamps and durations, build warning/error counts, per-suite and aggregate test counts, TRX paths, exact file SHA-256 values, and any divergence. Every packet file is read back and its hash is verified before the completion claim.
10. **No repository mutation occurred.** Final `rtk git status --porcelain=v1` is empty and `rtk git diff --name-only` plus `rtk git diff --cached --name-only` produce no paths. No commit, push, PR, merge, cherry-pick, or `LICENSE` change occurred.
11. **Evidence sufficiency receives dual independent review.** Two fresh frontier reviewers independently answer the mandated focus questions below without fixing or committing. Each reviewer ends with a clean-worktree assertion. Any unresolved, disputed, red, unknown, or skipped finding prevents OR-P01 from being advanced at Gate 3.

## Out of Scope

- Fixing any build or test failure, changing source/tests/project files, regenerating baselines, or weakening assertions.
- Verifying the distinct `src/Keon.Runtime.Tests` project or treating it as equivalent to the named root-suite project.
- Running the entire test solution or claiming broader repository health beyond the root build and the three named classes.
- OR-P02 or any Wave 1–4 implementation, mechanism ruling, doctrine reconciliation, shadow-worktree reconciliation, or evidence-vault work.
- Creating a builder lane, expanding Allowed Files, or absorbing a newly discovered divergence. A red result returns to the Coordinator for a separate shaping and ratification decision.
- Publishing, pushing, opening/updating a PR, deploying, releasing, modifying any remote, merging to a default/shared branch, or modifying any `LICENSE` file.

## Context & References

- `plugins/foreman-line/docs/goals/operation-receipt-remediation/charter.md`
- `plugins/foreman-line/docs/goals/operation-receipt-remediation/plan-review-findings.md`
- `plugins/foreman-line/docs/goals/operation-receipt-remediation/loop-directive.md`
- `plugins/foreman-line/docs/SPEC-CONVENTION.md`
- `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`
- `C:/Users/clint/.codex/attachments/52d17075-fba9-48f3-b244-677dcf04655a/pasted-text.txt`
- `D:/Repos/keon-omega/keon-systems/Keon.sln`
- `D:/Repos/keon-omega/keon-systems/tests/Keon.Runtime.Tests/Keon.Runtime.Tests.csproj`
- `D:/Repos/keon-omega/keon-systems/.github/workflows/pr-validation.yml`
- `D:/Repos/keon-omega/keon-systems/.github/workflows/aro-invariants-gate.yml`

## Allowed Files

No repo-relative files are allowed. OR-P01 is a verification-only parcel and may
not create, edit, move, or delete any file in the `keon-systems` worktree. The
external evidence root named in Constraints is outside the repository and does
not grant mutation authority over any repository path. If any repo-relative path
is needed, stop for Coordinator factual lint, a spec amendment, and a separately
ratified builder lane; never add `LICENSE`.

## Integration Surfaces and Gates

- Read-only solution surface: `Keon.sln`.
- Read-only project surface: `tests/Keon.Runtime.Tests/Keon.Runtime.Tests.csproj`.
- Read-only test surfaces: the three exact `.cs` files named in frontmatter.
- Toolchain gate: Windows x64, .NET SDK `10.0.x`, Release, serialized root build.
- Security/release gate: external evidence only, no secrets, no repository writes, publication freeze, no remote action.
- Dependency gate: Gate 1 is closed and Gate 2 covers OR-P01. No later Operation Receipt parcel may dispatch until OR-P01 and OR-P02 are independently green.
- Closure gate: the Coordinator closure-checks the independent claim against disk and routes two independent evidence-sufficiency reviews. Coordinator lint remains authoritative; this draft and its advisory self-check do not promote status.

## Verification Plan

After Step 0 acknowledgment, the verifier runs from the isolated worktree and
uses one externally created evidence directory. Every shell command remains
`rtk`-prefixed; exact output uses `rtk proxy`. The packet must preserve the
literal commands and outputs, including exit codes.

Required command shapes:

```powershell
$orP01EvidenceRoot = 'C:/Users/clint/.codex/visualizations/2026/08/11/019ff142-0b35-7040-98c2-e36420c5f77b/operation-receipt-coordinator/evidence/OR-P01'
$orP01ArtifactsRoot = "$orP01EvidenceRoot/dotnet-artifacts"
$orP01ResultsRoot = "$orP01EvidenceRoot/test-results"

rtk proxy powershell -NoProfile -Command "New-Item -ItemType Directory -Force -Path '$orP01EvidenceRoot', '$orP01ArtifactsRoot', '$orP01ResultsRoot'"
rtk git rev-parse HEAD
rtk git branch --show-current
rtk git status --porcelain=v1
rtk proxy dotnet --version
rtk proxy dotnet --list-sdks
rtk proxy dotnet --list-runtimes
rtk proxy pwsh --version
rtk proxy pwsh -NoProfile -Command "[System.Environment]::OSVersion.VersionString; [System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture; [System.Runtime.InteropServices.RuntimeInformation]::ProcessArchitecture"
rtk proxy dotnet restore Keon.sln -m:1 --nologo --verbosity minimal --artifacts-path $orP01ArtifactsRoot
rtk proxy dotnet build Keon.sln -m:1 --configuration Release --no-restore --nologo --verbosity minimal --artifacts-path $orP01ArtifactsRoot
rtk proxy dotnet test tests/Keon.Runtime.Tests/Keon.Runtime.Tests.csproj -m:1 --configuration Release --no-build --nologo --verbosity minimal --artifacts-path $orP01ArtifactsRoot --filter "FullyQualifiedName~Keon.Runtime.Tests.AuthoritativeReceiptOutboxContractTests" --results-directory $orP01ResultsRoot --logger "trx;LogFileName=AuthoritativeReceiptOutboxContractTests.trx"
rtk proxy dotnet test tests/Keon.Runtime.Tests/Keon.Runtime.Tests.csproj -m:1 --configuration Release --no-build --nologo --verbosity minimal --artifacts-path $orP01ArtifactsRoot --filter "FullyQualifiedName~Keon.Runtime.Tests.ExecutionOutboxGateTests" --results-directory $orP01ResultsRoot --logger "trx;LogFileName=ExecutionOutboxGateTests.trx"
rtk proxy dotnet test tests/Keon.Runtime.Tests/Keon.Runtime.Tests.csproj -m:1 --configuration Release --no-build --nologo --verbosity minimal --artifacts-path $orP01ArtifactsRoot --filter "FullyQualifiedName~Keon.Runtime.Tests.DecisionEngineTests" --results-directory $orP01ResultsRoot --logger "trx;LogFileName=DecisionEngineTests.trx"
rtk proxy Get-FileHash -Algorithm SHA256 -LiteralPath "$orP01ResultsRoot/AuthoritativeReceiptOutboxContractTests.trx"
rtk proxy Get-FileHash -Algorithm SHA256 -LiteralPath "$orP01ResultsRoot/ExecutionOutboxGateTests.trx"
rtk proxy Get-FileHash -Algorithm SHA256 -LiteralPath "$orP01ResultsRoot/DecisionEngineTests.trx"
rtk git status --porcelain=v1
rtk git diff --name-only
rtk git diff --cached --name-only
```

The verifier may add external-only log/report files beneath `$orP01EvidenceRoot`
to preserve exact console output and the evidence manifest, but may not redirect
anything into the repository. It must read back and hash each added evidence file.

Mandated reviewer focus questions:

1. Does the evidence prove a root `Keon.sln` Release build at the exact pinned SHA, rather than a narrower project build or a different commit?
2. Do the filters bind to the three exact classes in `tests/Keon.Runtime.Tests`, and do the TRX files prove 15 + 12 + 22 = 49 executed cases with no failures or skips?
3. Did `--no-build` tests consume the same external build artifacts produced by the recorded root build, without silently rebuilding or falling back to repo-local outputs?
4. Is the environment/toolchain evidence complete enough to reproduce the result, and are environment-specific claims kept environment-specific?
5. Is there affirmative clean-worktree proof before and after execution, with no tracked/untracked repo output, `LICENSE` mutation, commit, remote action, or publication?
6. Are all evidence files read back and hashed, and is any red, unknown, skipped, count-mismatched, or irreproducible check reported rather than normalized into success?

## Stop and Reporting Rules

- Stop immediately if the base SHA, branch, worktree, C-8 state, toolchain major/minor, or clean-start assertion differs from the spec.
- Stop after any restore/build/test failure or zero-test/count-mismatch result. Preserve the evidence already produced; do not edit, rerun with weaker flags, switch projects, install an alternate SDK, retry via Docker, or attempt a fix.
- Report every newly discovered divergence outside this scope to the Coordinator without absorbing it.
- A completion claim must state OR-P01, repository, branch/worktree, source and ending SHA, exact files touched (`none` expected), commands, environment/toolchain, build warning/error counts, per-suite and aggregate pass/fail/skip counts, evidence paths and hashes, review state, and next safe action.
- Because this parcel has no mutation authority, the only successful ending SHA is the pinned source SHA and the only valid repository diff is empty.
