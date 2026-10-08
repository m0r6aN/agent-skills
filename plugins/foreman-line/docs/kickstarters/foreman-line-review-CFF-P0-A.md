You are Reviewer A, one of TWO required independent adversarial reviewers for
parcel CFF-P0 (recon and baseline — including the D7 read-graph measured
capture, AC5) of the goal `ci-fail-fast`. You have zero shared context with
Reviewer B — do not coordinate, do not read their findings, do not assume they
exist. **Model policy (2026-10-08, standing): this review runs on
`anthropic/claude-opus-5-5`** (charter frontier mandate; reviewer model policy
"now and always, until it advances"). Reviewers never fix, never commit to the
parcel branch.

**Your angle: MEASUREMENT INTEGRITY AND PROVENANCE.** Reviewer B covers
contract/scope soundness. Overlap on the mandated focus questions is expected
and wanted (lesson #12); do not narrow yourself out of them.

**Setup (do it yourself, from the main repo — the coordinator has not done it
for you):**
```
cd /home/cmorgan76/Repos/agent-skills
git worktree add /home/cmorgan76/Repos/foreman-line-cff-p0-review-a feat/foreman-line-cff-p0 --detach
```
You are reviewing the tip of `feat/foreman-line-cff-p0` at dispatch. The
deliverable-carrying commits run through `500b8f54`; only docs-only
paper-trail commits (including the review kickstarters themselves) may sit on
top — verify that claim with `git log --oneline 500b8f54..HEAD` and treat any
non-docs commit there as a stop-and-report. The freeze audit covers the whole
diff. Verify `git rev-parse HEAD` in the review worktree and record it before
forming any opinion. Do not commit to this worktree; throwaway probe
worktrees/scratch under `/tmp` are yours to create and destroy.

## Step 0 — restate and stop

Before forming any opinion:
1. Read `plugins/foreman-line/docs/specs/active/CFF-P0-recon-and-baseline.md`
   in full — AC1–AC6, the Verification Plan, the five mandated focus questions.
2. Read `plugins/foreman-line/docs/goals/ci-fail-fast/charter.md` (D2, D6, D7,
   D10, R15) and the AC5 vehicle ruling recorded in
   `plugins/foreman-line/docs/goals/ci-fail-fast/loop-directive.md`
   (2026-10-08, "ratify as ruled").
3. Read the delivery under review:
   `plugins/foreman-line/docs/goals/ci-fail-fast/read-graph/measurement-log.md`,
   `read-graph.json`, `fixtures/ci-pass-raw.json`, and the addendum note in
   `cff-p0-c9-reproof.md`.
4. Restate back, in your own words: what the five mandated focus questions ask,
   and what "measurement, not reading" (lesson #46) forbids here. Then proceed
   — Step 0 for reviewers is restate-then-begin, not a hold.

## Your job (angle A)

Attack the measurement's right to be believed:

- **Vehicle compliance.** The ruling permitted exactly two files on a scratch
  branch (`measure/cff-p0-read-graph`), additive-only, the pinned workflow
  never touched. Verify from the run record: `gh run view 37768165017 -R
  m0r6aN/agent-skills` (headSha `2d81d926…`, conclusion success) and
  `gh run view 37764594545` (the shard-0 OOM run). Confirm the scratch branch
  is deleted (`git ls-remote origin measure/cff-p0-read-graph` → empty) and
  that the workflow file on the parcel branch differs from `main`'s by zero
  bytes. The log's claim that an unrelated hygiene commit (`8b49202a`) landed
  on the scratch branch pre-deletion: verify the SHA exists and touches only
  `docs/specs/**`.
- **Filter arithmetic.** 2,263,596 raw lines → install 569,622 + node_modules
  595,783 + external 992,153 + unattributed 1,704 + probe-self 314 = claimed
  exclusions; kept = 104,020 → 3,044 distinct pairs. Recompute the arithmetic
  from the fixture's `stats` block and the fixture itself (distinct
  (package, path) pairs from `fixtures/ci-pass-raw.json` — recount them).
  Anything that doesn't reconcile is a finding.
- **Host honesty.** Fingerprint claim: node v24.19.0 / win32 / x64, identical
  across 4 shard jobs, per-job job IDs recorded. Cross-check against the
  run's jobs (`gh run view --json jobs` / job logs where downloadable).
- **Focus question 3 is yours to lead:** prove (or break) that both
  projections (`reader_set_delta`, `affection_pin`) derive from the single
  capture — re-derive the affection pin from `fixtures/ci-pass-raw.json`
  (own-dir prefix split, case-insensitive) and diff against
  `read-graph.json`'s `projections.affection_pin`. Any edge in the pin not
  traceable to the fixture, or vice versa, is a finding.
- **Focus question 5 (reproducibility):** re-run every committed command in
  the measurement log's AC5.6 block at the recorded SHA; confirm the
  classification results (`code`/`code`/`ordinary_documentation`/
  `ordinary_documentation`) reproduce. Any number traceable only to an
  uncommitted one-off fails review.

Report findings to
`plugins/foreman-line/docs/goals/ci-fail-fast/cff-p0-review-a-findings-2026-10-08.md`
(write this file in the MAIN repo checkout on branch
`chore/ci-fail-fast-charter`, not the detached review worktree): per focus
question and per probe, verdict (CONFIRMED / REFUTED / PLAUSIBLE) with exact
commands, outputs, exit codes. If you dispute any part of the builder's
completion claim, say so explicitly with reproduction. Do not fix anything.
