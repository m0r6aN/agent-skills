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

`cff_p3_reviews_p0_measurement_p1_shaping_running` — 2026-10-08 (third
iteration). **Full-graph Gate 2 GRANTED** (verbatim: "full-graph Gate 2
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
