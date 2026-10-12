# CFF-P1 Review B findings: pin consumption and hostile input (2026-10-08)

**Reviewer:** `cff_p1_review_b`, Reviewer B of two. I worked independently and did not read Reviewer A's output.
**Directive:** `plugins/foreman-line/docs/kickstarters/foreman-line-review-CFF-P1-B.md`.
**Reviewed tip:** `73f9f6247eb07f78788fa31d09b5858e526e9ed0` (`git rev-parse HEAD` in `/home/cmorgan76/Repos/foreman-line-cff-p1-review-b`, detached).
**`git log --oneline f953ecd3..HEAD`:** one commit, `73f9f624`, the Amendment CFF-P1-A1. It touches only the spec (1 file, +19/−7) and is docs-only, so there is no stop.
**Deliverable range:** `665b03bc..f953ecd3`, on top of parcel start `41b927de`.
**Hard constraints honored:** I wrote only this file. I made no `git add`, commit, or push anywhere and fixed nothing. My throwaway probe worktrees (`/tmp/cffp1b/wt-probe`, `/tmp/cffp1b/wt-pre`) were removed after use. Scratch data is in `/tmp/cffp1b`.

## Step 0: restatement of the seven focus questions

1. **Ordering as a waiver bypass.** Can reordering make one package's captured output, or anything derived from it, reach another package's `evaluateWaiver` call? Or can it otherwise change a waiver verdict?
2. **The D7 pin used to exclude (I lead).** Look at every read of the parsed pin. Can any path, including the A1 union, a partition step, or a skip-optimisation, cause a discovered and assigned package not to run? The test is "ordering never excludes", and it must be proved or refuted.
3. **Early exit and the verdict.** Does the partial artifact fail through the *existing* reconcile codes, with no new lenient branch, so that the verdict is decided only by the all-artifact reconcile?
4. **Raw text in annotations (I lead).** Can any interpolated annotation field carry captured output? Can hostile package, check, or layer text forge an `::error` or `::warning`, or smuggle a property?
5. **The D11 diff source.** Is the D11 export the only diff source, and does every malformed base resolve to one fail-closed signal?
6. **"Deliberate, loud" re-pin (I lead).** Are both loudness states real and reproducible? Do the three new values trace to the named run? Does the field stay loud when discovery grows to 31 packages?
7. **Does D3 conformance bind?** Would each AC7 test fail if its own property were violated, and not just pass green?

## Deterministic tier

```
$ cd /home/cmorgan76/Repos/foreman-line-cff-p1-review-b
$ node --test scripts/foreman-line-ci.test.mjs scripts/ci-reuse.test.mjs
ℹ tests 367  ℹ pass 367  ℹ fail 0  ℹ cancelled 0  ℹ skipped 0
EXIT=0
```

This matches the claimed 367/367.

---

## Q2: Is the D7 pin ever consumed to exclude? (lead). Verdict: REFUTED, with no exclusion path found

**Every read of the parsed pin** at the tip, from `git diff 41b927de HEAD -- scripts/foreman-line-ci.mjs`:

| Site | What it reads | Can it remove a name from execution? |
|---|---|---|
| `loadReadGraph` | raw file, then `JSON.parse` | No. It returns `{doc, reason}`. |
| `validateReadGraph(doc)` | `doc.schema`, `Object.keys(doc)`, `doc.packages`, `doc.projections(.affection_pin)`, `doc.named_variance_edges` | No. It builds `Map<name, path[]>` by concatenation only (`affection.set(name, [...(affection.get(name) ?? []), ...paths])`). There is no delete and no subtraction. |
| `proximatePackages(affection, changed)` | the map | No. It only `add`s to a fresh `Set`. |
| `orderShardPackages(mine, proximate)` | `proximate.has` | No. It returns `[...mine.filter(has), ...mine.filter(!has)]`, which are complementary predicates over the same array. That makes it a partition by construction. |
| `computeShardOrder` | the above | No. It re-asserts `order.length === mine.length && sameSet(order, mine)` and otherwise falls back to `[...mine]`. Every other branch returns `[...mine]`. |
| `runShard` | `ordering.order` (iteration only) | No. `mine` is computed by `assignShards` *before* any pin read. Records are pre-populated for all `names`. The artifact filter is still `mine.includes(p.name)`. |
| `runCli shard` | `pin?.doc ?? null` passed through | No. |

**The A1 union cannot drop a package.** The union only adds to a map whose sole consumer is `proximate.has`, and membership in `mine` never depends on the map. A package absent from `packages`, from `affection_pin`, and from the edges is simply not proximate, and it still runs.

**Hostile-pin probes.** I ran a scratch suite appended to a throwaway copy of the test file. For every pin, the probe asserts that the executed `(package, check)` pairs equal all 12 pairs:

```
REVB valid JSON non-object (number): mode=fallback reason=pin-malformed order=alpha,beta,delta,gamma
REVB valid JSON string: mode=fallback reason=pin-malformed …
REVB packages empty: mode=proximity reason=null order=alpha,beta,delta,gamma
REVB shard pkg absent from packages: mode=proximity … order=alpha,beta,delta,gamma
REVB variance edge undiscovered pkg: mode=proximity … order=beta,alpha,delta,gamma
REVB __proto__ package key: mode=proximity … order=beta,alpha,delta,gamma
REVB windows backslash + case variant: mode=proximity … order=gamma,alpha,beta,delta
REVB duplicate-ish paths: … order=delta,alpha,beta,gamma
REVB all proximate: … order=delta,gamma,alpha,beta
REVB affection_pin only for name absent from packages: … order=gamma,alpha,beta,delta
REVB non-array changed paths (string): mode=fallback reason=changed-paths-unavailable
REVB changed path array with null: mode=fallback reason=proximity-error
ℹ tests 21  ℹ pass 21  ℹ fail 0
```

Every package ran every check in every case.

**A 200 MB pin.** `loadReadGraph` runs inside a try/catch in `runCli`. V8 string-length overflow (`ERR_STRING_TOO_LONG`) or an OOM-free parse failure resolves to `pin-unreadable` or `pin-unparseable`, and then to fallback. I reasoned this from the code and did not materialise a 200 MB file. `proximatePackages` is O(|pin paths| × |changed paths|), so a hostile PR-supplied pin could slow its *own* shard. It cannot exclude anything. The pin is read from the PR's own checkout, so a PR can steer only its own ordering.

**Case and separator normalisation (named suspicion). Verdict: safe direction, documented.** `normalizeProximityPath` applies `\` → `/`, `toLowerCase()`, and strips trailing `/` on *both* sides.
- Case-variant and backslash entries are **claimed to match** (probe: `PLUGINS\Foreman-Line\Gamma\` matched `plugins/foreman-line/gamma/src/x.ts`). This over-approximates. It is wrong in the strict case-sensitive-filesystem sense, but it only *adds* proximity, which D7 permits for a fail-safe consumer.
- The real CFF-P0 pin (`feat/foreman-line-cff-p0` @ `91480ae7`, read with `git show`) has 3,044 paths: 0 with backslashes, 0 absolute, 329 with uppercase. That includes probe artifacts such as `PLUGINS/FOREMAN-LINE/APPROVAL`, which lowercase-equal the real directory entries already present.
- Forms that silently become **never-proximate**, which is the safe direction: `./plugins/…`, `plugins//…`, absolute Windows paths (`D:\a\…\plugins\…`), and the empty string. Probe: `proximate=[]` for each. The diff seam decodes paths as `latin1`, while the pin is UTF-8, so non-ASCII paths also never match. That too is safe.

**The only indirect channel, which is designed and does not affect the verdict.** On a *red* shard, the order decides which assigned packages are reached before the AC5 break. So on a red run, the pin influences which packages end up `skipped`. Every skipped pair is reconciled as `unexpected-skip` and the verdict is already red, so no coverage claim depends on it. This follows from ratified D8 combined with AC1. It is not a defect, but I am naming it so nobody later describes the pin as "never influences execution". The accurate statement is "never influences execution on a run that can be green".

### Finding B-1 (medium; cross-parcel hazard; not a CFF-P1 spec violation): the D11 seam's ordinary-documentation filter discards edges D7 has positively measured

CFF-P0's real pin records `projections.reader_set_delta.newly_discovered_ordinary_reads` with `shrink_required: true`. It lists five paths that tests *read* but that `classifyPath` classifies as `ordinary_documentation`. AC6 mandates that the seam drop ordinary paths, so it drops those five, and the packages that read them lose proximity:

```
$ node /tmp/cffp1b/p1.mjs
validate true null 30
classifyPath plugins/foreman-line/docs/goals/w4-closeout/charter.md ordinary_documentation
classifyPath plugins/foreman-line/docs/goals/pi-model-configuration/charter.md ordinary_documentation
seam {"paths":["…/SPEC-CONVENTION.md","…/STANDING-CONSTRAINTS.md"],…}   <- the two goal docs are gone
direct pin proximity on raw delta paths: [authority-registry, bypass-outage-harness, contract-readers, ops-console, routing-policy, spec-body-compiler]
through seam:                            [authority-registry, bypass-outage-harness, contract-readers, spec-body-compiler]
```

For CFF-P1 the effect is latency only: `ops-console` and `routing-policy` are mis-ordered, never skipped. So this is **not** a blocker here.

It is, however, a proven under-report built into the one shared seam. CFF-P2 consumes D7 *fail-open* with monotone exclusion. If CFF-P2 reuses `changedPathsFromEvent` as-is, an edit to `docs/goals/w4-closeout/charter.md` produces an empty changed set, and `ops-console` would be excluded locally even though its tests read that file. The same misclassification already affects CI-P1 docs-only reuse today.

**Recommendation:** route the `READER_SET` shrink (CFF-P0's `shrink_required`) before CFF-P2 shapes against this seam. Alternatively, have the coordinator rule whether the seam should consult the pin's measured reads before dropping an "ordinary" path.

### Finding B-2 (low–medium; charter-literal dispute, ruling requested): uncovered path or package does not trigger the ordering fallback

The builder raised this as F4 and judged it out of spec. I dispute the "not a trigger" conclusion on a literal read. **Charter D7** (authoritative; the spec may only strengthen it) says *"any uncovered package, path, or environment-gated read fails closed to the full discovery-order sweep (D6)"*. **Exit criterion 6** lists *"an uncovered package/path/read in the D7 pin fails closed"* as a negative control that must be proven.

At the tip:
- A changed path that no package reads (for example `scripts/foreman-line-ci.mjs`), mixed with a covered path, yields `mode=proximity`, and the covered packages go first.
- A shard package absent from `packages` yields `mode=proximity` (probe above), and that package stays in the non-proximate group.

Coverage is unaffected because everything runs. The practical case is a PR changing a *new* package not yet in a stale pin. Its own edits do not move it forward, while pinned neighbours do. That is exactly exit criterion 4's scenario.

**Requested ruling:** in the CFF-P1 context, does "fails closed to the full discovery-order sweep" mean only "everything runs" (already true), or "ascending-name order"? Either way, CFF-P4 will need a named test for this negative control, and none exists in CFF-P1 today.

### Finding B-3 (low): the "exclusion-shaped field anywhere" scan is shallow and has false positives

The amendment says *"any exclusion-shaped field of any name anywhere"*. The scan covers top-level keys, `projections` keys, and edge keys only:

```
nested environments.excludes         true null      (accepted)
packages key excluded                true null      (accepted as a package named "excluded")
affection_pin key not_affected       true null
projections.reader_set_delta.skip    true null
top platform_skips (CFF-P2-ish)      false pin-exclusion-shaped
top negative_controls                false pin-exclusion-shaped
```

None of the accepted cases can exclude, because the consumer never reads those fields. So the literal "anywhere" is not met, but harmlessly.

The false positives (`skip`, `omit`, `negative` as substrings) mean a benign future top-level key would silently disable proximity forever. A D4-style `platform_skips` key is plausible once CFF-P2 lands. The only trace would be the one `shard ordering: ascending-name fallback (pin-exclusion-shaped…)` log line, with no step-summary entry. The failure direction is safe, but it is easy to miss.

### Observation B-4 (informational): broad directory reads make two packages permanently proximate

The real pin contains `authority-registry -> plugins`, `authority-registry -> plugins/foreman-line`, `contract-readers -> plugins`, and `contract-readers -> plugins/foreman-line`, plus `ops-console -> .git` and `authority-registry -> fake`. With directory-prefix matching, any change under `plugins/` makes `authority-registry` and `contract-readers` proximate. Probe: a change to `plugins/other-plugin/README.txt` yields `[authority-registry, contract-readers]`. This is correct over-approximation and latency-neutral for `authority-registry` (alone in its shard after the re-pin). `contract-readers` will always lead shard 3.

---

## Q4: Is the annotation surface free of raw captured text? (lead). Verdict: CONFIRMED for data flow, REFUTED for one completion claim, with one test-binding gap

**Data flow (read).** `buildAnnotation(level, name, check, layer)` is the only constructor. In `runShard` it is called through `annotateCheck` with `(name, check, null)` for waived results and `(name, check, evaluation.layer)` for rejections.
- `name` comes from discovery, `check` from `CHECKS`, and `layer` is one of the fixed string literals in `evaluateWaiver`'s `pack(...)` calls: `kind-gate`, `no-pin`, `malformed-pin`, `marker-missing`, `count-mismatch`, `range`, `set-subset`, `set-supersede`, `equality`.
- `result.output` is never passed. There is therefore **no path for a crafted waiver-rejection layer string**, because the layer is never data. Captured output reaches the log only through `echoCheck` → `sanitizeOutput`, which is unchanged.
- The new CLI log lines (`shard ordering: …`, `shard early exit at …`) carry package names and constant reason codes only, through `sanitizeField`. Each starts with a literal non-`::` prefix.

**Hostile probes** (`node /tmp/cffp1b/p2.mjs`). Each row reports the parse under the runner's v2 grammar (`^::cmd props::msg`):

```
triple    error   cmd error props ["file","title"] nl false ctrl false ::inMsg 2
quad      error   cmd error props ["file","title"] nl false ctrl false ::inMsg 3
crlf      error   … nl false ctrl false ::inMsg 0
nel       error   … nl true  ctrl false ::inMsg 0      (U+0085 / U+2028 pass through)
pct       error   … ::inMsg 0
bidi      error   … ctrl false                          (overrides → '?'; U+200F/U+061C/U+200B pass through)
long      error   len 510                               (caps hold)
nonstring error   …                                     (non-strings → '')
```

There is no forged command, no smuggled property, and no line break the runner splits on. Every field is property-escaped (`%`, `,`, `:`) after `sanitizeField`, and the line always starts with this function's literal `::error file=` or `::warning file=`. The runner's v2 parser requires `::` at the trimmed line start, so `::` in the middle of the message cannot mint a command.

### Finding B-5 (medium; claim disputed and test-binding gap): `sanitizeField` does not break odd runs of colons, so the shipped hostile test does not bind the `:` property escape

- `sanitizeField(':::')` returns `': ::'`, because a single `split('::').join(': :')` pass leaves a `::`. The pre-existing contract ("`::` broken") and the spec's "`::` → `: :`" are false for runs of three or more colons. `sanitizeField` is unchanged by this parcel, so this is a pre-existing defect.
- **The completion record's claim is refuted.** It says: *"In every case the result is one line, has exactly the two literal `::` delimiters"*. For package name `:::error file=x::forged`, the tip emits:
  ```
  ::error file=%3A %3A%3Aerror file=x%3A %3Aforged,title=test::foreman-line : ::error file=x: :forged/test failed (waiver layer: set-subset); …
  ```
  That line has three `::` delimiters. It is safe, because the extra one is mid-message, but the shipped assertion `line.split('::').length - 1 === 2` would **fail on the current code** if `:::` were in its corpus. The corpus contains only even `::` runs.
- **Mutation probe (SC #11).** I removed only the `:`→`%3A` step from `annotationProperty`. The result was `ℹ pass 216 ℹ fail 0` (195 shipped tests plus my 21 REVB tests): **the mutation survives.** Under it, the same input produces `::error file=: ::error file=x,title=test::…`. The runner then truncates properties at the first `::`, the `title` is lost, and attacker text becomes the message. That is property-smuggling. The *current* code is safe only because of the `:` escape, and no test pins that escape.
- **Recommendation:** add `:::` and `::::` inputs to the hostile corpus, change the "exactly two delimiters" assertion to "the property section contains no `::`", and record the `sanitizeField` odd-run defect as a named pre-existing item.

### Finding B-6 (PLAUSIBLE; needs a live CI check): legacy `##[cmd]` workflow-command syntax is not neutralised anywhere

To the best of my knowledge of the Actions runner, `ActionCommand.TryParse` (the v1/legacy parser, prefix `##[`) is tried when the v2 parse fails, and it searches for `##[` **anywhere in the line**. Neither `sanitizeField` nor `sanitizeOutput` touches `##[`.

The annotation lines themselves are safe, because they start with `::` and the v2 parse succeeds first. But the new `shard ordering: proximity (… <package names> …)` and `shard early exit at <pkg>/…` lines, the `Cost-table coverage:` line printed to stdout by `aggregate`, and the pre-existing echo of captured output could all carry `##[error]forged` from a package directory name or from test output. `#` and `[` are legal in Windows filenames.

I could not verify runner behaviour offline, so I mark this PLAUSIBLE. The impact is a forged annotation in one's own PR log, which is low. Recommended disposition: a live CFF-P4 probe, or a coordinator ruling on whether SC31 covers the legacy syntax. This is mostly pre-existing surface; the parcel adds three new emission sites to it.

### Finding B-7 (low): a throwing `annotate` loses the partial artifact

`annotateCheck` runs *before* `earlyExit = …; break`. If the `stdout` sink throws (probe: `REVB annotate-throws: runShard threw = stdout EPIPE`), `runShard` throws. `runCli` then never reaches `writeFile`, so the AC5 "partial artifact is written" guarantee does not hold on that path. The verdict still fails closed through `missing-artifact` (reconcile's existing code). The same applies to the pre-existing `echo`. This is noted, not a blocker.

---

## Q6: Does the re-pin's "deliberate, loud" framing hold up? (lead). Verdict: CONFIRMED (loud = visible, not failing)

**Both loudness states reproduced from the code.** I used my own script (`/tmp/cffp1b/p3.mjs`), with real `discoverPackages`, real `COST_TABLE`, the real `runCli shard 0 4`, and only npm stubbed. The pre-re-pin state ran in a throwaway worktree at `4ed0f503`:

```
$ node p3.mjs /tmp/cffp1b/wt-pre            # 4ed0f503 (pre-re-pin)
discovered 30 COST_TABLE 27
sizes 8/8/7/7 loads 503.4/NaN/109.5/NaN
exit 0 artifact.cost_table_missing ["kernel-import","ops-console","project-scaffold"]
summaryLine: Cost-table coverage: 3 discovered package(s) missing from COST_TABLE (…) - round-robin shard assignment fallback in effect.

$ node p3.mjs <review worktree>              # 73f9f624 (tip)
discovered 30 COST_TABLE 30
sizes 1/1/13/15 loads 1407.8/375.2/202.6/204.0
exit 0 artifact.cost_table_missing []
summaryLine: Cost-table coverage: every discovered package is priced (cost_table_missing: []) - cost-aware shard assignment in effect.
```

These match the completion record byte for byte, including the 1407.8/375.2/202.6/204.0 LPT loads. The summary line is emitted on both the `shard` path (`runCli` :1531) and the `aggregate` fallback path (:1562). On the reuse path no assignment happens, so there is nothing to report.

**The three values trace to run `37768165017`.** `gh run view 37768165017` shows `measure/cff-p0-read-graph`, 4 shards, all green. I downloaded `read-graph-raw-capture-shard-{1,3}` and `read-graph-shard-outcomes-{1,3}` (240 MB). The fingerprint is `node v24.19.0`, and `read-graph-sweep-exit.txt` is `SWEEP_EXIT_CODE=0`. I extracted the builder's own reproduction script verbatim from the record (only the path prefix adjusted) and ran it:

```
{"shard":"1",…,"wall":{…,"project-scaffold":20.5,…}}
{"shard":"3",…,"wall":{…,"kernel-import":18,"ops-console":6.5,…}}
```

All three values (`18.0`, `6.5`, `20.5`) reproduce exactly. The caveat stands as the builder disclosed it: this is one run, under fs/module instrumentation, derived from npm start timestamps rather than the timers the original 27 entries came from. "Measured the same way the existing 27 entries were" (AC3) is therefore true at the level of definition (test+typecheck+lint wall) but not at the level of instrument. This is PLAUSIBLE as a nit and does not block.

**What happens with a 31st package:**

```
31st: cost_table_missing ["zz-new-package"] sizes 8/8/8/7
31st summary: Cost-table coverage: 1 discovered package(s) missing from COST_TABLE (["zz-new-package"]) - round-robin shard assignment fallback in effect.
```

The field and the line stay non-empty and name the package, so D10(c)'s "never silent" holds on a literal read. Note what "loud" means here, though: a JSON field and a step-summary line, with no `::warning`, no failing test, and no red. A 31st package silently-but-visibly flips the live mechanism back to round-robin (8/8/8/7). No shipped test fails on a discovery/table mismatch against the real tree; the golden test pins table *values*, not coverage of discovery. D10(c) does not require a failure, so this is CONFIRMED. The observation is that the guard is advisory.

---

## Q1: Ordering as a waiver bypass (A leads; answered). Verdict: REFUTED

`invoke` builds `output` locally per call (`${stdout}${stderr}`). `evaluateWaiver` receives only that call's `result.output`. `computeShardOrder` takes only `mine`, `changedPaths`, and `readGraph`, and is called before the first `invoke(name, ['run', …])`. No state crosses pairs except the per-package `records` entry.

**My own mutation, independent of the builder's M22.** I added an *order-dependent* leak that prepends the previous pair's output to each package's `test` output. My first attempt indexed `args` wrongly (`args[1]==='run'` inside `invoke`, where the args are `['run', check, …]`) and so was a no-op: 216/216 passed. I am recording that honestly. The corrected mutation (`args[0]==='run' && args[1]==='test'`) gave `ℹ pass 201 ℹ fail 15`, including all of `AC7 fixture sanity` and `D3.1`–`D3.6`. The AC7 tests catch it.

## Q3: Does early exit leave the verdict unchanged? (A leads; answered). Verdict: REFUTED (it does not alter the verdict)

- `git diff 41b927de HEAD -- scripts/foreman-line-ci.mjs` has no hunk inside `reconcile`, `verdict`, `sameSet`, or `EXPECTED_SKIPS` (hunks at :35, :273, :286, :813, :845–948 runShard, :1176 buildSummary, :1251/1262 runCli).
- `break phase2` is reachable only right after `records…checks[check] = 'fail'`. Since `failed` is computed over recorded `fail`/`error`, an early exit always gives `exitCode: 1`.

| Hostile case | Result |
|---|---|
| fail at the last check of the last package | `REVB last: 1 {"package":"gamma","check":"lint"} ["shard-fail:gamma/lint"] {"ok":false,"code":"aggregate-failed"}`. There is no tail, `shard-fail` alone, red. |
| waived, then fail | `REVB waived-then-fail: 1 alpha/test … delta/test ["shard-fail","unexpected-skip"×5]` with `::warning file=alpha…` and `::error file=delta…`. The waived result continued; the fail stopped the loop; red. |
| install (phase 1) failure | `REVB install-fail: 1 installs 4 checks 0 earlyExit null annotations 0 ["unexpected-skip","shard-fail"]`. Phase 1 is untouched, there is no early exit, red. |
| `kind != exit` (signal) | `REVB signal: 1 {"package":"alpha","check":"test"} ["shard-fail","unexpected-skip"]`. Rejected at the kind-gate, early exit, red. |
| `EXPECTED_SKIPS` empty | Any reached-but-skipped tail is `unexpected-skip`. A no-tail early exit still gives `shard-fail`. No path produces a green from a partial artifact. |

**Does the required `test` context reach a terminal state?** Yes. The workflow is unchanged (`git diff 41b927de HEAD -- .github | wc -l` → `0`). It has `strategy.fail-fast: false`, the upload step uses `if: ${{ !cancelled() }}`, and the `test` job has `needs: [gate, sweep]` with `if: ${{ !cancelled() }}`. A non-zero shard therefore neither cancels siblings nor skips `test`. Even on the B-7 path (artifact not written), `test` runs and reconcile emits `missing-artifact`.

**Disputed reading (low):** AC5(b) says an `::error` fires "at the exact point a check is recorded `fail`". `ci` (install) is a check field and is recorded `fail` in phase 1, but no annotation fires there. The builder chose this deliberately because the brief says phase 1 is untouched. I flag it for the coordinator: the install red is not part of the early-red signal surface.

## Q5: Is the D11 seam the only diff source, and does it fail closed? (A leads; answered). Verdict: CONFIRMED

```
$ grep -n "'diff'\|spawnSync('git'\|execSync\|execFileSync" scripts/foreman-line-ci.mjs scripts/ci-reuse.mjs
scripts/ci-reuse.mjs:444:  return spawnSync('git', args, {            (new defaultRepoGit seam)
scripts/ci-reuse.mjs:505:    const diff = gitBytes(git, ['diff', '--name-status', '-z', baseSha, headSha])   (new export)
scripts/ci-reuse.mjs:916:  const diff = gitBytes(git, ['diff', … candidate.headSha, headSha])               (pre-existing verify, ex-:835)
scripts/ci-reuse.mjs:1183: … spawnSync('git' …                                                            (pre-existing)
```

The runner has no git or diff call. `git diff 41b927de HEAD -- scripts/ci-reuse.mjs | grep -c '^-[^-]'` returns `0`, so the change is purely additive.

These extra rows go beyond the shipped 22 (`node /tmp/cffp1b/p5.mjs`):

```
BOM json                      → event-unparseable   gitcalls 0
pull_request_target           → event-class-unsupported
merge_group / workflow_dispatch → event-class-unsupported
base sha number / with "\n"   → base-unresolved
base "--output=/tmp/x"        → base-unresolved (no option injection reaches git)
head sha uppercase            → head-unresolved
event path is a directory     → event-unreadable
before == head                → resolved, diff runs (legitimately "no base change")
```

Every malformed row returns `paths: null` before any git call. I found no row that returns an empty "no changes" set.

## Q7: Does D3 conformance bind? (A leads; answered). Verdict: CONFIRMED, with one caveat

- My corrected order-dependent leak mutation (Q1) fails all seven AC7 tests.
- D3.6's `maxInFlight === 1` holds trivially for a synchronous spawn. The binding part is the hostile async-spawn case, which is real: a Promise result is rejected at the kind-gate and `LATE-OUTPUT` never reaches a record.
- **Caveat:** D3.5's "never read by ordering code" half is a source-slice grep between two comment banners (`// ─── CFF-P1 AC1/AC2` … `// ─── CFF-P1 AC5`). Renaming a banner would weaken it silently. The structural guarantee is actually `computeShardOrder`'s parameter list, which takes no output. This is acceptable but fragile.

## Freeze audit. Verdict: CLEAN (deliverable range), with an integration note

```
$ git diff --stat 41b927de HEAD
 cff-p1-completion-record-2026-10-08.md  | 625 +   (goal-dir record, covered by spec surfaces:)
 cff-p1-stage-f-waiver-disposition.md    | 131 +   (Allowed)
 CFF-P1-…-early-red.md (spec)            |  26 +-  (Amendment A1 only: `git diff 41b927de f953ecd3 -- plugins/foreman-line/docs/specs/ | wc -l` → 0)
 scripts/ci-reuse.mjs                    |  81 +
 scripts/ci-reuse.test.mjs               | 141 +
 scripts/foreman-line-ci.mjs             | 270 +-
 scripts/foreman-line-ci.test.mjs        | 638 +-
```

No byte falls outside the six Allowed Files plus the completion record. There is no `.github/`, no `read-graph.json`, and no `pins/`.

**Integration note for Gate 3.** After `git fetch`, `git merge-base origin/main HEAD` is `4a436603`. `git diff --stat origin/main...HEAD` (22 files) also carries the three *pre-parcel* commits `fcaa4b1a`, `032f8a4a`, and `41b927de`. These are not ancestors of `chore/ci-fail-fast-charter` (`git merge-base --is-ancestor 41b927de chore/ci-fail-fast-charter` → no). They bring copies of CFF-P0's records (`cff-p0-*.md`, `read-graph/measurement-log.md`) and an INDEX/hygiene churn that `origin/main` has since partly superseded (#159/#160). They are not parcel deliverables, but a PR from this branch to `main` will carry them and may conflict with CFF-P0's own landing of the same files. The coordinator should decide the rebase or merge order before Gate 3.

**Spec hash.** The completion record cites `ed40b2c4…`, which is correct at `f953ecd3`. At the tip after A1 the spec is `4d82c952112d59d73b839f277d2a6a6460813b01d6e306ac67398e488d2c6341`. This is expected and not a dispute.

## Completion-record statements I dispute

1. *"In every case the result is one line, has exactly the two literal `::` delimiters"* (AC5(b)). **Refuted** for odd colon runs (B-5). The output is safe, but the claim and its test assertion are false, and the `:` escape is unbound by any test.
2. F4 is described as *"not a fallback trigger"* because the spec's enumerated triggers omit it. **Disputed** against charter D7 and exit criterion 6's literal text (B-2). A ruling is requested.
3. The *"Ordering never excludes"* section is accurate, but it should name the red-run effect: the order decides which assigned packages are skipped after an early exit. This is designed and does not affect the verdict.
4. AC3's *"measured the same way"*. The definition matches, but the instrument differs: one instrumented run, timestamps derived from npm starts. The builder disclosed this, so I note it rather than dispute it.

## Summary table

| Item | Verdict | Severity |
|---|---|---|
| Q1 ordering as waiver bypass | REFUTED | — |
| Q2 pin consumed to exclude | REFUTED | — |
| Q3 early exit alters the verdict | REFUTED | — |
| Q4 raw text or forged command in annotations | CONFIRMED clean data flow; B-5 claim refuted and test gap; B-6 PLAUSIBLE | medium / low |
| Q5 single diff source, fail-closed | CONFIRMED | — |
| Q6 deliberate and loud | CONFIRMED (advisory loudness) | — |
| Q7 D3 suite binds | CONFIRMED (D3.5 grep fragile) | low |
| B-1 seam drops D7-measured ordinary reads | finding (cross-parcel, CFF-P2 hazard) | medium |
| B-2 uncovered path or package does not trigger fallback | PLAUSIBLE, ruling requested | low–medium |
| B-3 shallow exclusion scan, false positives | finding | low |
| B-7 throwing annotate loses partial artifact | finding (fails closed) | low |
| Freeze | CLEAN | — |

**No blocker found.** The fail-safe properties this review exists to attack (no exclusion, no verdict change, no raw output in annotations, one diff source) hold under adversarial input. Before Gate 3, I recommend fixing the B-5 test-binding gap, ruling on B-2, and routing B-1 ahead of CFF-P2 shaping.
