---
ticket: PMC-P2E2
title: New opt-in governed user entry and disabled configuration evidence
status: draft
owner: clinton.morgan
created: 2026-09-26
updated: 2026-09-26
risk: critical
surfaces:
  - plugins/foreman-line/dispatch/
  - plugins/foreman-line/docs/goals/pi-model-configuration/
routing_class: architecture/risk
permission_profile: builder-architecture
data_classification: internal
verification_class: judgment-required
---

## Intent

Introduce an actually invokable, opt-in user command with a closed request/result
boundary, private C-first/D-finalizer composition and a pure disabled config plan.
The production bootstrap deliberately refuses until authentic installation facts
exist. Actual offline composition, production refusal and later useful live
execution are separate claims; this DRAFT does not authorize any of them to run.

## Constraints

Base `d98e176e6ce6d6164679d35dc21647ef47f33f67`; root decisions E-03/E-04
and two independent design reviews are prerequisites. C bootstrap amendment 5764eba8da1485b7850db067041036d211712e12 must be ratified before this composition is released; its contracts below are explicit dependencies, not approval by this draft. C/D design approvals do
not establish runtime availability. Before build release pin actual accepted
B1/C/D exports and internal constructors; if their signatures cannot support
this finite composition, return to contract review, never cast a fake class.
No source handoff is invented in approval-cli: leave prepareDispatch,
executeDispatch, their public barrel and existing caller semantics unchanged.

### Actual command, not an unused export

Proposed invocation, from the dispatch package with installed matched-lock
dependencies and Node 24.19.0: `node --import tsx src/pmc-launch/entry-cli.ts launch`.
Only exact argv `['launch']` or `['--help']` is accepted. Help emits the fixed
usage line and exits 0 without stdin or installation access. All other args
refuse with exit 2; no model/lane/credential/module/profile/root/test/live flags.
No npm bin, package script, daemon, IPC endpoint or environment-selected factory.

Launch reads exactly one UTF-8 JSON document from stdin, up to 2 MiB encoded
bytes, with a 5-second acquisition deadline through EOF. Check each chunk against
remaining budget BEFORE accumulation/decoding. Invalid/incomplete UTF-8, duplicate
keys, trailing document, empty input or timeout returns INPUT_REFUSED, exit 2.
JSON escapes may not exceed the byte cap; parsed C bounds still apply separately.
The bounded JSON scan rejects depth >16 or >65,536 keys/values before allocating
the corresponding nested objects; duplicate-key tracking is bounded per object.
Do not echo content, paths, tokens or exceptions. Read no input-named file/URL.
This command's input is exactly C's `LaunchInputV1`, not a second wrapper:
`{version:'pmc-launch/v1',intentRef,route,payloadJson,override}`. Complete route,
preissued IDs, attempt evidence and requestDigest are supplied without rewriting.
Original exact payloadJson binds C's digest; no inferred lane/version/default.
Check the five top-level keys and their basic types before bootstrap lookup;
extra keys/non-object route/non-string payload refuse. Complete semantic field
validation and C's denial priority belong to C, not an entry-specific selector.

The executable main uses ONLY the zero-argument production bootstrap below.
Internal `runEntry(argv, stdin, stdout, installation)` is testable with explicit
in-memory I/O; it is not barrel-exported and cannot load arbitrary modules or
manufacture installation from JSON. No automatic invocation when imported for
tests. Its numeric return is the exit status; executable main sets exitCode.
Its arguments are exactly readonly string[] argv, stdin `{read:()=>Promise<
Uint8Array|null>,stop:()=>void}`, stdout `{write:(line:string)=>Promise<boolean>}`
and EntryInstallation. null is EOF; true acknowledges a completed write. These
are main/test-owned adapters, never user-provided payload fields. On input failure
stop once and observe any pending read rejection; do not wait indefinitely for it.
One output write has a separate 5-second deadline; false/throw/timeout exits 1
without printing an alternate result or retrying the write. Real main adapts Node
streams; it does not treat arbitrary inherited stream methods as task authority.

### Closed results and invocation lifecycle

Reuse imported C LaunchInputV1/LaunchResultV1 and D InvocationOutput/TransportCode;
do not copy their unions into a competing implementation. Entry replies are:

```typescript
type EntryCode = 'ARGUMENTS_REFUSED' | 'INPUT_REFUSED'
  | 'PRODUCTION_EVIDENCE_MISSING' | 'ENTRY_ALREADY_USED'
  | 'CONTROLLER_REJECTED' | 'CONTROLLER_REFUSED' | 'OUTPUT_FAILED';
type EntryReply =
  | {version:'pmc-entry/v1'; kind:'completed';
     controller:Extract<LaunchResultV1,{ok:true}>;
     output:Extract<InvocationOutput,{kind:'completed'}>}
  | {version:'pmc-entry/v1'; kind:'failed'; code:EntryCode;
     controller:LaunchResultV1|null;
     output:Extract<InvocationOutput,{kind:'failed'}>|null};
type BoundEntry = {launch:(request:unknown)=>Promise<EntryReply>};
type EntryInstallation =
  | {ok:false; code:'PRODUCTION_EVIDENCE_MISSING'}
  | {ok:true; entry:BoundEntry};
```

Every field is required; records closed, owned and frozen. Completed requires
C ok:true AND receipt.disposition succeeded AND D completed. C ok:true alone
includes no-send/failed-settled and is not successful text. Completed exits 0;
controller/entry/output failures exit 1; framing/argv failures exit 2.
One JSON line on stdout, <=8 MiB after JSON escaping, no raw prompt or diagnostics;
help is the only non-JSON response. Output write failure returns exit 1 without
relaunching, refunding or inventing a second response. No provisional text or Pi
numeric usage is exposed. Controller receipt remains audit-only.

Private `bindEntry` receives exactly a record of captured own function descriptors
`{launchController, finishInvocation, releaseOwner}`. Types are respectively
`(unknown)=>Promise<LaunchResultV1>`,
`(LaunchResultV1|null)=>Promise<InvocationOutput>`, and
`()=>{ok:true,value:null}|{ok:false,code:OwnerCode}` (B1's existing close result).
The last callback closes only the privately owned B1 instance; P2B has no invented
close port. Capture once; never freeze caller functions or retain a mutable record.
Installation retains all evidence/store/proof authority, not BoundEntry callers.

1. BoundEntry is one invocation: mark used synchronously before calling any port.
   Concurrent/reentrant/second launch returns ENTRY_ALREADY_USED, null controller/
   output, zero effects. It never resets, including after malformed input/failure.
2. Call captured C.launch exactly once with the original request. C alone performs
   its snapshot/zero-effect denials, B1 begin, acquisition, selection, reserve,
   consume, send and reconciliation. Constructing this entry must not start Pi.
3. Capture the direct C result or caught unexpected rejection. Always call the
   captured D finishInvocation once with that exact result, or null on rejection;
   no copied task-supplied receipt, serializable proof or independent finalizer API.
4. D alone terminalizes the pending stream before abort/idle waits and enforces
   its 30-second preparation, 120-second send and 5-second cleanup limits. C never
   waits for Pi final done. No new race timeout that abandons running C is added.
   On unexpected finalizer rejection, output is null and code OUTPUT_FAILED;
   preserve any actual C result. After finalization, releaseOwner once in finally;
   close failure prevents completed output but cannot change monetary disposition.
5. Unexpected C rejection yields CONTROLLER_REJECTED with controller null, not a
   fabricated no-send receipt. C ok:false yields CONTROLLER_REFUSED and its exact
   bounded receipt/code. Any inconsistent/failed finalizer or non-success C
   disposition yields OUTPUT_FAILED (D failure retained when genuine). A cleanup
   failure after C succeeded still returns failed with that real succeeded receipt.
   No automatic retry/fallback, new UUID, owner finish retry or extra inference.

Imported/mock seams are validated as unknown at runtime; never trust a static
annotation as evidence. C request bounds/refusal ordering are unchanged. Entry
does not duplicate ranking, tariff parsing, preflight policy or monetary logic.
The process model is trusted same-process installation, not a hostile-code sandbox.

### Private installation ownership; no missing-authority shortcut

`createProductionEntry(): EntryInstallation` takes NO arguments and, in this
parcel, always returns `{ok:false,code:'PRODUCTION_EVIDENCE_MISSING'}`. It imports
no Pi/network runtime and reads no environment, files, stores, secrets or budgets.
Caller JSON, a generated plan, current OS identity, receipt digest or an env flag
cannot change this result. An accepted bootstrap implementation requires a fresh
scoped release with authentic prerequisites; this parcel does not hide an enable
switch. Actual refusal command tests and private offline composition are mandatory.

The future installation ownership is fixed now, without claiming its unavailable
external source implementations already exist:

- Initiating-task registry is private to reviewed installation, binding a genuine
  authenticated initiating principal to B1's fixed businessAuthority/origin/workflow/
  task/lane/template and canonical owner/ledger epoch. Its originCapability is an
  empty object identity, never derived solely from stdin IDs or possession of
  intentRef. B1 setup/open supplies existing episode/two request IDs before request
  digest construction. E2 provides no initialize/register/recover API or ID issuer.
- C's acquired record and complete RevalidationV1 retain their exact closed
  contracts. Installation authenticates issuer/scope/source bytes/expiry, not
  accepted:true fields. Wrap successful acquisition to retain D's EXACT private
  profile by request identity (including price, source-map/bound/response/cwd facts).
  No fabricated current timestamp, endpoint alias or missing-evidence default.
- Construct one D-approved observation registry. D receives only invocation-bound
  register; C only direct-send observe; P2B only existing settlement/no-send
  authenticators. Register alone is not observation custody. C observe binds the
  full acknowledged consumed Attempt and request/decision/wire. Ledger replays
  authenticate immutable fields plus exact proof-derived terminal state/charge/
  proof/timestamp, not equality to the old consumed snapshot. No public lookup,
  caller proof IDs, registry selected by data or remint across restart.
- Follow C's two-stage construction: createPmcControllerCustodyV1 with the trusted
  exact mode, obtain its authenticators, open the real existing B1 owner with those
  captured callbacks, then bind once. Unbound or failed custody refuses; failed
  first bind consumes its latch. No replacement authenticator or second owner bind.
  Supply the separate ControllerObservationPortsV1 capability sharing the D-register/
  C-observe/ledger-auth registry; do not add it to unchanged InstallationPorts.
  Import the SDK-free observation/charge/transport types from the accepted contract.
- A reserved-before-consume revalidation/permit failure retains reserved liability
  and pending B1 ownership. No consumed D proof exists there. Entry finalization
  and owner close must not manufacture cancellation, completion, refund or retry.
- C owns selection/completion WeakMaps and authenticators for B1; installation
  routes those exact capabilities rather than reimplementing selection/proof
  issuance. Only D's sole owned sender can obtain the real credential, at its
  documented pre-operation point. P2E never reads it to prepare an entry.
- Accepted C/B1/D are assembled in private tests with real temporary stores and
  D's isolated network-incapable fake assembly. No production fake factory export,
  test-mode flag, test-owned accepted tag or structural Pi class substitute.

The origin authority producer, approved setup batch, private acquisition source
adapters and genuine all-billable-components certificate are explicit production
gaps, not work silently delegated to a generic user callback. Close them through
separate exact source contracts before activating the production bootstrap.
The prepared vendor inquiry is not sent by this parcel. An existing-evidence
question pending with the owner is not an affirmative source claim.

### Pure configuration evidence (no apply)

`planPmcPiConfigurationV1(policy:unknown, catalog:unknown)` is a pure internal
function. Call existing projectProviderBindingsV1 and evaluateCatalogEligibility
once each using their real public contracts. Preserve their typed failure/results
as evidence; no private RCM reader, fake branded snapshot, second selector or
authentication inference. No ambient config input, filesystem, clock or network.

Its closed result is `{version:'pmc-config-plan/v1',evidenceOnly:true,
applyAllowed:false,policyResult,catalogResult,entries,missingClaims,applyPatch:[],
rollbackPatch:[]}`. policyResult/catalogResult are the actual public result unions;
entries are empty unless policy projection and projector both succeed. Preserve
every original refusal/unknown/provenance in those result records, deeply owned.
Use policy binding order, <=256 entries, no price sorting. Each entry is exactly
`{bindingId,provider,providerModelId,piHostModelId,identityState,sourceFacts,
thinkingLevelMap,enabled:false}`, where sourceFacts is the matching authentic-
source CLAIM's EligibilityFacts or null, not a newly authenticated fact. identityState is exactly 'absent' | 'ambiguous' | 'refused' | 'facts'. Match projector result rows by requested.provider and requested.id against the exact binding provider/providerModelId. Zero matching rows means absent; more than one means ambiguous, regardless of row outcomes; exactly one outcome refused row means refused; exactly one outcome facts row means facts. Only the last case copies sourceFacts; all other states use null. These labels describe supplied unauthenticated evidence and grant no authority. Exact
provider/id comparison only; zero/multiple matches yields null, never an alias.

thinkingLevelMap has exactly off/minimal/low/medium/high/xhigh/max keys. Copy only
the corresponding non-null declared providerValue; missing/unknown/null yields
explicit null. Unknown extra levels remain in original sourceFacts but do not
expand the map. Duplicate known level entries refuse that entry's mapping (all
null). off is always null in this initial conservative plan; the source reasoning
boolean alone is not proof of mandatory/optional thinking. Original sourceFacts
retains any observed off value without granting it execution authority.
Do not infer support from eligibility lists, omitted basic levels, default effort
or Pi clamping. All entries remain disabled even if their evidence looks complete;
this is not a Pi-loadable file or a production profile.

missingClaims is the fixed ordered list ORIGIN_AUTHORITY, ACCEPTED_RUNTIME,
ENDPOINT_TARIFF_BOUND, LIVE_AVAILABILITY, LANE_QUALITY, PRIVACY_AUTHORITY,
BUDGET_AUTHORITY, CONFIG_APPLY_AUTHORITY; it never disappears because supplied
JSON says accepted. Actual activation must authenticate each, not trust this list.
Empty patches ensure unrelated settings/defaults are untouched. Config-plan
serialization is not a reversible host apply and never supplies credentials.

## Acceptance Criteria

1. Invoke the actual new command in a child process: help, valid launch→production
   refusal, malformed/duplicate/oversize/trailing/slow input, unknown args and
   injection fields. Trap credential/file/network/Pi accesses before main. Assert
   exact output/exit and zero provider work. This is entry coverage, not live use.
2. Exercise same runEntry/bindEntry path with accepted actual C/B1/P2B/D offline
   assembly: success, no-send, failed-settled, unknown, C rejection, finish/close/
   stdout failure and concurrent/replayed entry. Verify C-before-Pi, direct-result
   finalization, completed text only after reconciliation/drain, retained liability
   and state-aware proof replay. Include real B1 open before one-attempt bind, unbound/failed/repeated bind refusal, shared observation-custody separation, and reserved-before-consume failure retaining both reservation and pending owner through entry cleanup. Fake C-only tests cannot close composition.
3. Planner preserves owner results/unknowns, all seven map keys, exact provider
   values and disabled entries; all four identityState cases (including duplicate mixed facts/refusal rows) map exactly and never authenticate source claims; caller mutation cannot change returned values.
   No supplied evidence tag enables bootstrap or writes config. Prove sparse/null/
mandatory-reasoning/clamp negatives and unchanged v0/approval-cli behavior.

## Out of Scope

Production authority adapters/activation, provider calls, credentials/host apply,
store initialization or budget creation, L6/Jev, HRO caller implementation,
approval-cli changes, new ranking/schema/money semantics and full live exit.

## Context & References

- [Parent/root decisions](PMC-P2E-config-caller-migration.md)
- [Inventory](../../goals/pi-model-configuration/pmc-p2-caller-inventory.md)
- [B1](PMC-P2B1-durable-intent-custody.md)
- [C](PMC-P2C-same-process-launch-controller.md)
- [D](PMC-P2D-openrouter-terminal-transport.md)
- [P1 projection](../../../routing-policy/src/provider-binding-projection.ts)
- [RCM public adapter](../../../routing-policy/src/catalog-eligibility-adapter.ts)

## Allowed Files

Future implementation only; eight paths, no manifests/barrels/host configuration:

- plugins/foreman-line/dispatch/src/pmc-launch/config-plan.ts
- plugins/foreman-line/dispatch/src/pmc-launch/governed-entry.ts
- plugins/foreman-line/dispatch/src/pmc-launch/entry-cli.ts
- plugins/foreman-line/dispatch/src/pmc-launch/installation.ts
- plugins/foreman-line/dispatch/tests/pmc-config-plan.test.ts
- plugins/foreman-line/dispatch/tests/pmc-governed-entry.test.ts
- plugins/foreman-line/dispatch/tests/pmc-entry-cli.test.ts
- plugins/foreman-line/docs/goals/pi-model-configuration/pmc-p2-caller-inventory.md

## Verification Plan

Ordered tasks: (1) two-file planner/tests; (2) governed-entry and installation
plus composition tests after accepted predecessors; (3) CLI/tests/inventory.
Checkpoints after each task; do not call stub success real composition. Any
additional source, helper, test file or missing predecessor port requires amendment.

From dispatch with Node 24.19.0 run `node --import tsx --test
tests/pmc-config-plan.test.ts tests/pmc-governed-entry.test.ts
tests/pmc-entry-cli.test.ts`, then `npm.cmd test`, `npm.cmd run typecheck`,
`npm.cmd run lint`; repeat package checks for impacted routing-policy. All tests
offline with network denied before approved Pi imports; no actual live command.
Diff/export checks prove approval-cli, manifests, v0 config and money unchanged.

Reviewer focus: Can stdin or a plan mint origin/profile custody? Is actual CLI
covered rather than only a helper? Does a lifecycle failure preserve successful
accounting without exposing provisional text? Are private capability inputs finite
and compatible with accepted C/D? Are source-map unknowns still denied? Does the
unavailable production bootstrap remain a named gap in HRO's original live exit?
