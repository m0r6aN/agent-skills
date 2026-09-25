# Carryover — Pi Model Configuration (PMC-P0 → next)

**Goal slug:** `pi-model-configuration`
**Coordinator:** claimed by this Pi session (2026-09-23, owner direction). One goal, one coordinator; transfer only at a parcel boundary.
**Owner:** Clinton Morgan

## Resume prompt (fresh session)

```
/foreman-line:goal Resume plugins/foreman-line/docs/goals/pi-model-configuration/loop-directive.md
```

Read `loop-directive.md` (state source of truth) + `charter.md` first; check the
ownership block; then continue from the recorded queue. Full dispatch/routing
canon: `plugins/foreman-line/docs/COORDINATOR-PATTERN.md` and
`plugins/foreman-line/skills/parcel-driven-development/SKILL.md`.

## Current state — AT GATE 3 (merge)

- **Branch:** `codex/pmc-p0-evidence` (worktree `D:/Repos/wt-pmc-p0`, tip `b754a50`).
- **PMC-P0 complete, verification chain green.** Evidence parcel committed; at
  Stage F pending owner Gate 3.
- **Pinned digests (re-verify on resume):**
  - spec (active) `133a7690b865d460586e77fb3ee5440116513272db299eceb52b09f8f81b72eb`
  - builder brief `f953f8abd9cb6e81c87f6091191be8a8a05ac9561469a1f693df2dd2ae1aa941`
  - catalog `b0c2dc8cf1412773b4ed4f17fcba10634a997f3b2b2b960d6dca200bdbb171fe`
  - settings `1024154d7245a52fb3cb82b3c8105a2249d5406daee03498f99cbed8ed137d1e`
  - manifest `aa9b03faff555c6f5e98fd06b0f6e940269a5393f846877f57af562d1df692c3`
  - artifacts: baseline `32b868cf…`, rubric `0a3e3b4f…`, role map `2691ea3e…`,
    verification `f06e0f4b…` (full values in `pmc-p0-verification.md` V§9).

## Next steps, in order

1. **[HUMAN — Gate 3]** Merge `codex/pmc-p0-evidence` → `main` (the PR). Never
   done by the agent.
2. **[AGENT — after merge confirmed]** Stage F closure for PMC-P0: move spec to
   `docs/specs/done/`, update the loop-directive/carryover, append any lesson to
   the ledger. Then queue item 5c clears.
3. **[HUMAN gate]** **Role/authority map ratification (A5.4)** — required before
   PMC-P2 starts; the chart is `awaiting-owner-ratification` in
   `pmc-p0-role-lane-map.md`.
4. **[SEQUENCING]** Before any PMC-P1 Gate 2: coordinate with the RCM coordinator
   (session `e45b4d47-8455-49e9-9629-31c713c1b356`) — `routing-policy/` surfaces
   are contested, never co-owned. PMC-P0 itself did not collide.

## Standing authorizations (unchanged)

Gate 1 (D1–D8 + A1–A8 + M1–M4 + Amendment 04) ratified; Gate 2 granted for
**PMC-P0 only**; Gate 3 = owner merge; role-map ratification (A5.4) = human.
No provider spend, no credential/host reads, no enablement, no policy/source
change absent a specific gate.

## Owned downstream (recorded, not blockers)

A6 live-availability/model-quality (all 15); PMC-P2 enable the 0-of-15 (M4);
PMC-P1 SCF-1/2/3 + Jev policy/test reconciliation; F-A spec-hygiene note
(`routing-policy.yaml` has no `jev`; the gap lives in `src/pi-openrouter.ts` +
tests/README/template).
