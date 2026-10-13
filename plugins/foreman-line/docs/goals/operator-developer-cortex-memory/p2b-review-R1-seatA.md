# p2b-review-R1-seatA — route `anthropic/claude-fable-5`, dispatched by coordinator `01a131a9`

---

## VERDICT: APPROVE

## TEST RUN
```
cd D:/Repos/opmem-worktrees/cortex-p2b
.venv/Scripts/python.exe -m pytest -q -p no:cacheprovider
  -> 2225 passed, 118 skipped, 2 warnings in 46.83s        (matches reported head; base 2153/114)

KEON_TEST_DATABASE_URL=postgresql://postgres:opmem@127.0.0.1:55432/cortex \
  .venv/Scripts/python.exe -m pytest tests/test_recall_postgres.py tests/test_postgres_roundtrip.py -q -p no:cacheprovider
  -> 8 passed, 1 warning in 2.79s                          (temporary DB per run; no DDL against `cortex`)

Adversarial probes ($TMPDIR/p2b_probe/probe1.py, in-memory app via TestClient, throw-away):
  P1 revoked grant + same op/fingerprint retry -> 409 selection_no_longer_authorized (fail closed, never shrunk)
  P2 cross-actor identical tuple -> same recall_event_id, replayed:true, no duplicate event/access
  P3 replayed delivery after tamper removal -> verification_meta.excluded reports anchored count (1), not current (0)
  P4/P6 different query / different limit, same content set -> same event, replayed:true (per §3 content-set identity)
  P5 changed fingerprint + revoked visibility -> 409 fingerprint conflict (binding check precedes reload; correct precedence)
```
Allowed-files audit: `git diff --stat ac05fdd..HEAD` touches exactly the Allowed Files + the two S0-1-approved NEW files (`shard_plane.py`, `postgres_record_store.py`); `tests/test_shards_v1_1.py` edit is a mechanical route-table fixture update (expected POST path list + comment only). Hunt sweep: `/v1/shards/search` produces no event/access/spine rows (tested + diff shows only scoring refactor); existing `RecallService` untouched (pure addition below it); `gravity_score`/`gravity_version` null and gravity never gates (tested, incl. pinned max-weight non-candidate); operation/session header validation matches T-35/T-36 (fullmatch, 1–128 alphabet; absent op/session ⇒ 400, malformed session ⇒ 403 per S0-3); concurrent identical retries and concurrent distinct ops converge on exactly one event (8-way async tests + PG conflict/rollback test); PG first-delivery commit is one transaction (event + access + binding + spine via `append_all(connection=...)`); DDL additive with `UNIQUE (tenant_id, delivery_key)`, binding PK, access PK + FK; restart recovery tested in both modes; `recall_event_id` is a sha256 of a tenant/scope-qualified delivery key with no HTTP surface accepting event ids, so prediction yields no read capability.

## FINDINGS

### F-1 [minor] `verification_meta.excluded` on replayed deliveries reports the anchored pass, not the current one
- Where: `src/keon/cortex/spine/recall_events.py` `RecallEngine.recall` steps 1/3 (returns `event.excluded_count`); route response in `api.py`.
- Evidence: probe P3 — first delivery with a tampered co-candidate records `excluded: 1`; after the tampered row is removed, a re-render (new op, same content set) replays and still reports `excluded: 1` though the current verification pass excluded 0. The inverse (0 anchored, >0 now) also holds for non-selected records.
- Why it matters: hunt item 3 asks whether `excluded` is honest. No integrity hole — delivered results are always verified in the current pass (delivery-key equality forces the selected set through verification; the binding path re-verifies per record) — but the label describes a different pass than the one that produced this response, which could mislead accounting consumers auditing exclusion counts.
- Required disposition: informational (coordinator may choose to carry a labeling clarification forward to P3).

### F-2 [minor] In-memory first-delivery commit appends spine events outside the atomic section
- Where: `src/keon/cortex/spine/recall_events.py` `InMemoryRecallStore.commit_first_delivery` (spine appends after lock release).
- Evidence: event/access/binding are inserted under the lock; `self._spine.append(...)` runs afterwards. A concurrent reader can transiently observe the recall event without its spine history; a (today unreachable — `make_event_with_hash` guarantees hash validity and `InMemoryRecordStore.append` is idempotent) append failure would persist the event permanently without spine rows, with no repair path since replays never re-append.
- Why it matters: `storage_mode="memory"` is a selectable app mode, not test-only; ruling 5/7 atomicity is only fully honored by the PG store. The gap is openly documented in the class docstring and practically unreachable.
- Required disposition: informational.

### F-3 [info] New `PostgresRecordStore.get` / `get_by_correlation` are not tenant-scoped
- Where: `src/keon/cortex/spine/postgres_record_store.py` (queries filter on `event_id` / `correlation_id` only).
- Evidence: deliberate mirror of `InMemoryRecordStore` (documented); `correlation_id` carries shard ids (S0-2), rows contain only hashes (`payload_hash`, `content_hash`) plus actor/occurred_at.
- Why it matters: no HTTP surface exposes these reads today, so no served leakage; but P3's gravity `HistoryView.events_for(memory_id)` is specified as `get_by_correlation(shard_id)` — if P3 serves projections per tenant it must add tenant scoping or a co-tenant-colliding correlation read becomes a cross-tenant history channel.
- Required disposition: carry-forward to P3.

### F-4 [info] Candidate selection bounded by `list_by_tenant(limit=1000)`
- Where: `src/keon/cortex/spine/recall_service.py` `ShardRecallService.select`.
- Evidence: at most the first 1000 tenant records are considered; records beyond the bound silently never become candidates and are not counted in `verification_meta.excluded`; candidate membership then depends on store enumeration order.
- Why it matters: intentional parity with `/v1/shards/search` (commented), but at scale it quietly shapes delivery identity (content_set_hash) without any truncation signal.
- Required disposition: carry-forward to the parcel that owns retrieval scaling (P3+).

### F-5 [info] Actor is not a delivery-key component; event `query_hash` records only the first delivering query
- Where: `recall_events.py` `delivery_key(...)` / `RecallEvent.query_hash`; probes P2/P4/P6.
- Evidence: a second actor with identical role/profile/session/task and content set receives the first actor's `recall_event_id`/`first_delivered_at` (replayed, binding-only — no duplicate accounting); a different query or limit resolving to the same content set likewise replays, so the event's `query_hash` reflects only the first query (later queries survive only in binding fingerprints).
- Why it matters: both behaviors exactly match ruling 4's component list and §3 content-set identity (verified: all eight tuple components tested individually), so this is conformant — recorded so accounting consumers know `actor_id`/`query_hash` on an event identify the *first* delivery only.
- Required disposition: informational.
