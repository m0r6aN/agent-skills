# Amendment A2 — PARKED, and the risk it leaves unowned

## Status

**PARKED by developer ruling, 2026-09-01.** Not ratified, not withdrawn, not superseded.
A2, A2-r2, A2-r3, and A2-r4 remain on disk as the drafting record. None is in force.
No row for any of them exists in the charter's §4.1 ratification ledger, and none may be
added without a fresh Gate 1 act.

## What was parked

Four drafts of a charter amendment intended to bind **CI backstop host independence** —
the property that FK-P18's backstop executes somewhere the hook it backstops does not.

| Draft | Reviews | Outcome |
|---|---|---|
| A2 | 2 independent | REQUEST CHANGES — obligation not dischargeable inside Allowed Files |
| A2-r2 | 2 independent | REQUEST CHANGES — deadlocked by making every case a violation |
| A2-r3 | 1 completed (reviewer E lost mid-run) | REQUEST CHANGES — 5 BLOCKER; deadlocked through the opposite door |
| A2-r4 | 0 | Never reviewed; blocked on A1.8 |

Five completed independent reviews across three rounds, every one returning REQUEST
CHANGES. Zero drafts reached ratification. The drafting record consumed the majority of
the goal's Stage-Zero effort after 2026-08-31 and produced no binding text.

## Why it was parked rather than iterated

The developer's ruling on 2026-09-01 was to park A2 and put the effort into landing
FK-P0. The coordinator's reading of the review record supports it: the three failures
were not variations on one fixable defect but the same structural problem approached
from three directions — **each draft tried to make the charter bind something outside
the repository**, and the repository cannot carry evidence for a claim about a
provider's settings, a machine's software inventory, or a control the governed party
owns. A2-r4 narrowed to the one externally verifiable fact (Sigstore attestation of
provider-hosted execution), which is the correct shape, but it arrived unreviewed and
blocked on a prerequisite that itself carries a known defect.

Parking is a scope decision, not a verdict that r4 is wrong.

## The risk this leaves unowned — recorded, per A2's own rejection clause

A2's ratification section states that rejecting it "leaves the ADR's recommendation
advisory, in which case the latency question should be recorded as a known unowned risk
rather than silently dropped — the failure mode it describes does not stop existing
because the amendment was declined." This section is that record.

**Unowned risk U1 — FK-P18's backstop independence is unbound.**
ADR-001 (ratified) argues at §Consequences that "FK-P18's value derives entirely from
executing somewhere the hook does not," and recommends the parcel's spec state that
property explicitly in its acceptance criteria. No ratified charter text requires it.
The concrete failure mode: a later convenience change moving CI to a self-hosted runner
on the enforcement laptop would **silently void the backstop while every check stays
green**. Nothing in the charter would refuse that change, and nothing would detect it.

**Owner:** none. **Detection today:** none.

**Where it must be picked up:** FK-P18 shaping. That parcel cannot be dispatched without
either (a) a ratified amendment binding the property, with A2-r4's Sigstore-attestation
shape as the strongest candidate on record, or (b) an explicit, developer-ratified
acceptance that FK-P18's backstop carries no independence guarantee — which materially
weakens the goal's enforcement claim and should be stated in the exit evidence rather
than assumed.

**This record is a stop condition on FK-P18, not a note.** A coordinator reaching FK-P18
with U1 still unowned stops and reports.

## Reading order for whoever picks this up

1. `ADR-001-runtime-infrastructure-posture.md` §Consequences — the source recommendation.
2. `proposed-amendment-A2-r4-backstop-independence.md` — the narrowest and best draft.
3. `A2-r3-adversarial-review-findings.md` — the review that verified the external fact
   against primary sources; its B1–B4 are the traps r4 was written to avoid.
4. `A2-adversarial-review-findings.md` and `A2-r2-…` — why the wider claims failed.
