# CFF-P1 Review A findings — verdict integrity and the waiver channel (2026-10-08)

**Role:** Reviewer A (`cff_p1_review_a`). This is one of the two mandated independent adversarial reviews (critical / architecture-risk). I had no contact with Reviewer B.
**Directive:** `plugins/foreman-line/docs/kickstarters/foreman-line-review-CFF-P1-A.md`.
**Reviewed tip:** `73f9f6247eb07f78788fa31d09b5858e526e9ed0` (detached worktree `/home/cmorgan76/Repos/foreman-line-cff-p1-review-a`).
**Model in use:** Opus-class Claude. I am not able to verify the exact model ID the directive's model policy names; the coordinator should confirm it from session metadata.
**Constraints honored:**
- I wrote this file only.
- I made no git add, commit, or push.
- I fixed nothing.
- The review worktree is still clean (`git status --short` gives 0 lines).
- All probe worktrees and scratch files were under `/tmp`, and I removed the probe worktrees afterwards.

## Tip verification

```
$ git rev-parse HEAD
73f9f6247eb07f78788fa31d09b5858e526e9ed0
$ git log --oneline f953ecd3..HEAD
73f9f624 docs(ci-fail-fast): Amendment CFF-P1-A1 — AC2 pinned to the measured read-graph shape, ...
$ git diff --stat f953ecd3..HEAD
 ...F-P1-change-proximity-ordering-and-early-red.md | 26 ++++++++++++++++------   (1 file)
```

The only commit above `f953ecd3` is docs-only and touches only the spec, so the stop-and-report condition did not trigger. The spec hash is `ed40b2c4…` at both `41b927de` and `f953ecd3`, which means the builder did not edit the spec. At HEAD the hash is `4d82c952…`; that change is the coordinator's A1 amendment.

## Step 0: the seven focus questions in my own words

1. **(lead)** Can the new iteration order become a way to waive a failure that should not be waived? Concretely: can one package's captured output reach the waiver evaluation of another package, or change it?
2. Is the read-graph pin ever used, even indirectly, to drop a package from execution, rather than only to sort it?
3. **(lead)** Does stopping a shard early ever change the verdict? This covers three things:
   - the unreached pairs must stay `skipped` and fail through reconcile's existing `unexpected-skip` code;
   - reconcile must have no new lenient branch;
   - the partial artifact must be written to disk before the non-zero exit, so the upload step still finds it.
4. Can a package name, check name, or layer string carry raw output or a forged `::error`/`::warning` into an annotation?
5. **(lead)** Is `changedPathsFromEvent` the only diff source? Does every malformed-base case (no event path, unreadable file, bad JSON, null base, non-hex40, all-zeros) produce the `paths: null` signal? Is there no new `git diff` apart from the new export and the existing verification diff?
6. Does the completion record actually show both loudness states with real command output, rather than claiming them in prose?
7. **(lead)** For each of AC7's six D3 points, does breaking exactly that property make the test fail? It is not enough that the suite passes, or that some unrelated breakage also fails it.

## Deterministic tier and test-count tripwire

```
$ set -o pipefail; node --test scripts/foreman-line-ci.test.mjs scripts/ci-reuse.test.mjs   # at 73f9f624
ℹ tests 367 / pass 367 / fail 0                                                          tip_exit=0
$ (scratch worktree /tmp/cffp1a-base @ 41b927de448386f1afe6af8bb0d309e4acf437df) same command
ℹ tests 296 / pass 296 / fail 0                                                          base_exit=0
```

**Test-name set diff.** I ran each file separately with the spec reporter, stripped timings, sorted the names, and compared them with `comm`.

| Suite | base | tip | removed names | added names |
|---|---|---|---|---|
| foreman-line-ci | 151 | 195 | 1 (`multiple failures are all retained rather than overwritten by later success`, which was renamed) | 45 |
| ci-reuse | 145 | 172 | 0 | 27 |

Net change: +44 + 27 = **+71**. This **CONFIRMS** the record's figures.

**Changes to existing tests.** `git diff 41b927de HEAD -- scripts/foreman-line-ci.test.mjs | grep '^-[^-]'` shows deletions in exactly four existing tests:
- the `${check} failure is recorded…` loop;
- the `${label} during ${phase}…` loop;
- the renamed "multiple failures" test;
- the `R17 … golden` literal.

`scripts/ci-reuse.test.mjs` has 0 deleted lines. I reviewed each justification:
- The first three changes follow from AC5(a) and are needed: a second failure in the same shard can no longer run, so tests asserting that it does are obsolete. They now assert the early-exit shape, including `earlyExit` and the `skipped` tail.
- The golden literal adds three keys, and the 27 prior values are byte-unchanged. **CONFIRMED.**

Minor point: the record notes that the title of `R17: the real table balances the 27-package sweep` is now stale. That test iterates `Object.keys(COST_TABLE)`, not the discovered set. So **no shipped test binds the live discovered set to the cost table.** This is consistent with D10(c), which asks for loudness rather than a gate. The live flip is shown only by command output, which I reproduced below.

---

## Q1 (lead): can ordering become a waiver bypass channel? **CONFIRMED that it cannot, in-process. PLAUSIBLE residual risk out-of-process.**

**Code-path audit at the tip** (`runShard` :1035–1181):
- `invoke()` returns a fresh local `{status, kind, output}` per call. `output` is `${stdout}${stderr}` of that one spawn.
- `evaluateWaiver(name, records.get(name).location, check, result.output, result.kind, waivers)` is called once per failing pair, with only that pair's `result.output`.
- `evaluateWaiver` (:710), `failingTestNames` (:660), `sumFailTotals` (:686) and `countOccurrences` (:641) are pure. They have no module-level state.
- No `/g` regex with `lastIndex` state is shared across calls. The only `/g` regex in the file is :867, in the exclusion-key helper, and it is used with `.replace`.
- `waivers` is the frozen `WAIVED_EXCLUSIONS`.
- No new code reads `.output` outside the original loop body.
- `computeShardOrder` runs once, before the first check `invoke`. Its inputs are `mine`, `changedPaths` and `readGraph` only.
- `reconcile` re-validates each waived record against its own pin, field by field. Its byte-hash is unchanged from base (below).

**Naive-reading probes.** I mutated the code in place in a throwaway `/tmp` worktree, using `/tmp/cffp1a/mut.mjs`, then ran `node --test --test-name-pattern=AC7` and restored the file with `git checkout`.

| Probe | Mutation | AC7 result |
|---|---|---|
| C1 | The previous pair's output is prefixed onto the `evaluateWaiver` input only; echo and hash are untouched | exit=1, 7/7 fail (D3.1 and D3.4 among them) |
| FX7a | Same leak with a run-local `__prev`, fixture unchanged | exit=1, 7/7 fail |
| C1b | Only the previous pair's stderr (no failure lines) leaks into the captured output | exit=1, D3.1 + D3.2 fail |
| FX4′ | **Fixture** simulates cross-package coupling: `alpha/test` loses `PIN-MARKER-B` when `gamma` ran just before it | exit=1, 7/7 fail |

**Caveat on what binds (FX7b).** I removed the fixture's `✖ leaked from …` intruder lines and applied the same leak into `evaluateWaiver`. The result was exit=0, 7/7 pass. So the binding against an evaluation-only leak comes entirely from the intruder lines: they make any leak from a passing pair visible in the verdict. That is the intended design, and it works. But a leak that does not change the verdict, or a leak of phase-1 install output (empty in the fixture), would pass AC7. In this fixture such a leak is not a bypass, because the waiver decision does not change. **Recommendation, not a blocker:** a future change to this loop should keep the intruder lines.

**Residual, PLAUSIBLE and not testable by AC7.** AC7 stubs `spawn`, so it can only exclude channels inside the runner. Real packages run one after another on the same filesystem. D7 itself names couplings that the read graph can see, such as materialized temp-repo reads and generation targets. If package A's test writes a file that package B's test reads, then reordering can change B's real output. With the strict nine-layer pin, such a change could at most flip a pinned waiver to rejected (fail-closed) or the reverse, and only if the output exactly matches the full pinned value.

This risk is not new to CFF-P1. The AC3 re-pin already changes which packages run next to each other: live assignment moves from 8/8/7/7 to 1/1/13/15. And all four waivers are currently dead (AC4). I am naming it so that the record's "D3 preserved by construction" is read as "by construction **inside the runner**". It should not be read as a claim about inter-package environmental coupling.

## Q2: is the D7 pin ever consumed to exclude? **CONFIRMED that it is not**, with the D7 ruling flagged at A-F1

- `validateReadGraph` only ever unions entries into the `affection` Map. Nothing is subtracted.
- `proximatePackages` returns a Set.
- `orderShardPackages` is a stable two-way split of `mine`.
- `computeShardOrder` re-checks the partition (`order.length === mine.length && sameSet(order, mine)`) and falls back if it fails.
- The artifact filter is still `mine.includes(p.name)`. No code splices `mine`.

In my real-artifact probe, a package missing from `packages` was simply treated as non-proximate; it still runs. The charter-text question about uncovered packages and paths is raised separately at A-F1.

## Q3 (lead): does shard-early-exit ever alter the verdict? **CONFIRMED that it does not**

**`reconcile`, `verdict` and other protected regions are byte-identical to base.** I hashed the full declaration of each region at `41b927de` and at the tip with `awk` and `sha256sum`:

```
export function reconcile      base=6fb3a3ee1110d161 tip=6fb3a3ee1110d161 SAME
export function verdict        base=173709a675d79d08 tip=173709a675d79d08 SAME
export const EXPECTED_SKIPS    SAME     export const WAIVED_EXCLUSIONS SAME
export function evaluateWaiver SAME     export function assignShards   SAME
export function sanitizeField  SAME     export function discoverPackages SAME
```

There is no new reconcile branch, lenient or otherwise.

**Forced early exit with real discovery and the real `COST_TABLE`** (`/tmp/cffp1a/q3.mjs`):
- Setup: 4 shards; live sizes 1/1/13/15; `hybrid-routing/typecheck` fails in shard 2; the real CFF-P0 `read-graph.json` is supplied; `kernel-lease` is proximate.

```
shard2 order proximity kernel-lease,approval,contracts,dispatch,foreman-config,hybrid-routing,...
earlyExit {"package":"hybrid-routing","check":"typecheck"} exitCode 1
reconcile ok false codes {"shard-fail":1,"unexpected-skip":22}
verdict {"ok":false,"code":"aggregate-failed"}
counterfactual full-run (tail=pass) codes ["shard-fail"] verdict aggregate-failed
forged all-pass true aggregate-ok
red erased, tail still skipped -> ok false ["unexpected-skip"]
gate-failed dominates gate-failed
```

How to read these results:
- The verdict code with early exit (`aggregate-failed`) is the same as the counterfactual where the whole shard runs.
- Each failure signal is enough on its own. If the red is erased, the `skipped` tail alone still fails the run through the existing `unexpected-skip` code.
- An early exit only fires after a recorded non-waived `fail`. So it can only happen on a run that is already red.
- `exitCode` is still derived from the recorded `fail`/`error` only, so an early exit can never produce 0.
- Reuse evidence (`ci-reuse.mjs:898`) requires the prior run's `conclusion === 'success'`, so a partial artifact can never become reuse evidence.

**The upload-ordering claim holds at the CLI level** (the same script drives `runCli(['shard','2','4',…])` with recording deps). Event order:

```
stdout:::error file=hybrid-routing,title=typecheck::foreman-line hybrid-routing/typecheck failed ...
stdout:shard ordering: ascending-name fallback (changed-paths-unavailable; diff: event-path-absen...
stdout:shard early exit at hybrid-routing/typecheck: ...
write:shard-outcomes.json
summary
return:1
```

On disk at :1528–1540, `writeFile(…shard-outcomes.json…)` comes before `return result.exitCode`. The workflow (unchanged; the `.github/` diff is 0 lines) has these properties:
- the sweep step ends with `exit $LASTEXITCODE`;
- the upload step is `if: ${{ !cancelled() }}`, so it runs after a failed step;
- `strategy.fail-fast: false`, so a red shard never cancels its siblings;
- `test` has `needs: [gate, sweep]` and `if: ${{ !cancelled() }}`, so it still reaches a terminal state.

**Informational, not a defect:** an early exit shortens the failure *list* per shard. Only the first red per shard is reported; later independent reds become `unexpected-skip`. The verdict is unchanged. This is the D8 trade-off that was ratified. CFF-P4's exit evidence should mention it, because a fix-push cycle now shows at most one red per shard.

**Minor UX point:** the `shard ordering: …` log line is printed after phase 2 finishes, so the order is only visible at the end of the job log. This has no verdict effect.

## Q4: is the annotation surface free of raw captured text? **CONFIRMED**

`buildAnnotation(level, name, check, layer)` takes only the package name, the check name and `evaluation.layer`, which is a fixed enum code. `evaluation.evidence` and `result.output` are never passed to it.

I ran hostile inputs through it (`/tmp/cffp1a/q4.mjs`):
- `::error::` inside the name;
- CR/LF plus a forged `::error file=x::`;
- `,title=FORGED`;
- a pre-encoded `%0A`;
- bidi `\u202E`;
- BEL/ESC;
- 500-character values.

Every output was 1 line with exactly 2 `::` delimiters, and no control or bidi characters remained (`clean`). Example: `::error file=a%2Ctitle=FORGED,title=typecheck%250A%3A %3Aerror%3A %3Ax::…`. Neither property smuggling nor a second command was possible.

## Q5 (lead): is the D11 seam the only diff source, and does it fail closed? **CONFIRMED**

**Fail-closed matrix** (`/tmp/cffp1a/q5.mjs`, run directly against `changedPathsFromEvent` with a counting git stub):

```
missing GITHUB_EVENT_PATH          paths:null reason:event-path-absent   gitCalls=0
unreadable file (real fs ENOENT)   paths:null reason:event-unreadable    gitCalls=0
unparseable JSON                   paths:null reason:event-unparseable   gitCalls=0
PR null base / null base.sha       paths:null reason:base-unresolved     gitCalls=0
push null before                   paths:null reason:base-unresolved     gitCalls=0
non-hex40 (39 chars / 'g'*40)      paths:null reason:base-unresolved     gitCalls=0
hex40 + trailing "\n"              paths:null reason:base-unresolved     gitCalls=0
all-zeros push before / PR base    paths:null reason:base-unresolved     gitCalls=0
option-injection base "--output=…" paths:null reason:base-unresolved     gitCalls=0
JSON "null" / env null             paths:null (event-unparseable / event-path-absent)
pull_request_target                paths:null reason:event-class-unsupported
readFile throws non-Error (42)     paths:null reason:event-unreadable
git status null / truncated -z     paths:null reason:diff-error
resolved base, empty diff          paths:[]   (distinct from fail-closed — by spec)
valid push                         paths:["src/x.ts"]  gitCalls=1
```

The function never throws, and git is never called before the base and head are validated. The `HEX40_RE` regex (`/^[0-9a-f]{40}$/`, no `m` flag) rejects a trailing newline.

**Grep for other diff sources:**

```
$ grep -n "'diff'\|git diff\|spawnSync('git'\|execSync\|execFileSync\|'git'" scripts/foreman-line-ci.mjs scripts/ci-reuse.mjs
ci-reuse.mjs:444  spawnSync('git', …)        (new private defaultRepoGit helper)
ci-reuse.mjs:505  ['diff', '--name-status', '-z', baseSha, headSha]   (the new export)
ci-reuse.mjs:916  ['diff', '--name-status', '-z', candidate.headSha, headSha]
ci-reuse.mjs:1183 spawnSync('git', …)        (pre-existing CLI seam)
```

- The runner (`foreman-line-ci.mjs`) has no git or diff calls. It only imports `changedPathsFromEvent`.
- Line :916 is byte-identical to base :835 (`git show 41b927de:scripts/ci-reuse.mjs | sed -n 835p`).
- `ci-reuse.mjs` is purely additive: 0 deleted lines.

**Nit (not a second differ):** `defaultRepoGit` is a second inline `spawnSync('git')` wrapper that duplicates the :1183 seam's shape. It is not a diff engine, but it is a small duplication.

**Notes:**
- Both sides of a rename are decoded as `latin1`, which matches existing ci-reuse practice. For non-ASCII paths this can miss a match against the UTF-8 pin. The effect is on latency only.
- A `pull_request` diff is taken against the merge commit `GITHUB_SHA`. If the base has advanced, this over-reports, which is fail-safe.

## Q6: do the "deliberate, loud" re-pin claims survive a literal read? **CONFIRMED**

I reproduced both states myself with fresh scratch worktrees and the real `runCli`, real discovery, and stubbed spawns (`/tmp/cffp1a/ac3.mjs`):

```
== 41b927de   discovered 30 COST_TABLE 27 missing ["kernel-import","ops-console","project-scaffold"]
              sizes 8/8/7/7 equals round-robin: true
== 4ed0f503   (same) + artifact.cost_table_missing ["kernel-import","ops-console","project-scaffold"]
   summary: Cost-table coverage: 3 discovered package(s) missing from COST_TABLE (...) - round-robin shard assignment fallback in effect.
== e952e43e   discovered 30 COST_TABLE 30 missing []   sizes 1/1/13/15 equals round-robin: false
              loads 1407.8 / 375.2 / 202.6 / 204.0
   artifact.cost_table_missing []
   summary: Cost-table coverage: every discovered package is priced (cost_table_missing: []) - cost-aware shard assignment in effect.
== tip 73f9f624  identical to e952e43e
```

- Both loudness states match the record's command output exactly, byte for byte, in the lines quoted.
- 8/8/7/7 is byte-identical to pure round-robin, which matches CFF-P0's 30/27 measurement.
- The flip to 1/1/13/15 and the loads match the record's table.
- The record states the flip as a deliberate mechanism change, in its own paragraph ("Deliberate mechanism flip (D10(a)), stated plainly").

**Ruling on pinning unscaled values: acceptable, but documented in the wrong place for a future re-measurement.**
- I recomputed the record's calibration from its own table: n=27, median ratio 1.13, min 0.36, max 3.19. **CONFIRMED.**
- In the record, the inflation, the single-run status, and the "uninstrumented multi-run re-measurement is future D10 work" item are all stated: §AC3 calibration plus §Environment gaps.
- At the **pin site** they are not. The `COST_TABLE` doc comment (:279–285) and the golden-test comments (`// CFF-P1 AC3 re-pin (run 37768165017, …)`) give the run ID and point to the record. Neither says that the three values are single-sample figures taken under fs/module instrumentation (`grep -in "instrument\|1\.13\|single" scripts/` returns nothing).
- So a future re-measurer reading only the table would not see the skew unless they followed the pointer. **Recommendation:** add an inline note at the pin before or at Stage F. This is bookkeeping, not a blocker.

**I dispute one record statement:** "The bias is in the conservative direction." Cost entries affect only LPT balance, never coverage or the verdict, so neither direction is "conservative". The impact is also negligible: the three entries total 45 s inside shards of about 200 s, and those shards are dominated by authority-registry and verification. A further caveat: the 0.36–3.19 spread shows that the derivation method itself disagrees with the existing pins by up to about 3×. So "measured the same way the existing 27 entries were" (AC3) holds for the *definition* (test + typecheck + lint wall time) but not for the measurement *conditions*. The record discloses this openly.

## Q7 (lead): does the D3 conformance suite actually bind? **CONFIRMED for all six points, with one qualification (D3.3)**

Each mutation was applied in a throwaway `/tmp` worktree, then the suite was run with `node --test --test-name-pattern=AC7 scripts/foreman-line-ci.test.mjs`, and the file was restored with `git checkout`. "FX" means a fixture mutation; "C" means a code mutation.

| D3 point | Mutation along that dimension | Result |
|---|---|---|
| D3.1 per-package capture | FX1: `delta/lint`'s stderr carries the identity of the previously run package (capture depends on order) | exit=1; **D3.1** and D3.2 fail |
| D3.1 / D3.4 | C1 / FX7a: the previous pair's output is leaked into `evaluateWaiver` | exit=1; D3.1 and D3.4 fail (7/7) |
| D3.2 concatenation | C2: `${stderr}${stdout}` | exit=1; **D3.2** and D3.1 fail |
| D3.2 | C2b: stderr dropped | exit=1; **D3.2**, D3.1 and D3.5 fail |
| D3.2 | FX2: fixture delivers `alpha/test` with its streams swapped | exit=1; **D3.2** and D3.1 fail |
| D3.3 granularity | C3b: batching, where an earlier check's output in the same package is concatenated into one `evaluateWaiver` call | exit=1; **D3.4** fails, **D3.3 does not** |
| D3.3 | C3: `evaluateWaiver` called twice per failing pair (it is pure) | exit=0, all pass (see below) |
| D3.4 parsing | FX4′: alpha's marker drops depending on the predecessor | exit=1; D3.4 and the others fail |
| D3.5 `output_sha256` | FX5: a waiver pin carries `output_sha256` | exit=1; **D3.5** fails |
| D3.5 | C4: order changed inside phase 2, outside the grep slice | exit=1; 6/7 fail, D3.5 included |
| D3.6 interleaving | C5: check-major loop, so packages interleave | exit=1; **D3.6** and sanity fail |

**Qualification on D3.3.**
- D3.3 binds *invoke* granularity, as the builder's M24 shows: a check invoked twice fails it.
- The "at most one waiver evaluation per pair" half of its title is not bound by D3.3 itself:
  - batching (C3b) is caught by D3.4, not D3.3;
  - a duplicate pure evaluation (C3) is invisible to every test.
- Because `evaluateWaiver` is pure, C3 has no effect on the verdict, so this is not a coverage hole. The test title overstates what D3.3 alone proves.

I also checked the fixture's design. All three orders end with `delta`, so the rejected pair is always last. That is necessary, because an earlier rejection would stop the shard early and leave nothing to compare. As a result, the *rejected* pair is never tested at different positions. The *waived* pair (`alpha/test`) is tested at positions 1, 2 and 3. That is acceptable.

## Deep probe: Amendment A1 conformance against the real CFF-P0 artifact

Source: `git show feat/foreman-line-cff-p0:plugins/foreman-line/docs/goals/ci-fail-fast/read-graph/read-graph.json`, branch tip `91480ae72f9c8cf8f9cb5ad2a6b259beffdb44a3`. It was read-only and written only to `/tmp`. Probe script: `/tmp/cffp1a/a1.mjs`.

**Real artifact:**
- `schema` is `foreman-line-ci/read-graph@1`.
- `packages` has 30 entries, each a string array.
- `affection_pin` (28 entries) is a strict subset of `packages`: `affection_pin subset of packages: true`.
- `named_variance_edges` is `[]`.

**Validator result:** `real: true null affection size 30`. A change to `receipts/src/index.ts` puts `bypass-outage-harness, contract-readers, receipts, registration, routing-policy, spec-linter` in the proximate group. This **CONFIRMS** the record's F2.

**Code matches the A1 text for:**
- union of `packages[name]` and `affection_pin[name]`, plus variance edges;
- a `packages` entry that is a string, an object, `[1]`, `[null]`, or `[["x"]]` → `pin-entry-not-positive` → fallback;
- `packages` given as an array → `pin-malformed`;
- top-level `excludes`, `not-affected`, `NotAffectedBy`, and `projections.excluded_packages` → `pin-exclusion-shaped`;
- a variance edge of `{package, paths:[…]}`, a string edge, or an object-typed `named_variance_edges` → `pin-variance-edge-shape` or `pin-malformed`;
- a schema value with a trailing space → `pin-schema-mismatch`.

**A1 nonconformance (PLAUSIBLE; literal-text gap, no practical effect for P1).** A1 says "any exclusion-shaped field of any name **anywhere** … is a malformed pin". The validator scans only:
- top-level keys;
- `projections` keys;
- variance-edge keys.

It does not recurse. In my probe, these were **accepted** (`valid=true`, `order=proximity`):

```
nested reader_set_delta.excludes      valid=true
nested criticality_grading.skip       valid=true
nested environments[0].excludes       valid=true
top-level exempt / ignore / deny / allowlist / removed   valid=true   (stem list is a denylist heuristic)
variance edge {package,path,affects:false}               valid=true   (negation-shaped, ignored; the edge still ADDS)
variance edge {package,path,env}                         valid=true   (extra key — A1 pins a "flat {package,path}" shape)
```

**Effect for CFF-P1:** none. The consumer reads only `packages`, `affection_pin` and the edges' `package`/`path`, and only unions them. An exclusion-shaped field anywhere else cannot be consumed.

**Why it still matters:**
- The A1 text is binding.
- "Of any name" cannot be enforced with a denylist of stems.
- `affects:false` is semantically an exclusion that is accepted silently.

**Coordinator ruling needed.** Two options:
- (a) narrow A1 to "anywhere in the consumed fields, plus any variance-edge key beyond `{package, path}`"; or
- (b) require a recursive scan, or exact-key matching on edges, in a follow-up.

**Cross-parcel note:** A1 says CFF-P0's rework "records the same shape in the artifact's `variance_edge_rule`". At `91480ae7` the `variance_edge_rule` prose does not yet state `{package, path}`. The record's F3 is still open on CFF-P0's side.

**Interaction finding (PLAUSIBLE, latency only, follows the spec).** `projections.reader_set_delta.newly_discovered_ordinary_reads` in the real artifact lists paths that *classify as `ordinary_documentation`* but that tests actually read. Example: `routing-policy` reads `plugins/foreman-line/docs/goals/pi-model-configuration/charter.md`. AC6 tells the seam to drop ordinary paths. So a PR that edits that charter never makes `routing-policy` proximate, even though the pin proves the edge. My direct probe, which passes the path straight to `computeShardOrder` and bypasses the seam, gives `proximate: contract-readers,routing-policy`. Through the seam the path is dropped.

The builder followed the spec as written. The cost is latency only. But it shows that the AC6 drop rule and the D7 measurement disagree, and CFF-P0's findings record that disagreement as a READER_SET coverage gap. That disagreement is relevant to the charter stop condition "the relevance engine's coverage is found incomplete for a package class". It belongs to CFF-P0/CFF-P3, but the coordinator should see it here because CFF-P2 will reuse the same seam fail-open.

## Findings that need a coordinator ruling

**A-F1 (medium; charter-text conformance; latency only for P1). D7's "uncovered → fail closed" is not implemented, and the record's F4 acknowledges this.**

D7 (charter :100) says that "any uncovered package, path, or environment-gated read fails closed to the full discovery-order sweep (D6)". Exit criterion 6 requires a negative control proving that "an uncovered package/path/read in the D7 pin fails closed". The spec's AC2 lists only three fallback triggers: missing pin, malformed pin, and computation error. The implementation matches that narrower list:
- a discovered package with no `packages` entry is treated as non-proximate (`packages missing package (approval deleted) valid=true … order=proximity`);
- a non-ordinary changed path that no package reads leaves the rest of the proximity order in place (record F4).

For a consumer that only orders and never excludes, falling back gives no coverage benefit, because every package still runs. That is why I rate this medium rather than blocking. Still, the spec was required to "only strengthen" the charter, and here it is silently narrower than D7's literal text. The spec's exit-criterion-6 mapping row also claims AC2 covers this control.

**Ruling needed:** either
- (a) record an erratum stating that, for CFF-P1's fail-safe consumer, ordering an uncovered package or path in the non-proximate group satisfies D7; or
- (b) add "uncovered changed path, or uncovered assigned package" as a fallback trigger.

**A-F2 (low).** The A1 "anywhere" and "flat shape" gaps described above.

**A-F3 (low, errata hygiene). Amendment A1's erratum E4 sets `sanitizeOutput` to `:169`, but the function is at `:166` at `fcaa4b1a`, `145da132` and `41b927de`:**

```
for c in fcaa4b1a 145da132 41b927de: sanitizeOutput 166, sanitizeField 140
tip: sanitizeOutput 169, sanitizeField 143
```

`:169` is the *tip* line, after the three-line import was added. Every other citation in that same sentence (for example `sanitizeField :140`) uses the drafting baseline. So E4 mixes two baselines. The builder's F1 had `:166`, which was correct for the cited baseline.

**A-F4 (low).** Record statements I dispute:
- "the bias is in the conservative direction" (Q6): cost has no safety direction;
- "D3 preserved by construction" (Q1): this holds only inside the runner.

**A-F5 (low).** The D3.3 test title overstates what it alone binds (Q7).

**A-F6 (informational).** COST_TABLE pin-site documentation (Q6); the `shard ordering` log line printed after phase 2 (Q3); `defaultRepoGit` duplicating the :1183 spawn wrapper (Q5).

## Overall

| Item | Verdict |
|---|---|
| Q1 waiver bypass via ordering | **CONFIRMED that none exists** inside the runner; out-of-process coupling is PLAUSIBLE residual risk, outside AC7's reach |
| Q2 pin never excludes | **CONFIRMED** (D7 literal-text gap at A-F1) |
| Q3 early exit never alters the verdict | **CONFIRMED** (reconcile and verdict byte-identical; write before return; partial artifact fails through existing codes) |
| Q4 annotations free of raw text | **CONFIRMED** |
| Q5 single diff seam, fail-closed matrix | **CONFIRMED** |
| Q6 loudness shown with real output, flip deliberate | **CONFIRMED** (reproduced independently; "conservative" claim disputed) |
| Q7 D3 suite binds | **CONFIRMED** for all six points (D3.3 qualification) |
| A1 conformance | **CONFIRMED** for the consumed fields; **PLAUSIBLE nonconformance** with the literal "anywhere" and "flat shape" (A-F2) |
| 1/1/13/15 flip | **CONFIRMED** |
| Test-count tripwire 296 → 367, four modified tests | **CONFIRMED** |

I found no hard-stop condition. The waiver input contract is unchanged in shape. Nothing gives a local waiver grant or an early-green path. There is no new reconcile branch, no second differ, and no workflow edit.

**Recommendation:** the verdict-integrity and waiver-channel surface is sound. Before Gate 3, the coordinator should rule on A-F1, the D7 uncovered fail-closed literal versus spec AC2, and on A-F2.

## Commands and scripts (reproducible)

| Path | Purpose |
|---|---|
| `/tmp/cffp1a/q5.mjs` | D11 fail-closed matrix |
| `/tmp/cffp1a/a1.mjs` | A1 real-artifact validation and mutation matrix |
| `/tmp/cffp1a/q3.mjs` | Forced early exit, reconcile/verdict, CLI event order |
| `/tmp/cffp1a/q4.mjs` | Hostile annotation fields |
| `/tmp/cffp1a/ac3.mjs` | Loudness and assignment at `41b927de`, `4ed0f503`, `e952e43e` and the tip |
| `/tmp/cffp1a/mut.mjs`, `run-muts.sh`, `run-fx.sh` | Q7 mutation harness (apply, run AC7, `git checkout` restore) |
| `/tmp/cffp1a/perf.mjs` | Proximity on the real pin: 4,990 pin paths × 5,000 changed paths takes 329 ms, so it is not a timeout risk |
