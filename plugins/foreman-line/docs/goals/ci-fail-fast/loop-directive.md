# Loop Directive — ci-fail-fast

**Created:** 2026-10-07, at Gate 1 ratification. Charter:
[`charter.md`](charter.md) (RATIFIED 2026-10-07, D1–D10, CFF-P0…P4).

## Ownership block

- **Owning coordinator:** the `/goal resume` coordinator session started
  2026-10-08 (developer directive: "resume coordination of CI improvements").
  One goal, one coordinator.
- **Ownership transfer:** only at parcel boundaries, via an edit to this
  block naming the successor and the boundary. Never ambient.
- **Transfer record (2026-10-08):** predecessor = the Stage Zero session that
  claimed the goal 2026-10-07 (this directive's original author). At resume
  time no predecessor coordinator process was live (no foreman-line
  coordinator among running sessions; last prior session activity
  2026-10-07T15:32Z). Boundary = the shaping-dispatch wave of 2026-10-07:
  CFF-P0 shaping delivered (spec + shaping result), CFF-P3 shaping
  undelivered (worktree clean). Recorded openly: the parcels are mid-flight at
  this handoff (shaping phase), not at a completed-parcel boundary; the
  transfer is made under the developer's explicit resume directive and this
  entry is the naming the rule requires.

## State

`cff_h1_building__p0_rework_pending__p1_rework_r1_step0__p3_reviews_in_flight__devdrop_shipped`
— 2026-10-08 (seventh iteration). **E1/E2 DISPOSED by the developer
("ratify Q1 / amend Q2 as proposed"):** E2's D7 amendment is installed in
the charter (scoped Gate-1 re-open, re-ratified — CFF-P2 exclusion becomes
positive-coverage-only + `ALWAYS_RUN` manifest {approval, verification,
schema-scaffold; evidence-bound at P2 shaping}; probe `child_process`
coverage = named follow-up, not scope growth; blocks CFF-P2 shaping only,
all other work orthogonal). E1's hotfix is **CFF-H1** — micro-parcel off
`main` (`fix/cff-h1-reader-set-goal-docs`, worktree
`../agent-skills-cff-h1`): exactly the five measured goal-doc paths into
`READER_SET` + mutate-bound regression test; Step-0 restate RULED CORRECT
(HEAD `dab6967e`, anchors :129/:157/:175/:190 verified coordinator-side,
defect re-confirmed on base); `cff_h1_builder_r1` building. Unbatched human
Gate 3 (batching suspended for the hotfix, per the ratification). **CFF-P1
reviews A+B DELIVERED, triaged** (`cff-p1-review-triage-2026-10-08.md`): no
verdict-integrity blockers; one lesson-#33 catch (spec weakened charter
D7's uncovered-package fail-closed clause) → **Amendment CFF-P1-A2** ruled
and committed alone (`ca934c48`: whole-run fallback trigger, concrete
recursive exclusion scan, best-effort annotations, E4 base correction) →
rework r1 dispatched (5 items, tripwire baseline 367; `cff_p1_rework1_step0`
in flight). **Dev-drop package SHIPPED**: closure check PASS (probe
byte-verbatim hash `3105d304`, Allowed-Files exact, host-gated refusal +
dry-run demonstrated, honest gaps incl. Node ≥ 24.2 requirement), scratch
branch merged to charter (`43c9bf8e`, pushed) — **the developer's Windows
act is now unblocked**: pull `chore/ci-fail-fast-charter`, `npm ci`, one
command per `read-graph/dev-drop/README.md`. P0 rework R1 dispatchable now
(the reducer exists); P3 review pair still in flight.

Prior state
`cff_p0_triage_done_rework_pending_devdrop__p1_built_reviews_running__p3_reviews_in_flight__e1_e2_pending_dev`
— 2026-10-08 (sixth iteration). **CFF-P0 reviews A+B DELIVERED and TRIAGED**
(`cff-p0-review-triage-2026-10-08.md`): two blockers, both reproduced
coordinator-side — E1 (READER_SET five-path hole LIVE in the merge gate;
charter stop condition "relevance coverage incomplete for a package class"
FIRED; developer question Q1 asked, hotfix recommended) and E2 (D7 pin's
exclusion-consumption by CFF-P2 is structurally exclusion-by-absence under
probe blindness; scoped Gate-1 re-open recommended, Q2). CFF-P0 is NOT
Gate-3-ready: rework R1 queued (re-derived fixture with ci-phase manifest
reads included, canonical reducer named, docs errata F3/F5/F7, blind-class
disclosure, AC1 timing corrections, c9-reproof corrections,
`dev_pass_status:"pending"` marker) — dispatch held until the dev-drop
reducer lands on `chore/cff-p0-dev-drop` (`cff_p0_devdrop_r1` building; its
Step-0 restate was RULED CORRECT with the G3 methodology-source ruling:
read the measurement log read-only from `feat/foreman-line-cff-p0`).
**CFF-P1 build DELIVERED** (`665b03bc..f953ecd3`, 10 commits, Allowed-Files
exact, tripwire 296→367 coordinator-verified at base and tip, deterministic
pass 367/367 on the coordinator's own run, exit 0) — **Amendment CFF-P1-A1**
ruled and committed alone (`73f9f624`): AC2 pinned to the measured
read-graph shape (`packages[name]` array ∪ `affection_pin[name]`),
variance-edge shape pinned `{package, path}`, E4 sanitizeOutput citation
(:175→:169). Two adversarial reviews dispatched (`cff_p1_review_a` pid
1201314 verdict-integrity angle, `cff_p1_review_b` pid 1201315
pin-consumption/hostile-input angle, both opus-5-5). **CFF-P2 shaping now
ALSO holds on E1/E2 disposition** (in addition to the P1-merge gate).
CFF-P3 review pair still in flight. Local `main` ref fast-forwarded
(`fb25630c..dab6967e`).

Prior state
`cff_p0_reviews_ab_running__p1_build_r1_running__p3_reviews_in_flight`
— 2026-10-08 (fifth iteration). **Dispatch mechanism established (developer
Q1, 2026-10-08):** fresh sessions are spawned headlessly from this pi harness
— `pi --model anthropic/claude-opus-5-5 -n <name> -p "<prompt>"` detached via
`setsid nohup`, logs at `~/.pi/dispatch-logs/ci-fail-fast/<name>.log`
(mechanism smoke-tested before first dispatch). Dispatched: `cff_p0_review_a`
(pid 797295) + `cff_p0_review_b` (pid 797575) per kickstarters A/B;
`cff_p1_builder_step0` restated and held — **Step 0 restate RULED CORRECT**
(spec SHA `ed40b2c4`, brief SHA `bf7e1ecc`/8196B identical in both checkouts,
HEAD `41b927de`, worktree clean, Allowed Files exact, zero writes — all
re-verified coordinator-side) — build re-dispatched as `cff_p1_builder_r1`
(pid 799411). Findings/records arrive as files on disk (reviewers write
their named findings file only, no commits — coordinator commits).
**PR #159 MERGED by the developer** (Gate 3, `dab6967e`, 2026-10-08T13:00:28Z)
— docs-only paper trail on main. Dev-drop packaging question asked of the
developer (see evidence trail); answer pending.

Prior state
`cff_p0_complete_reviews_queued__p3_reviews_in_flight__p1_active_build_dispatch_pending`
— 2026-10-08 (fourth iteration). **CFF-P0 build COMPLETE (AC1–AC6):** the
AC5 measured-capture delivery landed (`f34c5e74` + `500b8f54`) and passed
the coordinator closure check against disk (run `37768165017` success @
`2d81d926` verified via `gh`; scratch branch confirmed deleted; fixture
arithmetic 2,263,596 → 104,020 → 3,044 reconciles; 30/30 packages, 28/28
affection-pin entries with externals; READER_SET re-counted 25 and all five
reader-set-delta paths classify `ordinary_documentation`; AC5.6 reproduced
exactly: `code`/`code`/`ordinary_documentation`/`ordinary_documentation`).
Two-review mandate (charter, incl. the D7 measurement deliverable):
kickstarters `foreman-line-review-CFF-P0-A.md` (measurement
integrity/provenance) + `foreman-line-review-CFF-P0-B.md`
(contract/scope soundness) issued, **dispatch pending** (opus-5-5 per the
model policy). **CFF-P1 shaping lint PASS** with three coordinator-ruled
errata (E1 `hybrid-routing` "stale" claim REFUTED — it is discovered and
live; E2 kind-gate path description corrected; E3 CI-P2 reference moved to
`done/`) — none touch a locked decision; spec promoted `active` @ `41b927de`
on `feat/foreman-line-CFF-P1`; builder kickstarter
`foreman-line-build-CFF-P1.md` issued, **dispatch pending**. **CFF-P3
review pair (a2/b2, opus-5-5): nothing delivered on disk** as of this
iteration — still in flight per the dispatch record; wake protocol is
developer-ping, no polling. **Pending inputs:** dev-Windows supplementary
pass (`read-graph/dev-drop/` still empty); Gate 3 human, batched cadence
(PR #159 open, docs-only paper trail; merge waits for a second ready chain
per the batching ruling).

Prior state `cff_p3_reviews_p0_measurement_p1_shaping_running` — 2026-10-08
(third iteration). **Full-graph Gate 2 GRANTED** (verbatim: "full-graph Gate 2
granted") — CFF-P1/P2/P4 within the ratified sequencing (P2 shapes after P1
merges; P4 gates on P1+P2+P3). **Merge reality reconciled against the
developer's "all PRs have been merged"** (verified via `gh pr list`): PR #157
(charter/paper-trail) and #158 (version-validator) are merged; **CFF-P0 and
CFF-P3 never had PRs** — their branches carry built-but-unreviewed work
(P3 Unit A complete; P0 complete except AC5) and the coordinator's own
records on `chore/ci-fail-fast-charter` are local-only (unpushed). Gate 3 for
P0/P3 therefore still PENDS reviews + PR — nothing was assumed merged. Live
now: `cff_p3_review_a` + `cff_p3_review_b` (two independent adversarial
reviews of Unit A), `cff_p0_builder_r2` (AC5 measurement under the vehicle
ruling, below), `cff_p1_shaping` (Step 0 gate first). CFF-P3 Unit A
deterministic pass PASSED on the coordinator's own run (pin suite 9/9; pin
mutation → 8/9 fail-closed → 9/9 restored; precheck mutation → `PIN_DRIFT
standing-constraints` exit 1 → restored exit 0; closure shape 4 of 5 Allowed
Files — the test needed no edit, import surface preserved). **AC5 loop-stop
RULED (2026-10-08):** the primary instrumented pass runs via a measurement
vehicle — scratch branch `measure/cff-p0-read-graph` carrying ONE separate
measurement workflow file (the pinned workflow is never edited, not even on
the scratch branch), observing file opens via a loader seam (D2: never forks
or modifies the runner), windows-latest/Node 24.19.0, both projections from
the single capture, vehicle files deleted with the branch, deviation recorded
in `read-graph/measurement-log.md`; the dev-Windows supplementary pass
remains a named pending input for the developer. P1 worktree cut by the
permission-profiles emitter (`feat/foreman-line-CFF-P1` @ `4a436603`,
paper trail committed).

Prior state `cff_p0_p3_promoted_builders_step0_dispatched` (2026-10-08,
second iteration) preceded; before that
`cff_resume_p0_lint_pass_p3_shaping_undelivered`, then
`cff_gate2_granted_p0_p3_dispatched`:

Amendment package re-ratified ("1. ratify as written") and installed:
D7/D8/D9/D10/D11 + Objective wording + graph edits + exit-criterion-7 clause.
Gate 2 granted early and scoped ("gate 2 early grant issued") — CFF-P0 and
CFF-P3 kickstarters issued to shaping. CFF-P1/P2/P4 hold until the full-graph
Gate 2 request. Gate 3 human-owned.

## Standing authorizations

**Gate 2 — GRANTED 2026-10-07, early and scoped.** Verbatim grant: "gate 2
early grant issued" (response to the coordinator's request for "an early
scoped Gate 2 for CFF-P0-recon + CFF-P3 (original scope)"). Coordinator-stated
scope interpretation, flagged for correction: dispatch approval covers the
parcels **CFF-P0 and CFF-P3 in their post-re-ratification form** (P0's D7
measurement deliverable and P3's D10 drift check included — both were locked
into the parcels by the "1. ratify as written" amendment package issued in the
same directive). Contingencies: standing constraints by reference
(`plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`); every
dispatch opens with a Step 0 restate-and-stop gate; branch/worktree named in
each kickstarter, never ambient; rework directives mandate "every X"; the
charter's review requirements bind (two reviews where named, incl. CFF-P0's D7
measurement deliverable). **Any work beyond CFF-P0 and CFF-P3 requires the
full-graph Gate 2 request.**

**Gate 2 — FULL-GRAPH GRANT 2026-10-08.** Verbatim: "full-graph Gate 2
granted" (developer directive, same message as "all PRs have been merged").
Supersedes the scoped grant's limitation: dispatch approval now covers
**CFF-P1, CFF-P2, and CFF-P4** within the ratified graph's sequencing (CFF-P2
shapes only after CFF-P1 merges; CFF-P4 gates on P1+P2+P3). Same contingencies
as above bind; Gate 3 remains human.

**Gate 3 — NOT delegated.** Verbatim from the ratified charter: "Every merge to
a workflow, the CI runner, or the reuse/waiver machinery remains human-owned."
**Merge cadence (developer, 2026-10-08, "batch them"):** PRs are BATCHED —
the coordinator holds each merge-ready chain until a second chain is ready,
then presents both in one review round-trip. Accepted tradeoff (named): CFF-P2
shapes only after CFF-P1 merges, so batching delays P2's shaping clock.

**Reviewer model policy (developer, 2026-10-08, "now and always, until it
advances"):** adversarial review sessions run `anthropic/claude-opus-5-5`.
Standing dispatch policy from 2026-10-08: new sessions default to
`anthropic/claude-opus-5-5` unless the developer directs otherwise; sessions
already in flight at the policy's arrival finish on their dispatched model;
charter-mandated FRONTIER review pairs dispatched before the policy are
re-dispatched on `claude-opus-5-5` (the frontier mandate is charter-binding —
sonnet-5 runs become supplementary triage input only).

**AC5 measurement vehicle — RATIFIED (developer, 2026-10-08, "ratify as
ruled"):** the scratch-branch vehicle (rule below in the dispatch record) is
confirmed. Verbatim: "ratify as ruled".

**Dev-machine supplementary pass (developer, 2026-10-08):** "my windows pc is
reachable. I can execute something on it and drop the results into a
designated drop spot in the repo." Drop spot designated:
`read-graph/dev-drop/` under this goal's directory (README there carries the
run contract). The developer's drop is a human input act; the parcel builder
consumes it into `read-graph/fixtures/dev-pass-raw.json` (Allowed Files).

**Wake protocol (developer, 2026-10-08):** the developer pings the
coordinator to check the loop; the coordinator never polls background
sessions.

## Stop conditions (charter §Stop conditions, binding here)

Second differ or second pin source proposed · waiver input contract changes
shape · local waiver grant proposed (`waived-in-ci` is informational only) ·
early-red signal proposed to alter/shortcut/replace the all-artifact verdict ·
platform skip without named reason + evidence · whole-suite skip instead of
baseline-diff · per-package output interleaved · relevance coverage incomplete
for a package class · D7 affection pin unmeasurable for a package class ·
merge-gate identity/branch-protection question needing inference. Universal
conditions per COORDINATOR-PATTERN also apply.

## Evidence trail

- Kickoff directive + Stage Zero interrogation/reconciliation report:
  session transcript (2026-10-07); measured facts recorded in charter
  §Stage Zero reconciliation.
- Draft charter commit: `b399ff6f` (PR #157).
- Ratification record: charter §Gate 1 record.
- Plan review findings + triage dispositions + scoped re-open package:
  [`plan-review-triage-2026-10-07.md`](plan-review-triage-2026-10-07.md).
- Dispatched under the Gate 2 grant (kickstarters, Step 0 restate-and-stop
  gates in each):
  - CFF-P0 shaping: `plugins/foreman-line/docs/kickstarters/foreman-line-shaping-CFF-P0.md`
  - CFF-P3 shaping: `plugins/foreman-line/docs/kickstarters/foreman-line-shaping-CFF-P3.md`
- Resume 2026-10-08 — coordinator lint of CFF-P0 shaping output:
  [`cff-p0-shaping-lint-2026-10-08.md`](cff-p0-shaping-lint-2026-10-08.md)
  (PASS; 30/27 gap, four dead waivers, CLI surface, D11 seams, and the AC5.6
  classification safety property all re-measured on disk).
- 2026-10-08 — CFF-P3 coordinator lint + Unit B ruling:
  [`cff-p3-shaping-lint-2026-10-08.md`](cff-p3-shaping-lint-2026-10-08.md)
  (PASS; Amendment `CFF-P3-A1` named as the Unit B vehicle).
- 2026-10-08 — promotions: CFF-P0 spec → `active` (`f9788222` on
  `feat/foreman-line-cff-p0`), CFF-P3 spec → `active` (`12993dc3` on
  `feat/foreman-line-cff-p3`); specs `INDEX.md` created in both; builder
  kickstarters [`foreman-line-build-CFF-P0.md`](../../kickstarters/foreman-line-build-CFF-P0.md)
  and [`foreman-line-build-CFF-P3.md`](../../kickstarters/foreman-line-build-CFF-P3.md)
  (`df1ff702` on `chore/ci-fail-fast-charter`, copied into both worktrees).
- 2026-10-08 — dispatches (Gate 2 standing grant): `cff_p0_builder` and
  `cff_p3_builder` Step-0 restate-and-stop sessions (lesson #8); build
  re-dispatch follows each ruled restate.
- 2026-10-08 — **Step 0 restates RULED CORRECT** (both builders): gates G1–G4
  verified, brief digests match coordinator-side sha256 (`5f351378…` CFF-P3,
  `4fa8e5aa…` CFF-P0), Allowed Files exact (5 / 9 paths), inventories
  accurate, zero writes before ruling. Builds re-dispatched:
  `cff_p3_builder_r1` (Unit A) and `cff_p0_builder_r1` (AC1–AC6 recon).
- 2026-10-08 — builds delivered: CFF-P3 Unit A complete (3 commits
  `4ab10ffe..e08ddbb3`, value-identity proof 0 mismatches, named gaps:
  live windows-latest end-to-end pending the PR run; channels-gate's 7
  pre-existing `ajv` failures confirmed unchanged); CFF-P0 complete except
  **AC5 at the named loop-stop** (reported honestly; no substituted data
  committed). Merge reality checked: no PRs existed for either branch —
  the "all PRs merged" statement covers #157/#158 only.
- 2026-10-08 — CFF-P3 deterministic pass (coordinator's own run) + closure
  check: **PASS** (details in the State section).
- 2026-10-08 — dispatches under the full-graph grant: `cff_p3_review_a` /
  `cff_p3_review_b` (two independent adversarial reviews of Unit A — gate
  integrity / extraction purity angles; reviewers never fix or commit),
  `cff_p0_builder_r2` (AC5 measurement vehicle), `cff_p1_shaping` (Step 0
  gate first). Gate 3 remains human.
- 2026-10-08 — developer directives installed (9-question blocker round):
  merge reading confirmed; **batched Gate 3 cadence**; **AC5 vehicle
  ratified as ruled**; dev-drop spot designated (`read-graph/dev-drop/`);
  charter branch pushed + docs-only PR; **reviewer/dispatch model policy
  `anthropic/claude-opus-5-5` now and always** (P3's frontier review pair
  re-dispatched on it; the earlier sonnet-5 ReviewB report is retained as
  supplementary triage input — one informational finding, no blockers);
  spec-duplicate + `.trash`/`synced` hygiene PR authorized; ping-based wake
  protocol confirmed.
- 2026-10-08 — directives executed: **PR #159** (paper trail, docs-only,
  this branch) and **PR #160** (hygiene: 5 stale `active/` duplicates
  removed, `docs/specs/INDEX.md` created with done/ folder authority,
  `plugins/.trash/` + `plugins/synced/` untracked + gitignored after
  verifying `spec-linter/tests/grandfather.test.ts` excludes both) opened;
  parcel branches hygiene-synced (`8b49202a` P0, `032f8a4a` P1, `4d845ff8`
  P3 — identical INDEX + deletions, merge-clean by construction). Sonnet
  `cff_p3_review_a` stopped under the model policy; **frontier review pair
  re-dispatched**: `cff_p3_review_a2` + `cff_p3_review_b2`
  (`anthropic/claude-opus-5-5`). **CFF-P1 shaping DELIVERED** by
  `cff_p1_shaping_r1` (`CFF-P1-change-proximity-ordering-and-early-red.md`
  + shaping-result, 8 ACs) — awaiting coordinator lint (next queue item).
  `cff_p0_builder_r2` (AC5 measurement) still in flight on its dispatched
  model (policy applies to new dispatches).
- 2026-10-08 — **CFF-P0 AC5 DELIVERED** by `cff_p0_builder_r2` (`f34c5e74` +
  `500b8f54` on `feat/foreman-line-cff-p0`): measured capture of record (run
  `37768165017`, windows-latest/Node 24.19.0, 30/30 green, zero waivers
  consulted), single-capture dual projections, 5-edge READER_SET delta
  recorded-not-installed (D10 routing), dev-pass fixture intentionally
  absent (named pending input), vehicle torn down (teardown-SHA deviation
  recorded honestly: concurrent hygiene-sync `8b49202a` on the scratch
  branch, docs-only, touched nothing measured). Coordinator closure check
  **PASS** (every claim re-verified on disk + via `gh`; see State).
- 2026-10-08 — **CFF-P1 shaping lint PASS → promoted** (`41b927de`):
  `cff-p1-shaping-lint-2026-10-08.md` (all 25+ line citations exact; 30/27
  gap, missing-three, 8/8/7/7 round-robin identity, 4 waiver identities,
  runShard phase split, runCli write-before-exit, `!cancelled()` upload,
  no-`additionalProperties`, rule-0 `:746` re-cite, seam `:1086`, no
  existing diff export — all CONFIRMED on disk; spec-linter exit 0;
  lesson-#33 diff strengthening-only). Errata E1–E3 corrected in place at
  promotion. Builder kickstarter issued (Step 0 gate first).
- 2026-10-08 — CFF-P0 review kickstarters A/B issued (paper trail
  `91480ae7` on the parcel branch).
- 2026-10-08 — developer answers: (1) dispatch mechanism = `pi --model
  anthropic/claude-opus-5-5` headless (verified, used); (2) P3 reviews
  confirmed in flight; (3) dev-Windows pass: developer unsure what is needed
  — coordinator question + recommendation asked (turnkey run package in
  `read-graph/dev-drop/`; answer pending); (4) **PR #159 merged**
  (`dab6967e`).
- 2026-10-08 — dispatches live: `cff_p0_review_a` + `cff_p0_review_b`
  (opus-5-5, kickstarters A/B); `cff_p1_builder_step0` → restate RULED
  CORRECT → `cff_p1_builder_r1` building (opus-5-5).
