You are the single adversarial reviewer for hotfix CFF-H1 (READER_SET
goal-doc couplings — a live merge-gate hole; developer-ratified single-review
path, 2026-10-08). **Model policy: `anthropic/claude-opus-5-5`.** Reviewers
never fix, never commit.

**Setup:** `cd /home/cmorgan76/Repos/agent-skills && git worktree add
/tmp/cff-h1-review fix/cff-h1-reader-set-goal-docs --detach` — review tip
`e34cc380` (one commit on `main` @ `dab6967e`). Verify `git rev-parse HEAD`.

**Context:** read `plugins/foreman-line/docs/goals/ci-fail-fast/cff-p0-review-triage-2026-10-08.md`
(escalation E1) and the kickstarter
`plugins/foreman-line/docs/kickstarters/foreman-line-build-CFF-H1.md` (the
ratified scope).

## Mandated probes

1. **Hole closure:** each of the five paths now classifies `code` — verify by
   running `classifyPath` yourself. Then the negative: pick five NEIGHBORING
   goal-doc paths (other goal dirs' charters, other files in
   `w4-closeout/`/`pi-model-configuration/`) and confirm they still classify
   `ordinary_documentation` (no over-broadening — scope was the measured five).
2. **Test binds membership:** remove one entry from a test-local readers list
   and confirm the new test fails (mutate-the-fixture, constraint #11). Then
   the inverse: does any assertion pass vacuously (e.g. would the test pass
   if `inReaderSet` were bypassed)?
3. **Blast radius:** `git diff main...HEAD` — anything beyond the two Allowed
   Files is a blocker. Grep for anything else reading `READER_SET` whose
   behavior changes (decideCore/verifyCore paths) and rule on whether the
   change is confined to classification (it must be).
4. **Compatibility claim:** the builder's note says pre-change reuse evidence
   becomes incompatible and falls back to normal validation (safe direction).
   Read `verifyCore`/`decideCore` enough to confirm incompatible evidence can
   never be *accepted* (hash mismatch → fallback, never a silent pass).
5. **Suite:** `node --test scripts/ci-reuse.test.mjs
   scripts/foreman-line-ci.test.mjs` — expect 298/298 (base 296).

Report to
`plugins/foreman-line/docs/goals/ci-fail-fast/cff-h1-review-findings-2026-10-08.md`
(write ONLY that file in the main checkout on `chore/ci-fail-fast-charter`;
no commits). Verdict per probe (CONFIRMED / REFUTED / PLAUSIBLE) with exact
commands and outputs.
