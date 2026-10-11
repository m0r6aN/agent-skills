# CFF-H1 — single adversarial review findings (2026-10-08)

**Reviewer:** `cff_h1_review` (single reviewer, developer-ratified single-review path)
**Directive:** `plugins/foreman-line/docs/kickstarters/foreman-line-review-CFF-H1.md`
**Spec:** `plugins/foreman-line/docs/kickstarters/foreman-line-build-CFF-H1.md` (+ triage E1, `cff-p0-review-triage-2026-10-08.md`)
**Review worktree:** `/tmp/cff-h1-review`, detached at `e34cc3803abaf95354182a99ae86d994cd952093` (`git rev-parse HEAD`), one commit on `main` @ `dab6967e46924b098abb7e8c7324cfcb85061c3f`.
**Discipline:** no fixes, no commits, no pushes. Mutation probes ran in a throwaway copy (`/tmp/cff-h1-mut`, since deleted); the review worktree stayed clean (`git status --short | wc -l` → `0`).

## Verdict

**PASS — no blockers, no majors.** All five probes CONFIRMED. Two minor findings and two informational notes follow. None of them should block Gate 3.

| # | Probe | Verdict |
|---|---|---|
| 1 | Hole closure + no over-broadening | **CONFIRMED** |
| 2 | Test binds membership; nothing passes vacuously | **CONFIRMED** (minor m1 noted) |
| 3 | Blast radius confined to the two Allowed Files and to classification | **CONFIRMED** |
| 4 | Compatibility: incompatible evidence is never accepted | **CONFIRMED** (builder's framing slightly imprecise, see i1) |
| 5 | Suite 298/298 (base 296) | **CONFIRMED** |

---

## Probe 1 — hole closure (CONFIRMED)

Script `/tmp/cff-h1-probe1.mjs` imports `classifyPath`/`deltaFallbackReason` from the review tip and runs the same script against `git show main:scripts/ci-reuse.mjs`.

```
$ node /tmp/cff-h1-probe1.mjs          # tip e34cc380
POS code test-relevant-change plugins/foreman-line/docs/goals/w4-closeout/charter.md
POS code test-relevant-change plugins/foreman-line/docs/goals/w4-closeout/loop-directive.md
POS code test-relevant-change plugins/foreman-line/docs/goals/pi-model-configuration/charter.md
POS code test-relevant-change plugins/foreman-line/docs/goals/pi-model-configuration/pmc-p1-fallback-contract-2026-09-26.md
POS code test-relevant-change plugins/foreman-line/docs/goals/pi-model-configuration/a54-ratification-2026-09-26.md
NEG ordinary_documentation null plugins/foreman-line/docs/goals/foreman-ops-console/charter.md
NEG ordinary_documentation null plugins/foreman-line/docs/goals/ci-fail-fast/charter.md
NEG ordinary_documentation null plugins/foreman-line/docs/goals/w4-closeout/closure-record-2026-09-26.md
NEG ordinary_documentation null plugins/foreman-line/docs/goals/w4-closeout/plan-review-findings.md
NEG ordinary_documentation null plugins/foreman-line/docs/goals/pi-model-configuration/loop-directive.md
NEG ordinary_documentation null plugins/foreman-line/docs/goals/pi-model-configuration/carryover.md
NEG ordinary_documentation null plugins/foreman-line/docs/goals/pi-model-configuration/pmc-p1-design-compatibility.md
NEG ordinary_documentation null plugins/foreman-line/docs/goals/w4-closeout/charter.md.bak.md
NEG ordinary_documentation null plugins/foreman-line/docs/goals/w4-closeout/sub/charter.md
NEG ordinary_documentation null plugins/foreman-line/docs/goals/W4-closeout/charter.md
--- main (dab6967e):
POS ordinary_documentation null  (all five)   ← the live hole, reproduced
```

I checked ten neighbors (the directive asked for at least five): charters in other goal directories, sibling files in both affected directories, a suffix variant, a nested-path variant, and a case variant. All ten still classify `ordinary_documentation`. The fix does not broaden the ordinary class.

Other structural checks:
- `READER_SET` has 30 entries (25 + 5), is sorted (`JSON.stringify(a)===JSON.stringify([...a].sort())` → `true`), and is frozen (`Object.isFrozen` → `true`).
- The only prefix-form entry is the existing `foreman-kernel/`. Nothing was added in prefix form, so the hard stop is respected.

**Reader measurement re-verified from source.** The five paths are exactly the right set:
- `ops-console/tests/live-goal.test.ts` calls only `scanGoal(config, 'w4-closeout')` and `projectGoal(config, 'w4-closeout', …)`. `scanGoal` (`ops-console/src/scan.ts:191-212`) reads exactly `<slug>/loop-directive.md` and `<slug>/charter.md`. The test never calls `listGoalSlugs`, so no other goal's directory is read.
- `routing-policy/src/host-settings-proposal.ts:104-111` `SRC` lists exactly `charter.md`, `a54-ratification-2026-09-26.md` and `pmc-p1-fallback-contract-2026-09-26.md` among the goal docs. The 4th is `settings-projection.json`, which is not Markdown and therefore already `code`. `host-settings-proposal.test.ts:261` checks these with `existsSync`.
- `legacy-cutover.test.ts:526-534` calls `readFileSync` on `pmc-p1-fallback-contract-2026-09-26.md`.

---

## Probe 2 — test binds membership (CONFIRMED, minor m1)

I mutated a copy of `scripts/` (with `.github`/`plugins` symlinked to the review tree) and ran `node --test scripts/ci-reuse.test.mjs`. The baseline was 147/147.

| Mutation | Result |
|---|---|
| M1: drop `w4-closeout/charter.md` from **production** `READER_SET` | **fail 3**: A3 identity pin, `CFF-H1 readers …`, `CFF-H1 mutate-the-fixture …` |
| M2: drop `pmc-p1-…` from the A3 test-local expected list | **fail 1**: A3 identity pin |
| M3: drop `a54-…` from the new `cffH1Readers` test-local list | **fail 0** (see m1) |
| M4: bypass `inReaderSet` (always `false`) | **fail 8**, including both CFF-H1 tests |
| M5: `inReaderSet` always `true` | **fail 19**, including both CFF-H1 tests (the sibling-ordinary asserts) |
| M6: replace the two w4-closeout exact entries with the prefix `w4-closeout/` | **fail 3**: A3 pin and both CFF-H1 tests (the sibling assert catches over-broadening) |
| M7: add a sixth entry (`pi-model-configuration/loop-directive.md`) | **fail 2**: A3 pin and `CFF-H1 readers …` (sibling assert) |
| M8: exact-match → `startsWith` for entries without a trailing `/` | **fail 0** (see i2) |
| reset | pass 147 / fail 0 |

**Ruling.** The new tests bind production membership:
- M1 shows that removing any entry from the production set fails both new tests.
- The in-test mutate-the-fixture loop, which removes each of the five from a `READER_SET` copy and expects `ordinary_documentation`/`null`, shows that the classifier depends on the list.
- No assertion passes vacuously. M4 and M5 fail the new tests in both directions, and the `READER_SET.includes` check comes paired with a `classifyPath(path)` assertion that does not take a list argument.

**m1 (minor, non-blocking):** the test-local `cffH1Readers` list has no length or identity check. Shortening it (M3) quietly weakens both CFF-H1 tests to four paths without any test failing. The A3 identity pin still fails if the *production* set loses an entry, so the merge gate stays protected. Still, the regression test would lose part of its own coverage without any signal. A one-line `assert.equal(cffH1Readers.length, 5)` would close this. I'm recording it, not fixing it.

---

## Probe 3 — blast radius (CONFIRMED)

```
$ git diff main...HEAD --stat
 scripts/ci-reuse.mjs      |  6 ++++++
 scripts/ci-reuse.test.mjs | 41 +++++++++++++++++++++++++++++++++++++++++
$ git diff main...HEAD -- scripts/ci-reuse.mjs | grep -E '^[+-]' | grep -vE '^\+\+\+|^---'
+ * CFF-H1 (cff-p0-review-triage-2026-10-08.md E1): +5 measured w4-closeout / pi-model-configuration goal-doc readers.
+  '…/pi-model-configuration/a54-ratification-2026-09-26.md',
+  '…/pi-model-configuration/charter.md',
+  '…/pi-model-configuration/pmc-p1-fallback-contract-2026-09-26.md',
+  '…/w4-closeout/charter.md',
+  '…/w4-closeout/loop-directive.md',
```

- Only the two Allowed Files changed. In `ci-reuse.mjs` the change is a comment line plus five array entries, with no logic edits. The test file only adds lines: five entries in the A3 pin list and two new tests. No existing assertion was weakened.
- `grep -rn "READER_SET|classifyPath|deltaFallbackReason|computeTreeClassHashes"` across the repo, excluding `ci-reuse(.test).mjs`, finds no other consumer. The only workflow references are `node scripts/ci-reuse.mjs decide|verify` and the test step.
- Inside `ci-reuse.mjs`, `READER_SET` is read only through `inReaderSet`, which is called from `classifyPath` (:196) and `isNamedCodeShape` (:220). Those feed two places:
  - (a) `deltaFallbackReason` → `evaluateChain` rule 4 (:847)
  - (b) `computeTreeClassHashes` (:387) → rule 5 equivalence
- Neither `decideCore` nor `verifyCore` changed. Their behavior changes only through classification output: these five paths now produce `test-relevant-change` in the delta and contribute to the `code` hash. The change is confined to classification.

---

## Probe 4 — compatibility claim (CONFIRMED)

I read `evaluateChain` (:739-902), `decideCore` (:905-918), `parseEvidenceRecord` (:922-961) and `verifyCore` (:969-1019). Reuse is returned in exactly one place (:884-901), and only after all of these pass:
- rule 4: every delta path classifies `ordinary` (any non-null reason → `failFallback`)
- rule 5: `compareInputHashes(current, source)` returns `null` for code, specifications, workflow, dependency_inputs and merge_context (any mismatch → `failFallback('hash-mismatch:<class>')`)
- rule 6: merge-base equality

`verifyCore` re-derives the decision and re-runs the pinned chain. It then compares the recomputed `input_hashes` against the record being verified (:988). Any mismatch, mismatched pin, or parse/throw → `failFallback`. When there is no sweep source it exits 0, and R1 resolves the effective decision to fallback, so the matrix runs the sweep. No path accepts mismatched evidence.

Empirical demonstration (`/tmp/cff-h1-probe4.mjs`, real git bytes): A = `main`; B = A plus a docs-only edit to `w4-closeout/charter.md`, built as a ref-less commit with plumbing.

```
A dab6967e46924b098abb7e8c7324cfcb85061c3f B f4852410b6d82a383b0f4d263294a7b9e7d0c764
main-classifier   code A==B? true  | delta reason for …/w4-closeout/charter.md => null                  ← hole: reuse admissible
CFF-H1-classifier code A==B? false | delta reason for …/w4-closeout/charter.md => test-relevant-change  ← closed twice (rule 4 and rule 5)
same tree A, code hash main vs CFF-H1 classifier equal? false                                          ← class-hash change, as the builder noted
```

**i1 (informational: builder's framing).** The note says "pre-change reuse evidence becomes incompatible and falls back". It points the right way, but no persisted historical hashes exist to become incompatible. Both `decide` and `verify` recompute *both* heads' class hashes from git bytes with whichever classifier is running. The only cross-run input is the source run's `success` conclusion. In practice:
- the hotfix PR itself falls back, because `scripts/ci-reuse.mjs` is `code` → `test-relevant-change`
- after merge, any head whose delta from a pre-hotfix source head includes `ci-reuse.mjs` also falls back
- the in-run decide→verify pair always uses the same classifier

So historical evidence can never be accepted under different classification semantics. The safety claim holds, and it holds more strongly than the note states.

---

## Probe 5 — suite (CONFIRMED)

```
$ cd /tmp/cff-h1-review && node --test scripts/ci-reuse.test.mjs scripts/foreman-line-ci.test.mjs
ℹ tests 298  ℹ pass 298  ℹ fail 0
$ cd /tmp/cff-h1-base (main @ dab6967e, temporary worktree, since removed) && node --test …same…
ℹ tests 296  ℹ pass 296  ℹ fail 0
```

The +2 are exactly the two new CFF-H1 tests (`ci-reuse.test.mjs` alone: 147 at tip). The A3 pin test was extended in place, not duplicated.

---

## Other notes

- **i2 (informational, pre-existing, not introduced here):** M8 survives the suite. Changing `inReaderSet`'s exact-match branch to `startsWith` fails no test, because no test pins a path that extends an exact entry (e.g. `…/charter.md.bak.md`). That mutation errs in the safe direction (more `code`), and it is classifier logic, which is out of scope for a membership-only hotfix. It's a candidate for a future test-strength sweep, not a CFF-H1 issue.
- **Coverage beyond the measured five:** the ratified scope is the measured five. My source reading of the two named reader packages found no additional goal-`.md` readers in those packages (see Probe 1). I did not re-measure every other package. That remains E2/D7's job.
- **Commit hygiene:** conventional subject. `git log -1 --format='%(trailers)'` is empty, so there are no trailers.
- **Side effects disclosure:** Probe 4 wrote one blob, one tree and one commit (`f4852410…`) into the shared object store using `hash-object -w`/`commit-tree`. No ref points to them, so they are unreachable and will be gc'd. A temporary index file `/tmp/cff-h1-probe4.index` was deleted. No working-tree file was written in any checkout except this findings file.
