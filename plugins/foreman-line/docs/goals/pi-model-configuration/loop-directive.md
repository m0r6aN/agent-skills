# Loop Directive — Pi Model Configuration

**Goal slug:** `pi-model-configuration`
**State:** `BLOCKED — GATE 1 RE-OPEN ON MODEL IDENTITY (M1–M4)`
**Cleared:** `gate-1-amendment-01.md` (A1–A8) ratified in full 2026-09-23
**Blocking artifact:** `coordinator-lint-pmc-p0.md` (findings L1–L4, items M1–M4)
**Next human gate:** ratify M1–M4, then Gate 2 dispatch approval for PMC-P0

## Ownership block

| Field | Value |
|---|---|
| Coordinator | **claimed** by this Pi session on 2026-09-23 at the PMC-P0 boundary, on the owner's explicit direction ("Yes claim the coordinator role and open the PMC-P0 shaping session now") |
| Claim rule | one goal, one coordinator; transfers only at a parcel boundary |
| Owner | Clinton Morgan |
| Last state change | 2026-09-23 — coordinator claimed; PMC-P0 shaping attempted and **stopped** by coordinator lint |

The PMC-P0 shaping session opened, ran coordinator lint first, and stopped
before writing a spec draft: the lint falsified load-bearing charter claims
(see `coordinator-lint-pmc-p0.md`). No spec draft and no `ShapingResult` were
emitted. Ownership is recorded so a later `/goal resume` does not re-claim
blindly; transfer only at a parcel boundary.

**Cross-goal sequencing note.** Routing Currency and Merit is live under Claude
Code coordinator session `e45b4d47-8455-49e9-9629-31c713c1b356` (state
`RCM-P0-closed-incomplete`, RCM-P1 held) and owns both the `routing-policy/`
surfaces PMC-P1/P2 must change and the `host-owner-export/` evidence this lint
consumed. PMC-P0 does not collide on files; **PMC-P1 and PMC-P2 do** and must be
sequenced with that coordinator before Gate 2 — never co-owned.

## Standing authorizations (verbatim, with contingencies)

| Gate / action | State |
|---|---|
| Gate 1 — original D1–D8, matrix, parcels, exit criterion | Ratified 2026-09-23 |
| Scoped Gate 1 re-open — A1–A8 | **Ratified in full 2026-09-23 — closed** |
| Plan-level adversarial review | Complete; `REQUEST CHANGES` recorded |
| Gate 2 — dispatch PMC-P0–PMC-P4 | Not granted |
| Pi config / Foreman source / templates / tests | Not granted until per-parcel Gate 2 |
| Credential inspection, provider call, spend | Not granted; separate per-test authority |
| Gate 3 — merge, release, install, default-route activation | Not granted |

## Queue (strict order, all blocked)

1. **[DONE]** Owner ratifies A1–A8 → scoped Gate 1 re-open closed.
2. **[DONE]** Ratified A1–A8 folded into `charter.md` § *Amendment 01* as a
   single amendment commit, committed alone, before any code.
3. **[STOPPED]** Shape PMC-P0. Attempted 2026-09-23; coordinator lint stopped it
   before a draft. Requires M1–M4 ratification to resume.
3a. **[NEXT — human gate]** Owner ratifies M1–M4 (model identity) per
   `coordinator-lint-pmc-p0.md`.
3b. **[BLOCKED on 3a]** Re-open PMC-P0 shaping: Pi capability/catalogue baseline
   consumed through the established safe host-owner-export boundary with
   freshness treated as unratified, the A3 suitability rubric, and the candidate
   role/lane/authority map that A5.4 sends to owner ratification.
4. **[BLOCKED on 3]** Gate 2 request for PMC-P0 → dispatch builder in its own
   worktree/branch with a Step 0 restate-and-stop gate.
5. **[BLOCKED on 4]** PMC-P0 closure check → deterministic pass → **two**
   independent adversarial reviews (architecture/risk class) → triage.
6. **[BLOCKED on 5]** Owner ratifies the frozen role/authority map (A5.4) —
   a human gate, required before PMC-P2 starts.
7. **[BLOCKED]** PMC-P1 … PMC-P4 per the A7 ownership split, with legacy
   representation removal serialized into PMC-P4.

## Per-iteration algorithm

Shaping → coordinator lint (verify on disk) → Gate 2 → dispatch builder
(own worktree, Step 0 gate) → rule on flags (a real spec gap becomes a ratified
amendment committed alone before code) → completion claim mapped to evidence
with test count; wrong-shaped claims are presumptively empty → coordinator
closure check against disk **before** re-running anything → deterministic pass
→ adversarial review (fresh frontier session; two independent for
architecture/risk; reviewers never fix, never commit) → triage, reproducing
disputed findings before ruling → rework with its own Step 0 gate and
test-count tripwire → Gate 3 merge behind a green chain → stage-F closure.

## Stop conditions

All charter stop conditions remain in force. Additionally, stop and report if:

- a primary/fallback pair cannot be proved eligible for its data, tool,
  context, cost, or independence constraints;
- Pi cannot produce a durable route/handoff receipt or apply required
  provider-routing controls;
- another live coordinator claims overlapping source/configuration files;
- an action would need provider spend, credential inspection, non-public
  disclosure, installation, merge, or release without explicit authority;
- a change would weaken a frontier, security, human-gate, data-class, or
  evidence invariant;
- both members of a declared fallback pair fail, or an unlisted third fallback
  would be required.

## Hook-condition note

Three human gates remain agent-uncompletable: **Gate 2** dispatch approval, the
**role/authority map ratification** (A5.4), and **Gate 3** merge/activation. If
this goal is run under a stop-hook whose condition is phrased as any of those,
or as "charter implemented", the session will trap in a stop → feedback → stop
cycle. Agent-verifiable end states are of the form **"stop-report written and
loop stopped awaiting <named gate>"**.
