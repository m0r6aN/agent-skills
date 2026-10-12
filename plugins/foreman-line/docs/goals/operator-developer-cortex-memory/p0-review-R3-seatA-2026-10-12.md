# OPMEM-P0 review R3 (verification) — Seat A (architecture/boundary/plan-level)

**Reviewed commit:** `69a34653` deliverables (brief committed after). **Route:** `anthropic/claude-fable-5`, read-only tools, `--thinking high`. **Cost:** USD 3.0037. Verbatim output follows.

---

## VERDICT: APPROVE-WITH-FIXES

## TRIAGE VERIFICATION
- T-16: PARTIAL — ruling encoded verbatim (event §1/§2 rule 1, G-13/G-14 served-scorer fixtures), but its dedup key `(logical task id, record id)` uses an identity defined nowhere in the seven documents (see F-1).
- T-17: ENCODED — P1a/P1b rollback lines are additive-migration with nullable scope/tenant columns + T-1 legacy-visibility rule, mirroring P2 wording.
- T-18: ENCODED — P5a gains UPDATE `Program.cs` (DI + `ToolRegistry`); P5b gains UPDATE `server.py`/`port.py`; both verification lines mandate discovery + invocation through the real MCP servers, never hand-assembled registries.
- T-19: ENCODED — boundary §2.3 "Secret custody and reachability" frozen requirement; OD-20 recorded; implementation owner P8; merge-boundary non-exposure note present.
- T-20: ENCODED — baseline-recording rule in manifests rules section; P2 proof line reads "at the P2 verification base (integration head — T-20)".
- T-21: ENCODED — OD-21 recorded; P5a verification labels the Runtime double "test-double evidence, never deployment evidence"; P8 scope binds/deploys a real Runtime; pilot §1 makes a stub at S-gates/P9/P10 a failed gate.
- T-22: ENCODED — P2 Allowed Files gain `core/models.py` + `providers/postgres/document_store.py`; PostgreSQL ingest→restart→reload→exact-ID round-trip tests named. Verified real at pin: `ingress/models.py` validator still allows only `claim|belief|lesson|fact|story`.
- T-23: ENCODED — boundary §2.3 record-vs-content identity and `(tenant, actor, role_id, profile_id, operation_id)` ledger keys + fingerprint/re-auth; N-20/N-21 in event §9; wired into P1b/P2/P5a (but see F-2 on N-20 sequencing).
- T-24: ENCODED — §2.2 maps `get_memory.v1` → `keon.cortex.memory.get.v1`; `receipt.get.v1` reclassified legacy shard fetch; N-4/N-10 exact-ID through `memory.get.v1`; P5a `CortexMemoryGetHandler.cs` NEW.
- T-25: ENCODED — P4b owns `proof/key_registry.py` (verified: no such file exists at pin — NEW is valid) + `POST /v1/evidence/verify`; dependency order now P4a → P4b; N-13 runs through the served verifier; key provisioning in P8 (but see F-4 on the Gateway mapping row).
- T-26: ENCODED — P1a seam carries the sha256(tenant+"\n"+correlation_id) basename + confinement check; N-22 enumerates traversal cases; stop-ledger item 10 records the production exposure honestly.
- T-27: ENCODED — boundary §2.2 event row carries the ingress resolution rule (`supported` requires completed tool-terminal + present action-execution receipt); event §2 rule 3 and F-13/F-14 present; P5a seam owns it.

## FINDINGS

### F-1 [major] T-16's dedup key `(logical task id, record id)` is an undefined identity
- Claim at issue: `event-and-fixture-contract.md` §2 rule 1 and §7 G-13 ("within one logical task").
- Reality/evidence: "logical task id" appears only in the T-16 encoding and the triage record; §3's frozen delivery-identity tuple contains `session_id` (with defined logical-session semantics, OD-18) but no task id; no T-1 carriage header, no T-11 operation identity, and no event minimum-field list carries a task id; P2's recall-event schema has no requirement to persist one.
- Why it matters: P3 cannot implement the recall-influence dedup, and G-13 cannot be written, unless P2's recall event already records the task identity — if P2 ships without it, P3 forces a P2 re-open. Two builders will guess differently (task = logical session? = operation? = delivery tuple?).
- Required disposition: fix — one contract line defining logical task id (most coherent: alias it to §3's logical `session_id` or add it to the delivery tuple and the recall-event fields). Closable at **P2 shaping** (carry-forward candidate); no P0 rework needed if pinned there.

### F-2 [minor] P1b's verification names N-20 before N-20's record-identity half exists
- Claim at issue: `follow-on-parcel-manifests.md` P1b verification ("`tests/test_scope_http.py` incl. N-20"); `event-and-fixture-contract.md` N-20 ("same content under two scopes produces **two** records; owners: P2 record identity, P1b visibility").
- Reality/evidence: the two-records behaviour requires the T-23 scoped record-identity hash, owned by P2 (`core/models.py`/`compute_shard_id` path), which merges after P1b; at P1b's base the pin's scope-free shard identity produces one record for identical content.
- Why it matters: a literal P1b builder will write an N-20 test that cannot pass at its base, or will quietly implement P2's record identity out of scope (stop condition 3).
- Required disposition: fix — P1b's line should name only the visibility half of N-20 (scope columns + fail-closed reads), with the two-records half pinned to P2. Closable in **P1b shaping** (carry-forward candidate).

### F-3 [minor] New test directory `tests/tenancy/` needs an `__init__.py` outside P1b's Allowed Files
- Claim at issue: `follow-on-parcel-manifests.md` P1b Allowed Files (*(NEW)* `tests/tenancy/test_scope_enforcement.py`).
- Reality/evidence: `tests/tenancy/` does not exist at the cortex pin; every existing test package there (`tests/gravity/`, `tests/inheritance/`, `tests/collective/`, …) carries `__init__.py` (verified by directory listing at the pin).
- Why it matters: stop-ledger item 3 ("a needed file is outside Allowed Files → stop") trips on a trivial packaging file, stalling the first Cortex parcel.
- Required disposition: fix — add `tests/tenancy/__init__.py` to P1b's list at shaping. Carry-forward candidate.

### F-4 [minor] The served verifier has no Gateway tool/mapping row
- Claim at issue: `follow-on-parcel-manifests.md` P4b/P5a ("served-verifier exposure via the existing evidence handler"); `memory-boundary-contract.md` §2.2.
- Reality/evidence: §2.2 maps `verify_memory.v1` → `keon.cortex.evidence.get.v1` → `GET /v1/shards/{id}/evidence` only; `POST /v1/evidence/verify` (T-25) has no mapping row, no named tool, and no ack shape, yet N-13/S-5 require execution "through the served verifier" from the validation seat.
- Why it matters: P5a's builder has no contract row to implement against; P9 cannot reach the verifier through the sole adapter ingress without an invented surface.
- Required disposition: fix — add the §2.2 row (tool name or an evidence-handler sub-action with request/ack shape) at **P5a shaping**. Carry-forward candidate.

### F-5 [info] Evidence discipline on the served-vs-model distinction held at the pins
- Claim at issue: `memory-boundary-contract.md` §2.4, `canon-authority-map.md` §4.2.
- Reality/evidence: verified at pin — `api.py` search is term-overlap over `list_by_tenant(limit=1000)` with `relevance_score`, no recall event; `RecallService(record_store, gravity_index)` is unwired by any route; `/health` returns only `{ok, storage}`; `CortexMemorySearchHandler` stamps `tenant_id = context.Request.TenantId`; `McpCallerContextResolver` header-precedence defect as documented; bridge files and `tests/test_service.py` exist as the manifests claim. No stub/README was promoted to implementation evidence anywhere in the seven documents.
- Why it matters: downstream parcels can trust the baseline's implemented/model-only/missing classification.
- Required disposition: informational.

## MISSING PIECE / SILENT COLLISION
**The `access` event has no ingest owner.** Event §1 defines `access` as the first of six typed dimensions (with its own minimum fields) and §2 rule 1 says "every delivery still appends its access/recall event" — but the T-15 event-ingest route list (P3: consideration/application/outcome/non_applicability/correction/feedback), boundary §2.2's `keon.cortex.memory.event.v1` row, and every parcel manifest omit `access`; the word does not appear in the boundary contract at all. If `access` is simply the P2 server-side recall event, no document says so — and that conflation is wrong once P7's token-budget trimming makes the delivered set smaller than the recall selection (event §6: large records "omitted with explicit reason"), silently inflating the S-3/S-6 denominators (application rate = `application`/`access`) and breaking F-8's "one access, one recall event" as a testable distinction. Closable by a one-paragraph ownership ruling at **P2/P3 shaping** (either equate access to the recall event's per-record delivery rows and say so, or add `access` to the memory.event.v1 kinds with its idempotency rule); it is not a blocker for P1a/P1b dispatch.
