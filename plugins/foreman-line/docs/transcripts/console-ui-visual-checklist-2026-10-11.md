# Console UI visual checklist — 2026-10-11 (Task 19 / Checkpoint: Complete)

**Goal:** `foreman-ops-console` (control-center initiative, FCA-P6)
**Method:** live console (`FOC_REPO_ROOT=/home/cmorgan76/Repos/agent-skills`,
`npm start` entry `tsx src/server.ts`, port 8099) rendered in headless
Chromium at 1920x1080 and 1366x768; screenshots inspected.

## Verified at both sizes

- Full-viewport grid: header (fleet switcher, global search, posture, clock),
  left rail (7 views + severity filters), dense main, persistent spawn panel,
  collapsible session tray — **the page itself never scrolls** at either size.
- Board: goal picker (real goal, attention marker), "N goals need attention"
  summary, attention banner spanning the board grid, five lifecycle columns on
  one row at both sizes.
- Spawn panel renders at startup with the shared controls: harness (pi),
  model (claude-sonnet-5-5, freeform-capable), thinking (high), budget
  (**$20 hard max-USD cap** — presets $1-$100, no Unlimited), extra-direction
  textarea, counted spawn button (disabled at zero).
- Header fleet switcher populated from the fleet registry (real repo root).
- Session tray collapsed at the bottom with its count.

## Defects the visual check caught (all fixed and re-verified)

1. Attention banner was a board GRID ITEM (ate a column cell; columns wrapped
   to two rows) — now spans the grid (`#board > .banner { grid-column: 1/-1 }`).
2. Spawn panel showed its static placeholder at startup — now renders the real
   controls during init.
3. Header fleet switcher stuck on "loading…" — now populated from `/api/fleet`.
4. Banner omitted `ratificationUnknown` from its component list (rendered
   "needs attention —" with nothing after it) — now listed.

## Not covered here

- Firefox was not available on this machine (Chromium used); the layout is
  plain CSS grid + flex with no engine-specific features — owner spot-check
  welcome.
- Interactive flows (popover dispatch, destructive confirmation, spawn) are
  covered by the jsdom end-to-end suites (`ui-signals`, `ui-spawn-panel`,
  `ui-tray`, `ui-fleet`, `ui-shell` — all green).
