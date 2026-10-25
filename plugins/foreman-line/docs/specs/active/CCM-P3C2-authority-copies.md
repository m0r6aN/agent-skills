---
ticket: CCM-P3C2
title: Independent deletion decision authentication and transactional copy memberships
status: active
owner: clinton.morgan
created: '2026-10-25'
updated: '2026-10-25'
risk: elevated
surfaces: [src/keon/cortex_governed/ccm_deletion_authorization.py, src/keon/cortex/providers/postgres/ccm_copy_tracking.py, src/keon/cortex/providers/postgres/ccm_canonical.py, tests/test_ccm_deletion_authorization.py, tests/test_ccm_copy_tracking_postgres.py, tests/test_ccm_canonical_postgres.py, docs/specs/ccm-authority-copies-v1.md]
routing_class: implementation/standard
verification_class: judgment-required
permission_profile: builder-standard
expertise: engineering
inputs: [text]
thinking_level: low
---

## Intent

Add an internal independently authenticated deletion-decision backend and exact
many-to-many canonical-copy tracking. Authentication resolves protected authority
state rather than trusting a receipt label or caller verification flag. Tracking
records every current import association despite first-wins canonical dedup.
No deletion executor, public API, terminal mutation or crypto effect is enabled.

## Constraints

Seven exact files. OSS never imports governed. No provider/network/filesystem/
environment/clock discovery/logging/signing/credential access in production.
Existing identity, graph constraints, canonical content, scope algebra and first-
write metadata unchanged. Bootstrap initialize explicit, never called at import.
No roles/extensions/grants created by source. All affected/native/privatePi routes
and all failed/uncertain/explicit reservations held. Synthetic test effects only.
Production Runtime issuer/import/provisioning adapters remain unqualified; default
allowed issuer set empty. Source completion is not production deletion admission.

## Acceptance Criteria

1. Governed module defines DeletionAuthorizationError(code invalid_input/denied/
   unavailable), empty args, fixed str/repr=code, no cause/context including an
   ambient caller exception. CancelledError propagates. Invalid input rejected
   before SQL; unexpected own DB/crypto failures unavailable, binding/signature/
   current-policy denial denied. Effect body errors propagate unchanged; no
   source raw exceptions/logs. No false promise about transient traceback locals.
2. PostgresDeletionAuthorizer(*,operator_profile_id:str,allowed_issuers=frozenset())
   validates exact config primitives, default empty denies. initialize(connection)
   explicitly executes AUTH_SCHEMA_SQL as existing privileged bootstrap only.
   authorize(connection,*,caller,receipt_id,target_kind,target_id,
   expected_target_version,expected_fence_epoch,idempotency_key) is an async
   contextmanager. caller exact accepted CallerScope with validate_context and
   scope_binding; caller.profile_id must equal TRUSTED configured operator profile.
   Initial capability is own-role-private only; no new grant grammar/role bypass.
3. Requires an existing READ COMMITTED transaction, checked with connection
   is_in_transaction and SHOW transaction_isolation; no acquire/commit/rollback.
   Future executor must first acquire existing tenant then graph locks, use this
   context inside its owning transaction, propagate all authorization failures
   through the transaction context, and perform no external effects here.
   Verify at entry and NORMAL exit. Entry/exit are authorization sampling points,
   NOT a guarantee that wall-clock validity persists until arbitrary later commit.
   Yield frozen slots repr=False LockedDeletionAuthorization metadata only: tenant_id,
   receipt_id,target_kind,target_id,effect,scope_id,authority_revision,binding_hash.
   No serializer/verified bool; DTO construction does not grant effect authority.
4. NEW INTERNAL envelope ccm-deletion-decision/1, explicitly no compatibility
   assertion with existing Runtime or MemoryInfluenceReceipt. Claims EXACT keys:
   schema_version,receipt_id,issuer_id,key_id,tenant_id,actor_id,profile_id,role_id,
   scope_id,target_kind,target_id,effect,expected_target_version,
   expected_fence_epoch,idempotency_key,authority_revision,issued_at,expires_at,
   decision. schema_version exactabove, decision allow; target_kind shard maps
   effect purge, import_batch maps retract. All subject/request bindings exact.
   IDs fullmatch[A-Za-z0-9_.-]{1,128}; scope/version/shard IDs lowercase64hex;
   import_batch target follows ID grammar. Epoch exactint0..2147483647, revision
   exactint1..2147483647, no bool coercion/subclasses/floats/null/extra fields.
   Complete canonical_json(claims)<=16384bytes, decoded flat exactdict only;
   per-string<=256UTF8bytes. Validate before serialization/crypto. Detached
   signature standard base64, strict decode and canonical reencode, exactly64bytes.
   Public key exact32bytes. Verify Ed25519 signature on accepted core canonical_json
   of ALL claims including issuer/key names; never sign/mint a receipt in source.
5. Time exact UTC grammar YYYY-MM-DDTHH:MM:SS[.1..6digits](Z|+00:00), real calendar,
   finite, no naive/offset acceptance. Pad validated fractional digits for Python
   3.10 parsing only, preserve signed lexical strings. issued<=DB clock<expires;
   0<expires-issued<=300seconds. Sample clock_timestamp for each entry/exit check.
6. AUTH_SCHEMA_SQL creates ONLY three protected authority tables:
   ccm_deletion_keys(issuer_id,key_id,public_key bytea,key_state active/retired/revoked),
   PK issuer/key; public bytes and IDs immutable, key_state only active->retired/
   revoked or retired->revoked, never reopen. ccm_deletion_operators(tenant_id,
   actor_id,profile_id,role_id,scope_id,authority_revision,active boolean,
   allowed_effects text[] subset purge/retract cardinality1..2), PK full subject+
   scope; subject immutable, provision/revocation updates increase revision, never
   decrement/reuse. ccm_deletion_decisions(tenant_id,receipt_id,claims jsonb,
   signature_b64 text,revoked boolean), PK tenant/receipt; signed claims/signature
   immutable, revoked only false->true. No delete/truncate/reopen for all three.
   Required primitive columns bounded as above; claims JSONB object with
   octet_length(claims::text)<=65536; signature88ASCIIchars, nonnull fields.
   Trusted provisioning accepts JSONB only; no JSON text parser is exposed here,
   so no permissive duplicate-key textual normalization is introduced.
7. Exact schema-qualified resolver signature:
   keon_cortex.ccm_resolve_deletion_locked(text,text,text,text,text,text)
   arguments tenant,receipt,actor,profile,role,scope, returns TABLE(claims_body text,
   signature_b64 text,public_key bytea,key_state text,authority_revision integer,
   operator_active boolean,allowed_effects text[],revoked boolean,current_at timestamptz).
   SECURITY DEFINER VOLATILE, fixed search_path=pg_catalog,keon_cortex; PUBLIC
   execution revoked. Tables REVOKE ALL PUBLIC; only trusted bootstrap/provisioner
   owns/mutates authority tables and function. App principals have no table rights,
   schema CREATE, owner/provisioner membership or BYPASSRLS. Source grants nothing;
   external explicit EXECUTE provisioning remains necessary. No arbitrary public
   DB clients admitted by this internal service contract.
8. Resolver locks current decision, referenced issuer/key, and EXACT current
   operator subject+scope revision rows FOR SHARE in that order until owning
   transaction ends. Missing rows return none. Immutable decision bindings and
   existing authoritative policy row required; no inference from missing rows or
   past grants. Provision/revocation writers must use same rows/order. Reject
   non-active keys, revoked decisions, inactive operator, unsupported effect or
   revision mismatch. Python independently validates claim bounds, cryptography
   and every requested binding after lookup. SQL withholds oversize bodies; fixed
   sanitized SQL errors. Revocation serialization is proven only against this
   protected local backend; production Runtime mirroring/current provisioning is
   explicitly unqualified and default-deny until independently accepted.
9. OSS copy module exposes COPY_SCHEMA_SQL, async initialize(connection),
   build_memberships(payloads:tuple,items:tuple,edge_ids:tuple)->tuple[dict,...],
   async record_batch(connection,*,tenant_id,scope_id,import_batch_id,payloads,
   memberships)->None. Public helper requires existing transaction; no acquire/
   commit/fallback. Error CanonicalAdmissionError closed invalid_input/unavailable/
   conflict/storage_failure and cancellation behavior retained. build pairs
   original complete-source artifacts in source/artifact order with current
   prepared item order; cardinality exact before any SQL. Each result EXACT keys
   source_ordinal,artifact_ordinal,staged_source_id,canonical_source_id,shard_id,
   node_id,edge_id. Original staged source ID distinct from current sanitized
   source ID from PREPARED node metadata; never use first-wins stored provenance
   for current-import membership. edge IDs are actual persisted IDs from _edge.
10. New ccm_copy_memberships PK tenant/scope/batch/source_ordinal/artifact_ordinal;
    immutable compared metadata staged_source_id,canonical_source_id,shard_id,
    node_id,edge_id. New ccm_copy_batches PK tenant/scope/batch with payload_hash,
    source_count,total_artifact_count,expected_complete_artifact_occurrences,
    mapped_occurrences,pending_source_count,tracking_version='ccm-copies/1'.
    Count occurrences, not distinct canonical IDs. Counts0..4096, sources0..256,
    source ordinal0..255,artifact ordinal0..4095. IDs existing accepted exact
    SHA/node/edge grammar; no source keys/title/path/content/payload/signature/
    private key persisted in copy tables. No generic inventory reader/API.
11. Scoped FKs to exact P3A batch and source ordinal and existing shard/node/edge
    keys, DEFERRABLE INITIALLY DEFERRED where graph already uses deferral. Before
    insert check staged source ID, source status complete/artifact ordinal, exact
    own-private binding and edge DOCUMENTS source=node/target=shard with same
    scope. No unauthorized cross-tenant/binding association. Membership/marker
    updates cannot change anything, identical no-op allowed; deletion/truncation
    rejects. Bootstrap no role creation/alter/grants. ENABLE+FORCE RLS both tables:
    SELECT only existing visible binding, mutation only existing own-private
    writable binding plus OPEN batch/current LEASED outbox and staged sources.
    Existing trusted app DB principal remains trusted, not a public arbitrary SQL
    client; structural association checks are not independent content proof.
12. record_batch independently verifies authoritative batch/source count/hash,
    complete-artifact positions, pending count and exact membership set. Insert
    or compare every field at duplicate positions; ON CONFLICT DO NOTHING alone
    insufficient. Marker inserts only after exact membership-set equality and
    matching counts, in same transaction before acknowledgment. Empty/unsupported/
    pending batches may have zero canonical mappings but must retain source,
    artifact/pending counts; publication state never means extraction complete.
    Historical processed batches with no marker remain UNRECONCILED, never
    inferred empty/complete. No historical backfill, no delete/clear/fence effect.
    Tracking marker means this writer's canonical mapping only; external copies,
    backups/replicas and remaining staged plaintext inventory remain open.
13. Existing writer initialize executes copy initialize after graph initialize.
    _write_locked keeps existing tenant-then-graph/row lock order, first-wins and
    canonical validation unchanged. During existing item loop collect actual
    returned edge IDs in item order; after loop build/record memberships BEFORE
    SET CONSTRAINTS ALL IMMEDIATE and final guarded acknowledgment. Pass same
    connection and original validated payload tuple/prepared item tuple. Every
    tracking/constraint failure rolls back all canonical/graph/event/outbox writes.
    No stagepayload/ID/hash/status rewrite, no old shard/node metadata mutation.
14. Existing test_ccm_canonical_postgres.py modification ONLY its database()
    fixture granting SELECT/INSERT/UPDATE on two new copy tables to its existing
    synthetic non-superuser role. New tables stay bootstrap owned with FORCE RLS;
    graph table/function ownership remains unchanged. No old tests removed,
    renamed, skipped or assertions weakened. Explicit permitted fixture adaptation,
    not production auto-grant or app ownership of auth state.
15. New tests require meaningful hostile input/config/error/ambient-context,
    all request-field substitution, unsigned/tampered/unknown/revoked/retired/
    expired/future/current-policy/empty issuer denial; no default issuer admission.
    Synthetic ephemeral Ed25519 positives run only in restricted tests; never
    serialize/log private keys. Actual PostgreSQL16 authority tests include READ
    COMMITTED checks, no direct app authority DML/schema ownership, missing resolve
    privilege, entry+normal exit expiry, body exception/cancellation, operator/key/
    decision revocation races and lock ordering. Body transaction failure must
    rollback synthetic effect; no claim contextmanager alone forces commit safety.
16. Actual copy tests use accepted database fixture and _enqueue_lease helpers
    with only the authorized fixture grant adaptation. Verify multi-batch duplicate
    same shards/nodes/edges but distinct associations, staged vs canonical source
    IDs, pending/zero occurrence batches, restart persistence, conflict/missing/
    tamper/FK/RLS/direct immutable negatives, no hidden count/API, late tracking
    failures atomic and current lease/fence race behavior. Compare complete
    existing shard/Observation/node/edge records before/after duplicates. All old
    canonical actual-PG cases must still pass, not just new synthetic positives.
17. Full5127PASS208SKIP and461baseline entries preserved except two named existing
    files; format/type/Python3.10 grammar and actual3.10 auth/time sample. Actual
    disposable PG16 non-superuser tests; two fresh independent architecture and
    security reviews, findings reproduced/triaged, exact16head and merged-main
    CI/deployment before acceptance. All own containers/network absent afterward.

## Allowed Files

- src/keon/cortex_governed/ccm_deletion_authorization.py
- src/keon/cortex/providers/postgres/ccm_copy_tracking.py
- src/keon/cortex/providers/postgres/ccm_canonical.py
- tests/test_ccm_deletion_authorization.py
- tests/test_ccm_copy_tracking_postgres.py
- tests/test_ccm_canonical_postgres.py
- docs/specs/ccm-authority-copies-v1.md

## Verification

Parent fixed-path AST inspection; restricted no-network/nonroot/read-only source
test image, OS-only subprocess environment; separate isolated synthetic PG16 on
owned internal Docker network, no host ports, bounded resources/time. No candidate
host execution or delegated credential shell. Exact serialized request<=192KiB
preflight before send/reservation, consistent JSON files grammar, small per-file
source/test slices, finite1200phase under new NYOctober25 day4000/effort20000/
floor1000; all7220.21925old exposure reserves held, historical spending unchanged.
At most4source posts,2bounded repair posts,4review posts; no automatic retry or
fallback. Parent mechanical writer/fixture integration exact named seams only.

## Binding Step0 Dispositions

AUTH-TRANSACTION-BOUNDARY: explicitly entry/exit sampling, not arbitrary commit
guarantee; effect owner must propagate errors. AUTH-CURRENT-STATE: READ COMMITTED,
immutable signed binding rows and locked current operator revision. AUTH-PROTECTED-
SQL/AUTH-SCHEMA-BOUNDS/AUTH-TIME-AND-ERRORS: exact signatures/columns/bounds and
privilege/error/time rules above; no live issuer qualified. COPY-POSITION-BINDING/
IDENTITY-AND-CONFLICT/MARKER-SEMANTICS: exact original position key, current prepared
source metadata, actual persisted IDs, count occurrences and compare duplicates.
COPY-ATOMIC-INTEGRATION: before constraints/ack on same connection, entire old
transaction unchanged otherwise. COPY-VISIBILITY-AND-SURFACES: FORCE RLS and no
new reader. EVIDENCE-QUALIFICATION: actual tests/reviews required, historical and
external inventory remain unqualified. Seventh file is explicit minimal fixture
grant adaptation needed because existing app fixture otherwise lacks new table
permissions; no extra runtime scope. No frozen identity/charter/exit changes.

## Out of Scope

Real Runtime issuer/provisioning integration, cross-role/legacy deletion authority,
public Gateway/HTTP endpoints, effect executor, tombstone/graph immutability
exception, staged payload clearing/retraction, reader/replay fences, durable
descendant/cleanup/Purge/key work, key destruction, full inventory/backup coverage,
real corpus, fullP3C/Context/bulk-import readiness. These remain mandatory later
gates, not waived or deferred wholesale toP6. New internal signed schema does not
claim existing governance wire compatibility or qualify a new production issuer.

## Context & References

Accepted P1A frozen deletion contracts/S03/S04/S12, P3C1 protocol, P3A ingestion,
P3B canonical writer and actual PostgreSQL tests, core canonical_json, existing
governed signing/key registry as contrast (retrieval receipts are not deletion
authority). Standing constraints, goal charter/sole coordinator and user direct
non-destructive authority apply. No new monitor/duplicate coordinator/session.
