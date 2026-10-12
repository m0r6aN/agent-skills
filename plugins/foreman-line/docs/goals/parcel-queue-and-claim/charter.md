# Goal Charter — Parcel Queue and Claim (bounded horizontal fan-out)

**Goal slug:** `parcel-queue-and-claim`
**Created:** 2026-10-07
**Owner:** Clinton Morgan
**Status:** DRAFT — Stage Zero artifact, prepared for Gate 1; **not ratified**
**Coordinator:** unassigned — claim through `loop-directive.md`
**Mode:** repo-local architecture and implementation goal
**Design inputs:** `../foreman-line-boundary-routing/hawf-extract-worker-lane-contracts.md`
(extracted HAWF baseline), foreman-kernel charter §12/§15.4 (serialization,
bounded parallelism), `../../COORDINATOR-PATTERN.md`, routing-policy
Amendments 06–09 and the 2026-10-07 live probe

## Objective

Give the Foreman Line a mechanical **parcel queue with claim/lease** so that a
coordinator can fan out N builder lanes over disjoint parcels without
hand-assigning each one — and get them back through verification to a human
merge gate — while preserving every authority, independence, and serialization
invariant the line already enforces.

Today the pattern is ratified (FK §15.4) but the mechanics are manual: the
coordinator is the queue. That caps usable parallelism at what one session can
track, and it makes provider-level failures (a 403, a region refusal, a quota
wall — all observed live on 2026-10-07, probe §§5–7) into coordinator
emergencies instead of typed, routable-around events.

This goal is the queue, not the fleet. Worker hosting, sidecar schedulers,
and any shared control plane belong to other charters (HCS; FK §490 reserve).
A queue that quietly becomes a coordinator is a failure mode, not a feature.

## Provenance and authority

The deleted `heterogeneous-agent-worker-fabric` goal was superseded by
boundary-routing; its role baseline, work-graph mapping, and carry-over
constraints were extracted (link above) and are design input here — they grant
no authority. FK §15.4's bounded-parallelism doctrine is ratified law this
goal implements under, never amends. The routing policy's authority
(routes, classes, refusals, no-alias rule) is consumed, never widened —
routing cognition differently cannot widen operational authority (HAWF D8).

## Proposed locked decisions

Candidates for Gate 1. Not binding before explicit developer ratification.

| ID | Proposed decision | Reasoning |
|---|---|---|
| D1 | Scope is exactly: parcel queue, claim/lease, bounded fan-out controller, merge-arbitration seam. No worker hosting, no scheduler sidecars, no shared/global queue across goals. | The gap is mechanical, not organizational; HCS and FK own the neighboring seams. |
| D2 | Queue state is repo-local, receipt-shaped files under the goal's own directory. No daemon holds durable authority; crash recovery is lease expiry + re-claim, provable from the files. | The receipts convention already exists; a service would import availability and auth problems the line does not have. |
| D3 | A claim binds parcel id + revision-bound digest + Allowed Files set. Double-claim, stale-digest claim, and overlapping-surface claim are hard refusals with typed names. | These are the failure modes that make a compliant-looking queue unsafe (HCS D6 pattern). |
| D4 | The queue consumes routing-policy routes and receipts verbatim. Provider refusals (403/access-disabled, region, quota, missing model) are typed events: re-queue or re-route per policy — never silent model substitution (no-alias rule stands). | 2026-10-07 probe: O-2, §7.6, G-3 are exactly the events a fan-out controller must absorb without waking the coordinator. |
| D5 | Fan-out width is derived from measured host/provider capacity, class ceilings, and live contracts — no fixed fleet size is invented by this charter (FK §15.4). | Ratified doctrine; also keeps spend governance where it already lives. |
| D6 | Merge arbitration ends at a human Gate 3 per parcel, green-chain contingent. The queue orders and pre-checks; it never merges. | The three-gate model is not negotiable machinery. |
| D7 | Shared serialization points (lockfiles, manifests, shared exports, INDEX.md-class projections) stay serialized; the queue enforces Allowed-Files disjointness at claim time and sequences shared points, never co-owns them (HAWF D7). | Earned lesson: a second coordinator once committed onto a live parcel branch and was benign only by luck. |
| D8 | HAWF carry-overs D4/D5/D7/D8 apply verbatim: registry-driven model facts revalidated at dispatch, secrets by name only, no amending another live goal's charter, all existing gates in force. | Extraction terms of the superseded goal. |

## Candidate parcel decomposition

The claiming coordinator reconciles and reshapes this graph before Gate 1. No
row is dispatchable in its current proposed state.

| Parcel | Outcome | Risk / routing | Dependencies |
|---|---|---|---|
| PQC-P0 — Recon and collision map | Current-state map of `dispatch/` concurrency machinery (reserve/send idempotence, receipts), worktree mechanics, lumber-jack recovery, FK §12 serialization points, HAWF extract reconciliation; names every collision surface. | critical / architecture-risk | none |
| PQC-P1 — Queue contract | Versioned schemas: parcel envelope (id, revision-bound digest, Allowed Files, routing class, data classification), lease record, claim/release/expire transitions, typed refusal vocabulary. Spec-linter clean. | critical / architecture-risk | PQC-P0 |
| PQC-P2 — Claim/lease engine | Atomic claim, double-claim/stale-digest/overlap refusals, lease expiry + re-queue, crash-recovery proof from files alone. | critical / architecture-risk | PQC-P1 |
| PQC-P3 — Bounded fan-out controller | Dispatches up to N builder sessions from the queue with measured-capacity inputs; typed provider-refusal handling (re-queue / re-route per policy); backoff, never substitution. | critical / architecture-risk | PQC-P2 |
| PQC-P4 — Merge-arbitration seam | Completed-parcel roll-up ordering, green-chain verification assembly for Gate 3 presentation, Allowed-Files conflict pre-check, per-parcel human merge untouched. | high / architecture-risk | PQC-P2 |
| PQC-P5 — Negative controls and exit evidence | Double-claim, stale lease, mid-run provider 403/region, coordinator crash mid-fan-out, disjointness violation, queue-as-coordinator attempt; exit evidence manifest. | critical / architecture-risk | PQC-P3, PQC-P4 |

## Proposed exit criterion

This goal exits only when:

1. the developer explicitly ratifies the final locked decisions, graph, and gates;
2. a fresh plan-level adversarial review is triaged, with scoped re-ratification
   for every decision-changing fix;
3. all ratified PQC parcels complete the Foreman parcel loop and merge through
   human Gate 3;
4. one real run fans out **N≥3 builders** on disjoint parcels from the queue
   with no coordinator turn spent per claim;
5. one injected provider refusal (403/region class) is absorbed as a typed
   event and re-routed per policy, with the receipt chain showing no silent
   substitution;
6. negative controls prove double-claim refusal, stale-digest refusal,
   surface-overlap refusal, and crash recovery from queue files alone; and
7. a committed evidence manifest states what is mechanically enforced,
   detected, sampled, human-judged, unsupported, and deferred.

## Human gates and requested standing authority

- **Gate 1:** not granted. The claiming coordinator presents the reconciled
  decision list.
- **Gate 2:** not granted. Request only for the final named parcel graph after
  Gate 1 and plan review.
- **Gate 3:** not delegated. Every merge and any activation of the queue for
  real goal work remain human-owned.

## Stop conditions

Stop and report if another live goal (FK, HCS, RCM, PMC) owns a required
serialization point; a claim is issued without a revision-bound digest; two
lanes can hold overlapping Allowed Files; a provider refusal would be answered
by substituting a model id; a fixed fleet size or spend ceiling is invented;
the queue is asked to merge, ratify, or verify its own work; queue state is
shared across goals; or any human gate would need to be inferred.

## Relationship to live goals

- **foreman-kernel:** implements under §15.4; does not amend it. FK §490's
  worker-hosting reserve is untouched.
- **hierarchical-coordination-sidecars:** no shared files, no co-owned seams;
  if HCS later ships scheduler sidecars, this queue is a *consumer candidate*,
  not a dependency.
- **routing-policy (RCM/PMC windows):** this goal reads the policy and its
  receipts; edits to `routing-policy/**` follow the Window P/R sequencing
  rule and are out of this goal's write scope by default.

## Gate 1 record

_Unratified. Drafted 2026-10-07 at owner direction ("draft the charter") while
PR #155 (PMC wave 2) was in merge. The draft creates and queues the goal; it
does not ratify the proposed decisions, grant dispatch, or update the goal
index — the claiming coordinator reconciles INDEX.md at claim time._
