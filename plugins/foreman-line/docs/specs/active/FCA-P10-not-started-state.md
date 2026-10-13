---
ticket: FCA-P10
title: Parcel state amendment — separate "not started" from "stalled" (FOC-P0 C4 rule R4a)
status: active
owner: clinton.morgan
created: 2026-10-13
updated: 2026-10-13
supersedes: null
superseded_by: null
risk: elevated
surfaces:
  - plugins/foreman-line/ops-console/src
  - plugins/foreman-line/ops-console/ui
  - plugins/foreman-line/ops-console/tests
  - plugins/foreman-line/docs/specs/INDEX.md
routing_class: architecture/risk
verification_class: judgment-required
permission_profile: builder-architecture
data_classification: internal
---

## Intent

Module `not-started-state` in `human-tasks-capability-map.md`. The frozen FOC-P0
rule R4 calls any parcel `hung` when its progress age exceeds the threshold and it
has no liveness. A queued parcel with no spec, no receipt chain and no sidecar has
no progress timestamp at all, so its age is infinite and it reads `hung`. On
2026-10-13, 20 of the 34 `hung` parcels were exactly that (15 with no trace anywhere,
5 with traces outside the record). "Hung" there means "the record holds nothing for
it", and it tells the operator something is broken when nothing was ever running.

The owner decided on 2026-10-13 to separate the two. This parcel is the owner-
ratified amendment to the frozen FOC-P0 C4 vocabulary and derivation: a sixth
state, `not-started`, and one new rule, `R4a`, placed between R3 and R4.

## Constraints

- **This is an amendment to a frozen contract**, granted by the owner in this
  session and recorded in the capability map (A2). It changes exactly: the
  `ParcelStateValue` union, the derivation order, and the consumers that enumerate
  the union. It does not change R1, R2, R3 or R5, any gate proxy, any threshold or
  its parse, the progress-timestamp definition, the liveness composite, or the
  `ParcelProjection` shape other than the widened `state` union.
- **Derived from the FOC-P0 inputs only.** `R4a` reads the same inputs R1-R5 read:
  chain, spec, sidecars, liveness. It must not read reconciliation output, git, PRs,
  branches or worktrees beyond the existing liveness composite. The reconciliation
  vocabulary (`never-started`, FCA-P8) keeps its own, wider evidence rule and is not
  an input.
- **The state describes the record, not the world.** `not-started` means "no spec, no
  receipt chain and no sidecar exist for this parcel". It does not claim the work
  never happened: work may exist in git or a PR under another identity. Labels and
  detail text say "Not started in the record" and name what was absent; the
  reconciliation findings (`orphan-worktree`, weak-trace `stale-abandoned`, ...)
  keep showing on the same row, so a parcel whose only trace is outside the record is
  still visibly flagged. The real data has such parcels (see AC9).
- **Rule precedence** (first match wins), amended: R1 failed, R2 complete, R3
  awaiting-gate, **R4a not-started**, R4 hung, R5 running.
- **R4a (frozen text proposed):** not R1-R3 AND no mapped receipt chain AND no spec
  file maps to the parcel AND no approval, rejection or projected sidecar joins it
  AND no liveness. Such a parcel has *never progressed*: its progress timestamp is
  `null` for want of any source, not for want of recency.
- **R4 narrowed, not redefined:** R4 is unchanged in text except that it is reached
  only when a parcel has a chain, a spec or a sidecar, i.e. when "stalled" is true.
  A parcel with a chain whose member timestamps are all unparseable (progress
  `null`, chain present) stays `hung` under R4: something exists, so it is not
  "not started".
- **A live parcel is unchanged.** A parcel with liveness and nothing else still
  falls through to R5 `running`, as today. R4a requires no liveness.
- **No new alert, no new gate.** `not-started` raises no alert and creates no
  notification. Existing stored `…:hung` notifications for parcels that now read
  `not-started` are not deleted by this parcel (FCA-P12 owns triage); the alert id
  space is unchanged.
- **Severity and verbs.** `not-started` maps to `info` severity with the registered
  verbs `investigate` and `explain` only; it is not `urgent` and offers no
  `remediate` or `close-delete`.
- **Count semantics.** The per-goal attention total (`hung + failed + awaitingGate +
  ratification…`) does not include `not-started`; `GoalStatus` gains an additive
  `notStarted` count. The `hung` count therefore falls by the number of re-
  classified parcels. That is intended and stated in the PR with the measured
  before/after.

## Acceptance Criteria

1. `ParcelStateValue` is `running | hung | awaiting-gate | failed | complete |
   not-started`; `R4a` is implemented between R3 and R4; TypeScript exhaustiveness
   (`Record<ParcelStateValue, …>`) forces every enumerating consumer to handle it.
2. **Frozen-corpus regression.** Every existing FOC-P0 scenario fixture yields the
   same `state` and `rule` as before, except scenarios the owner amendment
   re-classifies; the full list of changed expectations is enumerated in the PR and
   each is a parcel with no chain, no spec and no sidecar. A test asserts the set of
   changed scenario ids exactly.
3. **New fixtures:** `not-started` (queued, nothing else); queued with a spec in
   `active/` (stays `hung` when stale, `running` when fresh: progress exists);
   queued with only a projected sidecar and no decision (R3 `awaiting-gate`, wins
   over R4a); queued with only a rejection sidecar (R4 `hung`, not `not-started`);
   chain present with unparseable timestamps (R4 `hung`); no chain, no spec, live
   worktree (R5 `running`); heartbeat override present on an unstarted goal
   (`not-started`, the threshold is irrelevant and still displayed). Each asserts
   `state` and first-matching `rule`.
4. **Precedence mutation checks:** moving R4a above R3, below R4, or dropping its
   `no sidecar` or `no liveness` condition each makes at least one fixture fail
   (mutate each, record the failing test in the PR).
5. `deriveAlerts` produces no alert for `not-started`; a test pins it. `syncAlerts`
   records no notification for it.
6. `SEVERITY_FOR_STATE['not-started'] === 'info'`; `ACTIONS_FOR_STATE['not-started']`
   is exactly `['investigate','explain']`; `GoalStatus.notStarted` is present and the
   attention `total` excludes it.
7. Board and filters: the parcel-status filter, board columns, needs styling and the
   goal attention summary handle `not-started` in a distinct, non-alarming style and
   word ("Not started"), and the word "hung" never appears for such a parcel in any
   rendered view (test asserts the DOM).
8. Reconciliation keeps working: a `not-started` parcel is reconciled like any other
   (its `never-started` code is still computed from the wider evidence and may still
   be `unmerged-work` etc.); the `hung` explanation panel renders only for `hung`.
   `state`/`rule` echoed by `/api/reconcile` are the new values.
9. **Real-data measurement** on a read-only scratch console, recorded in the PR with
   the parcel list. Pre-implementation measurement (2026-10-13, `main` b8fe06b6, 17
   goals): 34 `hung`; **20** meet R4a's conditions (no chain, no spec, progress
   `null`), not 15. 15 of the 20 are reconciliation `never-started`; the other 5 have
   traces outside the record: FOC-P1, FOC-P2, FOC-P3 (orphan worktrees from failed
   launches) and RCM-P2, TO-P6 (weak-trace `stale-abandoned`, "work may have shipped
   under another identity"). The other 14 stay `hung` (a spec exists). After the
   change `hung` is 14 and `notStarted` is 20; the PR states both sets and their
   disagreement list, and the 5 parcels still show their reconciliation findings.
10. `FOC-P0` spec gains an appended, dated "Amendment FCA-P10" section (the frozen
    text above is not rewritten); the README state list and API notes are updated.
11. `npm test`, `npm run typecheck`, `npm run lint` pass; test count recorded
    (baseline 491 at `main` b8fe06b6).

## Out of Scope

- Any other vocabulary change; renaming `hung`; changing the threshold, its default
  or the override parse; per-routing-class thresholds.
- Deriving any state from reconciliation output, git, PRs or sessions.
- Deleting or rewriting existing notifications (FCA-P12), dispatching unstarted
  parcels (Gate 2 stays human), or any new route.
- Changing what `awaiting-gate` means for an unstarted parcel that has a projected
  shaping artifact (R3 wins, unchanged).

## Context & References

- [FOC-P0 contract](FOC-P0-projection-contract-and-discovery-inventory.md) — C4, R1-R5, C5
- [FCA-P8 reconciliation](FCA-P8-reconciliation-view.md) — records the 15/34 finding
- [Capability map](../../goals/foreman-ops-console/human-tasks-capability-map.md) — A2

## Open Questions

- **OQ1 name:** `not-started` (proposed, matches reconciliation's `never-started`
  only in meaning) versus `queued`. `not-started` is proposed because "queued" would
  also describe a parcel waiting at G2.
- **OQ2 spec in `active/` with no activity:** proposed to stay `hung` when stale,
  because a spec file is progress by FOC-P0's definition. A drafted-but-abandoned
  spec is "stalled", not "not started".
- **OQ3 rule id:** `R4a` (proposed, keeps R1-R5 ids stable in stored tests and
  docs) versus renumbering. Renumbering would invalidate every recorded rule id.

## Commands

Run from `plugins/foreman-line/ops-console/` (`node -v` first; expect v26.8.2):

```sh
npx tsx --test tests/derive.test.ts tests/corpus.test.ts tests/not-started.test.ts
npm test
npm run typecheck
npm run lint
```

## Boundaries

- Always: change the union and the derivation together; enumerate every consumer;
  mutate precedence and conditions and record the failures; measure on real data.
- Ask first (amendment required before dispatch): any change beyond the sixth state
  and R4a, any change to alert behaviour, any new route.
- Never: derive from reconciliation output, change R1-R3 or R5, change gate proxies,
  delete stored notifications, or make a rule depend on the clock beyond what R4
  already does.

## Verification Plan

Fixture corpus per AC3 with first-matching-rule assertions; the changed-expectation
set pinned exactly (AC2); precedence mutations (AC4); consumer exhaustiveness by the
compiler; a real-data before/after on a scratch console (not :8081 or :8099); a
real-browser check that no "hung" word renders for a not-started parcel.

Mandated reviewer questions:
- Can any parcel that has any chain, spec, sidecar or liveness now read `not-started`?
- Does any label or detail text claim the work never happened, rather than that the
  record holds no spec, chain or sidecar for it?
- Does a parcel whose only trace is a reconciliation finding (RCM-P2, TO-P6) still
  show that finding on the `not-started` row?
- Can a genuinely stalled parcel now read `not-started` and escape alerting?
- Do R1, R2, R3 and R5 produce byte-identical results on the whole existing corpus?
- Does any consumer still treat the six-value union as five (switch defaults, filters,
  counts, CSS classes, saved filter values)?
- Does anything derive from reconciliation output, or does `R4a` read a new input?
- Does an unstarted parcel with a projected sidecar still reach R3 before R4a?

## Allowed Files

- plugins/foreman-line/ops-console/src/derive.ts
- plugins/foreman-line/ops-console/src/types.ts
- plugins/foreman-line/ops-console/src/signals.ts
- plugins/foreman-line/ops-console/src/status.ts
- plugins/foreman-line/ops-console/src/alerts.ts
- plugins/foreman-line/ops-console/src/remedy.ts
- plugins/foreman-line/ops-console/src/reconcile.ts
- plugins/foreman-line/ops-console/src/index.ts
- plugins/foreman-line/ops-console/ui/needs.js
- plugins/foreman-line/ops-console/ui/views/board.js
- plugins/foreman-line/ops-console/ui/views/shell.js
- plugins/foreman-line/ops-console/ui/views/reconcile.js
- plugins/foreman-line/ops-console/ui/app.js
- plugins/foreman-line/ops-console/tests/not-started.test.ts
- plugins/foreman-line/ops-console/tests/fixtures/scenarios/not-started.json
- plugins/foreman-line/ops-console/tests/fixtures/scenarios/not-started-spec-only.json
- plugins/foreman-line/ops-console/tests/fixtures/scenarios/not-started-rejection-sidecar.json
- plugins/foreman-line/ops-console/tests/fixtures/scenarios/not-started-live.json
- plugins/foreman-line/ops-console/tests/support/materialize.ts
- plugins/foreman-line/ops-console/tests/derive.test.ts
- plugins/foreman-line/ops-console/tests/corpus.test.ts
- plugins/foreman-line/ops-console/tests/api.test.ts
- plugins/foreman-line/ops-console/tests/live-goal.test.ts
- plugins/foreman-line/ops-console/tests/multi-root.test.ts
- plugins/foreman-line/ops-console/tests/remedy.test.ts
- plugins/foreman-line/ops-console/tests/signals.test.ts
- plugins/foreman-line/ops-console/tests/signals-goal.test.ts
- plugins/foreman-line/ops-console/tests/reconcile.test.ts
- plugins/foreman-line/ops-console/tests/reconcile-sources.test.ts
- plugins/foreman-line/ops-console/tests/ui-fixture.ts
- plugins/foreman-line/ops-console/tests/ui-navigation.test.ts
- plugins/foreman-line/ops-console/tests/ui-reconcile.test.ts
- plugins/foreman-line/ops-console/tests/browser-reconcile.test.ts
- plugins/foreman-line/ops-console/README.md
- plugins/foreman-line/docs/specs/active/FOC-P0-projection-contract-and-discovery-inventory.md
- plugins/foreman-line/docs/specs/INDEX.md

## Owner ratification — 2026-10-13

Owner ratified this spec as drafted ("ratify all as written"), including every
amendment it names under "Ask first" (A2 the sixth state `not-started` and rule R4a (owner decision 2026-10-13: "separate not started from stalled")). Open Questions are resolved by the
proposals stated in them: OQ1 `not-started`, OQ2 a stale spec-only parcel stays `hung`, OQ3 rule id `R4a`. Blanket authority for decisions and
non-destructive actions stands; Gate 3 (merge) is not delegated by this record.
