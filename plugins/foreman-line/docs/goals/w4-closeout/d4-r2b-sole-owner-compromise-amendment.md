# Goal-Charter Amendment — D4-R2B Sole-Owner Compromise

**Goal:** `w4-closeout`
**Status:** RATIFIED 2026-09-05 — fresh follow-up review PASS
**Decision owner:** Clint Morgan
**Coordinator:** canonical task `/root`, transferred at a parcel boundary; anchored to worktree `D:/Repos/agent-skills-worktrees/w4-closeout-d4-r1-20260905`, branch `docs/foreman-w4-closeout-d4-r1`, and base `a345ce408cc5ee8c3ae44eed34ad6593434f03aa`

This amendment supersedes the original D4 ruleset identity and the held D4-R1 proposal.
All other locked decisions, completed parcel evidence, deferred debts, and human-only
ruleset boundaries remain unchanged.

**Review record:** [`d4-r2b-plan-review-findings.md`](./d4-r2b-plan-review-findings.md)

## Ratification record

On 2026-09-05, after reviewing the D4-R1 HOLD and the two explicit alternatives, Clint
Morgan stated exactly:

> Ratify D4-R2B sole-owner compromise

This closes the narrowly reopened Gate 1 for the ruleset topology, sole-owner approval
downgrade, complete protection parameters, required-check source binding, and closure
sequence below. The fresh follow-up adversarial review must return PASS before this record
is committed or published. Any decision-changing review correction reopens only the
affected D4-R2B decision.

## Explicit compromise

The repository remains sole-owned by `m0r6aN`. D4-R2B mechanically requires pull requests
and trusted green checks for `main`, but requires zero approving reviews. It therefore does
**not** prove that an agent operating with the owner's GitHub authority cannot merge its
own PR. The original W4 phrase “agents cannot merge” is replaced for this repository by:

> Updates to `main` require a pull request and both trusted Foreman status checks; human
> merge ownership remains a process gate, not a configuration-enforced identity split.

This is an owner-approved weakening of one exit claim, not evidence that independent
approval exists.

## Ratified ruleset topology

### Existing all-branch safety ruleset — preserve unchanged

Ruleset `17746056`, named `main`, remains active and byte-for-field unchanged:

- target: `branch`;
- include conditions: `~DEFAULT_BRANCH` and `~ALL`;
- exclude conditions: none;
- rules: `deletion` and `non_fast_forward` only; and
- `bypass_actors: []`.

Any live drift in this ruleset before the human mutation is a stop condition. D4-R2B never
adds pull-request or status-check rules to `17746056` and never narrows its branch scope.

### New default-branch gate — human-created

After this governance record merges, Clint creates a separate active repository ruleset
named `main-pr-gate` with this complete desired state:

- target: `branch`;
- include conditions: exactly `~DEFAULT_BRANCH`;
- exclude conditions: none;
- `bypass_actors: []`;
- `pull_request` parameters:
  - `required_approving_review_count: 0`;
  - `dismiss_stale_reviews_on_push: false`;
  - `require_code_owner_review: false`;
  - `require_last_push_approval: false`;
  - `required_review_thread_resolution: true`;
  - `allowed_merge_methods: [merge, squash, rebase]`; and
- `required_status_checks` parameters:
  - `strict_required_status_checks_policy: true`;
  - `do_not_enforce_on_create: false`;
  - context `test`, pinned to GitHub Actions integration ID `15368`; and
  - context `integration-report`, pinned to GitHub Actions integration ID `15368`.

The merge-method list preserves the repository's current enabled merge methods. Strict
checks deliberately require the PR branch to be current with `main`. The approval-related
flags are false because there is no qualifying independent reviewer; thread resolution
remains required when review conversations exist.

## Human-gate and verification sequence

1. The corrected governance PR reports successful `test` and `integration-report` checks
   from GitHub Actions app ID `15368`; Clint human-merges it.
2. Immediately before the settings change, the coordinator performs a read-only live-state
   comparison. Any changed collaborator topology, ruleset inventory, ruleset `17746056`
   field, workflow job name, check producer, or merge-method setting stops the sequence.
3. Clint creates `main-pr-gate` through the GitHub ruleset UI with the exact state above.
   The coordinator does not perform the API write.
4. The coordinator verifies the new ruleset-detail response, unchanged ruleset `17746056`,
   and aggregated effective rules for `main`.
5. The coordinator opens the durable goal-complete PR. Its final SHA must be current with
   `main` and must receive successful `test` and `integration-report` checks from app ID
   `15368`; the merge box must show those checks as required. Clint human-merges it.
6. The coordinator verifies the goal-complete commit on `main` and rechecks both rulesets
   plus the effective `main` rules before reporting `w4-closeout` complete.

The governance and goal-complete merges remain human-owned even though D4-R2B cannot
configuration-enforce that identity separation.

## Amended exit criterion

W4 exit item 1 is closed under the D4-R2B compromise only when all of the following are
true at the same verified revision:

1. ruleset `17746056` remains active with its exact pre-D4-R2B conditions, rules, and empty
   bypass list;
2. active `main-pr-gate` targets exactly `~DEFAULT_BRANCH` with no exclusions or bypasses;
3. its pull-request parameters exactly match the ratified zero-approval values above;
4. its required-status parameters are strict and require exactly `test` and
   `integration-report`, both pinned to app ID `15368`;
5. the effective rules for `main` contain deletion, non-fast-forward, pull-request, and
   required-status-check protection;
6. `current_user_can_bypass` is `never` for both repository rulesets;
7. the goal-complete PR proves the required checks on its final SHA and is human-merged;
8. the durable goal-complete record is present on `main`; and
9. the final report explicitly states that zero approvals leaves agent self-merge
   technically possible under shared owner credentials.

## Boundaries retained

- No agent API write may create, edit, disable, or delete a ruleset.
- No collaborator, invitation, credential, bot, GitHub App, workflow, branch, deployment,
  publication, Jira, installed-host, SDK/adapter, DocSpine, or deferred-debt change is
  authorized by D4-R2B.
- The failing unrelated `Validate skill content` check is neither required, fixed, nor
  waived by this amendment.
- A same-named ruleset, unexpected effective rule, missing trusted check, or any pre-write
  drift is a stop-and-report condition.
