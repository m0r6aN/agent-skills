# HCS Gate 1 — charter-scope ratification record — 2026-09-26

**Goal:** `hierarchical-coordination-sidecars`
**Record:** Gate 1 ratification — **coordinator decision receipt, not a human approval**
**Date:** 2026-09-26
**Authority receipt line:** coordinator decision 2026-09-26 under owner blanket authority

> **Receipt character.** The line above is the complete authority basis for this record. It
> is a coordinator decision made under the owner's 2026-09-26 blanket authority (the same
> basis recorded in `fk-p0-canon-authority-enforcement-registry.md` §1/§9). It is explicitly
> **not** a fabricated human approval and does not impersonate the developer. The charter's
> exit criterion 2 — the developer's explicit ratification of the final locked decisions,
> graph, and standing gates — remains an open, named human receipt to be recorded when the
> owner issues it; nothing here manufactures its satisfaction.

**Cross-references:** [`charter.md`](charter.md),
[`hcs-stage-zero-2026-09-26.md`](hcs-stage-zero-2026-09-26.md),
[`source-proposed-amendment-A3.md`](source-proposed-amendment-A3.md),
[`loop-directive.md`](loop-directive.md),
[HCS-P0 shaped spec](../../specs/active/HCS-P0-authority-and-collision-reconnaissance.md).

## Decision HG-1 — ratified scope

The charter scope is **ratified as bounded by the A3 seam and the Stage Zero
reconciliation** of 2026-09-26. Concretely ratified:

1. **Objective** as written in `charter.md`: carry the hierarchical-coordination contract
   through authority reconciliation, Gate 1, implementation, integration proof, and closure;
   remove the owning coordinator's personal scheduling/adjudication queues as throughput
   bottlenecks without splitting root accountability, weakening independent verification, or
   creating a shared global coordinator.
2. **The reconciled decision list** — the charter's locked decisions **D1–D7** (design
   baseline = A3's hierarchy, coordinator-scoped sidecars, and structural roll-up rules;
   single root owner; deterministic scheduler + stateless adjudicator pool; neutral shared
   infrastructure; roll-ups as claims against canonical evidence; contract-first fail-closed
   implementation; Gate 1/Gate 3 standing) — carried in HCS canon. A3's D23–D25 FK-canon text
   remains a **proposal** and is not ratified into FK canon by this record (Stage Zero §3.1).
3. **The reshaped parcel graph HCS-P0–HCS-P7** with each parcel's landing seam in the
   reconciled FK owner, per Stage Zero §4. HCS-P0 is shaped
   ([spec](../../specs/active/HCS-P0-authority-and-collision-reconnaissance.md)); no other
   parcel is dispatchable by this record.
4. **The proposed exit criterion** (charter items 1–8), unchanged.
5. **Standing gates** as recorded in the gate table below.

## Bounds (what this ratification is limited by)

- **The A3 seam.** A3's §3 targets and its D23–D25 text land in the FK charter only through
  the Stage Zero §3.1 safe sequence (FK owner-of-record handoff → FK Gate-3 merge →
  pre-transcription decision-row re-sweep → FK-owner scoped Gate-1 disposition at the
  re-anchored targets). Until then A3 is a proposal carried as HCS design baseline. Stale A3
  anchors are dispositioned in Stage Zero §3.3 and may not be cited as current state.
- **The Stage Zero reconciliation.** The live FK state of 2026-09-26 (FK-P0 record-level
  complete; code registry accepted but Gate-3-pending and unmerged; FK branches pending human
  Gate-3 merge; FK-P1 not started; FK owner-of-record unreconciled) binds this scope. No FK
  charter, branch, worktree, or owned serialization point may be edited outside the §3.1 safe
  sequence. The FK-P10 lease question is carried as reuse-or-amend into HCS-P1 shaping
  (Stage Zero §3.2); it is not decided here.

## Rationale (citing the reconciliation)

The Stage Zero reconciliation shows the coordination seam is deliberately held open by the
live FK charter ("Preserve neutral kernel contracts for those future consumers"), so the
scope can be ratified now without an FK ownership transfer or FK edit: the FK-P0 record-level
registry already names the contract/state-authority seams HCS builds on, while the only path
that could change those seams — the human Gate-3 merge of `authority-registry/` — remains
human-owned and unmerged. Because the merge is still open and FK-P1+ is unstarted, the scope
is bounded to records/canon work plus HCS-P0 shaping; implementation parcels stay behind the
Gate 2 request and the named safe sequence. A3's decision-ID reservation remains
collision-free on today's re-sweep (no FK decision row after D20; D21 unratified in live
canon, Stage Zero §3.3 row 2), so ratifying HCS D1–D7 as the design baseline creates no
decision-ID collision. The reconciliation also confirms the charter's own stop conditions are
live: nothing in this scope splits root ownership, widens delegated authority implicitly, or
consumes a coordinator turn for scheduler progress.

## Gate table — every line with its authority basis

| Gate line | Status | Authority basis |
|---|---|---|
| **Gate 1** — charter-scope ratification as bounded above | **Recorded 2026-09-26** as HG-1, a coordinator decision receipt (not a human approval) | coordinator decision 2026-09-26 under owner blanket authority (receipt line above); charter: "Gate 1: the claiming coordinator presents the reconciled decision list" |
| **Gate 2** — parcel dispatch | **Not granted by this record.** Request only for the final named parcel graph after Gate 1 and the mandatory plan-level adversarial review; the review is dispatched next per `loop-directive.md` intake queue item 6 | charter "Human gates and requested standing authority"; coordinator decision 2026-09-26 under owner blanket authority does not pre-empt the charter's plan-review condition |
| **Gate 3** — merge, release, spend, and other consequential external effects (default-route/external-effect class) | **Remains human-owned. Not delegated.** This ratification grants **no merge, release, or spend authority** — no commit, push, merge, publication, deployment, provider spend, external mutation, or production activation is authorized by it | charter D7 ("Gate 1 and Gate 3 remain human-owned"); owner blanket authority does not delegate Gate 3; FK registry §1 ("Gate 3 merge \| Human-owned, not delegated") |
| FK ownership transfer | None granted or requested | charter "Provenance and authority": "this charter creates neither"; FK owner-of-record handoff remains open (reconciliation row 16) |
| Human ratification of the final locked decisions, graph, and standing gates (exit criterion 2) | **Open.** Not satisfied by this record | charter proposed exit criterion 2; this receipt is labeled coordinator decision, not human approval |

## Effect and next steps

This ratification authorizes: the claimed Stage Zero state, HCS-P0's shaped spec as the
dispatchable work order once Gate 2 covers it, and the coordinator's next operational step of
dispatching the mandatory plan-level adversarial review and then requesting the scoped Gate 2
grant for the HCS-P0–HCS-P7 graph. It authorizes no code, merge, release, spend, dispatch
outside the charter's Gate 2 path, FK edit, or ownership transfer.

**Next (per [`loop-directive.md`](loop-directive.md) state):** plan-level adversarial review →
scoped Gate 2 request → P0 implementation dispatch.
