# Foreman Line — Goal Status Report (2026-09-27)

**Date:** 2026-09-27
**Scope:** `plugins/foreman-line/docs/goals/` — 10 goal directories remaining after the 2026-09-26 audit (12 records deleted per [`goal-status-report-2026-09-26.md`](goal-status-report-2026-09-26.md) §6). Eleven directories as of 2026-09-27: `governed-model-fleet` was restored from git by explicit owner directive (§1 row 10), superseding its 2026-09-26 deletion.
**Status source:** each goal's `charter.md` + `loop-directive.md` (authoritative per `INDEX.md`); per-goal evidence records through 2026-09-27.
**Relationship to the 2026-09-26 report:** supersedes its §1–§2 status tables. Its §6 coordinator verdicts, §6.3 human follow-ups, §6.4 canon disclosure, and §7 dispatch log remain the record there.
**Basis:** compiled from the goal tree's own records; test counts cited from those records were not re-run for this report.

**Headline:** every one of the 9 formerly-active goals advanced past its 2026-09-26 state during waves 1–3. All remaining work is either (a) later parcels per the plans below, or (b) blocked on the owner's human Gate-3 git merges. Dispatch cap 30/30 is reached (report §8 below).

## 1. Active build-out work (10)

| # | Goal | Current authoritative state | Evidence | What remains |
|---|---|---|---|---|
| 1 | `foreman-kernel` | `fk_p0_record_level_done` — FK-P0 executed at docs level; code-level registry accepted at R31, Gate-3-pending | `fk-reconciliation-2026-09-26.md` (16-row delta), `fk-p0-canon-authority-enforcement-registry.md`, `fk-p1-p21-dispatch-plan.md` (21 rows) | FK-P1–FK-P21. Prerequisites all human/owner acts: Gate-3 merge of FK branches (R30 `c35ff72` / R31 `1747c1d` / packet `947e6f1`), §15.2 fresh independent plan review, owner-of-record handoff (reconciliation row 16). FK-P2/FK-P3 contested surfaces (`routing-policy/`, `dispatch/`) need ownership negotiation with `foreman-line-boundary-routing` |
| 2 | `foreman-line-boundary-routing` | `items_1_7_complete` — work items 1–7 delivered 2026-09-26/27; all nine charter acceptance bullets PASS | `items-1-2-status-2026-09-26.md`, `items-3-4-status-2026-09-26.md`, `items-5-6-status-2026-09-27.md`, `items-7-gates-2026-09-27.md`; full sweep 22 pkgs 1997/1997, typecheck+lint 22/22, D19 PASS | Nits recorded in the gates record: gaps 2–6 (version-agreement test, scaffold CopyEntry seam, A5(c) reading) and the live Jev smoke receipt; human Gate-3 merges |
| 3 | `foreman-ops-console` | `foc_p1_p4_implemented` — FOC-P0 shaped and FOC-P1–P4 implemented; S1 live exit proof run | `docs/specs/active/FOC-P0-projection-contract-and-discovery-inventory.md` (spec-linter clean), `ops-console/` (projection chain walk + localhost 127.0.0.1:8081 board/API, frozen route table), exit proof against `w4-closeout` E6-R1 chain `a5b1975a-7497-4200-bac2-5d8a6fd6c749`, read-only negative control `tests/read-only.test.ts` | Phase 2 (FOC-P5–FOC-P8) is excluded until a scoped Gate 1 amendment lands (charter D7). Gate-1 ratification capture and Gate 3 merge remain owner acts |
| 4 | `hierarchical-coordination-sidecars` | `hcs_p0_accepted` — claimed 2026-09-26; Stage Zero + Gate 1 + P0 all recorded and dual-approved | `hcs-stage-zero-2026-09-26.md`, `gate-1-ratification-2026-09-26.md`, `hcs-p0-verification.md`, `hcs-p0-review-{a,b}-findings.md` (APPROVE WITH NITS ×2), `hcs-p0-acceptance-2026-09-26.md` | HCS-P1 next (RB-01 pin carried) through HCS-P7; HCS-P7 stays gated on the FK merge |
| 5 | `plugin-packaging-and-scaffolder` | `p5_p6_done_p7_trial_recorded` — P1–P7 reconciled; charter §7 exit (clean-room trial) met | `p1-p7-reconciliation-2026-09-26.md`, `p7-clean-room-trial-2026-09-26.md`, `project-scaffold/` 41/41, `scaf-vehicles-lineage.md` | P3/P4 residual deferred under Window-P template rules; goal closure/record hygiene |
| 6 | `hybrid-routing-optimization` | HRO-P0, HRO-P1, HRO-P2 **done** (state record 2026-09-27; no `loop-directive.md` by design) | `hro-state-record-2026-09-27.md`, `hro-p0-integration-contract.md`, `hro-p1-mapping-contract-2026-09-27.md` (routing-policy 206/0), `hro-p2-cache-2026-09-27.md` (dispatch 157/157) | HRO-P3+ not started: events/settlement, Pi entry point, recovery ladder (HRO-P4a also owns the provenance-freshness tolerance), config-repair proposals, diagnostics, Jev. Goal-level: live synthetic Pi smoke receipt, cost/quality baseline. HRO-P0 §4 questions A–E await owner/coordinator canon decisions |
| 7 | `pi-model-configuration` | `wave_1_released_p3_p4_next` — PMC-P0–P2 complete and dual-approved; Wave-1 release chain CLOSED; Window P released to RCM | `pmc-p0-stage-f-closure-2026-09-26.md`, `a54-ratification-2026-09-26.md`, `rcm-sequencing-decision-2026-09-26.md`, `pmc-p1-fallback-contract-2026-09-26.md` (routing-policy 70→116), `pmc-p2-review-{a,b}-findings.md` (156→175 tests), `pmc-wave1-release-2026-09-27.md` | PMC-P3 (human-facing canon rework) and PMC-P4 (legacy-representation removal); owner's Gate-3 git merge (decision approved, git step is the owner's); RB-6 catalogue bytes capture carried. L1/L2/L3/L4/DELTA_L remain fail-closed pending owner-authorized availability evidence (a54 rule). DA-1 mirror fixed in RCM-P2 |
| 8 | `routing-currency-and-merit` | `rcm_p2_p3_built` (loop state `RCM-P2-built-awaiting-gate-3`) — RCM-P1–P3 built; nothing merged | RCM-P1 399/399 (Gate-3 merge approved); Window R 2026-09-27: routing-policy 175→198 observed (206 after HRO-P1), spec-linter 127→137, foreman-config 62/0; `rcm-p2-scope-reconciliation-2026-09-27.md`; `dispatch/**` untouched (RCM-P4A deferred by charter) | RCM-P4A–P10 (dispatch integration, currency preflight, proposer, receipts/merit, expertise bindings runtime); human Gate-3 merges. `exit-audit.md` state is still `not complete` (RCM-P0 evidence `complete:false`; live-evidence boundary and RCM-P1 re-gate open) |
| 9 | `routing-currency-and-merit-jev-alpha` | `p5_offline_boundary_reached` — JEV-P4 done; JEV-P5 fully dispositioned at the offline boundary | JEV-P4 env-scenario suite 44/44 green; `jev-container-release-checklist.md` (every item dispositioned 2026-09-26; Docker rows P5-01a/01b, 02a/02b, 03a/03b, 05a/05b CHECKED with real evidence), `jev-p5-docker-evidence-2026-09-26.md` | JEV-P5 external rows BLOCKED with exact causes: registry push, attestations, CVE scan/tooling — plus human Gate 3 |
| 10 | `governed-model-fleet` *(restored 2026-09-27; external Keon initiative)* | `gmf_p2a_shaping` — GMF-P0/P1 LANDED (PRs #28/#33); goal record restored from git 2026-09-27 by explicit owner directive ("Proceed with the completion of governed-model-fleet"), superseding the 2026-09-26 C1 deletion; ownership transferred 2026-09-27 at a parcel boundary | `charter.md` (status block; D1–D24 + Amendment A1 ratified), `loop-directive.md` (ownership block), `gmf-p1-closure-evidence.md`, `gmf-p1-*` contract set | GMF-P2A dispatch (Gate 2 granted 2026-09-27: exact shaped spec + 12 Allowed Files; PR-only merge, green-contingent) → P2B/P2C and later parcels re-gate; GMF-HG-R1 human repo creation; provider spend, private-source disclosure, and promotion remain ungranted |

## 2. Closure bookkeeping

- `w4-closeout` — **complete**: `closure-record-2026-09-26.md` ("GOAL COMPLETE — EXIT CRITERION MET"), PR #21 merged state reconciled, predecessor `w4-ci-integration` items dispositioned into the closure record. INDEX state `w4_closeout_complete`. Nothing remains.

## 3. Deleted records (2026-09-26)

12 records deleted per the 2026-09-26 report §6.2 (owner's deletion directive; git history retains every file). Extraction targets preserved there. The four human follow-ups carried from `w1-intake-registration` (§6.3) remain live and unassigned: plugins workflow `test` job failing on every run, mcp-test cleanup JQL scope (KONE-23161..23164/23157 vs proof tree KONE-23194/23195), Dependabot alert #4 (root postcss) unverified, and the `schema-scaffold` change-needs-own-charter rule.

## 4. Terminal state at dispatch cap (30/30) — 2026-09-27

Per the 2026-09-26 report §8. All work above sits in the working tree, unmerged. Surfaced remainders:

1. **FK-P1–FK-P21 + HCS-P1–HCS-P7** — blocked on the human Gate-3 merge of the FK branches (R30 `c35ff72` / R31 `1747c1d` / packet `947e6f1`); the merge decision is coordinator-approved; the git operation is the owner's mechanical step.
2. **PMC-P3/P4, HRO-P3–P4c, RCM-P4A–P10, JEV-P5 external rows** — per row-level remainders in §1 — plus the human Gate-3 merges for every goal's release chain.
3. **Carried nits:** RB-6 catalogue bytes capture; boundary gaps 2–6 (`items-7-gates-2026-09-27.md`); the four human hand-items (§3 above).
4. **Fail-closed lanes:** L1/L2/L3/L4/DELTA_L declarations stop by design pending owner-authorized availability evidence (a54 rule).

Owner recommendation (unchanged): merge the working tree in slices (it also carries ~1100 user-owned changes outside `plugins/foreman-line`), perform the FK branch merges, then re-enter via `/goal resume` per goal with fresh caps.

## 5. Record-drift findings (stop-and-reconcile per `INDEX.md`)

State lines that lag their own goal's newest records; owning coordinators reconcile on next claim:

| Record | Drift |
|---|---|
| `foreman-line-boundary-routing/charter.md` | Status line still "Authorized implementation directive"; the goal is at `items_1_7_complete` per its own gates records |
| `foreman-ops-console/charter.md` | Status line still "plan-level adversarial review NOT run"; the review ran 2026-09-16 (`plan-review-findings.md`) and P0–P4 shipped. Test count divergence: loop directive records 73/73, INDEX row reports 78/78 |
| `pi-model-configuration/loop-directive.md` + `charter.md` | Loop state line "…PENDING GATE 3 — RCM HOLD ACTIVE" predates `pmc-wave1-release-2026-09-27.md` (chain CLOSED, Window P released); charter header "Gate 2 not granted" is PMC-P0-era (Gate 2 was granted for PMC-P0 on 2026-09-24 per the loop directive) |
| `hybrid-routing-optimization` (INDEX row) | Row reads `hro_p0_p1_done`; `hro-state-record-2026-09-27.md` (newer) records HRO-P2 done 2026-09-27 |
| `foreman-kernel` | Not drift, but two open prerequisites ride the state: §15.2 fresh plan review outstanding; owner-of-record handoff unreconciled (`fk-reconciliation-2026-09-26.md` row 16) |

## 6. Model-routing goal alignment vs `hybrid-routing-optimization` (analysis addendum, 2026-09-27)

**Question:** do the other model-routing goals support or compete with `hybrid-routing-optimization` (HRO, the desired dynamic model routing approach), and should any be rolled into it?
**Basis:** goal charters and `hybrid-routing-optimization/hro-p0-integration-contract.md` §1–§4 (file-cited owner/overlap map), HRO charter "Relationship to existing work", and the PMC/RCM/JEV charter relationship sections. Additive to §1–§5; supersedes nothing there.

**Verdict: complementary, not competitive — by design.** HRO is the optimization layer (explicit mappings, deterministic cache, bounded recovery, cost/latency measurement) built on the other goals' surfaces; its charter states it "extends those owners; it does not create a parallel resolver". No goal should be rolled into HRO wholesale: the layering (authority → policy/merit → configuration → optimization → recommendation) is what keeps the contested `routing-policy/` + `dispatch/` seams single-writer-sequenced and the gate histories independent. The actual integration work was sequencing and closing HRO-P0 §4.1's canon questions A–E plus the mandate boundary and the report gap — all seven ruled by the owner on 2026-09-27 (rulings table at the end of this section). HRO-P3+ may plan against these rulings; the owning coordinators propagate them into their goal records on next claim (§5 convention).

| Goal | Verdict vs HRO | Roll into HRO? | Basis / rulings |
|---|---|---|---|
| `hybrid-routing-optimization` | reference — the desired dynamic-routing approach | — | HRO-P0–P2 done; HRO-P3–P5 open |
| `pi-model-configuration` | **Complement (foundational)** | **No** | PMC owns Pi configuration, the resolver seam (Amendment 01 A3), and declared fallbacks (PMC D3/D7); HRO-D9 reuses PMC's configuration workflow and HRO-P4a extends the PMC-P2 resolver seam. Ruled 2026-09-27 (B): recorded coordination — HRO is the additive author of mapping/protocol fields on `routing-policy/src/pi-openrouter.ts`, PMC-P1 keeps schema review, PMC-P2 keeps adapter/resolver review. A merge would still reopen A7 ownership and absorb PMC-P3/P4 non-optimization scope (human-facing canon rework, legacy-representation removal) |
| `routing-currency-and-merit` | **Complement with mandate/seam overlap** | **Decided: conditional (parcel-level only)** | RCM owns selection policy (D1 sole routing authority, D3 fixed selection order, D10 catalog snapshot discipline) plus merit/replay; HRO memoizes and measures inside those rules (HRO-P2 must not reorder; Window P/R single-writer discipline applies). Ruled 2026-09-27 (C/F): an exact cache hit whose key covers policy/catalog/mapping versions and whose value is the deterministic evaluator's own output is a memo of D3's order rule — permitted with HRO-P2's cold/warm parity proof. The mandate overlap (RCM's relationship section claims the `model-fleet-v1` D19-deferred "capability/cost/latency routing" work vs HRO's latency/cost objective) is settled by boundary ruling: RCM = selection policy/merit/replay; HRO = cache/mapping/recovery/measurement. Roll-in: RCM-P8A's receipt/replay scope folds into the HRO-P3 events stream as one sequenced stream when both dispatch — stream consolidation, not a goal merge; both goal records keep their own gates |
| `routing-currency-and-merit-jev-alpha` | **Complement (provides HRO-P5's recommendation capability)** | **No** | HRO-P5 ↔ JEV overlap already resolved by sequencing (2026-09-26 audit); J1/J2 forbid shared-file edits without a ratified integration parcel and forbid endpoint repointing. Ruled 2026-09-27 (A): the J2-approved `POST https://openrouter.ai/api/alpha/decisions` capability is the single Jev surface (the only implemented, live-observed one); Zen `systemone` is demoted to unverified candidate; HRO-P5 consumes `jev-decisions` only |
| `foreman-line-boundary-routing` | **Complement (standing routing authority; HRO is subordinate to its D7/D8/D10)** | **No** | HRO-D1 restates D7/D8 — no amendment needed there; the authority layer must remain independent of the optimization layer (a merged goal would let the optimizer amend its own authority). Ruled 2026-09-27 (A): its D10 Jev identity line is amended by its owning coordinator to the `alpha/decisions` surface. Its remaining nits (gaps 2–6, live Jev smoke receipt) stay on its own track |
| `foreman-kernel` | **Adjacent (canon-authority governance of the contested `routing-policy/`, `dispatch/` seams)** | **No** | FK-P2/FK-P3 ownership negotiation with boundary-routing covers exactly HRO's write surfaces; FK canon enforcement is orthogonal authority work, not a routing approach |
| `governed-model-fleet` | **Complement at the settlement-contract boundary only** (external Keon initiative) | **No** | Report gap closed 2026-09-27 (ruling G; §1 row 10 added, scope line corrected): its goal record was restored from git 2026-09-27 by explicit owner directive ("Proceed with the completion of governed-model-fleet"), superseding the 2026-09-26 C1 deletion — recorded in its own charter status block and cross-noted in `pi-model-configuration/charter.md`. HRO-P3 consumes its receipt/envelope/settlement contracts (RCM charter: "If both goals claim the same file, both stop until sequenced"). Deliberate policy divergence, not conflict: GMF-D13 forbids automatic provider/model fallback and GMF-D24 excludes dynamic empirical routing from V1 on the *fleet* plane, while HRO-D8's declared-lane fallback ladder governs the *Foreman/Pi* plane |

**Non-routing goals (cross-check — none missed):** `foreman-ops-console` (read-only projection; consumes routing/receipt events as input, owns none), `hierarchical-coordination-sidecars` (serialization/collision map — its SP8/SP9 window rules are the enforcement mechanism for the sequencing above), `plugin-packaging-and-scaffolder` (`routing-policy/` was a forbidden surface this goal), `w4-closeout` (complete). Not model-routing goals; no roll-in.

**Owner rulings on the §6 blockers — recorded 2026-09-27** (decided by the owner in interview; each is a scoped decision the owning coordinators propagate into their goal records on next claim, per the §5 convention):

| # | Blocker | Ruling |
|---|---|---|
| A | Jev endpoint identity (boundary-routing D10 vs HRO-D3 vs JEV J2) | Single Jev surface = JEV's J2-approved `POST https://openrouter.ai/api/alpha/decisions`. Zen `systemone` (HRO-D3) is demoted to an unverified candidate; D10 and HRO-D3 are amended accordingly by their owning coordinators. "Do not run two Jev surfaces" holds |
| B | PMC Amendment 01 A7 file map on `routing-policy/src/pi-openrouter.ts` | Recorded coordination: HRO is the additive author of mapping/protocol fields; PMC-P1 keeps schema review, PMC-P2 keeps adapter/resolver review. Covers shipped HRO-P1 retroactively; no charter amendment required |
| C | RCM-D3 cache-memo | An exact cache hit whose key includes policy/catalog/mapping versions and whose value is the deterministic evaluator's own output is a memo of D3's order rule, permitted with HRO-P2's cold/warm parity proof — not a dispatch-time reorder |
| D | Pi `settings.json` two-writer race | HRO-P4b is proposal-only (evidence-backed diffs with mapping provenance); apply stays with PMC's authorized writer until a ratified reconciliation exists — consistent with the RCM Gate-1 reopen outcome and HRO-D9's "this charter does not grant it" |
| E | Additive schema stream (RCM-P3 vs HRO fields) | One sequenced stream: RCM-P3 lands next in Window R with HRO-P1's shipped fields as baseline; further HRO additive fields queue behind it (SPEC-CONVENTION §4.6 additive pattern) |
| F | RCM/HRO mandate boundary + RCM-P8A | RCM = selection policy/merit/replay; HRO = cache/mapping/recovery/measurement. RCM-P8A's receipt/replay scope folds into the HRO-P3 events stream as one sequenced stream when both dispatch — stream consolidation, not a goal merge; both goal records keep their own gates |
| G | `governed-model-fleet` report gap | Closed by this update: GMF added to §1 row 10 and the scope line corrected to 11 directories |

## 7. Model-routing chain — dependency-ordered remainder (input to the master wrapper goal)

**Purpose:** the remaining model-routing work (§1 rows 6–10, rulings A–G applied) ordered by dependency so foundational tasks land before the work built on them. This list is shaping input for the master wrapper goal/charter: parcel write sets, tests, and specs are defined downstream per [`SPEC-CONVENTION.md`](../../SPEC-CONVENTION.md). Nothing here dispatches work or grants gates.

**Lanes (parallel indication for the shaping agent):**
- **Lane G — strictly serial.** One writer at a time on the contested `routing-policy/**` + `dispatch/**` surfaces (Window discipline, HCS collision map SP8/SP9). Dispatch in slot order. A task proven write-set-disjoint at shaping may be promoted out of Lane G.
- **Lane P-A — parallel with anything,** no contested writes (records, canon, external repos).
- **Lane P-R — receipt-analysis chain** (read-only over receipt evidence; parallel with Lane G work on other surfaces once its own predecessors are met; confirm write sets at shaping).
- **Lane X — end-of-chain evidence** (live/optional items; gated).

### Tasks

| ID | Task (owner goal) | Hard predecessors | Lane / slot | Notes and gates |
|---|---|---|---|---|
| MRC-01 | Rulings A/B/C/D/F propagation into the named owning records — `foreman-line-boundary-routing` (D10 Jev-identity line), `hybrid-routing-optimization` (HRO-D3), `routing-currency-and-merit` (D3 memo + F boundary), `pi-model-configuration` (B coordination note) | — | P-A | Each goal's own files only (JEV J1-safe; JEV needs no write — its J2 already matches ruling A); per §5 next-claim convention. Dispatch rule: restate-and-stop against each target record's current state; skip and report any record under a live owning-coordinator claim |
| MRC-02 | **HRO-P3** — decision/attempt events + receipt/replay contract (absorbs **RCM-P8A** per ruling F) + `PiModelContract`/`piModelContractFor` enrichment + baseline data | — | G slot 1 | Foundation for MRC-05 identity reconciliation, MRC-14 corpus, MRC-18 baseline. Consumes `receipts/` + GMF settlement contracts (P0/P1 landed) unchanged. **Two independent reviews** (folded P8A scope is RCM `architecture/risk`); the receipt/replay review is recorded as RCM's P8A acceptance evidence via an MRC-01-class handoff; ruling-B schema (PMC-P1) and adapter/resolver (PMC-P2) reviews route to those reviewers |
| MRC-03 | **RCM-P4** acceptance closure — named negative controls (F1/F2 image-bearing boilerplate, unsatisfiable-predicate refusal, classification-gating precedence, expertise/shadow tier order) + DA-1 resolve-time `FALLBACK_SELF_REFERENCE` mirror over the Window-R predicate implementation | — | G slot 2 | Predicate evaluation already landed in Window R (`rcm-p2-scope-reconciliation-2026-09-27.md` §2/§5: extend-not-rebuild); this task is the charter's acceptance evidence, not a rebuild. End-to-end controls close with MRC-05 |
| MRC-04 | **PMC-P3** — Foreman Line Pi-session canon (skills, kickstarters, docs, human-facing templates) | — | P-A | Canon-only; outside RCM's D14 surface (`rcm-sequencing-decision-2026-09-26.md` §3); one independent review per charter |
| MRC-05 | **RCM-P4A** — actual dispatch integration + decision-receipt contract (`dispatch/**`) | MRC-02, MRC-03 | G slot 3 | Preserves boundary-routing D7–D8; reconciles executed model identity with the selection/replay receipt (MRC-02's contract) |
| MRC-06 | **HRO-P4** — Pi/parcel entry point wiring: config validation, actual host model selection, parcel preservation, declared fallback, unavailable-provider rejection | MRC-02, MRC-05 | G slot 4 | Charter order P3→P4 preserved; after MRC-05 because its "actual host model selection" validation consumes the decision receipt |
| MRC-07 | **RCM-P5** — snapshot-bound in-process currency preflight (D11) | MRC-05, **G-MERGE** | G slot 5 | **G-MERGE hard:** the RCM-P1 projector lives on `codex/rcm-p1-builder` until the owner's Gate-3 merge; capability-facts machine-check cannot run before it (`rcm-p2-scope-reconciliation` §4a) |
| MRC-08 | **HRO-P4a** — bounded recovery ladder in the resolver + provenance-freshness tolerance | MRC-06 | G slot 6 | Charter-designated home for the D3 freshness tolerance (HRO-P1 record §5) |
| MRC-09 | **RCM-P6** — scheduled proposer + digest-bound proposal evidence (change classes A/B/C) | MRC-07 | G slot 7 | Never mutates policy, writes Pi settings, or auto-promotes (charter) |
| MRC-10 | **HRO-P4b** — evidence-backed config-repair proposals (diff + mapping provenance) | MRC-08 | G slot 8 | **Proposal-only per ruling D.** Apply is a separate authorized-writer/owner act, not a task here |
| MRC-11 | **RCM-P7** — one-way `settings.json`/`enabledModels` projection artifact/patch | MRC-07 | G slot 9 | Never writes the shared host file (proven never-read by dispatch); ruling D settles the PR-06 two-writer reopen |
| MRC-12 | **HRO-P4c** — structured recovery diagnostics (sanitized, deduplicated; stdout JSON) | MRC-08, MRC-10 | G slot 10 | — |
| MRC-13 | **PMC-P4** — conformance/smoke/rollout gate + serialized legacy-representation removal (named cutover) | MRC-04, MRC-05, MRC-06, **G-LIVE** | G slot 11 | Legacy removal half touches `routing-policy` representation → last in Lane G after consumers run on the new representation; smoke half needs G-LIVE. Two independent reviews per charter |
| MRC-14 | **RCM-P8** — merit corpus from admissible independently accepted receipts (`(routing_class × expertise × model)` outcomes) | MRC-02, MRC-05, **G-MERGE** | P-R | Read-only analysis; legacy/pending/estimated records excluded per charter |
| MRC-15 | **RCM-P9** — first expertise bindings, shadow/evidence-only, cited dated sources | MRC-14 | P-R | Promotion to default is human Gate 3, out of scope by charter |
| MRC-16 | **RCM-P10** — exit evidence assembly (consumes MRC-02 receipt/replay + MRC-03 negative controls + MRC-05/09/11/14/15 evidence; closes RCM exit criterion 8; defines nothing new) | MRC-02, MRC-03, MRC-05, MRC-09, MRC-11, MRC-14, MRC-15 | P-R | — |
| MRC-17 | HRO live synthetic end-to-end Pi smoke receipt (requested provider/model selected and used) | MRC-06, **G-LIVE** | X | Fixture success is not evidence of live execution (HRO charter) |
| MRC-18 | HRO cost/quality baseline report vs the declared baseline (estimates and unknowns separately visible) | MRC-02, MRC-12, MRC-17 | X | No savings claims without comparable evidence (D5) |
| MRC-19 | **HRO-P5** (optional) — bounded Jev recommendations behind a disabled flag | MRC-12, **G-EXPERIMENT** | X | Single Jev surface = `jev-decisions` `alpha/decisions` per ruling A; retain only if predeclared thresholds pass |
| MRC-20 | RB-6 catalogue bytes capture (carried nit, §4.3) | — | P-A | — |
| MRC-21 | **JEV-P5** external release rows — registry push, attestations, CVE scan/tooling | **G-JEV-EXT** | P-A | Blocked externally with exact causes (§1 row 9); does not gate any other task |
| MRC-22 | **GMF-P2A** — durable Runtime authority/accounting store + migration | — | P-A (GMF slot 1) | Gate 2 granted 2026-09-27 (exact spec + 12 Allowed Files); separate Keon repos; not on the HRO/RCM critical path |
| MRC-23 | **GMF-P2B** — atomic validation/spend/reservation/pending-effect transaction | MRC-22 | P-A (GMF slot 2) | Re-gates per charter |
| MRC-24 | **GMF-P2C** — terminal reconciliation, lease recovery, settlement, verification primitives | MRC-23 | P-A (GMF slot 3) | Re-gates per charter |
| MRC-25 | **GMF-P3A–P9 tail** — model gateway (P3A→P3B), executor (P4A→P4B→P4C), MCP admission (P5), Promotion Actuator (P6), foreman adapter (P7), offline verifier (P8), adversarial E2E (P9). **Cluster: shapes as ten independently specced parcels MRC-25.1…25.10, each with its own worktree/branch, two reviews, and gate stops per the GMF charter** | MRC-24, **G-GMF-HR1**, **G-GMF-AUTH** | P-A (GMF tail) | Sub-graph: P3B←P2C+P3A; P4B←P2C+P4A; P4C←P3B+accepted P4B; P5←P1+P2C; P6←P1+P2C+P4C; P7←P3B+P4C+P5+P6; P8←P1+P2C+P3B+P4C+P5+P6; P9←P7+P8 (charter phase graph + Amendment A1). MRC-25 is a dispatch-table cluster ID only (wrapper charter D7) |

### External gates (listed, never executed here)

| Gate | Blocks | Nature |
|---|---|---|
| **G-MERGE** | MRC-07 (hard), MRC-14, all release/exit claims | Owner's human Gate-3 git merges of the built chains (RCM-P1 branch, Window-R, PMC Wave-1, HRO-P0–P2, JEV, GMF) |
| **G-LIVE** | MRC-13 smoke half, MRC-17 | Owner-authorized credentials/budget for synthetic live provider calls |
| **G-AVAIL** | L1/L2/L3/L4/DELTA_L enablement claims | Owner-authorized availability evidence (a54 rule; fail-closed by design until granted) |
| **G-JEV-EXT** | MRC-21 | External release tooling/registry access (registry push, attestations, CVE tooling) |
| **G-GMF-HR1** | MRC-25 (P3A/P4A) | Human creation/protected base commits of `keon-model-gateway` + `keon-fleet-executor` |
| **G-GMF-AUTH** | GMF external-effect rows within MRC-25 (paid inference P3B, private-source disclosure, patch promotion P6) | Ungranted standing GMF authorities; each is a separate explicit human act (charter standing-authorizations table) |
| **G-EXPERIMENT** | MRC-19 | Approved Jev experiment budget with predeclared thresholds |

### Parallel summary for the shaping agent

- **Any time, in parallel with Lane G:** MRC-01, MRC-04, MRC-20 (no contested writes); MRC-21 (externally blocked); the GMF chain MRC-22→23→24→25 (serial within itself, separate repositories).
- **Lane G strict order:** MRC-02 → MRC-03 → MRC-05 → MRC-06 → MRC-07 → MRC-08 → MRC-09 → MRC-10 → MRC-11 → MRC-12 → MRC-13. No two Lane-G tasks may be dispatched concurrently.
- **Parallel with Lane G after their own predecessors:** MRC-14 → MRC-15 → MRC-16 (read-only evidence chain).
- **End:** MRC-17 → MRC-18; MRC-19 optional behind G-EXPERIMENT.

### Exclusions and surfaced items

- Out of this chain: `foreman-line-boundary-routing` nits (gaps 2–6, live Jev smoke receipt), FK/HCS/FOC/scaffolder work, and the four §3 human hand-items — not model-routing chain tasks (§6 cross-check).
- **Surfaced open decision (not ordered here):** `rcm-p2-scope-reconciliation` §4(e) names a Gate-1-level tension — shipped `resolveRoute` cost-ordering on lane L5 (PMC A3 rubric) vs RCM D3's "no dispatch-time sort". Enforcement of D3 over A3 for L5 is a human Gate-1 reopening of D3/A3; until decided, L5 cost ordering stands as ratified rubric text.
- **Status note:** the report's §1 row 8 says "RCM-P1–P3 built" and lists remainder "RCM-P4A–P10"; per the RCM charter and `rcm-p2-scope-reconciliation` §2/§5 the RCM-P4 predicate implementation landed in Window R but its charter acceptance evidence is not recorded — MRC-03 carries that closure so nothing is dropped.
