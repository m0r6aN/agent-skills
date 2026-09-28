# E6-R1 Stage-F Pre-emission Merge Observation

**Captured at:** `2026-09-06T14:45:43.7005000Z`
**Repository:** `m0r6aN/agent-skills`
**PR:** `#19`
**Frozen PR head:** `d1bf93f555e0e0e611d08089e6402ed6caaf1cfe`
**Observed merge SHA:** `57c8a4d2775cac6c37a771392fc0c531d4a35af2`

## Human provenance

Clint supplied this explicit task-level confirmation after the coordinator had
stopped at the human merge gate:

> PR #19 merged

This statement is the human provenance required by E6-R1. GitHub metadata is
binding corroboration; it is not treated as proof that a shared credential was
human-operated.

## Exact read-only commands

```text
gh pr view 19 --repo m0r6aN/agent-skills --json number,state,mergedAt,mergedBy,mergeCommit,headRefOid,baseRefName,url,statusCheckRollup
gh issue view 18 --repo m0r6aN/agent-skills --json number,state,title,url,updatedAt
git fetch origin main
git rev-parse origin/main
git merge-base --is-ancestor d1bf93f555e0e0e611d08089e6402ed6caaf1cfe origin/main
```

## Raw GitHub PR observation

```json
{"baseRefName":"main","headRefOid":"d1bf93f555e0e0e611d08089e6402ed6caaf1cfe","mergeCommit":{"oid":"57c8a4d2775cac6c37a771392fc0c531d4a35af2"},"mergedAt":"2026-09-06T14:24:52Z","mergedBy":{"id":"MDQ6VXNlcjM1MjI5ODgw","is_bot":false,"login":"m0r6aN","name":"m0r6aN"},"number":19,"state":"MERGED","url":"https://github.com/m0r6aN/agent-skills/pull/19"}
```

The full check rollup was also re-read. Both configured required contexts,
`test` and `integration-report`, remained `SUCCESS` on the frozen PR head.

## Raw issue-state observation

```json
{"number":18,"state":"OPEN","title":"[TEST] [w4-closeout-e6-r1] Current-repository identity migration evidence","updatedAt":"2026-09-06T12:14:37Z","url":"https://github.com/m0r6aN/agent-skills/issues/18"}
```

No issue-state mutation is authorized. The Stage-F `ticketTransition` must
therefore record `m0r6aN/agent-skills#18` from `OPEN` to `OPEN`.

## Local lifecycle precondition

The goal-complete branch was created at current merged main
`57c8a4d2775cac6c37a771392fc0c531d4a35af2`, then the already-emitted Stage-E
commit was carried forward. Before Stage F, the active E6-R1 spec was moved to
`plugins/foreman-line/docs/specs/done/E6-R1-current-repository-identity-and-evidence-rerun.md`
and its frontmatter status was changed to `done`; the former `active/` path is
absent. The PR head is an ancestor of current main (`merge-base` exit 0).

## Pre-emission main-advance reconciliation

The first fail-closed emission attempt fetched `origin/main` and stopped before
writing because main had advanced after this observation. PR #20, an unrelated
skill-documentation repair, had moved main to
`126974b58370ad4e609216d7fbc69b0677340f11`. The coordinator inspected its
seven-file diff, confirmed it did not touch the E6-R1 closeout surfaces, merged
that current main tip into the isolated goal-complete branch, and repeated the
live checks. Both PR #19's head and merge commit remained ancestors of current
main, and current main was an ancestor of the goal-complete branch.

## Stage-F emission

At `2026-09-06T14:58:24.226Z`, the real `runStageF` accepted the sequence-4 Stage-E
tip and emitted `000005-F-closure-record.json` with hash
`3de881be904eb9bee9cb2b25034299a99b79a588b5308c00d81ba6847d66407f`.
The emitted subject records:

```json
{
  "mergeSha": "57c8a4d2775cac6c37a771392fc0c531d4a35af2",
  "ticketTransition": {
    "ticketKey": "m0r6aN/agent-skills#18",
    "fromStatus": "OPEN",
    "toStatus": "OPEN"
  },
  "specLifecycleMove": {
    "from": "plugins/foreman-line/docs/specs/active/E6-R1-current-repository-identity-and-evidence-rerun.md",
    "to": "plugins/foreman-line/docs/specs/done/E6-R1-current-repository-identity-and-evidence-rerun.md"
  }
}
```

The immediate post-emission check loaded only conforming receipt filenames and
proved a count of six, stages `A,B,C,D,E,F`, every individual receipt valid,
`validateChain(chain).valid === true`, and `isSealed(chain) === true`.

```text
E6_R1_STAGE_F_EMIT_AND_EXIT=0
```
