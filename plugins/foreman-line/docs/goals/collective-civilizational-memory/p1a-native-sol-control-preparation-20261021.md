# Native Sol finite-control preparation — October 21

Status: **ISOLATED METADATA CHECKS PASS; NO GENERATION**.
This independent work proceeded while the OpenCode authenticated view is pending.
It does not dispose request01, assert account entitlement, or activate paid retry.

## Actual prepared profile and observations

Private root `/home/cmorgan76/.ccm-p1a-sol-controls-20261021-b7oamsof`, mode0700;
new agent/settings/model-override files and capture files mode0600. No repository
or global Pi configuration changed. Original global settings bytes unchanged;
original auth file size/mtime/inode unchanged (metadata proof, not a byte hash).
No credentials copied or linked. Pi created a2-byte empty0600 auth registry in
this isolated profile; it contains zero provider entries. Its existence does not
mean authentication was transferred. Earlier absence expectation is corrected by
`omarchy-sol-empty-auth-registry-20261021.json`.

Effective RPC model: exact `openai/gpt-6.1-sol`, APIopenai-responses,
maxTokens8192/context272000. `set_auto_retry(false)` and
`set_auto_compaction(false)` both acknowledged success; state confirms compaction
false, streamingfalse,0messages/0pending. Effective task settings:
retry.enabledfalse/maxRetries0/provider.maxRetries0; provider timeout600000ms;
transportSSE, cacheWarmingoff, defaultTools[]. CLI disabled tools, extensions, MCP,
skills and prompt templates. No model prompt or compaction request was sent.

Existing Pi binary/CLI and documented settings/modelOverrides were used. No new
launcher, provider implementation, extension, router, model or service installed.

## Durable event capture verified

`rpc-live-capture.jsonl` was opened before spawning Pi, and stdout wrote directly
to that private file rather than only a buffered SSH response. Process exited0.
A separate SSH connection reread the file, confirming1783bytes and identical SHA256
`4b46f6755f23878a3d6b772396abd683bc960746e2dc0867409f233efc5756a5`.
Native session controls.jsonl is not materialized by an empty metadata-only
session; no pretend assistant/session persistence test was substituted. Durable
RPC event-file capture across completed connections is proven. Survival of a real
in-progress generation or a host failure, exact provider payload, hard aggregate
request/billing ceiling and remote cancellation remain untested/unproved.

## One reviewable continuation, not executed

Preserve request01 as unusable output with upstream generation/charge attribution
unknown and full94.6 reserved. Explicitly accept that later generation may repeat
unseen work; do not claim remote cancellation or free failure. Count95.7 reported
plus94.6 unresolved=190.3 of the700 GenSpark ceiling before any further phases.

Candidate: existing native Pi1.3.0 on this host, exact OpenAI Sol as frontier
artifact builder, existing OpenAI OAuth only, no API-key/provider substitution.
Use this private profile/capture approach with the exact same five paths/spec/base
and seven AC. Reuse the existing credential store through a supported reference
rather than printing/copying tokens; authenticated selection/account entitlement
must be verified before a prompt. Current isolated profile has no credentials.
A metadata PASS is not paid delivery admission.

Use the one remaining focused-repair allowance, with its own Step0 (1536 max
output), then one source proposal (8192 max output), measured input<=36000 and
600seconds combined observation. Set/verify the phase cap before each submission;
no retry, fallback, auto-compaction/cache warming, tools, MCP or other worker.
At timeout stop locally/preserve all files; provider cancellation remains unproved.
No returned commands executed; host may apply only inspected exact-five-file JSON.
Original two separate fresh Opus reviews remain necessary, within existing
GenSpark limits; no review or additional repair is silently waived.

Accounting: the native OAuth route does not consume a measurable allocation of
GenSpark credits, and this record does not translate units. No new cash purchase
or API-key/PAYG allowance is requested. Existing account usage/quota/dollar
attribution is unknown, not declared free. If included/native account use cannot
be established or another billing route is needed, stop before inference and
present one exact amount/scope; do not infer authority from the GenSpark ceiling.

This candidate still requires the applicable uncertain-attempt disposition and
account/role admission. No generic retry approval is requested. The completed
control preparation itself used0 provider inference calls and changed no source.
