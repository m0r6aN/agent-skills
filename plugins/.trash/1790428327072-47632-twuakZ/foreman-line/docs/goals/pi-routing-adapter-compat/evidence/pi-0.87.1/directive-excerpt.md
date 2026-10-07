# Directive Excerpt — proposal API claims under review (PRAC-P0, D10)

Snapshot of the exact API-name claims the memo restates and tests. Source files are outside
this repository; this excerpt is what a reviewer inspects in-repo.

## Source

- `C:/Users/clint/Documents/Codex/2026-09-23/pl/.audit/foreman-router-brief.md` (line 10)
- `C:/Users/clint/Documents/Codex/2026-09-23/pl/.audit/directive.md` (line 15)

## Verbatim claims

> A custom TypeScript middleware extension at `~/.pi/agent/extensions/cost-router.ts`. The
> example reads the active file or `LAST_ACCESSED_FILE`, parses `capability` and `model`
> frontmatter, and calls `ctx.session.updateModel(...)` and
> `ctx.session.updateThinkingLevel(...)` during a `beforeLLMTurn` hook. It emits UI
> notifications on routing or errors.

> **P1 — Compatibility:** The hook and session APIs shown are unverified and must not become
> a hard dependency without a version-pinned spike.

## API names under test

1. `beforeLLMTurn` — a hook name.
2. `ctx.session.updateModel(...)` — a session model-mutation method.
3. `ctx.session.updateThinkingLevel(...)` — a session thinking-level mutation method.
4. `~/.pi/agent/extensions/cost-router.ts` — the proposed middleware path (location only).

> No credentials, PII, or other inventors' content are included in this excerpt.
