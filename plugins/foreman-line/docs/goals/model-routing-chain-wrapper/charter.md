# Goal Charter — Model Routing Chain Wrapper

**Goal slug:** `model-routing-chain-wrapper`
**Created:** 2026-09-27
**Owner:** Clinton Morgan
**Coordinator:** unassigned — claim only through a generated loop directive at a parcel boundary (ownership block per `../../COORDINATOR-PATTERN.md`)
**Status:** GATE 1 RATIFIED 2026-09-27 (owner: "Ratify all, as recommended" — D1–D10 and the standing Gate-2 authorization). Plan-level adversarial review completed and triaged 2026-09-27 (`plan-review-findings.md`; F-01…F-11 dispositioned as fix-applied, no locked decision changed — triage rationale recorded there). Loop directive generated (`loop-directive.md`). Nothing dispatched yet.
**Mode:** orchestration wrapper — multi-parcel, multi-goal delivery of the model-routing chain

## Objective

Deliver the remaining model-routing chain — tasks **MRC-01…MRC-25** in [`../goal-status-report-2026-09-27.md`](../goal-status-report-2026-09-27.md) §7 (goals `hybrid-routing-optimization`, `pi-model-configuration`, `routing-currency-and-merit`, `routing-currency-and-merit-jev-alpha`, `governed-model-fleet`) — by shaping, dispatching, reviewing, and closing one parcel at a time in dependency order, each under its **owning goal's** charter and gates.

This wrapper owns orchestration only. It is the master goal the foreman-line `/goal` loop runs to create and implement the chain's parcels. It introduces no routing policy, no resolver behavior, no configuration authority, and no new contracts.

## Relationship to existing work

- [`../goal-status-report-2026-09-27.md`](../goal-status-report-2026-09-27.md) §6: owner rulings A–G (recorded 2026-09-27) and the alignment verdicts. §7: the dependency-ordered task table — **source of truth** (D2).
- Owning goal charters — each remains the authority for its own parcels, decisions, review load, and gates: [`../hybrid-routing-optimization/charter.md`](../hybrid-routing-optimization/charter.md), [`../pi-model-configuration/charter.md`](../pi-model-configuration/charter.md), [`../routing-currency-and-merit/charter.md`](../routing-currency-and-merit/charter.md), [`../routing-currency-and-merit-jev-alpha/charter.md`](../routing-currency-and-merit-jev-alpha/charter.md), [`../governed-model-fleet/charter.md`](../governed-model-fleet/charter.md).
- [`../foreman-line-boundary-routing/charter.md`](../foreman-line-boundary-routing/charter.md) D7/D8/D10: standing routing authority. Every parcel preserves D7/D8 (HRO-D1 restates them; nothing amends them). Ruling A amends exactly two lines, both landed by MRC-01: that charter's D10 Jev-identity line, and HRO-D3 in the HRO charter. No other D1–D10 text in any goal is amended by anything in this chain.
- [`../../COORDINATOR-PATTERN.md`](../../COORDINATOR-PATTERN.md): charter lifecycle, three human gates, dispatch table, long-running loop. [`../../SPEC-CONVENTION.md`](../../SPEC-CONVENTION.md): parcel spec schema (`risk`, `surfaces`, `routing_class`, `permission_profile`), spec lifecycle in `docs/specs/{active,done}/`.
- `../../skills/goal/SKILL.md` and `../../skills/parcel-driven-development/`: the loop and parcel mechanics (one parcel / one branch / one worktree; allowed-files specs; rebase before PR; stop-and-report).
- HCS collision map [`../hierarchical-coordination-sidecars/hcs-p0-authority-and-collision-map.md`](../hierarchical-coordination-sidecars/hcs-p0-authority-and-collision-map.md). **Enforcement split:** SP8/SP9 (`routing-policy/**`, `dispatch/**`) window discipline is enforced by this wrapper (D4, window records in the dispatch table); SP11/SP13-family surfaces (`templates/`, plugin manifests, shared package manifests, `SPEC-CONVENTION.md`, barrel exports) are checked at shaping against the map and enforced as **stop-on-collision** (D10) — the wrapper runs no second window system over them and claims none.

## Locked decisions (ratified Gate 1, 2026-09-27)

| ID | Decision | Reasoning |
|---|---|---|
| D1 | **Orchestration-only wrapper.** Owns no implementation surface. Every MRC parcel is shaped, dispatched, reviewed, and accepted under its owning goal's charter and gates; the wrapper records the dispatch table and nothing else. | Prevents authority laundering across the five goals §6 deliberately kept separate (no roll-in); owning Gate histories and exit criteria stay intact. |
| D2 | **Report §7 is the task source of truth.** MRC-01…25 definitions, predecessors, and lanes live in `goal-status-report-2026-09-27.md` §7. The dispatch table references them. Any scope change requires a recorded amendment to §7 **and** this charter; a change to a locked decision re-opens Gate 1 for that decision only. | One definition, no drift between wrapper and report; charter rows stay one-liners. |
| D3 | **Rulings A–G are binding inputs,** not open questions. No parcel or shaping session re-litigates them. MRC-01 (propagation) lands before — or in the same window as — the first parcel that relies on each ruling. | Owner decisions, 2026-09-27 (§6 rulings table); re-opening re-creates the conflicts §6 resolved. |
| D4 | **Lane G serialization is enforced by the wrapper.** One active writer at a time on `routing-policy/**` + `dispatch/**`, dispatched in §7 slot order. Promotion out of Lane G requires a shaping-time write-set disjointness proof recorded in the parcel spec. Any collision stops the affected parcel. (Scope note per plan review F-08: D4 covers SP8/SP9 only; SP11/SP13-family surfaces are stop-on-collision per D10.) | Window discipline (RCM/PMC sequencing decisions) and HCS SP8/SP9; the second-writer rule on these surfaces is proven real (Window R rebase + full-suite re-run). |
| D5 | **External gates are never satisfied by the wrapper.** G-MERGE, G-LIVE, G-AVAIL, G-JEV-EXT, G-GMF-HR1, G-GMF-AUTH, G-EXPERIMENT and the per-goal dispatch grants G-GATE2-HRO/RCM/PMC/GMF (gates table) are owner/external acts. When one blocks a queued parcel, the loop stops and reports exactly what the owner must do. | No fabricated approvals (receipts discipline); per `/goal` rules, human gates are loop stop conditions — the end state is "stop-report written awaiting <gate>", never "<gate> completed". |
| D6 | **Review load rides with the owning charter.** Architecture/risk parcels get two independent adversarial reviews (COORDINATOR-PATTERN lesson #12); others one, unless the owning charter demands more (PMC-P4: two; GMF parcels: two). Where a wrapper parcel absorbs another goal's scope (MRC-02 ← RCM-P8A per ruling F), it carries the **maximum** of its constituents' review loads and records the absorbed scope's acceptance in the source goal's record. Reviewers never fix or commit; the coordinator reproduces disputed findings before ruling. | Review counts are already ratified per goal; duplicating or weakening them from a wrapper would be a silent charter change. |
| D7 | **Parcel mechanics per SPEC-CONVENTION + PDD hard rules.** Every parcel spec names exact allowed files/surfaces, tests, rollback, data class, and spend; one parcel / one branch / one worktree; rebase before PR; Step 0 restate-and-stop on every dispatch including rework; missing decisions, required-file misses, and contract changes are stop-and-report events. A cluster ID (MRC-25) is a dispatch-table grouping only — every real parcel inside it is shaped, branched, reviewed, and disposed on its own. | The rules are canon; the wrapper's job is to route every MRC task through them, not to reinterpret them. |
| D8 | **Wrapper write scope.** Coordinator/shaping/record sessions for this goal write only `docs/goals/model-routing-chain-wrapper/**` plus the routed parcel specs under `docs/specs/`. Owning goal records change only via MRC-01-class propagation parcels naming the exact ruling lines, or by explicit owner directive. An MRC-01-class write skips any record under a live owning-coordinator claim and reports it. | Keeps the wrapper from mutating other goals' charters/loop-directives (the §5 next-claim convention and ruling G's precedent); J1-class shared-file rules stay satisfiable. |
| D9 | **Evidence before acceptance.** Completion claims map to evidence on disk before closure; wrong-shaped claims are presumptively empty; deterministic passes run in the environment the lessons file mandates; test-count tripwires on every rework. The wrapper's records never assert an owning goal's Gate 3, exit criterion, or live evidence that does not exist. | COORDINATOR-PATTERN verification spine (D4: consume verification, never produce it); the a54 fail-closed discipline and HRO's "fixture success is not evidence of live execution" set the bar. |
| D10 | **Non-chain writers are respected, not negotiated away.** FK-P2/FK-P3 ownership negotiation, scaffolder-owned `templates/`, the SP11 `templates/pi-openrouter-routing.json` escalated overlap, and any other non-chain claim stay with their named owners (HCS collision map). A collision escalates and stops the affected parcel; the wrapper never resolves an ownership conflict by writing first. | §6 verdicts kept every goal's boundaries; the wrapper sequences inside them and must not become a second authority over contested seams. |

## Wave and parcel decomposition

Dependency edges are exactly §7's (binding per D2) and are not restated here. Dispatch order:

- **Wave A — canon and records** (dispatchable any time; "parallel-safe" is **provisional** until shaping proves write-set disjointness to the same standard as D4's promotion rule — concretely MRC-04's `templates/`/skills surfaces vs the SP11/O8 escalated overlap and any GMF-P7 skill writes): MRC-01, MRC-04, MRC-20; MRC-21 when G-JEV-EXT clears (blocked externally; gates nothing).
- **Wave B — governed-logic spine** (Lane G, strictly serial, slot order): MRC-02 → MRC-03 → MRC-05 → MRC-06 → MRC-07 → MRC-08 → MRC-09 → MRC-10 → MRC-11 → MRC-12 → MRC-13.
- **Wave C — receipt-analysis chain** (parallel with Wave B once predecessors are met): MRC-14 → MRC-15 → MRC-16.
- **Wave D — end-of-chain evidence** (gated): MRC-17 → MRC-18; MRC-19 optional behind G-EXPERIMENT.
- **Track E — GMF side chain** (separate Keon repositories; parallel with all waves **subject to the same disjointness proof**; serial within): MRC-22 → MRC-23 → MRC-24 → MRC-25 (cluster; gated by G-GMF-HR1 and G-GMF-AUTH at the tail).

Per-parcel one-liners (detail lives in §7. The **Routing class column governs spec `routing_class` frontmatter** — the SPEC-CONVENTION §4.6 closed enum, human-approved at Gate 2; the owning charter's own label in parentheses governs **review load only** and must never enter spec frontmatter):

| ID | Parcel (owning goal) | One-liner | Risk | Routing class | Reviews |
|---|---|---|---|---|---|
| MRC-01 | rulings propagation (named records) | Land rulings A/B/C/D/F into the named owning records — `foreman-line-boundary-routing` (D10 Jev-identity line), `hybrid-routing-optimization` (HRO-D3), `routing-currency-and-merit` (D3 memo + F boundary), `pi-model-configuration` (B coordination note). JEV needs no write (its J2 already matches ruling A) | low | standard-feature | 1 |
| MRC-02 | HRO-P3 (`hybrid-routing-optimization`) | Decision/attempt events + receipt/replay contract (absorbs RCM-P8A per ruling F) + model-contract enrichment + baseline data. The receipt/replay review doubles as RCM's P8A acceptance evidence, recorded in RCM's record via MRC-01-class handoff; ruling-B schema review (PMC-P1) and adapter/resolver review (PMC-P2) route to those reviewers in addition to the adversarial reviews | standard | implementation/standard | **2** (folded P8A scope is RCM `architecture/risk`) |
| MRC-03 | RCM-P4 closure (`routing-currency-and-merit`) | Named negative controls + DA-1 mirror over the Window-R predicate implementation | elevated | architecture/risk | 2 |
| MRC-04 | PMC-P3 (`pi-model-configuration`) | Pi-session canon rework in skills, kickstarters, docs, human templates | standard | implementation/standard *(owning label: docs/architecture — review load only)* | 1 |
| MRC-05 | RCM-P4A (`routing-currency-and-merit`) | Actual dispatch integration + decision-receipt contract with executed-identity reconciliation | elevated | architecture/risk | 2 |
| MRC-06 | HRO-P4 (`hybrid-routing-optimization`) | Pi/parcel entry point: config validation, host model selection, parcel preservation, declared fallback, unavailable rejection | elevated | architecture/risk | 2 |
| MRC-07 | RCM-P5 (`routing-currency-and-merit`) | Snapshot-bound currency preflight with named-predicate refusals (needs G-MERGE for the RCM-P1 projector) | standard | implementation/standard | 1 |
| MRC-08 | HRO-P4a (`hybrid-routing-optimization`) | Bounded recovery ladder in the resolver + provenance-freshness tolerance | elevated | architecture/risk | 2 |
| MRC-09 | RCM-P6 (`routing-currency-and-merit`) | Scheduled proposer with digest-bound proposal evidence (change classes A/B/C) | elevated | architecture/risk | 2 |
| MRC-10 | HRO-P4b (`hybrid-routing-optimization`) | Evidence-backed config-repair proposals — proposal-only per ruling D | elevated | architecture/risk | 2 |
| MRC-11 | RCM-P7 (`routing-currency-and-merit`) | One-way settings projection artifact/patch; never writes the shared host file | standard | standard-feature | 1 |
| MRC-12 | HRO-P4c (`hybrid-routing-optimization`) | Structured recovery diagnostics: sanitized, deduplicated, stdout stays JSON | standard | implementation/standard | 1 |
| MRC-13 | PMC-P4 (`pi-model-configuration`) | Conformance/smoke/rollout gate + legacy-representation removal at a named cutover (smoke needs G-LIVE) | elevated | architecture/risk *(owning label: integration/release — review load only)* | 2 |
| MRC-14 | RCM-P8 (`routing-currency-and-merit`) | Merit corpus from admissible independently accepted receipts; read-only analysis | standard | standard-feature | 1 |
| MRC-15 | RCM-P9 (`routing-currency-and-merit`) | First expertise bindings — shadow/evidence-only, cited dated sources | elevated | architecture/risk | 2 |
| MRC-16 | RCM-P10 (`routing-currency-and-merit`) | Exit evidence assembly; consumes MRC-02 (receipt/replay), MRC-03 (negative controls), MRC-05/09/11/14/15; closes RCM exit criterion 8; defines nothing new | standard | standard-feature | 1 |
| MRC-17 | HRO smoke (`hybrid-routing-optimization`) | Live synthetic end-to-end Pi smoke receipt (needs G-LIVE) | elevated | implementation/standard | 1 |
| MRC-18 | HRO baseline (`hybrid-routing-optimization`) | Cost/quality baseline report vs the declared baseline; estimates and unknowns separate | standard | standard-feature | 1 |
| MRC-19 | HRO-P5 (`hybrid-routing-optimization`, optional) | Bounded Jev recommendations behind a disabled flag (needs G-EXPERIMENT) | elevated | architecture/risk | 2 |
| MRC-20 | RB-6 capture (`pi-model-configuration`) | Catalogue bytes capture closing the carried review nit | low | boilerplate | 1 |
| MRC-21 | JEV-P5 external rows (`routing-currency-and-merit-jev-alpha`) | Registry push, attestations, CVE scan/tooling (needs G-JEV-EXT) | elevated | implementation/standard | 1 |
| MRC-22 | GMF-P2A (`governed-model-fleet`) | Durable Runtime authority/accounting store + migration (Gate 2 granted 2026-09-27) | elevated | architecture/risk | 2 |
| MRC-23 | GMF-P2B (`governed-model-fleet`) | Atomic validation, spend, reservation, pending-effect transaction | elevated | architecture/risk | 2 |
| MRC-24 | GMF-P2C (`governed-model-fleet`) | Terminal reconciliation, lease recovery, settlement, verification primitives | elevated | architecture/risk | 2 |
| MRC-25 | GMF tail cluster (`governed-model-fleet`) | **Cluster ID only** — ten independently shaped parcels **MRC-25.1…25.10** = GMF-P3A, P3B, P4A, P4B, P4C, P5, P6, P7, P8, P9, each with its own spec, worktree/branch, two reviews, no-go boundary, and gate stops per the GMF charter (incl. D17's P4B-acceptance-before-P4C rule) | critical | architecture/risk | 2 per sub-parcel |

Dispatch rules applying above the table:

- **MRC-01 write rule (D8):** restate-and-stop against each target record's current state before writing; a record under a live owning-coordinator claim is skipped and reported, never merged around.
- **Cluster rule (D7):** MRC-25 never dispatches as one parcel; the dispatch table carries MRC-25.1…25.10 rows with their own dispositions.

## Standing authorizations and human gates

| Gate | State |
|---|---|
| **Gate 1 — charter ratification** | **GRANTED 2026-09-27** — owner ratified D1–D10 and the standing Gate-2 authorization for the 25 named parcels verbatim as recommended ("Ratify all, as recommended"). Recorded here because this gate is never delegable and never inferred. |
| **Gate 2 — dispatch approval** | **Standing authorization granted at ratification, scoped to the 25 named parcels:** the coordinator may shape (fresh shaping session, docs-only) and dispatch (builder in named worktree/branch with kickstarter + `STANDING-CONSTRAINTS.md`) without per-parcel human approval. Contingent per dispatch on: the owning goal's own Gate-2 act (named G-GATE2-* below) permitting that parcel (cited in the dispatch record), Lane G discipline (D4), and a coordinator-lint-clean spec. |
| **Gate 3 — merge** | **Not requested globally.** It rides with each owning goal's record: `routing-currency-and-merit` reserves Gate 3 to the human ("not delegated and not requested"); `pi-model-configuration` Gate 3 is not granted; `governed-model-fleet` has a green-contingent PR-only grant for the GMF-P2A chain; `routing-currency-and-merit-jev-alpha` Gate 3 is a human act. Where no standing grant covers a merge, the wrapper stops and requests the owner's merge act (today's working-tree merges are owner mechanical steps per report §4). |
| **G-GATE2-HRO** | **GRANTED 2026-09-27** (owner: "granted. go.") — per-parcel dispatch grant under `hybrid-routing-optimization` for MRC-02, 06, 08, 10, 12, 17, 18, 19. That goal carries no Gate-2 record (no loop directive by design); this owner act is the grant. |
| **G-GATE2-RCM** | **GRANTED 2026-09-27** (owner: "granted. go.") — exact-parcel-set dispatch grant under `routing-currency-and-merit` for MRC-03, 05, 07, 09, 11, 14, 15, 16 (its charter re-gates Waves 1–4; this act is the "new exact parcel-set grant"). The MRC-02 → RCM-record P8A acceptance handoff also rides this grant. |
| **G-GATE2-PMC** | **GRANTED 2026-09-27** (owner: "granted. go.") — per-parcel dispatch grant under `pi-model-configuration` for MRC-04, 13, 20. |
| **G-GATE2-GMF** | **GRANTED 2026-09-27** (owner: "granted. go.") — re-grants under `governed-model-fleet` for MRC-23, 24, 25.1–25.10 (its own record still governs each parcel's shaping and its no-go boundaries; MRC-22 rides the granted GMF-P2A set). |
| **JEV-P5 dispatch** | MRC-21 is covered by JEV's already-granted strict-sequence Gate-2 parcel set (JEV gate record, 2026-09-26) plus G-JEV-EXT for the external rows. |
| **G-FRESH-TOL** | Provenance-freshness tolerance value for HRO-P4a's enforcement seam (MRC-08) | Owner ratification of the exact tolerance (milliseconds of policy grace beyond an evidence document's own `valid_until`). **Non-blocking:** until recorded, the typed input is consumed unset and the fail-closed default applies (zero grace → past-valid = stale); activation after ratification is configuration-only. Discovered at MRC-08 shaping 2026-09-27; builder may never supply a value |
| **G-PI-HOST-CONTRACT / G-APPLY-AUTH / G-RELOAD-VERIFY** | The three HRO-P4b named gates (MRC-10 shaping, 2026-09-27): validate the complete result vs the **actual Pi contract** (HRO-P0 §5.3 GAP — no `opencode-zen`/`{id,type}` assumptions); the apply act + scoped write authorization + the unratified RCM Gate-1/PMC-P2 settings reconciliation (ruling D); verified reload/new-session behavior (live act). Each is an owner/external act, never satisfied by the wrapper; HRO-P4b ships proposals + reference-harness evidence only |
| **External gates G-MERGE, G-LIVE, G-AVAIL, G-JEV-EXT, G-GMF-HR1, G-GMF-AUTH, G-EXPERIMENT** | Never satisfied by the wrapper (D5). Each is a separate explicit owner/external act recorded with its exact scope. A blocking gate stops the loop with a named stop-report. |

## Verification and acceptance

- **Per parcel:** the owning charter's acceptance criteria plus the spec's tests and verification commands; required independent reviews (table above, including ruling-B PMC reviews for MRC-02); the coordinator's closure check against disk **before** any re-run; deterministic pass in the mandated environment.
- **Wrapper-level:** the dispatch table shows every MRC-01…25 (and MRC-25.1…25.10) exactly once with a final disposition; no two Lane-G parcels hold overlapping write windows on `routing-policy/**` + `dispatch/**` (evidence: per-parcel write sets and window records); every spec cites its owning-goal gate and the rulings it relies on; every external-gate and G-GATE2-* event records the owner's exact act.
- **Shaping-time allowed-files checks cover the HCS map's SP11/SP13 families** (`templates/`, plugin manifests, shared package manifests, `SPEC-CONVENTION.md`, barrel exports); any collision with a non-chain writer is a D10 stop. The wrapper claims no enforced windows over those surfaces — its window records cover SP8/SP9 only.
- Parcel specs must not weaken §7 or an owning charter's exit criterion text (COORDINATOR-PATTERN Stage-F lesson #33: diff spec restatements word by word; produced-artifact criteria are satisfied only by the artifact).

## Exit criterion

Every MRC-01…25 is dispositioned exactly once — delivered with its owning goal's acceptance evidence recorded in the dispatch table, or explicitly deferred/canceled by recorded owner decision (MRC-25 via its ten sub-dispositions). No open Lane-G serialization conflict. All external-gate and G-GATE2-* outcomes recorded (grants and refusals). The final report names everything the owner must still do by hand (merges, grants, external release rows). **Wrapper exit asserts no owning goal's Gate 3 or exit criterion** — each of the five goals closes under its own charter.

## Stop conditions

Stop the loop and report when:

- a frozen contract must change; a tripwire fires twice on one parcel; a security finding cannot close in-parcel; an outward-facing act falls outside the standing authorizations; or the queue is empty;
- a parcel needs a decision not settled by §7, the owning charter, or rulings A–G — **including enforcement of RCM D3 over the A3 rubric's L5 cost ordering**, which is a Gate-1 reopening of RCM D3/A3 for the owner (report §7 surfaced item);
- a serialization or ownership conflict with a non-chain writer appears (FK-P2/FK-P3 negotiation, scaffolder templates, SP11 `templates/` overlap, §12 shared serialization points) — stop the affected parcel and escalate;
- an external gate or a G-GATE2-* grant blocks the next queued parcel — stop and name exactly what the owner must do;
- the owner says stop.

## First shaping instruction

Shape one parcel at a time from §7's table in Lane-G slot order (parallel lanes per §7's parallel summary, subject to the Wave A/Track E disjointness rule). Every spec carries the owning-goal gate citation and the ruling citations it relies on. MRC-25 shapes as MRC-25.1…25.10, never as one parcel. If shaping cannot produce an exact allowed-files list from the owning charter, the HCS collision map, and SPEC-CONVENTION, stop and report before Gate 2.
