---
ticket: FCA-P6
title: Control-center UI — dense layout, action buttons, spawn panel, session tray
status: active
owner: clinton.morgan
created: 2026-10-11
updated: 2026-10-11
supersedes: null
superseded_by: null
risk: standard
surfaces:
  - plugins/foreman-line/ops-console/ui/index.html
  - plugins/foreman-line/ops-console/ui/app.js
  - plugins/foreman-line/ops-console/src/api.ts
routing_class: standard-feature
verification_class: deterministic
permission_profile: builder-standard
data_classification: internal
---

# FCA-P6 — Control-center UI

## 1. Purpose

The console "just looks like a report that doesn't utilize page space very
well" (owner, 2026-10-11). This spec makes it a master control center: dense,
full-viewport, action-oriented — every actionable finding carries its verb
buttons, selections feed the shared spawn panel, and spawned sessions are
visible and manageable. "Vanilla is fine, as long as it is feature rich.
Useful functionality should not be omitted for the sake of simplicity."

## 2. Owner directive (2026-10-11)

Action buttons (Investigate / Remediate / Explain / Close-Delete, extensible)
that spawn sessions per the ratified spawn-control contract; fleet editable via
filesystem browse + folder selection; full page-space utilization; vanilla
JS/HTML5; local Docker containers permitted for MCP servers/tools, APIs, and
data storage when a capability requires them.

## 3. Additive surface (the ONLY changes)

- **Layout:** single page, full-viewport CSS grid — header (fleet switcher,
  posture, global search) · left rail (view nav + severity filters) · dense
  main grid · persistent spawn panel (right rail) · session tray (bottom,
  collapsible). Views: Board (existing, denser cards), Signals, Fleet,
  Sessions, Remedies, Audit, Settings.
- **Action surface:** every card/row exposes registered verb buttons
  (FCA-P4) + a checkbox; Shift-select ranges; per-action autonomy popover;
  destructive verbs require typed confirmation (guard mirrored from FCA-P4).
- **Spawn panel (shared controls):** Harness · Model · Thinking level · Budget
  cap (max-USD presets `$1–$100`, no unlimited — owner revision) dropdowns +
  optional textbox + Spawn button (count of selected actions). Never repeated
  per action.
- **Fleet view:** browse widget (`/api/fs/browse`) with folder picker →
  add/remove roots; per-repo identity + liveness tiles.
- **Session tray:** spawns from `GET /api/spawns` — pane liveness, harness,
  model, repo, attach command (copyable), and per-session actions
  (explain / close) via the same registry.
- **Docker (optional):** containerized MCP servers/tools/APIs/storage are
  permitted behind the existing API boundary; the UI remains dependency-free
  vanilla JS. Adopt a container only where a capability (MCP, DB) requires it —
  recorded in the goal transcripts when it happens.

## 4. Contracts

- **API-boundary discipline:** the UI writes nothing directly; all mutations go
  through `/api/*` handlers that carry the guards/audit of FCA-P2..P5.
- **Progressive density:** default viewport shows board + signals + spawn panel
  without scrolling; tables virtualize past 200 rows.
- **No build step, no framework** (vanilla JS/HTML5, ES modules acceptable).
- **Accessibility floor:** keyboard-reachable buttons, focus rings, aria labels
  on icon-only controls.

## 5. Acceptance criteria

1. One viewport shows: fleet switcher, attention counts, board/signals, spawn
   panel, session tray (collapsed) — no page scrolling at 1920×1080.
2. Selecting N rows and pressing Spawn produces exactly one spawn request with
   N actions and the shared controls (checked against FCA-P5 planner output).
3. Every registered verb renders on its allowed signal classes only; others are
   absent (not disabled).
4. Destructive actions require typed confirmation in the UI before any request
   is sent.
5. Fleet folder picker can add and remove a repo root end-to-end through the
   API (mocked server in tests).
6. Works in current Firefox and Chromium without console errors.

## 6. Verification

DOM-level tests (mocked `fetch`) for render + request composition; visual
checklist (1920×1080 and 1366×768) in the goal transcripts; full package sweep
green.
