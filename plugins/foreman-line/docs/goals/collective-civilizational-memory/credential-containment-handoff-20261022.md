# Credential containment handoff

Recorded October22 following the direct owner instruction relayed by the
authorized oversight session: resolve the incident, provide exact names and
rotation steps, keep affected routes held, and continue safe work under existing
authority. The oversight session owns the saved names-only
[rotation runbook](credential-rotation-runbook-20261022.md); this originating
coordinator retains Context source custody. Installed Pi documentation identifies
TYPESAFE as the TypeSafe direct Jev classifier. Clinton directly confirmed that
he created MUSE_API_KEY, LIQUID_API_KEY, NACE_API_KEY and TYPESAFE_API_KEY;
he is their confirmed custodian. He subsequently supplied these issuing-account
locators: MUSE https://dev.meta.ai/api-keys ; LIQUID
https://console.liquid.ai/dashboard ; NACE
https://console.nace.ai/dashboard/api-keys . These are owner-supplied locators,
not independently verified account access or rotation evidence.
He confirmed the gateway issues MCP_GATEWAY_AUTH_TOKEN and identified
https://keon-mcp-gateway.redrock-24997c6f.eastus2.azurecontainerapps.io with source
at D:/Repos/keon-omega/keon-mcp-gateway. Oversight owns the bounded source/template
investigation of supported authentication and cutover mechanics; do not duplicate
it. Administrative custody and supported invalidation/reissue remain to be
established from evidence. No live gateway call, deployment or key read is implied.

Oversight's subsequent read-only source/Azure metadata investigation is saved in
evidence/credential-issuer-locators-20261022.json and the runbook. The located
gateway validates bearer JWT signature, issuer, audience and expiry; no per-token
revocation was found in that inspected path. Its alternative X-Api-Key path checks
active key status through the Keon control plane. No static
MCP_GATEWAY_AUTH_TOKEN app setting was found. Metadata-only inspection classified
the current local variable as neither a parsed JWT nor the inspected keon_* key
grammar, with no Bearer wrapper; exact child material remains unknown. Its actual
local consumer/header and issuer record are still unresolved. Do not mint a JWT,
rotate signing trust, infer broader service-secret exposure or test the old value
as a blind remedy. No gateway request, secret query or mutation was performed.

Further static control-plane findings are recorded in
evidence/gateway-control-revocation-scope-20261022.json. The located
POST /api/internal/control/api-keys issuance route uses x-admin-signature with
KEON_INTERNAL_CONTROL_SECRET. The located POST
/api/internal/control/api-keys/[prefix]/revoke calls revokeInternalLearningApiKey
with INTERNAL_LEARNING_TENANT_ID plus prefix/active restrictions. This does not
establish general-tenant revocation or disposition of the incident token.
Owner-mentioned MCP_GATEWAY_TOKENS is a distinct name; do not equate it to
MCP_GATEWAY_AUTH_TOKEN. Its incident consumer/header/issuer record remains
unmapped. No live request, mutation or secret read followed from these findings.
See evidence/credential-owner-clarification-20261022.json. The consolidated
ownership question is answered; do not repeat it. Ownership confirmation is not
evidence of rotation, revocation or expiry.

## Scope remains open

### Current local gateway mapping supersedes the earlier unresolved mapping

Oversight located the saved Pi Docker client
C:/Users/clint/Documents/Codex/2026-09-23/pl/.mcp.json using
${PI_MCP_GATEWAY_URL}/mcp with Authorization: Bearer ${MCP_GATEWAY_AUTH_TOKEN}.
Its work/pi-docker-mcp/setup.ps1 generates and persists a local User token when
absent; start-gateway.ps1 loads that token for Docker MCP streaming on port 8811.
Names-only/boolean evidence links the current process/User endpoint to local
127.0.0.1:8811 and confirms process/User token equality and generator conformity.
No token value is retained here. Installed Docker help and official security
documentation identify this environment variable as Docker MCP HTTP bearer auth.
This establishes the local Docker binding; the earlier Azure Keon source findings
do not establish an Azure credential identity and are historical investigation
context, not instructions to alter Azure signing trust or control-plane keys.

Oversight reports the current global MCP entry uses stdio, no listeners on
8811/8812, and observed Docker MCP processes without HTTP transport/port flags.
Oversight completed replacement of the dormant local User token at
2026-10-22T13:28:49.8421641Z under existing authority. A new cryptographically
random value was persisted only to Windows User MCP_GATEWAY_AUTH_TOKEN; boolean
readback and difference checks passed, without emitting values or hashes.
See evidence/gateway-docker-client-trace-rotation-20261022.json. The current tool
parent remains stale and must not use its inherited old value. Parent
and client refresh plus a qualified isolated authentication check are required
before closure. Do not start a gateway/container, test the old token or release
routes on this mapping alone. The originating coordinator does not duplicate
credential mutation or gateway investigation.
No gateway/container was started or stopped, no auth request was made and no
Azure setting changed. Reconcile the intended parent/client refresh at a safe
boundary without restarting unrelated stdio processes or launching anonymous
catalog servers. The separate provider-key incident remains open.

The stopped P2B worker stays stopped. No new delegated shell worker may inherit
the credential-bearing environment. Affected provider routes remain held pending
the appropriate custodian's rotation, refresh or evidenced disposition. No
credential value, prefix, length or hash belongs in a handoff or review packet.

The oversight session classified the current parent's
`BROWSER_USE_ACCESS_VERIFYING_IDENTITY` and
`CODEX_TASK_WORKSPACE_VERIFYING_IDENTITY` as Ed25519 public SPKI verification
material using in-memory ASN.1 metadata parsing, without retaining values,
prefixes, lengths or hashes. Static installed code identifies the browser consumer
as OpenAI's bundled browser-access service; the workspace issuer implementation
was not located. These current parent values are not established bearer secrets
and do not require secret rotation merely for display. The child transcript was
not reopened, and its exact material remains unknown; do not invent a separate
bearer token or claim invalidation. See
`evidence/credential-ownership-trace-20261022.json` and the updated runbook.
The original incident record retains its historically truncated observations.

Nine provider variable names are recorded: `OPENAI_API_KEY`, `OPENROUTER_API_KEY`,
`OPENCODE_API_KEY`, `XAI_API_KEY`, `MUSE_API_KEY`, `CEREBRAS_API_KEY`,
`LIQUID_API_KEY`, `NACE_API_KEY` and `TYPESAFE_API_KEY`. The separate
`MCP_GATEWAY_AUTH_TOKEN` also needs its appropriate custodian's disposition.
Preserve the observed difference between the parent's process OpenAI value and
its saved User value. Names, storage location and equality do not establish
validity, ownership or which exact child value was rendered.

No keys were provisioned, copied to another machine, tested against a provider,
revoked or rotated by this handoff. No issuer account was guessed, service
restarted, raw transcript rescanned or tool history erased. Rotation is incomplete;
tool output entered model context. Do not claim no transmission.

## Verified safe preparation boundary

The fixed parent subprocess self-check at12:30UTC passed:

- An explicit OS-only environment excluded fake credential canaries.
- The actual child verified that only allowed variable names were present.
- Windows asyncio startup passed without provider, browser or database calls.
- No environment values were printed or saved, and no registry credentials read.

Evidence: `evidence/parent-subprocess-isolation-check-20261022.json`.
This mechanically filters the child environment. It does **not** change a native
agent's own tool environment, enforce filesystem/registry isolation or prevent
arbitrary same-user code from seeking credentials. It therefore admits fixed,
bounded deterministic parent subprocesses only.

Safe work may continue: source-only planning, interface decisions, fixture/oracle
preparation, frozen advisory/schema checks and bounded parent validation. The
AST interface/fixture preparation is saved alongside this handoff. No model
generation or source implementation was started for that next component.

An existing separately protected GenSpark route may be used only with fresh
role/auth/control and finite account/date/foreign-hold checks, and source-only
packets containing no incident transcript or environment diagnostics. This
handoff performs no such dispatch and transfers no old budget automatically.

Existing owner build authority remains valid. Cleanup needs the appropriate
credential custodian and a demonstrated boundary, not another feature approval.
