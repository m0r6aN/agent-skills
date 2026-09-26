---
ticket: HRO-P1B
title: Offline injected consumer compatibility for mapping proposals
status: done
owner: clinton.morgan
created: 2026-09-26
updated: 2026-09-26
supersedes: null
superseded_by: null
risk: elevated
surfaces:
  - plugins/foreman-line/hybrid-routing/
  - plugins/foreman-line/contract-readers/
  - plugins/foreman-line/verification/
  - plugins/foreman-line/docs/goals/hybrid-routing-optimization/
routing_class: architecture/risk
permission_profile: builder-architecture
data_classification: internal
verification_class: judgment-required
---

## Intent

Demonstrate offline compatibility between P1a's evidence-only proposal, injected
eligibility facts and the existing public dispatch result shape. Validate unknown
adapter returns and preserve identity/transport constraints and typed failures.
This is a conformance harness with no production consumer wiring.

## Constraints

- Coordinator Gate 2 below; depends on accepted P1a and its tooling,
  validation bounds and frozen-copy discipline. No new dependencies.
- Only HRO package changes. Type-only imports of RoutingInput/RoutingResult from
  dispatch/src/index.ts (public barrel) are allowed. No runtime dispatch imports
  or evaluateRouting calls: that function reads policy and writes receipts.
  No RCM internal imports or claim of a published PMC projection API.
- Pure synchronous injected adapters return unknown. Check their returns rather
  than trusting annotations. Call each at most once, with frozen owned inputs;
  reject throws and promises/thenables. No retries or hidden IO implementations.
- No network, host configuration, clock reads, receipt calls, actual policy
  authorization, provider availability or live entitlement claims.

### Local contracts

Export validateConsumerCompatibility(request: unknown, dependencies:
ConsumerDependencies): ConsumerCompatibilityResult. Check dependencies at runtime
as well; missing/nonfunction callbacks produce adapter_invalid.

The closed request has proposal/projection/context (P1a inputs), routingInput
(exact public RoutingInput fields), and expectedEligibility (digestSha256,
sourceRef, approvedConfigRef, maxAgeMs). Trust pins come from the fixture caller,
never the proposal or response. maxAgeMs is an integer in [0,86400000]. All input
bounds/date formats follow P1a; identifiers are preserved exactly.

```typescript
type ConsumerDependencies = Readonly<{
  eligibilityOracle: (request: Readonly<{
    evaluationTimeUtc: string;
    identities: readonly Readonly<{ provider: string; id: string }>[];
  }>) => unknown;
  evaluateOffline: (input: Readonly<RoutingInput>) => unknown;
}>;
type ConsumerRejectionCode =
  | 'input_invalid' | 'input_limit_exceeded' | 'adapter_invalid'
  | 'mapping_refused' | 'eligibility_refused' | 'eligibility_invalid'
  | 'eligibility_mismatch' | 'eligibility_stale' | 'evaluator_refused'
  | 'evaluator_invalid' | 'route_mismatch';
type ConsumerCompatibilityResult =
  | Readonly<{ ok: true; evidenceOnly: true;
      proposal: MappingProposalV1; routing: RoutingResult }>
  | Readonly<{ ok: false; evidenceOnly: true; code: ConsumerRejectionCode;
      upstreamCode?: string }>;
```

The local fixture mirror of the owner-handoff oracle payload is:

- Failure: {ok:false, level:'snapshot'|'authority'|'request', code:string}.
  Preserve bounded nonempty code diagnostically; unknown codes never grant
  success/retry authority.
- Success: {ok:true, provenance, results}. Provenance has exactly digestSha256,
  sourceRef, sourceTimeUtc, evaluationTimeUtc, ageMs, maxAgeMs, approvedConfigRef.
  Exactly one result must match the sole requested identity, with
  {requested:{provider,id}, outcome:'facts', facts} or
  {requested:{provider,id}, outcome:'refused', codes:readonly string[]}.
  Codes are bounded nonempty strings, unique, 1-32 entries.
- Facts have exactly provider, id, baseUrl, api (bounded nonempty strings),
  reasoning (boolean), contextWindow/maxTokens (positive safe integers),
  inputModalities (nonempty unique subset of text|image), rates and thinkingLevels.
  Rates are {input,output}, each {value:number,unit:'USD per 1M tokens'} with
  finite nonnegative value. ThinkingLevels is {status:'unknown'} or
  {status:'declared',levels}, at most 32 unique
  {level:string,providerValue:string|null} entries. Preserve baseUrl as evidence;
  never dereference it or treat syntax as endpoint authorization.

### Order and outcome semantics

1. Validate request/dependencies, then call P1a validator. Mapping failure returns
   mapping_refused plus upstreamCode, calling neither adapter.
2. Call oracle with exact proposal provider/providerModelId and explicit context
   clock. Validate all unknown returned data using bounded owned copies. A
   throw/thenable/malformed shape is eligibility_invalid; a well-formed refusal
   is eligibility_refused with first code in declared upstream order. Reject
   missing/extra/duplicate results and wrong echoed identity.
3. Require facts provider/id to match requested values and facts.api to equal
   proposal.protocol, without aliases. Compare digest/source/approvedConfigRef
   to caller pins. Recompute age using explicit clock, require exact echoed
   clock/ageMs/maxAgeMs, and reject future/stale evidence as eligibility_stale.
   Identity/protocol/pin mismatch is eligibility_mismatch. No evaluator call on
   failure. These checks establish evidence consistency, not production policy.
4. Call evaluateOffline once with RoutingInput. It returns unknown, required to
   be the closed HRO-local envelope {ok:true,result} or {ok:false,code}. A throw
   is evaluator_refused without exception text; declared failure preserves the
   bounded code. Malformed/thenable returns are evaluator_invalid. This fixture
   envelope never changes actual dispatch's existing thrown RoutingError API.
5. Validate result with exact RoutingResult fields resolvedModelId, resolvedTier,
   routingDecisionRef (bounded nonempty strings), transportRequirements with
   exactly {data_collection:'allow'|'deny',zdr:boolean}. For internal/restricted
   fixtures require deny/true; weakening yields evaluator_invalid. Require
   resolvedModelId === proposal.logicalCandidateId, otherwise route_mismatch.
   Never substitute provider-local or Pi host IDs for existing logical identity.
6. Return frozen owned proposal and original routing fields including transport
   requirements and fixture-only routingDecisionRef, with evidenceOnly:true.
   No receipt is created and success is not runtime dispatch authorization.

## Acceptance Criteria

- Exact static/OpenRouter-shaped fixtures preserve all distinct identity fields,
  existing RoutingInput/Result compatibility and transport requirements.
- Tests assert zero downstream calls after prerequisite failure, at most one
  adapter invocation on success and exact frozen request/clock/identity input.
- Test malformed/extra keys, duplicate/missing/wrong identities, wrong protocol,
  forged pins/age/clock, future/stale/boundary age, invalid modalities/rates/
  thinking levels, throwing properties/proxies, adapter throws and thenables.
- Type-only public imports check compile-time compatibility; production dispatch
  callers/errors are untouched. No failure guesses or selects another model.
- A batch fixture test proves one typed failure does not prevent a subsequent
  independent fixture check; it makes no production parcel-scheduling claim.
- New package checks and unchanged dispatch/routing-policy suites pass. Handoff
  records pending stable PMC/RCM export and production-adapter predecessors.
  Offline completion does not close HRO or enable runtime integration.

## Out of Scope

Production dispatch wiring; routing-policy/SUPERCHARGE, PMC/RCM schemas/exports,
Jev, receipts/settlement, Pi config; actual evaluator/provider calls, cache,
retry, discovery, fallback execution, selection, scheduling, merge and release.

## Context & References

- [P1a validator](../done/HRO-P1a-mapping-contract.md)
- [Owner handoffs](../../goals/hybrid-routing-optimization/hro-p1-coordination.md)
- [Dispatch public barrel](../../../dispatch/src/index.ts)
- [Evaluator public contract](../../../dispatch/src/routing-eval/index.ts)

## Allowed Files

- plugins/foreman-line/hybrid-routing/src/consumer-compatibility.ts
- plugins/foreman-line/hybrid-routing/src/index.ts
- plugins/foreman-line/hybrid-routing/tests/consumer-compatibility.test.ts
- plugins/foreman-line/hybrid-routing/README.md
- plugins/foreman-line/docs/goals/hybrid-routing-optimization/hro-p1b-handoff.md

## Verification Plan

Run package typecheck/tests, unchanged dispatch/routing-policy regression suites
under Node >=24.11.1. Record commands/counts, allowed-file diff and import proof:
only type-level public dispatch access and no upstream internal/runtime imports.

Mandated reviewer questions:

- Is every unknown callback return checked rather than self-authenticated?
- Can callbacks accidentally call the production evaluator or write receipts?
- Are identity and privacy requirements preserved without aliasing?
- Does success carry only offline evidence, with no routing authority?

## Evidence Required

Accepted P1a, narrowed-scope coordinator Gate-2 directive, fixture/full tests and
typecheck, scope/import proof and independent architecture/risk review. Later
production work requires stable PMC/RCM exports, owner sequencing and new scope.

## Collision Risk

Only HRO barrel/README overlap P1a; serialize after acceptance. No upstream edits.

## Stop-and-Report Rule

Stop on upstream runtime imports, authoritative schema changes, production
adapter wiring, receipt writes, network/host access or any unlisted file.

## Gate 2 and isolated implementation release — 2026-09-26

Coordinator grants Gate 2 under the user's standing authority for the five
allowed implementation paths only. P1a's frozen fb32705 has two independent
approvals; reviewed A2 audit enrollment is integrated at 379f144. PR54's full
corrected remote gate remains pending, so private implementation may proceed
against this reviewed base but P1b integration/merge must follow successful
P1a merge and its own independent reviews. No failed predecessor gate is waived.

Builder workspace: D:/Repos/agent-skills-worktrees/hro-p1a-20260926, reused only
after clean checkout verification; branch codex/hro-p1b-20260926. The original
P1a branch and frozen commits are preserved. Use a fresh GPT-5.6-Luna builder
session, Node24.19.0, existing package tooling and standing constraints at
plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md. Verify the exact
documentation commit/spec blob, restate boundaries and stop for Step-0 release.
Report any actual contract gap before implementation; do not invent owner APIs.

Return a local frozen commit, test counts, typecheck/lint and exact scope/import
proof. No push, provider calls, Pi writes, actual dispatch or production receipt
creation. Later integration must preserve all accepted PMC/RCM exports and
rerun the unchanged public-interface checks on the reconciled base.

## A1 — Step-0 boundary clarifications

The coordinator confirms the closed top-level request has exactly five keys:
proposal, projection, context, routingInput and expectedEligibility. The last
object has exactly digestSha256, sourceRef, approvedConfigRef and maxAgeMs.
digestSha256 is lowercase hexadecimal of length 64; sourceRef and
approvedConfigRef are nonempty strings bounded to 2,048 UTF-16 units, preserved
exactly without normalization. maxAgeMs is an integer in [0,86400000]. All
timestamps use P1a's exact UTC millisecond round-trip format.

routingInput has exactly routing_class, data_classification and workflowId as
own enumerable data properties. Reject extras, accessors and unsupported plain
data as for every request field. workflowId is a bounded nonempty opaque string
in this offline API, never a file path to dereference. Classification is exactly
public, internal or restricted. The current legacy routing class vocabulary is
boilerplate, standard-feature, architecture/risk or implementation/standard;
reject other values here rather than inventing new PMC runtime classes. This
local compatibility check is not a new owning policy enum or runtime import.

"Original routing fields" in step 6 means the validated RoutingResult returned
by evaluateOffline, including its transportRequirements; it does not add a
transportRequirements field to RoutingInput. Preserve that result's exact values.

Use a fresh bounded owned capture per phase: complete request, oracle response,
and evaluator response. Each phase has the inclusive P1a ceilings (8,192 visited
values, 262,144 aggregate UTF-16 string units including keys, 2,048 per string,
depth 8 from that phase root and at most 256 array elements unless a smaller
field-specific cap applies). No budget reset within a phase. Shared caller
objects are captured once per phase while their expanded occurrences still
consume value/depth/string budgets; cycles refuse. P1a validates only the owned
request's three mapping fields under its own existing bound contract.

Dependencies are a separate closed plain record with exactly the two own
enumerable function-valued callbacks. Inspect descriptors without invoking
accessors; capture each callback once and never reread the caller container.
Do not mutate/freeze caller functions. Only callback input data is owned/frozen.
All unknown thrown values and malformed/thenable results must yield the stated
typed outcomes without examining unsafe exception properties or prototypes.
These clarifications resolve Step-0 flags without changing the five-file scope
or authorizing production behavior.

## Integration amendment: Contract B reader declaration — 2026-09-26

Both independent reviews approve unchanged HRO source 5ea6c7a. Review B also
approved combined mainline head 9e902a4 after HRO35, routing505, dispatch126,
typechecks, HRO lint, D19,159 hostile cases,12 additional probes and six mutation
controls. Full CI runs36256897838/36256895104 separately failed Contract B's
reader-inventory sweep; all other package check cells passed.

The coordinator rules consumer-compatibility.ts a genuine Contract B additive
lockstep reader: it repeats the routing-class vocabulary and validates membership.
Adding a vocabulary member requires changing that local set. Declare it under
contractB.readers; do not mark it a nonreader, hide its literals or add a runtime
import to evade the sweep. Consumer production code and its approved tests stay
unchanged. This is a narrowly scoped integration correction.

Extend Allowed Files solely with:
- plugins/foreman-line/contract-readers/src/registry-data.ts
- plugins/foreman-line/contract-readers/tests/touch-set.test.ts
- plugins/foreman-line/verification/src/d19-audit.ts
- plugins/foreman-line/docs/goals/hybrid-routing-optimization/hro-p1b-final-acceptance.md

Add the one reader with its explicit additive-lockstep rationale. Preserve both
contract registries' existing entries and all negative reader rulings. Extend the
permanent sweep tests with the declaration/rationale and a deletion negative
control proving that removing this real reader is detected. The D19 registry
DATA pin must be recomputed from the actual sorted observed literals: exactly
one additional value (8 to9), new exact digest, unchanged structural predicate.
Do not broaden the predicate or weaken missing/duplicate/spurious-literal checks.
No unrelated audit, producer, schema, export or dependency source changes.

Gate2 is granted for this repair under standing authority. Fresh Luna builder
inspects exact branch/head/spec and stops at Step0; coordinator then releases.
Workspace hro-p1b-integration-20260926, branchcodex/hro-p1b-integration-20260926.
Verify Contract B RED then GREEN, contract-readers tests/typecheck/lint, D19,
mutation-scope-guard regression, verification typecheck/lint and unchanged HRO
checks. Reuse only absent-target matching-lock dependency junctions. Two
independent reviews of this declaration/pin repair and green full CI remain
required; previous source approvals are preserved, not extended to unseen changes.
