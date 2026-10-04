# CI-P1 — PR material (Gate 3 presentation; merge is human)

**PR:** `feat/foreman-line-CI-P1` → `main` (head SHA filled at push time). **Title:** `ci: CI-P1 safe documentation-only push reuse (evidence-based, default-deny)`.
**Status:** merge-ready EXCEPT live demos — the red-base stop-report (`stop-report-red-base-2026-09-30.md`) holds AC6's live evidence and the human merge itself (Gate 3 main/PR merges are human-owned per RS-2.1 / SPEC-CONVENTION §8.4).

## PR body (paste on open)

### What

Evidence-based reuse for documentation-only pushes to PR lineages in `.github/workflows/foreman-line-ci.yml`: a default-deny classifier (Markdown-only ordinary set, measured read-sweep exclusions) plus a GitHub-Actions-API + git-bytes evidence chain (five-class content-hash equivalence at platform-attested SHAs). A docs-only push after a verified green run reuses that run's verdict without re-sweeping; every uncertainty falls back to the full sweep. `push`-class runs always sweep (A1 canary, detection-only). Runner `scripts/foreman-line-ci.{mjs,test.mjs` byte-stable.

### Verification chain (every step green; evidence in `plugins/foreman-line/docs/goals/ci-optimization/`)

| Step | Result |
| --- | --- |
| Spec + amendments | `CI-P1-docs-only-push-reuse.md`; A1 (10 placements + 5 derivation rulings), A3 (6 placements) — coordinator-ratified, committed alone before code |
| Build | `BuildCIP1` 5 commits (`e7d7cb9..a45a906`); Step-0 gate held; 10 flags ruled |
| Closure checks (coordinator, on disk, before re-running) | Allowed-Files exact; runner sha256 `d28e28bf…`/`a50973b3…` pinned; clean trees |
| Deterministic pass #1 (coordinator) | node v24.7.0 — `ci-reuse` 90/90, `foreman-line-ci` 17/17 |
| Adversarial reviews (round 1, independent) | `ReviewCIP1A` (gate integrity) + `ReviewCIP1B` (evidence validity): convergent BLOCKER (ordinary-set under-detect, exploit-probed) + emit-order + fail-open findings → `ci-p1-review-findings-2026-09-30.md` |
| Rework 1 | `ReworkCIP1` 4 commits (`bd3b2e0..761a8eb`): A3 shrink + 23-path measured READERS set + emit-before-sweep + fail-closed + S1 sweep-beyond fix (dead reuse wiring); 90 → 133 tests grow-only; 7 mutation-proof families |
| Deterministic pass #2 (coordinator) | 133/133 + 17/17; runner hashes pinned before/after |
| Adversarial reviews (round 2, post-rework, independent) | `ReviewCIP1C` + `ReviewCIP1D`: round-one exploit re-killed; read-sweep claim survived independent falsification; one major (harness-step exit-code silent-green) + one P3 (verify pin-trust) → `ci-p1-review-findings-round2-2026-09-30.md` |
| Rework 2 | R5 harness-step exit propagation + R6 verify re-derives the scan (see completion record) |
| Focused review (round 3, R5/R6 delta) | see completion record |
| Live CI evidence | **HELD** — red-base stop-report (13/20 swept packages fail at `origin/main` @ `e5dce4d`; both remote integration lines red). The PR's own runs document the fallback path live (`decision: fallback` records + sweep). AC6 demos run once the base greens (demo plan in the completion claim: 7 ordered pushes with expected decisions/reasons). |
| Required contexts | `test` + `integration-report` report on every head in every mode (ruleset `main-pr-gate`); strict policy satisfiable |

### Gate notes for the human merge

1. Merge only after AC6's demo evidence exists (or explicitly waive demos in writing — charter AC5 would then need a recorded scope change).
2. Canary claims are detection-only: on one head GitHub's duplicate same-name context resolution is undefined (A-Q3); recorded in the closure evidence.
3. Out-of-scope follow-ups named for the developer: OQ3 (drop/filter `on: push` duplicate runs — the largest remaining structural waste), CI-P2's classification re-derivation (C9), `docs/Specs/` case-variant rule-text residual.
