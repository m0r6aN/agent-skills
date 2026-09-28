# E6-R1 Stage-E Pre-emission GitHub Observation

**Captured at:** `2026-09-06T14:06:57.4844434Z`
**Repository:** `m0r6aN/agent-skills`
**PR:** `#19`
**Frozen head:** `d1bf93f555e0e0e611d08089e6402ed6caaf1cfe`

This evidence was captured immediately before Stage E with read-only GitHub
operations. It is outside the receipt directory by design. Local HEAD, remote
branch head, PR `headRefOid`, and the final PR commit all equalled the frozen
head above. The PR was open, non-draft, based on `main`, and mergeable.

## Exact commands

```text
git rev-parse HEAD
git rev-parse origin/codex/w4-closeout-e6-r1-control
gh api repos/m0r6aN/agent-skills/commits/main --jq .sha
gh pr view 19 --repo m0r6aN/agent-skills --json number,state,isDraft,baseRefName,headRefName,headRefOid,mergeable,mergeStateStatus,statusCheckRollup,url,updatedAt
gh api repos/m0r6aN/agent-skills/pulls/19/commits --paginate --jq '.[].sha'
gh api repos/m0r6aN/agent-skills/rules/branches/main
BASE_SHA=b30873ec2db566b185cdfcf1a191e4f8ec8be1ee npx tsx src/report.ts
gh run view 34008538467 --repo m0r6aN/agent-skills --json headSha,status,conclusion,event,url
```

## Raw PR observation

```json
{"baseRefName":"main","headRefName":"codex/w4-closeout-e6-r1-control","headRefOid":"d1bf93f555e0e0e611d08089e6402ed6caaf1cfe","isDraft":false,"mergeStateStatus":"BLOCKED","mergeable":"MERGEABLE","number":19,"state":"OPEN","statusCheckRollup":[{"__typename":"CheckRun","completedAt":"2026-09-06T13:59:06Z","conclusion":"FAILURE","detailsUrl":"https://github.com/m0r6aN/agent-skills/actions/runs/34037727167/job/101498759039","name":"Validate skill content","startedAt":"2026-09-06T13:58:56Z","status":"COMPLETED","workflowName":"Test Plugin Installation"},{"__typename":"CheckRun","completedAt":"2026-09-06T13:59:05Z","conclusion":"FAILURE","detailsUrl":"https://github.com/m0r6aN/agent-skills/actions/runs/34037725727/job/101498755541","name":"Validate skill content","startedAt":"2026-09-06T13:58:55Z","status":"COMPLETED","workflowName":"Test Plugin Installation"},{"__typename":"CheckRun","completedAt":"2026-09-06T14:02:21Z","conclusion":"SUCCESS","detailsUrl":"https://github.com/m0r6aN/agent-skills/actions/runs/34037727184/job/101498759124","name":"test","startedAt":"2026-09-06T13:58:56Z","status":"COMPLETED","workflowName":"foreman-line-ci"},{"__typename":"CheckRun","completedAt":"2026-09-06T14:01:33Z","conclusion":"SUCCESS","detailsUrl":"https://github.com/m0r6aN/agent-skills/actions/runs/34037725705/job/101498755442","name":"test","startedAt":"2026-09-06T13:58:55Z","status":"COMPLETED","workflowName":"foreman-line-ci"},{"__typename":"CheckRun","completedAt":"2026-09-06T13:59:06Z","conclusion":"SKIPPED","detailsUrl":"https://github.com/m0r6aN/agent-skills/actions/runs/34037727167/job/101498787781","name":"Validate plugin structure","startedAt":"2026-09-06T13:59:06Z","status":"COMPLETED","workflowName":"Test Plugin Installation"},{"__typename":"CheckRun","completedAt":"2026-09-06T13:59:05Z","conclusion":"SKIPPED","detailsUrl":"https://github.com/m0r6aN/agent-skills/actions/runs/34037725727/job/101498785539","name":"Validate plugin structure","startedAt":"2026-09-06T13:59:05Z","status":"COMPLETED","workflowName":"Test Plugin Installation"},{"__typename":"CheckRun","completedAt":"2026-09-06T14:02:32Z","conclusion":"SUCCESS","detailsUrl":"https://github.com/m0r6aN/agent-skills/actions/runs/34037727184/job/101499253260","name":"integration-report","startedAt":"2026-09-06T14:02:26Z","status":"COMPLETED","workflowName":"foreman-line-ci"},{"__typename":"CheckRun","completedAt":"2026-09-06T14:01:39Z","conclusion":"SUCCESS","detailsUrl":"https://github.com/m0r6aN/agent-skills/actions/runs/34037725705/job/101499138860","name":"integration-report","startedAt":"2026-09-06T14:01:36Z","status":"COMPLETED","workflowName":"foreman-line-ci"},{"__typename":"CheckRun","completedAt":"2026-09-06T13:59:06Z","conclusion":"SKIPPED","detailsUrl":"https://github.com/m0r6aN/agent-skills/actions/runs/34037727167/job/101498787614","name":"Test plugin installation","startedAt":"2026-09-06T13:59:06Z","status":"COMPLETED","workflowName":"Test Plugin Installation"},{"__typename":"CheckRun","completedAt":"2026-09-06T13:59:05Z","conclusion":"SKIPPED","detailsUrl":"https://github.com/m0r6aN/agent-skills/actions/runs/34037725727/job/101498785738","name":"Test plugin installation","startedAt":"2026-09-06T13:59:05Z","status":"COMPLETED","workflowName":"Test Plugin Installation"}],"updatedAt":"2026-09-06T13:58:50Z","url":"https://github.com/m0r6aN/agent-skills/pull/19"}
```

## Raw effective-main rules

```json
[{"type":"deletion","ruleset_source_type":"Repository","ruleset_source":"m0r6aN/agent-skills","ruleset_id":17746056},{"type":"non_fast_forward","ruleset_source_type":"Repository","ruleset_source":"m0r6aN/agent-skills","ruleset_id":17746056},{"type":"pull_request","parameters":{"required_approving_review_count":0,"dismiss_stale_reviews_on_push":false,"required_reviewers":[],"require_code_owner_review":false,"require_last_push_approval":false,"required_review_thread_resolution":true,"require_extra_approval_for_unattributed_changes":false,"allowed_merge_methods":["merge","squash","rebase"]},"ruleset_source_type":"Repository","ruleset_source":"m0r6aN/agent-skills","ruleset_id":22369510},{"type":"required_status_checks","parameters":{"strict_required_status_checks_policy":true,"do_not_enforce_on_create":false,"required_status_checks":[{"context":"test","integration_id":15368},{"context":"integration-report","integration_id":15368}]},"ruleset_source_type":"Repository","ruleset_source":"m0r6aN/agent-skills","ruleset_id":22369510}]
```

Both occurrences of required `test` and `integration-report` in the PR capture
concluded `SUCCESS`; they are the only status checks required by the effective
main rules, both pinned to GitHub Actions integration ID `15368` with strict
policy enabled. The two optional `Validate skill content` runs reproduce the
same pre-existing failure on current main run `34008538467` at
`b30873ec2db566b185cdfcf1a191e4f8ec8be1ee`; their reported defects are in six
untouched skill packages and are not configured merge-gating checks.

## Raw audit-trigger output

```text
::warning::audit-trigger: decision=elevated triggered=true drift=false declared=elevated derived=low
::notice::audit-trigger: governingSpec=plugins/foreman-line/docs/specs/active/E6-R1-current-repository-identity-and-evidence-rerun.md changedPaths=70
::notice::audit-trigger reason: multi-spec: plugins/foreman-line/docs/specs/active/E6-R1-current-repository-identity-and-evidence-rerun.md, plugins/foreman-line/docs/specs/active/FL-R2-real-audit-loader.md, plugins/foreman-line/docs/specs/active/FL-R3-push-failure-stop.md, plugins/foreman-line/docs/specs/active/FL-R4-package-ci.md, plugins/foreman-line/docs/specs/active/P1-plugin-packaging.md
E6_R1_PRE_E_AUDIT_REPORT_EXIT=0
```

Stage E must therefore use `prRef` containing PR 19 and the frozen head,
successful `test` and `integration-report` outcomes, and
`auditTrigger.triggered === true` with the observed reasons. This observation
does not authorize a merge; the PR remains a human-merge stop.

## Emission and repeated deterministic binding

The real `runStageE` accepted the sequence-3 Stage-D tip and emitted sequence 4
with hash `ce824f9bdd3248f4aadd0ec9a8228fcf69c720ca7168b61a53c5c44fa2d86a91`.
Its `prRef` is
`pr-19@d1bf93f555e0e0e611d08089e6402ed6caaf1cfe`, its two `ciJobs` are the
observed successful required contexts, and its projected audit trigger is true
with the observed multi-spec reason.

The immediate post-emission deterministic rerun re-read GitHub and proved:

```text
receiptCount=5
stages=A,B,C,D,E
chainValid=true
sealed=false
pr=19
prState=OPEN
head=d1bf93f555e0e0e611d08089e6402ed6caaf1cfe
headMatches=true
headIsPrCommit=true
test=success
integration-report=success
receiptHash=ce824f9bdd3248f4aadd0ec9a8228fcf69c720ca7168b61a53c5c44fa2d86a91
E6_R1_STAGE_E_DETERMINISTIC_BINDING_EXIT=0
```
