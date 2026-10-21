---
ticket: CCM-P1A
title: Cortex memory and temporal graph v2 contracts
status: active
owner: clinton.morgan
created: '2026-10-19'
updated: '2026-10-20'
risk: elevated
surfaces: [docs/specs/ccm-memory-graph-v2.md, src/keon/cortex/envelope/taxonomy.py, src/keon/cortex/ingress/models_v2.py, tests/test_ccm_contracts_v2.py, tests/fixtures/ccm/contracts-v2.json]
routing_class: architecture/risk
verification_class: judgment-required
expertise: engineering
inputs: [text]
permission_profile: builder-architecture
data_classification: internal
---

# CCM-P1A — Cortex v2 contract foundation

## Intent

Produce one canonical, executable memory-contract boundary for CCM: additive taxonomy, versioned shard validation, normative temporal graph/state tables and reusable wire fixtures. Downstream builders must consume these contracts rather than choose architecture. This is a local foundation, not an HTTP, database, privacy-worker or deployment implementation.

## Constraints

- Primary repository: `D:/Repos/keon-omega/keon-cortex`. Observed source HEAD: `684785f220c066e8686e160eec2611c727582a00`; this is not a clean-tree or dispatch-base assertion. No implementation dependency. Gate 1/plan review, coordinator lint, Gate 2, process/registration, exact clean base and admitted route/budget remain prerequisites for dispatch.
- Authority: final v4 plus accepted S01–S12 in the decision register below and the owner-approved C02-D1 scoped AC6/dependency amendment (2026-10-20). Preserve OPMEM D1–D18, Cortex/Postgres authority, Gateway ingress, existing scope/identity law, INV-2/3/5 and Pantheon incarnation law. Memory and caution never grant execution authority.
- Extend canonical enums in `envelope/taxonomy.py`; do not add parallel enums elsewhere. Preserve existing enum values/ranks and old serialized identities. Add `CAUSAL`, `REPULSIVE`, `BUFFERED` and orthogonal `ValidityStatus(valid, contested, stale_code_dependency)`.
- Add version-specific v2 validation beside existing ingress models, reusing `CandidateProvenance`, `ReceiptAnchor`, clean-text/identifier and scoped-ID contracts. Do not edit v1 ingress behavior, change old hashes, or wire v2 into `api.py`. Projection labels are not source authentication or cryptographic receipt verification.
- The normative contract document owns Plane-A DDL, state/routing tables and derivative-cleanup/key-custody interfaces; writing that document does not apply migrations or implement those services. Keep the packet under ~16k supplied tokens; source v4 is selective excerpts, not mandatory full history.

### Frozen v2 validation and trust table

The v2 serialized fixture uses snake_case v4 fields, `schema_version: shards/2.0`, existing ReceiptAnchor aliases inside receipt references, timezone-explicit UTC event times and finite numeric values. Producer input cannot authoritatively set scoped IDs, approval or verification results. Validation errors are non-content-bearing structured field/code diagnostics, never secret-bearing payload echoes.

For all nine canonical MemoryKinds, direct source tiers map as follows: verified_receipt -> RECEIPT; explicit_human_directive and deterministic_code_or_event -> RAW_EVIDENCE; unverified_candidate -> SUMMARY. The source tier requires its own trusted source/proof admission; merely supplying it or a receipt pointer does not establish it. `corroborated_causal` and `uncorroborated_causal` are valid only for Causal and map to CAUSAL_RECORD. `distilled_verified` is valid only for Semantic/Procedural and maps to SEMANTIC_MEMORY/PROCEDURAL_MEMORY respectively. Reject other combinations; enumerate the full cross-product, including rejection rows, in fixtures. Embedding projections remain derivative artifacts, not a new memory kind or evidentiary shard.

Tier numbers are default direct-source weights. Derived effective score is `min(0.70, 0.90 * min(parent effective scores))`; require a nonempty parent set and finite scores in [0,1]. All eligible high-trust parents (>=0.85) permit Semantic/Procedural distilled_verified; other derived candidates retain unverified_candidate. Derivation cannot inherit RECEIPT/RAW_EVIDENCE standing. Promotion is separately receipt-governed and never turns a child into an execution receipt. Inheritance selection uses effective score AND required tier/evidence, never numeric score alone.

Distinguish untrusted producer assertions from authoritative resolved parent inputs. A submitted parent reference, score, tier or verification flag is not proof: effective scores and required evidence derive from parent records resolved under the applicable identity, current-scope and authentication contracts. Specify fail-closed behavior for missing, invisible, unauthenticated or substituted parents and producer-injected scores/tiers. Mathematical positive fixtures represent already-resolved trusted inputs, separately from producer-payload negatives. P1A defines this contract/interface, not a live resolver or a qualified positive producer.

### State, visibility and deletion contract

- Active/buffered accept all three validity states; archived is cold; superseded requires a real non-null replacement; purged retains only the scoped tombstone/proof metadata. Retention is independent of epistemic validity. `derived_decay_state` exists only in response projections at explicit `as_of`.
- Parent loss: sole/all parents lost -> surviving child archived+contested with invalidation reason; partial loss -> contested, preserving existing archival state (including buffered/archived/superseded). Purged child remains unchanged. Revalidation cannot implicitly restore archived children. Explicit replacement preserves lineage. Symbol changes stale validity; correction/failure contests validity. Signals older than/equal to last_revalidated_at are no-ops; terminal purges never reverse. Test equality, repeated signals and all surviving-parent archival combinations.
- Buffer evidence contains entered-at plus a success-counter snapshot/event equivalent. At most one archival transition per sweep. A new deduplicated verified success reactivates buffered (preserving validity); archived requires explicit restoration. Preserve strict 0.50/0.25 inequalities and event-time semantics from S07.
- Plane-A has tenant/profile/role/scope binding using existing visibility law, endpoint integrity and immutable versioned node IDs. Preserve the v4 edge hash recipe with versioned endpoint IDs and temporal intervals [start,end). Retain separate logical artifact identity. Current authorization applies at every historical hop and both endpoints; never infer sharing from common tenant.
- Recall graph depth <=2. Read APIs default depth2/max3; request budgets 1000 returned nodes/4000 edges/10000 examined visible edges. Specify deterministic cursors bound to query/as_of/authorization, per-page reauthorization, cycle deduplication, explicit truncation and no hidden counts/dangling endpoints. These are API contracts, not implemented traversal here.
- Document the complete S10 routing table and whole-warning/conflict-group budget protocol; source citations require existence/scope/identity/proof validation, not only post-trim membership.
- Define deletion milestones (authoritative fence, derivatives, keys, coverage), durable idempotent cleanup/invalidation jobs, batch write fencing, retry/reconciliation and non-content evidence. P3 owns minimal Wave-1 purge propagation; P6 extends other triggers. A SQL transaction cannot atomically delete Qdrant or destroy external keys.
- Define a key-custody adapter requirement with scoped key reference, authorized idempotent destruction operation, status/evidence and backup/replica coverage. Do not select a provider or claim erasure until separately qualified; plaintext/key-bearing backups keep completion blocked. HMAC scrubber keys are not shard erasure keys.
- Document S11 civic caution wire semantics and S12 fail-closed scrubber boundary; no live enforcement or scrubber implementation here.

## Acceptance Criteria

1. Additive enums and v2 model validation implement the closed tier/kind/state rules above. Existing v1 ingress models, scoped/handoff ID derivation and receipt-vs-cognition rules retain behavior. Superseded with null replacement and a persisted derived_decay_state fail v2 validation.
2. A canonical JSON fixture file enumerates accepted/rejected tier-kind combinations, old-version replay inputs, IDs generated by existing canonical/scoped recipes, explicit UTC event times, state transitions, source-kind migration, civic wire cases and error codes. IDs must satisfy actual validators; abbreviated v4 illustration IDs are not executable fixtures.

   P1A's contract document and normative fixture freeze the civic rejection, domain-caution and multi-parent wire schema, consuming accepted v4/S11 rules and P1C's Required wire behavior as contract inputs, without depending on P1C implementation. Enumerate exact fields/casing, canonical enum encoding, absent-versus-null/default semantics, existing ID/receipt aliases and S11 transition/negative cases. P1C must conform to the accepted P1A section and fixture commit/version; divergence requires a scoped P1A contract amendment. Record source/copy comparison at acceptance.
3. Worked positive: a Procedural child of effective parent scores [0.85,1.0] yields distilled_verified/0.70/ProceduralMemory, not RawEvidence. Boundary: parents [0.20] yield unverified_candidate/0.18/Summary; empty parents, NaN and an inline asserted verification flag cannot promote it.

   These mathematical positive inputs are already authoritatively resolved. Separate negative fixtures cover missing, invisible, unauthenticated and substituted parents, plus producer-injected effective scores/tiers; submitted references or verification flags cannot satisfy resolution or admission.
4. Worked state cases: single purged parent + buffered child -> archived/contested; partial loss + archived child -> archived/contested; purged child is untouched. Last-revalidated equality is a no-op. An archived record never becomes active due solely to revalidation.
5. The contract document contains complete accepted S03–S12 tables/interfaces, Plane-A DDL and a named dependency outline P2 scrub/parse -> P3 persistence/purge -> P4 scoped recall -> P5 composer/graph (Wave1); P6 lifecycle/Gateway -> P7 inheritance and P8 connectors (Wave2). Shared api.py edits have one serialized integration owner, not independent redesigns. No downstream packet is silently dispatchable.
6. Define the versioned legacy provenance-admission contract and fixtures. A high-trust migration requires an exact producer/version/source-kind mapping plus authenticated admission bound to the original record, content identity and authorized scope; source_kind membership, issuedBy and receipt_ref presence alone never confer trust. Record that no concrete high-trust producer is yet qualified from inspected evidence. Missing, unknown or unauthenticated legacy sources remain unverified_candidate; do not invent a positive allowlist or claim positive producer coverage. Concrete producer allowlist freeze and independent authentication evidence are a prerequisite of the later bounded ingestion/migration contract before P3 may run a high-trust legacy backfill. P1A may close its contract-only deliverable with this dependency explicitly open; that is not acceptance of a trusted migration, a live verifier or overall P1/Wave-1 readiness.
7. Tests assert externally specified results, not regenerate expectations using the implementation under test. Include same-tenant cross-role and historical visibility negative contract fixtures, terminal-state cases and old fixture replay. Document implementation-vs-contract-only coverage honestly.

   Accepted S05–S07 and pinned P1A requirements remain the normative source for P1B's versioned parameters/formula identity. Record exact source/version/hash identities for downstream conformance without making P1A depend on future P1B output or retuning constants. P1B acceptance requires separate independent numeric recomputation as specified in its AC4.

## Out of Scope

No database migration/application, HTTP wiring, storage workers, live receipt authority, key-store implementation, actual shred, score implementation, multi-parent runtime conversion, source imports, cloud/credential work or edits to OPMEM/Gateway. Multi-parent wire expectations are frozen here; actual Cortex InheritanceEvent/validator backward-compatible extension belongs to P7 and may not change old event IDs here.

## Context & References

- [Accepted decisions](D:/Repos/Pantheon/docs/CONTEXT-SHAPING-DECISIONS.md)
- [Owner-approved C02-D1 amendment and conditional review authorization](../../goals/collective-civilizational-memory/owner-c02-rlp-disposition-2026-10-20.md)
- [Delegated oversight authority and scoped R06 corrections](../../goals/collective-civilizational-memory/oversight-2026-10-20.md)
- [v4 source](D:/Repos/Pantheon/docs/CONTEXT-SPEC-V4.txt)
- [Owner delivery handoff](D:/Repos/Pantheon/docs/CONTEXT-SHAPING-HANDOFF.md)
- [Taxonomy](D:/Repos/keon-omega/keon-cortex/src/keon/cortex/envelope/taxonomy.py)
- [Existing ingress](D:/Repos/keon-omega/keon-cortex/src/keon/cortex/ingress/models.py)
- [OPMEM current recorded state](../../goals/operator-developer-cortex-memory/charter.md)
- [Pantheon law](D:/Repos/Pantheon/docs/COLLECTIVE-INCARNATION.md)

## Allowed Files

Paths below are exact and relative to the sole primary repository:

- `docs/specs/ccm-memory-graph-v2.md` (new)
- `src/keon/cortex/envelope/taxonomy.py`
- `src/keon/cortex/ingress/models_v2.py` (new)
- `tests/test_ccm_contracts_v2.py` (new)
- `tests/fixtures/ccm/contracts-v2.json` (new)

No auto-generated snapshots or unrelated package/config edits. An absent additional required path is an amendment blocker, not implied authority.

## Verification Plan

From the exact admitted Cortex worktree with its existing test environment:

```text
python -m pytest -q tests/test_ccm_contracts_v2.py tests/test_ingress_models.py tests/inheritance/test_inheritance.py
python -m pytest -q tests/gravity/test_contracts.py tests/gravity/test_projection_fixtures.py
python -m pytest -q tests/test_evidence_envelope.py tests/test_shards_v1_1.py
```

Run pre/post named baseline suites, retain test identities and exact command output, and use a read-only diff of v1 models/gravity replay artifacts. Contract fixtures do not prove live SQL scope enforcement, graph traversal, deletion or deployed interoperability. Mandatory reviewer questions: Can a derived record gain evidentiary standing from a label? Is the tier table total without breaking old replay? Can parent loss/reactivation resurrect archived or purged knowledge? Do graph/deletion contracts hide unbounded work or unqualified erasure claims? This elevated architecture boundary needs applicable independent reviews, never builder self-approval.

Identify the pre-P1A gravity/replay baseline by exact base, test and fixture identities and retained outputs. P1B's later evidence chain must reference that baseline alongside the accepted P1A commit and its own pre/post results; it may not substitute only a post-P1A baseline.

## Dispatch Envelope and Completion

Initial packet <=~16k tokens: this spec, accepted decision excerpts, existing taxonomy/ingress interfaces and the named tests; initiative history stays by reference. No blanket context override or model identity in metadata. Coordinator measures actual required capacity, resolves the cheapest qualified exact builder/fallback route and records its data/tool eligibility without changing an existing session. Retain risk-based independent reviewers even with a cheap builder.

One implementation attempt and one focused repair, then a minimal reproducible blocker. Before paid dispatch record approved dollar/time/input/output/tool/review/retry bounds and enforcement limitations; none are authorized here. Record actual usage separately from estimated/unknown billing. Pin the exact base and dependency artifacts before Step0. Completion reports changed files, test commands/results/evidence paths, contract versions, limitations, usage/cost status and unresolved blockers; it is not approval, merge authority or a release claim.
