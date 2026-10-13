# CI trigger cleanup tasks

- [x] T1: Archive scratch measurement evidence, then disable its workflow.
  Acceptance: all four runs inventoried; available logs/artifact ZIPs and scratch
  tip workflow/probe retained with checksums; no branch/run/artifact deletions.
  Verify: archive manifest, ZIP integrity, GitHub workflow disabled state.
  Dependencies: none. Files: external archive and goal-local verification.md.
- [x] T2: Restrict duplicate push CI to main while retaining all PR checks.
  Acceptance: both workflows have main-only push, unfiltered pull_request;
  plugin workflow_dispatch and job bodies/check names are preserved; reuse source
  remains PR-class only. Regression must fail before the YAML change.
  Verify: focused RED/GREEN, existing script suite and workflow lint.
  Dependencies: plan approved; independent of T1.
  Files: two workflow YAMLs and scripts/foreman-line-ci.test.mjs.
- [x] Checkpoint: local validators/precheck/diff pass; review preserves coverage,
  job identities, failure guards, and no billing/protection/U1 mutations.
- [x] T3: Record evidence/limitations, commit/push separate branch and open PR.
  Handoff: [PR #216](https://github.com/m0r6aN/agent-skills/pull/216), branch pushed;
  417 tests/actionlint/validators pass. No automatic merge.
  Acceptance: focused diff, reproducible commands, rollback and remote CI limits
  documented. No automatic merge. Dependencies: T1/T2/checkpoint.
- [ ] Human review/merge and live CI verification after runner availability restored.
