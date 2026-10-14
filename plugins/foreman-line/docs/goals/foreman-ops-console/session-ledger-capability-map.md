# Capability Map — Session Ledger and Reconciliation (owner-approved 2026-10-13)

Companion to `AMENDMENT-2026-10-11-control-center.md` and
`ux-redesign-capability-map.md`. Status: **owner-approved 2026-10-13** (map, build order, tmux hardening, and the
writable-path / receipt / route amendments). Gate 3 (merge) remains human-owned.

## Why this exists

Owner report 2026-10-13: actions are selected and sessions launched, but there
is no visibility into what happened afterwards; the Sessions button appears to
do nothing; remediation, investigation and explanation requests never visibly
complete; ~34 parcels sit `hung` and closing them is manual record-chasing; the
operator needs to compare local state/history against remote state/history.

Disk evidence gathered before drafting (2026-10-13):

- 7 panes launched across 5 tmux sessions; **no tmux server is running**, so no
  pane output survives anywhere.
- pi created a session directory in each launch worktree at launch time, and
  every one is **empty** (no transcript): no message was ever exchanged.
- All launch worktrees are clean and carry no commits beyond their base.
- The ratified amendment requires worktrees to be "reaped by hygiene flows,
  never left behind"; 7 are left behind and nothing tracks them.
- FCA-U3 deliberately excludes telemetry, completion, and reaping from the
  Sessions *screen*; no spec owns the backend facts it would display.

## Modules

| Module id | Responsibility | Depends on | Spec |
|---|---|---|---|
| `session-ledger` | Durable, evidence-backed record of what each launched pane did: output, exit, transcript, cost, git outcome, derived lifecycle | FCA-P5 (spawn), FCA-U3 (screen) | [FCA-P7](../../specs/active/FCA-P7-session-ledger.md) |
| `reconciliation` | Per-parcel local-vs-remote comparison, merged history, closed discrepancy vocabulary, "why is this hung" explanation | `session-ledger`, FCA-P1 (remedy format) | [FCA-P8](../../specs/active/FCA-P8-reconciliation-view.md) |
| `closure-proposal` | Guided, reviewable PR that completes a record the evidence says shipped | `reconciliation` | not drafted |
| `ui-triage` | Reproduce and fix the Sessions button in a real browser; browser regression test | `session-ledger` | not drafted (folded into FCA-P7 AC9) |

Build order: `session-ledger` → `reconciliation` → `closure-proposal`.
`closure-proposal` is intentionally not specified yet: its shape depends on what
`reconciliation` proves is actually common.

## Cross-module invariants (inherited, unchanged)

- The console produces no verification and mutates no spec, receipt, contract,
  or goal record directly; writes go through CLIs, flows, or spawned sessions.
- Human gates G1/G2/G3 stay human-owned; no auto-approval; no fabricated TTYs.
- Unknown stays unknown: a missing fact renders as unknown, never as zero,
  failed, or complete.
- The frozen route table and parcel-state vocabulary (FOC-P0) are not widened
  without an owner-ratified amendment named in the spec.

## Decisions (resolved 2026-10-13)

1. Approve/adjust this map and the build order.
2. tmux: keep it (installed, 3.7c) with `remain-on-exit` + `pipe-pane`
   (recommended; see FCA-P7 §Design), or add a headless mode (see FCA-P7 OQ1).
3. Ratify the writable-path and route amendments each spec names under
   "Ask first".
