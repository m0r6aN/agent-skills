# Loop Directive — Routing Currency and Merit

## COORDINATOR OWNERSHIP

> **Queue owner:** the Claude Code coordinator session
> `e45b4d47-8455-49e9-9629-31c713c1b356`, which took ownership on 2026-09-21 at
> 10:18 EDT on Clinton Morgan's explicit direction: "Transfer ownership to this
> session." One goal, one coordinator. Ownership transfers only at a parcel
> boundary by updating this block. If another live coordinator is named or ownership
> becomes ambiguous, stop and report; never assume.
>
> **Transfer record.** The prior owner was the coordinator session for task
> `01a0bf3f-559b-7291-a20e-8d8a4bbb16b3`, claimed 2026-09-20. The transfer happened at
> a parcel boundary: no RCM parcel was in flight, RCM-P0 was closed incomplete, and
> RCM-P1 was held. The prior owner's last act was stopping the child goal's JEV-P0 at
> its human Gate 3 boundary in commit `54ef5dd`. The transfer covers this parent goal
> only. Ownership of `routing-currency-and-merit-jev-alpha` is unchanged, and that
> child's rule against editing parent surfaces without a ratified integration parcel
> still binds it. The transfer changes no gate, hold, or authorization recorded below.

**State:** `RCM-P0-closed-incomplete` — Stage Zero, mandatory plan review, shaping,
Gate 2, builder rework, deterministic closure, two fresh post-rework adversarial
reviews, and the bounded human Gate 3 merge are complete. RCM-P0 is accepted only
as an incomplete evidence handoff; its spec is in `docs/specs/done/` and its four
evidence files are merged. The bounded Gate 3 grant is explicitly extended to
refreshes of these same four evidence artifacts under the completed P0 spec only.

**Updated 2026-09-22:** `RCM-P1-released`. Clinton Morgan accepted the P0 evidence
as design input only, set a 24-hour freshness bound, ruled that endpoint mismatches
refuse without aliasing, and re-granted Gate 2 for RCM-P1. The full ruling is in
the charter's "RCM-P0 evidence-boundary ruling" section. RCM-P1 is next in the
queue. RCM-P2 onward still need a new exact Gate 2 grant.

## Standing authorizations and limits

1. **Gate 1** is ratified for D1–D14, OQ1–OQ7, the plan-review amendments A–K, and
   queue amendments 1–6, as recorded in `charter.md`. Any future locked-decision change
   reopens Gate 1 for that decision only.
2. **Gate 2 is granted only for the exact initial parcel set `RCM-P0` and `RCM-P1`:**
   “Grant Gate 2 for RCM-P0 and RCM-P1.” No other parcel may be dispatched until a
   new explicit Gate 2 grant names it. Waves 1–4 remain re-gated on RCM-P0 evidence.
3. **Gate 3 is not delegated.** No merge, default-route promotion, live policy
   mutation, Pi host-file write, provider spend, host correction, or external effect is
   authorized by this directive.
4. Step-0 rulings, builder dispatch, rework, review, and deterministic verification
   begin only after the relevant Gate 2 grant. A real contract/spec gap stops for a
   coordinator-ratified amendment committed alone before code.

## Queue in strict order

1. **RCM-P0** — current-instance reconnaissance, F1–F6 re-derivation, HAWF/INDEX
   reconciliation, F4/Jev disposition evidence, versioned catalog-snapshot facts, drift
   report, and environment map. Architecture/risk; dual adversarial review.
2. **RCM-P1** — pure typed models-store reader and eligibility projector, including
   sentinel/meta-router/variant rejection and snapshot provenance. Implementation/
   standard; single adversarial review.
3. **RCM-P2** — SPEC-CONVENTION amendment and linter support.
4. **RCM-P3** — routing-policy schema v0.4 and validator invariants.
5. **RCM-P4** — fixed-order resolver and F1/F2/classification/expertise negative controls.
6. **RCM-P4A** — actual dispatch integration and decision-receipt contract.
7. **RCM-P5** — snapshot-bound in-process currency preflight.
8. **RCM-P6** — scheduled RCM proposer, proposal evidence, and A/B/C classification.
9. **RCM-P7** — one-way settings projection artifact/patch; no host-file write or readback.
10. **RCM-P8A** — receipt/replay contract and mismatch-refusal evidence.
11. **RCM-P8** — admissible receipt-derived merit corpus.
12. **RCM-P9** — shadow/evidence-only expertise bindings with dated sources.
13. **RCM-P10** — exit evidence assembly only.

## Per-parcel algorithm

For each authorized parcel, advance through the full Foreman Line cycle:

1. Fresh shaping session produces the parcel spec and stops for coordinator lint.
2. Coordinator verifies every factual claim on disk and checks the spec against the
   ratified charter, including exact exit-criterion wording and serialization points.
3. Obtain or verify the exact Gate 2 authorization for that parcel.
4. Dispatch a fresh builder in a named worktree/branch with a Step-0 restate-and-stop
   gate and the standing constraints. Architecture/risk parcels use frontier routing.
5. Rule on flags; contract changes require a standalone ratified amendment before code.
6. Map the completion claim to disk evidence and test count. Wrong-shaped claims are
   presumptively empty.
7. Run the coordinator closure check against disk before rerunning anything.
8. Run the deterministic pass in PowerShell with `node -v` first, following the repo's
   lessons and never reading an exit code through a truncated pipeline.
9. Dispatch fresh adversarial review: one for standard risk, two independent frontier
   reviews for architecture/risk. Reviewers are read-only, never fix, never commit, and
   may probe hostile inputs at live process boundaries.
10. Triage findings; reproduce disputed findings before ruling. Rework has a new Step-0
    gate and a test-count tripwire.
11. Stop for the human Gate 3 merge decision; do not merge under this directive.
12. At Stage F, move the accepted spec to `docs/specs/done/`, clean the parcel worktree/
    branch only when authorized, append lessons with dispositions, and update this
    directive and the charter state.

## Required cross-cutting checks

- RCM-P0 evidence must be live and reproducible; the supplied snapshot is design input,
  never proof by itself.
- No dispatch path may read Pi settings, call the network/MCP, or price-sort.
- Proposal evidence must not fabricate governed-model-fleet effect-bound fields.
- Receipt/replay must bind policy, catalog snapshot, vocabulary, derived requirements,
  predicates, and executed identity.
- F1 and F2 must be closed through the actual dispatch integration path.
- Pi's host-owned settings file is never written by Foreman; projection output is an
  explicit artifact/patch only.

## Stop conditions

Stop and report on: a need to amend boundary-routing D1–D10 or another frozen contract;
an unresolved HAWF/INDEX ownership conflict; a missing or stale catalog snapshot; a lane
with no eligible candidate; any live policy or Pi host-file mutation; provider spend or
credential discovery; a security finding not closable in-parcel; a tripwire firing twice;
disagreement that cannot be reproduced; a worker evaluating or promoting itself; or any
human gate not explicitly granted.

## Wakeup pacing

When an authorized builder or reviewer is running, completion notifications are the
primary wake signal and a long fallback is the only insurance. Never poll rapidly. If a
host restart kills the agent, treat surviving unclaimed worktree files as unclaimed and
dispatch a fresh resume session with the original Step-0 directive before accepting any
claim.

## Current iteration

**2026-09-22, loop stopped at Gate 3:** RCM-P1 is built and its verification
chain is green. The parcel sits on branch `codex/rcm-p1-builder` at `7faa46a`,
with 399 of 399 tests passing. The spec is
`docs/specs/done/RCM-P1-models-store-eligibility-projector.md`, with amendments
A1–A3. Four fresh reviews and three rework rounds are recorded in
`rcm-p1-review-triage.md`. The final review returned APPROVE WITH NITS with no
blocker. Nothing has been merged, pushed, or opened as a pull request.

The following are human decisions:

1. Gate 3: whether to merge RCM-P1.
2. Whether the charter's HAWF/INDEX ownership sentence blocks that merge. The
   coordinator let building and review proceed because P1 is an unwired library
   that creates no routing or ownership authority.
3. The integration route: a direct merge or a pull request.

After Gate 3, Stage F moves the spec to `docs/specs/done/`, cleans up the P1
worktrees and branches if authorized, and appends lessons. RCM-P2 onward needs a
new exact Gate 2 grant. Open disposition: RCM-P5 shaping must consider a
per-string length cap (review finding S1).

**2026-09-22, earlier:** RCM-P1 was released under the evidence-boundary ruling
and Gate 2 re-grant recorded in the charter. The history below is kept as the
record of how P1 was held.

Gate 2 is satisfied for RCM-P0 and RCM-P1. The bounded Gate 3 extension was used only
for the same four RCM-P0 evidence artifacts: the host-owner export refresh was merged
as `37d9ecb` after two fresh independent reviews and coordinator hash/closure checks.
The refresh remains an incomplete evidence handoff: `complete:false`, freshness and
approved-configuration authority are refused. One bounded alpha Decisions call
observed Jev servability, but standard chat/completions eligibility and D13 routing
acceptance remain unresolved; no live routing authority was created. General Gate 3
authority remains human-owned and not delegated. RCM-P1 remains held; no P1 dispatch,
host correction, live policy mutation, Pi write, provider spend, or downstream
consumption is authorized until the remaining P0 evidence boundary is accepted and P1
is explicitly re-gated.

The coordinator recommendation was ratified and authorized by Clinton Morgan on
2026-09-20: D13 remains unchanged; the alpha Decisions result is servability-only;
`MISSING_MODEL_REFUSED` remains the routing outcome; and RCM-P1 remains held. This
authorization creates no alpha eligibility exception and authorizes no further call,
provider spend, Gate 1 reopening, host correction, policy or Pi mutation, HAWF action,
Helmholtz handoff, or downstream consumption. A future alpha-routing proposal must
return through a separately named Gate 1 eligibility annex and its own evidence chain.

## Scoped prerequisite delegation and P1 closure — 2026-09-26

The user explicitly authorized HRO coordinator task 01a0ddb6-5fed-7d82-b2f0-075315440dc1 to coordinate and approve necessary RCM/PMC prerequisites, subject to independent review. This overrides historical P1 gate holds below for this bounded work; it does not transfer unrelated RCM or Jev queues. The former named RCM owner was not active during the collision audit. PR51 merged as 700beba5e6387a9471ecea7a8757b226930ba925 after fresh independent integration approval, 399 tests/typecheck/lint on Node24.19.0, and green CI. P1 is done. The HRO coordinator owns the next scoped adapter/source prerequisite parcels; their concrete reviewed specs control dispatch. Actual runtime/goal acceptance remains open.

## RCM-P1A Stage F closure — 2026-09-26

PR56 merged as e6daf7e8cd3bc7b7ae61f9646465f8cea60de2c9 after both independent
final reviews approved 4201ac4edf8069efa0857d9841341d62b2429648. Independent
combined integration passed 498 routing tests, typecheck, lint and spec validation;
the public barrel preserved the 75-export union. Complete remote twenty-package
CI passed at final PR head e23a9251b0365aeaf68302f36bb259a4a59a9ed3. The spec is
moved to done; original reviewed branches remain retained without destructive
cleanup. The wrapper confers no authority on caller-declared source evidence.

PMC-P1b now owns the next shared-file integration. The isolated RCM producer
may build concurrently but lands after the accepted projection. Live routing,
provider configuration and paid inference have not been activated.