# ci-optimization — coordinator state (rolling; update at every transition)

**Owner:** the `/goal` coordinator session started 2026-09-30 by "Read and implement charter.md". One goal, one coordinator; transfers only at parcel boundaries via `loop-directive.md`'s ownership block.

## Queue position
- [x] Stage Zero: coordinator lint (`ci-optimization-lint-2026-09-30.md`), Gate 1 ratification (`gate-1-ratification-2026-09-30.md`, incl. RS-2.1 Gate-3 correction), charter identifiers corrected.
- [x] Plan adversarial review (`PlanReview` session) + triage (`plan-review-findings.md`, F1–F10; no Gate 1 re-open; F3/F4 flagged to developer).
- [x] Loop directive written (`loop-directive.md`).
- [x] Shaping both parcels complete 2026-09-30 (`ShapeCIP1` 34m55s, `ShapeCIP2` 45m50s + coordination pass; specs byte-consistent on the SHARED INTERFACE; charter-AC mapping tables in both).
- [x] Coordinator rulings: **Amendment A1** (`ci-p1-amendment-a1-2026-09-30.md`) — OQ1 safe ruling, reuse only on `pull_request`-class runs, push-class = full-sweep canary.
- [x] CI-P1 builder (`BuildCIP1`, 1h8m) COMPLETE 2026-09-30: 5 commits on `feat/foreman-line-CI-P1` (`e7d7cb9` A1×10 placements → `0d4c84c` core → `e4d997a` tests → `daeb236` workflow → `a45a906` rule-0 ordering fix). Closure check on disk PASSED (4 Allowed Files only; runner byte-stable sha256-verified; clean tree). Deterministic pass PASSED (node v24.7.0; ci-reuse 90/90, runner harness 17/17 — coordinator's own run). Known flags: D3 stale "19" prose, D4 degenerate head_sha null, D5 reason labels — accepted as documented.
- [x] Dual reviews COMPLETE 2026-09-30 (`ReviewCIP1A` 43m gate-integrity verdict incorrect; `ReviewCIP1B` 45m evidence-validity verdict incorrect) — **convergent BLOCKER: ordinary-set under-detect** (README + 3 goal-doc JSONs are swept-test inputs but classify docs-only; exploit-probed by both). Plus emit-order defect (major) and GITHUB_OUTPUT fail-open (minor). Triage: `ci-p1-review-findings-2026-09-30.md`; fixes R1–R3 + R4 canary note = amendment `ci-p1-amendment-a3-2026-09-30.md`.
- [x] `ReworkCIP1` COMPLETE (1h26m): `bd3b2e0` A3 ×6 placements (spec-only) → `64aefcd` R1 shrink + 23-path measured READERS set → `6e806a5` R2 emit-before-sweep + R3 fail-closed + **S1 sweep-beyond (live CLI never wired CI_REUSE_EVIDENCE → verify always over-falled; reuse saving was dead in production wiring)** → `761a8eb` +43 tests → **133/133**. Closure check PASSED (3 Allowed Files, clean, runner hashes pinned). Deterministic pass PASSED (coordinator: 133/133 + 17/17). All 6 Step-0 flags ruled/recorded. Read-sweep: zero readers of ordinary-classified paths (23 measured readers all code-by-shape).
- [x] Round-2 reviews: `ReviewCIP1C` (verdict incorrect — harness-step exit-code silent-green, major) + `ReviewCIP1D` (verdict CORRECT — read-sweep survived falsification; P3 verify pin-trust). Triage: `ci-p1-review-findings-round2-2026-09-30.md` (both → fix).
- [x] Rework 2 (`34b26d9` R5, `f687614` R6, `3714b77` +5 tests → 138) + round-3 focused review `ReviewCIP1E` (R5 wiring + R6 verified correct under real pwsh/probes; one finding R3-F1: R5 pin bound tokens not semantics) + rework 3 (`a9e004a`, E's verified predicates; 4-mutation matrix reproduced). Chain accepted on closure + deterministic passes #3/#4 (138/138 + 17/17).
- [x] **CI-P1 local chain COMPLETE** — completion record: `ci-p1-completion-record-2026-09-30.md` (commit inventory, chain table, AC status, demo plan, named residuals).
- [ ] **NOW: Gate-3 prep** — paper-trail sync commit + push `feat/foreman-line-CI-P1` + PR to `main` (body: `ci-p1-pr-material.md`). **HELD: AC6 live demos + human merge** (red-base stop-report). **Next loop action: developer greens the base → run the 7-push demo plan → human merge → Stage F → CI-P2.**
- [ ] **HELD in parallel:** `stop-report-red-base-2026-09-30.md` open — demos + merges wait on the developer (green `main` = option A, or dev-line base = option B). CI-P2 after CI-P1 closes.
- **Paper-trail sync debt at merge prep:** the worktree's A1 record copy (commit `bc609ec`) has 5 placements; the landed spec has 10 (rulings 6–10 + E2/E4/E8/E9/E10 derivations live in the main-checkout `ci-p1-amendment-a1-2026-09-30.md`). Re-copy goal records into the PR's paper-trail commit.
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
