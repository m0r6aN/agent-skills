# p2b-review-R2-seatB — route `openai/gpt-6.1-sol`, dispatched by coordinator `01a131a9`

---

## VERDICT: REQUEST-CHANGES

## TEST RUN
- `PYTHONDONTWRITEBYTECODE=1 .venv/Scripts/python.exe -m pytest -q -p no:cacheprovider`
  — **2246 passed, 120 skipped**, 2 warnings.
- `PYTHONDONTWRITEBYTECODE=1 KEON_TEST_DATABASE_URL=postgresql://postgres:opmem@127.0.0.1:55432/cortex .venv/Scripts/python.exe -m pytest tests/test_recall_postgres.py tests/test_postgres_roundtrip.py -q -p no:cacheprovider`
  — **10 passed**, 1 warning.
- `PYTHONDONTWRITEBYTECODE=1 KEON_TEST_DATABASE_URL=postgresql://postgres:opmem@127.0.0.1:55432/cortex .venv/Scripts/python.exe -m pytest C:/Users/clint/AppData/Local/Temp/opmem_p2b_seat_b_probes.py -c pyproject.toml -q -s -p no:cacheprovider`
  — **9 passed, 2 failed**; both failures are obsolete HTTP **500** expectations, now **503**.
- `PYTHONDONTWRITEBYTECODE=1 KEON_TEST_DATABASE_URL=postgresql://postgres:opmem@127.0.0.1:55432/cortex .venv/Scripts/python.exe -m pytest C:/Users/clint/AppData/Local/Temp/opmem_p2b_R2_seat_b_probes.py -c pyproject.toml -q -s -p no:cacheprovider`
  — **11 passed, 4 failed**. All original probes pass with only those status expectations updated; four new served-route probes reproduce F-1.
- PostgreSQL runs used isolated temporary databases. Head verified as `aa1ea4c`; `git status --short` and `git diff --stat` remained empty.

## TRIAGE VERIFICATION
- **P2b-T1: IMPLEMENTED** — bound-record identity and tenant checks reject payload substitution; original served PostgreSQL probe returns 409.
- **P2b-T2: IMPLEMENTED** — successful branches reload after durability; original revocation-during-binding probe returns 409 for both replay and retry.
- **P2b-T3: PARTIAL** — ordinary failures roll back recall-store rows, but not previously appended spine records; cancellation bypasses rollback entirely. See F-1.
- **P2b-T4: IMPLEMENTED** — current-pass exclusions are reported separately from `delivery.first_excluded`; original fresh-operation probe passes.
- **P2b-T5: IMPLEMENTED** — pagination reaches the authorized record beyond 1,000 foreign rows; cap/truncation and malformed-configuration tests pass.

## FINDINGS
### F-1 [major] In-memory rollback still leaves orphaned or incomplete spine accounting
- Where: `src/keon/cortex/spine/recall_events.py:463–478`; `tests/test_two_plane_storage.py:1069–1098`.
- Evidence: Injecting failure on the **second** spine append through `/v1/recall` returns 503 but leaves event/access/binding/spine counts **(0, 0, 0, 1)**. An identical retry returns 200 with one spine timestamp anchored to the failed attempt and another to the successful delivery. If candidates change before retry, the successful delivery has **3 access rows but 4 spine records**, including an orphan from the failed delivery. Injected `asyncio.CancelledError` bypasses `except Exception`; retry returns **200** with **2 access rows but only 1 spine record**. The repository test explicitly accepts the surviving prefix.
- Why it matters: P2b-T3 requires the entire bundle to be atomic and invisible on failure. Surviving prefixes fabricate recall history for failed deliveries, while cancellation permanently loses history for successful retries. Idempotent re-append does not repair changed selections or conflicting delivery anchors.
- Required disposition: fix in rework
