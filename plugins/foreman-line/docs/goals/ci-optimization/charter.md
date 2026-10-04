# Charter: Plugins CI Cost Reduction

**Status:** Ratified 2026-09-30 — developer directive "Read and implement charter.md"; decision list and standing authorizations recorded in `gate-1-ratification-2026-09-30.md`  
**Repository:** `m0r6aN/agent-skills` — historical identifier `kaseya-one-productivity-tools` (corrected at coordinator lint 2026-09-30, `ci-optimization-lint-2026-09-30.md`)  
**Primary surface:** `.github/workflows/foreman-line-ci.yml` + `scripts/foreman-line-ci.mjs` (+ `scripts/foreman-line-ci.test.mjs`) — corrected at coordinator lint 2026-09-30; `.github/workflows/plugins.yml` exists in no git ref

## Objective

Reduce unnecessary test execution and full-sweep wall time while preserving merge-gate integrity and complete package coverage. Measure improvements against a recorded baseline; do not assume a specific runtime or cost reduction.

## Invariants

- Preserve PR-wide classification. Ordinary documentation remains docs-only; governed specifications retain their validation requirements.
- Reuse results only when verified passing evidence covers the current test-relevant inputs and merge context. A docs-only push alone is insufficient.
- Missing, stale, incompatible, or unverifiable evidence triggers normal validation.
- Preserve the existing required check’s identity and verify compatibility with branch protection.
- Both parcels are elevated risk because they change merge-gate behavior. Each requires two independent reviews.

## Proposed Parcel 1: CI-P1, Safe Documentation-Only Push Reuse

**Purpose:** Avoid repeating successful validation when a new push changes only ordinary documentation.

**Scope:** Classification and evidence-based reuse within the existing workflow.

**Acceptance criteria:**

1. Record current behavior and distinguish docs-only PRs from docs-only pushes to mixed PRs.
2. Permit reuse only when a prior successful run has equivalent code, specifications, workflow, dependency inputs, and merge context.
3. Fall back to normal validation for relevant changes, failed or pending prior runs, unusable history, or evidence uncertainty.
4. Emit the compared revisions, reuse decision, and source run. The current head’s required check must explicitly establish success.
5. Demonstrate eligible reuse and fallback cases through local logic checks and live CI evidence.

**Reviews:** Gate integrity and evidence validity.

## Proposed Parcel 2: CI-P2, Deterministic Full-Sweep Sharding

**Purpose:** Reduce elapsed test time by distributing the full package sweep across bounded parallel jobs.

**Scope:** Dynamic package discovery, shard generation, test execution, and final aggregation.

**Acceptance criteria:**

1. Discover eligible packages dynamically, excluding dependency directories.
2. Assign every discovered package to exactly one shard using deterministic ordering and a bounded shard count.
3. Reconcile discovered and executed package identities, detecting omissions and duplicates.
4. Preserve dependency installation and lint coverage. Full dependency installation per shard is acceptable initially.
5. Use one final required check that fails on discovery errors, missing coverage, shard failures, cancellations, or unexpected skips.
6. Demonstrate shard execution and aggregation in live CI. Compare elapsed time and runner minutes with the baseline.

**Reviews:** Gate aggregation and package coverage.

## Sequence and Closure

Shape both parcels together. Build and merge CI-P1 first, then rebase and implement CI-P2 because both modify the same workflow.

Each parcel closes with workflow validation, targeted behavioral checks, two resolved reviews, live CI evidence, and a completion report. CI-P2 must also prove CI-P1’s reuse behavior remains valid under the sharded workflow.