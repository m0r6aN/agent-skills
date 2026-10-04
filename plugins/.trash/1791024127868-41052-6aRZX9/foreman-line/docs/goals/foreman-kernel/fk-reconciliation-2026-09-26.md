# FK live-owner reconciliation — 2026-09-26

**Goal:** `foreman-kernel`
**Prepared:** 2026-09-26, owner-directed completion wave (ForemanKernel builder slice)
**Purpose:** Charter §15.1 live-source reconciliation. Compare every checkable claim in
`charter.md` (and the tier-7 `ADR-001-runtime-infrastructure-posture.md`) against the
actual repository state: kernel packages under `plugins/foreman-line/`, git history for
FK work, and branch/worktree traces. Record the A1 reconciliation required by INF-5.
**Authority basis:** developer blanket authority 2026-09-26 to the coordinating session
("coordinator decision 2026-09-26 under owner blanket authority"). This document
performs read-only reconciliation; it merges nothing and transfers no ownership.

**Method:** all evidence below was produced by read-only commands against
`D:/Repos/agent-skills` on branch `reconcile/refresh-actions` at `305ecbf` on
2026-09-26. Verdicts: **PRESENT** (claim matches repo state), **ABSENT** (claim's
artifact not in the repo), **DRIFT** (artifact exists but differs from the claim).
Where a claim was written as unverified by the charter, today's verification discharges
it and the verdict reflects that.

Note: `charter.md` carries one uncommitted 2026-09-26 audit edit (INF-1 paragraph, HAWF
record deletion) belonging to the coordinating wave; this reconciliation reads past it
and does not disturb it.

## 1. Delta table — charter claims vs repo evidence

| # | Claim (source) | Repo evidence (2026-09-26) | Verdict |
|---|---|---|---|
| 1 | Goal worktree `D:/Repos/agent-skills-worktrees/foreman-kernel-stage0-20260830`, branch `codex/foreman-kernel-stage0-20260830`; "verify those locations rather than assuming they remain active" (§15.1) | Both exist — worktree checked out at `d0e87ce`, branch present. Not the active work locus since 2026-09-07; later work lives on `codex/fk-p0-*`, `codex/foreman-kernel-unattended-20260907`, `codex/foreman-kernel-resume-20260908` | PRESENT (stale locus) |
| 2 | "Later source material reports FK-P0 at Gate 3, so do not infer that development has not started" (Read-this-first) | Verified, and advanced beyond: `FK-P0-GATE-3-package.md` + commit `197185b` (2026-09-02, "FK-P0 at Gate 3 — head 838f438"); R30 accepted `c35ff72` (2026-09-07, 686/686 chain); R31 accepted `1747c1d` (2026-09-07, 751/751 run 36, two fresh APPROVE final reviews); `codex/foreman-kernel-resume-20260908` @ `947e6f1` (2026-09-08) holds the R31 Gate-3 preparation packet — `R31-PR-MATERIAL-20260908.md` prepared but **unsubmitted**, human merge open | PRESENT (verified) |
| 3 | Kernel deliverables exist for FK-P0 (§6 Wave 0: "Canon authority and enforcement registry") | FK-P0's code-level registry exists **only on unmerged branches**: `plugins/foreman-line/authority-registry/` (src/{cli,generate,index,registry,schemas,types,validate}.ts, schemas/, tests/ incl. `semantic-invariants.test.ts`, `corpus-sweep.test.ts`, `authority-enforcement-registry.yaml`) on `codex/fk-p0-canon-authority-enforcement-registry` and descendants. The live tree contains **no** FK kernel package — no `authority-registry/`, no MCP server, no state/lease package, no hook adapter, no Docker/launcher files. Live `plugins/foreman-line/` holds only pre-existing packages (approval, dispatch, projection, receipts, routing-policy, spec-linter, …) | ABSENT (live tree) |
| 4 | Historical Gate-1 commits `c4bf00f…`, `a9a48b5…`, `26fb2b5…` "have not been verified against the Windows clone" (§17) | All three verified present today: `c4bf00f6…` "docs(foreman-line): ratify Foreman Kernel charter" (2026-08-31), `a9a48b56…` "…triage Foreman Kernel plan review", `26fb2b56…` "…re-ratify Foreman Kernel plan" | PRESENT (verification discharged) |
| 5 | Recovered A1 source: commit `c654c047…` on `origin/temp/plugin-bump` (§17, INF-5) | Verified: `c654c0475e868c8cd1ff734fe7c30de43b7b3133` (2026-09-06, "Bumped foreman-line version for upgrade") contains `docs/goals/foreman-kernel/proposed-amendment-A1-decision-path-latency-budget.md`; reachable from `main`, `temp/plugin-bump`, and `origin/main` | PRESENT |
| 6 | A1 "live adoption and contradictory drafting text still need reconciliation" (§17); INF-5 requires FK-P0 to record reconciliation | Reconciliation completed on the FK branches (`amendment-A1.8-ratification-ledger.md`; per `CURRENT-RESUME.md`, "A1.8/A1.9 and INF adoption are ratified and separately integrated through R30"). The live tree has **no** A1 text and **no** ledger: the goal dir holds only `charter.md` + `ADR-001-…` (the consolidation commit `8b3733b` is the last commit to touch the goal dir; the A1 file it carried is gone from the live tip) | DRIFT (reconciled off-mainline; adoption pending the FK merge) |
| 7 | "Revised ADR source: `ADR-001-runtime-infrastructure-posture.md`, SHA-256 `09821b3930e6c8fbbd6ed6520dede1b5b4494118c1b5ebf772712bc40226763f`" (§17) | No in-repo copy matches: live file SHA-256 `ee5ea5d59b05d77d9f3349b7a4c0779e4ecc5228039cf13554ca1e7613dbf72d`; R31-branch copy SHA-256 `7d7f1ac7f5f543052b475737879d8fa278cdb788b61df257b63e4481ed40b5e7`. The recorded digest corresponds to the uploaded source artifact, absent from the clone | DRIFT |
| 8 | "Original charter snapshot: uploaded 2026-08-31, SHA-256 `a69b19d6…`" (§17) | No in-repo artifact carries this digest (chat-upload artifact, not committed) | ABSENT (unverifiable from clone) |
| 9 | "Suggested companion path: `…/FOREMAN-KERNEL-DEVELOPMENT-CHARTER.md`" (header) | Absent live; present in the goal dir on the fk-p0 branches (verified at `1747c1d`) | ABSENT (live) |
| 10 | "the current kernel charter/loop" exists to be read (§15.1 step 1) | No `loop-directive.md` in the live goal dir; the fk-p0 branches carry one with `## Current state` lines last advanced 2026-09-07/08 | ABSENT (live) |
| 11 | "The ambient `D:/Repos/agent-skills` checkout is dirty at `plugins/foreman-line/routing-policy/routing-policy.yaml`; it is user-owned" (§12) | `routing-policy.yaml` is **clean** today. Dirty routing-policy paths are `src/pi-openrouter.ts`, `schemas/pi-openrouter-routing.schema.json`, `tests/pi-openrouter.test.ts`, `tests/semantic-invariants.test.ts` (user-owned, untouched). Tree carries 1185 dirty entries overall | DRIFT |
| 12 | "The inspected upstream main at `476b8df6efe6c9974879957147449f61c34cd9a0` has `shadow_routes: {}`" (INF-7) | Verified: `git show 476b8df:plugins/foreman-line/routing-policy/routing-policy.yaml` line 169 is `shadow_routes: {}`; `476b8df` is "Merge pull request #21 …" | PRESENT |
| 13 | Charter status "Pending live-source adoption and review of the incorporated changes"; "Prepared: 2026-09-07" | Consolidation landed in the mainline 2026-09-14 (`8b3733b`, merged via PR #22 `c58154b`) — adoption happened, later than the stated preparation date; the fresh independent plan review of the incorporated changes (§15.2) has **no** record in the live tree | DRIFT |
| 14 | ADR tier-0 observations: "fifteen independent workspaces", "more than twenty registered worktrees" | Live `plugins/foreman-line/` has 25 top-level subdirectories; `git worktree list` enumerates 100+ registered worktrees (fk-p0/jev/rcm/hro/wgt families). ADR is tier-7 advisory; counts have aged | DRIFT |
| 15 | "Gate 1 … RE-CLEARED 2026-08-31"; standing Gate 2 grant active for FK-P0–FK-P21; Gate 3 not delegated (§10) | Gate-1 ratification commits verified (row 4). The branch `loop-directive.md` records the same "Ratified authority" set ("Standing Gate 2: active for FK-P0 through FK-P21"; "Gate 3: not delegated"). No later amendment in the repo revokes them | PRESENT |
| 16 | Coordinator identity: "the current owner in the authoritative goal loop directive" | Branch `CURRENT-RESUME.md` (2026-09-08): coordinator Codex thread `01a07c0b-90eb-7bf0-88f4-0ca912ef87fb` "observed idle, not transferred … Reconcile an owner-of-record handoff before successor dispatch." `goal-status-report-2026-09-26.md` §6 lists live-owner reconciliation as remaining work. This session operates under the owner's 2026-09-26 blanket authority; a recorded owner-of-record handoff is still an open item before FK-P1+ dispatch | DRIFT (owner-of-record unreconciled) |

## 2. A1 reconciliation record (INF-5, carried by FK-P0)

The recovered A1 text (row 5) "identifies D21, names FK-P1 and FK-P17, distinguishes
kernel decision latency from lifecycle-entry-to-hook-exit latency, and separately reports
cold start", while carrying contradictory drafting ("Ratified as written by Clint Morgan —
09/01/2026" alongside language saying it is not in force). Disposition, per INF-5:

1. **No latency contract is changed by this record.** The recovered anchors remain
   reconciliation anchors only: warm kernel decision p50 ≤ 5 ms / p95 ≤ 20 ms /
   p99 ≤ 50 ms; end-to-end mediated action p99 ≤ 150 ms; first call after startup
   separately reported, allowance ≤ 2000 ms; per-decision hard deadline 1000 ms mapped
   to the existing outage posture. Nothing in the live tree may implement them yet.
2. **No decision ID is assigned here.** The recovered text's "D21" is not ratified into
   this charter's D1–D20 list by any live-tree artifact. FK-P1 may adopt the live text
   only after the ledger on the FK branches (`amendment-A1.8-ratification-ledger.md`,
   where A1.8/A1.9 are recorded ratified and integrated through R30) reaches the live
   tree through the human Gate-3 merge, or through a narrowly scoped amendment.
3. **Contradiction resolved provisionally:** the ratification record
   ("Ratified as written by Clint Morgan — 09/01/2026", mirrored at the foot of
   ADR-001) is treated as the operative statement of the ADR review recommendations'
   ratification; the "not in force" drafting in the recovered A1 is treated as
   superseded-by-ratification, and is flagged for confirmation by the FK branch merge
   rather than silently rewritten.
4. **Open INF-5 work:** FK-P1 owns the adopted decision-path contract (including how
   cold-start accounting relates to the hard deadline and which observations enter each
   percentile); FK-P17 measures both spans, cold start, and deadline failure behavior on
   the D20 matrix; FK-P18 carries only coarse CI regression checks the adopted A1
   authorizes; FK-P21 records evidence.

## 3. Ownership and serialization reconciliation

- **Owner-of-record:** unreconciled (row 16). The FK branch canon requires a recorded
  handoff at a parcel boundary before successor dispatch; that handoff is a prerequisite
  for FK-P1+ waves (see `fk-p1-p21-dispatch-plan.md`).
- **Contested surfaces:** this slice edited only `docs/goals/foreman-kernel/`. Seams
  recorded, not edited: `routing-policy/`, `dispatch/`, `contracts/`, `templates/`
  remain owned by their active goals (`foreman-line-boundary-routing` owns routing
  authority + installability); FK-P3's routing/skill split and FK-P2's compiler inputs
  will need those surfaces and must negotiate ownership before dispatch.
- **FK-P0 code seam:** the accepted R31 registry package (`authority-registry/`) is
  Gate-3-pending on `codex/fk-p0-r31-source-adoption-20260907` @ `1747c1d`. It is not
  copied into the live tree here — Gate 3 is human-owned (charter §10, D9), and copying
  accepted-but-unmerged code across would manufacture merge satisfaction. Where this
  goal's docs-level registry (`fk-p0-canon-authority-enforcement-registry.md`) and the
  R31 package disagree after the merge, the R31 package and ratified canon win.
