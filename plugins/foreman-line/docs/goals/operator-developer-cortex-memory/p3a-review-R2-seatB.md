# p3a-review-R2-seatB — route `openai/gpt-6.1-sol`, dispatched by coordinator `01a131a9`

---

## VERDICT: APPROVE-WITH-FIXES
## TEST RUN
```bash
PYTHONDONTWRITEBYTECODE=1 .venv/Scripts/python.exe -m pytest -q -p no:cacheprovider
```
2282 passed, 123 skipped, 2 warnings.

```bash
PYTHONDONTWRITEBYTECODE=1 KEON_TEST_DATABASE_URL=postgresql://postgres:opmem@127.0.0.1:55432/cortex .venv/Scripts/python.exe -m pytest tests/test_memory_events_postgres.py tests/test_recall_postgres.py tests/test_postgres_roundtrip.py -q -p no:cacheprovider
```
13 passed, 1 warning.

```bash
PYTHONDONTWRITEBYTECODE=1 KEON_TEST_DATABASE_URL=postgresql://postgres:opmem@127.0.0.1:55432/cortex .venv/Scripts/python.exe -m pytest C:/Users/clint/AppData/Local/Temp/opmem-seat-b-r2-nr0r42rc/test_seat_b_p3a_r2.py -q -s -p no:cacheprovider -c pyproject.toml
```
22 passed, 1 warning. Re-ran all 12 R1 probes with R2 expectations and added verification in both storage modes. Concurrent same-key/new-key writes, concurrent-winner authorization, cancellation rollback and partial-index rollback passed. PostgreSQL probes used disposable databases.

Black/isort checks passed on all six parcel files. Head verified as `ecc7cfd`; worktree remained clean.

## TRIAGE VERIFICATION
- **P3a-T1: IMPLEMENTED** — duplicate access and omission IDs return 422 in both storage modes, without writes.
- **P3a-T2: IMPLEMENTED** — distinct omission operations retain distinct spine IDs and explicit times in both storage modes.
- **P3a-T3: IMPLEMENTED** — mixed batches acknowledge `replayed: false` and list only replay-equivalent records; fully duplicate batches acknowledge `replayed: true`.
- **P3a-T4: IMPLEMENTED** — cached acknowledgements and injected concurrent-winner recovery return 409 `references_no_longer_authorized` after scope loss, without additional writes.
- **P3a-T5: IMPLEMENTED** — all five access-linked kinds reject selected-but-undelivered and omitted records with 409 `access_not_delivered`; delivery permits subsequent acceptance. Memory-only outcome/feedback retain visibility checks.
- **P3a-T6: PARTIAL** — served retry byte equality, including PostgreSQL restart, passes. However, bindings still persist response dictionaries/JSONB rather than the original response bytes required by the triage ruling.

## FINDINGS
### F-1 [minor] Original acknowledgement bytes are not durably frozen
- Where: `src/keon/cortex/services/memory_events.py:474,876–878,1016,1325–1326`; `src/keon/cortex/providers/postgres/schema.py:180`; `src/keon/cortex/api.py:1246`.
- Evidence: Bindings store `response_data` as a dictionary/JSONB. Replay reloads and sorts that dictionary, then the HTTP route serializes a newly constructed envelope. Current byte-equality probes pass; no present serializer mismatch was observed.
- Why it matters: This corrects R1’s changed `replayed` value but does not implement T6’s explicit raw-byte persistence requirement. Replay identity still depends on the response serializer remaining unchanged across deployments.
- Required disposition: fix in rework — persist and replay the canonical wire body directly, or obtain an explicit ruling amendment permitting deterministic reconstruction.
