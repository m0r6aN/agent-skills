# p2a-review-R3-seatA — route `anthropic/claude-fable-5`, dispatched by coordinator `01a131a9`

---

## VERDICT: APPROVE
## TEST RUN
```
git rev-parse HEAD → 4bb9405fe86cf45fea4470e37a9f53345744da73; worktree clean
git diff --name-status b3fe439..4bb9405 → api.py, ingress/models.py,
  tests/test_postgres_roundtrip.py, tests/test_shards_v1_1.py (Allowed Files only)

.venv/Scripts/python.exe -m pytest -q -p no:cacheprovider
  2153 passed, 114 skipped, 2 warnings in 60.47s          (matches expected)

KEON_TEST_DATABASE_URL=postgresql://postgres:opmem@127.0.0.1:55432/cortex \
  .venv/Scripts/python.exe -m pytest tests/test_postgres_roundtrip.py -q -p no:cacheprovider
  4 passed, 1 warning in 1.45s                            (matches expected)

R1/R2 probes re-run (temp-dir scripts, in-memory app + pg_database admin query):
  T7: JSON-escaped lone surrogate WITH Content-Type: application/json in content,
    source, lineageRefs, subjectKeys, provenance.sourceUri, tenantId, memoryMode
    → all 422, body parses as JSON, no raw surrogate echoed; same key then valid
    body → 200; fresh-app check: 0 reservations, 0 shard rows after rejects
  T8: " ", "\n\t ", NBSP, U+2028, U+3000, VT/FF, "" → all 422, zero reservations/
    rows; "  padded \n" → 200 and stored byte-identical (never rewritten)
  regressions: source_uri matrix (tab/space laundering, HTTPS:, javascript:,
    data:, inner space → 422; https/urn → 200) ✓; replay bytes-identical,
    changed content → 409 ✓; lineage_refs matrix (newline, "DROP TABLE", " ",
    129-char → 422; "shr_ok.1:x-y_z" → 200) ✓
  server state: pg_database LIKE 'opmem_test_%' → []; keon_cortex schema intact
```
## TRIAGE VERIFICATION
- P2a-T7: IMPLEMENTED — `create_app` registers a `RequestValidationError` handler (src/keon/cortex/api.py:626-646) returning 422 with loc/msg/type only; `msg` is rendered via `_surrogate_safe` (`backslashreplace`, api.py:94-102) and raw `input` is never echoed. My R1/R2 reproducer (lone surrogate + `Content-Type: application/json`) and six additional field locations all return a controlled, JSON-parseable 422 with zero reservations and zero rows; both regression tests now send the real header (tests/test_shards_v1_1.py:625-670, tests/test_postgres_roundtrip.py:306-314) and cover content/source/lineageRefs/subjectKeys/sourceUri per the ruling.
- P2a-T8: IMPLEMENTED — `validate_content_non_blank` on `MemoryShardCandidate` (src/keon/cortex/ingress/models.py:368-375) rejects content with no non-whitespace character; served-path probes for ASCII whitespace, NBSP, U+2028, U+3000, VT/FF and empty string all 422 with zero store/reservation access, and accepted padded content is stored byte-identical (never rewritten), matching the ruling's letter exactly.

## FINDINGS

### F-1 [info] Content consisting solely of Unicode format characters (e.g. U+200B) is accepted — compliant with the T8 ruling but effectively blank
- Where: src/keon/cortex/ingress/models.py:368-375
- Evidence: Probe `content="\u200b"` (zero-width space only) → 200, stored verbatim; `str.strip()` strips Unicode whitespace but not Cf-class characters. No crash, no rewrite, no store anomaly — the original R2 B F-2 500 class does not reproduce.
- Why it matters: U+200B is not whitespace, so the ruling ("no non-whitespace character") is satisfied; recording so the "blank content" boundary is explicit if anyone later wants Cf characters covered.
- Required disposition: informational.

### F-2 [info] Lone surrogate in an ignored extra JSON object key is accepted (200), not 422
- Where: src/keon/cortex/api.py (validated-model fingerprint path, ~395-439); pydantic extra-key handling
- Evidence: `{"\ud800": 1, "tenantId": …, "content": "ok"}` with `Content-Type: application/json` → 200; extra key is dropped before validation, nothing surrogate-laden is persisted (record inspected), and the same idempotency key with the plain body replays bytes-identical — consistent with the R2-established extras behavior (scope-shadow probe).
- Why it matters: Fail-closed and nothing stored; noting only because it is the one surrogate placement that does not yield 422 — by design of ignored extras, not a defect.
- Required disposition: informational.
