---
ticket: EVAL-1
title: Eval coverage green gate (Tier-2 trigger and routing)
status: draft
owner: clinton.morgan
created: 2026-09-16
updated: 2026-09-16
supersedes: null
risk: standard
surfaces:
  - evals/cases/
  - skills/debugging-and-error-recovery/SKILL.md
  - skills/spec-driven-development/SKILL.md
  - skills/test-driven-development/SKILL.md
routing_class: standard-feature
data_classification: internal
---

# EVAL-1 — Eval coverage green gate (Tier-2 trigger and routing)

Standalone repo-hygiene parcel. No goal owns the catalog evals (goals INDEX names
no eval owner; `git grep EVAL-` over active/done/goals is empty, so `EVAL-1` is free).
Shaping baseline: `origin/main` at `4d6407e8f5ff8829c13a55fdcbc3a020f30bce13`
(worktree `D:/Repos/agent-skills-worktrees/eval-coverage-shaping-20260916`,
branch `codex/eval-coverage-shaping-20260916`). Shaping is docs-only; no product
files were changed in this worktree beyond the two shaping artifacts.

## Intent

Turn the CI gate `node scripts/run-evals.js --min-rank1 80` (workflow "Validate
skill content", Tier 2 deterministic) from 11 errors to zero: author the 8 missing
case files meeting `MIN_POSITIVE 3` / `MIN_NEGATIVE 2` / `MIN_EVALS 1` plus schema,
and retune the 3 failing descriptions so their positive prompts rank top-3, while
holding rank-1 at or above 80% (shaping-time baseline 86%, 76/88) with zero new
collisions. Its consumers are the EVAL-1 builder, the adversarial reviewer, and the
coordinator verifying the 11-to-0 error-list diff.

## Constraints

1. **Truthful descriptions only.** Retunes must describe what the skill body actually
   does. No keyword stuffing that misrepresents the skill to satisfy the lexical
   scorer. A Tier-2 failure that can only be fixed by misrepresentation is a
   stop-and-report, not a wording exercise.
2. **Scoring model is lexical, not semantic** (`scripts/run-evals.js` tiny pipeline:
   lowercase, strip non-alphanumerics, split on whitespace/hyphens, drop tokens of
   length <= 2 and the STOP set, light suffix-stemming, then stemmed TF-IDF cosine
   over skill descriptions with name tokens weighted 2x). Edits add user vocabulary
   the description genuinely lacks; they do not game the stemmer.
3. **New case files follow the contract** (`evals/README.md` case-file shape, proven
   by `evals/cases/debugging-and-error-recovery.json`): `skill_name` matching the
   filename, `trigger.positive[]` with `top_k` (default 3), `trigger.negative[]`
   with `owner` naming a real skill that must outrank this one (pairwise routing
   test, not vacuous), `evals[]` in skill-creator shape (`id`, `prompt`,
   `expected_output`, `expectations[]`, optional `kind` defaulting to `execution`,
   `files[]` required for execution). Minimums per file: 3 positive, 2 negative,
   1 behavioral.
4. **Negatives owned by real skills.** Every `trigger.negative[].owner` must name an
   existing skill directory; the runner asserts the owner outranks this skill.
5. **No fixture authority in this parcel.** All 8 new behavioral evals use
   `kind: "dialogue"` (transcript is the artifact, no `files[]` needed) with a
   one-line justification that the skill's deliverable is genuinely conversational
   or assessment-shaped, or the builder stops for a coordinator-ratified amendment
   adding exact `evals/fixtures/<name>/...` paths. No fixture files are created
   under the current Allowed Files.
6. **Tier 3 `--behavioral` is explicitly OUT.** It spends tokens and never runs in
   CI. The builder must not run it; verification is the exact Tier-2 CI command.
7. **No CI workflow edits.** The gate already exists (`.github/`); this parcel only
   makes the tree pass it. Skill renames are likewise out of scope.
8. **Collision discipline.** Pairwise description cosine must stay below
   `COLLISION_ERROR 0.75` (warn at `COLLISION_WARN 0.5`). Shaping-time run shows
   0 warnings; the parcel must not add warnings above baseline without coordinator
   review, and any new `>= ERROR` similarity is a stop.

## Acceptance Criteria

- [ ] `node scripts/run-evals.js --min-rank1 80` exits 0 on the parcel worktree.
- [ ] All 8 new files exist and pass schema + minimums: `evals/cases/accomplish.json`,
      `get-app-specs.json`, `go-live-readiness.json`, `initiative-coordination.json`,
      `modernize.json`, `modernizer.json`, `parcel-compiler.json`,
      `security-review.json` (names verified against `skills/<name>/SKILL.md`
      frontmatter `name:` at shaping time).
- [ ] The 3 miss prompts rank top-3 for their skill (shaping-time misses for reference):
      `debugging-and-error-recovery` "This test passed yesterday and fails today,
      figure out what broke" (was #4; outranked by constraint-driven-development,
      test-driven-development, interview-me); `spec-driven-development` "Draft a PRD
      with objectives and boundaries for this project" (was #5; outranked by
      initiative-coordination, api-and-interface-design, accomplish);
      `test-driven-development` "Implement the streak calculator using
      red-green-refactor" (was #5; outranked by using-agent-skills,
      code-simplification, parcel-compiler).
- [ ] Per-skill: every positive prompt ranks within its `top_k`, every negative
      prompt does not rank #1 and its declared owner outranks this skill.
- [ ] Collision check clean: zero errors; warnings at or below shaping baseline (0).
- [ ] Trigger rank-1 ratchet holds at or above 80% (baseline 86%).
- [ ] `git diff --check` is clean and `git diff --name-only` is a subset of Allowed Files.

## Out of Scope

- Behavioral Tier-3 execution (`--behavioral`, executor/grader runs, fixtures,
  `evals/results/`). Never in CI; token cost is not authorized here.
- CI workflow changes (`.github/` "Validate skill content" definition, thresholds,
  ratchet floor). The floor stays `--min-rank1 80`; never lower it to pass.
- Skill renames, skill merges/splits, description rewrites beyond the 3 named
  skills, and new-skills additions. Only the 11 Allowed Files change.
- Fixture authoring under `evals/fixtures/` (requires a separate amendment).
- Spec lifecycle moves (this draft stays `status: draft` in `active/` until
  coordinator lint and a human Gate-2 decision).

## Context & References

- Runner: `scripts/run-evals.js` (constants `MIN_POSITIVE 3`, `MIN_NEGATIVE 2`,
  `MIN_EVALS 1`; `COLLISION_WARN 0.5`, `COLLISION_ERROR 0.75`; text pipeline and
  `rankSkills` as in Constraints).
- Contract: `evals/README.md` (tiers, case-file shape, trigger-writing guidance,
  metrics; known gaps tracked in issue #351).
- Shape precedent: `evals/cases/debugging-and-error-recovery.json`.
- Convention: `plugins/foreman-line/docs/SPEC-CONVENTION.md` (§3 lifecycle, §4
  schema incl. `Allowed Files` exact-path authority, §8 dispatch).
- Shaping error reproduction (2026-09-16, `origin/main` `4d6407e`): "Running skill
  evals across 33 skills, 25 case files / 137 checks passed — 11 error(s),
  0 warning(s) / trigger rank-1 rate: 86% (76/88) / FAILED", with the 8
  no-case-file errors plus the 3 rank misses detailed above.

## Verification Plan

The coordinator (never the builder) runs the exact CI command on the parcel
worktree and diffs the error list 11 to 0:

1. `node scripts/run-evals.js --min-rank1 80` — expect exit 0, `PASSED`.
2. Confirm each of the 11 shaping-time error lines is gone individually (8 coverage
   lines, 3 rank-miss lines with prompt text), not merely a lower total.
3. Confirm rank-1 rate line reads at or above 80% and collision output shows no
   `collision:` error lines.
4. `git diff --check` clean; `git diff --name-only` subset of Allowed Files.

### Mandated reviewer focus questions

1. **Does any retuned description claim vocabulary or capability its skill body does
   not support?** Read the three SKILL.md bodies against their new descriptions
   line by line; is every added trigger term grounded in the skill's real When-to-Use?
2. **Are the new trigger prompts genuine user paraphrases, or description echoes?**
   (`evals/README.md`: paraphrase how users talk; copying the description is gaming
   the eval.) Would a user who never read the description plausibly say this?
3. **Is any negative vacuous or mis-owned?** For each new negative, does the owner
   plausibly own that ask, and does the owner genuinely outrank on substance rather
   than on shared stopwords?
4. **Is `kind: "dialogue"` honestly justified for each new behavioral eval, or is it
   an escape hatch for an execution skill?** Which expectation could only be graded
   from files, and if any, why was no fixture amendment requested?
5. **Did any description edit drift two skills toward each other?** Check the
   highest-similarity pairs involving edited or neighboring skills (modernize vs
   modernizer, go-live-readiness vs initiative-coordination) for new overlap.

## Allowed Files

Only these exact repo-relative paths may be created or changed for EVAL-1:

- `evals/cases/accomplish.json`
- `evals/cases/get-app-specs.json`
- `evals/cases/go-live-readiness.json`
- `evals/cases/initiative-coordination.json`
- `evals/cases/modernize.json`
- `evals/cases/modernizer.json`
- `evals/cases/parcel-compiler.json`
- `evals/cases/security-review.json`
- `skills/debugging-and-error-recovery/SKILL.md`
- `skills/spec-driven-development/SKILL.md`
- `skills/test-driven-development/SKILL.md`

No glob, directory shorthand, fixture, workflow, or spec-linter path is mutation
authority. Any required path outside this list stops work until the coordinator
ratifies a spec amendment.

## Stop-and-Report Rules

Stop without widening scope if any of these fires; preserve the partial diff and
return control to the coordinator:

- a description change that would misrepresent its skill is the only way to make a
  prompt rank;
- any new pairwise description similarity at or above `COLLISION_ERROR 0.75`;
- the rank-1 rate drops below 80%, or a fix for one skill's rank breaks another's;
- any demand (human, reviewer, or tool) to run token-spending Tier-3 `--behavioral`
  work inside this parcel;
- a required fixture, workflow edit, skill rename, or any path outside Allowed
  Files becomes necessary;
- the base has drifted (`origin/main` moved past shaping HEAD `4d6407e`) in a way
  that changes the error list.
