# Plan-Level Adversarial Review — Triage Record (2026-10-07)

**Goal:** `ci-fail-fast` · **Charter under review:** `charter.md` (RATIFIED 2026-10-07, D1–D10, CFF-P0…P4)
**Review session:** fresh frontier session, zero coordinator context beyond charter + repo canon (COORDINATOR-PATTERN §Plan-level adversarial review). Findings 1–6 as returned; mandate answers: decomposition mostly coherent; the load-bearing-but-unexamined decision is D9; the silent collision is CFF-P1∩CFF-P2∩CFF-P3 on shared files; D7 is pinnable only under redefinition.

**Coordinator duty performed:** checkable claims reproduced before triage:

- ✅ Reproduced: `ci-reuse.mjs:623` — rule 0 refuses every non-`pull_request` event; on push the gate emits `base_sha: ''`; `evaluateChain` is PR-only. Finding 2's factual core is exact.
- ✅ Reproduced: discovery returns 30 packages / `COST_TABLE` pins 27 (Stage Zero reconciliation #2); `EXPECTED_SKIPS` empty; CLI is `resolve | shard | aggregate`; matrix `fail-fast: false`.
- ✅ Confirmed against source: R15's cross-environment marker drops (kernel-lease/authority-registry pin comments); FK-P17's "pins bind committed bytes only" (`surface-refs.ts` header); lesson #48 (value pins measured where they run) in the ci-optimization closure record.
- ➖ One reviewer claim is deliberately NOT adopted: finding 5's "cancelling remaining shards strands the required test context pending-forever" is a branch-protection-semantics claim needing inference. Resolved structurally instead — D8' prohibits any scheduling change outright, so no branch-protection question ever arises (stop condition "merge-gate identity needs inference" stays un-fired).
- ✅ New fact, relevant to finding 2's fix: the runner already reads the event payload via `GITHUB_EVENT_PATH` (`ci-reuse.mjs:1086`) — a shared diff seam needs **no workflow change**, which disarms the P1∩P3 collision.

## Dispositions (table appended to the review transcript)

| # | Finding | Disposition | Ruling |
|---|---|---|---|
| 1 | D9 baseline trust model unspecified; "local green means green" overclaims | **Fix** — mutates D9 + Objective | Accepted as stated. The R15 precedent argument is decisive: a committed single-machine baseline would re-kill what R15 killed; an uncommitted one has no integrity anchor; staleness-as-guard is the poisoning seam. Amendment drafted (D9' below) on the machinery the review names: identity-keyed content, R18 echo at regeneration, affected-set-keyed staleness, FK-P17 dirty-tree refusal. |
| 2 | CFF-P1 diff source undefined on push; P1∩P2∩P3 file collisions unsequenced | **Fix** — new locked decision D11 + graph edits | Accepted as stated; fix routed through the shared `ci-reuse.mjs` seam (one differ) with `GITHUB_EVENT_PATH` base selection (no workflow change), plus explicit serialization (below). No stop condition fires. |
| 3 | D7 relation misnamed (import vs read), measurement-env non-transfer, P1/P2 criticality asymmetry | **Fix** — amends D7 | Accepted as stated. The materialization/fixture/generation couplings in the post-CI-P2 cohort are read edges, not import edges; the pin is redefined as a C9-class measured **read graph**, single measurement with two projections (with READER_SET — finding 6's non-drift requirement folded in), consumed only in the over-approximation direction. |
| 4 | No maintenance owner/trigger/drift-check for the D7 pin; fallback loudness unrouted | **Fix** — D10 extension, graph intact | Accepted; no new parcel needed. Maintenance owner + trigger + runtime re-derive-and-compare named (D10'); fallback loudness routed to CFF-P1 as artifact+summary surface. |
| 5 | D8 surface unnamed; exit criterion 4 depends on it | **Fix** — pins the surface in D8 | Accepted; surface named (shard-early-exit + sanitized annotations) with structural prohibitions. The pending-forever claim not adopted (see above). |
| 6 | Routing/dependency minors | **Accept-as-documented / informational** | (a) CFF-P3∥CFF-P0: accepted, dependency dropped. (b) CFF-P0 under-routed: accepted — the D7 measurement deliverable requires two independent reviews. (c) P3 does not fix the waiver-staleness class: accepted-as-documented, named in exit criterion 7 as detected-not-prevented. (d) READER_SET vs D7 one sweep: accepted into D7'. |

## Gate 1 re-open (scoped) — proposed amendments, pending developer re-ratification

Per the pattern, the re-open is scoped: this text mutates locked-decision content and is **not installed until the developer explicitly ratifies** (Stage Zero rule 3). Blocking map:

| Re-opened element | Blocks | Unblocked |
|---|---|---|
| D7' (read graph) | CFF-P0's **measurement deliverable** (defines what is measured); CFF-P1 ordering semantics; CFF-P2 exclusion rule | CFF-P0's recon/baseline deliverables (timeline anatomy, fallback record, dead waivers, waiver input map) |
| D8' (named surface) | CFF-P1's early-red implementation; CFF-P4's exit-criterion-4 measurement | CFF-P2, CFF-P3 |
| D9' (baseline trust model) | CFF-P2 entirely (verdict semantics) | CFF-P0, CFF-P1, CFF-P3 |
| Objective wording | nothing operational | all |
| D10'/D11 + graph edits | CFF-P1's re-pin framing; P2 sequencing; the Gate 2 request shape | — |

### Proposed amendment text

**Objective (sentence 2, amended):** "…runs exactly the packages the diff touches, with the Windows-only cases on a named, pinned skip list, so a green local run is evidence the diff introduces no new failures on the affected packages — skips and baseline deltas printed." *(Removes the "local green means green" overclaim; the verdict's definition is D9's alone.)*

**D7 (amended):** The path→package affection relation is a **measured read graph** — what any check of the swept set opens at test time, including non-import couplings (materialized temp-repo reads, fixture path strings, generation targets). **One measurement pass, two projections** (the C9 `READER_SET` and the affection pin); never two read sweeps. Measurement discipline mirrors C9 (measured, not asserted; pinned by regression fixtures) with R15's cross-environment rule: edges proven under one environment only are named variance edges and always affect, never exclude. The pin is consumed **only in the over-approximation direction** — absence of a proven edge never excludes a package; any uncovered package, path, or environment-gated read fails closed to the full discovery-order sweep (D6). Criticality grading: CFF-P1 consumes it fail-safe (over-report mis-orders latency only); CFF-P2 consumes it fail-open if it ever under-reports, so its exclusion rule is monotone — a package runs unless the pin positively covers it.

**D8 (amended):** The early-red surface is named and bounded: (a) **shard-early-exit** — `runShard` exits non-zero at the first non-waived failure; its artifact records the partial state and `reconcile` fails closed on it (`missing-checks` / `unexpected-skip`); (b) **sanitized `::error`/`::warning` annotations** emitted by the runner at failure time (fields through `sanitizeField`, never raw captured text). Structurally prohibited: cancelling sibling shards, any change to `needs`/job scheduling, any early-green path, and any check-run/status emitter (`checks: write`/`statuses: write` are not granted and would force branch-protection inference). Invariant: the required `test` context reaches a terminal state on every run exactly as today; the surface changes when a *red* is visible, never when a verdict is rendered.

**D9 (amended — trust model):** The local baseline is a **pinned artifact in the waiver-pin class**:
- *Content:* per (package, check) the parsed failing-test **identity set** (R7 `failingTestNames` shape — names, never raw output, never counts), named variance/flaky members per R15 (non-cross-environment identities are present-or-absent, never gate), and the environment fingerprint measured under.
- *Storage:* committed, golden-tested like the waiver pins. FK-P17's amendment integrity rule applies: a baseline binds committed bytes only — **regeneration on a dirty tree is refused**.
- *Writer / regeneration authority:* regeneration is an explicit, named developer act in the standing-constraint-#34 class ("a baseline change is a spec amendment") — never automatic, never a command that makes preflight pass, never available to a dispatched agent. Every regeneration **echoes its added/removed identities** (R18 surface-and-ratify channel) and its diff is reviewed in the carrying change.
- *Verdict:* "no new failures versus baseline" — a new identity fails; a resolved identity passes and prints a shrink suggestion. The delta presentation is mandatory and eye-reviewable at single-digit sizes; a bulk delta (the 279-class) prints as a counted summary plus a reviewable path.
- *Staleness:* keyed to the affected set and identity drift, **never wall-clock**. An entry whose observed identity set diverges is reported (adds fail / removals prompt the named shrink); an unmeasured environment fails closed to the full local sweep.
- *Poisoning seams closed by construction:* builder regeneration impossible (named act + visible echoed diff); npm-lifecycle skew carried by the environment fingerprint + R15 variance lists; developer re-baselining is a visible, reviewable, echoed diff.

**D10 (amended):** (a) "re-measurement, not a mechanism change" reworded: *the re-pin restores the ratified cost-aware assignment (CI-P2 / A2 placement 11b) — filling the table from 27 to 30 flips `costKnown` true and the live mechanism from round-robin back to cost-aware; reconcile re-derives from the same table, so the switch is intentional, safe, and named.* (b) The D7 read-graph pin carries a **named maintenance owner and trigger**: owner = the runner-touching parcel's Stage-F bookkeeping (same rule as waiver expiry); trigger = any parcel touching the runner, the swept set, or the check surfaces; **runtime drift check** = re-derive-and-compare in the gate job (CFF-P3's precheck — FK-P17 pattern). (c) **Cost-table coverage loudness** is routed to CFF-P1: any discovered name absent from the table is surfaced in the step summary and the shard-outcomes artifact (named field) — before and after the re-pin, never silent.

**D11 (new):** The changed-paths set has **one source**: a shared diff export in `ci-reuse.mjs` (`parseNameStatusZ`/`classifyPath` consumed, never reimplemented). Base selection from the event payload at `GITHUB_EVENT_PATH` (PR base on `pull_request`; `event.before` on `push`; absent or all-zeros → D6 fail-closed to discovery-order/full sweep). No runner-local differ; no dependency on gate outputs (which rule 0 empties on push). The P1∩P3 collision is disarmed by construction: P1 needs no workflow change.

**Graph edits:** CFF-P3's dependency on CFF-P0 is dropped (parallel); CFF-P0's **D7 measurement deliverable** requires two independent reviews (its recon deliverables retain standard risk with architecture review); **CFF-P1 and CFF-P2 serialize on `scripts/foreman-line-ci.mjs`** (P2 shapes after P1 merges — the file graph is now explicit); CFF-P3 is parallel with both (it touches `surface-refs.ts`/`surface-pins.test.ts` + the gate job's precheck step only), its scope extended by the D10'(b) drift check only after D7' ratification; CFF-P4 unchanged.

**Exit criterion 7 (addition):** the evidence manifest additionally names the **waiver-pin staleness class** (2 of 3 PR #155 cycles) as *detected-not-prevented* — CFF-P3's precheck does not fix it; the waiver failingSet for bypass-outage-harness still encodes pin-state-dependent test names.

## Next action

Scoped Gate 1 re-ratification requested from the developer for the amendment text above (D7', D8', D9', Objective, D10', D11, graph edits). Gate 2 remains ungranted — **no standing authorization exists in this goal** (the review's "may proceed under standing authority" is corrected against the loop directive); the developer may grant an early scoped Gate 2 for CFF-P0-recon + CFF-P3 (original scope) per lesson #27, or hold Gate 2 for the amended final graph. CFF-P1, CFF-P2, and CFF-P4 shaping is blocked until re-ratification closes the re-opened decisions.
