# p3a-review-R2-seatA — route `anthropic/claude-fable-5`, dispatched by coordinator `01a131a9`

---

## VERDICT: APPROVE

## TEST RUN
```
.venv/Scripts/python.exe -m pytest -q -p no:cacheprovider
  → 2282 passed, 123 skipped, 2 warnings in 52.90s   (matches expected head ecc7cfd; R1 head was 2277/123)

KEON_TEST_DATABASE_URL=postgresql://postgres:opmem@127.0.0.1:55432/cortex \
  .venv/Scripts/python.exe -m pytest tests/test_memory_events_postgres.py tests/test_recall_postgres.py tests/test_postgres_roundtrip.py -q -p no:cacheprovider
  → 13 passed, 1 warning in 5.21s   (temp DB per run; no DDL against `cortex`)

black --check / isort --check-only on all 6 changed files → clean. Worktree clean at ecc7cfd.
git diff --name-status b6e25c6..HEAD → exactly the 6 Allowed Files; gravity/* untouched (OD-10 re-verified).
R1 probes re-run under %TEMP%/p3a_review_probes_r2 (in-memory rig, served pipeline):
  T1: access dup → 422, 0 rows; access_omitted dup → 422, 0 rows
  T2: two omissions (diff reason/time, new op ids) → 200/200, 2 AccessOmitted spine events, both occurred_at preserved
  T3: deliver s1 then [s1,s2] → replayed=false, replay_equivalent_record_ids=[s1], delivered 2, Access spine 2
  T4: scope-mutated reference + identical retry of cached op → 409 references_no_longer_authorized (no stale ack)
  T5: application vs undelivered/omitted record → 409 access_not_delivered; after delivery → 200
  T6: identical retry → response bytes == original bytes
  S0-3 regression: all-duplicate re-report, new op → replayed=true, no new delivered row/spine event, flagged audit rows only
```

## TRIAGE VERIFICATION
- **P3a-T1: IMPLEMENTED** — duplicate `record_ids` rejected with 422 at `AccessEventIn`/`AccessOmittedEventIn` model validation (pre-storage, so both modes identical); probe confirms nothing written; PG-mode test added (`op_ev_dup`). My R1 F-1 divergence (double rows vs permanent 500) is gone.
- **P3a-T2: IMPLEMENTED** — only delivered `access` keeps the S0-3 `(recall_event_id, record_id, kind)` spine id; `access_omitted` now uses its operation-keyed row id. Probe: two content-distinct omissions yield two `AccessOmitted` spine events with their own times/ids. R1 F-2 resolved.
- **P3a-T3: IMPLEMENTED** — `replayed` true only when every target is replay-equivalent; `replay_equivalent_record_ids` (sorted) added to the ack in both the main and concurrent-recovery paths. Probe matches ruling exactly. R1 F-3 resolved.
- **P3a-T4: IMPLEMENTED** — `_replay` re-runs `_resolve` under the current scope before serving any cached ack (including concurrent-winner recovery); `ReferenceNotFound` → 409 `references_no_longer_authorized`, nothing returned. Probe confirms.
- **P3a-T5: IMPLEMENTED** — `consideration`/`application`/`non_applicability` always, and `outcome`/`feedback` when carrying `access_ref`, require a `memory_access_delivered` row via `_require_delivered` → 409 `access_not_delivered`; omitted records refused; `memory_id`-only outcome/feedback keep the visibility check, per ruling. In-memory + PG tests cover it; probe confirms.
- **P3a-T6: IMPLEMENTED** — `ingest` returns the stored binding bytes (keys re-sorted to neutralize JSONB key reordering, matching the deterministically sorted original `response_data()`); route serializes the same dict. Probe: in-memory retry bytes identical; PG restart test asserts `retry.content == access.content`.

## FINDINGS

### F-1 [info] Replay re-authorization maps a delivered-anchor loss to `access_not_delivered`, not `references_no_longer_authorized`
- Where: `src/keon/cortex/services/memory_events.py` — `_replay` catches only `ReferenceNotFound`; an `AccessNotDelivered` raised by `_resolve` during cached-ack re-resolution propagates as 409 `access_not_delivered`.
- Evidence: code path. Unreachable in practice today — no API deletes `memory_access_delivered` rows, so a reference that was delivered at first write stays delivered; only scope/visibility loss (covered, → `references_no_longer_authorized`) is realizable.
- Why it matters: both outcomes are 409 fail-closed with nothing returned, so there is no exploit; merely a labeling nuance if a future parcel ever prunes delivered rows.
- Required disposition: informational.
