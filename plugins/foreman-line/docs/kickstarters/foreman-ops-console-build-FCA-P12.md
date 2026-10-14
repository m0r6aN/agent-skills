# Builder kickstarter — FCA-P12 (acknowledge-and-triage)

Role: builder (standard-feature). Worktree `/home/cmorgan76/Repos/agent-skills-worktrees/fca-p12`, branch `feat/fca-p12-acknowledge` (cut from main fee5b6ba). Never touch another worktree or the primary checkout.
Spec (owner-ratified 2026-10-13, incl. amendments A6 state/acknowledgements.json + routes, A7 syncAlerts behaviour): `plugins/foreman-line/docs/specs/active/FCA-P12-acknowledge-and-triage.md`. Standing constraints: `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md` (by reference). Allowed Files: the spec's `surfaces:`. Anything else is a flag.

## Step 0 (restate-and-stop)
Before ANY edit: restate scope; verify on disk the notifications store, syncAlerts rebuild behaviour, STATE_FILES closed set, and how FCA-P7 signals age to info; state live `node -v` (>=24.11.1) and `npm test` count from plugins/foreman-line/ops-console; list gaps. Write `STEP0.md` (uncommitted) and STOP. Symlinked node_modules are intentional; never commit them.

## Hard rules
- Acknowledgement alters no facts: no parcel state, severity, ledger, receipt, or goal record changes; it lapses when evidence changes (evidence binding per spec).
- Dismissal persists only while the alert's evidence is unchanged; a changed alert re-fires.
- New state file must join the STATE_FILES closed set; routes GET/POST /api/acknowledgements, DELETE /api/acknowledgements/:id exactly as specced.
- Windows-portable tests (path.delimiter, no POSIX-only assumptions); CI runs on Windows.
- Commit explicit `git add` paths; do NOT push/PR/merge. Run npm test, typecheck, lint (0 warnings) yourself. Final message: evidence per AC with before/after counts; wrong-shaped claims are presumptively empty.
