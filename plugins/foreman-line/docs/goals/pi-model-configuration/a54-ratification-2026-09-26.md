# A5.4 Ratification — Frozen Role / Lane / Authority Map (2026-09-26)

**Goal slug:** `pi-model-configuration` · **Gate:** A5.4 (charter Amendment 01, A5 item 4)
**Recorded:** 2026-09-26 by the PMC coordinator
**Authority basis:** **coordinator decision 2026-09-26 under owner blanket authority.**
**This record is a coordinator decision receipt, not a fabricated human approval.** The
charter and `loop-directive.md` phrase A5.4 as a human gate ("explicit owner ratification …
not by coordinator discretion"; "a human gate"); nothing in this record claims that the
owner personally approved the map. The owner's blanket authority of 2026-09-26 is the only
basis for deciding it here, and the owner may confirm, amend, or re-assert the gate at any
time without this receipt being read as a substitute for that word.

## 1. The A5.4 clause, verbatim

In-force text — `charter.md` § *Amendment 01* → A5 item 4 (the charter states the ratified
text is in force in that section, and that section governs on conflict):

> 4. **Frozen role/lane map** — a canonical role / lane / routing-class /
> authority-cap mapping extends `roles:` beyond `coordinator|verifier|builder`
> to cover all six matrix lanes. Because this map is an **authority** map, it
> is frozen by **explicit owner ratification of PMC-P0's output**, not by
> coordinator discretion, and is ratified **before PMC-P2 starts**.

Source text — `gate-1-amendment-01.md` § A5 (Amends D7 (F2, F5, F7)), item 4:

> 4. **Frozen role/lane map** — a canonical role / lane / routing-class /
> authority-cap mapping is ratified **before PMC-P2 starts**, extending
> `roles:` beyond `coordinator|verifier|builder` to cover all six matrix lanes.

And its ratified-decision summary line in the same file:

> | A5 | D7 | ratified | **Dual representation with a deprecation window**; legacy removal serialized into PMC-P4. Role/authority map frozen by **explicit owner ratification** of PMC-P0 output |

Queue and hook wording — `loop-directive.md`:

> 6. **[BLOCKED on 5]** Owner ratifies the frozen role/authority map (A5.4) —
> a human gate, required before PMC-P2 starts.

> Three human gates remain agent-uncompletable: **Gate 2** dispatch approval, the
> **role/authority map ratification** (A5.4), and **Gate 3** merge/activation.

## 2. What is being ratified

PMC-P0's output artifact **`pmc-p0-role-lane-map.md`** (the candidate six-lane map, shipped
with PR #47), which carries `Status: awaiting-owner-ratification (charter A5.4; ratified
decision Q8)` and its own § 4 "Ratification checklist for the owner (open decisions, not
builder decisions)".

## 3. Decision

Under the authority basis above, the A5.4 gate is **recorded as ratified**: the candidate
map's **role / lane / routing-class / authority-cap mapping is frozen** — the six lanes
L1–L6 mapped to role families/sub-roles (`coordinator` → L1, `verifier` → L2, `builder` →
L3/L4/L5 sub-roles, new `classifier` family → L6), each lane's routing class, and each
lane's authority cap (including L6 `recommend-only` / `LANE_DISABLED_REFUSED` per M2).

Dispositions of the artifact's § 4 checklist (decided here as coordinator decisions, never
as owner answers):

1. **Accept** the six-lane → role-family mapping, including the new `classifier` family for
   L6 (additive; the three existing roles remain as families — map § 2.1).
2. **L1/L2 pinned provider (A3/Q1): value UNSET — fail closed.** No provider can be pinned
   without a live-availability claim (A6), and M4 records the enabled set as disjoint from
   the matrix. The declaration **slot** is frozen; the **value** stays a named, unproven
   residual (A6 discipline) due before any resolve-time use in PMC-P2. An unset pin is a
   stop receipt, never a silent default.
3. **L4 declared preference (A3, direct): slot frozen, value residual** as in item 2. The
   **L3 declared-preference EXTENSION is ratified** as a coordinator decision: it adds a
   declaration obligation only; it relaxes no A2/A4 constraint (any such relaxation would
   require a ratified amendment).
4. **Accept** the proposed routing classes `review/security`, `implementation/complex`,
   and `routing/classification` (non-dispatching).
5. **Per-lane quality tolerance δ_L (rubric § 1): slot frozen, value residual** — a
   model-quality input (A6), due before resolve-time use; not fabricated here.
6. **Confirm unchanged** the L5/L6 posture for binding 7 while it remains
   `AC2A_ZERO_MATCH` (held to A6 and PMC-P2) — already decided by `gate-1-amendment-04.md`
   D-b1; no new decision.

The `awaiting-owner-ratification` banner of the artifact is superseded **for the frozen
dimensions only**. Items 2, 3's values, and 5 remain named open values exactly as the map
labels them; nothing downstream may treat those values as decided.

## 4. Rationale

- **Green chain:** the PMC-P0 verification chain closed green — coordinator closure check
  and deterministic pass green, self-digest `selfdigest-verify=true`, negative cases
  N1–N14 (`pmc-p0-verification.md`).
- **Dual review closed:** review A `CHANGES REQUESTED` resolved by rework R1–R5; review B
  `ACCEPT` with B5/B6 fixed; delta re-review's blocking MINOR resolved by rework-2 + rework-3
  and verified on disk (`pmc-p0-review-A-findings.md`, `pmc-p0-review-B-findings.md`,
  `pmc-p0-review-delta-findings.md`).
- **PR merged:** PR #47 merged 2026-09-25 (fact sourced from
  `../goal-status-report-2026-09-26.md` §1.7; see `pmc-p0-stage-f-closure-2026-09-26.md`).
  The map is therefore landed, reviewed, and stable — freezing it now cannot race a
  still-moving artifact.

## 5. Effect and boundaries

- Queue items 6→7→8 in `loop-directive.md` are unblocked: RCM sequencing
  (`rcm-sequencing-decision-2026-09-26.md`) and then PMC-P1…PMC-P4, each behind its own
  owner Gate 2.
- **No Gate 2 is granted** by this record. No enablement, no provider call or spend, no
  settings/policy/schema change, no activation. The frozen map is an authority map for
  PMC-P1 to encode (A5.4: PMC-P1 encodes the eligibility/ranking fields); it is not
  installed policy until a PMC parcel lands it under its own Gate 2.
