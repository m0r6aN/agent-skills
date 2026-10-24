---
ticket: CCM-P3B
title: Canonical low-trust admission and atomic Plane A/B writer
status: active
owner: clinton.morgan
created: '2026-10-24'
updated: '2026-10-24'
risk: elevated
surfaces: [src/keon/cortex/pipeline/ccm_admission.py, src/keon/cortex/providers/postgres/ccm_graph_schema.py, src/keon/cortex/providers/postgres/ccm_canonical.py, tests/test_ccm_admission.py, tests/test_ccm_canonical_postgres.py, docs/specs/ccm-canonical-writers-v1.md]
routing_class: implementation/standard
verification_class: judgment-required
permission_profile: builder-standard
expertise: engineering
inputs: [text]
thinking_level: low
---

## Intent

Integrate accepted P3A staging with canonical existing PostgreSQL shards and
spine stores, and implement the frozen amended Plane-A graph schema. One internal
trusted-context writer atomically commits scoped low-trust shards, graph backing,
Observation events and outbox acknowledgement. No second memory authority.
Admission here means canonical persistence at unverified_candidate/Summary/0.20,
never authenticated source promotion or execution authority. Qualified producers
remain empty. Existing identities, v1 readers and full-goal exits are unchanged.

## Constraints

Six NEW files only, Python3.10+, installed dependencies. No accepted source, CI,
dependency, export, live API or existing schema initializer edits. Existing
CallerScope carriage, is_record_visible, core identity/serializer, ShardV2,
PostgresDocumentStore and PostgresRecordStore remain authoritative. Initialize
explicitly on an existing canonical schema; no import/construction effects.
No provider, network, filesystem, shell, logging or credential discovery in
source. Trusted operator pool/caller context only; no public request handler.
All reservations and affected/native/private-Pi routes remain HELD.

## Acceptance Criteria

1. Pure ccm_admission defines CanonicalAdmissionError with closed invalid_input,
   resource_limit,unavailable,conflict,scrub_failed,storage_failure codes, empty
   args, content-free str/repr and no retained cause/context. Raise after leaving
   exception handlers; cancellation propagates. Frozen slots repr=False DTOs:
   CanonicalItem(node:dict,shard:ShardRecord,event:ISpineEvent,edge:dict) is NOT a
   caller-granted capability; public writer never accepts caller-forged bundles.
   TrustedContext uses exact accepted CallerScope plus decision_receipt_id; this
   is internal authenticated-carriage seam, not authentication by dataclass type.
2. validate_context(caller,decision_receipt_id) checks exact CallerScope, exact
   primitive fields/frozenset grants and accepted require_consistent_carriage.
   tenant/actor/role/profile/receipt fullmatch[A-Za-z0-9_.-]{1,128}; optional
   generation/session/task None or same alphabet. No bool/coercion/hooks.
   decision receipt is required audit carriage as existing ingest law; it is NOT
   cryptographic proof, never an admitted receipt endpoint/ReceiptRef/high tier.
   Public callsites must supply already authenticated Gateway/operator carriage;
   no live callsite is introduced or qualified in this parcel.
3. scope_binding(caller)->64hex = make_v2_entity_id over exactly entity_type=
   ccm_scope_binding,schema_version=1.0,tenant_id,profile_id,role_id,scope_class=
   role_private. P3A scope_id is this value (fits its frozen identifier alphabet).
   No producer-selected binding/scope stamp. New writes ONLY own role_private;
   no creation of shared/handoff/legacy scope by labels or read grants. Read RLS
   still implements all four frozen scope classes via the accepted visibility law.
4. prepare_items(rows:tuple[dict[str,object],...],*,caller,decision_receipt_id,
   import_batch_id,observed_at,key_epoch,hmac_key,known_secrets=())->tuple items.
   rows are detached authoritative P3A source payloads selected by writer, NEVER
   a public submission endpoint. Limit256 sources/128 total artifacts/1MiB input
   canonical envelope and4MiB scrubbed output, strict built-in bounded JSON.
   Validate source fields/status/count/ordinal/artifact types against frozen P3A
   output shape; source_id recomputed from sanitized preimage (remove source_id).
   Only complete produces items. pending/unsupported/failed remain accounted and
   are not promoted or dropped; pending retry text remains pending in P3A.
5. Re-scrub every new durable textual surface in memory before canonical SQL:
   caller/receipt/batch/time metadata, source descriptions, structured artifact
   keys/values decoded BEFORE serialization, graph metadata and canonical content.
   Routing/control changes fail closed. Use accepted scrub_payload, not regex
   substitute. Text/fixture opaque payload remains literal scrub profile; Python/
   civic JSON stays decoded until scrub then canonicalized once. Raw source hashes
   never restored. No key persistence. If canonical re-scrub changes source text
   under current key/known secrets, derive new IDs from sanitized output; verify
   original P3A identity before mutation, never use a stale post-scrub fingerprint.
6. All emitted ShardV2 are constructed by server and decoded with accepted
   decode_v2, not supplied labels: tier unverified_candidate, authority Summary,
   effective_score0.20, active/valid, empty lineage and no receipt proof. Kind
   Reference for text_chunk/python_symbol; Episodic for civic/fixture_candidate.
   No Repulsive/Causal/high-tier promotion, verified outcome or parent trust.
   Requests for high trust or unresolved external references have no positive
   route; no allowlist/proof is invented. Existing producer auth hold remains.
7. Plane B uses existing keon_cortex.shards and existing ShardRecord schema1.1,
   never replaces legacy payload schema. Content is sanitized artifact text,
   source='ccm.'+artifact.kind, memory_type='artifact_link' for Reference else
   'observation', mode episodic. ID uses EXACT make_scoped_candidate_shard_id
   with caller role/profile,role_private,content,source,extractor_version='v1'.
   provenance.extra carries exact existing scope stamp and additive ccm_v2
   canonical ShardV2 dict plus admission metadata; wire provenance.extra itself
   stays empty as accepted ShardV2 requires. ReceiptRef=None, no claimed proof.
   Existing deserialize_record, record_scope and verify_record_identity MUST
   read/replay written records; no v1 identity recipe change. Candidate wire
   admitted property remains false; canonical persistence is not receipt admission.
8. Plane A node kinds: symbol for python_symbol; chat_episode for fixture_candidate;
   doc_section for text_chunk/civic. All other kinds preserved in frozen DDL.
   logical_artifact_id = make_v2_entity_id with entity_type=ccm_artifact_logical,
   schema_version=1.0,tenant_id,binding_id,source_key,format,artifact_ordinal.
   content_hash/content_version = SHA256 sanitized artifact text bytes. node_id=
   'art_'+node_kind+'_'+make_v2_entity_id of entity_type=artifact_node,
   schema_version=1.0,tenant_id,binding_id,node_kind,logical_artifact_id,
   content_version. URI='urn:ccm:'+logical_artifact_id; title sanitized source key;
   unsupported original repo/commit/file/line provenance is null, not invented.
   metadata_json stores sanitized source_id/kind/span bytes only. Version IDs and
   logical IDs remain distinct; no symbol-content-change SLO/proof is claimed.
9. Each item has DOCUMENTS edge node->shard, source_kind=artifact_node,target_kind=
   shard. Preserve EXACT edge_+SHA256 ASCII-safe sorted compact JSON of tenant_id,
   source_id,source_kind,target_id,target_kind,edge_kind,valid_from. No extra fields
   in preimage. Preserve input UTC wire spelling in a new additive implementation
   column valid_from_wire, checked equal to valid_from timestamp; immutable. This
   retains frozen Z/+00:00/fraction recipes without guessing lost timestamp spelling
   from timestamptz. Observed_at explicit accepted UTC <=6 fractional digits.
   Endpoint registry artifact logical/version/start/end agrees with artifact row;
   shard registry uses shard_id as logical_id, SHA256 canonical stored payload as
   content_version, start from record.created_at, binding from stamped scope.
   New edge start must be within BOTH endpoint intervals (later start if dedup
   references older/newer existing first-write; preserve exact chosen wire spelling).
10. ccm_graph_schema exposes GRAPH_SCHEMA_SQL implementing all FIVE amended P1A
    graph tables from ccm-memory-graph-v2.md verbatim (only IF NOT EXISTS and the
    additive valid_from_wire implementation column may differ). Preserve checks,
    domains, typed composite deferred FKs, receipt subtype, immutability, temporal
    half-open intervals and replacements. No substitute reduced graph schema.
11. Actual deferred constraint triggers on nodes,edges,registry AND registered
    authoritative shard changes enforce: exact authoritative backing, tenant/kind/
    identity/binding/logical/version/interval equality; edge ID recompute from
    exact stored wire string; edge interval contained in both endpoints; endpoint
    closure must close affected edges in same transaction; replacements different
    compatible kind/logical/binding version, oldend=newstart, acyclic chains.
    Registered shard backing uses EXISTING shards payload plus scope stamp/v2
    metadata, not a second copy authority. Receipt and role_generation endpoints
    currently lack qualified authoritative adapters: FAIL COMMIT unconditionally
    for those kinds, receipt subtype cannot launder pointers. Positive coverage0.
12. Immutable scope stamps/endpoint IDs/binding/logical/content/payload/start time;
    no ordinary deletes/reopen/retarget. Only open-end->one finite end and once-only
    replacement allowed on nodes/registry/edges. Authoritative registered shards
    reject changed payload/deletion (identical upsert allowed). Unregistered legacy
    shards remain behaviorally unchanged. No purged row clearing implemented here;
    governed deletion adapter remains held. DB temporal checks lock relevant rows
    to serialize concurrent closure/insertion, preventing write skew. Prevent graph
    direct deletion/history bypass via triggers even by owner (superuser can disable
    triggers, explicitly outside threat boundary). SQL helpers must be schema-
    qualified, fixed search_path; no SQL interpolation of supplied identifiers.
13. ENABLE and FORCE RLS on all five graph tables. Revoke ALL from PUBLIC; no
    grants/roles/cluster config created by initialization. Trusted schema operator
    alone grants private service DB principal rights; no untrusted SQL client uses
    that principal. Policies default deny without per-transaction trusted context.
    Table owner MUST also be constrained (test non-superuser owner with FORCE).
    Use transaction-local tenant/profile/role/effective-scope/operator-profile
    settings bound by adapter from validated CallerScope, never candidate metadata.
    SELECT of bindings,registry,nodes,edges,receipt subtype follows exact existing
    is_record_visible law for each stamp, including own-role handoff and operator-
    only legacy. Edges visible only when edge AND BOTH endpoints visible. Mutation
    additionally requires adapter-set trusted write context and only own-role
    private bindings; SELECT grants do not authorize writes. No change to existing
    shards RLS/config or live API. App principal is trusted operator configuration,
    context settings are not a replacement for Gateway authentication.
14. PostgresCanonicalWriter(pool), initialize(): explicit transaction install
    additive GRAPH_SCHEMA_SQL after existing canonical/P3A initialization. May
    inspect required tables, fail safely if absent; no external DB discovery.
    async enqueue(sources,batch,*,caller,decision_receipt_id,import_batch_id,
    key_epoch,hmac_key,known_secrets=())->str binds P3A scope via scope_binding and
    delegates accepted PostgresIngestionStore.enqueue. All caller/control text
    scrubbed+unchanged BEFORE any pool acquisition; no forged prepared bundle.
15. async write(lease:IngestionLease,*,caller,decision_receipt_id,observed_at,
    key_epoch,hmac_key,known_secrets=())->CanonicalWriteResult(status,shard_ids,
    node_ids,edge_ids,pending_count). status committed/unavailable; tuple IDs.
    Validate exact types/bounds/context and stage lease binding BEFORE acquisition.
    One transaction, shared P3A tenant advisory lock FIRST, then batch/outbox/source
    row locks and configured RLS context. Require current open batch, exact unexpired
    leased owner/generation with attempts<=5. Missing/stale/invisible/fenced returns
    non-disclosing unavailable and no writes. Never adopt producer scope.
16. Select all source rows bounded256/4MiB and verify entire stored batch payload
    hash, source rows equal batch sources, source_ids/counters/ordinals; tampering
    fails closed. prepare_items only from this independently loaded state. Commit
    new binding, existing-store shard writes, existing PostgresRecordStore.append_all
    Observation events, graph nodes/registry/edges and P3A source publication/outbox
    processed in SAME connection/transaction. No generic nontransactional fallback.
    Recheck unexpired current lease at final acknowledgement or rollback all changes.
    Never acknowledge before all deferred constraints pass. Pending remains pending.
17. Observation uses existing make_event_with_hash; id=canonical_hash({v:1,kind:
    'Observation',shard_id}), correlation_id=shard_id, explicit observed_at, actor
    from caller, receipt_id audit pointer. payload_hash canonical_hash({v:1,
    shard_id,received_at:observed_at,receipt_id}). No Action/approval fabrication.
    New canonical shard and Observation must always be atomic; first-write metadata
    is preserved. Existing same ID must independently replay and contain matching
    scoped content/source/ccm_v2 low-tier canonical metadata; otherwise unavailable/
    conflict, never overwrite/upgrade existing records. Duplicate across batches
    retains first shard provenance/time and one Observation; new node associations
    may be added with valid temporal edges without rewriting old shard refs.
18. Initialize and writer errors are closed and raised outside original handlers;
    cancellation rolls transaction back. No raw logs/traceback repr/payload errors.
    No storage of keys/raw credentials; SQL parameters boundary test with planted
    secrets in metadata, Unicode/escaped structured artifacts and context IDs.
19. Ordinary CI: deterministic pure/input/privacy/identity tests, no network or DB
    requirement. Actual PG integration opts in via CCM_CANONICAL_TEST_DSN; absent
    -> explicit skips. Parent MUST execute against isolated synthetic PostgreSQL16,
    with existing canonical/P3A schema installed, non-superuser role fixture for
    actual FORCE RLS (not falsely covered by superuser connections). Verify:
    enqueue->lease->write->existingstore read/identity + graph/spine/outbox in one
    committed chain, close/reopen persistence, duplicate firstwins, pending retained,
    every intermediate failure/cancellation rollback, stale/expired/fence races,
    scoped substitutions, raw producer tier/receipt/ref non-promotion, authoritative
    registry drift/orphans/kind mismatches, exact edge identity and interval closure,
    immutablehistory/delete/replacement/cycle constraints, concurrent edge insertion
    vs endpointclosure, all four RLS scope-law cases, malformed/no-context denial,
    SELECT-only grants cannot write. Include frozen P1A edge/scoped identity vectors.
20. All452prior tracked files and3954PASS151skip dispositions retained. Formatting,
    type check, full suite, two fresh independent architecture/security reviews,
   16exact-head source checks and exact merged-main CI/deployment before acceptance.
    Report source/image/environment/coverage limits. Unverified low-tier ordinary
    persistence only; no fullP3/bulkimport/realcorpus/graphread readiness claim.

## Allowed Files

- src/keon/cortex/pipeline/ccm_admission.py
- src/keon/cortex/providers/postgres/ccm_graph_schema.py
- src/keon/cortex/providers/postgres/ccm_canonical.py
- tests/test_ccm_admission.py
- tests/test_ccm_canonical_postgres.py
- docs/specs/ccm-canonical-writers-v1.md

## Verification

Parent inspects proposals without executing; fixed per-file paths, no worker tools
or secrets. Restricted no-network test image and separate isolated internal-network
PostgreSQL16 actual tests, synthetic disposable data only, bounded resources and
owned unique containers/network, all absence confirmed. Per-repair test-count and
immutable source-pin tripwires. Reviewer never fixes; disagreements reproduced.
Step0 flags and exact Gate2 before source. Finite budgets, no transport retry or
fallback, preserve every failed/uncertain reservation. Code/DB effects are parent-
controlled trusted orchestration only, no delegated shell/private-Pi route.

## Binding Step0 Dispositions

F01-NORMATIVE-DEPENDENCIES: supply exact pinned accepted modules and P1A vectors
with each relevant slice. Their source pins are all452baseentries, no substitute
APIs. Five candidate source/test files, sixthdoc parent-owned. Caller grantset
max256, every grant exactstr<=256bytes; all context primitives validate before
calling accepted carriage functions. Set ShardRecord.created_at AND updated_at
explicitly to observed_at, provenance.timestamp likewise; no default host clock.

F02-SHARED-TRANSACTION-SEAM: accepted PostgresDocumentStore.upsert(record,
connection=connection) and PostgresRecordStore.append_all(events,
connection=connection) participate without acquiring/committing. Accepted P3A has
NO connection-bound complete(), so do NOT call that method inside this transaction.
Use its existing parameterized final UPDATE predicate directly on the SAME owned
connection. Pin/reuse accepted _lock tenant key and lease grammar. Writer owns
acquire/transaction/commit; no fallback to pool-level stores or nested owners.

F03-SHARD-INTERVAL-CONTRADICTION: shard authoritative interval projects exact
stored payload.created_at and NULL end. Registered shards are immutable here;
any registry shard-end closure fails. Artifact endpoints may close with matching
node/end/edges under the frozen graph contract. No invented shard closure field.

F04-DEDUP-TIME-IDENTITY: preserve first-write nodes as well as shards, independently
verify existing logical/binding/version/content. Existing edge found for exact
tenant/sourcekind/sourceid/targetkind/targetid/edgekind is kept with its ORIGINAL
stored valid_from_wire and verified ID, never reconstructed. For a genuinely new
edge, start=max(requested observed_at,authoritative node start,shard start). On tie
prefer exact requested observed_at spelling; otherwise use shard.created_at exact
string if that wins, else format winning node timestamp UTC ISO with seconds plus
trimmed fractional microseconds and Z. Persist that NEW spelling, then hash it.
Both endpoint intervals must be open for new canonical admission in this parcel;
closed endpoints return unavailable, not reopened. General deferred constraints
still support valid finite intervals/supersession; no public supersession worker.

F05-P3A-SCRUB-IDENTITY-LIFECYCLE: verify original staged rows, sourceIDs and hashed
batch envelope BEFORE canonical transformation. Preserve all original P3A PKs,
payloads, IDs, hashes and extraction statuses. Only publication state/outbox lease
metadata changes on successful acknowledgement. New canonical sanitized IDs may
differ; never write them back into staging. Stored source identity verification
uses exact accepted P3A source preimage, excluding source_id itself. Audit/binding
IDs scrubbed to different text reject rather than silently retarget pointers.

F06-BOUNDED-VALIDATION: exact JSON depth<=32,totalnodes<=20000,strings/totalUTF8text
<=1MiB before serialization, finite floats, intbit_length<=13607, cycles/custom
hooks rejected. Pure 1MiB limit measures canonical_json of complete admission
envelope (callercontext,rows,batch/time); output4MiB measures final canonical
bundle JSON. Raw DB loads: use server CASE/length guards to return no payload
when serialized batch/sourceaggregate exceeds4MiB; limit257rows then reject>256,
never silently truncate. Reject oversize BEFORE client JSON decode. For loaded
stage rows, validation/scrub occurs after bounded read but before canonical SQL;
caller metadata validation/scrub occurs BEFORE acquiring any connection.

F07-DEFERRED-CHECKS-ACKNOWLEDGEMENT: write all canonical rows; SET CONSTRAINTS ALL
IMMEDIATE; then recheck locked current batch/lease owner/generation/open state and
clock_timestamp()<expires_at in the final acknowledgement UPDATE. Ack/publication
and canonical effects commit together; any later error rolls all back. Return
committed only after transaction exits successfully. This is not a remote deadline
or a claim to test wallclock expiry exactly at commit publication.

F08-RLS-INTEGRITY-LOCKING: initialization is privileged trusted schema-operator
work, not an app method invoked at startup. Integrity TRIGGER functions only are
SECURITY DEFINER, fixed search_path=pg_catalog,keon_cortex, owned by that existing
bootstrap role with BYPASSRLS/superuser capability. No role creation/alter/grants
by code. Revoke PUBLIC execute on integrity functions. They inspect/lock backing
rows across visibility without returning hidden values; all errors fixed text.
Application principal has NO BYPASSRLS/superuser and cannot own those functions.
Actual tests transfer the five graph TABLES to a non-superuser owner while
integrity functions stay bootstrap-owned, proving FORCE RLS applies even to the
table owner. Policy helpers are invoker pure predicates: binding policy uses
stamp->context only; registry/node/subtype policies join visible bindings;
edge SELECT joins visible binding AND both visible endpoints. No policy recursion.
All five graph tables acquire one fixed namespaced transaction-level advisory
lock in BEFORE STATEMENT mutation triggers, BEFORE row locks, to serialize graph
closure/insertion even for direct trusted SQL. Writer lock order: P3A tenant lock,
then graph advisory lock, then endpoint/edge keys sorted. Registered shard payload
changes/deletes reject unconditionally; identical upsert is allowed. Unregistered
legacy shard semantics are untouched. After locks, VOLATILE definer checks read
fresh backing/interval state. This conservative serialization is NOT a throughput
qualification; no SLO claimed. No blanket app RLS bypass or public DB principal.

F09-SQL-IDENTITY-PREREQUISITES: PostgreSQL16 built-in sha256(bytea),encode,
convert_to and jsonb primitives only; parent checks actual installed binary
before source, never installs pgcrypto/otherextensions. SQL canonicalization must
recursively produce Python core canonical_json equivalence: sortedASCIIkeys,
compact separators, json escaping including nonASCII/surrogates and controls.
Numbers in authoritative shard canonical payload must retain Python JSON numeric
spelling; if SQLjsonb cannot reproduce a numeric literal faithfully, retain exact
canonical payload text as an additive column on NEW graph registry entries for
version checks (not on legacy shards), validate decoded equality against actual
authoritative JSONB, and hash retained exact bytes. This is implementation identity
metadata, never new payload authority. Registry TEXT pin must be immutable and
its decoded value must match current shards.payload; no arbitrary asserted hash.
Similarly valid_from_wire is immutable implementation metadata equality-checked
against timestamp. Freeze exact allowed SQL additions in Gate2 after this flag.

F10-ERROR-AND-RESULT-CONTRACT: result lives in pure slice, frozen slots reprFalse,
status committed/unavailable, shard_ids/node_ids/edge_ids exacttuples of strings,
pending_count exactint>=0. unavailable contains empty IDs and count0. Invalid
supplied types/context -> invalid_input, bounds -> resource_limit, scrub/control
failure -> scrub_failed before canonical persistence. Missing/stale/invisible/
fenced/tampered loaded state -> unavailable without distinct disclosure. Existing
sameidentity contradictory canonical data -> conflict, no overwrite. Unexpected
DB/serialization error -> storage_failure; original exception discarded before
new sanitized raise. Cancellation propagates. No claim that Python traceback
frame locals can never hold transient input; no raw logging is implemented.

F11-ACCEPTANCE-GATE: initial ready=false and all11flags remain historical evidence.
Resolving preparation is not execution evidence. Full actualPG, non-superuser
owner/RLS, concurrency/constraints, immutablebaseline,2freshreviews and exacthead/
mergedmain green chain are mandatory before acceptance. No hightrustpositive
producer/receipt/rolegeneration backing invented; fullP3/goal gates unchanged.

### Exact dispatch choices

Actual isolated PostgreSQL16.15 preflight PASS: built-in sha256 byte hash matches
independent Python SHA256; JSONB retains fixed canonical 0.0/1.0/0.2 spellings;
bootstrap role has existing bypass capability, no privilege changed. This covers
only disposable local image, not a target production account qualification.
NO additional registry payload-text column is selected. SQL canonical JSON
recurses strings/objects/lists, preserves numeric text for the restricted emitted
ShardRecord domain (only fixed defaults0.5/0.0/1.0/effective0.2 and bounded integers).
Arbitrary source numbers are inside TEXT content, never projected as free payload
numeric metadata. No claim of canonical numeric equivalence outside this domain.
Graph DDL additions remain ONLY IF NOT EXISTS and edge.valid_from_wire; helper
functions/triggers/policies are the required implementation, not table redesign.

Pure API choices: TrustedContext(caller:CallerScope,decision_receipt_id:str),
validate_context(caller,decision_receipt_id)->TrustedContext, scope_binding(caller)
->str. CanonicalItem(node:dict[str,object],shard:ShardRecord,event:ISpineEvent,
edge:dict[str,object]); CanonicalWriteResult(status:str,shard_ids:tuple[str,...],
node_ids:tuple[str,...],edge_ids:tuple[str,...],pending_count:int). DTOs frozen slots
reprFalse. Result IDs unique sorted; item tuple source/ordinal order. node/edge
dicts use exact frozen SQL names, times as UTC strings, metadata_json exactdict;
actual asyncpg TIMESTAMPTZ parameters use datetime or explicit text::timestamptz
casts, not implicit driver coercion. No new callback or capability interface.
Parent-owned docs are the exact frozen workorder body. Output code-only per fixed
file; schema slice must use ONE literal GRAPH_SCHEMA_SQL constant, not generated
unreviewable dynamic SQL. No placeholder functions/pass stubs in production.

## Out of Scope

Live Gateway/API wiring, actual high-trust producer qualification, receipt/role-
generation backing adapters, general lineage-derived/Repulsive/corroborated trust
admission, temporal supersession worker/API, graph read/traversal/cursors, embedding,
governed shred/retract and crypto-key destruction, real data/import, full-goal exit.
These boundaries do not waive remaining frozen contracts or justify default trust.

## Context & References

Accepted P1A docs/specs/ccm-memory-graph-v2.md including COMPLETE amended graph DDL,
required mechanisms/visibility/identity and S01-S12; accepted ShardV2 DTOs and v1
scoped identity fixtures. Existing core/models,spine/postgres_record_store and
providers/postgres/document_store. Accepted PR101 P3A plus PR100 engine. Standing
constraints and charter/loop apply, sole coordinator unchanged. No Gate1 design or
exit changes; parcel builds a bounded low-trust subset with explicit held routes.
