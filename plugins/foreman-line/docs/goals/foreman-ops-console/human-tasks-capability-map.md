# Capability Map — Human-Task Surfaces (owner-ratified 2026-10-13)

Companion to `session-ledger-capability-map.md`, `ux-redesign-capability-map.md`
and `AMENDMENT-2026-10-11-control-center.md`. Status: **owner-ratified 2026-10-13**: the map, the build order, specs FCA-P9 to
FCA-P13, and amendments **A1-A10 exactly as drafted** ("ratify all as written"). Each
spec carries its own ratification record. Not ratified by this record, because they
are not in this spec set: pulling the event-loop offload or Host/Origin validation
forward (they stay deferred, see "Open decisions"), and the specs for
`closure-proposal` and `hygiene-actions` (A8, A9 stay provisional until those specs
exist). Gate 3 (merge) remains human-owned.

## Why this exists

FCA-P7 (#218) and FCA-P8 (#219) shipped: launched sessions are now recorded and
parcel records can be compared with git and the remote. What remains is the set of
acts only a human can perform, each done today by hand in a terminal or editor with
no console support: merging, ratifying, dispatching, completing records, reaping
worktrees, acknowledging old failures, triaging notifications, refreshing remote
refs, and resuming failed sessions. The console must make each of these *visible and
one step from correct*, while the charter keeps the act itself human.

Evidence gathered 2026-10-13 before drafting:

- #218 and #219 are merged into `main` (15:47Z); `main` is `b8fe06b6`.
- No GitHub Actions job starts. The failing check-run annotation reads verbatim:
  *"The job was not started because recent account payments have failed or your
  spending limit needs to be increased."* Those jobs fail in 2-3 s with `steps: []`,
  so the cause is machine-readable from a check-run annotation, not only inferable.
- Baseline: 491 tests pass on `main`; `typecheck` clean; `lint` was red (7
  `noControlCharactersInRegex` errors from a misplaced `biome-ignore` in
  `src/ledger.ts`). Fixed alone in commit `136cc988` (no behaviour change).
- The existing machinery already covers more than the task list assumed:
  `approval-approve|reject` and `dispatch-execute` are present-only flows in
  `FLOW_REGISTRY`; `approval-show` executes; `GET /api/gates` exposes per-parcel
  G1/G2/G3 proxies; `signals-scm` already reads PR/check state through an injectable
  `gh` client; `/api/spawn` already carries an `extraText` field; the Sessions tray
  already renders a copyable `tmux attach -t` command for identifiable panes.

## Owner decisions taken in this session (2026-10-13)

| # | Decision | Effect |
|---|---|---|
| D-A | Build order accepted: merge queue, gate queue, follow-through, acknowledge/triage, attach/resume, closure, reaping and fetch | Spec numbering and build order below |
| D-B | **Separate "not started" from "stalled"** (owner: yes) | FCA-P10 amends the frozen FOC-P0 C4 vocabulary; measured effect is 20 of 34, not 15 (see baseline) |
| D-C | Promotion of Reconciliation: owner has no opinion; **recommendation adopted: do not promote it** | Reconciliation stays under Tools. A different surface, *Decisions*, is proposed as the fifth primary destination (see A1) because it is the highest-frequency human act; reconciliation is a periodic diagnostic |

Recommendation rationale for D-C: the nav was approved as four destinations because
primary slots are for what an operator does every day. The daily acts are "what must
I decide" (merge, ratify, dispatch). Reconciliation is used when cleaning up a
backlog, and after FCA-P10 removes the not-started parcels from `hung` there is less
reason to open it. Its output reaches the daily surface through FCA-P11 (do-it
buttons) rather than through nav position. If the owner prefers, `Decisions` can
instead be a tab inside Work queue and the nav stays at four (A1 fallback).

## Modules

| Module id | Responsibility | Depends on | Spec |
|---|---|---|---|
| `decisions-queue` | One list of every human gate act: open PRs awaiting Gate 3 with checks, reviews, mergeability and the billing signal; parcels awaiting G1/G2 with exact command, chain and evidence. Read-only, then present-mode commands | FCA-P3 `signals-scm`, FOC-P3 gates, FCA-P4 flows | [FCA-P9](../../specs/active/FCA-P9-decisions-queue.md) |
| `not-started-state` | Parcel-state amendment: `not-started` (queued, nothing begun) separate from `hung` (progressed, then stalled) | FOC-P0 C4 | [FCA-P10](../../specs/active/FCA-P10-not-started-state.md) |
| `followthrough` | Per-finding "do it" that pre-fills the existing launch panel with a scoped `investigate`/`remediate` session; nothing launches without the existing review step | FCA-P8, FCA-P5/U2 | [FCA-P11](../../specs/active/FCA-P11-reconciliation-followthrough.md) |
| `acknowledgement` | Human acknowledge/dismiss bound to the exact evidence; notification triage; stops dismissed alerts re-firing | FCA-P7 signals, FOC-P3 notifications | [FCA-P12](../../specs/active/FCA-P12-acknowledge-and-triage.md) |
| `session-access` | Read failed/ended sessions; copyable resume command only when a transcript exists; honest "nothing to resume" otherwise | FCA-P7 | [FCA-P13](../../specs/active/FCA-P13-session-access-and-resume.md) |
| `closure-proposal` | Spawned session that drafts the record-completion PR (spec to `done/`, INDEX row, link fixes, SHIPPED marker, state line) | `decisions-queue`, FCA-P8 | not drafted |
| `hygiene-actions` | Confirmation-gated, audited orphan-worktree reaping (lumber-jack) and remote fetch | `session-access`, FCA-P8 | not drafted |

Build order (owner-accepted, with the vocabulary amendment slotted where it removes
noise before the modules that would otherwise display it):
`decisions-queue` (P9) -> `not-started-state` (P10) -> `followthrough` (P11) ->
`acknowledgement` (P12) -> `session-access` (P13) -> `closure-proposal` ->
`hygiene-actions`. `closure-proposal` and `hygiene-actions` are intentionally not
specified yet: their shape depends on what P9 to P13 show is common, and both need
mutating flows that the owner should see designed against real data. Their
provisional amendments are listed (A8, A9) so the owner can pre-ratify or defer.

Within each module the order is fixed: **read-only status, then present-mode
commands, then (only where a later spec says so) confirmation-gated actions.**

## Cross-module invariants (inherited, unchanged)

- The console produces no verification and mutates no spec, receipt, contract or goal
  record itself. Writes go through an existing CLI, an `/api/invoke` flow, or a
  spawned interactive session.
- No fabricated TTY, no piped confirmation phrases, no auto-approval. G1, G2, G3
  stay human. Approvals are present-mode: the console shows the exact command, the
  human runs it. "Merge" is never a button that merges.
- Unknown stays unknown: a missing fact is rendered unknown, never zero, failed or
  green. Every remote fact carries its age.
- The route table and the parcel-state vocabulary are frozen except where a named,
  owner-ratified amendment below says otherwise. No module derives parcel state from
  reconciliation output.
- Destructive verbs stay confirmation-gated and audited through the existing
  registry or dispatch path.

## Ratification checklist (Ask first, one pass)

Each row names a spec. The owner ratifies by recording it in that spec's
"Owner ratification" section; ratification commits land alone, before code.

| # | Amendment | Needed by | Recommended answer | Fallback |
|---|---|---|---|---|
| A1 | FCA-U1: add a fifth primary destination, **Decisions** (nav count 4 to 5) | P9 | Yes | Tab inside Work queue; nav stays four |
| A2 | FOC-P0 C4: add `ParcelStateValue` `not-started` and rule `R4a`; R1-R3 and R5 unchanged, R4 narrowed. Granted in principle by the owner 2026-10-13 | P10 | Ratify as drafted | None: the 15 parcels keep reading `hung` |
| A3 | New route `GET /api/decisions` (read-only, fleet-wide, remote facts with age) | P9 | Yes | Additive fields on `/api/gates`, rejected: it would put network calls behind a cheap per-goal route |
| A4 | New **present-only** flow `pr-merge` in `FLOW_REGISTRY` (+ argument kind `pr-number`); audited as `presented`, never spawned | P9 | Yes | Copy-only text with no audit entry |
| A5 | Extend the read-only `gh` allowlist: `gh pr list/view` extra fields and `gh api` GET of `repos/{owner}/{repo}/check-runs/{id}/annotations`; any other `gh` subcommand refused by test | P9 | Yes | Billing signal withheld, shown as "failed, cause unknown" |
| A6 | New console-local state file `state/acknowledgements.json` (`STATE_FILES` is a closed set) and routes `GET/POST /api/acknowledgements`, `DELETE /api/acknowledgements/:id` | P12 | Yes | Client-only ack in browser storage (loses on restart; not recommended) |
| A7 | `syncAlerts` consults acknowledgements so a dismissed alert does not re-fire while its evidence is unchanged (behaviour change to an existing module) | P12 | Yes | Dismissed alerts reappear on next sync (current behaviour) |
| A10 | Additive spawn-receipt fields `subject` and `verb` (as FCA-P7 added ledger fields), so a finding can show the session launched for it. Optional; FCA-P11 does not depend on it | P11 (OQ1) | Yes, in its own small amendment after P11 | Findings cannot show a launched session; the Sessions tray remains the only place |
| A8 | Provisional, spec later: action-registry verb `propose-closure` (spawn, envelope commit+push+openPr, `merge:false`) | closure-proposal | Defer to its own spec | n/a |
| A9 | Provisional, spec later: `git-fetch` execute-mode flow behind the destructive-confirmation contract; reaping reuses `close-delete` and needs no route | hygiene-actions | Defer to its own spec | n/a |

## Open decisions that remain with the owner

1. **Blocking I/O.** `/api/goals` and `/api/signals` take about 5 s each live because
   they run `execFileSync` on the event loop. `/api/decisions` (P9) and the P11
   follow-through reads add more of the same. Recommendation: schedule the
   event-loop offload as its own parcel *before* P11, and give P9 a strict budget and
   cache meanwhile. Not in this spec set unless the owner pulls it forward.
2. **Host/Origin validation and the `FOC_CONTAINER` non-loopback bind** (`server.ts`):
   still deferred. P9 and P12 add state-changing and command-presenting surfaces, so
   the exposure matters slightly more than before; recommend scheduling it with (1).
3. **Merge strategy shown in `pr-merge`.** Recommended: present `gh pr merge <N>`
   with no strategy flag, so `gh` prompts the human in a real terminal (matches the
   machine-local `foreman-status merge` gate). The console does not depend on that
   machine-local tool.

## Real-data baseline these specs are measured against

34 `hung` parcels across 17 goals. By reconciliation code (a parcel can carry
several): 15 `never-started`, 11 weak-trace `stale-abandoned` ("verify"), 8 with
`orphan-worktree` (one of them also `local-remote-divergence`). Re-measured against
`main` b8fe06b6 on a scratch console: **20 of the 34 would read `not-started` under
FCA-P10's R4a** (no spec, no chain, no sidecar): the 15 `never-started` plus 5 that
have traces outside the record (FOC-P1, FOC-P2, FOC-P3 failed-launch worktrees;
RCM-P2, TO-P6 weak traces). The handoff's "15" understated the effect; the 5 are why
the state wording is "not started *in the record*". Failed-launch worktrees sit
untouched under `agent-skills-worktrees/`.

Each spec states which of these numbers it is expected to move, and measures it
against a read-only scratch run (`FOC_REPO_ROOT=<repo> FOC_STATE_DIR=<tmp>
PORT=<free>`), never the operator's live consoles on :8081 and :8099.
