# PMC-P2F fixed schema validator reuse — shaping notes

**2026-09-26: DRAFT, not dispatchable.** Documentation preparation only;
independent design review and coordinator Gate 2 remain outstanding. No runtime
implementation, public API, ShapingResult, provider invocation or measurement
has been produced by this shape.

## Purpose and inspected source

HRO-P2 seeks deterministic reuse without weakening the PMC owner's current
evidence gates. Inspection found a smaller repeated operation worth isolating
first: `validateProviderBindingPolicyV1` snapshots a policy and constructs/compiles
the same fixed Ajv schema on every call. Both the projection and the resolver
invoke that validator. Reusing only its compiled code avoids inventing a choice
cache seam that the current resolver does not offer.

Accepted main: `71fd4895a60f90318b517818da14dea94b627fb0`.
Shaping base: `d3aabaa9b732481cc4dc7b5e65e40dadfd5924fa` (main plus coordinator
closure). Source blobs:

- provider-bindings.ts: `6dc979d360c75bf1409e044f59e90146a109505d`;
  snapshot and compile at the inspected lines 211–229.
- provider-binding-schemas.ts: `f301f9dc562b6520f56ae2bc29a56ba86952f6fd`;
  recursive freeze helper and schema construction at lines 137 and 167.
- pmc-resolver.ts: `809e8d08a9444c925fb8b88b423e2e4b7ff28625`;
  full context/policy validation at lines 498–542; complete candidate ranking
  remains at lines 1065–1089.

The coordinator authorized shaping this prerequisite owner change under the
user's HRO prerequisite delegation. That authority does not constitute design
approval or a builder release for this draft.

## Chosen boundary

The [draft spec](../../specs/active/PMC-P2F-schema-validator-reuse.md) proposes one
private lazy retained compiled validator for the fixed recursively frozen schema.
Input snapshotting stays first, and initialization remains inside the existing
typed try/catch. Publish the retained reference only after compile succeeds.
Initialization failure returns VALIDATION_BOUNDARY_FAILED and permits a later
call to try again; there is no same-call retry or permanently cached failure.
After success, schema/semantic refusal or execution exception does not discard
the compiled validator. Every invocation continues to validate its own snapshot.

Mutable Ajv error state must be reduced immediately to the existing public
first-error path. Alternating invalid/valid calls, caller mutation, compile
recovery and execution faults are permanent regression obligations. Instrument
the library only inside isolated tests; do not add production ports to make
those tests convenient.

No policy or route is cached. There is no cache key, TTL, public prepared handle,
claim reuse or comparator change. Current request binding, freshness, liabilities,
episode uncertainty, availability, independence and all candidate ranking still
run through the accepted owner. Results remain selection-only. Later policy or
choice caching would require its own scoped contract and independent review.

## Verification and handoff

Shaping advisory checks: the existing spec-linter `validate` command passed
with Node 24.19.0 using the read-only hro-pmc-p1a donor runtime; the required
body-section check also passed. These checks do not approve the design or release
a builder. Only this notes file and the draft spec are included in the local
documentation commit; source and dependency files remain unchanged.

Pending implementation evidence: exact released source/head, compile-count and
parity/fault test results, package checks, applicable contract/mutation checks,
and one-time scope diff. Do not fill those fields with shaping-time assumptions.
No timing probe was run during this shape; compile reuse is a proposed mechanism,
not measured routing or provider savings. If a later optional synthetic profile
is run, distinguish cold module initialization from warm calls and disclose host
load and fixture limits. HRO-P2 and the full HRO execution exit remain open.
