---
ticket: FCA-P8
title: Reconciliation view — local vs remote parcel state, history, and hung explanations
status: draft
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

Module `reconciliation` in `session-ledger-capability-map.md`; depends on
FCA-P7. The console derives `hung` from receipts and heartbeat alone, so any
parcel that shipped without a hand-edited record looks abandoned (observed
2026-10-13: 34 `hung` parcels across 5 goals; FOC-P0 had shipped via PR #147).
This parcel compares what the **local** record claims with what **local git and
the remote** show, per parcel, names every disagreement from a closed
vocabulary with evidence, and explains in operator terms why a parcel is
`hung`. It reports and recommends; it never repairs.

## Constraints

- **No parcel-state change.** The FOC-P0 five-state vocabulary and rules R1–R5
  are frozen. Reconciliation is a separate, additive dimension beside `state`,
  not a new state and not an input to derivation.
- **Read-only.** Sources: spec location/frontmatter, `INDEX.md` row, goal queue
  marker, receipt chain, local branches and worktrees, last-fetched remote refs,
  and `gh` read queries. No fetch, push, merge, or close is performed by this
  module. Refreshing remote refs is a separate, explicit, confirmation-gated
  action (Ask first).
- **Remote facts carry their age.** Every remote-derived fact shows "as of"
  (ref fetch time or `gh` query time). If `gh` is unauthenticated or offline the
  remote column reads `unavailable` with the reason; it is never inferred from
  local data.
- **Deterministic linking only.** A parcel links to a branch, worktree, PR or
  commit only by its exact parcel key appearing as a delimited token in the
  branch name, worktree basename, PR title/head ref, spec filename, or commit
  subject. No fuzzy matching. Ambiguity (key matches several candidates, or a
  candidate matches several keys) is shown as `ambiguous` evidence, not resolved.
- Route table is frozen: prefer additive fields on existing parcel/alert
  responses. A new `GET /api/reconcile` is permitted only with an owner-ratified
  amendment (Ask first).
- Scale: designed for hundreds of parcels (pagination, counts, filters); no
  per-parcel network call on page render (batched, cached with visible age).

## Discrepancy vocabulary (closed)

| Code | Meaning | Evidence required |
|---|---|---|
| `shipped-unrecorded` | Merge evidence on the default branch, but spec not in `done/` or queue item unmarked | merged PR or commit on main naming the key; record fields |
| `recorded-unshipped` | Spec in `done/` or item marked closed, but no merge evidence | record fields; absence of PR/commit evidence stated |
| `unmerged-work` | Local commits or an open PR exist that are not on main | branch/PR identity, ahead count, PR state |
| `orphan-worktree` | Worktree linked to the key with no live pane and no unique commits | worktree path, ledger evidence (FCA-P7) |
| `never-started` | Key in the queue with no spec, chain, branch, worktree, PR, or commit | explicit list of sources checked |
| `local-remote-divergence` | Default branch ahead/behind remote, or key's branch diverged from its PR head | ahead/behind counts, ref ages |
| `stale-abandoned` | `hung` with none of the above | last-progress time, threshold, liveness reason |

A parcel may carry several codes. Each code carries a preserve-first remedy
pointer reusing the FCA-P1 option shape (recover/complete first; close/defer
last and labelled last-resort).

## Acceptance Criteria

1. For every parcel in a goal, the response includes `reconciliation`:
   `{ local, remote, discrepancies[], history[] }`, each fact with source and
   as-of time. Existing `state`/`rule` values are byte-identical (regression).
2. Fixture corpus covers every discrepancy code, plus a parcel with none, plus an
   ambiguous-link case, plus remote `unavailable`.
3. Replaying the 2026-10-13 situation as a fixture (FOC-P0 shipped via a merged
   PR with spec in `active/`) yields `shipped-unrecorded` naming that PR.
4. **Hung explanation**: each `hung` parcel exposes the exact derivation inputs
   (last progress timestamp and source, threshold and source, liveness verdict
   and reason, rule R4 text) in plain language, plus which discrepancy codes
   apply. No `hung` parcel is shown without this panel.
5. **History timeline**: per-parcel merged, chronological view of receipts,
   commits, PR events, and ledger sessions (FCA-P7), each linking to its
   evidence. Missing sources are listed as absent, not omitted.
6. **Reconciliation view** (UI): goal-grouped table with Local | Remote |
   Discrepancy columns; counts per code; filters by code, goal and repo;
   pagination; bulk-select feeding the existing launch panel with an
   `investigate`/`explain` verb. Keyboard operable; verified in a real browser.
7. Remote unavailable (no network or unauthenticated `gh`) degrades visibly and
   preserves all local facts; no discrepancy that depends on remote data is
   asserted in that mode.
8. A 500-parcel synthetic goal renders and filters within an agreed budget
   (proposed: first paint under 2 s, no per-row network calls).
9. The module performs no writes outside console-local state and runs no git
   or `gh` write command (asserted by a negative-control test, as in
   `tests/read-only.test.ts`).

## Out of Scope

- Moving specs, editing queue items, or opening closure PRs (`closure-proposal`
  module, not drafted).
- Changing parcel-state derivation, gate proxies, alert rules, or thresholds.
- Fetching or pulling remotes, deleting branches/worktrees, closing PRs.
- Multi-remote or non-GitHub hosts; cross-repo parcel keys beyond the declared
  fleet.
- Resolving the 34 current `hung` parcels; this parcel only makes them
  diagnosable.

## Context & References

- [Session ledger](FCA-P7-session-ledger.md) — supplies session/worktree evidence
- [Remediation advisor](FCA-P1-remediation-advisor.md) — option/remedy shape
- [Frozen derivation rules](FOC-P0-projection-contract-and-discovery-inventory.md)
- [Capability map](../../goals/foreman-ops-console/session-ledger-capability-map.md)

## Open Questions

- **OQ1 default-branch source of truth**: `origin/main` as last fetched
  (proposed) versus live `gh` default-branch query.
- **OQ2 link tokens**: confirm the delimiter set and whether commit-body
  mentions count or only subjects (proposed: subjects and branch/PR names only).
- **OQ3 explicit remote refresh**: who may trigger a fetch, and does it route
  through `/api/invoke` as a new confirmation-gated flow (amendment) or stay a
  copyable command only (proposed).

## Commands

Run from `plugins/foreman-line/ops-console/`:

```sh
npx tsx --test tests/reconcile.test.ts tests/reconcile-read-only.test.ts tests/ui-reconcile.test.ts
npm test
npm run typecheck
npm run lint
```

## Boundaries

- Always: show source and age for every fact, keep ambiguity visible, test the
  unavailable-remote and large-collection paths, preserve frozen vocabularies.
- Ask first (amendment required before dispatch): any new route, any new
  confirmation-gated flow, adding `gh` as an invoked dependency, new writable
  state.
- Never: infer remote state from local data, fuzzy-link, assert a discrepancy
  on missing evidence, mutate records, or alter derived `state`.

## Verification Plan

Fixture corpus per discrepancy code; read-only negative control; 500-parcel
synthetic load; real-browser pass at 1366 and 320 widths.

Mandated reviewer questions:
- Can any discrepancy be asserted without the evidence it names?
- Does stale remote data ever read as current?
- Can a link ever attach the wrong PR or branch to a parcel silently?
- Does the new dimension leak into, or change, frozen `state` derivation?

## Allowed Files

- plugins/foreman-line/ops-console/src/reconcile.ts
- plugins/foreman-line/ops-console/src/reconcile-git.ts
- plugins/foreman-line/ops-console/src/reconcile-remote.ts
- plugins/foreman-line/ops-console/src/api.ts
- plugins/foreman-line/ops-console/src/remedy.ts
- plugins/foreman-line/ops-console/ui/app.js
- plugins/foreman-line/ops-console/ui/index.html
- plugins/foreman-line/ops-console/ui/views/shell.js
- plugins/foreman-line/ops-console/ui/views/reconcile.js
- plugins/foreman-line/ops-console/ui/views/reconcile.d.ts
- plugins/foreman-line/ops-console/tests/reconcile.test.ts
- plugins/foreman-line/ops-console/tests/reconcile-read-only.test.ts
- plugins/foreman-line/ops-console/tests/ui-reconcile.test.ts
- plugins/foreman-line/docs/specs/INDEX.md
