# Builder kickstarter — FCA-P9 stages 2 and 3 (present-mode commands)

Role: builder (standard-feature). Worktree: `/home/cmorgan76/Repos/agent-skills-worktrees/fca-p9-stage2`
Branch: `feat/fca-p9-stage2-present` (cut from main `24b2daf5`). Never touch another worktree.
Spec (frozen, owner-ratified 2026-10-13): `plugins/foreman-line/docs/specs/active/FCA-P9-decisions-queue.md`
Standing constraints: `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md` (by reference).

## Scope
Implement ONLY the spec's staged-delivery items 2 and 3 (stage 1 is merged, PR #223):
2. Gate commands for G1/G2 through the existing present-mode flows.
3. `pr-merge` present-only flow in `FLOW_REGISTRY`, the `repo-root-fleet` argument kind,
   the presented merge command `gh pr merge <N>` (no strategy flag), audited `presented`,
   refusals audited `refused` (acceptance criteria 6, 7, plus UI wiring for the buttons).
Allowed Files: exactly the spec's list. Anything else is a flag, not an edit.

## Step 0 (restate-and-stop)
Before ANY edit: restate scope, list what stage 1 already shipped on disk (verify, do not
assume), state the live `npm test` count (`node -v` first; expect >= 24.11.1), list any gap
or ambiguity in the spec, then STOP and write the restatement to `STEP0.md` in the worktree
root (uncommitted). The coordinator rules on flags. Continue only if the restatement finds
no spec conflict; if it does, stop.

## Hard rules
- The console presents, never performs: no gate act executed, no TTY fabricated, no merge.
- Read-only `gh` allowlist unchanged; mutation negative controls for each new guard.
- No readiness verdicts. Frozen vocabularies/rules unchanged.
- Commit on the branch; do NOT push, do NOT open a PR, do NOT merge.
- Final message: completion claim mapped to evidence per acceptance criterion, with before/after
  test counts. Wrong-shaped claims are presumptively empty.
