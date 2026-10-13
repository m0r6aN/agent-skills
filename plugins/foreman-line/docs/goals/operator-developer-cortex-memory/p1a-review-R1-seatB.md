# p1a-review-R1-seatB — route `openai/gpt-6.1-sol` (read-only + bash probes in temp), dispatched by coordinator `01a131a9`

---

## VERDICT: REQUEST-CHANGES
## TEST RUN
`dotnet test tests/Keon.McpGateway.Tests`
Passed! - Failed: 0, Passed: 343, Skipped: 0, Total: 343, Duration: 7 s - Keon.McpGateway.Tests.dll (net10.0)

## FINDINGS
### F-1 [blocker] Admin enrollment bypasses role/profile isolation
- Where: `src/Keon.McpGateway/Program.cs:289-290,314,351`; `tests/Keon.McpGateway.Tests/Auth/RoleBindingTests.cs:448`
- Evidence: SQL and fallback reads enforce tenant equality only; enrollment checks capability, not record scope. A temporary probe through the real Gateway authenticated an enrolled operator-profile admin and retrieved a same-tenant live-application/foreign-role receipt with HTTP 200. The purported cross-role/operator refusal test merely checks an unenrolled actor.
- Why it matters: A known correlation ID exposes foreign-role/live-profile metadata despite T-28/N-16. No trusted role/profile stamp is persisted by the ingress emitter to support the required isolation.
- Required disposition: fix in rework — persist trusted scope and enforce it across SQL and both fallback branches; add actual cross-role/operator→live and legacy-scope refusal cases.

### F-2 [blocker] Non-Cortex-named tool bypasses the binding choke point
- Where: `src/Keon.McpGateway/GatewayOperations.cs:138`; `src/Keon.McpGateway/Tools/Collective/CollectiveHandoffDispatchHandler.cs:103`; `src/Keon.McpGateway/Backends/CortexClient.cs:268`
- Evidence: The gate covers only names beginning `keon.cortex.`. `keon.collective.handoff.dispatch.v1` calls `GetShardAsync`, while `CortexClient` permits calls without an ambient binding. A mock-backed real-Gateway probe using an issuer-valid, unbound Collective-tier JWT returned HTTP 200, made one Cortex fetch, and reached Runtime decision/execution.
- Why it matters: P1a permits an unbound caller to reach memory through a caller-supplied lineage pointer. Pre-P1b Cortex behavior permits existence validation and dispatch; P1b rejection would provide downstream protection, not the required Gateway gate.
- Required disposition: fix in rework — cover every Cortex-consuming tool and refuse unbound memory calls before sending backend requests.

### F-3 [major] Scope serialization accepts ambiguous authorization values
- Where: `src/Keon.McpGateway/Auth/RoleBinding.cs:70-78,97-116`; `src/Keon.McpGateway/Backends/CortexClient.cs:276`
- Evidence: Validation checks blankness only; canonicalization trims/sorts without validating grammar or delimiters. A JWT grant containing `role:operator-developer:role_b,role:live-application:role_live` became one P1a scope but two P1b scopes; the sibling scope matcher then authorized the foreign live record. A separate composition probe confirmed `(profile=p:q, role=r)` collides with `(profile=p, role=q:r)`.
- Why it matters: Malformed issuer/enrollment values are treated as additional grants or equivalent identities rather than failing closed. P1a also tests `memory:read`/`memory:write`, which are not the frozen scope-ID grammar and do not establish safe composition.
- Required disposition: fix in rework — validate scope IDs and identifier components before binding; reject ambiguous separators/control characters and use frozen-grammar carriage fixtures.

### F-4 [major] N-22 accepts hostile correlation IDs instead of refusing them
- Where: `src/Keon.McpGateway/Spine/IngressSpine.cs:296-318,371-375`; `tests/Keon.McpGateway.Tests/Auth/RoleBindingTests.cs:795-836`
- Evidence: Hashing confines filenames but performs no hostile-ID rejection. Real-Gateway probes with traversal, NUL-containing, and 5,000-character correlation IDs all returned HTTP 200. N-22 tests explicitly assert successful append/read for these inputs.
- Why it matters: Path traversal is prevented, but the frozen N-22 rejection requirement is not implemented; tests prove safe naming rather than the claimed fail-closed behavior.
- Required disposition: fix in rework — reject prohibited correlation IDs before backend work and fallback access, retain hashed naming/confinement, and assert refusal in served-pipeline tests.

## SEAM NOTE
The six carriage-header names and task-to-session fallback align with P1b. Composition is nevertheless unsafe for delimiter-bearing scopes and colon-bearing role/profile IDs: P1a accepts values that P1b splits or maps ambiguously, demonstrably widening visibility. The existing `memory:read`/`memory:write` fixtures do not exercise the frozen grammar. P1b’s missing-binding rejection protects the overlooked Collective route downstream, but does not satisfy P1a’s Gateway-side gate. These findings are code/test-double evidence, not deployment evidence.
