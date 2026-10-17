# Builder Kickstarter — quick-flags QF-P1 rework 1

You are the Builder for QF-P1 rework 1. Spec: `plugins/foreman-line/docs/specs/active/QF-P1-quick-flags-registry.md` (A1–A11 binding). Findings and directives: `plugins/foreman-line/docs/goals/quick-flags/qf-p1-review-triage-2026-10-13.md` (reviews A and B alongside). Fix **every** instance of each pattern in the triage table. The findings are a floor, not a ceiling: sweep the whole registry for the pattern, including text the reviewers did not cite.

**Dispatch:** direct invocation per loop-directive ruling 2026-10-13; no route receipt. Frontier. Standing constraints apply (`plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`).

## Where you work
Worktree `/home/cmorgan76/Repos/agent-skills-qf-p1`, branch `qf-p1`. Write ONLY `plugins/foreman-line/docs/QUICK-FLAGS.md`. Never run git add/commit/push/checkout/reset. Read-only git is fine. You have a shell for verification.

## Tripwire (state in Step 0, assert in the completion claim)
Baseline at `c772a943`: 505 lines; `Registry version: 1` once; 14 entries (D8 set), 7 labels each in order at column 0; 91 distinct conflict pairs with no blank cells; V1–V6 verbatim present; alias table 1 row. Rework must keep every baseline invariant (the version stays 1, since nothing has shipped), and may only add rules, columns, fields and sentences. A baseline invariant that changes, or a removed rule that is not named in the triage, is a regression: stop and report it as a flag.

## Step 0 — restate and STOP (mandatory)
1. Name your model; confirm direct invocation under the ruling.
2. For every triage row: list the instances you found by sweeping (not only the cited lines), the change you will make, and the section it lands in.
3. Flag any conflict between triage directives, or between a directive and the spec or canon, each with a recommendation. Do not resolve a conflict silently.
4. State the tripwire baseline, and how you will check it.
5. STOP and wait for rulings.

## After rulings
Edit the file. Completion claim: a table mapping every triage row to evidence (line numbers), the tripwire results with the commands you ran, and a list of any additions beyond the triage. Wrong-shaped claims are presumptively empty.
