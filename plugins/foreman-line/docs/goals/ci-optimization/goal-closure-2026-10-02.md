# ci-optimization — Goal Closure Record (2026-10-02)

**Exit criterion (charter): MET.** Both parcels closed with workflow validation, targeted behavioral checks, two-or-more resolved reviews each, live CI evidence, and completion reports; CI-P2 additionally proved CI-P1's reuse behavior survives the sharded workflow — live.

## Parcel closures

| Parcel | Merged | Evidence |
| --- | --- | --- |
| CI-P1 — Safe Documentation-Only Push Reuse | PR #124 (`91d708b`), Stage F in #125 (`81f6b6d`) | 8 live records incl. 2× `reuse` (sweep skipped, ~2min vs 10m41s) and the falsifiable negative; 5 review sessions; 3 reworks; 138/138 tests |
| CI-P2 — Deterministic Full-Sweep Sharding | PR #128 (`ebebea1`), Stage-F completion in #129 (`4cae749`) | green sharded seed (4 waivers bound live), AC6: elapsed **23m52s vs 34.59-min baseline (−31%)**, runner-minutes +8.7 explicitly accepted; **AC7 reuse: zero shard jobs, 45.6s**; 5 review sessions + diagnosis; 6 rework rounds; 279/279 tests; A2 placements 1–12 |

## The record's own defect (closed honestly)

The CI-P2 Stage-F move commit `7e0735a` shipped its done-spec with incomplete lifecycle frontmatter despite its title; the spec-linter corpus pins caught it at the merge, main reddened at `ebebea1`, and R20 (`c5ca76d`, PR #129) completed the move with zero test/fixture/inventory changes (mutation-proven). The coordinator's closure check missed the tell — see lesson #50.

## Lessons ledger (#45–#50)

#45 dead-seam class ("wired in name only") · #46 measured read-sweep for validation-excluding classifiers · #47 pwsh multi-command exit codes · #48 value pins measured where they run (variance named, not averaged) · #49 waivers bind failure identity, not counts · #50 (below).

**Lesson #50 — a rename commit that claims content changes must show deletions.** The Stage-F commit's diff was "33 insertions(+), 0 deletions" while its message claimed a `status:` change and a new field — a modified line is a deletion plus an insertion, so zero deletions proved the content change never staged. Closure checks verified file counts and rename shape but not diff shape. Verify the SHAPE of a diff against what the commit CLAIMS (a claimed modification must produce deletions; a claimed addition must produce insertions) before accepting any closure.
**Disposition:** narrative coordinator discipline + this record; OPEN install candidate: the coordinator's closure checklist in the carryover/COORDINATOR-PATTERN at next touch.

## Follow-ups and check disposition

The earlier U1 version-pin note is withdrawn: `validate-versions.js` filters `git describe` to numeric version tags, so it excludes `u1-verifier-pin`. At this PR head the selected version is `0.6.9`, matching all manifests; `test-plugin-install` passed on this commit (run `37118852140`).

1. **Waiver packages:** `authority-registry` (R31 drift + 32/30 CI-env members), `bypass-outage-harness` (FK-P17 spec missing + mutationScope typing + CTL gates), `kernel-lease` (FK constraint + biome + the CN-01..CN-05 race family) → foreman-kernel line; `jev-decisions` (6× LEGACY_EXECUTION_RETIRED) → JEV line. Waived entries self-expire on signature divergence; removal is the next runner-touching parcel's Stage-F bookkeeping.
2. **OQ3:** dropping/filtering the `on: push` duplicate runs remains the largest remaining CI-waste lever (out of charter scope).

## Residuals (accepted, named in their records)

A-Q3 canary masking (detection-only) · shape-pin limits (inverted comparisons) · `docs/Specs*` case variant (closed by D-Q2/A2-8) · degenerate `head_sha` null · surface-and-ratify variance loop (placements 11/12 named residuals) · trust boundary (PR author controls the gate's code — stated in-spec) · waived-killed-output truncation residual (if ever applicable).

## Cleanup

Parcel worktrees `C:\Repos\foreman-line-cip0/1/2` removed at closure (branches kept as merged provenance: `feat/foreman-line-CI-P1`, `feat/foreman-line-CI-P2`, `demo/ci-p1-reuse-evidence`, `ci-optimization/integration`). Goal records complete in `docs/goals/ci-optimization/`.
