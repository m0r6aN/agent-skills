---
ticket: FCA-U2
title: Persistent selection and explicit session launch review
status: active
owner: clinton.morgan
created: 2026-10-12
updated: 2026-10-12
supersedes: null
superseded_by: null
risk: standard
surfaces:
  - plugins/foreman-line/ops-console/ui
routing_class: standard-feature
verification_class: judgment-required
permission_profile: builder-standard
data_classification: internal
---

## Intent

Module `selection-launch` in the approved capability map; depends on FCA-U1.
Make session dispatch discoverable from both Work queue and Goals & parcels.
Operators select real targets, explicitly review each action and permission
set, and launch from a shared configuration without losing selections or drafts.

## Constraints

- Preserve the existing `/api/signals`, `/api/actions`, `/api/spawn` and guarded
  action-dispatch contracts. No new writes, goal-creation/resume verbs, ownership
  transfer, or bypass of human gates.
- Selection identifies a target by complete signal id (includes class, absolute
  repo and subject). Parcel rows join authoritative `parcel-state` signals by
  exact goal-qualified subject AND root. Never synthesize executable work from
  a bare parcel id or select the same target twice from two views.
- Action options are the intersection of the signal's offered verbs and the
  registry's allowed class/verb pairs. Ordinary bulk launch admits only
  non-destructive entries with `invocation: spawn`. Default to Investigate if
  offered, otherwise require an explicit choice; never silently choose the first
  registry verb. A button for Explain/Remediate queues that explicit action and
  opens review; it does not launch immediately.
- Destructive Close/delete is a separate, clearly labeled guarded flow requiring
  exact typed confirmation and the existing server check. It cannot enter the
  ordinary bulk-launch request, even via stale selection state.
- Per-target action and autonomy are reviewable and editable. Shared harness,
  model, thinking, budget and extra direction appear once. Preserve existing
  presets and freeform model fallback; do not invent registry availability or
  promise a programmatically enforced spend cap beyond the current backend.
- No new UI framework or dependency. A focused pure state/selection helper may
  live under `ui/views/` so existing ES-module routes serve it unchanged.
- Session launch semantics stay one tmux session, one pane and fresh worktree
  per selected action. Label actual session/pane counts correctly.

## Acceptance Criteria

1. Queue and parcel rows have named selection checkboxes independent of opening
   details. Clicking/keyboard-toggling a checkbox never opens parcel details;
   opening details never toggles selection. Unsupported targets show a visible
   explanation. Every actionable target can reach Review launch in at most one
   selection and one review-button activation.
2. A sticky selection bar shows selected item count, how many are hidden by the
   current filters, Clear selection, and Review launch. Select-all affects only
   visible eligible rows on the current page; Shift-select never selects filtered
   or ineligible rows. Navigation, filter, page and repo-scope changes preserve
   selection and draft settings within the current browser page session.
3. Background refresh restores checked rows from state, refreshes selected
   target evidence, and marks removed or newly ineligible targets unavailable.
   Unavailable targets stay visible in review with Remove, but block submission;
   changed action permissions require renewed review. A failed scan is not an
   empty scan and does not delete selections. Reload persistence is not required.
4. The accessible launch drawer lists every target's subject, repository, explicit
   action, and autonomy. It shows one shared set of controls plus extra direction.
   Changing selection/action/repository view does not clear the extra-direction
   draft. A per-target remove and a clear-all action are available. No request is
   sent on opening, closing, or changing controls.
5. With N valid selected targets, one intentional submission sends exactly one
   POST `/api/spawn` carrying N explicit actions, unchanged absolute roots,
   authoritative evidence, per-item autonomy and shared controls/extra text.
   Registry/eligibility validation is repeated immediately before submission.
   The button is disabled while pending; double-click and Enter-repeat cannot
   duplicate the POST. Empty or unsupported selections never submit.
6. Success is human-readable (session id, pane count, View sessions, copyable
   attach command), clears only the successfully submitted selections and keeps
   shared settings. Failure explains the refusal/error and preserves the draft.
   Raw response remains available under Details. Transport/launch failures may
   have side effects: label outcome uncertain when appropriate, offer Refresh
   sessions, and never automatically retry a launch.
7. Closing the drawer returns focus to the opener. Dialog focus is contained,
   Escape closes, initial focus and title are meaningful, validation/error
   messages are announced, and mobile review remains scrollable and operable.
   In-flight success/refusal survives drawer re-render or closure.
8. Bulk-delete is absent from ordinary spawn payloads. Dedicated cleanup tests
   prove mismatched confirmation sends no request, and refusal feedback remains
   visible. Existing human gate and read-only projection tests still pass.

## Out of Scope

- Launching new/resumed coordinator goals, auto-approval/merge, worktree cleanup
  implementation, new budget enforcement, or changing model/provider routing.
- Session telemetry beyond existing receipts/liveness; OS launcher changes.
- Persisting drafts across browser reloads or introducing client storage secrets.

## Context & References

- [Approved capability map](../../goals/foreman-ops-console/ux-redesign-capability-map.md)
- [Workspace dependency](FCA-U1-workspace-navigation.md)
- [Existing action authority](FCA-P4-actions.md)
- [Existing spawn contract](FCA-P5-spawn.md)
- [Owner launch controls](../../goals/foreman-ops-console/AMENDMENT-2026-10-11-control-center.md)

## Commands

Run from `plugins/foreman-line/ops-console/`:

```sh
npx tsx --test tests/ui-selection-launch.test.ts tests/ui-spawn-panel.test.ts tests/ui-signals.test.ts
npm test
npm run typecheck
npm run lint
```

No separate build step. Use mocked network and launch boundaries for deterministic
verification; do not start real processes on the operator's repositories.

## Project Structure and Code Style

`ui/views/selection.js` owns pure selection/reconciliation/request eligibility;
renderers stay under `ui/views/`, async interaction wiring stays in `ui/app.js`.
Pair changed exports with `.d.ts`. Tests use node:test, tsx, and jsdom. Preserve
single quotes, no semicolons, escaped dynamic HTML, and explicit keys:

```js
const selected = new Map()
selected.set(signal.id, { signal, verb: 'investigate', autonomy: { ...entry.autonomy } })
```

## Boundaries

- Always: preserve explicit root identity, validate offered/registered actions,
  keep draft state outside rendered controls, expose uncertainty honestly.
- Ask first: changing spawn/action authorization contracts, adding dependencies,
  persistence or backend write routes, files outside Allowed Files.
- Never: silently launch, auto-retry an uncertain launch, fabricate confirmation,
  submit an unregistered/stale/destructive target through ordinary bulk spawn.

## Verification Plan

DOM workflow test: queue select → parcel view → search/scope/refresh → review
explicit actions/permissions → submit once → inspect N-action request → outcome.
Include same subject in different repos, ineligible/vanished targets, mixed verbs,
extra-direction retention, failed refresh/submit, double-submit and dialog focus.
Pass composed payloads to `planSpawn` with fake clock/fixture roots to prove the
one-session/N-pane contract. Real-browser checks exercise keyboard selection and
launch review with mocked POST; record that no real session was launched.

Mandated reviewer questions:
- Can action ordering, changed evidence, duplicate ids or repo collisions change intent?
- Can destructive work bypass the confirmation flow via selection or refresh?
- Is the UI's success/uncertainty handling consistent with backend side effects?

## Allowed Files

- plugins/foreman-line/ops-console/ui/app.js
- plugins/foreman-line/ops-console/ui/app.d.ts
- plugins/foreman-line/ops-console/ui/index.html
- plugins/foreman-line/ops-console/ui/views/selection.js
- plugins/foreman-line/ops-console/ui/views/selection.d.ts
- plugins/foreman-line/ops-console/ui/views/shell.js
- plugins/foreman-line/ops-console/ui/views/shell.d.ts
- plugins/foreman-line/ops-console/ui/views/board.js
- plugins/foreman-line/ops-console/ui/views/board.d.ts
- plugins/foreman-line/ops-console/ui/views/signals.js
- plugins/foreman-line/ops-console/ui/views/signals.d.ts
- plugins/foreman-line/ops-console/ui/views/spawn-panel.js
- plugins/foreman-line/ops-console/ui/views/spawn-panel.d.ts
- plugins/foreman-line/ops-console/tests/ui-selection-launch.test.ts
- plugins/foreman-line/ops-console/tests/ui-spawn-panel.test.ts
- plugins/foreman-line/ops-console/tests/ui-signals.test.ts
- plugins/foreman-line/ops-console/tests/ui-shell.test.ts

## Delegated implementation amendment — 2026-10-12

Owner approved this spec as written and delegated decisions and non-destructive
implementation actions. Add `plugins/foreman-line/ops-console/tests/ui-fixture.ts`
to Allowed Files for shared mocked-browser setup/teardown; this avoids duplicate
global test harness code and does not change product scope.
