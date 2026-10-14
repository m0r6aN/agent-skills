# P5a preliminary shaping / scope reconciliation hold

**Not a dispatchable spec or emitted ShapingResult.** Coordinator `01a1358d-711a-7345-8874-901c5e2b50e3` retains ownership. H1 source accepted after actual human merge; P5a Gateway worktree clean at `b3a4b1b529ea0b804c07c681c69de8d4e2aebfdf`, branch `feat/opmem-p5a-protocol-01a1358d`. Named Tests baseline422/0/0, separate known mock IntegrationTests3P/5F/2skip. No P5a builder/source edit, no frozen-contract change, production promotion or bridge import.

## Fresh dispatch / actual outcome

Native Pi `OPMEM-P5a-shape-01a1358d`, requested/observed `openrouter/moonshotai/kimi-k3`, high, read-only tools/no extensions/MCP/context autoload. First attempt420s **timed out without final proposal**; not a successful Stage A. No surviving matching Node agent observed. One180s text-only/no-more-tool recovery in the same shaping session completed to a bounded preliminary proposal; no build or artifact emission. Raw transcripts `D:/Repos/opmem-dispatch-01a1358d/p5a-shaping{,-recovery}.jsonl`, retained extracted final proposal `p5a-shaping-proposal.txt`; its wording copied as `p5a-preliminary-shaper-verbatim.txt`. Observed usage/hashes in `h1-resume-inventory.json`; no claim that interrupted provider work is completely billed/accounted. No subsequent model dispatch until next bounded envelope/admission recorded.

## Proposed decomposition (NOT ratified or added to queue as execution authority)

Original P5a manifest is too large for one bounded build: eight existing source paths, six new implementation files, one new test file, scope enforcement, ledger concurrency/restart/revocation and receipt producer chain. Fresh shaper recommends:

| Proposed parcel | Deliverable | Serialized collisions |
|---|---|---|
|P5a-1|Read-surface ownership preservation/fail-closed and exactID memory.get|Backends/CortexClient.cs, Program.cs|
|P5a-2|Trusted grammar handoff/cap extension, capabilities/version gate and served evidence.verify|same; RoleBinding amendment needed|
|P5a-3|Shards1.1 write fields, UTF8/URI bounds, durable operationledger/retry/revocation|same; explicitbinding consumers need closure|
|P5a-4|Event/access and curation ingress plus honest frozen invocation-target-execution-result chain|same; producer-side spine scope not yet granted|

All sole-root Gateway, strict serial order, no parallel mutation of client/registry. Each gets its own exact spec/branch/worktree, actual-base/newtest tripwire and two fresh family-independent reviews. One parent's proposed split does not itself authorize those parcels. No new D1–D18 requirement or numerical gravity rule. Existing fail-closed OD22/OD23 states preserved pending chain evidence. Neither “supported” attribution nor active/primary inheritance unlocked by a label/reference.

## Coordinator factual check / corrections to shaper

- Existing six handlers/client/Program and all seven proposed NEW manifest paths confirmed at current source; no file collision observed.
- Exact fixture path is `tests/Keon.McpGateway.Tests/MockCortexServer.cs`, not a Cortex subfolder. Existing read tests are `tests/Keon.McpGateway.Tests/Cortex/CortexReadHandlerTests.cs`; role tests `tests/Keon.McpGateway.Tests/Auth/RoleBindingTests.cs`.
- Mock search/get currently omit backend ownership; evidence mock synthesizes its tenant from the request. T8 needs explicit independently controlled ownership fixtures, not a request-reflecting mock as proof.
- Existing read tests asserting tenant=tnt_123 do **not** necessarily require changing their expectations: additive backend-owned tnt_123 fixture rows can preserve them. Shaper's blanket mandatory existing-test amendment claim is not accepted as proven. Any actual fixture/test edit needs an exact scoped amendment, never weakening assertions or skipping baseline identities.
- Shaper misattributed the two SkippableFacts to CortexIntegrationTests; they are in CollectiveIntegrationTests. Actual whole IntegrationTests baseline is10 tests with3P/5F/2skip. No count/coverage inflation.
- Accepted Cortex P4b worktree `D:/Repos/opmem-worktrees/cortex-p4b` at360a3d6 is clean and ancestor of accepted merge69cd4f8. Its immutable accepted API is contract evidence, not current deployed-service proof. Original dirty Cortex root now has a different local main head and was not used for implementation/source mutation.
- Lineage/evidence envelopes do not uniformly expose role/profile ownership; returning caller-synthesized defaults from the existing client must not become verification. Need explicit record-scope preflight/response consistency design and a compatibility matrix for authorized shared/handoff/legacy scopes (strict equality to caller role would reject approved sharing). Exact source-only proof of a foreign/missing backend row is not a substitute for N10's client→handler→adapter path; read-only existing adapter conformance must be named, or the cross-boundary exit remains pending until a separately authorized proof, never silently waived.
- receipt.get's legacy shard-fetch classification is already T24, not an open product election. Do not manufacture execution-receipt semantics from that tool.

## Required prospective amendments / design closure (no mutation grant yet)

1. **Grammar:** add exact `src/Keon.McpGateway/Auth/RoleBinding.cs` + `tests/Keon.McpGateway.Tests/Auth/RoleBindingTests.cs` only if implementing T35 handoff/cap grammar. Full raw identifiers, no trim/trailingLF under T36; cap tokens only enrolled/issuer-validated, never argument/header authority.
2. **Test surfaces:** exact fixture/mock paths and narrowly required existing assertions; new scenario tests may be separated into exact new filenames per subparcel. Do not pre-grant UNKNOWN GatewayApplicationFactory/TestTokenIssuer/MockRuntimeServer edits. Coordinator must inspect actual collision first.
3. **Explicit binding:** inspect every consumer of CortexClient; shaper identified `src/Keon.McpGateway/Tools/Collective/CollectiveHandoffDispatchHandler.cs`. Select reviewed single-authority threading rather than an unexamined signature break or ambient fallback. No grant until exhaustive call-site lint.
4. **Producer chain:** inspect and specify immutable invocation, target/profile, action-execution receipt and result/status semantics before any supported attribution. Proposed spine paths `src/Keon.McpGateway/Spine/IngressSpine.cs` / `InvokeTerminalWriter.cs` and conditional Contracts/Models.cs are outside current P5a mutation grant. Freeze exact producer/consumer/test paths, do not invent “completed” by translating approved. A self_reported-only event subparcel may be an interim deliverable, not completion of the chain checklist or full P5a.
5. **Bounds/ledger/scopes:** proposed defaults32768UTF8content bytes /4096query bytes /2048URIchars /https+urn; additive ledger under existing spineSQLite store; write-class event/curation scopes versus read-class get/verify/capabilities. These are proposals for explicit coordinator-delegated disposition under standing authority, not silently adopted values. Scope requirements must preserve readiness without granting memory access and cached acknowledgements must recheck current authorization/revocation.

Fixture inventory from original frozen manifest/handoff remains binding: N4/N10/N13/N17/N18/N21, T11retry/concurrency/restart, T12fieldroundtrip, T18realproductionregistry discovery/invocation, T35/T36grammar, F13/F14, three T34false-evidence fixtures, access idempotency and curation409identical-replay. Test doubles labelled, never live Runtime/deployment proof. Newtest minimum/count frozen per actual subparcel before GO, no deletion/skip/regression versus named422 base.

## Current hold / safe next step

Agent-skills PR#227 required CI is red from unchanged pi-package missing-lockfile prerequisite; source-owner handoff in H1 closure/publication and https://github.com/m0r6aN/agent-skills/issues/230 (no implementing worker). No automatic record merge or hidden lock/workflow/config repair. This does not invalidate exact-tree accepted Gateway H1 or require another H1 consent. It prevents claiming record-publication green and remains a real technical admission item.

Next: reconcile upstream CI-owner prerequisite and interrupted-attempt accounting/envelope; disposition the proposed split/exact amendments explicitly, generate actual draft specs and ShapingResult with deterministic advisory checker, independent frontier plan-level review of the changed decomposition, factual lint/Gate2, then fresh bounded builders. No artifact/approval/registration/receipt fabricated from this planning output. Stop remains before implementation; sole ownership retained, no worker/poll/wakeup.
