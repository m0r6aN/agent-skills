---
ticket: TO-P6
title: Selection-keyed settled refresh
status: draft
owner: clinton.morgan
created: 2026-10-10
updated: 2026-10-10
supersedes: null
superseded_by: null
risk: standard
routing_class: standard-feature
verification_class: judgment-required
permission_profile: builder-standard
data_classification: public
surfaces:
  - plugins/foreman-line/ops-console/ui/app.js
  - plugins/foreman-line/ops-console/ui/index.html
  - plugins/foreman-line/ops-console/tests/ui-refresh.test.ts
---

## Intent

Implement the accepted REF (observation-contract-amendment.md) in the
dependency-free ops-console UI: every refresh issues list/status counts, board,
alerts/remedies, routing, and (when a parcel is selected) detail/chain/logs/docs
requests as one generation; all current-generation requests settle before any
of them commit; commit applies only to the captured generation and the captured
goal/parcel selection. Selection is snapshotted immutably before any await, so
a user switching goal or parcel mid-flight cannot have stale (A-key) data
committed under the new (B-key) selection. Each scoped panel is cached by
goalKey (and parcelKey where relevant); global list/counts are cached
separately. Every cached entry carries `lastSuccess`, `error`, and
`freshness: 'current' | 'stale' | 'unavailable'`. First-load failure renders
null data with a visible error; a later same-key failure retains the prior
success labeled stale; a subsequent success clears the error.

Goal switching immediately clears ALL prior-goal panels (board, alerts,
routing, detail, docs) before new data arrives. A successful board whose
parcels no longer include the selected parcel clears the detail panel. A
successful authoritative `/api/goals` response that omits the selected goal
clears it with a distinct "missing" notice; a goal present but `active: false`
is deliberately cleared during successful-list reconciliation and shows a distinct "inactive"
notice (the picker filters to active goals but `/api/goals` retains inactive
ones). A failed list request retains the current selection explicitly labeled
stale — never falsely vanished. A valid active selection is preserved across
refreshes; the picker and global counts re-render from every settled list
response. Stale cached logs/detail can never resurrect a cleared panel.

## Constraints

- Dependency-free: no new runtime or dev dependencies, no manifest changes.
  Plain browser JS served as-is; no new module-loading scheme (keep the single
  `/app.js` script tag in index.html).
- At most 5 implementation files; expected scope is `ui/app.js`, optionally
  `ui/index.html` (classifier-limitations explanation + freshness/staleness
  status affordances), and NEW `tests/ui-refresh.test.ts`.
- Non-2xx and malformed JSON responses are treated as failures; every async
  callback (refresh, poll, picker change, card click, notification delete,
  flow invoke) handles rejection — zero unhandled rejections.
- Preserve existing routes, the frozen flow registry, the five parcel states,
  read-only rights, and both console-local state files
  (notifications + invocation audit). No API or server change.
- No uniform-freshness assertion across panels; no atomic filesystem snapshot
  claim; no cross-key cache reads (A data never renders under B key).
- The UI must state classifier limitations where staleness/liveness is shown:
  queued or unmatched work can appear hung; mtime/worktree composites cannot
  prove liveness.
- Tests introduce a minimal Node VM/DOM harness under existing `npm test` (tsx --test,
  node:test) — no frameworks, no jsdom dependency. Real-browser proof is
  TO-P7; the DOM harness does not substitute for it.

## Acceptance Criteria

1. One generation: a single refresh issues all panel requests for the captured
   selection; commit happens only after every request in that generation has
   settled (fulfilled or rejected); a request resolving after its generation
   was superseded is discarded.
2. Immutable selection: goalKey/parcelKey are captured synchronously before
   the first await; all commits validate against the captured key.
3. Cache semantics: per-key entries with `lastSuccess`/`error`/`freshness`;
   first failure ⇒ data null, lastSuccess null, freshness `unavailable`;
   later same-key failure ⇒ prior success retained, labeled `stale`; recovery
   success ⇒ error cleared, freshness `current`.
4. Goal switch immediately clears all old-goal panels before new data commits.
5. Successful board missing the selected parcel clears the detail panel; stale
   logs/docs never repopulate it.
6. Successful list absence ⇒ clear goal + "missing" notice; inactive ⇒
   distinct "inactive" notice, cleared during successful-list reconciliation; list failure ⇒
   selection retained, labeled stale.
7. Valid active selection preserved across refreshes; picker + global counts
   update on every settled list response.
8. Unknown-only attention must explicitly identify ratification evidence as unknown in the board banner, alongside the existing remedy; test a goal whose only attention is ratificationUnknown:1 so an empty explanation cannot pass.
9. `npm test`, `npm run typecheck`, `npm run lint` all pass; new tests are
   deterministic and meaningful (no tautologies).

## Out of Scope

- Server/API changes, new routes, new state files, dependency or manifest
  edits, build tooling, real-browser/E2E automation (TO-P7), and any mutation
  of goal/receipt/spec/contract data.

## Context & References

- `plugins/foreman-line/docs/goals/trustworthy-observation/observation-contract-amendment.md` (REF)
- `plugins/foreman-line/docs/goals/trustworthy-observation/observation-scenarios.md` (REF-P, REF-N)
- `plugins/foreman-line/docs/specs/active/FCA-P0-ops-console-multi-root-and-status-index.md` §2
- `plugins/foreman-line/docs/goals/foreman-ops-console/charter.md` (open questions; R1–R5)
- Current UI: `plugins/foreman-line/ops-console/ui/app.js`, `plugins/foreman-line/ops-console/ui/index.html`; current API tests: `plugins/foreman-line/ops-console/tests/api.test.ts`; scripts: `plugins/foreman-line/ops-console/package.json`

## Allowed Files

- `plugins/foreman-line/ops-console/ui/app.js` (modify)
- `plugins/foreman-line/ops-console/ui/index.html` (modify, optional)
- `plugins/foreman-line/ops-console/tests/ui-refresh.test.ts` (new)
Any additional file requires an exact scope amendment committed before code; no wildcard authorization.

## Verification Plan

`tests/ui-refresh.test.ts` loads `app.js` in a Node VM with a minimal scripted
DOM stub and a controllable fake `fetch` (per-URL deferred promises), covering:

- Hostile delayed resolution: slow board response commits after fast alerts;
  ordering does not matter, only generation membership.
- A/B race: switch goal A→B mid-flight; A's late success never commits under
  B; B's panels show B data or unavailable, never A.
- Overlapping refreshes on the same key: earlier generation discarded.
- List failure with prior success: selection retained, panels labeled stale.
- First-load failure: null data, `unavailable`, visible error, no crash.
- Recovery: success after failure clears error, freshness `current`.
- Detail-missing: board success without selected parcel clears detail; a late
  stale logs response cannot resurrect it.
- Inactive vs missing: distinct notices; inactive is deliberately cleared on successful reconciliation;
  missing clears immediately.
- Stale counts: list failure leaves prior counts rendered and labeled stale.
- Action errors: notification DELETE and `/api/invoke` rejection are caught;
  no unhandled rejection (assert via process listener).

Then run full `npm test`, `npm run typecheck`, `npm run lint`. Deterministic
cases only; no timers beyond the controllable fake clock/fetch.

Reviewer questions:
1. Do all commits and event-driven requests obey immutable generation/selection guards?
2. Do successful absent/inactive responses clear selection with distinct notices, while list failures retain it visibly stale?
3. Does each panel retain only same-key success and expose independent freshness without an atomic observation claim?

Coordinator draft corrections: inactive evidence deliberately clears selection on successful reconciliation; no new owner action required. Removed unnamed Allowed Files, corrected existing-harness claim and references. Draft outside active: no emitted shaping result, receipt, activation, dispatch, or implementation acceptance. Parent source and owner reconciliation required before activation.

Verification class corrected to the current schema-supported judgment-required: this introduces refresh behavior, not a claimed equivalence proof. Historical FCA-P0 metadata is not a current schema template.
