# p1a-review-R2-seatB — route `openai/gpt-6.1-sol`, dispatched by coordinator `01a131a9`

---

## VERDICT: REQUEST-CHANGES
## TEST RUN
`dotnet test tests/Keon.McpGateway.Tests`
`Passed! - Failed: 0, Passed: 390, Skipped: 0, Total: 390`

`dotnet build --no-restore`
`Build succeeded. 3 Warning(s), 0 Error(s).`

Additional probes were created and executed only under the system temp directory.

## TRIAGE VERIFICATION
- **P1a-T1: PARTIAL** — Trusted role/profile stamps and SQL/fallback allow-list filtering are implemented. The required cross-role and legacy-row served-path fixture matrix remains incomplete; see F-4.
- **P1a-T2: IMPLEMENTED** — Every public Cortex client operation checks the ambient binding before network access; the unbound collective-handoff pipeline test observes zero Cortex requests.
- **P1a-T3: PARTIAL** — Separator rejection and grammar-conformant fixtures are implemented, but malformed whitespace/control values still obtain bindings; see F-1.
- **P1a-T4: PARTIAL** — Ordinary traversal, path, NUL and over-length cases are refused, but whitespace-only hostile IDs bypass validation. JSON-RPC refusals also return HTTP 200 rather than the prescribed 400; see F-2.
- **P1a-T5: IMPLEMENTED** — A served invocation captures all six carriage headers with exact expected values.
- **P1a-T6: PARTIAL** — Named operator-profile and role-restricted admin fixtures exist, but role-restricted fallback cases are absent; see F-4.
- **P1a-T7: PARTIAL** — Authentication, enrollment and invalid-correlation denials are audited, but early validation and disabled-spine returns escape auditing; see F-3.

## FINDINGS
### F-1 [blocker] Malformed authorization context is repaired into a usable binding
- Where: `src/Keon.McpGateway/Auth/RoleBinding.cs:47-59,102-122,142-155,171-186`
- Evidence: A served Cortex-search invocation with an issuer-valid JWT containing `grant_scopes="\tprofile:live-application:shared\r\n"` returned HTTP 200 and made one Cortex request carrying `X-Keon-Grant-Scopes: profile:live-application:shared`. Enrollment resolution likewise accepts this malformed token after trimming. Whitespace-only scope entries are silently dropped. Separate probes showed `IsValidIdentifier("role_x\n") == true`, a non-null JWT binding with that role, and whitespace-only optional task/session values being replaced or discarded.
- Why it matters: T-35 explicitly requires rejection, not repair or omission. A malformed cross-profile grant becomes an effective authorization grant before Cortex sees it. Additionally, .NET’s `$` anchor permits a terminal LF, so the identifier check does not enforce the stated alphabet over the complete value.
- Required disposition: **fix in rework** — Validate complete raw values using strict end-of-input matching; do not trim/drop malformed scope tokens. Preserve only legitimate JWT space delimiters and distinguish absent optional IDs from supplied malformed IDs. Add served JWT and enrollment rejection tests for these inputs.

### F-2 [major] Whitespace-only hostile correlation IDs still reach the backend
- Where: `src/Keon.McpGateway/Mcp/McpCallerContextResolver.cs:175-180`; `src/Keon.McpGateway/GatewayOperations.cs:108-118`; `src/Keon.McpGateway/Mcp/McpProtocolHandler.cs:173-183`
- Evidence: Served REST invocations with `correlation_id` equal to eight tabs or 129 spaces both returned HTTP 200 and each invoked Runtime. `IsNullOrWhiteSpace` returns success before checking controls or length; normalization then replaces the supplied value. A JSON-RPC request with `X-Correlation-Id: aaaaaaaa..bbbb` returned HTTP 200 with error `-32602`, not HTTP 400.
- Why it matters: These inputs violate P1a-T4’s explicit refusal rule. Hashing/reminting prevents traversal, but does not satisfy rejection before backend access.
- Required disposition: **fix in rework** — Check supplied values for controls and length before treating them as absent, and provide the prescribed HTTP 400 for hostile correlation IDs through both served transports.

### F-3 [minor] Some admin attempts produce no required audit record
- Where: `src/Keon.McpGateway/Program.cs:216-243,296-303,431-441`
- Evidence: Served probes observed `actor_id=%20` returning HTTP 400 with zero admin-audit entries, and an authenticated, enrolled admin reading while the spine was disabled returning HTTP 404 with zero admin-audit entries. These returns bypass `AuditDenied`/`AuditRead`; the busy-store return does likewise.
- Why it matters: P1a-T7 and T-28 require denied-attempt and every-read auditing. Current tests cover only selected branches, leaving unsuccessful probing and operational failures unrecorded.
- Required disposition: **fix in rework** — Audit every handler exit, including input validation, disabled storage and busy-store responses; add corresponding log-capture tests.

### F-4 [minor] The required admin isolation fixtures do not cover every served branch
- Where: `tests/Keon.McpGateway.Tests/Auth/RoleBindingTests.cs:864-888,1103-1163`
- Evidence: The role-restricted admin test exercises SQL only. Neither fallback branch is exercised with an allowed profile but forbidden role. The SQL legacy test uses a NULL tenant, so tenant filtering alone satisfies it; the tenant-stamped/profile-unstamped fallback test calls `ReadAsync` directly rather than the admin endpoint.
- Why it matters: The filters appear implemented, but the mandatory N-16/T-28 evidence cannot detect removal of role filtering from fallback reads or profile filtering from tenant-stamped legacy reads.
- Required disposition: **fix in rework** — Add endpoint tests for forbidden-role rows through both fallback branches and tenant-stamped/profile-unstamped legacy rows through SQL and fallback paths.

## SEAM NOTE
Grammar-conformant P1a bindings emit the canonical scope IDs P1b expects, and the client-level binding gate now covers Cortex consumers outside `keon.cortex.*`. However, F-1 repairs malformed grants before carriage: Cortex receives a valid cross-profile scope and cannot detect the invalid source value. P1a must reject that source context to satisfy the fail-closed seam.
