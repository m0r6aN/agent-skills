# Charter Amendment — Control Center, Spawn Mode, and Fleet Scope

**Goal slug:** `foreman-ops-console`
**Date:** 2026-10-11
**Owner:** Clinton Morgan
**Ratification:** Gate 1 amendment — owner-ratified 2026-10-11 in session
("I ratify adding spawn mode + fleet-wide control-center scope to the
foreman-ops-console charter as described").
**Amends:** `charter.md` (2026-09-16 ratification) — scope and invocation-mode
clauses only. All other charter clauses stand unchanged.

## 1. Why

Owner directive 2026-10-11: the console must become "a master control center
for all foreman line processes, running across all local repos" — findings
(e.g. release-hygiene drift, working-tree churn, PR/CI anomalies) must be
first-class console signals, and anything actionable must carry action buttons
that spawn new agent sessions. The console's report-only posture and page-space
utilization are named deficiencies.

## 2. What changes (the ONLY changes)

1. **Invocation mode `spawn` added.** A third class alongside `execute` and
   `present`: the console composes a kickstarter-style prompt and launches a
   real interactive agent session in a real terminal (tmux pane). The console
   still produces no verification and executes no work itself — `spawn` is
   Stage-C dispatch by other means. The frozen `execute` set is unchanged;
   `present` semantics are unchanged.
2. **Fleet-wide scope.** The console observes and acts across a declared fleet
   of local repositories (generalization of `FOC_EXTRA_ROOTS`), editable in the
   console via filesystem browse + folder selection. Per-repo identity and
   liveness are first-class.
3. **Action surface.** Actionable findings carry verbs (`investigate`,
   `remediate`, `explain`, `close/delete`, extensible) wired to `spawn` /
   `present` / `execute` per an audited action registry.
4. **`close/delete` blast radius (owner: "All of it."):** notifications, PRs,
   branches, stale worktrees, goal records — with local repo hygiene as an
   explicit objective. The `lumber-jack` skill is used where appropriate.
   Destructive verbs never execute silently: confirmation-gated, audited, and
   routed through existing CLI/flow machinery per charter write-rules.
5. **UI mandate.** Feature-rich control center using full page space; vanilla
   JS/HTML5; local Docker containers permitted for MCP servers/tools, APIs, and
   data storage when a capability requires them.

## 3. What does NOT change (frozen)

- The console consumes verification produced by others; it never produces it.
- Every write goes through an existing CLI, flow, or spawned session — the
  console mutates no spec, receipt, contract, or goal record directly.
- Human gates G1 (ratification), G2 (dispatch), G3 (merge) remain human-owned.
  A merge-autonomy toggle may relax G3 only when the target repository's
  effective branch rules grant agent merge authority and that authority is
  verified at merge time; anything ambiguous fails closed to human-owned merge
  (Stage F rule, unchanged).
- The console never fabricates a TTY, never pipes a typed confirmation phrase,
  never auto-approves. Spawned sessions are real interactive sessions.
- `execute` mode remains limited to non-interactive, non-minting flows.

## 4. Spawn control contract (owner-ratified 2026-10-11)

Shared controls — defined once in a spawn panel, applied to every selected
action; never repeated per action:

1. **Harness** dropdown (e.g. `pi`, `claude`; extensible registry)
2. **Model** dropdown (harness-scoped ids; known-frontier registry where available)
3. **Thinking level** dropdown (`off | minimal | low | medium | high | xhigh | max`)
4. **Budget range** dropdown (bounded presets, plus `Unlimited`)
5. **Optional free-text textbox** — appended verbatim to each composed prompt

Each actionable row carries a **checkbox**; the spawn button launches one tmux
session with **one pane per selected action**. Each action additionally
configures an **autonomy envelope**: decisions (`full | partial`) and repo
actions (`commit`, `push`, `open-PR`, `merge` — each y/n, merge subject to the
fail-closed Stage F rule above).

## 5. Future goals captured (owner, 2026-10-11) — out of scope here

1. Omarchy app/plugin for lumber-jack (local repo-hygiene tooling as a desktop app).
2. Define and spawn foreman-line goals from the UI (Stage-A shaping from the console).
3. Transfer explicit ownership of goals and tasks to another session/agent.

Recorded in `control-center-capability-map.md` §5. Not dispatched by this
initiative; require their own charters/shaping.
