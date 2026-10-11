# Implementation Plan: Ops Console Control Center (FCA-P2–FCA-P6)

**Goal:** `foreman-ops-console` (charter + `AMENDMENT-2026-10-11-control-center.md`)
**Specs:** `plugins/foreman-line/docs/specs/active/FCA-P2…FCA-P6` (all `active`)
**Task list:** `tasks/todo.md` (default markdown target; no external tracker designated)
**Build order (owner-ratified):** fleet → signals → actions → spawn → console-ui

## Overview

Turn the Foreman Ops Console from a report into a master control center across
a fleet of local repos: heterogeneous hygiene/process findings become one
signal model, every signal carries registered action verbs, and checked actions
spawn real agent sessions (tmux panes) with shared spawn controls and per-action
autonomy envelopes — without breaking the console's frozen safety posture
(no verification production, execute-mode freeze, human gates, no fabricated
TTYs). Implementation follows `incremental-implementation` + `test-driven-development`;
UI slices also follow `frontend-ui-engineering`.

## Architecture Decisions

- **Registry-closed vocabularies.** Fleet roots, signal classes, and
  (class × verb) actions are closed sets extended only by spec change; unknown
  input is refused typed, never coerced (FCA-P2/P3/P4 contracts).
- **Signals are derived, immutable snapshots** with mandatory evidence; no
  signal store that can drift from disk/`gh` truth (FCA-P3).
- **`spawn` is dispatch, not execution.** The console composes kickstarter-style
  prompts and launches real interactive sessions; the frozen `execute` set is
  unchanged and destructive verbs are `spawn`/`present` only (FCA-P4).
- **Shared spawn controls.** One control set (Harness / Model / Thinking /
  Budget cap `$1–$100` max-USD presets — unlimited withdrawn / optional
  textbox) per spawn request; per-action state is only the checkbox + autonomy
  envelope (FCA-P5, owner-ratified contract as revised 2026-10-11).
- **Fresh git worktree per action** (owner: "hygiene is a must"): panes never
  share a dirty checkout; spawn receipts record worktree paths for reaping.
- **`session-state` is its own closed signal class** (delegated decision): spawn
  lifecycle is independently filterable and distinct from goal state.
- **Autonomy envelopes are prompt data with a fail-closed floor.** The envelope
  travels verbatim into prompts; merge autonomy never removes the Stage-F
  fail-closed sentence (FCA-P4/P5).
- **Vanilla JS/HTML5, no build step.** ES modules OK; devDependencies for test
  harnesses OK; Docker sidecars allowed behind the API boundary only where a
  capability (MCP/DB) requires it (FCA-P6).
- **Runtime state stays untracked** (`ops-console/state/` gitignored — the
  first FCA-P3 remediation, landed in PR #177).

## Task List (index — full structures in `tasks/todo.md`)

### Phase 1: Fleet foundation
- [x] Task 1: Fleet registry model + persistence
- [ ] Task 2: Fleet API (identity + liveness, add/remove)
- [ ] Task 3: Sandboxed filesystem browse + folder qualification

### Checkpoint: Foundation
- [ ] Full sweep green (`npm test`, `typecheck`, `lint`; root validators)
- [ ] Manual: add + remove a real repo through the API

### Phase 2: Signals
- [ ] Task 4: Signal type, provider interface, `/api/signals` shell, parcel-state wrapper
- [ ] Task 5: release-hygiene provider (version drift, stale refs, unclaimed backlog)
- [ ] Task 6: worktree-hygiene provider + lumber-jack evidence mapping

### Checkpoint: Signals (mid)
- [ ] Provider fixtures green; clean-repo negative cases pass

- [ ] Task 7: scm-ci provider (`gh` read-only + graceful degradation)
- [ ] Task 8: goal-hygiene provider + FCA-2 attention-count integration

### Checkpoint: Signals (complete)
- [ ] All five classes emit evidence-backed signals; `/api/signals` filters work

### Phase 3: Actions
- [ ] Task 9: ActionSpec registry + typed refusals + audit entries
- [ ] Task 10: Prompt templates + composition for baseline verbs
- [ ] Task 11: Destructive guard + typed-confirmation contract

### Checkpoint: Actions
- [ ] Registry matrix + prompt snapshots green; `execute` cannot be registered for mutating verbs

### Phase 4: Spawn
- [ ] Task 12: Spawn planner (pure) + harness argv builders + refusal matrix
- [ ] Task 13: tmux launcher (stub-tested) + partial-failure audit
- [ ] Task 14: Spawn receipts + `/api/spawns` + pane liveness

### Checkpoint: Spawn
- [ ] Planner/launcher tests green; one documented real-tmux manual smoke

### Phase 5: Console UI
- [ ] Task 15: Layout shell (full-viewport grid, rails, view nav, density baseline)
- [ ] Task 16: Signals view + action buttons + bulk select + destructive confirm
- [ ] Task 17: Spawn panel (shared controls + autonomy popovers) + spawn wiring
- [ ] Task 18: Fleet view + filesystem folder picker
- [ ] Task 19: Session tray + attach copy + visual checklist

### Checkpoint: Complete
- [ ] All spec acceptance criteria (FCA-P2…P6) met
- [ ] Visual checklist at 1920×1080 and 1366×768; Firefox + Chromium clean
- [ ] Ready for human review

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Harness CLI flag drift (pi/claude model/thinking/budget flags differ or change) | High | Task 12 verifies real flags first (fail fast); argv snapshot tests; unsupported combos refused typed |
| tmux variance/absence across machines | Med | `tmux-unavailable` typed refusal; launcher tested against a stub binary; documented real-tmux smoke |
| `gh` rate limits / offline dev | Med | scm-ci degrades to one `info` signal; no live network in tests (mocked output) |
| UI scope creep under "feature rich" mandate | Med | Spec acceptance criteria are the ceiling; per-task AC + checkpoints; new ideas route to the future-goals backlog |
| Destructive actions harming repo state | High | Typed confirmation + destructive guard + append-only audit; destructive verbs never `execute`; Stage-F fail-closed merge retained |
| Parallel/overlapping sessions mutating fleet or state | Med | State stores single-writer via the console process; spawn receipts are append-only |

## Open Questions — resolved 2026-10-11 (owner rulings)

1. **Budget presets:** max-USD `$1 | $5 | $10 | $20 | $50 | $100`;
   the `Unlimited` option is withdrawn.
2. **Model dropdown:** static registry seeded from the known-frontier
   registry + freeform fallback (delegated default accepted).
3. **Spawn working directory:** fresh git worktree per action — "hygiene is
   a must" (Task 12 scope updated accordingly).
4. **`session-state` signal class:** its own closed-vocabulary class
   (delegated to shaping; decided — not folded into `goal-hygiene`).

## Parallelization Opportunities

- Tasks 5/6/7 (signal providers) are independent after Task 4 — parallelizable
  across sessions.
- Task 10 (prompt templates) can proceed alongside Task 12 (argv builders):
  shared contract is the `ActionSpec` from Task 9.
- UI Tasks 18/19 parallelize after Task 15.
- Tasks 2/3, 13/14 must stay sequential within their pairs (shared state/API shape).
