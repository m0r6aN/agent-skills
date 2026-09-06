# E6-R1 builder kickstarter — current-repository identity and evidence rerun

You are the isolated builder for E6-R1. Work only in
`D:/Repos/agent-skills-worktrees/w4-closeout-e6-r1-builder-20260906` on branch
`feat/foreman-line-E6-R1`. The permission-profile dispatcher created this
worktree from approved base `6518fb572bbae3d3238ae8a2cf01ff45ed5696b5` and
installed `builder-architecture` before Stage C was emitted. Never touch the
ambient `D:/Repos/agent-skills` checkout. Never change branches. Never push,
open or merge a PR, mint a receipt, mutate an issue or ruleset, call Jira, or
write to another repository.

Standing constraints apply —
`plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`.

## Authority and evidence

- Active spec:
  `plugins/foreman-line/docs/specs/active/E6-R1-current-repository-identity-and-evidence-rerun.md`
- Ratified amendment:
  `plugins/foreman-line/docs/goals/w4-closeout/e6-r1-current-repository-evidence-rerun-amendment.md`
- Workflow: `a5b1975a-7497-4200-bac2-5d8a6fd6c749`
- Test issue: `m0r6aN/agent-skills#18`
- Stage-C receipt:
  `docs/receipts/a5b1975a-7497-4200-bac2-5d8a6fd6c749/000002-C-dispatch-order.json`
- Dispatch order: parcel `E6-R1`; profile `builder-architecture`; routed model
  `anthropic/claude-opus-5`; injected skill `test-coverage`; Kompress artifact
  `a7da2d25fd004af179487380`.
- The Stage-C receipt carries the compressed text. Do not rely on the
  session-scoped artifact being retrievable from your session.

## Step 0 — restate and stop

Before editing anything:

1. Read the active spec, ratified amendment, this kickstarter, and the standing
   constraints in full.
2. Run `git branch --show-current`, `git rev-parse HEAD`, and
   `git status --short -uall`. Confirm the branch/worktree boundary and report
   any unexpected state.
3. Verify the pre-edit frozen inventory with this case-insensitive tracked
   expression (the character classes prevent this instruction from matching
   itself):
   `kaseya-one-productivity[-]tools|https://github\.com/Ka[s]eyaOne([^A-Za-z0-9_-]|$)`.
   It must produce exactly 79 matching lines in exactly 42 tracked files. The
   only match that lacks the legacy repository basename is the standalone
   legacy-organization author URL in the audit-suite manifest.
4. Restate the intent, all acceptance criteria, and the exact 45 Allowed Files
   below. Explain how you will distinguish living references from normalized
   historical records, preserve the historical meaning, recapture rather than
   hand-build live GitHub evidence, and keep coordinator artifacts untouched.
5. Stop. Make no edit, deletion, commit, network write, or other mutation until
   the coordinator accepts the Step-0 restatement.

## Exact builder Allowed Files

1. `plugins/audit-suite/audit-suite/.claude-plugin/plugin.json`
2. `plugins/audit-suite/audit-suite/README.md`
3. `plugins/foreman-line/.claude-plugin/plugin.json`
4. `plugins/foreman-line/.codex-plugin/plugin.json`
5. `plugins/foreman-line/docs/FOREMAN-LINE-PLAN.md`
6. `plugins/foreman-line/docs/goals/permission-profile-registry/loop-directive.md`
7. `plugins/foreman-line/docs/goals/permission-profile-registry/p3-adversarial-review-B-findings.md`
8. `plugins/foreman-line/docs/kickstarters/foreman-line-build-CLOSE-P3.md`
9. `plugins/foreman-line/docs/kickstarters/foreman-line-build-SCAF-P3.md`
10. `plugins/foreman-line/docs/kickstarters/foreman-line-build-W1-P1.md`
11. `plugins/foreman-line/docs/kickstarters/foreman-line-build-W1-P2.md`
12. `plugins/foreman-line/docs/kickstarters/foreman-line-build-W1-P3.md`
13. `plugins/foreman-line/docs/kickstarters/foreman-line-build-W1-P4.md`
14. `plugins/foreman-line/docs/kickstarters/foreman-line-build-W3-P1.md`
15. `plugins/foreman-line/docs/kickstarters/foreman-line-build-W3-P4.md`
16. `plugins/foreman-line/docs/kickstarters/foreman-line-build-W4-P4.md`
17. `plugins/foreman-line/docs/kickstarters/foreman-line-coordinator-loop.md`
18. `plugins/foreman-line/docs/kickstarters/foreman-line-parcel-DOCS-P1.md`
19. `plugins/foreman-line/docs/kickstarters/foreman-line-parcel-SCAF-P1.md`
20. `plugins/foreman-line/docs/kickstarters/foreman-line-parcel-SEC-1.md`
21. `plugins/foreman-line/docs/kickstarters/foreman-line-parcel-W0-P2.md`
22. `plugins/foreman-line/docs/kickstarters/foreman-line-parcel-W0-P3.md`
23. `plugins/foreman-line/docs/kickstarters/foreman-line-parcel-W0-P4.md`
24. `plugins/foreman-line/docs/kickstarters/foreman-line-parcel-W0-P5.md`
25. `plugins/foreman-line/docs/kickstarters/foreman-line-shaping-P1.md`
26. `plugins/foreman-line/docs/specs/active/receipt-chain-walker.registration.json`
27. `plugins/foreman-line/docs/specs/active/scaffold-migration.registration.json`
28. `plugins/foreman-line/docs/specs/done/P1-permission-profile-registry-schema.md`
29. `plugins/foreman-line/docs/specs/done/P2-dispatch-order-permission-profile-field.md`
30. `plugins/foreman-line/docs/specs/done/P4-spec-linter-permission-profile-enum.md`
31. `plugins/foreman-line/docs/specs/done/W0-P1-pipeline-stage-contracts.md`
32. `plugins/foreman-line/docs/specs/done/W0-P3-routing-policy-schema-validator.md`
33. `plugins/foreman-line/docs/specs/done/W0-P4-receipt-chain-schema-validator.md`
34. `plugins/foreman-line/docs/specs/done/W0-P5-skill-injection-matrix-schema-validator.md`
35. `plugins/foreman-line/docs/specs/done/W1-P1-shaping-agent.md`
36. `plugins/foreman-line/docs/specs/done/W1-P2-epic-story-projection.md`
37. `plugins/foreman-line/docs/specs/done/W1-P3-human-approval-flow.md`
38. `plugins/foreman-line/docs/specs/done/W1-P4-jira-registration.md`
39. `plugins/foreman-line/docs/transcripts/build-W0-P1-deterministic-pass.md`
40. `plugins/foreman-line/integration/tests/fixtures/effective-rules-live-capture.json`
41. `skills/parcel-compiler/docs/specs/done/PCC-P0-pcc-cli-scaffold.md`
42. `skills/parcel-compiler/docs/transcripts/build-PCC-P0-deterministic-pass.md`
43. `plugins/foreman-line/integration/tests/effective-rules.test.ts`
44. `plugins/foreman-line/docs/specs/active/receipt-chain-walker.repository-migration.json`
45. `plugins/foreman-line/docs/specs/active/scaffold-migration.repository-migration.json`

## Build phase after Step-0 acceptance

- Replace only the frozen legacy-repository matches, plus the exact adjacent
  fixture-test changes and two migration records authorized by the spec. Do not
  remove generic KaseyaOne product/organization history.
- Every changed historical command/transcript/spec/findings/kickstarter must
  prominently state: repository identifiers and paths were normalized on
  2026-09-06 to `m0r6aN/agent-skills`; recorded commands were not rerun; other
  historical outcomes remain as captured.
- Delete the two stale registration sidecars and add the two explicitly
  non-registration migration records with the exact reachable import commit,
  done-spec target, SHA-pinned permalink, preserved ticket key, and disclaimer
  required by AC3.
- Recapture the fixture only with authenticated, read-only `gh api` calls:
  `repos/m0r6aN/agent-skills/rules/branches/main`,
  `repos/m0r6aN/agent-skills/rulesets/17746056`, and
  `repos/m0r6aN/agent-skills/rulesets/22369510`. Persist each exact command,
  capture timestamp, full current `main` SHA, and verbatim parsed response.
  Immediately repeat and deep-compare all three captures. Any drift is a stop;
  never mutate rulesets.
- Use Node `D:/nvm/v24.19.0/node.exe` (or prepend `D:/nvm/v24.19.0` to the
  process-local PATH). Run the applicable integration tests, typecheck, lint,
  JSON parsing, reachable-object/path/link probes, post-edit tracked search,
  and exact diff-path allowlist check. Preserve direct exit markers and full
  output.
- Commit only after all checks pass. Report the full builder SHA and evidence;
  do not push or open a PR.
