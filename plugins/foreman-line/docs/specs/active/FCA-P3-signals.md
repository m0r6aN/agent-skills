---
ticket: FCA-P3
title: Unified attention model for repo-hygiene and process signals
status: active
owner: clinton.morgan
created: 2026-10-11
updated: 2026-10-11
supersedes: null
superseded_by: null
risk: standard
surfaces:
  - plugins/foreman-line/ops-console/src/status.ts
  - plugins/foreman-line/ops-console/src/derive.ts
  - plugins/foreman-line/ops-console/src/api.ts
  - plugins/foreman-line/ops-console/ui/app.js
routing_class: standard-feature
verification_class: equivalence-provable
permission_profile: builder-standard
data_classification: internal
---

# FCA-P3 — Unified attention model (signals)

## 1. Purpose

The console shows parcel lifecycle state (FOC-P0 projection) and FCA-3
remedies, but the owner's day-to-day findings are invisible: release-hygiene
drift, working-tree churn, PR/CI anomalies. Owner (2026-10-11): "This is
exactly the type of things we should have on the Foreman Ops Console." This
spec adds one **attention model** — a normalized signal type every finding
class projects into — so `actions` (FCA-P4) can key verbs off signals instead
of bespoke UI cases.

## 2. Owner directive (2026-10-11)

Surface version-staleness, working-tree, release-backlog, and PR/CI findings as
console signals; "maintain local repo hygiene" is an explicit objective; use
the `lumber-jack` skill where appropriate.

**Seed remediation (landed 2026-10-11):** `ops-console/state/` is untracked
and gitignored (root `.gitignore`) — the tracked `notifications.json` runtime
store churned the working tree on every console run and was itself a
`worktree-hygiene` finding. This is the first remediation of this signal class;
it is also the reference case for the `long-lived dirty state files` fixture
below.

## 3. Additive surface (the ONLY changes)

- `signals.ts` (new): `Signal` type — `{ id, class, severity, repo, subject,
  evidence[], detectedAt, actions[] }` with `severity: info | attention |
  urgent` and closed `class` vocabulary below.
- Signal providers (read-only derivations from disk + `gh`, never writes):
  1. `parcel-state` — existing FOC-P0 projection wrapped as signals.
  2. `release-hygiene` — manifest/marketplace version disagreement
     (`validate-versions.js` class), stale version references in docs, landed
     content under a stale version string, unclaimed `CHANGELOG` backlog vs
     released version.
  3. `worktree-hygiene` — uncommitted/untracked churn, long-lived dirty state
     files, unpushed commits, stale local branches (merged/gone upstream).
     Lumber-jack findings map in here as provider evidence where appropriate.
  4. `scm-ci` — PRs green-but-do-not-merge, conflicting+red PRs, `BEHIND`
     under strict ruleset, merged PRs missing a release event. Read-only `gh`
     queries; graceful degradation when `gh`/network is absent (`info` signal).
  5. `goal-hygiene` — goal records needing attention not covered by parcel
     state (e.g. missing ratification records, stale loop-directive states).
- `api.ts`: `GET /api/signals?repo=&class=&severity=`; signals appear in the
  attention counts already projected by FCA-2.

## 4. Contracts

- **Signals are derived, immutable snapshots.** Each provider re-derives on
  scan; no signal store that can drift from disk truth.
- **Evidence is mandatory.** Every signal carries paths/URLs/commands a human
  or agent can inspect — a signal without evidence is refused at construction.
- **Closed class vocabulary** (extension = spec change, not ad-hoc provider).

## 5. Acceptance criteria

1. Each class above yields signals with valid evidence on a seeded fixture repo.
2. Version-drift fixture (manifest ≠ marketplace ≠ README) produces
   `release-hygiene` signals naming each stale location.
3. Dirty-state/unpushed-commit fixtures produce `worktree-hygiene` signals;
   clean repos produce none.
4. `scm-ci` fixtures (mocked `gh` output) produce correct green-do-not-merge,
   conflicting, and behind signals; `gh` absence degrades to one `info` signal.
5. Signal queries filter by repo/class/severity; FCA-2 attention counts include
   signals.

## 6. Verification

Deterministic tests in `ops-console/tests/` per provider with fixture repos and
mocked `gh`; no live network in tests. Full package sweep green.
