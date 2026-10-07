# Goal Charter — CI Fail-Fast: change-proximity ordering and trusted local preflight

**Goal slug:** `ci-fail-fast`
**Created:** 2026-10-07
**Owner:** Clinton Morgan
**Status:** **RATIFIED 2026-10-07 — Gate 1 granted** (verbatim: "Gate 1 granted.
Ratify all recommendations, as written"); Stage Zero reconciliation installed
as D1–D10 and the CFF-P0…P4 graph. Plan-level adversarial review is next;
no parcel has been shaped or dispatched.
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
skip list, so local green means green.

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
| D7 | The path→package affection relation is a **measured, pinned cross-package import graph** (pinned like `COST_TABLE`/`READER_SET`; measured, not asserted). Any package, path, or import the pin does not cover fails closed to the full discovery-order sweep per D6. CFF-P0 measures it; CFF-P1 and CFF-P2 consume it. | The AC4 barrier exists because relative sibling imports load sibling source; prefix-based affection is unsound. This is the load-bearing correction from Stage Zero. |
| D8 | The **early-red signal is signal-only**: a shard's hard failure is surfaced as a first-class signal as soon as its shard emits it. The verdict is untouched — aggregation still requires all shard artifacts, reconcile is unchanged, and no early path can ever green a head. | The observed 2026-10-07 latency was dominated by the verdict waiting for the slowest shard while the red already existed in a job log. Surfacing ≠ deciding; the verdict's fail-closed semantics are load-bearing. |
| D9 | The local preflight verdict is **"no new failures versus a recorded local baseline."** The baseline is pinned, dated, and fail-closed on staleness. `waived-in-ci` is an informational status, **never a local waiver grant** — waiver pins are proven at CI's environment (node 24.19.0, windows-latest; R15 dropped non-cross-environment markers for cause). | The dispatch suite's 279 pre-existing local failures make absolute local green unattainable; baseline-diff keeps the signal honest without a whole-suite blind spot. Local must not certify what it cannot prove, nor retrain cry-wolf with raw waived-identity reds. |
| D10 | Waiver-set expiry and cost-table re-measurement are **this goal's bookkeeping** (the closure record routes both to the next runner-touching parcel). CFF-P0 records the live assignment fallback and all four dead waivers; CFF-P1 carries the 30-package measured cost-table re-pin as a **re-measurement, not a mechanism change**. | Shard balance directly bounds the latency this goal exists to cut; the dead waiver set is pure liability until re-measured; both were pre-authorized bookkeeping under ci-optimization's own closure rule. |

## Parcel decomposition (ratified graph)

| Parcel | Outcome | Risk / routing | Dependencies |
|---|---|---|---|
| CFF-P0 — Recon and baseline | Records the current sweep timeline anatomy (install cost, per-package serial position, failure-to-signal latency, verdict latency vs. first-red latency) from real runs incl. PR #155's three cycles; records the live round-robin fallback and all four dead waivers; measures and pins the D7 cross-package import graph; re-runs the C9-class measured read-sweep over the post-CI-P2 cohort (kernel-import, ops-console, project-scaffold); maps the waiver's input assumptions. | standard-risk with architecture review (reads the runner, changes nothing) | none |
| CFF-P1 — Change-proximity ordering + early-red signal | Shard assignment mechanism unchanged (re-pinned 30-package cost table per D10); within each shard, checks ordered by diff proximity over the D7 graph with deterministic tie-break; per-package output capture contract preserved per D3; the D8 early-red signal surface (signal-only). | critical / architecture-risk, two reviews | CFF-P0 |
| CFF-P2 — Local preflight parity | New `local --affected` mode: same classification engine (D2), D7 affection graph, D9 baseline-diff verdict, D4 named platform-skip registry with printed skip ledger, `waived-in-ci` informational status, fail-closed to full local sweep on any uncertainty. | critical / architecture-risk, two reviews | CFF-P0 |
| CFF-P3 — Gate-job surface-pin precheck | D5 as decided: single-source pin-table extraction, three-state hash comparison in the gate job, no test execution, required-check identity preserved via R1 layer 2. | high / architecture-risk, two reviews | CFF-P0 |
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
   unchanged; a relevance-engine or affection-graph error falls back to full
   discovery-order sweep; an unknown platform case never silently skips; an
   uncovered package/path/import in the D7 pin fails closed; the early-red
   signal never alters a verdict (all-artifact reconcile still decides); and
7. a committed evidence manifest states what is mechanically enforced,
   detected, sampled, human-judged, unsupported, and deferred — including the
   measured before/after failure-to-signal latency and the disposition of all
   four dead waiver entries.

## Human gates and standing authority

- **Gate 1:** GRANTED 2026-10-07 (verbatim: "Gate 1 granted. Ratify all
  recommendations, as written").
- **Gate 2:** not granted. Request only for the final named parcel graph after
  the plan-level adversarial review; per-parcel vs. per-graph cadence is
  decided at that request.
- **Gate 3:** not delegated. Every merge to a workflow, the CI runner, or the
  reuse/waiver machinery remains human-owned.

## Stop conditions

Stop and report if a second change-detection implementation is proposed; a
second surface-pin source is proposed; the waiver's input contract would
change shape; a local waiver grant is proposed (local `waived-in-ci` is
informational only); the early-red signal is proposed to alter, shortcut, or
replace the all-artifact verdict; a platform skip would be recorded without a
named reason and evidence; a whole suite would be skipped rather than
baseline-diffed; ordering would interleave per-package output; the relevance
engine's coverage is found incomplete for a package class; the D7 affection
pin cannot be measured for a package class; or any merge-gate
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
routing recorded from the interrogation probes. Gate 2/3 remain ungranted.
Next step: plan-level adversarial review (fresh frontier session, zero
coordinator context beyond charter + repo canon) before any parcel is shaped.
