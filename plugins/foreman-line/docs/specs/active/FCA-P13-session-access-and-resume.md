---
ticket: FCA-P13
title: Session access — correct attach, read a failed session's output, resume only when there is something to resume
status: active
owner: clinton.morgan
created: 2026-10-13
updated: 2026-10-13
supersedes: null
superseded_by: null
risk: standard
surfaces:
  - plugins/foreman-line/ops-console/ui
  - plugins/foreman-line/ops-console/tests
  - plugins/foreman-line/ops-console/README.md
  - plugins/foreman-line/docs/specs/INDEX.md
routing_class: standard-feature
verification_class: judgment-required
permission_profile: builder-standard
data_classification: internal
---

## Intent

Module `session-access` in `human-tasks-capability-map.md`. The Sessions tray
already shows a copyable `tmux attach -t <session>` for every identifiable pane
(FCA-U3) and the ledger (FCA-P7) already holds the exit status, transcript facts and
pane output. Three things are wrong or missing, all presentation:

1. The attach command is shown even when it cannot work (the tmux server is gone, so
   the ledger says `vanished`), and it uses `-t <name>`, which tmux **prefix-matches**,
   so it can attach to a different session whose name starts the same.
2. A failed session shows a tail but offers no way to read the whole captured
   output, and attach lands on the session's active pane, not the failed one.
3. There is no "resume". Resuming is only meaningful when the agent actually
   exchanged messages; for the seven failed launches it never did.

This parcel fixes the first, adds a copy command for the second, and offers resume
**only when a transcript proves there is a session to resume**. Every command is
presented for the human to run; none is executed by the console.

## Constraints

- **Present, never perform.** Attach, read and resume are copyable text. No route,
  no `/api/invoke` flow, no spawn. The console does not start, attach to, kill or
  resume anything. (Consistent with the existing attach command, which is also
  copy-only and unaudited; this parcel does not add an audit entry because no flow
  is invoked.)
- **Exact targets.** Attach uses the exact-match session target `=<name>` and selects
  the pane by tmux pane id (`%N`) when the receipt carries `tmuxPaneId`, never by
  tmux's own pane index (this machine uses `pane-base-index 1`). When the pane id is
  unknown the command attaches to the session only and says so.
- **Attach only where it can work.** When the ledger's tmux fact is `absent` or the
  lifecycle state is `vanished`, the attach command is replaced by "tmux session is
  gone", and the log path (if the log survives) is offered instead. When the tmux fact
  is `unavailable` the state reads unknown and the command is withheld with the reason.
- **Resume only on proof.** The resume command is offered only when the ledger's
  transcript link is `linked` (exactly one transcript file whose header `cwd` equals
  the worktree) and `messages > 0`, and the harness is `pi`. It is
  `cd '<worktree>' && pi --session '<transcript file>'`, built with the same quoting
  the launcher uses; a path containing a newline or control character withholds the
  command with a stated reason. Otherwise the row says "Nothing to resume: <reason>"
  with the reason taken from the ledger (`none` = prompt never exchanged;
  `ambiguous` = several candidates, listed not guessed; `unknown`; or a non-pi
  harness).
- **Never claim success.** "Resume" text states it starts an interactive session in
  that worktree under the operator's own authority; it does not say the work will
  complete. Exited-clean is still "not proof the work is complete" (FCA-P7 wording).
- **No new data.** Everything shown already exists in `/api/spawns` `ledger` and the
  receipt. Message bodies are not read or displayed (FCA-P5: prompt text is not
  stored). If a needed field is absent on a legacy receipt the feature reads
  "unavailable", never a guessed value.
- **Frozen surfaces untouched.** No route, flow, registry, state-file or vocabulary
  change; no change to the ledger's derivation.

## Acceptance Criteria

1. `attachCommand` produces `tmux attach -t =<name>` (names are single-quoted when
   they contain anything outside `[A-Za-z0-9_-]`); with a `tmuxPaneId` of the form
   `%<digits>` it appends `\; select-pane -t %<digits>`; a malformed pane id is
   ignored with the session-only form and a visible note. Existing attach tests are
   updated to the exact form.
2. For `vanished` and tmux-`absent` ledgers the row shows no attach command and the
   text "tmux session is gone", plus a log read command when the log path is known;
   for tmux-`unavailable` it shows no command and "unknown" with the reason.
3. The log read command is `less -R '<logPath>'` using only the ledger's `logPath`,
   quoted; withheld when `logPath` is null or contains a control character.
4. Resume is offered for exactly one fixture class: pi harness, transcript `linked`,
   messages > 0. A table test over (`link` x `messages` x `harness`) fixtures asserts
   every other cell shows "Nothing to resume" with the correct reason and no command.
5. Quoting: fixtures with a single quote, a space, `$`, backtick, `;` and a newline in
   the worktree path, transcript path and session name produce either a command that
   `bash -n` parses as exactly the intended argv (round-trip test through the shell)
   or no command, never a command with an injectable segment.
6. Legacy receipts (no ledger fields) show "outcome unavailable" and offer attach only
   when tmux identity exists; no resume.
7. No network request is made when rendering or copying; a UI test asserts zero
   fetches and that the copy button writes exactly the displayed text.
8. Real-data check on a scratch console: the seven failed-launch panes each read
   "Nothing to resume" with the ledger reason; a fixture session with a real pi
   transcript shows a resume command whose `--session` file exists on disk.
9. Keyboard operable; real-browser pass at 1366 and 320 widths (Chromium over CDP,
   skipped when absent).
10. `npm test`, `npm run typecheck`, `npm run lint` pass; test count recorded
    (baseline 491 at `main` b8fe06b6, plus earlier parcels once merged).

## Out of Scope

- Running attach, resume, kill, or any command from the console; a "resume" button
  that spawns (a spawned resume would be a new route or registry pair; defer).
- Resuming `claude` sessions (no transcript reader for that harness exists).
- Reading or displaying message bodies; searching transcripts.
- Relaunching with the same prompt (the receipt stores only a digest, FCA-P5).
- Closing, reaping or deleting sessions or worktrees (`hygiene-actions`).

## Context & References

- [FCA-P7 session ledger](FCA-P7-session-ledger.md) — transcript, output, tmux facts
- [FCA-U3 session monitoring](FCA-U3-session-monitoring.md) — the tray and attach command
- [FCA-P5 spawn](FCA-P5-spawn.md) — receipt fields, quoting, no prompt storage
- [Capability map](../../goals/foreman-ops-console/human-tasks-capability-map.md)

## Open Questions

- **OQ1 spawned resume:** a console-launched resume would be more convenient than a
  copied command but needs a registry pair or route (an amendment) and a decision on
  which worktree/session name it reuses. Proposed: not now.
- **OQ2 pane selection:** select the receipt's pane by id (proposed) versus attach to
  the session only. Proposed keeps the operator on the pane that failed.

## Commands

Run from `plugins/foreman-line/ops-console/` (`node -v` first; expect v26.8.2):

```sh
npx tsx --test tests/ui-sessions.test.ts tests/ui-session-access.test.ts tests/browser-sessions.test.ts
npm test
npm run typecheck
npm run lint
```

## Boundaries

- Always: show only commands that can work; quote every interpolated value; use exact
  tmux targets and pane ids; state the reason when a command is withheld.
- Ask first (amendment required before dispatch): any route, flow, or registry pair;
  displaying transcript content.
- Never: execute a command, offer resume without a linked transcript with messages,
  match tmux sessions by prefix, use tmux's pane index, or build a command from an
  unquoted value.

## Verification Plan

Exact-form tests (AC1); gating table over ledger fixtures (AC2, AC4); shell
round-trip quoting test against real `bash` (AC5); no-network UI test (AC7);
scratch-console real-data run (AC8); real-browser pass; guard mutations (drop the
`messages > 0` check, drop the `=` target, drop quoting) each shown to fail a test.

Mandated reviewer questions:
- Can the UI offer attach for a session that no longer exists, or to the wrong session?
- Can resume be offered when nothing was exchanged, or for an ambiguous transcript?
- Can any worktree, session, or file name produce an injectable command?
- Does any path run a command, call a route, or read message bodies?
- Is tmux's pane index used anywhere instead of the pane id?

## Allowed Files

- plugins/foreman-line/ops-console/ui/views/tray.js
- plugins/foreman-line/ops-console/ui/views/tray.d.ts
- plugins/foreman-line/ops-console/ui/app.js
- plugins/foreman-line/ops-console/tests/ui-tray.test.ts
- plugins/foreman-line/ops-console/tests/ui-sessions.test.ts
- plugins/foreman-line/ops-console/tests/ui-session-access.test.ts
- plugins/foreman-line/ops-console/tests/browser-sessions.test.ts
- plugins/foreman-line/ops-console/README.md
- plugins/foreman-line/docs/specs/INDEX.md

## Owner ratification — 2026-10-13

Owner ratified this spec as drafted ("ratify all as written"), including every
amendment it names under "Ask first" (no amendment: this parcel adds no route, flow or state file). Open Questions are resolved by the
proposals stated in them: OQ1 no spawned resume now, OQ2 select the receipt pane by id. Blanket authority for decisions and
non-destructive actions stands; Gate 3 (merge) is not delegated by this record.
