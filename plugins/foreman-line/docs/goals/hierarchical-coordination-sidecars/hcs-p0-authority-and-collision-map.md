# HCS-P0 — Authority and collision map — 2026-09-26

**Goal:** `hierarchical-coordination-sidecars`
**Record:** HCS-P0 reconnaissance map (AC1–AC7) — the single seam reference for HCS-P1–HCS-P7
**Date:** 2026-09-26
**Authority receipt line:** coordinator decision 2026-09-26 under owner blanket authority
**Prepared by:** `HcsP0`, delegated builder slice of the coordinating session (task/session id `HcsP0`)
**Rework 2026-09-26:** `HcsP0Rework` (task/session id `HcsP0Rework`) — post-review rework
against `hcs-p0-review-a-findings.md` (F1–F11) and `hcs-p0-review-b-findings.md` (B-01–B-09);
dispositions in [`hcs-p0-verification.md`](hcs-p0-verification.md) §9, locator corrections
in §9 of this map
**Companion record:** [`hcs-p0-verification.md`](hcs-p0-verification.md) (AC8 — commands, raw
output, allowed-path audit, AC mapping, scheduled reviews)
**Binding contract:** [HCS-P0 shaped spec](../../specs/active/HCS-P0-authority-and-collision-reconnaissance.md)

> **Receipt character.** The authority receipt line above is a coordinator decision made
> under the owner's 2026-09-26 blanket authority. It is not a human approval and does not
> impersonate the developer. Gate 3 (merge, release, spend) remains human-owned and is not
> delegated (authority basis: charter D7; FK registry §1). This record is read-only
> reconnaissance: it edits no FK file, transfers no ownership, merges nothing, and decides
> none of the open contract questions.

**Purpose.** Map, with evidence, the authority and collision landscape the
hierarchical-coordination seam lands in: ownership (AC1), kernel contracts (AC2), state
authority (AC3), queue mechanics (AC4), serialization points (AC5), the exact landing
target for amendment A3 (AC6), and the evidence discipline (AC7). Consumers: HCS-P1
(contracts, against the FK-P1 seam and the §3.2 lease disposition), HCS-P2/P3 (state
authority and serialization maps), HCS-P6 (collision rows), HCS-P7 (landing-target table).
No consumer may treat this map as an FK authority change or as a merge receipt.

**Label vocabulary (AC7).** Labels are carried where shown; an unlabeled table row is a
measured fact **[M]** whose source path + locator is cited in the row itself (reworked
2026-09-26 per reviews F9/B-06 — the prior "every claim carries exactly one label" wording
overreached). The vocabulary:
**[M]** measured fact — repeatable command with raw output in
[`hcs-p0-verification.md`](hcs-p0-verification.md) (command IDs `C1`–`C26`);
**[D]** dated observation — true at the stated date, not asserted as current state;
**[I]** inference — derived conclusion, never presented as observed.
**Verdict vocabulary** (per the shaped spec's Evidence Procedure): `live` /
`Gate-3-pending` / `unstarted` / `blocked` / `escalated-unresolved` / `not-verified`.
Observation time for every [M] row: 2026-09-26, shared registration tree
`D:/Repos/agent-skills`, HEAD `305ecbf01a8b458a81a3ba5e04b4919e63281f94` (C1) [M].

## 0. Source pin table (read-only acquisition)

All sources were pinned before reading (digest or commit first, then read). Digests: C2/C3/C18.
No credential-bearing file was read; forbidden reads (credential stores, auth files, host
`settings.json`, `models-store.json`, secret-bearing URLs) were not touched.

| # | Source (path) | Pin (SHA-256 / commit) | Locator convention | Status |
|---|---|---|---|---|
| S1 | `plugins/foreman-line/docs/goals/hierarchical-coordination-sidecars/source-proposed-amendment-A3.md` | `a5d9196c994d3215cd1966a234764174c1421f888d3cf68b901d31f07d221695` (C2) — identical to the digest pinned in `charter.md` | section headings A3.1–A3.8 | live (proposal, unratified) |
| S2 | `plugins/foreman-line/docs/goals/foreman-kernel/charter.md` (FK charter) | `94d974b80dbc61066e0c135a710e5fe695654df298fd5e7b63696706ca3b6cb7` (C3), 807 newline-terminated lines (C4a/C4b) | `path:line` from C5–C11 | live (carries uncommitted 2026-09-26 coordinating-wave audit edits, `git status` line ` M` — S3 `:20–21` describes them as "one uncommitted 2026-09-26 audit edit (INF-1 paragraph, HAWF record deletion)"; review F8 found the `git diff` also shows a `**Status:**` header rewrite referencing the reconciliation record, so the delta is two edit sites — both recorded here, none by HCS) |
| S3 | `plugins/foreman-line/docs/goals/foreman-kernel/fk-reconciliation-2026-09-26.md` | `bd7485663df7808c759d98744aca62e6e9b131ed9ff1d8c651c9478516b15b75` (C18) | §1 rows 1–16 (lines 28–43), §2, §3 | live |
| S4 | `plugins/foreman-line/docs/goals/foreman-kernel/fk-p0-canon-authority-enforcement-registry.md` | `d628f98edc57edd4291b7b32bcf2ae99847266608d4155f3cce421d0a50639a4` (C18) | §1 (18), §2 (36), §3 (57), §4b (102), §4c (127), §7 (187), §8 (201), §9 (224) | live |
| S5 | `plugins/foreman-line/docs/goals/foreman-kernel/fk-p1-p21-dispatch-plan.md` | `13d8a20aa81153907cd529d9676b6483a531c0eb6a2d4fae15cb6a5b74f2ac92` (C18) | parcel rows, pre-dispatch prerequisites, serialization recap | live |
| S6 | `plugins/foreman-line/docs/goals/hierarchical-coordination-sidecars/charter.md` | `5748c70d0e2a31e3284f8f59e0e87c6dfb5236b07925269ac49189f53e15653c` (C18) | D1–D7 table; exit criterion; gates | live (PROPOSED header text, Gate 1 ratification recorded separately) |
| S7 | `plugins/foreman-line/docs/goals/hierarchical-coordination-sidecars/hcs-stage-zero-2026-09-26.md` | `92f6162957585b0c5193ccb78539c616184534d30e9bed551b741758eb9e6e7b` (C18) | §1–§5; §3.1 safe sequence; §3.2 lease disposition; §3.3 stale rows 1–7; §3.4 open questions | live (given input; not re-litigated) |
| S8 | `plugins/foreman-line/docs/goals/hierarchical-coordination-sidecars/gate-1-ratification-2026-09-26.md` | `4e82276fa362fc4f0b8512530f18540903b5750c8840788507e890d00bde65f4` (C18) | HG-1, bounds, gate table | live (coordinator decision receipt) |
| S9 | `plugins/foreman-line/docs/goals/hierarchical-coordination-sidecars/loop-directive.md` | `a80f827bc7fb6365573536a2cd9d4853d00fd0108231876f7ac16e6077510c40` (C18, pre-update; **pre-update bytes unrecoverable in the shared tree** — review F7) | ownership block (3–12), State (14–20), intake queue (41–53), current authority (55–66), stop conditions (68–72) — **post-update numbering** (delivered `21ea644d…`, re-measured per review B-05/F7; the pre-update numbering 36–50/52–63/65–67 is superseded) | live |
| S10 | `plugins/foreman-line/docs/COORDINATOR-PATTERN.md` | `46e5438615e1a05bfb5b07abd177b26244548a7415e02ad7f1bb927ec95bf326` (C18) | lifecycle (11–19), dispatch table (~60–70), long-running loop (71–77), verification spine (79–81) | live (ratified 2026-07-15 pattern) |
| S11 | `plugins/foreman-line/docs/SPEC-CONVENTION.md` | `7ac315005cde6ad6def848b83de1d1b644e321c5d9f6434bc925deb6daba8703` (C18) | §2 folder structure, §4.8 Allowed Files authority, §8 dispatch model | live (v0.1 draft label; operative for this wave) |
| S12 | `plugins/foreman-line/docs/goals/goal-status-report-2026-09-26.md` | `ed17361c1e6b96506f832d27d4c3b01ff0499ea43b4fd3da60e2ad49a93b50fd` (C18) | §1 rows, §6.1 | live |
| S13 | `plugins/foreman-line/docs/goals/foreman-ops-console/charter.md` | `fc24bae4a80c23259567e1f54d7e8bc81dc190c859f65b365f44672f70ec5712` (C23, rework pass) | D1–D8 table (54–61); canon list (90–98) | live |
| S14 | `plugins/foreman-line/docs/goals/plugin-packaging-and-scaffolder/charter.md` | `81d854189c2be9c817394862d1664d7f1d33bbb165a037332eff1ec2a2c89b6f` (C23, rework pass) | package tree (94–102); Wave 2 P3 (264–268) | live |
| S15 | `plugins/foreman-line/docs/goals/foreman-line-boundary-routing/charter.md` | `b02460686c89453cb4ca812127384d9723db6c67935f5442340dd9ea416aa567` (C23, rework pass) | locked decisions D1–D10 (20–29); work items (33–45); Pi routing (47–70) | live |
| S16 | `plugins/foreman-line/docs/goals/pi-model-configuration/rcm-sequencing-decision-2026-09-26.md` | `e792c87b913f6fc075d2cbb8aea3afcc555fa8b2b769c225919ff86cc327575d` (C23, rework pass) | §1 paths (16–36), §2 binding order (38–64), §3 release (66–90), §4 placement (92–107) | live (BINDING serialization order, 2026-09-26) |
| S17 | `plugins/foreman-line/docs/goals/routing-currency-and-merit/charter.md` | `be66d6dd2db9f73c389e9c456b74271d1d69cde635c7ec5df65abefa42aa9948` (C23, rework pass) | relationship section (40–63) | live |
| S18 | `plugins/foreman-line/docs/goals/hybrid-routing-optimization/hro-p0-integration-contract.md` | `042925645bfec8ab4b57bc26da6b9c50ad290805db9c293f9cc4333af9a3dba3` (C23, rework pass) | §1.5 table (61–69); §2 overlap table (93–104) | live |

Acquisition: `sha256sum` over working-tree bytes, then file reads (C18 raw output; the
rework-pass pins S13–S18 were likewise digest-pinned before reading — C23 raw output). The FK
registry seam rule (S4 §8) applies at merge time: after the human Gate-3 merge the merged
`authority-registry/` package wins on divergence; today no such package exists in the live
tree (C21: `plugins/foreman-line/` contains `role-authority`, no `authority-registry/`) [M].

## 1. AC1 — Ownership map

Every ownership claim relevant to HCS, with source and verdict. Unresolved ownership is
recorded `escalated-unresolved` or `blocked`, never assumed closed.

| # | Ownership claim | Evidence (path:locator) | Verdict | HCS consequence |
|---|---|---|---|---|
| O1 | FK owner-of-record | `fk-reconciliation-2026-09-26.md:43` (§1 row 16): branch coordinator Codex thread `01a07c0b-…` "observed idle, not transferred … Reconcile an owner-of-record handoff before successor dispatch"; `goal-status-report-2026-09-26.md:12,66` list "live-owner reconciliation" as remaining FK work [M] | `escalated-unresolved` | A recorded handoff is a precondition of the A3 safe sequence (Stage Zero §3.1(2a)); HCS requests no transfer (Stage Zero §5) |
| O2 | FK branch/worktree family — active loci | `fk-reconciliation-2026-09-26.md:28` (row 1): `codex/foreman-kernel-stage0-20260830` @ `d0e87ce` exists but is **not** the active locus since 2026-09-07; later work lives on `codex/fk-p0-*`, `codex/foreman-kernel-unattended-20260907`, `codex/foreman-kernel-resume-20260908`. Re-measured (C14/C15): 8 `codex/foreman-kernel*`/`codex/fk-p0*` branches, 34 matching worktrees, incl. `codex/fk-p0-r31-source-adoption-20260907` @ `1747c1d`, `codex/foreman-kernel-resume-20260908` @ `947e6f1`, and `handoff/foreman-kernel-live-20260907` @ `fe31042` [M] | `live` (family exists; active-locus set as stated) | HCS-P0 writes none of them (Stage Zero §3.1(3)); the stage0 worktree is not a landing locus (§6 rows below) |
| O3 | FK-P0 code registry (`authority-registry/`) | `fk-reconciliation-2026-09-26.md:30` (row 3): exists **only on unmerged branches**; live tree has no kernel package. `fk-p0-…-registry.md:201–223` (§8): R31 accepted `1747c1d` (751/751), PR material `947e6f1` prepared **unsubmitted**; merged package wins after the human Gate-3 merge. Re-measured: no `authority-registry/` live (C21) [M] | `Gate-3-pending` | Seam rows below must not assume the package is merged; this map cites the docs registry (S4), not the unmerged code |
| O4 | HCS goal claim of 2026-09-26 | `loop-directive.md:5–12` ownership block "Queue owner: CLAIMED 2026-09-26 … One goal has one root coordinator (charter D2); root ownership is unsplit"; `hcs-stage-zero-2026-09-26.md` §1 claim record (incl. recorded execution-locus deviation, GD-1) [M] | `live` | One root coordinator, unsplit (charter D2); no second live owner named — claim stands |
| O5 | `routing-policy/` | `fk-reconciliation-2026-09-26.md:79–83` (§3 bullet; quoted seam sentence at `:80–82`, corrected from `:66–68` per review F4/B-04): "Seams recorded, not edited: `routing-policy/`, `dispatch/`, `contracts/`, `templates/` remain owned by their active goals (`foreman-line-boundary-routing` owns routing authority + installability)"; `fk-p1-p21-dispatch-plan.md` FK-P3 row (`:30`): contested with `foreman-line-boundary-routing` [M] | `live` (owned by sibling goal `foreman-line-boundary-routing`) | HCS observes and records only; never co-edits (spec Constraints; FK registry §9 GD-2 precedent); the live one-writer windows on this surface are mapped at SP8 |
| O6 | `dispatch/` | `fk-p1-p21-dispatch-plan.md` FK-P3 row (`:30`: "recorder adapters in **`dispatch/`** … **contested** with `foreman-line-boundary-routing`"); `fk-p0-…-registry.md:72` (§3 legacy routing/skill recorders row: "FK-P3 (seam: `dispatch/`, `routing-policy/` contested)" — corrected from `:73` per review F3/B-04); `foreman-ops-console/charter.md:96` (S13) treats shipped `dispatch/` as read-only input [M] | `escalated-unresolved` (contested seam; FK-P3 dispatch must negotiate ownership first) | Any HCS consumer touching `dispatch/` is out of scope for HCS-P0–P7 until the FK-P3 negotiation resolves it |
| O7 | `contracts/` | `foreman-ops-console/charter.md:92` (S13): "Frozen W0 contracts (`plugins/foreman-line/contracts/`) — modification is a loop-stop"; `foreman-ops-console/charter.md:55` (D2, S13): the console writes nothing to `contracts/`. **Named candidate (rework 2026-09-26, review B-01):** the C17b raw output printed in the verification record contains owner-claim rows naming `governed-model-fleet` (external, Keon initiative) as owner of the receipt/envelope/settlement contract families — `routing-currency-and-merit/charter.md:56` (S17): "`governed-model-fleet` owns receipt, envelope, and settlement contracts (P0/P1 landed)"; `hro-p0-integration-contract.md:68,104` (S18): "**Settlement — owner: EXTERNAL (governed model fleet, Keon initiative)**" / "Cross-goal external owner: **governed-model-fleet** (Keon repos) owns receipt/envelope/settlement contracts". Those are exactly the families the swept package carries (`contracts/src/envelope.ts`, `contracts/src/stages/a-intake.ts` … `f-closure.ts`, C26). **Reconciliation:** no located record states whether that external claim covers the local `plugins/foreman-line/contracts/` package, and `routing-currency-and-merit/charter.md:60–63` (S17) records the `governed-model-fleet` goal record itself was deleted from `docs/goals/` as external — so the coverage question is unanswerable from `docs/goals` prose alone [I]; the prior negative "no owner-of-record named for `contracts/`" is **withdrawn** as an over-claim (a bounded grep cannot establish "no live record") [I] | `escalated-unresolved` (candidate owner-of-record `governed-model-fleet`, external — coverage of the local package unestablished; surface frozen) | HCS writes nothing here; a required write would be a stop-and-escalate event (spec Security Gate) |
| O8 | `templates/` | `plugin-packaging-and-scaffolder/charter.md:98` ("`templates/` # de-dogfooded canon the scaffolder copies"), `:266` (P3 — de-dogfood canon into `templates/`); overlapping narrow claim `foreman-line-boundary-routing/charter.md:67` (`templates/pi-openrouter-routing.json`, installability) [M] | `escalated-unresolved` (partial overlap between scaffolder canon and boundary-routing installability template) | Observe only; HCS-P0 names the overlap so HCS-P2's disjointness proofs can enumerate it |
| O9 | `foreman-kernel/` (FK goal dir and FK canon) | FK charter **D1** (S2 `charter.md:101`: packaging/scaffolder owns distribution/canon scaffolding, FK owns runtime contracts — the row the map previously mislabeled "D2", review F11; D2 is at `:102` and is the Git-canon/SQLite authority split) + O1 unreconciled owner-of-record; HCS's own charter: "This goal must reconcile that live state before editing any Foreman Kernel charter, branch, worktree, or owned serialization point" (S6, Provenance and authority) [M] | `escalated-unresolved` (FK owner-of-record unreconciled) | All FK paths are forbidden writes for HCS-P0–P6 (Stage Zero §3.1(3)); A3 lands only through the §6 safe sequence |

## 2. AC2 — Kernel-contract map

Every FK contract HCS builds on, its FK owner parcel, and status. Status vocabulary as
above; `Gate-3-pending` = accepted but unmerged; `unstarted` = contracted in the FK charter
graph, not begun.

| # | FK contract / seam | FK owner parcel | Status | Evidence |
|---|---|---|---|---|
| K1 | Constraint taxonomy — 10 classes A–J (path/scope … evidence honesty) with predicates, refusal codes, enforcement destinations, retirement standard | FK-P0 (docs registry; code registry = R31) | `live` (docs) / code `Gate-3-pending` | `fk-p0-…-registry.md:36–55` (§2, class rows at 46–55); §7 exit row "Satisfied"; §8 seam |
| K2 | Operation authority matrix — 14 operation rows (read-only MCP, control catalog, `authorizeAction`, hooks, SQLite ledger writes, Git canon writes, human-gate satisfaction, receipts, external systems, projections, recorders, container fs, backup/restore) | FK-P0 | `live` (docs) / code `Gate-3-pending` | `fk-p0-…-registry.md:57–74` (§3; key rows 66–68, 71) |
| K3 | Locked decisions D1–D20 | FK charter §4 (FK-P0 reconciled them) | `live` | S2 `charter.md:88` heading; rows `charter.md:101–120` (C6 raw: exactly D1–D20, no row after D20); inventory `fk-p0-…-registry.md:102–125` (§4b) |
| K4 | Infrastructure requirements INF-1–INF-8 | FK charter §14 (carriers FK-P1–FK-P21) | `live` | S2 `charter.md:425` (§14), INF-1 `:435` … INF-8 `:596–617`; inventory `fk-p0-…-registry.md:127–138` (§4c) |
| K5 | FK-P1 — lifecycle/admission/decision contracts: versioned schemas, refusal codes, digests, assurance levels, golden vectors (D17); A1 latency adoption (INF-5) | FK-P1 | `unstarted` (Stage A shaped only) | `fk-p1-p21-dispatch-plan.md` FK-P1 row; `fk-p0-…-registry.md:215` (§8: "FK-P1 Stage A shaped but unimplemented" — corrected from `:208` per review F3/B-04) |
| K6 | FK-P2 — spec-body compiler: exact non-glob Allowed Files, frozen/forbidden surfaces, ambiguity/traversal/symlink rejection (class A, D10) | FK-P2 | `unstarted` | `fk-p1-p21-dispatch-plan.md` FK-P2 row; `fk-p0-…-registry.md:46` (class A predicate "FK-P2 spec-body compiler output") |
| K7 | FK-P9 — SQLite storage + migration ABI (schema, WAL/busy policy, backup/checkpoint, exports) | FK-P9 | `unstarted` | `fk-p1-p21-dispatch-plan.md` FK-P9 row ("**State migrations / storage package exports** (serialization owner)") |
| K8 | FK-P10 — lease + transition engine: trusted lease time, CAS revisions, principal/operation/idempotency binding, transactional event/state updates, legal transition invariants | FK-P10 | `unstarted` | `fk-p1-p21-dispatch-plan.md` FK-P10 row; `fk-p0-…-registry.md:66` (SQLite ledger writes: "lease/transition engine only") |
| K9 | FK-P11 — import + projection engine: field-level authority reconciliation, deterministic Markdown projection, cutover epoch, divergence-stop | FK-P11 | `unstarted` | `fk-p1-p21-dispatch-plan.md` FK-P11 row; `fk-p0-…-registry.md:68,71` |
| K10 | FK-P12 — `authorizeAction` policy engine over admission, repo/worktree identity, compiled scopes, roles, leases/revisions, gate evidence (class D policy digest binding; class B identity) | FK-P12 | `unstarted` | `fk-p1-p21-dispatch-plan.md` FK-P12 row; `fk-p0-…-registry.md:47,49` |
| K11 | FK-P13 — admission-protected control catalog (get/claim/renew/release/transition/evidence/project) | FK-P13 | `unstarted` | `fk-p1-p21-dispatch-plan.md` FK-P13 row; `fk-p0-…-registry.md:63` (control MCP row) |
| K12 | FK-P15 — stateful restart + admission proof (split-brain refusal, stale CAS, idempotency conflict, migration crash/recovery) | FK-P15 | `unstarted` | `fk-p1-p21-dispatch-plan.md` FK-P15 row; INF-8 carrier `fk-p0-…-registry.md:138` |
| K13 | FK-P18 — CI scope + state-evidence backstops (negative controls must fail CI before enforcement promotes) | FK-P18 | `unstarted` | `fk-p1-p21-dispatch-plan.md` FK-P18 row; D13 destination `fk-p0-…-registry.md:118` (§4b D13 row — corrected from `:113`, which is D8's row, per review F3/B-04) |
| K14 | FK-P21 — exit evidence manifest (INF-4/6/7/8 assembly; corpus inventory; mutation controls) | FK-P21 | `unstarted` | `fk-p1-p21-dispatch-plan.md` FK-P21 row; `fk-p0-…-registry.md:164–185` (§6 manifest obligations) |
| K15 | R31 `authority-registry/` compiled package (would supersede docs registry on divergence after merge) | FK-P0 code seam | `Gate-3-pending` | `fk-p0-…-registry.md:201–223` (§8); absence live (C21); reconciliation row 3 |

**Stage Zero §4 seam mapping** (given input, S7 §4) is consumed verbatim: HCS-P1 versions
independently in HCS canon and converges on the FK-P1 seam; HCS-P2 binds to the FK-P10 ABI
or carries a named refusal-semantics gap (Stage Zero §3.2); HCS-P3 reads frozen inputs only
via FK-P9/FK-P10 state and FK-P11 projections; HCS-P4 sees durable facts only through
admitted kernel contracts; HCS-P5 resolves against the canonical evidence index (D2,
SQLite); HCS-P6 reuses FK-P10/FK-P15/FK-P18 refusal and proof patterns; HCS-P7 lands A3 per
§6 of this map. [D: mapping dated 2026-09-26, Stage Zero §4.]

## 3. AC3 — State-authority map

Git canon versus SQLite operational state (FK D2), lease/transition ownership
(FK-P9/FK-P10), evidence-derived human-gate state (FK D9), projection authority (FK-P11),
each with its HCS consequence: what the scheduler may freeze as input, what a roll-up may
reference, what fails closed.

| # | State authority | Rule (source) | HCS consequence — scheduler frozen input | HCS consequence — roll-up reference | Fail-closed behavior |
|---|---|---|---|---|---|
| SA1 | Git canon | D2 (`charter.md:102`): Git is authoritative for ratified charters, specs, policies, reviews, human-gate artifacts, committed proof; "Git wins ratification and human-gate facts". `fk-p0-…-registry.md:67`: kernel tools never write canon | The scheduler may freeze **revision-pinned Git reads** (queue contents + revision digests per A3 D24 frozen inputs) and nothing else from canon; it cannot write canon | A roll-up may reference canon artifacts by digest-bound identity | Outside-Git mutation is refused (class A `PATH_OUTSIDE_ALLOWED_FILES` / `FROZEN_SURFACE_MUTATION`, `fk-p0-…-registry.md:46`); FK charter §11 stop item "a parcel needs a file outside its exact Allowed Files" (`charter.md:357`) |
| SA2 | SQLite operational state | D2 (`charter.md:102`): SQLite authoritative only for revision, lease, pending transition, wakeup/handoff, evidence index, projection cursor. D14 (`charter.md:114`): WAL, versioned migrations, append-only events | The D24 frozen input "lease and admission state as read at a named revision" has **no live provider today**: FK-P9/FK-P10 are `unstarted` and the live tree has no tracked SQLite ledger (C16: `git ls-files \| grep -iE '\.(sqlite\|db)$'` → no matches) [M] | A roll-up's evidence-index resolution requires the FK-P9/FK-P10/FK-P11 seam (Stage Zero §4 HCS-P5 row) — unavailable until those land | Fail closed or carry a **named refusal-semantics gap** (Stage Zero §3.2 disposition; GD-3); never shim a private state store (INF-8: "add no competing recovery authority primitive", `charter.md:603`) |
| SA3 | Lease/transition ownership | `fk-p0-…-registry.md:66`: SQLite ledger writes permitted to the **lease/transition engine only** (D14: single-writer leases, CAS revisions, idempotency bound to input digests, divergence stops never overwrites). Class E (`:50`): `OWNER_LEASE_MISMATCH`, `STATE_REVISION_STALE`, `GATE_NOT_SATISFIED` | The scheduler may freeze lease/admission state **as read at a named revision**; it may not hold or mutate leases | Roll-ups reference lease-bound edge identities (parent/child, domain digest) — read-only | Stale CAS / double lease → refuse (`STATE_REVISION_STALE` / `OWNER_LEASE_MISMATCH`); divergence → stop, escalate |
| SA4 | Human-gate state | D9 (`charter.md:109`): Gate 1 nondelegable; Gate 3 human-owned; human-gate satisfaction is derived from canonical digest-bound Git artifacts and cannot be written as ordinary operational state; `REQUIRE_HUMAN` yields stop reports, not loops. `fk-p0-…-registry.md:68` | The scheduler may freeze gate state only as an **evidence-derived read**; it can never author or advance a gate | Roll-ups may reference named-gate re-derivation (A3 D25) via digest-bound artifacts only | `GATE_NOT_SATISFIED` refusal / `REQUIRE_HUMAN` stop report; any write of gate state through operational state is refused (registry §3 human-gate row) |
| SA5 | Projection authority | `fk-p0-…-registry.md:71`: Markdown projection writes belong to the projection engine (D14) — deterministic views, divergence-stop on the field-level authority matrix. FK-P11 row (S5): one-time digest/commit-bound import, cutover epoch | The scheduler may freeze projection cursors (D2: projection cursor is SQLite authority) as inputs | Roll-ups compare envelope digests/counts against projections; structural resolution "never replaces the evidence to which it refers" (A3 §A3.4 text) | Field-level authority divergence → stop (registry §3 projection row); HCS components write no projection |

**Boundary statement.** No row above grants HCS any state-write authority. Every HCS write
of operational state must pass through the FK-P10 lease/transition seam after it lands
(K8) or be refused (SA2/SA3).

## 4. AC4 — Queue-mechanics map (current vs A3 D24 target)

Side by side; **no target property is present today** — every "target" cell describes a
future property of an unimplemented scheduler. A3 is cited as design baseline only
(proposal, not ratified FK authority).

| Facet | Current coordinator queue mechanics | A3 D24 target (proposal) | Gap |
|---|---|---|---|
| Queue advancement | Goal pickup directives advance the queue by coordinator action: `loop-directive.md:41–53` intake queue items 1–7 (post-update numbering; corrected from `:38–50` per review B-05/F7) (claim → verify anchor → reconcile FK → verify anchors → present decision list → dispatch plan review → replace directive); the HCS `State:` line (`loop-directive.md:14–20`) records where the queue stands [M] | "The scheduler advances its coordinator's queue without consuming a turn of that coordinator. A conforming implementation in which queue progress requires the coordinator to act does not satisfy D24" (S1, A3.2 required role limits) | G1 |
| Parcel-loop stages | `COORDINATOR-PATTERN.md:11–19` lifecycle: Stage Zero → GATE 1 (never delegable) → plan adversarial review ("fresh frontier session, ALWAYS", `:14`) → per-parcel 11-step loop ("the proven 11-step loop", `:16`) with GATE 2/GATE 3 (`:17–18`) → goal exit. Per-parcel loop canon in the coordinator carryover (`:79`) | D24 role limits: scheduler is deterministic, performs no model judgment, proposes/dispatches only within its coordinator's delegated domain; "It cannot ratify a charter, widen scope, grant itself authority, merge, or close a goal" (S1, A3.2) | G2, G3 |
| Where a coordinator turn is consumed | The coordinator "is the first agent a developer works with and the only long-running one" (`COORDINATOR-PATTERN.md:7`); its "outputs are decisions and dispatches" (`:7`); the loop "work[s] while there is work, sleep[s] on a long fallback while builders build (completion notifications are the primary wake signal)" (`:73`); deterministic passes "run on the coordinator's machine" (`:79`); every dispatch opens with Step 0 restate-and-stop (`:69`); triage and gate requests (`loop-directive.md:50–53`) consume coordinator turns | The scheduler consumes no coordinator turn for queue progress; adjudicators ("stateless adjudicator pool") absorb judgment tasks "arising from that queue" and "retain no private durable authority state" (S1, A3.2) | G1, G4 |
| Frozen inputs / determinism | None. Queue state lives in loop directives and coordinator memory; no revision digests over queue contents exist (C16: no operational-state DB) [M] | Frozen input set "explicit and complete: queue contents and their revision digests, declared-domain digest, lease and admission state as read at a named revision, policy version, and an injected clock and seed. No ambient wall-clock, arrival order, hostname, process identity, or RNG may influence ordering" (S1, A3.2) | G3, G5, G6, G7 |
| Determinism evidence | None possible (no scheduler) [M] | "determinism claims are evidenced by repeat runs over a recorded input set, not by re-execution in a similar environment" (S1, A3.2) | G7 |
| Scope ceiling | Coordinator envelope is "Broad, incl. push/PR/merge" (`COORDINATOR-PATTERN.md:63`); builder/reviewer envelopes narrower; standing authorizations written into loop directives verbatim (`:55`, corrected from `:53` per review F5/B-04) | "The scheduler may propose or request dispatch only within its coordinator's delegated domain" (S1, A3.2) | G8 |
| Shared-infrastructure contention | Universal stop conditions + tripwires (`COORDINATOR-PATTERN.md:73`, corrected from `:75` per review F5/B-04); FK INF-8 revisits contention (`charter.md:611–614`, corrected from `:605–607` per review F6) | "Contention in them must produce a typed wait, refusal, or retry; it must not silently centralize queue selection" (S1, A3.2) | G9 |

### Named gap list (AC4)

| ID | Gap | Status |
|---|---|---|
| G1 | No scheduler component exists in the live tree; every queue advance today consumes a coordinator turn (evidence: `loop-directive.md:41–53`; `COORDINATOR-PATTERN.md:73`) | `unstarted` |
| G2 | No deterministic per-queue ordering engine; the 11-step parcel loop and lifecycle above are coordinator-driven stages, not scheduler output | `unstarted` |
| G3 | No revision digests over queue contents and no declared-domain digest (A3 D23 revision-bound domains) — HCS-P1 contract output | `unstarted` |
| G4 | No stateless adjudicator pool; A3's dispositions are handled today by coordinator triage (fix / accept-as-documented / informational, `COORDINATOR-PATTERN.md:43`) | `unstarted` |
| G5 | No lease/admission state provider (FK-P9/FK-P10 `unstarted`, K7/K8; SA2) — the frozen-input set is currently unproducible | `unstarted` |
| G6 | No policy-version digest binding (FK-P12 class D policy digest, `fk-p0-…-registry.md:49`, `unstarted`) | `unstarted` |
| G7 | No injected clock/seed contract and no repeat-run determinism harness (HCS-P3 outcome) | `unstarted` |
| G8 | No mechanically disjoint delegated-domain proof vocabulary (A3 D23); HCS-P1/P2 output. Until then no concurrent dispatch under a subordinate coordinator is admissible | `unstarted` |
| G9 | No typed wait/refusal/retry contract for shared-infrastructure contention (HCS-P4/P6 scope per Stage Zero §3.4 item 5) | `unstarted` |

## 5. AC5 — Serialization-point inventory

Every active serialization point **known from the swept record set** with owner and collision
rule: the spec's enumerated list (SP1–SP12), the FK charter §12/§15.4 serialization-point
families and the ambient user-owned file (SP13–SP16, review B-02), the live PMC↔RCM binding
one-writer order and its satellite surfaces (SP8/SP9 rewritten + SP17/SP18, review B-03),
and the sibling-charter named points (SP19–SP21, review B-07). Exhaustiveness is bounded by
what those records name — a point appearing only in an unswept record is outside this
inventory's claim [I] (the prior unbounded "Every active serialization point" wording is
narrowed per review F10). Fail-closed vocabulary:
**refuse** (typed refusal), **wait** (typed wait/retry), **escalate** (stop-and-escalate).
"FK rule" cites the enforcing FK record where one exists; where none exists the row says so.

| # | Serialization point | Owner | Collision rule | Fail-closed on collision | FK rule / evidence |
|---|---|---|---|---|---|
| SP1 | SQLite ledger (events, leases, revisions, projections) | Lease/transition engine (FK-P10, `unstarted`) | Single writer; single-writer leases, CAS revisions, idempotency bound to input digests, append-only events; "divergence stops, never overwrites" | **refuse** (stale CAS / lease mismatch) then **escalate** on divergence-stop | `fk-p0-…-registry.md:66`; D14 `charter.md:114`; class E `:50` |
| SP2 | Git canon (charters, specs, policies, reviews, gate artifacts) | Human/coordinator via Git; Gate 3 human-owned | Kernel tools never write canon; Git wins ratification and human-gate facts; one writer per file per parcel (exact `Allowed Files`) | **refuse** writes outside exact `Allowed Files`; **escalate** if correctness would require one | `fk-p0-…-registry.md:67`; D2 `charter.md:102`; class A `:46`; FK charter §11 (`charter.md:357`); SPEC-CONVENTION §4.8 |
| SP3 | Markdown projections | Projection engine (FK-P11, `unstarted`) | Deterministic views only; field-level authority matrix; one-time digest/commit-bound import with cutover epoch | **refuse** + divergence-stop | `fk-p0-…-registry.md:71`; `fk-p1-p21-dispatch-plan.md` FK-P11 row |
| SP4 | Worktree/branch identity (session locus) | The session's governed worktree/branch, named in the dispatch directive | "the branch/worktree is named in the directive, never ambient" (`COORDINATOR-PATTERN.md:69`, corrected from `:67` per review F5/B-04); one governed worktree per session | **refuse**: `WORKTREE_MISMATCH` / `BRANCH_MISMATCH` | `fk-p0-…-registry.md:47` (class B), FK-P12 inputs |
| SP5 | Goal worktree creation | The claiming coordinator at a parcel boundary | One goal, one root coordinator; "ownership transfers only at parcel boundaries via that block" (`COORDINATOR-PATTERN.md:73`, rule earned at commit `491fb80`); one spec → one agent → one isolated branch/worktree (SPEC-CONVENTION §8); isolated named worktree from a verified base SHA (`fk-p1-p21-dispatch-plan.md` pre-dispatch item 4) | **escalate**: another live owner on a required surface is a stop condition (S6 stop conditions; `loop-directive.md:70–72`, corrected from `:67` per review B-05/F7) | COORDINATOR-PATTERN.md:73; SPEC-CONVENTION §8; no FK rule (goal-level canon) |
| SP6 | Loop-directive state lines (ownership block + `State:`) | The goal's claiming coordinator session | Single writer per goal; claim recorded at a parcel boundary; state line is the resumable queue position (`loop-directive.md:5–20`, post-update numbering) | **refuse/stop** and report if another live owner is named or ownership is ambiguous | `loop-directive.md:3,11–12,70–72`, corrected from `:3,67` per review B-05/F7; no FK rule (goal-level canon) |
| SP7 | Specs directory (`docs/specs/`) | Spec lifecycle per SPEC-CONVENTION (folder is authoritative; `INDEX.md` regenerated on every state change; active→done moves ride the merge PR) | One spec per unit of work; a builder may write only its spec's `Allowed Files`; "This spec file is not in the builder's Allowed Files" (HCS-P0 spec, Allowed Files) | **refuse** (`PATH_OUTSIDE_ALLOWED_FILES`); a needed out-of-scope path stops work until a coordinator ratifies a spec amendment (SPEC-CONVENTION §4.8) | SPEC-CONVENTION §2/§3/§4.8; class A `fk-p0-…-registry.md:46` |
| SP8 | `routing-policy/` | Sibling goal `foreman-line-boundary-routing` (O5), with the live PMC↔RCM writer windows below (S16) | **Live binding one-writer order (S16 `rcm-sequencing-decision-2026-09-26.md:1–14` "BINDING serialization order"; corroborated by the RCM loop-directive 2026-09-26 note, `routing-currency-and-merit/loop-directive.md:34–42`):** one writer at a time — **Window P first**: PMC-P1 (its A7 file set incl. `routing-policy.yaml`, `src/validator.ts`, `schemas/*.json`, `tests/**`) then PMC-P2 (`src/pi-openrouter.ts`, `templates/**`), internally one PMC writer at a time (S16 `:40–47`); while Window P is open RCM-P2+ must not touch `routing-policy/**` or `dispatch/**` (S16 `:48–53`); **Window R second**: RCM-P2+ on `routing-policy/**` + `dispatch/**`, and while it is open PMC must not touch those surfaces (S16 `:54–57`); "**No co-ownership at any time**" (S16 `:58–61`, quoting the underlying rule "If both goals claim the same file, both stop until sequenced", `routing-currency-and-merit/charter.md:58` (S17)); the second writer "rebases onto the first and re-runs the full `routing-policy` test suite … before its own Gate 3" (S16 `:62–64`); release Window R opens only on PMC-P2 Gate-3 merge + stage-F closure (S16 `:85–90`). HCS-P0 observes and records only, never co-edits (spec Constraints; FK registry §9 GD-2) | **wait** (typed wait for the open window) then **escalate** on any required HCS write | `fk-reconciliation-2026-09-26.md:79–83` (quote at `:80–82`, corrected from `:66–68` per F4/B-04); `fk-p0-…-registry.md:229` (GD-2, corrected from `:225` per F3/B-04); S16 (pin) |
| SP9 | `dispatch/` | Contested: `foreman-line-boundary-routing` vs FK-P3 seam (O6); write windows sequenced below | **Live binding one-writer order (S16):** `dispatch/**` is inside the RCM-P2+ governed-logic surface (S16 `:29–31`); **Window P holds it** — RCM-P2+ must not open any write window on `routing-policy/**` or `dispatch/**` while Window P is open (S16 `:48–53`); **Window R is the single-writer slot on `dispatch/**`** — RCM-P2+ writes it only after Window P releases (PMC-P2 Gate-3 merge + stage-F closure, S16 `:85–90`), and while Window R is open PMC must not touch it (S16 `:54–57`); no co-ownership at any time (S16 `:58–61`); second-writer rebase + full-suite re-run (S16 `:62–64`). The dispatch-path enforcement slot is boundary-routing work **item 4** (`mutation-scope-guard` invoked at dispatch preflight and post-hoc; `foreman-line-boundary-routing/items-1-2-status-2026-09-26.md:244–246`, charter D5 `:24`) — note: no literal "single-writer slot" phrase exists in the tree (swept 2026-09-26); the single-writer semantics come from the S16 windows. Ownership must still be negotiated before any FK-P3 dispatch (O6) | **wait** (typed wait for the open window) then **escalate** | `fk-p1-p21-dispatch-plan.md` FK-P3 row (`:30`); `fk-p0-…-registry.md:72` (corrected from `:73` per F3/B-04); S16 (pin) |
| SP10 | `contracts/` | Frozen W0 contracts (loop-stop); **candidate owner-of-record `governed-model-fleet` (external, Keon) for the receipt/envelope/settlement families the package carries — coverage of the local package unestablished** (O7, review B-01) | "modification is a loop-stop" (`foreman-ops-console/charter.md:92`) | **escalate** (loop-stop) | `foreman-ops-console/charter.md:55,92` (S13); `routing-currency-and-merit/charter.md:56` (S17); `hro-p0-integration-contract.md:68,104` (S18) |
| SP11 | `templates/` | Overlapping: scaffolder canon (`plugin-packaging-and-scaffolder/charter.md:98,266` (S14)) vs boundary-routing installability template (`foreman-line-boundary-routing/charter.md:67` (S15)) (O8) | Observe only; enumerate the overlap for disjointness proofs; `templates/**` is likewise held during Window P (S16 `:52–53`) | **escalate** | as O8; S14/S15 pins (C23) |
| SP12 | `foreman-kernel/` (FK canon, branches, worktrees) | FK owner-of-record, unreconciled (O1/O9) | Forbidden writes for HCS-P0–P6; a required FK edit is a stop-and-escalate event | **escalate** | Stage Zero §3.1(3); S6 Provenance and authority; HCS-P0 spec Forbidden Files |
| SP13 | FK §12 shared serialization-point file family: plugin manifests, marketplace metadata, root workflow files, shared package manifests, receipt schemas, `SPEC-CONVENTION.md`, barrel exports | One active parcel at a time (FK charter §12) | "are serialization points and are assigned to only one active parcel at a time" | **refuse** (unowned edit) / **wait** for the owning parcel's window; **escalate** if correctness would require a second writer | FK charter §12 `charter.md:380–382` (S2) — review B-02 |
| SP14 | FK §12 parcel-owned points: FK-P6 read-only server package manifest; FK-P7 stateless Docker/launcher files; FK-P9 state migrations/storage exports; FK-P14 stateful Docker/launcher composition; FK-P16 Claude hook registration + Claude manifest; FK-P18 exact CI files; FK-P20 Codex manifest | The named parcel per point | One named owner per point; "Other parcels emit fragments/fixtures and do not edit those serialization points" | **refuse** any non-owner edit | FK charter §12 `charter.md:383–387` (S2); `fk-p1-p21-dispatch-plan.md:33–47` rows tagged "(serialization owner)" (S5) — review B-02 |
| SP15 | Shared exports, lockfiles, migrations, manifests (parallel-lane constraint) | Serialized under FK §12 | "shared exports, lockfiles, migrations, and manifests remain serialized under section 12"; concurrent lanes must reconcile exact file sets before dispatch | **wait** (sequenced) / **escalate** on ambiguity | FK charter §15.4 `charter.md:710–717` (S2) — review B-02 |
| SP16 | Ambient dirty checkout `routing-policy/routing-policy.yaml` (user-owned) | The user/developer | "it is user-owned and excluded from this goal unless the developer separately authorizes its incorporation" | **refuse** incorporation without explicit developer authorization | FK charter §12 `charter.md:376–378` (S2) — review B-02 |
| SP17 | Shared `routing-policy/tests/` directory (RCM-P1 frozen footprint vs PMC-P1 fixtures) | Sequenced by S16 windows; RCM-P1 frozen additive-only footprint | Collides only at directory level, "in file-disjoint subdirectories"; RCM-P1's frozen-branch Gate-3 merge is not sequenced-blocked but if it lands after PMC writes the second-writer rule binds it (rebase + full-suite re-run); any RCM-P1 rework reopens it as a live writer and waits for Window R | **wait** (file-disjoint) / **escalate** on a real file collision | S16 `:92–107` (esp. `:100–102,104–107`) — review B-03 |
| SP18 | `host-owner-export/` digest-pinned evidence (3 files, `routing-currency-and-merit/host-owner-export/`) | RCM goal (read-only for PMC) | Read-only for PMC, never modified; "If that export is regenerated or moved, PMC-P0 evidence is invalidated and the digests must be re-pinned before any PMC-P1/P2 work continues" | **refuse** writes; regeneration → **escalate** (evidence invalidation + re-pin) | S16 `:33–36` — review B-03 |
| SP19 | `docs/goals/INDEX.md` (goal queue/ownership index) | Per INDEX's own update rule (repo convention) | "a conflict between index state and goal-local ownership is a **stop-and-reconcile condition**"; loop state must stay current on every stop/closure (the convention the F1 disposition cites) | **escalate** (stop-and-reconcile) | `routing-currency-and-merit/charter.md:49–54` (quote at `:51–53`) (S17) — review B-07; HCS-P0 spec Forbidden Files singles this path out |
| SP20 | `foreman-config` configuration document shape | `foreman-line-boundary-routing` (D3) | "`foreman-config` owns the configuration document shape, validation, and capability vocabulary"; the spec linter, dispatch, and registration all consume it; invalid declarations refuse | **refuse** invalid declarations; **escalate** on a shape change | `foreman-line-boundary-routing/charter.md:22` (D3; re-measured — review B-07 cited `:23`) (S15) — review B-07 |
| SP21 | Role/task-envelope contract parity family (TypeScript sources, committed JSON Schemas, generated artifacts, fixtures) | `foreman-line-boundary-routing` (D4) | Provider-neutral role contracts and task/result envelopes "must remain in parity" — an edit to any member constrains all of them | **refuse** a parity-breaking edit; **escalate** to the owning goal | `foreman-line-boundary-routing/charter.md:23` (D4; re-measured — review B-07 cited `:24`) (S15) — review B-07 |

## 6. AC6 — Exact landing target for A3 (re-anchored against the LIVE FK charter)

Anchors below were re-measured against the live FK charter on 2026-09-26 (S2:
`94d974b8…`, 807 newline-terminated lines — C3/C4a). A3's own 2026-09-03 anchors
(435-line charter `c1935937…`, "through ratified D21", worktree locus, §4.1 ledger) are
stale and are **not** quoted as current (Stage Zero §3.3 rows 1–4; contradiction ledger §7.3
below). Measurement commands: C5 (`grep -nE '^#{1,3} '`), C6, C7, C8, C9, C10, C11 (raw
output in [`hcs-p0-verification.md`](hcs-p0-verification.md)). **No FK file is edited by this
record.**

| A3 section | Verified anchor in LIVE FK charter (quoted at measured locator) | Measurement | Disposition | Named preconditions |
|---|---|---|---|---|
| A3.1 — D23 into §4 | `## 4. Locked decisions` at `charter.md:88`; decision table rows `charter.md:101–120`; last row: `\| D20 \| First-release enforcement is claimed only for Claude Code on Windows 11 …` at `charter.md:120`. A3's intra-section anchor "Append after D21" has **no live counterpart** — no D21 row exists (C6 raw shows rows D1–D20 only; C12a sweep: only the recovered-A1 "D21" references at `charter.md:521`, `fk-reconciliation-2026-09-26.md:47,57`) | C5, C6, C12a | `re-anchor` (append after D20 at `charter.md:120`; preserve the D21–D22 gap as drafting provenance — "Do not renumber or reuse D22", S1 A3 anchor verification) | (a) FK owner-of-record handoff (O1); (b) human FK Gate-3 merge (O3); (c) fresh pre-transcription decision-row re-sweep (A3 mandate); (d) FK-owner scoped Gate-1 disposition at the re-anchored target (Stage Zero §3.1(2)) |
| A3.2 — D24 into §4 | Same §4 table; append after the D23 row that A3.1 places at the former table end (`charter.md:120` region) | C5, C6 | `re-anchor` | same (a)–(d) |
| A3.3 — D25 into §4 | Same §4 table; append after the D24 row | C5, C6 | `re-anchor` | same (a)–(d) |
| A3.4 — new §5.1 coordination seam | `## 5. First-release architecture` at `charter.md:122`; architecture boundary table `charter.md:124–133`; insertion point verified immediately before `### Common decision envelope` at `charter.md:135` (A3: "Insert after the architecture diagram and before `### Common decision envelope`") | C5, C10 (`sed -n '122,140p'` raw) | `transcribe-after-safe-sequence` | same (a)–(d) |
| A3.5 — §7 deferral bullet | `## 7. Explicitly not doing in this goal` at `charter.md:244`; bullet list ends `- deleting the lessons/provenance record after a rule becomes mechanical.` at `charter.md:257`; closing paragraph begins `The receipt-custody and stage-specific append service becomes a separate follow-on goal` at `charter.md:259` (A3: "Add the following bullet before the closing paragraph") | C5, C9 (`sed -n '244,261p'` raw) | `transcribe-after-safe-sequence` | same (a)–(d) |
| A3.6 — §11 stop conditions | `## 11. Stop conditions` at `charter.md:346`; final queue-empty item `- the queue is empty and the exit criterion is not fully evidenced.` at `charter.md:372` (A3: "Add the following items before the final queue-empty item") | C5, C8 (`sed -n '346,373p'` raw) | `transcribe-after-safe-sequence` | same (a)–(d) |
| A3.7 — §13 item 8 + renumber | `## 13. Gate 1 decision list` at `charter.md:398`; items 1–11 at `charter.md:402–415`; item 7 `7. versioned typed tool contracts plus the read-confidentiality boundary (D17, D19);` at `charter.md:411`; item 8 `8. the FK-P0 through FK-P21 dependency graph and Wave 0–4 exit criteria;` at `charter.md:412` through item 11 at `charter.md:415` (A3: insert new item 8 after current item 7, renumber 8–11 → 9–12) | C5, C7 (`sed -n '398,424p'` raw) | `transcribe-after-safe-sequence` | same (a)–(d) |
| A3.8 — ratification ledger row | A3's anchor "§4.1 Ratification ledger" has **no live counterpart** (C5: no §4.1 heading). Live ledger: `## 17. Source record and ratification ledger` at `charter.md:781`; table `charter.md:785–789` carries 5 dated rows (2026-08-31 ×2, 2026-09-01, 2026-09-07 ×2), **none for A3** | C5, C11 (`sed -n '781,807p'` raw) | `re-anchor` (ledger row lands at §17 per live numbering — Stage Zero §3.3 row 4) | same (a)–(d); plus A3.8's own gate: "If and only if the developer explicitly ratifies this amendment" — the ledger row requires an exact developer ratification statement (S1 A3.8) and is **not** satisfiable by a coordinator decision receipt |

**Binding landing rule (given input).** The Stage Zero §3.1 safe sequence governs every row:
A3's coordination contract is carried in HCS canon now as design baseline (charter D1–D7,
Gate 1 record HG-1); FK-canon transcription is deferred to HCS-P7's landing step (or a named
FK amendment) and requires (a)–(d) above; HCS-P0 through HCS-P6 edit no FK file. The §3.2
lease disposition (reuse the FK-P10 primitive or amend the FK authority matrix by named
ratified amendment — never a private second primitive) is carried into HCS-P1 shaping
(GD-3). This record answers none of those questions.

## 7. AC7 — Evidence discipline manifest

### 7.1 Claim discipline

- **[M] measured fact** — every [M] claim names a repeatable command (`C1`–`C26`) whose raw
  output and exit code are recorded verbatim in [`hcs-p0-verification.md`](hcs-p0-verification.md),
  plus source path + locator and the observation time 2026-09-26.
- **[D] dated observation** — claims true at a stated date (e.g. "R31 accepted 751/751 on
  2026-09-07/08", `fk-p0-…-registry.md:209–210` — corrected from `:208` per review F3/B-04)
  are labeled and never presented as current state.
- **[I] inference** — derived conclusions are labeled and never asserted as observed.
- Acquisition digests for every source are pinned in §0 (C2/C3/C18/C23). Repository
  identity at observation: HEAD `305ecbf…` (C1) [M].
- No claim in this record rests on the shaped spec's prose alone: each row cites a live
  source, a dated input record (S7/S8 are labeled as such), or a command.

### 7.2 Stage Zero §3.3 stale-assumption rows — re-verification (2026-09-26)

| # | Stage Zero §3.3 row | Re-verification result | Evidence |
|---|---|---|---|
| 1 | A3 anchor "435 lines, `c1935937…`" stale; live = 808 lines, `94d974b8…` | **Re-verified with a recorded discrepancy.** Live digest `94d974b8…` matches (C3); live line count measured **807** newline-terminated lines (`awk END{print NR}` = 807, C4a; trailing byte `0a`, C4b) vs Stage Zero's recorded "808 lines". Both numbers recorded, not harmonized (§7.3 X1) | C3, C4a/C4b; S7 §3.3 row 1 |
| 2 | "§4 decision table through ratified D21" stale; live D1–D20 only | **Re-verified.** C6 raw: decision rows exactly D1–D20 at `charter.md:101–120`; C12a sweep of the FK goal dir for `\bD2[1-5]\b` finds only recovered-A1 "D21" references (`charter.md:521`, `fk-reconciliation-2026-09-26.md:47,57`) — no FK decision row after D20; D21 is not ratified. D23–D25 reservation still collision-free | C6, C12a; S7 §3.3 row 2 |
| 3 | Worktree locus `codex/foreman-kernel-stage0-20260830` stale | **Re-verified.** C14/C15 raw: worktree exists at `d0e87ce`; active-locus set is `codex/fk-p0-*`, `codex/foreman-kernel-unattended-20260907`, `codex/foreman-kernel-resume-20260908` (plus `handoff/foreman-kernel-live-20260907`), matching S3 row 1 | C14, C15; S3 `:28` |
| 4 | A3.8 "§4.1 Ratification ledger" stale; live ledger §17 | **Re-verified.** C5 raw: no `§4.1` heading; `## 17. Source record and ratification ledger` at `charter.md:781`; other A3 anchors verified at live §4/§5/§7/§11/§13 (C5–C10) | C5, C11 |
| 5 | "loop-directive.md … names a different live owning coordinator and places FK-P0 at human Gate 3" stale as current state | **Re-verified.** C13 raw: live FK goal dir contains exactly `ADR-001-…`, `charter.md`, `fk-p0-…-registry.md`, `fk-p1-p21-dispatch-plan.md`, `fk-reconciliation-2026-09-26.md` — no `loop-directive.md` | C13; S3 `:37` (row 10) |
| 6 | "FK-P0–FK-P21 remain unchanged" corroborated | **Re-verified at record level.** FK charter §6 parcel graph intact (S2 `:170–243`, waves at `:176–228`); `fk-p1-p21-dispatch-plan.md` wave exits "unchanged"; FK registry §9 GD-3 defers FK-P1+ (S4 `:224–230`, corrected from `:224–229` which missed GD-3 at `:230` per review F3); no FK parcel-graph change found in the swept sources | S2, S4 `:224–230`, S5 |
| 7 | A3 status "PROPOSED — not ratified"; A3.8 ledger unfilled | **Re-verified.** S1 `:5` "PROPOSED — not ratified, not in force, and not authorized for implementation."; S1 `:251` "**Ratification record:** _(unratified — awaiting explicit developer decision)_"; no A3 row in the live §17 ledger (C11) | C11; S1 `:5,:251` |

Nothing in §3.3 is deferred: all seven rows re-verified. The only discrepancy is X1 below.

### 7.3 Contradiction ledger (never harmonized silently)

| ID | Live-state contradiction | Citation A | Citation B | Disposition |
|---|---|---|---|---|
| X1 | Line-count discrepancy: Stage Zero records the live FK charter as "808 lines"; this slice measures 807 newline-terminated lines at the **identical** SHA-256 | S7 §3.3 row 1 ("measures **808 lines**, SHA-256 `94d974b8…`") | C3/C4a/C4b: `wc -l` = 807, `awk END{print NR}` = 807, trailing byte `0a`, digest `94d974b8…` | Both recorded. [I] Byte identity (same digest) rules out content drift; the discrepancy is a counting-method artifact (808 is the trailing-element count of a split-on-newline over a 807-newline file). No anchor consequence: all §6 anchors are line-locators re-measured by C5–C11 |
| X2 | A3 "Anchor verification" claims the §4 decision table runs "through ratified D21" | S1 (Anchor verification: "the §4 decision table through ratified D21") | C6/C12a: live rows D1–D20 only (`charter.md:101–120`); S3 `:57` ("the recovered text's 'D21' is not ratified into this charter's D1–D20 list") | A3.1–A3.3 re-anchored after D20 (§6); D21–D22 gap preserved as drafting provenance; A3 claim recorded as stale (Stage Zero §3.3 row 2) |
| X3 | A3.8 targets "§4.1 Ratification ledger" | S1 A3.8 ("**Target:** §4.1 Ratification ledger.") | C5/C11: live ledger at `## 17` (`charter.md:781`) | `re-anchor` at §17 (§6 row A3.8) |
| X4 | A3 target locus is "`charter.md` in the `codex/foreman-kernel-stage0-20260830` goal worktree" (435-line charter `c1935937…`) | S1 (Target + Anchor verification) | C3/C4/C14/C15: live charter `94d974b8…`, 807 lines, in the shared registration tree; stage0 worktree exists at `d0e87ce` but is not the active locus (S3 `:28`) | Stale locus (Stage Zero §3.3 rows 1, 3); §6 anchors measured on the live file |
| X5 | A3 anchor claims "`loop-directive.md`, which names a different live owning coordinator and places FK-P0 at human Gate 3" | S1 (Anchor verification) | C13: no `loop-directive.md` exists in the live FK goal dir | Stale as current-state claim; valid as a dated 2026-09-03 observation (Stage Zero §3.3 row 5) |
| X6 | Authority wording tension: the HCS-P0 spec's Constraints say "Gate 2 covers HCS-P0 only" while the goal's own records say Gate 2 is not granted | HCS-P0 spec, Constraints ("Gate 2 covers HCS-P0 only; **Gate 3 remains human-owned**") | `loop-directive.md:59` ("Gate 2 is not granted." — corrected from `:54–56` per review F7/B-05) and `:65–66` ("Gate 2 remains not granted" — corrected from `:60–63`); `gate-1-ratification-2026-09-26.md` gate table ("**Not granted by this record.** Request only for the final named parcel graph after Gate 1 and the mandatory plan-level adversarial review") | Recorded as an open authority item (`escalated-unresolved`), not harmonized: the spec line is read as the owner-directed dispatch coverage of HCS-P0 alone [I]; the charter path to a scoped Gate 2 grant for the full graph is unchanged. No merge/release/spend authority exists under either reading (charter D7) |

### 7.4 Open questions preserved (Stage Zero §3.4 — not re-litigated)

| # | Open question | Standing disposition | This map's contribution |
|---|---|---|---|
| Q1 | Exact path binding for "the landing target for A3" | P0's output | Answered at anchor level by §6 (FK charter locators). Module/canon path binding for HCS packages remains open (Q2) |
| Q2 | Where HCS implementation code lands (new `plugins/foreman-line/` package vs extension of merged FK packages); A3's "exact follow-on parcel graph and prove-out repository" | Depends on the FK Gate-3 merge and P0's map | Remains **open**; bounded by SA2 (no competing state primitive) and O3 (merged package wins) |
| Q3 | Dedup rule between the Stage Zero record and P0 execution | P0 must not re-litigate §2/§3 dispositions | Honored: §1–§6 cite S7 dispositions as given inputs |
| Q4 | FK-P10 lease question (reuse-or-amend) | Reuse is the only seam-compatible default; contract decision belongs to HCS-P1 shaping (GD-3) | Carried unchanged (SA3); not decided here |
| Q5 | A3's deliberately unresolved choices → owning parcels (sidecar topology → HCS-P3/P4; scheduler ordering keys → HCS-P1/P3; capacity allocation → HCS-P3; physical evidence index → HCS-P5 (D2 binds it to SQLite operational state); adjudicator count/grade → HCS-P4; retry/timeout/crash/pool → HCS-P4/P6) | Owning parcels as listed | Carried unchanged; G1–G9 (§4) name the mechanical gaps these choices must close |

## 8. Authority and gate lines for this record

| Gate line | Status | Authority basis |
|---|---|---|
| Gate 1 (charter-scope ratification) | Recorded 2026-09-26 as HG-1 (coordinator decision receipt, not a human approval) | coordinator decision 2026-09-26 under owner blanket authority (`gate-1-ratification-2026-09-26.md`) |
| Gate 2 | Not granted beyond the owner-directed dispatch of HCS-P0 (X6 recorded open) | coordinator decision 2026-09-26 under owner blanket authority; charter "Human gates and requested standing authority" |
| Gate 3 (merge, release, spend, external effects) | **Human-owned. Not delegated.** This record grants none | charter D7; owner blanket authority does not delegate Gate 3; `fk-p0-…-registry.md:26` ("Gate 3 merge \| Human-owned, not delegated" — corrected from `:23` per review F3/B-04) |
| FK ownership transfer | None granted or requested | S6 "Provenance and authority": "this charter creates neither"; S3 `:43` (row 16) |

**Allowed-files note (rework 2026-09-26).** The P0 slice's `loop-directive.md` state-line
write is RATIFIED as an exact-path exception to the spec's Forbidden Files by the F1
disposition recorded verbatim in the spec's Allowed Files note and in
[`hcs-p0-verification.md`](hcs-p0-verification.md) §4. No other out-of-Allowed-Files write
exists in this slice's audit (verification §4 W1–W5).

**Not an FK authority change. Not a merge receipt. Not a lease decision.**

## 9. Locator correction log (rework 2026-09-26)

Every wrong `path:line` locator named in either review is corrected above; each corrected
line was re-opened at the pinned bytes before the fix. Sample re-verification of ≥10 of
these against the live tree is recorded in [`hcs-p0-verification.md`](hcs-p0-verification.md)
C24.

| # | Source | Was | Now | Finding |
|---|---|---|---|---|
| 1 | `fk-p0-…-registry.md` (K5 "FK-P1 Stage A shaped but unimplemented") | `:208` | `:215` | F3 / B-04 |
| 2 | `fk-p0-…-registry.md` (§7.1 [D] "R31 accepted 751/751") | `:208` | `:209–210` | F3 / B-04 |
| 3 | `fk-p0-…-registry.md` (K13 D13 destination) | `:113` | `:118` | F3 / B-04 |
| 4 | `fk-p0-…-registry.md` (O6/SP9 legacy routing/skill recorders) | `:73` | `:72` | F3 / B-04 |
| 5 | `fk-p0-…-registry.md` (SP8 GD-2) | `:225` | `:229` | F3 / B-04 |
| 6 | `fk-p0-…-registry.md` (§8 Gate-3 row) | `:23` | `:26` | F3 / B-04 |
| 7 | `fk-p0-…-registry.md` (§7.2 row 6 GD-3 range) | `:224–229` | `:224–230` | F3 |
| 8 | `fk-reconciliation-2026-09-26.md` (O5/SP8 seam quote) | `:66–68` | `:79–83` (quote at `:80–82`) | F4 / B-04 |
| 9 | `COORDINATOR-PATTERN.md` (standing authorizations) | `:53` | `:55` | F5 / B-04 |
| 10 | `COORDINATOR-PATTERN.md` (Step-0 / never-ambient; SP4) | `:67` | `:69` | F5 / B-04 |
| 11 | `COORDINATOR-PATTERN.md` (universal stop conditions) | `:75` | `:73` | F5 / B-04 |
| 12 | `charter.md` (INF-8 contention) | `:605–607` | `:611–614` | F6 |
| 13 | `loop-directive.md` (intake queue items 1–7; §4 + G1) | `:38–50` | `:41–53` | F7 / B-05 |
| 14 | `loop-directive.md` (State line) | `:14` | `:14–20` | F7 / B-05 |
| 15 | `loop-directive.md` (triage/gate requests) | `:47–50` | `:50–53` | F7 / B-05 |
| 16 | `loop-directive.md` (X6 "Gate 2 is not granted.") | `:54–56` | `:59` | F7 / B-05 |
| 17 | `loop-directive.md` (X6 "Gate 2 remains not granted") | `:60–63` | `:65–66` | F7 / B-05 |
| 18 | `loop-directive.md` (SP6 claim/state block) | `:5–14` | `:5–20` | F7 / B-05 |
| 19 | `loop-directive.md` (SP6 fail-closed cite) | `:3,67` | `:3,11–12,70–72` | F7 / B-05 |
| 20 | `loop-directive.md` (SP5 stop conditions) | `:67` | `:70–72` | F7 / B-05 |
| 21 | `loop-directive.md` (S9 pin convention) | 36–50 / 52–63 / 65–67 | 41–53 / 55–66 / 68–72 | F7 / B-05 |
| 22 | `charter.md` (O9 decision label) | "D2 (`:101`)" | "D1 (`:101`; D2 at `:102`)" | F11 |
| 23 | `foreman-line-boundary-routing/charter.md` (new SP20/SP21 rows) | review B-07 cited D3 `:23`, D4 `:24` | D3 `:22`, D4 `:23` (re-measured) | B-07 |
| 24 | `charter.md` §12 parcel-owner rows (new SP14) | review B-02 cited `:383–386` | `:383–387` (the "Other parcels emit fragments/fixtures" line sits at `:387`) | B-02 |

Locator disputes: none — all 24 corrections accepted and applied. The only inter-review
discrepancy (F4's `:79–83` vs B-04's `:80–82` for the reconciliation seam quote) is resolved
by measuring both: the §3 bullet spans `:79–83`, the quoted seam sentence `:80–82`; the map
now cites the bullet range with the quote span inline.
