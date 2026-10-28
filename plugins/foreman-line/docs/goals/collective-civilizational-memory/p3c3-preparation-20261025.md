# P3C3 preparation — protected terminal state and read/replay boundary

Coordinator: `01a173be-ccaf-704b-9f61-858f7a129595`, resumed by the owner at
accepted P3C2's Stage-F boundary. This is reversible planning, not an approved
workorder, source dispatch, deletion executor, or full P3C acceptance.

## Source and instruction reconciliation

- Accepted merge/base: `a96cc851aad6f98b8dc4695ddd0e7c4c15e18175`.
- Read-only source: `D:/Repos/ccm-worktrees/cortex-p3c2-authority-copies`, clean,
  with `origin/main` at that accepted merge. Do not change this accepted branch.
- Its Git common directory is `D:/Repos/ccm-cortex-readiness-20261023/.git`;
  the ambient Cortex checkout belongs to a different, stale/dirty Git tree.
  Do not repair, pull, reset or build in the ambient tree.
- The delegated AGENTS path under `keon-omega/keon-systems-web` no longer has
  AGENTS.md. The relocated `D:/Repos/keon-army/keon-systems-web/AGENTS.md` was
  read as the available standard; no repository instruction file was changed.
- `rtk` is unavailable in this bash host. Raw read-only commands were used after
  its command-not-found result. `python` is absent; installed `py -3.13` works.
  No tool/package installation or credential environment dump occurred.
- Historical accepted results are 5,187 PASS / 248 SKIP and 466 tracked entries;
  these have NOT been rerun in this preparation session.

## Actual reader and replay inventory — initial source inspection

Paths below are relative to the accepted Cortex source. This is an initial
inventory, not proof that every external copy/reader has been enumerated.

| Path / anchors | Observed boundary | Required next disposition |
|---|---|---|
| `src/keon/cortex/providers/postgres/document_store.py`: `get`, `list_by_tenant`, `count`, `upsert`, `delete` | Payload read/deserialization and SQL count have no deletion-state join. List LIMIT/OFFSET is in SQL. Upsert can replace ordinary unregistered rows; registered rows depend on graph triggers. | Authoritative fence exclusion before deserialization, SQL pagination/counts and identity checks. Durable refusal of target ID recreation, not merely a Python post-filter. |
| `src/keon/cortex/spine/recall_service.py`: `select`, `reload_selection` | Scan count increments before visibility/identity checks; identity precedes relevance/gravity. Reload checks current store presence and identity. | Filter fenced/pending records at the authoritative read before scan budget/identity/metrics and before ranking; recheck bound selection. A tombstone must not count as corruption. |
| `src/keon/cortex/services/query.py`: `search`, `get_shard`, `list_shards`, `count`, `find_by_receipt_id`, `find_by_policy_hash` | Vector provider ranks/limits before authoritative lookup. Returned hit carries provider payload. Get/list/count delegate to store. Upsert queues copies of embedding/content into vector outbox or indexes inline. | Post-ranking lookup alone cannot prove eligibility-before-ranking or complete vector cleanup. Inventory vector/outbox copies separately; no claim that a store filter qualifies vector top-k or removes stale payloads. |
| `src/keon/cortex/api.py`: direct shard/lineage/evidence reads, ingest replay lookup, tenant list | Direct `store.get`/`list_by_tenant` consumers bypass QueryService but use the store. | Include actual served route tests. Store-level gate may cover document reads; HTTP replay and stale reservation semantics still need separate closure. No public deletion route is authorized. |
| `src/keon/cortex/services/curation.py`, `services/memory_events.py`, `spine/recall_events.py` | Existing direct document lookups and bound selections; other persisted payload/evidence stores exist. | Enumerate retention/copy relationships; do not clear unrelated audit subsystems or assume store absence erases event history. |
| `src/keon/cortex/providers/postgres/ccm_graph_schema.py`: `ccm_graph_immutable`, `ccm_shard_immutable`, `ccm_graph_check` | Registered shard mutation/delete rejects. Registry/node/edge identity and interval checks are deferred; canonical backing assumes active/valid empty lineage and recomputes content hash. | Narrow protected terminal transition must be designed before code, preserving immutable identity and historical references. Never disable triggers, repurpose a caller GUC as purge authority, or hash empty content under the old ID. |
| `src/keon/cortex/providers/postgres/ccm_canonical.py`: `_write_locked`, `_check_duplicate` | Tenant then graph lock, batch/outbox state, duplicate comparison, membership and final ACK are on owning connection. | Target and batch fence checks must share this lock/transaction order and survive delayed/replayed duplicates. |
| `src/keon/cortex/providers/postgres/ccm_ingestion.py`: `enqueue`, `lease`, `_finish`, `pending`, `fence` | Batch fence changes batch/outbox states; it does not remove batch/source payloads. Pending contains retry source. | Future retract must clear exact staged copies and fence replay/lease completion atomically; ordinary `fence` is not erasure. |
| `src/keon/cortex/providers/postgres/ccm_copy_tracking.py` | Exact immutable source/artifact occurrence memberships and explicit markers; absence of old marker is unreconciled. | Use exact shared associations, never first-wins provenance or absent-marker-as-empty inference. Structural membership is not independent content or external coverage proof. |
| `src/keon/cortex_governed/ccm_deletion_authorization.py` | Protected signed-current-state authorizer; default issuers empty. Entry/normal-exit samples; lock rows until transaction ends. | OSS must not import governed. Trusted effect owner must compose authorization inside its owning transaction. A copied metadata DTO or receipt string cannot admit a transition. Runtime/provisioner and arbitrary later-commit expiry remain unqualified. |
| memory/Mongo document providers, Qdrant/memory vector providers, sidecar, benchmarks, backups/replicas/exports | Alternate persistence/derivative paths are present or external to this subset. | No production deletion/readiness claim for unmodified adapters. Identify actual configured topology before claiming physical erasure or global reader coverage. |

## Frozen obligations and proposed shaping question

Accepted P1A permits governed payload purge retaining a non-content terminal
fence; it does not permit ID reuse, trigger bypass, or non-authoritative state
labels. S04 partial/all-parent rules and bounded depth-three reverse traversal
remain required. Current canonical admission does not admit production nonempty
lineage, so positive synthetic lineage fixtures must not be described as a
qualified production lineage producer.

Ask one fresh tools-free shaper for the smallest safe dependency sequence and
exact proposed files, authority/lock/privilege boundary and failure tests. It
must explicitly decide whether terminal-state backing can land inert first, or
requires inseparable read/replay wiring; no intermediate parcel may enable live
purge while its reads or replay gates are incomplete. Recommendation only: all
factual claims must be linted on disk, then exact draft/schema/Step0/Gate2, new
branch/worktree, two independent risk reviews and green-chain acceptance.
A genuine frozen-contract/locked-decision change remains a human stop gate.

## Finite preparation envelope

Fresh 15:52UTC account/catalog/foreign/day/effort metadata preflight PASS:
balance9,107.0; prior future exposure7,225.37; floor1,000; available881.63.
Keep84.7 unattributed balance decrease as additional day/effort guard. Candidate
preparation200 credits fits without raising limits: day2,973.85075/4,000,
effort18,126.37/20,000 including full preparation cap and decrease guard.
Expiry2026-10-26T04:00:00Z. No completed/failed/unknown booking is released.
At most ONE tools-free supplied-source shaping POST, exact Sol/low, <=4,000
output tokens, <=192KiB serialized body, <=200 conservative credits; no retry,
source output, fallback, native shell worker or held-route release. Parent must
perform the fresh incident-value equality guard before sending. Prior private
source-only route is retained; no new provider/privacy qualification claimed.
A full implementation/repair/two-review cycle is NOT funded or admitted by this
preparation envelope. Refresh and bound it separately after shape and packet sizing.

No real data/key deletion, production effect, adapter qualification, full Context
or bulk-import readiness is claimed. No new monitor/schedule or foreign ledger
mutation. No source tests, independent review or Gate2 have yet been run here.
