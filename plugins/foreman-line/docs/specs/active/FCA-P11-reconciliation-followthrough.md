---
ticket: FCA-P11
title: Reconciliation follow-through — per-finding "do it" that prepares a scoped session
status: draft
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

Module `followthrough` in `human-tasks-capability-map.md`. FCA-P8 names each
discrepancy, its evidence, and a preserve-first list of options, but every option is
prose and copyable commands. The only action the view offers is a whole-parcel
`investigate`/`explain`. This parcel adds, per option, a **"Prepare session"**
button that pre-fills the existing launch panel with a scoped session whose
instruction is that option, so the operator reviews it and launches through the one
existing launch path.

The button prepares; it does not launch. Model, thinking, budget and autonomy are
chosen and confirmed in the existing panel exactly as today.

## Constraints

- **One launch path.** "Prepare session" only mutates client selection state. It
  calls no route. Launching uses the existing `/api/spawn` plan-then-launch flow, the
  FCA-P4 registry and FCA-P5 typed refusals. No new route, verb, registry pair or
  autonomy envelope.
- **Read-only verbs only.** This parcel offers `investigate` and `explain` (envelope
  `NO_WRITE`: no commit, no push, no PR, no merge). `remediate` and `close-delete`
  are not offered here: record-completing work belongs to `closure-proposal` and
  reaping to `hygiene-actions`, each its own spec. Options that need those show
  "Needs <module> (not yet available)" and keep their copyable commands.
- **The instruction is the option, bounded.** The text sent as `extraText` is
  composed deterministically from fields already in the finding (parcel key, goal,
  code, option answer and recommendation, evidence lines) plus a fixed scope footer:
  report findings, change nothing, run no merge/push/close/delete/fetch, stop when
  the question is answered. Hard cap 2,000 characters; truncation is visible and
  never drops the scope footer. The operator sees and may edit the text before
  launch.
- **No fabricated authority.** Selections may only narrow the envelope. `merge` stays
  `false`. A prepared session never carries a confirmation phrase.
- **Frozen state untouched.** `state`/`rule` and the discrepancy vocabulary are
  displayed, not changed. Findings keep their `confidence`; a `weak-traces` finding's
  prepared instruction says "verify; the work may have shipped under another
  identity" and never "fix".
- **Per-item direction.** `extraText` is per selected item (it already is in
  `/api/spawn`), not one global string, so a bulk selection does not send one parcel's
  option text to another parcel.

## Design

Server (`reconcile.ts`): each `RemedyOption` in a finding gains an additive
`act: { verb: 'investigate' | 'explain', instruction: string } | null`. `act` is
`null` for options this parcel does not offer. The mapping is a closed table
`(code, option index) -> verb`, pinned by a test that fails when a code gains an
option without a mapping decision.

Client (`selection.js`, `reconcile.js`, `app.js`, `spawn-panel.js`): the selection
item gains `extraText` (default `null`). "Prepare session" adds the parcel's
`parcel-state` signal to the selection (same key rules as today), sets the verb to
`act.verb`, and sets `extraText` to `act.instruction`. The launch panel renders each
item's instruction in an editable, labelled textarea with a character counter.
`spawnRequest` maps the per-item `extraText` into the existing request field. If the
parcel has no eligible signal (no registered action), the button is disabled with
the reason.

Bulk: the existing filter by discrepancy code plus "select all matching" prepares
the same option across parcels; items keep their own instruction. Bulk uses the
existing selection limits and refusal messages.

## Acceptance Criteria

1. Every discrepancy code in the closed vocabulary has an option mapping decided in
   the table; a test enumerates `DISCREPANCY_CODES` and each option and fails on an
   unmapped one.
2. `act` is additive: all existing `/api/reconcile` fields are byte-identical on the
   fixture corpus; `act.verb` is always `investigate` or `explain`; `act` is `null`
   for every option that needs `remediate` or `close-delete`, and those options render
   "Needs <module> (not yet available)".
3. The instruction is deterministic (same finding, same text), at most 2,000
   characters, always ends with the scope footer, and a test with a 10,000-character
   evidence fixture proves truncation keeps the footer and is marked "(shortened)".
4. Clicking "Prepare session" performs **no network request**; a UI test asserts zero
   fetches, adds exactly one selection item with the right verb and text, and does not
   open a second launch path.
5. Two parcels prepared in one selection keep distinct instructions in the posted
   `/api/spawn` body (asserted on the request the UI builds).
6. The launch panel shows the instruction, allows editing, enforces the cap, and an
   emptied instruction posts `extraText: null`, not an empty string.
7. A destructive or write option can never be reached: with `act` forced to
   `remediate` or `close-delete` in a mutated fixture the UI refuses to prepare it
   (guard mutated and recorded in the PR).
8. Real-data check on a scratch console against the 2026-10-13 backlog: the
   11 weak-trace "verify" findings and the 1 divergence finding each prepare a
   session without error; none launches; the 10 orphan and the unrecorded-closure
   options show "Needs ... (not yet available)". Counts recorded in the PR.
9. Keyboard operable; real-browser pass at 1366 and 320 widths (Chromium over CDP,
   skipped when absent).
10. `npm test`, `npm run typecheck`, `npm run lint` pass; test count recorded
    (baseline 491 at `main` b8fe06b6, plus FCA-P9 and FCA-P10 additions once merged).

## Out of Scope

- Launching without the review step, auto-selecting a model, or launching in bulk
  with one click.
- `remediate`, `close-delete`, record edits, PR creation, reaping, fetch.
- Persisting which finding a session was launched for (see OQ1).
- Any new route, registry verb or autonomy envelope.

## Context & References

- [FCA-P8 reconciliation](FCA-P8-reconciliation-view.md) — findings and options
- [FCA-P4 actions](FCA-P4-actions.md), [FCA-U2 selection and launch](FCA-U2-selection-launch.md)
- [FCA-P5 spawn](FCA-P5-spawn.md) — `extraText`, typed refusals
- [Capability map](../../goals/foreman-ops-console/human-tasks-capability-map.md)

## Open Questions

- **OQ1 linking a session to its finding.** Spawn receipts carry no parcel or
  finding identity, so the view cannot say "an investigation was already launched for
  this". Proposed: an additive receipt field (`subject`, `verb`) as FCA-P7 did for
  ledger fields, so the finding row can show the launched session and its lifecycle.
  Needs an owner decision (capability map A10); this parcel does not depend on it.
- **OQ2 scope footer wording:** proposed text pinned in a constant and by a test.

## Commands

Run from `plugins/foreman-line/ops-console/` (`node -v` first; expect v26.8.2):

```sh
npx tsx --test tests/reconcile.test.ts tests/ui-reconcile.test.ts tests/ui-selection-launch.test.ts tests/ui-spawn-panel.test.ts tests/browser-reconcile.test.ts
npm test
npm run typecheck
npm run lint
```

## Boundaries

- Always: prepare, never launch; keep the instruction visible and editable; narrow
  authority only; pin the option-to-verb table by test.
- Ask first (amendment required before dispatch): any new route or registry verb, a
  write-capable verb, a receipt field (OQ1).
- Never: launch from the button, send a confirmation phrase, widen an envelope, send
  one parcel's text for another, or hide truncation.

## Verification Plan

Table-completeness test (AC1); additive-shape regression (AC2); determinism and
truncation fixtures (AC3); UI no-network and per-item text tests (AC4-AC6); guard
mutation (AC7); scratch-console run on real data (AC8); real-browser pass.

Mandated reviewer questions:
- Can "Prepare session" start a session, call a route, or post anything?
- Can one parcel's instruction reach another parcel's session in a bulk selection?
- Can a write-capable or destructive option be prepared, or an envelope widened?
- Can truncation remove the scope footer or go unmarked?
- Does a `weak-traces` finding ever prepare an instruction that presumes it is wrong?

## Allowed Files

- plugins/foreman-line/ops-console/src/reconcile.ts
- plugins/foreman-line/ops-console/src/remedy.ts
- plugins/foreman-line/ops-console/ui/app.js
- plugins/foreman-line/ops-console/ui/views/reconcile.js
- plugins/foreman-line/ops-console/ui/views/reconcile.d.ts
- plugins/foreman-line/ops-console/ui/views/selection.js
- plugins/foreman-line/ops-console/ui/views/selection.d.ts
- plugins/foreman-line/ops-console/ui/views/spawn-panel.js
- plugins/foreman-line/ops-console/ui/views/spawn-panel.d.ts
- plugins/foreman-line/ops-console/tests/reconcile.test.ts
- plugins/foreman-line/ops-console/tests/ui-reconcile.test.ts
- plugins/foreman-line/ops-console/tests/ui-selection-launch.test.ts
- plugins/foreman-line/ops-console/tests/ui-spawn-panel.test.ts
- plugins/foreman-line/ops-console/tests/browser-reconcile.test.ts
- plugins/foreman-line/ops-console/README.md
- plugins/foreman-line/docs/specs/INDEX.md
