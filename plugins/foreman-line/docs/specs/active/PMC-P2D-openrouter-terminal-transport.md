---
ticket: PMC-P2D
title: Owned OpenRouter chat terminal transport
status: draft
owner: clinton.morgan
created: 2026-09-26
updated: 2026-09-26
supersedes: null
superseded_by: null
risk: critical
surfaces:
  - plugins/foreman-line/dispatch/
routing_class: architecture/risk
permission_profile: builder-architecture
data_classification: internal
verification_class: judgment-required
---

## Intent

Implement one controlled Pi stream for OpenRouter OpenAI Chat Completions that
owns the exact terminal HTTP operation. After final transformation, authenticate
and durably consume through P2C before that operation; no built-in transport or
hook exception may substitute for this boundary. Prove offline conformance
before separately obtaining actual public activation evidence.

## Constraints

- Pin locally inspected @earendil-works/pi-coding-agent 0.87.1 surface and hashes;
  runtime injection is explicit, no machine-absolute shipped imports or vendor
  edits/new dependency installs. Node 24.19.0 existing package tooling.
- Only provider openrouter, Pi API tag openai-completions, OpenAI Chat Completions
  protocol and public classification. Exact approved baseUrl must match policy,
  catalog and configuration; deterministic reviewed operation path is
  /chat/completions appended to the approved /api/v1 base, without aliasing or
  redirects. Other endpoints/protocols/providers refuse. L1/L2 opencode pin stays
  intact and therefore cannot use this transport.
- Only P2C receives trusted sender access. No raw unrestricted send export. Empty
  break-glass bypass set, L6 refusal, no implicit model switch or fallback.
- No real HTTP/provider/credential/host configuration access during implementation
  tests. Production HTTPS sender is constructed separately from the fake offline
  harness; test mode cannot be selected by an untrusted request field.

### Pi source and exact request ownership

Installed source root inspected:
D:/nvm/v24.7.0/node_modules/@earendil-works/pi-coding-agent.
sdk.d.ts:11-55,107 provides createAgentSession with explicit model/modelRuntime,
thinkingLevel/tools/resourceLoader/settingsManager/sessionManager. Extension
types.d.ts:1178 provides ProviderConfig.streamSimple(model, context, options)
returning AssistantMessageEventStream; onPayload/onResponse contract is documented.
runner.js:961-988 catches before_provider_request exceptions and returns payload.
It is not a veto. Verify actual imported compat types before dispatch, do not
guess a middleware API or delegate to a built-in provider with hidden sends.

Locally verified pi-ai/dist/models.js:554 getSupportedThinkingLevels accepts
omitted off/minimal/low/medium/high; clampThinkingLevel can substitute levels.
Its openai-completions transport may send none when off is omitted from the map.
Sparse RCM observed-effort maps are catalog facts ONLY. Verify exact allowed
requested level against authenticated profile before launch AND final wire.
Unknown/unsupported/omitted source level refuses regardless of SDK support;
mandatory reasoning plus off refuses. Prohibit clamping and wire-level effort
substitution. Bind actual installed behavior/version in the compatibility record.

Implement the minimal supported chat payload and response-to-Pi stream mapping
against pinned shipped types. Unsupported tool/content/finish-reason/usage shape
fails closed, never invents success. Bound request and streamed response sizes,
timeouts and usage parsing. Missing authenticated settlement retains reservation.
Provider credentials arrive through a trusted opaque in-memory supplier only at
owned send; never render them into audit/prompt/config plans or exception text.

All allowed transformations/onPayload handling finish BEFORE binding the final
wire descriptor. Default untrusted extensions are disabled. Deep-own final data,
serialize to an immutable string or privately held byte copy, and bind digest,
exact operation URL/method, identity, classification, privacy settings, thinking,
tools, max output and conservative input/cost bounds to P2C claims. Reauthorization
is required if transformations change an already-bound request. No later callback
can change bytes, headers affecting routing/privacy, endpoint or limits.

The sole sender uses one owned node:https request operation with no automatic
retry, redirect-following or implicit SDK request. P2C verifies final claims,
durably consumes and invalidates permit immediately before invoking it. Sender
tracks whether any request could have begun; only its direct proof before that
point can report no-send. All other errors/aborts/HTTP failures/truncated streams
are uncertain until authenticated settlement. A status code alone never proves
zero charge. onResponse runs without permission to issue an auxiliary request.

Explicitly disable resource/extension discovery, model cycling/default fallback,
cache warming, automatic compaction inference, hidden retries and background
network/catalog refresh. Each reachable inference send, including later tool
turns, must obtain a new reservation/permit through P2C; any Pi feature whose
coverage is unproven remains disabled. Pin the actual source paths establishing
this restricted-session construction; merely having a stream callback is not proof.

## Acceptance Criteria

1. Network-disabled actual adapter tests prove final post-hook mutation either
   changes the authorized digest through fresh authorization or refuses; mutation
   after freeze cannot alter wire bytes. A throwing hook negative control shows
   why it is not a gate. No send precedes durable consume.
2. The owned sender performs at most one exact HTTPS operation; redirects,
   retry/warming/compaction attempts, unsupported protocol/provider/endpoint,
   missing permit and internal/restricted/L6 requests produce no operation.
3. Source-backed session tests show no default model/extension or auxiliary send
   escape; malformed/oversized streams, timeout/abort and uncertain response cost
   retain liability. Sender no-send proof is narrower than arbitrary thrown error.
4. Synthetic conformance uses fake transport with no network capability and no
   real credentials; production sender cannot be reached from that harness.
   Record actual-code versus fake coverage and exact Pi source/version hashes.
5. Two independent reviews inspect the concrete terminal-send path and all reachable
   sends. Actual public availability/quality/capability/privacy evidence remains
   required before activation; full HRO live exit is not satisfied by these tests.
6. Negative tests cover sparse-map implicit off/low/medium support, automatic
   clamp to another level, none wire fallback, required-reasoning off and a hook
   changing effort after selection. All refuse before sender; permitted exact
   level survives unchanged in final payload and audit.

## Out of Scope

Additional protocols/providers, built-in sender delegation, real network probes,
nonpublic activation, host settings/keys, general extension support, new ranking,
ledger/controller rewrite, HMAC/IPC and configuration/caller migration.

## Context & References

- [Amendment 05](../../goals/pi-model-configuration/gate-1-amendment-05.md)
- [P2C](PMC-P2C-same-process-launch-controller.md)
- [PRAC memo](../../goals/pi-routing-adapter-compat/compat-memo.md)
- [P2 inventory](../../goals/pi-model-configuration/pmc-p2-design-inventory.md)

## Allowed Files

- plugins/foreman-line/dispatch/src/pmc-launch/openrouter-chat-stream.ts
- plugins/foreman-line/dispatch/src/pmc-launch/owned-https-sender.ts
- plugins/foreman-line/dispatch/src/pmc-launch/pi-runtime-port.ts
- plugins/foreman-line/dispatch/tests/pmc-openrouter-stream.test.ts
- plugins/foreman-line/dispatch/tests/pmc-owned-sender.test.ts
- plugins/foreman-line/docs/goals/pi-model-configuration/pmc-p2d-verification.md

## Verification Plan

Node 24.19.0, existing offline tools: dispatch `npm.cmd test`, `npm.cmd run
typecheck`, `npm.cmd run lint`, checking exits. Network-denied harness intercepts
all actual HTTPS operations and tests post-consume failure points; it must fail
if any unowned network path is attempted. Never invoke Pi CLI/live host session.
Read/type-check against pinned installed types with explicit injected local path
in the harness only; no vendor file changes or package installation.

## Readiness

Draft until accepted P2C contract and complete pinned chat-stream type/sender
mapping freeze. If protocol support requires new dependencies or more surfaces,
return a smaller scoped extension rather than silently using a built-in sender.
This parcel's supported surface remains intentionally insufficient for full HRO.
