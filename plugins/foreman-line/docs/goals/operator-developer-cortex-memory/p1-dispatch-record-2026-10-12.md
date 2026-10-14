# OPMEM-P1a / P1b — dispatch record and Step 0 rulings

**Coordinator:** `01a131a9` (owner-delegated Gate 2). **Shaping:** performed by the coordinator directly from the dual-reviewed P0 manifests (no separate shaping session — recorded deviation; the manifests are the spec). Kickstarters: `p1a-build-kickstarter.md`, `p1b-build-kickstarter.md`. Tracking: #201 (P1a), #202 (P1b), parent #200.

| | P1a | P1b |
|---|---|---|
| Repo / worktree | `Keon-Systems/keon-mcp-gateway` / `D:/Repos/opmem-worktrees/gateway-p1a` | `Keon-Systems/keon-cortex` / `D:/Repos/opmem-worktrees/cortex-p1b` |
| Branch | `feat/opmem-p1a-role-binding` | `feat/opmem-p1b-scope-enforcement` |
| Verification base (T-2) | `c92e42afeb84a5f425c282cfc9c7637f3e058fd4` = `opmem/integration` head (branch created 2026-10-12 from the pin) | `50c5f42d297848148123519cb1607c079782ba43` = `opmem/integration` head |
| Suite baseline at base (T-20) | `dotnet test tests/Keon.McpGateway.Tests` → 293 passed / 0 failed / 0 skipped | `pytest -q` (Py 3.12 venv, Windows, no PG/Mongo) → 1869 passed / 110 skipped / 0 failed |
| Builder route | `opencode-go/kimi-k3` (Moonshot), session id in dispatch scratch | `opencode-go/kimi-k3` (Moonshot), separate session |
| Review routes (planned) | Seat A `anthropic/claude-fable-5`, Seat B `openai/gpt-6.1-sol` | same |
| Step 0 cost (USD) | 0.9564 | 0.7094 |

## Step 0 rulings — P1a

- **S0-1a (amendment, N-1 choke point + tenant threading):** Allowed Files += UPDATE `src/Keon.McpGateway/GatewayOperations.cs` and UPDATE `src/Keon.McpGateway/Spine/InvokeTerminalWriter.cs`. Both `/mcp` JSON-RPC (`McpProtocolHandler.cs:192`) and REST (`Program.cs:365`) converge on `GatewayOperations.HandleToolsInvokeAsync` — it is the single choke point for (i) rejecting role-like keys in tool arguments before any backend call (N-1) and (ii) requiring a verified `RoleBinding` for every `keon.cortex.*` tool (fail closed). Tenant is threaded explicitly into intent/outcome spine appends; the proposed in-memory correlation→tenant map is **rejected** (lost on restart, wrong under multiple instances). Neither file appears in any other manifest — no collision.
- **S0-2a (binding flow):** the verified binding reaches `CortexClient` through an ambient per-request accessor set at the choke point (no P5a handler edits). `CortexClient` emits the six headers when a binding is present. The hard requirement is at the choke point; P5a later threads it explicitly.
- **S0-3a (unenrolled API keys):** may still authenticate for non-memory tools, but the client-asserted actor is never placed in the principal, and they can never obtain a binding ⇒ `keon.cortex.*` fails closed. Approved as proposed.
- **S0-4a (existing tests):** if the binding requirement makes existing Cortex-tool tests fail closed, the builder may make **mechanical fixture-only** edits to existing test helper/fixture files (token issuer defaults, factory configuration, enrollment config) so the default test principal is a properly bound caller; **no assertion may be changed**. Every such file is listed under `FIXTURE-EDITS` in the report; coordinator lint verifies the diff is fixture-only. N-2 tests must still mint unbound tokens explicitly.
- Everything else in the Step 0 design table approved (config-backed enrollment; JWT claims `role_id`, `role_generation`, `profile_id`, `grant_scopes` space-delimited, `session_id`, `task_id`; admin capability + `AdminEnrollment`; SQLite additive `ALTER TABLE … ADD COLUMN tenant_id` guarded by `PRAGMA table_info`; hashed fallback names).

## Step 0 rulings — P1b

- **S0-1b (scope algebra):** approved as proposed (`role:{profile}:{role}`, `profile:{profile}:shared`, `op:legacy`; classes `role_private`/`profile_shared`/`legacy`; unknown class ⇒ invisible; generation not a matching input). One change: the operator profile id is read from `CORTEX_OPERATOR_PROFILE_ID` (default `operator-developer`), never from request input.
- **S0-2b (persistence):** `Provenance.extra` + Postgres `GENERATED ALWAYS … STORED` columns inside the single `SCHEMA_SQL` string — approved.
- **S0-3b (status codes):** missing role/profile ⇒ 403 before store access; out-of-scope exact-ID/lineage/evidence/replay ⇒ 404 (no existence leak) — approved; validation order `_context` → existing gates → scope gate — approved.
- **S0-4b (amendment, existing tests):** Allowed Files += UPDATE `tests/test_api.py`, limited to the **mechanical** addition of the six carriage headers to its header fixtures; assertions and semantics unchanged. If any other existing test file calls memory routes and needs the same mechanical change, the builder may apply it and must list it under `FIXTURE-EDITS`; coordinator lint verifies.
