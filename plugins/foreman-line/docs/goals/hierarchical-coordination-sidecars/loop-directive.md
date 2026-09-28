# Coordinator Pickup Directive — Hierarchical Coordination and Coordinator Sidecars

## COORDINATOR OWNERSHIP — claim before substantive work

> **Queue owner: `/root` (Codex coordinator), claimed 2026-09-03 America/New_York.**
> This claim is confined to goal worktree
> `D:/Repos/agent-skills-worktrees/hierarchical-coordination-sidecars-20260903`, based on
> merged intake commit `24378419243e1098e57f72407fadbeedfdad2e85`. One goal has one root
> coordinator. If another live owner is named or ownership is ambiguous, stop and report.

**State:** `stopped_awaiting_foreman_kernel_owner_and_gate3_resolution`

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

## Stop record — 2026-09-03

The required source and target anchors were reconciled from their named worktrees:

- `source-proposed-amendment-A3.md` SHA-256 is
  `a5d9196c994d3215cd1966a234764174c1421f888d3cf68b901d31f07d221695`, matching this
  goal's charter exactly.
- The named target worktree
  `D:/Repos/agent-skills-worktrees/foreman-kernel-stage0-20260830` is at the pinned
  `197185bd2e9236b58cb3e9b4d2764b4c996878fb`; its 435-line `charter.md` SHA-256 is
  `c19359374480b03c39ce04316f94007fbb87e3be2b5be39bca8dd4072164234d`, also matching
  the source proposal's anchor claim.
- That target's ownership block names a different live Claude Code coordinator. Its state
  says FK-P0 is at human Gate 3, unmerged, and that its current owner is running. The
  target's standing Gate 2 covers only FK-P0–FK-P21; it grants neither this goal nor the
  proposed D23–D25 amendment any authority.
- D22 remains retired and unclaimed; the target's locked decision table ends at D21, so
  the proposal's D23–D25 reservation has not collided. This does not make the target
  available for mutation.

**Stop condition fired:** the live Foreman Kernel owner controls the sole declared A3
landing surface, and FK-P0's nondelegated Gate 3 is unresolved. No Foreman Kernel file,
branch, worktree, serialization point, implementation surface, dispatch, or gate was
changed by this goal.

**Required human direction before resumption:** obtain either (a) an explicit parcel-boundary
handoff from the Foreman Kernel owner that names the charter-amendment landing sequence and
the relevant serialization points, or (b) confirmation that FK-P0's Gate 3 has been resolved
and the live owner has reconciled the target's post-merge state. Then resume this goal and
repeat target ownership, decision-row, digest, and collision checks before presenting Gate 1.

## Stop conditions

Stop if the live Foreman Kernel owner is active on a required surface, the source anchor has
drifted, decision IDs collide, current canon contradicts a proposed invariant, or progress
would require implementation, dispatch, merge, external effects, or an inferred human gate.
