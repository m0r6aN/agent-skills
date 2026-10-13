---
ticket: FCA-P9
title: Decisions queue — Gate 3 merge, Gate 1 ratification and Gate 2 dispatch, presented not performed
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
  - plugins/foreman-line/ops-console/README.md
  - plugins/foreman-line/docs/specs/INDEX.md
routing_class: architecture/risk
verification_class: judgment-required
permission_profile: builder-architecture
data_classification: internal
---

## Intent

Module `decisions-queue` in `human-tasks-capability-map.md`. Today the owner finds
what needs a human decision by running `gh pr list`, reading the goal board, and
remembering which parcels sit at a gate. This parcel adds **one list of every gate
act that is waiting for the human**, each with its evidence and the exact command,
and nothing that performs the act:

- **Gate 3 (merge):** open pull requests, with checks, reviews, mergeability,
  stacking and the "Actions are not starting: billing" cause, then the presented
  command `gh pr merge <N>`.
- **Gate 1 (ratification) and Gate 2 (dispatch):** parcels the frozen rule R3 already
  derives as `awaiting-gate`, with the chain position, spec reference, and the
  existing present-mode `approval approve|reject` and `dispatch-execute` commands.

The console shows facts and a command. The human reads, decides, and runs the
command in a real terminal.

## Constraints

- **Present, never perform.** Merge, approve, reject and dispatch are never
  executed by the console, never confirmed on the human's behalf, never given a
  fabricated TTY. The only server effect of the "show command" button is an
  `/api/invoke` presentation audited as `presented`.
- **No readiness verdict.** The queue does not say a PR is "safe", "ready" or
  "green to merge". It lists facts (`mergeStateStatus`, `reviewDecision`, check
  counts, cause, stack position) verbatim with their age. A missing or `UNKNOWN`
  fact renders as unknown, never as passing.
- **Remote facts carry their age.** Every PR/check/annotation fact shows "as of".
  Remote cache TTL 60 s; failures cached 5 min (same constants as FCA-P8). If `gh`
  is missing, unauthenticated or offline, PR items are not enumerated and the page
  says so with the reason; gate items (local) still render. Remote state is never
  inferred from local data.
- **Billing cause is evidence, not inference.** The "Actions not starting" cause is
  asserted only when a failing check-run's annotation message matches the GitHub
  billing text; the annotation is shown verbatim. A failed check with no matching
  annotation reads "failed, cause unknown". A PR with no checks reads "no checks
  reported". The three are never merged into one state.
- **Read-only `gh`.** The only `gh` invocations permitted are `gh pr list`,
  `gh pr view` (read fields) and `gh api` with GET on
  `repos/{owner}/{repo}/check-runs/{id}/annotations`. A test asserts every argv the
  module can build against an allowlist and fails on `merge`, `close`, `edit`,
  `review`, `comment`, `-X`/`--method` other than GET, or `--input`/`-f`/`-F`.
- **Frozen vocabularies and rules unchanged.** Gate state is read from the existing
  projection (`gateProxies`, R3). The queue does not derive or alter parcel state,
  does not read reconciliation output, and records no gate decision (charter D5/OQ5).
  Goal-level Gate 1 (charter ratification) is shown as state with the note "no
  console capture path" (charter exit criterion 4); no command is invented for it.
- **Bounded.** Hundreds of PRs and parcels: pagination, counts, filters; no per-row
  network call. Annotation lookups are capped (5 failing checks per PR, 20 per
  request) and cached by check-run id (a completed run is immutable). When a cap is
  hit the item says "cause not checked (cap)" rather than omitting the fact.
- **Route table frozen.** `GET /api/decisions` and the `pr-merge` flow are owner
  amendments A3/A4 in the capability map; neither is built until ratified.

## Design

**`GET /api/decisions[?repo=<root>]`** (read-only). Response:

```
{ generatedAt,
  repos: [{ repoRoot, remote: { available, reason, asOf },
            actions: { state: 'not-starting' | 'no-evidence' | 'unknown', evidence, asOf } }],
  assessment: { complete, limits[] },
  counts: { merge, G1, G2, goalRatification },
  items: [ MergeItem | GateItem | GoalRatificationItem ] }
```

`MergeItem`: `repoRoot, number, title, url, headRef, headSha, baseRef, isDraft,
mergeable, mergeStateStatus, reviewDecision, reviews{approved,changesRequested,total},
checks{state: passed|failed|pending|none|unknown, passed, failed, pending,
failing[{name, conclusion, url}]}, cause{code: billing-blocked|failed-unknown|none,
annotation, asOf}, stack{baseIsDefault, waitsOn}, command{flow, argv, text}, asOf`.
A PR whose `baseRefName` is not the default branch is marked stacked and
`waitsOn` names the open PR whose head is that base (or null, shown as "base branch
has no open PR"). The queue sorts bases before dependants, then oldest first. No
retarget command is presented (it is a second mutation; the note says "retarget to
the default branch after the base merges").

`GateItem`: `gate (G1|G2), goal, parcel, rule: 'R3', tipStage, specRef,
chainLocator, evidence (the GateProxy detail verbatim), command{flow, argv, text},
approvalShow (primary root only: whether the existing read-only `approval-show`
button is offered), asOf`. Commands are built from the **existing** flows
(`approval-approve`, `approval-reject`, `dispatch-execute`); this parcel adds none
for G1/G2.

**Flow `pr-merge`** (new, present-only, audited): argv
`['merge', '<N>', '--repo-root', '<root>']`; `spawnCli: null`; it can never be
`execute`. `<N>` matches `^[1-9][0-9]{0,6}$`; `<root>` must be an absolute path
equal to a declared fleet root (new argument kind `repo-root-fleet`). The rendered
command is `cd "<root>" && gh pr merge <N>` with **no strategy flag**, so `gh`
prompts the human in a real terminal.

**UI.** A **Decisions** primary destination (amendment A1), count badge in the nav,
filters by gate/kind/repo, and a banner for "GitHub Actions is not starting jobs
(billing)" shown only on the evidence rule above, with the annotation text and age.
Each row shows its facts, a "Show command" button that opens the presented command
with a copy button and the sentence "Run this in a terminal. The console will not
run it." Keyboard operable; 1366 and 320 widths verified in a real browser.

**Staging inside this parcel** (one commit group each, each green before the next):
1. `decisions.ts` + `decisions-remote.ts` + route + read-only UI (no commands).
2. Gate commands for G1/G2 through the existing flows.
3. `pr-merge` flow, `repo-root-fleet` argument kind, merge command.

## Acceptance Criteria

1. `GET /api/decisions` returns every open PR and every R3 `awaiting-gate` parcel
   with the shapes above; existing `/api/gates`, `/api/signals`, `/api/parcels`
   responses are byte-identical (regression test on fixtures).
2. A fixture corpus covers: PR with all checks passing; failing checks with the
   billing annotation (`billing-blocked`); failing checks with another annotation
   (`failed-unknown`); no checks; pending checks; draft PR; `mergeable: UNKNOWN`;
   `CONFLICTING`; `reviewDecision` empty / `APPROVED` / `CHANGES_REQUESTED`; a
   stack of three PRs (order and `waitsOn`); a PR based on a branch with no open
   PR; remote unavailable; annotation cap reached; a G1 item, a G2 item, a goal
   with ratification pending, a goal with ratification unknown.
3. **Replay of the 2026-10-13 situation:** a fixture of PRs #218 (base `main`) and
   #219 (base `feat/fca-p7-session-ledger`) with the real billing annotation yields
   #218 before #219, #219 `waitsOn: 218`, both `billing-blocked`, and the repo
   banner `not-starting`.
4. No item ever carries a `ready`, `safe`, `green` or equivalent field or label; a
   test greps the response and the rendered HTML for a closed list of such words
   and asserts the facts are the only status text.
5. The allowlist negative control (Constraints) passes, and mutating one allowlist
   entry to allow `merge` makes it fail (mutation-checked, recorded in the PR).
6. Presenting a merge or gate command writes exactly one `presented` audit entry
   and spawns nothing; a negative-control test asserts no `spawn`/`execFile` of
   `gh`, `git merge`, `approval`, or `dispatch` occurs on that path.
7. `pr-merge` refuses (typed, audited `refused`): a non-numeric or oversize PR
   number, a relative root, a root that is not a declared fleet root, extra argv,
   and any `mode` other than `present`.
8. Remote unavailable: PR items absent with the reason shown, local gate items
   still present, and no PR-dependent claim asserted.
9. **Stale data is visible:** every remote fact has an "as of"; a test advances the
   clock past TTL and asserts the refetch and the new timestamp; a failing refetch
   keeps the old facts labelled with their old age (never refreshed silently).
10. Scale: a 500-PR / 500-gate-parcel fixture renders first paint under 2 s with
    no per-row network call; the response time of the route itself is recorded
    against `/api/signals` in the PR (the route must not be slower than it).
11. UI in a real browser (Chromium over CDP, skipped when absent): list renders,
    filters work, "Show command" opens and copies, keyboard path works, 1366 and 320
    widths have no horizontal scroll of primary content.
12. Nav shows five primary destinations if A1 is ratified as drafted, with
    `ui-navigation` and `ui-shell` tests updated; if the fallback is chosen the same
    tests pin four.
13. `npm test`, `npm run typecheck`, `npm run lint` pass; test count recorded
    (baseline 491 at `main` b8fe06b6).

## Out of Scope

- Running `gh pr merge`, `approval approve|reject`, or `dispatch executeDispatch`
  from the console, in any mode, including a "confirm" checkbox.
- Fetching, pushing, retargeting, closing, labelling or commenting on PRs.
- Goal-level (charter) Gate 1 capture: no flow exists and none is added.
- Changing parcel-state derivation, gate proxies, alert rules or thresholds.
- Non-GitHub hosts; PRs in repositories outside the declared fleet.
- Offloading blocking `execFileSync` from the event loop (owner decision 1 in the
  capability map); this parcel only meets a budget and caches.

## Context & References

- [Capability map](../../goals/foreman-ops-console/human-tasks-capability-map.md)
- [FCA-P3 signals](FCA-P3-signals.md) — `signals-scm` client this extends
- [FCA-P4 actions](FCA-P4-actions.md) — flow and registry model
- [FCA-P8 reconciliation](FCA-P8-reconciliation-view.md) — `gh` runner, cache, ages
- [FCA-U1 navigation](FCA-U1-workspace-navigation.md) — nav amendment A1
- [FOC-P0](FOC-P0-projection-contract-and-discovery-inventory.md) — R3, gate proxies

## Open Questions

- **OQ1 merge strategy:** present `gh pr merge <N>` with no flag (proposed) versus
  naming `--merge`. Proposed keeps the choice in the human's terminal.
- **OQ2 billing text stability:** the match is on the substrings `recent account
  payments have failed` or `spending limit needs to be increased`. Proposed: keep
  the substring list in one constant, pinned by a fixture of the real annotation.
- **OQ3 which PRs count:** all open PRs in each declared fleet repo (proposed),
  versus only PRs whose head is a parcel branch.
- **OQ4 draft PRs:** listed and labelled draft (proposed) versus hidden.

## Commands

Run from `plugins/foreman-line/ops-console/` (`node -v` first; expect v26.8.2):

```sh
npx tsx --test tests/decisions.test.ts tests/decisions-remote.test.ts tests/decisions-read-only.test.ts tests/invoke.test.ts tests/ui-decisions.test.ts tests/browser-decisions.test.ts
npm test
npm run typecheck
npm run lint
```

## Boundaries

- Always: show the source and age of every remote fact; render unknown as unknown;
  keep `gh` read-only and allowlisted; stage read-only before commands; mutate each
  new guard and record that it fails.
- Ask first (amendment required before dispatch): the route (A3), the flow and
  argument kind (A4), the `gh api` annotation read (A5), the fifth destination (A1).
- Never: execute a gate act, answer a prompt for the human, fabricate a TTY, add a
  readiness verdict, fetch or push, infer remote state from local data, or write
  outside console-local state.

## Verification Plan

Fixture corpus per AC2 with an injectable `gh` runner (zero live network in tests);
allowlist and no-spawn negative controls with recorded guard mutations; real-`gh`
read-only smoke against `m0r6aN/agent-skills` on a scratch console (not :8081 or
:8099) recorded in the PR; real-browser pass at 1366 and 320.

Mandated reviewer questions:
- Can any item read as ready to merge without the human reading the facts?
- Can a stale or failed remote read display as current, or an `UNKNOWN` as passing?
- Can the billing banner appear without the annotation, or hide a different failure?
- Can any path run `gh pr merge`, `approval approve`, or `dispatch` from the console?
- Does any new `gh` argv escape the allowlist, or does a `-X`/`--input` slip through?
- Does the stack ordering ever place a dependant before its base, or lose a PR?
- Does this route change `/api/gates`, derived `state`, or alert behaviour?

Reviewers run read-only (`--tools read,grep,find,ls`) from the worktree with a
hostile-reading brief; disputed findings are verified before triage.

## Allowed Files

- plugins/foreman-line/ops-console/src/decisions.ts
- plugins/foreman-line/ops-console/src/decisions-remote.ts
- plugins/foreman-line/ops-console/src/api.ts
- plugins/foreman-line/ops-console/src/invoke.ts
- plugins/foreman-line/ops-console/ui/app.js
- plugins/foreman-line/ops-console/ui/index.html
- plugins/foreman-line/ops-console/ui/views/shell.js
- plugins/foreman-line/ops-console/ui/views/decisions.js
- plugins/foreman-line/ops-console/ui/views/decisions.d.ts
- plugins/foreman-line/ops-console/tests/decisions.test.ts
- plugins/foreman-line/ops-console/tests/decisions-remote.test.ts
- plugins/foreman-line/ops-console/tests/decisions-read-only.test.ts
- plugins/foreman-line/ops-console/tests/invoke.test.ts
- plugins/foreman-line/ops-console/tests/ui-decisions.test.ts
- plugins/foreman-line/ops-console/tests/browser-decisions.test.ts
- plugins/foreman-line/ops-console/tests/ui-navigation.test.ts
- plugins/foreman-line/ops-console/tests/ui-shell.test.ts
- plugins/foreman-line/ops-console/README.md
- plugins/foreman-line/docs/specs/active/FCA-U1-workspace-navigation.md
- plugins/foreman-line/docs/specs/INDEX.md
