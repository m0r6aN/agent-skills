# Coordinator Pickup Directive — Hierarchical Coordination and Coordinator Sidecars

## COORDINATOR OWNERSHIP — claim before substantive work

> **Queue owner: CLAIMED 2026-09-26.** Claimed by the coordinating session of the
> 2026-09-26 owner-directed wave, executed by its `HcsStageZero` builder slice
> (task/session id `HcsStageZero`), timestamp 2026-09-26, authority basis:
> coordinator decision 2026-09-26 under owner blanket authority (coordinator decision
> receipt — not a human approval). One goal has one root coordinator (charter D2); root
> ownership is unsplit. Claim evidence: `hcs-stage-zero-2026-09-26.md` §1 (includes the
> recorded execution-locus deviation). If another live owner is named or ownership is
> ambiguous, stop and report.

**State:** `claimed; stage_zero_done; gate_1_recorded; p0_shaped; p0_records_produced;`
`p0_reworked_post_review; p0_accepted` — **HCS-P0 ACCEPTED 2026-09-26**: dual delta
re-review APPROVE WITH NITS ×2 (`hcs-p0-review-a-findings.md`, `hcs-p0-review-b-findings.md`
delta sections), dispositions in `hcs-p0-verification.md` §9, acceptance in
`hcs-p0-acceptance-2026-09-26.md` (F12 resolved by coordinator confirmation; RB-01 carried
to P1). Next: HCS-P1 shaping (updated 2026-09-26; see `hcs-stage-zero-2026-09-26.md`,
`gate-1-ratification-2026-09-26.md`, `hcs-p0-authority-and-collision-map.md`,
`hcs-p0-verification.md`, and `../../specs/active/HCS-P0-authority-and-collision-reconnaissance.md`)

**Pickup precondition:** claim from a dedicated goal worktree after this intake commit is
merged, or from a dedicated worktree based on the exact intake commit. Do not run either
queued goal from the shared registration worktree.

**Entry prompt:**

```text
/goal resume hierarchical-coordination-sidecars
```

## Purpose of this pre-Gate-1 directive

This file makes the requested goal discoverable and resumable before a coordinator has
claimed it. It grants no implementation authority. After Gate 1 and the mandatory plan
review, the owning coordinator replaces this file with the full parcel-loop directive and
records the ratified standing authorizations verbatim.

## Intake queue

1. Claim ownership in this block at a parcel boundary.
2. Verify `source-proposed-amendment-A3.md` against the SHA-256 pinned in `charter.md`,
   then read both files completely.
3. Reconcile the live Foreman Kernel goal, its ownership block, branches/worktrees, current
   decision sequence, and all overlapping serialization points.
4. Verify the source proposal's anchor claims against current disk state. Historical or
   cross-worktree claims are inputs, never assumed facts.
5. Interrogate unresolved Stage Zero decisions and present the final decision list, parcel
   graph, exit criterion, and requested gates for explicit developer Gate 1 ratification.
6. After Gate 1, dispatch the mandatory fresh plan-level adversarial review. Triage it and
   reopen Gate 1 only for decision-changing findings.
7. Replace this pickup directive with the full coordinator loop and request the scoped
   Gate 2 grant. Do not dispatch before then.

## Current authority

- Goal creation and coordinator pickup are requested by Clinton Morgan on 2026-09-03.
- Gate 1 is not granted.
- Gate 2 is not granted.
- Gate 3 is not delegated.
- No Foreman Kernel ownership transfer is granted.
- Update 2026-09-26 (lines above preserved as the 2026-09-03 intake authority set): Gate 1
  is **recorded** as a coordinator decision receipt under owner blanket authority —
  "coordinator decision 2026-09-26 under owner blanket authority", not a human approval
  (`gate-1-ratification-2026-09-26.md`). Gate 2 remains not granted; Gate 3 remains not
  delegated (human-owned); no Foreman Kernel ownership transfer is granted.

## Stop conditions

Stop if the live Foreman Kernel owner is active on a required surface, the source anchor has
drifted, decision IDs collide, current canon contradicts a proposed invariant, or progress
would require implementation, dispatch, merge, external effects, or an inferred human gate.
