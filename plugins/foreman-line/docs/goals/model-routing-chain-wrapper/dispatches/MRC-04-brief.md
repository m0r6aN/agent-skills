# Builder brief — MRC-04 (PMC-P3 Pi-session canon)

**Goal:** `model-routing-chain-wrapper` · **Owning goal:** `pi-model-configuration` (PMC-P3) · **Spec:** `plugins/foreman-line/docs/specs/active/MRC-04-pmc-p3-pi-session-canon.md` (frontmatter carries `verification_class: judgment-required`, coordinator patch 2026-09-27)
**Authority:** G-GATE2-PMC (granted 2026-09-27); Wave A; write set = exactly the spec's 10 files; 1 independent review (owning label docs/architecture governs review load).

## Coordinator rulings at dispatch (binding)

- **S1 (GMF-P7 conditional):** accepted as documented — if any later shaping names a write-set path, it takes the second-writer rule or stops.
- **S2 (SP11/O8 residual):** proceed on the PMC-side assignment (`rcm-sequencing-decision` §3: PMC-P3's human-facing template canon is outside RCM's D14 surface). The scaffolder's broad `templates/` claim is escalated-unresolved; **if a live scaffolder-coordinator claim appears at build time, stop and escalate (D10) — never write first.**
- **S3 (scope limit):** accepted — repo-wide zero Codex wording is unachievable inside P3's authority (the two forbidden pins carry Codex values as P2-interface semantics / SP11 boundary). Deferred instances go to the spec's deferred table with named owners; greps are scoped to the 10 allowed files.
- **S4 (SUPERCHARGE specs):** owner follow-up recorded — **do not touch** `docs/specs/active/SUPERCHARGE-P1-phase1-models.md` / `SUPERCHARGE-P2-routing-analysis.md` (spec lifecycle is outside P3).
- **S5:** goal records are out of this lane (MRC-01's; wrapper D8) — no `docs/goals/**` writes.
- **S6:** record-preserved kickstarter/quote text stays byte-identical; record-only stale instances go to the deferred table, never rewritten.

## Builder rules

Step 0 restate-and-stop FIRST (restate, verify the 10-file pin vs the current tree, run pre-state greps + the V6 MD5 baseline over the six scaffolder pins + `templates/pi-openrouter-routing.json`, flag drift). Then implement the five verbatim canon blocks (spec C0-A…C0-E) across the 10 files. Verification V0–V7 per spec. No commits/PRs. Completion claim maps acceptance criteria to grep/hash outputs + the deferred table.
