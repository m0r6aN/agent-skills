# p1a-review-R1-seatA — route `anthropic/claude-fable-5` (read-only + bash probes in temp), dispatched by coordinator `01a131a9`

---

## VERDICT: APPROVE-WITH-FIXES
## TEST RUN
`dotnet test tests/Keon.McpGateway.Tests` → `Passed! - Failed: 0, Passed: 343, Skipped: 0, Total: 343` (matches the claimed head count; base recorded 293/0/0 ⇒ +50, no regressions).
## FINDINGS
### F-1 [major] Grant-scope carriage does not reject the comma join separator — scope widening across the P1a↔P1b seam
- Where: `src/Keon.McpGateway/Auth/RoleBinding.cs:56,116` (`CanonicalGrantScopes`, `CanonicalizeScopes`), `src/Keon.McpGateway/Backends/CortexClient.cs:276`; sibling parse `cortex-p1b src/keon/cortex/tenancy/scope.py:93` (splits on `,`)
- Evidence: `CanonicalizeScopes` trims/dedupes/sorts but never rejects a scope token containing `,`. A single enrollment `GrantScopes` entry or JWT `grant_scopes` token like `op:x,role:operator-developer:role_y` is comma-joined into `X-Keon-Grant-Scopes` and P1b's parser splits it into **two** valid scope ids.
- Why it matters: one malformed/maliciously-crafted scope value becomes multiple grants server-side. Inputs are trusted-issuer/operator-config today, so not client-exploitable at pin — but the brief's hostile-input class (separator tricks) is exactly this, and the fail-closed posture requires rejecting separator-bearing tokens rather than forwarding them.
- Required disposition: fix in rework (reject or fail closed on any scope token containing `,` or whitespace after trim).
### F-2 [major] A non-`keon.cortex.*` tool reaches Cortex outside the binding gate
- Where: `src/Keon.McpGateway/GatewayOperations.cs:138` (gate is prefix `keon.cortex.` only); `src/Keon.McpGateway/Tools/Collective/CollectiveHandoffDispatchHandler.cs:103` (`_cortexClient.GetShardAsync` — exact-ID memory read)
- Evidence: `keon.collective.handoff.dispatch.v1` performs a Cortex shard fetch for lineage grounding. An unbound caller with `keon:collective:dispatch` passes the choke point (binding check skipped for non-cortex prefixes) and the Gateway issues a Cortex request with tenant/actor headers but no scope-carriage headers.
- Why it matters: the Gateway-side binding requirement is bypassable by tool name; safety rests entirely on P1b failing closed on carriage-less memory routes. Fail-closed in composition, but it is a Cortex-reaching path without the P1a gate (brief hunt #1), and S0-2a's "hard requirement at the choke point" is only prefix-deep.
- Required disposition: fix in rework (gate any tool whose handler holds a `CortexClient`, or gate at `CortexClient` itself) or explicit coordinator carry-forward to P5a with the risk recorded.
### F-3 [minor] T-1 carriage is never proven through the real request pipeline
- Where: `tests/Keon.McpGateway.Tests/Auth/RoleBindingTests.cs:208-280` (T-1 tests construct `CortexClient` directly and set `RoleBinding.Ambient` by hand); `tests/Keon.McpGateway.Tests/MockCortexServer.cs` captures only `X-Tenant-Id`/`X-Correlation-Id`
- Evidence: no test asserts `X-Keon-Role-Id`…`X-Keon-Task-Id` arriving at MockCortexServer via client→`/mcp/tools/invoke`→choke point→DI `CortexClient`. The AsyncLocal wiring (`GatewayOperations.cs:137` → `CortexClient.cs:267`) is tested only in halves.
- Why it matters: a wiring regression would silently drop all carriage headers; failure mode is fail-closed at P1b (availability, not bypass), but the central trust mechanism lacks end-to-end evidence.
- Required disposition: fix in rework (one through-pipeline test asserting carriage headers at the mock Cortex).
### F-4 [minor] N-16 T-28 "same-tenant cross-role" / "operator→live-profile" refusals proven only implicitly
- Where: `tests/Keon.McpGateway.Tests/Auth/RoleBindingTests.cs:432-462` (`N16_List_scope_only_is_403_and_admin_scope_without_enrollment_is_403`)
- Evidence: the manifest names those refusals "(SQL + fallback + legacy rows)" as distinct cases; the suite covers them with one not-enrolled→403 test plus a comment. The enrollment gate does sit before any store access, so the refusal is structurally guaranteed, but the named fixtures (e.g., an operator-profile role-bound caller, a same-tenant different-role admin) are not minted.
- Why it matters: evidence discipline — a future refactor moving the gate after the store read would not be caught by a fixture bearing those names.
- Required disposition: carry-forward to coordinator lint / next gateway parcel (add the two explicit principals as fixtures); informational for this gate.
### F-5 [info] Unauthenticated contexts still honor client identity headers; unenrolled API-key actors still reach spine receipts/usage rows
- Where: `src/Keon.McpGateway/Mcp/McpCallerContextResolver.cs:56-74`; `src/Keon.McpGateway/Auth/ApiKeyValidator.cs` (unenrolled branch)
- Evidence: with no bearer claims, `X-Keon-Tenant-Id`/`X-Keon-Actor-Id` resolve the caller context (codified by `N14_Headers_still_resolve_in_unauthenticated_contexts_without_claims`); unenrolled API-key callers' client-asserted `actor_id` still lands in directive receipts and usage attribution for non-memory tools.
- Why it matters: sanctioned by S0-3a (actor never in principal; `keon.cortex.*` fails closed — verified by `Unenrolled_machine_credential_authenticates_for_non_memory_tools_but_cortex_fails_closed`); residual actor-attribution spoofing on non-memory governance records remains until enrollment is mandatory.
- Required disposition: informational (contract-conformant; note for P8 provisioning).
### F-6 [info] FIXTURE-EDITS scope: `GatewayApplicationFactory` gained a log-capture hook beyond the literal S0-4a purpose
- Where: `tests/Keon.McpGateway.Tests/GatewayApplicationFactory.cs:28,104-111`
- Evidence: S0-4a authorizes fixture edits "so the default test principal is a properly bound caller"; the `extraLoggerProvider` parameter is new test infrastructure for the T-28 audit assertion. It is inert when unused, changes no assertion, touches no production code.
- Why it matters: coordinator lint should confirm it is listed under FIXTURE-EDITS and accept the purpose extension explicitly rather than silently.
- Required disposition: informational (coordinator ratification of the FIXTURE-EDITS entry).
### F-7 [info] Denied admin-ingress attempts are not audit-logged
- Where: `src/Keon.McpGateway/Program.cs:236-247` (403 return precedes `AuditRead`)
- Evidence: only served/empty reads log (`sql`, `fallback`, `sql+fallback`); capability-denied attempts leave no audit record.
- Why it matters: the contract requires every *read* logged (satisfied — a 403 serves no rows), but denied governance-surface probes are usually audit-worthy.
- Required disposition: informational.
## SEAM NOTE
P1a emits `X-Keon-Grant-Scopes` as sorted, de-duplicated, ordinal-sorted, comma-joined tokens from issuer-validated JWT `grant_scopes` (space-split) or enrollment config; P1b (`scope.py`) comma-splits and treats unknown scope classes as invisible, so the composition is fail-closed in the common case — a binding-less Gateway call carries no headers and P1b refuses memory routes, and nonsense scopes grant nothing. Two mismatches: (1) F-1 — neither side rejects a scope token containing the comma separator, so P1a's join and P1b's split disagree on token identity and a single crafted token widens into multiple scope ids; (2) P1a's own fixture scopes (`memory:read memory:write`, `role_operator_dev`/`operator-developer`) do not conform to P1b's scope-id grammar (`role:{profile}:{role}` / `profile:{profile}:shared` / `op:legacy`), which is safe (unknown ⇒ invisible) but means no P1a fixture would actually see a record through the composed system — cross-parcel grammar alignment is unproven on the P1a side. Additionally, the collective-handoff exact-ID read (F-2) composes safely only because P1b gates `GET /v1/shards/{id}` on the carriage headers; that dependency should be named in the Gate 3 record.
