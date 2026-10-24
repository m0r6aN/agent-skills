---
ticket: CCM-P3A
title: Scrubbed PostgreSQL ingestion storage and transactional outbox
status: done
owner: clinton.morgan
created: '2026-10-24'
updated: '2026-10-24'
risk: elevated
surfaces: [src/keon/cortex/pipeline/ccm_ingestion.py, src/keon/cortex/providers/postgres/ccm_ingestion.py, tests/test_ccm_ingestion.py, tests/test_ccm_ingestion_postgres.py, docs/specs/ccm-durable-ingestion-v1.md]
routing_class: implementation/standard
verification_class: judgment-required
permission_profile: builder-standard
expertise: engineering
inputs: [text]
thinking_level: low
---

## Intent

First P3 increment: connect accepted ExtractionBatch and SourceDocument values to
actual authoritative PostgreSQL candidate storage and a bounded transactional
outbox, always scrubbing in memory BEFORE any pool/connection operation. Persist
pending extraction explicitly across process restarts. This is a callable internal
service, not a served/authorized HTTP endpoint or automatic import. No canonical
ShardRecord promotion, receipt authority, embedding or source-trust admission.
Remaining P3 governed shred/retract, descendant invalidation, actual canonical
Plane A/B writers and external crypto-key qualification remain open, not waived.

## Constraints

Python3.10+, installed dependencies only, five NEW files; accepted modules,
schema initializer, CI/dependencies/exports unchanged. Schema install is an
explicit operator method, never import/constructor side effect. Tables live in
existing keon_cortex schema. PostgreSQL is sole durable authority; no sqlite,
Mongo fallback, local spool, disk cache or live model request. Pool is trusted
operator configuration. All reservations and affected/native/private-Pi routes
remain held. Service is not wired to the live app. All data are unadmitted
unverified candidates; identifiers and hashes convey no authority.

## Acceptance Criteria

1. Pure module provides IngestionError(code) with closed codes invalid_input,
   resource_limit,scrub_failed,storage_failure,conflict,batch_fenced. Empty args,
   repr/str only closed code; no content-bearing cause/context when raised to
   caller (raise AFTER leaving handler). All DTOs frozen slots repr=False.
   prepare_ingestion(sources:tuple[SourceDocument,...],batch:ExtractionBatch,*,
   tenant_id:str,scope_id:str,import_batch_id:str,key_epoch:str,hmac_key:bytes,
   known_secrets:tuple[KnownSecret,...]=(),metadata:dict[str,object]|None=None)
   ->PreparedIngestion(tenant_id,scope_id,import_batch_id,payload_json,payload_hash,
   source_count,artifact_count). payload_json is canonical compact sorted JSON,
   detached; payload_hash SHA256 sanitized JSON, not raw input fingerprint.
2. BEFORE touching pool, validate exact built-in/accepted types, not bool-as-int,
   no arbitrary hooks. tenant/scope/batch/worker IDs fullmatch [A-Za-z0-9_.-]{1,128}.
   Call accepted scrub_payload over ALL textual durable surfaces: IDs (including
   routing IDs), source key/format, metadata KEYS and values, artifact kind/text,
   reason, pending sanitized source. Reject if scrub changes routing IDs (never
   redirect tenant/scope/batch). Source/content IDs use make_v2_entity_id with
   entity_type,schema_version,tenant_id,scope_id,import_batch_id,ordinal and the
   sanitized source value; raw source keys/digests must not enter SQL parameters.
   No raw payload hashes persisted. No synthetic exemption, no key persistence.
3. sources <=256, unique raw keys; aggregate original input <=1MiB (the accepted
   scrubber's smaller limit applies), exact bytes strictUTF8; exact SourceResults
   match every input key/format/order/sourceSHA. SourceDocument checkpoint bool.
   Exact ExtractionBatch counters/ranges and all DTO field types checked; source
   complete/pending_extraction/unsupported/failed only, reason None iff complete,
   otherwise nonempty bounded closed reason from accepted engine, no arbitrary
   error text. Noncomplete has no artifacts. Artifact kinds exactly accepted
   engine kinds, SHA matches payload, UTF8, spans both None or valid start<end
   <=source byte length. Total artifacts<=4096/output<=4MiB; actual counters match
   batch.artifact_count/output_bytes; operations/checkpoint_attempts exact integers
   0..32, attempts<=operations<=len(sources). runtime_held bool. Preparation bounds
   raw aggregate text/metadata before expensive processing; accepted scrubber
   enforces depth/nodes/bytes with safe failure. Serialized sanitized output<=4MiB.
4. Build one dict per source with ordinal, key,format,status,reason,artifacts
   (kind,text,start_byte,end_byte), and retry_source text ONLY for pending_extraction.
   Complete source raw text is never retained; pending sanitized text is replay
   material, explicitly not byte-identical original code, no automatic parser retry.
   Scrub the WHOLE envelope once before canonicalization, identity derivation and
   SQL. Metadata including nested dict keys sanitized by accepted implementation.
   Empty success, unsupported and failed sources persist just like pending. Return
   no raw exception/input through logs/repr; no logging anywhere in these modules.
5. PostgresIngestionStore(pool), async initialize(): explicit additive DDL for
   ccm_ingest_batches,ccm_ingest_sources,ccm_ingest_outbox. Composite identity
   tenant_id,scope_id,import_batch_id; source ordinal/ID distinct across scopes.
   batches store sanitized payload_hash and open/fenced state; sources store
   scrubbed per-source JSON plus staged/published and status; outbox stores only
   identity/hash/counts/state/lease metadata, not a second full payload copy.
   PK/FKs and CHECKs enforce scope linkage, JSON objects/statuses, positive sizes,
   closed states. No migration of historical data. Initialization errors safe.
6. async enqueue(sources,batch,*,same prepare kwargs,max_batches:int=128,
   max_bytes:int=16777216)->str (enqueued/duplicate). Bounds batch cap1..1024 and
   bytes1..67108864 exactint. prepare_ingestion runs BEFORE pool.acquire.
   One transaction and pg_advisory_xact_lock on tenant-scoped hash serializes
   capacity checks/enqueue/fence; lock order is tenant then batch rows. Count and
   total bytes include ALL retained batches (processed/dead/fenced too), so no
   unbounded accumulation hidden by active-only count. Equal existing payload hash
   duplicate, changed conflict; fenced always batch_fenced, no rewrite/recreation.
   Capacity test+batch+sources+outbox inserts commit atomically or all rollback.
   INSERT SQL parameterized, no user-interpolated identifiers. No raw parameters.
7. async lease(tenant_id,scope_id,worker_id,*,lease_seconds:int=30)->IngestionLease
   |None. DTO tenant_id,scope_id,import_batch_id,worker_id,generation:int. Validate
   all before pool; lease duration1..300. Transaction SELECT FOR UPDATE SKIP LOCKED
   joins open batch; only pending OR expired leased and attempts<5 eligible; DB
   clock, no client clock. Increment attempts and generation on every grant, owner
   and expires set. Monotone generation is fencing token; no random/timestamp ID.
   Expired final-attempt lease becomes dead without deleting source/pending work.
8. async complete(lease:IngestionLease)->bool and async fail(lease)->bool require
   exact valid DTO; scope/worker/generation AND unexpired currently leased AND
   open batch. Transactionally complete marks all source rows published and outbox
   processed, or fail returns pending/dead after max5; neither modifies payload.
   Stale/cross-scope/expired leases return False, zero source changes. Never invoke
   external effects inside DB transaction; this is local publication only. No
   claim of exactly-once external consumer effects. No auto retry loop.
9. async pending(tenant_id,scope_id,*,limit:int=100)->tuple[dict[str,object],...]
   reads bounded scrubbed pending source payloads (staged or published), only open
   batch and exact scope, deterministic batch/ordinal order, each returned value
   detached. include import_batch_id/source_id/state alongside source JSON. No
   caller-supplied SQL. Source pending status remains until future explicit
   separately admitted resolution parcel; complete delivery cannot mark extraction
   complete. Nonpending unsupported/failed remain durably accounted in source rows.
10. async fence(tenant_id,scope_id,import_batch_id)->bool uses same tenant advisory
    lock+transaction, marks existing batch fenced, active outbox dead, never creates
    unknown batch; returns False missing. No payload deletion/crypto erasure claim.
    Fenced batches cannot enqueue/replay/lease/complete/fail/pending visibility.
    This minimal ingestion fence is NOT public governed retract/shred, no fabricated
    Decision Receipt or derivative-cleanup milestone. Actual deletion stays open.
11. All DB/serialization/scrub errors sanitized with original exception discarded;
    cancellation propagates for transaction rollback, never swallowed. Unit tests
    assert scrub failure and invalid input cause ZERO pool acquisition, SQL-boundary
    capture contains no planted secret (including metadata keys, identifiers,
    source keys, artifact names/text, pending text), tenant/scope identity separation,
    true sanitizer no regex stand-in, no raw fingerprints persisted, closed errors.
12. Actual disposable PostgreSQL16 tests (not mocks) cover enqueue/close/reopen
    pool and persisted pending, duplicate/conflict, all-or-none injected second-row
    failure, capacity concurrent enqueues, exclusive lease/concurrent SKIP LOCKED,
    expiry/reclaim and stale tokens, fail/dead5 retention, complete atomicity,
    cross-scope isolation and fence-vs-enqueue/publication. Test env absent skips
    actual suite explicitly; parent must run it on private synthetic PG before
    acceptance. No external/production DB credentials or data. Exact baseline
    3905PASS137skip and447tracked files retained; black/isort/mypy, full suite,
    two fresh independent risk reviews,16exact-head checks and merged-main checks.

## Allowed Files

- src/keon/cortex/pipeline/ccm_ingestion.py
- src/keon/cortex/providers/postgres/ccm_ingestion.py
- tests/test_ccm_ingestion.py
- tests/test_ccm_ingestion_postgres.py
- docs/specs/ccm-durable-ingestion-v1.md

## Verification

Parent schema/content/static check before any candidate execution; restricted
no-network read-only test container, cleared environment, no worker credentials.
PG test container on isolated internal Docker network, tmpfs data, synthetic-only
credential, unique owned names/labels, no host port, bounded memory/CPU/pids.
Capture actual SQL/restart/fault/concurrency evidence. Reviewers never fix.
Step0 flags disposed and exact Gate2 committed before source; bounded repair has
own admission, all preexisting tests retained. No paid retry/fallback.

## Out of Scope

Live imports, canonical promotion, authorization/receipt issuance, public API,
governed shred/retract, external key destruction, vector/lexical/graph writes,
pending extraction resolution and real corpus. These remain explicit P3/P4-P8
dependencies; this bounded increment does not satisfy full P3 or goal exit.

## Binding Step0 Dispositions

- file-ownership: four source/test slices owned by candidate; fifth documentation
  file is parent-owned, verbatim this workorder body with status/dispatch records
  excluded. Five NEW files remains the parcel boundary.
- accepted-api-pins: supply exact accepted scrubber service/models, core ids and
  canonical implementation plus PostgreSQL pool convention. scrub_payload returns
  detached payload; KnownSecret tuple<=128, no synthetic_evidence is passed.
  ScrubError -> scrub_failed; metadata key collisions fail closed, never dropped.
- embedded-raw-fingerprints: raw SourceResult.source_sha256 and artifact digest
  fields are validation-only and omitted. python_symbol payload is strict JSON
  object with content_sha256 equal to that result fingerprint; remove ONLY this
  field before scrubbing/canonical text. Do not reinsert it. Other opaque candidate
  text may contain arbitrary hash-like values; no universal digest-erasure claim.
  Such text is scrubbed normally. Payload_hash hashes only sanitized envelope.
- scrubbed-control-fields: reject if scrub changes prescribed envelope/source/
  artifact key names, routing IDs, status, reason or artifact kind. Never restore
  raw originals. source key/format remain sanitized descriptive data; metadata keys
  may be scrubbed subject to accepted collision failure. Revalidate shape after
  scrubbing. Known-secret evidence cannot promote a candidate or exempt data.
- bounds-and-identity-definition: sources may be empty; nonnegative SQL source/
  artifact counts, positive serialized bytes. metadata exactdict orNone, values
  accepted JSON domain only (exact built-in dict/list/string/int/float/bool/None),
  accepted scrubber bounds apply. Count source content bytes separately<=1MiB,
  then scrubber<=1MiB assembled raw envelope (including duplicated artifact text
  and pending content/metadata) may reject earlier. No pre-serialization of raw
  object to logs/disk; normalize text bytes strictUTF8 in memory. canonical_json
  accepted utility = sortedkeys,ASCIIescaped,compact; output<=4MiB. source identity
  payload uses entity_type='ccm_ingest_source',schema_version='1.0',tenant_id,
  scope_id,import_batch_id,ordinal,source (entire sanitized per-source dict).
  source_id is hex v2 identity, identity not receipt. operations can exceed32?
  No: acceptedengine max32; emptybatch0; validate actual counters exactly.
- independent-verification-gate: initial ready=false is preserved. Local boundary
  dispositions only resolve preparation; actual PG16 and all independent reviews/
  source/main checks remain acceptance prerequisites, not claimed at Gate2.

Exact accepted artifact kinds: text_chunk,python_symbol,civic,fixture_candidate.
Reasons: union accepted engine _TEXT_CODES/_PYTHON_CODES/_GIT_CODES/_CIVIC_CODES
plus output_budget_exhausted,processing_budget_exhausted,checkpoint_required,
fixture_unavailable,checkpoint_budget_exhausted,unsupported_format,runtime_held,
input_budget_exhausted. This is a closed union, no arbitrary exception text.
Lease generation exactint>=1, never bool. No service method accepts a caller-
forged PreparedIngestion for enqueue; enqueue always re-runs prepare_ingestion
from raw DTOs and transient key material. DTO returned by prepare is for explicit
inspection/tests only, not a durable-write capability. Cancellation is BaseException
and propagates; Exception is sanitized only after its handler has exited.

## Independent Review Repair Disposition

Initial architecture/security reviews require changes; both original assessments
are preserved. Actual PostgreSQL reproduced blocking cleanup of a locked expired
fifth-attempt lease. Restricted synthetic reproduction confirmed reversible JSON
escaping of a non-ASCII known secret in Python-symbol fields. One additional
bounded production/test repair is admitted under standing owner authority, with
fresh independent reviews required. All reservations/routes remain held.

Structured artifact handling is explicit: python_symbol and civic are decoded
JSON objects, validated/bounded, and their KEYS/values scrubbed BEFORE any JSON
re-encoding. Remove the Python validation-only content_sha256 first. Preserve
whole-envelope scrubbing/control validation; structured candidate field names
are data and may change under scrub (collisions fail). No raw restoration.
Other opaque text remains subject to the accepted literal known-secret/catalog
scrubber profile, not a universal encoding-decoder claim. Do not introduce a
competing civic/symbol schema or arbitrary callbacks. Test both structured kinds,
non-ASCII and escaped control/quote/backslash secrets in keys AND values, asserting
decoded persisted text plus SQL parameters contain no original secret.

Expired-final cleanup must SELECT candidates FOR UPDATE SKIP LOCKED before
UPDATE, preserving tenant-first lock order. Test a locked expired-fifth row with
another eligible batch. Add controlled actual PostgreSQL interleavings for BOTH
publication/fence lock orders and enqueue/fence on an initially open batch;
assert durable source/outbox/batch states, including every source and original
lease owner/generation/attempts after publication rollback. Retain all3948local
passes145skips and initial11actual PG/guard cases. Add concurrent BYTE-capacity
boundary test. Parent test-fixture correction did not clear these review findings.

## Context & References

Binding charter D7/D8/D9 and accepted S12; CONTEXT-SPEC-V4 P3. Accepted PR100
engine and PR87 scrubber APIs, existing core canonical identity function,
PostgreSQL schema/provider conventions. Base6ba606012d338b51a92ee0320995406fae03aafb.
Standing constraints and current goal loop apply; original privacy/key/producer
holds are retained. Exact reviewed source and all baseline files must be pinned.
