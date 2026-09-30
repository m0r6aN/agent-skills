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

## Workflow placement (2026-09-30, owner direction "proceed")

- Extracted **byte-exact** from the design's fenced blocks (design sha `0d8816eb…`): `u1-produce.yml` = doc lines 160–584 (425 lines), `u1-verify.yml` = doc lines 604–1489 (886 lines) — fence content untouched by the §6.6 prose edit; YAML parse PASS both files.
- Placed in an isolated worktree off `origin/main` (`D:/Repos/agent-skills-worktrees/u1-workflow-placement`, branch `u1-workflow-placement`, base `e5dce4d`) alongside `.github/CODEOWNERS` — the ambient `dev` checkout's user-owned dirty state untouched.
- **PR #123** (`m0r6aN/agent-skills`, `u1-workflow-placement` → `main`) opened 2026-09-30 — first live exercise of the new ruleset gate. Owner merge is the remaining mechanical step; then the §6.4 pin procedure (pin record + `u1-verifier-pin` tag at the merge SHA).

## Coordinator posture notes (analysis, not observation)

- The account already satisfies three of the contract's hard clauses: TLS1.2+, no shared-key/SAS root of trust (OAuth/Entra only), no anonymous blob access. The Azure side's integrity story is good at the account level.
- The open network posture (`defaultAction: Allow`) is workable for GitHub-hosted runner egress but is the weakest observed row — tightening options are a decision (see the coordinator's questions to the owner).
- `Standard_LRS` durability = 3 replicas within one region. The contract's integrity control is the immutability policy + independent read-back; redundancy is a disaster-tolerance choice (OQ-U1-05).
- The immutability policy's `state` (unlocked → extendable only, vs locked → irreversible even by support) is a significant, irreversible-if-locked decision — surfaced to the owner before provisioning.