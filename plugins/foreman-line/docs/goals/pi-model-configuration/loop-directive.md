# Loop Directive — Pi Model Configuration

**Goal slug:** `pi-model-configuration`
**State:** `BLOCKED — AWAITING SCOPED GATE 1 RE-RATIFICATION`
**Blocking artifact:** `gate-1-amendment-01.md` (items A1–A8)

## Ownership block

| Field | Value |
|---|---|
| Coordinator | **unclaimed** — not claimed by this session |
| Claim rule | one goal, one coordinator; transfers only at a parcel boundary |
| Owner | Clinton Morgan |
| Last state change | 2026-09-23 — plan review triaged, amendment drafted, loop stopped |

This session deliberately did **not** claim coordinator ownership. The goal is
behind a human gate, so there is no parcel boundary at which to claim it and no
loop to run. A future `/goal resume pi-model-configuration` claims ownership
only after the gate clears.

## Standing authorizations (verbatim, with contingencies)

| Gate / action | State |
|---|---|
| Gate 1 — original D1–D8, matrix, parcels, exit criterion | Ratified 2026-09-23 |
| Scoped Gate 1 re-open — A1–A8 | **PENDING — blocks everything below** |
| Plan-level adversarial review | Complete; `REQUEST CHANGES` recorded |
| Gate 2 — dispatch PMC-P0–PMC-P4 | Not granted |
| Pi config / Foreman source / templates / tests | Not granted until per-parcel Gate 2 |
| Credential inspection, provider call, spend | Not granted; separate per-test authority |
| Gate 3 — merge, release, install, default-route activation | Not granted |

## Queue (strict order, all blocked)

1. **[BLOCKED]** Owner ratifies A1–A8 → close scoped Gate 1 re-open.
2. **[BLOCKED on 1]** Fold ratified A1–A8 into `charter.md` as a single
   amendment commit, committed **alone, before any code**.
3. **[BLOCKED on 2]** Shape PMC-P0 (capability/catalogue baseline + suitability
   rubric per A3). Coordinator lint every factual claim against disk.
4. **[BLOCKED on 3]** Gate 2 request for PMC-P0 → dispatch builder in its own
   worktree/branch with a Step 0 restate-and-stop gate.
5. **[BLOCKED on 4]** PMC-P0 closure check → deterministic pass → **two**
   independent adversarial reviews (architecture/risk class) → triage.
6. **[BLOCKED]** PMC-P1 … PMC-P4 per the A7 ownership split.

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

Scoped Gate 1 re-ratification is a **human** action and therefore an
agent-uncompletable condition. If this goal is ever run under a stop-hook whose
condition is phrased as "Gate 1 ratified" or "charter implemented", the session
will trap in a stop → feedback → stop cycle. The agent-verifiable end state is
**"stop-report written and loop stopped awaiting scoped Gate 1
re-ratification"** — which this directive records.
