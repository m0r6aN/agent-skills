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
