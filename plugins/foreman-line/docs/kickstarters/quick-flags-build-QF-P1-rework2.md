# Builder Kickstarter — quick-flags QF-P1 rework 2

You are the Builder for QF-P1 rework 2. Spec: `plugins/foreman-line/docs/specs/active/QF-P1-quick-flags-registry.md` (A1–A12 binding). Directives: `plugins/foreman-line/docs/goals/quick-flags/qf-p1-review-triage-round2-2026-10-13.md` (rulings R2-1..R2-12; reviews C and D alongside; round 1 triage and reviews A/B also in that directory). Apply each directive to **every** instance of its pattern: grep the whole file for the pattern's vocabulary (not just the cited lines), including every entry's Conflicts line, §8, §10, §11 and §13. The findings are a floor, not a ceiling. A previous rework claimed a complete sweep and missed instances; that was a false-closure tripwire, and a second one stops the loop.

**Simplification mandate:** every HIGH finding sits in machinery the last rework added. Prefer deleting mechanisms to adding text. Every net-new sentence must reduce an attack surface or remove a contradiction; do not add new mechanisms beyond the rulings.

**Dispatch:** direct invocation per loop-directive ruling 2026-10-13; no route receipt. Frontier. Standing constraints apply (`plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`).

## Where you work
Worktree `/home/cmorgan76/Repos/agent-skills-qf-p1`, branch `qf-p1`. Write ONLY `plugins/foreman-line/docs/QUICK-FLAGS.md`. Never run git add/commit/push/checkout/reset. Read-only git is fine. You have a shell for verification.

## Tripwire (state in Step 0, assert in the completion claim)
Baseline: the file at commit `c6804b2d` (597 lines). Invariants that must hold: `Registry version: 1` once; 14 entries (D8 set), 7 labels each in order at column 0; 91 distinct conflict pairs, no blank cell in any column; every Resolution in the (now five-term) vocabulary; every Winner consistent; every Rule cell starts with an ID from the closed set; V1–V6 verbatim; alias table 1 row equal to the `Aliases:` lines; term rule; `git diff --check` clean. Line count may shrink; it must not grow by more than 40 lines net. Any rule removed that no ruling names is a regression.

## Step 0 — restate and STOP (mandatory)
1. Name your model; confirm direct invocation under the ruling.
2. For each ruling R2-1..R2-12: list every instance you found by sweeping (line numbers, including ones the reviewers did not cite), and the change you will make. State the grep patterns you used for the sweep.
3. Flag any conflict between rulings, or between a ruling and the spec or canon, each with a recommendation. Do not resolve a conflict silently.
4. State how you will check the tripwire, and the net line-count plan.
5. STOP and wait for rulings.

## After rulings
Edit the file. Completion claim: table of every ruling to evidence (line numbers), tripwire results with commands run, a list of every sentence replaced or deleted, and every addition beyond the rulings (each justified as reducing an attack surface). Wrong-shaped claims are presumptively empty.
