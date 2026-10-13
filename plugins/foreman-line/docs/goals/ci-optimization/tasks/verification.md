# CI cleanup checkpoint

Branch: chore/ci-trigger-cleanup; worktree: /tmp/agent-skills-ci-trigger-cleanup.
Planning commit: ada4e0d6; evidence-retirement checkpoint: 8f68b9c7. Work paused
to investigate unreadable Sessions, then resumed after that fix was verified and
handed off separately as PR #215. No application/UI changes in this CI branch.

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

## Trigger implementation and verification

Two workflow push triggers now explicitly allow main only. Unfiltered
pull_request remains on both; plugin workflow_dispatch remains. No integration
branch currently needs a push-only exception. Feature branches without an open
PR intentionally no longer run automatic CI; main post-merge checks remain.
All job bodies are byte-identical to origin/main (explicit comparison), including
permissions, runners, commands, required check names and failure behavior.
No paths filters, cancellation/retry, check removals or new dependencies.

Two new trigger contract tests were written first in the already-executed
foreman-line-ci.test.mjs. Focused RED failed only on missing main branch filters;
GREEN full script suite: **417/417 pass**, zero skipped (previous 415 + two tests).
Commands: `node --test scripts/foreman-line-ci.test.mjs scripts/ci-reuse.test.mjs
scripts/validate-versions-test.js scripts/run-evals-test.js
scripts/validate-reference-links-test.js scripts/validate-commands-test.js
scripts/validate-artifact-paths-test.js`.

Existing ci-reuse.mjs line ~833 explicitly accepts only pull_request event class
before source discovery; lineage also requires PR-class sources. Existing tests
prove push-class fallback, PR ancestry/hash/context validation and negative reuse
cases. Removing feature push runs cannot remove valid reuse sources. Workflow
hash changes correctly force an initial fallback; subsequent matching PR sources
can seed reuse. No claim that a main push can reuse PR evidence.

Pinned actionlint **1.7.12** (release archive SHA256 verified against existing
u1-lint pin) passes for both changed workflows. Surface-pin precheck, skill,
manifest-version, reference-link, command-parity, artifact-path validators and
`git diff --check` pass. Skill evals: **192 checks pass, rank-1 92%**. Logs:
/tmp/ci-trigger-{red,tests,validators,evals}.log. No package/type surface changed;
full Windows package sweep and actual plugin installation have not run locally.
These are local checks, not remote Actions verdicts.

Scoped source review confirms trigger-only coverage change, job identity and
byte-identical job-body preservation, PR-only reuse source compatibility, and
completed archive before reversible measurement disable. No independent review
verdict or merge approval claimed. No U1, Dependency Graph, plugin enablement,
billing, ruleset or protection changes performed. Account-level runner blocker
still requires owner action before live CI evidence is available.

## Rollback / remaining gates

Owner can re-enable measurement workflow 378344122; all evidence and scratch ref
remain available. Trigger rollback is a reviewed revert of the two branch filters
and their regression expectations. No data or dependency migration.
Human review/merge required; changes do not take effect on main until merged.
No automatic merge, branch/run/artifact deletion, CI bypass or billing change.
