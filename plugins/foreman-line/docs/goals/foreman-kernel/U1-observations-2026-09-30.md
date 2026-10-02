# U1 observation record — Azure storage account — 2026-09-30

**Role:** the custodian-supplied observed configuration for the U1 concrete contract (`U1-contract-2026-09-29.md`, SHA `8d5f849c…`), per its Responsibility Boundary ("The control custodian/operator supplies observed provider and storage configuration"). Recorded verbatim from the owner's delivery; the coordinator's analysis follows and is not itself observation.

## Observed configuration (verbatim facts)

| Field | Observed value | Fills |
|---|---|---|
| Subscription | `909e0322-c3c0-4bce-ae53-b3d2ed735bd4` | INCOMPLETE-U1-02 |
| Resource group | `biostack-rg` | INCOMPLETE-U1-03 |
| Storage account | `bs2jhgwvduljfdwdp` (Microsoft.Storage/storageAccounts, StorageV2) | INCOMPLETE-U1-04 (account) |
| SKU | `Standard_LRS` (tier Standard) | INCOMPLETE-U1-04 (SKU — OQ-U1-05 partially) |
| Location | `eastus` (primary, available) | — |
| Minimum TLS | `TLS1_2`; HTTPS-only enforced | ✓ satisfies the contract's TLS clause |
| Public blob access | `allowBlobPublicAccess: false` | ✓ |
| Shared key access | `allowSharedKeyAccess: false`; `defaultToOAuthAuthentication: true` | ✓ satisfies "no account keys / long-lived SAS" clause at the account level |
| Encryption | Microsoft-managed keys (`keySource: Microsoft.Storage`), blob+file service encryption enabled | ✓ at-rest |
| Cross-tenant replication | disabled | ✓ |
| Private endpoints | none | ⚠ see network below |
| Network ACLs | `defaultAction: Allow`, no VNet rules, no IP rules, bypass None | ⚠ open network posture — INCOMPLETE-U1-10 (observed, not yet decided) |
| Provisioning | `Succeeded`; created 2026-08-28 | — |

## NOT yet observed / not yet existing (the remaining INCOMPLETE set)

- **INCOMPLETE-U1-01 tenant ID** (not in the delivered payload).
- **INCOMPLETE-U1-05 the evidence container** — does not exist yet (to be created; name + immutability policy are open decisions).
- **INCOMPLETE-U1-06 retention custodian + authority** — unnamed.
- **INCOMPLETE-U1-07 producer identity / INCOMPLETE-U1-08 verifier identity** (must be separate) — unnamed.
- **INCOMPLETE-U1-09 RBAC assignments** — unobserved.
- **INCOMPLETE-U1-11 locked retention interval** — policy not yet set (≥400-day minimum RATIFIED 2026-09-29).
- **INCOMPLETE-U1-12 retrieval-test evidence** — not yet performed.
- **INCOMPLETE-U1-13/14 protected verifier workflow revision + control custodian** — unnamed.
- **INCOMPLETE-U1-15..19 live GitHub rechecks** (event/permissions/runner/attestation/trust-root) — not yet performed.

## Provisioning execution record (2026-09-30, coordinator under owner authorization "I run az CLI now")

| Item | Result | Fills |
|---|---|---|
| Tenant ID | `ac08e2fd-34bf-4c87-a34f-c8c853ffc5e2` | INCOMPLETE-U1-01 ✓ |
| Custodian identity | `morganclint76@gmail.com` / object-id `461a4112-8e91-41cb-afef-6889b8f48ff0` (owner) | INCOMPLETE-U1-06 ✓ |
| Evidence container | `u1-evidence` created (private; blob public access off at account) | INCOMPLETE-U1-05 ✓ |
| Immutability policy | `…/containers/u1-evidence/immutabilityPolicies/default` — **400 days, state Unlocked** (owner ruling: unlock → lock after test) | INCOMPLETE-U1-11 (interval set; LOCK flip pending) |
| RBAC | `Storage Blob Data Contributor` granted to the custodian identity at the account scope (created 2026-09-30T10:18:11Z; ~45s data-plane propagation observed) | INCOMPLETE-U1-09 (partial — producer/verifier identities remain) |
| **Retrieval test** | object `retrieval-test/2026-09-30/coordinator-readback.txt` uploaded + downloaded over OAuth (no shared keys); SHA-256 **identical both sides**: `802d413ae32f2905a56388e178b59c642f7e61f5cd7f30be5cfbef605c9aa530` | INCOMPLETE-U1-12 ✓ (initial custodian-identity evidence) |

Operational notes: `az` on this host is the Windows.cmd wrapper (long arg lists need PowerShell or no `--assignee-type`); role-assignment by email fails Graph resolution — use `--assignee-object-id`; data-plane RBAC takes ~45s to propagate after creation.

## Identity provisioning record (2026-09-30, owner ruling "Provision both now"; separate identities per the contract's producer≠verifier clause)

| Identity | IDs | Federated credential | RBAC (container `u1-evidence` scope) |
|---|---|---|---|
| **Verifier** `u1-verifier-mi` | clientId `ec2d02e3-904c-4ce2-9771-cd518d711e3f`; principalId `9f31b12b-520d-4352-aa71-6b9208a662c4` | `u1-verifier-fc` — issuer `https://token.actions.githubusercontent.com`, subject `repo:m0r6aN/agent-skills:environment:u1-verifier`, audience `api://AzureADTokenExchange` | **Storage Blob Data Reader** (created 2026-09-30T10:37:43Z) |
| **Producer** `u1-producer-mi` | clientId `dc152b9d-c74e-4af1-aeeb-c23b95c68ab2`; principalId `f15d13b7-5d76-4b41-9804-f07802b6b3c0` | `u1-producer-fc` — same issuer, subject `repo:m0r6aN/agent-skills:environment:u1-producer`, same audience | **Storage Blob Data Contributor** (created 2026-09-30T10:37:47Z) — its delete/write-shorten attempts are physically blocked by the immutability policy while it exists |

Design notes: environment-scoped OIDC subjects mean the FK-P18′/verifier workflows MUST run from GitHub environments named `u1-producer` / `u1-verifier` (the workflow drafts bind to them); the verifier's read-only role + the independent read-back/SHA-256 ACCEPT procedure are the contract's separation of powers; producer data-contributor breadth is bounded by immutability (delete of committed evidence fails), with a create-only custom role noted as optional hardening.

**Lock flip (owner ruling "Lock after first real evidence"):** the container's immutability policy stays `Unlocked` until the verifier pipeline writes and independently reads back its FIRST real evidence bundle; then the coordinator flips `state: locked` (one-way) and records the policy etag.

## Verifier decision-write role (2026-09-30, ruling OQ-6.2: stored decision authorship = the verifier identity itself)

The contract's "a producer-authored status is never accepted as the verification decision" makes the stored decision's authorship load-bearing — producer-transported bytes are still producer-written. Provisioned a **create-only custom role** at the `u1-evidence` container scope:

- **`u1-verifier-evidence-creator`** (roleDefId `c2e8b1ab-cef8-4a4f-ae44-37cc74aaccdd`; renamed in place from `U1 Verifier Decision Writer` to match the workflow design's spec — same GUID, so the assignment carries over): DataActions `blobs/read` + `blobs/add/action` (create new / append), NotDataActions `blobs/write` + `blobs/delete` + `blobs/permanentDelete/action`. Assigned to `u1-verifier-mi` (principalId `9f31b12b-…`, created 2026-09-30T11:32:45Z).
- Semantics (verified against Azure provider-operations/ABAC references): `add/action` creates new blobs; excluding `blobs/write` prevents overwriting any existing blob; WORM time-based retention is the write-once backstop for everything committed. The verifier identity can therefore create decision/observation objects and never modify or delete evidence.
- Lane summary: verifier = read-all + create-decisions-only; producer = create/write new evidence (delete attempts physically fail under retention); custodian = administers controls.

## GitHub protection evidence (2026-09-30, owner-authorized gh/API acts — design §6.1–6.3)

| Control | Configured | Evidence |
|---|---|---|
| Ruleset `agent-skills-default` (branch, `~DEFAULT_BRANCH`, active) | `pull_request` required (PR flow for all changes to `main`), `dismiss_stale_reviews_on_push=true`; `deletion` + `non_fast_forward` blocked; owner's pre-existing `code_scanning`/`code_quality`/`copilot_code_review` rules preserved; bypass = `m0r6aN` only (sole bypass actor, `always`) | ruleset id 24257508, PUT 2026-09-30. **Deviation from design §6.2 row 1 (owner-reported, 2026-09-30):** `required_approving_review_count=0`, `require_code_owner_review=false`, `require_extra_approval_for_unattributed_changes=false` — GitHub never lets PR authors approve their own PRs, and a one-person repository has no second write-access reviewer, so the ≥1-approval gate was structurally unsatisfiable and blocked every PR (the unattributed-extra-approval flag compounded it for tooling pushes). Restore the approval fields when a second write-access identity exists (e.g., the FK-P18′ builder identity under contract §3.2.1 separation). |
| Ruleset `u1-verifier-pin` (tag, `refs/tags/u1-verifier-pin`, active) | `update` + `deletion` restricted; bypass = `m0r6aN` only | ruleset id 24258920, created 2026-09-30 |
| Environment `u1-verifier` (attended) | RequiredReviewers = `m0r6aN` (protection_rules confirmed via GET); `prevent_self_review=false` (solo-operator necessity — the owner dispatches and approves); deployment refs = `main` + `u1-verifier-pin` (custom policies 61546414/61546415); no secrets | environment GET/PUT 2026-09-30 |
| Environment `u1-producer` (unattended) | no reviewers, `protected_branches` deployment policy (protected refs only); no secrets | environment PUT 2026-09-30 |
| CODEOWNERS | `.github/CODEOWNERS` covers both U1 workflows + `U1-verifier-pin.json` + `promotion-requests/` → `@m0r6aN` (design §6.3 verbatim). Path-scoped *enforcement* requires `require_code_owner_review` (currently off per the solo-repo deviation above) — until then CODEOWNERS is the ownership annotation, and the ruleset's tag/branch restrictions + the pin byte-checks carry the enforcement | committed 2026-09-30 |

Operational notes: the repo rulesets API `update` rule is parameterless (allow-list = ruleset bypass actors, not rule params); `reviewers` on environments appear under `protection_rules` in GET responses; the design §6.2's "path-scoped ruleset" is enforced as CODEOWNERS + required code-owner review (GitHub rulesets target refs, not paths). Still owner-pending: `U1-verifier-pin.json` pin record + pointing the `u1-verifier-pin` tag at the pinned commit (both AFTER the workflows are placed and their commit SHA exists).

| Ruleset `main-pr-gate` (branch, `~DEFAULT_BRANCH`, active) | pre-existing ruleset requiring status checks `test` + `integration-report` (`strict_required_status_checks_policy`), pre-existing `pull_request` rule (count 0, thread resolution) — **bypass was EMPTY**, so every merge was blocked while those checks are red | id 22369510, PUT 2026-09-30: added sole bypass actor `m0r6aN` (`always`) per the solo-repo deviation ruling; rules unchanged. Context: `test` = the foreman-line 20-package matrix, red on `main` since 2026-09-28 (pre-existing baseline: 12/20 packages fail Test/Typecheck, e.g. TS2353 `projectKey` type drift); `integration-report` mirrors `test`'s outcome. Required checks gate again for any non-bypass actor once the baseline is green. |

## Package-matrix repair (2026-09-30, owner-directed fix order; PR #123 branch `u1-workflow-placement`, commit `6793317`)

The `test` job's 498 failures decomposed into five root causes (owner's triage named three; two more surfaced in execution):

| # | Root cause | Fix | Verified |
|---|---|---|---|
| 1 | D19 audit refuses extension-less `Dockerfile` (`jev-decisions/container/Dockerfile`) | `BUILD_DEFINITION_BASENAMES` registered in `verification/src/d19-audit.ts` (ports the JEV-P3 fix from the goal tree) | audit suites unblocked |
| 2 | `routing-policy` contract surface missing (6 exports + 2 shape extensions: `transport_requirements`, `shadow_routes`) | types/schemas restored to the shape its own fixtures, validator, and testing samples demand; schema artifacts regenerated | **940/940 tests + clean typecheck locally** |
| 3 | `pluginRoot` missing from input bags | added to `HarnessInput`, `ReviewDispatchInput`, `DispatchOptions`, + discovered `RoutingOptions`; `evaluateRouting` resolves the policy from the explicit plugin root and carries `transportRequirements` into result + receipt | dispatch typecheck clean |
| 4 | Stale barrels (owner's "stale barrel exports" class, larger than reported): `routing-policy` missing17 re-exports (pmc-launch/catalog/observation consumers), `dispatch` missing the shadow-routing surface | barrels restored; `executeShadowRoute` identity-stable across all three import paths (test asserts identity) | typecheck clean |
| 5 | `dispatch` imports `@earendil-works/pi-ai`/`pi-coding-agent` undeclared (type-only) | pinned `0.99.2` in devDependencies — outside the runtime dependency allowlist (`dependency-allowlist.test.ts` governs `dependencies` only) | module resolution clean |

**Environment note (evidence-bound):** the `pmc-*` suites pin `process.version === 'v24.19.0'` (`intent-custody.ts` `SETTINGS_REFUSED`) and CI pins `node-version: 24.19.0` exactly — the local v24.7.0 workstation cannot exercise them; CI's matrix is the authoritative verification for those suites. Local verification: routing-policy suite green, all touched packages typecheck clean, schema parity artifacts regenerated via `generate.ts`.

**Toolchain split (recorded 2026-09-30, deferred owner decision):** the 27 on-disk packages carry two devDependency camps — 15 at `@biomejs/biome 2.5.3` / `@types/node 26.1.1` / `tsx 4.23.1` / `typescript 7.0.2`, 11 at `2.5.14` / `26.6.2` / `4.23.15` / `7.0.2`, `jev-decisions` none. A `SHARED_DEV_DEPENDENCIES` golden pinning the Camp-B values entered via recovery-merge `6843cb4` and never matched its own target pair (verification+dispatch, both Camp A since introduction); the golden was corrected to the pair's Camp-A values with a citing comment (test = sibling agreement of that pair only). **Unifying the camps is a separate toolchain decision (Option B: bump the 15 Camp-A packages vs downgrade the 11)** — reserved for the owner; not this campaign's scope.

**CLOSURE (2026-09-30/10-01): package matrix GREEN.** CI run `36812944266` on `u1-workflow-placement@db3c463` = `test` + `integration-report` SUCCESS — all 20 packages pass Install/Test/Typecheck/Lint on the CI toolchain (Node 24.19.0). Campaign shape: five parallel repair waves + one ratification wave (roots: stale barrels, tests-ahead-of-src parameterization + root-discipline, merge-regression path shapes, undeclared type deps, stale goldens/adjudication lists, D19 ruling/pin reconciliation of 93 instances, 6-package STANDING-#34 ratification). Three parcel-time git-diff freezes retired under the established A6/STANDING-CONSTRAINTS-#12 precedent (projection AC3, shaping AC8, verification AC-1) — each with the citing comment; every substantive pin kept. Remaining for the U1 lane: owner merges PR #123 → `U1-verifier-pin.json` + `u1-verifier-pin` tag → §8 independent review → FK-P18′ dispatchable → lock flip on first real evidence.

## U1 pin procedure COMPLETE (2026-10-01, design §6.4 steps 1-2; PR #123 merged as `be3e3de3dfcf6159d4ffb265aa39847aac5f0814`)

- `U1-verifier-pin.json` committed to `main` (`75d718b`, custodian push): `workflowCommit = be3e3de3dfcf6159d4ffb265aa39847aac5f0814`, `workflowFileSha256 = sha256:b7952e1e52f0144e7632fc73d8d04e9564184dfcf4c5af978c71592514cc4bbe` (u1-verify.yml bytes at that commit).
- Protected tag `refs/tags/u1-verifier-pin` → `be3e3de3…` (pushed; tag ruleset 24258920 restricts its update/deletion to the custodian).
- End-to-end verified: the workflow's own read path (`raw.githubusercontent.com/.../main/plugins/foreman-line/docs/goals/foreman-kernel/U1-verifier-pin.json`) serves both fields exactly as the in-run pin check consumes them (`sha256:`-prefixed digest comparison); `git ls-remote` confirms the tag. In-run enforcement (manual path: ref+SHA+byte-digest; event-driven: byte-equality + ruleset) is live for all future runs. **Remaining: §8 independent review (owner commissions) → FK-P18′ dispatchable → immutability lock flip on first real evidence.**

## §8 FINDINGS + F-18 principal inventory (2026-10-01)

§8 review (anthropic/claude-sonnet-5-5, verdict file `U1-8-review-verdict-2026-10-01.json`): **FINDINGS — 5 blockers (F-1..F-5), 9 major, 4 minor**. Blockers are workflow-mechanism defects (undeclared job outputs; domain-wrapped-vs-plain digest mismatch in read-back; event-driven pinning vs the ratified clause; ACCEPT possible while the policy is Unlocked / §5 fields unrecorded; not-exercised rows passing with a producer-sourced oracle). Closure campaign in flight (amendments drafted by `U1ClosureAmendments`; workflow rewrite + re-pin next; re-review after closure).

**F-18 storage-plane principal inventory (observed 2026-10-01, `az role assignment list`):**

| Principal | Role | Scope | Power over the evidence store |
|---|---|---|---|
| `clintemorgan_gmail.com#EXT#@morganfindings.onmicrosoft.com` (owner, User) | **Owner** | subscription (inherited) | full: policy change while Unlocked, shared-key re-enable, RBAC |
| `silent-apply-deploy` (SP `89a63f46-c9af-48c7-a651-0aeabf5814f1`) | **Contributor** | subscription | policy change while Unlocked, shared-key re-enable, resource writes |
| `biostack-github-actions` (SP `059e4070-981a-4d94-98da-e568bc06706d`) | **Contributor** | RG `biostack-rg` | same within the RG |
| owner (same as row 1) | Storage Blob Data Contributor | account | all blob data incl. delete, every container in the shared account |
| `u1-verifier-mi` | Reader (management plane) | account | policy observation only — **added 2026-10-01T16:31:47Z** (F-4 closure) |
| `u1-verifier-mi` | `u1-verifier-evidence-creator` (read + create-only) + Blob Data Reader | container `u1-evidence` | create decision/observation objects; never overwrite/delete |
| `u1-producer-mi` | Storage Blob Data Contributor | container `u1-evidence` | create/write new evidence; delete physically blocked by retention |

**Exposure analysis:** three principals (owner + 2 service principals) can modify the immutability policy and re-enable shared-key access **while the policy is Unlocked**; the owner's account-scope Data Contributor spans the whole shared account `bs2jhgwvduljfdwdp`. The lock flip is the strong mitigator (post-lock, policy shortening is refused even to Owner/Support; retained blobs resist key-based access). Detection posture pending the F-18 decision block: periodic `allowSharedKeyAccess` + policy-state rechecks recorded with the verifier's management-plane read.

## §8 closure — owner decisions + provisioning (2026-10-01)

**Owner decision batch (recorded verbatim in `U1-8-closure-amendments-2026-10-01.md` authority bases; doc now RATIFIED, sha256 `895fbe0e6de1cd8966e309cc834eb5f580b4cbda5bb7866d3121b39a398360e1`):** F-3 = option (b) non-authoritative event runs; F-8 = ABAC prefix conditions now; F-14 = option (a) attestation named gap, never status-affecting; F-18 = Allow + hardening + shared-key detection; all remaining amendments ratified as drafted.

**F-8 provisioning (A-U1.8.07) — observed configuration:**

| Act | State |
|---|---|
| Producer `u1-producer-mi` role assignment | replaced: `Storage Blob Data Contributor` at `u1-evidence` scope **conditioned** `@Resource[Microsoft.Storage/storageAccounts/blobServices/containers/blobs:path] StringLike 'runs/*'` (v2.0, created 2026-10-01T17:21:48Z; prior unconditioned assignment deleted) |
| Verifier `u1-verifier-mi` create-only role assignment | replaced: `u1-verifier-evidence-creator` **conditioned** `blobs:path StringLike 'verifications/*' OR StringLike 'attempt-ledger/*'` (v2.0, created 2026-10-01T17:22:25Z); read-all remains via the unconditioned `Storage Blob Data Reader` assignment |
| Ledger authority (A-U1.8.07 §3.3.3) | attempt ledger written ONLY by the verifier identity (no builder-reachable workflow federates to it) |
| Diagnostic logging (A-U1.8.07) | Log Analytics workspace `u1-evidence-audit` created in `biostack-rg`; diagnostic setting `u1-audit` on the blob service with `StorageRead`/`StorageWrite`/`StorageDelete` categories — requester-identity logs retained OUTSIDE the evidence container |
| Denied-operation probes | implementation-side: the rewritten workflows self-probe (out-of-prefix verifier write, producer decision-namespace write) and record denials as first-run evidence (F-8 evidence gate) |

Network posture (F-18 decision): **Allow + hardening + shared-key detection** — `allowSharedKeyAccess` and policy-state rechecks fold into every verification via the verifier's management-plane Reader.

## §8 closure + A-U1.8.16 dry-run COMPLETE (2026-10-01) — re-review pending

- **All 18 findings closed** per the ratified amendments — closure map with evidence: `U1-8-closure-report-2026-10-01.md` (on `main` at `27323ec`). Pin record re-cut (`workflowCommit 16a7e0fb0a5713bdfc7722e3227def6e6128cade`, `workflowFileSha256 sha256:3301a0e4bb95a272c5110907b6bfe6e9d3c3c6111f321f4ce285c1ac085e4c10`, supersedes `be3e3de3…` via `dc561792…`); protected tag `u1-verifier-pin` → `27323ec87880c53e300418ee24b1497e94f2261f`.
- **Shakedown (A-U1.8.16 dry-run):** producer run `36926434897` SUCCESS against the Unlocked container (bundle at `u1/m0r6an/agent-skills/runs/36926434897/p01/`); verifier run `36944407315` full-pipeline SUCCESS (all 6 executed jobs; candidate-sandbox skipped). **Recorded decision: `INVALID` / `authoritative: true`** with `U1_CONFIGURATION_INCOMPLETE` + 4 further codes — the F-4 gate refusing ACCEPT while Unlocked, exactly the ratified non-ACCEPT first cycle. `seal.json` written last; observer consumed the crashed earlier attempt 1 as `timed-out`.
- **Shakedown-found defects (5, all fixed in the re-pin chain):** F-19 pin self-reference paradox + shallow-clone ancestry false-refusal (transitive byte+ancestor binding via compare API); `configurationChecklistSha256` document-vs-byte conflation; `az storage blob download --file -` silently empty at 4 sites (temp-file reads); environment deployment policy typed `branch` unable to match the tag (tag-type policy 61684968); request `schema` literal (`u1-promotion-request/v1`).
- **Re-review:** closure re-review dossier `U1-8-closure-rereview-dossier-2026-10-01.md` (sha256 `8a6cbbfa…`; supersedes `9093511c…`, whose Part C was a truncated excerpt — amendments lines 32–123 cut mid-sentence in A-U1.8.02, omitting A-U1.8.03…16, the implementation notes and the closure matrix — rebuilt 2026-10-02 with the full ratified amendments verbatim, committed bytes `895fbe0e…`) handed to the owner for relay to `anthropic/claude-sonnet-5-5` (the §8 reviewer of record). **Verdict pending.** On ACCEPT: FK-P18′ dispatchable (F-12 dispatch preconditions checked at dispatch) → first real evidence cycle → lock flip (owner ruling 2026-09-30).

## §8 closure re-review verdict: FURTHER_FINDINGS (2026-10-02)

- **Verdict:** `U1-8-closure-verdict-2026-10-02.json` (anthropic/claude-sonnet-5-5) — CLOSED 10 (F-1, F-2, F-4, F-6, F-7, F-9, F-10, F-14, F-16, F-17), PARTIAL 8 (F-3, F-5, F-8, F-11, F-12, F-13, F-15, F-18); new G-1…G-14 (3 blocker, 8 major, 3 minor). **FK-P18′ undispatchable.**
- **Coordinator reproduction (read-only):** G-1 (tag ruleset 24258920 → 404; tag at `27323ec`), G-2 (`u1-verifier` policies 61546414 `main` + 61684968 tag), G-3 (stored a02 notes; pin-record digests 75d718b `c1b66138…` / 95ee74e `a8f986cd…` / 27323ec `dbfacbcb…`), G-4 (genuine denial misclassified), G-7 (seal has no status), G-10 (`IMAGEOS`/`IMAGEVERSION`; stored values empty), G-11 (bypass 35229880 `always` on 22369510 and 24257508) — all confirmed. Triage: `U1-8-closure-verdict-triage-2026-10-02.md`.
- **Owner rulings:** D-1 transitive binding (A-U1.8.17); D-2 read-only `u1-reader-mi` event lane; D-3 per-request oracle; D-4 derivation in this re-pin. No provisioning authorized.
- **Next:** owner ratification of `U1-8-closure2-amendments-2026-10-02.md` (A-U1.8.17…27) → one re-pin (negative + positive dry runs) → provisioning acts → re-review.

## FK-P18′ SHAPED (2026-10-02) — blocked: closure verdict FURTHER_FINDINGS (see above)

- **Spec:** `docs/specs/active/FK-P18-prime-ci-backstops.md` (shaping sha256 `6b41cec4…`; spec-linter exit 0, shaping self-check valid). Exactly 3 Allowed Files: `.github/workflows/fk-p18-ci-backstops.yml` (new), `.github/workflows/test-plugin-install.yml` (one named integration edit), `docs/goals/foreman-kernel/fk-p18-prime-ci-backstop-evidence.md`. 16 mechanically-checkable ACs incl. the negative-control fail-CI proof (NC-FK18-01..06 + CTL-FK18-01, hook-bypassing raw mutations whose child-checker refusal is meta-asserted per standing #14), seal-only FK-P19 consumption (A-U1.8.09), oracle authority (A-U1.8.04), A1.3 coarse bounds (10× F05.16, ratified), INF-4 host independence.
- **Coordinator rulings on its 9 open questions** recorded in the spec (2026-10-02): E6 waive-and-record; BM-4 consumes the §8 verdict JSON records; BM-1 FK-P2-output-else-spec-block; one named `test-plugin-install.yml` edit; committed-file promotion-request discovery; **OQ-6 credential provisioned**; 10× bounds ratified; evidence retention confirmed; NC-U1 carrier split (CI-channel rows → FK-P18′; blob/verifier-channel rows → the U1 first real evidence cycle).
- **U1 reader credential provisioned (OQ-6):** `u1-reader-mi` (principalId `23e1415d-37f6-460f-bfa1-349ecd046490`, clientId `92737cbb-0a55-4355-b1fe-c6169eb0df4b`) with container-scoped `Storage Blob Data Reader` (created 2026-10-02T13:57:36Z) + FIC `u1-reader-fc` subject `repo:m0r6aN/agent-skills:pull_request` — the FK-P18′ backstops can consume the seal/revocations read-only; three-state (b) remains the recorded degradation if it is ever revoked.

## Workflow placement (2026-09-30, owner direction "proceed")

- Extracted **byte-exact** from the design's fenced blocks (design sha `0d8816eb…`): `u1-produce.yml` = doc lines 160–584 (425 lines), `u1-verify.yml` = doc lines 604–1489 (886 lines) — fence content untouched by the §6.6 prose edit; YAML parse PASS both files.
- Placed in an isolated worktree off `origin/main` (`D:/Repos/agent-skills-worktrees/u1-workflow-placement`, branch `u1-workflow-placement`, base `e5dce4d`) alongside `.github/CODEOWNERS` — the ambient `dev` checkout's user-owned dirty state untouched.
- **PR #123** (`m0r6aN/agent-skills`, `u1-workflow-placement` → `main`) opened 2026-09-30 — first live exercise of the new ruleset gate. Owner merge is the remaining mechanical step; then the §6.4 pin procedure (pin record + `u1-verifier-pin` tag at the merge SHA).

## Coordinator posture notes (analysis, not observation)

- The account already satisfies three of the contract's hard clauses: TLS1.2+, no shared-key/SAS root of trust (OAuth/Entra only), no anonymous blob access. The Azure side's integrity story is good at the account level.
- The open network posture (`defaultAction: Allow`) is workable for GitHub-hosted runner egress but is the weakest observed row — tightening options are a decision (see the coordinator's questions to the owner).
- `Standard_LRS` durability = 3 replicas within one region. The contract's integrity control is the immutability policy + independent read-back; redundancy is a disaster-tolerance choice (OQ-U1-05).
- The immutability policy's `state` (unlocked → extendable only, vs locked → irreversible even by support) is a significant, irreversible-if-locked decision — surfaced to the owner before provisioning.