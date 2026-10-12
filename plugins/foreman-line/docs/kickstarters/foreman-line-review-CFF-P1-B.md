You are Reviewer B, one of TWO required independent adversarial reviewers for
parcel CFF-P1 (change-proximity ordering and early-red signal) of the goal
`ci-fail-fast` — `risk: critical`, `routing_class: architecture/risk`. You have
zero shared context with Reviewer A — do not coordinate, do not read their
findings, do not assume they exist. **Model policy (2026-10-08, standing):
this review runs on `anthropic/claude-opus-5-5`.** Reviewers never fix, never
commit to the parcel branch.

**Your angle: PIN CONSUMPTION AND HOSTILE INPUT.** You lead mandated focus
questions 2, 4, 6 (below). Reviewer A leads 1, 3, 5, 7. Answer ALL SEVEN — the
overlap is deliberate (lesson #12).

**Setup (do it yourself, from the main repo):**
```
cd /home/cmorgan76/Repos/agent-skills
git worktree add /home/cmorgan76/Repos/foreman-line-cff-p1-review-b feat/foreman-line-CFF-P1 --detach
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
scripts/foreman-line-ci.test.mjs scripts/ci-reuse.test.mjs` (expect 367/367).

## The seven mandated focus questions (from the spec's Verification Plan)

1. Can ordering ever become a waiver bypass channel?
2. **Does the D7 pin ever get consumed to exclude, even indirectly?** (You
   lead.) Audit EVERY read of the parsed pin in the diff. Look for the
   "optimization" that skips re-checking a confidently-non-proximate package,
   a partition that drops members, a short-circuit that treats absence-of-edge
   as absence-of-coupling. AC1/AC2's "ordering never excludes" must survive
   adversarial reading: construct the proof or the counterexample. Pay special
   attention to the Amendment-A1 union semantics (`packages[name]` ∪
   `affection_pin[name]` ∪ variance edges) — is there any input where the
   union computation itself drops a package from the execution set?
3. Does shard-early-exit genuinely never alter the verdict?
4. **Is the annotation surface genuinely free of raw captured text?** (You
   lead.) Hostile-input probing licensed and expected: package names or check
   names containing `::`, newlines, control chars, bidi overrides, very long
   strings; a waiver-rejection layer string crafted to smuggle content. Try to
   forge a `::error`/`::warning` sequence from untrusted data. Confirm
   `sanitizeField`'s neutralizations hold for every interpolated field and
   that captured `output` never reaches an annotation field — read the data
   flow, then break it in a fixture.
5. Is the D11 diff seam truly the only diff source, and does it fail closed on
   every malformed-base case?
6. **Does the cost-table re-pin's "deliberate, loud" framing survive a literal
   read?** (You lead.) Reproduce both loudness states yourself from the code
   (the artifact field and the step-summary line), verify the three new
   COST_TABLE values trace to the named capture-of-record run, and probe: what
   happens when discovery grows a 31st package — is the field still loud?
7. Does the D3 conformance suite actually bind, not merely run green?

**Plus, your angle's deep probes:**
- **Fail-closed matrix completeness (AC2):** the spec names missing file /
  malformed schema / exclusion-shaped field / thrown error. Try the unnamed
  cases: valid JSON that is not an object; `packages` present but empty; a
  package in the shard list absent from `packages`; a variance edge naming an
  undiscovered package; a 200MB pin file; a pin with duplicate-ish paths and
  case-variant separators (Windows backslashes vs the D11 seam's
  forward-slash `parseNameStatusZ` output — **case/separator normalization is
  a named suspicion**: the measured pin's paths were captured on Windows;
  check what the consumer does about it and whether a case mismatch silently
  degrades to never-proximate — safe — or is claimed to match — wrong).
- **Early-red hostile cases:** a failure in the LAST package of `mine`; a
  waived-then-fail sequence; an install-phase (phase-1) failure (must NOT
  early-exit — phase 1 is untouched); `EXPECTED_SKIPS` empty means the
  partial artifact always reconciles red — prove the required `test` context
  still reaches a terminal state on every path.
- **Freeze audit:** `git diff main...HEAD --stat` — any byte outside the six
  Allowed Files + the two named goal-dir records is a blocker. (Note: the
  local `main` ref may be stale; use `origin/main` after `git fetch` and
  account for already-merged PRs landing in the diff base.)

Report findings to
`plugins/foreman-line/docs/goals/ci-fail-fast/cff-p1-review-b-findings-2026-10-08.md`
(write ONLY that file, in the MAIN checkout on branch
`chore/ci-fail-fast-charter`; do NOT git add/commit/push — the coordinator
handles the paper trail). Per focus question and probe: verdict (CONFIRMED /
REFUTED / PLAUSIBLE) with exact commands, outputs, exit codes. Explicitly
dispute any completion-claim statement you disagree with. Do not fix anything.
