# Builder dispatch — CFF-H1 hotfix: READER_SET goal-doc couplings (merge-gate hole)

**Authority:** developer ratification 2026-10-08 ("ratify Q1") of the
coordinator's hotfix recommendation after the CFF-P0 reviews confirmed a LIVE
merge-gate hole (triage: `cff-p0-review-triage-2026-10-08.md`, escalation E1;
charter stop condition "relevance coverage incomplete for a package class"
fired). Single reviewer; **unbatched human Gate 3** — the batching cadence is
explicitly suspended for this hotfix (gate integrity). This document plus the
pinned context below IS the spec (micro-parcel; coordinator-drafted under the
developer-ratified scope: "add the 5 paths to READER_SET + a regression test,
single reviewer").
**Role:** builder. Not the coordinator, not a reviewer, not the owner.
**Model policy (2026-10-08, standing):** `anthropic/claude-opus-5-5`.

## The defect (measured, not asserted)

`plugins/foreman-line/ops-console/tests/live-goal.test.ts` reads
`docs/goals/w4-closeout/{charter.md,loop-directive.md}`;
`plugins/foreman-line/routing-policy/tests/{host-settings-proposal,legacy-cutover}.test.ts`
read `docs/goals/pi-model-configuration/{charter.md,pmc-p1-fallback-contract-2026-09-26.md,a54-ratification-2026-09-26.md}`
(reproduced from source and by live measurement, run `37768165017`). All five
paths classify `ordinary_documentation` and none are in `READER_SET`
(coordinator-verified 2026-10-08). A docs-only PR touching only those paths
can reuse stale CI evidence and skip the `ops-console`/`routing-policy`
checks that read them — a live reuse-gate hole on `main`.

## Pinned execution context — verify before anything else

| # | Gate | Required value |
|---|---|---|
| G1 | Worktree | `/home/cmorgan76/Repos/agent-skills-cff-h1` — create it: `cd /home/cmorgan76/Repos/agent-skills && git worktree add /home/cmorgan76/Repos/agent-skills-cff-h1 -b fix/cff-h1-reader-set-goal-docs main` |
| G2 | Branch | `fix/cff-h1-reader-set-goal-docs`, from `main` (`dab6967e`) — the hole is live on main; this hotfix does not ride the goal's parcel branches |
| G3 | Semantics anchor | `scripts/ci-reuse.mjs`: `READER_SET` :129 (25 entries, frozen), `inReaderSet` (:157: exact match, or prefix match for entries ending `/`), `classifyPath` :175 (reader-set membership → `CLASS.CODE` before any ordinary rule — "measured readers fall to `code`… (safe direction)") |
| G4 | Worktree state | clean after creation |

If anything fails a gate: **stop and report**.

## Step 0 — restate and STOP

(1) Restate the Allowed Files; (2) eleven-words-or-less on the fix; (3)
confirm G1–G4. Then **stop for the coordinator's ruling**.

## Allowed Files

- `scripts/ci-reuse.mjs`
- `scripts/ci-reuse.test.mjs`

Nothing else. No fixtures, no docs, no workflow.

## Build contract

1. **Add exactly five entries** to `READER_SET` (the measured paths — exact
   file form, no prefix forms; measured discipline pins what was measured):
   - `plugins/foreman-line/docs/goals/w4-closeout/charter.md`
   - `plugins/foreman-line/docs/goals/w4-closeout/loop-directive.md`
   - `plugins/foreman-line/docs/goals/pi-model-configuration/charter.md`
   - `plugins/foreman-line/docs/goals/pi-model-configuration/pmc-p1-fallback-contract-2026-09-26.md`
   - `plugins/foreman-line/docs/goals/pi-model-configuration/a54-ratification-2026-09-26.md`
   Keep the array sorted as the existing entries are; add a one-line comment
   citing `cff-p0-review-triage-2026-10-08.md` E1.
2. **Regression test** in `scripts/ci-reuse.test.mjs`: each of the five paths
   classifies `code` (never `ordinary_documentation`); a mutate-the-fixture
   assertion (standing constraint #11): with any one entry removed from a
   test-local readers list, that path flips to `ordinary_documentation` —
   proving the test binds the membership, not the classifier alone.
3. **Full suite:** `node --test scripts/ci-reuse.test.mjs
   scripts/foreman-line-ci.test.mjs` — record counts before/after. Any
   pre-existing test that expects `ordinary_documentation` for these five
   paths is a **stop-and-report** (flag), not a silent edit. Any evidence-hash
   compatibility concern (classification changes class hashes; historical
   reuse evidence becomes incompatible → falls back to normal validation —
   the safe direction per the charter invariants) is **named in the
   completion claim**, not resolved by you.
4. Commit conventional-commit subjects, no trailers; stop after the build.
   Single reviewer is coordinator-dispatched; Gate 3 is human, unbatched.

## Hard stops

Any sixth path or a prefix-form entry (scope is the measured five) · any
classifier-logic change (membership only) · any test weakened to pass · any
write outside Allowed Files · any push (the coordinator pushes; the human
merges).

## Completion claim (the coordinator verifies on disk)

HEAD start/end; test counts before/after; the five classification outputs;
the mutation probe's expected-vs-observed; the compatibility note. Every
claim carries evidence.
