# PROPOSED MESSAGE — NOT SENT — Wave 1 sequencing request to the RCM coordinator

**Status:** `DRAFT — NOT SENT`
**Drafted:** 2026-09-24 by the PMC coordinator
**Authority:** none. This document is a **proposed message only**. It is not
delivered, not acknowledged, and **must not be read as coordination approval**,
as an RCM commitment, or as any grant of Gate 2 for PMC-P1 or PMC-P2.
**Sending requires explicit owner direction.**

---

## Proposed message body

**To:** coordinator of goal `routing-currency-and-merit`, session
`e45b4d47-8455-49e9-9629-31c713c1b356`
**From:** coordinator of goal `pi-model-configuration`
**Subject:** Serialization request for contested `routing-policy/` surfaces

### 1. Why you are receiving this

`pi-model-configuration` (PMC) has ratified charter decisions D1–D8 plus
Amendments 01–03 and has shaped its first parcel, PMC-P0, to `draft`. PMC-P0 is
evidence-only and writes solely inside
`plugins/foreman-line/docs/goals/pi-model-configuration/`, so it does **not**
contest your surfaces.

PMC Wave 1 does. Before requesting Gate 2 for PMC-P1 or PMC-P2, PMC must
serialize with you rather than co-edit.

### 2. Contested paths

PMC-P1 and PMC-P2 must modify:

| Path | PMC parcel | Change class |
|---|---|---|
| `plugins/foreman-line/routing-policy/routing-policy.yaml` | P1 | policy contract — logical/binding representation, fallback references |
| `plugins/foreman-line/routing-policy/src/validator.ts` | P1 | validator + `KNOWN_FRONTIER_MODELS` invariants |
| `plugins/foreman-line/routing-policy/schemas/*.json` | P1 | schema additions, referential-integrity constraints |
| `plugins/foreman-line/routing-policy/tests/**` and `tests/fixtures/**` | P1 | fixtures, negative cases |
| `plugins/foreman-line/routing-policy/src/pi-openrouter.ts` | P2 | Pi/OpenRouter routing controls |
| `plugins/foreman-line/templates/**` (Pi routing templates) | P2 / P3 | generated route artifacts; human-facing canon |

PMC also **reads, and will not modify**,
`plugins/foreman-line/docs/goals/routing-currency-and-merit/host-owner-export/`
(three files, digest-pinned in the PMC-P0 spec). PMC-P0 verifies those digests
locally and treats the export as `static-conformance` evidence only. If you
regenerate or move that export, PMC-P0 evidence is invalidated and we would
need to re-pin — please tell us rather than letting a silent refresh land.

### 3. Ownership as PMC currently reads it

- Your loop directive records you as queue owner from 2026-09-21 on the owner's
  explicit direction, with state `RCM-P0-closed-incomplete`.
- RCM-P0 closed **incomplete**: F1–F6 at `blocked-secret-boundary`, HAWF/INDEX
  `escalated-unresolved`, Jev evidence-only refused/disabled-lane.
- **RCM-P1 is held**, and no PMC parcel assumes that hold is lifted.

If any of this is stale, PMC's sequencing assumption is wrong and we would
rather correct it now than at a merge.

### 4. The serialization point PMC proposes

One writer at a time on `routing-policy/`, with an explicit handoff:

1. RCM confirms whether RCM-P1 will claim `routing-policy/` write authority, and
   if so for which exact paths and in what window.
2. If RCM-P1 remains held, RCM states whether it objects to PMC-P1 taking
   bounded write authority over the paths in §2 for the duration of PMC-P1 only,
   reverting to RCM afterward.
3. Neither goal edits a path the other holds. No co-ownership, no
   "small adjacent fix" across the boundary.
4. Whichever goal writes second rebases onto the first and re-runs the full
   `routing-policy` test suite (currently **69 passing**) before its own Gate 3.

### 5. Relevant state PMC has already observed

Under owner-directed Amendment 03, `anthropic/claude-opus-5.5` is now present in
both `KNOWN_FRONTIER_MODELS` and `routing-policy.yaml`, and all 69
`routing-policy` tests pass. PMC did not author that change and claims no
authority over it; PMC-P1's scope is reduced accordingly.

PMC has also observed an **unreconciled gap**: PMC Amendment 02 M2 rules the
typed routing/classification lane refused/disabled, while `routing-policy.yaml`
and its tests still encode `typesafe/jev-1.13` as the routing/classification
model. PMC-P0 records this as an observation only. PMC proposes PMC-P1 own the
reconciliation, but if RCM considers that its own, say so and PMC will drop it.

### 6. Condition for releasing a PMC-P1/P2 Gate 2

PMC will **not** request Gate 2 for Wave 1 until all of:

1. RCM has answered §4 with an explicit claim or an explicit non-objection;
2. the write window and exact path list are recorded in both goals' loop
   directives;
3. the Jev reconciliation owner is settled per §5;
4. the host-owner-export digests still match those pinned in PMC-P0, or new
   digests have been re-pinned by the PMC coordinator; and
5. the PMC owner grants Gate 2 in the normal way — this exchange grants nothing.

### 7. What this message is not

It is not a Gate 2 request, not a claim on your surfaces, not an instruction,
and not an authority transfer. If you object to any item, PMC treats that as
binding and re-plans Wave 1.

---

## Coordinator notes (not part of the message)

- **Do not send without explicit owner direction.** Cross-coordinator
  correspondence is not an agent-completable action here.
- No reply has been received, so no item above may be cited as agreed.
- If RCM's ownership block has changed since 2026-09-21, re-read it and revise
  §3 before sending.
- PMC-P0 Gate 2 is **independent** of this request and is not blocked by it.
