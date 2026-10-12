You are Reviewer B, one of TWO required independent adversarial reviewers for
parcel CFF-P0 (recon and baseline — including the D7 read-graph measured
capture, AC5) of the goal `ci-fail-fast`. You have zero shared context with
Reviewer A — do not coordinate, do not read their findings, do not assume they
exist. **Model policy (2026-10-08, standing): this review runs on
`anthropic/claude-opus-5-5`** (charter frontier mandate; reviewer model policy
"now and always, until it advances"). Reviewers never fix, never commit to the
parcel branch.

**Your angle: CONTRACT SOUNDNESS AND SCOPE PURITY.** Reviewer A covers
measurement integrity/provenance. Overlap on the mandated focus questions is
expected and wanted (lesson #12); do not narrow yourself out of them.

**Setup (do it yourself, from the main repo — the coordinator has not done it
for you):**
```
cd /home/cmorgan76/Repos/agent-skills
git worktree add /home/cmorgan76/Repos/foreman-line-cff-p0-review-b feat/foreman-line-cff-p0 --detach
```
You are reviewing the tip of `feat/foreman-line-cff-p0` at dispatch. The
deliverable-carrying commits run through `500b8f54`; only docs-only
paper-trail commits (including the review kickstarters themselves) may sit on
top — verify that claim with `git log --oneline 500b8f54..HEAD` and treat any
non-docs commit there as a stop-and-report. The freeze audit covers the whole
diff. Verify `git rev-parse HEAD` in the review worktree and record it before
forming any opinion. Do not commit to
this worktree; throwaway probe worktrees/scratch under `/tmp` are yours.

## Step 0 — restate and stop

Before forming any opinion:
1. Read `plugins/foreman-line/docs/specs/active/CFF-P0-recon-and-baseline.md`
   in full — AC1–AC6, the Verification Plan, the five mandated focus questions.
2. Read `plugins/foreman-line/docs/goals/ci-fail-fast/charter.md` (D2, D3, D6,
   D7, D10) and
   `plugins/foreman-line/docs/goals/ci-fail-fast/plan-review-triage-2026-10-07.md`.
3. Read the delivery under review: all `cff-p0-*.md` records plus
   `read-graph/read-graph.json`, `read-graph/fixtures/ci-pass-raw.json`,
   `read-graph/measurement-log.md`.
4. Restate back, in your own words: the five mandated focus questions and what
   exclusion-by-absence would look like if it existed. Then proceed — Step 0
   for reviewers is restate-then-begin, not a hold.

## Your job (angle B)

Attack the artifact's contract and the parcel's scope discipline:

- **Focus question 1 is yours to lead — exclusion-by-absence.** Read
  `read-graph.json`'s schema top to bottom. Prove structurally (not from
  prose) that no field can express "this package is NOT affected" — mutate
  the artifact in a probe copy: inject an `excludes`-shaped field, remove a
  proven edge, flip a variance edge to exclusion semantics. Confirm CFF-P1's
  draft consumption contract
  (`docs/specs/active/CFF-P1-change-proximity-ordering-and-early-red.md` AC2,
  on branch `feat/foreman-line-CFF-P1` — read-only reference) treats every
  one of those as malformed/fail-closed. If any reading lets absence exclude,
  that is a blocker.
- **Focus question 2 — reading vs measurement (#46).** Audit every coverage
  and timing claim in the parcel's records: which rest on the measured
  capture (legitimate), which rest on static grep (legitimate only where the
  spec scopes them as static re-proof), and whether any static claim wears
  measured clothing. The `cff-p0-c9-reproof.md` addendum correcting its own
  earlier ops-console conclusion is the honest pattern — check whether every
  other static claim that the measurement contradicts or extends got the same
  treatment.
- **Focus question 4 — install purity.** Grep the parcel diff
  (`git diff main...HEAD --stat`): any byte under `scripts/**`,
  `.github/**`, or package source is a blocker (Allowed Files violation).
  Then the harder probe: does any *prose* invite a future reader to treat
  P0's records as installed behavior (e.g. the `reader_set_delta` finding
  phrased so a later parcel might skip its own ratification)?
- **`reader_set_delta` correctness.** The five named paths are claimed to
  classify `ordinary_documentation` while being read by
  `ops-console`/`routing-policy` tests. Reproduce each from source (the log
  cites test files and lines — open them) and re-run `classifyPath` on each
  path. Then probe the routing claim: D10 routes the `READER_SET` edit to the
  runner-touching parcel's Stage-F bookkeeping — confirm the charter actually
  says that and that this parcel installing nothing is compliant, not
  derelict.
- **Waiver contract records (D3 anchor).** `cff-p0-waiver-input-contract.md`
  §3's order-independence claim and `cff-p0-assignment-and-waivers.md`'s four
  dead-waiver identities: re-derive from `scripts/foreman-line-ci.mjs`
  (`WAIVED_EXCLUSIONS` :517, `evaluateWaiver` :697) at the recorded SHA. These
  records are CFF-P1's load-bearing anchor — any error here propagates.

Report findings to
`plugins/foreman-line/docs/goals/ci-fail-fast/cff-p0-review-b-findings-2026-10-08.md`
(write this file in the MAIN repo checkout on branch
`chore/ci-fail-fast-charter`, not the detached review worktree): per focus
question and per probe, verdict (CONFIRMED / REFUTED / PLAUSIBLE) with exact
commands, outputs, exit codes. If you dispute any part of the builder's
completion claim, say so explicitly with reproduction. Do not fix anything.
