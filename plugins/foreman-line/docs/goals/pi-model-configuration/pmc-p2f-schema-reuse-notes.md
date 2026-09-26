# PMC-P2F fixed schema validator reuse — implementation handoff

**2026-09-26: private implementation complete; independent implementation review pending.**
Gate 2 released the exact three-file scope at
2bc35e99708b1290a184e5d7614fc9b984e4e4c3, active spec blob
2faf7b0c08e249b20ea1d89e0721d1bb7493eb7f. Earlier shaping findings below remain
historical context. No provider invocation, public authority or timing claim.

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

The [released spec](../../specs/active/PMC-P2F-schema-validator-reuse.md) proposes one
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

## Implementation and retained boundaries

One module-private `ValidateFunction` holds only the successful compilation of
`providerBindingPolicyV1Schema`. The nullish assignment is inside the existing
try/catch and AFTER snapshotting. A constructor/compile throw leaves it undefined;
a validation exception leaves the successful function retained. Input snapshots,
semantic traversal, error precedence/cap, returned shapes and owned policy freezing
are unchanged. No public export, cached policy/result or input-key lookup exists.

The schema is fixed, recursively frozen, synchronous and has no custom keywords,
async validation or caller callbacks. Caller Proxy traps can run during capture,
before the owned snapshot reaches Ajv; after capture the real validator sees only
owned ordinary data. The first failing `instancePath` is copied immediately into
a new public error record. Ajv's mutable errors array never leaves the owner.

## Permanent tests and RED/GREEN evidence

All new instrumentation is in provider-bindings.test.ts. Each scenario launches a
fresh Node process, installs a test-local Proxy around the real CommonJS Ajv export,
then dynamically imports the actual owner. Normal construction/compilation and
validation delegate to real Ajv. Selected fault sites throw instead. The original
export descriptor is restored in finally; no parent/test-suite module is patched,
no helper file is generated and no production injection/reset/env switch exists.
Child processes have a 30-second timeout and bounded captured output.

| Isolated scenario | Observed invariant |
|---|---|
| reuse | Eight ordinary inputs invoke validation; one successful constructor/compile. Cold and warm capture failures do not reach Ajv. Distinct schema errors remain stable across later calls; accepted source mutations are revalidated. |
| cold-schema | Schema-invalid ordinary data triggers cold compilation; nine validation calls share one successful function. |
| construction | One injected construction failure is typed; next call constructs/compiles normally, and the following call reuses it. Two constructor attempts, one compile, two real validations. |
| compile | One injected compile failure is typed; next call retries and succeeds. Two construction/compile attempts, one successful function, two real validations. |
| persistent | Two separate invocations each make one failed compile attempt and return the typed boundary refusal; no execution or same-call retry. |
| execution | One successful compile, four validation attempts (three delegated to real Ajv, one injected throw); execution failure is typed and does not trigger recompilation or alter prior results. |

RED preceded the source change: the initial five scenarios produced one pass and
four failures (reuse constructed eight times instead of one; construction/compile
recovery constructed three times instead of two; execution constructed four times
instead of one). All representative result/path assertions before those count
checks already matched the accepted implementation. GREEN after the source change
passed all initial five scenarios. The additional cold-schema case passed in the
final full suite. Original package tests continue to cover complete semantics,
projection, resolver behavior and hostile capture; no test was removed or skipped.

## Exact validation commands and outcomes

Each package command used process PATH prefixed with D:/nvm/v24.19.0; executable
reported `v24.19.0`. Dependencies were existing matched-lock read-only junctions;
no installation, regeneration, package or lock modification.

From `plugins/foreman-line/routing-policy`:

- `D:/nvm/v24.19.0/node.exe node_modules/tsx/dist/cli.mjs --test --test-name-pattern='compiled validator lifecycle' tests/provider-bindings.test.ts` — RED exit 1, four expected failures; initial GREEN exit 0, five passing scenarios.
- `npm.cmd run typecheck` — exit 0 before final formatting and exit 0 on final source.
- Initial `npm.cmd run lint` — exit 1 for assignment-in-expression and test array formatting; both fixed only in allowed files.
- `D:/nvm/v24.19.0/node.exe node_modules/@biomejs/biome/bin/biome format --write tests/provider-bindings.test.ts` — exit 0; one allowed file formatted.
- Final `npm.cmd test` — exit 0; 944 tests, 944 pass, zero failed/skipped/cancelled.
- Final `npm.cmd run lint` — exit 0. Existing informational useLiteralKeys message in untouched catalog-snapshot.test.ts:777 remains; no lint error.

From `plugins/foreman-line/hybrid-routing`:

- `npm.cmd test` — exit 0; 35 tests, 35 pass, zero failed/skipped/cancelled.
- `npm.cmd run typecheck` — exit 0.
- `npm.cmd run lint` — exit 0.

The two package suites and static checks ran concurrently with other host work;
reported test timings are not a performance experiment or speedup claim.

## Scope, acceptance map and residual gates

AC1–3: real-library isolated lifecycle/cold-schema cases, alternating errors,
caller mutation, fresh owned values and preserved schema-before-semantic precedence;
original capture/bounds/schema/semantic/projection/resolver tests all pass.
AC4–5: child-isolated constructor/compile/execution fault cases above, with genuine
Ajv delegation outside each injected fault and descriptor restoration.
AC6: both package suites/typechecks/lints pass. One-time diff confirms only the
released source, test and notes files changed; schema/resolver/barrel/manifests/
locks/generated files remain untouched. Current contract-readers registry covers
spec-frontmatter and routing-class vocabulary, neither of which changed; no new
reader-inventory obligation is introduced by retaining this compiled function.
The existing postHocCheck is used for exact allowed-file validation, including
an out-of-scope negative control; no guard/registry inventory is altered.
AC7: mechanism counts only; no latency threshold, provider savings, route reuse or
HRO completion claim. Native offline agent dispatch is the explicit Gate 2
substitution; no minted runtime receipt or independently attested engine version.

Independent reviewers should inspect successful-only assignment, absence of
caller callbacks between validation and error copying, real-library delegation
in the test child, and prevention of schema/semantic short-circuits. The builder
cannot approve its own implementation. Two independent implementation reviews,
coordinator integration and remote CI remain outstanding; no push or merge.

Final one-time checks: `git diff --check` exit 0. An inline Node24.19.0 script
loaded existing mutation-scope-guard postHocCheck through the frozen donor tsx
loader, compared `git diff --name-only 2bc35e99708b1290a184e5d7614fc9b984e4e4c3`
with the three allowed paths and checked the added pmc-resolver.ts negative
control: exit 0, three authorizations and OUT_OF_SCOPE refusal as expected.
`git diff --quiet 2bc35e99708b1290a184e5d7614fc9b984e4e4c3 --` the schema,
resolver, barrel and both packages' manifests/locks returned exit 0.
Final source blob: f9f22ccaeaf8d1c1db6c805269575b1c7f3cc0ad.
Final test blob: e14910cadb32445b3fbc5419aa9cc3169787ba59.

## Coordinator acceptance for integration (not Stage F closure)

Two independent frontier implementation reviews APPROVE frozen
`fb722c4bd8031c9d4d736196d2c78cf4d4833dde`, with no blocking finding. Neither
reviewer implemented this change. Reviewer A independently passed 366 binding/
projection/resolver tests, typecheck and changed-file lint. Reviewer B passed the
same 366 tests plus 35 hybrid tests and typecheck; an additional actual-Ajv probe
confirmed returned error stability after error-object mutation and one compilation
even with capture-phase reentry. Both verified exact three-file scope and unchanged
head. These establish semantics and mechanism only, not measured latency savings.

Coordinator independently inspected capture-before-init, successful-only assignment,
unchanged full semantic walk, immutable schema and synchronous owned-data validation.
Focused76 tests/typecheck pass. Combined branch on accepted main71fd489 contains
only this runtime delta and prior reviewed P2B/HRO closure documents. Full combined
checks pass: routing-policy944, hybrid-routing35, contract-readers70 and
mutation-scope44; all four typechecks/lints exit0. Existing routing-policy lint
informational __proto__ message is unchanged. No predecessor runtime is modified.

Independent combined-head inspection and remote CI remain required. No provider
call, savings claim, active-runtime result, merge or full-HRO completion is recorded.
