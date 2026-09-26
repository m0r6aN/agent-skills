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

| ID | Proposed smallest disposition | Blocking consequence if not accepted |
|---|---|---|
| P3-D1 Capture/publication split | Accept bounded private process capture as partial measurement only; canonical publication is separate. Preserve D5 gap for standalone/crash evidence. | Do not describe checkpoint fixtures as complete telemetry or release-wide cost evidence. |
| P3-D2 Canonical placement | Verification owner approves one genuine declared measurement claim immediately after BuildResult, before verification claims. Keep dispatch-tip guard and existing envelope intact. | No receipt publication; no fake claimRef/workflow or parallel chain. |
| P3-D3 Writer custody | Restrict first adoption to demonstrably exclusive coordinator workflow custody, with all writers quiescent, plus exclusive file creation and exact replay/conflict checks. Freeze actual installation mechanism. | Existing read-then-overwrite APIs cannot establish it. A common append/custody prerequisite needs its own exact owner scope if exclusivity cannot be established. |
| P3-D4 Private owner projections | C/D owners approve minimized authenticated event hooks and observed usage/timing/identity projections, preserving mandatory audit and launch semantics; public launch receipt unchanged. | Existing LaunchReceipt/Observation alone cannot supply all D5 fields. No guessed usage/cost/served identity. |
| P3-D5 Non-parcel and crash completion | Either constrain the measured release use case to a real checkpoint-capable flow or separately shape durable non-parcel observation custody with receipt owner. Reconcile full HRO D5 before completion. | Standalone CLI and crashed collectors remain incomplete/unpublished; this draft grants no waiver of their events. |

P3-D1 is deliberately a scope disclosure, not permission to drop required events.
A successful standalone launch cannot be retroactively assigned to a fabricated
parcel. A crash with no returned report cannot even attest its own incomplete
record; external baseline accounting must mark coverage unproven. A new process
must not interpret an empty collector as evidence of zero historic calls/spend.
This is why this slice is not a full D5 delivery and requires D5 disposition.

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
- Ignore collector overflow/crash and report complete: rejected; coverage states
  and bounded incomplete reasons are mandatory, and process loss may leave no
  evidence at all. No total-spend/savings claim from a partial known subtotal.

## Dependency and proposed file split

1. Ratify P3-D1 through D5 and reconcile cache amendment into charter separately.
2. Accept actual C/D/E and B1 composition, then freeze concrete private hook paths
   against those implementations. No production hooks are assumed from draft text.
3. Shape/release capture: dispatch/src/pmc-launch/telemetry.ts,
   dispatch/tests/pmc-telemetry.test.ts plus exact accepted C/D hook/test paths.
4. Shape/release checkpoint adoption: verification/src/harness/routing-telemetry.ts,
   verification/tests/routing-telemetry.test.ts, verification/src/harness/index.ts,
   verification/tests/chainwalk.test.ts, integration/tests/closure.test.ts.
   This is conditional on legitimate claim declaration and enforced writer custody.
5. Produce docs/goals/hybrid-routing-optimization/hro-p3-baseline.md from explicit
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
