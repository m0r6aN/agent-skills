---
ticket: FCA-P7
title: Session ledger — durable, evidence-backed outcome record for launched panes
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

Module `session-ledger` in `session-ledger-capability-map.md`. Today a launch
produces a receipt (argv, model, prompt hash, worktree) and nothing after it:
pane output is discarded, exit status is never read, the pi transcript is never
joined, and the git result is never inspected. Operators cannot tell a session
that worked from one that failed on its first request or never received its
prompt. This parcel makes every launched pane leave durable, inspectable
evidence of what happened, and derives an honest lifecycle state from it.

## Constraints

- **Observed facts, not interpretation.** Every ledger field is read from
  tmux, the filesystem, pi's own transcript, or git. The console never infers
  success from liveness and never writes a status field into a goal, spec or
  receipt (charter D2/D4). Unknown renders as unknown.
- **Real interactive sessions stay real** (amendment §3): no fabricated TTY, no
  piped confirmation, no headless substitution for write-capable verbs.
- **Capture must not alter the session.** Output capture uses tmux `pipe-pane`
  and exit retention uses `remain-on-exit`; the harness argv, prompt and TTY are
  unchanged. Do not wrap the harness in a pipe (`| tee` breaks the TTY).
- **Join key is the worktree path.** pi keys its session directory by working
  directory; each launch has a unique worktree, so the join is deterministic.
  No fuzzy matching; zero or multiple candidates surface as `unlinked` evidence.
- **Read-only against external state.** Transcript parsing and git inspection
  never write. Only the console-local state tree is written.
- **Prompt text is never stored** (FCA-P5): transcripts are read for counts,
  usage and stop reasons; message bodies are linked by path, not copied. Pane
  logs may contain prompt echo and provider errors: they stay in the local state
  tree, are never served beyond loopback, and carry a documented retention cap.
- Route table is frozen (FOC-P0 X1): extend the existing `GET /api/spawns`
  additively; no new route in this parcel.

## Design (decisions for owner review)

1. **tmux kept, hardened.** tmux 3.7c is installed. Set `remain-on-exit on` for
   launched panes so a dead pane stays attachable with its exit status
   (`#{pane_dead_status}`, `#{pane_dead_time}`), and `pipe-pane -o` to append
   output to `state/sessions/<receipt-id>/pane.log`. Both are verified against
   the installed version as an acceptance criterion, not assumed.
2. **Receipt addendum.** Add `baseCommit`, `branch`, and `ledgerDir` to new
   receipts (additive; old receipts remain valid and read as unknown).
3. **Ledger is derived per scan** from receipt + tmux + pane log + transcript +
   git, cached nowhere authoritative (consistent with FOC-P0 "derived from disk").
4. **Closed lifecycle vocabulary per pane**, each with an evidence list:
   `launching`, `running`, `exited-clean`, `exited-error`, `vanished` (receipt
   exists, tmux session and pane both gone, no retained status), `no-transcript`
   (pane ran, pi directory empty or absent — prompt never exchanged), `unknown`.
   `exited-clean` means exit status 0, **not** that work is complete.
5. **Outcome facts**: commits ahead of `baseCommit`, dirty-file count, branch,
   pushed-or-not (against last-fetched refs), transcript message count, summed
   usage cost where present, last stop reason, last 20 pane-log lines, and any
   provider error line matched verbatim (HTTP status text surfaced as evidence,
   never reclassified).
6. **Severity**: `exited-error`, `no-transcript` and `vanished` raise
   `session-state` signals at `warning` (today every dead pane is `info`).

## Acceptance Criteria

1. New launches create the ledger dir, enable `remain-on-exit` and `pipe-pane`;
   a pane that exits non-zero remains attachable and reports its exit status.
   Verified with a real tmux 3.7c against a disposable repo (not operator
   worktrees).
2. A launched pane whose harness fails on its first request (simulated provider
   error) yields `exited-error` or `no-transcript` with the error line captured
   verbatim in evidence. Reproduces the 2026-10-12/13 failure class.
3. Join by worktree path: exactly-one-match links; zero or many yields
   `unlinked` with the candidates listed; never a guess.
4. Git outcome correct for: no changes, uncommitted changes, local commits,
   pushed commits, branch deleted, worktree removed (reports unknown).
5. Old receipts (without addendum fields) render all new fields as unknown and
   never raise warnings for missing ledger data.
6. `GET /api/spawns` gains only additive fields; every existing field, route,
   state value and `/api/invoke` argv is byte-identical (regression-asserted).
7. Pane-log retention cap enforced (size and count, defaults documented);
   exceeding it truncates oldest content and records that it did.
8. Sessions view (FCA-U3 renderer) shows lifecycle, exit status, cost, git
   outcome, last output and a "no transcript — prompt never exchanged" message
   where applicable; dead panes are never labelled complete.
9. **Sessions button defect**: reproduced in a real browser (Firefox and
   Chromium), root cause recorded in the PR, fixed, and covered by a browser
   test that clicks "View sessions" and "View launched session" and asserts the
   Sessions view is visible with the expected row.
10. Orphan detection: a launch worktree with no live pane, no commits and no
    dirty files is reported as `orphan-clean` evidence on the ledger entry.
    Reaping stays with the existing confirmation-gated close/delete path.

## Out of Scope

- Reconciling local vs remote parcel state (FCA-P8).
- Reaping worktrees, restarting panes, or any automatic remediation.
- Streaming/embedding a terminal in the UI; websocket or push transport.
- System-wide discovery of sessions not launched by this console.
- Changing harness argv, prompt composition, autonomy envelopes, or model
  routing.
- Diagnosing or fixing provider budget/policy errors themselves; the ledger only
  makes them visible.

## Context & References

- [Session monitoring screen](FCA-U3-session-monitoring.md) — consumes this ledger
- [Spawn module and receipts](FCA-P5-spawn.md)
- [Capability map](../../goals/foreman-ops-console/session-ledger-capability-map.md)
- [Control-center amendment](../../goals/foreman-ops-console/AMENDMENT-2026-10-11-control-center.md)

## Open Questions

- **OQ1 headless mode.** Optional non-interactive launch for read-only verbs
  (`investigate`, `explain`) so results land in a transcript without a terminal.
  Recommended as a later, separate parcel; the ledger design does not depend on it.
- **OQ2 retention defaults** for pane logs (proposed: 5 MB per pane, 200 panes).

## Commands

Run from `plugins/foreman-line/ops-console/`:

```sh
npx tsx --test tests/ledger.test.ts tests/ledger-tmux.test.ts tests/ui-sessions.test.ts
npm test
npm run typecheck
npm run lint
```

## Boundaries

- Always: derive from observed facts, keep unknown as unknown, test tmux
  behavior against the real binary in a disposable repo, preserve old receipts.
- Ask first (owner-ratified amendment required before dispatch): adding
  `state/sessions/` (a new writable subtree) to the console's write allowlist
  (`STATE_FILES` in `src/config.ts`); the receipt addendum fields; any new route.
- Never: store prompt bodies, write to specs/receipts/goal records, run tmux
  against operator worktrees in tests, auto-reap, or label a dead pane complete.

## Verification Plan

Fixture ledgers for each lifecycle state plus one real-tmux integration test.
Browser run for AC9 with screenshots.

Mandated reviewer questions:
- Can any ledger state be read as "work done" when only the process ended?
- Does the pane log leak prompts or secrets beyond loopback or past retention?
- Is the transcript join ever ambiguous without saying so?
- Does an old receipt ever produce a false warning?

## Allowed Files

- plugins/foreman-line/ops-console/src/ledger.ts
- plugins/foreman-line/ops-console/src/ledger-git.ts
- plugins/foreman-line/ops-console/src/ledger-transcript.ts
- plugins/foreman-line/ops-console/src/spawn.ts
- plugins/foreman-line/ops-console/src/signals-session.ts
- plugins/foreman-line/ops-console/src/config.ts
- plugins/foreman-line/ops-console/src/api.ts
- plugins/foreman-line/ops-console/ui/app.js
- plugins/foreman-line/ops-console/ui/views/tray.js
- plugins/foreman-line/ops-console/ui/views/tray.d.ts
- plugins/foreman-line/ops-console/tests/ledger.test.ts
- plugins/foreman-line/ops-console/tests/ledger-tmux.test.ts
- plugins/foreman-line/ops-console/tests/ui-sessions.test.ts
- plugins/foreman-line/docs/specs/INDEX.md
