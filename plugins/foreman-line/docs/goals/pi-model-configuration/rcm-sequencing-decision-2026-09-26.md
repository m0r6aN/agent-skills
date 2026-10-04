# Wave 1 Sequencing Decision — PMC ↔ RCM on `routing-policy/` (BINDING, 2026-09-26)

**Goal slug:** `pi-model-configuration` · **Covers:** PMC-P1/P2 ↔ RCM-P2+ serialization on
shared `routing-policy/` surfaces
**Recorded:** 2026-09-26 by the PMC coordinator
**Status:** **BINDING serialization order.** This resolves
`rcm-sequencing-request-DRAFT.md` into an operative decision. The draft (status
`DRAFT — NOT SENT`, "must not be read as coordination approval") remains the cited request
and stays untouched as historical record; no reply from the RCM coordinator exists, and
cross-coordinator correspondence is not an agent-completable action. This record is the
owner-authorized substitute that fixes the order so neither coordinator has to guess.
**Authority basis:** coordinator decision 2026-09-26 under owner blanket authority. Not a
fabricated human approval and **not an RCM coordinator acknowledgment**; if the RCM side
objects to any item, that objection is binding and Wave 1 is re-planned (draft § 7).

## 1. Contested surfaces and exact paths

PMC-side write set (draft § 2, "Contested paths"; ownership split per charter A7):

| Exact path | Parcel | Change class |
|---|---|---|
| `plugins/foreman-line/routing-policy/routing-policy.yaml` | PMC-P1 | policy contract — logical/binding representation, fallback references |
| `plugins/foreman-line/routing-policy/src/validator.ts` | PMC-P1 | validator + `KNOWN_FRONTIER_MODELS` invariants |
| `plugins/foreman-line/routing-policy/schemas/*.json` | PMC-P1 | schema additions, referential-integrity constraints |
| `plugins/foreman-line/routing-policy/tests/**` and `plugins/foreman-line/routing-policy/tests/fixtures/**` | PMC-P1 | fixtures, negative cases |
| `plugins/foreman-line/routing-policy/src/pi-openrouter.ts` | PMC-P2 | Pi/OpenRouter routing controls |
| `plugins/foreman-line/templates/**` (Pi routing templates) | PMC-P2 / PMC-P3 | generated route artifacts; human-facing canon |

RCM-side write set (RCM charter D14: "All governed logic — reader, resolver, validator,
proposer, projector — ships **inside the plugin**"): `plugins/foreman-line/routing-policy/**`
and `plugins/foreman-line/dispatch/**` for RCM-P2+.

Read-only for PMC, never modified (draft § 2):
`plugins/foreman-line/docs/goals/routing-currency-and-merit/host-owner-export/` (three
digest-pinned files). If that export is regenerated or moved, PMC-P0 evidence is
invalidated and the digests must be re-pinned before any PMC-P1/P2 work continues.

## 2. Binding order

**Window P goes first — PMC-P1, then PMC-P2, in that order, on the exact PMC paths above.**

1. **First writer (Window P): PMC-P1**, bounded to its A7 file set
   (`routing-policy.yaml`, `src/validator.ts`, `schemas/*.json`, `tests/**`,
   `tests/fixtures/**`); then **PMC-P2**, bounded to `src/pi-openrouter.ts`,
   `templates/**`, plus its external Pi-host configuration (outside this repo and outside
   RCM's D14 surface). One PMC writer at a time internally: P2 consumes P1 as ratified and
   does not edit P1's files (A7).
2. **While Window P is open, RCM must not touch** any path on the PMC list — no create,
   modify, or delete, and no "small adjacent fix" across the boundary (draft § 4.3).
   Specifically: RCM-P2+ must not open any write window on
   `plugins/foreman-line/routing-policy/**` or `plugins/foreman-line/dispatch/**`; RCM-P1
   must not extend its built footprint (see § 4). `templates/**` is likewise held: it is
   PMC-P2/P3 canon work and outside RCM's D14 logic surface.
3. **Second writer (Window R): RCM-P2+**, on `plugins/foreman-line/routing-policy/**` and
   `plugins/foreman-line/dispatch/**`, opening only under the release condition in § 3.
   **While Window R is open, PMC must not touch** `routing-policy/**` or `dispatch/**`.
   PMC-P3's human-facing template canon is outside RCM's D14 surface and is unaffected.
4. **No co-ownership at any time.** Per the PMC loop-directive cross-goal note, PMC-P1 and
   PMC-P2 "**must be sequenced with that coordinator before Gate 2 — never co-owned**";
   per the RCM charter's *Relationship to existing goals* section, "If both goals claim the
   same file, both stop until sequenced." This record is that sequencing.
5. **Second-writer rule (draft § 4.4), binding on both sides:** whichever writer lands
   second rebases onto the first and re-runs the full `routing-policy` test suite (69
   passing at draft time) before its own Gate 3.

## 3. Release conditions

**Window P opens** (i.e., PMC-P1/P2 Gate 2 may be requested) only when, cumulatively:

1. this sequencing record is in place (draft § 6.1 — RCM claim/non-objection — is satisfied
   for PMC purposes by this binding decision, recorded in this goal's loop directive; the
   RCM-side loop-directive annotation is the one residual coordination step and is **not** a
   blocker, since this record binds unilaterally under owner blanket authority);
2. the write window and exact path list are recorded in the loop directives (draft § 6.2) —
   done on the PMC side by this record and the updated `loop-directive.md` state line;
3. the Jev reconciliation owner is settled (draft § 6.3) — **settled here: PMC-P1 owns it**
   (M2 rules the typed routing/classification lane refused/disabled;
   `routing-policy.yaml` and its fixtures still encode `typesafe/jev-1.13`; the
   reconciliation lands inside PMC-P1's own files, as the draft proposed and RCM has not
   claimed);
4. the `host-owner-export/` digests still match the PMC-P0 pins, or new digests are
   re-pinned by the PMC coordinator (draft § 6.4);
5. the owner grants Gate 2 in the normal way (draft § 6.5). **This record grants no Gate 2.**

**Window P releases back to RCM** — Window R opens — when **PMC-P2's Gate 3 merge has
landed and PMC Wave 1 stage-F closure is recorded**. The draft's "for the duration of
PMC-P1 only, reverting to RCM afterward" (§ 4.2) is extended to PMC-P1 **and** PMC-P2,
because both parcels write the contested surface (§ 1) and A7 already forbids P2 from
touching P1's files. After release, RCM-P2+ needs no further coordination to write its D14
surface; the second-writer rule (§ 2.5) applies to whichever window lands second.

## 4. RCM-P1 (built, at Gate 3) — placement

RCM-P1 is built and chain-green, awaiting its human Gate 3, with "nothing … merged, pushed,
or opened as a pull request" (`../goal-status-report-2026-09-26.md` §1 row 8). Its footprint
is **additive-only**: seven new files plus one appended README section
(`routing-policy/src/catalog-snapshot.ts`, `src/eligibility.ts`,
`tests/catalog-snapshot.test.ts`, `tests/eligibility.test.ts`, `tests/catalog-purity.test.ts`,
`tests/fixtures/catalog-snapshot/baseline.v1.json`, `routing-policy/README.md`; per its spec's
Allowed Files and the branch diff at `codex/rcm-p1-builder` / `7faa46a`). It collides with
no PMC path except the shared `routing-policy/tests/` directory, in file-disjoint
subdirectories. Therefore:

- RCM-P1's human Gate 3 merge of that **frozen** branch is **not** sequenced-blocked; it
  may land at any time. If it lands after PMC writes, § 2.5 binds it as second writer
  (rebase + full-suite re-run before its Gate 3).
- Any RCM-P1 **rework or extension** reopens it as a live writer and must wait for Window R.

## 5. Rationale

- **The draft's request** (`rcm-sequencing-request-DRAFT.md` § 4) proposes one writer at a
  time with an explicit handoff, PMC-P1 taking bounded write authority over the § 2 paths
  while RCM-P1 is held, reverting to RCM afterward, and the second-writer rebase rule. The
  draft's premise — RCM-P1 held, RCM-P2+ undispatched — is still the operative state
  (`../goal-status-report-2026-09-26.md` §1 row 8: "RCM-P2–P10 not dispatched").
- **PMC loop-directive cross-goal note:** RCM "owns both the `routing-policy/` surfaces
  PMC-P1/P2 must change and the `host-owner-export/` evidence this lint consumed. PMC-P0
  does not collide on files; **PMC-P1 and PMC-P2 do** and must be sequenced with that
  coordinator before Gate 2 — never co-owned." The note demands sequencing before any
  PMC-P1 Gate 2; it does not require RCM to write first.
- **RCM charter, *Relationship to existing goals*:** the goal is subordinate to
  `foreman-line-boundary-routing` D1–D10 and claims no exemption from shared-file
  discipline — "If both goals claim the same file, both stop until sequenced" — and D14
  fixes RCM's governed-logic surface at `routing-policy/` + `dispatch/`, which is exactly
  the surface held during Window P. Nothing in the RCM charter claims `templates/**` or a
  right-of-way over PMC's A7 file set.
- **Why PMC first:** no RCM write window is open (RCM-P2+ undispatched; RCM-P1 frozen and
  additive-only, so its Gate 3 merge is cheap to order around), while PMC Wave 1 is the
  next queued work behind this very decision. Parking PMC behind RCM-P1's unscheduled human
  Gate 3 would stall the queue on a gate neither coordinator controls; the additive-only
  footprint makes the reverse order cost-free. The order therefore follows availability of
  a writer, not precedence of claim.

## 6. Boundaries unchanged

No Gate 2, no merge, no release, no activation, no provider spend or credential access is
granted by this record. Authority invariants (A1, A2, A4; RCM charter D7/D8/D14) are
unweakened. An RCM objection to any item is binding and stops the affected step until
re-planned (draft § 7).
