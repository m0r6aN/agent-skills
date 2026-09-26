# RCM-P1A implementation acceptance

Original frozen implementation: 81e3618514852777a89377c64cd5349067891343.
Spec blob: 906f91d5061826ab671d939d369b67bbf28175c6.
Both independent original reviews passed twenty focused and 419 full tests,
typecheck and lint; reviewer A approved, reviewer B identified two P2 defects.

1. Classifying an arbitrary thrown value with instanceof could itself throw
   for a revoked or prototype-trapping proxy, escaping the typed refusal.
2. Shared caller objects were captured again after leaving the active-cycle set,
   contrary to the contract's single-capture guarantee. No custody bypass was shown.

Coordinator accepted both within existing four-file scope. Repair Step 0 verified
the exact clean head and spec. RED reproduced both classes of defect; repair
uses identity-only internal refusal recognition and completed-capture memoization,
while still charging every expanded alias occurrence against bounds using owned
data. Active-ancestor cycle rejection remains separate from completed reuse.

Both fresh final reviews approved 4201ac4edf8069efa0857d9841341d62b2429648.
Each passed 27 focused tests, 426 full tests, typecheck, lint and spec validation.
Reviewer A passed 49 independent hostile assertions; reviewer B passed 108,
including exact 65,536 visits, arbitrary throws, shared captures, nested aliases,
cycles, storage/copy boundaries, exact six-field source declarations, digest/
sourceRef/inventory binding and actual reader/projector parity. Both verified
clean unchanged head and exact four-file original/three-file repair scope.

After PMC-P1a merged as 6ff38a3, its main branch merged without conflict into
the wrapper branch at de39306d2677d0042cff3308c8d87601cac5ee82. The public
barrel merged additively. Independent combined integration and complete remote
CI remain required; no wrapper merge or live execution is claimed yet.

## RCM-P1A Stage F closure — 2026-09-26

PR56 merged as e6daf7e8cd3bc7b7ae61f9646465f8cea60de2c9 after both independent
final reviews approved 4201ac4edf8069efa0857d9841341d62b2429648. Independent
combined integration passed 498 routing tests, typecheck, lint and spec validation;
the public barrel preserved the 75-export union. Complete remote twenty-package
CI passed at final PR head e23a9251b0365aeaf68302f36bb259a4a59a9ed3. The spec is
moved to done; original reviewed branches remain retained without destructive
cleanup. The wrapper confers no authority on caller-declared source evidence.

PMC-P1b now owns the next shared-file integration. The isolated RCM producer
may build concurrently but lands after the accepted projection. Live routing,
provider configuration and paid inference have not been activated.