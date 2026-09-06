# E6-R1B builder rework kickstarter — marketplace and evidence guards

You are the same isolated E6-R1 builder. Work only in
`D:/Repos/agent-skills-worktrees/w4-closeout-e6-r1-builder-20260906` on branch
`feat/foreman-line-E6-R1`. Never touch the ambient checkout, change branches,
push, open or merge a PR, mint a receipt, mutate an issue or ruleset, call Jira,
or write to another repository.

Standing constraints apply —
`plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`.

## Authority

- Active spec:
  `plugins/foreman-line/docs/specs/active/E6-R1-current-repository-identity-and-evidence-rerun.md`
- Ratified E6-R1B:
  `plugins/foreman-line/docs/goals/w4-closeout/e6-r1b-marketplace-and-evidence-guard-amendment.md`
- Sustained review evidence:
  `plugins/foreman-line/docs/goals/w4-closeout/e6-r1-implementation-review-a-findings.md`
  and
  `plugins/foreman-line/docs/goals/w4-closeout/e6-r1-implementation-review-b-findings.md`
- The existing E6-R1 Gate-2 grant extends only to this bounded same-builder
  rework and two independent read-only re-reviews of the final SHA.

## Rework Step 0 — restate and stop

Before editing anything:

1. Read this kickstarter, the active spec, ratified E6-R1B, both review reports,
   and the standing constraints in full.
2. Run `git branch --show-current`, `git rev-parse HEAD`, and
   `git status --short -uall`; confirm the isolated boundary is clean.
3. Restate the complete E6-R1B decision and all verification additions.
4. Restate that the amended builder allowlist is exactly the 46 paths in the
   active spec. Identify the only expected rework edits as
   `.claude-plugin/marketplace.json`,
   `plugins/audit-suite/audit-suite/README.md`, and
   `plugins/foreman-line/integration/tests/effective-rules.test.ts`.
5. Record the inherited integration-test tripwire baseline of 250 tests and
   explain how any changed count will be reconciled.
6. Stop without any edit, deletion, commit, network write, or other mutation
   until the coordinator accepts this rework Step 0.

## Build only after acceptance

- Add exactly one Audit Suite entry to the existing root marketplace without
  renaming it, and make the living README identifiers use
  `audit-suite@m0r6an-agent-skills`.
- Bind the effective-rules test to the full auditable response structure named
  by E6-R1B and add the stripped-capture red mutation without byte-pinning the
  entire response.
- Run the E6-R1B verification additions plus the applicable full E6-R1 suite.
  Preserve full output and direct exit markers. The final branch diff against
  the approved base must contain only the 46 Allowed Files, the locked legacy
  search must remain zero, and the rework commit itself must touch only the
  three expected paths above.
- Commit only after every check passes. Report the final SHA and evidence; do
  not push or open a PR.
