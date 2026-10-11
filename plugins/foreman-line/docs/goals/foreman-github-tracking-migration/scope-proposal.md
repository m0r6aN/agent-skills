# GitHub-native Foreman tracking — separate prerequisite work package

**State:** owner-directed outcome; implementation contract/decomposition proposed, NOT dispatchable  
**Owner:** Clinton Morgan, sole project/Foreman owner per latest direction  
**Coordinator:** Pi `01a12b4f-c8e9-70a4-811b-0cd7eb889457`  
**Tracking:** [agent-skills #174](https://github.com/m0r6aN/agent-skills/issues/174)  
**Inspected base:** `97effb4eb4719b18a6ba78ad9962c78929d46f97`  
**Workspace:** `D:/Repos/agent-skills-worktrees/opmem-coordination-20261011-01a12b4f` (coordination documents only)

## Owner-directed outcome and boundaries

Replace the corporate tracker workflow with real GitHub Issues tracking and remove the owner-targeted corporate references from the current repository tree. The owner explicitly directs actual reviewed implementation/publication, not merely another cleanup issue. Keep this work separate from OPMEM-P0 and preserve the reused Stage A artifacts until an explicit amendment governs any later change.

This package records source discovery and recommended choices. It does not imply an exact contract amendment was ratified, a worker was admitted/launched, a live test was performed, or a paid budget was allocated. Existing OPMEM money limits are not a new migration-goal budget. No history rewrite, credentials transfer, external issue deletion, branch-protection weakening, HRO restart, routing-policy repair or unrelated feature work.

## Source-grounded findings

- `registration/src/types.ts`, `payloads.ts`, `gated-transport.ts`, `adapter-docker-mcp.ts`, `jql.ts` and `register.ts` implement tracker-specific payloads, corporate test isolation and a corporate MCP transport, not an adapter that can be redirected by changing a URL.
- `registration/src/register.ts` and `prior-registration.ts` preserve approval hash refusal, search-first upsert, partial-failure state, backfill/push, durable Stage-B receipt before external link write, and reconcile from the receipted SHA. Retain those invariants rather than replacing them with a bare issue-create CLI.
- `contracts/src/stages/b-registration.ts` and its generated schema already carry opaque nonempty string references. A GitHub-qualified issue identity fits the existing structural shape. Renaming fields is not required merely to change providers; historical receipts must remain verifiable under their original contracts.
- `spec-linter/src/schemas.ts` accepts a nonempty `ticket` string. The Jira-key naming/filename requirement is documentary canon, so stable parcel filenames plus repository-qualified issue references need an explicit reviewed convention amendment, not an invented schema rejection or silent change.
- `foreman-config/src/types.ts` / `schemas.ts` have a closed declaration contract with tracker-oriented identity consumers. A new repository/queue declaration must be versioned/ratified and tested with absent, null, mismatched and foreign-repository negatives.
- `dispatch/src/query/index.ts` queries/ranks tracker candidates through corporate site discovery. Registration alone cannot unblock the whole supported workflow; query, human-gate and closure consumers also need migration.
- Remote #175 parks HRO and archives its old coordinator. This migration neither reactivates that goal nor fixes internal frontier review admission. That is a distinct dependency.

## Bounded inventory

`source-inventory.mjs` is read-only, requires an explicit absolute root, uses local Git tracked paths, emits filenames/counts only and never emits matching source payloads. `source-inventory-97effb4e.json` records exact candidate paths at the inspected base:

- 3,258 tracked paths.
- 268 text files with owner-targeted removal references; one matching removal filename.
- 246 text files with legacy-tracker references; 401 unique files across both sets.
- Classifications: 157 instructions/documents, 79 runtime/config/generated, 112 tests/fixtures, 53 historical/proof materials. These are heuristic triage buckets, not reviewer judgments.
- 14 explicit coverage gaps: binary/large/non-UTF8 assets, including likely UTF-16 audit outputs, archives and a PDF. Inspect/decode with bounded deterministic tools before declaring the final sweep complete.

The inventory is NOT Allowed Files. Its own path references and newly committed planning/authority records require final-sweep disposition as well. Current-base counts do not prove a later head is clean. Proposed implementation manifests must distinguish create/edit/move/delete and include source-generated schema pairs, package metadata, tests and affected consumers.

## Proposed contract decisions — owner disposal required

1. **Issue identity and stable spec filenames.** Recommended: keep local parcel identifiers/filenames stable; use exact `owner/repository#number` for registered `ticket:`/Stage-B `ticketKeys`/link identities, with approved repository identity supplied explicitly. Preserve existing Stage A/B structural schemas and old receipt verification. Document the filename-versus-registered-reference distinction in an exact convention amendment. Reject foreign-repository references and PR numbers presented as issues. Alternative: introduce a new versioned issue-reference schema; this costs a broader consumer migration.
2. **Hierarchy and queue semantics.** Recommended: a parent tracking issue plus one issue per parcel, linked by explicit body references; no GitHub Projects or organization-only issue-type dependency. Typed labels encode ready/in-progress/blocked and priority; exact vocabulary is pinned in the contract before implementation. If native sub-issue linkage is used, prove capability and scope first. The query path is read-only, paginated, deterministic, and separates missing identity from an actually empty queue.
3. **Current-tree historical evidence.** Recommended: preserve original Git history/receipt bytes at immutable commits; replace prohibited current-tree material with clearly labeled sanitized derivatives or provenance pointers. Do not edit a receipt/manifest and pretend its historical hash still verifies. Produce a reviewed old-to-new locator/disposition manifest; regenerate producer-owned derived assets through their real producers. No history rewrite or blanket exemption for old documents.

These are proposed engineering choices, not reinterpretations of the already-directed GitHub-only outcome. Only affected decisions need approval; unrelated preparation continues.

## Proposed dependency-ordered parcels

| Parcel | Outcome | Risk / routing | Dependency |
|---|---|---|---|
| GH-P0 | Exact convention/config/reference and lifecycle amendment, migration fixtures and consumer manifest; documents/contract package before implementing consumers | elevated / architecture/risk | decisions 1–3; independent plan review |
| GH-P1 | Provider-neutral registration orchestration with GitHub payload/gates/idempotency/reconcile fixtures; keep approval/receipt invariants and historical compatibility | elevated / architecture/risk | GH-P0 |
| GH-P2 | Deterministic GitHub adapter using existing authenticated CLI/API infrastructure; repository allowlist, typed response validation, preview/no-network tests, retry/lost-ack/partial-state reporting | elevated / architecture/risk | GH-P1; exact auth/write envelope |
| GH-P3 | Read-only candidate query/ranking plus human-gate/closure consumers on the same explicit repository/reference contract | elevated / architecture/risk | GH-P0–P2 |
| GH-P4 slices | Exhaustive corporate-reference cleanup, skills/instructions/examples/config/fixture updates and historical/generated-asset disposition, split by exact nonoverlapping manifests | elevated / architecture/risk for proof/contracts; standard / implementation/standard for mechanical text slices | accepted proof-disposition contract; shared files serialized |
| GH-P5 | Integrated deterministic suites and separately authorized real sandbox create/link/re-run/query proof, final no-target-reference scan, negative controls, release/rollback/handoff | elevated / architecture/risk | GH-P1–P4 |

This is a proposal, not a new ratified Foreman queue or dispatch order. Exact manifests and independent verification commands belong in each shaped work order; broad directory grants are forbidden. Do not require the not-yet-built GitHub registrar to register its own prerequisite migration through fabricated receipts. Propose an explicit bootstrap/transition authority mechanism for review before the first irreversible write; old receipt/canon compatibility remains intact.

## Verification requirements

- Scope pinning, missing/mismatched repository identity, malicious issue text, wrong-repository exact reference, malformed/paginated responses and rate-limit/lost-ack/duplicate retries fail safely.
- Preview makes zero writes; updates preserve unrelated labels/assignees/state/content. Search covers the entire permitted issue namespace and stops on ambiguous matches; search-only GitHub eventual consistency is not accepted as effectively-once creation without a reconciliation strategy.
- Approval content-hash mismatch prevents all creates. Reconcile requires durable verified prior registration, not a hand-edited frontmatter value. Historical receipts remain byte-identical and verifiable; new permalinks bind the actually pushed SHA.
- Every affected package's tests/typechecks/schema parity and the spec/frontmatter/body checks pass under approved versions. Architecture/risk parcels require two independent admitted reviewers; coordinator does not substitute a self-review.
- Live proof is real but separately bounded: dedicated repository/label namespace, previewed batch, only expected test issues/links, no deletion, actual readback and idempotent re-run. No token/auth-file inspection or speculative remote mutation.
- Final tracked-tree/content/filename scan covers decoded text and archive/generated assets, including migration documents/inventories. Unknown coverage remains a failed gate, not a skip.

## Immediate next action / stop

Dispose decisions 1–3, nominate/authorize the smallest new bounded internal-review admission owner after the old HRO archive, then shape GH-P0 and exact follow-ons under real approved routes and a separately stated migration spend/time envelope. No model/probe calls are admitted by this work package. Preserve OPMEM scope and higher-priority AgentTask delivery.
