# Builder dispatch — dev-drop reducer amendment (CFF-P0 review finding A-F1/F2)

**Authority:** CFF-P0 review triage 2026-10-08
(`cff-p0-review-triage-2026-10-08.md`, items 1–2). Reviewer A proved from the
retained raw capture (run `37768165017`, pid 9544) that the install-phase
filter drops the scored `ci` check's cross-package manifest reads — the pin
misses real coupling (unsafe direction for CFF-P2). And the primary
reduction was never reproducible (script uncommitted; prose-only filters).
This task amends the ONE canonical reducer; CFF-P0's rework R1 then
re-derives the primary fixture with it.
**Role:** builder. **Model policy:** `anthropic/claude-opus-5-5`.

## Pinned execution context — verify before anything else

| # | Gate | Required value |
|---|---|---|
| G1 | Worktree | `/home/cmorgan76/Repos/agent-skills-cff-reducer` — create: `cd /home/cmorgan76/Repos/agent-skills && git worktree add /home/cmorgan76/Repos/agent-skills-cff-reducer -b chore/cff-p0-reducer-amend chore/ci-fail-fast-charter` |
| G2 | Branch | `chore/cff-p0-reducer-amend` from the charter tip (expect `43c9bf8e` or a docs-only paper-trail descendant — verify with `git log --oneline 43c9bf8e..HEAD`) |
| G3 | Subject | `plugins/foreman-line/docs/goals/ci-fail-fast/read-graph/dev-drop/capture-dev-pass.mjs` — the merged dev-drop reducer (561 lines at merge) |
| G4 | Worktree state | clean after creation |

## Step 0 — restate and STOP

Restate Allowed Files, the two changes (below), G1–G4. Stop for the ruling.

## Allowed Files

- `plugins/foreman-line/docs/goals/ci-fail-fast/read-graph/dev-drop/capture-dev-pass.mjs`
- `plugins/foreman-line/docs/goals/ci-fail-fast/read-graph/dev-drop/README.md`

## The two changes

1. **Filter amendment (A-F1).** The install-phase exclusion (argv1 = npm-cli
   bootstrap) currently drops ALL npm-process reads. Amend: within
   install-phase records, reads of **repo-tracked `package.json` paths** are
   KEPT as edges of the package whose `ci` check performed them (attribution
   by the reading process's cwd, as today). All other install-phase records
   stay excluded. This is measured per package — never assume universality;
   the `reduction_diagnostics` block gains a count of kept ci-manifest
   edges per package so the measurement is auditable. If the measurement
   shows the coupling IS near-universal (most packages read most manifests),
   that is a finding to report — do not invent a compact schema field;
   the coordinator rules on representation.
2. **Reproducibility proof (A-F2).** Add `--verify-primary <raw-capture-dir>`:
   reduce the retained primary raw capture (run `37768165017`'s four
   `read-graph-raw-capture-shard-*` dirs — if `/tmp/cffrev-a/run2` is gone,
   re-download: `gh run download 37768165017 -R m0r6aN/agent-skills` into a
   `/tmp` scratch) under the PRE-AMENDMENT filter set and diff against the
   committed primary fixture (`git show
   feat/foreman-line-cff-p0:plugins/foreman-line/docs/goals/ci-fail-fast/read-graph/fixtures/ci-pass-raw.json`).
   The goal is byte-level pair-set equality (3,044 pairs). Where the original
   prose filters are ambiguous (Reviewer A needed three undocumented steps:
   `file:///` URL decoding, a `node_modules` trailing-separator rule,
   own-root counting), implement what the committed fixture proves, and
   document every interpretation in `filter_methodology` — the prose and the
   code must reconcile exactly. Report: equality achieved or the exact
   divergent buckets with counts.

**Constraints:** streaming reduction preserved (the shard-0 OOM lesson);
Windows/Linux correctness preserved; the reducer remains the ONLY reduction
path (no forks); README's methodology section updated to the amended filters.
No fixture re-derivation in THIS task (that is P0 rework R1's, on the parcel
branch, using your amended reducer).

## Hard stops

Any write outside Allowed Files · weakening the reduction to force equality
(matching by dropping real edges is a finding, not a fix) · pushing · any
commit off the scratch branch.

## Completion claim

HEAD start/end; the `--verify-primary` equality result (or exact divergence
report); diagnostics samples; what you could not verify. Commit conventional
subjects; stop. Merge to the charter branch is the coordinator's act.
