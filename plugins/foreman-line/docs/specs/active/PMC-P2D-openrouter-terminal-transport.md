---
ticket: PMC-P2D
title: Owned OpenRouter chat terminal transport
status: active
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

Implement one private, text-only OpenRouter Chat Completions stream through the
actual pinned Pi 0.87.1 runtime, with P2C owning authorization and durable consume
before one owned HTTPS operation. Prove bounded offline composition separately
from production tariff, runtime, quality and public availability evidence. This
is a concrete review DRAFT, not a runtime release or a usable production route.

## Constraints

### Pins and authority

Amendment 05, accepted P2A `4b86643acd4e5cdf183e85cf1cd1c2ace51e0182`, immutable
P2B `835a6dd82ee4e50652362e7201a79b7451bbd221`, reviewed P2C design `09216fa`
and P2B1's accepted contract govern. B1 implementation acceptance and P2C
implementation remain predecessors. Read actual types rather than copying them.
Pi source root is development evidence only:
`D:/nvm/v24.7.0/node_modules/@earendil-works/pi-coding-agent`, version 0.87.1.
Exact additional hashes and official sources are in the preflight and composition
notes. Node executable is 24.19.0. This docs-only amendment performs no package installation. A later explicitly released runtime slice may install only the pinned development dependencies below in its isolated checkout. No vendor edits, absolute shipped import, provider experiment or host settings.

Provider is exactly openrouter; API exactly openai-completions; URL exactly
`https://openrouter.ai/api/v1/chat/completions`; POST only, public L3..L5 only.
L1/L2 remain opencode-pinned, L6/nonpublic/unknown versions refuse in P2C before
Pi effects. No implicit model/effort switch, automatic fallback, retry or bypass.
Synthetic registries establish test custody only, never production authority.

### Private composition surface

P2C's unchanged TerminalPortV1.prepare/verify/send, WireV1, RevalidationV1 and
AttemptV1 are the boundary. No new public runtime export. Internal helpers are
functions in the three allowed source files, not a generic service framework:

```typescript
type TransportCode = 'PAYLOAD_REFUSED' | 'PROFILE_REFUSED' | 'PI_REFUSED'
  | 'HEADERS_REFUSED' | 'BOUND_REFUSED' | 'HOOK_REFUSED' | 'ABORTED'
  | 'CREDENTIAL_REFUSED' | 'HTTP_UNCERTAIN' | 'STREAM_UNCERTAIN'
  | 'USAGE_UNKNOWN' | 'COST_PRECISION_UNKNOWN' | 'PROOF_REFUSED' | 'OUTPUT_TRUNCATED';
type Charge = {kind:'unknown'; reason:'missing'|'malformed'|'precision'|'incomplete'}
  | {kind:'known'; actualMicroUsd:number};
type Observation = {kind:'no-send'; code:TransportCode}
  | {kind:'response'; semantic:'stop'|'length'|'failed'; charge:Charge}
  | {kind:'uncertain'; code:TransportCode};
type BoundInvocation = Readonly<{
  // Exact imported Pi types, not structural substitutes for runtime classes.
  model: Model<'openai-completions'>;
  context: TranscriptContext;
  options: SimpleStreamOptions;
}>;
```

All ordinary records are closed and owned. Captured callbacks are trusted
installation capabilities, never payload fields. The private composition factory
receives actual imported Pi constructors/functions (ModelRuntime.create,
createAgentSession, SettingsManager.inMemory, SessionManager.inMemory,
AssistantMessageEventStream, createExtensionRuntime), a closed ResourceLoader, authentic profile custody,
one synchronous credential supplier and a captured controller launch function.
It also receives the installation-owned observation registry's D-only register
capability described below. C and ledger receive separate captured read/authenticate
capabilities; none is reachable from task data or the returned terminal port.
Factories are available only to reviewed P2E installation, never task code.
No arbitrary sender/http-client injection in the production factory; test assembly
has a separate non-exported fake factory with no credential/HTTPS dependency.

P2E calls C.launch with the original requested text payload and preissued owner IDs
before any Pi construction. After C preflight/acquisition/selection, Terminal.prepare
constructs the private one-shot Pi session and invokes prompt. Its governed
streamSimple callback captures the actual normalized context/options, completes
transforms and freeze, and resolves a private preparation promise with WireV1.
The Pi stream remains pending. C then reserves/consumes and invokes send; sender
returns evidence without waiting for Pi final done. After C.launch resolves, the
private P2E wrapper calls finishInvocation(result) to release final done/error,
drain the retained prompt promise and return bounded completed text before
disposing the session. Neither the caller nor Pi receives a permit/raw sender.
The rendezvous is per invocation, rejects concurrent/reentrant/second streams,
and compares the initial payload/request/model to its retained prepare inputs.
A preparation failure terminalizes the pending stream before cleanup, without inference.
Setup/hook preparation has a 30-second deadline; cancellation prevents a late
callback from issuing proof. Supplied cwd/system text is approved public profile
data, never discovered from the user workspace.
This requires no extra C preflight API. Proposed C/P2E clarifications in the notes
require review; no reviewed C signature changes here.

prepare validates selected decision and acquired profile, assembles the candidate
body, awaits exactly one captured onPayload if present and honors its replacement
(undefined means unchanged), then validates the complete replacement from scratch.
It copies serialized UTF-8 body and the final transformed headers, computes all
claims and issues an empty frozen boundProof identity in a private WeakMap.
The decisionDigest is computed from the exact P2C documented tuple and full
successful decision; no invented decision field or caller digest substitutes.
verify compares EVERY RevalidationV1 field to its retained authenticated profile
and request/decision/wire, checks expiry synchronously, and returns only C's
accepted union. Repeated verify of the same pending proof is allowed because C
verifies both before reserve and at final revalidation; send consumes it once.
Failure invalidates it. C ownWire captures a fresh owned wire object while retaining
boundProof; do not require the preparation object's identity. At the first direct
call from the installed C verify path, authenticate private boundProof membership,
all retained wire bytes/fields and every RevalidationV1 field before binding that
exact C-owned wire object. Bind only after every check succeeds. Subsequent verify,
send and observation registration require that same C-owned object plus unchanged
proof/fields/claims; a structurally equal clone, preparation object, foreign proof
or attempted rebinding refuses. A failed first verification permanently invalidates
that invocation's proof. No task-callable wire-adoption or binding API is added.


The finite private factory result is exactly
`{terminal:TerminalPortV1, finishInvocation:(result:LaunchResultV1|null)=>Promise<InvocationOutput>}`.
`InvocationOutput` is the owned closed union
`{kind:'completed',text:string,finish:'stop'}` or
`{kind:'failed',code:TransportCode}`. Text is at most the same 1 MiB UTF-8
response bound; it is copied from the private captured response, never a caller
field. Only semantic stop, C receipt disposition succeeded, acknowledged reconciliation and completed Pi prompt drainage can produce completed. No partial text is returned on failure.
Provisional Pi text events remain private and must not be presented as completed.
finishInvocation accepts only the result delivered directly by its installed C
wrapper for that invocation; null denotes that wrapper's caught unexpected C
rejection. It does no I/O other than local session cleanup. No arbitrary result
injection through task JSON. Replay returns the same retained finalization promise
and owned result, never another event, send or accounting transition.

One idempotent local terminalizer handles success, preparation refusal/timeout,
cancellation, reserve/revalidation/consume denial, reconciliation failure and
unexpected C rejection. Retain the actual prompt promise immediately, attach its
rejection observer, and own both preparation and stream settlement independently.
First invalidate the rendezvous and unused proofs; settle preparation if pending;
publish exactly one bounded final/error result and end any created stream BEFORE
awaiting abort, waitForIdle or prompt settlement. If failure occurs before stream
creation, retain the terminal failure so a late callback immediately gets an
already-ended error stream and cannot publish WireV1/proof or send. A timed-out
hook promise is observed but never awaited again; its late result is ignored.
After normal done/error publication await the retained prompt's settlement before
session disposal. Cleanup has a separate 5-second deadline; after that deadline
dispose once, observe remaining promise rejections and return failed PI_REFUSED,
never claim successful drainage. Do not await an unbounded abort/waitForIdle.
The deadline bounds return, not a claim that arbitrary runtime code was cancelled.
Cleanup cannot refund, change C's disposition or erase ledger liability. Local
output failure after a reconciled success does not authorize another inference.
Private authentic profile custody is exactly a per-request record containing
`requestDigest, policyDigest, configDigest, runtimeDigest, catalogDigest,
evidenceDigest, expiresAtUtc` (C refinements), `price:PmcPriceInputV1`,
`endpointSlug:Text`, `responseModel:Text`, `responseProvider:Text`,
`billableBoundKind:'provider-billable-ceiling'|'pinned-tokenizer'`,
`billableBoundSourceDigest:Digest`, `approvedCwd:Text`, and
`mappingProfileDigest:Digest`. This is retained only after authentic acquisition;
a JSON object with these fields cannot create it. Existing money.price counts/rates
are the sole arithmetic inputs. A source digest alone is not the required bound
proof; reviewed installation must implement the named source-based verifier.
There is no usable production verifier/certificate in this shaping evidence.
### Closed requested and final payload

Caller payloadJson is exactly `{messages:[{role,content},...]}`. It has exactly two messages: system then user, each with nonempty string content.
No prior assistant turns or conversation restoration. Role is only system/user. No names,
arrays, signatures, images, tools, tool results, assistant reasoning, midstream
system changes or extra keys. Each content <=65,536 UTF-16 units; aggregate and
serialized caps are P2C's 262,144 UTF-16 / 1,048,576 UTF-8, depth <=16 and
65,536 visited values. Duplicate JSON object keys, lone surrogates and malformed
JSON refuse before semantic validation. The parser must bound depth/tokens while
scanning, before allocating an unbounded parsed graph; no regex-only JSON parser.

Actual Pi adds structured system sections even with a supplied custom prompt.
Accept exactly the first system message content empty, sections preamble equal to
requested system text and cwd equal to the exact SDK-rendered installation-approved
nonsecret cwd, followed by the exact requested user message. Render that system
message through the pinned getSystemMessageText; bind the resulting text in final
wire and runtime/config profile. Reject all other sections, midstream system
changes and nonempty toolsAdded/toolsRemoved. Empty tool collections are omitted
by the explicit projection. User TextContent arrays may be flattened only in
exact order with no separators/signatures/extra fields. Validate timestamps as
finite numbers but do not send them. Actual-context conformance tests must match
this exact source-backed projection; no silent removal of Pi-added content.

Final wire body has exactly the following keys in order:

```typescript
{
  model: string, messages: {role:'system'|'user'|'assistant',content:string}[],
  stream: true, max_tokens: number,
  reasoning: {effort:'low'|'medium'|'high', exclude:true},
  provider: {
    order:[string], only:[string], allow_fallbacks:false,
    require_parameters:true, data_collection:'allow'|'deny', zdr:boolean,
    max_price:{prompt:number, completion:number, request:number}
  }
}
```

`model` is the selected providerModelId without routing/tier suffix or alias.
All constants and privacy values must exactly match selected authenticated policy.
One exact endpoint slug appears identically in order and only. Base provider slugs
that match several variants are NOT exact endpoint evidence. No service_tier,
models, route, plugins, transforms, tools, response_format, cache controls,
stream_options, usage include, temperature or other unlisted parameter.
max_tokens is a positive safe integer <= the authenticated output bound. Effort
is the exact explicit source-map low/medium/high entry, equal to requested level;
no off/minimal/xhigh, SDK clamp, none substitution or default. exclude:true hides
reasoning output; it does NOT prove zero reasoning work or zero reasoning cost.
Profiles lacking proof that max_tokens bounds visible PLUS reasoning billable
output refuse. Unexpected reasoning deltas refuse; hidden reasoning counts remain
billable. This limited shape supports useful prose work without tools but does not
claim support for a full coding-agent workflow.

Headers after ModelRuntime.transformHeaders and onPayload are exactly the C pair
content-type:application/json and accept:text/event-stream, with no Authorization,
null-valued, attribution or provider-beta extras. The owned selected model headers supply this
pair as initial provider headers, and settings disable automatic attribution.
A callback changing/removing/adding a field refuses, not silently strips it.
Hook exceptions reaching the adapter refuse; Pi's caught extension-hook exceptions
are NOT vetoes. Default extensions are absent. All transforms finish before freeze;
no onPayload/header callback survives verification. onResponse is captured,
network-incapable, invoked only after metadata arrival; it cannot rewrite request
or trigger another launch. Throwing callback is semantic failure, not no-send.

### Exact tariff and conservative reserve bound

Production requires retained, authenticated endpoint evidence binding selected
provider/model/binding, full unambiguous endpoint slug, standard tier, source bytes,
observation/expiry, tariff digest and P2C evidence/config/runtime/catalog digests.
The initial tariff is a CONSTANT account USD input/output rate plus per-request
fee, expressible by actual P2B PmcPriceInputV1 with otherFees:none-attested.
No model-wide cheapest-price substitution, tier variant, BYOK, context-dependent
price bracket, image/audio/web/cache-write surcharge or unpriced billing component.
Automatic provider caching must be proved absent or bounded by the approved input
rate; omission of cache controls is not proof. Cached response usage unsupported
by the profile is an unknown-charge result, never fabricated zero cost.

Bind provider.max_price prompt/completion in USD per million tokens and request
in USD per request to that same tariff. Parse and serialize decimal lexemes
exactly: reject a cap unless its JSON number round-trip preserves the approved
rational cap (never round upward). Caps filter routing; they do not themselves
prove account fees, actual spend or token bounds. Do not issue a paid request
unless all those facts have independent approved provenance.

Before C computes/reserves money, acquisition has authenticated maximumInputTokens
and maximumOutputTokens for the same profile. After final transformation P2D must
prove the complete request lies within them. A supported bound certificate must
cover exact model tokenizer/version, chat/system framing and provider additions,
plus all billable visible/hidden output. Counting request bytes, context_length,
model-wide maxTokens, character/4 or prices alone cannot issue this certificate.
One permitted method is an approved exact tokenizer/framing algorithm using
existing dependencies; another is an explicit provider-enforced BILLABLE ceiling
with a reviewed source guarantee. Neither currently exists in this evidence set.
No guessed initial numerical production bound is supplied. Failure returns
BOUND_REFUSED before reserve; no temporary low-budget exception. P2B computes the
ceiling using its unchanged exact rational/ceiling behavior, not Pi float costs.

Candidate for later useful smoke: ratified L5 public bounded-prose binding
`google/gemini-3.8-flash`, requested low, source map low->low in retained RCM v4
coverage/projection. This is a real retained catalog observation, NOT current
availability, endpoint tariff, quality, privacy or execution approval. Minimal is
absent; off is absent; Haiku fallback has REASONING_UNKNOWN_REFUSED. No fallback
is synthesized. Full eligibility must still be returned by actual P2A under the
accepted RCM profile and quality evidence. Unknown endpoint/billing bounds mean
this candidate cannot yet be activated, including for a live smoke.

### Actual pinned restricted Pi construction

Use actual ModelRuntime.create with supplied memory-only CredentialStore,
ModelsStore, modelsPath:null, allowModelNetwork:false, refreshOnCreate:false.
CredentialStore.read returns undefined ONLY for openrouter after native provider
registration; before that it refuses every provider. All other reads throw a
constant sanitized disabled-provider error, before auth can consult ambient env or
files. list returns []; modify/delete always refuse without invoking supplied
functions. No runtime key override, auth file, OAuth/login or environment key.
ModelsStore.read returns undefined; write/delete refuse; it never opens a path.

Register an actual Provider<'openai-completions'> with id openrouter,
getModels returning just the owned selected model, no dynamic refreshModels or
OAuth/deferred methods, auth.apiKey.check returning a local configured marker and
resolve returning `{auth:{}}` without reading ctx/credential/env. stream refuses;
streamSimple is the governed bridge only. This is tokenless Pi setup, NOT provider
authentication. Actual bearer material comes only from the captured synchronous
supplier inside the owned sender after consume. A supplier error cannot leak its
value or thrown object. No await/network refresh/command is allowed in supplier.

registerNativeProvider schedules refresh({allowNetwork:false}) even after
refreshOnCreate:false. Pinned remote-catalog-provider and radius refresh code
restore memory state then return before network when false; credential errors
block ambient availability checks. Expected disabled-provider availability errors
are permitted ONLY as this bounded local initialization outcome, never used for
fallback. Do not export ModelRuntime or AgentSession to the caller; their public
refresh/model mutation APIs would widen authority. allowModelNetwork:false is
NOT a permanent network kill switch (source uses PI_OFFLINE for its default).
This construction relies on closed private reachability plus source-pinned tests,
not global monkeypatching or a hostile-JavaScript sandbox.

Supply actual SettingsManager.inMemory with compaction.enabled:false,
retry.enabled:false, retry.maxRetries:0, retry.provider.maxRetries:0,
cacheWarming:'off', enableAnalytics:false, enableInstallTelemetry:false,
packages/extensions/skills/prompts/themes:[], enableSkillCommands:false,
defaultTools:[], defaultProjectTrust:'never', transport:'sse'. Supply fresh
SessionManager.inMemory, explicit selected model and exact thinking level,
scopedModels:[], noTools:'all', tools:[], customTools:[], and closed ResourceLoader.
Its getters return empty collections plus explicit fixed system prompt;
getSystemPromptSource returns undefined; getAppendSystemPrompt/Sources return [];
reload is a local no-op; extendResources refuses. getExtensions returns exactly {extensions:[],errors:[],runtime:createExtensionRuntime()}
using the actual pinned constructor, with no executable extension or pending registration.

createAgentSession still calls clampThinkingLevel: compare requested, model
source map, resulting session level and options.reasoning; any difference refuses
before reserve. No implicit permitted basic level. Only private one-shot prompt(userText,{expandPromptTemplates:false})
and dispose are reachable; public output exposes neither session nor model runtime. No resume, cycle, setModel, fork/tree summary, compact,
steering, continuation, background prompt or second tool turn. Automatic retries
are disabled and the invocation bridge refuses a second stream even if Pi tries.
CacheWarmer off is source-supported and must be actual-code tested. No CLI or
interactive session. SDK load/import side effects must be inspected before tests
execute imports; network-denied tests run with temporary directories only.


Actual pi-agent-core agent-loop.js spreads the entire AgentLoopConfig into stream
options, not just SimpleStreamOptions. The runtime adapter recognizes only the
pinned keys model, reasoning, sessionId, onPayload, onResponse, transport,
thinkingBudgets, maxRetryDelayMs, toolExecution, beforeToolCall, afterToolCall,
finishTurn, prepareRequest, prepareNextTurn, convertToLlm, transformContext,
getApiKey, getSteeringMessages, getFollowUpMessages, apiKey, signal, timeoutMs,
websocketConnectTimeoutMs, maxRetries, headers, env. These are produced by the
actual private session, not accepted from task input. Validate model/effort/session
identity, transport=sse, maxRetries=0, apiKey/env/getApiKey absent or undefined,
thinkingBudgets absent or undefined, exact header pair, bounded positive timeout
and actual AbortSignal. SDK-owned unused loop callback fields retain private
provenance and are never called by transport or serialized. Only onPayload and
onResponse are captured for their documented invocation. Unknown keys and supplied
fetch/samplingParams/metadata/deferred/cacheRetention/temperature/toolChoice refuse;
no spread of options/model.samplingParams into the provider body. The known
websocket timeout is inert under SSE. Tests pin this actual options key set.
### Sole terminal operation and proof custody

send accepts the same WireV1 and acknowledged consumed AttemptV1 that C verified.
Before first await it checks private boundProof identity, marks it consumed,
gets the synchronous credential, constructs fixed HTTPS options, marks
operationMayHaveBegun immediately BEFORE calling node:https.request once and
writes/ends the retained immutable body. Agent:false, default TLS verification,
fixed hostname/port/path and no proxy/custom CA/lookup/redirect/retry/SDK client.
Protocol-controlled Host/Content-Length/Connection are deterministic transport
framing, not mutable application headers; only Authorization is added by supplier.
Missing/invalid credential or abort before operationMayHaveBegun can issue direct
no-send proof. A thrown request constructor after that marker is uncertain.
No callback, await, audit or external lookup is inserted between C's acknowledged
consume and invoking its captured send. DNS/TLS/connect failure, HTTP redirect,
status error, abort, timeout or empty response after the marker never proves zero
charge. Abort destroys once, never recreates a request.

One private installation-owned observation registry uses a WeakMap binding empty
proof identity to owned Observation, exact wire/request/decision and the complete
acknowledged consumed AttemptV1. No public proof issuer/reconciliation function.
Its role-separated captured capabilities are finite:

- D alone calls register with its newly issued empty proof identity, owned
  observation, exact prepared wire/decision/request and consumed AttemptV1.
  Registration returns `{accepted:false}` or `{accepted:true,proofId:Id}`.
  Duplicate identity/ID, mismatched retained invocation or absent controller
  custody refuses; no caller-supplied proofId is accepted. IDs are unique in the
  retained epoch. Registration alone does not grant controller observation custody.
- C alone calls observe after receiving that exact proof directly from its
  captured send call. It supplies its privately retained invocation, complete
  request/decision/wire and acknowledged consumed AttemptV1. Result is
  `{accepted:false}` or `{accepted:true,proofId:Id,observation:Observation}`.
  Registry compares all retained identities and values and records this direct
  controller observation before returning an owned immutable observation. C uses
  its semantic/Charge union to choose existing cancel/settle and owner completion.
- Ledger gets only existing authenticateSettlement/authenticateNoSendProof
  capabilities. They resolve `{proofId}` only while C holds the matching observed
  invocation custody and return exactly P2B's existing accepted/refused schema.
  Always compare exact ledgerId, epoch, requestId, requestDigest, scopeId,
  maximumMicroUsd, costValueDigest and createdAtUtc against the retained consumed
  attempt. Initial authentication requires the complete original consumed state
  and fields. Ledger replays pass the current terminal attempt, not the original
  consumed value: accept only state, actualMicroUsd, proofRef and proofDigest
  derived from THIS immutable observed proof (known -> settled with exact charge;
  unknown -> uncertain with null actual; no-send -> cancelled with null actual),
  plus a valid updatedAtUtc no earlier than the retained consumed timestamp and
  no later than the trusted current clock. Never ignore mutable fields or accept
  an arbitrary terminal state. Cancelled liability is released by the ledger's
  state accounting; its actualMicroUsd remains null, not a fabricated measured zero.
  This permits unchanged ledger idempotency, not a new send, proof mint, owner
  finish retry or liability relaxation. A known ID without the matching observed
  invocation cannot authenticate.

The registry lives in reviewed private installation, with D register and C observe
implemented as invocation-bound closures. No new public export, caller-supplied
registry or runtime-selected issuer is allowed. Reads are non-destructive: the
same immutable record must serve C semantic authentication and ledger proof
authentication through reconciliation/idempotent replay. Finished invocation
custody cannot authorize another invocation. Copied, cross-invocation and restart
proofs refuse; retention does not recreate capabilities after restart. C receives only
its existing `{kind:'terminal',proof}` or `{kind:'uncertain',proof:object|null}`.
This shared registry maps unique proofId wrappers to exact identities for existing
P2B accepted schema: ledgerId, epoch, requestId, requestDigest, scopeId, proofRef,
proofDigest and noSend:true OR outcome:{kind:'known',actualMicroUsd} / {kind:'unknown'}.
Raw tags/IDs/JSON/copies/restart objects cannot authenticate. Owner completion uses
C's distinct authenticated semantic result and acknowledged actual ledger result;
D does not finish B1 or change its nullability/state machine.

Cost uses raw bounded JSON numeric lexeme for usage.cost (account charge), never
Number.toString, token estimates or upstream_inference_cost. Exact decimal parsing
allows <=64-character JSON nonnegative numeric lexeme and exponent magnitude <=18;
convert with integer rational arithmetic. Settle known only if USD*1,000,000 is an
integer <=Number.MAX_SAFE_INTEGER. Fractional microUSD, overflow, malformed/missing
cost or incomplete/mismatched response returns authentic unknown, retaining the
full reservation and blocking fallback. No rounding, fabricated zero or ledger
schema change. A larger representable actual charge is forwarded unchanged so
P2B's existing over-bound freeze applies. Preserve bounded raw cost lexeme and its
source/digest privately for the process lifetime; no durable raw-provider receipt
store is added. After restart ledger liability remains; recovery/cost precision
amendment is separate work. This deliberately trades availability for honesty.

### Bounded SSE, JSON and Pi event mapping

Require HTTP 200, Content-Type text/event-stream (optional charset=utf-8 only),
no content encoding and <=16 KiB response headers. Whole response <=4 MiB,
individual SSE event <=128 KiB, <=16,384 events, accumulated visible UTF-8 text
<=1 MiB; total deadline 120 s from send entry, idle deadline 30 s, cancellation
always installed. Incremental TextDecoder fatal:true; split UTF-8/CRLF works,
invalid/incomplete final UTF-8 refuses. Accept LF or CRLF, bounded colon comments,
data lines joined by newline. No event/id/retry fields, BOM or reconnect. Parse
bounded JSON with duplicate-key detection, depth<=16 and <=16,384 nodes per event.
Ignore comments only; no ignored data blobs or unbounded partial line buffer.

Normalized internal event union is exactly:
`{kind:'role'}` | `{kind:'text',text:string}` |
`{kind:'finish',reason:'stop'|'length'}` | `{kind:'usage',usage:ValidatedUsage}` |
`{kind:'done'}` | `{kind:'failure',code:TransportCode}`.
One response id/model, one choice index 0. Wire chunks have allowed fields
id, object, created, model, provider, system_fingerprint, choices, usage; reject
extras. object is chat.completion.chunk; id/model required and stable; model must
match the authenticated response-model mapping (no alias guess). Optional provider
must match the approved response identity; display name alone is not endpoint
proof. Each choice is exactly index, delta, finish_reason plus optional
logprobs:null. Delta has only optional role:'assistant' and content:string|null;
no tool_calls/function_call/refusal/reasoning/audio fields. finish_reason is
null/stop/length only; once finished, no more text. Empty choices allowed only for
terminal usage. One final usage object, then data:[DONE], then clean EOF; no second
usage, trailing data, inferred completion or success on socket close alone.
Unsupported/error content can still carry independently valid account cost; if
not completely authenticated it remains unknown. No generation-lookup request.

ValidatedUsage is exactly safe nonnegative integer prompt_tokens,
completion_tokens,total_tokens plus raw cost lexeme, optional prompt_tokens_details
{cached_tokens,cache_write_tokens,audio_tokens} and completion_tokens_details
{reasoning_tokens}, optional cost_details{upstream_inference_cost}; details use
only listed keys. Require total=input+output, reasoning<=output and cache<=input;
nonzero audio/cache-write or profile-unsupported cache refuses semantic success.
Absent optional counts are unknown, not evidence of zero; profile must independently
attest excluded billing components. Count overruns are semantic failure; a complete
valid account charge can still reconcile exactly. No retries to repair parsing.

Emit pinned Pi events start, text_start(index 0), text_delta*, text_end, then done
(reason stop only) after complete stream AND C's acknowledged successful semantic
reconciliation. Preserve length in the Observation semantic sent to C. Actual C
maps known-charge length to terminal-failed-settled, so after that reconciliation
emit private Pi error with OUTPUT_TRUNCATED and return failed OUTPUT_TRUNCATED;
never done(length), completed partial text or a rewritten succeeded receipt.
Unknown-charge length remains uncertain with the full existing liability and owner
block; truncation must not synthesize a known charge or supersede reconciliation/
unknown-liability refusal. Existing failure/cleanup precedence still applies. Setup failure must emit error directly if a stream exists;
otherwise its retained failure terminalizes any late stream. Post-start failures emit
error reason error/aborted and end stream once. No thinking/tool/deferred events.
Partial content is provisional, never an execution receipt. Pi AssistantMessage
uses the actual api/provider/model, responseId, timestamp and TextContent; no
invented enum. A bounded constant errorMessage carries TransportCode only.

Pi Usage requires numeric cost components but OpenRouter supplies account total,
not an account-cost allocation. Pi usage costs are explicitly NONACCOUNTING
list-rate estimates derived from approved tariff and observed tokens; prior to
usage they are zero-valued NOT-YET-OBSERVED placeholders. Always attach diagnostic
`{type:'pmc-nonaccounting-usage',timestamp,details:{costBasis:'tariff-estimate',
accountingAuthority:'pmc-ledger',usageObserved:boolean}}`. Estimated total is sum
of estimated components, never a fabricated split of account cost. Unknown detail
counts remain represented by diagnostic evidence, not a claim of measured zero.
Do not expose Pi usage totals as actual spend. The pinned getSessionStats path calls
addUsageToTotals, which sums usage.cost.total without inspecting diagnostics.
This internal accumulation is permitted only inside the private one-shot session:
it is compatibility estimation, never accounting. Do not change Pi's accumulator.
Retain and test the diagnostic on the actual assistant message/session; the
accumulator itself is not required to interpret it. No session, statistics, usage
object or estimate is exported to callers or used for permit, ledger, liability,
actual-spend metrics or savings. P2E presents only C's reconciled receipt and bounded
output text. If diagnostics are lost from the actual session or private estimates
escape this boundary, refuse integration rather than relabel them as actual cost.
Ledger proof uses only the separate Charge union above. Unknown settlement emits
error even if all text arrived; no successful done before owner/ledger closure.

### Portable pinned Pi dependency boundary

This amendment from 343250e08eaee72581d7b925a7b9b6796f9e3536 changes documentation
only. Independent design review and a fresh builder Step 0 precede runtime release.
Future dispatch devDependencies are exactly @earendil-works/pi-coding-agent:0.87.1
and @earendil-works/pi-ai:0.87.1 for the directly imported nominal declarations.
If an actual direct pi-agent-core type import is required, the builder's Step 0
must name that symbol/import and declare @earendil-works/pi-agent-core:0.87.1 before
install; otherwise omit that direct dependency. No floating version/range or
runtime-selected version. This does not authorize arbitrary extra dependencies.

The coding-agent root package exports ModelRuntime, createAgentSession,
SettingsManager, SessionManager, ResourceLoader and createExtensionRuntime; pi-ai
exports the model/context/options/event-stream types through its declared exports.
Use portable package specifiers and exact actual types. Production adapter modules
use type-only Pi imports until reviewed private installation supplies the genuine
constructors/functions. No ts-ignore, absolute local import, structural class cast,
copy of Pi class types or donor node_modules resolution satisfies this contract.

Install only in the future runtime checkout's own real dependency directory,
never through an existing dependency junction or into a donor/global installation.
The builder must inspect the target first and stop for an isolated setup if it is
a junction; do not mutate its target or replace another owner's dependencies.
Commit normal package.json/package-lock.json changes and run normal CI typecheck
plus real Pi tests from that locked installation. Check all 35 existing source
hashes against the actual resolved package files, including nested/hoisted pi-ai
and pi-agent-core resolution. Version equality alone is insufficient. A mismatch
or incompatible nominal duplicate resolution holds for an approved amendment;
never silently repin, downgrade or cast it away. Existing 35 inspection pins stay
unchanged. Guarded dynamic import and private actual-runtime construction are
required tests, not claims established by inspecting installed declarations.

Additional actual-composition controls must start from C's genuine ownWire clone,
prove two verifies and one send on that object, and reject original/clone/cross-wire
substitution. Real known-charge length must settle through unchanged C/B1/ledger
and return OUTPUT_TRUNCATED with no completed text; stop succeeds, unknown-cost
length stays unknown and failed cleanup cannot become success. Actual Pi session
retains the diagnostic while its internal numeric accumulator remains private;
assert external output has only the reviewed receipt/text or failure contract.

## Acceptance Criteria

| AC | Required evidence |
|---|---|
| 1 | Closed requested/final payload parser, duplicate keys, malformed UTF-8/surrogates, depth/size/token limits, tools/images/system changes, unknown options all tested. Real successful P2A selection is used; fabricated selected JSON is not authority. |
| 2 | Actual pinned ModelRuntime and createAgentSession with real inMemory classes, exact Provider/ResourceLoader types, no structural class casts; trap file auth/env credential/network accesses. Local registration refresh executes with zero catalog requests; non-openrouter auth is blocked before ambient access. Explicit model avoids defaults; clamp mismatch, cache warming, compaction, provider retry and second-stream negative controls all produce zero unowned operations. |
| 3 | Actual Pi transforms precede prepare freeze. onPayload replacement/header changes either get newly verified exact wire or refuse. Pi caught-hook negative control demonstrates it cannot veto. Post-freeze aliases/mutations/reentrancy/copies cannot change wire or authorize. C complete Revalidation fields and all value-field digests match literal fixtures. |
| 4 | Network-denied harness observes the actual owned sender's request constructor/write/end and every failure boundary. One exact operation only after real accepted C/B1/P2B durable consume; no-send cutoff precedes constructor, later failures remain uncertain; no redirects/retries/proxy/built-in transport escape. |
| 5 | SSE split at every UTF-8 and CRLF boundary, duplicate/trailing usage/DONE, error/status/encoding/timeout/abort, content bound, unsupported delta/finish/cost and usage overruns; event order conforms to actual Pi type/runtime stream result and terminates once. |
| 6 | Raw cost fixtures 0, 0.000001, 0.0000001, exponent, malformed, duplicate, overflow and over-bound show exact known integer or unknown preservation using unchanged real ledger. Estimate/placeholder Pi Usage never becomes ledger actual. Restart/lost ack uses actual accepted B1 and temporary SQLite, never map-only custody. |
| 7 | Tariff/profile mismatch, broad endpoint slug, tier alias, server fallback, unsupported max_price precision, missing framing/tokenizer/hidden-output/cache/fee proof all refuse BEFORE reserve. Production certificate evidence is separately reviewed; synthetic good-profile fixtures do not close that gate. |
| 8 | Private rendezvous one-shot/mismatch/concurrency tests; real predecessor types compile. Start solely from documented factory/registry capabilities and real ledger: known success, failed-settled, no-send, unknown, copied and cross-invocation proofs. Apply the identical proof twice for known, unknown and no-send; independently reject wrong terminal state, charge, proof fields and timestamp. Actual Pi tests cover failure before stream creation, a never-resolving hook, C rejection after preparation, finalizer replay and cleanup timeout. On ordinary failure both stream.result and prompt settle; timeout returns failure and observes remaining promises without claiming drainage. Successful completed text is bounded and returned only after reconciliation/drain. Export review finds no public factory/mint/sender/credential/test mode. Two independent concrete reviews distinguish actual-code, fake-network and production-evidence coverage. Useful L5 candidate remains disabled until every readiness gate passes. |

## Out of Scope

Other protocols/providers, built-in sender delegation, tools/images/multiturn
agents, real calls/probes/spend, credentials/host settings, dependencies beyond the pinned development set below,
ledger/controller/owner rewrites, ranking/model map changes, raw receipt storage,
IPC/HMAC, generic extension support, production activation and full HRO exit.

## Context & References

- [Amendment 05](../../goals/pi-model-configuration/gate-1-amendment-05.md)
- [P2C](../done/PMC-P2C-same-process-launch-controller.md)
- [P2B1](../done/PMC-P2B1-durable-intent-custody.md)
- [Source preflight](../../goals/pi-model-configuration/pmc-p2d-terminal-preflight.md)
- [Composition notes](../../goals/pi-model-configuration/pmc-p2d-composition-notes.md)

## Allowed Files

Future implementation only after reviewed contract and explicit dispatch:

- plugins/foreman-line/dispatch/src/pmc-launch/openrouter-chat-stream.ts
- plugins/foreman-line/dispatch/src/pmc-launch/owned-https-sender.ts
- plugins/foreman-line/dispatch/src/pmc-launch/pi-runtime-port.ts
- plugins/foreman-line/dispatch/tests/pmc-openrouter-stream.test.ts
- plugins/foreman-line/dispatch/tests/pmc-owned-sender.test.ts
- plugins/foreman-line/dispatch/tests/pmc-pi-runtime.test.ts
- plugins/foreman-line/docs/goals/pi-model-configuration/pmc-p2d-verification.md
- plugins/foreman-line/dispatch/package.json
- plugins/foreman-line/dispatch/package-lock.json

Exactly nine future implementation files are listed above. No barrel, other dependency/lock/config, C/B/B1/A/RCM changes. This shaping task writes
ONLY this draft, terminal-preflight and composition-notes; no ShapingResult under
the coordinator's explicit three-document envelope.

## Verification Plan

Shaping: existing frozen donor spec-linter; required body/local-link checks;
git diff --check and exact three-file diff. No source execution or inference.
Future runtime: Node24.19.0; from plugins/foreman-line/dispatch run `npm.cmd test`,
`npm.cmd run typecheck`, `npm.cmd run lint` and check exit codes. Temporary actual
Pi typecheck must resolve the isolated checkout's locked portable package declarations as part of normal dispatch CI typecheck, not an absolute-path-only side harness. Network, ambient-auth/file and subprocess guards are installed before dynamic imports in actual-code tests; inspect imports first.
Fake streams prove parser/controller logic, not actual Pi initialization, TLS,
provider identity, endpoint pricing or paid bounds. Live evidence requires its
own future authorization, authoritative profile and nonzero accepted reserve.

Reviewer focus: Can any reachable Pi callback or local refresh resolve ambient
auth or send outside the closure? Do native auth and real provider credentials
remain separate? Does every billed component have a pre-reserve bound? Is the
endpoint slug truly singular? Can unknown/fractional cost become zero, success or
fallback? Can provisional Pi events be mistaken for reconciled success? Do the
private invocation and unchanged C ports carry enough authenticated claims?

## Readiness

DRAFT/nondispatchable. Required: accepted B1 and C implementation; two independent
reviews of this concrete design; explicit disposal of notes C1/C2 and actual pinned-runtime offline conformance;
authenticated exact endpoint/tariff/billable bound certificate for at least one
ratified useful lane and source-map level; independent quality/privacy/availability
evidence. No real production certificate is present. Offline implementation may
be released only with an explicit reviewed refusal-only production limitation;
that release cannot count as public activation or full HRO completion.

## Offline runtime/setup release — 2026-09-26

The frontier PMC builder completed fresh actual Step0 and stopped at572f395,
rechecking all35 inspection hashes, actual predecessor sources and portable
package exports. Root accepts that Step0 under delegated prerequisite authority.
Exactly the nine implementation paths above are released. Direct new development
dependencies are only coding-agent0.87.1 and pi-ai0.87.1; no direct pi-agent-core
import/dependency is needed or authorized without a concrete follow-up disposition.

Use only this isolated checkout's real dependency directories, inspecting every
target before setup. Installing the two exact packages and existing sibling lock
closures is authorized with scripts disabled, normal lock generation for dispatch
only and no changes to sibling manifests/locks. Empty task-owned npm user/global
configuration and a hygienic child environment prevent ambient credential/proxy
use. Necessary public npm-registry retrieval of locked dependencies is authorized
if the local cache is insufficient; this is package setup, never a provider API
call. Do not use an alternate registry or run package install scripts. Recheck all
35 actual resolved pins and nominal compatibility before dynamic Pi import.
Mismatch holds for review; never silently repin, cast or suppress errors.

Preserve guards-before-import and genuine RED/GREEN, actual Pi/C/B1/ledger offline
composition, exact wire identity, stop-only completion and private diagnostic
retention. Production remains refusal-only before reserve, credential supplier or
HTTPS without genuine production evidence. No provider call, host configuration,
credential read, new dependency outside the frozen set or predecessor edit.
C reader/audit/main acceptance remains a shipping gate. Freeze a clean source/report
handoff after focused and appropriate regression/typecheck/lint checks; two source
reviews, combined checks and remote CI still precede merge or activation.

### Reassigned completion release — 2026-09-26

The separate PMC app task's latest user instruction limits it to a draft response;
that scope is honored. Under the HRO user's explicit prerequisite-completion
and blanket decision authority, root reassigns this unfinished nine-file parcel
to frontier D inside HRO. Existing eight in-progress paths are preserved, not
reset or treated as accepted source. D's genuine read-only Step0 ate56b756 found
all35 local inspection hashes matching, actual direct/nested Pi0.87.1 directories,
old lock entries/versions/integrities preserved, and53 parser/sender tests passing.
Typecheck currently fails on missing composition/profile exports; the Pi port is
only a production-refusal stub and the verification report does not yet exist.

Root explicitly releases completion in the same nine-file envelope above. Existing
spec, custody, nominal Pi types, bounds and no-live restrictions remain. Complete
the real private Pi rendezvous and actual guarded Pi/C/B1/ledger composition,
including stop/known and unknown truncation, no-send, replay, failure and cleanup.
The seed test's missing exported offline composer/makeSender shape is not an
approved runtime API: replace that unfinished assumption with the reviewed
installation-private statically owned sender and test-only guarded native-boundary
substitution. No shipped generic fake sender/factory, mode flag or structural Pi
class substitution. No other source/package change is authorized.

Existing installation execution provenance is reported as prior builder evidence;
D's direct hash/directory/lock checks are independent evidence of the resulting
packages, not a claim that contents prove install flags. Do not reinstall or touch
global packages/credentials/configuration. Run genuine missing-case RED/GREEN,
full affected checks, freeze the exact nine-file source/report commit and STOP
for root plus another independent frontier review. No push/merge/provider call.
