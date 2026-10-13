# p2a-review-R1-seatB — route `openai/gpt-6.1-sol`, dispatched by coordinator `01a131a9`

---

## VERDICT: REQUEST-CHANGES
## TEST RUN
- `PYTHONDONTWRITEBYTECODE=1 .venv/Scripts/python.exe -m pytest -q -p no:cacheprovider`
  - `2109 passed, 113 skipped, 2 warnings in 40.94s`
- `PYTHONIOENCODING=utf-8 PYTHONDONTWRITEBYTECODE=1 .venv/Scripts/python.exe C:/Users/clint/AppData/Local/Temp/opmem_p2a_seatB_pg_isolated.py`
  - Executes `tests/test_postgres_roundtrip.py -q -p no:cacheprovider`, redirecting SQL exclusively to a uniquely named `review_b_*` schema.
  - `3 passed, 1 warning in 1.05s`; own schema dropped.
- `PYTHONIOENCODING=utf-8 PYTHONDONTWRITEBYTECODE=1 .venv/Scripts/python.exe C:/Users/clint/AppData/Local/Temp/opmem_p2a_seatB_probe.py`
  - `probe complete`
- `PYTHONIOENCODING=utf-8 PYTHONDONTWRITEBYTECODE=1 .venv/Scripts/python.exe C:/Users/clint/AppData/Local/Temp/opmem_p2a_seatB_pg_isolated.py --probe`
  - `isolated PG probe complete`; own schema dropped.

## FINDINGS
### F-1 [major] PostgreSQL fixture destroys the shared Cortex schema
- Where: `tests/test_postgres_roundtrip.py:66`
- Evidence: Each fixture setup executes `DROP SCHEMA IF EXISTS keon_cortex CASCADE` against the supplied database. There is no disposable-database verification or isolation. I ran these tests only through a temporary schema-redirection wrapper.
- Why it matters: The documented invocation deletes all Cortex records and reservations in the shared database, including concurrent reviewers’ data. An environment-variable opt-in does not establish exclusive ownership.
- Required disposition: fix in rework — isolate each run in its own uniquely named schema or disposable database, and clean up only that owned namespace.

### F-2 [major] Malformed new fields reach PostgreSQL and poison reservations
- Where: `src/keon/cortex/ingress/models.py:194`, `src/keon/cortex/ingress/models.py:261`, `src/keon/cortex/api.py:756`
- Evidence: Through the served pipeline against isolated PostgreSQL, `lineageRefs:["\u0000"]` and `provenance.sourceUri:"https://example.org/\u0000"` each returned **500** on initial submission and identical retry. Correcting either body under its original key returned **409**. Three submitted operations left three reservations but only one shard. Separately, `" "` and `"\n"` are accepted as lineage identifiers.
- Why it matters: Length-only validation does not establish that references are shard IDs; scheme-only URI validation admits PostgreSQL-incompatible text. Reservations commit before the invalid shard fails to persist, leaving these operations unreconcilable through ordinary retries.
- Required disposition: fix in rework — validate references against supported shard-ID syntax and reject invalid/control-containing URI text before reservation or document-store access. Add served-path and isolated-PostgreSQL negative tests asserting 4xx with no reservation.

### F-3 [minor] Equivalent accepted requests now produce false idempotency conflicts
- Where: `src/keon/cortex/api.py:417`
- Evidence: With actor, scope, receipt and key unchanged, each pair below produced equal validated candidate models but responses **200 → 409**: `tenantId` versus `tenant_id`; `beliefScore:1` versus `beliefScore:1.0`; omitted `memoryType` versus explicit `"claim"`. Key-order changes and identical provenance-bearing retries correctly produced **200 → 200**.
- Why it matters: Hashing submitted JSON avoids the generated-timestamp problem but abandons normalization already performed by the accepted model. Equivalent requests can become conflicting merely because a serializer changes representation, obstructing lost-ack reconciliation.
- Required disposition: fix in rework — normalize accepted aliases, numeric forms and deterministic defaults while excluding server-generated defaults such as an omitted provenance timestamp. Preserve scope binding and genuine changed-request conflicts.

### F-4 [minor] Content-byte validation raises an uncaught Unicode error
- Where: `src/keon/cortex/api.py:643`
- Evidence: An authenticated JSON request containing escaped unpaired surrogate content, `"content":"\ud800"`, returned **500**, with no stored row. The UTF-8 encoding used for byte counting has no error handling.
- Why it matters: Malformed client text is reported as a server failure instead of a terminal input-validation error, encouraging retries and leaving the new hardening path incomplete.
- Required disposition: fix in rework — reject non-UTF-8-encodable content with a controlled 4xx before store access; add a served-pipeline regression test.
