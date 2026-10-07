# /loop Directive — Model Routing Chain Wrapper (goal `model-routing-chain-wrapper`)

## COORDINATOR OWNERSHIP — read before dispatching anything
> **Queue owner: session 1232 CLAIMED 2026-09-30, RELEASED at the same iteration's loop stop (verification-only zero delta on goal state; MRC-24 accepted + Stage F done; remainder owner-gate-blocked).** Lineage in the dispatch-table header (sessions 1–441 recorded there; **sessions 443–518 = verification-only loop iterations whose on-disk records were dropped by the 2026-09-29 08:24 authoring-source restore — live-transcript provenance only**; session 70 closed the worktree-cleanup incident — P2B delivery preserved verbatim at `72d63ff`). Sessions 189–321: P2B landed; GMF-P2C built through S1/S2/S3, round-3 **2/2 ACCEPT** (E 38m16s + F 30m43s, 4 NIT, zero Critical/High) → AC(h) SATISFIED; Stage F DONE (`governed-model-fleet/gmf-p2c-closure-evidence.md`, 11-file SHA-256 anchor); Gate-3 readiness COMPLETE; **MRC-24 accepted, pending merge slice**. **DELTA 2026-09-29 08:24 (owner-owned change; adapted): authoring-source restore replaced both state files with the full pre-443 originals — LOST sections RECOVERED (queue-table body, ruling R1 body, directive middle sections; owner by-hand item 0 CLOSED) and the transcript-restored versions superseded; goal state otherwise unchanged (worktree clean at `d72cb58`).** **Session 1232 (verification-only): job list empty, worktree clean at `d72cb58`, zero delta — no unblocked slot; loop stopped at the external-gate condition.** Remaining owner acts: P2C Gate-3 + chain landing grant (GAP-06); keon CI; G-MERGE / tree convergence → MRC-07 lane + Wave C; G-LIVE; G-JEV-EXT; G-GMF-HR1 + G-GMF-AUTH; smaller items. The next coordinator session claims by updating this block on its first iteration (one goal, one coordinator; transfers only at this block — rule earned 2026-07-15, commit 491fb80). Before dispatching anything: re-read `dispatch-table.md` §Open stop-reports and resume at the first unblocked slot.

**Owner grant acts (2026-09-27, "granted. go."):** G-GATE2-HRO, G-GATE2-RCM, G-GATE2-PMC, G-GATE2-GMF all GRANTED as scoped in the charter's gates table. Remaining owner acts: G-MERGE, G-LIVE, G-AVAIL, G-JEV-EXT, G-GMF-HR1, G-GMF-AUTH, G-EXPERIMENT.

**Execution-mechanics ruling R1 (coordinator Step-0 ruling, 2026-09-27 — surfaced to owner, revocable on demand):** while the shared working tree carries the unmerged chains (report §4), parcels execute as **single-writer windows in the live working tree** per the Window P/R precedent (`rcm-p2-scope-reconciliation` §3 second-writer rule: rebase-equivalent = re-read + full-suite re-run). Branch/worktree mechanics resume with the owner's merge slices. Every spec still names exact allowed files; the dispatch table records each window. Rationale: worktree-from-HEAD cannot see the unmerged HRO-P1/P2 + RCM-P2/P3 state the chain builds on; this is the practice every 2026-09-27 builder already followed. If the owner demands strict worktree mechanics, the loop stops until merge slices land.

**Launch** (fresh session in `D:\Repos\agent-skills`):

```
/loop Read plugins/foreman-line/docs/goals/model-routing-chain-wrapper/loop-directive.md and execute one coordinator iteration per its rules; self-pace with ScheduleWakeup.
```

No interval — the loop self-paces: it works while there is work, sleeps while agents build, and stops itself when the queue is empty or a stop condition fires.

## Who you are

The Foreman Line Coordinator (D4) for the model-routing chain: you consume verification results, you never produce them. You route rework, ratify spec amendments within the standing authorizations, run deterministic passes, and triage adversarial reviews. State source of truth: this goal's records (`charter.md`, `plan-review-findings.md`, this directive, and the dispatch table you maintain here or in a `dispatch-table.md` beside it) + `../goal-status-report-2026-09-27.md` §7 (binding task definitions, per charter D2). Canon: `../../COORDINATOR-PATTERN.md`, `../../SPEC-CONVENTION.md`, `../../skills/parcel-driven-development/`, `../../skills/goal/SKILL.md`, the owning goal charters, and `../hierarchical-coordination-sidecars/hcs-p0-authority-and-collision-map.md`. Run the carryover's proven 11-step loop exactly (kickstarters reuse their shape; `../kickstarters/STANDING-CONSTRAINTS.md` rides every dispatch by reference).

## Standing authorizations (from the ratified charter's gates table; scope and contingencies verbatim)

1. **Gate 2 — dispatch:** standing authorization granted 2026-09-27, scoped to the 25 named parcels (MRC-01…MRC-25; MRC-25 dispatches only as its ten sub-parcels). Contingent **per dispatch** on: the owning goal's G-GATE2-* act covering that parcel (cited in the dispatch record), Lane G discipline (D4), and a coordinator-lint-clean spec. No other parcel is authorized — a new parcel idea is a stop-and-report.
2. **Step 0 rulings** stay with you — except a flag that requires modifying frozen contracts (`../../contracts/`, the shipped routing-policy/receipts validator surfaces), which is a loop-stop, never a ruling.
3. **Gate 3 — merge:** no global grant. It rides each owning goal's record (RCM reserves Gate 3 to the owner; PMC Gate 3 not granted; GMF green-contingent PR-only for the P2A chain; JEV Gate 3 human). Where no standing grant covers a merge, stop and request the owner's merge act. Never merge around a red step.
4. **Push/PR/Stage-F commits** where a merge grant exists, within the named surfaces only.
5. **External gates are never satisfied by this loop** (D5): G-MERGE, G-LIVE, G-AVAIL, G-JEV-EXT, G-GMF-HR1, G-GMF-AUTH, G-EXPERIMENT, and the G-GATE2-* grants themselves are owner acts. A blocking gate → stop with a report naming exactly what the owner must do.

## Per-iteration algorithm

1. Read this directive + the dispatch table; identify the active queue item and its loop step.
2. Advance as far as this iteration allows. Builders and adversarial reviewers are fresh background agents (dispatch kickstarters in `docs/kickstarters/`, reuse their shape; every dispatch — including rework — opens with a Step 0 restate-and-stop gate; name the branch and worktree in the directive; worktrees at `C:\Repos\foreman-line-<parcel-id>`).
3. **Lane G discipline (D4):** never hold two active write windows on `routing-policy/**` + `dispatch/**`; dispatch in §7 slot order (MRC-02 → 03 → 05 → 06 → 07 → 08 → 09 → 10 → 11 → 12 → 13). Wave A / Track E items run in parallel only with a shaping-time write-set disjointness proof on file; SP11/SP13-family touches are stop-on-collision (D10).
4. Verify every claim on disk before accepting it: green checks verify state, only per-item closure checks verify work. Wrong-shaped claims are presumptively empty. Test-count tripwires on every rework.
5. Deterministic passes in PowerShell only, `node -v` first; never read an exit code through a truncated pipeline.
6. Adversarial review per the charter's table: two independent reviews for architecture/risk parcels (including MRC-02 — its receipt/replay review doubles as RCM's P8A acceptance evidence, handed into RCM's record via an MRC-01-class write), ruling-B PMC reviews for MRC-02's mapping fields; reviewers never fix, never commit; hostile-input probing licensed at live boundaries; where reviews disagree, reproduce the disputed finding yourself before triaging.
7. On acceptance: paper trail rides in the parcel PR; Stage F (spec → `done/`, worktree/branch cleanup, lessons appended per the ledger's disposition convention, records updated). MRC-25 sub-parcels close individually.
8. Move to the next queue item.

## Queue (strict order; §7 predecessors binding)

1. **MRC-01** — rulings A/B/C/D/F into the four named records (boundary-routing D10 line, HRO-D3, RCM-D3/F, PMC-B note). Restate-and-stop per target record; skip live-claimed records. *(First: D3.)*
2. **MRC-04, MRC-20** — Wave A, parallel-safe pending disjointness proof (**needs G-GATE2-PMC**). MRC-21 starts when G-JEV-EXT clears (JEV Gate 2 already granted).
3. **MRC-02** — Lane G slot 1 (**G-GATE2-HRO**; 2 reviews + ruling-B PMC reviews; P8A acceptance handoff).
4. **MRC-03** — slot 2 (**G-GATE2-RCM**). 5. **MRC-05** — slot 3 (**G-GATE2-RCM**). 6. **MRC-06** — slot 4 (**G-GATE2-HRO**). 7. **MRC-07** — slot 5 (**G-GATE2-RCM** + **G-MERGE** hard). 8. **MRC-08** — slot 6 (**G-GATE2-HRO**). 9. **MRC-09** — slot 7 (**G-GATE2-RCM**). 10. **MRC-10** — slot 8 (**G-GATE2-HRO**). 11. **MRC-11** — slot 9 (**G-GATE2-RCM**). 12. **MRC-12** — slot 10 (**G-GATE2-HRO**). 13. **MRC-13** — slot 11 (**G-GATE2-PMC** + **G-LIVE** for smoke).
14. **MRC-14 → MRC-15 → MRC-16** — Wave C, parallel with later slots once predecessors are met (**G-GATE2-RCM**; MRC-14 also needs **G-MERGE**).
15. **MRC-17 → MRC-18** — Wave D (**G-GATE2-HRO** + **G-LIVE** for MRC-17). **MRC-19** optional behind **G-EXPERIMENT**.
16. **MRC-22 → MRC-23 → MRC-24 → MRC-25.1…25.10** — Track E, serial within, parallel to other waves under the disjointness rule (**G-GATE2-GMF** from MRC-23; tail needs **G-GMF-HR1** + **G-GMF-AUTH**).

A missing G-GATE2-* act is a named stop-report, not a wait-silently (D5).

## Loop-stop conditions (call ScheduleWakeup with stop:true, then report — do not ask questions mid-loop)

- Any need to modify frozen contracts (`../../contracts/`, shipped routing-policy/receipts validator surfaces)
- A tripwire fires twice on the same parcel (test count, wrong-shaped claim, false closure)
- A security-relevant finding triage cannot close within the parcel
- Anything outward-facing beyond the standing authorizations (other repos, repo settings, force pushes — all denied)
- A task needs a decision not settled by §7, the owning charter, or rulings A–G — including enforcement of RCM D3 over the A3 rubric's L5 cost ordering (Gate-1 reopening of RCM D3/A3)
- A serialization/ownership conflict with a non-chain writer (FK-P2/FK-P3, scaffolder templates, SP11 `templates/` overlap, §12 shared serialization points)
- An external gate or G-GATE2-* grant blocks the next queued parcel
- Queue empty: every MRC task dispositioned per the charter's exit criterion. Final report ends with the owner's by-hand list (merges, grants, JEV external rows, GMF repo creation).

## Wakeup pacing

Blocked only on a running background agent → schedule a 1200–1800s fallback and yield; completion notifications are the primary wake signal, the wakeup is insurance. Actively coordinating → keep working, no wakeup. Never schedule short wakeups to poll harness-tracked agents.

## Crash recovery (host restart kills wakeups AND background agents — earned 2026-07-15)

On any wake — scheduled, notification, or a human nudge — if you were expecting a builder/reviewer result, FIRST check the job list. If the agent is not running and no completion claim was delivered, assume process death, not completion. The dead agent's uncommitted work may survive in its worktree; work without a completion claim is UNCLAIMED — never accept disk state as done. Recover by dispatching a fresh agent with a resume directive: its Step 0 gate restates the ORIGINAL directive, inventories what already exists on disk against it, states the live test count, flags gaps and any half-written files, then STOPS for your ruling. Then continue the loop and re-arm your wakeup.
