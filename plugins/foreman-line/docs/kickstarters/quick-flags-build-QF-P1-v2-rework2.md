# Builder Kickstarter — quick-flags QF-P1 v2 rework 2

You are the Builder for QF-P1 v2 rework 2. Spec: `plugins/foreman-line/docs/specs/active/QF-P1-quick-flags-registry.md` (incl. its two "Coordinator rulings" sections). Directives: `plugins/foreman-line/docs/goals/quick-flags/qf-p1-v2-review-triage-round2-2026-10-13.md` (reviews I and J alongside; the round-1 triage is also in that directory). Apply each ruling to **every** instance of its pattern: grep the whole file for the pattern's vocabulary, including every entry's Conflicts line, §7, §9, §10 and §11, and prove each sweep with a post-edit grep. Earlier builder claims of a complete sweep were falsified more than once; do not repeat that. The findings are a floor, not a ceiling.

**Simplification mandate:** replace or tighten text before adding. Do not add any mechanism (no stored grants, ids, voids, revocations, pins). Line cap is now 370.
**Rework build base (AC-24):** `f9aa4f42`. **Dispatch:** direct invocation per loop-directive ruling 2026-10-13; frontier; standing constraints apply.

## Where you work
Worktree `/home/cmorgan76/Repos/agent-skills-qf-p1`, branch `qf-p1`. Write ONLY `plugins/foreman-line/docs/QUICK-FLAGS.md`. No git add/commit/push/checkout/reset; read-only git is fine. Use inline python heredoc edit scripts that refuse unless each old string matches exactly once; no temp files in the repo.

## Tripwire (state in Step 0, assert in the claim)
Baseline: the file at the current HEAD (346 lines). NOTE: one tripwire (a missed sweep instance) has already fired on this reshaped parcel; a second one stops the loop. Sweep with extra care, in particular carry every ruling into every GATES clause, every Rule cell and rule-ID text, and every entry's Conflicts line. Invariants: `Registry version: 1` once; 14 entries, 7 labels in order at column 0; 55 conflict rows (none missing/extra) + OBS rule; 5-term vocabulary; V1–V7 verbatim; retired-term grep = 0; every spec Verification Plan command gives its stated result; `wc -l` <= 370; `git diff --check` clean. Any rule removed that no ruling names is a regression: flag it.

## Step 0 — restate and STOP (mandatory)
1. Name your model; confirm direct invocation and the build base.
2. For every triage row: every instance you found by sweeping (line numbers, including ones the reviewers did not cite), the grep patterns used, and the planned change. Net line plan.
3. Flag conflicts between rulings, or between a ruling and the spec or canon, each with a recommendation. Do not resolve a conflict silently.
4. STOP and wait for rulings.

## After rulings
Edit. Completion claim: each triage row to line evidence, every Verification Plan command with its actual output, post-edit sweep results, every sentence replaced or deleted, every addition beyond the rulings (each justified), and the tripwire results.
