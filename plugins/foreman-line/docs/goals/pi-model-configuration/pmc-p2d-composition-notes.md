# PMC-P2D composition notes — concrete review draft

2026-09-26. Documentation-only shaping within the coordinator's exact three-file
envelope. No ShapingResult, runtime source, credential read, model invocation,
authenticated provider request, production store or host setting was touched.
Uses foreman-shaping, parcel-driven-development and spec-driven-development;
coordinator's authorized bounded scope supplies decisions normally asked during
shaping. None of these notes silently revises approved P2C/B1 contracts.

## Inspection and design disposition

Initial branch HEAD was f93fc0e2e5476b85621384c69fc19d3a08e2cf56. P2A actual source
4b86643acd4e5cdf183e85cf1cd1c2ace51e0182 and P2B immutable source
835a6dd82ee4e50652362e7201a79b7451bbd221 are present. Reviewed P2C 09216fa is
contract evidence, not an implemented controller. B1 is separately building. Coordinator reports P2B integration/audit accepted at
71fd4895a60f90318b517818da14dea94b627fb0; source835a6dd remains unchanged.
No unaccepted HRO-P1c caller bridge is assumed.
The exact source pin set below supplements the earlier preflight hashes.

Before edits the coordinator received the inspected seam report: actual C
prepare/verify/send and Wire/Revalidation/proof unions, real ledger integer-only
settlement, actual Pi runtime/provider/session/event types, and the unresolved
billing-bound/auth order. Subsequent source inspection narrowed the runtime
construction to existing real Pi classes, memory stores and a native tokenless
provider. No injected structural object is asserted to be ModelRuntime.

## Actual Pi construction, source trace

| Source seam | Consequence and bounded disposition |
|---|---|
| model-runtime.js create, lines 74–108 | Supply credentials/modelsStore; modelsPath:null makes ModelConfig.load(undefined) empty without a file read; refreshOnCreate:false skips initial refresh. allowModelNetwork:false alone is not a permanent kill switch. |
| registerNativeProvider, lines 551–559 | Synchronously installs native provider then schedules local refresh({allowNetwork:false}); do not claim no refresh occurs. |
| models.js refresh, lines 134–188 | Calls credential read, restores cached provider state with false, then returns before network; even credential error still allows the local restore phase. |
| remote-catalog-provider.js refreshModels | Local restoration uses supplied model store and returns before fetch when !allowNetwork. |
| providers/radius.js refreshModels | Same false-network return; legacy restoration uses only supplied OAuth credential, which this store never supplies. |
| models.js checkAuth/getAvailable and auth/resolve.js | Credential read precedes check/resolve; throwing on every non-openrouter read blocks ambient env/file/OAuth resolution. Returning undefined for all providers would be UNSAFE because it enables ambient auth. |
| model-runtime.js prepareRequest, lines 422–449 | Resolves tokenless native provider auth then applies transformHeaders before streamSimple. Real bearer supplied here would violate the owned-sender boundary. |
| models.d.ts Provider and auth/types.d.ts ModelAuth | Native apiKey.resolve returning {auth:{}} is type-supported; apiKey is optional. Custom native provider owns both stream methods. Only governed streamSimple is supported. |
| sdk.js createAgentSession | Explicit model/runtime/settings/session/loader prevent defaults; explicit tools/noTools disable tools. SDK STILL clamps thinking; exact equality checked at every boundary. |
| sdk.js / provider-attribution.js | transformHeaders runs before provider dispatch. enableInstallTelemetry:false disables default attribution headers. Exact final pair resides on owned model headers; no arbitrary hook/header reaches wire. |
| cache-warmer.js start/getMode | off stops warming before inference; test actual code, not just the setting value. |
| agent-session.js compaction/retry paths | Explicit disabled settings plus private one-shot stream guard; unexposed manual compaction/fork/cycling API cannot be used by caller. |
| extensions/types.d.ts:1417 and loader.js:105 | getExtensions returns {extensions:[],errors:[],runtime:createExtensionRuntime()}. This is a real constructor returning throwing action stubs and empty pending registrations, not a hand-cast fake runtime. Keep it private and never load an extension. |

SDK system-prompt.js always adds a cwd section even for customPrompt. Initial
scope is exactly system+user seed text. Accept only generated preamble/cwd sections
whose values match that seed and an approved nonsecret cwd; render with actual
getSystemMessageText and bind final system content. Empty sections were an invalid
assumption and are not the contract. No extra prompt/resources are dropped.

The selected model's headers are an owned constant pair included in the accepted
runtime/config profile. Native resolve remains {auth:{}}; Models.getAuth(model)
merges model.headers, SDK transforms them, and adapter checks the final pair.
Actual model must retain the selected provider/model/API/base and exact source
thinking map; adding headers does not grant route authority.

The actual CredentialStore has four methods: read, list, modify, delete. Read is
closed to the sole installed native provider; list is empty; mutations reject
without executing a callback. Model store read is empty; write/delete refuse.
This can produce expected disabled-provider availability errors during registration
refresh. The bridge never interprets those as fallback permission and does not
call getAvailable to select a model. Tests must exercise that actual refresh and
verify no ambient accesses, auth commands or requests occurred. No process-wide
patch of a Pi private method is proposed. Initialization local recomposition is
allowed; dynamic network catalog discovery is not.

No isolated subprocess/IPC is required by this design: actual Pi, C, B1, ledger,
private proof identities and owned sender share the same trusted process. Pi
runtime/session/extension runtime remain inaccessible to task code. This is a
capability discipline within trusted installation, not protection from arbitrary
same-process malicious code. Package imports themselves must be inspected and
network-denied before executing actual-runtime tests; shaping executed none.

## Proposed clarifications to C/P2E (review required)

**C1 — invocation rendezvous and terminal event release.** No C signature change
is proposed. P2E computes the documented original request digest with preissued
B1 identities and the exact two-message seed payload, then calls C.launch FIRST.
C performs its zero-effect denials/acquisition/selection before Terminal.prepare
constructs Pi. prepare starts one actual private session; its native streamSimple
callback captures normalized context/options, runs final transforms, freezes and
resolves the prepare promise with WireV1. The Pi stream remains pending. send then
emits provisional text and returns its proof; it does NOT await final Pi result.
Only after C.launch returns, private installation calls finishInvocation(result)
to release final done/error and dispose the session. The finish closure is not
network-capable and cannot authorize another launch. If C fails unexpectedly,
finally aborts/disposes the pending session and preserves liability. The caller
gets C result/output, never the actual session/runtime. Bound setup and hook waits
to 30 seconds; mark cancelled so late callbacks cannot create a valid proof.
Review must approve this private orchestration and verify no circular wait.

**C2 — authenticated profile custody and comparison.** prepare lacks acquire's
price/profile/evidence records in its arguments. Proposed clarification, no wire
field expansion: P2E installation wraps its authentic acquire implementation to
retain a privately owned per-request profile after successful acquisition. P2D
prepare resolves ONLY the exact request identity through this private custody;
verify compares all RevalidationV1 fields including policy/config/runtime/catalog/
evidence/expiry and body/wire/decision digests. Missing or mismatched custody
refuses. No payload-selected profile, caller accepted:true or synthetic issuer
is production authentication. decisionDigest can be computed from requestDigest
and the complete successful decision using C's already frozen algorithm. This is
not a missing field that requires guessing decision.requestDigest or accepting an
extra prepare argument. Controller review must approve the shared custody and
whether it lives in C or installation; D cannot edit the reviewed C draft here.

Both proposals must be explicitly disposed before dispatch, even if judged to be
clarifications rather than contract amendments. If signatures change, return to
C review rather than silently implementing a widened port. Core C remains SDK-free.

## Response and accounting choices

The draft defines a deliberately small parser, not the entirety of OpenRouter.
A server response outside the closed shape produces failure/unknown liability.
Transport send completes on parsed terminal evidence and returns its observation
to C BEFORE Pi's final done/error is emitted. C reconciles ledger and B1; the
one-shot launch closure then releases the final Pi event. This ordering avoids
waiting on a Pi result that itself waits on C. Partial text may be emitted during
send, but never executes tools or constitutes final success.

Pi Usage has mandatory numeric input/output/cache and cost-component fields.
No exact provider account allocation exists in the inspected response contract.
The draft therefore uses explicitly marked nonaccounting tariff estimates for Pi
compatibility only and separate exact Charge for ledger proof. Placeholder zeros
before observed usage are labeled as unobserved. Public P2E output must not present
those figures as actual spend. This is a reviewable limitation, not an invisible
approximation in the exact-money path. If actual runtime consumers discard the
diagnostic distinction, the integration must be revised or refused.

Raw usage.cost is account USD. Fractional microUSD is common in principle and
cannot enter integer-only P2B as exact charge. The chosen honest disposition is
unknown liability, with the maximum retained, owner blocked and no fallback;
no rounding of 0.0000001 USD to either 0 or 1 microUSD. Exact divisible decimals
may settle; estimates and upstream_inference_cost never may. The raw lexeme is
bounded private in-memory evidence only. No crash-recoverable raw receipt store
or post-response generation lookup is promised in this parcel.

## Public source research and irreducible production gaps

Official pages were read on 2026-09-26, unauthenticated, with no inference.

- [Routing](https://openrouter.ai/docs/guides/routing/provider-selection): use
  singular full endpoint slug, no fallback and required parameters. Base slugs
  can include variants; max_price is a filter in per-million-token/per-request
  units. These controls motivate the draft; they do not independently prove spend.
- [Endpoint contract](https://openrouter.ai/docs/api/api-reference/endpoints/list-all-endpoints-for-a-model):
  endpoint identity, limits and prices are acquisition inputs, not a tokenizer or
  all-billable-components guarantee.
- [Service tiers](https://openrouter.ai/docs/guides/features/service-tiers):
  initial profile excludes nonstandard tiers and tier aliases.
- [Reasoning](https://openrouter.ai/docs/guides/best-practices/reasoning-tokens):
  excluded reasoning remains work that can be billed. Provider-specific cap
  semantics must be evidenced before a reserve bound is accepted.
- [Usage](https://openrouter.ai/docs/cookbook/administration/usage-accounting):
  account cost is distinct from upstream cost and final usage is supplied without
  deprecated include flags. Missing/truncated cost stays unknown.
- [Chat contract](https://openrouter.ai/docs/api/api-reference/chat/create-a-chat-completion):
  response shape reference; the stricter parser is a product limitation, not a
  claim that OpenRouter emits only its accepted subset.

Retained RCM source evidence v4 and sealed conservative projection give a concrete
useful L5 candidate google/gemini-3.8-flash with exact low. They do not authenticate
an endpoint/tariff or establish fresh quality/availability. Haiku fallback is
explicitly excluded by REASONING_UNKNOWN_REFUSED; minimal is not available merely
because the original lane table says minimal/low. Policy/RCM owners retain all
ranking and eligibility decisions.

Still absent: a singular approved standard-tier endpoint and original tariff
source, account-fee/cache/framing/tokenizer proof, a bound covering hidden reasoning
within max_tokens for that exact endpoint, independent accepted availability/
quality/privacy, and actual-runtime execution evidence. A context window ceiling
and model-wide cheapest price cannot substitute. Paid activation stays refused.
This is a complete refusal rule, not a claim that every external economic fact
has been supplied. B1/C accepted implementation and independent reviews remain
separate gates. No model names, rates or new production evidence were invented.

## Verification record

Source files were read only; no Pi import or CLI/session was executed. Frozen
spec-linter and documentation checks are recorded after completion below. Runtime
ACs are future work and must label real C/B/B1/Pi code, fake network and external
production evidence separately. No fake-only test can satisfy actual runtime or
durable custody acceptance criteria.

Documentation checks completed successfully:

- Frozen donor Node24.19.0/tsx spec-linter validate: exit 0.
- Required spec body sections and local Markdown links across all three documents: passed.
- git diff --check: passed; exact three-document envelope confirmed.
- No runtime test or inference executed; no production activation evidence claimed.

Coordinator integration should preserve the DRAFT state and route C1/C2 through
concrete independent review. Accepted B1/C and any HRO caller integration are not
implied by this documentation commit.
