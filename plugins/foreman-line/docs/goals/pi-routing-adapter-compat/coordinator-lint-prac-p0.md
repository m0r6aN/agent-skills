# Coordinator Lint — PRAC-P0

Run 2026-09-24 against disk before dispatch. Applies to the draft spec
`docs/specs/active/PRAC-P0-pi-extension-hook-surface-compat.md` and the charter's evidence
baseline (which is marked "design input, re-verified by the parcel").

## Findings

- **L1 — Version.** Installed `@earendil-works/pi-coding-agent` is `0.87.1`
  (`package.json`); `node v24.7.0`. The 0.86.1→0.87.1 drift at ratification is recorded in
  the charter's version-drift note and plan-review post-script.
- **L2 — Docs restructured in 0.87.1.** `docs/extensions.md` no longer names
  `pi.setModel` / `pi.setThinkingLevel` in prose (both were present at lines ~1743/1761 of
  the 0.86.1 doc). The 0.87.1 doc references "Change active tools, model, or thinking
  level → Session control methods on `pi`" generically (extensions.md line 81) without the
  concrete method names. The charter baseline item 3 is therefore **0.86.1-epoch** and must
  not be copied into the memo.
- **L3 — The real 0.87.1 surface is the shipped types, not the prose.** `dist/core/
  extensions/types.d.ts` exposes `setActiveTools(toolNames: string[]): void` (l.1074),
  `setModel(model: Model<any>): Promise<boolean>` (l.1081), and
  `setThinkingLevel(level: ThinkingLevel): void` (l.1088), with handler aliases
  `SetModelHandler` / `SetThinkingLevelHandler` / `SetActiveToolsHandler` (l.1284–1288,
  l.1336–1341). There is **no** `beforeLLMTurn`, no `ctx.session.updateModel`, and no
  `ctx.session.updateThinkingLevel` anywhere in the docs or shipped types. The turn
  lifecycle is expressed as `TurnStartEvent` / `TurnEndEvent` / `BeforeAgentStartEvent` /
  `AgentStartEvent` / `AgentBeforeSettleEvent`, with provider events
  `BeforeProviderRequestEvent` / `AfterProviderResponseEvent`.
- **L4 — Spec correction required.** AC3 named `pi.setModel` / `pi.setThinkingLevel` as the
  "nearest documented surface" without distinguishing *shipped types* (present) from *docs
  prose* (absent in 0.87.1). Corrected below. This is a shaping fact-fix within ratified
  scope (D4/D7 already enumerate ".d.ts declarations" as part of the surface), not a
  locked-decision change.

## Disposition

Spec AC3 amended to the version-accurate surface. The memo's job is unchanged: record the
exact 0.87.1 disposition with the docs-prose-vs-shipped-types distinction, and flag the
present methods as "still not an authorization to route."
