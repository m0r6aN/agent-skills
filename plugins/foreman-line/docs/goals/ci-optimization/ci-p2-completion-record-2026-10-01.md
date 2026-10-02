# CI-P2 — Completion Record (2026-10-01) — local chain complete; live demos at Gate 3

**Parcel:** CI-P2 — Deterministic Full-Sweep Sharding. **Branch:** `feat/foreman-line-CI-P2` (11 commits on `543ab44`). **Worktree:** `C:/Repos/foreman-line-cip2`.

## Commit inventory (oldest first)

| SHA | Content |
| --- | --- |
| `2b59f32` | paper trail: goal records + CI-P1 completion evidence |
| `190dfbe` | A2 placements 1–8 (A1/A3 propagation + Allowed-Files widening + D-Q2), spec-only, first and alone |
| `de4c720` | A2 placement 9 — waived-exclusion set (developer decision B) |
| `5688427` | C9 classification shrink + D-Q2 case-insensitive guard (widened scope, classification-only) |
| `9bace66` | harness rewrite: discoverPackages/assignShards/runShard/reconcile/waiverFor/WAIVED_EXCLUSIONS + shard/aggregate CLI |
| `1c0f77f` | AC8 harness tests (17→64) |
| `6524dbc` | sharded workflow: gate → sweep[0..3] → aggregation(`test`) → `integration-report` |
| `ca03e06` | mutation-proof hardening (M2 gap closed) |
| `7270617` | rework-2: v3.1 failing-set value axis + lstat-first discovery |
| `0e80142` | rework-2 tests: R7 set semantics, R8 workflow text pins, R9 golden real-output fixtures, R10 discovery contracts |
| `64a4cc6` | rework-3: measured-equality slack closure, CN-06 deterministic + range tightening, verbatim golden TAP, restored test sides |
| `6287b44` | A2 placement 10 — value-axis alignment (record alignment) |

## Verification chain

| Step | Result |
| --- | --- |
| Shaping | `ShapeCIP2` (46m) + cross-spec coordination with `ShapeCIP1`; measured 19/20/27 inventory; 222-edge sibling-import barrier evidence |
| F4 pre-flight valve | fired honestly: 23/27 green, 4 never-gated packages baseline-red at both node versions → developer chose B (pinned exclusions, `stop-report-cip2-valve-2026-10-01.md`) |
| Build | `BuildCIP2` Step-0 gate (A2 ×9 placements ruled through it), 209/209 at build end |
| Reviews round 1 (independent ×2) | `ReviewCIP2A` (gate aggregation) + `ReviewCIP2B` (package coverage): convergent **blocker** (verify-crash fails open) + convergent major (waivers didn't pin counts) + 4 minors. Coverage itself verified sound (27 discovered, 7/7/7/6, barrier preserved). Triage: `ci-p2-review-findings-2026-09-30.md` |
| Rework 1 | R1 two-layer fail-closed, R2 count-bound waivers, R3 exact argv restored, R4 discovery floor, R5 unjustified exclusions dropped, R6 single shard-count source → 235/235 |
| Focused review (round 2) | `ReviewCIP2C` (1h05m): R1 genuinely closed at the script layer; but R2's exact pins over-fit nondeterministic output (racy failTotal 75↔76; biome truncation marker) + YAML-wiring untested + tautological pin-value tests |
| Rework 2 | v3.1 value axis (failingSet + named flakes + measured-variance totals), R8 workflow text pins, R9 golden real-output fixtures, R10 lstat-first → 251/251; ≥10-run variance measured per waived check |
| Value-axis review (round 3) | `ReviewCIP2D` (1h17m): slack exploit (name-collision inside total slack — 3 probes), synthetic GOLDEN_TAP, dropped test sides |
| Rework 3 | measured equality `failTotal === |distinct failing names|` (kills all 3 probes), verbatim golden TAP feeding the shipped pin, restored sides (5 survivors each flip) → 262/262 |
| Deterministic passes (coordinator) | 209/209 · 235/235 · 251/251 · 262/262 (node v24.7.0, `node -v` first, every stage) |
| Closure checks (on disk, before every re-run) | commit inventories + scope + clean trees verified at every stage |
| Placement 10 | value-axis record aligned to the golden-pinned `WAIVED_EXCLUSIONS` (the value authority) |
| Live CI evidence | **HELD for the Gate-3 demo runs** (plan below) |

## AC6 baseline — barrier-form serial pass (measured 2026-10-01, base `543ab44`+A2 commits, node v24.7.0 / npm 11.6.2, explicit node+npm-cli invocation)

| package | install | test | typecheck | lint |
| --- | --- | --- | --- | --- |
| approval | pass 4.6s | pass 12.1s | pass 1.5s | pass 0.7s |
| authority-registry | pass 4.3s | FAIL(ETIMEDOUT) 600.1s | pass 1.0s | pass 1.2s |
| bypass-outage-harness | pass 4.5s | FAIL(1) 34.1s | FAIL(1) 1.9s | pass 0.9s |
| contract-readers | pass 3.3s | pass 5.8s | pass 1.1s | pass 0.7s |
| contracts | pass 4.7s | pass 1.5s | pass 0.9s | pass 0.7s |
| dispatch | pass 52.6s | FAIL(ETIMEDOUT) 600.1s | pass 3.6s | pass 0.7s |
| foreman-config | pass 4.1s | pass 7.8s | pass 1.0s | pass 0.7s |
| hybrid-routing | pass 4.6s | pass 15.6s | pass 1.0s | pass 0.6s |
| integration | pass 4.6s | pass 5.8s | pass 1.4s | pass 0.6s |
| jev-decisions | pass 0.7s | FAIL(1) 0.8s | pass 0.4s | pass 0.4s |
| kernel-contracts | pass 3.9s | pass 2.0s | pass 1.1s | pass 0.7s |
| kernel-lease | pass 3.7s | FAIL(1) 65.2s | pass 0.9s | FAIL(1) 0.8s |
| kernel-state | pass 4.1s | pass 6.3s | pass 1.0s | pass 0.9s |
| mutation-scope-guard | pass 5.7s | pass 32.4s | pass 0.9s | pass 0.6s |
| permission-profiles | pass 3.6s | pass 12.1s | pass 1.1s | pass 0.6s |
| projection | pass 4.0s | pass 3.0s | pass 1.1s | pass 0.7s |
| receipts | pass 4.8s | pass 10.9s | pass 0.8s | pass 0.7s |
| registration | pass 8.7s | pass 16.4s | pass 1.0s | pass 0.6s |
| role-authority | pass 3.6s | pass 1.7s | pass 1.1s | pass 0.8s |
| routing-policy | pass 3.8s | pass 15.4s | pass 1.0s | pass 0.8s |
| schema-scaffold | pass 3.8s | pass 1.3s | pass 1.0s | pass 0.5s |
| shaping | pass 4.8s | pass 2.4s | pass 1.0s | pass 0.8s |
| skill-injection | pass 3.4s | pass 11.6s | pass 1.0s | pass 1.2s |
| spec-body-compiler | pass 4.5s | pass 1.6s | pass 0.9s | pass 0.8s |
| spec-linter | pass 4.9s | pass 18.2s | pass 1.0s | pass 0.6s |
| verification | pass 5.4s | pass 373.7s | pass 0.8s | pass 0.8s |
| worker-envelopes | pass 4.8s | pass 1.6s | pass 0.9s | pass 0.7s |

**TOTAL serial wall: 2075.5s (34.59 min)** = install phase 165.6s (2.76 min) + checks phase 1909.9s (31.83 min). Notes: the two 600s cap cells inflate the wall (both later cleared/node-version-shaped — `dispatch` green at CI's 24.19.0; the cells stay in the as-measured baseline); `verification`'s 373.7s dominates the checks phase. Discovered order (code-point): approval, authority-registry, bypass-outage-harness, contract-readers, contracts, dispatch, foreman-config, hybrid-routing, integration, jev-decisions, kernel-contracts, kernel-lease, kernel-state, mutation-scope-guard, permission-profiles, projection, receipts, registration, role-authority, routing-policy, schema-scaffold, shaping, skill-injection, spec-body-compiler, spec-linter, verification, worker-envelopes → `assignShards(·, 4)` = 7/7/7/6 round-robin.

## Gate-3 demo plan (live, on the CI-P2 PR)

1. **Sharded full sweep + aggregation:** the PR's seed run executes 4 shard jobs + aggregation; the four waived packages run-then-waive (live proof of placement-9/10 semantics on real output); both required contexts green; capture shard job durations + aggregation → the AC6 comparison vs the 34.59-min serial baseline (elapsed MUST decrease at equal coverage; runner minutes Σ job durations, windows 2× multiplier stated, explicitly accepted).
2. **AC7 reuse preservation:** a docs-only push after the seed's green → `decision: reuse`, **ZERO shard jobs instantiated**, verify green, both contexts green; push-class twin = `event-class-ineligible` sharded canary.
3. **Fallback completeness:** a test-relevant push → full sharded sweep again (aggregation reconciles 27 identities).

## Named residuals

1. Waiver entries are dated (2026-10-01 signatures); expiry-on-divergence re-gates automatically; removal bookkeeping is the next runner-touching parcel's Stage F. Follow-ups: `authority-registry`, `bypass-outage-harness`, `kernel-lease` → foreman-kernel line; `jev-decisions` → JEV line.
2. Where failing names don't parse (tsc/biome), the total range is the sole guard (stated in placement 10).
3. A2 record was truncated by a coordinator tool error and rebuilt the same day from the worktree copy + ruled texts (provenance note in the record; no text lost).
4. Serial baseline is a LOCAL measurement (node 24.7.0; `dispatch`'s 600s cell is version-shaped); the live comparison uses the shared queue-separated methodology.
