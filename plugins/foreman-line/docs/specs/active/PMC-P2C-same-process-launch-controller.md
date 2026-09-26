---
ticket: PMC-P2C
title: Same-process one-use launch controller
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

Compose the actual PMC owner resolver and exact-money/durable-ledger APIs into
one private same-process authorization boundary. Own the final wire string,
authenticate its facts, reserve the exact maximum, mint a private one-use permit,
and durably consume immediately before the sole sender invocation. Descriptive
JSON, resolver decisions and receipts never authorize inference.

This is a concrete review draft, NOT a build release. The complete episode-owner
primitive below does not exist in the inspected predecessors. Its acceptance and
implementation are a prerequisite, not an assumed trusted service. V8 resolves
the owner/version decisions; implementation and review gates remain in Readiness.
No implementation is authorized here.

## Constraints

### Inspected predecessors and authority

- Amendment 05 governs: same-process registry authority, public OpenRouter chat
  only, exact money, no automatic retry, nonpublic/L6 refusal, empty break-glass.
- P2A frozen spec blob `d65ff524bba2eda6c9e38de44c78aac4aae1c59f`; actual types,
  resolver/types inspected at merged `4b86643acd4e5cdf183e85cf1cd1c2ace51e0182`
  (repaired `bb89be9`, public types unchanged). Integration must include accepted
  P2A/P2B and separately accepted P2B1 before dispatch.
- P2B frozen spec blob `b8b6061f86239196f208467e849c845754d0d2a6`; actual money,
  ledger and handoff at `835a6dd82ee4e50652362e7201a79b7451bbd221`. Later
  `9f91757` is documentation only. Older local A/B drafts do not supersede these.
- `resolvePmcRouteV1(unknown, unknown): PmcRouteDecisionV1` is the sole selector;
  `computePmcCostV1` is the sole money calculator. Use actual exported types,
  not copied approximations or a second ranking, policy validator or rate parser.
- Node 24.19.0, existing dependencies. No network/SDK imports in controller core.
  Controller adds no schema/storage changes, initialization, budget provisioning
  or host writes. P2B1 separately owns its storage; P2B stays unchanged.
- L1/L2 remain opencode-pinned and refuse this transport before dependency effects.
  L6 and legacy routing/classification aliases refuse; no redirect to another lane.
  Initial public-only scope does not close full HRO live acceptance criteria.

### Closed controller and request surface

Imports below refer to actual P2A public barrel and P2B internal modules.
`Id`, `Digest`, `Text`, `UInt`, `Utc` retain P2A refinements. Every listed field
is required; null is absence; every record is closed and deeply owned/readonly.
The snippets are contracts, not an instruction to export constructors.

```typescript
type LaunchInputV1 = Readonly<{
  version: 'pmc-launch/v1'; intentRef: Id; route: PmcRouteRequestV1;
  payloadJson: string; override: null | 'requested';
}>;
type LaunchReceiptV1 = Readonly<{
  version: 'pmc-launch-receipt/v1'; authority: 'audit-only';
  requestId: Id; requestDigest: Digest; decisionDigest: Digest;
  wireDigest: Digest; ledgerId: Id; epoch: Id; scopeId: Id;
  maximumMicroUsd: UInt;
  disposition: 'terminal-no-send' | 'terminal-failed-settled' | 'succeeded' | 'uncertain';
}>;
type ControllerCode =
  | 'INPUT_REFUSED' | 'BOUNDS_REFUSED' | 'BREAK_GLASS_REFUSED'
  | 'LANE_DISABLED_REFUSED' | 'INTENT_REFUSED' | 'NONPUBLIC_REFUSED'
  | 'VERSION_REFUSED' | 'PINNED_TRANSPORT_REFUSED' | 'INSTALLATION_REFUSED'
  | 'EPISODE_REFUSED' | 'EVIDENCE_REFUSED' | 'CLOCK_REFUSED'
  | 'CATALOG_REFUSED' | 'MONEY_REFUSED' | 'RESOLVER_REFUSED'
  | 'WIRE_REFUSED' | 'LEDGER_REFUSED' | 'PERMIT_REFUSED'
  | 'REVALIDATION_REFUSED' | 'SEND_UNCERTAIN' | 'RECONCILIATION_REQUIRED';
type LaunchResultV1 =
  | Readonly<{ok: true; receipt: LaunchReceiptV1}>
  | Readonly<{ok: false; code: ControllerCode; receipt: LaunchReceiptV1 | null}>;
type PmcLaunchControllerV1 = Readonly<{
  launch: (request: unknown) => Promise<LaunchResultV1>;
}>;
```

`payloadJson` is UTF-8 JSON representing requested provider payload data, not
executable code, a trusted descriptor, headers, URL, credentials or a callback.
P2D must parse/validate its supported payload schema, perform every permitted
transformation, and reject unknown fields; it cannot forward arbitrary JSON.
It overwrites no conflicting model/thinking/privacy/count field to force a match:
conflict refuses. Controller binds the exact caller string in requestDigest,
then separately binds the final owned serialized wire string. P2D's concrete
supported payload schema and semantic verifier are production prerequisites,
not permission for a pass-through implementation in P2C.

`route` is a request proposal, never policy or owner evidence. The episode owner
authenticates intentRef against its pre-existing authoritative task record and
compares EVERY workflow/task/episode/request/lane/version/attempt field. Trusted setup
preissues episode/request IDs BEFORE caller digest creation. Begin validates the
unchanged approved request and controller-computed requestDigest, or refuses; it
never substitutes IDs, rewrites fields or repairs a mismatched digest. Caller
fallback claims never substitute for owner-sourced prior proof. IntentRef possession
alone is not authority: the installed owner is scoped to the initiating workflow/
task and authenticates that origin outside ordinary JSON. No public task/episode
registration or 'start another episode' flag exists.

Only PmcLaunchControllerV1, LaunchInputV1, LaunchResultV1, LaunchReceiptV1 and
ControllerCode may be barrel TYPE exports. Runtime factory, ports, permit,
prepare/consume, authenticators and ledger are internal imports available solely
to reviewed P2E installation code. Package-internal JavaScript is not a hostile-code
sandbox. No public runtime constructor or synthetic-mode switch is added.

### Bounds, capture and refusal precedence

Before reading dependencies, capture ordinary request data using descriptors:
no getters/toJSON, symbol/hidden/extra keys, nonplain prototypes, sparse/extended
arrays, cycles, functions, nonfinite values or thenable keys. Catch failures without
reading/coercing thrown objects. Depth <=16, visited keys/values <=65,536,
aggregate UTF-16 string units <=1,048,576, ordinary string <=2,048 units.
`payloadJson` alone may be <=262,144 UTF-16 units and <=1,048,576 UTF-8 bytes;
validate both BEFORE parsing. Charge aliases by expanded size. P2A retains its
independent bounds, including two history attempts and 256 binding/catalog items.
No truncation/coercion/default/normalization. Proxy traps are outside ordinary-data
execution-time guarantees; trapped failures still deny. The final WireV1.body
string has an independent 1,048,576-byte UTF-8 cap. It does not inherit the
payloadJson UTF-16 cap or consume the ordinary metadata aggregate string budget.
Its key and value-node still count normally; all other wire metadata retains the
ordinary depth/node/key/string/aggregate bounds. No other string is exempt.
Response handling remains P2D-owned and bounded.

For structurally capturable requests, use this deterministic first-failure order:

1. Capture failures/bounds first. Any present non-null override returns
   BREAK_GLASS_REFUSED, including unknown override values. Next inspect route.lane
   only when an own string: exact `L6`, `routing`, `classification`,
   `structured-decision`, `jev`, `Jev`, `typesafe/jev-1.13` return
   LANE_DISABLED_REFUSED. This closed deny list includes observed legacy lane/model
   names; unknown spellings never become supported lanes.
2. Missing intentRef/route/lane or unsupported lane spelling returns INTENT_REFUSED.
   Only exact L1..L5 advance. Nonpublic/unknown dataClass returns NONPUBLIC_REFUSED.
   Wrong/missing explicit outer or route version returns VERSION_REFUSED. Remaining
   closed schema/field/type failures return INPUT_REFUSED in declaration order.
3. L1/L2 return PINNED_TRANSPORT_REFUSED. No resolver, catalog, owner/store, clock,
   ledger, Pi initialization/discovery, transport preparation or sender has run.
4. Installation, owner begin, evidence/clock/catalog, money, resolver, final wire,
   reserve, final revalidation, permit/consume, sender and reconciliation run in
   that order. Failure stops. Preserve actual predecessor codes and RCM stage
   privately in bounded audit; do not flatten their internal error precedence
   or leak raw errors into LaunchResultV1.

Payload contents cannot nominate authority, winner or a trusted port; P2D rejects
such fields. No dependency is evaluated to decide preflight denials. Cross-field
combinations and zero-call spies pin this order.

### Trusted installation and evidence ports

Installation captures own enumerable function descriptors once; it never freezes
caller functions or retains mutable ports records. All injected/mock-only
acquisition seams return unknown and receive bounded validation. This closed
internal record is constructed by reviewed P2E code, never selected by input.

```typescript
type InstallationPortsV1 = Readonly<{
  clock: () => unknown;
  owner: IntentOwnerV1;
  originCapability: object;
  acquire: (request: PmcRouteRequestV1) => unknown;
  revalidate: (claims: RevalidationV1) => unknown;
  ledger: LocalPmcLedger;
  transport: TerminalPortV1;
}>;
type RevalidationV1 = Readonly<{
  requestDigest: Digest; decisionDigest: Digest; wireDigest: Digest;
  policyDigest: Digest; configDigest: Digest; runtimeDigest: Digest;
  catalogDigest: Digest; evidenceDigest: Digest; expiresAtUtc: Utc;
}>;
```

### Private bootstrap and observation arguments (Step 0 amendment)

B1 captures selection/completion authenticators when it opens. C therefore cannot
first receive an already-open owner and only then invent the callbacks it needs.
Freeze this private two-stage constructor, using actual B1 OwnerPorts types:

```typescript
type ControllerObservationContextV1 = Readonly<{
  request: LaunchInputV1;
  decision: Extract<PmcRouteDecisionV1, {ok:true}>;
  wire: WireV1;
  consumed: AttemptV1;
}>;
type ControllerObservationPortsV1 = Readonly<{
  observe: (proof: object, invocation: object,
    current: ControllerObservationContextV1) => unknown;
}>;
type ControllerBootstrapV1 = Readonly<{
  authenticateSelection: OwnerPorts['authenticateSelection'];
  authenticateCompletion: OwnerPorts['authenticateCompletion'];
  bind: (ports: unknown, observations: unknown) =>
    | Readonly<{ok:true,controller:PmcLaunchControllerV1}>
    | Readonly<{ok:false,code:'INSTALLATION_REFUSED'}>;
}>;
declare function createPmcControllerCustodyV1(mode: unknown):
  | Readonly<{ok:true,custody:ControllerBootstrapV1}>
  | Readonly<{ok:false,code:'INSTALLATION_REFUSED'}>;
```

The private constructor accepts only the exact primitive evidence modes
`supplied-production-claims` or `synthetic-offline`, selected by reviewed
installation/test composition, never a request/config/task field. No public mode
switch or runtime factory is barrel-exported. Creation allocates only private
capability registries; no clock, storage, owner, credential, SDK or network call.
Authenticators return `{accepted:false}` before successful bind and authenticate
only capabilities minted by this controller from its direct acknowledged calls.

Installation obtains these captured authenticators, opens real B1 with them and
its own origin/clock ports, then calls bind once with unchanged InstallationPortsV1
and the separate closed ControllerObservationPortsV1. The first bind attempt
consumes the latch even on failure; no owner/port replacement or rebind. Do not
retain or freeze caller records/functions; capture descriptors/method identities
once and reject unknown fields/accessors/thenables. No predecessor source changes.
Bootstrap authenticators are verifiers, not public capability issuers. Failed bind
does not create a controller, invoke an owner transition or repair durable state.

C mints a private per-launch invocation identity and invokes observe only for the
proof object returned directly by its captured send. It supplies its owned current
request, actual successful resolver result, exact wire and acknowledged consumed
attempt. The registry result is exactly `{accepted:false}` or
`{accepted:true,proofId:Id,observation:Observation}` with the closed Observation,
Charge and finite TransportCode unions already specified by P2D. These private
SDK-free types may be shared from controller-types.ts; do not import Pi/D runtime
into C or introduce a public issuer. Capture/validate the returned ordinary data;
the callback itself comes only from trusted installation's C3 registry. Copies,
cross-invocation proofs and ID knowledge without direct observation custody refuse.
No added field widens InstallationPortsV1 or changes TerminalPortV1 signatures.

This explicit private constructor amendment requires two independent design
reviews before release. It closes construction order and finite-capability gaps;
it does not establish production authority or accept synthetic claims as real.

### Acquisition and revalidation (continued)

`acquire` is synchronous, without provider/catalog refresh. Accepted closed return
is `{context, catalogInput, catalogSource, prices, runtimeDigest, evidenceDigest, expiresAtUtc,
scopeId, classCeilingMicroUsd, ceilingAuthorityRef, ceilingAuthorityDigest}`.
context has exactly PmcResolverContextV1's fields EXCEPT catalog, episode, budget,
evaluationTimeUtc, evidenceMode and bindings.cost. Each acquisition binding instead
has its other exact P2A fields plus required costEvidence:EvidenceRef. The controller
sets evidenceMode from construction custody, never request data. catalogInput has
exactly CatalogEligibilityInput except evaluationTimeUtc; controller supplies time.
canonicalBytes are privately copied genuine fixed Uint8Array <=8MiB, no shared/
resizable buffer: the sole bytes exception outside ordinary-data capture. prices
is <=256 exact PmcPriceInputV1 values, one per binding without extras/omissions/
duplicates. All other fields use their named P2A refinements.
catalogSource is exact CatalogClaim['source'], with original authenticated source
EvidenceRef; supplied profile ID/version/digest, snapshot digest and config authority
must match RCM input/provenance and all price source fields. It is not reconstructed
from a numeric projection. Unknown source refuses before selection.

Trusted acquisition authenticates original source content, receipt identity/digest,
issuer/scope, observation/expiry, request/subject/lane, policy/config associations
and complete independence subjects. It computes source hashes from owned canonical
bytes and compares with installed accepted authorities. Equal caller strings,
recorded/owner-accepted tags or caller accepted:true are not authentication.
Authentic unknown facts remain unknown. Price evidence retains original provider
decimal lexemes/profile/tariff/fees and request/count binding; Number.toString()
cannot manufacture that evidence.

Controller invokes public evaluateCatalogEligibility itself. Only stage projector/
result.ok true advances; exact requested provider/id maps to CatalogClaim results,
preserving provenance/source associations. Failures retain actual closed stage/code
in audit. No RCM private reader or fabricated branded snapshot is imported.

For each price invoke computePmcCostV1 and forward its unchanged value/priceEvidence.
Attach independently authenticated acquisition costEvidence to BindingClaims.cost;
remove adapter-only costEvidence. Match every maximum/ranking count, identity,
request/profile/tariff/price digest. No receipt is invented by the pure helper.
Ledger.snapshot({scopeId}) supplies actual balances/identity/epoch. Match workflow,
account/class, limit and scope authority to owner authority. Class ceiling is
separately authorized. Compose budget Claim from snapshot plus owner budgetEvidence;
do not fabricate fresh timestamps on old evidence. Snapshot failure refuses before
resolver; reserve later remains the atomic money gate against concurrent spend.

`revalidate` synchronously returns exactly `{accepted:false}` or
`{accepted:true,current:RevalidationV1,evaluatedAtUtc:Utc}` from installation custody.
Match ALL fields and expiry/freshness/installed authorities. Installation updates
must serialize with this synchronous revalidate/consume/send section. Asynchronously
mutable authority needs a separately reviewed fence; equal digests alone are not
that fence. No task callback runs inside this section.

### Ratified separate owner prerequisite and proof composition

[PMC-P2B1](../done/PMC-P2B1-durable-intent-custody.md) is the sole owner of
persistent business-intent custody and IntentOwnerV1. V8 resolves the separate
owner choice. Its repaired implementation has two independent source and audit approvals; combined integration and all twelve remote checks were accepted in PR63/main727c055. P2B's
metadata/budget_scopes/attempts and existing five operations remain unchanged.
Production construction refuses INSTALLATION_REFUSED until accepted custody exists.

Import B1 types instead of redeclaring a competing port. Trusted P2E setup issues
identities before caller digest construction and installs an origin capability
from its private initiating-task registry. P2C never exposes that capability or
owner methods to request JSON. Begin is synchronous and receives exactly
`{intentRef,request:route,computedRequestDigest}` plus the installation's captured
origin capability. It validates every immutable template field, ID and supplied
digest. Success returns Result value containing claim, unchanged request, exact
P2A episode Claim, authenticated budgetEvidence and BudgetScopeV1. Failure returns
EPISODE_REFUSED; unknown/throw/thenable/lost acknowledgement blocks. No remint.

P2C implements the private selection/completion WeakMaps required by B1; they are
not assumed present merely because this draft names ports. Selection capability is
inserted only from the direct real P2A successful result plus verified owned P2D
wire, unchanged computed cost and authenticated selected candidate quality/matrix
role. It binds owner instance/claim/request, decision/wire digests, scope and cost.
Pass `owner.recordDecision(claim, selectionCapability)` and require Result ok:true
before reserve. B1 never imports P2C runtime, receives callback-selected strings
as authority or interprets caller decision JSON as an authenticated result.

Completion capability is created only from controller-owned invocation state,
acknowledged direct P2B reconciliation and separately authenticated P2D semantic
proof. It binds the exact original claim/request/selection/wire and ledger identity,
proof refs/digests, charge and semantic outcome. Pass it to owner.finish and require
acknowledged Result ok:true. P2B AttemptV1 JSON and knowledge of a proofId alone do
not authenticate. Captured authenticators resolve exact private identities; no
public mint or generic reconciliation API. B1's exact union/nullability rules apply.

Keep private per-claim phase `reserveNeverInvoked` until immediately BEFORE calling
reserve, then irreversibly `reserveMayHaveRun`. Only the former can authenticate
pre-reserve closure with ledger:null. A refusal with no selected decision closes
as closed-refused, returns null receipt and permanently ends that intent. An authenticated selected
pre-reserve no-send may support the declared fallback only if its selection was
primary. Proof failure may hold; if even that durable write fails, pending blocks.
After reserve may have run, closure needs acknowledged matching ledger reconciliation;
absence of a response/receipt never supplies no-send proof.

Owner held/closed-refused with no selection remain distinct from P2A attempts.
Pending/held/uncertain/refused block BEFORE any projection/resolver call; exclude
current pending and all unselected states from P2A history without resetting them.
Only one authenticated selected-primary no-send/failed-settled prior may support
the predeclared second request ID. Prior success or matrix fallback ends the episode.
No third attempt, new IDs/episode, changed-payload initial retry, TTL or automatic
recovery. The owner retains full-epoch history; capacity exhaustion refuses.

The two stores are NOT one transaction:

| Last boundary / failure | Required retained state |
|---|---|
| begin before selection/reserve | Pending blocks; only private never-invoked proof may close refused. Restart cannot recreate that proof. |
| selection commit or reserve lost acknowledgement | Pending owner; reservation may exist. No permit/send, refund or retry. |
| reserve acknowledged, mint/check/final revalidation failure before consume | Reserved liability and pending owner remain. D proofs require an acknowledged consumed attempt; C has no authentic pre-consume cancellation proof. No cancel, owner finish, refund or retry is manufactured. |
| consume failed/lost acknowledgement | Possible consumed liability and pending owner; no send from this path. Missing receipt never proves no-send. |
| send/response/audit/reconcile failure | Consumed/uncertain liability and pending/uncertain/held custody; no remint. |
| ledger terminal commit, finish failure | Money closure alone is not intent closure; pending blocks. Lost owner acknowledgement quarantines the local instance. Normal reopen can use a valid durably committed authenticated primary terminal closure only for the predeclared second attempt, per B1's explicit disposition; no recovery operation, R1 replay or third attempt exists. |

Missing/corrupt owner store or identity/epoch mismatch refuses. Persistent pending
has no restart capability and stays blocked. Same-identity OS backup rollback and
privileged writers lie outside the file-store guarantee; B1 states exact custody
assumptions and conservative availability loss. Actual B1 storage is mandatory in
P2C durability tests, not a process-local map.

### Final wire, terminal proof and P2D seam

```typescript
type WireV1 = Readonly<{
  version: 'pmc-wire/v1'; requestDigest: Digest; decisionDigest: Digest;
  method: 'POST'; operationUrl: Text; protocol: 'openai-completions';
  provider: 'openrouter'; bindingId: Text; providerModelId: Text;
  piHostModelId: Text; dataClass: 'public';
  thinkingLevel: PmcRouteRequestV1['requirements']['thinkingLevel'];
  wireEffort: Text | null;
  data_collection: 'allow' | 'deny'; zdr: boolean;
  toolUse: boolean; structuredOutput: boolean;
  maximumInputTokens: UInt; maximumOutputTokens: UInt;
  body: string; bodyDigest: Digest;
  headers: Readonly<{'content-type':'application/json'; accept:'text/event-stream'}>;
  boundProof: object;
}>;
type TerminalPortV1 = Readonly<{
  prepare: (request: PmcRouteRequestV1, decision: PmcRouteDecisionV1,
    payloadJson: string) => Promise<unknown>;
  verify: (wire: WireV1, claims: RevalidationV1) => unknown;
  send: (wire: WireV1, consumed: AttemptV1) => Promise<unknown>;
}>;
```

prepare receives only successful decision; returns exactly WireV1 or
`{refused:true}`. boundProof is private one-use transport registry identity, not
caller JSON. verify synchronously returns `{accepted:false}` or `{accepted:true}`
after matching privately owned bytes, descriptor, runtime/profile, exact effort
mapping and conservative billing bound. Exact owned WireV1 passed to verify is
passed to send. No descriptor replacement after verification. prepare can await
approved transforms; no transform survives verification.

bodyDigest is SHA-256 exact UTF-8 body. wireDigest hashes declaration-order tuple
of ALL WireV1 value fields except boundProof, including body/headers; proof identity
is retained separately. Exact operationUrl is accepted baseUrl plus
`/chat/completions`, baseUrl exactly `https://openrouter.ai/api/v1`. No aliases,
normalization, query, fragment or redirect. Headers are the closed constant pair;
trusted credential supplier adds ONLY Authorization inside sole terminal operation.
No header hook, arbitrary header or mutable Buffer survives verification.

Thinking requires explicit non-null authenticated source-map entry. wireEffort
matches exact provider mapping; missing basic levels never imply permission,
no clamp/none substitution, mandatory reasoning plus off refuses. Actual parsed
final body must match identity/effort/privacy/tools/structured output/counts,
not merely match a second untrusted descriptor. P2D owns that semantic parser;
controller compares privately authenticated descriptor to owner-selected authority.
Unproven billing bound refuses: UTF-8 bytes or character/4 estimates are not a
tokenizer proof. Cover system/tool/framing/image/reasoning billed input and actual
provider billing rules; unsupported component never receives a fabricated zero.
This draft claims no production bound implementation.

send is sole network-capable closure, not exported/delivered to Pi or task code.
It starts at most one exact operation synchronously before first await. No await,
hook, audit write, callback or extra port lookup occurs between acknowledged
consume and invoking captured send. Credential failure inside owned sender can
prove no-send only before any operation might begin. Thereafter every throw/abort/
timeout/HTTP error/redirect is uncertain unless authentic actual charge arrives.
No retry or built-in sender delegation.

send receives acknowledged consumed AttemptV1 to bind its private proof to exact
ledger/epoch/scope/request; it cannot change wire or trigger ledger work.
send returns exactly `{kind:'terminal',proof:object}` or
`{kind:'uncertain',proof:object|null}`. Sender private proof registry binds request/
wire, ledger epoch/scope, no-send/actual known charge/unknown charge and semantic
outcome. Tags alone are not proof. P2B authenticators receive bounded ordinary
wrapper `{proofId:Id}`; installation privately maps that issued ID to actual
registry entry and exact AttemptV1. No caller-facing reconciliation API exists;
ID knowledge is not enough outside controller-held observation custody. IDs are
unique for retained epoch and bind immutable contents. Authenticator returns
EXISTING P2B accepted/refused proof schema, no extra field or new ledger operation.

Actual known charge drives settle; usage estimates cannot become actualMicroUsd.
Unknown charge settles with authentic unknown proof, retaining maximum; no-send
uses cancelWithNoSendProof. Thrown sender without proof retains consumed liability
and SEND_UNCERTAIN, never a fabricated observation. Owner finish gets acknowledged
AttemptV1 and separately authenticated semantic outcome; failure returns
RECONCILIATION_REQUIRED. Audit failure cannot authorize resend.

### Ratified C/P2D/P2E private composition

Coordinator disposition C1/C2/C3 accepts the concrete P2D design independently
approved at `72dea19ef474c19e0a303b6861f572896bd6accc`. This section makes the
previously implicit private wiring explicit; public controller/terminal types and
digest algorithms remain unchanged. Two independent reviews of this matching C
clarification remain a release gate. It supplies no production evidence.

C1: P2E calls C.launch FIRST with original seed payload and preissued B1 IDs.
Only C's prepare call after zero-effect denials/acquisition/selection constructs
the private one-shot Pi session. Its custom stream finishes transformations and
resolves preparation with final WireV1 while Pi remains pending. C reserves,
consumes, calls send, authenticates its observation and reconciles both stores
without waiting for Pi final done. P2E's private wrapper then calls the captured
finishInvocation with the direct C result (null for caught unexpected rejection).
The finalizer returns bounded completed text only after acknowledged semantic
success and prompt drainage, or a typed failure with no provisional text. An
idempotent terminalizer publishes the final/error stream before abort/idle waits;
late callbacks cannot issue proof. Five-second bounded cleanup may fail output
without changing real C disposition/liability or authorizing another inference.
Actual Pi types/lifecycle stay in D/P2E; C remains SDK-free.

C2: reviewed installation wraps successful authentic acquisition to retain the
per-request profile defined exactly by P2D. Terminal.prepare resolves it only by
the retained request identity; verify compares EVERY RevalidationV1 field plus
exact request/decision/wire using existing digest algorithms. Mere JSON fields,
caller accepted tags or matching digest text cannot create profile custody.
No extra prepare parameter or guessed decision field is introduced.

C3: private installation constructs one observation registry with separately
captured invocation-bound D registration, C direct-send observe, and existing
ledger authentication capabilities, exactly as frozen by P2D. D register alone
does not grant C observation custody. C observe requires proof received directly
from its captured send and compares retained request/decision/wire and the complete
acknowledged consumed AttemptV1. The immutable returned semantic/Charge and unique
proofId drive existing cancel/settle and owner completion. Reads are non-destructive
so both C and ledger can authenticate the same record; copied/cross-invocation
proofs or known IDs without observed invocation custody refuse. Initial ledger
authentication compares consumed state; replay compares immutable attempt fields
and only the exact proof-derived terminal state, actual/null, proofRef/proofDigest
and monotonic update timestamp. The existing ledger authenticates its CURRENT
attempt before checking idempotency; whole consumed-record equality on replay is
incorrect. No new ledger operation, proof remint, owner finish retry or send follows.

Offline composition tests must start from these documented capabilities and real
B1/P2B stores, covering successful/failed-settled/no-send/unknown reconciliation,
same-proof ledger idempotency and wrong state/charge/proof rejection. Synthetic
registry issuers in tests do not become production profile/proof authority.

### Permit and algorithm

Private WeakMap<object, Claims> holds frozen empty permit identities. Claims bind
instance/epoch, complete owned request/decision, all RevalidationV1 fields,
independence obligations/exclusions, exact wire/proof identity, unchanged cost/
priceEvidence and acknowledged AttemptV1. No public mint/fromJSON/sign or serialized
authority. Copies, proxies, reused/cross-instance/restart identities fail lookup.

1. Capture/preflight; compute requestDigest from owned declaration-order tuple
   `["pmc-request/v1",intentRef,routeDigestMaterial,payloadJson]`; require supplied
   digest equality. routeDigestMaterial removes only top-level requestDigest.
   Preserve every other field, including complete fallback Claims and their
   evidence, in P2A declaration order. Both prior Claim EvidenceRefs bind the
   earlier priorRequestDigest and primaryBindingId, so there is no self-reference.
   Digest does not authenticate lineage; owner begin does.
2. Check installation; durably begin owner claim; acquire authentic evidence,
   clock, RCM facts, tariffs; snapshot ledger and compute exact costs. Compose
   context using owner history/budget evidence; call P2A once.
3. Refusal before selection closes as closed-refused only with authenticated
   never-invoked-reserve custody and null receipt; otherwise pending/held blocks.
   For success,
   decisionDigest hashes the fixed UTF-8 JSON tuple
   `["pmc-decision/v1",requestDigest,complete successful decision]`, including
   audit/independence obligations, never incidental property order.
4. Await prepare, own/bound-check final wire, compute wireDigest, then verify
   proof/selected claims using complete RevalidationV1, and acknowledge
   owner.recordDecision.
5. reserve({requestId,scopeId,requestDigest,costValue,priceEvidence}) with unchanged
   P2B outputs. Failure means no permit and blocked custody. Mint only on matching
   acknowledged reserved AttemptV1 (all identity/epoch/scope/cost fields).
6. Synchronous final section: lookup permit, mark in-progress BEFORE callbacks,
   revalidate authority/time/expiry/proof/claims. Failure invalidates permit,
   retains reserved liability and pending owner; no reentrant use, cancellation, finish, refund or retry without a separately reviewed recovery authority.
7. Delete permit BEFORE ledger.consume({requestId,requestDigest}). Only matching
   acknowledged consumed AttemptV1 advances. Immediately invoke captured send
   with same owned WireV1 and consumed AttemptV1; no await or external port between
   return/invocation.
8. Await outcome, authenticate proof, settle/cancel through P2B, durably finish
   owner outcome; return bounded receipt. Every error after consume is uncertain
   unless authenticated terminal evidence proves otherwise. A fallback
   requires the second PREISSUED request ID and fresh reservation/permit under the
   same intent; new turns cannot reset that intent and uncertainty blocks it.

requestDigest, decisionDigest and wireDigest are lowercase hexadecimal SHA-256
of the specified UTF-8 serialization, as is bodyDigest of its exact UTF-8 body.
Digest serialization is bounded owned JSON without toJSON, whitespace or caller
property order. Request uses P2A declared nested field order; wire uses WireV1
declaration order (headers content-type then accept). Complete decision includes
imported nested records: recursively order their own string keys by Unicode code
point, preserve every array order, use JSON string/number escaping and UTF-8 bytes.
Pin literal initial and fallback nested-order/hash fixtures, including full prior
evidence in request material. The decision tuple retains requestDigest and every
actual successful owner-decision field; do not invent fields absent from P2A.
Independently authenticate prior Claim evidence against the prior request and
primary binding, with original observation/expiry. Current episode and budget
EvidenceRefs bind the current request. No hash is authenticity and launch never
rewrites supplied evidence. A real-P2A R1-to-R2 successful fallback fixture must
distinguish these domains; independently rebinding either prior claim to R2 must
return CONTEXT_BINDING_REFUSED before reservation/send. Changing prior evidence
must change requestDigest; literal fixtures pin all nested ordering.
P2B's existing cost/scopes/snapshot hashing is forwarded unchanged, never rewritten
to this controller's serialization convention. Refusal/audit outputs retain P2A
output caps (131,072 visited values and 2,097,152 string units); no raw prompt/body,
credentials, storage path or thrown object appears in the returned receipt.

Installation/transport callbacks are TCB, not execution-time sandboxes. Reentrant
same-intent launch is blocked by pending owner claim. No permit persists; liabilities
and episode custody do. No exactly-once external delivery/billing claim is made.
Result ok:true means acknowledged terminal reconciliation/owner closure, including
terminal-no-send or terminal-failed-settled; receipt.disposition states semantic
success. Uncertain or incomplete closure always returns ok:false. Before complete
decision/wire/reservation exists, receipt is null; null never implies no liability.

## Acceptance Criteria

| AC | Permanent tests and independent review evidence |
|---|---|
| 1 | Closed shape/bounds/accessor/alias-expanded/cycle/thenable tests; preflight pairwise priorities; overrides, all L6 aliases, missing intent, nonpublic, versions and L1/L2 observe zero dependency calls. Unknown aliases refuse. |
| 2 | Real P2A public resolver and P2B helper/ledger with authentic fixture custody: every identity/count/profile/tariff/source/request/digest/expiry/exclusion mismatch refuses. Numeric tariff fabrication and supplied successful JSON cannot authorize. Actual predecessor code ordering preserved. |
| 3 | Accepted durable owner: concurrent same intent/new IDs, invented episodes, changed payload, restart/lost ack block. Two declared attempts maximum; prior success/matrix fallback/uncertain blocks; no scope/provider/version reset. Map-only tests cannot prove restart custody. |
| 4 | Permit copies/proxy/JSON/cross-instance/reuse/reentrancy/refusal send zero times; authentic consume sends once. Exact immutable bytes/headers/endpoint/effort/proof; mutation requires fresh authorization or refuses. |
| 5 | Crash/failure at every table boundary using real temporary P2B SQLite and accepted owner preserves liabilities/blocks replay. Commit lost ack/audit/finish failure never refunds/retries. No two-store atomicity claim. |
| 6 | Separate non-exported synthetic harness cannot select HTTPS/credentials/production factory; no request test flag. Timeout/abort/HTTP error never proves no-send; unknown retains full bound; actual over-bound freeze uses unchanged ledger. |
| 7 | Offline C acceptance: documented D-port contract tests bind body/effort/privacy/tools/count to private proof using an explicitly synthetic network-incapable fixture; unproven billing component refuses. No actual-Pi conformance claim follows. Later D/production acceptance separately requires actual post-hook freeze, caught-hook negative control and all terminal/runtime/billing evidence. No invented terminal hooks or fake-only production acceptance. |
| 8 | Export/diff check: no public factory/mint/sender/ledger/authenticator/test bypass. Existing v0 evaluator regressions unchanged. Two independent architecture reviews approve exact contracts; production gaps remain named. |

## Out of Scope

P2B1 owner storage implementation or ledger extension; HTTP/Pi implementation;
HMAC/IPC/signing;
v0 evaluator changes; schema/money/ranking rewrites; provider calls/spend, real
budget creation, host credentials/config; unsupported provider/protocol/nonpublic
activation; HRO implementation; public mint/test mode.

## Context & References

- [Amendment 05](../../goals/pi-model-configuration/gate-1-amendment-05.md)
- [Composition/source notes](../../goals/pi-model-configuration/pmc-p2c-composition-notes.md)
- [P2B1 durable owner](../done/PMC-P2B1-durable-intent-custody.md)
- [P2A](../done/PMC-P2A-owner-resolver.md), [P2B](../done/PMC-P2B-durable-budget-ledger.md)
- [P2 inventory](../../goals/pi-model-configuration/pmc-p2-design-inventory.md)
- [P2D](PMC-P2D-openrouter-terminal-transport.md), [P2E](PMC-P2E-config-caller-migration.md)
- Frozen A/B Git blobs/source pins above supersede older local drafts.

## Allowed Files

Future implementation only after prerequisites and explicit release:

- plugins/foreman-line/dispatch/src/pmc-launch/controller.ts
- plugins/foreman-line/dispatch/src/pmc-launch/controller-types.ts
- plugins/foreman-line/dispatch/src/index.ts
- plugins/foreman-line/dispatch/tests/pmc-controller.test.ts
- plugins/foreman-line/docs/goals/pi-model-configuration/pmc-p2c-verification.md

No owner persistence/SDK/network source is allowed. Additional files require scoped
amendment. Historical initial shaping wrote this spec, B1 draft and composition notes; that three-document release is closed. The current bootstrap amendment writes ONLY this spec and composition notes; B1 is frozen.
No new ShapingResult: coordinator's exact two-document amendment envelope overrides that
general shaping output; this controller stays draft until explicitly released.

## Verification Plan

Advisory shaping: frozen spec-linter, required-body self-check, local links,
git diff --check, exact two-document amendment diff. No live probe. Future implementation:
Node 24.19.0 existing dispatch tests/typecheck/lint and actual P2A/v0 regressions;
real temporary P2B/accepted owner crash/concurrency tests; native exit checks;
import/export review. Fake-only AC3/5 cannot pass durability; fake P2D cannot pass
production AC7.

## Readiness

R1 DECISION RESOLVED, IMPLEMENTATION BLOCKING: Amendment 05 V8 ratifies separate
PMC-P2B1 intent custody, keeping P2B unchanged. B1's repaired implementation has
two independent source approvals and two audit approvals; PR63/main727c055 completes audited integration after twelve green remote checks. No
fourth ledger table or implied owner service. P2C must use actual accepted B1 in
crash/concurrency tests and implement its private proof adapters.

R2 DECISION RESOLVED, MIGRATION STILL REQUIRED: V8 ratifies explicit pmc/v1-only
initial governed execution, superseding the earlier trusted-v0 launch adapter
requirement. Preserve evaluateRouting/v0 selection unchanged as non-authoritative
evidence. Unsupported versions/legacy aliases refuse before Pi effects. P2E must
provide an exercised opt-in parcel/Pi caller; an unused export and generic
interactive Pi do not establish governed migration.

R3 PRODUCTION GATE: P2D must freeze/implement supported payload schema, source-based
semantic/billing-bound verifier and private proof registry, plus pinned restricted
session construction. Installed SDK types support custom stream, not proof of those
properties. Offline composition release requires explicit reviewed limitations
and still cannot waive R1 real-custody tests.

Accepted P2A/P2B integration pins and B1 implementation acceptance remain dispatch
gates. Two independent reviews follow. No activation/full HRO exit, provider
availability, actual billing accuracy or owner durability is claimed.

Reviewers must answer: Can any unselected held/refused state reopen an initial
attempt? Does every proof capability trace to a direct authenticated owner result
rather than caller JSON? Does each ambiguous cross-store boundary block replay?
Can ID assignment change the digest after the caller created it? Do v0 preservation
and explicit-v1 entry coexist without claiming migration before an actual caller?

## Gate 2 controller release — 2026-09-26

Root releases only the five Allowed Files after builder Step0 at5764eba and
bootstrap ratificationd260bf6. Both independent design approvals cover5764eba;
B1 is accepted main727c055 with StageF60e7c15. Combined base d88a0f4 preserves
A/B/B1/F source pins and the reviewed C contracts; only B1 completed links changed.
The frontier builder uses isolated hro-pmc-p2c-20260926 and the stated test-first
sequence. SDK-free synthetic-offline actual resolver/ledger/owner composition
must be tested; actual-Pi and production evidence remain later gates. No provider,
credential, host configuration, production initialization or automatic recovery.
Type-only barrel additions only. Local frozen handoff, two independent source
reviews, integration and full remote checks precede merge. Root owns release.
## Wire-body capture clarification and repair gate — 2026-09-26

Independent reviewer and coordinator reproduced an unintended rejection in
source d38b42d139b3ad4f71314518f9bfd204f85e9d81: final body capture inherited
request payloadJson's 262144 UTF-16 limit; merely lifting that limit still charges
body text to ordinary metadata's aggregate, rejecting the exact permitted byte
boundary. The independent final-body byte budget above clarifies the existing
final-wire cap without changing request bounds or production billing authority.

Repair is limited to controller.ts, pmc-controller.test.ts and pmc-p2c-verification.md
under their original package/doc paths. Fresh Step0 and explicit release required.
Preserve all other source and contracts. Permanent independent controls must cover
ASCII and multibyte exact1048576 and one-over body bytes, body content exceeding
262144 UTF-16 but within its byte bound, unchanged request-payload limits and
unchanged ordinary metadata limits. Body key/value-node remain ordinarily counted.
Test-count baseline86 focused/442 dispatch must not shrink. Two fresh final source
reviews and separate Contract B/audit enrollment still gate integration.

## Contract B enrollment amendment — preparation gate

Source93f8021 has two independent final approvals. Combined integration92b965f
retains genuine complete routing-class validation in controller.ts, which makes
it a Contract B reader. Prepare a separate enrollment with exactly five paths:

- plugins/foreman-line/contract-readers/src/registry-data.ts
- plugins/foreman-line/contract-readers/tests/touch-set.test.ts
- plugins/foreman-line/verification/src/d19-audit.ts
- plugins/foreman-line/verification/tests/pmc-controller-reader-audit.test.ts
- plugins/foreman-line/docs/goals/pi-model-configuration/pmc-p2c-reader-enrollment.md

Register the exact controller path under Contract B with its additive-lockstep
rationale; no Contract A expansion and no deletion/waiver of vocabulary validation.
Add meaningful permanent reader-membership/touch-set controls. Registry DATA gains
exactly one approved literal:10 becomes11; independently calculate the new fixed
sorted-value digest in actual Step0 and record it before implementation release.
No detector algorithm, ruling context or unrelated pin changes are authorized.

Combined real-reader and real-audit mutation controls must detect wrong contract
membership, file/value/context relocation, renaming, substitution, duplication and
unrelated filesystem-path use. Reader tests own Contract B membership; D19 retains
its existing permitted contractA/contractB ruling contexts and detects departures
from those contexts. Do not claim D19 alone distinguishes A from B. Preserve all
RCM/ledger/B1/Jev pins.
Retain formatting-positive and unchanged-source controls; never execute mutated
source. Existing controller/runtime/tests/barrel and all predecessor code remain
unchanged. Actual Step0 restate-and-STOP precedes explicit release; this paragraph
only authorizes inspection and a concrete plan. Two independent audit reviews,
combined checks and all remote checks remain required before merge.

### Enrollment Step0 acceptance and release — 2026-09-26

The builder completed actual Step0 and stopped at dd36d721e9222b7523c6b17ea555b3d0519ef043.
The coordinator independently imported the actual registry data and reproduced
its existing ten-value digest, then added only the approved controller path to
that material. SHA-256 of UTF-8 JSON.stringify([...values].sort()), retaining
repeated values, is fixed to 03adbbf53a4c30c42db51268b8749bea0c88217e633e1aedc570926202a13af6
for eleven values. Existing digest dda1e79b0cfbf2767aef8eb37d67f235647e046fd52c98a53bdcd23809de748d
was independently reproduced first. Material is both complete description strings
and all reader occurrences; schemas/types/schema JSON occur twice each.

Under the user's prerequisite authority, the coordinator now releases exactly the
five-file enrollment envelope above. No source/runtime or audit-algorithm change.
Preserve genuine RED evidence, then focused and applicable regression checks.
Two independent reviews and integration/remote gates remain required.
