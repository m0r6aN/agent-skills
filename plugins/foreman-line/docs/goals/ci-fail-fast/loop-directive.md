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

`cff_resume_p0_lint_pass_p3_shaping_undelivered` — resume 2026-10-08.
CFF-P0 shaping output linted by the coordinator (`cff-p0-shaping-lint-2026-10-08.md`,
PASS; every factual claim re-measured on disk) and committed docs-only on
`feat/foreman-line-cff-p0`. Next: CFF-P0 build dispatch under the standing
Gate 2 grant; CFF-P3 shaping re-dispatch (or developer re-issue) before its
build. CFF-P1/P2/P4 still hold for the full-graph Gate 2 request.

Prior state `cff_gate2_granted_p0_p3_dispatched`:

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

**Gate 3 — NOT delegated.** Verbatim from the ratified charter: "Every merge to
a workflow, the CI runner, or the reuse/waiver machinery remains human-owned."

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
