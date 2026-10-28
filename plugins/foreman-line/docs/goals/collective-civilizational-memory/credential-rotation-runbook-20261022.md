# P2B credential incident: names-only rotation checklist

Post-restart correction, October22 New York (2026-10-23T01:42:54.5741231Z):
owner reported restarting the goal/process. The current tool process and saved
Windows User MCP_GATEWAY_AUTH_TOKEN are both present and equal by boolean-only
check. No values were emitted, no auth request made, and ports8811/8812 have no
listener. Evidence: evidence/gateway-parent-postrestart-check-20261022.json.
The stale-parent statement below is historical for the earlier process, not the
current one. This resolves current-process inheritance only; native Pi/profile
admission, provider cleanup and broader incident remain open. No route release.
Oversight chat is archived; no duplicate monitor or investigation was revived.

Status: OPEN. The local Docker MCP gateway token was replaced in Windows User environment at 2026-10-22 13:28:49 UTC. Isolated child authentication PASSED at 13:52:08 UTC; fresh resolution of the saved normal-project URL/header templates PASSED at 14:01:26 UTC. The shared ChatGPT/Codex app parent remains stale, and native Pi/development-profile admission is not established; affected routes/workers remain HELD. No provider-key revocation, task-token invalidation or transcript erasure is claimed. This document contains no credential values.

## Direct owner clarification — 2026-10-22

Clinton answered the consolidated ownership question: "I created MUSE_API_KEY, LIQUID_API_KEY, NACE_API_KEY, and TYPESAFE_API_KEY. MCP_GATEWAY_AUTH_TOKEN is issued by the gateway."

- Account/key custodian for those four provider variables: Clinton. TypeSafe direct Jev service is identified; MUSE/LIQUID/NACE service locators are recorded below from his subsequent answer.
- MCP_GATEWAY_AUTH_TOKEN was initially described as gateway-issued. The later local Docker client trace below identifies its current binding and local saved-token replacement. Do not treat it as a provider API key or revoke an unrelated gateway signing key.
- Ownership is resolved to that extent; do not repeat the consolidated ownership question. Rotation/revocation has NOT been reported or verified. Keep affected secret routes held.

### Direct issuer locators supplied by Clinton

- MUSE_API_KEY: Meta, https://dev.meta.ai/api-keys
- LIQUID_API_KEY: Liquid, https://console.liquid.ai/dashboard
- NACE_API_KEY: Nace, https://console.nace.ai/dashboard/api-keys
- MCP_GATEWAY_AUTH_TOKEN: Keon MCP Gateway at https://keon-mcp-gateway.redrock-24997c6f.eastus2.azurecontainerapps.io ; repository D:/Repos/keon-omega/keon-mcp-gateway.

These resolve the service/dashboard questions, not the revocation status. Liquid/Nace authenticated controls were not observed through the web reader; Meta public URL redirected to its landing page. No exact unseen button labels are asserted. Use each signed-in account's existing API-key list to create a replacement and revoke the old key through its supported action.

## Affected names

- OPENAI_API_KEY
- OPENROUTER_API_KEY
- OPENCODE_API_KEY
- XAI_API_KEY
- MUSE_API_KEY
- CEREBRAS_API_KEY
- LIQUID_API_KEY
- NACE_API_KEY
- TYPESAFE_API_KEY
- MCP_GATEWAY_AUTH_TOKEN
- BROWSER_USE_ACCESS_VERIFYING_IDENTITY
- CODEX_TASK_WORKSPACE_VERIFYING_IDENTITY

CORRECTION after targeted metadata classification: both current parent IDENTITY values are DER SubjectPublicKeyInfo Ed25519 PUBLIC verification keys. The installed OpenAI browser-access service explicitly imports BROWSER_USE_ACCESS_VERIFYING_IDENTITY as a public SPKI key and verifies signed payloads. They are not established bearer secrets and should not require secret rotation merely because their public material was displayed. The incident recorded truncated child families; the exact child material has not been reopened or classified. Any separate actual bearer/session token remains an issuer question. Most named parent provider/gateway credentials matched saved Windows User values in the existing names-only origin record. The OpenAI process value differed from the saved User value: identify the old inherited key as well as the newer saved key. Updating an environment variable does not revoke a key.

## Provider key cutover

1. Keep affected consumers and the compromised worker stopped. Identify the issuing account/project and implicated key by dashboard name/ID, creation and usage metadata. Do not read or redisplay the raw incident transcript.
2. If unused, revoke the exposed key immediately. If another service depends on it, coordinate a short cutover: create a restricted replacement, update intended consumers privately, then promptly revoke the old key before resuming affected work. Do not blindly revoke unrelated keys.
3. Replace the exact variable or configured SDK/Pi secret store privately. Windows User environment can be edited using “Edit environment variables for your account,” then User variables, exact name, Edit. Do not put secret literals in shell commands, logs, code, tickets or chat. Do not copy Windows keys to Omarchy merely because a route exists there.
4. Record only nonsecret key name/ID, custodian, rotation time and issuer revocation status. Review account usage since exposure; incident record time 2026-10-22 05:08 UTC is not a proven exact first exposure time.
5. At a safe boundary, fully exit and relaunch affected parent apps, terminals and agents. A new tab in an old process may retain stale credentials. Never resume the compromised builder context.
6. Keep each route held until its old credential is revoked/expired, intended fresh credential is installed, stale consumers are stopped, and a narrowly scoped check establishes fresh authentication without logging secrets. No old-key generation or broad environment dumps.

## Where to rotate

| Variable | Issuer-side action |
| --- | --- |
| OPENAI_API_KEY | Correct OpenAI organization/project API-key management; replace and delete/revoke the implicated key, including an older process-inherited key if applicable. Do not delete the account/project. |
| OPENROUTER_API_KEY | Issuing account's key management; create replacement, disable/delete old key. |
| OPENCODE_API_KEY | Account > Personal API keys for a personal key; Settings > Service accounts > intended account > API Keys for a service-account key. Create restricted replacement in correct workspace; revoke old key. |
| XAI_API_KEY | Issuing team's API-key management in console.x.ai; replace/revoke exact key. |
| CEREBRAS_API_KEY | Issuing account's API Keys page; replace/revoke exact key. Current revoke UI has not been observed. |
| TYPESAFE_API_KEY | Installed Pi registry/docs identify TypeSafe direct Jev classifier service. Clinton confirms he created this key and is its account custodian; replacement/revocation remains pending. |
| MUSE_API_KEY | Clinton-created Meta credential; use https://dev.meta.ai/api-keys in his account. Replacement and old-key revocation pending. |
| LIQUID_API_KEY | Clinton-created Liquid credential; use https://console.liquid.ai/dashboard in his account. Replacement and old-key revocation pending. |
| NACE_API_KEY | Clinton-created Nace credential; use https://console.nace.ai/dashboard/api-keys in his account. Replacement and old-key revocation pending. |

Official references checked:

- OpenAI project key deletion: https://developers.openai.com/api/reference/resources/admin/subresources/organization/subresources/projects/subresources/api_keys/methods/delete
- OpenRouter key management: https://openrouter.ai/docs/guides/overview/auth/management-api-keys
- OpenCode key creation and revocation: https://opencode.ai/v2/docs/console/api/
- xAI console: https://console.x.ai/
- Cerebras API Keys navigation: https://inference-docs.cerebras.ai/integrations/code-mcp

## Gateway and runtime credentials

MCP_GATEWAY_AUTH_TOKEN: Clinton confirms the gateway issues it. Identify that gateway's administrative custodian and supported token invalidate/reissue procedure, then update intended server/client consumers at a coordinated boundary. Do not guess global service restarts or signing-key destruction. No token mutation is claimed.

Gateway source and read-only Azure metadata now narrow this step. Exact app keon-mcp-gateway, resource group keon-rg, ready revision keon-mcp-gateway--0000037, Single revision mode, image tag c03afe02707dc05a6e33d0c31cc53ca1002e59a0. Auth environment NAMES are Auth__Issuer, Auth__Audience and Auth__JwtPublicKeyPem. No static-token setting by the local variable name is present. The deployed-tag JwtValidator blob equals the inspected current source blob. It checks bearer JWT signature, issuer, audience, lifetime with zero clock skew; its inspected path has no per-token denylist/jti revocation. Minting a replacement JWT alone does not revoke an old JWT. Trust-key changes may affect every client and require a coordinated maintenance disposition, not blind rotation.

The API-key alternative in inspected source uses X-Api-Key and obtains key status from the Keon control plane; inactive status is rejected. Current local MCP_GATEWAY_AUTH_TOKEN did not parse as a JWT and did not match the source's keon_* API-key grammar. This is only local format metadata, not remote validity or proof the child value was identical. Known checked client configs did not locate the local variable's request-header binding. Before rotation, locate its actual consuming client/header and issuer credential record. Do not run the minting examples, change Azure secrets, or revoke a signing key by assuming the path. No gateway request, provider-key test, Azure mutation or secret-value query was performed.

BROWSER_USE_ACCESS_VERIFYING_IDENTITY and CODEX_TASK_WORKSPACE_VERIFYING_IDENTITY: the earlier bearer-token interpretation is superseded. Targeted in-memory ASN.1 classification of current parent values establishes Ed25519 public SPKI material, with no values, lengths, prefixes or hashes emitted. Browser ownership is linked to the installed OpenAI browser-access implementation; workspace-token minting/lifecycle code was not located. Do not rotate public verification keys merely for disclosure. Runtime custodian should confirm that any separately exposed actual bearer/session credentials are invalidated or expired; do not invent such a token or claim invalidation happened. Do not hand-create replacement identities or persist them as User variables. Appropriate workspace/app support handles transcript-retention questions without receiving secret values again.

### Actual local Docker client traced; saved token replaced

This supersedes the earlier unresolved issuer mapping for the CURRENT local MCP_GATEWAY_AUTH_TOKEN. Exact saved project C:/Users/clint/Documents/Codex/2026-09-23/pl/.mcp.json has docker-mcp-gateway URL ${PI_MCP_GATEWAY_URL}/mcp and Authorization: Bearer ${MCP_GATEWAY_AUTH_TOKEN}. work/pi-docker-mcp/setup.ps1 reads Windows User token, creates a cryptographically random token when absent, persists it there, and sets PI_MCP_GATEWAY_URL to http://127.0.0.1:8811. start-gateway.ps1 loads the same User token and launches Docker MCP Gateway with streaming transport on port 8811. The setup preserves preexisting tokens: source alone does not prove the historical generating execution. Current pre-cutover token conformed to the located generator, and Process equaled User, using boolean-only checks.

Installed Docker CLI help and official Docker source confirm this exact environment variable supplies HTTP/SSE bearer authentication. The issuer/configuration record here is the local Windows User environment and setup tooling, not an identified Azure Keon control-plane row. No Azure Keon key or signing trust was changed. The global C:/Users/clint/.config/mcp/mcp.json entry has since changed to Docker stdio without token references, so the saved README's claim of an identical global HTTP entry is historical. Neither port 8811 nor 8812 was listening; observed Docker MCP processes had no port/transport flags (stdio default). No running gateway was stopped or started.

At 2026-10-22T13:28:49.8421641Z, after rechecking dormant ports and no observed Docker MCP HTTP launch, a new cryptographically random token was saved ONLY to Windows User MCP_GATEWAY_AUTH_TOKEN. Read-back equality and difference from the previous value passed without exposing either value. Existing tool-parent environment remains stale; replacement does not erase old contexts or refresh running apps. No old/new credential authentication request was sent. Keep HTTP gateway/client routes and credential-bearing workers HELD. At a coordinated boundary refresh intended parent/client environment, keep the old credential out of new launches, and qualify a controlled authentication check before route reopening. Do not restart unrelated stdio processes or auto-launch catalog servers. Evidence: evidence/gateway-docker-client-trace-rotation-20261022.json.

Official semantics: https://docs.docker.com/reference/cli/docker/mcp/gateway/run/ and https://github.com/docker/mcp-gateway/blob/main/pkg/gateway/auth.go . The middleware compares the supplied bearer token to the token loaded for that gateway instance. No central revoke endpoint or Azure JWT rotation is needed for this local static-token binding. Historical child identity, other possible consumers, and the separate provider incident remain open.

### Targeted isolated child refresh and authentication PASS

Direct owner authorized this scoped check in the originating chat; sole operator performed it without a duplicate oversight launch. Reviewed evidence/gateway-isolated-auth-refresh-passed-20261022.json records completion at 2026-10-22T13:52:08.5516623Z. A clean child used only the saved replacement credential plus an OS environment allowlist, with private empty catalog/registry/config/tools/secrets, dynamic tools/OAuth/telemetry disabled, loopback only. Missing and synthetic-invalid bearer requests returned 401; replacement-authenticated initialization returned 200 and Docker AI MCP Gateway identity with protocol 2025-03-26. No old-token request, provider request or tool call was made. Captured output did not contain the replacement; raw logs were not retained. Owned process exited and the target listener was absent afterward. Earlier failed setup attempts and the content-type 415 remain separate evidence, not silently relabeled successful.

This establishes saved replacement usability and isolated child environment refresh/authentication only. It does not refresh the broader shared parent, reconcile every normal client, admit credential-bearing workers, release the affected route, prove historical old-token revocation across unknown consumers, or close provider-key rotation. Keep all broader holds in place; next action is safe-boundary intended-client/shared-parent reconciliation and the remaining provider credential dispositions.

### Saved normal-project templates verified; shared-app boundary remains

Direct owner then authorized normal-client/shared-parent reconciliation at a safe boundary. Sole operator inspected ancestry and identified the stale tool parent as part of the shared ChatGPT/Codex app with other live child sessions. No shared app or unrelated stdio session was restarted.

Reviewed evidence/gateway-normal-config-refresh-20261022.json records completion 2026-10-22T14:01:26.0418406Z. Exact saved project URL/header templates were verified and left unchanged, resolving saved User environment explicitly into a fresh controlled client. Missing/synthetic-invalid credentials returned 401; replacement-authenticated initialize returned 200. The same empty, loopback-only gateway isolation applied; no native Pi session, provider request or tool invocation was launched. Owned PID 14036 exited and no target listener remained; no replacement value appeared in captured output.

PASS covers template resolution and scoped authentication, not an end-to-end native Pi session, development profile, shared-parent refresh, worker admission or route release. A safe-boundary full exit/relaunch of the shared app from a refreshed environment is still needed to remove its stale inherited token. Merely opening a new chat or terminal tab in that app does not establish refresh. Preserve current work/handoffs first; do not force-stop shared sessions. After restart, verify only the named Process/User equality and intended client before releasing any applicable local route; all separate provider-key and worker-isolation holds remain independent.

### Separate Keon control-plane issuance and limited revocation confirmed

Local source in D:/Repos/keon-omega/keon-control-prmerges confirms POST /api/internal/control/api-keys requires tenantId, projectId, environmentId, packageTier and x-admin-signature checked against KEON_INTERNAL_CONTROL_SECRET. It generates a keon_live_<prefix>_<secret> key, stores salt/hash and returns the raw key in the creation response. Do not call this endpoint with output logging or use it to replace an unidentified incident credential. Gateway read authentication instead uses x-keon-control-secret / KEON_GATEWAY_CONTROL_SECRET; these are separate roles, not established incident exposures.

POST /api/internal/control/api-keys/[prefix]/revoke exists and uses the same administrative signature check. IMPORTANT: its implementation calls revokeInternalLearningApiKey, whose update is restricted to prefix + INTERNAL_LEARNING_TENANT_ID + active status. It is not a verified general-tenant revocation endpoint. A 404 means not found or inactive within that restricted operation; it does not prove an arbitrary credential revoked. No live issuance or revocation was attempted.

The newly supplied name MCP_GATEWAY_TOKENS is distinct from the incident name MCP_GATEWAY_AUTH_TOKEN. Supported Keon stdio API-key settings are KEON_MCP_API_KEY / McpServer:DefaultApiKey, with HTTP X-Api-Key. These Keon findings locate an issuance path but do not identify the exposed local variable as one of those issued keys. The later local Docker trace above resolves the current local variable's client/header binding; no Keon tenant key revocation should be inferred or attempted for that local binding.

## Continued safe work and closure

Affected-key routes and new credential-bearing delegated shell workers remain held. Continue source-only shaping, interface/fixture preparation, and deterministic validation with mechanically enforced environment/command allowlists. Independently verified unexposed routes may operate only within current authorization and cost guards, using clean source-only packets. No incident transcripts or environment logs go to reviewers.

Incident closure requires a names-only disposition for every credential family: identify whether secret or public, responsible custodian/account, old active SECRET credential revoked/invalidated or confirmed expired, necessary replacement installed, stale process handling complete, fresh route verification, usage review and worker isolation. Public verification material is recorded as public, not falsely counted as a rotated secret. Unknown child identity and transcript retention remain explicit. Code acceptance does not close this incident.
