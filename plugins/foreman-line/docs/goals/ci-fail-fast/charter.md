# Goal Charter — CI Fail-Fast: change-proximity ordering and trusted local preflight

**Goal slug:** `ci-fail-fast`
**Created:** 2026-10-07
**Owner:** Clinton Morgan
**Status:** **RATIFIED 2026-10-07 — Gate 1 granted twice**: initial
ratification ("Gate 1 granted. Ratify all recommendations, as written") and
scoped re-ratification after the plan-level adversarial review ("1. ratify as
written" of the amendment package in
[`plan-review-triage-2026-10-07.md`](plan-review-triage-2026-10-07.md)).
D1–D11 locked as amended. **Gate 2 granted early and scoped** ("gate 2 early
grant issued" — CFF-P0 and CFF-P3). Gate 3 not delegated.
**Coordinator:** claimed 2026-10-07 (Stage Zero session); ownership block in
`loop-directive.md`
**Mode:** repo-local CI architecture goal
**Design inputs:** closed `ci-optimization` goal (CI-P1 reuse, CI-P2 sharding;
`../ci-optimization/goal-closure-2026-10-02.md`); PR #155's 2026-10-07
three-cycle failure anatomy (measured from live runs; see Stage Zero
reconciliation below); `scripts/foreman-line-ci.mjs` waiver machinery
(R7/R15/R16); `scripts/ci-reuse.mjs` classification engine (C9/READER_SET);
FK §15.4

## Objective

Make CI failures surface in minutes, not shard-lengths, and make the local
pre-push run trustworthy enough that the BYP-SH-01 class of breakage never
reaches CI. The reuse gate (CI-P1) and the shard matrix (CI-P2) stay; this
goal fixes what they don't cover: failure-discovery latency *inside* a sweep,
and the local/CI platform skew that has trained everyone not to run locally.

Two outcomes, one goal: (a) a swept failure's information exists in the first
minutes of the shard that owns it, and a shard's hard failure is surfaced as
a first-class signal without waiting for the slowest shard; (b) a NEW
`node scripts/foreman-line-ci.mjs local --affected` mode (no `local` mode
exists today — the CLI is `resolve | shard | aggregate` only) runs exactly
the packages the diff touches, with the Windows-only cases on a named, pinned
skip list, so a green local run is evidence the diff introduces no new
failures on the affected packages — skips and baseline deltas printed. The
verdict's definition is D9's alone.

Neither outcome weakens the merge gate. The waiver machinery (markers,
counts, failing-set identity, fail-closed evaluation) is load-bearing
integrity surface and is modified only to *consume* better-ordered output,
never to relax a check.

## Stage Zero reconciliation (measured 2026-10-07, pre-ratification)

Live state was verified on disk and against live runs before Gate 1. Facts
that corrected or bounded the original draft:

1. **PR #155's anatomy, from the run logs** (cycles at 17:45 / 18:11 / 18:25,
   ~32 / ~26 / ~26 min wall each): the bypass-outage-harness failure's
   per-shard signal existed at **+2.5 min** in sweep (2)'s log in cycle 1 —
   bypass-outage-harness sits *first* in its shard's serial order. The
   binding latency was the **verdict waiting for the slowest shard**
   (reconcile requires all 4 artifacts; the matrix is `fail-fast: false`),
   plus authority-registry's own **1407s suite** bounding its failure-to-signal
   regardless of serial position. Two of the three cycles' failures were
   **waiver-pin staleness events** (run-then-waive correctly refusing,
   fail-closed, because the pinned failures had been *fixed* — the FK-P17
   spec now exists; the R31 drift marker is gone). Within-shard serial
   position was NOT the binding constraint in any observed cycle.
2. **Shard assignment is silently in its documented round-robin fallback.**
   Discovery finds 30 packages; the pinned `COST_TABLE` has 27
   (`kernel-import`, `ops-console`, `project-scaffold` absent). The ratified
   cost-aware assignment (A2 placement 11b) is not the mechanism in force,
   and nothing signals the fallback.
3. **The entire `WAIVED_EXCLUSIONS` set is dead on green main** (`fb25630`,
   run 37674775022): all four waived identities (bypass-outage-harness,
   kernel-lease, authority-registry, jev-decisions) record pass, not waived.
   Run-then-waive makes this safe (green never consults a pin; any regression
   re-gates red); expiry bookkeeping routes to this goal per the closure
   record's rule ("the next runner-touching parcel's Stage-F").
4. **The relevance engine has no package-level output.** `ci-reuse.mjs`
   emits per-path five-class classification and four whole-tree class hashes;
   nothing maps a diff to affected packages. C9/READER_SET proves coverage of
   the *ordinary-documentation classification* only, and the AC4 sibling-
   import barrier means path prefixes alone cannot soundly derive package
   affection. The three post-CI-P2 packages were inspected (ops-console tests
   run against materialized temp repos; kernel-import references are fixture
   paths; project-scaffold references are generation targets) — reader
   coverage appears intact, but a C9-class measured read-sweep re-proof over
   the post-CI-P2 cohort is a CFF-P0 task, not an assumption.
5. **Waiver input contract confirmed order-independent** (per-(package, check)
   captured output at the invoke seam; `reconcile` compares with `sameSet`),
   and the required check identity (`test` job, AC5) is preserved by a
   gate-job precheck via R1 layer 2 — no branch-protection inference needed.

## Locked decisions (ratified 2026-10-07)

| ID | Decision | Reasoning |
|---|---|---|
| D1 | Scope is exactly: change-proximity check ordering, the early-red signal (D8), local preflight parity, and gate-job surface-pin precheck. No runner-count, provider, or pricing changes; no workflow identity changes. **Green full-sweep wall time (~30 min, authority-registry bound) is explicitly declined** — no parcel is judged against it. | The pain is failure-latency and trust, not capacity or green latency; branch-protection compatibility is preserved by construction. |
| D2 | One classification engine: `ci-reuse.mjs`'s `classifyPath`/`READER_SET` is **imported, never reimplemented** — no second differ. The engine's actual outputs are per-path classification and four whole-tree class hashes; package-level affection is NOT among them and is provided by D7, not by overreading C9. | A second change-detection implementation is a guaranteed drift source. C9 proves the ordinary-documentation classification, not a path→package map; claiming otherwise was the draft's one factual error. |
| D3 | Reordered output remains per-package captured and **shape-stable**: same stream concatenation (stdout+stderr), same per-(package, check) granularity, same waiver parsing. Output bytes themselves are never run-stable (embedded timings); `output_sha256` is recorded per-run, never pinned. | The waiver machinery is fail-closed integrity surface; ordering must not become a waiver bypass channel. "Byte-stable" was the wrong word and would have been weaponized at review. |
| D4 | The local preflight's platform-skip list is a pinned, named registry (id, test name, platform, reason, evidence link) — never an inline filter, never a whole-suite skip. A local run that skips prints the skips. | Silent skips recreate the cry-wolf problem under a new name; named skips are auditable and shrinkable. Whole-suite skips are a blind spot the size of the original problem (see D9). |
| D5 | Surface-pin drift (the surface-refs sha256 class) moves to the gate job as a hash comparison with **no test execution**. The pin table is extracted to a **single plain-data source consumed by both the package test and the gate script** — never a duplicated table. The **three-state discipline is preserved** (match / known-base-with-gap-reason / drift); the precheck is not a binary. | Half of cycle 1's BYP rejection was surface-pin drift; a hash compare needs no 45-minute shard. A second pin source would be a drift channel; collapsing KNOWN-GAP to binary would silently weaken the pin semantics. |
| D6 | Fail-closed preserved: on any ordering/preflight/affection computation error, behavior reverts to **the mechanism's** full discovery-order shard and full local sweep — "today's behavior" pinned by reference to `assignShards`/`runShard` as ratified, not to a snapshot of whatever mode happened to be live. | A latency optimization must never become a coverage hole. The live assignment was found in round-robin fallback (reconciliation #2); the fallback definition must not fossilize that accident. |
| D7 | The path→package affection relation is a **measured read graph** — what any check of the swept set opens at test time, including non-import couplings (materialized temp-repo reads, fixture path strings, generation targets). **One measurement pass, two projections** (the C9 `READER_SET` and the affection pin); never two read sweeps. Measurement discipline mirrors C9 (measured, not asserted; pinned by regression fixtures) with R15's cross-environment rule: edges proven under one environment only are named variance edges and always affect, never exclude. The pin is consumed **only in the over-approximation direction** — absence of a proven edge never excludes a package; any uncovered package, path, or environment-gated read fails closed to the full discovery-order sweep (D6). Criticality graded: CFF-P1 consumes it fail-safe (over-report mis-orders latency only); CFF-P2 consumes it fail-open if it ever under-reports. **Amended 2026-10-08 (scoped Gate-1 re-open, re-ratified by developer directive "amend Q2 as proposed" after the CFF-P0 adversarial reviews — `cff-p0-review-triage-2026-10-08.md` E2):** CFF-P2's exclusion rule is positive-coverage-only AND manifest-bounded — a package is excluded from a run only when the current diff intersects NONE of its pinned read-set edges AND the package is not named in CFF-P2's `ALWAYS_RUN` manifest of packages with measured probe-blind couplings (initial members: `approval` — git-subprocess diff helpers; `verification`, `schema-scaffold` — temp-tree materialization of repo content; final membership is evidence-bound at CFF-P2 shaping from CFF-P0's `known_blind_classes` disclosure). Absence of an edge is never sufficient grounds to exclude a manifest-listed package. Extending the probe to `child_process` surfaces is a named follow-up, explicitly NOT this goal's scope. CFF-P1's fail-safe consumption is unchanged by this amendment. CFF-P0 measures it (two independent reviews on the measurement deliverable); CFF-P1 and CFF-P2 consume it. | The AC4 barrier exists because relative sibling imports load sibling source; the post-CI-P2 cohort couples through materialization/fixture/generation edges no import graph sees (plan-review finding 3). Over-approximation-only is the direction that cannot under-cover. |
| D8 | The early-red signal is signal-only, and the **surface is named and bounded**: (a) **shard-early-exit** — `runShard` exits non-zero at the first non-waived failure; its artifact records the partial state and `reconcile` fails closed on it (`missing-checks` / `unexpected-skip`); (b) **sanitized `::error`/`::warning` annotations** emitted by the runner at failure time (fields through `sanitizeField`, never raw captured text). Structurally prohibited: cancelling sibling shards, any change to `needs`/job scheduling, any early-green path, and any check-run/status emitter (`checks: write`/`statuses: write` are not granted and would force branch-protection inference). Invariant: the required `test` context reaches a terminal state on every run exactly as today; the surface changes when a *red* is visible, never when a verdict is rendered. | The observed 2026-10-07 latency was dominated by the verdict waiting for the slowest shard while the red already existed in a job log. Surfacing ≠ deciding; the verdict's fail-closed semantics are load-bearing. An unnamed surface would be shaped into whichever interpretation the shaping session prefers — exit criterion 4 must measure something concrete (plan-review finding 5). |
| D9 | The local preflight verdict is **"no new failures versus a recorded local baseline."** The baseline is a **pinned artifact in the waiver-pin class**: *content* is per (package, check) the parsed failing-test **identity set** (R7 `failingTestNames` shape — names, never raw output, never counts), named variance/flaky members per R15 (non-cross-environment identities are present-or-absent, never gate), and the environment fingerprint measured under; *storage* is committed, golden-tested like the waiver pins, binding committed bytes only (FK-P17 amendment integrity rule — **regeneration on a dirty tree is refused**); *regeneration* is an explicit, named developer act in the standing-constraint-#34 class ("a baseline change is a spec amendment") — never automatic, never a command that makes preflight pass, never available to a dispatched agent — and every regeneration **echoes its added/removed identities** (R18 surface-and-ratify channel) with the diff reviewed in the carrying change. Verdict detail: a new identity fails; a resolved identity passes and prints a shrink suggestion; delta presentation is mandatory and eye-reviewable at single-digit sizes (a bulk delta prints as a counted summary plus a reviewable path). *Staleness* is keyed to the affected set and identity drift, **never wall-clock**: a diverging entry is reported (adds fail / removals prompt the named shrink); an unmeasured environment fails closed to the full local sweep. `waived-in-ci` is an informational status, **never a local waiver grant** — waiver pins are proven at CI's environment (node 24.19.0, windows-latest; R15 dropped non-cross-environment markers for cause). | The dispatch suite's 279 pre-existing local failures make absolute local green unattainable; baseline-diff keeps the signal honest without a whole-suite blind spot. The trust model is load-bearing (plan-review finding 1): a committed single-machine baseline re-kills what R15 killed; an uncommitted one has no integrity anchor; staleness-as-guard is the poisoning seam. Identity-keyed content, dirty-tree refusal, named-act regeneration with echo, and affected-set staleness close every named poisoning seam (builder regeneration, npm-lifecycle skew, inadvertent re-baselining) by construction. |
| D10 | Waiver-set expiry and cost-table re-measurement are **this goal's bookkeeping** (the closure record routes both to the next runner-touching parcel). CFF-P0 records the live assignment fallback and all four dead waivers; CFF-P1 carries the 30-package cost-table re-pin as a re-measurement that **restores the ratified cost-aware assignment** (CI-P2 / A2 placement 11b): filling the table from 27 to 30 flips `costKnown` true and the live mechanism from round-robin back to cost-aware; reconcile re-derives from the same table, so the switch is intentional, safe, and named. The D7 read-graph pin carries a **named maintenance owner and trigger**: owner = the runner-touching parcel's Stage-F bookkeeping (same rule as waiver expiry); trigger = any parcel touching the runner, the swept set, or the check surfaces; **runtime drift check** = re-derive-and-compare in the gate job (CFF-P3's precheck — FK-P17 pattern). **Cost-table coverage loudness** is routed to CFF-P1: any discovered name absent from the table is surfaced in the step summary and the shard-outcomes artifact (named field) — before and after the re-pin, never silent. | Shard balance directly bounds the latency this goal exists to cut; the dead waiver set is pure liability until re-measured; both were pre-authorized bookkeeping under ci-optimization's own closure rule. The framing "not a mechanism change" was factually wrong in effect and is corrected (plan-review finding 4): the re-pin flips the live mechanism back to the ratified one, deliberately. A coverage-bearing pin needs a maintenance owner; COST_TABLE staleness degrades latency (fail-safe), D7 staleness degrades coverage (silent). |
| D11 | The changed-paths set has **one source**: a shared diff export in `ci-reuse.mjs` (`parseNameStatusZ`/`classifyPath` consumed, never reimplemented). Base selection from the event payload at `GITHUB_EVENT_PATH` (PR base on `pull_request`; `event.before` on `push`; absent or all-zeros → D6 fail-closed to discovery-order/full sweep). No runner-local differ; no dependency on gate outputs (which rule 0 empties on push). | Rule 0 refuses every non-`pull_request` event (`ci-reuse.mjs:623`), so no gate output is a diff source on push; a runner-local differ is a second change-detection implementation — a named stop condition would fire on the first parcel. The `GITHUB_EVENT_PATH` seam already exists (`ci-reuse.mjs:1086`), so P1 needs no workflow change and never collides with P3 (plan-review finding 2). |

## Parcel decomposition (ratified graph)

| Parcel | Outcome | Risk / routing | Dependencies |
|---|---|---|---|
| CFF-P0 — Recon and baseline | Records the current sweep timeline anatomy (install cost, per-package serial position, failure-to-signal latency, verdict latency vs. first-red latency) from real runs incl. PR #155's three cycles; records the live round-robin fallback and all four dead waivers; **measures the D7 read graph** (one pass, two projections; output is a data artifact + fixtures — code installation rides CFF-P1/CFF-P2, keeping P0 read-only) and re-runs the C9-class measured read-sweep over the post-CI-P2 cohort (kernel-import, ops-console, project-scaffold); maps the waiver's input assumptions. | standard-risk with architecture review (reads the runner, changes nothing); **the D7 measurement deliverable requires two independent reviews** | none |
| CFF-P1 — Change-proximity ordering + early-red signal | Shard assignment mechanism unchanged (re-pinned 30-package cost table per D10); within each shard, checks ordered by diff proximity over the D7 graph with deterministic tie-break; per-package output capture contract preserved per D3; the D8 early-red signal surface (signal-only). | critical / architecture-risk, two reviews | CFF-P0 |
| CFF-P2 — Local preflight parity | New `local --affected` mode: same classification engine (D2), D7 read graph (monotone exclusion per D7), D9 baseline-diff verdict, D4 named platform-skip registry with printed skip ledger, `waived-in-ci` informational status, fail-closed to full local sweep on any uncertainty. | critical / architecture-risk, two reviews | CFF-P0; **shapes after CFF-P1 merges** (both extend `runCli` in `scripts/foreman-line-ci.mjs`) |
| CFF-P3 — Gate-job surface-pin precheck + read-graph drift check | D5 as decided: single-source pin-table extraction, three-state hash comparison in the gate job, no test execution, required-check identity preserved via R1 layer 2; D10's runtime re-derive-and-compare drift check for the D7 read-graph pin. **Expectation bound (plan-review finding 6c): does NOT fix the waiver-pin staleness class** — named in the exit manifest as detected-not-prevented. | high / architecture-risk, two reviews | none (parallel with CFF-P0) |
| CFF-P4 — Exit evidence | Deliberate-breakage proof PR fails fast in the right shard position with the early signal measured; BYP-SH-01-class case caught by preflight; before/after failure-to-signal latency against the CFF-P0 baseline; exit manifest. | high / architecture-risk, two reviews | CFF-P1, CFF-P2, CFF-P3 |

## Exit criterion

This goal exits only when:

1. the developer explicitly ratifies the final locked decisions, graph, and gates (DONE 2026-10-07 for this charter; re-opens per-decision if plan-review triage changes a locked decision);
2. a fresh plan-level adversarial review is triaged, with scoped re-ratification
   for every decision-changing fix;
3. all ratified CFF parcels complete the Foreman parcel loop and merge through
   human Gate 3, each with its required reviews;
4. a deliberately-broken change on a demonstration PR fails its shard with the
   breakage named in the first minutes — this criterion binds the
   **position-latency and early-signal classes explicitly** (a failing package
   late in a long shard; a shard red surfaced before the slowest shard
   completes). It does NOT bind the long-single-suite class
   (authority-registry's 1407s), which this goal declines;
5. the BYP-SH-01-class breakage (retired model id in a harness consumer) is
   caught by the local preflight before push, demonstrated on a real
   worktree — the criterion binds the **affected-package signal** (the diff's
   packages identified and run), not reproduction of CI's waiver evaluation;
6. negative controls prove: waiver evaluation consumes reordered output
   unchanged; a relevance-engine or affection-pin error falls back to full
   discovery-order sweep; an unknown platform case never silently skips; an
   uncovered package/path/read in the D7 pin fails closed; the early-red
   signal never alters a verdict (all-artifact reconcile still decides); the
   D9 baseline refuses dirty-tree regeneration and surfaces every identity
   delta; and
7. a committed evidence manifest states what is mechanically enforced,
   detected, sampled, human-judged, unsupported, and deferred — including the
   measured before/after failure-to-signal latency, the disposition of all
   four dead waiver entries, and the **waiver-pin staleness class (2 of 3
   PR #155 cycles) named as detected-not-prevented** (CFF-P3's precheck does
   not fix it).

## Human gates and standing authority

- **Gate 1:** GRANTED 2026-10-07 (verbatim: "Gate 1 granted. Ratify all
  recommendations, as written").
- **Gate 2:** GRANTED 2026-10-07 — early and scoped (verbatim: "gate 2 early
  grant issued"), covering dispatch of **CFF-P0 and CFF-P3** (see
  `loop-directive.md` for the verbatim grant, its contingencies, and the
  coordinator's stated scope interpretation). **FULL-GRAPH GATE 2 GRANTED
  2026-10-08** (verbatim: "full-graph Gate 2 granted") — covers **CFF-P1,
  CFF-P2, CFF-P4** within the ratified sequencing (P2 shapes after P1 merges;
  P4 gates on P1+P2+P3).
- **Gate 3:** not delegated. Every merge to a workflow, the CI runner, or the
  reuse/waiver machinery remains human-owned.

## Stop conditions

Stop and report if a second change-detection implementation is proposed; a
second surface-pin source is proposed; the waiver's input contract would
change shape; a local waiver grant is proposed (local `waived-in-ci` is
informational only); the early-red signal is proposed to alter, shortcut, or
replace the all-artifact verdict; a platform skip would be recorded without a
named reason and evidence; a whole suite would be skipped rather than
baseline-diffed; the D9 baseline would be regenerated by anything other than
a named developer act; a diff source outside the D11 shared seam is proposed;
ordering would interleave per-package output; the relevance engine's coverage
is found incomplete for a package class; the D7 read-graph pin cannot be
measured for a package class; or any merge-gate
identity/branch-protection compatibility question needs inference rather than
a recorded check.

## Relationship to live goals

- **ci-optimization (closed):** refines, never amends. Its closure record is
  the baseline authority for what reuse and sharding already guarantee; D10
  executes its named follow-up bookkeeping, it does not reopen it.
- **parcel-queue-and-claim (draft):** orthogonal; no shared files, no
  sequencing requirement. If both proceed, INDEX.md rows are reconciled by
  their respective claiming coordinators.
- **routing-policy / dispatch (Windows P/R):** no write scope; this goal reads
  package layout and test output only. The dispatch suite's 279 pre-existing
  local failures are out of scope as failures; D9's baseline mechanism exists
  precisely so they cannot mask or be masked.

## Gate 1 record

**RATIFIED 2026-10-07.** Drafted 2026-10-07 at owner direction ("Draft it. You
can choose how.") while PR #155 was in merge; committed unratified on
`chore/ci-fail-fast-charter` (PR #157). Stage Zero run by the claiming
coordinator per the kickoff directive: live state reconciled (reconciliation
§above), open questions surfaced as numbered decisions OD1–OD7 with
recommendations, no silent resolutions. Developer directive: **"Gate 1
granted. Ratify all recommendations, as written"** — installed as: D2 amended
+ D7 added (OD1); CFF-P1 reframed + D8 added (OD2); D5 amended (OD3); D9 added
(OD4); D10 added (OD5); pin precheck split to its own parcel CFF-P3, exit
evidence renumbered CFF-P4 (OD6); objective rephrased + `waived-in-ci` under
D9 (OD7); D1 green-latency decline, D3 shape-stable wording, D6
mechanism-reference wording, exit-criterion-4/5 class bindings, and CFF-P0
routing recorded from the interrogation probes. Gate 2/3 were ungranted at
initial ratification; the plan-level adversarial review ran next.

**Re-ratification record (2026-10-07):** the plan-level adversarial review
returned findings 1–6 (triage: `plan-review-triage-2026-10-07.md`; findings
1/3/5 mutated locked-decision text, Gate 1 re-opened scoped to D7/D8/D9 + the
Objective sentence). Developer directive: **"1. ratify as written"** —
installed as D7 (measured read graph, over-approximation-only, one measurement
two projections), D8 (named surface: shard-early-exit + sanitized annotations,
structural prohibitions), D9 (baseline trust model: identity-keyed content,
FK-P17 dirty-tree refusal, named-act regeneration with R18 echo,
affected-set-keyed staleness), D10 (mechanism wording corrected; pin
maintenance owner/trigger/drift check; coverage loudness), new D11 (shared
diff seam, `GITHUB_EVENT_PATH` base selection), Objective wording, graph edits
(P3∥P0, P2 after P1 on the runner file), and the exit-criterion-7
waiver-staleness clause. The same directive issued **"gate 2 early grant"**
for CFF-P0 and CFF-P3 (verbatim grant + contingencies in the loop directive).
Gate 3 remains human-owned.
