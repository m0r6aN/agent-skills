# p2a-review-R2-seatA — route `anthropic/claude-fable-5`, dispatched by coordinator `01a131a9`

---

## VERDICT: APPROVE-WITH-FIXES
## TEST RUN
```
git rev-parse HEAD → b3fe43942ebcc8fdbb7b2218f215d264e1c63fd1; worktree clean;
git diff --name-status 1b261db..b3fe439 → api.py, core/models.py, ingress/models.py,
  tests/test_postgres_roundtrip.py, tests/test_shards_v1_1.py (Allowed Files only)

.venv/Scripts/python.exe -m pytest -q -p no:cacheprovider
  2147 passed, 114 skipped, 2 warnings in 41.47s          (matches expected)

KEON_TEST_DATABASE_URL=postgresql://postgres:opmem@127.0.0.1:55432/cortex \
  .venv/Scripts/python.exe -m pytest tests/test_postgres_roundtrip.py -q -p no:cacheprovider
  4 passed, 1 warning in 1.39s                            (matches expected)

R1 probes re-run (temp dir, in-memory app + pg_database admin query):
  source_uri: "ht\ttps://…", " https://…", "htt\nps://…", "HTTPS://", "javascript:",
    "data:", "https://a b…", NBSP/U+2028 → all 422; "https://ok…", "urn:isbn:…" → 200
  idempotency: alias-vs-field / 1-vs-1.0 / omitted-vs-explicit-true-defaults /
    provenance-omitted-timestamp retries → 200 replay, bytes-identical;
    scope-shadow extras (roleId/actorId/scopeClass/__scope__) → bytes-identical replay;
    changed content & NFC-vs-NFD → 409
  lineage_refs: "evil\nref\x00", "DROP TABLE", " ", 129-char → 422; "shr_ok.1:x-y_z" → 200
  surrogate: no Content-Type → 422; WITH Content-Type: application/json → 500 (crash);
    no reservation left either way (same key then valid body → 200)
  server state: pg_database LIKE 'opmem_test_%' → []; keon_cortex schema intact
```
## TRIAGE VERIFICATION
- P2a-T1: IMPLEMENTED — fixture creates `opmem_test_<uuid>`, runs entirely inside it, drops in `finally` with `WITH (FORCE)` (tests/test_postgres_roundtrip.py:71-100); after the 4-test run no leftover `opmem_test_*` databases and the shared `keon_cortex` schema in `cortex` is untouched (old fixture used to DROP it).
- P2a-T2: PARTIAL — (b) `lineage_refs` fullmatch `[A-Za-z0-9_.:-]{1,128}` on both candidate and `ShardRecord` ✓; (c) raw-string `source_uri` validation closes every R1 bypass (tab/newline/space laundering, `HTTPS:`, missing scheme, NBSP/U+2028) ✓; (d) all validation precedes reservation/store access (negative tests assert zero reservations/rows, incl. real PG) and post-reservation store failure → 503 with identical-retry completion, tested via `_FailOnceUpsertStore` ✓; (a) NUL rejection ✓ but unpaired surrogates are NOT a controlled 4xx on the real client path — see F-1.
- P2a-T3: IMPLEMENTED — fingerprint over the validated model (`by_alias`, defaults normalized, non-supplied `provenance.timestamp` dropped via `model_fields_set`), `{"candidate":…, "__scope__":…}` envelope exactly per ruling (api.py:395-439); all ruling-required probe cases pass (note: ruling's "explicit default" case verified against the true defaults `claim`/`0.5`; my initial `fact` probe 409'd correctly as a different candidate).
- P2a-T4: PARTIAL — the regression tests pass only because they omit `Content-Type: application/json`, so FastAPI never JSON-parses the surrogate; with the header set the 500 Seat B found in R1 still reproduces (F-1).

## FINDINGS

### F-1 [major] Unpaired-surrogate payload with `Content-Type: application/json` still crashes with an uncontrolled 500; the T4 regression tests give false evidence
- Where: src/keon/cortex/api.py (no `RequestValidationError` handler registered in `create_app`); tests/test_shards_v1_1.py:625-647 and tests/test_postgres_roundtrip.py (surrogate case) — both send raw `content=` without `Content-Type`
- Evidence: Probe: `b'{"tenantId":"tnt_probe","content":"\ud800"}'` (JSON-escaped lone surrogate). Without `Content-Type`: FastAPI never parses the body as JSON → clean 422 `model_attributes_type` (this is what the builder's tests exercise). With `Content-Type: application/json`: pydantic-core rejects the parsed string with `string_unicode` and embeds the lone-surrogate `input` in the error; FastAPI's **default** validation handler then dies in `JSONResponse.render` → `UnicodeEncodeError` → 500 (`raise_server_exceptions=False` shows `500 Internal Server Error`). Same for `lineageRefs: ["\ud800"]`. No reservation or row is created (same key with a valid body then succeeds 200), so it is fail-closed — but the triage ruling P2a-T2(a)/T4 required a controlled 4xx and the shipped tests structurally cannot detect this.
- Why it matters: Any real JSON client (which always sends the header) can trigger an unhandled server exception; the parcel's evidence claims this class is closed when only the NUL half is.
- Required disposition: fix in rework (register a `RequestValidationError` handler that sanitizes/drops the `input` echo, or pre-screen the raw body; fix both tests to send `Content-Type: application/json` so the real path is exercised).

### F-2 [info] R1-head 1.1 rows with now-forbidden `lineage_refs` would be unreadable under the tightened `ShardRecord` validator
- Where: src/keon/cortex/core/models.py:205-214
- Evidence: A row persisted under `1b261db` with e.g. `lineage_refs=["DROP TABLE"]` (legal then, per R1 A F-4) now raises `ValueError` at record construction on read. No promoted deployment of P2a exists (parcel still in review), so no real data is affected; `shards/1` rows are untouched (serialization code unchanged in the rework — R1 F-6 byte-identity result stands).
- Why it matters: Worth one line in the closure/deploy note alongside P2a-T5 so nobody back-fills R1-head rows into a b3fe439 store.
- Required disposition: informational.

### F-3 [info] R1 carry-forwards unchanged and correctly so
- Where: src/keon/cortex/api.py:357-390 (`_replay_value_hash` still hard-codes `extractor_version="v1"` — R1 F-5); pre-P2a reservation fingerprint incompatibility (R1 F-3 → T5, deploy note, no code expected)
- Evidence: Diff confirms neither area was touched; T5 is recorded as carry-forward in the triage table.
- Why it matters: Ledger continuity only.
- Required disposition: informational (already tracked).
