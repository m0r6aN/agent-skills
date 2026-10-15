# Builder Kickstarter — quick-flags QF-P3 (structural conformance check)

You are the Builder for QF-P3, building against the spec `plugins/foreman-line/docs/specs/active/QF-P3-quick-flags-conformance-check.md` (status active; coordinator-linted 2026-10-14). Two new test-private files in `plugins/foreman-line/spec-linter/tests/`, 11 ACs, mutation evidence for every named invariant. Follow its Verification Plan exactly.

**Build base:** `83bcd3ba`, the `qf-p3` HEAD at this dispatch (one coordinator-owned kickstarter commit may sit above it; same F1-style handling as QF-P0: keep the base, separate the coordinator delta). Record it in your completion claim.
**Dispatch:** Gate 2 granted (loop-directive standing authorization 1, contingent on coordinator lint, which passed). Direct invocation per loop-directive ruling 2026-10-13, no route receipt; you run on `openai/gpt-6.1-sol` under the extended 2026-10-14 route deviation (anthropic lane down; claude was retried first). State your model in Step 0. Standing constraints apply (`plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`).

**History you must not repeat:** QF-P1 reviews falsified two "every instance swept" claims; QF-P0's first builder was killed by the 60-minute foreground timeout with its last full suite RED on disk — unclaimed disk state is never accepted as done, and a helper crash is not a red check (retain failed attempts; an actual check evaluating false is a hard stop). Work in slices; keep the suite runnable; re-run the full Verification Plan after your final edit and paste actual outputs.

## Where you work
Worktree `/home/cmorgan76/Repos/agent-skills-qf-p3`, branch `qf-p3`. Write ONLY the two Allowed Files. Never run git add/commit/push/checkout/reset; read-only git is fine. You have a shell, write and edit. `spec-linter/node_modules` is already installed; install nothing new.

## Step 0 — restate and STOP (mandatory, per the spec's Constraints)
1. Name your model; confirm direct invocation under the rulings and the build base above.
2. Restate the parcel and the two Allowed Files; map each of AC-1..AC-11 to the checks you will implement and the named tests/mutations that prove them.
3. Flag every spec ambiguity, contradiction with canon or between ACs, or gap, each with a recommendation. A real gap needs a ratified amendment; never resolve one silently.
4. State how you will run the five Verification Plan steps, and the tripwires: every mutation fails on its own named diagnostic; positive controls pass; both invocation directories give identical verdicts; scope check prints exactly the two Allowed Files.
5. STOP and wait for rulings.

## After rulings
Build. Completion claim: a table mapping every AC to named tests and file:line evidence, every Verification Plan step with its actual output (test counts, exits), the build base, and a list of every addition not required by an AC (each justified). Wrong-shaped claims are presumptively empty.
