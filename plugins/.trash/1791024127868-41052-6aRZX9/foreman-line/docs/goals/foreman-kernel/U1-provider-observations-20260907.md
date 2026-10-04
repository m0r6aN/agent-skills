# U1 provider observations — September 7

Status: read-only selection evidence for the U1 draft, **not provider selection, implementation, or promotion proof**. Observed GitHub repository `m0r6aN/agent-skills` and official documentation on 2026-09-07; final observation clock was **14:58:11 UTC**. Repository settings, runs, permissions and documentation may change. Recheck selected identities and effective controls before dispatch/acceptance.

No workflow was dispatched, rerun or cancelled. No setting/ruleset/protection, credential, runner, artifact, release or other external resource was created/modified. No token, secret value, authentication link, signed download URL or job log was retrieved or recorded. Only this local planning document was written. No Node or dependency operation ran.

## Observed account and repository state

Repository metadata returned numeric ID `1271084487`, owner type `User`, visibility **PUBLIC**, `isPrivate:false`, default branch `main`, `archived:false`, `disabled:false`. The authenticated CLI session can read these APIs; metadata reported admin/maintain/push/pull/triage permissions. Those capabilities are not task authorization to change settings and do not prove a separate verifier identity. Public visibility is current observation, not a promise that every future artifact is readable or that account-level attestation issuance has been exercised. [Repository](https://github.com/m0r6aN/agent-skills)

The observed main commit was `476b8df6efe6c9974879957147449f61c34cd9a0`. Workflows were fetched at that immutable SHA, not from changing local worktrees:

| Workflow | Git blob | Observed relevant configuration |
|---|---|---|
| `.github/workflows/foreman-line-ci.yml` | `b2661793a4775d80f7e321d1d40a951423b52575` | Push/PR triggers, `contents: read`; Windows jobs use `windows-latest`; `actions/checkout@v4`, `actions/setup-node@v4`; Node `24.19.0` |
| `.github/workflows/test-plugin-install.yml` | `0c0a7b0aa4c8f96484a3bf25631f302bd0f495c9` | Push/PR/manual triggers; `ubuntu-latest`; checkout v4/v6 and setup-node v4 tags; Node `20` in one job; unpinned global installation of `@anthropic-ai/claude-code` in two jobs |

Both files had no `attest`, `upload-artifact` or `retention-days` occurrence in the inspected content. The current Actions catalog listed exactly these two workflows, both active. Mutable action/runner tags and unpinned legacy tooling are observations about existing CI, not proof that U1 has pinned identities or an independent verifier. No legacy workflow changes are proposed by this inventory. [Pinned main CI](https://github.com/m0r6aN/agent-skills/blob/476b8df6efe6c9974879957147449f61c34cd9a0/.github/workflows/foreman-line-ci.yml), [pinned installation workflow](https://github.com/m0r6aN/agent-skills/blob/476b8df6efe6c9974879957147449f61c34cd9a0/.github/workflows/test-plugin-install.yml).

Actions permissions returned `enabled:true`, `allowed_actions:all`, `sha_pinning_required:false`. Default workflow-token permissions were `read`, with `can_approve_pull_request_reviews:false`. These are repository settings, not proof of the effective permission envelope of a proposed attestation job. Workflows can declare their own allowed permissions subject to event/account policy. No secret inventory or values were requested.

## Effective rules: classic 404 does not mean unprotected

`GET .../branches/main/protection` returned **HTTP 404, Branch not protected**, and gh exit 1, confirmed by a focused rerun. The rulesets APIs nevertheless returned **two active rulesets**, and the effective branch-rules endpoint confirmed their application:

| Rule set | Conditions / effective controls | Independence implication |
|---|---|---|
| `17746056`, `main` | Includes default/all branches; deletion and non-fast-forward restrictions; bypass actors empty; current user bypass `never` | Protects these Git operations under the observed rule set; does not establish independent workflow review |
| `22369510`, `main-pr-gate` | Default branch; PR required, thread resolution required; strict required checks `test` and `integration-report`, integration ID 15368; bypass actors empty, current user bypass `never` | Existing PR/check gate, not U1 evidence acceptance |

The PR parameters explicitly had approving-review count **0**, `require_code_owner_review:false`, `require_last_push_approval:false`, `dismiss_stale_reviews_on_push:false`, and no required-reviewer entries. The complete recursive main tree response reported `truncated:false` and no CODEOWNERS at `.github/CODEOWNERS`, root `CODEOWNERS`, or `docs/CODEOWNERS`.

Consequently the observed controls do **not establish the independently controlled verifier/workflow change boundary U1 requires**. That is a statement about missing evidence for U1, not a claim there are no branch controls. Repository admin capability also does not mean this actor is an effective ruleset bypass actor. [Main ruleset](https://github.com/m0r6aN/agent-skills/rules/17746056), [PR/check ruleset](https://github.com/m0r6aN/agent-skills/rules/22369510), [effective rules API](https://api.github.com/repos/m0r6aN/agent-skills/rules/branches/main).

## Runner and run evidence

Repository self-hosted runner listing returned `total_count:0`, `runners:[]`. This describes the repository endpoint at inspection time; it is not a universal machine inventory or immutable promise about future execution.

The selected observational example (not a U1 promotion selection) was successful `foreman-line-ci` push run **34041937036**, attempt 1, created `2026-09-06T15:19:25Z`, source main SHA `476b8df...`. The attempt-specific jobs endpoint returned:

| Job | ID | Result | Provider-recorded runner fields |
|---|---|---|---|
| test | 101510167247 | success | labels windows-latest; runner ID 1000002084; name GitHub Actions 1000002084; group ID 0/name GitHub Actions |
| integration-report | 101510646646 | success | labels windows-latest; runner ID 1000002087; name GitHub Actions 1000002087; group ID 0/name GitHub Actions |

These provider records support the inference that the observed jobs used GitHub-hosted infrastructure. They do not identify every installed component, authenticate a U1 evidence predicate or show a protected verifier evaluated negative controls. A successful legacy CI run is not U1 proof. [Observed run](https://github.com/m0r6aN/agent-skills/actions/runs/34041937036).

A bounded latest-five repository run query also showed recent installation-workflow failures. One sampled run, 34135703030 attempt 1, had a failed `Validate skill content` job on an Ubuntu-labeled GitHub Actions runner and two skipped jobs. Logs were not read; cause was not investigated. These legacy failures do not establish failure or success of nonexistent U1 implementation.

GitHub documents an attempt-specific jobs read endpoint, so the U1 consumer can query the explicitly selected attempt rather than accepting whichever attempt is latest. Preserve run/job/attempt/event/source selection independently; provider job fields are corroborating execution metadata, not sufficient evidence of invariant correctness. [Workflow jobs REST API](https://docs.github.com/en/rest/actions/workflow-jobs#list-jobs-for-a-workflow-run-attempt).

## Attestation and independent verification options

Official documentation says artifact attestations are available on current GitHub plans, with public-repository support on Free/Pro/Team and private/internal support requiring Enterprise Cloud; legacy plans are excluded. The documented binary attestation path requires a workflow configured with `id-token:write`, `contents:read` and `attestations:write`, plus the attestation action. This **public** repository has no visibility-based need to migrate to Enterprise Cloud for that documented path, but its actual plan/event/issuance capability has not been exercised. No attestation job exists in the two inspected main workflows. [GitHub artifact attestation setup](https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations), accessed September 7.

Installed CLI reports **gh 2.86.0 (2026-01-21)**. Local `gh attestation verify --help` exposes `--deny-self-hosted-runners`, `--source-digest`, `--signer-digest`, `--signer-repo`, `--signer-workflow`, `--bundle` and `--custom-trusted-root`. The live official manual documents these filters. It also cautions that a compromised workflow context can falsify predicate contents and recommends a trusted reusable builder whose execution is not influenced by caller inputs. Thus attestation verification is a feasible provenance component, not a substitute for protected verifier code and independently evaluated controls. Run/job/attempt selection still needs explicit comparison to the reviewed request; repository/source filtering alone cannot reject every same-subject replay. [CLI verification reference](https://cli.github.com/manual/gh_attestation_verify), accessed September 7.

The official offline procedure retains the artifact, attestation bundle, trusted-root material and CLI; verification then uses the local bundle/root. The docs distinguish public Sigstore and GitHub private-repository instances and note that offline roots do not reveal later revocations. U1 must record trust-material acquisition/provenance and an update/revocation policy, not promise timeless validity. No bundle, root or artifact was downloaded here, and no verification was attempted. [Offline verification](https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/verify-attestations-offline), accessed September 7.

## Artifact retention: documented mechanism, actual configuration unresolved

Repository artifact listing returned **total_count 0**. There was no artifact ID from which to observe creation/expiry/download/retrieval behavior. The standard repository metadata response did not supply retention settings (queried retention fields rendered null); null is not evidence of zero days or a default value. The actual configured retention duration remains **unknown**.

Official repository settings documentation describes 90-day default artifact/log retention, configurable between 1–90 days for public repositories and 1–400 for private repositories, subject to applicable limits; changes apply prospectively. It separately describes requiring full-length action SHA pins; that repository setting was observed false here. These documented ranges are not this repository's measured retention setting. [Repository Actions settings](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository), accessed September 7.

The artifact REST API supports metadata and download, with metadata including digest and expiry fields. No signed download URL was requested or retained. Public repository metadata availability alone is not a demonstrated consumer retrieval path for a future bundle. U1 still needs selected destinations, custodian, readers, duration, detached decision retention and an independent retrieval trial before promotion. [Artifact REST API](https://docs.github.com/en/rest/actions/artifacts#download-an-artifact), accessed September 7.

An August 27 GitHub changelog entry announces that checks/run/status metadata will follow Actions retention starting October 1, 2026. The page carries a Retired category label; this is an announced future change, not a live account-setting observation. Regardless of rollout, do not depend on permanent CI URLs or provider metadata as the sole retained evidence. [Retention announcement](https://github.blog/changelog/2026-08-27-actions-retention-will-cover-checks-workflow-runs-and-statuses/), published August 27, accessed September 7.

## Concrete options for coordinator selection

| Option | Feasible basis | Still required before U1 can rely on it |
|---|---|---|
| GitHub-hosted producer with attested evidence bundle; separate protected P19 verifier uses pinned CLI/source/workflow filters and independently queried attempt/job metadata | Public repo, working hosted CI examples, documented attestations, installed verifier CLI flags | Choose eligible event and verify actual issuance permissions/plan; independently controlled verifier/workflow input boundary; exact run/job binding; full invariant/negative-control evidence; retained artifacts and successful retrieval |
| Protected reusable workflow for build/attestation plus separate P19 verification | Official CLI guidance identifies caller-independent reusable builders as a mitigation | Pin/control signer workflow and all inputs; assess how untrusted candidate execution is isolated; observe actual controls; scope any new repository/workflow/settings effect separately. Existing PR gate with zero approvals does not itself prove this boundary |
| Retained local/offline P19 verification of artifact+bundle+roots after separately authorized acquisition | Installed CLI supports documented offline flags | Named distinct verifier context, protected expected request/policy, independently obtained roots, revocation/update policy and retained decision closure. Local freshness is not host-compromise resistance; no local storage/protection selection made here |

These are compatible components, not three mutually exclusive architectures. The smallest likely path is to evaluate the existing public GitHub provider with a narrowly scoped new P18 workflow and separately protected P19 consumer. That is an inference from the observed environment, not an adopted provider decision or permission to add/change a workflow now. Provider-issued provenance should corroborate execution; U1's in-process trusted-verdict boundary and evidence completeness remain required.

## Safe command record and result limits

All `gh api` calls below were GETs. No `--include` authentication headers, token commands or secrets endpoints were used. Safe field filters were used for repository/run/job/artifact metadata, and base64 workflow content was decoded in memory to inspect relevant keys. Raw outputs were not persisted as separate files. API successes below returned usable JSON; explicitly marked grouped observations did not have individual shell-exit markers, so the enclosing shell exit alone is not their proof. The protection404 was separately rerun with its direct exit 1.

| Command / endpoint | Observed status and scope |
|---|---|
| `gh repo view m0r6aN/agent-skills --json nameWithOwner,visibility,isPrivate,defaultBranchRef,url` | Successful JSON, public/main |
| `gh api repos/m0r6aN/agent-skills` (safe selected metadata) | Successful JSON, repository ID/owner type/capabilities; retention absent/null |
| `gh api repos/m0r6aN/agent-skills/actions/permissions` | Successful JSON, enabled/all/SHA pinning false |
| `gh api repos/m0r6aN/agent-skills/actions/permissions/workflow` | Successful JSON, default read/no PR-review approval |
| `gh api repos/m0r6aN/agent-skills/rulesets` | Successful JSON, two entries; no further page required for observed count |
| `gh api repos/m0r6aN/agent-skills/rulesets/17746056` and `/22369510` | Each direct exit 0, full rule parameters inspected |
| `gh api repos/m0r6aN/agent-skills/rules/branches/main` | Direct exit 0, effective rules verified |
| `gh api repos/m0r6aN/agent-skills/branches/main/protection` | HTTP 404/direct exit 1; classic protection only, not ruleset absence |
| `gh api repos/m0r6aN/agent-skills/actions/runners` | Direct exit 0, total 0 |
| `gh api repos/m0r6aN/agent-skills/actions/workflows` | Direct exit 0, total 2 returned |
| `gh api repos/m0r6aN/agent-skills/commits/main --jq .sha` | Successful immutable SHA used for content inspection |
| `gh api repos/m0r6aN/agent-skills/contents/.github?ref=main` | Direct exit 0; .github contains workflows directory |
| Contents API for each named workflow at `ref=476b8df6efe6c9974879957147449f61c34cd9a0` | Successful blob identities/content; no artifact/attestation/retention keys observed |
| `gh api repos/m0r6aN/agent-skills/git/trees/476b8df6efe6c9974879957147449f61c34cd9a0?recursive=1` | Successful JSON, truncated false; recognized CODEOWNERS locations absent |
| `gh api repos/m0r6aN/agent-skills/actions/artifacts` | Successful JSON, total 0; no pagination/download needed |
| Actions runs `?per_page=5`; foreman-line-ci workflow runs `?per_page=3` | Bounded recent samples, not full run history; totals 92 and 33 respectively |
| `gh api repos/m0r6aN/agent-skills/actions/runs/34135703030/jobs` | Successful three-job sample; no logs |
| `gh api repos/m0r6aN/agent-skills/actions/runs/34041937036/attempts/1/jobs` | Successful two-job attempt-specific sample; no logs |
| `gh version`; `gh attestation verify --help` | Local read-only capability inspection; no attestation verified |

## Remaining account/control gaps

- Actual artifact/log retention setting and protected off-provider retention destination/access/duration; no existing artifact could be retrieved to prove the path.
- Actual attestation issuance for a selected event, effective job permissions, account plan compatibility and fork/event restrictions. Public visibility/doc support narrows uncertainty but does not complete this probe.
- Protected independent verifier/workflow configuration, candidate-input containment and distinct P19 identity/context. Existing rules require checks but no approving/codeowner/last-pusher review.
- Actual selected run/job/attempt/event/source/signer linkage in a real retained bundle, plus failure behavior for same-subject historical replay.
- Re-verification trust-root acquisition/revocation posture, exact image/toolchain/configuration identities, and invariant-specific negative controls.

These remain pre-P18/P19 dependencies as assigned by the U1 draft. No unknown is silently treated as a provider ban, missing permission request, successful proof or requirement to stop unrelated P0/P1 work.
