# Builder kickstarter — FCA-P14 (event-loop offload)

Role: builder (architecture/risk, frontier). Worktree: `/home/cmorgan76/Repos/agent-skills-worktrees/fca-offload`
Branch: `docs/fca-offload-shaping` (spec already committed; build on top). Never touch another worktree or the primary checkout.
Spec (ratified 2026-10-14, includes coordinator amendment): `plugins/foreman-line/docs/specs/active/FCA-P14-event-loop-offload.md`
Standing constraints: `plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md` (by reference). Allowed Files: the spec's. Anything else is a flag.

## Step 0 (restate-and-stop)
Before ANY source edit: restate scope; re-derive the blocking call-site inventory by grep; PROFILE each affected route on a real fleet (route timing + cpu profile) and state where the event loop actually blocks (amendment item 2); confirm the read-only gh allowlist guard position (item 3); state live `node -v` (>=24.11.1) and `npm test` count; list gaps. Write to `STEP0.md` (uncommitted, worktree root) and STOP. Symlinked `node_modules` are intentional and excluded; never commit them.

## Hard rules
- No route-shape/schema/vocabulary change; read-only/present-only invariants, audit behaviour, single-execute-spawn-site test unchanged.
- Negative controls for each new guard; event-loop-lag test; measured before/after.
- Commit with explicit `git add` paths; do NOT push/PR/merge. Final message: claims mapped to evidence per AC with test counts; wrong-shaped claims are presumptively empty; run typecheck and lint and test yourself.
