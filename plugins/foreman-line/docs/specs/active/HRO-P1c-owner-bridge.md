---
ticket: HRO-P1C
title: Evidence-only context assembly for the PMC owner resolver
status: active
owner: clinton.morgan
created: 2026-09-26
updated: 2026-09-26
risk: elevated
surfaces:
  - plugins/foreman-line/hybrid-routing/
routing_class: architecture/risk
permission_profile: builder-architecture
data_classification: internal
verification_class: judgment-required
---

## Intent

Assemble real PMC binding projections and supported RCM catalog results into an
owned context that the existing PMC resolver can consume. Supply the missing
field translation and evidence joins, without a second selector, claim issuer,
or launch API. This parcel delivers an offline library integration; the later
governed caller and the original HRO execution/measurement exit remain open.

## Constraints

Reviewed contract: the scoped private build release is recorded below. Gate 2 requires coordinator ratification,
exact file ownership, clean accepted base and independent design review. Standing
constraints apply. PMC-P2A source at `725d74107642ecf510974f71d21c00bf6909f149`
is the inspected base; coordinator reports its unchanged accepted integration
merged through PR61 at `4b86643acd4e5cdf183e85cf1cd1c2ace51e0182`.

Use public exports from `../../routing-policy/src/index.js` only:
`projectProviderBindingsV1`, `evaluateCatalogEligibility`, and their exported
types. Tests additionally call `producePublicObservationSnapshot` and
`resolvePmcRouteV1` from that barrel. Do not import owner internals, dispatch
runtime, host APIs, network, clock, timers, filesystem or crypto in the bridge.
No dependencies or owner exports change. Existing P1a/P1b remain unchanged.

### Closed API and honest types

Add one synchronous `preparePmcOwnerContextV1(input: unknown)` export and its
`PmcOwnerContextAssemblyResultV1` type. No dependency callbacks, alternate resolver,
runtime mode switch, candidate override, cache argument, proposal argument or
convenience resolve wrapper. The closed input has exactly four required fields:

| Field | Meaning |
| --- | --- |
| `policy` | Raw PMC policy accepted only through `projectProviderBindingsV1`. Neither a projection envelope nor an HRO proposal substitutes for this policy. |
| `catalogInput` | Exact existing `CatalogEligibilityInput`: canonicalBytes, expectedSha256, approvedConfig, evaluationTimeUtc, identities, acceptedSource. The real RCM adapter validates it. |
| `catalogSource` | Caller-supplied existing `CatalogClaim['source']` value. Capture as unknown; no construction of a supplied claim, EvidenceRef, profile digest or freshness from catalog metadata. |
| `ownerContext` | Exact keys policyDigest, configDigest, evaluationTimeUtc, evidenceMode, episode, freshness, independence, budget, bindings. Values are bounded captured ordinary data, not yet PMC-validated claims. No projection or catalog key is accepted here. |

All keys are required, with no extra/optional fields. `ownerContext.evaluationTimeUtc`
must equal `catalogInput.evaluationTimeUtc` exactly. PMC validates its date format,
claim semantics, version bindings and dynamic gates. The adapter independently
validates the catalog evaluation time; never substitute an ambient time.

The result is the following closed union (all objects deeply frozen):

- `{ok: true, evidenceOnly: true, context}`. Context has exactly the existing
  `PmcResolverContextV1` top-level keys. `projection` is the real successful PMC
  projection; `catalog` has exactly source/provenance/results. Source is the owned
  unknown catalogSource; provenance is the real RCM provenance; result rows are
  described below. Remaining fields are unchanged owned ownerContext values.
  Expose `context: unknown`: assembly success is not owner validation. Do not cast
  it to `PmcResolverContextV1`, claim it is resolver-approved, or return a route.
- `{ok: false, evidenceOnly: true, stage: 'bridge', code}` where code is exactly
  `INPUT_REFUSED | BOUNDS_REFUSED | TIME_BINDING_REFUSED | IDENTITY_BINDING_REFUSED`.
- `{ok: false, evidenceOnly: true, stage: 'projection', result}` with the exact
  unsuccessful `ProviderBindingProjectionResult`, without translated errors.
- `{ok: false, evidenceOnly: true, stage: 'catalog', result}` with the exact
  `CatalogEligibilityResult` for adapter/reader refusal or projector-level failure.

Thus result wrappers have no arbitrary messages, partial context, route, permit,
authorization flag, audit receipt or echoed hostile input. Unexpected boundary
throws become bridge INPUT_REFUSED; normal typed owner refusals retain their
original stage and code. There is no retry.

### Phase order, ownership and limits

1. Capture the entire envelope once before either owner call. Descriptor-only
   ordinary objects (Object.prototype or null) and dense ordinary arrays; reject
   accessors, symbols, nonenumerable data, functions, promises, exotic prototypes,
   cycles, undefined and nonfinite numbers. Catch proxy traps; never call caller
   iterators, getters, toJSON or coercion. Shared aliases count at every expanded
   occurrence; input immutability after capture cannot affect either owner call.
2. Cap envelope depth at 20, ordinary expanded nodes including keys at 131072,
   each string/key at 4096 UTF-16 units, total string/key units at 2097152 and each
   array at 256. Check declared array length and reserve its traversal budget
   before own-key enumeration, allocation or descent. Reject overbounds rather
   than truncate. The canonicalBytes leaf alone accepts a genuine Uint8Array
   backed by fixed, nonshared ArrayBuffer, at most 8 MiB; inspect intrinsic slots
   and copy once without caller methods. No byte leaf elsewhere. Never freeze a
   nonempty typed array or expose the private copy in a successful context.
   Owner limits still apply and may be narrower; no promise that every owner-valid
   maximum-sized input fits this deliberately bounded bridge.
3. Validate closed envelope/ownerContext keys and the exact time equality. Then
   call `projectProviderBindingsV1(policy)` exactly once. On failure return its
   typed projection result; do not call RCM. Projection retains the whole policy,
   lane occurrences, unknown evidence and held states losslessly.
4. Call `evaluateCatalogEligibility(catalogInput)` exactly once. Adapter and
   reader failures, or projector `ok: false`, terminate with the catalog wrapper.
   A projector success containing per-identity refusals is a valid catalog value,
   not an overall bridge failure and never a reason to drop a candidate.
5. For each real projector row, preserve its order. Match requested.provider/id
   exactly to one PMC policy binding provider/providerModelId; reject no match,
   unsupported provider or duplicate row as IDENTITY_BINDING_REFUSED. Do not
   normalize strings, infer aliases, invent mappings, filter eligible candidates
   or require the full policy identity set. The catalog scope may be a lane
   subset; the resolver alone checks exact request-lane coverage and binding claims.
   Emit `{provider, providerModelId, outcome:'facts', facts}` or
   `{provider, providerModelId, outcome:'refused', codes}`. Preserve facts/codes
   exactly; no rate arithmetic, ranking or availability inference.
6. Assemble the context and freeze owned ordinary output. catalog.source is copied
   unchanged from catalogSource, not synthesized from acceptedSource. PMC's real
   resolver must subsequently validate source digest/config/time and all supplied
   evidence. The trusted caller is responsible for authenticating catalogSource
   against the producer's accepted source/profile before calling; the bridge
   cannot authenticate a digest string. Assembly alone does not certify that join.

Phase precedence is local to this assembly API. It does not replace PMC's request
first refusal order. The future controller must refuse unsupported versions/L6
and authenticate intent before assembling any context. No HRO call is inserted
before those controller gates by this draft.

### Concrete call graph and future consumer

Offline tests: retained bytes + pinned producer trust -> real
`producePublicObservationSnapshot` -> canonical bytes/digest/acceptedSource ->
`preparePmcOwnerContextV1` -> real `resolvePmcRouteV1(request, context)`.
Producer runs outside this API; producer refusal never falls back to hand-built
snapshot bytes. A retained six-row observation proves catalog conformance only.
Synthetic dynamic claims must be labeled `synthetic-offline`; real catalog facts
alone cannot establish quality, availability, budget or independent execution.

The intended production consumer is PMC-P2C's trusted same-process controller,
between its authenticated owner-context acquisition and its sole PMC resolver
call. That controller must authenticate source/profile and owner claims, acquire
fresh budget/availability/independence/episode evidence, then consume this value.
Its DRAFT contract needs a separately reviewed caller adjustment naming this API;
no controller source path/implementation is assumed or changed here. P2C, P2B1
durable intent custody, P2D controlled transport and P2E actual opt-in parcel/Pi
caller remain runtime gates under amendment 05 V8. P2B budget custody also remains
required. No dispatch -> HRO -> dispatch runtime cycle is introduced.

Later HRO-P2 can store reusable choice evidence, but each attempt must obtain
current owner claims and call the owner resolver. P2A currently performs full
validation and ranking on every invocation, accepts no cached-choice fast path,
and returns selection-only. A cache hit cannot bypass that call or become a
permit; this bridge promises no resolver latency reduction. Any narrower
owner-supported revalidation seam needs its own evidence and reviewed amendment.

## Acceptance Criteria

1. One bounded public assembly export, direct real owner calls, exact closed
   result shapes and frozen ownership satisfy the contract above. No copied
   eligibility, ranking, claim authentication or dispatch implementation appears.
2. A test uses retained public source-evidence manifest/projection and existing
   pinned profile fixture with the real producer, adapter and PMC projection.
   It verifies row identity, refusals, provenance, timestamps and whole policy
   preservation. Missing/incomplete producer scope is a refusal, not synthesized
   success. Use existing retained files read-only; do not add network fixtures.
3. Real resolver integration uses existing public PMC fixture conventions and
   explicitly synthetic dynamic claims. Prove one eligible selection with
   authority `selection-only`, unknown claims refusal, exact lane coverage refusal,
   stale/future evidence refusal, changed budget refusal, availability refusal,
   independence refusal and uncertain prior-attempt refusal. Change one property
   at a time, preserve other prerequisites and assert the intended owner code;
   tests that merely stop at an earlier unrelated gate do not count.
4. Cross-owner tests independently break catalog digest, config endpoint,
   requested identity, time equality, source digest/config reference and claim
   request binding. Assert which adapter/bridge/resolver boundary rejects each.
   Do not claim bridge authentication of supplied source profile/receipt fields.
5. Proposal substitution tests pass P1a success, P1b success, fabricated projection,
   selection result and serialized permit-shaped objects in each inappropriate
   envelope slot. They never become a successful owner selection/launch. Existing
   P1a/P1b tests remain green; a separately labeled P1b test feeds the real RCM
   projector result into its oracle port and leaves its v0 evaluator fixture-only.
   Do not put the v0 consumer in the pmc/v1 production call graph or coerce the
   lossless PMC policy into the older HRO draft projection.
6. Boundary tests include sparse/oversized arrays, getters/proxies, alias expansion,
   depth/string/node limits, bytes subclasses with overridden iteration, shared/
   resizable storage, typed-array oversize and input mutation. Verify first failure
   and zero later owner calls where applicable; instrumentation supplements real
   integration tests and cannot replace them with fake-only ports.
7. Same input is deterministic; success and typed refusals retain owned immutable
   ordinary values. Package test/typecheck/lint and impacted routing-policy and
   hybrid-routing suites pass. No live invocation, savings or full-goal claim.

## Out of Scope

Cache/storage, a second resolver, mapping-proposal conversion API, changing P1a/P1b,
authority minting, current-claim production/authentication, provider refresh,
source-profile approval, dynamic availability checks, budget/episode persistence,
Jev, telemetry, host/configuration effects, production controller/caller wiring,
Pi execution, release and full HRO acceptance are excluded.

## Context & References

- [HRO charter and actual execution exit](../../goals/hybrid-routing-optimization/charter.md)
- [HRO standing coordination](../../goals/hybrid-routing-optimization/loop-directive.md)
- [Shaping evidence and decisions](../../goals/hybrid-routing-optimization/hro-p1c-owner-bridge-shaping.md)
- [PMC amendment 05; current coordinator copy includes V8](../../goals/pi-model-configuration/gate-1-amendment-05.md)
- [PMC public resolver](../../../routing-policy/src/pmc-resolver.ts)
- [PMC public types](../../../routing-policy/src/pmc-resolver-types.ts)
- [PMC projection](../../../routing-policy/src/provider-binding-projection.ts)
- [RCM adapter](../../../routing-policy/src/catalog-eligibility-adapter.ts)
- [RCM producer](../../../routing-policy/src/public-observation-producer.ts)
- [Standing constraints](../../kickstarters/STANDING-CONSTRAINTS.md)

## Allowed Files

Proposed future implementation authority only, pending ratification:

- `plugins/foreman-line/hybrid-routing/src/owner-context-bridge.ts` (new)
- `plugins/foreman-line/hybrid-routing/src/index.ts` (additive exports only)
- `plugins/foreman-line/hybrid-routing/tests/owner-context-bridge.test.ts` (new)
- `plugins/foreman-line/hybrid-routing/tests/owner-context-integration.test.ts` (new)

No package/lockfile, owner module, controller or fixture edits are authorized.
If existing dependency layout cannot support the public imports without a package
change, stop for a concrete amendment; do not install or alter manifests silently.
Spec lifecycle changes belong to coordinator closure, not these implementation files.

## Verification Plan

Run hybrid-routing test/typecheck/lint with repository Node >=24.11.1, then the
routing-policy test/typecheck/lint suite; use current package scripts, no new
framework. Pin baseline exports/schemas through a one-time parcel diff, not a
permanent test against a moving branch. Architecture/risk requires two independent
frontier reviews after the scoped Luna build; this draft grants no builder dispatch.

Reviewer focus: Does success accidentally assert that dynamic claims are valid?
Can a proposal, cache entry or invented source receipt confer authority? Does the
adapter row translation preserve all refusals and identity pairs? Are capture
bounds enforced before expansion, including repeated aliases and byte ownership?
Does every negative integration case reach its named real owner invariant? Does
the future controller consumer remain explicitly unwired, and can the draft be
implemented literally without adding a second resolver or a dispatch cycle?

## Design acceptance and Gate 2 — 2026-09-26

Coordinator accepts the independent design approval ofba3fbdb under the user's
blanket HRO decision authority. One evidence-only context assembly is the smallest
real RCM-to-PMC row/provenance translation seam; no second resolver or implicit
validation/authorization promise. PMC-P2A is merged at4b86643, HRO-P1b at26c7269.
This offline P1c library slice can build against those actual accepted exports;
controller adoption and the original HRO runtime/measured exit remain open.

Private build workspace D:/Repos/agent-skills-worktrees/hro-p1c-shaping-20260926,
branch codex/hro-p1c-20260926; frozen shaping branch is retained. User-selected
GPT-5.6-Luna high builds exactly the four Allowed Files, then returns tests and a
local commit. Fresh actual-file Step0 and coordinator release are mandatory.
No proposal-to-permit conversion, dependency/owner changes, host/provider effects,
production wiring, push or merge. Two independent frontier implementation reviews,
combined integration and full remote CI gate acceptance. Include contract-readers
and mutation-scope/D19 among pre-PR checks when new code triggers their inventory;
stop for a narrow amendment instead of weakening or evading them.
