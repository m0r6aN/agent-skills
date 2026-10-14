# FCA-P10 review triage (coordinator, 2026-10-13)

Two independent frontier reviews of e11edd05: both APPROVE, 0 blocker, 0 major.

| Finding | Source | Disposition |
|---|---|---|
| AC4 "R4a above R3" mutation yields 0 failures | A, B | Accept-as-documented: equivalent mutant (R4a's `no sidecar` condition is exclusive with R3's `projectedJoin`); builder's double-mutation (swap order + drop sidecar) fails 6 tests |
| Evidence file mutation counts differ (M5 4 vs 2, M6 1 vs 2) | A | Informational: both >= 1; AC4 met |
| browser-reconcile comment wording | A | Informational |
| AC7 test is unit-level in not-started.test.ts | B | Accept: real-Chromium coverage exists in browser-reconcile.test.ts |
| reconcile.ts `stale-abandoned` extended to `not-started` | A, B | Accept: required by spec AC9 (5 outside-record parcels keep findings); `never-started` fires first for the 15 true never-started parcels |

Coordinator closure/deterministic pass: npm test 561/561, typecheck clean, lint clean (node v26.8.2). Rework history: wrong-shaped AC3/AC4 fixtures and an unmeasured AC9 were caught at closure and reworked twice; the first completion claim ("559 pass") was only true with sibling node_modules linked.
