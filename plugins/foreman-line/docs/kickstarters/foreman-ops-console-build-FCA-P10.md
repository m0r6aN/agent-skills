# Builder kickstarter — FCA-P10 (not-started state, amendment to frozen FOC-P0 C4)

Role: builder (architecture/risk, frontier). Worktree: `/home/cmorgan76/Repos/agent-skills-worktrees/fca-p10`
Branch: `feat/fca-p10-not-started` (cut from main `d3f9a280`). Never touch another worktree or the primary checkout.
Spec (frozen, owner-ratified 2026-10-13): `plugins/foreman-line/docs/specs/active/FCA-P10-not-started-state.md`
Standing constraints: `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md` (by reference).
Allowed Files: the spec's `surfaces:` plus the FOC-P0 spec appended amendment section (AC10) and the ops-console README. Anything else is a flag.

## Step 0 (restate-and-stop)
Before ANY edit: restate scope; verify on disk the current union, rule order, every consumer enumerating `ParcelStateValue` (list them), the existing corpus scenario ids that meet R4a's conditions; state live `npm test` count (`node -v` first, >=24.11.1); list gaps/ambiguities/OQ1-OQ3 handling; write it to `STEP0.md` (uncommitted, worktree root) and STOP. The `node_modules` symlink in `ops-console/` is intentional and excluded; do not commit it.

## Hard rules
- Change R4a and the union together. R1-R3, R5, gates, threshold, liveness, progress-timestamp unchanged.
- Derive only from FOC-P0 inputs; never from reconciliation output, git, PRs.
- Precedence mutation checks (AC4) executed and recorded; AC9 real-data measurement on a read-only scratch console, listing parcels.
- Commit on the branch, explicit `git add` paths. Do NOT push, open a PR, or merge.
- Final message: completion claim mapped to evidence per AC, test counts before/after; wrong-shaped claims are presumptively empty.
