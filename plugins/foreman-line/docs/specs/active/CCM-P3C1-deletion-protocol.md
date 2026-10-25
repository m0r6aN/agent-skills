---
ticket: CCM-P3C1
title: Strict deletion protocol and minimal parent-loss transition primitives
status: active
owner: clinton.morgan
created: '2026-10-24'
updated: '2026-10-24'
risk: elevated
surfaces: [src/keon/cortex/pipeline/ccm_deletion_protocol.py, tests/test_ccm_deletion_protocol.py, docs/specs/ccm-deletion-protocol-v1.md]
routing_class: implementation/standard
verification_class: judgment-required
permission_profile: builder-standard
expertise: engineering
inputs: [text]
thinking_level: low
---

## Intent

Implement a pure tested prerequisite for governed deletion/retraction: strict
frozen deletion DTO validation, honest completion rollup and S04 parent-loss
transitions. This is P3C1, not the full P3C database/reader/job/authority service.
No deletion capability, authority assertion or cryptographic erasure is provided.

## Constraints

Three NEW files only. Existing accepted source/fixtures/identity/schema/readers,
tests/CI/dependencies/exports unchanged. Python3.10 grammar, standard library only.
No IO/network/provider/environment/clock/shell/logging/import effects. No side
effects, authentication, persistent deduplication or synthesized proof. Caller
data is untrusted even when typed; returned DTOs do not grant authority. All
failed/uncertain reservations and affected/native/privatePi routes remain HELD.

## Acceptance Criteria

1. Module exposes DeletionProtocolError(code), code invalid_input or
   resource_limit only; empty args, fixed content-free str/repr, no chained
   exception context/cause. Invalid input never renders rejected objects. Exact
   builtins only; no subclass hooks/coercion. Validate before copy/JSON encoding.
   Bounded input tree depth16, totalnodes10000, strings<=4096UTF8bytes,
   totalUTF8text<=262144, lists<=256, ints0..1000000, no floats/cycles/customhooks.
   Only exactdict/list/str/int/bool/None input types allowed where schema permits.
2. validate_purge_status(value),validate_cleanup_job(value),
   validate_key_destroy_request(value),validate_key_destroy_status(value) each
   returns detached plain dict/list data, rejecting missing/extra fields and
   wrong exact primitive types. These schemas are externally versioned as
   purge-status/1,cleanup-job/1,key-destroy-request/1,key-destroy-status/1; do NOT
   invent a schema_version wire field absent from their frozen required lists.
   Include ALL field names/enums/nullability from accepted P1A frozen section.
3. Required identifiers and non-content evidence refs fullmatch
   [A-Za-z0-9_.:/-]{1,256}; error codes nullable fullmatch[a-z][a-z0-9_]{0,63}.
   This is lexical validation only, never authentication or proof of non-content
   semantics. UTC timestamps exactstr matching RFC3339 YYYY-MM-DDTHH:MM:SS with
   optional1..6fraction digits and Z or +00:00; real valid calendar and finite,
   no local offset/naive time. Required times nonnull, explicit nullable fields
   accept None. created_at<=updated_at; evidence lists unique; coverage copy_id
   unique. Positive fence/inventory integers>=1; no bool-as-int.
4. Coverage entry shape exactly copy_id,copy_class,custody_ref,contains_plaintext,
   contains_recoverable_key,state,verified_at,expiry_at,evidence_refs. copy_class
   authoritative/replica/backup/cache/vector_index/outbox/audit_payload/descendant/
   export; state pending/blocked/failed/verified_absent/verified_destroyed/
   verified_expired. Verified states require verified_at and nonempty evidence;
   verified_expired additionally requires expiry_at<=verified_at. Nonverified
   states cannot assert verified_at. No inference of key/payload absence from
   booleans or labels. Shared coverage shape used by purge/key status.
5. purge milestones exactly authoritative_fence,derivative_cleanup,
   key_destruction,verified_coverage, each exactly state,updated_at,evidence_refs.
   States pending/running/blocked/failed/complete. Complete milestone requires
   nonempty evidence refs. No future milestone updated_at beyond operation
   updated_at; no milestone before created_at. Frozen purge-status/1 describes
   overall status but does not list a status field among its required fields.
   validate_purge_status accepts ONLY listed fields and does not add status;
   overall_status(milestones)->str computes the status separately.
   Deterministic precedence failed,blocked,running,pending,complete; complete
   iff all four complete. A complete purge milestone set also requires nonempty
   coverage, every copy in verified state, and nonempty evidence per copy.
6. cleanup-job all frozen fields exact; attempts>=0, leased requires nonnull
   lease_owner/lease_until with lease_until>updated_at, other states require both
   null. signal_id and signal_occurred_at both null or both present. Job kind
   descendant_invalidate requires signal pair; other kinds may carry it. Target
   kind shard/import_batch. job state pending/leased/retry_wait/blocked/failed/
   complete; job kind derivative_delete/descendant_invalidate/purge_event_deliver/
   key_destroy/coverage_reconcile. Complete requires evidence refs. job result is
   structural claim only; no lease/effect/provider qualification.
7. key request exact frozen fields, all identifiers required. Key status states
   pending/running/blocked/failed/destroyed; destroyed requires nonempty evidence
   and nonempty all-verified coverage. Requests/statuses cannot authorize effects
   or establish that a custody adapter is qualified. Unknown inventory, missing
   external verifier or copied labels cannot establish real completion.
8. retry_delay(attempt:int)->int|None pins future operational proposal only:
   exactint1..5 gives5,10,20,40,None; None means exhausted, NEVER success.
   Invalid attempt rejects. No timers/worker/retry loops implemented here.
9. invalidate_parent_loss(value,*,already_applied=False)->InvalidationResult,
   frozen slots repr=False fields archival,validity,replacement,reason,changed,
   preserve_lineage. Input EXACT keys archival,validity,parents,signal_at,
   last_revalidated_at,replacement as accepted P1A fixture vectors. archival
   active/buffered/archived/superseded/purged; validity valid/contested/
   stale_code_dependency. replacement iff superseded, lexicalnonempty token.
   parents list<=64 from those archival enums plus retracted. Current pure rule
   treats purged/retracted as lost; other statuses retained as available. No
   production lineage/admission or parent resolver is created. Missing authority
   of supplied parent labels means caller must resolve them in later integration.
10. Purged child, already_applied, signal<=last_revalidated_at, no parents or no
    lost parents => unchanged, reasonNone,changedFalse. Partial loss => contested
    and preserve archival/replacement, reason partial_parent_loss. All loss =>
    archived+contested, replacementNone, reason all_parents_lost. Always
    preserve_lineageTrue. No automatic revalidation/restoration/supersession.
    last_revalidated_at nullable UTC, signal_at required UTC. already_applied
    exactbool; advisory pure input only, not durable dedup. No mutation of input.
11. Tests independently enumerate every frozen field/enum/nullability, wrong
    types/subclasses/coercion/extra/missing/cyclic/oversize/collisions, detached
    output, sanitized errors with planted synthetic secret, chronology and
    evidence contradictions, all milestone combinations, retry limits, accepted
    8parent-loss fixture vectors and equal/older/terminal/repeated signals.
    Ordinary full suite keeps all4023PASS208SKIP dispositions and458tracked pins.
    No database required: no production persistence changed by this parcel.
12. Independent architecture/security complete-source reviews, deterministic
    restricted tests/style/type/grammar, exact16head checks and merged-main
    CI/deployment before acceptance. Report pure claimed-state validation versus
    runtime authority, durable erasure, read fencing and fullP3 completion.

## Allowed Files

- src/keon/cortex/pipeline/ccm_deletion_protocol.py
- tests/test_ccm_deletion_protocol.py
- docs/specs/ccm-deletion-protocol-v1.md

## Verification

Parent fixed-path AST inspection then restricted no-network/read-only/nonroot
Docker synthetic tests, OS-only runner, no credentials; accepted test image.
Black/isort/mypy/Python3.10 grammar plus all old test-identity and source-pin
correspondence. Independent 625milestone-state combinations and8frozen parent
loss vectors mandatory. Bounded consistent JSON files output, exact serialized
body<=192KiB checked BEFORE reservation/send, no retry/fallback. Two independent
fresh risk reviews; reviewers do not fix. Step0 dispositions and committed Gate2
before source, findings reproduced before repair, full counts on each rework.

## Out of Scope

Actual SQL tombstones/deletion, graph trigger changes, writer epochs/membership,
read fences, persistent job processing/dedup/frontiers, independent authority
verification, Gateway/HTTP wiring, external signing/index/key effects, real data,
production lineage admission, full P3/Context/crypto/import readiness. These are
mandatory later integration dependencies, not waived or deferred wholesale toP6.

## Context & References

Accepted docs/specs/ccm-memory-graph-v2.md frozen deletion schemas and state table,
tests/fixtures/ccm/contracts-v2.json states.parent_loss/signals, S03/S04/S12,
P3C Step0 source inventory and p3c-readiness-20261024.md. Standing constraints,
sole coordinator and existing owner non-destructive authority remain binding.

## Binding Step0 Dispositions

AUTH/COPY/GRAPH/LINEAGE/READS/JOBS/KEY: full P3C service remains blocked on these
seams. Narrow this prerequisite to pure validation/transition primitives; never
manufacture positive adapter/authority or completeness. FILES: exact three NEW
paths above, no guessed existing modifications. GATES: independent prerequisite
acceptance only, full P3C remains incomplete. Supplied Step0 no-dispatch/readiness
false is preserved. This scope changes no charter/frozen identity/wire decision.
Absent status field in frozen purge required list resolved by separate rollup
function; no wire field addition. Frozen original future-worker semantics remain.
