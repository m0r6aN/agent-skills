# Goal-Charter Amendment — D4-R1 Ruleset Retarget

**Goal:** `w4-closeout`
**Status:** RATIFIED 2026-09-05 — HOLD; superseded by ratified D4-R2B
**Decision owner:** Clint Morgan
**Coordinator:** canonical task `/root`, transferred at a parcel boundary; anchored to worktree `D:/Repos/agent-skills-worktrees/w4-closeout-d4-r1-20260905`, branch `docs/foreman-w4-closeout-d4-r1`, and base `a345ce408cc5ee8c3ae44eed34ad6593434f03aa`

This amendment controls wherever it conflicts with the original D4 ruleset identity and
exit-check wording. All unaffected decisions, completed parcel evidence, deferred debts,
and human-gate boundaries remain unchanged.

**Review disposition:** [`d4-r1-plan-review-findings.md`](./d4-r1-plan-review-findings.md)
records two critical live-topology blockers. This D4-R1 text preserves the exact ratified
proposal but is not executable and must not be committed as the controlling replacement
without a ratified correction. D4-R2B is recorded in
[`d4-r2b-sole-owner-compromise-amendment.md`](./d4-r2b-sole-owner-compromise-amendment.md).

## Ratification record

On 2026-09-05, after PR #16 merged, Clint Morgan stated exactly:

> Transfer w4-closeout ownership to this session and ratify D4-R1 as recommended.

This transfers coordinator ownership from the July 2026 session to the current Codex
session at a parcel boundary and closes the narrowly reopened Gate 1 for D4-R1. It does
not authorize the coordinator to mutate repository rulesets, merge its own governance
record, restore unrelated historical rules, or close the goal without live verification.

## Reconciled live state

The coordinator verified the following through the GitHub API before presenting D4-R1:

- PR #16 merged to `main` as `a345ce408cc5ee8c3ae44eed34ad6593434f03aa`.
- Repository `m0r6aN/agent-skills` has one current repository ruleset: active ruleset
  `17746056`, named `main`.
- Ruleset `17746056` contains only `deletion` and `non_fast_forward`, has
  `bypass_actors: []`, and reports `current_user_can_bypass: never`.
- The effective rules for `main` expose only those two rules. Classic branch protection
  returns `404 Branch not protected`.
- Historical ruleset `19402394` is absent from the current repository ruleset inventory,
  so the original D4 target cannot be edited or verified in this repository.
- `.github/workflows/foreman-line-ci.yml` has unfiltered `push` and `pull_request`
  triggers and emits the named `test` and `integration-report` jobs. PR #16 supplied green
  hosted executions for both jobs on its corrected head.

These observations establish the retargeting need. They are not proof that D4 is already
satisfied.

## D4-R1 replacement

| ID | Ratified replacement | Consequence |
|---|---|---|
| D4-R1 | Apply the final W4 ruleset hardening to current active ruleset `17746056` (`main`), superseding the unavailable historical target `19402394`. Preserve its existing `deletion` and `non_fast_forward` rules and `bypass_actors: []`; add a pull-request rule with `required_approving_review_count >= 1`; and add required status checks for exactly `test` and `integration-report`. Clint applies the live ruleset mutation after this amendment record merges. The coordinator then verifies the effective rules through the GitHub API before recording exit item 1 closed. | Retargets the already-ratified protection outcome to the repository's current rule identity without treating historical rules as live or widening the mutation. One approving review prevents PR authors from satisfying their own merge gate, and the two always-reporting Foreman jobs become the required green chain. |

The human-applied change must preserve:

1. active enforcement on the default branch;
2. `deletion` protection;
3. `non_fast_forward` protection;
4. `bypass_actors: []`;
5. a pull-request rule with at least one approving review; and
6. required status contexts `test` and `integration-report`.

## Amended exit check

D4 is closed only when the coordinator's post-mutation read-only verification confirms
all six properties above on ruleset `17746056`, and confirms the effective rules for
`main` include both the pull-request and required-status-check rules. A settings-page
screenshot, intended configuration, or successful prior PR does not substitute for the
effective-rules response.

## Boundaries retained

- The ruleset mutation remains a human action; no API write is authorized here.
- The governance-record PR is human-merged before the live ruleset mutation.
- No CodeQL, code-quality, deployment, publication, installed-host, SDK/adapter,
  DocSpine, Jira, or other deferred scope is added by D4-R1.
- Existing open debts remain deferred exactly as recorded by the charter and loop
  directive.
- After live verification, goal completion still requires a durable goal-complete update
  through the normal PR path.
