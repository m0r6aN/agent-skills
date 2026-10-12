# Implementation plan — ops-console UX redesign

Owner approved FCA-U1/U2/U3 and this location on 2026-10-12, delegating decisions
and all non-destructive completion actions. No destructive real-world operation
or bypass of the human merge gate is part of this plan.

## Architecture decisions

- Keep vanilla ES modules and the existing guarded backend. Add only explicit
  repoRoot metadata to goal statuses. No dependencies/build pipeline.
- Keep internal view ids (`signals`, `board`, `sessions`, `fleet`) for existing
  integrations, with task-oriented labels. Hash navigation and per-view search;
  secondary `remedies`, `audit`, `settings` stay reachable with honest names.
- State lives outside DOM: selected targets keyed by authoritative signal id,
  per-view filters/pages, launch drafts and outcomes. Pure selection helpers in
  ui/views/selection.js; existing static-module route serves them unchanged.
- A native dialog is the on-demand launch drawer. Explicit non-destructive action
  choices, per-item permissions, one shared controls block. Delete/cleanup takes
  a separate typed-confirmation path. Never bulk-spawn destructive actions.
- One refresh snapshot reconciles goals, signals/actions, fleet and sessions.
  Request generation guards prevent stale goal detail or refresh overwrites.
  Independent section errors preserve usable last-known data.
- Pagination renders at most 200 records per view with access to all records.
  No framework, generalized state manager, or unearned abstraction.
- Use existing browser binaries with an isolated profile for visual checks.
  Tests/browser fixtures mock writes; no real tmux/operator worktree launches.

## Ordered slices

1. Goal root metadata and API tests. Verification amendment: reserve colliding
   extra-tree aliases globally in src/config.ts; preserve all non-colliding keys.
2. Navigation shell and accessible/responsive visual foundation.
3. Wire scope/search/hash/refresh/errors; retain secondary tools and repository management.
   Checkpoint: full tests/typecheck/lint; desktop + narrow visual preview.
4. Pure persistent selection/reconciliation/eligibility tests and helper.
5. Selection on queue + parcels and review drawer with draft retention.
6. One-request launch, guarded cleanup, readable/uncertain outcomes.
   Checkpoint: DOM selection→review→N-pane planner path; full package checks.
7. Session renderer: real fields, unknown states, pagination, coverage copy.
8. Session handoff, attach/copy fallback, action outcomes and confirmation.
   Checkpoint: full suite + Chromium browser scenarios/screenshots + keyboard/overflow checks.
9. Review changes against specs; record evidence, limitations, and any remaining
   external/manual review. Commit/push/PR without merging under human identity.

Task acceptance criteria and file slices are in todo.md. Modules are sequential
because app.js and shell/style surfaces are shared. Each verified slice gets a
save-point commit; no unrelated backend or OS change is mixed into this work.

## Risks and mitigations

- Old tests equate hard-coded layout with correctness: replace these assertions
  with operator workflows, preserve negative guards and immutable backend tests.
- Failed launches may have side effects: never auto-retry, preserve draft, explain
  uncertainty and refresh Sessions. An explicit acknowledgement is required before
  a deliberate retry; even a backend HTTP 400 launch-failure can have side effects.
- Root aliases and same basenames: explicit absolute roots, goal-qualified joins.
- Refresh races and drafts: generation guards, no DOM-as-state, don't rebuild an
  open confirmation or launch editor on background refresh.
- Missing browser: Chromium available; Firefox absent at planning. Attempt a
  disposable test runtime if available without changing project dependencies;
  otherwise mark Firefox verification outstanding, not equivalent to jsdom.

## Verification commands

From plugins/foreman-line/ops-console:
`npm test`, `npm run typecheck`, `npm run lint`.
Focused tests: `npx tsx --test tests/ui-*.test.ts` or relevant individual files.
Final evidence, independent review resolutions, screenshots, rollout/rollback and
verification limits: [verification.md](verification.md). Integration/UI interfaces
were committed together at a verified savepoint; API and alias changes are separate.
Specs: spec-linter public validate CLI. DOM/browser fixture logs and screenshots
are captured as evidence outside generated production state. Do not launch tests
against the operator's app endpoint when a disposable mocked server suffices.
