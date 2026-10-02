# CI-P2 — live demo log (AC7 + AC6, PR #128 lineage)

**Seed (run `37017752295`, head `0265c2f`): GREEN** — the full sharded gate passes live on the 27-package discovered set:

| Job | Result |
| --- | --- |
| gate | ✓ 29s — decide → resolve (R1 no-fallthrough), five C12 outputs, shard layout |
| sweep (0) | ✓ 23m52s — `authority-registry/test` **waived** (run-then-waive, CI-shape closure placement 12) |
| sweep (1) | ✓ 12m25s |
| sweep (2) | ✓ 6m15s — `kernel-lease` test+lint **waived** (CN-01..CN-05 five-flake closure) |
| sweep (3) | ✓ 5m3s — `bypass-outage-harness` test+typecheck + `jev-decisions/test` **waived** |
| aggregation (`test`) | ✓ 33s — 27 identities reconciled; expected-skip exactly the 4 placement-9/10/12 entries; verdict green |
| `integration-report` | ✓ 2s — mirrors, unmasked |

**AC6 closing comparison (queue-separated, shared methodology):**

| Metric | Serial baseline (barrier-form local pass) | CI-P2 sharded (live, run 37017752295) | Verdict |
| --- | --- | --- | --- |
| Coverage | 27 × {test,typecheck,lint} + 27 installs | identical (aggregation table correct) | equal ✓ |
| Elapsed sweep wall | 34.59 min as-measured (two 600s cap cells) / ~40 min cap-corrected (authority-registry true completion ~25m) | **23m52s** (max shard) | **DECREASE ✓** (−31% vs as-measured, −40% vs corrected) |
| Runner minutes (Σ job durations) | ≈34.6 as-measured / ≈40 corrected | ≈48.7 (47.6 shards + gate/test/report) | **+8.7 vs corrected — QUANTIFIED and EXPLICITLY ACCEPTED** (the AC4-accepted per-shard full install × 4 + gate/aggregation overhead) |
| Billable (windows ×2) | ≈69.2 / ≈80 | ≈97.4 | +17.4 accepted |

Structural notes (honest): the cost-aware assignment (placement 11b) separates the two heaviest suites (straggler 23m52s vs round-robin's 37m12s); the elapsed win is bounded by `authority-registry`'s ~25m waived-suite completion inside shard 0 — the single largest lever left is that suite's own runtime (owned by the foreman-kernel line via the waiver follow-ups). Runner-minutes rise is the priced parallelism; it is reported, never silent.

## Demo case records (this PR's lineage)

- **Seed / fallback (test-relevant code pushes):** `decision: fallback` with `fallback_reason: test-relevant-change` (or `no-prior-run`/`prior-run-inconclusive` per lineage state) — full sharded sweep, aggregation reconciles 27, four waivers bind. (Run `37017752295` = the green seed; the label-cap commit's run = the post-seed test-relevant fallback.)
- **AC7 reuse (docs-only push after the green run):** expected `decision: reuse`, `source_run` = the green test-relevant run, **ZERO sweep jobs instantiated** (proven by the run's job list), verify green, both required contexts green. (Record appended below.)
- **A1 canary:** the push-class twin of each = `event-class-ineligible` + full sharded sweep (detection-only per A-Q3).
- **Fallback record (test-relevant merge, run `37021485992`, head `c14c3b0`, pull_request-class):** `decision: fallback` (delta = merged main: `u1-verify.yml` workflow class + specs rename specifications class + ordinary docs) → full sharded sweep GREEN (s0 23m35s / s1 13m39s / s2 7m49s / s3 3m7s, aggregation ✓, `integration-report` ✓). This green PR-class run is the reuse source for the next push.
- **AC7 reuse record (this commit, docs-only): expected `decision: reuse`, `source_run` = `37021485992`, five-class hashes equal (this delta touches only `plugins/foreman-line/docs/goals/ci-optimization/**` = ordinary), **ZERO `sweep (N)` jobs instantiated** (proven by the run's job list), verify ✓, both required contexts green.** → **CONFIRMED (run `37024586041`, head `cfaee2a`, pull_request-class):** `ci-reuse decision=reuse fallback_reason=null`; `source_run: {run_id: 37021485992, conclusion: "success"}` with equal five-class hashes; `sweep` job **SKIPPED (0s)** — zero shard jobs instantiated; `Verify reuse evidence` ✓; `test` ✓ 24s (shard download skipped); `integration-report` ✓; wall **45.6s** vs 25min full sweep. **The charter's closure clause (CI-P1 reuse survives the sharded workflow) is live-proven.**
