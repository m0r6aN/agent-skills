# p3a-review-R1-seatA — route `anthropic/claude-fable-5`, dispatched by coordinator `01a131a9`

---

## VERDICT: APPROVE-WITH-FIXES

## TEST RUN
```
.venv/Scripts/python.exe -m pytest -q -p no:cacheprovider
  → 2277 passed, 123 skipped, 2 warnings in 51.73s   (matches reported head; base 2258/120)

KEON_TEST_DATABASE_URL=postgresql://postgres:opmem@127.0.0.1:55432/cortex \
  .venv/Scripts/python.exe -m pytest tests/test_memory_events_postgres.py tests/test_recall_postgres.py tests/test_postgres_roundtrip.py -q -p no:cacheprovider
  → 13 passed, 1 warning in 4.91s   (temp DB per run; no DDL against `cortex`)

black --check / isort --check-only on all 6 changed files → clean. Worktree clean.
git diff --name-status b6e25c6..HEAD → exactly the 6 Allowed Files; gravity/* untouched; no recall-ordering/score path modified (OD-10 verified).
Throw-away probes run under %TEMP%/p3a_review_probes only.
```

## FINDINGS

### F-1 [major] Duplicate `record_ids` inside one `access` request: unflagged double access rows (in-memory) vs permanent non-retryable 500 (PG)
- Where: `src/keon/cortex/services/memory_events.py` — `AccessEventIn.record_ids` (no uniqueness validation), `MemoryEventEngine._build_rows`/`ingest` retry loop; `InMemoryMemoryEventStore.commit_first_write` (delivered pre-check only against pre-existing keys, dict overwrite within the bundle).
- Evidence: probe `record_ids=[s, s]`. In-memory: `200`, **2** `memory_events` access rows for one record, both `replay_equivalent=False`, 1 delivered row, 1 Access spine event. PG: delivered PK violates inside one transaction → `MemoryEventCommitConflict` → retry re-derives nothing (rollback) → loop exhausts → **500 "memory-event ingest failed"** (route classifies as non-retryable), identical retry also 500, nothing written.
- Why it matters: hunt 1 — an access can be counted twice in the durable audit table without the S0-3 flag; and identical valid-per-schema input diverges between the two durability modes (silent acceptance vs permanent failure), breaking the "in-memory mirrors PG semantics" discipline the parcel claims. PG at least fails closed (no fabricated rows), so not a blocker.
- Required disposition: fix in rework (reject duplicate `record_ids` with 422 at the model, matching rulings 1/5).

### F-2 [major] Repeat `access_omitted` under a new operation id silently loses its spine event (ruling 7 violated; id/content divergence)
- Where: `memory_events.py` `access_spine_event_id` (keyed `(recall_event_id, shard_id, kind)` for **both** delivery-side kinds) + `_build_rows`; in-memory `_spine_event_fully_indexed` skip and PG `_append_one` insert-or-return-existing.
- Evidence: probe — second `access_omitted` for the same record under a new op id with a *different* reason and *different* `occurred_at`: `200`, `replayed: false`, 2 `memory_events` rows, but **1** `AccessOmitted` spine event; the surviving spine event carries the first report's `occurred_at` — the second, content-distinct event never reaches spine history and nothing marks it replay-equivalent.
- Why it matters: S0-3 sanctions spine-event dedup **only** for delivered `access` (guarded by the delivered table + `replay_equivalent` flag + `replayed: true` ack). For `access_omitted` ruling 7 says every accepted event is appended to the spine; here two distinct events map to one deterministic id with differing content hashes and the loser is silently discarded in both storage modes. P3b projects from spine history, so repeated omissions (distinct reasons/times) are invisible to it, and the "deterministic content-hashed id" invariant is broken (same id, two possible contents, order-dependent survivor).
- Required disposition: fix in rework (include operation identity in the `access_omitted` spine id, or apply an explicit S0-3-style dedup with flag + `replayed: true` ack under a coordinator ruling).

### F-3 [minor] Mixed access batch acks `replayed: true` while appending new delivered rows
- Where: `memory_events.py` `MemoryEventEngine.ingest` — `replayed=bool(replay_equivalent_targets)`.
- Evidence: probe — deliver `s1` (op_a1), then `[s1, s2]` under new op: `200` with `replayed: true`, yet a **new** delivered row and a new Access spine event for `s2` were committed (delivered count 1→2).
- Why it matters: ruling 5 ties `replayed: true` to "nothing appended"; an adapter reconciling by ack (boundary §6 lost-ack rules, O-4) can misclassify a partially-new report as a no-op duplicate. Accounting itself stays correct (one delivered row per record); only the ack signal is dishonest. S0-3 ruled the all-duplicate case only.
- Required disposition: fix in rework (set `replayed` only when *all* targets are replay-equivalent, or surface per-record flags — needs a one-line coordinator ruling either way).

### F-4 [info] Consideration/application/outcome accepted for selected-but-undelivered (even `access_omitted`) records
- Where: `memory_events.py` `_verify_recall_ref` — membership checked against `selected_shard_ids`, not the delivered subset.
- Evidence: code path; ruling 2 literally requires "whose selection contains the referenced `memory_id`", which is what is encoded.
- Why it matters: compliant as ruled, but T-33 fixes metric denominators (application/non-applicability rates) to the **delivered** subset; P3b's projection must not treat an `application` against a trimmed record as evidence of a delivered access. Also note `memory_access_delivered.task_id` falls back to session id then `""` — P3b's `(task_id, record_id)` dedup should handle the empty-string case explicitly.
- Required disposition: carry-forward to P3b (projection must filter on the delivered subset and defined task identity).

### F-5 [info] Replay re-authorization is scope-tuple + fingerprint depth only
- Where: `memory_events.py` `ingest` step 1 / `request_fingerprint`.
- Evidence: cached acks are returned only when the full `(tenant, actor, role, profile, operation)` key matches and the fingerprint (validated body + `__scope__` incl. sorted grant scopes, generation, session, task) is identical; any drift ⇒ 409; foreign scope ⇒ disjoint key (N-21 tests pass).
- Why it matters: N-21's "re-check current authorization" is satisfied to the maximum Cortex can know (it holds no revocation state); live grant revocation re-checks are Gateway/P5a-owned per boundary §2.3. No action needed in this parcel.
- Required disposition: informational.
