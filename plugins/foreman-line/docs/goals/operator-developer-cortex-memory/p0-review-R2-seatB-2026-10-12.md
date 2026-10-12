# OPMEM-P0 review R2 — Seat B (adversarial security/evidence)

**Reviewed commit:** `dc010d7e` (deliverables = `ad7ba1ee`, post rework 2). **Route:** `openai/gpt-6.1-sol`, read-only tool set (`read,grep,find,ls`), `--thinking high`. **Cost:** USD 0.4254. Verbatim output follows.

---

## VERDICT: REQUEST-CHANGES

## TRIAGE VERIFICATION
T-1: PARTIAL — trusted carriage and persistence owners are named; tenant-only record identities remain unreconciled with private record scopes.
T-2: ENCODED — dispatch-head bases and sequential file handoffs are explicit.
T-3: PARTIAL — epoch deferral is explicit; served signing-key verification and its trusted registry remain unassigned.
T-4: ENCODED — the wire header is consistently `X-Idempotency-Key`.
T-5: ENCODED — P5b names the existing `tests/test_service.py`.
T-6: ENCODED — implementation, models, historical reports, and unexecuted fixtures remain distinguished.
T-7: ENCODED — tenant ownership, fallback filtering, legacy exclusion, and correlation-collision cases are required.
T-8: ENCODED — backend ownership preservation and fail-closed end-to-end checks are required.
T-9: PARTIAL — versioning and classification are explicit; access classification conflicts with the per-task repeated-fetch scoring cap.
T-10: ENCODED — governance, terminal, and action-execution receipts are separated.
T-11: PARTIAL — durable operation bindings are assigned, but their scope and conflicting-request binding are not frozen.
T-12: PARTIAL — candidate extensions are assigned; the durable record validator still rejects the elected types outside P2’s mutation authority.
T-13: PARTIAL — capabilities producer/consumer owners are named; production Gateway registration is outside P5a’s manifest.
T-14: ENCODED — the complete mandatory inventory and O-9 test-double allowance reach final validation.
T-15: PARTIAL — ingress handlers/routes are assigned; Gateway registration and adapter command exposure remain outside the relevant manifests.

## FINDINGS

### F-1 [blocker] The durable model still rejects the elected semantic writes
- Claim at issue: `memory-boundary-contract.md` §2.3 Schema; `follow-on-parcel-manifests.md` P2 Allowed Files; `open-decisions.md` OD-4.
- Reality/evidence: At `keon-cortex@50c5f42d:src/keon/cortex/core/models.py:19,132–136`, `ShardRecord` independently accepts only `claim|belief|lesson|fact|story`. `api.py:_build_record` constructs that model using the candidate’s `memory_type`. PostgreSQL restoration also constructs `ShardRecord(**raw)` at `providers/postgres/document_store.py:52`. Neither durable-model file is granted to P2. Extending only `ingress/models.py` does not make `observation`, `decision`, or `artifact_link` storable.
- Why it matters: P2’s advertised round trips cannot pass within its manifest. A builder must stop, violate mutation authority, or silently translate away the canonical semantic type.
- Required disposition: fix — assign the durable model/serialization changes and required handoffs explicitly; test ingest, restart, reload, and exact-ID round trips against PostgreSQL.

### F-2 [major] Private scopes have no reconciled record or retry identity
- Claim at issue: `memory-boundary-contract.md` §2.3 Schema/End-to-end retry identity and §4.3 Record scope; `follow-on-parcel-manifests.md` P1b/P2/P5a.
- Reality/evidence: `keon-cortex@50c5f42d:src/keon/cortex/ingress/models.py:31–59` hashes tenant/content/source/extractor version, not role/profile. `providers/postgres/schema.py` keys shards by `(tenant_id, shard_id)` and reserves each shard uniquely within the tenant. `api.py:_request_hash` adds actor but no trusted scope; ingest’s replay branch returns the stored acknowledgment. T-11 specifies an `operation_id → receipt/ack/selection` binding without freezing its authorization namespace or request fingerprint.
- Why it matters: Identical content captured privately in two roles/profiles collides with one authoritative record and receipt binding. Reusing an operation ID under another scope or changed request also has no explicit ledger-level refusal rule. This invites either incorrect capture rejection or scope laundering during reconciliation.
- Required disposition: fix — distinguish content identity from scoped record identity; freeze ledger keys and request fingerprints including original authorization context, and require current authorization before returning cached acknowledgments/selections. Add same-content/different-scope and copied-operation-ID negative fixtures.

### F-3 [blocker] New tools are not dispatchable within the exact manifests
- Claim at issue: `follow-on-parcel-manifests.md` P5a/P5b/P6; `memory-boundary-contract.md` §2.2 capabilities/event/curation mappings.
- Reality/evidence: `keon-mcp-gateway@c92e42af:src/Keon.McpGateway/Program.cs:130–175` explicitly registers concrete handlers and constructs the production `ToolRegistry` from an explicit list. P5a adds three handlers but cannot modify `Program.cs`. Creating handler files alone does not expose them. On the adapter, `D:/Repos/keon-cortex-mcp-bridge/src/keon_cortex_bridge/server.py:create_server` explicitly exposes only seven tools; `port.py:CortexPort` has no event command. Neither file belongs to P5b/P6.
- Why it matters: The capabilities and event/curation seams can pass direct handler/service tests while remaining unreachable through the shipped MCP boundaries. The adapter then remains unready or cannot submit feedback and proposal dispositions.
- Required disposition: fix — grant production registration under T-2 and freeze the adapter command exposure with its owning files. Require discovery and invocation tests through both actual MCP servers, not manually assembled handler registries.

### F-4 [major] Exact-ID retrieval maps to a tool that returns no memory
- Claim at issue: `memory-boundary-contract.md` §2.2 `get_memory.v1` mapping and “Gateway-only tools” paragraph.
- Reality/evidence: `keon-mcp-gateway@c92e42af:src/Keon.McpGateway/Tools/Cortex/CortexLineageGetHandler.cs:InvokeAsync` returns only shard ID, lineage hash, ancestor IDs, and correlation ID. The content-bearing exact-ID tool is `CortexReceiptGetHandler.cs:InvokeAsync`, which calls `CortexClient.GetShardAsync` and returns shard content. It is not an action-execution receipt lookup, despite the contract’s description; that tool is expressly excluded from adapter routing.
- Why it matters: P5b cannot implement `get_memory` literally from the frozen mapping without inventing a Gateway surface, repurposing lineage, or violating the adapter exclusion. N-4/N-10 exact-ID checks risk exercising a metadata route instead of the content route.
- Required disposition: fix — elect a concrete adapter-reachable scoped exact-ID tool and correct `receipt.get.v1`’s classification. Freeze its content/ownership response and test it end to end.

### F-5 [major] Signing-key rejection remains a proof helper, not a served verification contract
- Claim at issue: `event-and-fixture-contract.md` §9 N-13; `pilot-and-validation-contract.md` S-5; `open-decisions.md` OD-19.
- Reality/evidence: `keon-cortex@50c5f42d:src/keon/cortex/api.py:evidence` signs and exports a pack; it does not verify against a trusted key registry. `proof/governed_signing.py:verify_receipt` rejects unknown/revoked keys only when supplied a registry. Its inspected callers are proof checks using temporary dictionaries. Gateway `CortexEvidenceGetHandler.cs:InvokeAsync` merely exports the pack/signature/key ID. No follow-on seam assigns the production registry, revocation-state source, or served verifier.
- Why it matters: Re-scoping away epoch proofs does not make N-13 executable through `verify_memory`. Proof regeneration can pass while an unknown/revoked backend key is still exported or accepted as “verified.”
- Required disposition: fix — assign the served verifier and authoritative public-key/state source, including provisioning and fail-closed behavior. Require N-13 through the real exposed verification path.

### F-6 [major] Caller-controlled correlation IDs remain filesystem paths
- Claim at issue: `memory-boundary-contract.md` §2.1 admin contract; `follow-on-parcel-manifests.md` P1a ingress-spine repair; `event-and-fixture-contract.md` N-16.
- Reality/evidence: `keon-mcp-gateway@c92e42af:src/Keon.McpGateway/Mcp/McpCallerContextResolver.cs:Resolve` accepts `X-Correlation-Id`; `Contracts/Models.cs:CorrelationIdHelper.ResolveOrCreate` returns nonblank values unchanged. `Spine/IngressSpine.cs:244,250,261` places that value into a filesystem path and appends/reads it. When fallback is enabled, an absolute path or traversal-bearing correlation ID can escape the fallback directory.
- Why it matters: Tenant-filtering fallback rows does not prevent authenticated callers from appending receipt-shaped data to other writable `.jsonl` paths. That compromises the receipt-storage boundary independently of the cross-tenant SQL repair.
- Required disposition: fix — derive a bounded safe basename from tenant plus correlation identity, enforce directory confinement, and add hostile absolute-path/separator/traversal cases to the mandatory fallback fixtures.

### F-7 [major] Changing a briefing’s companions can amplify one repeatedly fetched memory
- Claim at issue: `event-and-fixture-contract.md` §1 access occurrence classification, §2 rules 1/4, §3 delivery identity, and §7 G-2/G-7/G-10.
- Reality/evidence: The contract classifies every `access` as a content occurrence and counts recall once per delivery. A changed `content_set_hash` creates a new delivery even within the same logical task. Thus deliveries `[M,A]`, `[M,B]`, `[M,C]` create repeated access/recall inputs for M, although §2 rule 4 caps repeated fetches of one record by one task as one scoring influence. At `keon-cortex@50c5f42d:src/keon/cortex/gravity/function.py:_occurrence/_recency/_recall`, the preserved mathematics consumes event counts/timestamps. G-10 forbids association from companions but does not test this occurrence/recall amplification.
- Why it matters: A caller can refresh or reinforce M by varying unrelated companions without independent application or outcome evidence. The new classification and the duplicate-resistance promise prescribe incompatible scoring inputs.
- Required disposition: fix — reconcile T-9 explicitly, distinguishing recorded delivery activity from deduplicated scoring influence. Add a served-scorer fixture for repeated M across changing content sets in one task; obtain an amendment if the elected classification must change.

## MISSING PIECE / SILENT COLLISION
The authoritative evidence-resolution seam for `supported` attribution, observed outcomes, and an “executed `target_ref`” remains unspecified. T-10 correctly separates receipt meanings, but T-15 assigns event persistence—not resolution of an external receipt/evidence reference to verified execution, scope, target, and outcome. `CortexReceiptGetHandler` retrieves a memory shard, not an execution receipt; Cortex’s `_receipt_ref` is explicitly only a local opaque-ID anchor. Assign this verifier and rejection fixtures before P3/P4 so forged references or tool-terminal denial receipts cannot support an invented outcome or association edge.
