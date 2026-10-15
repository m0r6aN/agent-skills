# Shaping Session Kickstarter — quick-flags QF-P1 reshape

You are the Shaping Agent reshaping parcel QF-P1. Follow `plugins/foreman-line/skills/foreman-shaping/SKILL.md` exactly.

**Dispatch:** no route receipt; direct invocation per loop-directive ruling 2026-10-13. Name your model in Step 0. Docs-only writes.
Standing constraints apply — `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`.

## Why
The ratified design changed. Gate 1 was re-opened and ratified on 2026-10-13 for D5, D9 and consequentially D2 (`plugins/foreman-line/docs/goals/quick-flags/gate1-reopen-d5-d9-2026-10-13.md`; amended rows D2″/D5″/D9″ in `charter.md`). Delegating and gate quick flags (`--blanket`, `--dispatch-ok`, `--merge-ok`) are now **one-shot with no stored form**. Only `--strict`, `--nopush`, `--review2` are persistent, via one `Active restrictions` entry in the loop directive that can only restrict. The current spec (`plugins/foreman-line/docs/specs/active/QF-P1-quick-flags-registry.md`, with amendments A1–A13) and the current build (`plugins/foreman-line/docs/QUICK-FLAGS.md`, 596 lines) were built for the old stored-grant design and were reviewed in three rounds that found their HIGH defects in that machinery.

## Required reading
`charter.md`, `gate1-reopen-d5-d9-2026-10-13.md`, `plan-review-findings.md`, `qf-p1-review-triage-2026-10-13.md`, `qf-p1-review-triage-round2-2026-10-13.md`, `qf-p1-review-triage-round3-2026-10-13.md` (all in `plugins/foreman-line/docs/goals/quick-flags/`), the current spec and its Amendments, `plugins/foreman-line/docs/COORDINATOR-PATTERN.md`, `SPEC-CONVENTION.md`, `skills/goal/SKILL.md`.

## Inputs
- **Idea:** rewrite the QF-P1 spec as ONE clean document (fold Amendments A1–A13 into the ACs; no "Amendments" section stacking) for a registry under D2″/D5″/D9″. Remove: grant records, revocation records, void records, `id:` sequences, owner-by-time, pinned integration branch/revision/charter revision fields, derived records, decision-log encoding of grants. Keep as requirements, carried from the triages where they still apply: the 14 flags (D8), alias table, conflict table with Winner column and closed rule IDs (re-derive for the new classes; the table must still be mechanical), `--ratify` binding to the previous turn in this session and refusal beside `--asrec`/`--blanket`/`--resume`, `--asrec` binding to the previous turn, `--merge-ok`/`--dispatch-ok` scope (charter parcels, integration branch only, "red voids it", dependency order, arguments all-or-nothing), inert-message rule with provisional honouring of restrictive flags, variant detection, limiting prose (incl. `--review2` and `--resume`), `--resume <slug>` rules, `--dry`/`--halt` including wakeup cancellation, quick-flag provenance (D9″), destructive-action definition (D10′), prose grants neither reinterpreted nor revoked, K2 scoped to `--strict` wins only. Define the `Active restrictions` entry (fields, who may write it, how a human lifts it, what a resuming session does) minimally. Target spec size: smaller than the current one; and a registry target well under 400 lines.
- Single parcel QF-P1. QF-P2/P0/P3 out of scope. The registry's `Registry version` stays 1.

## Where you work
Worktree `/home/cmorgan76/Repos/agent-skills-qf-p1`, branch `qf-p1`. Never touch the main working tree, check out another branch, or push; do not run git add/commit. Write only the spec (status `draft`), its shaping-result json, and its `docs/specs/INDEX.md` row if one needs changing.

## Step 0 — restate and STOP (mandatory)
1. Name your model; confirm direct invocation under the ruling.
2. Restate the reshape; list the ACs you propose (grouped), what you remove and what you carry (with source triage IDs), the `Active restrictions` design, and how the conflict table changes for the new classes.
3. List clarifying questions in numbered batches, each with a recommended default.
4. STOP. Do not author the spec on your own resolution of an open question.

## Outputs (after answers)
The rewritten spec at `status: draft`, passing the shaping self-check, plus the shaping-result artifact. Every factual claim must be checkable on disk. Coordinator lint is the sole promotion authority.
