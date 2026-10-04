# STOP-REPORT — red base blocks CI-P1's live demos and merge (2026-09-30)

**Condition:** loop directive stop valve **F9** ("CI-P1 cannot demonstrate eligible reuse because no verified green prior run can be established for reasons outside the parcel surfaces"). Fired at CI-P1 builder dispatch time. **Never paper over a red base** — this report replaces any workaround.

**What the loop does while this is open:** reversible upstream work CONTINUES per COORDINATOR-PATTERN lesson #27 (CI-P1 builds and receives its two adversarial reviews in the worktree). What is HELD: the live-demo acceptance evidence (AC6) and every merge step. The developer can act on this in parallel.

## Evidence (all measured 2026-09-30, commands/API recorded)

1. **`origin/main` @ `e5dce4d03c4b83b8646c9517967c1554204e2db3` is red at the sweep.** Live run 36487016849 (`push`, same SHA as the pinned parcel base) ends with the runner's own summary table: **13 of 20 packages have failing checks** —

   | failing at e5dce4d | checks |
   | --- | --- |
   | approval | test fail, typecheck fail |
   | contract-readers | test fail |
   | dispatch | test fail, typecheck fail, lint fail |
   | foreman-config | test fail, typecheck fail |
   | hybrid-routing | test fail, typecheck fail |
   | mutation-scope-guard | test fail |
   | projection | test fail, typecheck fail |
   | registration | test fail, typecheck fail |
   | routing-policy | test fail, typecheck fail |
   | shaping | test fail, typecheck fail |
   | skill-injection | test fail |
   | spec-linter | test fail |
   | verification | test fail, typecheck fail |

   Green at e5dce4d: contracts, integration, permission-profiles, receipts, role-authority, schema-scaffold, worker-envelopes. Sample causes (from the same log): `verification` scaffold test pins `@biomejs/biome` `2.5.14` but the manifest has `2.5.3`; `verification` typecheck fails on missing `routing-policy` exports (`shadowRouteSchema`, `TransportRequirements`, …) and `pluginRoot` not in `HarnessInput`/`DispatchOptions` — mid-refactor drift, **all outside the CI-parcel surfaces**.

2. **`origin/dev` @ `e25d6a517ea69853c92aefcd52dd4a8ba4d9e93b` (PR #122's head) is also red.** Both its runs fail: push run 36513875441 and pull_request run 36513899142 (2026-09-29T02:42–02:43). The immediately preceding dev head **`c06c1d50ef97b25f2bc1e62d5c84325bc266c9b0` is the ONLY green run in the last ~100** (run 36513723913, 2026-09-29T02:40:49Z). The break entered with `e25d6a5` ("Merge pull request #121 from m0r6aN/reconcile/refresh-actions").

3. **PR #122 state:** head `e25d6a5`, `MERGEABLE`, `mergeStateStatus: BEHIND`, no review decision. Merging it as-is would put a red state on `main`.

4. **Why this blocks CI-P1 specifically:** AC6(a) requires a verified green prior run before an eligible-reuse demo. The reuse decision (spec AC3) requires `conclusion: success` on a prior run at five-class-equivalent hashes — and CI-P1's own pushes are test-relevant (workflow + scripts classes change), so the first run on the parcel branch takes the fallback, runs the full sweep, and must go green to seed the lineage. With 13/20 packages red in the swept tree, no green run can exist on any branch cut from the pinned base. The same red sweeps void Gate 3 (required contexts would be red on the head).

## What the developer must do (pick one; recommendation first)

- **A (recommended) — land a green integration state on `main`.** The fixes live in your local `dev` (32 unpushed commits) and/or your uncommitted working-tree work (the failure-capture WIP and package edits). Push the fixed line, get `foreman-line-ci` green on it (the 19-package dev sweep was green at `c06c1d5` — the fix set is yours to shape), and merge it to `main` (PR #122 refreshed, or its successor). Then say "resume" — CI-P1 re-syncs to the green `main` (its own pre-PR protocol), the demos run, and the goal proceeds exactly as chartered. This also resolves the 19-vs-20 `hybrid-routing` membership question naturally (your dev line deletes it).
- **B — authorize basing the parcels on the dev line** (green `c06c1d5` or your pushed fixed dev) instead of `origin/main`, accepting the F1 entanglement protocol (parcel PRs carry or stack on dev's commits until #122 lands; the accidental-merge-of-WIP risk the plan review named stays open). One sentence of authorization amends the loop directive's topology.
- **C — build-only now, demos later.** CI-P1 builds and reviews now (already dispatched); closure, demos, and merge simply wait until A or B lands. This is the default if you say nothing — but the goal cannot CLOSE in this state.

## Out of scope unless you expand it

Fixing the 13 red packages at `e5dce4d` inside this goal is a charter scope expansion (Gate 1 authorization #1 covers exactly two parcels). The charter's Invariant 1 ("preserve merge-gate integrity") is also why the gate should not be made green by waivers or exclusions — a pinned exclusion under standing constraint #13 is available only for CI-P2's newly-eligible packages, never for the currently-swept set.
