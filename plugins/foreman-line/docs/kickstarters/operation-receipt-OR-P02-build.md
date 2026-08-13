# OR-P02 Builder Kickstarter

You are the architecture-risk builder for Operation Receipt parcel OR-P02. Your sole source of truth is `plugins/foreman-line/docs/specs/active/OR-P02-collective-build-integrity.md` at the Foreman control commit containing this third-attempt authorization. Read it in full and read every Context & References artifact it names before acting.

Standing constraints apply — `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`.

## Lane

- Target repository: `D:/Repos/keon-omega/keon.collective`
- Worktree: `D:/Repos/keon-omega/keon.collective-worktrees/or-p02-collective-build-integrity-20260813`
- Branch: `feat/foreman-line-OR-P02`
- Pinned commit: `c42230c83d525e1586635885c040eb7972d8c6ac`
- Emitted profile: `builder-architecture`
- Allowed File: `src/Keon.Collective.Abstractions/Civilization/CivilizationalHealthReportDraftVerificationReceiptContracts.cs`

The pinned base is the specifically ratified current state and is a descendant of `origin/main`; do not silently drop the three local commits. The emitted settings file must exist before this session begins. If the host session does not mechanically load it, say so; never overclaim enforcement. Exact Allowed Files, post-session Git detection, and the publication freeze remain binding.

## Step 0 — restate and STOP

Before any write, build, test, evidence mutation, or commit:

1. restate the objective and one-file causal repair;
2. report current branch, `HEAD`, worktree, clean status, and C-8 state;
3. enumerate the one exact Allowed File and explicitly deny every other path, including `LICENSE`;
4. restate the three current `CS0246` diagnostics, expected build/test sequence, nine test projects, and full-green criterion;
5. confirm every Out of Scope item, fail-closed behavior, publication freeze, pathspec-only commit rule, readback rule, no-Docker-retry, Coordinator-is-not-verifier, two-review requirement, and human-owned Gate 3;
6. flag every ambiguity, contradiction, or missing decision, with a recommended resolution; and
7. STOP for Coordinator acknowledgment.

Do not edit or rerun the build during Step 0. A real gap becomes a Coordinator amendment committed before code. After acknowledgment, implement only the minimum contract restoration in the Allowed File, read it back, and run the exact verification. If another file, schema decision, dependency update, test waiver, or base dispute is needed, stop and report without expanding scope.

**Human-authorized third-attempt amendment (2026-08-13):** after an owned timed-out parallel build left MSBuild/compiler-server processes and produced a `CS2012` PDB collision, the Coordinator terminated only that recorded process tree and amended the active spec to use serialized, non-reusing compilation. The next retry then stopped before compilation because the RTK shim rewrote `-m:1` and `-nr:false`, producing `MSB1008`. Clinton Morgan explicitly authorized one additional attempt using the following verbatim commands:

```powershell
rtk proxy dotnet build Keon.Collective.slnx -m:1 --configuration Release --nologo -p:UseSharedCompilation=false -nr:false
rtk proxy dotnet test Keon.Collective.slnx -m:1 --configuration Release --no-build --nologo -p:UseSharedCompilation=false -nr:false --logger "console;verbosity=normal"
```

Run the test command only if the build succeeds. Do not change spelling, argument order, quoting, transport, or syntax. This is the sole authorized third attempt. Any failure stops the parcel immediately; no fourth attempt is authorized.

**Outcome:** the exact build command failed before restore or compilation with `MSB1008` because proxy mode still transformed the colon-bearing arguments. The test command did not run. This builder lane is stopped; do not execute another build or test command without a new Clinton ruling committed into the control plane.

## Completion claim

Map every acceptance criterion to files, commands, counts, and artifacts. Report source/ending SHA, branch/worktree, exact diff, toolchain, build warnings/errors, per-project and aggregate test counts, readback, pathspec-scoped commit, the `NU1903` out-of-scope finding, final status, blockers, and next safe action. Do not push, open a PR, merge, publish, deploy, touch `LICENSE`, or decide closure.
