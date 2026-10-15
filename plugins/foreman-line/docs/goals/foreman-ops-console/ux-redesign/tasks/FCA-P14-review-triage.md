# FCA-P14 review triage (coordinator, 2026-10-14)

Two independent frontier reviews of 38717c28, both REQUEST CHANGES; measurements produced by the reviewers (builder deferred AC9).

| Finding | Source | Disposition |
|---|---|---|
| "FCA-P10 bundled, route shape changed (`notStarted`)" blocker | A | Dismissed, reproduced: branch cut from main after P10 merged (`git merge-base --is-ancestor 82dbdac9 HEAD`); my review directive used the wrong baseline (d3f9a280) |
| `worktreeOutcome` fallback silent 'unknown' | B major | Fixed (rework 3); first fix added a `_prefetchMisses` response field, which violated AC3 route-shape, caught at closure and replaced by an in-process counter. Test is vacuous for the mutation (scenario has no worktree): accepted-as-documented |
| Health p99 outliers (406 ms; max 1.18 s) vs AC2 < 50 ms | A, B | Profiled in rework 3: synchronous fs in frozen projection libs. Ruled in spec: out of scope, open exit condition, follow-up FCA-P15 |
| Dedup cache key only `repoRoot` | A minor | Accept: single-config server |
| `writeFileSync` receipts in async spawn | A minor | Accept: unique receipt ids |
| Unhandled-rejection note on dedup `.finally()` | B minor | Informational |
| Sync twins retained | A, B | Accept: test seams, each justified in the evidence file |
| Aggregate latency | A, B | A: -34% aggregate; B: /api/goals -58%, signals -19%, decisions flat; AC9 >= 30% met on goals/aggregate per A |

Closure and deterministic pass (node v26.8.2): npm test 583/583 (baseline 561), typecheck clean, lint clean. Rework history: 3 reworks; wrong-shaped claims caught: "all others 0 sync" (false), deferred AC9, unmeasured claims, wrong evidence path, response-shape drift in the rework 3 fix.
