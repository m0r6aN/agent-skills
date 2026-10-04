# U1 live provisioning changes, 2026-10-02 (closure-review round 2)

**Authority:** owner blanket authority, 2026-10-02 ("execute the live changes you recommend"),
covering G-1, G-2, G-11, G-14 of `U1-8-closure-verdict-2026-10-02.json`. Executed by the
reviewer session (anthropic/claude-sonnet-5-5) with the ambient owner CLI login (m0r6aN).
This record is evidence for INCOMPLETE-U1-09/-14/-15/-19 and A-U1.8.17/.22/.26; it is not a
ratification of A-U1.8.17..27 (the amendment text is still DRAFT).

## Changes and post-state GETs

| Finding | Change | Post-state (GET) |
|---|---|---|
| G-1 | Created repository ruleset **24378879** `u1-verifier-pin`, target `tag`, enforcement `active`, include `refs/tags/u1-verifier-pin`, rules `update`, `deletion`, `non_fast_forward`, bypass: custodian only (user 35229880 / m0r6aN, `always`). Replaces the vanished ruleset 24258920. | tag ref `refs/tags/u1-verifier-pin` -> `27323ec87880c53e300418ee24b1497e94f2261f`; `GET rulesets/24378879` as listed. |
| G-11 | `main-pr-gate` (22369510): `bypass_actors` set to `[]` (was m0r6aN `always`). Rules unchanged (`pull_request`, `required_status_checks`: `test`, `integration-report`; required approvals stay 0). | `GET rulesets/22369510` -> `bypass_actors: []`, enforcement `active`. |
| G-2 | Deleted deployment-branch policy **61546414** (`main`, type `branch`) from environment `u1-verifier`. Added federated credential `u1-reader-run-fc` (subject `repo:m0r6aN/agent-skills:ref:refs/heads/main`, issuer GitHub OIDC, audience `api://AzureADTokenExchange`) on `u1-reader-mi` (clientId 92737cbb-0a55-4355-b1fe-c6169eb0df4b; role: Storage Blob Data Reader at container `u1-evidence` only, no condition, already present). | `deployment-branch-policies` for `u1-verifier` -> only `61684968` (`u1-verifier-pin`, type `tag`). |
| G-14 | Verifier role assignment `04dff4c8-311d-42ba-879c-16fd65a858fb` (`u1-verifier-evidence-creator`, principal 9f31b12b…, container scope): ABAC condition extended with `@Request[...blobs:prefix] StringStartsWith 'u1/m0r6an/agent-skills/revocations/'` and `@Resource[...blobs:path] StringLike 'u1/m0r6an/agent-skills/revocations/*'` (appended inside the existing OR group; conditionVersion 2.0). | Re-listed condition ends with the two new clauses; closing parenthesis intact. |

Pre-change values: ruleset 24258920 -> 404 (absent); main-pr-gate bypass `[{35229880, User, always}]`;
u1-verifier policies `61546414 main` + `61684968 tag u1-verifier-pin`; verifier condition had only
`verifications/` and `attempt-ledger/` prefixes.

## Not done / caveats (stated, not hidden)

- **Not functionally tested:** the new `revocations/*` ABAC clause was not exercised with the verifier
  token (no verifier credential used). Azure ABAC changes can take several minutes to propagate. The
  tag ruleset and the `main-pr-gate` bypass removal were not exercised with a non-bypass identity.
- **`agent-skills-default` (24257508) still lists m0r6aN as bypass actor `always`.** Only the
  `main-pr-gate` bypass was in the authorized set. The owner can still push to `main` directly through
  this ruleset; A-U1.8.11 P1 concerns the *builder* credential, which must not hold this right.
- **Reader federated credential is ref-bound, not workflow-bound.** `u1-reader-run-fc` admits any job
  running on `refs/heads/main`. Binding to `job_workflow_ref` + `repository_id` needs GitHub OIDC
  subject customization, which changes the subject of every workflow in the repository and would break
  the existing federated credentials; not attempted. Reader is read-only at one container.
- **Pre-existing `u1-reader-fc` (subject `repo:m0r6aN/agent-skills:pull_request`)** on `u1-reader-mi`
  predates this session and grants container read to pull_request-triggered workflows in this
  repository. Not changed (outside the recommended set). Recommend review and likely deletion.
- **The pinned verifier (16a7e0fb) still declares `environment: u1-verifier` on the `workflow_run`
  lane.** With the `main` policy deleted that lane now fails at the environment gate (fail-closed)
  until the A-U1.8.22 workflow change lands in the re-pin. The authoritative lane (tag dispatch) is
  unaffected by G-2.
- The pinned verifier does not yet check the tag ruleset (A-U1.8.17 clause 2 is not implemented);
  the ruleset is now present, so the check will pass when implemented.
- The pin record, checklist and amendment text still cite ruleset 24258920; A-U1.8.17 clause 4 and
  A-U1.8.11 P1 must cite **24378879** when ratified.

## Addendum A (2026-10-02, owner authority "All five steps ratified as written. Proceed with full authority")

| Change | Detail | Post-state |
|---|---|---|
| Step 1 | `agent-skills-default` (24257508): `bypass_actors` set to `[]` (was m0r6aN `always`). Rules unchanged. | `GET rulesets/24257508` -> `bypass_actors: []`. |
| Step 1 | Deleted federated credential `u1-reader-fc` (subject `repo:m0r6aN/agent-skills:pull_request`) from `u1-reader-mi`. | `u1-reader-mi` FICs: `u1-reader-run-fc`, `u1-reader-tag-fc`. |
| A-U1.8.22 cl.4/6 | Created `u1-reader-tag-fc` (subject `repo:m0r6aN/agent-skills:ref:refs/tags/u1-verifier-pin`, GitHub OIDC issuer, audience `api://AzureADTokenExchange`) on `u1-reader-mi`. | listed above |
| A-U1.8.22 cl.4/6 | Role assignment `114f1381-fe50-44aa-b552-e9e9502e1078`: `Reader` for `u1-reader-mi` (principal 23e1415d-37f6-460f-bfa1-349ecd046490) at storage account `bs2jhgwvduljfdwdp` scope (management-plane immutability GET). Data-plane `Storage Blob Data Reader` at container scope pre-existed. | `az role assignment list` shows both. |

After this addendum no branch ruleset lists a bypass actor; the only bypass is the custodian on the tag ruleset
24378879 (needed to move the pin tag).

## Addendum B (2026-10-02) - temporary pull-request-only bypass while the baseline is red

Cause: after step 1 removed the owner bypass, PR #130 could not merge. The required checks `test` and
`integration-report` were already red on `main` before this work (run 37033700779 at ebebea1: sweep (3), test,
integration-report; the failures are in unrelated suites, e.g. a missing `docs/specs/active/FK-P17-bypass-outage-matrix.md`
and the retired legacy governed-inference path), and ruleset `agent-skills-default` (24257508) requires code-scanning
results while code scanning is `not-configured` (`code-scanning/analyses` 404, default setup `not-configured`), so that rule
can never be satisfied.

Authority: A-U1.8.11 clause 3 ("any future re-addition requires the same red-baseline condition and its own sunset
record") and the owner's blanket authority of 2026-10-02.

| Ruleset | Change | Mode |
|---|---|---|
| 22369510 `main-pr-gate` | bypass actor 35229880 (m0r6aN) re-added | `pull_request` (merging a PR only; no direct push) |
| 24257508 `agent-skills-default` | bypass actor 35229880 (m0r6aN) re-added | `pull_request` |

Sunset record: both bypass entries exist only to merge the pull requests of the A-U1.8.27 sequence (PR #130 merged as
77e0d9e; the candidate-pin PR and the final-pin PR). They are removed again immediately after the final-pin merge and the tag
move, or earlier if the baseline turns green and code scanning is configured. Removal is recorded as ruleset GET evidence
in Addendum C.

## Addendum C (2026-10-02, after the final tag move) - sunset executed, final live state

The temporary pull-request-only bypass of Addendum B was removed from both rulesets after the last pull request of the
A-U1.8.27 sequence (#137) merged and the tag moved to ed848ba0595f7c8f6e01c1655babc725a73c2ef2, and after the final-tag
smoke run (37065869917). Evidence (GET after the change):

| Object | State |
|---|---|
| ruleset 22369510 `main-pr-gate` | active, `bypass_actors: []`, rules pull_request + required_status_checks |
| ruleset 24257508 `agent-skills-default` | active, `bypass_actors: []`, rules deletion, non_fast_forward, pull_request, code_scanning, code_quality, copilot_code_review |
| ruleset 24378879 `u1-verifier-pin` | active, tag, bypass: user 35229880 `always` (custodian, needed to move the pin tag), rules update, deletion, non_fast_forward |
| environment `u1-verifier` deployment policies | one: id 61684968, type tag, `u1-verifier-pin` |
| `refs/tags/u1-verifier-pin` target | ed848ba0595f7c8f6e01c1655babc725a73c2ef2 |

Consequence to know: with no bypass, a pull request to `main` cannot merge while code scanning is not configured
(ruleset 24257508 requires code-scanning results) and while `test`/`integration-report` are red. That is a repository
state outside U1; it needs a decision (configure code scanning, or change that rule) before any further `main` change.
Note: this file's `main` copy ends at Addendum B; Addendum C is recorded on `dev` because adding it to `main` would
have needed a new bypass.
