# p2a-review-R1-seatA — route `anthropic/claude-fable-5`, dispatched by coordinator `01a131a9`

---

## VERDICT: APPROVE-WITH-FIXES
## TEST RUN
```
.venv/Scripts/python.exe -m pytest -q -p no:cacheprovider
  2109 passed, 113 skipped, 2 warnings in 44.54s        (base baseline: 2046 passed / 110 skipped)

KEON_TEST_DATABASE_URL=postgresql://postgres:opmem@127.0.0.1:55432/cortex \
  .venv/Scripts/python.exe -m pytest tests/test_postgres_roundtrip.py -q -p no:cacheprovider
  3 passed, 1 warning in 1.02s

git diff --name-status 3294bd3..HEAD → only Allowed Files (+S0-2); worktree clean.
Probes (temp dir): base-vs-head shards/1 ShardRecord serialization byte-identical: True;
old reader rejects 1.1 row (TypeError decision_status / ValueError memory_type); served-path
HTTP probes for idempotency canonicalization + source_uri scheme bypass (results below).
```
## FINDINGS

### F-1 [major] `source_uri` scheme allowlist accepts non-URI values via whitespace/control stripping in `urlsplit`
- Where: src/keon/cortex/ingress/models.py:190-199 (`validate_source_uri_scheme`)
- Evidence: Served-path probe (POST /v1/shards): `"ht\ttps://evil.example/x"`, `" https://x.example/"`, `"htt\nps://y.example/"` all → 200 and stored **verbatim** (tab/newline/leading space preserved) because Python's `urlsplit` strips `\t\r\n` anywhere and leading space/C0 controls before extracting the scheme (confirmed on Python 3.12.12). Ruling 6 / boundary §6 says non-`https`/`urn` schemes are "rejected"; these raw values have no valid RFC-3986 scheme at all, yet pass as `https`. (Dangerous-scheme smuggling the other way is not possible — `"jav\tascript:..."` still resolves to scheme `javascript` and is rejected — so this is a hardening/data-hygiene breach, not a live injection.)
- Why it matters: Durable provenance rows now carry control characters inside a field the contract certifies as scheme-allowlisted; downstream consumers that trim or re-parse differently can disagree with the validator about what the URI is.
- Required disposition: fix in rework (validate the raw string, e.g. reject whitespace/control chars before `urlsplit`, or require `fullmatch` on `https://…`/`urn:…`).

### F-2 [minor] Idempotency fingerprint canonicalizes the raw JSON body, so encoding-variant identical retries 409 and 4 body keys are silently shadowed
- Where: src/keon/cortex/api.py:395-423 (`_request_hash`)
- Evidence: Probes with the same `X-Idempotency-Key`: `{"memoryType":"fact"}` then retry as `{"memory_type":"fact"}` (populate_by_name) → 200 then **409**; `beliefScore: 1` vs `1.0` → 200 then **409**. Conversely a body carrying extra `"roleId":"evil","actorId":"spoof","scopeClass":"legacy"` fingerprints identically to the clean body (trusted values overwrite at api.py:418-421) and replays 200 byte-identically — harmless today because pydantic ignores those extras, but the fingerprint domain overlaps client-controlled key space.
- Why it matters: Semantically identical retries that re-serialize (alias form, numeric form, extra ignored keys) break the replay guarantee into 409 (fail-closed, no integrity loss); no semantically-*different* requests were found to share a fingerprint, and scope/actor always dominate. The shadowing becomes a real blind spot if the candidate schema ever gains an `actorId`/`roleId`/`profileId`/`scopeClass` alias.
- Required disposition: carry-forward to P2b (document byte-identical-retry requirement; consider namespacing the injected scope keys, e.g. a reserved `"__scope__"` envelope).

### F-3 [minor] Pre-P2a durable idempotency reservations permanently 409 against post-P2a retries; no migration note
- Where: src/keon/cortex/api.py:395-423, 713-719; src/keon/cortex/providers/postgres/idempotency_store.py (no TTL/expiry)
- Evidence: Reservations persist indefinitely and store the old `request_hash` (model-dump based, scope-free). Post-deploy, a byte-identical retry computes the new raw-body+scope hash → `_verify_replay` → 409 forever for that key; explicit-key fallback rows keyed by legacy shard_id likewise never match the new scoped fallback key (fresh scoped write instead — consistent with N-20). Fail-closed both ways (old reader vs new reservation also 409s); no overwrite or cross-scope path.
- Why it matters: Operationally surprising deploy-boundary behavior; ruling 9 covered row rollback but not reservation-fingerprint compatibility, and the build report should state it.
- Required disposition: carry-forward to P2b (deploy note / optional reservation flush).

### F-4 [minor] `lineage_refs` entries are only length-bounded — control characters and arbitrary unicode persist as "shard ids"
- Where: src/keon/cortex/ingress/models.py:258-265; src/keon/cortex/core/models.py:198-210
- Evidence: Probe: candidate and `ShardRecord` both accept `["evil\nref\x00", "DROP TABLE"]`; values round-trip into durable JSONB. Count ≤ 64 and length 1–128 are enforced (ruling 1's stated bounds), but `decision_status` got the T-35 alphabet while the sibling "shard ids" field did not.
- Why it matters: P2b joins/recall will consume `lineage_refs` as identifiers; unvalidated bytes in an id-typed field invite confusion and log/output injection later.
- Required disposition: carry-forward to P2b (tighten to shard-id/T-35 alphabet before anything dereferences them).

### F-5 [info] Scoped replay verification still assumes `extractor_version="v1"`, so a served write with non-default `extractorVersion` creates a row `/v1/replay` can never verify
- Where: src/keon/cortex/api.py:357-390 (`_replay_value_hash`); ingress/models.py:345-362 (`compute_scoped_shard_id` uses `self.extractor_version`)
- Evidence: Write path derives the scoped id with the client-supplied `extractor_version`; replay recomputes with hard-coded `"v1"` → `match=False`. Pre-existing, explicitly documented limitation (docstring), correctly extended to the scoped branch; `profile_shared` branch is currently unreachable (write path hardcodes `role_private`, per ruling 2/P1b).
- Why it matters: Known determinism gap carried into the scoped identity; should stay on the ledger.
- Required disposition: informational (already tracked as a stated follow-up).

### F-6 [info] Rollback/durability contract verified: shards/1 rows byte-identical across base→head; old reader rejects 1.1 rows exactly as ruling 9 permits
- Where: src/keon/cortex/core/models.py:231-249 (`to_dict`), providers/postgres/document_store.py:22-52
- Evidence: Cross-version probe: identical shards/1 `ShardRecord` serializes byte-identically under base `3294bd3` and head code (True); a 1.1 row fed to the base model raises `TypeError: unexpected keyword argument 'decision_status'` (and `ValueError` for new `memory_type`) — rejection, never silent misread. Real-PG tests confirm 1.1 round trip, legacy NULL scope columns, served ingest→restart→exact-ID, and durable replay bytes (OD-6 pinned fixture also passes). Legacy `make_candidate_shard_id` is untouched; 7-key scoped payload is structurally collision-free against the 4-key legacy payload.
- Why it matters: Confirms the acceptability condition in ruling 9 ("no legacy row affected") actually holds.
- Required disposition: informational.
