# /loop Directive — Governed Model Fleet

## COORDINATOR OWNERSHIP — read before any dispatch

> **Queue owner (transferred 2026-09-27):** the omp foreman-line coordinator session that
> resumed `governed-model-fleet` on 2026-09-27 under the owner directive "Proceed with the
> completion of governed-model-fleet". Transfer occurred at a parcel boundary (GMF-P1
> landed; GMF-P2A unshaped). Prior owner `/root`, the Remote-safe Codex coordinator that
> opened the goal on 2026-09-03, is not live. One goal has one coordinator. Ownership may
> transfer only at a parcel boundary by updating this block, `charter.md`, and the goal
> index. If ownership or repository-writing authority is ambiguous, stop and report; never
> assume.
>
> **Record revival (2026-09-27):** this goal's record was deleted from `docs/goals/` on
> 2026-09-26 by the C1 audit verdict (goal-status-report-2026-09-26.md §6.2) and restored
> from git on 2026-09-27 by explicit owner directive; the C1 deletion is superseded for
> this goal only. All other audit dispositions stand.
>
> **State reconciliation (MRC-01-class propagation write, coordinator session 5 of the
> `model-routing-chain-wrapper` lineage, 2026-09-28 — parcel-boundary update per the
> transfer rule above; the record's own Gate-2 grant record pre-authorizes coordinator
> record-maintenance edits to state/ownership/gates lines as non-drift):** GMF-P2A is
> LANDED (PR #203 merged `dcadad5`; owner resolution `8407fb1` = precedence (a), reviewed
> chain bytes restored verbatim; parked work via reconciled PR #202 `754531f`; byte
> verification in `gmf-p2a-closure-evidence.md`). GMF-P2B is built and accepted (1083/0/0;
> 2/2 reviews) but its delivery is UNCOMMITTED on `codex/gmf-p2b-atomic-spend-20260928` @
> `7a6efe5` — the builder is prohibited from committing (`GMF-P2B spec:642-644`); the chain
> commit+PR+merge awaits the owner's extension of the green-contingent grant or an
> owner-run landing (wrapper `dispatch-table.md` stop-report act #1). GMF-P2C is shaped and
> held on the same act (`GMF-P2C spec:746-748`). Closure evidence: `gmf-p2a-closure-evidence.md`,
> `gmf-p2b-closure-evidence.md` (coordinator assemblies per their specs' claim-verification
> mandates; GAP registers inside). Coordinator continuity: the wrapper coordinator lineage
> (sessions 2–5) holds this queue's chain work (MRC-22…25); sessions claim at the wrapper's
> ownership block.

`model-fleet-v1` is a frozen predecessor stopped at MF-P0 `NO-GO`. It is not an active queue
owned by this loop, and none of its files or evidence may be amended by Governed Model
Fleet.

## Governing records

Read these at the start of every iteration:

1. `plugins/foreman-line/docs/goals/governed-model-fleet/charter.md`
2. `plugins/foreman-line/docs/goals/governed-model-fleet/amendment-a1.md`
3. `plugins/foreman-line/docs/goals/governed-model-fleet/plan-review-findings.md`
4. `plugins/foreman-line/docs/goals/governed-model-fleet/discovery.md`
5. `plugins/foreman-line/docs/goals/INDEX.md`
6. `plugins/foreman-line/docs/COORDINATOR-PATTERN.md`
7. `plugins/foreman-line/skills/parcel-driven-development/SKILL.md`

The charter with incorporated Amendment A1 is authoritative. The index is a discovery
projection only. Current Git state, approved parcel specs, receipts, and evidence must be
reconciled before trusting any carryover status.

## Ratification and standing-authority record

The owner issued these directives verbatim:

> “Ratify Governed Model Fleet Stage Zero assumptions A1–A7 and authorize successor
> charter drafting plus plan-level adversarial review.”

> “Ratify Governed Model Fleet D1–D24 and GMF-P0–GMF-P6.”

> “Ratify Governed Model Fleet Amendment A1 and revised graph through GMF-P9.”

Their controlling interpretation is narrow:

1. A1–A7, D1–D24 as amended by A1, and the graph through GMF-P9 are Gate-1 ratified.
2. The plan-level adversarial review is complete and its accepted findings are incorporated.
3. Gate 1 authorizes the plan, not parcel execution.
4. **Gate 2 is absent.** No builder, implementation reviewer, repository mutation, or parcel
   execution may be dispatched until the owner grants Gate 2 for the exact named parcel or
   parcel set and its shaped Allowed Files.
5. Repository creation/protection is the separate human prerequisite `GMF-HG-R1`; no parcel,
   Gate 2, or coordinator may infer it.
6. Provider spend/model calls, private/internal disclosure, patch promotion, merges,
   user-local installation, deployment, publication, and Gate 3 each remain separate
   explicit human actions at their actual boundaries.
7. Passive local inspection and goal-record maintenance may continue only as necessary to
   reconcile state and prepare a Gate request. They confer no product authority.

Harness permission prompts and filesystem access are not governance gates.

> **Standing grants recorded 2026-09-16 (owner, verbatim):** "I grant repo
> creation (HG-R1), spend, disclosure, promotion, PR creation, and Gate 3."
> Coordinator scoping (binding): these apply to the GMF-P0 landing + P1 shaping
> and dispatch chain only — repo creation executes as human HG-R1 at its actual
> boundary (after P2C per the ratified queue; P0/P1 findings available per the
> charter HG-R1 row), never earlier; spend/disclosure/promotion apply
> per-parcel at their actual boundaries under that parcel's own Gate 2 + green
> verification chain; PR creation covers parcel/closure PRs (never direct-to-main
> pushes); Gate 3 merges are contingent on the full green verification chain per
> parcel (any red step voids it; pre-existing red CI unrelated to the parcel is
> documented in the PR body, never silently absorbed). Anything outward-facing
> beyond this scope still needs an explicit owner call.
>
> **Designations + rulings recorded 2026-09-16 (owner, verbatim):**
> S1: "Designate Clinton Morgan as keon-systems contract owner and
> keon-mcp-gateway owner for GMF-P1 DR concurrence." S2: "Concur DR-001(a),
> DR-002(a), DR-004(a), DR-006(a), DR-008(b) as the P1 resolutions, recorded
> against P1-C049/C066/C071/C119/C093/C061; concurrence HOLDs clear." S3:
> "Ratify the coordinator ruling on F-A1/F-01:
> BLOCKED_UNRATIFIED_ERROR_CODE retained as HOLD marker under P1-C072/EV-010
> guards; permanent vocabulary lands with DR-002 concurrence." Scope: P1 only;
> key-provider selection stays CARRIED (DR-006 remainder); nothing herein
> chooses P2A+ matters. Coordinator note: the cited `P1-C0xx` controls live in
> unlanded P1 evidence set (branch `codex/gmf-p1-contracts-20260916`, landing
> PR pending at record time); this entry's operative content — the designations,
> the five choices, the F-A1 ratification — applies in full on P1 landing.
>
> **Standing grants recorded 2026-09-27 (owner, via the resumed coordinator
> session):**
> 1. "Grant Gate 2 for GMF-P2A" — for the exact shaped scope only:
>    `docs/specs/active/GMF-P2A-runtime-authority-accounting-store.md` (activated
>    `draft → active` at grant) with its 12 exact `keon-systems` Allowed Files,
>    branch `codex/gmf-p2a-store-20260927`, worktree
>    `D:/Repos/agent-skills-worktrees/gmf-p2a-store-keon-systems-20260927`.
>    GMF-P2B/P2C and all later parcels re-gate per the queue. Spec-verification
>    ruling: the spec's "shaping-time pins" are anchored to the git-tracked goal
>    records plus a builder Step-0 SHA-256 baseline (see spec Verification);
>    coordinator record-maintenance edits to charter/loop-directive state,
>    ownership, and gates lines are enumerated here and are not drift.
> 2. Surviving-work ruling: the uncommitted P2A-target diff in worktree
>    `gmf-p2a-store-keon-systems-20260916` (`codex/gmf-p2a-store-20260916`) is
>    **PARKED** — the builder ignores it entirely and the worktree stays
>    byte-untouched as unclaimed provenance; its fate is a Stage-F owner decision.
> 3. Release chain: "PR creation + Gate 3 merge, green-contingent" — PRs only,
>    never direct-to-main pushes; the Gate-3 merge covers the GMF-P2A chain and is
>    voided by any red verification step; pre-existing red CI unrelated to the
>    parcel is documented in the PR body, never silently absorbed.
> Unchanged: repository creation (HG-R1), provider spend, private/internal
> disclosure, patch promotion, deployment, publication, and user-local
> installation each remain separate explicit human actions at their actual
> boundaries.
>
> **Review triage + rework amendment recorded 2026-09-27:** two independent
> adversarial reviews (A: `incorrect`, 4 findings; B: `APPROVE WITH NITS`, 2
> findings; A-F1≡B-F1 and A-F2≡B-F2 converged at identical loci, coordinator-
> verified). Triage: A-F1/B-F1 **FIX** (blocking: derived denial IDs make repeat
> conflict/race/quarantine denials throw instead of returning the documented
> `false` and persisting per-event evidence — P1-C112 repeat-shape gap);
> A-F2/B-F2 **FIX** via coordinator-ratified spec amendment adding
> `tests/Keon.Runtime.Api.Tests/LaunchExecutionCutoverTests.cs` to Allowed Files
> (SPEC-CONVENTION §4.8; test-only, InternalsVisibleTo-gated home); A-F3 **FIX**
> (literal P1-C071/P1-C103–C105 vocabulary pins in tests); A-F4 **FIX** (trigger
> hardening on missing attempt row). Rework mandate: findings are a floor — sweep
> every derived denial-evidence path, not only the cited three. Tripwire floor for
> rework: 1005/0/0 (baseline 971 + 34). Spec `Allowed Files` now lists 13 files.

## Current state and next safe action

**State:** `gmf_p2a_landed_p2b_accepted_uncommitted_p2c_held` (reconciled 2026-09-28, MRC-01-class write)
**Active queue item:** GMF-P2B landing — the owner extends the green-contingent PR-creation+merge grant to `codex/gmf-p2b-atomic-spend-20260928` (covering its S1 base-SHA commit + PR + merge) or runs the landing by hand; the complete accepted delivery sits uncommitted in `D:/Repos/agent-skills-worktrees/gmf-p2b-atomic-spend-keon-systems-20260928` (SHA-256-anchored in `gmf-p2b-closure-evidence.md`)
**Product implementation:** GMF-P2A LANDED in `keon-systems` (PR #203, merge `dcadad5`; 13 Allowed Files; effect path stays disabled); GMF-P2B built (1083/0/0, 2/2 reviews) but unlanded; GMF-P2C shaped and held
**External effects:** the 2026-09-27 green-contingent grant (consumed by PR #203) plus the owner-run merges of PR #203 and PR #202 (2026-09-28); everything else ungranted — P2B landing, HG-R1, spend, disclosure, promotion, CI waiver

GMF-P0 landed on main (PR #28) and GMF-P1 landed on main (PR #33). GMF-P2A shipped its
full chain 2026-09-27/28 — shaped → Gate 2 → build → two independent reviews + rework
R1–R5 (mutation proofs M-A…M-E) → acceptance → commit `7a6efe5` → PR #203 merged
(`dcadad5`; owner resolution `8407fb1`, precedence (a), reviewed bytes verbatim) — and
GMF-P2B was built and accepted in the same window (delivery uncommitted; see State). The
next safe action is the owner's P2B landing act (wrapper `dispatch-table.md` stop-report
act #1), then GMF-P2C dispatch on the named base SHA.

## Dependency queue

The queue is strict by dependency, with parallelism permitted only where explicitly shown
and only after collision analysis:

1. **GMF-P0 — discovery/canon/threat model/expanded negative matrix.** LANDED
   (PR #28). Zero implementation and zero external effects, as scoped.
2. **GMF-P1 — contracts.** LANDED (PR #33, closure READY). Depends on accepted GMF-P0 (satisfied).
3. **GMF-P2A — durable Runtime authority/accounting store and migration.** Depends on P1.
4. **GMF-P2B — atomic spend/reservation/concurrency/pre-effect receipt.** Depends on P2A.
5. **GMF-P2C — terminal reconciliation, lease recovery, settlement, verification
   primitives.** Depends on P2B.
6. After P2C, two dependency branches may proceed if separately gated and collision-safe:
   - **GMF-P5 — MCP capability admission** in `keon-mcp-gateway`;
   - **GMF-HG-R1 — human repository creation/protection**, which is not a parcel.
7. After GMF-HG-R1 establishes protected repositories and initial base commits:
   - **GMF-P3A → GMF-P3B — model-gateway baseline, then governed gateway**;
   - **GMF-P4A → GMF-P4B — executor baseline, then deny-only executor**.
   P3 and P4 branches may be parallel only because they write separate repositories.
8. **GMF-P4C — bounded synthetic/public allowed execution.** Depends on independently
   accepted P3B and P4B. P4B denial closure must be complete before P4C shaping/dispatch.
9. **GMF-P6 — isolated Promotion Actuator.** Depends on P1, P2C, and P4C.
10. Two branches may then proceed if separately gated and collision-safe:
    - **GMF-P7 — foreman adapter and distributable skill** depends on P3B, P4C, P5, P6;
    - **GMF-P8 — offline verifier implementation and independent acceptance** depends on
      P1, P2C, P3B, P4C, P5, P6.
11. **GMF-P9 — verification-only adversarial E2E.** Depends on P7 and independently accepted
    P8. Verifier source and fixtures are forbidden from P9 Allowed Files.

No dependency arrow grants authority. Every parcel or explicitly named parallel parcel set
requires its own Gate 2 record.

## Per-parcel coordinator algorithm

1. Reconcile the governing records, repo HEAD/status, existing worktrees/branches, open
   writers, prior handoffs, and current environment. Preserve all pre-existing dirty work.
2. Shape the parcel in a fresh bounded session. The spec must name exact repository/base
   commit, branch/worktree, Allowed Files, Forbidden/Out of Scope, contracts, integration
   surfaces, data class, environment identity, required tests, independent observation
   points, rollback/cleanup, evidence, collision risk, and stop-and-report rules.
3. Lint every factual claim against disk and current canon. A missing owner, contract,
   observation point, environment, or authority boundary is a stop, not a shaping guess.
4. Present the exact parcel or parcel-set Gate 2 request. Do not infer approval from Gate 1,
   prior Fleet authority, harness settings, or silence.
5. After Gate 2, dispatch a fresh builder in the named isolated worktree/branch. Its Step 0
   must restate scope, files, contracts, test count, environment, and blockers, then stop for
   coordinator ruling before implementation.
6. A real spec or contract gap becomes an amendment. Frozen/cross-project contract changes
   stop affected work until the amendment lands before dependents resume.
7. On a completion claim, verify the claim shape and inspect repository state before running
   anything. Evidence must map to every acceptance criterion; wrong-shaped claims are
   presumptively empty.
8. Run deterministic verification in the exact required environment. Environment-local
   green never upgrades another environment.
9. Every GMF parcel is architecture/security risk and receives **two independent fresh
   adversarial reviews**. Reviewers never fix or commit. They may perform safe hostile-input
   probing only when the parcel's explicit authority permits it.
10. Triage findings as fix, accept-as-documented, or informational. Reproduce disputed
    findings independently before ruling. Rework repeats Step 0 and carries a test-count
    tripwire.
11. A green parcel chain is not merge or release authority. Present the required human merge
    or Gate 3 action; never perform it unless explicitly granted for that exact target.
12. After authorized acceptance/merge, perform Stage F: archive the spec, clean only the
    parcel-owned worktree/branch, append lessons/handoff/evidence, and update charter/index/
    loop state. Never delete or reset user-owned work.

## Effect-specific invariants

- **Execution:** no source-bearing preparation before spend; one spend starts at most one
  isolated root process tree; the whole tree terminates on failure; post-spend source
  bootstrap precedes cognition.
- **Inference:** one exact provider attempt per spend; no automatic provider retry/fallback;
  unknown post-send cost remains reserved until append-only settlement or human resolution.
- **Promotion:** only the isolated Promotion Actuator may apply; target is a new isolated
  worktree/ref under exact patch/HEAD/path/review/CAS binding; promotion cannot merge.
- **Authority:** only Runtime-issued `IPermission` is canonical. `FleetPermissionEnvelope`,
  role, prompt, profile, receipt, evidence, confidence, and coordinator judgment confer no
  authority.
- **Isolation:** Runtime governs capabilities; the container/VM/OS boundary enforces them.
  Neither substitutes for the other.
- **Evidence:** denial and failure are durable evidence. Missing or unverifiable evidence
  fails closed. P9 may consume but not modify the verifier it uses.

## Stop conditions

Stop the loop and report when:

- Gate 2 is required and absent;
- `GMF-HG-R1` repository creation/protection is required and absent;
- provider spend, private/internal disclosure, promotion, merge, installation, deployment,
  publication, or Gate 3 is required and not explicitly authorized;
- another live coordinator/writer owns overlapping scope or a required worktree is dirty;
- a ratified invariant, effect class, contract owner, source/environment identity, data
  class, cost/settlement rule, receipt lifecycle, or target needs to change;
- a security finding cannot close inside the active parcel;
- a denial observer is not independent of the component under test;
- a receipt/evidence write cannot be made durable before the effect;
- an idempotency/recovery path could create a second process tree, provider attempt, or patch
  application;
- P4C is proposed before P4B's full independent closure;
- P9 would modify verifier source/fixtures or use self-produced proof;
- a tripwire fires twice in one parcel; or
- the queue is empty or the goal exit criterion is met.

## Wakeup and crash recovery

Completion notifications are the primary wake signal. Use long fallback wakeups only while
an authorized background agent is running; never short-poll. On resume after interruption,
check live agents and repository/worktree state before trusting expected output. Disk state
without a completion claim is unclaimed. Recover through a fresh bounded resume session
whose Step 0 inventories surviving work and stops for coordinator ruling.

When stopped at a human gate, persist the exact state and requested action, then yield. A
human-only gate is never a loop condition the agent pretends it can satisfy.
