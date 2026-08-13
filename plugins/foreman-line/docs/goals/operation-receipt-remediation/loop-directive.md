# `/loop` Directive — Operation Receipt Remediation

## COORDINATOR OWNERSHIP — read before dispatching anything

> **Queue owner:** Codex task `019ff142-0b35-7040-98c2-e36420c5f77b`, ratified 2026-08-13. Exactly one Coordinator owns this goal. Ownership may transfer only at a parcel boundary through an explicit amendment to this block and a session handoff. If another live Coordinator claims this queue, or ownership is ambiguous, stop and report to Clinton Morgan; never assume.

**Initiative:** `operation-receipt-remediation`
**Control worktree:** `D:/Repos/agent-skills-worktrees/operation-receipt-remediation-20260812`
**Control branch:** `codex/operation-receipt-remediation-20260812`
**Private state:** `C:/Users/clint/.codex/visualizations/2026/08/11/019ff142-0b35-7040-98c2-e36420c5f77b/operation-receipt-coordinator/`
**Charter:** `plugins/foreman-line/docs/goals/operation-receipt-remediation/charter.md`
**Plan review:** `plugins/foreman-line/docs/goals/operation-receipt-remediation/plan-review-findings.md`
**State:** STOPPED — OR-P02 fired its second parcel tripwire on 2026-08-13; Wave 0 remains open. OR-P01 is paused at Step 0 without execution. Resume requires Clinton's ruling on a third OR-P02 verification attempt using verbatim `rtk proxy` command transport.

## Role

The Coordinator dispatches and consumes independent verification; it does not produce the verification evidence it accepts. Current repository state, the ratified amended charter, and the remediation directive outrank summaries. Every session reports unknown, partial, skipped, blocked, and not-applicable states honestly.

## Standing authorizations

1. **Gate 2 — GRANTED for exactly OR-P01 through OR-P22.** Dispatch occurs only after Gate 1, mandatory plan review, shaping, Coordinator factual lint, dependency satisfaction, exact Allowed Files, named worktree/branch, and a Step 0 restate-and-stop gate. New top-level work or a product/legal decision is not covered.
2. **Gate 3 — HUMAN-OWNED unless delegation is proven at merge time.** Every merge or cherry-pick stops for Clinton's approval unless effective target-branch rules name the agent's distinct identity as an authorized bypass actor and that proof is captured immediately before the merge call. Missing or unavailable proof fails closed. Any approved target must be a goal-owned local integration branch/worktree; no default/shared local branch is permitted.
3. **External actions — NOT GRANTED.** No push, PR, publication, deployment, distribution, package release, filing, assignment execution, customer/third-party communication, or `LICENSE` modification.

Any red, unknown, skipped mandatory check, unresolved or disputed finding, tripwire, or unratified amendment voids the affected authorization. Harness permissions are not process gates.

## Standing constraints

- Publication freeze: no push, public remote publication, deployment, distribution, or registry publication.
- Never modify a `LICENSE` file.
- Pathspec-scoped commits only; never stage a repository root wholesale.
- Every write receives an encoding-stable readback assertion.
- Once a mechanism ruling and drafting entry are frozen, any later change requires a logged re-confirmation cycle.
- No behavioral change weakens a fail-closed path or delays promotion to `Critical`.
- Before monorepo reads, every affected spec and kickstarter repeats: **“Kill any running Next.js dev server before file reads in the monorepo — a live server hangs file reads ~4 minutes.”** This does not authorize stopping a production server.
- Never retry a timed-out Docker MCP gateway call.
- Dirty ambient checkouts are read-only. Every mutation uses a parcel-owned worktree and branch from a recorded local commit.
- Every parcel receives exact Allowed Files. A newly discovered divergence is reported and never silently absorbed.

## Durable control plane

The private SQLite database is the source of operational truth. Before cross-repository shaping, it and generated views must exist for:

- track registry;
- parcel/dependency board;
- integration-surface inventory;
- integration-scenario matrix;
- environment-readiness matrix;
- security/release-gate map;
- evidence index;
- decision log;
- risk/blocker register; and
- session-handoff log.

Generated views are regenerated from the database and are never hand-edited. Repository, branch, worktree, commit, evidence, and verification facts are reconciled against disk before state is advanced.

## Queue and dependencies

### Wave 0 — hard barrier

1. **OR-P01:** independently verify `keon-systems` build and the three named ARO suites.
2. **OR-P02:** make `keon.collective` compile and reach zero test failures, or stop for a Clinton-ratified evidence-backed allowlist of unrelated pre-existing failures.

OR-P01 and OR-P02 shape and execute in parallel. Nothing later dispatches until both are independently green.

### Wave 1 — corrections after the barrier

- OR-P03 PolicyHash v2 domain separation.
- OR-P04 ARO backend parity.
- OR-P05 shadow ARO worktree reconciliation or safe retirement.
- OR-P06 independent quiescence signal.
- OR-P07 `Cold` emission with permanent dual-label replay.
- OR-P09 fail-closed hysteresis.
- OR-P08 classifier reconciliation plus the complete Cognitive Heat ruling, after OR-P06 and OR-P07.

### Wave 2 — mechanism rulings

- OR-P10 after OR-P03.
- OR-P11 after OR-P04.
- OR-P12, OR-P13, OR-P14, and OR-P15 after the Wave 0 barrier.
- OR-P09 is required for goal exit but is not filing-blocking.

### Wave 3 — after all seven rulings

- OR-P16 sole whitepaper reconciliation owner.
- OR-P17 undisclosed-strength inventory.
- OR-P18 capability-registry truth pass.
- OR-P19 license-report reconciliation without touching a `LICENSE`; stop if R-4 becomes load-bearing.

### Wave 4 — filing readiness

- OR-P20 after OR-P16 through OR-P19; stop if R-5 becomes load-bearing.
- OR-P22 after OR-P16 through OR-P19.
- OR-P21 after OR-P16 through OR-P20, using a versioned corpus manifest and stable statement IDs.

R-6 is mandatory for every proposed `EXCLUDED` ruling.

## Per-iteration algorithm

1. Read this directive, the amended charter, plan-review findings, and current generated state. Confirm this task still owns the queue.
2. Check active sessions. A missing completion claim is unclaimed work, even if files exist. Recover a dead session through a fresh resume session whose Step 0 inventories disk state and stops.
3. Select only dependency-ready work. Serialize colliding files and surfaces.
4. Shape in a fresh frontier session. The spec must use the current convention, name exact Allowed Files, branch, worktree, base commit, integration surfaces, security/release gates, tests, evidence, and stop rules.
5. Coordinator-lint every factual claim against disk. A real gap becomes an amendment; no agent silently rules it.
6. Under Gate 2, emit the permission profile and create the named parcel worktree/branch, then dispatch a fresh builder. Every build or rework directive opens with a Step 0 restate-and-stop gate.
7. Accept no completion claim until it maps every acceptance criterion to files, commands, counts, commit, and evidence. Wrong-shaped claims are presumptively empty.
8. Closure-check claims against disk before any deterministic rerun. The Coordinator does not create the independent evidence it consumes.
9. Route deterministic verification to a fresh independent session in the required environment. Environment-specific evidence stays environment-specific.
10. Route one frontier adversarial review for standard parcels and two independent frontier reviews for architecture/risk parcels. Reviewers never fix or commit and may probe hostile inputs.
11. Triage every finding. Reproduce disputed findings before ruling. Rework has its own Step 0 gate and pre-recorded test-count tripwire.
12. Once the complete chain is green, stop at Gate 3 unless D15's merge-time branch-rule and distinct-identity proof exists. No push or PR is permitted under this goal.
13. After an authorized local integration, complete Stage F: exact-path records, state reconciliation, evidence index, lessons disposition, handoff, and parcel worktree/branch cleanup. Never clean unrelated work.
14. When the queue empties, run the complete charter exit audit; never infer goal completion from parcel status.

## Reporting contract

Each parcel outcome records: parcel ID; ruling or outcome; repository; branch/worktree; source and ending commits; exact files touched; commands; environment/toolchain; passing and failing counts; evidence paths; review/triage state; divergences discovered outside scope; and the next safe action. Each wave produces a matrix from the database.

## Stop conditions

Stop and report when any charter stop condition fires, including:

- unavailable parent-v3.0 text becomes load-bearing;
- R-4, R-5, or R-6 becomes load-bearing;
- a result would be `EXCLUDED` without R-6;
- a fail-closed path would weaken or `Critical` promotion would be delayed;
- a frozen mechanism changes without a re-confirmation cycle;
- a parcel needs a file outside Allowed Files or a new top-level parcel;
- work would touch a dirty ambient checkout;
- an unresolved contract, version, migration, security, tenancy, crypto, inventorship, legal, or evidence boundary is encountered;
- the capability registry cannot be located or ownership is ambiguous;
- a new doctrine divergence falls outside the active parcel;
- a tripwire fires twice;
- a security finding cannot close in parcel;
- a mandatory check is unknown, skipped, or irreproducible;
- a timed-out Docker MCP gateway call would need retry;
- an outward action, `LICENSE` change, history rewrite, or default/shared-branch merge is proposed; or
- the queue is empty, triggering the full exit audit.

## Wakeup pacing

Work while dependency-ready work exists. When blocked only on active agents, wait for completion notifications with a long fallback; do not poll. On restart or human nudge, inspect agent/session state before accepting disk changes. A stopped or missing agent without a completion claim is not complete.
