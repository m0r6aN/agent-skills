# Builder kickstarter — FCA-P16 (ops-console Windows portability)

Role: builder (architecture/risk, frontier). Worktree `/home/cmorgan76/Repos/agent-skills-worktrees/fca-p16`, branch `fix/fca-p16-windows` (spec + dossier already committed). Never touch another worktree or the primary checkout.
Spec (ratified 2026-10-14): `plugins/foreman-line/docs/specs/active/FCA-P16-ops-console-windows-portability.md`. Dossier: `.../ux-redesign/tasks/FCA-P16-windows-failure-dossier.md`. Standing constraints: `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`.

## Step 0 (restate-and-stop)
Before any source edit: restate scope; re-verify each of the 14 failures on disk (root cause, fix class); sweep EVERY ops-console test/source/script for further POSIX assumptions and list them; state the live Linux `node -v` and `npm test` count; list gaps and how CI will be used. Write `STEP0.md` (uncommitted) and STOP.

## Hard rules
- Product guard fix is platform-aware and unit-testable by injecting the platform; keep POSIX strictness; refuse quotes/`$`/backtick/control chars everywhere, plus `%` and `^` on win32.
- No weakened assertions; every skip named/justified/counted in the manifest.
- CI loop: push ONLY `fix/fca-p16-windows`, open a DRAFT PR, read the Windows run logs (`gh run view --log`, use `gh api --allow-escape-sequences .../logs | sed 's/\x1b\[[0-9;]*m//g'`), iterate. Never merge, never edit workflows.
- Linux suite stays green; typecheck and lint 0 warnings; commit with explicit paths.
- Final message: per-failure evidence, the Windows run URL with the ops-console test/typecheck/lint outcome from the log, skip manifest with counts, test counts before/after. Wrong-shaped claims are presumptively empty.
