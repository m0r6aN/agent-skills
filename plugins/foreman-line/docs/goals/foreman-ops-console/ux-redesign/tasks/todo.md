# UX redesign tasks — 2026-10-12

Owner delegated planning and non-destructive implementation. Implementation and
verification are complete; **human merge/deployment remain gated**. Root tasks
and coordinator ownership are unchanged. [Evidence and limitations](verification.md).
Paths below are relative to plugins/foreman-line/ops-console.

## 1. Explicit repository identity (FCA-U1)
- [x] Add repoRoot to every goal status without changing existing fields.
- [x] Test primary/extra-root and same-basename identity; correct globally colliding
      tree aliases under the documented delegated spec amendment.
- Verify: multi-root/API checks and full suite.
- Files: src/api.ts, src/config.ts, tests/multi-root.test.ts.
- Savepoints: `1c3f124f`, `aa9c3e97`. Dependencies: none.

## 2. Operator shell (FCA-U1)
- [x] Four task-oriented primary destinations, explained tools, contextual search,
      skip link, no empty launch rail, hash navigation hooks.
- [x] Responsive charcoal layout, readable rows/cards and honest state slots.
- Verify: shell/navigation tests; Chromium/Firefox screenshots and axe.
- Files: ui/index.html, ui/views/shell.js and .d.ts, tests/ui-shell.test.ts,
  tests/ui-navigation.test.ts. Dependencies: 1.

## 3. Navigation and scoped data (FCA-U1)
- [x] Root/search/severity/state/page filters; active/inactive goals; hash history.
- [x] Refresh counts, independent goal/detail races, stale/HTTP/network/malformed
      recovery. Skip link preserves the active view.
- [x] Preserve browse/add/remove, notification/alert guidance, registered flows and
      routing policy. Secondary tools show selected goal/root context.
- Verify: navigation/fleet workflows and full package checks.
- Files: ui/app.js and .d.ts, tests/ui-navigation.test.ts, tests/ui-fixture.ts,
  existing fleet module/tests. Dependencies: 2.

## Checkpoint — workspace
- [x] Package checks pass; existing capabilities retained.
- [x] Verified integration savepoint `6a68cfc5`; review corrections `874a5d45`,
      `b57f7ff6`. Interfaces were updated with behavior to keep savepoints coherent.

## 4. Selection state (FCA-U2)
- [x] Full-id selection, explicit offered verbs/default Investigate, no bulk delete.
- [x] Retain unavailable findings; renewed review for changed defaults; never widen
      permissions silently. Merge false in frontend payloads and guarded by backend.
- Verify: eligibility/identity/reconciliation tests and real planner composition.
- Files: ui/views/selection.js and .d.ts, tests/ui-selection-launch.test.ts.
- Dependencies: 3.

## 5. Select and review (FCA-U2)
- [x] Queue/parcel selection with precise root+qualified-subject joins; visible-page
      select/clear and Shift ranges. No invented action for unmapped parcels.
- [x] Per-item action/permissions; one shared configuration and extra direction.
      Same-verb row actions preserve reviewed drafts.
- [x] Native dialog focus containment, Escape/return; drafts survive refresh/navigation.
- Verify: DOM flows, keyboard and mobile Chromium/Firefox inspection.
- Files: ui/app.js, ui/views/{board,signals,spawn-panel}.js and matching .d.ts,
  tests/ui-selection-launch.test.ts. Dependencies: 4.

## 6. Submit and outcomes (FCA-U2)
- [x] One POST/N explicit actions and duplicate-submit guard; complete pane-index
      confirmation required before clearing submitted selections.
- [x] Persistent success/uncertainty; keep failed drafts. Read-only refresh and
      explicit acknowledgement before retry. Never automatically resubmit.
- [x] Separate exact typed cleanup confirmation and visible refusal/command details.
- Verify: spawn/signals/selection tests, package checks and mocked browser launch.
- Files: ui/app.js, ui/views/spawn-panel.js and .d.ts, tests/ui-{spawn-panel,signals,
  selection-launch}.test.ts, tests/ui-fixture.ts. Dependencies: 5.

## Checkpoint — launch
- [x] Selection→review→payload agrees with the real one-session/N-pane planner.
- [x] No deletion or real operator session/worktree launch in verification.
- [x] Package checks pass; savepoints `6a68cfc5`, `874a5d45`.

## 7. Session presentation (FCA-U3)
- [x] Session/pane metrics, honest known/unknown liveness and actual receipt fields.
- [x] Session context, attach commands, inspectable raw receipts and accessible
      pagination beyond 200 rows. No fabricated completion/spending telemetry.
- Verify: tray/session tests and actual browser screenshots.
- Files: ui/views/tray.js and .d.ts, tests/ui-{tray,sessions}.test.ts.
- Dependencies: 6.

## 8. Session interactions (FCA-U3)
- [x] Launch reveal/highlight/page selection, unobstructed by old scope/search.
- [x] Clipboard success/fallback, visible action outcomes, guarded close/cancel.
- Verify: DOM and real-browser workflows; all writes mocked.
- Files: ui/app.js, tests/ui-{sessions,tray,selection-launch}.test.ts.
- Dependencies: 7.

## 9. Verification and handoff
- [x] Chromium + Firefox: primary views at 320/768/1024/1366/1920; no page overflow
      or unexpected console exceptions. Real screenshots exposed/fixed mobile text
      squeezing and missing metrics styling; narrow text-width regression added.
- [x] Keyboard review/focus return, empty/stale/loading/initial-error recovery;
      200%-equivalent viewport reflow. Actual browser zoom gesture is not claimed.
- [x] 347 tests, typecheck, lint, spec validation, audit (zero vulnerabilities),
      diff check; source review, fixture harness, raw report and screenshot evidence.
- [x] Independent core review requested changes; fixes reproduced/tested; rereview
      reported no remaining Critical/Required findings (inspection scope documented).
- [x] Branch pushed; [PR #198](https://github.com/m0r6aN/agent-skills/pull/198)
      opened for human review. No automatic merge.
- [ ] Human merge/deploy approval; suggested actual zoom/assistive-technology check.
- Files: goal-local plan/todo/verification, browser-smoke.mjs, browser-report.json,
  representative screenshots; spec allowed-file/lifecycle records.
- Dependencies: 8. Product server/coordinator were not stopped or transferred.
