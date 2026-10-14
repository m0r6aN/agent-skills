# Spawn launch smoke — 2026-10-11 (Checkpoint: Spawn)

**Goal:** `foreman-ops-console` (control-center initiative, FCA-P5 Tasks 13-14)
**Method:** real tmux 3.7c + real `git worktree add` on a scratch repo, with the
pane commands swapped for harmless `sh` (no harness sessions spawned).

## What ran

- `planSpawn` (2 actions, pi controls) -> `launchSpawnPlan` with the DEFAULT
  tmux + worktree runners (no stubs), scratch repo `/tmp/fleet-smoke/tmux-repo`.
- Pane argv safety-overridden to `sh -c 'echo pane-ok; sleep 300'`.

## Results

- Launch: `{ sessionName: foc-smoke, launched: [0, 1], failed: null }`
- `tmux has-session foc-smoke`: yes — exactly 1 session
- `tmux list-panes`:
  - pane 1 cwd `/tmp/fleet-smoke/tmux-repo-worktrees/pr-170-red-20261011t120000z`
  - pane 2 cwd `/tmp/fleet-smoke/tmux-repo-worktrees/goal-p1-20261011t120000z`
- Worktrees created on disk by the launcher (`git worktree add -b spawn/<slug>`):
  `pr-170-red-20261011t120000z`, `goal-p1-20261011t120000z`
- Cleanup: `tmux kill-session -t foc-smoke` after verification.

## Verdict

The launcher executes the plan verbatim: one tmux session, one pane per
action, each pane in its own fresh worktree cut at spawn time (owner ruling
2026-10-11). Worktree paths in receipts match the panes' real cwds.
