# P2B credential incident: names-only rotation checklist

Status: OPEN. No rotation, revocation, task-token invalidation or transcript erasure is claimed. This document contains variable names only.

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

The two IDENTITY names are confirmed in current parent environment keys only. The incident recorded their truncated families; child token identity, validity and lifetime remain unverified. Most named parent credentials matched saved Windows User values in the existing names-only origin record. The OpenAI process value differed from the saved User value: identify the old inherited key as well as the newer saved key. Updating an environment variable does not revoke a key.

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
| MUSE_API_KEY, LIQUID_API_KEY, NACE_API_KEY, TYPESAFE_API_KEY | Exact issuer/account not established from variable name. Account custodian must identify the existing secret-manager entry or nonsecret provider endpoint, then perform the same cutover. If platform-provisioned, issuing operator handles it. No guessed provider console or provider substitution. |

Official references checked:

- OpenAI project key deletion: https://developers.openai.com/api/reference/resources/admin/subresources/organization/subresources/projects/subresources/api_keys/methods/delete
- OpenRouter key management: https://openrouter.ai/docs/guides/overview/auth/management-api-keys
- OpenCode key creation and revocation: https://opencode.ai/v2/docs/console/api/
- xAI console: https://console.x.ai/
- Cerebras API Keys navigation: https://inference-docs.cerebras.ai/integrations/code-mcp

## Gateway and runtime credentials

MCP_GATEWAY_AUTH_TOKEN: gateway custodian establishes whether user-managed or platform-issued, invalidates old token and updates intended server/client consumers at a coordinated boundary. Do not guess global service restarts or signing-key destruction.

BROWSER_USE_ACCESS_VERIFYING_IDENTITY and CODEX_TASK_WORKSPACE_VERIFYING_IDENTITY: runtime/workspace custodian must invalidate/reissue the affected identities or establish issuer-side expiry. These are not provider API keys. Do not hand-create replacements or persist them as User variables. A new task alone does not prove old tokens invalidated. Appropriate workspace/app support handles transcript-retention questions without receiving secret values again.

## Continued safe work and closure

Affected-key routes and new credential-bearing delegated shell workers remain held. Continue source-only shaping, interface/fixture preparation, and deterministic validation with mechanically enforced environment/command allowlists. Independently verified unexposed routes may operate only within current authorization and cost guards, using clean source-only packets. No incident transcripts or environment logs go to reviewers.

Incident closure requires a names-only disposition for every credential family: responsible custodian/account, old credential revoked/invalidated or confirmed expired, necessary replacement installed, stale process handling complete, fresh route verification, usage review and worker isolation. Unknown child identity and transcript retention remain explicit. Code acceptance does not close this incident.
