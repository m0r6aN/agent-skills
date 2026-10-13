# p2a-review-R2-seatB — route `openai/gpt-6.1-sol`, dispatched by coordinator `01a131a9`

---

## VERDICT: APPROVE-WITH-FIXES

## TEST RUN
- `PYTHONDONTWRITEBYTECODE=1 .venv/Scripts/python.exe -m pytest -q -p no:cacheprovider`
  - `2147 passed, 114 skipped, 2 warnings in 40.34s`
- `KEON_TEST_DATABASE_URL=postgresql://postgres:opmem@127.0.0.1:55432/cortex PYTHONDONTWRITEBYTECODE=1 .venv/Scripts/python.exe -m pytest tests/test_postgres_roundtrip.py -q -p no:cacheprovider`
  - `4 passed, 1 warning in 1.32s`
- `PYTHONIOENCODING=utf-8 PYTHONDONTWRITEBYTECODE=1 .venv/Scripts/python.exe C:/Users/clint/AppData/Local/Temp/opmem_p2a_seatB_probe.py`
  - `probe complete`; normalization pairs now **200 → 200**; surrogate content and lineage still return **500**.
- `PYTHONIOENCODING=utf-8 PYTHONDONTWRITEBYTECODE=1 .venv/Scripts/python.exe C:/Users/clint/AppData/Local/Temp/opmem_p2a_seatB_pg_isolated.py --probe`
  - `isolated PG probe complete`; malformed NUL/whitespace inputs return **422**, with **0 shards / 0 reservations**; owned schema dropped.
- `PYTHONIOENCODING=utf-8 PYTHONDONTWRITEBYTECODE=1 .venv/Scripts/python.exe C:/Users/clint/AppData/Local/Temp/opmem_p2a_R2_seatB_probe.py`
  - `R2 probe complete`; isolated-PG injected write failures return **503 → 503 → 200**, normalized retry returns **200**, cross-scope retry returns **409**, and cross-scope exact-ID returns **404**. Negative inputs create no reservations; owned schema dropped.

## TRIAGE VERIFICATION
- **P2a-T1: IMPLEMENTED** — fixture creates uniquely named temporary databases and drops only those databases; shared-schema deletion removed.
- **P2a-T2: PARTIAL** — NUL, lineage syntax, raw URI checks, and retryable post-reservation storage failures are implemented. Actual JSON surrogate requests and whitespace-only content still return uncontrolled **500**, rather than 4xx.
- **P2a-T3: IMPLEMENTED** — validated-candidate fingerprint and separate scope envelope verified; R1 alias, numeric-form, and deterministic-default probes replay successfully. Changed scope/content remain conflicts.
- **P2a-T4: PARTIAL** — model rejection exists, but the served JSON error response still raises `UnicodeEncodeError`. Both regression tests omit the JSON content type and therefore miss this residual.

## FINDINGS

### F-1 [minor] Surrogate requests still return 500; regression tests reject the wrong input layer
- Where: `src/keon/cortex/api.py:605`; `tests/test_shards_v1_1.py:639`; `tests/test_postgres_roundtrip.py:306`
- Evidence: With `Content-Type: application/json`, escaped unpaired surrogates in content, source, lineage references, subject keys, or source URI return **500**. The traceback shows FastAPI’s validation-error handler reflecting the surrogate into `JSONResponse`, whose UTF-8 encoding fails. No store calls or reservations occur. Without that header, the new tests return **422 `model_attributes_type`** because the body remains bytes—not because candidate text validation works.
- Why it matters: P2a-T4 remains unresolved on the real JSON path. Malformed client input is misclassified as a server failure and may trigger unnecessary retries; passing memory/PG tests provide false assurance.
- Required disposition: fix in rework — make validation-error responses surrogate-safe and add `Content-Type: application/json` to both raw-body regression tests; assert the actual candidate-validation failure and zero store/reservation access.

### F-2 [minor] Whitespace-only content bypasses candidate validation and raises 500
- Where: `src/keon/cortex/ingress/models.py:288`; `src/keon/cortex/api.py:715`
- Evidence: An authenticated JSON request with `"content":" \n\t"` passes candidate validation, then `_build_record` raises the core model’s uncaught `ValueError: content must be a non-empty string`. Response: **500**, with **0 store calls / 0 reservations**.
- Why it matters: Boundary and durable-model validation disagree, leaving P2a-T2’s controlled input-validation path incomplete. A terminal client error appears retryable.
- Required disposition: fix in rework — reject whitespace-only content during candidate validation without rewriting accepted content; add a served-path regression asserting 4xx and no store/reservation access.
