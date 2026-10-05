# U1 contract selections — 2026-09-29

Status: **COORDINATOR DECISION RECORD / CONTRACT STILL INCOMPLETE**. This records selections ratified by the goal owner on 2026-09-29. It supplements, and does not edit or replace, `U1-evidence-contract-draft-20260907.md` or its review. It is not the independent review required before FK-P18′ dispatch, and it does not configure Azure or GitHub infrastructure.

## Ratified selections

1. **Evidence limits:** Maximum total bundle size 64 MiB; maximum individual artifact size 8 MiB; maximum 256 artifacts; maximum JSON nesting depth 16. Reject an over-limit bundle as `INVALID` with a stable reason code.
2. **Attempt timeout:** Maximum 30 minutes per attempt. The previously adopted maximum of three total attempts within 24 hours, whichever limit is reached first, remains in force. Cancellation, timeout, interruption, or a nonreturning attempt consumes an attempt; the durable clock and attempt history do not reset on restart or ownership change.
3. **Verifier execution model:** The verifier runs from an independently protected workflow revision pinned by full commit SHA. Candidate code is treated as data. Any job that must execute candidate code is isolated, has no secrets or write credentials, and provides untrusted output to the verifier. A producer-authored status is never accepted as the verification decision.
4. **Retention service:** Azure Blob Storage is the selected service class for retained evidence.

## Responsibility boundary

- The **independent reviewer** evaluates whether the verifier boundary, workflow permissions, runner lifecycle, provider evidence, negative controls, and retention evidence satisfy the contract. The reviewer records a reasoned ACCEPT or findings; the reviewer does not need to operate the Azure account or author the protected verifier.
- The **control custodian/operator** supplies observed provider and storage configuration and administers those controls under separately granted authority. The FK-P18′ builder must not control the verifier workflow, verifier policy, runner selection, retention policy, or deletion of retained evidence.
- To avoid self-review, the contract review and eventual evidence review must identify the reviewer and show that person did not act as the FK-P18′ builder for the reviewed work. The independent review must also disclose whether the reviewer administered the controls being reviewed.

## Azure retention proposal, pending resource selection and observation

Use a dedicated private Blob container with a locked, time-based immutability policy. The proposed minimum retention interval is **400 days from evidence creation**; this duration is a recommendation, not yet ratified. Require TLS and Microsoft Entra ID authentication, container-scoped least privilege, unique run-qualified object names, and a successful read-back plus SHA-256 comparison by the independent verifier before ACCEPT. The producer may submit new evidence objects but must not administer or shorten the retention policy or delete existing evidence. The verifier reads retained objects through an identity separate from the producer. Do not use account keys, long-lived SAS URLs, or GitHub Actions artifacts as the sole retained copy.

Before this becomes a binding concrete contract, record the Azure tenant/subscription, resource group, storage account, container, custodian, producer and verifier identities, RBAC assignments, network/access configuration, locked retention interval, and retrieval-test evidence. Missing resource selection, authority, or observed configuration yields `INCOMPLETE` and refuses promotion.

## Remaining pre-dispatch work

- Select and record the actual protected verifier workflow/code revision and its independent control custodian. The reviewer verifies this boundary; review alone does not provision or protect it.
- Verify the selected GitHub event, permissions, hosted-runner identity, attestation issuance, and trust-root/revocation procedure against the live repository and account.
- Assign final schema version, exact artifact paths, canonical JSON/digest rules, invariant IDs, refusal-class IDs, and stable reason codes in the FK-P18′ contract interface. The ratified size and depth limits above bind those choices.
- Select and configure the Azure resource details above under actual infrastructure authority, then demonstrate independent retrieval and digest validation.
- Have one fresh independent reviewer review the completed contract and close findings before FK-P18′ implementation dispatch.

## Current platform facts to recheck at dispatch

The repository's September 7 provider observations reported that actual workflow protection and artifact retention were not demonstrated, no self-hosted runners were configured, and no existing evidence artifact was available to retrieve. These observations are historical inputs, not proof of present configuration. Recheck live settings before dispatch.

GitHub documents artifact attestations as provenance evidence tied to repository, commit, workflow, and event, while warning that an attestation does not by itself establish artifact security. GitHub-hosted artifact retention for public repositories is capped at 90 days, so it is not the selected long-term evidence store. Azure documents locked time-based Blob immutability as preventing modification and deletion during the retention period; actual account/container policy and access roles still require observation.

References: [GitHub artifact attestations](https://docs.github.com/en/actions/concepts/security/artifact-attestations), [GitHub retention settings](https://docs.github.com/en/organizations/managing-organization-settings/configuring-the-retention-period-for-github-actions-artifacts-and-logs-in-your-organization?apiVersion=2022-11-28), [Azure immutable Blob Storage overview](https://learn.microsoft.com/en-us/azure/storage/blobs/immutable-storage-overview).
