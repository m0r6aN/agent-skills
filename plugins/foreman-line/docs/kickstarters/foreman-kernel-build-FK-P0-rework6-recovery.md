# FK-P0 Round 6 Recovery - Step 0

## Authority

The developer transferred Foreman Kernel ownership to the Codex coordinator on 2026-09-04 at the
clean FK-P0 head `0ee165720f8d1e3a91eb283cb770400b23f61bf5`. Round 6 remains active. This is a
recovery dispatch, not acceptance of the preserved `wip(fk-p0)` commits.

## Target

- Branch: `codex/fk-p0-canon-authority-enforcement-registry`
- Worktree: `D:/Repos/agent-skills-worktrees/fk-p0-canon-authority-enforcement-registry`
- Starting head: `0ee165720f8d1e3a91eb283cb770400b23f61bf5`
- Package: `plugins/foreman-line/authority-registry/`

## Read First

1. `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`
2. `plugins/foreman-line/docs/specs/active/FK-P0-canon-authority-enforcement-registry.md`,
   including R24-R29 amendments incorporated into its contract and acceptance criteria
3. `plugins/foreman-line/docs/kickstarters/foreman-kernel-build-FK-P0-rework6.md`
4. `plugins/foreman-line/docs/goals/foreman-kernel/FK-P0-BLOCKER-volatile-canon-source.md`
5. `plugins/foreman-line/docs/goals/foreman-kernel/FK-P0-round6-recovery-record.md`
6. `plugins/foreman-line/docs/goals/foreman-kernel/FK-P0-round6-STOP-REPORT.md`

## Step 0 - Restate And Stop

Do not edit, commit, regenerate, install dependencies, or run package verification before the
coordinator rules on this Step 0 response. Treat all existing `wip(fk-p0)` commits as unaccepted
candidate work, not a completion claim.

Return:

1. the bounded Round 6 scope and all out-of-scope surfaces;
2. the exact 28 Allowed Files, branch, worktree, and starting head;
3. a commit-by-commit inventory of preserved candidate changes from `47a26be` through `0ee1657`,
   distinguishing coordinator documentation from package work;
4. a mapping from the candidate to every R24-R29 obligation and required controls (a)-(g), naming
   each missing, unproven, or contradicted condition;
5. whether the current design preserves the anti-laundering boundary, stable curated bindings, and
   the intended volatile-region scope; and
6. the exact sequential verification plan, including the test-count tripwire and clean-generation
   assertion.

Stop after that report. The coordinator will either authorize a bounded recovery implementation or
request a ratified amendment. No external effects, merge, Gate 3 claim, or Stage F action are in
scope.
