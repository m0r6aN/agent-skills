# Builder kickstarter — FCA-P11 (reconciliation follow-through, "Prepare session")

Role: builder (standard-feature). Worktree `/home/cmorgan76/Repos/agent-skills-worktrees/fca-p11`, branch `feat/fca-p11-followthrough` (cut from main 0ceb11cd). Never touch another worktree or the primary checkout.
Spec (owner-ratified 2026-10-13): `plugins/foreman-line/docs/specs/active/FCA-P11-reconciliation-followthrough.md`. Standing constraints: `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md` (by reference). Allowed Files: the spec's `surfaces:` plus the ops-console README. Anything else is a flag.

## Step 0 (restate-and-stop)
Before ANY edit: restate scope; verify on disk the launch panel state shape, the FCA-P4 registry verbs and envelopes, the FCA-P5 typed refusals, and how reconciliation options are rendered today; state live `node -v` (>=24.11.1) and `npm test` count; list gaps/ambiguities. Write `STEP0.md` (uncommitted, worktree root) and STOP. Symlinked `node_modules` are intentional; never commit them.

## Hard rules
- "Prepare session" mutates client selection state ONLY; no new route, verb, registry pair or envelope; `merge` stays false; `investigate`/`explain` only; instruction capped at 2,000 chars with the scope footer never truncated.
- The console never fabricates a TTY or auto-confirms; launching stays the existing plan-then-launch flow.
- CI runs on WINDOWS: no POSIX-only assumptions in new tests (path.delimiter, no shell-script fakes — reuse the portable fake-bin helper from FCA-P16 if present, else tests/support pattern).
- Commit with explicit `git add` paths; do NOT push/PR/merge. Run typecheck, lint (0 warnings), test yourself. Final message: claims mapped to evidence per AC with before/after test counts; wrong-shaped claims are presumptively empty.
