# UX redesign tasks — 2026-10-12

Plan and execution decisions delegated by owner. Paths below are relative to
plugins/foreman-line/ops-console unless stated otherwise. No root task overwrite.

## 1. Explicit repository identity (FCA-U1)
- [ ] Add repoRoot to every goal status without changing existing fields.
- [ ] Test primary/extra-root identity including same-basename repos.
- Verify: API + multi-root tests; full package checks.
- Files: src/api.ts, tests/api.test.ts, tests/multi-root.test.ts.
- Dependencies: none.

## 2. Operator shell (FCA-U1)
- [ ] Four primary task labels, explained secondary tools, contextual search,
      skip link, no empty permanent spawn rail, hash navigation hooks.
- [ ] Responsive charcoal layout and readable rows; loading/error/empty slots.
- Verify: ui-shell and navigation tests; real-browser layout inspection later.
- Files: ui/index.html, ui/views/shell.js, ui/views/shell.d.ts,
  tests/ui-shell.test.ts, tests/ui-navigation.test.ts.
- Dependencies: 1.

## 3. Navigation and scoped data (FCA-U1)
- [ ] Working root/search/severity/page filters; view hashes + history.
- [ ] Refresh goals/counts and race-safe detail; recover from API/network failure.
- [ ] Retain repository browse/add/remove, alerts, flow tools, routing policy.
- Verify: navigation/fleet DOM scenarios, full package checks.
- Files: ui/app.js, ui/views/fleet.js, tests/ui-navigation.test.ts,
  tests/ui-fleet.test.ts, tests/ui-fixture.ts.
- Dependencies: 2.

## Checkpoint — workspace
- [ ] Tests/typecheck/lint pass; no capability silently removed.
- [ ] Save-point commits recorded.

## 4. Selection state (FCA-U2)
- [ ] Identity-based selection, explicit verbs/default Investigate, no bulk delete.
- [ ] Refresh reconciliation retains unavailable items and marks changed permission
      defaults for renewed review; filter changes preserve draft/selection.
- Verify: pure identity, eligibility, reconciliation + planner tests.
- Files: ui/views/selection.js, ui/views/selection.d.ts,
  tests/ui-selection-launch.test.ts.
- Dependencies: 3.

## 5. Select and review (FCA-U2)
- [ ] Queue + parcel checkboxes and visible-page bulk/Shift selection.
- [ ] Review selected items/verbs/permissions; one shared configuration + extra text.
- [ ] Native dialog focus/Escape/return; keep draft on navigation/refresh.
- Verify: DOM workflows, keyboard and mobile review later.
- Files: ui/app.js, ui/views/board.js, ui/views/signals.js,
  ui/views/spawn-panel.js, tests/ui-selection-launch.test.ts.
- Matching changed .d.ts exports updated in a separate interface-only slice.
- Dependencies: 4.

## 6. Submit and outcomes (FCA-U2)
- [ ] One POST/N explicit actions, duplicate-submit guard, retain failure drafts.
- [ ] Success/uncertainty readable and persistent; no automatic retry.
- [ ] Separate exact typed cleanup flow with visible refusal.
- Verify: ui-spawn-panel/signals and selection DOM tests, full package checks.
- Files: ui/app.js, tests/ui-spawn-panel.test.ts, tests/ui-signals.test.ts,
  tests/ui-selection-launch.test.ts, ui/views/spawn-panel.d.ts.
- Dependencies: 5.

## Checkpoint — launch
- [ ] Selection→review→payload matches planner (one session/N panes).
- [ ] No deletion or real session launch performed in verification.
- [ ] Tests/typecheck/lint pass; save-point commit.

## 7. Session presentation (FCA-U3)
- [ ] Explicit session/pane counts, known/unknown liveness, actual receipt fields.
- [ ] Group context, attach commands, inspectable receipts, paginated history.
- Verify: tray/session rendering tests; no fabricated telemetry.
- Files: ui/views/tray.js, ui/views/tray.d.ts, tests/ui-tray.test.ts,
  tests/ui-sessions.test.ts.
- Dependencies: 6.

## 8. Session interactions (FCA-U3)
- [ ] Launch handoff/highlight/pagination; refresh and root/query filtering.
- [ ] Attach clipboard fallback, explain outcome, guarded close/cancel.
- Verify: DOM launch/session scenarios; full package checks.
- Files: ui/app.js, tests/ui-sessions.test.ts, tests/ui-tray.test.ts,
  tests/ui-selection-launch.test.ts.
- Dependencies: 7.

## 9. Final verification and handoff
- [ ] Browser screenshots at 320/768/1024/1366/1920; no overflow/console errors.
- [ ] Keyboard review dialog + focus return, empty/error/loading states.
- [ ] Chromium and Firefox verification, or explicit unavailable-browser limitation.
- [ ] Review for scope/safety/accessibility; evidence summary, commits, push/PR.
- Files: goal-local plan/todo/evidence, spec lifecycle records as appropriate.
- Dependencies: 8. External adversarial approval not claimed without a reviewer.
