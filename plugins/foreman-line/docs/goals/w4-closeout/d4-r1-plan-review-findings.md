# D4-R1 Fresh Adversarial Review Findings

**Goal:** `w4-closeout`
**Review date:** 2026-09-05
**Reviewed amendment:** `d4-r1-ruleset-retarget-amendment.md`
**Verdict:** HOLD — narrowly reopen Gate 1 for D4-R2 before any commit, push, PR, or ruleset mutation

The reviewer worked read-only from the isolated D4-R1 worktree, read the charter,
amendment, loop directive, coordinator canon, and current workflow, and independently
checked live GitHub state. No reviewer edit or external mutation occurred.

## Findings and coordinator triage

| ID | Severity | Finding | Coordinator disposition |
|---|---|---|---|
| D4R1-B1 | CRITICAL | Ruleset `17746056` targets both `~DEFAULT_BRANCH` and `~ALL`. Adding pull-request and required-check rules to it would apply those gates to every branch and create a circular feature-branch delivery constraint. Narrowing its conditions would silently remove its current deletion/non-fast-forward protection from non-default branches. | **FIX in D4-R2.** Preserve `17746056` unchanged. Recommended replacement is a separate default-branch-only ruleset for PR/review/status gates. |
| D4R1-B2 | CRITICAL | `m0r6aN` is the only repository collaborator and there are no pending invitations. With one required approval and no bypass actor, owner-authored PRs cannot obtain a qualifying independent approval, including the post-hardening goal-complete PR. | **FIX in D4-R2.** Establish an independent write-capable reviewer or explicitly ratify a weaker zero-approval outcome. No ruleset hardening until the selected path is proven by a canary PR. |
| D4R1-H1 | HIGH | Required status contexts were named but their trusted producer was not pinned. Current successful runs show both jobs are produced by GitHub Actions app ID `15368`. | **FIX in D4-R2.** Pin `test` and `integration-report` to GitHub Actions app ID `15368` and verify those source IDs after mutation. |
| D4R1-H2 | HIGH | Required-check strictness and pull-request parameters were unspecified, leaving human UI defaults to decide merge semantics. | **FIX in D4-R2.** Ratify exact ref conditions, strictness, stale-review behavior, last-push approval, code-owner behavior, thread-resolution behavior, and allowed merge methods before mutation. |
| D4R1-H3 | HIGH | The post-hardening goal-complete PR has no viable approval/merge path under the sole-collaborator topology. | **FIX in D4-R2.** Name the author, independent approver, human merger, and final `main` verification sequence. |
| D4R1-M1 | MEDIUM | Exit verification omitted the complete ref conditions, check-source IDs, strictness, pull-request parameters, and `current_user_can_bypass`. | **FIX in D4-R2.** Verify the complete new ruleset, unchanged all-branch ruleset, aggregated effective rules, and a final-SHA canary. |
| D4R1-M2 | MEDIUM | “Current Codex coordinator session” is deictic and insufficient as a durable future-session identity. | **FIX in record.** Bind takeover to canonical coordinator task `/root`, worktree `D:/Repos/agent-skills-worktrees/w4-closeout-d4-r1-20260905`, branch `docs/foreman-w4-closeout-d4-r1`, and base/merge anchor `a345ce408cc5ee8c3ae44eed34ad6593434f03aa`. |

## Gate status

The user's exact D4-R1 ratification and ownership transfer remain recorded as historical
authority. D4-R1 is not executable because live-state facts make its chosen target unsafe
and its approval path impossible. Gate 1 is reopened only for D4-R2's:

1. ruleset topology and exact branch conditions;
2. independent-reviewer topology or explicit protection downgrade;
3. complete pull-request and status-check parameters;
4. required-check producer identity; and
5. governance-PR, canary, mutation, verification, and goal-complete sequence.

All other w4-closeout decisions, completed parcel evidence, deferred debts, and human-only
ruleset boundary remain unchanged.

## D4-R2B disposition

On 2026-09-05, Clint Morgan explicitly selected the sole-owner compromise by stating
`Ratify D4-R2B sole-owner compromise`. The correction preserves ruleset `17746056`
unchanged, moves PR/check enforcement to a separate default-branch-only ruleset, pins both
checks to GitHub Actions app ID `15368`, specifies the complete rule parameters, and
replaces the configuration-enforced independent-approval claim with an explicit
zero-approval limitation. The correction is not publishable until a fresh follow-up
adversarial review returns PASS.
