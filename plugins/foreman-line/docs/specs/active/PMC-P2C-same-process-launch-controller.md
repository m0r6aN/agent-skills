---
ticket: PMC-P2C
title: Same-process one-use launch controller
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
execution-time guarantees; trapped failures still deny. Final wire has the same
byte cap; response handling remains P2D-owned and bounded.

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

[PMC-P2B1](PMC-P2B1-durable-intent-custody.md) is the sole proposed owner of
persistent business-intent custody and IntentOwnerV1. V8 resolves the separate
owner choice; its draft still needs independent review and implementation. P2B's
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
| reserve acknowledged, mint/check failure | Reserved liability and pending owner; genuine no-send cancellation acknowledgement precedes finish. |
| consume failed/lost acknowledgement | Possible consumed liability and pending owner; no send from this path. Missing receipt never proves no-send. |
| send/response/audit/reconcile failure | Consumed/uncertain liability and pending/uncertain/held custody; no remint. |
| ledger terminal commit, finish failure | Money closure is not intent closure; pending blocks. No recovery operation exists in this slice. |

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
   retains reservation pending authenticated no-send; no reentrant use.
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
| 7 | P2D contract tests bind body parsing/effort/privacy/tools/count to private proof; unproven billing component refuses. Payload/header hooks finish before freeze; actual Pi caught-hook negative control; no invented terminal hooks. |
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
- [P2B1 durable owner](PMC-P2B1-durable-intent-custody.md)
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
amendment. This shaping session writes ONLY this spec, B1 draft and composition notes.
No new ShapingResult: coordinator's exact three-file envelope overrides that
general shaping output; both parcels stay draft.

## Verification Plan

Advisory shaping: frozen spec-linter, required-body self-check, local links,
git diff --check, exact three-file diff. No live probe. Future implementation:
Node 24.19.0 existing dispatch tests/typecheck/lint and actual P2A/v0 regressions;
real temporary P2B/accepted owner crash/concurrency tests; native exit checks;
import/export review. Fake-only AC3/5 cannot pass durability; fake P2D cannot pass
production AC7.

## Readiness

R1 DECISION RESOLVED, IMPLEMENTATION BLOCKING: Amendment 05 V8 ratifies separate
PMC-P2B1 intent custody, keeping P2B unchanged. B1's concrete draft schema/ports
still require two independent reviews, Gate 2 and accepted implementation. No
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
