# OPMEM-P0 review R1 — Seat B (adversarial security/evidence)

**Reviewed commit:** `d8d3a8fc` (deliverables identical to `de7ec59a`). **Route:** `openai/gpt-6.1-sol`, `pi -p --mode json --no-session --tools read,grep,find,ls --thinking high` (read-only tool set). **Cost (per-message usage.cost.total):** USD 0.4973. **Dispatched by:** coordinator `01a131a9`. **Family independence:** author Xiaomi mimo, rework-1 builder Moonshot kimi-k3, Seat A Anthropic, Seat B OpenAI — all distinct. Verbatim output follows.

---

## VERDICT: REQUEST-CHANGES

## R0 FIX VERIFICATION
R0 F-1: FIXED — header/API-key spoofing is acknowledged; enrollment-bound identity, enforcement files, and N-14/N-15 are assigned.
R0 F-2: PARTIAL — inventory, owner, and N-16 were added, but tenant ownership of ingress events and fallback reads remains unresolved.
R0 F-3: FIXED — first-delivery anchoring and logical-session continuation semantics now align with F-8.
R0 F-4: FIXED — association-edge classification and G-10 explicitly exclude co-delivery/co-recall.
R0 F-5: FIXED — authoritative-layer bounds/URI responsibilities and N-17/N-18 are assigned.
R0 F-6: FIXED — optional idempotency, mandatory receipt gate, and the health-envelope exception are corrected.
R0 F-7: FIXED — `gravity/contracts.py` is granted to P3 and one classification authority is elected.
R0 F-8: FIXED — G-11/G-12, O-8/O-9, and N-19 were added; their execution-gate propagation has a separate defect below.
R0 F-9: FIXED — outcome statuses include `unknown`/`not_executed` and prohibit fabricated failure.
R0 missing piece: PARTIAL — P2 owns the Cortex schema signal, but no Gateway-mediated delivery of that signal to the adapter is frozen.

## FINDINGS

### F-1 [blocker] P1b cannot enforce private scopes on the served paths within its manifest
- Claim at issue: `follow-on-parcel-manifests.md`, P1b; `memory-boundary-contract.md` §4.1–§4.3.
- Reality/evidence: P1b can modify only `tenancy/enforcement.py`, add `tenancy/scope.py`, and add helper tests. At `keon-cortex@50c5f42d:src/keon/cortex/api.py:138–145`, caller context is only tenant/actor; search and exact-ID/lineage/evidence routes at `:515–608` authorize by tenant alone. `tenancy/enforcement.py:require_tenant` receives neither caller grants nor record scope. `keon-mcp-gateway@c92e42af:src/Keon.McpGateway/Backends/CortexClient.cs:AddTenantHeaders` forwards no profile/role grant.
- Why it matters: helper tests can pass while same-tenant cross-role and operator-to-live reads remain unrestricted. P1b dispatched as granted cannot establish its claimed endpoint enforcement or pre-candidate filtering.
- Required disposition: fix — freeze trusted grant transport and persisted record-scope fields, assign served-path integration files, and require HTTP-level same-tenant cross-role/profile tests. Alternatively label P1b model-only and explicitly block served access until a named integration parcel closes the seam.

### F-2 [major] Tenant-predicating the admin SQL query does not close its other read paths
- Claim at issue: `memory-boundary-contract.md` §2.1 admin contract; `event-and-fixture-contract.md` N-16; `follow-on-parcel-manifests.md`, P1a.
- Reality/evidence: `keon-mcp-gateway@c92e42af:src/Keon.McpGateway/Program.cs:278–325` returns `IngressSpineFallbackStore.ReadAsync` results both after an empty SQL result and after SQLite failures. `Spine/IngressSpine.cs:253–296` reads correlation-named files without tenant filtering. Its SQL schema at `:154–164` has no tenant column; `AppendIntentAsync`, `AppendOutcomeAsync`, and `OutcomeFactory` do not attach tenant identity to those event payloads. Only directive payloads have it.
- Why it matters: an SQL-only repair can leave a cross-tenant fallback leak. Deriving ownership merely from a correlation ID also fails when different tenants reuse that caller-controlled ID.
- Required disposition: fix — define tenant ownership for every persisted event and every fallback response, amend the manifest if persistence changes are needed, and add N-16 cases for empty SQL results, unavailable SQLite, and mixed-tenant correlation collisions. Unbound legacy rows must fail closed.

### F-3 [major] Gateway projection launders mixed-tenant rows into the caller's tenant
- Claim at issue: `memory-boundary-contract.md` §2.3 Response; `event-and-fixture-contract.md` N-10.
- Reality/evidence: `keon-mcp-gateway@c92e42af:src/Keon.McpGateway/Backends/CortexClient.cs:CortexShardSummary/ParseShardSummary` discards the backend row's tenant identity. `Tools/Cortex/CortexMemorySearchHandler.cs:InvokeAsync` then sets every returned row's `tenant_id` to `context.Request.TenantId`, irrespective of the original row. The adapter's checks in `D:/Repos/keon-cortex-mcp-bridge/src/keon_cortex_bridge/service.py:recall` therefore cannot detect that upstream substitution.
- Why it matters: the stipulated hostile mixed-tenant response can pass the adapter's tenant checks. Echoing caller identity is not evidence of record ownership.
- Required disposition: fix — P5a must preserve and validate backend ownership before projection, reject missing/conflicting scope attributes, and never synthesize ownership from the caller. Execute N-10 through the actual client→handler→adapter path, including mixed rows and foreign exact-ID responses.

### F-4 [major] New scoring semantics are assigned the old scorer's identity
- Claim at issue: `event-and-fixture-contract.md` §1 and §7; `follow-on-parcel-manifests.md`, P3.
- Reality/evidence: §1 requires new `gravity/1.x` occurrence semantics, but §7 pins **all** fixtures to `gravity/1.0.0`. At `keon-cortex@50c5f42d:src/keon/cortex/gravity/function.py`, `_occurrence` and `_recency` classify by `not e.is_recall`, while `_neighbor_pulls` considers all correlated event kinds. Its function hash covers version and parameters, not the newly elected classification rules. P3 does not grant this scorer file or explicitly elect a separately versioned replacement.
- Why it matters: G-6/G-10/G-11 cannot describe the unchanged 1.0.0 scorer. A builder can implement different extraction semantics while emitting the historical version/hash, defeating G-8/G-9 replay discipline. Adding the property alone does not make existing consumers use it.
- Required disposition: fix — freeze the new projection/scorer version and classification pin, its production integration owner, and preservation of the original 1.0.0 implementation. Run neutrality/association fixtures against the served scorer, not just classification helpers. Explicitly classify all event kinds, including access, application, outcome, and supersession.

### F-5 [major] Denied actions legitimately have receipts, contrary to F-11
- Claim at issue: `event-and-fixture-contract.md` §5 F-11; `memory-boundary-contract.md` §3 receipt discipline.
- Reality/evidence: F-11 requires “no `rcpt_*` exists,” and the boundary broadly calls `rcpt_*` execution records. However, `keon-mcp-gateway@c92e42af:src/Keon.McpGateway/Tools/Cortex/CortexMemoryWriteHandler.cs:107–120` returns directive, intent, decision, and outcome references on denial. `Spine/InvokeTerminalWriter.cs:FinalizeAsync` persists the terminal outcome; `Spine/IngressSpine.cs:OutcomeFactory.FromSuccess` explicitly represents `terminal_status=denied` with a null execution receipt. The ingest anchor is `decision.ReceiptId`, not the Gateway outcome receipt claimed in boundary §3.
- Why it matters: prefix-based interpretation either discards real governance evidence or treats a denied tool invocation's terminal receipt as proof an action executed. This can invent observed utility/outcomes for unexecuted branches.
- Required disposition: fix — distinguish governance, tool-terminal, and action-execution receipts by verified type and semantics, not prefix. Preserve denial receipts while requiring no action execution/observed action outcome. Correct the ingest anchor description and F-11.

### F-6 [major] End-to-end retry identity is not preserved across governance and recall
- Claim at issue: `memory-boundary-contract.md` §2.3 Idempotency and §6 Lost acknowledgment; `event-and-fixture-contract.md` F-8/O-3/O-4.
- Reality/evidence: `keon-mcp-gateway@c92e42af:src/Keon.McpGateway/Tools/Cortex/CortexMemoryWriteHandler.cs:InvokeAsync` calls Runtime decide again on each invocation. `Runtime/RuntimeClient.cs:RuntimeDecideRequest/DecideAsync` carries no idempotency key or guaranteed receipt-reuse contract. Cortex `api.py:_verify_replay` requires the original receipt ID as well as the request hash; a fresh decision receipt makes a same-key retry conflict. For recall, `CortexClient.cs:SearchAsync` forwards no operation/idempotency identity, and the frozen delivery tuple depends on a result-set hash obtained only after selection. The documented ingest header is also `Idempotency-Key`, whereas the actual wire uses `X-Idempotency-Key`.
- Why it matters: a lost-ack write can be committed yet fail reconciliation; a recall retry can select a changed content set and acquire another accounting identity. Server-local idempotency does not establish O-4 or F-8 through the real Gateway.
- Required disposition: fix — freeze durable operation→original receipt/ack binding for writes and operation→original selection/recall-event binding for recalls, with scoped reconciliation and flush-time reauthorization. Assign the implementation files and test fresh Runtime receipts, changed recall candidates, concurrent retries, and restart recovery.

### F-7 [major] Canonical semantic writes are rejected by the elected shards schema
- Claim at issue: `memory-boundary-contract.md` §2.2 canonical mapping; `follow-on-parcel-manifests.md`, P2/P5a.
- Reality/evidence: the mapping mandates `memory_type=observation`, `decision`, and `artifact_link`. `keon-cortex@50c5f42d:src/keon/cortex/ingress/models.py:MemoryShardCandidate.validate_memory_type` accepts only `claim|belief|lesson|fact|story`; the Gateway write input schema has that same enum. The native source field is a string, and the frozen native candidate does not carry the bridge's structured source, decision status, checkpoint time, or lineage references. The P2 schema update is described as size hardening, not the required semantic extension.
- Why it matters: literal conformance produces rejected writes; ad-hoc conversion loses the provenance and branch/status evidence the fixtures require. The baseline has not actually resolved this proposed-versus-native mismatch.
- Required disposition: fix — elect and version the complete semantic encoding, including required evidence/provenance fields, and assign its schema/persistence changes before P5 integration. Add round-trip fixtures proving these fields survive authoritative storage rather than being silently ignored or flattened.

### F-8 [major] The adapter cannot receive the new Cortex handshake through its sole ingress
- Claim at issue: `open-decisions.md` OD-17; `memory-boundary-contract.md` §2.3 Readiness/Version; `pilot-and-validation-contract.md` S-10.
- Reality/evidence: P2 adds a signal only to Cortex `/health`. At `keon-mcp-gateway@c92e42af:src/Keon.McpGateway/Program.cs:191–199`, Gateway `/health` reports Runtime status, not Cortex readiness/version. `Backends/CortexClient.cs` exposes no health/capability forwarding operation. The adapter's `D:/Repos/keon-cortex-mcp-bridge/src/keon_cortex_bridge/http_port.py:health` calls its configured ingress URL; the topology forbids a direct Cortex call. No manifest explicitly owns a Gateway handshake surface.
- Why it matters: the adapter either checks Gateway liveness instead of Cortex compatibility, stays permanently unready, or violates the sole-ingress boundary. Adding the producer field alone does not make downgrade refusal implementable.
- Required disposition: fix — freeze a Gateway-mediated readiness/capability response, assign its public surface and forwarding files, and require the adapter to validate authoritative Cortex protocol/schema readiness. Test an incompatible Cortex behind a healthy Gateway.

### F-9 [major] Newly added safety fixtures are absent from the mandatory execution ranges
- Claim at issue: `pilot-and-validation-contract.md` §1/§4; `follow-on-parcel-manifests.md`, P3/P6/P9.
- Reality/evidence: deterministic verification still specifies G-1…G-9, O-1…O-7, and N-1…N-13. P3 still names G-1…G-9; P6 and S-8 still name O-1…O-7. Thus G-10…G-12, O-8/O-9, and N-19 have no explicit mandatory execution gate. P1a/P5a separately cover some newer N fixtures, but that does not repair the final validation inventory.
- Why it matters: a claimed green no-skip validation can omit co-delivery association, contextual score-neutrality, missing-feedback stability, saved-before-ack honesty, cache accounting, or locally widened grants—the exact protections added during rework.
- Required disposition: fix — propagate the complete fixture inventory into parcel evidence requirements and P9 acceptance. Future-cache behavior may use a deterministic test double, but must not disappear through an undocumented applicability exemption.

## MISSING PIECE / SILENT COLLISION
The **event/curation command-ingress seam has no end-to-end owner**. `memory-boundary-contract.md` §2.2 says promotion needs a P4 route, yet P4a/P4b cannot modify `api.py` or storage schemas. Feedback, correction/supersession, and proposal disposition likewise have no frozen Gateway tool/wire/ack mapping; P3 adds accounting modules, not a served ingress. The pinned `keon-cortex:src/keon/cortex/api.py` has no such routes, and P2 is the sole API/schema mutation owner. Assign and freeze this seam before P3/P4/P7 so F-9/F-12/N-12 are exercised through authenticated durable operations rather than model-only helpers.
