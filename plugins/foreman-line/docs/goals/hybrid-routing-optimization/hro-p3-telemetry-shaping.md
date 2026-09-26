# HRO-P3 telemetry shaping evidence and decisions

Status: DRAFT, nondispatchable. This document and the
[draft spec](../../specs/active/HRO-P3-correlated-receipts.md) are the entire
authorized shaping output. No runtime, charter, schema or ShapingResult changes.

Worktree: D:/Repos/agent-skills-worktrees/hro-p3-telemetry-shaping-20260926.
Branch: codex/hro-p3-telemetry-shaping-20260926. Created only after confirming both
branch and path absent, from origin/main
`2eb994b4dca3e0d1220953c30d1a64d0e5bdfc37`. Step 0 was reported and the coordinator
explicitly released the two-document shape. This is not independent approval.

## Source evidence

Paths below are plugin-relative; line references describe the accepted base.

| Owner/source | Observed contract and implication |
|---|---|
| receipts/src/types.ts:29; schemas.ts:29-60 | Existing ReceiptDocument envelope permits producer-owned subject. No new kind or outer schema required. Blob types fd3e328548ae7b80990ad526f0249350dd149591; schema 6fab8b80e1993de88d98fdeef4144bf7b5770dc9. |
| contracts/src/correlation.ts:25-58 | Workflow/run/correlation identity has established meanings and UUID shape. Do not mint fake workflow IDs for standalone launches. |
| dispatch/src/routing-eval/index.ts:238-262; shadow.ts:729-741 | Existing routing/shadow side files overwrite fixed names. They cannot count repeated invocations or supply append-only telemetry. |
| dispatch/src/approval-cli/index.ts:480-525 | DispatchOrder is sequence 2, stage C; it references routing evidence, not an attempt journal. |
| verification/src/harness/index.ts:303-311,460-485 | Sequence lookup is a disk read. BuildResult must chain directly from named dispatch tip. Blob 9f052d69bea3593dbc83772a861380ac0275bd63. |
| verification/src/chainwalk/index.ts:196 onward | Actual walker checks contiguous receipt filenames and envelope/pointer/correlation properties. It is not proof of canonical hash recomputation or a writer lock. |
| approval/src/receipt-writer.ts:12-23 | Existing writeReceiptDocument overwrites using writeFileSync. Exclusive new publication requires a scoped owner helper; wrapping this with a preceding existence check is not atomic. |
| integration/src/closure-receipt.ts:130 onward | Closure follows actual tip and seals at stage F. Blob a855b442e176bd974c5221ea98a44cb5aceded7d. No later telemetry append permitted. |
| routing-policy/src/pmc-resolver-types.ts:273-325 | Audit is selection-only and retains complete inputs; persist a minimized projection, not whole audit. Resolver blob 809e8d08a9444c925fb8b88b423e2e4b7ff28625. |
| dispatch/src/pmc-launch/ledger.ts:52-107,797-918 | AttemptV1 exposes acknowledged state, exact request/cost/proof associations, actual/null. Authentication precedes idempotent settlement replay. No event export or token/provider metrics. Blob 552e0b1163178ace90bbc4369edaf30e346d1eb6. |
| dispatch/src/pmc-launch/money.ts:6-43 | Price profile/version/tariff and request-bound cost evidence are available; maximum and ranking cost are not account charges. Blob c0d57e17a77b3efc831c144cbf03eba632e56b96. |
| jev-decisions/src/runtime.ts:125-172; consumer.ts:15-22 | LiveObservation/Usage/Cost and SupportTriageAdvisory are fixed Jev support-triage contracts, not a generic routing event sink. No Jev edit or call proposed. |

C/D draft source reference is commit
`a44ecec91097783730cce85ca4b103fbbbfc2fd2`, inspected via git show from the separate
P2D shaping worktree. At that commit, PMC-P2C-same-process-launch-controller.md
lines 68-85 define audit-only LaunchReceiptV1/LaunchResultV1; lines 495-496 say
null receipt never implies no liability. PMC-P2D-openrouter-terminal-transport.md
lines 58-62 define Charge/Observation; lines 404 and 467-476 preserve raw charge
precision and distinguish Pi tariff estimates. These inspected revisions differ
from the older draft copies on this base. Source implementation is still required.

The cache amendment reviewed at `e5ae1c3848544aeb08992a8607cb7c67bb548858` is
reported ratified by the coordinator after two reviews. Charter edits are a
separate coordinator action. This shape records choice-cache status disabled,
zero choice-cache events and no validator-as-choice-cache relabeling. Negative
catalog caching/refresh coalescing remain chartered; this slice does not ship them.

## Proposed decisions requiring owner disposition

Coordinator direction adopted after targeted feasibility review: the revised
draft below implements these choices, still subject to independent design review
and exact owner release. Original shape aad7e7769773bd9d0ab810c7da5de3a043221fa1
did not include the discovered final-D/fixed-sequence integration prerequisites.

| ID | Proposed smallest disposition | Blocking consequence if not accepted |
|---|---|---|
| P3-D1 Capture/publication split | Restrict initial production and measurement to legitimate checkpoint-capable Foreman parcels. Capture all admitted invocations/events, then publish at final checkpoint. | No fixture-only full delivery or release-wide cost claim. |
| P3-D2 Canonical placement | Genuine declared measurement claim AFTER all measured invocations/checks, BEFORE new final-D stage handoff. Keep dispatch-tip guard and existing envelope. | New verification finalization and integration actual-sequence contracts are prerequisites. |
| P3-D3 Writer custody | Private installation session captures genuine stage functions, phase/busy before callbacks across awaits; all admitted writers serialize, publication uses exclusive create. Cooperative one-writer process only. | No global/hostile-process lock claim; independent concurrent writers would require separate shared-append adoption. |
| P3-D4 Private owner projections | C/D approve minimized authenticated event hooks and usage/timing/identity projections; public launch receipt and mandatory gates unchanged. | Existing LaunchReceipt/Observation do not supply every D5 field; freeze actual hook paths after source acceptance. |
| P3-D5 Non-parcel and crash completion | Standalone production CHECKPOINT_REQUIRED before effects until separate reviewed contract. External declared denominator detects missing capture; existing ledger.snapshot reports aggregate liability only. | Missing evidence blocks measured success/savings. No universal crash reconstruction requirement and no inferred zero events/charges. |

No successful standalone production launch is activated by this release. Its
typed refusal precedes acquisition/reservation/credentials/send. The external
denominator is owner-declared before admission, retained in real parcel/experiment
evidence, and cannot be minted or reduced by the volatile collector. Match exact
planned/admitted/refused/completed/missing identities. Missing denominator itself
blocks completeness. Crash with no returned report cannot attest its own loss;
compare against external evidence and mark coverage unproven. An actual snapshot
can report settled/outstanding amounts without event reconstruction or savings.

## Newly verified finalization and integration gap

Actual runHarness awaits matrix checks before it writes claims
(verification/src/harness/index.ts:719-739). Publishing immediately after
BuildResult would miss later measured checks. Admission closes only after all
admitted inference/check work, and no later launch is accepted in that scope.

emitVerificationVerdict (verification/src/pipeline/index.ts:801-941) emits a
VerificationVerdict CLAIM receipt plus a StageOutput envelope. There is no final
kind:stage D producer on this path. Proposed new private finalizeMeasuredStageDV1
must validate the genuine pass verdict/envelope, measurement coverage/denominator,
receipt references/hash/correlation and actual tip, then emit a separate approved
MeasuredVerificationHandoff stage profile. It does not turn a claim into a stage
or bypass judgment, human approval, rework, CI or integration gates.

Actual integration/src/exit-vehicle.ts:278-309,338,365 pins kind:stage D at exactly
3 and E at exactly4. Its real runners cannot continue a longer claim-bearing
workflow unchanged. The separate integration-owner amendment must preserve those
runners and their substantive gates, accept actual sequence ONLY under the
approved measured-handoff profile, and continue to reject claim predecessors,
wrong stages, gaps/duplicates, correlation forks, stale tips and forged handoffs.
Keep the old six-stage path valid. Using lower-level emitIntegrationReceipt or
emitClosureReceipt to avoid these checks is expressly excluded.

Private session lifecycle is capturing -> draining -> publishing -> finalized-D
-> integrated-E -> sealed-F, with held on uncertain writes. Busy is acquired
before callbacks and held across awaits; recursive/concurrent entry refuses.
All admitted genuine writers run through it. Raw exports outside this installation
remain independently callable: no hostile-code/process guarantee follows. A
later unexpected disk tip causes hold, not a retry or relabeling of evidence.

## Wrong-but-literal checks

- Append at C because selection happened there: rejected; actual BuildResult
  guard expects the dispatch receipt as tip.
- Give a CLI launch a random workflow and genesis: rejected; UUID validity does
  not establish a real workflow or approved claim.
- Return LaunchReceipt.ok as successful model execution: rejected; disposition
  distinguishes no-send, failed-settled, success and uncertainty.
- Treat null receipt/cancelled actual as zero account charge: rejected; retain
  null/unknown and report only acknowledged owner facts.
- Sum every settlement callback: rejected; proof replay is delivery duplication,
  while a distinct R2 request is a real attempt and must remain counted.
- Use Pi usage costs as actual billing or round fractional microUSD: rejected;
  only authenticated ledger actual counts, with estimates separately labeled.
- Add a lock file while other writers ignore it: rejected; no exclusive custody
  is established. Existing writeReceiptDocument is not an atomic append API.
- Treat existing verdict emission as final-D stage: rejected; actual emitter
  produces a claim and envelope, requiring a separately implemented owner stage.
- Remove all sequence checks in runStageE/F: rejected; measured-profile admission
  retains actual contiguous chain, stage/kind, correlation and tip checks.
- Ignore collector overflow/crash and report complete: rejected; coverage states
  and bounded incomplete reasons are mandatory, and process loss may leave no
  evidence at all. No total-spend/savings claim from a partial known subtotal.

## Dependency and proposed file split

1. Independently review the adopted P3-D1 through D5 direction and exact owner
   contracts; reconcile cache amendment into charter separately.
2. Accept actual C/D/E and B1 composition, then freeze concrete private hook paths
   against those implementations. No production hooks are assumed from draft text.
3. Shape/release capture: dispatch/src/pmc-launch/telemetry.ts and
   dispatch/tests/pmc-telemetry.test.ts plus exact accepted C/D hook/test paths.
   Separately freeze actual installation ownership for proposed
   dispatch/src/pmc-launch/measured-workflow.ts and
   dispatch/tests/pmc-measured-workflow.test.ts; reconcile dependency direction
   with actual E source before dispatch, never introduce a package cycle.
4. Verification prerequisite: verification/src/harness/routing-telemetry.ts,
   verification/tests/routing-telemetry.test.ts,
   verification/src/pipeline/stage-d-finalization.ts and
   verification/tests/stage-d-finalization.test.ts; pipeline/index.ts only if a
   reviewed genuine verdict-emission hook is needed. No public barrel assumed.
5. Integration prerequisite: integration/src/exit-vehicle.ts,
   integration/tests/exit-vehicle.test.ts and integration/tests/closure.test.ts.
   Test real longer measured D/E/F and unchanged historical path; no emitter bypass.
6. Produce docs/goals/hybrid-routing-optimization/hro-p3-baseline.md from explicit
   workloads and evidence. Offline counts/arithmetic are distinct from live proof.

All paths above are plugin-relative proposals, not current write authority.
If actual hook, claim or custody mechanisms need additional files, a separate
exact scope is prerequisite. No second ledger or generic event platform is part
of this design. No source, test, manifest or generated schema is changed now.

## Validation and readiness

Shaping validation uses the existing frozen spec-linter in the P1a donor checkout
and Node24.19.0; no install or dependency junction modification. Check required
body sections, local Markdown references and git diff/scope separately because
frontmatter success alone does not check those properties.

The future acceptance matrix must use actual resolver/ledger/receipt modules,
prove distinct invocations versus replay, and execute the full existing receipt
flow around the proposed checkpoint. Live provider use requires the separately
authorized P6 gate, genuine billing-bound evidence and budget. No tests, timing,
cost savings or production completeness have been claimed by these drafts.

Independent design review and Gate 2 are pending. The author does not approve
this shape. Local lint/commit only; no push, merge or runtime release.
