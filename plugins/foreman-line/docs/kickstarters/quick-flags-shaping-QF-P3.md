# Shaping Session Kickstarter — quick-flags QF-P3

You are the Shaping Agent for parcel QF-P3 of the quick-flags goal. Follow `plugins/foreman-line/skills/foreman-shaping/SKILL.md` exactly.

**Dispatch:** no route receipt; direct invocation per loop-directive ruling 2026-10-13. Name your model in Step 0. Docs-only writes.
Standing constraints apply — `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`.

## Why
QF-P1 shipped the quick-flag registry (`docs/QUICK-FLAGS.md`, version 1); QF-P2 wired it into canon (goal-skill `## Quick flags` section, `templates/kickstarters/loop-directive-template.md`, synced copy, COORDINATOR-PATTERN cross-reference); QF-P0 re-pinned the authority registry. QF-P3 is the last build parcel: a **structural conformance check** that keeps the registry, the skill section and the template mechanically consistent — required fields, the closed gate-interplay list, the skill referencing the registry. **No semantic phrase-matching** (charter; plan review R10/R11). Standard risk: mid-tier builder, one review.

## Required reading
- `plugins/foreman-line/docs/goals/quick-flags/charter.md` (QF-P3 row; D-rows; exit criterion)
- `plugins/foreman-line/docs/goals/quick-flags/loop-directive.md` (Stage F records; **inputs forwarded to QF-P3**: from QF-P1 the checker gaps G-11/H-9 — extra label line after the 7th; first rule ID of the 17 pinned independent rows; `|` in cells; closed-row count; AC-2 "only" vs interplay text in two Conflicts lines; from QF-P2 the O-8/P-9 gaps — §5 variant coverage beyond the VP5 PCRE, "flagged", wrapped placeholders, ownership block-quote form, decision-log boundary, heading-list diff, registry path forms in the mirror, entry contiguity in live directives — and P-3's contiguity check)
- `plugins/foreman-line/docs/goals/quick-flags/plan-review-findings.md` (QF-R10: the check must live inside an **existing package**, named at shaping, no new package; the CI cost-table trap)
- `plugins/foreman-line/docs/specs/done/QF-P1-quick-flags-registry.md` and `docs/specs/done/QF-P2-quick-flags-integration.md` (the structural surfaces to check: registry §7 closed gate-interplay list, §8 entry fields, §9 entry format; the skill section; the template's pinned headings/labels)
- `plugins/foreman-line/docs/QUICK-FLAGS.md`, `plugins/foreman-line/skills/goal/SKILL.md`, `plugins/foreman-line/templates/kickstarters/loop-directive-template.md`
- `plugins/foreman-line/docs/COORDINATOR-PATTERN.md`, `plugins/foreman-line/docs/SPEC-CONVENTION.md`
- Candidate host packages: `plugins/foreman-line/spec-linter/` (its role is structural spec checks) and `plugins/foreman-line/verification/` — pick one and justify; check how its tests run in CI (`scripts/foreman-line-ci.mjs` package discovery) so the check is actually exercised.

## Inputs
- **Idea:** shape ONE parcel spec, QF-P3 (`docs/specs/active/QF-P3-quick-flags-conformance-check.md`, `status: draft`). The checker is structural and mechanical: it verifies (at minimum) the registry's required fields and closed lists (the §7 gate-interplay list, the 14-flag entry set, the alias table), that the goal skill and its synced copy reference the registry, and that the loop-directive template keeps its pinned structure (heading list, `Active restrictions:`/`Decision log:` labels and boundaries, placeholder casing). It should also cover the forwarded checker gaps where they are structural (entry contiguity, decision-log boundary, heading-list diff, "flagged", wrapped placeholders, block-quote form, mirror path forms). No semantic phrase-matching; judgments about meaning stay with reviewers. The check lives in one existing package's test suite, named and justified in the spec, with exact Allowed Files.
- Explicitly out of scope (spec must say so): new packages; edits to the registry, skill, template or canon being checked (the check reads them); semantic/natural-language conformance; CI cost-table changes; the exit-step dry-read walkthrough; push/PR/remote.

## Where you work
Worktree `/home/cmorgan76/Repos/agent-skills-qf-p3`, branch `qf-p3`. Never touch the main working tree, check out another branch, or push; do not run git add/commit. Write only the spec (status `draft`), its shaping-result json, and its `docs/specs/INDEX.md` row if one needs changing.
Environment: Linux, bash, node 26, npm.

## Step 0 — restate and STOP (mandatory)
1. Name your model; confirm direct invocation under the ruling.
2. Restate the parcel; name the host package with justification (including the CI discovery check); list the ACs you propose, each mechanical and each traceable to a structural surface or a forwarded gap.
3. List clarifying questions in numbered batches, each with a recommended default.
4. STOP. Do not author the spec on your own resolution of an open question.

## Outputs (after answers)
The spec at `status: draft`, passing the shaping self-check, plus the shaping-result artifact. Every factual claim must be checkable on disk. Coordinator lint is the sole promotion authority.
