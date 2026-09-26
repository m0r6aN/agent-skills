# P2C concrete composition review handoff

2026-09-26. Documentation-only shaping on clean base
`42a3d68806d4ff0eefb1ce8872cdec0758cb7d12`, branch
`codex/hro-pmc-p2c-shaping-20260926`. Coordinator accepted Step 0 and released only
this file and [P2C draft](../../specs/active/PMC-P2C-same-process-launch-controller.md).
That was the initial two-file shaping envelope. After V8, coordinator released
exactly three documents at `6446cbfff1817cc149df5a6ab491188aaffdeab1`: this file,
P2C and the new [B1 draft](../../specs/active/PMC-P2B1-durable-intent-custody.md).
No build, activation or caller migration is authorized. R1/R2 decisions are now
ratified; concrete B1 review and implementation remain outstanding.

## Exact source evidence

| Source | Inspected object / finding |
|---|---|
| P2A frozen spec | Git blob `d65ff524bba2eda6c9e38de44c78aac4aae1c59f`, read as blob, not commit path |
| P2A types/resolver/handoff | `4b86643acd4e5cdf183e85cf1cd1c2ace51e0182` merged source; repaired bb89be9 types unchanged. Actual request/context/decision/Claim/EvidenceRef exports read again for B1 shaping. |
| P2B frozen spec | Git blob `b8b6061f86239196f208467e849c845754d0d2a6` |
| P2B source/handoff | `835a6dd82ee4e50652362e7201a79b7451bbd221`; actual money.ts, ledger.ts, verification handoff. Later `9f91757` docs only. |
| Caller inventory | P2B source object's pmc-p2-caller-inventory.md, discovery on bb5a6e7; repeat on accepted integration base |
| Canon | Amendment 05, P2 design inventory, P2D/E drafts, Coordinator Pattern and standing constraints |

P2A request/decision are selection-only. Its episode Claim checks at most two
supplied attempts; omitted history and invented episodes cannot be detected by a
pure resolver. P2B returns per-request AttemptV1 and budget snapshot, without a
lookup/enumeration/history port. It preserves current proof plus one private prior
unknown reference. Neither supplies complete durable episode custody. Capabilities
and equal JSON cannot fill the gap.

Actual P2B requests: snapshot({scopeId}); reserve({requestId,scopeId,requestDigest,
costValue,priceEvidence}); consume({requestId,requestDigest}); settle({requestId,
requestDigest,observation}); cancelWithNoSendProof({requestId,requestDigest,proof}).
Authenticators receive owned AttemptV1 and captured ordinary observation/proof
outside transactions, then revalidate current row inside the transaction. Registry
capability objects must NOT pass through its ordinary-data capture; the draft uses
private controller-owned proof-ID custody with existing bounded wrapper instead
of modifying P2B. No caller-facing reconciliation API exists.

CostValueDigest includes requestDigest and original accepted price lexemes. Forward
computed value/priceEvidence unchanged; attach independently authenticated EvidenceRef.
Numeric catalog facts cannot become billing evidence through Number.toString().

## R1: decision resolved; concrete custody draft and implementation pending

V8 ratifies a separate governed workflow/task owner holding one durable intent-to-episode
record and atomic claim, returning complete P2A history. begin claims before reserve;
recordDecision binds selection/wire before reserve; finish follows acknowledged
ledger reconciliation. Lost acknowledgement leaves pending state blocking all new
IDs. Types/ordering/failure table are in P2C. Owner allocates IDs and authenticates
initiating task outside JSON. Two attempts maximum; pending, uncertain, successful
or terminal fallback history never reopens as initial. Full ledger epoch retention.
No implementation was found; this is a blocker, not an assumed working service.

| Alternative | What it fixes | Remaining obligation / disposition |
|---|---|---|
| Add P2B readAttempt/readHistory only | Recovery can inspect request liabilities | Cannot establish business intent, original selection, quality or completeness. Insufficient alone. |
| Extend P2B attempts/metadata with intent/episode and atomic claim | Could put claim/reserve in one SQLite transaction | Changes frozen schema/API, authority and recovery. Pre-reserve claim needs actual pending state, not merely a metadata read. Separate scoped amendment/two reviews required; no fourth table inferred. |
| Separate workflow/task-owner durable intent record (recommended proposal) | Keeps business authority with its owner; minimal begin/recordDecision/finish consumer seam | No existing store assumed. Needs scoped implementation/storage caps/identity/rollback protection/recovery. Claim, reserve, consume/send, ledger reconcile, owner finish. Failures block conservatively; no two-store atomicity/automatic rollback. |

V8 selected the separate-owner alternative after independent design review. The
comparison above is historical rationale, not a reopened choice. This three-file
release shapes B1 only; no source edits are authorized. A named but unimplemented
trusted port is not custody evidence. Frozen P2B source/schema remain unchanged.

Automatic recovery is absent: no ledger inspect API currently exists. Owner
reconciliation needs separately accepted evidence/inspection authority; until then,
pending intent stays blocked and liability retained. Availability loss is explicit,
not permission to invent proof or issue a new ID.

## R2: explicit-v1 decision resolved; actual migration pending

Inventory found no tracked createAgentSession/streamSimple inference caller.
prepareDispatch prepares legacy routing/artifacts; executeDispatch creates worktree
and Stage-C receipt. Generic dockerfile.pi launches interactive Pi outside governed
boundary and is not version-pinned here. Jev/routing/classification registry entries
are static declarations, not launch authority.

V8 ratification after independent review: initial governed entry executes explicit
pmc/v1 only, preserves v0 evaluateRouting exactly, and refuses unsupported versions
without upgrading. This supersedes the initial trusted-v0 launch adapter requirement.
P2E adds an opt-in actual governed handoff; it cannot label an unused export
migration or insert inference into old prepare/execute calls. Draft remains
nondispatchable for implementation/review gates, not an unresolved v0 decision.

No user authority re-ask is implied: root holds recorded decision delegation.
Those coordinator decisions are now ratified in V8. Full HRO still requires an
actual exercised parcel/Pi caller, not merely a new exported function.

## Actual Pi 0.87.1 seam and R3 production gate

Read installed package at
`D:/nvm/v24.7.0/node_modules/@earendil-works/pi-coding-agent`; package.json says
0.87.1. Directory Node version is not a claim about execution runtime.

| File relative to package | SHA-256 / actual API |
|---|---|
| dist/core/sdk.d.ts | `fbb34394c71e113b1f1fb5dd2e3d1da8d559580b339daace88826cd1a666cc4c`; createAgentSession(options?) returns Promise<CreateAgentSessionResult>; explicit model/modelRuntime/thinking/tools/resourceLoader/settingsManager/sessionManager |
| dist/core/extensions/types.d.ts | `14d00e645b453f4361440da6fcda86ed6cef9a8fc36d483a621a0250e0d4a396`; ProviderConfig.streamSimple?: (model:Model<Api>, context:TranscriptContext, options?:SimpleStreamOptions) => AssistantMessageEventStream |
| dist/core/extensions/runner.js | `67c7ca2d24197ff46cb5f0a49d7c19a76825ab7c66bc942015a484b550396441`; emitBeforeProviderRequest catches exceptions/returns payload; emitBeforeProviderHeaders permits in-place mutation |

types.d.ts requires custom stream to invoke options.onPayload before send, use a
replacement when present, and invoke options.onResponse after response/before body.
Installed pi-ai types also permit asynchronous onPayload/onResponse. These are NOT
terminal authorization hooks. P2D must finish payload AND header transformations
before immutable WireV1, invoke controller gate, then map owned response events to
AssistantMessageEventStream. prepare/verify/send are application ports, not guessed
Pi SDK methods. send owns one HTTPS operation, never delegates to a built-in sender.

No session adapter/tokenizer proof is implemented here. P2D must freeze supported
request/response schemas; prove disabled resource/extension discovery, retries,
compaction, warming, refresh and fallback; typecheck actual pinned compat types.
No guessed middleware/terminal hook. Conservative billed-token coverage must include
tool/framing/image/reasoning components or refuse them. UTF-8 memory bounds are not
billing proof. Source thinking-map entry/wire effort match exactly; sparse-map SDK
defaults/clamping confer no permission. P2E explicit null denials remain necessary.

R3 blocks production installation, not docs review. Fake transport cannot supply
live authenticity or real billing/terminal coverage. Synthetic construction is
separate/non-exported, no network imports/credentials/public test flag. Production
installation ports are explicitly TCB; arbitrary privileged in-process JavaScript
is outside the isolation claim.

## Prior two-file shaping verification (historical)

Draft specifies closed request/result/code unions, evidence/owner/terminal ports,
bounds, preflight priority, digest inputs, one-use permits, failure behavior and
permanent AC matrix. Review equal JSON, reentrancy, new-ID laundering, lost ack at
each durable boundary, header mutation, unproven counts and proof-ID copying.
No implementation evidence is substituted for these obligations.

Advisory verification: Node 24.19.0 frozen spec-linter CLI from the existing
read-only P2A donor, explicit target repo/spec and TSX_DISABLE_CACHE=1: exit 0.
Existing shaping selfCheckDraft: valid frontmatter/body, no errors/warnings.
Local Markdown references resolve; git diff --check passes. Native exits checked.
Only the two authorized documents changed. No implementation tests, provider calls,
configuration writes, dependency installs, PR or merge occurred. Local docs commit
is a handoff, not acceptance/promotion; status remains draft.

## Coordinator disposition after independent review — 2026-09-26

Independent design reviewer approved architectural direction at689f4e7 and kept
P2C nondispatchable. Coordinator ratifies R1 separate durable intent custody and
R2 explicit-v1-only governed entry through Amendment05 V8. R3 remains production
gate. User prerequisite delegation already covers these decisions; no new human
approval is required.

Shape PMC-P2B1 as a separate minimal prerequisite, with actual storage and closed
ports. Clarify P2C before build: trusted setup preissues request/episode IDs before
caller digest creation; begin only validates. Distinct held/closed-refused state
covers failures with no selected binding, never fabricated P2A attempt fields.
Only selected authenticated prior attempts enter P2A history; held/pending/uncertain
owner state blocks before resolver, so filtering cannot reset history to empty.
Freeze exact CAS transitions and capability/proof custody; no generic recovery
framework or P2B schema changes. Both actual owner tests and independently accepted
P2A/P2B integration pins remain release gates. The reviewer inspected repaired
P2A bb89be9 and unchanged ledger835a6dd, no implementation tests/provider calls.

## B1 concrete proposal and P2C reconciliation - 2026-09-26

B1 proposes one separate Node 24.19.0 built-in SQLite store per fixed installation/
ledger epoch, initialized with a closed <=128-intent batch. Two owner tables,
maximum two preissued request slots, bounded canonical records and CAS revisions;
no fourth budget-ledger table, new ledger method or general workflow engine.
Private trusted initialization issues episode/request IDs before caller digest.
Begin only validates. Installation owns the fixed root/identity and preapproved
business batch; no separate global registry or cross-root discovery service is
invented. Privileged reinstallation, OS writers and same-identity backup rollback
are outside its guarantee and must be prevented operationally.

Selected records and unselected held/closed-refused records are distinct unions.
Pending/uncertain/held/refused block before projection, so omission cannot reset
history. Only authenticated selected-primary closure supports the declared second
attempt; success/matrix fallback ends intent. Restart leaves pending blocked;
there is no proof reconstruction, TTL, automatic rollback, retry or recovery.

The B1/P2C composition contract now names the actual proof producer obligations:
P2E authenticates initiating-task/setup origin; P2C creates selection capabilities
only from its direct resolver and verified-wire results; completion capabilities
require private invocation custody plus direct acknowledged P2B and P2D proofs.
B1 checks through captured private authenticators with no controller runtime import.
These adapters are still unimplemented; shape review is not authenticity evidence.
Synthetic issuers prove B1 contract behavior only. Actual B1 must feature in P2C
cross-store durability tests, with conservative loss of availability on every
ambiguous boundary. Unselected pre-reserve refusal closes with null launch receipt
only when controller custody proves reserve was never invoked.

The request digest recipe includes complete fallback Claim evidence and excludes
only top-level requestDigest. Actual P2A binds both prior Claims to priorRequestDigest
and primaryBindingId; only current episode/budget evidence binds the current request.
There is no recursive digest. Prior quality observation and expiry remain unchanged,
and begin never rewrites evidence. Real successful R1-to-R2 composition and literal
full-evidence hash fixtures pin these distinct domains. This corrects the earlier
shaping proposal and changes no P2A type or implementation.

R1/R2 architectural decisions are resolved by V8. B1 exact schema/ports still need
two independent reviews and Gate 2. P2A/P2B accepted integration, B1 implementation,
P2C adapters, P2D real billing/terminal proof and P2E exercised opt-in caller remain
gates. D19 requires reviewed B1-specific enrollment if its exact SQLite/root
mechanisms are flagged; no generic waiver or detector evasion. Contract-readers,
mutation-scope and D19 precede any future implementation PR.

Advisory shaping checks for this three-document revision: Node 24.19.0 frozen
spec-linter validates both B1 and C; existing selfCheckDraft reports valid
frontmatter/body with no errors or warnings. All local Markdown links resolve,
UTF-8 reads succeed and git diff --check passes. Tooling/dependencies are borrowed
read-only from the existing P2A integration donor with TSX_DISABLE_CACHE=1. No
implementation tests, dependency mutations, provider/network calls, host/config
writes, PR or push. The local documentation commit is a review handoff only;
both specs remain draft and non-dispatchable.

## B1/P2C concrete review A triage — 2026-09-26

Independent reviewer A inspected33044f2 and actual accepted P2A/P2B types. It
accepted the bounded two-table custody architecture and composition direction,
with two required P2C prose fixes: compute wireDigest before verify consumes
complete RevalidationV1, and specify lowercase SHA-256 over each prescribed UTF-8
digest serialization. Coordinator accepts/applies both; no authority change.
The complete crash/concurrency matrix remains mandatory regardless of the tight
implementation sizing estimate. No source implementation or production approval.
Second independent design review and A's correction acceptance remain pending.

## B1/P2C review B source-compatibility correction — 2026-09-26

Review B found one blocker at51440f7: draft fallback evidence incorrectly bound
current requestDigest. Root confirmed merged P2A's explicit prior-request exception
in resolver lines692-701 and frozen spec. Accept and correct B1/C to preserve prior
Claims with priorRequestDigest/primaryBindingId; current episode/budget evidence
still binds current request. Restore the simpler complete-route-minus-top-digest
hash recipe; no recursive dependency exists. Add real successful R1-to-R2 fallback
composition plus independent wrong-domain negatives and literal evidence hash
fixtures. Do not modify P2A or merely assert all malformed fallbacks refuse.
No other blocking design finding. Both reviewers must accept this corrected draft
before B1 dispatch; implementation and production gates remain unchanged.


## Final design acceptance and B1 private release — 2026-09-26

Both independent reviewers approved corrected 09216fa. B1 Gate 2 now permits
private offline implementation on accepted P2A main and immutable, twice-reviewed
P2B source. P2B audit integration remains a prerequisite for B1 integration and
merge. The exact scope, sequencing exception and verification obligations are
recorded in the B1 specification. P2C remains draft pending actual B1 acceptance.

## Controller Step 0 construction dispositions (draft for review)

At0994f91 the frontier builder stopped before implementation and identified four
concrete contract decisions. Root proposes the explicit C-spec amendment:

1. Private two-stage custody constructor returns B1 selection/completion verifiers
   before B1 open; a one-attempt bind then captures already-open B1 and other ports.
   Unbound/failed verifiers refuse; no public issuer or mutable replacement.
2. Separate closed observation argument supplies C3 observe without widening the
   existing closed InstallationPortsV1. Direct-send identity plus full owned
   request/decision/wire/consumed-attempt context binds the private observation.
3. Reserved but not consumed has no D proof. Retain pending owner/reserved liability
   after final revalidation/permit failure instead of manufacturing cancellation.
   Existing never-reserved B1 closure remains distinct. No new recovery or retry.
4. C's offline AC7 uses explicit synthetic network-incapable D contracts; actual Pi
   terminal/hook/billing conformance belongs to later D acceptance. This breaks the
   C-needs-accepted-D / D-needs-accepted-C implementation cycle without waiving any
   production test or full-HRO live requirement.

All five runtime write paths remain unchanged. No implementation release occurs
until these amendments receive two independent reviews and B1 audited acceptance.
Native frontier dispatch substitution must be recorded at Gate2; no minted runtime
receipt or exact engine revision is fabricated. P2E installation drafting must
consume the final reviewed bootstrap/observe types, not an invented parallel API.

## Bootstrap amendment ratification — 2026-09-26

The delegated coordinator ratifies the four Step0 composition decisions at
5764eba8da1485b7850db067041036d211712e12 after two independent design approvals.
Both reviewers checked actual accepted A/B/B1 contracts. Root reconciled the
preconsume failure rule and historical shaping scope; both approved the final
wording. Private two-stage custody, separate observation authority, retained
preconsume liability and offline C versus actual-Pi D acceptance are controlling.
This is no production approval and no controller implementation release. B1
accepted audited integration, fresh Step0 and an explicit exact-file release
remain prerequisites. The specification's five-file implementation envelope is
unchanged; authentic installation facts and live billing evidence remain open.
