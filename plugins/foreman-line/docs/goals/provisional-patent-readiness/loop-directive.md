# Loop Directive: Provisional Patent Readiness

Status: active — W0-P01-A2 ratified; fresh custody retry pending
Coordinator ownership: this Codex task is the sole queue owner. Ownership transfers only at a parcel boundary recorded in this file. If ownership is ambiguous, stop and report.

## Standing authority

- Gate 1: ratified 2026-08-13, including D6–D15 and plan-review triage.
- Gate 2: granted for the named queue, but a parcel may dispatch only after its fresh shaping spec, dependency gate, Step 0 restate-and-stop gate, and all charter stop conditions are satisfied.
- Gate 3: not granted. No merge, public or private push, PR, fetch, pull, remote CI trigger, or remote API operation is authorized.
- Blanket authorization applies only to non-destructive actions and does not override Hard Rule Zero, the T-patent/T-doctrine preservation constraints, or a stop-and-report condition.

## Non-negotiable constraints

- No public disclosure or remote operation. No deploy, publish, container push, public PR, public issue/gist/forum post, public marketing/README/LICENSE/web/LinkedIn edit.
- `D:/Repos/keon-omega/keon-docs-internal/patents/` and `D:/Repos/keon-omega/keon-doctrine/` are preservation-critical. Never delete, move, clean, stash, restore, or git-clean them.
- Every builder directive includes Hard Rule Zero, preservation constraints, exact Allowed Files, named branch/worktree, and a Step 0 restate-and-stop gate.
- Evidence is produced by dispatched sessions. The coordinator consumes evidence and does not self-certify build/test outcomes.

## Queue

1. W0-P01 — copy-only custody snapshot for preservation-critical state. Shape, then dispatch one builder. Required review class: standard, one independent reviewer after builder evidence.
1a. OR-P23R — remove one external-cache symbolic link, update root ephemera ignores, and explain `_orchestration` custody. This narrowly authorized pre-retry parcel must be accepted before W0-P01 retry.
2. W0-P02 — local Git bundle capture. Blocked by W0-P01 acceptance.
3. W0-P03 — baseline and Stage Zero drift record. Blocked by W0-P02 acceptance.
4. W0-P04 — shadow-worktree/ARO premise finding. Blocked by W0-P03 acceptance.
5. W0-P05 — bounded capability-registry search. Blocked by W0-P03 acceptance.
6. W0-P06 — persistent coordinator ledger. Blocked by W0-P01 acceptance.
7. W1 — all seven delta parcels. Blocked until all W0 items are accepted; exact artifacts and worktrees must come from the W0 ledger.

W2, W3, and W4 are not dispatchable until W1 creates the source-backed catalog and D15 retained-set record. Evidence Vault remains planned/unimplemented until its separately ratified sub-wave is approved.

## Active stop record — 2026-08-13

W0-P01 builder stopped before payload copy after detecting a reparse point at `D:/Repos/keon-omega/keon-docs-internal/patents/discovery-round-1/_orchestration/spreadsheet-work/e-c2-20260712/node_modules/`. The output root `D:/Repos/keon-omega-preserve/provisional-patent-readiness-20260813-w0-p01-custody-snapshot/` was created once and contains only the allowed `snapshot.ps1`; no payload, manifest, or sidecar was created. The builder reported no remote operation and no source or Git mutation.

W0-P01-A1 is ratified. Its class exclusions, opaque-link entries, and internal-link escalation replace the former all-reparse stop. The specified `node_modules` link is excluded and OR-P23R removes only that external-cache link before the retry. Do not alter the partial output or advance past W0-P01 until OR-P23R is accepted.

## OR-P23R stop record — 2026-08-13

The builder performed Step 0 and observed that `patents/discovery-round-1/_orchestration/spreadsheet-work/e-c2-20260712/node_modules` has Windows attributes `Directory, ReparsePoint`, `LinkType=Junction`, and target metadata `C:/Users/clint/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules`. The frozen OR-P23R contract called it a symbolic link. The builder stopped before inventory or any mutation: no link removal, `.gitignore` edit, README creation, staging, commit, or remote operation.

OR-P23R-A1 is ratified. The named object may be removed only as the observed external Windows junction, under every otherwise unchanged OR-P23R constraint. OR-P23R retry is now authorized; W0-P01 remains blocked until OR-P23R is accepted.

OR-P23R is accepted: local commit `c452668651c902203412bbf241921ab0a8f7e478` changed only root `.gitignore` and `_orchestration/README.md`; its independent review confirmed junction absence and preserved inventory. W0-P01 retry is authorized under W0-P01-A1, with a new output root. The original partial output remains untouched.

## W0-P01 retry stop record — 2026-08-13

The W0-P01 retry created `D:/Repos/keon-omega-preserve/provisional-patent-readiness-20260813-w0-p01-custody-snapshot-retry-20260813-01/` but stopped before source traversal or copy because the Windows PowerShell runtime lacks `[IO.Path]::GetRelativePath`. The partial root contains only `snapshot.ps1` and an empty `payload/`; no manifest, sidecar, or source payload exists. The builder corrected its audit script within the permitted output root, then stopped because the frozen no-reuse rule prohibits reusing that partial root. It reported no source/Git/remote mutation; the original partial root remains intact.

W0-P01-A2 is ratified. The retry may use the newly named, initially absent output root and Windows PowerShell-compatible relative-path implementation, retaining every W0-P01-A1 constraint. Do not clean, reuse, or alter either prior partial root.

## Loop protocol

1. Shape the active parcel in a fresh session.
2. Lint every factual claim in its spec against disk before dispatch.
3. Dispatch the builder in its named isolated worktree; require Step 0 restatement and stop on a missing decision, contract change, unlisted file, or unclear security boundary.
4. Map the completion claim to builder-provided evidence; wrong-shaped claims are presumptively empty.
5. Obtain independent review. Architecture/risk parcels receive two independent reviewers.
6. Triage findings. Any locked-decision change re-opens Gate 1 only for that decision. Any disputed finding is reproduced by a separate dispatched verification parcel before acceptance.
7. No merge. Record accepted local evidence and advance only when dependencies clear.

## Stop conditions

Stop and report: any Hard Rule Zero violation; destructive action proposed against T-patent/T-doctrine; implementation/documentation scope mismatch; need to invent enabling behavior; legal, ratification, or merge decision; frozen-spec amendment; unresolved security boundary; or developer stop.
