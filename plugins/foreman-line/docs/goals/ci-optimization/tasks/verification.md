# CI cleanup checkpoint

Paused at owner request to investigate unreadable ops-console Sessions layout.
No workflow trigger/test files have changed. Branch: chore/ci-trigger-cleanup,
worktree: /tmp/agent-skills-ci-trigger-cleanup. Planning commit: ada4e0d6.

Completed retirement: workflow 378344122 (`cff-p0-readgraph-measure`) is now
`disabled_manually` (verified with GitHub API). Scratch branch and all run history
remain untouched. All four runs archived before disable:
37808727008, 37770346798, 37768165017 (capture of record), 37764594545.

Durable archive:
`~/.local/state/agent-skills/ci-retirement/cff-p0-readgraph-measure/`
80 MiB, 56 checksummed files, 31 artifact ZIPs; all ZIP CRC checks and SHA256SUMS
verification passed. Run/job/artifact metadata, all four complete job logs,
workflow/probe bytes at c9b872411bf2734e09700d8c5f5d72af87ec00d3 and archive report
preserved. No artifacts expired or downloads failed. No branch/run/artifact deleted.
Archive helper/log are /tmp/archive-cff-workflow.py and /tmp/cff-workflow-archive.log.

Remaining: TDD trigger regression; main-only push in two workflows, preserving
unfiltered pull_request, plugin manual dispatch and every job/check. Existing
ci-reuse.mjs line ~833 explicitly accepts only pull_request event class before
source discovery, so removing feature push runs cannot remove reuse sources.
No U1, plugin enablement, billing, ruleset or protection changes performed.
Rollback measurement disable: owner can re-enable workflow 378344122; evidence
and scratch ref remain available. No PR/trigger branch push yet.
