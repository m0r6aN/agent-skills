# Targeted local Docker client refresh and authentication result

Under direct owner authorization, a fixed fresh child loaded the replacement
MCP_GATEWAY_AUTH_TOKEN from Windows User into an otherwise cleared environment
with an explicit OS allowlist. The inherited old token was not used for requests.
No value, prefix or credential hash was emitted or retained in evidence.

At 2026-10-22T13:52:08.5516623Z the isolated check completed successfully:

- No Authorization header: HTTP 401.
- Synthetic invalid bearer, unrelated to any real old credential: HTTP 401.
- Saved replacement bearer: HTTP 200 with a valid initialize result, server
  Docker AI MCP Gateway, negotiated protocol 2025-03-26.
- The sole owned gateway listener bound to 127.0.0.1:8811. Its process was stopped
  after the check, and the target listener was absent afterward.

Evidence: evidence/gateway-isolated-auth-refresh-passed-20261022.json.
Only health, authentication rejection and initialize requests were made. No tool
invocation, provider request, model usage or paid dispatch occurred.

## Isolation and preserved failure evidence

The installed Docker MCP v0.44.1 executable ran directly with private empty
catalog, registry, config, tools and secrets files. Dynamic tools, OAuth,
watching, call logging and telemetry were disabled. No catalog server was enabled
or Docker container launched. No unrelated stdio process was restarted. The
saved development launcher was not used: it binds all interfaces and selects a
development profile, which would exceed this isolated check.

Earlier unsuccessful steps are retained, not counted as successful authentication:

1. gateway-isolated-auth-refresh-20261022.json: wrapper launch did not become ready.
2. gateway-isolated-auth-refresh-diagnostic-20261022.json: wrapper exit125,
   unknown-flag diagnostic; exact flag attribution was not established.
3. gateway-isolated-auth-refresh-direct-20261022.json: direct launch exit2;
   a token-free dry-run reproduced missing ProgramData startup panic.
4. gateway-isolated-auth-refresh-qualified-20261022.json: after allowing that OS
   path, empty tools YAML had the wrong shape; token-free dry-run diagnosed it.
5. gateway-isolated-auth-refresh-final-20261022.json: gateway started and both
   rejection checks passed; initialize returned415. Setting exact application/json
   without a charset produced the final200 result on the next bounded instance.

Every instance exited or was stopped; no target listener remained after a check.
Credential-bearing stdout/stderr stayed in transient memory and were discarded;
only closed diagnostic flags were retained. The final capture contained no exact
replacement-token match. This is not a claim about arbitrary old contexts or
broader transcript retention.

## Disposition

PASS applies to the fixed fresh client and empty loopback gateway configuration.
It does not validate the development profile, enable tools, refresh the shared
Codex parent, or close the provider-key incident. The shared tool parent is still
stale and must not supply its inherited token to any launch or request. No route
release or new credential-bearing worker admission is recorded here.

Future intended-client launches must explicitly load the saved replacement with
the required isolated environment rather than inherit the stale parent. A full
parent restart would affect other sessions and is unnecessary for this scoped
check; it was not performed. Oversight retains the names-only rotation runbook
and broader incident disposition. No Azure trust/key changes were made.
