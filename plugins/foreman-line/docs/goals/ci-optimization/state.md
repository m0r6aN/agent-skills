# ci-optimization — coordinator state (rolling; update at every transition)

**Owner:** the `/goal` coordinator session started 2026-09-30 by "Read and implement charter.md". One goal, one coordinator; transfers only at parcel boundaries via `loop-directive.md`'s ownership block.

## Queue position
- [x] Stage Zero: coordinator lint (`ci-optimization-lint-2026-09-30.md`), Gate 1 ratification (`gate-1-ratification-2026-09-30.md`, incl. RS-2.1 Gate-3 correction), charter identifiers corrected.
- [x] Plan adversarial review (`PlanReview` session) + triage (`plan-review-findings.md`, F1–F10; no Gate 1 re-open; F3/F4 flagged to developer).
- [x] Loop directive written (`loop-directive.md`).
- [x] Shaping both parcels complete 2026-09-30 (`ShapeCIP1` 34m55s, `ShapeCIP2` 45m50s + coordination pass; specs byte-consistent on the SHARED INTERFACE; charter-AC mapping tables in both).
- [x] Coordinator rulings: **Amendment A1** (`ci-p1-amendment-a1-2026-09-30.md`) — OQ1 safe ruling, reuse only on `pull_request`-class runs, push-class = full-sweep canary.
- [ ] **NOW: CI-P1 builder dispatched** (build+reviews proceed; **demos + merges HELD** — `stop-report-red-base-2026-09-30.md` is open: both remote integration lines red (main @ e5dce4d = 13/20 packages failing; dev @ e25d6a5 red; only green run in ~100 = dev @ c06c1d5). Developer must green `main` (option A) or authorize a dev-line base (option B). Awaiting developer action in parallel with the build.)
- [ ] CI-P2 (rebase + build) after CI-P1 closes.
- [ ] Coordinator lint both specs (lesson #33 AC diff) → Gate 2 dispatch CI-P1 builder → 11-step loop → git-step merge into `ci-optimization/integration` + PR → CI-P2 (rebase first) → goal exit report.

## Pinned facts
- Cut base: `origin/main` @ **`e5dce4d03c4b83b8646c9517967c1554204e2db3`** (PR #120 merge) — cut-SHA fixed 2026-09-30 at integration-worktree creation; behavior records and equivalence hashes pin this SHA. Integration worktree `C:\Repos\foreman-line-cip0`, branch `ci-optimization/integration` (created 2026-09-30; benign Windows block-clone fallback warning on `.agents/plugins/marketplace.json`, plain checkout used).
- Required contexts: `test`, `integration-report` (ruleset `main-pr-gate` id 22369510, strict). Gate 3 main-merge is human-owned (RS-2.1 / SPEC-CONVENTION §8.4).
- Developer WIP on `scripts/foreman-line-ci.{mjs,test.mjs}` is uncommitted and developer-owned — never land/drop/implement.

## Dispatch record
- 2026-09-30 — PlanReview (adversarial plan review): completed, 10 findings, verdict incorrect-as-written → all triaged (7 fix, 1 accept-as-documented+fix, 1 accept, 1 informational).
- 2026-09-30 — ShapeCIP1, ShapeCIP2 (shaping agents, parallel per charter "shape both parcels together"): dispatched, pending.

## Open stop-and-report candidates (from loop directive)
F4 baseline-red discovery at CI-P2 pre-flight · F9 no green prior run for the reuse demo · unresolvable PR #122 conflict · any human Gate-3 merge.
