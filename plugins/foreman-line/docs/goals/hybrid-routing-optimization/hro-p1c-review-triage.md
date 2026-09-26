# HRO-P1c implementation review triage

Coordinator disposition, 2026-09-26. Independent frontier review A requests changes
on 435c710e4032b366f61095b75e06667fb2cb0936. The bridge is not accepted or released.
The frozen active specification d003114b3edc9e5bf224cf7a486af6ad542f4f54 remains
unchanged; its authoritative limits are depth 20, 131072 expanded ordinary nodes
including keys, 4096 per string/key, 2097152 total units, arrays 256 and a separate
8 MiB canonical-byte leaf. Earlier coordinator shorthand 16/65536 was incorrect.

## Accepted repair findings

1. Memoized ancestor aliases bypass byte-placement checks. Root independently ran
   the review probe: catalogSource=catalogInput returns success with a mutable
   Uint8Array at context.catalog.source.canonicalBytes (byte 123 changed to 42).
   ownerContext.episode alias is another route. Reject byte-containing aliases
   outside the exact permitted input leaf; no successful context may expose it.
   Preserve capture ownership and expanded-alias accounting. Add permanent RED
   controls for both fields and relevant nested/ordering variants.
2. copyBytes charges byte length to the ordinary-node budget, refusing a 131073-byte
   leaf before the adapter despite the separate 8 MiB contract. Root reproduced
   this. Enforce byte and ordinary-data limits independently, including their own
   exact-boundary tests. Reaching a later owner refusal is sufficient for an
   otherwise malformed byte document; do not fabricate a valid large catalog.
3. The retained producer test stops at assembly, while resolver selection uses
   hand-built bytes. Add the required actual retained producer -> bridge -> actual
   resolver success and named refusals, explicitly synthetic dynamic claims,
   full provenance/refusal/policy checks and incomplete producer-scope rejection.
4. Add all AC5 substitutions: actual P1a success, actual P1b success, fabricated
   projection, actual selection result and serialized permit-shaped values in
   every inappropriate envelope slot. They must never become successful owner
   selection/launch; assembly alone can accept unknown claim shapes. Include the
   separately labeled P1b real-projector oracle test with its v0 evaluator still
   fixture-only, outside the pmc/v1 production call graph.
5. Complete independent boundary tests: aggregate strings, expanded-alias budget,
   ordinary invalid shapes, actual Uint8Array subclasses, input mutation during
   capture, named first-refusal and zero later owner-call assertions. Test-only
   instrumentation may supplement real integration without new public injection
   ports or runtime dependency changes. Do not rename unexercised assertions.

These are contract compliance and coverage repairs, not new architecture. Current
44 hybrid tests/typecheck/lint pass but do not establish these missing guarantees.
The only authorized implementation files remain the original four in the spec.
No owner source, manifests, dependencies, fixtures, controller or host changes.
The same user-selected Luna builder must perform fresh inspect/restate/STOP,
then receive coordinator release before edits. Require RED/GREEN evidence,
complete AC matrix, affected package checks and a frozen local commit. Two
independent final frontier approvals plus integration/remote CI remain required.
No provider calls, configuration effects, savings or live execution are claimed.
## Second review round: 287d9fc held for required coverage and lint

Both independent frontier reviewers REQUEST CHANGES on
287d9fcfd4fd08ebba93c4829e59dc1e2b2cd925. They independently close the two runtime
defects: byte-containing ancestor aliases no longer escape, and a131073-byte leaf
reaches the catalog owner without spending ordinary nodes. Do not undo those fixes.
No further runtime authority bypass was identified. Required remaining work:

1. AC5 must use actual HRO validateMappingProposal and validateConsumerCompatibility
   successful result objects, not PMC validateProviderBindingPolicyV1 and
   projectProviderBindingsV1 mislabeled P1a/P1b. Construct real HRO successes using
   existing fixtures/exports and assert success before substitution. Include both
   actual HRO results in every inappropriate envelope slot alongside the existing
   fabricated projection, actual owner selection and serialized permit cases.
   No JSON recast or label can stand in for the required real result.
2. Extend the retained-producer-to-bridge-to-real-resolver chain beyond success:
   named refusals, genuinely incomplete producer scope, exact preserved retained
   provenance/refusal arrays/policy values. Add an adapter-valid subset that
   actually reaches the intended resolver lane-coverage refusal. The current
   shortened identities case stops at adapter SCOPE_REFUSED and does not test
   that later gate. Label synthetic dynamic authority claims truthfully.
3. AC6: genuine class extending Uint8Array, not a plain instance with iterator
   override; mutation DURING capture, not only after return; independent invalid
   ordinary shapes; exact at/over ordinary depth/node/per-string/aggregate bounds
   and expanded aliases under the actual20/131072/4096/2097152 contract. Extend
   real-export subprocess call instrumentation so capture-boundary refusals prove
   zero projection/catalog calls and each later refusal proves no later call.
   Tests must assert the intended refusal boundary, not merely any refusal.
4. Full hybrid-routing package biome check . currently exits1: three formatting
   errors and four warnings across source and both newtestfiles. Format/fix only
   authorized files and rerun the actual full package lint. Earlier 'clean' report
   is superseded by independent nativeexit evidence. Do not suppress lint rules.

Fresh Step0: inspect this exact frozen head, actual exports/fixtures and all four
remaining groups; provide a compact case-to-assertion plan, then STOP with no edits.
After root release, existing four-file runtime/test/index write envelope applies;
no new files/manifest/dependency/owner changes. Index needs no artificial edit.
Finish each required assertion, then full hybrid/routing tests/typecheck/lint,
actual native exit checks, scope/diff verification and local frozen commit. Report
commands accurately; test counts alone do not establish acceptance-criterion
coverage. Both final independent reviews must be renewed before integration.

## Third review round: b17f5b2 alias accounting and independent boundaries

Independent review requests changes at b17f5b2a467be79933c0d6a990a36a5879db7e5c.
Genuine HRO substitutions, retained producer provenance/refusals/incomplete scope,
resolver coverage, byte subclass/capture mutation and package lint are now closed.
Preserve those repairs. Two bounded issues remain:

1. copy already reserves the ordinary object node before the memoized-alias path;
   chargeCaptured reserves the alias root again. An independently counted envelope
   with exactly 131072 expanded ordinary nodes reaches projection with distinct
   objects but returns bridge BOUNDS_REFUSED when two empty objects share identity.
   Charge every expanded alias occurrence exactly once, preserving cycle, depth,
   string and byte protections. Add arithmetic exact/one-over fixtures; binary
   search of the implementation cutoff is not an independent contract oracle.
   A review mutation halving NODE_LIMIT to65536 still passes the current purported
   exact-boundary test. Required tests must detect that contract regression.
2. Complete the already-required capture-boundary subprocess instrumentation for
   ordinary invalid shapes and all capture limits. Assert the named first refusal
   code plus zero projection and catalog calls, not only stage. Independently count
   expanded aliases and exact numeric limits rather than discover implementation
   cutoffs. Include earlier required phase assertions without widening authority.

Fresh Step0 inspect/restate/STOP before repair. Same original four-file envelope;
index need not change. No owner/runtime contract, manifests or dependency edits.
Provide failing-before/passing-after evidence, complete package checks, exact scope
and frozen local commit. Both final independent reviewers must inspect the repair.

## Final source acceptance — 7133eb21, 2026-09-26

Two independent source approvals: coordinator and hro_p1c_review_a. Both inspected
actual source/contracts and ran all 53 hybrid tests, typecheck and full-package
lint under Node 24.19.0. The reviewer additionally used TEMP-only mutations:
halved/doubled node limits and restoration of alias double-charge were detected;
the unmodified control passed. Neither reviewer changed source.

The three-file repair charges the already-reserved alias root once while charging
its expanded descendants. Arithmetic fixtures independently fix 131072/131073
boundaries; hostile children preserve accessors/symbols and other invalid values.
Call-count instrumentation distinguishes capture (0/0), projection (1/0), catalog
(1/1) and successful traversal. Earlier genuine HRO substitution, retained-owner,
byte ownership, byte-budget, refusal and provenance findings remain closed.

Integration e499590fa059896d123fd97eefbef60ae5881941 merges accepted main727c055,
B1 StageF60e7c15 and separately approved cache dispositionbf56c08. Runtime source
has no merge conflict. Documentation conflicts retained historical checkpoints
and the later superseding checkpoint. Separate combined review/checks are required
before PR and merge; source approval does not waive them or the live HRO exit.

## Combined acceptance — e499590 / cae2e19

Independent PMC reviewer approved integrated e499590 after serial Node24.19
checks: hybrid53, full routing-policy suite, readers71 and mutation-scope44;
all four package typecheck/lint commands passed. The retained routing output was
truncated, so no independently confirmed routing test count is asserted here.
Actual D19 passed21 packages/199 source files/zero unruled instances. Source/tests
match7133; accepted owners matchmain727. Cache disposition remains held, not
implemented. Documentation-only approval appendixcae2e19 was separately reviewed
and approved without repeating unchanged suites. All native check exits were0.
Remote PR checks and merge are still required; the overall HRO exit remains open.
