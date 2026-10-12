---
ticket: FCA-U3
title: Session monitoring and launch outcome handoff
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

Module `session-monitoring` in the approved capability map; depends on FCA-U2.
Make Sessions a useful destination rather than an empty placeholder or a hidden
footer. Show what the console actually launched, distinguish pane liveness from
completion, and connect launch outcomes to inspectable sessions and attach paths.

## Constraints

- Existing GET `/api/spawns` receipts/liveness and guarded session actions are
  authoritative. Do not invent live model telemetry, costs, progress, timestamps,
  target labels, completion or health when the response does not contain them.
- Sessions describes console-recorded launches, not all Pi/Claude processes on
  the machine. Clearly state this coverage boundary in the empty/help copy.
- One tmux session can contain multiple action panes. Show both grouped session
  count and pane count; per-pane identity uses the existing session/pane subject
  contract, not receipt array position.
- Missing fields or unknown liveness render as unknown/unavailable, not zero,
  failed or complete. A dead pane means "Not running", not "Work complete".
- Search and absolute-root repository scope follow FCA-U1. Shared UI state and
  queue/session dispatch behavior follow FCA-U2. No new mutation API or inference.
- Preserve copyable attach command, clipboard-failure fallback, Explain and
  confirmation-gated Close/delete through the existing registry/dispatch path.
  "Close" describes the actual dispatched operation, not a promise that the UI
  itself immediately kills the terminal or cleans a worktree.
- Vanilla JS/HTML5; reuse the current tray renderer where helpful rather than
  duplicating event handling and data-fetching implementations.

## Acceptance Criteria

1. Sessions has title, purpose, refresh indicator, total session/pane counts,
   repository scope/search, and populated data from `/api/spawns`. Each pane shows
   actual session/pane id, liveness, harness/model, configured budget, repository,
   worktree path and created timestamp where present. Raw receipt is inspectable
   in Details. Display budget as configured guidance, not measured spending.
2. Successful launch's View sessions action opens Sessions and highlights the
   returned session if known; a missing/unknown session id triggers a fresh list
   and honest feedback, never a fabricated row. Preserve controls/draft state
   during this transition. Include a compact session summary elsewhere without
   requiring a permanently expanded footer/table.
3. Attach commands remain visible and copyable per group/pane. Clipboard failure
   keeps a selectable command and explains how to copy manually. Registered
   Explain and Close/delete actions are keyboard reachable, show pending/outcome
   state, and route through existing guarded APIs. Cleanup requires exact typed
   subject confirmation; cancellation or mismatch sends no request.
4. Periodic and manual refresh reconcile with current data without losing scope,
   query or an open confirmation dialog. Failed refresh preserves the last-known
   list with stale feedback; failed action remains visible rather than silently
   disappearing. There is no auto-respawn, automatic close, or automatic retry.
5. Empty state distinguishes no console-recorded launches from no matches in the
   current filter; offers Work queue or Clear filters as appropriate. More than
   200 panes are accessible through pagination with visible totals. A previously
   highlighted session is reachable by selecting its page or a clear link.
6. Real-browser checks demonstrate readable session rows at 1366/1920 widths and
   operable layout at 320/768/1024, meaningful announcements, labeled controls,
   correct focus return on close/cancel, and no console errors. DOM tests verify
   receipts, liveness refresh, copy fallback, guarded actions and launch handoff.

## Out of Scope

- System-wide agent discovery, token/cost telemetry, streaming terminal embedding,
  real-time socket service, auto-reaping worktrees or restarting dead panes.
- Changing the backend launch protocol, canonical receipt schema, dispatch
  permissions, CLI approval capture, or OS integration.

## Context & References

- [Approved direction](../../goals/foreman-ops-console/ux-redesign-capability-map.md)
- [Selection/launch dependency](FCA-U2-selection-launch.md)
- [Existing spawn receipts and lifecycle](FCA-P5-spawn.md)
- [Current UI contract](FCA-P6-console-ui.md)

## Commands

Run from `plugins/foreman-line/ops-console/`:

```sh
npx tsx --test tests/ui-tray.test.ts tests/ui-sessions.test.ts tests/ui-selection-launch.test.ts
npm test
npm run typecheck
npm run lint
```

No separate build step. Real-browser smoke uses fixture data/mocked writes;
real tmux/worktree lifecycle testing needs a disposable repository and explicit
owner authorization, not the operator's active worktrees.

## Project Structure and Code Style

Session renderers live in `ui/views/tray.js`; fetching and event binding stay in
`ui/app.js`. Add or revise matching `.d.ts` exports. node:test/tsx/jsdom tests live
in `tests/`. Continue single quotes, no semicolons, semantic HTML and escaping:

```js
const liveLabel = spawn.liveness === 'alive' ? 'Running' : 'Not running'
```

The example applies only to known alive/dead states; unknown data requires its
own label rather than using the example's fallback.

## Boundaries

- Always: distinguish sessions/panes and liveness/completion, preserve evidence,
  show honest coverage limits, test empty/error/unknown/large collections.
- Ask first: telemetry sources, receipt changes, dependencies or files outside
  Allowed Files.
- Never: fabricate running/completed/cost states, terminate on refresh, pipe a
  confirmation, or mutate goals/specs/receipts from frontend code.

## Verification Plan

Mocked-fetch DOM workflow exercises launch success → Sessions → copy attach →
refresh liveness → guarded close; include empty lists, filtered emptiness,
network/refusal failures, unknown fields and more than 200 receipts. Session
liveness from fixture refresh is not proof of real process launch; document the
boundary. Inspect actual Firefox and Chromium layouts with screenshots.

Mandated reviewer questions:
- Can the UI confuse dead panes with completed work or pane count with sessions?
- Does every session action preserve typed confirmation and visible outcomes?
- Are old receipts, unknown fields and large histories still inspectable?

## Allowed Files

- plugins/foreman-line/ops-console/ui/app.js
- plugins/foreman-line/ops-console/ui/app.d.ts
- plugins/foreman-line/ops-console/ui/index.html
- plugins/foreman-line/ops-console/ui/views/shell.js
- plugins/foreman-line/ops-console/ui/views/shell.d.ts
- plugins/foreman-line/ops-console/ui/views/tray.js
- plugins/foreman-line/ops-console/ui/views/tray.d.ts
- plugins/foreman-line/ops-console/ui/views/spawn-panel.js
- plugins/foreman-line/ops-console/ui/views/spawn-panel.d.ts
- plugins/foreman-line/ops-console/tests/ui-tray.test.ts
- plugins/foreman-line/ops-console/tests/ui-sessions.test.ts
- plugins/foreman-line/ops-console/tests/ui-selection-launch.test.ts

## Delegated implementation amendment — 2026-10-12

Owner approved this spec as written and delegated decisions and non-destructive
implementation actions. Add `plugins/foreman-line/ops-console/tests/ui-fixture.ts`
to Allowed Files for shared mocked-browser setup/teardown; this avoids duplicate
global test harness code and does not change product scope.
