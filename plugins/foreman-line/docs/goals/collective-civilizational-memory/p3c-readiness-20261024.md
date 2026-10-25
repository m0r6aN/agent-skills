# P3C governed deletion/retraction preparation — 2026-10-24 New York

Custodian remains ccm-coordinator-20261020-fresh-01. Direct owner instruction:
“Brother, proceed with the next Context parcel: governed deletion/retraction and
minimal descendant invalidation. Keep all reservations and affected routes held,
and use the cheapest capable approved route under my existing authority.”

Latest disposition: owner clarified that the existing10164 credit balance is
already available. Receipt-level reconciliation identified1906.3 reported
completed-request expense inside the cumulative8926.999375 historical book.
Classify that amount as historical spending rather than additional future
exposure, retaining all estimate excess, failed/unknown/explicit/covered bookings
and the entire unclassified remainder. Future exposure reserve7020.699375;
at fresh observed10164.1, headroom above reserve/floor is2143.400625. No top-up
required for finite2000 phase. Historical expense/day/effort records unchanged;
no billing-settlement claim and no failed/uncertain reservation released.
See evidence/p3c-exposure-reconciliation-20261024.json for pinned per-receipt proof.
Standing authority records finite day16000/effort20000, expiryOct25 04UTC and
unchanged1000 floor. Step0 supplied-artifact request admitted after fresh account,
catalog/foreign/no-incident-key-equality guards. No source dispatch yet.

Prior local preparation status follows; funding-hold text below is superseded
only by the exact expense/exposure reconciliation above.

Status: local source/contract investigation and draft boundary preparation only.
Not a frozen dispatch specification, Gate2, independent review, implementation,
real-data deletion authority, or accepted P3 completion. P3B remains accepted.
No new inference, model probe, worker, monitor, source edit or database effect.

## Verified source and funds

2026-10-25T00:39:06.758092Z account metadata GET reports10164.1 credits.
All8926.999375 retained conservative reservations remain, floor1000 unchanged;
237.100625 available above both. Foreign guard1677.5<=1700, ledger SHA256
8bc0bf731db734a4b694c616e05ec61f9b7c84c79ec1e3766de401bfa4a333ed.
Private boolean/financial record: p3c-readiness-account-20261024.json in existing
protected CCM parent. No key is recorded. No inference POST was made.
Existing day/effort headroom does not independently fund a complete new phase.
Owner asked to add2500 actual GenSpark credits; no top-up assumed. Budget-ceiling
authority persists; raising ceilings alone cannot replace actual funds/floor.
New finite admission and fresh account/day/foreign guards precede dispatch.
Cheapest currently qualified private-code route remains parent-controlled
GenSpark gpt-6.1-sol, tools-free supplied artifacts, bounded context/output.
Affected/native/private-Pi and oversized-packet routes remain HELD.

Read-only origin/main resolves43323f535df458543c0161ca501f8f974650008e,
matching accepted P3B merge. P3B source worktree status is clean. Do not reuse
that accepted branch for new source. Proposed parcel identifier CCM-P3C; no
worktree or active spec has been created. Preserve458 accepted tracked entries,
4023PASS208SKIP identity correspondence; those are historical accepted results,
not a newly executed prebuild baseline.

## Binding requirements retained

Normative source: accepted docs/specs/ccm-memory-graph-v2.md, especially amended
DDL/lifecycle and frozen purge-status/1, cleanup-job/1, key-destroy-request/1 and
key-destroy-status/1; owner S03/S04/S12 in CONTEXT-SHAPING-DECISIONS.md.
Four separately observable milestones remain mandatory: authoritative fence,
derivative cleanup, key destruction, verified coverage. Overall complete requires
all four. No row clearing, absent adapter, exhausted attempt count or provider
assertion qualifies as verified cryptographic erasure.

Sole/all-parent loss => surviving child archived+contested with explicit reason;
partial loss => contested without changing archival state. Superseded requires
a real replacement. Purged remains terminal. Equal/older signals obey
last_revalidated_at; repeated signal deduplicates by tenant/signal/target.
No implicit reactivation. Pending invalidation cannot serve unqualified valid
children. P6 does not absorb this minimal Wave1 propagation obligation.

## Source investigation and copy inventory

| Surface | Observed behavior | Required disposition before acceptance |
|---|---|---|
| ccm_ingest_batches.payload | Scrubbed entire candidate envelope | Clear transactional copies; retain only non-content fence/status evidence. |
| ccm_ingest_sources.payload | Scrubbed candidate artifact and pending retry_source | Clear matching copies, including durable pending work; cannot rely on publication status. |
| ccm_ingest_outbox | Lease/generation/count/hash metadata | Fence stale lease/complete/fail/replay and preserve durable non-content result. |
| shards.payload | Canonical content, optional embedding, nested ccm_v2 content and provenance metadata | Terminal minimal scoped tombstone must remove every content-bearing copy and search projection. Preserve immutable identity without recomputing from empty content. |
| artifact_nodes | uri/title/metadata_json plus content-derived identity | Remove target content-bearing metadata through narrowly authorized purge; shared-node associations need exact membership accounting, not blanket tenant deletion. |
| graph registry/edges/bindings | Typed immutable identity/scope/interval history | Retain non-content fences; reject ordinary rewriting, deletion, reopening, ID reuse and orphaned references. |
| spine_events | Observation records hashes/receipt pointer, not original content in current writer | Preserve minimal audit; Purge delivery must be durable and externally signed only through qualified integration. |
| other schema payload tables | memory_events and curation proposal/disposition/inheritance JSONB exist | Enumerate actual copy relationships before claiming absent/not configured; do not blanket-clear unrelated subsystems. |
| derivative indexes, backups, replicas, exports, keys | Not qualified by P3A/B synthetic tests | Pinned inventory with unknown/blocked entries; never infer absence or complete coverage. |

Existing PostgresIngestionStore.fence only flips batch/outbox state: it does NOT
clear copies. Existing ccm_shard_immutable rejects any registered shard mutation;
graph checker projects active/valid empty-lineage canonical admission and NULL
shard end. Accepted contract already permits governed payload purge retaining
non-content fence, but P3B deliberately implements no such adapter. Changes must
be explicit and reviewed, not session-GUC bypasses or disabled integrity triggers.

PostgresDocumentStore.get/list_by_tenant presently return payloads without a
purge filter; recall_service verifies identity during scanning and selected-result
handling. Both served and direct reader paths must enforce authoritative fences
BEFORE identity verification; tombstones must not inflate corruption metrics.
New descendants/pending status require equivalent non-disclosing read fencing.

Existing api.py ingest requires a nonempty lexical X-Decision-Receipt-Id and
trusted Gateway carriage; P3B stores that pointer as audit context. Neither is an
independently verified operator decision bound to deletion target/effect. Reusing
either alone would violate the frozen deletion contract. No public API wiring
or new trusted positive verifier is established by this investigation.

## Draft implementation slices for a bounded worker

1. Pure protocol/state module: strict non-content request/status/job DTOs matching
   frozen field names and enums, exact target/effect/tenant/receipt/idempotency
   binding, four milestone rollup, S04 invalidation transitions and bounded retry
   arithmetic. No datastore, credentials, external effects or implicit authority.
2. PostgreSQL deletion schema/service: durable operations/jobs/coverage/fences,
   same tenant-lock THEN graph-lock order as canonical admission; transactionally
   verify current independently resolved authority, fence replay, clear copies,
   terminal tombstone and enqueue idempotent cleanup/invalidation/Purge work.
   Missing verifier/current authority MUST fail closed before irreversible writes.
   No arbitrary caller boolean/receipt label or configurable GUC is authorization.
3. Integration with canonical/staging writers, graph integrity and existing reads:
   epoch/version recheck under same authoritative lock; retain tombstone on direct
   upsert and future batch replay; pending children fenced immediately, work may
   finish durably. All ordinary immutability/visibility checks retained. Exact
   changed existing files and necessary contract amendment recorded before Gate2.
4. Deterministic/actual-PG tests and two fresh independent full risk reviews.
   Smaller packets include only pinned dependencies needed by their slice. LF
   exact bytes, complete-file output grammar, serialized body<=192KiB preflight
   BEFORE reserving/sending; no automatic retry/fallback. Synthetic data only.

This is scope preparation, not delegation or executable API signatures. Resolve
the following Step0 questions before freezing Allowed Files or dispatching code.

## Finite prerequisites to freeze

- AUTH: define narrow trusted independent verifier protocol, validation lifetime,
  transaction/expected-version binding and revocation race behavior. Qualify real
  adapter separately; tests may supply synthetic verifier but must label it.
- COPY: exact batch-to-shard membership across first-wins duplicates and multiple
  import associations; shard purge must fence all known recreation paths. Batch
  retract must not erase unrelated/shared evidence or leave another batch copy.
- GRAPH: narrow terminal tombstone exception with persisted authoritative evidence,
  graph backing checks compatible with immutable hashes/history, and matching
  closure of required edges/nodes. Preserve raw direct-SQL negative tests.
- LINEAGE: current P3B rejects nonempty lineage. Define authoritative accepted
  source for existing descendants; do not fabricate positive production lineage
  admission. Synthetic pre-existing governed fixtures can test propagation.
- READS: enumerate SQL/list/get/recall/index entry points and fence before ranking,
  pagination/count exposure and identity checks; do not advertise unmodified
  derivative consumers as qualified. Exact files become explicit Allowed Files.
- JOBS: pin numeric bounded lease/retry limits; expiration, dedup, stale version,
  crash recovery, cancellation and unknown external outcome reconciliation.
- KEY: existing Keon key/replica/backup qualification remains mandatory before
  crypto effects. No provider hunt/new key destruction capability or live effect.
  Unqualified adapters leave key/coverage and signed-delivery states blocked.
- FUNDING: refresh actual balance after top-up, finite complete-phase cap and NY
  date/effort ceilings under existing authority, retaining all old reservations.

Required acceptance evidence: independently pinned source/test baseline; exact
governance denial/no-effects cases; duplicate/conflicting target/effect keys;
crash/lease/retry/replay and both lock-race orders; full transactional rollback;
staging/pending/canonical/metadata scrubbed-copy absence; shared membership;
multi-parent and terminal-state invalidation vectors; no false identity-corruption
counts; non-superuser FORCE RLS; original immutability negatives; malformed and
oversize closed diagnostics; unknown inventory/adapter never overall complete;
two independent architecture/security reviews, then exact-head and merged-main
green chain. No new tests or checks are claimed to have run here.

Next action: reconcile funds, finish Step0 against actual code and frozen spec,
then create exact work order, own branch/worktree and bounded Gate2. No additional
owner approval is required for already-authorized non-destructive preparation.
