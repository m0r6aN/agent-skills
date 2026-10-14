---
ticket: FCA-P12
title: Acknowledge historical failures and triage notifications, bound to the evidence
status: active
owner: clinton.morgan
created: 2026-10-13
updated: 2026-10-13
supersedes: null
superseded_by: null
risk: standard
surfaces:
  - plugins/foreman-line/ops-console/src
  - plugins/foreman-line/ops-console/ui
  - plugins/foreman-line/ops-console/tests
  - plugins/foreman-line/ops-console/README.md
  - plugins/foreman-line/docs/specs/INDEX.md
routing_class: standard-feature
verification_class: judgment-required
permission_profile: builder-standard
data_classification: internal
---

## Intent

Module `acknowledgement` in `human-tasks-capability-map.md`. Two noise sources need
a human "I have seen this":

1. **Failed launched sessions.** FCA-P7 fades a failure to `info` after 72 h but
   offers no way to say "I looked at this and it is dealt with". Seven failed-launch
   worktrees and their signals sit there indefinitely.
2. **Notifications.** `state/notifications.json` accumulates one record per alert
   ever fired (including the `…:hung` records for parcels FCA-P10 now reads
   `not-started`). `DELETE /api/notifications/:id` removes one, but
   `syncAlerts` rebuilds its "already fired" set from what remains, so a deleted
   notification for an alert that still fires **comes back on the next
   `/api/alerts` read**. Dismissal does not stick today.

This parcel adds a console-local **acknowledgement** bound to the exact evidence
seen, so it lapses when the evidence changes, and makes notification dismissal
persist while the alert is unchanged.

## Constraints

- **Acknowledgement never alters facts.** It changes no parcel state, no derived
  signal severity, no ledger entry, no receipt, no goal record. It is an additive
  annotation (`acknowledgement`) beside the signal and a grouping/count rule in the
  UI. The raw signal list and its severities are byte-identical without it.
- **Bound to evidence.** An acknowledgement stores the signal (or alert) id and a
  fingerprint of the evidence the human saw. It applies only while the current
  fingerprint equals the stored one. Any change (a new exit, a state change, a new
  failure code) lapses it and the item returns to its natural severity, marked
  "changed since you acknowledged".
- **Narrow scope first.** Acknowledgement is accepted only for signal class
  `session-state` and for notification alerts. Any other class is refused typed
  (`reason: class-not-acknowledgeable`). A failed or hung parcel's own signal is not
  acknowledgeable here: hiding a live problem needs its own decision (OQ1).
- **Console-local, append-only audit.** The only write is the new console-local
  file `state/acknowledgements.json` (format `foc-acknowledgements/v1`: `acks[]`
  and an append-only `events[]` of acknowledge/unacknowledge with timestamp and
  optional note, max 280 characters). It is added to the closed `STATE_FILES` set.
  The module writes nothing else and is the sole writer of that file.
- **Reversible.** Un-acknowledging restores the item immediately; no history is
  lost (events remain).
- **Route table frozen.** `GET/POST /api/acknowledgements` and
  `DELETE /api/acknowledgements/:id`, and the new state file, are owner
  amendments A6 in the capability map. The `syncAlerts` behaviour change is A7.
  Neither is built until ratified. No existing route changes shape: `ack`
  information is additive on `/api/signals` and `/api/alerts`.
- **No server-side evidence probing on write.** `POST` stores what the client
  presents after shape validation (id pattern, 64-hex fingerprint, note length);
  it does not re-scan signals (that would add seconds of blocking work). The
  fingerprint is checked on read.

## Design

Fingerprint: `sha256(JSON.stringify([class, repo, subject, evidence...]))` for a
signal, computed server-side and returned on each signal as `fingerprint` (the client
echoes it back, so the two can never disagree). Time-derived evidence is excluded:
the "older than 72 h" fade line must not lapse an acknowledgement merely because time
passed (a test pins this at 71 h and 73 h). For a notification alert:
`sha256(JSON.stringify([kind, rule, failureCode?]))`, deliberately excluding the
liveness reason and ages so an acknowledged alert does not lapse as time passes.

`/api/signals` and `/api/alerts` gain additive fields only:
`signal.fingerprint`, `signal.acknowledgement: null | { at, note, current: boolean }`,
and `alerts` response `acknowledgements` for the alert ids in scope.

`syncAlerts(stateDir, alerts, now)` skips any alert whose id has an acknowledgement
with a matching alert fingerprint. Without a matching acknowledgement behaviour is
unchanged.

**UI.** Signals/Work queue: an "Acknowledged (n)" group, collapsed by default,
excluded from attention counts and the nav badge, each row labelled "Acknowledged
<time>" with an Undo; an "Acknowledge" action on `session-state` signals with an
optional note; rows whose acknowledgement lapsed read "Changed since acknowledged".
Alerts & guidance: notification triage with grouping by kind and goal, a
"Resolved" marker when the alert no longer fires **for the selected goal** (other
goals read "not checked", never "resolved"), per-row Dismiss and "Dismiss all
resolved in this goal" that call the existing `DELETE /api/notifications/:id` plus an
acknowledgement so the dismissal sticks.

## Acceptance Criteria

1. **Reproduce first.** A failing test shows the current defect: delete a notification
   whose alert still fires, read `/api/alerts`, and the notification is back. After
   this parcel the same sequence leaves it deleted while the alert is unchanged.
2. Acknowledging a `session-state` signal stores id, fingerprint and note, appends an
   event, and the next `/api/signals` returns `acknowledgement.current === true`;
   `severity`, `evidence` and every pre-existing field are byte-identical to the
   no-acknowledgement response.
3. **Lapse:** change the signal's evidence (a new exit status in a fixture) and the
   acknowledgement reads `current: false`, the item returns to its natural severity
   and is labelled "Changed since acknowledged"; the dismissed alert fingerprint
   lapses when its rule or failure code changes and the notification fires again.
4. **Stability:** the alert fingerprint is identical for the same parcel at two
   different `now` values and two different liveness-reason ages (fixture), so a
   steady alert does not re-fire daily.
5. Any class other than `session-state`, a malformed id, a non-64-hex fingerprint, a
   note over 280 characters, and an unknown id on `DELETE` each return a typed 4xx
   with `reason`; none writes to the store.
6. Un-acknowledge removes the active ack, keeps the events, and restores attention
   counts; ack then un-ack leaves `acks` empty and `events` with two entries.
7. The store is written atomically (temp file then rename), tolerates a missing or
   corrupt file by starting empty without throwing, and is the only file this module
   writes (extends `read-only.test.ts` writable-path set by exactly this file).
8. **Counts:** acknowledged items are excluded from the attention total and nav
   badge, and appear in the "Acknowledged (n)" group; a lapsed item is counted again.
9. Notification triage: "Resolved" is shown only when the selected goal's current
   alerts lack the alert id; for any other goal the marker reads "not checked";
   "Dismiss all resolved in this goal" never touches another goal's records.
10. Real-data check on a scratch console: the seven failed-launch session signals
    can be acknowledged and un-acknowledged, and the stale `…:hung` notifications
    for parcels that read `not-started` (after FCA-P10) show as "Resolved" and
    dismiss and stay dismissed across two `/api/alerts` reads. Counts recorded.
11. Keyboard operable; real-browser pass at 1366 and 320 widths (Chromium over CDP,
    skipped when absent).
12. `npm test`, `npm run typecheck`, `npm run lint` pass; test count recorded
    (baseline 491 at `main` b8fe06b6, plus FCA-P9 and FCA-P10 additions once merged).

## Out of Scope

- Acknowledging parcel-state signals, gate items, PRs, or reconciliation findings.
- Auto-acknowledging, expiry timers, or acknowledging on behalf of another user.
- Deleting, archiving, or rewriting sessions, worktrees, receipts or ledger data
  (reaping belongs to `hygiene-actions`).
- Changing alert rules, thresholds or what raises an alert (FCA-P10 owns the
  `not-started` change).
- Any push, desktop or webhook notification delivery.

## Context & References

- [FCA-P7 session ledger](FCA-P7-session-ledger.md) — session-state signals, the 72 h fade
- [FCA-P3 signals](FCA-P3-signals.md) — signal ids and classes
- [FOC-P0](FOC-P0-projection-contract-and-discovery-inventory.md) — OQ3 notification store
- [FCA-P10 not-started](FCA-P10-not-started-state.md)
- [Capability map](../../goals/foreman-ops-console/human-tasks-capability-map.md)

## Open Questions

- **OQ1 acknowledging parcel failures:** proposed no (keep scope to session-state and
  notifications). A parcel that is failed or hung is a live problem; deferring or
  closing it belongs to the goal record.
- **OQ2 acknowledgement lifetime:** proposed unlimited, until evidence changes or the
  human undoes it. Alternative: expire after 30 days so nothing is silently parked.
- **OQ3 fingerprint inputs for alerts:** `kind + rule + failure code` (proposed).

## Commands

Run from `plugins/foreman-line/ops-console/` (`node -v` first; expect v26.8.2):

```sh
npx tsx --test tests/acknowledgements.test.ts tests/notifications-triage.test.ts tests/read-only.test.ts tests/ui-acknowledge.test.ts
npm test
npm run typecheck
npm run lint
```

## Boundaries

- Always: bind to evidence; keep raw signals unchanged; keep the store the only write;
  show lapsed acknowledgements; reproduce the re-fire defect before fixing it.
- Ask first (amendment required before dispatch): the new routes and state file (A6),
  the `syncAlerts` change (A7), any additional acknowledgeable class (OQ1).
- Never: hide a failed or hung parcel, change a signal's severity or evidence, write
  outside `state/`, delete evidence, or ack silently.

## Verification Plan

Defect reproduction (AC1); fingerprint lapse and stability (AC3, AC4); typed
refusals and store hygiene (AC5-AC7); counts (AC8); scratch-console real data (AC10);
real-browser pass; guard mutations (drop the fingerprint comparison, drop the class
check, drop the `syncAlerts` consult) each shown to fail a test.

Mandated reviewer questions:
- Can an acknowledgement hide a failure whose evidence has since changed?
- Can a client acknowledge an id or class it should not, or forge a fingerprint to
  suppress a different alert?
- Does a steady alert re-fire (fingerprint instability) or a changed one stay hidden?
- Does anything other than `state/acknowledgements.json` get written, or the raw
  signal/alert payloads change?
- Can "Dismiss all resolved" touch another goal's notifications?

## Allowed Files

- plugins/foreman-line/ops-console/src/acknowledgements.ts
- plugins/foreman-line/ops-console/src/config.ts
- plugins/foreman-line/ops-console/src/notifications.ts
- plugins/foreman-line/ops-console/src/api.ts
- plugins/foreman-line/ops-console/ui/app.js
- plugins/foreman-line/ops-console/ui/views/signals.js
- plugins/foreman-line/ops-console/ui/views/signals.d.ts
- plugins/foreman-line/ops-console/ui/views/remedies.js
- plugins/foreman-line/ops-console/ui/views/remedies.d.ts
- plugins/foreman-line/ops-console/tests/acknowledgements.test.ts
- plugins/foreman-line/ops-console/tests/notifications-triage.test.ts
- plugins/foreman-line/ops-console/tests/read-only.test.ts
- plugins/foreman-line/ops-console/tests/ui-acknowledge.test.ts
- plugins/foreman-line/ops-console/tests/ui-signals.test.ts
- plugins/foreman-line/ops-console/README.md
- plugins/foreman-line/docs/specs/INDEX.md

## Owner ratification — 2026-10-13

Owner ratified this spec as drafted ("ratify all as written"), including every
amendment it names under "Ask first" (A6 the `state/acknowledgements.json` file and `GET/POST /api/acknowledgements`, `DELETE /api/acknowledgements/:id`, A7 the `syncAlerts` behaviour change). Open Questions are resolved by the
proposals stated in them: OQ1 only `session-state` signals and notifications are acknowledgeable, OQ2 no expiry, OQ3 alert fingerprint is kind + rule + failure code. Blanket authority for decisions and
non-destructive actions stands; Gate 3 (merge) is not delegated by this record.
