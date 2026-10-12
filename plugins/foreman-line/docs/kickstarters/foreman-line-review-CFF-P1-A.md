You are Reviewer A, one of TWO required independent adversarial reviewers for
parcel CFF-P1 (change-proximity ordering and early-red signal) of the goal
`ci-fail-fast` — `risk: critical`, `routing_class: architecture/risk`. You have
zero shared context with Reviewer B — do not coordinate, do not read their
findings, do not assume they exist. **Model policy (2026-10-08, standing):
this review runs on `anthropic/claude-opus-5-5`.** Reviewers never fix, never
commit to the parcel branch.

**Your angle: VERDICT INTEGRITY AND THE WAIVER CHANNEL.** You lead mandated
focus questions 1, 3, 5, 7 (below). Reviewer B leads 2, 4, 6. Answer ALL SEVEN
— the overlap is deliberate (lesson #12).

**Setup (do it yourself, from the main repo):**
```
cd /home/cmorgan76/Repos/agent-skills
git worktree add /home/cmorgan76/Repos/foreman-line-cff-p1-review-a feat/foreman-line-CFF-P1 --detach
```
Review the tip (`73f9f624` at kickstarter authoring; the deliverable commits
run `665b03bc..f953ecd3`, the top commit is the coordinator's docs-only
Amendment CFF-P1-A1 — verify with `git log --oneline f953ecd3..HEAD` and treat
any non-docs commit there as stop-and-report). Verify `git rev-parse HEAD`,
record it. Do not commit to this worktree; throwaway probe worktrees/scratch
under `/tmp` are yours.

## Step 0 — restate, then begin

Read in full: the spec
`plugins/foreman-line/docs/specs/active/CFF-P1-change-proximity-ordering-and-early-red.md`
(including **Amendment CFF-P1-A1** in AC2 and the seven mandated focus
questions in the Verification Plan), the completion record
`plugins/foreman-line/docs/goals/ci-fail-fast/cff-p1-completion-record-2026-10-08.md`,
and the charter's D3/D6/D7/D8/D10/D11
(`plugins/foreman-line/docs/goals/ci-fail-fast/charter.md`). Restate the seven
focus questions in your own words, then begin.

Run the deterministic tier yourself first: `node --test
scripts/foreman-line-ci.test.mjs scripts/ci-reuse.test.mjs` (expect 367/367;
the base at `41b927de` gives 296 — the +71 delta is all new AC tests, claimed;
spot-check the claim).

## The seven mandated focus questions (from the spec's Verification Plan)

1. **Can ordering ever become a waiver bypass channel?** (You lead.) Attempt
   the naive reading: reorder so a proximate package's failure output could
   leak into, precede, or influence a later package's `evaluateWaiver` call.
   Audit every code path that reads one package's `output` while evaluating
   another's waiver. AC7's per-package-capture tests must exclude it — verify
   they actually bind (mutate the fixture, standing constraint #11).
2. Does the D7 pin ever get consumed to exclude, even indirectly?
3. **Does shard-early-exit genuinely never alter the verdict?** (You lead.)
   Force an early exit; confirm the partial artifact's `skipped` entries hit
   `reconcile`'s existing `unexpected-skip`/`missing-checks` with NO new
   lenient branch; confirm the upload ordering claim
   (`runCli` writes before the exit-code return) on disk.
4. Is the annotation surface genuinely free of raw captured text?
5. **Is the D11 diff seam truly the only diff source, and does it fail closed
   on every malformed-base case?** (You lead.) Enumerate: missing
   `GITHUB_EVENT_PATH`, unreadable file, unparseable JSON, null base, non-hex40,
   all-zeros — all must yield the fail-closed signal; grep for any second
   `git diff` in the touched files outside the one new export and the
   pre-existing `:835` verification use.
6. Does the cost-table re-pin's "deliberate, loud" framing survive a literal
   read of the completion report?
7. **Does the D3 conformance suite actually bind, not merely run green?**
   (You lead.) For each of AC7's six points, mutate the fixture along that
   point's dimension and confirm the test fails.

**Plus, your angle's deep probes:**
- **Amendment A1 conformance:** the built AC2 gate against the REAL artifact
  shape — feed it CFF-P0's actual in-review `read-graph.json` (on
  `feat/foreman-line-cff-p0`, read-only via `git show`). The completion
  record's F2 (consumer unions `packages[*]` + `affection_pin`) is now
  spec-pinned by A1: verify code matches the amended text, and that a
  packages-entry that is not a string array, or any exclusion-shaped field,
  flips the run to the malformed-pin fallback with the named reason.
- **The 1/1/13/15 flip (AC3):** re-run `assignShards` against the re-pinned
  `COST_TABLE` and verify the live assignment really is the deliberate
  cost-aware flip the record claims (8/8/7/7 → 1/1/13/15), and that both
  loudness states (three missing names pre-re-pin; `[]` post) are demonstrated
  with real output in the record, not asserted prose. The builder pinned
  UNSCALED values despite a self-reported 1.13× instrumentation inflation —
  rule on whether that conservative choice is documented well enough for a
  future re-measurement to detect the skew.
- **Test-count tripwire:** independently verify 296 at `41b927de` → 367 at tip
  (a scratch detached worktree + `node --test`), and that the four modified
  existing tests are exactly the four the record names, with justifications
  that hold.

Report findings to
`plugins/foreman-line/docs/goals/ci-fail-fast/cff-p1-review-a-findings-2026-10-08.md`
(write ONLY that file, in the MAIN checkout on branch
`chore/ci-fail-fast-charter`; do NOT git add/commit/push — the coordinator
handles the paper trail). Per focus question and probe: verdict (CONFIRMED /
REFUTED / PLAUSIBLE) with exact commands, outputs, exit codes. Explicitly
dispute any completion-claim statement you disagree with. Do not fix anything.
