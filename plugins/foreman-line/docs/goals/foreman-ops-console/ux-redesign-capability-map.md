# Ops-console UX redesign — approved direction, draft contracts

## Authority and status

The owner approved the redesign direction in the current Pi session on
2026-10-12 ("Direction approved."). This approves the capability boundaries
below, not the detailed draft specs, implementation plan, dispatch, or merge.
On 2026-10-12 the owner approved all three detailed specs as written, confirmed
the goal-local plan location, and granted blanket authority for decisions and
non-destructive actions needed to complete this redesign. Specs are now active;
plan/task decisions and implementation checkpoints are delegated. No existing
coordinator ownership is transferred; no destructive operation, human approval
bypass, or real launch against operator repositories is authorized by this work.

| Module id | Responsibility | Depends on | Draft spec |
|---|---|---|---|
| `workspace-navigation` | Layout, navigation, repository scope, search, responsive styling | — | [FCA-U1](../../specs/active/FCA-U1-workspace-navigation.md) |
| `selection-launch` | Persistent selection, explicit actions, launch review, outcomes | `workspace-navigation` | [FCA-U2](../../specs/active/FCA-U2-selection-launch.md) |
| `session-monitoring` | Populate Sessions; connect launch outcomes to session tracking | `selection-launch` | [FCA-U3](../../specs/active/FCA-U3-session-monitoring.md) |

Build order: `workspace-navigation` → `selection-launch` → `session-monitoring`.
Frontend code is shared, so these modules build sequentially, not concurrently.

## Product objective

Replace a report-like collection of technical surfaces with a usable operator
workflow: **find work → select it → choose actions → review launch → track sessions**.
Keep the existing projection authority, real-terminal launch machinery, and
human-owned approval boundaries.

## Navigation and information hierarchy

| Primary destination | Operator question | Existing surfaces preserved |
|---|---|---|
| Work queue (default) | What needs attention, and what can I do next? | Signals, severity, registered actions, alert/unblock guidance |
| Goals & parcels | What is progressing or blocked under this goal? | Goal picker, parcel states, gates, chain/evidence detail |
| Sessions | What was launched, what is alive, and how do I attach? | Spawn receipts, pane liveness, attach, explain/close actions |
| Repositories | Which projects are monitored? | Fleet identity/liveness, folder browser, add/remove |

Secondary, explicitly named tools: **Alerts & unblock guidance**, **Flow tools**
(existing Audit content, not misrepresented as history), **Routing policy**
(existing Settings content, read-only). No useful legacy capability disappears.

## Layout sketch (desktop; drawer closed)

```text
┌ Foreman Line     [All repositories ▾]   [Search this view…]   Refresh ┐
│ Work queue      │ Work queue                                       │
│ Goals & parcels │ What needs your attention                        │
│ Sessions        │ [Urgent] [Needs attention] [Informational]         │
│ Repositories    │ [ ] Item / context   Repository   Status   Action  │
│                 │ [ ] …                                               │
│ Tools           │                                                     │
│ …               │ [3 items selected]  Clear          Review launch → │
└─────────────────┴─────────────────────────────────────────────────────┘
```

The launch drawer opens only on demand. It shows selected targets and explicit
per-item action/permissions, followed by one shared set of launch controls.
Narrow screens use a compact navigation control and full-width launch dialog;
page scrolling is allowed when it is the accessible layout.

Visual direction: charcoal surfaces, neutral typography, one restrained accent,
semantic status text/badges, consistent spacing, clear primary/secondary actions.
No permanent empty spawn rail, mandatory five-column board, or raw-JSON result
as the primary feedback. Technical records stay available through disclosure.

## Proposed changes to the previous UI contract

On detailed-spec approval, FCA-U1/U2/U3 replace only these FCA-P6 presentation
requirements: seven equal-priority nav entries; persistent right spawn rail;
no-page-scroll at all sizes; default board/signals simultaneity; and capped or
virtualized tables without an explicit route to remaining records.
The redesign uses one primary view at a time, an on-demand launch drawer, and
accessible pagination (maximum 200 rendered items per page, every item reachable).
Shared launch controls, per-action autonomy, guarded API writes, and real tmux
sessions with fresh worktrees remain unchanged. The 2026-10-11 charter amendment's
fourth and fifth sections remain the launch authority.

A small additive `repoRoot` field on each `/api/goals` status is proposed to
support reliable repository scoping without guessing aliases or basenames.
No new mutation endpoint, inference rule, or goal-creation/ownership action is
proposed.

## Planning location — owner confirmed

Root `tasks/todo.md` still has incomplete control-center verification checkpoints.
Do not overwrite it. Proposed redesign-only targets:

- `plugins/foreman-line/docs/goals/foreman-ops-console/ux-redesign/tasks/plan.md`
- `plugins/foreman-line/docs/goals/foreman-ops-console/ux-redesign/tasks/todo.md`

Owner confirmed these targets on 2026-10-12. The root task list remains untouched.
The implementation plan and tasks are reviewed under the delegated authority.

## Baseline and verification expectations

Baseline at `1b2fe2cf`: `npm test` in `ops-console/` passes 333/333.
Baseline structural assertions do not demonstrate visual usability; replace
obsolete layout tests with behavioral coverage, not weaker assertions.

Verification requires mocked-fetch browser-DOM workflows and real Firefox/
Chromium inspection at 320, 768, 1024, 1366, and 1920 pixels wide; screenshots,
keyboard/focus checks, and loading/error/empty states are part of the evidence.
Do not perform real spawns, deletions, approvals, or merges as a visual smoke
check. A real tmux/worktree launch requires a disposable fixture and explicit
authorization; otherwise label it unverified.
