---
ticket: FCA-P5
title: tmux session spawner with shared spawn controls
status: active
owner: clinton.morgan
created: 2026-10-11
updated: 2026-10-11
supersedes: null
superseded_by: null
risk: elevated
surfaces:
  - plugins/foreman-line/ops-console/src/spawn.ts
  - plugins/foreman-line/ops-console/src/invoke.ts
  - plugins/foreman-line/ops-console/src/api.ts
  - plugins/foreman-line/ops-console/src/liveness.ts
routing_class: architecture/risk
verification_class: deterministic
permission_profile: builder-standard
data_classification: internal
---

# FCA-P5 — tmux session spawner

## 1. Purpose

The owner-ratified `spawn` mode: turn a checked action into a real agent
session. One spawn request launches one tmux session with **one pane per
selected action**, each pane a real interactive harness session carrying the
composed prompt (FCA-P4) and the shared spawn controls. The console launches
sessions; it never becomes one.

## 2. Owner directive (2026-10-11)

"Start a new tmux session and add a pane for each selected action." Shared
controls (not repeated per action): Harness, Model, Thinking level, Budget cap
(max-USD presets — revised same day, see §4), optional textbox. Per-action
autonomy options for decisions and repo actions.

## 3. Additive surface (the ONLY changes)

- `spawn.ts` (new): spawn planner + launcher.
  - **Planner (pure):** `(action specs × spawn controls) → spawn plan` — one
    tmux session, N panes; per pane: harness command line (harness id →
    argv builder for `pi`/`claude` incl. model + thinking-level + budget
    flags; unsupported flag combinations refused typed), working directory
    (a fresh git worktree cut from the signal's repo root at spawn time —
    owner ruling 2026-10-11: "fresh worktree. hygiene is a must"; the
    worktree path lands in the spawn receipt so hygiene flows can reap it),
    prompt payload (composed prompt + optional textbox text appended verbatim).
  - **Launcher (thin):** execute the plan via `tmux new-session` +
    `tmux split-window` per additional pane; tmux absence is a typed refusal
    (`tmux-unavailable`), never a fallback to headless execution.
- `invoke.ts`: spawn outcomes append audit entries with `spawnId`.
- `liveness.ts`: spawn receipts record session/pane ids, harness, model,
  thinking level, budget, autonomy envelope, repo root, prompt digest; pane
  liveness (alive/dead/exited) projects back as `parcel-state`-adjacent
  signals (FCA-P3 class `session-state` — class decision 2026-10-11, delegated
  to the shaping agent: a separate closed-vocabulary class, not folded into
  `goal-hygiene`, because spawn lifecycle is independently filterable).
- `api.ts`: `POST /api/spawn` (validated plan only), `GET /api/spawns`.

## 4. Contracts

- **Real TTYs only.** Panes are real interactive sessions. No fabricated TTY,
  no piped confirmation phrases, no auto-approval (charter, unchanged).
- **Controls are shared, not repeated.** One control set per spawn request;
  per-action state is limited to the checkbox and the autonomy envelope.
- **Budget is a hard max-USD cap** (`$1 | $5 | $10 | $20 | $50 | $100`); the
  unlimited option is withdrawn (owner revision 2026-10-11). The cap is
  asserted in the prompt and passed as a harness flag where supported; it
  never relaxes harness-level or repo-level policy.
- **Fresh worktree per action.** Each pane starts in a git worktree cut from
  the signal's repo root at spawn time (hygiene-isolation, owner ruling
  2026-10-11); the receipt records the path for later reaping.
- **Prompt digest** (sha256) is stored, not the full prompt, in spawn
  receipts; full prompt is reproducible from the audit entry + templates.

## 5. Acceptance criteria

1. Planner output for K selected actions is exactly one session with K panes,
   deterministic in tests (no tmux needed).
2. Harness/model/thinking/budget controls reach each pane's argv and prompt;
   unsupported combinations refuse typed before any process starts.
3. Optional textbox text appears verbatim in every composed prompt.
4. Autonomy envelopes appear verbatim in prompts; merge y does not remove the
   Stage F fail-closed sentence from the prompt template.
5. Launcher failure at any pane leaves an audited partial plan + typed error;
   no silent retries.
6. Spawn receipts round-trip through `GET /api/spawns` with liveness states.

## 6. Verification

Deterministic planner tests (argv + prompt snapshots, refusal matrix) in
`ops-console/tests/`; launcher tested against a tmux stub binary; one manual
smoke checklist for a real tmux session (documented in the goal transcripts).
Full package sweep green.
