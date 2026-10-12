---
ticket: FCA-U1
title: Workspace navigation and responsive operator layout
status: active
owner: clinton.morgan
created: 2026-10-12
updated: 2026-10-12
supersedes: null
superseded_by: null
risk: standard
surfaces:
  - plugins/foreman-line/ops-console/ui
  - plugins/foreman-line/ops-console/src/api.ts
routing_class: standard-feature
verification_class: judgment-required
permission_profile: builder-standard
data_classification: internal
---

## Intent

Module `workspace-navigation` in the owner-approved UX capability map.
Make the console understandable on first use: four task-oriented destinations,
a work queue as the default, clear repository scope, working search, and readable
responsive layouts. Preserve technical capabilities as secondary tools rather
than equal-priority destinations.

## Constraints

- Vanilla JS/HTML5 and existing ES-module serving; no new framework, dependency,
  build step, external fonts, CDN, or network service.
- Existing APIs and projection rules remain authoritative. One additive read-only
  metadata change is allowed: each `/api/goals` status gets `repoRoot: tree.root`.
  Existing response fields and callers remain compatible; no inferred root from
  current working directory, subject parsing, alias, or basename.
- Four primary destinations: Work queue, Goals & parcels, Sessions, Repositories.
  Secondary tools retain alerts/unblock guidance, frozen flow invocation, and
  read-only routing-policy inspection. The existing "Audit" flow controls become
  "Flow tools"; do not imply audit history that the API does not provide.
- Queue and Sessions scope to the selected absolute repository root. Goal choices
  use the additive status metadata. Repositories always lists all registered roots.
  An explicit All repositories option is the default; scope is a view filter,
  not authorization or permission to launch. Show repo basename plus full path
  where disambiguation matters.
- View search matches that view's records, not raw DOM text that may contain
  hidden evidence or implementation data. Label it "Search this view" with a
  contextual placeholder. Queue: subject/repo/class; goals: goal key/parcel key;
  Sessions: session/pane/model/repo; Repositories: root/remote. It is not advertised
  as cross-view global search. Search and severity combine; severity controls
  apply only where severities exist, not as unrelated global navigation controls.
- Modern dark operations palette: neutral charcoal surface tokens, legible
  typography, restrained accent, consistent spacing, visible focus. Status uses
  text plus color; gates explain ratify/dispatch/merge on first encounter.
- Default content uses readable rows, with parcel state badges/filtering instead
  of five mandatory narrow columns. Evidence, receipts and raw logs remain
  accessible through detail disclosure. An empty launch rail is not reserved.
- Replace FCA-P6 layout-only requirements as described in the approved-direction
  map, subject to detailed-spec approval. Preserve its safety/API contracts.

## Acceptance Criteria

1. First load opens Work queue with title, purpose, repository scope, item count,
   search and visible empty/loading/error states. Every primary/secondary nav
   destination has meaningful content or an honest contextual empty state; no
   blank Sessions page or misleading Settings/Audit labels. Sessions content is
   completed by FCA-U3; interim empty states must identify what is unavailable.
2. Selecting a repository filters queue/session records and goal choices using
   explicit root identity. Same-basename repositories never merge. A repository
   with no goals can still show non-goal findings and sessions. Add/remove retains
   existing folder qualification, primary-root refusal and inline error handling.
3. Search and filters work after refresh/navigation. Active view is reflected in
   URL hash, reload/back/forward restore it, unknown hash falls back safely to the
   queue. Goal/scope changes cannot let an older request overwrite a newer view.
4. At 1920 and 1366 pixels wide, no unintended horizontal page overflow and no
   permanent empty right panel; at 1024/768/320, navigation and controls reflow,
   details remain reachable and scrolling is allowed. Tables may scroll locally
   or adapt to rows. At 200% zoom, primary actions remain reachable.
5. All controls have visible names, visible keyboard focus and logical tab order.
   There is a skip-to-content link, one page h1, semantic navigation, and useful
   screen-reader announcements for loading/results/errors. Normal text contrast
   meets 4.5:1; state is never color-only.
6. HTTP failure, malformed response and network failure produce understandable
   feedback and Retry. A failed initialization cannot leave a blank application;
   periodic failures preserve last-known data with a stale marker and timestamp.
   Initial and repeated background refreshes update goal counts as well as records.
7. Lists above 200 records are paginated with visible totals and Next/Previous;
   all records remain reachable. Old tests hard-coding seven views or a persistent
   spawn rail are replaced with these stronger behavioral requirements.

## Out of Scope

- New goals, coordinator ownership transfer, new signal derivations, backend
  permission changes, new audit-history API, model discovery or billing.
- Operating-system launcher/bar changes or automatic real session launches.
- Permission to supersede backend contracts or remove evidence/flow capabilities.

## Context & References

- [Approved direction and contract delta](../../goals/foreman-ops-console/ux-redesign-capability-map.md)
- [Current UI contract](FCA-P6-console-ui.md)
- [Charter amendment](../../goals/foreman-ops-console/AMENDMENT-2026-10-11-control-center.md)
- [UI engineering workflow](../../../../../skills/frontend-ui-engineering/SKILL.md)
- [Accessibility checklist](../../../../../references/accessibility-checklist.md)

## Commands

Run from `plugins/foreman-line/ops-console/`:

```sh
npm test
npm run typecheck
npm run lint
FOC_REPO_ROOT="$(git rev-parse --show-toplevel)" npm start
```

No separate build step. Start remains loopback-only. Tests use node:test, tsx,
and jsdom; browser inspection uses installed Firefox/Chromium without adding a
project dependency.

## Project Structure and Code Style

`ui/views/` contains pure ES-module renderers; `ui/app.js` owns API wiring and
state, `ui/index.html` owns styling. Tests belong in `tests/`. Continue named
exports, single quotes, no semicolons, escaped dynamic HTML, and matching `.d.ts`
declarations where exported renderer signatures change:

```js
export function queueHeading(count) {
  return `<h2>Work queue <span class="muted">${esc(count)} items</span></h2>`
}
```

## Boundaries

- Always: escape data, preserve explicit repo identity, test both empty and
  populated records, run package checks, keep unknown/error distinct from zero.
- Ask first: new dependencies, write APIs, changes to projection/authorization,
  or file changes outside Allowed Files.
- Never: manufacture evidence, launch as a refresh side effect, drop records to
  satisfy a render cap, or describe structural/jsdom tests as visual verification.

## Verification Plan

Mocked-fetch DOM tests cover navigation, search, scope, request races, retries,
and large datasets. API tests cover the additive root metadata for multiple trees.
Capture actual browser screenshots at the specified widths, verify keyboard
navigation and overflow, and inspect console errors. Package checks must pass.

Mandated reviewer questions:
- Do secondary tools preserve every existing capability without misleading names?
- Can repositories with identical names, empty goals, or unknown status leak scope?
- Do responsive layouts and error states remain operable rather than merely render?

## Allowed Files

- plugins/foreman-line/ops-console/ui/index.html
- plugins/foreman-line/ops-console/ui/app.js
- plugins/foreman-line/ops-console/ui/views/shell.js
- plugins/foreman-line/ops-console/ui/views/shell.d.ts
- plugins/foreman-line/ops-console/ui/views/board.js
- plugins/foreman-line/ops-console/ui/views/board.d.ts
- plugins/foreman-line/ops-console/ui/views/signals.js
- plugins/foreman-line/ops-console/ui/views/signals.d.ts
- plugins/foreman-line/ops-console/ui/views/fleet.js
- plugins/foreman-line/ops-console/ui/views/fleet.d.ts
- plugins/foreman-line/ops-console/src/api.ts
- plugins/foreman-line/ops-console/tests/api.test.ts
- plugins/foreman-line/ops-console/tests/multi-root.test.ts
- plugins/foreman-line/ops-console/tests/ui-shell.test.ts
- plugins/foreman-line/ops-console/tests/ui-fleet.test.ts
- plugins/foreman-line/ops-console/tests/ui-navigation.test.ts

## Delegated implementation amendment — 2026-10-12

Owner approved this spec as written and delegated decisions and non-destructive
implementation actions. Add `plugins/foreman-line/ops-console/tests/ui-fixture.ts`
to Allowed Files for shared mocked-browser setup/teardown; this avoids duplicate
global test harness code and does not change product scope.
