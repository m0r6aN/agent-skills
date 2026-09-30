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

## Coordinator posture notes (analysis, not observation)

- The account already satisfies three of the contract's hard clauses: TLS1.2+, no shared-key/SAS root of trust (OAuth/Entra only), no anonymous blob access. The Azure side's integrity story is good at the account level.
- The open network posture (`defaultAction: Allow`) is workable for GitHub-hosted runner egress but is the weakest observed row — tightening options are a decision (see the coordinator's questions to the owner).
- `Standard_LRS` durability = 3 replicas within one region. The contract's integrity control is the immutability policy + independent read-back; redundancy is a disaster-tolerance choice (OQ-U1-05).
- The immutability policy's `state` (unlocked → extendable only, vs locked → irreversible even by support) is a significant, irreversible-if-locked decision — surfaced to the owner before provisioning.