# Shaping Session Kickstarter — quick-flags QF-P0

You are the Shaping Agent for parcel QF-P0 of the quick-flags goal. Follow `plugins/foreman-line/skills/foreman-shaping/SKILL.md` exactly.

**Dispatch:** no route receipt; direct invocation per loop-directive ruling 2026-10-13. Name your model in Step 0. Docs-only writes.
Standing constraints apply — `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`.

## Why
QF-P2 edited two canon files registered in the authority registry: `plugins/foreman-line/skills/goal/SKILL.md` (lines 18 and 28 changed in place; a `## Quick flags` section appended) and `plugins/foreman-line/docs/COORDINATOR-PATTERN.md` (a `## Quick flags` section appended after line 89). The registry's curated excerpts of the old lines now mismatch, and the new sections are uncovered. QF-P0 is the corpus amendment that re-pins the registry to the post-QF-P2 canon bytes, with the before/after sweep diff as evidence. The charter sequenced it after QF-P2 (id kept from the plan review).

## Required reading
- `plugins/foreman-line/docs/goals/quick-flags/charter.md` (QF-P0 parcel row; D-rows)
- `plugins/foreman-line/docs/goals/quick-flags/loop-directive.md` (Stage F records; the QF-P2 record's "Inputs forwarded to QF-P0")
- `plugins/foreman-line/docs/specs/done/QF-P2-quick-flags-integration.md` (esp. Assumptions: the expected drift — `goal-skill` excerpts at `authority-enforcement-registry.yaml:7443,7487,34815,34974` and the same lines in `authority-registry/tests/fixtures/pass-minimal.yaml`; the new `coordinator-pattern` section uncovered)
- `plugins/foreman-line/docs/goals/foreman-kernel/FK-P0-corpus-amendment-R32-2026-09-27.md` (the precedent amendment record: typed prior-to-new migrations, re-pin, regenerate, validate + sweep, before/after digests)
- `plugins/foreman-line/authority-registry/README.md` and `src/` (validate.ts:206-217 canon sources; generate.ts:260+; cli.ts; r32-migrations.ts pattern)
- `plugins/foreman-line/docs/COORDINATOR-PATTERN.md`, `plugins/foreman-line/docs/SPEC-CONVENTION.md`
- The QF-P2 merged canon state on this branch (goal skill lines 18/28/42-52; COORDINATOR-PATTERN lines 90-93)

## Inputs
- **Idea:** shape ONE parcel spec, QF-P0 (`docs/specs/active/QF-P0-authority-registry-corpus-amendment.md`, `status: draft`), covering: re-pin the `goal-skill` and `coordinator-pattern` corpus entries to the post-QF-P2 bytes (new excerpts for skill lines 18/28; dispositions for the two new `## Quick flags` sections); decide and justify whether a typed R33-style migration record is required or a plain re-pin suffices (the R32 precedent, identity rules, and the amendment numbering are yours to verify on disk); regenerate `authority-enforcement-registry.yaml` and any fixture; validator and sweep green with zero violations; the before/after sweep diff recorded as evidence (before = the registry against post-QF-P2 canon, i.e. the current drift; after = the amended registry). Evidence, provenance and digest pins follow the R32 record's shape. Verification must be runnable commands with expected outputs, in SPEC-CONVENTION form.
- Explicitly out of scope (spec must say so): any edit to canon files themselves (`skills/goal/SKILL.md`, `COORDINATOR-PATTERN.md`, QUICK-FLAGS.md, charter/loop-directive), any other goal's records, QF-P3 (conformance check), the exit-step walkthrough, and anything outside `plugins/foreman-line/authority-registry/**` plus the parcel's own spec/goal records. Push/PR/remote stays human.

## Where you work
Worktree `/home/cmorgan76/Repos/agent-skills-qf-p0`, branch `qf-p0`. Never touch the main working tree, check out another branch, or push; do not run git add/commit. Write only the spec (status `draft`), its shaping-result json, and its `docs/specs/INDEX.md` row if one needs changing.
Environment: Linux, bash, node 26, npm; the authority-registry package builds with `npm run generate` / validates via `src/cli.ts` (see its README/package.json).

## Step 0 — restate and STOP (mandatory)
1. Name your model; confirm direct invocation under the ruling.
2. Restate the parcel; list the ACs you propose (grouped), the amendment mechanics you verified on disk (generator entry points, where the `goal-skill`/`coordinator-pattern` excerpts live, how new canon sections enter the curated inventory and the `normativeMarkdownAudit` if applicable), and the migration-vs-re-pin decision with its justification.
3. List clarifying questions in numbered batches, each with a recommended default.
4. STOP. Do not author the spec on your own resolution of an open question.

## Outputs (after answers)
The spec at `status: draft`, passing the shaping self-check, plus the shaping-result artifact. Every factual claim must be checkable on disk. Coordinator lint is the sole promotion authority.
