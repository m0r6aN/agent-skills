# Capability Map — Ops Console Control Center (owner-ratified 2026-10-11)

Companion to `AMENDMENT-2026-10-11-control-center.md`. Module boundaries,
dependency direction, and build order for the control-center initiative.
Spec-driven development: each module gets one spec in
`docs/specs/active/`, named by ticket. Module ids are stable and never renamed.

| Module id | Responsibility | Depends on | Spec |
|---|---|---|---|
| `fleet` | Declared fleet of local repos; filesystem browse + folder selection; per-repo identity + liveness | — | `FCA-P2-fleet.md` |
| `signals` | One attention model: parcel state, release hygiene, working-tree hygiene, PR/CI semantics, lumber-jack findings | `fleet` | `FCA-P3-signals.md` |
| `actions` | Action registry: signal × verb → invocation class + autonomy envelope + audit | `signals` | `FCA-P4-actions.md` |
| `spawn` | tmux session spawner; prompt composition; config application; spawn receipts; pane liveness | `actions` | `FCA-P5-spawn.md` |
| `console-ui` | Control-center layout: action buttons, bulk select, spawn panel, session tray, fleet switcher | `signals`, `actions`, `spawn` | `FCA-P6-console-ui.md` |

**Build order:** `fleet` → `signals` → `actions` → `spawn` → `console-ui`.
Each module ships as thin verifiable slices with tests. `signals` delivers the
first user-visible value (the findings exist today but are invisible in the
console); `spawn` is the most expensive and lands after its contracts are
frozen by `actions`.

## Ratified cross-module contracts

### Spawn controls (owner-ratified 2026-10-11)

One shared spawn panel; per-action checkboxes; applied to every selected action:

1. Harness dropdown — `pi` | `claude` | (extensible registry)
2. Model dropdown — static registry (known-frontier seeded) + freeform fallback
3. Thinking level dropdown — `off | minimal | low | medium | high | xhigh | max`
4. Budget cap dropdown — max-USD presets `$1 | $5 | $10 | $20 | $50 | $100`
   (**no unlimited option** — owner revision 2026-10-11)
5. Optional textbox — extra directive, appended verbatim

**Autonomy envelope per action:** decisions `full | partial`; repo actions
`commit` / `push` / `open-PR` / `merge` each y/n. Merge y is subject to the
Stage F fail-closed rule (verified agent authority or human-owned merge).

**Spawn mechanics:** one tmux session, one pane per selected action; each pane
gets a real interactive harness session in a **fresh git worktree** cut from
the signal's repo root (owner revision 2026-10-11: "fresh worktree. hygiene is
a must"), with the composed prompt.

### Safety invariants (all modules)

- Console produces no verification; writes go through CLI/flows/spawned sessions only.
- No fabricated TTYs, no piped confirmations, no auto-approval.
- Destructive verbs (`close/delete`) are confirmation-gated and audited.
- Refuse non-absolute roots and unregistered fleet paths (D1-style typed refusals).

## §5 Future goals (owner-captured 2026-10-11 — NOT in this initiative)

1. Omarchy app/plugin for lumber-jack.
2. Define and spawn foreman-line goals from the UI.
3. Transfer explicit ownership of goals and tasks to another session/agent.

Each requires its own charter/shaping before dispatch.
