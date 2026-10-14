# Builder Kickstarter — quick-flags QF-P1 (rebuild under the reshaped spec)

You are the Builder for QF-P1, rebuilding `plugins/foreman-line/docs/QUICK-FLAGS.md` against the **reshaped** spec `plugins/foreman-line/docs/specs/active/QF-P1-quick-flags-registry.md` (status active; coordinator-linted; OQ-1..OQ-3 ruled). Gate 1 was re-opened and ratified on 2026-10-13 for D5/D9/D2 (`plugins/foreman-line/docs/goals/quick-flags/gate1-reopen-d5-d9-2026-10-13.md`). The existing 596-line registry was built for the superseded stored-grant design; reuse its text only where it survives, and delete the rest. Target: at most 350 lines.

**Build base (AC-24):** `521f774a`, the `qf-p1` HEAD at this dispatch. Record it in your completion claim.
**Dispatch:** Gate 2 granted (loop-directive standing authorization 1). Direct invocation per loop-directive ruling 2026-10-13, no route receipt. Frontier. State your model in Step 0. Standing constraints apply (`plugins/foreman-line/docs/kickstarters/STANDING-CONSTRAINTS.md`).

**History you must not repeat:** three review rounds on the previous design found HIGH defects in the machinery earlier reworks added, and two builder completion claims said "every instance swept" and were falsified. This rebuild is a **simplification**: prefer deletion; every sentence must trace to an AC; when you sweep a pattern, grep the whole file, including every entry's Conflicts line, and prove it with a post-edit grep. Review triages are in `plugins/foreman-line/docs/goals/quick-flags/` (round 1–3 `qf-p1-review-triage-*`); the spec's ACs cite the finding IDs they carry.

## Where you work
Worktree `/home/cmorgan76/Repos/agent-skills-qf-p1`, branch `qf-p1`. Write ONLY `plugins/foreman-line/docs/QUICK-FLAGS.md`. Never run git add/commit/push/checkout/reset; read-only git is fine. You have a shell and write. Use a script that refuses to apply an edit unless its old string matches exactly once (a previous run had an edit tool fuzzy-match replace a sentence).

## Step 0 — restate and STOP (mandatory)
1. Name your model; confirm direct invocation under the ruling and the build base above.
2. Restate the parcel; give your section outline with the line budget per section (total <= 350), and map each of AC-1..AC-24 and V1..V7 to a section.
3. Flag every spec ambiguity, contradiction with canon or between ACs, or gap, each with a recommendation. A real gap needs a ratified amendment; never resolve one silently.
4. List what you will delete from the current file, grouped by retired mechanism.
5. State how you will run the spec's Verification Plan and the tripwire (retired-term grep = 0, wc -l <= 350, labels, 55 conflict rows plus the OBS rule, V1–V7, term rule, diff --check).
6. STOP and wait for rulings.

## After rulings
Build. Completion claim: a table mapping every AC and V-string to file:line evidence, every Verification Plan command with its actual output, the build base, and a list of every addition not required by an AC (each justified). Wrong-shaped claims are presumptively empty.
