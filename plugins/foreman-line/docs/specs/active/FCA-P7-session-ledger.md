---
ticket: FCA-P7
title: Session ledger — durable, evidence-backed outcome record for launched panes
status: active
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

## Owner ratification and delegated amendment — 2026-10-13

Owner approved this spec as drafted: capability map and build order approved;
tmux kept and hardened (`remain-on-exit` + `pipe-pane`); the `state/sessions/`
writable subtree, the receipt addendum fields, and any new route are ratified;
blanket authority granted for decisions and non-destructive actions. Gate 3
(merge) is not delegated by this record.

**Root cause found during preparation (evidence, 2026-10-13).** A real tmux
reproduction showed every console launch dies at startup: the launcher passes a
bare model id and pi exits 1 with `Model "claude-sonnet-5-5" is ambiguous
across providers ... Use --provider or provider/model`. The pane dies, the tmux
server exits with its last pane, and the error is lost. This explains the empty
transcripts, clean worktrees, and absent output. It is a launcher defect, in
scope here:

11. **Provider-qualified model (AC11).** For harness `pi`, planning refuses a
    model not in `provider/model` form with a typed refusal before any worktree
    or process is created; the model suggestions offered by the UI are
    provider-qualified and verified against `pi --list-models`. Other harnesses
    are unaffected.

Additional Allowed Files (coordinator-delegated; no scope change):

- plugins/foreman-line/ops-console/src/harness.ts
- plugins/foreman-line/ops-console/ui/views/spawn-panel.js
- plugins/foreman-line/ops-console/ui/views/spawn-panel.d.ts
- plugins/foreman-line/ops-console/tests/spawn-plan.test.ts
- plugins/foreman-line/ops-console/tests/spawn-launch.test.ts
- plugins/foreman-line/ops-console/tests/spawns-api.test.ts
- plugins/foreman-line/ops-console/tests/ui-spawn-panel.test.ts
- plugins/foreman-line/docs/goals/foreman-ops-console/session-ledger-capability-map.md

Design clarification: tmux tests use a private socket (`tmux -L <name>`), never
the operator's server. The first pane is created with `remain-on-exit` and
`pipe-pane` chained in one tmux command (race-free); later panes attach
`pipe-pane` by pane id after `split-window -P`, and rely on retained
scrollback (`capture-pane`) for any output before attachment.

## Delegated amendment (retroactive) and implementation findings — 2026-10-13

Recorded AFTER implementation, not before: these paths were found necessary
while building and were not in the ratified Allowed Files. They widen no
product scope (test support, the new store the structural write guard had to
name, and docs) and are flagged here for owner review rather than silently
absorbed.

Additional Allowed Files:

- plugins/foreman-line/ops-console/src/ledger-store.ts
- plugins/foreman-line/ops-console/tests/ledger-api.test.ts
- plugins/foreman-line/ops-console/tests/browser-sessions.test.ts
- plugins/foreman-line/ops-console/tests/support/cdp.ts
- plugins/foreman-line/ops-console/tests/ui-fixture.ts
- plugins/foreman-line/ops-console/tests/read-only.test.ts
- plugins/foreman-line/ops-console/README.md

Clarifications:

- **Severity.** The design said `warning`; the existing closed severity
  vocabulary is `info | attention | urgent`, so `exited-error`, `no-transcript`
  and `vanished` raise `attention`. No vocabulary was widened.
- **Write allowlist.** `ledger-store.ts` is the fifth sanctioned fs writer
  (read-only guard test updated); `state/sessions/` is a closed STATE_DIRS entry.
- **tmux `pane-base-index`.** This machine numbers panes from 1. Legacy
  receipts are matched to panes by creation order, never by tmux's index value;
  new receipts record the tmux pane id.
- **AC9 root cause (reproduced in real Chromium against the live console).**
  The Sessions button navigated correctly. The defect was the view it opened:
  the workspace waited for all five endpoints before showing any, the
  single-threaded server serialized the slow `/api/goals` and `/api/signals`
  scans (~5 s each on the live console) ahead of `/api/spawns`, and Sessions
  asserted "No console-recorded launches" for ~10 s. Fixed by applying each
  endpoint as it arrives, requesting the cheap ones first, and rendering
  explicit Loading / Could-not-load states. The slow scans themselves are NOT
  fixed here (see Known follow-ups).

Known follow-ups (not in this parcel): `/api/goals` and `/api/signals` block the
event loop for ~5 s each on the live console; `/api/spawns` cost grows with
receipts (one tmux probe per session, a few git probes per receipt) and should
get a short-TTL cache if receipt counts reach the hundreds.

## Independent review disposition — 2026-10-13

Two fresh, read-only reviewer sessions were run (tools restricted to read/grep/find/ls;
no edits, no commands). The P7 reviewer returned REQUEST CHANGES with 13 findings; the
facts behind them were reproduced before triage (real tmux: `has-session` is 0 for a
session holding only dead panes and prefix-matches; 66 of 4,243 real assistant messages
carry `stopReason: "error"`). Disposition:

| # | Finding | Disposition |
|---|---|---|
| 1 | exit 0 hides a failed last assistant message | **Fixed** — `exited-error` + evidence (aborted: evidence) |
| 2 | dead pane shown/counted "Running" (session-level `has-session`) | **Fixed** — UI derives liveness from the ledger; `has-session` uses exact `=name`; API field unchanged |
| 3 | git probes take `index.lock`; repo-local fsmonitor runs | **Fixed** — `GIT_OPTIONAL_LOCKS=0`, `core.fsmonitor=false`, 20 s timeout, 64 MB buffer |
| 4 | `/api/spawns` cost / event loop | **Mitigated** — transcript summaries cached by (path,size,mtime); git outcomes 15 s TTL. Not eliminated (see follow-ups) |
| 5 | attention forever; any tmux error read as `vanished` | **Fixed** — failures fade to info after 72 h; only real "no such session/server" messages are absent (`can't find session\|window\|pane`, `no server running`, `server exited unexpectedly`, `error connecting … No such file`), anything else is unavailable and flags nothing |
| 6 | legacy receipt could raise attention | **Fixed** — attention requires `ledger === 'present'` |
| 7 | transcript join degrades silently | **Fixed** — realpath-aware join, 16 KB header, evidence for unknown and for rejected candidates |
| 8 | retention gaps/races | **Fixed** — `lstat`, id-validated names, ranked by id, logs written in the last 10 min are never truncated/removed (live writer) |
| 9 | log confidentiality | **Fixed** — 0700/0600. DNS-rebinding/Host-header check and `FOC_CONTAINER` non-loopback bind are **pre-existing server properties** in `server.ts` (outside Allowed Files): deferred, owner decision |
| 10 | first (not latest) error line; OSC | **Fixed** |
| 11 | `baseCommit` option injection | **Fixed** — `safeRev` |
| 12 | non-exact tmux targets; session-name shape | **Fixed** — `=name:` targets; `invalid-session-name` refusal before any worktree; ledger dir created before the worktree |
| 13 | `reconcileSelection` on failed endpoint | **Pre-existing** behaviour, unchanged by this parcel; not addressed |

Defect found by the rework itself: the first classifier missed `can't find window` and
`server exited unexpectedly` (what real tmux prints), producing a flaky `unknown`; both
are now covered by unit table and real-tmux tests (15/15 stable runs).

Additional Allowed Files for the rework: none beyond those already recorded.

Known follow-ups (owner decisions): Host/Origin validation and non-loopback bind in
`server.ts`; moving blocking `execFileSync` work off the event loop; an
acknowledge/dismiss affordance for historical failures.

