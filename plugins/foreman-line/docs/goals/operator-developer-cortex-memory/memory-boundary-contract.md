# OPMEM-P0 — Memory boundary contract (AC3 + AC4 + AC7)

**Parcel:** OPMEM-P0 · **Evidence base:** `source-baseline.md`, `canon-authority-map.md`
**Status:** frozen contract proposal for independent review. It resolves the proposed-vs-actual seams found at the pinned revisions. Numeric limits that require owner approval are collected in §7 and `open-decisions.md`; they are approval items, not silently chosen values.

## 1. Frozen topology (D3/D4/D5)

```text
Pi lifecycle extension / memory tools            [P7 — missing today]
  -> local adapter container (loopback/stdio)    [P6 — bridge shell exists, outbox missing]
  -> Azure MCP Gateway                           [ingress authority: identity, scope, entitlement, receipts]
  -> Azure Cortex                                [memory semantics: shards, lineage, evidence, gravity, recall, verification]
  -> Neon Postgres                               [Cortex-owned durable storage]
```

Non-negotiables carried from the ratified plan and confirmed against source:

- Gateway is the **sole** agent-facing service ingress. Direct client→adapter use is a dev profile only (bridge `README.md` "Canonical topology").
- Neither Pi nor the adapter receives database credentials or calls Cortex directly. The bridge contains no storage, gravity, proof, signing, or policy implementation (bridge `README.md`; `docs/CORTEX_PORT_CONTRACT.md` status line: "integration proposal, not locked Cortex canon").
- Cortex owns memory semantics/verification/lineage/gravity/durable storage. Gateway owns trusted tenant/profile/role binding and governance. The adapter owns delivery state only.

## 2. Service/tool seam — Gateway↔Cortex and adapter↔Gateway (AC3)

### 2.1 The three surfaces as they actually exist at pin

| Layer | Surface | Evidence |
|---|---|---|
| Cortex HTTP | `GET /health`; `POST /v1/shards`; `POST /v1/shards/search`; `GET /v1/shards/{shard_id}`; `GET /v1/shards/{shard_id}/lineage`; `GET /v1/shards/{shard_id}/evidence`; `POST /v1/replay` | `api.py:401-621` |
| Gateway tools | `keon.cortex.memory.write.v1`, `keon.cortex.memory.search.v1`, `keon.cortex.lineage.get.v1`, `keon.cortex.evidence.get.v1`, `keon.cortex.receipt.get.v1`, `keon.cortex.replay.query.v1` | `Tools/Cortex/*.cs` `Name` properties |
| Gateway admin HTTP | `GET /mcp/admin/ingress/{correlationId}` — JWT-authenticated (scope `keon:mcp:list`) ingress-spine receipt read; at pin the query is `WHERE correlation_id = $correlation_id` with **no tenant predicate**, returning receipt payloads (`TenantId`, `ActorId`, `ArgsHash`) for any known correlation id across tenants | `Program.cs:201-330` (query `:256`) |
| Bridge tools (proposed) | `keon.cortex.append_observation.v1`, `keon.cortex.record_decision.v1`, `keon.cortex.link_artifact.v1`, `keon.cortex.recall.v1`, `keon.cortex.get_memory.v1`, `keon.cortex.verify_memory.v1`, `keon.cortex.promote_memory.v1` | `bridge server.py:68-147` |

Gateway `CortexClient` binds to the **shards** wire (`v1/shards`, `v1/shards/search`, `v1/shards/{id}[/lineage|/evidence]`, `v1/replay`) with `CortexOptions(BaseUrl=http://localhost:9000, TimeoutSeconds=5, ServiceSecret)`, and translates errors to `CortexClientException(message, statusCode, retryable)`.

**Admin endpoint contract (R0 F-2).** `/mcp/admin/ingress/{correlationId}` is a governance-receipt surface, not a memory API; like `receipt.get.v1`/`replay.query.v1` it must remain reachable to governance callers and must never be routed through the adapter. Its tenant-less query is a pin defect, not a behavior to preserve: the query must become tenant-predicated and fail closed on foreign or absent tenant context (negative fixture N-16). Owner: P1a (already holds `Program.cs`).

### 2.2 Resolution C-4: one canonical protocol

**Decision (proposed for review, adopted as the contract):** the **implemented shards wire is Cortex protocol v1**. The bridge's `/v1/memory/*` port contract is demoted to *semantic tool contract*: the seven bridge tool names remain the agent-facing vocabulary (they encode intent: observation/decision/artifact/recall/get/verify/promote), but each maps onto the shards wire; no `/v1/memory/*` endpoint is ever implemented as a second store surface.

Canonical mapping (this mapping is the contract; deviations are amendments):

| Agent-facing tool (bridge/P7) | Gateway tool(s) | Cortex wire | Notes |
|---|---|---|---|
| `append_observation.v1` | `keon.cortex.memory.write.v1` | `POST /v1/shards` | `memory_type=observation` |
| `record_decision.v1` | `keon.cortex.memory.write.v1` | `POST /v1/shards` | `memory_type=decision`; carries `DecisionStatus` |
| `link_artifact.v1` | `keon.cortex.memory.write.v1` | `POST /v1/shards` | `memory_type=artifact_link`; `SourceRef` URIs scheme-checked at the adapter today; the Gateway boundary repeats the allowlist check (P5a — see §6 input-size/URI row) |
| `recall.v1` | `keon.cortex.memory.search.v1` **+** recall-event append (P2) | `POST /v1/shards/search` (+ P2 recall event) | **Blocked until P2** — see §2.4 |
| `get_memory.v1` | `keon.cortex.lineage.get.v1` / shard get | `GET /v1/shards/{id}` | exact-ID; scope-checked server-side |
| `verify_memory.v1` | `keon.cortex.evidence.get.v1` | `GET /v1/shards/{id}/evidence` | content-hash + evidence pack |
| `promote_memory.v1` | `keon.cortex.memory.write.v1` (promotion subtype) — **not yet routable** | none | disabled by default (`KEON_PROMOTION_ENABLED=false`); needs P4 promotion route |

Gateway-only tools with **no** bridge counterpart are Gateway protocol surface, not memory API: `receipt.get.v1` (execution receipt lookup) and `replay.query.v1` (deterministic replay over recorded value hashes). These must remain reachable to governance callers and must never be routed through the adapter.

### 2.3 Frozen boundary attributes per seam

**Auth.** Cortex trusts exactly one caller: the Gateway, via `X-Keon-Cortex-Secret` (constant-time compare, `api.py:164-175`). Every Cortex route additionally requires `X-Tenant-Id` and `X-Actor-Id` (`api.py:138-145`) — at the Cortex boundary these arrive only from the Gateway's `CortexClient` (`AddTenantHeaders`, `CortexClient.cs:250-254`), which forwards whatever tenant/actor the Gateway caller context carries. **That caller context is agent-influenceable at pin:** `McpCallerContextResolver.cs:49-59` resolves tenant/actor with precedence **client request headers `X-Keon-Tenant-Id`/`X-Keon-Actor-Id` → configured defaults (`McpOptions.DefaultTenantId`/`DefaultActorId`) → token claims**. JWT mode is safe because `JwtValidator.cs:53-62` binds claims↔request and mismatches fail closed (`MCP_TENANT_MISMATCH`), but API-key/machine-credential mode binds **only the tenant** (`ApiKeyValidator.cs:88-92`) and copies the client-supplied `actorId` unverified into the principal (`ApiKeyValidator.cs:102-105`, `new Claim("actor_id", actorId)`); a forged actor then flows into Cortex `X-Actor-Id`, `Provenance.agent_id`, and `_request_hash` (`api.py:260-267`). **Frozen contract (OD-5 as amended by R0 F-1):** client headers may never override authenticated claims; API-key/machine-credential principals carry an enrollment-bound actor/role, never a client-asserted one (§4.1 rule 6; enforcement owned by P1a; negative fixtures N-14/N-15). Gateway authenticates callers with JWT (`JwtValidator`, scopes such as `keon:mcp:invoke`, `keon:cortex:write`, `keon:mcp:list`) or API key (`ApiKeyValidator`), and evaluates entitlements (`IEntitlementEvaluator`, `PackageTier.Cortex`). The adapter authenticates to Gateway per the Gateway-supported scheme (D6); today the bridge carries startup-fixed identity only (§4.2).

**Schema.** Cortex ingest body is `MemoryShardCandidate` (canonical fields: `content`, `source`, `memory_type`, `memory_mode`, `subject_keys`, `belief_score`, `extractor_version`); shard identity is deterministic (`compute_shard_id`), request identity for idempotency is `_request_hash` = sha256 over canonical JSON of the candidate plus `actorId` (`api.py:260-267`). Gateway tools accept a JSON subset (`content` required; `source`, `memory_type`, `memory_mode`, `subject_keys`, `belief_score` required for write) and return contract objects (`shard_id`, `decision_id`, `store_ack_id`, `correlation_id`).

**Response.** Cortex data routes return an envelope `{"success": true, "data": …}` (`api.py:464`, `:513`, `:537`, `:556`, `:571`, `:608`, `:658`); the exception is `GET /health`, which returns `{"ok", "storage"}` (`api.py:401-406`) and must not be envelope-parsed. The adapter must echo and verify `tenant_id`/`project_id` scope (bridge `_validated_response`) and fail closed on foreign-tenant/mixed rows. `CortexStoreAck(ShardId, StoreAckId, ValueHash)` is the write acknowledgement; search returns `CortexShardSummary` rows with `RelevanceScore`, `LineageHash`, `CreatedAt`, `Status`.

**Readiness.** Cortex `GET /health` returns only `{"ok", "storage"}` at pin (`api.py:401-406`) — the shards wire carries **no** `schema_version`/protocol field anywhere (tool names carry `.v1`; there is no version header). Adapter `GET /health/live` + `GET /health/ready` return `503` until a *compatible ready* backend exists (bridge `server.py:172-175`, `ADVERSARIAL_GATE.md`). Readiness truth: `{"status":"ready","schema_version":"…"}` requires authoritative storage + schema compatibility + required signing/proof dependencies (port contract §Operations) — the adapter must not report ready on a liveness-only backend. **The schema-version signal does not exist on the wire today; P2 owns adding it** (Cortex `/health` gains a `schema_version`/protocol field — `api.py` is in P2's Allowed Files; the adapter fails closed on mismatch per the Version row; ruling OD-17 in `open-decisions.md` §B). This keeps the S-10 downgrade-refusal test implementable.

**Version.** Tool names carry `.v1`; the wire carries no version header and no `schema_version` field today (P2 adds it to `/health` — see Readiness). **Contract:** the shards wire is protocol `shards/1`; adapters MUST refuse protocol downgrade (a backend advertising a different schema_version than pinned → fail closed, `degradation: null` with explicit error). A future `shards/2` is additive (new fields), never silently re-typed; removal/retyping requires a version bump + owner amendment.

**Error.** Cortex errors are HTTP status + detail; Gateway maps to `CortexClientException(retryable)`; the adapter maps to sanitized MCP `ToolError` JSON with `indeterminate=true` on timeout/unavailable (`server.py:_error`, VERIFICATION.md "unavailable-backend call"). **Frozen rule:** a timeout on a write or recall is an **indeterminate** result, never success and never a fabricated duplicate; reconciliation is by idempotency key (§6).

**Idempotency.** The `Idempotency-Key` header is **optional**: absent or blank, the key falls back to `shard_id` (`api.py:436-440`, within the reservation path `api.py:418-449`). The mandatory ingest gate is `X-Decision-Receipt-Id` — requests without it are refused 403 (`api.py:425-433`). Reuse of a key with a different request hash is refused ("idempotency key was reused with a conflicting request", `api.py:320`); the reservation is durable in `keon_cortex.api_idempotency` keyed `(tenant_id, idempotency_key)` with `UNIQUE (tenant_id, shard_id)`. `status: duplicate` semantics for an identical retry are part of the port contract; exact response bytes must be pinned by P2 tests (OD-6).

### 2.4 The recall seam is CLOSED until P2 (resolution C-5)

The deployed `POST /v1/shards/search` is term-overlap relevance (`len(terms ∩ content)/len(terms)` over `list_by_tenant(limit=1000)`, `api.py:515-543`). It does **not** append a Recall spine event, does not compute gravity, does not verify content hashes, and returns no `recall_event_id`/`gravity_score`/`verification_meta`. The bridge's mandatory recall response (port contract) and the two-plane `RecallService` (`spine/recall_service.py`) are therefore **not implementable/not wired** respectively.

Contract consequences frozen now:

1. No OPMEM component may claim "gravitational recall" or "verified recall" over the deployed path until P2 lands the recall-event append + `RecallService` join + content-hash fail-closed behaviour on the served path (INV-2/INV-1).
2. Search results must be labeled `relevance_score` (term overlap), never `gravity_score`, and carry `verified: false` / `verification_meta: unavailable` until then.
3. `recall.v1` tool exposure stays behind the P7 feature flag until its response contract is satisfiable end-to-end; interim, adapters expose `search` semantics only.
4. Recall accounting (a durable recall event per genuinely new delivered recall) begins at P2/P3; no retroactive event fabrication.

## 3. Cognitive-write contract (AC3 second half)

| Write | Required real dependencies (Gateway-verified) | Forbidden substitutions |
|---|---|---|
| observation append | tenant/actor binding; entitlement; `Idempotency-Key` (optional — `shard_id` fallback, §2.3); provenance; **`X-Decision-Receipt-Id`** (mandatory, 403 without — `api.py:425-433`) anchoring a Gateway outcome receipt id | `belief_score`, self-reported usefulness, or an `integrity_hash` anchor as proof of anything external |
| decision record | above + decision identity (`decision_id`) + policy hash where a policy governed the decision | a `ReviewerVerdict`/deliberation record as a receipt |
| artifact link | above + scheme-allowlisted `SourceRef` + content hash for evidence links | raw URLs/paths dereferenced by any component |
| recall (P2) | durable Recall spine event appended **before** results return | a search response presented as a recall; recall without `recall_event_id` |
| promotion | sanitization evidence + policy approval + **promotion receipt** (`MemoryPromotionRequest`, `promotion/models.py`) + `approval_receipt_ref` for `active`/`primary` (inheritance validator rule 3) | distillation without `source_refs` lineage; same-generation "promotion" laundering (validator rule 6) |

Receipt discipline (INV-5): `rcpt_*` receipts are execution records emitted through Gateway→Runtime (`CortexMemoryWriteHandler.cs:107-120` emits directive/intent/decision/outcome receipts). `delib_*`, `inherit_`, narrative, and `BranchRecord` objects are **cognitive** records; receipt verification must never consult them and they must never satisfy a verification path. The Cortex-side `receipt_ref.integrity_hash` is a local anchor of an opaque Gateway id ("without claiming remote verification", `api.py:176-181`) and must not be described as remote proof.

## 4. Identity / profile / ancestry seam (AC4)

### 4.1 Authoritative role assignment — GAP, contract now, implementation in P1

No inspected surface has a role concept: Gateway `Auth/` contains only `JwtValidator`/`ApiKeyValidator`; requests carry `tenant_id`/`actor_id` (+ `correlation_id`); Cortex carries `X-Tenant-Id`/`X-Actor-Id`; the bridge carries `KEON_TENANT_ID/ACTOR_ID/AGENT_INSTANCE_ID/PLATFORM`. OPMEM requires long-lived **role** identity (D9). The contract:

1. **Role is trusted dispatch/enrollment context, never an MCP argument.** A role claim must be bound by the Gateway from (a) Foreman-dispatch context for dispatched agents, or (b) interactive enrollment for human-started Pi sessions. Any `role` field arriving in a tool argument is rejected before backend calls (negative test N-1).
2. **Foreman-dispatched sessions:** the dispatch record (issuer-validated) supplies role + generation + task scope; Gateway validates the issuer seam and mints a session-scoped binding. Missing role ⇒ **fail closed**, never default coordinator privileges (negative test N-2).
3. **Interactive Pi sessions:** explicit non-Foreman enrollment (operator-approved) with expiry and revocation; headless mode must have a pre-provisioned machine credential or refuse memory writes.
4. **Role ≠ generation ≠ agent instance ≠ session ≠ model.** All five identifiers are distinct fields everywhere (D1/plan §4). A restarted agent with the same role keeps role continuity **without** inheriting raw ancestry (see §4.3).
5. **Machine credentials** (D6): separate, revocable, shared across sessions on that machine, but they authorize *machine* trust only — not every role. Revocation/expiry must fail closed at flush time, not only at enqueue.
6. **Verified actor/role binding** (OD-5 as amended by R0 F-1): client-supplied transport headers (`X-Keon-Tenant-Id`/`X-Keon-Actor-Id`) or tool arguments may **never** override authenticated claims. Under JWT the Gateway binds claims↔request and mismatches fail closed (`JwtValidator.cs:53-62`, `MCP_TENANT_MISMATCH`); under API-key/machine credentials the actor/role is the enrollment-bound one from the credential record — the client-asserted `actorId` is never copied into the principal (the pin behavior at `ApiKeyValidator.cs:102-105` and the header precedence at `McpCallerContextResolver.cs:49-59` are defects P1a fixes). Transport-header identity spoofing and machine-credential actor spoofing fail closed before any Cortex call (negative tests N-14, N-15).

### 4.2 Portable tenant / repository identity

- Tenant identity is stable across the three machines; it is **not** derived from MAC/IP, checkout path, model, or agent lifetime (D1). Server-side `require_tenant` remains the hard gate.
- Repository identity must be canonical (portable across remotes/forks/worktrees/WSL paths/machines). Contract: repository identity = the **canonical remote identity** (host + namespace + repo) recorded at capture, with the raw absolute path retained only as a provenance hint. A bare local path is never a repository id (negative test N-3: two machines' paths for the same repo must resolve to one identity; one path hosting two repos must not merge them).
- `subject_keys`/`project` scope carried on writes is server-validated against the caller's grants; **local configuration may narrow but never widen** server grants (D2).

### 4.3 Private ancestry and shared exceptions

- Raw ancestral scope of a role is private to that role (D9). Exact-ID retrieval (`get_memory.v1`), lineage traversal (`lineage.get.v1`), feedback, and curation are all subject to the same server-side scope check **before** candidate generation and again at the response boundary (plan §3).
- Cross-role visibility is limited to: explicit handoff artifacts, owner-approved shared developer preferences, and approved general lessons. **Opaque references do not leak ancestry** (negative test N-4: possessing a `memory_id`/`lineage` pointer from another role must fail, not return metadata).
- Derived summaries (distillation) carry `source_refs` lineage and epistemic status; a derived record gains **no** factual or authorization authority from being summarized (anti-laundering, inheritance validator rule 5). Active/primary inheritance requires the approval receipt (rule 3).
- Live application/family profiles are administrative, default-deny grants outside configured scope (D16): sharing a Keon service dependency or repository never shares application memory (negative test N-5).

### 4.4 Negative fixture set (minimum; full list in `event-and-fixture-contract.md` §7)

N-1 role in tool argument · N-2 missing/foreign role ⇒ no default coordinator privilege · N-3 path-as-repository-id · N-4 cross-role exact-ID/lineage via opaque reference · N-5 service-dependency-implied sharing · N-6 machine credential used to impersonate a role it was never granted · N-7 session with expired/revoked grant attempting write at flush.

## 5. Deployment-scope rules (D16)

Profiles: `operator-developer` (broad within tenant, explicit project grants), `live-application` (isolated), `live-project-family` (explicit sharing). Admin registration of tenants/profiles is a minimal mechanism (P8); default deny outside configured scope; no implicit operator→live copying.

## 6. Operational contract (AC7)

| Concern | Frozen rule | Numeric limit status |
|---|---|---|
| Outbox (adapter-side, P6) | One durable bounded delivery store per adapter; freezes tenant/profile/role/session, content identity, event time, operation id **before** send; survives process/container/machine restart | capacity, backpressure thresholds → approval item OD-7 |
| Crash boundaries | Atomic local commit of outbox entry before send; server commit+accounting idempotent (`api_idempotency`); crash between commit/ack ⇒ **indeterminate**, reconciled by key | — |
| Lost acknowledgment | Never reported as success; never reissued under a new identity; reconciliation resolves `indeterminate`→`duplicate` or `failed` with recorded reason | reconciliation window → OD-7 |
| At-least-once transport | Effectively-once authoritative commit via server idempotency; explicitly **not** exactly-once transport | — |
| Expiry / revocation | Expired or revoked grants block at **flush**; queued work is **not re-scoped** when the user switches profile/role — it keeps its frozen identity and either flushes under its original grant or terminates with a recorded reason | grant TTL → OD-7 |
| Poison events | Bounded retries then terminal quarantine with reason; never infinite retry; never silent drop | retry bound → OD-7 |
| Role/profile switch with pending work | Pending items retain original identity; new work uses current grant; no cross-scope merging | — |
| Protocol downgrade refusal | Adapter pins `shards/1` + schema version; mismatch ⇒ fail closed, `degradation: null` | — |
| Key / epoch / worker ownership | Evidence signing key is Cortex-owned (`_evidence_signing_key`, Ed25519, `key_id` derived); epoch roots are Cortex-owned (`EpochRef`, LANE-02); background outbox worker is adapter-owned; none of these may be delegated to Pi | — |
| Migration / version / rollback | Cortex schema migration is idempotent DDL (`initialize_schema`); P2 adds tables additively; rollback = previous schema version remains readable; adapters pin schema_version at readiness | — |
| Recall/accounting boundary | Candidate generation, internal DB reads, re-rendering an existing briefing, and duplicate retry deliveries are **not** new recalls; only a genuinely new authorized delivery is (D10/plan §6) | delivery-identity definition frozen in `event-and-fixture-contract.md` §3 |
| Secrets | No credentials/secret material in payloads, queued entries, or client config JSON (bridge `README.md`) | briefing-token budget → `event-and-fixture-contract.md` §6 |
| Input size / URI hardening — **per-layer enforcement** (R0 F-5) | **Adapter (least-trusted layer; today the only enforcement):** content ≤ `KEON_MAX_CONTENT_BYTES` (32768 default, `config.py:206-208`), query ≤ `KEON_MAX_QUERY_BYTES` (4096), `artifact_uri` allowlisted to https/urn (`models.py:152-159`); `SourceRef.source_uri` carries a 2048-char cap but **no scheme check** (`models.py:89`). **Gateway boundary (required; owner P5a):** reject oversized content and non-allowlisted `source_uri`/`artifact_uri` schemes before any Cortex call (N-17/N-18). **Cortex (required defense-in-depth; owner P2):** `MemoryShardCandidate.content` has `min_length=1` and **no `max_length`** (`ingress/models.py:120`) and `SearchRequest.query` is unbounded (`api.py:49-51`) at pin; P2 adds bounded maxima via its `ingress/models.py` update | exact Gateway/Cortex bounds fixed at parcel shaping and recorded here (no silent values); adapter byte caps already exist in bridge config |
| Container/runtime | Non-root, read-only, capability-free, loopback-only publication (`ADVERSARIAL_GATE.md`); pinned base image digest + SBOM + scan are open items (bridge README item 6) | — |

## 7. Approval items raised by this contract (no silent values)

OD-4 canonical protocol election (this doc proposes shards-wire v1) · OD-5 role-binding design approval (§4.1) · OD-6 duplicate-response byte semantics · OD-7 outbox capacity/backpressure/retry/reconciliation/grant-TTL numbers · OD-8 briefing tokenizer + ≈1,000-token target + acceptance threshold (see `event-and-fixture-contract.md` §6) · OD-9 repository canonical-identity rule (§4.2). All are listed with owners in `open-decisions.md`.

## 8. What this contract does not claim

It does not claim any Azure/Neon deployment fact, any live Gateway↔Cortex call, any role mechanism exists today (§4.1 is a gap), or that the bridge's39-test shell record proves the integration gates. No fixture here is a runtime proof.
