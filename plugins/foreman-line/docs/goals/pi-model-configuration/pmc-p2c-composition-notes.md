# P2C concrete composition review handoff

2026-09-26. Documentation-only shaping on clean base
`42a3d68806d4ff0eefb1ce8872cdec0758cb7d12`, branch
`codex/hro-pmc-p2c-shaping-20260926`. Coordinator accepted Step 0 and released only
this file and [P2C draft](../../specs/active/PMC-P2C-same-process-launch-controller.md).
No build, new prerequisite implementation, activation or caller migration is
authorized here. Remaining decisions are explicit, not silently adopted.

## Exact source evidence

| Source | Inspected object / finding |
|---|---|
| P2A frozen spec | Git blob `d65ff524bba2eda6c9e38de44c78aac4aae1c59f`, read as blob, not commit path |
| P2A types/resolver/handoff | `02de2b462481f7d66c2920e844e8de387825dbe1`; complete request/context/decision/Claim/EvidenceRef exports. Refusal-order repair pending, types frozen. |
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

## R1: smallest missing custody primitive and alternatives

Recommended proposal: governed workflow/task owner holds one durable intent-to-episode
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

Coordinator chooses/ratifies after independent design review. No new parcel or
source edits are authorized here. Ledger-local choice requires explicit port/order/
dependency amendment before P2C release. A named but unimplemented trusted port is
not custody evidence. Frozen P2B source/schema remain unchanged.

Automatic recovery is absent: no ledger inspect API currently exists. Owner
reconciliation needs separately accepted evidence/inspection authority; until then,
pending intent stays blocked and liability retained. Availability loss is explicit,
not permission to invent proof or issue a new ID.

## R2: v0 adapter decision

Inventory found no tracked createAgentSession/streamSimple inference caller.
prepareDispatch prepares legacy routing/artifacts; executeDispatch creates worktree
and Stage-C receipt. Generic dockerfile.pi launches interactive Pi outside governed
boundary and is not version-pinned here. Jev/routing/classification registry entries
are static declarations, not launch authority.

Proposal requiring coordinator ratification AND independent review: initial governed
entry executes explicit pmc/v1 only, preserves v0 evaluateRouting exactly, refuses
unsupported versions without upgrading. P2E adds opt-in actual governed handoff;
it cannot label an unused export migration or insert inference into old prepare/
execute calls. Earlier v0 adapter requirement remains canon until accepted. The
draft records this conflict and stays nondispatchable; no silent deletion.

No user authority re-ask is implied: root holds recorded decision delegation.
These are coordinator review/ratification decisions. Full HRO still requires an
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

## Review targets and verification

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
